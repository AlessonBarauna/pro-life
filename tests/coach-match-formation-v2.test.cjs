const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const P=require("../src/ui/match-pitch-v2.js");
const squad=[
{id:"luciano",name:"Luciano",position:"ATA"},
{id:"rb",position:"LD"},{id:"cb1",position:"ZAG"},{id:"cb2",position:"ZAG"},{id:"lb",position:"LE"},
{id:"dm",position:"VOL"},{id:"cm1",position:"MC"},{id:"cm2",position:"MEI"},
{id:"rw",position:"PD"},{id:"lw",position:"PE"},{id:"gk",position:"GOL"}
];
test("coach tactical lineup puts striker Luciano up front even when first in roster",()=>{
 const l=P.lineup({roster:squad});
 assert.equal(l.starters[9].id,"luciano");
 assert.equal(l.starters[0].id,"gk");
 assert.ok(!l.starters.slice(1,5).some(p=>p.id==="luciano"));
});
test("formation slots fit fullback sides and central defenders",()=>{
 const l=P.lineup({roster:squad});assert.equal(l.starters[1].id,"rb");assert.equal(l.starters[4].id,"lb");
 assert.ok(["cb1","cb2"].includes(l.starters[2].id));assert.ok(["cb1","cb2"].includes(l.starters[3].id));
});
test("lineup never duplicates a player or mutates the club",()=>{
 const club={roster:squad};const before=JSON.stringify(club);
 const l=P.lineup(club);assert.equal(new Set(l.starters.filter(Boolean).map(p=>p.id)).size,11);
 assert.equal(JSON.stringify(club),before);
});
test("both sides mirror tactical locations and animated deviations remain bounded",()=>{
 const a=P.frame(0,{roster:squad},{roster:squad}),b=P.frame(10,{roster:squad},{roster:squad});
 assert.ok(a.home[9].x>60&&a.away[9].x<40);
 for(const p of [...b.home,...b.away])assert.ok(p.x>=4&&p.x<=96&&p.y>=6&&p.y<=94);
});
test("larger name label assets are shipped",()=>{
 const css=fs.readFileSync(path.join(__dirname,"../src/ui/coach-match-center-v2.css"),"utf8");
 assert.match(css,/\.lm-pitch \.lm-player-name\{max-width:132px;font-size:13px/);
});
