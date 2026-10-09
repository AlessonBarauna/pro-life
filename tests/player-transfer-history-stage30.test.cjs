"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const History=require("../src/ui/player-transfer-history.js");

function fixture(){
  return {
    day:500,season:2027,
    clubs:[{id:"bra_a",name:"São Azul"},{id:"bra_b",name:"Clube <Norte>"}],
    globalFootball:{clubs:[{id:"eng_a",name:"London City"}]},
    universe:{transfers:[
      {id:"p1",type:"transfer",season:2026,day:100,fromId:"bra_a",toId:"bra_b",from:"São Azul",to:"Clube <Norte>",fee:1500000,ovr:72},
      {id:"p1",type:"release",season:2026,day:120,fromId:"bra_b",toId:null,fee:0,ovr:72},
      {id:"p2",type:"transfer",season:2026,day:130,fromId:"bra_a",toId:"bra_b",fee:10,ovr:60},
    ]},
    worldLiveMarket:{deals:[
      {id:"duplicate",playerId:"p1",fromClubId:"bra_a",toClubId:"bra_b",state:"completed",executionStatus:"executed",executedDay:100,value:1500000,ovr:72},
      {id:"executed",playerId:"p1",fromClubId:"bra_b",toClubId:"eng_a",state:"completed",executionStatus:"executed",executedDay:470,value:9000000,overall:78},
      {id:"pending",playerId:"p1",fromClubId:"eng_a",toClubId:"bra_a",state:"completed",value:12000000},
      {id:"rumor",playerId:"p1",fromClubId:"eng_a",toClubId:"bra_a",state:"rumor",value:12000000},
    ]},
  };
}

test("30.1: reúne somente transferências efetivadas pelo ID e remove duplicações",()=>{
  const rows=History.collect(fixture(),"p1");
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(row=>row.toId),["eng_a","bra_b"]);
  assert.ok(rows.every(row=>row.from&&row.to));
});

test("30.1: renderiza temporada, clubes, valor e GER sem alterar o estado",()=>{
  const state=fixture(),before=JSON.stringify(state);
  const html=History.render(state,"p1");
  for(const marker of ["Histórico de transferências","2026","São Azul","London City","1.500.000","9.000.000","72","78"]){
    assert.ok(html.includes(marker),marker);
  }
  assert.ok(html.includes("Clube &lt;Norte&gt;"));
  assert.equal(JSON.stringify(state),before);
});

test("30.1: estado vazio é discreto e não mostra negociações pendentes",()=>{
  const html=History.render(fixture(),"sem-registros");
  assert.ok(html.includes("Nenhuma transferência efetivada registrada"));
  assert.doesNotMatch(html,/<tbody>/);
});

test("30.1: perfil registra e utiliza o componente antes do app",()=>{
  const root=path.resolve(__dirname,".."),app=fs.readFileSync(path.join(root,"src/ui/app.js"),"utf8"),index=fs.readFileSync(path.join(root,"index.html"),"utf8"),assets=fs.readFileSync(path.join(root,"tools/assets.cjs"),"utf8"),script="src/ui/player-transfer-history.js";
  assert.equal(index.split(script).length-1,1);
  assert.equal(assets.split(script).length-1,1);
  assert.ok(index.indexOf(script)<index.indexOf("src/ui/app.js"));
  assert.match(app,/ProLifePlayerTransferHistory\.render\(state,p\.id\)/);
  assert.match(app,/href="#player-transfers"/);
});
