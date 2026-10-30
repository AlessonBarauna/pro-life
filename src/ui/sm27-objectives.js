(function (root) {
  "use strict";
  // PRO LIFE — Objetivos (Diário · Época · Clube). Metas derivadas dos dados reais do jogo,
  // sem moeda nem recompensas novas e sem gravar nada no save.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  let layer = null, tab = "diario";

  function money(v) {
    const n = num(v), a = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (a >= 1e9) return sign + "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi";
    if (a >= 1e6) return sign + "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi";
    if (a >= 1e3) return sign + "R$ " + Math.round(a / 1e3) + " mil";
    return sign + "R$ " + Math.round(a);
  }

  // cada meta: {label, now, target, text, done, lowerBetter}
  function build() {
    const ctx = root.ProLifeSM27Ctx?.();
    if (!ctx?.s) return null;
    const { s, D } = ctx;
    const club = D?.club?.(s);
    if (!club) return null;
    const roster = (club.roster || []).filter((p) => p.status !== "retired");
    const avg = (k, d) => (roster.length ? roster.reduce((a, p) => a + num(p[k], d), 0) / roster.length : 0);
    const cond = Math.round(avg("condition", 100)), mor = Math.round(avg("morale", 60));
    const injured = roster.filter((p) => p.injury).length;
    const susp = roster.filter((p) => num(p.suspension) > 0).length;
    const ending = roster.filter((p) => { const e = num(p.contract?.endDay ?? p.contractEndDay, NaN); return Number.isFinite(e) && e - num(s.day) <= 180; }).length;
    const ovr = (p) => num(D?.overall?.(p) ?? p.overall ?? p.ovr);
    const starters = [...roster].sort((a, b) => ovr(b) - ovr(a)).slice(0, 11);
    const diario = [
      { label: "Manter a condição média do elenco em 80% ou mais", now: cond, target: 80, text: cond + "% / 80%" },
      { label: "Manter a moral média em 60 ou mais", now: mor, target: 60, text: mor + " / 60" },
      { label: "Ter no máximo 2 jogadores lesionados", now: Math.max(0, 2 - injured + 2), target: 4, text: injured + " lesionado(s)", done: injured <= 2 },
      { label: "Não ter jogadores suspensos", now: susp === 0 ? 1 : 0, target: 1, text: susp + " suspenso(s)", done: susp === 0 },
      { label: "Renovar ou decidir contratos que vencem em 6 meses", now: ending === 0 ? 1 : 0, target: 1, text: ending + " contrato(s) a vencer", done: ending === 0 }
    ];
    const stats = club.stats || {};
    const played = num(stats.played ?? stats.matches);
    const wins = num(stats.wins);
    const points = num(stats.points);
    const epoca = [];
    const goals = s.coachCareer?.goals;
    if (s.mode === "coach" && goals?.items?.length) {
      for (const g of goals.items) {
        const p = g.progress;
        if (g.kind === "posicao") epoca.push({ label: g.label, now: p === null || p === undefined ? 0 : Math.max(0, num(goals.leagueSize, 20) - num(p) + 1), target: Math.max(1, num(goals.leagueSize, 20) - num(g.target, 1) + 1), text: p ? "Posição atual: " + p + "º (meta: " + g.target + "º ou melhor)" : "Sem jogos disputados", done: g.status === "cumprido" || (p && num(p) <= num(g.target)) });
        else if (g.kind === "orcamento") epoca.push({ label: g.label, now: num(p) >= 0 ? 1 : 0, target: 1, text: "Orçamento: " + money(p), done: num(p) >= 0 });
        else if (g.kind === "vestiario") epoca.push({ label: g.label, now: num(p), target: num(g.target, 60), text: num(p) + " / " + num(g.target, 60), done: num(p) >= num(g.target, 60) });
      }
    }
    epoca.push({ label: "Vencer 5 jogos na temporada", now: wins, target: 5, text: wins + " / 5" });
    epoca.push({ label: "Somar 30 pontos na liga", now: points, target: 30, text: points + " / 30" });
    epoca.push({ label: "Disputar 10 jogos na temporada", now: played, target: 10, text: played + " / 10" });
    const rep = num(s.reputation);
    const budget = num(club.budget);
    const youngTalents = roster.filter((p) => num(p.age, 99) <= 21 && num(p.potential) >= 75).length;
    const clube = [
      { label: "Ter orçamento de transferências positivo", now: budget >= 0 ? 1 : 0, target: 1, text: money(budget), done: budget >= 0 },
      { label: "Formar um time titular com GER médio 70 ou mais", now: Math.round(starters.reduce((a, p) => a + ovr(p), 0) / Math.max(1, starters.length)), target: 70, text: "GER médio dos titulares: " + Math.round(starters.reduce((a, p) => a + ovr(p), 0) / Math.max(1, starters.length)) },
      { label: "Ter 3 jovens (até 21 anos) com potencial 75 ou mais", now: youngTalents, target: 3, text: youngTalents + " / 3" },
      { label: "Chegar a 80 de reputação do treinador", now: rep, target: 80, text: rep + " / 80" }
    ];
    return { diario, epoca, clube };
  }

  function row(g) {
    const done = g.done ?? g.now >= g.target;
    const pct = Math.max(0, Math.min(100, Math.round((g.now / Math.max(1, g.target)) * 100)));
    return `<li class="obj-row${done ? " done" : ""}"><span class="obj-top"><b>${esc(g.label)}</b><em>${done ? "Cumprido" : "Em andamento"}</em></span><span class="obj-bar" aria-hidden="true"><i style="width:${done ? 100 : pct}%"></i></span><small>${esc(g.text)}</small></li>`;
  }

  function html() {
    const d = build();
    const tabs = [["diario", "Diário"], ["epoca", "Época"], ["clube", "Clube"]];
    let body;
    if (!d) body = `<p class="shd-note">Objetivos disponíveis com um clube em carreira.</p>`;
    else {
      const list = d[tab] || [];
      const done = list.filter((g) => g.done ?? g.now >= g.target).length;
      body = `<p class="shd-sub">Cumpridos: ${done} / ${list.length}</p><ul class="obj-list">${list.map(row).join("")}</ul>`;
    }
    return `<div class="sm27-dialog-backdrop" data-sm27obj-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Objetivos"><header class="sm27-dialog-head"><span></span><h2>Objetivos</h2><button type="button" class="sm27-dialog-x" data-sm27obj-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs obj-tabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-sm27obj-tab="${id}">${l}</button>`).join("")}</nav>${body}</div></section>`;
  }

  function open() {
    if (!layer) {
      layer = doc.createElement("div");
      layer.className = "sm27-dialog-layer";
      doc.body.appendChild(layer);
      doc.body.classList.remove("sm27-menu-open");
    }
    layer.innerHTML = html();
    layer.querySelector(".sm27-dialog-x")?.focus({ preventScroll: true });
  }
  function close() { if (layer) { layer.remove(); layer = null; } }

  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest("[data-sm27-objectives]")) { ev.preventDefault(); tab = "diario"; open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27obj-close]")) { close(); return; }
    const tb = t.closest("[data-sm27obj-tab]");
    if (tb) { tab = tb.dataset.sm27objTab; open(); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });

  root.ProLifeSM27Objectives = { build, open, close };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Objectives;
})(typeof window !== "undefined" ? window : globalThis);
