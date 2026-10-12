"use strict";
// Stage 34F.30A - nacionalidade dinamica, selecao correta e interface "Minha selecao".
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
const NI = require("../src/domain/national-identity.js"), H = require("../src/ui/national-hub-view.js");
const visible = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, "");
const BAD = /null|undefined|NaN|\[object|Ã[\u0080-¿]/;
const make = (nat, mode = "player", seed = 5) => { const s = D.create({ mode, clubId: "c0", catalogVersion: "fc27_v1" }, seed); if (mode === "player") s.person.nationality = nat; return s; };
const tabs = H.TABS.map((x) => x[0]);

test("34F.30A (1) resolvedor: aliases pt/en/ISO para os codigos corretos", () => {
  for (const [v, c] of [["Espanha", "ESP"], ["Spain", "ESP"], ["ESP", "ESP"], ["Brasil", "BRA"], ["Brazil", "BRA"], ["Argentina", "ARG"], ["França", "FRA"], ["France", "FRA"], ["Portugal", "POR"], ["Inglaterra", "ENG"], ["England", "ENG"], ["Alemanha", "GER"], ["Germany", "GER"], ["Itália", "ITA"], ["Italy", "ITA"]])
    assert.equal(NI.codeOf(v), c, v);
});

test("34F.30A (2) jogador espanhol -> Espanha em toda a tela (nada de Brasil como destaque)", () => {
  const s = make("Espanha"); const t = NI.heroTeam(s, D);
  assert.equal(t.code, "ESP"); assert.ok(t.represented); assert.equal(t.confederation, "UEFA");
  H.setClassic(false);
  for (const tab of tabs) {
    H.setTab(tab); const h = visible(H.render(s, D));
    assert.ok(h.includes("Espanha"), tab); assert.ok(!BAD.test(h), `${tab}: ${(h.match(BAD) || [])[0]}`);
    assert.ok(!/Grupo do Brasil|Seleção Brasileira · /.test(h), tab);
    assert.ok(!h.includes("data-nh-classic"), "sem atalho da visao brasileira");
  }
});

test("34F.30A (3) jogador brasileiro -> Brasil, com acesso a visao completa", () => {
  const s = make("Brasil"); assert.equal(NI.heroTeam(s, D).code, "BRA");
  H.setTab("geral"); const h = H.render(s, D); assert.ok(h.includes("Brasil") && h.includes('data-nh-classic="1"'));
});

test("34F.30A (4) outras nacionalidades: selecao correta ou indisponibilidade explicita, sem fallback Brasil", () => {
  const arg = make("Argentina"); assert.equal(NI.heroTeam(arg, D).code, "ARG");
  for (const nat of ["Thailand", "", null]) {
    const s = make(nat); const t = NI.heroTeam(s, D);
    assert.ok(!t.represented && t.reason, String(nat)); assert.notEqual(t.code, "BRA");
    const h = visible(H.render(s, D)); assert.ok(h.includes("SELEÇÃO NÃO DISPONÍVEL"));
    assert.ok(!/Seleção Brasileira|Grupo do Brasil/.test(h));
    assert.equal(s.person.nationality, nat, "nacionalidade real preservada");
  }
});

test("34F.30A (5) treinador sem selecao atribuida nao presume nacionalidade", () => {
  const s = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, 5);
  assert.equal(NI.coachTeam(s).assigned, false);
  const h = visible(H.render(s, D)); assert.ok(h.includes("Sem vínculo")); assert.ok(!/Brasil/.test(h));
});

test("34F.30A (6) elenco coerente: 11 titulares, reservas, sem duplicados e sem 0 titulares", () => {
  for (const nat of ["Espanha", "Argentina", "Portugal"]) {
    const s = make(nat), q = NI.squad(s, D, NI.heroTeam(s, D));
    assert.ok(q.squad.length >= 23, nat); assert.equal(q.starters.length, 11, nat); assert.ok(q.bench.length >= 8, nat);
    assert.equal(q.starters.length + q.bench.length, q.squad.length);
    const ids = q.squad.map((p) => p.id); assert.equal(new Set(ids).size, ids.length, "sem duplicados");
    assert.equal(q.starters.filter((p) => p.pos === "GOL").length, 1);
  }
});

test("34F.30A (7) selecao fora da Copa monta elenco do catalogo por nacionalidade", () => {
  const s = make("Republic of Ireland"); assert.ok(NI.heroTeam(s, D).represented, "Irlanda tem selecao pelo mecanismo global"); const t = NI.resolve("Italia", s, D);
  const q = NI.squad(s, D, { ...t, code: t.code });
  assert.ok(q.squad.length >= 11); assert.equal(q.starters.length, 11);
});

test("34F.30A (8) Copa: grupo e jogos sao os da selecao do protagonista", () => {
  const s = make("Espanha"); const wc = NI.worldCupOf(s, D, NI.heroTeam(s, D));
  assert.ok(wc && wc.qualified && wc.group); assert.ok(wc.table.some((r) => r.id === "ESP"));
  assert.ok(wc.matches.length >= 1 && wc.matches.every((m) => m.homeId === "ESP" || m.awayId === "ESP"));
  const b = NI.worldCupOf(make("Brasil"), D, NI.resolve("Brasil", make("Brasil"), D)); assert.ok(b.group);
});

test("34F.30A (9) disputa por posicao: ranking real do protagonista entre espanhois", () => {
  const s = make("Espanha"); const c = NI.competition(s, D, NI.heroTeam(s, D), 8);
  assert.ok(c.rank >= 1 && c.total >= c.rank); assert.ok(c.rows.length >= 8);
  assert.ok(c.rows.every((r, i, a) => i === 0 || r.hero || a[i - 1].hero || a[i - 1].overall >= r.overall));
});

test("34F.30A (10) estado, JSON e catalogo nao sao alterados pela tela; save/load preservam a selecao", () => {
  const s = make("Espanha"); const cat = () => D.GlobalFootball.allPlayers(s).filter((p) => String(p.id).startsWith("fc27_p_")).length; const players = cat(); const before = JSON.stringify(s.person);
  for (const tab of tabs) { H.setTab(tab); H.render(s, D); }
  assert.equal(JSON.stringify(s.person), before); assert.equal(cat(), players, "jogadores do catalogo FC27 intactos");
  const copy = JSON.parse(JSON.stringify(s)); assert.equal(NI.heroTeam(copy, D).code, "ESP");
  H.setTab("geral"); assert.ok(visible(H.render(copy, D)).includes("Espanha"));
});

test("34F.30A (11) save antigo sem nacionalidade nao vira Brasil nem quebra", () => {
  const s = make("Brasil"); delete s.person.nationality;
  const t = NI.heroTeam(s, D); assert.equal(t.code, null); assert.ok(t.reason);
  assert.ok(visible(H.render(s, D)).includes("SELEÇÃO NÃO DISPONÍVEL"));
});

test("34F.30A (12) render rapido com o catalogo completo", () => {
  const s = make("Espanha"); H.setTab("convocacao"); H.render(s, D); const t0 = Date.now();
  for (let i = 0; i < 10; i++) H.render(s, D); assert.ok((Date.now() - t0) / 10 < 150, `${(Date.now() - t0) / 10}ms`);
});
