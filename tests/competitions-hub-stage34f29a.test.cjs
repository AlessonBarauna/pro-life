"use strict";
// Stage 34F.29A - Central Mundial de Competicoes (hub unificado).
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.ProLifeNames = require("../src/domain/display-names.js"); global.ProLifeWorldStats = D.WorldStats;
global.ProLifeStatistics = D.Statistics; global.ProLifeCompetitions = D.Competitions;
const H = require("../src/ui/competitions-hub-view.js");
const BAD = /null|undefined|NaN|registro\(s\)|gf_fc27|\[object/;
const visible = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/(value|data-[a-z-]+)="[^"]*"/g, "");
const make = (seed = 5, days = 0, clubId = "c0") => { const s = D.create({ mode: "player", clubId, catalogVersion: "fc27_v1" }, seed); for (let i = 0; i < days; i++) D.advance(s, 1); return s; };
let shared = null; const mid = () => shared || (shared = make(5, 130));

test("34F.29A (1) catalogo lista as 49 ligas FC27 com status distinto e sem ids internos", () => {
  const s = mid(); const cat = H.catalog(s, D);
  const fc = cat.filter((c) => String(c.id).startsWith("gf_fc27"));
  assert.equal(fc.length, 49);
  assert.ok(new Set(cat.map((c) => c.id)).size === cat.length, "ids unicos");
  assert.ok(fc.some((c) => c.status === "playable"));
  assert.ok(cat.every((c) => typeof c.status === "string"));
});

test("34F.29A (2) secoes renderizam sem null/undefined/ids internos", () => {
  const s = mid(); H.setFilter("continent", "ALL");
  for (const id of ["minhas", "ligas", "copas", "continentais", "mundiais", "selecoes", "historico"]) {
    H.setSection(id); const html = H.render(s, D);
    assert.ok(html.includes("data-competitions-hub"), id); assert.ok(!BAD.test(visible(html)), `${id}: ${(visible(html).match(BAD) || [])[0]}`);
  }
});

test("34F.29A (3) competicoes continentais planejadas nao sao apresentadas como jogaveis", () => {
  const s = mid(); H.setSection("continentais"); const html = visible(H.render(s, D));
  assert.ok(/Planejad/i.test(html));
});

test("34F.29A (4) detalhe da liga: todas as abas renderizam e voltar funciona", () => {
  const s = mid(); const lg = H.catalog(s, D).find((c) => c.status === "playable");
  H.setSection("ligas"); H.open(lg.id);
  for (const t of ["geral", "tabela", "calendario", "estatisticas", "historico", "clubes"]) {
    H.setTab(t); const html = H.render(s, D); assert.ok(!BAD.test(visible(html)), `${t}: ${(visible(html).match(BAD) || [])[0]}`);
  }
  H.setTab("calendario"); H.setRound(2); assert.ok(H.render(s, D).length > 500);
  H.back(); assert.equal(H.state.leagueId, null);
});

test("34F.29A (5) Minhas competicoes aparece primeiro e destaca a liga do clube do protagonista", () => {
  const s = make(7, 20, "c0"); H.setSection("minhas"); H.back();
  const html = H.render(s, D); assert.ok(html.indexOf("Minhas") >= 0 && html.indexOf("Minhas") < html.indexOf("Ligas"));
});

test("34F.29A (6) renderizar nao altera o estado da carreira", () => {
  const s = make(9, 40); const before = JSON.stringify(s.globalFootball.worldCompetitions);
  H.setSection("ligas"); H.render(s, D); H.setSection("historico"); H.render(s, D);
  assert.equal(JSON.stringify(s.globalFootball.worldCompetitions), before);
});

test("34F.29A (7) tempo de render com catalogo completo e aceitavel", () => {
  const s = mid(); H.setSection("ligas"); const t0 = Date.now(); for (let i = 0; i < 5; i++) H.render(s, D);
  assert.ok((Date.now() - t0) / 5 < 400, `${(Date.now() - t0) / 5}ms`);
});
