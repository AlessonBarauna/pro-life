"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const Home = require("../src/ui/home-dashboard.js");
const ChampionsSeason = require("../src/domain/champions-season.js");

const CITY = "gf_fc27_10";

function career() {
  const s = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, 4242);
  s.clubId = null;
  D.join(s, CITY, 90000);
  return s;
}

test("Central preserva histórico e agenda Premier + Champions em 2029", () => {
  const s = career();

  while (s.day < 3 * 365) {
    s.board = 100;
    D.advance(s, Math.min(30, 3 * 365 - s.day));
  }

  assert.equal(s.season, 2029);
  assert.equal(s.clubId, CITY, "treinador perdeu o vínculo durante o teste temporal");
  assert.ok(s.history.some(h => h.season === 2026 && h.leagueId === "gf_fc27_premier_league" && h.mode === "coach"),
    "resumo histórico da Premier não foi preservado para o treinador");

  const recentBefore = Home.recentEntries(s).map(x => x.match);
  assert.ok(recentBefore.length > 0, "últimos jogos desapareceram na virada para 2029");
  assert.ok(recentBefore.every(m => [m.home, m.away].includes(CITY)));

  // A semente 4242 não classifica o City naturalmente para a Champions de 2029.
  // Para testar somente a integração do calendário nessa temporada, substitui-se
  // um participante antes da primeira rodada, sem criar ou alterar resultados.
  const edition = D.Continental.edition(s, "ucl");
  if (!edition.entrants.some(([id]) => id === CITY)) {
    edition.entrants[edition.entrants.length - 1] = [CITY, "Inglaterra"];
    delete edition.leagueSchedule;
    delete edition.knockout;
    ChampionsSeason.prepare(s, D.Continental, D.WorldClubCompetitions);
  }

  const first = D.nextCommitment(s);
  assert.ok(first && first.date >= s.day, "Central ficou sem compromisso em 2029");
  assert.ok([first.home, first.away].includes(CITY));

  const observations = new Set();
  for (let i = 0; i < 125; i++) {
    const next = D.nextCommitment(s);
    assert.ok(next && next.date >= s.day, `compromisso ausente ou vencido no dia ${s.day}`);
    observations.add(next.competitionId);
    s.board = 100;
    D.advance(s, 1);
  }

  assert.ok(observations.has("gf_fc27_premier_league"), "Premier não apareceu na agenda de 2029");
  assert.ok(observations.has("ucl"), "Champions não apareceu na agenda de 2029");

  const seasonMatches = s.matches.filter(m => m.season === 2029 && [m.home, m.away].includes(CITY));
  assert.ok(seasonMatches.some(m => m.competitionId === "gf_fc27_premier_league"));
  assert.ok(seasonMatches.some(m => m.competitionId === "ucl"));
  const keys = seasonMatches.map(m => [m.season, m.competitionId, m.date, m.round, m.home, m.away].join("|"));
  assert.equal(new Set(keys).size, keys.length, "agenda de 2029 gerou duplicidades");
});
