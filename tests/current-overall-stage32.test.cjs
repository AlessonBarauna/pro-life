const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const CurrentOverall=require("../src/domain/current-overall.js");

function player(overrides={}){
  return {id:"hero",pos:"MEI",attrs:{pace:75,finish:75,pass:75,defense:75,strength:75,stamina:75},condition:100,morale:70,injury:0,...overrides};
}
function state(p,overrides={}){
  return {mode:"player",person:p,matches:[],extras:{playerCareer:{coachTrust:50,lastEvaluation:null}},...overrides};
}
const current=(s,p,context={})=>CurrentOverall.currentOverall(s,p,{overall:D.overall,...context});

test("32A: condição normal mantém o GER base",()=>{
  const p=player(),s=state(p);
  assert.equal(current(s,p),D.overall(p));
});

test("32A: excelente forma, moral e confiança elevam moderadamente o GER atual",()=>{
  const p=player({morale:100}),s=state(p,{matches:[{ratings:{hero:9.2}}],extras:{playerCareer:{coachTrust:100}}});
  const base=D.overall(p),value=current(s,p);
  assert.ok(value>base);assert.ok(value<=base+5);
});

test("32A: fadiga e preparo físico ruim reduzem o GER sem duplicar condition",()=>{
  const p=player({condition:35,physical:{fitness:55,fatigue:80}}),s=state(p);
  const detailed=current(s,p),samePhysical=current(s,{...p,condition:100});
  assert.ok(detailed<D.overall(p));assert.equal(detailed,samePhysical);
});

test("32A: lesão aplica redução adicional limitada",()=>{
  const healthy=player(),injured=player({injury:8}),s=state(injured);
  assert.ok(current(s,injured)<current(state(healthy),healthy));
  assert.ok(current(s,injured)>=D.overall(injured)-10);
});

test("32A: confiança do protagonista não afeta jogador de outro clube",()=>{
  const p=player({id:"rival"}),low=state(player(),{extras:{playerCareer:{coachTrust:0}}}),high=state(player(),{extras:{playerCareer:{coachTrust:100}}});
  assert.equal(current(low,p),current(high,p));
});

test("32A: GER próximo de 100 respeita o teto",()=>{
  const attrs={pace:99,finish:99,pass:99,defense:99,strength:99,stamina:99};
  const p=player({attrs,morale:100}),s=state(p,{matches:[{ratings:{hero:10}}],extras:{playerCareer:{coachTrust:100}}});
  assert.equal(current(s,p),100);
});

test("32A: ausência de indicadores opcionais usa valores neutros",()=>{
  const p={id:"other",pos:"DEF",attrs:{pace:70,finish:70,pass:70,defense:70,strength:70,stamina:70}};
  assert.equal(current({},p),D.overall(p));
});

test("32A: consulta é determinística e não altera estado nem jogador",()=>{
  const p=player({physical:{fitness:83,fatigue:24,active:null}}),s=state(p,{matches:[{ratings:{hero:7.4}}]});
  const before=structuredClone(s),a=current(s,p),b=current(s,p);
  assert.equal(a,b);assert.deepEqual(s,before);
});

test("32A: resultado sempre permanece entre 1 e 100",()=>{
  assert.equal(CurrentOverall.currentOverall({},player({overall:1,attrs:undefined,condition:0,morale:0,injury:30}),{baseOverall:()=>1,form:1}),1);
  assert.equal(CurrentOverall.currentOverall({},player({overall:100,attrs:undefined,morale:100}),{baseOverall:()=>100,form:10}),100);
});
