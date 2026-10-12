"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");

test("34F.32B.4E.4 - Real Madrid disputa Champions no motor oficial", () => {
  const madridId = "gf_fc27_243";

  const s = D.create({
    mode: "player",
    clubId: madridId,
    catalogVersion: "fc27_v1"
  }, 5);

  // O motor inicia sem clube quando nao existe proposta valida.
  // Preparamos uma oferta somente nesta carreira temporaria de teste.
  if (s.clubId !== madridId) {
    s.offers ||= [];
    s.offers.push({
      clubId: madridId,
      salary: 90000,
      durationDays: 730,
      signingBonus: 0,
      squadRole: "Rotação",
      transferType: "permanent",
      expires: s.day + 30
    });
    D.join(s, madridId, 90000);
  }

  assert.equal(s.clubId, madridId, "Ingresso no Real Madrid falhou");

  D.advance(s, 1);

  const ed = D.Continental.edition(s, "ucl");
  assert.ok(ed, "Edicao da Champions ausente");
  assert.ok(ed.entrants.some(e => e[0] === madridId),
    "Real Madrid nao foi inscrito na Champions");
  assert.ok(ed.leagueSchedule, "Calendario nao preparado");

  const heroMatches = ed.leagueSchedule.matches
    .filter(m => [m.homeId, m.awayId].includes(madridId))
    .sort((a, b) => a.day - b.day);

  assert.equal(heroMatches.length, 8);

  const first = heroMatches[0];

  console.log("Dia inicial:", s.day);
  console.log("Primeiro jogo:", first.day);
  console.log("Adversario:", first.homeId === madridId
    ? first.awayId : first.homeId);

  let steps = 0;

  while (s.day < first.day) {
    if (++steps > 15) throw Error("Limite de avanco excedido");
    const step = Math.min(30, first.day - s.day);
    const before = s.day;
    D.advance(s, step);
    assert.equal(s.day, before + step);
  }

  const updated = ed.leagueSchedule.matches.find(m => m.id === first.id);

  console.log("Partida processada:", updated.played);
  console.log("Placar:", updated.hg, "x", updated.ag);

  const official = (s.matches || []).filter(m =>
    m.competitionId === "ucl" &&
    [m.home, m.away].includes(madridId)
  );

  console.log("Partidas oficiais no historico:", official.length);

  const m = official.find(m =>
    m.home === first.homeId &&
    m.away === first.awayId
  );

  console.log("Registro oficial encontrado:", !!m);
  console.log("Competicao:", m?.competitionName);
  console.log("LeagueId:", m?.leagueId);
  console.log("Participacao:", JSON.stringify(m?.participation ?? null));
  console.log("Estatisticas individuais:", JSON.stringify(m?.playerStats?.hero ?? null));

  const report = s.career?.playerCareer?.lastMatchReport ??
    s.extras?.playerCareer?.lastMatchReport ??
    null;

  console.log("Relatorio do jogador disponivel:", !!report);

  assert.equal(updated.played, true,
    "Jogo nao foi processado");

  assert.ok(m,
    "Jogo do Real Madrid nao passou pelo registro oficial");

  assert.equal(m.competitionId, "ucl");
  assert.equal(m.leagueId, null);

  assert.ok(Array.isArray(m.events),
    "Eventos oficiais ausentes");

  assert.ok(m.ratings && typeof m.ratings === "object",
    "Avaliacoes da partida ausentes");

  const saved = JSON.parse(JSON.stringify(s));
  const persisted = D.Continental.edition(saved, "ucl")
    .leagueSchedule.matches.find(x => x.id === first.id);

  assert.equal(persisted.played, true);
  assert.equal(persisted.hg, updated.hg);
  assert.equal(persisted.ag, updated.ag);

  console.log("RESULTADO: Partida continental oficial validada");
});
