"use strict";
// Investidores: proposta ao clube do treinador (aceitar/negociar/recusar), metas e avaliação; convite de projeto de xeque.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), A = require("../src/application/game.js"), I = require("../src/domain/club-investors.js");
function coach(seed) {
  const s = D.create({ mode: "coach", catalogVersion: "fc27_v1" }, seed);
  s.clubId = null; D.join(s, D.GlobalFootball.clubByName(s, "Real Betis").id, 90000);
  s.coachCareer = s.coachCareer || { version: 1 };
  return s;
}
// Liga europeia: avalia ao fim do campeonato; demais ligas: na virada da temporada.
function finish(s, d, pos, trophies) {
  if (d.objectives.some((o) => o.euro)) {
    const lid = D.club(s, s.clubId).leagueId, season = Math.max(...d.objectives.map((o) => o.deadlineSeason));
    I.leagueFinished(s, { leagueId: lid, season, orderIds: pos === 1 ? [s.clubId] : ["x", "y", "z", "w", "v", "u", "t", "r", "q", "p", "o", "n", "m", "l", "k", "j", "i", s.clubId] });
  } else { s.season = Math.max(...d.objectives.map((o) => o.deadlineSeason)); I.seasonEnd(s, { pos, trophies }); }
}
test("proposta de investidor: aceitar paga a parcela inicial e cumpre metas", () => {
  const s = coach(8101);
  const club = D.club(s, s.clubId), before = club.budget;
  const d = I.propose(s);
  assert.ok(d && d.objectives.length >= 2 && d.amount > 0);
  assert.throws(() => A.execute(s, "respondInvestorDeal", { id: d.id, action: "negotiate", ask: "x" }));
  A.execute(s, "respondInvestorDeal", { id: d.id, action: "accept" });
  assert.equal(d.status, "active");
  assert.equal(D.club(s, s.clubId).budget, before + Math.round(d.amount * 0.5));
  const sign = d.objectives.find((o) => o.type === "sign");
  for (let i = 0; i < sign.target; i++) I.onSigning(s, { overall: sign.minOvr + 1 });
  assert.equal(sign.status, "done");
  finish(s, d, 1, [{}, {}, {}]);
  assert.equal(d.status, "completed");
  assert.equal(D.club(s, s.clubId).budget, before + d.amount);
});
test("negociar tem no máximo duas rodadas; recusar encerra", () => {
  const s = coach(8102), d = I.propose(s);
  I.respond(s, d.id, "negotiate", "money");
  I.respond(s, d.id, "negotiate", "time");
  if (d.status === "negotiating") assert.throws(() => I.respond(s, d.id, "negotiate", "easier"), /última resposta/);
  const e = I.propose(coach(8103));
  assert.ok(e);
  const s3 = coach(8104), d3 = I.propose(s3);
  I.respond(s3, d3.id, "reject");
  assert.equal(d3.status, "rejected");
});
test("metas não cumpridas encerram o acordo e derrubam a diretoria", () => {
  const s = coach(8105), d = I.propose(s);
  I.respond(s, d.id, "accept");
  const board = s.board;
  finish(s, d, 17, []);
  assert.equal(d.status, "failed");
  assert.ok(s.board < board);
});
test("clube de xeque convida o treinador e aceitar ativa as metas do projeto", () => {
  let s = coach(8106);
  s.reputation = 70; s.careerTransferAvailableDay = 0;
  for (let i = 0; i < 9; i++) s = A.execute(s, "advance", {}) || s;
  const offer = (s.offers || []).find((o) => o.project);
  assert.ok(offer, "convite do xeque");
  assert.ok(offer.project.objectives.length >= 2);
  s.careerTransferAvailableDay = 0;
  A.execute(s, "join", { id: offer.clubId });
  const act = I.view(s).active[0];
  assert.ok(act && act.kind === "project" && act.clubId === offer.clubId);
});
