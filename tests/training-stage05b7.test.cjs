"use strict";
// 05B.7 - uma sessao de treino remunerada por dia (manual ou automatica), sem treino em dia de partida.
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),A=require("../src/application/game.js"),S=require("../src/infrastructure/save.js");
const H={overall:D.overall,clamp:D.clamp};
function hero(seed=921){const s=D.create({clubId:"c0",pos:"ATA",age:20},seed);s.person.age=20;const p=D.Training.init(s);p.exerciseId="boxFinish";s.training="finish";s.intensity="normal";return s;}
const train=(s,automatic,seed=7)=>D.Training.performTraining(s,new D.Random(seed),H,{automatic});
const snap=s=>JSON.stringify({p:s.trainingPlan,a:s.person.attrs,c:s.person.condition});
function matchDay(s){s.day=(s.calendarDays?.[s.round]??7)+(s.season-2026)*365;assert.equal(D.Training.mandatoryCommitmentToday(s),true,"pre-condicao: dia de partida");}

test("1 manual -> automatico: uma sessao",()=>{const s=hero(),p=s.trainingPlan;assert.equal(train(s,false).available,true);const after=snap(s);assert.equal(train(s,true).available,false);assert.equal(p.sessions,1);assert.equal(snap(s),after);});
test("2 automatico -> manual: uma sessao",()=>{const s=hero(),p=s.trainingPlan;assert.equal(train(s,true).available,true);const after=snap(s);assert.equal(train(s,false).available,false);assert.equal(p.sessions,1);assert.equal(snap(s),after);});
test("3 manual -> manual: uma sessao",()=>{const s=hero();train(s,false);assert.equal(train(s,false).available,false);assert.equal(s.trainingPlan.sessions,1);});
test("4 automatico -> automatico: uma sessao",()=>{const s=hero();train(s,true);assert.equal(train(s,true).available,false);assert.equal(s.trainingPlan.sessions,1);});
test("5 dia de partida: manual e automatico bloqueados sem efeito",()=>{const s=hero();matchDay(s);const before=snap(s),rng=new D.Random(5),st=rng.state;for(const automatic of [false,true]){const r=D.Training.performTraining(s,rng,H,{automatic});assert.equal(r.available,false);}assert.equal(rng.state,st);assert.equal(snap(s),before);assert.equal(D.Training.trainingAvailable(s),false);const dr=D.Training.daily(s,new D.Random(5),H);assert.ok(!dr||dr.available===false);assert.equal(snap(s),before);});
test("6 dia livre: uma sessao permitida",()=>{const s=hero();assert.equal(D.Training.mandatoryCommitmentToday(s),false);assert.equal(D.Training.trainingAvailable(s),true);assert.equal(train(s,false).available,true);assert.equal(D.Training.trainingAvailable(s),false);});
test("7 dia seguinte: nova sessao permitida (manual apos automatico e vice-versa)",()=>{const s=hero();train(s,true);s.day+=1;assert.equal(train(s,false).available,true);s.day+=1;assert.equal(train(s,true).available,true);assert.equal(s.trainingPlan.sessions,3);});
test("8 lesionado: treinamento bloqueado",()=>{const s=hero();s.person.injury=3;const before=snap(s);assert.equal(train(s,false).available,false);assert.equal(train(s,true).available,false);assert.equal(snap(s),before);});
test("9 descanso: nenhum XP, sessao nem condicao negativa",()=>{const s=hero();s.intensity="rest";const before=snap(s);const r=train(s,false);assert.equal(r.available,false);assert.equal(snap(s),before);});
test("10 sessao bloqueada: XP, atributos, condicao e RNG inalterados",()=>{const s=hero();train(s,false);const before=snap(s),rng=new D.Random(11),st=rng.state;assert.equal(D.Training.performTraining(s,rng,H,{automatic:true}).available,false);assert.equal(rng.state,st);assert.equal(snap(s),before);});
test("11 troca de exercicio nao libera nova sessao no mesmo dia",()=>{const s=hero(),p=s.trainingPlan;A.execute(s,"train",{focus:"finish",intensity:"normal",exerciseId:"boxFinish"});const before={n:p.sessions,x:p.developmentXp,c:s.person.condition};const r=A.execute(s,"train",{focus:"pace",intensity:"hard",exerciseId:"sprint"});assert.equal(r.trained,false);assert.equal(p.exerciseId,"sprint");assert.deepEqual({n:p.sessions,x:p.developmentXp,c:s.person.condition},before);assert.throws(()=>A.execute(s,"train",{focus:"pace",intensity:"hard",exerciseId:"sprint"}),/treinou hoje/);
  // depois do automatico do dia tambem
  const t=hero();train(t,true);const b2=t.trainingPlan.sessions;const r2=A.execute(t,"train",{focus:"pace",intensity:"normal",exerciseId:"sprint"});assert.equal(r2.trained,false);assert.equal(t.trainingPlan.sessions,b2);});
test("12 carreira antiga com apenas um marcador preenchido",()=>{
  const a=hero();a.trainingPlan.lastTrainingDay=a.day;a.trainingPlan.lastAutoDay=-999;assert.equal(train(a,true).available,false);assert.equal(train(a,false).available,false);
  const b=hero();b.trainingPlan.lastAutoDay=b.day;b.trainingPlan.lastTrainingDay=-999;assert.equal(train(b,false).available,false);assert.equal(train(b,true).available,false);
  const c=hero();delete c.trainingPlan.lastAutoDay;D.Training.init(c);assert.equal(train(c,false).available,true);});
test("13 avanco de 30 dias equivale a 30 avancos de 1 dia",()=>{const a=hero(931),b=hero(931);D.advance(a,30);for(let i=0;i<30;i++)D.advance(b,1);for(const k of ["sessions","lastTrainingDay","lastAutoDay","developmentXp"])assert.equal(a.trainingPlan[k],b.trainingPlan[k],k);assert.deepEqual(a.person.attrs,b.person.attrs);assert.ok(a.trainingPlan.sessions<=30);assert.ok(a.person.condition>=0);});
test("14 salvar e carregar preservam os marcadores e o bloqueio",()=>{const s=hero();train(s,true);const r=S.parse(JSON.stringify(s));D.Training.init(r);for(const k of ["lastTrainingDay","lastAutoDay","sessions","developmentXp"])assert.equal(r.trainingPlan[k],s.trainingPlan[k],k);assert.ok(Array.isArray(r.trainingPlan.processedMatches)&&Array.isArray(r.trainingPlan.recentTraining));assert.equal(D.Training.trainingAvailable(r),false);assert.equal(train(r,false).available,false);});
