
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const Save=require("../src/infrastructure/save.js");

function state(seed=1960){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);
  D.Squad.init(s);

  return s;
}

function report(overrides={}){
  return {
    day:1,
    season:1,
    competition:"Liga",
    opponent:"Adversario",
    status:"TITULAR",
    minutes:90,
    ...overrides
  };
}

test("19E1: save antigo recebe estrutura de promessas",()=>{
  const s=state();
  const q=D.Squad.init(s);

  delete q.coachPromiseHistory;
  delete q.activeCoachPromise;
  delete q.promiseVersion;

  const migrated=D.Squad.init(s);

  assert.deepEqual(
    migrated.coachPromiseHistory,
    []
  );

  assert.equal(
    migrated.activeCoachPromise,
    null
  );

  assert.equal(
    migrated.promiseVersion,
    1
  );

  assert.equal(
    migrated.version,
    3
  );
});

test("19E1: reserva recebe plano de oportunidade",()=>{
  const s=state(1961);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=30;
  D.Career.updatePlayerRole(s);

  const plan=
    D.Squad.coachPromisePlan(s);

  assert.equal(
    plan.type,
    "opportunity"
  );

  assert.equal(
    plan.metric,
    "appearances"
  );

  assert.equal(
    plan.target,
    1
  );
});

test("19E1: rotacao recebe plano de minutos",()=>{
  const s=state(1962);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const plan=
    D.Squad.coachPromisePlan(s);

  assert.equal(
    plan.type,
    "minutes"
  );

  assert.equal(
    plan.target,
    30
  );
});

test("19E1: titular recebe plano de titularidades",()=>{
  const s=state(1963);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=65;
  D.Career.updatePlayerRole(s);

  const plan=
    D.Squad.coachPromisePlan(s);

  assert.equal(
    plan.type,
    "starter"
  );

  assert.equal(
    plan.metric,
    "starts"
  );

  assert.equal(
    plan.target,
    2
  );
});

test("19E1: pedir minutos na conversa pode gerar promessa",()=>{
  const s=state(1964);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=60;
  D.Career.updatePlayerRole(s);

  const talk=A.execute(
    s,
    "startCoachConversation",
    {}
  );

  const choice=
    talk.choices.find(
      x=>x.id==="minutes"
    );

  assert.ok(choice);

  const answered=A.execute(
    s,
    "respondCoachConversation",
    {
      choiceId:"minutes"
    }
  );

  assert.ok(
    answered.promiseId
  );

  assert.ok(
    D.Squad.coachPromiseStatus(s).active
  );
});

test("19E1: confianca muito baixa pode negar promessa",()=>{
  const s=state(1965);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=20;
  D.Career.updatePlayerRole(s);

  const talk=A.execute(
    s,
    "startCoachConversation",
    {}
  );

  assert.ok(
    talk.choices.some(
      x=>x.id==="demand"
    )
  );

  const answered=A.execute(
    s,
    "respondCoachConversation",
    {
      choiceId:"demand"
    }
  );

  assert.equal(
    answered.promiseId,
    null
  );

  assert.equal(
    D.Squad.coachPromiseStatus(s).active,
    null
  );
});

test("19E1: promessa nao muda squadRole nem coachTrust ao ser criada",()=>{
  const s=state(1966);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const roleBefore=pc.squadRole;
  const trustBefore=pc.coachTrust;

  D.Squad.requestCoachPromise(
    s,
    "test"
  );

  assert.equal(
    pc.squadRole,
    roleBefore
  );

  assert.equal(
    pc.coachTrust,
    trustBefore
  );
});

test("19E1: indisponibilidade nao consome jogo da promessa",()=>{
  const s=state(1967);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const promise=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      status:"INDISPONIVEL",
      minutes:0
    })
  );

  assert.equal(
    promise.eligibleGames,
    0
  );

  assert.equal(
    promise.status,
    "ATIVA"
  );
});

test("19E1: promessa de oportunidade e cumprida ao entrar do banco",()=>{
  const s=state(1968);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=30;
  D.Career.updatePlayerRole(s);

  const moraleBefore=s.person.morale;

  const promise=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      status:"ENTROU_DO_BANCO",
      minutes:18
    })
  );

  assert.equal(
    promise.status,
    "CUMPRIDA"
  );

  assert.equal(
    D.Squad.coachPromiseStatus(s).active,
    null
  );

  assert.ok(
    s.person.morale>=moraleBefore
  );
});

test("19E1: promessa de minutos acumula jogos",()=>{
  const s=state(1969);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const promise=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      day:1,
      status:"ENTROU_DO_BANCO",
      minutes:12
    })
  );

  assert.equal(
    promise.status,
    "ATIVA"
  );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      day:2,
      status:"ENTROU_DO_BANCO",
      minutes:20
    })
  );

  assert.equal(
    promise.status,
    "CUMPRIDA"
  );

  assert.equal(
    promise.minutes,
    32
  );
});

test("19E1: promessa de titularidade exige duas titularidades",()=>{
  const s=state(1970);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=65;
  D.Career.updatePlayerRole(s);

  const promise=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      day:1,
      status:"TITULAR",
      minutes:70
    })
  );

  assert.equal(
    promise.status,
    "ATIVA"
  );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      day:2,
      status:"TITULAR",
      minutes:80
    })
  );

  assert.equal(
    promise.status,
    "CUMPRIDA"
  );

  assert.equal(
    promise.starts,
    2
  );
});

test("19E1: promessa quebrada apos tres jogos elegiveis",()=>{
  const s=state(1971);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const moraleBefore=s.person.morale;

  const promise=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  for(let day=1;day<=3;day++){
    D.Squad.evaluateCoachPromise(
      s,
      report({
        day,
        status:"NAO_UTILIZADO",
        minutes:0
      })
    );
  }

  assert.equal(
    promise.status,
    "QUEBRADA"
  );

  assert.equal(
    D.Squad.coachPromiseStatus(s).active,
    null
  );

  assert.ok(
    s.person.morale<moraleBefore
  );
});

test("19E1: mesma partida nao e contabilizada duas vezes",()=>{
  const s=state(1972);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const promise=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  const r=report({
    day:1,
    status:"ENTROU_DO_BANCO",
    minutes:10
  });

  D.Squad.evaluateCoachPromise(s,r);
  D.Squad.evaluateCoachPromise(s,r);

  assert.equal(
    promise.eligibleGames,
    1
  );

  assert.equal(
    promise.minutes,
    10
  );
});

test("19E1: save reload preserva promessa ativa",()=>{
  const s=state(1973);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const promise=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      day:1,
      status:"ENTROU_DO_BANCO",
      minutes:10
    })
  );

  const restored=
    Save.parse(
      JSON.stringify(s)
    );

  const active=
    D.Squad.coachPromiseStatus(restored)
      .active;

  assert.ok(active);

  assert.equal(
    active.id,
    promise.id
  );

  assert.equal(
    active.minutes,
    10
  );
});

test("19E1: resolver promessa nao altera coachTrust",()=>{
  const s=state(1974);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=30;
  D.Career.updatePlayerRole(s);

  const trustBefore=pc.coachTrust;

  D.Squad.requestCoachPromise(
    s,
    "test"
  );

  D.Squad.evaluateCoachPromise(
    s,
    report({
      status:"ENTROU_DO_BANCO",
      minutes:10
    })
  );

  assert.equal(
    pc.coachTrust,
    trustBefore
  );
});

test("19E1: engine integra promessa ao relatorio real da partida",()=>{
  const fs=require("node:fs");
  const path=require("node:path");

  const src=
    fs.readFileSync(
      path.join(
        __dirname,
        "../src/domain/engine.js"
      ),
      "utf8"
    );

  assert.match(
    src,
    /evaluateCoachPromise\?\.\(s,report\)/
  );
});

test("19E1: carreira de treinador nao possui promessa",()=>{
  const s=D.create({
    mode:"coach",
    clubId:"c0"
  },1975);

  assert.equal(
    D.Squad.coachPromiseStatus(s),
    null
  );

  assert.equal(
    D.Squad.requestCoachPromise(
      s,
      "test"
    ),
    null
  );
});
