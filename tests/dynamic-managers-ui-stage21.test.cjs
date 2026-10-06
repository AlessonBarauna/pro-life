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
  "src/domain/life.js","src/domain/career.js","src/domain/commercial.js","src/domain/physical.js",
  "src/domain/squad.js","src/domain/unexpected-events.js","src/domain/simulation-tactics.js",
  "src/domain/national-team.js","src/domain/character.js","src/ui/charts.js","src/domain/engine.js",
  "src/domain/player-profile.js","src/application/game.js","src/infrastructure/codec.js",
  "src/infrastructure/validate-expansion.js","src/infrastructure/save.js","src/ui/expansion.js",
  "src/ui/calendar.js","src/ui/home-dashboard.js","src/ui/live-match.js","src/ui/creator.js"
];

function browser({history=false,mode="player"}={}){
  const dom=new JSDOM(fs.readFileSync(path.join(base,"index.html"),"utf8"),{runScripts:"outside-only",url:"https://stage21.invalid"}),w=dom.window;
  w.confirm=()=>true;w.scrollTo=()=>{};w.URL.createObjectURL=()=>"blob:test";w.URL.revokeObjectURL=()=>{};
  for(const file of scripts) w.eval(fs.readFileSync(path.join(base,file),"utf8"));
  const s=w.ProLife.create({mode,world:"legacy",name:"UI Stage 21",age:20,pos:"MEI",points:{},clubId:"c0"},2121);
  if(mode==="player"){
    w.ProLife.Squad.init(s);
    if(history){s.day=56;w.ProLife.Squad.handleManagerChange(s,{day:s.day,season:s.season,clubId:s.clubId,club:w.ProLife.club(s).name,reason:"teste visual"});}
  }
  const id="career_stage21";w.localStorage.setItem("prolife.v1.slot."+id,JSON.stringify(s));w.localStorage.setItem("prolife.v1.slots",JSON.stringify([{id,name:s.person.name,mode:s.mode,season:s.season,day:s.day}]));w.localStorage.setItem("prolife.v1.activeSlot",id);
  w.eval(fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8"));w.document.querySelector(`[data-load-slot="${id}"]`).click();
  return dom;
}
function openSquad(w){w.document.querySelector('[data-page="league"]').click();w.document.querySelector('[data-page="squad"]').click();}

test("21 UI: painel mostra identidade, arquétipo, estilo e formação",()=>{
  const dom=browser(),w=dom.window;openSquad(w);
  const panel=w.document.querySelector(".dynamic-manager-stage21"),manager=w.ProLife.Squad.managerProfile(w.ProLifeSave.current?.()||JSON.parse(w.localStorage.getItem("prolife.v1.slot.career_stage21")));
  assert.ok(panel);assert.match(panel.textContent,/TREINADOR/);assert.match(panel.textContent,new RegExp(manager.name));assert.match(panel.textContent,new RegExp(manager.personality));assert.match(panel.textContent,new RegExp(manager.preferredFormation));
});

test("21 UI: painel resume perfil e critérios principais",()=>{
  const dom=browser(),w=dom.window;openSquad(w);const panel=w.document.querySelector(".dynamic-manager-stage21");
  assert.match(panel.textContent,/Disciplina/);assert.match(panel.textContent,/Rotação/);assert.match(panel.textContent,/Jovens/);assert.match(panel.textContent,/Paciência/);assert.match(panel.textContent,/O que este treinador valoriza/);
  assert.ok(panel.querySelector(".manager-criteria"));
});

test("21 UI: histórico compacto aparece após troca",()=>{
  const dom=browser({history:true}),w=dom.window;openSquad(w);
  const history=w.document.querySelector(".manager-history");assert.ok(history);assert.match(history.textContent,/Últimos treinadores/);
});

test("21 UI: modo treinador não recebe relação de treinador NPC",()=>{
  const dom=browser({mode:"coach"}),w=dom.window;openSquad(w);assert.equal(w.document.querySelector(".dynamic-manager-stage21"),null);
});

test("21 UI: app apenas lê domínio do manager",()=>{
  const source=fs.readFileSync(path.join(base,"src/ui/app.js"),"utf8");
  assert.match(source,/D\.Squad\.managerProfile\(state\)/);assert.match(source,/D\.Squad\.managerTopCriteria/);
  assert.doesNotMatch(source,/state\.(?:manager|coachTrust)\s*(?:=|\+=|-=)/);
});
