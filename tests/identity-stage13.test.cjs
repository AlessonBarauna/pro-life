const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), A = require("../src/application/game.js"), S = require("../src/infrastructure/save.js");
const I = D.Identity;

function hero(pos = "ATA", age = 20, base = 70, seed = 1300) {
  const s = D.create({ mode: "player", pos, age, points: {} }, seed);
  D.movePlayerToClub(s, s.clubs[40].id);
  s.person.age = age;
  for (const k of Object.keys(s.person.attrs)) s.person.attrs[k] = base;
  s.trainingPlan.identity = null;
  I.init(s);
  return s;
}
let counter = 0;
function match(s, o = {}) {
  counter++;
  const events = [];
  for (let i = 0; i < (o.g || 0); i++) events.push({ type: "goal", playerId: "hero" });
  for (let i = 0; i < (o.a || 0); i++) events.push({ type: "goal", playerId: "mate", assistPlayerId: "hero" });
  return { season: s.season, date: s.day + counter, competitionId: "stage13", round: counter, homeId: s.clubId, awayId: "rival", participants: [["hero"], []], ratings: { hero: o.r || 7 }, playerStats: { hero: { minutes: 90, tackles: o.tk || 0, saves: o.sv || 0 } }, offensiveStats: { hero: { shots: o.sh || 0, onTarget: o.ot || 0, xg: o.xg || 0 } }, events, hg: 1, ag: o.ga ?? 1 };
}
function play(s, o, n, exerciseId, sessionsPerMatch = 5) {
  const cat = exerciseId && D.Training.trainingCategories[D.Training.exercises[exerciseId].category];
  for (let i = 0; i < n; i++) {
    D.Training.matchDevelopment(s, match(s, o), D);
    if (cat) for (let j = 0; j < sessionsPerMatch; j++) I.onTraining(s, cat);
  }
}
const top = (s, filter = () => true) => I.affinities(s).filter(filter)[0].id;
const aff = (s, id) => I.affinities(s).find((a) => a.id === id).value;

test("Etapa 13: save antigo sem identidade deriva estado só de posição/atributos/estilo e sobrevive ao reload", () => {
  const s = hero("ATA");
  delete s.trainingPlan.identity;
  delete s.trainingPlan.activeSpecialization;
  const restored = S.parse(JSON.stringify(s));
  const id = I.init(restored);
  assert.equal(id.matches, 0);
  assert.deepEqual(id.history, []);
  assert.equal(id.derivedFrom, "current");
  assert.equal(restored.person.archetypeId, "finisher");
  assert.equal(restored.trainingPlan.activeSpecialization, null);
  assert.ok(I.tracked("ATA").every((a) => Number.isFinite(id.behavior[a])));
  const again = S.parse(JSON.stringify(restored));
  assert.deepEqual(I.init(again), id);
});

test("Etapa 13: ATA jovem com muitos gols fortalece Finalizador de forma determinística", () => {
  const a = hero("ATA", 18), b = hero("ATA", 18);
  const start = aff(a, "finisher");
  play(a, { g: 1, sh: 4, ot: 2, xg: 0.8, r: 7.6 }, 40, "boxFinish");
  play(b, { g: 1, sh: 4, ot: 2, xg: 0.8, r: 7.6 }, 40, "boxFinish");
  assert.ok(aff(a, "finisher") > start + 5);
  assert.equal(top(a), "finisher");
  assert.deepEqual(a.trainingPlan.identity, b.trainingPlan.identity);
  assert.deepEqual(a.person.attrs, b.person.attrs);
  assert.equal(a.trainingPlan.developmentXp, b.trainingPlan.developmentXp);
});

test("Etapa 13: MEI criador, volante defensivo e goleiro evoluem nos perfis coerentes", () => {
  const mei = hero("MEI", 21);
  play(mei, { a: 1, r: 7.4 }, 45, "quickPass");
  assert.equal(top(mei, (x) => x.compatible), "maestro");
  const vol = hero("MEI", 24);
  play(vol, { tk: 5, r: 7, ga: 0 }, 45, "defensiveDuel");
  assert.ok(["engine", "builder", "anchor"].includes(vol.person.archetypeId));
  assert.ok(["wall", "engine", "builder", "anchor"].includes(top(vol)));
  const gk = hero("GOL", 22);
  const before = aff(gk, "guardian");
  play(gk, { sv: 5, r: 7.2, ga: 0 }, 30, "goalkeeper");
  assert.ok(aff(gk, "guardian") > before);
  assert.deepEqual(I.tracked("GOL").sort(), ["guardian", "sweeper"].sort());
});

test("Etapa 13: ATA que treina passe e cria jogadas vira híbrido gradualmente", () => {
  const s = hero("ATA", 22);
  play(s, { a: 1, sh: 1, r: 7.2 }, 15, "quickPass");
  assert.equal(s.person.archetypeId, "finisher", "não muda de identidade em poucas partidas");
  play(s, { a: 1, sh: 1, r: 7.2 }, 120, "quickPass");
  const p = I.profile(s);
  assert.equal(p.secondary, "maestro");
  assert.ok(D.Training.archetypeCatalog[s.person.archetypeId].positions.includes("ATA"), "principal respeita a posição");
  const hist = s.trainingPlan.identity.history;
  assert.ok(hist.length >= 1 && hist[0].match >= 20);
  assert.equal(JSON.stringify(s.extras).split("Evolução de perfil reconhecida").length - 1, hist.length);
});

test("Etapa 13: veterano evolui atributos mais devagar que jovem com as mesmas ações", () => {
  const young = hero("ATA", 18), old = hero("ATA", 33);
  play(young, { g: 1, sh: 3, ot: 2, r: 7.5 }, 20);
  play(old, { g: 1, sh: 3, ot: 2, r: 7.5 }, 20);
  const sum = (s) => ["finish", "positioning", "composure", "powerShot"].reduce((n, k) => n + s.person.attrs[k] * 1000 + (s.trainingPlan.attributeProgress[k] || 0), 0);
  assert.ok(sum(young) > sum(old));
});

test("Etapa 13: especialização exige requisitos de domínio, desbloqueia uma vez e persiste", () => {
  const s = hero("ATA", 21);
  assert.throws(() => A.execute(s, "specialization", { id: "matador" }), /Requisito pendente/);
  assert.equal(I.tree(s)[0].specializations.find((x) => x.id === "matador").state, "BLOQUEADA");
  for (const k of ["finish", "composure", "positioning", "powerShot", "heading"]) s.person.attrs[k] = 84;
  D.Training.addDevelopmentXp(s, 18 * 8);
  play(s, { g: 1, sh: 4, ot: 2, xg: 0.9, r: 7.8 }, 20, "boxFinish");
  const career = D.Statistics.heroDashboard(s).career;
  if (career.goals < 15) { const st = D.Statistics.init(s).root.players.hero; st.goals = 20; st.appearances = 25; }
  play(s, { g: 1, sh: 4, ot: 2, r: 7.8 }, 2);
  const req = I.requirements(s, "matador");
  assert.equal(req.met, true, req.reason);
  assert.equal(I.tree(s)[0].specializations.find((x) => x.id === "matador").state, "DISPONÍVEL");
  play(s, { g: 1, r: 7.8 }, 5);
  const notices = () => JSON.stringify(s.extras).split("Matador (Finalizador) já pode").length - 1;
  assert.equal(notices(), 1, "aviso de disponibilidade não duplica");
  const points = s.trainingPlan.specializationPoints;
  A.execute(s, "specialization", { id: "matador" });
  assert.equal(s.trainingPlan.specializationPoints, points - 1);
  assert.equal(s.trainingPlan.activeSpecialization, "matador");
  A.execute(s, "specialization", { id: "matador" });
  assert.equal(s.trainingPlan.specializationPoints, points - 1);
  play(s, { g: 1, r: 7.8 }, 3);
  assert.equal(notices(), 1);
  const restored = S.parse(JSON.stringify(s));
  assert.equal(restored.trainingPlan.activeSpecialization, "matador");
  assert.deepEqual(restored.trainingPlan.specializations, ["matador"]);
  assert.equal(I.tree(restored)[0].specializations.find((x) => x.id === "matador").state, "ATIVA");
  assert.deepEqual(I.init(restored), I.init(s));
});

test("Etapa 13: arquétipos respeitam posição e especialização ativa tem efeito moderado", () => {
  const gk = hero("GOL", 25);
  assert.equal(gk.person.archetypeId, "guardian");
  assert.throws(() => D.Training.unlockSpecialization(gk, "matador"), /Requisito pendente/);
  const gkTree=I.tree(gk);
  assert.ok(
    gkTree.some((b)=>b.archetype==="guardian")
  );
  assert.ok(
    gkTree.some((b)=>b.archetype==="sweeper")
  );
  assert.ok(
    gkTree.every((b)=>
      D.Training.archetypeCatalog[b.archetype]
        ?.positions.includes("GOL")
    )
  );;
  gk.person.archetypeId = "finisher"; D.Training.init(gk);
  assert.equal(gk.person.archetypeId, "guardian");
  assert.throws(() => A.execute(gk, "activateSpecialization", { id: "reflexKeeper" }), /Desbloqueie/);

  const a = hero("ATA", 22), b = hero("ATA", 22);
  a.trainingPlan.specializations = ["matador"]; a.trainingPlan.activeSpecialization = "matador";
  for (let i = 0; i < 6; i++) { D.Training.progressAttribute(a, "finish", 30, D); D.Training.progressAttribute(b, "finish", 30, D); }
  const total = (s) => s.person.attrs.finish * 1000 + s.trainingPlan.attributeProgress.finish;
  assert.ok(total(a) > total(b));
  assert.ok(a.person.attrs.finish - b.person.attrs.finish <= 2, "sem bônus instantâneo de atributo");
  const m = { goals: 1, assists: 0, minutes: 90, rating: 7.5 };
  assert.ok(Math.abs(I.matchXpBonus(a, m, 10) - 0.6) < 1e-9);
  assert.equal(I.matchXpBonus(b, m, 10), 0);
});

test("Etapa 13: integrações leves com mercado, seleção e patrocínio ficam limitadas", () => {
  const s = hero("ATA", 23);
  play(s, { g: 1, sh: 3, ot: 2, r: 7.6 }, 30);
  for (const c of s.clubs) { const f = I.styleFit(s, c); assert.ok(f >= 0 && f <= 1.5); }
  assert.ok(I.tacticalFit(s) >= 0 && I.tacticalFit(s) <= 1);
  assert.ok(I.commercialAppeal(s) >= 0 && I.commercialAppeal(s) <= 2.5);
  const coach = D.create({ mode: "coach" }, 77);
  assert.equal(I.init(coach), null);
  assert.equal(I.styleFit(coach, coach.clubs[0]), 0);
});
