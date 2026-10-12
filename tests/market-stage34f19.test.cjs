"use strict";
// Stage 34F.19 - mercado de transferencias da IA no mundo FC 27: volume, limites de elenco, orcamento e integridade.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const Save = require("../src/infrastructure/save.js");
const G = D.GlobalFootball, M = D.WorldLiveMarket;
const MIN = { GOL: 2, DEF: 5, MEI: 5, ATA: 3 };
const pos = (s) => { const m = new Map(); for (const p of G.activePlayers(s)) { const k = p.clubId + "|" + p.pos; m.set(k, (m.get(k) || 0) + 1); } return m; };
let s, before, ids0, budgets0;
test.before(() => {
  s = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, 1919);
  before = pos(s); ids0 = new Set(G.activePlayers(s).map((p) => p.id));
  budgets0 = new Map((s.globalFootball.clubs || []).map((c) => [c.id, c.budget]));
  while (s.day < 357) D.advance(s, 7); // antes da virada: a 34F.23 passa a ajustar orcamentos no fim da temporada
});
const executed = () => s.worldLiveMarket.deals.filter((d) => d.executionStatus === "executed");

test("34F.19 (1) o mercado da IA movimenta jogadores de verdade em uma temporada (antes: ~27)", () => {
  assert.ok(executed().length >= 60, "transferencias executadas: " + executed().length);
  for (const d of executed()) {
    const p = G.playerById(s, d.playerId);
    assert.ok(p && p.id !== "hero");
    assert.ok(d.operationId && Number.isInteger(d.executedDay));
  }
});

test("34F.19 (2) transferencias nunca deixam o clube de origem abaixo do minimo por posicao", () => {
  const after = pos(s), out = new Map(), retired = new Map();
  for (const d of executed()) { const p = G.playerById(s, d.playerId); out.set(d.fromClubId + "|" + p.pos, (out.get(d.fromClubId + "|" + p.pos) || 0) + 1); }
  for (const p of G.allPlayers(s)) if (ids0.has(p.id) && (p.status === "retired" || p.active === false)) retired.set(p.clubId + "|" + p.pos, (retired.get(p.clubId + "|" + p.pos) || 0) + 1);
  for (const [key, n] of out) {
    const position = key.split("|")[1];
    if ((before.get(key) || 0) < MIN[position]) continue; // ja nascia abaixo do minimo
    assert.ok((after.get(key) || 0) + (retired.get(key) || 0) >= MIN[position], key + " saidas " + n);
  }
});

test("34F.19 (3) sem duplicatas, sem valores negativos e elencos dentro do limite", () => {
  const entries = []; for (const c of s.clubs || []) for (const p of c.roster || []) entries.push(p.id);
  for (const p of s.internationalPlayers) entries.push(p.id);
  const unique = new Set(entries);
  // s.person (hero) pode aparecer no elenco local e em s.person; qualquer outro id repetido e erro
  assert.ok(entries.length - unique.size <= 1, "ids repetidos: " + (entries.length - unique.size));
  for (const d of s.worldLiveMarket.deals) { assert.ok(d.value >= 0 && d.salary >= 0, d.id); assert.notEqual(d.fromClubId, d.toClubId); }
  for (const c of s.globalFootball.clubs) assert.ok(!(Number(c.budget) < 0), c.id);
  const squad = new Map(); for (const p of G.activePlayers(s)) { if (p.academy) continue; squad.set(p.clubId, (squad.get(p.clubId) || 0) + 1); } // a base nao conta no elenco principal
  for (const d of executed()) assert.ok((squad.get(d.toClubId) || 0) <= 40, d.toClubId);
  const active = s.worldLiveMarket.deals.filter((d) => ["rumor", "scouting", "negotiating", "offer"].includes(d.state)).map((d) => d.playerId);
  assert.equal(new Set(active).size, active.length, "um jogador nao tem duas negociacoes ativas");
});

test("34F.19 (4) modo treinador: o clube do usuario nunca entra em negociacao da IA", () => {
  for (const d of s.worldLiveMarket.deals) { assert.notEqual(d.fromClubId, "c0"); assert.notEqual(d.toClubId, "c0"); }
});

test("34F.19 (5) orcamento acompanha as vendas e compras executadas", () => {
  const delta = new Map();
  for (const d of executed()) { delta.set(d.toClubId, (delta.get(d.toClubId) || 0) - d.value); delta.set(d.fromClubId, (delta.get(d.fromClubId) || 0) + d.value); }
  let checked = 0;
  for (const c of s.globalFootball.clubs) {
    if (!delta.has(c.id) || !Number.isFinite(budgets0.get(c.id))) continue;
    const expected = Math.max(0, budgets0.get(c.id) + delta.get(c.id)); // pode saturar em 0 no meio do caminho
    if (delta.get(c.id) >= 0 || budgets0.get(c.id) + delta.get(c.id) >= 0) { assert.equal(c.budget, expected, c.id); checked++; }
  }
  assert.ok(checked > 20, "clubes verificados: " + checked);
  assert.ok(executed().every((d) => d.budgetApplied === true));
});

test("34F.19 (6) estado com mercado ativo valida e sobrevive a ida e volta JSON", () => {
  assert.doesNotThrow(() => Save.validate(s));
  const back = JSON.parse(JSON.stringify(s));
  assert.doesNotThrow(() => Save.validate(back));
  assert.equal(JSON.stringify(back.worldLiveMarket), JSON.stringify(s.worldLiveMarket));
});

test("34F.19 (7) executeCompleted aceita canExecute e cancela com o motivo, sem mover o jogador", () => {
  const t = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, 77);
  const players = G.activePlayers(t).filter((p) => p.id !== "hero" && p.clubId && String(p.clubId).startsWith("gf_fc27_"));
  const p = players[0], to = t.globalFootball.clubs.find((c) => c.id !== p.clubId);
  const deal = M.createDeal(t, { playerId: p.id, fromClubId: p.clubId, toClubId: to.id, value: 1000000, salary: 5000, state: "completed", startDay: 0 });
  t.day = 10;
  const r = M.executeCompleted(t, { windowOpen: () => true, canExecute: () => "squad-minimum" });
  assert.deepEqual([...r.cancelled], [deal.id]);
  assert.equal(M.getDeal(t, deal.id).cancellationReason, "squad-minimum");
  assert.equal(G.playerById(t, p.id).clubId, p.clubId);
});
