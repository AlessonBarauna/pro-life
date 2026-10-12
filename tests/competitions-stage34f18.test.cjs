"use strict";
// Stage 34F.18 - cobertura de competicoes FC 27: o que e jogavel, o que e grupo regional e o que e so catalogo.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js");
const View = require("../src/ui/world-competitions-view.js");
const W = D.WorldClubCompetitions;
const manifest = require("../src/data/fc27/fc27-manifest-v1.json");
const fc27 = (seed = 3418) => D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed);

test("34F.18 (1) cobertura: 49 ligas classificadas; 36 jogaveis, 13 so catalogo, sem clubes inventados", () => {
  const s = fc27(), rows = W.coverage(s);
  assert.equal(rows.length, 49);
  assert.equal(rows.filter((r) => r.status !== "catalog_only").length, 36);
  const only = rows.filter((r) => r.status === "catalog_only");
  assert.equal(only.length, 13);
  for (const r of only) { assert.ok(r.clubCount >= 1 && r.clubCount < 10, r.leagueId); assert.match(r.note, /Somente cat/); assert.match(r.note, /ficticio/); assert.equal(r.rounds, 0); }
  // contagens batem com o manifesto oficial do projeto
  for (const r of rows) assert.equal(r.clubCount, manifest.clubs.filter((c) => c.leagueId === r.leagueId).length, r.leagueId);
  assert.equal(s.globalFootball.clubs.length, 670, "nenhum clube criado nem removido");
  assert.equal(s.internationalPlayers.length, 17849);
});

test("34F.18 (2) grupos regionais sinalizados e consistentes com as ligas que realmente jogam", () => {
  const s = fc27(), rows = W.coverage(s), eligible = new Set(W.eligibleLeagues(s).map((l) => l.id));
  const regional = rows.filter((r) => r.status === "regional_pool").map((r) => r.leagueId).sort();
  assert.deepEqual([...regional], ["gf_fc27_conmebol_libertadores", "gf_fc27_conmebol_sudamericana"]);
  for (const r of rows) assert.equal(eligible.has(r.leagueId), r.status !== "catalog_only", r.leagueId);
  const mls = rows.find((r) => r.leagueId === "gf_fc27_mls");
  assert.equal(mls.rounds, 58); assert.match(mls.note, /simplificado/);
  assert.equal(rows.find((r) => r.leagueId === "gf_fc27_premier_league").rounds, 38);
  assert.equal(rows.find((r) => r.leagueId === "gf_fc27_premier_league").note, "");
});

test("34F.18 (3) coverage() so le: nao altera o estado/save", () => {
  const s = fc27(), before = JSON.stringify(s);
  W.coverage(s); W.coverage(s);
  assert.equal(JSON.stringify(s), before);
});

test("34F.18 (4) a tela mostra a cobertura e as ligas sem calendario com o motivo", () => {
  const s = fc27(); W.init(s);
  const html = View.render(s, D, {});
  assert.match(html, /data-world-coverage/);
  assert.match(html, /36 de 49 ligas com calend/);
  assert.match(html, /Somente cat/);
  assert.match(html, /Hellas Liga/);
  const snap = View.snapshot(s, D, {});
  assert.equal(snap.coverage.length, 49);
});

test("34F.18 (5) todas as ligas jogaveis tem calendario integro e uma temporada fecha com campeao", () => {
  const s = fc27(); W.init(s);
  const integrity = W.integrity(s);
  assert.equal(integrity.ok, true, integrity.issues.join("; "));
  assert.equal(integrity.leagues, 36);
  for (const l of W.eligibleLeagues(s)) {
    const ids = s.globalFootball.worldCompetitions.leagues[l.id].clubIds, sched = W.makeSchedule(ids);
    assert.equal(sched.length, 2 * (ids.length % 2 ? ids.length : ids.length - 1), l.id);
  }
  W.closeSeason(s);
  const history = W.history(s);
  assert.equal(history.length, 36, "uma entrada de campeao por liga jogavel");
  const ids = new Set(history.map((h) => h.leagueId));
  for (const r of W.coverage(s)) assert.equal(ids.has(r.leagueId), r.status !== "catalog_only", r.leagueId);
  for (const h of history) assert.ok(h.championId, h.leagueId);
});

test("34F.18 (6) liga brasileira local preservada (clubes locais seguem fora do mundo FC 27)", () => {
  const s = fc27();
  assert.ok((s.clubs || []).length > 0);
  assert.ok(s.clubs.some((c) => c.id === "c0"));
});
