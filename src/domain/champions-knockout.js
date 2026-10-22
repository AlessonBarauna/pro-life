(function(root){
"use strict";
// PRO-LIFE Champions knockout: deterministic, persisted, no fabricated retroactive outcomes.
const STAGES=[{key:"playoffs",name:"Playoffs",legs:2,days:[218,225]},{key:"round16",name:"Oitavas",legs:2,days:[246,253]},{key:"quarters",name:"Quartas",legs:2,days:[274,281]},{key:"semis",name:"Semifinais",legs:2,days:[302,309]},{key:"final",name:"Final",legs:1,days:[330]}];
const EuropeanCalendar=()=>root.ProLifeEuropeanCalendar||
  (typeof require==="function"?require("./european-calendar.js"):null);
const STAGE_KEYS={playoffs:"playoff",round16:"round16",quarters:"quarterfinal",semis:"semifinal",final:"final"};
function stageDay(ed,stage,leg){
  if(ed?.calendarMode!=="european_v1")return null;
  const cal=EuropeanCalendar();
  return cal?.uefaKnockoutDates?.(ed.season,"ucl",STAGE_KEYS[stage])?.[leg]??null;
}
const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
function rank(ed){
  if(!Array.isArray(ed?.entrants)||ed.entrants.length!==36||!Array.isArray(ed?.leagueSchedule?.matches))throw Error("Champions incompleta");
  const rows=new Map(ed.entrants.map(x=>[x[0],{id:x[0],p:0,gd:0,gf:0,w:0,awayGoals:0}]));
  if(rows.size!==36)throw Error("Inscricoes duplicadas");
  const fixtures=ed.leagueSchedule.matches;
  if(fixtures.length!==144||fixtures.some(x=>!x.played))throw Error("Fase de liga nao concluida");
  for(const m of fixtures){
    if(!Number.isInteger(m.hg)||!Number.isInteger(m.ag)||m.hg<0||m.ag<0)throw Error("Placar invalido");
    const a=rows.get(m.homeId),b=rows.get(m.awayId);if(!a||!b||a===b)throw Error("Confronto invalido");
    a.gf+=m.hg;a.gd+=m.hg-m.ag;b.gf+=m.ag;b.gd+=m.ag-m.hg;b.awayGoals+=m.ag;
    if(m.hg>m.ag){a.p+=3;a.w++}else if(m.ag>m.hg){b.p+=3;b.w++}else{a.p++;b.p++}
  }
  return [...rows.values()].sort((a,b)=>b.p-a.p||b.gd-a.gd||b.gf-a.gf||b.awayGoals-a.awayGoals||b.w-a.w||a.id.localeCompare(b.id)).map((r,i)=>({...r,position:i+1,status:i<8?"round16":i<24?"playoffs":"out"}));
}
function pairsFor(stage,qualified,ranking){
  if(stage==="playoffs")return Array.from({length:8},(_,i)=>[ranking[8+i].id,ranking[23-i].id]);
  if(stage==="round16")return Array.from({length:8},(_,i)=>[qualified[i],ranking[7-i].id]);
  return Array.from({length:qualified.length/2},(_,i)=>[qualified[i*2],qualified[i*2+1]]);
}
function fixtureObjects(stage,pairs,base,season,ed){
  const def=STAGES.find(x=>x.key===stage);
  return pairs.flatMap(([first,second],pi)=>Array.from({length:def.legs},(_,li)=>({
    id:`ucl:${season}:${stage}:${pi}:${li}`,stage,pair:pi,leg:li+1,
    day:stageDay(ed,stage,li)??(base+def.days[li]),homeId:li===0?first:second,awayId:li===0?second:first,
    played:false
  })));
}
function initialize(ed,day){
  if(ed.knockout)return ed.knockout;
  const ranking=rank(ed);
  const base=(Number(ed.season)-2026)*365;
  if(day>(stageDay(ed,"playoffs",0)??(base+STAGES[0].days[0])))throw Error("Mata-mata retroativo bloqueado");
  const result={version:1,status:"playoffs",ranking,stages:[],championId:null};
  const pairs=pairsFor("playoffs",null,ranking);
  result.stages.push({key:"playoffs",matches:fixtureObjects("playoffs",pairs,base,ed.season,ed),winners:null});
  ed.knockout=result;
  return result;
}
function unit(seed){let h=hash(seed);h^=h>>>16;h=Math.imul(h,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967296;}
// Prorrogacao (30 min) e penaltis deterministicos: a mesma semente sempre gera o mesmo desfecho (idempotente e persistente).
function extraTimeGoals(seed){const u=unit(seed);return u<0.66?0:u<0.94?1:2;}
function shootout(seed){
  const kicks=[[],[]],score=[0,0],P=0.76;
  const take=(t,n)=>{const ok=unit(`${seed}|k${n}|${t}`)<P;kicks[t].push(ok?1:0);if(ok)score[t]++;};
  for(let n=0;n<5;n++){
    for(const t of [0,1]){
      take(t,n);
      const rem0=5-kicks[0].length,rem1=5-kicks[1].length;
      if(score[0]>score[1]+rem1||score[1]>score[0]+rem0)return {score,kicks};
    }
  }
  for(let n=5;n<10;n++){take(0,n);take(1,n);if(score[0]!==score[1])break;}
  if(score[0]===score[1]){const w=unit(`${seed}|last`)<0.5?0:1;kicks[w].push(1);kicks[1-w].push(0);score[w]++;}
  return {score,kicks};
}
// Desempate do confronto: agregado -> prorrogacao -> penaltis. Gols fora de casa nao contam (regra UEFA desde 2021/22).
function resolveTie(teams,scores,seed){
  if(scores[0]>scores[1])return {winnerIdx:0,decidedBy:"aggregate",extraTime:null,penalties:null};
  if(scores[1]>scores[0])return {winnerIdx:1,decidedBy:"aggregate",extraTime:null,penalties:null};
  const et=[extraTimeGoals(`${seed}|et|0`),extraTimeGoals(`${seed}|et|1`)];
  if(et[0]!==et[1])return {winnerIdx:et[0]>et[1]?0:1,decidedBy:"extra_time",extraTime:et,penalties:null};
  const pk=shootout(`${seed}|pen`);
  return {winnerIdx:pk.score[0]>pk.score[1]?0:1,decidedBy:"penalties",extraTime:et,penalties:pk};
}
function decide(a,b,seed){
  if(a>b)return 0;if(b>a)return 1;
  return resolveTie(null,[a,b],seed).winnerIdx;
}
function stageWinners(st){
  if(st.matches.some(m=>!m.played))return null;
  const pairs=new Map();
  for(const m of st.matches){if(!pairs.has(m.pair))pairs.set(m.pair,[]);pairs.get(m.pair).push(m)}
  const winners=[];
  for(const [i,ms] of [...pairs.entries()].sort((a,b)=>a[0]-b[0])){
    const teams=[ms[0].homeId,ms[0].awayId];
    const scores=teams.map(id=>ms.reduce((n,m)=>n+(m.homeId===id?m.hg:m.ag),0));
    const r=resolveTie(teams,scores,`${ms[0].id}|penalties`);
    winners.push(teams[r.winnerIdx]);
    const tie={teams,aggregate:scores,winnerId:teams[r.winnerIdx],decidedBy:r.decidedBy,extraTime:r.extraTime,penalties:r.penalties?{score:r.penalties.score,kicks:r.penalties.kicks}:null};
    for(const m of ms){m.winnerId=teams[r.winnerIdx];m.tie=tie;if(r.decidedBy!=="aggregate")m.decidedBy=r.decidedBy;}
  }
  return winners;
}
function advance(ed){
  const ko=ed.knockout;if(!ko)return false;
  let changed=false;
  while(true){
    const stage=ko.stages[ko.stages.length-1];if(!stage)return changed;
    if(!stage.winners){const ws=stageWinners(stage);if(!ws)return changed;stage.winners=ws;changed=true;}
    if(stage.key==="final"){ko.status="completed";ko.championId=stage.winners[0];return true;}
    const ix=STAGES.findIndex(x=>x.key===stage.key);
    const next=STAGES[ix+1];
    if(ko.stages.some(x=>x.key===next.key))return changed;
    const pool=next.key==="round16"?stage.winners:stage.winners;
    const pairs=pairsFor(next.key,pool,ko.ranking);
    const base=(Number(ed.season)-2026)*365;
    ko.stages.push({key:next.key,matches:fixtureObjects(next.key,pairs,base,ed.season,ed),winners:null});
    ko.status=next.key;changed=true;
  }
}
function daily(s,ed,hooks){
  if(!ed?.leagueSchedule?.matches)return null;
  if(!ed.knockout){
    if(ed.leagueSchedule.matches.some(m=>!m.played))return null;
    initialize(ed,s.day);
  }
  const ko=ed.knockout;
  if(ko.status==="completed")return ko;
  const stage=ko.stages[ko.stages.length-1];
  for(const m of stage.matches){
    if(m.played||m.day>s.day)continue;
    const hero=["player","coach"].includes(s.mode)&&[m.homeId,m.awayId].includes(s.clubId);
    const fn=hero?hooks?.heroFixture:hooks?.otherFixture;
    if(typeof fn!=="function")continue;
    const score=fn(m,s);
    if(!score)continue;
    if(!Number.isInteger(score.hg)||!Number.isInteger(score.ag)||score.hg<0||score.ag<0)throw Error("Placar invalido");
    Object.assign(m,{played:true,hg:score.hg,ag:score.ag,playedDay:s.day});
  }
  advance(ed);return ko;
}
function nextFixture(s,ed,clubId){
  if(!clubId||!ed?.knockout)return null;
  const ko=ed.knockout;if(ko.status==="completed")return null;
  const st=ko.stages[ko.stages.length-1];
  return st?.matches.filter(m=>!m.played&&m.day>s.day&&[m.homeId,m.awayId].includes(clubId)).sort((a,b)=>a.day-b.day)[0]||null;
}
const api={STAGES,rank,initialize,daily,advance,nextFixture,stageWinners,resolveTie};
root.ProLifeChampionsKnockout=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
