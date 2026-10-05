const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js"),A=require("../src/application/game.js"),S=require("../src/infrastructure/save.js");
function hero(pos="ATA",age=18){const s=D.create({clubId:"c0",pos,age},901+age);s.person.age=age;D.Training.init(s);return s;}
test("manual training awards grade XP progress energy and blocks same-day spam",()=>{const s=hero();const p=D.Training.init(s);p.exerciseId="boxFinish";const before=s.person.condition;A.execute(s,"train",{focus:"finish",intensity:"normal",exerciseId:"boxFinish"});assert.ok(["A","B","C","D"].includes(p.lastResult.grade));assert.ok(p.lastResult.xp>0);assert.ok(s.person.condition<before);assert.equal(D.Training.trainingAvailable(s),false);assert.throws(()=>A.execute(s,"train",{focus:"finish",intensity:"normal",exerciseId:"boxFinish"}),/treinou hoje/);});
test("attribute progress is gradual and high ratings cost more",()=>{const low=hero(),hi=hero();low.person.attrs.finish=60;hi.person.attrs.finish=90;D.Training.progressAttribute(low,"finish",70,D);D.Training.progressAttribute(hi,"finish",70,D);assert.ok(low.person.attrs.finish>=61);assert.equal(hi.person.attrs.finish,90);assert.ok(D.Training.attributeProgressPercent(hi,"finish")>0);});
test("age and archetype change progression efficiency",()=>{const young=hero("ATA",18),old=hero("ATA",30),other=hero("ATA",18);young.person.archetypeId="finisher";other.person.archetypeId="dribbler";D.Training.init(young);D.Training.init(old);D.Training.init(other);for(let i=0;i<5;i++){D.Training.progressAttribute(young,"finish",25,D);D.Training.progressAttribute(old,"finish",25,D);D.Training.progressAttribute(other,"finish",25,D);}assert.ok(young.person.attrs.finish>=old.person.attrs.finish);assert.ok((young.trainingPlan.attributeProgress.finish||0)!==(old.trainingPlan.attributeProgress.finish||0)||young.person.attrs.finish!==old.person.attrs.finish);assert.ok(young.person.attrs.finish>=other.person.attrs.finish);});
test("match XP is position-aware and cannot be awarded twice",()=>{const s=hero("DEF",22),p=D.Training.init(s);const m={season:s.season,date:s.day,competitionId:"test",round:1,homeId:s.clubId,awayId:"c1",participants:[["hero"],[]],ratings:{hero:8.2},playerStats:{hero:{tackles:7,minutes:90}},events:[],hg:1,ag:0};const first=D.Training.matchDevelopment(s,m,D),xp=p.developmentXp,second=D.Training.matchDevelopment(s,m,D);assert.ok(first.xp>0);assert.equal(second.duplicate,true);assert.equal(p.developmentXp,xp);assert.ok((p.attributeProgress.defense||0)+(p.attributeProgress.tackling||0)>0);});
test("training stage 3 survives save and migrates an old training plan",()=>{const s=hero();delete s.trainingPlan.attributeProgress;delete s.trainingPlan.recentTraining;delete s.trainingPlan.processedMatches;s.trainingPlan.exerciseId="finishing";D.Training.init(s);assert.equal(s.trainingPlan.exerciseId,"boxFinish");A.execute(s,"train",{focus:"finish",intensity:"normal",exerciseId:"boxFinish"});const r=S.parse(JSON.stringify(s));D.Training.init(r);assert.ok(r.trainingPlan.attributeProgress);assert.equal(r.trainingPlan.lastTrainingDay,s.day);assert.ok(r.trainingPlan.exerciseGrades.boxFinish);});

test("auto training runs on every eligible simulated day and keeps player preferences",()=>{const s=hero("ATA",20);const p=D.Training.init(s);p.exerciseId="boxFinish";s.training="shooting";s.intensity="normal";const start=s.day,xp=p.developmentXp,level=p.level;D.advance(s,10);assert.equal(p.sessions,10);assert.ok(p.developmentXp>xp);assert.ok(p.level>=level);assert.equal(p.lastAutoDay,start+10);assert.equal(p.lastTrainingDay,-999);assert.equal(s.training,"shooting");assert.equal(s.intensity,"normal");});
test("30-day bulk advance is deterministic-equivalent to 30 daily advances for training",()=>{const a=hero("ATA",21),b=hero("ATA",21);D.Training.init(a).exerciseId="boxFinish";D.Training.init(b).exerciseId="boxFinish";a.training=b.training="shooting";a.intensity=b.intensity="normal";D.advance(a,30);for(let i=0;i<30;i++)D.advance(b,1);assert.equal(a.trainingPlan.sessions,b.trainingPlan.sessions);assert.equal(a.trainingPlan.lastTrainingDay,b.trainingPlan.lastTrainingDay);assert.deepEqual(a.person.attrs,b.person.attrs);assert.equal(a.trainingPlan.developmentXp,b.trainingPlan.developmentXp);assert.equal(a.rng,b.rng);});
test("treino automático do dia simulado não bloqueia o treino manual; 30 dias e próximo jogo também liberam",()=>{
  const s=hero("ATA",20);D.Training.init(s).exerciseId="boxFinish";
  for(const step of [()=>D.advance(s,1),()=>D.advance(s,1),()=>D.simulateAdvance(s,"nextMatch"),()=>D.simulateAdvance(s,"30days")]){
    step();
    assert.equal(D.Training.trainingAvailable(s),true,"dia "+s.day);
    const r=A.execute(s,"train",{focus:"finish",intensity:"normal",exerciseId:"boxFinish"});
    assert.ok(r!==undefined);
    assert.equal(D.Training.trainingAvailable(s),false,"só uma sessão manual por dia");
  }
});


test("changing training plan after today's session saves the new routine without farming a second session",()=>{
  const s=hero("ATA",20),p=D.Training.init(s);p.exerciseId="boxFinish";
  A.execute(s,"train",{focus:"finish",intensity:"normal",exerciseId:"boxFinish"});
  const sessions=p.sessions,xp=p.developmentXp,condition=s.person.condition,rng=s.rng;
  const r=A.execute(s,"train",{focus:"pace",intensity:"hard",exerciseId:"sprint"});
  assert.equal(r.planUpdated,true);assert.equal(r.trained,false);
  assert.equal(p.exerciseId,"sprint");assert.equal(p.focus,"pace");assert.equal(s.training,"pace");assert.equal(s.intensity,"hard");
  assert.equal(p.sessions,sessions);assert.equal(p.developmentXp,xp);assert.equal(s.person.condition,condition);assert.equal(s.rng,rng);
  assert.throws(()=>A.execute(s,"train",{focus:"pace",intensity:"hard",exerciseId:"sprint"}),/treinou hoje/);
  D.advance(s,1);assert.equal(p.exerciseId,"sprint");assert.equal(s.training,"pace");assert.equal(s.intensity,"hard");assert.ok(p.sessions>sessions);
});
