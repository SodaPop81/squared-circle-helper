import type { EventCard, EventType, TerritoryId } from '../types';

type VenueCatalog = Record<string,{name:string; city:string}[]>;

export function createDefaultEventCard(territory:TerritoryId):EventCard{
 return { name:'Saturday Night Card', date:'1987-01-19', venue:'Madison Square Garden', eventType:'TV Show', territory, matches:[], history:[] };
}

export function venueOptionsForTerritory(venueCatalog:VenueCatalog, territory:TerritoryId, currentVenue:string){
 const venues=venueCatalog[territory] || venueCatalog.combined || [];
 const hasCurrent=venues.some(v=>`${v.name} — ${v.city}`===currentVenue || v.name===currentVenue);
 const customCurrent=currentVenue && !hasCurrent ? `<option value="${currentVenue}" selected>${currentVenue}</option>` : '';
 return customCurrent + venues.map(v=>{
  const value=`${v.name} — ${v.city}`;
  const selected=currentVenue===value || currentVenue===v.name ? 'selected' : '';
  return `<option value="${value}" ${selected}>${v.name} — ${v.city}</option>`;
 }).join('');
}

export function eventTypeOptions(selected:EventType){
 const types:EventType[]=['House Show','TV Show','Premium TV','Small PPV','Major PPV','Biggest PPV'];
 return types.map(t=>`<option value="${t}" ${selected===t?'selected':''}>${t}</option>`).join('');
}
