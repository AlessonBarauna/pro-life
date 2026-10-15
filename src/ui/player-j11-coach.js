(function(root){"use strict";
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function snapshot(state,Squad,Career){
 if(state?.mode!=="player"||!state.clubId)return null;
 const pc=Career.init(state)?.playerCareer||{},q=Squad.init(state)||{},t=Squad.trustSummary?.(state,5)||null;
 const manager=Squad.managerProfile?.(state)||null;
 const competition=Squad.competition?.(state)||null;
 const conversation=Squad.coachConversationStatus?.(state)||null;
 const promise=Squad.coachPromiseStatus?.(state)||null;
 const last=pc.lastMatchReport||null;
 const rating=last?.rating??null;
 const trend=Number(t?.trend||0);
 const history=Array.isArray(t?.history)?t.history:[],choices=Squad.coachConversationChoices?.(state)||[];
 return {trust:Math.max(0,Math.min(100,Number(pc.coachTrust??0))),role:pc.squadRole||"A definir",trend,history,manager,competition,conversation,promise,last,rating,choices,trainingTrend:Number(q.trainingTrend||0)};
}
function render(state,Squad,Career){
 const x=snapshot(state,Squad,Career);if(!x)return "";
 const metric=(label,value,desc)=>'<div class="j11-metric"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(desc)+'</span></div>';
 const next=x.competition?.next||x.competition?.hero||null;
 const reason=x.competition?.reason||x.competition?.lastDecision?.reason||"A comissão técnica avalia o elenco em cada jogo.";
 const rivals=Array.isArray(x.competition?.rivals)?x.competition.rivals:[];
 const competitors=rivals.filter(r=>r.id!=="hero").slice(0,3);
 const competitionHtml=competitors.length?'<ul>'+competitors.map(r=>'<li>'+esc(r.name)+' · GER '+esc(r.overall)+' · '+esc(r.status)+'</li>').join("")+'</ul>':"<p>Nenhum concorrente direto registrado.</p>";
 const recent=x.history.length?x.history.slice(0,4).map(h=>'<li>'+esc(h.source||h.type||h.reason||"Confiança")+' · '+esc(h.delta??h.after??"—")+'</li>').join(""):"<li>Sem alterações recentes disponíveis.</li>";
 const status=x.conversation?.active?"Conversa pendente":x.conversation?.available?"Conversa disponível":"Aguarde a próxima oportunidade";
 return '<section class="j11-dashboard" aria-label="Central de relação com o treinador"><header><small>J11 · RELAÇÃO COM O TREINADOR</small><h2>Seu espaço no elenco</h2><p>'+esc(x.manager?.name||"Comissão técnica")+' · '+esc(x.manager?.preferredFormation||"Formação a definir")+'</p></header><div class="j11-metrics">'+metric("CONFIANÇA",Math.round(x.trust)+"/100",x.trend>0?"Em alta":x.trend<0?"Em queda":"Estável")+metric("PAPEL NO ELENCO",x.role,"Definido pelo motor de hierarquia")+metric("TENDÊNCIA DO TREINO",x.trainingTrend.toFixed(1),"Impacto já registrado na avaliação")+metric("ÚLTIMA NOTA",x.rating==null?"—":Number(x.rating).toFixed(1),"Somente partidas disputadas")+'</div><div class="j11-panels"><article><small>DISPUTA POR MINUTOS</small><h3>Decisão da comissão</h3><p>'+esc(reason)+'</p><p>As oportunidades dependem da forma recente, condição física, treino, confiança e concorrência pela posição.</p><p><b>Concorrentes diretos:</b></p>'+competitionHtml+'<button type="button" data-page="lineup">Consultar escalação</button></article><article><small>RELACIONAMENTO</small><h3>'+esc(status)+'</h3><p>Use a conversa existente com o treinador e acompanhe promessas e respostas na seção de hierarquia abaixo.</p><button type="button" data-page="training">Ir para treinamento</button></article><article><small>HISTÓRICO DE CONFIANÇA</small><h3>Últimos registros</h3><ul>'+recent+'</ul></article></div><footer>Esta central apenas apresenta os dados existentes. Confiança, promessas e escalação continuam sob o controle dos sistemas originais.</footer></section>';
}
const api={snapshot,render};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifeJ11=api;
})(typeof globalThis!=="undefined"?globalThis:this);
