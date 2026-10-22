"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createDevServer } = require("./dev-server.cjs");

const root = path.resolve(__dirname, "..");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.join(root, "artifacts", "coach-creator-crests");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(fn, attempts = 80) {
  let last;
  for (let index = 0; index < attempts; index += 1) {
    try { return await fn(); } catch (error) { last = error; await delay(100); }
  }
  throw last;
}

class Cdp {
  constructor(url) {
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Set();
    this.ws = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(String(data));
      if (!message.id) {
        for (const listener of this.listeners) listener(message);
        return;
      }
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
  }
  on(listener) { this.listeners.add(listener); }
  async send(method, params = {}, sessionId) {
    await this.ready;
    const id = ++this.id;
    const response = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
    this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return response;
  }
  close() { this.ws.close(); }
}

async function evaluate(cdp, sessionId, expression) {
  const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, sessionId);
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function main() {
  if (!fs.existsSync(chrome)) throw new Error(`Chrome nao encontrado: ${chrome}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const appPort = 18100 + Math.floor(Math.random() * 300);
  const server = createDevServer(root);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(appPort, "127.0.0.1", resolve);
  });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pro-life-coach-crests-"));
  const debugPort = 19100 + Math.floor(Math.random() * 300);
  const browser = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--no-default-browser-check", `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  let cdp;
  try {
    const version = await retry(async () => {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (!response.ok) throw new Error(`Chrome DevTools: ${response.status}`);
      return response.json();
    });
    cdp = new Cdp(version.webSocketDebuggerUrl);
    const { targetId } = await cdp.send("Target.createTarget", { url: `http://127.0.0.1:${appPort}/` });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    const responses = [];
    const failures = [];
    cdp.on((message) => {
      if (message.sessionId !== sessionId) return;
      if (message.method === "Network.responseReceived" && /club-crests/.test(message.params.response.url)) {
        const { url, status, mimeType, fromDiskCache, fromServiceWorker } = message.params.response;
        responses.push({ url, status, mimeType, fromDiskCache, fromServiceWorker });
      }
      if (message.method === "Network.loadingFailed" && /club-crests/.test(message.params.blockedReason || message.params.errorText || "")) failures.push(message.params);
    });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Network.enable", {}, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    await retry(async () => {
      if (!await evaluate(cdp, sessionId, "Boolean(document.querySelector('[data-action=\"new-coach\"]'))")) throw new Error("Landing ainda carregando");
      return true;
    });
    await evaluate(cdp, sessionId, `(() => {
      document.querySelector('[data-action="new-coach"]').click();
      const form = document.querySelector('#coach-creation-form');
      form.elements.name.value = 'Auditoria Visual';
      form.elements.city.value = 'Sao Paulo';
      document.querySelector('[data-coach-step="4"]').click();
      return true;
    })()`);
    await retry(async () => {
      const loaded = await evaluate(cdp, sessionId, `(() => {
        const cards = [...document.querySelectorAll('.coach-club-option')];
        const images = cards.flatMap(card => [...card.querySelectorAll('img.pl-club-crest')]);
        return cards.length >= 20 && images.length > 0 && images.every(img => img.complete);
      })()`);
      if (!loaded) throw new Error("Escudos ainda carregando");
      return true;
    });
    await delay(300);
    const ui = await evaluate(cdp, sessionId, `(() => {
      const wanted = ['Athletico-PR','Atlético-MG','Bahia','Corinthians','Flamengo','São Paulo'];
      return wanted.map(name => {
        const card = [...document.querySelectorAll('.coach-club-option')].find(node => node.querySelector('.coach-club-option-info > span')?.textContent === name);
        const image = card?.querySelector('img.pl-club-crest');
        const fallback = card?.querySelector('.pl-club-crest--fallback');
        return { name, found: Boolean(card), src: image?.getAttribute('src') || null, absoluteSrc: image?.currentSrc || null,
          complete: image?.complete ?? null, naturalWidth: image?.naturalWidth ?? null, fallback: fallback?.textContent || null };
      });
    })()`);
    const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
    fs.writeFileSync(path.join(outputDir, "coach-club-list.png"), Buffer.from(screenshot.data, "base64"));
    await evaluate(cdp, sessionId, `(() => {
      const card = [...document.querySelectorAll('.coach-club-option')].find(node => node.textContent.includes('Flamengo'));
      card?.scrollIntoView({ block: 'start' });
      return Boolean(card);
    })()`);
    await delay(200);
    const lowerScreenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
    fs.writeFileSync(path.join(outputDir, "coach-club-list-flamengo.png"), Buffer.from(lowerScreenshot.data, "base64"));
    const report = { appUrl: `http://127.0.0.1:${appPort}/`, ui, responses, failures };
    fs.writeFileSync(path.join(outputDir, "network-report.json"), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (ui.some((item) => !item.found || (!item.fallback && (!item.complete || item.naturalWidth < 1)))) process.exitCode = 1;
    if (responses.some((item) => item.status !== 200) || failures.length) process.exitCode = 1;
  } finally {
    cdp?.close();
    browser.kill();
    await server.stop();
  }
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
