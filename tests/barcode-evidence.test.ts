import test from 'node:test';
import assert from 'node:assert/strict';

test('a fallback product must return the requested identifier', async () => {
  const { hasExactProductIdentifier } = await import('../server/barcodeEvidence.ts');
  assert.equal(hasExactProductIdentifier('1234567890128', {title:'Game PS4'}), false);
  assert.equal(hasExactProductIdentifier('1234567890128', {ean:'9876543210128'}), false);
  assert.equal(hasExactProductIdentifier('1234567890128', {ean:'1234567890128'}), true);
});

test('two cited URLs without actual barcode evidence do not validate an AI title', async () => {
  const { verifyBarcodeSources } = await import('../server/barcodeEvidence.ts');
  const sources = [{title:'Adventure',url:'https://shop-a.example/game'},{title:'Adventure',url:'https://shop-b.example/game'}];
  const result = await verifyBarcodeSources('1234567890128', 'Adventure', sources, (async () => new Response('<h1>Adventure PS4</h1>')) as typeof fetch);
  assert.equal(result.length, 0);
});

test('independent pages associating the title with the code validate AI evidence', async () => {
  const { verifyBarcodeSources } = await import('../server/barcodeEvidence.ts');
  const sources = [{title:'Adventure',url:'https://shop-a.example/game'},{title:'Adventure',url:'https://shop-b.example/game'}];
  const product = { '@type':'Product', name:'Adventure PS4', gtin13:'1234567890128' };
  const result = await verifyBarcodeSources('1234567890128', 'Adventure', sources, (async () => new Response(`<script type="application/ld+json">${JSON.stringify(product)}</script>`)) as typeof fetch);
  assert.equal(result.length, 2);
});

test('a title in recommendations does not validate another product barcode', async () => {
  const { verifyBarcodeSources } = await import('../server/barcodeEvidence.ts');
  const sources = [{title:'Adventure',url:'https://shop-a.example/game'},{title:'Adventure',url:'https://shop-b.example/game'}];
  const html = '<h1>Other Game PS4</h1><p>EAN 1234567890128</p><aside>You may also like Adventure</aside>';
  assert.equal((await verifyBarcodeSources('1234567890128', 'Adventure', sources, (async () => new Response(html)) as typeof fetch)).length, 0);
});
