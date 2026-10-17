"use strict";
const path=require("node:path");
require("esbuild").buildSync({
 entryPoints:[path.resolve(__dirname,"../src/ui/coach-glb.source.js")],
 outfile:path.resolve(__dirname,"../src/ui/coach-glb.js"),
 bundle:true,format:"iife",minify:true,target:["es2020"],legalComments:"eof"
});
console.log("Renderizador GLB do treinador compilado localmente.");
