"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { files } = require("./assets.cjs");
function build(root = path.resolve(__dirname, "..")) {
  const output = path.join(root, "dist");
  const hash = crypto.createHash("sha256");
  const contents = files.map((file) => ({ file, bytes: fs.readFileSync(path.join(root, file)) }));
  for (const { file, bytes } of contents) {
    hash.update(file);
    hash.update(bytes);
  }
  const version = hash.digest("hex");
  fs.rmSync(output, { force: true, recursive: true });
  fs.mkdirSync(output, { recursive: true });
  for (const { file, bytes } of contents) {
    const target = path.join(output, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const content =
      file === "index.html"
        ? bytes
            .toString("utf8")
            .replace(
              "</body>",
              `<script src="src/ui/update.js" data-version="${version}"></script>\n</body>`,
            )
        : bytes;
    fs.writeFileSync(target, content);
  }
  fs.writeFileSync(path.join(output, "version.json"), JSON.stringify({ version }));
  fs.writeFileSync(path.join(output, ".nojekyll"), "");
  return { version, output };
}
if (require.main === module) console.log("Build criado:", build());
module.exports = { build };
