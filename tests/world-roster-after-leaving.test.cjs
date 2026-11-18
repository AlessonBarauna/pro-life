const test=require("node:test");
const assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const GF=require("../src/domain/global-football.js");
const C=D.Career;
test("jogadores do clube deixado voltam à busca mundial",()=>{
  const s=D.create({mode:"player",clubId:"c0"},4242);
  s.contract=4000;C.init(s);s.careerTransferAvailableDay=0;s.day=10;
  s.offers=[{clubId:"gf_bayern",salary:90000,role:"x",squadRole:"Titular",durationDays:1095,signingBonus:0,transferType:"permanent",expires:s.day+10}];
  D.join(s,"gf_bayern",90000);
  const own=s.worldMatchClubs.gf_bayern;
  // Simula a compra: o jogador sai do catálogo mundial e vive só no elenco do clube.
  const bought=s.internationalPlayers.find(p=>p.clubId!=="gf_bayern");
  s.internationalPlayers=s.internationalPlayers.filter(p=>p!==bought);bought.clubId="gf_bayern";own.roster.push(bought);
  const real=own.roster.filter(p=>p.id!=="hero"&&!String(p.id).includes("_wm_"));
  assert.ok(real.length>5);
  const ids=real.map(p=>p.id);
  s.careerTransferAvailableDay=0;
  s.offers=[{clubId:"c0",salary:80000,role:"x",squadRole:"Titular",durationDays:1095,signingBonus:0,transferType:"permanent",expires:s.day+10}];
  D.join(s,"c0",80000);
  const active=new Set(GF.activePlayers(s).map(p=>p.id));
  assert.ok(ids.includes(bought.id));
  assert.equal(ids.filter(id=>!active.has(id)).length,0);
});
