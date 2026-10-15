(function(root){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const number=v=>Number.isFinite(Number(v))?Number(v):null;
const fmt=v=>v===null?"—":String(v);
function model(report){
 if(!report||typeof report!=="object")return null;
 const status=String(report.status||"PARTICIPAÇÃO");
 const played=report.rating!==null&&report.rating!==undefined&&number(report.minutes)>0;
 const trustA=number(report.coachTrustAfter),trustB=number(report.coachTrustBefore);
 const trustDelta=trustA===null||trustB===null?null:trustA-trustB;
 const met=number(report.objectivesMet),total=number(report.objectivesTotal);
 return {status,played,minutes:played?number(report.minutes):0,rating:played?number(report.rating):null,
  goals:played?number(report.goals)||0:0,assists:played?number(report.assists)||0:0,
  yellows:played?number(report.yellowCards)||0:0,red:played?Boolean(report.redCard):false,
  entry:played&&report.entryMinute!=null?number(report.entryMinute):null,
  xp:played?number(report.xp)||0:0,
  changes:played&&Array.isArray(report.attributeChanges)?report.attributeChanges:[],
  trustA,trustB,trustDelta,roleBefore:report.squadRoleBefore||"—",roleAfter:report.squadRoleAfter||report.squadRoleBefore||"—",
  met:played?met:null,total:played?total:null,
  reputationBefore:number(report.reputationBefore),reputationAfter:number(report.reputationAfter),
  importance:report.importance?.label||"Partida",national:!!report.national};
}
function render(report){
 const m=model(report);if(!m)return "";
 const stat=(name,val)=>'<div class="j09-stat"><small>'+esc(name)+'</small><strong>'+esc(fmt(val))+'</strong></div>';
 const statusLabel=({TITULAR:"Titular",ENTROU_DO_BANCO:"Entrou do banco",NAO_UTILIZADO:"Não utilizado",NAO_RELACIONADO:"Não relacionado",INDISPONIVEL:"Indisponível"})[m.status]||m.status.replace(/_/g," ");
 const participation=m.played?(m.entry!==null?"Entrou aos "+m.entry+"'":"Participou da partida"):"Sem minutos registrados — sem nota ou XP";
 const progress=m.met===null||m.total===null?"Não há avaliação de objetivos registrada.":m.met+" de "+m.total+" objetivos cumpridos no relatório.";
 const delta=m.trustDelta===null?"—":(m.trustDelta>0?"+":"")+m.trustDelta.toFixed(0);
 return '<section class="j09-report" id="post-match-j09" aria-label="Avaliação pós-jogo"><header class="j09-head"><small>PÓS-JOGO · '+esc(report.competition||"Partida")+' · '+esc(m.importance)+'</small><h2>Avaliação do atleta</h2><p>'+esc(report.opponent||"Adversário")+' · '+esc(statusLabel)+' · '+esc(participation)+'</p></header>'+
 '<div class="j09-stats">'+stat("NOTA",m.rating===null?"—":m.rating.toFixed(1))+stat("MINUTOS",m.minutes)+stat("GOLS",m.goals)+stat("ASSISTÊNCIAS",m.assists)+stat("CARTÕES AMARELOS",m.yellows)+stat("CARTÃO VERMELHO",m.red?"Sim":"Não")+'</div>'+
 '<div class="j09-grid"><section class="j09-block"><small>OBJETIVOS DA PARTIDA</small><h3>'+esc(progress)+'</h3><p>'+(!m.played?"Não houve participação para avaliar.":"O save guarda a quantidade cumprida, mas não os resultados de cada objetivo individual.")+'</p></section>'+
 '<section class="j09-block"><small>AVALIAÇÃO DO TREINADOR</small><h3>'+esc(m.national?"Sem avaliação do clube":delta+" de confiança")+'</h3><p>Antes: '+esc(fmt(m.trustB))+' · Depois: '+esc(fmt(m.trustA))+'</p><p>Papel: '+esc(m.roleBefore)+' → '+esc(m.roleAfter)+'</p></section>'+
 '<section class="j09-block"><small>EVOLUÇÃO PROFISSIONAL</small><h3>XP '+(m.played?"+":"")+esc(m.xp.toFixed(1))+'</h3><p>'+(!m.played?"Sem evolução de partida.":m.changes.length?m.changes.map(c=>esc(c.label||c.key||"Atributo")+": "+esc(fmt(c.before))+" → "+esc(fmt(c.after))).join("<br>"):"Nenhum atributo evoluiu neste jogo.")+'</p></section></div>'+
 '<footer class="j09-foot"><span>Dados já processados pelo motor da carreira; esta tela não concede recompensas adicionais.</span><button type="button" data-page="lineup">Voltar à escalação</button></footer></section>';
}
const api={model,render};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifePostMatchJ09=api;
})(typeof globalThis!=="undefined"?globalThis:this);
