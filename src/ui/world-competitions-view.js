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

  function renderTable(rows){
    if(!rows.length)
      return `<div class="world-competition-empty">Classificação ainda indisponível.</div>`;

    return `<div class="world-competition-table-wrap"><table class="world-competition-table">
      <thead><tr><th>#</th><th>Clube</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>PTS</th></tr></thead>
      <tbody>${rows.map((row,index)=>`<tr>
        <td>${index+1}</td><td><b>${cr(row.id)}${esc(row.name||row.id)}</b></td>
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
  function renderCoverage(coverage,currentId){
    const rows=Array.isArray(coverage)?coverage:[];
    const noted=rows.filter(row=>row.status!=="playable" || row.note);
    const playable=rows.filter(row=>row.status!=="catalog_only").length;
    if(!rows.length)return "";
    const label={playable:"Jogável",regional_pool:"Grupo regional",catalog_only:"Somente catálogo"};
    const current=rows.find(row=>row.leagueId===currentId);
    const currentNote=current&&current.note?`<p class="world-coverage-note">${esc(current.note)}</p>`:"";
    return `${currentNote}<section class="world-competition-card world-coverage" data-world-coverage><div class="world-section-title"><div><small>COBERTURA FC 27</small><h3>${playable} de ${rows.length} ligas com calendário</h3></div></div>
      ${noted.length?`<ul>${noted.map(row=>`<li><b>${esc(row.name)}</b> · ${esc(label[row.status]||row.status)} · ${safeInt(row.clubCount)} clube${safeInt(row.clubCount)===1?"":"s"}<br><small>${esc(row.note)}</small></li>`).join("")}</ul>`:`<div class="world-competition-empty">Todas as ligas possuem calendário.</div>`}
    </section>`;
  }

  // 34F.23: tecnicos da liga (estilo, meta, pressao da diretoria) e movimentacao recente de treinadores.
  function renderCoaches(s,D,leagueId){
    const CI=D?.ClubIntelligence||root.ProLifeClubIntelligence;
    if(!CI||!leagueId||s?.catalogVersion!=="fc27_v1"||!s?.globalFootball?.intel)return "";
    const rows=CI.leagueCoaches(s,leagueId);
    if(!rows.length)return "";
    const order=new Map(((D?.WorldClubCompetitions||root.ProLifeWorldClubCompetitions)?.standings?.(s,leagueId)||[]).map((r,i)=>[r.id,i+1]));
    rows.sort((a,b)=>(order.get(a.clubId)||99)-(order.get(b.clubId)||99)||a.club.localeCompare(b.club));
    const events=(CI.snapshot(s,null).events||[]).filter(e=>(e.type==="sacked"||e.type==="crisis")&&rows.some(r=>r.clubId===e.clubId)).slice(0,6);
    const meter=board=>`<span class="wc-board" title="Confiança da diretoria: ${safeInt(board)}"><i style="width:${Math.max(2,Math.min(100,safeInt(board)))}%" class="${board<35?"low":board<60?"mid":"ok"}"></i></span>`;
    return `<section class="world-competition-card world-coaches" data-world-coaches><div class="world-section-title"><div><small>TREINADORES</small><h3>Comando dos clubes</h3></div><span>${rows.length} clubes</span></div>
      <div class="wc-coach-list">${rows.map(r=>`<div class="wc-coach-row${r.crisis?" crisis":""}"><span class="pos">${order.get(r.clubId)||"–"}</span><span class="club"><b>${esc(r.club)}</b><small>${esc(r.coach)} · ${esc(r.styleLabel)}</small></span><span class="goal">${esc(r.objectiveLabel)}</span>${meter(r.board)}</div>`).join("")}</div>
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

    return `<section class="world-competitions-view world-competitions-dark" data-world-competitions-view>
      ${styles()}
      <header class="world-competition-header">
        <div><small>CAMPEONATOS MUNDIAIS · ${data.season}</small><h2>${esc(data.league.name||data.league.id)}</h2><p>${esc(data.league.country||"Competição internacional")} · ${safeInt(data.league.clubCount,data.standings.length)} clubes</p></div>
        <div class="world-competition-champion"><small>CAMPEÃO</small><strong>${esc(data.champion?.name||"Em disputa")}</strong></div>
      </header>
      <nav class="world-league-tabs" aria-label="Ligas mundiais">${data.leagues.map(league=>`<button type="button" data-world-league="${esc(league.id)}" class="${league.id===data.league.id?"active":""}">${esc(league.name||league.id)}</button>`).join("")}</nav>
      <div class="world-competition-grid">
        <section class="world-competition-card world-table-card"><div class="world-section-title"><div><small>CLASSIFICAÇÃO</small><h3>Tabela da liga</h3></div><span>${data.standings.length} times</span></div>${renderTable(data.standings)}</section>
        <aside class="world-competition-side">
          <section class="world-competition-card"><div class="world-section-title"><div><small>RODADAS</small><h3>Rodada ${safeInt(round?.round,"-")}</h3></div><span>${round?.played?"Encerrada":"Programada"}</span></div>
            <div class="world-round-tabs">${data.rounds.map(item=>`<button type="button" data-world-round="${safeInt(item.round)}" class="${item.round===round?.round?"active":""}">${safeInt(item.round)}</button>`).join("")}</div>
            ${renderRound(round,catalog)}
          </section>
          <section class="world-competition-card"><div class="world-section-title"><div><small>RESULTADOS</small><h3>Últimos jogos</h3></div></div>
            ${lastResults.length?`<div class="world-recent-results">${lastResults.map(match=>`<article><span>${cr(match.home)}${esc(match.homeName||match.home)}</span><strong>${safeInt(match.hg)} – ${safeInt(match.ag)}</strong><span>${cr(match.away)}${esc(match.awayName||match.away)}</span></article>`).join("")}</div>`:`<div class="world-competition-empty">Ainda não há resultados disputados.</div>`}
          </section>
          <section class="world-competition-card world-champions"><div class="world-section-title"><div><small>HISTÓRICO</small><h3>Campeões</h3></div></div>
            ${data.history.length?data.history.slice(0,6).map(item=>`<div><span>${safeInt(item.season)}</span><b>${esc(item.champion||"Não definido")}</b></div>`).join(""):`<div class="world-competition-empty">O primeiro campeão ainda será definido.</div>`}
          </section>
        </aside>
      </div>
      ${renderCoaches(s,D,data.league.id)}
      ${renderCoverage(data.coverage,data.league.id)}
    </section>`;
  }

  function styles(){
    return `<style data-world-competitions-style>
      .world-competitions-dark{--wc-bg:#091018;--wc-card:#111b25;--wc-line:rgba(255,255,255,.08);--wc-text:#f3f5f7;--wc-muted:#8d9aa4;--wc-gold:#d8b45b;display:block;padding:24px;border-radius:18px;background:radial-gradient(circle at 10% 0,rgba(216,180,91,.11),transparent 28%),var(--wc-bg);color:var(--wc-text)}
      .world-coverage ul{margin:0;padding-left:18px}.world-coverage li{margin:6px 0}.world-coverage-note{margin:8px 0;opacity:.8}.world-competition-header,.world-section-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px}.world-competition-header h2{margin:5px 0;font-size:clamp(28px,4vw,48px)}.world-competition-header p,.world-competition-header small,.world-section-title small,.world-competition-empty{color:var(--wc-muted)}.world-competition-champion{display:grid;gap:5px;text-align:right}.world-competition-champion strong{color:var(--wc-gold);font-size:18px}.world-league-tabs,.world-round-tabs{display:flex;gap:6px;overflow:auto;padding:18px 0}.world-league-tabs button,.world-round-tabs button{white-space:nowrap;border:1px solid var(--wc-line);border-radius:999px;padding:8px 12px;background:#0d1620;color:var(--wc-muted)}.world-league-tabs button.active,.world-round-tabs button.active{border-color:var(--wc-gold);background:var(--wc-gold);color:#111;font-weight:800}.world-competition-grid{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(320px,1fr);gap:14px}.world-competition-side{display:grid;gap:14px}.world-competition-card{padding:20px;border:1px solid var(--wc-line);border-radius:14px;background:var(--wc-card)}.world-section-title h3{margin:4px 0 0}.world-section-title>span{color:var(--wc-muted);font-size:11px}.world-competition-table-wrap{overflow:auto;margin-top:14px}.world-competition-table{width:100%;border-collapse:collapse;font-size:12px}.world-competition-table th,.world-competition-table td{padding:10px 8px;border-bottom:1px solid var(--wc-line);text-align:center}.world-competition-table th:nth-child(2),.world-competition-table td:nth-child(2){text-align:left}.world-competition-table tbody tr:first-child{background:rgba(216,180,91,.09)}.world-competition-table tbody tr:first-child td:first-child,.world-competition-table strong{color:var(--wc-gold)}.world-round-games,.world-recent-results{display:grid;gap:6px}.world-round-game,.world-recent-results article{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px;padding:9px;border-radius:8px;background:rgba(255,255,255,.035);font-size:11px}.world-round-game span:last-child,.world-recent-results span:last-child{text-align:right}.world-round-game i{color:var(--wc-muted);font-style:normal}.world-round-game .scheduled{color:var(--wc-muted)}.world-champions>div:not(.world-section-title):not(.world-competition-empty){display:flex;justify-content:space-between;padding:9px 2px;border-bottom:1px solid var(--wc-line);font-size:11px}.world-champions b{color:var(--wc-gold)}.world-competition-empty{padding:22px 4px;text-align:center}.world-competition-empty-main{padding:70px 20px}.world-competition-empty-main h2{color:var(--wc-text)}
      .world-coaches{margin-top:16px}.wc-coach-row{display:grid;grid-template-columns:28px minmax(0,1fr) minmax(0,1.1fr) 84px;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--wc-line)}.wc-coach-row .pos{color:var(--wc-muted);font-variant-numeric:tabular-nums}.wc-coach-row .club b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.wc-coach-row small{color:var(--wc-muted)}.wc-coach-row .goal{color:var(--wc-muted);font-size:13px}.wc-coach-row.crisis .club b{color:#e0705f}
      .wc-board{display:block;height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden}.wc-board i{display:block;height:100%}.wc-board i.ok{background:#58c28b}.wc-board i.mid{background:var(--wc-gold)}.wc-board i.low{background:#e0705f}
      .wc-coach-events{margin-top:12px;padding-top:10px;border-top:1px solid var(--wc-line)}.wc-coach-events p{margin:8px 0;font-size:13px}.wc-coach-events span{color:var(--wc-muted)}
      @media(max-width:900px){.world-competition-grid{grid-template-columns:1fr}.world-competition-header{align-items:flex-start;flex-direction:column}.world-competition-champion{text-align:left}.world-competitions-dark{padding:16px}}
    </style>`;
  }

  const api={snapshot,render,esc};
  root.ProLifeWorldCompetitionsView=api;
  if(typeof module!=="undefined"&&module.exports)
    module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
