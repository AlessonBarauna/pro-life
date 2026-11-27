(function (root) {
  "use strict";
  // PRO LIFE — Finanças: agora vivem na área do treinador (coach-area.js); este módulo só direciona os atalhos antigos.
  const doc = root.document;
  if (!doc) return;
  const A = () => root.ProLifeCoachArea;
  const open = (tab) => A()?.go("financas", tab || "projecao");
  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest("[data-sm27-finance-investors]")) { ev.preventDefault(); open("investidores"); return; }
    if (t.closest("[data-sm27-finance]")) { ev.preventDefault(); doc.body.classList.remove("sm27-menu-open"); open("projecao"); }
  }, true);
  root.ProLifeSM27Finance = { open: () => open("investidores"), close() {} };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Finance;
})(typeof window !== "undefined" ? window : globalThis);
