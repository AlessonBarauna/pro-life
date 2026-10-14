"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const store = {}; global.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const D = require("../src/domain/engine.js");
globalThis.ProLifeCareerContext = require("../src/domain/career-context.js");
const S = require("../src/infrastructure/save.js");

test("04E6 slot: clube atual aparece para clube brasileiro, de liga do mundo e catalogo FC27 (nunca 'Sem clube' se o clube existe)", () => {
  const s = D.create({ mode: "player", clubId: "c0" }, 11);
  const world = (s.globalFootball?.clubs || []).slice(0, 40);
  assert.ok(world.length > 0);
  const ids = ["c0", "c8", ...world.map((c) => c.id)];
  for (const id of ids) {
    s.clubId = id;
    const expected = D.club(s, id)?.name;
    if (!expected) continue;
    const sum = S.slotSummary("t", s, 1);
    assert.notEqual(sum.club, "Sem clube", id);
    assert.equal(typeof sum.club, "string");
  }
  s.clubId = null; assert.equal(S.slotSummary("t", s, 1).club, "Sem clube");
});
