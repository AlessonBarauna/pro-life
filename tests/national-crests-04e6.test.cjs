"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const ROOT = path.join(__dirname, "..");
const N = require(path.join(ROOT, "src/ui/national-crests.js"));
const dir = path.join(ROOT, "src/assets/national-crests");
const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest-nationals.json"), "utf8"));

test("04E6 selecoes: manifesto provisorio, arquivo PNG existente e hash conferido", () => {
  assert.ok(Object.keys(manifest).length >= 100);
  for (const [code, m] of Object.entries(manifest)) {
    assert.match(code, /^[A-Z]{3}$/); assert.equal(m.provisional, true); assert.ok(m.sourceRepo);
    const buf = fs.readFileSync(path.join(dir, m.file));
    assert.equal(buf.slice(0, 8).toString("hex"), "89504e470d0a1a0a", code);
    assert.equal(crypto.createHash("sha256").update(buf).digest("hex"), m.sha256, code);
  }
});
test("04E6 selecoes: resolve por codigo e por nome (sem acento) e usa somente arquivos locais", () => {
  assert.equal(N.code("BRA"), "BRA"); assert.equal(N.code("Peru"), "PER"); assert.equal(N.code("Colômbia"), "COL"); assert.equal(N.code("Uruguai"), "URU");
  const h = N.render("Brasil", { size: "lg" });
  assert.match(h, /^<img class="pl-club-crest pl-club-crest--lg pl-national-crest" src="src\/assets\/national-crests\/nt_BRA\.png"/);
  assert.doesNotMatch(h, /https?:/);
  assert.equal(N.render("Clube Qualquer"), ""); assert.equal(N.inline("Clube Qualquer"), ""); assert.equal(N.render("../../x"), "");
});

test("04E6 dev-server: tipos MIME de escudos (svg/webp/png) declarados", () => {
  const src = fs.readFileSync(path.join(ROOT, "tools/dev-server.cjs"), "utf8");
  assert.match(src, /"\.svg":\s*"image\/svg\+xml"/); assert.match(src, /"\.webp":\s*"image\/webp"/); assert.match(src, /"\.png":\s*"image\/png"/);
});
