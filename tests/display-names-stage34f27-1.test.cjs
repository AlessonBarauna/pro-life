"use strict";
// Stage 34F.27.1 - nomes de clubes/competicoes FC 27 na apresentacao (estatisticas, temporadas, historico) sem tocar nos IDs salvos.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const D = require("../src/domain/engine.js"); global.ProLife = D;
const N = require("../src/domain/display-names.js"); global.ProLifeNames = N;
const S = D.Statistics, X = require("../src/ui/expansion.js");
const LALIGA = "gf_fc27_laliga_ea_sports", BETIS = "gf_fc27_449";
const mk = (catalog = "fc27_v1") => { const s = D.create(catalog ? { mode: "player", clubId: "c0", catalogVersion: catalog } : { mode: "player", clubId: "c0" }, 5); S.init(s); return s; };
const withHistory = (s) => {
  const h = s.statistics.players.hero; h.byCompetition = { ...(h.byCompetition || {}), [LALIGA]: { appearances: 4, goals: 2, assists: 1, minutes: 300, ratingTotal: 28, starts: 4 } };
  s.statistics.heroStints = [
    { season: s.season - 1, clubId: BETIS, club: BETIS, startDay: 0, endDay: 300, transferType: "season", appearances: 10, starts: 9, minutes: 800, goals: 3, assists: 2, ratingTotal: 70 },
    { season: s.season, clubId: s.clubId, club: s.clubs.find((c) => c.id === s.clubId).name, startDay: 0, endDay: null, transferType: "current", appearances: 2, starts: 2, minutes: 180, goals: 0, assists: 0, ratingTotal: 14 },
  ];
  h.byClub = { ...(h.byClub || {}), [BETIS]: { appearances: 10, goals: 3, assists: 2, minutes: 800, ratingTotal: 70 } };
  return s;
};

test("34F.27.1 (1) resolvedor: LaLiga e gf_fc27_449 pelo catalogo, sem inventar", () => {
  const s = mk();
  assert.equal(N.league(s, LALIGA), s.globalFootball.leagues.find((l) => l.id === LALIGA).name);
  assert.equal(N.club(s, BETIS), "Real Betis");
  assert.equal(N.club(s, "gf_fc27_999999"), N.UNKNOWN_CLUB); assert.equal(N.league(s, "gf_fc27_nada"), N.UNKNOWN_COMP);
  assert.equal(N.club(s, "gf_fc27_999999", "gf_fc27_999999"), N.UNKNOWN_CLUB, "nome armazenado que e ID nao vaza");
  assert.equal(N.club(s, "x_legado"), "x_legado"); assert.equal(N.league(s, "serieA"), s.leagues.find((l) => l.id === "serieA").name);
  assert.equal(N.club(s, "gf_fc27_999999", "Nome Gravado"), "Nome Gravado");
  assert.equal(N.club(null, "c0"), "c0"); assert.equal(N.club(s, null, "x"), "x"); assert.equal(N.text(s, "Real Madrid"), "Real Madrid");
});

test("34F.27.1 (2) estatisticas por competicao e historico de temporadas mostram nomes", () => {
  const s = withHistory(mk());
  const dash = S.heroDashboard(s), comp = dash.byCompetition.find((c) => c.id === LALIGA);
  assert.ok(comp && comp.name !== LALIGA && !/^gf_/.test(comp.name)); assert.equal(comp.name, N.league(s, LALIGA));
  assert.equal(dash.byClub.find((c) => c.id === BETIS).name, "Real Betis");
  const ins = S.careerInsights(s); assert.ok(ins.clubs.some((c) => c.name === "Real Betis")); assert.ok(ins.seasons.every((r) => !/^gf_/.test(r.club)));
  assert.ok(ins.timeline.every((t) => !/gf_fc27/.test(String(t.detail || ""))));
});

test("34F.27.1 (3) tela renderizada nao contem IDs internos", () => {
  const s = withHistory(mk()); const html = X.statistics(s, "serieA");
  assert.ok(html.includes("Real Betis")); assert.ok(html.includes(N.league(s, LALIGA)));
  assert.ok(!/gf_fc27_/.test(html.replace(/value="[^"]*"/g, "")), "ID interno visivel: " + (html.match(/.{30}gf_fc27_.{20}/) || [""])[0]);
});

test("34F.27.1 (4) salvar e recarregar: nomes corretos e IDs armazenados intactos", () => {
  const s = withHistory(mk()), before = JSON.stringify(s.statistics.heroStints.map((x) => [x.clubId, x.club]));
  X.statistics(s, "serieA");
  assert.equal(JSON.stringify(s.statistics.heroStints.map((x) => [x.clubId, x.club])), before, "render nao altera o save");
  const back = JSON.parse(JSON.stringify(s)); back.globalFootball = JSON.parse(JSON.stringify(s.globalFootball));
  const html = X.statistics(back, "serieA"); assert.ok(html.includes("Real Betis")); assert.ok(!/gf_fc27_/.test(html.replace(/value="[^"]*"/g, "")));
  assert.ok(back.statistics.players.hero.byCompetition[LALIGA]);
});

test("34F.27.1 (5) carreiras antigas: nome gravado, ID gravado e catalogo classico continuam corretos", () => {
  const s = withHistory(mk()); s.statistics.heroStints[0].club = "Real Betis";
  assert.ok(X.statistics(s, "serieA").includes("Real Betis"));
  const old = mk(null); S.init(old); const c = old.clubs[1];
  old.statistics.heroStints = [{ season: old.season - 1, clubId: c.id, club: c.name, startDay: 0, endDay: 10, transferType: "season", appearances: 1, starts: 1, minutes: 90, goals: 0, assists: 0, ratingTotal: 7 }];
  const html = X.statistics(old, "serieA"); assert.ok(html.includes(c.name));
  const orphan = mk(); orphan.statistics.heroStints = [{ season: orphan.season - 1, clubId: "gf_fc27_999999", club: "gf_fc27_999999", startDay: 0, endDay: 10, transferType: "season", appearances: 1, starts: 1, minutes: 90, goals: 0, assists: 0, ratingTotal: 7 }];
  const h2 = X.statistics(orphan, "serieA"); assert.ok(h2.includes(N.UNKNOWN_CLUB)); assert.ok(!/gf_fc27_999999/.test(h2.replace(/value="[^"]*"/g, "")));
});

test("34F.27.1 (6) historico de carreira e Central nao exibem ID de liga FC 27", () => {
  const src = fs.readFileSync(path.join(__dirname, "../src/ui/app.js"), "utf8");
  assert.ok(src.includes("ProLifeNames.text(state,h.league")); assert.ok(src.includes("ProLifeNames.isInternal(id)"));
  assert.ok(fs.readFileSync(path.join(__dirname, "../src/ui/home-dashboard.js"), "utf8").includes("ProLifeNames.league"));
  assert.ok(fs.readFileSync(path.join(__dirname, "../index.html"), "utf8").indexOf("display-names.js") < fs.readFileSync(path.join(__dirname, "../index.html"), "utf8").indexOf("statistics.js"));
});

test("34F.27.1 (7) desempenho: milhares de consultas reutilizam o indice dos 670 clubes", () => {
  const s = mk(); const ids = s.globalFootball.clubs.map((c) => c.id); assert.ok(ids.length >= 600);
  const t0 = process.hrtime.bigint(); let n = 0; for (let i = 0; i < 20000; i++) if (N.club(s, ids[i % ids.length]) ) n++;
  const ms = Number(process.hrtime.bigint() - t0) / 1e6; assert.equal(n, 20000); assert.ok(ms < 400, `${ms}ms`);
  s.globalFootball.clubs.push({ id: "gf_fc27_novo", name: "Clube Novo" }); assert.equal(N.club(s, "gf_fc27_novo"), "Clube Novo", "indice acompanha crescimento");
});
