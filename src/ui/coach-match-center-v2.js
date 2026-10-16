(function(root){
"use strict";
// FC-inspired match centre for the coach: display only, no alteration to a completed simulation.
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=n=>Number.isFinite(Number(n))?Number(n):0;
function eventList(m,minute){return (m?.events||[]).filter(e=>num(e.minute)<=minute).slice().sort((a,b)=>num(b.minute)-num(a.minute));}
function metrics(m,minute){
 const data=[
  ["Gols",null,null,"events"],
  ["Finalizações",m?.shots?.[0],m?.shots?.[1],"full"],
  ["xG",m?.xg?.[0],m?.xg?.[1],"xg"]
 ];
 const recorded=root.ProLifeMatchIdentityV2?.eventMetrics?.(m,minute);
 if(recorded)for(const [label,key] of [["Cartões amarelos","yellow"],["Cartões vermelhos","red"],["Substituições","substitutions"]]){
  const a=recorded[key];if(a.some(v=>v>0))data.push([label,a[0],a[1],"events"]);
 }
 return data.map(([label,a,b,kind])=>{
  if(kind==="events"){const g=label==="Gols"?(recorded?.goals||[0,0]):[a,b];return {label,home:g[0],away:g[1]};}
  const format=v=>v==null?"—":kind==="xg"?Number(v).toFixed(2):Math.round(Number(v));
  return {label,home:format(a),away:format(b)};
 });
}
function panel(m,minute,tab,{home,away}={}){
 const events=eventList(m,minute);
 if(tab==="estatisticas")return '<h3>ESTATÍSTICAS DA PARTIDA</h3><div class="lm-mc-stat">'+metrics(m,minute).map(x=>'<div class="lm-mc-stat-row"><span>'+esc(x.home)+'</span><b>'+esc(x.label)+'</b><span>'+esc(x.away)+'</span></div>').join("")+'</div><p class="lm-mc-note">Dados oficiais acumulados até o minuto atual. Posse, passes e desarmes ainda não são medidos pelo motor.</p>';
 if(tab==="desempenho"){
  const identity=root.ProLifeMatchIdentityV2;
  const ratings=Object.entries(m?.ratings||{}).sort((a,b)=>num(b[1])-num(a[1])).slice(0,30);
  const contributions=Object.entries(m?.participation||{}).filter(([id,p])=>num(p.entryMinute)<=minute).map(([id,p])=>{
   const entries=events.filter(e=>String(e.playerId||"")===String(id));
   const goals=entries.filter(e=>e.type==="goal").length;
   const saves=entries.filter(e=>e.type==="save").length;
   const assists=events.filter(e=>e.type==="goal"&&String(e.assistPlayerId||"")===String(id)).length;
   return {id,goals,saves,assists,minutes:Math.max(0,Math.min(minute,num(p.exitMinute??94))-num(p.entryMinute))};
  }).filter(p=>p.minutes>0).sort((a,b)=>(b.goals*4+b.assists*2+b.saves)-(a.goals*4+a.assists*2+a.saves)).slice(0,22);
  const contributionsPanel='<div class="lm-feed lm-mc-ratings">'+contributions.map(p=>{
    const identified=identity?.identify?.(p.id,home,away);
    const roster=[...(home?.roster||[]),...(away?.roster||[])].find(x=>String(x.id)===p.id);
    const name=identified?.name||roster?.name||p.id;
    return '<article><span><b>'+esc(name)+'</b><small>'+p.minutes+' min · '+p.goals+' gols · '+p.assists+' assist. · '+p.saves+' defesas</small></span></article>';
  }).join("")+'</div>';
  return '<h3>DESEMPENHO DOS JOGADORES</h3>'+(ratings.length?'<div class="lm-feed lm-mc-ratings">'+ratings.map(([id,v])=>{
   const p=identity?.identify?.(id,home,away);
   const label=p?.name||(!/^(real_|fc27_)/i.test(id)?id:"Jogador não identificado");
   const meta=[p?.position,p?.number!=null?"#"+p.number:null].filter(Boolean).join(" · ");
   return '<article><span><b>'+esc(label)+'</b>'+(meta?'<small>'+esc(meta)+'</small>':"")+'</span><strong>Nota '+esc(v)+'</strong></article>';
  }).join("")+'</div>':'<p class="lm-mc-note">Notas oficiais calculadas após o término. Participações parciais até agora:</p>'+contributionsPanel);
 }
 if(tab==="taticas")return '<h3>INSTRUÇÕES TÁTICAS</h3><p class="lm-mc-note">Gerencie as substituições oficiais no painel Decisões do Treinador abaixo. Pause a partida para analisar o elenco e realizar trocas; elas afetam os minutos seguintes.</p>';
 return '<h3>ACONTECIMENTOS</h3><div class="lm-feed">'+(events.length?events.slice(0,12).map(e=>'<article class="'+esc(e.type||"")+'"><b>'+esc(e.minute)+"'"+'</b><span>'+esc(e.text)+'</span></article>').join(""):'<p>A partida começou. As equipes estudam os espaços.</p>')+'</div>';
}
function tabs(active){return '<nav class="lm-mc-tabs" aria-label="Painéis da partida">'+[["acontecimentos","Acontecimentos"],["estatisticas","Estatísticas"],["desempenho","Desempenho"],["taticas","Táticas"]].map(([id,label])=>'<button type="button" data-live-tab="'+id+'" aria-current="'+(active===id?'page':'false')+'" class="'+(active===id?'active':'')+'">'+label+'</button>').join("")+'</nav>';}
const API=Object.freeze({panel,tabs,eventList,metrics});
root.ProLifeCoachMatchCenterV2=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof globalThis!=="undefined"?globalThis:this);
