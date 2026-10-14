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

test("06B Vitruvian viewer loads real body head hair and animation without procedural geometry",()=>{
 const source=read("src/ui/coach-glb.source.js").toString("utf8");
 assert.match(source,/vitruvian_body\.glb/);
 assert.match(source,/vitruvian_head\.glb/);
 assert.match(source,/vitruvian_hair\.glb/);
 assert.match(source,/new THREE\.AnimationMixer/);
 assert.match(source,/mixer\.clipAction/);
 assert.doesNotMatch(source,/CylinderGeometry|rebuildWardrobe|ConeGeometry/);
});
test("06B locally installed human models are valid GLBs",()=>{
 const dir=path.join(root,"src/assets/coach3d-realistic");
 const files=["vitruvian_body.glb","vitruvian_head.glb","vitruvian_hair.glb"];
 for(const name of files){
  const file=path.join(dir,name);
  if(!fs.existsSync(file))continue;
  const bin=fs.readFileSync(file);
  assert.equal(bin.toString("ascii",0,4),"glTF");
  assert.equal(bin.readUInt32LE(4),2);
  assert.equal(bin.readUInt32LE(8),bin.length);
 }
});

test("06B static hair and brows follow the animated head without fake meshes",()=>{
 const source=read("src/ui/coach-glb.source.js").toString("utf8");
 assert.match(source,/headRestInverse/);
 assert.match(source,/headBone\.matrixWorld/);
 assert.match(source,/part\.matrix\.copy\(headDelta\)/);
 assert.match(source,/node\.name!=="VitHair"\|\|style!=="bald"/);
 assert.match(source,/The source contains one outfit, no beard\/glasses meshes/);
 assert.doesNotMatch(source,/new THREE\.(CylinderGeometry|ConeGeometry|BoxGeometry)/);
});
test("06B manager creation discloses appearance options without models",()=>{
 const creator=read("src/ui/coach-creator.js").toString("utf8");
 assert.match(creator,/coach-appearance-notice/);
 assert.match(creator,/Ainda sem modelos 3D para:/);
 assert.match(creator,/não mudam o personagem nesta versão/);
});

test("06B appearance changes affect distinct licensed clothing and face material slots",()=>{
 const src=read("src/ui/coach-glb.source.js").toString("utf8");
 for(const slot of ["vitbody","vitshirt","vitpants","vitiris","vithairmat","vitbrowcards"]) {
  assert.ok(src.toLowerCase().includes(slot),slot);
 }
 assert.match(src,/shirtMaterials/);
 assert.match(src,/pantsMaterials/);
 assert.match(src,/next\.outfit/);
 assert.match(src,/appearance\.skin/);
 assert.match(src,/appearance\.eyeColor/);
});

test("06B repeated color edits preserve source material colors",()=>{
 const source=read("src/ui/coach-glb.source.js").toString("utf8");
 assert.match(source,/originalColors=new Map/);
 assert.match(source,/originalColors\.get\(material\)/);
 assert.match(source,/setTint\(skinMaterials,tint\)/);
 assert.match(source,/setTint\(shirtMaterials,chosen\.shirt\)/);
 assert.match(source,/setTint\(pantsMaterials,chosen\.pants\)/);
});

test("06B material selectors match real Vitruvian asset names",()=>{
 const src=read("src/ui/coach-glb.source.js").toString("utf8");
 for(const key of ["vitskin","vitbody","vitiris","vithairmat","vitbrowcardsmat","vitshirt","vitpants"]){
  assert.ok(src.includes(key),key);
 }
 assert.match(src,/originalColors=new Map/);
 assert.match(src,/originalColors\.get\(material\)/);
});

test("06B every static facial piece follows the animated Mixamo head",()=>{
 const source=read("src/ui/coach-glb.source.js").toString("utf8");
 assert.match(source,/getObjectByName\("mixamorig:Head"\)/);
 assert.match(source,/for\(const part of \[head,hair,eyewear,facialHair\]\)/);
 assert.doesNotMatch(source,/hair\.scale\.set/);
});

test("06B identity preview is static and updates visible iris color",()=>{
 const src=read("src/ui/coach-glb.source.js").toString("utf8");
 assert.doesNotMatch(src,/mixer\.clipAction\(idle\)\.play\(\)/);
 assert.match(src,/name\.includes\("iris"\)/);
 assert.match(src,/setTint\(irisMaterials,iris\)/);
 assert.match(src,/if\(m\.map\)\{m\.map=null;m\.needsUpdate=true;\}/);
});

test("06B modeled glasses toggle and follow the rigged head",()=>{
 const src=read("src/ui/coach-glb.source.js").toString("utf8");
 assert.match(src,/eyewear\.visible=appearance\.accessory==="glasses"/);
 assert.match(src,/new THREE\.TubeGeometry/);
 assert.match(src,/for\(const part of \[head,hair,eyewear\]\)/);
 assert.match(src,/frameMaterial\.dispose\(\)/);
});

test("06B facial hair variants follow head and inherit hair color",()=>{
 const src=read("src/ui/coach-glb.source.js").toString("utf8");
 assert.match(src,/beardGroups=/);
 assert.match(src,/appearance\.beard/);
 assert.match(src,/beardMaterial\.color\.set\(appearance\.hairColor/);
 assert.match(src,/for\(const part of \[head,hair,eyewear,facialHair\]\)/);
});
