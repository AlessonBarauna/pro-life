"use strict";

const path = require("node:path");

// Shared test-only loader. Browser cache-busting parameters are not filesystem paths.
function scriptPathsFromHtml(html, { srcOnly = false } = {}) {
  const paths = [];
  const tags = String(html).matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi);
  for (const match of tags) {
    const pathname = match[1].split(/[?#]/, 1)[0].replace(/^\.\//, "");
    if (!pathname || /^(?:[a-z][a-z\d+.-]*:|\/\/|\/|\.\.)/i.test(pathname)) continue;
    if (srcOnly && !pathname.startsWith("src/")) continue;
    if (!pathname.endsWith(".js")) continue;
    paths.push(pathname);
  }
  return paths;
}

function fileForScript(root, script) {
  const normalized = path.normalize(script);
  if (path.isAbsolute(normalized) || normalized === ".." || normalized.startsWith(".." + path.sep)) {
    throw new Error("Unsafe script path: " + script);
  }
  return path.join(root, normalized);
}

module.exports = { scriptPathsFromHtml, fileForScript };
