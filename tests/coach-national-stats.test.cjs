"use strict";
// Jogos da seleção do treinador contam: gols/assistências entram nas estatísticas do ano (prêmios) e no calendário.
const test = require("node:test"), assert = require("node:assert/strict");
const E = require("../src/domain/engine.js");
const CN = E.CoachNational;
const WS = require("../src/domain/world-stats.js");
const Cal = require("../src/ui/calendar.js");
test("jogo da seleção: assistências, WorldStats e calendário", { timeout: 0 }, () => {
  const s = E.create({ mode: "coach", catalogVersion: "fc27_v1" }, 4242);
  s.clubId = null; E.join(s, "gf_fc27_5", 90000); s.reputation = 58;
  const code = CN.overview(s, E).nations.find((n) => n.eligible).code;
  s.coachNational.offers.push({ code, name: code, received: s.day, expires: s.day + 45 });
  CN.acceptOffer(s, E, code);
  CN.confirmCallup(s, E);
  const cn = s.coachNational;
  let played = 0;
  for (let i = 0; i < 6 && played < 3; i++) {
    const fx = cn.schedule.find((m) => !m.played);
    if (!fx) break;
    s.day = fx.day - 1; CN.syncCallup(s, E, false);
    E.advance(s, 2);
    played = cn.matches.length;
  }
  assert.ok(played >= 1, "ao menos um jogo disputado");
  assert.equal(cn.record.w + cn.record.d + cn.record.l, played, "campanha da seleção acumulada");
  const goals = Object.values(cn.stats).reduce((n, x) => n + (x.goals || 0), 0);
  const ast = Object.values(cn.stats).reduce((n, x) => n + (x.assists || 0), 0);
  assert.equal(cn.record.gf, goals, "gols da campanha = gols dos atletas");
  assert.ok(ast <= goals);
  const L = s.globalFootball.worldStats.leagues.nat;
  assert.ok(L && L.n === played, "jogos entram no acumulador anual de seleções");
  const evs = Cal.events(s, E).filter((e) => e.type === "national" && /vitória|derrota|empate/.test(e.detail));
  assert.ok(evs.length >= 1, "jogo disputado continua no calendário do ano");
});
