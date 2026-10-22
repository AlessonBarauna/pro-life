"use strict";

const assert = require("node:assert/strict");

// The top-level navigation has changed over time; subpages are rendered only
// after selecting the active group. Keep this mapping aligned with src/ui/app.js.
const PAGE_GROUPS = Object.freeze({
  league: "competitions", competitions: "competitions", panorama: "competitions",
  worldCompetitions: "competitions", englishCups: "competitions",
  champions: "competitions", europa: "competitions", conference: "competitions",
  libertadores: "competitions", sudamericana: "competitions",
  calendar: "calendar", matches: "calendar",
  contract: "profile", statistics: "profile", awards: "profile", legacy: "profile",
  agency: "profile", story: "profile",
  proposals: "market", clubs: "market",
  squad: "squad", lineup: "squad",
  training: "training", life: "life", sponsorships: "life"
});

function clickPage(w, page) {
  // Finance is under different groups for player and coach. Resolve it at runtime.
  const mode = w.ProLifeSave?.activeId?.() && w.ProLifeSave?.loadSlot?.(w.ProLifeSave.activeId())?.mode;
  const group = page === "finance" ? (mode === "coach" ? "profile" : "life") : PAGE_GROUPS[page];
  const direct = w.document.querySelector(`.game-nav [data-page="${page}"]`);
  if (group && group !== page && !direct) {
    const top = w.document.querySelector(`.game-nav [data-page="${group}"]`);
    assert.ok(top, `top-level navigation missing: ${group}`);
    top.click();
  }
  const sub = w.document.querySelector(`.game-subnav [data-page="${page}"]`);
  const target = sub || w.document.querySelector(`[data-page="${page}"]`);
  assert.ok(target, `page navigation missing: ${page}`);
  target.click();
}

function clickSelector(w, selector) {
  const match = /^\[data-page=["']([^"']+)["']\]$/.exec(selector);
  if (match) return clickPage(w, match[1]);
  const node = w.document.querySelector(selector);
  assert.ok(node, `element missing: ${selector}`);
  node.click();
}

function formForMode(w, mode) {
  assert.ok(mode === "coach" || mode === "player", "unknown career mode: " + mode);
  const selector = mode === "coach" ? "#coach-creation-form" : "#creator";
  const form = w.document.querySelector(selector);
  assert.ok(form, `creation form missing: ${selector}`);
  return form;
}

function submitForm(w, form) {
  assert.ok(form && form.tagName === "FORM", "valid form required");
  return form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
}

module.exports = { PAGE_GROUPS, clickPage, clickSelector, formForMode, submitForm };
