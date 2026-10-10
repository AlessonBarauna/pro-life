"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const D = require("../src/domain/engine.js");
const Save = require("../src/infrastructure/save.js");

function state(seed = 2001, mode = "player") {
  const s = D.create({ mode, world: "legacy", name: "Teste Stage 20", age: mode === "coach" ? 36 : 20, pos: "ATA", points: {}, clubId: "c0" }, seed);
  s.offers = [];
  const commercial = D.Commercial.init(s, D);
  commercial.proposals = [];
  D.Career.init(s).communications.interviews = [];
  return s;
}

function template(id) {
  return D.UnexpectedEvents.catalog.find((item) => item.id === id);
}

test("20: saves antigos migram e o catálogo possui IDs únicos", () => {
  const s = state();
  delete s.extras.unexpectedEvents;
  const loaded = Save.parse(JSON.stringify(s));
  const u = loaded.extras.unexpectedEvents;
  assert.equal(u.version, 1);
  assert.deepEqual(u.history, []);
  assert.ok(D.UnexpectedEvents.catalog.length >= 10);
  assert.equal(new Set(D.UnexpectedEvents.catalog.map((item) => item.id)).size, D.UnexpectedEvents.catalog.length);
});

test("20: módulo não usa Math.random", () => {
  const source = fs.readFileSync(path.resolve(__dirname, "../src/domain/unexpected-events.js"), "utf8");
  assert.equal(source.includes("Math.random"), false);
});

test("20: tick usa fluxo determinístico próprio sem consumir o RNG global", () => {
  const s = state(2004);
  s.family = 40;
  s.day = D.UnexpectedEvents.GLOBAL_COOLDOWN;
  const shared = new D.Random(987654321);
  const before = shared.state;
  const ownBefore = D.UnexpectedEvents.init(s).rngState;
  D.UnexpectedEvents.daily(s, shared, D.Career, D);
  assert.equal(shared.state, before);
  assert.notEqual(D.UnexpectedEvents.init(s).rngState, ownBefore);
  const copy = JSON.parse(JSON.stringify(s));
  assert.equal(D.UnexpectedEvents.init(copy).rngState, D.UnexpectedEvents.init(s).rngState);
});

test("20: carreira nova respeita cooldown antes do primeiro acontecimento", () => {
  const s = state(2005);
  s.family = 40;
  assert.equal(D.UnexpectedEvents.init(s).lastEventDay, 0);
  for (s.day = 1; s.day < D.UnexpectedEvents.GLOBAL_COOLDOWN; s.day++) {
    assert.equal(D.UnexpectedEvents.isEligible(s, "family_request"), false);
  }
});

test("20: modo treinador e decisão existente bloqueiam criação", () => {
  const coach = state(2002, "coach");
  assert.equal(D.UnexpectedEvents.force(coach, "club_event", D.Career, D), null);
  const s = state(2003);
  s.decision = { id: "legacy", title: "Legada", body: "Preservar", choices: [["ok", "Ok"]] };
  assert.equal(D.UnexpectedEvents.force(s, "club_event", D.Career, D), null);
  assert.equal(s.decision.id, "legacy");
});

test("20: criação forçada é determinística e compatível com state.decision", () => {
  const s = state();
  const decision = D.UnexpectedEvents.force(s, "family_request", D.Career, D);
  assert.equal(decision.source, "unexpected_event");
  assert.equal(decision.eventType, "family_request");
  assert.equal(decision.category, "VIDA PESSOAL");
  assert.ok(decision.title && decision.body);
  assert.ok(decision.choices.length === 3 && decision.choices.every((choice) => choice.length === 2));
  assert.equal(decision.deadline, s.day + template("family_request").deadline);
  assert.equal(D.pendingActions(s)[0].type, "decision");
});

test("20: consulta de elegibilidade não modifica o save", () => {
  const s = state();
  delete s.extras.unexpectedEvents;
  const before = JSON.stringify(s);
  D.UnexpectedEvents.isEligible(s, "club_event", { ignoreCooldown: true, ignoreDecision: true });
  assert.equal(JSON.stringify(s), before);
});

test("20: cooldown global, específico e repetição imediata são respeitados", () => {
  const s = state();
  D.UnexpectedEvents.force(s, "family_request", D.Career, D);
  D.decide(s, "balance");
  s.day += 5;
  assert.equal(D.UnexpectedEvents.isEligible(s, "club_event"), false);
  s.day += 6;
  assert.equal(D.UnexpectedEvents.isEligible(s, "family_request"), false);
  const u = D.UnexpectedEvents.init(s);
  u.cooldowns.family_request = s.day - 1;
  u.lastEventDay = s.day - 20;
  assert.equal(D.UnexpectedEvents.isEligible(s, "family_request"), false);
});

test("20: escolha inválida é rejeitada e resolução altera estado com clamp", () => {
  const s = state();
  s.family = 98;
  D.UnexpectedEvents.force(s, "family_request", D.Career, D);
  assert.throws(() => D.decide(s, "inexistente"), /Decisão inválida/);
  const before = s.family;
  const result = D.decide(s, "attend");
  assert.equal(s.decision, null);
  assert.equal(s.family, 100);
  assert.ok(s.family > before);
  assert.equal(result.status, "RESOLVED");
  assert.ok(result.delta.family > 0);
  assert.equal(s.decisionConsequences[0].decisionId, result.eventId);
});

test("20: resolução é idempotente e comunicações não duplicam", () => {
  const s = state();
  const decision = D.UnexpectedEvents.force(s, "press_misquote", D.Career, D);
  const first = D.decide(s, "clarify");
  const after = { reputation: s.reputation, messages: D.Career.init(s).communications.messages.length, articles: D.Career.init(s).communications.articles.length };
  s.decision = JSON.parse(JSON.stringify(decision));
  const second = D.UnexpectedEvents.resolve(s, "clarify", D.Career, D);
  assert.deepEqual(second, first);
  assert.equal(s.decision, null);
  assert.equal(s.reputation, after.reputation);
  assert.equal(D.Career.init(s).communications.messages.length, after.messages);
  assert.equal(D.Career.init(s).communications.articles.length, after.articles);
});

test("20: histórico, cooldown e resolução sobrevivem a save/reload", () => {
  const s = state();
  D.UnexpectedEvents.force(s, "club_event", D.Career, D);
  D.decide(s, "partial_presence");
  const loaded = Save.parse(JSON.stringify(s));
  assert.deepEqual(loaded.extras.unexpectedEvents, s.extras.unexpectedEvents);
  assert.equal(loaded.extras.unexpectedEvents.history[0].eventType, "club_event");
});

test("20: prazo vencido aplica resposta segura e registra expiração", () => {
  const s = state();
  const decision = D.UnexpectedEvents.force(s, "logistics_problem", D.Career, D);
  s.day = decision.deadline + 1;
  const result = D.UnexpectedEvents.expire(s, D.Career, D);
  assert.equal(result.status, "EXPIRED");
  assert.equal(result.choice, template("logistics_problem").defaultChoice);
  assert.equal(s.decision, null);
  assert.equal(D.UnexpectedEvents.init(s).stats.expired, 1);
});

test("20: simulação longa resolve decisão inesperada pelo handler existente", () => {
  const s = state();
  s.careerTransferAvailableDay = 99999;
  const original = D.UnexpectedEvents.daily;
  let created = false;
  D.UnexpectedEvents.daily = (current) => {
    if (!created) {
      created = true;
      return D.UnexpectedEvents.force(current, "club_event", D.Career, D);
    }
    return null;
  };
  try {
    const result = D.simulateAdvance(s, "30days");
    assert.equal(result.completed, true);
    assert.equal(result.stop, null);
    assert.equal(s.decision, null);
    assert.equal(D.UnexpectedEvents.init(s).history.filter(x=>x.eventType==="club_event").length, 1);
  } finally {
    D.UnexpectedEvents.daily = original;
  }
});

test("20: elegibilidade familiar, de imprensa e do clube depende do contexto", () => {
  const s = state();
  s.family = 95; s.stress = 10;
  assert.equal(D.UnexpectedEvents.isEligible(s, "family_request", { ignoreCooldown: true, ignoreDecision: true }), false);
  s.family = 45;
  assert.equal(D.UnexpectedEvents.isEligible(s, "family_request", { ignoreCooldown: true, ignoreDecision: true }), true);
  s.reputation = 10;
  assert.equal(D.UnexpectedEvents.isEligible(s, "press_misquote", { ignoreCooldown: true, ignoreDecision: true }), false);
  s.reputation = 40;
  assert.equal(D.UnexpectedEvents.isEligible(s, "press_misquote", { ignoreCooldown: true, ignoreDecision: true }), true);
  assert.equal(D.UnexpectedEvents.isEligible(s, "club_event", { ignoreCooldown: true, ignoreDecision: true }), true);
  s.clubId = null;
  assert.equal(D.UnexpectedEvents.isEligible(s, "club_event", { ignoreCooldown: true, ignoreDecision: true }), false);
});

test("20: torcida positiva e negativa e apoio do elenco são contextuais", () => {
  const s = state();
  s.reputation = 50;
  s.matches.unshift({ ratings: { hero: 5.4 }, events: [] });
  assert.equal(D.UnexpectedEvents.isEligible(s, "fan_pressure", { ignoreCooldown: true, ignoreDecision: true }), true);
  assert.equal(D.UnexpectedEvents.isEligible(s, "positive_viral", { ignoreCooldown: true, ignoreDecision: true }), false);
  s.matches[0] = { ratings: { hero: 8.5 }, events: [{ type: "goal", playerId: "hero" }] };
  assert.equal(D.UnexpectedEvents.isEligible(s, "positive_viral", { ignoreCooldown: true, ignoreDecision: true }), true);
  s.person.morale = 40;
  assert.equal(D.UnexpectedEvents.isEligible(s, "teammate_support", { ignoreCooldown: true, ignoreDecision: true }), true);
});

test("20: conflito com companheiro e rumor exigem contexto profissional", () => {
  const s = state();
  assert.equal(D.UnexpectedEvents.isEligible(s, "training_conflict", { ignoreCooldown: true, ignoreDecision: true }), true);
  const pc = D.Career.init(s).playerCareer;
  pc.coachTrust = 95; pc.squadRole = "Estrela"; pc.interests = []; s.contract = 500;
  assert.equal(D.UnexpectedEvents.isEligible(s, "dissatisfaction_rumor", { ignoreCooldown: true, ignoreDecision: true }), false);
  pc.coachTrust = 40;
  assert.equal(D.UnexpectedEvents.isEligible(s, "dissatisfaction_rumor", { ignoreCooldown: true, ignoreDecision: true }), true);
});

test("20: decisões legadas e entrevistas continuam usando o fluxo antigo", () => {
  const s = state();
  s.decision = { id: "family", title: "Família", body: "Visita", choices: [["visit", "Visitar"]] };
  const before = s.family;
  D.decide(s, "visit");
  assert.equal(s.decision, null);
  assert.ok(s.family > before);
  s.decision = { id: "media", title: "Entrevista", body: "Resposta", choices: [["humble", "Humildade"], ["bold", "Ousadia"]] };
  D.decide(s, "humble");
  assert.equal(s.decision, null);
  assert.ok(D.Career.mediaProfile(s).interviews >= 1);
});

