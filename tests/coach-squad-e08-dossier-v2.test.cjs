"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ui=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/fc27-05b-squad.css"),"utf8");
test("E08 has real fitness and development tabs in the player panel",()=>{
 assert.match(ui,/\["fitness","Físico"\]/);
 assert.match(ui,/\["development","Evolução"\]/);
 assert.match(ui,/fitness:fitnessInfo,development:developmentInfo/);
 assert.match(ui,/detailPanels\[squadDetailTab\]\|\|attributeInfo/);
});
test("E08 shows existing records and discloses missing information",()=>{
 for(const field of ["selected.condition","selected.attrs?.stamina","selected.morale","selected.potential","selected.secondaryPositions","selected.developmentPlan?.name"])assert.ok(ui.includes(field),field);
 assert.match(ui,/Não registrado/);
 assert.match(ui,/Sem lesão registrada/);
 assert.match(ui,/Sem suspensão/);
});
test("E08 responsiveness keeps five dossier tabs reachable",()=>{
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/flex-wrap:wrap/);
});
