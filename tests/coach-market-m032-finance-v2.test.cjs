"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const previous = globalThis.ProLife;
const previousApp = globalThis.ProLifeApp;
globalThis.ProLife = { overall: p => Number(p.ovr ?? p.overall ?? 65) };
const market = require("../src/application/game.js");
test("M03.2 new market valuations scale across overall and age", () => {
  const high = market.valuation({ovr:84,age:21,potential:88});
  const low = market.valuation({ovr:69,age:19,potential:73});
  assert.ok(high > 30000000, "elite player must not cost hundreds of thousands");
  assert.ok(high > low);
  assert.ok(low > 1000000);
});
test("M03.2 salary reference is monthly, proportional and not legacy minimum", () => {
  const player = {ovr:84,age:21,potential:88};
  const monthly = market.minimumMarketSalaryMonthly(player);
  assert.ok(monthly > 100000, "high-level monthly salary should not be R$ 3000");
  assert.equal(monthly % 1000, 0);
  assert.ok(monthly > market.minimumMarketSalaryMonthly({ovr:69,age:19,potential:73}));
});
test("M03.2 valuation uses finite, positive, rounded BRL", () => {
  for(const ovr of [40,55,65,75,84,90,99]) {
    const v=market.valuation({ovr,age:25});
    assert.ok(Number.isSafeInteger(v) && v>=100000 && v%10000===0);
  }
});
globalThis.ProLife = previous;
globalThis.ProLifeApp = previousApp;
