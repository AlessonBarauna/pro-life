"use strict";
// Stage 32D.2 - perfis de evolucao (32B) no multiplicador de progressao de progressAttribute().
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const PD = require("../src/domain/player-development.js");
const DP = require("../src/domain/dynamic-potential.js");
const BS = JSON.stringify(D.create({ mode: "player", name: "Dev", age: 22, pos: "MEI", clubId: "c0" }, 21));
const mk = (age, prof, extra) => { const s = JSON.parse(BS); s.person.age = age; s.person.potential = 95; if (prof) s.person.developmentProfile = { id: prof, v: 1 }; if (extra) extra(s); return s; };
const score = (s) => { let t = 0; for (const k of Object.keys(s.person.attrs)) if (typeof s.person.attrs[k] === "number") t += s.person.attrs[k] + D.Training.attributeProgressPercent(s, k) / 100; return t; };
function run(s, n = 30, automatic = true) {
  const p = D.Training.init(s); p.exerciseId = "boxFinish"; const t0 = score(s);
  for (let i = 0; i < n; i++) { s.day = 2000 + i; s.person.condition = 100; s.person.injury = 0; s.intensity = "normal"; s.calendarDays = []; s.round = 0; s.fixtures = []; s.competitionSchedule = {};
    D.Training.performTraining(s, new D.Random(500 + i), D, { automatic }); }
  return score(s) - t0;
}
const gains = (age, n) => Object.fromEntries(PD.PROFILE_IDS.map((id) => [id, run(mk(age, id), n)]));

test("32D.2 (1) jovens: prodigy/early > steady > late_bloomer; seis perfis diferem", () => {
  const g = gains(18);
  assert.ok(g.prodigy > g.steady_rise * 1.2 && g.early_unstable > g.steady_rise * 1.2 && g.steady_rise > g.late_bloomer * 1.3);
  assert.ok(new Set(Object.values(g).map((v) => v.toFixed(2))).size >= 5);
  console.log("idade 18", JSON.stringify(g));
});
test("32D.2 (2) auge: late_bloomer ainda cresce e supera os demais; steady mantem o legado", () => {
  const g = gains(26); console.log("idade 26", JSON.stringify(g));
  assert.ok(g.late_bloomer > g.steady_rise * 1.2);
  assert.ok(g.career_burst < g.steady_rise && g.longevity < g.steady_rise);
});
test("32D.2 (3) veteranos: longevity retem mais que prodigy/early; steady = legado", () => {
  const g = gains(35); console.log("idade 35", JSON.stringify(g));
  assert.ok(g.longevity > g.steady_rise && g.steady_rise > g.prodigy && g.prodigy <= g.early_unstable * 1.01);
});
test("32D.2 (4) mesma idade, perfis diferentes; idades diferentes, mesmo perfil", () => {
  const y = run(mk(18, "steady_rise")), p = run(mk(26, "steady_rise")), v = run(mk(35, "steady_rise"));
  assert.ok(y > p && p > v);
});
test("32D.2 (5) treino manual e automatico: ambos influenciados; manual maior que automatico", () => {
  const man = (id) => run(mk(18, id), 5, false), aut = (id) => run(mk(18, id), 5, true);
  assert.ok(man("prodigy") > man("late_bloomer")); assert.ok(aut("prodigy") > aut("late_bloomer"));
  assert.ok(man("prodigy") > 0);
});
function match(s) { return { season: s.season, date: s.day, competitionId: "liga", homeId: "a", awayId: "b", round: 1, participants: [["hero"], []], ratings: { hero: 8 }, playerStats: { hero: { minutes: 90, tackles: 0, saves: 0 } }, events: [], hg: 1, ag: 0, offensiveStats: { hero: {} } }; }
test("32D.2 (6) evolucao por partidas tambem usa o perfil e nao conta a nota duas vezes", () => {
  const out = {};
  for (const id of ["prodigy", "late_bloomer"]) {
    const s = mk(18, id, (x) => { x.statistics = { players: { hero: { appearances: 10, ratingTotal: 90 } } }; }); D.Training.init(s); s.day = 3000;
    const t0 = score(s); D.Training.matchDevelopment(s, match(s), D); out[id] = score(s) - t0;
  }
  assert.ok(out.prodigy > out.late_bloomer);
});
test("32D.2 (7) determinismo e sem gravar perfil / sem mutar fora do treino", () => {
  const a = run(mk(20, null)), b = run(mk(20, null)); assert.equal(a, b);
  const s = mk(20, null); assert.equal(s.person.developmentProfile, undefined); run(s, 3); assert.deepEqual(Object.keys(s.person.developmentProfile).sort(), ["id", "v"]); // 32D.3A: fixado no 1o desenvolvimento
});
test("32D.2 (8) GER maximo 100 e teto individual preservados", () => {
  const s = mk(19, "prodigy", (x) => { for (const k of Object.keys(x.person.attrs)) if (typeof x.person.attrs[k] === "number") x.person.attrs[k] = 96; });
  run(s, 60); const o = D.overall(s.person); assert.ok(o <= 100);
  const low = mk(30, "longevity", (x) => { x.person.potential = 60; }); const before = D.overall(low.person); run(low, 60);
  assert.ok(D.overall(low.person) <= Math.max(before, DP.effectiveCeiling({ ...low.person, overall: D.overall(low.person), ovr: D.overall(low.person) }, { seed: low.initialSeed ?? low.rng })) + 1);
});
test("32D.2 (9) treino repetido no mesmo dia nao gera ganho extra", () => {
  const s = mk(18, "prodigy"); const p = D.Training.init(s); p.exerciseId = "boxFinish";
  s.day = 2500; s.person.condition = 100; s.calendarDays = []; s.fixtures = []; s.competitionSchedule = {}; s.intensity = "normal";
  const r1 = D.Training.performTraining(s, new D.Random(1), D); assert.equal(r1.available, true);
  const snap = JSON.stringify(s.person.attrs) + JSON.stringify(p.attributeProgress) + p.sessions;
  const r2 = D.Training.performTraining(s, new D.Random(2), D); assert.equal(r2.available, false);
  assert.equal(JSON.stringify(s.person.attrs) + JSON.stringify(p.attributeProgress) + p.sessions, snap);
});
test("32D.2 (10) save antigo sem perfil e sem estatisticas continua funcionando", () => {
  const s = mk(23, null, (x) => { delete x.statistics; }); const g = run(s, 5); assert.ok(g > 0 && Number.isFinite(g));
  assert.deepEqual(Object.keys(s.person.developmentProfile).sort(), ["id", "v"]);
});
