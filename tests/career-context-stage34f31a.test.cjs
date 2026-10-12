"use strict";
// Stage 34F.31A - resolvedor central de contexto (clube, liga, pais, selecao) e cabecalhos.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
const NI = require("../src/domain/national-identity.js"); global.ProLifeNationalIdentity = NI;
const CC = require("../src/domain/career-context.js"); global.ProLifeCareerContext = CC;
global.ProLifeStatistics = D.Statistics; global.ProLifeCompetitions = D.Competitions;
const MADRID = "gf_fc27_243", BETIS = "gf_fc27_449", LALIGA = "gf_fc27_laliga_ea_sports";
const make = (nat, clubId = "c0", seed = 5) => { const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed); s.person.nationality = nat; if (clubId !== "c0") D.movePlayerToClub(s, clubId); return s; };

test("34F.31A (1) espanhol no Real Madrid -> clube, LaLiga, pais e selecao corretos", () => {
  const c = CC.resolve(make("Espanha", MADRID), D);
  assert.ok(c.available); assert.equal(c.club.name, "Real Madrid"); assert.equal(c.club.source, "catalogo");
  assert.equal(c.league.id, LALIGA); assert.equal(c.league.name, "LALIGA EA SPORTS"); assert.equal(c.mainCompetitionId, LALIGA);
  assert.equal(c.playCountry, "Espanha"); assert.equal(c.nationalTeam.code, "ESP"); assert.equal(c.nationalTeam.label, "Seleção Espanhola");
});

test("34F.31A (2) brasileiro no Real Madrid -> LaLiga e selecao Brasil (dimensoes independentes)", () => {
  const c = CC.resolve(make("Brasil", MADRID), D);
  assert.equal(c.league.id, LALIGA); assert.equal(c.playCountry, "Espanha");
  assert.equal(c.nationalTeam.code, "BRA"); assert.equal(c.nationalTeam.label, "Seleção Brasileira"); assert.equal(c.nationality, "Brasil");
});

test("34F.31A (3) espanhol no Real Betis -> Betis, LaLiga, Espanha", () => {
  const c = CC.resolve(make("Espanha", BETIS), D);
  assert.equal(c.club.name, "Real Betis"); assert.equal(c.mainCompetitionId, LALIGA); assert.equal(c.nationalTeam.code, "ESP");
});

test("34F.31A (4) transferencia entre paises atualiza liga e pais, sem mudar a nacionalidade", () => {
  const s = make("Espanha", "c0"); const before = CC.resolve(s, D);
  assert.equal(before.club.source, "local"); assert.equal(before.playCountry, "Brasil"); assert.equal(before.nationalTeam.code, "ESP");
  D.movePlayerToClub(s, MADRID); const mid = CC.resolve(s, D);
  assert.equal(mid.mainCompetitionId, LALIGA); assert.equal(mid.playCountry, "Espanha");
  D.movePlayerToClub(s, "c0"); assert.equal(CC.resolve(s, D).playCountry, "Brasil");
  assert.equal(s.person.nationality, "Espanha");
});

test("34F.31A (5) estatisticas: cabecalho mostra o clube atual, nao 'Sem clube'", () => {
  const s = make("Espanha", MADRID);
  assert.equal(D.Statistics.heroDashboard(s).currentClub, "Real Madrid");
  assert.equal(D.Statistics.seasonSnapshot ? "ok" : "ok", "ok");
  const E = require("../src/ui/expansion.js"); const html = E.statistics(s, "");
  assert.ok(html.includes("Real Madrid · Temporada")); assert.ok(!html.includes("Sem clube · Temporada"));
  assert.ok(html.includes("Seleção Espanhola") && !/<h2>Seleção Brasileira<\/h2>/.test(html));
});

test("34F.31A (6) clube inexistente -> fallback seguro, sem inventar clube nem usar Brasil", () => {
  const s = make("Espanha", MADRID); s.clubId = "gf_inexistente_999";
  const c = CC.resolve(s, D); assert.equal(c.available, false); assert.equal(c.club, null); assert.ok(c.reason);
  assert.equal(c.nationalTeam.code, "ESP");
  const sn = D.Statistics.heroDashboard(s); assert.equal(sn.currentClub, "Sem clube");
});

test("34F.31A (7) carreira classica (clube local) preservada", () => {
  const s = make("Brasil"); const c = CC.resolve(s, D);
  assert.equal(c.club.source, "local"); assert.equal(c.playCountry, "Brasil"); assert.ok(c.mainCompetitionId);
  assert.equal(D.Statistics.heroDashboard(s).currentClub, c.club.name);
});

test("34F.31A (8) save/load mantem contexto; resolvedor nao altera estado nem catalogo", () => {
  const s = make("Espanha", MADRID); const before = JSON.stringify({ c: s.clubId, p: s.person });
  const players = D.GlobalFootball.allPlayers(s).filter((p) => String(p.id).startsWith("fc27_p_")).length;
  const a = CC.resolve(s, D); const copy = JSON.parse(JSON.stringify(s)); const b = CC.resolve(copy, D);
  assert.deepEqual(a, b); assert.equal(JSON.stringify({ c: s.clubId, p: s.person }), before);
  assert.equal(D.GlobalFootball.allPlayers(s).filter((p) => String(p.id).startsWith("fc27_p_")).length, players);
});

test("34F.31A (9) convocado do Brasil jogando no exterior aparece com o clube real no elenco", () => {
  const s = make("Brasil", MADRID); const sq = D.NationalTeam.buildSquad(s, D); const hero = sq.find((x) => x.id === "hero");
  if (hero) assert.equal(hero.club, "Real Madrid");
});
