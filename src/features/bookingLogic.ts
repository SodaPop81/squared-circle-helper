import type { EventType, TerritoryId, Wrestler } from '../types';

export function qprValue(qpr:string){
 const m=qpr.match(/[A-G]/);
 return m ? (8-(m[0].charCodeAt(0)-64)) : 1;
}

export function alignment(qpr:string){
 if(qpr.includes('Heel')) return 'Heel';
 if(qpr.includes('Face')) return 'Face';
 return 'F/H';
}

export function matchupKey(a:string,b:string){
 return [a,b].sort().join(' vs ');
}

export function isHouseOrRegularTvEvent(eventType:EventType){
 return eventType==='House Show' || eventType==='TV Show';
}

export function isMajorEvent(eventType:EventType){
 return ['Premium TV','Small PPV','Major PPV','Biggest PPV'].includes(eventType);
}

export function isMainEventerByRank(w:Wrestler, rank:number){
 return rank>0 && (rank<=12 || qprValue(w.qpr)>=6);
}

export function isPrelimWrestler(w:Wrestler){
 return qprValue(w.qpr)<=2 || w.rank>=50 || w.pp<=180;
}

export type BookingSuggestionKind = 'feud'|'ranking'|'relation'|'enhancement'|'warning';
export type BookingSuggestion = { title:string; reason:string; a:string; b:string; kind:BookingSuggestionKind };

export function sortByRank(a:Wrestler,b:Wrestler){
 return a.rank-b.rank;
}
