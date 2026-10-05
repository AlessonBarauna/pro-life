(function (root) {
  "use strict";
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const date = (day) => new Date(2026, 0, 1 + Number(day || 0)).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const club = (s, id) => s.clubs.find((c) => c.id === id);
  const league = (s, id) => s.leagues.find((l) => l.id === id)?.name || id;
  function leagueCards(s) {
    return s.leagues.map((l, index) => {
      const leader = root.ProLife.table(s, l.id)[0], movement = l.id === "serieA" ? "4 rebaixados" : l.id === "serieD" ? "4 promovidos" : "4 promovidos · 4 rebaixados";
      return `<article class="competition-card"><span class="pill">DIVISÃO ${String.fromCharCode(65 + index)}</span><h3>${esc(l.name)}</h3><p>20 clubes · 38 rodadas</p><small>${movement} ao fim da temporada</small><b>Líder: ${esc(leader?.name || "—")}</b></article>`;
    }).join("");
  }
  function cupView(s, cup) {
    if (!cup) return "";
    const rounds = cup.rounds.map((round) => `<details ${round.pairs.some((p) => !p.played) ? "open" : ""}><summary>${esc(round.name)} · ${date(round.date)}</summary><div class="fixture-list">${round.pairs.map((p) => `<div class="news"><span>${esc(club(s, p.home)?.name)} ${p.played ? `<b>${p.hg} × ${p.ag}</b>` : "×"} ${esc(club(s, p.away)?.name)}</span>${p.penalties ? `<small>Pênaltis: ${p.penalties[0]} × ${p.penalties[1]}</small>` : ""}</div>`).join("")}</div></details>`).join("");
    return `<section class="card section cup-view"><div class="split"><div><div class="tag">MATA-MATA NACIONAL</div><h2>Copa do Brasil</h2></div><span class="pill">${esc(cup.status)}</span></div><p>${esc(cup.format)}</p>${cup.champion ? `<div class="notice"><b>Campeão: ${esc(cup.champion)}</b><br>Vice: ${esc(cup.runnerUp)}</div>` : ""}<div class="tablewrap"><table><thead><tr><th>Rank</th><th>Clube</th><th>Divisão atual</th><th>Classificação</th></tr></thead><tbody>${cup.entrants.map((entry) => { const c = club(s, entry.clubId); return `<tr class="${entry.clubId === s.clubId ? "highlight" : ""}"><td>#${entry.rank}</td><td>${esc(c?.name)}</td><td>${esc(league(s, c?.leagueId))}</td><td>${esc(entry.qualifiedBy)}</td></tr>`; }).join("")}</tbody></table></div><div class="section">${rounds}</div></section>`;
  }
  function stateView(s, state) {
    if (!state) return `<section class="card section"><h2>Campeonato estadual</h2><div class="empty">Assine com um clube para definir o estadual da carreira.</div></section>`;
    const groups = state.groups.map((group) => `<div><h3>Grupo ${group.id}</h3><div class="tablewrap"><table><thead><tr><th>#</th><th>Clube</th><th>PTS</th><th>J</th><th>SG</th></tr></thead><tbody>${root.ProLifeCompetitions.stateTable(state, group.id).map((row, index) => `<tr class="${row.id === s.clubId ? "highlight" : ""}"><td>${index + 1}</td><td>${esc(club(s, row.id)?.name)}</td><td>${row.points}</td><td>${row.played}</td><td>${row.gf - row.ga}</td></tr>`).join("")}</tbody></table></div></div>`).join("");
    const rounds = state.rounds.map((round) => `<details ${round.pairs.some((pair) => !pair.played) ? "open" : ""}><summary>${esc(round.name)} · ${date(round.date)}</summary><div class="fixture-list">${round.pairs.map((pair) => `<div class="news"><span>${pair.group ? `<small>Grupo ${pair.group} · </small>` : ""}${esc(club(s, pair.home)?.name)} ${pair.played ? `<b>${pair.hg} × ${pair.ag}</b>` : "×"} ${esc(club(s, pair.away)?.name)}</span>${pair.penalties ? `<small>Pênaltis: ${pair.penalties[0]} × ${pair.penalties[1]}</small>` : ""}</div>`).join("")}</div></details>`).join("");
    return `<section class="card section"><div class="split"><div><div class="tag">ESTADUAL COMPLETO</div><h2>${esc(state.name)}</h2></div><span class="pill">${esc(state.status)}</span></div><p>${esc(state.format)}</p>${state.champion ? `<div class="notice"><b>Campeão: ${esc(state.champion)}</b>${state.runnerUp ? `<br>Vice: ${esc(state.runnerUp)}` : ""}</div>` : ""}<div class="competition-grid state-groups">${groups}</div><div class="section">${rounds}</div></section>`;
  }
  function competitions(s) {
    root.ProLifeCompetitions.init(s);
    const schedule = s.competitionSchedule || {}, states = root.ProLifeCompetitions.allStates(s);
    const stateCards = states.map((state) => `<article class="competition-card"><span class="pill">ESTADUAL · ${esc(state.state)}</span><h3>${esc(state.name)}</h3><p>${state.entrants.length} clube(s) · grupos e mata-mata</p><small>${esc(state.status)}</small><b>${state.champion ? `Campeão: ${esc(state.champion)}` : "Título em disputa"}</b></article>`).join("");
    return `<section class="card"><div class="tag">PIRÂMIDE NACIONAL</div><h2 class="section">Competições disponíveis</h2><p class="muted">Séries A/B/C/D, Copa do Brasil e todos os estaduais representados são simulados. Os estaduais possuem fase de grupos, mata-mata e final conforme a quantidade de clubes disponível.</p><div class="competition-grid">${leagueCards(s)}<article class="competition-card"><span class="pill">COPA NACIONAL</span><h3>Copa do Brasil</h3><p>32 clubes · mata-mata</p><small>${esc(schedule.cup?.status || "Aguardando")}</small><b>${schedule.cup?.champion ? `Campeão: ${esc(schedule.cup.champion)}` : "Título em disputa"}</b></article>${stateCards}</div></section>${stateView(s, schedule.state)}${cupView(s, schedule.cup)}`;
  }
  function leaderTable(s, title, field, competitionId) {
    const S = root.ProLifeStatistics;
    const rows = S.leaders(s, field, 10, competitionId);
    return `<section class="card"><h2>${esc(title)}</h2>${rows.length ? `<div class="tablewrap"><table><thead><tr><th>#</th><th>Atleta / clube</th><th>Total</th></tr></thead><tbody>${rows.map((player, index) => `<tr><td>${index + 1}</td><td>${esc(player.name)}<small>${esc(player.club)}</small></td><td><b>${player.value}</b></td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Sem registros nesta competição ainda.</div>'}</section>`;
  }
  function statistics(s, selected) {
    const S=root.ProLifeStatistics, dash=S.heroDashboard(s), insight=S.careerInsights(s), competitions=root.ProLifeCompetitions.statCompetitions(s), id=competitions.some(item=>item.id===selected)?selected:DUMMY(s,competitions), current=competitions.find(item=>item.id===id), h=dash.currentClubSeason || dash.season;
    const metrics=(x)=>`<div class="profile-data"><span>Jogos <b>${x.appearances||0}</b></span><span>Titular <b>${x.starts||0}</b></span><span>Minutos <b>${x.minutes||0}</b></span><span>Gols <b>${x.goals||0}</b></span><span>Assist. <b>${x.assists||0}</b></span><span>Participações <b>${Number(x.goals||0)+Number(x.assists||0)}</b></span><span>Nota média <b>${x.averageRating||"—"}</b></span><span>V/E/D <b>${x.wins||0}/${x.draws||0}/${x.losses||0}</b></span><span>Finalizações <b>${x.shots||0}</b></span><span>No alvo <b>${x.onTarget||0}</b></span><span>xG <b>${x.xg||0}</b></span><span>Amarelos <b>${x.yellowCards||0}</b></span><span>Vermelhos <b>${x.redCards||0}</b></span></div>`;
    const compRows=dash.byCompetition.length?`<div class="tablewrap"><table><thead><tr><th>Competição</th><th>J</th><th>G</th><th>A</th><th>Min</th><th>Nota</th></tr></thead><tbody>${dash.byCompetition.map(x=>`<tr><td>${esc(x.name)}</td><td>${x.appearances}</td><td>${x.goals}</td><td>${x.assists}</td><td>${x.minutes}</td><td>${x.averageRating||"—"}</td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">Sem partidas nesta temporada.</div>';
    const seasonRows=insight.seasons.length?`<div class="tablewrap"><table><thead><tr><th>Temporada</th><th>Clube</th><th>J</th><th>G</th><th>A</th><th>Nota</th><th>GER final</th></tr></thead><tbody>${insight.seasons.map(x=>`<tr><td>${x.season}</td><td>${esc(x.club||"—")}</td><td>${x.appearances||0}</td><td>${x.goals||0}</td><td>${x.assists||0}</td><td>${Number(x.averageRating||0).toFixed(2)}</td><td>${x.overallEnd??"—"}</td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">Sem temporadas registradas.</div>';
    const clubs=insight.clubs.length?insight.clubs.map(x=>`<article class="award-card"><span>${x.seasons?.length?`${Math.min(...x.seasons)}${Math.max(...x.seasons)!==Math.min(...x.seasons)?`–${Math.max(...x.seasons)}`:""}`:"Carreira"}</span><h3>${esc(x.name)}</h3><b>${x.appearances}J · ${x.goals}G · ${x.assists}A</b><small>${x.minutes} minutos · nota ${x.averageRating||"—"}</small></article>`).join(""):'<div class="empty">Nenhum clube histórico disponível.</div>';
    const records=insight.records||{}, milestones=insight.milestones||[], recent=insight.recent||[];
    const timeline=insight.timeline.length?insight.timeline.slice(-20).reverse().map(x=>`<article class="news"><time>${x.season}</time><h3>${esc(x.label)}</h3><p>${esc(x.detail||"")}</p></article>`).join(""):'<div class="empty">A timeline será formada por eventos reais da carreira.</div>';
    return `<section class="card"><div class="tag">ESTATÍSTICAS DA CARREIRA</div><h2>${esc(dash.currentClub)} · Temporada ${s.season}</h2><p class="muted">Fonte canônica: registros persistidos de partidas, temporadas, clubes e Seleção.</p>${metrics(h)}</section>
    <div class="grid section"><section class="card"><h2>Carreira em clubes</h2>${metrics(dash.career)}<p><b>Total profissional:</b> ${insight.professional.appearances}J · ${insight.professional.goals}G · ${insight.professional.assists}A</p></section><section class="card"><h2>Forma recente</h2><div class="metric-row"><span><b>${insight.recentAverage||"—"}</b><small>Média últimos ${recent.length}</small></span><span><b>${recent.reduce((n,x)=>n+x.goals,0)}</b><small>Gols</small></span><span><b>${recent.reduce((n,x)=>n+x.assists,0)}</b><small>Assist.</small></span></div>${recent.map(x=>`<div class="event"><b>${x.rating.toFixed(1)}</b> ${esc(x.opponent)} · ${x.goals}G ${x.assists}A</div>`).join("")}</section></div>
    <section class="card section"><h2>Por competição</h2>${compRows}</section>
    <section class="card section"><h2>Temporadas</h2>${seasonRows}</section>
    <section class="card section"><h2>Clubes</h2><div class="award-grid">${clubs}</div></section>
    <div class="grid section"><section class="card"><h2>Seleção Brasileira</h2><div class="profile-data"><span>Jogos <b>${dash.national.caps||0}</b></span><span>Gols <b>${dash.national.goals||0}</b></span><span>Assist. <b>${dash.national.assists||0}</b></span><span>Titular <b>${dash.national.starts||0}</b></span></div></section><section class="card"><h2>Recordes pessoais</h2><div class="profile-data"><span>Gols em uma partida <b>${records.mostGoalsMatch||0}</b></span><span>Hat-tricks <b>${records.hatTricks||0}</b></span><span>Maior nota <b>${records.highestRating||"—"}</b></span><span>Maior GER <b>${records.highestOverall||root.ProLife.overall(s.person)}</b></span><span>Maior valor <b>R$ ${Number(records.highestMarketValue||0).toLocaleString("pt-BR")}</b></span></div>${insight.bestSeason?`<p><b>Melhor temporada registrada:</b> ${insight.bestSeason.season} · ${insight.bestSeason.goals||0}G · ${insight.bestSeason.assists||0}A · nota ${Number(insight.bestSeason.averageRating||0).toFixed(2)}</p>`:""}</section></div>
    <section class="card section"><h2>Marcos</h2>${milestones.length?`<div class="award-grid">${milestones.slice().reverse().map(x=>`<article class="award-card"><span>Temporada ${x.season}</span><h3>${esc(x.label)}</h3><small>Dia ${x.day}</small></article>`).join("")}</div>`:'<div class="empty">Os marcos começam no primeiro ponto confiável disponível do save.</div>'}</section>
    <section class="card section"><h2>Histórico / timeline</h2>${timeline}</section>
    <section class="card section"><div class="split"><div><div class="tag">LÍDERES DA COMPETIÇÃO</div><h2>${esc(current?.name||"Temporada")}</h2></div><label class="chart-select">Competição<select id="statistics-key">${competitions.map(item=>`<option value="${esc(item.id)}" ${item.id===id?"selected":""}>${esc(item.name)}</option>`).join("")}</select></label></div></section><div class="competition-grid section">${leaderTable(s,"Artilharia","goals",id)}${leaderTable(s,"Assistências","assists",id)}${leaderTable(s,"Melhores em campo","motm",id)}</div>`;
  }

  function DUMMY(s, competitions) { return root.ProLifeCompetitions.allStates(s).find((state) => state.entrants.includes(s.clubId))?.id || s.clubs.find((club) => club.id === s.clubId)?.leagueId || competitions[0]?.id; }
  function liveAwards(s, leagueId) {
    const S = root.ProLifeStatistics, minimum = /^serie[A-D]$/.test(leagueId) ? 5 : 2, data = [
      ["Artilheiro", S.leaders(s, "goals", 1, leagueId)[0]],
      ["Líder de assistências", S.leaders(s, "assists", 1, leagueId)[0]],
      ["Mais vezes melhor em campo", S.leaders(s, "motm", 1, leagueId)[0]],
      ["Craque da competição", S.bestRated(s, leagueId, minimum)],
    ];
    return data.filter(([, winner]) => winner).map(([name, winner]) => ({ name, winner: winner.name, winnerClub: winner.club, value: winner.value, live: true }));
  }
  function competitionFinished(s, id) {
    if (id === "copaBrasil") return Boolean(s.competitionSchedule?.cup?.champion);
    if (id.startsWith("state-")) return Boolean(root.ProLifeCompetitions.allStates(s).find((state) => state.id === id)?.champion);
    return s.competitions?.find((competition) => competition.id === id)?.status === "Finalizada";
  }
  function seasonTeam(s, id, type) {
    const S = root.ProLifeStatistics, minimum = type === "league" ? 5 : 1,
      current = S.teamOfSeason(s, id, minimum);
    if (current.length) return { season: s.season, players: current, live: !competitionFinished(s, id) };
    for (const season of S.init(s).root.seasons) {
      const stored = season.teams?.find((team) => team.competitionId === id);
      if (stored?.players?.length) return { season: season.season, players: stored.players, live: false };
    }
    return null;
  }
  function seasonTeamView(team) {
    if (!team) return '<div class="empty">O time da competição aparecerá quando houver partidas suficientes.</div>';
    const positionNames = { ATA: "Ataque", MEI: "Meio-campo", DEF: "Defesa", GOL: "Goleiro" }, order = ["ATA", "MEI", "DEF", "GOL"];
    return `<div class="season-xi"><div class="split"><div><div class="tag">${team.live ? "SELEÇÃO PARCIAL" : "TIME DA COMPETIÇÃO"}</div><h3>Time da temporada · ${team.season}</h3></div><span class="pill">4-3-3</span></div><p class="muted">Escolhido por nota média e desempenho na função: gols, assistências, defesas, desarmes e melhores em campo.</p><div class="xi-pitch">${order.map((position) => `<div class="xi-line ${position.toLowerCase()}"><small>${positionNames[position]}</small><div>${team.players.filter((player) => player.position === position).map((player) => { const highlight = position === "GOL" ? `${player.saves} defesas` : position === "DEF" ? `${player.tackles} desarmes` : position === "MEI" ? `${player.assists} assist.` : `${player.goals} gols`; return `<article><b>${esc(player.name)}</b><span>${esc(player.club)}</span><small>Nota ${Number(player.average).toFixed(1)} · ${highlight}</small></article>`; }).join("")}</div></div>`).join("")}</div></div>`;
  }
  function awards(s) {
    const stored = root.ProLifeStatistics.init(s).root.awards;
    const heroName=s.person?.name||"Jogador", won=stored.filter((a)=>a.winner===heroName), bySeason=new Map();
    for(const a of won){ if(!bySeason.has(a.season)) bySeason.set(a.season,[]); bySeason.get(a.season).push(a); }
    const S = root.ProLifeStatistics, overall = [
      ["Melhor jogador do ano", S.bestRated(s)], ["Revelação do ano", S.bestYoung(s)],
      ["Artilheiro do ano", S.leaders(s, "goals", 1)[0]], ["Líder de assistências do ano", S.leaders(s, "assists", 1)[0]],
      ["Melhor técnico", S.bestCoach(s)],
    ].filter(([, winner]) => winner).map(([name, winner]) => ({ name, winner: winner.name, winnerClub: winner.club, value: winner.value, live: true }));
    const overallStored = stored.filter((award) => award.leagueId === "overall").slice(0, 15), competitions = root.ProLifeCompetitions.statCompetitions(s);
    const section = (competition, open = false) => {
      const live = liveAwards(s, competition.id), finished = stored.filter((award) => award.leagueId === competition.id).slice(0, 8), rows = live.concat(finished), team = seasonTeam(s, competition.id, competition.type);
      return `<details class="card section" ${open ? "open" : ""}><summary><b>${esc(competition.name)}</b> · ${live.length ? "parcial e histórico" : "histórico"}</summary>${rows.length ? `<div class="award-grid section">${rows.map((award) => `<article class="award-card"><span>${award.live ? "Temporada em andamento" : "Temporada " + award.season}</span><h3>${esc(award.name)}</h3><b>${esc(award.winner)}</b><small>${esc(award.winnerClub || "Clube não registrado")}</small><small>${award.value} registro(s)</small></article>`).join("")}</div>` : '<div class="empty">Os líderes aparecerão após as primeiras partidas.</div>'}${seasonTeamView(team)}</details>`;
    };
    const overallRows = overall.concat(overallStored);
    const rankCompetition=competitions.find(c=>c.id===(s.clubs.find(x=>x.id===s.clubId)?.leagueId))||competitions[0], rank=rankCompetition?S.rankingDashboard(s,rankCompetition.id,10):null;
    const rankingTable=(title,rows,valueLabel)=>`<section class="card section"><h3>${title}</h3>${rows?.length?`<div class="tablewrap"><table><thead><tr><th>#</th><th>Jogador</th><th>Clube</th><th>J</th><th>${valueLabel}</th></tr></thead><tbody>${rows.map((x,i)=>`<tr class="${x.id==="hero"?"hero-row":""}"><td>${i+1}</td><td><b>${esc(x.name)}</b></td><td>${esc(x.club)}</td><td>${x.appearances||0}</td><td><b>${valueLabel==="Nota"?Number(x.average||x.value||0).toFixed(2):x.value??x.score??0}</b></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">Ainda não há partidas suficientes.</div>'}</section>`;
    const rankings=rank?`<section class="card"><div class="tag">PRÊMIOS & RANKINGS</div><h2>${esc(rankCompetition.name)} · ${s.season}</h2><p class="muted">Dados canônicos das partidas. Sua posição nunca é alterada artificialmente.</p></section>${rankingTable("Artilharia",rank.goals,"Gols")}${rankingTable("Assistências",rank.assists,"Assist.")}${rankingTable("Desempenho",rank.performance.map(x=>({...x,value:x.average})),"Nota")}`:"";
    return `${rankings}<section class="card"><div class="tag">PRÊMIOS 3.0</div><h2 class="section">Galeria da carreira</h2><p class="muted">Acompanhe disputas em andamento e preserve cada reconhecimento conquistado por temporada e competição.</p><div class="metric-row"><span><b>${won.length}</b><small>Prêmios conquistados</small></span><span><b>${bySeason.size}</b><small>Temporadas premiadas</small></span><span><b>${won.filter(a=>a.leagueId==="overall").length}</b><small>Prêmios anuais</small></span></div>${won.length?`<h3 class="section">Sala de troféus pessoal</h3><div class="award-grid">${won.slice(0,24).map(a=>`<article class="award-card"><span>Temporada ${a.season} · ${esc(a.league||"Geral")}</span><h3>${esc(a.name)}</h3><b>${esc(a.winner)}</b><small>${esc(a.winnerClub||"Clube não registrado")}</small></article>`).join("")}</div>`:'<div class="empty section">Sua sala de troféus será preenchida quando você conquistar um prêmio.</div>'}<h3 class="section">Disputas e histórico geral</h3>${overallRows.length ? `<div class="award-grid">${overallRows.map((award) => `<article class="award-card"><span>${award.live ? "Temporada em andamento" : "Temporada " + award.season}</span><h3>${esc(award.name)}</h3><b>${esc(award.winner)}</b><small>${esc(award.winnerClub || "Clube não registrado")}</small><small>${award.value} registro(s)</small></article>`).join("")}</div>` : '<div class="empty">Os melhores do ano aparecerão após as primeiras partidas.</div>'}</section>${competitions.map((competition) => section(competition, competition.id === DUMMY(s, competitions) || competition.id === "copaBrasil")).join("")}`;
  }
  const api = { competitions, statistics, awards };
  root.ProLifeExpansion = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
