"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const D=require("../src/domain/engine.js");global.ProLife=D;
const BETIS="gf_fc27_449";
const make=(clubId)=>D.create({mode:"player",clubId,catalogVersion:"fc27_v1",origin:"blank",creation:{difficulty:"realistic",personality:"balanced",startMode:"club"}},7);

test("Pré-temporada: liga que começa logo (Brasil) não avança nada",()=>{
  const s=D.create({mode:"player",clubId:"c0",catalogVersion:"fc27_v1"},7);
  assert.equal(D.preseasonPlan(s),null);
});
test("Pré-temporada: carreira já iniciada nunca é avançada",()=>{
  const s=make(BETIS);D.advance(s,1);assert.equal(D.preseasonPlan(s),null);
});
test("Pré-temporada: Real Betis começa ~14 dias antes da rodada 1 da La Liga",()=>{
  const s=make(BETIS),first=D.nextCommitment(s);
  const plan=D.preseasonPlan(s);
  assert.ok(plan&&plan.firstMatchDay===first.date&&plan.targetDay===first.date-14&&plan.targetDay>100);
  let guard=0,r;do{r=D.preseasonStep(s,plan.targetDay,30);}while(!r.done&&++guard<40);
  assert.equal(r.error,null);assert.equal(s.day,plan.targetDay);
  const next=D.nextCommitment(s);
  assert.equal(next.date,first.date,"o primeiro jogo oficial continua sendo o mesmo");
  assert.ok(!s.decision,"sem decisão pendente ao abrir a carreira");
  assert.equal(s.clubId,BETIS);
  assert.equal(D.preseasonPlan(s),null,"não repete");
});
test("Pré-temporada: ligada à criação de carreira e com tela de progresso",()=>{
  const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
  assert.match(app,/function startCareer\(fresh\)\s*\{\s*return prepareSeasonStart\(fresh\)/);
  assert.ok(app.includes("Preparando a pré-temporada"));
});
