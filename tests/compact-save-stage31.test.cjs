const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

function hash(value) {
  return crypto.createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

const D = require("../src/domain/engine.js");
const Compact = require("../src/infrastructure/compact-save.js");

const config = {
  world: "brazil2026",
  mode: "player",
  name: "Teste",
  age: 22,
  pos: "ATA",
  clubId: "c0"
};

test("compact save restores changed player and club", () => {
  const base = D.create(config, 44);
  const current = D.create(config, 44);

  current.internationalPlayers[0].ovr += 2;
  current.internationalPlayers[0].clubId = "gf_real_madrid";
  current.clubs[0].budget += 100000;

  const compact = Compact.encode(base, current);
  const restored = Compact.decode(base, compact);

  assert.equal(hash(restored.internationalPlayers), hash(current.internationalPlayers));
  assert.equal(hash(restored.clubs), hash(current.clubs));
});

test("compact save supports new and removed players", () => {
  const base = D.create(config, 44);
  const current = D.create(config, 44);

  current.internationalPlayers.shift();
  current.internationalPlayers.push({
    id: "custom_test_player",
    name: "Jogador Teste",
    clubId: "gf_real_madrid",
    ovr: 70
  });

  const restored = Compact.decode(base, Compact.encode(base, current));

  assert.equal(hash(restored.internationalPlayers), hash(current.internationalPlayers));
});

test("compact save restores reordered clubs", () => {
  const base = D.create(config, 44);
  const current = D.create(config, 44);

  current.clubs.reverse();

  const restored = Compact.decode(base, Compact.encode(base, current));

  assert.equal(hash(restored.clubs), hash(current.clubs));
});
