"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const source = fs.readFileSync(path.join(__dirname, "../src/ui/sm27-shell.js"), "utf8");

function boot() {
  const dom = new JSDOM('<!doctype html><body><div id="app"></div><button data-sm27-help>Ajuda</button><button data-sm27-settings>Def</button></body>', { runScripts: "outside-only", url: "http://localhost/" });
  dom.window.eval(source);
  return dom;
}
const click = (w, el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true }));

test("Ajuda abre o manual com todos os assuntos e volta", () => {
  const { window } = boot();
  const d = window.document;
  click(window, d.querySelector("[data-sm27-help]"));
  assert.ok(d.querySelector(".sm27-dialog"));
  click(window, d.querySelector("[data-sm27-help-view='manual']"));
  const topics = d.querySelectorAll("[data-sm27-help-topic]");
  assert.equal(topics.length, window.ProLifeSM27Shell.TOPICS.length);
  assert.ok(topics.length >= 14);
  click(window, topics[0]);
  assert.ok(d.querySelector(".shd-help-text h3"));
  click(window, d.querySelector("[data-sm27-dialog-back]"));
  assert.ok(d.querySelector(".shd-topic-grid"));
});

test("Definições alterna Jogo/Dados e guarda preferências visuais", () => {
  const { window } = boot();
  const d = window.document;
  click(window, d.querySelector("[data-sm27-settings]"));
  assert.equal(d.querySelector("[data-sm27-settings-view='jogo']").getAttribute("aria-selected"), "true");
  click(window, d.querySelector("[data-sm27-pref='reduceMotion']"));
  assert.equal(d.documentElement.classList.contains("pl-reduce-motion"), true);
  assert.equal(JSON.parse(window.localStorage.getItem("prolife.v1.uiPrefs")).reduceMotion, true);
  click(window, d.querySelector("[data-sm27-settings-view='dados']"));
  assert.ok(d.querySelector("[data-page='save']"));
  assert.ok(d.querySelector("[data-action='import']"));
});

test("apagar dados exige digitar APAGAR e só remove chaves prolife.*", () => {
  const { window } = boot();
  const d = window.document;
  window.localStorage.setItem("prolife.v1.slot.a", "x");
  window.localStorage.setItem("outro", "y");
  click(window, d.querySelector("[data-sm27-settings]"));
  click(window, d.querySelector("[data-sm27-settings-view='dados']"));
  click(window, d.querySelector("[data-sm27-settings-view='apagar']"));
  const btn = d.querySelector("[data-sm27-wipe]");
  assert.equal(btn.disabled, true);
  const input = d.querySelector("[data-sm27-confirm]");
  input.value = "apagar";
  input.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(btn.disabled, false);
  assert.match(source, /startsWith\("prolife\."\)/);
});

test("Esc fecha a janela e devolve o foco", () => {
  const { window } = boot();
  const d = window.document;
  click(window, d.querySelector("[data-sm27-help]"));
  d.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(d.querySelector(".sm27-dialog"), null);
});

test("Plantel e Relatórios do Elenco: renderizam com dados reais e sem regras novas", () => {
  const squad = require("../src/ui/sm27-squad.js");
  const mk = (id, pos, age, extra = {}) => ({ id, name: "J" + id, pos, primaryPosition: pos, age, potential: 80, overall: 70, morale: 60, condition: 90, marketValue: 1e6, contract: { salary: 5e4, endDay: 200, role: "rotation" }, attrs: { pace: 60 }, ...extra });
  const roster = [mk("a", "GOL", 30), mk("b", "ZAG", 19, { injury: 5 }), mk("c", "CA", 22, { suspension: 2 }), mk("d", "MC", 34, { morale: 30 })];
  const ctx = { s: { day: 100, coachCareer: { loans: [] } }, D: { overall: (p) => p.overall }, club: { id: "x", roster } };
  const roster_html = squad.render("roster", ctx);
  assert.match(roster_html, /Equipe A/);
  assert.equal((roster_html.match(/data-sm27sq-open=/g) || []).length, 4);
  for (const key of ["lesoes", "suspensoes", "moral", "contratos", "desenvolvimento", "juventude", "geral"]) {
    squad.set("report", key);
    const html = squad.render("reports", ctx);
    assert.match(html, /Relatórios do plantel/);
    assert.ok(html.length > 200, key);
  }
  squad.set("report", "lesoes");
  assert.match(squad.render("reports", ctx), /Jb|Lesionado/);
  squad.set("roster", "loan");
  assert.match(squad.render("roster", ctx), /Nenhum jogador emprestado/);
  squad.set("roster", "A");
});

test("Objetivos: metas derivadas dos dados reais, sem gravar no save", () => {
  const { JSDOM: J } = require("jsdom");
  const dom = new J("<!doctype html><body></body>", { runScripts: "outside-only", url: "http://localhost/" });
  const roster = Array.from({ length: 14 }, (_, i) => ({ id: "p" + i, age: 20 + i, condition: 90, morale: 70, potential: 80, overall: 72, contract: { endDay: 900 } }));
  dom.window.ProLifeSM27Ctx = () => ({ s: { day: 10, mode: "coach", reputation: 40, coachCareer: { goals: { leagueSize: 20, items: [{ kind: "posicao", label: "Evitar o rebaixamento", target: 17, progress: 5, status: "em_andamento" }] } } }, D: { overall: (p) => p.overall, club: () => ({ budget: 1e6, roster, stats: { wins: 2, points: 7, played: 4 } }) } });
  dom.window.eval(fs.readFileSync(path.join(__dirname, "../src/ui/sm27-objectives.js"), "utf8"));
  const d = dom.window.ProLifeSM27Objectives.build();
  assert.equal(d.diario.length, 5);
  assert.ok(d.epoca.some((g) => /rebaixamento/.test(g.label)));
  assert.equal(d.clube.length, 4);
  assert.ok(d.diario.every((g) => g.target > 0));
});
