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
    const club = ctx.club, s = ctx.s;
    const all = (club.roster || []).filter((p) => p.status !== "retired").map((p) => info(p, ctx));
    const tabs = `<nav class="sq-subtabs sq-report-tabs" aria-label="Relatórios do plantel">${REPORT_TABS.map(([id, l]) => `<button type="button" data-sm27sq-set="report" data-value="${id}" aria-pressed="${state.report === id}">${l}</button>`).join("")}</nav>`;
    let body = "";
    const empty = (t) => `<p class="sq-empty">${t}</p>`;
    if (state.report === "geral") {
      const avg = (k) => { const v = all.map((r) => r[k]).filter((x) => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
      const payroll = all.reduce((a, r) => a + (r.wage || 0), 0);
      const value = all.reduce((a, r) => a + (r.value || 0), 0);
      const top = [...all].sort((a, b) => (b.ovr ?? 0) - (a.ovr ?? 0)).slice(0, 3);
      const stats = [["Jogadores", all.length], ["GER médio", avg("ovr") ?? "—"], ["Idade média", avg("age") ?? "—"], ["Folha mensal", fmtMoney(payroll)], ["Valor do elenco", fmtMoney(value)], ["Moral média", avg("morale") ?? "—"]];
      const good = [], bad = [];
      const byPos = (g) => all.filter((r) => g.includes(r.pos));
      const mean = (list) => (list.length ? list.reduce((a, r) => a + (r.ovr || 0), 0) / list.length : 0);
      const groups = [["A defesa", byPos(["ZAG", "LD", "LE", "CB", "RB", "LB"])], ["O meio-campo", byPos(["VOL", "MC", "MEI", "ME", "MD", "CDM", "CM", "CAM"])], ["O ataque", byPos(["PE", "PD", "CA", "ATA", "SA", "ST", "LW", "RW"])], ["O gol", byPos(["GOL", "GK"])]];
      const overall = mean(all);
      for (const [label, list] of groups) { if (!list.length) continue; const m = mean(list); (m >= overall + 2 ? good : m <= overall - 3 ? bad : []).push(label); }
      const young = all.filter((r) => (r.age ?? 99) <= 21).length;
      if (young >= 4) good.push(`${young} jogadores com até 21 anos`);
      const old = all.filter((r) => (r.age ?? 0) >= 33).length;
      if (old >= 4) bad.push(`${old} jogadores com 33 anos ou mais`);
      const expiring = all.filter((r) => r.left !== null && r.left <= 180).length;
      if (expiring >= 3) bad.push(`${expiring} contratos terminam em até 6 meses`);
      if (all.length < 22) bad.push("Plantel curto: menos de 22 jogadores");
      if (all.length > 30) bad.push("Plantel grande demais para as vagas de jogo");
      body = `<div class="sq-stat-row">${stats.map(([k, v]) => `<span><small>${k}</small><b>${esc(v)}</b></span>`).join("")}</div>` +
        `<h3 class="sq-h">Destaques</h3><div class="sq-cards">${top.map((r) => card(r)).join("")}</div>` +
        `<div class="sq-notes"><ul class="sq-good">${(good.length ? good : ["Sem pontos fortes claros no momento"]).map((t) => `<li>${esc(t)}</li>`).join("")}</ul><ul class="sq-bad">${(bad.length ? bad : ["Sem pontos fracos claros no momento"]).map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`;
    } else if (state.report === "lesoes") {
      const list = all.filter((r) => r.injured);
      body = list.length ? `<div class="sq-cards">${list.map((r) => card(r, `<span class="sq-card-line bad">Lesionado${num(r.p.injury) > 1 ? " · " + r.p.injury + " dias" : ""}</span>`)).join("")}</div>` : empty("Nenhum jogador lesionado.");
    } else if (state.report === "suspensoes") {
      const list = all.filter((r) => r.suspended);
      body = list.length ? `<div class="sq-cards">${list.map((r) => card(r, `<span class="sq-card-line warn">Suspenso · ${r.p.suspension} jogo(s)</span>`)).join("")}</div>` : empty("Nenhum jogador suspenso.");
    } else if (state.report === "moral") {
      const list = all.filter((r) => r.morale !== null).sort((a, b) => a.morale - b.morale);
      const low = list.filter((r) => r.morale < 50);
      body = `<h3 class="sq-h">Jogadores com moral baixa (${low.length})</h3>` + (low.length ? `<div class="sq-cards">${low.map((r) => card(r, `<span class="sq-card-line bad">Moral ${r.morale}</span>`)).join("")}</div>` : empty("Ninguém com moral baixa.")) +
        `<h3 class="sq-h">Todos, do menor para o maior</h3>` + rosterTable(list, "stats", ctx, false);
    } else if (state.report === "contratos") {
      const list = all.filter((r) => r.left !== null).sort((a, b) => a.left - b.left);
      body = list.length ? `<div class="sq-cards">${list.slice(0, 12).map((r) => card(r, `<span class="sq-card-line ${r.left <= 180 ? "warn" : ""}">Termina em ${leftLabel(r.left)} · ${fmtMoney(r.wage)}/mês</span>`)).join("")}</div>` : empty("Sem dados de contrato.");
    } else if (state.report === "desenvolvimento" || state.report === "juventude") {
      const youthOnly = state.report === "juventude";
      let list = all.filter((r) => (r.age ?? 99) <= (youthOnly ? 21 : 24) && r.pot !== null).sort((a, b) => (b.pot - (b.ovr || 0)) - (a.pot - (a.ovr || 0)));
      body = list.length ? `<div class="sq-cards">${list.map((r) => { const gap = r.pot - (r.ovr || 0); return card(r, `<span class="sq-card-line"><b>GER ${r.ovr ?? "—"}</b> → POT ${r.pot}${gap > 0 ? ` <em class="sq-gain">+${gap}</em>` : ""}</span>`); }).join("")}</div>` : empty(youthOnly ? "Sem jogadores de até 21 anos no plantel." : "Sem jogadores jovens com potencial registrado.");
    }
    return `<section class="sq-panel" aria-label="Relatórios do plantel">${tabs}<div class="sq-report-body">${body}</div></section>`;
  }

  // ---------- ficha do jogador (janela) ----------
  let lastCtx = null;
  let dlg = null;
  let dlgTab = "perfil";
  let dlgId = null;
  const ATTR_LABELS = { finish: "Finalização", pass: "Passe", defense: "Defesa", pace: "Ritmo", shooting: "Finalização", passing: "Passe", dribbling: "Drible", defending: "Defesa", physical: "Físico", stamina: "Resistência", strength: "Força", speed: "Velocidade", vision: "Visão", finishing: "Finalização", tackling: "Desarme", marking: "Marcação", technique: "Técnica", positioning: "Posicionamento", composure: "Calma", reflexes: "Reflexos", handling: "Mãos", crossing: "Cruzamento", heading: "Cabeceio", agility: "Agilidade", jumping: "Impulsão", acceleration: "Aceleração", control: "Controle", longShots: "Chutes de longe", curve: "Efeito", balance: "Equilíbrio", aggression: "Agressividade", workRate: "Ritmo de trabalho", leadership: "Liderança", teamwork: "Trabalho em equipe", concentration: "Concentração", decisions: "Decisão", flair: "Estilo", anticipation: "Antecipação", bravery: "Bravura" };

  function dialogHtml() {
    const p = (lastCtx?.club?.roster || []).find((x) => x.id === dlgId) || lastCtx?.D?.GlobalFootball?.playerById?.(lastCtx.s, dlgId);
    if (!p) return "";
    const r = info(p, lastCtx);
    const [ml, mc] = moraleFace(r.morale);
    const tabs = [["perfil", "Perfil"], ["atributos", "Atributos"], ["contrato", "Contrato"]];
    let body = "";
    if (dlgTab === "atributos") {
      const entries = Object.entries(p.attrs || {}).filter(([, v]) => Number.isFinite(Number(v))).sort((a, b) => b[1] - a[1]);
      body = entries.length ? `<div class="sq-attrs">${entries.map(([k, v]) => `<span><small>${esc(ATTR_LABELS[k] || k)}</small><i style="--w:${Math.max(0, Math.min(100, v))}%"></i><b>${Math.round(v)}</b></span>`).join("")}</div>` : `<p class="sq-empty">Sem atributos registrados.</p>`;
    } else if (dlgTab === "contrato") {
      const rows = [["Salário mensal", fmtMoney(r.wage)], ["Valor de mercado", fmtMoney(r.value)], ["Termina em", leftLabel(r.left)], ["Função no elenco", p.contract?.role || "—"], ["Tipo", p.contract?.type === "loan" ? "Empréstimo" : "Permanente"]];
      body = `<dl class="sq-dl">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
    } else {
      const rows = [["Posição", r.pos], ["Idade", r.age ?? "—"], ["GER", r.ovr ?? "—"], ["Potencial", r.pot ?? "—"], ["Nacionalidade", p.nationality || "—"], ["Condição", r.cond === null ? "—" : r.cond + "%"], ["Moral", ml], ["Gols", r.goals], ["Minutos", r.minutes], ["Situação", r.injured ? "Lesionado" : r.suspended ? "Suspenso" : "Disponível"]];
      body = `<dl class="sq-dl">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd${k === "Moral" ? ` class="${mc}"` : ""}>${esc(v)}</dd></div>`).join("")}</dl>`;
    }
    return `<div class="sm27-dialog-backdrop" data-sm27sq-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="${esc(r.name)}"><header class="sm27-dialog-head"><span></span><h2>${esc(r.name)}</h2><button type="button" class="sm27-dialog-x" data-sm27sq-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs sq-dtabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${dlgTab === id}" data-sm27sq-dtab="${id}">${l}</button>`).join("")}</nav>${body}</div></section>`;
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
      const open = t.closest("[data-sm27sq-open]");
      if (open) { dlgTab = "perfil"; openPlayer(open.dataset.sm27sqOpen); return; }
      if (!dlg) return;
      if (t.closest("[data-sm27sq-close]")) { closePlayer(); return; }
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
    closePlayer();
    if (!ctx?.club) return "";
    return tab === "reports" ? renderReports(ctx) : renderRoster(ctx);
  }

  root.ProLifeSM27Squad = { render, renderTraining, set, state, TABS: [["roster", "Plantel"], ["reports", "Relatórios"]], fmtMoney, leftLabel };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Squad;
})(typeof window !== "undefined" ? window : globalThis);
