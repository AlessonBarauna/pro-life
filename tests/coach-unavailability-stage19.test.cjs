
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const D=require("../src/domain/engine.js");

function state(seed=2010){
  const s=D.create({
    mode:"player",
    clubId:"c0"
  },seed);

  D.Career.init(s);

  return s;
}

function matchFor(s){
  const opponent=
    s.clubs.find(
      c=>c.id!==s.clubId
    );

  return {
    home:s.clubId,
    away:opponent.id,
    hg:0,
    ag:0,
    ratings:{},
    events:[],
    playerStats:{},
    offensiveStats:{}
  };
}

test("19F2: jogador lesionado nao perde confianca se nao atuar",()=>{
  const s=state(2011);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=55;
  D.Career.updatePlayerRole(s);

  s.person.injury=5;
  s.person.suspension=0;
  delete s.person._competitionSuspended;

  const before=
    pc.coachTrust;

  D.Career.match(
    s,
    matchFor(s)
  );

  assert.equal(
    pc.coachTrust,
    before
  );
});

test("19F2: jogador suspenso nao perde confianca se nao atuar",()=>{
  const s=state(2012);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=55;
  D.Career.updatePlayerRole(s);

  s.person.injury=0;
  s.person.suspension=1;
  delete s.person._competitionSuspended;

  const before=
    pc.coachTrust;

  D.Career.match(
    s,
    matchFor(s)
  );

  assert.equal(
    pc.coachTrust,
    before
  );
});

test("19F2: suspensao de competicao nao perde confianca",()=>{
  const s=state(2013);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=55;
  D.Career.updatePlayerRole(s);

  s.person.injury=0;
  s.person.suspension=0;
  s.person._competitionSuspended=true;

  const before=
    pc.coachTrust;

  D.Career.match(
    s,
    matchFor(s)
  );

  assert.equal(
    pc.coachTrust,
    before
  );
});

test("19F2: jogador disponivel e nao utilizado continua perdendo confianca",()=>{
  const s=state(2014);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=55;
  D.Career.updatePlayerRole(s);

  s.person.injury=0;
  s.person.suspension=0;
  delete s.person._competitionSuspended;

  const before=
    pc.coachTrust;

  D.Career.match(
    s,
    matchFor(s)
  );

  assert.equal(
    pc.coachTrust,
    before-1
  );
});

test("19F2: indisponibilidade nao altera papel quando confianca fica igual",()=>{
  const s=state(2015);
  const pc=D.Career.init(s).playerCareer;

  pc.coachTrust=58;
  D.Career.updatePlayerRole(s);

  const beforeRole=
    pc.squadRole;

  s.person.injury=3;

  D.Career.match(
    s,
    matchFor(s)
  );

  assert.equal(
    pc.coachTrust,
    58
  );

  assert.equal(
    pc.squadRole,
    beforeRole
  );
});

test("19F2: regra antiga de menos um ficou condicionada a disponibilidade",()=>{
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
    /if\(!unavailable\) pc\.coachTrust = clamp\(pc\.coachTrust - 1, 0, 100\);/
  );
});

test("19F2: regra considera lesao suspensao e suspensao de competicao",()=>{
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
    /!!s\.person\.injury/
  );

  assert.match(
    src,
    /Number\(s\.person\.suspension \|\| 0\) > 0/
  );

  assert.match(
    src,
    /!!s\.person\._competitionSuspended/
  );
});
