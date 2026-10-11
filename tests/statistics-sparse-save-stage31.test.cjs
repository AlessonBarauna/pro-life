"use strict";
// Stage 31.8E - estatisticas esparsas no envelope hibrido v2. Armazenamento simulado; nenhum save real.
const test = require("node:test"), assert = require("node:assert/strict");
function mockStorage(limit = Infinity) {
  const m = new Map(), size = () => [...m].reduce((n, [k, v]) => n + k.length + v.length, 0);
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) { v = String(v); const next = size() - (m.has(k) ? k.length + m.get(k).length : 0) + k.length + v.length; if (next > limit) throw new Error("QuotaExceededError"); m.set(k, v); },
    removeItem: (k) => { m.delete(k); }, size };
}
global.localStorage = mockStorage();
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const SC = require("../src/domain/statistics-compact.js");
const Stats = require("../src/domain/statistics.js");
const S = require("../src/infrastructure/save.js");
const clone = (x) => JSON.parse(JSON.stringify(x));
const reset = (limit) => { global.localStorage = mockStorage(limit); S.setCompactWriteMode("off"); return global.localStorage; };
let ST; const state = () => (ST ||= (() => { const s = D.create({ mode: "player", name: "Esparso", age: 22, pos: "ATA", clubId: "c0" }, 11); D.advance(s, 10); return s; })());
const canon = (o) => (o && o.statistics && Stats.init(o), canon0(o));
const canon0 = (o) => JSON.stringify(o, (k, v) => (v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((x) => [x, v[x]])) : v));
const ref = () => S.validate(clone(state()));
const enc2 = (s) => S.encodeHybridSave(s, { sparseStats: true });

test("round-trip exato (v2): estado, rankings e temporadas", () => {
  const s = state(), back = S.parse(enc2(s)), r = ref();
  assert.equal(canon(back), canon(r));
  for (const f of ["goals", "assists", "appearances"]) assert.deepEqual(Stats.leaders(back, f, 20), Stats.leaders(r, f, 20));
  assert.deepEqual(back.statistics.seasons, r.statistics.seasons);
});
test("memoria continua completa e sem mutacao; tamanho menor", () => {
  const s = state(), before = JSON.stringify(s), t1 = S.encodeHybridSave(s), t2 = enc2(s);
  assert.equal(JSON.stringify(s), before);
  assert.ok(s.statistics.players.hero.wins !== undefined || s.statistics.players.hero.goals === 0);
  console.log("tamanhos v1/v2/completo", t1.length, t2.length, before.length);
  assert.ok(t2.length < t1.length - 200000);
});
test("envelopes v1 antigos e saves completos continuam abrindo", () => {
  const s = state(), r = ref();
  assert.equal(JSON.parse(S.encodeHybridSave(s)).version, 1);
  assert.equal(canon(S.parse(S.encodeHybridSave(s))), canon(r));
  assert.equal(canon(S.parse(JSON.stringify(s))), canon(r));
});
test("padrao: escrita compacta desligada grava formato completo", () => {
  reset(); S.save(state()); const id = S.listSlots()[0].id;
  assert.equal(S.detectSaveFormat(JSON.parse(localStorage.getItem("prolife.v1.slot." + id))), "legacy");
});
test("modo always grava v2 e recarrega igual (slot simulado)", () => {
  reset(); S.setCompactWriteMode("always"); S.save(state());
  const id = S.listSlots()[0].id, v = JSON.parse(localStorage.getItem("prolife.v1.slot." + id));
  assert.equal(v.version, 2); assert.equal(v.statsFormat, "PRO_LIFE_STATS_SPARSE_1");
  assert.equal(canon(S.loadSlot(id)), canon(ref()));
  S.setCompactWriteMode("off");
});
test("exportacao/importacao: texto v2 -> parse -> estado completo", () => {
  const txt = enc2(state()), back = S.parse(txt);
  assert.equal(canon(back), canon(ref()));
});
test("versao desconhecida, statsFormat invalido e estatisticas malformadas sao recusados", () => {
  const v = JSON.parse(enc2(state()));
  const bad = (f) => { const x = clone(v); f(x); assert.throws(() => S.parse(JSON.stringify(x))); };
  bad((x) => { x.version = 3; });
  bad((x) => { x.statsFormat = "OUTRO"; });
  bad((x) => { delete x.statsFormat; });
  bad((x) => { x.state.statistics = null; });
  bad((x) => { x.state.statistics.players = []; });
  bad((x) => { x.state.statistics.players.hero = 5; });
  bad((x) => { x.state.statistics.players.hero.goals = "abc"; });
  const v1 = JSON.parse(S.encodeHybridSave(state())); v1.statsFormat = SC_FMT(); assert.throws(() => S.parse(JSON.stringify(v1)));
});
function SC_FMT() { return "PRO_LIFE_STATS_SPARSE_1"; }
test("catalogo incompativel e recusado no v2", () => {
  const v = JSON.parse(enc2(state())); v.fingerprint = "x" + v.fingerprint;
  assert.throws(() => S.parse(JSON.stringify(v)), /incompat/i);
});
test("falha de decodificacao/validacao nunca sobrescreve o slot existente", () => {
  reset(); S.setCompactWriteMode("always"); const s = clone(state()); S.save(s);
  const id = S.listSlots()[0].id, key = "prolife.v1.slot." + id, v = JSON.parse(localStorage.getItem(key));
  v.statsFormat = "OUTRO"; const tampered = JSON.stringify(v); localStorage.setItem(key, tampered);
  const t = S.slotStatus(id); assert.equal(t.ok, false);
  assert.equal(S.loadSlot(id), null);
  const loaded = clone(s); S.bindStateToSlot(loaded, id); S.save(loaded);
  assert.equal(localStorage.getItem(key), tampered);
  S.setCompactWriteMode("off");
});
test("limite de armazenamento: onQuota cai para v2 e integridade do indice preservada", () => {
  const full = JSON.stringify(state()).length;
  const ls = reset(Math.floor(full * 0.96)); S.setCompactWriteMode("onQuota");
  assert.ok(S.save(state()));
  const id = S.listSlots()[0].id, v = JSON.parse(ls.getItem("prolife.v1.slot." + id));
  assert.equal(v.version, 2); assert.equal(S.listSlots().length, 1);
  assert.equal(canon(S.loadSlot(id)), canon(ref()));
  const tiny = reset(1000); S.setCompactWriteMode("always");
  assert.equal(S.save(state()), false); assert.equal(S.listSlots().length, 0);
  S.setCompactWriteMode("off");
});
test("sem duplicacao de registros apos varios ciclos", () => {
  let t = enc2(state()); for (let i = 0; i < 3; i++) t = enc2(S.parse(t));
  const a = S.parse(t); assert.equal(Object.keys(a.statistics.players).length, Object.keys(state().statistics.players).length);
  assert.equal(canon(a), canon(ref()));
});
