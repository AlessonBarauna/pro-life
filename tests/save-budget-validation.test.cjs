"use strict";
// Aporte de R$ 10 bilhoes: o limite de c.budget foi ampliado (1e10 -> 1e12) sem enfraquecer as demais validacoes.
const test=require("node:test"),assert=require("node:assert/strict");
const memory=new Map();global.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
const D=require("../src/domain/engine.js");
global.ProLifeCompactSave=require("../src/infrastructure/compact-save.js");
const S=require("../src/infrastructure/save.js");
const fresh=()=>D.create({mode:"coach",clubId:"c0",catalogVersion:"fc27_v1"},777);
const roundtrip=(s)=>S.parse(JSON.stringify(s));
test("budget de R$ 10,0 bilhoes + saldo original e aceito (ida e volta)",()=>{const s=fresh(),own=D.club(s),base=own.budget;own.budget=base+10000000000;assert.ok(own.budget>1e10);assert.equal(D.club(roundtrip(s)).budget,base+10000000000);});
test("limites de budget: aceita ate 1e12 e rejeita fora, nao numerico e nao finito",()=>{
  for(const ok of [0,-5e9,1e10,1e11,1e12,-1e12]){const s=fresh();D.club(s).budget=ok;assert.equal(D.club(roundtrip(s)).budget,ok,"aceito "+ok);}
  for(const bad of [1e12+1000,-1e12-1000,"10000000000",null,Number.POSITIVE_INFINITY,Number.NaN,{},[]]){const s=fresh();D.club(s).budget=bad;assert.throws(()=>roundtrip(s),undefined,"rejeitado "+String(bad));}
});
test("outras regras de seguranca permanecem iguais (wallet, estrutura, tatica, lineup)",()=>{
  const cases=[(s)=>{s.wallet=2e10;},(s)=>{D.club(s).structure=101;},(s)=>{D.club(s).tactic="hack";},(s)=>{D.club(s).lineup=new Array(12).fill("x");},(s)=>{D.club(s).lineup=["nao-existe"];}];
  for(const mutate of cases){const s=fresh();mutate(s);assert.throws(()=>roundtrip(s));}
});
test("aporte nao duplica ao salvar, carregar, avancar dias e transferir",()=>{
  const A=require("../src/application/game.js"),s=fresh(),own=D.club(s),base=own.budget;own.budget+=10000000000;
  s.coachCareer||={version:1};s.coachCareer.settings={...(s.coachCareer.settings||{}),funding:10000000000,fundingApplied:true,firstWindow:"on",installments:"off",loans:"off",marketStrictness:"normal"};
  const id=S.saveAsNew(s);assert.ok(id);let loaded=S.loadSlot(id);assert.equal(D.club(loaded).budget,base+1e10);
  for(let i=0;i<3;i++){assert.equal(S.save(loaded),true);loaded=S.loadSlot(id);}
  assert.equal(D.club(loaded).budget,base+1e10,"salvar/carregar repetido nao reaplica o aporte");
  const before=D.club(loaded).budget;D.advance(loaded,7);assert.equal(D.club(loaded).budget,before,"avancar dias nao reaplica");
  const buyer=D.club(loaded),seller=loaded.clubs.find(c=>c.id!==buyer.id&&c.roster.length>18);buyer.structure=100;
  const player=seller.roster.find(p=>p.id!=="hero"),fee=A.valuation(player),b0=buyer.budget,s0=seller.budget;
  A.execute(loaded,"recruit",{clubId:seller.id,playerId:player.id,dealType:"permanent",paymentPlan:"upfront",sellOn:0});
  assert.equal(buyer.budget,b0-fee);assert.equal(seller.budget,s0+fee);
  assert.equal(S.save(loaded),true);const again=S.loadSlot(id);assert.equal(D.club(again).budget,b0-fee);assert.equal(again.coachCareer.settings.funding,1e10);
});
