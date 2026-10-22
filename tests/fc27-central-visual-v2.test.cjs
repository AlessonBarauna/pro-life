"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(root,"src/ui/fc27-central-v2.css"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");

test("FC27 Central 2.0 carrega a folha de estilo apos cinematic",()=>{
  assert.match(html,/fc27-cinematic\.css[\s\S]*fc27-central-v2\.css/);
});
test("FC27 Central 2.0 possui os quatro paineis previstos",()=>{
  for(const section of ["fc27-v2-calendar","fc27-v2-competitions","fc27-v2-summary","fc27-v2-alerts"]){
    assert.ok(app.includes('class="fc27-v2-panel '+section+'"'),section);
  }
});
test("FC27 Central 2.0 preserva proximo jogo e controles originais",()=>{
  assert.match(app,/central-v3-matchup/);
  assert.match(app,/data-live-match/);
  assert.match(app,/data-simulate="nextCommitment"/);
});
test("FC27 Central 2.0 usa dados oficiais ao inves de placares ficticios",()=>{
  assert.match(app,/D\.seasonCompetitionCatalog\?\.\(state\)/);
  assert.match(app,/H\.events/);
  assert.match(app,/H\.recent/);
  assert.match(app,/c\?\.stats\?\.gf/);
});
test("FC27 Central 2.0 ajusta paineis para celular",()=>{
  assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/grid-template-columns:1fr!important/);
});
