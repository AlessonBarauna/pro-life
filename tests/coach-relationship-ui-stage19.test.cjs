
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const D=require("../src/domain/engine.js");

const appSource=
  fs.readFileSync(
    path.join(
      __dirname,
      "../src/ui/app.js"
    ),
    "utf8"
  );

function state(seed=1920){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);
  D.Squad.init(s);

  return s;
}

test("19B: UI usa trustSummary como fonte canonica",()=>{
  assert.match(
    appSource,
    /D\.Squad\.trustSummary\(state,5\)/
  );
});

test("19B: UI reutiliza objetivos canonicos da carreira",()=>{
  assert.match(
    appSource,
    /Career\.matchObjectives\(state\)/
  );
});

test("19B: painel de relacao aparece antes da disputa por posicao",()=>{
  assert.match(
    appSource,
    /\$\{coachRelation\}\$\{relation\}<section/
  );
});

test("19B: painel mostra confianca papel e tendencia",()=>{
  assert.match(
    appSource,
    /trust\.current/
  );

  assert.match(
    appSource,
    /trust\.role/
  );

  assert.match(
    appSource,
    /trust\.direction/
  );
});

test("19B: painel possui historico explicavel",()=>{
  assert.match(
    appSource,
    /trust\.history\.slice\(0,5\)/
  );

  assert.match(
    appSource,
    /row\.reason/
  );

  assert.match(
    appSource,
    /row\.delta/
  );
});

test("19B: painel nao altera coachTrust diretamente",()=>{
  const compact=
    appSource.replace(/\s+/g,"");

  assert.equal(
    compact.includes(
      "coachRelation.pc.coachTrust="
    ),
    false
  );
});

test("19B: resumo inicial e estavel sem historico",()=>{
  const s=state(1921);

  const summary=
    D.Squad.trustSummary(s);

  assert.equal(
    summary.current,
    55
  );

  assert.equal(
    summary.direction,
    "ESTAVEL"
  );

  assert.equal(
    summary.trend,
    0
  );

  assert.deepEqual(
    summary.history,
    []
  );
});

test("19B: feedback positivo reflete historico real",()=>{
  const s=state(1922);

  D.Squad.recordTrustChange(
    s,
    "training_manual",
    55,
    56.2,
    {
      eventId:"training-1",
      grade:"A"
    }
  );

  const summary=
    D.Squad.trustSummary(s);

  assert.equal(
    summary.direction,
    "SUBINDO"
  );

  assert.ok(
    summary.last.reason.length>10
  );

  assert.equal(
    summary.last.source,
    "training_manual"
  );
});

test("19B: feedback negativo reflete historico real",()=>{
  const s=state(1923);

  D.Squad.recordTrustChange(
    s,
    "match",
    55,
    50,
    {
      eventId:"match-bad",
      rating:5.4,
      status:"TITULAR"
    }
  );

  const summary=
    D.Squad.trustSummary(s);

  assert.equal(
    summary.direction,
    "CAINDO"
  );

  assert.ok(
    summary.last.delta<0
  );
});

test("19B: objetivos variam pela posicao usando regra existente",()=>{
  const ata=state(1924);
  ata.person.pos="ATA";

  const mei=state(1925);
  mei.person.pos="MEI";

  const def=state(1926);
  def.person.pos="DEF";

  assert.notDeepEqual(
    D.Career.matchObjectives(ata),
    D.Career.matchObjectives(mei)
  );

  assert.notDeepEqual(
    D.Career.matchObjectives(mei),
    D.Career.matchObjectives(def)
  );
});

test("19B: carreira de treinador nao recebe trustSummary",()=>{
  const s=D.create({
    mode:"coach",
    clubId:"c0"
  },1927);

  assert.equal(
    D.Squad.trustSummary(s),
    null
  );
});
