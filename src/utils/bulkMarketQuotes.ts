import type {Game, MarketQuote} from '../types';

export interface PriceRefreshProgress {
  running: boolean;
  processed: number;
  total: number;
  updated: number;
  unchanged: number;
  skipped: number;
  cancelled: boolean;
}

export function applyMarketQuote(current: Game, snapshot: Game, quote: MarketQuote): Game | null {
  if (current.id !== snapshot.id || current.title !== snapshot.title || current.console !== snapshot.console ||
      current.condition !== snapshot.condition || current.estimatedValue !== snapshot.estimatedValue ||
      current.marketQuote !== snapshot.marketQuote || quote.condition !== current.condition ||
      !Number.isFinite(quote.estimatedValue) || quote.estimatedValue < 0) return null;
  return {...current, estimatedValue:quote.estimatedValue, marketQuote:quote};
}

export async function requestMarketQuote(game: Game, signal?: AbortSignal): Promise<MarketQuote|null> {
  const controller=new AbortController();
  const abort=()=>controller.abort();
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted) controller.abort();
  const timeout=setTimeout(abort,12000);
  try {
    const response=await fetch('/api/games/estimate-price',{method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title:game.title,console:game.console,condition:game.condition}),signal:controller.signal});
    if(!response.ok) return null;
    const data=await response.json();
    if(data.kind!=='observed' || data.currency!=='EUR' || data.condition!==game.condition ||
       !Number.isFinite(data.estimatedValue) || data.estimatedValue<0 || !data.sourceUrl || !data.checkedAt) return null;
    return data;
  } finally {clearTimeout(timeout);signal?.removeEventListener('abort',abort);}
}

export async function refreshCollectionQuotes(games: readonly Game[], options: {
  request?: (game:Game, signal?:AbortSignal)=>Promise<MarketQuote|null>;
  onQuote: (game:Game, quote:MarketQuote)=>boolean|void;
  onProgress: (progress:PriceRefreshProgress)=>void;
  signal?: AbortSignal;
}): Promise<PriceRefreshProgress> {
  const progress:PriceRefreshProgress={running:true,processed:0,total:games.length,updated:0,unchanged:0,skipped:0,cancelled:false};
  const report=()=>options.onProgress({...progress});
  const request=options.request || requestMarketQuote;
  let next=0;
  report();
  const worker=async()=>{
    while(next<games.length && !options.signal?.aborted){
      const game=games[next++];
      if(game.condition==='dematerialise') {progress.skipped++;progress.processed++;report();continue;}
      try {
        const quote=await request(game,options.signal);
        if(options.signal?.aborted) break;
        if(quote && options.onQuote(game,quote)!==false) progress.updated++;
        else progress.unchanged++;
      } catch {if(options.signal?.aborted) break;progress.unchanged++;}
      progress.processed++;report();
    }
  };
  await Promise.all(Array.from({length:Math.min(3,games.length)},worker));
  progress.running=false;progress.cancelled=Boolean(options.signal?.aborted);report();
  return {...progress};
}
