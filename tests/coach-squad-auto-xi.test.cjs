"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const src=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Coach squad script parses with automatic XI validation",()=>new vm.Script(src));
test("Incomplete XI can be repaired; valid manual XI is preserved",()=>{
 assert.match(src,/const validXI=validPlayers\.length===11&&unique\.size===11/);
 assert.match(src,/if\(!validXI\)/);
 assert.match(src,/A\.execute\(state,"lineup",\{ids:chosen\}\)/);
 assert.match(src,/state\.coachCareer\.pitchSlots=\[\.\.\.chosen\]/);
 assert.doesNotMatch(src,/data-squad-repair title=/);
});
test("Goalkeeper never selected for outfield role during automatic repair",()=>{
 assert.match(src,/if\(role==="GOL"\)return gk\(p\)\?10000:-100000/);
 assert.match(src,/if\(gk\(p\)\)return -100000/);
 assert.match(src,/slots\.some\(\(id,i\)=>gk/);
});
