import type { MatchType } from '../types';

export function cardTeamSize(t:MatchType){
 if(t==='tag') return 2;
 if(t==='sixManTag') return 3;
 if(t==='eightManTag' || t==='survivorSeries' || t==='survivorSeries4' || t==='warGames') return 4;
 if(t==='survivorSeries5') return 5;
 return 1;
}

export function isCardTeamType(t:MatchType){
 return ['tag','sixManTag','eightManTag','survivorSeries','survivorSeries4','survivorSeries5','warGames'].includes(t);
}

export function isCardBattleType(t:MatchType){
 return t==='battleRoyal' || t==='royalRumble' || t==='bunkhouseBattleRoyal' || t==='tagBattleRoyal';
}

export function validateUniqueCardParticipants(ids:string[], needed:number){
 if(ids.length<needed) return false;
 return new Set(ids).size===ids.length;
}

export function cardTypeName(t:MatchType){
 const names:Record<MatchType,string>={
  singles:'Singles',
  tag:'Tag Team',
  sixManTag:'6-Man Tag',
  eightManTag:'8-Man Tag',
  battleRoyal:'Battle Royal',
  royalRumble:'Royal Rumble',
  survivorSeries:'Survivor Series 4 vs 4',
  survivorSeries4:'Survivor Series 4 vs 4',
  survivorSeries5:'Survivor Series 5 vs 5',
  tagBattleRoyal:'Tag Team Battle Royal',
  bunkhouseBattleRoyal:'Bunkhouse Battle Royal',
  warGames:'WarGames'
 };
 return names[t] || t;
}
