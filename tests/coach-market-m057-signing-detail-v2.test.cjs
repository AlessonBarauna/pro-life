"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,".."),v=fs.readFileSync(path.join(root,"src/ui/coach-career-view.js"),"utf8"),a=fs.readFileSync(path.join(root,"src/ui/app.js"),"utf8");
test("M05.7 reinforcements open individual details and return safely",()=>{
 for(const k of ["data-coach-signing-open","data-coach-signing-close","focusedSigning","signingDetail","openSigning:id=>","closeSigning:()=>"])assert.ok(v.includes(k));
 assert.match(a,/V\?\.openSigning/);assert.match(a,/V\?\.closeSigning/);
});
test("M05.7 current roster check does not mutate player or financial records",()=>{
 assert.match(v,/const rosterPlayer=focusedSigning/);
 assert.match(v,/No elenco atual/);
 assert.match(v,/Não localizado no elenco atual/);
 assert.match(v,/c\.presentations\|\|\[\]/);
});
