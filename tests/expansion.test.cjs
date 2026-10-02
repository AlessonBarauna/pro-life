const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), A = require("../src/application/game.js"), S = require("../src/infrastructure/save.js");
const Codec = require("../src/infrastructure/codec.js");

test("Series C and D are available with explicit partial roster coverage", () => {
  const s = D.create({}, 401);
  assert.deepEqual(s.leagues.map((l) => l.id), ["serieA", "serieB", "serieC", "serieD"]);
  for (const id of ["serieA", "serieB", "serieC", "serieD"]) assert.equal(D.table(s, id).length, 20);
  assert.equal(s.clubs.length, 80);
  assert.ok(s.clubs.filter((c) => ["serieC", "serieD"].includes(c.leagueId)).every((c) => c.coverage === "partial" && c.roster.length >= 22));
});

test("expanded training exposes 27 skills and improves according to style", () => {
  const s = D.create({ clubId: "c0", style: "Velocista" }, 402), before = s.trainingPlan.improvements;
  assert.equal(Object.keys(D.Training.skills).length, 27);
  A.execute(s, "train", { focus: "acceleration", intensity: "normal" });
  for (let i = 0; i < 30; i++) D.advance(s, 1);
  assert.ok(s.trainingPlan.sessions >= 30);
  assert.ok(s.trainingPlan.improvements > before);
  assert.ok(Number.isFinite(s.person.attrs.acceleration));
});

test("statistics collect appearances, goals, assists and best-player awards", () => {
  const s = D.create({ clubId: "c0" }, 403);
  D.Statistics.recordMatch(s, { participants: [["hero"], []], ratings: { hero: 8.4 }, events: [{ type: "goal", playerId: "hero", assistPlayerId: "x" }] });
  const hero = D.Statistics.init(s).hero;
  assert.deepEqual([hero.appearances, hero.goals, hero.motm], [1, 1, 1]);
  assert.equal(D.Statistics.leaders(s, "goals")[0].id, "hero");
});

test("career agency persists and charges one monthly fee", () => {
  const s = D.create({ clubId: "c0" }, 404), wallet = s.wallet;
  s.decision = D.Life.decisions.find((d) => d.id === "agent");
  A.execute(s, "decide", { choice: "hire" });
  assert.equal(s.wallet, wallet - 900);
  assert.ok(s.life.agency);
  const afterHire = s.wallet;
  D.Life.monthly(s, D.Career);
  assert.equal(s.wallet, afterHire - 250);
});

test("competition catalog includes the national cup and only the career club state tournament", () => {
  const s = D.create({ clubId: "c17" }, 405), ids = D.Competitions.init(s).map((c) => c.id);
  assert.ok(ids.includes("copaBrasil"));
  assert.ok(ids.includes("state-sp"));
  assert.equal(ids.filter((id) => /^serie/.test(id)).length, 4);
  assert.equal(s.competitionSchedule.state.name, "Campeonato Paulista");
});

test("expanded save round-trip preserves training, statistics, competitions and agency", () => {
  const s = D.create({ clubId: "c40" }, 406);
  s.decision = D.Life.decisions.find((d) => d.id === "agent");
  A.execute(s, "decide", { choice: "hire" });
  D.advance(s, 7);
  const restored = S.parse(JSON.stringify(s));
  assert.equal(restored.clubId, "c40");
  assert.ok(restored.life.agency);
  assert.equal(restored.competitions.length, D.Competitions.catalog.length + 1);
  assert.equal(Object.keys(restored.person.attrs).length, 27);
});

test("Brazil Cup selects 32 ranked clubs with top four from every division", () => {
  const s = D.create({ clubId: "c0" }, 411), cup = s.competitionSchedule.cup;
  assert.equal(cup.entrants.length, 32);
  assert.equal(new Set(cup.entrants.map((e) => e.clubId)).size, 32);
  assert.equal(cup.entrants.filter((e) => e.qualifiedBy.startsWith("Top 4")).length, 16);
  assert.ok(cup.entrants.every((e) => Number.isInteger(e.rank) && e.rank >= 1 && e.rank <= 80));
  for (const date of [50, 100, 170, 240, 340]) {
    s.day = date - 1;
    D.advance(s, 1);
  }
  assert.equal(cup.rounds.reduce((total, round) => total + round.pairs.length, 0), 31);
  assert.ok(cup.rounds.every((round) => round.pairs.every((pair) => pair.played && pair.winnerId)));
  assert.ok(cup.champion);
});

test("career club plays its state tournament at the start of the year", () => {
  const s = D.create({ clubId: "c17" }, 412), state = s.competitionSchedule.state;
  assert.equal(state.name, "Campeonato Paulista");
  assert.equal(state.clubId, "c17");
  assert.equal(state.fixtures.length, 5);
  for (const fixture of state.fixtures) {
    s.day = fixture.date - 1;
    D.advance(s, 1);
  }
  assert.equal(state.stats.played, 5);
  assert.ok(state.fixtures.every((fixture) => fixture.played));
  assert.ok(s.matches.filter((m) => m.competitionId === state.id).length === 5);
});

test("four clubs are promoted and relegated at each division boundary", () => {
  const s = D.create({ clubId: "c0" }, 413), before = {};
  for (const league of s.leagues) {
    const clubs = s.clubs.filter((c) => c.leagueId === league.id);
    clubs.forEach((c, index) => { c.stats.points = 100 - index; });
    before[league.id] = D.table(s, league.id).map((c) => c.id);
  }
  s.round = 38;
  s.day = 364;
  D.advance(s, 1);
  for (const [upper, lower] of [["serieA", "serieB"], ["serieB", "serieC"], ["serieC", "serieD"]]) {
    assert.ok(before[upper].slice(-4).every((id) => D.club(s, id).leagueId === lower));
    assert.ok(before[lower].slice(0, 4).every((id) => D.club(s, id).leagueId === upper));
  }
  for (const league of s.leagues) assert.equal(s.clubs.filter((c) => c.leagueId === league.id).length, 20);
});

test("division awards store player, club and league for Series A B C and D", () => {
  const s = D.create({}, 414);
  for (const league of s.leagues) {
    const c = s.clubs.find((club) => club.leagueId === league.id), p = c.roster[0];
    D.Statistics.recordMatch(s, { competitionId: league.id, participants: [[p.id], []], ratings: { [p.id]: 8.8 }, events: [{ type: "goal", playerId: p.id, assistPlayerId: p.id }] });
  }
  const awards = D.Statistics.closeSeason(s);
  assert.deepEqual(new Set(awards.map((a) => a.leagueId)), new Set(["serieA", "serieB", "serieC", "serieD"]));
  assert.ok(awards.every((a) => a.winner && a.winnerClub && a.league));
});

test("corrupt expanded save data is rejected", () => {
  const s = D.create({}, 407);
  s.trainingPlan.sessions = -1;
  assert.throws(() => S.validate(s));
});

test("manual save export, import and reopening preserve data integrity", () => {
  const s = D.create({ mode: "coach", clubId: "c61" }, 408);
  D.advance(s, 30);
  const exported = Codec.encode(s), imported = S.parse(exported), reopened = S.parse(Codec.encode(imported));
  assert.equal(Codec.format, "json-v1");
  assert.deepEqual(reopened, imported);
  assert.equal(reopened.mode, "coach");
  assert.equal(reopened.clubId, "c61");
  assert.equal(reopened.day, 30);
});

test("autosave stores, loads and replaces a newly created career", () => {
  const memory = new Map();
  global.localStorage = { setItem: (k, v) => memory.set(k, v), getItem: (k) => memory.get(k) ?? null };
  const first = D.create({ mode: "player", clubId: "c40" }, 409);
  D.advance(first, 7);
  assert.equal(S.save(first), true);
  assert.deepEqual(S.load(), first);
  const second = D.create({ mode: "coach", clubId: "c0" }, 410);
  assert.equal(S.save(second), true);
  const loaded = S.load();
  assert.equal(loaded.mode, "coach");
  assert.equal(loaded.clubId, "c0");
  delete global.localStorage;
});
