(function (root) {
  "use strict";
  const catalog = [
    ["serieA", "Brasileirão Série A", "league", "complete"],
    ["serieB", "Brasileirão Série B", "league", "complete"],
    ["serieC", "Brasileirão Série C", "league", "partial"],
    ["serieD", "Brasileirão Série D", "league", "partial"],
    ["copaBrasil", "Copa do Brasil", "cup", "simulated"],
    ["paulista", "Campeonato Paulista", "state", "simulated"],
    ["carioca", "Campeonato Carioca", "state", "simulated"],
    ["mineiro", "Campeonato Mineiro", "state", "simulated"],
    ["gaucho", "Campeonato Gaúcho", "state", "simulated"],
    ["paranaense", "Campeonato Paranaense", "state", "simulated"],
    ["pernambucano", "Campeonato Pernambucano", "state", "simulated"],
  ].map(([id, name, type, coverage]) => ({ id, name, type, coverage }));
  function init(s) {
    if (!s.competitions) s.competitions = catalog.map((c) => ({ ...c, season: s.season, status: c.type === "league" ? "Em andamento" : "Calendário complementar", champion: null }));
    return s.competitions;
  }
  function closeSeason(s, table) {
    for (const c of init(s)) {
      c.season = s.season;
      if (c.type === "league") c.champion = table(s, c.id)[0]?.name || null;
      else {
        const eligible = s.clubs.filter((x) => c.id === "copaBrasil" || x.city.includes(c.name.split(" ").at(-1)));
        c.champion = (eligible[0] || s.clubs[(s.season + c.id.length) % s.clubs.length])?.name || null;
      }
      c.status = "Finalizada";
    }
  }
  function nextSeason(s) {
    for (const c of init(s)) Object.assign(c, { season: s.season, status: c.type === "league" ? "Em andamento" : "Calendário complementar", champion: null });
  }
  const api = { catalog, init, closeSeason, nextSeason };
  root.ProLifeCompetitions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
