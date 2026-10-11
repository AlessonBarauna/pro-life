"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Dev = require("../src/domain/player-development.js");

const IDS = ["prodigy", "steady_rise", "late_bloomer", "career_burst", "longevity", "early_unstable"];
const mk = (i, extra = {}) => ({ id: "p" + i, name: "Jogador " + i, age: 20, pos: "MEI", overall: 65, potential: 80, ...extra });
const forced = (id, extra = {}) => mk(7, { developmentProfile: { id }, ...extra });
const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === "object" && deepFreeze(v)); return Object.freeze(o); };
const sumChange = (id, from, to, extra = {}) => { let t = 0; for (let a = from; a <= to; a++) t += Dev.expectedAnnualChange(forced(id, { age: a, overall: 60, potential: 85, ...extra }), {}).expected; return t; };

test("32B (1) seis perfis com identificadores estáveis e distribuição sem garantia de excelência", () => {
  assert.deepEqual([...Dev.PROFILE_IDS], IDS);
  assert.ok(Object.isFrozen(Dev.PROFILES));
  const count = Object.fromEntries(IDS.map((i) => [i, 0])); const N = 3000;
  for (let i = 0; i < N; i++) count[Dev.resolveProfile(mk(i), { seed: 1 }).id]++;
  for (const id of IDS) { assert.ok(count[id] / N >= 0.05, id + " raro demais: " + count[id]); assert.ok(count[id] / N <= 0.5, id + " domina"); }
  assert.ok(Dev.PROFILE_IDS.every((id) => Dev.PROFILES[id].label && Dev.PROFILES[id].description));
});

test("32B (2) determinismo: mesma entrada, mesmo resultado; seed diferente muda a distribuição; sem initialSeed", () => {
  for (let i = 0; i < 50; i++) {
    const a = Dev.resolveProfile(mk(i), { seed: 9 }), b = Dev.resolveProfile(mk(i), { seed: 9 });
    assert.deepEqual(a, b);
    assert.deepEqual(Dev.parametersFor(a.id, mk(i), { seed: 9 }), Dev.parametersFor(b.id, mk(i), { seed: 9 }));
  }
  const diff = Array.from({ length: 200 }, (_, i) => Dev.resolveProfile(mk(i), { seed: 1 }).id !== Dev.resolveProfile(mk(i), { seed: 2 }).id).filter(Boolean).length;
  assert.ok(diff > 40, "a seed precisa influenciar");
  assert.ok(IDS.includes(Dev.resolveProfile(mk(1), {}).id));
  assert.ok(IDS.includes(Dev.resolveProfile(mk(1)).id), "sem contexto algum");
});

test("32B (3) idade de auge e duração por perfil", () => {
  const range = { prodigy: [22, 26], steady_rise: [26, 30], late_bloomer: [26, 30], career_burst: [25, 29], longevity: [27, 31], early_unstable: [21, 25] };
  for (const id of IDS) for (let i = 0; i < 60; i++) {
    const p = Dev.parametersFor(id, mk(i)), [lo, hi] = range[id];
    assert.ok(p.peakAge >= lo && p.peakAge <= hi, `${id} auge ${p.peakAge}`);
    assert.ok(p.peakEnd - p.peakStart >= 0);
  }
  const avgDur = (id) => Array.from({ length: 80 }, (_, i) => Dev.parametersFor(id, mk(i)).peakDuration).reduce((a, b) => a + b) / 80;
  assert.ok(avgDur("longevity") > avgDur("steady_rise") && avgDur("steady_rise") > avgDur("early_unstable"));
});

test("32B (4) goleiros: auge mais tarde, mais longo e declínio mais lento", () => {
  for (const id of IDS) {
    const f = Dev.parametersFor(id, mk(3, { pos: "ATA" })), g = Dev.parametersFor(id, mk(3, { pos: "GOL" }));
    assert.ok(g.peakAge >= f.peakAge + 2, id); assert.ok(g.peakDuration >= f.peakDuration + 1, id); assert.ok(g.declineRate < f.declineRate, id); assert.equal(g.goalkeeper, true);
  }
  const old = (pos) => Dev.expectedAnnualChange(forced("steady_rise", { age: 33, pos, overall: 80, potential: 80 }), {}).expected;
  assert.ok(old("GOL") > old("ATA"), "goleiro cai menos aos 33");
});

test("32B (5) antes e depois do auge: cresce, estabiliza e declina", () => {
  for (const id of IDS) {
    const pr = Dev.parametersFor(id, forced(id));
    const young = Dev.expectedAnnualChange(forced(id, { age: Math.max(15, pr.peakStart - 5) }), {});
    const old = Dev.expectedAnnualChange(forced(id, { age: pr.peakEnd + 6, overall: 80, potential: 80 }), {});
    assert.equal(young.phase, "growth"); assert.ok(young.expected > 0, id + " jovem");
    assert.equal(old.phase, "decline"); assert.ok(old.expected < 0 && old.physical < old.technical, id + " veterano");
    assert.ok(old.expected < Dev.expectedAnnualChange(forced(id, { age: pr.peakEnd + 2, overall: 80, potential: 80 }), {}).expected + 1e-9, "declínio aumenta com a idade");
  }
});

test("32B (6) diferenças entre perfis ao longo da carreira", () => {
  assert.ok(sumChange("prodigy", 16, 20) > sumChange("late_bloomer", 16, 20));
  assert.ok(sumChange("late_bloomer", 23, 28) > sumChange("prodigy", 23, 28));
  const dec = (id) => Dev.expectedAnnualChange(forced(id, { age: 34, overall: 80, potential: 80 }), {}).physical;
  assert.ok(dec("longevity") > dec("steady_rise") && dec("steady_rise") > dec("early_unstable"), "ordem de declínio físico");
  const spread = (id) => { const e = Dev.expectedAnnualChange(forced(id, { age: 20 }), {}); return e.max - e.min; };
  assert.ok(spread("early_unstable") > spread("steady_rise"));
});

test("32B (7) desempenho, minutos, lesões e rotina influenciam", () => {
  const e = (factors, extra) => Dev.expectedAnnualChange(forced("steady_rise", { age: 21, ...extra }), { factors }).expected;
  const good = { avgRating: 7.6, minutesShare: 0.9, routine: 0.9, injuries: 0 }, bad = { avgRating: 6.0, minutesShare: 0.1, routine: 0.1, injuries: 3 };
  assert.ok(e(good) > e({}) && e({}) > e(bad));
  assert.ok(e({ minutesShare: 1 }) > e({ minutesShare: 0 })); assert.ok(e({ routine: 1 }) > e({ routine: 0 })); assert.ok(e({ injuries: 0 }) > e({ injuries: 5 })); assert.ok(e({ avgRating: 8 }) > e({ avgRating: 6 }));
  const d = (factors) => Dev.expectedAnnualChange(forced("steady_rise", { age: 34, overall: 80, potential: 80 }), { factors }).expected;
  assert.ok(d(bad) < d(good), "rotina ruim acelera o declínio");
  // explosão: só o perfil career_burst, só com desempenho + minutos, e de forma determinística
  const burst = (id, factors, season) => Dev.expectedAnnualChange(forced(id, { age: 24 }), { factors, season }).burst;
  const seasons = Array.from({ length: 40 }, (_, s) => 2026 + s);
  assert.ok(seasons.some((s) => burst("career_burst", good, s)) && seasons.some((s) => !burst("career_burst", good, s)));
  assert.ok(seasons.every((s) => !burst("career_burst", bad, s)) && seasons.every((s) => !burst("steady_rise", good, s)));
  assert.equal(burst("career_burst", good, 2030), burst("career_burst", good, 2030));
});

test("32B (8) limites mínimos e máximos com entradas extremas ou inválidas", () => {
  const weird = [{}, { age: -5 }, { age: 99 }, { age: NaN }, { age: "x", overall: "y", potential: 500 }, { overall: -50, potential: -1 }, { pos: null, age: null }, { age: 14, potential: 100, overall: 99 }, { age: 45, overall: 1, potential: 1 }];
  for (const w of weird) for (const id of [...IDS, "inexistente"]) {
    const e = Dev.expectedAnnualChange({ developmentProfile: { id }, ...w }, { factors: { avgRating: 99, minutesShare: 9, routine: -4, injuries: 50 }, season: 1 });
    for (const k of ["expected", "min", "max", "physical", "technical"]) { assert.ok(Number.isFinite(e[k]), k); assert.ok(e[k] >= -6 && e[k] <= 8, `${k}=${e[k]}`); }
    assert.ok(e.min <= e.max); assert.ok(IDS.includes(e.profile));
    assert.ok(e.params.peakAge >= 20 && e.params.peakAge <= 35 && e.params.peakDuration >= 1 && e.params.peakDuration <= 10);
    assert.ok(e.params.growthRate >= 0.3 && e.params.growthRate <= 2 && e.params.declineRate >= 0.3 && e.params.declineRate <= 2);
  }
  const m = Dev.evolutionModifier({ avgRating: 99, minutesShare: 9, routine: 9, injuries: -9 }), n = Dev.evolutionModifier({ avgRating: -9, minutesShare: -9, routine: -9, injuries: 99, severeInjury: true });
  assert.ok(m.growth <= 1.4 && n.growth >= 0.6 && n.decline <= 1.5 && m.decline >= 0.7);
});

test("32B (9) compatibilidade com carreiras antigas sem developmentProfile nem initialSeed", () => {
  const legacy = { name: "Veterano Antigo", age: 31, pos: "ZAG", ovr: 74, potential: 76 };
  const a = Dev.resolveProfile(legacy), b = Dev.resolveProfile({ ...legacy });
  assert.deepEqual(a, b); assert.equal(a.source, "derived"); assert.ok(IDS.includes(a.id));
  assert.equal(Dev.resolveProfile({ ...legacy, developmentProfile: { id: "longevity", v: 1 } }).source, "stored");
  assert.equal(Dev.resolveProfile({ ...legacy, developmentProfile: { id: "lixo" } }).source, "derived", "registro inválido é ignorado");
  assert.ok(Dev.expectedAnnualChange(legacy, {}).expected < 1);
  assert.deepEqual(Object.keys(Dev.createProfileRecord(legacy)).sort(), ["id", "v"], "registro mínimo de 2 campos");
  // leitura via objeto de save antigo (campos ausentes)
  assert.ok(IDS.includes(Dev.resolveProfile({}).id));
});

test("32B (10) sem mutações e sem crescimento de estado em consultas repetidas", () => {
  const player = deepFreeze(mk(5, { attrs: { pace: 60 }, developmentProfile: { id: "prodigy", v: 1 } })), ctx = deepFreeze({ seed: 3, season: 2027, factors: { avgRating: 7, minutesShare: 0.8 } });
  const before = JSON.stringify([player, ctx]);
  for (let i = 0; i < 1000; i++) { Dev.resolveProfile(player, ctx); Dev.parametersFor("prodigy", player, ctx); Dev.expectedAnnualChange(player, ctx); Dev.reassessProfile(player, { severeInjuries: 3 }, ctx); Dev.createProfileRecord(player, ctx); }
  assert.equal(JSON.stringify([player, ctx]), before);
  assert.deepEqual(Object.keys(player), ["id", "name", "age", "pos", "overall", "potential", "attrs", "developmentProfile"]);
  const plain = { name: "Sem perfil", age: 20 }; const snap = JSON.stringify(plain);
  Dev.resolveProfile(plain); Dev.expectedAnnualChange(plain, {}); assert.equal(JSON.stringify(plain), snap, "consulta não grava developmentProfile");
});

test("32B (11) reavaliação de perfil só por eventos importantes e com limite", () => {
  const p = forced("steady_rise");
  assert.equal(Dev.reassessProfile(p, {}, {}).changed, false);
  const inj = Dev.reassessProfile(p, { severeInjuries: 2 }, {}); assert.equal(inj.changed, true); assert.equal(inj.profile.id, "early_unstable"); assert.ok(inj.reason);
  const up = Dev.reassessProfile(p, { breakoutSeasons: 2 }, {}); assert.equal(up.profile.id, "career_burst");
  const lg = Dev.reassessProfile(p, { seasonsAsRegular: 6, severeInjuries: 0 }, {}); assert.equal(lg.profile.id, "longevity");
  const capped = Dev.reassessProfile(forced("steady_rise", { developmentProfile: { id: "steady_rise", changes: 2 } }), { severeInjuries: 5 }, {}); assert.equal(capped.changed, false);
  assert.equal(p.developmentProfile.id, "steady_rise", "entrada intacta");
});
