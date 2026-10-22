(function(root){
  "use strict";
  const VERSION=1;
  const LEAGUES={
    premier:"gf_fc27_premier_league",
    championship:"gf_fc27_efl_championship",
    leagueOne:"gf_fc27_efl_league_one",
    leagueTwo:"gf_fc27_efl_league_two"
  };
  const DEFS={
    fa_cup:{id:"fa_cup",name:"Emirates FA Cup",shortName:"FA Cup",europeanRoute:"uel"},
    efl_cup:{id:"efl_cup",name:"EFL Cup",shortName:"EFL Cup",europeanRoute:"uecl"},
    community_shield:{id:"community_shield",name:"FA Community Shield",shortName:"Community Shield",europeanRoute:null}
  };
  // Valores de simulacao centralizados e configuraveis; nao sao rotulados como cifras oficiais.
  const PRIZES={
    fa_cup:{round_1:41000,round_2:68000,round_3:105000,round_4:120000,round_5:225000,quarterfinal:450000,semifinal:1000000,runnerUp:2000000,winner:4000000},
    efl_cup:{round_1:5000,round_2:7000,round_3:10000,round_4:15000,quarterfinal:25000,semifinal:50000,runnerUp:100000,winner:200000},
    community_shield:{runnerUp:625000,winner:1250000}
  };
  const GF=()=>root.ProLifeGlobalFootball||(root.ProLife&&root.ProLife.GlobalFootball)||(typeof require==="function"?require("./global-football.js"):null);
  const WCC=()=>root.ProLifeWorldClubCompetitions||(root.ProLife&&root.ProLife.WorldClubCompetitions)||(typeof require==="function"?require("./world-club-competitions.js"):null);
  const baseDay=season=>(Number(season)-2026)*365;
  // Calendario interno do PRO-LIFE: janeiro a dezembro (nao agosto-maio).
  const CUP_DAYS={
    fa_cup:{round_1:12,round_2:35,round_3:58,round_4:81,round_5:105,quarterfinal:130,semifinal:155,final:180},
    efl_cup:{round_1:10,round_2:32,round_3:54,round_4:76,quarterfinal:100,semifinal:125,final:165},
    community_shield:{final:6}
  };
  const cupDay=(season,comp,key)=>baseDay(season)+CUP_DAYS[comp][key];
  function hash(text){let h=2166136261;for(const c of String(text))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
  function shuffled(ids,seed){return ids.slice().sort((a,b)=>{const x=hash(`${seed}|${a}`),y=hash(`${seed}|${b}`);return x-y||(a<b?-1:1);});}
  function state(s){
    if(!s.englishCups||typeof s.englishCups!=="object")s.englishCups={version:VERSION,editions:{},history:[],prizeLedger:{}};
    const st=s.englishCups;st.version=VERSION;st.editions||={};st.history||=[];st.prizeLedger||={};return st;
  }
  const clubs=(s,leagueIds=Object.values(LEAGUES))=>(s.globalFootball?.clubs||[]).filter(c=>leagueIds.includes(c.leagueId)&&c.active!==false&&c.generated!==true);
  function currentEuropeanClubs(s,season=s.season){
    const set=new Set();for(const id of ["ucl","uel","uecl"]){const ed=s.continental?.editions?.[`${id}:${season}`];for(const e of ed?.entrants||[])set.add(e[0]);}return set;
  }
  function occupiedDays(s,clubId,season){
    const out=new Set(),w=WCC(),c=(s.globalFootball?.clubs||[]).find(x=>x.id===clubId);
    if(c&&w?.coverage&&w?.roundDate){const cov=w.coverage(s).find(x=>x.leagueId===c.leagueId);for(let i=0;i<(cov?.rounds||0);i++)out.add(w.roundDate(season,i,cov.rounds));}
    for(const ed of Object.values(s.continental?.editions||{}))if(ed.season===season){
      for(const m of ed.leagueSchedule?.matches||[])if([m.homeId,m.awayId].includes(clubId))out.add(m.day);
      for(const stage of Object.values(ed.knockout?.stages||{}))for(const m of stage.matches||[])if([m.homeId,m.awayId].includes(clubId))out.add(m.day);
    }
    for(const ed of Object.values(state(s).editions))if(ed.season===season)for(const r of ed.rounds||[])for(const m of r.matches||[])if([m.homeId,m.awayId].includes(clubId))out.add(m.day);
    return out;
  }
  function safeDay(s,home,away,wanted,season){
    const h=occupiedDays(s,home,season),a=occupiedDays(s,away,season);
    for(let shift=0;shift<=14;shift++)for(const d of shift?[wanted+shift,wanted-shift]:[wanted]){
      if(d<baseDay(season)+1)continue;
      const bad=set=>set.has(d)||set.has(d-1)||set.has(d+1)||set.has(d-2)||set.has(d+2);
      if(!bad(h)&&!bad(a))return d;
    }
    for(let d=Math.max(wanted,s.day+1);d<=wanted+30;d++)if(!h.has(d)&&!a.has(d))return d;
    return Math.max(wanted,s.day+1);
  }
  function pairRound(s,ed,stageName,stageKey,ids,wanted,options={}){
    const order=shuffled(ids,`${ed.drawSeed}|${stageKey}`),target=options.target==null?Math.ceil(order.length/2):options.target;
    wanted=Math.max(wanted,s.day+3);
    const matchCount=Math.max(0,order.length-target),playing=order.slice(0,matchCount*2),byes=order.slice(matchCount*2),matches=[];
    for(let i=0;i<playing.length;i+=2){
      const a=playing[i],b=playing[i+1],swap=(hash(`${ed.drawSeed}|${stageKey}|${i}`)&1)===1,home=swap?b:a,away=swap?a:b;
      const day=safeDay(s,home,away,wanted+Math.floor(i/16),ed.season);
      matches.push({id:`${ed.id}:${stageKey}:${i/2+1}`,competitionId:ed.comp,season:ed.season,stage:stageName,stageKey,round:ed.rounds.length+1,pair:i/2,leg:1,homeId:home,awayId:away,day,played:false});
      if(options.twoLegged){const day2=safeDay(s,away,home,Math.max(wanted+14+Math.floor(i/16),day+7),ed.season);matches.push({id:`${ed.id}:${stageKey}:${i/2+1}:2`,tieId:`${ed.id}:${stageKey}:${i/2+1}`,competitionId:ed.comp,season:ed.season,stage:stageName,stageKey,round:ed.rounds.length+1,pair:i/2,leg:2,homeId:away,awayId:home,day:day2,played:false});matches[matches.length-2].tieId=matches[matches.length-1].tieId;}
    }
    const round={key:stageKey,name:stageName,index:ed.rounds.length,matches,byes,status:matches.length?"scheduled":"complete",twoLegged:!!options.twoLegged};ed.rounds.push(round);ed.currentRound=round.index;return round;
  }
  function previousWinner(s,comp,season){return state(s).history.find(h=>h.season===season&&h.comp===comp)?.championId||null;}
  function previousLeagueChampion(s,season){
    const w=WCC(),hist=s.globalFootball?.worldCompetitions?.history||s.worldClubCompetitions?.history||s.worldCompetitions?.history||[];
    const row=hist.find(h=>h.season===season&&h.leagueId===LEAGUES.premier);if(row?.championId)return row.championId;
    const standings=w?.standings?.(s,LEAGUES.premier)||[];return season===s.season-1?standings[0]?.id:null;
  }
  function previousLeagueRunnerUp(s,season){
    const hist=s.globalFootball?.worldCompetitions?.history||s.worldClubCompetitions?.history||s.worldCompetitions?.history||[];
    const row=hist.find(h=>h.season===season&&h.leagueId===LEAGUES.premier);
    return row?.runnerUpId||row?.top4?.[1]||null;
  }
  function createEdition(s,comp,season){
    const all=clubs(s),premier=all.filter(c=>c.leagueId===LEAGUES.premier).map(c=>c.id),lower=all.filter(c=>c.leagueId!==LEAGUES.premier).map(c=>c.id),faOpening=all.filter(c=>[LEAGUES.leagueOne,LEAGUES.leagueTwo].includes(c.leagueId)).map(c=>c.id);
    const ed={id:`${comp}:${season}`,comp,name:DEFS[comp].name,season,status:"active",drawSeed:`${comp}|${season}|${s.initialSeed||0}`,participantIds:comp==="community_shield"?[]:all.map(c=>c.id),rounds:[],currentRound:0,championId:null,runnerUpId:null,createdDay:s.day};
    if(comp==="fa_cup")pairRound(s,ed,"Primeira fase","round_1",faOpening,cupDay(season,comp,"round_1"),{target:Math.ceil(faOpening.length/2)});
    if(comp==="efl_cup")pairRound(s,ed,"Primeira fase","round_1",lower,cupDay(season,comp,"round_1"),{target:Math.ceil(lower.length/2)});
    if(comp==="community_shield"){
      const leagueWinner=previousLeagueChampion(s,season-1),faWinner=previousWinner(s,"fa_cup",season-1);
      if(!leagueWinner||!faWinner){ed.status="not_eligible";ed.reason="Campeões da temporada anterior indisponíveis.";}
      else {const opponent=leagueWinner===faWinner?previousLeagueRunnerUp(s,season-1):faWinner;if(!opponent){ed.status="not_eligible";ed.reason="Vice-campeão da Premier League indisponível.";}else {ed.participantIds=[leagueWinner,opponent];pairRound(s,ed,"Final","final",[leagueWinner,opponent],cupDay(season,comp,"final"),{target:1});}}
    }
    return ed;
  }
  function init(s){
    const st=state(s);if(s.catalogVersion!=="fc27_v1"||clubs(s).length<2)return st;
    for(const comp of Object.keys(DEFS)){const key=`${comp}:${s.season}`;if(!st.editions[key])st.editions[key]=createEdition(s,comp,s.season);}
    return st;
  }
  const edition=(s,comp,season=s.season)=>state(s).editions[`${comp}:${season}`]||null;
  function tieWinner(match){if(match.hg!==match.ag)return match.hg>match.ag?match.homeId:match.awayId;return match.penalties?.home>match.penalties?.away?match.homeId:match.awayId;}
  function roundWinners(round){
    if(round.twoLegged){const byTie=new Map();for(const m of round.matches){const k=m.tieId||m.id;if(!byTie.has(k))byTie.set(k,[]);byTie.get(k).push(m);}const out=[];for(const ms of byTie.values()){ms.sort((a,b)=>a.leg-b.leg);const a=ms[0],b=ms[1],aGoals=a.hg+b.ag,bGoals=a.ag+b.hg;out.push(aGoals!==bGoals?(aGoals>bGoals?a.homeId:a.awayId):tieWinner(b));}return round.byes.concat(out);}
    return round.byes.concat(round.matches.map(tieWinner));
  }
  function nextPlan(ed,winners,european){
    if(ed.comp==="fa_cup"){
      const keys=["round_1","round_2","round_3","round_4","round_5","quarterfinal","semifinal","final"],i=keys.indexOf(ed.rounds.at(-1).key)+1,key=keys[i];
      if(key==="round_2")return {key,name:"Segunda fase",ids:winners,wanted:CUP_DAYS.fa_cup.round_2,target:Math.ceil(winners.length/2)};
      if(key==="round_3")return {key,name:"Terceira fase",ids:winners.concat(ed.participantIds.filter(id=>!ed.rounds[0].matches.some(m=>[m.homeId,m.awayId].includes(id)))),wanted:CUP_DAYS.fa_cup.round_3,target:32};
      const names={round_4:"Quarta fase",round_5:"Oitavas de final",quarterfinal:"Quartas de final",semifinal:"Semifinal",final:"Final"};return key?{key,name:names[key],ids:winners,wanted:{round_4:81,round_5:105,quarterfinal:130,semifinal:155,final:180}[key],target:Math.ceil(winners.length/2)}:null;
    }
    if(ed.comp==="efl_cup"){
      const key=ed.rounds.at(-1).key;
      if(key==="round_1"){const prem=ed.participantIds.filter(id=>clubsCacheLeague(ed,id)===LEAGUES.premier),late=prem.filter(id=>european.has(id)),early=prem.filter(id=>!european.has(id));ed.lateEntrants=late;return {key:"round_2",name:"Segunda fase",ids:winners.concat(early),wanted:CUP_DAYS.efl_cup.round_2,target:Math.max(1,32-late.length)};}
      if(key==="round_2")return {key:"round_3",name:"Terceira fase",ids:winners.concat(ed.lateEntrants||[]),wanted:CUP_DAYS.efl_cup.round_3,target:16};
      const seq={round_3:["round_4","Oitavas de final",76,8],round_4:["quarterfinal","Quartas de final",100,4],quarterfinal:["semifinal","Semifinal",125,2,true],semifinal:["final","Final",165,1]};const x=seq[key];return x?{key:x[0],name:x[1],ids:winners,wanted:x[2],target:x[3],twoLegged:x[4]}:null;
    }
    return null;
  }
  function clubsCacheLeague(ed,id){return ed._leagueById?.[id]||null;}
  function award(s,ed,clubId,key,hooks){const amount=PRIZES[ed.comp]?.[key]||0,ledgerKey=`${ed.id}:${clubId}:${key}`;if(!amount||state(s).prizeLedger[ledgerKey])return;state(s).prizeLedger[ledgerKey]=amount;hooks?.onPrize?.({clubId,amount,currency:"GBP",competitionId:ed.comp,reason:key});}
  function finishEdition(s,ed,round,hooks){
    const winners=roundWinners(round),winner=winners[0],final=round.matches.at(-1);ed.championId=winner;ed.runnerUpId=final?(winner===final.homeId?final.awayId:final.homeId):null;ed.status="complete";ed.completedDay=s.day;
    award(s,ed,winner,"winner",hooks);if(ed.runnerUpId)award(s,ed,ed.runnerUpId,"runnerUp",hooks);
    if(!state(s).history.some(h=>h.season===ed.season&&h.comp===ed.comp))state(s).history.unshift({season:ed.season,comp:ed.comp,name:ed.name,championId:winner,runnerUpId:ed.runnerUpId,completedDay:s.day,europeanRoute:DEFS[ed.comp].europeanRoute});
    hooks?.onChampion?.({edition:ed,championId:winner,runnerUpId:ed.runnerUpId});
  }
  function progress(s,ed,hooks){
    const round=ed.rounds[ed.currentRound];if(!round||round.status==="complete"||round.matches.some(m=>!m.played))return;
    round.status="complete";const winners=roundWinners(round);for(const id of winners)award(s,ed,id,round.key,hooks);
    if(winners.length===1){finishEdition(s,ed,round,hooks);return;}
    ed._leagueById=Object.fromEntries(clubs(s).map(c=>[c.id,c.leagueId]));const p=nextPlan(ed,winners,currentEuropeanClubs(s,ed.season));
    if(!p){finishEdition(s,ed,round,hooks);return;}pairRound(s,ed,p.name,p.key,p.ids,baseDay(ed.season)+p.wanted,{target:p.target,twoLegged:p.twoLegged});delete ed._leagueById;
  }
  function backgroundResult(s,m){const list=s.globalFootball?.clubs||[],h=list.find(c=>c.id===m.homeId),a=list.find(c=>c.id===m.awayId),hs=Number(h?.level||h?.strength||h?.reputation||65),as=Number(a?.level||a?.strength||a?.reputation||65),n=hash(`${m.id}|${s.initialSeed||0}`);let hg=Math.max(0,Math.min(5,Math.round(1.35+(hs-as)/26+((n%5)-2)/2))),ag=Math.max(0,Math.min(5,Math.round(1.05+(as-hs)/26+((Math.floor(n/19)%5)-2)/2)));return {hg,ag};}
  function applyTieBreak(m,result,round){
    m.hg=Number(result.hg)||0;m.ag=Number(result.ag)||0;
    const firstLeg=m.tieId&&m.leg===2?round.matches.find(x=>x.tieId===m.tieId&&x.leg===1):null;
    const aggregateTied=firstLeg&&Number(firstLeg.hg)+m.ag===Number(firstLeg.ag)+m.hg;
    const needsDecision=m.tieId?(m.leg===2&&aggregateTied):(m.hg===m.ag);
    if(needsDecision){const n=hash(`${m.id}|pens`);m.extraTime=m.competitionId!=="community_shield";m.penalties={home:3+(n%3),away:3+(Math.floor(n/7)%3)};if(m.penalties.home===m.penalties.away)m.penalties[(n&1)?"home":"away"]++;}
    if(result.record){result.record.stage=m.stage;result.record.domesticCupMatch=true;result.record.knockout=true;if(m.extraTime)result.record.extraTime=true;if(m.penalties)result.record.penalties={...m.penalties};}
  }
  function daily(s,hooks={}){
    init(s);for(const ed of Object.values(state(s).editions).filter(e=>e.season===s.season&&e.status==="active")){
      const round=ed.rounds[ed.currentRound];for(const m of round?.matches||[]){if(m.played||m.day!==s.day)continue;const hero=[m.homeId,m.awayId].includes(s.clubId),result=(hero&&hooks.heroFixture?hooks.heroFixture(m,ed):hooks.otherFixture?.(m,ed))||backgroundResult(s,m);applyTieBreak(m,result,round);m.played=true;m.playedDay=s.day;}
      progress(s,ed,hooks);
    }
  }
  function nextFixture(s,clubId=s.clubId){init(s);const all=[];for(const ed of Object.values(state(s).editions))if(ed.season===s.season&&ed.status==="active")for(const r of ed.rounds||[])for(const m of r.matches||[])if(!m.played&&m.day>s.day&&[m.homeId,m.awayId].includes(clubId))all.push({...m,competitionName:ed.name});return all.sort((a,b)=>a.day-b.day||a.id.localeCompare(b.id))[0]||null;}
  function closeSeason(s){init(s);return state(s).history.filter(h=>h.season===s.season);}
  function europeanQualifiers(s,season){const out={faCupWinner:null,eflCupWinner:null};out.faCupWinner=previousWinner(s,"fa_cup",season);out.eflCupWinner=previousWinner(s,"efl_cup",season);return out;}
  function audit(s,season=s.season){init(s);const fixtures=[];for(const ed of Object.values(state(s).editions))if(ed.season===season)for(const r of ed.rounds||[])fixtures.push(...r.matches);const keys=new Set(),duplicates=[],sameDay=new Set();for(const m of fixtures){if(keys.has(m.id))duplicates.push(m.id);keys.add(m.id);for(const id of [m.homeId,m.awayId]){const k=`${id}:${m.day}`;if(sameDay.has(k))duplicates.push(k);sameDay.add(k);}}return {season,editions:Object.values(state(s).editions).filter(e=>e.season===season).length,fixtures:fixtures.length,duplicates};}
  const api={VERSION,LEAGUES,DEFS,PRIZES,state,clubs,init,edition,nextFixture,daily,closeSeason,europeanQualifiers,currentEuropeanClubs,audit};
  root.ProLifeEnglishCups=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
