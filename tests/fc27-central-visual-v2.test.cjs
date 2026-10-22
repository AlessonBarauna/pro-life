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
  assert.ok(css.includes("grid-template-columns:minmax(0,1fr)!important"));
});

test("FC27 Central 2.0 carrega o CSS aprovado depois das outras folhas",()=>{
  const styles=[...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]);
  assert.ok(styles.at(-1).includes('src/ui/fc27-central-v2.css'),"CSS da Central deve ser a ultima folha para preservar a grade");
});
test("FC27 Central 2.0 usa containers independentes sem grid estreito",()=>{
  assert.match(css,/\.fc27-central-v2-approved>\.fc27-v2-board\{/);
  assert.match(css,/\.fc27-central-v2-approved>\.central-v3-grid\{/);
  assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"));
  assert.ok(!/display:contents\\s*!important/.test(css),"os wrappers nao devem ser dissolvidos na grade");
  assert.ok(css.includes("grid-column:1/-1!important"),"rodape e faixa inferior ocupam toda a largura");
  assert.ok(css.includes("grid-row:4!important"),"rodape vem apos os paineis");
});
test("FC27 Central 2.0 nao exibe o painel antigo de treinador sobre a nova grade",()=>{
  assert.ok(css.includes(".central-v3-hero>.central-v3-player"));
  assert.ok(css.includes("display:none!important"));
});
