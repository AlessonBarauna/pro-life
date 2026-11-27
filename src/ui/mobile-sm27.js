(function (root) {
  "use strict";
  // PRO LIFE — Central e menu do celular deitado, no padrão de telas do SM 27.
  const QUERY = "(orientation: landscape) and (min-width: 568px) and (max-width: 1024px) and (max-height: 560px)";
  const isPhone = () => !!(root.matchMedia && root.matchMedia(QUERY).matches);

  function crestOf(id, name, esc) {
    const img = id && root.ProLifeClubCrests ? root.ProLifeClubCrests.render(id, { size: "lg" }) : "";
    if (String(img).startsWith("<img")) return `<span class="sm27-crest">${img}</span>`;
    const mono = String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
    return `<span class="sm27-crest sm27-crest-mono">${esc(mono)}</span>`;
  }
  function miniCrest(id, name, esc) {
    const img = id && root.ProLifeClubCrests ? root.ProLifeClubCrests.render(id, { size: "sm" }) : "";
    if (String(img).startsWith("<img")) return `<span class="sm27-mini">${img}</span>`;
    return `<span class="sm27-mini sm27-crest-mono">${esc(String(name || "?")[0] || "?")}</span>`;
  }
  const abbr = (club) => String(club?.shortName || club?.name || "—").replace(/[^A-Za-zÀ-ú ]/g, "").split(/\s+/).filter(Boolean).join(" ").slice(0, 3).toUpperCase();

  function ring(value, label) {
    const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    return `<span class="sm27-ring" style="--v:${v}"><b>${v}</b></span><small>${label}</small>`;
  }


  // ---- Tela inicial v3: cartões novos (Instalações, Objetivos, Jovens promessas) e início da seleção ----
  const gemCache = { day: null, season: null, list: [] };
  function gems(state) {
    const GF = root.ProLifeGlobalFootball;
    if (!GF?.activePlayers) return [];
    if (gemCache.day === state.day && gemCache.season === state.season && gemCache.list.length) return gemCache.list;
    const ovr = (p) => Math.round(Number(p.ovr ?? p.overall) || 0);
    const list = GF.activePlayers(state).filter((p) => p && p.id !== "hero" && p.clubId && p.clubId !== state.clubId && !p.academy && Number(p.age) <= 21 && Number(p.potential) - ovr(p) >= 8)
      .sort((a, b) => Number(b.potential) - Number(a.potential) || ovr(b) - ovr(a)).slice(0, 3)
      .map((p) => ({ id: p.id, name: p.shortName || p.name, pos: p.primaryPosition || p.pos, age: p.age, ovr: ovr(p), pot: Number(p.potential) || 0, clubId: p.clubId, club: GF.clubById?.(state, p.clubId)?.name || "" }));
    Object.assign(gemCache, { day: state.day, season: state.season, list });
    return list;
  }
  const natCrest = (code, name, esc) => {
    let img = "";
    try { img = root.ProLifeNationalCrests?.render?.(code || name, { size: "lg" }) || ""; } catch (e) { img = ""; }
    if (String(img).startsWith("<img")) return `<span class="sm27-crest">${img}</span>`;
    return `<span class="sm27-crest sm27-crest-mono">${esc(String(code || name || "?").slice(0, 3).toUpperCase())}</span>`;
  };
  function inboxTile(state, H, esc, tile, row, natBtn) {
    const msgs = (H.messages || []).slice(0, 4);
    const unread = Number(H.unread) || 0;
    return tile("inbox", "Caixa de entrada", `<span class="sm27-list">${msgs.map((m) => row(m.read ? "" : "new", `<b></b><span>${esc(m.subject || m.title || "Mensagem")}</span>`)).join("") || row("", "<span>Nenhuma mensagem.</span>")}</span>`, unread ? `<i class="sm27-badge">${unread}</i>` : "") .replace(/<\/button>$/, `${natBtn}</button>`);
  }

  function home(state, D, H, h) {
    const { esc, dayDate } = h;
    if (state.mode === "coach" && view.home === "national") { const nh = natHome(state, D, H, h); if (nh) return nh; view.home = "club"; }
    const c = H.c || {};
    const next = H.next;
    const rival = next ? (next.homeClubId === c.id ? next.awayClubId : next.homeClubId) : null;
    const strength = (id) => Math.round(Number(D.club(state, id)?.strength) || 0);
    const days = next ? Math.max(0, Number(next.date || state.day) - state.day) : null;
    const isHome = next && next.homeClubId === c.id;
    const matchCard = next
      ? `<section class="sm27-card sm27-match">
          <div class="sm27-teams">
            <div class="sm27-team">${crestOf(next.homeClubId, next.home, esc)}<b>${esc(next.home)}</b></div>
            <div class="sm27-vs"><span class="sm27-ovr">${strength(next.homeClubId) || "–"}</span><em>×</em><span class="sm27-ovr sm27-ovr-b">${strength(next.awayClubId) || "–"}</span></div>
            <div class="sm27-team">${crestOf(next.awayClubId, next.away, esc)}<b>${esc(next.away)}</b></div>
          </div>
          <div class="sm27-meta"><span><i>${esc(next.competitionName || "Jogo")}</i>${esc(next.stage || "")}</span><span><i>Data</i>${dayDate(next.date)}</span><span><i>Em</i>${days === 0 ? "Hoje" : days + " dia" + (days === 1 ? "" : "s")}</span><span><i>Mando</i>${next.national ? "Seleção" : isHome ? "Em casa" : "Fora"}</span></div>
          <div class="sm27-match-actions"><button type="button" class="primary" data-live-match>Acompanhar partida</button>${state.mode === "coach" && next.national ? `<button type="button" data-cn-open="escalacao">Equipe da seleção</button>` : `<button type="button" data-page="squad">Equipe</button>`}${state.mode === "coach" && !next.national ? `<button type="button" data-coach-plan-official-sub>Substituição</button>` : ""}<button type="button" data-simulate="nextCommitment">Simular</button><button type="button" class="sm27-skip-match" data-simulate="nextMatch">Pular partida</button></div>
        </section>`
      : `<section class="sm27-card sm27-match sm27-match-empty"><h3>Sem jogo agendado</h3><p>Abra o calendário ou avance o dia.</p><div class="sm27-match-actions"><button type="button" class="primary" data-page="calendar">Calendário</button><button type="button" data-advance="1">+1 dia</button></div></section>`;

    const tile = (page, title, body, badge = "") => `<button type="button" class="sm27-card sm27-tile" data-page="${esc(page)}"><span class="sm27-h"><span class="sm27-ht">${title}</span>${badge}</span>${body}</button>`;
    const row = (cls, inner) => `<span class="sm27-li ${cls || ""}">${inner}</span>`;

    const msgs = (H.messages || []).slice(0, 3);
    const unread = Number(H.unread) || 0;
    const hasNat = !!state.coachNational?.teamId;
    const natBtn = state.mode === "coach" ? `<span class="sm27-switch" role="button" tabindex="0" ${hasNat ? 'data-sm27-home-view="national"' : 'data-page="national"'}>${hasNat ? "Seleção nacional" : "Ofertas de seleções"}</span>` : "";
    const inbox = inboxTile(state, H, esc, tile, row, natBtn);

    const rep = Number(state.reputation) || 0;
    const board = Number(state.board) || 0;
    const coach = tile("profile", state.mode === "coach" ? "Treinador" : "Jogador", `<span class="sm27-rings"><span>${ring(rep, "Reputação")}</span><span>${ring(board, state.mode === "coach" ? "Diretoria" : "Confiança")}</span></span>`);

    const CT = H.competitionTable || H.table || {};
    const rows = (CT.rows || []).slice();
    const me = rows.findIndex((x) => x.id === state.clubId);
    const show = state.mode === "coach" ? 2 : 3;
    const from = Math.max(0, Math.min(me < 0 ? 0 : me - (show === 2 ? 1 : 1), Math.max(0, rows.length - show)));
    const comp = tile(CT.page || "league", "Competições", `<span class="sm27-table"><small>${esc(next?.competitionName || "Liga")}<em>J</em><em>Pts</em></small>${rows.slice(from, from + show).map((x) => `<span class="${x.id === state.clubId ? "me" : ""}"><span>${x.position}</span>${miniCrest(x.id, x.name, esc)}<b>${esc(abbr(D.club(state, x.id)) || x.name)}</b><em>${x.stats?.played ?? 0}</em><em>${x.stats?.points ?? 0}</em></span>`).join("") || "<span><b>Sem tabela</b></span>"}</span>`);

    const offers = (state.offers || []).filter((o) => o.expires >= state.day).length;
    const coachItems = [...(Array.isArray(state.coachCareer?.negotiations) ? state.coachCareer.negotiations : []), ...(Array.isArray(state.coachCareer?.saleOffers) ? state.coachCareer.saleOffers : [])];
    const deals = coachItems.filter((o) => o.status === "awaiting_window" || (o.status === "pending" && (!Number.isFinite(Number(o.expiresDay)) || Number(o.expiresDay) >= Number(state.day)))).length;
    const open = state.mode === "coach" ? deals : offers;
    let win = null; try { win = D.Career?.windowStatus?.(state) || null; } catch (e) { win = null; }
    const winRow = win ? row("", `<span class="sm27-window ${win.open ? "is-open" : "is-closed"}"><b>${win.open ? "Janela aberta" : "Janela fechada"}</b> · ${win.open ? "fecha em " : "abre em "}${esc(win.remaining)} d</span>`) : "";
    const transfers = tile("market", "Transferências", `<span class="sm27-list">${winRow}${row("", `<span>${open ? open + " negociaç" + (open === 1 ? "ão aberta" : "ões abertas") : "Nenhuma negociação aberta"}</span>`)}${row("", `<span>Orçamento <b>${esc(h.money(c.budget || 0))}</b></span>`)}</span>`);

    let facTile = "";
    if (state.mode === "coach") {
      let cap = 0, lvl = 0, avgLv = 0;
      try { const F = root.ProLifeFacilities; cap = F.effects(state, D.club(state)).stadiumCapacity; lvl = F.levelOf(state, "stadium"); avgLv = Math.round((F.IDS || []).reduce((a, id) => a + F.levelOf(state, id), 0) / Math.max(1, (F.IDS || []).length) * 10) / 10; } catch (e) {}
      facTile = `<button type="button" class="sm27-card sm27-tile sm27-fac" data-sm27-facilities><span class="sm27-h"><span class="sm27-ht">Instalações</span></span><span class="sm27-facrow"><span><b>${cap ? cap.toLocaleString("pt-BR") : "—"}</b><small>lugares</small></span><span><span class="sm27-ring" style="--v:${Math.min(100, Math.round((avgLv / Math.max(1, root.ProLifeFacilities?.MAX || 5)) * 100))}"><b>${avgLv}</b></span><small>nível médio</small></span></span></button>`;
    }
    const form = (H.recent || []).filter((x) => !x.national && x.result).slice(0, 5).map((x) => `<b class="r-${esc(x.result)}">${esc(x.result)}</b>`).join("") || "<small>Sem jogos ainda.</small>";
    const events = (H.events || []).slice(0, 3).map((e) => row("", `<time>${dayDate(e.day)}</time><span>${esc(e.title || "Compromisso")}</span>`)).join("");
    let objs = [];
    try { objs = (root.ProLifeSM27Objectives?.build?.()?.epoca || []).slice(0, 3); } catch (e) { objs = []; }
    const objRow = (g) => { const done = g.done ?? g.now >= g.target; const pct = Math.max(0, Math.min(100, Math.round((g.now / Math.max(1, g.target)) * 100))); return `<span class="sm27-obj ${done ? "done" : ""}"><span>${done ? "✓" : "◦"} ${esc(g.label)}</span><i><u style="width:${pct}%"></u></i></span>`; };
    const objCard = `<button type="button" class="sm27-card sm27-tile sm27-objcard" data-sm27-objectives><span class="sm27-h"><span class="sm27-ht">Objetivos</span></span><span class="sm27-objs">${objs.map(objRow).join("") || row("", "<span>Sem objetivos definidos.</span>")}</span></button>`;
    const gl = gems(state), gi = gl.length ? ((view.promo % gl.length) + gl.length) % gl.length : 0, g = gl[gi];
    const gemCard = `<section class="sm27-card sm27-gems"><span class="sm27-h"><span class="sm27-ht">Jovens promessas</span>${gl.length > 1 ? `<span class="sm27-pg"><button type="button" data-sm27-promo="-1" aria-label="Anterior">‹</button>${gi + 1}/${gl.length}<button type="button" data-sm27-promo="1" aria-label="Próximo">›</button></span>` : ""}</span>${g ? `<span class="sm27-gem"><span class="sm27-ring sm27-ring-lg" style="--v:${g.ovr}"><b>${g.ovr}</b></span><span class="sm27-gem-t"><b>${esc(g.name)}</b><small>${miniCrest(g.clubId, g.club, esc)} ${esc(g.club)}</small><small>${esc(g.pos)} · ${esc(g.age)} anos · pot. <em>${g.pot}</em></small></span></span><button type="button" class="sm27-gem-go" data-sm27-market-hub>Ver no Mercado</button>` : `<span class="sm27-li"><span>Sem joias no radar agora.</span></span>`}</section>`;
    const side = `<aside class="sm27-side">${state.mode === "coach" ? objCard + gemCard : tile("calendar", "Calendário", `<span class="sm27-list sm27-agenda">${events || row("", "<span>Sem eventos.</span>")}</span>`) + tile("matches", "Forma recente", `<span class="sm27-form">${form}</span>`)}</aside>`;

    const news = (H.news || [])[0];
    const tasks = `<div class="sm27-tasks"><span class="sm27-tasks-label">Tarefas</span><button type="button" data-page="training">Treino</button><button type="button" data-page="market">Olheiros</button><button type="button" data-sm27-objectives>Objetivos</button>${state.mode==="coach"?`<button type="button" data-sm27-market-hub>Mercado</button>`:""}${state.mode==="coach"&&state.catalogVersion==="fc27_v1"?`<button type="button" data-sm27-academy>Academia</button>`:""}<span class="sm27-ticker">${esc(news?.title || news?.headline || "")}</span><button type="button" class="sm27-icon" data-page="calendar" aria-label="Calendário">▦</button><button type="button" class="sm27-icon" data-page="save" aria-label="Saves">⚙</button></div>`;

    return `<div class="sm27-home">${tasks}<div class="sm27-grid"><div class="sm27-main">${matchCard}<div class="sm27-row ${facTile ? "sm27-row-v3" : ""}">${inbox}${coach}${comp}${transfers}${facTile}</div></div>${side}</div></div>`;
  }


  function natHome(state, D, H, h) {
    const { esc } = h;
    const CN = root.ProLifeCoachNational;
    let o = null; try { o = CN?.overview?.(state, D); } catch (e) { o = null; }
    if (!o || !o.team) return null;
    const nx = o.fixtures?.[0];
    const strengthOf = (code) => Math.round(Number(o.nations?.find((n) => n.code === code)?.strength) || 0);
    const lbl = (v) => String(v || "").replace(/Amistoso internacional/gi, "Amistoso");
    const days = nx ? Math.max(0, nx.day - state.day) : null;
    const me = o.team;
    const matchCard = nx
      ? `<section class="sm27-card sm27-match"><div class="sm27-teams"><div class="sm27-team">${natCrest(nx.home ? me.code : nx.opponentCode, nx.home ? me.name : nx.opponent, esc)}<b>${esc(nx.home ? me.name : nx.opponent)}</b></div><div class="sm27-vs"><span class="sm27-ovr">${(nx.home ? Math.round(o.power) : strengthOf(nx.opponentCode)) || "–"}</span><em>vs</em><span class="sm27-ovr sm27-ovr-b">${(nx.home ? strengthOf(nx.opponentCode) : Math.round(o.power)) || "–"}</span></div><div class="sm27-team">${natCrest(nx.home ? nx.opponentCode : me.code, nx.home ? nx.opponent : me.name, esc)}<b>${esc(nx.home ? nx.opponent : me.name)}</b></div></div><div class="sm27-meta"><span><i>${esc(lbl(nx.competition))}</i>${esc(nx.stage || "Seleção")}</span><span><i>Data</i>${h.dayDate(nx.day)}</span><span><i>Em</i>${days === 0 ? "Hoje" : days + " dia" + (days === 1 ? "" : "s")}</span><span><i>Mando</i>${nx.home ? "Em casa" : "Fora"}</span></div><div class="sm27-match-actions"><button type="button" class="primary" data-live-match>Acompanhar partida</button><button type="button" data-cn-open="escalacao">Equipe</button><button type="button" data-cn-open="taticas">Táticas</button></div></section>`
      : `<section class="sm27-card sm27-match sm27-match-empty"><h3>Sem jogo da seleção agendado</h3><p>Os jogos acontecem nas datas FIFA.</p><div class="sm27-match-actions"><button type="button" class="primary" data-cn-open="calendario">Calendário da seleção</button></div></section>`;
    const tile = (page, title, body, badge = "") => `<button type="button" class="sm27-card sm27-tile" data-page="${esc(page)}"><span class="sm27-h"><span class="sm27-ht">${title}</span>${badge}</span>${body}</button>`;
    const row = (cls, inner) => `<span class="sm27-li ${cls || ""}">${inner}</span>`;
    const inbox = inboxTile(state, H, esc, tile, row, `<span class="sm27-switch" role="button" tabindex="0" data-sm27-home-view="club">Clube</span>`);
    const coach = tile("national", "Selecionador", `<span class="sm27-rings"><span>${ring(state.reputation, "Reputação")}</span><span>${ring(o.board, "Confiança")}</span></span>`);
    let prof = null; try { prof = CN.nationProfile(state, D, me.code, null); } catch (e) { prof = null; }
    const tit = (prof?.titles || []).slice(0, 3);
    const titles = tile("national", "Títulos", `<span class="sm27-list">${tit.map((x) => row("", `<span>🏆 <b>${x.count}×</b> ${esc(x.name)}</span>`)).join("") || row("", "<span>Sem títulos registrados.</span>")}</span>`);
    const live = (o.tours?.live || [])[0];
    const q = o.qual;
    const nextT = live ? `<b>${esc(live.name)} ${esc(live.year)}</b><small>${live.playing ? "Sua seleção disputa" : "Sua seleção não participa"}</small>` : q && q.kind !== "none" && q.kind !== "allocation" ? `<b>${esc(q.title || "Eliminatórias")}</b><small>Copa ${esc(q.year)}</small>` : `<b>Sem torneio em andamento</b><small>Veja Estatísticas</small>`;
    const tourn = `<button type="button" class="sm27-card sm27-tile sm27-wide" data-cn-open="torneios"><span class="sm27-h"><span class="sm27-ht">Próximo torneio</span></span><span class="sm27-nt">🏆<span>${nextT}</span></span></button>`;
    const called = (o.players || []).filter((p) => p.called).sort((a, b) => b.overall - a.overall).slice(0, 5);
    const list = called.map((p) => `<span class="sm27-cp"><i>${esc(p.code || p.pos)}</i><b>${esc(p.name)}</b><em>${p.overall}</em></span>`).join("");
    const cu = o.callup;
    const side = `<aside class="sm27-side"><section class="sm27-card sm27-callup"><span class="sm27-h"><span class="sm27-ht">Convocação</span><small>${o.called}/${o.max}</small></span><span class="sm27-cplist">${list || "<span class=\"sm27-li\"><span>Ninguém convocado.</span></span>"}</span>${cu && cu.status === "open" ? `<small class="sm27-cu">Aberta · confirme até o dia ${esc(cu.deadline)}</small>` : ""}<button type="button" class="sm27-gem-go" data-cn-addgo>+ Adicionar jogadores</button></section></aside>`;
    const news = (H.news || [])[0];
    const tasks = `<div class="sm27-tasks"><span class="sm27-tasks-label">Tarefas</span><button type="button" data-cn-open="convocacao">Convocação</button><button type="button" data-cn-open="oposicao">Oposição</button><button type="button" data-cn-open="relat">Relatórios</button><span class="sm27-ticker">${esc(news?.title || news?.headline || "")}</span><button type="button" class="sm27-icon" data-page="calendar" aria-label="Calendário">▦</button></div>`;
    return `<div class="sm27-home sm27-home-nat">${tasks}<div class="sm27-grid"><div class="sm27-main">${matchCard}<div class="sm27-row sm27-row-v3">${inbox}${coach}${titles}${tourn}</div></div>${side}</div></div>`;
  }

  // Visões do celular que não existem no desktop. O estado fica em memória e é
  // reaplicado quando a tela é redesenhada (o app recria o DOM a cada ação).
  const view = { squad:"campo", life:"life", home:"club", promo:0 };
  function enhance() {
    if (!root.document || !isPhone()) return;
    const squad = root.document.querySelector(".pl-squad-screen");
    if (squad) {
      if (squad.dataset.mView !== view.squad) squad.dataset.mView = view.squad;
      const head = squad.querySelector(".pl-squad-pitch-head");
      if (head && !head.querySelector(".pl-m-switch")) {
        const sw = root.document.createElement("span");
        sw.className = "pl-m-switch";
        sw.setAttribute("role", "group");
        sw.setAttribute("aria-label", "Visão do elenco");
        sw.innerHTML = '<button type="button" data-m-view="campo">Campo</button><button type="button" data-m-view="banco">Banco</button>';
        head.insertBefore(sw, head.firstChild);
      }
      head?.querySelectorAll("[data-m-view]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mView === view.squad)));
    }
    lifeSections();
  }

  // Vida: cada aba mostra só a sua seção (resumo, finanças, patrimônio, atividades...).
  function lifeSections() {
    const tabs = root.document.querySelector(".life-tabs");
    if (!tabs) return;
    const ids = [...tabs.querySelectorAll("a[href^='#']")].map((a) => a.getAttribute("href").slice(1));
    const wanted = ids.includes(view.life) ? view.life : "life";
    const targets = ids.filter((id) => id !== "life").map((id) => root.document.getElementById(id)).filter(Boolean);
    const container = tabs.parentElement;
    for (const child of container.children) {
      if (child === tabs) continue;
      const holds = targets.filter((t) => child === t || child.contains(t));
      const own = holds.length === 1 && holds[0] === child;
      let show;
      if (wanted === "life") show = holds.length === 0 || (!own && holds.length > 0);
      else show = holds.some((t) => t.id === wanted);
      child.toggleAttribute("data-m-hide", !show);
      if (holds.length && child !== holds[0]) for (const t of holds) t.toggleAttribute("data-m-hide", wanted === "life" ? true : t.id !== wanted);
    }
    tabs.querySelectorAll("a[href^='#']").forEach((a) => {
      const on = a.getAttribute("href").slice(1) === wanted;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  if (root.document) {
    const rehome = () => { root.document.querySelector('[data-page="home"]')?.click(); };
    root.document.addEventListener("click", (ev) => {
      const t0 = ev.target instanceof Element ? ev.target : null;
      const sw = t0?.closest("[data-sm27-home-view]");
      if (sw) { ev.preventDefault(); ev.stopPropagation(); view.home = sw.dataset.sm27HomeView === "national" ? "national" : "club"; rehome(); return; }
      const pr = t0?.closest("[data-sm27-promo]");
      if (pr) { ev.preventDefault(); ev.stopPropagation(); view.promo += Number(pr.dataset.sm27Promo) || 0; rehome(); return; }
    }, true);
    root.document.addEventListener("click", (ev) => {
      const a = ev.target instanceof Element ? ev.target.closest(".life-tabs a[href^='#']") : null;
      if (a && isPhone()) { ev.preventDefault(); view.life = a.getAttribute("href").slice(1); lifeSections(); const body = root.document.querySelector(".sm27-screen-body"); if (body) body.scrollTop = 0; return; }
      const b = ev.target instanceof Element ? ev.target.closest("[data-m-view]") : null;
      if (!b) return;
      view.squad = b.dataset.mView === "banco" ? "banco" : "campo";
      enhance();
    });
    const start = () => {
      const app = root.document.getElementById("app");
      if (!app) return;
      let queued = false;
      new MutationObserver(() => { if (queued) return; queued = true; (root.requestAnimationFrame || setTimeout)(() => { queued = false; enhance(); }); }).observe(app, { childList:true, subtree:true });
      enhance();
    };
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", start, { once:true }); else start();
  }

  // Menu lateral (☰): abre e fecha sem re-renderizar a tela.
  function toggleMenu(force) {
    const on = force === undefined ? !document.body.classList.contains("sm27-menu-open") : !!force;
    document.body.classList.toggle("sm27-menu-open", on);
    document.querySelectorAll("[data-phone-menu]").forEach((button)=>button.setAttribute("aria-expanded",String(on)));
  }
  if (root.document) {
    let drawerPointerX=null;
    root.document.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!(t instanceof Element)) return;
      if (t.closest("[data-phone-menu]")) { toggleMenu(); return; }
      if (t.closest(".sm27-backdrop")) { toggleMenu(false); return; }
      if (t.closest(".sm27-drawer button")) toggleMenu(false);
    });
    root.document.addEventListener("keydown", (ev) => {
      const t = ev.target;
      if(ev.key === "Escape" && document.body.classList.contains("sm27-menu-open")){toggleMenu(false);document.querySelector("[data-phone-menu]")?.focus?.();return;}
      if ((ev.key === "Enter" || ev.key === " ") && t instanceof Element && t.matches(".sm27-tile[data-page]")) { ev.preventDefault(); t.click(); }
    });
    root.document.addEventListener("pointerdown",(ev)=>{drawerPointerX=ev.target instanceof Element&&ev.target.closest(".sm27-drawer")?ev.clientX:null;},{passive:true});
    root.document.addEventListener("pointerup",(ev)=>{if(drawerPointerX!==null&&drawerPointerX-ev.clientX>42)toggleMenu(false);drawerPointerX=null;},{passive:true});
  }

  root.ProLifeMobileSM27 = { QUERY, isPhone, home, toggleMenu, abbr, enhance };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeMobileSM27;
})(typeof window !== "undefined" ? window : globalThis);
