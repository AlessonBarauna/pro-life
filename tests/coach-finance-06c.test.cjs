"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/domain/career.js"),"utf8");
test("Deferred transfer debts are paid only once when day advances",()=>{
 const root={};root.globalThis=root;
 vm.runInNewContext(src,root,{filename:"career.js"});
 const C=root.ProLifeCareer;
 const s={mode:"coach",day:179,season:2026,person:{name:"Treinador",condition:100},clubs:[{id:"a",budget:1000000},{id:"b",budget:1000000}],news:[],
  coachCareer:{transferDebts:[{id:"d1",buyerClubId:"a",sourceClubId:"b",amount:100000,dueDay:180,paid:false}]}};
 C.daily(s);
 assert.equal(s.clubs[0].budget,1000000);
 s.day=180;C.daily(s);
 assert.equal(s.clubs[0].budget,900000);
 assert.equal(s.clubs[1].budget,1100000);
 assert.equal(s.coachCareer.transferDebts[0].paid,true);
 C.daily(s);
 assert.equal(s.clubs[0].budget,900000);
 assert.equal(s.clubs[1].budget,1100000);
});
test("Transfer installment option is isolated to coach rules",()=>{
 const actions=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(actions,/rules\?\.installments==="on"/);
 assert.match(actions,/if\(due\)/);
 assert.match(ui,/data-recruit-plan/);
});
