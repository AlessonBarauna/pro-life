"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const source=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
function setup(open=false){
 const clubs=[{id:"home",name:"Home",budget:80000000,roster:[{id:"home-p",name:"Home player"}]},{id:"away",name:"Away",budget:10000000,roster:Array.from({length:20},(_,i)=>({id:"p"+i,name:"Player "+i,pos:"ATA",overall:75,age:25,salary:60000}))}];
 const engine={club:(s,id)=>clubs.find(x=>x.id===(id||s.clubId)),Career:{windowStatus:()=>({open,remaining:20})},overall:p=>p.overall||75,GlobalFootball:{playerById:()=>null}};
 const ctx={ProLife:engine,module:{exports:{}},console};vm.runInNewContext(source,ctx);
 const s={mode:"coach",clubId:"home",season:2026,day:50,news:[],coachCareer:{negotiations:[],settings:{}}};
 return {s,clubs,execute:ctx.module.exports.execute};
}
const deal=(extra={})=>({id:"deal-1",status:"pending",buyerClubId:"home",sellerClubId:"away",playerId:"p0",expiresDay:60,round:1,requested:5000000,finalFee:5000000,response:"accepted",...extra});
test("M06.3 blocked sale agreement does not move money or athlete",()=>{
 const {s,clubs,execute}=setup(false);s.coachCareer.negotiations.push(deal({response:"awaiting_reply"}));const before=JSON.stringify({s,clubs});
 assert.throws(()=>execute(s,"acceptCoachDeal",{id:"deal-1"}),/Aguarde o aceite/);
 assert.equal(JSON.stringify({s,clubs}),before);
});
test("M06.3 closed transfer window records future agreement without debit or transfer",()=>{
 const {s,clubs,execute}=setup(false);s.coachCareer.negotiations.push(deal());
 const before=clubs.map(x=>x.budget),counts=clubs.map(x=>x.roster.length);
 execute(s,"acceptCoachDeal",{id:"deal-1",paymentPlan:"split"});
 assert.equal(s.coachCareer.negotiations[0].status,"awaiting_window");
 assert.equal(s.coachCareer.negotiations[0].paymentPlan,"split");
 assert.deepEqual(clubs.map(x=>x.budget),before);
 assert.deepEqual(clubs.map(x=>x.roster.length),counts);
 const frozen=JSON.stringify({s,clubs});
 execute(s,"settleCoachWindowDeals",{});
 assert.equal(JSON.stringify({s,clubs}),frozen);
});
test("M06.3 counteroffer never skips pending reply or three-round limit",()=>{
 const {s,execute}=setup();s.coachCareer.negotiations.push(deal({response:"awaiting_reply"}));
 const before=JSON.stringify(s);
 assert.throws(()=>execute(s,"reviseCoachDeal",{id:"deal-1",offer:6000000}),/Aguarde a resposta/);
 assert.equal(JSON.stringify(s),before);
 s.coachCareer.negotiations[0].response="counter";s.coachCareer.negotiations[0].round=3;
 const third=JSON.stringify(s);
 assert.throws(()=>execute(s,"reviseCoachDeal",{id:"deal-1",offer:6000000}),/Limite de três rodadas/);
 assert.equal(JSON.stringify(s),third);
});
test("M06.3 invalid contract terms and unaccepted club deal cannot change financial state",()=>{
 const {s,clubs,execute}=setup();s.coachCareer.negotiations.push(deal());
 const before=JSON.stringify({s,clubs});
 assert.throws(()=>execute(s,"negotiateCoachContract",{id:"deal-1",years:6,salary:2000,bonus:0,role:"starter"}),/Condições contratuais inválidas/);
 assert.equal(JSON.stringify({s,clubs}),before);
 s.coachCareer.negotiations[0].response="counter";
 const revised=JSON.stringify({s,clubs});
 assert.throws(()=>execute(s,"negotiateCoachContract",{id:"deal-1",years:3,salary:60000,bonus:0,role:"starter"}),/Acerte primeiro a transferência/);
 assert.equal(JSON.stringify({s,clubs}),revised);
});
