(function (root) {
  "use strict";
  // PRO LIFE — Habilidades do treinador (Treino · Vestiário · Tático). Pontos vêm de jogos, temporadas e títulos.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let layer = null, tab = "treino";

  function html() {
    const ctx = root.ProLifeSM27Ctx?.();
    const K = ctx?.D?.CoachSkills;
    let body;
    if (!ctx?.s || ctx.s.mode !== "coach" || !K) body = `<p class="shd-note">As habilidades ficam disponíveis na carreira de treinador.</p>`;
    else {
      const s = ctx.s, have = new Set(K.unlocked(s)), pts = K.available(s);
      const nodes = K.NODES.filter((n) => n.branch === tab);
      body = `<p class="shd-sub">Pontos disponíveis: <b>${pts}</b> · ganhos com jogos, temporadas e títulos</p><ul class="obj-list">${nodes.map((n) => {
        const done = have.has(n.id), locked = n.requires && !have.has(n.requires), can = !done && !locked && pts >= n.cost;
        const st = done ? "Ativa" : locked ? "Bloqueada" : `${n.cost} pt${n.cost > 1 ? "s" : ""}`;
        return `<li class="obj-row${done ? " done" : ""}"><span class="obj-top"><b>${esc(n.label)}</b><em>${st}</em></span><small>${esc(n.text)}${locked ? " · requer " + esc(K.NODES.find((x) => x.id === n.requires).label) : ""}</small>${done || locked ? "" : `<button type="button" class="fac-up" data-sm27sk-unlock="${n.id}" ${can ? "" : "disabled"}>Desbloquear</button>`}</li>`;
      }).join("")}</ul>`;
    }
    const tabs = Object.entries(ctx?.D?.CoachSkills?.BRANCHES || { treino: "Treino", vestiario: "Vestiário", tatico: "Tático" });
    return `<div class="sm27-dialog-backdrop" data-sm27sk-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Habilidades do treinador"><header class="sm27-dialog-head"><span></span><h2>Habilidades</h2><button type="button" class="sm27-dialog-x" data-sm27sk-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs obj-tabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-sm27sk-tab="${id}">${l}</button>`).join("")}</nav>${body}</div></section>`;
  }
  function open() {
    if (!layer) { layer = doc.createElement("div"); layer.className = "sm27-dialog-layer"; doc.body.appendChild(layer); doc.body.classList.remove("sm27-menu-open"); }
    layer.innerHTML = html();
    layer.querySelector(".sm27-dialog-x")?.focus({ preventScroll: true });
  }
  function close() { if (layer) { layer.remove(); layer = null; } }
  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest("[data-sm27-skills]")) { ev.preventDefault(); tab = "treino"; open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27sk-close]")) { close(); return; }
    const u = t.closest("[data-sm27sk-unlock]");
    if (u && !u.disabled) { root.ProLifeSM27Cmd?.("unlockCoachSkill", { id: u.dataset.sm27skUnlock }); open(); return; }
    const tb = t.closest("[data-sm27sk-tab]");
    if (tb) { tab = tb.dataset.sm27skTab; open(); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });
  root.ProLifeSM27Skills = { open, close };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Skills;
})(typeof window !== "undefined" ? window : globalThis);
