(function worldCompetitionsViewModule(root){
  "use strict";

  const fallbackWorld=
    typeof require==="function"
      ? require("../domain/world-club-competitions.js")
      : null;

  function esc(value){
    return String(value??"").replace(
      /[&<>"']/g,
      char=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
      })[char]
    );
  }

  function worldApi(D){
    return D?.WorldClubCompetitions ||
      root.ProLifeWorldClubCompetitions ||
      fallbackWorld;
  }

  function clubCatalog(s){
    return new Map(
      (s?.globalFootball?.clubs||[])
        .filter(club=>club?.id)
        .map(club=>[club.id,club.name||club.id])
    );
  }

  function safeInt(value,fallback=0){
    const number=Number(value);
    return Number.isFinite(number)
      ? Math.trunc(number)
      : fallback;
  }

  function snapshot(s,D,options={}){
    const W=worldApi(D);
    const leagues=W?.eligibleLeagues?.(s)||[];
    const requested=String(options.leagueId||"");
    const league=
      leagues.find(item=>String(item.id)===requested) ||
      leagues[0] ||
      null;

    if(!league){
      return {
        season:safeInt(s?.season,new Date().getFullYear()),
        leagues:[],
        league:null,
        standings:[],
        rounds:[],
        selectedRound:null,
        results:[],
        champion:null,
        history:[],
        coverage:W?.coverage?.(s)||[]
      };
    }

    const standings=W.standings?.(s,league.id)||[];
    const rounds=W.calendar?.(s,league.id)||[];
    const playedResults=W.results?.(s,league.id)||[];
    const history=W.history?.(s,league.id)||[];
    const currentHistory=
      history.find(
        item=>Number(item?.season)===Number(s?.season)
      ) ||
      null;
    const requestedRound=safeInt(options.round,0);
    const defaultRound=
      rounds.find(item=>!item.played)?.round ||
      rounds.at(-1)?.round ||
      null;
    const selectedRound=
      rounds.find(item=>item.round===requestedRound) ||
      rounds.find(item=>item.round===defaultRound) ||
      null;
    const competition=
      s?.globalFootball?.worldCompetitions?.leagues?.[league.id];
    const championId=
      competition?.championId ||
      currentHistory?.championId ||
      null;
    const champion=
      standings.find(row=>row.id===championId) ||
      (currentHistory?.champion
        ? {id:championId,name:currentHistory.champion}
        : null);

    return {
      season:safeInt(s?.season,new Date().getFullYear()),
      leagues,
      league,
      standings,
      rounds,
      selectedRound,
      results:playedResults,
      champion,
      history,
      coverage:W?.coverage?.(s)||[]
    };
  }

  function renderTable(rows,start=0){
    if(!rows.length)
      return `<div class="world-competition-empty">Classificação ainda indisponível.</div>`;

    return `<div class="world-competition-table-wrap"><table class="world-competition-table">
      <thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead>
      <tbody>${rows.map((row,index)=>`<tr>
        <td>${start+index+1}</td><td><b>${cr(row.id)}${esc(row.name||row.id)}</b></td>
        <td>${safeInt(row.played)}</td><td>${safeInt(row.w)}</td><td>${safeInt(row.d)}</td><td>${safeInt(row.l)}</td>
        <td>${safeInt(row.gd)}</td><td><strong>${safeInt(row.points)}</strong></td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }

  function cr(id){const c=root.ProLifeClubCrests;return c&&c.inline?c.inline(id,'sm'):'';}
  function renderRound(round,catalog){
    if(!round)
      return `<div class="world-competition-empty">Nenhuma rodada disponível.</div>`;

    const pairs=Array.isArray(round.pairs)?round.pairs:[];
    if(!pairs.length)
      return `<div class="world-competition-empty">Nenhum jogo nesta rodada.</div>`;

    return `<div class="world-round-games">${pairs.map(pair=>{
      const home=catalog.get(pair.home)||pair.home||"-";
      const away=catalog.get(pair.away)||pair.away||"-";
      const score=pair.played
        ? `<strong>${safeInt(pair.hg)} <i>–</i> ${safeInt(pair.ag)}</strong>`
        : `<strong class="scheduled">×</strong>`;
      return `<article class="world-round-game"><span>${cr(pair.home)}${esc(home)}</span>${score}<span>${cr(pair.away)}${esc(away)}</span></article>`;
    }).join("")}</div>`;
  }

  // 34F.18: situacao de cada liga do catalogo FC 27 (jogavel, grupo regional ou somente catalogo).
  function renderCoverage(coverage,currentId,page=0){
    const rows=Array.isArray(coverage)?coverage:[];
    const noted=rows.filter(row=>row.status!=="playable" || row.note);
    const pages=Math.max(1,Math.ceil(noted.length/10));
    const activePage=Math.max(0,Math.min(pages-1,safeInt(page,0)));
    const visible=noted.slice(activePage*10,activePage*10+10);
    const playable=rows.filter(row=>row.status!=="catalog_only").length;
    if(!rows.length)return "";
    const label={playable:"Jogável",regional_pool:"Grupo regional",catalog_only:"Somente catálogo"};
    const current=rows.find(row=>row.leagueId===currentId);
    const currentNote=current&&current.note?`<p class="world-coverage-note">${esc(current.note)}</p>`:"";
    return `${currentNote}<section class="world-competition-card world-coverage" data-world-coverage><div class="world-section-title"><div><small>COBERTURA FC 27</small><h3>${playable} de ${rows.length} ligas com calendário</h3></div></div>
      ${noted.length?`<ul>${visible.map(row=>`<li><b>${esc(row.name)}</b> · ${esc(label[row.status]||row.status)} · ${safeInt(row.clubCount)} clube${safeInt(row.clubCount)===1?"":"s"}<br><small>${esc(row.note)}</small></li>`).join("")}</ul>`:`<div class="world-competition-empty">Todas as ligas possuem calendário.</div>`}
      ${pages>1?renderPager("world-coverage-page",activePage,pages,noted.length):""}
    </section>`;
  }

  // 34F.23: tecnicos da liga (estilo, meta, pressao da diretoria) e movimentacao recente de treinadores.
  function renderPager(attribute,page,pages,total){
    return `<nav class="world-page-tabs" aria-label="Páginas"><button type="button" data-${attribute}="${Math.max(0,page-1)}" ${page===0?"disabled":""}>Anterior</button><span>${page*10+1}–${Math.min((page+1)*10,total)} de ${total}</span><button type="button" data-${attribute}="${Math.min(pages-1,page+1)}" ${page===pages-1?"disabled":""}>Próxima</button></nav>`;
  }

  function renderCoaches(s,D,leagueId,page=0){
    const CI=D?.ClubIntelligence||root.ProLifeClubIntelligence;
    if(!CI||!leagueId||s?.catalogVersion!=="fc27_v1"||!s?.globalFootball?.intel)return "";
    const rows=CI.leagueCoaches(s,leagueId);
    if(!rows.length)return "";
    const order=new Map(((D?.WorldClubCompetitions||root.ProLifeWorldClubCompetitions)?.standings?.(s,leagueId)||[]).map((r,i)=>[r.id,i+1]));
    rows.sort((a,b)=>(order.get(a.clubId)||99)-(order.get(b.clubId)||99)||a.club.localeCompare(b.club));
    const pages=Math.max(1,Math.ceil(rows.length/10));
    const activePage=Math.max(0,Math.min(pages-1,safeInt(page,0)));
    const visible=rows.slice(activePage*10,activePage*10+10);
    const events=(CI.snapshot(s,null).events||[]).filter(e=>(e.type==="sacked"||e.type==="crisis")&&rows.some(r=>r.clubId===e.clubId)).slice(0,6);
    const meter=board=>`<span class="wc-board" title="Confiança da diretoria: ${safeInt(board)}"><i style="width:${Math.max(2,Math.min(100,safeInt(board)))}%" class="${board<35?"low":board<60?"mid":"ok"}"></i></span>`;
    return `<section class="world-competition-card world-coaches" data-world-coaches><div class="world-section-title"><div><small>TREINADORES</small><h3>Comando dos clubes</h3></div><span>${rows.length} clubes</span></div>
      <div class="wc-coach-list">${visible.map(r=>`<div class="wc-coach-row${r.crisis?" crisis":""}"><span class="pos">${order.get(r.clubId)||"–"}</span><span class="club"><b>${esc(r.club)}</b><small>${esc(r.coach)} · ${esc(r.styleLabel)}</small></span><span class="goal">${esc(r.objectiveLabel)}</span>${meter(r.board)}</div>`).join("")}</div>
      ${pages>1?renderPager("world-coach-page",activePage,pages,rows.length):""}
      ${events.length?`<div class="wc-coach-events"><small>MOVIMENTAÇÃO RECENTE</small>${events.map(e=>`<p><b>${esc(e.title)}</b><br><span>${esc(e.text)}</span></p>`).join("")}</div>`:""}
    </section>`;
  }

  function render(s,D,options={}){
    const data=snapshot(s,D,options);

    if(!data.league){
      return `<section class="world-competitions-view world-competitions-dark" data-world-competitions-view>
        ${styles()}
        <div class="world-competition-empty world-competition-empty-main">
          <small>CAMPEONATOS MUNDIAIS</small><h2>Nenhuma liga disponível</h2>
          <p>O motor ainda não possui competições mundiais elegíveis para esta carreira.</p>
        </div>
        ${renderCoverage(data.coverage,null)}
      </section>`;
    }

    const catalog=clubCatalog(s);
    const round=data.selectedRound;
    const lastResults=data.results.slice(-5).reverse();
    const sections=new Set(["overview","standings","matches","highlights","coaches","coverage"]);
    const section=sections.has(options.section)?options.section:"overview";
    const tablePage=Math.max(0,Math.min(
      Math.ceil(data.standings.length/10)-1,
      safeInt(options.tablePage,0)
    ));
    const tableStart=tablePage*10;
    const tableRows=data.standings.slice(tableStart,tableStart+10);
    const tablePages=Math.max(1,Math.ceil(data.standings.length/10));
    const coachPage=safeInt(options.coachPage,0);
    const coveragePage=safeInt(options.coveragePage,0);
    const leaguePicker=`<label class="world-picker"><span>Campeonato</span><select data-world-league-select aria-label="Selecionar campeonato">${data.leagues.map(league=>`<option type="button" data-world-league="${esc(league.id)}" value="${esc(league.id)}" ${league.id===data.league.id?"selected":""}>${esc(league.name||league.id)}</option>`).join("")}</select></label>`;
    const roundPicker=`<label class="world-picker"><span>Rodada</span><select data-world-round-select aria-label="Selecionar rodada">${data.rounds.map(item=>`<option type="button" data-world-round="${safeInt(item.round)}" value="${safeInt(item.round)}" ${item.round===round?.round?"selected":""}>Rodada ${safeInt(item.round)}${item.played?" · encerrada":""}</option>`).join("")}</select></label>`;

    const standingsCard=`<section class="world-competition-card world-table-card"><div class="world-section-title"><div><small>CLASSIFICAÇÃO</small><h3>Tabela da liga</h3></div><span>${data.standings.length} times</span></div>
      ${renderTable(tableRows,tableStart)}
      ${tablePages>1?`<nav class="world-page-tabs" aria-label="Páginas da classificação">${Array.from({length:tablePages},(_,index)=>`<button type="button" data-world-table-page="${index}" class="${index===tablePage?"active":""}">${index*10+1}–${Math.min((index+1)*10,data.standings.length)}</button>`).join("")}</nav>`:""}
    </section>`;
    const matchesCard=`<section class="world-competition-card"><div class="world-section-title"><div><small>PARTIDAS</small><h3>Rodada ${safeInt(round?.round,"-")}</h3></div><span>${round?.played?"Encerrada":"Programada"}</span></div>${roundPicker}${renderRound(round,catalog)}</section>`;
    const resultsCard=`<section class="world-competition-card"><div class="world-section-title"><div><small>RESULTADOS</small><h3>Últimos jogos</h3></div></div>
      ${lastResults.length?`<div class="world-recent-results">${lastResults.map(match=>`<article><span>${cr(match.home)}${esc(match.homeName||match.home)}</span><strong>${safeInt(match.hg)} – ${safeInt(match.ag)}</strong><span>${cr(match.away)}${esc(match.awayName||match.away)}</span></article>`).join("")}</div>`:`<div class="world-competition-empty">Ainda não há resultados disputados.</div>`}
    </section>`;
    const historyCard=`<section class="world-competition-card world-champions"><div class="world-section-title"><div><small>HISTÓRICO</small><h3>Campeões</h3></div></div>
      ${data.history.length?data.history.slice(0,6).map(item=>`<div><span>${safeInt(item.season)}</span><b>${esc(item.champion||"Não definido")}</b></div>`).join(""):`<div class="world-competition-empty">O primeiro campeão ainda será definido.</div>`}
    </section>`;
    const leader=data.standings[0];
    const latest=lastResults[0];
    const overview=`<div class="world-summary-grid">
      <article><small>CLASSIFICAÇÃO</small><strong>${leader?`${cr(leader.id)}${esc(leader.name||leader.id)}`:"Classificação ainda indisponível"}</strong><span>${leader?`${safeInt(leader.points)} pts · líder`:"Aguardando jogos"}</span></article>
      <article><small>PARTIDAS</small><strong>Rodada ${safeInt(round?.round,"-")}</strong><span>${round?`${(round.pairs||[]).length} jogos · ${round.played?"encerrada":"programada"}`:"Nenhuma rodada disponível."}</span></article>
      <article><small>ÚLTIMO RESULTADO</small><strong>${latest?`${safeInt(latest.hg)} – ${safeInt(latest.ag)}`:"Ainda não há resultados disputados."}</strong><span>${latest?`${esc(latest.homeName||latest.home)} × ${esc(latest.awayName||latest.away)}`:"Aguardando estreia"}</span></article>
      <article><small>CAMPEÃO</small><strong>${esc(data.champion?.name||"Em disputa")}</strong><span>${data.history.length?`${data.history.length} temporada(s) no histórico`:"O primeiro campeão ainda será definido"}</span></article>
    </div>`;
    const sectionContent={
      overview,
      standings:standingsCard,
      matches:matchesCard,
      highlights:`<div class="world-highlight-grid">${resultsCard}${historyCard}</div>`,
      coaches:renderCoaches(s,D,data.league.id,coachPage)||`<div class="world-competition-empty">Dados de treinadores indisponíveis para esta liga.</div>`,
      coverage:renderCoverage(data.coverage,data.league.id,coveragePage)||`<div class="world-competition-empty">Dados de cobertura indisponíveis.</div>`
    }[section];

    return `<section class="world-competitions-view world-competitions-dark" data-world-competitions-view>
      ${styles()}
      <header class="world-competition-header">
        <div><small>CAMPEONATOS MUNDIAIS · ${data.season}</small><h2>${esc(data.league.name||data.league.id)}</h2><p>${esc(data.league.country||"Competição internacional")} · ${safeInt(data.league.clubCount,data.standings.length)} clubes</p></div>
        <div class="world-competition-champion"><small>CAMPEÃO</small><strong>${esc(data.champion?.name||"Em disputa")}</strong></div>
      </header>
      <div class="world-control-bar">${leaguePicker}</div>
      <nav class="world-section-tabs" aria-label="Seções do campeonato">
        ${[["overview","Visão geral"],["standings","Classificação"],["matches","Partidas"],["highlights","Destaques"],["coaches","Treinadores"],["coverage","Cobertura"]].map(([id,label])=>`<button type="button" data-world-section="${id}" class="${id===section?"active":""}">${label}</button>`).join("")}
      </nav>
      <div class="world-section-screen" data-world-active-section="${section}">${sectionContent}</div>
    </section>`;
  }

  function styles(){
    return `<style data-world-competitions-style>
      .world-competitions-dark{--wc-bg:#091018;--wc-card:#111b25;--wc-line:rgba(255,255,255,.08);--wc-text:#f3f5f7;--wc-muted:#8d9aa4;--wc-gold:#d8b45b;display:block;padding:24px;border-radius:18px;background:radial-gradient(circle at 10% 0,rgba(216,180,91,.11),transparent 28%),var(--wc-bg);color:var(--wc-text)}
      .world-coverage ul{margin:0;padding-left:18px}.world-coverage li{margin:6px 0}.world-coverage-note{margin:8px 0;opacity:.8}.world-competition-header,.world-section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.world-competition-header h2{margin:5px 0;font-size:clamp(28px,4vw,48px)}.world-competition-header p,.world-competition-header small,.world-section-title small,.world-competition-empty{color:var(--wc-muted)}.world-competition-champion{display:grid;gap:5px;text-align:right}.world-competition-champion strong{color:var(--wc-gold);font-size:18px}.world-control-bar{display:flex;gap:12px;padding:16px 0 10px}.world-picker{display:grid;gap:5px;min-width:min(100%,360px)}.world-picker span{color:var(--wc-muted);font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.world-picker select{width:100%;min-height:42px;border:1px solid var(--wc-line);border-radius:9px;padding:0 12px;background:#0d1620;color:var(--wc-text);font-weight:700}.world-section-tabs,.world-page-tabs{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-bottom:14px}.world-section-tabs button,.world-page-tabs button{min-width:0;border:1px solid var(--wc-line);border-radius:8px;padding:10px 6px;background:#0d1620;color:var(--wc-muted);font-weight:800}.world-section-tabs button.active,.world-page-tabs button.active{border-color:var(--wc-gold);background:var(--wc-gold);color:#111}.world-page-tabs{display:flex;align-items:center;justify-content:center;margin:14px 0 0}.world-page-tabs span{color:var(--wc-muted);font-size:11px}.world-page-tabs button:disabled{opacity:.35}.world-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.world-summary-grid article{display:grid;gap:8px;min-height:120px;padding:18px;border:1px solid var(--wc-line);border-radius:12px;background:var(--wc-card)}.world-summary-grid small{color:var(--wc-gold);font-weight:800;letter-spacing:.08em}.world-summary-grid strong{font-size:17px}.world-summary-grid span{color:var(--wc-muted);font-size:12px}.world-highlight-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.world-competition-card{padding:20px;border:1px solid var(--wc-line);border-radius:14px;background:var(--wc-card)}.world-section-title h3{margin:4px 0 0}.world-section-title>span{color:var(--wc-muted);font-size:11px}.world-competition-table-wrap{overflow:hidden;margin-top:14px}.world-competition-table{width:100%;border-collapse:collapse;font-size:12px}.world-competition-table th,.world-competition-table td{padding:10px 8px;border-bottom:1px solid var(--wc-line);text-align:center}.world-competition-table th:nth-child(2),.world-competition-table td:nth-child(2){text-align:left}.world-competition-table tbody tr:first-child{background:rgba(216,180,91,.09)}.world-competition-table tbody tr:first-child td:first-child,.world-competition-table strong{color:var(--wc-gold)}.world-round-games,.world-recent-results{display:grid;gap:6px;margin-top:12px}.world-round-game,.world-recent-results article{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:9px;border-radius:8px;background:rgba(255,255,255,.035);font-size:11px}.world-round-game span:last-child,.world-recent-results span:last-child{text-align:right}.world-round-game i{color:var(--wc-muted);font-style:normal}.world-round-game .scheduled{color:var(--wc-muted)}.world-champions>div:not(.world-section-title):not(.world-competition-empty){display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid var(--wc-line);font-size:11px}.world-champions b{color:var(--wc-gold)}.world-competition-empty{padding:22px 4px;text-align:center}.world-competition-empty-main{padding:70px 20px}.world-competition-empty-main h2{color:var(--wc-text)}
      .world-coaches{margin-top:16px}.wc-coach-row{display:grid;grid-template-columns:28px minmax(0,1fr) minmax(0,1.1fr) 84px;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--wc-line)}.wc-coach-row .pos{color:var(--wc-muted);font-variant-numeric:tabular-nums}.wc-coach-row .club b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wc-coach-row small{color:var(--wc-muted)}.wc-coach-row .goal{color:var(--wc-muted);font-size:13px}.wc-coach-row.crisis .club b{color:#e0705f}
      .wc-board{display:block;height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}.wc-board i{display:block;height:100%}.wc-board i.ok{background:#58c28b}.wc-board i.mid{background:var(--wc-gold)}.wc-board i.low{background:#e0705f}
      .wc-coach-events{margin-top:12px;padding-top:10px;border-top:1px solid var(--wc-line)}.wc-coach-events p{margin:8px 0;font-size:13px}.wc-coach-events span{color:var(--wc-muted)}
      @media(max-width:900px){.world-competition-header{align-items:flex-start;flex-direction:column}.world-competition-champion{text-align:left}.world-competitions-dark{padding:14px}.world-section-tabs{grid-template-columns:repeat(3,minmax(0,1fr))}.world-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.world-highlight-grid{grid-template-columns:1fr}.world-competition-card{padding:14px}.world-competition-table th,.world-competition-table td{padding:8px 4px;font-size:10px}.world-competition-header h2{font-size:26px}.wc-coach-row{grid-template-columns:24px minmax(0,1fr) 72px}.wc-coach-row .goal{display:none}}
    </style>`;
  }

  const api={snapshot,render,esc};
  root.ProLifeWorldCompetitionsView=api;
  if(typeof module!=="undefined"&&module.exports)
    module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
