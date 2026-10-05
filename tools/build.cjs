"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { files } = require("./assets.cjs");
// Service worker gerado a cada build: o cache muda junto com a versão do jogo, então nunca mistura arquivos de versões diferentes.
function serviceWorker(version) {
  const assets = ["index.html", ...files.filter((f) => f !== "index.html").map((f) => f + "?v=" + version)];
  return `"use strict";
const CACHE = "prolife-${version}";
const ASSETS = ${JSON.stringify(assets)};
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("prolife-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const req = event.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.endsWith("/version.json") || url.pathname.endsWith("/sw.js")) return;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put("index.html", copy)); return res; }).catch(() => caches.match("index.html")));
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })));
});
`;
}
function build(root = path.resolve(__dirname, "..")) {
  const output = path.join(root, "dist");
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(__filename));
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
    const versioned = file === "index.html" ? content.replace(/((?:src|href)=")([^"]+)(")/g, (match, prefix, asset, suffix) => prefix + asset + "?v=" + version + suffix) : content;
    fs.writeFileSync(target, versioned);
  }
  fs.writeFileSync(path.join(output, "version.json"), JSON.stringify({ version }));
  fs.writeFileSync(path.join(output, "sw.js"), serviceWorker(version));
  fs.writeFileSync(path.join(output, ".nojekyll"), "");
  return { version, output };
}
if (require.main === module) console.log("Build criado:", build());
module.exports = { build };
