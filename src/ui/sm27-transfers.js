(function (root) {
  "use strict";
  // PRO LIFE — Transferências do clube: Lista Preferencial · Comprados · Vendidos · Empréstimos.
  // Só leitura, a partir de coachCareer.shortlist/loans e do registro de transferências do save.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (v) => { const n = Number(v) || 0; return n >= 1e6 ? "R$ " + (n / 1e6).toFixed(1).replace(".", ",") + " mi" : n >= 1e3 ? "R$ " + Math.round(n / 1e3) + " mil" : n > 0 ? "R$ " + Math.round(n) : "Livre"; };
  let layer = null, tab = "lista";

  function gather() {
    const ctx = root.ProLifeSM27Ctx?.();
    if (!ctx?.s || ctx.s.mode !== "coach") return null;
    const { s, D } = ctx, club = D.club(s);
    if (!club) return { s, none: true };
    const G = D.GlobalFootball;
    const player = (id) => { try { return G?.playerById?.(s, id) || null; } catch (e) { return null; } };
    const clubName = (id) => { try { return (G?.clubById?.(s, id) || D.club(s, id))?.name || String(id); } catch (e) { return String(id); } };
    const transfers = (s.extras?.transfers || []).filter((t) => t && t.player);
    const bought = transfers.filter((t) => t.to === club.name && t.transferType !== "loan").map((t) => ({ title: t.player, sub: `${t.pos || "—"} · de ${t.from} · ${money(t.fee)}`, when: t.season }));
    const sold = transfers.filter((t) => t.from === club.name && t.transferType !== "loan").map((t) => ({ title: t.player, sub: `${t.pos || "—"} · para ${t.to} · ${money(t.fee)}`, when: t.season }));
    const shortlist = (s.coachCareer?.shortlist || []).slice().reverse().map((e) => { const p = player(e.playerId); return { title: p?.name || String(e.playerId), sub: `${p?.pos || "—"} · GER ${p?.ovr ?? p?.overall ?? "—"} · ${clubName(e.clubId)}`, when: "" }; });
    const loans = (s.coachCareer?.loans || []).filter((l) => !l.returned);
    const mk = (l, incoming) => { const p = player(l.playerId); return { title: p?.name || String(l.playerId), sub: `${p?.pos || "—"} · ${incoming ? "de " + clubName(l.fromClubId) : "para " + clubName(l.toClubId)}`, when: "" }; };
    return { s, lista: shortlist, comprados: bought, vendidos: sold, entradas: loans.filter((l) => l.toClubId === club.id).map((l) => mk(l, true)), saidas: loans.filter((l) => l.fromClubId === club.id).map((l) => mk(l, false)) };
  }
  const EMPTY = { lista: "Sua lista está vazia. Adicione jogadores pela busca em Transferências.", comprados: "Nenhuma contratação registrada.", vendidos: "Nenhuma venda registrada.", entradas: "Nenhum jogador emprestado ao seu clube.", saidas: "Nenhum jogador seu emprestado." };
  const TABS = [["lista", "Lista"], ["comprados", "Comprados"], ["vendidos", "Vendidos"], ["entradas", "Entradas"], ["saidas", "Saídas"]];

  function html() {
    const g = gather();
    let body;
    if (!g) body = `<p class="shd-note">Disponível na carreira de treinador.</p>`;
    else if (g.none) body = `<p class="shd-note">Assine com um clube para ver as transferências.</p>`;
    else {
      const list = g[tab] || [];
      body = list.length ? `<ul class="obj-list">${list.slice(0, 60).map((r) => `<li class="obj-row"><span class="obj-top"><b>${esc(r.title)}</b><em>${esc(r.when)}</em></span><small>${esc(r.sub)}</small></li>`).join("")}</ul>` : `<p class="shd-note">${EMPTY[tab]}</p>`;
      if (tab === "entradas" || tab === "saidas") body = `<p class="shd-sub">Empréstimos ${tab === "entradas" ? "recebidos" : "cedidos"}</p>` + body;
    }
    return `<div class="sm27-dialog-backdrop" data-sm27tr-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Transferências do clube"><header class="sm27-dialog-head"><span></span><h2>Transferências</h2><button type="button" class="sm27-dialog-x" data-sm27tr-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs tr-tabs" role="tablist">${TABS.map(([id, l]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-sm27tr-tab="${id}">${l}</button>`).join("")}</nav>${body}</div></section>`;
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
    if (t.closest("[data-sm27-transfers]")) { ev.preventDefault(); tab = "lista"; open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27tr-close]")) { close(); return; }
    const tb = t.closest("[data-sm27tr-tab]");
    if (tb) { tab = tb.dataset.sm27trTab; open(); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });
  root.ProLifeSM27Transfers = { open, close, gather };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Transfers;
})(typeof window !== "undefined" ? window : globalThis);
