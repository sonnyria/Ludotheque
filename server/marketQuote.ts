import type {GameCondition, MarketQuote, MarketReference} from '../src/types.js';

const PLATFORMS: Record<string, string> = {
 'Nintendo Switch':'pal-nintendo-switch',
 'Nintendo Wii':'pal-wii', 'Nintendo Wii U':'pal-wii-u',
 'Nintendo GameCube':'pal-gamecube', 'Nintendo 64':'pal-nintendo-64', 'Super Nintendo (SNES)':'pal-super-nintendo',
 'NES':'pal-nes', 'PlayStation 1':'pal-playstation', 'PlayStation 2':'pal-playstation-2',
 'PlayStation 3':'pal-playstation-3', 'PlayStation 4':'pal-playstation-4', 'PlayStation 5':'pal-playstation-5',
 'Xbox One':'pal-xbox-one', 'Xbox 360':'pal-xbox-360', 'Xbox Original':'pal-xbox',
};
function text(html: string): string {
 return html.replace(/<[^>]*>/g,' ').replace(/&(?:#39|apos);/g,"'").replace(/&amp;/g,'&')
 .replace(/&quot;/g,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g,' ').trim();
}
function normalize(title: string): string {
 const result=text(title).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/\s*&\s*/g,' and ').replace(/[^a-z0-9]+/g,' ').trim().replace(/^the /,'');
 return result === 'witcher 3' ? 'witcher 3 wild hunt' : result;
}
export function parsePriceChartingQuote(html: string, url: string, title: string, consoleName: string, condition: GameCondition): MarketQuote | null {
 const platform=PLATFORMS[consoleName];
 if (!platform || condition==='dematerialise') return null;
 const product=html.match(/<h1\b[^>]*id=["']product_name["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1];
 if (!product || !product.includes(`/console/${platform}"`)) return null;
 const productTitle=text(product.replace(/<a\b[\s\S]*?<\/a>/gi,''));
 if (normalize(productTitle)!==normalize(title)) return null;
 let parsedUrl: URL;
 try {parsedUrl=new URL(url);} catch {return null;}
 if(parsedUrl.hostname!=='www.pricecharting.com' || !parsedUrl.pathname.startsWith(`/game/${platform}/`)) return null;
 const id={complet:'complete_price',loose:'used_price',neuf:'new_price',boite_seule:'box_only_price'}[condition];
 const cell=html.match(new RegExp(`<td\\b[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/td>`,'i'))?.[1];
 const amount=cell?.match(/<span\b[^>]*class=["'][^"']*\bprice\b[^"']*["'][^>]*>\s*\$([\d,]+\.\d{2})\s*<\/span>/i)?.[1];
 if (!amount) return null;
 let rate: number;
 try {rate=JSON.parse(html.match(/VGPC\.forex_rates\s*=\s*(\{[^;]*\})\s*;/)?.[1] || '{}').EUR;} catch {return null;}
 const usd=Number(amount.replace(/,/g,''));
 if (!Number.isFinite(rate) || rate<=0 || !Number.isFinite(usd) || usd<=0) return null;
 return {estimatedValue:Math.round(usd*rate*100)/100,currency:'EUR',source:'PriceCharting (PAL)',sourceUrl:url,checkedAt:new Date().toISOString(),market:'PAL international',condition};
}
async function lookupPriceChartingQuote(title: string, consoleName: string, condition: GameCondition, fetcher: typeof fetch=fetch): Promise<MarketQuote|null> {
 const platform=PLATFORMS[consoleName];
 if (!platform || condition==='dematerialise') return null;
 const read=async(url:string)=>{
  const response=await fetcher(url,{signal:AbortSignal.timeout(4000),headers:{'User-Agent':'Mozilla/5.0'}});
  if (!response.ok) throw new Error('Market source unavailable');
  return {html:await response.text(),url:response.url||url};
 };
 try {
  const query=new URLSearchParams({q:`${normalize(title)} ${consoleName}`,type:'videogames'});
  const search=await read(`https://www.pricecharting.com/search-products?${query}`);
  const direct=parsePriceChartingQuote(search.html,search.url,title,consoleName,condition);
  if(direct) return direct;
  for(const match of search.html.matchAll(/<a\b[^>]*href=["'](https:\/\/www\.pricecharting\.com\/game\/[^"']+|\/game\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
   const url=new URL(match[1],'https://www.pricecharting.com');
   if(!url.pathname.startsWith(`/game/${platform}/`) || normalize(match[2])!==normalize(title)) continue;
   const page=await read(url.href);
   return parsePriceChartingQuote(page.html,page.url,title,consoleName,condition);
  }
 } catch { /* A blocked or ambiguous source must never become an invented quote. */ }
 return null;
}

// Verified product links can supplement the PAL quote without asserting identical editions or states.
const FRENCH_REFERENCE_LINKS: Record<string, string> = {
 'PlayStation 2|simpsons hit and run': 'https://www.voxgaming.fr/catalog/ps2/the-simpsons-hit-run-8969.php?ed=22461',
};
export function parseVoxReference(html: string, url: string, title: string, consoleName: string): MarketReference | null {
 if(consoleName !== 'PlayStation 2' || FRENCH_REFERENCE_LINKS[`${consoleName}|${normalize(title)}`] !== url) return null;
 const heading=html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
 if(!heading || normalize(heading.replace(/<small\b[\s\S]*?<\/small>/gi,'')) !== normalize(title)) return null;
 const attestation=html.match(/<span\b[^>]*data-quote-loose=["'][^"']+["'][^>]*>/i)?.[0];
 if(!attestation) return null;
 const attr=(key:string)=>text(attestation.match(new RegExp(`${key}=["']([^"']*)["']`))?.[1] || '');
 if(normalize(attr('data-title')) !== normalize(title) || attr('data-platform') !== 'PS2') return null;
 const amount=Number(attr('data-quote-loose'));
 const displayed=Number(html.match(/<span\b[^>]*class=["']price["'][^>]*>\s*<img\b[^>]*src=["']https:\/\/www\.voxgaming\.fr\/img\/quote\/(\d+(?:\.\d+)?)\.png["']/i)?.[1]);
 if(!Number.isFinite(amount) || amount<=0 || displayed!==amount) return null;
 return {estimatedValue:amount, source:'Voxgaming', sourceUrl:url, checkedAt:new Date().toISOString(), market:'France',
   note:`${attr('data-fiability') || 'Statut non précisé'} · état/édition exacts non confirmés pour la comparaison`};
}
async function lookupFrenchReference(title: string, consoleName: string, condition: GameCondition, fetcher: typeof fetch): Promise<MarketReference|null> {
 const url=FRENCH_REFERENCE_LINKS[`${consoleName}|${normalize(title)}`];
 if(!url || condition !== 'complet') return null;
 try {
   const response=await fetcher(url,{signal:AbortSignal.timeout(4000),headers:{'User-Agent':'Mozilla/5.0'}});
   if(!response.ok) return null;
   return parseVoxReference(await response.text(),url,title,consoleName);
 } catch {return null;}
}
export async function lookupMarketQuote(title: string, consoleName: string, condition: GameCondition, fetcher: typeof fetch=fetch): Promise<MarketQuote|null> {
 const [quote, reference]=await Promise.all([lookupPriceChartingQuote(title,consoleName,condition,fetcher),lookupFrenchReference(title,consoleName,condition,fetcher)]);
 if(!quote) return null;
 return reference ? {...quote, comparisons:[reference]} : quote;
}
