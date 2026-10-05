import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

function searchWith(fetcher: typeof fetch) {
  const source = readFileSync(new URL('../server.ts', import.meta.url), 'utf8');
  const start = source.indexOf('async function findOfficialCovers(');
  const code = source.slice(start, source.indexOf('async function findOfficialCover(', start));
  return new Function('fetch', stripTypeScriptTypes(code) + '; return findOfficialCovers;')(fetcher);
}

test('Steam must not substitute a different numbered game', async () => {
  const search = searchWith((async (url: string) => url.includes('storesearch') ? Response.json({items:[{id:100,name:'FIFA 23'}]}) : new Response('',{status:404})) as typeof fetch);
  assert.equal((await search('FIFA 22', 'PC')).bestCover, null);
});

test('an abbreviated scanned title matches the full Steam title of the same numbered game', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('storesearch')) return Response.json({items:[{id:292030,name:'The Witcher 3: Wild Hunt — Remastered'}]});
    if (url.includes('steamstatic.com')) return new Response(new Uint8Array([255,216,255,217]),{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  }) as typeof fetch);
  assert.ok((await search('/ -the Witcher 3','Xbox One')).bestCover);
});

test('a soundtrack is not accepted as the cover of its parent game', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('storesearch')) return Response.json({items:[{id:1239320,name:'The Witcher 3: Wild Hunt — Remastered Soundtrack'}]});
    if (url.includes('steamstatic.com')) return new Response(new Uint8Array([255,216,255,217]),{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  }) as typeof fetch);
  assert.equal((await search('The Witcher 3','Xbox One')).bestCover, null);
});

test('an unnumbered series title is not expanded to a different game', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('storesearch')) return Response.json({items:[{id:100,name:'Resident Evil Village'}]});
    if (url.includes('steamstatic.com')) return new Response(new Uint8Array([255,216,255,217]),{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  }) as typeof fetch);
  assert.equal((await search('Resident Evil','Xbox One')).bestCover, null);
});

test('an unavailable image is not advertised as a found cover', async () => {
  const search = searchWith((async (url: string) => url.includes('storesearch') ? Response.json({items:[{id:100,name:'Adventure'}]}) : new Response('',{status:404})) as typeof fetch);
  assert.equal((await search('Adventure', 'PC')).bestCover, null);
});

test('a matching game with a downloadable Steam image gets a cover', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('storesearch')) return Response.json({items:[{id:100,name:'Adventure II'}]});
    if (url.includes('cdn.akamai.steamstatic.com')) return new Response(new Uint8Array([255,216,255,217]), {headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  }) as typeof fetch);
  const result = await search('Adventure 2', 'PC');
  assert.equal(result.covers.length, 1);
  assert.match(result.bestCover, /cdn.akamai/);
});

test('a valid thumbnail remains usable when the original image refuses download', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('duckduckgo.com/?')) return new Response('vqd="123-45"');
    if (url.includes('duckduckgo.com/i.js')) return Response.json({results:[{image:'https://images.example/full.jpg',thumbnail:'https://images.example/thumb.jpg',title:'Adventure box art'}]});
    if (url.endsWith('thumb.jpg')) return new Response(new Uint8Array([255,216,255,217]),{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:403});
  }) as typeof fetch);
  assert.equal((await search('Adventure','PC')).covers.length, 1);
});

test('dead candidates do not prevent trying the final image source', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('storesearch')) return Response.json({items:[{id:100,name:'Adventure'}]});
    if (url.includes('bing.com/images')) return new Response('murl&quot;:&quot;https://images.example/Adventure-cover.jpg&quot;');
    if (url.endsWith('Adventure-cover.jpg')) return new Response(new Uint8Array([255,216,255,217]),{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  }) as typeof fetch);
  assert.equal((await search('Adventure','PC')).covers[0]?.source, 'Bing');
});

test('eight rejected candidates do not crowd the final source out of validation', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('duckduckgo.com/?')) return new Response('vqd="123-45"');
    if (url.includes('duckduckgo.com/i.js')) return Response.json({results:Array.from({length:8},(_,i)=>({image:`https://images.example/dead-${i}.jpg`,title:'Adventure box art'}))});
    if (url.includes('bing.com/images')) return new Response('murl&quot;:&quot;https://images.example/Adventure-cover.jpg&quot;');
    if (url.endsWith('Adventure-cover.jpg')) return new Response(new Uint8Array([255,216,255,217]),{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  }) as typeof fetch);
  assert.equal((await search('Adventure','PC')).covers[0]?.source, 'Bing');
});

test('an empty image response is not accepted as a cover', async () => {
  const search = searchWith((async (url: string) => {
    if (url.includes('storesearch')) return Response.json({items:[{id:100,name:'Adventure'}]});
    if (url.includes('steamstatic.com')) return new Response('',{headers:{'content-type':'image/jpeg'}});
    return new Response('',{status:404});
  }) as typeof fetch);
  assert.equal((await search('Adventure','PC')).bestCover, null);
});

test('saved proxy URLs bypass cached placeholders while preserving the image address', async () => {
  const { getSafeCoverUrl } = await import('../src/utils/imageUtils.ts');
  const result = new URL(getSafeCoverUrl('/api/covers/proxy?url=https%3A%2F%2Fimages.example%2Ffront.jpg'), 'https://local.invalid');
  assert.equal(result.searchParams.get('v'), '2');
  assert.equal(result.searchParams.get('url'), 'https://images.example/front.jpg');
});

test('the proxy ignores Vercel routing parameters instead of appending them to the image URL', async () => {
  process.env.VERCEL = '1';
  const {default:app} = await import('../api/index.ts');
  const server = app.listen(0,'127.0.0.1');
  await new Promise<void>(r=>server.once('listening',r));
  const realFetch = globalThis.fetch;
  const remote = 'https://images.example/front.jpg?token=abc%2Fdef';
  globalThis.fetch = (async (url: string) => new Response(url === remote ? new Uint8Array([255,216,255,217]) : '', {status:url === remote ? 200 : 404,headers:{'content-type':'image/jpeg'}})) as typeof fetch;
  try {
    const port = (server.address() as {port:number}).port;
    const response = await realFetch(`http://127.0.0.1:${port}/api/covers/proxy?url=${encodeURIComponent(remote)}&path=covers%2Fproxy`);
    assert.match(response.headers.get('content-type') || '', /^image\/jpeg/);
    assert.equal((await response.arrayBuffer()).byteLength, 4);
  } finally {
    globalThis.fetch = realFetch;
    await new Promise<void>(r=>server.close(()=>r()));
  }
});
