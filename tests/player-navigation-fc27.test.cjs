"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const app = fs.readFileSync(path.join(__dirname, "..", "src", "ui", "app.js"), "utf8");

function playerBlock(startMarker, endMarker) {
  const start = app.indexOf(startMarker);
  const end = app.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, `bloco nao encontrado: ${startMarker}`);
  return app.slice(start, end);
}

test("navegacao FC27 do jogador atribui cada pagina a uma unica area", () => {
  const groups = playerBlock('groups = state.mode === "player"', "        : [");
  const owners = new Map();
  for (const line of groups.split(/\r?\n/)) {
    const match = line.match(/^\s*\["[^"]+", "[^"]+", \[(.*)\]\],?$/);
    if (!match) continue;
    for (const page of match[1].matchAll(/\["([^"]+)", "[^"]+"\]/g)) {
      owners.set(page[1], (owners.get(page[1]) || 0) + 1);
    }
  }
  assert.ok(owners.size >= 25, "catalogo do jogador ficou incompleto");
  assert.deepEqual([...owners].filter(([, count]) => count !== 1), []);
});

test("menus principais nao oferecem caminhos alternativos para a mesma pagina", () => {
  const quick = playerBlock('const quickNav = state.mode === "player"', "      : [");
  const owners = new Map();
  for (const line of quick.split(/\r?\n/)) {
    const match = line.match(/^\s*\["[^"]+", "[^"]+", "[^"]+", \[(.*)\]\],?$/);
    if (!match) continue;
    for (const page of match[1].matchAll(/"([^"]+)"/g)) {
      owners.set(page[1], (owners.get(page[1]) || 0) + 1);
    }
  }
  assert.deepEqual([...owners].filter(([, count]) => count !== 1), []);
  assert.match(quick, /\["profile", "Meu Jogador", "◉", \["profile", "training", "playerDevelopment", "contract", "agency", "legacy", "story", "playerIdentity"\]\]/);
  assert.match(quick, /\["competitions", "Temporada", "◇", \["calendar", "matches", "league", "competitions"/);
  assert.match(quick, /\["life", "Vida", "＋", \["life", "offField", "finance", "sponsorships"\]\]/);
  assert.doesNotMatch(quick, /\["calendar", "Calendário",/);
  assert.doesNotMatch(quick, /\["training", "Treinamento",/);
  assert.doesNotMatch(quick, /\["inbox", "Caixa",/);
});

test("submenus seguem o mapa consolidado do jogador", () => {
  const groups = playerBlock('groups = state.mode === "player"', "        : [");
  assert.match(groups, /\["profile", "Meu jogador", \[\["profile", "Visão geral"\], \["training", "Treinamento"\], \["playerDevelopment", "Evolução"\], \["contract", "Contrato"\], \["agency", "Empresário"\], \["legacy", "Carreira"\], \["story", "Objetivos"\], \["playerIdentity", "Identidade"\]\]\]/);
  assert.match(groups, /\["competitions", "Temporada", \[\["calendar", "Agenda"\], \["matches", "Partidas"\], \["league", "Campeonatos"\]/);
  assert.match(groups, /\["market", "Mercado", \[\["market", "Visão geral"\], \["proposals", "Propostas"\], \["clubs", "Clubes"\]\]\]/);
  assert.doesNotMatch(groups, /\["home", "Início", \[[^\n]*"lineup"/);
  assert.doesNotMatch(groups, /\["calendar", "Calendário",/);
  assert.doesNotMatch(groups, /\["life", "Vida", \[[^\n]*"history"/);
});
