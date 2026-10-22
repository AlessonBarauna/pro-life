"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");

global.ProLife = D;
global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeWorldStats = D.WorldStats;
global.ProLifeStatistics = D.Statistics;
global.ProLifeCompetitions = D.Competitions;
global.ProLifeNames = require("../src/domain/display-names.js");
global.ProLifeCareerContext = require("../src/domain/career-context.js");

const E = require("../src/ui/expansion.js");

const LALIGA = "gf_fc27_laliga_ea_sports";
const PREMIER = "gf_fc27_premier_league";

const make = mode => D.create({
  mode,
  clubId: "c0",
  catalogVersion: "fc27_v1"
}, 5);

function selected(html) {
  return [...html.matchAll(/<option value="([^"]*)" selected>/g)]
    .map(match => match[1]);
}

test("coach: painel e historico preservados", () => {
  const html = E.statistics(make("coach"), "");

  assert.ok(html.includes("DO TREINADOR"));
  assert.ok(html.includes("da carreira"));
  assert.ok(html.includes("Diretoria"));
  assert.ok(html.includes("Seguro"));
  assert.ok(!html.includes("[object Object]"));
});

test("coach: seletor e rankings disponiveis", () => {
  const html = E.statistics(make("coach"), "");

  assert.ok(html.includes('id="statistics-key"'));
  assert.ok(html.includes("Artilharia"));
  assert.ok(html.includes("Assist"));
  assert.ok(html.includes("DAS COMPETI"));
});

test("coach: selecao manual das ligas", () => {
  const s = make("coach");

  for (const id of ["serieA", LALIGA, PREMIER]) {
    assert.ok(
      selected(E.statistics(s, id)).includes(id),
      id
    );
  }
});

test("coach: competicao invalida retorna a principal", () => {
  const s = make("coach");

  assert.ok(
    selected(E.statistics(s, "inexistente")).includes("serieA")
  );
});

test("player: seletor permanece funcional", () => {
  const s = make("player");

  for (const id of ["serieA", PREMIER]) {
    const html = E.statistics(s, id);
    assert.ok(selected(html).includes(id));
    assert.ok(html.includes("DA CARREIRA"));
    assert.ok(html.includes("Artilharia"));
  }
});

test("coach: renderizacao nao cria partidas mundiais", () => {
  const s = make("coach");

  const before = s.globalFootball.worldStats;
  assert.equal(before, undefined);

  E.statistics(s, LALIGA);
  E.statistics(s, PREMIER);

  const ws = s.globalFootball.worldStats;

  assert.ok(ws);
  assert.equal(ws.matches, 0);
  assert.deepEqual(Object.keys(ws.leagues), []);
  assert.deepEqual(ws.archive, []);

  const snapshot = JSON.stringify(ws);

  E.statistics(s, LALIGA);
  E.statistics(s, PREMIER);

  assert.equal(JSON.stringify(s.globalFootball.worldStats), snapshot);
});