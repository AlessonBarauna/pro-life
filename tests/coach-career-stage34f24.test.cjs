"use strict";
// Stage 34F.24 - carreira de treinador: diretoria, metas, risco de demissao, vestiario, capitao, treino coletivo, historico.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D;
const A = require("../src/application/game.js");
const CC = D.CoachCareer;
const coach = (seed = 77) => { const s = D.create({ mode: "coach", clubId: "c0" }, seed); CC.init(s, D); return s; };
const own = (s) => D.club(s);
const squad = (s) => own(s).roster.filter((p) => p.status !== "retired");
const form = (s, good) => { for (const c of s.clubs) if (c.leagueId === own(s).leagueId) c.stats = good ? { played: 12, points: 12, w: 3, d: 3, l: 6, gf: 12, ga: 18 } : { played: 12, points: 28, w: 8, d: 4, l: 0, gf: 24, ga: 6 }; };
const run = (s, days) => { for (let i = 0; i < days; i++) D.advance(s, 1); };

test("34F.24 (1) modo treinador abre vinculo, metas e confianca; modo jogador fica intocado", () => {
  const s = coach(), sn = CC.snapshot(s, D);
  assert.equal(sn.enabled, true); assert.equal(sn.hasClub, true);
  assert.equal(s.coachCareer.stints.length, 1); assert.equal(s.coachCareer.stints[0].clubId, s.clubId);
  assert.equal(sn.goals.items.length, 3); assert.ok(sn.board >= 0 && sn.board <= 100); assert.ok(sn.risk.id);
  const p = D.create({ mode: "player", clubId: "c0" }, 5);
  assert.equal(CC.snapshot(p, D).enabled, false); assert.equal(CC.init(p, D), null); assert.equal(p.coachCareer, undefined);
  run(p, 30); assert.equal(p.coachCareer, undefined);
});

test("34F.24 (2) avaliacao semanal: campanha ruim derruba a confianca e explica o motivo; boa campanha sobe", () => {
  const bad = coach(), good = coach();
  form(bad, false); own(bad).stats = { played: 12, points: 2, w: 0, d: 2, l: 10, gf: 3, ga: 25 };
  form(good, true); own(good).stats = { played: 12, points: 34, w: 11, d: 1, l: 0, gf: 30, ga: 4 };
  bad.board = good.board = 50;
  for (let i = 0; i < 8; i++) { bad.day += 7; good.day += 7; CC.evaluate(bad, D, null); CC.evaluate(good, D, null); }
  assert.ok(bad.board < 40, `bad ${bad.board}`); assert.ok(good.board > 55, `good ${good.board}`);
  const risk = CC.snapshot(bad, D).detail; assert.ok(risk.reasons.length >= 1);
  assert.ok(CC.snapshot(bad, D).history.length >= 2);
});

test("34F.24 (3) ultimato avisa uma vez por temporada e a demissao limpa o clube sem perder o historico", () => {
  const s = coach(); const logs = [];
  form(s, false); own(s).stats = { played: 12, points: 1, w: 0, d: 1, l: 11, gf: 2, ga: 30 }; s.board = 29;
  CC.evaluate(s, D, { log: (t) => logs.push(t) }); CC.evaluate(s, D, { log: (t) => logs.push(t) });
  assert.equal(logs.filter((t) => t === "Ultimato da diretoria").length, 1);
  const id = s.clubId; CC.dismiss(s, D, "teste");
  assert.equal(s.clubId, null); assert.equal(s.board, 50);
  const st = s.coachCareer.stints[0]; assert.equal(st.clubId, id); assert.equal(st.exit, "demissão"); assert.equal(st.reason, "teste");
  assert.equal(CC.snapshot(s, D).hasClub, false);
});

test("34F.24 (4) conversas: efeito, recarga e validacao do jogador", () => {
  const s = coach(); const sq = squad(s); sq.forEach((p) => { p.morale = 50; });
  CC.talk(s, D, "reuniao"); assert.ok(sq.every((p) => p.morale === 53));
  assert.throws(() => CC.talk(s, D, "reuniao"), /disponível em/);
  assert.throws(() => CC.talk(s, D, "individual", "nao-existe"), /jogador/);
  CC.talk(s, D, "individual", sq[0].id); assert.equal(sq[0].morale, 62);
  CC.talk(s, D, "cobrar"); assert.equal(sq[1].morale, 51);
  s.day += 30; CC.talk(s, D, "reuniao");
  const l = CC.lockerRoom(s, D); assert.ok(l.cohesion <= l.average + 1); assert.ok(l.log.length >= 3);
  assert.throws(() => CC.talk(s, D, "xyz"), /inválida/);
});

test("34F.24 (5) capitao escolhido vence o automatico e volta ao automatico quando liberado", () => {
  const s = coach(); const c = own(s); const auto = D.captaincy(s, c).captain;
  const other = squad(s).find((p) => p.id !== auto.id && !p.injury);
  CC.setCaptain(s, D, other.id); assert.equal(D.captaincy(s, c).captain.id, other.id);
  assert.throws(() => CC.setCaptain(s, D, "fantasma"), /elenco/);
  other.injury = { days: 10 }; assert.notEqual(D.captaincy(s, c).captain.id, other.id);
  delete other.injury; CC.setCaptain(s, D, null); assert.equal(D.captaincy(s, c).captain.id, auto.id);
});

test("34F.24 (6) treino coletivo: foco valido, efeitos distintos e rejeita foco desconhecido", () => {
  const rec = coach(), phys = coach();
  squad(rec).forEach((p) => { p.condition = 50; }); squad(phys).forEach((p) => { p.condition = 50; });
  CC.setFocus(rec, "recuperacao"); CC.setFocus(phys, "equilibrado");
  rec.day = phys.day = 14; CC.weeklyTraining(rec, D); CC.weeklyTraining(phys, D);
  const avg = (s) => squad(s).reduce((n, p) => n + (p.condition ?? 50), 0) / squad(s).length;
  assert.ok(avg(rec) > avg(phys), `${avg(rec)} vs ${avg(phys)}`);
  assert.throws(() => CC.setFocus(rec, "magia"), /inválido/);
  CC.weeklyTraining(rec, D); // idempotente no mesmo dia
});

test("34F.24 (7) temporada completa: balanco registrado, metas avaliadas e novas metas na temporada seguinte", () => {
  const a = coach(31), y = a.season;
  for (let i = 0; i < 500 && a.season === y; i++) D.advance(a, 1);
  assert.equal(a.season, y + 1);
  const st = a.coachCareer.stints[0];
  assert.ok(st.rows.length >= 1, "balanço registrado"); assert.ok(st.rows[0].goals.every((g) => ["cumprida", "falhou"].includes(g.status)));
  if (a.clubId) assert.equal(a.coachCareer.goals.season, a.season);
  else assert.equal(st.exit, "demissão");
});

test("34F.24 (8) acoes do app + ida e volta de serializacao preservam a carreira", () => {
  const s = coach(); const id = squad(s)[3].id;
  A.execute(s, "coachFocus", { focus: "jovens" }); A.execute(s, "coachCaptain", { playerId: id }); A.execute(s, "coachTalk", { kind: "reuniao" });
  const back = JSON.parse(JSON.stringify(s)); D.normalize ? D.normalize(back) : null;
  assert.equal(back.coachCareer.focus, "jovens"); assert.equal(back.coachCareer.captainId, id);
  assert.equal(CC.snapshot(back, D).locker.log.length, 1);
  const p = D.create({ mode: "player", clubId: "c0" }, 5);
  assert.throws(() => A.execute(p, "coachFocus", { focus: "jovens" }), /treinadores/);
  assert.throws(() => A.execute(s, "coachFocus", { focus: "x" }), /inválido/);
});

test("34F.24 (9) tela: abas, escape de HTML e aviso no modo jogador", () => {
  const { JSDOM } = require("jsdom"); const dom = new JSDOM("<body></body>"); global.window = dom.window;
  const V = require("../src/ui/coach-career-view.js");
  const s = coach(); squad(s)[0].name = '<img src=x onerror=alert(1)>';
  for (const tab of ["diretoria", "vestiario", "treino", "historico"]) {
    V.setTab(tab); const html = V.render(s, D);
    assert.ok(html.includes("Carreira do Treinador")); assert.ok(!html.includes("<img src=x"), tab);
  }
  V.setTab("vestiario"); assert.ok(V.render(s, D).includes("data-coach-talk=\"reuniao\""));
  V.setTab("treino"); assert.ok(V.render(s, D).includes("data-coach-focus=\"fisico\""));
  assert.ok(V.render(D.create({ mode: "player", clubId: "c0" }, 5), D).includes("apenas no modo treinador"));
  delete global.window;
});
