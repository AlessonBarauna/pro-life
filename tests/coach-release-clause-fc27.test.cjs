"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");

test("release clause UI and handler are wired (interest meter, pay button, confirmation)",()=>{
 const view=read("src/ui/coach-career-view.js"),app=read("src/ui/app.js");
 assert.match(view,/INTERESSE DO JOGADOR/);assert.match(view,/CLÁUSULA DE RESCISÃO/);
 assert.match(view,/data-coach-pay-clause/);assert.match(app,/command\("payReleaseClause"/);
});

test("paying the full release clause signs a star who refuses a normal move, at the exact clause price",()=>{
 const D=require("../src/domain/engine.js"),A=require("../src/application/game.js");
 const state=D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},424242),buyer=D.club(state);
 state.coachCareer||={version:1};state.coachCareer.settings={...(state.coachCareer.settings||{}),firstWindow:"on",installments:"off",loans:"off",marketStrictness:"normal"};
 D.advance(state,1);
 const seller=state.clubs.filter(c=>c.id!==buyer.id&&c.roster.length>18).sort((a,b)=>Math.max(...b.roster.map(p=>D.overall(p)))-Math.max(...a.roster.map(p=>D.overall(p))))[0];
 const star=seller.roster.filter(p=>p.id!=="hero").sort((a,b)=>D.overall(b)-D.overall(a))[0];
 const clause=A.releaseClause(star);
 assert.ok(clause>A.valuation(star)*1.5,"rescisoria bem acima do valor de mercado");
 assert.equal(A.releaseClause(star),clause,"deterministica");
 buyer.structure=1;buyer.budget=clause+5000000;
 assert.throws(()=>A.execute(state,"recruit",{clubId:seller.id,playerId:star.id,dealType:"permanent",paymentPlan:"upfront"}),/recusou|estrutura/);
 const buyerBefore=buyer.budget,sellerBefore=seller.budget;
 A.execute(state,"payReleaseClause",{clubId:seller.id,playerId:star.id});
 assert.ok(buyer.roster.some(p=>p.id===star.id)&&!seller.roster.some(p=>p.id===star.id));
 assert.equal(buyer.budget,buyerBefore-clause);assert.equal(seller.budget,sellerBefore+clause);
});

test("release clause is refused without enough budget",()=>{
 const D=require("../src/domain/engine.js"),A=require("../src/application/game.js");
 const state=D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},424242),buyer=D.club(state);
 state.coachCareer||={version:1};D.advance(state,1);
 const seller=state.clubs.find(c=>c.id!==buyer.id&&c.roster.length>18),p=seller.roster.find(x=>x.id!=="hero");
 buyer.budget=A.releaseClause(p)-1;
 assert.throws(()=>A.execute(state,"payReleaseClause",{clubId:seller.id,playerId:p.id}),/Orçamento/);
 assert.ok(seller.roster.some(x=>x.id===p.id));
});
