(function (root) {
  "use strict";
  // PRO LIFE — Vagas de emprego: propostas de clubes abertas para o treinador.
  // As propostas são as do próprio jogo (s.offers); aceitar/negociar continua na tela de Propostas.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (t?.closest("[data-sm27-jobs]")) { ev.preventDefault(); doc.body.classList.remove("sm27-menu-open"); root.ProLifeCoachArea?.go("vagas"); }
  }, true);
  root.ProLifeSM27Jobs = { open: () => root.ProLifeCoachArea?.go("vagas"), close() {}, list };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Jobs;
})(typeof window !== "undefined" ? window : globalThis);
