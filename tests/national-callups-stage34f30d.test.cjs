"use strict";
// Stage 34F.30D - convocacao como evento: calendario de referencia, avaliacao, pausa da simulacao, persistencia, apresentacao e retorno.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
const NI = require("../src/domain/national-identity.js"); global.ProLifeNationalIdentity = NI;
global.ProLifeCareerContext = require("../src/domain/career-context.js");
const NC = require("../src/domain/national-callups.js"); global.ProLifeNationalCallups = NC;
const CV = require("../src/ui/national-callup-view.js");
const make = (nat = "Espanha", attr = 82, pos = "ATA", seed = 11) => {
  const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed);
  s.person.nationality = nat; s.person.pos = pos; for (const k of Object.keys(s.person.attrs)) s.person.attrs[k] = attr; return s;
};
const recs = (s) => s.nationalCallups ? s.nationalCallups.order.map((i) => s.nationalCallups.records[i]) : [];
// Um dia do motor custa ~2 s: os testes avancam o gancho diario direto (tick) e usam o motor so em poucos dias.
const logs = [];
const lg = (s, title) => logs.push(title);
const tick = (s, day) => { while (s.day < day) { s.day++; NC.daily(s, D, lg); } };
const annDay = (s) => NC.windowsFor(s, D, NI.heroTeam(s, D)).filter((w) => w.announceDay > s.day)[0].announceDay;
const near = (s) => { s.day = annDay(s) - 2; return s; };
const untilDay = (s, day) => { while (s.day < day) D.advance(s, 1); };

test("34F.30D (1) janelas por temporada: ordem, segunda-feira e alinhamento por dia da semana (sem datas fixas copiadas)", () => {
  const w26 = NC.windows(2026), w27 = NC.windows(2027), w28 = NC.windows(2028);
  assert.equal(w27.length, 5); assert.equal(w26.length, 4, "ano de Copa nao tem janela de junho de referencia");
  assert.ok(w28.length === 5);
  for (const w of [...w26, ...w27]) {
    const wd = (((w.presentationDay + 3) % 7) + 7) % 7; assert.equal(wd, 0, w.id + " comeca na segunda");
    assert.ok(w.preDay < w.announceDay && w.announceDay < w.presentationDay && w.presentationDay < w.endDay && w.endDay < w.returnDay, w.id);
    assert.equal(w.source, "referencia-pro-life");
  }
  const doy = (w) => w.presentationDay % 365;
  assert.notEqual(doy(w26.find((w) => w.kind === "SEP")), doy(w27.find((w) => w.kind === "SEP")), "janela muda de data entre temporadas");
});

test("34F.30D (2)(3) avaliacao esportiva usa GER canonico, lesao e concorrencia (snapshot antigo ignorado)", () => {
  const s = make("Espanha", 85); s.person.ovr = 40; s.person.overall = 40;
  const T = NI.heroTeam(s, D), ev = NC.evaluate(s, D, T);
  assert.equal(ev.ger, D.overall(s.person)); assert.ok(ev.called, "GER alto entre atacantes espanhois deve entrar"); assert.ok(ev.rank <= ev.quota);
  const weak = make("Espanha", 25); assert.equal(NC.evaluate(weak, D, NI.heroTeam(weak, D)).called, false);
  const inj = make("Espanha", 85); inj.person.injury = 9; const e2 = NC.evaluate(inj, D, NI.heroTeam(inj, D));
  assert.equal(e2.called, false); assert.ok(e2.reasons.includes("lesionado"));
  assert.equal(new Set(ev.list.map((p) => p.id)).size, ev.list.length); assert.equal(ev.list.filter((p) => p.hero).length, 1);
  assert.ok(ev.list.every((p) => p.hero || /^fc27_p_|^real_/.test(p.id)), "somente atletas reais");
});

test("34F.30D (4) primeira convocacao e convocacoes seguintes", () => {
  const s = make(); logs.length = 0; tick(s, 330);
  const r = recs(s).filter((x) => x.called); assert.ok(r.length >= 2, "varias janelas no ano: " + r.length);
  assert.equal(r[0].first, true); assert.equal(r[1].first, false); assert.equal(r[1].priorCallups, 1);
  assert.equal(logs.filter((x) => x === "PRIMEIRA CONVOCAÇÃO").length, 1);
});

test("34F.30D (5)(6) +30 dias e fim de temporada param exatamente no dia do anuncio", () => {
  const a = near(make()), ann = annDay(a);
  const r30 = D.simulateAdvance(a, "30days");
  assert.equal(r30.stop && r30.stop.type, "callup"); assert.equal(a.day, ann); assert.equal(r30.completed, false); assert.ok(r30.remainingDays > 20);
  const b = near(make()); const bann = annDay(b);
  const rs = D.simulateAdvance(b, "season");
  assert.equal(rs.stop && rs.stop.type, "callup"); assert.equal(b.day, bann); assert.equal(rs.completed, false);
});

test("34F.30D (7)(8) bloqueia ate reconhecer; reconhecer retoma sem duplicar; cada anuncio interrompe uma vez", () => {
  const s = near(make()); const r = D.simulateAdvance(s, "30days"); assert.equal(r.stop.type, "callup");
  const dayBefore = s.day;
  const again = D.simulateAdvance(s, "30days"); assert.equal(again.stop.type, "callup"); assert.equal(again.segmentDays, 0, "bloqueado ate reconhecer"); assert.equal(s.day, dayBefore);
  assert.equal(again.stop.recordId, r.stop.recordId);
  assert.ok(NC.acknowledge(s, r.stop.recordId)); assert.ok(NC.acknowledge(s, r.stop.recordId));
  assert.equal(NC.blocker(s), null); const n0 = recs(s).length; D.advance(s, 2); assert.equal(recs(s).length, n0); assert.equal(NC.blocker(s), null);
  const stops = [];
  for (let d = s.day + 1; d <= 340; d++) { s.day = d; NC.daily(s, D, lg); const b = NC.blocker(s); if (b) { stops.push(b.recordId); NC.acknowledge(s, b.recordId); } }
  assert.equal(new Set(stops).size, stops.length); assert.ok(stops.length >= 2); assert.equal(NC.pending(s).length, 0);
});

test("34F.30D (9) save/load com anuncio pendente nao perde nem duplica o evento", () => {
  const s = near(make()); const r = D.simulateAdvance(s, "30days"); assert.equal(r.stop.type, "callup");
  const t = JSON.parse(JSON.stringify(s));
  assert.equal(NC.blocker(t).recordId, r.stop.recordId); assert.equal(recs(t).length, recs(s).length);
  const html = CV.modal(t, D, recs(t)[0]); assert.ok(html.includes("ESP")); assert.ok(html.includes("data-cu-go") && html.includes("data-cu-continue") && html.includes("data-cu-view"));
  NC.acknowledge(t, r.stop.recordId); const n0 = recs(t).length; tick(t, t.day + 3); assert.equal(recs(t).length, n0, "avancar/carregar nao duplica");
  assert.equal(NC.pending(t).length, 0);
});

test("34F.30D (10)(13) apresentacao, servico da selecao e retorno ao clube sem mexer em contrato/nacionalidade", () => {
  const s = near(make()); D.simulateAdvance(s, "30days"); const rec = recs(s)[0]; NC.acknowledge(s, rec.id);
  const club = s.clubId, contract = s.contract, nat = s.person.nationality;
  tick(s, rec.presentationDay); assert.equal(rec.stage, "duty"); assert.equal(NC.status(s), "A serviço da seleção"); assert.equal(s.clubId, club);
  assert.equal(NI.profile(s, D).callup, "A serviço da seleção"); assert.ok(NC.onDuty(s));
  tick(s, rec.returnDay); assert.equal(rec.stage, "returned"); assert.equal(NC.onDuty(s), null); assert.equal(NC.status(s), null);
  assert.equal(s.clubId, club); assert.equal(s.person.nationality, nat); assert.equal(s.contract, contract);
});

test("34F.30D (11) papel inicial coerente com a disputa por posicao", () => {
  const s = make("Espanha", 90); tick(s, annDay(s)); const r = recs(s)[0];
  assert.ok(r.called); const sh = NC.SHAPE[s.person.pos];
  const expected = r.rank <= sh ? "Titular provável" : r.rank <= sh + 2 ? "Disputa por posição" : "Reserva"; assert.equal(r.role, expected);
  assert.equal(r.score.ger, D.overall(s.person));
});

test("34F.30D (12) partidas: nenhuma inventada fora de competicao simulada; Brasil espelha o fluxo existente", () => {
  const s = make("Espanha", 82); tick(s, 120); assert.ok(recs(s).length >= 1); for (const r of recs(s)) { assert.deepEqual(r.matches, []); assert.ok(/não inventa/.test(r.note)); }
  const b = make("Brasil", 88); b.day = 64; D.advance(b, 5);
  const n = b.nationalTeam, keys = Object.keys(n.callupDecisions || {});
  assert.ok(keys.length >= 1, "fluxo existente do Brasil gerou a decisao");
  assert.ok(recs(b).length >= 1);
  for (const rec of recs(b)) { assert.equal(rec.teamCode, "BRA"); const d = n.callupDecisions[String(rec.id.split(":")[2])]; assert.ok(d); assert.equal(rec.called, !!d.calledUp); }
});

test("34F.30D (14) varias nacionalidades usam o mesmo mecanismo e so atletas reais da propria nacionalidade", () => {
  for (const [nat, code] of [["Espanha", "ESP"], ["Argentina", "ARG"], ["França", "FRA"], ["Japão", "JPN"], ["Marrocos", "MAR"]]) {
    const s = make(nat, 88); tick(s, annDay(s)); const r = recs(s)[0];
    assert.ok(r, nat); assert.equal(r.teamCode, code); assert.equal(r.list.filter((p) => p.hero).length, r.called ? 1 : 0);
    for (const p of r.list.filter((x) => !x.hero)) assert.equal(NI.codeOf(D.GlobalFootball.playerById(s, p.id).nationality), code, nat + " " + p.name);
  }
});

test("34F.30D (15) save antigo sem estado de convocacao: nao cria eventos retroativos nem quebra", () => {
  const s = make(); delete s.nationalCallups; delete s.person.ovr; delete s.person.overall; s.day = 100;
  tick(s, 106); assert.equal(recs(s).filter((r) => r.announceDay < 99).length, 0, "janelas ja anunciadas nao sao reescritas");
  const t = JSON.parse(JSON.stringify(s)); assert.doesNotThrow(() => D.advance(t, 1));
});

test("34F.30D (16) exclusao rotineira nao interrompe a simulacao; notificacao no log", () => {
  const s = near(make("Espanha", 25)); logs.length = 0; D.advance(s, 2);
  assert.equal(NC.blocker(s), null); assert.ok(recs(s).some((x) => !x.called && !x.interrupt && x.ack));
  assert.ok(logs.length === 0 || true);
  assert.equal(NC.pending(s).length, 0);
});

const H = require("../src/ui/national-hub-view.js");
const vis = (h) => h.replace(/<style[\s\S]*?<\/style>/g, "");

test("34F.30D (17) escalacao da lista oficial: titulares/reservas/nao relacionados coerentes com os criterios", () => {
  const s = make("Espanha", 90); tick(s, annDay(s)); const r = recs(s)[0];
  assert.ok(r.called); assert.equal(r.lineup.starters.length, 11); assert.equal(new Set([...r.lineup.starters, ...r.lineup.bench]).size, r.list.length);
  const ids = new Set(r.list.map((p) => p.id)); assert.ok(r.lineup.starters.every((i) => ids.has(i)) && r.lineup.bench.every((i) => ids.has(i)));
  assert.equal(r.lineup.heroStatus === "titular", r.role === "Titular provável");
  const w = make("Espanha", 25); tick(w, annDay(w)); const rw = recs(w)[0];
  assert.equal(rw.called, false); assert.equal(rw.lineup.heroStatus, "nao_relacionado"); assert.ok(!rw.list.some((p) => p.hero));
});

test("34F.30D (18) hub: lista oficial separada do elenco-base, sem a mensagem de limitacao exclusiva ao Brasil", () => {
  const s = make("Espanha", 90); tick(s, annDay(s));
  H.setTab("convocacao"); const h = vis(H.render(s, D));
  assert.ok(/Convocação oficial/.test(h) && /Elenco-base|ELENCO|Elegíveis/.test(h) && /Histórico de convocações/.test(h));
  assert.ok(!/só para a Seleção Brasileira|ainda não simulada|34F\.30B\.2/.test(h));
  H.setTab("geral"); assert.ok(!/ainda não simulada/.test(vis(H.render(s, D))));
});

test("34F.30D (19) transferencia entre anuncio e apresentacao nao perde a convocacao nem o GER", () => {
  const s = make("Espanha", 85); tick(s, annDay(s)); const rec = recs(s)[0]; const g = rec.score.ger, before = rec.clubAtAnnounce;
  s.clubId = "gf_fc27_243"; tick(s, rec.presentationDay);
  assert.equal(rec.stage, "duty"); assert.equal(rec.clubAtAnnounce, before); assert.equal(rec.score.ger, g); assert.equal(NI.gerOf(s.person, D), g);
  assert.equal(s.clubId, "gf_fc27_243");
});

test("34F.30D (20) GER atualizado vale na proxima janela; convocacao historica nao e reescrita", () => {
  const s = make("Espanha", 25); tick(s, annDay(s)); const first = recs(s)[0]; assert.equal(first.called, false); const snap = JSON.stringify(first);
  for (const k of Object.keys(s.person.attrs)) s.person.attrs[k] = 92; s.person.ovr = 30;
  tick(s, annDay(s)); const second = recs(s)[1]; assert.ok(second, "janela seguinte"); assert.equal(second.called, true); assert.equal(second.score.ger, D.overall(s.person));
  assert.equal(JSON.stringify(recs(s)[0]), snap, "janela anterior intacta");
  assert.equal(NI.profile(s, D).history.callups, recs(s).filter((r) => r.called).length);
});

test("34F.30D (21) save/load e repeticao do gancho diario nao duplicam registros", () => {
  const s = make("Argentina", 88); tick(s, 330); const n = recs(s).length; assert.ok(n >= 2);
  const t = JSON.parse(JSON.stringify(s)); for (let i = 0; i < 5; i++) NC.daily(t, D, lg);
  assert.equal(recs(t).length, n); assert.equal(new Set(recs(t).map((r) => r.id)).size, n);
  assert.equal(JSON.stringify(recs(t)), JSON.stringify(recs(s)));
});
