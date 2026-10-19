(function(root){
"use strict";
// Motor parametrizado CONMEBOL: Libertadores e Sul-Americana.
// Persistente, deterministico, sem resultados retroativos e sem clubes ficticios.
const VERSION=2,GROUPS=8,SIZE=4;
const DEFS={
  lib:{name:"CONMEBOL Libertadores",finalDay:309,stages:[
    {key:"round16",name:"Oitavas de final",legs:2,days:[218,225]},
    {key:"quarters",name:"Quartas de final",legs:2,days:[246,253]},
    {key:"semis",name:"Semifinais",legs:2,days:[274,281]},
    {key:"final",name:"Final",legs:1,days:[309]}
  ]},
  sud:{name:"CONMEBOL Sul-Americana",finalDay:310,stages:[
    {key:"playoffs",name:"Playoffs",legs:2,days:[190,197]},
    {key:"round16",name:"Oitavas de final",legs:2,days:[218,225]},
    {key:"quarters",name:"Quartas de final",legs:2,days:[246,253]},
    {key:"semis",name:"Semifinais",legs:2,days:[274,281]},
    {key:"final",name:"Final",legs:1,days:[310]}
  ]}
};
const hash=value=>{let h=2166136261;for(const c of String(value))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
const unit=value=>hash(value)/4294967296;
const baseDay=season=>(Number(season)-2026)*365;
const clubOf=(s,id)=>(s.clubs||[]).find(c=>c.id===id)||(s.globalFootball?.clubs||[]).find(c=>c.id===id)||null;
const strength=(s,id)=>{const c=clubOf(s,id);return Number(c?.strength??c?.structure??c?.reputation??60);};
const participantsOf=ed=>ed?.tournamentEntrants||(ed?.entrants||[]).concat(ed?.supplementalEntrants||[]);
function attachSerialization(ed,schedule){
  if(!schedule||schedule._compactAttached)return schedule;
  Object.defineProperty(schedule,"_compactAttached",{value:true,enumerable:false,configurable:true});
  Object.defineProperty(schedule,"toJSON",{enumerable:false,configurable:true,value(){
    const ids=participantsOf(ed).map(x=>x[0]),index=new Map(ids.map((id,i)=>[id,i]));
    return {version:VERSION,phase:schedule.phase,compact:(schedule.matches||[]).map(m=>{const row=[m.group.charCodeAt(0)-65,m.round,Number(String(m.id).split(":").at(-1)),m.day,index.get(m.homeId),index.get(m.awayId)];if(m.played)row.push(m.hg,m.ag,m.playedDay??m.day);return row;})};
  }});
  return schedule;
}
function hydrate(ed){
  const schedule=ed?.leagueSchedule;if(!schedule)return null;
  if(!Array.isArray(schedule.matches)&&Array.isArray(schedule.compact)){
    const ids=participantsOf(ed).map(x=>x[0]);
    schedule.matches=schedule.compact.map(row=>{const legacy=Number(schedule.version||1)<2,[gi,round,pi,day,hi,ai]=row,played=legacy?!!row[6]:row.length>6,hg=legacy?row[7]:row[6],ag=legacy?row[8]:row[7],playedDay=legacy?row[9]:row[8],group=String.fromCharCode(65+gi),m={id:`${ed.comp}:${ed.season}:group:${group}:${round}:${pi}`,phase:"groups",stage:`Grupo ${group} · Rodada ${round}`,group,round,day,homeId:ids[hi],awayId:ids[ai],played};if(played){m.hg=hg;m.ag=ag;m.playedDay=playedDay;}return m;});
  }
  return attachSerialization(ed,schedule);
}
function validEdition(ed,comp,entrants){return !!(ed&&ed.comp===comp&&["ready","adapted","playing","completed"].includes(ed.status)&&entrants?.length===32&&new Set(entrants.map(x=>x[0])).size===32);}
function completeParticipants(s,C,ed){
  if(!ed||ed.entrants?.length<16)return [];
  const entrants=ed.entrants.map(row=>row.slice());
  if(entrants.length>=32)return entrants;
  const used=new Set(entrants.map(x=>x[0])),claimed=new Set(),all=[];
  for(const other of Object.values(s.continental?.editions||{}))if(other!==ed&&other?.comp==="lib")for(const row of other.entrants||[])claimed.add(row[0]);
  for(const association of C.associations(s).conmebol||[]){
    const ids=association.mode==="local"?(s.clubs||[]).filter(c=>c.leagueId===association.leagueId).map(c=>c.id):association.mode==="pool"?(association.ids||[]):(s.globalFootball?.clubs||[]).filter(c=>c.leagueId===association.leagueId).map(c=>c.id);
    for(const id of ids)if(!used.has(id)&&!claimed.has(id))all.push([id,association.code,"vaga-complementar"]);
  }
  all.sort((a,b)=>strength(s,b[0])-strength(s,a[0])||hash(`${ed.key}:${a[0]}`)-hash(`${ed.key}:${b[0]}`));
  for(const row of all){if(entrants.length>=32)break;if(used.has(row[0]))continue;entrants.push([...row,entrants.length+1]);used.add(row[0]);}
  return entrants;
}
function drawGroups(s,ed,participants){
  const entries=participants.map(x=>({id:x[0],country:x[1],seed:strength(s,x[0])})).sort((a,b)=>b.seed-a.seed||hash(`${ed.key}:${a.id}`)-hash(`${ed.key}:${b.id}`));
  const groups=Array.from({length:GROUPS},(_,i)=>({id:String.fromCharCode(65+i),clubIds:[],countries:[]}));
  for(let pot=0;pot<4;pot++){
    const rows=entries.slice(pot*8,pot*8+8).sort((a,b)=>hash(`${ed.key}:pot:${pot}:${a.id}`)-hash(`${ed.key}:pot:${pot}:${b.id}`));
    for(const row of rows){
      const candidates=groups.filter(g=>g.clubIds.length===pot).sort((a,b)=>{
        const ac=a.countries.includes(row.country)?1:0,bc=b.countries.includes(row.country)?1:0;
        return ac-bc||hash(`${ed.key}:${row.id}:${a.id}`)-hash(`${ed.key}:${row.id}:${b.id}`);
      });
      const group=candidates[0];if(!group)throw Error(`${ed.comp}: sorteio de grupos incompleto`);
      group.clubIds.push(row.id);group.countries.push(row.country);
    }
  }
  return groups.map(g=>({id:g.id,clubIds:g.clubIds}));
}
function groupPairs(ids){
  if(ids.length!==4)throw Error("Grupo CONMEBOL precisa de quatro clubes.");
  const [a,b,c,d]=ids;
  const first=[[[a,d],[b,c]],[[d,c],[a,b]],[[b,d],[c,a]]];
  return [...first,...first.map(round=>round.map(([h,v])=>[v,h]))];
}
function domesticDays(s,W,clubId,season){
  const local=(s.clubs||[]).find(c=>c.id===clubId);
  if(local){const out=new Set(),base=baseDay(season);(s.fixtures||[]).forEach((round,i)=>{if(round.some(p=>p.includes(clubId)))out.add(base+Number(s.calendarDays?.[i]??7+i*21));});return out;}
  const club=(s.globalFootball?.clubs||[]).find(c=>c.id===clubId),leagueId=club?.leagueId;
  const state=s.globalFootball?.worldCompetitions?.leagues?.[leagueId];
  if(!state||Number(state.season)!==Number(season))return new Set();
  const rounds=2*(state.clubIds.length%2?state.clubIds.length:state.clubIds.length-1),out=new Set();
  for(let i=0;i<rounds;i++)out.add(W.roundDate(season,i,rounds));
  return out;
}
function continentalBusy(s,clubId,ignoreKey){
  const out=new Set();
  for(const ed of Object.values(s.continental?.editions||{})){
    if(ed.key===ignoreKey)continue;
    for(const m of [...(ed.leagueSchedule?.matches||[]),...(ed.knockout?.stages||[]).flatMap(st=>st.matches||[])])if([m.homeId,m.awayId].includes(clubId))out.add(m.day);
  }
  return out;
}
function matchDay(s,W,ed,home,away,start){
  const busyH=new Set([...domesticDays(s,W,home,ed.season),...continentalBusy(s,home,ed.key)]),busyA=new Set([...domesticDays(s,W,away,ed.season),...continentalBusy(s,away,ed.key)]);
  for(let d=start;d<start+5;d++)if(!busyH.has(d)&&!busyA.has(d)&&!busyH.has(d-1)&&!busyH.has(d+1)&&!busyA.has(d-1)&&!busyA.has(d+1))return d;
  for(let d=start;d<start+5;d++)if(!busyH.has(d)&&!busyA.has(d))return d;
  return start;
}
function prepare(s,C,W,comp){
  const ed=C.edition(s,comp),def=DEFS[comp],participants=completeParticipants(s,C,ed);if(!def||!validEdition(ed,comp,participants))return null;
  if(ed.leagueSchedule){const saved=hydrate(ed);if(saved.matches?.length!==96)throw Error(`${def.name}: calendario persistido invalido`);return saved;}
  const starts=C.windows(ed.season,comp).slice(0,6);
  if(starts.length!==6)throw Error(`${def.name}: janelas de grupos incompletas`);
  if(s.day>=starts[0]){ed.simulationStatus="not_scheduled_legacy";return null;}
  const groups=drawGroups(s,ed,participants),matches=[];
  for(const group of groups)groupPairs(group.clubIds).forEach((pairs,ri)=>pairs.forEach(([homeId,awayId],pi)=>matches.push({
    id:`${comp}:${ed.season}:group:${group.id}:${ri+1}:${pi}`,phase:"groups",stage:`Grupo ${group.id} · Rodada ${ri+1}`,group:group.id,round:ri+1,
    day:matchDay(s,W,ed,homeId,awayId,starts[ri]),homeId,awayId,played:false
  })));
  if(matches.length!==96||new Set(matches.map(m=>m.id)).size!==96)throw Error(`${def.name}: calendario de grupos incompleto`);
  if(participants.length>ed.entrants.length)ed.supplementalEntrants=participants.slice(ed.entrants.length);
  delete ed.tournamentEntrants;
  ed.groups=groups;ed.leagueSchedule=attachSerialization(ed,{version:VERSION,phase:"groups",matches});ed.simulationStatus="scheduled";
  return ed.leagueSchedule;
}
function standings(ed,groupId=null){
  const groups=(ed?.groups||[]).filter(g=>groupId==null||g.id===groupId),matches=hydrate(ed)?.matches||[],out=[];
  for(const group of groups){
    const map=new Map(group.clubIds.map(id=>[id,{id,group:group.id,played:0,wins:0,draws:0,losses:0,gf:0,ga:0,gd:0,points:0}]));
    for(const m of matches.filter(x=>x.played&&x.group===group.id))for(const [id,gf,ga] of [[m.homeId,m.hg,m.ag],[m.awayId,m.ag,m.hg]]){const r=map.get(id);if(!r)continue;r.played++;r.gf+=gf;r.ga+=ga;if(gf>ga){r.wins++;r.points+=3}else if(gf===ga){r.draws++;r.points++}else r.losses++;}
    const rows=[...map.values()];for(const r of rows)r.gd=r.gf-r.ga;
    rows.sort((a,b)=>b.points-a.points||b.gd-a.gd||b.gf-a.gf||b.wins-a.wins||a.id.localeCompare(b.id));
    out.push(...rows.map((r,i)=>({...r,position:i+1,status:i<2?"qualified":i===2?"third":"out"})));
  }
  return out;
}
function groupComplete(ed){const matches=hydrate(ed)?.matches;return matches?.length===96&&matches.every(m=>m.played);}
function stageFixtures(s,W,ed,stage,pairs){
  const def=DEFS[ed.comp].stages.find(x=>x.key===stage),base=baseDay(ed.season);
  return pairs.flatMap(([first,second],pi)=>Array.from({length:def.legs},(_,li)=>({
    id:`${ed.comp}:${ed.season}:${stage}:${pi}:${li}`,phase:"knockout",stage,stageName:def.name,pair:pi,leg:li+1,
    day:matchDay(s,W,ed,li===0?first:second,li===0?second:first,base+def.days[li]),homeId:li===0?first:second,awayId:li===0?second:first,played:false
  })));
}
function initialPairs(s,ed,libEd){
  const byGroup=new Map(ed.groups.map(g=>[g.id,standings(ed,g.id)]));
  if(ed.comp==="lib")return ed.groups.map((g,i)=>[byGroup.get(g.id)[0].id,byGroup.get(ed.groups[(i+1)%8].id)[1].id]);
  if(!groupComplete(libEd))return null;
  const runners=ed.groups.map(g=>byGroup.get(g.id)[1].id),thirds=libEd.groups.map(g=>standings(libEd,g.id)[2].id);
  return runners.map((id,i)=>[id,thirds[(i+1)%8]]);
}
function initializeKnockout(s,W,ed,libEd){
  if(ed.knockout)return ed.knockout;if(!groupComplete(ed))return null;
  const first=ed.comp==="lib"?"round16":"playoffs",pairs=initialPairs(s,ed,libEd);if(!pairs)return null;
  ed.knockout={version:VERSION,status:first,stages:[{key:first,name:DEFS[ed.comp].stages.find(x=>x.key===first).name,matches:stageFixtures(s,W,ed,first,pairs),winners:null}],championId:null,runnerUpId:null};
  return ed.knockout;
}
function resolveTie(matches){
  const teams=[matches[0].homeId,matches[0].awayId],score=teams.map(id=>matches.reduce((n,m)=>n+(m.homeId===id?m.hg:m.ag),0));
  if(score[0]!==score[1])return {winnerId:teams[score[0]>score[1]?0:1],aggregate:score,decidedBy:"aggregate"};
  const seed=matches[0].id+"|tie",et=[unit(seed+"|0")<.72?0:1,unit(seed+"|1")<.72?0:1];
  if(et[0]!==et[1])return {winnerId:teams[et[0]>et[1]?0:1],aggregate:score,extraTime:et,decidedBy:"extra_time"};
  const winner=unit(seed+"|pens")<.5?0:1,penalties=winner===0?[5,4]:[4,5];
  return {winnerId:teams[winner],aggregate:score,extraTime:et,penalties,decidedBy:"penalties"};
}
function stageWinners(stage){
  if(stage.matches.some(m=>!m.played))return null;const map=new Map();for(const m of stage.matches){if(!map.has(m.pair))map.set(m.pair,[]);map.get(m.pair).push(m);}
  const winners=[];for(const [,matches] of [...map.entries()].sort((a,b)=>a[0]-b[0])){const tie=resolveTie(matches);winners.push(tie.winnerId);for(const m of matches){m.winnerId=tie.winnerId;m.tie=tie;}}
  return winners;
}
function advance(s,W,ed,libEd){
  const ko=initializeKnockout(s,W,ed,libEd);if(!ko)return null;
  while(ko.status!=="completed"){
    const stage=ko.stages.at(-1);if(!stage.winners){stage.winners=stageWinners(stage);if(!stage.winners)return ko;}
    if(stage.key==="final"){ko.status="completed";ko.championId=stage.winners[0];const m=stage.matches[0];ko.runnerUpId=m.homeId===ko.championId?m.awayId:m.homeId;ed.championId=ko.championId;ed.runnerUpId=ko.runnerUpId;ed.status="completed";return ko;}
    const defs=DEFS[ed.comp].stages,ix=defs.findIndex(x=>x.key===stage.key),next=defs[ix+1];if(!next||ko.stages.some(x=>x.key===next.key))return ko;
    let qualified=stage.winners;if(ed.comp==="sud"&&next.key==="round16")qualified=[...ed.groups.map(g=>standings(ed,g.id)[0].id),...qualified];
    const pairs=Array.from({length:qualified.length/2},(_,i)=>[qualified[i],qualified[qualified.length-1-i]]);
    ko.stages.push({key:next.key,name:next.name,matches:stageFixtures(s,W,ed,next.key,pairs),winners:null});ko.status=next.key;
  }
  return ko;
}
function validateScore(r){return !!(r&&Number.isInteger(r.hg)&&Number.isInteger(r.ag)&&r.hg>=0&&r.ag>=0&&r.hg<=99&&r.ag<=99);}
function playDue(s,matches,hooks){let played=0,waiting=0;for(const m of matches){if(m.played||m.day>s.day)continue;const controlled=!!s.clubId&&[m.homeId,m.awayId].includes(s.clubId),fn=controlled?hooks?.heroFixture:hooks?.otherFixture;if(typeof fn!=="function"){if(controlled)waiting++;continue;}const r=fn(m,s);if(r==null){if(controlled)waiting++;continue;}if(!validateScore(r))throw Error("Placar CONMEBOL invalido");Object.assign(m,{played:true,hg:r.hg,ag:r.ag,playedDay:s.day});played++;}return {played,waiting};}
function daily(s,C,W,comp,hooks={}){
  const ed=C.edition(s,comp);if(!ed)return null;const schedule=prepare(s,C,W,comp);if(!schedule)return {played:0,waiting:0,status:ed.simulationStatus||ed.status};
  const groupResult=playDue(s,schedule.matches,hooks),libEd=C.edition(s,"lib");let ko=advance(s,W,ed,libEd);
  let knockoutResult={played:0,waiting:0};if(ko&&ko.status!=="completed"){knockoutResult=playDue(s,ko.stages.at(-1).matches,hooks);ko=advance(s,W,ed,libEd);}
  return {played:groupResult.played+knockoutResult.played,waiting:groupResult.waiting+knockoutResult.waiting,groupPlayed:schedule.matches.filter(m=>m.played).length,status:ko?.status||"groups",championId:ko?.championId||null};
}
function nextFixture(s,ed,clubId){
  if(!clubId||!ed)return null;const all=[...(hydrate(ed)?.matches||[]),...(ed.knockout?.stages||[]).flatMap(st=>st.matches||[])];
  return all.filter(m=>!m.played&&m.day>s.day&&[m.homeId,m.awayId].includes(clubId)).sort((a,b)=>a.day-b.day)[0]||null;
}
function audit(s,W,ed){
  const matches=[...(hydrate(ed)?.matches||[]),...(ed?.knockout?.stages||[]).flatMap(st=>st.matches||[])],seen=new Set(),issues=[];
  for(const m of matches){const key=`${m.day}:${m.homeId}`,away=`${m.day}:${m.awayId}`;if(seen.has(key)||seen.has(away))issues.push(`Clube com dois jogos no dia ${m.day}`);seen.add(key);seen.add(away);if(m.homeId===m.awayId)issues.push(`Autoconfronto ${m.id}`);}
  if(ed?.leagueSchedule&&ed.leagueSchedule.matches.length!==96)issues.push("Fase de grupos sem 96 partidas");
  return {ok:issues.length===0,issues,matches:matches.length};
}
const api={VERSION,DEFS,completeParticipants,hydrate,prepare,standings,groupComplete,initializeKnockout,advance,daily,nextFixture,audit,resolveTie};
root.ProLifeConmebolTournaments=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
