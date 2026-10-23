const test=require("node:test"),assert=require("node:assert");
const D=require("../src/domain/engine.js");global.ProLife=D;
const N=require("../src/domain/display-names.js");
for(const f of ["domain/statistics.js","ui/home-dashboard.js","ui/expansion.js","ui/player-stats-view.js"])require("../src/"+f);
test("competições continentais têm nome real",()=>{
  assert.equal(N.league({},"uel"),"UEFA Europa League");
  assert.equal(N.league({},"ucl"),"UEFA Champions League");
});
test("temporada soma todas as competições e a carreira soma as temporadas",()=>{
  const s=D.create({mode:"player",clubId:"gf_fc27_449",catalogVersion:"fc27_v1",origin:"blank",creation:{difficulty:"realistic",personality:"balanced",startMode:"club"}},7);
  s.person.overall=80;
  let g=0;while(s.day<520&&g++<60){D.advanceToDay(s,520,{simulateMatches:true});s.offers=[];}
  const S=globalThis.ProLifeStatistics,d=S.heroDashboard(s);
  const sumComp=d.byCompetition.reduce((n,x)=>n+x.appearances,0);
  assert.equal(d.season.appearances,sumComp);
  const arch=S.init(s).root.seasons[0];
  assert.ok(arch&&Array.isArray(arch.player.competitions),'temporada arquivada guarda competições');
  assert.ok(d.career.appearances>=d.season.appearances);
  const html=globalThis.ProLifeExpansion.statistics(s,"");
  const vis=html.replace(/<[^>]+>/g,"|").replace(/\s+/g," ");const hit=vis.match(/.{40}gf_fc27_\d+.{20}/);assert.ok(!hit,"id cru: "+(hit&&hit[0]));
  assert.ok(!/>uel</.test(html));
});
