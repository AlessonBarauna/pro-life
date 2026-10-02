const test = require("node:test"),
  assert = require("node:assert/strict");
const C = require("../src/domain/character.js"),
  D = require("../src/domain/engine.js"),
  A = require("../src/application/game.js"),
  S = require("../src/infrastructure/save.js"),
  Charts = require("../src/ui/charts.js");
test("legacy appearance maps without losing supported colors", () => {
  const a = C.normalize({
    hair: "short",
    beard: "yes",
    tattoo: "yes",
    body: "strong",
    skin: "#123456",
    shirt: "#ff0000",
  });
  assert.equal(a.hair, "crew");
  assert.equal(a.beard, "full");
  assert.equal(a.tattoo, "both");
  assert.equal(a.skin, "#123456");
  assert.equal(a.shirt, undefined);
  assert.equal(C.normalize({ hair: "<script>", skin: "bad" }).hair, "lowfade");
});
test("club uniform follows transfers and is independent of appearance colors", () => {
  const s = D.create({ clubId: "c0" }, 50),
    first = C.kit(D.club(s));
  D.join(s, "c3", 1200);
  assert.equal(C.kit(D.club(s)).primary, D.club(s).color);
  assert.notEqual(C.kit(D.club(s)).primary, first.primary);
});
test("progression starts at creation, records real weekly snapshots and survives save", () => {
  const s = D.create({ clubId: "c0" }, 73);
  assert.equal(s.development.length, 1);
  assert.deepEqual(s.development[0].attrs, s.person.attrs);
  D.advance(s, 30);
  assert.deepEqual(
    s.development.map((e) => e.day),
    [0, 7, 14, 21, 28],
  );
  const saved = S.parse(JSON.stringify(s));
  assert.deepEqual(saved.development, s.development);
});
test("legacy saves begin progression at import date, without fabricated past", () => {
  const s = D.create({ clubId: "c0" }, 19);
  D.advance(s, 30);
  delete s.development;
  s.person.appearance = { hair: "short", beard: "yes", tattoo: "yes", skin: "#aa8866" };
  const old = JSON.stringify(s),
    loaded = S.parse(old);
  assert.equal(loaded.development[0].day, 30);
  assert.equal(loaded.development.length, 1);
  assert.equal(loaded.person.appearance.beard, "full");
  assert.equal(
    D.club(loaded).roster.find((p) => p.id === "hero"),
    loaded.person,
  );
  S.parse(JSON.stringify(loaded));
});
test("rejects malicious or nonmonotonic progression data", () => {
  const s = D.create({}, 3);
  s.development[0].attrs.pace = "<script>";
  assert.throws(() => S.parse(JSON.stringify(s)));
  const other = D.create({}, 3);
  other.development.push({ ...other.development[0] });
  assert.throws(() => S.parse(JSON.stringify(other)));
});
test("editing appearance preserves wallet, attributes, team and offers", () => {
  const s = D.create({ clubId: "c0" }, 8),
    before = JSON.stringify({
      attrs: s.person.attrs,
      wallet: s.wallet,
      club: s.clubId,
      offers: s.offers,
    });
  A.execute(s, "appearance", {
    appearance: { hair: "braids", beard: "mustache", tattoo: "left", accessory: "mask" },
    celebration: "Apontar para o céu",
  });
  assert.equal(s.person.appearance.hair, "braids");
  assert.equal(s.person.appearance.accessory, "mask");
  assert.equal(s.person.celebration, "Apontar para o céu");
  assert.equal(
    JSON.stringify({ attrs: s.person.attrs, wallet: s.wallet, club: s.clubId, offers: s.offers }),
    before,
  );
  assert.ok(C.celebrations.length >= 16);
  S.parse(JSON.stringify(s));
});
test("charts support first record, constant series and escaped numeric input", () => {
  const s = D.create({}, 3);
  assert.ok(Charts.radar(s.person.attrs).includes("<polygon"));
  assert.ok(Charts.evolution(s.development).includes("Primeiro registro"));
  D.advance(s, 14);
  const svg = Charts.evolution(s.development, "pace");
  assert.ok(!svg.includes("NaN"));
  assert.ok(svg.includes("Dia 14"));
});
