(function (root) {
  "use strict";
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function competitions(s) {
    const list = root.ProLifeCompetitions.init(s);
    return `<section class="card"><div class="tag">CALENDÁRIO NACIONAL</div><h2 class="section">Competições disponíveis</h2><p class="muted">Séries A e B têm elencos de referência completos na base. Séries C e D possuem cobertura parcial; atributos, resultados e demais torneios são simulações.</p><div class="competition-grid">${list.map((c) => `<article class="competition-card"><span class="pill">${esc(c.type === "league" ? "LIGA" : c.type === "cup" ? "COPA" : "ESTADUAL")}</span><h3>${esc(c.name)}</h3><p>${esc(c.status)}</p><small>Cobertura: ${esc({ complete: "referência completa", partial: "parcial", simulated: "simulada" }[c.coverage])}</small>${c.champion ? `<b>Campeão: ${esc(c.champion)}</b>` : ""}</article>`).join("")}</div></section>`;
  }
  function statistics(s) {
    const S = root.ProLifeStatistics, rows = ["goals", "assists", "motm"].map((field) => [field, S.leaders(s, field)]);
    const labels = { goals: "Artilharia", assists: "Assistências", motm: "Melhores em campo" };
    return `<div class="grid3">${rows.map(([field, list]) => `<section class="card"><h2>${labels[field]}</h2><div class="tablewrap"><table><thead><tr><th>#</th><th>Atleta</th><th>Total</th></tr></thead><tbody>${list.map((p, i) => `<tr><td>${i + 1}</td><td>${esc(p.name)}<small>${esc(p.club)}</small></td><td><b>${p.value}</b></td></tr>`).join("")}</tbody></table></div></section>`).join("")}</div>`;
  }
  function awards(s) {
    const awards = root.ProLifeStatistics.init(s).root.awards;
    return `<section class="card"><div class="tag">GALERIA DA CARREIRA</div><h2 class="section">Prêmios e reconhecimentos</h2>${awards.length ? `<div class="award-grid">${awards.map((a) => `<article class="award-card"><span>Temporada ${a.season}</span><h3>${esc(a.name)}</h3><b>${esc(a.winner)}</b><small>${a.value} registro(s)</small></article>`).join("")}</div>` : '<div class="empty">Os prêmios são consolidados ao final da temporada.</div>'}</section>`;
  }
  const api = { competitions, statistics, awards };
  root.ProLifeExpansion = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
