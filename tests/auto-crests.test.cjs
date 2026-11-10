const test=require("node:test"),assert=require("node:assert");
const A=require("../src/ui/auto-crests.js");
const idx=A.buildIndex({crestData:[{id:"c1",name:"Real Betis",verified:true,asset:"x"},{id:"c2",name:"Roma",verified:true,asset:"x"},{id:"c3",name:"Sem Logo",verified:false,asset:null}],leagueLogos:{ucl:"x"},nationalNames:[["Bélgica","BEL"],["belgica","BEL"]]});
test("acha clubes, competições e seleções com acentos",()=>{
  const m=A.findMatches(idx,"MEI · Real Betis → UEFA Champions League · Belgica");
  assert.deepEqual(m.map(x=>x.entry.type+":"+x.entry.id),["club:c1","comp:ucl","nat:BEL"]);
  assert.equal(A.findMatches(idx,"Bélgica")[0].entry.id,"BEL");
});
test("só palavra inteira e ignora clube sem logo",()=>{
  assert.equal(A.findMatches(idx,"Romania e Sem Logo").length,0);
  assert.equal(A.findMatches(idx,"Roma").length,1);
});
