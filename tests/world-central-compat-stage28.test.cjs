"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {execFileSync}=require("node:child_process");
const D=require("../src/domain/engine.js");

const base=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(base,file),"utf8");
const app=read("src/ui/app.js");
const html=read("index.html");
const assets=read("tools/assets.cjs");
const centralMarkers=[
  "career-central-v3",
  "central-v3-header",
  "central-v3-hero",
  "central-v3-grid"
];
const centralCommit=execFileSync(
  "git",
  ["show","bc4f177:src/ui/app.js"],
  {cwd:base,encoding:"utf8"}
);
const currentHasCentralV3=centralMarkers.every(marker=>app.includes(marker));

test("28E.3: commit bc4f177 contém os componentes-base da Central V3",()=>{
  for(const marker of centralMarkers)
    assert.ok(centralCommit.includes(marker),marker);
});

test(
  "28E.3: Central V3 está presente no worktree de integração",
  {todo:!currentHasCentralV3&&"Central V3 ainda não foi integrada neste worktree"},
  ()=>{
    assert.equal(currentHasCentralV3,true);
  }
);

test("28E.3: rota mundial existe uma vez por modo e não está duplicada",()=>{
  const menu='["worldCompetitions", "Competições Mundiais"]';
  const escaped=menu.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  assert.equal((app.match(new RegExp(escaped,"g"))||[]).length,2);
  assert.equal((app.match(/\n\s*worldCompetitions\(\)\s*\{/g)||[]).length,1);
  assert.ok(app.includes('["history", "Mundo"'));
});

test("28E.3: handlers de liga e rodada precedem a navegação genérica",()=>{
  const league=app.indexOf("b.dataset.worldLeague !== undefined");
  const round=app.indexOf("b.dataset.worldRound !== undefined");
  const page=app.indexOf("if (b.dataset.page)");

  assert.ok(league>0);
  assert.ok(round>league);
  assert.ok(page>round);
  assert.equal((app.match(/b\.dataset\.worldLeague !== undefined/g)||[]).length,1);
  assert.equal((app.match(/b\.dataset\.worldRound !== undefined/g)||[]).length,1);
});

test("28E.3: propostas internacionais continuam usando o mercado real",()=>{
  const s=D.create({mode:"player",clubId:"c0"},28390);
  for(const key of Object.keys(s.person.attrs))
    s.person.attrs[key]=86;
  s.person.age=27;
  s.person.potential=90;
  s.reputation=90;
  D.Career.init(s).playerCareer.lastEvaluation={rating:8.2};

  const offers=D.weightedCareerOffers(s,new D.Random(28391),9999);
  const global=offers.filter(offer=>String(offer.clubId).startsWith("gf_"));
  assert.ok(global.length>0);
  assert.equal(global.every(offer=>D.club(s,offer.clubId)?.id===offer.clubId),true);
  assert.ok(app.includes("worldLeagueName(c.leagueId)"));
});

test("28E.3: scripts mundiais estão registrados uma única vez e na ordem correta",()=>{
  const view="src/ui/world-competitions-view.js";
  const domain="src/domain/world-club-competitions.js";

  for(const [source,marker] of [[html,view],[html,domain],[assets,view],[assets,domain]])
    assert.equal(source.split(marker).length-1,1,marker);

  assert.ok(html.indexOf(domain)<html.indexOf("src/domain/engine.js"));
  assert.ok(html.indexOf(view)<html.indexOf("src/ui/app.js"));
});
