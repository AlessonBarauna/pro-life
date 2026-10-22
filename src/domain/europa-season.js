(function(root){
"use strict";
// 34F.32B.4B - Estado e registro idempotente da Europa.
// Nao integra automaticamente ao motor principal.

const Calendar=typeof require==="function"
  ?require("./europa-calendar.js")
  :root.ProLifeEuropaCalendar;

function prepare(s,C,W, options={}){
  const ed=C.activeEdition?.(s,"uel")||C.edition(s,"uel");
  if(!ed)throw Error("Edicao da Europa inexistente.");

  if(ed.leagueSchedule){
    if(!Array.isArray(ed.leagueSchedule.matches))
      throw Error("Calendario continental salvo invalido.");
    return ed.leagueSchedule;
  }

  // Career migrated after the normal opening window: schedule a fresh
  // eight-round phase entirely in the future; never synthesize past results.
  const firstNormal=C.windows(ed.season,"uel")[0];
  const seasonBase=(Number(ed.season)-2026)*365;
  const recovery=!!options.recover && s.day>=firstNormal;
  let calendar=C;
  if(recovery){
    const koStart=seasonBase+218;
    // Eight league rounds, two weeks between; must finish before knockouts.
    const lastStart=koStart-14;
    const firstStart=s.day+4;
    const gap=[11,10,9,8,7].find(g=>firstStart+7*g<=lastStart);
    if(!gap)
      throw Error("Recuperacao da Europa inviavel: janela eliminatoria ja muito proxima.");
    const chosen=Array.from({length:8},(_,i)=>firstStart+gap*i);
    calendar=Object.create(C);
    calendar.windows=function(year,comp){
      return year===ed.season&&comp==="uel"?chosen:C.windows(year,comp);
    };
  }
  const plan=Calendar.create(s,calendar,W);

  if(!plan.complete||plan.matches.length!==144)
    throw Error("Calendario continental incompleto.");

  const firstDay=Math.min(...plan.matches.map(m=>m.day));

  // Nao inventar resultados de jogos anteriores em saves legados.
  if(s.day>=firstDay)
    throw Error("Temporada continental ja iniciada; nao criar historico retroativo.");

  ed.leagueSchedule={
    version:1,
    phase:"league",
    ...(recovery?{recovered:true,recoveredAtDay:s.day}:{}),
    matches:plan.matches.map(m=>({
      id:m.id,
      round:m.round,
      day:m.day,
      homeId:m.homeId,
      awayId:m.awayId,
      played:false
    }))
  };

  return ed.leagueSchedule;
}

function pending(s,C,W){
  const schedule=prepare(s,C,W);
  return schedule.matches.filter(m=>!m.played&&m.day>=s.day);
}

function validateResult(result){
  if(!result||!Number.isInteger(result.hg)||
     !Number.isInteger(result.ag)||
     result.hg<0||result.ag<0||
     result.hg>99||result.ag>99)
    throw Error("Placar continental invalido.");
}

function processDay(s,C,W,hooks={}){
  const schedule=prepare(s,C,W);
  const due=schedule.matches.filter(m=>!m.played&&m.day<=s.day);

  let played=0;
  let waitingHero=0;

  for(const match of due){
    const isHero=s.mode==="player"&&
      [match.homeId,match.awayId].includes(s.clubId);

    const resolver=isHero?hooks.heroFixture:hooks.otherFixture;

    // A partida do protagonista nunca e resolvida automaticamente
    // por um gerador de placar de outros clubes.
    if(typeof resolver!=="function"){
      if(isHero)waitingHero++;
      continue;
    }

    const result=resolver(match,s);
    if(result==null){
      if(isHero)waitingHero++;
      continue;
    }

    validateResult(result);

    Object.assign(match,{
      played:true,
      hg:result.hg,
      ag:result.ag,
      playedDay:s.day
    });

    played++;
  }

  return {
    played,
    waitingHero,
    totalPlayed:schedule.matches.filter(m=>m.played).length,
    totalPending:schedule.matches.filter(m=>!m.played).length
  };
}

const api={prepare,pending,processDay};
root.ProLifeEuropaSeason=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);