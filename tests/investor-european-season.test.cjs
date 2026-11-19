"use strict";
// Metas de investidor em liga europeia valem até o FIM do campeonato (não até a virada do ano).
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const A = require("../src/application/game.js");
const I = require("../src/domain/club-investors.js");
test("cláusula do investidor não fecha na virada do ano; fecha quando a liga termina", () => {
  const s = D.create({ mode: "coach", catalogVersion: "fc27_v1", clubId: "gf_fc27_449" }, 5);
  const plan = D.preseasonPlan(s); if (plan) D.preseasonStep(s, plan.targetDay, 400);
  const d = I.propose(s); assert.ok(d);
  assert.ok(d.objectives.every((o) => o.euro), "metas marcadas como liga europeia");
  assert.match(I.label(d.objectives[0]), /2026\/27/, "texto mostra a temporada europeia");
  I.respond(s, d.id, "accept");
  const seasonAtStart = s.season;
  let guard = 0;
  while (s.season === seasonAtStart && guard++ < 400) A.execute(s, "advance", {});
  assert.equal(s.season, seasonAtStart + 1, "virou o ano civil");
  const after = I.view(s).active.find((x) => x.id === d.id);
  assert.ok(after, "acordo segue em andamento depois da virada do ano");
  const pos = after.objectives.find((o) => o.type === "position");
  assert.equal(pos.status, "open", "posição só é avaliada no fim da liga");
  const eu = s.globalFootball.worldCompetitions.leagues[D.club(s).leagueId];
  assert.equal(eu.status, "active", "liga ainda em disputa");
  // Fim real da liga dispara a avaliação.
  I.leagueFinished(s, { leagueId: D.club(s).leagueId, season: eu.season, orderIds: [s.clubId, "x"] });
  const closed = I.view(s).recent.find((x) => x.id === d.id);
  assert.ok(closed && closed.status !== "active", "acordo encerrado ao fim da liga");
  assert.equal(closed.objectives.find((o) => o.type === "position").status, "done");
});
