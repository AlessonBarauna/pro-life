(function (root) {
  "use strict";
  // PRO LIFE — telas novas do Mercado (Mundo, Clube, Lista, Pesquisa, Pesquisa avançada).
  // Só desenha HTML a partir do estado; quem age é o hub (fc27-transfer-hub.js).
  const R = () => root.ProLifeTransferRulesV2 || (typeof require === "function" ? require("../domain/transfer-rules-v2.js") : null);
  const PER = 12;

  function pager(e, key, total, page) {
    const pages = Math.max(1, Math.ceil(total / PER));
    return `<div class="tfh-pager"><button type="button" class="tfh-btn" data-tfh-pg="${key}:-1" ${page <= 0 ? "disabled" : ""}>Anterior</button><span>${total} resultado(s) · página ${page + 1} de ${pages}</span><button type="button" class="tfh-btn" data-tfh-pg="${key}:1" ${page >= pages - 1 ? "disabled" : ""}>Próxima</button></div>`;
  }
  const slice = (arr, page) => arr.slice(page * PER, page * PER + PER);
  const clampPage = (st, key, total) => { const max = Math.max(0, Math.ceil(total / PER) - 1); if (st[key] > max) st[key] = max; if (st[key] < 0) st[key] = 0; return st[key]; };
  const opt = (v, cur, l) => `<option value="${e_(v)}" ${String(cur) === String(v) ? "selected" : ""}>${e_(l ?? v)}</option>`;
  const e_ = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const dateOf = (e, day) => { const d = Number(day); if (!Number.isFinite(d)) return "—"; return new Date(Date.UTC(2026, 0, e.s.world === "legacy" ? 5 : 1) + d * 86400000).toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "2-digit" }); };
  const posChip = (p) => `<i class="mk-pos mk-pos-${e_(p.pos || "x")}">${e_(p.primaryPosition || p.pos || "—")}</i>`;
  const ger = (e, p) => `<i class="mk-ger">${e.ovrOf(p)}</i>`;

  // ---------- Mundo ----------
  function mundo(e, st) {
    const { s, D, GF } = e, w = st.world;
    let deals = (s.worldLiveMarket?.deals || []).filter((d) => d.state !== "cancelled" && d.executionStatus !== "cancelled");
    const group = { rumor: ["rumor", "scouting"], neg: ["negotiating", "offer"], done: ["completed"] };
    if (w.status !== "all") deals = deals.filter((d) => group[w.status].includes(d.state));
    const clubOf = (id) => GF()?.clubById?.(s, id) || {};
    if (w.league) deals = deals.filter((d) => [d.fromClubId, d.toClubId].some((id) => clubOf(id).leagueId === w.league));
    if (w.country) deals = deals.filter((d) => [d.fromClubId, d.toClubId].some((id) => clubOf(id).country === w.country));
    deals.sort((a, b) => (b.updatedDay || 0) - (a.updatedDay || 0));
    const page = clampPage(w, "page", deals.length);
    const countries = [...new Set((s.globalFootball?.clubs || []).map((c) => c.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const chips = [["all", "Tudo"], ["rumor", "Rumores"], ["neg", "Negociações"], ["done", "Fechados"]].map(([k, l]) => `<button type="button" class="tfh-chip ${w.status === k ? "on" : ""}" data-tfh-wf="${k}">${l}</button>`).join("");
    const sels = `<select data-tfh-wc aria-label="País"><option value="">Todos os países</option>${countries.map((c) => opt(c, w.country)).join("")}</select><select data-tfh-wl aria-label="Liga"><option value="">Todas as ligas</option>${e.leagues(s).map(([id, n]) => opt(id, w.league, n)).join("")}</select>`;
    const rows = slice(deals, page).map((d) => {
      const p = GF()?.playerById?.(s, d.playerId), st2 = e.DEAL[d.executionStatus === "executed" ? "completed" : d.state] || ["—", "out"];
      return `<tr><td>${p ? posChip(p) : ""}</td><td>${p ? ger(e, p) : ""}</td><td class="mk-name">${e_(p?.name || d.playerId)}</td><td class="mk-clubs">${e_(e.clubName(s, D, d.fromClubId))} » ${e_(e.clubName(s, D, d.toClubId))}</td><td>${e.money(d.value)}</td><td><i class="tfh-badge ${st2[1]}">${st2[0]}</i></td><td>${dateOf(e, d.updatedDay ?? d.day)}</td></tr>`;
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
    const rows = list.map((it) => { const p = GF()?.playerById?.(s, it.playerId); return p ? { it, p, v: e.valueOf(p) } : null; }).filter(Boolean);
    rows.sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.it.priority || "media"] - { alta: 0, media: 1, baixa: 2 }[b.it.priority || "media"]) || e.ovrOf(b.p) - e.ovrOf(a.p));
    const head = `<p class="mk-count"><b>${rows.length}</b> de ${rules.SHORTLIST_LIMIT} jogadores</p>`;
    if (!rows.length) return head + `<p class="tfh-note">Sua lista está vazia. Toque na estrela ☆ de um jogador na Pesquisa para acompanhá-lo aqui.</p>`;
    const body = rows.map(({ it, p, v }) => {
      const al = rules.shortlistAlerts(it, p, s, v).map((a) => `<span class="mk-alert mk-alert-${a.k}">${e_(a.text)}</span>`).join("");
      const pr = it.priority || "media";
      return `<tr><td>${posChip(p)}</td><td>${ger(e, p)}</td><td class="mk-name"><button type="button" class="tfh-player" data-tfh-player="${e_(p.id)}">${e_(p.name)}</button>${al}</td><td class="mk-clubs">${e_(e.clubName(s, D, p.clubId))}</td><td>${p.age}</td><td>${e.money(v)}</td><td><select data-tfh-prio="${e_(it.clubId)}|${e_(p.id)}" aria-label="Prioridade"><option value="alta" ${pr === "alta" ? "selected" : ""}>Alta</option><option value="media" ${pr === "media" ? "selected" : ""}>Média</option><option value="baixa" ${pr === "baixa" ? "selected" : ""}>Baixa</option></select></td><td class="mk-acts"><button type="button" class="tfh-btn primary" data-tfh-negotiate="${e_(p.id)}">Negociar</button><button type="button" class="tfh-btn" data-tfh-star="${e_(p.id)}" data-club="${e_(it.clubId)}" aria-label="Remover da lista">Remover</button></td></tr>`;
    }).join("");
    return head + `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Pos.</th><th>GER</th><th>Jogador</th><th>Clube</th><th>Idade</th><th>Valor</th><th>Prioridade</th><th></th></tr></thead><tbody>${body}</tbody></table></div>`;
  }

  // ---------- Resultado de jogadores (usado na Pesquisa e na Avançada) ----------
  function playerTable(e, rows, page, key) {
    const { s, D } = e, rules = R(), shortlist = s.coachCareer?.shortlist || [];
    if (!rows.length) return `<p class="tfh-note">Nenhum jogador com esses filtros.</p>`;
    const body = slice(rows, page).map((p) => {
      const star = shortlist.some((x) => x.playerId === p.id), lst = rules.LISTING_LABEL[rules.aiListing(p, s)];
      return `<tr><td>${posChip(p)}</td><td>${ger(e, p)}</td><td class="mk-name"><button type="button" class="tfh-player" data-tfh-player="${e_(p.id)}">${e_(p.name)}</button>${lst ? `<span class="mk-alert mk-alert-sale">${e_(lst)}</span>` : ""}</td><td class="mk-clubs">${e_(e.clubName(s, D, p.clubId))}</td><td>${p.age}</td><td>${Number(p.potential) || "—"}</td><td>${e.money(e.valueOf(p))}</td><td class="mk-acts"><button type="button" class="tfh-btn" data-tfh-star="${e_(p.id)}" data-club="${e_(p.clubId || "")}" aria-pressed="${star}" aria-label="Lista preferencial">${star ? "★" : "☆"}</button><button type="button" class="tfh-btn primary" data-tfh-negotiate="${e_(p.id)}">Negociar</button></td></tr>`;
    }).join("");
    return `<div class="mk-scroll"><table class="mk-table"><thead><tr><th>Pos.</th><th>GER</th><th>Jogador</th><th>Clube</th><th>Idade</th><th>Pot.</th><th>Valor</th><th></th></tr></thead><tbody>${body}</tbody></table></div>${pager(e, key, rows.length, page)}`;
  }
  const candidates = (e) => (e.GF()?.activePlayers?.(e.s) || []).filter((p) => p && p.id !== "hero" && p.clubId !== e.s.clubId && !p.academy);

  // ---------- Pesquisa ----------
  const PESQ_SUBS = [["jogadores", "Jogadores"], ["clubes", "Clubes"], ["selecoes", "Seleções"], ["scout", "Scouting"]];
  function pesquisaNav(sub) { return `<nav class="mk-sub" role="tablist">${PESQ_SUBS.map(([id, l]) => `<button type="button" role="tab" class="${sub === id ? "on" : ""}" data-tfh-psub="${id}">${l}</button>`).join("")}</nav>`; }
  function pesquisa(e, st) {
    const q = st.pq, sub = st.psub;
    const box = `<label class="mk-q"><span>${sub === "clubes" ? "Nome do clube" : sub === "selecoes" ? "Nome da seleção" : "Nome do jogador"}</span><input type="search" data-tfh-pq value="${e_(q.text)}" placeholder="Digite para buscar"></label>`;
    if (sub === "jogadores") {
      const t = q.text.trim().toLowerCase();
      let ps = candidates(e); if (t) ps = ps.filter((p) => String(p.name || "").toLowerCase().includes(t));
      ps = ps.map((p) => ({ p, o: e.ovrOf(p) })).sort((a, b) => b.o - a.o).map((x) => x.p).slice(0, 400);
      const page = clampPage(q, "page", ps.length);
      return pesquisaNav(sub) + box + playerTable(e, ps, page, "pq");
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
    const f = st.adv, rules = R(), { s, GF } = e;
    const run = f.run;
    const num = (k, l, ph) => `<label>${l}<input type="number" inputmode="numeric" data-tfh-af="${k}" value="${e_(f[k] || "")}" placeholder="${ph || ""}"></label>`;
    const countries = [...new Set((s.globalFootball?.clubs || []).map((c) => c.country).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const nats = [...new Set(candidates(e).map((p) => p.nationality).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const roles = Object.values(rules.ROLES).concat(["Goleiro"]);
    const attrs = rules.ATTRS.map(([k, l]) => `<label class="mk-attr"><input type="checkbox" data-tfh-attr="${k}" ${f.attrs.includes(k) ? "checked" : ""} ${!f.attrs.includes(k) && f.attrs.length >= 5 ? "disabled" : ""}> ${l} ≥ 75</label>`).join("");
    const form = `<p class="tfh-actions"><button type="button" class="tfh-btn primary" data-tfh-adv-run>Buscar jogadores</button> <button type="button" class="tfh-btn" data-tfh-adv-clear>Limpar filtros</button></p><div class="tfh-search mk-adv">
      <label>Posição em campo<select data-tfh-af="pos"><option value="">Todas</option>${rules.POSITIONS.map((p) => opt(p, f.pos)).join("")}</select></label>
      <label>Função<select data-tfh-af="role"><option value="">Todas</option>${roles.map((r) => opt(r, f.role)).join("")}</select></label>
      ${num("ageMin", "Idade mínima", "16")}${num("ageMax", "Idade máxima", "45")}${num("valueMin", "Valor mín. (mi)", "0")}${num("valueMax", "Valor máx. (mi)", "500")}
      <label>Fim de contrato<select data-tfh-af="contract"><option value="">Qualquer</option>${opt("6", f.contract, "Menos de 6 meses")}${opt("12", f.contract, "Menos de 1 ano")}${opt("24", f.contract, "Menos de 2 anos")}</select></label>
      <label>Detalhes da transferência<select data-tfh-af="listing"><option value="">Qualquer</option>${opt("any", f.listing, "À venda ou empréstimo")}${opt("sale", f.listing, "À venda")}${opt("loan", f.listing, "Para empréstimo")}${opt("free", f.listing, "Agente livre")}</select></label>
      <label>País do clube<select data-tfh-af="country"><option value="">Todos</option>${countries.map((c) => opt(c, f.country)).join("")}</select></label>
      <label>Campeonato<select data-tfh-af="league"><option value="">Todos</option>${e.leagues(s).map(([id, n]) => opt(id, f.league, n)).join("")}</select></label>
      <label>Nacionalidade<select data-tfh-af="nat"><option value="">Todas</option>${nats.map((c) => opt(c, f.nat)).join("")}</select></label>
      ${num("interest", "Clubes interessados (mín.)", "0")}
      <fieldset class="mk-attrs wide"><legend>Atributos (até 5)</legend>${attrs}</fieldset></div>
`;
    if (!run) return form + `<p class="tfh-note">Escolha os filtros e toque em Buscar jogadores.</p>`;
    const clubOf = (p) => GF()?.clubById?.(s, p.clubId);
    const rows = rules.advancedFilter(candidates(e), f, s, e.valueOf, clubOf).sort((a, b) => e.ovrOf(b) - e.ovrOf(a)).slice(0, 400);
    const page = clampPage(f, "page", rows.length);
    return form + playerTable(e, rows, page, "af");
  }

  const api = { mundo, clubSubNav, CLUB_SUBS, comprados, vendidos, loansTable, lista, pesquisa, avancada, PESQ_SUBS, dateOf };
  root.ProLifeMarketScreens = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
