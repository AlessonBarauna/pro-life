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

test("Coach loan matures, returns the same player, and never duplicates him",()=>{
 const root={};root.globalThis=root;vm.runInNewContext(src,root,{filename:"career.js"});
 const C=root.ProLifeCareer,player={id:"p1",name:"Jogador X",pos:"ATA"};
 const s={mode:"coach",day:179,season:2026,person:{name:"Treinador",condition:100},news:[],
  clubs:[{id:"a",name:"Origem",roster:[],lineup:[]},{id:"b",name:"Destino",roster:[player],lineup:["p1"]}],
  coachCareer:{loans:[{id:"l1",fromClubId:"a",toClubId:"b",playerId:"p1",dueDay:180,returned:false}]}};
 C.daily(s);assert.equal(s.clubs[1].roster.length,1);
 s.day=180;C.daily(s);C.daily(s);
 assert.equal(s.clubs[0].roster.filter(x=>x.id==="p1").length,1);
 assert.equal(s.clubs[1].roster.length,0);
 assert.equal(s.coachCareer.loans[0].returned,true);
});
test("Manager recruitment includes loan and sell-on terms",()=>{
 const actions=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 assert.match(actions,/sellOnClauses/);
 assert.match(actions,/data\.dealType==="loan"/);
 assert.match(ui,/data-loan-days/);
 assert.match(ui,/data-sell-on/);
});

test("Reloaded loan salary shares settle once and keep the purchase option",()=>{
 const root={};root.globalThis=root;vm.runInNewContext(src,root,{filename:"career.js"});
 const C=root.ProLifeCareer;
 const initial={mode:"coach",day:29,season:2026,person:{name:"Treinador",condition:100},news:[],
 clubs:[{id:"a",name:"Origem",budget:100000,roster:[],lineup:[]},{id:"b",name:"Destino",budget:100000,roster:[{id:"p1",name:"Atleta",salary:20000}],lineup:["p1"]}],
 coachCareer:{loans:[{id:"l1",playerId:"p1",fromClubId:"a",toClubId:"b",dueDay:180,nextSalaryDay:30,salaryShare:50,buyOption:300000,returned:false}]}};
 let s=JSON.parse(JSON.stringify(initial));s.day=30;C.daily(s);
 assert.equal(s.clubs[0].budget,110000);assert.equal(s.clubs[1].budget,90000);
 s=JSON.parse(JSON.stringify(s));C.daily(s);
 assert.equal(s.clubs[0].budget,110000);assert.equal(s.clubs[1].budget,90000);
 assert.equal(s.coachCareer.loans[0].buyOption,300000);
 s.day=60;C.daily(s);assert.equal(s.clubs[0].budget,120000);
 C.daily(s);assert.equal(s.clubs[0].budget,120000);
});
test("Coach market offers loan buy-out and counterproposal commands",()=>{
 const actions=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
 const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
 for(const action of ['case "buyLoan"','case "counterRecruit"'])assert.ok(actions.includes(action));
 for(const control of ["data-loan-buy","data-counter-recruit","data-salary-share","data-buy-option"])assert.ok(ui.includes(control));
});
