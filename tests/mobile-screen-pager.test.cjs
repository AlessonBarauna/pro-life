"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

test("paginador mobile preserva blocos inteiros e ajusta cada tela ao aparelho", async () => {
  const dom = new JSDOM('<!doctype html><div id="app"><div class="game-stage game-stage-season"><div class="sm27-screen-body"><main id="content"><nav id="tabs"></nav><section id="one"><div id="nested" style="height:100px;overflow-y:auto"><div style="height:300px"></div></div></section><section id="two"></section><section id="three"></section></main></div></div></div>', {
    runScripts:"outside-only",
    url:"http://localhost/"
  });
  const { window } = dom;
  window.matchMedia = () => ({ matches:true });
  window.requestAnimationFrame = (callback) => { callback(); return 1; };
  const body = window.document.querySelector(".sm27-screen-body");
  const content = window.document.getElementById("content");
  const nested = window.document.getElementById("nested");
  const tabs = window.document.getElementById("tabs");
  const sections = ["one", "two", "three"].map((id) => window.document.getElementById(id));
  Object.defineProperties(body, {
    clientHeight:{ configurable:true, value:500 },
    clientWidth:{ configurable:true, value:800 }
  });
  Object.defineProperties(content, {
    scrollHeight:{ configurable:true, value:760 },
    scrollWidth:{ configurable:true, value:800 },
    getBoundingClientRect:{ configurable:true, value:() => ({ height:760 }) }
  });
  Object.defineProperties(tabs, { offsetHeight:{ configurable:true, value:40 } });
  for (const section of sections) Object.defineProperties(section, { offsetHeight:{ configurable:true, value:240 } });
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
  assert.equal(sections[0].hasAttribute("data-sm27-page-hidden"), false);
  assert.equal(sections[1].hasAttribute("data-sm27-page-hidden"), true);
  body.querySelector("[data-sm27-page='next']").click();
  assert.equal(body.querySelector("[data-sm27-page-status]").textContent, "Tela 2 de 3");
  assert.equal(sections[0].hasAttribute("data-sm27-page-hidden"), true);
  assert.equal(sections[1].hasAttribute("data-sm27-page-hidden"), false);
  assert.equal(body.style.getPropertyValue("--sm27-page-offset"), "");
  assert.ok(Number(content.style.getPropertyValue("--sm27-page-fit")) <= .92);
  dom.window.close();
});
