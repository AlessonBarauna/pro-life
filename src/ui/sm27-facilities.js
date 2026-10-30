(function (root) {
  "use strict";
  // PRO LIFE — Zona do Clube / Instalações (modo treinador). Lê e altera o estado via ProLifeSM27Ctx/Cmd.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let layer = null;

  function money(v) {
    const n = Number(v) || 0, a = Math.abs(n), sign = n < 0 ? "-" : "";
    if (a >= 1e9) return sign + "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi";
    if (a >= 1e6) return sign + "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi";
    if (a >= 1e3) return sign + "R$ " + Math.round(a / 1e3) + " mil";
    return sign + "R$ " + Math.round(a);
  }

  function card(f, budget) {
    const pips = Array.from({ length: f.max }, (_, i) => `<i class="${i < f.level ? "on" : ""}"></i>`).join("");
    const can = f.cost !== null && budget >= f.cost;
    const action = f.next === null
      ? `<span class="fac-max">Nível máximo</span>`
      : `<button type="button" class="fac-up" data-sm27fac-up="${f.id}" ${can ? "" : "disabled"}>Melhorar · ${money(f.cost)}</button>${can ? "" : `<small class="fac-warn">Orçamento insuficiente</small>`}`;
    return `<li class="fac-card"><div class="fac-top"><b>${esc(f.label)}</b><span class="fac-lv">Nível ${f.level}/${f.max}</span></div><span class="fac-pips" aria-hidden="true">${pips}</span><p>${esc(f.blurb)}</p><dl><dt>Agora</dt><dd>${esc(f.current)}</dd>${f.next ? `<dt>Próximo</dt><dd>${esc(f.next)}</dd>` : ""}</dl><div class="fac-act">${action}</div></li>`;
  }

  function html() {
    const ctx = root.ProLifeSM27Ctx?.();
    const F = ctx?.D?.Facilities;
    let body;
    if (!ctx?.s || ctx.s.mode !== "coach" || !F) body = `<p class="shd-note">As instalações ficam disponíveis na carreira de treinador.</p>`;
    else {
      const club = ctx.D.club(ctx.s);
      if (!club) body = `<p class="shd-note">Assine com um clube para gerir as instalações.</p>`;
      else {
        const budget = Number(club.budget) || 0;
        body = `<p class="shd-sub">Orçamento do clube: <b>${money(budget)}</b></p><ul class="fac-list">${F.IDS.map((id) => card(F.describe(ctx.s, club, id), budget)).join("")}</ul>`;
      }
    }
    return `<div class="sm27-dialog-backdrop" data-sm27fac-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Zona do clube"><header class="sm27-dialog-head"><span></span><h2>Zona do clube</h2><button type="button" class="sm27-dialog-x" data-sm27fac-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body">${body}</div></section>`;
  }

  function open() {
    if (!layer) {
      layer = doc.createElement("div");
      layer.className = "sm27-dialog-layer";
      doc.body.appendChild(layer);
      doc.body.classList.remove("sm27-menu-open");
    }
    const keep = layer.querySelector(".sm27-dialog-body")?.scrollTop || 0;
    layer.innerHTML = html();
    const b = layer.querySelector(".sm27-dialog-body");
    if (b) b.scrollTop = keep;
    if (!keep) layer.querySelector(".sm27-dialog-x")?.focus({ preventScroll: true });
  }
  function close() { if (layer) { layer.remove(); layer = null; } }

  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest("[data-sm27-facilities]")) { ev.preventDefault(); open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27fac-close]")) { close(); return; }
    const up = t.closest("[data-sm27fac-up]");
    if (up && !up.disabled) { root.ProLifeSM27Cmd?.("upgradeFacility", { id: up.dataset.sm27facUp }); open(); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });

  root.ProLifeSM27Facilities = { open, close, html };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Facilities;
})(typeof window !== "undefined" ? window : globalThis);
