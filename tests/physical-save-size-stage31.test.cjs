"use strict";
// Stage 31.8D / bloco 2 — estados físicos sem materialização desnecessária.
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const Ph = require("../src/domain/physical.js");

const clone = (x) => JSON.parse(JSON.stringify(x));
const player = (extra = {}) => ({ id: "p1", name: "Teste", age: 25, pos: "MEI", condition: 100, injury: 0, ...extra });
const explicitDefault = (p) => { p.physical = { fatigue: 0, fitness: 100, active: null, history: [], recentLoad: 0, returnMode: "full", processed: [] }; return p; };
const rngOf = () => { let i = 0; return { next: () => ((i++ * 0.37) % 1), int: (a, b) => a + Math.floor(((i++ * 0.61) % 1) * (b - a + 1)) }; };
const view = (p) => { const q = Ph.peek(p); return JSON.stringify({ c: p.condition, i: p.injury, f: q.fitness, fa: q.fatigue, rl: q.recentLoad, rm: q.returnMode, h: q.history, a: q.active }); };
const make = () => D.create({ mode: "player", name: "Medicao", age: 22, pos: "ATA", clubId: "c0" }, 11);
const players = (s) => s.clubs.flatMap((c) => c.roster);

// Avança dois jogadores idênticos (A: save antigo com objeto completo; B: sem registro) e compara a cada passo.
function lockstep(setup, steps) {
  const A = explicitDefault(player()), B = player();
  setup(A, B);
  const rA = rngOf(), rB = rngOf();
  assert.equal(view(A), view(B), "início");
  steps.forEach(([name, fn], i) => { fn(A, rA, i); fn(B, rB, i); assert.equal(view(A), view(B), `passo ${i} ${name}`); });
  return { A, B };
}
const daily = (n, intensity = "normal") => Array.from({ length: n }, (_, k) => ["daily", (p, r, i) => Ph.daily(p, 100 + i, intensity)]);

test("31.8D-2 (1) jogador no estado padrão: não persiste objeto físico e leituras não mutam", () => {
  const p = player(); const before = JSON.stringify(p);
  assert.equal(Ph.canPlay(p), true); assert.equal(Ph.status(p), "100%"); assert.ok(Ph.risk(p, "match") > 0); Ph.peek(p);
  assert.equal(JSON.stringify(p), before); assert.ok(!("physical" in p));
  Ph.daily(p, 1); assert.ok(!("physical" in p), "padrão não é persistido após o dia"); assert.equal(p.condition, 100);
  const hero = player({ id: "hero" }); Ph.daily(hero, 1); assert.ok(hero.physical, "protagonista mantém estado");
  const s = make(); const snap = JSON.stringify(s);
  for (const x of players(s)) { Ph.canPlay(x); Ph.status(x); Ph.risk(x, "match"); }
  assert.equal(JSON.stringify(s), snap, "leituras em um save inteiro não alteram o estado");
});

test("31.8D-2 (2) jogador fatigado: recupera exatamente como no formato antigo e volta a não ocupar espaço", () => {
  const { A, B } = lockstep(() => {}, [["jogo", (p) => { Ph.init(p); /* contrato: materializar antes de alterar p.condition, como faz o engine na partida */ p.condition = 76; Ph.matchLoad(p, 90); }], ...daily(25)]);
  assert.ok(!("physical" in B) || B.physical.recentLoad > 0, "B só mantém estado enquanto há carga residual");
  assert.equal(A.condition, B.condition);
  // fadiga zerada e fitness cheio, restando só a carga recente decaindo
  const q = Ph.peek(B); assert.equal(q.fatigue, 0); assert.equal(q.fitness, 100);
});

test("31.8D-2 (3) lesão, recuperação e retorno: idêntico ao formato antigo; histórico preservado", () => {
  const knee = Ph.CATALOG.find((c) => c.id === "knee"), strain = Ph.CATALOG.find((c) => c.id === "strain");
  const { A, B } = lockstep(() => {}, [
    ["lesão", (p, r, i) => { Ph.injure(p, r, 100, "partida", strain); }],
    ...daily(6),
    ["retorno antecipado", (p) => { if (p.physical?.active?.status === "RETORNO PARCIAL") Ph.chooseReturn(p, 107, "gradual"); }],
    ...daily(30),
    ["lesão grave", (p, r) => { Ph.injure(p, r, 140, "partida", knee); }],
    ...daily(130),
  ]);
  assert.ok(B.physical && B.physical.history.length >= 2, "histórico legítimo preservado");
  assert.equal(JSON.stringify(Ph.peek(A).history), JSON.stringify(Ph.peek(B).history));
});

test("31.8D-2 (4) dias consecutivos de treino (leve, normal e pesado) idênticos ao formato antigo", () => {
  const steps = [];
  for (let d = 0; d < 14; d++) steps.push(["treino", (p) => Ph.trainLoad(p, ["rest", "normal", "hard"][d % 3])], ["daily", (p) => Ph.daily(p, 200 + d, ["rest", "normal", "hard"][d % 3])]);
  lockstep(() => {}, steps);
});

test("31.8D-2 (5) save antigo com objetos físicos completos: abre, joga e encolhe sem mudar resultados", () => {
  const lazy = make(), legacy = make();
  for (const p of players(legacy)) Ph.init(p, 0);               // formato antigo: objeto completo para todos
  assert.ok(players(legacy).every((p) => p.physical));
  const sig = (s) => JSON.stringify([s.day, s.matches.map((m) => [m.home, m.away, m.hg, m.ag, m.events.length]), players(s).map((p) => [p.id, p.condition, p.injury || 0, p.minutes, JSON.stringify(Ph.peek(p))]), s.wallet]);
  D.advance(lazy, 25); D.advance(legacy, 25);
  assert.equal(sig(lazy), sig(legacy), "resultados esportivos e estados físicos idênticos");
  const withPhys = (s) => players(s).filter((p) => p.physical).length;
  assert.ok(withPhys(legacy) < players(legacy).length * 0.6, "save antigo é compactado ao jogar: " + withPhys(legacy));
});

test("31.8D-2 (6) save/reload no meio da simulação não altera o resultado", () => {
  const direct = make(); D.advance(direct, 20);
  const a = make(); D.advance(a, 8); const reloaded = clone(a); D.advance(reloaded, 12);
  const sig = (s) => JSON.stringify([s.day, s.matches.map((m) => [m.home, m.away, m.hg, m.ag]), players(s).map((p) => [p.id, p.condition, p.injury || 0, p.minutes]), s.wallet]);
  assert.equal(sig(reloaded), sig(direct));
});

test("31.8D-2 (7) tamanho do JSON (seed 11) nos dias 0, 1 e 10 menor que o estado pós-bloco 1", () => {
  const BASE = { d0: 3942288, d1: 4298529, d10: 4795628 }; // medido após o bloco 1, mesma configuração
  const s = make(), out = {}, snap = (d) => { const j = JSON.stringify(s); out["d" + d] = j.length; out["p" + d] = (j.match(/"physical":\{/g) || []).length; };
  snap(0); D.advance(s, 1); snap(1); D.advance(s, 9); snap(10);
  console.log(`# fisico: d0 ${BASE.d0}->${out.d0} | d1 ${BASE.d1}->${out.d1} (${out.d1 - BASE.d1}) | d10 ${BASE.d10}->${out.d10} (${out.d10 - BASE.d10}) | objetos fisicos d1=${out.p1} d10=${out.p10}`);
  assert.ok(out.d0 <= BASE.d0 + 20); assert.ok(out.d1 < BASE.d1 - 200000); assert.ok(out.d10 < BASE.d10 - 150000);
  assert.ok(out.p1 < 50, "poucos objetos físicos no dia 1: " + out.p1);
});
