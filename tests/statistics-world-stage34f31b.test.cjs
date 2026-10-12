"use strict";
// Stage 34F.31B - seletor mundial de competicoes e rankings de todas as ligas FC27 com partidas processadas.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js"); global.ProLifeWorldStats = D.WorldStats;
global.ProLifeNationalIdentity = require("../src/domain/national-identity.js"); global.ProLifeCareerContext = require("../src/domain/career-context.js");
global.ProLifeStatistics = D.Statistics; global.ProLifeCompetitions = D.Competitions;
const E = require("../src/ui/expansion.js"), WS = D.WorldStats;
const LALIGA = "gf_fc27_laliga_ea_sports", PREMIER = "gf_fc27_premier_league";
const BAD = /null|undefined|NaN|\[object|gf_fc27/;
const visible = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/(value|id|data-[a-z-]+)="[^"]*"/g, "");
const clubId = (s, re) => s.globalFootball.clubs.find((c) => re.test(c.name))?.id;
const make = (re, days = 130, seed = 5) => { const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed); if (re) D.movePlayerToClub(s, clubId(s, re)); for (let i = 0; i < days; i++) D.advance(s, 1); return s; };
const selected = (h) => (h.match(/<option value="([^"]*)" selected>/g) || []).map((x) => x.match(/value="([^"]*)"/)[1]);
let betis = null; const B = () => betis || (betis = make(/^Real Betis$/));

test("34F.31B (1,2) Real Betis e Real Madrid abrem a LaLiga", () => {
  assert.ok(selected(E.statistics(B(), "")).includes(LALIGA));
  assert.ok(selected(E.statistics(make(/^Real Madrid$/, 30), "")).includes(LALIGA));
});

test("34F.31B (3) Manchester City abre a Premier League; Bayern abre a Bundesliga", () => {
  assert.ok(selected(E.statistics(make(/^Manchester City$/, 30), "")).includes(PREMIER));
  const s = make(/^(FC Bayern M|Bayern)/, 30); const lg = D.club(s).leagueId; assert.match(lg, /bundesliga/i);
  assert.ok(selected(E.statistics(s, "")).includes(lg));
});

test("34F.31B (4) clube brasileiro abre sua divisao", () => {
  const s = make(null, 20); const main = D.club(s).leagueId;
  assert.ok(selected(E.statistics(s, "")).includes(main));
});

test("34F.31B (5,6) seletor inclui ligas jogaveis; ligas so de catalogo ficam desabilitadas", () => {
  const h = E.statistics(B(), ""); const comps = WS.competitions(B());
  assert.ok(comps.length >= 30); for (const c of comps.slice(0, 40)) assert.ok(h.includes(`<option value="${c.id}"`), c.id);
  assert.ok(h.includes('<option value="serieA"'));
  const only = B().globalFootball.leagues.filter((l) => !comps.some((c) => c.id === l.id));
  if (only.length) { assert.ok(h.includes("Somente catálogo")); for (const l of only) assert.ok(!h.includes(`<option value="${l.id}"`), l.id + " nao pode ser selecionavel"); }
});

test("34F.31B (7) rankings da LaLiga vem dos registros canonicos (WorldStats), sem misturar ligas", () => {
  const s = B(), h = E.statistics(s, LALIGA); const top = WS.leaders(s, { leagueId: LALIGA, stat: "goals", limit: 10 });
  assert.ok(top.length >= 3);
  for (const r of top.slice(0, 3)) assert.ok(h.includes(r.name), r.name);
  const prem = WS.leaders(s, { leagueId: PREMIER, stat: "goals", limit: 10 }); const laNames = new Set(top.map((r) => r.id));
  assert.ok(prem.every((r) => !laNames.has(r.id)), "sem atletas repetidos entre competicoes");
  assert.ok(h.includes("determinística"), "aviso honesto sobre a origem dos dados");
});

test("34F.31B (8) escolha manual valida e preservada; competicao invalida volta ao padrao", () => {
  const s = B(); assert.ok(selected(E.statistics(s, PREMIER)).includes(PREMIER));
  assert.ok(selected(E.statistics(s, "inexistente")).includes(LALIGA));
  assert.ok(selected(E.statistics(s, "serieA")).includes("serieA"));
});

test("34F.31B (9,10) renderizar e transferir nao duplicam registros; save/load iguais", () => {
  const s = make(/^Real Betis$/, 60); const sum = (id) => WS.leaders(s, { leagueId: id, stat: "goals", limit: 9999 }).reduce((n, r) => n + r.value, 0);
  const g0 = sum(LALIGA); E.statistics(s, LALIGA); E.statistics(s, LALIGA); assert.equal(sum(LALIGA), g0);
  const copy = JSON.parse(JSON.stringify(s)); global.ProLifeWorldStats = D.WorldStats;
  assert.equal(E.statistics(copy, LALIGA).length, E.statistics(s, LALIGA).length);
  D.movePlayerToClub(s, clubId(s, /^Manchester City$/)); assert.equal(sum(LALIGA), g0);
});

test("34F.31B (11) carreira classica (Brasil) segue funcionando com as tabelas brasileiras", () => {
  const s = make(null, 40); const h = E.statistics(s, "serieA"); assert.ok(h.includes("Artilharia") && h.includes("Assistências"));
});

test("34F.31B (12) tela sem IDs internos, NaN, undefined ou null", () => {
  for (const key of [LALIGA, PREMIER, "serieA"]) { const v = visible(E.statistics(B(), key)); assert.ok(!BAD.test(v), `${key}: ${(v.match(BAD) || [])[0]}`); }
});
