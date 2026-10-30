"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

test("paginador mobile remove rolagens internas e troca o conteúdo por telas", async () => {
  const dom = new JSDOM('<!doctype html><div id="app"><div class="game-stage game-stage-season"><div class="sm27-screen-body"><main id="content"><section id="nested" style="height:100px;overflow-y:auto"><div style="height:300px"></div></section></main></div></div></div>', {
    runScripts:"outside-only",
    url:"http://localhost/"
  });
  const { window } = dom;
  window.matchMedia = () => ({ matches:true });
  window.requestAnimationFrame = (callback) => { callback(); return 1; };
  const body = window.document.querySelector(".sm27-screen-body");
  const content = window.document.getElementById("content");
  const nested = window.document.getElementById("nested");
  Object.defineProperties(body, { clientHeight:{ configurable:true, value:500 } });
  Object.defineProperties(content, {
    scrollHeight:{ configurable:true, value:950 },
    getBoundingClientRect:{ configurable:true, value:() => ({ height:950 }) }
  });
  Object.defineProperties(nested, {
    clientHeight:{ configurable:true, value:100 },
    scrollHeight:{ configurable:true, value:300 },
    clientWidth:{ configurable:true, value:200 },
    scrollWidth:{ configurable:true, value:200 }
  });
  const source = fs.readFileSync(path.join(__dirname, "../src/ui/mobile-game-viewport.js"), "utf8");
  window.eval(source);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(nested.dataset.sm27Unscroll, "y");
  assert.equal(body.classList.contains("sm27-paged"), true);
  assert.equal(body.querySelector("[data-sm27-page-status]").textContent, "Tela 1 de 3");
  body.querySelector("[data-sm27-page='next']").click();
  assert.equal(body.querySelector("[data-sm27-page-status]").textContent, "Tela 2 de 3");
  assert.equal(body.style.getPropertyValue("--sm27-page-offset"), "-456px");
  dom.window.close();
});
