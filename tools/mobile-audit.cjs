"use strict";
// Auditoria visual do celular deitado: percorre as telas do jogo nas resoluções
// exigidas e mede overflow, cortes, sobreposição e alvos de toque.
// Uso: node tools/mobile-audit.cjs [pasta-saida] [telas,separadas,por,virgula]
const fs = require("node:fs");
const path = require("node:path");
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }

const baseUrl = process.env.PRO_LIFE_URL || "http://127.0.0.1:5173/";
const outDir = path.resolve(process.argv[2] || "artifacts/mobile-audit");
const only = (process.argv[3] || "").split(",").filter(Boolean);
const VIEWPORTS = [[667, 375], [740, 360], [780, 360], [844, 390], [896, 414], [932, 430]];
const PAGES = ["home", "profile", "training", "squad", "calendar", "matches", "league", "competitions", "statistics", "awards", "worldCompetitions", "market", "proposals", "clubs", "life", "finance", "inbox", "history", "save"];
const PARENT = { calendar: "competitions", matches: "competitions", league: "competitions", statistics: "competitions", awards: "competitions", worldCompetitions: "competitions", proposals: "market", clubs: "market", training: "profile", finance: "life" };
const TAB_SELECTORS = [".game-subnav button", ".cc-market-screen-nav button", ".pl-squad-tabs button", ".sq-subtabs button", ".life-tabs button", ".life-tabs a", ".cc-tabs button", ".cc-market-main-nav button", ".cc-scout-subnav button", ".pl-player-tabs button", ".wa-tabs button", ".season-nav button", ".wc-tabs button", "[role='tablist'] [role='tab']"];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function measure() {
  const vw = innerWidth, vh = innerHeight;
  const out = { overflowX: document.documentElement.scrollWidth - vw, issues: [] };
  // visível de verdade: tem tamanho, não está escondido e não está fora da área recortada por um ancestral com overflow
  const vis = (el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    if (!(r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0)) return false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.display === "none" || ps.visibility === "hidden") return false;
      if (/(hidden|auto|scroll|clip)/.test(ps.overflowX + ps.overflowY) && p !== document.documentElement) {
        const pr = p.getBoundingClientRect();
        const clipX = /(hidden|auto|scroll|clip)/.test(ps.overflowX), clipY = /(hidden|auto|scroll|clip)/.test(ps.overflowY);
        if (clipX && (r.right <= pr.left + 1 || r.left >= pr.right - 1)) return false;
        if (clipY && (r.bottom <= pr.top + 1 || r.top >= pr.bottom - 1)) return false;
      }
      if (ps.position === "fixed") break;
    }
    return true;
  };
  const name = (el) => (el.id ? "#" + el.id : "") + "." + String(el.className || "").toString().split(/\s+/).filter(Boolean).slice(0, 2).join(".") + (el.tagName === "BUTTON" ? "[" + (el.textContent || "").trim().slice(0, 18) + "]" : "");
  // rolagem horizontal interna
  for (const el of document.querySelectorAll("#app *")) {
    const s = getComputedStyle(el);
    if (!vis(el)) continue;
    if (/(auto|scroll)/.test(s.overflowX) && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 40) out.issues.push({ t: "scroll-x", el: name(el), by: el.scrollWidth - el.clientWidth });
  }
  // fora da tela (somente elementos que não estão dentro de um contêiner que rola na horizontal)
  for (const el of document.querySelectorAll("#app button, #app input, #app select, #app h1, #app h2, #app h3, #app th, #app td, #app .card, #app .panel")) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) out.issues.push({ t: "fora-x", el: name(el), right: Math.round(r.right), left: Math.round(r.left) });
  }
  // texto cortado dentro de caixa com overflow hidden (sem ellipsis)
  for (const el of document.querySelectorAll("#app button, #app .card h3, #app th, #app td, #app label, #app summary")) {
    if (!vis(el)) continue;
    const s = getComputedStyle(el);
    if (/hidden|clip/.test(s.overflowX) && s.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) out.issues.push({ t: "texto-cortado", el: name(el), by: el.scrollWidth - el.clientWidth });
  }
  // sobreposição entre controles
  const ctrls = [...document.querySelectorAll("#app button, #app select, #app input")].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < vh; });
  for (let i = 0; i < ctrls.length; i++) for (let j = i + 1; j < ctrls.length; j++) {
    const a = ctrls[i], b = ctrls[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 4 && h > 4 && (w * h) / Math.min(ra.width * ra.height, rb.width * rb.height) > 0.3) {
      const cx = (Math.max(ra.left, rb.left) + Math.min(ra.right, rb.right)) / 2, cy = (Math.max(ra.top, rb.top) + Math.min(ra.bottom, rb.bottom)) / 2;
      const top = document.elementFromPoint(cx, cy);
      out.issues.push({ t: "sobreposicao", el: name(a) + " x " + name(b), top: top ? name(top) : "" });
    }
  }
  // alvos de toque pequenos (visíveis na janela)
  let small = 0;
  for (const el of ctrls) { const r = el.getBoundingClientRect(); if (r.height < 22 || r.width < 22) small++; }
  out.smallTargets = small;
  // tamanho de texto ilegível
  let tiny = 0;
  for (const el of document.querySelectorAll("#app *")) {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) continue;
    if (parseFloat(getComputedStyle(el).fontSize) < 8.5) tiny++;
  }
  out.tinyText = tiny;
  // a tela rola? (altura do painel)
  const body = document.querySelector(".sm27-screen-body") || document.querySelector(".game-stage");
  out.panel = body ? { clientH: body.clientHeight, scrollH: body.scrollHeight } : null;
  out.docScrollY = document.documentElement.scrollHeight - vh;
  return out;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  await page.goto(baseUrl);
  await page.waitForFunction("Boolean(window.ProLife && window.ProLifeSave)", null, { timeout: 30000 });
  await page.evaluate(() => {
    localStorage.clear();
    const state = window.ProLife.create({ mode: "coach", age: 35 }, 44);
    const offer = state.offers?.[0];
    if (offer) window.ProLifeApp.execute(state, "join", { id: offer.clubId });
    window.ProLifeSave.saveAsNew(state);
  });
  await page.reload(); await delay(1500);
  await page.evaluate(() => { const b = document.querySelector("[data-load-slot]") || document.querySelector('[data-action="continue"]'); if (b) b.click(); });
  await delay(1500);
  const report = [];
  for (const [w, h] of VIEWPORTS.filter(([vw]) => !process.env.VP || String(vw) === process.env.VP)) {
    await page.setViewportSize({ width: w, height: h });
    await delay(400);
    for (const id of PAGES) {
      if (only.length && !only.includes(id)) continue;
      if (PARENT[id]) { await page.evaluate((p) => document.querySelector(`[data-page="${p}"]`)?.click(), PARENT[id]); await delay(350); }
      await page.evaluate((p) => { const b = document.querySelector(`[data-page="${p}"]`) || document.querySelector(`.sm27-drawer [data-page="${p}"]`); if (b) b.click(); else window.__missing = p; }, id);
      await delay(450);
      await page.evaluate(() => { for (const b of document.querySelectorAll("button")) if (/^\s*agora n.o\s*$/i.test(b.textContent || "")) b.click(); });
      const stem = `${w}x${h}-${id}`;
      const m = await page.evaluate(measure);
      report.push({ vp: `${w}x${h}`, screen: id, ...m });
      if (w === 844 || only.length) await page.screenshot({ path: path.join(outDir, stem + ".png") });
      // percorre as abas internas
      const tabs = await page.evaluate((sels) => {
        const seen = new Set(), list = [];
        sels.forEach((s) => document.querySelectorAll("#app " + s).forEach((el) => { const t = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 30); if (!t || seen.has(t) || el.dataset.page || el.closest(".game-nav,.sm27-drawer")) return; seen.add(t); el.dataset.auditTab = String(list.length); list.push(t); }));
        return list;
      }, TAB_SELECTORS);
      for (let i = 0; i < Math.min(tabs.length, 12); i++) {
        const ok = await page.evaluate((idx) => { const el = document.querySelector(`#app [data-audit-tab="${idx}"]`); if (el) { el.click(); return true; } return false; }, i);
        if (!ok) continue;
        await delay(300);
        const mm = await page.evaluate(measure);
        report.push({ vp: `${w}x${h}`, screen: `${id} › ${tabs[i]}`, ...mm });
        if (only.length || w === 844) await page.screenshot({ path: path.join(outDir, `${stem}-tab${i}.png`) });
      }
    }
  }
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify({ report, errors }, null, 2));
  let bad = 0;
  for (const r of report) {
    const probs = [];
    if (r.overflowX > 1) probs.push(`overflow-x ${r.overflowX}px`);
    const kinds = {};
    for (const i of r.issues) kinds[i.t] = (kinds[i.t] || 0) + 1;
    for (const k of Object.keys(kinds)) probs.push(`${k}×${kinds[k]}`);
    if (r.docScrollY > 1) probs.push(`rolagem-do-documento ${r.docScrollY}px`);
    if (probs.length) { bad++; console.log(`${r.vp} ${r.screen}: ${probs.join(", ")}`); }
  }
  console.log(`\n${report.length} medições, ${bad} com problemas. Erros de JS: ${errors.length}`);
  await browser.close();
  process.exitCode = bad || errors.length ? 1 : 0;
}
main().catch((e) => { console.error(e.stack || e.message); process.exitCode = 2; });
