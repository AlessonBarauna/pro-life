
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const Save=require("../src/infrastructure/save.js");

function state(seed=1930){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);
  D.Squad.init(s);

  return s;
}

test("19C: migra estado antigo de conversas",()=>{
  const s=state();
  const q=D.Squad.init(s);

  delete q.coachConversations;
  delete q.lastCoachConversationDay;
  delete q.activeCoachConversation;
  q.version=2;

  const migrated=D.Squad.init(s);

  assert.deepEqual(migrated.coachConversations,[]);
  assert.equal(migrated.activeCoachConversation,null);
  assert.equal(migrated.lastCoachConversationDay,-9999);
  assert.equal(migrated.version,3);
});

test("19C: jogador inicia conversa pelo application",()=>{
  const s=state(1931);

  const talk=A.execute(
    s,
    "startCoachConversation",
    {}
  );

  assert.ok(talk.id);
  assert.equal(talk.answered,false);
  assert.equal(talk.choices.length,3);

  assert.equal(
    D.Squad.init(s).activeCoachConversation.id,
    talk.id
  );
});

test("19C: conversa ativa nao duplica",()=>{
  const s=state(1932);

  const a=A.execute(
    s,
    "startCoachConversation",
    {}
  );

  const b=A.execute(
    s,
    "startCoachConversation",
    {}
  );

  assert.equal(a.id,b.id);
});

test("19C: resposta positiva altera confianca de forma limitada",()=>{
  const s=state(1933);
  const pc=D.Career.init(s).playerCareer;
  const before=pc.coachTrust;

  const talk=A.execute(
    s,
    "startCoachConversation",
    {}
  );

  const choice=
    talk.choices.find(x=>x.trust>0);

  A.execute(
    s,
    "respondCoachConversation",
    {
      choiceId:choice.id
    }
  );

  assert.ok(pc.coachTrust>before);
  assert.ok(pc.coachTrust-before<=1.2);
});

test("19C: resposta exigente pode reduzir confianca",()=>{
  const s=state(1934);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=30;
  D.Career.updatePlayerRole(s);

  const before=pc.coachTrust;

  const talk=A.execute(
    s,
    "startCoachConversation",
    {}
  );

  const choice=
    talk.choices.find(x=>x.id==="demand");

  assert.ok(choice);

  A.execute(
    s,
    "respondCoachConversation",
    {
      choiceId:"demand"
    }
  );

  assert.ok(pc.coachTrust<before);
  assert.ok(before-pc.coachTrust<=1.5);
});

test("19C: resposta registra historico canonico",()=>{
  const s=state(1935);

  const talk=A.execute(
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

  const row=
    D.Squad.init(s).trustHistory[0];

  assert.equal(row.source,"conversation");
  assert.equal(row.eventId,talk.id);
});

test("19C: resposta invalida e bloqueada",()=>{
  const s=state(1936);

  A.execute(
    s,
    "startCoachConversation",
    {}
  );

  assert.throws(
    () => A.execute(
      s,
      "respondCoachConversation",
      {
        choiceId:"invalid"
      }
    ),
    /Resposta inv/
  );
});

test("19C: mesma conversa nao pode ser respondida duas vezes",()=>{
  const s=state(1937);

  const talk=A.execute(
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

  assert.throws(
    () => A.execute(
      s,
      "respondCoachConversation",
      {
        choiceId:talk.choices[0].id
      }
    ),
    /indispon/
  );
});

test("19C: cooldown inicial e 14 dias",()=>{
  const s=state(1938);

  const talk=A.execute(
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

  assert.equal(status.available,false);
  assert.equal(status.daysRemaining,14);

  assert.throws(
    () => A.execute(
      s,
      "startCoachConversation",
      {}
    ),
    /14 dia/
  );
});

test("19C: cooldown termina apos 14 dias",()=>{
  const s=state(1939);

  const talk=A.execute(
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

  s.day+=14;

  assert.equal(
    D.Squad.coachConversationStatus(s).available,
    true
  );
});

test("19C: reload preserva conversa e cooldown",()=>{
  const s=state(1940);

  const talk=A.execute(
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

  const restored=
    Save.parse(
      JSON.stringify(s)
    );

  const q=D.Squad.init(restored);

  assert.equal(
    q.coachConversations.length,
    1
  );

  assert.equal(
    q.coachConversations[0].answered,
    true
  );

  assert.equal(
    D.Squad.coachConversationStatus(restored).available,
    false
  );
});

test("19C: inicio cria mensagem do treinador",()=>{
  const s=state(1941);

  const before=
    D.Career.init(s)
      .communications
      .messages.length;

  A.execute(
    s,
    "startCoachConversation",
    {}
  );

  const messages=
    D.Career.init(s)
      .communications
      .messages;

  assert.ok(messages.length>before);

  assert.ok(
    messages.some(
      m=>m.subject==="Conversa individual"
    )
  );
});

test("19C: resposta cria mensagem de conclusao",()=>{
  const s=state(1942);

  const talk=A.execute(
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

  const messages=
    D.Career.init(s)
      .communications
      .messages;

  assert.ok(
    messages.some(
      m=>m.subject==="Conversa conclu\u00edda"
    )
  );
});

test("19C: modo treinador continua bloqueado",()=>{
  const s=D.create({
    mode:"coach",
    clubId:"c0"
  },1943);

  assert.throws(
    () => A.execute(
      s,
      "startCoachConversation",
      {}
    ),
    /carreira de jogador/
  );

  assert.equal(
    D.Squad.coachConversationStatus(s),
    null
  );
});


test("19C: cooldown funciona quando a conversa acontece no dia zero",()=>{
  const s=state(1944);

  s.day=0;

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

  const q=
    D.Squad.init(s);

  assert.equal(
    q.lastCoachConversationDay,
    0
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

  s.day=13;

  assert.equal(
    D.Squad.coachConversationStatus(s).available,
    false
  );

  s.day=14;

  assert.equal(
    D.Squad.coachConversationStatus(s).available,
    true
  );
});
