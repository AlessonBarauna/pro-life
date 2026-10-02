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
    const competitions = root.ProLifeCompetitions.statCompetitions(s), id = competitions.some((item) => item.id === selected) ? selected : DUMMY(s, competitions), current = competitions.find((item) => item.id === id);
    return `<section class="card"><div class="split"><div><div class="tag">ESTATÍSTICAS POR COMPETIÇÃO</div><h2>${esc(current?.name || "Temporada")}</h2></div><label class="chart-select">Competição<select id="statistics-key">${competitions.map((item) => `<option value="${esc(item.id)}" ${item.id === id ? "selected" : ""}>${esc(item.name)}</option>`).join("")}</select></label></div><p class="muted">Escolha Brasileirão, Copa do Brasil ou qualquer estadual para consultar seus líderes.</p></section><div class="competition-grid section">${leaderTable(s, "Artilharia", "goals", id)}${leaderTable(s, "Assistências", "assists", id)}${leaderTable(s, "Melhores em campo", "motm", id)}</div>`;
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
    return `<section class="card"><div class="tag">GALERIA DA CARREIRA</div><h2 class="section">Prêmios e reconhecimentos</h2><p class="muted">Prêmios gerais somam todas as competições. Brasileirão, Copa do Brasil e estaduais também possuem artilheiro, assistências, melhores em campo, craque e time da temporada próprios.</p>${overallRows.length ? `<div class="award-grid">${overallRows.map((award) => `<article class="award-card"><span>${award.live ? "Temporada em andamento" : "Temporada " + award.season}</span><h3>${esc(award.name)}</h3><b>${esc(award.winner)}</b><small>${esc(award.winnerClub || "Clube não registrado")}</small><small>${award.value} registro(s)</small></article>`).join("")}</div>` : '<div class="empty">Os melhores do ano aparecerão após as primeiras partidas.</div>'}</section>${competitions.map((competition) => section(competition, competition.id === DUMMY(s, competitions) || competition.id === "copaBrasil")).join("")}`;
  }
  const api = { competitions, statistics, awards };
  root.ProLifeExpansion = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
