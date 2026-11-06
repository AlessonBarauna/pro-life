const test=require("node:test"),assert=require("node:assert");
const E=require("../src/domain/engine.js");
function mk(){const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},7);s.clubId=null;E.join(s,"gf_fc27_449",90000);E.advance(s,2);return s;}
test("lesionados nunca ficam entre os 7 do banco",()=>{
  const s=mk(),club=E.club(s);
  const bench=club.roster.filter(p=>!club.lineup.includes(p.id));
  bench.slice(0,3).forEach(p=>p.injury=10);
  s.coachCareer.benchOrder=bench.map(p=>p.id); // lesionados na frente
  assert.equal(E.CoachCareer.sanitizeBench(s,E.API||E),true);
  const first7=s.coachCareer.benchOrder.filter(id=>!club.lineup.includes(id)).slice(0,7).map(id=>club.roster.find(p=>p.id===id));
  assert.ok(first7.every(p=>!p.injury),"banco sem lesionados");
});
test("jovem com potencial ganha vaga no banco e minutos",()=>{
  const s=mk(),club=E.club(s),API=E.API||E;
  const pool=club.roster.filter(p=>!club.lineup.includes(p.id)&&p.pos!=="GOL");
  const kid=pool[pool.length-1];kid.age=18;kid.potential=90;kid.attrs&&0;
  E.CoachCareer.autoIdealXI(s,API);
  const b=s.coachCareer.benchOrder.filter(id=>!club.lineup.includes(id)).slice(0,7);
  const hasKid=b.some(id=>{const p=club.roster.find(x=>x.id===id);return Number(p.age)<=21&&p.potential>=72;});
  assert.ok(hasKid,"jovem no banco");
});
test("título de liga mundial conta na hora, não só no fim do ano",()=>{
  const s=mk(),API=E.API||E,CC=E.CoachCareer;CC.syncClub(s,API);
  assert.equal(CC.liveTitleCount(s,API),0);
  assert.equal(CC.recordWorldLeagueTitle(s,{leagueId:"x",season:s.season,championId:s.clubId,day:s.day,name:"Liga X"}),true);
  assert.equal(CC.liveTitleCount(s,API),1);
});
