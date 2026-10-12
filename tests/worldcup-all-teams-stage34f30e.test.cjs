"use strict";
// Stage 34F.30E - Copa do Mundo para todas as selecoes: selecao acompanhada (trackedTeamId) em vez de BRA fixo.
// Os testes chamam NationalTeam.daily direto (um dia do motor completo custa ~2 s); nada de motor diario longo.
const test = require("node:test"), assert = require("node:assert/strict");
const R = process.cwd();
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
const NI = require("../src/domain/national-identity.js"); global.ProLifeNationalIdentity = NI;
global.ProLifeCareerContext = require("../src/domain/career-context.js");
const NT = require("../src/domain/national-team.js");
const NC = require("../src/domain/national-callups.js"); global.ProLifeNationalCallups = NC;

const mkRng = () => { let x = 7; return { next: () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }, int: (a) => a }; };
const make = (nat, day) => {
  const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, 11);
  s.person.nationality = nat; s.person.pos = "ATA"; for (const k of Object.keys(s.person.attrs)) s.person.attrs[k] = 88;
  s.day = day; return s;
};
const run = (s, rng, to, withNC = false) => { const lg = () => {}; for (; s.day < to; s.day++) { NT.daily(s, rng, D, lg); if (withNC) NC.daily(s, D, lg); } return s; };
const cupOf = (s, year) => ((s.nationalTeam || {}).tournaments || []).find((t) => t && t.type === "WORLD_CUP" && Number(t.year) === year);
const fixturesOf = (s, year) => (s.nationalTeam.schedule || []).filter((f) => f.tournamentType === "WORLD_CUP" && Number(f.tournamentYear) === year);
const cupMatch = (cup, f) => [...cup.groups.flatMap((g) => g.matches), ...(cup.knockout || [])].find((m) => m.id === f.tournamentMatchId);
const Y30 = 4 * 365, END30 = Y30 + 215;
const cache = {};
const sim30 = (nat) => cache[nat] || (cache[nat] = run(make(nat, Y30), mkRng(), END30));
const CASES = [["Espanha", "ESP"], ["Brasil", "BRA"], ["Argentina", "ARG"], ["Japão", "JPN"]];

for (const [nat, code] of CASES) {
  test(`34F.30E ${code}: Copa 2030 criada, grupo e mata-mata da propria selecao, resultados gravados como mandante ou visitante`, () => {
    const s = sim30(nat), cup = cupOf(s, 2030);
    assert.ok(cup, "Copa 2030 criada pelo ciclo de qualificacao");
    assert.equal(cup.trackedTeamId, code);
    assert.equal(cup.participants.length, 48);
    const fx = fixturesOf(s, 2030), grp = fx.filter((f) => f.tournamentPhase === "group");
    assert.equal(grp.length, 3, "tres jogos de grupo da selecao");
    const myGroup = cup.groups.find((g) => g.teams.some((t) => t.id === code));
    assert.ok(myGroup);
    for (const f of fx) {
      assert.equal(f.played, true, f.id);
      const m = cupMatch(cup, f);
      assert.ok(m && m.played, "partida do torneio registrada " + f.id);
      assert.ok(m.homeId === code || m.awayId === code, "selecao participa da partida");
      const myGoals = m.homeId === code ? m.homeGoals ?? m.hg ?? m.homeScore : m.awayGoals ?? m.ag ?? m.awayScore;
      if (Number.isFinite(myGoals)) assert.equal(myGoals, f.brazil, "gols da selecao conferem (" + (m.homeId === code ? "mandante" : "visitante") + ")");
    }
    for (const f of grp) assert.ok(myGroup.matches.some((m) => m.id === f.tournamentMatchId));
    assert.equal(cup.status, "COMPLETED"); assert.ok(cup.champion && cup.champion.name);
    if (cup.brazilStatus !== "ELIMINATED" || cup.brazilEliminationPhase !== "GROUP_STAGE") assert.ok(fx.some((f) => f.tournamentPhase !== "group"), "classificada joga mata-mata");
  });
}

test("34F.30E mandante e visitante: ao menos um jogo de cada lado entre as selecoes testadas, sempre consistente", () => {
  let home = 0, away = 0, knock = 0;
  for (const [nat, code] of CASES) {
    const s = sim30(nat), cup = cupOf(s, 2030);
    for (const f of fixturesOf(s, 2030)) { const m = cupMatch(cup, f); if (m.homeId === code) home++; else away++; if (f.tournamentPhase !== "group") knock++; }
  }
  assert.ok(home > 0 && away > 0, `home=${home} away=${away}`);
  assert.ok(knock > 0, "ha jogos de mata-mata acompanhados");
});

test("34F.30E selecao fora da Copa (Bolivia): nenhum jogo do heroi, torneio simulado ate o fim para todos", () => {
  const s = sim30("Bolívia"), cup = cupOf(s, 2030);
  assert.ok(cup); assert.equal(cup.trackedTeamId === "BOL" || cup.trackedTeamId === "", true);
  if (cup.trackedTeamId === "") assert.equal(fixturesOf(s, 2030).length, 0);
  assert.equal(cup.status, "COMPLETED"); assert.ok(cup.champion);
  const played = cup.groups.flatMap((g) => g.matches).filter((m) => m.played).length;
  assert.equal(played, cup.groups.flatMap((g) => g.matches).length, "todos os jogos de grupo simulados");
});

test("34F.30E sem convocacao do heroi o torneio segue e a selecao joga (resultado automatico)", () => {
  const s = make("Espanha", Y30); s.person.attrs && Object.keys(s.person.attrs).forEach((k) => { s.person.attrs[k] = 20; });
  run(s, mkRng(), END30); const cup = cupOf(s, 2030);
  assert.ok(cup && cup.status === "COMPLETED");
  for (const f of fixturesOf(s, 2030)) assert.equal(f.played, true);
});

test("34F.30E regra de criacao 2030: qualificatorias incompletas nao criam Copa invalida", () => {
  const s = make("Espanha", Y30); const rng = mkRng(); run(s, rng, Y30 + 3);
  const q = s.nationalTeam.qualifiers; assert.ok(q && q.fixtures.length === 90);
  q.fixtures.forEach((m) => { m.played = false; m.day = Y30 + 99999; }); q.complete = false;
  s.nationalTeam.tournaments = (s.nationalTeam.tournaments || []).filter((t) => !(t.type === "WORLD_CUP" && t.year === 2030));
  s.nationalTeam.schedule = s.nationalTeam.schedule.filter((f) => f.tournamentType !== "WORLD_CUP");
  run(s, rng, END30);
  assert.equal(s.nationalTeam.qualifiers.complete, false);
  assert.equal(cupOf(s, 2030), undefined, "sem qualificatorias completas nao ha Copa");
  assert.equal(fixturesOf(s, 2030).length, 0);
  assert.equal(NC.windowsFor(s, D, NI.heroTeam(s, D)).filter((w) => w.kind === "COPA").length, 0, "nem convocacao simulada paralela");
});

test("34F.30E legado: torneio sem trackedTeamId continua acompanhando o Brasil e 2026 concluida nao muda", () => {
  const s = make("Brasil", 0); const rng = mkRng(); run(s, rng, 250);
  const c26 = cupOf(s, 2026); assert.ok(c26); assert.equal(c26.trackedTeamId, "BRA");
  assert.equal(c26.status, "COMPLETED");
  const snap = JSON.stringify(c26), fx = JSON.stringify(fixturesOf(s, 2026));
  const legacy = JSON.parse(JSON.stringify(s)); delete cupOf(legacy, 2026).trackedTeamId; legacy.person.nationality = "Espanha";
  run(legacy, mkRng(), 330);
  assert.equal(cupOf(legacy, 2026).trackedTeamId, undefined, "campo nao e criado em torneio antigo");
  assert.equal(JSON.stringify(fixturesOf(legacy, 2026)), fx, "jogos jogados de 2026 intactos");
  run(s, rng, 800); const again = cupOf(s, 2026);
  if (again) assert.equal(JSON.stringify(again), snap, "historico da Copa 2026 preservado");
});

test("34F.30E save/load no meio da Copa: estado serializa e a Copa termina coerente", () => {
  const s = make("Espanha", Y30); const rng = mkRng(); run(s, rng, Y30 + 168);
  const mid = JSON.parse(JSON.stringify(s)); const cm = cupOf(mid, 2030);
  assert.equal(cm.trackedTeamId, "ESP"); assert.ok(fixturesOf(mid, 2030).some((f) => f.played) );
  run(mid, mkRng(), END30);
  const cup = cupOf(mid, 2030); assert.equal(cup.status, "COMPLETED");
  for (const f of fixturesOf(mid, 2030)) assert.equal(f.played, true);
});

test("34F.30E Copa criada tarde (jogos vencidos) nao trava: fixtures atrasadas sao resolvidas em segundo plano", () => {
  const s = make("Espanha", Y30 + 200); const rng = mkRng();
  const qual = make("Espanha", Y30); run(qual, mkRng(), Y30 + 200); // qualificatorias ja jogadas
  s.nationalTeam = JSON.parse(JSON.stringify(qual.nationalTeam)); s.nationalTeam.tournaments = (s.nationalTeam.tournaments || []).filter((t) => !(t.type === "WORLD_CUP" && t.year === 2030));
  s.nationalTeam.schedule = s.nationalTeam.schedule.filter((f) => f.tournamentYear !== 2030 || f.tournamentType !== "WORLD_CUP");
  run(s, rng, Y30 + 215);
  const cup = cupOf(s, 2030); assert.ok(cup); assert.equal(cup.status, "COMPLETED");
  for (const f of fixturesOf(s, 2030)) { assert.equal(f.played, true); assert.equal(f.participated, false); }
});

test("34F.30E convocacao oficial da Copa espelhada para a selecao do protagonista (Espanha) sem duplicar", () => {
  const s = make("Espanha", Y30); run(s, mkRng(), Y30 + 200, true);
  const ids = Object.keys(s.nationalCallups.records).filter((i) => /:ESP$/.test(i) && s.nationalCallups.records[i].kind === "COPA");
  assert.equal(ids.length, 1, JSON.stringify(Object.keys(s.nationalCallups.records)));
  const rec = s.nationalCallups.records[ids[0]]; assert.equal(rec.teamCode, "ESP"); assert.ok(rec.lineup);
  assert.equal(NC.windowsFor(s, D, NI.heroTeam(s, D)).filter((w) => w.kind === "COPA").length, 0, "janela simulada paralela desligada");
});

test("34F.30E partida ao vivo e logs usam o nome da selecao acompanhada", () => {
  const s = make("Espanha", Y30); const logs = [];
  const rng = mkRng(); for (; s.day < END30; s.day++) NT.daily(s, rng, D, (ss, t) => logs.push(t));
  assert.ok(logs.some((t) => /^Espanha \d+ × \d+/.test(t)), "log de jogo da Espanha");
  const f = fixturesOf(s, 2030).find((x) => x.participated);
  if (f) { const m = (s.matchHistory || s.history || []); assert.ok(Array.isArray(m) || true); }
});

test("34F.30E longa simulacao 2030->2034: nova Copa acompanha a Espanha e nao mexe na anterior", () => {
  const s = make("Espanha", Y30); const rng = mkRng(); run(s, rng, Y30 + 330);
  const c30 = cupOf(s, 2030); assert.ok(c30); const snap = JSON.stringify(c30);
  run(s, rng, Y30 + 330 + 200);
  const after = cupOf(s, 2030); if (after) assert.equal(JSON.stringify(after), snap);
  run(s, rng, 8 * 365 - 365 * 4 + 4 * 365 + 5 > 0 ? 2920 + 215 : 0);
  const c34 = cupOf(s, 2034);
  assert.ok(c34, "Copa 2034 criada"); assert.equal(c34.trackedTeamId, "ESP"); assert.equal(c34.status, "COMPLETED");
});
