(function (root) {
  "use strict";

  const QUERY = "(orientation: landscape) and (min-width: 568px) and (max-width: 1024px) and (max-height: 560px)";
  const doc = root.document;
  let queued = false;

  function wrap(content, kind) {
    const parentClass = kind === "stage" ? "mobile-stage-viewport" : "mobile-screen-viewport";
    if (content.parentElement?.parentElement?.classList.contains(parentClass)) {
      return { viewport:content.parentElement.parentElement, canvas:content.parentElement };
    }
    const viewport = doc.createElement("div");
    const canvas = doc.createElement("div");
    viewport.className = parentClass;
    canvas.className = "mobile-game-canvas";
    content.before(viewport);
    viewport.appendChild(canvas);
    canvas.appendChild(content);
    return { viewport, canvas };
  }

  function clear(pair) {
    pair.canvas.style.removeProperty("--pl-mobile-fit");
    pair.canvas.style.removeProperty("width");
  }

  function fit(pair) {
    const { viewport, canvas } = pair;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (!width || !height) return;
    clear(pair);
    let scale = 1;
    for (let pass = 0; pass < 5; pass += 1) {
      canvas.style.width = `${width / scale}px`;
      const naturalWidth = Math.max(canvas.scrollWidth, width / scale);
      const naturalHeight = Math.max(canvas.scrollHeight, 1);
      const next = Math.min(1, width / naturalWidth, height / naturalHeight);
      if (Math.abs(next - scale) < .015) { scale = next; break; }
      scale = next;
    }
    scale = Math.max(.3, Math.min(1, scale));
    canvas.style.width = `${width / scale}px`;
    canvas.style.setProperty("--pl-mobile-fit", scale.toFixed(4));
  }

  function update() {
    queued = false;
    const app = doc.getElementById("app");
    if (!app) return;
    const landscape = root.matchMedia(QUERY).matches;
    const stage = app.querySelector(".game-stage");
    const standaloneScreen = app.querySelector(":scope > .coach-creation, :scope > .wizard, :scope > .career-hub, :scope > .landing");
    const pairs = [];
    if (stage) pairs.push(wrap(stage, "stage"));
    else if (standaloneScreen) pairs.push(wrap(standaloneScreen, "screen"));
    for (const pair of pairs) landscape ? fit(pair) : clear(pair);
  }

  function schedule() {
    if (queued) return;
    queued = true;
    root.requestAnimationFrame(() => root.requestAnimationFrame(update));
  }

  function start() {
    const app = doc.getElementById("app");
    if (!app) return;
    new MutationObserver(schedule).observe(app, { childList:true, subtree:true });
    root.addEventListener("resize", schedule);
    root.addEventListener("orientationchange", schedule);
    schedule();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
  root.ProLifeMobileViewport = { fit:schedule };
})(typeof window !== "undefined" ? window : globalThis);
