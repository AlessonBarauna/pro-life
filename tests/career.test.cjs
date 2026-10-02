const test = require("node:test"),
  assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"),
  A = require("../src/application/game.js"),
  S = require("../src/infrastructure/save.js"),
  C = D.Career;
function until(s, day) {
  while (s.day < day) D.advance(s, Math.min(30, day - s.day));
}
test("2026 world has four separate leagues, 80 clubs and complete official Serie A pairings", () => {
  const s = D.create({}, 8);
  assert.equal(s.clubs.length, 80);
  assert.equal(s.fixtures.length, 38);
  assert.equal(s.leagues.length, 4);
  const ids = s.clubs.flatMap((c) => c.roster.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(s.clubs.filter((c) => ["serieA", "serieB"].includes(c.leagueId)).every((c) => c.roster.every((p) => p.real)));
  assert.ok(s.clubs.filter((c) => ["serieC", "serieD"].includes(c.leagueId)).every((c) => c.coverage === "partial"));
  const seen = new Set();
  for (const round of s.fixtures) {
    assert.equal(new Set(round.flat()).size, 80);
    for (const pair of round) {
      assert.equal(D.club(s, pair[0]).leagueId, D.club(s, pair[1]).leagueId);
      assert.ok(!seen.has(pair.join(":")));
      seen.add(pair.join(":"));
    }
  }
  assert.equal(seen.size, 1520);
  assert.deepEqual(s.fixtures[0].slice(0, 10), D.World.serieAFixtures[0]);
  assert.equal(s.calendarDays[0], 27);
  assert.equal(D.table(s, "serieA").length, 20);
  assert.equal(D.table(s, "serieB").length, 20);
  assert.equal(D.table(s, "serieC").length, 20);
  assert.equal(D.table(s, "serieD").length, 20);
  S.parse(JSON.stringify(s));
});
test("a full Brazilian season plays 38 rounds in both leagues and produces saveable histories", () => {
  const s = D.create({ clubId: "c0" }, 17);
  until(s, 364);
  assert.equal(s.round, 38);
  assert.equal(s.matches.length, 800);
  assert.ok(s.clubs.every((c) => c.stats.played === 38));
  assert.equal(
    D.table(s, "serieA").reduce((n, c) => n + c.stats.gf, 0),
    D.table(s, "serieA").reduce((n, c) => n + c.stats.ga, 0),
  );
  const restored = S.parse(JSON.stringify(s));
  assert.equal(
    D.club(restored).roster.find((p) => p.id === "hero"),
    restored.person,
  );
  assert.ok(JSON.stringify(s).length < 3000000);
  D.advance(restored, 1);
  assert.equal(restored.season, 2027);
  assert.equal(restored.history.length, 4);
  assert.ok(restored.clubs.every((c) => c.stats.played === 0));
  S.parse(JSON.stringify(restored));
});
test("transfer windows enforce day boundaries, proposal acceptance and recruitment without partial mutations", () => {
  const s = D.create({ mode: "coach", clubId: "c8" }, 12);
  for (const [day, open] of [
    [0, true],
    [58, true],
    [59, false],
    [180, false],
    [181, true],
    [242, true],
    [243, false],
    [317, false],
    [318, true],
    [364, true],
  ]) {
    s.day = day;
    assert.equal(C.windowStatus(s).open, open);
  }
  s.day = 100;
  s.offers = [{ clubId: "c2", salary: 8000, role: "Treinador", expires: 110 }];
  const before = JSON.stringify(s);
  assert.throws(() => A.execute(s, "join", { id: "c2" }), /Janela/);
  assert.throws(() => D.join(s, "c2", 8000), /Janela/);
  assert.throws(
    () =>
      A.execute(s, "recruit", {
        clubId: "c4",
        playerId: s.clubs[4].roster[4].id,
      }),
    /Janela/,
  );
  assert.equal(JSON.stringify(s), before);
  s.day = 181;
  s.offers = [{ clubId: "c2", salary: 8000, role: "Treinador", expires: 190 }];
  A.execute(s, "join", { id: "c2" });
  assert.equal(s.clubId, "c2");
});
test("personal purchases charge once, persist, have recurring costs/effects and sell at 70 percent", () => {
  const s = D.create({ clubId: "c0" }, 19),
    before = s.wallet,
    clubs = s.clubs.map((c) => c.budget);
  A.execute(s, "buy", { id: "recovery" });
  assert.equal(s.wallet, before - 1800);
  assert.deepEqual(
    s.clubs.map((c) => c.budget),
    clubs,
  );
  assert.throws(() => A.execute(s, "buy", { id: "recovery" }));
  assert.throws(() => A.execute(s, "buy", { id: "house" }));
  s.person.condition = 50;
  C.daily(s);
  assert.equal(s.person.condition, 51);
  C.monthly(s);
  assert.equal(s.wallet, before - 1840);
  assert.equal(C.assetValue(s), 1800);
  assert.equal(C.upkeep(s), 40);
  S.parse(JSON.stringify(s));
  A.execute(s, "sell", { id: "recovery" });
  assert.equal(s.wallet, before - 1840 + 1260);
  assert.equal(C.upkeep(s), 0);
  assert.ok(!s.extras.assets.length);
});
test("press promises are evaluated by actual subsequent results and persist between matches", () => {
  for (const wins of [0, 2]) {
    const s = D.create({ clubId: "c0" }, 20);
    s.decision = {
      id: "media",
      title: "Entrevista",
      body: "Teste",
      choices: [
        ["humble", "Equilíbrio"],
        ["bold", "Prometer"],
      ],
    };
    A.execute(s, "decide", { choice: "bold" });
    assert.equal(s.extras.promise.games, 3);
    const rep = s.reputation,
      board = s.board;
    for (let i = 0; i < 3; i++) {
      C.match(s, {
        home: s.clubId,
        away: "c1",
        hg: i < wins ? 1 : 0,
        ag: 0,
        ratings: { hero: 7 },
        events: [],
      });
      if (i < 2) S.parse(JSON.stringify(s));
    }
    assert.equal(s.extras.promise, null);
    assert.equal(s.reputation, rep + (wins === 2 ? 4 : -3));
    assert.equal(s.board, board + (wins === 2 ? 5 : -7));
    assert.ok(
      s.extras.feed.some(
        (p) =>
          p.category === "Imprensa" &&
          /Promessa cumprida|Cobrança/.test(p.title),
      ),
    );
  }
});
test("AI transfers conserve club money, change one roster and write confirmed feed records", () => {
  const s = D.create({ clubId: "c0" }, 29),
    money = s.clubs.reduce((n, c) => n + c.budget, 0),
    ids = s.clubs.flatMap((c) => c.roster.map((p) => p.id)).sort();
  C.world(s, new D.Random(8), D);
  assert.equal(s.extras.transfers.length, 2);
  assert.equal(
    s.clubs.reduce((n, c) => n + c.budget, 0),
    money,
  );
  assert.deepEqual(
    s.clubs.flatMap((c) => c.roster.map((p) => p.id)).sort(),
    ids,
  );
  S.parse(JSON.stringify(s));
});
test("legacy saves retain calendar and identity until explicitly scheduled year-end migration", () => {
  const old = D.create({ world: "legacy", clubId: "c0" }, 4);
  until(old, 30);
  delete old.world;
  delete old.leagues;
  delete old.calendarDays;
  delete old.extras;
  old.clubs.forEach((c) => delete c.leagueId);
  const s = S.parse(JSON.stringify(old));
  assert.equal(s.world, "legacy");
  assert.equal(s.clubs.length, 8);
  assert.equal(s.fixtures.length, 14);
  const name = s.person.name,
    wealth = s.wallet;
  A.execute(s, "upgradeWorld", { clubId: "c8" });
  assert.equal(s.clubs.length, 8);
  until(s, 365);
  assert.equal(s.world, "brazil2026");
  assert.equal(s.clubs.length, 80);
  assert.equal(s.clubId, "c8");
  assert.equal(s.person.name, name);
  assert.ok(s.wallet > wealth);
  assert.ok(s.history.some((h) => h.league === "Liga Horizonte"));
  S.parse(JSON.stringify(s));
});
test("new save data rejects corrupted assets, money, press promises, feed and cross-league fixtures", () => {
  const s = D.create({ clubId: "c0" }, 3);
  for (const mutate of [
    (s) => (s.extras.assets = ["unknown"]),
    (s) => (s.extras.assets = ["bike", "bike"]),
    (s) => (s.extras.number = 101),
    (s) => (s.extras.promise = { games: -1, wins: 0 }),
    (s) =>
      (s.extras.ledger = [{ amount: "1", day: 0, season: 2026, label: "x" }]),
    (s) => (s.extras.feed[0].likes = Infinity),
    (s) => (s.calendarDays[1] = s.calendarDays[0]),
    (s) => (s.fixtures[0][0][1] = "c20"),
  ]) {
    const bad = JSON.parse(JSON.stringify(s));
    mutate(bad);
    assert.throws(() => S.validate(bad));
  }
});

test("signing hides all offers until a different transfer window opens, including existing saves", () => {
  const s = D.create({ clubId: "c22" }, 31);
  assert.equal(s.careerTransferAvailableDay, 181);
  until(s, 56);
  assert.equal(s.offers.length, 0);
  assert.throws(() => D.join(s, "c2", 1800), /já assinou/);
  const old = JSON.parse(JSON.stringify(s));
  delete old.careerTransferAvailableDay;
  old.offers = [{ clubId: "c2", salary: 1800, role: "Contrato", expires: 70 }];
  const loaded = S.parse(JSON.stringify(old));
  assert.equal(loaded.offers.length, 0);
  assert.equal(loaded.careerTransferAvailableDay, 181);
  until(loaded, 180);
  assert.equal(loaded.offers.length, 0);
  D.advance(loaded, 1);
  assert.equal(loaded.offers.length, 3);
  A.execute(loaded, "join", { id: loaded.offers[0].clubId });
  assert.equal(loaded.offers.length, 0);
  assert.equal(loaded.careerTransferAvailableDay, 318);
  until(loaded, 210);
  assert.equal(loaded.offers.length, 0);
  assert.throws(() => D.join(loaded, "c2", 1800), /já assinou/);
  until(loaded, 318);
  assert.equal(loaded.offers.length, 3);
  A.execute(loaded, "join", { id: loaded.offers[0].clubId });
  assert.equal(loaded.careerTransferAvailableDay, 365);
  S.parse(JSON.stringify(loaded));
});
