"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const source = fs.readFileSync(path.join(__dirname, "../src/ui/mobile-game-viewport.js"), "utf8");

function boot(matches) {
  const dom = new JSDOM('<!doctype html><div id="app"><div class="game-stage"><div class="sm27-screen-body"><section id="one"></section><section id="two"></section></div></div></div>', { runScripts: "outside-only", url: "http://localhost/" });
  const { window } = dom;
  window.matchMedia = () => ({ matches });
  window.requestAnimationFrame = (callback) => { callback(); return 1; };
  window.eval(source);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  return dom;
}

test("viewport mobile publica a área real e não pagina nem escala o conteúdo", async () => {
  const dom = boot(true);
  const { window } = dom;
  await new Promise((resolve) => setTimeout(resolve, 0));
  const root = window.document.documentElement;
  assert.equal(root.classList.contains("pl-phone"), true);
  assert.ok(root.style.getPropertyValue("--pl-vh").endsWith("px"));
  assert.ok(root.style.getPropertyValue("--pl-vw").endsWith("px"));
  assert.equal(window.document.querySelector("[data-sm27-page-status]"), null, "sem paginador por tela");
  assert.equal(window.document.querySelector(".sm27-screen-body").classList.contains("sm27-paged"), false);
  assert.equal(window.document.querySelectorAll("[data-sm27-page-hidden]").length, 0, "nenhum bloco escondido por deslocamento");
  assert.equal(root.style.getPropertyValue("--sm27-page-offset"), "");
  assert.ok(window.ProLifeMobileViewport.QUERY.includes("orientation: landscape"));
  dom.window.close();
});

test("fora do celular o modo mobile fica desligado", async () => {
  const dom = boot(false);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(dom.window.document.documentElement.classList.contains("pl-phone"), false);
  dom.window.close();
});

test("o código do viewport não usa transform, zoom nem deslocamento em pixels", () => {
  assert.doesNotMatch(source, /transform|zoom|scale\(|page-offset|sm27-paged/);
});
