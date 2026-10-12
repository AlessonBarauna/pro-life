"use strict";
// Correcao do legado: contador de premios pessoais (sem premios de outros atletas) e nome da selecao pela nacionalidade.
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
const NI = require("../src/domain/national-identity.js"); global.ProLifeNationalIdentity = NI;
const CC = require("../src/domain/career-context.js"); global.ProLifeCareerContext = CC;
const Career = require("../src/domain/career.js");
const make = (nat = "Brasil") => { const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, 5); s.person.nationality = nat; return s; };
const aw = (s, over = {}) => Object.assign({ season: 2026, leagueId: "L1", competitionId: "L1", league: "Liga 1", name: "Artilheiro", winnerId: "hero", winner: s.person.name, winnerClub: "Clube X" }, over);
const store = (s, list) => { s.statistics = s.statistics || { players: {}, awards: [], seasons: [] }; s.statistics.awards = list; };

test("jogador sem premio: contador 0", () => {
  const s = make(); store(s, []); const l = Career.legacySnapshot(s);
  assert.equal(l.awards, 0); assert.deepEqual(l.trophies, []);
});
test("158 premios de outros atletas nao contam", () => {
  const s = make(); store(s, Array.from({ length: 158 }, (_, i) => aw(s, { season: 2026 + (i % 9), name: "P" + i, winnerId: "p" + i, winner: "Outro " + i })));
  assert.equal(Career.legacySnapshot(s).awards, 0);
});
test("outro atleta homonimo com id diferente nao conta, premio sem id so conta pelo nome do heroi", () => {
  const s = make(); store(s, [aw(s, { winnerId: "fc27_p_9", winner: s.person.name }), aw(s, { name: "Craque", winnerId: undefined })]);
  assert.equal(Career.legacySnapshot(s).awards, 1);
});
test("tres premios validos entre premios de outros: contador 3 e pontos de legado coerentes", () => {
  const s = make(); const mine = [aw(s, { name: "A" }), aw(s, { name: "B", season: 2027 }), aw(s, { name: "C", leagueId: "L2", competitionId: "L2", league: "Liga 2" })];
  store(s, [...mine, ...Array.from({ length: 40 }, (_, i) => aw(s, { name: "Z" + i, winnerId: "o" + i, winner: "O" + i }))]);
  const l = Career.legacySnapshot(s); assert.equal(l.awards, 3);
  store(s, []); const base = Career.legacySnapshot(s).score; store(s, mine); assert.equal(Career.legacySnapshot(s).score - base, 3 * 35);
});
test("premiacao duplicada conta uma vez", () => {
  const s = make(); const a = aw(s); store(s, [a, { ...a }, { ...a }]);
  assert.equal(Career.legacySnapshot(s).awards, 1);
});
test("premiacao ainda em disputa, indicacao ou ranking nao contam", () => {
  const s = make(); store(s, [aw(s, { name: "P1", live: true }), aw(s, { name: "P2", status: "em disputa" }), aw(s, { name: "P3", pending: true }), aw(s, { name: "P4", nominee: true }), aw(s, { name: "P5", ranking: true }), aw(s, { name: "Real" })]);
  const l = Career.legacySnapshot(s); assert.equal(l.awards, 1); assert.equal(l.trophies[0].title, "Real");
});
test("premios do arquivo mundial (playerId hero) entram uma vez e outros jogadores nao", () => {
  const s = make(); store(s, []);
  global.ProLifeWorldStats = { heroAwards: () => [{ season: 2027, leagueId: "ENG1", league: "Premier", label: "Melhor jogador", club: "Y", playerId: "hero" }, { season: 2027, leagueId: "ENG1", league: "Premier", label: "Melhor jogador", club: "Y", playerId: "hero" }, { season: 2027, leagueId: "ENG1", league: "Premier", label: "Artilheiro", club: "Y", playerId: "p9" }] };
  try { const l = Career.legacySnapshot(s); assert.equal(l.awards, 1); assert.equal(l.trophies[0].competition, "Premier"); assert.equal(l.trophies[0].club, "Y"); }
  finally { delete global.ProLifeWorldStats; }
});
test("save/load preserva a contagem e nao altera os registros", () => {
  const s = make(); store(s, [aw(s, { name: "A" }), aw(s, { name: "B" }), aw(s, { name: "O", winnerId: "x", winner: "X" })]);
  const before = JSON.stringify(s.statistics.awards), n = Career.legacySnapshot(s).awards;
  const back = JSON.parse(JSON.stringify(s));
  assert.equal(Career.legacySnapshot(back).awards, n); assert.equal(n, 2); assert.equal(JSON.stringify(s.statistics.awards), before);
});
test("nacionalidade espanhola -> Selecao Espanhola; brasileira -> Selecao Brasileira", () => {
  assert.equal(CC.teamLabel(NI.heroTeam(make("Espanha"), D)), "Seleção Espanhola");
  assert.equal(CC.teamLabel(NI.heroTeam(make("Brasil"), D)), "Seleção Brasileira");
});
test("legacy() em app.js usa o resolvedor, tem Premios clicavel e sem texto fixo de selecao", () => {
  const src = fs.readFileSync(require("path").join(__dirname, "../src/ui/app.js"), "utf8");
  const a = src.indexOf("    legacy() {"), body = src.slice(a, src.indexOf("\n", src.indexOf("LEGADO DA CARREIRA", a)));
  assert.ok(!/SELEÇÃO BRASILEIRA/.test(body)); assert.ok(/teamLabel/.test(body)); assert.ok(/data-legacy-awards/.test(body)); assert.ok(/l\.trophies/.test(body));
  assert.ok(/data-legacy-awards\]/.test(src), "handler de clique");
});
