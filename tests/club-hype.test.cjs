const test = require("node:test"), assert = require("node:assert/strict");
const H = require("../src/domain/club-hype.js");
const F = require("../src/domain/club-finance.js");
test("exposição: multiplicadores crescem com o nível e são neutros em zero", () => {
  const z = H.boosts(0), a = H.boosts(1);
  assert.equal(z.gate, 1); assert.equal(z.sponsor, 1); assert.equal(z.merch, 0);
  assert.ok(a.gate > 1.4 && a.sponsor > 1.5 && a.merch > .8 && a.occupancy > .15);
});
test("exposição: só vale para o clube do jogador", () => {
  const s = { clubId: "a", extras: { clubHype: { level: .7 } } };
  assert.equal(H.level(s, { id: "a" }), .7); assert.equal(H.level(s, { id: "b" }), 0);
});
test("bilheteria do clube em alta é maior", () => {
  const club = { id: "a", reputation: 70, roster: [{ salary: 1e6 }], stats: {} };
  const mk = (l) => ({ clubId: "a", day: 10, extras: { clubHype: { level: l } }, clubFinance: { version: 1, clubs: {} }, clubs: [club] });
  const lo = F.matchGate(mk(0), club, { reputation: 60 }, {}), hi = F.matchGate(mk(1), club, { reputation: 60 }, {});
  assert.ok(hi.amount > lo.amount && hi.attendance >= lo.attendance);
});
