"use strict";
// Comportamento real do Service Worker gerado por tools/build.cjs, executado em um sandbox com Cache Storage simulado.
const test = require("node:test"), assert = require("node:assert/strict"), vm = require("node:vm");
const { serviceWorker } = require("../tools/build.cjs");
const { files } = require("../tools/assets.cjs");
const ORIGIN = "https://prolife.example";
const V1 = "a".repeat(64), V2 = "b".repeat(64);
const CREST = "src/assets/club-crests/c0.png", APP = "src/ui/app.js";

// Servidor estatico: arquivos de uma versao + cache HTTP do navegador (que pode estar velho: GitHub Pages usa max-age).
function makeWorld() {
  const world = { server: new Map(), httpCache: new Map(), online: true, storage: new Map(), reloads: [], networkHits: [] };
  world.deploy = (version) => {
    world.server = new Map(files.map((f) => ["/" + f, `${version.slice(0, 1)}:${f}`]));
    world.server.set("/version.json", JSON.stringify({ version }));
  };
  world.fetch = async (req) => {
    const url = new URL(req.url || req);
    if (!world.online) throw new TypeError("Failed to fetch (offline)");
    world.networkHits.push(url.pathname + url.search);
    const fresh = world.server.get(url.pathname);
    if (fresh === undefined) return new Response("nope", { status: 404 });
    const stale = world.httpCache.get(url.pathname);
    if (req.cache === "reload") { world.reloads.push(url.pathname); return new Response(fresh); }
    return new Response(stale !== undefined ? stale : fresh);
  };
  const resolve = (x) => new URL(typeof x === "string" ? x : x.url, ORIGIN + "/sw.js").href;
  world.caches = {
    async open(name) {
      if (!world.storage.has(name)) world.storage.set(name, new Map());
      const map = world.storage.get(name);
      return {
        async match(x, opts = {}) {
          let hit = map.get(resolve(x));
          if (hit === undefined && opts.ignoreSearch) { const path = new URL(resolve(x)).pathname; for (const [k, v] of map) if (new URL(k).pathname === path) { hit = v; break; } }
          return hit === undefined ? undefined : new Response(hit);
        },
        async put(x, res) { map.set(resolve(x), await res.text()); },
        async addAll(reqs) { for (const r of reqs) { const res = await world.fetch(r); if (!res.ok) throw new Error("addAll " + r.url); map.set(resolve(r), await res.text()); } },
      };
    },
    async keys() { return [...world.storage.keys()]; },
    async delete(name) { return world.storage.delete(name); },
  };
  return world;
}
function install(world, version) {
  const handlers = {};
  const self = { location: new URL(ORIGIN + "/sw.js"), addEventListener: (type, fn) => (handlers[type] = fn), skipWaiting: async () => {}, clients: { claim: async () => {} } };
  const sandbox = { self, location: self.location, caches: world.caches, fetch: world.fetch, Request, Response, URL, Promise, console };
  vm.runInNewContext(serviceWorker(version), sandbox, { filename: "sw.js" });
  const run = async (type) => { const waits = []; handlers[type]({ waitUntil: (p) => waits.push(p) }); await Promise.all(waits); };
  const request = async (path, extra = {}) => {
    let answer = null;
    const event = { request: { url: ORIGIN + "/" + path, method: "GET", mode: "cors", ...extra }, respondWith: (p) => (answer = p) };
    handlers.fetch(event);
    if (answer === null) return { intercepted: false };
    const res = await answer;
    return { intercepted: true, body: await res.text(), status: res.status };
  };
  return { run, request, handlers };
}
async function activate(world, version) { const sw = install(world, version); await sw.run("install"); await sw.run("activate"); return sw; }

test("SW: pre-cache ignora o cache HTTP e nunca grava arquivo velho sob a versao nova", async () => {
  const world = makeWorld();
  world.deploy(V1); await activate(world, V1);
  world.deploy(V2); // cache HTTP do navegador ainda tem as copias da v1
  for (const f of files) world.httpCache.set("/" + f, "a:" + f);
  world.reloads.length = 0;
  await activate(world, V2);
  assert.ok(world.reloads.length >= files.length, "todas as requisicoes de pre-cache usam cache:reload");
  const cache = await world.caches.open("prolife-" + V2);
  assert.equal(await (await cache.match(`${APP}?v=${V2}`)).text(), "b:" + APP);
  assert.equal(await (await cache.match(`${CREST}?v=${V2}`)).text(), "b:" + CREST);
});

test("SW: offline serve escudo sem query e assets versionados da propria build", async () => {
  const world = makeWorld(); world.deploy(V1);
  const sw = await activate(world, V1);
  world.online = false;
  for (const path of [CREST, `${CREST}?v=${V1}`, `${APP}?v=${V1}`]) {
    const r = await sw.request(path);
    assert.equal(r.intercepted, true, path);
    assert.equal(r.body, "a:" + path.split("?")[0], path);
  }
  const nav = await sw.request("", { mode: "navigate" });
  assert.equal(nav.body, "a:index.html");
});

test("SW: depois da atualizacao nenhum asset da versao antiga e servido (com ou sem ?v=)", async () => {
  const world = makeWorld(); world.deploy(V1);
  const old = await activate(world, V1);
  assert.equal((await old.request(CREST)).body, "a:" + CREST);
  world.deploy(V2);
  const fresh = await activate(world, V2);
  assert.deepEqual([...world.storage.keys()], ["prolife-" + V2], "cache antigo apagado na ativacao");
  world.online = false;
  for (const path of [CREST, `${CREST}?v=${V2}`, `${CREST}?v=${V1}`, `${APP}?v=${V1}`, APP]) {
    const r = await fresh.request(path);
    assert.equal(r.body, "b:" + path.split("?")[0], "sem conteudo antigo: " + path);
  }
  for (const stored of world.storage.get("prolife-" + V2).values()) assert.ok(!stored.startsWith("a:"), "cache novo sem arquivos antigos");
});

test("SW: query desconhecida nao e ignorada e cache miss online e armazenado para uso offline", async () => {
  const world = makeWorld(); world.deploy(V1);
  const sw = await activate(world, V1);
  world.online = false;
  await assert.rejects(sw.request(`${CREST}?x=1`), /offline/);
  await assert.rejects(sw.request(`${CREST}?v=${"c".repeat(64)}x`), /offline/);
  world.online = true; world.server.set("/src/assets/extra.png", "extra-1");
  assert.equal((await sw.request("src/assets/extra.png")).body, "extra-1");
  world.online = false;
  assert.equal((await sw.request("src/assets/extra.png")).body, "extra-1");
});

test("SW: version.json e sw.js passam direto para a rede (deteccao de atualizacao)", async () => {
  const world = makeWorld(); world.deploy(V1);
  const sw = await activate(world, V1);
  assert.equal((await sw.request("version.json")).intercepted, false);
  assert.equal((await sw.request("sw.js")).intercepted, false);
});

test("SW: navegacao online atualiza o index e offline nao pega index de outra versao", async () => {
  const world = makeWorld(); world.deploy(V1);
  await activate(world, V1);
  world.deploy(V2);
  const fresh = await activate(world, V2);
  world.online = false;
  assert.equal((await fresh.request("", { mode: "navigate" })).body, "b:index.html");
});
