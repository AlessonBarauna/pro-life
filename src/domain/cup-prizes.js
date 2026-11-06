(function(root){
  "use strict";
  // Premiação de copas, inspirada nos valores reais (em milhões, escala do jogo):
  // cota de participação + bônus por vitória/empate na fase de liga ou grupos + bônus ao alcançar cada fase + bônus do título.
  const M=1e6;
  const COMPS={
    ucl:{label:"UEFA Champions League",part:18.6,win:2.1,draw:.7,stages:{playoffs:1,round16:11,quarters:12.5,semis:15,final:18.5},champion:6.5},
    uel:{label:"UEFA Europa League",part:4.3,win:.45,draw:.15,stages:{playoffs:.3,round16:1.5,quarters:2.5,semis:4.5,final:7},champion:4},
    uecl:{label:"UEFA Conference League",part:3.17,win:.4,draw:.13,stages:{playoffs:.2,round16:.8,quarters:1.4,semis:2.5,final:4},champion:3},
    lib:{label:"CONMEBOL Libertadores",part:3,win:.5,draw:.2,stages:{round16:2,quarters:3,semis:5,final:7},champion:15},
    sud:{label:"CONMEBOL Sul-Americana",part:1,win:.2,draw:.08,stages:{playoffs:.3,round16:.8,quarters:1.2,semis:2,final:3},champion:5}
  };
  // Copa do Brasil: valor por fase alcançada (índice da rodada) + vice e campeão.
  const CDB={label:"Copa do Brasil",rounds:[1.2,2,3.6,6],runnerUp:40,champion:78};
  const KEY={quarterfinal:"quarters",semifinal:"semis",semi:"semis",quarter:"quarters",playoff:"playoffs"};
  const STAGE_NAME={playoffs:"playoffs",round16:"oitavas",quarters:"quartas",semis:"semifinais",final:"final"};
  const played=m=>m&&m.played&&Number.isFinite(Number(m.hg))&&Number.isFinite(Number(m.ag));
  function continental(ed,clubId){
    const rule=COMPS[ed&&ed.comp];if(!rule||!ed)return null;
    const ids=new Set();
    const lm=(ed.leagueSchedule&&ed.leagueSchedule.matches)||[];
    for(const m of lm)if(m.homeId===clubId||m.awayId===clubId)ids.add("g");
    const inEntrants=(ed.entrants||[]).some(e=>(Array.isArray(e)?e[0]:e&&e.id||e&&e.clubId||e)===clubId);
    const inGroup=(ed.groups||[]).some(g=>(g.clubIds||[]).includes(clubId));
    if(!ids.size&&!inEntrants&&!inGroup)return null;
    let wins=0,draws=0;
    for(const m of lm){if(!played(m)||(m.homeId!==clubId&&m.awayId!==clubId))continue;const own=m.homeId===clubId?m.hg:m.ag,opp=m.homeId===clubId?m.ag:m.hg;if(own>opp)wins++;else if(own===opp)draws++;}
    const anyPlayed=lm.some(m=>played(m)&&(m.homeId===clubId||m.awayId===clubId));
    const lines=[];
    // A cota de participação é paga quando a competição começa para o clube (primeiro jogo disputado).
    if(anyPlayed||wins||draws)lines.push({reason:`cota de participação`,amount:rule.part*M});
    if(wins||draws)lines.push({reason:`${wins} vitória(s) e ${draws} empate(s) na fase inicial`,amount:(wins*rule.win+draws*rule.draw)*M});
    const stages=Object.values((ed.knockout&&ed.knockout.stages)||{});
    let best=null;
    for(const st of stages){
      if(!(st.matches||[]).some(m=>m.homeId===clubId||m.awayId===clubId))continue;
      const k=KEY[st.key]||st.key,v=rule.stages[k];
      if(v){lines.push({reason:`${STAGE_NAME[k]||k} alcançada`,amount:v*M});best=k;}
    }
    if(best&&!lines.some(l=>l.reason==="cota de participação"))lines.unshift({reason:`cota de participação`,amount:rule.part*M});
    const champion=ed.championId===clubId||(ed.knockout&&ed.knockout.championId===clubId);
    if(champion)lines.push({reason:"título",amount:rule.champion*M});
    return {competitionId:ed.comp,label:rule.label,season:ed.season,lines,amount:lines.reduce((a,l)=>a+l.amount,0),reached:best,champion};
  }
  function domesticCup(cup,clubId){
    if(!cup||!Array.isArray(cup.rounds))return null;
    const lines=[];let seen=false;
    const last=cup.rounds.length-1;
    cup.rounds.forEach((r,i)=>{
      const pair=(r.pairs||[]).find(p=>p.home===clubId||p.away===clubId);
      if(!pair)return;seen=true;
      // Cada fase concluída paga a cota da fase (vencedor e perdedor); a final paga vice/campeão.
      if(pair.played&&i<last)lines.push({reason:`cota da fase: ${String(r.name||"fase").toLowerCase()}`,amount:CDB.rounds[Math.min(i,CDB.rounds.length-1)]*M});
    });
    if(!seen)return null;
    const champion=cup.championId===clubId,runnerUp=cup.runnerUpId===clubId;
    if(champion)lines.push({reason:"título",amount:CDB.champion*M});
    else if(runnerUp)lines.push({reason:"vice-campeonato",amount:CDB.runnerUp*M});
    return {competitionId:"copaBrasil",label:CDB.label,season:cup.season,lines,amount:lines.reduce((a,l)=>a+l.amount,0),champion};
  }
  const api={COMPS,CDB,continental,domesticCup};
  root.ProLifeCupPrizes=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
