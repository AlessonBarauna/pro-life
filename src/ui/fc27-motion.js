(function () {
  "use strict";
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function tier(o) { return o >= 85 ? "elite" : o >= 75 ? "gold" : o >= 65 ? "silver" : "bronze"; }
  function tag() {
    var heroes = document.querySelectorAll(".player-hero:not([data-tier]), .dev32-hero:not([data-tier])");
    heroes.forEach(function (h) {
      var el = h.querySelector(".player-ovr strong, .dev32-ratings strong, [data-ovr]");
      var n = el ? parseInt(el.textContent, 10) : NaN;
      if (isFinite(n)) h.setAttribute("data-tier", tier(n));
    });
  }
  function countUp() {
    if (reduce) return;
    document.querySelectorAll(".player-ovr strong:not([data-cu]), .central-v3-rating:not([data-cu])").forEach(function (el) {
      el.setAttribute("data-cu", "1");
      var txt = el.textContent.trim();
      if (!/^\d{1,3}$/.test(txt)) return;
      var end = parseInt(txt, 10), start = Math.max(0, end - 12), t0 = null;
      function step(t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / 650);
        el.textContent = String(Math.round(start + (end - start) * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step); else el.textContent = String(end);
      }
      requestAnimationFrame(step);
    });
  }
  var busy = false;
  function run() {
    if (busy) return; busy = true;
    try { tag(); countUp(); } catch (e) {}
    busy = false;
  }
  function init() {
    run();
    var timer = null;
    new MutationObserver(function () {
      if (busy) return;
      clearTimeout(timer); timer = setTimeout(run, 40);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
