(function (root) {
  "use strict";
  // PRO LIFE — Elenco: abas "Plantel" (lista Equipe A / Emprestado) e "Relatórios"
  // (Perspetiva geral, Lesões, Suspensões, Moral, Contratos, Desenvolvimento).
  // Só leitura dos dados do jogo: não altera regras nem saves.

  const state = { trainGroup:"main", roster:"A", rosterView:"geral", report:"geral", sort:"pos" };
  const ROSTER_TABS = [["A", "Equipe A"], ["loan", "Emprestado"]];
  const ROSTER_VIEWS = [["geral", "Geral"], ["stats", "Estatísticas"], ["contrato", "Contrato"]];
  const REPORT_TABS = [["geral", "Perspetiva geral"], ["lesoes", "Lesões"], ["suspensoes", "Suspensões"], ["moral", "Moral"], ["contratos", "Contratos"], ["desenvolvimento", "Desenvolvimento"], ["juventude", "Juventude"]];
  const POS_ORDER = { GOL: 0, GK: 0, ZAG: 1, CB: 1, LD: 2, RB: 2, LE: 3, LB: 3, VOL: 4, CDM: 4, MC: 5, CM: 5, MEI: 6, CAM: 6, MD: 7, RM: 7, ME: 8, LM: 8, PD: 9, RW: 9, PE: 10, LW: 10, SA: 11, CA: 12, ATA: 12, ST: 12, CF: 12 };
  const SORTS = [["pos", "Posição"], ["ovr", "GER"], ["age", "Idade"], ["value", "Valor"], ["wage", "Salário"], ["morale", "Moral"], ["end", "Fim do contrato"]];

  const Rep = () => root.ProLifeSM27Reports || (typeof require === "function" ? require("./sm27-reports.js") : null);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);

  function set(key, value) {
    if (key in state) state[key] = value;
  }

  function fmtMoney(v) {
    const n = num(v);
    if (n === null) return "—";
    const a = Math.abs(n);
    if (a >= 1e9) return "R$ " + (n / 1e9).toFixed(2).replace(".", ",") + " bi";
    if (a >= 1e6) return "R$ " + (n / 1e6).toFixed(1).replace(".", ",") + " mi";
    if (a >= 1e3) return "R$ " + Math.round(n / 1e3) + " mil";
    return "R$ " + Math.round(n);
  }

  function info(p, ctx) {
    const D = ctx.D, s = ctx.s;
    const ovr = num(D?.overall?.(p) ?? p.overall ?? p.ovr);
    const pos = String(p.primaryPosition || p.pos || "—").toUpperCase();
    const endDay = num(p.contract?.endDay ?? p.contractEndDay);
    const left = endDay === null ? null : endDay - (num(s?.day) ?? 0);
    return {
      p, id: p.id, name: p.name || "Atleta", pos, ovr, pot: num(p.potential), age: num(p.age),
      value: num(p.marketValue), wage: num(p.contract?.salary ?? p.salary), left,
      morale: num(p.morale), cond: num(p.condition), goals: num(p.goals) ?? 0, minutes: num(p.minutes) ?? 0,
      injured: !!p.injury, suspended: num(p.suspension) > 0, number: p.number ?? ""
    };
  }

  function moraleFace(m) {
    if (m === null) return ["—", "m-na"];
    if (m >= 78) return ["Ótima", "m-good"];
    if (m >= 60) return ["Boa", "m-ok"];
    if (m >= 45) return ["Regular", "m-mid"];
    return ["Baixa", "m-bad"];
  }

  function leftLabel(days) {
    if (days === null) return "—";
    if (days <= 0) return "Expirado";
    if (days < 60) return days + " dias";
    const months = Math.round(days / 30.4);
    if (months < 24) return months + " meses";
    return (days / 365).toFixed(1).replace(".", ",") + " anos";
  }

  function sorted(list) {
    const k = state.sort;
    const by = {
      pos: (a, b) => (POS_ORDER[a.pos] ?? 99) - (POS_ORDER[b.pos] ?? 99) || (b.ovr ?? 0) - (a.ovr ?? 0),
      ovr: (a, b) => (b.ovr ?? 0) - (a.ovr ?? 0),
      age: (a, b) => (a.age ?? 99) - (b.age ?? 99),
      value: (a, b) => (b.value ?? 0) - (a.value ?? 0),
      wage: (a, b) => (b.wage ?? 0) - (a.wage ?? 0),
      morale: (a, b) => (a.morale ?? 0) - (b.morale ?? 0),
      end: (a, b) => (a.left ?? 1e9) - (b.left ?? 1e9)
    }[k] || (() => 0);
    return [...list].sort(by);
  }

  const posChip = (pos) => `<i class="sq-pos sq-pos-${esc(pos)}">${esc(pos)}</i>`;
  const sel = (id) => `data-sm27sq-open="${esc(id)}"`;

  // ---------- Plantel ----------
  function loanedOut(ctx) {
    const s = ctx.s, club = ctx.club;
    const loans = (s?.coachCareer?.loans || []).filter((l) => !l.returned && l.fromClubId === club.id);
    return loans.map((l) => {
      const p = ctx.D?.GlobalFootball?.playerById?.(s, l.playerId);
      return p ? { loan: l, ...info(p, ctx) } : null;
    }).filter(Boolean);
  }

  function rosterTable(rows, view, ctx, isLoan) {
    if (!rows.length) return `<p class="sq-empty">${isLoan ? "Nenhum jogador emprestado no momento." : "Nenhum jogador no plantel."}</p>`;
    const head = view === "stats"
      ? ["Pos", "Nome", "GER", "Gols", "Minutos", "Condição", "Moral"]
      : view === "contrato"
        ? ["Pos", "Nome", "Idade", "Salário", "Valor", "Contrato", "Fim"]
        : ["Pos", "Nome", "GER", "POT", "Idade", "Valor", "Condição", "Moral"];
    const cell = (r) => {
      const [ml, mc] = moraleFace(r.morale);
      const flags = (r.injured ? ' <em class="sq-flag bad" title="Lesionado">LES</em>' : "") + (r.suspended ? ' <em class="sq-flag warn" title="Suspenso">SUS</em>' : "");
      const name = `<td class="sq-name"><b>${esc(r.name)}</b>${flags}</td>`;
      if (view === "stats") return `<td>${posChip(r.pos)}</td>${name}<td>${r.ovr ?? "—"}</td><td>${r.goals}</td><td>${r.minutes}</td><td>${r.cond === null ? "—" : r.cond + "%"}</td><td class="${mc}">${ml}</td>`;
      if (view === "contrato") return `<td>${posChip(r.pos)}</td>${name}<td>${r.age ?? "—"}</td><td>${fmtMoney(r.wage)}</td><td>${fmtMoney(r.value)}</td><td>${esc(r.p.contract?.role || "—")}</td><td>${leftLabel(r.left)}</td>`;
      return `<td>${posChip(r.pos)}</td>${name}<td>${r.ovr ?? "—"}</td><td>${r.pot ?? "—"}</td><td>${r.age ?? "—"}</td><td>${fmtMoney(r.value)}</td><td>${r.cond === null ? "—" : r.cond + "%"}</td><td class="${mc}">${ml}</td>`;
    };
    return `<div class="sq-table-wrap"><table class="sq-table"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr class="sq-row" ${sel(r.id)} tabindex="0">${cell(r)}</tr>`).join("")}</tbody></table></div>`;
  }

  function renderRoster(ctx) {
    const club = ctx.club;
    const all = sorted((club.roster || []).filter((p) => p.status !== "retired").map((p) => info(p, ctx)));
    const loans = loanedOut(ctx);
    const rows = state.roster === "loan" ? sorted(loans) : all;
    const tabs = `<nav class="sq-subtabs" aria-label="Equipes">${ROSTER_TABS.map(([id, label]) => `<button type="button" data-sm27sq-set="roster" data-value="${id}" aria-pressed="${state.roster === id}">${label}${id === "loan" ? ` <i>${loans.length}</i>` : ` <i>${all.length}</i>`}</button>`).join("")}</nav>`;
    const tools = `<div class="sq-tools"><label>Exibir<select data-sm27sq-select="rosterView">${ROSTER_VIEWS.map(([id, l]) => `<option value="${id}"${state.rosterView === id ? " selected" : ""}>${l}</option>`).join("")}</select></label><label>Ordenar<select data-sm27sq-select="sort">${SORTS.map(([id, l]) => `<option value="${id}"${state.sort === id ? " selected" : ""}>${l}</option>`).join("")}</select></label></div>`;
    return `<section class="sq-panel" aria-label="Plantel">${tabs}${tools}${rosterTable(rows, state.rosterView, ctx, state.roster === "loan")}<p class="sq-hint">Toque em um jogador para abrir a ficha completa.</p></section>`;
  }

  // ---------- Relatórios ----------
  function card(r, extra) {
    return `<button type="button" class="sq-card" ${sel(r.id)}><span class="sq-card-top">${posChip(r.pos)}<b>${esc(r.name)}</b></span><span class="sq-card-meta">GER ${r.ovr ?? "—"} · ${r.age ?? "—"} anos</span>${extra || ""}</button>`;
  }

  function renderReports(ctx) {
    const tabs = `<nav class="sq-subtabs sq-report-tabs" aria-label="Relatórios do plantel">${REPORT_TABS.map(([id, l]) => `<button type="button" data-sm27sq-set="report" data-value="${id}" aria-pressed="${state.report === id}">${l}</button>`).join("")}</nav>`;
    const tab = REPORT_TABS.some(([id]) => id === state.report) ? state.report : "geral";
    const body = Rep().render(tab, ctx, { info: (p, c) => info(p, c), fmtMoney, leftLabel, sel });
    return `<section class="sq-panel sq-reports" aria-label="Relatórios do plantel">${tabs}${body}</section>`;
  }

  // ---------- ficha do jogador (janela) ----------
  let lastCtx = null;
  let dlg = null;
  let dlgTab = "perfil";
  let dlgId = null;
  const ATTR_LABELS = { finish: "Finalização", pass: "Passe", defense: "Defesa", pace: "Ritmo", shooting: "Finalização", passing: "Passe", dribbling: "Drible", defending: "Defesa", physical: "Físico", stamina: "Resistência", strength: "Força", speed: "Velocidade", vision: "Visão", finishing: "Finalização", tackling: "Desarme", marking: "Marcação", technique: "Técnica", positioning: "Posicionamento", composure: "Calma", reflexes: "Reflexos", handling: "Mãos", crossing: "Cruzamento", heading: "Cabeceio", agility: "Agilidade", jumping: "Impulsão", acceleration: "Aceleração", control: "Controle", longShots: "Chutes de longe", curve: "Efeito", balance: "Equilíbrio", aggression: "Agressividade", workRate: "Ritmo de trabalho", leadership: "Liderança", teamwork: "Trabalho em equipe", concentration: "Concentração", decisions: "Decisão", flair: "Estilo", anticipation: "Antecipação", bravery: "Bravura" };

  function attrsHtml(p) {
    const entries = Object.entries(p.attrs || {}).filter(([, v]) => Number.isFinite(Number(v))).sort((a, b) => b[1] - a[1]);
    return entries.length ? `<div class="sq-attrs">${entries.map(([k, v]) => `<span><small>${esc(ATTR_LABELS[k] || k)}</small><i style="--w:${Math.max(0, Math.min(100, v))}%"></i><b>${Math.round(v)}</b></span>`).join("")}</div>` : `<p class="sq-empty">Sem atributos registrados.</p>`;
  }
  function statsHtml(p) {
    const keys = [["goals", "Gols"], ["assists", "Assistências"], ["minutes", "Minutos"], ["appearances", "Jogos"], ["yellow", "Cartões amarelos"], ["red", "Cartões vermelhos"], ["avgRating", "Nota média"]];
    const st = { ...(p.stats || {}), ...p };
    const rows = keys.filter(([k]) => Number.isFinite(Number(st[k]))).map(([k, l]) => [l, k === "avgRating" ? Number(st[k]).toFixed(1) : Math.round(st[k])]);
    return rows.length ? `<dl class="sq-dl">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : `<p class="sq-empty">Sem estatísticas registradas.</p>`;
  }
  function compareHtml(p, r) {
    const mates = (lastCtx?.club?.roster || []).filter((x) => x.id !== p.id && x.status !== "retired" && String(x.pos) === String(p.pos));
    const keys = Object.keys(p.attrs || {});
    if (!mates.length || !keys.length) return `<p class="sq-empty">Sem outros jogadores na mesma posição para comparar.</p>`;
    const avg = (k) => mates.reduce((a, m) => a + (num(m.attrs?.[k]) || 0), 0) / mates.length;
    const ovrAvg = Math.round(mates.reduce((a, m) => a + (num(m.ovr ?? m.overall) || 0), 0) / mates.length);
    return `<p class="sq-note">Comparado à média de ${mates.length} jogador(es) do elenco na posição ${esc(p.pos)}.</p><dl class="sq-dl"><div><dt>GER</dt><dd>${esc(r.ovr ?? "—")} <small>(média ${ovrAvg})</small></dd></div>${keys.map((k) => { const d = Math.round((num(p.attrs[k]) || 0) - avg(k)); return `<div><dt>${esc(ATTR_LABELS[k] || k)}</dt><dd>${Math.round((num(p.attrs[k]) || 0))} <small>(${d >= 0 ? "+" : ""}${d})</small></dd></div>`; }).join("")}</dl>`;
  }
  function scoutHtml(p) {
    const rep = (lastCtx?.s?.coachCareer?.scoutingV2?.missions || []).slice().reverse().map((m) => ({ m, i: root.ProLifeCoachScoutingV2?.report?.(lastCtx.s, m.id, p) })).find((x) => x.i?.available);
    return rep ? `<dl class="sq-dl"><div><dt>GER estimado</dt><dd>${rep.i.estimatedOverall.join("–")}</dd></div><div><dt>POT estimado</dt><dd>${rep.i.potentialRange.join("–")}</dd></div><div><dt>Confiança</dt><dd>${rep.i.certainty}%</dd></div><div><dt>Situação</dt><dd>${rep.m.status === "complete" ? "Relatório final" : "Em observação"}</dd></div></dl>` : `<p class="sq-empty">Nenhum relatório de olheiro para este jogador. Inicie uma observação em Transferências.</p>`;
  }

  function dialogHtml() {
    const p = (lastCtx?.club?.roster || []).find((x) => x.id === dlgId) || lastCtx?.D?.GlobalFootball?.playerById?.(lastCtx.s, dlgId);
    if (!p || !Rep()) return "";
    return Rep().ficha(lastCtx, p, dlgTab, { info, fmtMoney, leftLabel, moraleFace, esc, sel, attrsHtml, statsHtml, compareHtml, scoutHtml });
  }

  function openPlayer(id) {
    if (!root.document) return;
    dlgId = id;
    if (!dlg) {
      dlg = root.document.createElement("div");
      dlg.className = "sm27-dialog-layer";
      root.document.body.appendChild(dlg);
    }
    dlg.innerHTML = dialogHtml();
    dlg.querySelector(".sm27-dialog-x")?.focus({ preventScroll: true });
  }
  function closePlayer() { if (dlg) { dlg.remove(); dlg = null; } }

  if (root.document) {
    root.document.addEventListener("click", (ev) => {
      const t = ev.target instanceof Element ? ev.target : null;
      if (!t) return;
      const R = root.ProLifeSM27Reports?.ui || {};
      const edit = t.closest("[data-sm27sq-edit-contract]");
      if (edit) { R.actions = false; R.renew = true; dlgTab = "contrato"; openPlayer(edit.dataset.sm27sqEditContract); return; }
      const open = t.closest("[data-sm27sq-open]");
      if (open) { R.actions = false; R.renew = false; dlgTab = "perfil"; openPlayer(open.dataset.sm27sqOpen); return; }
      if (!dlg) return;
      if (t.closest("[data-sm27sq-actions]")) { R.actions = !R.actions; openPlayer(dlgId); return; }
      if (t.closest("[data-sm27sq-renew]")) { R.actions = false; R.renew = true; dlgTab = "contrato"; openPlayer(dlgId); return; }
      if (t.closest("[data-sm27sq-renew-cancel]")) { R.renew = false; openPlayer(dlgId); return; }
      if (t.closest("[data-coach-renew-confirm]")) root.setTimeout(() => { R.renew = false; if (dlg) openPlayer(dlgId); }, 60);
      if (t.closest(".rp-menu button[data-coach-player-status],.rp-menu button[data-coach-player-release]")) R.actions = false;
      if (t.closest("[data-sm27sq-close]")) { R.actions = false; R.renew = false; closePlayer(); return; }
      const dt = t.closest("[data-sm27sq-dtab]");
      if (dt) { dlgTab = dt.dataset.sm27sqDtab; openPlayer(dlgId); }
    });
    root.document.addEventListener("keydown", (ev) => {
      if (dlg && ev.key === "Escape") { closePlayer(); return; }
      const row = ev.target instanceof Element ? ev.target.closest("tr[data-sm27sq-open]") : null;
      if (row && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); dlgTab = "perfil"; openPlayer(row.dataset.sm27sqOpen); }
    });
  }

  // ---------- Treino: jogadores e resumo (leitura) ----------
  function renderTraining(ctx) {
    const club = ctx?.club;
    if (!club) return "";
    const all = (club.roster || []).filter((p) => p.status !== "retired").map((p) => info(p, ctx));
    const group = state.trainGroup === "youth" ? "youth" : "main";
    const list = (group === "youth" ? all.filter((r) => (r.age ?? 99) <= 21) : all).sort((a, b) => (POS_ORDER[a.pos] ?? 99) - (POS_ORDER[b.pos] ?? 99) || (b.ovr ?? 0) - (a.ovr ?? 0));
    const count = (fn) => all.filter(fn).length;
    const sum = [
      ["Em evolução", count((r) => (r.age ?? 99) <= 24 && (r.pot ?? 0) - (r.ovr ?? 0) >= 3)],
      ["Em boa condição", count((r) => (r.cond ?? 0) >= 85)],
      ["Cansados", count((r) => r.cond !== null && r.cond < 60)],
      ["Moral baixa", count((r) => r.morale !== null && r.morale < 50)],
      ["Lesionados", count((r) => r.injured)],
      ["Em declínio", count((r) => (r.age ?? 0) >= 33)]
    ];
    const focusLabel = { equilibrado: "Equilibrado", velocidade: "Velocidade", finalizacao: "Finalização", criacao: "Criação", marcacao: "Marcação", fisico: "Físico" };
    const rows = list.map((r) => {
      const [ml, mc] = moraleFace(r.morale);
      const gap = r.pot !== null && r.ovr !== null ? r.pot - r.ovr : null;
      return `<tr class="sq-row" data-sm27sq-open="${esc(r.id)}" tabindex="0"><td>${posChip(r.pos)}</td><td class="sq-name"><b>${esc(r.name)}</b></td><td>${r.ovr ?? "—"}</td><td>${gap !== null && gap > 0 ? `<em class="sq-gain">+${gap}</em>` : "—"}</td><td>${r.cond === null ? "—" : r.cond + "%"}</td><td class="${mc}">${ml}</td><td>${esc(focusLabel[r.p.developmentPlan?.focus] || "—")}</td></tr>`;
    }).join("");
    return `<section class="sq-panel sq-training" aria-label="Jogadores em treino"><div class="sq-train-head"><nav class="sq-subtabs" aria-label="Grupo">${[["main", "Equipe principal"], ["youth", "Juventude (até 21)"]].map(([id, l]) => `<button type="button" data-sm27sq-set="trainGroup" data-value="${id}" aria-pressed="${group === id}">${l}</button>`).join("")}</nav></div><div class="sq-stat-row">${sum.map(([k, v]) => `<span><small>${k}</small><b>${v}</b></span>`).join("")}</div>${rows ? `<div class="sq-table-wrap"><table class="sq-table"><thead><tr><th>Pos</th><th>Jogador</th><th>GER</th><th>Evolução</th><th>Condição</th><th>Moral</th><th>Foco</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="sq-empty">Nenhum jogador neste grupo.</p>`}</section>`;
  }

  function render(tab, ctx) {
    lastCtx = ctx;
    const keepId = dlg ? dlgId : null;
    closePlayer();
    if (keepId && root.document) root.setTimeout(() => { if ((lastCtx?.club?.roster || []).some((x) => x.id === keepId && x.status !== "retired")) openPlayer(keepId); }, 0);
    if (!ctx?.club) return "";
    return tab === "reports" ? renderReports(ctx) : renderRoster(ctx);
  }

  // Abre a ficha de qualquer jogador (ex.: pelo Mercado), sem depender da tela do Plantel.
  function openPlayerFor(c, id) {
    const s = c?.s; if (!s || !id) return;
    lastCtx = { s, D: c.D, club: c.D?.club?.(s) || lastCtx?.club };
    dlgTab = "perfil"; openPlayer(id);
  }

  root.ProLifeSM27Squad = { openPlayerFor, render, renderTraining, set, state, TABS: [["roster", "Plantel"], ["reports", "Relatórios"]], fmtMoney, leftLabel };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Squad;
})(typeof window !== "undefined" ? window : globalThis);
