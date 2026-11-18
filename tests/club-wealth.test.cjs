"use strict";
// Clubes ricos nunca ficam sem caixa; a cada temporada um xeque compra um clube pequeno e o reforça.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const W = require("../src/domain/club-wealth.js");
const mk = (seed) => D.create({ mode: "coach", catalogVersion: "fc27_v1" }, seed);

test("gigante recebe piso de caixa e cobre uma compra grande", () => {
  const s = mk(7001);
  const city = s.globalFootball.clubs.find((c) => c.name === "Manchester City");
  city.budget = 2924000;
  W.ensureFunds(s, city, 83600000);
  assert.ok(city.budget >= 6e9);
  const small = s.globalFootball.clubs.find((c) => c.reputation < 60);
  small.budget = 1000;
  W.ensureFunds(s, small, 5e6);
  assert.equal(small.budget, 1000, "clube pequeno não ganha piso");
});

test("xeque compra um clube pequeno uma vez por temporada, com elenco reforçado", () => {
  let s = mk(7002);
  for (let i = 0; i < 8; i++) s = require("../src/application/game.js").execute(s, "advance", {}) || s;
  const hist = s.extras.clubWealth.history;
  assert.equal(hist.length, 1);
  assert.ok(hist[0].signed >= 8);
  const club = D.GlobalFootball.clubById(s, hist[0].clubId);
  assert.ok(club.sheikh && club.budget > 50e9 && club.reputation >= 52);
  assert.notEqual(club.id, s.clubId);
  for (let i = 0; i < 8; i++) s = require("../src/application/game.js").execute(s, "advance", {}) || s;
  assert.equal(s.extras.clubWealth.history.length, 1, "só um xeque por temporada");
});
