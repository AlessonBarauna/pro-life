(function (root) {
  "use strict";
  // PRO LIFE — Vagas de emprego: propostas de clubes abertas para o treinador.
  // As propostas são as do próprio jogo (s.offers); aceitar/negociar continua na tela de Propostas.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let layer = null;
  const money = (v) => { const n = Number(v) || 0; return n >= 1e6 ? "R$ " + (n / 1e6).toFixed(1).replace(".", ",") + " mi" : n >= 1e3 ? "R$ " + Math.round(n / 1e3) + " mil" : "R$ " + Math.round(n); };

  function list() {
    const ctx = root.ProLifeSM27Ctx?.();
    if (!ctx?.s || ctx.s.mode !== "coach") return null;
    const { s, D } = ctx;
    return (s.offers || []).filter((o) => !Number.isFinite(Number(o.expires)) || Number(o.expires) >= Number(s.day)).map((o) => {
      let c = null, lg = null;
      try { c = D.GlobalFootball?.clubById?.(s, o.clubId) || D.club(s, o.clubId); } catch (e) { /* sem catálogo */ }
      try { lg = c?.leagueId ? D.GlobalFootball?.leagueById?.(s, c.leagueId) : null; } catch (e) { /* ignora */ }
      return { o, name: c?.name || String(o.clubId), league: lg?.name || c?.league || "", left: Math.max(0, Math.ceil(Number(o.expires) - Number(s.day))) };
    }).sort((a, b) => a.left - b.left);
  }
  function html() {
    const rows = list();
    let body;
    if (!rows) body = `<p class="shd-note">As vagas aparecem na carreira de treinador.</p>`;
    else if (!rows.length) body = `<p class="shd-note">Nenhuma vaga aberta agora. Boas campanhas e reputação atraem novas propostas.</p>`;
    else body = `<p class="shd-sub">Vagas abertas: <b>${rows.length}</b></p><ul class="obj-list">${rows.map((r) => `<li class="obj-row"><span class="obj-top"><b>${esc(r.name)}</b><em>${r.left} d restantes</em></span><small>${esc(r.league)}${r.league ? " · " : ""}${esc(r.o.role || "Treinador")} · salário ${money(r.o.salary)}/mês · contrato de ${Math.round((Number(r.o.durationDays) || 730) / 365)} ano(s)</small></li>`).join("")}</ul><div class="fac-act"><button type="button" class="fac-up" data-sm27jb-go>Abrir propostas</button></div>`;
    return `<div class="sm27-dialog-backdrop" data-sm27jb-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Vagas de emprego"><header class="sm27-dialog-head"><span></span><h2>Vagas de emprego</h2><button type="button" class="sm27-dialog-x" data-sm27jb-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body">${body}</div></section>`;
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
    if (t.closest("[data-sm27-jobs]")) { ev.preventDefault(); open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27jb-close]")) { close(); return; }
    if (t.closest("[data-sm27jb-go]")) { close(); setTimeout(() => (doc.querySelector('[data-page="proposals"]') || doc.querySelector('[data-page="market"]'))?.click(), 0); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });
  root.ProLifeSM27Jobs = { open, close, list };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Jobs;
})(typeof window !== "undefined" ? window : globalThis);
