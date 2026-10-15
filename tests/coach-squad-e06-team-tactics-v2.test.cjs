"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const game=fs.readFileSync(path.join(__dirname,"../src/application/game.js"),"utf8");
const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("E06 team tactics validates and stores all collective inputs",()=>{
 const block=game.split('case "coachTeamTactics": {')[1]?.split('case "coachPlayerRole":')[0];
 assert.ok(block);
 for(const x of ["style","pressing","buildup","width","depth"])assert.ok(block.includes(x));
 assert.match(block,/s\.coachCareer\.teamTactics=\{style,pressing,buildup,width,depth\}/);
 assert.match(block,/club\.tactic=style/);
 assert.match(block,/width<20\|\|width>80/);
});
test("E06 team tactics controls are active with a save action",()=>{
 for(const field of ["style","pressing","buildup","width","depth"])assert.ok(app.includes('data-team-tactic-'+field));
 assert.match(app,/data-team-tactics-save/);
 assert.match(app,/command\("coachTeamTactics"/);
 assert.match(app,/Pressão, construção, largura e profundidade são preparadas/);
});
