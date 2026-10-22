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
