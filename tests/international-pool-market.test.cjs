const test=require("node:test");
const assert=require("node:assert/strict");

const Pool=require("../src/domain/international-pool.js");

function state(){
  return {};
}

test("international market exposes value and salary",()=>{
  const s=state();
  const market=Pool.market(s);

  const vini=market.find(
    p=>p.id==="intl_vini_jr"
  );

  assert.ok(vini);
  assert.equal(vini.overall,89);
  assert.ok(vini.value>0);
  assert.ok(vini.salary>0);
  assert.equal(vini.transferType,undefined);
});

test("elite player rejects incompatible club",()=>{
  const s=state();
  const vini=Pool.find(s,"intl_vini_jr");

  const smallClub={
    id:"small",
    name:"Clube Pequeno",
    level:70,
    roster:[]
  };

  assert.equal(
    Pool.canJoinClub(vini,smallClub),
    false
  );
});

test("elite player can join compatible club",()=>{
  const s=state();
  const vini=Pool.find(s,"intl_vini_jr");

  const eliteClub={
    id:"elite",
    name:"Clube Elite",
    level:88,
    roster:[]
  };

  assert.equal(
    Pool.canJoinClub(vini,eliteClub),
    true
  );

  const deal=Pool.signForClub(
    s,
    vini.id,
    eliteClub
  );

  assert.equal(deal.transferType,"free");
  assert.equal(deal.value,0);
  assert.ok(deal.salary>0);

  assert.equal(
    eliteClub.roster.some(
      p=>p.id==="intl_vini_jr"
    ),
    true
  );

  assert.equal(
    Pool.freeAgents(s).some(
      p=>p.id==="intl_vini_jr"
    ),
    false
  );
});

test("signed player cannot be signed twice",()=>{
  const s=state();

  const eliteClub={
    id:"elite",
    name:"Clube Elite",
    level:88,
    roster:[]
  };

  Pool.signForClub(
    s,
    "intl_vini_jr",
    eliteClub
  );

  assert.throws(()=>{
    Pool.signForClub(
      s,
      "intl_vini_jr",
      eliteClub
    );
  });
});
