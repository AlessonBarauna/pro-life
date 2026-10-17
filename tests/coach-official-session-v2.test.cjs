const test=require("node:test"),assert=require("node:assert/strict");
const Session=require("../src/domain/coach-official-session-v2.js");
const fixture={home:"sp",away:"mir",date:12,season:2026,competitionId:"serie-a"};
test("completed official game is never reopened as live simulation",()=>{
 const committed={...fixture,hg:2,ag:1},state={mode:"coach",day:12,matches:[committed]};
 assert.equal(Session.isCommitted(state,{...fixture}),true);
 assert.equal(Session.begin(state,fixture).ok,false);
 assert.equal(committed.hg,2);
});
test("future coach fixture starts as pending, never as committed result",()=>{
 const state={mode:"coach",day:11,matches:[]};
 const result=Session.begin(state,fixture);
 assert.equal(result.ok,true);assert.equal(result.session.status,"pending");
 assert.equal(state.matches.length,0);
 assert.equal(Session.record(result.session,{type:"substitution",minute:63,outId:"p1",inId:"p2"}),true);
 assert.equal(result.session.minute,63);
 assert.equal(Session.complete(result.session),true);
 assert.equal(Session.record(result.session,{type:"tactic",minute:70}),false);
});
test("player mode and stale or incomplete fixtures cannot start",()=>{
 assert.equal(Session.begin({mode:"player",day:1,matches:[]},fixture).ok,false);
 assert.equal(Session.begin({mode:"coach",day:20,matches:[]},fixture).ok,false);
 assert.equal(Session.begin({mode:"coach",day:1,matches:[]},{home:"sp"}).ok,false);
});
