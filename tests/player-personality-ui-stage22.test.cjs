"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {JSDOM}=require("jsdom");

const base=path.resolve(__dirname,"..");
const scripts=[
  "src/domain/world2026.js","src/domain/brazil-data.js","src/domain/competitions.js","src/domain/training.js",
  "src/domain/identity.js","src/domain/creation.js","src/domain/universe.js","src/domain/statistics.js",
  "src/domain/life.js","src/domain/player-personality.js","src/domain/career.js","src/domain/commercial.js","src/domain/physical.js",
  "src/domain/squad.js","src/domain/unexpected-events.js","src/domain/simulation-tactics.js",
  "src/domain/national-team.js","src/domain/character.js","src/ui/charts.js","src/domain/engine.js",
  "src/domain/player-profile.js","src/application/game.js","src/infrastructure/codec.js",
  "src/infrastructure/validate-expansion.js","src/infrastructure/save.js","src/ui/expansion.js",
  "src/ui/calendar.js","src/ui/home-dashboard.js","src/ui/live-match.js","src/ui/creator.js"
];

function browser(mode="player"){
  const dom=new JSDOM(fs.readFileSync(path.join(base,"index.html"),"utf8"),{runScripts:"outside-only",url:"https://stage22.invalid"}),w=dom.window;
  w.confirm=()=>true;w.scrollTo=()=>{};w.URL.createObjectURL=()=>"blob:test";w.URL.revokeObjectURL=()=>{};
  for(const file of scripts)w.eval(fs.readFileSync(path.join(base,file),"utf8"));
  const s=w.ProLife.create({mode,world:"legacy",name:"UI Stage 22",age:20,pos:"MEI",points:{},clubId:"c0"},2222);
  if(mode==="player"){w.ProLife.Career.init(s);w.ProLife.Personality.applyChoice(s,"interview","team",{eventId:"ui-choice",label:"Valorizar a equipe"});}
  const id="career_stage22";w.localStorage.setItem("prolife.v1.slot."+id,JSON.stringify(s));w.localStorage.setItem("prolife.v1.slots",JSON.stringify([{id,name:s.person.name,mode:s.mode,season:s.season,day:s.day}]));w.localStorage.setItem("prolife.v1.activeSlot",id);
  w.eval(fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8"));w.document.querySelector(`[data-load-slot="${id}"]`).click();
  return dom;
}
function openLife(w){w.document.querySelector('[data-page="history"]').click();w.document.querySelector('[data-page="life"]').click();}

test("22 UI: painel mostra perfil dominante e traços",()=>{
  const dom=browser(),w=dom.window;openLife(w);const panel=w.document.querySelector(".player-personality-stage22");
  assert.ok(panel);assert.match(panel.textContent,/PERSONALIDADE/);assert.match(panel.textContent,/EQUILIBRADO/);assert.match(panel.textContent,/Espírito de equipe/);
});

test("22 UI: painel separa reputação e imagem pública",()=>{
  const dom=browser(),w=dom.window;openLife(w);const panel=w.document.querySelector(".player-personality-stage22");
  assert.match(panel.textContent,/Geral:/);assert.match(panel.textContent,/Pública/);assert.match(panel.textContent,/Vestiário/);assert.match(panel.textContent,/Treinador/);assert.match(panel.textContent,/Comercial/);assert.match(panel.textContent,/IMAGEM PÚBLICA/);
});

test("22 UI: histórico explica a escolha e seu principal efeito",()=>{
  const dom=browser(),w=dom.window;openLife(w);const history=w.document.querySelector(".personality-history");
  assert.ok(history);assert.match(history.textContent,/Valorizar a equipe/);assert.match(history.textContent,/Espírito de equipe/);
});

test("22 UI: modo treinador não recebe painel de personalidade do jogador",()=>{
  const dom=browser("coach"),w=dom.window;openLife(w);assert.equal(w.document.querySelector(".player-personality-stage22"),null);
});

test("22 UI: apresentação apenas consulta o domínio",()=>{
  const source=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");assert.match(source,/D\.Personality\?\.init\?\.\(state\)/);assert.match(source,/D\.Personality\.topTraits/);
  assert.doesNotMatch(source,/personality\.(?:traits|reputation)\[[^\]]+\]\s*(?:=|\+=|-=)/);
});
