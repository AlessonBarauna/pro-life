"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");

function state(seed=3131){return D.create({mode:"player",clubId:"c0"},seed);}
function report(s,overrides={}){
  const value={day:s.day,season:s.season,competition:"Brasileirão Série A",opponent:"Adversário",status:"TITULAR",minutes:90,rating:5.7,...overrides};
  D.Career.init(s).playerCareer.lastMatchReport=value;
  return value;
}
function criticismFirst(){return {pick(pool){return pool.find(item=>item.id==="criticism")||pool[0];}};}
function next(s){return D.Life.next(s,criticismFirst());}

test("31.3.1: crítica não aparece sem partida ou em modo treinador",()=>{
  const player=state(),coach=D.create({mode:"coach",clubId:"c0"},3132);
  assert.notEqual(next(player).id,"criticism");
  report(coach);
  assert.notEqual(next(coach).id,"criticism");
});

test("31.3.1: atuação ruim recente do clube habilita crítica identificada",()=>{
  const s=state();
  report(s);
  const decision=next(s);
  assert.equal(decision.id,"criticism");
  assert.match(decision.criticismReportId,/^match:club:/);
  assert.equal(decision.criticismReport.rating,5.7);
});

test("31.3.1: boa atuação, banco sem entrar e fora da relação são inelegíveis",()=>{
  for(const overrides of [
    {status:"TITULAR",minutes:90,rating:6},
    {status:"NAO_UTILIZADO",minutes:0,rating:null},
    {status:"NAO_RELACIONADO",minutes:0,rating:null},
  ]){
    const s=state();
    report(s,overrides);
    assert.notEqual(next(s).id,"criticism");
  }
});

test("31.3.1: Seleção segue participação, minutos e nota",()=>{
  const poor=state();
  report(poor,{national:true,competition:"Copa do Mundo",opponent:"Argentina",status:"ENTROU_DO_BANCO",minutes:24,rating:5.5});
  const decision=next(poor);
  assert.equal(decision.id,"criticism");
  assert.match(decision.criticismReportId,/^match:national:/);

  const notCalled=state();
  report(notCalled,{national:true,competition:"Copa do Mundo",status:"NAO_UTILIZADO",minutes:0,rating:null});
  assert.notEqual(next(notCalled).id,"criticism");
});

test("31.3.1: relatório com mais de cinco dias não habilita crítica",()=>{
  const s=state();
  report(s,{day:s.day-6});
  assert.notEqual(next(s).id,"criticism");
});

test("31.3.1: uma atuação não gera crítica repetida",()=>{
  const s=state();
  report(s);
  const first=next(s),restored=JSON.parse(JSON.stringify(s));
  D.Life.init(restored);
  const second=next(restored);
  assert.equal(first.id,"criticism");
  assert.notEqual(second.id,"criticism");
  assert.deepEqual(restored.life.criticismReportIds,[first.criticismReportId]);
});

test("31.3.1: save antigo descarta só crítica pendente inválida",()=>{
  const invalid=state();
  invalid.decision={id:"criticism",title:"Crítica",body:"Legada",choices:[["respond_calm","Responder"]],createdDay:invalid.day,deadline:invalid.day+7};
  const before={fans:invalid.fans,reputation:invalid.reputation};
  D.Life.init(invalid);
  assert.equal(invalid.decision,null);
  assert.deepEqual({fans:invalid.fans,reputation:invalid.reputation},before);
  assert.equal(invalid.decisionConsequences,undefined);

  const legitimate=state();
  legitimate.decision={id:"family",title:"Família",body:"Legítima",choices:[["visit","Visitar"]],createdDay:legitimate.day,deadline:legitimate.day+7};
  D.Life.init(legitimate);
  assert.equal(legitimate.decision.id,"family");
});

test("31.3.1: sorteio permanece determinístico com seed fixa",()=>{
  const a=state(3199),b=state(3199);
  report(a);report(b);
  const ra=new D.Random(998),rb=new D.Random(998);
  assert.deepEqual(D.Life.next(a,ra),D.Life.next(b,rb));
  assert.equal(ra.state,rb.state);
});
