"use strict";
const test = require("node:test"), assert = require("node:assert");
const A = require("../src/ui/coach-area.js");
test("níveis do treinador seguem a reputação", () => {
  assert.equal(A.levelOf(10).label, "Amador");
  assert.equal(A.levelOf(35).label, "Regional");
  assert.equal(A.levelOf(35).next[1], "Profissional");
  assert.equal(A.levelOf(99).next, null);
});
test("dinheiro abreviado em reais", () => {
  assert.equal(A.money(264056250), "R$ 264,1 mi");
  assert.equal(A.money(-1010000000), "-R$ 1,01 bi");
  assert.equal(A.money(5000), "R$ 5 mil");
});
test("sem jogo ativo a área não renderiza nada", () => assert.equal(A.render(), ""));
