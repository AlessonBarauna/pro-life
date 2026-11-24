(function (root) {
  "use strict";
  // PRO LIFE — Mercado (estilo Transfer Hub do FC 27): visão geral, atividade mundial, busca,
  // negociações/propostas e elenco à venda. Lê por ProLifeSM27Ctx e age por ProLifeSM27Cmd.
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (v) => { const n = Number(v) || 0, a = Math.abs(n); return a >= 1e9 ? "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi" : a >= 1e6 ? "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi" : a >= 1e3 ? "R$ " + Math.round(a / 1e3) + " mil" : "R$ " + Math.round(a); };
  // Barra lateral: cada grupo abre uma tela; os ids antigos de aba continuam valendo (alertas e pop-ups dependem deles).
  const SIDE = [["geral", "Visão geral", ["geral"]], ["mundo", "Mundo", ["mundo"]], ["negociacoes", "Clube", ["negociacoes", "comprados", "vendidos", "emp_in", "emp_out", "elenco", "gestao"]], ["lista", "Lista", ["lista"]], ["pesquisa", "Pesquisa", ["pesquisa", "scout"]], ["avancada", "Pesquisa avançada", ["avancada"]]];
  const TABS = SIDE.flatMap(([, , ids]) => ids.map((id) => [id]));
  const isEmbed = () => tab === "elenco" || tab === "gestao" || (tab === "pesquisa" && st.psub === "scout");
  const EMBED_TABS = ["scout", "elenco", "gestao", "pesquisa"];
  const AREA_OF = { scout: "observacao", elenco: "squad", gestao: "transferencias" };
  const DEAL = { rumor: ["Rumor", "rumor"], scouting: ["Observando", "rumor"], negotiating: ["Em negociação", "neg"], offer: ["Proposta feita", "neg"], completed: ["Fechado", "done"], rejected: ["Recusado", "out"], cancelled: ["Cancelado", "out"] };
  let layer = null, directPending = false, tab = "geral", negPid = null, flash = "", counterFor = null; const tabHist = [];
  const freshAdv = () => ({ pos: "", role: "", ageMin: "", ageMax: "", valueMin: "", valueMax: "", contract: "", listing: "", country: "", league: "", nat: "", interest: "", attrs: [], run: false, page: 0 });
  const st = { world: { status: "all", league: "", country: "", page: 0 }, pq: { text: "", page: 0, cpage: 0, spage: 0, npage: 0, lpage: 0, clubId: "", nat: "", onlyListed: false }, psub: "jogadores", adv: freshAdv(), ptab: "perfil", loanMonths: 12, loanOpt: true };
  const PAGE_FIELD = { world: ["world", "page"], pq: ["pq", "page"], cp: ["pq", "cpage"], sp: ["pq", "spage"], np: ["pq", "npage"], lp: ["pq", "lpage"], af: ["adv", "page"] };
  const MS = () => root.ProLifeMarketScreens;
  const R2x = () => root.ProLifeTransferRulesV2;
  const env = (s, D) => ({ s, D, GF, ovrOf, valueOf, money, clubName, leagues, leagueName, DEAL });

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
    return `<div class="tfh-tiles">${tile("Orçamento de transferências", money(club.budget))}${tile("Janela", w.open ? "Aberta" : "Fechada", w.open ? `fecha em ${w.remaining} d` : `abre em ${w.remaining} d`)}${tile("Negociações ativas", neg, "ver todas", "negociacoes")}${tile("Propostas recebidas", offers, "responder", "negociacoes")}${tile("Sondagens", inq, "", "negociacoes")}${tile("Lista preferencial", (c.shortlist || []).length, "abrir lista", "lista")}${tile("Contratos no fim", expiring, "meu elenco", "elenco")}${(() => { const hv = root.ProLifeClubHype?.view?.(s); return hv && hv.level > 0 ? tile("Marca em alta (Champions)", hv.tag, hv.percent + (hv.stage ? " · " + hv.stage : "")) : ""; })()}</div>
      <h3 class="tfh-h">Últimas do mercado mundial</h3>${latest.length ? feed(s, D, latest) : `<p class="tfh-note">Ainda sem movimentos. O mercado esquenta com as janelas abertas.</p>`}`;
  }

  function dealRow(s, D, d) {
    const p = GF()?.playerById?.(s, d.playerId), st = DEAL[d.executionStatus === "executed" ? "completed" : d.state] || ["—", "out"];
    return `<li class="tfh-row"><span class="tfh-main"><b>${esc(p?.name || d.playerId)}</b><small>${esc(p?.primaryPosition || p?.pos || "—")} · GER ${p ? ovrOf(p) : "—"} · ${esc(clubName(s, D, d.fromClubId))} → ${esc(clubName(s, D, d.toClubId))}</small></span><span class="tfh-side"><i class="tfh-badge ${st[1]}">${st[0]}</i><em>${money(d.value)}</em></span></li>`;
  }
  const feed = (s, D, deals) => `<ul class="tfh-list">${deals.map((d) => dealRow(s, D, d)).join("")}</ul>`;

  function mundo(s, D) { return MS().mundo(env(s, D), st); }
  function comprados(s, D) { return MS().clubSubNav("comprados") + MS().comprados(env(s, D)); }
  function vendidos(s, D) { return MS().clubSubNav("vendidos") + MS().vendidos(env(s, D)); }
  function empIn(s, D) { return MS().clubSubNav("emp_in") + MS().loansTable(env(s, D), "in"); }
  function empOut(s, D) { return MS().clubSubNav("emp_out") + MS().loansTable(env(s, D), "out"); }
  function lista(s, D) { return MS().lista(env(s, D), st); }
  function avancada(s, D) { return MS().avancada(env(s, D), st); }
  function pesquisa(s, D) { return st.psub === "scout" ? MS().pesquisa(env(s, D), st) + gestao(s, D) : MS().pesquisa(env(s, D), st); }

  function investorSection(s) {
    const sec = (t, inner, empty) => `<h3 class="tfh-h">${t}</h3>${inner || `<p class="tfh-note">${empty}</p>`}`;
    const iv = root.ProLifeClubInvestors?.view?.(s) || { proposals: [], active: [], recent: [] };
    const objTag = (o) => o.status === "done" ? `<span class="tfh-tag tfh-tag-ok">cumprida</span>` : o.status === "failed" ? `<span class="tfh-tag tfh-tag-bad">não cumprida</span>` : `<span class="tfh-tag">${esc(o.progressText)}</span>`;
    const investorBlock = () => {
      const props = iv.proposals.map((d) => `<article class="tfh-inv"><header><b>${esc(d.investor)}</b><span class="tfh-tag tfh-tag-warn">${d.kind === "project" ? "projeto" : "expira em " + d.daysLeft + " d"}</span></header><p>${esc(d.note)}</p>${d.amountText ? `<p class="tfh-inv-amount">Aporte: <b>${esc(d.amountText)}</b>${d.round ? ` · rodada ${d.round} de 2` : ""}</p>` : ""}<h4>O que o investidor quer</h4><ul class="tfh-obj">${d.objectives.map((o) => `<li>${esc(o.label)}</li>`).join("")}</ul><div class="tfh-inv-acts"><button type="button" class="tfh-btn primary" data-tfh-inv="accept" data-id="${esc(d.id)}">Aceitar</button>${d.round < 2 ? `<button type="button" class="tfh-btn" data-tfh-inv="money" data-id="${esc(d.id)}">Pedir mais verba</button><button type="button" class="tfh-btn" data-tfh-inv="easier" data-id="${esc(d.id)}">Pedir metas mais leves</button><button type="button" class="tfh-btn" data-tfh-inv="time" data-id="${esc(d.id)}">Pedir mais prazo</button>` : ""}<button type="button" class="tfh-btn" data-tfh-inv="reject" data-id="${esc(d.id)}">Recusar</button></div></article>`).join("");
      const act = iv.active.map((d) => `<article class="tfh-inv"><header><b>${esc(d.investor)}</b><span class="tfh-tag tfh-tag-ok">em andamento</span></header><ul class="tfh-obj">${d.objectives.map((o) => `<li><span>${esc(o.label)}</span>${objTag(o)}</li>`).join("")}</ul></article>`).join("");
      const rec = iv.recent.map((d) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(d.investor)}</b><small>${d.result ? d.result.done + " de " + d.result.total + " metas" : "sem acordo"}${d.amountText ? " · " + esc(d.amountText) : ""}</small></span><span class="tfh-side"><span class="tfh-tag tfh-tag-${d.status === "completed" ? "ok" : d.status === "partial" ? "warn" : "bad"}">${({ completed: "Metas cumpridas", partial: "Parcial", failed: "Não cumpriu", rejected: "Você recusou", expired: "Expirou", withdrawn: "Investidor desistiu", cancelled: "Cancelado" })[d.status] || d.status}</span></span></li>`).join("");
      return (props ? sec("Propostas de investidores", props) : "") + (act ? sec("Projeto em andamento", act) : "") + (rec ? sec("Acordos anteriores", `<ul class="tfh-list">${rec}</ul>`) : "");
    };
    return investorBlock();
  }
  function negociacoes(s, D, club) {
    const c = s.coachCareer || {}, g = GF();
    const nm = (id) => g?.playerById?.(s, id)?.name || D.club(s, s.clubId)?.roster?.find((p) => p.id === id)?.name || id;
    const offers = (c.saleOffers || []).filter((o) => o.status === "pending" && o.sellerClubId === s.clubId && (!Number.isFinite(Number(o.expiresDay)) || s.day <= o.expiresDay));
    const winOpen = !!D.Career?.windowStatus?.(s)?.open;
    const waiting = (c.saleOffers || []).filter((o) => o.status === "awaiting_window" && o.sellerClubId === s.clubId);
    const negs = (c.negotiations || []).filter((n) => ["pending", "awaiting_window"].includes(n.status) && String(n.buyerClubId) === String(s.clubId));
    const inqs = (c.inquiries || []).filter((i) => String(i.buyerClubId) === String(s.clubId) && !i.dismissed && (i.status === "pending" || (["accepted", "asking_price"].includes(i.status) && s.day <= Number(i.expiresDay)) || (i.status === "rejected" && s.day < Number(i.answeredDay ?? i.responseDay) + 14))).slice().reverse();
    const negIds = new Set(negs.map((n) => String(n.playerId))), inqsF = inqs.filter((i) => !negIds.has(String(i.playerId)));
    const inqLabel = (i) => i.status === "pending" ? `aguardando resposta (${Math.max(0, Number(i.responseDay) - s.day)} d)` : i.status === "rejected" ? "recusada" : i.status === "asking_price" ? "clube pediu valor" : "sondagem aceita";
    const dateOf = (d) => Number.isFinite(Number(d)) ? `dia ${d}` : "";
    const outcome = (n) => ({
      accepted: ["Contratado", "ok", `acordo fechado${Number(n.finalFee) > 0 ? " por " + money(n.finalFee) : ""}`],
      expired: ["Expirou", "warn", "o prazo terminou sem acordo"],
      walked_away: ["Clube encerrou as conversas", "bad", `a oferta foi baixa demais${Number.isFinite(Number(n.lockUntilDay)) ? "; nova tentativa só depois do dia " + n.lockUntilDay : ""}`],
      rejected: ["Você recusou", "warn", "contraproposta recusada por você"],
      superseded: ["Substituída", "warn", "trocada por uma proposta mais nova"],
      cancelled: ["Cancelada", "warn", "o negócio foi cancelado"],
    })[n.status] || ["Encerrada", "warn", ""];
    const closedNegs = (c.negotiations || []).filter((n) => String(n.buyerClubId) === String(s.clubId) && !["pending", "awaiting_window"].includes(n.status));
    const closedInqs = (c.inquiries || []).filter((i) => String(i.buyerClubId) === String(s.clubId) && ["rejected", "expired"].includes(i.status) && !negIds.has(String(i.playerId)) && !inqsF.includes(i));
    const hist = [
      ...closedNegs.map((n) => { const [t, k, why] = outcome(n); return { day: Number(n.closedDay ?? n.answeredDay ?? n.day) || 0, name: n.playerName || nm(n.playerId), club: clubName(s, D, n.sellerClubId), t, k, why, amount: n.finalFee ?? n.requested }; }),
      ...closedInqs.map((i) => ({ day: Number(i.answeredDay ?? i.responseDay ?? i.day) || 0, name: i.playerName || nm(i.playerId), club: clubName(s, D, i.clubId), t: i.status === "rejected" ? "Sondagem recusada" : "Sondagem expirada", k: "warn", why: i.status === "rejected" ? "o clube não quis conversar" : "sem resposta no prazo", amount: null })),
    ].sort((a, b) => b.day - a.day).slice(0, 15);
    const historyBlock = () => sec("Histórico das suas propostas", hist.length ? `<ul class="tfh-list tfh-history">${hist.map((h) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(h.name)}</b><small>${esc(h.club)} · ${esc(h.why)}${h.day ? " · " + dateOf(h.day) : ""}</small></span><span class="tfh-side">${Number(h.amount) > 0 ? `<em>${money(h.amount)}</em>` : ""}<span class="tfh-tag tfh-tag-${h.k}">${esc(h.t)}</span></span></li>`).join("")}</ul>` : "", "Quando uma proposta sua for aceita, recusada ou expirar, o resultado aparece aqui.");
    const offerRow = (o) => `<li class="tfh-row"><span class="tfh-main"><b><button type="button" class="tfh-player" data-tfh-player="${esc(o.playerId)}" title="Ver detalhes do jogador">${esc(o.playerName || nm(o.playerId))}</button></b><small>${esc(clubName(s, D, o.buyerClubId))} · ${o.dealType === "loan" ? "empréstimo" : "compra"}${Number.isFinite(Number(o.expiresDay)) ? ` · expira em ${Math.max(0, o.expiresDay - s.day)} d` : ""}</small></span><span class="tfh-side"><em>${money(o.amount)}</em><span class="tfh-acts"><button type="button" class="tfh-btn primary" data-tfh-cmd="acceptSaleOffer" data-id="${esc(o.id)}">Aceitar</button><button type="button" class="tfh-btn" data-tfh-counter-open="${esc(o.id)}">Negociar</button><button type="button" class="tfh-btn" data-tfh-cmd="rejectSaleOffer" data-id="${esc(o.id)}">Recusar</button></span></span>${o.response ? `<p class="tfh-counter-reply">${o.response === "accepted" ? `${esc(clubName(s, D, o.buyerClubId))} aceitou ${money(o.amount)}. Toque em Aceitar para fechar.` : `${esc(clubName(s, D, o.buyerClubId))} não chegou a ${money(o.requested)} e subiu para ${money(o.amount)}.`}${(o.round || 0) >= 3 ? " As conversas se encerraram." : ""}</p>` : ""}${counterFor === o.id && (o.round || 0) < 3 ? `<form class="tfh-counter" data-tfh-counter-form="${esc(o.id)}"><label>Quanto você quer? (R$ milhões)<input type="number" min="0" step="0.1" inputmode="decimal" value="${(Math.round(Number(o.amount) * 1.15 / 1e5) / 10).toString()}" data-tfh-counter-amount></label><button type="button" class="tfh-btn primary" data-tfh-counter-send="${esc(o.id)}">Enviar contraproposta</button><small>Oferta atual: ${money(o.amount)} · rodada ${(o.round || 0) + 1} de 3</small></form>` : ""}</li>`;
    const sec = (t, inner, empty) => `<h3 class="tfh-h">${t}</h3>${inner || `<p class="tfh-note">${empty}</p>`}`;
    return MS().clubSubNav("negociacoes") + sec("Propostas recebidas pelos seus jogadores", offers.length ? `<ul class="tfh-list">${offers.map(offerRow).join("")}</ul>` : "", "Nenhuma proposta no momento.") +
      (waiting.length ? sec(winOpen ? "Vendas acordadas (ainda não concluídas)" : "Vendas acordadas (aguardando a janela)", `<ul class="tfh-list">${waiting.map((o) => `<li class="tfh-row"><span class="tfh-main"><b><button type="button" class="tfh-player" data-tfh-player="${esc(o.playerId)}" title="Ver detalhes do jogador">${esc(o.playerName || nm(o.playerId))}</button></b><small>para ${esc(clubName(s, D, o.buyerClubId))}${winOpen ? ` · ${o.lastSettlementError ? "não concluída: " + esc(o.lastSettlementError) : "será concluída ao avançar o dia"}` : ""}</small></span><span class="tfh-side"><em>${money(o.amount)}</em><span class="tfh-acts">${winOpen ? `<button type="button" class="tfh-btn primary" data-tfh-cmd="acceptSaleOffer" data-id="${esc(o.id)}">Concluir agora</button>` : ""}<button type="button" class="tfh-btn" data-tfh-cmd="rejectSaleOffer" data-id="${esc(o.id)}">Cancelar</button></span></span></li>`).join("")}</ul>`) : "") +
      sec("Suas negociações de compra", negs.length ? `<ul class="tfh-list">${negs.map((n) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(n.playerName || nm(n.playerId))}</b><small>${esc(clubName(s, D, n.sellerClubId))} · ${n.status === "awaiting_window" ? "acordo fechado, aguardando janela" : "em andamento"}</small></span><span class="tfh-side">${Number(n.amount ?? n.fee) > 0 ? `<em>${money(n.amount ?? n.fee)}</em>` : ""}<button type="button" class="tfh-btn" data-tfh-negotiate="${esc(n.playerId)}">Abrir</button></span></li>`).join("")}</ul>` : "", "Nenhuma negociação aberta. Use Buscar jogadores.") +
      sec("Sondagens em andamento", inqsF.length ? `<ul class="tfh-list">${inqsF.map((i) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(i.playerName || nm(i.playerId))}</b><small>${esc(clubName(s, D, i.clubId))} · ${inqLabel(i)}</small></span><span class="tfh-side"><button type="button" class="tfh-btn" data-tfh-negotiate="${esc(i.playerId)}">Abrir</button></span></li>`).join("")}</ul>` : "", "Sem sondagens abertas.") +
      historyBlock() +
      `<p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-cmd="generateSaleInterest">Ver quem tem interesse nos meus jogadores</button></p>`;
  }

  function elenco(s, D, club) {
    const prefs = s.coachCareer?.offerPreferences || { listedIds: [], loanListedIds: [], blockedIds: [] };
    const stOf = (p) => (prefs.blockedIds || []).includes(p.id) ? "Intransferível" : (prefs.listedIds || []).includes(p.id) ? "À venda" : (prefs.loanListedIds || []).includes(p.id) ? "Para empréstimo" : "Disponível a propostas";
    const ps = (club.roster || []).filter((p) => p.id !== "hero").slice().sort((a, b) => ovrOf(b) - ovrOf(a));
    const btn = (p, status, label) => `<button type="button" class="tfh-btn" data-tfh-cmd="setCoachPlayerOfferStatus" data-pid="${esc(p.id)}" data-status="${status}">${label}</button>`;
    return MS().clubSubNav("elenco") + `<ul class="tfh-list">${ps.map((p) => `<li class="tfh-row"><span class="tfh-main"><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.age)} anos · GER ${ovrOf(p)} · ${esc(stOf(p))}</small></span><span class="tfh-side"><em>${money(valueOf(p))}</em><span class="tfh-acts">${btn(p, "listed", "Vender")}${btn(p, "loan_listed", "Emprestar")}${btn(p, "blocked", "Segurar")}${btn(p, "available", "Limpar")}</span></span></li>`).join("")}</ul>`;
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
    const qt = root.ProLifeApp?.marketQuote?.(s, p.id, sellerId) || {};
    const R2 = root.ProLifeTransferRulesV2, rival = !!qt.rival, key = !!qt.key, xtv = qt.xTV || valueOf(p), minimum = qt.minimum || R2.minimumOffer(xtv, false);
    let monthly = Number(p.salary) || 0; try { monthly = Number(root.ProLifePlayerEconomy?.expectedSalary?.(p, club)) || monthly; } catch (e) {}
    const offerBox = (label, def, act, extra) => `<div class="tfh-offer"><label>${label}<input type="number" min="1" step="0.1" inputmode="decimal" data-tfh-offer value="${Math.max(Number(def) || 0, Math.ceil(minimum / 1e5) / 10)}"> <small>mi</small></label><button type="button" class="tfh-btn primary" data-tfh-send="${act}" ${extra || ""}>Enviar proposta</button></div>`;
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
      panel = `<p class="tfh-note"><b>Sondagem recusada</b> (${inq.playerDecision === "rejected" ? "jogador sem interesse" : "clube não autoriza"}). ${left > 0 ? `Nova consulta em ${left} dia(s).` : ""}</p><p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-send="dismiss" data-id="${esc(inq.id)}">Excluir da lista</button></p>` + (left > 0 ? "" : `<p class="tfh-actions"><button type="button" class="tfh-btn primary" data-tfh-send="inquire">Consultar interesse</button></p>`);
    } else panel = `<p class="tfh-note">Antes de propor, consulte o interesse do jogador e a disposição do clube vendedor.</p><p class="tfh-actions"><button type="button" class="tfh-btn primary" data-tfh-send="inquire">Consultar interesse</button></p>`;
    const info = `<div class="mk-terms"><span><small>Pedido mínimo</small><b>${money(minimum)}</b></span><span><small>Luvas (6 meses de salário${rival ? ", dobro por ser rival" : ""})</small><b>${money(R2.gloves(monthly, rival))}</b></span><span><small>Comissão de agente</small><b>não há</b></span></div>${key ? `<p class="tfh-note">Jogador-chave do clube: só ouvem propostas a partir de 135% do valor.</p>` : ""}${rival ? `<p class="tfh-note">Rival histórico: o clube cobra mais caro e o jogador só aceita se você pagar mais.</p>` : ""}`;
    const loansOn = s.coachCareer?.settings?.loans === "on";
    const lt = R2.loanTerms(valueOf(p), st.loanMonths), listed = R2.canLoanOut(p, (g.playersByClub?.(s, sellerId) || seller?.roster || []), s);
    const loan = `<div class="mk-loan"><label>Duração<select data-tfh-lm>${R2.LOAN_MONTHS.map((m) => `<option value="${m}" ${st.loanMonths === m ? "selected" : ""}>${m} meses</option>`).join("")}</select></label><label class="mk-chk2"><input type="checkbox" data-tfh-lo ${st.loanOpt ? "checked" : ""}> Opção de compra</label></div><div class="mk-terms"><span><small>Taxa do empréstimo</small><b>${money(lt.fee)}</b></span><span><small>Salário pago por você</small><b>100%</b></span><span><small>Opção de compra</small><b>${st.loanOpt ? money(lt.buyOption) + " (valor +15%)" : "sem opção"}</b></span></div>${listed ? "" : `<p class="tfh-note">Jogador-chave: o clube só empresta quem colocou na lista de empréstimo.</p>`}${loansOn ? "" : `<p class="tfh-note">Empréstimos estão desligados nas configurações desta carreira.</p>`}${w.open ? "" : `<p class="tfh-note">Janela fechada: o empréstimo só pode ser fechado com o mercado aberto.</p>`}<p class="tfh-actions"><button type="button" class="tfh-btn primary" data-tfh-send="loan" ${listed && w.open && loansOn ? "" : "disabled"}>Pedir empréstimo</button></p>`;
    return back + MS().profile(env(s, D), p, st, { head, panel: info + panel, loan, rival, key, minimum });
  }

  // "Gestão": scouting, listas, contratos, cláusulas, finanças e histórico (central completa de transferências), dentro do Mercado.
  function gestao(s, D) {
    const V = root.ProLifeCoachCareerView;
    let inner = "";
    try { if (["lista", "recebidas", "propostas", "emprestimos"].includes(V?.state?.dealTab)) V.setDealTab("contratos"); } catch (e) {}
    try { inner = V?.renderMarket?.(s, D) || ""; } catch (e) {
      try { console.error("[mercado] gestão falhou", e); V?.setTab?.("proposals"); inner = V?.renderMarket?.(s, D) || ""; } catch (e2) { inner = ""; }
    }
    return (tab === "gestao" ? MS().clubSubNav("gestao") : "") + `<div class="tfh-embed tfh-area-${tab}">${inner || '<p class="tfh-note">Não foi possível carregar a gestão agora. <button type="button" class="tfh-btn" data-tfh-tab="gestao">Tentar de novo</button></p>'}</div>`;
  }

  function html() {
    const c = ctx();
    let body;
    if (!c) body = `<p class="tfh-note">O Mercado está disponível na carreira de treinador.</p>`;
    else {
      const club = c.D.club(c.s);
      const view = { geral, mundo, negociacoes, comprados, vendidos, emp_in: empIn, emp_out: empOut, elenco, gestao, lista, pesquisa, avancada, scout: pesquisa }[tab] || geral;
      body = !club ? `<p class="tfh-note">Assine com um clube para usar o mercado.</p>` : (negPid ? negotiation : view)(c.s, c.D, club);
      if (flash) body = `<p class="tfh-flash" role="status">${esc(flash)}</p>` + body;
    }
    const side = SIDE.map(([id, l, ids]) => `<button type="button" role="tab" class="${ids.includes(tab) ? "active" : ""}" aria-selected="${ids.includes(tab)}" data-tfh-tab="${id}">${l}</button>`).join("");
    return `<div class="sm27-dialog-backdrop" data-tfh-close></div><section class="sm27-dialog tfh-dialog" role="dialog" aria-modal="true" aria-label="Mercado"><header class="sm27-dialog-head"><button type="button" class="sm27-dialog-back" data-tfh-back aria-label="Voltar">‹</button><h2>Mercado</h2><button type="button" class="sm27-dialog-x" data-tfh-close aria-label="Fechar">×</button></header><div class="tfh-shell"><nav class="tfh-sidenav" role="tablist" aria-label="Seções do Mercado">${side}</nav><div class="tfh-body">${body}</div></div></section>`;
  }
  function open() {
    if (!layer) { layer = doc.createElement("div"); layer.className = "sm27-dialog-layer"; doc.body.appendChild(layer); doc.body.classList.remove("sm27-menu-open"); }
    const keep = layer.querySelector(".tfh-body")?.scrollTop || 0, focused = doc.activeElement?.hasAttribute?.("data-tfh-pq") ? "pq" : null;
    layer.innerHTML = html();
    const b = layer.querySelector(".tfh-body"); if (b) b.scrollTop = keep;
    if (focused) { const el = layer.querySelector("[data-tfh-pq]"); if (el && el.type === "search") { el.focus(); el.setSelectionRange?.(el.value.length, el.value.length); } }
  }
  function leave() { const onLaunch = !!doc.querySelector(".tfh-launch"); close(); if (onLaunch) { try { root.ProLifeGoHome?.(); } catch (e) {} } }
  function close() { if (layer) { layer.remove(); layer = null; } negPid = null; flash = ""; tabHist.length = 0; }
  const cmd = (a, d) => { const ok = root.ProLifeSM27Cmd?.(a, d); const tx = doc.getElementById("toast"); flash = (tx && tx.textContent) || (ok ? "Ação concluída." : "Não foi possível concluir."); if (tx) tx.style.display = "none"; if (layer) open(); return ok; };

  function negotiate(id) { negPid = id; st.ptab = "perfil"; flash = ""; open(); }
  function send(el) {
    const c = ctx(); if (!c) return;
    const act = el.dataset.tfhSend, p = GF()?.playerById?.(c.s, negPid), sellerId = p?.clubId;
    const val = Math.round((Number(layer.querySelector("[data-tfh-offer]")?.value) || 0) * 1e6);
    if (act === "dismiss") { cmd("dismissInquiry", { id: el.dataset.id }); negPid = null; if (layer) open(); return; }
    if (act === "inquire") cmd("coachInquiry", { clubId: sellerId, playerId: negPid });
    else if (act === "offer") cmd("counterRecruit", { clubId: sellerId, playerId: negPid, offer: val });
    else if (act === "revise") cmd("reviseCoachDeal", { id: el.dataset.id, offer: val });
    else if (act === "loan") cmd("recruit", { clubId: sellerId, playerId: negPid, dealType: "loan", loanDays: R2x().loanTerms(0, st.loanMonths).days, salaryShare: 100, buyOption: st.loanOpt ? "on" : "off" });
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
      tab = "negociacoes"; negPid = direct; flash = ""; directPending = true; setTimeout(() => { directPending = false; open(); }, 0);
      return;
    }
    ev.preventDefault(); ev.stopImmediatePropagation();
    tab = (msg && TABS.some((x) => x[0] === msg.dataset.msgTab)) ? msg.dataset.msgTab : "negociacoes"; negPid = null; flash = "";
    if (tab === "scout") { tab = "pesquisa"; st.psub = "scout"; }
    if (AREA_OF[tab === "pesquisa" ? "scout" : tab]) { try { root.ProLifeCoachCareerView?.setMarketArea?.(AREA_OF[tab === "pesquisa" ? "scout" : tab]); } catch (e) {} }
    setTimeout(open, 0);
  }, true);

  // Página de Mercado do treinador = só um atalho: abre o Mercado novo automaticamente (um único mercado).
  try {
    new MutationObserver(() => {
      const l = doc.querySelector(".tfh-launch:not([data-tfh-auto])");
      if (!l || layer || directPending || !ctx()) return;
      l.setAttribute("data-tfh-auto", "1");
      tab = "negociacoes"; negPid = null; flash = ""; setTimeout(open, 0);
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
      if (ar) { if (ar === "observacao") { tab = "pesquisa"; st.psub = "scout"; } else tab = ar === "squad" ? "elenco" : ar === "overview" ? "geral" : "gestao"; }
      setTimeout(() => { if (layer && isEmbed()) open(); }, 90);
      return;
    }
    if (t.closest("[data-sm27-market-hub]")) { ev.preventDefault(); tab = "geral"; open(); return; }
    if (!layer) return;
    let el;
    if (t.closest("[data-tfh-close]")) { leave(); return; }
    if (t.closest("[data-tfh-back]")) {
      if (negPid) { negPid = null; flash = ""; open(); return; }
      const prev = tabHist.pop(); if (!prev) { leave(); return; } if (prev) { tab = prev; flash = ""; if (AREA_OF[prev]) { try { root.ProLifeCoachCareerView?.setMarketArea?.(AREA_OF[prev]); } catch (e) {} } open(); }
      return;
    }
    if ((el = t.closest("[data-tfh-tab]"))) {
      let nt = el.dataset.tfhTab; negPid = null; flash = "";
      if (nt === "scout") { nt = "pesquisa"; st.psub = "scout"; }
      try { layer.querySelector(".csh-detail.is-open .csh-detail-close")?.click(); } catch (e) {}
      if (AREA_OF[nt] && (nt !== tab || nt !== "gestao")) {
        const V = root.ProLifeCoachCareerView, cur = V?.state?.marketArea;
        if (nt !== "gestao" || nt !== tab || ["observacao", "squad", "overview"].includes(cur)) { try { V?.setMarketArea?.(AREA_OF[nt]); } catch (e) {} }
      }
      if (nt !== tab) { tabHist.push(tab); if (tabHist.length > 20) tabHist.shift(); }
      tab = nt; open(); return;
    }
    if ((el = t.closest("[data-tfh-wf]"))) { st.world.status = el.dataset.tfhWf; st.world.page = 0; open(); return; }
    if ((el = t.closest("[data-tfh-pg]"))) { const [k, d] = el.dataset.tfhPg.split(":"), f = PAGE_FIELD[k]; if (f) { st[f[0]][f[1]] = Math.max(0, (Number(st[f[0]][f[1]]) || 0) + Number(d)); } open(); return; }
    if ((el = t.closest("[data-tfh-ptab]"))) { st.ptab = el.dataset.tfhPtab; flash = ""; open(); return; }
    if ((el = t.closest("[data-tfh-profile]"))) { negotiate(el.dataset.tfhProfile); return; }
    if ((el = t.closest("[data-tfh-psub]"))) {
      st.psub = el.dataset.tfhPsub; st.pq.page = st.pq.cpage = st.pq.spage = 0; st.pq.clubId = ""; st.pq.nat = ""; flash = "";
      if (st.psub === "scout") { try { root.ProLifeCoachCareerView?.setMarketArea?.("observacao"); } catch (e) {} }
      open(); return;
    }
    if ((el = t.closest("[data-tfh-club]"))) { st.pq.clubId = el.dataset.tfhClub; st.pq.lpage = 0; open(); return; }
    if ((el = t.closest("[data-tfh-nat]"))) { st.pq.nat = el.dataset.tfhNat; st.pq.npage = 0; open(); return; }
    if (t.closest("[data-tfh-adv-run]")) { st.adv.run = true; st.adv.page = 0; flash = ""; open(); return; }
    if (t.closest("[data-tfh-adv-clear]")) { st.adv = freshAdv(); open(); return; }
    if ((el = t.closest("[data-tfh-player]"))) { root.ProLifeSM27Squad?.openPlayerFor?.(ctx(), el.dataset.tfhPlayer); return; }
    if ((el = t.closest("[data-tfh-star]"))) { cmd("toggleCoachShortlist", { clubId: el.dataset.club, playerId: el.dataset.tfhStar }); return; }
    if ((el = t.closest("[data-tfh-negotiate]"))) { negotiate(el.dataset.tfhNegotiate); return; }
    if (t.closest("[data-tfh-negback]")) { negPid = null; flash = ""; open(); return; }
    if ((el = t.closest("[data-tfh-send]"))) { send(el); return; }
    if ((el = t.closest("[data-tfh-counter-open]"))) { counterFor = counterFor === el.dataset.tfhCounterOpen ? null : el.dataset.tfhCounterOpen; open(); return; }
    if ((el = t.closest("[data-tfh-counter-send]"))) {
      const form = el.closest("[data-tfh-counter-form]"), mi = Number(String(form?.querySelector("[data-tfh-counter-amount]")?.value || "").replace(",", "."));
      const ok = cmd("counterSaleOffer", { id: el.dataset.tfhCounterSend, amount: Math.round(mi * 1e6) });
      if (ok !== false) counterFor = null;
      open(); return;
    }
    if ((el = t.closest("[data-tfh-inv]"))) {
      const a = el.dataset.tfhInv, act = a === "accept" || a === "reject" ? a : "negotiate";
      const ok = cmd("respondInvestorDeal", { id: el.dataset.id, action: act, ask: act === "negotiate" ? a : undefined });
      if (ok) { const c2 = ctx(); const r = c2?.s?.coachCareer?.investors?.lastReply; if (r) { flash = r; open(); } }
      return;
    }
    if ((el = t.closest("[data-tfh-cmd]"))) {
      const a = el.dataset.tfhCmd;
      let who = "";
      if (a === "acceptSaleOffer" || a === "rejectSaleOffer") { const row = el.closest(".tfh-row"); who = row?.querySelector("b")?.textContent || ""; }
      const ok = cmd(a, a === "setCoachPlayerOfferStatus" ? { playerId: el.dataset.pid, status: el.dataset.status } : el.dataset.id ? { id: el.dataset.id } : {});
      if (who && ok && /^Ação concluída/.test(flash)) { flash = a === "acceptSaleOffer" ? `Proposta por ${who} aceita. Se a janela estiver fechada, a venda fica aguardando a abertura.` : `Proposta por ${who} recusada.`; if (layer) open(); }
    }
  }, true);
  const onField = (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!layer || !t) return;
    let el;
    if ((el = t.closest("[data-tfh-lm]"))) { st.loanMonths = Number(el.value) || 12; open(); return; }
    if ((el = t.closest("[data-tfh-lo]"))) { st.loanOpt = el.checked; open(); return; }
    if ((el = t.closest("[data-tfh-wl]"))) { st.world.league = el.value; st.world.page = 0; open(); return; }
    if ((el = t.closest("[data-tfh-wc]"))) { st.world.country = el.value; st.world.page = 0; open(); return; }
    if ((el = t.closest("[data-tfh-pq]"))) { st.pq.text = el.value; st.pq.page = st.pq.cpage = st.pq.spage = st.pq.npage = 0; open(); return; }
    if ((el = t.closest("[data-tfh-onlylisted]"))) { st.pq.onlyListed = el.checked; st.pq.lpage = 0; open(); return; }
    if ((el = t.closest("[data-tfh-attr]"))) { const k = el.dataset.tfhAttr, a = st.adv.attrs; if (el.checked && a.length < 5 && !a.includes(k)) a.push(k); else if (!el.checked) st.adv.attrs = a.filter((x) => x !== k); open(); return; }
    if ((el = t.closest("[data-tfh-af]"))) { st.adv[el.dataset.tfhAf] = el.value; st.adv.page = 0; open(); return; }
    if ((el = t.closest("[data-tfh-prio]"))) {
      const [clubId, playerId] = el.dataset.tfhPrio.split("|"), ok = cmd("setCoachTargetPriority", { clubId, playerId, priority: el.value });
      if (ok !== false && /^Ação concluída/.test(flash)) { flash = "Prioridade atualizada."; if (layer) open(); }
    }
  };
  // Investidores vivem nas Finanças (fora do Mercado, que é só de jogadores): mesmo botão, sem o diálogo do Mercado.
  doc.addEventListener("click", (ev) => {
    if (layer) return;
    const el = ev.target instanceof Element ? ev.target.closest("[data-tfh-inv]") : null;
    if (!el || !ctx()) return;
    const a = el.dataset.tfhInv, act = a === "accept" || a === "reject" ? a : "negotiate";
    const ok = cmd("respondInvestorDeal", { id: el.dataset.id, action: act, ask: act === "negotiate" ? a : undefined });
    const tx = doc.getElementById("toast"); if (tx) tx.style.display = "";
    root.ProLifeSM27Finance?.open?.();
    return ok;
  });
  doc.addEventListener("change", onField);
  doc.addEventListener("input", (ev) => { const t = ev.target; if (layer && t?.matches?.('input[type="search"][data-tfh-pq]')) onField(ev); });
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") leave(); });

  root.ProLifeTransferHub = { open, close, html, investorHtml: () => { const c = ctx(); return c ? investorSection(c.s) : ""; } };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeTransferHub;
})(typeof window !== "undefined" ? window : globalThis);
