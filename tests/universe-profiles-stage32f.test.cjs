"use strict";
// Stage 32F - perfis de desenvolvimento (32B) na evolucao/envelhecimento dos jogadores do universo.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const S = require("../src/infrastructure/save.js"), PD = require("../src/domain/player-development.js"), U = D.World2;
const clone = (o) => JSON.parse(JSON.stringify(o));
const BASE = JSON.stringify(D.create({ mode: "player", name: "Uni", age: 22, pos: "MEI", clubId: "c0" }, 31));
const fresh = () => JSON.parse(BASE);
const CORE = ["pace", "finish", "pass", "defense", "strength", "stamina"];
const roll = (s, n) => { for (let i = 0; i < n; i++) { s.season++; s.person.age++; U.rollSeason(s, D); } return s; };
const players = (s) => s.clubs.flatMap((c) => c.roster).filter((p) => p.id !== "hero");
const heroAttrs = (s) => JSON.stringify(s.person.attrs);
const hashOf = (s) => JSON.stringify(s.clubs.map((c) => c.roster.map((p) => [p.id, p.age, p.attrs])));
let FIVE; const five = () => (FIVE ||= (() => { const s = fresh(), start = new Map(); for (const p of players(s)) start.set(p.id, { age: p.age, o: D.overall(p), pos: p.pos, a: { ...p.attrs } }); roll(s, 5); return { s, start }; })());

test("32F (1) jovens evoluem em 5 temporadas, de forma nao uniforme", () => {
  const { s, start } = five(), d = [];
  for (const p of players(s)) { const t = start.get(p.id); if (t && t.age <= 21) d.push(D.overall(p) - t.o); }
  const mean = d.reduce((a, b) => a + b, 0) / d.length, sd = Math.sqrt(d.reduce((a, b) => a + (b - mean) ** 2, 0) / d.length);
  console.log("jovens (<=21):", d.length, "delta GER medio", mean.toFixed(2), "dp", sd.toFixed(2)); assert.ok(mean > 1.5 && sd > 1);
});
test("32F (2) veteranos declinam, mais nos atributos fisicos que nos tecnicos", () => {
  const { s, start } = five(); let n = 0, phys = 0, tech = 0, dv = 0;
  for (const p of players(s)) { const t = start.get(p.id); if (!t || t.age < 31 || t.pos === "GOL") continue; n++; dv += D.overall(p) - t.o; for (const k of ["pace", "stamina", "strength"]) phys += t.a[k] - p.attrs[k]; for (const k of ["finish", "pass", "defense"]) tech += t.a[k] - p.attrs[k]; }
  console.log("veteranos:", n, "delta GER", (dv / n).toFixed(2), "queda fisica/tec", (phys / n).toFixed(2), (tech / n).toFixed(2)); assert.ok(n > 5 && dv / n < -3 && phys > tech);
});
function avgDelta(profile, age, pos, rounds = 60) {
  const s = fresh(); roll(s, 0); U.rollSeason(s, D); let total = 0;
  const base = players(s).find((p) => p.pos === pos);
  for (let i = 0; i < rounds; i++) {
    const p = clone(base); p.id = "t" + i; p.name = "Teste " + i; p.age = age; p.potential = 90; p.developmentProfile = { id: profile, v: 1 };
    const before = D.overall(p), rng = new D.Random(1000 + i); U.develop(p, null, null, 60, rng, 2026); total += D.overall(p) - before;
  }
  return total / rounds;
}
test("32F (3) longevity mantem rendimento por mais tempo; precoce instavel cai antes", () => {
  console.log("age 33 MEI:", PD.PROFILE_IDS.map((id) => id + ":" + avgDelta(id, 33, "MEI").toFixed(2)).join(" "));
  assert.ok(avgDelta("longevity", 33, "MEI") > avgDelta("steady_rise", 33, "MEI"));
  assert.ok(avgDelta("early_unstable", 27, "MEI") < avgDelta("steady_rise", 27, "MEI"));
});
test("32F (4) goleiros declinam mais tarde e mais devagar", () => {
  assert.ok(avgDelta("steady_rise", 33, "GOL") > avgDelta("steady_rise", 33, "MEI")); assert.ok(avgDelta("steady_rise", 36, "GOL") > avgDelta("steady_rise", 36, "MEI"));
});
test("32F (5) perfis de crescimento diferenciam jovens (prodigy > steady > late_bloomer aos 19)", () => {
  const a = avgDelta("prodigy", 19, "MEI"), b = avgDelta("steady_rise", 19, "MEI"), c = avgDelta("late_bloomer", 19, "MEI"); console.log("age 19:", a.toFixed(2), b.toFixed(2), c.toFixed(2));
  assert.ok(a >= b && b >= c && a > c);
});
test("32F (6) transferencia nao altera perfil nem evolucao (mesmo id, clube diferente)", () => {
  const s = fresh(); U.rollSeason(s, D); const base = players(s)[0];
  const run = (club) => { const p = clone(base); p.age = 24; U.develop(p, club, null, 60, new D.Random(77), 2026); return JSON.stringify(p.attrs); };
  assert.equal(run(null), run({ __maxMinutes: 3000 })); assert.equal(run(null), run({ __maxMinutes: 9000, id: "outro" }));
});
test("32F (7) determinismo: mesma seed, mesmos elencos; idempotencia por temporada", () => {
  const a = roll(fresh(), 3), b = roll(fresh(), 3); assert.equal(hashOf(a), hashOf(b));
  const h = hashOf(a); U.rollSeason(a, D); U.rollSeason(a, D); assert.equal(hashOf(a), h);
});
test("32F (8) protagonista inalterado, nenhum perfil gravado em jogadores", () => {
  const { s } = five(); assert.equal(heroAttrs(s), heroAttrs(fresh())); assert.equal(players(s).filter((p) => p.developmentProfile).length, 0);
});
test("32F (9) potencial respeitado, sem crescimento ilimitado, aposentadorias e elencos preservados", () => {
  const s = fresh(); const n0 = players(s).length; roll(s, 10);
  const over = players(s).filter((p) => D.overall(p) > Math.max(p.potential, 0) + 3 && p.age <= 27); assert.equal(over.length, 0);
  assert.ok(Math.max(...players(s).map((p) => D.overall(p))) < 92);
  assert.ok(s.universe.summary && s.universe.seasons.length >= 1); assert.ok(s.universe.seasons.some((x) => x.retired > 0));
  for (const c of s.clubs) for (const pos of ["GOL", "DEF", "MEI", "ATA"]) assert.ok(c.roster.filter((p) => p.pos === pos).length >= (pos === "GOL" ? 1 : 3), c.name + pos);
  assert.ok(Math.abs(players(s).length - n0) < n0 * 0.1);
});
test("32F (10) equilibrio entre clubes fortes, medios e pequenos", () => {
  const lvl = (s) => s.clubs.map((c) => { const t = c.roster.filter((p) => p.id !== "hero").map(D.overall).sort((a, b) => b - a).slice(0, 14); return t.reduce((n, x) => n + x, 0) / t.length; }).sort((a, b) => b - a);
  const s = fresh(), a = lvl(s); roll(s, 10); const b = lvl(s);
  const top = (x) => x.slice(0, 5).reduce((n, v) => n + v, 0) / 5, bot = (x) => x.slice(-5).reduce((n, v) => n + v, 0) / 5;
  console.log("top5", top(a).toFixed(1), "->", top(b).toFixed(1), "| mediana", a[a.length >> 1].toFixed(1), "->", b[b.length >> 1].toFixed(1), "| bottom5", bot(a).toFixed(1), "->", bot(b).toFixed(1));
  assert.ok(top(a) - top(b) < 6 && bot(a) - bot(b) < 7 && top(b) > bot(b) + 12);
});
test("32F (11) save/reload completo e hibrido v1/v2 preservam o universo evoluido; tamanho", () => {
  const s = D.create({ mode: "player", name: "Uni", age: 22, pos: "MEI", clubId: "c0" }, 31); D.advance(s, 20);
  const text = JSON.stringify(s); const back = S.parse(text); assert.equal(hashOf(back), hashOf(s));
  assert.equal(hashOf(S.parse(S.encodeHybridSave(s))), hashOf(s)); assert.equal(hashOf(S.parse(S.encodeHybridSave(s, { sparseStats: true }))), hashOf(s));
  const sz = []; const t = fresh(); sz.push(JSON.stringify(t).length); for (const n of [1, 4, 5]) { roll(t, n); sz.push(JSON.stringify(t).length); } console.log("tamanho t0,1,5,10:", sz.join(" "));
});
