(function coachCareerViewModule(root){
  "use strict";
  // Stage 34F.24 - tela "Carreira do Treinador": diretoria, vestiario, capitao, treino coletivo e historico.
  // Renderiza a partir de ProLifeCoachCareer.snapshot; os botoes usam data-coach-* e o app.js despacha command().

  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const ui={tab:"central"};
  const TABS=[["central","Central"],["diretoria","Diretoria"],["vestiario","Vestiário"],["treino","Treino coletivo"],["prejogo","Pré-jogo"],["historico","Histórico"]];
  const STATUS={cumprida:"Cumprida",falhou:"Falhou",em_andamento:"Em andamento"};

  function bar(value,tone){
    const v=Math.max(0,Math.min(100,Math.round(Number(value)||0)));
    return `<span class="cc-bar ${tone||""}"><i style="width:${v}%"></i></span>`;
  }
  function riskTone(id){return id==="seguro"||id==="estavel"?"ok":id==="pressao"?"warn":"bad";}

  function tabs(){
    return `<nav class="cc-tabs" role="tablist" aria-label="Seções da carreira">${TABS.map(([id,label])=>`<button type="button" role="tab" aria-selected="${ui.tab===id}" class="${ui.tab===id?"active":""}" data-coach-tab="${id}">${label}</button>`).join("")}</nav>`;
  }

  function central(s,D,sn){
    const next=typeof D?.nextCommitment==="function"?D.nextCommitment(s):null;
    const club=sn.club?.name||"Sem clube";
    const opponent=next?(next.home===s.clubId?next.away:next.away===s.clubId?next.home:null):null;
    const other=opponent?(D?.club?.(s,opponent)?.name||String(opponent)):null;
    const upcoming=next?'<b>'+esc(other||next.competitionName||"Próximo compromisso")+'</b><p class="cc-note">'+esc(next.competitionName||next.leagueName||"Competição")+' · Dia '+esc(next.date??next.day??"Não informado")+'</p>':'<p class="cc-note">Nenhum compromisso futuro registrado.</p>';
    const actions=typeof D?.pendingActions==="function"?(D.pendingActions(s)||[]):[];
    const pending=actions.slice(0,5).map(a=>'<li><span>'+esc(a.title||a.type||"Decisão pendente")+'</span><small>'+esc(a.page||"Acesse a seção correspondente")+'</small></li>').join("")||'<li class="muted">Nenhuma decisão pendente.</li>';
    const stories=(s.news||[]).slice().sort((a,b)=>(b.day||0)-(a.day||0)).slice(0,4).map(n=>'<li><span>'+esc(n.title||n.body||"Notícia")+'</span><small>Dia '+esc(n.day??s.day)+'</small></li>').join("")||'<li class="muted">Sem notícias recentes.</li>';
    const goals=(sn.goals?.items||[]).map(g=>'<li><span>'+esc(g.label)+'</span><small>'+esc(STATUS[g.status]||g.status)+'</small></li>').join("")||'<li class="muted">Metas disponíveis após assumir um clube.</li>';
    return '<div class="cc-grid">'+
      '<section class="cc-card"><small>PRÓXIMO COMPROMISSO</small><h3>'+esc(club)+'</h3>'+upcoming+'</section>'+
      '<section class="cc-card"><small>DIRETORIA</small><div class="cc-big '+riskTone(sn.risk.id)+'"><b>'+esc(sn.board)+'</b><span>'+esc(sn.risk.label)+'</span></div>'+bar(sn.board,riskTone(sn.risk.id))+'</section>'+
      '<section class="cc-card"><small>DECISÕES PENDENTES</small><ul class="cc-list">'+pending+'</ul></section>'+
      '<section class="cc-card"><small>NOTÍCIAS RECENTES</small><ul class="cc-list">'+stories+'</ul></section>'+
      '<section class="cc-card wide"><small>PRIORIDADES DA TEMPORADA</small><ul class="cc-list">'+goals+'</ul></section>'+
      '</div>';
  }

  function board(sn){
    const d=sn.detail||{},b=sn.breakdown;
    const goals=(sn.goals?.items||[]).map(g=>`<li class="cc-goal ${esc(g.status)}"><span>${esc(g.label)}</span><b>${esc(STATUS[g.status]||g.status)}</b></li>`).join("")||`<li class="muted">Sem metas: assine com um clube.</li>`;
    const comps=b?[["Resultados",b.resultados],["Posição vs. meta",b.metas],["Finanças",b.financas],["Vestiário",b.vestiario]].map(([k,v])=>`<div class="cc-row"><span>${k}</span>${bar(v)}<b>${v}</b></div>`).join(""):"";
    const hist=sn.history||[];
    const spark=hist.length>1?hist.slice().reverse().map(h=>`<i title="Dia ${h.day}: ${h.value}" style="height:${Math.max(4,h.value)}%"></i>`).join(""):"";
    return `<div class="cc-grid">
      <section class="cc-card"><small>CONFIANÇA DA DIRETORIA</small>
        <div class="cc-big ${riskTone(sn.risk.id)}"><b>${sn.board}</b><span>${esc(sn.risk.label)}</span></div>${bar(sn.board,riskTone(sn.risk.id))}
        ${d.reasons?.length?`<p class="cc-note">Pontos fracos: ${d.reasons.map(esc).join("; ")}.</p>`:`<p class="cc-note">A diretoria está satisfeita com o trabalho.</p>`}
        ${spark?`<div class="cc-spark" aria-label="Evolução da confiança">${spark}</div>`:""}</section>
      <section class="cc-card"><small>METAS DA TEMPORADA</small><ul class="cc-goals">${goals}</ul>
        ${sn.goals?`<p class="cc-note">Expectativa do clube na liga: ${sn.goals.expectedRank}º de ${sn.goals.leagueSize}.</p>`:""}</section>
      <section class="cc-card wide"><small>COMO A DIRETORIA AVALIA</small>${comps||'<p class="muted">Avaliação semanal ainda não disponível.</p>'}
        ${b?`<p class="cc-note">Posição atual ${b.pos}º/${b.of} · ${b.ppg} pts por jogo (esperado ${b.expected}).</p>`:""}</section>
    </div>`;
  }

  function locker(sn){
    const l=sn.locker;if(!l)return `<section class="cc-card"><p class="muted">Assine com um clube para gerir o vestiário.</p></section>`;
    const talks=Object.entries(l.talks).map(([k,t])=>{
      const cd=l.cooldowns[k];
      const target=k==="individual"?`<select data-coach-target aria-label="Jogador">${(sn.candidates||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} (${esc(p.pos)}, moral ${p.morale})</option>`).join("")}</select>`:"";
      return `<div class="cc-talk"><div><b>${esc(t.label)}</b><p class="cc-note">${esc(t.note)}</p></div>${target}<button type="button" class="primary" data-coach-talk="${k}" ${cd>0?"disabled":""}>${cd>0?`Em ${cd} dia(s)`:"Conversar"}</button></div>`;
    }).join("");
    const unhappy=l.unhappy.length?l.unhappy.slice(0,8).map(u=>`<li><span>${esc(u.name)} <em>${esc(u.pos)}</em></span><small>${esc(u.reason)}</small><b>${u.morale}</b></li>`).join(""):`<li class="muted">Nenhum jogador insatisfeito.</li>`;
    const cap=`<select data-coach-captain aria-label="Capitão"><option value="">Automático (por liderança)</option>${(sn.candidates||[]).map(p=>`<option value="${esc(p.id)}" ${sn.captain?.id===p.id?"selected":""}>${esc(p.name)} · ${esc(p.pos)} · ${p.age} anos</option>`).join("")}</select>`;
    return `<div class="cc-grid">
      <section class="cc-card"><small>CLIMA DO VESTIÁRIO</small><div class="cc-row"><span>Moral média</span>${bar(l.average)}<b>${l.average}</b></div><div class="cc-row"><span>Coesão</span>${bar(l.cohesion)}<b>${l.cohesion}</b></div>
        <small class="cc-sub">INSATISFEITOS</small><ul class="cc-list">${unhappy}</ul></section>
      <section class="cc-card"><small>CAPITÃO</small><p class="cc-note">Atual: <b>${esc(sn.captain?.name||"definido automaticamente")}</b>. Escolher um capitão dá +4 de moral a ele.</p>${cap}<button type="button" data-coach-setcaptain>Definir capitão</button></section>
      <section class="cc-card wide"><small>CONVERSAS</small>${talks}${l.log.length?`<small class="cc-sub">ÚLTIMAS CONVERSAS</small><ul class="cc-list">${l.log.map(x=>`<li><span>Dia ${x.day}</span><small>${esc(x.summary)}</small></li>`).join("")}</ul>`:""}</section>
    </div>`;
  }

  function training(sn){
    const items=Object.entries(sn.foci).map(([k,f])=>`<button type="button" class="cc-focus ${sn.focus===k?"active":""}" data-coach-focus="${k}" aria-pressed="${sn.focus===k}"><b>${esc(f.label)}</b><span>${esc(f.note)}</span></button>`).join("");
    return `<section class="cc-card"><small>FOCO DO TREINO COLETIVO</small><p class="cc-note">O foco vale toda semana até você trocar. Não substitui o treino individual do modo jogador.</p><div class="cc-foci">${items}</div></section>`;
  }

  function prematch(s,D,sn){
    if(!sn.hasClub)return '<section class="cc-card"><p class="muted">Assine com um clube para analisar o adversário.</p></section>';
    const fixture=D?.nextCommitment?.(s);
    const home=fixture?.home,away=fixture?.away;
    const oppId=home===s.clubId?away:away===s.clubId?home:null;
    const own=D?.club?.(s,s.clubId),opp=oppId?D?.club?.(s,oppId):null;
    const T=root.ProLifeSimulationTactics;
    if(!own||!opp||!T?.scoutingReport)return '<section class="cc-card"><p class="muted">Ainda não existe confronto de clubes disponível para análise tática. Consulte o Calendário.</p></section>';
    const report=T.scoutingReport(own,opp);
    const metrics=[["Posse relativa",report.indices.possession],["Criação de chances",report.indices.chanceCreation],["Segurança defensiva",report.indices.defensiveSecurity],["Carga física",report.indices.workload]];
    const stats=metrics.map(([label,value])=>'<div class="cc-row"><span>'+esc(label)+'</span>'+bar(value)+'<b>'+esc(value)+'</b></div>').join("");
    const risks=report.warnings.length?report.warnings.map(x=>'<li class="cc-risk"><b>'+esc(x.label)+'</b></li>').join(""):'<li>Sem alertas táticos elevados neste confronto.</li>';
    const strengths=report.strengths.length?report.strengths.map(x=>'<li>'+esc(x)+'</li>').join(""):'<li>Equilíbrio tático: observe a evolução da partida.</li>';
    return '<div class="cc-grid"><section class="cc-card wide"><small>PREPARAÇÃO PARA O PRÓXIMO JOGO</small><h3>'+esc(own.name)+' × '+esc(opp.name)+'</h3><p class="cc-note">'+esc(fixture.competitionName||"Competição")+' · Dia '+esc(fixture.date||s.day)+'</p></section><section class="cc-card"><small>COMPARAÇÃO TÁTICA</small>'+stats+'<p class="cc-note">'+esc(report.note)+'</p></section><section class="cc-card"><small>RISCOS DO PLANO</small><ul class="cc-list">'+risks+'</ul></section><section class="cc-card wide"><small>OPORTUNIDADES CONTRA O ADVERSÁRIO</small><ul class="cc-list">'+strengths+'</ul><p class="cc-note">Relatório informativo. Ajuste as táticas na tela de elenco; não há alteração automática de formação.</p></section></div>';
  }

  function history(sn){
    const t=sn.totals;
    const stints=sn.stints.length?sn.stints.slice().reverse().map(st=>`<section class="cc-card wide"><small>${esc(st.club||st.clubId)} · ${st.fromSeason}${st.exit?` → ${st.toSeason}`:" → atual"}</small>
      <p class="cc-note">${st.exit?`Saída: ${esc(st.exit)}${st.reason?` (${esc(st.reason)})`:""}`:"Em andamento"}${st.titles?` · ${st.titles} título(s)`:""}</p>
      ${st.rows.length?`<table class="cc-table"><thead><tr><th>Temp.</th><th>Pos.</th><th>Pts</th><th>V-E-D</th><th>Metas</th></tr></thead><tbody>${st.rows.map(r=>`<tr><td>${r.season}</td><td>${r.pos}º/${r.of}</td><td>${r.points}</td><td>${r.w}-${r.d}-${r.l}</td><td>${r.score}%</td></tr>`).join("")}</tbody></table>`:'<p class="muted">Nenhuma temporada concluída.</p>'}</section>`).join(""):`<section class="cc-card"><p class="muted">O histórico começa quando você assinar com um clube.</p></section>`;
    return `<section class="cc-card"><small>CARREIRA</small><div class="cc-strip"><div><b>${t.seasons}</b><span>Temporadas</span></div><div><b>${t.titles}</b><span>Títulos</span></div><div><b>${t.w}-${t.d}-${t.l}</b><span>V-E-D</span></div><div><b>${esc(sn.license||"-")}</b><span>Licença</span></div></div></section>${stints}`;
  }

  function css(){
    return `<style>
      .cc-dark{--cc-bg:#0a1119;--cc-card:#111b26;--cc-line:rgba(255,255,255,.09);--cc-text:#f2f4f6;--cc-muted:#8b99a6;--cc-gold:#d8b45b;--cc-ok:#4cc3b0;--cc-warn:#d8b45b;--cc-bad:#d9695f;padding:24px;border-radius:18px;background:var(--cc-bg);color:var(--cc-text);border:1px solid var(--cc-line)}
      .cc-dark h2{margin:0 0 4px}.cc-dark small{color:var(--cc-muted);letter-spacing:.12em;text-transform:uppercase;font-size:11px}.cc-sub{display:block;margin-top:14px}
      .cc-tabs{display:flex;gap:4px;border-bottom:1px solid var(--cc-line);margin:14px 0 18px;flex-wrap:wrap}.cc-tabs button{background:none;border:0;border-bottom:2px solid transparent;color:var(--cc-muted);padding:10px 16px;font:inherit;font-weight:600;cursor:pointer}.cc-tabs button.active{color:var(--cc-text);border-bottom-color:var(--cc-gold)}
      .cc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.cc-card{background:var(--cc-card);border:1px solid var(--cc-line);border-radius:12px;padding:16px;margin-bottom:14px}.cc-grid .cc-card{margin:0}.cc-card.wide{grid-column:1/-1}
      .cc-big{display:flex;align-items:baseline;gap:12px;margin:8px 0}.cc-big b{font-size:44px;font-variant-numeric:tabular-nums;line-height:1}.cc-big.ok b{color:var(--cc-ok)}.cc-big.warn b{color:var(--cc-warn)}.cc-big.bad b{color:var(--cc-bad)}
      .cc-bar{display:block;height:6px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;flex:1}.cc-bar i{display:block;height:100%;background:var(--cc-ok)}.cc-bar.warn i{background:var(--cc-warn)}.cc-bar.bad i{background:var(--cc-bad)}
      .cc-row{display:grid;grid-template-columns:150px 1fr 36px;align-items:center;gap:10px;margin:8px 0}.cc-row b{text-align:right;font-variant-numeric:tabular-nums}
      .cc-note{color:var(--cc-muted);font-size:13px;margin:8px 0}.cc-spark{display:flex;align-items:flex-end;gap:3px;height:42px;margin-top:10px}.cc-spark i{flex:1;background:rgba(216,180,91,.55);border-radius:2px 2px 0 0}
      .cc-goals,.cc-list{list-style:none;margin:8px 0 0;padding:0}.cc-goal,.cc-list li{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--cc-line)}.cc-goal.cumprida b{color:var(--cc-ok)}.cc-goal.falhou b{color:var(--cc-bad)}.cc-list li small{flex:1;text-transform:none;letter-spacing:0}.cc-list em{color:var(--cc-muted);font-style:normal;font-size:12px}
      .cc-talk{display:grid;grid-template-columns:1fr minmax(0,240px) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--cc-line)}.cc-talk p{margin:2px 0 0}.cc-dark select{max-width:100%;margin:6px 0}.cc-card button:disabled{opacity:.5;cursor:not-allowed}
      .cc-foci{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:10px}.cc-focus{display:flex;flex-direction:column;gap:6px;text-align:left;background:transparent;border:1px solid var(--cc-line);border-radius:10px;padding:12px;color:var(--cc-text);cursor:pointer}.cc-focus span{color:var(--cc-muted);font-size:12px}.cc-focus.active{border-color:var(--cc-gold);background:rgba(216,180,91,.08)}
      .cc-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}.cc-strip b{display:block;font-size:24px}.cc-strip span{color:var(--cc-muted);font-size:12px}.cc-table{width:100%;border-collapse:collapse;font-size:13px}.cc-table th,.cc-table td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--cc-line)}.cc-table th{color:var(--cc-muted);font-weight:600}
      .cc-dark button:focus-visible,.cc-dark select:focus-visible{outline:2px solid var(--cc-gold);outline-offset:2px}
      @media(max-width:900px){.cc-dark{padding:16px}.cc-grid{grid-template-columns:1fr}.cc-row{grid-template-columns:110px 1fr 32px}.cc-talk{grid-template-columns:1fr}.cc-strip{grid-template-columns:repeat(2,1fr)}}
    </style>`;
  }

  function render(s,D){
    const C=D?.CoachCareer||root.ProLifeCoachCareer;
    if(!C||s?.mode!=="coach")return `<section class="card"><h2>Carreira do Treinador</h2><p class="muted">Disponível apenas no modo treinador.</p></section>`;
    const sn=C.snapshot(s,D);
    const body=ui.tab==="central"?central(s,D,sn):ui.tab==="vestiario"?locker(sn):ui.tab==="treino"?(sn.hasClub?training(sn):`<section class="cc-card"><p class="muted">Assine com um clube para definir o treino.</p></section>`):ui.tab==="historico"?history(sn):ui.tab==="prejogo"?prematch(s,D,sn):(sn.hasClub?board(sn):`<section class="cc-card"><p class="muted">Você está sem clube. Aceite uma proposta na aba Propostas para voltar a trabalhar.</p></section>`);
    return `${css()}<section class="cc-dark"><h2>Carreira do Treinador</h2><small>${esc(sn.club?.name||"Sem clube")} · Temporada ${esc(s.season)} · Reputação ${esc(Math.round(sn.reputation||0))}</small>${tabs()}${body}</section>`;
  }

  const api={render,state:ui,esc,setTab:id=>{if(TABS.some(x=>x[0]===id))ui.tab=id;}};
  root.ProLifeCoachCareerView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
