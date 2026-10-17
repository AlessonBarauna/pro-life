"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const S=require("../src/domain/coach-scouting-v2.js");
const fresh=()=>({mode:"coach",day:10,clubId:"x",clubs:[{id:"x",budget:500}]});
test("M03.3 matching specialist improves confidence and narrows report ranges",()=>{
 const save=fresh(),general=S.start(save,{playerId:"one",duration:10}).mission;
 const specialist=S.start(save,{playerId:"two",duration:10,specialty:"defesa"}).mission;
 save.day=15;S.advance(save);
 const g=S.report(save,general.id,{id:"one",pos:"ZAG",ovr:70,potential:80});
 const d=S.report(save,specialist.id,{id:"two",pos:"ZAG",ovr:70,potential:80});
 assert.equal(d.specialtyFit,true);assert.ok(d.certainty>g.certainty);
 assert.ok(d.estimatedOverall[1]-d.estimatedOverall[0]<=g.estimatedOverall[1]-g.estimatedOverall[0]);
});
test("M03.3 unmatched or legacy scout has no penalty or bonus",()=>{
 const save=fresh();
 const legacy=S.start(save,{playerId:"old",duration:10}).mission;
 delete legacy.specialty;
 const mismatch=S.start(save,{playerId:"new",specialty:"goleiros",duration:10}).mission;
 save.day=15;S.advance(save);
 const a=S.report(save,legacy.id,{id:"old",pos:"ATA",ovr:78});
 const z=S.report(save,mismatch.id,{id:"new",pos:"ATA",ovr:78});
 assert.equal(a.certainty,z.certainty);assert.equal(z.specialistBonus,0);
 assert.equal(a.specialty,"geral");
});
test("M03.3 young-player specialty applies to age at most 21",()=>{
 const save=fresh(),m=S.start(save,{playerId:"p",specialty:"jovens",duration:10}).mission;
 save.day=15;S.advance(save);
 assert.equal(S.report(save,m.id,{id:"p",age:21,ovr:70}).specialtyFit,true);
 assert.equal(S.report(save,m.id,{id:"p",age:22,ovr:70}).specialtyFit,false);
});
