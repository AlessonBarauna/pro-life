
const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");

function stripMarks(value){
  return Array
    .from(
      String(value||"")
        .normalize("NFD")
    )
    .filter(ch=>{
      const cp=ch.codePointAt(0);
      return cp<0x300 || cp>0x36f;
    })
    .join("");
}

function norm(value){
  return stripMarks(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g," ")
    .replace(/\s+/g," ")
    .trim();
}

const EXPECTED_NEW=[
  "bundesliga 2",
  "csl",
  "efl championship",
  "efl league one",
  "efl league two",
  "isl",
  "isuzu ute a league",
  "k league 1",
  "laliga hypermotion",
  "liga bbva mx",
  "ligue 2 bkt",
  "lpf",
  "mls",
  "roshn saudi league",
  "serie bkt",
  "trendyol super lig"
];

const FORBIDDEN=[
  "premier league",
  "laliga ea sports",
  "serie a enilive",
  "bundesliga",
  "ligue 1 mcdonald s",
  "liga portugal",
  "eredivisie",
  "1a pro league",
  "o bundesliga",
  "brack super league",
  "scottish premiership",
  "metropolitan division",
  "allsvenskan",
  "eliteserien",
  "ekstraklasa",
  "superliga",
  "sse airtricity men s premier division",
  "3 liga"
];

function world(seed){
  const s=D.create(
    {
      mode:"player",
      clubId:"c0"
    },
    seed
  );

  D.GlobalFootball.init(s);

  return s;
}

test("28A: importa somente as 16 novas ligas FC27",()=>{

  const s=world(28002);

  const leagues=
    (s.globalFootball?.leagues||[])
      .filter(l=>
        String(l.id)
          .startsWith("gf_fc27_")
      );

  assert.equal(
    leagues.length,
    16
  );

  assert.deepEqual(
    leagues
      .map(l=>norm(l.name))
      .sort(),
    [...EXPECTED_NEW].sort()
  );

  for(const name of FORBIDDEN){
    assert.equal(
      leagues.some(
        l=>norm(l.name)===name
      ),
      false,
      "liga antiga duplicada: "+name
    );
  }
});

test("28A: 315 clubes novos entram com elencos utilizaveis",()=>{

  const s=world(28003);

  const clubs=
    (s.globalFootball?.clubs||[])
      .filter(c=>
        String(c.id)
          .startsWith("gf_fc27_")
      );

  assert.equal(
    clubs.length,
    315
  );

  assert.equal(
    new Set(
      clubs.map(c=>c.id)
    ).size,
    315
  );

  for(const club of clubs){

    const roster=
      D.GlobalFootball
        .playersByClub(
          s,
          club.id
        );

    assert.ok(
      roster.length>=10,
      club.name+
      " ficou com apenas "+
      roster.length+
      " jogadores apos importacao"
    );
  }
});

test("28A: novas ligas sao elegiveis para competicao",()=>{

  const s=world(28004);

  const leagues=
    (s.globalFootball?.leagues||[])
      .filter(l=>
        String(l.id)
          .startsWith("gf_fc27_")
      );

  assert.equal(
    leagues.length,
    16
  );

  for(const league of leagues){

    assert.equal(
      league.competitionEligible,
      true
    );

    assert.ok(
      league.clubCount>=10
    );
  }
});

test("28A: Brasil PRO-LIFE continua autoridade",()=>{

  const s=world(28005);

  assert.equal(
    (s.clubs||[]).length,
    80
  );

  for(
    const id of
    ["serieA","serieB","serieC","serieD"]
  ){

    assert.equal(
      (s.clubs||[])
        .filter(
          c=>c.leagueId===id
        )
        .length,
      20
    );
  }
});

test("28A: ligas antigas nao sao recriadas pelo pack FC27",()=>{

  const s=world(28006);

  const names=
    (s.globalFootball?.leagues||[])
      .filter(l=>
        String(l.id)
          .startsWith("gf_fc27_")
      )
      .map(l=>norm(l.name));

  for(const forbidden of FORBIDDEN){

    assert.equal(
      names.includes(forbidden),
      false,
      "duplicou liga existente: "+
      forbidden
    );
  }
});
