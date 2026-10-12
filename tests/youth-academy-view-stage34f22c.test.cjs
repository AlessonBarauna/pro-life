"use strict";
// Stage 34F.22c - tela Base e Craques do Ano (FC 27): render, abas, filtros e estado vazio. JSDOM, sem navegador real.
const test = require("node:test"), assert = require("node:assert/strict");
const { JSDOM } = require("jsdom");
const D = require("../src/domain/engine.js");
const G = D.GlobalFootball;
const dom = new JSDOM("<!doctype html><body><div id='app'></div></body>", { url: "http://localhost/" });
global.window = dom.window; global.document = dom.window.document;
const V = require("../src/ui/youth-academy-view.js");
// o modulo foi carregado no escopo global do Node: religa os listeners no documento do JSDOM
delete globalThis.__proLifeYouthAcademyBound;
const fc27 = () => { const s = D.create({ mode: "coach", clubId: "c0", catalogVersion: "fc27_v1" }, 4141); G.ensureAcademies(s); s.season++; G.rollSeason(s); return s; };
const mount = (s) => { document.getElementById("app").innerHTML = V.render(s, D); };

test("34F.22c (1) snapshot: base do clube tem >= 6 jovens ordenados por potencial; craques ordenados; livres sem clube", () => {
  const s = fc27(), club = s.globalFootball.clubs.find((c) => c.fc27);
  const snap = V.snapshot(s, { clubId: club.id });
  assert.equal(snap.enabled, true);
  assert.ok(snap.academy.length >= 6);
  for (let i = 1; i < snap.academy.length; i++) assert.ok(snap.academy[i - 1].potential >= snap.academy[i].potential);
  assert.ok(snap.academy.every((r) => r.yearsToFirstTeam >= 0 && r.potential >= r.ovr));
  assert.ok(snap.stars.length === 24 && snap.stars[0].potential >= snap.stars[23].potential);
  assert.ok(snap.free.length > 0 && snap.free.every((r) => r.free));
  assert.ok(snap.summary.prospects >= 4000);
});

test("34F.22c (2) render mostra cabecalho, abas, cartoes com GER/POT/estrelas e escapa HTML", () => {
  const s = fc27(), club = s.globalFootball.clubs.find((c) => c.fc27);
  const kid = s.internationalPlayers.find((p) => p.academy && p.clubId === club.id);
  kid.name = "<img src=x onerror=alert(1)>";
  V.state.clubId = club.id; V.state.tab = "base";
  mount(s);
  const root = document.querySelector("[data-youth-root]");
  assert.ok(root);
  assert.equal(root.querySelectorAll("[data-youth-tab]").length, 3);
  assert.ok(root.querySelectorAll(".ya-card").length >= 6);
  assert.ok(root.querySelector(".ya-ovr b") && root.querySelector(".ya-pot b") && root.querySelector(".ya-stars"));
  assert.equal(root.querySelector("img[src='x']"), null, "nome escapado");
  assert.ok(root.innerHTML.includes("&lt;img"));
});

test("34F.22c (3) abas, filtro de nivel e troca de clube atualizam a tela", () => {
  const s = fc27();
  V.state.tab = "base"; V.state.filter = "all"; V.state.league = "ALL";
  mount(s);
  // render() guarda o contexto; os eventos usam o document do JSDOM
  document.querySelector("[data-youth-tab='stars']").click();
  assert.equal(document.querySelectorAll(".ya-pod").length, 3, "podio dos 3 maiores potenciais");
  const all = document.querySelectorAll(".ya-card").length;
  assert.equal(all, 21);
  document.querySelector("[data-youth-filter='craque']").click();
  const tiers = [...document.querySelectorAll("[data-youth-root] .ya-tier")].map((n) => n.textContent);
  assert.ok(tiers.length > 0 && tiers.every((t) => t === "Craque"));
  document.querySelector("[data-youth-tab='free']").click();
  assert.ok(document.querySelectorAll(".ya-card").length > 0);
  assert.ok(/Assinam com um clube/.test(document.querySelector("[data-youth-root]").textContent));
  document.querySelector("[data-youth-tab='base']").click();
  const other = s.globalFootball.clubs.filter((c) => c.fc27)[7];
  const select = document.querySelector("[data-youth-club]");
  select.value = other.id; select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.ok(document.querySelector("[data-youth-root] h2").textContent.includes(other.name));
});

test("34F.22c (4) carreira nao FC 27 mostra aviso e o render nao altera o estado", () => {
  const legacy = D.create({ mode: "coach", clubId: "c0" }, 3);
  assert.equal(V.snapshot(legacy).enabled, false);
  mount(legacy);
  assert.ok(/Disponível nas carreiras FC 27/.test(document.querySelector("[data-youth-root]").textContent));
  const s = fc27(), before = JSON.stringify(s.internationalPlayers.slice(0, 2000));
  mount(s); V.snapshot(s, { tab: "stars" });
  assert.equal(JSON.stringify(s.internationalPlayers.slice(0, 2000)), before);
});

test("34F.22c (5) estrelas de potencial: escala de 0,5 a 5 em passos de meia estrela", () => {
  assert.equal(V.stars(95), 5); assert.equal(V.stars(85), 4); assert.equal(V.stars(75), 3); assert.equal(V.stars(40), 0.5);
  assert.equal(V.stars(70) * 2 % 1, 0);
});
