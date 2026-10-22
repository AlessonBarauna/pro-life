"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const chrome = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const baseUrl = process.env.PRO_LIFE_URL || "http://127.0.0.1:5173/";
const outputDir = path.resolve(root, process.argv[2] || "artifacts/central-v2");
const label = process.argv[3] || "audit";
const viewports = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(fn, attempts = 50) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    try { return await fn(); } catch (error) { last = error; await delay(100); }
  }
  throw last;
}

class Cdp {
  constructor(url) {
    this.id = 0;
    this.pending = new Map();
    this.ws = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(String(data));
      const request = this.pending.get(message.id);
      if (!request) return;
      this.pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    });
  }
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
  if (result.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(detail || "Falha ao avaliar a pagina");
  }
  return result.result.value;
}

async function main() {
  if (!fs.existsSync(chrome)) throw new Error(`Chrome nao encontrado: ${chrome}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "pro-life-central-audit-"));
  const port = 9333 + Math.floor(Math.random() * 300);
  const browser = spawn(chrome, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
    "--no-default-browser-check", `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`, "about:blank",
  ], { stdio: "ignore", windowsHide: true });
  let cdp;
  try {
    const version = await retry(async () => {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (!response.ok) throw new Error(`Chrome DevTools: ${response.status}`);
      return response.json();
    });
    cdp = new Cdp(version.webSocketDebuggerUrl);
    const { targetId } = await cdp.send("Target.createTarget", { url: baseUrl });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await retry(async () => {
      const ready = await evaluate(cdp, sessionId, "Boolean(window.ProLife && window.ProLifeSave)");
      if (!ready) throw new Error("Aplicacao ainda carregando");
      return true;
    }, 80);
    await evaluate(cdp, sessionId, `(() => {
      const state = window.ProLife.create({ mode: "coach", age: 35 }, 44);
      const offer = state.offers?.[0];
      if (offer) window.ProLifeApp.execute(state, "join", { id: offer.clubId });
      window.ProLifeSave.saveAsNew(state);
      location.reload();
      return true;
    })()`);
    await delay(1600);
    await evaluate(cdp, sessionId, `(() => {
      const button = document.querySelector("[data-load-slot]") || document.querySelector('[data-action="continue"]');
      if (button) button.click();
      return Boolean(button);
    })()`);
    await delay(1400);
    await evaluate(cdp, sessionId, `(() => {
      const buttons = [...document.querySelectorAll("button")];
      const dismiss = buttons.find((button) => /agora n.o/i.test(button.textContent || ""));
      if (dismiss) dismiss.click();
      scrollTo(0, 0);
      return Boolean(document.querySelector(".fc27-central-v2-approved"));
    })()`);
    await delay(500);

    const report = [];
    for (const viewport of viewports) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width, height: viewport.height, deviceScaleFactor: 1, mobile: viewport.width <= 480,
      }, sessionId);
      await delay(350);
      await evaluate(cdp, sessionId, "scrollTo(0, 0); true");
      const metrics = await evaluate(cdp, sessionId, `(() => {
        const selectors = [
          ".career-dashboard.fc27-central-v2-approved", ".fc27-v2-layout", ".central-v3-hero",
          ".fc27-v2-board", ".fc27-v2-calendar", ".fc27-v2-competitions",
          ".fc27-v2-summary", ".fc27-v2-alerts", ".central-v3-grid", ".central-v3-context"
        ];
        const result = {
          viewport: { width: innerWidth, height: innerHeight },
          document: { scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth },
          elements: {}
        };
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (!element) { result.elements[selector] = null; continue; }
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          result.elements[selector] = {
            x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height),
            display: style.display, gridTemplateColumns: style.gridTemplateColumns,
            flex: style.flex, minWidth: style.minWidth, maxWidth: style.maxWidth,
            overflowX: style.overflowX, wordBreak: style.wordBreak,
            parentClass: element.parentElement?.className || "",
            strictLayoutMatch: element.matches(".fc27-central-v2-approved > .fc27-v2-layout > *")
          };
        }
        return result;
      })()`);
      const shot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false }, sessionId);
      const stem = `${label}-${viewport.width}x${viewport.height}`;
      fs.writeFileSync(path.join(outputDir, `${stem}.png`), Buffer.from(shot.data, "base64"));
      report.push({ name: stem, ...metrics, horizontalOverflow: metrics.document.scrollWidth > metrics.document.clientWidth });
    }
    fs.writeFileSync(path.join(outputDir, `${label}-metrics.json`), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    cdp?.close();
    browser.kill();
  }
}

main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
