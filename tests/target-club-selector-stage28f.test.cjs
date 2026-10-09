"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const D=require("../src/domain/engine.js");
const Selector=require("../src/ui/target-club-selector.js");

function state(seed=28500){
  return D.create({mode:"player",clubId:"c0"},seed);
}

test("28F.2: catálogo combina clubes brasileiros e internacionais com IDs únicos",()=>{
  const s=state();
  const clubs=Selector.catalog(s,D,D.Career);
  const ids=clubs.map(club=>club.id);

  assert.ok(clubs.some(club=>club.name==="São Paulo"));
  assert.ok(clubs.some(club=>club.id==="gf_real_madrid"));
  assert.equal(new Set(ids).size,ids.length);
  assert.equal(clubs.some(club=>club.generated===true||club.active===false),false);
  assert.equal(clubs.some(club=>club.id===s.clubId),false);
});

test("28F.2: filtros mantêm país e liga coerentes sem listas fixas",()=>{
  const s=state(28501);
  const all=Selector.catalog(s,D,D.Career);
  const european=all.find(club=>club.id==="gf_real_madrid");
  assert.ok(european);

  const snap=Selector.snapshot(s,D,D.Career,{
    country:european.country,
    league:european.leagueId,
    query:""
  });
  assert.ok(snap.visible.length>0);
  assert.equal(snap.visible.every(club=>club.country===european.country),true);
  assert.equal(snap.visible.every(club=>club.leagueId===european.leagueId),true);
  assert.equal(snap.leagues.every(league=>league.country===european.country),true);
});

test("28F.2: busca por clube normaliza acentos",()=>{
  const s=state(28502);
  const result=Selector.snapshot(s,D,D.Career,{
    country:"ALL",
    league:"ALL",
    query:"sao paulo"
  }).visible;
  assert.ok(result.some(club=>club.name==="São Paulo"));
  assert.equal(Selector.norm("São Paulo"),"sao paulo");
});

test("28F.2: clube de elite incompatível continua selecionável como objetivo distante",()=>{
  const s=state(28503);
  for(const key of Object.keys(s.person.attrs)) s.person.attrs[key]=45;
  s.person.age=19;
  s.person.potential=60;
  s.reputation=0;
  D.Career.init(s).playerCareer.lastEvaluation={rating:5};
  const before=D.Career.targetClubAssessment(s,"gf_real_madrid");
  assert.ok(before);
  assert.equal(before.realistic,false);
  assert.match(before.label,/ambicioso|Distante/i);

  D.Career.setTargetClub(s,"gf_real_madrid");
  const snap=Selector.snapshot(s,D,D.Career,{country:"ALL",league:"ALL",query:""});
  assert.equal(snap.selected.id,"gf_real_madrid");
  assert.equal(snap.assessment.realistic,false);
});

test("28F.2: alvo selecionado persiste ao renderizar novamente",()=>{
  const s=state(28504);
  D.Career.setTargetClub(s,"gf_real_madrid");
  Selector.reset();
  const first=Selector.render(s,D,D.Career);
  const second=Selector.render(s,D,D.Career);

  assert.ok(first.includes("Real Madrid"));
  assert.ok(first.includes("OBJETIVO ATUAL"));
  assert.ok(second.includes('data-target-club-select="gf_real_madrid" disabled'));
  assert.equal(D.Career.init(s).playerCareer.targetClub.clubId,"gf_real_madrid");
});

test("28F.2: aplicação registra módulo e seleção usa o comando existente",()=>{
  const app=fs.readFileSync("src/ui/app.js","utf8");
  const html=fs.readFileSync("index.html","utf8");
  const assets=fs.readFileSync("tools/assets.cjs","utf8");
  const marker="src/ui/target-club-selector.js";

  assert.ok(app.includes("ProLifeTargetClubSelector?.mount"));
  assert.ok(app.includes('command("targetClub",{clubId:b.dataset.targetClubSelect})'));
  assert.ok(html.includes(marker));
  assert.ok(assets.includes(marker));
});
