const test=require("node:test"),assert=require("node:assert/strict");
const S=require("../src/domain/coach-official-session-v2.js");
const fixture={home:"a",away:"b",date:9,season:2026,competitionId:"league"};
const fresh=()=>S.begin({mode:"coach",day:8,matches:[]},fixture).session;
test("pending substitution requires distinct ids and guards duplicates",()=>{
 const s=fresh();assert.equal(S.record(s,{type:"substitution",minute:60,side:0,outId:"a1",inId:"a12"}),true);
 assert.equal(S.record(s,{type:"substitution",minute:61,side:0,outId:"a1",inId:"a13"}),false);
 assert.equal(S.record(s,{type:"substitution",minute:61,side:0,outId:"a2",inId:"a12"}),false);
 assert.equal(S.record(s,{type:"substitution",minute:61,side:0,outId:"a2",inId:"a2"}),false);
 assert.equal(s.actions.length,1);
});
test("pending match has five substitutions maximum per team",()=>{
 const s=fresh();for(let i=0;i<5;i++)assert.equal(S.record(s,{type:"substitution",minute:50+i,side:0,outId:"a"+i,inId:"b"+i}),true);
 assert.equal(S.record(s,{type:"substitution",minute:60,side:0,outId:"a9",inId:"b9"}),false);
 assert.equal(S.record(s,{type:"substitution",minute:60,side:1,outId:"c1",inId:"c2"}),true);
});
test("completed simulation is not committed until official match exists in state",()=>{
 const s=fresh(),state={mode:"coach",day:9,matches:[]};
 assert.equal(S.complete(s),true);assert.equal(S.acknowledgeCommit(state,s),false);
 state.matches.push({...fixture,hg:1,ag:0});
 assert.equal(S.acknowledgeCommit(state,s),true);assert.equal(S.acknowledgeCommit(state,s),false);
});
