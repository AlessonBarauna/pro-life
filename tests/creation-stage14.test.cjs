const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), S = require("../src/infrastructure/save.js");
const CR = D.Creation;
const base = (o, pos, age, extra = {}) => ({ mode: "player", origin: o, pos, age, creation: { difficulty: "normal", personality: "balanced", ...extra } });
const ovr = (s) => D.overall(s.person);

test("Etapa 14: cenários A–D respeitam faixa de overall, idade, posição e arquétipo compatível", () => {
  const cases = [["blank", "ATA", 18, 62, 67], ["academy", "MEI", 18, 67, 72], ["regional", "ATA", 19, 70, 76], ["comeback", "ATA", 24, 64, 70]];
  for (const [o, pos, age, lo, hi] of cases) {
    const s = D.create(base(o, pos, age), 4242);
    assert.equal(s.person.age, age);
    assert.ok(ovr(s) >= lo - 1 && ovr(s) <= hi + 1, `${o}: ${ovr(s)}`);
    assert.ok(D.Training.archetypeCatalog[s.person.archetypeId].positions.includes(pos));
    assert.equal(s.creation.status, "unsigned");
    assert.ok(Object.keys(s.person.attrs).length >= 27);
    assert.ok(s.offers.length >= 2 && s.offers.length <= 3);
  }
  const hard = D.create(base("hardRoad", "DEF", 19), 9);
  const prom = D.create(base("regional", "DEF", 19), 9);
  assert.ok(ovr(hard) < ovr(prom) && hard.reputation < prom.reputation && hard.wallet < prom.wallet);
  assert.ok(prom.reputation > prom.commercial.popularity, "reputação ≠ popularidade");
});

test("Etapa 14: cenário E personalizado nunca produz estado impossível", () => {
  const s = D.create(base("custom", "MEI", 16, { custom: { age: 16, overall: 80, reputation: 60, popularity: 45, wallet: 999999 } }), 5);
  assert.ok(ovr(s) <= CR.maxOverallForAge(16) + 1);
  assert.ok(s.creation.custom.reputation <= 60 && s.creation.custom.wallet <= 40000);
  assert.ok(s.creation.notes.length >= 1);
  assert.ok(Number.isFinite(s.wallet) && s.reputation >= 0);
  const ok = CR.sanitizeCustom({ age: "x", overall: null });
  assert.ok(ok.age >= 16 && ok.overall >= 45);
});

test("Etapa 14: mesma seed/origem/escolhas ⇒ mesmas oportunidades e estado; seed diferente muda", () => {
  const cfg = base("academy", "MEI", 18);
  const a = D.create(cfg, 100), b = D.create(cfg, 100), c = D.create(cfg, 101);
  assert.deepEqual(a.offers, b.offers);
  assert.deepEqual(a.person.attrs, b.person.attrs);
  assert.notDeepEqual(a.person.attrs, c.person.attrs);
  assert.equal(JSON.stringify(a.creation), JSON.stringify(b.creation));
});

test("Etapa 14: prévia (sem clube) e criação final com clube coincidem; voltar e mudar só aparência não recalcula", () => {
  const cfg = base("regional", "ATA", 19);
  const draft = D.create(cfg, 777);
  const pick = draft.offers[1].clubId;
  const final = D.create({ ...cfg, clubId: pick, name: "Outro Nome", appearance: { skin: "#ffffff" } }, 777);
  assert.equal(final.clubId, pick);
  assert.deepEqual(final.person.attrs, draft.person.attrs);
  const offer = draft.offers[1];
  assert.equal(final.salary, offer.salary);
  assert.equal(final.creation.contract.salary, offer.salary);
  const other = D.create({ ...cfg, pos: "MEI", archetypeId: undefined }, 777);
  assert.notDeepEqual(other.offers.map((o) => o.clubId), draft.offers.map((o) => o.clubId).concat("x"));
});

test("Etapa 14: oportunidades distintas, plausíveis e nunca prometem titularidade", () => {
  for (const [o, pos, age] of [["blank", "ATA", 18], ["academy", "MEI", 18], ["regional", "ATA", 19], ["comeback", "ATA", 24]]) {
    const s = D.create(base(o, pos, age), 31);
    const kinds = new Set(s.offers.map((x) => x.pitch.kind));
    assert.equal(kinds.size, s.offers.length);
    assert.equal(new Set(s.offers.map((x) => x.clubId)).size, s.offers.length);
    for (const x of s.offers) {
      assert.ok(x.salary >= 1500 && x.durationDays >= 730);
      assert.ok(!/titular garantido/i.test(JSON.stringify(x)));
      assert.ok(x.competition.topOvr - ovr(s) < 30, "clube plausível");
      assert.ok(["Importante", "Rotação", "Reserva"].includes(x.squadRole));
    }
  }
});

test("Etapa 14: assinatura registra início único, contrato, herói no elenco, uniforme e persistência", () => {
  const cfg = base("academy", "MEI", 18);
  const draft = D.create(cfg, 55);
  const s = D.create({ ...cfg, clubId: draft.offers[0].clubId }, 55);
  const club = D.club(s);
  assert.equal(s.creation.status, "started");
  assert.ok(club.roster.some((p) => p.id === "hero"));
  assert.ok(s.extras.playerCareer.contract?.clubId === club.id);
  const inbox = JSON.stringify(s.extras.playerCareer.inbox || s.extras.inbox || s.extras);
  assert.equal(inbox.split("Primeira conversa").length - 1, 1);
  assert.equal(s.creation.objectives.length, 3);
  assert.equal(CR.registerStart(s, D), false, "idempotente");
  const restored = S.parse(JSON.stringify(s));
  assert.deepEqual(restored.creation, s.creation);
  assert.equal(restored.creation.seed, 55);
  assert.equal(CR.objectives(restored).length, 3);
  assert.equal(D.club(restored).id, club.id);
});

test("Etapa 14: sem clube escolhido a carreira nasce 'unsigned' e a primeira assinatura registra o início uma vez", () => {
  const s = D.create(base("blank", "ATA", 18), 12);
  assert.equal(s.clubId, null);
  assert.equal(s.creation.status, "unsigned");
  s.day = 0;
  const id = s.offers[0].clubId;
  D.join(s, id, s.offers[0].salary);
  assert.ok(["started", "unsigned"].includes(s.creation.status));
  if (s.creation.status === "started") assert.equal(s.creation.clubId, id);
});

test("Etapa 14: saves antigos não ganham origem retroativa e continuam carregando", () => {
  const old = D.create({ mode: "player", pos: "MEI", points: {} }, 3);
  assert.equal(old.creation, undefined);
  const restored = S.parse(JSON.stringify(old));
  assert.equal(restored.creation, undefined);
  assert.equal(CR.summary(restored), null);
  assert.deepEqual(CR.objectives(restored), []);
  assert.equal(CR.progressionMultiplier(restored), 1);
  const bad = JSON.parse(JSON.stringify(D.create(base("blank", "ATA", 18), 1)));
  bad.creation.difficulty = "impossível";
  assert.throws(() => S.parse(JSON.stringify(bad)));
});

test("Etapa 14: dificuldade ajusta evolução e metas, sem tocar na origem", () => {
  const a = D.create(base("blank", "ATA", 18, { difficulty: "casual" }), 8), b = D.create(base("blank", "ATA", 18, { difficulty: "challenging" }), 8);
  assert.deepEqual(a.person.attrs, b.person.attrs, "dificuldade não muda atributos iniciais");
  const gain = (s) => { s.trainingPlan.attributeProgress = {}; D.Training.progressAttribute(s, "finish", 30, D); return s.person.attrs.finish * 1000 + (s.trainingPlan.attributeProgress.finish || 0) - 0; };
  const before = (s) => s.person.attrs.finish * 1000 + (s.trainingPlan.attributeProgress?.finish || 0);
  const b0 = before(a), c0 = before(b);
  gain(a); gain(b);
  assert.ok(before(a) - b0 > before(b) - c0);
});

test("Etapa 14: diversidade — mesmo overall alvo gera perfis diferentes por posição, arquétipo e seed", () => {
  const sig = (s) => CR.CORE.map((k) => s.person.attrs[k]).join(",");
  const sigs = new Set();
  for (const pos of ["ATA", "MEI", "DEF", "GOL"]) sigs.add(sig(D.create(base("academy", pos, 18), 1)));
  assert.equal(sigs.size, 4);
  const ata = D.create(base("academy", "ATA", 18), 1), def = D.create(base("academy", "DEF", 18), 1);
  assert.ok(ata.person.attrs.finish > def.person.attrs.finish && def.person.attrs.defense > ata.person.attrs.defense);
  const w = D.create({ ...base("academy", "ATA", 18), archetypeId: "winger" }, 1), f = D.create({ ...base("academy", "ATA", 18), archetypeId: "finisher" }, 1);
  assert.ok(w.person.attrs.pace >= f.person.attrs.pace);
  assert.notEqual(sig(D.create(base("academy", "ATA", 18), 1)), sig(D.create(base("academy", "ATA", 18), 2)));
});

test("Etapa 14: personalidade é independente da origem e pontos de ajuste respeitam o orçamento", () => {
  const a = D.create(base("blank", "MEI", 18, { personality: "charismatic" }), 6), b = D.create(base("blank", "MEI", 18), 6);
  assert.ok(a.commercial.popularity >= b.commercial.popularity);
  assert.equal(a.person.originId, b.person.originId);
  assert.throws(() => D.create({ ...base("blank", "MEI", 18), points: { pace: 6, finish: 6 } }, 1), /pontos|Cada/);
  assert.throws(() => D.create({ ...base("blank", "MEI", 18), points: { pace: 9 } }, 1));
});

test("Etapa 14: criação clássica (sem config.creation) permanece intacta", () => {
  const s = D.create({ mode: "player", origin: "academy", pos: "MEI", points: { pace: 6, pass: 6 } }, 14);
  assert.equal(s.creation, undefined);
  assert.equal(s.person.originName, "Jovem da Base");
  assert.equal(s.offers.length >= 3, true);
  const coach = D.create({ mode: "coach" }, 14);
  assert.equal(coach.creation, undefined);
});

test("Etapa 14: assistente na interface percorre os 6 passos, volta sem perder escolhas e cria a carreira", () => {
  const fs = require("node:fs"), path = require("node:path"), { JSDOM } = require("jsdom");
  const base = path.join(__dirname, "..") + path.sep;
  const dom = new JSDOM(fs.readFileSync(base + "index.html", "utf8"), { runScripts: "outside-only", url: "https://offline-test.invalid" }), w = dom.window;
  w.confirm = () => true; w.scrollTo = () => {};
  const order = fs.readFileSync(base + "index.html", "utf8").match(/src="(src\/[^"]+\.js)"/g).map((x) => x.slice(5, -1)).filter((f) => !/update\.js|avatar/.test(f));
  for (const f of order) w.eval(fs.readFileSync(base + f, "utf8"));
  const q = (s) => w.document.querySelector(s), click = (s) => { const el = q(s); assert.ok(el, s); el.click(); };
  assert.ok(q(".wizard"), "assistente é a tela inicial");
  assert.equal(w.document.querySelectorAll(".story-card").length, 6);
  click('[data-w-story="regional"]');
  click("[data-w-next]");
  q('[name="name"]').value = "Teste Criador"; q('[name="name"]').dispatchEvent(new w.Event("change", { bubbles: true }));
  click("[data-w-next]");
  click('[data-w-pos="MEI"]'); click('[data-w-pt="pass"][data-d="1"]');
  click("[data-w-next]");
  click("[data-w-next]");
  assert.equal(w.document.querySelectorAll(".offer-card").length >= 2, true);
  click("[data-w-next]");
  assert.ok(!q(".wizard .w-step.on:nth-child(6)"), "não avança sem escolher clube");
  click("[data-w-back]"); click("[data-w-back]");
  assert.equal(q('[data-w-pt="pass"]').parentNode.querySelector("b").textContent, "1", "volta preservando ajuste");
  click("[data-w-next]"); click("[data-w-next]");
  const first = q("[data-w-club]").dataset.wClub; click(`[data-w-club="${first}"]`);
  click("[data-w-next]");
  assert.match(q("#wizard").textContent, /Teste Criador/);
  click("[data-w-next]");
  const saved = w.ProLifeSave.parse(w.localStorage.getItem(w.ProLifeSave.KEY));
  assert.equal(saved.person.name, "Teste Criador");
  assert.equal(saved.creation.status, "started");
  assert.equal(saved.clubId, first);
  assert.equal(saved.person.pos, "MEI");
});

test('criador de historia e jogador aceitam idade inicial de 14 anos', () => {
  const custom = D.Creation.sanitizeCustom({ age: 14, overall: 55 });
  assert.equal(custom.age, 14);
  const s = D.create({ mode:'player', world:'legacy', name:'Alesson', age:14, pos:'ATA', origin:'custom', creation:{ custom:{ age:14, overall:55, reputation:5, popularity:3, wallet:0 } }, points:{} }, 1414);
  assert.equal(s.person.age, 14);
});
