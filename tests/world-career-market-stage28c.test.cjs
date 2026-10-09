
"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");

function state(seed=28200){
  return D.create(
    {
      mode:"player",
      clubId:"c0"
    },
    seed
  );
}

test("28C: catalogo de carreira inclui clubes locais e globais reais",()=>{
  const s=state();

  const pool=
    D.careerClubPool(s);

  assert.ok(pool.length>300);

  assert.ok(
    pool.some(
      c=>c.id==="gf_real_madrid"
    )
  );

  assert.ok(
    pool.some(
      c=>c.id==="gf_man_united"
    )
  );

  assert.equal(
    new Set(pool.map(c=>c.id)).size,
    pool.length
  );
});

test("28C: club() resolve clube global",()=>{
  const s=state(28201);

  const real=
    D.club(
      s,
      "gf_real_madrid"
    );

  assert.ok(real);
  assert.equal(
    real.id,
    "gf_real_madrid"
  );
});

test("28C: mercado oficial pode gerar clube global",()=>{
  const s=state(28202);

  s.person.attrs=
    Object.fromEntries(
      Object.keys(s.person.attrs)
        .map(k=>[k,90])
    );

  s.reputation=90;

  const rng=
    new D.Random(28202);

  let foundGlobal=false;

  for(let i=0;i<30;i++){

    const offers=
      D.weightedCareerOffers(
        s,
        rng,
        8
      );

    if(
      offers.some(
        o=>
          String(o.clubId)
            .startsWith("gf_")
      )
    ){
      foundGlobal=true;
      break;
    }
  }

  assert.equal(
    foundGlobal,
    true
  );
});

test("28C: jogador pode transferir para clube global mantendo identidade",()=>{
  const s=state(28203);

  const destination=
    D.club(
      s,
      "gf_real_madrid"
    );

  assert.ok(destination);

  D.movePlayerToClub(
    s,
    destination.id
  );

  assert.equal(
    s.clubId,
    destination.id
  );

  const hero=
    D.GlobalFootball.playerById(
      s,
      "hero"
    );

  assert.ok(hero);
  assert.equal(
    hero.clubId,
    destination.id
  );
});

test("28C: transferencia global nao duplica hero",()=>{
  const s=state(28204);

  D.movePlayerToClub(
    s,
    "gf_man_united"
  );

  D.movePlayerToClub(
    s,
    "gf_real_madrid"
  );

  const heroes=
    D.GlobalFootball
      .allPlayers(s)
      .filter(
        p=>p.id==="hero"
      );

  assert.equal(
    heroes.length,
    1
  );

  assert.equal(
    heroes[0].clubId,
    "gf_real_madrid"
  );
});

test("28C: clube global possui liga e pode ter proposta com contrato",()=>{
  const s=state(28205);

  const c=
    D.club(
      s,
      "gf_real_madrid"
    );

  assert.ok(c);
  assert.ok(c.leagueId);

  s.person.attrs=
    Object.fromEntries(
      Object.keys(s.person.attrs)
        .map(k=>[k,92])
    );

  s.reputation=95;

  const rng=
    new D.Random(28205);

  const offers=
    D.weightedCareerOffers(
      s,
      rng,
      20
    );

  for(const o of offers){
    assert.ok(
      D.club(
        s,
        o.clubId
      )
    );

    assert.ok(
      o.salary>0
    );

    assert.ok(
      o.durationDays>=365
    );
  }
});


test("28C: ids globais usados pelo mercado existem",()=>{

  const s=state(28206);

  for(
    const id of [
      "gf_real_madrid",
      "gf_man_united"
    ]
  ){

    const c=
      D.club(
        s,
        id
      );

    assert.ok(
      c,
      id
    );

    assert.equal(
      c.id,
      id
    );

    assert.ok(
      c.leagueId,
      id
    );
  }
});
