"use strict";
// Um investimento em andamento não pode ser repetido; volta a ficar disponível depois de vencer.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), A = require("../src/application/game.js");
test("investimento ativo bloqueia repetição até vencer", () => {
  let s = D.create({ mode: "player", clubId: "c0" }, 45);
  s.wallet = 900000;
  s = A.execute(s, "lifeInvest", { id: "conservative", amount: 5000 }) || s;
  assert.throws(() => A.execute(s, "lifeInvest", { id: "conservative", amount: 5000 }), /já tem este investimento/);
  assert.doesNotThrow(() => A.execute(s, "lifeInvest", { id: "cdb", amount: 5000 }));
  const inv = D.Life.init(s).finance.investments.find((i) => i.type === "conservative");
  inv.closed = true;
  assert.doesNotThrow(() => A.execute(s, "lifeInvest", { id: "conservative", amount: 5000 }));
});
