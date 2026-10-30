"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const G = require("../src/application/game.js");
const F = require("../src/domain/facilities.js");

function coach(seed = 4242) {
  const s = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, seed);
  s.clubId = null;
  D.join(s, "gf_fc27_10", 90000);
  return s;
}

test("nível 0 por padrão e saves antigos continuam válidos", () => {
  const s = coach();
  for (const id of F.IDS) assert.equal(F.levelOf(s, id), 0);
  assert.equal(F.effects(s, D.club(s)).trainingGrowthMult, 1);
  assert.equal(F.effects(s, D.club(s)).commercialMonthly, 0);
});

test("melhoria debita o orçamento e sobe o nível", () => {
  const s = coach();
  const club = D.club(s);
  club.budget = 500000000;
  const cost = F.upgradeCost(s, club, "training");
  assert.ok(cost > 0);
  G.execute(s, "upgradeFacility", { id: "training" });
  assert.equal(F.levelOf(s, "training"), 1);
  assert.equal(club.budget, 500000000 - cost);
  assert.ok(F.effects(s, club).trainingGrowthMult > 1);
});

test("orçamento insuficiente, id inválido e nível máximo são recusados", () => {
  const s = coach();
  const club = D.club(s);
  club.budget = 0;
  assert.throws(() => G.execute(s, "upgradeFacility", { id: "training" }), /insuficiente/);
  assert.throws(() => G.execute(s, "upgradeFacility", { id: "nada" }), /inválida/);
  club.budget = 1e12;
  for (let i = 0; i < F.MAX; i++) G.execute(s, "upgradeFacility", { id: "academy" });
  assert.throws(() => G.execute(s, "upgradeFacility", { id: "academy" }), /máximo/);
  assert.equal(F.levelOf(s, "academy"), F.MAX);
});

test("só treinadores melhoram instalações", () => {
  const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, 1);
  assert.throws(() => G.execute(s, "upgradeFacility", { id: "training" }), /treinadores/);
});

test("trocar de clube zera as instalações do clube anterior", () => {
  const s = coach();
  D.club(s).budget = 1e12;
  G.execute(s, "upgradeFacility", { id: "stadium" });
  s.clubId = "outro";
  assert.equal(F.levelOf(s, "stadium"), 0);
});
