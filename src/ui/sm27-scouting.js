(function (root) {
  "use strict";
  // PRO LIFE — Tarefas do olheiro: resumo das observações em andamento e relatórios concluídos.
  // Usa as missões existentes (coachCareer.scoutingV2); a busca e o início ficam na tela de Transferências.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let layer = null, tab = "andamento";

  function findPlayer(ctx, id) {
    try { return ctx.D.GlobalFootball?.playerById?.(ctx.s, id) || null; } catch (e) { return null; }
  }
  function data() {
    const ctx = root.ProLifeSM27Ctx?.();
    if (!ctx?.s || ctx.s.mode !== "coach") return null;
    const { s, D } = ctx, scout = root.ProLifeCoachScoutingV2;
    const missions = s.coachCareer?.scoutingV2?.missions || [];
    const slots = D.Facilities?.effects(s, D.club(s)).scoutSlots ?? 99;
    const rows = missions.slice().reverse().map((m) => {
      const p = findPlayer(ctx, m.playerId);
      const info = scout?.report?.(s, m.id, p) || null;
      const remaining = Math.max(0, Math.ceil(Number(m.startDay) + Number(m.duration) - Number(s.day)));
      return { m, p, info, remaining, progress: Math.round(Math.max(0, Math.min(1, Number(m.progress) || 0)) * 100) };
    });
    return { rows, slots, level: D.Facilities?.levelOf(s, "scouting") ?? 0 };
  }
  function row(r) {
    const done = r.m.status === "complete", i = r.info;
    const rep = i?.available ? `GER ${i.estimatedOverall.join("–")} · POT ${i.potentialRange.join("–")} · ${i.certainty}% de confiança` : "Relatório indisponível";
    return `<li class="obj-row${done ? " done" : ""}"><span class="obj-top"><b>${esc(r.p?.name || r.m.playerId)}</b><em>${done ? "Concluído" : "Faltam " + r.remaining + " d"}</em></span><span class="obj-bar" aria-hidden="true"><i style="width:${done ? 100 : r.progress}%"></i></span><small>${esc(r.m.region || "")} · ${esc(rep)}</small></li>`;
  }
  function html() {
    const d = data();
    let body;
    if (!d) body = `<p class="shd-note">Os olheiros trabalham na carreira de treinador.</p>`;
    else {
      const active = d.rows.filter((r) => r.m.status === "active"), done = d.rows.filter((r) => r.m.status === "complete");
      const list = tab === "andamento" ? active : done;
      body = `<p class="shd-sub">Observações ativas: <b>${active.length}/${d.slots}</b> · Rede de olheiros nível ${d.level}</p>` +
        (list.length ? `<ul class="obj-list">${list.map(row).join("")}</ul>` : `<p class="shd-note">${tab === "andamento" ? "Nenhuma observação em andamento. Em Transferências, escolha um jogador e use Observar jogador." : "Nenhum relatório concluído ainda."}</p>`) +
        `<div class="fac-act"><button type="button" class="fac-up" data-sm27sc-go>Ir para Transferências</button></div>`;
    }
    const tabs = [["andamento", "Em andamento"], ["relatorios", "Relatórios"]];
    return `<div class="sm27-dialog-backdrop" data-sm27sc-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Olheiros"><header class="sm27-dialog-head"><span></span><h2>Olheiros</h2><button type="button" class="sm27-dialog-x" data-sm27sc-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs sc-tabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-sm27sc-tab="${id}">${l}</button>`).join("")}</nav>${body}</div></section>`;
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
    if (t.closest("[data-sm27-scouts]")) { ev.preventDefault(); tab = "andamento"; open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27sc-close]")) { close(); return; }
    if (t.closest("[data-sm27sc-go]")) { close(); setTimeout(() => doc.querySelector('[data-page="market"]')?.click(), 0); return; }
    const tb = t.closest("[data-sm27sc-tab]");
    if (tb) { tab = tb.dataset.sm27scTab; open(); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });

  root.ProLifeSM27Scouting = { open, close, data };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Scouting;
})(typeof window !== "undefined" ? window : globalThis);
