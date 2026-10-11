"use strict";
// Stage 32D.4 - auge, envelhecimento e declinio de atributos do protagonista.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const PD = require("../src/domain/player-development.js");
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

const withHeroLinked = (c) => { const rc = c.clubs.find((x) => x.id === c.clubId); rc.roster[rc.roster.findIndex((p) => p.id === "hero")] = c.person; return c; };

const CORE = ["pace", "finish", "pass", "defense", "strength", "stamina"], PHYS = ["pace", "strength", "stamina"], TECH = ["finish", "pass", "defense"];
function hero(age, prof, pos = "MEI", v = 75) {
  const s = mk({ age, pos, potential: 95, rating: 7, apps: 10, minutes: 800 }); s.person.developmentProfile = { id: prof, v: 1 };
  D.Training.init(s); for (const k of Object.keys(s.person.attrs)) if (typeof s.person.attrs[k] === "number") s.person.attrs[k] = v; s.trainingPlan.attributeProgress = {}; return s;
}
const age1 = (s) => { const b = clone(s.person.attrs), o = D.overall(s.person); const r = D.Training.applySeasonAging(s, D); const d = {}; for (const k of CORE) d[k] = b[k] - s.person.attrs[k]; return { r, d, dOvr: o - D.overall(s.person), phys: PHYS.reduce((n, k) => n + d[k], 0), tech: TECH.reduce((n, k) => n + d[k], 0) }; };
const drops = (age, prof, pos) => age1(hero(age, prof, pos)).dOvr;

test("32D.4 (1) jovem de 18 anos nao sofre declinio e continua evoluindo por treino", () => {
  const s = hero(18, "steady_rise"); const a = age1(s); assert.equal(a.dOvr, 0); assert.equal(a.phys + a.tech, 0);
  const p = D.Training.init(s); p.exerciseId = "boxFinish"; s.day = 3000; s.person.condition = 100; s.intensity = "normal"; s.calendarDays = []; s.fixtures = []; s.competitionSchedule = {};
  const before = JSON.stringify(s.person.attrs); D.Training.performTraining(s, new D.Random(3), D, { automatic: true }); assert.notEqual(JSON.stringify(s.person.attrs) + JSON.stringify(p.attributeProgress), before + "{}");
});
test("32D.4 (2) jogador no auge mantem o rendimento", () => { for (const pr of ["steady_rise", "prodigy", "longevity", "late_bloomer"]) assert.equal(drops(25, pr), 0, pr); });
test("32D.4 (3) veterano perde mais atributos fisicos que tecnicos", () => { const a = age1(hero(36, "steady_rise")); console.log("veterano 36:", JSON.stringify(a.d)); assert.ok(a.phys > a.tech && a.phys >= 3); });
test("32D.4 (4) perfil longevity perde menos que os demais", () => { assert.ok(drops(35, "longevity") < drops(35, "steady_rise") && drops(35, "longevity") < drops(35, "prodigy")); assert.ok(age1(hero(40, "longevity")).phys < age1(hero(40, "steady_rise")).phys + 1); });
test("32D.4 (5) goleiro envelhece mais tarde e mais devagar", () => {
  assert.ok(drops(30, "prodigy", "GOL") < drops(30, "prodigy", "MEI")); assert.ok(drops(35, "steady_rise", "GOL") < drops(35, "steady_rise", "MEI")); assert.ok(drops(40, "steady_rise", "GOL") <= drops(40, "steady_rise", "MEI"));
});
test("32D.4 (6) precoce instavel perde rendimento mais cedo", () => { assert.ok(drops(25, "early_unstable") > 0); assert.equal(drops(25, "steady_rise"), 0); assert.ok(drops(30, "early_unstable") > drops(30, "steady_rise")); });
test("32D.4 (7) declinio anual moderado, limitado e dentro dos limites validos", () => {
  for (const pr of PD.PROFILE_IDS) for (const pos of ["GOL", "DEF", "MEI", "ATA"]) for (let age = 18; age <= 44; age++) {
    const s = hero(age, pr, pos, 45), b = D.overall(s.person); D.Training.applySeasonAging(s, D);
    assert.ok(b - D.overall(s.person) <= 3, `${pr} ${pos} ${age}`); for (const v of Object.values(s.person.attrs)) assert.ok(v >= 20 && v <= 100);
  }
});
test("32D.4 (8) coerencia: subatributos acompanham o principal e GER vem dos seis principais", () => {
  const s = hero(37, "steady_rise"); const b = clone(s.person.attrs); D.Training.applySeasonAging(s, D);
  const related = { acceleration: "pace", sprint: "pace", agility: "pace", jumping: "strength", balance: "strength", tackling: "defense", interception: "defense", technique: "pass", vision: "pass" };
  for (const [sub, core] of Object.entries(related)) assert.equal(b[sub] - s.person.attrs[sub], b[core] - s.person.attrs[core], sub);
  const w = { MEI: { pace: 0.14, finish: 0.13, pass: 0.32, defense: 0.1, strength: 0.09, stamina: 0.22 } }.MEI;
  assert.equal(D.overall(s.person), Math.round(CORE.reduce((n, k) => n + s.person.attrs[k] * w[k], 0)));
});
test("32D.4 (9) idempotencia: duas chamadas na mesma temporada nao reduzem duas vezes", () => {
  const s = hero(36, "steady_rise"); const a = age1(s), snap = JSON.stringify(s.person.attrs), plan = s.trainingPlan;
  assert.ok(a.dOvr > 0); assert.equal(plan.lastAgingSeason, s.season); assert.equal(D.Training.applySeasonAging(s, D).applied, false);
  D.Training.seasonRewards(s, [], D); D.Training.seasonRewards(s, [], D); assert.equal(JSON.stringify(s.person.attrs), snap);
});
test("32D.4 (10) temporada ruim de jovem nao reduz atributos; consulta nao muda nada", () => {
  const s = mk({ age: 21, potential: 85, rating: 5.2, apps: 10, minutes: 800, injuries: ["GRAVE"] }); D.Training.init(s); const b = JSON.stringify(s.person.attrs);
  D.Training.seasonRewards(s, [], D); assert.equal(JSON.stringify(s.person.attrs), b);
  const q = hero(36, "steady_rise"); D.Training.init(q); const snap = JSON.stringify(q); D.Training.ceiling(q, D); D.Training.attributeProgressPercent(q, "pace"); D.Training.init(q); assert.equal(JSON.stringify(q), snap);
});
test("32D.4 (11) save/reload (completo, v1, v2) preserva o envelhecimento aplicado e nao repete", () => {
  const s = hero(36, "steady_rise"); D.Training.seasonRewards(s, [], D); const attrs = JSON.stringify(s.person.attrs);
  const ps = withHeroLinked(clone(s)); ps.matches = JSON.parse(BASE).matches; ps.statistics.seasons = JSON.parse(BASE).statistics.seasons;
  for (const text of [JSON.stringify(ps), S.encodeHybridSave(ps), S.encodeHybridSave(ps, { sparseStats: true })]) {
    const b = S.parse(text); assert.equal(JSON.stringify(b.person.attrs), attrs); assert.equal(b.trainingPlan.lastAgingSeason, s.season);
    Object.assign(b, { matches: s.matches, statistics: { ...b.statistics, seasons: s.statistics.seasons } }); D.Training.seasonRewards(b, [], D); assert.equal(JSON.stringify(b.person.attrs), attrs);
  }
});
test("32D.4 (12) save antigo sem marcador: nao envelhece fora da virada", () => {
  const a = hero(36, "steady_rise"); a.season += 1; const b = JSON.stringify(a.person.attrs); assert.equal(a.trainingPlan.lastAgingSeason, undefined);
  assert.equal(D.Training.applySeasonAging(a, D).applied, false); assert.equal(JSON.stringify(a.person.attrs), b);
  const c = hero(36, "steady_rise"); c.statistics.seasons = []; assert.ok(age1(c).dOvr > 0);
});
test("32D.4 (13) 5, 10 e 20 temporadas: deterministico, monotono e limitado", () => {
  const run = (prof, pos) => { const s = hero(29, prof, pos, 80), g = [D.overall(s.person)]; for (let y = 0; y < 20; y++) { D.Training.applySeasonAging(s, D); g.push(D.overall(s.person)); s.person.age += 1; s.season += 1; s.statistics.seasons.unshift({ season: s.season, player: clone(s.statistics.seasons[0].player) }); s.statistics.seasons[0].player.stints[0].season = s.season; }
    return g; };
  for (const [pr, pos] of [["steady_rise", "MEI"], ["longevity", "MEI"], ["early_unstable", "ATA"], ["steady_rise", "GOL"]]) {
    const a = run(pr, pos), b = run(pr, pos); assert.deepEqual(a, b);
    for (let i = 1; i < a.length; i++) { assert.ok(a[i] <= a[i - 1]); assert.ok(a[i - 1] - a[i] <= 3); }
    console.log(pr, pos, "GER aos 29/34/39/49:", a[0], a[5], a[10], a[20]);
  }
});
test("32D.4 (14) treinos e partidas continuam funcionais apos o envelhecimento", () => {
  const s = hero(36, "steady_rise", "MEI", 60); s.person.potential = 90; D.Training.seasonRewards(s, [], D);
  const p = D.Training.init(s); p.exerciseId = "boxFinish"; s.day = 4000; s.person.condition = 100; s.intensity = "normal"; s.calendarDays = []; s.fixtures = []; s.competitionSchedule = {};
  assert.equal(D.Training.performTraining(s, new D.Random(5), D, { automatic: true }).available, true);
  const r = D.Training.matchDevelopment(s, { season: s.season, date: 4000, competitionId: "liga", homeId: "a", awayId: "b", round: 1, participants: [["hero"], []], ratings: { hero: 8 }, playerStats: { hero: { minutes: 90 } }, events: [], hg: 1, ag: 0, offensiveStats: { hero: {} } }, D);
  assert.ok(r && r.bonus);
});
test("32D.4 (15) virada real no motor: envelhecimento aplicado uma unica vez", () => {
  const s = D.create({ mode: "player", name: "Veterano", age: 35, pos: "MEI", clubId: "c0" }, 31); s.person.potential = 80;
  const orig = D.Training.seasonRewards, log = [];
  D.Training.seasonRewards = function (st, a, h) { const b = clone(st.person.attrs), o = D.overall(st.person), r = orig.call(this, st, a, h); log.push({ season: st.season, dOvr: o - D.overall(st.person), changed: CORE.filter((k) => b[k] !== st.person.attrs[k]).length }); return r; };
  try { let g = 0; while (s.season === 2026 && g++ < 60) D.advance(s, 10); D.advance(s, 5); } finally { D.Training.seasonRewards = orig; }
  console.log("virada real", JSON.stringify(log), "idade", s.person.age, "marcador", s.trainingPlan.lastAgingSeason);
  assert.equal(log.length, 1); assert.equal(s.trainingPlan.lastAgingSeason, 2026); assert.ok(log[0].dOvr >= 0 && log[0].dOvr <= 3); assert.equal(s.person.age, 36);
});
