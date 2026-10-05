import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Exercise the existing parser with controlled external HTTP responses.
function searchWith(fetcher: typeof fetch) {
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const start = source.indexOf('async function searchBarcodeOnline(');
  const code = source.slice(start, source.indexOf('export interface CoverOption', start));
  return new Function('fetch', 'guessGameGenre', stripTypeScriptTypes(code) + '; return searchBarcodeOnline;')(fetcher, () => 'Action');
}

test('repeated search titles without the requested barcode are not a match', async () => {
  const html = Array(3).fill('<a class="result__a" href="https://shop.example/game">Unrelated Adventure PS4</a>').join('');
  const search = searchWith((async (url: string) => new Response(url.includes('duckduckgo') ? html : '', { status: url.includes('duckduckgo') ? 200 : 404 })) as typeof fetch);
  assert.equal(await search('1234567890128'), null);
});

test('an exact structured identifier does not turn a non-game into a game', async () => {
  const search = searchWith((async (url: string) => new Response(url.includes('upcitemdb') ? JSON.stringify({items:[{ean:'1234567890128',title:'Stainless Steel Mixing Bowl',category:'Kitchen',brand:'KitchenBrand'}]}) : '', {status:url.includes('upcitemdb') ? 200 : 404})) as typeof fetch);
  assert.equal(await search('1234567890128'), null);
});

test('repetitions from a single shop are not independent barcode confirmations', async () => {
  const html = Array(3).fill('<a class="result__a" href="https://shop.example/game">Adventure PS4</a><a class="result__snippet">EAN 1234567890128</a>').join('');
  const search = searchWith((async (url: string) => new Response(url.includes('duckduckgo') ? html : '', {status:url.includes('duckduckgo') ? 200 : 404})) as typeof fetch);
  assert.equal(await search('1234567890128'), null);
});

test('an exact game uses its own platform, not platforms from unrelated results', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('upcitemdb')) return Response.json({items:[{ean:'1234567890128', title:'Star Wars Battlefront II PS5',category:'Video Games',brand:'Electronic Arts'}]});
    if (url.includes('duckduckgo')) return new Response(Array(3).fill('<a class="result__a">Other Game PS4</a>').join(''));
    return new Response('', {status:404});
  }) as typeof fetch);
  const result = await search('1234567890128');
  assert.equal(result.title, 'Star Wars Battlefront II');
  assert.equal(result.console, 'PlayStation 5');
});

test('two independent product listings carrying the exact code identify a game', async () => {
  const html = ['shop-a.example', 'shop-b.example'].map(host => `<a class="result__a" href="https://${host}/game">Adventure PS4</a><a class="result__snippet">EAN 1234567890128</a>`).join('');
  const search = searchWith((async (url: string) => new Response(url.includes('duckduckgo') ? html : '', {status:url.includes('duckduckgo') ? 200 : 404})) as typeof fetch);
  assert.equal((await search('1234567890128')).title, 'Adventure');
});

test('the same shop appearing on Bing and DuckDuckGo counts as one source', async () => {
  const ddg = '<a class="result__a" href="https://shop.example/game">Adventure PS4</a><a class="result__snippet">EAN 1234567890128</a>';
  const bing = '<li class="b_algo"><h2><a href="https://shop.example/game">Adventure PS4</a></h2><p>EAN 1234567890128</p></li>';
  const search = searchWith((async (url: string) => new Response(url.includes('duckduckgo') ? ddg : url.includes('bing.com') ? bing : '', {status:/duckduckgo|bing.com/.test(url) ? 200 : 404})) as typeof fetch);
  assert.equal(await search('1234567890128'), null);
});

test('successful HTML fallback is reported as a deployment error', async () => {
  const { requestBarcodeLookup } = await import('../src/utils/barcodeLookup.ts');
  await assert.rejects(requestBarcodeLookup('1234567890128', {}, (async () => new Response('<html>app</html>', {headers:{'content-type':'text/html'}})) as typeof fetch), /déploiement/);
});

test('malformed JSON contract is not accepted as not-found', async () => {
  const { requestBarcodeLookup } = await import('../src/utils/barcodeLookup.ts');
  await assert.rejects(requestBarcodeLookup('1234567890128', {}, (async () => Response.json({})) as typeof fetch), /non valide/);
});

test('the Vercel entry serves the JSON API without starting the development server', async () => {
  process.env.VERCEL = '1';
  const { default: app } = await import('../api/index.ts');
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address() as { port: number };
    const base = `http://127.0.0.1:${address.port}`;
    const status = await fetch(`${base}/api/gemini/status`);
    assert.equal(status.status, 200);
    assert.equal(typeof (await status.json()).isAvailable, 'boolean');
    const invalid = await fetch(`${base}/api/games/lookup-barcode`, {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(invalid.status, 400);
    assert.match((await invalid.json()).error, /Code-barres/);
    const realFetch = globalThis.fetch;
    // Covers are an external dependency and must not prevent identification.
    globalThis.fetch = (async () => new Response('', {status:404})) as typeof fetch;
    try {
      const known = await realFetch(`${base}/api/games/lookup-barcode`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({barcode:'5035225121617'})});
      assert.equal(known.status, 200);
      const data = await known.json();
      assert.equal(data.found, true);
      assert.equal(data.game.title, 'Star Wars Battlefront II');
      assert.equal(data.game.console, 'Xbox One');
    } finally { globalThis.fetch = realFetch; }
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); }
});

test('HTTP 404 is reported as an unavailable service, not a missing game', async () => {
  const { requestBarcodeLookup } = await import('../src/utils/barcodeLookup.ts');
  await assert.rejects(requestBarcodeLookup('1234567890128', {}, (async () => new Response('NOT_FOUND', {status:404})) as typeof fetch), /indisponible.*404/i);
});

test('a successful JSON response distinguishes not-found from a transport failure', async () => {
  const { requestBarcodeLookup } = await import('../src/utils/barcodeLookup.ts');
  assert.deepEqual(await requestBarcodeLookup('1234567890128', {}, (async () => Response.json({found:false})) as typeof fetch), {found:false});
});
