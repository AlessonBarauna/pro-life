"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
test("aporte inicial entra no caixa do primeiro clube assumido (carreira sem clube)", () => {
  const s = D.create({ mode: "coach", catalogVersion: "fc27_v1" }, 321);
  s.coachCareer = s.coachCareer || { version: 1 };
  s.coachCareer.settings = { funding: 10e9 };
  const offer = (s.offers || [])[0];
  assert.ok(offer, "há proposta");
  const before = Number(D.club(s, offer.clubId)?.budget) || 0;
  D.join(s, offer.clubId, offer.salary);
  const club = D.club(s, s.clubId);
  assert.equal(Math.round(club.budget), Math.round(before + 10e9));
  assert.equal(s.coachCareer.settings.fundingApplied, true);
});
