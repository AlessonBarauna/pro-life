(function (root) {
  "use strict";
  // PRO LIFE — Elenco > Relatórios (7 abas) e ficha do jogador no formato FC27.
  // Só lê dados do jogo; as ações da ficha usam os comandos que já existem no app.
  const ui = { actions: false, renew: false };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  const hash = (str) => { let h = 7; for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const tier = (n) => (n >= 85 ? "t-gold" : n >= 75 ? "t-lime" : n >= 65 ? "t-blue" : "t-grey");

  function injuryType(p, s) {
    const d = num(p.injury) || 0;
    const pool = d <= 7 ? ["Pancada", "Lesão muscular leve", "Entorse leve"] : d <= 21 ? ["Lesão muscular", "Lesão no tornozelo", "Lesão na virilha"] : d <= 60 ? ["Lesão no joelho", "Lesão na coxa", "Fratura por estresse"] : ["Ruptura de ligamento", "Fratura"];
    return pool[hash(p.id + ":" + ((num(s?.day) || 0) + d)) % pool.length];
  }

  const avatar = '<svg viewBox="0 0 48 56" aria-hidden="true"><circle cx="24" cy="18" r="10" fill="#5a6c78"/><path d="M4 56c0-14 9-22 20-22s20 8 20 22z" fill="#dfe6ea"/></svg>';

  function card(r, ctx, h, big) {
    return `<button type="button" class="rp-card${big ? " is-big" : ""}" ${h.sel(r.id)}><span class="rp-av">${avatar}</span><span class="rp-info"><b class="rp-nm">${esc(r.name)}</b><span class="rp-cl" data-keep-text>${esc(ctx.club?.name || "")}</span><span class="rp-st"><span><small>IDADE</small><b>${r.age ?? "—"}</b></span><i class="rp-ger ${tier(r.ovr || 0)}">${r.ovr ?? "—"}</i><span><small>POS</small><b class="rp-pos">${esc(r.pos)}</b></span></span></span></button>`;
  }
  const row = (r, ctx, h, icon, cls, text, extra) => `<div class="rp-row">${card(r, ctx, h)}<i class="rp-ic ${cls}">${icon}</i><p class="rp-tx">${text}</p>${extra || ""}</div>`;
  const empty = (t) => `<p class="rp-empty">${t}</p>`;
  const dateOf = (ctx, day) => (typeof ctx.dayDate === "function" ? ctx.dayDate(day) : "");

  function strengths(all) {
    const ok = [], no = [];
    const mean = (l) => (l.length ? l.reduce((a, r) => a + (r.ovr || 0), 0) / l.length : 0);
    const by = (g) => all.filter((r) => g.includes(r.pos));
    const overall = mean(all);
    const groups = [["A defesa", by(["ZAG", "LD", "LE", "CB", "RB", "LB"])], ["O meio-campo", by(["VOL", "MC", "MEI", "ME", "MD", "CDM", "CM", "CAM"])], ["O ataque", by(["PE", "PD", "CA", "ATA", "SA", "ST", "LW", "RW"])], ["O gol", by(["GOL", "GK"])]];
    for (const [label, list] of groups) {
      if (!list.length) continue;
      const m = mean(list);
      if (m >= overall + 2) ok.push(`${label} é uma área forte do plantel.`);
      else if (m <= overall - 3) no.push(`${label} é uma área fraca.`);
    }
    const young = all.filter((r) => (r.age ?? 99) <= 21).length;
    if (young >= 4) ok.push(`${young} jogadores com até 21 anos no elenco.`);
    const old = all.filter((r) => (r.age ?? 0) >= 33).length;
    if (old >= 4) no.push(`${old} jogadores com 33 anos ou mais.`);
    const exp = all.filter((r) => r.left !== null && r.left <= 180).length;
    if (exp >= 3) no.push(`${exp} contratos terminam em até 6 meses.`);
    if (all.length < 22) no.push("Plantel curto: menos de 22 jogadores.");
    else if (all.length > 30) no.push("Plantel grande demais para as vagas de jogo.");
    else ok.push("O plantel tem um tamanho administrável.");
    const top = [...all].sort((a, b) => (b.ovr || 0) - (a.ovr || 0)).slice(0, 3);
    if (top.length === 3 && top[2].ovr >= 80) ok.push("O elenco tem craques de nível mundial.");
    return { ok, no };
  }

  function moraleReasons(r, ctx, inXI, median) {
    const out = [];
    if (r.left !== null && r.left <= 180) out.push("Contrato termina em menos de 6 meses.");
    if (!inXI && (r.ovr || 0) >= median) out.push("Quer mais tempo de jogo.");
    if (r.injured) out.push("Frustrado com a lesão.");
    if ((r.cond ?? 100) < 50) out.push("Está cansado.");
    return out.length ? out : ["Insatisfeito com os resultados recentes."];
  }

  function render(tab, ctx, h) {
    const club = ctx.club, s = ctx.s;
    const all = (club.roster || []).filter((p) => p.status !== "retired").map((p) => h.info(p, ctx));
    const xi = new Set((club.lineup || []).map(String));
    let body = "";
    if (tab === "geral") {
      const best = [...all].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
      const avg = (l) => (l.length ? Math.round(l.reduce((a, b) => a + b, 0) / l.length) : null);
      const rating = avg(best.slice(0, 18).map((r) => r.ovr || 0));
      const vals = all.map((r) => r.value || 0);
      const { ok, no } = strengths(all);
      body = `<div class="rp-kpis"><span><small>Classificação média</small><i class="rp-ger big ${tier(rating || 0)}">${rating ?? "—"}</i></span><span><small>Tamanho do plantel</small><b>${all.length}</b></span><span><small>Média etária</small><b>${avg(all.map((r) => r.age || 0)) ?? "—"}</b></span><span><small>Valor médio</small><b>${h.fmtMoney(avg(vals))}</b></span><span><small>Valor total</small><b>${h.fmtMoney(vals.reduce((a, b) => a + b, 0))}</b></span></div>` +
        `<div class="rp-top3">${best.slice(0, 3).map((r) => card(r, ctx, h)).join("")}</div>` +
        `<ul class="rp-checks">${ok.map((t) => `<li><i class="ok">✔</i>${esc(t)}</li>`).join("")}${no.map((t) => `<li><i class="no">✖</i>${esc(t)}</li>`).join("")}${ok.length + no.length ? "" : "<li>Sem pontos fortes ou fracos claros agora.</li>"}</ul>`;
    } else if (tab === "lesoes") {
      const list = all.filter((r) => r.injured).sort((a, b) => num(b.p.injury) - num(a.p.injury));
      body = list.length ? list.map((r) => { const d = num(r.p.injury) || 1; return row(r, ctx, h, "✚", "red", `${esc(injuryType(r.p, s))} — volta em ${d} dia${d === 1 ? "" : "s"} <small>(${esc(dateOf(ctx, (num(s.day) || 0) + d))})</small>`); }).join("") : empty("Sem dados: nenhum jogador lesionado.");
    } else if (tab === "suspensoes") {
      const list = all.filter((r) => r.suspended).sort((a, b) => num(b.p.suspension) - num(a.p.suspension));
      body = list.length ? list.map((r) => { const n = num(r.p.suspension); return row(r, ctx, h, "▮", "amb", `Suspenso — perde ${n} jogo${n === 1 ? "" : "s"}`); }).join("") : empty("Sem dados: ninguém suspenso agora.");
    } else if (tab === "moral") {
      const median = [...all].map((r) => r.ovr || 0).sort((a, b) => a - b)[Math.floor(all.length / 2)] || 0;
      const low = all.filter((r) => r.morale !== null && r.morale < 50).sort((a, b) => a.morale - b.morale);
      body = low.length ? low.map((r) => row(r, ctx, h, "✖", "red", `${moraleReasons(r, ctx, xi.has(String(r.id)), median).map(esc).join(" ")} <b class="rp-open">Não resolvido.</b> <small>(moral ${r.morale})</small>`)).join("") : empty("Sem dados: ninguém com moral baixa.");
    } else if (tab === "contratos") {
      const list = all.filter((r) => r.left !== null).sort((a, b) => a.left - b.left);
      body = list.length ? list.map((r) => { const y = Math.max(0, r.left) / 365, mo = Math.round(r.left / 30.4); const label = r.left <= 0 ? "Expirado" : y < 1 ? `${Math.max(1, mo)} ${mo <= 1 ? "mês" : "meses"}` : `${Math.round(y)} ano${Math.round(y) === 1 ? "" : "s"}`; return row(r, ctx, h, "", "", `${label} <small>(${esc(dateOf(ctx, (num(s.day) || 0) + r.left))}) · ${esc(h.fmtMoney(r.wage))}/mês</small>`, `<button type="button" class="rp-ic lim" data-sm27sq-edit-contract="${esc(r.id)}" aria-label="Editar contrato de ${esc(r.name)}">✎</button>`).replace('<i class="rp-ic "></i>', ""); }).join("") : empty("Sem dados de contrato.");
    } else if (tab === "desenvolvimento") {
      const list = all.filter((r) => (r.age ?? 99) <= 23 && r.pot !== null && !r.p.academy).sort((a, b) => (b.pot - (b.ovr || 0)) - (a.pot - (a.ovr || 0)));
      body = list.length ? list.map((r) => devRow(r, ctx, h)).join("") : empty("Sem dados: nenhum jogador de até 23 anos no elenco principal.");
    } else if (tab === "juventude") {
      const kids = (ctx.D?.GlobalFootball?.playersByClub?.(s, s.clubId) || []).filter((p) => p.academy && p.status !== "retired" && p.active !== false).map((p) => h.info(p, ctx)).sort((a, b) => (b.pot || 0) - (a.pot || 0));
      body = kids.length ? kids.map((r) => devRow(r, ctx, h)).join("") : empty("Sua base ainda não tem jovens. Quando houver, eles aparecem aqui com avaliação, progresso e potencial.");
    }
    return `<div class="rp-body" data-rp-tab="${esc(tab)}">${body}</div>`;
  }

  function devRow(r, ctx, h) {
    const pot = r.pot || r.ovr || 0, ovr = r.ovr || 0, gap = pot - ovr;
    const pct = pot ? Math.max(4, Math.min(100, Math.round((ovr / pot) * 100))) : 0;
    return `<div class="rp-row rp-dev">${card(r, ctx, h)}<span class="rp-col"><small>Avaliação de base</small><i class="rp-ger ${tier(ovr)}">${ovr}</i></span><span class="rp-col"><small>Progresso até o potencial</small><span class="rp-prog"><i class="rp-ger sm ${tier(ovr)}">${ovr}</i><span class="rp-bar"><i style="width:${pct}%"></i></span><i class="rp-ger sm t-lime">${pot}</i></span></span><span class="rp-col"><small>Em desenvolvimento</small><b class="rp-arrow ${gap > 0 ? "up" : "flat"}">${gap > 0 ? "⬆" : "➡"}</b></span><span class="rp-col"><small>Potencial</small><b class="rp-potv">${gap > 0 ? `+${gap}` : "no teto"}</b></span></div>`;
  }

  // ---------- ficha ----------
  function chemistry(p, ctx, r) {
    const mates = (ctx.club?.roster || []).filter((x) => x.id !== p.id && x.status !== "retired");
    const sameNat = mates.filter((x) => x.nationality && x.nationality === p.nationality).length;
    const sameLine = mates.filter((x) => String(x.pos) === String(p.pos)).length;
    const v = Math.round(Math.max(10, Math.min(100, 40 + Math.min(5, sameNat) * 4 + Math.min(3, sameLine) * 3 + ((r.morale ?? 60) - 50) / 4)));
    return [v, v >= 70 ? "Alta" : v >= 45 ? "Média" : "Baixa"];
  }

  function interested(p, s) {
    try { return Number(root.ProLifeTransferRulesV2?.interestedCount?.(p, s)) || 0; } catch (_) { return 0; }
  }

  function ficha(ctx, p, tab, h) {
    const s = ctx.s, r = h.info(p, ctx), coach = s?.mode === "coach";
    const own = coach && p.id !== "hero" && String(p.clubId || ctx.club?.id) === String(ctx.club?.id);
    const prefs = s?.coachCareer?.offerPreferences || {};
    const has = (k) => (prefs[k] || []).includes(p.id);
    const status = has("blockedIds") ? "blocked" : has("listedIds") ? "listed" : has("loanListedIds") ? "loan_listed" : "available";
    const [ml, mc] = h.moraleFace(r.morale);
    const resting = Number(p.restUntil) > Number(s?.day);
    const months = r.left === null ? 0 : Math.min(12, Math.max(0, Math.ceil(Number(r.left) / 30)));
    const cost = Math.max(0, Math.round(Number(r.wage) || 0)) * months;
    const tabs = [["perfil", "Perfil"], ["atributos", "Atributos"], ["estatisticas", "Estatísticas"], ["contrato", "Contrato"], ["comparar", "Comparar"], ["olheiro", "Olheiro"]];
    const left = `<aside class="rp-left">${card(r, ctx, h, true)}<dl class="rp-kv"><div><dt>Posições</dt><dd>${esc([r.pos, ...(p.secondaryPositions || [])].slice(0, 3).join(", "))}</dd></div><div><dt>Valor</dt><dd>${esc(h.fmtMoney(r.value))}</dd></div><div><dt>Idade</dt><dd>${r.age ?? "—"}</dd></div><div><dt>Salário</dt><dd>${esc(h.fmtMoney(r.wage))}/mês</dd></div><div><dt>Contrato</dt><dd>${esc(h.leftLabel(r.left))}</dd></div><div><dt>Nacionalidade</dt><dd>${esc(p.nationality || "—")}</dd></div></dl>${own ? `<button type="button" class="rp-act-btn" data-sm27sq-actions aria-expanded="${ui.actions}">Ações</button>` : ""}</aside>`;
    let main = "";
    if (tab === "atributos") main = h.attrsHtml(p);
    else if (tab === "estatisticas") main = h.statsHtml(p);
    else if (tab === "comparar") main = h.compareHtml(p, r);
    else if (tab === "olheiro") main = h.scoutHtml(p);
    else if (tab === "contrato") main = contractHtml(p, r, h, own);
    else {
      const [chem, chemL] = chemistry(p, ctx, r);
      const inXI = (ctx.club?.lineup || []).map(String).includes(String(p.id));
      const susp = num(p.suspension) || 0;
      const state = r.injured ? "Lesionado" : susp ? "Suspenso" : resting ? "Poupado" : inXI ? "Titular" : "Reserva";
      const future = status === "listed" || status === "loan_listed" ? "À venda" : r.left !== null && r.left <= 180 ? "Contrato acabando" : (r.morale ?? 60) < 45 ? "Insatisfeito" : "Feliz no clube";
      const detail = status === "listed" ? "Na lista de transferências" : status === "loan_listed" ? "Na lista de empréstimos" : status === "blocked" ? "Ofertas bloqueadas" : "Nenhum";
      const nInt = interested(p, s);
      const ring = (v, cls, label) => `<i class="rp-ring ${cls}">${label}</i>`;
      main = `<div class="rp-tiles">
        <section class="rp-tile"><h4>Moral</h4>${ring(0, mc, r.morale ?? "—")}<p>${esc(ml)}</p>${own ? `<input type="hidden" data-coach-target value="${esc(p.id)}"><button type="button" class="rp-btn" data-coach-talk="individual">Conversar</button>` : ""}</section>
        <section class="rp-tile"><h4>Condição</h4>${ring(0, (r.cond ?? 100) >= 80 ? "m-good" : (r.cond ?? 100) >= 55 ? "m-mid" : "m-bad", r.cond ?? "—")}<p>${(r.cond ?? 100) >= 90 ? "Ótima" : (r.cond ?? 100) >= 70 ? "Boa" : (r.cond ?? 100) >= 50 ? "Cansado" : "Exausto"}</p>${own ? `<button type="button" class="rp-btn" data-coach-player-rest="${esc(p.id)}">${resting ? "Voltar a escalar" : "Poupar 7 dias"}</button>` : ""}</section>
        <section class="rp-tile"><h4>Química da equipe</h4>${ring(0, "blue", chem)}<p>${chemL}</p></section>
        <section class="rp-tile"><h4>Suspensões</h4>${ring(0, susp ? "m-mid" : "grey", susp ? "▮" : "—")}<p>Jogos a cumprir: ${susp}</p></section></div>
        <div class="rp-lower"><dl class="rp-kv"><div><dt>Gols</dt><dd>${r.goals}</dd></div><div><dt>Sem sofrer gols</dt><dd>${num(p.cleanSheets) ?? 0}</dd></div><div><dt>Desempenho médio</dt><dd>${num(p.avgRating) ? Number(p.avgRating).toFixed(2).replace(".", ",") : "0,00"}</dd></div><div><dt>Aparições</dt><dd>${num(p.appearances) ?? 0} (${num(p.subAppearances) ?? 0})</dd></div></dl>
        <dl class="rp-kv"><div><dt>Estado no plantel</dt><dd>${state}</dd></div><div><dt>Futuro</dt><dd>${future}</dd></div><div><dt>Detalhes da transferência</dt><dd>${detail}</dd></div><div><dt>Clubes interessados</dt><dd>${nInt || "Nenhum"}</dd></div></dl>
        <section class="rp-shirt"><span class="rp-jersey" aria-hidden="true">👕</span>${own ? `<label>Número da camisa<input type="number" min="1" max="99" value="${esc(p.number ?? "")}" data-sm27sq-number="${esc(p.id)}"></label><button type="button" class="rp-btn" data-coach-player-number="${esc(p.id)}">Salvar</button>` : `<b>Nº ${esc(p.number ?? "—")}</b>`}</section></div>`;
    }
    const menu = own && ui.actions ? `<div class="rp-menu" role="menu"><button type="button" role="menuitem" data-coach-player-status="${status === "blocked" ? "available" : "blocked"}" data-player="${esc(p.id)}">${status === "blocked" ? "Liberar ofertas" : "Bloquear ofertas"}</button><button type="button" role="menuitem" data-coach-player-status="${status === "listed" ? "available" : "listed"}" data-player="${esc(p.id)}">${status === "listed" ? "Tirar da lista de transferências" : "Adicionar à lista de transferências"}</button><button type="button" role="menuitem" data-coach-player-status="${status === "loan_listed" ? "available" : "loan_listed"}" data-player="${esc(p.id)}">${status === "loan_listed" ? "Tirar da lista de empréstimos" : "Adicionar à lista de empréstimos"}</button><button type="button" role="menuitem" data-sm27sq-renew>Oferecer novo contrato</button><button type="button" role="menuitem" class="danger" data-coach-player-release="${esc(p.id)}" data-cost="${cost}">Dispensar jogador${cost ? " · " + esc(h.fmtMoney(cost)) : ""}</button></div>` : "";
    return `<div class="sm27-dialog-backdrop" data-sm27sq-close></div><section class="sm27-dialog rp-dialog" role="dialog" aria-modal="true" aria-label="${esc(r.name)}"><header class="sm27-dialog-head"><span></span><h2>${esc(p.nationality ? p.nationality + " · " : "")}${esc(r.name)}</h2><button type="button" class="sm27-dialog-x" data-sm27sq-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs sq-dtabs rp-dtabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-sm27sq-dtab="${id}">${l}</button>`).join("")}</nav><div class="rp-grid">${left}<div class="rp-main">${main}</div></div>${menu}</div></section>`;
  }

  function contractHtml(p, r, h, own) {
    const rows = [["Salário mensal", h.fmtMoney(r.wage)], ["Valor de mercado", h.fmtMoney(r.value)], ["Termina em", h.leftLabel(r.left)], ["Função no elenco", ({ rotation: "Rotação", important: "Importante", starter: "Titular", star: "Estrela", prospect: "Promessa", backup: "Reserva" })[String(p.contract?.role || p.squadRole || "").toLowerCase()] || p.contract?.role || "—"], ["Tipo", p.contract?.type === "loan" ? "Empréstimo" : "Permanente"]];
    const list = `<dl class="rp-kv rp-wide">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
    if (!own) return list;
    if (!ui.renew) return list + `<button type="button" class="rp-btn wide" data-sm27sq-renew>Oferecer novo contrato</button>`;
    const base = Math.round(((Number(r.wage) || 0) * 1.1) / 1000) * 1000 || 10000;
    return list + `<form class="rp-renew" data-coach-renew-form="${esc(p.id)}" onsubmit="return false"><label>Salário mensal<input type="number" min="1000" step="1000" data-coach-renew-salary value="${base}"></label><label>Duração<select data-coach-renew-years>${[1, 2, 3, 4, 5].map((y) => `<option value="${y}"${y === 3 ? " selected" : ""}>${y} ano(s)</option>`).join("")}</select></label><label>Luvas<input type="number" min="0" step="10000" data-coach-renew-bonus value="0"></label><label>Papel<select data-coach-renew-role>${["Rotação", "Importante", "Titular", "Estrela"].map((x) => `<option>${x}</option>`).join("")}</select></label><div class="rp-renew-go"><button type="button" class="rp-btn" data-coach-renew-confirm="${esc(p.id)}">Confirmar renovação</button><button type="button" class="rp-btn ghost" data-sm27sq-renew-cancel>Cancelar</button></div></form>`;
  }

  root.ProLifeSM27Reports = { render, ficha, ui, injuryType };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Reports;
})(typeof window !== "undefined" ? window : globalThis);
