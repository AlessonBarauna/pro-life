"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const base = path.resolve(__dirname, "..");
const scripts = [
  "src/domain/world2026.js", "src/domain/brazil-data.js", "src/domain/competitions.js", "src/domain/training.js",
  "src/domain/identity.js", "src/domain/creation.js", "src/domain/universe.js", "src/domain/statistics.js",
  "src/domain/life.js", "src/domain/career.js", "src/domain/commercial.js", "src/domain/physical.js",
  "src/domain/squad.js", "src/domain/unexpected-events.js", "src/domain/simulation-tactics.js",
  "src/domain/national-team.js", "src/domain/character.js", "src/ui/charts.js", "src/domain/engine.js",
  "src/domain/player-profile.js", "src/application/game.js", "src/infrastructure/codec.js",
  "src/infrastructure/validate-expansion.js", "src/infrastructure/save.js", "src/ui/expansion.js",
  "src/ui/calendar.js", "src/ui/home-dashboard.js", "src/ui/live-match.js", "src/ui/creator.js",
];

function browserWithDecision() {
  const dom = new JSDOM(fs.readFileSync(path.join(base, "index.html"), "utf8"), { runScripts: "outside-only", url: "https://stage20.invalid" });
  const w = dom.window;
  w.confirm = () => true; w.scrollTo = () => {}; w.URL.createObjectURL = () => "blob:test"; w.URL.revokeObjectURL = () => {};
  for (const file of scripts) w.eval(fs.readFileSync(path.join(base, file), "utf8"));
  const s = w.ProLife.create({ mode: "player", world: "legacy", name: "UI Stage 20", age: 20, pos: "ATA", points: {}, clubId: "c0" }, 2020);
  s.offers = [];
  w.ProLife.UnexpectedEvents.force(s, "family_request", w.ProLife.Career, w.ProLife);
  w.ProLife.UnexpectedEvents.resolve(s, "balance", w.ProLife.Career, w.ProLife);
  w.ProLife.UnexpectedEvents.force(s, "club_event", w.ProLife.Career, w.ProLife);
  const id = "career_stage20";
  w.localStorage.setItem("prolife.v1.slot." + id, JSON.stringify(s));
  w.localStorage.setItem("prolife.v1.slots", JSON.stringify([{ id, name: s.person.name, mode: s.mode, season: s.season, day: s.day }]));
  w.localStorage.setItem("prolife.v1.activeSlot", id);
  w.eval(fs.readFileSync(path.join(base, "src/ui/app.js"), "utf8"));
  w.document.querySelector(`[data-load-slot="${id}"]`).click();
  return dom;
}

test("20 UI: decisão mostra categoria, contexto, prazo e escolhas", () => {
  const dom = browserWithDecision(), w = dom.window;
  const lifeLink = w.document.querySelector('[data-page="life"]');
  assert.ok(lifeLink);
  lifeLink.click();
  const decision = w.document.querySelector("#current-decision");
  assert.ok(decision);
  assert.match(decision.textContent, /CLUBE/);
  assert.match(decision.textContent, /Convite para evento do clube/);
  assert.match(decision.textContent, /prazo:/i);
  assert.equal(decision.querySelectorAll("[data-choice]").length, 3);
});

test("20 UI: acontecimentos resolvidos aparecem sem mutação direta da UI", () => {
  const dom = browserWithDecision(), w = dom.window;
  w.document.querySelector('[data-page="life"]').click();
  const history = w.document.querySelector("#unexpected-events-history");
  assert.ok(history);
  assert.match(history.textContent, /ACONTECIMENTOS RECENTES/);
  assert.match(history.textContent, /Um compromisso importante em família/);
  const source = fs.readFileSync(path.join(base, "src/ui/app.js"), "utf8");
  assert.match(source, /data-choice/);
  assert.doesNotMatch(source, /data-choice[^\n]+(?:family|stress|morale)\s*=/);
});

