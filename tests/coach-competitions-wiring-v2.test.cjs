const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");const base=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(base,p),"utf8");
test("Competition zones script and CSS load in browser and offline manifest",()=>{
 const html=read("index.html"),assets=read("tools/assets.cjs");
 for(const file of ["competition-zones-v2.js","competition-zones-v2.css"]){assert.ok(html.includes(file));assert.ok(assets.includes(file));}
});
test("Season center renders qualifications with country-aware grouping",()=>{
 const app=read("src/ui/app.js");
 assert.match(app,/season-zone-legend/);
 assert.match(app,/ProLifeCompetitionZonesV2\?\.zones/);
 assert.match(app,/new Set\(\[home,\.\.\.REGION_ORDER,\.\.\.groups\.keys\(\)\]/);
});
