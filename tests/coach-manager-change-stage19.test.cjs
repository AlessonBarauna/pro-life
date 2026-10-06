
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const D=require("../src/domain/engine.js");
const A=require("../src/application/game.js");
const Save=require("../src/infrastructure/save.js");

function state(seed=1990){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);
  D.Squad.init(s);

  return s;
}

function change(s,overrides={}){
  return {
    day:s.day,
    season:s.season,
    clubId:s.clubId,
    club:D.club(s)?.name||"Clube",
    reason:"sequencia ruim",
    ...overrides
  };
}

test("19F1: migra controle da troca de treinador",()=>{
  const s=state();
  const q=D.Squad.init(s);

  delete q.managerGeneration;
  delete q.lastManagerChangeKey;

  const migrated=D.Squad.init(s);

  assert.equal(
    migrated.managerGeneration,
    0
  );

  assert.equal(
    migrated.lastManagerChangeKey,
    null
  );
});

test("19F1: confianca alta e recalibrada",()=>{
  const s=state(1991);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=90;
  D.Career.updatePlayerRole(s);

  const result=
    D.Squad.handleManagerChange(
      s,
      change(s)
    );

  assert.ok(result);

  assert.ok(
    pc.coachTrust<90
  );

  assert.ok(
    pc.coachTrust>=42 &&
    pc.coachTrust<=62
  );
});

test("19F1: confianca baixa aproxima do neutro",()=>{
  const s=state(1992);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=20;
  D.Career.updatePlayerRole(s);

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  assert.ok(
    pc.coachTrust>20
  );

  assert.ok(
    pc.coachTrust>=42
  );
});

test("19F1: papel continua derivado da confianca",()=>{
  const s=state(1993);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=90;
  D.Career.updatePlayerRole(s);

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  const expected=
    pc.coachTrust>=88 ? "Estrela" :
    pc.coachTrust>=74 ? "Importante" :
    pc.coachTrust>=58 ? "Titular" :
    pc.coachTrust>=42 ? "Rota??o" :
    pc.coachTrust>=25 ? "Reserva" :
    "Fora dos planos";

  assert.equal(
    pc.squadRole,
    expected
  );
});

test("19F1: registra evento canonico",()=>{
  const s=state(1994);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=85;
  D.Career.updatePlayerRole(s);

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  const event=
    D.Squad.init(s)
      .trustHistory[0];

  assert.equal(
    event.source,
    "manager_change"
  );

  assert.match(
    event.eventId,
    /^manager-change:/
  );
});

test("19F1: cancela promessa ativa",()=>{
  const s=state(1995);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=50;
  D.Career.updatePlayerRole(s);

  D.Squad.requestCoachPromise(
    s,
    "test"
  );

  assert.ok(
    D.Squad.coachPromiseStatus(s).active
  );

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  const status=
    D.Squad.coachPromiseStatus(s);

  assert.equal(
    status.active,
    null
  );

  assert.equal(
    status.history[0].status,
    "CANCELADA"
  );
});

test("19F1: encerra conversa aberta",()=>{
  const s=state(1996);

  A.execute(
    s,
    "startCoachConversation",
    {}
  );

  assert.ok(
    D.Squad.coachConversationStatus(s).active
  );

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  assert.equal(
    D.Squad.coachConversationStatus(s).active,
    null
  );

  assert.equal(
    D.Squad.init(s)
      .coachConversations[0]
      .cancelled,
    true
  );
});

test("19F1: mesma troca nao processa duas vezes",()=>{
  const s=state(1997);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=88;
  D.Career.updatePlayerRole(s);

  const item=change(s);

  const first=
    D.Squad.handleManagerChange(
      s,
      item
    );

  const after=
    pc.coachTrust;

  const second=
    D.Squad.handleManagerChange(
      s,
      item
    );

  assert.ok(first);
  assert.equal(second,null);
  assert.equal(pc.coachTrust,after);
});

test("19F1: outro clube nao altera relacao",()=>{
  const s=state(1998);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=78;
  D.Career.updatePlayerRole(s);

  const before=pc.coachTrust;

  const result=
    D.Squad.handleManagerChange(
      s,
      change(s,{
        clubId:"outro"
      })
    );

  assert.equal(result,null);
  assert.equal(pc.coachTrust,before);
});

test("19F1: modo treinador nao recebe recalibracao propria",()=>{
  const s=D.create({
    mode:"coach",
    clubId:"c0"
  },1999);

  assert.equal(
    D.Squad.handleManagerChange(
      s,
      {
        day:s.day,
        season:s.season,
        clubId:s.clubId
      }
    ),
    null
  );
});

test("19F1: incrementa geracao do treinador",()=>{
  const s=state(2000);
  const q=D.Squad.init(s);

  assert.equal(
    q.managerGeneration,
    0
  );

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  assert.equal(
    q.managerGeneration,
    1
  );
});

test("19F1: save preserva geracao e chave",()=>{
  const s=state(2001);

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  const restored=
    Save.parse(
      JSON.stringify(s)
    );

  const q=D.Squad.init(restored);

  assert.equal(
    q.managerGeneration,
    1
  );

  assert.ok(
    q.lastManagerChangeKey
  );
});

test("19F1: mundo permite troca no clube atual do jogador",()=>{
  const src=
    fs.readFileSync(
      path.join(
        __dirname,
        "../src/domain/career.js"
      ),
      "utf8"
    );

  assert.match(
    src,
    /s\.mode==="coach" \? c\.id!==s\.clubId : true/
  );
});

test("19F1: mundo chama integracao da relacao",()=>{
  const src=
    fs.readFileSync(
      path.join(
        __dirname,
        "../src/domain/career.js"
      ),
      "utf8"
    );

  assert.match(
    src,
    /handleManagerChange\?\.\(s,item\)/
  );
});

test("19F1: troca gera mensagem importante",()=>{
  const s=state(2002);

  D.Squad.handleManagerChange(
    s,
    change(s)
  );

  const messages=
    D.Career.init(s)
      .communications
      .messages;

  assert.ok(
    messages.some(
      m=>
        m.category==="TREINADOR" &&
        m.priority==="IMPORTANTE"
    )
  );
});
