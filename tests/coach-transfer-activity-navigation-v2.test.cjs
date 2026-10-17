"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../src/ui/coach-career-view.js"), "utf8");
const view = require("../src/ui/coach-career-view.js");

test("market activities open the selected purchase negotiation, not just a generic tab", () => {
  assert.match(source, /t\.kind==="sale"\?'data-coach-deal-tab="recebidas"':'data-coach-deal-open="'\+esc\(t\.id\)/);
  view.openDeal("neg-42");
  assert.equal(view.state.selectedDeal, "neg-42");
  assert.equal(view.state.dealTab, "propostas");
  view.closeDeal();
  assert.equal(view.state.selectedDeal, null);
});

test("incoming sale activity preserves the received offers route", () => {
  assert.match(source, /data-coach-deal-tab="recebidas"/);
  view.setDealTab("recebidas");
  assert.equal(view.state.dealTab, "recebidas");
});
