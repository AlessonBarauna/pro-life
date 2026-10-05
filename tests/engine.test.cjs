const test = require("node:test"),
  assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"),
  A = require("../src/application/game.js"),
  S = require("../src/infrastructure/save.js");
test("calendar: 14 rounds, every ordered pair exactly once", () => {
  const s = D.create({ world: "legacy" }, 9),
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
  assert.throws(() =>
    D.create({ world: "legacy", points: { pace: 20, finish: 20 } }),
  );
  assert.equal(
    D.create({ world: "legacy", mode: "coach", age: 16 }, 2).person.age,
    25,
  );
});
test("same seed/actions yield identical seasons; save restores hero reference", () => {
  let a = D.create({ world: "legacy", clubId: "c0" }, 44),
    b = D.create({ world: "legacy", clubId: "c0" }, 44);
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
  const s = D.create({ world: "legacy", mode: "coach", clubId: "c3" }, 71);
  for (let i = 0; i < 2190; i++) {
    D.advance(s, 1);
    S.parse(JSON.stringify(s));
    for (const c of s.clubs)
      assert.equal(c.stats.played, c.stats.w + c.stats.d + c.stats.l);
  }
  assert.equal(s.history.length, 6);
  assert.equal(s.person.age, 41);
});
test("scores come from goal events, shots/target/xG are consistent", () => {
  for (let i = 1; i <= 100; i++) {
    const s = D.create({ world: "legacy" }, i),
      m = D.simulate(s.clubs[0], s.clubs[3], new D.Random(i + 300));
    assert.equal(
      m.hg,
      m.events.filter((e) => e.type === "goal" && e.side === 0).length,
    );
    assert.equal(
      m.ag,
      m.events.filter((e) => e.type === "goal" && e.side === 1).length,
    );
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
    const s = D.create({ world: "legacy" }, i),
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
  const s = D.create({ world: "legacy", mode: "coach", clubId: "c3" }, 2),
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
  const s = D.create({ world: "legacy", mode: "coach", clubId: "c0" }, 1);
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
  const s = D.create({ world: "legacy", age: 30, clubId: "c0" }, 4);
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
test("offensive balance rewards elite forwards without making goals automatic", () => {
  function sample(level, trust, runs = 240) {
    let goals = 0, shots = 0, starts = 0;
    for (let i = 1; i <= runs; i++) {
      const s = D.create({ world: "legacy", pos: "ATA", clubId: "c0" }, 8000 + i);
      Object.keys(s.person.attrs).forEach((key) => { s.person.attrs[key] = level; });
      s.person.morale = 90;
      s.extras.playerCareer.coachTrust = trust;
      const c = D.club(s), rival = s.clubs[1];
      c.lineup = c.lineup.filter((id) => id !== "hero");
      const samePos = c.lineup.findIndex((id) => c.roster.find((p) => p.id === id)?.pos === "ATA");
      if (samePos >= 0) c.lineup[samePos] = "hero"; else c.lineup[c.lineup.length - 1] = "hero";
      const m = D.simulate(c, rival, new D.Random(12000 + i), s);
      if (m.ratings.hero) starts++;
      goals += m.events.filter((e) => e.type === "goal" && e.playerId === "hero").length;
      shots += m.offensiveStats.hero?.shots || 0;
    }
    return { goals, shots, starts };
  }
  const elite = sample(95, 100), average = sample(72, 50);
  assert.ok(elite.starts > 220);
  assert.ok(elite.shots > average.shots * 1.2, `${JSON.stringify({ elite, average })}`);
  assert.ok(elite.goals > average.goals * 1.35, `${JSON.stringify({ elite, average })}`);
  assert.ok(elite.goals < 240, "elite forward must not score automatically every match");
});


test("advanced simulation reaches next match and can pause for decisions", () => {
  const s = D.create({ world: "brazil2026", mode: "player" }, 17001);
  D.movePlayerToClub(s, s.clubs.find((c) => c.name === "São Paulo").id);
  const next = D.nextCommitment(s);
  assert.ok(next && next.date > s.day);
  const result = D.simulateAdvance(s, "nextMatch");
  assert.ok(result.days > 0);
  assert.ok(result.completed || result.stop);
  if (result.completed) assert.ok(s.day >= next.date);
});

test("advanced season simulation processes daily systems and closes the season", () => {
  const s = D.create({ world: "legacy", mode: "coach", clubId: "c0" }, 17002);
  D.advance(s, 350);
  s.decision = { id: "hold", title: "Decisão já conhecida", body: "", choices: [["x", "x"]] };
  s.careerTransferAvailableDay = 99999;
  const season = s.season;
  const result = D.simulateAdvance(s, "season");
  assert.equal(result.completed, true);
  assert.equal(s.season, season + 1);
  assert.ok(result.days > 0 && result.days <= 365);
});


test("full-season simulation auto-resolves decisions and contract renewal", () => {
  const s = D.create({ world: "brazil2026", mode: "player" }, 18003);
  const saoPaulo = s.clubs.find((c) => c.name === "São Paulo");
  D.movePlayerToClub(s, saoPaulo.id);
  s.contract = 175;
  const pc = D.Career.init(s).playerCareer;
  pc.contract.endDay = s.day + 175;
  pc.coachTrust = 95;
  s.reputation = 90;
  s.person.morale = 90;
  s.decision = { id: "social", title: "Publicação viral", body: "", choices: [["embrace_social", "Aproveitar"], ["quiet_social", "Reduzir"]] };
  s.careerTransferAvailableDay = 99999;
  const result = D.simulateAdvance(s, "season");
  assert.equal(result.completed, true);
  assert.equal(result.automatic, true);
  assert.equal(s.decision, null);
  assert.ok(s.news.some((n) => n.title.includes("Decisão automática")));
  assert.ok(s.contract > 175, `contract should be renewed automatically: ${s.contract}`);
});
