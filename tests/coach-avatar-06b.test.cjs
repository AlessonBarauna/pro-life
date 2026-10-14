"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=name=>fs.readFileSync(path.join(root,name));
test("06B offline model has valid glTF binary header and CC0 license",()=>{
 const binary=read("src/assets/coach3d/coach-base.glb");
 assert.equal(binary.toString("ascii",0,4),"glTF");
 assert.equal(binary.readUInt32LE(4),2);
 assert.equal(binary.readUInt32LE(8),binary.length);
 assert.ok(binary.length>100000);
 assert.match(read("src/assets/coach3d/LICENSE-CC0.txt").toString("utf8"),/CC0 1.0/);
});
test("06B viewer stays separate from player avatar and is built for offline dev",()=>{
 const html=read("index.html").toString("utf8");
 const pkg=JSON.parse(read("package.json").toString("utf8"));
 const assets=require("../tools/assets.cjs").files;
 assert.ok(html.indexOf("src/ui/coach-glb.js")<html.indexOf("src/ui/coach-avatar-3d.js"));
 assert.match(pkg.scripts.dev,/coach:avatar/);
 assert.match(pkg.scripts.build,/coach:avatar/);
 for(const file of ["src/assets/coach3d/coach-base.glb","src/ui/coach-glb.js","src/ui/coach-avatar-3d.js"])assert.ok(assets.includes(file));
});
