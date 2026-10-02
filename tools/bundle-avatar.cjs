"use strict";
const path = require("node:path");
require("esbuild").buildSync({
  entryPoints: [path.resolve(__dirname, "../src/ui/avatar3d.source.js")],
  outfile: path.resolve(__dirname, "../src/ui/avatar3d.js"),
  bundle: true,
  format: "iife",
  minify: true,
  target: ["es2020"],
  legalComments: "eof",
  footer: {js:"/*\n"+require("node:fs").readFileSync(path.resolve(__dirname,"../THREE_LICENSE.txt"),"utf8")+"\n*/"},
});
console.log("Avatar 3D compilado localmente.");
