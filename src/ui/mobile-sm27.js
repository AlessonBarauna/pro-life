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

  function home(state, D, H, h) {
    const { esc, dayDate } = h;
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
          <div class="sm27-match-actions"><button type="button" class="primary" data-live-match>Acompanhar partida</button><button type="button" data-page="squad">Equipe</button>${state.mode === "coach" ? `<button type="button" data-coach-plan-official-sub>Substituição</button>` : ""}<button type="button" data-simulate="nextCommitment">Simular</button><button type="button" class="sm27-skip-match" data-simulate="nextMatch">Pular partida</button></div>
        </section>`
      : `<section class="sm27-card sm27-match sm27-match-empty"><h3>Sem jogo agendado</h3><p>Abra o calendário ou avance o dia.</p><div class="sm27-match-actions"><button type="button" class="primary" data-page="calendar">Calendário</button><button type="button" data-advance="1">+1 dia</button></div></button>`;

    const tile = (page, title, body, badge = "") => `<button type="button" class="sm27-card sm27-tile" data-page="${esc(page)}"><span class="sm27-h">${title}${badge}</span>${body}</button>`;
    const row = (cls, inner) => `<span class="sm27-li ${cls || ""}">${inner}</span>`;

    const msgs = (H.messages || []).slice(0, 4);
    const unread = Number(H.unread) || 0;
    const inbox = tile("inbox", "Caixa de entrada", `<span class="sm27-list">${msgs.map((m) => row(m.read ? "" : "new", `<b></b><span>${esc(m.subject || m.title || "Mensagem")}</span>`)).join("") || row("", "<span>Nenhuma mensagem.</span>")}</span>`, unread ? `<i class="sm27-badge">${unread}</i>` : "");

    const rep = Number(state.reputation) || 0;
    const board = Number(state.board) || 0;
    const coach = tile("profile", state.mode === "coach" ? "Treinador" : "Jogador", `<span class="sm27-rings"><span>${ring(rep, "Reputação")}</span><span>${ring(board, state.mode === "coach" ? "Diretoria" : "Confiança")}</span></span>`);

    const CT = H.competitionTable || H.table || {};
    const rows = (CT.rows || []).slice();
    const me = rows.findIndex((x) => x.id === state.clubId);
    const from = Math.max(0, Math.min(me < 0 ? 0 : me - 1, Math.max(0, rows.length - 3)));
    const comp = tile(CT.page || "league", "Competições", `<span class="sm27-table"><small>${esc(next?.competitionName || "Liga")}<em>J</em><em>Pts</em></small>${rows.slice(from, from + 3).map((x) => `<span class="${x.id === state.clubId ? "me" : ""}"><span>${x.position}</span>${miniCrest(x.id, x.name, esc)}<b>${esc(abbr(D.club(state, x.id)) || x.name)}</b><em>${x.stats?.played ?? 0}</em><em>${x.stats?.points ?? 0}</em></span>`).join("") || "<span><b>Sem tabela</b></span>"}</span>`);

    const offers = (state.offers || []).filter((o) => o.expires >= state.day).length;
    const coachItems = [...(Array.isArray(state.coachCareer?.negotiations) ? state.coachCareer.negotiations : []), ...(Array.isArray(state.coachCareer?.saleOffers) ? state.coachCareer.saleOffers : [])];
    const deals = coachItems.filter((o) => o.status === "awaiting_window" || (o.status === "pending" && (!Number.isFinite(Number(o.expiresDay)) || Number(o.expiresDay) >= Number(state.day)))).length;
    const open = state.mode === "coach" ? deals : offers;
    const transfers = tile("market", "Transferências", `<span class="sm27-list">${row("", `<span>${open ? open + " negociaç" + (open === 1 ? "ão aberta" : "ões abertas") : "Nenhuma negociação aberta"}</span>`)}${row("", `<span>Orçamento <b>${esc(h.money(c.budget || 0))}</b></span>`)}</span>`);

    const form = (H.recent || []).filter((x) => !x.national && x.result).slice(0, 5).map((x) => `<b class="r-${esc(x.result)}">${esc(x.result)}</b>`).join("") || "<small>Sem jogos ainda.</small>";
    const events = (H.events || []).slice(0, 3).map((e) => row("", `<time>${dayDate(e.day)}</time><span>${esc(e.title || "Compromisso")}</span>`)).join("");
    const side = `<aside class="sm27-side">${tile("calendar", "Calendário", `<span class="sm27-list sm27-agenda">${events || row("", "<span>Sem eventos.</span>")}</span>`)}${tile("matches", "Forma recente", `<span class="sm27-form">${form}</span>`)}</aside>`;

    const news = (H.news || [])[0];
    const tasks = `<div class="sm27-tasks"><span class="sm27-tasks-label">Tarefas</span><button type="button" data-page="training">Treino</button><button type="button" data-page="market">Olheiros</button><button type="button" data-page="profile">Objetivos</button><span class="sm27-ticker">${esc(news?.title || news?.headline || "")}</span><button type="button" class="sm27-icon" data-page="calendar" aria-label="Calendário">▦</button><button type="button" class="sm27-icon" data-page="save" aria-label="Saves">⚙</button></div>`;

    return `<div class="sm27-home">${tasks}<div class="sm27-grid"><div class="sm27-main">${matchCard}<div class="sm27-row">${inbox}${coach}${comp}${transfers}</div></div>${side}</div></div>`;
  }

  // Visões do celular que não existem no desktop. O estado fica em memória e é
  // reaplicado quando a tela é redesenhada (o app recria o DOM a cada ação).
  const view = { squad:"campo", life:"life" };
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
