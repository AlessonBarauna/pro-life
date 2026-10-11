"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const Stats = require("../src/domain/statistics.js");
const C = require("../src/domain/statistics-compact.js");
const cfg = { mode: "player", name: "Medicao", age: 22, pos: "ATA", clubId: "c0" };
const len = (o) => JSON.stringify(o).length, clone = (o) => JSON.parse(JSON.stringify(o));
const make = (days) => { const s = D.create(cfg, 11); if (days) D.advance(s, days); return s; };
const norm = (st) => { const c = clone(st); for (const [id, r] of Object.entries(c.players)) { const d = C.expand({ players: { x: r } }).players.x; c.players[id] = d; } return c; };

test("campos zerados sao omitidos e valores nao zero preservados", () => {
  const s = make(10), c = C.compact(s.statistics);
  assert.ok(len(c) < len(s.statistics) * 0.5);
  const id = Object.keys(s.statistics.players).find((k) => s.statistics.players[k].goals > 0) || "hero";
  for (const f of C.FIELDS) { const v = s.statistics.players[id][f] || 0; assert.equal(c.players[id][f] === undefined ? 0 : c.players[id][f], v); }
});
test("jogadores com partidas, competicao e temporada preservados", () => {
  const s = make(10), x = C.expand(C.compact(s.statistics));
  for (const [id, r] of Object.entries(s.statistics.players)) {
    const e = x.players[id];
    for (const f of C.FIELDS) assert.equal(e[f], r[f] || 0);
    for (const [cid, cr] of Object.entries(r.byCompetition)) for (const f of C.FIELDS) assert.equal(e.byCompetition[cid][f], cr[f] || 0);
    assert.deepEqual(Object.keys(e.byCompetition), Object.keys(r.byCompetition));
  }
  assert.deepEqual(x.seasons, s.statistics.seasons);
  assert.deepEqual(x.awards, s.statistics.awards);
});
test("rankings (artilheiros, assistencias, notas) identicos apos compactar e expandir", () => {
  const s = make(10), t = clone(s); t.statistics = C.expand(C.compact(s.statistics));
  for (const f of ["goals", "assists", "appearances", "tackles", "saves"]) assert.deepEqual(Stats.leaders(t, f, 20), Stats.leaders(s, f, 20));
  assert.deepEqual(Stats.rankingDashboard(t), Stats.rankingDashboard(s));
  assert.deepEqual(Stats.heroDashboard(t), Stats.heroDashboard(s));
});
test("historico de carreira (herois/stints) intacto", () => {
  const s = make(10), c = C.compact(s.statistics);
  assert.deepEqual(c.heroStints, s.statistics.heroStints); assert.deepEqual(c.records, s.statistics.records);
});
test("save antigo (formato completo) e formato esparso expandem igual; idempotente", () => {
  const s = make(10), full = C.expand(s.statistics), sp = C.compact(s.statistics);
  assert.deepEqual(C.expand(sp), full); assert.deepEqual(C.expand(full), full); assert.deepEqual(C.compact(C.compact(s.statistics)), sp);
  const back = C.expand(JSON.parse(JSON.stringify(sp))); assert.deepEqual(back, full);
});
test("compactar/expandir nao muta a entrada nem cria registros", () => {
  const s = make(10), before = JSON.stringify(s.statistics);
  C.compact(s.statistics); C.expand(s.statistics); assert.equal(JSON.stringify(s.statistics), before);
  const sp = C.compact(s.statistics), b2 = JSON.stringify(sp); C.expand(sp); assert.equal(JSON.stringify(sp), b2);
  assert.deepEqual(Object.keys(C.expand(sp).players), Object.keys(s.statistics.players));
});
test("partidas antes/depois: continuar a simulacao a partir do estado expandido gera o mesmo resultado", () => {
  const a = make(10), b = clone(a); b.statistics = C.expand(C.compact(a.statistics));
  D.advance(a, 5); D.advance(b, 5);
  assert.equal(JSON.stringify(a.matches ?? a.history ?? null), JSON.stringify(b.matches ?? b.history ?? null));
  assert.deepEqual(Stats.leaders(a, "goals", 20), Stats.leaders(b, "goals", 20));
  assert.equal(a.day, b.day);
});
test("comparacao de tamanho nos dias 0, 1 e 10", () => {
  const s = make(0), r = [];
  for (const d of [0, 1, 10]) { if (d) D.advance(s, d === 1 ? 1 : 9); const f = len(s.statistics), c = len(C.compact(s.statistics)); r.push([d, f, c]); assert.ok(c <= f); }
  console.log("stats full/compact", JSON.stringify(r));
  assert.ok(r[2][2] < r[2][1] * 0.5);
});
