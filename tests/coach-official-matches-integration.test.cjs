"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");

const CC = D.CoachCareer;

function createCoach() {
  const s = D.create({
    mode: "coach",
    clubId: "c0",
    catalogVersion: "fc27_v1"
  }, 5);

  CC.init(s, D);
  return s;
}

test("integracao: partidas reais chegam ao historico oficial", () => {
  const s = createCoach();
  const clubId = s.clubId;
  const season = s.season;

  for (let i = 0; i < 100; i++) {
    D.advance(s, 1);
  }

  const played = (s.matches || []).filter(m =>
    Number(m.season) === Number(season) &&
    (m.home === clubId || m.away === clubId) &&
    Number.isFinite(Number(m.hg)) &&
    Number.isFinite(Number(m.ag)) &&
    (m.competitionId || m.leagueId)
  );

  const stints = s.coachCareer.stints.filter(x =>
    x.clubId === clubId && Number(x.fromSeason) <= Number(season)
  );

  const recorded = stints.reduce((sum, stint) => {
    const ledger = stint.officialMatches?.[String(season)];
    return sum + Object.keys(ledger?.seen || {}).length;
  }, 0);

  console.log("Partidas reais do clube:", played.length);
  console.log("Partidas no acumulador:", recorded);
  console.log(
    "Competicoes:",
    [...new Set(played.map(m => m.competitionId || m.leagueId))]
  );

  assert.ok(played.length > 0, "Nenhuma partida real encontrada");
  assert.ok(recorded >= played.length,
    "O acumulador perdeu partidas registradas pelo motor");

  const before = JSON.stringify(s.coachCareer);
  const restored = JSON.parse(JSON.stringify(s));

  assert.equal(JSON.stringify(restored.coachCareer), before);
  assert.equal(
    JSON.stringify(restored.coachCareer.stints),
    JSON.stringify(s.coachCareer.stints)
  );

  console.log("[OK] Integracao real e serializacao");
});

test("medicao: crescimento de 1000 partidas no acumulador", () => {
  const s = createCoach();
  const clubId = s.clubId;
  const opponent = s.clubs.find(c => c.id !== clubId).id;

  const baseline = Buffer.byteLength(JSON.stringify(s));

  for (let i = 0; i < 1000; i++) {
    const inserted = CC.recordOfficialMatch(s, {
      season: s.season,
      date: i + 1,
      home: clubId,
      away: opponent,
      hg: i % 4,
      ag: (i + 1) % 3,
      competitionId: "synthetic_official_cup"
    });

    assert.equal(inserted, true);
  }

  const after = Buffer.byteLength(JSON.stringify(s));
  const delta = after - baseline;

  console.log("Save original (bytes):", baseline);
  console.log("Save com 1000 registros (bytes):", after);
  console.log("Crescimento (bytes):", delta);
  console.log("Media por partida (bytes):", (delta / 1000).toFixed(2));

  assert.ok(delta > 0);
  assert.ok(Number.isFinite(delta));

  const ledger = s.coachCareer.stints[0]
    .officialMatches[String(s.season)];

  assert.equal(Object.keys(ledger.seen).length, 1000);
  assert.equal(
    Object.values(ledger.byCompetition)
      .reduce((sum, r) => sum + r.w + r.d + r.l, 0),
    1000
  );

  console.log("[OK] Medicao de crescimento concluida");
});