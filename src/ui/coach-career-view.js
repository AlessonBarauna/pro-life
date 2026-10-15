(function coachCareerViewModule(root){
  "use strict";
  // Stage 34F.24 - tela "Carreira do Treinador": diretoria, vestiario, capitao, treino coletivo e historico.
  // Renderiza a partir de ProLifeCoachCareer.snapshot; os botoes usam data-coach-* e o app.js despacha command().

  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
  const ui={tab:"central",dealTab:"propostas",selectedDeal:null,marketArea:"transferencias",scoutQuery:"",scoutPosition:"all"};
  const TABS=[["central","Central"],["diretoria","Diretoria"],["vestiario","Vestiário"],["treino","Treino coletivo"],["prejogo","Pré-jogo"],["negociacoes","Negociações"],["historico","Histórico"]];
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
    // Market panels are read from the same save used by the existing transfer engine.
    if(ui.marketArea==="observacao"){
      const gf=D?.GlobalFootball||root.ProLifeGlobalFootball;
      const clubs=[...(s.clubs||[]),...(s.globalFootball?.clubs||[])];
      const clubIndex=new Map(clubs.map(cl=>[cl.id,cl]));
      const needle=ui.scoutQuery.trim().toLocaleLowerCase("pt-BR");
      // International athletes are stored in internationalPlayers, not global clubs' rosters.
      const pool=gf?.activePlayers?.(s)||[...clubs.flatMap(cl=>cl.roster||[]),...(s.internationalPlayers||[])];
      const seen=new Set(),candidates=[];
      for(const p of pool){
        if(!p?.id||p.id==="hero"||seen.has(p.id)||p.active===false||p.status==="retired")continue;
        seen.add(p.id);
        if(!p.clubId||p.clubId===s.clubId)continue;
        if(needle&&!String(p.name||"").toLocaleLowerCase("pt-BR").includes(needle))continue;
        if(ui.scoutPosition!=="all"&&!String(p.pos||p.position||"").toUpperCase().includes(ui.scoutPosition))continue;
        const cl=clubIndex.get(p.clubId)||gf?.clubById?.(s,p.clubId);
        if(!cl||cl.active===false)continue;
        candidates.push({p,cl});
        if(candidates.length>=80)break;
      }
      const scouting=root.ProLifeCoachScoutingV2;
      const missions=Array.isArray(c.scoutingV2?.missions)?c.scoutingV2.missions:[];
      const playerLookup=new Map(pool.filter(p=>p?.id!=null).map(p=>[String(p.id),p]));
      const missionRows=missions.slice().reverse().slice(0,15).map(m=>{
        const p=playerLookup.get(String(m.playerId));
        const info=scouting?.report?.(s,m.id,p)||null;
        const percent=Math.round(Math.max(0,Math.min(1,Number(m.progress)||0))*100);
        const name=esc(p?.name||m.playerId);
        const stage=esc(m.status==="complete"?"Concluida":"Em andamento");
        const range=info?.available?'GER estimado '+info.estimatedOverall.join("–")+' · Potencial '+info.potentialRange.join("–"):'Jogador ainda nao encontrado neste save';
        return '<article class="cc-deal"><div class="cc-deal-player"><strong>'+name+'</strong><small>'+esc(m.region||"Regiao nao informada")+' · '+stage+'</small></div><div class="cc-deal-team"><span>'+percent+'% · '+esc(range)+'</span></div></article>';
      }).join("");
      const missionPanel='<section class="cc-card"><small>REDE DE OBSERVACAO - T2</small><h3>Missoes e relatorios</h3><p class="cc-note">A qualidade das estimativas melhora com os dias de observacao. Missoes sao registradas no save do treinador.</p>'+(missionRows||'<p class="cc-note">Nenhuma missao cadastrada.</p>')+'</section>';
      const shortlist=c.shortlist||[];
      const rows=candidates.map(({p,cl})=>{
        const overall=p.overall??p.ovr??D?.overall?.(p);
        const saved=shortlist.some(x=>x.playerId===p.id&&x.clubId===cl.id);
        return '<article class="cc-deal"><div class="cc-deal-player"><strong>'+esc(p.name||"Atleta")+'</strong><small>'+esc([p.pos||p.position,Number.isFinite(Number(overall))?"GER "+Math.round(Number(overall)):null,p.age?"Idade "+p.age:null].filter(Boolean).join(" · "))+'</small></div><div class="cc-deal-team">'+(root.ProLifeClubCrests?.render?.(cl.id,{size:"sm"})||"")+'<span>'+esc(cl.name||cl.id)+'</span></div><div class="cc-deal-actions"><button type="button" data-coach-shortlist="'+esc(cl.id)+'" data-coach-player="'+esc(p.id)+'">'+(saved?"Remover da lista":"Adicionar à lista")+'</button><button type="button" data-coach-start-scout="'+esc(p.id)+'" data-coach-region="'+esc(cl.leagueId||cl.country||"Brasil")+'">Observar atleta</button><button type="button" data-coach-scout-offer="'+esc(cl.id)+'" data-coach-player="'+esc(p.id)+'">Iniciar negociação</button></div></article>';
      }).join("");
      return '<nav class="cc-deal-nav" aria-label="Áreas do mercado"><button type="button" data-coach-market-area="observacao" aria-current="page">Observação</button><button type="button" data-coach-market-area="transferencias">Transferências</button></nav><section class="cc-card"><h3>Observação e busca de jogadores</h3><p class="cc-note">Resultados do catálogo dos clubes carregados neste save. Acompanhamento persistido na carreira do treinador.</p><label>Duração da observação <select data-coach-scout-duration><option value="7">7 dias</option><option value="14" selected>14 dias</option><option value="28">28 dias</option></select></label><p class="cc-note">Custo padrão: R$ 0 nesta etapa experimental. Missões duram dias da carreira.</p><label>Nome do atleta <input data-coach-scout-search placeholder="Buscar jogador..." value="'+esc(ui.scoutQuery)+'"></label><label>Posição <select data-coach-scout-position><option value="all"'+(ui.scoutPosition==="all"?" selected":"")+'>Todas</option>'+["GOL","ZAG","LAT","VOL","MEI","ATA"].map(v=>'<option value="'+v+'"'+(ui.scoutPosition===v?" selected":"")+'>'+v+'</option>').join("")+'</select></label><div class="cc-deal-actions"><button data-coach-scout-apply type="button">Pesquisar</button></div>'+(rows||'<p class="cc-note">Nenhum atleta encontrado.</p>')+'</section>'+missionPanel;
    }
    const money=v=>"R$ "+Math.round(Number(v)||0).toLocaleString("pt-BR");
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
      const facts=[p.pos||p.position,Number.isFinite(Number(overall))?'GER '+Math.round(Number(overall)):null,Number.isFinite(Number(p.age))?'Idade '+p.age:null,p.nationality||p.nation].filter(Boolean).join(' · ');
      return '<strong>'+esc(p.name||id)+'</strong><small>'+esc(facts)+'</small>';
    };
    const pending=(c.negotiations||[]).filter(n=>n.status==="pending"||n.status==="awaiting_window");
    const sales=(c.saleOffers||[]).filter(o=>o.status==="pending"||o.status==="awaiting_window");
    const loans=(c.loans||[]).filter(l=>!l.returned);
    const debts=(c.transferDebts||[]).filter(d=>!d.paid);
    const clauses=(c.sellOnClauses||[]).filter(x=>x.active);
    const negotiationHistory=(c.negotiations||[]).filter(n=>n.status!=="pending"&&n.status!=="awaiting_window");
    const saleHistory=(c.saleOffers||[]).filter(o=>o.status!=="pending"&&o.status!=="awaiting_window");
    const paid=(c.transferDebts||[]).filter(d=>d.paid);
    const finishedLoans=(c.loans||[]).filter(l=>l.returned);
    const transactions=(D?.Career?.init?.(s)?.transfers||[]).filter(x=>x&&x.day!==undefined);
    const tabs=[["lista","Lista de observação",(c.shortlist||[]).length],["recebidas","Recebidas",sales.length],["propostas","Propostas",pending.length],["emprestimos","Empréstimos",loans.length],["financeiro","Finanças",debts.length],["contratos",(D?.club?.(s,s.clubId)?.roster||[]).length],["clausulas","Cláusulas",clauses.length],["historico","Histórico",negotiationHistory.length+paid.length+finishedLoans.length]];
    if(!tabs.some(x=>x[0]===ui.dealTab))ui.dealTab="propostas";
    const wrap=(items,fn,empty)=>items.length?items.map(fn).join(""):'<p class="cc-note">'+esc(empty)+'</p>';
    const selected=pending.find(n=>n.id===ui.selectedDeal)||null;
    const dealStage=n=>n.status==="awaiting_window"?"Acordo fechado · aguardando janela":n.response==="accepted"?"Clube aceitou · revisar condições":(n.round||1)>=3?"Rodada final · decisão necessária":"Negociação com o clube · rodada "+(n.round||1)+"/3";
    const budget=Number(D?.club?.(s,s.clubId)?.budget);
    const fee=Number(selected?.finalFee);
    const steps=selected?'<div class="cc-market-steps" aria-label="Etapas da negociação"><span>01 · Proposta</span><span>02 · Resposta</span><span>03 · Decisão</span><span>04 · Transferência</span></div>':'';
    const budgetPreview=selected&&Number.isFinite(budget)&&Number.isFinite(fee)?'<div class="cc-market-budget"><b>Orçamento '+esc(money(budget))+'</b><b>Oferta '+esc(money(fee))+'</b><b>Saldo à vista '+esc(money(budget-fee))+'</b></div><p class="cc-note">Projeção antes de concluir: não altera o orçamento.</p>':'';
    const detail=selected?'<section class="cc-card cc-neg-dialog" aria-label="Mesa de negociação"><h3>Negociação individual · rodada '+esc(selected.round||1)+'/3</h3>'+steps+budgetPreview+'<p class="cc-note"><strong>Etapa atual:</strong> '+esc(dealStage(selected))+' · Próxima ação: revisar valor, pagamento ou encerrar a proposta.</p><div class="cc-deal-player">'+athlete(selected.playerId)+'</div><p>'+team(selected.sellerClubId)+' → '+team(selected.buyerClubId)+'</p><div class="cc-strip"><div><b>'+esc(money(selected.requested))+'</b><span>Última oferta</span></div><div><b>'+esc(money(selected.finalFee))+'</b><span>'+((selected.response==="accepted")?"Clube aceitou":"Contraproposta do clube")+'</span></div><div><b>Dia '+esc(selected.expiresDay)+'</b><span>Validade</span></div></div><div class="cc-neg-history"><h4>Rodadas da negociação</h4>'+((selected.history||[]).length?selected.history.map(h=>'<p class="cc-note">Rodada '+esc(h.round)+' · Oferta '+esc(money(h.offered))+' · '+(h.accepted?'Aceita':'Clube pede '+esc(money(h.response)))+'</p>').join(""):'<p class="cc-note">Proposta original: '+esc(money(selected.requested))+'</p>')+'</div>'+((selected.round||1)<3?'<label class="cc-neg-offer">Nova oferta (R$)<input type="number" min="1000" max="100000000000" step="1000" value="'+esc(Math.round(selected.finalFee||0))+'" data-coach-deal-offer="'+esc(selected.id)+'"></label><button type="button" data-coach-deal-revise="'+esc(selected.id)+'">Enviar nova oferta</button>':'<p class="cc-note">Limite de três rodadas atingido.</p>')+'<label class="cc-neg-offer">Condição de pagamento<select data-coach-deal-plan="'+esc(selected.id)+'"><option value="upfront">À vista</option>'+(s.coachCareer?.settings?.installments==="on"?'<option value="split">50% agora e 50% em 180 dias</option>':'')+'</select></label><p class="cc-note">A conclusão valida orçamento, jogador e prazo antes de movimentar o dinheiro.</p><div class="cc-deal-actions"><button type="button" data-coach-deal-accept="'+esc(selected.id)+'">Concluir contratação</button><button type="button" data-coach-deal-reject="'+esc(selected.id)+'">Recusar proposta</button><button type="button" data-coach-deal-close="1">Voltar à lista</button></div></section>':'';
    // FC27-inspired activity queue: all labels are computed from persisted data,
    // never from invented AI replies or hidden probabilities.
    const activeTasks=[
      ...sales.map(o=>({kind:"sale",id:o.id,due:Number(o.expiresDay),label:"Responder oferta recebida",person:player(o.playerId)?.name||o.playerId,waiting:o.status==="awaiting_window"})),
      ...pending.map(n=>({kind:"deal",id:n.id,due:Number(n.expiresDay),label:"Revisar negociação de compra",person:player(n.playerId)?.name||n.playerId,waiting:n.status==="awaiting_window"}))
    ].sort((a,b)=>(a.waiting?1:0)-(b.waiting?1:0)||a.due-b.due);
    const taskPanel='<section class="cc-card" aria-label="Atividades de mercado"><h3>Atividades da Central de Transferências</h3><p class="cc-note">Próximas ações baseadas nas negociações registradas. Sem respostas ou sondagens simuladas.</p>'+
      (activeTasks.length?activeTasks.slice(0,6).map(t=>'<article class="cc-deal"><div class="cc-deal-player"><strong>'+esc(t.person)+'</strong><small>'+esc(t.label)+'</small></div><span class="cc-status">'+(t.waiting?'Aguardando janela':t.due<s.day?'Prazo vencido':t.due-s.day<=3?'Prazo urgente':'Até dia '+esc(t.due))+'</span><button type="button" '+(t.kind==="sale"?'data-coach-deal-tab="recebidas"':'data-coach-deal-open="'+esc(t.id)+'"')+'>Ver negociação</button></article>').join(""):'<p class="cc-note">Nenhuma ação pendente. Use Observação para localizar atletas.</p>')+'</section>';
    const prefs=c.offerPreferences||{mode:"all",blockedIds:[],listedIds:[]};
    const own=D?.club?.(s,s.clubId);
    const prefMode=["all","listed","none"].includes(prefs.mode)?prefs.mode:"all";
    const options=[["all","Receber propostas por todos"],["listed","Somente jogadores na lista"],["none","Não receber propostas"]].map(([id,label])=>'<option value="'+id+'"'+(prefMode===id?' selected':'')+'>'+label+'</option>').join("");
    const offerSettings='<section class="cc-card" aria-label="Preferências de propostas recebidas"><h3>Preferências de propostas</h3><p class="cc-note">Defina quais atletas podem receber abordagens. Alterações ficam no save e não cancelam ofertas já recebidas.</p><label>Recebimento<select data-coach-offer-mode>'+options+'</select></label><button type="button" data-coach-offer-save="1">Salvar preferências</button><h4>Disponibilidade por jogador</h4>'+
      (own?.roster||[]).filter(p=>p.id!=="hero").map(p=>{const status=(prefs.blockedIds||[]).includes(p.id)?"blocked":(prefs.listedIds||[]).includes(p.id)?"listed":"available";return '<div class="cc-deal"><div class="cc-deal-player"><b>'+esc(p.name)+'</b><small>'+esc(p.pos||"")+' · GER '+esc(p.overall??p.ovr??D?.overall?.(p)??"—")+'</small></div><select data-coach-player-offer="'+esc(p.id)+'"><option value="available"'+(status==="available"?" selected":"")+'>Disponível</option><option value="listed"'+(status==="listed"?" selected":"")+'>Na lista de transferências</option><option value="blocked"'+(status==="blocked"?" selected":"")+'>Bloquear ofertas</option></select><button type="button" data-coach-offer-player-save="'+esc(p.id)+'">Aplicar</button></div>';}).join("")+'</section>';
    const urgent=sales.filter(o=>Number(o.expiresDay)-Number(s.day)<=3&&Number(o.expiresDay)>=Number(s.day)).length;
    const total=sales.reduce((sum,o)=>sum+Math.max(0,Number(o.amount)||0),0);
    const inboxHeader='<div class="cc-strip" aria-label="Resumo de propostas recebidas"><div><b>'+sales.length+'</b><span>Ofertas aguardando resposta</span></div><div><b>'+urgent+'</b><span>Prazo próximo (até 3 dias)</span></div><div><b>'+esc(money(total))+'</b><span>Valor total oferecido</span></div></div><p class="cc-note">Responder até o prazo indicado. Aceitar uma venda movimenta o atleta e o orçamento apenas com a janela aberta.</p>';
    const saleRows=inboxHeader+offerSettings+'<div class="cc-deal-actions"><button type="button" data-coach-sale-generate="1">Consultar interesse dos clubes</button></div>'+wrap(sales,o=>{
      const waiting=o.status==="awaiting_window",expired=!waiting&&s.day>o.expiresDay;
      const days=Math.max(0,Number(o.expiresDay)-Number(s.day));
      const urgency=waiting?(o.lastSettlementError?"Regularização: "+o.lastSettlementError:"Acordo assinado · aguardando janela"):expired?"Expirada":days<=3?"Urgente · "+days+" dia(s)":"Restam "+days+" dia(s)";
      const controls=waiting?'<span class="cc-status">Venda programada</span>':expired?'<span class="cc-status">Expirada</span>':'<button type="button" data-coach-sale-accept="'+esc(o.id)+'">'+(D.Career.windowStatus(s).open?"Aceitar e vender":"Aceitar acordo futuro")+'</button><button type="button" data-coach-sale-reject="'+esc(o.id)+'">Recusar</button>'+(o.round>=3?'':'<input type="number" min="1000" step="1000" value="'+esc(o.amount)+'" data-coach-sale-amount="'+esc(o.id)+'" aria-label="Valor da contraproposta"><button type="button" data-coach-sale-counter="'+esc(o.id)+'">Contraproposta</button>');
      return '<article class="cc-deal"><div class="cc-deal-player">'+athlete(o.playerId)+'</div><div>'+team(o.buyerClubId)+'<small> Interesse em contratar · rodada '+esc(o.round||1)+'/3</small></div><div class="cc-deal-terms"><b>'+esc(money(o.amount))+'</b><small>'+esc(urgency)+'</small></div><div class="cc-deal-actions">'+controls+'</div></article>';
    },"Nenhuma proposta de compra recebida.");
    const deals=wrap(pending,n=>{
      const waiting=n.status==="awaiting_window";
      const expired=!waiting&&Number(s.day)>Number(n.expiresDay);
      return '<article class="cc-deal"><div class="cc-deal-player">'+athlete(n.playerId)+'</div><div class="cc-deal-parties">'+team(n.sellerClubId)+'<span aria-hidden="true">→</span>'+team(n.buyerClubId)+'</div><div class="cc-deal-terms"><b>'+esc(money(n.finalFee))+'</b><small>Proposta: '+esc(money(n.requested))+' · Até dia '+esc(n.expiresDay)+'</small></div><div class="cc-deal-actions"><span class="cc-status">'+(waiting?(n.lastSettlementError?'Aguardando regularização: '+esc(n.lastSettlementError):'Aguardando abertura da janela'):expired?'Expirada':'Aguardando decisão')+'</span>'+(expired||waiting?'':'<button type="button" data-coach-deal-accept="'+esc(n.id)+'">Aceitar valor</button>')+'<button type="button" data-coach-deal-reject="'+esc(n.id)+'">Recusar</button><button type="button" data-coach-deal-open="'+esc(n.id)+'">Ver negociação</button></div></article>';
    },"Nenhuma contraproposta pendente.");
    const loanRows=wrap(loans,l=>'<article class="cc-deal"><div class="cc-deal-player">'+athlete(l.playerId)+'</div><div class="cc-deal-parties">'+team(l.fromClubId)+'<span aria-hidden="true">→</span>'+team(l.toClubId)+'</div><div class="cc-deal-terms"><b>Até dia '+esc(l.dueDay)+'</b><small>Salário do contratante: '+esc(l.salaryShare??0)+'% · Taxa: '+esc(money(l.fee))+'</small><small>'+(l.buyOption?'Opção de compra '+esc(money(l.buyOption)):'Sem opção de compra')+'</small></div>'+(l.buyOption&&l.toClubId===s.clubId?'<button type="button" data-coach-deal-buy="'+esc(l.id)+'">Comprar jogador</button>':'')+'</article>',"Nenhum empréstimo ativo.");
    const debtRows=wrap(debts,d=>'<article class="cc-deal"><div class="cc-deal-parties">'+team(d.buyerClubId)+'<span aria-hidden="true">→</span>'+team(d.sourceClubId)+'</div><div class="cc-deal-terms"><b>'+esc(money(d.amount))+'</b><small>Vencimento: dia '+esc(d.dueDay)+' · '+esc(d.playerId||"Transferência")+'</small></div><span class="cc-status">A pagar</span></article>',"Nenhuma parcela em aberto.");
    const clauseRows=wrap(clauses,x=>'<article class="cc-deal"><div class="cc-deal-player">'+athlete(x.playerId)+'</div><div class="cc-deal-parties">'+team(x.sellerClubId)+'<span aria-hidden="true">→</span>'+team(x.buyerClubId)+'</div><div class="cc-deal-terms"><b>'+esc(x.percentage)+'% de revenda</b><small>Ativa até uma próxima venda definitiva</small></div></article>',"Nenhuma cláusula ativa.");
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
    const contractRows=wrap((own?.roster||[]).filter(p=>p.id!=="hero"),p=>'<article class="cc-deal"><div class="cc-deal-player"><strong>'+esc(p.name||"Atleta")+'</strong><small>'+esc(p.pos||p.position||"")+' · GER '+esc(p.ovr??p.overall??"—")+'</small></div><div class="cc-deal-terms"><b>'+esc(Number.isFinite(Number(p.salary))?money(p.salary):"Não registrado")+'</b><small>Salário registrado</small></div></article>',"Nenhum contrato encontrado.");
    const content={lista:listRows,recebidas:saleRows,propostas:deals,emprestimos:loanRows,financeiro:debtRows,contratos:contractRows,clausulas:clauseRows,historico:historyRows};
    const heading={lista:"Jogadores observados",recebidas:"Propostas recebidas pelos seus jogadores",propostas:"Propostas e contrapropostas",emprestimos:"Empréstimos ativos",financeiro:"Obrigações financeiras",contratos:"Contratos do elenco",clausulas:"Cláusulas de revenda",historico:"Histórico financeiro e de transferências"};
    return '<nav class="cc-deal-nav" aria-label="Áreas do mercado"><button type="button" data-coach-market-area="observacao">Observação</button><button type="button" data-coach-market-area="transferencias" aria-current="page">Transferências</button></nav><div class="cc-strip"><div><b>'+pending.length+'</b><span>Propostas pendentes</span></div><div><b>'+loans.length+'</b><span>Empréstimos ativos</span></div><div><b>'+debts.length+'</b><span>Parcelas a pagar</span></div><div><b>'+clauses.length+'</b><span>Cláusulas de revenda</span></div></div><p class="cc-note">Valores do save atual em BRL · prazos em dias da carreira</p>'+taskPanel+'<nav class="cc-deal-nav" aria-label="Categorias de negociações">'+tabs.map(([id,label,count])=>'<button type="button" data-coach-deal-tab="'+id+'" aria-pressed="'+(ui.dealTab===id)+'">'+label+' <small>'+count+'</small></button>').join("")+'</nav><section class="cc-card cc-deal-section"><h3>'+heading[ui.dealTab]+'</h3>'+detail+content[ui.dealTab]+'</section>';
  }


  function render(s,D){
    const C=D?.CoachCareer||root.ProLifeCoachCareer;
    if(!C||s?.mode!=="coach")return `<section class="card"><h2>Carreira do Treinador</h2><p class="muted">Disponível apenas no modo treinador.</p></section>`;
    const sn=C.snapshot(s,D);
    const body=ui.tab==="central"?central(s,D,sn):ui.tab==="vestiario"?locker(sn):ui.tab==="treino"?(sn.hasClub?training(sn):`<section class="cc-card"><p class="muted">Assine com um clube para definir o treino.</p></section>`):ui.tab==="historico"?history(sn):ui.tab==="negociacoes"?negotiations(s,D):ui.tab==="prejogo"?prematch(s,D,sn):(sn.hasClub?board(sn):`<section class="cc-card"><p class="muted">Você está sem clube. Aceite uma proposta na aba Propostas para voltar a trabalhar.</p></section>`);
    return `${css()}<section class="cc-dark"><h2>Carreira do Treinador</h2><small>${esc(sn.club?.name||"Sem clube")} · Temporada ${esc(s.season)} · Nacionalidade: ${esc(s.person?.nationality||"Brasil")} · Reputação ${esc(Math.round(sn.reputation||0))}</small>${tabs()}${body}</section>`;
  }

  function signingPresentation(entry,s){
    const money=n=>"R$ "+Math.round(Number(n)||0).toLocaleString("pt-BR");
    const prestige=Number(entry.overall||0)>=83||Number(entry.fee||0)>=30000000;
    const crest=id=>root.ProLifeClubCrests?.render?.(id,{size:"sm"})||"";
    const from=esc(entry.fromClubName||"Clube anterior"),to=esc(entry.toClubName||"Novo clube");
    return '<article class="cc-card cc-signing" role="region" aria-label="Apresentação oficial do reforço">'+
      '<style>.cc-signing{background:radial-gradient(ellipse at 78% 10%,#294047,#0d1b25 65%);border-color:#bedb3a;padding:25px}.cc-signing h2{font-size:clamp(30px,5vw,64px);font-weight:900;letter-spacing:-.04em;margin:8px 0}.cc-signing .cc-signing-tag{font-size:12px;color:#d0f54a;font-weight:800;letter-spacing:.2em}.cc-signing .cc-signing-clubs{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:24px 0}.cc-signing .cc-signing-facts{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0}.cc-signing .cc-signing-facts span{background:#20313c;padding:12px;border-radius:8px}.cc-signing .cc-signing-actions{display:flex;gap:10px;flex-wrap:wrap}.cc-signing button{cursor:pointer}</style>'+
      '<div class="cc-signing-tag">'+(prestige?"APRESENTAÇÃO DE DESTAQUE":"CONTRATAÇÃO CONFIRMADA")+'</div>'+
      '<h2>'+esc(entry.playerName||"Novo reforço")+'</h2><p class="cc-note">'+(prestige?"Grande expectativa pela chegada do reforço.":"O elenco ganha uma nova opção para a temporada.")+'</p>'+
      '<div class="cc-signing-clubs">'+crest(entry.fromClubId)+'<b>'+from+'</b><span aria-hidden="true">→</span>'+crest(entry.toClubId)+'<b>'+to+'</b></div>'+
      '<div class="cc-signing-facts"><span>Valor: <b>'+money(entry.fee)+'</b></span><span>Posição: <b>'+esc(entry.position||"—")+'</b></span><span>GER: <b>'+esc(entry.overall??"—")+'</b></span><span>Idade: <b>'+esc(entry.age??"—")+'</b></span><span>Operação: <b>'+esc(entry.type==="loan"?"Empréstimo":entry.type==="purchase-option"?"Compra após empréstimo":"Definitiva")+'</b></span></div>'+
      '<p class="cc-note">O jogador já foi integrado ao elenco. Esta apresentação não realiza nova transferência ou pagamento.</p>'+
      '<div class="cc-signing-actions"><button type="button" data-coach-signing-done="'+esc(entry.id)+'">Continuar</button><button type="button" data-coach-signing-squad="'+esc(entry.id)+'">Ver no elenco</button><button type="button" data-coach-signing-history="'+esc(entry.id)+'">Ver histórico</button></div></article>';
  }
  function marketCss(){return '<style>.cc-market-screen{background:linear-gradient(135deg,#101c28,#193440);min-height:80vh}.cc-market-heading{border-left:4px solid #d7ef5b;padding:8px 17px;margin-bottom:20px}.cc-market-screen .cc-card{background:#172b36;border:1px solid #38535f;border-radius:12px}.cc-market-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:14px 0}.cc-market-steps span,.cc-market-budget b{background:#10232d;border:1px solid #59717d;border-radius:8px;padding:12px;font-size:12px}.cc-market-steps span:nth-child(2){border-color:#d7ef5b}.cc-market-budget{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}@media(max-width:620px){.cc-market-steps{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>';}
  function renderMarket(s,D){
    if(s?.mode!=="coach")return '<section class="card"><h2>Transferências</h2><p class="muted">Disponível na carreira de treinador.</p></section>';
    const own=D?.club?.(s,s.clubId);
    const balance=Number(own?.budget);
    const budget=Number.isFinite(balance)?"R$ "+Math.round(balance).toLocaleString("pt-BR"):"Não informado";
    const pending=(s.coachCareer?.presentations||[]).filter(x=>!x.presented&&x.toClubId===s.clubId);
    const current=pending[0]||null;
    const presented=(s.coachCareer?.presentations||[]).filter(x=>x.presented&&x.toClubId===s.clubId).slice(-5).reverse();
    const intro=current?signingPresentation(current,s):'<div class="cc-card"><small>ÚLTIMOS REFORÇOS</small><p class="cc-note">'+(presented.length?presented.map(x=>esc(x.playerName)).join(" · "):"Nenhum reforço apresentado nesta carreira.")+'</p></div>';
    return css()+marketCss()+'<section class="cc-dark cc-market-screen"><div class="cc-market-heading"><small>CENTRAL DE TRANSFERÊNCIAS</small><h2>Mercado de jogadores</h2><p class="cc-note">'+esc(own?.name||"Sem clube")+' · Temporada '+esc(s.season)+' · Orçamento '+esc(budget)+'</p></div>'+intro+negotiations(s,D)+'</section>';
  }

  const api={render,renderMarket,state:ui,esc,setTab:id=>{if(TABS.some(x=>x[0]===id))ui.tab=id;},setDealTab:id=>{if(["lista","recebidas","propostas","emprestimos","financeiro","contratos","clausulas","historico"].includes(id))ui.dealTab=id;},openDeal:id=>{ui.selectedDeal=id;ui.dealTab="propostas";},closeDeal:()=>{ui.selectedDeal=null;},setMarketArea:id=>{if(["observacao","transferencias"].includes(id))ui.marketArea=id;},setScoutFilters:(query,pos)=>{ui.scoutQuery=String(query||"").slice(0,80);ui.scoutPosition=["all","GOL","ZAG","LAT","VOL","MEI","ATA"].includes(pos)?pos:"all";}};
  root.ProLifeCoachCareerView=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
