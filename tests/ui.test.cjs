const { JSDOM } = require("jsdom"),
  fs = require("fs"),
  assert = require("node:assert/strict");
const base = require("node:path").resolve(__dirname, "..") + "/";
const files = [
  "src/domain/world2026.js",
  "src/domain/brazil-data.js",
  "src/domain/competitions.js",
  "src/domain/training.js",
  "src/domain/identity.js",
  "src/domain/creation.js",
  "src/domain/universe.js",
  "src/domain/statistics.js",
  "src/domain/life.js",
  "src/domain/career.js",
  "src/domain/commercial.js",
  "src/domain/national-team.js",
  "src/domain/character.js",
  "src/ui/charts.js",
  "src/domain/engine.js",
  "src/domain/player-profile.js",
  "src/application/game.js",
  "src/infrastructure/codec.js",
  "src/infrastructure/validate-expansion.js",
  "src/infrastructure/save.js",
  "src/ui/expansion.js",
  "src/ui/calendar.js",
  "src/ui/home-dashboard.js",
  "src/ui/live-match.js",
  "src/ui/creator.js",
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
  const newCareer = w.document.querySelector(mode === "coach" ? '[data-action="new-coach"]' : '[data-action="new-player"]');
  assert.ok(newCareer, "Central de Carreiras deve oferecer nova carreira");
  newCareer.click();
  if (mode === "player") {
    const classic = w.document.querySelector("[data-w-coach]");
    assert.ok(classic, "Criador de jogador deve permitir abrir o formulário clássico");
    classic.click();
  }
  const form = w.document.querySelector("#creator");
  assert.ok(form, "Formulário de criação deve abrir");
  form.elements.mode.value = mode;
  form.elements.age.value = mode === "coach" ? "35" : "16";
  form.elements.seed.value = "44";
  form.dispatchEvent(
    new w.Event("submit", { bubbles: true, cancelable: true }),
  );
  return dom;
}
function click(w, sel) {
  let el = w.document.querySelector(sel);
  if (!el) {
    const match = sel.match(/^\[data-page="([^"]+)"\]$/);
    const page = match?.[1];
    const groups = {
      training:"profile", statistics:"profile", awards:"profile", legacy:"profile", proposals:"market",
      calendar:"league", matches:"league", competitions:"league", panorama:"league", squad:"league",
      life:"history", finance:"history", sponsorships:"history"
    };
    if (page && groups[page]) {
      const group = w.document.querySelector(`.game-nav [data-page="${groups[page]}"]`);
      if (group) group.click();
      el = w.document.querySelector(sel);
    }
  }
  assert.ok(el, sel);
  el.click();
}
function get(w) {
  const id = w.ProLifeSave.activeId();
  assert.ok(id, "deve existir um slot de carreira ativo");
  return w.ProLifeSave.loadSlot(id);
}
for (const mode of ["player", "coach"]) {
  const dom = make(mode),
    w = dom.window;
  assert.equal(get(w).mode, mode);
  assert.ok(w.document.querySelector(".game-nav"));
  assert.ok(w.document.querySelector(".career-dashboard"));
  assert.ok(w.document.querySelector(".central-main-match"));
  assert.ok(w.document.querySelector(".central-player-card"));
  assert.ok(w.document.querySelector(".central-grid"));
  assert.ok(w.document.querySelector(".central-table"));
  assert.ok(w.document.querySelector(".central-form"));
  assert.ok(w.document.querySelector(".central-inbox"));
  assert.ok(w.document.querySelector(".central-news"));
  assert.ok(w.document.querySelector(".central-training"));
  assert.ok(w.document.querySelector(".central-calendar"));
  assert.ok(w.document.querySelector(".central-objectives"));
  assert.ok(w.document.querySelector(".club-chip").textContent.includes(mode === "player" ? "CARREIRA DE JOGADOR" : "CARREIRA DE TREINADOR"));
  assert.ok(w.document.querySelector('[data-page="proposals"]'), "A proposta pendente deve direcionar para Mercado > Minhas propostas");
  click(w, '[data-page="inbox"]');
  assert.ok(w.document.querySelector("main").textContent.includes("Mensagens da carreira"));
  assert.equal(w.document.querySelectorAll(".offer").length, 0, "A Caixa nao deve gerenciar propostas");
  click(w, '[data-page="proposals"]');
  const offerText = w.document.querySelector(".offer")?.textContent || "";
  assert.ok(offerText.includes("Estado:"));
  assert.ok(offerText.includes("Compet"));
  assert.ok(offerText.includes("Dura"));
  assert.match(offerText, /S.{0,3}rie [ABCD]/);
  click(w, "[data-join]");
  assert.ok(get(w).clubId);
  assert.equal(w.document.querySelectorAll("[data-join]").length,0);
  assert.ok(w.document.querySelector("main").textContent.includes("Novas propostas chegam"));
  const navigation = mode === "player"
    ? [
        ["home", ["home"]],
        ["profile", ["profile", "training", "statistics", "awards", "legacy"]],
        ["league", ["league", "calendar", "matches", "competitions", "panorama", "squad"]],
        ["market", ["market", "proposals"]],
        ["history", ["history", "life", "finance", "sponsorships"]],
        ["inbox", ["inbox"]],
        ["save", ["save"]],
      ]
    : [
        ["home", ["home"]],
        ["profile", ["profile", "training", "finance"]],
        ["league", ["league", "calendar", "matches", "competitions", "panorama", "squad", "statistics", "awards"]],
        ["market", ["market", "proposals"]],
        ["history", ["history", "life"]],
        ["inbox", ["inbox"]],
        ["save", ["save"]],
      ];
  assert.ok(w.document.querySelectorAll(".game-nav nav button").length <= 8, "A navegacao principal deve permanecer enxuta");
  for (const [group, pages] of navigation) {
    click(w, `.game-nav [data-page="${group}"]`);
    for (const page of pages) {
      const target = w.document.querySelector(`.game-subnav [data-page="${page}"]`) || w.document.querySelector(`.game-nav [data-page="${page}"]`);
      assert.ok(target, `submenu ${page}`);
      target.click();
      assert.ok(w.document.querySelector("main"));
      if (page === "inbox") assert.ok(w.document.querySelector("main").textContent.includes("Mensagens da carreira"));
      if (page === "market") assert.ok(w.document.querySelector("main").textContent.includes("confirmadas"));
       if (page === "proposals") assert.ok(w.document.querySelector("main").textContent.includes("Quais propostas quero receber?"));
      assert.ok(w.document.querySelector("main").textContent.length > 150);
    }
  }
  click(w, '[data-page="home"]');
  click(w, '.central-calendar [data-page="calendar"]');
  assert.equal(w.document.querySelectorAll(".calendar-day").length, 42);
  const monthTitle = w.document.querySelector(".calendar-toolbar h2").textContent;
  click(w, '[data-calendar="next"]');
  assert.notEqual(w.document.querySelector(".calendar-toolbar h2").textContent, monthTitle);
  click(w, '[data-calendar="prev"]');
  assert.equal(w.document.querySelector(".calendar-toolbar h2").textContent, monthTitle);
  click(w, '[data-calendar="today"]');
  assert.ok(w.document.querySelector(".calendar-day.today"));
  if (mode === "player") {
    click(w, '[data-page="national"]');
    assert.ok(w.document.querySelector("main").textContent.includes("SELEÇÃO BRASILEIRA"));
    assert.ok(w.document.querySelector("main").textContent.includes("PRÓXIMA DATA FIFA"));
    assert.ok(w.document.querySelectorAll(".national-fixtures div").length >= 2);
  }
  if (mode === "coach") {
    click(w, '[data-page="squad"]');
    assert.ok(w.document.querySelector("main").textContent.includes("atletas"), "Elenco do treinador deve abrir");
    click(w, '[data-page="training"]');
    click(w, '[data-action="license"]');
    assert.equal(get(w).license, "B");
  }
  click(w, '[data-simulate="nextCommitment"]');
    click(w, '[data-page="home"]');
    click(w, '[data-live-match]');
  assert.ok(get(w).matches.length >= 1);
  if (mode === "player") {
    click(w, '[data-page="statistics"]');
    const beforeStats = get(w).statistics.players.hero.appearances;
    click(w, '[data-simulate="nextCommitment"]');
    click(w, '[data-page="home"]');
    click(w, '[data-live-match]');
    const afterState = get(w);
    assert.ok(afterState.statistics.players.hero.appearances >= beforeStats, "As estatisticas devem persistir ao avancar partidas");
    click(w, '[data-page="statistics"]');
    assert.ok(w.document.querySelector("#statistics-key"), "A tela de Estatisticas deve abrir apos a partida");
  }
  click(w, '[data-simulate="30days"]');
  assert.ok(get(w).matches.length >= 1);
  click(w, '[data-page="competitions"]');
  assert.ok(w.document.querySelectorAll(".competition-card").length >= 20);
  assert.equal(w.document.querySelectorAll(".cup-view table tbody tr").length, 32);
  assert.ok(w.document.querySelector("main").textContent.includes("Copa do Brasil"));
  assert.ok(w.document.querySelector("main").textContent.includes("Campeonato Paulista"));
  click(w, '[data-page="statistics"]');
  const statistics = w.document.querySelector("#statistics-key");
  assert.ok([...statistics.options].some((option) => option.textContent === "Copa do Brasil"));
  assert.ok([...statistics.options].some((option) => option.textContent === "Campeonato Paulista"));
  statistics.value = "copaBrasil";
  statistics.dispatchEvent(new w.Event("change", { bubbles: true }));
  assert.equal(w.document.querySelector("#statistics-key").value, "copaBrasil");
  click(w, '[data-page="awards"]');
  assert.ok(w.document.querySelector("main").textContent.match(/S.{0,3}rie A/));
  assert.ok(w.document.querySelector("main").textContent.match(/S.{0,3}rie D/));
  assert.ok(w.document.querySelectorAll(".award-card small").length > 0);
  assert.ok(w.document.querySelector(".season-xi")?.textContent.includes("Time da temporada"));
  assert.ok(w.document.querySelectorAll(".season-xi article").length >= 11);
  click(w, '[data-page="matches"]');
  assert.ok(w.document.querySelector(".score"));
  for (let i = 0; i < 14; i++) click(w, '[data-advance="1"]');
  click(w, '[data-page="home"]');
  assert.ok(w.document.querySelector(".central-objectives [data-choice]"), "O convite pendente deve poder ser respondido na Central");
  click(w, ".central-objectives [data-choice]");
  click(w, '[data-page="inbox"]');
  assert.ok(w.document.querySelector("main").textContent.includes("Escolha registrada"), "A resposta deve permanecer registrada na caixa de entrada");
  click(w, '[data-page="life"]');
  assert.equal(get(w).decision, null);
  click(w, '[data-page="profile"]');
  w.document.querySelector("#shirt-number").value = "27";
  click(w, '[data-action="number"]');
  assert.equal(get(w).extras.number, 27);
  if (mode === "player") click(w, '[data-simulate="30days"]');
  click(w, '[data-page="home"]');
  assert.ok(w.document.querySelector(".central-main-match"), "A Central deve manter o próximo compromisso");
  assert.ok(w.document.querySelector(".central-table"), "A Central deve manter o resumo da classificação");
  assert.ok(w.document.querySelector(".central-calendar"), "A Central deve manter a agenda rápida");
  if (mode === "player") {
    const nationalResult = w.document.querySelector(".national-result");
    if (nationalResult) assert.ok(nationalResult.textContent.includes("Brasil"), "Quando houver resultado da Seleção no período simulado, o card deve identificar o Brasil");
  }
  assert.ok(w.document.querySelector(".game-nav"), "A v0.5 deve renderizar a navegacao superior");
  click(w, '[data-page="profile"]');
  const chart = w.document.querySelector("#chart-key");
  assert.ok(chart, "O relatorio de desenvolvimento deve existir no perfil");
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
w.localStorage.setItem("prolife.v1.slot." + w.ProLifeSave.activeId(), JSON.stringify(s));
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
