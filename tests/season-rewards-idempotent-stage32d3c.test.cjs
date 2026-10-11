"use strict";
// Stage 32D.3C - integridade e idempotencia das recompensas de temporada.
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


const mkq = (o) => { const s = mk(o); const own = s.clubs.find((c) => c.id === s.clubId); own.stats.points = -50; return s; }; // clube nao e campeao
const pts = (s) => s.trainingPlan.accoladePoints;
const W = (s) => [{ name: "Craque da competição", winner: s.person.name }, { name: "Artilheiro", winner: s.person.name }, { name: "Revelação", winner: s.person.name }];
const nextSeason = (s) => { const t = clone(s); t.season += 1; const sn = clone(t.statistics.seasons[0]); sn.season = t.season; sn.player.stints[0].season = t.season; sn.player.stints[0].startDay += 365; sn.player.stints[0].endDay += 365; t.statistics.seasons.unshift(sn); t.matches.forEach((m) => { m.season = t.season; m.date += 365; }); return t; };
const withHeroLinked = (c) => { const rc = c.clubs.find((x) => x.id === c.clubId); rc.roster[rc.roster.findIndex((p) => p.id === "hero")] = c.person; return c; };

test("32D.3C (1) seasonRewards duas vezes na mesma temporada nao duplica pontos", () => {
  const s = mkq(); D.Training.init(s); const b = pts(s);
  const p1 = D.Training.seasonRewards(s, W(s), D), after1 = pts(s), p2 = D.Training.seasonRewards(s, W(s), D);
  assert.equal(p1, 12); assert.equal(after1, b + 12); assert.equal(p2, 0); assert.equal(pts(s), after1); assert.equal(s.trainingPlan.lastRewardSeason, s.season);
});
test("32D.3C (2) apos save/reload (completo, hibrido v1 e v2) a rotina nao repete", () => {
  const s = mkq(); D.Training.seasonRewards(s, W(s), D); const total = pts(s), pot = s.person.potential;
  const ps = withHeroLinked(clone(s)); ps.clubs = ps.clubs.map((c) => c.id === ps.clubId ? { ...c, stats: JSON.parse(BASE).clubs.find((x) => x.id === c.id).stats } : c); withHeroLinked(ps); ps.matches = JSON.parse(BASE).matches; ps.statistics.seasons = JSON.parse(BASE).statistics.seasons;
  for (const text of [JSON.stringify(ps), S.encodeHybridSave(ps), S.encodeHybridSave(ps, { sparseStats: true })]) {
    const b = S.parse(text); assert.equal(b.trainingPlan.lastRewardSeason, s.season); assert.equal(pts(b), total);
    Object.assign(b, { matches: s.matches, statistics: { ...b.statistics, seasons: s.statistics.seasons } });
    assert.equal(D.Training.seasonRewards(b, W(b), D), 0); assert.equal(pts(b), total); assert.equal(b.person.potential, pot);
  }
});
test("32D.3C (3) temporada sem titulos: marcador gravado; conquistas tardias da mesma temporada nao pagam", () => {
  const s = mkq(); D.Training.init(s); const b = pts(s);
  assert.equal(D.Training.seasonRewards(s, [], D), 0); assert.equal(pts(s), b); assert.equal(s.trainingPlan.lastRewardSeason, s.season);
  assert.equal(D.Training.seasonRewards(s, W(s), D), 0); assert.equal(pts(s), b);
});
test("32D.3C (4) multiplas conquistas somam uma vez e a proxima temporada paga de novo", () => {
  const s = mkq(); D.Training.init(s); const b = pts(s); D.Training.seasonRewards(s, W(s), D); assert.equal(pts(s), b + 12);
  const t = nextSeason(s); D.Training.seasonRewards(t, W(t), D); assert.equal(pts(t), b + 24); assert.equal(t.trainingPlan.lastRewardSeason, t.season);
  D.Training.seasonRewards(t, W(t), D); assert.equal(pts(t), b + 24);
});
test("32D.3C (5) sem dados para revisar o potencial, a recompensa legitima e paga", () => {
  const s = mkq({ opportunities: 3 }); D.Training.init(s); const b = pts(s), pot = s.person.potential;
  assert.equal(D.Training.seasonRewards(s, W(s), D), 12); assert.equal(pts(s), b + 12); assert.equal(s.person.potential, pot); assert.equal(s.person.potentialReview, undefined);
});
test("32D.3C (6) potencial muda no maximo uma vez por temporada e independe das recompensas", () => {
  const s = mkq(); D.Training.seasonRewards(s, W(s), D); const p1 = s.person.potential; assert.notEqual(p1, 80);
  D.Training.seasonRewards(s, W(s), D); D.Training.seasonRewards(s, [], D); assert.equal(s.person.potential, p1);
  assert.equal(s.person.potentialReview.lastReviewSeason, s.season);
  // revisao ja feita (marcador de potencial) nao impede a recompensa se ela ainda nao foi paga
  const t = mkq(); D.Training.init(t); D.Training.reviewSeasonPotential(t, D); const pp = t.person.potential, b = pts(t);
  assert.equal(D.Training.seasonRewards(t, W(t), D), 12); assert.equal(pts(t), b + 12); assert.equal(t.person.potential, pp);
});
test("32D.3C (7) save antigo sem marcador: politica segura contra reaplicacao", () => {
  // (a) apos a virada (snapshot da temporada anterior) -> nunca paga
  const a = mkq(); D.Training.init(a); a.season += 1; const ba = pts(a); assert.equal(a.trainingPlan.lastRewardSeason, undefined);
  assert.equal(D.Training.seasonRewards(a, W(a), D), 0); assert.equal(pts(a), ba);
  // (b) no momento do fechamento (snapshot == temporada) -> paga uma vez
  const b = mkq(); D.Training.init(b); const bb = pts(b); assert.equal(D.Training.seasonRewards(b, W(b), D), 12); assert.equal(D.Training.seasonRewards(b, W(b), D), 0); assert.equal(pts(b), bb + 12);
  // (c) sem nenhum snapshot -> paga uma vez (chamada direta)
  const c = mkq(); c.statistics.seasons = []; D.Training.init(c); const bc = pts(c); assert.equal(D.Training.seasonRewards(c, W(c), D), 12); assert.equal(D.Training.seasonRewards(c, W(c), D), 0); assert.equal(pts(c), bc + 12);
});
test("32D.3C (8) consultas nao criam marcador; XP e nivel nao mudam", () => {
  const s = mkq(); D.Training.init(s); const snap = JSON.stringify(s.trainingPlan);
  D.Training.ceiling(s, D); D.Training.attributeProgressPercent(s, "pass"); assert.equal(JSON.stringify(s.trainingPlan), snap); assert.equal(s.trainingPlan.lastRewardSeason, undefined);
  const lv = s.trainingPlan.level, xp = s.trainingPlan.xp; D.Training.seasonRewards(s, W(s), D); assert.equal(s.trainingPlan.level, lv); assert.equal(s.trainingPlan.xp, xp);
});
test("32D.3C (9) virada de temporada real no motor: uma unica recompensa e uma unica revisao", () => {
  const s = D.create({ mode: "player", name: "Virada", age: 19, pos: "MEI", clubId: "c0" }, 31);
  const orig = D.Training.seasonRewards, log = [];
  D.Training.seasonRewards = function (st, a, h) { const b = pts(st), pb = st.person.potential, r = orig.call(this, st, a, h); log.push({ season: st.season, gained: pts(st) - b, ret: r, dPot: st.person.potential - pb }); return r; };
  try { let g = 0; while (s.season === 2026 && g++ < 60) D.advance(s, 10); D.advance(s, 15); } finally { D.Training.seasonRewards = orig; }
  console.log("virada", JSON.stringify(log), "marcadores", s.trainingPlan.lastRewardSeason, JSON.stringify(s.person.potentialReview));
  assert.equal(log.length, 1); assert.equal(log[0].season, 2026); assert.equal(s.trainingPlan.lastRewardSeason, 2026);
  const total = pts(s), pot = s.person.potential;
  assert.equal(orig.call(D.Training, s, W(s), D), 0); assert.equal(pts(s), total); assert.equal(s.person.potential, pot);
});
