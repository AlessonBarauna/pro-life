const { JSDOM } = require("jsdom"),
  fs = require("fs"),
  assert = require("node:assert/strict");
const base = require("node:path").resolve(__dirname, "..") + "/";
const files = [
  "src/domain/world2026.js",
  "src/domain/brazil-data.js",
  "src/domain/competitions.js",
  "src/domain/training.js",
  "src/domain/statistics.js",
  "src/domain/life.js",
  "src/domain/career.js",
  "src/domain/character.js",
  "src/ui/charts.js",
  "src/domain/engine.js",
  "src/application/game.js",
  "src/infrastructure/codec.js",
  "src/infrastructure/validate-expansion.js",
  "src/infrastructure/save.js",
  "src/ui/expansion.js",
  "src/ui/app.js",
];
function make(mode) {
  const dom = new JSDOM(fs.readFileSync(base + "index.html", "utf8"), {
      runScripts: "outside-only",
      url: "https://offline-test.invalid",
    }),
    w = dom.window;
  w.confirm = () => true;
  w.scrollTo = () => {};
  w.URL.createObjectURL = () => "blob:test";
  w.URL.revokeObjectURL = () => {};
  files.forEach((f) => w.eval(fs.readFileSync(base + f, "utf8")));
  const form = w.document.querySelector("#creator");
  form.elements.mode.value = mode;
  form.elements.age.value = mode === "coach" ? "35" : "16";
  form.elements.seed.value = "44";
  form.dispatchEvent(
    new w.Event("submit", { bubbles: true, cancelable: true }),
  );
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
  assert.ok(w.document.querySelector(".game-nav"));
  assert.ok(w.document.querySelector(".career-dashboard"));
  assert.ok(w.document.querySelector(".career-hero"));
  assert.ok(w.document.querySelector(".dashboard-grid"));
  assert.ok(w.document.querySelector(".club-chip").textContent.includes(mode === "player" ? "CARREIRA DE JOGADOR" : "CARREIRA DE TREINADOR"));
  click(w, '[data-page="inbox"]');
  assert.ok(w.document.querySelector("main").textContent.includes("Mensagens da carreira"));
  const offerText = w.document.querySelector(".offer")?.textContent || "";
  assert.ok(offerText.includes("Estado:"));
  assert.ok(offerText.includes("Competição:"));
  assert.ok(offerText.includes("Contrato:"));
  assert.match(offerText, /Brasileirão Série [ABCD]/);
  click(w, "[data-join]");
  assert.ok(get(w).clubId);
  assert.equal(w.document.querySelectorAll("[data-join]").length,0);
  assert.ok(
    w.document.querySelector("main").textContent.includes(
      "Você já assinou nesta janela. Novas propostas chegam na próxima janela.",
    ),
  );
  for (const page of [
    "home",
    "profile",
    "squad",
    "training",
    "league",
    "competitions",
    "matches",
    "statistics",
    "awards",
    "inbox",
    "market",
    "life",
    "finance",
    "history",
    "save",
  ]) {
    click(w, `[data-page="${page}"]`);
    assert.ok(w.document.querySelector("main"));
    if (page === "inbox")
      assert.ok(w.document.querySelector("main").textContent.includes("Mensagens da carreira"));
    if (page === "market")
      assert.ok(w.document.querySelector("main").textContent.includes("Transferências confirmadas"));
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
  assert.equal(get(w).matches.length, 0);
  click(w, '[data-advance="30"]');
  assert.ok(get(w).matches.length >= 20);
  click(w, '[data-page="competitions"]');
  assert.equal(w.document.querySelectorAll(".competition-card").length, 4);
  assert.equal(w.document.querySelectorAll("table tbody tr").length, 32);
  assert.ok(w.document.querySelector("main").textContent.includes("Copa do Brasil"));
  click(w, '[data-page="awards"]');
  assert.ok(w.document.querySelector("main").textContent.includes("Brasileirão Série A"));
  assert.ok(w.document.querySelector("main").textContent.includes("Brasileirão Série D"));
  assert.ok(w.document.querySelectorAll(".award-card small").length > 0);
  click(w, '[data-page="matches"]');
  assert.ok(w.document.querySelector(".score"));
  for (let i = 0; i < 2; i++) click(w, '[data-advance="7"]');
  click(w, '[data-page="life"]');
  click(w, "[data-choice]");
  assert.equal(get(w).decision, null);
  click(w, '[data-page="profile"]');
  w.document.querySelector("#shirt-number").value = "27";
  click(w, '[data-action="number"]');
  assert.equal(get(w).extras.number, 27);
  click(w, '[data-page="home"]');
  assert.ok(w.document.querySelector("main").textContent.includes("STATUS DAS COMPETIÇÕES"));
  assert.ok(w.document.querySelector("main").textContent.includes("PRÓXIMO JOGO"));
  assert.ok(w.document.querySelector("main").textContent.includes("Rodada"));
  assert.ok(w.document.querySelector(".game-nav"), "A v0.5 deve renderizar a navegação superior");
  click(w, '[data-page="profile"]');
  const chart = w.document.querySelector("#chart-key");
  assert.ok(chart, "O relatório de desenvolvimento deve existir no perfil");
  chart.value = "all";
  chart.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal(w.document.querySelectorAll(".chart-legend span").length, 6);
  click(w, '[data-page="league"]');
  const league = w.document.querySelector("#league-key");
  league.value = "serieB";
  league.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal(w.document.querySelectorAll("tbody tr").length, 20);
  click(w, '[data-page="history"]');
  click(w, "[data-like]");
  assert.equal(get(w).extras.feed.filter((p) => p.liked).length, 1);
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
s.history = [
  { season: 2026, champion: "x", position: "<img>", goals: 1, mode: "player" },
];
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
            assert.ok(
              String(url).startsWith(
                "https://example.invalid/pro-life/version.json",
              ),
            );
            return {
              ok: true,
              json: async () => ({
                version: newer ? "b".repeat(64) : installed,
              }),
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
    if (newer)
      assert.equal(
        banner.querySelector("button").textContent,
        "Atualizar jogo",
      );
    updateDom.window.close();
  }
  console.log(
    "published update checker: same version silent, new version prompts update",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
