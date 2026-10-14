"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const H={overall:D.overall,clamp:D.clamp};
function career(){
 const s=D.create({clubId:"c0",pos:"ATA",age:20},4921);
 s.day=0;
 const p=D.Training.init(s);
 p.exerciseId="boxFinish";
 p.lastTrainingDay=-999;
 p.lastAutoDay=-999;
 s.intensity="normal";
 return s;
}
test("primeiro dia da carreira permite treinamento real",()=>{
 const s=career();
 assert.equal(D.Training.mandatoryCommitmentToday(s),false);
 assert.equal(D.Training.trainingAvailable(s),true);
 const r=D.Training.performTraining(s,new D.Random(7),H,{automatic:false});
 assert.equal(r.available,true);
 assert.equal(s.trainingPlan.sessions,1);
 assert.equal(D.Training.trainingAvailable(s),false);
});
test("treino automatico nao duplica a primeira sessao",()=>{
 const s=career();
 const r=D.Training.performTraining(s,new D.Random(7),H,{automatic:true});
 assert.equal(r.available,true);
 const again=D.Training.performTraining(s,new D.Random(7),H,{automatic:false});
 assert.equal(again.available,false);
 assert.equal(s.trainingPlan.sessions,1);
 s.day=1;
 assert.equal(D.Training.trainingAvailable(s),true);
});
test("marcador dia zero bloqueia, mas marcadores ausentes sao inicializados",()=>{
 const s=career();
 s.trainingPlan.lastAutoDay=0;
 assert.equal(D.Training.trainingAvailable(s),false);
 s.trainingPlan.lastAutoDay=-999;
 delete s.trainingPlan.lastTrainingDay;
 D.Training.init(s);
 assert.equal(D.Training.trainingAvailable(s),true);
});
