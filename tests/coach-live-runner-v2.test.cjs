const test=require("node:test"),assert=require("node:assert/strict");
const D=require("../src/domain/engine.js");
const clone=x=>JSON.parse(JSON.stringify(x));
function clubs(){const s=D.create({mode:"coach",world:"legacy"},217);return {state:s,home:s.clubs[0],away:s.clubs[1]};}
test("official runner yields one completed minute per iteration and returns finalized match",()=>{
 const {state,home,away}=clubs(),runner=D.simulateSteps(home,away,new D.Random(77),state);
 for(let minute=1;minute<=94;minute++){
  const step=runner.next();
  assert.equal(step.done,false);assert.equal(step.value.minute,minute);
 }
 const final=runner.next();assert.equal(final.done,true);
 assert.equal(final.value.home,home.id);assert.equal(final.value.away,away.id);
 assert.equal(final.value.possessions[0]+final.value.possessions[1],94);
});
test("live substitution queued while paused changes only later minutes",()=>{
 const a=clubs(),b={state:clone(a.state)};
 b.home=b.state.clubs[0];b.away=b.state.clubs[1];
 const selected=D.selected(a.home),on=new Set(selected.map(p=>p.id));
 const out=selected.find(p=>p.pos!=="GOL"),incoming=a.home.roster.find(p=>!on.has(p.id)&&!p.injury&&!p.suspension&&p.condition>35);
 assert.ok(out&&incoming);
 const actions=[],live=D.simulateSteps(a.home,a.away,new D.Random(31),a.state,actions);
 const baseline=D.simulateSteps(b.home,b.away,new D.Random(31),b.state,[]);
 for(let i=1;i<=50;i++){const x=live.next(),y=baseline.next();assert.equal(x.value.minute,i);assert.deepEqual(x.value.match.events,y.value.match.events);}
 actions.push({type:"substitution",side:0,minute:51,outId:out.id,inId:incoming.id});
 const updated=live.next(),other=baseline.next();
 assert.equal(updated.value.minute,51);assert.equal(other.value.minute,51);
 assert.ok(updated.value.match.events.some(e=>e.minute===51&&e.type==="substitution"&&e.playerId===incoming.id));
});
