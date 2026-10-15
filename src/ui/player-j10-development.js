(function(root){
"use strict";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
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
 return {base,condition,morale,injuryDays,readiness,form,last,changes,projected,progress,planName:D.Training?.exercises?.[plan.exerciseId]?.name||"Plano automático",trainingAvailable:!!D.Training?.trainingAvailable?.(s),sessions:plan.sessions||0};
}
function render(s,D,Career){
 const m=snapshot(s,D,Career);if(!m)return "";
 const stat=(label,value,detail)=>'<div class="j10-kpi"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong><span>'+esc(detail)+'</span></div>';
 const injury=m.injuryDays?m.injuryDays+" dia(s) de recuperação":"Sem lesão atual";
 const last=m.last?'<p>Última partida: '+esc(m.last.competition||"Partida")+' · '+esc(m.last.status||"")+' · '+esc(m.last.minutes??0)+' min · nota '+esc(m.last.rating??"—")+'</p>':'<p>Nenhuma partida recente registrada.</p>';
 const updates=m.changes.length?m.changes.map(x=>'<li>'+esc(x.label||x.key||"Atributo")+': '+esc(x.before)+' → '+esc(x.after)+'</li>').join(""):'<li>Nenhum atributo alterado na última partida.</li>';
 return '<section class="j10-dashboard" aria-label="Desenvolvimento e preparo físico"><header><small>J10 · DESENVOLVIMENTO DO ATLETA</small><h2>Forma, preparo e evolução</h2><p>Os indicadores distinguem habilidade, condição física e progressão registrada. Não concedem pontos adicionais.</p></header><div class="j10-kpis">'+stat("GER BASE",m.base,"Habilidade calculada pelos atributos")+stat("PREPARO FÍSICO",m.readiness,m.condition+"% de condição")+stat("MORAL",m.morale+"/100","Estado atual do atleta")+stat("FORMA RECENTE",m.form==null?"—":Number(m.form).toFixed(1),"Última avaliação disponível")+'</div><div class="j10-grid"><article><small>RECUPERAÇÃO E DISPONIBILIDADE</small><h3>'+esc(injury)+'</h3><p>Condição: '+m.condition+'%. '+(m.injuryDays?"Treino e disponibilidade seguem as restrições do motor de lesões.":"Recuperação depende do descanso e do avanço diário já existente.")+'</p><div class="j10-meter"><i style="width:'+m.condition+'%"></i></div><p>Treino hoje: '+(m.trainingAvailable?"disponível":"indisponível ou já aplicado")+'</p></article><article><small>PROGRESSO REAL</small><h3>'+esc(m.planName)+'</h3><p>Treinos registrados: '+esc(m.sessions)+' · XP de desenvolvimento acumulado: '+esc(m.progress.toFixed(1))+'</p><p>Potencial projetado: '+esc(m.projected==null?"Não informado":"GER "+m.projected)+'. Isso não representa um ganho garantido.</p></article><article><small>ÚLTIMA PARTIDA</small>'+last+'<ul>'+updates+'</ul></article></div><p class="j10-note">Inspirado na transparência de GER dinâmico do FC 27. O PRO-LIFE mantém seu próprio cálculo de GER e evolução; este painel não apresenta bônus temporários inventados.</p></section>';
}
const api={snapshot,render};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.ProLifeJ10=api;
})(typeof globalThis!=="undefined"?globalThis:this);
