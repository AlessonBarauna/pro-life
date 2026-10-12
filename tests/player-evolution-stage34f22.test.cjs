"use strict";
// Stage 34F.22 - evolucao anual dos jogadores do catalogo FC 27 (GER/potencial por idade, perfil e minutos), sem tocar identidade/clubes.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const Save = require("../src/infrastructure/save.js");
const G = D.GlobalFootball;
const fc27 = (seed = 2222) => D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, seed);
const roll = (s) => { s.season++; return G.rollSeason(s); };
const ovrs = (s) => new Map(s.internationalPlayers.map((p) => [p.id, [p.ovr, p.potential, p.clubId, p.age]]));

test("34F.22 (1) evolucao anual e deterministica e roda uma unica vez por temporada", () => {
  const a = fc27(), b = fc27();
  roll(a); roll(b);
  assert.equal(JSON.stringify(a.internationalPlayers.map((p) => [p.id, p.ovr, p.potential])), JSON.stringify(b.internationalPlayers.map((p) => [p.id, p.ovr, p.potential])));
  const snap = JSON.stringify(a.internationalPlayers.map((p) => [p.id, p.ovr, p.potential]));
  assert.deepEqual(G.rollSeason(a), []);
  assert.equal(JSON.stringify(a.internationalPlayers.map((p) => [p.id, p.ovr, p.potential])), snap);
  assert.ok(a.globalFootball.lastDevelopment.changed > 5000);
});

test("34F.22 (2) limites: GER 20..99, potencial >= GER, variacao anual limitada, identidade e clubes intactos", () => {
  const s = fc27(), before = ovrs(s), n = s.internationalPlayers.length;
  roll(s);
  assert.ok(s.internationalPlayers.length >= n, "catalogo nao perde jogadores (novos jovens entram a parte)");
  for (const p of s.internationalPlayers) {
    if (!before.has(p.id)) continue;
    const [o, , club] = before.get(p.id);
    assert.ok(p.clubId === club || p.clubId == null, "clube preservado (ou dispensado ao mercado livre)");
    assert.ok(p.ovr >= 20 && p.ovr <= 99, p.id);
    assert.equal(p.ovr, p.overall);
    assert.ok(p.potential >= p.ovr && p.potential <= 99, p.id);
    const d = p.ovr - o;
    assert.ok(d >= -5 && d <= 6, `${p.id} ${d}`);
  }
});

test("34F.22 (3) jovens sobem, veteranos caem, sem saltos irreais; elite nao explode", () => {
  const s = fc27(), before = ovrs(s);
  roll(s);
  const avg = (f) => { const l = s.internationalPlayers.filter((p) => p.status !== "retired" && before.has(p.id) && f(p.age)); return l.reduce((n, p) => n + (p.ovr - before.get(p.id)[0]), 0) / l.length; };
  assert.ok(avg((a) => a <= 20) > 1.0, "jovens evoluem");
  assert.ok(avg((a) => a >= 33) < -0.8, "veteranos declinam");
  assert.ok(Math.abs(avg((a) => a >= 25 && a <= 28)) < 0.8, "auge estavel");
  const max = Math.max(...s.internationalPlayers.map((p) => p.ovr));
  assert.ok(max <= 95, "maximo plausivel " + max);
});

test("34F.22 (4) titular evolui mais que reserva (mesmo jogador, mesma idade, mesmo perfil)", () => {
  const s = fc27(), base = s.internationalPlayers.find((p) => p.pos === "MEI");
  const mk = (id, club, ovr) => ({ ...base, id, name: "T " + id, birthYear: s.season - 21, age: 21, ovr, overall: ovr, potential: 88, clubId: club, status: "active", active: true, developmentProfile: { id: "steady_rise", v: 1 } });
  const A = [], B = [];
  const tpl = s.globalFootball.clubs[0];
  for (let i = 0; i < 300; i++) {
    s.globalFootball.clubs.push({ ...tpl, id: "zz_weak_" + i, name: "ZW" + i }, { ...tpl, id: "zz_strong_" + i, name: "ZS" + i });
    A.push(mk("sa" + i, "zz_weak_" + i, 70));
    B.push(mk("sb" + i, "zz_strong_" + i, 70));
    for (let k = 0; k < 4; k++) s.internationalPlayers.push(mk(`fill${i}_${k}`, "zz_strong_" + i, 95));
  }
  s.internationalPlayers.push(...A, ...B);
  roll(s);
  const gain = (l) => l.reduce((n, p) => n + p.ovr - 70, 0) / l.length;
  assert.ok(gain(A) > gain(B) + 0.15, `titular ${gain(A)} vs reserva ${gain(B)}`);
});

test("34F.22 (5) so mundos FC 27 evoluem; carreira legada nao muda; hero e aposentados nao entram", () => {
  const legacy = D.create({ mode: "coach", clubId: "c0" }, 5);
  const pre = JSON.stringify((legacy.internationalPlayers || []).map((p) => [p.id, p.ovr, p.potential]));
  roll(legacy);
  assert.equal(JSON.stringify((legacy.internationalPlayers || []).map((p) => [p.id, p.ovr, p.potential])), pre);
  const s = fc27(), p0 = s.internationalPlayers[0];
  p0.status = "retired"; p0.active = false;
  const o = p0.ovr; roll(s);
  assert.equal(p0.ovr, o, "aposentado intacto");
});

test("34F.22 (6) apos varias temporadas o save hibrido continua fazendo round-trip identico", () => {
  const s = fc27();
  for (let i = 0; i < 3; i++) roll(s);
  const text = Save.encodeHybridSave(s, { sparseStats: true }), dec = Save.decodeHybridSave(JSON.parse(text));
  assert.equal(JSON.stringify(dec.internationalPlayers.map((p) => [p.id, p.ovr, p.potential, p.clubId, p.status])), JSON.stringify(s.internationalPlayers.map((p) => [p.id, p.ovr, p.potential, p.clubId, p.status])));
});

test("34F.22 (7) forca dos clubes da IA passa a refletir a evolucao do elenco", () => {
  const s = fc27(), W = D.WorldClubCompetitions;
  const before = new Map(s.globalFootball.clubs.map((c) => [c.id, c.strength]));
  for (let i = 0; i < 3; i++) roll(s);
  W.refreshStrengths(s);
  let moved = 0; for (const c of s.globalFootball.clubs) if (Number.isFinite(c.strength) && before.get(c.id) !== c.strength) moved++;
  assert.ok(moved > 100, "clubes com forca alterada: " + moved);
});

test("34F.22 (8) atributos acompanham o GER apos a evolucao (consistentes em todas as telas)", () => {
  const s = fc27(), before = ovrs(s);
  roll(s);
  let moved = 0;
  for (const p of s.internationalPlayers) {
    if (!before.has(p.id) || p.status === "retired") continue;
    for (const k of ["pace", "finish", "pass", "defense", "strength", "stamina"]) assert.equal(p.attrs[k], p.ovr, p.id + " " + k);
    if (p.ovr !== before.get(p.id)[0]) moved++;
  }
  assert.ok(moved > 5000);
});
