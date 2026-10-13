"use strict";
// Card "Proximo compromisso" de jogo da selecao deve mostrar a escalacao do heroi (mesma fonte da tela de escalacao), nao "A definir".
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const D = require("../src/domain/engine.js"); global.ProLife = D; global.ProLifeGlobalFootball = D.GlobalFootball;
global.ProLifeNames = require("../src/domain/display-names.js");
global.ProLifeNationalIdentity = require("../src/domain/national-identity.js");
global.ProLifeCareerContext = require("../src/domain/career-context.js");
const NT = require("../src/domain/national-team.js");
const rng = (() => { let x = 7; return { next: () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }, int: (a) => a }; })();
const src = fs.readFileSync(path.join(__dirname, "../src/ui/app.js"), "utf8");

test("um dia antes do jogo da Copa a escalacao do heroi ja esta definida (Titular ou Banco), igual a tela completa", () => {
  const s = D.create({ mode: "player", clubId: "c0", catalogVersion: "fc27_v1" }, 11);
  s.person.nationality = "Espanha"; s.person.pos = "ATA"; for (const k of Object.keys(s.person.attrs)) s.person.attrs[k] = 90;
  s.day = 4 * 365; const lg = () => {};
  const first = () => (s.nationalTeam.schedule || []).find((f) => f.tournamentType === "WORLD_CUP" && !f.played);
  for (let i = 0; i < 200 && !(first() && s.day === first().day - 1); i++) { NT.daily(s, rng, D, lg); s.day++; if (first() && s.day > first().day) break; }
  const f = first(); assert.ok(f && s.day === f.day - 1, "um dia antes do primeiro jogo");
  const l = NT.matchLineup(s, D);
  assert.equal(l.calledUp, true);
  const inXI = l.starters.some((p) => p.id === "hero"), onBench = l.bench.some((p) => p.id === "hero");
  assert.ok(inXI || onBench, "heroi aparece na escalacao");
  assert.equal(inXI, l.status === "Titular", "XI coerente com o papel");
});
test("card usa nationalLineupRole para jogo de selecao e mantem a escalacao do clube nos demais", () => {
  assert.ok(/ESCALAÇÃO<\/small>\$\{esc\(next\?\.national\?nationalLineupRole\(\):\(H\.lineup\?\.heroRole\|\|"A definir"\)\)\}/.test(src));
  assert.ok(/function nationalLineupRole\(\)/.test(src) && /NationalTeam\?\.matchLineup/.test(src));
});
