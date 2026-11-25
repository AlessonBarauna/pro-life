"use strict";
const test = require("node:test"), assert = require("node:assert");
const R = require("../src/ui/sm27-reports.js");
const h = { info: (p) => ({ id: p.id, name: p.name, pos: p.pos, ovr: p.ovr, age: p.age, pot: p.pot, value: 1e6, wage: 1e5, left: p.left ?? 400, morale: p.morale ?? 70, cond: 90, goals: 0, injured: !!p.injury, suspended: p.suspension > 0, p }), fmtMoney: (v) => "R$ " + v, leftLabel: (d) => d + "d", sel: (id) => `data-sm27sq-open="${id}"` };
const club = { name: "Teste FC", lineup: ["a"], roster: [{ id: "a", name: "Ana", pos: "MC", ovr: 80, age: 22, pot: 88, injury: 10, status: "active" }, { id: "b", name: "Beto", pos: "ZAG", ovr: 70, age: 30, pot: 70, suspension: 2, morale: 30, left: 90 }] };
const ctx = { s: { day: 5 }, club, D: {}, dayDate: (d) => "dia" + d };
test("abas de relatório renderizam sem erro e com o conteúdo esperado", () => {
  assert.match(R.render("geral", ctx, h), /Classificação média/);
  assert.match(R.render("lesoes", ctx, h), /volta em 10 dias/);
  assert.match(R.render("suspensoes", ctx, h), /perde 2 jogos/);
  const m = R.render("moral", ctx, h);
  assert.match(m, /Não resolvido/); assert.match(m, /Contrato termina em menos de 6 meses/);
  assert.match(R.render("contratos", ctx, h), /data-sm27sq-edit-contract/);
  assert.match(R.render("desenvolvimento", ctx, h), /Progresso até o potencial/);
  assert.match(R.render("juventude", ctx, h), /base ainda não tem jovens/);
});
test("tipo de lesão é estável para o mesmo dia de retorno", () => {
  const p = { id: "x", injury: 30 };
  assert.equal(R.injuryType(p, { day: 10 }), R.injuryType(p, { day: 10 }));
});
