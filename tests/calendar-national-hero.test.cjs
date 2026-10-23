const test=require("node:test"),assert=require("node:assert");
const D=require("../src/domain/engine.js");global.ProLife=D;
const C=require("../src/domain/season-competition-center.js");
const H=require("../src/ui/home-dashboard.js");
test("jogos da seleção do herói espanhol aparecem como meus jogos no calendário",()=>{
  const s=D.create({mode:"player",clubId:"gf_fc27_449",catalogVersion:"fc27_v1",origin:"blank",creation:{difficulty:"realistic",personality:"balanced",startMode:"club"}},7);
  s.person.nationality="Espanha";
  D.advanceToDay(s,200,{simulateMatches:true});
  const ev=C.calendarEvents(s,0,365,{},D).filter(e=>e.isHeroEvent&&/^national/.test(e.competitionId||""));
  assert.ok(ev.length>=3);
  assert.ok(ev.every(e=>e.homeId==="ESP"||e.awayId==="ESP"));
});
test("atuações recentes incluem jogos da seleção sem participação",()=>{
  const s=D.create({mode:"player",clubId:"gf_fc27_449",catalogVersion:"fc27_v1",origin:"blank",creation:{difficulty:"realistic",personality:"balanced",startMode:"club"}},7);
  s.nationalTeam=s.nationalTeam||{};
  s.nationalTeam.matches=[];
  s.nationalTeam.schedule=[{id:"x",day:300,opponent:"Chile",competition:"Amistoso",played:true,participated:false,brazil:2,other:0}];
  const r=H.recentEntries(s).filter(e=>e.kind==="national");
  assert.equal(r.length,1);assert.equal(r[0].match.bench,true);
});
