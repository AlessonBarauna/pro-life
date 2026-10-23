const test=require("node:test"),assert=require("node:assert/strict"),P=require("../src/ui/match-pitch-v2.js");
test("pitch positions resemble a tactical formation rather than 3-column rows",()=>{const f=P.frame(10,{},{});assert.equal(f.home.length,11);assert.equal(f.away.length,11);assert.ok(new Set(f.home.map(x=>Math.round(x.x/10))).size>=4);});
test("pitch movement advances with time and keeps players inside bounds",()=>{const a=P.frame(10,{},{}),b=P.frame(15,{},{});assert.notDeepEqual(a.home.map(p=>p.x),b.home.map(p=>p.x));for(const p of [...b.home,...b.away])assert.ok(p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100);});
test("pitch uses roster names without mutating roster",()=>{const home={roster:[{id:"test",name:"Goleiro"}]};const prior=JSON.stringify(home);assert.equal(P.frame(1,home,{}).home[0].player.name,"Goleiro");assert.equal(JSON.stringify(home),prior);});
test("pitch uses the official live XI instead of stale initial starters",()=>{
 const roster=Array.from({length:12},(_,i)=>({id:`p${i}`,name:`Player ${i}`,pos:i===0?"GOL":i<5?"ZAG":i<9?"MEI":"ATA"}));
 const club={roster,lineup:roster.slice(0,11).map(p=>p.id),formation:"4-3-3"};
 const frame=P.frame(60,club,club,[],[["p0","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11"],club.lineup]);
 const ids=frame.home.map(x=>x.player.id);
 assert.equal(ids.includes("p1"),false);
 assert.equal(ids.includes("p11"),true);
 assert.equal(new Set(ids).size,11);
});
