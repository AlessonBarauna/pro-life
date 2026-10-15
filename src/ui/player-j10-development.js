(function(root){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
// Indicador de momento J10.2: cálculo visual, separado do GER base e do motor.
function moment(base,condition,morale,form,injuryDays){
 const rate=Number.isFinite(Number(form))&&form!==null?Number(form):null;
 const conditionDelta=condition<40?-3:condition<65?-2:condition<80?-1:condition>=95?1:0;
 const moraleDelta=morale<35?-1:morale>=80?1:0;
 const formDelta=rate===null?0:rate>=8?2:rate>=7.2?1:rate<5.5?-2:rate<6.3?-1:0;
 const injuryDelta=injuryDays>0?-3:0;
 const adjustment=Math.max(-5,Math.min(4,conditionDelta+moraleDelta+formDelta+injuryDelta));
 return {value:Math.max(1,Math.min(100,Math.round(base+adjustment))),adjustment,components:{conditionDelta,moraleDelta,formDelta,injuryDelta}};
}
function snapshot(s,D,Career){
 if(!s||s.mode!=="player"||!s.person)return null;
 const p=s.person,plan=s.trainingPlan||{},pc=Career.init(s)?.playerCareer||{};
 const base=D.overall(p),condition=clamp(p.condition),morale=clamp(p.morale);
 const injuryDays=Math.max(0,Number(p.injury)||0);
 const readiness=injuryDays>0?"Indisponível":condition>=85?"Máximo":condition>=65?"Adequado":condition>=40?"Limitado":"Baixo";
 const form=pc.lastEvaluation?.rating??null;
 const last=pc.lastMatchReport||null;
 const changes=Array.isArray(last?.attributeChanges)?last.attributeChanges:[];
 const projected=typeof D.Training?.ceiling==="function"?D.Training.ceiling(s,D):null;
 const progress=Number.isFinite(Number(plan.developmentXp))?Number(plan.developmentXp):0;
 const current=moment(base,condition,morale,form,injuryDays);
 return {base,current,condition,morale,injuryDays,readiness,form,last,changes,projected,progress,planName:D.Training?.exercises?.[plan.exerciseId]?.name||"Plano automático",trainingAvailable:!!D.Training?.trainingAvailable?.(s),sessions:plan.sessions||0};
}
function render(s,D,Career){
 const m=snapshot(s,D,Career);if(!m)return "";
 const stat=(label,value,detail)=>'<div class="j10-kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(detail)+'</span></div>';
 const injury=m.injuryDays?m.injuryDays+" dia(s) de recuperação":"Sem lesão atual";
 const last=m.last?'<p>Última partida: '+esc(m.last.competition||"Partida")+' · '+esc(m.last.status||"")+' · '+esc(m.last.minutes??0)+' min · nota '+esc(m.last.rating??"—")+'</p>':'<p>Nenhuma partida recente registrada.</p>';
 const updates=m.changes.length?m.changes.map(x=>'<li>'+esc(x.label||x.key||"Atributo")+': '+esc(x.before)+' → '+esc(x.after)+'</li>').join(""):'<li>Nenhum atributo alterado na última partida.</li>';
 return '<section class="j10-dashboard" aria-label="Desenvolvimento e preparo físico"><header><small>J10 · DESENVOLVIMENTO DO ATLETA</small><h2>Forma, preparo e evolução</h2><p>Os indicadores distinguem habilidade, condição física e progressão registrada. Não concedem pontos adicionais.</p></header><div class="j10-kpis">'+stat("GER BASE",m.base,"Habilidade calculada pelos atributos")+stat("GER DE MOMENTO",m.current.value,(m.current.adjustment>0?"+":"")+m.current.adjustment+" · estimativa visual")+stat("PREPARO FÍSICO",m.readiness,m.condition+"% de condição")+stat("MORAL",m.morale+"/100","Estado atual do atleta")+stat("FORMA RECENTE",m.form==null?"—":Number(m.form).toFixed(1),"Última avaliação disponível")+'</div><div class="j10-grid"><article><small>RECUPERAÇÃO E DISPONIBILIDADE</small><h3>'+esc(injury)+'</h3><p>Condição: '+m.condition+'%. '+(m.injuryDays?"Treino e disponibilidade seguem as restrições do motor de lesões.":"Recuperação depende do descanso e do avanço diário já existente.")+'</p><div class="j10-meter"><i style="width:'+m.condition+'%"></i></div><p>Treino hoje: '+(m.trainingAvailable?"disponível":"indisponível ou já aplicado")+'</p></article><article><small>PROGRESSO REAL</small><h3>'+esc(m.planName)+'</h3><p>Treinos registrados: '+esc(m.sessions)+' · XP de desenvolvimento acumulado: '+esc(m.progress.toFixed(1))+'</p><p>Potencial projetado: '+esc(m.projected==null?"Não informado":"GER "+m.projected)+'. Isso não representa um ganho garantido.</p></article><article><small>ÚLTIMA PARTIDA</small>'+last+'<ul>'+updates+'</ul></article></div><p class="j10-note">Inspirado na transparência de GER dinâmico do FC 27. GER de momento é uma estimativa visual limitada a -5/+4, inspirada nos fatores divulgados do FC 27. Não altera os atributos, o GER usado no motor ou os resultados de partidas.</p></section>';
}
const api={snapshot,render,moment};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifeJ10=api;
})(typeof globalThis!=="undefined"?globalThis:this);
