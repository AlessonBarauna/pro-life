const test=require("node:test");
const assert=require("node:assert/strict");

const Pool=require("../src/domain/international-pool.js");

function player(id,pos,ovr){
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
    clubs:[
      {
        id:"elite",
        name:"Elite FC",
        level:88,
        roster:[
          player("gk1","GOL",84),
          player("gk2","GOL",76),
          player("d1","DEF",83),
          player("d2","DEF",82),
          player("d3","DEF",80),
          player("d4","DEF",78),
          player("d5","DEF",76),
          player("d6","DEF",74),
          player("m1","MEI",82),
          player("m2","MEI",80),
          player("m3","MEI",78),
          player("m4","MEI",76),
          player("m5","MEI",74)
        ]
      },
      {
        id:"small",
        name:"Small FC",
        level:68,
        roster:[
          player("sgk","GOL",65),
          player("sd1","DEF",64),
          player("sm1","MEI",64),
          player("sa1","ATA",65)
        ]
      }
    ]
  };
}

test("AI rejects elite players for weak club",()=>{
  const s=state();
  const club=s.clubs.find(c=>c.id==="small");

  const candidates=
    Pool.candidatesForClub(s,club);

  assert.equal(
    candidates.some(
      x=>x.player.id==="intl_vini_jr"
    ),
    false
  );
});

test("AI identifies positional weakness",()=>{
  const s=state();
  const club=s.clubs.find(c=>c.id==="elite");

  assert.ok(
    Pool.positionalNeed(club,"ATA") >
    Pool.positionalNeed(club,"GOL")
  );
});

test("AI prefers a player that addresses squad need",()=>{
  const s=state();
  const club=s.clubs.find(c=>c.id==="elite");

  const choice=Pool.chooseSigning(s,club);

  assert.ok(choice);
  assert.equal(choice.player.pos,"ATA");
});

test("best opportunity signs only one player",()=>{
  const s=state();

  const before=Pool.freeAgents(s).length;
  const deal=Pool.executeBestSigning(s);

  assert.ok(deal);
  assert.equal(
    Pool.freeAgents(s).length,
    before-1
  );

  const signedCount=s.clubs
    .flatMap(c=>c.roster||[])
    .filter(p=>String(p.id).startsWith("intl_"))
    .length;

  assert.equal(signedCount,1);
});

test("signed player belongs to selected club",()=>{
  const s=state();
  const deal=Pool.executeBestSigning(s);

  assert.ok(deal);
  assert.equal(
    deal.player.clubId,
    deal.club.id
  );

  assert.equal(
    deal.player.marketStatus,
    "signed"
  );
});
