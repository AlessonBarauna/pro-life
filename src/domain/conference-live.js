(function(root){
"use strict";
// Adapted playable UECL mode, separate from official access pipeline.
const Fixtures=root.ProLifeConferenceFixtures||(typeof require==="function"?require("./conference-fixtures.js"):null);
const KO=root.ProLifeConferenceKnockout||(typeof require==="function"?require("./conference-knockout.js"):null);
function valid(ed){return !!(ed&&ed.comp==="uecl"&&ed.status==="ready"&&ed.entrants?.length===36&&new Set(ed.entrants.map(x=>x[0])).size===36);}
function prepare(s,ed){
 if(!valid(ed))return null;
 if(ed.leagueSchedule){if(ed.leagueSchedule.matches?.length!==108)throw Error("Conference: calendario persistido invalido");return ed.leagueSchedule;}
 const cal=root.ProLifeEuropeanCalendar||(typeof require==="function"?require("./european-calendar.js"):null);
 const windows=ed.calendarMode==="european_v1"?cal?.uefaLeagueWindows?.(ed.season,"uecl"):null;
 const base=(Number(ed.season)-2026)*365;
 if(s.day>=(windows?.[0]??(base+140)))return null; // Never fabricate past fixtures
 const generated=Fixtures.generate(ed);
 if(generated.matches?.length!==108)throw Error("Conference: sorteio incompleto");
 // Distinct UEFA entrants: never overwrite domestic/other continental calendar.
 const matches=generated.matches.map(m=>({...m,day:windows?.[m.round-1]??(base+140+(m.round-1)*12),played:false}));
 if(new Set(matches.map(m=>m.id)).size!==108)throw Error("Conference: identificadores repetidos");
 ed.leagueSchedule={version:1,phase:"league",qualificationSource:"adapted-domestic-merit",matches};
 ed.accessNote="Vagas adaptadas ao catalogo PRO-LIFE. Qualificatorias UEFA completas nao simuladas.";
 return ed.leagueSchedule;
}
function daily(s,ed,hooks={}){
 if(!ed?.leagueSchedule?.matches||!valid(ed))return null;
 let count=0;
 for(const m of ed.leagueSchedule.matches){
  if(m.played||m.day>s.day)continue;
  const hero=s.mode==="player"&&[m.homeId,m.awayId].includes(s.clubId);
  const solve=hero?hooks.heroFixture:hooks.otherFixture;
  if(typeof solve!=="function")continue;
  const r=solve(m,s);if(!r)continue;
  if(!Number.isInteger(r.hg)||!Number.isInteger(r.ag)||Math.min(r.hg,r.ag)<0||Math.max(r.hg,r.ag)>99)throw Error("Conference: placar invalido");
  Object.assign(m,{played:true,hg:r.hg,ag:r.ag,playedDay:s.day});count++;
 }
 if(ed.leagueSchedule.matches.every(m=>m.played))KO?.daily(s,ed,hooks);
 return {played:count,leaguePlayed:ed.leagueSchedule.matches.filter(m=>m.played).length,championId:ed.knockout?.championId||null};
}
const api={prepare,daily,valid};root.ProLifeConferenceLive=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
