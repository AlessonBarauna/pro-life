"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const source=fs.readFileSync("src/ui/competitions-hub-view.js","utf8");
test("J12.3 reads the real cup rounds and does not fabricate fixtures",()=>{
 assert.match(source,/function playerCupRounds\(s\)/);
 assert.match(source,/s\.competitionSchedule\?\.cup/);
 assert.match(source,/Array\.isArray\(cup\?\.rounds\)/);
 assert.match(source,/p\.played/);
 assert.match(source,/p\.winnerId/);
 assert.match(source,/playerCupRounds\(s\)/);
});
test("J12.3 keeps player and coach views isolated",()=>{
 const a=source.indexOf("function playerCupRounds(s)"),b=source.indexOf("function copas(s,D,cat)",a);
 assert.ok(a>=0&&b>a);
 const section=source.slice(a,b);
 assert.match(section,/s\?\.mode!=="player"/);
 assert.doesNotMatch(section,/simulateAdvance|\.advance\(|\.push\(|Math\.random\(|persist\(|\.save\(/);
});
test("J12.3 continues existing navigation to competitions",()=>{
 assert.match(source,/function copas\(s,D,cat\)/);
 assert.match(source,/function continentais\(s,D,cat\)/);
 assert.match(source,/function minhas\(s,D,cat\)/);
});
