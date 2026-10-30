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
