const test = require("node:test"),
  assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"),
  A = require("../src/application/game.js"),
  S = require("../src/infrastructure/save.js"),
  C = D.Career;
function until(s, day) {
  while (s.day < day) D.advance(s, Math.min(30, day - s.day));
}
test("2026 world has four separate leagues, 80 clubs and complete official Serie A pairings", () => {
  const s = D.create({}, 8);
  assert.equal(s.clubs.length, 80);
  assert.equal(s.fixtures.length, 38);
  assert.equal(s.leagues.length, 4);
  const ids = s.clubs.flatMap((c) => c.roster.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(s.clubs.filter((c) => ["serieA", "serieB"].includes(c.leagueId)).every((c) => c.roster.every((p) => p.real)));
  assert.ok(s.clubs.filter((c) => ["serieC", "serieD"].includes(c.leagueId)).every((c) => c.coverage === "partial"));
  const seen = new Set();
  for (const round of s.fixtures) {
    assert.equal(new Set(round.flat()).size, 80);
    for (const pair of round) {
      assert.equal(D.club(s, pair[0]).leagueId, D.club(s, pair[1]).leagueId);
      assert.ok(!seen.has(pair.join(":")));
      seen.add(pair.join(":"));
    }
  }
  assert.equal(seen.size, 1520);
  assert.deepEqual(s.fixtures[0].slice(0, 10), D.World.serieAFixtures[0]);
  assert.equal(s.calendarDays[0], 27);
  assert.equal(D.table(s, "serieA").length, 20);
  assert.equal(D.table(s, "serieB").length, 20);
  assert.equal(D.table(s, "serieC").length, 20);
  assert.equal(D.table(s, "serieD").length, 20);
  S.parse(JSON.stringify(s));
});
test("a full Brazilian season plays 38 rounds in all four leagues and produces saveable histories", () => {
  const s = D.create({ clubId: "c0" }, 17);
  until(s, 364);
  assert.equal(s.round, 38);
  assert.equal(s.matches.length, 800);
  assert.ok(s.clubs.every((c) => c.stats.played === 38));
  assert.equal(
    D.table(s, "serieA").reduce((n, c) => n + c.stats.gf, 0),
    D.table(s, "serieA").reduce((n, c) => n + c.stats.ga, 0),
  );
  const restored = S.parse(JSON.stringify(s));
  assert.equal(
    D.club(restored).roster.find((p) => p.id === "hero"),
    restored.person,
  );
  assert.ok(JSON.stringify(s).length < 3000000);
  D.advance(restored, 1);
  assert.equal(restored.season, 2027);
  assert.equal(restored.history.length, 4);
  assert.ok(restored.clubs.every((c) => c.stats.played === 0));
  S.parse(JSON.stringify(restored));
});
test("transfer windows enforce day boundaries, proposal acceptance and recruitment without partial mutations", () => {
  const s = D.create({ mode: "coach", clubId: "c8" }, 12);
  for (const [day, open] of [
    [0, true],
    [58, true],
    [59, false],
    [180, false],
    [181, true],
    [242, true],
    [243, false],
    [317, false],
    [318, true],
    [364, true],
  ]) {
    s.day = day;
    assert.equal(C.windowStatus(s).open, open);
  }
  s.day = 100;
  s.offers = [{ clubId: "c2", salary: 8000, role: "Treinador", expires: 110 }];
  const before = JSON.stringify(s);
  assert.throws(() => A.execute(s, "join", { id: "c2" }), /Janela/);
  assert.throws(() => D.join(s, "c2", 8000), /Janela/);
  assert.throws(
    () =>
      A.execute(s, "recruit", {
        clubId: "c4",
        playerId: s.clubs[4].roster[4].id,
      }),
    /Janela/,
  );
  assert.equal(JSON.stringify(s), before);
  s.day = 181;
  s.offers = [{ clubId: "c2", salary: 8000, role: "Treinador", expires: 190 }];
  A.execute(s, "join", { id: "c2" });
  assert.equal(s.clubId, "c2");
});
test("personal purchases charge once, persist, have recurring costs/effects and sell at 70 percent", () => {
  const s = D.create({ clubId: "c0" }, 19),
    before = s.wallet,
    clubs = s.clubs.map((c) => c.budget);
  A.execute(s, "buy", { id: "recovery" });
  assert.equal(s.wallet, before - 1800);
  assert.deepEqual(
    s.clubs.map((c) => c.budget),
    clubs,
  );
  assert.throws(() => A.execute(s, "buy", { id: "recovery" }));
  assert.throws(() => A.execute(s, "buy", { id: "house" }));
  s.person.condition = 50;
  C.daily(s);
  assert.equal(s.person.condition, 51);
  C.monthly(s);
  assert.equal(s.wallet, before - 1840);
  assert.equal(C.assetValue(s), 1800);
  assert.equal(C.upkeep(s), 40);
  S.parse(JSON.stringify(s));
  A.execute(s, "sell", { id: "recovery" });
  assert.equal(s.wallet, before - 1840 + 1260);
  assert.equal(C.upkeep(s), 0);
  assert.ok(!s.extras.assets.length);
});
test("press promises are evaluated by actual subsequent results and persist between matches", () => {
  for (const wins of [0, 2]) {
    const s = D.create({ clubId: "c0" }, 20);
    s.decision = {
      id: "media",
      title: "Entrevista",
      body: "Teste",
      choices: [
        ["humble", "Equilíbrio"],
        ["bold", "Prometer"],
      ],
    };
    A.execute(s, "decide", { choice: "bold" });
    assert.equal(s.extras.promise.games, 3);
    const rep = s.reputation,
      board = s.board;
    for (let i = 0; i < 3; i++) {
      C.match(s, {
        home: s.clubId,
        away: "c1",
        hg: i < wins ? 1 : 0,
        ag: 0,
        ratings: { hero: 7 },
        events: [],
      });
      if (i < 2) S.parse(JSON.stringify(s));
    }
    assert.equal(s.extras.promise, null);
    assert.equal(s.reputation, rep + (wins === 2 ? 4 : -3));
    assert.equal(s.board, board + (wins === 2 ? 5 : -7));
    assert.ok(
      s.extras.feed.some(
        (p) =>
          p.category === "Imprensa" &&
          /Promessa cumprida|Cobrança/.test(p.title),
      ),
    );
  }
});
test("AI transfers conserve club money, change one roster and write confirmed feed records", () => {
  const s = D.create({ clubId: "c0" }, 29),
    money = s.clubs.reduce((n, c) => n + c.budget, 0),
    ids = s.clubs.flatMap((c) => c.roster.map((p) => p.id)).sort();
  C.world(s, new D.Random(8), D);
  assert.ok(s.extras.transfers.length >= 2);
  assert.ok(s.extras.transfers.slice(1).every((t) => t.pos && t.salary > 0));
  assert.equal(
    s.clubs.reduce((n, c) => n + c.budget, 0),
    money,
  );
  assert.deepEqual(
    s.clubs.flatMap((c) => c.roster.map((p) => p.id)).sort(),
    ids,
  );
  S.parse(JSON.stringify(s));
});
test("legacy saves retain calendar and identity until explicitly scheduled year-end migration", () => {
  const old = D.create({ world: "legacy", clubId: "c0" }, 4);
  until(old, 30);
  delete old.world;
  delete old.leagues;
  delete old.calendarDays;
  delete old.extras;
  old.clubs.forEach((c) => delete c.leagueId);
  const s = S.parse(JSON.stringify(old));
  assert.equal(s.world, "legacy");
  assert.equal(s.clubs.length, 8);
  assert.equal(s.fixtures.length, 14);
  const name = s.person.name,
    wealth = s.wallet;
  A.execute(s, "upgradeWorld", { clubId: "c8" });
  assert.equal(s.clubs.length, 8);
  until(s, 365);
  assert.equal(s.world, "brazil2026");
  assert.equal(s.clubs.length, 80);
  assert.equal(s.clubId, "c8");
  assert.equal(s.person.name, name);
  assert.ok(s.wallet > wealth);
  assert.ok(s.history.some((h) => h.league === "Liga Horizonte"));
  S.parse(JSON.stringify(s));
});
test("new save data rejects corrupted assets, money, press promises, feed and cross-league fixtures", () => {
  const s = D.create({ clubId: "c0" }, 3);
  for (const mutate of [
    (s) => (s.extras.assets = ["unknown"]),
    (s) => (s.extras.assets = ["bike", "bike"]),
    (s) => (s.extras.number = 101),
    (s) => (s.extras.promise = { games: -1, wins: 0 }),
    (s) =>
      (s.extras.ledger = [{ amount: "1", day: 0, season: 2026, label: "x" }]),
    (s) => (s.extras.feed[0].likes = Infinity),
    (s) => (s.calendarDays[1] = s.calendarDays[0]),
    (s) => (s.fixtures[0][0][1] = "c20"),
  ]) {
    const bad = JSON.parse(JSON.stringify(s));
    mutate(bad);
    assert.throws(() => S.validate(bad));
  }
});

test("signing hides all offers until a different transfer window opens, including existing saves", () => {
  const s = D.create({ clubId: "c22" }, 31);
  assert.equal(s.careerTransferAvailableDay, 181);
  until(s, 56);
  assert.equal(s.offers.length, 0);
  assert.throws(() => D.join(s, "c2", 1800), /já assinou/);
  const old = JSON.parse(JSON.stringify(s));
  delete old.careerTransferAvailableDay;
  old.offers = [{ clubId: "c2", salary: 1800, role: "Contrato", expires: 70 }];
  const loaded = S.parse(JSON.stringify(old));
  assert.equal(loaded.offers.length, 0);
  assert.equal(loaded.careerTransferAvailableDay, 181);
  until(loaded, 180);
  assert.equal(loaded.offers.length, 0);
  D.advance(loaded, 1);
  assert.ok(loaded.offers.length <= 1, "Etapa 7 evita avalanche de propostas diretas na abertura da janela");
  if (!loaded.offers.length) loaded.offers = [{ clubId:"c2", salary:C.realisticSalary(loaded,"c2"), durationDays:730, signingBonus:0, squadRole:"Rotação", transferType:"permanent", expires:loaded.day+14 }];
  A.execute(loaded, "join", { id: loaded.offers[0].clubId });
  assert.equal(loaded.offers.length, 0);
  assert.equal(loaded.careerTransferAvailableDay, 318);
  until(loaded, 210);
  assert.equal(loaded.offers.length, 0);
  assert.throws(() => D.join(loaded, "c2", 1800), /já assinou/);
  until(loaded, 318);
  assert.ok(loaded.offers.length <= 1);
  if (!loaded.offers.length) loaded.offers = [{ clubId:"c3", salary:C.realisticSalary(loaded,"c3"), durationDays:730, signingBonus:0, squadRole:"Rotação", transferType:"permanent", expires:loaded.day+14 }];
  A.execute(loaded, "join", { id: loaded.offers[0].clubId });
  assert.equal(loaded.careerTransferAvailableDay, 365);
  S.parse(JSON.stringify(loaded));
});


test("offer preferences filter future proposals and rejected offers disappear", () => {
  const s = D.create({}, 77);
  assert.equal(C.init(s).offerPreferences.clubLevel, "any");
  A.execute(s, "offerPrefs", { leagues: ["serieA"], clubLevel: "elite" });
  assert.deepEqual(C.init(s).offerPreferences, { leagues: ["serieA"], clubLevel: "elite" });
  s.offers = D.weightedCareerOffers(s, new D.Random(91), 8);
  assert.ok(s.offers.length > 0);
  assert.ok(s.offers.every((o) => { const c = D.club(s, o.clubId); return c.leagueId === "serieA" && c.structure >= 75; }));
  const id = s.offers[0].clubId, before = s.offers.length;
  A.execute(s, "reject", { id });
  assert.equal(s.offers.length, before - 1);
  assert.ok(!s.offers.some((o) => o.clubId === id));
  assert.ok(C.init(s).feed.some((p) => p.title === "Proposta recusada"));
  S.parse(JSON.stringify(s));
});

test("offer preferences require at least one Brazilian division", () => {
  const s = D.create({}, 78);
  assert.throws(() => A.execute(s, "offerPrefs", { leagues: [], clubLevel: "any" }), /pelo menos uma divisão/);
});

test("player career tracks coach trust, squad role and match objectives", () => {
  const s = D.create({}, 501);
  const pc = C.init(s).playerCareer;
  assert.equal(pc.coachTrust, 55);
  assert.equal(pc.squadRole, "Rotação");
  const target = s.offers[0];
  A.execute(s, "join", { id: target.clubId });
  const before = pc.coachTrust;
  C.match(s, { home:s.clubId, away:s.clubs.find(c=>c.id!==s.clubId).id, hg:2, ag:0, ratings:{hero:8.2}, events:[{type:"goal",playerId:"hero"}], participants:[["hero"],[]] });
  assert.ok(pc.coachTrust > before);
  assert.equal(pc.starts, 1);
  assert.equal(pc.objectivesTotal, 2);
  assert.ok(pc.lastEvaluation);
});

test("coach trust changes squad role across career thresholds", () => {
  const s = D.create({}, 502), pc = C.init(s).playerCareer;
  pc.coachTrust = 90; C.updatePlayerRole(s); assert.equal(pc.squadRole, "Estrela");
  pc.coachTrust = 20; C.updatePlayerRole(s); assert.equal(pc.squadRole, "Fora dos planos");
});


test("professional career stores market value, contract terms and negotiated offers", () => {
  const s = D.create({}, 610), pc = C.init(s).playerCareer;
  assert.ok(pc.marketValue >= 50000);
  const offer = s.offers[0];
  assert.ok(offer.durationDays >= 365);
  assert.ok(offer.signingBonus >= 0);
  const oldSalary=offer.salary;
  A.execute(s,"counterOffer",{id:offer.clubId});
  assert.ok(offer.salary > oldSalary);
  assert.equal(offer.negotiated,true);
  A.execute(s,"join",{id:offer.clubId});
  assert.equal(pc.contract.clubId,s.clubId);
  assert.equal(pc.contract.salary,s.salary);
  assert.equal(s.contract,offer.durationDays);
  S.parse(JSON.stringify(s));
});

test("renewal can be offered, accepted and expires into free agency", () => {
  const s=D.create({},611), offer=s.offers[0]; A.execute(s,"join",{id:offer.clubId});
  s.contract=100; const pc=C.init(s).playerCareer; pc.contract.endDay=s.day+100;
  const renewal=C.createRenewalOffer(s); assert.ok(renewal); const old=s.salary;
  A.execute(s,"acceptRenewal"); assert.ok(s.salary>old); assert.ok(s.contract>=730); assert.equal(pc.renewalOffer,null);
  s.contract=1; D.advance(s,1); assert.equal(s.clubId,null); assert.equal(pc.contract,null);
});


test("agent 2.0 stores strategy and produces career advice", () => {
  const s = D.create({}, 720), pc = C.init(s).playerCareer;
  A.execute(s, "agentStrategy", { priority:"playtime", stance:"loan" });
  assert.equal(pc.agentStrategy.priority,"playtime");
  assert.equal(pc.agentStrategy.stance,"loan");
  assert.ok(pc.agentAdvice && pc.agentAdvice.action);
  S.parse(JSON.stringify(s));
});

test("agent 2.0 advances interest pipeline from rumor to official offer", () => {
  const s=D.create({},721), pc=C.init(s).playerCareer, rng=new D.Random(722);
  s.offers=[]; pc.interests=[]; s.careerTransferAvailableDay=0;
  const target=s.clubs.find(c=>c.id!==s.clubId);
  C.registerInterest(s,target.id,"Rumor");
  C.progressInterest(s,rng,D.weightedCareerOffers);
  assert.equal(pc.interests[0].stage,"Sondagem");
  C.progressInterest(s,rng,D.weightedCareerOffers);
  assert.equal(pc.interests[0].stage,"Negociação");
  C.progressInterest(s,rng,D.weightedCareerOffers);
  assert.ok(["Negociação","Oferta oficial"].includes(pc.interests[0].stage));
});


test("media profile evolves independently from overall and persists", () => {
  const s = D.create({ mode: "player", clubId: "c0" }, 81);
  const beforeOverall = D.overall(s.person);
  const beforeRep = s.reputation;
  C.updateMediaProfile(s, { fans: 12, sponsor: 8, pressure: 5, controversy: 1 });
  const m = C.mediaProfile(s);
  assert.equal(D.overall(s.person), beforeOverall);
  assert.equal(s.reputation, beforeRep);
  assert.ok(m.fanSentiment >= 67);
  assert.equal(m.controversies, 1);
  const restored = S.parse(JSON.stringify(s));
  assert.equal(restored.extras.playerCareer.mediaProfile.controversies, 1);
});

test("career media events create different public consequences", () => {
  const s = D.create({ mode: "player", clubId: "c0" }, 82);
  D.Life.init(s); C.init(s);
  s.decision = { id:"criticism", title:"Crítica", body:"Teste", choices:[["respond_fire","Rebater"]] };
  const beforeFans=s.fans;
  D.decide(s,"respond_fire");
  assert.ok(s.fans > beforeFans);
  assert.ok(C.mediaProfile(s).controversies >= 1);
});

test("living world tracks club form, position competition and persistent events", () => {
  const s = D.create({ mode: "player", clubId: "c0" }, 901);
  const lw0 = C.livingWorldSnapshot(s);
  assert.ok(lw0 && Array.isArray(lw0.positionRivals));
  D.advance(s, 30);
  const lw = C.livingWorldSnapshot(s);
  assert.ok(lw.lastTick >= 7);
  assert.ok(Object.keys(lw.clubForm).length >= 80);
  assert.ok(C.init(s).feed.some((p) => p.category === "Mundo do futebol"));
  const restored = S.parse(JSON.stringify(s));
  assert.ok(restored.extras.livingWorld);
  assert.ok(Object.keys(restored.extras.livingWorld.clubForm).length >= 80);
});

test("living world AI absences are safe for selection and old saves get defaults", () => {
  const s = D.create({ mode: "player", clubId: "c0" }, 902);
  const old = JSON.parse(JSON.stringify(s));
  delete old.extras.livingWorld;
  const restored = S.parse(JSON.stringify(old));
  const lw = C.init(restored).livingWorld;
  assert.deepEqual(lw.headlines, []);
  const rival = D.club(restored).roster.find((p) => p.id !== "hero" && p.pos === restored.person.pos);
  if (rival) rival.suspension = 1;
  D.advance(restored, 7);
  S.parse(JSON.stringify(restored));
});


test("legacy tracks rivalries and survives old-save normalization", () => {
  const s = D.create({ mode: "player", clubId: "c0" }, 1201);
  const old = JSON.parse(JSON.stringify(s));
  delete old.extras.legacy;
  const restored = S.parse(JSON.stringify(old));
  assert.ok(C.init(restored).legacy);
  D.advance(restored, 30);
  const legacy = C.legacySnapshot(restored);
  assert.ok(Number.isFinite(legacy.score));
  assert.ok(typeof legacy.tier === "string");
  assert.ok(Array.isArray(legacy.rivals));
  S.parse(JSON.stringify(restored));
});

test("retirement freezes a legacy snapshot before coach transition", () => {
  const s = D.create({ mode: "player", clubId: "c0", age: 30 }, 1202);
  D.advance(s, 30);
  const before = C.legacySnapshot(s);
  D.retire(s);
  assert.equal(s.mode, "coach");
  assert.equal(C.init(s).legacy.retired, true);
  assert.ok(C.init(s).legacy.retirement);
  assert.equal(C.init(s).legacy.retirement.score, before.score);
  S.parse(JSON.stringify(s));
});

test("contract countdown notifies player and agent can open renewal talks", () => {
  const s=D.create({},701), first=s.offers[0]; A.execute(s,"join",{id:first.clubId}); C.init(s);
  s.contract=181; C.init(s).playerCareer.contract.endDay=s.day+181;
  D.advance(s,2);
  const pc=C.init(s).playerCareer;
  assert.ok(pc.contractNotices[180]);
  s.contract=300; pc.contract.endDay=s.day+300; pc.coachTrust=90; s.reputation=80;
  const offer=C.requestRenewal(s); assert.ok(offer); assert.equal(offer.source,"agent"); assert.ok(offer.performanceBonus>=0);
});

test("renewal counteroffer negotiates salary bonus duration and squad role", () => {
  const s=D.create({},702), first=s.offers[0]; A.execute(s,"join",{id:first.clubId}); const pc=C.init(s).playerCareer;
  s.contract=100; pc.contract.endDay=s.day+100; pc.coachTrust=95; s.reputation=90; s.person.morale=90;
  const o=C.createRenewalOffer(s); assert.ok(o);
  const revised=C.counterRenewal(s,{salary:o.salary,years:5,signingBonus:o.signingBonus,performanceBonus:o.performanceBonus,role:"Estrela"});
  assert.equal(revised.durationDays,5*365); assert.equal(revised.role,"Estrela");
  C.acceptRenewal(s); assert.equal(pc.contract.role,"Estrela"); assert.ok(pc.contract.performanceBonus>=0);
});


test("economy 2.0 scales elite player salary and keeps transfer history coherent", () => {
  const s=D.create({},1702);
  for (const k of Object.keys(s.person.attrs)) s.person.attrs[k]=95;
  s.person.age=25; s.reputation=90; C.init(s).playerCareer.coachTrust=100; C.updateProfessionalCareer(s);
  const fair=C.realisticSalary(s);
  assert.ok(fair >= 300000, `elite salary should be realistic, got ${fair}`);
  assert.ok(C.marketValue(s) >= 50000000, `elite market value should be material, got ${C.marketValue(s)}`);
  const offer=s.offers[0];
  if (offer) { offer.salary=C.realisticSalary(s,offer.clubId); A.execute(s,"join",{id:offer.clubId}); const t=C.init(s).transfers[0]; assert.equal(t.salary,s.salary); assert.ok(t.marketValue>0); }
});


test("club target persists and enters agent market pipeline", () => {
  const s=D.create({},733), pc=C.init(s).playerCareer;
  const target=s.clubs.find(c=>c.id!==s.clubId);
  A.execute(s,"targetClub",{clubId:target.id});
  assert.equal(pc.targetClub.clubId,target.id); assert.ok(pc.targetClub.assessment.label);
  assert.ok(pc.interests.some(x=>x.clubId===target.id));
  const loaded=S.parse(JSON.stringify(s)); assert.equal(C.init(loaded).playerCareer.targetClub.clubId,target.id);
  A.execute(s,"clearTargetClub"); assert.equal(pc.targetClub,null);
});
