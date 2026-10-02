const { JSDOM } = require("jsdom"),
  fs = require("fs"),
  assert = require("node:assert/strict");
const base = require("node:path").resolve(__dirname, "..") + "/";
const files = [
  "src/domain/character.js",
  "src/ui/charts.js",
  "src/domain/engine.js",
  "src/application/game.js",
  "src/infrastructure/save.js",
  "src/ui/app.js",
];
function make(mode) {
  const dom = new JSDOM(fs.readFileSync(base + "index.html", "utf8"), {
      runScripts: "outside-only",
      url: "https://offline-test.invalid",
    }),
    w = dom.window;
  w.confirm = () => true;
  w.URL.createObjectURL = () => "blob:test";
  w.URL.revokeObjectURL = () => {};
  files.forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  const form = w.document.querySelector("#creator");
  form.elements.mode.value = mode;
  form.elements.age.value = mode === "coach" ? "35" : "16";
  form.elements.seed.value = "44";
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
  return dom;
}
function click(w, sel) {
  const el = w.document.querySelector(sel);
  assert.ok(el, sel);
  el.click();
}
function get(w) {
  return w.ProLifeSave.parse(w.localStorage.getItem(w.ProLifeSave.KEY));
}
for (const mode of ["player", "coach"]) {
  const dom = make(mode),
    w = dom.window;
  assert.equal(get(w).mode, mode);
  click(w, '[data-page="market"]');
  click(w, "[data-join]");
  assert.ok(get(w).clubId);
  for (const page of [
    "home",
    "profile",
    "squad",
    "training",
    "league",
    "matches",
    "market",
    "life",
    "finance",
    "history",
    "save",
  ]) {
    click(w, `[data-page="${page}"]`);
    assert.ok(w.document.querySelector("main"));
    assert.ok(w.document.querySelector("main").textContent.length > 150);
  }
  if (mode === "coach") {
    click(w, '[data-page="squad"]');
    const tactic = w.document.querySelector("#tactic");
    tactic.value = "counter";
    tactic.dispatchEvent(new w.Event("change", { bubbles: true }));
    assert.equal(w.ProLife.club(get(w)).tactic, "counter");
    click(w, '[data-action="lineup"]');
    assert.equal(w.ProLife.club(get(w)).lineup.length, 11);
    click(w, '[data-page="training"]');
    click(w, '[data-action="license"]');
    assert.equal(get(w).license, "B");
  }
  click(w, '[data-advance="7"]');
  assert.equal(get(w).matches.length, 4);
  click(w, '[data-page="matches"]');
  assert.ok(w.document.querySelector(".score"));
  for (let i = 0; i < 2; i++) click(w, '[data-advance="7"]');
  click(w, '[data-page="life"]');
  click(w, "[data-choice]");
  assert.equal(get(w).decision, null);
  click(w, '[data-page="save"]');
  let save = get(w);
  const snapshot = JSON.stringify(save);
  files.slice(-1).forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  assert.equal(JSON.stringify(get(w)), snapshot);
  console.log(
    mode +
      ": creation, proposals, every view, advances, match report, decisions, reload" +
      (mode === "coach" ? ", tactics, lineup, license" : ""),
  );
  dom.window.close();
}
// Malicious save data must not execute when displayed; imported unsafe numerics rejected.
const dom = make("player"),
  w = dom.window;
let s = get(w);
s.person.name = '<img src=x onerror="globalThis.hacked=true">';
w.localStorage.setItem(w.ProLifeSave.KEY, JSON.stringify(s));
w.eval(fs.readFileSync(base + "src/ui/app.js", "utf8"));
assert.equal(w.document.querySelectorAll("img").length, 0);
assert.equal(w.hacked, undefined);
s.history = [{ season: 2026, champion: "x", position: "<img>", goals: 1, mode: "player" }];
assert.throws(() => w.ProLifeSave.parse(JSON.stringify(s)));
dom.window.close();
console.log("save injection and invalid history: passed");

// Published update checker: same version is silent, a newer version shows an action.
(async function testUpdateNotice() {
  const source = fs.readFileSync(base + "src/ui/update.js", "utf8");
  for (const newer of [false, true]) {
    const installed = "a".repeat(64);
    const updateDom = new JSDOM(
      '<!doctype html><body><script data-version="' +
        installed +
        '">' +
        source +
        "</script></body>",
      {
        runScripts: "dangerously",
        pretendToBeVisual: true,
        url: "https://example.invalid/pro-life/",
        beforeParse(window) {
          window.fetch = async (url) => {
            assert.ok(String(url).startsWith("https://example.invalid/pro-life/version.json"));
            return {
              ok: true,
              json: async () => ({ version: newer ? "b".repeat(64) : installed }),
            };
          };
          window.setTimeout = (fn) => {
            Promise.resolve().then(fn);
            return 1;
          };
          window.setInterval = () => 1;
        },
      },
    );
    await new Promise((resolve) => setImmediate(resolve));
    const banner = updateDom.window.document.querySelector("#update-banner");
    assert.equal(Boolean(banner), newer);
    if (newer) assert.equal(banner.querySelector("button").textContent, "Atualizar jogo");
    updateDom.window.close();
  }
  console.log("published update checker: same version silent, new version prompts update");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
