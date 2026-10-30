"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Engine = require("../src/domain/engine.js");

test("Observação renderiza jogadores reais sem usar formatadores antes da inicialização", () => {
  global.ProLifeGlobalFootball = Engine.GlobalFootball;
  global.ProLifeCoachCareer = Engine.CoachCareer;
  global.ProLifeCoachScoutingV2 = require("../src/domain/coach-scouting-v2.js");
  global.ProLifePlayerEconomy = require("../src/domain/player-economy.js");
  global.ProLifeCoachSquadHub = require("../src/ui/coach-squad-hub.js");

  const View = require("../src/ui/coach-career-view.js");
  const state = Engine.create({ mode: "coach", catalogVersion: "fc27_v1" }, 4242);
  state.clubId = null;
  Engine.join(state, "gf_fc27_5", 90000);
  View.setMarketArea("observacao");

  const html = View.renderMarket(state, Engine);
  assert.match(html, /data-coach-market-area="observacao" aria-pressed="true"/);
  assert.match(html, /class="cc-card cc-fc27-scout cc-scout-search-screen"/);
  assert.match(html, /Buscar jogadores/);
});
