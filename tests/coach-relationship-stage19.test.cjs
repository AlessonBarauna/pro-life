
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const D=require("../src/domain/engine.js");
const Save=require("../src/infrastructure/save.js");

function state(seed=1901){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);
  D.Squad.init(s);

  return s;
}

test("19A: estado antigo migra para historico de confianca v2",()=>{
  const s=state();
  const q=D.Squad.init(s);

  delete q.trustHistory;
  delete q.lastTrustEvent;
  q.version=1;

  const migrated=D.Squad.init(s);

  assert.deepEqual(
    migrated.trustHistory,
    []
  );

  assert.equal(
    migrated.lastTrustEvent,
    null
  );

  assert.equal(
    migrated.version,
    3
  );
});

test("19A: treino manual registra motivo e delta",()=>{
  const s=state(1902);
  const pc=D.Career.init(s).playerCareer;
  const before=pc.coachTrust;

  D.Squad.trainingResult(s,{
    available:true,
    automatic:false,
    grade:"A"
  });

  const q=D.Squad.init(s);
  const row=q.trustHistory[0];

  assert.equal(
    q.trustHistory.length,
    1
  );

  assert.equal(
    row.source,
    "training_manual"
  );

  assert.equal(
    row.before,
    before
  );

  assert.ok(
    row.after>row.before
  );

  assert.ok(
    row.delta>0
  );

  assert.ok(
    row.reason.length>10
  );
});

test("19A: treino automatico possui origem propria",()=>{
  const s=state(1903);

  D.Squad.trainingResult(s,{
    available:true,
    automatic:true,
    grade:"B"
  });

  const row=
    D.Squad.init(s).trustHistory[0];

  assert.equal(
    row.source,
    "training_auto"
  );

  assert.equal(
    row.details.automatic,
    true
  );

  assert.equal(
    row.details.grade,
    "B"
  );
});

test("19A: treino nota D registra queda",()=>{
  const s=state(1904);

  D.Squad.trainingResult(s,{
    available:true,
    automatic:false,
    grade:"D"
  });

  const row=
    D.Squad.init(s).trustHistory[0];

  assert.ok(
    row.delta<0
  );

  assert.ok(
    row.reason.length>10
  );
});

test("19A: eventId impede duplicidade",()=>{
  const s=state(1905);

  const a=D.Squad.recordTrustChange(
    s,
    "match",
    50,
    55,
    {
      eventId:"match-1",
      rating:8
    }
  );

  const b=D.Squad.recordTrustChange(
    s,
    "match",
    50,
    55,
    {
      eventId:"match-1",
      rating:8
    }
  );

  assert.equal(a,b);

  assert.equal(
    D.Squad.init(s).trustHistory.length,
    1
  );
});

test("19A: delta zero nao cria evento",()=>{
  const s=state(1906);

  const row=
    D.Squad.recordTrustChange(
      s,
      "other",
      55,
      55
    );

  assert.equal(row,null);

  assert.equal(
    D.Squad.init(s).trustHistory.length,
    0
  );
});

test("19A: historico e limitado aos 80 eventos mais recentes",()=>{
  const s=state(1907);

  for(let i=0;i<100;i++){
    D.Squad.recordTrustChange(
      s,
      "other",
      40,
      41,
      {
        eventId:"event-"+i
      }
    );
  }

  const q=D.Squad.init(s);

  assert.equal(
    q.trustHistory.length,
    80
  );

  assert.equal(
    q.trustHistory[0].eventId,
    "event-99"
  );

  assert.equal(
    q.trustHistory.at(-1).eventId,
    "event-20"
  );
});

test("19A: resumo calcula tendencia positiva",()=>{
  const s=state(1908);

  D.Squad.recordTrustChange(
    s,
    "other",
    50,
    54,
    {eventId:"a"}
  );

  D.Squad.recordTrustChange(
    s,
    "other",
    54,
    56,
    {eventId:"b"}
  );

  const summary=
    D.Squad.trustSummary(s);

  assert.equal(
    summary.direction,
    "SUBINDO"
  );

  assert.equal(
    summary.trend,
    6
  );

  assert.equal(
    summary.history.length,
    2
  );
});

test("19A: resumo calcula tendencia negativa",()=>{
  const s=state(1909);

  D.Squad.recordTrustChange(
    s,
    "other",
    60,
    55,
    {eventId:"fall"}
  );

  assert.equal(
    D.Squad.trustSummary(s).direction,
    "CAINDO"
  );
});

test("19A: save reload preserva historico",()=>{
  const s=state(1910);

  D.Squad.recordTrustChange(
    s,
    "match",
    55,
    61,
    {
      eventId:"persist",
      rating:8.2,
      objectivesMet:2,
      objectivesTotal:2
    }
  );

  const restored=
    Save.parse(
      JSON.stringify(s)
    );

  const row=
    D.Squad.init(restored).trustHistory[0];

  assert.equal(
    row.eventId,
    "persist"
  );

  assert.equal(
    row.details.rating,
    8.2
  );

  assert.equal(
    row.details.objectivesMet,
    2
  );
});

test("19A: carreira de treinador nao cria historico de relacao",()=>{
  const s=D.create({
    mode:"coach",
    clubId:"c0"
  },1911);

  const row=
    D.Squad.recordTrustChange(
      s,
      "other",
      40,
      50
    );

  assert.equal(
    row,
    null
  );
});

test("19A: engine registra mudanca de confianca apos partida",()=>{
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
    /recordTrustChange\?\.\(s,"match"/
  );

  assert.match(
    src,
    /coach-trust:/
  );

  assert.match(
    src,
    /objectivesMet:report\.objectivesMet/
  );
});
