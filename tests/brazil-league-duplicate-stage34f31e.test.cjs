"use strict";
// Correcao: "Liga do Brasil" do catalogo FC27 (so o Bahia) nao pode aparecer como segunda competicao brasileira.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js"); global.ProLifeWorldStats = D.WorldStats;
global.ProLifeNationalIdentity = require("../src/domain/national-identity.js"); global.ProLifeCareerContext = require("../src/domain/career-context.js");
global.ProLifeStatistics = D.Statistics; global.ProLifeCompetitions = D.Competitions;
const Hub = require("../src/ui/competitions-hub-view.js"), E = require("../src/ui/expansion.js");
const LDB = "gf_fc27_liga_do_brasil", visible = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/(value|data-[a-z-]+)="[^"]*"/g, "");
const make = (seed = 5) => D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed);

test("Liga do Brasil (1) Bahia: ids do catalogo e local distintos, preservados e sem fusao", () => {
  const s = make(); const gf = s.globalFootball.clubs.find((c) => c.id === "gf_fc27_1598"), local = s.clubs.find((c) => c.id === "c2");
  assert.ok(gf && local && gf.name === "Bahia" && local.name === "Bahia"); assert.notEqual(gf.id, local.id);
  assert.equal(local.leagueId, "serieA"); assert.equal(gf.leagueId, LDB);
  assert.equal(s.globalFootball.clubs.filter((c) => c.leagueId === LDB).length, 1);
  const n = D.GlobalFootball.allPlayers(s).filter((p) => String(p.id).startsWith("fc27_p_")).length; assert.ok(n > 17000);
});

test("Liga do Brasil (2) nao aparece como competicao nacional independente nem como consulta", () => {
  const s = make(); const cat = Hub.catalog(s, D), e = cat.find((c) => c.id === LDB);
  assert.ok(e && e.kind === "catalogo" && e.status === "catalog_info");
  Hub.setFilter("continent", "ALL"); Hub.setFilter("country", "ALL"); Hub.setSection("ligas"); Hub.back();
  const html = Hub.render(s, D); assert.ok(!html.includes(`data-ch-open="${LDB}"`), "sem card clicavel");
  assert.ok(html.includes("INFORMAÇÃO DO CATÁLOGO FC 27") && /não é uma competição independente/i.test(html));
  const cards = (visible(html).match(/Somente consulta/g) || []).length; assert.ok(!/Liga do Brasil<\/b><\/div><span class="ch-chip off">Somente consulta/.test(html), "nao como Somente consulta");
  for (const l of ["Série A", "Série B", "Série C", "Série D"]) assert.ok(html.includes(l), l);
});

test("Liga do Brasil (3) Brasileirao A/B/C/D continuam jogaveis", () => {
  const s = make(); const cat = Hub.catalog(s, D);
  for (const id of ["serieA", "serieB", "serieC", "serieD"]) assert.equal(cat.find((c) => c.id === id).status, "playable", id);
});

test("Liga do Brasil (4) seletor de estatisticas nao lista a Liga do Brasil como opcao de catalogo", () => {
  const s = make(); for (let i = 0; i < 20; i++) D.advance(s, 1); const h = E.statistics(s, "");
  assert.ok(!visible(h).includes("Liga do Brasil")); assert.ok(h.includes('<option value="serieA"'));
});

test("Liga do Brasil (5) paises nao resolvidos nao viram Brasil (Thailand, Irlanda)", () => {
  const s = make(); const c = (id) => s.globalFootball.leagues.find((l) => l.id === id).country;
  assert.notEqual(c("gf_fc27_thailand_league"), "Brasil"); assert.notEqual(c("gf_fc27_sse_airtricity_men_s_premier_division"), "Brasil");
  assert.deepEqual(s.globalFootball.leagues.filter((l) => l.country === "Brasil").map((l) => l.id), [LDB]);
  const html = Hub.render(s, D); Hub.setSection("ligas"); assert.ok(visible(Hub.render(s, D)).includes("Thailand League"));
});

test("Liga do Brasil (6) save/load mantem o tratamento; manifesto original intacto", () => {
  const s = make(); const copy = JSON.parse(JSON.stringify(s));
  assert.equal(Hub.catalog(copy, D).find((c) => c.id === LDB).status, "catalog_info");
  const m = JSON.parse(fs.readFileSync(require.resolve("../src/data/fc27/fc27-manifest-v1.json"), "utf8"));
  assert.ok(m.leagues.some((l) => l.id === LDB), "liga continua no manifesto"); assert.equal(m.leagues.length, 49);
});
