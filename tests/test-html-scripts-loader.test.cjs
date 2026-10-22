"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { scriptPathsFromHtml, fileForScript } = require("./helpers/html-scripts.cjs");
const root = path.resolve(__dirname, "..");

test("shared loader strips cache-busting versions and preserves HTML order", () => {
  const paths = scriptPathsFromHtml('<script src="src/a.js?v=123"></script><script defer src=\'src/b.js#x\'></script><script src="https://site.test/ext.js"></script>');
  assert.deepEqual(paths, ["src/a.js", "src/b.js"]);
});

test("shared loader honors srcOnly and prevents traversal", () => {
  assert.deepEqual(scriptPathsFromHtml('<script src="vendor/x.js"></script><script src="src/y.js"></script>', { srcOnly: true }), ["src/y.js"]);
  assert.throws(() => fileForScript(root, "../outside.js"), /Unsafe/);
});

test("all local index.html script references resolve to actual files", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const files = scriptPathsFromHtml(html);
  assert.ok(files.length > 0, "index.html should load local JavaScript");
  for (const file of files) {
    assert.ok(fs.existsSync(fileForScript(root, file)), "missing script: " + file);
  }
});
