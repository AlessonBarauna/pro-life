"use strict";
// Stage 34F.32A - infraestrutura continental: associacoes, vagas por merito, edicoes persistidas, calendario sem conflito.
const test = require("node:test"), assert = require("node:assert/strict");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js"); global.ProLifeNationalIdentity = require("../src/domain/national-identity.js");
global.ProLifeCareerContext = require("../src/domain/career-context.js"); global.ProLifeWorldStats = D.WorldStats;
global.ProLifeStatistics = D.Statistics; global.ProLifeCompetitions = D.Competitions; global.ProLifeContinental = D.Continental;
const C = D.Continental, NI = global.ProLifeNationalIdentity, Hub = require("../src/ui/competitions-hub-view.js");
const MADRID = "gf_fc27_243", BAD = /null|undefined|NaN|\[object|gf_fc27/;
const visible = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, "").replace(/(value|data-[a-z-]+)="[^"]*"/g, "");
const make = (seed = 5, club = "c0") => { const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, seed); if (club !== "c0") D.movePlayerToClub(s, club); return s; };
let shared = null; const S = () => shared || (shared = make());
const ids = (e) => e.entrants.map((x) => x[0]);

test("34F.32A (1) sorteio/inscricoes deterministicos: mesma carreira, mesmas edicoes", () => {
  const a = C.init(make(5)), b = C.init(make(5));
  assert.equal(JSON.stringify(a), JSON.stringify(b)); assert.ok(a.length === 5);
});

test("34F.32A (2) participantes elegiveis: clubes reais, do pais/associacao correta, sem ids inventados", () => {
  const s = S();
  for (const e of C.editions(s, s.season)) for (const [id, code] of e.entrants) {
    const club = (s.clubs || []).find((c) => c.id === id) || s.globalFootball.clubs.find((c) => c.id === id); assert.ok(club, `${e.comp}:${id}`);
    const conf = NI.confederationOf(code); assert.equal(conf, C.COMPS[e.comp].conf, `${e.comp} ${code}`);
  }
});

test("34F.32A (3) vagas por associacao seguem a regra e o ranking (posicoes consecutivas, sem pular)", () => {
  const s = S(), ucl = C.edition(s, "ucl"), by = {};
  for (const [id, code, via, pos] of ucl.entrants) (by[code] = by[code] || []).push(pos);
  assert.deepEqual(by.ENG.filter(x=>x<=4), [1,2,3,4]);
    assert.deepEqual(by.ESP.filter(x=>x<=4), [1,2,3,4]);
    assert.equal(by.ENG.length,5);
    assert.equal(by.ESP.length,5);
    assert.equal(ucl.entrants.filter(x=>x[2]==="vaga-complementar").length,2);
  const uel = C.edition(s, "uel"); const eng = uel.entrants.filter((x) => x[1] === "ENG").map((x) => x[3]); assert.deepEqual(eng.filter(x=>x<=7), [5,6,7], "Europa League preserva as vagas originais"); assert.deepEqual(uel.entrants.filter(x=>x[1]==="ENG"&&x[2]==="vaga-complementar").map(x=>x[3]), [10], "Vaga complementar inglesa identificada");
  const lib = C.edition(s, "lib"); assert.equal(lib.entrants.filter((x) => x[1] === "BRA").length, 6); assert.equal(lib.entrants.filter((x) => x[1] === "ARG").length, 6);
  const sud = C.edition(s, "sud"); assert.deepEqual(sud.entrants.filter((x) => x[1] === "BRA").map((x) => x[3]), [7, 8, 9, 10, 11, 12]);
});

test("34F.32A (4) nenhum clube duplicado dentro da edicao nem entre competicoes incompativeis", () => {
  const s = S(); const e = (c) => ids(C.edition(s, c));
  for (const c of ["ucl", "uel", "uecl", "lib", "sud"]) assert.equal(new Set(e(c)).size, e(c).length, c);
  for (const [a, b] of [["ucl", "uel"], ["ucl", "uecl"], ["uel", "uecl"], ["lib", "sud"]]) assert.equal(e(a).filter((x) => e(b).includes(x)).length, 0, `${a}/${b}`);
});

test("34F.32A (5) limitacao por falta de clubes: edicao adaptada com motivo, nunca completada com ficticios", () => {
  const s = S(); const ed = C.edition(s, "uecl");
  assert.equal(ed.status, "ready"); assert.equal(ed.count, 36);
  assert.ok(ed.reasons.some((r) => /clubes reais ainda livres/.test(r))); assert.ok(ed.reasons.some((r) => /adaptada/i.test(r)));
});

test("34F.32A (6) calendario continental sem conflito (nenhum clube com dois jogos no mesmo dia)", () => {
  const s = S(); for (const c of ["ucl", "uel", "uecl"]) { const a = C.auditCalendar(s, C.edition(s, c)); assert.equal(a.conflicts, 0, c); assert.ok(a.checked > 100, c); }
  const w = C.windows(2026, "ucl"); assert.ok(w.every((d, i) => i === 0 || d > w[i - 1]) && w[0] >= 10 && w.at(-1) <= 340);
});

test("34F.32A (7) encerramento registra classificacoes finais de forma idempotente e a edicao seguinte usa o merito", () => {
  const s = make(5); const orders = { serieA: D.table(s, "serieA") };
  const f1 = JSON.stringify(C.closeSeason(s, { orders })), f2 = JSON.stringify(C.closeSeason(s, { orders })); assert.equal(f1, f2);
  const fin = s.continental.finals["2026"]; assert.ok(fin.BRA && fin.BRA.length >= 12 && fin.ENG);
  s.season = 2027; const lib = C.ensureEdition(s, "lib", 2027);
  assert.equal(lib.source, "previous_season"); assert.deepEqual(lib.entrants.filter((x) => x[1] === "BRA").map((x) => x[0]), fin.BRA.slice(0, 6));
});

test("34F.32A (8) protagonista so participa por merito; Real Madrid entra na Champions, clube nao classificado nao", () => {
  const rm = make(5, MADRID), e = C.heroEntries(rm); assert.ok(e.some((x) => x.comp === "ucl"));
  const s = make(5, "c0"); const ent = C.heroEntries(s); const inEd = ids(C.edition(s, "lib")).includes("c0"); assert.equal(ent.some((x) => x.comp === "lib"), inEd);
  const mid = make(5); mid.clubId = "gf_fc27_1598"; assert.ok(Array.isArray(C.heroEntries(mid)));
});

test("34F.32A (9) save/load e carreira legada: estado compacto, init idempotente, nada reescrito", () => {
  const s = make(5); const e1 = JSON.stringify(C.init(s)); const copy = JSON.parse(JSON.stringify(s));
  assert.equal(JSON.stringify(C.init(copy)), e1);
  // D.create prepara calendarios UEFA no dia zero; C.init reconstrui somente inscricoes.
  delete copy.continental;
  const reconstructed = C.init(copy);
  const registration = rows => rows.map(e => ({key:e.key,comp:e.comp,season:e.season,status:e.status,required:e.required,count:e.count,source:e.source,entrants:e.entrants,reasons:e.reasons,drawSeed:e.drawSeed,drawn:e.drawn}));
  assert.deepEqual(registration(reconstructed), registration(C.init(s)), "save legado recupera inscricoes e criterios originais");
  assert.equal(JSON.stringify(C.init(copy)), JSON.stringify(reconstructed), "reconstrucao idempotente");
  for (const comp of ["ucl", "uel", "uecl"]) {
    assert.ok(C.edition(s, comp).leagueSchedule || C.edition(s, comp).matches || C.edition(s, comp).conferenceState, `${comp}: edicao original preparada`);
  }
  assert.ok(JSON.stringify(s.continental).length < 60000, "persistencia compacta");
  const n = D.GlobalFootball.allPlayers(s).filter((p) => String(p.id).startsWith("fc27_p_")).length; assert.ok(n > 17000);
});

test("34F.32A (10) interface: inscritos reais, itens nao jogaveis rotulados, sem IDs internos", () => {
  const s = make(5, MADRID); Hub.setFilter("continent", "ALL"); Hub.setSection("continentais"); Hub.back();
  const h = Hub.render(s, D), v = visible(h);
  assert.ok(!BAD.test(v), (v.match(BAD) || [])[0]); assert.ok(/UEFA Champions League/.test(v) && /SEU CLUBE/.test(v));
  assert.ok(/Supercopa da UEFA/.test(v) && /Planejada/.test(v)); assert.ok(!/Jogável/.test(v), "nenhum torneio continental marcado como jogavel antes da simulacao");
  Hub.setSection("minhas"); Hub.back(); const m = visible(Hub.render(s, D)); assert.ok(/LALIGA/i.test(m) && /Champions/.test(m) && !/sem clube/i.test(m));
});

test("34F.32A (11) desempenho: criar as 5 edicoes e auditar calendario e rapido", () => {
  const s = make(7); const t0 = Date.now(); C.init(s); for (const c of ["ucl", "uel"]) C.auditCalendar(s, C.edition(s, c)); assert.ok(Date.now() - t0 < 2500, `${Date.now() - t0}ms`);
});
