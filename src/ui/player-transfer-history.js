(function(root){
  "use strict";

  const esc=(value)=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const clubMap=(s)=>new Map([...(s?.clubs||[]),...(s?.globalFootball?.clubs||[])].filter(club=>club?.id).map(club=>[club.id,club.name||club.id]));
  const seasonAt=(s,day,explicit)=>{
    if(Number.isFinite(Number(explicit))) return Number(explicit);
    if(!Number.isFinite(Number(day))||!Number.isFinite(Number(s?.season))) return null;
    return Number(s.season)-Math.max(0,Math.floor((Number(s.day||0)-Number(day))/365));
  };
  function collect(s,playerId){
    if(!playerId) return [];
    const clubs=clubMap(s), rows=[], seen=new Set();
    const add=(row)=>{
      const key=[playerId,row.fromId||row.from,row.toId||row.to,row.day??row.season??""].join("|");
      if(seen.has(key)) return;
      seen.add(key); rows.push({...row,key});
    };
    for(const move of s?.universe?.transfers||[]){
      if(move?.id!==playerId||move.type==="release") continue;
      add({source:"universe",day:move.day,season:seasonAt(s,move.day,move.season),fromId:move.fromId,toId:move.toId,from:move.from||clubs.get(move.fromId)||"Sem clube",to:move.to||clubs.get(move.toId)||"Sem clube",value:Number(move.fee)||0,overall:Number.isFinite(Number(move.ovr))?Number(move.ovr):null});
    }
    for(const deal of s?.worldLiveMarket?.deals||[]){
      if(deal?.playerId!==playerId||deal.executionStatus!=="executed"||!Number.isFinite(Number(deal.executedDay))) continue;
      add({source:"world",day:Number(deal.executedDay),season:seasonAt(s,deal.executedDay,deal.season),fromId:deal.fromClubId,toId:deal.toClubId,from:clubs.get(deal.fromClubId)||deal.fromClubId||"Sem clube",to:clubs.get(deal.toClubId)||deal.toClubId||"Sem clube",value:Number(deal.value)||0,overall:Number.isFinite(Number(deal.ovr??deal.overall))?Number(deal.ovr??deal.overall):null});
    }
    return rows.sort((a,b)=>(Number(b.day)||0)-(Number(a.day)||0)||(Number(b.season)||0)-(Number(a.season)||0));
  }
  const money=(value)=>Number(value)>0?Number(value).toLocaleString("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}):"Livre";
  function render(s,playerId){
    const rows=collect(s,playerId);
    return `<section id="player-transfers" class="card section player-transfer-history"><div class="tag">CARREIRA</div><h2>Histórico de transferências</h2>${rows.length?`<div class="tablewrap"><table><thead><tr><th>Temporada</th><th>Origem</th><th>Destino</th><th>Valor</th><th>GER</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${row.season??"—"}</td><td>${esc(row.from)}</td><td>${esc(row.to)}</td><td>${money(row.value)}</td><td>${row.overall??"—"}</td></tr>`).join("")}</tbody></table></div>`:`<p class="muted">Nenhuma transferência efetivada registrada para este jogador.</p>`}</section>`;
  }
  const api={collect,render,esc};
  root.ProLifePlayerTransferHistory=api;
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
