const test=require('node:test');const assert=require('node:assert/strict');
const Live=require('../src/domain/conference-live.js');const KO=require('../src/domain/conference-knockout.js');const View=require('../src/ui/conference-league-view.js');
function ed(){return {comp:'uecl',season:2026,status:'ready',drawSeed:'safe-demo-1',entrants:Array.from({length:36},(_,i)=>['c'+i,'N'+(i%18)] )};}
test('33H 36 clubs -> 108 games -> 45 knockout -> champion, reload consistent',()=>{
 const s={day:0,season:2026,mode:'coach',clubId:'c1'}, e=ed();
 const cal=Live.prepare(s,e);assert.equal(cal.matches.length,108);
 const tally=new Map(e.entrants.map(x=>[x[0],{h:0,a:0,opp:new Set()}]));
 for(const m of cal.matches){tally.get(m.homeId).h++;tally.get(m.awayId).a++;tally.get(m.homeId).opp.add(m.awayId);tally.get(m.awayId).opp.add(m.homeId);}
 for(const x of tally.values()){assert.equal(x.h,3);assert.equal(x.a,3);assert.equal(x.opp.size,6)}
 assert.equal(Live.prepare(s,e),cal);
 const score=()=>({hg:2,ag:1});
 for(s.day=1;s.day<=332;s.day++)Live.daily(s,e,{otherFixture:score,heroFixture:score});
 assert.equal(cal.matches.filter(m=>m.played).length,108);
 assert.equal(e.knockout.stages.flatMap(x=>x.matches).length,45);
 assert.ok(e.knockout.championId);
 const previous=e.knockout.championId;const prior=JSON.stringify(e);
 Live.daily(s,e,{otherFixture:score,heroFixture:score});assert.equal(JSON.stringify(e),prior);
 const after=JSON.parse(JSON.stringify(e));assert.equal(after.knockout.championId,previous);
 const render=View.renderEmbedded({season:2026,continental:{editions:{'uecl:2026':after}},globalFootball:{clubs:[]}});
 assert.match(render,/CONFERENCE LEAGUE/i);assert.match(render,/108/);
});
test('33H old save never creates retroactive schedule',()=>{const s={season:2026,day:142},e=ed();assert.equal(Live.prepare(s,e),null);assert.equal(e.leagueSchedule,undefined)});
