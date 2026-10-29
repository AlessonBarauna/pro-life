(function coachCareerViewModule(root){
  "use strict";
  // Stage 34F.24 - tela "Carreira do Treinador": diretoria, vestiario, capitao, treino coletivo e historico.
  // Renderiza a partir de ProLifeCoachCareer.snapshot; os botoes usam data-coach-* e o app.js despacha command().

  const careerDate=(s,day)=>Number.isFinite(Number(day))?new Date(Date.UTC(2026,0,s?.world==="legacy"?5:1)+Number(day)*86400000).toLocaleDateString("pt-BR",{timeZone:"UTC"}):"Data indisponível";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const ui={tab:"central",dealTab:"propostas",selectedDeal:null,selectedSigning:null,draftOffer:null,marketArea:"transferencias",listScreen:"alvos",scoutQuery:"",scoutPosition:"all",scoutRegion:"all",scoutClub:"",scoutCompetition:"",scoutCountry:"all",scoutAge:"all",scoutAgeMin:"all",scoutAgeMax:"all",scoutPotentialMin:"all",scoutPotentialMax:"all",scoutOverallMin:"all",scoutOverallMax:"all",scoutSort:"overall",scoutSortDirection:"desc",scoutCategory:"all",scoutPage:0,selectedScoutPlayer:null,scoutScreen:"busca",scoutReturnScreen:"busca"};
  const TABS=[["central","Central"],["diretoria","Diretoria"],["vestiario","Vestiário"],["treino","Treino coletivo"],["prejogo","Pré-jogo"],["negociacoes","Negociações"],["historico","Histórico"],["configuracoes","Configurações"]];
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
    const ratingEngine=root.ProLifeCoachMatchRating;
    const roster=Array.isArray(own.roster)?own.roster:[];
    const assessed=ratingEngine?.evaluateRoster?.(roster)||[];
    const eligible=assessed.filter(row=>row.available).sort((a,b)=>b.effective-a.effective||a.index-b.index);
    const avg=eligible.length?Math.round(eligible.reduce((sum,row)=>sum+row.effective,0)/eligible.length):null;
    const readiness=ratingEngine?'<section class="cc-card wide"><small>GER EFETIVO DO ELENCO — T1</small><h3>'+esc(avg??"—")+' <small>média dos disponíveis</small></h3><ul class="cc-list">'+eligible.slice(0,5).map(row=>{const p=roster[row.index]||{};return '<li><span>'+esc(p.name||p.fullName||p.id||"Jogador")+'</span> <b>'+esc(row.base)+' → '+esc(row.effective)+'</b></li>';}).join("")+'</ul><p class="cc-note">Prévia informativa de rendimento. O GER permanente e a escalação não são alterados.</p></section>':'';
    const alerts=assessed.map(row=>{
      const player=roster[row.index]||{};
      const name=esc(player.name||player.fullName||player.id||"Jogador");
      const issue=!row.available?"Indisponivel por lesao":row.condition<65?"Condicao fisica baixa":row.modifier<=-8?"Rendimento abaixo do habitual":null;
      return issue?{name,issue,effective:row.effective,priority:!row.available?0:row.condition<65?1:2}:null;
    }).filter(Boolean).sort((a,b)=>a.priority-b.priority).slice(0,6);
    const advice=ratingEngine?'<section class="cc-card wide"><small>ALERTAS DO AUXILIAR - T1</small>'+
      (alerts.length?'<ul class="cc-list">'+alerts.map(a=>'<li><b>'+a.name+'</b> - '+esc(a.issue)+' (GER de partida '+esc(a.effective)+')</li>').join("")+'</ul>':'<p class="cc-note">Nenhum alerta individual de disponibilidade ou rendimento.</p>')+
      '<p class="cc-note">Avaliacoes do elenco, nao da escalacao confirmada. As decisoes continuam com o treinador.</p></section>':'';
    const strengths=report.strengths.length?report.strengths.map(x=>'<li>'+esc(x)+'</li>').join(""):'<li>Equilíbrio tático: observe a evolução da partida.</li>';
    return '<div class="cc-grid">'+readiness+advice+'<section class="cc-card wide"><small>PREPARAÇÃO PARA O PRÓXIMO JOGO</small><h3>'+esc(own.name)+' × '+esc(opp.name)+'</h3><p class="cc-note">'+esc(fixture.competitionName||"Competição")+' · Dia '+esc(fixture.date||s.day)+'</p></section><section class="cc-card"><small>COMPARAÇÃO TÁTICA</small>'+stats+'<p class="cc-note">'+esc(report.note)+'</p></section><section class="cc-card"><small>RISCOS DO PLANO</small><ul class="cc-list">'+risks+'</ul></section><section class="cc-card wide"><small>OPORTUNIDADES CONTRA O ADVERSÁRIO</small><ul class="cc-list">'+strengths+'</ul><p class="cc-note">Relatório informativo. Ajuste as táticas na tela de elenco; não há alteração automática de formação.</p></section></div>';
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
      .cc-neg-offer{display:flex;flex-direction:column;gap:6px;margin:12px 0;max-width:360px}.cc-neg-offer input,.cc-neg-offer select{padding:9px;border-radius:8px;border:1px solid var(--cc-line);background:rgba(0,0,0,.25);color:var(--cc-text)}.cc-neg-history{padding:12px 0;border-top:1px solid var(--cc-line);margin-top:12px}.cc-neg-dialog{margin:12px 0 20px}.cc-deal-nav{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}.cc-deal-nav button{background:transparent;border:1px solid var(--cc-line);color:var(--cc-text);padding:10px 14px;border-radius:8px;cursor:pointer}.cc-deal-nav button[aria-pressed="true"]{border-color:var(--cc-gold);background:rgba(216,180,91,.15)}.cc-deal-nav small{opacity:.7;margin-left:5px}.cc-deal-section{min-height:200px}.cc-deal-player{display:flex;flex-direction:column;gap:4px}.cc-deal-player small{color:var(--cc-muted)}.cc-deal-parties{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.cc-deal-team{display:inline-flex;align-items:center;gap:6px;font-size:13px}.cc-deal-team .pl-club-crest{width:28px;height:28px;object-fit:contain}.cc-deal-terms{display:flex;flex-direction:column;gap:4px}.cc-deal-terms small{color:var(--cc-muted)}
      .cc-deal-grid{margin-top:14px}.cc-deal{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--cc-line)}.cc-deal strong,.cc-deal b{font-size:14px}.cc-deal-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cc-deal-actions button,.cc-deal button{background:rgba(216,180,91,.12);border:1px solid var(--cc-gold);color:var(--cc-text);padding:8px 12px;border-radius:7px;cursor:pointer}.cc-status{font-size:12px;color:var(--cc-muted)}.cc-deal small{color:var(--cc-muted)}
      .cc-dark button:focus-visible,.cc-dark select:focus-visible{outline:2px solid var(--cc-gold);outline-offset:2px}
      @media(max-width:900px){.cc-dark{padding:16px}.cc-grid{grid-template-columns:1fr}.cc-row{grid-template-columns:110px 1fr 32px}.cc-talk{grid-template-columns:1fr}.cc-strip{grid-template-columns:repeat(2,1fr)}}
    </style>`;
  }

  // Career-facing deal centre. Read-only lists follow persisted financial records;
  // actions use the existing app command dispatcher and never duplicate market logic.
  function negotiations(s,D){
    const c=s.coachCareer||{};
    const money=v=>"R$ "+Math.round(Number(v)||0).toLocaleString("pt-BR");
    const squadHub=root.ProLifeCoachSquadHub;
    if(ui.marketArea==="overview")return squadHub?.renderOverview?.(s,D)||'<section class="cc-card"><p class="cc-note">Visão geral indisponível.</p></section>';
    if(ui.marketArea==="squad")return squadHub?.render?.(s,D)||'<section class="cc-card"><p class="cc-note">Gestão do elenco indisponível.</p></section>';
    const listNav='<nav class="cc-deal-nav cc-scout-subnav" aria-label="Menus das listas">'+[["alvos","Alvos"],["sondagens","Sondagens"],["saidas","Saídas e empréstimos"]].map(([id,label])=>'<button type="button" data-coach-list-screen="'+id+'" aria-pressed="'+(ui.listScreen===id)+'">'+label+'</button>').join("")+'</nav>';
    const listsOnScouting=ui.marketArea==="lists"&&["alvos","sondagens"].includes(ui.listScreen);
    if(ui.marketArea==="lists"&&!listsOnScouting)return listNav+(squadHub?.renderLists?.(s,D)||'<section class="cc-card"><p class="cc-note">Listas do mercado indisponíveis.</p></section>');
    if(ui.marketArea==="observacao"&&["alvos","sondagens"].includes(ui.scoutScreen))ui.scoutScreen="busca";
    if(listsOnScouting&&ui.scoutScreen!=="perfil")ui.scoutScreen=ui.listScreen;
    // Market panels are read from the same save used by the existing transfer engine.
    if(ui.marketArea==="observacao"||listsOnScouting){
      const gf=D?.GlobalFootball||root.ProLifeGlobalFootball;
      const clubs=[...(s.clubs||[]),...(s.globalFootball?.clubs||[])];
      const clubIndex=new Map(clubs.map(cl=>[cl.id,cl]));
      const leagueIndex=new Map([...(s.leagues||[]),...(s.globalFootball?.leagues||[])].filter(x=>x?.id).map(x=>[String(x.id),x]));
      const competitionName=cl=>{const id=String(cl?.leagueId||"");return String(leagueIndex.get(id)?.name||leagueIndex.get(id)?.label||id);};
      const normalizeText=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR");
      const regionCountries={
        "América do Sul":new Set(["brasil","argentina","uruguai","colombia","chile","paraguai","equador","peru","bolivia","venezuela"]),
        "América do Norte":new Set(["estados unidos","united states","mexico","canada","costa rica","panama","jamaica","honduras","el salvador","guatemala","republica dominicana","dominican republic"]),
        "Europa":new Set(["alemanha","austria","azerbaijao","belgica","bulgaria","chipre","croacia","dinamarca","escocia","espanha","finlandia","franca","grecia","hungria","inglaterra","italia","noruega","paises baixos","polonia","portugal","republic of ireland","irlanda","romenia","suecia","suica","tchequia","turquia","ucrania"]),
        "África":new Set(["africa do sul","argelia","camaroes","costa do marfim","egito","gana","marrocos","nigeria","senegal","tunisia"]),
        "Ásia":new Set(["arabia saudita","australia","china","coreia do sul","emirados arabes unidos","india","japao","qatar","thailand"])
      };
      const clubCountry=cl=>String(cl?.country||leagueIndex.get(String(cl?.leagueId||""))?.country||(!String(cl?.leagueId||"").startsWith("gf_")?"Brasil":""));
      const clubRegion=cl=>{
        const country=normalizeText(clubCountry(cl));
        if(country==="brasil")return "Brasil";
        for(const [region,countries] of Object.entries(regionCountries))if(countries.has(country))return region;
        return "Outros";
      };
      const matchesRegion=cl=>ui.scoutRegion==="all"||(ui.scoutRegion==="América do Sul"?(clubRegion(cl)==="América do Sul"||clubRegion(cl)==="Brasil"):clubRegion(cl)===ui.scoutRegion);
      const clubNeedle=normalizeText(ui.scoutClub.trim()),competitionNeedle=normalizeText(ui.scoutCompetition.trim());
      const needle=normalizeText(ui.scoutQuery.trim());
      // International athletes are stored in internationalPlayers, not global clubs' rosters.
      const pool=gf?.activePlayers?.(s)||[...clubs.flatMap(cl=>cl.roster||[]),...(s.internationalPlayers||[])];
      const seen=new Set(),candidates=[];
      const norm=v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      const listed=p=>p.transferListed===true||p.listedForTransfer===true||p.onTransferList===true||p.marketStatus==="transfer_listed";
      for(const p of pool){
        if(!p?.id||p.id==="hero"||seen.has(p.id)||p.active===false||p.status==="retired")continue;
        seen.add(p.id);
        if(p.clubId===s.clubId)continue;
        const free=!p.clubId,age=Number(p.age);
        if(free&&ui.scoutCategory!=="free")continue;
        if(!free&&ui.scoutCategory==="free")continue;
        const currentClub=clubIndex.get(p.clubId)||gf?.clubById?.(s,p.clubId);
        if(ui.scoutRegion!=="all"&&(!currentClub||!matchesRegion(currentClub)))continue;
        if(clubNeedle&&!normalizeText(currentClub?.name).includes(clubNeedle))continue;
        if(competitionNeedle&&!normalizeText(competitionName(currentClub)).includes(competitionNeedle))continue;
        if(ui.scoutCountry!=="all"&&norm(p.nationality||p.nation)!==norm(ui.scoutCountry))continue;
        const overall=Number(p.overall??p.ovr??D?.overall?.(p));
        const potential=Number(p.potential??overall);
        if(ui.scoutOverallMin!=="all"&&(!Number.isFinite(overall)||overall<Number(ui.scoutOverallMin)))continue;
        if(ui.scoutOverallMax!=="all"&&(!Number.isFinite(overall)||overall>Number(ui.scoutOverallMax)))continue;
        if(ui.scoutPotentialMin!=="all"&&(!Number.isFinite(potential)||potential<Number(ui.scoutPotentialMin)))continue;
        if(ui.scoutPotentialMax!=="all"&&(!Number.isFinite(potential)||potential>Number(ui.scoutPotentialMax)))continue;
        if(ui.scoutAgeMin!=="all"&&(!Number.isFinite(age)||age<Number(ui.scoutAgeMin)))continue;
        if(ui.scoutAgeMax!=="all"&&(!Number.isFinite(age)||age>Number(ui.scoutAgeMax)))continue;
        if(ui.scoutAge==="under18"&&!(age<=18))continue;
        if(ui.scoutAge==="under21"&&!(age<=21))continue;
        if(ui.scoutAge==="under23"&&!(age<=23))continue;
        if(ui.scoutAge==="23to29"&&!(age>=23&&age<=29))continue;
        if(ui.scoutAge==="30plus"&&!(age>=30))continue;
        if(ui.scoutCategory==="promises"&&!(age<=21&&Number(p.potential)>=80))continue;
        if(ui.scoutCategory==="listed"&&!listed(p))continue;
        if(needle&&!normalizeText(p.name).includes(needle))continue;
        if(ui.scoutPosition!=="all"){const position=String(p.primaryPosition||"").toUpperCase();const generic=String(p.pos||p.position||"").toUpperCase();const target=ui.scoutPosition;const aliases={GOL:"GOL",GL:"GOL",ATA:"CA",ZAG:"ZAG",LAT:"LAT",LD:"LD",LE:"LE",VOL:"VOL",MC:"MC",MD:"MD",ME:"ME",MEI:"MEI",PD:"PD",PE:"PE"};const expected=aliases[target]||target;const match=target==="LAT"?["LD","LE","ALD","ALE"].includes(position):position?(position===expected||(target==="GOL"&&position==="GOL")||(target==="ATA"&&position==="ATA")):generic===target||(target==="GL"&&generic==="GOL");if(!match)continue;}
        const cl=clubIndex.get(p.clubId)||gf?.clubById?.(s,p.clubId);
        if(!free&&(!cl||cl.active===false))continue;
        candidates.push({p,cl,free,overall:Number.isFinite(overall)?overall:null,potential:Number.isFinite(potential)?potential:null,age:Number.isFinite(age)?age:null});

      }
      candidates.sort((left,right)=>{
        const leftValue=ui.scoutSort==="age"?left.age:ui.scoutSort==="potential"?left.potential:left.overall;
        const rightValue=ui.scoutSort==="age"?right.age:ui.scoutSort==="potential"?right.potential:right.overall;
        if(leftValue===null&&rightValue!==null)return 1;
        if(rightValue===null&&leftValue!==null)return -1;
        const numeric=(leftValue??0)-(rightValue??0);
        if(numeric)return ui.scoutSortDirection==="desc"?-numeric:numeric;
        return String(left.p.name||"").localeCompare(String(right.p.name||""),"pt-BR");
      });
      const pageSize=40;
      const pageCount=Math.max(1,Math.ceil(candidates.length/pageSize));
      ui.scoutPage=Math.min(Math.max(0,ui.scoutPage),pageCount-1);
      const visibleCandidates=candidates.slice(ui.scoutPage*pageSize,(ui.scoutPage+1)*pageSize);
      const opt=(v,t,current)=>'<option value="'+esc(v)+'"'+(String(v)===String(current)?' selected':'')+'>'+esc(t)+'</option>';
      const rangeOptions=(min,max,current,emptyLabel)=>opt("all",emptyLabel,current)+Array.from({length:max-min+1},(_,index)=>min+index).map(value=>opt(value,value,current)).join("");
      const nations=[...new Set(pool.map(p=>String(p.nationality||p.nation||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
      const availableClubs=clubs.filter(cl=>cl.id&&cl.active!==false).slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"pt-BR"));
      const competitionOptions=[...new Set(availableClubs.map(competitionName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
      const advanced='<div class="cc-scout-filters">'+
        '<label>Clube<input type="search" data-coach-scout-club list="cc-scout-club-options" placeholder="Digite o nome do clube" value="'+esc(ui.scoutClub)+'"><datalist id="cc-scout-club-options">'+availableClubs.map(cl=>'<option value="'+esc(cl.name||cl.id)+'"></option>').join("")+'</datalist></label>'+ 
        '<label>Competição<input type="search" data-coach-scout-competition list="cc-scout-competition-options" placeholder="Digite a competição ou liga" value="'+esc(ui.scoutCompetition)+'"><datalist id="cc-scout-competition-options">'+competitionOptions.map(name=>'<option value="'+esc(name)+'"></option>').join("")+'</datalist></label>'+
        '<label>País / nacionalidade<select data-coach-scout-country>'+opt("all","Todos os países",ui.scoutCountry)+nations.map(n=>opt(n,n,ui.scoutCountry)).join("")+'</select></label>'+
        '<label>GER mínimo<select data-coach-scout-overall-min>'+rangeOptions(1,99,ui.scoutOverallMin,"Qualquer")+'</select></label>'+
        '<label>GER máximo<select data-coach-scout-overall-max>'+rangeOptions(1,99,ui.scoutOverallMax,"Qualquer")+'</select></label>'+
        '<label>POT mínimo<select data-coach-scout-potential-min>'+rangeOptions(1,99,ui.scoutPotentialMin,"Qualquer")+'</select></label>'+
        '<label>POT máximo<select data-coach-scout-potential-max>'+rangeOptions(1,99,ui.scoutPotentialMax,"Qualquer")+'</select></label>'+
        '<label>Idade mínima<select data-coach-scout-age-min>'+rangeOptions(15,50,ui.scoutAgeMin,"Qualquer")+'</select></label>'+
        '<label>Idade máxima<select data-coach-scout-age-max>'+rangeOptions(15,50,ui.scoutAgeMax,"Qualquer")+'</select></label>'+
        '<label>Ordenar por<select data-coach-scout-sort>'+opt("overall","GER",ui.scoutSort)+opt("potential","Potencial",ui.scoutSort)+opt("age","Idade",ui.scoutSort)+'</select></label>'+
        '<label>Ordem<select data-coach-scout-sort-direction>'+opt("desc","Maior para menor",ui.scoutSortDirection)+opt("asc","Menor para maior",ui.scoutSortDirection)+'</select></label>'+
        '<label>Categoria<select data-coach-scout-category>'+[["all","Todos vinculados"],["promises","Jovens promessas (até 21, potencial 80+)"],["free","Agentes livres"],["listed","Na lista de transferências"]].map(([v,t])=>opt(v,t,ui.scoutCategory)).join("")+'</select></label></div>';
      const scouting=root.ProLifeCoachScoutingV2;
      const missions=Array.isArray(c.scoutingV2?.missions)?c.scoutingV2.missions:[];
      const playerLookup=new Map(pool.filter(p=>p?.id!=null).map(p=>[String(p.id),p]));
      // Saves antigos podem carregar uma sondagem com o id de catálogo obsoleto
      // (ou, em versões afetadas, repetido), embora preservem o nome correto.
      // Nunca deixe esse registro abrir o primeiro atleta da busca mundial.
      const resolveInquiryPlayer=entry=>{
        if(!entry)return null;
        const storedName=normalizeText(entry.playerName);
        const byId=playerLookup.get(String(entry.playerId));
        if(byId&&(!storedName||normalizeText(byId.name)===storedName))return byId;
        if(!storedName)return byId||null;
        const matches=pool.filter(player=>player?.id!=null&&normalizeText(player.name)===storedName);
        return matches.find(player=>String(player.clubId)===String(entry.clubId))||matches[0]||null;
      };
      const recommendations=scouting?.recommend?.(s,pool,5)||[];
      const savedRecommendations=new Set((c.shortlist||[]).map(x=>String(x.playerId)+"|"+String(x.clubId)));
      const recommendationRows=recommendations.map(x=>'<article class="cc-scout-mission"><div class="cc-scout-mission-heading"><div><b>'+esc(x.name)+'</b><small>'+esc(x.position)+' · '+esc(x.reason)+'</small></div><strong>'+esc(x.score)+' PTS</strong></div><div class="cc-scout-mission-data"><span>GER '+esc(x.overallRange.join("–"))+' · POT '+esc(x.potentialRange.join("–"))+'</span><span>Confiança '+esc(x.certainty)+'%</span></div><div class="cc-target-actions">'+(x.clubId==null?'<small>Clube indisponível</small>':savedRecommendations.has(String(x.playerId)+"|"+String(x.clubId))?'<small>Já está na lista</small>':'<button type="button" data-coach-shortlist="'+esc(x.clubId)+'" data-coach-player="'+esc(x.playerId)+'">Adicionar à lista</button>')+'</div></article>').join("");
      const recommendationsPanel='<section class="cc-card cc-fc27-reports cc-scout-recommendations"><small>ANÁLISE DA REDE</small><h3>Jogadores recomendados</h3><p class="cc-note">Classificação informativa baseada em relatórios concluídos e posições carentes do elenco. Nenhuma contratação automática.</p>'+(recommendationRows||'<p class="cc-note">Conclua uma missão de observação para receber recomendações.</p>')+'</section>';
      const activeMissions=missions.filter(m=>m.status==="active").length;
      const doneMissions=missions.filter(m=>m.status==="complete").length;
      const missionRows=missions.slice().reverse().slice(0,15).map(m=>{
        const player=playerLookup.get(String(m.playerId));
        const info=scouting?.report?.(s,m.id,player)||null;
        const progress=Math.round(Math.max(0,Math.min(1,Number(m.progress)||0))*100);
        const finished=m.status==="complete";
        const expiryDay=Number(m.startDay)+Number(m.duration);
        const remaining=Math.max(0,Math.ceil(expiryDay-Number(s.day)));
        const reported=info?.available&&Array.isArray(info.estimatedOverall)&&Array.isArray(info.potentialRange);
        const stats=reported?'<span>GER '+esc(info.estimatedOverall.join("–"))+' · POT '+esc(info.potentialRange.join("–"))+'</span>':'<span>Relatório indisponível neste save</span>';
        return '<article class="cc-scout-mission"><div class="cc-scout-mission-heading"><div><b>'+esc(player?.name||m.playerId)+'</b><small>'+esc(m.region||"Região não informada")+' · Qualidade do olheiro '+esc(m.quality??"—")+'/100 · Especialidade: '+esc(m.specialty||"geral")+'</small></div><strong class="'+(finished?'done':'')+'">'+(finished?'Concluído':"Em andamento")+'</strong></div>'+
          '<div class="cc-scout-mission-data">'+stats+'<span>'+esc(reported?info.certainty+"% de confiança"+(info.specialtyFit?" · Foco compatível +"+info.specialistBonus:""):"Sem estimativa")+'</span></div>'+
          '<div class="cc-scout-progress" role="progressbar" aria-label="Progresso da observação de '+esc(player?.name||m.playerId)+'" aria-valuenow="'+progress+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+progress+'%"></i></div>'+
          '<div class="cc-scout-mission-footer"><span>'+progress+'% concluído</span><span>'+ (finished?'Relatório finalizado em '+careerDate(s,expiryDay):'Previsão: '+careerDate(s,expiryDay)+' · Faltam '+remaining+' dia(s)')+'</span></div></article>';
      }).join("");
      const missionPanel='<section class="cc-card cc-fc27-reports cc-scout-mission-hub"><div class="cc-scout-mission-top"><div><small>REDE DE OBSERVAÇÃO</small><h3>Central de olheiros</h3><p class="cc-note">Missões persistidas na carreira. Relatórios e prazos evoluem conforme os dias avançam.</p></div><div class="cc-scout-mission-counters"><div><b>'+activeMissions+'</b><span>EM ANDAMENTO</span></div><div><b>'+doneMissions+'</b><span>CONCLUÍDAS</span></div></div></div>'+
        (missionRows||'<p class="cc-note">Nenhuma missão cadastrada. Selecione um jogador e use Observar jogador para iniciar.</p>')+'</section>';
      const shortlist=c.shortlist||[];
      const selectedTarget=shortlist.length&&shortlist.some(x=>String(x.playerId)===String(ui.selectedScoutPlayer))?pool.find(p=>String(p.id)===String(ui.selectedScoutPlayer)):null;
      const targetClub=selectedTarget?clubIndex.get(selectedTarget.clubId)||gf?.clubById?.(s,selectedTarget.clubId):null;
      const myInquiries=(c.inquiries||[]).filter(x=>String(x.buyerClubId)===String(s.clubId)).slice().sort((a,b)=>Number(b.startDay)-Number(a.startDay));
      const onInquiries=ui.scoutScreen==="sondagens";
      const selectedInquiryEntry=onInquiries?myInquiries.find(x=>String(resolveInquiryPlayer(x)?.id??x.playerId)===String(ui.selectedScoutPlayer)):null;
      const wantedId=onInquiries?(selectedInquiryEntry?ui.selectedScoutPlayer:myInquiries[0]?.playerId):ui.selectedScoutPlayer;
      // Abre o jogador escolhido mesmo que ele não esteja nos filtros atuais da busca (ex.: vindo de Sondagens).
      const resolveCandidate=id=>{
        if(id==null)return null;
        const inVisible=visibleCandidates.find(x=>String(x.p.id)===String(id));if(inVisible)return inVisible;
        const ref=myInquiries.find(x=>String(resolveInquiryPlayer(x)?.id??x.playerId)===String(id))||shortlist.find(x=>String(x.playerId)===String(id));
        const p=pool.find(x=>String(x.id)===String(id))||(ref?.playerName?resolveInquiryPlayer(ref):null);if(!p)return null;
        const cl=(ref&&(clubIndex.get(ref.clubId)||gf?.clubById?.(s,ref.clubId)))||(p.clubId&&(clubIndex.get(p.clubId)||gf?.clubById?.(s,p.clubId)))||null;
        return cl?{p,cl,free:false}:null;
      };
      const selectedCandidate=(selectedTarget&&targetClub?{p:selectedTarget,cl:targetClub,free:false}:null)||(onInquiries?resolveCandidate(wantedId):null)||resolveCandidate(ui.selectedScoutPlayer)||(ui.selectedScoutPlayer==null?visibleCandidates[0]:null)||null;
      const selectedPlayer=selectedCandidate?.p||null;
      const selectedClub=selectedCandidate?.cl||null;
      const scoutingReport=selectedPlayer?missions.find(m=>String(m.playerId)===String(selectedPlayer.id)):null;
      const detailReport=scoutingReport?scouting?.report?.(s,scoutingReport.id,selectedPlayer):null;
      const rankedTargets=shortlist.slice().sort((a,b)=>({alta:0,media:1,baixa:2}[a.priority||"media"]??1)-({alta:0,media:1,baixa:2}[b.priority||"media"]??1));
      const targetRows=rankedTargets.map((entry,index)=>{
        const player=playerLookup.get(String(entry.playerId));
        const club=clubIndex.get(entry.clubId)||gf?.clubById?.(s,entry.clubId);
        const mission=missions.slice().reverse().find(m=>String(m.playerId)===String(entry.playerId));
        const info=mission?scouting?.report?.(s,mission.id,player):null;
        const inquiry=(c.inquiries||[]).slice().reverse().find(x=>String(x.playerId)===String(entry.playerId)&&String(x.clubId)===String(entry.clubId));
        const status=inquiry?.status==="pending"?"Sondagem pendente":inquiry?.status==="accepted"||inquiry?.status==="asking_price"?"Sondagem aceita":mission?.status==="complete"?"Relatório concluído":mission?.status==="active"?"Em observação":"Sem observação";
        const priority=["alta","media","baixa"].includes(entry.priority)?entry.priority:"media";
        const contractUntil=player?.contractUntil??player?.contractEnd??player?.contract?.endDate;
        const marketValue=player?.marketValue??player?.value;
        const negotiation=inquiry?.status==="pending"?"Resposta prevista: "+careerDate(s,inquiry.responseDay):inquiry?.status==="accepted"||inquiry?.status==="asking_price"?"Sondagem aceita":inquiry?.status==="rejected"?"Sondagem recusada":"Nenhuma sondagem ativa";
        const contractText=contractUntil==null?"Contrato não informado":"Contrato: "+String(contractUntil);
        const valueText=Number.isFinite(Number(marketValue))&&marketValue!=null?"Valor estimado: R$ "+Number(marketValue).toLocaleString("pt-BR"):"Valor não informado";

        return '<article class="cc-target-row"><div><small>ALVO '+(index+1)+' · '+esc(priority)+'</small><strong>'+esc(player?.name||entry.playerId)+'</strong><span>'+esc(club?.name||entry.clubId||"Clube desconhecido")+' · '+esc(status)+'</span><span>'+esc(negotiation)+' · '+esc(contractText)+' · '+esc(valueText)+'</span></div><div class="cc-target-actions"><button type="button" data-coach-scout-select="'+esc(entry.playerId)+'">Ver perfil</button><label>Prioridade <select data-coach-target-priority data-coach-player="'+esc(entry.playerId)+'" data-coach-club="'+esc(entry.clubId)+'">'+[["alta","Alta"],["media","Média"],["baixa","Baixa"]].map(([v,t])=>'<option value="'+v+'"'+(priority===v?' selected':'')+'>'+t+'</option>').join("")+'</select></label><button type="button" data-coach-save-priority="'+esc(entry.playerId)+'" data-coach-club="'+esc(entry.clubId)+'">Salvar prioridade</button><button type="button" data-coach-shortlist="'+esc(entry.clubId)+'" data-coach-player="'+esc(entry.playerId)+'">Remover</button></div></article>';
      }).join("");
      const targetPanel='<section class="cc-card cc-target-hub"><div class="cc-target-heading"><div><small>PLANEJAMENTO DE ELENCO</small><h3>Lista de alvos</h3><p class="cc-note">Atletas acompanhados pelo treinador, sem alterar as negociações.</p></div><b>'+shortlist.length+' ALVOS</b></div>'+(targetRows||'<p class="cc-note">Sua lista está vazia. Adicione jogadores pela busca mundial.</p>')+'</section>';
      const selectedSaved=!!(selectedPlayer&&selectedClub&&shortlist.some(x=>String(x.playerId)===String(selectedPlayer.id)&&String(x.clubId)===String(selectedClub.id)));
      const selectedInquiry=selectedPlayer&&(c.inquiries||[]).find(x=>String(resolveInquiryPlayer(x)?.id)===String(selectedPlayer.id)&&String(x.clubId)===String(selectedClub?.id)&&String(x.buyerClubId)===String(s.clubId));
      const selectedPending=selectedInquiry?.status==="pending";
      const selectedReady=["accepted","asking_price"].includes(selectedInquiry?.status)&&Number(s.day)<=Number(selectedInquiry.expiresDay);
      const selectedCooldown=selectedInquiry?.status==="rejected"&&Number(s.day)<Number(selectedInquiry.answeredDay??selectedInquiry.responseDay)+14;
      const fmtMoney=v=>"R$ "+Math.round(Number(v)||0).toLocaleString("pt-BR");
      const ownClubNow=D?.club?.(s);
      const appApi=root.ProLifeApp;
      let transferHub="";
      if(selectedPlayer&&selectedClub&&ownClubNow&&selectedClub.id!==ownClubNow.id&&selectedPlayer.id!=="hero"){
        const assess=(D?.CoachCareer||root.ProLifeCoachCareer)?.inquiryAssessment?.(s,ownClubNow,selectedClub,selectedPlayer);
        const interest=assess?assess.playerScore:null;
        const level=interest==null?"—":interest>=70?"Alto":interest>=40?"Médio":"Baixo";
        const tone=interest==null?"none":interest>=70?"high":interest>=40?"mid":"low";
        const clause=appApi?.releaseClause?appApi.releaseClause(selectedPlayer):null;
        const windowOpen=!!D?.Career?.windowStatus?.(s)?.open;
        const budget=Number(ownClubNow.budget)||0;
        const canPay=clause!=null&&windowOpen&&budget>=clause;
        const why=clause==null?"":!windowOpen?"Janela de transferências fechada":budget<clause?"Faltam "+fmtMoney(clause-budget)+" no orçamento":"Pagamento à vista, sem negociação";
        transferHub='<section class="cc-hub-panel"><h4>INTERESSE DO JOGADOR</h4>'+
          '<div class="cc-hub-interest" data-tone="'+tone+'"><div class="cc-hub-interest-top"><strong>'+(interest==null?"—":interest)+'</strong><span>'+level+'</span></div>'+
          '<div class="cc-hub-meter" role="progressbar" aria-valuenow="'+(interest||0)+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+(interest||0)+'%"></i></div>'+
          (assess?.reasons?.length?'<p>'+esc(assess.reasons.slice(0,2).join(" · "))+'</p>':'')+
          (interest!=null&&interest<40?'<p class="cc-hub-warn">Dificilmente aceitará negociar. Pagar a rescisória ignora o interesse.</p>':'')+'</div>'+
          (clause!=null?'<h4>CLÁUSULA DE RESCISÃO</h4><div class="cc-hub-clause"><div><small>Valor total</small><strong>'+fmtMoney(clause)+'</strong></div>'+
          '<button type="button" class="cc-hub-pay" data-coach-pay-clause="'+esc(selectedClub.id)+'" data-coach-player="'+esc(selectedPlayer.id)+'" data-clause="'+esc(clause)+'"'+(canPay?'':' disabled')+'>Pagar rescisória</button>'+
          '<p>'+esc(why)+'</p></div>':'')+'</section>';
      }
      const primaryAction=selectedPending?'<p class="cc-action-wait">Sondagem enviada · resposta prevista em '+careerDate(s,selectedInquiry.responseDay)+'</p>':
        selectedReady?'<button type="button" class="cc-action-primary" data-coach-scout-offer="'+esc(selectedClub?.id)+'" data-coach-player="'+esc(selectedPlayer?.id)+'">Iniciar contratação</button>':
        '<button type="button" class="cc-action-primary" data-coach-inquire="'+esc(selectedClub?.id)+'" data-coach-player="'+esc(selectedPlayer?.id)+'"'+(selectedCooldown?' disabled':'')+'>'+(selectedCooldown?"Aguardar nova sondagem":"Consultar interesse")+'</button>';
      const profilePrimaryAction=selectedPlayer&&selectedClub?'<div class="cc-mobile-scout-profile-cta">'+(
        selectedReady?'<button type="button" data-coach-scout-offer="'+esc(selectedClub.id)+'" data-coach-player="'+esc(selectedPlayer.id)+'">Iniciar contratação</button>':
        selectedPending?'<span>Sondagem em análise</span>':
        '<button type="button" data-coach-inquire="'+esc(selectedClub.id)+'" data-coach-player="'+esc(selectedPlayer.id)+'"'+(selectedCooldown?' disabled':'')+'>'+(selectedCooldown?'Aguardar sondagem':'Consultar interesse')+'</button>'
      )+'</div>':"";
      const selectedActions=selectedPlayer&&selectedClub?
        '<div class="cc-market-detail-actions cc-player-actions"><small>AÇÕES DO JOGADOR</small>'+primaryAction+
        '<div class="cc-action-secondary"><button type="button" data-coach-start-scout="'+esc(selectedPlayer.id)+'" data-coach-region="'+esc(selectedClub.leagueId||selectedClub.country||"Brasil")+'">Pedir relatório ao olheiro</button>'+
        '<button type="button" data-coach-shortlist="'+esc(selectedClub.id)+'" data-coach-player="'+esc(selectedPlayer.id)+'">'+(selectedSaved?"Remover dos alvos":"Adicionar aos alvos")+'</button></div></div>':
        '<p class="cc-market-detail-note">Contratação direta de agentes livres ainda não disponível.</p>';
      const technical=selectedPlayer?.attrs&&typeof selectedPlayer.attrs==="object"?selectedPlayer.attrs:null;
      const attrsPanel=technical?Object.entries(technical).filter(([key,value])=>typeof value==="number"&&Number.isFinite(value)).slice(0,14).map(([key,value])=>
        '<div class="cc-market-attr"><span>'+esc(key.replace(/_/g," "))+'</span><b>'+esc(Math.round(value))+'</b><i><em style="width:'+Math.max(0,Math.min(100,value))+'%"></em></i></div>').join(""):"";
      const contractData=selectedPlayer?.contract&&typeof selectedPlayer.contract==="object"?selectedPlayer.contract:null;
      const selectedSalary=Number(selectedPlayer?.salary??contractData?.salary);
      const selectedValue=Number(selectedPlayer?.marketValue??selectedPlayer?.value??root.ProLifePlayerEconomy?.marketValue?.(selectedPlayer,selectedClub));
      const selectedEndDay=Number(selectedPlayer?.contractEndDay??contractData?.endDay??contractData?.expiresDay);
      const selectedEndLabel=Number.isFinite(selectedEndDay)?careerDate(s,selectedEndDay):(selectedPlayer?.contractUntil??selectedPlayer?.contractEnd??contractData?.endDate??"Não informado");
      const contractItems=[
        ["Salário mensal",Number.isFinite(selectedSalary)?money(selectedSalary):"Não informado"],
        ["Salário semanal",Number.isFinite(selectedSalary)?money(root.ProLifePlayerEconomy?.weeklySalary?.(selectedSalary)||selectedSalary*12/52):"Não informado"],
        ["Contrato até",selectedEndLabel],
        ["Valor de mercado",Number.isFinite(selectedValue)?money(selectedValue):"Não informado"]
      ];
      const contractPanel=contractItems.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join("");
      // Relatório do olheiro no padrão FC 27: encaixe tático, potencial, finanças e situação do jogador.
      const fourAreas=(()=>{
        if(!selectedPlayer)return "";
        const ovrOf=x=>Number(x?.overall??x?.ovr??D?.overall?.(x));
        const pos=selectedPlayer.primaryPosition||selectedPlayer.pos||selectedPlayer.position||"";
        const mine=(D?.club?.(s)?.roster||[]).filter(x=>x&&x.id!=="hero"&&(x.primaryPosition||x.pos||x.position)===pos).map(ovrOf).filter(Number.isFinite).sort((a,b)=>b-a);
        const ger=ovrOf(selectedPlayer),best=mine[0],second=mine[1];
        const fit=!Number.isFinite(ger)?["—","Sem dados do jogador."]:!mine.length?["Preenche carência","Seu elenco não tem ninguém na posição "+pos+"."]:
          ger>=best+1?["Titular imediato","Supera o melhor da posição ("+Math.round(best)+") em +"+Math.round(ger-best)+"."]:
          ger>=(second??best)-2?["Disputa a vaga","Fica próximo dos titulares da posição ("+Math.round(best)+")."]:["Opção de rotação","Abaixo dos titulares da posição ("+Math.round(best)+")."];
        const pot=Number(selectedPlayer.potential),age=Number(selectedPlayer.age);
        const growth=Number.isFinite(pot)&&Number.isFinite(ger)?Math.max(0,pot-ger):null;
        const future=!Number.isFinite(pot)?["—","Potencial não observado."]:growth>=8&&age<=23?["Promessa de ponta","Pode crescer +"+Math.round(growth)+" até POT "+Math.round(pot)+"."]:
          growth>=4&&age<=26?["Ainda evolui","Margem de +"+Math.round(growth)+" (POT "+Math.round(pot)+")."]:["Já está no auge","Pouco espaço para evoluir (POT "+Math.round(pot)+")."];
        const budget=Number(selectedClub?.id&&D?.club?.(s)?.budget),cf=root.ProLifeClubFinance?.summary?.(s,1);
        const fee=Number.isFinite(selectedValue)?selectedValue:null;
        const money2=v=>money(v);
        const fin=fee==null?["—","Valor de mercado não informado."]:Number.isFinite(budget)&&fee<=budget?["Cabe no orçamento","Taxa estimada "+money2(fee)+" · sobra "+money2(budget-fee)+"."]:
          ["Acima do orçamento","Taxa estimada "+money2(fee)+" · faltam "+money2(fee-(Number.isFinite(budget)?budget:0))+"."];
        const wageNote=Number.isFinite(selectedSalary)&&cf?.monthlyPayroll?" Salário = "+Math.round(selectedSalary/cf.monthlyPayroll*100)+"% da folha mensal.":"";
        fin[1]+=wageNote;
        const inq=selectedInquiry;
        const left=Number.isFinite(selectedEndDay)?Math.round(selectedEndDay-Number(s.day)):null;
        const sit=inq?.status==="pending"?["Sondagem em andamento","Resposta prevista em "+careerDate(s,inq.responseDay)+"."]:
          ["accepted","asking_price"].includes(inq?.status)?["Aberto a negociar","Interesse do jogador "+esc(inq.playerInterest??"—")+"/100."]:
          inq?.status==="rejected"?["Não quer negociar",inq.playerDecision==="rejected"?"Jogador sem interesse.":"Clube não autoriza."]:
          [left!=null&&left<=180?"Contrato perto do fim":"Sem sondagem",left!=null?"Contrato termina em "+Math.max(0,left)+" dia(s).":"Consulte o interesse para saber mais."];
        const card=(title,v)=>'<div class="cc-four-card"><small>'+title+'</small><strong>'+esc(v[0])+'</strong><span>'+esc(v[1])+'</span></div>';
        return '<section class="cc-market-detail-section cc-four-areas"><h4>RELATÓRIO DO OLHEIRO</h4><div class="cc-four-grid">'+card("ENCAIXE TÁTICO",fit)+card("POTENCIAL FUTURO",future)+card("AVALIAÇÃO FINANCEIRA",fin)+card("SITUAÇÃO DO JOGADOR",sit)+'</div></section>';
      })();
      const reportReady=detailReport?.available===true;
      const reportComplete=reportReady&&detailReport.status==="complete";
      const reportPercent=reportReady?Math.round(Math.max(0,Math.min(1,Number(detailReport.progress)||0))*100):0;
      const estimatedGer=reportReady?detailReport.estimatedOverall?.join("–"):"Não descoberto";
      const estimatedPotential=reportReady?detailReport.potentialRange?.join("–"):"Não descoberto";
      const reportSummary='<section class="cc-market-detail-section cc-scout-report"><h4>RELATÓRIO DE OBSERVAÇÃO</h4>'+
        '<p class="cc-scout-report-state">'+(reportComplete?'Relatório concluído':reportReady?'Em andamento · '+reportPercent+'%':'Sem relatório disponível')+'</p>'+
        '<div class="cc-scout-progress" role="progressbar" aria-valuenow="'+reportPercent+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+reportPercent+'%"></i></div>'+
        '<dl class="cc-market-player-fields"><div><dt>GER estimado</dt><dd>'+esc(reportComplete?detailReport.exactOverall??estimatedGer:estimatedGer)+'</dd></div>'+
        '<div><dt>Potencial estimado</dt><dd>'+esc(reportReady?(detailReport.exactPotential??estimatedPotential):"Não descoberto")+'</dd></div>'+
        '<div><dt>Confiança do olheiro</dt><dd>'+esc(reportReady?detailReport.certainty+"%":"—")+'</dd></div>'+
        '<div><dt>Especialidade</dt><dd>'+esc(reportReady?(detailReport.specialtyFit?"Compatível · +"+detailReport.specialistBonus+" confiança":"Sem bônus específico"):"Ainda não avaliada")+'</dd></div></dl>'+
        '<p>'+(reportComplete?'Avaliação concluída.':'As faixas são estimativas; aumentam em precisão com o tempo de observação.')+'</p></section>';
      const scoutDetailPanel=reportSummary+'<section class="cc-market-detail-section cc-scout-technical"><h4>AVALIAÇÃO TÉCNICA</h4>'+(reportComplete?(attrsPanel||'<p>Sem atributos detalhados disponíveis neste save.</p>'):'<p>Atributos detalhados disponíveis após a conclusão da observação.</p>')+'</section>'+
        '<section class="cc-market-detail-section cc-scout-contract"><h4>CONTRATO E MERCADO</h4><dl class="cc-market-player-fields">'+contractPanel+'</dl></section>';
      const sideDetail=selectedPlayer?'<aside class="cc-market-player-detail"><div class="cc-market-detail-portrait">'+(root.ProLifePlayerCard?.render?.(selectedPlayer,{club:selectedClub?.name||'Sem clube',crest:selectedClub?.id?root.ProLifeClubCrests?.render?.(selectedClub.id,{size:'sm'})||'':'',showStats:reportComplete,overall:detailReport?.exactOverall})||'<div class="cc-market-portrait-placeholder" aria-label="Retrato indisponível">⚽</div>')+'<small>PERFIL DO ATLETA</small><h3>'+esc(selectedPlayer.name||"Atleta")+'</h3><p>'+esc(selectedClub?.name||"Sem clube")+'</p></div>'+
        '<div class="cc-market-profile-basics"><div class="cc-market-player-overall"><strong>'+esc(reportComplete?(detailReport.exactOverall??"—"):estimatedGer)+'</strong><span>GER</span><strong>'+esc(detailReport?.exactPotential??(detailReport?.potentialRange?.join("–")||"—"))+'</strong><span>POTENCIAL OBSERVADO</span></div>'+
        '<dl class="cc-market-player-fields">'+[["Posição",selectedPlayer.primaryPosition||selectedPlayer.pos||selectedPlayer.position||"—"],["Idade",selectedPlayer.age??"—"],["Potencial",selectedPlayer.potential??"—"],["Nacionalidade",selectedPlayer.nationality||selectedPlayer.nation||"—"],["Clube",selectedClub?.name||"Agente livre"],["Relatório",!detailReport?"Ainda não observado":detailReport.status==="complete"?"Concluído":Math.round((detailReport.progress||0)*100)+"%"]].map(([k,v])=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd></div>').join("")+'</dl>'+transferHub+'</div>'+
        '<div class="cc-market-profile-scout">'+reportSummary+fourAreas+'</div><div class="cc-market-profile-decision"><section class="cc-market-detail-section cc-scout-technical"><h4>AVALIAÇÃO TÉCNICA</h4>'+(reportComplete?(attrsPanel||'<p>Sem atributos detalhados disponíveis neste save.</p>'):'<p>Peça um relatório para liberar os atributos detalhados.</p>')+'</section><section class="cc-market-detail-section cc-scout-contract"><h4>CONTRATO E MERCADO</h4><dl class="cc-market-player-fields">'+contractPanel+'</dl></section>'+selectedActions+'</div><p class="cc-market-detail-note">Retrato ilustrado de referência, sem semelhança facial garantida. Avaliações técnicas são exibidas conforme o relatório de observação.</p></aside>':
        '<aside class="cc-market-player-detail"><h3>Selecione um jogador</h3><p>Os detalhes aparecerão aqui.</p></aside>';
      const rows=visibleCandidates.map(({p,cl,free})=>{
        const overall=p.overall??p.ovr??D?.overall?.(p);
        const saved=!free&&shortlist.some(x=>x.playerId===p.id&&x.clubId===cl.id);
        const identity='<div class="cc-deal-player cc-fc27-player"><span class="cc-fc27-ger">'+esc(Number.isFinite(Number(overall))?Math.round(Number(overall)):'—')+'</span><div><strong>'+esc(p.name||"Atleta")+'</strong><small>'+esc([p.primaryPosition||p.pos||p.position,Number.isFinite(Number(overall))?"GER "+Math.round(Number(overall)):null,Number.isFinite(Number(p.potential))?"POT "+Math.round(Number(p.potential)):null,p.age?"Idade "+p.age:null].filter(Boolean).join(" · "))+'</small></div></div>';
        const origin='<div class="cc-deal-team">'+(free?"":root.ProLifeClubCrests?.render?.(cl.id,{size:"sm"})||"")+'<span>'+esc(free?"Sem clube":cl.name||cl.id)+'</span></div>';
        const inquiry=(c.inquiries||[]).find(x=>x.playerId===p.id&&x.clubId===cl.id&&x.buyerClubId===s.clubId);
        const inquiryReady=["accepted","asking_price"].includes(inquiry?.status)&&Number(s.day)<=Number(inquiry.expiresDay);
        const inquiryPending=inquiry?.status==="pending";
        const inquiryRejected=inquiry?.status==="rejected";
        const inquiryStatus=inquiryPending?"Sondagem enviada · resposta prevista em "+careerDate(s,inquiry.responseDay):
          inquiryReady?(inquiry.status==="asking_price"?"Clube exige proposta financeira":"Sondagem aceita") +" · interesse "+({high:"alto",medium:"médio",low:"baixo"}[inquiry.interest]||"confirmado"):
          inquiryRejected?"Sondagem recusada · "+(inquiry.playerDecision==="rejected"?"jogador sem interesse":"clube não autoriza"):"";
        const inquiryExplanation=inquiry&&!inquiryPending?
          '<small class="cc-status">Interesse do jogador: '+esc(inquiry.playerInterest??"—")+'/100 · disposição do clube: '+esc(inquiry.clubInterest??"—")+'/100'+
          (Array.isArray(inquiry.reasons)&&inquiry.reasons.length?' · '+esc(inquiry.reasons.slice(0,2).join("; ")):'')+'</small>':"";
        const inquiryFeedback=inquiry&&!inquiryPending?
          '<div class="cc-inquiry-feedback" role="status"><strong>'+esc(inquiryReady?(inquiry.status==="asking_price"?"Clube exige proposta financeira":"Sondagem aceita"):inquiryRejected?"Sondagem recusada":"Sondagem expirada")+'</strong>'+
          '<span>Jogador: '+esc(inquiry.playerDecision==="accepted"?"Aceitou conversar":inquiry.playerDecision==="rejected"?"Sem interesse":"Sem avaliação registrada")+
          ' · Clube: '+esc(inquiry.clubDecision==="accepted"?"Autorizou negociar":inquiry.clubDecision==="asking_price"?"Exige proposta financeira":inquiry.clubDecision==="rejected"?"Recusou negociar":"Sem avaliação registrada")+'</span>'+
          inquiryExplanation+
          (inquiry.answeredDay!=null?'<small>Resposta recebida em '+careerDate(s,inquiry.answeredDay)+'</small>':'')+'</div>':"";
        const nextInquiryDay=inquiryRejected?Number(inquiry.answeredDay??inquiry.responseDay)+14:null;
        const inquiryCooldown=inquiryRejected&&Number(s.day)<nextInquiryDay;
        const actions=free?'<div class="cc-deal-actions"><span class="cc-status">Agente livre · contratação direta ainda não disponível</span></div>':
          '<div class="cc-deal-actions"><button type="button" data-coach-shortlist="'+esc(cl.id)+'" data-coach-player="'+esc(p.id)+'">'+(saved?"Remover da lista":"Adicionar à lista")+'</button><button type="button" data-coach-start-scout="'+esc(p.id)+'" data-coach-region="'+esc(clubRegion(cl))+ '">Observar atleta</button>'+(inquiryPending?'<span class="cc-status">'+esc(inquiryStatus)+'</span>'+inquiryExplanation:inquiryReady?inquiryFeedback+'<button type="button" data-coach-scout-offer="'+esc(cl.id)+'" data-coach-player="'+esc(p.id)+'">Negociar contratação</button>':inquiryFeedback+'<button type="button" data-coach-inquire="'+esc(cl.id)+'" data-coach-player="'+esc(p.id)+'"'+(inquiryCooldown?' disabled title="Nova consulta em '+careerDate(s,nextInquiryDay)+'"':'')+'>'+(inquiryCooldown?'Nova consulta em '+careerDate(s,nextInquiryDay):inquiryRejected?"Consultar novamente":"Consultar interesse")+'</button>')+'</div>';
        return '<article class="cc-deal cc-fc27-result'+(String(selectedPlayer?.id)===String(p.id)?' is-selected':'')+'"><button type="button" class="cc-market-select-player" data-coach-scout-select="'+esc(p.id)+'" aria-label="Ver perfil de '+esc(p.name||'atleta')+'">'+identity+origin+'</button>'+actions+'</article>';
      }).join("");
      const pageControls='<div class="cc-market-pages"><span>'+candidates.length+' jogadores encontrados · Página '+(ui.scoutPage+1)+' de '+pageCount+'</span><div><button type="button" data-coach-scout-page="prev"'+(ui.scoutPage===0?' disabled':'')+'>Anterior</button><button type="button" data-coach-scout-page="next"'+(ui.scoutPage>=pageCount-1?' disabled':'')+'>Próxima</button></div></div>';
      const searchHeading='<div class="cc-fc27-scout-head"><div><small>REDE DE OBSERVAÇÃO · MERCADO MUNDIAL</small><h2>Buscar jogadores</h2><p>Encontre atletas, acompanhe o interesse e envie olheiros.</p></div><div class="cc-fc27-scout-count"><strong>'+candidates.length+'</strong><span>ATLETAS ENCONTRADOS</span></div></div>';
      const inquiryList=myInquiries;
      const inquiryStatusLabel=x=>x.status==="pending"?"Aguardando resposta · prevista em "+careerDate(s,x.responseDay):
        x.status==="asking_price"?"Clube exige proposta financeira":x.status==="accepted"?(Number(s.day)<=Number(x.expiresDay)?"Aceita · pode negociar até "+careerDate(s,x.expiresDay):"Aceita · prazo expirado"):
        x.status==="converted"?"Contratação concluída":x.status==="rejected"?"Recusada · "+(x.playerDecision==="rejected"?"jogador sem interesse":"clube não autoriza"):"Encerrada";
      const inquiryRows=inquiryList.map(x=>{
        const player=resolveInquiryPlayer(x);
        const club=clubIndex.get(x.clubId)||gf?.clubById?.(s,x.clubId);
        const name=player?.name||x.playerName||x.playerId,clubName=club?.name||x.clubName||x.clubId;
        const tone=x.status==="pending"?"pending":["accepted","asking_price"].includes(x.status)?"ok":"no";
        const overall=player?(player.overall??player.ovr??D?.overall?.(player)):null;
        const ger=Number.isFinite(Number(overall))?Math.round(Number(overall)):"—";
        const resolvedPlayerId=player?.id??x.playerId;
        const selected=String(selectedPlayer?.id)===String(resolvedPlayerId);
        return '<article class="cc-deal cc-fc27-result cc-inquiry-row is-'+tone+(selected?' is-selected':'')+'"><button type="button" class="cc-market-select-player" data-coach-scout-select="'+esc(resolvedPlayerId)+'" aria-label="Ver perfil de '+esc(name)+'"><div class="cc-deal-player cc-fc27-player"><span class="cc-fc27-ger">'+esc(ger)+'</span><div><strong>'+esc(name)+'</strong><small>'+esc([x.position||player?.primaryPosition||player?.pos,careerDate(s,x.startDay)].filter(Boolean).join(" · "))+'</small></div></div><div class="cc-deal-team">'+(root.ProLifeClubCrests?.render?.(x.clubId,{size:"sm"})||"")+'<span>'+esc(clubName)+'</span></div><span class="cc-status">'+esc(inquiryStatusLabel(x))+'</span></button></article>';
      }).join("");
      const inquiryPanel='<section class="cc-card cc-fc27-scout"><div class="cc-fc27-scout-head"><div><small>MERCADO · INTERESSE CONSULTADO</small><h2>Sondagens enviadas</h2><p>Todos os jogadores cujo interesse você consultou. Selecione um para ver o perfil, negociar ou acompanhar.</p></div><b>'+inquiryList.length+' SONDAGENS</b></div>'+
        (inquiryList.length?'<div class="cc-market-search-layout"><div class="cc-market-results">'+inquiryRows+'</div>'+sideDetail+'</div>':'<p class="cc-note">Nenhuma sondagem enviada ainda. Consulte o interesse de um jogador pela busca mundial.</p>')+'</section>';
      const scoutNav=listsOnScouting?listNav:'<nav class="cc-deal-nav cc-scout-subnav" aria-label="Menus de scouting">'+[["busca","Busca mundial"],["olheiros","Rede de olheiros"],["recomendacoes","Recomendações"]].map(([id,label])=>'<button type="button" data-coach-scout-screen="'+id+'" aria-pressed="'+(ui.scoutScreen===id)+'">'+label+'</button>').join("")+'</nav>';
      if(ui.scoutScreen==="perfil")return '<section class="cc-mobile-scout-profile" aria-label="Perfil completo do jogador"><header class="cc-mobile-scout-profile-head"><button type="button" data-coach-scout-back aria-label="Voltar aos resultados">← <span>Voltar</span></button><div class="cc-mobile-scout-profile-title"><small>SCOUTING · PERFIL DO ATLETA</small><h2>'+esc(selectedPlayer?.name||"Jogador")+'</h2><p>'+esc(selectedClub?.name||"Agente livre")+'</p></div>'+profilePrimaryAction+'</header>'+sideDetail+'</section>';
      if(ui.scoutScreen==="alvos")return scoutNav+targetPanel;
      if(ui.scoutScreen==="sondagens")return scoutNav+inquiryPanel;
      if(ui.scoutScreen==="olheiros")return scoutNav+missionPanel;
      if(ui.scoutScreen==="recomendacoes")return scoutNav+recommendationsPanel;
      const regionOptions=[["all","Todas as regiões"],["Brasil","Brasil"],["América do Sul","América do Sul"],["Europa","Europa"],["África","África"],["Ásia","Ásia"],["América do Norte","América do Norte"]].map(([value,label])=>opt(value,label,ui.scoutRegion)).join("");
      return scoutNav+'<section class="cc-card cc-fc27-scout">'+searchHeading+'<div class="cc-fc27-filter-area"><h3>Filtros de pesquisa</h3><p class="cc-note">Resultados do catálogo dos clubes carregados neste save. Acompanhamento persistido na carreira do treinador.</p><label>Região do clube<select data-coach-scout-region>'+regionOptions+'</select></label><label>Especialidade<select data-coach-scout-specialty><option value="geral">Geral</option><option value="jovens">Jovens talentos</option><option value="defesa">Defensores</option><option value="meio">Meio-campistas</option><option value="ataque">Atacantes</option><option value="goleiros">Goleiros</option></select></label><label>Duração da observação <select data-coach-scout-duration><option value="7">7 dias</option><option value="14" selected>14 dias</option><option value="28">28 dias</option></select></label><p class="cc-note">Custo padrão: R$ 0 nesta etapa experimental. Missões duram dias da carreira.</p><label>Nome do atleta <input data-coach-scout-search placeholder="Buscar jogador..." value="'+esc(ui.scoutQuery)+'"></label><label>Posição <select data-coach-scout-position><option value="all"'+(ui.scoutPosition==="all"?" selected":"")+'>Todas</option>'+["GOL","ZAG","LD","LE","LAT","VOL","MC","MD","ME","MEI","PD","PE","ATA"].map(v=>'<option value="'+v+'"'+(ui.scoutPosition===v?" selected":"")+'>'+v+'</option>').join("")+'</select></label>'+advanced+'<div class="cc-deal-actions"><button data-coach-scout-apply type="button">Pesquisar jogadores</button></div></div><div class="cc-fc27-results-head"><b>RESULTADOS DA BUSCA</b><span>Selecione as ações do atleta para observar ou negociar</span></div>'+'<div class="cc-market-search-layout"><div class="cc-market-results">'+pageControls+(rows||'<p class="cc-note">Nenhum atleta encontrado.</p>')+pageControls+'</div>'+sideDetail+'</div></section>';
    }
    const all=[...(s.clubs||[]),...(s.globalFootball?.clubs||[])];
    const club=id=>D?.club?.(s,id)||all.find(x=>x.id===id)||null;
    const clubName=id=>club(id)?.name||id||"Clube";
    const crest=id=>root.ProLifeClubCrests?.render?.(id,{size:"sm"})||"";
    const team=id=>'<span class="cc-deal-team">'+crest(id)+'<span>'+esc(clubName(id))+'</span></span>';
    const player=id=>{
      for(const x of all){const p=x.roster?.find(p=>p.id===id);if(p)return p;}
      return D?.GlobalFootball?.playerById?.(s,id)||root.ProLifeGlobalFootball?.playerById?.(s,id)||null;
    };
    const athlete=id=>{
      const p=player(id);
      if(!p)return '<strong>'+esc(id||"Jogador")+'</strong><small>Dados individuais indisponíveis neste save</small>';
      const overall=p.overall??p.ovr??(D?.overall?.(p));
      const facts=[p.primaryPosition||p.pos||p.position,Number.isFinite(Number(overall))?'GER '+Math.round(Number(overall)):null,Number.isFinite(Number(p.age))?'Idade '+p.age:null,p.nationality||p.nation].filter(Boolean).join(' · ');
      return '<strong>'+esc(p.name||id)+'</strong><small>'+esc(facts)+'</small>';
    };
    const draft=ui.draftOffer;
    const draftPlayer=draft?(D?.GlobalFootball?.playerById?.(s,draft.playerId)||(s.clubs||[]).flatMap(x=>x.roster||[]).find(x=>x.id===draft.playerId)):null;
    const draftPanel=draft?'<section class="cc-card cc-neg-dialog" aria-label="Preparar proposta"><small>01 · PREPARAÇÃO</small><h3>Preparar proposta de contratação</h3><p class="cc-note">Nenhuma proposta foi enviada ainda. Escolha o valor e confirme o envio.</p><div class="cc-deal-player"><strong>'+esc(draftPlayer?.name||draft.playerId)+'</strong><small>'+esc(draftPlayer?.pos||"")+'</small></div><label class="cc-neg-offer">Valor da proposta (R$)<input type="number" min="1000" step="1000" data-coach-new-offer value="'+esc(draft.suggestedOffer)+'"></label><div class="cc-deal-actions"><button type="button" data-coach-submit-offer="1">Enviar proposta ao clube</button><button type="button" data-coach-cancel-offer="1">Cancelar</button></div></section>':'';
    const own=D?.club?.(s,s.clubId);
    const ownedPlayerIds=new Set((own?.roster||[]).map(p=>String(p.id)));
    const currentDay=Number(s.day)||0;
    const normalizedNegotiations=(c.negotiations||[]).map(n=>n.status==="pending"&&Number.isFinite(Number(n.expiresDay))&&currentDay>Number(n.expiresDay)?{...n,status:"expired",response:"expired",closedDay:currentDay}:n);
    const normalizedSales=(c.saleOffers||[]).map(o=>o.status==="pending"&&Number.isFinite(Number(o.expiresDay))&&currentDay>Number(o.expiresDay)?{...o,status:"expired",closedDay:currentDay}:o);
    const pending=normalizedNegotiations.filter(n=>(n.status==="pending"||n.status==="awaiting_window")&&String(n.buyerClubId)===String(s.clubId)&&!ownedPlayerIds.has(String(n.playerId)));
    const sales=normalizedSales.filter(o=>o.status==="pending"||o.status==="awaiting_window");
    const loans=(c.loans||[]).filter(l=>!l.returned);
    const debts=(c.transferDebts||[]).filter(d=>!d.paid);
    const clauses=(c.sellOnClauses||[]).filter(x=>x.active);
    const negotiationHistory=normalizedNegotiations.filter(n=>n.status!=="pending"&&n.status!=="awaiting_window");
    const saleHistory=normalizedSales.filter(o=>o.status!=="pending"&&o.status!=="awaiting_window");
    const paid=(c.transferDebts||[]).filter(d=>d.paid);
    const finishedLoans=(c.loans||[]).filter(l=>l.returned);
    const transactions=(D?.Career?.init?.(s)?.transfers||[]).filter(x=>x&&x.day!==undefined);
    const tabs=[["recebidas","Recebidas",sales.length],["propostas","Propostas",pending.length],["emprestimos","Empréstimos",loans.length],["financeiro","Finanças",debts.length],["contratos","Contratos",(D?.club?.(s,s.clubId)?.roster||[]).length],["clausulas","Cláusulas",clauses.length],["historico","Histórico",negotiationHistory.length+paid.length+finishedLoans.length],["reforcos","Reforços",(c.presentations||[]).filter(x=>String(x.toClubId)===String(s.clubId)).length]];
    if(!tabs.some(x=>x[0]===ui.dealTab))ui.dealTab="propostas";
    const wrap=(items,fn,empty)=>items.length?items.map(fn).join(""):'<p class="cc-note">'+esc(empty)+'</p>';
    const selected=pending.find(n=>n.id===ui.selectedDeal)||null;
    const dealStage=n=>n.response==="awaiting_reply"?"Aguardando resposta até "+careerDate(s,n.replyDay):n.status==="awaiting_window"?"Acordo fechado · aguardando janela":n.response==="accepted"?"Clube aceitou · revisar condições":(n.round||1)>=3?"Rodada final · decisão necessária":"Negociação com o clube · rodada "+(n.round||1)+"/3";
    const budget=Number(D?.club?.(s,s.clubId)?.budget);
    const fee=selected?.response==="awaiting_reply"?Number(selected.requested):selected?.finalFee==null?NaN:Number(selected.finalFee);
    const steps=selected?'<div class="cc-market-steps" aria-label="Etapas da negociação"><span>01 · Proposta</span><span>02 · Resposta</span><span>03 · Decisão</span><span>04 · Transferência</span></div>':'';
    const budgetPreview=selected&&Number.isFinite(budget)&&Number.isFinite(fee)?'<div class="cc-market-budget"><b>Orçamento '+esc(money(budget))+'</b><b>Oferta '+esc(money(fee))+'</b><b>Saldo projetado após oferta e bônus '+esc(money(budget-fee-(selected.contractOffer?.status==="accepted"?Number(selected.contractOffer.bonus)||0:0)))+'</b></div><p class="cc-note">Projeção antes de concluir: não altera o orçamento.</p>':'';
    const actionsOpen=selected?.status==="pending"&&selected?.response!=="awaiting_reply"&&Number(s.day)<=Number(selected.expiresDay);
    const offerBase=Math.max(1000,Number(selected?.finalFee>0?selected.finalFee:selected?.requested)||1000);
    const quickOffers=actionsOpen&&selected.response==="counter"&&Number(selected.round||1)<3?'<div class="cc-market-presets"><p class="cc-note">Escolha um valor sugerido e envie sua proposta. O clube responde pelo sistema atual de negociação.</p>'+
      [["Oferta cautelosa",0.9],["Oferta equilibrada",1],["Oferta forte",1.1]].map(([label,factor])=>{
        const amount=Math.max(1000,Math.round(offerBase*factor/1000)*1000);
        return '<button type="button" data-coach-deal-preset="'+esc(selected.id)+'" data-coach-preset-value="'+esc(amount)+'">'+esc(label)+' · '+esc(money(amount))+'</button>';
      }).join("")+'</div>':'';
    const responseStatus=selected?.status==="awaiting_window"?"Aguardando janela":selected?.response==="awaiting_reply"?"Resposta pendente":selected?.response==="accepted"?"Oferta aceita":selected?.response==="counter"?"Contraproposta recebida":"Decisão em andamento";
    const sellerFeedback=selected?'<div class="cc-market-response" role="status"><strong>Resposta do clube vendedor</strong><span class="cc-neg-response-status">'+esc(responseStatus)+'</span><p>'+esc(selected.response==="awaiting_reply"?"Proposta enviada. O clube responderá em "+careerDate(s,selected.replyDay)+".":selected.status==="awaiting_window"?"Acordo registrado: aguardando a janela de transferências.":selected.response==="accepted"?"O clube aceitou a proposta. Negocie o contrato com o jogador antes de concluir.":Number(selected.round||1)>=3?"Última rodada atingida: aceite a exigência atual ou encerre a negociação.":"O clube respondeu à proposta. Você pode aceitar os valores atuais ou apresentar uma contraproposta.")+'</p></div>':'';
    const contract=selected?.contractOffer;
    const contractCosts=contract?.status==="accepted"?'<p class="cc-note">Salário anual: '+esc(money(Number(contract.salary)*12))+' · Total de salários no contrato: '+esc(money(Number(contract.salary)*12*Number(contract.years)))+' · Bônus de assinatura: '+esc(money(contract.bonus))+'</p>':'';
    const contractReference=selected&&root.ProLifeApp?.coachContractRequirements?.(player(selected.playerId),D?.club?.(s,selected.buyerClubId),D?.club?.(s,selected.sellerClubId),contract?.role||"important",contract?.years||3);
    const referenceHint=contractReference?'<p class="cc-note">Referência de negociação: salário mensal '+esc(money(contractReference.requiredSalary))+' · bônus sugerido (opcional) '+esc(money(contractReference.suggestedBonus))+'. Valores estimados pelo PRO-LIFE.</p>':'';
    const contractPanel=selected&&selected.status==="pending"&&selected.response==="accepted"?
      '<section class="cc-card cc-agent-contract" aria-label="Contrato com o jogador"><header class="cc-agent-head"><small>NEGOCIAÇÃO COM O AGENTE</small><h4>Contrato com o jogador</h4><span>'+esc(contract?.status==="accepted"?"Acordo aceito":contract?.status==="rejected"?"Negociação encerrada":contract?.status==="counter"?"Contraproposta recebida":"Aguardando proposta")+'</span></header>'+
      '<p class="cc-note">Negocie com o agente: salário mensal, prazo, bônus e função no elenco.</p>'+referenceHint+
      '<div class="cc-agent-grid"><label>Salário mensal (R$)<input type="number" min="1000" step="1000" data-coach-contract-salary="'+esc(selected.id)+'" value="'+esc(contract?.salary??Math.max(1000,Number(player(selected.playerId)?.salary)||0,Number(root.ProLifeApp?.minimumMarketSalaryMonthly?.(player(selected.playerId)))||0))+'"></label>'+
      '<label>Duração<select data-coach-contract-years="'+esc(selected.id)+'">'+[1,2,3,4,5].map(v=>'<option value="'+v+'"'+(v===(contract?.years??3)?' selected':'')+'>'+v+' ano(s)</option>').join("")+'</select></label>'+
      '<label>Bônus (R$)<input type="number" min="0" step="1000" data-coach-contract-bonus="'+esc(selected.id)+'" value="'+esc(contract?.bonus??0)+'"></label>'+
      '<label>Função<select data-coach-contract-role="'+esc(selected.id)+'">'+[['rotation','Rotação'],['important','Importante'],['starter','Titular'],['star','Estrela']].map(([v,t])=>'<option value="'+v+'"'+(v===(contract?.role??'important')?' selected':'')+'>'+t+'</option>').join("")+'</select></label></div><div class="cc-agent-feedback"><strong>Resposta do agente</strong><p>'+esc(contract?.status==="accepted"?"Contrato acordado.":contract?.status==="rejected"?"O agente encerrou as negociações.":contract?.status==="counter"?"Contraproposta do agente: salário de referência "+money(contract.requiredSalary):"Envie sua proposta ao agente.")+'</p></div>'+
      (contract?.status==="accepted"||contract?.status==="rejected"?'<span class="cc-status">'+esc(contract.status)+'</span>':'<button type="button" data-coach-contract-negotiate="'+esc(selected.id)+'">Negociar contrato · rodada '+esc((contract?.round||0)+1)+'/3</button>')+
      '</section>':'';
    const agreedContractPanel=selected?.status==="awaiting_window"&&contract?.status==="accepted"?
      '<section class="cc-card" aria-label="Contrato acordado"><h4>Contrato acordado com o jogador</h4>'+
      '<p><b>Salário mensal:</b> '+esc(money(contract.salary))+' · <b>Duração:</b> '+esc(contract.years)+' ano(s) · <b>Bônus:</b> '+esc(money(contract.bonus))+' · <b>Função:</b> '+esc(({rotation:"Rotação",important:"Importante",starter:"Titular",star:"Estrela"})[contract.role]||contract.role)+'</p>'+
      '<p class="cc-note">Acordo registrado. Transferência aguardando a abertura da janela.</p></section>':'';
    const settlementReady=selected?.status==="pending"&&selected?.response==="accepted"&&contract?.status==="accepted";
    const settlementFee=Number(selected?.finalFee);
    const settlementBonus=Number(contract?.bonus)||0;
    const settlementSummary=settlementReady&&Number.isFinite(settlementFee)?
      '<section class="cc-card cc-settlement-preview"><small>REVISÃO ANTES DA CONTRATAÇÃO</small><h4>Resumo do acordo</h4><div class="cc-settlement-grid"><div><span>Transferência</span><b>'+esc(money(settlementFee))+'</b></div><div><span>Bônus de assinatura</span><b>'+esc(money(settlementBonus))+'</b></div><div><span>Salário mensal</span><b>'+esc(money(contract.salary))+'</b></div><div><span>Contrato</span><b>'+esc(contract.years)+' ano(s)</b></div><div><span>Orçamento atual</span><b>'+esc(Number.isFinite(budget)?money(budget):"Indisponível")+'</b></div><div><span>Saldo indicativo à vista</span><b>'+esc(Number.isFinite(budget)?money(budget-settlementFee-settlementBonus):"Indisponível")+'</b></div></div><p class="cc-note">Prévia informativa à vista. Parcelamento, janela e validações financeiras serão definidos pelo motor na conclusão. Nenhum valor foi debitado.</p></section>':'';
    const signingRows=(c.presentations||[]).filter(x=>String(x.toClubId)===String(s.clubId)).slice().reverse();
    const signingCards=signingRows.slice(0,20).map(x=>'<article class="cc-signing-card"><div class="cc-signing-card-top"><div><small>REFORÇO · '+esc(x.type||"Contratação")+'</small><h4>'+esc(x.playerName||x.playerId)+'</h4><span>'+esc(x.fromClubName||"Clube de origem não informado")+' → '+esc(x.toClubName||D?.club?.(s,s.clubId)?.name||"Seu clube")+'</span></div><strong>'+esc(x.presented?"APRESENTADO":"PENDENTE")+'</strong></div><div class="cc-signing-stats"><div><small>Transferência</small><b>'+esc(x.fee==null?"Não informado":money(x.fee))+'</b></div><div><small>Posição</small><b>'+esc(x.position||"—")+'</b></div><div><small>GER registrado</small><b>'+esc(x.overall??"—")+'</b></div><div><small>Registro</small><b>'+careerDate(s,x.day)+'</b></div></div><p class="cc-note">'+esc(x.presented?"Apresentação registrada na carreira.":"Apresentação pendente no fluxo de chegada do reforço.")+'</p><button type="button" data-coach-signing-open="'+esc(x.id)+'">Detalhes do reforço</button></article>').join("");
    const signingPanel=signingRows.length?'<section class="cc-card cc-signing-status"><small>ÚLTIMOS REFORÇOS</small><h4>Acompanhamento de chegada</h4>'+signingRows.slice(0,3).map(x=>'<div class="cc-signing-entry"><strong>'+esc(x.playerName||x.playerId)+'</strong><span>'+esc(x.presented?"Apresentação realizada":"Apresentação pendente")+' · '+esc(x.fromClubName||"Clube anterior não informado")+'</span></div>').join("")+'<button type="button" data-coach-deal-tab="reforcos">Ver todos os reforços</button></section>':'';
    const focusedSigning=signingRows.find(x=>String(x.id)===String(ui.selectedSigning))||null;
    const rosterPlayer=focusedSigning?(D?.club?.(s,s.clubId)?.roster||[]).find(p=>String(p.id)===String(focusedSigning.playerId)):null;
    const playerRole=rosterPlayer?.squadRole??rosterPlayer?.contractRole??rosterPlayer?.role??null;
    const currentOverall=rosterPlayer?.overall??rosterPlayer?.ovr??null;
    const fitnessValue=Number(rosterPlayer?.condition??rosterPlayer?.fitness);
    const fitnessKnown=rosterPlayer&&(rosterPlayer.condition!=null||rosterPlayer.fitness!=null)&&Number.isFinite(fitnessValue);
    const injury=rosterPlayer?.injury;
    const injuryActive=!!(injury&&(typeof injury==="object"?(injury.daysRemaining>0||injury.remainingDays>0||injury.active===true):injury===true));
    const position=String(rosterPlayer?.pos??rosterPlayer?.position??"").toUpperCase();
    const squadPeers=(D?.club?.(s,s.clubId)?.roster||[]).filter(p=>String(p.id)!==String(rosterPlayer?.id)&&String(p.pos??p.position??"").toUpperCase()===position).sort((a,b)=>Number(b.overall??b.ovr??0)-Number(a.overall??a.ovr??0)).slice(0,4);
    const readiness=injuryActive?"Lesão registrada":fitnessKnown?(fitnessValue<60?"Condição baixa":"Sem impedimento físico identificado"):"Disponibilidade não confirmada";
    const readinessPanel=rosterPlayer?'<section class="cc-signing-readiness"><h4>Condição e comparação na posição</h4><div class="cc-signing-stats"><div><small>Condição física</small><b>'+esc(fitnessKnown?Math.round(fitnessValue)+"%":"Não informada")+'</b></div><div><small>Situação física</small><b>'+esc(readiness)+'</b></div></div><p class="cc-note">Prévia física baseada no save; escalação, suspensões e regras da partida devem ser conferidas na tela de elenco.</p><h4>Jogadores da mesma posição</h4>'+(squadPeers.length?squadPeers.map(p=>'<div class="cc-signing-peer"><span>'+esc(p.name||p.id)+'</span><b>GER '+esc(p.overall??p.ovr??"—")+'</b></div>').join(""):'<p class="cc-note">Nenhum outro atleta na mesma posição.</p>')+'</section>':'';
    const planningPanel=rosterPlayer?'<section class="cc-signing-planning"><h4>Planejamento do elenco</h4><div class="cc-signing-stats"><div><small>Função registrada</small><b>'+esc(playerRole||"Não definida")+'</b></div><div><small>GER atual</small><b>'+esc(currentOverall??"Não informado")+'</b></div></div><p class="cc-note">A titularidade depende da escalação e das regras atuais do treinador. Nenhum status é alterado nesta consulta.</p><button type="button" data-coach-signing-squad="1">Abrir elenco e escalação</button></section>':'<p class="cc-note">Jogador não localizado no elenco atual; acesso à escalação indisponível.</p>';
    const signingDetail=focusedSigning?'<section class="cc-card cc-signing-detail"><small>FICHA DO REFORÇO</small><h3>'+esc(focusedSigning.playerName||focusedSigning.playerId)+'</h3><p>'+esc(focusedSigning.fromClubName||"Origem não informada")+' → '+esc(focusedSigning.toClubName||"Seu clube")+'</p><div class="cc-signing-stats"><div><small>Valor registrado</small><b>'+esc(focusedSigning.fee==null?"Não informado":money(focusedSigning.fee))+'</b></div><div><small>Posição</small><b>'+esc(focusedSigning.position||"—")+'</b></div><div><small>GER na contratação</small><b>'+esc(focusedSigning.overall??"—")+'</b></div><div><small>Integração ao elenco</small><b>'+esc(rosterPlayer?"No elenco atual":"Não localizado no elenco atual")+'</b></div></div><p class="cc-note">Apresentação: '+esc(focusedSigning.presented?"realizada":"pendente")+' · Data do registro: '+careerDate(s,focusedSigning.day)+'</p>'+planningPanel+readinessPanel+'<button type="button" data-coach-signing-close="1">Voltar aos reforços</button></section>':'';
    const reinforcementPanel='<section class="cc-card cc-signing-page"><small>APRESENTAÇÕES E CHEGADAS</small><h3>Reforços contratados</h3><p class="cc-note">Histórico das apresentações registradas. Nenhuma movimentação financeira é executada nesta tela.</p>'+(focusedSigning?signingDetail:(signingCards||'<p class="cc-note">Ainda não há reforços registrados nesta carreira.</p>'))+'<button type="button" data-coach-deal-tab="historico">Abrir histórico de transferências</button></section>';
    // Medidor de tensão: cresce a cada rodada e quando o clube responde com contraproposta.
    const tension=n=>{const r=Math.min(3,Number(n?.round)||1);const v=Math.min(100,(r-1)*35+(n?.response==="counter"?20:0)+(n?.response==="awaiting_reply"?5:0)+10);
      return {value:v,label:v>=75?"Crítica":v>=45?"Tensa":"Tranquila"};};
    const tensionMeter=selected?(()=>{const tz=tension(selected);return '<div class="cc-tension" data-level="'+esc(tz.label)+'"><div class="cc-tension-top"><small>TENSÃO DA NEGOCIAÇÃO</small><strong>'+esc(tz.label)+'</strong></div><div class="cc-hub-meter" role="progressbar" aria-valuenow="'+tz.value+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+tz.value+'%"></i></div><p>Você pode desistir a qualquer momento. Na rodada 3 o clube não negocia mais.</p></div>';})():"";
    // Mesa 2D: três lados da negociação (você, clube vendedor e jogador) com o resumo do acordo.
    const dealBoard=selected?(()=>{
      const co=selected.contractOffer||null,budget=Number(D?.club?.(s,s.clubId)?.budget)||0;
      const asked=Number(selected.finalFee),offered=Number(selected.requested);
      const fee=Number.isFinite(asked)&&asked>0&&selected.response==="accepted"?asked:null;
      const bonus=co&&co.status==="accepted"?Number(co.bonus)||0:0;
      const total=fee!=null?fee+bonus:null;
      const clubState=selected.status==="awaiting_window"?"Acordo fechado":selected.response==="awaiting_reply"?"Analisando":selected.response==="accepted"?"Aceitou":selected.response==="counter"?"Contraproposta":"Em andamento";
      const playerState=!co?"Contrato ainda não discutido":co.status==="accepted"?"Contrato acordado":co.status==="rejected"?"Recusou os termos":"Contraproposta do jogador";
      const row=(l,v)=>'<div><dt>'+esc(l)+'</dt><dd>'+esc(v)+'</dd></div>';
      return '<section class="cc-deal-board" aria-label="Mesa de negociação"><div class="cc-deal-side"><small>VOCÊ</small><strong>'+esc(clubName(s.clubId)||"Seu clube")+'</strong><dl>'+row("Oferta",Number.isFinite(offered)?money(offered):"—")+row("Orçamento",money(budget))+row("Após o acordo",total!=null?money(budget-total):"—")+'</dl></div>'+
        '<div class="cc-deal-center" aria-hidden="true"><span>⇄</span><b>Rodada '+esc(Math.min(3,Number(selected.round)||1))+'/3</b></div>'+
        '<div class="cc-deal-side"><small>CLUBE VENDEDOR</small><strong>'+esc(clubName(selected.sellerClubId)||"Clube")+'</strong><dl>'+row("Situação",clubState)+row("Valor pedido",fee!=null?money(fee):"Aguardando resposta")+row("Prazo",Number.isFinite(Number(selected.expiresDay))?careerDate(s,selected.expiresDay):"—")+'</dl></div>'+
        '<div class="cc-deal-side"><small>JOGADOR</small><strong>'+esc(player(selected.playerId)?.name||selected.playerId)+'</strong><dl>'+row("Situação",playerState)+row("Salário",co?money(co.salary):"—")+row("Contrato",co?co.years+" ano(s) · "+(co.role||"papel a definir"):"—")+row("Luvas",co?money(co.bonus):"—")+'</dl></div>'+
        '<div class="cc-deal-total"><span>Custo total do acordo</span><strong>'+(total!=null?money(total):"A definir")+'</strong><small>Taxa'+(bonus?' + luvas':'')+'. Troca de jogadores e parcelamento são escolhidos ao concluir.</small></div></section>';
    })():"";
    const exchangePanel=selected&&selected.response==="accepted"&&selected.status==="pending"?(()=>{
      const mine=(D?.club?.(s,s.clubId)?.roster||[]).filter(x=>x&&x.id!=="hero").slice().sort((a,b)=>Number(b.overall??b.ovr??0)-Number(a.overall??a.ovr??0));
      const val=x=>Number(root.ProLifePlayerEconomy?.marketValue?.(x))||Number(root.ProLifeApp?.valuation?.(x))||0;
      return '<fieldset class="cc-exchange"><legend>Troca de jogadores (opcional)</legend><p class="cc-note">Cada jogador incluído abate 90% do valor dele no pagamento em dinheiro. Até 3 atletas; o elenco não pode ficar abaixo de 18.</p><div class="cc-exchange-list">'+
        mine.slice(0,40).map(x=>'<label><input type="checkbox" data-coach-exchange="'+esc(selected.id)+'" value="'+esc(x.id)+'"> <b>'+esc(x.name)+'</b> <small>'+esc(x.primaryPosition||x.pos||"")+' · GER '+esc(Math.round(Number(x.overall??x.ovr??D?.overall?.(x))||0))+' · '+esc(money(val(x)))+'</small></label>').join("")+'</div></fieldset>';
    })():"";
    const detail=selected?'<section class="cc-card cc-neg-dialog" aria-label="Mesa de negociação"><h3>Negociação individual · rodada '+esc(selected.round||1)+'/3</h3>'+steps+dealBoard+tensionMeter+budgetPreview+sellerFeedback+quickOffers+contractPanel+agreedContractPanel+settlementSummary+contractCosts+'<p class="cc-note"><strong>Etapa atual:</strong> '+esc(dealStage(selected))+' · Próxima ação: '+esc(selected.status==="awaiting_window"?"aguardar a abertura da janela.":selected.response==="awaiting_reply"?"aguardar resposta do clube.":selected.response==="accepted"?"revisar contrato e finalizar acordo.":"avaliar contraproposta.")+'</p><div class="cc-deal-player">'+athlete(selected.playerId)+'</div><p>'+team(selected.sellerClubId)+' → '+team(selected.buyerClubId)+'</p><div class="cc-strip"><div><b>'+esc(money(selected.requested))+'</b><span>Última oferta</span></div><div><b>'+(selected.response==="awaiting_reply"?"Aguardando resposta":esc(money(selected.finalFee)))+'</b><span>'+(selected.response==="awaiting_reply"?"Posição do clube":selected.response==="accepted"?"Clube aceitou":"Contraproposta do clube")+'</span></div><div><b>'+(selected.status==="awaiting_window"?"Aguardando janela":careerDate(s,selected.expiresDay))+'</b><span>Validade</span></div></div><div class="cc-neg-history"><h4>Rodadas da negociação</h4>'+((selected.history||[]).length?selected.history.map(h=>'<div class="cc-neg-round"><span>RODADA '+esc(h.round)+'</span><div><strong>Oferta '+esc(money(h.offered))+'</strong><p>'+esc(h.status==="sent"||h.response==null?'Aguardando resposta do clube':h.accepted?'Oferta aceita':Number(h.response)>0?'Clube pede '+money(h.response):'Sem contraproposta registrada')+'</p></div></div>').join(""):'<p class="cc-note">Proposta original: '+esc(money(selected.requested))+'</p>')+'</div>'+(actionsOpen&&selected.response!=="accepted"&&(selected.round||1)<3?'<label class="cc-neg-offer">Nova oferta (R$)<input type="number" min="1000" max="100000000000" step="1000" value="'+esc(Math.round(selected.finalFee>0?selected.finalFee:selected.requested))+'" data-coach-deal-offer="'+esc(selected.id)+'"></label><button type="button" data-coach-deal-revise="'+esc(selected.id)+'">Enviar nova oferta</button>':'<p class="cc-note">'+(selected.response==="awaiting_reply"?'Aguarde a resposta do clube para continuar.':selected.response==="accepted"?'Clube aceitou a proposta. Prossiga com o contrato do jogador.':(selected.round||1)>=3?'Limite de três rodadas atingido.':'Negociação indisponível neste momento.')+'</p>')+''+exchangePanel+'<label class=\"cc-neg-offer\">Direito do clube vendedor<select data-coach-deal-rights=\"'+esc(selected.id)+'\"><option value=\"\">Nenhum</option><option value=\"first_refusal\">Direito de preferência (iguala a melhor oferta)</option><option value=\"buyback\">Recompra por 130% do valor pago</option></select></label><label class="cc-neg-offer">Cláusula de revenda para o clube vendedor<select data-coach-deal-sellon="'+esc(selected.id)+'"><option value="0">Sem cláusula</option><option value="10">10% sobre venda futura</option><option value="20">20% sobre venda futura</option></select></label><label class="cc-neg-offer">Condição de pagamento<select data-coach-deal-plan="'+esc(selected.id)+'"><option value="upfront">À vista</option>'+(s.coachCareer?.settings?.installments==="on"?'<option value="split">50% agora e 50% em 180 dias</option>':'')+'</select></label><p class="cc-note">A conclusão valida orçamento, jogador e prazo antes de movimentar o dinheiro.</p><div class="cc-deal-actions"><button type="button" data-coach-deal-accept="'+esc(selected.id)+'"'+(selected.status!=="pending"||selected.response!=="accepted"||(contract&&contract.status!=="accepted")?" disabled":"")+'>Concluir contratação</button><button type="button" data-coach-deal-reject="'+esc(selected.id)+'"'+(selected.status!=="pending"?' disabled':'')+'>Desistir da negociação</button><button type="button" data-coach-deal-close="1">Voltar à lista</button></div></section>':'';
    // FC27-inspired activity queue: all labels are computed from persisted data,
    // never from invented AI replies or hidden probabilities.
    const activeDealPlayerKeys=new Set(pending.map(n=>String(n.playerId)+"::"+String(n.sellerClubId)));
    const activeTasks=[
      ...sales.map(o=>({kind:"sale",id:o.id,due:Number(o.expiresDay),label:"Responder oferta recebida",person:player(o.playerId)?.name||o.playerId,waiting:o.status==="awaiting_window"})),
      ...pending.map(n=>({kind:"deal",id:n.id,due:Number(n.expiresDay),label:"Revisar negociação de compra",person:player(n.playerId)?.name||n.playerId,waiting:n.status==="awaiting_window"})),
      ...(c.inquiries||[]).filter(x=>String(x.buyerClubId)===String(s.clubId)&&!ownedPlayerIds.has(String(x.playerId))&&!activeDealPlayerKeys.has(String(x.playerId)+"::"+String(x.clubId))&&(x.status==="pending"||(["accepted","asking_price"].includes(x.status)&&Number(s.day)<=Number(x.expiresDay)))).map(x=>({kind:"inquiry",id:x.id,
        due:x.status==="pending"?Number(x.responseDay):Number(x.expiresDay),label:x.status==="pending"?"Sondagem enviada · aguardar resposta":"Sondagem aceita · abrir negociação",
        person:x.playerName||player(x.playerId)?.name||x.playerId,waiting:false,cta:x.status==="pending"?"Ver sondagem":"Negociar"}))
    ].sort((a,b)=>(a.waiting?1:0)-(b.waiting?1:0)||a.due-b.due);
    const taskPanel='<section class="cc-card cc-market-task-panel" aria-label="Atividades de mercado"><h3>Atividades da Central de Transferências</h3><p class="cc-note">As quatro próximas decisões aparecem aqui. Cada jogador ocupa uma única linha, mesmo após a sondagem virar negociação.</p>'+
      (activeTasks.length?activeTasks.slice(0,4).map(t=>'<article class="cc-deal"><div class="cc-deal-player"><strong>'+esc(t.person)+'</strong><small>'+esc(t.label)+'</small></div><span class="cc-status">'+(t.waiting?'Aguardando janela':t.due-s.day<=3?'Prazo urgente':'Até '+careerDate(s,t.due))+'</span><button type="button" '+(t.kind==="sale"?'data-coach-deal-tab="recebidas"':t.kind==="inquiry"?'data-coach-list-screen="sondagens"':'data-coach-deal-open="'+esc(t.id)+'"')+'>'+(t.cta||"Ver negociação")+'</button></article>').join(""):'<p class="cc-note">Nenhuma ação pendente. Use Scouting para localizar atletas.</p>')+'</section>';
    const prefs=c.offerPreferences||{mode:"all",blockedIds:[],listedIds:[]};
    const prefMode=["all","listed","none"].includes(prefs.mode)?prefs.mode:"all";
    const options=[["all","Receber propostas por todos"],["listed","Somente jogadores na lista"],["none","Não receber propostas"]].map(([id,label])=>'<option value="'+id+'"'+(prefMode===id?' selected':'')+'>'+label+'</option>').join("");
    const offerSettings='<details class="cc-card cc-inbox-preferences" aria-label="Preferências de propostas recebidas"><summary>Preferências de propostas <span>Configurar o recebimento global de abordagens</span></summary><p class="cc-note">A disponibilidade de cada atleta — inclusive Bloquear ofertas — agora é administrada em Meu elenco. Esta opção define apenas a regra global e não cancela ofertas já recebidas.</p><label>Recebimento<select data-coach-offer-mode>'+options+'</select></label><button type="button" data-coach-offer-save="1">Salvar preferências</button><button type="button" data-coach-market-area="squad">Administrar jogadores</button></details>';
    const urgent=sales.filter(o=>Number(o.expiresDay)-Number(s.day)<=3&&Number(o.expiresDay)>=Number(s.day)).length;
    const total=sales.reduce((sum,o)=>sum+Math.max(0,Number(o.amount)||0),0);
    const inboxHeader='<div class="cc-strip" aria-label="Resumo de propostas recebidas"><div><b>'+sales.length+'</b><span>Ofertas aguardando resposta</span></div><div><b>'+urgent+'</b><span>Prazo próximo (até 3 dias)</span></div><div><b>'+esc(money(total))+'</b><span>Valor total oferecido</span></div></div><p class="cc-note">Responder até o prazo indicado. Aceitar uma venda movimenta o atleta e o orçamento apenas com a janela aberta.</p>';
    const saleRows=inboxHeader+'<div class="cc-deal-actions"><button type="button" data-coach-sale-generate="1">Consultar interesse dos clubes</button></div>'+wrap(sales,o=>{
      const waiting=o.status==="awaiting_window",expired=!waiting&&s.day>o.expiresDay;
      const days=Math.max(0,Number(o.expiresDay)-Number(s.day));
      const urgency=waiting?(o.lastSettlementError?"Regularização: "+o.lastSettlementError:"Acordo assinado · aguardando janela"):expired?"Expirada":days<=3?"Urgente · "+days+" dia(s)":"Restam "+days+" dia(s)";
      const loanOffer=o.dealType==="loan";
      const controls=waiting?'<span class="cc-status">'+(loanOffer?'Empréstimo programado':'Venda programada')+'</span>':expired?'<span class="cc-status">Expirada</span>':'<button type="button" data-coach-sale-accept="'+esc(o.id)+'">'+(D.Career.windowStatus(s).open?(loanOffer?'Aceitar empréstimo':'Aceitar e vender'):"Aceitar acordo futuro")+'</button><button type="button" data-coach-sale-reject="'+esc(o.id)+'">Recusar</button>'+(o.round>=3?'':'<input type="number" min="1000" step="1000" value="'+esc(o.amount)+'" data-coach-sale-amount="'+esc(o.id)+'" aria-label="Valor da contraproposta"><button type="button" data-coach-sale-counter="'+esc(o.id)+'">Contraproposta</button>');
      return '<article class="cc-deal cc-inbox-offer'+(days<=3&&!waiting&&!expired?' cc-inbox-urgent':'')+'"><div class="cc-deal-player">'+athlete(o.playerId)+'</div><div>'+team(o.buyerClubId)+'<small> '+(loanOffer?'Interesse em empréstimo':'Interesse em contratar')+' · rodada '+esc(o.round||1)+'/3</small></div><div class="cc-deal-terms"><b>'+esc(money(o.amount))+'</b><small>'+esc(urgency)+'</small></div><div class="cc-deal-actions">'+controls+'</div></article>';
    },"Nenhuma proposta recebida.")+offerSettings;
    const deals=wrap(pending,n=>{
      const waiting=n.status==="awaiting_window";
      const waitingReply=n.response==="awaiting_reply";
      const expired=!waiting&&Number(s.day)>Number(n.expiresDay);
      return '<article class="cc-deal"><div class="cc-deal-player">'+athlete(n.playerId)+'</div><div class="cc-deal-parties">'+team(n.sellerClubId)+'<span aria-hidden="true">→</span>'+team(n.buyerClubId)+'</div><div class="cc-deal-terms"><b>'+esc(money(n.finalFee))+'</b><small>Proposta: '+esc(money(n.requested))+' · Até dia '+esc(n.expiresDay)+'</small></div><div class="cc-deal-actions"><span class="cc-status">'+(waiting?(n.lastSettlementError?'Aguardando regularização: '+esc(n.lastSettlementError):'Aguardando abertura da janela'):expired?'Expirada':waitingReply?'Resposta prevista em '+careerDate(s,n.replyDay):'Aguardando decisão')+'</span>'+(expired||waiting?'':'<button type="button" data-coach-deal-accept="'+esc(n.id)+'"'+(n.response!=="accepted"?' disabled':'')+'>Aceitar valor</button>')+'<button type="button" data-coach-deal-reject="'+esc(n.id)+'">Recusar</button><button type="button" data-coach-deal-open="'+esc(n.id)+'">Ver negociação</button></div></article>';
    },"Nenhuma contraproposta pendente.");
    const loanRows=wrap(loans,l=>'<article class="cc-deal"><div class="cc-deal-player">'+athlete(l.playerId)+'</div><div class="cc-deal-parties">'+team(l.fromClubId)+'<span aria-hidden="true">→</span>'+team(l.toClubId)+'</div><div class="cc-deal-terms"><b>Até dia '+esc(l.dueDay)+'</b><small>Salário do contratante: '+esc(l.salaryShare??0)+'% · Taxa: '+esc(money(l.fee))+'</small><small>'+(l.buyOption?'Opção de compra '+esc(money(l.buyOption)):'Sem opção de compra')+'</small></div>'+(l.buyOption&&l.toClubId===s.clubId?'<button type="button" data-coach-deal-buy="'+esc(l.id)+'">Comprar jogador</button>':'')+'</article>',"Nenhum empréstimo ativo.");
    // Contract migration runs before this view. Fallback estimates remain defensive
    // for malformed or externally imported saves and never debit the budget.
    const payrollPlayers=(own?.roster||[]).filter(p=>p&&p.id!=="hero");
    const hasWage=p=>p.salary!==null&&p.salary!==undefined&&p.salary!==""&&Number.isFinite(Number(p.salary))&&Number(p.salary)>=0;
    const knownSalaries=payrollPlayers.filter(hasWage);
    const missingSalaries=payrollPlayers.filter(p=>!hasWage(p));
    const registeredMonthly=knownSalaries.reduce((total,p)=>total+Number(p.salary),0);
    const estimatedMonthly=missingSalaries.reduce((total,p)=>total+(Number(root.ProLifeApp?.minimumMarketSalaryMonthly?.(p))||0),0);
    const forecastMonthly=registeredMonthly+estimatedMonthly;
    // M03.8: loan split affects forecasts only; budget remains independent.
    const activePayrollLoans=(c.loans||[]).filter(l=>!l.returned);
    const loanSalary=p=>hasWage(p)?Number(p.salary):(Number(root.ProLifeApp?.minimumMarketSalaryMonthly?.(p))||0);
    const loanAdjustment=activePayrollLoans.reduce((sum,l)=>{
      const p=payrollPlayers.find(x=>x.id===l.playerId)||
        (s.clubs||[]).flatMap(x=>x.roster||[]).find(x=>x.id===l.playerId);
      if(!p)return sum;
      const pct=Math.max(0,Math.min(100,Number(l.salaryShare??50)))/100;
      const inCurrentRoster=payrollPlayers.some(x=>x.id===l.playerId);
      if(l.toClubId===s.clubId)return sum+loanSalary(p)*(pct-(inCurrentRoster?1:0));
      if(l.fromClubId===s.clubId)return sum+loanSalary(p)*((1-pct)-(inCurrentRoster?1:0));
      return sum;
    },0);
    const adjustedMonthly=Math.max(0,Math.round(forecastMonthly+loanAdjustment));
    const transferBudget=Number(own?.budget);
    const wageBudgetProjection={monthly:adjustedMonthly,annual:adjustedMonthly*12,loanAdjustment:Math.round(loanAdjustment),transferBudget};
    // M03.9: affordability diagnostic only. No salary funding has been established.
    const annualWageToTransferRatio=Number.isFinite(transferBudget)&&transferBudget>0?
      wageBudgetProjection.annual/transferBudget:null;
    const affordabilityNote=annualWageToTransferRatio==null?
      'Comparação indisponível: orçamento de transferências não informado ou zerado.':
      'Referência ilustrativa: folha anual equivale a '+esc(Math.round(annualWageToTransferRatio*100))+
      '% do orçamento de transferências. Não representa disponibilidade para salários.';
    const payrollReadiness=missingSalaries.length||activePayrollLoans.length?
      'Cobrança automática desativada: existem salários estimados ou empréstimos que precisam de validação.':
      'Cobrança automática desativada até definição de receitas e orçamento salarial independente.';
    // M03.10: future cashflow planning, not actual revenue recognition or payroll settlement.
    const knownRecurringRevenue=(c.finance?.recurringRevenues||[]).filter(x=>x&&x.active===true&&Number.isFinite(Number(x.monthlyAmount))&&Number(x.monthlyAmount)>0);
    const monthlyRevenue=knownRecurringRevenue.reduce((sum,x)=>sum+Number(x.monthlyAmount),0);
    const financeGap=Math.max(0,wageBudgetProjection.monthly-monthlyRevenue);
    const financeCoverage=wageBudgetProjection.monthly>0?Math.min(100,Math.floor(monthlyRevenue/wageBudgetProjection.monthly*100)):100;
    // Keep the finance summary visible even when an older page cache lacks club-economy.js.
    const fundingSnapshot=root.ProLifeClubEconomy?.fundingSnapshot?.(own,c.finance,wageBudgetProjection.monthly)||{
      salaryBudget:c.finance?.salaryBudget!=null&&c.finance?.salaryBudget!==""&&
        Number.isFinite(Number(c.finance.salaryBudget))&&Number(c.finance.salaryBudget)>=0?
        Number(c.finance.salaryBudget):null,
      annualRevenue:monthlyRevenue*12
    };
    const fundingDetails=fundingSnapshot?'<p><b>Orçamento salarial independente:</b> '+
      (fundingSnapshot.salaryBudget===null?'Ainda não configurado':esc(money(fundingSnapshot.salaryBudget))+'/mês')+
      ' · <b>Receita anual documentada:</b> '+esc(money(fundingSnapshot.annualRevenue))+'</p>'+
      '<p class="cc-note">Projeção somente informativa. Fontes não cadastradas não são consideradas; nenhum valor foi debitado ou creditado.</p>':'';
    const financeReadiness='<section class="cc-card" aria-label="Planejamento do custeio salarial"><h4>Planejamento do custeio salarial</h4>'+
      '<p><b>Receitas recorrentes cadastradas:</b> '+esc(money(monthlyRevenue))+'/mês · <b>Cobertura informada:</b> '+esc(financeCoverage)+'%</p>'+
      '<p><b>Necessidade ainda não financiada:</b> '+esc(money(financeGap))+'/mês</p>'+
      fundingDetails+
      '<p class="cc-note">Somente receitas cadastradas e ativas são consideradas. Ausência de cadastro não significa receita real igual a zero. Não inclui patrocínios, bilheteria ou premiações ainda não implementados. Nenhuma receita ou despesa foi lançada.</p></section>';
    // Display the forecast even when an older browser session has cached the economy module.
    const projectedIncome=root.ProLifeClubEconomy?.revenueProjection?.(own)||(()=>{
      const strength=Math.max(30,Math.min(100,Number(own?.structure??own?.strength??own?.reputation??60)||60));
      const league=String(own?.leagueId||"").toLowerCase();
      const tier=league==="seriea"?1:league==="serieb"?.46:league==="seriec"?.18:league==="seried"?.07:.5;
      const scale=Math.pow(strength/70,2.4);
      const sponsorshipAnnual=Math.round(12000000*tier*scale/100000)*100000;
      const broadcastAnnual=Math.round(30000000*tier*scale/100000)*100000;
      return {sponsorshipAnnual,broadcastAnnual,totalAnnual:sponsorshipAnnual+broadcastAnnual};
    })();
    const futureRevenuePanel=projectedIncome?'<section class="cc-card" aria-label="Estimativa de patrocinios e transmissoes"><h4>Receitas potenciais — simulação</h4>'+
      '<p><b>Patrocínios anuais estimados:</b> '+esc(money(projectedIncome.sponsorshipAnnual))+
      ' · <b>Transmissão anual estimada:</b> '+esc(money(projectedIncome.broadcastAnnual))+'</p>'+
      '<p><b>Total anual hipotético:</b> '+esc(money(projectedIncome.totalAnnual))+'</p>'+
      '<p class="cc-note">Projeção baseada na estrutura e divisão do clube. Não são contratos firmados, receitas recebidas nem valores oficiais. Nenhum crédito ou mudança no save.</p></section>':'';
    const sponsorBrands=Array.isArray(root.ProLifeCommercial?.brands)?root.ProLifeCommercial.brands:[];
    const clubSponsorCandidates=root.ProLifeClubEconomy?.sponsorshipCandidates?.(
      own,sponsorBrands)||sponsorBrands.filter(b=>b?.id&&b?.name).map(b=>({
        id:b.id,name:b.name,prestige:Number(b.prestige)||0,readOnly:true
      })).sort((a,b)=>b.prestige-a.prestige).slice(0,40);
    const sponsorCatalogPanel='<section class="cc-card" aria-label="Marcas disponiveis no catalogo"><h4>Marcas do catálogo — referências</h4>'+
      (clubSponsorCandidates.length?'<p>'+clubSponsorCandidates.slice(0,8).map(b=>esc(b.name)).join(' · ')+
        '</p><p class="cc-note">'+esc(clubSponsorCandidates.length)+' marcas compatíveis com o perfil do clube.</p>':
        '<p class="cc-note">As marcas não foram carregadas nesta sessão. Recarregue a página; nenhum contrato foi criado.</p>')+
      '<p class="cc-note">São referências do catálogo comercial do jogo, não patrocinadores confirmados do clube. Nenhum contrato ou receita foi criado.</p></section>';
    const sponsorOffers=root.ProLifeClubEconomy?.sponsorshipOffers?.(s,own,sponsorBrands)||[];
    const sponsorCounterOffers=(c.finance?.sponsorshipOffers||[]).filter(x=>["counter","awaiting_brand","brand_accepted","brand_rejected","brand_countered"].includes(x.status));
    const sponsorshipOfferPanel='<section class="cc-card" aria-label="Propostas de patrocinio"><h4>Propostas de patrocínio</h4>'+
      (sponsorOffers.length?sponsorOffers.map(o=>'<article class="cc-deal"><div><b>'+esc(o.brandName)+
        '</b><p class="cc-note">'+esc(o.label)+' · '+esc(money(o.annualAmount))+'/ano · 365 dias</p></div>'+
        '<div class="cc-deal-actions"><button type="button" data-coach-sponsor-accept="'+esc(o.id)+'">Aceitar</button><button type="button" data-coach-sponsor-reject="'+esc(o.id)+'">Recusar</button><button type="button" data-coach-sponsor-counter="'+esc(o.id)+'" data-coach-sponsor-base="'+esc(o.annualAmount)+'" >Enviar contraproposta</button></div></article>').join(''):
        '<p class="cc-note">'+(root.ProLifeClubEconomy?.sponsorshipOffers?"Nenhuma nova proposta disponível para as categorias atuais.":"Módulo de propostas indisponível (versão econômica: "+esc(root.ProLifeClubEconomy?.VERSION||"ausente")+"; diagnóstico: "+esc(root.ProLifeClubEconomyLoadStatus||"sem diagnóstico")+"). A área de contratos permanece protegida.")+'</p>')+
      (sponsorCounterOffers.length?'<p class="cc-note">Negociações de patrocínio:</p>'+sponsorCounterOffers.map(o=>'<article class="cc-deal"><div><b>'+esc(o.brandName)+' · '+esc(money(o.counterAmount))+'/ano</b><p class="cc-note">'+esc(["brand_accepted","brand_countered"].includes(o.status)?"A marca aceitou sua contraproposta.":o.status==="brand_rejected"?"A marca recusou sua contraproposta.":o.status==="brand_countered"?"A marca oferece "+money(o.brandCounterAmount)+"/ano. Responda até o dia "+o.responseExpiresDay:"Aguardando resposta da marca no dia "+o.replyDay)+ '</p></div>'+(o.status==="brand_accepted"?'<button type="button" data-coach-sponsor-accept="'+esc(o.id)+'">Aceitar oferta da marca</button>':'')+(o.status==="brand_countered"?'<button type="button" data-coach-sponsor-decline="'+esc(o.id)+'">Recusar oferta da marca</button>':'')+'</article>').join(''):'')+
      '<p class="cc-note">O aceite registra um contrato futuro, sem crédito imediato. Contrapropostas são analisadas pela marca durante três dias de carreira.</p></section>';
    const signedRevenue=(c.finance?.revenueContracts||[]).filter(x=>String(x.clubId)===String(s.clubId));
    const revenueContractPanel='<section class="cc-card" aria-label="Contratos de receita registrados"><h4>Contratos de receitas</h4>'+
      (signedRevenue.length?signedRevenue.map(x=>'<p><b>'+esc(x.type==="broadcast"?"Transmissão":"Patrocínio")+
        ':</b> '+esc(money(x.annualAmount))+'/ano · Início '+careerDate(s,x.startDay)+' · Término '+careerDate(s,x.endDay)+
        ' · Status: '+esc(x.status||"scheduled")+(x.brandName?' · '+esc(x.brandName):'')+'</p>').join(""):
        '<p class="cc-note">Nenhum contrato de receita cadastrado neste save.</p>')+
      '<p class="cc-note">Registros informativos: pagamentos e créditos ainda não estão habilitados.</p></section>';
    const dueRevenue=root.ProLifeClubEconomy?.revenueSchedule?.(s,s.clubId)||[];
    const revenueSchedulePanel='<section class="cc-card" aria-label="Agenda de recebimentos previstos"><h4>Agenda de recebimentos previstos</h4>'+
      (dueRevenue.length?dueRevenue.slice(0,12).map(x=>'<p><b>'+esc(x.type==="broadcast"?"Transmissão":"Patrocínio")+
       ':</b> '+careerDate(s,x.dueDay)+' · '+esc(money(x.expectedAmount))+' · Previsto, não recebido</p>').join(""):
       '<p class="cc-note">Nenhum vencimento futuro de receita contratado.</p>')+
      '<p class="cc-note">Calendário informativo, sem créditos automáticos e sem lançamentos retroativos.</p></section>';
    const settlementAudit=root.ProLifeCoachCareer?.payrollReadiness?.(s,D);
    const settlementPanel=settlementAudit?'<section class="cc-card" aria-label="Pendencias para pagamento salarial"><h4>Pendências antes de ativar pagamentos</h4>'+
      '<p class="cc-note">'+(settlementAudit.reasons||[]).map(esc).join(' · ')+'</p>'+
      '<p class="cc-note">Validação de segurança: nenhuma cobrança automática será feita.</p></section>':'';
    const payrollPanel='<section class="cc-card" aria-label="Projeção da folha salarial"><h4>Projeção da folha salarial</h4>'+
      '<p><b>Salários contratuais:</b> '+esc(money(registeredMonthly))+'/mês · <b>Fallbacks pendentes:</b> '+esc(money(estimatedMonthly))+'/mês</p>'+
      '<p><b>Folha mensal projetada:</b> '+esc(money(forecastMonthly))+' · <b>Folha anual projetada:</b> '+esc(money(forecastMonthly*12))+'</p>'+
      '<p><b>Projeção com rateio de empréstimos:</b> '+esc(money(wageBudgetProjection.monthly))+'/mês · <b>Anual:</b> '+esc(money(wageBudgetProjection.annual))+'</p>'+ 
      '<p class="cc-note">Orçamento de transferências: '+esc(money(wageBudgetProjection.transferBudget))+' · Ajuste líquido de empréstimos: '+esc(money(wageBudgetProjection.loanAdjustment))+'/mês. Orçamento salarial informativo e separado; nenhuma movimentação financeira.</p>'+ 
      '<p class="cc-note">'+affordabilityNote+' '+payrollReadiness+'</p>'+ 
      '<p class="cc-note">Contratos sincronizados: '+esc(knownSalaries.length)+' · Registros incompletos: '+esc(missingSalaries.length)+
      '. Valores-base usam GER, idade, potencial, posição e nível do clube; contratos já negociados são preservados. Empréstimos continuam respeitando o rateio salarial.</p></section>';
    const payrollForecastEntries=(c.payrollForecast?.clubId===s.clubId?c.payrollForecast.entries:[])||[];
    const payrollHistory=payrollForecastEntries.length?'<section class="cc-card" aria-label="Histórico da previsão salarial"><h4>Histórico de previsões mensais</h4>'+
      payrollForecastEntries.slice(-6).reverse().map(e=>'<p class="cc-note">Registro '+careerDate(s,e.day)+' · Salários informados: '+esc(money(e.monthlyRegistered))+
      ' · Sem salário: '+esc(e.missingCount)+' · Somente previsão, não pago</p>').join("")+'</section>':'';
    // M03.11: independently classify transfer liabilities and documented receipts.
    // A transfer fee is not recurring operating revenue.
    const validDebts=debts.filter(d=>d&&Number.isFinite(Number(d.amount))&&Number(d.amount)>0);
    const transferDue=validDebts.reduce((sum,d)=>sum+Number(d.amount),0);
    const overdueDebts=validDebts.filter(d=>Number.isFinite(Number(d.dueDay))&&Number(d.dueDay)<Number(s.day));
    const hasRevenueEvidence=knownRecurringRevenue.length>0;
    const financeAudit='<section class="cc-card" aria-label="Auditoria das obrigações financeiras"><h4>Auditoria de entradas e obrigações</h4>'+
      '<p><b>Parcelas de transferências em aberto:</b> '+esc(money(transferDue))+
      ' · <b>Parcelas vencidas:</b> '+esc(overdueDebts.length)+'</p>'+
      '<p><b>Fontes de receitas recorrentes cadastradas:</b> '+esc(knownRecurringRevenue.length)+
      ' · <b>Empréstimos ativos:</b> '+esc(activePayrollLoans.length)+'</p>'+
      '<p class="cc-note">'+(hasRevenueEvidence?'Receitas cadastradas exibidas no painel de custeio.':'Nenhuma fonte recorrente cadastrada. Isso não significa ausência de receitas reais.')+
      ' Transferências, receitas recorrentes e salários são categorias separadas. Nenhum lançamento ou pagamento foi criado.</p></section>';
    const debtRows=wrap(debts,d=>'<article class="cc-deal"><div class="cc-deal-parties">'+team(d.buyerClubId)+'<span aria-hidden="true">→</span>'+team(d.sourceClubId)+'</div><div class="cc-deal-terms"><b>'+esc(money(d.amount))+'</b><small>Vencimento: dia '+esc(d.dueDay)+' · '+esc(d.playerId||"Transferência")+'</small></div><span class="cc-status">A pagar</span></article>',"Nenhuma parcela em aberto.");
    const rights=(c.rightsClauses||[]).filter(x=>x.active);
    const rightsRows=rights.map(x=>'<article class="cc-deal"><div class="cc-deal-player">'+athlete(x.playerId)+'</div><div class="cc-deal-parties">'+team(x.holderClubId)+'<span aria-hidden="true">→</span>'+team(x.ownerClubId)+'</div><div class="cc-deal-terms"><b>'+(x.type==="buyback"?"Recompra por "+money(x.price):"Direito de preferência")+'</b><small>Vale até '+careerDate(s,x.expiresDay)+'</small></div></article>').join("");
    const clauseRows=wrap(clauses,x=>'<article class="cc-deal"><div class="cc-deal-player">'+athlete(x.playerId)+'</div><div class="cc-deal-parties">'+team(x.sellerClubId)+'<span aria-hidden="true">→</span>'+team(x.buyerClubId)+'</div><div class="cc-deal-terms"><b>'+esc(x.percentage)+'% de revenda</b><small>Ativa até uma próxima venda definitiva</small></div></article>',(rights.length?"":"Nenhuma cláusula ativa."));
    const historyRows=[
      ...saleHistory.map(o=>({day:o.closedDay??o.expiresDay,html:'<div class="cc-deal"><div class="cc-deal-player">'+athlete(o.playerId)+'</div><span>'+esc(clubName(o.buyerClubId))+' · '+esc(o.status)+'</span><b>'+esc(money(o.finalFee??o.amount))+'</b></div>'})),
      ...negotiationHistory.map(n=>({day:n.closedDay??n.expiresDay,html:'<div class="cc-deal"><div class="cc-deal-player">'+athlete(n.playerId)+'</div><div>'+esc(money(n.finalFee))+'</div><small>'+esc(n.status)+'</small></div>'})),
      ...paid.map(d=>({day:d.paidDay??d.dueDay,html:'<div class="cc-deal"><div>'+team(d.buyerClubId)+' → '+team(d.sourceClubId)+'</div><b>'+esc(money(d.amount))+'</b><small>Parcela liquidada · dia '+esc(d.paidDay??d.dueDay)+'</small></div>'})),
      ...finishedLoans.map(l=>({day:l.returnDay??l.purchaseDay??l.dueDay,html:'<div class="cc-deal"><div class="cc-deal-player">'+athlete(l.playerId)+'</div><span>'+(l.purchased?'Compra definitiva':'Empréstimo encerrado')+'</span><small>Dia '+esc(l.returnDay??l.purchaseDay??l.dueDay)+'</small></div>'})),
      ...transactions.slice(0,30).map(t=>({day:t.day,html:'<div class="cc-deal"><span>'+esc(t.player||"Jogador")+' · '+esc(t.from||"Origem")+' → '+esc(t.to||"Destino")+'</span><b>'+esc(money(t.fee))+'</b><small>Dia '+esc(t.day)+'</small></div>'}))
    ].sort((a,b)=>Number(b.day||0)-Number(a.day||0)).slice(0,45).map(x=>x.html).join("")||'<p class="cc-note">Nenhuma movimentação registrada.</p>';
    const listRows=wrap(c.shortlist||[],x=>{
      const p=player(x.playerId);
      const owner=p?.clubId||((s.clubs||[]).find(cl=>(cl.roster||[]).some(y=>y.id===x.playerId))?.id)||x.clubId;
      const moved=owner!==x.clubId;
      return '<article class="cc-deal"><div class="cc-deal-player">'+athlete(x.playerId)+'</div><div>'+team(owner)+'</div><div class="cc-deal-actions">'+(moved?'<span class="cc-status">'+(owner===s.clubId?"Já está no seu elenco":"Mudou de clube")+'</span>':'<button type="button" data-coach-scout-offer="'+esc(x.clubId)+'" data-coach-player="'+esc(x.playerId)+'">Negociar contratação</button>')+'<button type="button" data-coach-shortlist="'+esc(x.clubId)+'" data-coach-player="'+esc(x.playerId)+'">Remover</button></div></article>';
    },"Sua lista está vazia. Use Observação para acompanhar jogadores.");
    const contractRows=wrap((own?.roster||[]).filter(p=>p.id!=="hero"),p=>{
      const monthly=Number(p.salary??p.contract?.salary)||0;
      const weekly=Number(root.ProLifePlayerEconomy?.weeklySalary?.(monthly))||Math.round(monthly*12/52);
      const value=Number(p.marketValue??p.value??root.ProLifePlayerEconomy?.marketValue?.(p,own))||0;
      const expiry=Number(p.contractEndDay??p.contract?.endDay??p.contract?.expiresDay);
      const role=String(p.squadRole||p.contract?.role||"Rotação").replace(/_/g," ");
      return '<article class="cc-deal"><div class="cc-deal-player"><strong>'+esc(p.name||"Atleta")+'</strong><small>'+esc(p.pos||p.position||"")+' · GER '+esc(p.ovr??p.overall??"—")+'</small></div><div class="cc-deal-terms"><b>'+esc(money(monthly))+'/mês</b><small>'+esc(money(weekly))+'/semana · Valor '+esc(money(value))+'</small><small>Contrato até '+esc(Number.isFinite(expiry)?careerDate(s,expiry):"Não informado")+' · '+esc(role)+'</small></div></article>';
    },"Nenhum contrato encontrado.");
    const summaryCards=[
      {label:"Ofertas para responder",value:sales.filter(x=>x.status==="pending").length,tab:"recebidas",note:"Vendas e contrapropostas"},
      {label:"Contratações em aberto",value:pending.filter(x=>x.status==="pending").length,tab:"propostas",note:"Negociações com clubes"},
      {label:"Aguardando janela",value:pending.filter(x=>x.status==="awaiting_window").length+sales.filter(x=>x.status==="awaiting_window").length,tab:"propostas",note:"Acordos futuros"},
      {label:"Contratos do elenco",value:(own?.roster||[]).filter(p=>p.id!=="hero").length,tab:"contratos",note:"Salários e vínculos registrados"}
    ];
    const marketOverview='<section class="cc-market-overview" aria-label="Painel de decisões do mercado"><div class="cc-market-overview-heading"><div><small>VISÃO GERAL</small><h3>Decisões do mercado</h3></div><p>Dados atuais da carreira. Selecione uma categoria para continuar.</p></div><div class="cc-market-overview-grid">'+
      summaryCards.map(x=>'<button type="button" class="cc-market-overview-card" data-coach-deal-tab="'+esc(x.tab)+'"><small>'+esc(x.label)+'</small><strong>'+x.value+'</strong><span>'+esc(x.note)+'</span></button>').join("")+'</div></section>';
    const content={lista:listRows,recebidas:saleRows,propostas:deals,emprestimos:loanRows,financeiro:payrollPanel+financeReadiness+futureRevenuePanel+sponsorCatalogPanel+sponsorshipOfferPanel+revenueContractPanel+revenueSchedulePanel+settlementPanel+financeAudit+payrollHistory+debtRows,contratos:payrollPanel+contractRows,clausulas:clauseRows+rightsRows,historico:historyRows,reforcos:reinforcementPanel};
    const heading={lista:"Jogadores observados",recebidas:"Propostas recebidas pelos seus jogadores",propostas:"Propostas e contrapropostas",emprestimos:"Empréstimos ativos",financeiro:"Obrigações financeiras",contratos:"Contratos do elenco",clausulas:"Cláusulas de revenda",historico:"Histórico financeiro e de transferências",reforcos:"Chegada e apresentação dos reforços"};
    // The primary market navigation is rendered once by renderMarket; this keeps
    // negotiation sub-tabs independent without repeating the same route bar.
    const marketNav="";
    const dealNav='<nav class="cc-deal-nav cc-market-screen-nav" aria-label="Telas independentes de transferências">'+tabs.map(([id,label,count])=>'<button type="button" data-coach-deal-tab="'+id+'" aria-pressed="'+(ui.dealTab===id)+'">'+label+' <small>'+count+'</small></button>').join("")+'</nav>';
    // Deadline Day: no último dia da janela, destaca o que ainda precisa de decisão.
    const winNow=D?.Career?.windowStatus?.(s)||null;
    const deadlinePanel=winNow&&winNow.open&&Number(winNow.remaining)<=1?(()=>{
      const open=activeTasks.filter(x=>!x.waiting);
      const rows=open.slice(0,8).map(x=>'<li><b>'+esc(x.person)+'</b> · '+esc(x.label)+'</li>').join("");
      return '<section class="cc-card cc-deadline" role="alert"><small>DEADLINE DAY</small><h3>Último dia da janela de transferências</h3><p class="cc-note">'+(open.length?'Ainda há '+open.length+' assunto(s) em aberto. Depois de hoje, as negociações só continuam na próxima janela.':'Nada pendente. Você pode avançar o dia com tranquilidade.')+'</p>'+(rows?'<ul class="cc-deadline-list">'+rows+'</ul>':'')+'</section>';
    })():"";
    const overview=ui.dealTab==="propostas"?'<div class="cc-strip"><div><b>'+pending.length+'</b><span>Propostas pendentes</span></div><div><b>'+loans.length+'</b><span>Empréstimos ativos</span></div><div><b>'+debts.length+'</b><span>Parcelas a pagar</span></div><div><b>'+clauses.length+'</b><span>Cláusulas de revenda</span></div></div>'+marketOverview+taskPanel:'';
    const overviewWithDeadline=deadlinePanel+overview;
    const chosenOffer=selected?'<section class="cc-card cc-market-selected-offer"><small>NEGOCIAÇÃO SELECIONADA</small><h3>'+esc(player(selected.playerId)?.name||selected.playerId)+'</h3><p>'+esc(dealStage(selected))+'</p><div class="cc-market-steps"><span>Proposta enviada</span><span>'+esc(selected.response==="awaiting_reply"?"Resposta pendente":"Resposta recebida")+'</span><span>'+esc(selected.status==="awaiting_window"?"Acordo futuro":selected.response==="accepted"?"Contrato":"Decisão")+'</span></div><button type="button" data-coach-deal-close="1">Fechar negociação</button></section>':'<section class="cc-card cc-market-selected-offer"><small>ACOMPANHAMENTO</small><h3>Selecione uma proposta</h3><p class="cc-note">Escolha Ver negociação na lista para acompanhar a resposta do clube e as próximas etapas.</p></section>';
    const negotiationDetail=ui.dealTab==="propostas"?draftPanel+chosenOffer+detail+signingPanel:'';
    return marketNav+dealNav+'<header class="cc-market-screen-head"><small>CENTRAL DE TRANSFERÊNCIAS</small><h2>'+esc(heading[ui.dealTab])+'</h2><p class="cc-note">Registros e decisões da carreira atual, sem alterações automáticas no save.</p></header>'+overviewWithDeadline+'<section class="cc-card cc-deal-section">'+negotiationDetail+content[ui.dealTab]+'</section>';
  }


  function renderSponsorships(s,D){
    const money = value => Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2
    });
    const own=D.club(s),economy=root.ProLifeClubEconomy,brands=root.ProLifeCommercial?.brands||[];
    if(!own||!economy)return css()+'<section class="cc-dark"><section class="cc-card"><h2>Patrocínios do clube</h2><p class="cc-note">Assine com um clube para administrar contratos comerciais.</p></section></section>';
    economy.initializeSponsorships?.(s,own,brands);
    const finance=s.coachCareer?.finance||{},offers=finance.sponsorshipOffers||[],contracts=(finance.revenueContracts||[]).filter(x=>x.type==="sponsorship"&&String(x.clubId)===String(own.id));
    const activeSponsorStatuses=["pending","proposal","awaiting_brand","counter","brand_accepted","brand_countered"];
    const normalizedOffers=offers.map(x=>{const deadline=Number(x.responseExpiresDay??x.expiresDay);return activeSponsorStatuses.includes(x.status)&&Number.isFinite(deadline)&&deadline<Number(s.day)?{...x,status:"expired"}:x;});
    const pending=normalizedOffers.filter(x=>activeSponsorStatuses.includes(x.status));
    const concluded=normalizedOffers.filter(x=>!activeSponsorStatuses.includes(x.status));
    const statusLabel={pending:"Pendente",proposal:"Pendente",awaiting_brand:"Aguardando resposta",counter:"Aguardando resposta",brand_accepted:"Marca aceitou",brand_countered:"Contraproposta da marca",brand_rejected:"Recusada pela marca",accepted:"Ativa",rejected:"Recusada",expired:"Expirada"};
    const proposalCard=o=>{
      const conflict=economy.sponsorshipConflict?.(s,o),days=Math.max(0,Number(o.responseExpiresDay??o.expiresDay)-Number(s.day));
      const annual=Number(o.brandCounterAmount||o.counterAmount||o.annualAmount)||0;
      const decision=["pending","proposal"].includes(o.status)?
        '<div class="cc-deal-actions"><button type="button" data-coach-sponsor-accept="'+esc(o.id)+'"'+(conflict?' disabled aria-disabled="true"':'')+'>Aceitar</button><button type="button" data-coach-sponsor-reject="'+esc(o.id)+'">Recusar</button><button type="button" data-coach-sponsor-counter="'+esc(o.id)+'" data-coach-sponsor-base="'+esc(o.annualAmount)+'">Enviar contraproposta</button></div>':
        o.status==="brand_accepted"?'<div class="cc-deal-actions"><button type="button" data-coach-sponsor-accept="'+esc(o.id)+'"'+(conflict?' disabled aria-disabled="true"':'')+'>Assinar</button><button type="button" data-coach-sponsor-decline="'+esc(o.id)+'">Recusar</button></div>':
        o.status==="brand_countered"?'<div class="cc-deal-actions"><button type="button" data-coach-sponsor-accept="'+esc(o.id)+'"'+(conflict?' disabled aria-disabled="true"':'')+'>Aceitar contraproposta</button><button type="button" data-coach-sponsor-decline="'+esc(o.id)+'">Recusar</button></div>':'';
      return '<article class="cc-card cc-deal" id="club-sponsor-offer-'+esc(o.id)+'"><div><small>'+esc(statusLabel[o.status]||o.status)+' · '+esc(o.label)+'</small><h3>'+esc(o.brandName)+'</h3><div class="profile-data"><span>Valor anual <b>'+money(annual)+'</b></span><span>Duração <b>'+Math.round(Number(o.durationDays)/365)+' temporada</b></span><span>Pagamento <b>'+esc(o.paymentFrequency==="monthly"?'Mensal':'Personalizado')+'</b></span><span>Prazo <b>'+days+' dia(s)</b></span></div><p class="cc-note"><b>Bônus:</b> '+esc(o.bonus?.label||"Sem bônus")+(o.bonus?.amount?' · '+money(o.bonus.amount):'')+'<br><b>Obrigações:</b> '+esc((o.obligations||[]).join(" · ")||"Nenhuma obrigação adicional")+'<br><b>Exclusividade:</b> '+esc(o.exclusive?'Exclusiva na categoria e em grupos conflitantes':'Não exclusiva, respeitando conflitos de marca')+'</p>'+(conflict?'<p class="cc-note bad"><b>Incompatível:</b> '+esc(conflict.reason)+' Contrato atual: '+esc(conflict.contract.brandName||"vigente")+'.</p>':'')+'</div>'+decision+'</article>';
    };
    const contractById=new Map(contracts.map(x=>[x.id,x]));
    const installmentTotal=x=>Math.max(0,Math.floor((Number(x.endDay)-Number(x.startDay))/(Number(x.paymentIntervalDays)||30)));
    const contractCard=x=>{
      const total=installmentTotal(x),received=(x.postedPeriods||[]).length;
      const installment=Math.round(Number(x.annualAmount||0)/Math.max(1,Math.round(365/(Number(x.paymentIntervalDays)||30))));
      const remaining=Math.max(0,total*installment-Number(x.postedAmount||0));
      const receivedTotal=(finance.revenueHistory||[]).filter(row=>row.contractId===x.id&&["payment","bonus"].includes(row.event)).reduce((sum,row)=>sum+Number(row.amount||0),0);
      return '<article class="cc-card"><small>'+esc(x.status==="ended"?'ENCERRADO':x.status==="scheduled"?'AGENDADO':'ATIVO')+' · '+esc(x.sponsorRoleLabel||x.sponsorRole||"Patrocínio")+'</small><h3>'+esc(x.brandName||"Patrocinador")+'</h3><p><b>Categoria:</b> '+esc(x.brandCategory||"Não informada")+'<br><b>Valor anual:</b> '+money(x.annualAmount)+'<br><b>Início:</b> '+careerDate(s,x.startDay)+' · <b>Fim:</b> '+careerDate(s,x.endDay)+'<br><b>Parcelas recebidas:</b> '+esc(received)+' de '+esc(total)+'<br><b>Total recebido:</b> '+money(receivedTotal)+'<br><b>Valor contratual ainda previsto:</b> '+money(remaining)+'<br><b>Condição de bônus:</b> '+esc(x.bonus?.label||"Não previsto")+(x.bonus?.amount?' · '+money(x.bonus.amount):'')+'<br><b>Exclusividade:</b> '+esc(x.exclusive?'Exclusiva na categoria e nos grupos contratuais':'Não exclusiva, respeitando conflitos contratuais')+'</p></article>';
    };
    const history=(finance.revenueHistory||[]).filter(x=>contractById.has(x.contractId)).slice().sort((a,b)=>Number(b.day)-Number(a.day)||String(b.paymentId||"").localeCompare(String(a.paymentId||"")));
    const schedule=(economy.revenueSchedule?.(s,own.id)||[]).filter(x=>contractById.has(x.contractId));
    const historyRow=x=>{
      const contract=contractById.get(x.contractId),type=x.event==="payment"?'Parcela':x.event==="bonus"?'Bônus':'Registro contratual';
      const installment=x.event==="payment"?' · parcela '+esc(x.period)+'/'+esc(installmentTotal(contract)):'';
      const status=x.event==="registered"?'Registrado sem crédito':'Recebido';
      return '<p><b>'+esc(contract?.brandName||x.brandName||"Patrocinador")+'</b> · '+esc(contract?.brandCategory||"Categoria não informada")+' · '+careerDate(s,x.day)+' · '+type+installment+' · <b>'+money(x.amount||0)+'</b> · '+status+'</p>';
    };
    return css()+'<section class="cc-dark cc-market-screen"><header class="cc-market-screen-head"><small>CLUBE · FINANCEIRO · PATROCÍNIOS</small><h2>Patrocínios do clube</h2><p class="cc-note">'+esc(own.name)+' · propostas, contratos, pagamentos e metas comerciais persistidos nesta carreira.</p></header>'+
      '<section class="cc-card"><h3>Propostas aguardando resposta</h3>'+(pending.length?pending.map(proposalCard).join(""):'<p class="cc-note">Nenhuma proposta pendente.</p>')+'</section>'+
      '<section class="cc-card"><h3>Contratos ativos e encerrados</h3><div class="grid3">'+(contracts.length?contracts.map(contractCard).join(""):'<p class="cc-note">Nenhum contrato assinado.</p>')+'</div></section>'+
      '<section class="cc-card"><h3>Próximos pagamentos</h3>'+(schedule.length?schedule.slice(0,12).map(x=>{const contract=contractById.get(x.contractId);return '<p><b>'+esc(contract?.brandName||"Patrocinador")+'</b> · '+esc(contract?.brandCategory||"Categoria não informada")+' · '+careerDate(s,x.dueDay)+' · parcela '+esc(x.period)+'/'+esc(installmentTotal(contract))+' · <b>'+money(x.expectedAmount)+'</b> · Previsto</p>';}).join(""):'<p class="cc-note">Nenhuma parcela futura agendada.</p>')+'</section>'+
      '<section class="cc-card"><h3>Histórico de pagamentos e bônus</h3>'+(history.length?history.map(historyRow).join(""):'<p class="cc-note">Nenhum lançamento financeiro.</p>')+'</section>'+
      '<section class="cc-card"><h3>Propostas encerradas</h3>'+(concluded.length?concluded.map(proposalCard).join(""):'<p class="cc-note">Nenhuma proposta encerrada.</p>')+'</section></section>';
  }

  function settings(s){
    const difficulty=String(s.coachCareer?.settings?.marketStrictness||"normal");
    const marketDifficultyPanel='<section class="cc-card" aria-label="Rigor das negociações"><h4>Rigor das negociações</h4>'+
      '<p class="cc-note">Escolha o rigor das próximas sondagens e propostas. Acordos enviados e respostas já recebidas não são recalculados.</p>'+
      '<label>Negociações <select data-coach-market-difficulty>'+
      [['flexible','Flexível — negociações mais fáceis'],['normal','Normal — avaliação atual'],['strict','Rigoroso — maiores exigências']].map(([value,label])=>
        '<option value="'+value+'"'+(difficulty===value?' selected':'')+'>'+label+'</option>').join('')+
      '</select></label><button type="button" data-coach-market-difficulty-save>Aplicar rigor</button></section>';
    return '<section class="cc-card"><small>AJUSTES DA CARREIRA</small><h3>Configurações de transferências</h3><p class="cc-note">Estas opções são específicas deste save.</p></section>'+marketDifficultyPanel;
  }

  function render(s,D){
    const C=D?.CoachCareer||root.ProLifeCoachCareer;
    if(!C||s?.mode!=="coach")return `<section class="card"><h2>Carreira do Treinador</h2><p class="muted">Disponível apenas no modo treinador.</p></section>`;
    const sn=C.snapshot(s,D);
    const body=ui.tab==="central"?central(s,D,sn):ui.tab==="vestiario"?locker(sn):ui.tab==="treino"?(sn.hasClub?training(sn):`<section class="cc-card"><p class="muted">Assine com um clube para definir o treino.</p></section>`):ui.tab==="historico"?history(sn):ui.tab==="configuracoes"?settings(s):ui.tab==="negociacoes"?negotiations(s,D):ui.tab==="prejogo"?prematch(s,D,sn):(sn.hasClub?board(sn):`<section class="cc-card"><p class="muted">Você está sem clube. Aceite uma proposta na aba Propostas para voltar a trabalhar.</p></section>`);
    return `${css()}<section class="cc-dark"><h2>Carreira do Treinador</h2><small>${esc(sn.club?.name||"Sem clube")} · Temporada ${esc(s.season)} · Nacionalidade: ${esc(s.person?.nationality||"Brasil")} · Reputação ${esc(Math.round(sn.reputation||0))}</small>${tabs()}${body}</section>`;
  }

  function signingPresentation(entry,s){
    const money=n=>"R$ "+Math.round(Number(n)||0).toLocaleString("pt-BR");
    const prestige=Number(entry.overall||0)>=83||Number(entry.fee||0)>=30000000;
    const crest=id=>root.ProLifeClubCrests?.render?.(id,{size:"sm"})||"";
    const from=esc(entry.fromClubName||"Clube anterior"),to=esc(entry.toClubName||"Novo clube");
    // Reações nas redes: textos gerados pelo jogo (perfis fictícios), em maior número para contratações de destaque.
    const fee=Number(entry.fee||0),ovr=Number(entry.overall||0),name=esc(entry.playerName||"o reforço");
    const posts=[["@TorcidaViva","Chegou! "+name+" é nosso. Bem-vindo ao "+to+"!"],
      ["@FutebolHoje","Oficial: "+name+" ("+from+") é o novo reforço do "+to+(fee>0?" por "+money(fee):"")+"."]];
    if(prestige){posts.push(["@Bastidores","Contratação de peso: "+name+(ovr?" chega com GER "+ovr:"")+" e muda o patamar do elenco."],["@ArquibancadaFiel","Agora o campeonato fica interessante. Vem, "+name+"!"]);}
    else if(fee===0||entry.type==="loan")posts.push(["@MercadoDaBola",name+" chega "+(entry.type==="loan"?"por empréstimo":"sem custo")+" para dar opção ao treinador."]);
    const social='<section class="cc-social" aria-label="Reações nas redes"><small>REAÇÕES NAS REDES</small>'+posts.map(x=>'<p><b>'+esc(x[0])+'</b> '+x[1]+'</p>').join("")+'</section>';
    return '<article class="cc-card cc-signing" role="region" aria-label="Apresentação oficial do reforço">'+
      '<style>.cc-signing{background:radial-gradient(ellipse at 78% 10%,#294047,#0d1b25 65%);border-color:#bedb3a;padding:25px}.cc-signing h2{font-size:clamp(30px,5vw,64px);font-weight:900;letter-spacing:-.04em;margin:8px 0}.cc-signing .cc-signing-tag{font-size:12px;color:#d0f54a;font-weight:800;letter-spacing:.2em}.cc-signing .cc-signing-clubs{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:24px 0}.cc-signing .cc-signing-facts{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0}.cc-signing .cc-signing-facts span{background:#20313c;padding:12px;border-radius:8px}.cc-signing .cc-signing-actions{display:flex;gap:10px;flex-wrap:wrap}.cc-signing button{cursor:pointer}</style>'+
      '<div class="cc-signing-tag">'+(prestige?"APRESENTAÇÃO DE DESTAQUE":"CONTRATAÇÃO CONFIRMADA")+'</div>'+
      '<h2>'+esc(entry.playerName||"Novo reforço")+'</h2><p class="cc-note">'+(prestige?"Grande expectativa pela chegada do reforço.":"O elenco ganha uma nova opção para a temporada.")+'</p>'+
      '<div class="cc-signing-clubs">'+crest(entry.fromClubId)+'<b>'+from+'</b><span aria-hidden="true">→</span>'+crest(entry.toClubId)+'<b>'+to+'</b></div>'+
      '<div class="cc-signing-facts"><span>Valor: <b>'+money(entry.fee)+'</b></span><span>Posição: <b>'+esc(entry.position||"—")+'</b></span><span>GER: <b>'+esc(entry.overall??"—")+'</b></span><span>Idade: <b>'+esc(entry.age??"—")+'</b></span><span>Operação: <b>'+esc(entry.type==="loan"?"Empréstimo":entry.type==="purchase-option"?"Compra após empréstimo":"Definitiva")+'</b></span></div>'+
      social+
      '<p class="cc-note">O jogador já foi integrado ao elenco. Esta apresentação não realiza nova transferência ou pagamento.</p>'+
      '<div class="cc-signing-actions"><button type="button" data-coach-signing-done="'+esc(entry.id)+'">Continuar</button><button type="button" data-coach-signing-squad="'+esc(entry.id)+'">Ver no elenco</button><button type="button" data-coach-signing-history="'+esc(entry.id)+'">Ver histórico</button></div></article>';
  }
  function marketCss(){return "<style>.cc-player-actions{display:flex;flex-direction:column;gap:8px}.cc-action-primary{width:100%;padding:12px;font-weight:700}.cc-action-secondary{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cc-action-wait{margin:0;padding:10px;border:1px dashed var(--cc-warn);border-radius:8px;color:var(--cc-warn)}.cc-tension{margin:10px 0;padding:10px;border:1px solid var(--cc-line);border-radius:8px}.cc-tension-top{display:flex;justify-content:space-between}.cc-tension[data-level=Tensa] strong{color:var(--cc-warn)}.cc-tension[data-level=Crítica] strong{color:var(--cc-bad)}.cc-tension p{margin:6px 0 0;font-size:12px;color:var(--cc-muted)}.cc-exchange{margin:10px 0;padding:10px;border:1px solid var(--cc-line);border-radius:8px}.cc-exchange-list{display:grid;gap:4px;max-height:200px;overflow:auto}.cc-exchange-list label{display:flex;gap:6px;align-items:center;font-size:12px}.cc-deal-board{display:grid;grid-template-columns:1fr auto 1fr 1fr;gap:10px;margin:12px 0;align-items:stretch}.cc-deal-side{padding:12px;border:1px solid var(--cc-line);border-radius:10px;background:rgba(255,255,255,.03)}.cc-deal-side small{opacity:.7;letter-spacing:.1em}.cc-deal-side strong{display:block;margin:2px 0 8px}.cc-deal-side dl{margin:0;display:grid;gap:4px}.cc-deal-side dl div{display:flex;justify-content:space-between;gap:8px;font-size:12px}.cc-deal-side dt{color:var(--cc-muted)}.cc-deal-side dd{margin:0;font-weight:700;text-align:right}.cc-deal-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}.cc-deal-center span{font-size:26px}.cc-deal-total{grid-column:1/-1;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--cc-gold);border-radius:10px}.cc-deal-total strong{font-size:22px}.cc-deal-total small{color:var(--cc-muted)}@media(max-width:760px){.cc-deal-board{grid-template-columns:1fr}.cc-deal-center{flex-direction:row}}.cc-social{display:grid;gap:6px;margin:12px 0;padding:12px;border:1px solid var(--cc-line);border-radius:10px;background:rgba(255,255,255,.03)}.cc-social p{margin:0;font-size:13px}.cc-social b{color:var(--cc-gold)}.cc-deadline{border-color:#ff5a4f!important;margin-bottom:12px}.cc-deadline small{color:#ff8a80}.cc-deadline-list{margin:8px 0 0;padding-left:18px;font-size:13px}.cc-four-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.cc-four-card{display:flex;flex-direction:column;gap:3px;padding:10px;border:1px solid var(--cc-line);border-radius:8px;background:rgba(255,255,255,.03)}.cc-four-card small{font-size:10px}.cc-four-card strong{font-size:14px}.cc-four-card span{font-size:12px;color:var(--cc-muted)}.cc-inquiry-row .cc-status{display:block;margin-top:6px;font-size:12px}.cc-inquiry-row.is-pending .cc-status{color:var(--cc-warn)}.cc-inquiry-row.is-ok .cc-status{color:var(--cc-ok)}.cc-inquiry-row.is-no .cc-status{color:var(--cc-bad)}.cc-inquiry-row .cc-market-select-player{width:100%;text-align:left}.cc-window-badge[data-deadline=true]{border-color:#ff5a4f;animation:none}.cc-window-badge{display:inline-flex;align-items:center;gap:10px;margin-top:10px;padding:8px 14px 8px 12px;border-radius:999px;border:1px solid rgba(255,90,79,.5);background:rgba(255,90,79,.1)}.cc-window-badge i{width:10px;height:10px;border-radius:50%;background:#ff5a4f}.cc-window-badge strong{display:block;font-size:12px;letter-spacing:1.2px;color:#ff8a80}.cc-window-badge span{display:block;font-size:12px;color:#c7d6df}.cc-window-badge[data-open=true]{border-color:rgba(200,249,50,.6);background:rgba(200,249,50,.1)}.cc-window-badge[data-open=true] i{background:#c8f932;box-shadow:0 0 0 0 rgba(200,249,50,.6);animation:ccWin 2s infinite}.cc-window-badge[data-open=true] strong{color:#c8f932}@keyframes ccWin{70%{box-shadow:0 0 0 8px rgba(200,249,50,0)}100%{box-shadow:0 0 0 0 rgba(200,249,50,0)}}@media(prefers-reduced-motion:reduce){.cc-window-badge i{animation:none!important}}.cc-hub-panel{margin:12px 0;padding:14px;border:1px solid rgba(200,249,50,.28);border-radius:10px;background:linear-gradient(150deg,#0c2230,#071522)}.cc-hub-panel h4{margin:0 0 8px;font-size:11px;letter-spacing:1.2px;color:#c8f932}.cc-hub-interest-top{display:flex;align-items:baseline;gap:10px}.cc-hub-interest-top strong{font-size:34px;line-height:1;color:#fff}.cc-hub-interest-top span{font-weight:900;font-size:13px}.cc-hub-meter{height:8px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden;margin:8px 0}.cc-hub-meter i{display:block;height:100%;border-radius:6px;background:#c8f932}[data-tone=low] .cc-hub-meter i{background:#ff5a4f}[data-tone=low] .cc-hub-interest-top span{color:#ff8a80}[data-tone=mid] .cc-hub-meter i{background:#ffb020}[data-tone=mid] .cc-hub-interest-top span{color:#ffc454}[data-tone=high] .cc-hub-interest-top span{color:#c8f932}.cc-hub-interest p,.cc-hub-clause p{margin:4px 0 0;font-size:12px;color:#a6bbc6}.cc-hub-warn{color:#ffb4ac!important}.cc-hub-clause{display:grid;gap:8px}.cc-hub-clause small{display:block;color:#a6bbc6;font-size:11px}.cc-hub-clause strong{font-size:22px;color:#fff}.cc-hub-pay{min-height:44px;border:0;border-radius:8px;background:#c8f932;color:#10200a;font-weight:900;cursor:pointer}.cc-hub-pay:disabled{opacity:.45;cursor:not-allowed}.cc-signing-readiness{margin-top:18px;padding:15px;background:#182e3a;border:1px solid #3c5661;border-radius:8px}.cc-signing-readiness h4{margin:6px 0 12px}.cc-signing-peer{display:flex;align-items:center;justify-content:space-between;padding:10px 4px;border-bottom:1px solid #405660}.cc-signing-peer span{color:#e4eef1}.cc-signing-peer b{color:#d3fa37}</style>"+"<style>.cc-signing-detail{background:#142d39!important;border:1px solid #567447!important}.cc-signing-detail>small{color:#d3fa37!important}.cc-signing-detail h3{font-size:25px;margin:8px 0}.cc-signing-card button,.cc-signing-detail button{background:#d3fa37;color:#142734;padding:9px 13px;border:0;border-radius:6px;font-weight:800;cursor:pointer;margin-top:12px}.cc-signing-detail .cc-signing-stats{margin:18px 0}</style>"+"<style>.cc-signing-card{background:#172d39;border:1px solid #3d5963;border-radius:9px;margin:12px 0;padding:16px}.cc-signing-card-top{display:flex;justify-content:space-between;gap:16px}.cc-signing-card-top small,.cc-signing-page>small{color:#d3fa37!important}.cc-signing-card-top h4{font-size:20px;margin:6px 0;color:#fff}.cc-signing-card-top span{font-size:12px;color:#adc3cb}.cc-signing-card-top>strong{align-self:start;border:1px solid #d3fa37;color:#d3fa37;padding:6px 9px;font-size:10px;border-radius:5px}.cc-signing-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:16px}.cc-signing-stats>div{background:#1f3843;padding:12px;border-radius:5px}.cc-signing-stats small{display:block;font-size:10px;color:#afc3cc}.cc-signing-stats b{display:block;margin-top:6px;font-size:14px;color:#f3f9fa}@media(max-width:700px){.cc-signing-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.cc-signing-card-top{flex-direction:column}}</style>"+"<style>.cc-settlement-preview{background:#142c37!important;border:1px solid #597747!important}.cc-settlement-preview>small,.cc-signing-status>small{color:#d3fa37!important}.cc-settlement-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.cc-settlement-grid>div{display:flex;flex-direction:column;gap:6px;background:#1b3540;padding:12px;border-radius:6px}.cc-settlement-grid span,.cc-signing-entry span{color:#b6c9cf;font-size:11px}.cc-settlement-grid b{font-size:16px}.cc-signing-entry{display:flex;justify-content:space-between;gap:12px;padding:10px;border-bottom:1px solid #435762}@media(max-width:680px){.cc-settlement-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.cc-signing-entry{flex-direction:column}}</style>"+"<style>.cc-agent-contract{border-color:#536a55!important;background:#122936!important}.cc-agent-head{display:flex;flex-wrap:wrap;align-items:center;gap:9px 16px;margin-bottom:16px}.cc-agent-head small{width:100%;color:#d2f83a!important}.cc-agent-head h4{font-size:19px;margin:0;flex:1}.cc-agent-head>span{color:#d2f83a;border:1px solid #607843;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:800}.cc-agent-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:14px 0}.cc-agent-grid label{display:flex;flex-direction:column;gap:6px;color:#bbcbd0;font-size:12px}.cc-agent-grid input,.cc-agent-grid select{width:100%;min-width:0;box-sizing:border-box;padding:10px;background:#192f3c;color:#f3f8f9;border:1px solid #4a6570;border-radius:6px}.cc-agent-feedback{padding:12px 14px;margin:14px 0;background:#1c3540;border-left:3px solid #d3fa37}.cc-agent-feedback strong{font-size:12px;color:#d3fa37}.cc-agent-feedback p{font-size:13px;margin:6px 0}@media(max-width:650px){.cc-agent-grid{grid-template-columns:1fr}}</style>"+"<style>.cc-inbox-preferences{margin-top:20px}.cc-inbox-preferences>summary{cursor:pointer;font-size:15px;font-weight:800;color:#f3f7f8;list-style:disclosure-closed;padding:8px}.cc-inbox-preferences[open]>summary{margin-bottom:16px}.cc-inbox-preferences>summary span{display:block;color:#9fb4bf;font-size:11px;font-weight:400;margin-top:5px}.cc-inbox-preferences .cc-deal{display:grid;grid-template-columns:minmax(180px,1.2fr) minmax(180px,3fr) auto;gap:14px;align-items:center}.cc-inbox-preferences .cc-deal-player{min-width:0}.cc-inbox-preferences .cc-deal-player b{overflow-wrap:normal;word-break:normal}.cc-inbox-preferences .cc-deal select{width:100%;min-width:0}.cc-inbox-preferences .cc-deal button{min-width:96px;white-space:nowrap;word-break:keep-all}.cc-inbox-offer{border:1px solid #47616a;border-radius:9px;padding:16px!important;margin:12px 0;background:#172d3a}.cc-inbox-urgent{border-color:#b4d839;box-shadow:inset 4px 0 0 #d3fa37}.cc-inbox-urgent .cc-deal-terms b{color:#d3fa37;font-size:18px}.cc-inbox-offer .cc-deal-actions{flex-wrap:wrap}.cc-inbox-offer button{white-space:nowrap}@media(max-width:750px){.cc-inbox-preferences .cc-deal{grid-template-columns:1fr;gap:8px}.cc-inbox-preferences .cc-deal button{justify-self:start}.cc-inbox-offer{display:flex;flex-direction:column;align-items:stretch}}</style>"+"<style>.cc-neg-round{display:grid;grid-template-columns:90px 1fr;gap:12px;padding:12px;border:1px solid #38505d;border-radius:8px;background:#172c3a;margin:9px 0}.cc-neg-round>span{color:#d3fa37;font-weight:800;font-size:11px}.cc-neg-round strong{font-size:13px;color:#f0f7f9}.cc-neg-round p{color:#bac9d0;font-size:12px;margin:5px 0}.cc-neg-response-status{display:inline-block;padding:6px 9px;margin:8px;color:#d3fa37;border:1px solid #5a763d;border-radius:5px;font-weight:700;font-size:11px}@media(max-width:600px){.cc-neg-round{grid-template-columns:1fr}}</style>"+"<style>.cc-market-screen-nav{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 18px}.cc-market-screen-nav button{background:#182b38;border:1px solid #385260;padding:10px 13px;color:#dce7eb;cursor:pointer}.cc-market-screen-nav button[aria-pressed=\"true\"]{background:#d3fa37!important;color:#162732!important;border-color:#d3fa37!important;font-weight:800}.cc-market-screen-head{padding:15px 20px;background:#132631;border:1px solid #3a515c;border-radius:9px;margin-bottom:14px}.cc-market-screen-head h2{margin:4px 0;font-size:24px;color:#f8fbfc}.cc-market-screen-head small{color:#d3fa37;font-size:10px}.cc-market-screen-head p{margin-bottom:0}</style>"+"<style>.cc-target-hub{background:#102331!important;border:1px solid #38505e!important}.cc-target-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.cc-target-heading h3{margin:6px 0;font-size:24px;color:#fff}.cc-target-heading>b{color:#d2f83a;font-size:13px}.cc-target-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 10px;border-bottom:1px solid #354d59;background:#152b38;margin:7px 0}.cc-target-row>div:first-child{display:flex;flex-direction:column;gap:5px}.cc-target-row small{color:#d3f939;font-size:10px}.cc-target-row strong{color:#f5fafb}.cc-target-row span{color:#aebfc8;font-size:11px}.cc-target-actions{display:flex;gap:8px}.cc-target-actions button{border:1px solid #657b84;background:#213c49;color:#f2f6f8;padding:9px;border-radius:5px;cursor:pointer}.cc-target-actions button:first-child{background:#d3fa37;color:#132631;font-weight:800}@media(max-width:650px){.cc-target-row{flex-direction:column;align-items:stretch}.cc-target-heading{flex-direction:column;align-items:flex-start}}</style>"+"<style>.cc-scout-mission-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:18px}.cc-scout-mission-top h3{font-size:24px;color:#f4f8fa;margin:5px 0}.cc-scout-mission-counters{display:flex;gap:10px}.cc-scout-mission-counters>div{min-width:92px;background:#1a3440;border:1px solid #34505c;border-radius:7px;padding:11px;text-align:center}.cc-scout-mission-counters b{display:block;font-size:25px;color:#d3fa37}.cc-scout-mission-counters span{font-size:9px;color:#b8cbd2}.cc-scout-mission{padding:13px 15px;margin:10px 0;background:#152b39;border:1px solid #36505d;border-radius:8px}.cc-scout-mission-heading,.cc-scout-mission-data,.cc-scout-mission-footer{display:flex;justify-content:space-between;gap:12px;align-items:center}.cc-scout-mission-heading b{font-size:15px;color:#f4f9fa}.cc-scout-mission-heading small{display:block;margin-top:5px;color:#b1c3cc;font-size:10px}.cc-scout-mission-heading strong{font-size:11px;color:#d3fa37}.cc-scout-mission-heading strong.done{color:#a7e0cc}.cc-scout-mission-data{font-size:11px;margin:12px 0;color:#d1dee4}.cc-scout-mission-footer{font-size:10px;color:#a9bec7}@media(max-width:640px){.cc-scout-mission-top,.cc-scout-mission-heading,.cc-scout-mission-data,.cc-scout-mission-footer{align-items:flex-start;flex-direction:column}.cc-scout-mission-counters{width:100%}.cc-scout-mission-counters>div{flex:1}}</style>"+"<style>.cc-scout-report-state{font-size:12px!important;font-weight:800;color:#d3fa37!important}.cc-scout-progress{height:7px;border-radius:8px;background:#304653;overflow:hidden;margin:10px 0}.cc-scout-progress i{display:block;height:100%;background:#d3fa37}.cc-scout-report p{font-size:11px;color:#b6c4ce}</style>"+"<style>.cc-market-detail-section{margin-top:15px;padding-top:12px;border-top:1px solid #344b59}.cc-market-detail-section h4{margin:0 0 12px;color:#d3fa37;font-size:11px;letter-spacing:.1em}.cc-market-detail-section p{font-size:11px;color:#a9bbc6}.cc-market-attr{display:grid;grid-template-columns:minmax(0,1fr) 34px;gap:5px 10px;margin:8px 0;font-size:11px;text-transform:capitalize}.cc-market-attr b{text-align:right;color:#d3fa37}.cc-market-attr i{height:4px;background:#304956;grid-column:1/-1;border-radius:5px;overflow:hidden}.cc-market-attr em{display:block;height:100%;background:#c9f23c}</style>"+"<style>.cc-market-detail-actions{display:grid;gap:9px;margin-top:16px}.cc-market-detail-actions button{padding:11px 8px;border:1px solid #5c7480;border-radius:5px;background:#1b3544;color:#f4f9fc;font-weight:800;cursor:pointer}.cc-market-detail-actions button:first-child{background:#d3fa37;border-color:#d3fa37;color:#0b1923}.cc-market-detail-actions button:disabled{opacity:.5;cursor:not-allowed}.cc-market-detail-actions p{font-size:12px;color:#c1ccd0}</style>"+"<style>.cc-market-search-layout{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:14px;align-items:start}.cc-market-results{min-width:0}.cc-market-player-detail{position:sticky;top:15px;background:#142635;border:1px solid #405968;border-radius:9px;padding:17px;color:#eaf1f5;min-height:390px}.cc-market-detail-portrait{text-align:center;border-bottom:1px solid #3d5361;padding-bottom:15px}.cc-market-detail-portrait h3{font-size:23px;margin:8px 0;color:#fff}.cc-market-detail-portrait small{color:#d1fa37;letter-spacing:.12em}.cc-market-portrait-placeholder{display:grid;place-items:center;margin:4px auto 12px;width:92px;height:108px;font-size:43px;background:linear-gradient(145deg,#294454,#0b1724);border:1px solid #425766;border-radius:8px}.cc-market-player-overall{display:flex;align-items:center;justify-content:space-around;gap:6px;margin:15px 0;color:#c6d0d6}.cc-market-player-overall strong{font-size:24px;color:#d3fb37}.cc-market-player-overall span{font-size:9px;max-width:75px}.cc-market-player-fields div{display:flex;justify-content:space-between;border-bottom:1px solid #344957;padding:9px 0;gap:8px}.cc-market-player-fields dt{color:#9fb2bf;font-size:11px}.cc-market-player-fields dd{color:#eef4f5;font-size:11px;font-weight:750;text-align:right}.cc-market-detail-note{color:#9fb2bf;font-size:11px}.cc-fc27-result .cc-market-select-player{display:flex;grid-column:1/3;background:transparent;border:0;color:inherit;align-items:center;justify-content:space-between;text-align:left;gap:12px;cursor:pointer;width:100%;min-width:0}.cc-fc27-result .cc-market-select-player:hover{color:#d5fb3e}.cc-fc27-result.is-selected{box-shadow:inset 3px 0 #d4fb38;background:#243a44}.cc-fc27-result .cc-deal-actions{grid-column:3}.cc-market-select-player .cc-deal-team{min-width:95px}@media(max-width:1100px){.cc-market-search-layout{grid-template-columns:minmax(0,1fr) 255px}.cc-fc27-result .cc-market-select-player{grid-column:1/-1}.cc-fc27-result .cc-deal-actions{grid-column:1/-1}}@media(max-width:760px){.cc-market-search-layout{grid-template-columns:1fr}.cc-market-player-detail{position:static;grid-row:1;min-height:auto}.cc-market-player-fields{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}}</style>"+"<style>\n.cc-fc27-scout{background:#0a1825!important;border:1px solid #324554!important;padding:20px!important}\n.cc-fc27-scout-head{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:18px 20px;background:linear-gradient(100deg,#192d3a,#0c1925);border-left:4px solid #d3fa37;margin-bottom:20px}\n.cc-fc27-scout-head small,.cc-fc27-results-head b{letter-spacing:.14em;font-size:10px;color:#d3fa37;font-weight:800}\n.cc-fc27-scout-head h2{font-size:27px;margin:7px 0;color:white;text-transform:uppercase;font-style:italic}\n.cc-fc27-scout-head p{color:#abbec8;font-size:12px}\n.cc-fc27-scout-count{display:grid;text-align:right}.cc-fc27-scout-count strong{font-size:30px;color:#d3fa37}.cc-fc27-scout-count span{font-size:10px;color:#aabdc7}\n.cc-fc27-filter-area{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:18px;background:#142735;border:1px solid #344958;border-radius:8px;margin-bottom:20px}\n.cc-fc27-filter-area>h3,.cc-fc27-filter-area>.cc-note{grid-column:1/-1;margin:0}\n.cc-fc27-filter-area label{min-width:0;font-size:11px;color:#b9cbd4}\n.cc-fc27-filter-area input,.cc-fc27-filter-area select{width:100%;max-width:100%;min-height:38px;background:#0a1a28;color:#f4f8f9;border:1px solid #425967;border-radius:4px}\n.cc-fc27-filter-area .cc-scout-filters{display:contents}\n.cc-fc27-filter-area>.cc-deal-actions{grid-column:1/-1}\n.cc-fc27-filter-area>.cc-deal-actions button{background:#d3fa37;color:#10202a;font-weight:900}\n.cc-fc27-results-head{display:flex;justify-content:space-between;gap:10px;padding:12px 4px;border-bottom:1px solid #4a5d66}.cc-fc27-results-head span{color:#99abb5;font-size:11px}\n.cc-fc27-result{display:grid!important;grid-template-columns:minmax(200px,1.4fr) minmax(120px,1fr) minmax(280px,1.9fr);align-items:center;gap:14px;padding:13px 12px!important;border-bottom:1px solid #344957;background:#112332}\n.cc-fc27-result:nth-of-type(2n){background:#152b38}\n.cc-fc27-player{display:flex!important;align-items:center;gap:11px}\n.cc-fc27-ger{display:grid;place-items:center;flex-shrink:0;width:43px;height:43px;border:1px solid #a6c83c;border-radius:7px;color:#d5ff3d;background:#263b35;font-size:20px;font-weight:900}\n.cc-fc27-result .cc-deal-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}\n.cc-fc27-result .cc-deal-actions button{padding:9px!important;font-size:10px}\n.cc-fc27-reports{margin-top:18px!important;background:#102431!important}\n@media(max-width:1020px){.cc-fc27-filter-area{grid-template-columns:repeat(2,minmax(0,1fr))}.cc-fc27-result{grid-template-columns:1fr 1fr}.cc-fc27-result .cc-deal-actions{grid-column:1/-1;justify-content:flex-start}}\n@media(max-width:620px){.cc-fc27-filter-area{grid-template-columns:1fr}.cc-fc27-result{grid-template-columns:1fr}.cc-fc27-result .cc-deal-actions{grid-column:1}.cc-fc27-scout-head h2{font-size:20px}}\n</style>"+'<style>.cc-market-pages{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin:15px 0;padding:12px;background:#112a34;border-radius:7px;color:#d3e6e8;font-size:12px}.cc-market-pages div{display:flex;gap:8px}.cc-market-pages button{background:#213b48;color:#e9f4f7;border:1px solid #56727e;border-radius:6px;padding:8px 13px}.cc-market-pages button:disabled{opacity:.4}.cc-market-entry{margin:16px 0;padding:18px;background:#0b1c28;border:1px solid #3b5762;border-radius:12px}.cc-market-entry-title h3{margin:6px 0;font-size:21px}.cc-market-entry-title p{color:#b4c7cc;font-size:12px}.cc-market-entry-title small{color:#d6fc43;font-weight:800;letter-spacing:.1em}.cc-market-entry-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.cc-market-entry-grid button{display:grid;gap:9px;text-align:left;background:#162d39;color:#edf4f4;border:1px solid #57717b;border-radius:9px;padding:16px;cursor:pointer}.cc-market-entry-grid button[aria-pressed="true"]{border:2px solid #d6fc43;background:#203846}.cc-market-entry-grid button b{font-size:15px;letter-spacing:.07em}.cc-market-entry-grid button span,.cc-market-entry-grid button small{font-size:12px;color:#c2d3d5;line-height:1.5}.cc-market-entry-grid button small{color:#d6fc43}.cc-market-entry-grid button:focus-visible{outline:2px solid #d6fc43;outline-offset:3px}@media(max-width:620px){.cc-market-entry-grid{grid-template-columns:1fr}}.cc-inquiry-feedback{flex:1 1 100%;display:grid;gap:5px;padding:11px;border:1px solid #60737b;border-left:3px solid #d7ef5b;border-radius:6px;color:#e8eef0;font-size:12px}.cc-inquiry-feedback small{color:#bcc9ce}.cc-inquiry-feedback strong{font-size:13px}.cc-market-overview{padding:16px;border:1px solid #38535f;border-radius:10px;margin:16px 0;background:#102630}.cc-market-overview-heading{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}.cc-market-overview-heading h3{margin:4px 0}.cc-market-overview-heading p{font-size:12px;color:#bac8cb}.cc-market-overview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}.cc-market-overview-card{display:grid;gap:6px;text-align:left;background:#172f39;border:1px solid #43616a;border-radius:8px;padding:14px;color:#eff6f7;cursor:pointer}.cc-market-overview-card:hover,.cc-market-overview-card:focus-visible{border-color:#d7ef5b;outline-offset:2px}.cc-market-overview-card strong{font-size:27px;color:#d7ef5b}.cc-market-overview-card small,.cc-market-overview-card span{font-size:11px;color:#c0cfd0}@media(max-width:850px){.cc-market-overview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){.cc-market-overview-grid{grid-template-columns:1fr}}.cc-market-presets{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.cc-market-presets p{width:100%}.cc-market-presets button{background:#23434d;color:#eaffb7;border:1px solid #96b37a;border-radius:7px;padding:9px 12px;cursor:pointer}.cc-market-presets button:focus-visible{outline:2px solid #eaffb7;outline-offset:2px}.cc-market-response{border-left:3px solid #d7ef5b;background:#10242d;padding:12px 16px;margin:12px 0}.cc-market-response p{margin:5px 0 0}.cc-market-screen{background:linear-gradient(135deg,#101c28,#193440);min-height:80vh}.cc-market-heading{border-left:4px solid #d7ef5b;padding:8px 17px;margin-bottom:20px}.cc-market-screen .cc-card{background:#172b36;border:1px solid #38535f;border-radius:12px}.cc-market-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.cc-market-steps span,.cc-market-budget b{background:#10232d;border:1px solid #59717d;border-radius:8px;padding:12px;font-size:12px}.cc-market-steps span:nth-child(2){border-color:#d7ef5b}.cc-market-budget{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}@media(max-width:620px){.cc-market-steps{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>';}
  function renderMarket(s,D){
    if(s?.mode!=="coach")return '<section class="card"><h2>Transferências</h2><p class="muted">Disponível na carreira de treinador.</p></section>';
    root.ProLifePlayerEconomy?.ensureState?.(s);
    const own=D?.club?.(s,s.clubId);
    const balance=Number(own?.budget);
    const budget=Number.isFinite(balance)?"R$ "+Math.round(balance).toLocaleString("pt-BR"):"Não informado";
    const pending=(s.coachCareer?.presentations||[]).filter(x=>!x.presented&&x.toClubId===s.clubId);
    const current=pending[0]||null;
    const presented=(s.coachCareer?.presentations||[]).filter(x=>x.presented&&x.toClubId===s.clubId).slice(-5).reverse();
    const intro=current?signingPresentation(current,s):'<div class="cc-card"><small>ÚLTIMOS REFORÇOS</small><p class="cc-note">'+(presented.length?presented.map(x=>esc(x.playerName)).join(" · "):"Nenhum reforço apresentado nesta carreira.")+'</p></div>';
    const career=s.coachCareer||{};
    const inquiries=(career.inquiries||[]).filter(x=>x.status==="pending"||(["accepted","asking_price"].includes(x.status)&&Number(x.expiresDay)>=Number(s.day))).length;
    const offers=(career.negotiations||career.deals||[]).filter(x=>x.status==="awaiting_window"||(x.status==="pending"&&(!Number.isFinite(Number(x.expiresDay))||Number(x.expiresDay)>=Number(s.day)))).length;
    const observation=(career.shortlist||[]).length;
    const navigation='<section class="cc-market-entry" aria-label="Acesso rápido ao mercado"><div class="cc-market-entry-title"><small>PAINEL DO DIRETOR ESPORTIVO</small><h3>Central de Transferências</h3><p>Gestão do elenco, observação e negociações sem caminhos duplicados.</p></div><nav class="cc-market-main-nav" aria-label="Áreas do mercado">'+
      [["overview","Painel"],["observacao","Scouting"],["transferencias","Transferências"],["lists","Listas"],["squad","Elenco"]].map(([id,label])=>'<button type="button" data-coach-market-area="'+id+'" aria-pressed="'+(ui.marketArea===id)+'">'+label+'</button>').join("")+'</nav></section>';
    const win=D?.Career?.windowStatus?.(s)||null;
    const windowBadge=win?'<div class="cc-window-badge" data-deadline="'+(win.open&&Number(win.remaining)<=1?"true":"false")+'" data-open="'+(win.open?"true":"false")+'" role="status"><i aria-hidden="true"></i><div><strong>'+(win.open?(Number(win.remaining)<=1?"DEADLINE DAY · ÚLTIMO DIA":"JANELA ABERTA"):"JANELA FECHADA")+'</strong><span>'+(win.open?esc(win.name)+" · "+esc(win.remaining)+" dia(s) restante(s)":"Abre em "+esc(win.remaining)+" dia(s)"+(win.next?" · "+esc(win.next):""))+'</span></div></div>':"";
    const marketContent=negotiations(s,D);
    if(ui.scoutScreen==="perfil")return css()+marketCss()+'<section class="cc-dark cc-market-screen cc-market-profile-screen">'+marketContent+'</section>';
    return css()+marketCss()+'<section class="cc-dark cc-market-screen"><div class="cc-market-heading"><small>CENTRAL DE TRANSFERÊNCIAS</small><h2>Mercado de jogadores</h2><p class="cc-note">'+esc(own?.name||"Sem clube")+' · Temporada '+esc(s.season)+' · Orçamento '+esc(budget)+'</p>'+windowBadge+'</div>'+intro+navigation+marketContent+'</section>';
  }

  const api={render,renderMarket,renderSponsorships,state:ui,esc,setTab:id=>{if(TABS.some(x=>x[0]===id))ui.tab=id;},openSigning:id=>{ui.selectedSigning=String(id);ui.dealTab="reforcos";},closeSigning:()=>{ui.selectedSigning=null;},setDealTab:id=>{if(["lista","recebidas","propostas","emprestimos","financeiro","contratos","clausulas","historico","reforcos"].includes(id))ui.dealTab=id;},openDeal:id=>{ui.selectedDeal=id;ui.dealTab="propostas";},startOffer:(clubId,playerId,suggestedOffer)=>{ui.draftOffer={clubId,playerId,suggestedOffer};ui.selectedDeal=null;ui.dealTab="propostas";ui.marketArea="transferencias";},clearOffer:()=>{ui.draftOffer=null;},closeDeal:()=>{ui.selectedDeal=null;},setMarketArea:id=>{if(["overview","observacao","squad","transferencias","lists"].includes(id))ui.marketArea=id;},setListScreen:id=>{if(["alvos","sondagens","saidas"].includes(id)){ui.listScreen=id;ui.marketArea="lists";}},selectScoutPlayer:id=>{ui.selectedScoutPlayer=String(id);if(ui.marketArea!=="lists"&&ui.scoutScreen!=="sondagens")ui.scoutScreen="busca";},setScoutScreen:id=>{if(["busca","alvos","sondagens","olheiros","recomendacoes"].includes(id))ui.scoutScreen=id;},setScoutPage:direction=>{ui.scoutPage=Math.max(0,ui.scoutPage+(direction==="next"?1:-1));},setScoutFilters:(query,pos,filters={})=>{ui.scoutPage=0;ui.scoutQuery=String(query||"").slice(0,80);ui.scoutPosition=["all","GOL","ZAG","LD","LE","LAT","VOL","MC","MD","ME","MEI","PD","PE","ATA"].includes(pos)?pos:"all";ui.scoutRegion=["all","Brasil","América do Sul","Europa","África","Ásia","América do Norte"].includes(filters.region)?filters.region:"all";ui.scoutClub=String(filters.club||"").slice(0,100);ui.scoutCompetition=String(filters.competition||"").slice(0,100);ui.scoutCountry=String(filters.country||"all");ui.scoutAge=["all","under18","under21","under23","23to29","30plus"].includes(filters.age)?filters.age:"all";const range=(value,min,max)=>{const number=Number(value);return Number.isInteger(number)&&number>=min&&number<=max?String(number):"all";};ui.scoutAgeMin=range(filters.ageMin,15,50);ui.scoutAgeMax=range(filters.ageMax,15,50);ui.scoutOverallMin=range(filters.overallMin,1,99);ui.scoutOverallMax=range(filters.overallMax,1,99);ui.scoutPotentialMin=range(filters.potentialMin,1,99);ui.scoutPotentialMax=range(filters.potentialMax,1,99);if(ui.scoutAgeMin!=="all"&&ui.scoutAgeMax!=="all"&&Number(ui.scoutAgeMin)>Number(ui.scoutAgeMax))[ui.scoutAgeMin,ui.scoutAgeMax]=[ui.scoutAgeMax,ui.scoutAgeMin];if(ui.scoutOverallMin!=="all"&&ui.scoutOverallMax!=="all"&&Number(ui.scoutOverallMin)>Number(ui.scoutOverallMax))[ui.scoutOverallMin,ui.scoutOverallMax]=[ui.scoutOverallMax,ui.scoutOverallMin];if(ui.scoutPotentialMin!=="all"&&ui.scoutPotentialMax!=="all"&&Number(ui.scoutPotentialMin)>Number(ui.scoutPotentialMax))[ui.scoutPotentialMin,ui.scoutPotentialMax]=[ui.scoutPotentialMax,ui.scoutPotentialMin];ui.scoutSort=["overall","potential","age"].includes(filters.sort)?filters.sort:"overall";ui.scoutSortDirection=["asc","desc"].includes(filters.sortDirection)?filters.sortDirection:"desc";ui.scoutCategory=["all","promises","free","listed"].includes(filters.category)?filters.category:"all";}};
  api.selectScoutPlayer=(id,dedicated=false)=>{
    ui.selectedScoutPlayer=String(id);
    if(dedicated){
      ui.scoutReturnScreen=ui.scoutScreen==="perfil"?ui.scoutReturnScreen:ui.scoutScreen;
      ui.scoutScreen="perfil";
    }else if(ui.marketArea!=="lists"&&ui.scoutScreen!=="sondagens")ui.scoutScreen="busca";
  };
  api.closeScoutPlayer=()=>{
    ui.scoutScreen=["busca","alvos","sondagens","olheiros","recomendacoes"].includes(ui.scoutReturnScreen)?ui.scoutReturnScreen:"busca";
  };
  root.ProLifeCoachCareerView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
