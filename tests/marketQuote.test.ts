import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePriceChartingQuote, lookupMarketQuote, parseVoxReference} from '../server/marketQuote.ts';
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
 const fetcher=(async(input:any)=>{if(String(input).includes('pricecharting.com')) seen.push(String(input)); return new Response(String(input).includes('search-products')?search:html);}) as typeof fetch;
 assert.equal((await lookupMarketQuote('Witcher 3','Xbox One','complet',fetcher))?.estimatedValue,7.71);
 assert.equal(seen.length,2); assert.equal(seen[1],url);
});

test('Switch quotes require the PAL catalogue, not the US catalogue',()=>{
 const pal=html.replaceAll('pal-xbox-one','pal-nintendo-switch').replace('Witcher 3: Wild Hunt','Mario Kart 8 Deluxe');
 const switchUrl='https://www.pricecharting.com/game/pal-nintendo-switch/mario-kart-8-deluxe';
 assert.equal(parsePriceChartingQuote(pal,switchUrl,'Mario Kart 8 Deluxe','Nintendo Switch','complet')?.estimatedValue,7.71);
 assert.equal(parsePriceChartingQuote(pal.replaceAll('pal-nintendo-switch','nintendo-switch'),switchUrl,'Mario Kart 8 Deluxe','Nintendo Switch','complet'),null);
});

test('ampersand and spelled-out and identify the same Simpsons PS2 game',()=>{
 const ps2=html.replaceAll('pal-xbox-one','pal-playstation-2').replace('Witcher 3: Wild Hunt','The Simpsons Hit and Run');
 const source='https://www.pricecharting.com/game/pal-playstation-2/the-simpsons-hit-and-run';
 assert.equal(parsePriceChartingQuote(ps2,source,'The Simpsons: Hit & Run','PlayStation 2','complet')?.estimatedValue,7.71);
 assert.equal(parsePriceChartingQuote(ps2,source,'The Simpsons: Hit & Run Platinum','PlayStation 2','complet'),null);
});
test('search resolves encoded ampersands without using another edition',async()=>{
 const source='https://www.pricecharting.com/game/pal-playstation-2/the-simpsons-hit-and-run';
 const search=`<a href="${source}">The Simpsons: Hit &amp; Run</a>`;
 const page=html.replaceAll('pal-xbox-one','pal-playstation-2').replace('Witcher 3: Wild Hunt','The Simpsons Hit and Run');
 const fetcher=(async(input:any)=>new Response(String(input).includes('search-products')?search:page)) as typeof fetch;
 assert.equal((await lookupMarketQuote('The Simpsons Hit and Run','PlayStation 2','complet',fetcher))?.estimatedValue,7.71);
});

const voxUrl='https://www.voxgaming.fr/catalog/ps2/the-simpsons-hit-run-8969.php?ed=22461';
const voxHtml=`<h1><small>Prix d'achat &amp; Cote Argus</small><br>The Simpsons: Hit &amp; Run<small> sur PS2</small></h1><span class="price"><img src="https://www.voxgaming.fr/img/quote/49.png"></span><span data-title="The Simpsons: Hit &amp; Run" data-platform="PS2" data-quote-loose="49" data-quote-cib="0" data-fiability="En révision"></span>`;
test('a French reference preserves its review status and does not invent a complete price',()=>{
 const ref=parseVoxReference(voxHtml,voxUrl,'The Simpsons Hit and Run','PlayStation 2');
 assert.equal(ref?.estimatedValue,49);
 assert.match(ref?.note || '',/révision/);
 assert.match(ref?.note || '',/non confirmé/);
 assert.equal(parseVoxReference(voxHtml,voxUrl,'The Simpsons Game','PlayStation 2'),null);
 assert.equal(parseVoxReference(voxHtml,voxUrl,'The Simpsons Hit and Run','Xbox One'),null);
});
test('a French comparison is retained separately from the condition-specific PAL quote',async()=>{
 const source='https://www.pricecharting.com/game/pal-playstation-2/the-simpsons-hit-and-run';
 const ps2=html.replaceAll('pal-xbox-one','pal-playstation-2').replace('Witcher 3: Wild Hunt','The Simpsons Hit and Run');
 const fetcher=(async(input:any)=>new Response(String(input).includes('voxgaming.fr')?voxHtml:String(input).includes('search-products')?`<a href="${source}">The Simpsons Hit and Run</a>`:ps2)) as typeof fetch;
 const q=await lookupMarketQuote('The Simpsons: Hit & Run','PlayStation 2','complet',fetcher);
 assert.equal(q?.estimatedValue,7.71);assert.equal(q?.comparisons?.[0].estimatedValue,49);
});
