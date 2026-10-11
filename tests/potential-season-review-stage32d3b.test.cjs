"use strict";
// Stage 32D.3B - revisao sazonal do potencial (substitui ganhos por partida e por titulo).
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const S = require("../src/infrastructure/save.js"), DP = require("../src/domain/dynamic-potential.js");
const clone = (o) => JSON.parse(JSON.stringify(o));
const BASE = JSON.stringify(D.create({ mode: "player", name: "Anual", age: 19, pos: "MEI", clubId: "c0" }, 31));
// Estado com dados anuais controlados (12 jogos do clube).
function mk({ age = 19, pos = "MEI", potential = 80, apps = 12, minutes = 1000, rating = 7.9, injuries = [], opportunities = 12 } = {}) {
  const s = JSON.parse(BASE); const rc = s.clubs.find((c) => c.id === s.clubId); rc.roster[rc.roster.findIndex((p) => p.id === "hero")] = s.person; s.person.age = age; s.person.pos = pos; s.person.potential = potential;
  s.matches = Array.from({ length: opportunities }, (_, i) => ({ season: s.season, date: 10 + i * 7, home: s.clubId, away: "zz" + i, participants: [[], []] }));
  s.statistics.seasons.unshift({ season: s.season, player: { appearances: apps, minutes, averageRating: rating, stints: [{ season: s.season, clubId: s.clubId, startDay: 0, endDay: 365 }] } });
  if (injuries.length) s.person.physical = { fatigue: 0, fitness: 100, active: null, history: injuries.map((sev, i) => ({ type: "x", severity: sev, startDay: 20 + i * 30, returnDay: 40 + i * 30 })), recentLoad: 0, returnMode: "full", processed: [] };
  return s;
}
const persistable = (s) => { const c = clone(s); const rc = c.clubs.find((x) => x.id === c.clubId); rc.roster[rc.roster.findIndex((p) => p.id === "hero")] = c.person; c.matches = JSON.parse(BASE).matches; c.statistics.seasons = JSON.parse(BASE).statistics.seasons; return c; };
const review = (s, awards = []) => { D.Training.seasonRewards(s, awards, D); return s; };

test("32D.3B (1) jovem com temporada excelente sobe, dentro do limite anual da 32C", () => {
  const s = review(mk()); const d = s.person.potential - 80;
  console.log("jovem excelente: 80 ->", s.person.potential); assert.ok(d > 0 && d <= DP.LIMITS.maxRisePerReview);
  assert.deepEqual(Object.keys(s.person.potentialReview).sort(), ["lastReviewSeason", "originalPotential"]); assert.equal(s.person.potentialReview.originalPotential, 80);
});
test("32D.3B (2) temporada ruim reduz", () => { const s = review(mk({ rating: 5.6, minutes: 700, apps: 10 })); console.log("temporada ruim: 80 ->", s.person.potential); assert.ok(s.person.potential < 80); });
test("32D.3B (3) pouca minutagem de jovem reduz, sem inventar nota", () => { const s = review(mk({ apps: 1, minutes: 10, rating: 8 })); console.log("pouca minutagem: 80 ->", s.person.potential); assert.ok(s.person.potential < 80); });
test("32D.3B (4) lesoes graves reduzem e anulam o ganho", () => { const s = review(mk({ injuries: ["GRAVE", "GRAVE"] })); console.log("lesoes graves: 80 ->", s.person.potential); assert.ok(s.person.potential < 80); });
test("32D.3B (5) veterano nao sobe e cai por idade", () => { const s = review(mk({ age: 33, potential: 78, rating: 8 })); console.log("veterano 33: 78 ->", s.person.potential); assert.ok(s.person.potential <= 78); });
test("32D.3B (6) goleiro oscila menos que meia", () => {
  const a = review(mk({ pos: "GOL" })), b = review(mk({ pos: "MEI" })); console.log("GOL", a.person.potential, "MEI", b.person.potential);
  assert.ok(a.person.potential - 80 < b.person.potential - 80 && a.person.potential >= 80);
});
test("32D.3B (7) titulos e premios nao elevam o potencial diretamente", () => {
  const s = mk({ opportunities: 3 }); // dados insuficientes -> sem revisao
  const before = s.person.potential, name = s.person.name;
  const pts = D.Training.seasonRewards(s, [{ name: "Craque da competição", winner: name }, { name: "Artilheiro", winner: name }], D);
  assert.ok(pts >= 8); assert.equal(s.person.potential, before); assert.equal(s.person.potentialReview, undefined);
  assert.ok(s.trainingPlan.accoladePoints >= 8, "pontos de conquista preservados");
});
test("32D.3B (8) idempotencia: segunda chamada, reload e nova rotina nao duplicam", () => {
  const s = review(mk()); const p1 = s.person.potential, rec = JSON.stringify(s.person.potentialReview);
  review(s); review(s); assert.equal(s.person.potential, p1); assert.equal(JSON.stringify(s.person.potentialReview), rec);
  const back = S.parse(JSON.stringify(persistable(s))); Object.assign(back, { matches: s.matches, statistics: { ...back.statistics, seasons: s.statistics.seasons } }); review(back); assert.equal(back.person.potential, p1);
  const t = clone(s); t.season += 1; t.statistics.seasons.unshift({ ...clone(s.statistics.seasons[0]), season: t.season }); t.matches.forEach((m) => { m.season = t.season; m.date += 365; }); t.statistics.seasons[0].player.stints[0].season = t.season; t.statistics.seasons[0].player.stints[0].startDay = 365; t.statistics.seasons[0].player.stints[0].endDay = 730;
  review(t); assert.equal(t.person.potentialReview.lastReviewSeason, t.season); assert.equal(t.person.potentialReview.originalPotential, 80);
  assert.ok(t.person.potential <= 80 + DP.LIMITS.maxRiseTotal);
});
test("32D.3B (9) limites da 32C: teto total de alta e GER coerente", () => {
  let s = mk({ potential: 70 }); const orig = 70;
  for (let y = 0; y < 8; y++) { review(s); s.season += 1; s.statistics.seasons.unshift({ season: s.season, player: clone(s.statistics.seasons[0].player) }); s.statistics.seasons[0].player.stints[0].season = s.season; s.statistics.seasons[0].player.stints[0].startDay += 365; s.statistics.seasons[0].player.stints[0].endDay += 365; s.matches.forEach((m) => { m.season = s.season; m.date += 365; }); }
  assert.ok(s.person.potential <= orig + DP.LIMITS.maxRiseTotal + 1e-9 && s.person.potential <= 99);
  assert.ok(s.person.potential >= D.overall(s.person));
});
test("32D.3B (10) sem partida: matchDevelopment nao altera o potencial", () => {
  const s = mk(); D.Training.init(s); s.day = 100; const before = s.person.potential;
  const r = D.Training.matchDevelopment(s, { season: s.season, date: 100, competitionId: "liga", homeId: "a", awayId: "b", round: 1, participants: [["hero"], []], ratings: { hero: 9 }, playerStats: { hero: { minutes: 90 } }, events: [{ type: "goal", playerId: "hero" }], hg: 1, ag: 0, offensiveStats: { hero: {} } }, D);
  assert.equal(s.person.potential, before); assert.equal(r.potentialDelta, 0);
});
test("32D.3B (11) carreira antiga sem campos novos: sem mudanca retroativa nem consulta com efeito", () => {
  const s = mk(); assert.equal(s.person.potentialReview, undefined); const snap = JSON.stringify(s.person);
  const o = D.overall(s.person); DP.potentialOutlook({ ...s.person, overall: o, ovr: o }); DP.effectiveCeiling({ ...s.person, overall: o, ovr: o }, { seed: 1 }); D.Training.init(s); D.Training.ceiling(s, D);
  assert.equal(JSON.stringify(s.person), snap);
});
test("32D.3B (12) save/reload antes e depois; legado, hibrido v1 e v2", () => {
  const s = mk(); const pre = S.parse(JSON.stringify(persistable(s))); assert.equal(pre.person.potentialReview, undefined);
  review(s); const rec = JSON.stringify(s.person.potentialReview), pot = s.person.potential, ps = persistable(s);
  for (const text of [JSON.stringify(ps), S.encodeHybridSave(ps), S.encodeHybridSave(ps, { sparseStats: true })]) { const b = S.parse(text); assert.equal(b.person.potential, pot); assert.equal(JSON.stringify(b.person.potentialReview), rec); }
});
test("32D.3B (13) modo treinador intacto", () => {
  const c = D.create({ mode: "coach", world: "legacy", name: "Tec" }, 31); assert.equal(D.Training.seasonRewards(c, [], D), 0); assert.equal(c.person?.potentialReview, undefined);
});
