(function(root){"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function snapshot(state,Career){
 if(state?.mode!=="player")return null;
 const pc=Career.init(state)?.playerCareer||{},q=pc.squadCompetition||{};
 const decisions=Array.isArray(q.history)?q.history.filter(row=>row&&Number.isFinite(Number(row.day))).slice(0,12):[];
 const trust=Array.isArray(q.trustHistory)?q.trustHistory.filter(row=>row&&Number.isFinite(Number(row.day))).slice(0,12):[];
 const report=pc.lastMatchReport||null;
 return {starts:Math.max(0,Number(pc.starts)||0),nonStarts:Math.max(0,Number(pc.benchGames)||0),decisions,trust,report};
}
function render(state,Career){
 const x=snapshot(state,Career);if(!x)return "";
 const stat=(name,val,detail)=>'<div class="j113-stat"><small>'+esc(name)+'</small><strong>'+esc(val)+'</strong><span>'+esc(detail)+'</span></div>';
 const last=x.report?'<p>'+esc(x.report.competition||"Partida")+' · '+esc(x.report.status||"Não informado").replace(/_/g," ")+' · '+esc(x.report.minutes??0)+' min'+(x.report.entryMinute!=null?' · entrada aos '+esc(x.report.entryMinute)+"'":'')+'</p>':'<p>Nenhum relatório individual disponível.</p>';
 const decisions=x.decisions.length?x.decisions.map(d=>'<li><b>Dia '+esc(d.day)+'</b> · '+esc(d.role||"Situação não registrada")+' · confiança '+esc(d.trust??"—")+'<span>'+esc(d.reason||"")+'</span></li>').join(""):'<li>Sem decisões históricas registradas.</li>';
 const trust=x.trust.length?x.trust.map(t=>'<li><b>Dia '+esc(t.day)+'</b> · '+esc(t.source||"Alteração")+' · '+esc(t.delta!=null?(Number(t.delta)>0?"+":"")+t.delta:"variação não registrada")+'</li>').join(""):'<li>Sem variações históricas registradas.</li>';
 return '<section class="j113-history" aria-label="Histórico de oportunidades"><header><small>J11.3 · HISTÓRICO DE OPORTUNIDADES</small><h2>Sua trajetória no elenco</h2><p>Dados reais registrados pela carreira, sem reconstrução fictícia de partidas anteriores.</p></header><div class="j113-stats">'+stat("TITULARIDADES",x.starts,"Inícios em campo registrados")+stat("JOGOS SEM INICIAR TITULAR",x.nonStarts,"Inclui reservas utilizados, não utilizados e ausências contabilizadas")+'</div><div class="j113-columns"><article><h3>Última participação</h3>'+last+'<h3>Decisões da comissão</h3><ol>'+decisions+'</ol></article><article><h3>Evolução da confiança</h3><ol>'+trust+'</ol></article></div><footer>Os contadores antigos não distinguem todas as entradas do banco de jogos sem participação. O detalhamento é mostrado apenas quando registrado no relatório.</footer></section>';
}
const api={snapshot,render};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifeJ113=api;
})(typeof globalThis!=="undefined"?globalThis:this);
