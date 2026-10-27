(function () {
  "use strict";

  const root = document.documentElement;
  const standalone = window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let installPrompt = null;

  root.classList.toggle("pwa-standalone", standalone);
  root.classList.toggle("pwa-browser", !standalone);

  function ready() {
    requestAnimationFrame(() => root.classList.add("pwa-ready"));
  }

  function closeGuide() {
    document.querySelector(".pwa-install-guide")?.remove();
  }

  function showGuide() {
    closeGuide();
    const guide = document.createElement("div");
    guide.className = "pwa-install-guide";
    guide.innerHTML = `<section role="dialog" aria-modal="true" aria-labelledby="pwa-install-title"><button type="button" class="pwa-guide-close" data-pwa-guide-close aria-label="Fechar">×</button><div class="tag">PRO LIFE NO CELULAR</div><h2 id="pwa-install-title">Instale como aplicativo</h2>${ios ? `<ol><li>Toque no botão <b>Compartilhar</b> do Safari.</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Confirme em <b>Adicionar</b> e abra pelo novo ícone.</li></ol>` : `<p>Abra o menu do navegador e escolha <b>Instalar aplicativo</b> ou <b>Adicionar à tela inicial</b>.</p>`}<p class="muted">O jogo abrirá sem a barra do navegador e poderá funcionar offline. Antes de instalar, exporte sua carreira como cópia de segurança.</p><button type="button" class="primary" data-pwa-guide-close>Entendi</button></section>`;
    document.body.appendChild(guide);
    guide.querySelector(".pwa-guide-close")?.focus();
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    root.classList.add("pwa-installable");
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    root.classList.remove("pwa-installable", "pwa-browser");
    root.classList.add("pwa-standalone");
    closeGuide();
  });

  document.addEventListener("click", async (event) => {
    if (event.target.closest?.("[data-pwa-guide-close]")) {
      closeGuide();
      return;
    }
    if (!event.target.closest?.("[data-install-app]")) return;
    event.preventDefault();
    if (standalone) return;
    if (!installPrompt) {
      showGuide();
      return;
    }
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    await prompt.userChoice.catch(() => null);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready, { once:true });
  else ready();
})();
