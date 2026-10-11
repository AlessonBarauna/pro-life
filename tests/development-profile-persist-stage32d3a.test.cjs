"use strict";
// Stage 32D.3A - persistencia segura do perfil de desenvolvimento do heroi (registro minimo {id,v}).
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
global.localStorage = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
global.ProLifeCompactSave = require("../src/infrastructure/compact-save.js");
const S = require("../src/infrastructure/save.js");
const PD = require("../src/domain/player-development.js"), DP = require("../src/domain/dynamic-potential.js");
const clone = (o) => JSON.parse(JSON.stringify(o));
const cfg = { mode: "player", name: "Perfil", age: 19, pos: "MEI", clubId: "c0" };
let BASE; const fresh = () => clone(BASE ||= D.create(cfg, 31));
const withEx = (s) => { const p = D.Training.init(s); p.exerciseId = "boxFinish"; return s; };
function train(s, n, from = 5000) { for (let i = 0; i < n; i++) { s.day = from + i; s.person.condition = 100; s.person.injury = 0; s.intensity = "normal"; s.calendarDays = []; s.fixtures = []; s.competitionSchedule = {}; D.Training.performTraining(s, new D.Random(7 + i), D, { automatic: true }); } }
const countProfiles = (s) => { let n = 0; for (const c of s.clubs) for (const p of c.roster) if (p.developmentProfile && p.id !== "hero") n++; for (const p of s.internationalPlayers || []) if (p.developmentProfile) n++; return n; };

test("32D.3A (1) consultas nao criam registros nem mutam", () => {
  const s = fresh(), before = JSON.stringify(s);
  const o = D.overall(s.person);
  D.Training.init(s); const mid = JSON.stringify(s);
  DP.effectiveCeiling({ ...s.person, overall: o, ovr: o }, { seed: s.initialSeed }); DP.potentialOutlook({ ...s.person, overall: o, ovr: o });
  PD.resolveProfile(s.person, { seed: s.initialSeed }); PD.expectedAnnualChange({ ...s.person, overall: o }, { seed: s.initialSeed });
  assert.equal(JSON.stringify(s), mid); assert.equal(s.person.developmentProfile, undefined);
  assert.equal(countProfiles(s), 0);
});
test("32D.3A (2) primeiro desenvolvimento grava so {id,v} do heroi; sem criacao em massa", () => {
  const s = withEx(fresh()); train(s, 3);
  const r = s.person.developmentProfile; assert.deepEqual(Object.keys(r).sort(), ["id", "v"]); assert.ok(PD.PROFILE_IDS.includes(r.id));
  assert.equal(countProfiles(s), 0);
  console.log("registro do perfil (chars):", JSON.stringify(r).length);
});
test("32D.3A (3) perfil estavel por 5 temporadas: idade, GER, potencial e clube mudam; perfil nao", () => {
  const s = withEx(fresh()); train(s, 2); const id = s.person.developmentProfile.id;
  for (let y = 1; y <= 5; y++) { s.person.age += 1; s.person.potential = Math.max(50, s.person.potential - 3 * y); s.clubId = y % 2 ? "c1" : "c2"; for (const k of Object.keys(s.person.attrs)) if (typeof s.person.attrs[k] === "number") s.person.attrs[k] = Math.min(99, s.person.attrs[k] + 2); s.season += 1; train(s, 3, 6000 + y * 100); }
  assert.equal(s.person.developmentProfile.id, id);
});
test("32D.3A (4) save antigo sem perfil: derivacao deterministica e fixada no primeiro evento", () => {
  const a = withEx(fresh()), b = withEx(fresh()); train(a, 1); train(b, 1);
  assert.equal(a.person.developmentProfile.id, b.person.developmentProfile.id);
  assert.equal(a.person.developmentProfile.id, PD.resolveProfile({ ...fresh().person, overall: D.overall(fresh().person) }, { seed: a.initialSeed }).id);
  const fixed = a.person.developmentProfile.id; a.person.age = 34; a.person.potential = 60; train(a, 2, 9000); assert.equal(a.person.developmentProfile.id, fixed);
});
test("32D.3A (5) perfil armazenado vence a derivacao; id invalido e ignorado e corrigido", () => {
  const s = withEx(fresh()); s.person.developmentProfile = { id: "longevity", v: 1 }; train(s, 2); assert.equal(s.person.developmentProfile.id, "longevity");
  const t = withEx(fresh()); t.person.developmentProfile = { id: "inexistente" }; train(t, 1); assert.ok(PD.PROFILE_IDS.includes(t.person.developmentProfile.id));
});
let ADV; const advanced = () => (ADV ||= (() => { const s = D.create(cfg, 31); D.advance(s, 30); return s; })());
test("32D.3A (6) save/reload: completo, hibrido v1 e v2 mantem o perfil", () => {
  const s = advanced(); const id = s.person.developmentProfile.id;
  assert.equal(S.parse(JSON.stringify(s)).person.developmentProfile.id, id);
  assert.equal(S.parse(S.encodeHybridSave(s)).person.developmentProfile.id, id);
  const v2 = S.parse(S.encodeHybridSave(s, { sparseStats: true })); assert.equal(v2.person.developmentProfile.id, id); assert.equal(countProfiles(v2), 0);
});
test("32D.3A (7) transferencia nao altera o perfil", () => {
  const s = withEx(fresh()); train(s, 1); const rec = JSON.stringify(s.person.developmentProfile);
  s.clubId = "c3"; s.person.club = "c3"; train(s, 2, 7000); assert.equal(JSON.stringify(s.person.developmentProfile), rec);
});
test("32D.3A (8) reavaliacao so por evento importante e com limite de 2", () => {
  const s = withEx(fresh()); train(s, 1); const id = s.person.developmentProfile.id;
  assert.equal(D.Training.reassessDevelopmentProfile(s, {}, D).changed, false); assert.equal(s.person.developmentProfile.id, id);
  s.person.developmentProfile = { id: "steady_rise", v: 1 };
  const r1 = D.Training.reassessDevelopmentProfile(s, { severeInjuries: 2 }, D); assert.equal(r1.changed, true); assert.equal(s.person.developmentProfile.id, "early_unstable"); assert.equal(s.person.developmentProfile.changes, 1);
  s.person.developmentProfile = { id: "steady_rise", v: 1, changes: 2 };
  assert.equal(D.Training.reassessDevelopmentProfile(s, { severeInjuries: 2 }, D).changed, false);
});
test("32D.3A (9) 30 dias deterministicos; so o heroi ganha registro; modo treinador intacto", () => {
  const run = () => { const s = D.create(cfg, 31); D.advance(s, 30); return s; };
  const a = run(), b = run(); assert.equal(JSON.stringify(a.person), JSON.stringify(b.person)); assert.equal(JSON.stringify(a.matches ?? a.history), JSON.stringify(b.matches ?? b.history));
  assert.equal(countProfiles(a), 0); if (a.person.developmentProfile) assert.deepEqual(Object.keys(a.person.developmentProfile).sort(), ["id", "v"]);
  const c = D.create({ mode: "coach", world: "legacy", name: "Tec" }, 31); D.advance(c, 5); assert.equal(c.person?.developmentProfile, undefined); assert.equal(countProfiles(c), 0);
});
test("32D.3A (10) jogadores internacionais preservados no codec hibrido", () => {
  const s = advanced(); const back = S.parse(S.encodeHybridSave(s));
  assert.equal(JSON.stringify(back.internationalPlayers), JSON.stringify(S.validate(clone(s)).internationalPlayers));
});
