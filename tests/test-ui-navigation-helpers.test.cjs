"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const { clickPage, clickSelector, formForMode, submitForm } = require("./helpers/ui-navigation.cjs");

test("navigation helper opens competitions before selecting league", () => {
  const w = new JSDOM('<header class="game-nav"><button data-page="competitions">Competições</button></header><div class="game-subnav"></div>').window;
  let clicked = false;
  w.document.querySelector('[data-page="competitions"]').addEventListener("click", () => {
    w.document.querySelector(".game-subnav").innerHTML = '<button data-page="league">Liga</button>';
    w.document.querySelector('[data-page="league"]').addEventListener("click", () => { clicked = true; });
  });
  clickPage(w, "league");
  assert.equal(clicked, true);
  clickSelector(w, '[data-page="league"]');
  assert.equal(clicked, true);
});

test("mode-specific forms resolve independently and dispatch submit", () => {
  const w = new JSDOM('<form id="creator"></form><form id="coach-creation-form"></form>').window;
  assert.equal(formForMode(w, "player").id, "creator");
  const coach = formForMode(w, "coach");
  let count = 0;
  coach.addEventListener("submit", e => { count++; e.preventDefault(); });
  submitForm(w, coach);
  assert.equal(count, 1);
});

test("missing navigation and forms fail with actionable assertions", () => {
  const w = new JSDOM("<main></main>").window;
  assert.throws(() => clickPage(w, "league"), /top-level navigation missing/);
  assert.throws(() => formForMode(w, "coach"), /creation form missing/);
});

test("top-level navigation is clicked only once", () => {
  const w = new JSDOM('<header class="game-nav"><button data-page="competitions">Competições</button></header>').window;
  let count = 0;
  w.document.querySelector('[data-page="competitions"]').addEventListener("click", () => { count++; });
  clickPage(w, "competitions");
  assert.equal(count, 1, "top-level navigation must not be triggered twice");
});

test("finance navigation follows player and coach layouts", () => {
  for (const [mode, expected] of [["player", "life"], ["coach", "profile"]]) {
    const w = new JSDOM('<header class="game-nav"><button data-page="life">Vida</button><button data-page="profile">Perfil</button></header><div class="game-subnav"></div>').window;
    w.ProLifeSave = { activeId: () => "slot", loadSlot: () => ({ mode }) };
    const events = [];
    w.document.querySelectorAll(".game-nav button").forEach(button => button.addEventListener("click", () => {
      events.push(button.dataset.page);
      w.document.querySelector(".game-subnav").innerHTML = '<button data-page="finance">Finanças</button>';
    }));
    clickPage(w, "finance");
    assert.deepEqual(events, [expected]);
  }
});

test("form helper rejects unknown career modes", () => {
  const w = new JSDOM('<form id="creator"></form>').window;
  assert.throws(() => formForMode(w, "manager"), /unknown career mode/);
});
