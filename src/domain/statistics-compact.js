(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ProLifeStatisticsCompact = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  // Stage 31.8D/B3 - proposta isolada (NAO integrada) para a Stage 31.8E.
  // Representacao esparsa: campos numericos de estatistica iguais a 0 sao omitidos; ausente = 0.
  // Funcoes puras: nunca alteram o objeto recebido e nao dependem de statistics.js.
  const FIELDS = ["appearances", "starts", "minutes", "goals", "assists", "motm", "ratingTotal", "saves", "tackles", "shots", "onTarget", "xg", "yellowCards", "redCards", "wins", "draws", "losses", "hatTricks", "cleanSheets"];
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

  function sparseRow(row) {
    const out = {};
    for (const k of Object.keys(row)) {
      const v = row[k];
      if (k === "byCompetition" || k === "byClub") { out[k] = {}; for (const id of Object.keys(v || {})) out[k][id] = sparseRow(v[id]); }
      else if (FIELDS.includes(k) && v === 0) continue;
      else out[k] = v;
    }
    return out;
  }
  function denseRow(row, withMaps) {
    const out = {};
    for (const k of FIELDS) out[k] = Number.isFinite(row[k]) ? row[k] : 0;
    for (const k of Object.keys(row)) {
      if (k === "byCompetition" || k === "byClub") continue;
      if (!FIELDS.includes(k)) out[k] = row[k];
    }
    if (withMaps) {
      out.byCompetition = {}; out.byClub = {};
      for (const id of Object.keys(row.byCompetition || {})) out.byCompetition[id] = denseRow(row.byCompetition[id], false);
      for (const id of Object.keys(row.byClub || {})) out.byClub[id] = denseRow(row.byClub[id], false);
    }
    return out;
  }
  // Retorna copia de `statistics` com players esparsos. Nunca cria registros nem muta a entrada.
  function compact(statistics) {
    if (!isObj(statistics) || !isObj(statistics.players)) return statistics;
    const players = {};
    for (const id of Object.keys(statistics.players)) players[id] = isObj(statistics.players[id]) ? sparseRow(statistics.players[id]) : statistics.players[id];
    return { ...statistics, players };
  }
  // Aceita formato antigo (completo) ou esparso; devolve sempre a forma completa que statistics.js espera.
  function expand(statistics) {
    if (!isObj(statistics) || !isObj(statistics.players)) return statistics;
    const players = {};
    for (const id of Object.keys(statistics.players)) players[id] = isObj(statistics.players[id]) ? denseRow(statistics.players[id], true) : statistics.players[id];
    return { ...statistics, players };
  }
  return { FIELDS, compact, expand };
});
