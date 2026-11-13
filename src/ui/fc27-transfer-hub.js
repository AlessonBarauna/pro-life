(function (root) {
  "use strict";
  // PRO LIFE — Mercado (estilo Transfer Hub do FC 27): visão geral, atividade mundial, busca,
  // negociações/propostas e elenco à venda. Lê por ProLifeSM27Ctx e age por ProLifeSM27Cmd.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (v) => { const n = Number(v) || 0, a = Math.abs(n); return a >= 1e9 ? "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi" : a >= 1e6 ? "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi" : a >= 1e3 ? "R$ " + Math.round(a / 1e3) + " mil" : "R$ " + Math.round(a); };
  const TABS = [["geral", "Visão geral"], ["mundo", "Atividade mundial"], ["scout", "Scouting"], ["negociacoes", "Negociações"], ["elenco", "Meu elenco"], ["gestao", "Transferências"]];
  const EMBED_TABS = ["scout", "elenco", "gestao"];
  const AREA_OF = { scout: "observacao", elenco: "squad", gestao: "transferencias" };
  const DEAL = { rumor: ["Rumor", "rumor"], scouting: ["Observando", "rumor"], negotiating: ["Em negociação", "neg"], offer: ["Proposta feita", "neg"], completed: ["Fechado", "done"], rejected: ["Recusado", "out"], cancelled: ["Cancelado", "out"] };
  let layer = null, tab = "geral", negPid = null, flash = ""; const tabHist = [];
  const wf = { status: "all", league: "" };
  const sf = { q: "", pos: "", ageMax: 40, ovrMin: 60, potMin: 0, valueMax: 0, league: "", free: false, page: 0 };

  function ctx() { const c = root.ProLifeSM27Ctx?.(); return c?.s && c.s.mode === "coach" ? c : null; }
  const GF = () => root.ProLifeGlobalFootball;
  const ovrOf = (p) => Number(p?.ovr ?? p?.overall) || 0;
  const valueOf = (p) => { try { return Number(root.ProLifePlayerEconomy?.marketValue?.(p)) || 0; } catch (e) { return 0; } };
  const clubName = (s, D, id) => { try { return (GF()?.clubById?.(s, id) || D.club(s, id))?.name || "Sem clube"; } catch (e) { return "Sem clube"; } };
  const leagueName = (s, id) => (s.globalFootball?.leagues || []).find((l) => l.id === id)?.name || (s.leagues || []).find((l) => l.id === id)?.name || id || "—";

  function leagues(s) {
    const m = new Map();
    for (const l of [...(s.globalFootball?.leagues || []), ...(s.leagues || [])]) if (l?.id && !m.has(l.id)) m.set(l.id, l.name || l.id);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }

  function geral(s, D, club) {
    const c = s.coachCareer || {}, w = D.Career.windowStatus(s);
    const mine = (x) => String(x.buyerClubId) === String(s.clubId);
    const neg = (c.negotiations || []).filter((n) => ["pending", "awaiting_window"].includes(n.status) && mine(n)).length;
    const offers = (c.saleOffers || []).filter((o) => o.status === "pending" && o.sellerClubId === s.clubId && (!Number.isFinite(Number(o.expiresDay)) || s.day <= o.expiresDay)).length;
    const inq = (c.inquiries || []).filter((i) => ["accepted", "asking_price"].includes(i.status)).length;
    const expiring = (club.roster || []).filter((p) => p.id !== "hero" && Number.isFinite(Number(p.contractEnd ?? p.contractUntil)) && Number(p.contractEnd ?? p.contractUntil) <= s.season).length;
    const tile = (l, v, sub, t) => `<button type="button" class="tfh-tile" ${t ? `data-tfh-tab="${t}"` : ""}><small>${esc(l)}</small><b>${esc(v)}</b>${sub ? `<em>${esc(sub)}</em>` : ""}</button>`;
    const latest = (s.worldLiveMarket?.deals || []).filter((d) => d.state !== "cancelled").slice().sort((a, b) => (b.updatedDay || 0) - (a.updatedDay || 0)).slice(0, 5);
    return `<div class="tfh-tiles">${tile("Orçamento de transferências", money(club.budget))}${tile("Janela", w.open ? "Aberta" : "Fechada", w.open ? `fecha em ${w.remaining} d` : `abre em ${w.remaining} d`)}${tile("Negociações ativas", neg, "ver todas", "negociacoes")}${tile("Propostas recebidas", offers, "responder", "negociacoes")}${tile("Sondagens", inq, "", "negociacoes")}${tile("Lista de alvos", (c.shortlist || []).length, "buscar jogadores", "busca")}${tile("Contratos no fim", expiring, "meu elenco", "elenco")}</div>
      <h3 class="tfh-h">Últimas do mercado mundial</h3>${latest.length ? feed(s, D, latest) : `<p class="tfh-note">Ainda sem movimentos. O mercado esquenta com as janelas abertas.</p>`}`;
  }

  function dealRow(s, D, d) {
    const p = GF()?.playerById?.(s, d.playerId), st = DEAL[d.executionStatus === "executed" ? "completed" : d.state] || ["—", "out"];
    return `<li class="tfh-row"><span class="tfh-main"><b>${esc(p?.name || d.playerId)}</b><small>${esc(p?.pos || "—")} · GER ${p ? ovrOf(p) : "—"} · ${esc(clubName(s, D, d.fromClubId))} → ${esc(clubName(s, D, d.toClubId))}</small></span><span class="tfh-side"><i class="tfh-badge ${st[1]}">${st[0]}</i><em>${money(d.value)}</em></span></li>`;
  }
  const feed = (s, D, deals) => `<ul class="tfh-list">${deals.map((d) => dealRow(s, D, d)).join("")}</ul>`;

  function mundo(s, D) {
    let deals = (s.worldLiveMarket?.deals || []).filter((d) => d.state !== "cancelled" && d.executionStatus !== "cancelled");
    const group = { rumor: ["rumor", "scouting"], neg: ["negotiating", "offer"], done: ["completed"] };
    if (wf.status !== "all") deals = deals.filter((d) => group[wf.status].includes(d.state));
    if (wf.league) deals = deals.filter((d) => [d.fromClubId, d.toClubId].some((id) => (GF()?.clubById?.(s, id) || {}).leagueId === wf.league));
    deals.sort((a, b) => (b.updatedDay || 0) - (a.updatedDay || 0));
    const chips = [["all", "Tudo"], ["rumor", "Rumores"], ["neg", "Negociações"], ["done", "Fechados"]].map(([k, l]) => `<button type="button" class="tfh-chip ${wf.status === k ? "on" : ""}" data-tfh-wf="${k}">${l}</button>`).join("");
    const sel = `<select data-tfh-wl aria-label="Liga"><option value="">Todas as ligas</option>${leagues(s).map(([id, n]) => `<option value="${esc(id)}" ${wf.league === id ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>`;
    return `<div class="tfh-filters">${chips}${sel}</div>${deals.length ? feed(s, D, deals.slice(0, 80)) : `<p class="tfh-note">Nenhuma movimentação com esses filtros.</p>`}`;
  }

  function search(s, D, club) {
    const g = GF(), own = s.clubId, list = (s.coachCareer?.shortlist || []);
    const inList = (p) => list.some((e) => e.playerId === p.id);
    let ps = (g?.activePlayers?.(s) || []).filter((p) => p && p.id !== "hero" && p.clubId !== own && !p.academy);
    if (sf.free) ps = ps.filter((p) => !p.clubId);
    const q = sf.q.trim().toLowerCase();
    if (q) ps = ps.filter((p) => String(p.name || "").toLowerCase().includes(q));
    if (sf.pos) ps = ps.filter((p) => p.pos === sf.pos);
    ps = ps.filter((p) => Number(p.age) <= sf.ageMax && ovrOf(p) >= sf.ovrMin && Number(p.potential || 0) >= sf.potMin);
    if (sf.league) ps = ps.filter((p) => (g.clubById?.(s, p.clubId) || {}).leagueId === sf.league);
    const rows = ps.map((p) => ({ p, v: valueOf(p) })).filter((r) => !sf.valueMax || r.v <= sf.valueMax * 1e6).sort((a, b) => ovrOf(b.p) - ovrOf(a.p) || Number(b.p.potential || 0) - Number(a.p.potential || 0));
    const per = 25, pages = Math.max(1, Math.ceil(rows.length / per)); if (sf.page >= pages) sf.page = pages - 1;
    const view = rows.slice(sf.page * per, sf.page * per + per);
    const num = (k, l, min, max, step) => `<label>${l}<input type="number" data-tfh-sf="${k}" value="${sf[k]}" min="${min}" max="${max}" step="${step}"></label>`;
    const filters = `<div class="tfh-search"><label class="wide">Nome<input type="search" data-tfh-sf="q" value="${esc(sf.q)}" placeholder="Buscar atleta"></label>
      <label>Posição<select data-tfh-sf="pos"><option value="">Todas</option>${["GOL", "DEF", "MEI", "ATA"].map((p) => `<option ${sf.pos === p ? "selected" : ""}>${p}</option>`).join("")}</select></label>
      <label>Liga<select data-tfh-sf="league"><option value="">Todas</option>${leagues(s).map(([id, n]) => `<option value="${esc(id)}" ${sf.league === id ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
      ${num("ovrMin", "GER mínimo", 40, 95, 1)}${num("potMin", "Potencial mínimo", 0, 99, 1)}${num("ageMax", "Idade máxima", 16, 45, 1)}${num("valueMax", "Valor máx. (mi)", 0, 2000, 5)}
      <label class="chk"><input type="checkbox" data-tfh-sf="free" ${sf.free ? "checked" : ""}> Só livres</label></div>`;
    const body = view.length ? `<ul class="tfh-list">${view.map(({ p, v }) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.age)} anos · GER ${ovrOf(p)} / pot. ${Number(p.potential || 0) || "—"} · ${esc(clubName(s, D, p.clubId))}</small></span><span class="tfh-side"><em>${money(v)}</em><span class="tfh-acts"><button type="button" class="tfh-btn" data-tfh-star="${esc(p.id)}" data-club="${esc(p.clubId || "")}" aria-pressed="${inList(p)}" title="Lista de alvos">${inList(p) ? "★" : "☆"}</button><button type="button" class="tfh-btn primary" data-tfh-negotiate="${esc(p.id)}">Negociar</button></span></span></li>`).join("")}</ul>` : `<p class="tfh-note">Nenhum atleta com esses filtros.</p>`;
    const pager = `<div class="tfh-pager"><button type="button" class="tfh-btn" data-tfh-page="-1" ${sf.page <= 0 ? "disabled" : ""}>Anterior</button><span>${rows.length} atletas · página ${sf.page + 1} de ${pages}</span><button type="button" class="tfh-btn" data-tfh-page="1" ${sf.page >= pages - 1 ? "disabled" : ""}>Próxima</button></div>`;
    return filters + body + pager;
  }

  function negociacoes(s, D, club) {
    const c = s.coachCareer || {}, g = GF();
    const nm = (id) => g?.playerById?.(s, id)?.name || D.club(s, s.clubId)?.roster?.find((p) => p.id === id)?.name || id;
    const offers = (c.saleOffers || []).filter((o) => o.status === "pending" && o.sellerClubId === s.clubId && (!Number.isFinite(Number(o.expiresDay)) || s.day <= o.expiresDay));
    const waiting = (c.saleOffers || []).filter((o) => o.status === "awaiting_window" && o.sellerClubId === s.clubId);
    const negs = (c.negotiations || []).filter((n) => ["pending", "awaiting_window"].includes(n.status) && String(n.buyerClubId) === String(s.clubId));
    const inqs = (c.inquiries || []).filter((i) => String(i.buyerClubId) === String(s.clubId) && !i.dismissed && (i.status === "pending" || (["accepted", "asking_price"].includes(i.status) && s.day <= Number(i.expiresDay)) || (i.status === "rejected" && s.day < Number(i.answeredDay ?? i.responseDay) + 14))).slice().reverse();
    const inqLabel = (i) => i.status === "pending" ? `aguardando resposta (${Math.max(0, Number(i.responseDay) - s.day)} d)` : i.status === "rejected" ? "recusada" : i.status === "asking_price" ? "clube pediu valor" : "sondagem aceita";
    const offerRow = (o) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(o.playerName || nm(o.playerId))}</b><small>${esc(clubName(s, D, o.buyerClubId))} · ${o.dealType === "loan" ? "empréstimo" : "compra"}${Number.isFinite(Number(o.expiresDay)) ? ` · expira em ${Math.max(0, o.expiresDay - s.day)} d` : ""}</small></span><span class="tfh-side"><em>${money(o.amount)}</em><span class="tfh-acts"><button type="button" class="tfh-btn primary" data-tfh-cmd="acceptSaleOffer" data-id="${esc(o.id)}">Aceitar</button><button type="button" class="tfh-btn" data-tfh-cmd="rejectSaleOffer" data-id="${esc(o.id)}">Recusar</button></span></span></li>`;
    const sec = (t, inner, empty) => `<h3 class="tfh-h">${t}</h3>${inner || `<p class="tfh-note">${empty}</p>`}`;
    return sec("Propostas recebidas pelos seus jogadores", offers.length ? `<ul class="tfh-list">${offers.map(offerRow).join("")}</ul>` : "", "Nenhuma proposta no momento.") +
      (waiting.length ? sec("Vendas acordadas (aguardando a janela)", `<ul class="tfh-list">${waiting.map((o) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(o.playerName || nm(o.playerId))}</b><small>para ${esc(clubName(s, D, o.buyerClubId))}</small></span><span class="tfh-side"><em>${money(o.amount)}</em></span></li>`).join("")}</ul>`) : "") +
      sec("Suas negociações de compra", negs.length ? `<ul class="tfh-list">${negs.map((n) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(n.playerName || nm(n.playerId))}</b><small>${esc(clubName(s, D, n.sellerClubId))} · ${n.status === "awaiting_window" ? "acordo fechado, aguardando janela" : "em andamento"}</small></span><span class="tfh-side"><em>${money(n.amount ?? n.fee)}</em><button type="button" class="tfh-btn" data-tfh-negotiate="${esc(n.playerId)}">Abrir</button></span></li>`).join("")}</ul>` : "", "Nenhuma negociação aberta. Use Buscar jogadores.") +
      sec("Sondagens em andamento", inqs.length ? `<ul class="tfh-list">${inqs.map((i) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(i.playerName || nm(i.playerId))}</b><small>${esc(clubName(s, D, i.clubId))} · ${inqLabel(i)}</small></span><span class="tfh-side"><button type="button" class="tfh-btn" data-tfh-negotiate="${esc(i.playerId)}">Abrir</button></span></li>`).join("")}</ul>` : "", "Sem sondagens abertas.") +
      `<p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-cmd="generateSaleInterest">Ver quem tem interesse nos meus jogadores</button></p>`;
  }

  function elenco(s, D, club) {
    const prefs = s.coachCareer?.offerPreferences || { listedIds: [], loanListedIds: [], blockedIds: [] };
    const st = (p) => (prefs.blockedIds || []).includes(p.id) ? "Intransferível" : (prefs.listedIds || []).includes(p.id) ? "À venda" : (prefs.loanListedIds || []).includes(p.id) ? "Para empréstimo" : "Disponível a propostas";
    const ps = (club.roster || []).filter((p) => p.id !== "hero").slice().sort((a, b) => ovrOf(b) - ovrOf(a));
    const btn = (p, status, label) => `<button type="button" class="tfh-btn" data-tfh-cmd="setCoachPlayerOfferStatus" data-pid="${esc(p.id)}" data-status="${status}">${label}</button>`;
    return `<ul class="tfh-list">${ps.map((p) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.age)} anos · GER ${ovrOf(p)} · ${esc(st(p))}</small></span><span class="tfh-side"><em>${money(valueOf(p))}</em><span class="tfh-acts">${btn(p, "listed", "Vender")}${btn(p, "loan_listed", "Emprestar")}${btn(p, "blocked", "Segurar")}${btn(p, "available", "Limpar")}</span></span></li>`).join("")}</ul>`;
  }


  function negotiation(s, D, club) {
    const g = GF(), p = g?.playerById?.(s, negPid);
    if (!p) return `<p class="tfh-note">Atleta indisponível.</p><p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-negback>Voltar</button></p>`;
    const c = s.coachCareer || {}, sellerId = p.clubId, seller = sellerId ? (g.clubById?.(s, sellerId) || D.club(s, sellerId)) : null;
    const back = `<p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-negback>← Voltar</button></p>`;
    const head = `<div class="tfh-negcard"><span class="tfh-ger">${ovrOf(p)}</span><div><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.age)} anos · GER ${ovrOf(p)} / pot. ${Number(p.potential || 0) || "—"} · ${esc(seller?.name || "Sem clube")}</small></div><em>${money(valueOf(p))}</em></div>`;
    if (!sellerId) return back + head + `<p class="tfh-note">Agente livre: a contratação direta ainda não está disponível no mercado.</p>`;
    const mine = (x) => String(x.buyerClubId) === String(s.clubId);
    const day = Number(s.day) || 0;
    const neg = (c.negotiations || []).find((n) => n.playerId === p.id && mine(n) && ["pending", "awaiting_window"].includes(n.status) && (n.expiresDay == null || n.expiresDay >= day));
    const inq = (c.inquiries || []).slice().reverse().find((x) => x.playerId === p.id && x.clubId === sellerId && mine(x) && !x.dismissed);
    const ready = inq && ["accepted", "asking_price"].includes(inq.status) && day <= Number(inq.expiresDay);
    const w = D.Career.windowStatus(s);
    const winNote = w.open ? "" : `<p class="tfh-note">Janela fechada: o acordo fica programado e só é concluído quando o mercado abrir. Nada é pago antes.</p>`;
    const offerBox = (label, def, act, extra) => `<div class="tfh-offer"><label>${label}<input type="number" min="1" step="0.1" data-tfh-offer value="${def}"> <small>mi</small></label><button type="button" class="tfh-btn primary" data-tfh-send="${act}" ${extra || ""}>Enviar proposta</button></div>`;
    let panel;
    if (neg) {
      const awaiting = neg.response === "awaiting_reply";
      if (neg.status === "awaiting_window") panel = `<p class="tfh-note"><b>Acordo fechado</b> por ${money(neg.finalFee ?? neg.requested)}. A transferência será concluída quando a janela abrir.</p>`;
      else if (awaiting) panel = `<p class="tfh-note">Proposta de ${money(neg.requested)} enviada. O clube responde em ${Math.max(0, Number(neg.replyDay ?? day + 2) - day)} dia(s).</p>`;
      else if (neg.response === "accepted") panel = `<p class="tfh-note"><b>${esc(seller.name)} aceitou</b> ${money(neg.finalFee)}. Falta concluir a contratação.</p><p class="tfh-actions"><button type="button" class="tfh-btn primary" data-tfh-send="accept" data-id="${esc(neg.id)}">${w.open ? "Concluir contratação" : "Fechar acordo para a janela"}</button><button type="button" class="tfh-btn" data-tfh-send="reject" data-id="${esc(neg.id)}">Desistir</button></p>${winNote}`;
      else if (neg.status === "pending" && Number(neg.round || 1) < 3) panel = `<p class="tfh-note">O clube recusou a oferta e pede <b>${money(neg.finalFee ?? neg.xTV)}</b>. Rodada ${neg.round || 1} de 3.</p>${offerBox("Nova oferta", Math.max(1, Math.round((Number(neg.finalFee ?? neg.xTV) || valueOf(p)) / 1e5) / 10), "revise", `data-id="${esc(neg.id)}"`)}<p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-send="reject" data-id="${esc(neg.id)}">Desistir</button></p>`;
      else panel = `<p class="tfh-note">Limite de rodadas atingido. Desista ou aguarde nova abertura.</p><p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-send="reject" data-id="${esc(neg.id)}">Desistir</button></p>`;
    } else if (inq && inq.status === "pending") panel = `<p class="tfh-note">Sondagem enviada. Resposta prevista em ${Math.max(0, Number(inq.responseDay) - day)} dia(s).</p>`;
    else if (ready) panel = `<p class="tfh-note"><b>${inq.status === "asking_price" ? "O clube exige proposta financeira." : "Sondagem aceita."}</b> Você pode negociar até o dia ${esc(inq.expiresDay)}.</p>${offerBox("Sua oferta", Math.max(1, Math.round(valueOf(p) / 1e5) / 10), "offer")}${winNote}`;
    else if (inq && inq.status === "rejected") {
      const left = Number(inq.answeredDay ?? inq.responseDay) + 14 - day;
      panel = `<p class="tfh-note"><b>Sondagem recusada</b> (${inq.playerDecision === "rejected" ? "jogador sem interesse" : "clube não autoriza"}). ${left > 0 ? `Nova consulta em ${left} dia(s).` : ""}</p>` + (left > 0 ? "" : `<p class="tfh-actions"><button type="button" class="tfh-btn primary" data-tfh-send="inquire">Consultar interesse</button></p>`);
    } else panel = `<p class="tfh-note">Antes de propor, consulte o interesse do jogador e a disposição do clube vendedor.</p><p class="tfh-actions"><button type="button" class="tfh-btn primary" data-tfh-send="inquire">Consultar interesse</button></p>`;
    return back + head + panel;
  }

  // "Gestão": scouting, listas, contratos, cláusulas, finanças e histórico (central completa de transferências), dentro do Mercado.
  function gestao(s, D) {
    const V = root.ProLifeCoachCareerView;
    let inner = "";
    try { inner = V?.renderMarket?.(s, D) || ""; } catch (e) {
      try { console.error("[mercado] gestão falhou", e); V?.setTab?.("proposals"); inner = V?.renderMarket?.(s, D) || ""; } catch (e2) { inner = ""; }
    }
    return `<div class="tfh-embed tfh-area-${tab}">${inner || '<p class="tfh-note">Não foi possível carregar a gestão agora. <button type="button" class="tfh-btn" data-tfh-tab="gestao">Tentar de novo</button></p>'}</div>`;
  }

  function html() {
    const c = ctx();
    let body;
    if (!c) body = `<p class="tfh-note">O Mercado está disponível na carreira de treinador.</p>`;
    else {
      const club = c.D.club(c.s);
      body = !club ? `<p class="tfh-note">Assine com um clube para usar o mercado.</p>` : (negPid ? negotiation : ({ geral, mundo, scout: gestao, negociacoes, elenco: gestao, gestao }[tab] || geral))(c.s, c.D, club);
      if (flash) body = `<p class="tfh-flash" role="status">${esc(flash)}</p>` + body;
    }
    const tabs = TABS.map(([id, l]) => `<button type="button" role="tab" class="${tab === id ? "active" : ""}" aria-selected="${tab === id}" data-tfh-tab="${id}">${l}</button>`).join("");
    return `<div class="sm27-dialog-backdrop" data-tfh-close></div><section class="sm27-dialog tfh-dialog" role="dialog" aria-modal="true" aria-label="Mercado"><header class="sm27-dialog-head"><button type="button" class="sm27-dialog-back" data-tfh-back aria-label="Voltar">‹</button><h2>Mercado</h2><button type="button" class="sm27-dialog-x" data-tfh-close aria-label="Fechar">×</button></header><nav class="tfh-tabs" role="tablist">${tabs}</nav><div class="tfh-body">${body}</div></section>`;
  }
  function open() {
    if (!layer) { layer = doc.createElement("div"); layer.className = "sm27-dialog-layer"; doc.body.appendChild(layer); doc.body.classList.remove("sm27-menu-open"); }
    const keep = layer.querySelector(".tfh-body")?.scrollTop || 0, focused = doc.activeElement?.getAttribute?.("data-tfh-sf");
    layer.innerHTML = html();
    const b = layer.querySelector(".tfh-body"); if (b) b.scrollTop = keep;
    if (focused) { const el = layer.querySelector(`[data-tfh-sf="${focused}"]`); if (el && el.type === "search") { el.focus(); el.setSelectionRange?.(el.value.length, el.value.length); } }
  }
  function close() { if (layer) { layer.remove(); layer = null; } negPid = null; flash = ""; tabHist.length = 0; }
  const cmd = (a, d) => { const ok = root.ProLifeSM27Cmd?.(a, d); const tx = doc.getElementById("toast"); flash = (tx && tx.textContent) || (ok ? "Ação concluída." : "Não foi possível concluir."); if (tx) tx.style.display = "none"; if (layer) open(); return ok; };

  function negotiate(id) { negPid = id; flash = ""; open(); }
  function send(el) {
    const c = ctx(); if (!c) return;
    const act = el.dataset.tfhSend, p = GF()?.playerById?.(c.s, negPid), sellerId = p?.clubId;
    const val = Math.round((Number(layer.querySelector("[data-tfh-offer]")?.value) || 0) * 1e6);
    if (act === "inquire") cmd("coachInquiry", { clubId: sellerId, playerId: negPid });
    else if (act === "offer") cmd("counterRecruit", { clubId: sellerId, playerId: negPid, offer: val });
    else if (act === "revise") cmd("reviseCoachDeal", { id: el.dataset.id, offer: val });
    else if (act === "accept") cmd("acceptCoachDeal", { id: el.dataset.id, paymentPlan: "upfront" });
    else if (act === "reject") cmd("rejectCoachDeal", { id: el.dataset.id });
  }

  // Um só Mercado: atalhos antigos (data-page="market") abrem o Mercado novo, na aba Gestão.
  // Escuta na janela (captura) para vir antes da navegação do app.
  root.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t || !t.closest('[data-page="market"]') || t.closest(".tfh-dialog") || !ctx()) return;
    // Mensagem "Sondagem aceita": vai direto à tela de contratação do jogador (sem passar pela lista).
    const msg = t.closest(".msg-action");
    const direct = msg && msg.dataset.msgPlayer && /^sondagens$/.test(msg.dataset.msgList || "") ? msg.dataset.msgPlayer : null;
    if (direct) {
      try { root.ProLifeCoachCareerView?.setListScreen?.("sondagens"); } catch (e) {}
      tab = "gestao"; negPid = direct; flash = ""; setTimeout(open, 0);
      return;
    }
    ev.preventDefault(); ev.stopImmediatePropagation();
    tab = "gestao"; negPid = null; flash = ""; setTimeout(open, 0);
  }, true);

  // Página de Mercado do treinador = só um atalho: abre o Mercado novo automaticamente (um único mercado).
  try {
    new MutationObserver(() => {
      const l = doc.querySelector(".tfh-launch:not([data-tfh-auto])");
      if (!l || layer || !ctx()) return;
      l.setAttribute("data-tfh-auto", "1");
      tab = "gestao"; negPid = null; flash = ""; setTimeout(open, 0);
    }).observe(doc.body, { childList: true, subtree: true });
  } catch (e) {}

  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (layer && t.closest(".tfh-embed")) {
      if (t.closest("[data-page]")) { close(); return; }
      // Campos (select/input) não reconstroem o diálogo no clique: isso fechava o seletor nativo aberto.
      if (t.closest("select, input, textarea, label, option")) return;
      const ar = t.closest("[data-coach-market-area]")?.dataset.coachMarketArea;
      if (ar) tab = ar === "observacao" ? "scout" : ar === "squad" ? "elenco" : ar === "overview" ? "geral" : "gestao";
      setTimeout(() => { if (layer && EMBED_TABS.includes(tab)) open(); }, 90);
      return;
    }
    if (t.closest("[data-sm27-market-hub]")) { ev.preventDefault(); tab = "geral"; open(); return; }
    if (!layer) return;
    let el;
    if (t.closest("[data-tfh-close]")) { close(); return; }
    if (t.closest("[data-tfh-back]")) {
      if (negPid) { negPid = null; flash = ""; open(); return; }
      const prev = tabHist.pop(); if (!prev) { close(); return; } if (prev) { tab = prev; flash = ""; if (AREA_OF[prev]) { try { root.ProLifeCoachCareerView?.setMarketArea?.(AREA_OF[prev]); } catch (e) {} } open(); }
      return;
    }
    if ((el = t.closest("[data-tfh-tab]"))) {
      const nt = el.dataset.tfhTab; negPid = null; flash = "";
      if (AREA_OF[nt] && (nt !== tab || nt !== "gestao")) {
        const V = root.ProLifeCoachCareerView, cur = V?.state?.marketArea;
        if (nt !== "gestao" || ["observacao", "squad", "overview"].includes(cur)) { try { V?.setMarketArea?.(AREA_OF[nt]); } catch (e) {} }
      }
      if (nt !== tab) { tabHist.push(tab); if (tabHist.length > 20) tabHist.shift(); }
      tab = nt; open(); return;
    }
    if ((el = t.closest("[data-tfh-wf]"))) { wf.status = el.dataset.tfhWf; open(); return; }
    if ((el = t.closest("[data-tfh-page]"))) { sf.page = Math.max(0, sf.page + Number(el.dataset.tfhPage)); open(); return; }
    if ((el = t.closest("[data-tfh-star]"))) { cmd("toggleCoachShortlist", { clubId: el.dataset.club, playerId: el.dataset.tfhStar }); return; }
    if ((el = t.closest("[data-tfh-negotiate]"))) { negotiate(el.dataset.tfhNegotiate); return; }
    if (t.closest("[data-tfh-negback]")) { negPid = null; flash = ""; open(); return; }
    if ((el = t.closest("[data-tfh-send]"))) { send(el); return; }
    if ((el = t.closest("[data-tfh-cmd]"))) {
      const a = el.dataset.tfhCmd;
      cmd(a, a === "setCoachPlayerOfferStatus" ? { playerId: el.dataset.pid, status: el.dataset.status } : el.dataset.id ? { id: el.dataset.id } : {});
    }
  }, true);
  const onField = (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!layer || !t) return;
    let el;
    if ((el = t.closest("[data-tfh-wl]"))) { wf.league = el.value; open(); return; }
    if ((el = t.closest("[data-tfh-sf]"))) {
      const k = el.dataset.tfhSf;
      sf[k] = el.type === "checkbox" ? el.checked : el.type === "number" ? Number(el.value) || 0 : el.value;
      sf.page = 0; open();
    }
  };
  doc.addEventListener("change", onField);
  doc.addEventListener("input", (ev) => { const t = ev.target; if (layer && t?.matches?.('input[type="search"][data-tfh-sf]')) onField(ev); });
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });

  root.ProLifeTransferHub = { open, close, html };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeTransferHub;
})(typeof window !== "undefined" ? window : globalThis);
