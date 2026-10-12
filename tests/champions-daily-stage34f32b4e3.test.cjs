"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");

function setup() {
  const s = D.create({
    mode: "player",
    clubId: "c0",
    catalogVersion: "fc27_v1"
  }, 5);

  D.advance(s, 1);

  const ed = D.Continental.edition(s, "ucl");
  assert.equal(ed.leagueSchedule.matches.length, 144);

  return { s, ed };
}

function advanceUntil(s, target) {
  let guard = 0;

  while (s.day < target) {
    if (++guard > 20) throw Error("Limite de avanco excedido.");

    const step = Math.min(30, target - s.day);
    const old = s.day;

    D.advance(s, step);

    assert.equal(
      s.day, old + step,
      "O motor nao avancou os dias esperados."
    );
  }
}

test("34F.32B.4E.3 - processa a primeira janela", () => {
  const { s, ed } = setup();
  const matches = ed.leagueSchedule.matches;
  const first = Math.min(...matches.map(m => m.day));

  advanceUntil(s, first);

  const due = matches.filter(m => m.day === first);

  assert.ok(due.length > 0);
  assert.ok(due.every(m => m.played));
  assert.ok(due.every(m =>
    Number.isInteger(m.hg) && Number.isInteger(m.ag)
  ));

  console.log("Dia:", s.day);
  console.log("Jogos processados:", due.length);
});

test("34F.32B.4E.3 - nao duplica resultados", () => {
  const { s, ed } = setup();
  const matches = ed.leagueSchedule.matches;
  const first = Math.min(...matches.map(m => m.day));

  advanceUntil(s, first);

  const snapshot = JSON.stringify(matches);
  const played = matches.filter(m => m.played).length;

  D.advance(s, 1);

  assert.equal(JSON.stringify(matches), snapshot);
  assert.equal(matches.filter(m => m.played).length, played);
});

test("34F.32B.4E.3 - resultados persistem no save", () => {
  const { s, ed } = setup();
  const first = Math.min(
    ...ed.leagueSchedule.matches.map(m => m.day)
  );

  advanceUntil(s, first);

  const saved = JSON.parse(JSON.stringify(s));
  const restored = D.Continental.edition(saved, "ucl");

  assert.deepEqual(
    restored.leagueSchedule.matches,
    ed.leagueSchedule.matches
  );
});

test("34F.32B.4E.3 - nao gera historico retroativo", () => {
  const s = D.create({
    mode: "player",
    clubId: "c0",
    catalogVersion: "fc27_v1"
  }, 5);

  D.Continental.init(s);
  // UCL_LEGACY_SCENARIO_V35
  delete D.Continental.edition(s, 'ucl').leagueSchedule;

  s.day = D.Continental.windows(s.season, "ucl")[0] + 5;
  D.advance(s, 1);

  assert.equal(
    D.Continental.edition(s, "ucl").leagueSchedule,
    undefined
  );
});

test("34F.32B.4E.3 - partidas nao entram na LaLiga", () => {
  const { s, ed } = setup();
  const first = Math.min(
    ...ed.leagueSchedule.matches.map(m => m.day)
  );

  advanceUntil(s, first);

  const continental = (s.matches || [])
    .filter(m => m.competitionId === "ucl");

  assert.ok(continental.every(m => m.leagueId == null));

  const scheduled = ed.leagueSchedule.matches
    .filter(m => m.played);

  assert.ok(scheduled.length > 0);
  assert.ok(scheduled.every(m => m.hg >= 0 && m.ag >= 0));
});