(function (root) {
  "use strict";

  const QUERY = "(orientation: landscape) and (min-width: 568px) and (max-width: 1024px) and (max-height: 560px)";
  const doc = root.document;
  let queued = false;
  let pagedBody = null;
  let pagedContent = null;
  let currentPage = 0;
  let pageCount = 1;
  let pageGroups = [];
  let pageBlocks = [];
  let persistentBlocks = [];
  let pageUsableHeight = 1;

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

  function clearPager() {
    if (!pagedBody) return;
    pagedBody.classList.remove("sm27-paged");
    pagedBody.querySelector("[data-sm27-pager]")?.remove();
    pagedBody.querySelectorAll("[data-sm27-unscroll]").forEach((node) => node.removeAttribute("data-sm27-unscroll"));
    pagedBody.querySelectorAll("[data-sm27-page-hidden]").forEach((node) => node.removeAttribute("data-sm27-page-hidden"));
    pagedContent?.style.removeProperty("--sm27-page-fit");
    pagedContent?.removeAttribute("data-sm27-page-content");
    pagedBody = null;
    pagedContent = null;
    currentPage = 0;
    pageCount = 1;
    pageGroups = [];
    pageBlocks = [];
    persistentBlocks = [];
  }

  function releaseNestedScroll(body) {
    // Telas antigas tinham rolagens locais em listas, calendários e cartões.
    // No telefone esses painéis crescem e o paginador divide o conteúdo em telas.
    for (let pass = 0; pass < 4; pass += 1) {
      let changed = false;
      for (const node of body.querySelectorAll("*:not(select):not(textarea)")) {
        if (node.hasAttribute("data-sm27-unscroll") || node.hasAttribute("data-sm27-pager")) continue;
        const style = root.getComputedStyle(node);
        if (style.position === "fixed") continue;
        const verticalScrollable = /^(auto|scroll)$/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2;
        const verticalClipped = style.overflowY === "hidden" && node.clientHeight > 40 && node.scrollHeight > node.clientHeight + 8;
        const vertical = verticalScrollable || verticalClipped;
        const horizontal = /^(auto|scroll)$/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 2;
        if (!vertical && !horizontal) continue;
        node.setAttribute("data-sm27-unscroll", vertical && horizontal ? "both" : vertical ? "y" : "x");
        changed = true;
      }
      if (!changed) break;
      // Reading layout here applies the new overflow rules before the next pass.
      void body.offsetHeight;
    }
  }

  function isPersistentBlock(node) {
    if (!(node instanceof root.HTMLElement)) return false;
    if (node.matches("nav,[role='tablist'],[data-sm27-pager]")) return true;
    return /(^|[-_])(tabs?|subnav|navigation|menu)([-_]|$)/i.test(node.className || "");
  }

  function blockHeight(node) {
    const rect = node.getBoundingClientRect();
    return Math.max(1, Math.ceil(node.offsetHeight || node.scrollHeight || rect.height || 1));
  }

  function resolvePageBlocks(content, capacity) {
    let children = Array.from(content.children).filter((node) =>
      !node.matches("script,style,[data-sm27-pager]") && root.getComputedStyle(node).display !== "none"
    );
    children = children.flatMap((node) => root.getComputedStyle(node).display === "contents"
      ? Array.from(node.children).filter((child) => root.getComputedStyle(child).display !== "none")
      : [node]);
    let persistent = children.filter(isPersistentBlock);
    let blocks = children.filter((node) => !persistent.includes(node));

    // Algumas telas antigas possuem apenas um invólucro alto. Nelas, os cartões
    // internos são as páginas lógicas, evitando cortar um cartão ao meio.
    const only = blocks[0];
    const atomic = only?.matches?.(".pl-squad-workspace,.career-calendar,.cc-mobile-scout-profile,.fc27-match-report,.pl-pitch,.pitch");
    if (blocks.length === 1 && !atomic && blockHeight(only) > capacity * 1.15) {
      const nested = Array.from(only.children).filter((node) =>
        !node.matches("script,style") && root.getComputedStyle(node).display !== "none"
      );
      if (nested.length > 1) {
        const nestedPersistent = nested.filter(isPersistentBlock);
        persistent = persistent.concat(nestedPersistent);
        blocks = nested.filter((node) => !nestedPersistent.includes(node));
      }
    }
    return { persistent, blocks };
  }

  function groupWholeBlocks(blocks, capacity) {
    const groups = [];
    let group = [];
    let used = 0;
    for (const block of blocks) {
      const height = blockHeight(block);
      if (group.length && used + height > capacity) {
        groups.push(group);
        group = [];
        used = 0;
      }
      group.push(block);
      used += height;
    }
    if (group.length) groups.push(group);
    return groups.length ? groups : [[]];
  }

  function fitCurrentPage() {
    if (!pagedContent) return;
    pagedContent.style.removeProperty("--sm27-page-fit");
    const visible = persistentBlocks.concat(pageGroups[currentPage] || []);
    const naturalHeight = visible.reduce((total, node) => total + blockHeight(node), 0);
    const naturalWidth = Math.max(pagedContent.scrollWidth, pagedBody?.clientWidth || 1);
    const widthFit = (pagedBody?.clientWidth || naturalWidth) / Math.max(1, naturalWidth);
    const fit = Math.max(.36, Math.min(.92, widthFit, pageUsableHeight / Math.max(1, naturalHeight)));
    pagedContent.style.setProperty("--sm27-page-fit", fit.toFixed(4));
  }

  function applyPage() {
    if (!pagedBody) return;
    currentPage = Math.max(0, Math.min(pageCount - 1, currentPage));
    const visible = new Set(pageGroups[currentPage] || []);
    for (const block of pageBlocks) {
      if (visible.has(block)) block.removeAttribute("data-sm27-page-hidden");
      else block.setAttribute("data-sm27-page-hidden", "true");
    }
    fitCurrentPage();
    const pager = pagedBody.querySelector("[data-sm27-pager]");
    if (!pager) return;
    const status = pager.querySelector("[data-sm27-page-status]");
    const label = `Tela ${currentPage + 1} de ${pageCount}`;
    if (status && status.textContent !== label) status.textContent = label;
    const previous = pager.querySelector("[data-sm27-page='prev']");
    const next = pager.querySelector("[data-sm27-page='next']");
    if (previous) previous.disabled = currentPage === 0;
    if (next) next.disabled = currentPage >= pageCount - 1;
  }

  function paginate() {
    const body = doc.querySelector(".game-stage:not(.game-stage-home) > .sm27-screen-body");
    if (!root.matchMedia(QUERY).matches || !body) {
      clearPager();
      return;
    }
    if (pagedBody !== body) {
      clearPager();
      pagedBody = body;
    }
    releaseNestedScroll(body);
    const content = body.firstElementChild;
    if (!content) return;
    if (pagedContent !== content) {
      pagedBody.querySelectorAll("[data-sm27-page-hidden]").forEach((node) => node.removeAttribute("data-sm27-page-hidden"));
      pagedContent?.style.removeProperty("--sm27-page-fit");
      pagedContent = content;
      pagedContent.setAttribute("data-sm27-page-content", "true");
      currentPage = 0;
    }
    body.classList.remove("sm27-paged");
    content.style.removeProperty("--sm27-page-fit");
    body.querySelectorAll("[data-sm27-page-hidden]").forEach((node) => node.removeAttribute("data-sm27-page-hidden"));
    const viewportHeight = body.clientHeight;
    const pagerHeight = 44;
    const usable = Math.max(1, viewportHeight - pagerHeight);
    const resolved = resolvePageBlocks(content, usable);
    persistentBlocks = resolved.persistent;
    pageBlocks = resolved.blocks;
    const persistentHeight = persistentBlocks.reduce((total, node) => total + blockHeight(node), 0);
    const blockCapacity = Math.max(80, (usable / .92) - persistentHeight);
    pageGroups = groupWholeBlocks(pageBlocks, blockCapacity);
    pageCount = pageGroups.length;
    pageUsableHeight = usable;
    body.dataset.sm27PageHeight = String(usable);
    if (pageCount <= 1) {
      body.querySelector("[data-sm27-pager]")?.remove();
      currentPage = 0;
      applyPage();
      return;
    }
    body.classList.add("sm27-paged");
    let pager = body.querySelector("[data-sm27-pager]");
    if (!pager) {
      pager = doc.createElement("nav");
      pager.className = "sm27-screen-pager";
      pager.dataset.sm27Pager = "true";
      pager.setAttribute("aria-label", "Páginas desta tela");
      pager.innerHTML = '<button type="button" data-sm27-page="prev">‹ Anterior</button><span data-sm27-page-status aria-live="polite"></span><button type="button" data-sm27-page="next">Próxima ›</button>';
      body.appendChild(pager);
    }
    applyPage();
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
    paginate();
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
    doc.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-sm27-page]");
      if (!button || !pagedBody?.contains(button)) return;
      currentPage += button.dataset.sm27Page === "next" ? 1 : -1;
      applyPage();
    });
    schedule();
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start, { once:true });
  else start();
  root.ProLifeMobileViewport = { fit:schedule, paginate:schedule };
})(typeof window !== "undefined" ? window : globalThis);
