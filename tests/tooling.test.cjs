"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { build } = require("../tools/build.cjs");
const { createDevServer } = require("../tools/dev-server.cjs");
const { files } = require("../tools/assets.cjs");
function temporaryProject() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "prolife-test-"));
  for (const file of files) {
    const dest = path.join(root, file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.resolve(__dirname, "..", file), dest);
  }
  return root;
}
test("published build only contains game assets and detects content changes", () => {
  const root = temporaryProject();
  try {
    fs.writeFileSync(path.join(root, "secret.json"), "not for publication");
    const first = build(root);
    const html = fs.readFileSync(path.join(first.output, "index.html"), "utf8");
    assert.ok(html.includes('data-version="' + first.version + '"'));
    assert.ok(!fs.existsSync(path.join(first.output, "secret.json")));
    assert.ok(!fs.existsSync(path.join(first.output, "tests")));
    assert.equal(build(root).version, first.version);
    fs.appendFileSync(path.join(root, "src/ui/style.css"), "\n/* edited */");
    assert.notEqual(build(root).version, first.version);
    const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(refs.every((file) => fs.existsSync(path.join(first.output, file.split("?")[0]))));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("local preview serves game only and emits live update when source changes", async () => {
  const root = temporaryProject(),
    server = createDevServer(root);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = "http://127.0.0.1:" + server.address().port;
  let reader;
  try {
    const html = await (await fetch(address)).text();
    assert.ok(html.includes("EventSource('/__live')"));
    for (const name of ["/package.json", "/.git/config", "/secret.json", "/..%2Findex.html"]) {
      assert.equal((await fetch(address + name)).status, 404);
    }
    const asset = await fetch(address + "/src/ui/app.js");
    assert.equal(asset.status, 200);
    assert.equal(asset.headers.get("cache-control"), "no-store");
    const events = await fetch(address + "/__live");
    reader = events.body.getReader();
    const initial = new TextDecoder().decode((await reader.read()).value);
    fs.appendFileSync(path.join(root, "src/ui/style.css"), "\n/* live edit */");
    const timer = setTimeout(() => reader.cancel(), 5000);
    const changed = await reader.read();
    clearTimeout(timer);
    assert.equal(changed.done, false);
    assert.notEqual(new TextDecoder().decode(changed.value), initial);
  } finally {
    if (reader) await reader.cancel();
    await server.stop();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
