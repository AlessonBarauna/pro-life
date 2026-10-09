const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), S = require("../src/infrastructure/save.js");
const U = D.World2, CORE = ["pace", "finish", "pass", "defense", "strength", "stamina"];

function mk(pos, age, ovr, pot, id = "t1") {
  const a = {}; for (const k of CORE) a[k] = ovr; D.Training.expand(a);
  return { id, name: "Teste", age, pos, attrs: a, potential: pot, condition: 100, morale: 70, discipline: 70, injury: 0, goals: 0, minutes: 0, nationality: "Brasil", contract: { end: 2027, salary: 5000 } };
}
function meanDelta(make, perf, trials = 80, level = 70) {
  let sum = 0;
  for (let i = 0; i < trials; i++) { const p = make(); const before = D.overall(p); U.develop(p, { __maxMinutes: 3000 }, perf, level, new D.Random(900 + i), 2027); sum += D.overall(p) - before; }
  return sum / trials;
}
const REG = { apps: 34, minutes: 3000, rating: 7.2, goals: 0, assists: 0 }, BENCH = { apps: 2, minutes: 120, rating: 0, goals: 0, assists: 0 };
const coach = (seed = 21) => D.create({ mode: "coach" }, seed);
function season(s) { const y = s.season; while (s.season === y) D.advance(s, 1); }
const players = (s) => s.clubs.flatMap((c) => c.roster);

test("Etapa 15: cenário A/B — jovem com minutos evolui bem mais que jovem sem minutos (sem crescimento infinito)", () => {
  const a = meanDelta(() => mk("MEI", 18, 67, 86), REG), b = meanDelta(() => mk("MEI", 18, 67, 86), BENCH);
  assert.ok(a > b + 0.8, `${a} vs ${b}`);
  assert.ok(a >= 1.5 && a <= 7, `crescimento plausível (${a})`);
  const capped = meanDelta(() => mk("MEI", 18, 80, 82), REG);
  assert.ok(capped < a, "perto do potencial cresce menos");
});

test("Etapa 15: cenários C/D/E — auge estável, veterano declina, goleiro veterano resiste mais; físico cai antes do técnico", () => {
  const peak = meanDelta(() => mk("ATA", 27, 85, 85), REG), vet = meanDelta(() => mk("ATA", 34, 84, 84), REG);
  const gk = meanDelta(() => mk("GOL", 35, 85, 85), REG), line35 = meanDelta(() => mk("DEF", 35, 85, 85), REG);
  assert.ok(Math.abs(peak) <= 1, `auge ${peak}`);
  assert.ok(vet <= -1, `veterano ${vet}`);
  assert.ok(gk > line35 + 0.7, `goleiro ${gk} x linha ${line35}`);
  let phys = 0, tech = 0;
  for (let i = 0; i < 60; i++) { const p = mk("ATA", 34, 84, 84); U.develop(p, { __maxMinutes: 3000 }, REG, 70, new D.Random(50 + i), 2027); phys += 168 - p.attrs.pace - p.attrs.stamina; tech += 168 - p.attrs.finish - p.attrs.pass; }
  assert.ok(phys > tech, `físico ${phys} técnico ${tech}`);
  assert.ok(U.declineRate(34, "GOL") < U.declineRate(34, "DEF"));
});

test("Etapa 15: aposentadoria considera posição, idade e situação; limite máximo evita atuação aos 70 anos", () => {
  const ctx = { level: 70, ovr: 70, starter: true, freeSeasons: 0 };
  const line = (age) => U.retirementChance(mk("DEF", age, 70, 70, "r" + age), ctx), keeper = (age) => U.retirementChance(mk("GOL", age, 70, 70, "r" + age), ctx);
  assert.equal(line(28), 0);
  assert.ok(line(34) < line(37) && line(37) < line(40));
  assert.ok(keeper(38) < line(38), "goleiro continua mais tempo");
  assert.equal(line(42), 1); assert.equal(keeper(45), 1);
  assert.ok(U.retirementChance(mk("DEF", 36, 60, 60, "x"), { level: 75, ovr: 55, starter: false, freeSeasons: 2 }) > line(36));
  assert.ok(line(36) < 0.5, "35+ não aposenta obrigatoriamente");
  assert.equal(line(36), U.retirementChance(mk("DEF", 36, 70, 70, "r36"), ctx), "determinístico");
});

test("Etapa 15: virada de temporada envelhece uma vez, aposenta, gera jovens e é idempotente", () => {
  const s = coach(31), before = new Map(players(s).map((p) => [p.id, p.age]));
  const star = s.clubs[0].roster.find((p) => p.pos === "ATA"); star.age = 43;
  const oldGk = s.clubs[0].roster.find((p) => p.pos === "GOL"); oldGk.age = 36;
  s.season++;
  const a = U.rollSeason(s, D), snap = U.snapshotHash(s, D), again = U.rollSeason(s, D);
  assert.equal(again, a); assert.equal(U.snapshotHash(s, D), snap, "segunda chamada não repete fases");
  assert.ok(!players(s).some((p) => p.id === star.id) && s.universe.retiredIds[star.id] !== undefined, "cenário H: aposentado sai do elenco");
  assert.ok(!s.universe.free.some((p) => p.id === star.id));
  assert.ok(!U.audit(s, D).retiredActive.length);
  const kept = players(s).filter((p) => before.has(p.id) && !p.generated);
  assert.ok(kept.every((p) => p.age === before.get(p.id) + 1), "idade +1 exatamente");
  assert.ok(s.universe.generatedCount > 0 && s.universe.retiredCount > 0);
  assert.ok(s.clubs.every((c) => c.roster.some((p) => p.pos === "GOL")), "nenhum clube sem goleiro");
  const au = U.audit(s, D); assert.deepEqual(au.dupIds, []); assert.deepEqual(au.badAge, []);
});

test("Etapa 15: cenário H — aposentado também não aparece na Seleção nem nos jogadores livres", () => {
  const s = D.create({ mode: "player", pos: "ATA", origin: "academy", creation: {} }, 8);

  /*
    O universo global agora pode ocupar vagas da Seleção.
    Este teste precisa controlar explicitamente o jogador
    local que será aposentado, sem assumir que qualquer
    convocado pertence a s.clubs.
  */
  const star =
    s.clubs
      .flatMap((c) => c.roster)
      .find(
        (p) =>
          p.id !== "hero" &&
          p.pos === "MEI" &&
          ["brasil", "brazil"].includes(
            String(p.nationality || "Brasil").toLowerCase()
          )
      );

  assert.ok(star, "jogador local brasileiro MEI para o cenario H");

  star.nationality = "Brasil";
  star.condition = 100;
  star.morale = 100;
  star.injury = 0;
  star.suspension = 0;

  for (const key of [
    "pace",
    "finish",
    "pass",
    "defense",
    "strength",
    "stamina"
  ]) {
    star.attrs[key] = 100;
  }

  assert.ok(
    D.NationalTeam
      .buildSquad(s, D)
      .some((x) => x.id === star.id),
    "jogador local forte deve entrar na Selecao antes de aposentar"
  );

  star.age = 44;

  s.season++;

  U.rollSeason(s, D);

  assert.ok(
    !D.NationalTeam
      .buildSquad(s, D)
      .some((x) => x.id === star.id),
    "aposentado nao pode continuar na Selecao"
  );

  assert.ok(
    !(s.universe?.free || [])
      .some((x) => x.id === star.id),
    "aposentado nao pode aparecer entre jogadores livres"
  );

  s.nationalTeam = {
    calledUp: true,
    squad: [
      {
        id: star.id,
        pos: star.pos,
        name: star.name,
        overall: 80,
        score: 80,
        club: "x",
        age: 44
      },
      {
        id: "hero",
        pos: "ATA",
        name: "H",
        overall: 60,
        score: 60
      }
    ]
  };

  assert.ok(
    !D.NationalTeam
      .positionCompetition(s, D)
      .some((x) => x.id === star.id),
    "aposentado persistido em elenco legado deve ser ignorado"
  );
});

test("Etapa 15: geração de jovens — IDs únicos, idades de entrada, distribuição de talento e nomes variados", () => {
  const s = coach(41), rng = new D.Random(5), used = new Set(), seen = new Set(), tiers = {}, ages = [];
  let maxYoung = 0, br = 0;
  for (let i = 0; i < 3000; i++) {
    const y = U.buildYouth(s, D, rng, ["GOL", "DEF", "MEI", "ATA"][i % 4], 72, s.clubs[0], used);
    assert.ok(!seen.has(y.id)); seen.add(y.id);
    assert.ok(y.age >= 16 && y.age <= 20 && y.attrs.pace >= 15 && y.potential >= D.overall(y));
    tiers[y.talent] = (tiers[y.talent] || 0) + 1; if (y.age <= 18) maxYoung = Math.max(maxYoung, D.overall(y)); if (y.nationality === "Brasil") br++; ages.push(y.age);
  }
  assert.ok(maxYoung <= 72, `nenhum OVR 95 aos 16 (max ${maxYoung})`);
  assert.ok(tiers.comum > 1800 && tiers.comum > tiers.bom && tiers.bom > (tiers.grande || 0), JSON.stringify(tiers));
  assert.ok((tiers.geracional || 0) <= 30, "geracional é raríssimo");
  assert.ok(used.size > 2800, "nomes variados, sem 50 clones");
  assert.ok(br / 3000 > 0.85 && br / 3000 < 0.95);
  assert.match([...seen][0], /^g\d{4}_\d{5}$/);
});

test("Etapa 15: squadNeeds identifica posição sem jogadores (cenário G: clube sem ATA)", () => {
  const s = coach(51), c = s.clubs[10];
  c.roster = c.roster.filter((p) => p.pos !== "ATA");
  const n = U.squadNeeds(s, c, D);
  assert.equal(n.priority, "ATA"); assert.ok(n.byPos.ATA.need >= 0.9 && n.byPos.ATA.deficit === U.TARGET.ATA);
  const none = U.squadNeeds(s, s.clubs[11], D); assert.ok(none.byPos[none.priority].need < n.byPos.ATA.need);
  c.roster = c.roster.filter((p) => p.pos !== "GOL");
  assert.equal(U.squadNeeds(s, c, D).byPos.GOL.deficit, 2);
});

test("Etapa 15: mercado da IA — clube sem atacante contrata atacante; janela, repetição e plausibilidade", () => {
  const s = coach(52), c = s.clubs.find((x) => x.leagueId === "serieB");
  c.roster = c.roster.filter((p) => p.pos !== "ATA");
  s.day = 181; const w = U.WINDOWS[1];
  for (const k of ["g:a", "g:b", "g:c"]) { U.marketPass(s, D, "2026:w1:" + k, false, w); if (c.roster.some((p) => p.pos === "ATA")) break; }
  assert.ok(c.roster.some((p) => p.pos === "ATA"), "priorizou atacante");
  const row = s.universe.transfers.find((t) => t.toId === c.id);
  assert.ok(row && row.pos === "ATA");
  const ids = players(s).map((p) => p.id).concat(s.universe.free.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length, "ninguém em dois lugares");
  for (const t of s.universe.transfers.filter((x) => x.type === "transfer")) {
    const to = s.clubs.find((x) => x.id === t.toId);
    assert.ok(!(t.ovr >= 85 && to.structure < 60), "estrela não vai a clube minúsculo");
    assert.ok(!(t.ovr < 62 && to.structure >= 80), "OVR 60 não vai ao gigante sem motivo");
  }
});

test("Etapa 15: mesma janela não repete e mesmo jogador não troca duas vezes; só ocorre dentro das janelas", () => {
  const s = coach(53);
  for (let d = 0; d < 330; d++) D.advance(s, 1);
  const moves = s.universe.transfers.filter((t) => t.type !== "release");
  assert.ok(moves.length > 15, "o mercado da IA está vivo");
  assert.ok(moves.every((t) => U.windowAt(t.day)), "somente em janelas");
  const per = new Map(); for (const t of moves) per.set(`${t.season}|${t.window}|${t.id}`, (per.get(`${t.season}|${t.window}|${t.id}`) || 0) + 1);
  assert.ok([...per.values()].every((n) => n === 1), "sem transferência duplicada");
  const count = s.universe.transferCount; assert.equal(U.daily(s, D), null); assert.equal(s.universe.transferCount, count);
  assert.ok(!s.universe.transfers.some((t) => t.day % 365 > 58 && t.day % 365 < 181 && t.type !== "release"), "nada no meio das janelas");
});

test("Etapa 15: contratos terminando — renova, libera ou aposenta; livres voltam ao mercado", () => {
  const s = coach(54), list = players(s).filter((p) => p.age < 30 && p.age > 21).slice(0, 80);
  list.forEach((p) => (p.contract = { end: 2026, salary: 4000 }));
  s.season++; U.rollSeason(s, D);
  let renewed = 0, free = 0;
  for (const p of list) {
    const inClub = players(s).find((x) => x.id === p.id), inFree = s.universe.free.find((x) => x.id === p.id);
    assert.ok(!(inClub && inFree));
    if (inClub) { renewed++; assert.ok(inClub.contract.end >= s.season); } else if (inFree) free++;
  }
  assert.ok(renewed > 40 && free > 0, `renovados ${renewed}, livres ${free}`);
  assert.ok(s.universe.transfers.some((t) => t.type === "release" && t.window === "fim de contrato"));
  const rec = s.universe.free.filter((p) => D.overall(p) >= 70).length;
  for (let d = 0; d < 70; d++) D.advance(s, 1);
  assert.ok(s.universe.free.filter((p) => D.overall(p) >= 70).length <= rec, "bons livres são contratados nas janelas");
});

test("Etapa 15: estatísticas da passagem são preservadas na transferência e prestígio muda devagar", () => {
  const s = coach(55), c = s.clubs[3], p = c.roster[5];
  s.statistics = s.statistics || { players: {} }; s.statistics.players = { [p.id]: { appearances: 10, goals: 4, assists: 2, ratingTotal: 70 } };
  U.recordStint(s, p, c);
  assert.equal(p.history[0].club, c.name); assert.equal(p.history[0].apps, 10); assert.equal(p.history[0].goals, 4); assert.equal(p.seasonBase.apps, 10);
  const base = Object.fromEntries(s.clubs.map((x) => [x.id, x.structure]));
  for (let i = 0; i < 3; i++) { season(s); }
  assert.ok(s.clubs.every((x) => Math.abs(x.structure - base[x.id]) <= 4 && Math.abs(x.structure - x.baseStructure) <= 8));
});

test("Etapa 15: determinismo — mesma seed, mesmas ações ⇒ mesmo universo", () => {
  const a = coach(61), b = coach(61), c = coach(62);
  season(a); season(a); season(b); season(b); season(c); season(c);
  assert.equal(U.snapshotHash(a, D), U.snapshotHash(b, D));
  assert.deepEqual(a.universe.transfers.slice(0, 20), b.universe.transfers.slice(0, 20));
  assert.notEqual(U.snapshotHash(a, D), U.snapshotHash(c, D));
});

test("Etapa 15: save/load periódico produz o mesmo universo da simulação contínua", () => {
  const a = coach(71);
  let b = coach(71);
  for (let y = 0; y < 2; y++) season(a);
  const target = a.day;
  while (b.day < target) { for (let d = 0; d < 110 && b.day < target; d++) D.advance(b, 1); b = S.parse(JSON.stringify(b)); }
  assert.equal(b.day, a.day);
  assert.equal(U.snapshotHash(b, D), U.snapshotHash(a, D));
  assert.equal(b.universe.retiredCount, a.universe.retiredCount);
});

test("Etapa 15: save antigo (sem universo) abre sem envelhecimento retroativo nem transferências retroativas", () => {
  const s = D.create({ mode: "coach" }, 9);
  for (let d = 0; d < 200; d++) D.advance(s, 1);
  delete s.universe; for (const p of players(s)) { delete p.contract; delete p.history; delete p.lastMove; }
  const ages = new Map(players(s).map((p) => [p.id, p.age]));
  const restored = S.parse(JSON.stringify(s));
  assert.equal(restored.universe, undefined);
  U.init(restored, D);
  assert.equal(restored.universe.transfers.length, 0);
  assert.ok(players(restored).every((p) => p.id === "hero" || (p.contract && p.age === ages.get(p.id))));
  assert.ok(restored.universe.done[`${restored.season}:w0:a`] && restored.universe.done[`${restored.season}:w1:a`] && !restored.universe.done[`${restored.season}:w2:a`]);
  D.advance(restored, 1);
  assert.equal(restored.universe.transferCount, 0, "janela já aberta não é reprocessada");
  const reparsed = S.parse(JSON.stringify(restored)); assert.deepEqual(reparsed.universe.done, restored.universe.done);
  assert.throws(() => S.parse(JSON.stringify({ ...restored, universe: { seed: "x", done: {}, transfers: [], retirements: [], free: [] } })));
});

test("Etapa 15: carreira de jogador — herói continua único no elenco e a referência é preservada após o mercado/virada", () => {
  const d = D.create({ mode: "player", pos: "ATA", origin: "academy", creation: {} }, 77);
  const s = D.create({ mode: "player", pos: "ATA", origin: "academy", creation: {}, clubId: d.offers[0].clubId }, 77);
  const ref = s.person, ageBefore = s.person.age;
  s.day = 181; U.marketPass(s, D, "2026:w1:t", false, U.WINDOWS[1]);
  s.season++; s.person.age++; U.rollSeason(s, D);
  const holders = s.clubs.filter((c) => c.roster.includes(ref));
  assert.equal(holders.length, 1); assert.equal(s.clubs.flatMap((c) => c.roster).filter((p) => p.id === "hero").length, 1);
  assert.equal(s.person, ref); assert.equal(s.person.age, ageBefore + 1, "protagonista não é envelhecido duas vezes nem aposentado");
  assert.ok(D.weightedCareerOffers(s, new D.Random(3), 3).length >= 1, "mercado do protagonista continua funcionando");
});

test("Etapa 15: notícias apenas das movimentações relevantes e histórico persistido", () => {
  const s = coach(81); for (let d = 0; d < 200; d++) D.advance(s, 1);
  const articles = (s.extras.communications?.articles || []).filter((a) => /muda de clube|aposentadoria/.test(a.title));
  const relevant = s.universe.transfers.filter((t) => t.type !== "release" && (t.ovr >= 76 || t.fee >= 8000000)).length;
  assert.ok(articles.length <= Math.max(5, relevant), "não publica cada negociação");
  assert.ok(s.universe.transfers.length > articles.length);
  const r = S.parse(JSON.stringify(s)); assert.equal(r.universe.transfers.length, s.universe.transfers.length);
});

test("Etapa 15: desempenho — virada de temporada do mundo vivo é rápida", () => {
  const s = coach(91); s.season++; const t = Date.now(); U.rollSeason(s, D); assert.ok(Date.now() - t < 4000, `rollSeason levou ${Date.now() - t}ms`);
  const t2 = Date.now(); U.marketPass(s, D, "2027:w0:p", false, U.WINDOWS[0]); assert.ok(Date.now() - t2 < 2500);
});
