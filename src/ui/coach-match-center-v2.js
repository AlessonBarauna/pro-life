(function(root){
"use strict";
// FC-inspired match centre for the coach: display only, no alteration to a completed simulation.
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const num=n=>Number.isFinite(Number(n))?Number(n):0;
function eventList(m,minute){return (m?.events||[]).filter(e=>num(e.minute)<=minute).slice().sort((a,b)=>num(b.minute)-num(a.minute));}
function metrics(m,minute){
 const scale=Math.max(0,Math.min(1,minute/94));
 return [["Finalizações",m?.shots?.[0],m?.shots?.[1]],["xG",m?.xg?.[0],m?.xg?.[1]]].map(([label,a,b])=>({label,home:a==null?"—":label==="xG"?(minute>=94?num(a).toFixed(2):"—"):minute>=94?Math.round(num(a)):"—",away:b==null?"—":label==="xG"?(minute>=94?num(b).toFixed(2):"—"):minute>=94?Math.round(num(b)):"—"}));
}
function panel(m,minute,tab,{home,away}={}){
 const events=eventList(m,minute);
 if(tab==="estatisticas")return '<div class="lm-mc-stat">'+metrics(m,minute).map(x=>'<div class="lm-mc-stat-row"><span>'+esc(x.home)+'</span><b>'+esc(x.label)+'</b><span>'+esc(x.away)+'</span></div>').join("")+'</div><p class="lm-mc-note">Valores finais de finalizacoes e xG disponiveis apenas ao termino; nao sao calculadas estatisticas parciais artificiais.</p>';
 if(tab==="desempenho"){const ratings=Object.entries(m?.ratings||{}).slice(0,12).sort((a,b)=>num(b[1])-num(a[1]));return '<h3>DESEMPENHO</h3>'+(ratings.length?'<div class="lm-feed">'+ratings.map(([id,v])=>'<article><b>'+esc(id)+'</b><span>Nota '+esc(v)+'</span></article>').join("")+'</div>':'<p class="lm-mc-note">Notas individuais disponíveis após o cálculo da partida.</p>');}
 if(tab==="taticas")return '<h3>INSTRUÇÕES TÁTICAS</h3><p class="lm-mc-note">Acompanhe a partida e avalie o resultado do plano escolhido. Como o motor calcula o confronto antes da exibição, mudanças durante a reprodução não alterariam o resultado. Ajuste a formação na gestão do elenco antes da próxima partida.</p>';
 return '<h3>ACONTECIMENTOS</h3><div class="lm-feed">'+(events.length?events.slice(0,12).map(e=>'<article class="'+esc(e.type||"")+'"><b>'+esc(e.minute)+"'"+'</b><span>'+esc(e.text)+'</span></article>').join(""):'<p>A partida começou. As equipes estudam os espaços.</p>')+'</div>';
}
function tabs(active){return '<nav class="lm-mc-tabs" aria-label="Painéis da partida">'+[["acontecimentos","Acontecimentos"],["estatisticas","Estatísticas"],["desempenho","Desempenho"],["taticas","Táticas"]].map(([id,label])=>'<button type="button" data-live-tab="'+id+'" aria-current="'+(active===id?'page':'false')+'" class="'+(active===id?'active':'')+'">'+label+'</button>').join("")+'</nav>';}
const API=Object.freeze({panel,tabs,eventList,metrics});
root.ProLifeCoachMatchCenterV2=API;
if(typeof module!=="undefined"&&module.exports)module.exports=API;
})(typeof globalThis!=="undefined"?globalThis:this);
