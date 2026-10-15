const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const Pitch=require("../src/ui/match-pitch-v2.js");
const mk=(id,pos)=>({id,name:id,pos});
test("forward aliases classify as attack roles",()=>{for(const pos of ["ATA","FWD","FW","ST","CF","FORWARD"])assert.equal(Pitch.role({pos}),"ST");});
test("striker never takes defender slot when defender exists outside initial eleven",()=>{
 const roster=[mk("g","GOL"),mk("st1","ATA"),mk("st2","FWD"),mk("st3","ATA"),mk("st4","ATA"),mk("st5","ATA"),mk("cm1","MC"),mk("cm2","MC"),mk("cm3","MC"),mk("rw","PD"),mk("lw","PE"),mk("cb1","ZAG"),mk("cb2","ZAG"),mk("rb","LD"),mk("lb","LE")];
 const club={roster,lineup:roster.slice(0,11).map(p=>p.id)};
 const line=Pitch.lineup(club);
 assert.equal(line.starters.length,11);
 for(const i of [1,2,3,4])assert.ok(["RB","LB","CB"].includes(Pitch.role(line.starters[i])),"defensive slot "+i);
 assert.equal(new Set(line.starters.map(p=>p.id)).size,11);
});
test("tactical panel opens lab without extra start click and contains substitute controls",()=>{
 const src=fs.readFileSync(path.join(__dirname,"../src/ui/live-match.js"),"utf8");
 assert.match(src,/session\.tab==="taticas"&&!session\.lab/);
 assert.match(src,/data-live-lab-out/);
 assert.match(src,/data-live-lab-in/);
 assert.match(src,/Confirmar substituição na prévia/);
 assert.match(src,/não alteram o placar oficial/);
});
