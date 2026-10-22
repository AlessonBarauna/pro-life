"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Selection=require("../src/domain/squad-position-selection.js");

const group={GOL:"GOL",LD:"DEF",LE:"DEF",ZAG:"DEF",VOL:"MEI",MC:"MEI",MD:"MEI",ME:"MEI",MEI:"MEI",PD:"ATA",PE:"ATA",CA:"ATA"};
const player=(id,position,ger,secondaryPositions=[],extra={})=>({
  id,name:id,pos:group[position],primaryPosition:position,secondaryPositions,
  overall:ger,ovr:ger,injury:0,suspension:0,...extra
});
const base=()=>[
  player("gk-80","GOL",80),player("gk-70","GOL",70),
  player("ld-75","LD",75),player("le-76","LE",76),
  player("zag-82","ZAG",82),player("zag-79","ZAG",79),player("zag-72","ZAG",72),
  player("vol-78","VOL",78),player("mc-84","MC",84),player("mc-81","MC",81),
  player("pd-83","PD",83),player("pe-85","PE",85),player("ca-86","CA",86),
  player("ca-74","CA",74)
];

test("sugestão ideal escolhe os maiores GER disponíveis por posição",()=>{
  const result=Selection.suggestIdeal({formation:"4-3-3",roster:base(),overall:p=>p.overall});
  assert.ok(result);
  assert.equal(result.starters.length,11);
  assert.equal(new Set(result.starters.map(p=>p.id)).size,11);
  assert.ok(result.starters.some(p=>p.id==="gk-80"));
  assert.ok(result.starters.some(p=>p.id==="zag-82"));
  assert.ok(result.starters.some(p=>p.id==="ca-86"));
  assert.ok(!result.starters.some(p=>p.id==="gk-70"));
  assert.ok(!result.starters.some(p=>p.id==="zag-72"));
});

test("sugestão preenche 11 atletas únicos e um goleiro nas três formações",()=>{
  const roster=base().concat([
    player("mei-82","MEI",82),player("me-78","ME",78),player("md-79","MD",79),
    player("vol-76","VOL",76),player("ca-80","CA",80)
  ]);
  for(const formation of ["4-3-3","4-4-2","4-2-3-1"]){
    const result=Selection.suggestIdeal({formation,roster,overall:p=>p.overall});
    assert.ok(result,formation);
    assert.equal(result.starters.length,11,formation);
    assert.equal(new Set(result.starters.map(p=>p.id)).size,11,formation);
    assert.equal(result.assignments.filter(x=>x.role==="GOL"&&x.player.primaryPosition==="GOL").length,1,formation);
    assert.ok(result.assignments.filter(x=>x.role!=="GOL").every(x=>x.player.primaryPosition!=="GOL"),formation);
  }
});

test("sugestão aceita posição secundária real e exclui lesionado ou suspenso",()=>{
  const roster=base();
  roster.find(p=>p.id==="pd-83").injury=5;
  roster.find(p=>p.id==="ca-86").suspension=1;
  roster.push(player("versatil-90","MC",90,["PD"]));
  const result=Selection.suggestIdeal({formation:"4-3-3",roster,overall:p=>p.overall});
  assert.ok(result);
  assert.equal(result.assignedPositions["versatil-90"],"PD");
  assert.ok(!result.starters.some(p=>p.id==="pd-83"||p.id==="ca-86"));
});

test("interface oferece sugestão reversível e persiste a ordem visual dos onze",()=>{
  const app=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
  assert.match(app,/data-squad-ideal/);
  assert.match(app,/selector\.suggestIdeal\(\{formation,roster:club\.roster,overall:p=>D\.overall\(p\)\}\)/);
  assert.match(app,/state\.coachCareer\.pitchSlots=\[\.\.\.chosen\]/);
  assert.match(app,/squadUndo=previous;squadSwapSource=null/);
});
