"use strict";
// Stage 34F.26 - central de pendencias, indicador de carregamento, transicao de pagina e ligacao com o app.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { JSDOM } = require("jsdom");
const D = require("../src/domain/engine.js"); global.ProLife = D;
const dom = new JSDOM("<!doctype html><body><div class='game-shell'><div class='main'></div></div></body>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
const X = require("../src/ui/shell-extras.js");
const appSrc = fs.readFileSync(path.join(__dirname, "../src/ui/app.js"), "utf8");
const player = () => D.create({ mode: "player", clubId: "c0" }, 21);
const coach = () => D.create({ mode: "coach", clubId: "c0" }, 21);

test("34F.26 (1) pendencias do jogador: contrato, decisao, propostas e ordenacao por urgencia", () => {
  const s = player(); s.offers = []; s.decision = null;
  assert.equal(X.pending(s, D).some((x) => x.id === "contract"), false);
  s.contract = 25; s.decision = { title: "Entrevista" }; s.offers = [{ id: "o", expires: s.day + 5 }];
  const list = X.pending(s, D), ids = list.map((x) => x.id);
  assert.ok(ids.includes("contract") && ids.includes("decision") && ids.includes("offers"));
  assert.equal(list.find((x) => x.id === "contract").tone, "urgent"); assert.equal(list[list.length - 1].tone === "urgent", false);
  assert.ok(list.findIndex((x) => x.tone === "urgent") < list.findIndex((x) => x.tone === "warn"));
  s.offers = [{ id: "o", expires: s.day - 1 }]; assert.equal(X.pending(s, D).some((x) => x.id === "offers"), false);
});

test("34F.26 (2) pendencias do treinador: diretoria e sem clube; familia pendente vale para os dois", () => {
  const s = coach(); s.board = 25; assert.equal(X.pending(s, D).find((x) => x.id === "board").tone, "urgent");
  s.board = 40; assert.equal(X.pending(s, D).find((x) => x.id === "board").tone, "warn");
  s.board = 80; assert.equal(X.pending(s, D).some((x) => x.id === "board"), false);
  s.offField = { family: { pending: { id: "viagem", deadline: s.day + 4 } } }; assert.ok(X.pending(s, D).some((x) => x.id === "family"));
  s.clubId = null; assert.ok(X.pending(s, D).some((x) => x.id === "nojob"));
});

test("34F.26 (3) sino: contagem, escape de HTML e destino real de cada item", () => {
  const html = X.bell([{ id: "x", tone: "warn", label: "<b>x</b>", detail: '"d"', page: "inbox", target: "t1" }]);
  assert.ok(html.includes('data-page="inbox"') && html.includes('data-target="t1"') && html.includes("<i>1</i>")); assert.ok(!html.includes("<b>x</b>"));
  assert.ok(X.bell([]).includes("Nenhuma pendência"));
  const navIds = new Set([...appSrc.matchAll(/\["([a-zA-Z]+)", "[^"]+"\]/g)].map((m) => m[1]));
  for (const id of ["inbox", "life", "offField", "coachCareer", "proposals", "market", "contract", "profile"]) assert.ok(navIds.has(id), id);
});

test("34F.26 (4) chip do clube mostra contrato; sem clube avisa", () => {
  const s = player(); s.contract = 120; assert.match(X.chipLine(s), /120 dia/); assert.match(X.chipLine(s), /R\$/);
  assert.match(X.chipLine(coach()), /Confiança/); s.clubId = null; assert.equal(X.chipLine(s), "Sem contrato");
});

test("34F.26 (5) painel abre/fecha por clique, fora e Escape", () => {
  document.querySelector(".main").innerHTML = X.bell([{ id: "a", tone: "info", label: "A", detail: "d", page: "inbox" }]);
  const btn = document.querySelector("[data-bell-toggle]"), panel = document.querySelector("[data-bell-panel]");
  assert.equal(panel.hidden, true);
  btn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); assert.equal(panel.hidden, false); assert.equal(btn.getAttribute("aria-expanded"), "true");
  document.body.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); assert.equal(panel.hidden, true);
  btn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })); document.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(panel.hidden, true);
});

test("34F.26 (6) indicador de carregamento: aparece, executa o trabalho e some depois", async () => {
  let ran = false; X.run("Simulando…", () => { ran = true; });
  const el = document.getElementById("sx-busy"); assert.equal(el.hidden, false); assert.match(el.textContent, /Simulando/);
  await new Promise((r) => setTimeout(r, 120)); assert.equal(ran, true); assert.equal(el.hidden, true);
  let seen = null; X.run("y", () => { seen = document.getElementById("sx-busy").hidden; });
  await new Promise((r) => setTimeout(r, 120)); assert.equal(seen, false, "visivel durante o trabalho"); assert.equal(el.hidden, true);
});

test("34F.26 (7) transicao de pagina reinicia a animacao; reduced-motion respeitado", () => {
  X.pageEnter(); assert.ok(document.querySelector(".main").classList.contains("sx-enter"));
  assert.ok(X.css().includes("prefers-reduced-motion")); assert.ok(document.getElementById("sx-style"));
});

test("34F.26 (8) app.js liga o sino, o chip e a simulacao ao modulo; index carrega o script", () => {
  assert.ok(appSrc.includes("ProLifeShellExtras.bell(")); assert.ok(appSrc.includes("ProLifeShellExtras?.chipLine") || appSrc.includes("ProLifeShellExtras?.pageEnter") || appSrc.includes("chipLine(state)"));
  assert.ok(appSrc.includes("runSim(() =>")); assert.ok(appSrc.includes("ProLifeShellExtras?.pageEnter()"));
  assert.ok(fs.readFileSync(path.join(__dirname, "../index.html"), "utf8").includes("src/ui/shell-extras.js"));
});
