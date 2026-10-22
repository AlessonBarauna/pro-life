"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const K = require("../src/domain/champions-knockout.js");
const Home = require("../src/ui/home-dashboard.js");

const CITY = "gf_fc27_10";

function coach(seed = 4242) {
  const s = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, seed);
  s.clubId = null;
  D.join(s, CITY, 90000);
  assert.equal(s.clubId, CITY, "Manchester City não foi vinculado ao treinador");
  return s;
}

function advanceTo(s, day) {
  assert.ok(day >= s.day, `avanço inválido: ${s.day} -> ${day}`);
  while (day > s.day) D.advance(s, Math.min(30, day - s.day));
}

function officialRecords(s, fixture) {
  return (s.matches || []).filter(m =>
    m.competitionId === "ucl" &&
    m.home === fixture.homeId &&
    m.away === fixture.awayId &&
    Number(m.round) === Number(fixture.pair + 1) &&
    Number(m.date) === Number(fixture.day)
  );
}

test("31016G treinador disputa mata-mata da Champions no fluxo interativo oficial", () => {
  const s = coach();
  const ed = D.Continental.edition(s, "ucl");
  assert.ok(ed.entrants.some(([id]) => id === CITY), "Manchester City não está inscrito");

  const lastLeagueDay = Math.max(...ed.leagueSchedule.matches.map(m => m.day));
  advanceTo(s, lastLeagueDay);
  assert.ok(ed.leagueSchedule.matches.every(m => m.played), "fase de liga incompleta");

  const ranked = K.rank(ed).find(r => r.id === CITY);
  assert.ok(ranked && ranked.position <= 24, `Manchester City eliminado na fase de liga (${ranked?.position || "?"}º)`);

  let fixture = K.nextFixture(s, ed, CITY);
  while (!fixture && ed.knockout?.status !== "completed" && s.day < 330) {
    D.advance(s, 1);
    fixture = K.nextFixture(s, ed, CITY);
  }
  assert.ok(fixture, "nenhuma partida eliminatória encontrada para o Manchester City");

  advanceTo(s, fixture.day - 1);
  const next = D.nextCommitment(s);
  assert.ok(next, "Central não encontrou o compromisso eliminatório");
  assert.equal(next.competitionId, "ucl");
  assert.deepEqual([next.home, next.away, next.date], [fixture.homeId, fixture.awayId, fixture.day]);

  const prepared = D.prepareCoachWorldFixture(s, next);
  assert.ok(prepared?.home?.roster?.length >= 11 && prepared?.away?.roster?.length >= 11,
    "elencos não foram preparados para a partida interativa");
  const controller = D.createCoachLiveController(prepared.home, prepared.away, new D.Random(s.rng), s);
  assert.ok(controller, "controlador interativo indisponível");
  controller.advanceTo(30);
  const side = s.clubId === next.home ? 0 : 1;
  assert.equal(controller.setTactic(side, "ofensivo"), true);
  const snap = controller.snapshot(side);
  const outgoing = snap.players.find(p => p.pos !== "GOL");
  const incoming = snap.bench.find(p => p.pos !== "GOL");
  const controlled = side === 0 ? prepared.home : prepared.away;
  const reservePool = controlled.roster.filter(p => !controlled.lineup.includes(p.id));
  assert.ok(outgoing && incoming,
    `substituição de linha indisponível: campo=${snap.players.length}, banco=${snap.bench.length}, ` +
    `lineup=${controlled.lineup?.length || 0}, elenco=${controlled.roster?.length || 0}, ` +
    `reservas=${reservePool.length}, lesionados=${reservePool.filter(p => p.injury).length}, ` +
    `suspensos=${reservePool.filter(p => p.suspension > 0 || p._competitionSuspended).length}, ` +
    `condição<=35=${reservePool.filter(p => Number(p.condition ?? 100) <= 35).length}`);
  assert.equal(controller.substitute(side, outgoing.id, incoming.id), true);
  controller.advanceTo(94);
  assert.equal(controller.finished, true);
  assert.ok(controller.result && Number.isInteger(controller.result.hg) && Number.isInteger(controller.result.ag));
  assert.equal(D.stageCoachLiveResult(s, next, controller), true);

  const interactiveScore = [controller.result.hg, controller.result.ag];
  D.advance(s, 1);
  assert.equal(fixture.played, true);
  assert.deepEqual([fixture.hg, fixture.ag], interactiveScore, "calendário divergiu do placar interativo");
  assert.equal(officialRecords(s, fixture).length, 1, "histórico oficial duplicado ou ausente");
  assert.deepEqual([officialRecords(s, fixture)[0].hg, officialRecords(s, fixture)[0].ag], interactiveScore);

  D.advance(s, 1);
  assert.equal(officialRecords(s, fixture).length, 1, "partida foi registrada novamente no dia seguinte");

  const stage = ed.knockout.stages.find(x => x.key === fixture.stage);
  const otherLeg = stage.matches.find(m => m.pair === fixture.pair && m.id !== fixture.id);
  if (otherLeg) advanceTo(s, otherLeg.day);

  assert.ok(stage.matches.every(m => m.played), "clubes não controlados deixaram jogos pendentes");
  assert.ok(Array.isArray(stage.winners) && stage.winners.length > 0, "classificados da fase não foram definidos");
  const heroTie = stage.matches.find(m => m.pair === fixture.pair)?.tie;
  assert.ok(heroTie?.winnerId && [fixture.homeId, fixture.awayId].includes(heroTie.winnerId));
  assert.ok(["aggregate", "extra_time", "penalties"].includes(heroTie.decidedBy));

  const nextStage = ed.knockout.stages[ed.knockout.stages.indexOf(stage) + 1];
  if (heroTie.winnerId === CITY && nextStage) {
    assert.ok(nextStage.matches.some(m => [m.homeId, m.awayId].includes(CITY)),
      "Manchester City venceu, mas não avançou à fase seguinte");
  } else if (nextStage) {
    assert.ok(!nextStage.matches.some(m => [m.homeId, m.awayId].includes(CITY)),
      "Manchester City perdeu, mas foi classificado indevidamente");
  }

  const restored = JSON.parse(JSON.stringify(s));
  const restoredFixture = D.Continental.edition(restored, "ucl", ed.season).knockout.stages
    .flatMap(st => st.matches).find(m => m.id === fixture.id);
  assert.deepEqual([restoredFixture.played, restoredFixture.hg, restoredFixture.ag],
    [true, fixture.hg, fixture.ag], "mata-mata não persistiu na serialização");
});

test("mata-mata continua direcionando o clube controlado no modo jogador", () => {
  const ed = {
    season: 2026,
    entrants: Array.from({ length: 36 }, (_, i) => [`c${i}`, `A${i}`]),
    leagueSchedule: { matches: Array.from({ length: 144 }, (_, i) => ({
      id: `l${i}`, homeId: `c${i % 36}`, awayId: `c${(i + 1) % 36}`,
      played: true, hg: 2, ag: 1
    })) }
  };
  K.initialize(ed, 0);
  const first = ed.knockout.stages[0].matches[0];
  let heroCalls = 0;
  K.daily({ mode: "player", clubId: first.homeId, day: first.day }, ed, {
    heroFixture: () => { heroCalls++; return { hg: 1, ag: 0 }; },
    otherFixture: () => ({ hg: 0, ag: 0 })
  });
  assert.equal(heroCalls, 1);
  assert.equal(first.played, true);
});

test("Premier League e Champions alternam cronologicamente e alimentam a Central", () => {
  const s = coach();
  const premierId = D.club(s).leagueId;
  const openingEdition = D.Continental.edition(s, "ucl", 2026);
  assert.ok(openingEdition?.leagueSchedule?.matches?.length, "calendario da Champions nao foi criado");
  const openingDay = Math.min(...openingEdition.leagueSchedule.matches.map(m => m.day));
  advanceTo(s, openingDay - 1);
  const observations = { premier: 0, champions: 0 };
  const observedCompetitions = new Map();

  for (let i = 0; i < 125; i++) {
    const next = D.nextCommitment(s);
    assert.ok(next && next.date >= s.day, `compromisso ausente ou vencido no dia ${s.day}`);
    observedCompetitions.set(next.competitionId, (observedCompetitions.get(next.competitionId) || 0) + 1);
    if (next.competitionId === premierId) observations.premier++;
    if (next.competitionId === "ucl") observations.champions++;
    D.advance(s, 1);
  }

  assert.ok(observations.premier > 0,
    `Premier League (${premierId}) nunca apareceu como próximo compromisso; vistos=${JSON.stringify(Object.fromEntries(observedCompetitions))}; worldMatch=${D.club(s).worldMatch}`);
  assert.ok(observations.champions > 0, "Champions nunca apareceu como próximo compromisso");

  const own = (s.matches || []).filter(m => [m.home, m.away].includes(CITY));
  const premier = own.filter(m => m.competitionId === premierId);
  const champions = own.filter(m => m.competitionId === "ucl");
  assert.ok(premier.length > 0, "resultados da Premier não foram registrados");
  assert.ok(champions.length > 0, "resultados da Champions não foram registrados");

  const keys = own.map(m => [m.season, m.competitionId, m.date, m.round, m.home, m.away].join("|"));
  assert.equal(new Set(keys).size, keys.length, "há partidas oficiais duplicadas");

  const edition = D.Continental.edition(s, "ucl", openingEdition.season);
  for (const match of champions.filter(m => m.stage === "Fase de liga")) {
    const scheduled = edition.leagueSchedule.matches.find(f =>
      f.homeId === match.home && f.awayId === match.away &&
      f.day === match.date && f.round === match.round
    );
    assert.ok(scheduled?.played, "resultado da Champions não chegou ao calendário");
    assert.deepEqual([scheduled.hg, scheduled.ag], [match.hg, match.ag]);
  }

  const recent = Home.recentEntries(s).map(x => x.match);
  assert.ok(recent.length > 0, "Central não recebeu o histórico oficial");
  assert.ok(recent.every(m => [m.home, m.away].includes(CITY)));

  const restored = JSON.parse(JSON.stringify(s));
  assert.deepEqual(
    restored.matches.filter(m => [m.home, m.away].includes(CITY))
      .map(m => [m.competitionId, m.date, m.home, m.away, m.hg, m.ag]),
    own.map(m => [m.competitionId, m.date, m.home, m.away, m.hg, m.ag]),
    "histórico integrado não persistiu na serialização"
  );
});
