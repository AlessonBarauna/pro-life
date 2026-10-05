#!/usr/bin/env node
"use strict";
// Etapa 15 — simulação automatizada do mundo vivo (padrão: 20 temporadas) com verificação de sanidade.
// Uso: node tools/sim-universe.cjs [--seasons 20] [--seed 7] [--mode coach|player] [--json arquivo.json]
// "coach" (padrão) não executa o treino diário do protagonista e por isso é muito mais rápido; o universo é o mesmo.
const D = require("../src/domain/engine.js");
const U = D.World2;
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const SEASONS = Number(arg("seasons", 20)), SEED = Number(arg("seed", 7)), MODE = arg("mode", "coach"), JSON_OUT = arg("json", "");

const hashState = (s) => U.snapshotHash(s, D);
function build() {
  if (MODE === "player") {
    const draft = D.create({ mode: "player", pos: "ATA", origin: "academy", creation: {} }, SEED);
    return D.create({ mode: "player", pos: "ATA", origin: "academy", creation: {}, clubId: draft.offers[0].clubId }, SEED);
  }
  return D.create({ mode: "coach" }, SEED);
}
function playSeason(s) {
  if (MODE === "player") { D.simulateAdvance(s, "season"); return; }
  const y = s.season; while (s.season === y) D.advance(s, 1);
}
const started = Date.now(), s = build(), rows = [], problems = [];
const first = U.audit(s, D);
for (let i = 1; i <= SEASONS; i++) {
  const t0 = Date.now(), before = s.universe.transferCount;
  playSeason(s);
  const a = U.audit(s, D), u = s.universe, sum = u.summary || {};
  const champ = s.history.find((h) => h.season === s.season - 1 && h.leagueId === "serieA");
  const award = (s.statistics.seasons[0]?.awards || []).find((x) => /Artilheiro/.test(x.name) && /A/.test(String(x.league || x.competitionId)));
  rows.push({ season: s.season - 1, players: a.players, free: a.free, avgAge: a.avgAge, avgOvr: a.avgOvr, maxOvr: a.maxOvr, over90: a.over90, retired: sum.retired ?? 0, generated: sum.generated ?? 0, moves: u.transferCount - before, champion: champ?.champion || "—", scorer: award ? `${award.winner} (${award.value})` : "—", ms: Date.now() - t0, byLeague: a.byLeague });
  if (a.dupIds.length) problems.push(`T${i}: IDs duplicados ${a.dupIds.slice(0, 3)}`);
  if (a.retiredActive.length) problems.push(`T${i}: aposentado ativo ${a.retiredActive.slice(0, 3)}`);
  if (a.badAge.length) problems.push(`T${i}: idade absurda em ${a.badAge.slice(0, 3)}`);
  if (a.gkLess.length) problems.push(`T${i}: clubes sem goleiro ${a.gkLess.slice(0, 3)}`);
  if (a.players < 1200 || a.players > 3600) problems.push(`T${i}: população fora da faixa (${a.players})`);
  if (a.over90 > 45 || a.maxOvr > 97) problems.push(`T${i}: OVR absurdo (max ${a.maxOvr}, >=90: ${a.over90})`);
  if (a.avgOvr < 50 || a.avgOvr > 80) problems.push(`T${i}: overall médio fora da faixa (${a.avgOvr})`);
  if (a.avgAge < 20 || a.avgAge > 31) problems.push(`T${i}: idade média fora da faixa (${a.avgAge})`);
}
// transferências duplicadas na mesma janela e jogador em dois lugares
const seen = new Map(), moves = s.universe.transfers.filter((t) => t.type !== "release");
for (const t of moves) { const k = `${t.season}|${t.window}|${t.id}`; seen.set(k, (seen.get(k) || 0) + 1); }
for (const [k, n] of seen) if (n > 1) problems.push(`transferência duplicada na janela: ${k}`);
const nat = D.NationalTeam; let squadOk = true;
const retiredIds = s.universe.retiredIds || {};
const inClubs = new Set(); for (const c of s.clubs) for (const p of c.roster) inClubs.add(p.id);
if (Object.keys(retiredIds).some((id) => inClubs.has(id) || s.universe.free.some((p) => p.id === id))) { squadOk = false; problems.push("aposentado reapareceu em elenco/mercado"); }

const pad = (v, n) => String(v).padEnd(n);
console.log(`\nSimulação do universo · modo ${MODE} · seed ${SEED} · ${SEASONS} temporadas`);
console.log(pad("Temp", 6) + pad("Jog", 6) + pad("Livres", 7) + pad("Idade", 7) + pad("OVR", 6) + pad("Max", 5) + pad("90+", 5) + pad("Apos", 6) + pad("Novos", 7) + pad("Mov", 6) + pad("Campeão Série A", 24) + "Artilheiro");
for (const r of rows) console.log(pad(r.season, 6) + pad(r.players, 6) + pad(r.free, 7) + pad(r.avgAge, 7) + pad(r.avgOvr, 6) + pad(r.maxOvr, 5) + pad(r.over90, 5) + pad(r.retired, 6) + pad(r.generated, 7) + pad(r.moves, 6) + pad(r.champion, 24) + r.scorer);
const champs = new Set(rows.map((r) => r.champion)), last = rows[rows.length - 1];
console.log(`\nCampeões distintos da Série A: ${champs.size} · OVR médio por divisão (final): ${JSON.stringify(last?.byLeague)}`);
console.log(`Início: ${first.players} jogadores, idade ${first.avgAge}, OVR ${first.avgOvr}, max ${first.maxOvr} | Fim: ${last.players} jogadores, idade ${last.avgAge}, OVR ${last.avgOvr}, max ${last.maxOvr}`);
console.log(`Aposentados no total: ${s.universe.retiredCount} · jovens gerados: ${s.universe.generatedCount} · movimentações registradas: ${s.universe.transferCount}`);
console.log(`Hash do universo: ${hashState(s)} · tempo: ${((Date.now() - started) / 1000).toFixed(1)}s`);
if (JSON_OUT) require("fs").writeFileSync(JSON_OUT, JSON.stringify({ seed: SEED, mode: MODE, rows, problems, hash: hashState(s) }, null, 1));
if (problems.length) { console.log("\nPROBLEMAS DE SANIDADE:"); for (const p of problems.slice(0, 30)) console.log(" - " + p); process.exit(1); }
console.log("\nSANIDADE OK: sem IDs duplicados, sem jogador em dois clubes, sem aposentados ativos, idades e OVR plausíveis.");
