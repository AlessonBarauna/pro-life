"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Fixtures=require("../src/domain/champions-fixtures.js");
const Draw=require("../src/domain/champions-draw.js");

const D=require("../src/domain/engine.js");

test("34F.32B.2 sorteio real FC27 com 144 jogos e regras UEFA",()=>{
  const s=D.create({
    mode:"player",clubId:"c0",catalogVersion:"fc27_v1"
  },5);
  D.Continental.init(s);
  const ed=D.Continental.edition(s,"ucl");
  assert.equal(ed.entrants.length,36);

  const before=JSON.stringify(ed);
  const draw=Fixtures.generate(ed);
  assert.equal(draw.matches.length,144);
  assert.equal(JSON.stringify(ed),before);

  const pots=Draw.pots(ed);
  const clubPot=new Map();
  const country=new Map();
  for(let p=0;p<4;p++)for(const c of pots[p].clubs){
    clubPot.set(c.id,p);
    country.set(c.id,c.country);
  }

  const seen=new Set();
  for(const m of draw.matches){
    assert.ok(m.homeId!==m.awayId);
    assert.notEqual(country.get(m.homeId),country.get(m.awayId));
    const key=[m.homeId,m.awayId].sort().join("|");
    assert.ok(!seen.has(key),"Confronto duplicado");
    seen.add(key);
  }

  for(const [id,ownCountry] of country){
    const home=draw.matches.filter(m=>m.homeId===id);
    const away=draw.matches.filter(m=>m.awayId===id);
    assert.equal(home.length,4,id+" mandante");
    assert.equal(away.length,4,id+" visitante");

    const all=[...home,...away];
    for(let p=0;p<4;p++){
      const opponents=all.filter(m=>
        clubPot.get(m.homeId===id?m.awayId:m.homeId)===p
      );
      assert.equal(opponents.length,2,id+" pote "+p);
    }

    const byCountry={};
    for(const m of all){
      const other=m.homeId===id?m.awayId:m.homeId;
      const c=country.get(other);
      assert.notEqual(c,ownCountry);
      byCountry[c]=(byCountry[c]||0)+1;
    }
    assert.ok(Object.values(byCountry).every(n=>n<=2));
  }

  assert.deepEqual(Fixtures.generate(ed),draw);
  console.log("Sorteio valido. Tentativa:",draw.attempt);
});