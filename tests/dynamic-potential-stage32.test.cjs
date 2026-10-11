"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../src/domain/dynamic-potential.js");
const Dev = require("../src/domain/player-development.js");

const mk = (extra = {}) => ({ id: "p1", name: "Jogador", age: 20, pos: "MEI", overall: 60, potential: 78, developmentProfile: { id: "steady_rise" }, ...extra });
const deepFreeze = (o) => { Object.values(o).forEach((v) => v && typeof v === "object" && deepFreeze(v)); return Object.freeze(o); };
const great = { season: 2027, avgRating: 8.0, minutesShare: 0.95, regularity: 0.9, severeInjuries: 0, injuries: 0 };
const normal = { season: 2027, avgRating: 6.9, minutesShare: 0.7, regularity: 0.6 };

test("32C (1) potencial baixo, médio e alto: teto proporcional ao potencial, sem piso de 82", () => {
  const low = P.effectiveCeiling(mk({ overall: 52, potential: 60 })), mid = P.effectiveCeiling(mk({ overall: 60, potential: 72 })), high = P.effectiveCeiling(mk({ overall: 70, potential: 90 }));
  assert.ok(low < 66 && low >= 52, "baixo: " + low);
  assert.ok(mid > 72 && mid <= 76, "médio: " + mid);
  assert.ok(high > 90 && high <= 94, "alto: " + high);
  assert.ok(low < mid && mid < high);
  assert.ok(low < 82, "não eleva todos a 82");
  assert.equal(P.potentialOutlook(mk({ potential: 60 })).tier, "baixo"); assert.equal(P.potentialOutlook(mk({ potential: 72 })).tier, "medio");
  assert.equal(P.potentialOutlook(mk({ potential: 82 })).tier, "alto"); assert.equal(P.potentialOutlook(mk({ potential: 92 })).tier, "elite");
});

test("32C (2) jovens x veteranos: o teto colapsa após o auge e nunca fica abaixo do GER", () => {
  const young = P.effectiveCeiling(mk({ age: 18, overall: 65, potential: 85 })), vet = P.effectiveCeiling(mk({ age: 34, overall: 80, potential: 85 }));
  assert.ok(young >= 85 && young <= 89); assert.ok(vet >= 80 && vet <= 81.5, "veterano perto do GER: " + vet);
  for (let age = 14; age <= 45; age++) { const o = mk({ age, overall: 70, potential: 75 }); assert.ok(P.effectiveCeiling(o) >= 70, "age " + age); }
  assert.ok(P.effectiveCeiling(mk({ overall: 90, potential: 80 })) >= 90, "GER acima do potencial");
});

test("32C (3) desempenho excepcional aumenta o potencial de forma limitada, mais nos jovens", () => {
  const r = P.reviewPotential(mk({ age: 19 }), great, {});
  assert.ok(r.delta > 0 && r.delta <= P.LIMITS.maxRisePerReview, "delta " + r.delta); assert.equal(r.reason, "desempenho excepcional"); assert.equal(r.applied, false);
  assert.ok(r.delta > P.reviewPotential(mk({ age: 19 }), normal, {}).delta);
  assert.ok(r.delta > P.reviewPotential(mk({ age: 24 }), great, {}).delta);
  assert.equal(P.reviewPotential(mk({ age: 29 }), great, {}).delta, 0, "29+ não cresce potencial");
});

test("32C (4) temporada ruim reduz, sem cair abaixo do GER", () => {
  const bad = { season: 2027, avgRating: 5.4, minutesShare: 0.6, regularity: 0.2 };
  const r = P.reviewPotential(mk({ age: 23, overall: 70, potential: 76 }), bad, {});
  assert.ok(r.delta < 0 && r.delta >= -P.LIMITS.maxFallPerReview);
  const floor = P.reviewPotential(mk({ age: 23, overall: 75.5, potential: 76 }), bad, {});
  assert.ok(floor.potential >= 75.5, "piso = GER");
});

test("32C (5) pouca minutagem não gera ganho mesmo com nota alta e pune jovens", () => {
  const few = P.reviewPotential(mk({ age: 20 }), { season: 2027, avgRating: 8.2, minutesShare: 0.05, regularity: 1 }, {});
  assert.ok(few.delta <= 0, "delta " + few.delta);
  assert.ok(P.reviewPotential(mk({ age: 20 }), { season: 2027, avgRating: 7, minutesShare: 0.9, regularity: 0.7 }, {}).delta > P.reviewPotential(mk({ age: 20 }), { season: 2027, avgRating: 7, minutesShare: 0.3, regularity: 0.7 }, {}).delta);
});

test("32C (6) lesões graves e reincidência reduzem e bloqueiam o ganho", () => {
  const d = (severe) => P.reviewPotential(mk({ age: 21 }), { ...great, severeInjuries: severe }, {}).delta;
  assert.ok(d(0) > 0 && d(1) < 0 && d(2) < d(1) && d(3) <= d(2), `${d(0)} ${d(1)} ${d(2)} ${d(3)}`);
  assert.ok(d(5) >= -P.LIMITS.maxFallPerReview);
});

test("32C (7) goleiros: auge e teto mais tardios; revisões menos voláteis", () => {
  const gk = mk({ pos: "GOL", age: 33, overall: 78, potential: 82 }), fld = mk({ pos: "ATA", age: 33, overall: 78, potential: 82 });
  assert.ok(P.effectiveCeiling(gk) >= P.effectiveCeiling(fld));
  assert.ok(P.potentialOutlook(gk).peakAge >= P.potentialOutlook(fld).peakAge + 2); assert.equal(P.potentialOutlook(gk).goalkeeper, true);
  const up = (pos) => P.reviewPotential(mk({ pos, age: 19 }), great, {}).delta;
  assert.ok(up("GOL") < up("ATA"));
  const down = (pos) => P.reviewPotential(mk({ pos, age: 23 }), { season: 1, avgRating: 5, minutesShare: 0.5 }, {}).delta;
  assert.ok(down("GOL") > down("ATA"), "queda menor para goleiros");
});

test("32C (8) perfis da 32B influenciam a revisão sem duplicar cálculos", () => {
  const d = (id, age) => P.reviewPotential(mk({ age, developmentProfile: { id } }), great, {}).delta;
  assert.ok(d("prodigy", 19) > d("late_bloomer", 19)); assert.ok(d("late_bloomer", 25) > d("prodigy", 25));
  assert.ok(d("longevity", 21) < d("steady_rise", 21));
  assert.equal(P.reviewPotential(mk({ developmentProfile: { id: "career_burst" } }), great, {}).profile, "career_burst");
  assert.equal(P.potentialOutlook(mk()).profile, Dev.resolveProfile(mk()).id);
  assert.ok(P.effectiveCeiling(mk({ age: 22, developmentProfile: { id: "late_bloomer" } })) > P.effectiveCeiling(mk({ age: 22, developmentProfile: { id: "early_unstable" } })));
});

test("32C (9) potencial baixo repetindo temporadas perfeitas não chega a 95", () => {
  let p = mk({ age: 16, overall: 50, potential: 60 }); const original = 60;
  for (let season = 2027; season < 2027 + 20; season++) {
    const r = P.reviewPotential(p, { ...great, season }, { originalPotential: original });
    p = { ...p, age: p.age + 1, potential: r.potential, overall: Math.min(P.effectiveCeiling(p), p.overall + 4) };
    assert.ok(r.potential <= original + P.LIMITS.maxRiseTotal, "potencial " + r.potential);
    assert.ok(P.effectiveCeiling(p) < 95, "teto " + P.effectiveCeiling(p));
  }
  assert.ok(p.overall < 75, "GER final " + p.overall);
});

test("32C (10) avaliações repetidas não geram ganho artificial", () => {
  let p = mk({ age: 19 }), ctx = { originalPotential: 78 }; const first = P.reviewPotential(p, great, ctx);
  p = { ...p, potential: first.potential }; ctx = { ...ctx, lastReviewSeason: great.season };
  let total = 0; for (let i = 0; i < 200; i++) { const r = P.reviewPotential(p, great, ctx); total += r.delta; assert.equal(r.repeated, true); }
  assert.equal(total, 0);
  // mesmo sem o guard de temporada, o limite total acumulado vale
  let q = mk({ age: 19, potential: 78 }); for (let i = 0; i < 100; i++) q = { ...q, potential: P.reviewPotential(q, { ...great, season: i }, { originalPotential: 78 }).potential };
  assert.ok(q.potential <= 78 + P.LIMITS.maxRiseTotal);
  assert.ok(P.effectiveCeiling(q) <= 99);
});

test("32C (11) saves antigos: sem potencial, perfil, seed ou campos", () => {
  const legacy = { name: "Antigo", age: 17, pos: "ATA", ovr: 58 };
  const o = P.potentialOutlook(legacy); assert.equal(o.estimated, true); assert.ok(o.potential > 58 && Number.isFinite(o.ceiling));
  assert.ok(Number.isFinite(P.effectiveCeiling({}))); assert.ok(Number.isFinite(P.effectiveCeiling()));
  const r = P.reviewPotential(legacy, great, {}); assert.ok(Number.isFinite(r.potential) && r.estimated === true);
  assert.equal(P.reviewPotential(legacy, {}, {}).delta, 0, "sem dados da temporada = sem mudança");
  assert.equal(P.reviewPotential(legacy, undefined, undefined).delta, 0);
  assert.deepEqual(P.potentialOutlook(legacy), P.potentialOutlook({ ...legacy }));
});

test("32C (12) determinismo, ausência de mutação e consultas repetidas sem estado", () => {
  const player = deepFreeze(mk({ attrs: { pace: 60 } })), ctx = deepFreeze({ seed: 5, season: 2027 }), st = deepFreeze({ ...great });
  const snap = JSON.stringify([player, ctx, st]);
  const a = [P.effectiveCeiling(player, ctx), P.reviewPotential(player, st, ctx), P.potentialOutlook(player, ctx)];
  for (let i = 0; i < 500; i++) assert.deepEqual([P.effectiveCeiling(player, ctx), P.reviewPotential(player, st, ctx), P.potentialOutlook(player, ctx)], a);
  assert.equal(JSON.stringify([player, ctx, st]), snap);
  assert.equal(Object.keys(player).includes("potentialReview"), false);
  const o = P.potentialOutlook(player, ctx); assert.ok(o.projectedPeak >= o.overall && o.projectedPeak <= o.ceiling);
});

test("32C (13) entradas extremas permanecem dentro dos limites", () => {
  for (const w of [{ age: -5 }, { age: 99 }, { overall: 500, potential: 500 }, { overall: -9, potential: -9 }, { overall: "x", potential: NaN }, { pos: null }]) {
    const c = P.effectiveCeiling(mk(w)); assert.ok(c >= 1 && c <= 99, JSON.stringify(w));
    for (const s of [great, { season: 1, avgRating: 99, minutesShare: 9, severeInjuries: 99, injuries: 99 }, { season: 1, avgRating: -9, minutesShare: -9 }]) {
      const r = P.reviewPotential(mk(w), s, {}); assert.ok(Number.isFinite(r.potential) && r.potential <= 99 && r.potential >= 1);
      assert.ok(r.delta <= P.LIMITS.maxRisePerReview + 1e-9 && r.delta >= -P.LIMITS.maxFallPerReview - 1e-9);
    }
  }
});
