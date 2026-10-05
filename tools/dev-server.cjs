"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { files } = require("./assets.cjs");
const ROOT = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};
const client = `<script>
(function(){let version; const events = new EventSource('/__live');
events.onmessage = function(e){ if(version && version !== e.data) location.reload(); version=e.data; };
window.addEventListener('pagehide',function(){events.close();});})();
</script>`;
function signature(root) {
  const hash = crypto.createHash("sha256");
  for (const file of files) {
    try {
      hash.update(file);
      hash.update(fs.readFileSync(path.join(root, file)));
    } catch {
      hash.update(file + ":missing");
    }
  }
  return hash.digest("hex");
}
function createDevServer(root = ROOT) {
  const clients = new Set();
  let version = signature(root);
  const server = http.createServer((req, res) => {
    // Bind and host check keep this development server local to the computer.
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || "")) {
      res.writeHead(403);
      res.end("Host não permitido.");
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    let route;
    try {
      route = decodeURIComponent(req.url.split("?")[0]);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (route === "/__live" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
        Connection: "keep-alive",
      });
      res.write("data: " + version + "\n\n");
      clients.add(res);
      req.on("close", () => clients.delete(res));
      return;
    }
    const file = route === "/" ? "index.html" : route.replace(/^\//, "");
    if (!files.includes(file)) {
      res.writeHead(404);
      res.end("Arquivo não disponível.");
      return;
    }
    try {
      const full = fs.realpathSync(path.join(root, file));
      const resolvedRoot = fs.realpathSync(root);
      if (!full.startsWith(resolvedRoot + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      let data = fs.readFileSync(full);
      if (file === "index.html")
        data = Buffer.from(data.toString("utf8").replace("</body>", client + "</body>"));
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)],
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end("Arquivo ausente.");
    }
  });
  // Polling is portable across Windows editors, including atomic file replacement.
  const timer = setInterval(() => {
    const next = signature(root);
    if (next !== version) {
      version = next;
      for (const res of clients) res.write("data: " + next + "\n\n");
    }
  }, 400);
  timer.unref();
  server.on("close", () => {
    clearInterval(timer);
    for (const res of clients) res.end();
    clients.clear();
  });
  server.stop = () => {
    for (const res of clients) res.end();
    return new Promise((resolve) => server.close(resolve));
  };
  return server;
}
if (require.main === module) {
  const port = Number(process.env.PORT || 5173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error("Porta inválida.");
  const server = createDevServer();
  server.on("error", (err) => {
    console.error(
      err.code === "EADDRINUSE"
        ? "Porta ocupada. Feche a outra prévia, ou use outra porta com PORT."
        : err.message,
    );
    process.exitCode = 1;
  });
  server.listen(port, "127.0.0.1", () =>
    console.log(
      "PRO LIFE — prévia com atualização automática: http://127.0.0.1:" +
        port +
        "\nDeixe este terminal aberto. Ctrl+C encerra.",
    ),
  );
  process.on("SIGINT", () => server.stop().then(() => process.exit()));
}
module.exports = { createDevServer };
