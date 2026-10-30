(function (root) {
  "use strict";
  // PRO LIFE — viewport do celular deitado.
  // Nenhuma tela é escalada nem dividida em páginas: o layout é responsivo ao
  // tamanho real do aparelho. Este módulo só publica a área visível (que muda
  // com a barra de endereço) como variáveis CSS e marca o modo celular.

  const QUERY = "(orientation: landscape) and (min-width: 568px) and (max-width: 1024px) and (max-height: 560px)";
  const doc = root.document;
  let queued = false;

  function isPhone() {
    return !!(root.matchMedia && root.matchMedia(QUERY).matches);
  }

  function publish() {
    queued = false;
    if (!doc?.documentElement) return;
    const visual = root.visualViewport;
    const height = Math.round(visual?.height || root.innerHeight || 0);
    const width = Math.round(visual?.width || root.innerWidth || 0);
    const style = doc.documentElement.style;
    if (height) style.setProperty("--pl-vh", `${height}px`);
    if (width) style.setProperty("--pl-vw", `${width}px`);
    doc.documentElement.classList.toggle("pl-phone", isPhone());
  }

  function schedule() {
    if (queued) return;
    queued = true;
    (root.requestAnimationFrame || ((fn) => setTimeout(fn, 16)))(publish);
  }

  function start() {
    root.addEventListener("resize", schedule);
    root.addEventListener("orientationchange", schedule);
    root.visualViewport?.addEventListener("resize", schedule);
    schedule();
  }

  if (doc) {
    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start, { once:true });
    else start();
  }
  root.ProLifeMobileViewport = { QUERY, isPhone, refresh:schedule };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeMobileViewport;
})(typeof window !== "undefined" ? window : globalThis);
