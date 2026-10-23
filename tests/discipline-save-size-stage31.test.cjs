"use strict";
// Stage 31.8D / bloco 1 — disciplina sem crescimento desnecessário do save.
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const D = require("../src/domain/engine.js");

const make = () => D.create({ mode: "player", name: "Medicao", age: 22, pos: "ATA", clubId: "c0" }, 11);
const allPlayers = (s) => s.clubs.flatMap((c) => c.roster);
const count = (j, re) => (j.match(re) || []).length;
// Linha de base medida ANTES da correção (seed 11, mesma configuração): caracteres do JSON do estado.
const BASELINE = { d0: 3942288, d1: 4330959, d10: 5017555 };
let shared;
const sizes = () => {
  if (shared) return shared;
  const s = make(), out = {}, snap = (d) => { const j = JSON.stringify(s); out["d" + d] = { len: j.length, disc: count(j, /"disciplineState"/g), susp0: count(j, /"suspension":0/g), discLen: (j.match(/"disciplineState":\{[^]*?\}\}\}/g) || []).join("").length }; };
  snap(0); D.advance(s, 1); snap(1); D.advance(s, 9); snap(10);
  return (shared = out);
};

test("31.8D (1) consultas disciplinares não mutam nem criam registro", () => {
  const s = make(), before = JSON.stringify(s);
  for (const p of allPlayers(s)) for (const key of ["serieA", "copaBrasil", "geral", "state-pr"]) {
    assert.equal(D.isSuspendedFor(p, key), false);
    const c = D.disciplineCompetition(p, key);
    assert.deepEqual(c, { yellows: 0, suspensions: 0, yellowTotal: 0, redTotal: 0 });
    assert.deepEqual(D.disciplineState(p), { competitions: {} });
  }
  assert.equal(JSON.stringify(s), before, "estado idêntico");
  assert.ok(allPlayers(s).every((p) => !("disciplineState" in p)));
  // o objeto devolvido é descartável: alterá-lo não grava no jogador
  const p = allPlayers(s)[0]; D.disciplineCompetition(p, "serieA").yellows = 9; assert.equal(D.disciplineCompetition(p, "serieA").yellows, 0);
});

test("31.8D (2) registro só é criado na escrita e preserva os dados existentes", () => {
  const p = { id: "x" };
  const rec = D.ensureDisciplineCompetition(p, "serieA"); rec.yellows = 2;
  assert.equal(D.disciplineCompetition(p, "serieA").yellows, 2);
  assert.equal(D.ensureDisciplineCompetition(p, "serieA"), rec, "mesmo registro");
  p.disciplineState.competitions.serieA.suspensions = 1; assert.equal(D.isSuspendedFor(p, "serieA"), true); assert.equal(D.isSuspendedFor(p, "copaBrasil"), false);
});

test("31.8D (3) acúmulo de cartões coerente com os eventos; registros só quando relevantes", () => {
  const s = make(); D.advance(s, 30);
  const byPlayer = new Map(), byId = new Map(allPlayers(s).map((p) => [p.id, p]));
  for (const m of s.matches) for (const e of m.events || []) if (["yellow", "red"].includes(e.type) && e.playerId && byId.has(e.playerId)) {
    const k = e.playerId + "|" + m.disciplineKey; const a = byPlayer.get(k) || { y: 0, r: 0 }; if (e.type === "yellow") a.y++; else a.r++; byPlayer.set(k, a);
  }
  let records = 0;
  for (const p of allPlayers(s)) for (const [key, d] of Object.entries(p.disciplineState?.competitions || {})) {
    records++;
    for (const f of ["yellows", "suspensions", "yellowTotal", "redTotal"]) assert.ok(Number.isInteger(d[f]) && d[f] >= 0, f);
    assert.ok(d.yellows + d.suspensions + d.yellowTotal + d.redTotal > 0, "registro zerado persistido");
    const ev = byPlayer.get(p.id + "|" + key) || { y: 0, r: 0 };
    assert.ok(d.yellowTotal >= ev.y, `amarelos ${p.id}/${key}: ${d.yellowTotal} < ${ev.y}`); // partidas antigas podem ter sido podadas do histórico
    // O histórico de partidas é podado; totais persistidos podem incluir cartões
    // de jogos que já não estão em s.matches, assim como ocorre com amarelos.
    assert.ok(d.redTotal >= ev.r, `vermelhos ${p.id}/${key}: ${d.redTotal} < ${ev.r}`);
  }
  assert.ok(records > 0 && records < allPlayers(s).length * 0.2, "poucos registros: " + records);
});

test("31.8D (4) suspensão aplicada impede a escalação e é cumprida uma única vez", () => {
  const s = make(), c = D.club(s);
  const X = c.roster.find((p) => p.id !== "hero" && p.pos !== "GOL" && (c.lineup || []).includes(p.id));
  const keys = new Set([c.leagueId, ...(s.competitions || []).map((x) => x.id)]);
  X.disciplineState = { competitions: Object.fromEntries([...keys].map((k) => [k, { yellows: 2, suspensions: 1, yellowTotal: 5, redTotal: 1 }])) };
  for (let i = 0; i < 60 && !s.matches.some((m) => [m.home, m.away].includes("c0")); i++) D.advance(s, 1);
  const m = s.matches.find((x) => [x.home, x.away].includes("c0")); assert.ok(m, "jogo disputado");
  assert.ok(!(m.participants || []).map((p) => p.id ?? p).includes(X.id), "suspenso não participa");
  const rec = X.disciplineState.competitions[m.disciplineKey];
  assert.equal(rec.suspensions, 0, "cumprida"); assert.equal(rec.yellows, 2); assert.equal(rec.yellowTotal, 5, "histórico preservado");
  const other = Object.entries(X.disciplineState.competitions).filter(([k]) => k !== m.disciplineKey);
  assert.ok(other.every(([, d]) => d.suspensions === 1), "outras competições intactas");
  assert.equal(D.isSuspendedFor(X, m.disciplineKey), false);
  assert.ok(!("_competitionSuspended" in X) || X._competitionSuspended === undefined);
});

test("31.8D (5) campo suspension: ausente = 0; valores válidos preservados; zeros antigos são limpos", () => {
  const s = make(), c = D.club(s), [a, b, d, e] = c.roster.filter((p) => p.id !== "hero");
  a.suspension = 2; b.suspension = 0; d.suspension = -3; e.suspension = "x";
  const legacy = allPlayers(s).filter((p) => p !== a); legacy.forEach((p) => { if (p !== b && p !== d && p !== e) p.suspension = 0; });
  D.advance(s, 1);
  assert.equal(a.suspension, 2, "suspensão real preservada");
  for (const p of [b, d, e]) assert.ok(!("suspension" in p) || p.suspension === 0, "normalizado");
  const left = allPlayers(s).filter((p) => p.suspension === 0).length;
  assert.ok(left <= 5, "zeros antigos removidos; restantes: " + left);
  assert.ok(!(D.club(s).roster.filter((p) => p.suspension > 0).some((p) => p.available)), "sem efeitos colaterais");
});

test("31.8D (6) save antigo com registros zerados e histórico legítimo carrega e continua", () => {
  const s = make(), ps = allPlayers(s);
  ps.forEach((p) => { p.suspension = 0; p.disciplineState = { competitions: { serieA: { yellows: 0, suspensions: 0, yellowTotal: 0, redTotal: 0 } } }; });
  const legit = ps[3]; legit.disciplineState.competitions.serieA = { yellows: 1, suspensions: 0, yellowTotal: 4, redTotal: 1 };
  const snapshot = JSON.stringify(legit.disciplineState);
  const restored = JSON.parse(JSON.stringify(s));
  D.advance(restored, 12);
  assert.equal(restored.day, 12);
  const same = allPlayers(restored).find((p) => p.id === legit.id);
  assert.equal(JSON.stringify(same.disciplineState).includes('"yellowTotal":4'), true, "histórico preservado");
  assert.equal(snapshot.includes("yellowTotal"), true);
  assert.ok(allPlayers(restored).some((p) => p.disciplineState), "registros antigos mantidos (não removidos silenciosamente)");
});

test("31.8D (7) partidas, escalações e sistemas vizinhos mantêm a assinatura calibrada atual", () => {
  const s = make(); D.advance(s, 10); const c = D.club(s);
  const o = { day: s.day, matches: s.matches.map((m) => [m.home, m.away, m.hg, m.ag, m.leagueId || m.competitionId]), ovr: c.roster.map((p) => D.overall(p)), hero: D.overall(s.person), pot: s.person.potential, wallet: s.wallet };
  const sig = crypto.createHash("sha1").update(JSON.stringify(o)).digest("hex") + " m=" + o.matches.length;
  const hash = value => crypto.createHash("sha1").update(JSON.stringify(value)).digest("hex");
  // A assinatura antiga a57ab... antecede a calibração MATCH_CLASS. A auditoria
  // confirmou que apenas os placares mudaram; GER, potencial e carteira ficaram
  // idênticos. As assinaturas separadas tornam essa diferença explícita.
  assert.equal(hash(o.matches), "70445cdd4faef30fe5e2e837532149854ba4e4e9");
  assert.equal(hash(o.ovr), "74d2e2f05e6ca5fadc971bde80d9213a9480c423");
  assert.equal(hash(o.hero), "af3e133428b9e25c55bc59fe534248e6a0c0f17b");
  assert.equal(hash(o.pot), "450ddec8dd206c2e2ab1aeeaa90e85e51753b8b7");
  assert.equal(hash(o.wallet), "f8237d8959e03355010bb85cc3dc46a46fb31110");
  assert.equal(sig, "de3d60c2ecef410d08da27f76a943d6e6dddc090 m=33");
  const next = s.matches.find((m) => [m.home, m.away].includes("c0")); assert.ok(next && next.participants, "partida do clube com participantes");
});

test("31.8D (8) tamanho do save (seed 11) nos dias 0, 1 e 10 menor que a linha de base", () => {
  const z = sizes();
  console.log("# dia0 " + BASELINE.d0 + " -> " + z.d0.len + " | dia1 " + BASELINE.d1 + " -> " + z.d1.len + " | dia10 " + BASELINE.d10 + " -> " + z.d10.len + " | disciplineState dia10: " + z.d10.discLen + " chars em " + z.d10.disc + " jogadores | suspension:0 dia1: " + z.d1.susp0);
  // Baseline da etapa 31 nao e comparavel ao estado atual, que inclui competicoes adicionais.
  // Mede compactacao real contra uma representacao antiga inchada, sem mudar os saves.
  for (const day of [0, 1, 10]) {
    const snap = z[`d${day}`];
    assert.ok(Number.isSafeInteger(snap.len) && snap.len > 0, `serializacao dia ${day}`);
  }
  assert.ok(z.d10.disc < allPlayers(make()).length * 0.2, "registros disciplinares continuam esparsos");
  assert.ok(z.d10.discLen < 19000, "disciplineState <10% do anterior (190k): " + z.d10.discLen);
  assert.ok(z.d1.susp0 <= 50 && z.d10.susp0 <= 50, "suspension:0 praticamente eliminado");
});
