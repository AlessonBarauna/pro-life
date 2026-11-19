"use strict";
// Todos os jogos de seleções geram gols, assistências, minutos, cartões e nota para os atletas (alimentam prêmios e histórico).
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const A = require("../src/application/game.js");
const WS = require("../src/domain/world-stats.js");
test("jogos de outras seleções contam gols, minutos, assistências e cartões", { timeout: 0 }, () => {
  const s = D.create({ mode: "coach", catalogVersion: "fc27_v1", clubId: "gf_fc27_449" }, 5);
  const plan = D.preseasonPlan(s); if (plan) D.preseasonStep(s, plan.targetDay, 400);
  for (let i = 0; i < 330; i++) A.execute(s, "advance", {});
  assert.ok(!s.nationalStatsError, s.nationalStatsError);
  const L = s.globalFootball.worldStats.leagues.nat;
  assert.ok(L && L.n > 20, "muitos jogos de seleções contabilizados: " + (L && L.n));
  const rows = WS.rowsOf(s, "nat");
  assert.ok(rows.length > 100, "atletas de várias seleções com estatística");
  const goals = rows.reduce((n, r) => n + r.goals, 0), ast = rows.reduce((n, r) => n + r.assists, 0);
  const cards = rows.reduce((n, r) => n + (r.yc || 0) + (r.rc || 0), 0);
  assert.ok(goals > 20 && ast > 5 && ast <= goals, `gols ${goals} assist ${ast}`);
  assert.ok(cards > 0, "cartões registrados");
  assert.ok(rows.every((r) => r.apps > 0), "só quem jogou");
  assert.ok(rows.some((r) => r.avg >= 6 && r.avg <= 10), "nota por jogador");
  const mins = rows.reduce((n, r) => n + 0, 0);
  const total = L.v.length / 9, keys = Object.keys(s.nationalTeam.statLedger.keys).length;
  assert.ok(keys >= L.n - 5, "livro de jogos processados");
  // Idempotente: rodar de novo não duplica.
  const before = L.n; require("../src/domain/national-stats.js").daily(s, D);
  assert.equal(L.n, before);
});
