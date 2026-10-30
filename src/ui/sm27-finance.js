(function (root) {
  "use strict";
  // PRO LIFE — Finanças: Projeção · Detalhado · Competições · Zona do clube.
  // Lê ProLifeClubFinance.summary e o registro de instalações; não altera nada.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (v) => { const n = Math.round(Number(v) || 0), a = Math.abs(n), sg = n < 0 ? "-" : ""; return a >= 1e9 ? sg + "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi" : a >= 1e6 ? sg + "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi" : a >= 1e3 ? sg + "R$ " + Math.round(a / 1e3) + " mil" : sg + "R$ " + a; };
  let layer = null, tab = "projecao";

  const kv = (rows) => `<ul class="obj-list">${rows.map(([k, v, bad]) => `<li class="obj-row"><span class="obj-top"><b>${esc(k)}</b><em${bad ? ' style="color:#ff9b8a"' : ""}>${esc(v)}</em></span></li>`).join("")}</ul>`;

  function view() {
    const ctx = root.ProLifeSM27Ctx?.();
    const F = root.ProLifeClubFinance;
    if (!ctx?.s || ctx.s.mode !== "coach" || !F?.summary) return `<p class="shd-note">As finanças ficam disponíveis na carreira de treinador.</p>`;
    let sm = null;
    try { sm = F.summary(ctx.s, 6); } catch (e) { sm = null; }
    if (!sm) return `<p class="shd-note">Assine com um clube para ver as finanças.</p>`;
    const L = F.CATEGORIES || {};
    if (tab === "projecao") {
      const net = sm.expectedMonthlyRevenue - sm.monthlyCost, last = sm.lastClose;
      return kv([["Caixa total", money(sm.totalCash)], ["Orçamento de transferências", money(sm.transferBudget)], ["Reserva salarial", money(sm.wageReserve) + " / " + money(sm.reserveCap)], ["Receita mensal esperada", money(sm.expectedMonthlyRevenue)], ["Custo mensal", money(-sm.monthlyCost)], ["Resultado mensal projetado", money(net), net < 0], ["Folha cobre", sm.monthsCovered + " mês(es)", sm.monthsCovered < 3], ["Último fechamento", last ? money(last.result) : "Sem fechamento", last && last.result < 0]]);
    }
    if (tab === "detalhado") {
      if (!sm.months.length) return `<p class="shd-note">O primeiro fechamento mensal ainda não aconteceu.</p>`;
      return sm.months.map((m) => `<p class="shd-sub">Mês ${m.month} · entradas ${money(m.in)} · saídas ${money(-m.out)}</p>` + kv(Object.entries(m.byCategory).map(([c, v]) => [L[c] || c, money(v), v < 0]))).join("");
    }
    if (tab === "competicoes") {
      const prem = (sm.ledger || []).filter((x) => x.category === "premios");
      return prem.length ? kv(prem.map((x) => [x.label || "Premiação", money(x.amount)])) : `<p class="shd-note">Nenhuma premiação recebida ainda. Prêmios de liga e copas entram aqui.</p>`;
    }
    const D = ctx.D, club = D.club(ctx.s), fx = club ? D.Facilities?.effects(ctx.s, club) : null, log = ctx.s.coachCareer?.facilities?.log || [];
    const rows = [["Receita comercial das instalações", money(fx?.commercialMonthly || 0) + "/mês"], ["Capacidade do estádio", (fx?.stadiumCapacity || sm.capacity || 0).toLocaleString("pt-BR") + " lugares"]];
    for (const x of log.slice(0, 8)) rows.push([`${D.Facilities.DEFS[x.id]?.label || x.id} → nível ${x.level}`, money(-x.cost)]);
    return kv(rows);
  }
  function html() {
    const tabs = [["projecao", "Projeção"], ["detalhado", "Detalhado"], ["competicoes", "Competições"], ["zona", "Zona do clube"]];
    return `<div class="sm27-dialog-backdrop" data-sm27fn-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Finanças"><header class="sm27-dialog-head"><span></span><h2>Finanças</h2><button type="button" class="sm27-dialog-x" data-sm27fn-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs rc-tabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-sm27fn-tab="${id}">${l}</button>`).join("")}</nav>${view()}</div></section>`;
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
    if (t.closest("[data-sm27-finance]")) { ev.preventDefault(); tab = "projecao"; open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27fn-close]")) { close(); return; }
    const tb = t.closest("[data-sm27fn-tab]");
    if (tb) { tab = tb.dataset.sm27fnTab; open(); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });
  root.ProLifeSM27Finance = { open, close };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Finance;
})(typeof window !== "undefined" ? window : globalThis);
