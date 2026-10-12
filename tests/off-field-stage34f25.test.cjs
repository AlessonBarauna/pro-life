"use strict";
// Stage 34F.25 - vida profissional e pessoal: redes, relacionamentos, familia, despesas, imagem publica.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
const A = require("../src/application/game.js");
const O = D.OffField;
const player = (seed = 41) => { const s = D.create({ mode: "player", clubId: "c0" }, seed); O.init(s); return s; };
const coach = (seed = 41) => { const s = D.create({ mode: "coach", clubId: "c0" }, seed); O.init(s); return s; };

test("34F.25 (1) estado por modo: jogador tem redes e todos os contatos; treinador nao tem fisio/agente", () => {
  const p = O.snapshot(player(), D), c = O.snapshot(coach(), D);
  assert.equal(p.social, true); assert.equal(c.social, false);
  assert.deepEqual(p.contacts.map((x) => x.id).sort(), ["agente", "fisio", "jornalista", "mentor", "presidente"]);
  assert.deepEqual(c.contacts.map((x) => x.id).sort(), ["jornalista", "mentor", "presidente"]);
  assert.ok(p.image.value >= 0 && p.image.value <= 100);
});

test("34F.25 (2) publicacoes: efeito persistente em seguidores/torcida, recarga e rejeicao no treinador", () => {
  const s = player(), f0 = s.fans, fs0 = D.Career.mediaProfile(s).fanSentiment;
  const r = O.post(s, D, "solidario");
  assert.ok(s.fans > f0); assert.ok(D.Career.mediaProfile(s).fanSentiment > fs0); assert.equal(s.offField.social.posts[0].kind, "solidario");
  assert.throws(() => O.post(s, D, "solidario"), /disponível em/);
  assert.throws(() => O.post(s, D, "nada"), /inválida/);
  assert.throws(() => O.post(coach(), D, "treino"), /jogador/);
  assert.ok(r.followers > 0);
});

test("34F.25 (3) opiniao forte: jornalista confiavel reduz polemicas (taxa em 200 sorteios)", () => {
  const base = player(100);
  let clock = 1000; const count = (lvl) => { let bad = 0; base.offField.network.contacts.jornalista.level = lvl; for (let i = 0; i < 200; i++) { base.day = (clock += 3); if (O.post(base, D, "opiniao").backfired) bad++; } return bad; };
  const low = count(0), high = count(100);
  assert.ok(low > high, `${low} vs ${high}`); assert.ok(low > 40 && low < 140, String(low));
});

test("34F.25 (4) relacionamentos: custa dinheiro, tem recarga, rende retorno decrescente e decai sem contato", () => {
  const s = player(); const w = s.wallet, l0 = s.offField.network.contacts.mentor.level;
  O.cultivate(s, D, "mentor"); assert.equal(s.wallet, w - O.snapshot(s, D).contactCost); assert.equal(s.offField.network.contacts.mentor.level, l0 + 8);
  assert.throws(() => O.cultivate(s, D, "mentor"), /nova conversa/);
  assert.throws(() => O.cultivate(coach(), D, "fisio"), /indisponível/);
  s.wallet = 10; s.day += 20; assert.throws(() => O.cultivate(s, D, "mentor"), /Saldo/);
  const t = player(); t.offField.network.contacts.mentor.level = 80; t.wallet = 1e6; O.cultivate(t, D, "mentor"); assert.equal(t.offField.network.contacts.mentor.level, 84);
  const d = player(); d.offField.network.contacts.jornalista.level = 50; d.offField.network.contacts.jornalista.lastDay = -200; d.day = 90; O.daily(d, D, null);
  assert.equal(d.offField.network.contacts.jornalista.level, 48);
});

test("34F.25 (5) beneficios mensais dos contatos fortes se aplicam ao estado do jogador", () => {
  const s = player(); s.offField.network.contacts.mentor.level = 70; s.offField.network.contacts.fisio.level = 70;
  s.person.morale = 50; s.person.condition = 50; s.stress = 40; s.day = 30; O.daily(s, D, null);
  assert.equal(s.person.morale, 52); assert.equal(s.person.condition, 52); assert.equal(s.stress, 38);
  O.daily(s, D, null); assert.equal(s.person.morale, 52, "mesmo mes nao repete");
  const c = coach(); c.offField.network.contacts.presidente.level = 80; c.board = 50; c.day = 30; O.daily(c, D, null); assert.equal(c.board, 51);
});

test("34F.25 (6) familia: evento surge, escolha cobra custo e altera atributos; ignorar resolve sozinho", () => {
  const s = player(); let seen = null;
  for (let d = 1; d < 400 && !seen; d++) { s.day = d; O.daily(s, D, null); if (s.offField.family.pending) seen = s.offField.family.pending; }
  assert.ok(seen, "evento familiar gerado");
  const sn = O.snapshot(s, D); assert.ok(sn.pending.choices.length === 2);
  s.wallet = 1e6; const fam = s.family, w = s.wallet, cost = sn.pending.choices[0].cost;
  O.resolve(s, D, 0, false); assert.equal(s.offField.family.pending, null); assert.equal(s.wallet, w - cost);
  assert.notEqual(s.family, fam); assert.equal(s.offField.family.history[0].auto, false);
  assert.throws(() => O.resolve(s, D, 0, false), /pendente/);
  const t = player(); t.offField.family.pending = { id: "aniversario", createdDay: 0, deadline: 10 }; t.day = 12; const f0 = t.family; O.daily(t, D, null);
  assert.equal(t.offField.family.pending === null || t.offField.family.pending.id !== "aniversario" || t.offField.family.history[0].auto, true);
  assert.ok(t.offField.family.history[0].auto); assert.ok(t.family < f0);
});

test("34F.25 (7) despesas: categoriza o extrato e fecha o mes", () => {
  const s = player(); D.Career.transaction(s, 5000, "Salário mensal"); D.Career.transaction(s, -400, "Veículo: carro"); D.Career.transaction(s, -900, "Moradia: casa"); D.Career.transaction(s, -300, "Comissão da agência");
  const b = O.breakdown(s, D, 30); assert.equal(b.income, 5000); assert.equal(b.expense, 1600);
  assert.deepEqual(b.rows.map((r) => r.id).sort(), ["agencia", "moradia", "salario", "veiculos"]);
  s.day = 30; O.daily(s, D, null); assert.equal(s.offField.expenses.months.length, 1); assert.equal(s.offField.expenses.months[0].expense >= 1600, true);
});

test("34F.25 (8) acoes do app e serializacao de ida e volta", () => {
  const s = player(); A.execute(s, "offFieldPost", { kind: "treino" }); A.execute(s, "offFieldContact", { id: "agente" });
  const back = JSON.parse(JSON.stringify(s));
  assert.equal(JSON.stringify(back.offField), JSON.stringify(s.offField));
  assert.equal(O.snapshot(back, D).contacts.find((c) => c.id === "agente").level, 28);
  assert.throws(() => A.execute(s, "offFieldFamily", { choice: 0 }), /pendente/);
});

test("34F.25 (9) tela: abas, escape e acoes conectadas", () => {
  const V = require("../src/ui/off-field-view.js"); const s = player();
  s.offField.posts = null; s.offField.social.posts.unshift({ day: 1, season: 1, kind: "x", label: '<b onclick=1>', backfired: false, followers: 5, text: "<script>1</script>" });
  for (const t of ["imagem", "rede", "familia", "despesas"]) { V.setTab(t); const h = V.render(s, D); assert.ok(h.includes("Vida profissional e pessoal")); assert.ok(!h.includes("<script>1"), t); }
  V.setTab("imagem"); assert.ok(V.render(s, D).includes('data-offfield-post="opiniao"'));
  V.setTab("rede"); assert.ok(V.render(s, D).includes('data-offfield-contact="mentor"'));
  s.offField.family.pending = { id: "viagem", createdDay: 0, deadline: 99 }; V.setTab("familia"); assert.ok(V.render(s, D).includes('data-offfield-family="1"'));
  V.setTab("imagem"); assert.ok(V.render(coach(), D).includes("carreira de jogador"));
});

test("34F.25 (10) integracao: 90 dias de simulacao no engine usam o modulo sem erro", () => {
  const s = player(7); for (let i = 0; i < 90; i++) D.advance(s, 1);
  assert.ok(s.offField && s.offField.expenses.months.length >= 1);
});
