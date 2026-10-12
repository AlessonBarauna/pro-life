"use strict";
// Stage 34F.20 - elencos e escalacoes no mundo FC 27: merito, rodizio por sequencia de titularidades e persistencia.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), Save = require("../src/infrastructure/save.js");
const C = D.Career, Q = D.Squad;
const MAD = "gf_fc27_243", ARS = "gf_fc27_241";
function setOv(s, o) { s.person.ovr = o; s.person.overall = o; for (const k of Object.keys(s.person.attrs || {})) if (typeof s.person.attrs[k] === "number") s.person.attrs[k] = o; }
function career(clubId, ovr, squadRole = "Rotação", seed = 515) {
  const s = D.create({ mode: "player", clubId: "c0", age: 18, pos: "ATA", catalogVersion: "fc27_v1" }, seed); setOv(s, ovr);
  s.contract = 4000; const pc = C.init(s).playerCareer; if (pc.contract) pc.contract.endDay = s.day + 4000;
  s.careerTransferAvailableDay = 0; s.day = 10;
  s.offers = [{ clubId, salary: 90000, role: "x", squadRole, durationDays: 1095, signingBonus: 0, transferType: "permanent", expires: s.day + 10 }];
  D.join(s, clubId, 90000);
  return s;
}

test("34F.20 (1) titularidade por merito: nao vira titular so por chegar a um clube famoso, mesmo com promessa", () => {
  const weak = career(MAD, 55, "Titular");
  const c1 = Q.competition(weak);
  assert.notEqual(c1.heroRole, "Titular");
  assert.ok(c1.heroRank > 3);
  const star = career(ARS, 92);
  assert.equal(Q.competition(star).heroRole, "Titular");
  assert.equal(Q.competition(star).heroRank, 1);
});

test("34F.20 (2) elencos usam jogadores reais do catalogo (sem reservas artificiais nos grandes clubes)", () => {
  const s = career(MAD, 70), c = D.club(s);
  assert.ok(c.roster.length >= 25);
  assert.equal(c.roster.filter((p) => /^Reserva /.test(p.name)).length, 0);
  assert.ok(c.roster.some((p) => p.name === "Kylian Mbappé"));
});

test("34F.20 (3) rodizio: sequencia longa de titularidades libera descanso, com substituto proximo e sem tocar no gerador aleatorio", () => {
  const s = career(MAD, 70), c = D.club(s);
  const base = Q.choose(s, c);
  for (const p of base.starters) p.startStreak = 10;
  const rngBefore = JSON.stringify(s.rng);
  let sawRest = 0;
  for (let day = 20; day < 80; day++) {
    s.day = day;
    const sel = Q.choose(s, c), again = Q.choose(s, c);
    assert.deepEqual(sel.starters.map((p) => p.id), again.starters.map((p) => p.id), "deterministico no mesmo dia");
    assert.equal(sel.starters.length, 11);
    assert.equal(new Set(sel.starters.map((p) => p.id)).size, 11);
    for (const r of sel.rested) {
      sawRest++;
      assert.ok(!sel.starters.includes(r));
      const replacement = sel.starters.find((p) => p.pos === r.pos && !base.starters.includes(p));
      assert.ok(replacement && D.overall(replacement) >= D.overall(r) - 9, "substituto proximo em nivel");
    }
    assert.ok(sel.starters.every((p) => !p.injury && !(p.suspension > 0)));
  }
  assert.ok(sawRest >= 10, "houve descansos: " + sawRest);
  assert.equal(JSON.stringify(s.rng), rngBefore);
});

test("34F.20 (4) sem sequencia longa nao ha rodizio (comportamento anterior preservado)", () => {
  const s = career(MAD, 70), c = D.club(s);
  for (const p of c.roster) p.startStreak = 0;
  for (let day = 20; day < 60; day++) { s.day = day; assert.equal(Q.choose(s, c).rested.length, 0); }
});

test("34F.20 (5) registerStarters atualiza a sequencia: titulares +1, os demais voltam a 0", () => {
  const s = career(MAD, 70), c = D.club(s), sel = Q.choose(s, c);
  Q.registerStarters(c, sel.starters); Q.registerStarters(c, sel.starters);
  for (const p of sel.starters) assert.equal(p.startStreak, 2);
  for (const p of c.roster.filter((x) => !sel.starters.includes(x))) assert.equal(p.startStreak, 0);
});

test("34F.20 (6) uma temporada: titulares nao jogam 100% dos minutos, o elenco inteiro e usado e o save segue valido", () => {
  const s = career(MAD, 70);
  while (s.day < 345) D.advance(s, 7);
  const roster = s.worldMatchClubs[MAD].roster.filter((p) => p.id !== "hero");
  const top = roster.slice().sort((a, b) => D.overall(b) - D.overall(a)).slice(0, 11).filter((p) => p.pos !== "GOL");
  const max = Math.max(...roster.map((p) => p.minutes || 0));
  assert.ok(max > 0);
  assert.ok(top.some((p) => (p.minutes || 0) < max), "algum titular descansou");
  assert.ok(roster.filter((p) => (p.minutes || 0) > 0).length >= 14, "mais de 14 jogadores utilizados");
  assert.ok(roster.every((p) => !p.startStreak || Number.isInteger(p.startStreak)));
  assert.doesNotThrow(() => Save.validate(s));
  const back = JSON.parse(JSON.stringify(s));
  assert.doesNotThrow(() => Save.validate(back));
  assert.equal(JSON.stringify(back.worldMatchClubs[MAD].roster.map((p) => p.startStreak)), JSON.stringify(s.worldMatchClubs[MAD].roster.map((p) => p.startStreak)));
});
