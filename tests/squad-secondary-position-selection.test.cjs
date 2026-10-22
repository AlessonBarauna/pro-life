"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../src/domain/player-positions.js");
const S = require("../src/domain/squad-position-selection.js");

function player(id, pos, secondaryPositions = [], rating = 75, suggested = false) {
  return {
    id, pos, primaryPosition: pos, secondaryPositions,
    secondaryPositionsSource: suggested ? "suggested" : "manual",
    ovr: rating, overall: rating, condition: 100, morale: 80
  };
}

test("escalação usa posição secundária real antes de improvisar fora de posição", () => {
  const roster = [
    player("gk", "GOL"), player("cb1", "ZAG", ["LD"], 76),
    player("cb2", "ZAG", [], 74), player("cb3", "ZAG", [], 73),
    player("lb", "LE"), player("dm", "VOL"), player("cm1", "MC"),
    player("cm2", "MC"), player("rw", "PD"), player("st", "CA"),
    player("lw", "PE"), player("striker", "CA", [], 95)
  ];
  const selected = S.choose({
    formation: "4-3-3",
    active: roster,
    roster,
    score: p => Number(p.ovr),
    overall: p => Number(p.ovr),
    restsToday: () => false
  });
  assert.ok(selected);
  assert.equal(selected.starters.length, 11);
  assert.equal(selected.assignedPositions.cb1, "LD");
  assert.equal(new Set(selected.starters.map(p => p.id)).size, 11);
});

test("posição secundária sugerida é considerada compatível, sem penalidade de improviso distante", () => {
  const suggested = player("cb-suggested", "ZAG", ["LD"], 78, true);
  assert.equal(P.suitability(suggested, "LD").kind, "SUGGESTED");
  const selected = S.choose({
    formation: "4-3-3",
    active: [
      player("gk", "GOL"), suggested, player("cb2", "ZAG"), player("cb3", "ZAG"),
      player("lb", "LE"), player("dm", "VOL"), player("cm1", "MC"), player("cm2", "MC"),
      player("rw", "PD"), player("st", "CA"), player("lw", "PE")
    ],
    roster: [
      player("gk", "GOL"), suggested, player("cb2", "ZAG"), player("cb3", "ZAG"),
      player("lb", "LE"), player("dm", "VOL"), player("cm1", "MC"), player("cm2", "MC"),
      player("rw", "PD"), player("st", "CA"), player("lw", "PE")
    ],
    score: p => Number(p.ovr),
    overall: p => Number(p.ovr),
    restsToday: () => false
  });
  assert.ok(selected);
  assert.equal(selected.assignedPositions["cb-suggested"], "LD");
});
