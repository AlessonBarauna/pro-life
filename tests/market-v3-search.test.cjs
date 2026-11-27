const test = require("node:test"), assert = require("node:assert/strict");
const R = require("../src/domain/transfer-rules-v2.js");
const mk = (id, age, ovr, pot, salary) => ({ id, age, ovr, potential: pot, salary, clubId: "c" });
const ps = [mk(1, 19, 60, 80, 50e3), mk(2, 30, 80, 80, 400e3), mk(3, 21, 70, 75, 90e3)];
const run = (f) => R.advancedFilter(ps, f, { season: 2027, day: 0 }, () => 10e6, () => ({})).map((p) => p.id);
test("joias, potencial e salário", () => {
  assert.deepEqual(run({ gems: true }), [1]);
  assert.deepEqual(run({ potMin: 80 }), [1, 2]);
  assert.deepEqual(run({ salMax: 100 }), [1, 3]);
  assert.deepEqual(run({ ovrMin: 70 }), [2, 3]);
});
test("orçamento e atalhos", () => {
  assert.deepEqual(run({ budget: true, budgetValue: 5e6 }), []);
  assert.deepEqual(R.quickFilter(ps, "joias", {}, () => 1, 0).map((p) => p.id), [1]);
  assert.equal(R.quickFilter(ps, "todos", {}, () => 1, 0).length, 3);
  assert.equal(R.quickFilter(ps, "orcamento", {}, () => 5, 4).length, 0);
});
