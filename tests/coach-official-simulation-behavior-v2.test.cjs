const test=require("node:test"),assert=require("node:assert/strict");
const Engine=require("../src/domain/engine.js");
const clone=x=>JSON.parse(JSON.stringify(x));
function fixture(){
 const state=Engine.create({mode:"coach",world:"legacy"},12345);
 const home=state.clubs[0],away=state.clubs[1];
 const starter=Engine.selected(home).find(p=>p.pos!=="GOL");
 const ids=new Set(Engine.selected(home).map(p=>p.id));
 const bench=home.roster.find(p=>!ids.has(p.id)&&!p.injury&&!p.suspension&&p.condition>35);
 assert.ok(starter&&bench,"fixture needs eleven starters and bench");
 return {state,home,away,starter,bench};
}
test("actual official simulation records minute, replaced and replacement participation",()=>{
 const f=fixture(),minute=61;
 const m=Engine.simulate(f.home,f.away,new Engine.Random(123),f.state,[{type:"substitution",side:0,minute,outId:f.starter.id,inId:f.bench.id}]);
 const change=m.events.find(e=>e.type==="substitution"&&e.outPlayerId===f.starter.id&&e.playerId===f.bench.id);
 assert.ok(change,"named coach substitution must be recorded");
 assert.equal(change.minute,minute);
 assert.equal(m.participation[f.starter.id].exitMinute,minute);
 assert.equal(m.participation[f.bench.id].entryMinute,minute);
 assert.equal(m.playerStats[f.bench.id].minutes,94-minute);
});
test("scheduled coach substitution does not change events before the planned minute",()=>{
 const f=fixture(),a=clone(f.home),b=clone(f.away),c=clone(f.home),d=clone(f.away);
 const old=Engine.simulate(a,b,new Engine.Random(46),null);
 const changed=Engine.simulate(c,d,new Engine.Random(46),null,[{type:"substitution",side:0,minute:70,outId:f.starter.id,inId:f.bench.id}]);
 assert.deepEqual(changed.events.filter(e=>e.minute<70),old.events.filter(e=>e.minute<70));
});
test("invalid bench replacement never creates a phantom participant",()=>{
 const f=fixture();const m=Engine.simulate(f.home,f.away,new Engine.Random(87),null,[{type:"substitution",side:0,minute:55,outId:f.starter.id,inId:"not-in-roster"}]);
 assert.equal(m.events.some(e=>e.type==="substitution"&&e.playerId==="not-in-roster"),false);
});
