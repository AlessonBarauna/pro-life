const test=require("node:test");
const assert=require("node:assert/strict");

const Pool=
  require("../src/domain/international-pool.js");

const CORE=[
  "pace",
  "finish",
  "pass",
  "defense",
  "strength",
  "stamina"
];

test("international players expose canonical player attrs",()=>{
  const s={clubs:[]};

  const list=Pool.init(s);

  assert.ok(list.length);

  for(const p of list){
    assert.ok(p.attrs);

    for(const key of CORE)
      assert.equal(
        Number.isFinite(p.attrs[key]),
        true
      );

    assert.equal(
      Number.isFinite(p.injury),
      true
    );

    assert.equal(
      Number.isFinite(p.discipline),
      true
    );

    assert.equal(
      Number.isFinite(p.potential),
      true
    );

    assert.equal(
      Number.isFinite(p.goals),
      true
    );

    assert.equal(
      Number.isFinite(p.minutes),
      true
    );
  }
});

test("canonical attrs preserve configured overall",()=>{
  const s={clubs:[]};
  const p=Pool.init(s)[0];

  for(const key of CORE)
    assert.equal(
      p.attrs[key],
      p.ovr
    );
});

test("legacy international player is normalized",()=>{
  const legacy={
    id:"intl_legacy",
    name:"Legacy",
    age:24,
    pos:"ATA",
    nationality:"Brazil",
    ovr:84,
    marketStatus:"free_agent"
  };

  const s={
    internationalPlayers:[legacy],
    clubs:[]
  };

  Pool.init(s);

  assert.ok(legacy.attrs);
  assert.equal(legacy.attrs.pace,84);
  assert.equal(legacy.injury,0);
  assert.equal(legacy.goals,0);
  assert.ok(legacy.potential>=84);
});

test("signed legacy international in club roster is normalized",()=>{
  const player={
    id:"intl_signed",
    name:"Signed",
    age:26,
    pos:"MEI",
    nationality:"Brazil",
    ovr:82,
    marketStatus:"signed",
    clubId:"club1"
  };

  const s={
    internationalPlayers:[player],
    clubs:[
      {
        id:"club1",
        roster:[player]
      }
    ]
  };

  Pool.init(s);

  assert.ok(player.attrs);
  assert.equal(player.attrs.pass,82);
  assert.equal(player.injury,0);
  assert.equal(player.discipline,70);
});
