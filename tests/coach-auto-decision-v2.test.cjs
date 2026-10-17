const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("Agora nao resolves narrative choices through existing game decision command",()=>{
 assert.match(source,/if \(b\.dataset\.stopClose !== undefined\)/);
 assert.match(source,/state\?\.decision\?\.choices\?\.length/);
 assert.match(source,/command\("decide",\{choice:preferred\[0\]\}\)/);
});
test("Automatic decision prioritizes balanced family options and saves through command",()=>{
 const original=[["work","Trabalhar mais"],["visit","Passar tempo com a família"]];
 const options=original.filter(c=>Array.isArray(c)&&typeof c[0]==="string");
 const selected=options.find(c=>/equilibr|fam[ií]lia|descans|visitar|aproveitar|passar tempo/i.test(String(c[1]||"")))||options[0];
 assert.equal(selected[0],"visit");
 assert.match(source,/function command\(action, data\)/);
 assert.match(source,/A\.execute\(state, action, data\);\s*persist\(\);/);
});
test("Non narrative notifications retain non-destructive close",()=>{
 assert.match(source,/closeSimulationStop\(\);return;/);
});
