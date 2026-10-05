import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshCollectionQuotes, applyMarketQuote, requestMarketQuote} from '../src/utils/bulkMarketQuotes.ts';
import type {Game, MarketQuote} from '../src/types.ts';
const game=(id:string):Game=>({id,title:'The Simpsons: Hit & Run',console:'PlayStation 2',condition:'complet',status:'completed',addedAt:'2026-10-05',estimatedValue:7});
const quote:MarketQuote={estimatedValue:26.85,currency:'EUR',source:'PriceCharting (PAL)',sourceUrl:'https://www.pricecharting.com/game/pal-playstation-2/the-simpsons-hit-and-run',market:'PAL international',condition:'complet',checkedAt:'2026-10-05',comparisons:[{estimatedValue:49,source:'Voxgaming',sourceUrl:'https://www.voxgaming.fr',checkedAt:'2026-10-05',market:'France',note:'En révision'}]};
test('bulk refresh covers all games and bounds simultaneous consultations',async()=>{
 const games=Array.from({length:8},(_,i)=>game(String(i)));let active=0,max=0;const saved:string[]=[];
 const result=await refreshCollectionQuotes(games,{request:async()=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,2));active--;return quote;},onQuote:(g,q)=>{assert.equal(q.comparisons?.[0].estimatedValue,49);saved.push(g.id);},onProgress:()=>{}});
 assert.equal(saved.length,8);assert.ok(max<=3);assert.equal(result.updated,8);assert.equal(result.processed,8);
});
test('missing or failing quotes preserve existing prices and do not stop other games',async()=>{
 const saved:string[]=[];
 const result=await refreshCollectionQuotes([game('missing'),game('error'),game('ok')],{request:async g=>{if(g.id==='error')throw Error('network');return g.id==='missing'?null:quote;},onQuote:g=>{saved.push(g.id);},onProgress:()=>{}});
 assert.deepEqual(saved,['ok']);assert.equal(result.unchanged,2);assert.equal(result.updated,1);
});
test('digital games do not trigger market requests',async()=>{
 const g={...game('digital'),condition:'dematerialise' as const};let calls=0;
 const result=await refreshCollectionQuotes([g],{request:async()=>{calls++;return quote;},onQuote:()=>{},onProgress:()=>{}});
 assert.equal(calls,0);assert.equal(result.skipped,1);assert.equal(result.processed,1);
});
test('cancellation stops queued games and ignores an in-flight quote',async()=>{
 const controller=new AbortController();let saved=0,calls=0;
 const result=await refreshCollectionQuotes(Array.from({length:8},(_,i)=>game(String(i))),{signal:controller.signal,request:async()=>{calls++;controller.abort();return quote;},onQuote:()=>{saved++;},onProgress:()=>{}});
 assert.equal(saved,0);assert.ok(calls<=3);assert.equal(result.cancelled,true);
});
test('a quote cannot overwrite a manual edit made during consultation',()=>{
 const original=game('1');assert.equal(applyMarketQuote({...original,estimatedValue:50},original,quote),null);
 assert.equal(applyMarketQuote({...original,condition:'loose'},original,quote),null);
 const result=applyMarketQuote({...original,notes:'Edited while searching'},original,quote);
 assert.equal(result?.notes,'Edited while searching');assert.equal(result?.estimatedValue,26.85);assert.equal(result?.marketQuote?.comparisons?.[0].estimatedValue,49);
});

test('the HTTP client refuses indicative values during a market refresh',async()=>{
 const originalFetch=globalThis.fetch;
 try {
  globalThis.fetch=async()=>Response.json({kind:'indicative',estimatedValue:8,currency:'EUR',condition:'complet'});
  assert.equal(await requestMarketQuote(game('1')),null);
  globalThis.fetch=async()=>Response.json({...quote,kind:'observed'});
  assert.equal((await requestMarketQuote(game('1')))?.comparisons?.[0].estimatedValue,49);
  globalThis.fetch=async()=>Response.json({...quote,kind:'observed',condition:'loose'});
  assert.equal(await requestMarketQuote(game('1')),null);
 } finally {globalThis.fetch=originalFetch;}
});
