(function (root) {
  "use strict";
  function init(s) {
    if (!s.statistics) s.statistics = { players: {}, awards: [], seasons: [] };
    const hero = s.statistics.players.hero || (s.statistics.players.hero = { appearances: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0 });
    return { root: s.statistics, hero };
  }
  function recordMatch(s, m) {
    const stats = init(s).root;
    for (const ids of m.participants || []) for (const id of new Set(ids)) {
      const row = stats.players[id] || (stats.players[id] = { appearances: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0 });
      row.appearances++;
      row.ratingTotal += Number(m.ratings?.[id] || 0);
    }
    for (const e of m.events || []) {
      if (e.type === "goal" && e.playerId) (stats.players[e.playerId] || (stats.players[e.playerId] = { appearances: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0 })).goals++;
      if (e.assistPlayerId) (stats.players[e.assistPlayerId] || (stats.players[e.assistPlayerId] = { appearances: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0 })).assists++;
    }
    const best = Object.entries(m.ratings || {}).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 7.5) stats.players[best[0]].motm++;
  }
  function leaders(s, field, limit = 10) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const p = id === "hero" ? s.person : s.clubs.flatMap((c) => c.roster).find((x) => x.id === id);
      return { id, name: p?.name || "Atleta", club: s.clubs.find((c) => c.roster.some((x) => x.id === id))?.name || "—", value: row[field] || 0 };
    }).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, limit);
  }
  function closeSeason(s) {
    const stats = init(s).root, goals = leaders(s, "goals", 1)[0], assists = leaders(s, "assists", 1)[0], motm = leaders(s, "motm", 1)[0];
    const awards = [
      goals && { season: s.season, name: "Artilheiro", winner: goals.name, value: goals.value },
      assists && { season: s.season, name: "Líder de assistências", winner: assists.name, value: assists.value },
      motm && { season: s.season, name: "Mais vezes melhor em campo", winner: motm.name, value: motm.value },
    ].filter(Boolean);
    stats.awards.unshift(...awards);
    stats.awards = stats.awards.slice(0, 100);
    stats.seasons.unshift({ season: s.season, awards });
    return awards;
  }
  const api = { init, recordMatch, leaders, closeSeason };
  root.ProLifeStatistics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
