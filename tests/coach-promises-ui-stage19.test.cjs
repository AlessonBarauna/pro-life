
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const D=require("../src/domain/engine.js");

const source=
  fs.readFileSync(
    path.join(
      __dirname,
      "../src/ui/app.js"
    ),
    "utf8"
  );

function state(seed=1980){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);
  D.Squad.init(s);

  return s;
}

test("19E2: UI usa status canonico da promessa",()=>{
  assert.match(
    source,
    /D\.Squad\.coachPromiseStatus\(state\)/
  );
});

test("19E2: painel possui compromisso ativo",()=>{
  assert.match(
    source,
    /coach-promise-active/
  );

  assert.match(
    source,
    /COMPROMISSO DO TREINADOR/
  );
});

test("19E2: UI mostra progresso de minutos",()=>{
  assert.match(
    source,
    /promise\.minutes/
  );

  assert.match(
    source,
    /minutos/
  );
});

test("19E2: UI mostra progresso de titularidades",()=>{
  assert.match(
    source,
    /promise\.starts/
  );

  assert.match(
    source,
    /titularidades/
  );
});

test("19E2: UI mostra progresso de oportunidades",()=>{
  assert.match(
    source,
    /promise\.appearances/
  );

  assert.match(
    source,
    /oportunidade/
  );
});

test("19E2: UI mostra jogos elegiveis e prazo",()=>{
  assert.match(
    source,
    /promise\.eligibleGames/
  );

  assert.match(
    source,
    /promise\.maxGames/
  );

  assert.match(
    source,
    /jogos eleg/
  );
});

test("19E2: UI mostra historico da promessa",()=>{
  assert.match(
    source,
    /coach-promise-history/
  );

  assert.match(
    source,
    /promise\.resolution/
  );

  assert.match(
    source,
    /promise\.status/
  );
});

test("19E2: UI nao modifica promessa",()=>{
  const start=
    source.indexOf(
      "const promiseHtml ="
    );

  const end=
    source.indexOf(
      "const conversationHtml =",
      start
    );

  assert.ok(start>=0);
  assert.ok(end>start);

  const block=
    source.slice(start,end);

  for(const forbidden of [
    "coachTrust=",
    "activeCoachPromise=",
    "eligibleGames++",
    "minutes+=",
    "starts++",
    "appearances++"
  ]){
    assert.equal(
      block.includes(forbidden),
      false
    );
  }
});

test("19E2: status canonico expoe promessa ativa",()=>{
  const s=state(1981);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  const created=
    D.Squad.requestCoachPromise(
      s,
      "test"
    );

  const status=
    D.Squad.coachPromiseStatus(s);

  assert.ok(status.active);

  assert.equal(
    status.active.id,
    created.id
  );

  assert.equal(
    status.active.status,
    "ATIVA"
  );
});

test("19E2: status canonico expoe progresso",()=>{
  const s=state(1982);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  D.Squad.requestCoachPromise(
    s,
    "test"
  );

  D.Squad.evaluateCoachPromise(
    s,
    {
      day:1,
      season:s.season,
      competition:"Liga",
      opponent:"Teste",
      status:"ENTROU_DO_BANCO",
      minutes:12
    }
  );

  const active=
    D.Squad.coachPromiseStatus(s)
      .active;

  assert.ok(active);

  assert.equal(
    active.minutes,
    12
  );

  assert.equal(
    active.eligibleGames,
    1
  );
});

test("19E2: promessa cumprida aparece no historico",()=>{
  const s=state(1983);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=30;
  D.Career.updatePlayerRole(s);

  D.Squad.requestCoachPromise(
    s,
    "test"
  );

  D.Squad.evaluateCoachPromise(
    s,
    {
      day:1,
      season:s.season,
      competition:"Liga",
      opponent:"Teste",
      status:"ENTROU_DO_BANCO",
      minutes:15
    }
  );

  const status=
    D.Squad.coachPromiseStatus(s);

  assert.equal(
    status.active,
    null
  );

  assert.equal(
    status.history[0].status,
    "CUMPRIDA"
  );
});

test("19E2: promessa quebrada aparece no historico",()=>{
  const s=state(1984);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  D.Squad.requestCoachPromise(
    s,
    "test"
  );

  for(let day=1;day<=3;day++){
    D.Squad.evaluateCoachPromise(
      s,
      {
        day,
        season:s.season,
        competition:"Liga",
        opponent:"Teste "+day,
        status:"NAO_UTILIZADO",
        minutes:0
      }
    );
  }

  const status=
    D.Squad.coachPromiseStatus(s);

  assert.equal(
    status.active,
    null
  );

  assert.equal(
    status.history[0].status,
    "QUEBRADA"
  );
});

test("19E2: modo treinador nao recebe painel de promessa",()=>{
  const s=D.create({
    mode:"coach",
    clubId:"c0"
  },1985);

  assert.equal(
    D.Squad.coachPromiseStatus(s),
    null
  );
});
