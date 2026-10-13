"use strict";
// Acordo assinado (transferencia agendada) nao pode continuar bloqueando a simulacao pedindo novo aceite.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const D = require("../src/domain/engine.js");
const mk = (seed = 33301) => {
  const s = D.create({ mode: "player", clubId: "c0", name: "Acordo", age: 22, pos: "ATA" }, seed);
  s.careerTransferAvailableDay = 0; s.offers = []; D.Career.init(s).playerCareer.interests = []; return s;
};
const schedule = (s) => { const ag = D.Career.init(s).playerCareer.marketState; ag.signedAgreement.startDay = s.day + 300; ag.signedAgreement.status = "scheduled"; ag.futureTransfer = { clubId: ag.signedAgreement.clubId, startDay: s.day + 300, agreedDay: s.day }; };
const offer = (s, clubId, over = {}) => ({ clubId, salary: 18000, signingBonus: 24000, durationDays: 730, role: "Concorrência", squadRole: "Rotação", transferType: "permanent", expires: s.day + 20, interestScore: 70, ...over });

test("sem acordo, a proposta ativa continua interrompendo a simulacao", () => {
  const s = mk(); s.offers = [offer(s, "gf_craiova")];
  const r = D.simulateAdvance(s, "30days"); assert.equal(r.completed, false); assert.equal(r.stop.type, "offer"); assert.equal(s.day, 0);
});
test("depois de assinar o acordo, a proposta do mesmo clube nao bloqueia mais e o dia avanca", () => {
  const s = mk(); s.offers = [offer(s, "gf_craiova")];
  D.Career.signAgreement(s, s.offers[0]); schedule(s);
  const pc = D.Career.init(s).playerCareer; assert.equal(pc.marketState.signedAgreement.clubId, "gf_craiova");
  assert.ok(s.offers.some((o) => o.clubId === "gf_craiova"), "a oferta original permanece no estado (nao e apagada)");
  const r = D.simulateAdvance(s, "nextMatch");
  assert.ok(!(r.stop && r.stop.type === "offer" && r.stop.id === "gf_craiova"), JSON.stringify(r.stop));
  assert.ok(s.day > 0, "dia avancou");
  assert.equal(pc.marketState.signedAgreement.clubId, "gf_craiova", "acordo preservado");
});
test("proposta de OUTRO clube ainda interrompe mesmo com acordo assinado", () => {
  const s = mk(); s.offers = [offer(s, "gf_craiova")]; D.Career.signAgreement(s, s.offers[0]); schedule(s);
  s.offers.push(offer(s, "c3"));
  const r = D.simulateAdvance(s, "30days");
  assert.equal(r.stop && r.stop.type, "offer"); assert.equal(r.stop.id, "c3");
});
test("save/load mantem o acordo e o avanco continua liberado", () => {
  const s = mk(); s.offers = [offer(s, "gf_craiova")]; D.Career.signAgreement(s, s.offers[0]); schedule(s);
  const back = JSON.parse(JSON.stringify(s)); const r = D.simulateAdvance(back, "nextMatch");
  assert.ok(!(r.stop && r.stop.type === "offer")); assert.equal(D.Career.init(back).playerCareer.marketState.signedAgreement.clubId, "gf_craiova");
});
test("tela: botao da central mostra 'Visualizar acordo assinado' para o clube ja acordado", () => {
  const src = fs.readFileSync(path.join(__dirname, "../src/ui/app.js"), "utf8");
  assert.ok(/cineAgreement\(\)\?\.clubId === id \? "Visualizar acordo assinado"/.test(src));
});
