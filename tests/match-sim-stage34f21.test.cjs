"use strict";
// Stage 34F.21 - simulacao dos jogos da IA no mundo FC 27: forca acompanha o elenco e distribuicao de resultados coerente.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"), Save = require("../src/infrastructure/save.js");
const W = D.WorldClubCompetitions;
const fc27 = (seed = 2121, mode = "coach") => D.create({ mode, clubId: "c0", catalogVersion: "fc27_v1" }, seed);

test("34F.21 (1) forca no inicio da carreira e identica a original; so clubes do catalogo com forca definida sao tocados", () => {
  const s = fc27(), before = new Map(s.globalFootball.clubs.map((c) => [c.id, c.strength]));
  assert.equal(W.refreshStrengths(s), 0);
  for (const c of s.globalFootball.clubs) assert.equal(c.strength, before.get(c.id), c.id);
  const ext = { id: "gf_ext_test", name: "Externo", leagueId: "x", active: true };
  s.globalFootball.clubs.push(ext);
  s.internationalPlayers.push({ ...s.internationalPlayers[0], id: "ext-p1", clubId: "gf_ext_test", ovr: 90, overall: 90 });
  W.refreshStrengths(s);
  assert.equal(ext.strength, undefined, "clube externo sem forca nao e alterado");
});

test("34F.21 (2) enfraquecer o elenco reduz a forca pela mesma formula (media dos 16 melhores, 30..99)", () => {
  const s = fc27(), club = s.globalFootball.clubs.find((c) => c.id === "gf_fc27_243");
  const mine = s.internationalPlayers.filter((p) => p.clubId === club.id);
  for (const p of mine) { p.ovr = 60; p.overall = 60; }
  assert.equal(W.refreshStrengths(s), 1);
  assert.equal(club.strength, 60);
  mine.slice(0, 3).forEach((p) => { p.status = "retired"; });
  W.refreshStrengths(s);
  assert.equal(club.strength, 60);
  mine.forEach((p) => { p.ovr = 100; p.overall = 100; p.status = "active"; });
  W.refreshStrengths(s);
  assert.equal(club.strength, 99, "limite maximo 99");
});

test("34F.21 (3) a forca e atualizada antes das rodadas (jogo diario) e mundos que nao sao FC 27 nao mudam", () => {
  const s = fc27(), club = s.globalFootball.clubs.find((c) => c.id === "gf_fc27_243");
  for (const p of s.internationalPlayers.filter((x) => x.clubId === club.id)) { p.ovr = 55; p.overall = 55; }
  const original = club.strength;
  for (let i = 0; i < 40; i++) D.advance(s, 1);
  assert.ok(club.strength < original, `${club.strength} < ${original}`);
  const legacy = D.create({ mode: "coach", clubId: "c0" }, 5);
  assert.equal(W.refreshStrengths(legacy), 0);
});

test("34F.21 (4) distribuicao de resultados de uma temporada completa e realista e favoritos vencem mais", () => {
  const s = fc27(); W.init(s); W.closeSeason(s);
  const strength = new Map(s.globalFootball.clubs.map((c) => [c.id, c.strength]));
  let n = 0, goals = 0, hw = 0, dw = 0, aw = 0, fav = 0, favN = 0, big = 0, bigN = 0;
  for (const [lid, st] of Object.entries(s.globalFootball.worldCompetitions.leagues)) {
    const sched = W.makeSchedule(st.clubIds);
    for (const [r, p, hg, ag] of st.scores) {
      const [h, a] = sched[r][p], d = strength.get(h) - strength.get(a);
      n++; goals += hg + ag; if (hg > ag) hw++; else if (hg === ag) dw++; else aw++;
      if (Math.abs(d) >= 8) { favN++; if ((d > 0 && hg > ag) || (d < 0 && ag > hg)) fav++; }
      if (Math.abs(d) >= 12) { bigN++; if ((d > 0 && hg > ag) || (d < 0 && ag > hg)) big++; }
    }
  }
  assert.ok(n > 9000, "jogos: " + n);
  const gpg = goals / n; assert.ok(gpg > 2.2 && gpg < 2.7, "gols/jogo " + gpg);
  assert.ok(hw / n > 0.38 && hw / n < 0.48, "mandante " + hw / n);
  assert.ok(dw / n > 0.22 && dw / n < 0.31, "empate " + dw / n);
  assert.ok(aw / n > 0.25 && aw / n < 0.36, "visitante " + aw / n);
  assert.ok(fav / favN > 0.52 && fav / favN < 0.72, "favorito (8+) " + fav / favN);
  assert.ok(big / bigN >= fav / favN - 0.02, "favoritos maiores vencem pelo menos tanto quanto os menores");
});

test("34F.21 (5) mesma semente, mesmo campeonato; estado final valida e sobrevive a ida e volta JSON", () => {
  const a = fc27(77), b = fc27(77);
  W.init(a); W.init(b); W.closeSeason(a); W.closeSeason(b);
  assert.equal(JSON.stringify(W.history(a).map((h) => [h.leagueId, h.championId])), JSON.stringify(W.history(b).map((h) => [h.leagueId, h.championId])));
  assert.doesNotThrow(() => Save.validate(a));
  const back = JSON.parse(JSON.stringify(a));
  assert.doesNotThrow(() => Save.validate(back));
});
