
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");

const source=
  fs.readFileSync(
    path.join(
      __dirname,
      "../src/ui/app.js"
    ),
    "utf8"
  );

function state(seed=1950){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);
  D.Squad.init(s);

  return s;
}

test("19D: UI consulta status canonico da conversa",()=>{
  assert.match(
    source,
    /D\.Squad\.coachConversationStatus\(state\)/
  );
});

test("19D: UI possui botao para iniciar conversa",()=>{
  assert.match(
    source,
    /data-start-coach-conversation/
  );

  assert.match(
    source,
    /Conversar com o treinador/
  );
});

test("19D: UI possui botoes de resposta dinamicos",()=>{
  assert.match(
    source,
    /data-coach-conversation-choice/
  );

  assert.match(
    source,
    /active\.choices/
  );
});

test("19D: iniciar conversa passa pela Application",()=>{
  assert.match(
    source,
    /command\("startCoachConversation"\)/
  );
});

test("19D: responder conversa passa pela Application",()=>{
  assert.match(
    source,
    /"respondCoachConversation"/
  );

  assert.match(
    source,
    /choiceId:b\.dataset\.coachConversationChoice/
  );
});

test("19D: UI mostra cooldown em dias",()=>{
  assert.match(
    source,
    /conversationStatus\.daysRemaining/
  );

  assert.match(
    source,
    /coach-conversation-cooldown/
  );
});

test("19D: UI nao altera coachTrust diretamente na conversa",()=>{
  const start=
    source.indexOf(
      "const conversationHtml ="
    );

  const end=
    source.indexOf(
      "const historyHtml =",
      start
    );

  assert.ok(start>=0);
  assert.ok(end>start);

  const block=
    source.slice(start,end);

  assert.equal(
    block.includes(
      "coachTrust="
    ),
    false
  );

  assert.equal(
    block.includes(
      "coachTrust +="
    ),
    false
  );
});

test("19D: fluxo application inicia e responde conversa",()=>{
  const s=state(1951);

  const before=
    D.Career.init(s)
      .playerCareer
      .coachTrust;

  const talk=
    A.execute(
      s,
      "startCoachConversation",
      {}
    );

  assert.ok(talk);
  assert.equal(
    D.Squad.coachConversationStatus(s)
      .active
      .id,
    talk.id
  );

  A.execute(
    s,
    "respondCoachConversation",
    {
      choiceId:talk.choices[0].id
    }
  );

  assert.equal(
    D.Squad.coachConversationStatus(s)
      .active,
    null
  );

  assert.notEqual(
    D.Career.init(s)
      .playerCareer
      .coachTrust,
    before
  );
});

test("19D: depois da resposta UI recebera estado de cooldown",()=>{
  const s=state(1952);

  const talk=
    A.execute(
      s,
      "startCoachConversation",
      {}
    );

  A.execute(
    s,
    "respondCoachConversation",
    {
      choiceId:talk.choices[0].id
    }
  );

  const status=
    D.Squad.coachConversationStatus(s);

  assert.equal(
    status.available,
    false
  );

  assert.equal(
    status.daysRemaining,
    14
  );
});

test("19D: carreira de treinador nao possui conversa",()=>{
  const s=D.create({
    mode:"coach",
    clubId:"c0"
  },1953);

  assert.equal(
    D.Squad.coachConversationStatus(s),
    null
  );
});
