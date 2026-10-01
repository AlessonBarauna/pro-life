const test = require("node:test"),
  assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"),
  A = require("../src/application/game.js"),
  S = require("../src/infrastructure/save.js");
test("calendar: 14 rounds, every ordered pair exactly once", () => {
  const s = D.create({}, 9),
    seen = new Set();
  assert.equal(s.fixtures.length, 14);
  s.fixtures.forEach((r) => {
    assert.equal(new Set(r.flat()).size, 8);
    r.forEach((pair) => {
      const key = pair.join(":");
      assert.ok(!seen.has(key));
      seen.add(key);
    });
  });
  assert.equal(seen.size, 56);
});
test("initial points are capped and modes are valid", () => {
  assert.throws(() => D.create({ points: { pace: 20, finish: 20 } }));
  assert.equal(D.create({ mode: "coach", age: 16 }, 2).person.age, 25);
});
test("same seed/actions yield identical seasons; save restores hero reference", () => {
  let a = D.create({ clubId: "c0" }, 44),
    b = D.create({ clubId: "c0" }, 44);
  for (let i = 0; i < 365; i++) {
    D.advance(a, 1);
    D.advance(b, 1);
  }
  assert.deepEqual(a, b);
  assert.equal(a.season, 2027);
  const restored = S.parse(JSON.stringify(a));
  assert.equal(
    D.club(restored).roster.find((p) => p.id === "hero"),
    restored.person,
  );
  D.advance(restored, 30);
  S.validate(restored);
});
test("coach survives multiple seasons and world remains coherent", () => {
  const s = D.create({ mode: "coach", clubId: "c3" }, 71);
  for (let i = 0; i < 2190; i++) {
    D.advance(s, 1);
    S.parse(JSON.stringify(s));
    for (const c of s.clubs) assert.equal(c.stats.played, c.stats.w + c.stats.d + c.stats.l);
  }
  assert.equal(s.history.length, 6);
  assert.equal(s.person.age, 41);
});
test("scores come from goal events, shots/target/xG are consistent", () => {
  for (let i = 1; i <= 100; i++) {
    const s = D.create({}, i),
      m = D.simulate(s.clubs[0], s.clubs[3], new D.Random(i + 300));
    assert.equal(m.hg, m.events.filter((e) => e.type === "goal" && e.side === 0).length);
    assert.equal(m.ag, m.events.filter((e) => e.type === "goal" && e.side === 1).length);
    for (let j = 0; j < 2; j++) {
      assert.ok(m.target[j] <= m.shots[j]);
      assert.ok((j ? m.ag : m.hg) <= m.target[j]);
      assert.ok(m.xg[j] >= 0);
    }
    assert.ok(m.possession >= 0 && m.possession <= 100);
  }
});
test("stronger team is favored but upsets occur in 1000 matches", () => {
  let wins = 0,
    upsets = 0,
    draws = 0,
    goals = 0;
  for (let i = 1; i <= 1000; i++) {
    const s = D.create({}, i),
      m = D.simulate(s.clubs[3], s.clubs[0], new D.Random(i * 977));
    goals += m.hg + m.ag;
    if (m.hg > m.ag) wins++;
    else if (m.hg < m.ag) upsets++;
    else draws++;
  }
  console.log(
    JSON.stringify({
      matches: 1000,
      favoriteWins: wins,
      upsets,
      draws,
      goalsPerMatch: goals / 1000,
    }),
  );
  assert.ok(wins > upsets);
  assert.ok(upsets > 50);
  assert.ok(wins < 900);
  assert.ok(goals / 1000 > 1.5 && goals / 1000 < 4.5);
});
test("recruitment moves one player and money is conserved", () => {
  const s = D.create({ mode: "coach", clubId: "c3" }, 2),
    own = D.club(s),
    source = s.clubs[0],
    p = source.roster[5];
  const total = own.budget + source.budget;
  A.execute(s, "recruit", { clubId: source.id, playerId: p.id });
  assert.ok(own.roster.includes(p));
  assert.ok(!source.roster.includes(p));
  assert.equal(own.budget + source.budget, total);
  S.validate(s);
});
test("rejects invalid saves and unavailable lineup/actions", () => {
  const s = D.create({ mode: "coach", clubId: "c0" }, 1);
  assert.throws(() => A.execute(s, "lineup", { ids: [] }));
  assert.throws(() => S.parse('{"version":1}'));
  const bad = JSON.parse(JSON.stringify(s));
  bad.person.attrs.pace = Infinity;
  assert.throws(() => S.validate(bad));
  const broken = JSON.parse(JSON.stringify(s));
  broken.fixtures[0][0][0] = "unknown";
  assert.throws(() => S.validate(broken));
  assert.throws(() => A.execute(s, "join", { id: "missing" }));
});
test("decisions cost money and retirement preserves wealth/history", () => {
  const s = D.create({ age: 30, clubId: "c0" }, 4);
  D.advance(s, 21);
  assert.ok(s.decision);
  const choice = s.decision.choices[0][0];
  D.decide(s, choice);
  assert.equal(s.decision, null);
  const wealth = s.wallet;
  D.retire(s);
  assert.equal(s.mode, "coach");
  assert.equal(s.wallet, wealth);
  assert.ok(s.history.length);
  assert.ok(s.clubs.every((c) => !c.roster.some((p) => p.id === "hero")));
  S.validate(s);
});
