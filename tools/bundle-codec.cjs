"use strict";
const fs = require("node:fs"), path = require("node:path");
function bundle(root = path.resolve(__dirname, "..")) {
  const source = path.join(root, "src/infrastructure/codec.source.js"), output = path.join(root, "src/infrastructure/codec.js");
  fs.copyFileSync(source, output);
  return output;
}
if (require.main === module) console.log(bundle());
module.exports = { bundle };
