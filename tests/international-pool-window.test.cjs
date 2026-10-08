const test=require("node:test");
const assert=require("node:assert/strict");

const Pool=require("../src/domain/international-pool.js");

function p(id,pos,ovr){
  return {
    id,
    name:id,
    pos,
    ovr,
    age:26,
    nationality:"Brazil"
  };
}

function state(){
  return {
    day:20,
    season:2026,
    clubs:[
      {
        id:"elite",
        name:"Elite FC",
        level:88,
        roster:[
          p("g1","GOL",84),
          p("g2","GOL",78),

          p("d1","DEF",82),
          p("d2","DEF",81),
          p("d3","DEF",80),
          p("d4","DEF",79),
          p("d5","DEF",77),
          p("d6","DEF",75),

          p("m1","MEI",82),
          p("m2","MEI",80),
          p("m3","MEI",78),
          p("m4","MEI",77),
          p("m5","MEI",75)
        ]
      }
    ]
  };
}

test("closed transfer window does nothing",()=>{
  const s=state();

  const before=Pool.freeAgents(s).length;

  const deal=Pool.processTransferWindow(
    s,
    {
      open:false,
      windowKey:"2026:0"
    }
  );

  assert.equal(deal,null);
  assert.equal(
    Pool.freeAgents(s).length,
    before
  );
});

test("open window can produce one international signing",()=>{
  const s=state();

  const before=Pool.freeAgents(s).length;

  const deal=Pool.processTransferWindow(
    s,
    {
      open:true,
      windowKey:"2026:0"
    }
  );

  assert.ok(deal);

  assert.equal(
    Pool.freeAgents(s).length,
    before-1
  );
});

test("same window never produces second signing",()=>{
  const s=state();

  const first=Pool.processTransferWindow(
    s,
    {
      open:true,
      windowKey:"2026:0"
    }
  );

  const afterFirst=Pool.freeAgents(s).length;

  const second=Pool.processTransferWindow(
    s,
    {
      open:true,
      windowKey:"2026:0"
    }
  );

  assert.ok(first);
  assert.equal(second,null);

  assert.equal(
    Pool.freeAgents(s).length,
    afterFirst
  );
});

test("new window can make another decision",()=>{
  const s=state();

  const first=Pool.processTransferWindow(
    s,
    {
      open:true,
      windowKey:"2026:0"
    }
  );

  const second=Pool.processTransferWindow(
    s,
    {
      open:true,
      windowKey:"2026:1"
    }
  );

  assert.ok(first);
  assert.ok(second);

  assert.notEqual(
    first.player.id,
    second.player.id
  );
});

test("window history records signing",()=>{
  const s=state();

  const deal=Pool.processTransferWindow(
    s,
    {
      open:true,
      windowKey:"2026:0"
    }
  );

  assert.ok(deal);

  assert.equal(
    s.internationalMarketState.history.length,
    1
  );

  assert.equal(
    s.internationalMarketState.history[0].playerId,
    deal.player.id
  );

  assert.equal(
    s.internationalMarketState.history[0].clubId,
    deal.club.id
  );
});
