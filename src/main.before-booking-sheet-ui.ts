
import './style.css';
import type { TerritoryId, MatchType, MatchRule, SimMode, MoveLetter, PinMode, Move, Wrestler, Log, NotableEvent, SideState, TeamState, Match, CardMatch, EventType, EventCard, RosterRelations, Feud, MatchHistoryEntry, StoredPoints, TagTeamTemplate, Manager } from './types';
import { venueCatalog, territories, pinCharts, allWrestlers, officialTagTeams, managers } from './data';
import { loadJson, d, pct, cap, stars, moveLimitFromMinutes, fmtTime } from './utils';
import { qprValue, alignment, matchupKey, isHouseOrRegularTvEvent, isMajorEvent, isMainEventerByRank, isPrelimWrestler } from './features/bookingLogic';
import { cardTeamSize, isCardTeamType, isCardBattleType, validateUniqueCardParticipants, cardTypeName } from './features/cardBuilder';
import { createDefaultEventCard, venueOptionsForTerritory } from './features/federation';

const REL_KEY='scRosterRelations_v20';
const HISTORY_KEY='scMatchHistory_v32';
const FEUD_KEY='scFeuds_v20';
const MATCHUP_KEY='scRecentMatchups_v20';
let rosterRelations:RosterRelations = loadJson<RosterRelations>(REL_KEY,{});
let feuds:Feud[] = loadJson<Feud[]>(FEUD_KEY,[]);
let recentMatchups:string[] = loadJson<string[]>(MATCHUP_KEY,[]);
let matchHistory:MatchHistoryEntry[] = loadJson<MatchHistoryEntry[]>(HISTORY_KEY,[]);
function persistMatchHistory(){ localStorage.setItem(HISTORY_KEY, JSON.stringify(matchHistory.slice(0,500))); }
function cleanText(html:string){ return (html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function historyForWrestler(id:string){ return matchHistory.filter(h=>h.participants.includes(id)).slice(0,12); }
function saveMatchHistory(entry:Omit<MatchHistoryEntry,'id'|'date'|'territory'|'eventName'|'eventType'|'venue'> & Partial<Pick<MatchHistoryEntry,'date'|'territory'|'eventName'|'eventType'|'venue'>>){
 const full:MatchHistoryEntry={id:`hist-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, date:entry.date||eventCard.date||'', territory:entry.territory||currentTerritory, eventName:entry.eventName||eventCard.name||'Exhibition', eventType:entry.eventType||eventCard.eventType, venue:entry.venue||eventCard.venue, matchType:entry.matchType, result:entry.result, participants:entry.participants, winnerId:entry.winnerId, rating:entry.rating, notables:entry.notables, eliminations:entry.eliminations, entryOrder:entry.entryOrder};
 matchHistory.unshift(full); matchHistory=matchHistory.slice(0,500); persistMatchHistory(); saveUniverseState();
}
function matchParticipants(m:Match){
 if(m.kind==='tag' && m.tag) return [...m.tag.teamA.members, ...m.tag.teamB.members].map(s=>s.wrestler.id);
 return [m.a.wrestler.id, m.b.wrestler.id];
}
function winnerIdFromMatch(m:Match){ return m.winner ? matchParticipants(m).find(id=>m.winner===wrestlerName(id) || m.winner?.includes(wrestlerName(id))) : undefined; }
function saveMatchHistoryFromMatch(m:Match, resultText:string){
 saveMatchHistory({matchType:`${m.kind==='tag'?'Tag Team':'Singles'}${m.rule&&m.rule!=='Standard'?` · ${m.rule}`:''}`, result:cleanText(resultText), participants:matchParticipants(m), winnerId:winnerIdFromMatch(m), rating:m.rating, notables:(m.notables||[]).map(n=>`${n.category}: ${n.text}`)});
}
function persistRelations(){ localStorage.setItem(REL_KEY, JSON.stringify(rosterRelations)); }
function persistFeuds(){ localStorage.setItem(FEUD_KEY, JSON.stringify(feuds)); }
function persistMatchups(){ localStorage.setItem(MATCHUP_KEY, JSON.stringify(recentMatchups.slice(0,80))); }
function relationFor(id:string){ return rosterRelations[id] || {allies:'', enemies:''}; }
function setRelation(id:string, field:'allies'|'enemies', value:string){ rosterRelations[id]={...relationFor(id), [field]:value}; persistRelations(); saveUniverseState(); }
function recordMatchup(a:string,b:string){ recentMatchups.unshift(matchupKey(a,b)); recentMatchups=recentMatchups.slice(0,80); persistMatchups(); }
function isHouseOrRegularTv(){ return isHouseOrRegularTvEvent(eventCard.eventType); }
function isMajorCard(){ return isMajorEvent(eventCard.eventType); }
function isMainEventer(w:Wrestler){ return isMainEventerByRank(w, wrestlerRank(w,currentTerritory)); }
function isPrelim(w:Wrestler){ return isPrelimWrestler(w); }
function activeFeuds(){ return feuds.filter(f=>f.active!==false); }
function ensureDefaultFeuds(){
 if(feuds.length) return;
 const faces=roster().filter(w=>w.qpr.includes('Face')).sort((a,b)=>a.rank-b.rank).slice(0,4);
 const heels=roster().filter(w=>w.qpr.includes('Heel')).sort((a,b)=>a.rank-b.rank).slice(0,4);
 feuds=faces.map((f,i)=>({id:`seed-${Date.now()}-${i}`,a:f.id,b:heels[i]?.id||'',heat:5+i,note:'Suggested feud seed',active:!!heels[i]})).filter(f=>f.b);
 persistFeuds();
}
function addFeudFromForm(){
 const a=(document.getElementById('feudA') as HTMLSelectElement|null)?.value;
 const b=(document.getElementById('feudB') as HTMLSelectElement|null)?.value;
 const heat=Number((document.getElementById('feudHeat') as HTMLInputElement|null)?.value || 5);
 const note=(document.getElementById('feudNote') as HTMLInputElement|null)?.value || '';
 if(!a || !b || a===b) return;
 feuds.unshift({id:`feud-${Date.now()}`,a,b,heat:cap(heat,1,10),note,active:true}); persistFeuds(); render();
}
function updateFeud(id:string, field:'heat'|'note'|'active', value:string|boolean){
 feuds=feuds.map(f=>f.id===id?{...f,[field]:field==='heat'?cap(Number(value),1,10):value}:f); persistFeuds(); render();
}
function wrestlerName(id:string){ return byId(id)?.name || id; }
function makeSuggestedMatches(){
 const r=roster().sort((a,b)=>a.rank-b.rank);
 const suggestions:{title:string; reason:string; a:string; b:string; kind:'feud'|'ranking'|'relation'|'enhancement'|'warning'}[]=[];
 activeFeuds().sort((a,b)=>b.heat-a.heat).slice(0,4).forEach(f=>{
  if(f.a&&f.b) suggestions.push({title:`${wrestlerName(f.a)} vs ${wrestlerName(f.b)}`,reason:`Active feud · heat ${f.heat}${f.note?` · ${f.note}`:''}`,a:f.a,b:f.b,kind:'feud'});
 });
 const topFaces=r.filter(w=>w.qpr.includes('Face')).slice(0,6);
 const topHeels=r.filter(w=>w.qpr.includes('Heel')).slice(0,6);
 topFaces.slice(0,3).forEach((f,i)=>{ const h=topHeels[i]; if(h) suggestions.push({title:`${f.name} vs ${h.name}`,reason:`Ranking-aware face/heel matchup for ${eventCard.eventType}`,a:f.id,b:h.id,kind:'ranking'}); });
 r.forEach(w=>{
  const rel=relationFor(w.id);
  const enemies=rel.enemies.split(',').map(x=>x.trim()).filter(Boolean).slice(0,2);
  enemies.forEach(enemy=>{
   const match=r.find(x=>x.name.toLowerCase()===enemy.toLowerCase());
   if(match) suggestions.push({title:`${w.name} vs ${match.name}`,reason:'Roster profile enemy relationship',a:w.id,b:match.id,kind:'relation'});
  });
 });
 if(isHouseOrRegularTv()){
  const stars=r.filter(isMainEventer).slice(0,8);
  const prelims=r.filter(isPrelim).slice(-12);
  stars.slice(0,5).forEach((star,i)=>{ const jobber=prelims[i%Math.max(1,prelims.length)]; if(jobber && star.id!==jobber.id) suggestions.push({title:`${star.name} vs ${jobber.name}`,reason:`Enhancement/squash match is valid for ${eventCard.eventType}; feeds a preliminary wrestler to an upper-card act`,a:star.id,b:jobber.id,kind:'enhancement'}); });
 }
 const unique=new Set<string>();
 return suggestions.filter(s=>{ const k=matchupKey(s.a,s.b)+'-'+s.kind; if(unique.has(k)) return false; unique.add(k); return true; }).slice(0,10);
}
function overexposureWarnings(){
 const counts:Record<string,number>={};
 recentMatchups.forEach(k=>counts[k]=(counts[k]||0)+1);
 eventCard.matches.forEach(m=>{ if(m.a&&m.b) { const k=matchupKey(m.a,m.b); counts[k]=(counts[k]||0)+1; }});
 return Object.entries(counts).filter(([,n])=>n>=3).map(([k,n])=>`${k.split(' vs ').map(wrestlerName).join(' vs ')} has appeared ${n} recent/planned times.${isMajorCard()?' Consider protecting the marquee matchup for the big card.':' This is acceptable when used intentionally, especially for TV/house-show loops.'}`);
}
function applySuggestion(a:string,b:string){
 const slot=eventCard.matches.find(m=>!m.a || !m.b) || eventCard.matches[0];
 if(!slot) return;
 slot.type='singles'; slot.a=a; slot.b=b; slot.label=`${wrestlerName(a)} vs ${wrestlerName(b)}`; render();
}




function venueOptions(){
 return venueOptionsForTerritory(venueCatalog, currentTerritory, eventCard.venue);
}


const STORAGE_KEY = 'squaredCircleTerritoryPointsV8';
const storedPoints:StoredPoints = (()=>{ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"wrestlers":{},"teams":{}}'); } catch { return {wrestlers:{},teams:{}}; } })();
allWrestlers.forEach(w=>{ if(typeof storedPoints.wrestlers[w.id]==='number') w.pp=storedPoints.wrestlers[w.id]; });
function persistPoints(){ try { localStorage.setItem(STORAGE_KEY, JSON.stringify(storedPoints)); } catch {} }
function setWrestlerPP(w:Wrestler, pp:number){ w.pp=Math.max(0, Math.round(pp)); storedPoints.wrestlers[w.id]=w.pp; persistPoints(); saveUniverseState(); }


officialTagTeams.forEach(t=>{ if(typeof storedPoints.teams[t.id]==='number') t.rankingPoints=storedPoints.teams[t.id]; });
function setTeamRP(t:TagTeamTemplate, rp:number){ t.rankingPoints=Math.max(0, Math.round(rp)); storedPoints.teams[t.id]=t.rankingPoints; persistPoints(); }

function eligibleManagers(){ const list=managers.filter(m => m.territory==='both' || m.territory===currentTerritory || currentTerritory==='combined'); return [...list.filter(m=>m.id==='none'), ...list.filter(m=>m.id!=='none').sort((a,b)=>a.name.localeCompare(b.name))]; }
function tagTeamAvailable(t:TagTeamTemplate){ return t.territory==='both' || t.territory===currentTerritory || currentTerritory==='combined'; }
function eligibleTagTeams(){
 const availableIds=new Set(roster().map(w=>w.id));
 return officialTagTeams
  .filter(t => tagTeamAvailable(t) && t.members.every(id=>availableIds.has(id)))
  .sort((a,b)=>a.name.localeCompare(b.name));
}
function officialTeamFor(ids:string[]){
 const sorted=[...ids].sort().join('|');
 return officialTagTeams.find(t => tagTeamAvailable(t) && [...t.members].sort().join('|')===sorted) || null;
}
function sideState(w:Wrestler,lvl:number):SideState{ return {wrestler:w,currentPP:levelPP(w,lvl),startPP:w.pp,startLevel:lvl,finishers:0,nearfalls:0,blood:false,controlPenalty:0}; }
function makeTeam(ids:[string,string], lvls:[number,number]):TeamState{
 const tpl=officialTeamFor(ids); const members:[SideState,SideState]=[sideState(byId(ids[0]),lvls[0]), sideState(byId(ids[1]),lvls[1])];
 const rating=tpl?.rating || 'D';
 const breakups = tpl ? (rating==='A'?3:rating==='B'?2:rating==='C'?2:1) : 1;
 const miscueRisk = tpl ? (rating==='A'?3:rating==='B'?5:rating==='C'?7:10) : 12;
 return {name:tpl?.name || `${members[0].wrestler.name} & ${members[1].wrestler.name}`, official:!!tpl, finisher:tpl?.finisher || 'Improvised Double-Team Finish', members, active:0, breakups, hotTagUsed:false, miscueRisk};
}
function syncActive(m:Match){ if(!m.tag) return; m.a=m.tag.teamA.members[m.tag.teamA.active]; m.b=m.tag.teamB.members[m.tag.teamB.active]; }
function teamOf(m:Match, s:SideState){ if(!m.tag) return null; return m.tag.teamA.members.includes(s)?m.tag.teamA:m.tag.teamB.members.includes(s)?m.tag.teamB:null; }
function partnerOf(team:TeamState){ return team.members[team.active===0?1:0]; }
function teamTemplateByName(name:string){ return officialTagTeams.find(t=>t.name===name); }
function tagLabel(team:TeamState){ const tpl=teamTemplateByName(team.name); return `${team.name}${team.official?` · official ${tpl?.rating||''}-rated team`: ' · ad hoc team'}`; }
function maybeTag(m:Match, team:TeamState, reason:string){
 if(!m.tag || m.result) return false;
 const active=team.members[team.active], partner=partnerOf(team);
 const hurt=active.currentPP < active.startPP*.42;
 const partnerFresher=partner.currentPP > active.currentPP + 35;
 const hot=!team.hotTagUsed && hurt && partnerFresher && pct() <= (team.official?42:30);
 const normal=pct() <= (team.official?15:9);
 if(hot || normal){
  if(hot){ team.hotTagUsed=true; partner.controlPenalty+=2; m.drama+=2; addNotable(m,'Hot tag',`${active.wrestler.name} made a dramatic hot tag to ${partner.wrestler.name}.`); addLog(m, `<strong>HOT TAG!</strong> ${active.wrestler.name} dives to the corner and tags ${partner.wrestler.name}. ${partner.wrestler.name} gets +2 control momentum.`, 'tag'); }
  else addLog(m, `<strong>Tag:</strong> ${active.wrestler.name} tags ${partner.wrestler.name} after ${reason}.`, 'tag');
  team.active=team.active===0?1:0; syncActive(m); return true;
 }
 return false;
}
function teamBreakup(m:Match, defender:SideState, count:number){
 const team=teamOf(m, defender); if(!team || count!==3 || team.breakups<=0) return false;
 const chance=team.official?45:28;
 if(pct()<=chance){ team.breakups--; m.drama+=3; const partner=partnerOf(team); addNotable(m,'Pin breakup',`${partner.wrestler.name} saved ${defender.wrestler.name} from a three-count for ${team.name}.`); addLog(m, `<strong>Pin breakup!</strong> ${partner.wrestler.name} storms in to save ${defender.wrestler.name}. Breakups left for ${team.name}: ${team.breakups}.`, 'tag'); return true; }
 return false;
}
function tagFinisherMove(team:TeamState):Move{ return {from:1,to:100,name:team.finisher,bonus:team.official?58:44,letter:team.official?'A':'B',pin:'auto'}; }

function territoryRankedWrestlers(t:TerritoryId){
 return allWrestlers.filter(w=>t==='combined'||w.territory===t).sort((a,b)=>b.pp-a.pp || a.rank-b.rank);
}
function wrestlerRank(w:Wrestler, territory:TerritoryId){ return territoryRankedWrestlers(territory).findIndex(x=>x.id===w.id)+1; }
function territoryRankedTeams(t:TerritoryId){
 return officialTagTeams.filter(tm=>(t==='combined'||tm.territory===t||tm.territory==='both') && typeof tm.rankingPoints==='number').sort((a,b)=>(b.rankingPoints||0)-(a.rankingPoints||0));
}
function teamRank(teamName:string, territory:TerritoryId){ const tm=teamTemplateByName(teamName); if(!tm) return 0; return territoryRankedTeams(territory).findIndex(x=>x.id===tm.id)+1; }
function pointDeltaForWin(territory:TerritoryId, kind:'singles'|'tag', winnerRank:number, loserRank:number, result:string|null){
 if(!winnerRank || !loserRank || winnerRank===loserRank) return {win:0, loss:0, reason:'same or unranked'};
 if(result==='dq' || result==='countout') return {win:10, loss:-10, reason:'count-out/DQ flat rule'};
 if(result!=='pinfall' && result!=='submission') return {win:0, loss:0, reason:'draw/no-decision'};
 const spotsAbove = winnerRank - loserRank;
 const spotsBelow = loserRank - winnerRank;
 if(kind==='tag'){
  if(territory==='wwf1985_90'){
   const win = spotsAbove>=14?15:spotsAbove>=7?10:spotsAbove>=1?5:0;
   const loss = spotsBelow>=21?-25:spotsBelow>=13?-10:spotsBelow>=1?-5:0;
   return {win, loss, reason:'WWF tag RP ranking rule'};
  }
  const win = spotsAbove>=10?15:spotsAbove>=5?10:spotsAbove>=1?5:0;
  const loss = spotsBelow>=15?-25:spotsBelow>=9?-10:spotsBelow>=1?-5:0;
  return {win, loss, reason:'Crockett tag RP ranking rule'};
 }
 if(territory==='wwf1985_90'){
  const win = spotsAbove>=30?25:spotsAbove>=20?20:spotsAbove>=9?15:spotsAbove>=1?10:0;
  const loss = spotsBelow>=30?-20:spotsBelow>=20?-15:spotsBelow>=9?-10:spotsBelow>=1?-5:0;
  return {win, loss, reason:'WWF singles PP ranking rule'};
 }
 const win = spotsAbove>=15?25:spotsAbove>=10?20:spotsAbove>=5?15:spotsAbove>=1?10:0;
 const loss = spotsBelow>=15?-20:spotsBelow>=10?-15:spotsBelow>=5?-10:spotsBelow>=1?-5:0;
 return {win, loss, reason:'Crockett singles PP ranking rule'};
}
function applyOfficialRankingChange(m:Match){
 if(!m.officialMatch || m.pointsApplied || !m.result || m.result==='draw') return '';
 m.pointsApplied=true;
 if(!m.winner) return '';
 if(m.kind==='tag' && m.tag){
  const winTeam = m.winner===m.tag.teamA.name?m.tag.teamA:m.winner===m.tag.teamB.name?m.tag.teamB:null;
  const loseTeam = winTeam ? (winTeam===m.tag.teamA?m.tag.teamB:m.tag.teamA) : null;
  const winTpl = winTeam ? teamTemplateByName(winTeam.name) : null;
  const loseTpl = loseTeam ? teamTemplateByName(loseTeam.name) : null;
  if(!winTpl || !loseTpl || typeof winTpl.rankingPoints!=='number' || typeof loseTpl.rankingPoints!=='number') return 'Official match: no RP change because one or both teams are unranked/ad hoc.';
  const wr=teamRank(winTeam!.name,m.territory), lr=teamRank(loseTeam!.name,m.territory);
  const delta=pointDeltaForWin(m.territory,'tag',wr,lr,m.result);
  if(delta.win===0 && delta.loss===0) return 'Official match: no RP change under the ranking rules.';
  const beforeW=winTpl.rankingPoints||0, beforeL=loseTpl.rankingPoints||0;
  setTeamRP(winTpl,beforeW+delta.win); setTeamRP(loseTpl,beforeL+delta.loss);
  return `Official ranking update: ${winTpl.name} ${beforeW}→${winTpl.rankingPoints} RP (${delta.win>=0?'+':''}${delta.win}); ${loseTpl.name} ${beforeL}→${loseTpl.rankingPoints} RP (${delta.loss}).`;
 }
 const winner = m.winner===m.a.wrestler.name?m.a.wrestler:m.winner===m.b.wrestler.name?m.b.wrestler:null;
 const loser = winner ? (winner.id===m.a.wrestler.id?m.b.wrestler:m.a.wrestler) : null;
 if(!winner || !loser) return '';
 const wr=wrestlerRank(winner,m.territory), lr=wrestlerRank(loser,m.territory);
 const delta=pointDeltaForWin(m.territory,'singles',wr,lr,m.result);
 if(delta.win===0 && delta.loss===0) return 'Official match: no PP change under the ranking rules.';
 const beforeW=winner.pp, beforeL=loser.pp;
 setWrestlerPP(winner,beforeW+delta.win); setWrestlerPP(loser,beforeL+delta.loss);
 return `Official ranking update: ${winner.name} ${beforeW}→${winner.pp} PP (${delta.win>=0?'+':''}${delta.win}); ${loser.name} ${beforeL}→${loser.pp} PP (${delta.loss}).`;
}
function resetStoredPoints(){ localStorage.removeItem(STORAGE_KEY); location.reload(); }

let currentTerritory:TerritoryId = (localStorage.getItem('scSelectedTerritory') as TerritoryId) || 'wwf1985_90';
let currentScreen:'home'|'engine' = (localStorage.getItem('scCurrentScreen') as 'home'|'engine') || 'home';
type AppView = 'dashboard'|'newMatch'|'cardBuilder'|'rosterView'|'rankings'|'feuds';
type SetupType = 'none'|'singles'|'tag'|'sixManTag'|'eightManTag'|'battleRoyal'|'royalRumble'|'survivorSeries'|'survivorSeries4'|'survivorSeries5'|'tagBattleRoyal'|'bunkhouseBattleRoyal'|'warGames';
let currentView:AppView = (localStorage.getItem('scCurrentView') as AppView) || 'dashboard';
let setupType:SetupType = 'none';
let currentMatch:Match|null = null;
let eventCard:EventCard = createDefaultEventCard('wwf1985_90');

const UNIVERSE_SAVE_KEY = 'scPersistentUniverse_v1';
const EVENT_CARD_KEY = 'scEventCard_v1';

type UniverseBackup = {
 version: number;
 savedAt: string;
 currentTerritory: TerritoryId;
 currentScreen: 'home'|'engine';
 currentView: AppView;
 eventCard: EventCard;
 rosterRelations: RosterRelations;
 feuds: Feud[];
 recentMatchups: string[];
 matchHistory: MatchHistoryEntry[];
 storedPoints: typeof storedPoints;
};

function saveEventCard(){
 try { localStorage.setItem(EVENT_CARD_KEY, JSON.stringify(eventCard)); } catch {}
}

function hydrateSavedUniverse(){
 try {
  const savedCard = localStorage.getItem(EVENT_CARD_KEY);
  if(savedCard) eventCard = JSON.parse(savedCard) as EventCard;

  const raw = localStorage.getItem(UNIVERSE_SAVE_KEY);
  if(!raw) return;
  const data = JSON.parse(raw) as Partial<UniverseBackup>;

  if(data.currentTerritory) currentTerritory = data.currentTerritory;
  if(data.currentScreen) currentScreen = data.currentScreen;
  if(data.currentView) currentView = data.currentView;
  if(data.eventCard) eventCard = data.eventCard;
  if(data.rosterRelations) rosterRelations = data.rosterRelations;
  if(data.feuds) feuds = data.feuds;
  if(data.recentMatchups) recentMatchups = data.recentMatchups;
  if(data.matchHistory) matchHistory = data.matchHistory;
  if(data.storedPoints?.wrestlers) {
    storedPoints.wrestlers = data.storedPoints.wrestlers || {};
    storedPoints.teams = data.storedPoints.teams || {};
    allWrestlers.forEach(w=>{ if(typeof storedPoints.wrestlers[w.id]==='number') w.pp=storedPoints.wrestlers[w.id]; });
  }
 } catch(err) {
  console.warn('Could not hydrate saved universe', err);
 }
}

function universeSnapshot(): UniverseBackup {
 return {
  version: 1,
  savedAt: new Date().toISOString(),
  currentTerritory,
  currentScreen,
  currentView,
  eventCard,
  rosterRelations,
  feuds,
  recentMatchups,
  matchHistory,
  storedPoints
 };
}

function saveUniverseState(){
 try {
  saveEventCard();
  localStorage.setItem(UNIVERSE_SAVE_KEY, JSON.stringify(universeSnapshot()));
  localStorage.setItem('scSelectedTerritory', currentTerritory);
  localStorage.setItem('scCurrentScreen', currentScreen);
  localStorage.setItem('scCurrentView', currentView);
  persistMatchHistory();
  persistRelations();
  persistFeuds();
  persistMatchups();
  persistPoints();
 } catch(err) {
  console.warn('Could not save universe state', err);
 }
}

function exportUniverseBackup(){
 saveUniverseState();
 const data = JSON.stringify(universeSnapshot(), null, 2);
 const blob = new Blob([data], {type:'application/json'});
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 const stamp = new Date().toISOString().slice(0,10);
 a.download = `squared-circle-universe-${stamp}.json`;
 document.body.appendChild(a);
 a.click();
 a.remove();
 URL.revokeObjectURL(url);
}

function importUniverseBackup(file: File){
 const reader = new FileReader();
 reader.onload = () => {
  try {
   const data = JSON.parse(String(reader.result)) as Partial<UniverseBackup>;
   if(data.currentTerritory) currentTerritory = data.currentTerritory;
   if(data.currentScreen) currentScreen = data.currentScreen;
   if(data.currentView) currentView = data.currentView;
   if(data.eventCard) eventCard = data.eventCard;
   if(data.rosterRelations) rosterRelations = data.rosterRelations;
   if(data.feuds) feuds = data.feuds;
   if(data.recentMatchups) recentMatchups = data.recentMatchups;
   if(data.matchHistory) matchHistory = data.matchHistory;
   if(data.storedPoints?.wrestlers) {
    storedPoints.wrestlers = data.storedPoints.wrestlers || {};
    storedPoints.teams = data.storedPoints.teams || {};
    allWrestlers.forEach(w=>{ if(typeof storedPoints.wrestlers[w.id]==='number') w.pp=storedPoints.wrestlers[w.id]; });
   }
   saveUniverseState();
   alert('Squared Circle universe backup imported.');
   render();
  } catch(err) {
   alert('Could not import this backup file.');
   console.error(err);
  }
 };
 reader.readAsText(file);
}

function resetUniverseSave(){
 const ok = confirm('Reset all saved Squared Circle universe data on this device? This cannot be undone unless you exported a backup.');
 if(!ok) return;
 [UNIVERSE_SAVE_KEY, EVENT_CARD_KEY, REL_KEY, HISTORY_KEY, FEUD_KEY, MATCHUP_KEY, STORAGE_KEY, 'scSelectedTerritory', 'scCurrentScreen', 'scCurrentView'].forEach(k=>localStorage.removeItem(k));
 location.reload();
}

function renderSavePanel(){
 const savedRaw = localStorage.getItem(UNIVERSE_SAVE_KEY);
 let savedText = 'No universe autosave yet.';
 try {
  if(savedRaw) {
   const data = JSON.parse(savedRaw) as Partial<UniverseBackup>;
   savedText = data.savedAt ? `Last autosave: ${new Date(data.savedAt).toLocaleString()}` : 'Universe autosave found.';
  }
 } catch {}
 return `<div class="card savePanel"><h2>Offline Save / Backup</h2><p>Your universe is saved locally on this iPad/browser using local storage. Use Export Backup before big changes or before clearing Safari data.</p><div class="saveActions"><button class="primary" id="manualSaveUniverse">Save Now</button><button id="exportUniverse">Export Backup</button><label class="importLabel">Import Backup<input id="importUniverseFile" type="file" accept="application/json" hidden></label><button class="danger" id="resetUniverseSave">Reset Saved Data</button></div><p class="tiny">${savedText}</p></div>`;
}

hydrateSavedUniverse();
window.addEventListener('beforeunload', saveUniverseState);
setInterval(saveUniverseState, 15000);


function roster(){ return allWrestlers.filter(w => currentTerritory==='combined' || w.territory===currentTerritory); }
function byId(id:string){ return allWrestlers.find(w=>w.id===id)!; }
function levelPP(w:Wrestler, lvl:number){ const mult = [1,.8,.6,.4,.2,0][lvl] ?? 1; return Math.round(w.pp*mult); }
function defensiveLevel(s:SideState){ if(s.currentPP<=-100) return '-100'; if(s.currentPP<=-50) return '-50'; if(s.currentPP<=0) return '5'; const pct=s.currentPP/s.startPP; if(pct<=.2)return '4'; if(pct<=.4)return '3'; if(pct<=.6)return '2'; if(pct<=.8)return '1'; return '0'; }
function getMove(w:Wrestler){ const r=pct(); return w.moves.find(m=>r>=m.from&&r<=m.to) || w.moves[w.moves.length-1]; }
function addLog(m:Match, html:string, cls=''){ m.logs.unshift({html,cls}); }
function addNotable(m:Match, category:string, text:string){
 if(!m.notables) m.notables=[];
 if(!m.notables.some(n=>n.category===category && n.text===text)) m.notables.push({category,text});
}
function renderNotableEvents(m:Match){
 if(!m.notables || !m.notables.length) return `<div class="notableEvents quiet"><strong>NOTABLE EVENTS:</strong><br>No major chaos or unusual incidents were logged.</div>`;
 const items=m.notables.slice(0,8).map(n=>`<li><span>${n.category}</span>${n.text}</li>`).join('');
 return `<div class="notableEvents"><strong>NOTABLE EVENTS:</strong><ul>${items}</ul></div>`;
}

const matchRules:MatchRule[] = ['Standard','No DQ','Steel Cage','Two out of Three Falls','Survivor Series Elimination','WarGames','Bunkhouse Rules'];
function ruleOptions(selected:MatchRule='Standard'){
 return matchRules.map(r=>`<option value="${r}" ${selected===r?'selected':''}>${r}</option>`).join('');
}
function selectedMatchRule(){
 return ((document.getElementById('matchRule') as HTMLSelectElement | null)?.value as MatchRule) || 'Standard';
}
function selectedSimMode(){
 return ((document.getElementById('simMode') as HTMLSelectElement | null)?.value as SimMode) || 'full';
}

function pickRandomUniqueWrestlers(count:number){
 const pool=[...roster()];
 for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
 return pool.slice(0,count);
}
function setSelectValue(id:string, value:string){
 const el=document.getElementById(id) as HTMLSelectElement | null;
 if(el) el.value=value;
}
function setExhibitionStatus(){ setSelectValue('matchStatus','exhibition'); }
function randomizeSinglesExhibition(){
 const picks=pickRandomUniqueWrestlers(2);
 if(picks.length<2) return;
 setSelectValue('wrestlerA',picks[0].id);
 setSelectValue('wrestlerB',picks[1].id);
 setSelectValue('managerA','none');
 setSelectValue('managerB','none');
 setExhibitionStatus();
}
function randomizeTagExhibition(){
 const picks=pickRandomUniqueWrestlers(4);
 if(picks.length<4) return;
 setSelectValue('tagTeamA','manual');
 setSelectValue('tagTeamB','manual');
 setSelectValue('tagA1',picks[0].id);
 setSelectValue('tagA2',picks[1].id);
 setSelectValue('tagB1',picks[2].id);
 setSelectValue('tagB2',picks[3].id);
 setSelectValue('tagManagerA','none');
 setSelectValue('tagManagerB','none');
 setExhibitionStatus();
}
function randomizeMultiManExhibition(){
 let count = 3;

 if(
  setupType==='eightManTag' ||
  setupType==='warGames' ||
  setupType==='survivorSeries4' ||
  setupType==='survivorSeries'
 ) count = 4;

 if(setupType==='survivorSeries5') count = 5;
 const picks=pickRandomUniqueWrestlers(count*2);
 if(picks.length<count*2) return;
 for(let i=0;i<count;i++) setSelectValue(`multiA${i+1}`,picks[i].id);
 for(let i=0;i<count;i++) setSelectValue(`multiB${i+1}`,picks[count+i].id);
 setExhibitionStatus();
}
function resultMethodFor(winner:Wrestler, loser:Wrestler, rule:MatchRule, kind:'singles'|'tag'){
 const heel=alignment(winner.qpr)==='Heel';
 let r=pct();
 if(rule==='No DQ' || rule==='WarGames' || rule==='Bunkhouse Rules') return r<=72?'pinfall':r<=90?'submission':'countout';
 if(rule==='Steel Cage') return r<=50?'escape':r<=84?'pinfall':'submission';
 if(heel) return r<=12?'dq':r<=20?'countout':r<=62?'cheating':r<=84?'interference':'pinfall';
 return r<=8?'dq':r<=18?'countout':r<=75?'pinfall':'submission';
}

function finishingMoveFor(w:Wrestler, method:string){
 if(method==='submission'){
  const sub = w.moves.slice().reverse().find(m=>/clutch|sleeper|crab|nelson|lock|stretch|submission|figure four|dream/i.test(m.name));
  if(sub) return sub.name;
 }
 const fin = w.moves.slice().reverse().find(m=>m.pin==='auto' || m.letter==='A' || m.letter==='B');
 return fin?.name || w.moves[w.moves.length-1]?.name || 'a finishing move';
}

function quickResultNarrative(winner:string, loser:string, method:string, rule:MatchRule, finishMove?:string){
 if(method==='escape') return `${winner} defeated ${loser} by escaping the cage`;
 if(method==='cheating') return `${winner} defeated ${loser} by pinfall after using illegal leverage`;
 if(method==='interference') return `${winner} defeated ${loser} after outside interference`;
 if(method==='dq') return `${winner} defeated ${loser} by disqualification`;
 if(method==='countout') return `${winner} defeated ${loser} by count-out`;
 if(method==='submission') return `${winner} defeated ${loser} by submission${finishMove?` with ${finishMove}`:''}`;
 return `${winner} defeated ${loser} by pinfall${finishMove?` with ${finishMove}`:''}`;
}
function generateQuickNotables(m:Match, winnerName:string, loserName:string, method:string, rule:MatchRule){
 if(method==='interference') addNotable(m,'Interference',`Outside help directly affected the finish in favor of ${winnerName}.`);
 if(method==='cheating') addNotable(m,'Cheating finish',`${winnerName} stole the fall with illegal leverage while the referee was out of position.`);
 if(method==='dq') addNotable(m,'Disqualification',`The match ended on a referee decision instead of a clean finish.`);
 if(method==='countout') addNotable(m,'Ringside chaos',`${loserName} could not beat the referee's count after the action spilled outside.`);
 if(rule==='No DQ' || rule==='WarGames' || rule==='Bunkhouse Rules') addNotable(m,'No DQ chaos',`The ${rule} rules allowed extra brawling and weapon-style chaos.`);
 if(rule==='Steel Cage') addNotable(m,'Cage drama',`The cage changed the pacing and created a more dramatic finish path.`);
 if(pct()<=18) addNotable(m,'Near fall',`${loserName} survived one major scare before the final finish.`);
 if(pct()<=12) addNotable(m,'Post-match tension',`The finish left enough heat for a possible rematch.`);
}
function quickMatchRating(a:Wrestler,b:Wrestler, upset:boolean, rule:MatchRule, method:string){
 let rating=1.5 + Math.min(1.25, Math.abs(qprValue(a.qpr)-qprValue(b.qpr))*0.15) + (upset?0.55:0);
 if(['Steel Cage','Two out of Three Falls','Survivor Series Elimination','WarGames','Bunkhouse Rules'].includes(rule)) rating+=0.45;
 if(method==='interference'||method==='cheating') rating+=0.2;
 return Math.round(cap(rating,.75,4.75)*4)/4;
}
function runQuickSinglesFromSelections(){
 const a=byId((document.getElementById('wrestlerA') as HTMLSelectElement).value), b=byId((document.getElementById('wrestlerB') as HTMLSelectElement).value);
 const rule=selectedMatchRule(), official=selectedMatchStatus();
 currentMatch = buildQuickSinglesMatch(a,b,rule,official);
 render();
}
function buildQuickSinglesMatch(a:Wrestler,b:Wrestler,rule:MatchRule,official:boolean){
 const av=qprValue(a.qpr)+(a.pp/250), bv=qprValue(b.qpr)+(b.pp/250);
 const chanceA=cap(50 + (av-bv)*7, 8, 92);
 const aWins=pct()<=chanceA;
 const winner=aWins?a:b, loser=aWins?b:a;
 const upset=(winner.pp<loser.pp && Math.abs(winner.pp-loser.pp)>80);
 const method=resultMethodFor(winner,loser,rule,'singles');
 const finishMove=finishingMoveFor(winner, method);
 const resultType = method==='dq'?'dq':method==='countout'?'countout':method==='submission'?'submission':'pinfall';
 const moves=cap(Math.round((d(10)+d(10)+6) * (rule==='Two out of Three Falls'?1.8:rule==='Steel Cage'?1.35:1)), 6, 90);
 const m:Match={kind:'singles',simMode:'quick',rule,territory:currentTerritory,officialMatch:official,pinMode:'standard',timeLimit:30,moveLimit:moveLimitFromMinutes(30),movesUsed:moves,result:resultType,winner:winner.name,logs:[],notables:[],controlSwings:d(8),drama:upset?4:2,goat:false,a:sideState(a,0),b:sideState(b,0)};
 m.rating=quickMatchRating(a,b,upset,rule,method);
 m.lastFinishMove = finishMove;
 generateQuickNotables(m,winner.name,loser.name,method,rule);
 recordMatchup(a.id,b.id);
 const rankingUpdate=applyOfficialRankingChange(m);
 addLog(m, `<strong>QUICK MATCH RESULT:</strong> ${quickResultNarrative(winner.name, loser.name, method, rule, finishMove)}. Time ${fmtTime(moves)}.<br><span class="rating">${stars(m.rating)} ${m.rating.toFixed(2)}★</span>${rankingUpdate?`<br><span class="rankingUpdate">${rankingUpdate}</span>`:''}<br>${renderNotableEvents(m)}`, 'result');
 return m;
}
function runQuickTagFromSelections(){
 const ids:[string,string,string,string]=[
  (document.getElementById('tagA1') as HTMLSelectElement).value, (document.getElementById('tagA2') as HTMLSelectElement).value,
  (document.getElementById('tagB1') as HTMLSelectElement).value, (document.getElementById('tagB2') as HTMLSelectElement).value
 ];
 if(new Set(ids).size<4){ alert('Please choose four different wrestlers for a tag match.'); return; }
 currentMatch = buildQuickTagMatch(ids, selectedMatchRule(), selectedMatchStatus());
 render();
}
function buildQuickTagMatch(ids:[string,string,string,string], rule:MatchRule, official:boolean){
 const teamA=makeTeam([ids[0],ids[1]],[0,0]); const teamB=makeTeam([ids[2],ids[3]],[0,0]);
 const scoreA=teamA.members.reduce((s,x)=>s+qprValue(x.wrestler.qpr)+x.wrestler.pp/300,0)+(teamA.official?1.2:0);
 const scoreB=teamB.members.reduce((s,x)=>s+qprValue(x.wrestler.qpr)+x.wrestler.pp/300,0)+(teamB.official?1.2:0);
 const chanceA=cap(50+(scoreA-scoreB)*5,10,90); const aWins=pct()<=chanceA;
 const winTeam=aWins?teamA:teamB, loseTeam=aWins?teamB:teamA;
 const winner=winTeam.name, loser=loseTeam.name;
 const legalWinner=winTeam.members[d(2)-1].wrestler, legalLoser=loseTeam.members[d(2)-1].wrestler;
 const method=resultMethodFor(legalWinner,legalLoser,rule,'tag');
 const finishMove=winTeam.official ? winTeam.finisher : finishingMoveFor(legalWinner, method);
 const resultType = method==='dq'?'dq':method==='countout'?'countout':method==='submission'?'submission':'pinfall';
 const moves=cap(Math.round((d(10)+d(10)+9) * (rule==='Two out of Three Falls'?1.8:rule==='Steel Cage'?1.35:1)), 8, 95);
 const m:Match={kind:'tag',simMode:'quick',rule,territory:currentTerritory,officialMatch:official,pinMode:'standard',timeLimit:30,moveLimit:moveLimitFromMinutes(30),movesUsed:moves,result:resultType,winner,logs:[],notables:[],controlSwings:d(10),drama:3,goat:false,a:teamA.members[0],b:teamB.members[0],tag:{teamA,teamB}};
 m.rating=quickMatchRating(legalWinner,legalLoser,false,rule,method)+(winTeam.official?0.25:0);
 m.lastFinishMove = finishMove;
 generateQuickNotables(m,winner,loser,method,rule);
 if(winTeam.official && pct()<=45) addNotable(m,'Teamwork',`${winner} used established-team chemistry to control the key stretch.`);
 if(!winTeam.official && pct()<=22) addNotable(m,'Ad hoc chemistry',`${winner} survived a shaky-team moment during the match.`);
 recordMatchup(teamA.name,teamB.name);
 const rankingUpdate=applyOfficialRankingChange(m);
 addLog(m, `<strong>QUICK TAG RESULT:</strong> ${quickResultNarrative(winner, loser, method, rule, finishMove)} when ${legalWinner.name} beat ${legalLoser.name}. Time ${fmtTime(moves)}.<br><span class="rating">${stars(m.rating||2)} ${(m.rating||2).toFixed(2)}★</span>${rankingUpdate?`<br><span class="rankingUpdate">${rankingUpdate}</span>`:''}<br>${renderNotableEvents(m)}`, 'result');
 return m;
}
function rollPin(m:Match, attacker:SideState, defender:SideState, move:Move, reason:string){
 const letter = move.letter || 'D'; const lev = defensiveLevel(defender); const need = pinCharts[m.pinMode][letter][lev]; const rolls:[number,number,number]=[pct(),pct(),pct()];
 let count = rolls[0]>=need[0] ? 1 : 0; if(count&&rolls[1]>=need[1]) count=2; if(count===2 && rolls[2]>=need[2]) count=3;
 const near = count===2 || (count===1 && rolls[1] > Math.max(1,need[1]-10)); if(near){ attacker.nearfalls++; m.drama+=2; }
 m.movesUsed++;
 addLog(m, `<strong>Pin/submission attempt</strong> after ${reason}: ${attacker.wrestler.name} used <em>${move.name}</em> (${letter}, defensive level ${lev}). Needs ${need.join('/')}, rolls ${rolls.join('/')}. ${count===3?'THREE COUNT!':count===2?'Near fall!':'No finish.'}`, 'pin');
 if(count===3){
  if(teamBreakup(m, defender, count)){ render(); return; }
  const atkTeam=teamOf(m, attacker);
  m.result='pinfall'; m.winner=atkTeam?atkTeam.name:attacker.wrestler.name;
  m.lastFinishMove = move.name;
  finalizeMatch(m, `${m.winner} wins by pinfall when ${attacker.wrestler.name} defeats ${defender.wrestler.name} with ${move.name}.`);
 }
}
function raffle(m:Match){
 const roll=pct(); m.movesUsed++;
 if(roll<=2){ addNotable(m,'Chaotic finish','The match broke down into a double count-out brawl.'); m.result='draw'; finalizeMatch(m,'Double count-out after the match breaks down.'); return; }
 if(roll<=6){ const target = m.a.currentPP<m.b.currentPP?m.a:m.b; const dmg=d(6)+35; target.currentPP-=dmg; target.blood=true; target.controlPenalty-=1; m.drama+=3; addNotable(m,'Blood',`${target.wrestler.name} was busted open on the ring post.`); addLog(m, `<strong>Wrestling Raffle:</strong> ${target.wrestler.name} is busted open on the post. Damage ${dmg}. Control penalty now ${target.controlPenalty}.`, 'raffle'); return; }
 if(roll<=12){ addLog(m, `<strong>Wrestling Raffle:</strong> furious flurry — next exchange gets extra violence. Roll ${roll}.`, 'raffle'); m.drama++; return; }
 if(roll===13){ const leader=m.a.currentPP>=m.b.currentPP?m.a:m.b, other=leader===m.a?m.b:m.a; const move=leader.wrestler.moves.find(x=>x.pin==='auto') || leader.wrestler.moves[leader.wrestler.moves.length-1]; const dmg=d(6)+move.bonus; other.currentPP-=dmg; leader.finishers++; m.drama+=4; addNotable(m,'Lucky 13 gamble',`${leader.wrestler.name} took the risky Lucky 13 finish opportunity and hit ${move.name}.`); addLog(m, `<strong>Lucky 13!</strong> ${leader.wrestler.name} risks it and hits ${move.name}. Damage ${dmg}.`, 'raffle'); rollPin(m,leader,other,move,'Lucky 13 raffle'); return; }
 if(roll<=18){ const heel = m.a.wrestler.qpr.includes('Heel')?m.a:m.b.wrestler.qpr.includes('Heel')?m.b:null; const face=heel?(heel===m.a?m.b:m.a):null; if(heel&&face){ addNotable(m,'Outside help',`${heel.wrestler.name} used outside help and got disqualified.`); m.result='dq'; m.winner=face.wrestler.name; finalizeMatch(m, `${face.wrestler.name} wins by disqualification after ${heel.wrestler.name} uses outside help.`); } else addLog(m, `<strong>Wrestling Raffle:</strong> outside confusion, but no heel/face trigger applies.`, 'raffle'); return; }
 if(roll<=21){ addNotable(m,'Ref bump',`The referee was knocked out of position during the match.`); addLog(m, `<strong>Ref bump!</strong> No finishes for the next sequence. Roll ${roll}.`, 'raffle'); m.drama+=2; return; }
 if(roll>=83) addNotable(m,'Wild swing',`A late Wrestling Raffle roll (${roll}) created a sudden chaotic momentum shift.`); addLog(m, `<strong>Wrestling Raffle:</strong> roll ${roll}. The match momentum shifts in a chaotic exchange.`, 'raffle');
}
function oneMove(m:Match){
 if(m.result) return;
 if(m.movesUsed>=m.moveLimit){ m.result='draw'; finalizeMatch(m, 'Time-limit draw.'); return; }
 const ar=d(10)+m.a.controlPenalty, br=d(10)+m.b.controlPenalty;
 if(ar===br){ addLog(m, `<strong>Control:</strong> ${m.a.wrestler.name} ${ar} vs ${m.b.wrestler.name} ${br}. Tie — Wrestling Raffle.`, ''); raffle(m); render(); return; }
 const atk = ar>br?m.a:m.b, def=atk===m.a?m.b:m.a;
 if(m.lastControl && m.lastControl!==atk.wrestler.id) m.controlSwings++;
 m.lastControl = atk.wrestler.id;
 if(atk.pending){ const move=atk.pending; atk.pending=null; rollPin(m,atk,def,move,'retained control after setup'); render(); return; }
 def.pending=null;
 const atkTeam=teamOf(m, atk), defTeam=teamOf(m, def);
 if(atkTeam && pct()<=atkTeam.miscueRisk){ m.movesUsed++; m.drama++; addNotable(m,'Tag miscue',`${atkTeam.name} had an apron miscue that cost ${atk.wrestler.name} control.`); addLog(m, `<strong>Tag confusion:</strong> ${atkTeam.name} has a miscue on the apron. ${atk.wrestler.name} loses the exchange.`, 'tag'); maybeTag(m, defTeam!, 'the opponent’s miscue'); render(); return; }
 const canTeamFinish=atkTeam && atkTeam.official && def.currentPP<=def.startPP*.28 && pct()<=18;
 const move=canTeamFinish?tagFinisherMove(atkTeam!):getMove(atk.wrestler); const dmg=d(6)+move.bonus+(atkTeam?.official && !canTeamFinish?3:0); def.currentPP-=dmg; m.movesUsed++;
 addLog(m, `<strong>Control:</strong> ${m.a.wrestler.name} ${ar} vs ${m.b.wrestler.name} ${br}.<br>${atk.wrestler.name}${canTeamFinish&&atkTeam?` calls in ${partnerOf(atkTeam).wrestler.name}`:''} hits <strong>${move.name}${move.pin==='setup'?'*':move.pin==='auto'?'**':''}</strong>. Damage ${dmg}. ${def.wrestler.name} now ${def.currentPP} PP.`, canTeamFinish?'tag':'move');
 if(move.pin==='auto'){ atk.finishers++; m.drama+=3; rollPin(m,atk,def,move,'automatic finisher'); }
 else if(move.pin==='setup'){ atk.pending=move; addLog(m, `<strong>Setup:</strong> ${move.name} created a pin/submission opening. ${atk.wrestler.name} must win the next control roll to try it.`, 'pin'); }
 if(!m.result && defTeam) maybeTag(m, defTeam, 'taking damage');
 if(!m.result && atkTeam && pct()<=10) maybeTag(m, atkTeam, 'controlling the ring');
 if(!m.result && def.currentPP<=-50 && !move.pin && Math.random()<.12){ rollPin(m,atk,def,{...move,letter:'A'},'desperation exhaustion cover'); }
 if(!m.result && m.movesUsed>=m.moveLimit){ m.result='draw'; finalizeMatch(m, 'Time-limit draw.'); }
 render();
}
function finalizeMatch(m:Match, resultText:string){
 let rating = 1.0;
 const mins=m.movesUsed/3;
 rating += Math.min(1.1, mins/30);
 rating += Math.min(0.8, (m.a.nearfalls+m.b.nearfalls)*0.18);
 rating += Math.min(0.45, (m.a.finishers+m.b.finishers)*0.12);
 rating += Math.min(0.5, m.controlSwings*0.025);
 if(m.a.blood||m.b.blood) rating+=0.2;
 if(m.result==='dq'||m.result==='countout') rating=Math.min(rating-.45,3.0);
 if(m.result==='draw') rating=Math.min(rating+.15,4.25);
 if(mins<5) rating=Math.min(rating,2.0); else if(mins<10) rating=Math.min(rating,2.75); else if(mins<15) rating=Math.min(rating,3.35);
 if(rating>4.6 && mins>25 && (m.a.nearfalls+m.b.nearfalls)>=3 && m.result==='pinfall') rating += 0.25;
 m.goat = rating>5.0;
 m.rating = Math.round(cap(rating,.5,6.25)*4)/4;
 if(m.kind==='tag' && m.tag) recordMatchup(m.tag.teamA.name, m.tag.teamB.name);
 else recordMatchup(m.a.wrestler.id, m.b.wrestler.id);
 const rankingUpdate = applyOfficialRankingChange(m);
 const notableBlock = renderNotableEvents(m);
 saveMatchHistoryFromMatch(m, `${resultText} Time ${fmtTime(m.movesUsed)} (${m.movesUsed} move boxes).`);
 addLog(m, `<strong>RESULT:</strong> ${resultText} Time ${fmtTime(m.movesUsed)} (${m.movesUsed} move boxes).<br><span class="rating">${stars(m.rating)} ${m.rating.toFixed(2)}★</span>${m.goat?' <span class="goat">GOAT contender!</span>':''}${rankingUpdate?`<br><span class="rankingUpdate">${rankingUpdate}</span>`:''}<br>${notableBlock}`, 'result');
}
function applyTagPreset(teamSelectId:string, wrestlerOneId:string, wrestlerTwoId:string){
 const teamId=(document.getElementById(teamSelectId) as HTMLSelectElement | null)?.value;
 if(!teamId || teamId==='manual') return;
 const team=officialTagTeams.find(t=>t.id===teamId);
 if(!team) return;
 const one=document.getElementById(wrestlerOneId) as HTMLSelectElement | null;
 const two=document.getElementById(wrestlerTwoId) as HTMLSelectElement | null;
 if(one) one.value=team.members[0];
 if(two) two.value=team.members[1];
}


function selectedMatchStatus(){
 const el=document.getElementById('matchStatus') as HTMLSelectElement | null;
 return el?.value === 'official';
}

function startSingles(){
 if(selectedSimMode()==='quick'){ runQuickSinglesFromSelections(); return; }
 const a=byId((document.getElementById('wrestlerA') as HTMLSelectElement).value), b=byId((document.getElementById('wrestlerB') as HTMLSelectElement).value);
 const la=Number((document.getElementById('levelA') as HTMLSelectElement).value), lb=Number((document.getElementById('levelB') as HTMLSelectElement).value);
 const time=Number((document.getElementById('timeLimit') as HTMLSelectElement).value);
 currentMatch={kind:'singles',simMode:'full',rule:selectedMatchRule(),territory:currentTerritory,officialMatch:selectedMatchStatus(),pinMode:(document.getElementById('pinMode') as HTMLSelectElement).value as PinMode,timeLimit:time,moveLimit:moveLimitFromMinutes(time),movesUsed:0,result:null,logs:[],notables:[],controlSwings:0,drama:0,goat:false,
  a:sideState(a,la),
  b:sideState(b,lb)}
 addLog(currentMatch, `<strong>Opening bell:</strong> ${a.name} starts at Level ${la} (${levelPP(a,la)} PP). ${b.name} starts at Level ${lb} (${levelPP(b,lb)} PP). Time limit: ${time<0?'No Limit':time+' minutes'}. Rules: ${currentMatch.rule}. Status: ${currentMatch.officialMatch?'Official — rankings update after result':'Exhibition — no rankings change'}.`, '');
 render();
}
function startTag(){
 if(selectedSimMode()==='quick'){ runQuickTagFromSelections(); return; }
 const ids:[string,string,string,string]=[
  (document.getElementById('tagA1') as HTMLSelectElement).value, (document.getElementById('tagA2') as HTMLSelectElement).value,
  (document.getElementById('tagB1') as HTMLSelectElement).value, (document.getElementById('tagB2') as HTMLSelectElement).value
 ];
 const unique=new Set(ids); if(unique.size<4){ alert('Please choose four different wrestlers for a tag match.'); return; }
 const lvl=Number((document.getElementById('tagLevel') as HTMLSelectElement).value); const time=Number((document.getElementById('timeLimit') as HTMLSelectElement).value);
 const teamA=makeTeam([ids[0],ids[1]],[lvl,lvl]); const teamB=makeTeam([ids[2],ids[3]],[lvl,lvl]);
 currentMatch={kind:'tag',simMode:'full',rule:selectedMatchRule(),territory:currentTerritory,officialMatch:selectedMatchStatus(),pinMode:(document.getElementById('pinMode') as HTMLSelectElement).value as PinMode,timeLimit:time,moveLimit:moveLimitFromMinutes(time),movesUsed:0,result:null,logs:[],notables:[],controlSwings:0,drama:0,goat:false,a:teamA.members[0],b:teamB.members[0],tag:{teamA,teamB}};
 addLog(currentMatch, `<strong>Opening bell:</strong> ${tagLabel(teamA)} vs ${tagLabel(teamB)}. Legal starters: ${teamA.members[0].wrestler.name} and ${teamB.members[0].wrestler.name}. Time limit: ${time<0?'No Limit':time+' minutes'}. Rules: ${currentMatch.rule}.`, 'tag'); render();
}

function idsFrom(prefix:string, count:number){
 const out:string[]=[];
 for(let i=1;i<=count;i++) out.push((document.getElementById(`${prefix}${i}`) as HTMLSelectElement).value);
 return out;
}
function teamLabelFromIds(ids:string[]){ return ids.map(id=>byId(id)?.name || id).join(' / '); }
function averageTeamScore(ids:string[]){ return ids.map(id=>byId(id)).reduce((sum,w)=>sum + (w.pp + qprValue(w.qpr)*35 + w.brAdj*4),0) / Math.max(1,ids.length); }
function warGamesEntranceOrder(teamAIds:string[], teamBIds:string[]){
 const advantageTeam = averageTeamScore(teamAIds)+d(100) >= averageTeamScore(teamBIds)+d(100) ? 'A' : 'B';
 const teamA=[...teamAIds], teamB=[...teamBIds];
 const order:{round:number; wrestlerId:string; team:'A'|'B'; note:string}[] = [];
 const firstA = teamA.shift()!, firstB = teamB.shift()!;
 order.push({round:1,wrestlerId:firstA,team:'A',note:'Starts match'});
 order.push({round:1,wrestlerId:firstB,team:'B',note:'Starts match'});
 let round=2;
 while(teamA.length || teamB.length){
  const nextTeam = round%2===0 ? advantageTeam : (advantageTeam==='A'?'B':'A');
  const list = nextTeam==='A' ? teamA : teamB;
  const backup = nextTeam==='A' ? teamB : teamA;
  const actualTeam = list.length ? nextTeam : (nextTeam==='A'?'B':'A');
  const id = list.length ? list.shift()! : backup.shift()!;
  order.push({round,wrestlerId:id,team:actualTeam as 'A'|'B',note:round===2?'WarGames advantage entry':'Alternating entry'});
  round++;
 }
 return {advantageTeam, order};
}

function survivorEliminationSummary(teamAIds:string[], teamBIds:string[]){
 let aliveA=[...teamAIds], aliveB=[...teamBIds];
 const eliminations:{by:string; eliminated:string; method:string; teamRemaining:string}[] = [];
 const methods=['pinfall','submission','count-out','disqualification','roll-up','finisher pinfall'];
 let guard=0;
 while(aliveA.length && aliveB.length && guard++<20){
  const scoreA = aliveA.reduce((n,id)=>n+byId(id).pp,0)/aliveA.length + d(100);
  const scoreB = aliveB.reduce((n,id)=>n+byId(id).pp,0)/aliveB.length + d(100);
  const winningSide = scoreA>=scoreB ? 'A' : 'B';
  const winners = winningSide==='A' ? aliveA : aliveB;
  const losers = winningSide==='A' ? aliveB : aliveA;
  const by = winners[Math.floor(Math.random()*winners.length)];
  const eliminated = losers.sort((x,y)=>byId(x).pp-byId(y).pp)[0];
  const method = methods[Math.floor(Math.random()*methods.length)];
  if(winningSide==='A') aliveB=aliveB.filter(id=>id!==eliminated);
  else aliveA=aliveA.filter(id=>id!==eliminated);
  eliminations.push({by, eliminated, method, teamRemaining:`Team A ${aliveA.length}, Team B ${aliveB.length}`});
 }
 return {eliminations, survivors: aliveA.length ? aliveA : aliveB, winningTeam: aliveA.length ? 'A' : 'B'};
}

function buildQuickMultiManMatch(teamAIds:string[], teamBIds:string[], label:string, rule:MatchRule, official:boolean){
 const firstA=byId(teamAIds[0]), firstB=byId(teamBIds[0]);
 const m:Match={kind:'tag',simMode:'quick',rule,territory:currentTerritory,officialMatch:false,pinMode:'standard',timeLimit:30,moveLimit:90,movesUsed:cap(d(10)+d(10)+teamAIds.length*5+teamBIds.length*5,10,120),result:null,logs:[],notables:[],controlSwings:d(8),drama:d(6),goat:false,a:sideState(firstA,0),b:sideState(firstB,0)};
 const aScore=averageTeamScore(teamAIds)+d(100);
 const bScore=averageTeamScore(teamBIds)+d(100);
 const aLabel=teamLabelFromIds(teamAIds), bLabel=teamLabelFromIds(teamBIds);

 if(rule==='WarGames'){
  const wg=warGamesEntranceOrder(teamAIds,teamBIds);
  const orderText=wg.order.map(o=>`Round ${o.round}: ${wrestlerName(o.wrestlerId)} (${o.team==='A'?'Team A':'Team B'}) — ${o.note}`).join('<br>');
  addNotable(m,'WarGames entrance order',`Advantage: Team ${wg.advantageTeam}.<br>${orderText}`);
  addLog(m, `<strong>WarGames Entrance Order:</strong><br>${orderText}`, 'raffle');
 }

 if(rule==='Survivor Series Elimination'){
  const surv=survivorEliminationSummary(teamAIds,teamBIds);
  const winningIds = surv.winningTeam==='A' ? teamAIds : teamBIds;
  const losingIds = surv.winningTeam==='A' ? teamBIds : teamAIds;
  const elimText=surv.eliminations.map((e,i)=>`${i+1}. ${wrestlerName(e.by)} eliminated ${wrestlerName(e.eliminated)} by ${e.method} (${e.teamRemaining})`).join('<br>');
  const survivorsText=surv.survivors.map(wrestlerName).join(', ');
  m.result='survivorSeries';
  m.winner=teamLabelFromIds(winningIds);
  addNotable(m,'Survivor Series eliminations',`${elimText}<br><br>Survivor(s): ${survivorsText}`);
  addLog(m, `<strong>Survivor Series Elimination Order:</strong><br>${elimText}<br><br><strong>Survivor(s):</strong> ${survivorsText}`, 'result');
  finalizeMatch(m, `${teamLabelFromIds(winningIds)} defeated ${teamLabelFromIds(losingIds)}. Survivor(s): ${survivorsText}.`);
  return m;
 }

 const winnerLabel=aScore>=bScore?aLabel:bLabel;
 const loserLabel=aScore>=bScore?bLabel:aLabel;
 const finish = rule==='Steel Cage' ? 'escape' : (pct()<=72 ? 'pinfall' : pct()<=88 ? 'submission' : 'countout');
 m.result=finish;
 m.winner=winnerLabel;
 if(rule==='WarGames') addNotable(m,'WarGames chaos',`The cage-team format created extra chaos and heavy feud energy.`);
 if(rule==='Bunkhouse Rules') addNotable(m,'Bunkhouse rules',`The match had a roughhouse, anything-can-happen feel.`);
 if(pct()<=34) addNotable(m,'Multi-man chaos',`Several partners hit the ring at once before order was restored.`);
 if(pct()<=24) addNotable(m,'Outside help',`An ally or manager presence changed the momentum without overriding the dice.`);
 m.lastFinishMove = finish;
 finalizeMatch(m, `${winnerLabel} defeated ${loserLabel} by ${finish}.`);
 return m;
}
function startMultiMan(kind:'sixManTag'|'eightManTag'|'survivorSeries'|'survivorSeries4'|'survivorSeries5'|'warGames'){
 let count = 3;

 if(
  kind==='eightManTag' ||
  kind==='warGames' ||
  kind==='survivorSeries4' ||
  kind==='survivorSeries'
 ) count = 4;

 if(kind==='survivorSeries5') count = 5;

 const teamA=idsFrom('multiA',count), teamB=idsFrom('multiB',count);
 const unique=new Set([...teamA,...teamB]);

 if(unique.size < count*2){
  alert(`Please choose ${count*2} different wrestlers.`);
  return;
 }

 const rule =
  kind==='survivorSeries' ||
  kind==='survivorSeries4' ||
  kind==='survivorSeries5'
   ? 'Survivor Series Elimination'
   : kind==='warGames'
    ? 'WarGames'
    : selectedMatchRule();

 const label =
  kind==='sixManTag' ? '6-Man Tag' :
  kind==='eightManTag' ? '8-Man Tag' :
  kind==='survivorSeries5' ? 'Survivor Series 5 vs 5 Elimination Match' :
  (kind==='survivorSeries4' || kind==='survivorSeries')
   ? 'Survivor Series 4 vs 4 Elimination Match'
   : 'WarGames';

 currentMatch=buildQuickMultiManMatch(teamA,teamB,label,rule,selectedMatchStatus());

 addLog(currentMatch, `<strong>${label}:</strong> ${teamLabelFromIds(teamA)} vs ${teamLabelFromIds(teamB)}. Multi-man matches are resolved with the quick match engine while preserving book-accurate match-type selection.`, 'tag');

 render();
}

function runAuto(){ let guard=0; while(currentMatch && !currentMatch.result && guard++<500){ oneMove(currentMatch); } render(); }

function createCard(){
 const n=Number((document.getElementById('cardMatches') as HTMLSelectElement).value);
 eventCard={ name:(document.getElementById('cardName') as HTMLInputElement).value || 'Tonight’s Card', date:(document.getElementById('cardDate') as HTMLInputElement).value || '', venue:(document.getElementById('cardVenue') as HTMLSelectElement).value || '', eventType:((document.getElementById('cardEventType') as HTMLSelectElement)?.value as EventType) || eventCard.eventType || 'TV Show', territory:currentTerritory, matches:[], history:eventCard.history };
 for(let i=1;i<=n;i++) eventCard.matches.push({id:i,type:'singles',label:`Match ${i}`,entrants:[], entrantMode:'random', entrantCount:20, mode:'quick', rule:'Standard'});
 saveUniverseState();
 render();
}

function resequenceCardMatches(){ eventCard.matches.forEach((m,i)=>{ m.id=i+1; if(!m.label || /^Match \d+$/.test(m.label)) m.label=`Match ${i+1}`; }); }
function saveCardFromForm(){
 const name=document.getElementById('cardName') as HTMLInputElement|null;
 const date=document.getElementById('cardDate') as HTMLInputElement|null;
 const venue=document.getElementById('cardVenue') as HTMLSelectElement|null;
 const eventType=document.getElementById('cardEventType') as HTMLSelectElement|null;
 if(name) eventCard.name=name.value || 'Tonight’s Card';
 if(date) eventCard.date=date.value || '';
 if(venue) eventCard.venue=venue.value || '';
 if(eventType) eventCard.eventType=eventType.value as EventType;
 eventCard.territory=currentTerritory;
 saveUniverseState();
}
function saveCardAndStay(){ saveCardFromForm(); alert('Card saved.'); render(); }
function returnToFederation(){ saveCardFromForm(); currentView='dashboard'; localStorage.setItem('scCurrentView',currentView); render(); }
function addCardMatch(){
 saveCardFromForm();
 const next=eventCard.matches.length+1;
 eventCard.matches.push({id:next,type:'singles',label:`Match ${next}`,entrants:[], entrantMode:'random', entrantCount:20, mode:'quick', rule:'Standard'});
 saveUniverseState(); render();
}
function deleteCardMatch(id:number){
 eventCard.matches=eventCard.matches.filter(m=>m.id!==id);
 resequenceCardMatches(); saveUniverseState(); render();
}
function moveCardMatch(id:number, dir:-1|1){
 const idx=eventCard.matches.findIndex(m=>m.id===id); const next=idx+dir;
 if(idx<0 || next<0 || next>=eventCard.matches.length) return;
 const copy=[...eventCard.matches]; [copy[idx],copy[next]]=[copy[next],copy[idx]]; eventCard.matches=copy; resequenceCardMatches(); saveUniverseState(); render();
}
function ensureCardTeams(m:CardMatch){
 const size=cardTeamSize(m.type);
 if(!m.teamA) m.teamA=[];
 if(!m.teamB) m.teamB=[];
 const ids=roster().map(w=>w.id);
 while(m.teamA.length<size) m.teamA.push(ids[(m.teamA.length)%Math.max(1,ids.length)] || '');
 while(m.teamB.length<size) m.teamB.push(ids[(size+m.teamB.length)%Math.max(1,ids.length)] || '');
 m.teamA=m.teamA.slice(0,size);
 m.teamB=m.teamB.slice(0,size);
 if(size===1){ m.a=m.teamA[0] || m.a; m.b=m.teamB[0] || m.b; }
}
function cardTeamPresetOptions(selected?:string){
 const teams=eligibleTagTeams().map(t=>`<option value="${t.name}" ${selected===t.name?'selected':''}>${t.name} — ${t.members.map(wrestlerName).join(' & ')}</option>`).join('');
 return `<option value="manual" ${!selected||selected==='manual'?'selected':''}>Manual / ad hoc team</option>${teams}`;
}
function applyCardTeamPreset(m:CardMatch, side:'A'|'B', preset:string){
 if(side==='A') m.teamAPreset=preset; else m.teamBPreset=preset;
 if(preset==='manual') return;
 const tpl=teamTemplateByName(preset);
 if(!tpl) return;
 if(side==='A') m.teamA=[...tpl.members]; else m.teamB=[...tpl.members];
}
function setCardTeamMember(m:CardMatch, side:'A'|'B', idx:number, value:string){
 ensureCardTeams(m);
 const team=side==='A' ? m.teamA! : m.teamB!;
 team[idx]=value;
 if(side==='A') m.teamAPreset='manual'; else m.teamBPreset='manual';
 if(cardTeamSize(m.type)===1){ m.a=m.teamA?.[0]; m.b=m.teamB?.[0]; }
}
function resolveCardTeamValues(values:string[]|undefined, currentId:number){
 const resolved=(values||[]).map(v=>resolveCardParticipant(v));
 if((values||[]).some((v,i)=>v && !resolved[i])) return null;
 return resolved.filter(Boolean) as string[];
}
function updateCardMatch(id:number, field:string, val:string){
 const m=eventCard.matches.find(x=>x.id===id)!;
 if(field==='type'){
  m.type=val as MatchType;
  if(isCardBattleType(m.type)){ m.entrantMode=m.entrantMode||'random'; m.entrantCount=m.entrantCount||20; m.a=undefined; m.b=undefined; m.teamA=[]; m.teamB=[]; }
  else { ensureCardTeams(m); if(isCardTeamType(m.type) && m.type!=='tag'){ m.teamAPreset='manual'; m.teamBPreset='manual'; } }
 }
 if(field==='mode') m.mode=val as SimMode;
 if(field==='rule') m.rule=val as MatchRule;
 if(field==='a'){ m.a=val; m.teamA=[val]; }
 if(field==='b'){ m.b=val; m.teamB=[val]; }
 if(field==='label') m.label=val;
 if(field==='entrantMode') m.entrantMode=val as 'random'|'selected';
 if(field==='entrantCount') m.entrantCount=Number(val)||20;
 if(field==='teamAPreset') applyCardTeamPreset(m,'A',val);
 if(field==='teamBPreset') applyCardTeamPreset(m,'B',val);
 if(/^teamA\d+$/.test(field)) setCardTeamMember(m,'A',Number(field.replace('teamA','')),val);
 if(/^teamB\d+$/.test(field)) setCardTeamMember(m,'B',Number(field.replace('teamB','')),val);
 if(['type','a','b','rule','entrantMode','entrantCount','teamAPreset','teamBPreset'].includes(field) || /^teamA\d+$/.test(field) || /^teamB\d+$/.test(field)){ m.result=undefined; m.winnerId=undefined; m.loserId=undefined; }
 saveUniverseState();
 render();
}
function toggleCardEntrant(id:number, wrestlerId:string, checked:boolean){
 const m=eventCard.matches.find(x=>x.id===id); if(!m) return;
 const set=new Set(m.entrants||[]);
 checked ? set.add(wrestlerId) : set.delete(wrestlerId);
 m.entrants=Array.from(set);
 m.result=undefined; m.winnerId=undefined; m.loserId=undefined;
 saveUniverseState();
 render();
}
function randomizeCardEntrants(id:number){
 const m=eventCard.matches.find(x=>x.id===id); if(!m) return;
 const count=m.entrantCount||20;
 m.entrantMode='selected';
 m.entrants=shuffleIds(roster().map(w=>w.id)).slice(0, Math.min(count, roster().length));
 m.result=undefined; m.winnerId=undefined; m.loserId=undefined;
 render();
}
function clearCardEntrants(id:number){
 const m=eventCard.matches.find(x=>x.id===id); if(!m) return;
 m.entrants=[]; m.result=undefined; m.winnerId=undefined; m.loserId=undefined;
 render();
}
function cardBattleIds(cm:CardMatch):string[]{
 const count=cap(cm.entrantCount||20,2,roster().length);
 if(cm.entrantMode==='selected') return (cm.entrants||[]).slice(0,count);
 return shuffleIds(roster().map(w=>w.id)).slice(0,count);
}

function logCurrentToCard(){
 if(!currentMatch || !currentMatch.result) return;
 const text = `${currentMatch.winner || 'No winner'} — ${currentMatch.logs[0]?.html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}`;
 eventCard.history.unshift(text);
 saveUniverseState();
 render();
}

function simulateBattleRoyal(ids:string[], rumble=false):string|undefined{
 let entrants=ids.map((id,idx)=>({w:byId(id), out:false, elimBy:'', elims:0, eliminated:[] as string[], order:idx+1, rounds:0, save:false, lastNat20:false}));
 if(!rumble){ entrants = entrants.filter(e=>!!e.w); }
 const logs:string[]=[]; let active = rumble ? entrants.slice(0,2) : [...entrants]; let nextIndex=rumble?2:entrants.length; let round=0;
 const currentAdj=(e:any)=> e.w.brAdj - (rumble ? Math.floor(e.rounds/10)*2 : 0);
 while(active.filter(e=>!e.out).length>1 && round<500){
  round++;
  if(rumble && nextIndex<entrants.length){ const incoming=entrants[nextIndex++]; active.push(incoming); logs.unshift(`<strong>#${incoming.order} ${incoming.w.name}</strong> enters the Royal Rumble.`); }
  const alive=active.filter(e=>!e.out);
  const rolls=alive.map(e=>{ const raw=d(20); e.rounds++; if(raw===20 && e.lastNat20){ e.save=true; logs.unshift(`<strong>${e.w.name}</strong> earns a Rumble save with consecutive natural 20s!`); } e.lastNat20=raw===20; return {e,raw,total:raw+currentAdj(e)}; });
  let min=Math.min(...rolls.map(r=>r.total)), max=Math.max(...rolls.map(r=>r.total));
  let lows=rolls.filter(r=>r.total===min), highs=rolls.filter(r=>r.total===max);
  if(rumble && round<10){ lows=rolls.filter(r=>r.raw===1); if(!lows.length){ logs.unshift(`Round ${round}: no automatic elimination before round 10. ${rolls.map(r=>`${r.e.w.name} ${r.raw}+${currentAdj(r.e)}=${r.total}`).join(', ')}`); continue; } }
  lows = lows.filter(r=> r.total<20);
  if(!lows.length){ logs.unshift(`Round ${round}: everyone in danger saved themselves with adjusted scores of 20+.`); continue; }
  for(const low of lows){
   if(low.e.save){ low.e.save=false; const nextLow=rolls.filter(r=>r.e!==low.e && !r.e.out && r.total<20).sort((a,b)=>a.total-b.total)[0]; if(nextLow){ nextLow.e.out=true; nextLow.e.elimBy=low.e.w.name; low.e.elims++; low.e.eliminated.push(nextLow.e.w.name); logs.unshift(`Round ${round}: ${low.e.w.name} uses a Rumble save! ${nextLow.e.w.name} is eliminated instead.`); } else logs.unshift(`Round ${round}: ${low.e.w.name} uses a Rumble save. No one is eliminated.`); continue; }
   low.e.out=true; low.e.elimBy=highs.map(h=>h.e.w.name).join(' & '); highs.forEach(h=>{ h.e.elims++; h.e.eliminated.push(low.e.w.name); }); logs.unshift(`Round ${round}: ${low.e.elimBy} eliminate${highs.length>1?'':'s'} ${low.e.w.name}. (${rolls.map(r=>`${r.e.w.name} ${r.raw}+${currentAdj(r.e)}=${r.total}`).join(', ')})`);
  }
  const left=active.filter(e=>!e.out).length; if(left===4) logs.unshift('<strong>FINAL FOUR!</strong>'); if(left===2) logs.unshift('<strong>FINAL TWO!</strong>');
 }
 const winner=active.find(e=>!e.out);
 const eliminationSummary = entrants
  .filter(e=>e.w)
  .sort((a,b)=>b.elims-a.elims || a.order-b.order)
  .map(e=>`<li><strong>${e.w.name}</strong>: ${e.elims} elimination${e.elims===1?'':'s'}${e.eliminated.length?` — ${e.eliminated.join(', ')}`:' — none'}</li>`)
  .join('');
 const entrySummary = rumble ? entrants
  .filter(e=>e.w)
  .sort((a,b)=>a.order-b.order)
  .map(e=>`<li>#${e.order} ${e.w.name}</li>`)
  .join('') : '';
 if(rumble) logs.unshift(`<strong>ORDER OF ENTRY</strong><ol class="summaryList">${entrySummary}</ol>`);
 logs.unshift(`<strong>ELIMINATION SUMMARY</strong><ul class="summaryList">${eliminationSummary}</ul>`);
 logs.unshift(`<strong>RESULT:</strong> ${winner?.w.name || 'No winner'} wins the ${rumble?'Royal Rumble':'Battle Royal'}!`);
 eventCard.history.unshift(`${winner?.w.name || 'No winner'} wins ${rumble?'Royal Rumble':'Battle Royal'}.`);
 saveMatchHistory({matchType:rumble?'Royal Rumble':'Battle Royal', result:`${winner?.w.name || 'No winner'} wins the ${rumble?'Royal Rumble':'Battle Royal'}.`, participants:entrants.filter(e=>e.w).map(e=>e.w.id), winnerId:winner?.w.id, eliminations:Object.fromEntries(entrants.filter(e=>e.w).map(e=>[e.w.id,e.eliminated])), entryOrder:rumble?entrants.filter(e=>e.w).sort((a,b)=>a.order-b.order).map(e=>e.w.id):undefined});
 showSpecialResult(logs);
 return winner?.w.id;
}


function isConditionalRef(value?:string){ return !!value && (value.startsWith('__winner_') || value.startsWith('__loser_')); }
function conditionalLabel(value:string){
 const id=Number(value.replace('__winner_','').replace('__loser_',''));
 return `${value.startsWith('__winner_')?'Winner':'Loser'} of Match ${id}`;
}
function resolveCardParticipant(value?:string):string|undefined{
 if(!value) return value;
 if(value.startsWith('__winner_')){
  const id=Number(value.replace('__winner_',''));
  return eventCard.matches.find(m=>m.id===id)?.winnerId;
 }
 if(value.startsWith('__loser_')){
  const id=Number(value.replace('__loser_',''));
  return eventCard.matches.find(m=>m.id===id)?.loserId;
 }
 return value;
}
function cardParticipantOptions(selected?:string, currentId=1){
 const base=roster().sort((a,b)=>a.name.localeCompare(b.name)).map(w=>`<option value="${w.id}" ${selected===w.id?'selected':''}>${w.name} — ${w.pp} PP / ${w.qpr}</option>`).join('');
 const refs=eventCard.matches.filter(m=>m.id<currentId).flatMap(m=>[
  `<option value="__winner_${m.id}" ${selected===`__winner_${m.id}`?'selected':''}>Winner of Match ${m.id}${m.winnerId?` — ${wrestlerName(m.winnerId)}`:''}</option>`,
  `<option value="__loser_${m.id}" ${selected===`__loser_${m.id}`?'selected':''}>Loser of Match ${m.id}${m.loserId?` — ${wrestlerName(m.loserId)}`:''}</option>`
 ]).join('');
 return refs ? `<optgroup label="Card Results">${refs}</optgroup><optgroup label="Roster">${base}</optgroup>` : base;
}
function participantDisplay(value?:string){
 if(!value) return '';
 if(isConditionalRef(value)){
  const resolved=resolveCardParticipant(value);
  return resolved ? `${conditionalLabel(value)} (${wrestlerName(resolved)})` : conditionalLabel(value);
 }
 return wrestlerName(value);
}
function matchResultIdsForCurrent(aId?:string,bId?:string){
 const winnerName=currentMatch?.winner || '';
 let winnerId = roster().find(w=>w.name===winnerName)?.id;
 if(!winnerId && aId && winnerName.includes(wrestlerName(aId))) winnerId=aId;
 if(!winnerId && bId && winnerName.includes(wrestlerName(bId))) winnerId=bId;
 const loserId = winnerId===aId ? bId : winnerId===bId ? aId : undefined;
 return {winnerId, loserId};
}
function runCardQuickMatch(id:number){
 saveCardFromForm();
 const cm=eventCard.matches.find(x=>x.id===id); if(!cm) return;
 if(cm.type==='singles'){
  ensureCardTeams(cm);
  const resolvedA=resolveCardParticipant(cm.a || cm.teamA?.[0]);
  const resolvedB=resolveCardParticipant(cm.b || cm.teamB?.[0]);
  if(((cm.a||cm.teamA?.[0]) && !resolvedA) || ((cm.b||cm.teamB?.[0]) && !resolvedB)){
   alert('This match references a previous result that has not been completed yet. Run that earlier match first.'); return;
  }
  if(!resolvedA || !resolvedB || resolvedA===resolvedB){ alert('Choose two different wrestlers for this singles match.'); return; }
  const a=byId(resolvedA), b=byId(resolvedB);
  currentMatch=buildQuickSinglesMatch(a,b,cm.rule||'Standard',true);
  const ids=matchResultIdsForCurrent(a.id,b.id); cm.winnerId=ids.winnerId; cm.loserId=ids.loserId;
 } else if(isCardTeamType(cm.type)){
  ensureCardTeams(cm);
  const size=cardTeamSize(cm.type);
  const teamA=resolveCardTeamValues(cm.teamA, cm.id);
  const teamB=resolveCardTeamValues(cm.teamB, cm.id);
  if(!teamA || !teamB){ alert('This match references a previous result that has not been completed yet. Run that earlier match first.'); return; }
  const all=[...teamA,...teamB];
  if(!validateUniqueCardParticipants(all,size*2)){ alert(`Choose ${size*2} different wrestlers for this ${cardTypeName(cm.type)}.`); return; }
  if(cm.type==='tag'){
   currentMatch=buildQuickTagMatch([teamA[0],teamA[1],teamB[0],teamB[1]] as [string,string,string,string], cm.rule||'Standard', true);
   const winnerName=currentMatch.winner || '';
   const teamAWins=teamA.some(id=>winnerName.includes(wrestlerName(id)));
   cm.winnerId = teamAWins ? teamA[0] : teamB[0];
   cm.loserId = teamAWins ? teamB[0] : teamA[0];
  } else {
   const rule = cm.type==='survivorSeries' || cm.type==='survivorSeries4' || cm.type==='survivorSeries5'
    ? 'Survivor Series Elimination'
    : cm.type==='warGames' ? 'WarGames' : (cm.rule||'Standard');
   currentMatch=buildQuickMultiManMatch(teamA, teamB, cm.label || cardTypeName(cm.type), rule, true);
   const winnerName=currentMatch.winner || '';
   const teamAWins=teamA.some(id=>winnerName.includes(wrestlerName(id))) || winnerName.includes('Team A');
   cm.winnerId = teamAWins ? teamA[0] : teamB[0];
   cm.loserId = teamAWins ? teamB[0] : teamA[0];
  }
 } else if(isCardBattleType(cm.type)){
  const ids=cardBattleIds(cm);
  if(ids.length<2){ alert('Choose at least two entrants, or switch this Battle Royal/Royal Rumble slot to Random.'); return; }
  const winner=simulateBattleRoyal(cm.type==='royalRumble' ? shuffleIds(ids) : ids, cm.type==='royalRumble');
  cm.winnerId=winner;
  cm.result=winner ? wrestlerName(winner) : 'No winner';
  saveUniverseState();
  return;
 } else {
  const ids=shuffleIds(roster().map(w=>w.id)).slice(0,20);
  const winner=simulateBattleRoyal(ids, false); cm.winnerId=winner; cm.result=winner ? wrestlerName(winner) : 'No winner'; saveUniverseState(); return;
 }
 cm.result=currentMatch.winner || 'Draw'; cm.rating=currentMatch.rating;
 eventCard.history.unshift(`${cm.label}: ${currentMatch.logs[0]?.html.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()}`);
 saveUniverseState();
 currentView='cardBuilder'; setupType='none'; render();
}

function showSpecialResult(logs:string[]){
 const el=document.getElementById('specialResult')!; el.innerHTML = `<div class="log">${logs.map(x=>`<div class="entry raffle">${x}</div>`).join('')}</div>`;
}

function selectUniverse(id:TerritoryId){
 currentTerritory=id;
 currentScreen='engine';
 localStorage.setItem('scSelectedTerritory', id);
 localStorage.setItem('scCurrentScreen', 'engine');
 eventCard.territory=currentTerritory;
 currentMatch=null;
 render();
}
function renderHome(){
 const universeCards=territories.map(t=>{
  const wrestlerCount = allWrestlers.filter(w=>t.id==='combined'||w.territory===t.id).length;
  const teamCount = officialTagTeams.filter(tm=>tm.territory==='both'||tm.territory===t.id||t.id==='combined').length;
  const managerCount = managers.filter(m=>m.id!=='none' && (m.territory==='both'||m.territory===t.id||t.id==='combined')).length;
  return `<button class="universeCard" data-universe="${t.id}"><span>${t.name}</span><em>${t.note}</em><strong>${wrestlerCount} wrestlers · ${teamCount} teams · ${managerCount} managers</strong></button>`;
 }).join('');
 document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
 <div class="app">
  <section class="hero homeHero"><div class="brandline">THE SQUARED CIRCLE</div><div class="title">Choose Your Universe</div><div class="subtitle">Pick the book/territory you want to play in.</div></section>
  <section class="universeGrid">${universeCards}<div class="universeCard disabled"><span>Future Book / Territory</span><em>Reserved for the next uploaded book.</em><strong>Addable later</strong></div></section>
 </div>`;
 document.querySelectorAll('[data-universe]').forEach(b=>b.addEventListener('click',()=>selectUniverse((b as HTMLElement).dataset.universe as TerritoryId)));
}

function render(){
 if(currentScreen==='home'){ renderHome(); return; }
 const r=roster().sort((a,b)=>a.name.localeCompare(b.name));
 const opts=r.map(w=>`<option value="${w.id}">${w.name} — ${w.pp} PP / ${w.qpr}</option>`).join('');
 const teamOpts='<option value="manual">Manual / ad hoc team</option>'+eligibleTagTeams().map(tm=>`<option value="${tm.id}">${tm.name}${tm.rating?` (${tm.rating})`:''}</option>`).join('');
 const managerOpts=eligibleManagers().map(m=>`<option value="${m.id}">${m.name}${m.note?` — ${m.note}`:''}</option>`).join('');
 const t=territories.find(x=>x.id===currentTerritory)!;
 const nav = `<nav class="heroNavBar" aria-label="Territory tools"><button class="tab ${currentView==='newMatch'?'active':''}" data-view="newMatch">New Match</button><button class="tab ${currentView==='cardBuilder'?'active':''}" data-view="cardBuilder">Card Builder</button><button class="tab ${currentView==='rosterView'?'active':''}" data-view="rosterView">Roster View</button><button class="tab ${currentView==='rankings'?'active':''}" data-view="rankings">Rankings</button><button class="tab ${currentView==='feuds'?'active':''}" data-view="feuds">Feuds</button></nav>`;
 let body = '';
 if(currentView==='newMatch') body = renderNewMatchScreen(opts, teamOpts, managerOpts);
 else if(currentView==='cardBuilder') body = `<div class="singlePane">${renderCardBuilder(opts)}</div>`;
 else if(currentView==='rosterView') body = `<div class="singlePane">${renderRosterView()}</div>`;
 else if(currentView==='rankings') body = `<div class="singlePane">${renderRankingsView()}</div>`;
 else if(currentView==='feuds') body = `<div class="singlePane">${renderFeudsView()}</div>`;
 else body = renderDashboard();
 document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
 <div class="app theme-${currentTerritory}">
  <section class="hero"><button class="tab universeReturn" id="backHome">← Universe Menu</button><div class="brandline">THE SQUARED CIRCLE</div><div class="title">Digital Territory Engine</div><div class="subtitle">${t.name}</div>${nav}</section>
  <main class="contentPane">${body}</main>
 </div>`;
 document.getElementById('backHome')?.addEventListener('click',()=>{currentScreen='home'; localStorage.setItem('scCurrentScreen','home'); currentMatch=null; render();});
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{currentView=(b as HTMLElement).dataset.view as AppView; localStorage.setItem('scCurrentView',currentView); setupType = currentView==='newMatch' ? setupType : 'none'; render();}));
 document.getElementById('matchType')?.addEventListener('change',()=>{setupType=(document.getElementById('matchType') as HTMLSelectElement).value as SetupType; render();});
 document.getElementById('startSingles')?.addEventListener('click',startSingles);
 document.getElementById('randomSinglesExhibition')?.addEventListener('click',randomizeSinglesExhibition);
 document.getElementById('tagTeamA')?.addEventListener('change',()=>applyTagPreset('tagTeamA','tagA1','tagA2'));
 document.getElementById('tagTeamB')?.addEventListener('change',()=>applyTagPreset('tagTeamB','tagB1','tagB2'));
 document.getElementById('startTag')?.addEventListener('click',startTag);
 document.getElementById('randomTagExhibition')?.addEventListener('click',randomizeTagExhibition);
 document.getElementById('startMultiMan')?.addEventListener('click',()=>startMultiMan(setupType as 'sixManTag'|'eightManTag'|'survivorSeries'|'survivorSeries4'|'survivorSeries5'|'warGames'));
 document.getElementById('randomMultiManExhibition')?.addEventListener('click',randomizeMultiManExhibition);
 document.querySelectorAll('.nextMoveBtn').forEach(b=>b.addEventListener('click',()=>currentMatch&&oneMove(currentMatch)));
 document.querySelectorAll('.autoRunBtn').forEach(b=>b.addEventListener('click',runAuto));
 document.querySelectorAll('.saveResultBtn').forEach(b=>b.addEventListener('click',logCurrentToCard));
 document.getElementById('resetRankings')?.addEventListener('click',resetStoredPoints);
 document.getElementById('cardEventType')?.addEventListener('change',()=>{ eventCard.eventType=((document.getElementById('cardEventType') as HTMLSelectElement).value as EventType); render(); });
 document.getElementById('createCard')?.addEventListener('click',createCard);
 document.getElementById('addCardMatch')?.addEventListener('click',addCardMatch);
 document.getElementById('saveCard')?.addEventListener('click',saveCardAndStay);
 document.getElementById('saveCardBottom')?.addEventListener('click',saveCardAndStay);
 document.getElementById('returnFederation')?.addEventListener('click',returnToFederation);
 document.getElementById('returnFederationBottom')?.addEventListener('click',returnToFederation);
 document.getElementById('runBattle')?.addEventListener('click',()=>simulateBattleRoyal(getSelectedEntrants(),false));
 document.getElementById('runRumble')?.addEventListener('click',()=>simulateBattleRoyal(shuffleIds(getSelectedEntrants()),true));
 document.getElementById('selectAllEntrants')?.addEventListener('click',()=>{document.querySelectorAll<HTMLInputElement>('.entrantCheck').forEach(c=>c.checked=true)});
 document.getElementById('clearEntrants')?.addEventListener('click',()=>{document.querySelectorAll<HTMLInputElement>('.entrantCheck').forEach(c=>c.checked=false)});
 document.getElementById('random20Entrants')?.addEventListener('click',()=>{const checks=Array.from(document.querySelectorAll<HTMLInputElement>('.entrantCheck')); checks.forEach(c=>c.checked=false); checks.sort(()=>Math.random()-.5).slice(0,20).forEach(c=>c.checked=true)});
 document.querySelectorAll('[data-cardfield]').forEach(el=>el.addEventListener('change',()=>{const e=el as HTMLSelectElement|HTMLInputElement; updateCardMatch(Number(e.dataset.id), e.dataset.cardfield!, e.value)}));
 document.querySelectorAll('[data-cardquick]').forEach(el=>el.addEventListener('click',()=>runCardQuickMatch(Number((el as HTMLElement).dataset.cardquick))));
 document.querySelectorAll('[data-carddelete]').forEach(el=>el.addEventListener('click',()=>deleteCardMatch(Number((el as HTMLElement).dataset.carddelete))));
 document.querySelectorAll('[data-cardmoveup]').forEach(el=>el.addEventListener('click',()=>moveCardMatch(Number((el as HTMLElement).dataset.cardmoveup),-1)));
 document.querySelectorAll('[data-cardmovedown]').forEach(el=>el.addEventListener('click',()=>moveCardMatch(Number((el as HTMLElement).dataset.cardmovedown),1)));
 document.querySelectorAll('[data-cardentrant]').forEach(el=>el.addEventListener('change',()=>{ const e=el as HTMLInputElement; toggleCardEntrant(Number(e.dataset.cardentrant), e.value, e.checked); }));
 document.querySelectorAll('[data-cardrandomentrants]').forEach(el=>el.addEventListener('click',()=>randomizeCardEntrants(Number((el as HTMLElement).dataset.cardrandomentrants))));
 document.querySelectorAll('[data-cardclearentrants]').forEach(el=>el.addEventListener('click',()=>clearCardEntrants(Number((el as HTMLElement).dataset.cardclearentrants))));
 document.querySelectorAll('[data-relation]').forEach(el=>el.addEventListener('change',()=>{ const e=el as HTMLInputElement; setRelation(e.dataset.wrestler || '', e.dataset.relation as 'allies'|'enemies', e.value); }));
 document.getElementById('addFeud')?.addEventListener('click',addFeudFromForm);
 document.querySelectorAll('[data-feudfield]').forEach(el=>el.addEventListener('change',()=>{ const e=el as HTMLInputElement; updateFeud(e.dataset.feudid || '', e.dataset.feudfield as 'heat'|'note', e.value); }));
 document.querySelectorAll('[data-feudtoggle]').forEach(el=>el.addEventListener('click',()=>{ const id=(el as HTMLElement).dataset.feudtoggle || ''; const f=feuds.find(x=>x.id===id); if(f) updateFeud(id,'active',!f.active); }));
 document.querySelectorAll('[data-applysuggestion]').forEach(el=>el.addEventListener('click',()=>{ const [a,b]=((el as HTMLElement).dataset.applysuggestion || '').split('|'); if(a&&b) applySuggestion(a,b); }));
 document.getElementById('manualSaveUniverse')?.addEventListener('click',()=>{ saveUniverseState(); alert('Universe saved on this device.'); render(); });
 document.getElementById('exportUniverse')?.addEventListener('click',exportUniverseBackup);
 document.getElementById('resetUniverseSave')?.addEventListener('click',resetUniverseSave);
 document.getElementById('importUniverseFile')?.addEventListener('change',()=>{ const input=document.getElementById('importUniverseFile') as HTMLInputElement; const file=input.files?.[0]; if(file) importUniverseBackup(file); });

}

function renderDashboard(){
 const t=territories.find(x=>x.id===currentTerritory)!;
 return `<div class="singlePane"><div class="card empty"><h2>${t.name}</h2><p>${t.note}</p><div class="dashGrid"><div><div class="roster-count">${roster().length}</div><div class="tiny">wrestlers loaded</div></div><div><div class="roster-count">${eligibleTagTeams().length}</div><div class="tiny">official teams</div></div><div><div class="roster-count">${eligibleManagers().filter(m=>m.id!=='none').length}</div><div class="tiny">managers</div></div></div><p class="tiny">Use the command stack in the top panel to start a match, build a card, browse the roster, view rankings, or track feuds.</p></div>${renderSavePanel()}</div>`;
}

function commonMatchOptions(managerOpts:string){
 return `<div class="formrow"><div><label>Play Mode</label><select id="simMode"><option value="full" selected>Full Sim / Playable</option><option value="quick">Quick Match</option></select></div><div><label>Match Rules</label><select id="matchRule">${ruleOptions()}</select></div></div><div class="formrow"><div><label>Time Limit</label><select id="timeLimit"><option value="5">5 Minutes</option><option value="10">10 Minutes</option><option value="15">15 Minutes</option><option value="20">20 Minutes</option><option value="30" selected>30 Minutes</option><option value="45">45 Minutes</option><option value="60">60 Minutes</option><option value="-1">No Time Limit</option></select></div><div><label>Pin Chart</label><select id="pinMode"><option value="standard">Standard</option><option value="optionB">Option B / Blitzkrieg</option></select></div></div><div class="formrow"><div><label>Match Status</label><select id="matchStatus"><option value="exhibition" selected>Exhibition — no ranking change</option><option value="official">Official — update PP/RP</option></select></div><div><label>Rules Note</label><div class="staticField">Quick Match gives an instant result; Full Sim keeps the move-by-move engine.</div></div></div>`;
}

function renderNewMatchScreen(opts:string, teamOpts:string, managerOpts:string){
 const selector = `<div class="card"><h2>New Match</h2><label>Match Type</label><select id="matchType"><option value="none" ${setupType==='none'?'selected':''}>Choose match type...</option><option value="singles" ${setupType==='singles'?'selected':''}>Singles Match</option><option value="tag" ${setupType==='tag'?'selected':''}>Tag Team Match</option><option value="sixManTag" ${setupType==='sixManTag'?'selected':''}>6-Man Tag</option><option value="eightManTag" ${setupType==='eightManTag'?'selected':''}>8-Man Tag</option><option value="survivorSeries4" ${setupType==='survivorSeries4'||setupType==='survivorSeries'?'selected':''}>Survivor Series 4 vs 4</option>
<option value="survivorSeries5" ${setupType==='survivorSeries5'?'selected':''}>Survivor Series 5 vs 5</option><option value="battleRoyal" ${setupType==='battleRoyal'?'selected':''}>Battle Royal</option><option value="royalRumble" ${setupType==='royalRumble'?'selected':''}>Royal Rumble</option><option value="tagBattleRoyal" ${setupType==='tagBattleRoyal'?'selected':''}>Tag Team Battle Royal</option><option value="bunkhouseBattleRoyal" ${setupType==='bunkhouseBattleRoyal'?'selected':''}>Bunkhouse Battle Royal</option><option value="warGames" ${setupType==='warGames'?'selected':''}>WarGames</option></select></div>`;
 let setup = `<div class="card empty"><h2>Match Setup</h2><p>Choose a match type above and the correct dropdowns will appear here.</p></div>`;
 if(setupType==='singles') setup = `<div class="card"><h2>Singles Match Setup</h2>${commonMatchOptions(managerOpts)}<div class="formrow"><div><label>Wrestler A</label><select id="wrestlerA">${opts}</select></div><div><label>Start Level</label><select id="levelA">${[0,1,2,3,4,5].map(n=>`<option value="${n}">Level ${n}</option>`).join('')}</select></div></div><div class="formrow"><div><label>Wrestler B</label><select id="wrestlerB">${opts}</select></div><div><label>Start Level</label><select id="levelB">${[0,1,2,3,4,5].map(n=>`<option value="${n}">Level ${n}</option>`).join('')}</select></div></div><div class="formrow"><div><label>Manager A</label><select id="managerA">${managerOpts}</select></div><div><label>Manager B</label><select id="managerB">${managerOpts}</select></div></div><div class="formrow"><button class="secondary" id="randomSinglesExhibition">Random Exhibition</button><button id="startSingles">Start Singles Match</button></div>${renderMatchControls()}</div>`;
 if(setupType==='tag') setup = `<div class="card"><h2>Tag Team Match Setup</h2><div class="tiny">Choose an official book team to auto-fill both wrestlers, or leave it on Manual / ad hoc team and pick any two singles.</div>${commonMatchOptions(managerOpts)}<div class="formrow"><div><label>Team A Preset</label><select id="tagTeamA">${teamOpts}</select></div><div><label>Team B Preset</label><select id="tagTeamB">${teamOpts}</select></div></div><div class="formrow"><div><label>Team A - Wrestler 1</label><select id="tagA1">${opts}</select></div><div><label>Team A - Wrestler 2</label><select id="tagA2">${opts}</select></div></div><div class="formrow"><div><label>Team B - Wrestler 1</label><select id="tagB1">${opts}</select></div><div><label>Team B - Wrestler 2</label><select id="tagB2">${opts}</select></div></div><div class="formrow"><div><label>Team A Manager</label><select id="tagManagerA">${managerOpts}</select></div><div><label>Team B Manager</label><select id="tagManagerB">${managerOpts}</select></div></div><div><label>Team Start Level</label><select id="tagLevel">${[0,1,2,3,4,5].map(n=>`<option value="${n}">Level ${n}</option>`).join('')}</select></div><div class="formrow"><button class="secondary" id="randomTagExhibition">Random Exhibition Teams</button><button id="startTag">Start Tag Team Match</button></div>${renderMatchControls()}</div>`;
 if(setupType==='sixManTag' || setupType==='eightManTag' || setupType==='survivorSeries' || setupType==='survivorSeries4' || setupType==='survivorSeries5' || setupType==='warGames'){
  let count = 3;

  if(
    setupType==='eightManTag' ||
    setupType==='warGames' ||
    setupType==='survivorSeries4' ||
    setupType==='survivorSeries'
  ) count = 4;

  if(setupType==='survivorSeries5') count = 5;

  const title =
    setupType==='sixManTag' ? '6-Man Tag Setup' :
    setupType==='eightManTag' ? '8-Man Tag Setup' :
    setupType==='survivorSeries5' ? 'Survivor Series 5 vs 5 Setup' :
    (setupType==='survivorSeries4' || setupType==='survivorSeries')
      ? 'Survivor Series 4 vs 4 Setup'
      : 'WarGames Setup';
  const aRows=Array.from({length:count},(_,i)=>`<div><label>Team A - Wrestler ${i+1}</label><select id="multiA${i+1}">${opts}</select></div>`).join('');
  const bRows=Array.from({length:count},(_,i)=>`<div><label>Team B - Wrestler ${i+1}</label><select id="multiB${i+1}">${opts}</select></div>`).join('');
  setup = `<div class="card"><h2>${title}</h2><div class="tiny">Book-referenced multi-man tag option. Uses quick resolution for now, with match notes and notable events preserved.</div>${commonMatchOptions(managerOpts)}<div class="formrow multiSelectGrid">${aRows}</div><div class="formrow multiSelectGrid">${bRows}</div><div class="formrow"><button class="secondary" id="randomMultiManExhibition">Random Exhibition Teams</button><button id="startMultiMan">Start ${title.replace(' Setup','')}</button></div>${renderMatchControls()}</div>`;
}
if(setupType==='battleRoyal' || setupType==='royalRumble' || setupType==='tagBattleRoyal' || setupType==='bunkhouseBattleRoyal') {
  setup = renderSpecial(opts).replace('Battle Royal / Royal Rumble', setupType==='tagBattleRoyal'?'Tag Team Battle Royal':setupType==='bunkhouseBattleRoyal'?'Bunkhouse Battle Royal':'Battle Royal / Royal Rumble').replace('Sim Battle Royal', setupType==='battleRoyal'||setupType==='tagBattleRoyal'||setupType==='bunkhouseBattleRoyal'?'Start Battle Royal':'Sim Battle Royal').replace('Sim Royal Rumble', setupType==='royalRumble'?'Start Royal Rumble':'Sim Royal Rumble');
  return `<div class="specialScreen"><div class="specialSelector">${selector}</div>${setup}</div>`;
}
 return `<div class="grid"><div>${selector}${setup}</div><div>${renderMatch()}</div></div>`;
}

function renderRosterView(){
 const wrestlers=roster().sort((a,b)=>a.name.localeCompare(b.name)).map((w,i)=>{
  const rel=relationFor(w.id);
  const history=historyForWrestler(w.id);
  const historyHtml=history.length ? history.map(h=>`<div class="matchHistoryRow"><strong>${h.date||h.eventName||'Saved Match'}</strong><span>${h.matchType} · ${h.result}${h.rating?` · ${h.rating.toFixed(2)}★`:''}</span></div>`).join('') : '<div class="tiny">No saved match results yet.</div>';
  return `<div class="rosterSheet"><div class="rosterHead"><strong>${w.name}</strong><span>${w.pp} PP · ${w.qpr} · BR ${w.brAdj>=0?'+':''}${w.brAdj}</span></div><div class="formrow compact"><div><label>Ally(s)</label><input data-relation="allies" data-wrestler="${w.id}" value="${rel.allies.replace(/"/g,'&quot;')}" placeholder="Comma-separated allies"></div><div><label>Enemy(s)</label><input data-relation="enemies" data-wrestler="${w.id}" value="${rel.enemies.replace(/"/g,'&quot;')}" placeholder="Comma-separated enemies"></div></div><details class="matchHistory"><summary>Match Results (${history.length})</summary>${historyHtml}</details></div>`;
 }).join('');
 const teams=territoryRankedTeams(currentTerritory).map((t,i)=>`<div class="dbRow"><strong>#${i+1} ${t.name}</strong><span>${t.rating||'D'} · ${t.rankingPoints?`${t.rankingPoints} RP · `:''}${t.members.map(id=>byId(id)?.name||id).join(' & ')}</span></div>`).join('');
 const mgrs=eligibleManagers().filter(m=>m.id!=='none').map(m=>`<div class="dbRow"><strong>${m.name}</strong><span>${m.stable.join(', ') || 'No stable listed'}</span></div>`).join('');
 return `<div class="card"><h2>Roster View</h2><div class="tiny">${roster().length} wrestlers · ${eligibleTagTeams().length} official teams · ${eligibleManagers().filter(m=>m.id!=='none').length} managers. Ally/enemy fields are saved locally and feed the Booking Advisor.</div><h3>Wrestler Sheets</h3><div class="dbList rosterSheets tall">${wrestlers}</div><h3>Official Teams</h3><div class="dbList">${teams||'<div class="tiny">No official teams loaded.</div>'}</div><h3>Managers / Stables</h3><div class="dbList">${mgrs||'<div class="tiny">No managers loaded.</div>'}</div></div>`;
}

function renderRankingsView(){
 return renderDatabase();
}


function renderFeudsView(){
 ensureDefaultFeuds();
 const opts=roster().sort((a,b)=>a.name.localeCompare(b.name)).map(w=>`<option value="${w.id}">${w.name}</option>`).join('');
 const rows=feuds.map(f=>`<div class="feudRow ${f.active?'':'inactive'}"><div><strong>${wrestlerName(f.a)} vs ${wrestlerName(f.b)}</strong><span>${f.note || 'No note'} · ${f.active?'Active':'Inactive'}</span></div><div><label>Heat</label><input type="number" min="1" max="10" data-feudfield="heat" data-feudid="${f.id}" value="${f.heat}"></div><div><label>Note</label><input data-feudfield="note" data-feudid="${f.id}" value="${(f.note||'').replace(/"/g,'&quot;')}"></div><button class="secondary" data-feudtoggle="${f.id}">${f.active?'Deactivate':'Activate'}</button></div>`).join('');
 return `<div class="card"><h2>Feuds</h2><p class="tiny">Track feud heat from 1–10. High-heat feuds are prioritized by the Booking Advisor, especially for Premium TV and PPV cards.</p><div class="formrow"><div><label>Wrestler A</label><select id="feudA">${opts}</select></div><div><label>Wrestler B</label><select id="feudB">${opts}</select></div></div><div class="formrow"><div><label>Heat</label><input id="feudHeat" type="number" min="1" max="10" value="6"></div><div><label>Note</label><input id="feudNote" placeholder="Why this feud matters"></div></div><button id="addFeud" class="wide">Add Feud</button><h3>Active Feud Board</h3><div class="dbList tall">${rows || '<div class="tiny">No feuds yet.</div>'}</div></div>`;
}

function renderMatchControls(){
 const disabled = currentMatch ? '' : ' disabled';
 return `<div class="quickControls"><div class="formrow"><button class="secondary nextMoveBtn"${disabled}>Next Move</button><button class="secondary autoRunBtn"${disabled}>Auto-Sim Match</button></div><button class="wide secondary saveResultBtn"${disabled}>Save Current Result to Card</button></div>`;
}

function renderSideCard(s:SideState, legal:boolean){ return `<div class="wcard ${legal?'legal':'apron'}"><h3>${s.wrestler.name}${legal?' <span class="legalBadge">LEGAL</span>':''}</h3><div class="bar"><span style="width:${cap((s.currentPP/s.startPP)*100,0,100)}%"></span></div><p>${s.currentPP} / ${s.startPP} PP · Def Lvl ${defensiveLevel(s)} · Start Lvl ${s.startLevel}</p><span class="pill">${s.wrestler.qpr}</span><span class="pill">BR ${s.wrestler.brAdj>=0?'+':''}${s.wrestler.brAdj}</span>${s.blood?'<span class="pill red">Bloodied</span>':''}</div>`; }
function renderTeam(team:TeamState){ const tpl=teamTemplateByName(team.name); return `<div class="teamBox"><h3>${team.name}</h3><div class="tiny">${team.official?`Official ${tpl?.rating||''}-rated tag team${tpl?.rankingPoints?` · ${tpl.rankingPoints} RP`:''}`:'Ad hoc team'} · Breakups left: ${team.breakups} · Finisher: ${team.finisher}</div><div class="teamMembers">${team.members.map((s,i)=>renderSideCard(s, team.active===i)).join('')}</div></div>`; }
function renderMatch(){
 if(!currentMatch) return `<div class="card empty"><h2>Playable Match Engine</h2><p>Choose wrestlers, set a time limit, and start a singles or tag team match. This includes control rolls, moves, PP, setup pins, finishers, tag saves, hot tags, raffle events, time-limit draws, and star ratings.</p><div class="roster-count">${roster().length}</div><div class="tiny">wrestlers available in this territory</div></div>`;
 const m=currentMatch, remain=m.moveLimit>=9999?'∞':String(Math.max(0,m.moveLimit-m.movesUsed));
 const competitors=m.tag?`<div class="tagTeams">${renderTeam(m.tag.teamA)}${renderTeam(m.tag.teamB)}</div>`:`<div class="wrestlers">${[m.a,m.b].map(s=>renderSideCard(s,true)).join('')}</div>`;
 return `<div class="card"><div class="scoreboard"><div class="stat"><label>Elapsed</label><div class="big">${fmtTime(m.movesUsed)}</div></div><div class="stat"><label>Moves Remaining</label><div class="big">${remain}</div></div><div class="stat"><label>Result</label><div class="big">${m.result?m.winner||'Draw':'Live'}</div></div></div>${competitors}<div class="log">${m.logs.map(l=>`<div class="entry ${l.cls||''}">${l.html}</div>`).join('')}</div></div>`;
}
function renderBookingAdvisor(){
 const suggestions=makeSuggestedMatches();
 const warnings=overexposureWarnings();
 const scheduling = currentTerritory==='wwf1985_90'
  ? 'WWF: rotate major arenas like MSG, Boston Garden, Philadelphia Spectrum, Maple Leaf Gardens, Kiel Auditorium, and L.A. Sports Arena. One primary card at a time keeps the game manageable.'
  : currentTerritory==='crockett1986'
   ? 'Crockett: plan one or two weeks at a time, build toward a fourth-week supershow, and avoid giving away the biggest PPV matchup too often on house shows.'
   : 'Combined: use territory logic based on the active card. Protect marquee matches for big shows while using TV/house shows to build contenders.';
 const warnBlock=warnings.length?`<div class="advisorWarnings"><strong>Overexposure warnings</strong>${warnings.map(w=>`<div>${w}</div>`).join('')}</div>`:'';
 const sugBlock=suggestions.map(s=>`<div class="suggestionRow ${s.kind}"><div><strong>${s.title}</strong><span>${s.reason}</span></div><button class="secondary" data-applysuggestion="${s.a}|${s.b}">Add</button></div>`).join('');
 return `<div class="advisorPanel"><h3>Booking Advisor</h3><div class="scheduleHelper"><strong>Territory Scheduling Helper</strong><span>${scheduling}</span>${isHouseOrRegularTv()?'<em>House shows and regular TV tapings may include enhancement matches where a jobber/prelim wrestler is fed to a main-eventer or upper-card wrestler.</em>':''}</div>${warnBlock}<div class="suggestionList">${sugBlock || '<div class="tiny">Create a card or add feud/allies/enemies data for smarter suggestions.</div>'}</div></div>`;
}

function renderTeamSelectors(m:CardMatch){
 ensureCardTeams(m);
 const size=cardTeamSize(m.type);
 const sideControls = (side:'A'|'B') => {
  const team = side==='A' ? m.teamA! : m.teamB!;
  const preset = side==='A' ? m.teamAPreset : m.teamBPreset;
  const presetSelect = m.type==='tag' ? `<div><label>Team ${side} Preset</label><select data-cardfield="team${side}Preset" data-id="${m.id}">${cardTeamPresetOptions(preset||'manual')}</select></div>` : '';
  const picks = team.map((value,idx)=>`<div><label>Team ${side} Wrestler ${idx+1}</label><select data-cardfield="team${side}${idx}" data-id="${m.id}">${cardParticipantOptions(value,m.id)}</select></div>`).join('');
  return `<div class="cardTeamBox"><h4>Team ${side}</h4><div class="formrow">${presetSelect}${picks}</div></div>`;
 };
 return `<div class="cardTeamsGrid">${sideControls('A')}${sideControls('B')}</div>`;
}

function renderCardMatchSlot(m:CardMatch, typeOpts:string){
 const isBattle=isCardBattleType(m.type);
 const result=m.result?`<span class="resultChip">Winner: ${m.winnerId?wrestlerName(m.winnerId):m.result}</span>`:'';
 const tools=`<div class="slotTools"><button class="secondary smallBtn" data-cardmoveup="${m.id}">↑</button><button class="secondary smallBtn" data-cardmovedown="${m.id}">↓</button><button class="secondary smallBtn dangerLite" data-carddelete="${m.id}">Delete</button></div>`;
 if(isBattle){
  const count=m.entrantCount||20;
  const mode=m.entrantMode||'random';
  const checklist = mode==='selected' ? `<div class="cardEntrantTools"><button class="secondary smallBtn" data-cardrandomentrants="${m.id}">Random Fill</button><button class="secondary smallBtn" data-cardclearentrants="${m.id}">Clear</button><span class="tiny">${(m.entrants||[]).length} selected</span></div><div class="cardEntrantChecklist">${roster().sort((a,b)=>a.rank-b.rank).map(w=>`<label class="cardEntrantRow"><input type="checkbox" data-cardentrant="${m.id}" value="${w.id}" ${(m.entrants||[]).includes(w.id)?'checked':''}><span>${w.name}</span><em>${w.pp} PP · BR ${w.brAdj>=0?'+':''}${w.brAdj}</em></label>`).join('')}</div>` : `<div class="tiny conditionalHelp">Random will pull ${count} different entrants from the current universe when the match is run.</div>`;
  return `<div class="matchslot battleCardSlot"><div class="slotHeader"><input data-cardfield="label" data-id="${m.id}" value="${m.label}">${tools}</div><div class="formrow"><div><label>Match Type</label><select data-cardfield="type" data-id="${m.id}">${typeOpts}</select></div><div><label>Play Mode</label><select data-cardfield="mode" data-id="${m.id}"><option value="quick" ${(m.mode||'quick')==='quick'?'selected':''}>Quick Match</option><option value="full" ${m.mode==='full'?'selected':''}>Full Match</option></select></div><div><label>Rules</label><select data-cardfield="rule" data-id="${m.id}">${ruleOptions(m.rule||'Standard')}</select></div></div><div class="battleCardControls"><div><label>Entrants</label><select data-cardfield="entrantCount" data-id="${m.id}">${[6,8,10,12,15,20,25,30].map(n=>`<option value="${n}" ${count===n?'selected':''}>${n}</option>`).join('')}</select></div><div><label>Selection</label><select data-cardfield="entrantMode" data-id="${m.id}"><option value="random" ${mode==='random'?'selected':''}>Random</option><option value="selected" ${mode==='selected'?'selected':''}>Selected</option></select></div><button class="secondary cardQuickBtn" data-cardquick="${m.id}">Run Quick</button>${result}</div>${checklist}</div>`;
 }
 if(m.type==='singles'){
  ensureCardTeams(m);
  return `<div class="matchslot"><div class="slotHeader"><input data-cardfield="label" data-id="${m.id}" value="${m.label}">${tools}</div><div class="formrow"><div><label>Match Type</label><select data-cardfield="type" data-id="${m.id}">${typeOpts}</select></div><div><label>Play Mode</label><select data-cardfield="mode" data-id="${m.id}"><option value="quick" ${(m.mode||'quick')==='quick'?'selected':''}>Quick Match</option><option value="full" ${m.mode==='full'?'selected':''}>Full Match</option></select></div><div><label>Rules</label><select data-cardfield="rule" data-id="${m.id}">${ruleOptions(m.rule||'Standard')}</select></div></div><div class="formrow"><div><label>Wrestler A</label><select data-cardfield="a" data-id="${m.id}">${cardParticipantOptions(m.a||m.teamA?.[0],m.id)}</select></div><div><label>Wrestler B</label><select data-cardfield="b" data-id="${m.id}">${cardParticipantOptions(m.b||m.teamB?.[0],m.id)}</select></div></div><div class="cardRunRow"><button class="secondary cardQuickBtn" data-cardquick="${m.id}">Run Quick</button>${result}</div></div>`;
 }
 const size=cardTeamSize(m.type);
 return `<div class="matchslot teamCardSlot"><div class="slotHeader"><input data-cardfield="label" data-id="${m.id}" value="${m.label}">${tools}</div><div class="tiny conditionalHelp">${cardTypeName(m.type)} requires ${size} wrestlers per side. Later matches can use Winner/Loser placeholders.</div><div class="formrow"><div><label>Match Type</label><select data-cardfield="type" data-id="${m.id}">${typeOpts}</select></div><div><label>Play Mode</label><select data-cardfield="mode" data-id="${m.id}"><option value="quick" ${(m.mode||'quick')==='quick'?'selected':''}>Quick Match</option><option value="full" ${m.mode==='full'?'selected':''}>Full Match</option></select></div><div><label>Rules</label><select data-cardfield="rule" data-id="${m.id}">${ruleOptions(m.rule||'Standard')}</select></div></div>${renderTeamSelectors(m)}<div class="cardRunRow"><button class="secondary cardQuickBtn" data-cardquick="${m.id}">Run Quick</button>${result}</div></div>`;
}
function renderCardBuilder(opts:string){
 const eventTypes:EventType[] = ['House Show','TV Show','Premium TV','Small PPV','Major PPV','Biggest PPV'];
 const eventOpts = eventTypes.map(e=>`<option value="${e}" ${eventCard.eventType===e?'selected':''}>${e}</option>`).join('');
 const typeOpts=(m:CardMatch)=>`<option value="singles" ${m.type==='singles'?'selected':''}>Singles</option><option value="tag" ${m.type==='tag'?'selected':''}>Tag Team</option><option value="sixManTag" ${m.type==='sixManTag'?'selected':''}>6-Man Tag</option><option value="eightManTag" ${m.type==='eightManTag'?'selected':''}>8-Man Tag</option><option value="survivorSeries4" ${m.type==='survivorSeries4'||m.type==='survivorSeries'?'selected':''}>Survivor Series 4 vs 4</option>
<option value="survivorSeries5" ${m.type==='survivorSeries5'?'selected':''}>Survivor Series 5 vs 5</option><option value="battleRoyal" ${m.type==='battleRoyal'?'selected':''}>Battle Royal</option><option value="royalRumble" ${m.type==='royalRumble'?'selected':''}>Royal Rumble</option><option value="tagBattleRoyal" ${m.type==='tagBattleRoyal'?'selected':''}>Tag Team Battle Royal</option><option value="bunkhouseBattleRoyal" ${m.type==='bunkhouseBattleRoyal'?'selected':''}>Bunkhouse Battle Royal</option><option value="warGames" ${m.type==='warGames'?'selected':''}>WarGames</option>`;
 return `<div class="card"><h2>Card Builder</h2><div class="formrow"><div><label>Show Name</label><input id="cardName" value="${eventCard.name}"></div><div><label>Event Type</label><select id="cardEventType">${eventOpts}</select></div></div><div class="formrow"><div><label>Date</label><input id="cardDate" value="${eventCard.date}"></div><div><label>Venue</label><select id="cardVenue">${venueOptions()}</select></div></div><div class="formrow"><div><label>Matches</label><select id="cardMatches">${[5,6,7,8,9,10,12].map(n=>`<option ${eventCard.matches.length===n?'selected':''}>${n}</option>`).join('')}</select></div><div><label>Current Universe</label><div class="staticField">${territories.find(x=>x.id===currentTerritory)?.name || currentTerritory}</div></div></div><div class="cardBuilderActions"><button id="createCard">Create / Reset Card</button><button id="addCardMatch" class="secondary">Add Match</button><button id="saveCard" class="secondary">Save Card</button><button id="returnFederation" class="secondary">Return to Federation</button></div><div class="tiny conditionalHelp">Later matches can use card-result placeholders like Winner of Match 1 / Loser of Match 1. Battle Royal/Royal Rumble slots can be random or selected, then feed winners into later matches. Save Card keeps the card in this universe so you can return and keep editing.</div>${renderBookingAdvisor()}<div class="matchlist">${eventCard.matches.map(m=>renderCardMatchSlot(m,typeOpts(m))).join('')}</div><div class="cardBuilderActions bottom"><button id="saveCardBottom" class="secondary">Save Card</button><button id="returnFederationBottom" class="secondary">Return to Federation</button></div><h3>Saved Results</h3><div class="miniLog">${eventCard.history.map(h=>`<div>${h}</div>`).join('')||'<div class="tiny">No results yet.</div>'}</div></div>`;
}
function renderSpecial(opts:string){
 const rows=roster().sort((a,b)=>a.rank-b.rank).map(w=>`<label class="entrantRow"><input type="checkbox" class="entrantCheck" value="${w.id}"><span>${w.name}</span><em>${w.pp} PP · BR ${w.brAdj>=0?'+':''}${w.brAdj}</em></label>`).join('');
 return `<div class="specialLayout"><div class="card specialSetup"><h2>Battle Royal / Royal Rumble</h2><p class="tiny">Check every wrestler you want in the match. Royal Rumble entrant order is randomized from the checked wrestlers.</p><div class="entrantTools"><button id="selectAllEntrants" class="secondary">Select All</button><button id="clearEntrants" class="secondary">Clear</button><button id="random20Entrants" class="secondary">Random 20</button></div><div id="entrantChecklist" class="entrantChecklist">${rows}</div><div class="formrow"><button id="runBattle">Sim Battle Royal</button><button id="runRumble">Sim Royal Rumble</button></div></div><div class="card specialAction"><h2>Action / Results</h2><div id="specialResult" class="specialResultEmpty"><p class="tiny">Start or sim the match to see the winner, eliminations, and major action here.</p></div></div></div>`;
}
function renderDatabase(){
 const teams=territoryRankedTeams(currentTerritory).map((t,i)=>`<div class="dbRow"><strong>#${i+1} ${t.name}</strong><span>${t.rating||'D'} · ${t.rankingPoints?`${t.rankingPoints} RP · `:''}${t.members.map(id=>byId(id)?.name||id).join(' & ')}</span></div>`).join('');
 const wrestlers=territoryRankedWrestlers(currentTerritory).slice(0,30).map((w,i)=>`<div class="dbRow"><strong>#${i+1} ${w.name}</strong><span>${w.pp} PP · ${w.qpr}</span></div>`).join('');
 const mgrs=eligibleManagers().filter(m=>m.id!=='none').map(m=>`<div class="dbRow"><strong>${m.name}</strong><span>${m.stable.join(', ') || 'No stable listed'}</span></div>`).join('');
 return `<div class="card"><h2>Territory Database</h2><div class="tiny">Loaded for this territory: ${roster().length} wrestlers, ${eligibleTagTeams().length} official teams, ${eligibleManagers().filter(m=>m.id!=='none').length} managers. Official matches update stored PP/RP; exhibitions do not.</div><button id="resetRankings" class="secondary wide">Reset Stored Rankings / Points</button><h3>Singles Rankings</h3><div class="dbList">${wrestlers}</div><h3>Official Teams</h3><div class="dbList">${teams||'<div class="tiny">No official teams loaded.</div>'}</div><h3>Managers / Stables</h3><div class="dbList">${mgrs||'<div class="tiny">No managers loaded.</div>'}</div></div>`;
}
function getSelectedEntrants(){ let ids=Array.from(document.querySelectorAll<HTMLInputElement>('.entrantCheck:checked')).map(o=>o.value); if(ids.length<2) ids=roster().slice(0,20).map(w=>w.id); return ids; }
function shuffleIds(ids:string[]){ return [...ids].sort(()=>Math.random()-.5); }

render();
