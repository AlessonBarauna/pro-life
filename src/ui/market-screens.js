(function (root) {
  "use strict";
  // PRO LIFE — telas novas do Mercado (Mundo, Clube, Lista, Pesquisa, Pesquisa avançada).
  // Só desenha HTML a partir do estado; quem age é o hub (fc27-transfer-hub.js).
  const R = () => root.ProLifeTransferRulesV2 || (typeof require === "function" ? require("../domain/transfer-rules-v2.js") : null);
  const PER = 12;

  function pager(e, key, total, page) {
    const pages = Math.max(1, Math.ceil(total / PER));
    return `<div class="tfh-pager"><button type="button" class="tfh-btn" data-tfh-pg="${key}:-1" ${page <= 0 ? "disabled" : ""} aria-label="Página anterior">‹</button><span>${total} resultado(s) · <b>${page + 1}/${pages}</b></span><button type="button" class="tfh-btn" data-tfh-pg="${key}:1" ${page >= pages - 1 ? "disabled" : ""} aria-label="Próxima página">›</button></div>`;
  }
  const slice = (arr, page) => arr.slice(page * PER, page * PER + PER);
  const clampPage = (st, key, total) => { const max = Math.max(0, Math.ceil(total / PER) - 1); if (st[key] > max) st[key] = max; if (st[key] < 0) st[key] = 0; return st[key]; };
  const opt = (v, cur, l) => `<option value="${e_(v)}" ${String(cur) === String(v) ? "selected" : ""}>${e_(l ?? v)}</option>`;
  const e_ = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dateOf = (e, day) => { const d = Number(day); if (!Number.isFinite(d)) return "—"; return new Date(Date.UTC(2026, 0, e.s.world === "legacy" ? 5 : 1) + d * 86400000).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "2-digit" }); };
  const crest = (id) => { try { return root.ProLifeClubCrests?.render?.(id, { size: "sm" }) || ""; } catch (x) { return ""; } };
  const posChip = (p) => `<i class="mk-pos mk-pos-${e_(p.pos || "x")}">${e_(p.primaryPosition || p.pos || "—")}</i>`;
  const ger = (e, p) => `<i class="mk-ger">${e.ovrOf(p)}</i>`;

  // ---------- Mundo ----------
  function mundo(e, st) {
    const { s, D, GF } = e, w = st.world;
    let deals = (s.worldLiveMarket?.deals || []).filter((d) => d.state !== "cancelled" && d.executionStatus !== "cancelled");
    const group = { rumor: ["rumor", "scouting"], neg: ["negotiating", "offer"], done: ["completed"] };
    if (w.status === "big") deals = deals.filter((d) => Number(d.value) >= 20e6);
    else if (w.status !== "all") deals = deals.filter((d) => group[w.status].includes(d.state));
    const clubOf = (id) => GF()?.clubById?.(s, id) || {};
    if (w.league) deals = deals.filter((d) => [d.fromClubId, d.toClubId].some((id) => clubOf(id).leagueId === w.league));
    if (w.country) deals = deals.filter((d) => [d.fromClubId, d.toClubId].some((id) => clubOf(id).country === w.country));
    deals.sort((a, b) => (b.updatedDay || 0) - (a.updatedDay || 0));
    const page = clampPage(w, "page", deals.length);
    const countries = [...new Set((s.globalFootball?.clubs || []).map((c) => c.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const chips = [["all", "Tudo"], ["rumor", "Rumores"], ["neg", "Negociações"], ["done", "Fechados"], ["big", "Grandes negócios"]].map(([k, l]) => `<button type="button" class="tfh-chip ${w.status === k ? "on" : ""}" data-tfh-wf="${k}">${l}</button>`).join("");
    const sels = `<select data-tfh-wc aria-label="País"><option value="">Todos os países</option>${countries.map((c) => opt(c, w.country)).join("")}</select><select data-tfh-wl aria-label="Liga"><option value="">Todas as ligas</option>${e.leagues(s).map(([id, n]) => opt(id, w.league, n)).join("")}</select>`;
    const rows = slice(deals, page).map((d) => {
      const p = GF()?.playerById?.(s, d.playerId), st2 = e.DEAL[d.executionStatus === "executed" ? "completed" : d.state] || ["—", "out"];
      return `<tr><td>${p ? posChip(p) : ""}</td><td>${p ? ger(e, p) : ""}</td><td class="mk-name">${e_(p?.name || d.playerId)}</td><td class="mk-clubs">${crest(d.fromClubId)}${e_(e.clubName(s, D, d.fromClubId))} <em class="mk-arrow">→</em> ${crest(d.toClubId)}${e_(e.clubName(s, D, d.toClubId))}</td><td>${e.money(d.value)}</td><td><i class="tfh-badge ${st2[1]}">${st2[0]}</i></td><td>${dateOf(e, d.updatedDay ?? d.day)}</td></tr>`;
    }).join("");
    const table = deals.length ? `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Pos.</th><th>GER</th><th>Jogador</th><th>Clube anterior » novo</th><th>Taxa</th><th>Situação</th><th>Data</th></tr></thead><tbody>${rows}</tbody></table></div>${pager(e, "world", deals.length, page)}` : `<p class="tfh-note">Nenhuma movimentação com esses filtros. O mercado esquenta quando as janelas abrem.</p>`;
    return `<div class="tfh-filters">${chips}${sels}</div>${table}`;
  }

  // ---------- Clube: subabas de histórico ----------
  const CLUB_SUBS = [["negociacoes", "Negociações"], ["comprados", "Comprados"], ["vendidos", "Vendidos"], ["emp_in", "Entradas por empréstimo"], ["emp_out", "Saídas por empréstimo"], ["elenco", "Meu elenco"], ["gestao", "Contratos"]];
  function clubSubNav(sub) { return `<nav class="mk-sub" role="tablist">${CLUB_SUBS.map(([id, l]) => `<button type="button" role="tab" class="${sub === id ? "on" : ""}" data-tfh-tab="${id}">${l}</button>`).join("")}</nav>`; }

  function transferRows(e, kind) {
    const { s, D } = e, me = D.club(s)?.name;
    const all = (D.Career.init(s).transfers || []).filter((t) => t && t.player && t.transferType !== "loan");
    return all.filter((t) => kind === "in" ? t.to === me : t.from === me && t.to !== me);
  }
  function histTable(e, rows, empty) {
    if (!rows.length) return `<p class="tfh-note">${empty}</p>`;
    return `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Pos.</th><th>Jogador</th><th>Clube</th><th>Taxa</th><th>Data</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${e_(r.pos || "—")}</td><td class="mk-name">${e_(r.player)}</td><td class="mk-clubs">${e_(r.club)}</td><td>${r.fee > 0 ? e.money(r.fee) : "Grátis"}</td><td>${dateOf(e, r.day)}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function comprados(e) { const me = e.D.club(e.s)?.name; return histTable(e, transferRows(e, "in").map((t) => ({ pos: t.pos, player: t.player, club: t.from, fee: t.fee, day: t.day })), "Você ainda não contratou ninguém neste jogo. Os reforços aparecem aqui."); }
  function vendidos(e) { return histTable(e, transferRows(e, "out").map((t) => ({ pos: t.pos, player: t.player, club: t.to, fee: t.fee, day: t.day })), "Você ainda não vendeu ninguém. As vendas aparecem aqui."); }
  function loansTable(e, dir) {
    const { s, D, GF } = e, me = s.clubId;
    const list = (s.coachCareer?.loans || []).filter((l) => dir === "in" ? l.toClubId === me : l.fromClubId === me);
    if (!list.length) return `<p class="tfh-note">${dir === "in" ? "Nenhum jogador emprestado ao seu clube." : "Nenhum jogador seu emprestado a outro clube."}</p>`;
    return `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Jogador</th><th>${dir === "in" ? "Clube de origem" : "Clube que recebeu"}</th><th>Taxa</th><th>Opção de compra</th><th>Termina</th><th>Situação</th></tr></thead><tbody>${list.map((l) => { const p = GF()?.playerById?.(s, l.playerId) || D.club(s)?.roster?.find((x) => x.id === l.playerId); return `<tr><td class="mk-name">${e_(p?.name || l.playerId)}</td><td class="mk-clubs">${e_(e.clubName(s, D, dir === "in" ? l.fromClubId : l.toClubId))}</td><td>${e.money(l.fee)}</td><td>${Number(l.buyOption) > 0 ? e.money(l.buyOption) : "—"}</td><td>${dateOf(e, l.dueDay)}</td><td>${l.returned ? "Devolvido" : "Em andamento"}</td></tr>`; }).join("")}</tbody></table></div>`;
  }

  // ---------- Lista preferencial ----------
  function lista(e, st) {
    const { s, D, GF } = e, rules = R(), list = s.coachCareer?.shortlist || [];
    const rows = list.map((it) => { const p = GF()?.playerById?.(s, it.playerId); return p && p.clubId !== s.clubId ? { it, p, v: e.valueOf(p) } : null; }).filter(Boolean);
    // Jogador que já é do seu clube (contratado, ou lista feita em outro clube) não fica na lista de alvos.
    if (s.coachCareer && list.some((it) => GF()?.playerById?.(s, it.playerId)?.clubId === s.clubId)) s.coachCareer.shortlist = list.filter((it) => GF()?.playerById?.(s, it.playerId)?.clubId !== s.clubId);
    const rl = R(), budget = Number(D.club(s)?.budget) || 0, L = st.lista || { tab: "todos", sort: "prioridade" };
    const tabs = [["todos", "Todos"], ["venda", "À venda"], ["contrato", "Contrato acabando"], ["orcamento", "Cabe no orçamento"]];
    const keep = { todos: () => true, venda: ({ p }) => rl.aiListing(p, s) === "sale", contrato: ({ p }) => p.clubId && rl.monthsLeft(p, s) < 12, orcamento: ({ v }) => v <= budget };
    const total = rows.length, pr = { alta: 0, media: 1, baixa: 2 };
    const sorters = { prioridade: (a, b) => pr[a.it.priority || "media"] - pr[b.it.priority || "media"] || e.ovrOf(b.p) - e.ovrOf(a.p), geral: (a, b) => e.ovrOf(b.p) - e.ovrOf(a.p), potencial: (a, b) => (Number(b.p.potential) || 0) - (Number(a.p.potential) || 0), valor: (a, b) => a.v - b.v, idade: (a, b) => a.p.age - b.p.age };
    const shown = rows.filter(keep[L.tab] || keep.todos).sort(sorters[L.sort] || sorters.prioridade);
    rows.length = 0; rows.push(...shown);
    const bar = `<div class="tfv-bar2"><nav class="mk-sub" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" class="${L.tab === k ? "on" : ""}" data-tfh-lt="${k}">${l}</button>`).join("")}</nav><label class="tfv-sort">Ordem<select data-tfh-ls>${[["prioridade", "Prioridade"], ["geral", "Geral"], ["potencial", "Potencial"], ["valor", "Menor valor"], ["idade", "Mais jovem"]].map(([k, l]) => opt(k, L.sort, l)).join("")}</select></label></div>`;
    const head = bar + `<p class="mk-count"><b>${total}</b> de ${rules.SHORTLIST_LIMIT} jogadores${rows.length !== total ? " · " + rows.length + " no filtro" : ""}</p>`;
    if (!total) return head + `<p class="tfh-note">Sua lista está vazia. Toque na estrela ☆ de um jogador na Pesquisa para acompanhá-lo aqui.</p>`;
    if (!rows.length) return head + `<p class="tfh-note">Nenhum jogador da lista neste filtro.</p>`;
    const body = rows.map(({ it, p, v }) => {
      const al = rules.shortlistAlerts(it, p, s, v).map((a) => `<span class="mk-alert mk-alert-${a.k}">${e_(a.text)}</span>`).join("");
      const pr = it.priority || "media";
      return `<tr><td>${posChip(p)}</td><td>${ger(e, p)}</td><td class="mk-name"><button type="button" class="tfh-player" data-tfh-profile="${e_(p.id)}">${e_(p.name)}</button>${al}</td><td class="mk-clubs">${e_(e.clubName(s, D, p.clubId))}</td><td>${p.age}</td><td>${e.money(v)}</td><td><select data-tfh-prio="${e_(it.clubId)}|${e_(p.id)}" aria-label="Prioridade"><option value="alta" ${pr === "alta" ? "selected" : ""}>Alta</option><option value="media" ${pr === "media" ? "selected" : ""}>Média</option><option value="baixa" ${pr === "baixa" ? "selected" : ""}>Baixa</option></select></td><td class="mk-acts"><button type="button" class="tfh-btn primary" data-tfh-negotiate="${e_(p.id)}">Negociar</button><button type="button" class="tfh-btn" data-tfh-star="${e_(p.id)}" data-club="${e_(it.clubId)}" aria-label="Remover da lista">Remover</button></td></tr>`;
    }).join("");
    return head + `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Pos.</th><th>GER</th><th>Jogador</th><th>Clube</th><th>Idade</th><th>Valor</th><th>Prioridade</th><th></th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  // ---------- Resultado de jogadores (usado na Pesquisa e na Avançada) ----------
  function playerTable(e, rows, page, key) {
    const { s, D } = e, rules = R(), shortlist = s.coachCareer?.shortlist || [];
    if (!rows.length) return `<p class="tfh-note">Nenhum jogador com esses filtros.</p>`;
    const body = slice(rows, page).map((p) => {
      const star = shortlist.some((x) => x.playerId === p.id), lst = rules.LISTING_LABEL[rules.aiListing(p, s)];
      return `<tr><td>${posChip(p)}</td><td>${ger(e, p)}</td><td class="mk-name"><button type="button" class="tfh-player" data-tfh-profile="${e_(p.id)}">${e_(p.name)}</button>${lst ? `<span class="mk-alert mk-alert-sale">${e_(lst)}</span>` : ""}</td><td class="mk-clubs">${e_(e.clubName(s, D, p.clubId))}</td><td>${p.age}</td><td>${Number(p.potential) || "—"}</td><td>${e.money(e.valueOf(p))}</td><td class="mk-acts"><button type="button" class="tfh-btn" data-tfh-star="${e_(p.id)}" data-club="${e_(p.clubId || "")}" aria-pressed="${star}" aria-label="Lista preferencial">${star ? "★" : "☆"}</button><button type="button" class="tfh-btn primary" data-tfh-negotiate="${e_(p.id)}">Negociar</button></td></tr>`;
    }).join("");
    return `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Pos.</th><th>GER</th><th>Jogador</th><th>Clube</th><th>Idade</th><th>Pot.</th><th>Valor</th><th></th></tr></thead><tbody>${body}</tbody></table></div>${pager(e, key, rows.length, page)}`;
  }
  const candidates = (e) => (e.GF()?.activePlayers?.(e.s) || []).filter((p) => p && p.id !== "hero" && p.clubId !== e.s.clubId && !p.academy);

  // ---------- Pesquisa ----------
  const QICON = { todos: "★ ", joias: "🔥 ", barato: "💰 ", contrato: "⏳ ", venda: "🏷 ", emprestimo: "🤝 ", orcamento: "✓ " };
  const PESQ_SUBS = [["jogadores", "Jogadores"], ["clubes", "Clubes"], ["selecoes", "Seleções"], ["scout", "Scouting"]];
  function pesquisaNav(sub) { return `<nav class="mk-sub" role="tablist">${PESQ_SUBS.map(([id, l]) => `<button type="button" role="tab" class="${sub === id ? "on" : ""}" data-tfh-psub="${id}">${l}</button>`).join("")}</nav>`; }
  function pesquisa(e, st) {
    const q = st.pq, sub = st.psub;
    const box = `<label class="mk-q"><span>${sub === "clubes" ? "Nome do clube" : sub === "selecoes" ? "Nome da seleção" : "Nome do jogador"}</span><input type="search" data-tfh-pq value="${e_(q.text)}" placeholder="Digite para buscar"></label>`;
    if (sub === "jogadores") {
      const t = q.text.trim().toLowerCase();
      let ps = candidates(e); if (t) ps = ps.filter((p) => String(p.name || "").toLowerCase().includes(t));
      const rl = R(), budget = Number(e.D.club(e.s)?.budget) || 0;
      ps = rl.quickFilter(ps, q.quick, e.s, e.valueOf, budget);
      if (q.quick !== "joias") ps = ps.map((p) => ({ p, o: e.ovrOf(p) })).sort((a, b) => b.o - a.o).map((x) => x.p);
      ps = ps.slice(0, 400);
      const chips = `<div class="tfv-quick">${rl.QUICK.map(([k, l]) => `<button type="button" class="tfh-chip ${(q.quick || "todos") === k ? "on" : ""}" data-tfh-quick="${k}">${QICON[k] || ""}${l}</button>`).join("")}</div>`;
      const page = clampPage(q, "page", ps.length);
      return pesquisaNav(sub) + box + chips + playerTable(e, ps, page, "pq");
    }
    if (sub === "clubes") {
      const { s, D, GF } = e;
      if (q.clubId) return pesquisaNav(sub) + clubDetail(e, q);
      const t = q.text.trim().toLowerCase();
      let cl = (s.globalFootball?.clubs || []).filter((c) => c.active !== false && c.id !== s.clubId); if (t) cl = cl.filter((c) => String(c.name).toLowerCase().includes(t));
      cl.sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
      const page = clampPage(q, "cpage", cl.length);
      const rows = slice(cl, page).map((c) => `<tr><td class="mk-name">${e_(c.name)}</td><td>${e_(e.leagueName(s, c.leagueId))}</td><td>${e_(c.country || "—")}</td><td>${c.reputation || "—"}</td><td class="mk-acts"><button type="button" class="tfh-btn primary" data-tfh-club="${e_(c.id)}">Ver elenco</button></td></tr>`).join("");
      return pesquisaNav(sub) + box + (cl.length ? `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Clube</th><th>Liga</th><th>País</th><th>Reputação</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${pager(e, "cp", cl.length, page)}` : `<p class="tfh-note">Nenhum clube encontrado.</p>`);
    }
    if (sub === "selecoes") {
      const t = q.text.trim().toLowerCase();
      if (q.nat) { let ps = candidates(e).filter((p) => p.nationality === q.nat).sort((a, b) => e.ovrOf(b) - e.ovrOf(a)).slice(0, 300); const page = clampPage(q, "npage", ps.length); return pesquisaNav(sub) + `<p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-nat="">← Todas as seleções</button> <b>${e_(q.nat)}</b></p>` + playerTable(e, ps, page, "np"); }
      const m = new Map();
      for (const p of candidates(e)) { if (!p.nationality) continue; const c = m.get(p.nationality) || { n: p.nationality, count: 0, top: [] }; c.count++; c.top.push(e.ovrOf(p)); m.set(p.nationality, c); }
      let list = [...m.values()].map((c) => ({ ...c, avg: Math.round(c.top.sort((a, b) => b - a).slice(0, 23).reduce((x, y) => x + y, 0) / Math.min(23, c.top.length)) })).filter((c) => !t || c.n.toLowerCase().includes(t)).sort((a, b) => b.avg - a.avg);
      const page = clampPage(q, "spage", list.length);
      const rows = slice(list, page).map((c) => `<tr><td class="mk-name">${e_(c.n)}</td><td>${c.count}</td><td>${c.avg}</td><td class="mk-acts"><button type="button" class="tfh-btn primary" data-tfh-nat="${e_(c.n)}">Ver jogadores</button></td></tr>`).join("");
      return pesquisaNav(sub) + box + (list.length ? `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Seleção</th><th>Jogadores no mundo</th><th>Força média (23 melhores)</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${pager(e, "sp", list.length, page)}` : `<p class="tfh-note">Nenhuma seleção encontrada.</p>`);
    }
    return pesquisaNav(sub);
  }
  function clubDetail(e, q) {
    const { s, D, GF } = e, c = GF()?.clubById?.(s, q.clubId);
    if (!c) return `<p class="tfh-note">Clube indisponível.</p>`;
    const ps = (GF()?.playersByClub?.(s, c.id) || []).filter((p) => p.id !== "hero").sort((a, b) => e.ovrOf(b) - e.ovrOf(a));
    const rules = R(), view = q.onlyListed ? ps.filter((p) => rules.aiListing(p, s) !== "none") : ps;
    const page = clampPage(q, "lpage", view.length);
    return `<p class="tfh-actions"><button type="button" class="tfh-btn" data-tfh-club="">← Todos os clubes</button> <b>${e_(c.name)}</b> · ${e_(e.leagueName(s, c.leagueId))}</p><label class="tfh-search chk mk-chk"><input type="checkbox" data-tfh-onlylisted ${q.onlyListed ? "checked" : ""}> Só jogadores à venda ou para empréstimo</label>` + playerTable(e, view, page, "lp");
  }

  // ---------- Pesquisa avançada ----------
  function avancada(e, st) {
    const f = st.adv, rules = R(), { s, D, GF } = e;
    const budget = Number(D.club(s)?.budget) || 0, roster = (D.club(s)?.roster || []).filter((p) => p.id !== "hero");
    const avgSal = roster.length ? roster.reduce((a, p) => a + (Number(p.salary) || 0), 0) / roster.length : 0;
    const eff = Object.assign({}, f, { budgetValue: budget, salMax: f.payroll && avgSal ? String(Math.round(avgSal * 1.25 / 1e3)) : f.salMax });
    const num = (k, l, ph) => `<label>${l}<input type="number" inputmode="numeric" data-tfh-af="${k}" value="${e_(f[k] || "")}" placeholder="${ph || ""}"></label>`;
    const sel = (k, l, first, opts) => `<label>${l}<select data-tfh-af="${k}"><option value="">${first}</option>${opts}</select></label>`;
    const countries = [...new Set((s.globalFootball?.clubs || []).map((c) => c.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const cand = candidates(e), nats = [...new Set(cand.map((p) => p.nationality).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const roles = Object.values(rules.ROLES).concat(["Goleiro"]);
    const clubOf = (p) => GF()?.clubById?.(s, p.clubId);
    const rows = rules.advancedFilter(cand, eff, s, e.valueOf, clubOf).sort((a, b) => e.ovrOf(b) - e.ovrOf(a));
    const tog = (k, l) => `<button type="button" class="tfv-tog ${f[k] ? "on" : ""}" data-tfh-tog="${k}" aria-pressed="${!!f[k]}"><i></i>${l}</button>`;
    const attrs = rules.ATTRS.map(([k, l]) => `<label class="mk-attr ${f.attrs.includes(k) ? "on" : ""}"><input type="checkbox" data-tfh-attr="${k}" ${f.attrs.includes(k) ? "checked" : ""} ${!f.attrs.includes(k) && f.attrs.length >= 5 ? "disabled" : ""}> ${l} ≥ 75</label>`).join("");
    const saved = s.coachCareer?.savedSearches || [];
    const savedHtml = `<div class="tfv-saved"><b>Pesquisas salvas</b>${saved.map((x) => `<span class="tfv-ss"><button type="button" data-tfh-ss-load="${e_(x.name)}">${e_(x.name)}</button><button type="button" class="x" data-tfh-ss-del="${e_(x.name)}" aria-label="Apagar ${e_(x.name)}">×</button></span>`).join("") || `<em>nenhuma ainda</em>`}<input type="text" maxlength="24" data-tfh-ss-name placeholder="Nome da pesquisa"><button type="button" class="tfh-btn" data-tfh-ss-save>＋ Salvar</button></div>`;
    const form = `<div class="tfv-adv">
      ${sel("pos", "Posição", "Todas", rules.POSITIONS.map((p) => opt(p, f.pos)).join(""))}
      ${num("ovrMin", "GER mín.", "60")}${num("potMin", "Potencial mín.", "75")}
      <label>Idade<span class="tfv-pair"><input type="number" inputmode="numeric" data-tfh-af="ageMin" value="${e_(f.ageMin || "")}" placeholder="16"><input type="number" inputmode="numeric" data-tfh-af="ageMax" value="${e_(f.ageMax || "")}" placeholder="45"></span></label>
      ${num("valueMax", "Valor máx. (mi)", "500")}${num("salMax", "Salário máx. (mil/mês)", "800")}
      ${sel("contract", "Contrato", "Qualquer", opt("6", f.contract, "Menos de 6 meses") + opt("12", f.contract, "Menos de 1 ano") + opt("24", f.contract, "Menos de 2 anos"))}
      ${sel("nat", "Nacionalidade", "Todas", nats.map((c) => opt(c, f.nat)).join(""))}
      ${sel("country", "País do clube", "Todos", countries.map((c) => opt(c, f.country)).join(""))}
      ${sel("league", "Campeonato", "Todos", e.leagues(s).map(([id, n]) => opt(id, f.league, n)).join(""))}
      ${sel("listing", "Condição", "Qualquer", opt("any", f.listing, "À venda ou empréstimo") + opt("sale", f.listing, "À venda") + opt("loan", f.listing, "Para empréstimo") + opt("free", f.listing, "Agente livre"))}
      ${num("interest", "Clubes interessados", "0")}
      ${sel("role", "Função", "Todas", roles.map((r) => opt(r, f.role)).join(""))}
    </div>
    <div class="tfv-togs">${tog("budget", "Cabe no orçamento")}${tog("payroll", "Salário cabe na folha")}${tog("gems", "Só joias")}<span class="tfv-attrs">${attrs}</span></div>
    ${savedHtml}
    <div class="tfv-runbar"><span><b>${rows.length}</b> jogador(es) com esses filtros</span><button type="button" class="tfh-btn" data-tfh-adv-clear>Apagar filtros</button><button type="button" class="tfh-btn primary" data-tfh-adv-run ${rows.length ? "" : "disabled"}>Ver ${rows.length} jogadores</button></div>`;
    if (!f.run) return form;
    const page = clampPage(f, "page", rows.length);
    return form + playerTable(e, rows.slice(0, 400), page, "af");
  }

    // ---------- Perfil do jogador (6 abas) ----------
  const PTABS = [["perfil", "Perfil"], ["atributos", "Atributos"], ["estatisticas", "Estatísticas"], ["contrato", "Contrato"], ["comparar", "Comparar"], ["relatorio", "Relatório do olheiro"]];
  function bar(label, v) { const n = Math.max(0, Math.min(99, Number(v) || 0)); return `<div class="mk-bar"><span>${e_(label)}</span><i style="--w:${n}%"><b></b></i><em>${n}</em></div>`; }
  function profile(e, p, st, parts) {
    const { s, D } = e, rules = R(), lst = rules.LISTING_LABEL[rules.aiListing(p, s)];
    const tabs = PTABS.map(([id, l]) => `<button type="button" role="tab" class="${st.ptab === id ? "on" : ""}" data-tfh-ptab="${id}">${l}</button>`).join("");
    const star = (s.coachCareer?.shortlist || []).some((x) => x.playerId === p.id);
    const acts = `<span class="mk-pacts"><button type="button" class="tfh-btn" data-tfh-star="${e_(p.id)}" data-club="${e_(p.clubId || "")}" aria-pressed="${star}">${star ? "★ Na lista" : "☆ Lista"}</button><button type="button" class="tfh-btn ${st.ptab === "proposta" ? "on" : "primary"}" data-tfh-ptab="proposta">Fazer proposta</button><button type="button" class="tfh-btn ${st.ptab === "emprestimo" ? "on" : ""}" data-tfh-ptab="emprestimo">Empréstimo</button></span>`;
    const club = e.GF()?.clubById?.(s, p.clubId);
    let body = "";
    const age = p.age, val = e.valueOf(p), months = rules.monthsLeft(p, s);
    if (st.ptab === "perfil") body = `<dl class="mk-dl"><div><dt>Posição</dt><dd>${e_(p.primaryPosition || p.pos)}${(p.secondaryPositions || []).length ? " · " + e_(p.secondaryPositions.join(", ")) : ""}</dd></div><div><dt>Idade</dt><dd>${age} anos</dd></div><div><dt>Geral / potencial</dt><dd>${e.ovrOf(p)} / ${Number(p.potential) || "—"}</dd></div><div><dt>Nacionalidade</dt><dd>${e_(p.nationality || "—")}</dd></div><div><dt>Clube</dt><dd>${e_(e.clubName(s, D, p.clubId))}</dd></div><div><dt>Liga</dt><dd>${e_(club ? e.leagueName(s, club.leagueId) : "—")}</dd></div><div><dt>Valor de mercado</dt><dd>${e.money(val)}</dd></div><div><dt>Função</dt><dd>${e_(rules.roleOf(p) || "—")}</dd></div><div><dt>Situação</dt><dd>${e_(lst || "Sem aviso de venda")}</dd></div><div><dt>Clubes interessados</dt><dd>${rules.interestedCount(p, s)}</dd></div></dl>`;
    else if (st.ptab === "atributos") body = `<div class="mk-bars">${rules.ATTRS.map(([k, l]) => bar(l, p.attrs?.[k])).join("")}</div>`;
    else if (st.ptab === "estatisticas") body = `<dl class="mk-dl"><div><dt>Jogos</dt><dd>${Number(p.appearances) || 0}</dd></div><div><dt>Gols</dt><dd>${Number(p.goals) || 0}</dd></div><div><dt>Minutos</dt><dd>${Number(p.minutes) || 0}</dd></div><div><dt>Disciplina</dt><dd>${Number(p.discipline) || "—"}</dd></div><div><dt>Condição</dt><dd>${Number(p.condition) || "—"}%</dd></div><div><dt>Melhor geral na carreira</dt><dd>${Number(p.peakOvr) || e.ovrOf(p)}</dd></div></dl>${(p.clubHistory || []).length ? `<p class="tfh-note">Passou por: ${e_(p.clubHistory.map((h) => h.club || h.name || h).join(", "))}</p>` : ""}`;
    else if (st.ptab === "contrato") { let sal = Number(p.salary) || 0; try { sal = Number(root.ProLifePlayerEconomy?.expectedSalary?.(p, D.club(s))) || sal; } catch (x) {} const rival = !!parts.rival; body = `<dl class="mk-dl"><div><dt>Contrato até</dt><dd>${rules.contractEndOf(p, s)} (${months} meses)</dd></div><div><dt>Salário esperado</dt><dd>${e.money(sal)} por mês</dd></div><div><dt>Luvas (6 meses de salário)</dt><dd>${e.money(rules.gloves(sal, rival))}${rival ? " · rival paga o dobro" : ""}</dd></div><div><dt>Comissão de agente</dt><dd>Não há</dd></div><div><dt>Pedido mínimo do clube</dt><dd>${e.money(parts.minimum)}${parts.key ? " · jogador-chave: 135% do valor" : ""}</dd></div></dl>`; }
    else if (st.ptab === "comparar") {
      const mine = (D.club(s)?.roster || []).filter((x) => x.id !== "hero" && x.pos === p.pos).sort((a, b) => e.ovrOf(b) - e.ovrOf(a))[0];
      body = mine ? `<table class="mk-table mk-cmp"><thead><tr><th></th><th>${e_(p.shortName || p.name)}</th><th>${e_(mine.shortName || mine.name)} (seu clube)</th></tr></thead><tbody><tr><td>Geral</td><td>${e.ovrOf(p)}</td><td>${e.ovrOf(mine)}</td></tr><tr><td>Idade</td><td>${p.age}</td><td>${mine.age}</td></tr>${rules.ATTRS.map(([k, l]) => `<tr><td>${l}</td><td class="${(p.attrs?.[k] || 0) > (mine.attrs?.[k] || 0) ? "mk-win" : ""}">${p.attrs?.[k] ?? "—"}</td><td class="${(mine.attrs?.[k] || 0) > (p.attrs?.[k] || 0) ? "mk-win" : ""}">${mine.attrs?.[k] ?? "—"}</td></tr>`).join("")}<tr><td>Valor</td><td>${e.money(val)}</td><td>${e.money(e.valueOf(mine))}</td></tr></tbody></table>` : `<p class="tfh-note">Você não tem outro jogador nessa posição para comparar.</p>`;
    } else if (st.ptab === "relatorio") {
      const best = rules.ATTRS.map(([k, l]) => [l, Number(p.attrs?.[k]) || 0]).sort((a, b) => b[1] - a[1]);
      const mine = (D.club(s)?.roster || []).filter((x) => x.id !== "hero" && x.pos === p.pos).sort((a, b) => e.ovrOf(b) - e.ovrOf(a));
      const starter = mine[Math.min(mine.length, p.pos === "GOL" ? 1 : p.pos === "ATA" ? 3 : 4) - 1];
      const verdict = starter ? (e.ovrOf(p) > e.ovrOf(starter) + 2 ? "Seria titular no seu time." : e.ovrOf(p) >= e.ovrOf(starter) ? "Disputaria vaga entre os titulares." : "Entraria como reserva.") : "Não há concorrência na posição.";
      const growth = (Number(p.potential) || 0) - e.ovrOf(p);
      body = `<ul class="mk-rep"><li><b>Pontos fortes:</b> ${e_(best[0][0])} (${best[0][1]}) e ${e_(best[1][0])} (${best[1][1]}).</li><li><b>Ponto fraco:</b> ${e_(best[best.length - 1][0])} (${best[best.length - 1][1]}).</li><li><b>Encaixe:</b> ${verdict}</li><li><b>Evolução:</b> ${growth >= 6 && p.age <= 24 ? "ainda tem bastante a crescer" : growth >= 2 ? "pode crescer um pouco" : "já está perto do teto"}.</li><li><b>Contrato:</b> ${months < 12 ? "perto do fim, boa hora para negociar" : "vínculo longo, o clube pede mais"}.</li></ul>`;
    } else if (st.ptab === "proposta") body = parts.panel;
    else if (st.ptab === "emprestimo") body = parts.loan;
    return `<div class="mk-profile"><div class="mk-phead">${parts.head}${acts}</div><nav class="mk-sub" role="tablist">${tabs}</nav>${body}</div>`;
  }

  const api = { candidates, profile, PTABS, mundo, clubSubNav, CLUB_SUBS, comprados, vendidos, loansTable, lista, pesquisa, avancada, PESQ_SUBS, dateOf };
  root.ProLifeMarketScreens = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
