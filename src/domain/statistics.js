(function (root) {
  "use strict";
  const fields = ["appearances", "goals", "assists", "motm", "ratingTotal"];
  const blank = () => ({ appearances: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0, byCompetition: {} });
  function normalize(row) {
    const value = row || blank();
    for (const key of fields) if (!Number.isFinite(value[key])) value[key] = 0;
    if (!value.byCompetition || typeof value.byCompetition !== "object") value.byCompetition = {};
    return value;
  }
  function competitionRow(row, id) {
    const normalized = normalize(row), key = id || "career";
    return normalized.byCompetition[key] || (normalized.byCompetition[key] = { appearances: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0 });
  }
  function init(s) {
    if (!s.statistics) s.statistics = { players: {}, awards: [], seasons: [] };
    for (const [id, row] of Object.entries(s.statistics.players || {})) s.statistics.players[id] = normalize(row);
    const hero = s.statistics.players.hero || (s.statistics.players.hero = blank());
    return { root: s.statistics, hero };
  }
  function add(stats, id, competitionId, field, value = 1) {
    const row = stats.players[id] || (stats.players[id] = blank());
    row[field] += value;
    competitionRow(row, competitionId)[field] += value;
  }
  function recordMatch(s, m) {
    const stats = init(s).root, competitionId = m.competitionId || m.leagueId || "career";
    for (const ids of m.participants || []) for (const id of new Set(ids)) {
      add(stats, id, competitionId, "appearances");
      add(stats, id, competitionId, "ratingTotal", Number(m.ratings?.[id] || 0));
    }
    for (const e of m.events || []) {
      if (e.type === "goal" && e.playerId) add(stats, e.playerId, competitionId, "goals");
      if (e.assistPlayerId) add(stats, e.assistPlayerId, competitionId, "assists");
    }
    const best = Object.entries(m.ratings || {}).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 7.5) add(stats, best[0], competitionId, "motm");
  }
  function playerAndClub(s, id) {
    if (id === "hero") return { player: s.person, club: s.clubs.find((c) => c.roster.some((x) => x.id === id)) };
    for (const club of s.clubs) {
      const player = club.roster.find((x) => x.id === id);
      if (player) return { player, club };
    }
    return {};
  }
  function leaders(s, field, limit = 10, competitionId = null) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const source = competitionId ? normalize(row).byCompetition[competitionId] : row;
      const { player, club } = playerAndClub(s, id);
      return { id, name: player?.name || "Atleta", club: club?.name || "—", clubId: club?.id || null, value: source?.[field] || 0, appearances: source?.appearances || 0, ratingTotal: source?.ratingTotal || 0 };
    }).filter((x) => x.value > 0 || x.appearances > 0).sort((a, b) => b.value - a.value || b.appearances - a.appearances || a.name.localeCompare(b.name)).slice(0, limit);
  }
  function bestRated(s, competitionId) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const source = normalize(row).byCompetition[competitionId], { player, club } = playerAndClub(s, id);
      return { id, name: player?.name || "Atleta", club: club?.name || "—", clubId: club?.id || null, value: source?.appearances ? +(source.ratingTotal / source.appearances).toFixed(2) : 0, appearances: source?.appearances || 0 };
    }).filter((x) => x.appearances >= 5).sort((a, b) => b.value - a.value || b.appearances - a.appearances)[0] || null;
  }
  function award(season, leagueId, name, winner) {
    return winner && { season, leagueId, league: root.ProLifeCompetitions?.leagueNames?.[leagueId] || leagueId, name, winner: winner.name, winnerClub: winner.club, clubId: winner.clubId, value: winner.value };
  }
  function closeSeason(s) {
    const stats = init(s).root, awards = [];
    for (const league of s.leagues || []) {
      if (!/^serie[A-D]$/.test(league.id)) continue;
      awards.push(
        award(s.season, league.id, "Artilheiro", leaders(s, "goals", 1, league.id)[0]),
        award(s.season, league.id, "Líder de assistências", leaders(s, "assists", 1, league.id)[0]),
        award(s.season, league.id, "Mais vezes melhor em campo", leaders(s, "motm", 1, league.id)[0]),
        award(s.season, league.id, "Craque da temporada", bestRated(s, league.id)),
      );
    }
    const valid = awards.filter(Boolean);
    stats.awards.unshift(...valid);
    stats.awards = stats.awards.slice(0, 200);
    stats.seasons.unshift({ season: s.season, awards: valid });
    for (const row of Object.values(stats.players)) {
      for (const league of s.leagues || []) delete normalize(row).byCompetition[league.id];
    }
    return valid;
  }
  const api = { init, recordMatch, leaders, bestRated, closeSeason };
  root.ProLifeStatistics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
