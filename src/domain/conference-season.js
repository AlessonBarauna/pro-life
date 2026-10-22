(function(root){
"use strict";
// 33G - Actual league-phase match state/processing. No implicit qualification,
// no startup side effects; engine wiring must occur only after official access.
const Fixtures=typeof require==="function"?require("./conference-fixtures.js"):root.ProLifeConferenceFixtures;
const Calendar=typeof require==="function"?require("./conference-calendar.js"):root.ProLifeConferenceCalendar;
function checkEdition(s,ed){
 if(!s||!ed||ed.comp!=="uecl"||(ed.season!==s.season&&!(ed.calendarMode==="european_v1"&&ed.season===s.season-1&&ed.leagueSchedule)))throw Error("Edicao Conference invalida");
 if(ed.status!=="ready"||!Array.isArray(ed.entrants)||ed.entrants.length!==36||new Set(ed.entrants.map(e=>e[0])).size!==36)throw Error("36 classificados distintos obrigatorios");
 if(ed.qualificationVerified!==true||ed.qualificationSource!=="official-access-and-playoffs")throw Error("Acesso oficial e playoffs ainda nao comprovados");
}
function prepare(s,ed,options={}){
 checkEdition(s,ed);
 if(ed.leagueSchedule){
  const m=ed.leagueSchedule.matches;
  if(!Array.isArray(m)||m.length!==108||new Set(m.map(x=>x.id)).size!==108)throw Error("Calendario salvo invalido");
  return ed.leagueSchedule;
 }
 const startDay=options.startDay;
 if(!Number.isInteger(startDay)||startDay<=s.day)throw Error("Inicio da Conference deve ser futuro");
 if(!Array.isArray(options.reserved)||!options.domesticCalendarComplete)throw Error("Calendario domestico e continental completo obrigatorio");
 const generated=Fixtures.generate(ed);
 const plan=Calendar.preview(ed,generated.matches,{startDay,stepDays:options.stepDays||21,maxOffset:options.maxOffset??6,reserved:options.reserved});
 if(!plan.ready||plan.matches.length!==108||plan.matches.some(m=>m.day<=s.day))throw Error("Datas da Conference conflitantes ou retroativas");
 // Additionally enforce minimum three full days of rest against every supplied game.
 const byClub=new Map();
 for(const m of [...options.reserved,...plan.matches]){
  if(!Number.isInteger(m.day)||!m.homeId||!m.awayId)throw Error("Reserva de calendario invalida");
  for(const id of [m.homeId,m.awayId]){if(!byClub.has(id))byClub.set(id,[]);byClub.get(id).push(m.day);}
 }
 for(const days of byClub.values()){
  days.sort((a,b)=>a-b);
  for(let i=1;i<days.length;i++)if(days[i]-days[i-1]<4)throw Error("Descanso insuficiente no calendario");
 }
 const schedule={version:1,phase:"league",qualificationSource:ed.qualificationSource,matches:plan.matches.map(m=>({id:m.id,round:m.round,day:m.day,homeId:m.homeId,awayId:m.awayId,played:false}))};
 ed.leagueSchedule=schedule;
 return schedule;
}
function processDay(s,ed,hooks={}){
 checkEdition(s,ed);
 const schedule=ed.leagueSchedule;
 if(!schedule||!Array.isArray(schedule.matches)||schedule.matches.length!==108)throw Error("Conference ainda nao agendada");
 let played=0,waitingHero=0;
 for(const match of schedule.matches){
  if(match.played||match.day>s.day)continue;
  const isHero=s.mode==="player"&&[match.homeId,match.awayId].includes(s.clubId);
  const resolve=isHero?hooks.heroFixture:hooks.otherFixture;
  if(typeof resolve!=="function"){if(isHero)waitingHero++;continue;}
  const result=resolve(match,s);
  if(result==null){if(isHero)waitingHero++;continue;}
  if(!Number.isInteger(result.hg)||!Number.isInteger(result.ag)||result.hg<0||result.ag<0||result.hg>99||result.ag>99)throw Error("Resultado da Conference invalido");
  Object.assign(match,{played:true,hg:result.hg,ag:result.ag,playedDay:s.day});played++;
 }
 return {played,waitingHero,totalPlayed:schedule.matches.filter(m=>m.played).length,totalPending:schedule.matches.filter(m=>!m.played).length};
}
const api={prepare,processDay,checkEdition};root.ProLifeConferenceSeason=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
