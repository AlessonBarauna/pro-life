(function (root) {
  "use strict";
  // PRO LIFE — Habilidades: agora vivem na área do treinador (coach-area.js).
  const doc = root.document;
  if (!doc) return;
  const A = () => root.ProLifeCoachArea;
  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (t?.closest("[data-sm27-skills]")) { ev.preventDefault(); doc.body.classList.remove("sm27-menu-open"); A()?.go("treinador"); }
  }, true);
  root.ProLifeSM27Skills = { open: () => A()?.go("treinador"), close() {} };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Skills;
})(typeof window !== "undefined" ? window : globalThis);
