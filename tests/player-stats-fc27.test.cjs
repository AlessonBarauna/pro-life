const test=require("node:test"),assert=require("node:assert");
const D=require("../src/domain/engine.js");global.ProLife=D;
for(const f of ["domain/statistics.js","ui/home-dashboard.js","ui/expansion.js","ui/player-stats-view.js"])require("../src/"+f);
test("estatísticas do jogador usam o layout FC 27 com avatar e escudos",()=>{
  const s=D.create({mode:"player",clubId:"gf_fc27_449",catalogVersion:"fc27_v1",origin:"blank",creation:{difficulty:"realistic",personality:"balanced",startMode:"club"}},7);
  D.advanceToDay(s,40,{simulateMatches:true});
  const html=globalThis.ProLifeExpansion.statistics(s,"");
  for(const c of ["ps-screen","ps-hero","ps-kpis","Forma recente","Por competição","Trajetória por temporada","LÍDERES DA COMPETIÇÃO"])assert.ok(html.includes(c),c);
  assert.ok(!/undefined|NaN|\[object/.test(html.replace(/<[^>]+>/g," ")));
});
