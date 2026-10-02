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
    return `<section class="card section"><div class="split"><div><div class="tag">MATA-MATA NACIONAL</div><h2>Copa do Brasil</h2></div><span class="pill">${esc(cup.status)}</span></div><p>${esc(cup.format)}</p>${cup.champion ? `<div class="notice"><b>Campeão: ${esc(cup.champion)}</b><br>Vice: ${esc(cup.runnerUp)}</div>` : ""}<div class="tablewrap"><table><thead><tr><th>Rank</th><th>Clube</th><th>Divisão atual</th><th>Classificação</th></tr></thead><tbody>${cup.entrants.map((entry) => { const c = club(s, entry.clubId); return `<tr class="${entry.clubId === s.clubId ? "highlight" : ""}"><td>#${entry.rank}</td><td>${esc(c?.name)}</td><td>${esc(league(s, c?.leagueId))}</td><td>${esc(entry.qualifiedBy)}</td></tr>`; }).join("")}</tbody></table></div><div class="section">${rounds}</div></section>`;
  }
  function stateView(s, state) {
    if (!state) return `<section class="card section"><h2>Campeonato estadual</h2><div class="empty">Assine com um clube para definir o estadual da carreira.</div></section>`;
    const t = state.stats;
    return `<section class="card section"><div class="split"><div><div class="tag">CALENDÁRIO DO SEU CLUBE</div><h2>${esc(state.name)}</h2></div><span class="pill">${esc(state.status)}</span></div><p>Somente os compromissos do clube da carreira são processados; os demais jogos estaduais não são simulados.</p><div class="stats"><div class="stat"><small>Jogos</small><b>${t.played}</b></div><div class="stat"><small>Pontos</small><b>${t.points}</b></div><div class="stat"><small>Vitórias</small><b>${t.w}</b></div><div class="stat"><small>Saldo</small><b>${t.gf - t.ga}</b></div></div>${state.champion ? `<p class="good">Campeão simulado: ${esc(state.champion)}</p>` : ""}<div class="fixture-list">${state.fixtures.map((f) => `<div class="news"><small>${date(f.date)}</small> ${esc(club(s, f.home)?.name)} ${f.played ? `<b>${f.hg} × ${f.ag}</b>` : "×"} ${esc(club(s, f.away)?.name)}</div>`).join("")}</div></section>`;
  }
  function competitions(s) {
    root.ProLifeCompetitions.init(s);
    const schedule = s.competitionSchedule || {};
    return `<section class="card"><div class="tag">PIRÂMIDE NACIONAL</div><h2 class="section">Competições disponíveis</h2><p class="muted">As quatro divisões são simuladas integralmente. A Copa do Brasil usa 32 clubes nesta adaptação; o estadual processa somente os jogos do clube da carreira.</p><div class="competition-grid">${leagueCards(s)}</div></section>${stateView(s, schedule.state)}${cupView(s, schedule.cup)}`;
  }
  function statistics(s) {
    const S = root.ProLifeStatistics;
    return `<div class="competition-grid">${s.leagues.map((l) => `<section class="card"><div class="tag">${esc(l.name)}</div><h2>Artilharia</h2><div class="tablewrap"><table><thead><tr><th>#</th><th>Atleta / clube</th><th>Gols</th></tr></thead><tbody>${S.leaders(s, "goals", 8, l.id).map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.name)}<small>${esc(p.club)}</small></td><td><b>${p.value}</b></td></tr>`).join("")}</tbody></table></div></section>`).join("")}</div>`;
  }
  function liveAwards(s, leagueId) {
    const S = root.ProLifeStatistics, data = [
      ["Artilheiro", S.leaders(s, "goals", 1, leagueId)[0]],
      ["Líder de assistências", S.leaders(s, "assists", 1, leagueId)[0]],
      ["Mais vezes melhor em campo", S.leaders(s, "motm", 1, leagueId)[0]],
      ["Craque da temporada", S.bestRated(s, leagueId)],
    ];
    return data.filter(([, winner]) => winner).map(([name, winner]) => ({ name, winner: winner.name, winnerClub: winner.club, value: winner.value, live: true }));
  }
  function awards(s) {
    const stored = root.ProLifeStatistics.init(s).root.awards;
    return `<section class="card"><div class="tag">GALERIA DA CARREIRA</div><h2 class="section">Prêmios e reconhecimentos por divisão</h2><p class="muted">Cada prêmio mostra o atleta e o clube defendido. Durante a temporada, os líderes aparecem como parciais; na virada, os vencedores são arquivados.</p></section>${s.leagues.map((l) => { const live = liveAwards(s, l.id), finished = stored.filter((a) => a.leagueId === l.id).slice(0, 8), rows = live.concat(finished); return `<section class="card section"><div class="split"><h2>${esc(l.name)}</h2><span class="pill">${live.length ? "PARCIAL + HISTÓRICO" : "HISTÓRICO"}</span></div>${rows.length ? `<div class="award-grid">${rows.map((a) => `<article class="award-card"><span>${a.live ? "Temporada em andamento" : "Temporada " + a.season}</span><h3>${esc(a.name)}</h3><b>${esc(a.winner)}</b><small>${esc(a.winnerClub || "Clube não registrado")}</small><small>${a.value} registro(s)</small></article>`).join("")}</div>` : '<div class="empty">Os líderes aparecerão após as primeiras partidas da divisão.</div>'}</section>`; }).join("")}`;
  }
  const api = { competitions, statistics, awards };
  root.ProLifeExpansion = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
