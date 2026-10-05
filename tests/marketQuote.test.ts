import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePriceChartingQuote, lookupMarketQuote} from '../server/marketQuote.ts';
const url='https://www.pricecharting.com/game/pal-xbox-one/witcher-3-wild-hunt';
const html=`<h1 id="product_name">Witcher 3: Wild Hunt <a href="/console/pal-xbox-one">PAL Xbox One</a></h1><script>VGPC.forex_rates = {"EUR":0.9};</script><td id="used_price"><span class="price js-price">$7.44</span></td><td id="complete_price"><span class="price js-price">$8.57</span></td><td id="new_price"><span class="price js-price">$41.93</span></td><td id="box_only_price"><span class="price js-price">$3.92</span></td>`;
test('a verified PAL quote converts USD using the supplied EUR rate',()=>{
 const q=parsePriceChartingQuote(html,url,'the Witcher 3','Xbox One','complet');
 assert.equal(q?.estimatedValue,7.71); assert.equal(q?.sourceUrl,url); assert.equal(q?.currency,'EUR');
});
test('each condition reads its own observed price',()=>{
 assert.equal(parsePriceChartingQuote(html,url,'Witcher 3','Xbox One','loose')?.estimatedValue,6.7);
 assert.equal(parsePriceChartingQuote(html,url,'Witcher 3','Xbox One','neuf')?.estimatedValue,37.74);
 assert.equal(parsePriceChartingQuote(html,url,'Witcher 3','Xbox One','boite_seule')?.estimatedValue,3.53);
});
test('currency conversion is refused when no EUR rate is present',()=>{
 assert.equal(parsePriceChartingQuote(html.replace('"EUR":0.9','"CAD":1.4'),url,'Witcher 3','Xbox One','complet'),null);
});
test('wrong platform and different editions are refused',()=>{
 assert.equal(parsePriceChartingQuote(html,url,'Witcher 3','PlayStation 4','complet'),null);
 assert.equal(parsePriceChartingQuote(html,url,'Witcher 3 Collector Edition','Xbox One','complet'),null);
 assert.equal(parsePriceChartingQuote(html.replace('Witcher 3: Wild Hunt','Witcher 2: Wild Hunt'),url,'Witcher 3','Xbox One','complet'),null);
});
test('a missing condition-specific price does not use another condition',()=>{
 assert.equal(parsePriceChartingQuote(html.replace('$41.93','-'),url,'Witcher 3','Xbox One','neuf'),null);
});
test('a blocked market source gives no observed quote',async()=>{
 const fetcher=(async()=>new Response('blocked',{status:403})) as typeof fetch;
 assert.equal(await lookupMarketQuote('Witcher 3','Xbox One','complet',fetcher),null);
});
test('market lookup ignores matching titles on other consoles and collectors',async()=>{
 const search=`<a href="https://www.pricecharting.com/game/pal-playstation-4/witcher-3">Witcher 3: Wild Hunt</a><a href="${url}-collector">Witcher 3: Wild Hunt [Collector Edition]</a><a href="${url}">Witcher 3: Wild Hunt</a>`;
 const seen:string[]=[];
 const fetcher=(async(input:any)=>{seen.push(String(input)); return new Response(String(input).includes('search-products')?search:html);}) as typeof fetch;
 assert.equal((await lookupMarketQuote('Witcher 3','Xbox One','complet',fetcher))?.estimatedValue,7.71);
 assert.equal(seen.length,2); assert.equal(seen[1],url);
});

test('Switch quotes require the PAL catalogue, not the US catalogue',()=>{
 const pal=html.replaceAll('pal-xbox-one','pal-nintendo-switch').replace('Witcher 3: Wild Hunt','Mario Kart 8 Deluxe');
 const switchUrl='https://www.pricecharting.com/game/pal-nintendo-switch/mario-kart-8-deluxe';
 assert.equal(parsePriceChartingQuote(pal,switchUrl,'Mario Kart 8 Deluxe','Nintendo Switch','complet')?.estimatedValue,7.71);
 assert.equal(parsePriceChartingQuote(pal.replaceAll('pal-nintendo-switch','nintendo-switch'),switchUrl,'Mario Kart 8 Deluxe','Nintendo Switch','complet'),null);
});
