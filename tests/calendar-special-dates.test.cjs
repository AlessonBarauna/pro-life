const test=require("node:test");
const assert=require("node:assert/strict");

const D=require("../src/domain/engine.js");
const Calendar=require("../src/ui/calendar.js");

function minimal(seed=17001){
  return D.create({
    mode:"player",
    world:"legacy",
    name:"Calendario",
    age:20,
    pos:"ATA",
    points:{}
  },seed);
}

function dayFromDate(year,month,day){
  const epoch=Date.UTC(2026,0,1);

  return Math.round(
    (
      Date.UTC(year,month-1,day)-
      epoch
    )/86400000
  );
}

test("Calendario: Ano-Novo aparece em 1 de janeiro",()=>{
  const s=minimal();

  s.day=dayFromDate(2026,1,1);

  const events=Calendar.events(s,D);

  const item=events.find(x=>
    x.title==="Ano-Novo" &&
    x.day===dayFromDate(2026,1,1)
  );

  assert(item);
  assert.equal(item.type,"event");
  assert.equal(item.destination,"calendar");
});

test("Calendario: Natal aparece em 25 de dezembro",()=>{
  const s=minimal();

  s.day=dayFromDate(2026,12,1);

  const events=Calendar.events(s,D);

  const item=events.find(x=>
    x.title==="Natal" &&
    x.day===dayFromDate(2026,12,25)
  );

  assert(item);
  assert.equal(item.type,"event");
  assert.equal(item.destination,"calendar");
});

test("Calendario: datas especiais se repetem em outra temporada",()=>{
  const s=minimal();

  s.day=dayFromDate(2028,6,1);

  const events=Calendar.events(s,D);

  assert(
    events.some(x=>
      x.title==="Ano-Novo" &&
      x.day===dayFromDate(2028,1,1)
    )
  );

  assert(
    events.some(x=>
      x.title==="Natal" &&
      x.day===dayFromDate(2028,12,25)
    )
  );
});

test("Calendario: eventos especiais nao alteram estado da carreira",()=>{
  const s=minimal();

  s.day=dayFromDate(2027,12,20);

  const before=JSON.stringify({
    day:s.day,
    wallet:s.wallet,
    reputation:s.reputation,
    clubId:s.clubId,
    contract:s.contract,
    decision:s.decision
  });

  Calendar.events(s,D);

  const after=JSON.stringify({
    day:s.day,
    wallet:s.wallet,
    reputation:s.reputation,
    clubId:s.clubId,
    contract:s.contract,
    decision:s.decision
  });

  assert.equal(after,before);
});

test("Calendario: Natal e Ano-Novo nao sao duplicados no mesmo ano",()=>{
  const s=minimal();

  s.day=dayFromDate(2027,6,1);

  const events=Calendar.events(s,D);

  const christmas=events.filter(x=>
    x.title==="Natal" &&
    x.day===dayFromDate(2027,12,25)
  );

  const newYear=events.filter(x=>
    x.title==="Ano-Novo" &&
    x.day===dayFromDate(2027,1,1)
  );

  assert.equal(christmas.length,1);
  assert.equal(newYear.length,1);
});
