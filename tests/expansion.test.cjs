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

test("competition catalog includes national cup and simulated state competitions", () => {
  const s = D.create({}, 405), ids = D.Competitions.init(s).map((c) => c.id);
  assert.ok(ids.includes("copaBrasil"));
  assert.ok(ids.includes("paulista"));
  assert.equal(ids.filter((id) => /^serie/.test(id)).length, 4);
});

test("expanded save round-trip preserves training, statistics, competitions and agency", () => {
  const s = D.create({ clubId: "c40" }, 406);
  s.decision = D.Life.decisions.find((d) => d.id === "agent");
  A.execute(s, "decide", { choice: "hire" });
  D.advance(s, 7);
  const restored = S.parse(JSON.stringify(s));
  assert.equal(restored.clubId, "c40");
  assert.ok(restored.life.agency);
  assert.equal(restored.competitions.length, D.Competitions.catalog.length);
  assert.equal(Object.keys(restored.person.attrs).length, 27);
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
