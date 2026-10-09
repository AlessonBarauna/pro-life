"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const View=require("../src/ui/world-live-market-view.js");

const root=path.resolve(__dirname,"..");
const read=(file)=>fs.readFileSync(path.join(root,file),"utf8");
const app=read("src/ui/app.js");
const index=read("index.html");
const assets=read("tools/assets.cjs");
const script="src/ui/world-live-market-view.js";

test("29E.2: componente é registrado uma vez e antes do app",()=>{
  assert.equal((index.match(new RegExp(script.replaceAll("/","\\/"),"g"))||[]).length,1);
  assert.equal((assets.match(new RegExp(script.replaceAll("/","\\/"),"g"))||[]).length,1);
  assert.ok(index.indexOf(script)<index.indexOf("src/ui/app.js"));
  assert.ok(assets.indexOf(script)<assets.indexOf('"src/ui/app.js"'));
});

test("29E.2: Central usa dados reais e mantém aba e filtros somente na memória da UI",()=>{
  assert.match(app,/let worldMarketTab="rumors";/);
  assert.match(app,/let worldMarketFilters=\{country:"ALL",league:"ALL",club:"ALL",period:"ALL"\};/);
  assert.match(app,/ProLifeWorldLiveMarketView\.render\(state,D,\{/);
  for(const option of ["tab:worldMarketTab","country:worldMarketFilters.country","league:worldMarketFilters.league","club:worldMarketFilters.club","period:worldMarketFilters.period"]){
    assert.ok(app.includes(option),option);
  }
  assert.match(app,/b\.dataset\.worldMarketTab !== undefined/);
  for(const control of ["worldMarketCountry","worldMarketLeague","worldMarketClub","worldMarketPeriod"]){
    assert.ok(app.includes(`\"${control}\"`),control);
  }
});

test("29F: Central unificada substitui paineis legados",()=>{
  const market=app.slice(app.indexOf("    market() {"),app.indexOf("    sponsorships() {"));
  assert.ok(market.includes("worldMarketPanel"));
  assert.ok(!market.includes("data-world-market-legacy"));
  assert.ok(!market.includes("worldMovesPanel()"));
});

test("29E.2: integração preserva janelas, avanço, scouting e painel anterior",()=>{
  const market=app.slice(app.indexOf("    market() {"),app.indexOf("    sponsorships() {"));
  for(const marker of ["Career.windowStatus(state)","Janelas de transferências","data-recruit","worldMarketPanel"]){
    assert.ok(market.includes(marker),marker);
  }
  assert.doesNotMatch(market,/\.tick\(|createDeal\(|generateWorldMarket/i);
});

test("29E.2: componente renderiza nos modos Jogador e Treinador sem alterar o estado",()=>{
  for(const mode of ["player","coach"]){
    const state={mode,day:10,clubs:[],globalFootball:{clubs:[],leagues:[]},worldLiveMarket:{deals:[],events:[]}};
    const before=JSON.stringify(state);
    const html=View.render(state,null,{tab:"history",country:"ALL",league:"ALL",club:"ALL",period:"ALL"});
    assert.ok(html.includes("data-world-live-market-view"));
    assert.equal(JSON.stringify(state),before);
  }
});
