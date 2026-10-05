/* Only injected into the published build. Never runs in the offline index. */
(function () {
  "use strict";
  const installed = document.currentScript?.dataset.version;
  if (!installed || !["http:", "https:"].includes(location.protocol)) return;
  // PWA: guarda o jogo no aparelho para abrir offline e funcionar como app na tela de início do iPhone.
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  let shown = false;
  async function check() {
    if (shown || document.hidden) return;
    try {
      const url = new URL("version.json", location.href);
      url.searchParams.set("t", String(Date.now()));
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return;
      const version = await response.json();
      if (!/^[a-f0-9]{64}$/.test(version.version) || version.version === installed) return;
      shown = true;
      const banner = document.createElement("div");
      banner.id = "update-banner";
      banner.setAttribute("role", "status");
      const text = document.createElement("span");
      text.textContent = "Uma nova versão do PRO LIFE está disponível. ";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "primary";
      button.textContent = "Atualizar jogo";
      button.addEventListener("click", () => location.reload());
      banner.append(text, button);
      document.body.append(banner);
    } catch {
      /* Offline or transient error: keep the current game running. */
    }
  }
  setTimeout(check, 3000);
  setInterval(check, 30000);
  document.addEventListener("visibilitychange", check);
})();
