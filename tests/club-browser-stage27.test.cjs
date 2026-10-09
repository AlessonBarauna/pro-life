"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const D=require("../src/domain/engine.js");
const Browser=require("../src/ui/club-browser.js");

function state(){
  const s=D.create(
    {
      mode:"player",
      clubId:"c0"
    },
    27027
  );

  D.GlobalFootball.init(s);

  return s;
}

test("club browser lista todos os clubes locais e globais sem perder IDs",()=>{
  const s=state();
  const snap=Browser.snapshot(s,D);

  const ids=new Set([
    ...(s.clubs||[])
      .map(c=>c.id),

    ...(s.globalFootball?.clubs||[])
      .filter(
        c=>c.generated!==true
      )
      .map(c=>c.id)
  ]);

  assert.equal(
    snap.clubs.length,
    ids.size,
    "Central deve listar apenas clubes completos, excluindo cascas generated"
  );

  assert.equal(
    snap.clubs.filter(
      c=>{
        const raw=
          s.globalFootball?.clubs
            ?.find(
              x=>x.id===c.id
            );

        return raw?.generated===true;
      }
    ).length,
    0,
    "clubes generated nao devem aparecer na Central"
  );

  assert.ok(
    snap.clubs.length>=300,
    "universo deve conter centenas de clubes"
  );

  assert.equal(
    new Set(
      snap.clubs.map(c=>c.id)
    ).size,
    snap.clubs.length
  );
});

test("club browser encontra clubes brasileiros e europeus com elenco",()=>{
  const s=state();
  const snap=Browser.snapshot(s,D);

  const flamengo=
    snap.clubs.find(
      c=>c.name==="Flamengo"
    );

  const european=
    snap.clubs.find(
      c=>
        c.id==="gf_barcelona" ||
        c.name==="FC Barcelona" ||
        c.name==="Barcelona" ||
        c.id==="gf_real_madrid"
    );

  assert.ok(flamengo);
  assert.ok(flamengo.players.length>=18);

  assert.ok(european);
  assert.ok(european.players.length>=18);
});

test("club browser monta XI e banco sem duplicar jogador",()=>{
  const s=state();
  const snap=Browser.snapshot(s,D);

  const club=
    snap.clubs.find(
      c=>c.players.length>=18
    );

  assert.ok(club);

  const formation=
    Browser.formationFor(
      club,
      D
    );

  assert.equal(
    formation.starters.length,
    11
  );

  const ids=
    formation.starters
      .map(p=>p.id)
      .filter(Boolean);

  assert.equal(
    new Set(ids).size,
    ids.length
  );

  assert.equal(
    formation.roster.length,
    club.players.length
  );
});

test("UI possui filtros, elenco, GER, POT e campo estilo FC",()=>{
  const source=
    fs.readFileSync(
      "src/ui/club-browser.js",
      "utf8"
    );

  for(const marker of [
    "data-club-browser-country",
    "data-club-browser-league",
    "data-club-browser-search",
    "data-club-browser-team",
    "ELENCO COMPLETO",
    "Time titular",
    "GER",
    "POT",
    "club-pitch"
  ]){
    assert.ok(
      source.includes(marker),
      marker
    );
  }
});

test("app integra Clubes no grupo Mundo",()=>{
  const app=
    fs.readFileSync(
      "src/ui/app.js",
      "utf8"
    );

  const html=
    fs.readFileSync(
      "index.html",
      "utf8"
    );

  const assets=
    fs.readFileSync(
      "tools/assets.cjs",
      "utf8"
    );

  assert.ok(
    app.includes(
      '["clubs", "Clubes"]'
    )
  );

  assert.ok(
    app.includes(
      "ProLifeClubBrowser"
    )
  );

  assert.ok(
    html.includes(
      'src/ui/club-browser.js'
    )
  );

  assert.ok(
    assets.includes(
      'src/ui/club-browser.js'
    )
  );
});
