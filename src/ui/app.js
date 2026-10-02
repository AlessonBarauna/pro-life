(function () {
  "use strict";
  const D = ProLife,
    A = ProLifeApp,
    S = ProLifeSave;
  let state = S.load(),
    page = "home",
    setup = false;
  const $ = (q) => document.querySelector(q),
    esc = (v) =>
      String(v ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      ),
    money = (v) =>
      v.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      });
  const color = (v, f) => (/^#[a-fA-F0-9]{6}$/.test(v || "") ? v : f);
  function toast(t) {
    $("#toast").textContent = t;
    $("#toast").style.display = "block";
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ($("#toast").style.display = "none"), 4500);
  }
  const C = ProLifeCharacter,
    Charts = ProLifeCharts,
    Expansion = ProLifeExpansion;
  const Career = D.Career;
  const Calendar = window.ProLifeCalendar;
  let chartKey = "overall",
    chartRange = "90",
    leagueKey = "",
    statisticsKey = "",
    feedKey = "Todos",
    calendarMonth = null;
  const dayDate = (day) =>
    new Date(
      Date.UTC(2026, 0, state?.world === "legacy" ? 5 : 1) + day * 86400000,
    ).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  const signed = (n) => (n > 0 ? "+" : "") + n;
  const leagueName = (id) =>
    state.leagues.find((l) => l.id === id)?.name || "Liga Horizonte";
  function avatar(p, team = !setup && state ? D.club(state) : null) {
    p = { ...p, number: state && !setup ? Career.init(state).number : 10 };
    const a = C.normalize(p.appearance),
      kit = C.kit(team),
      skin = color(a.skin, "#bc8660"),
      hair = color(a.hairColor, "#241e1a");
    return `<div class="avatar-stage" data-mode="fallback"><svg class="avatar-fallback" viewBox="0 0 260 350" role="img" aria-label="Retrato de corpo superior com braços e uniforme"><rect width="260" height="350" fill="#171b20"/><path d="M53 160Q43 174 32 284L48 292L76 185M207 160Q217 174 228 284L212 292L184 185" fill="${skin}"/><path d="M75 155Q130 136 185 155L205 195L189 205L174 178L179 312H81L86 178L71 205L55 195Z" fill="${kit.primary}"/><path d="M112 147v19q18 20 36 0v-19" fill="${skin}"/><ellipse cx="130" cy="99" rx="41" ry="59" fill="${skin}"/><path d="M102 100h15m26 0h15" stroke="${hair}" stroke-width="4"/><circle cx="112" cy="112" r="3" fill="${a.eyeColor}"/><circle cx="148" cy="112" r="3" fill="${a.eyeColor}"/><path d="M125 117v14h10M115 141q15 6 30 0" fill="none" stroke="#7d5040" stroke-width="2"/>${a.hair === "bald" ? "" : `<path d="M89 100V70Q92 34 130 35T171 70V98L159 65Q121 59 100 74V100" fill="${hair}"/>`}${a.beard === "none" ? "" : `<path d="M100 131Q100 163 130 166Q160 163 160 131L149 145Q130 157 111 145Z" fill="${hair}"/>`}${a.tattoo === "none" ? "" : `<g stroke="#222d35" fill="none" stroke-width="2.5">${["left", "both"].includes(a.tattoo) ? '<path d="M218 234l-9 9 8 10-10 10 8 8M217 244l-13 3M214 265l-10 5"/>' : ""}${["right", "both"].includes(a.tattoo) ? '<path d="M42 234l9 9-8 10 10 10-8 8M43 244l13 3M46 265l10 5"/>' : ""}</g>`}<path d="M112 168l18 13 18-13" stroke="${kit.secondary}" stroke-width="6" fill="none"/><text x="130" y="248" text-anchor="middle" fill="#fff" font-family="Arial" font-size="38" font-weight="bold">${p.number}</text></svg><span class="avatar-render-label">3D · ARRASTE PARA GIRAR</span><span class="avatar-fallback-label">Retrato 2D · 3D indisponível neste navegador</span></div>`;
  }
  function configFromForm() {
    const form = $("#creator");
    if (!form) return null;
    const f = new FormData(form),
      config = Object.fromEntries(f.entries());
    config.appearance = {};
    [
      "skin",
      "hairColor",
      "eyeColor",
      "hair",
      "beard",
      "body",
      "accessory",
      "tattoo",
    ].forEach((k) => (config.appearance[k] = f.get(k)));
    config.points = {};
    D.attrs.forEach(
      (k) => (config.points[k] = Number(f.get("point_" + k)) || 0),
    );
    const base =
      config.profile === "prodigy"
        ? 54
        : config.profile === "promise"
          ? 46
          : 40;
    config.attrs = {};
    D.attrs.forEach((k) => (config.attrs[k] = base + config.points[k]));
    return config;
  }
  function mountAvatar() {
    const container = $(".avatar-stage");
    if (!container) return;
    const config = configFromForm(),
      person = config || state?.person,
      team = config
        ? config.clubId
          ? D.create({}).clubs.find((c) => c.id === config.clubId)
          : null
        : D.club(state);
    if (person)
      window.ProLifeAvatar3D?.show(
        container,
        { ...person, number: state && !setup ? Career.init(state).number : 10 },
        C.kit(team),
      );
  }
  function appearanceFields(a) {
    a = C.normalize(a);
    return `<div class="formgrid avatar-options"><label>Tom de pele<input name="skin" type="color" value="${a.skin}"></label><label>Cor do cabelo<input name="hairColor" type="color" value="${a.hairColor}"></label><label>Cor dos olhos<input name="eyeColor" type="color" value="${a.eyeColor}"></label><label>Corte de cabelo<select name="hair">${opt(C.hair, a.hair)}</select></label><label>Barba e bigode<select name="beard">${opt(C.beard, a.beard)}</select></label><label>Porte físico<select name="body">${opt(C.body, a.body)}</select></label><label>Acessório<select name="accessory">${opt(C.accessory, a.accessory)}</select></label><label>Tatuagens<select name="tattoo">${opt(C.tattoo, a.tattoo)}</select></label></div>`;
  }
  function evolutionPanel() {
    const entries = state.development,
      cut =
        chartRange === "all" ? 0 : Math.max(0, state.day - Number(chartRange));
    let list = entries.filter((e) => e.day >= cut);
    const before = entries.filter((e) => e.day < cut).at(-1);
    if (before) list.unshift(before);
    if (!list.length) list = entries.slice(-1);
    const first = list[0],
      last = list.at(-1),
      rows = list.slice(-6).reverse();
    return `<section class="card section development-panel"><div class="split"><div><div class="tag">RELATÓRIO DE DESENVOLVIMENTO</div><h2>Evolução detalhada</h2></div><div class="actions"><label class="chart-select">Indicador<select id="chart-key">${opt([["overall", "Nível geral"], ["all", "Todos os atributos"], ...D.attrs.map((k) => [k, D.labels[k]])], chartKey)}</select></label><label class="chart-select">Período<select id="chart-range">${opt(
      [
        ["30", "30 dias"],
        ["90", "90 dias"],
        ["180", "180 dias"],
        ["all", "Histórico completo"],
      ],
      chartRange,
    )}</select></label></div></div>${Charts.evolution(list, chartKey)}<div class="attribute-summary">${[
      ["overall", "GER"],
      ...D.attrs.map((k) => [k, D.labels[k]]),
    ]
      .map(([k, l]) => {
        const now =
            k === "overall" ? D.overall(state.person) : state.person.attrs[k],
          old = k === "overall" ? first.overall : first.attrs[k];
        return `<div><small>${l}</small><b>${now}</b><span class="${now >= old ? "good" : "bad"}">${signed(now - old)} no período</span></div>`;
      })
      .join(
        "",
      )}</div><p class="chart-note">Foco: ${esc(D.labels[state.training] || "Equilibrado")} · Carga: ${esc({ normal: "Normal", hard: "Intensa", rest: "Recuperação" }[state.intensity])} · Progresso de treino: ${state.trainingProgress.toFixed(1)} / 8. Registros semanais e a cada melhoria. Histórico disponível desde ${dayDate(entries[0].day)}.</p><details><summary>Ver registros e variações</summary><div class="tablewrap"><table><thead><tr><th>Data</th><th>GER</th>${D.attrs.map((k) => `<th>${esc(D.labels[k])}</th>`).join("")}<th>Físico</th><th>Moral</th></tr></thead><tbody>${rows.map((e) => `<tr><td>${dayDate(e.day)}</td><td>${e.overall}</td>${D.attrs.map((k) => `<td>${e.attrs[k]}</td>`).join("")}<td>${e.condition === undefined ? "—" : Math.round(e.condition) + "%"}</td><td>${e.morale === undefined ? "—" : Math.round(e.morale)}</td></tr>`).join("")}</tbody></table></div></details></section>`;
  }
  function opt(values, current) {
    return values
      .map(
        (v) =>
          `<option value="${esc(Array.isArray(v) ? v[0] : v)}" ${(Array.isArray(v) ? v[0] : v) === current ? "selected" : ""}>${esc(Array.isArray(v) ? v[1] : v)}</option>`,
      )
      .join("");
  }
  function bar(label, value) {
    return `<div class="split"><span>${esc(label)}</span><b>${Math.round(value)}</b></div><div class="bar"><i style="width:${D.clamp(value, 0, 100)}%"></i></div>`;
  }
  function empty(t) {
    return `<div class="empty">${esc(t)}</div>`;
  }
  function date() {
    return dayDate(state.day);
  }
  function render() {
    window.ProLifeAvatar3D?.dispose();
    if (!state || setup) {
      landing();
      return;
    }
    Career.init(state);
    const c = D.club(state),
      topNext = D.nextCommitment(state),
      topStage = topNext ? D.Competitions.fixtureStage(state, topNext) : null,
      nav = state.mode === "player"
        ? [["home", "Início"], ["inbox", "Caixa"], ["profile", "Meu jogador"], ["training", "Treino"], ["calendar", "Calendário"], ["league", "Temporada"], ["competitions", "Competições"], ["matches", "Partidas"], ["statistics", "Estatísticas"], ["national", "Seleção"], ["awards", "Prêmios"], ["market", "Mercado"], ["squad", "Elenco"], ["life", "Vida"], ["finance", "Finanças"], ["history", "História"], ["legacy", "Legado"], ["save", "Saves"]]
        : [["home", "Início"], ["inbox", "Caixa"], ["squad", "Elenco e tática"], ["market", "Transferências"], ["calendar", "Calendário"], ["league", "Temporada"], ["competitions", "Competições"], ["matches", "Partidas"], ["statistics", "Estatísticas"], ["awards", "Prêmios"], ["training", "Desenvolvimento"], ["profile", "Treinador"], ["finance", "Diretoria"], ["life", "Decisões"], ["history", "História"], ["save", "Saves"]];
    const unread = (state.decision ? 1 : 0) + (Career.canTransfer(state) ? state.offers.length : 0);
    $("#app").innerHTML =
      `<div class="game-shell"><header class="game-nav"><div class="brand">PRO<span>LIFE</span></div><nav>${nav.map(([id, label]) => `<button data-page="${id}" class="${page === id ? "active" : ""}">${label}${id === "inbox" && unread ? `<i>${unread}</i>` : ""}</button>`).join("")}</nav><div class="club-chip"><small>${state.mode === "player" ? "CARREIRA DE JOGADOR" : "CARREIRA DE TREINADOR"}</small><b>${esc(c?.name || "Livre no mercado")}</b></div></header><main class="main"><div class="topbar"><div><div class="tag">TEMPORADA ${state.season} · ${date()}</div><h1>${esc(nav.find((n) => n[0] === page)?.[1] || "Início")}</h1><small>${topNext ? `${esc(topNext.competitionName)} · ${esc(topStage)} · ${dayDate(topNext.date)}` : "Sem compromisso oficial agendado"}</small></div><div class="actions"><button data-action="export">Salvar</button><button data-advance="1">+1 dia</button><button class="primary" data-advance="7">Avançar 7 dias →</button><button data-advance="30">+30 dias</button></div></div>${views[page]()}<div class="footer">PRO LIFE 0.5 · Interface de carreira · Autosave ativo.</div></main></div>`;
    mountAvatar();
  }
  function landing() {
    const saved = state;
    $("#app").innerHTML =
      `<div class="landing"><header><div class="brand">PRO<span>LIFE</span></div><div class="tag">FOOTBALL CAREER / 2026</div></header><div class="tag">CENTRAL DE CARREIRA</div><h1>NOVA CARREIRA</h1><p class="intro">Defina seu perfil, escolha seu primeiro projeto e entre no mundo do futebol.</p>${saved ? '<button data-action="resume">Voltar à carreira atual</button>' : ""}<form id="creator" class="setup"><div class="grid"><section class="card"><h2>PERFIL DO ATLETA OU TREINADOR</h2><div class="formgrid"><label>Carreira<select name="mode" id="mode">${opt(
        [
          ["player", "Jogador — da base ao profissional"],
          ["coach", "Treinador — conduza seu projeto"],
        ],
        "player",
      )}</select></label><label>Nome completo<input name="name" maxlength="60" required value="Alesson Rodrigues"></label><label>Cidade natal<input name="city" maxlength="60" value="Mogi das Cruzes" required></label><label>Idade<input name="age" id="age" type="number" min="14" max="35" value="16" required></label><label>Posição<select name="pos">${opt(
        [
          ["MEI", "Meio-campista"],
          ["ATA", "Atacante"],
          ["DEF", "Defensor"],
          ["GOL", "Goleiro"],
        ],
        "MEI",
      )}</select></label><label>Pé dominante<select name="foot">${opt(
        [
          ["right", "Direito"],
          ["left", "Esquerdo"],
        ],
        "right",
      )}</select></label><label>Altura (cm)<input name="height" type="number" min="150" max="210" value="178"></label><label>Peso (kg)<input name="weight" type="number" min="45" max="120" value="72"></label><label>Perfil inicial<select name="profile">${opt(
        [
          ["realistic", "Realista"],
          ["promise", "Promessa"],
          ["prodigy", "Prodígio"],
        ],
        "realistic",
      )}</select></label><label>Primeiro clube<select name="clubId"><option value="">Receber três propostas</option>${D.create(
        {},
      )
        .clubs.map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join(
          "",
        )}</select></label><label>Estilo de jogo<select name="style">${opt(["Técnico", "Velocista", "Organizador", "Combativo"], "Técnico")}</select></label><label>Comemoração (perfil)<select name="celebration">${opt(C.celebrations, "Braços abertos")}</select></label></div><p class="muted">Começos diferentes alteram seus atributos iniciais. Potencial e sucesso não são garantidos. Treinador usa reputação e licenças; os atributos abaixo são futebolísticos.</p><h3>Distribua até 30 pontos adicionais</h3><div id="points">${D.attrs.map((k) => `<label class="attribute">${D.labels[k]}<input name="point_${k}" type="number" min="0" max="20" value="5" required></label>`).join("")}</div><small id="points-total">30 / 30 pontos</small><div id="initial-radar">${Charts.radar(Object.fromEntries(D.attrs.map((k) => [k, 45])))}</div></section><section class="card"><h2>PERSONALIZAR PERSONAGEM</h2><div id="preview">${avatar({ appearance: {} })}</div><div class="kit-caption"><b id="kit-name">UNIFORME DE TREINO</b><small>O uniforme acompanha o clube escolhido.</small></div>${appearanceFields({})}<div class="notice">Brasil 2026: Séries A, B, C e D, 80 clubes e 38 rodadas por liga. A/B têm referência completa; C/D possuem cobertura parcial. Atributos e resultados são simulados.</div><label>Seed do mundo (opcional)<input name="seed" type="number" placeholder="Um número para reproduzir o mesmo universo"></label><button class="primary" type="submit">Iniciar minha carreira →</button><div class="section"><button type="button" data-action="import">Importar carreira salva</button></div></section></div></form><p class="footer">Sem contas ou pagamentos reais. Base de nomes de 2026; carreira simulada. Leia LEIA_PRIMEIRO.txt para começar.</p></div>`;
    mountAvatar();
    $("#creator").addEventListener("input", (e) => {
      const f = new FormData($("#creator"));
      if (e.target.name === "mode") {
        const coach = f.get("mode") === "coach";
        $("#age").min = coach ? 25 : 14;
        $("#age").max = coach ? 65 : 35;
        $("#age").value = coach ? 35 : 16;
      }
      const a = {};
      [
        "skin",
        "hairColor",
        "eyeColor",
        "shirt",
        "hair",
        "beard",
        "body",
        "accessory",
        "tattoo",
      ].forEach((k) => (a[k] = f.get(k)));
      const current = configFromForm();
      if (
        [
          "skin",
          "hairColor",
          "eyeColor",
          "hair",
          "beard",
          "body",
          "accessory",
          "tattoo",
          "clubId",
          "mode",
        ].includes(e.target.name)
      ) {
        const team = current.clubId
          ? D.create({}).clubs.find((c) => c.id === current.clubId)
          : null;
        $("#preview").innerHTML = avatar(current, team);
        $("#kit-name").textContent = team?.name || "UNIFORME DE TREINO";
        mountAvatar();
      }
      $("#initial-radar").innerHTML = Charts.radar(current.attrs);
      let n = D.attrs.reduce((n, k) => n + Number(f.get("point_" + k)), 0);
      $("#points-total").textContent = n + " / 30 pontos";
      $("#points-total").className = n > 30 ? "bad" : "";
    });
    $("#creator").addEventListener("submit", (e) => {
      e.preventDefault();
      try {
        const f = new FormData(e.target),
          config = Object.fromEntries(f.entries());
        config.points = {};
        D.attrs.forEach(
          (k) => (config.points[k] = Number(f.get("point_" + k))),
        );
        config.appearance = {};
        [
          "skin",
          "hairColor",
          "eyeColor",
          "shirt",
          "hair",
          "beard",
          "body",
          "accessory",
          "tattoo",
        ].forEach((k) => (config.appearance[k] = config[k]));
        const fresh = D.create(
          config,
          config.seed ? Number(config.seed) : Date.now(),
        );
        if (
          state &&
          !confirm(
            "Substituir a carreira atual? Exporte seu save primeiro para guardá-lo.",
          )
        )
          return;
        state = fresh;
        setup = false;
        page = "home";
        persist();
        render();
        window.scrollTo(0, 0);
      } catch (e) {
        toast(e.message);
      }
    });
  }
  const views = {
    home() {
      const c = D.club(state), p = state.person, e = Career.init(state), next = D.nextCommitment(state), w = Career.windowStatus(state),
        own = state.matches.filter((m) => m.home === state.clubId || m.away === state.clubId), last = own[0],
        national = state.mode === "player" ? D.NationalTeam?.init(state) : null,
        lastNational = national?.schedule?.filter((match) => match.played && Number.isFinite(match.brazil) && Number.isFinite(match.other)).slice().sort((a, b) => b.day - a.day)[0] || null,
        table = c ? D.table(state) : [], position = c ? table.findIndex((x) => x.id === c.id) + 1 : 0,
        avg = e.played ? (e.ratingTotal / e.played).toFixed(1) : "—",
        unread = (state.decision ? 1 : 0) + (Career.canTransfer(state) ? state.offers.length : 0),
        statuses = c ? D.Competitions.clubStatus(state) : [],
        pendingOffer = Career.canTransfer(state) ? state.offers.find((offer) => offer.expires >= state.day) : null,
        pendingClub = pendingOffer ? D.club(state, pendingOffer.clubId) : null;
      const nationalNext = next?.competitionId === "nationalTeam", opponent = next && c && !nationalNext ? D.club(state, next.home === c.id ? next.away : next.home) : null;
      return `<div class="career-dashboard">
        <section class="career-hero">
          <div class="career-hero-copy"><div class="tag">${state.mode === "player" ? "MINHA CARREIRA" : "CENTRAL DO TREINADOR"}</div><h2>${esc(nationalNext ? "Seleção Brasileira" : c?.name || "Aguardando clube")}</h2>${next ? `<p class="next-kicker">PRÓXIMO JOGO · ${esc(next.competitionName)} · ${esc(D.Competitions.fixtureStage(state, next))}</p><div class="versus"><b>${esc(nationalNext ? next.homeName : c?.name || "—")}</b><span>×</span><b>${esc(nationalNext ? next.awayName : opponent?.name || "—")}</b></div><p>${dayDate(next.date)} · Em ${Math.max(0, next.date - state.day)} dias</p>` : `<p>Nenhum compromisso oficial agendado.</p>`}<div class="actions"><button class="primary" data-advance="7">Avançar semana →</button><button data-page="calendar">Abrir calendário</button></div></div>
          <div class="career-identity">${state.mode === "player" ? `<span class="mega-rating">${D.overall(p)}<small>GER</small></span><h3>${esc(p.name)}</h3><p>${p.pos} · ${esc(p.style)}</p><div class="mini-bars">${bar("Condição", p.condition)}${bar("Moral", p.morale)}</div>` : `<span class="mega-rating">${Math.round(state.board)}<small>CONF</small></span><h3>${esc(p.name)}</h3><p>Treinador · ${esc(c?.name || "Sem clube")}</p><div class="mini-bars">${bar("Confiança", state.board)}${bar("Moral", p.morale)}</div>`}</div>
        </section>
        <div class="dashboard-grid">
          <section class="dash-card season-card"><div class="tag">${state.mode === "player" ? "MINHA TEMPORADA" : "DESEMPENHO DO CLUBE"}</div><h2>${state.season}</h2><div class="metric-row">${state.mode === "player" ? `<span><b>${p.goals}</b><small>Gols</small></span><span><b>${e.assists || 0}</b><small>Assist.</small></span><span><b>${avg}</b><small>Nota média</small></span><span><b>${e.played || 0}</b><small>Jogos</small></span>` : `<span><b>${position || "—"}º</b><small>Liga</small></span><span><b>${own.filter(m=>m.hg!==m.ag && ((m.home===state.clubId&&m.hg>m.ag)||(m.away===state.clubId&&m.ag>m.hg))).length}</b><small>Vitórias</small></span><span><b>${Math.round(state.board)}</b><small>Diretoria</small></span><span><b>${money(c?.budget || 0)}</b><small>Orçamento</small></span>`}</div>${last ? `<p class="last-result">Último resultado · ${esc(D.club(state,last.home).name)} <b>${last.hg} × ${last.ag}</b> ${esc(D.club(state,last.away).name)}</p>` : ""}${lastNational ? `<p class="last-result national-result">Último resultado da Seleção · Brasil <b>${lastNational.brazil} × ${lastNational.other}</b> ${esc(lastNational.opponent)}<small>${dayDate(lastNational.day)} · ${esc(lastNational.competition)}</small></p>` : ""}</section>
          <section class="dash-card inbox-card"><div class="tag">CAIXA DE ENTRADA</div><div class="mail-count">${unread}</div><h2>${unread === 1 ? "mensagem importante" : "mensagens importantes"}</h2>${state.decision ? `<div class="home-invite"><small>CONVITE PENDENTE</small><h3>${esc(state.decision.title)}</h3><p>${esc(state.decision.body)}</p><div class="actions">${state.decision.choices.map(([id, label]) => `<button class="${id === state.decision.choices[0][0] ? "primary" : ""}" data-choice="${id}">${esc(label)}</button>`).join("")}</div></div>` : pendingOffer && pendingClub ? `<div class="home-invite"><small>${pendingOffer.transferType === "loan" ? "PROPOSTA DE EMPRÉSTIMO" : "PROPOSTA DE CONTRATO"}</small><h3>${esc(pendingClub.name)}</h3><p>${esc(pendingOffer.squadRole || pendingOffer.role || "Projeto esportivo")} · ${money(pendingOffer.salary)}/mês<br>Expira em ${Math.max(0, pendingOffer.expires - state.day)} dias.</p><button class="primary" data-join="${pendingOffer.clubId}">Aceitar proposta</button></div>` : `<p>Sem pendências. Os comunicados da carreira aparecerão aqui.</p>`}<button data-page="inbox">${unread ? "Ver também na caixa de entrada" : "Abrir caixa de entrada"}</button></section>
          <section class="dash-card competitions-card"><div class="tag">STATUS DAS COMPETIÇÕES</div><h2>Competições</h2>${statuses.map((x)=>`<div class="competition-line"><span><b>${esc(x.name)}</b><small>${esc(x.detail)}</small></span><strong>${esc(x.status)}</strong></div>`).join("") || `<p class="muted">Assine com um clube para acompanhar competições.</p>`}<button data-page="competitions">Ver competições</button></section>
          <section class="dash-card table-card"><div class="tag">CLASSIFICAÇÃO</div><h2>${c ? esc(leagueName(c.leagueId)) : "Brasileirão"}</h2>${table.slice(0,5).map((x,i)=>`<div class="standing-line ${x.id===state.clubId?"me":""}"><span>${i+1}</span><b>${esc(D.club(state,x.id).name)}</b><strong>${x.stats.points} pts</strong></div>`).join("") || `<p class="muted">Classificação indisponível.</p>`}<button data-page="league">Tabela completa</button></section>
          <section class="dash-card objectives-card"><div class="tag">OBJETIVOS E EVOLUÇÃO</div><h2>${state.mode === "player" ? `Auge projetado · GER ${D.Training.ceiling(state,D)}` : `Diretoria · ${Math.round(state.board)}/100`}</h2>${state.mode === "player" ? `${bar("GER atual",D.overall(p))}${bar("Reputação",state.reputation)}<p>${e.weeklyXI || 0} seleção(ões) da rodada · ${e.careerGoals || 0} gols na carreira.</p><button data-page="training">Abrir desenvolvimento</button>` : `${bar("Confiança da diretoria",state.board)}${bar("Pressão",state.stress)}<p>${w.name} · ${w.open ? w.remaining+" dias restantes" : "abre em "+w.remaining+" dias"}</p><button data-page="finance">Abrir diretoria</button>`}</section>
          <section class="dash-card news-card"><div class="tag">NOTÍCIAS DA CARREIRA</div><h2>Central</h2>${news(3)}<button data-page="history">Ver histórico</button></section>
        </div>
      </div>`;
    },
    profile() {
      const p = state.person,
        c = D.club(state);
      return `<div class="grid character-profile"><section class="card character-card"><h2>PERFIL DO PERSONAGEM</h2>${avatar(p)}<div class="kit-caption"><b>${esc(c?.name || "UNIFORME DE TREINO")}</b><small>Uniforme definido pelo clube.</small></div><h1>${esc(p.name)}</h1><p>${p.age} anos · ${esc(p.city)} · ${p.height} cm · ${p.weight} kg</p><div class="profile-data"><span>Posição <b>${p.pos}</b></span><span>Pé <b>${p.foot === "left" ? "Esquerdo" : "Direito"}</b></span><span>Estilo <b>${esc(p.style)}</b></span></div><div class="section"><label>Número da camisa<input id="shirt-number" type="number" min="1" max="99" value="${Career.init(state).number}"></label><button data-action="number">Salvar número</button><h3 class="section">APARÊNCIA</h3><form id="appearance-editor">${appearanceFields(p.appearance)}<label>Comemoração<select name="celebration">${opt(C.celebrations, p.celebration)}</select></label><button class="primary" type="submit">Salvar aparência</button></form></div>${state.mode === "player" && p.age >= 30 ? '<button class="section" data-action="retire">Aposentar e virar treinador</button>' : ""}</section><section class="card"><div class="split"><h2>ATRIBUTOS</h2><span class="rating-badge">${D.overall(p)}</span></div>${Charts.radar(D.Training.groupRatings(p.attrs))}${D.attrs.map((k) => bar(D.labels[k], D.Training.groupRatings(p.attrs)[k])).join("")}<div class="profile-data"><span>Gols <b>${p.goals}</b></span><span>Minutos <b>${p.minutes}</b></span><span>Seguidores <b>${state.fans}</b></span></div><p class="chart-note">Comemoração: ${esc(p.celebration)}. Registrada no perfil; ainda sem animação.</p></section></div>${evolutionPanel()}`;
    },
    squad() {
      const c = D.club(state);
      if (!c) return empty("Assine com um clube para acessar o elenco.");
      const coach = state.mode === "coach";
      return `<section class="card"><div class="split"><h2>${esc(c.name)} · ${c.roster.length} atletas</h2><span class="pill">Estrutura ${c.structure}/100</span></div>${
        coach
          ? `<label>Plano tático<select id="tactic">${opt(
              [
                ["balanced", "Equilibrado"],
                ["possession", "Posse e construção"],
                ["counter", "Bloco baixo e contra-ataque"],
                ["attack", "Ataque e risco"],
              ],
              c.tactic,
            )}</select></label><p class="muted">Posse favorece o controle. Contra-ataque protege a defesa. Ataque cria mais oportunidades e deixa espaços.</p>`
          : '<p class="muted">No modo jogador, a escalação é decidida pelo treinador do clube.</p>'
      }<div class="tablewrap"><table><thead><tr>${coach ? "<th>XI</th>" : ""}<th>Nome</th><th>Pos.</th><th>Idade</th><th>Nível</th><th>Físico</th><th>Gols</th><th>Situação</th></tr></thead><tbody>${c.roster
        .slice()
        .sort((a, b) => D.overall(b) - D.overall(a))
        .map(
          (p) =>
            `<tr class="${p.id === "hero" ? "highlight" : ""}">${coach ? `<td><input type="checkbox" class="lineup" value="${p.id}" ${c.lineup.includes(p.id) ? "checked" : ""} ${p.injury ? "disabled" : ""} aria-label="Escalar ${esc(p.name)}"></td>` : ""}<td>${esc(p.name)}</td><td>${p.pos}</td><td>${p.age}</td><td>${D.overall(p)}</td><td>${Math.round(p.condition)}%</td><td>${p.goals}</td><td>${p.injury ? "Lesão: " + p.injury + " dias" : "Disponível"}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div>${coach ? '<p><button class="primary" data-action="lineup">Salvar os 11 titulares</button></p><small>Inclua um goleiro. Ausências por lesão ou cansaço são cobertas pelo banco automaticamente.</small>' : ""}</section>`;
    },
    training() {
      if (state.mode === "coach") {
        const nextLicense = { C: "B", B: "A", A: "PRO" }[state.license];
        const licensePrice = { C: 2500, B: 5000, A: 10000 }[state.license];
        return `<div class="grid"><section class="card"><div class="tag">DESENVOLVIMENTO DO TREINADOR</div><h2>Rotina de trabalho</h2><label>Foco do treino<select id="focus">${opt([["balanced", "Equilibrado"], ...Object.entries(D.Training.skills)], state.training)}</select></label><label>Carga<select id="intensity">${opt([["rest", "Recuperação"],["normal", "Normal"],["hard", "Intensa"]], state.intensity)}</select></label><button data-action="train" class="primary">Aplicar rotina</button><p class="muted">A rotina mantém o desenvolvimento do elenco sem misturar o sistema de arquétipos exclusivo da carreira de jogador.</p></section><section class="card"><div class="tag">FORMAÇÃO PROFISSIONAL</div><h2>Licença ${esc(state.license)}</h2>${nextLicense ? `<p>Próximo nível: <b>Licença ${nextLicense}</b><br>Investimento: <b>${money(licensePrice)}</b></p><button data-action="license" ${state.wallet < licensePrice ? "disabled" : ""}>Fazer curso da Licença ${nextLicense}</button>` : `<p><b>Licença PRO concluída.</b></p><button data-action="license" disabled>Licença máxima</button>`}<p class="muted">Cursos usam o saldo pessoal do treinador e aumentam sua reputação profissional.</p></section></div><section class="card section"><h2>Estado da equipe</h2>${bar("Confiança da diretoria", state.board)}${bar("Pressão", state.stress)}<p>Reputação: <b>${Math.round(state.reputation)}/100</b><br>Saldo pessoal: <b>${money(state.wallet)}</b></p></section>`;
      }
      const plan = D.Training.init(state), arch = plan.archetype || D.Training.archetypes[state.person.pos] || D.Training.archetypes.MEI;
      const levelProgress = Math.round(((plan.developmentXp || 0) % 18) / 18 * 100);
      const unlocked = new Set(plan.specializations || []);
      const specs = Object.entries(D.Training.specializations).map(([id, spec]) => `<div class="card"><div class="tag">${unlocked.has(id) ? "ATIVA" : "ESPECIALIZAÇÃO"}</div><h3>${esc(spec.name)}</h3><p>${esc(spec.description)}</p>${unlocked.has(id) ? '<b>Especialização desbloqueada</b>' : `<button data-specialization="${id}" ${plan.specializationPoints < 1 || unlocked.size >= 3 ? "disabled" : ""}>Desbloquear · 1 ponto</button>`}</div>`).join("");
      return `<section class="card"><div class="tag">DESENVOLVIMENTO 2.0</div><div class="split"><div><h2>${esc(arch.name)} · Nível ${plan.level}</h2><p>${esc(arch.description)}</p></div><div><b>${plan.specializationPoints} ponto(s)</b><br><small>de especialização</small></div></div>${bar("Progresso do nível", levelProgress)}<p class="muted">Seu arquétipo nasce da posição e sua identidade é aprofundada pelas especializações. Partidas, objetivos e treino geram experiência de desenvolvimento.</p></section><div class="grid section"><section class="card"><h2>Rotina de trabalho</h2><label>Especialidade<select id="focus">${opt([["balanced", "Plano pelo estilo"], ...Object.entries(D.Training.skills)], state.training)}</select></label><label>Carga<select id="intensity">${opt([["rest", "Recuperação"],["normal", "Normal"],["hard", "Intensa"]], state.intensity)}</select></label><button data-action="train" class="primary">Aplicar rotina</button><p class="muted">Especializações ativas aceleram o progresso quando o treino ou a atuação combina com sua identidade. Carga intensa evolui mais rápido, mas aumenta o risco físico.</p></section><section class="card"><h2>Seu estado</h2>${bar("Condição", state.person.condition)}${bar("Moral", state.person.morale)}${bar("Pressão", state.stress)}<p>Estilo: <b>${esc(plan.style)}</b><br>Sessões: ${plan.sessions}<br>Melhorias: ${plan.improvements}<br>Seleções da rodada: ${plan.weeklyXI || 0}<br>Auge projetado: GER ${D.Training.ceiling(state,D)}</p><p>${state.person.injury ? "Lesão: " + state.person.injury + " dias de recuperação." : "Sem lesão atual."}</p></section></div><section class="section"><div class="tag">IDENTIDADE DO JOGADOR</div><h2>Especializações</h2><div class="grid">${specs}</div></section><section class="card section"><h2>27 atributos técnicos e físicos</h2><div class="skill-grid">${Object.entries(D.Training.skills).map(([k,label])=>`<div><small>${esc(label)}</small><b>${state.person.attrs[k]}</b></div>`).join("")}</div></section>`;
    },
    competitions() {
      return Expansion.competitions(state);
    },
    statistics() {
      return Expansion.statistics(state, statisticsKey);
    },
    national() {
      if (state.mode !== "player") return empty("A Seleção Brasileira está disponível na carreira de jogador.");
      if (!D.NationalTeam?.init) return `<section class="card"><h2>Seleção Brasileira</h2><p class="muted">O módulo da Seleção não foi carregado. Recarregue a aplicação.</p></section>`;
      const n = D.NationalTeam.init(state), avg = n.caps ? (n.ratingTotal / n.caps).toFixed(1) : "—", radar = D.NationalTeam.radar(state, D), upcoming = D.NationalTeam.upcoming(state);
      return `<div class="grid national-dashboard"><section class="card"><div class="tag">SELEÇÃO BRASILEIRA</div><h2>${esc(n.calledUp ? n.status : radar.label)}</h2><p>${n.calledUp ? `Você faz parte da convocação atual para <b>${esc(n.competition)}</b>. Papel previsto: <b>${esc(n.status)}</b>.` : radar.gap ? `Você está a aproximadamente <b>${radar.gap} ponto(s)</b> do nível atual de disputa. Continue atuando bem pelo clube.` : "Seu desempenho já coloca você na disputa pela próxima convocação."}</p>${bar("Momento para convocação", radar.score)}<div class="profile-data"><span>GER <b>${D.overall(state.person)}</b></span><span>Reputação <b>${Math.round(state.reputation)}</b></span><span>Moral <b>${Math.round(state.person.morale)}</b></span><span>Posição <b>${esc(state.person.pos)}</b></span></div><p class="muted">A comissão considera nível, forma no clube, reputação, moral, papel no elenco e disponibilidade física. O corte é uma estimativa, não uma garantia.</p></section><section class="card"><div class="tag">PRÓXIMA DATA FIFA</div><h2>${dayDate(n.nextWindow)}</h2><p>Em aproximadamente <b>${Math.max(0, n.nextWindow - state.day)} dias</b> · ${esc(upcoming[0]?.competition || "Agenda internacional")}</p><div class="national-fixtures">${upcoming.map((match) => `<div><time>${dayDate(match.day)}</time><b>Brasil × ${esc(match.opponent)}</b><small>${n.calledUp ? "Convocado" : "Convocação ainda não definida"}</small></div>`).join("")}</div><button data-page="calendar">Ver no calendário</button></section></div><section class="card section"><div class="tag">CARREIRA INTERNACIONAL</div><h2>Números pela Seleção</h2><div class="profile-data"><span>Jogos <b>${n.caps}</b></span><span>Titular <b>${n.starts}</b></span><span>Gols <b>${n.goals}</b></span><span>Assist. <b>${n.assists}</b></span><span>Nota média <b>${avg}</b></span><span>Melhor em campo <b>${n.motm}</b></span></div><p>Última convocação: <b>${n.lastCallupDay == null ? "Ainda não convocado" : dayDate(n.lastCallupDay)}</b></p></section><section class="card section"><h2>Jogos pela Seleção</h2>${n.matches.length ? `<div class="tablewrap"><table><thead><tr><th>Data</th><th>Competição</th><th>Jogo</th><th>Min.</th><th>Nota</th><th>G</th><th>A</th></tr></thead><tbody>${n.matches.map(m=>`<tr><td>${dayDate(m.day)}</td><td>${esc(m.competition)}</td><td>Brasil ${m.brazil} × ${m.other} ${esc(m.opponent)}</td><td>${m.minutes}</td><td>${Number(m.rating).toFixed(1)}</td><td>${m.goals}</td><td>${m.assists}</td></tr>`).join("")}</tbody></table></div>` : '<div class="empty">Nenhuma partida disputada pela Seleção ainda. Sua página continuará sendo atualizada a cada Data FIFA.</div>'}</section>`;
    },
    calendar() {
      if (!Calendar) return empty("O calendário não pôde ser carregado.");
      calendarMonth ||= Calendar.monthId(state);
      return Calendar.render(state, D, { month: calendarMonth, esc, dayDate });
    },
    awards() {
      return Expansion.awards(state);
    },
    league() {
      const id = state.leagues.some((l) => l.id === leagueKey)
          ? leagueKey
          : D.club(state)?.leagueId || state.leagues[0].id,
        league = state.leagues.find((l) => l.id === id);
      return `<section class="card"><div class="split"><div><div class="tag">${state.world === "legacy" ? "Universo regional" : "Base de clubes 2026 · Resultados simulados"}</div><h2 class="section">${esc(league.name)} · ${state.season}</h2></div><label class="chart-select">Competição<select id="league-key">${opt(
        state.leagues.map((l) => [l.id, l.name]),
        id,
      )}</select></label></div><div class="tablewrap"><table><thead><tr><th>#</th><th>Clube</th><th>PTS</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>${D.table(
        state,
        id,
      )
        .map(
          (c, i) =>
            `<tr class="${c.id === state.clubId ? "highlight" : ""}"><td>${i + 1}</td><td>${esc(c.name)}</td>${["points", "played", "w", "d", "l", "gf", "ga"].map((k) => `<td>${c.stats[k]}</td>`).join("")}<td>${c.stats.gf - c.stats.ga}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div><p class="muted">${state.fixtures.length} rodadas, turno e returno. Vitória: 3 pontos; empate: 1. ${id === "serieA" ? "Confrontos e mandos da tabela básica CBF 2026. Datas agrupadas por rodada, sem remarcações posteriores." : id === "serieB" ? "Confrontos e datas gerados para esta simulação; não representam a tabela oficial da Série B." : "Calendário original preservado."} Resultados são da sua carreira. Sem acesso, rebaixamento ou playoffs nesta versão.</p></section><section class="card section"><h2>Calendário completo</h2>${state.fixtures
        .map(
          (r, i) =>
            `<details ${i === state.round ? "open" : ""}><summary>Rodada ${i + 1} · ${dayDate((state.season - 2026) * 365 + state.calendarDays[i])} ${i < state.round ? "· Disputada" : ""}</summary><div class="round-fixtures">${r
              .filter(([h]) => D.club(state, h).leagueId === id)
              .map(([h, a]) => {
                const m = state.matches.find(
                  (m) =>
                    m.season === state.season &&
                    m.round === i + 1 &&
                    m.home === h &&
                    m.away === a,
                );
                return `<div class="${[h, a].includes(state.clubId) ? "own-fixture" : ""}"><span>${esc(D.club(state, h).name)}</span><b>${m ? m.hg + " × " + m.ag : "×"}</b><span>${esc(D.club(state, a).name)}</span></div>`;
              })
              .join("")}</div></details>`,
        )
        .join("")}</section>${
        state.world === "legacy"
          ? `<section class="card section"><h2>Entrar no futebol brasileiro</h2><p>Preserve o personagem, patrimônio e histórico. A migração acontece na próxima virada de temporada; sua liga atual continua até lá.</p><label>Clube no novo universo<select id="upgrade-club">${opt(
              D.World.clubs.map((c) => [c.id, c.name]),
              state.upgradeClub || "c0",
            )}</select></label><button data-action="upgrade-world">Migrar na próxima temporada</button>${state.upgradeClub ? '<p class="good">Migração programada. Você pode trocar o clube de destino antes da virada.</p>' : ""}</section>`
          : ""
      }`;
    },
    matches() {
      const own = state.matches.filter(
          (m) => m.home === state.clubId || m.away === state.clubId,
        ),
        list = own.length ? own : state.matches;
      const m = list[0];
      if (!m)
        return empty("Avance até a primeira rodada para ver os relatórios.");
      return `<div class="grid"><section class="card"><div class="tag">${esc(m.competitionName || leagueName(m.leagueId))} · Etapa ${m.round} · Temporada ${m.season}</div><h2 class="section">${esc(D.club(state, m.home).name)}<br>${esc(D.club(state, m.away).name)}</h2><div class="score">${m.hg} × ${m.ag}</div>${m.penalties ? `<p class="good">Pênaltis: ${m.penalties[0]} × ${m.penalties[1]}</p>` : ""}<p>${esc(m.summary)}</p><table><thead><tr><th>Indicador</th><th>Casa</th><th>Fora</th></tr></thead><tbody><tr><td>Posse</td><td>${m.possession}%</td><td>${100 - m.possession}%</td></tr>${[
        ["shots", "Finalizações"],
        ["target", "No alvo"],
        ["xg", "xG estimado"],
      ]
        .map(
          ([k, l]) =>
            `<tr><td>${l}</td><td>${m[k][0]}</td><td>${m[k][1]}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table><p class="muted">xG é a soma da qualidade estimada das chances antes da execução. Não determina o placar. Relatório exibido: partida mais recente do seu clube, ou da liga se estiver sem clube.</p>${m.ratings?.hero ? `<p>Sua nota: <b>${m.ratings.hero}</b></p>` : ""}</section><section class="card"><h2>Acontecimentos registrados</h2>${m.events.length ? m.events.map((e) => `<div class="event"><b>${e.minute}'</b>${esc(e.text)}</div>`).join("") : empty("Sem eventos relevantes registrados.")}</section></div><section class="card section"><h2>Resultados recentes</h2>${list
        .slice(0, 12)
        .map(
          (x) =>
            `<div class="news">T${x.season} · ${esc(x.competitionName || leagueName(x.leagueId))} · ${esc(D.club(state, x.home).name)} <b>${x.hg} × ${x.ag}</b> ${esc(D.club(state, x.away).name)}</div>`,
        )
        .join("")}</section>`;
    },
    inbox() {
      const eligible = Career.canTransfer(state),
        w = Career.windowStatus(state),
        e = Career.init(state);
      const offers = eligible ? state.offers : [],
        prefs = e.offerPreferences || { leagues: ["serieA", "serieB", "serieC", "serieD"], clubLevel: "any" },
        leagueOptions = [["serieA", "Série A"], ["serieB", "Série B"], ["serieC", "Série C"], ["serieD", "Série D"]];
      return `<div class="grid"><section class="card"><div class="tag">CAIXA DE ENTRADA</div><h2>Mensagens da carreira</h2><p class="muted">Propostas, decisões e comunicados importantes ficam concentrados aqui.</p>${state.decision ? `<article class="news"><time>DECISÃO PENDENTE</time><h3>${esc(state.decision.title)}</h3><p>${esc(state.decision.body)}</p><button data-page="life">Responder agora</button></article>` : ""}${offers.map((o) => {
        const c = D.club(state, o.clubId), uf = D.Competitions.clubState(c) || "—";
        return `<article class="news offer"><time>${o.transferType === "loan" ? "PROPOSTA DE EMPRÉSTIMO" : "PROPOSTA DE CONTRATO"} · expira em ${Math.max(0, o.expires - state.day)} dias</time><h3>${esc(c.name)}</h3><p><b>Estado:</b> ${esc(uf)}<br><b>Competição:</b> ${esc(leagueName(c.leagueId))}<br><b>Projeto:</b> ${esc(o.role)}<br><b>Papel esperado:</b> ${esc(o.squadRole || "Rotação")}<br><b>Duração:</b> ${Math.round((o.durationDays || 730)/365)} ano(s)<br><b>Salário:</b> ${money(o.salary)}/mês · <b>Luvas:</b> ${money(o.signingBonus || 0)}<br>Estrutura: ${c.structure}/100${o.negotiated ? " · <b>Contraproposta negociada</b>" : ""}</p><div class="actions"><button class="primary" data-join="${o.clubId}" ${w.open ? "" : "disabled"}>${w.open ? "Aceitar proposta" : "Janela fechada"}</button><button data-counter="${o.clubId}" ${o.negotiated ? "disabled" : ""}>${o.negotiated ? "Negociado" : "Pedir melhores termos"}</button><button data-reject="${o.clubId}">Recusar</button></div></article>`;
      }).join("") || empty(state.day < state.careerTransferAvailableDay ? "Você já assinou nesta janela. Novas propostas chegam na próxima janela." : "Nenhuma proposta pendente no momento.")}</section><section class="card"><div class="tag">PREFERÊNCIAS DO AGENTE</div><h2>Quais propostas quero receber?</h2><p class="muted">As preferências são usadas na geração das próximas propostas, não apenas na tela.</p>${state.mode === "player" ? (() => { const pc=e.playerCareer, ct=pc.contract, interests=pc.interests||[], advice=Career.agentAdvice(state), strategy=pc.agentStrategy||{priority:"balanced",stance:"open"}; return `<div class="notice"><div class="tag">AGENTE 2.0</div><h3>${esc(advice?.action || "Planejamento de carreira")}</h3><p>${esc(advice?.reason || "Seu agente está analisando o próximo passo.")}</p><label>Prioridade<select id="agent-priority"><option value="balanced" ${strategy.priority==="balanced"?"selected":""}>Equilíbrio</option><option value="playtime" ${strategy.priority==="playtime"?"selected":""}>Tempo de jogo</option><option value="salary" ${strategy.priority==="salary"?"selected":""}>Salário</option><option value="prestige" ${strategy.priority==="prestige"?"selected":""}>Prestígio</option><option value="development" ${strategy.priority==="development"?"selected":""}>Desenvolvimento</option></select></label><label>Postura<select id="agent-stance"><option value="stay" ${strategy.stance==="stay"?"selected":""}>Quero permanecer</option><option value="open" ${strategy.stance==="open"?"selected":""}>Aberto a propostas</option><option value="loan" ${strategy.stance==="loan"?"selected":""}>Buscar empréstimo</option><option value="leave" ${strategy.stance==="leave"?"selected":""}>Buscar saída</option></select></label><button class="primary" data-action="agent-strategy">Atualizar estratégia</button><p><b>Pipeline de mercado:</b><br>${interests.length ? interests.slice(0,5).map(x=>`${esc(D.club(state,x.clubId)?.name||"Clube")} · ${esc(x.stage)}`).join("<br>") : "Nenhum interesse ativo."}</p></div><div class="notice"><div class="tag">CARREIRA PROFISSIONAL</div><h3>Valor de mercado: ${money(pc.marketValue || 0)}</h3>${ct ? `<p><b>Contrato atual:</b> ${Math.max(0, Math.ceil((ct.endDay-state.day)/30))} mês(es) restantes<br><b>Salário:</b> ${money(state.salary)}/mês · <b>Papel:</b> ${esc(ct.role || pc.squadRole)}<br><b>Vínculo:</b> ${ct.type === "loan" ? "Empréstimo" : "Definitivo"}</p>` : `<p>Sem contrato ativo.</p>`}<p><b>Clubes interessados:</b><br>${interests.length ? interests.slice(0,5).map(x=>`${esc(D.club(state,x.clubId)?.name||"Clube")} · ${esc(x.stage)}`).join("<br>") : "Nenhuma sondagem ativa."}</p>${pc.renewalOffer ? `<div class="news"><b>Renovação disponível</b><br>${Math.round(pc.renewalOffer.durationDays/365)} anos · ${money(pc.renewalOffer.salary)}/mês · luvas ${money(pc.renewalOffer.signingBonus)}<div class="actions"><button class="primary" data-action="accept-renewal">Aceitar renovação</button><button data-action="reject-renewal">Recusar</button></div></div>` : ""}</div>`; })() : ""}${state.mode === "player" && state.clubId ? (() => { const pc=e.playerCareer, objectives=Career.matchObjectives(state); return `<div class="notice"><div class="tag">RELAÇÃO COM O TÉCNICO</div><h3>${esc(pc.squadRole)} · ${Math.round(pc.coachTrust)}/100</h3>${bar("Confiança do técnico",pc.coachTrust)}<p><b>Objetivos da próxima partida:</b><br>${objectives.map(o=>"• "+esc(o.label)).join("<br>")}</p><small>Cumpridos na carreira: ${pc.objectivesMet}/${pc.objectivesTotal}${pc.lastEvaluation ? ` · última nota ${pc.lastEvaluation.rating}` : ""}</small></div>`; })() : ""}${state.world === "brazil2026" ? `<h3>Divisões</h3><div class="offer-pref-leagues">${leagueOptions.map(([id, label]) => `<label><input type="checkbox" class="offer-league" value="${id}" ${prefs.leagues.includes(id) ? "checked" : ""}> ${label}</label>`).join("")}</div>` : ""}<label>Nível dos clubes<select id="offer-club-level"><option value="any" ${prefs.clubLevel === "any" ? "selected" : ""}>Qualquer clube</option><option value="elite" ${prefs.clubLevel === "elite" ? "selected" : ""}>Somente clubes de elite</option><option value="competitive" ${prefs.clubLevel === "competitive" ? "selected" : ""}>Clubes competitivos</option><option value="intermediate" ${prefs.clubLevel === "intermediate" ? "selected" : ""}>Clubes intermediários</option><option value="small" ${prefs.clubLevel === "small" ? "selected" : ""}>Clubes menores</option></select></label><button class="primary" data-action="offer-prefs">Salvar preferências</button><h2 class="section">Comunicados recentes</h2>${state.news.slice(0, 8).map((n) => `<article class="news"><time>${dayDate(n.day)}</time><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join("") || empty("Nenhuma mensagem recente.")}</section></div>`;
    },
    market() {
      const c = D.club(state),
        w = Career.windowStatus(state),
        e = Career.init(state);
      return `<section class="card"><h2>Janelas de transferências</h2><div class="grid3">${[
        ["Início do ano", "01/01 a 28/02"], ["Meio do ano", "01/07 a 31/08"], ["Final do ano", "15/11 a 31/12"],
      ].map(([name, dates]) => `<div class="window-card ${w.name === name ? "open" : ""}"><small>${name}</small><h3>${dates}</h3><b>${w.name === name ? "ABERTA" : ""}</b></div>`).join("")}</div><p class="${w.open ? "good" : "bad"}">${esc(w.name)} · ${w.open ? w.remaining + " dias restantes" : "Próxima abertura em " + w.remaining + " dias"}</p><p class="chart-note">O mercado registra negociações simuladas entre os clubes conforme orçamento, nível do atleta e carências do elenco.</p></section><section class="card section"><div class="tag">CENTRAL DO MERCADO</div><h2>Transferências confirmadas</h2><div class="tablewrap"><table><thead><tr><th>Data</th><th>Jogador</th><th>Pos.</th><th>Origem</th><th>Destino</th><th>Transferência</th><th>Salário</th></tr></thead><tbody>${e.transfers.slice(0, 30).map((t) => `<tr><td>${dayDate(t.day)}</td><td>${esc(t.player)}</td><td>${esc(t.pos || "—")}</td><td>${esc(t.from)}</td><td>${esc(t.to)}</td><td>${t.fee ? money(t.fee) : "Livre"}</td><td>${t.salary ? money(t.salary) + "/mês" : "—"}</td></tr>`).join("")}</tbody></table></div>${!e.transfers.length ? empty("Nenhuma transferência confirmada ainda. Avance os dias durante uma janela aberta.") : ""}</section>${
        state.mode === "coach" && c
          ? `<section class="card section"><h2>Scouting e contratação</h2><p>Orçamento do clube: <b>${money(c.budget)}</b></p><p class="muted">Valores estimados por nível e idade. Atletas muito acima da estrutura podem recusar; clubes preservam o elenco mínimo.</p><div class="tablewrap"><table><thead><tr><th>Atleta</th><th>Clube</th><th>Pos.</th><th>Idade</th><th>Nível</th><th>Preço</th><th></th></tr></thead><tbody>${state.clubs.filter((x) => x.id !== c.id).flatMap((x) => x.roster.filter((p) => p.pos !== "GOL").slice().sort((a, b) => D.overall(b) - D.overall(a)).slice(0, 3).map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(x.name)}</td><td>${p.pos}</td><td>${p.age}</td><td>${D.overall(p)}</td><td>${money(A.valuation(p))}</td><td><button data-recruit="${p.id}" data-source="${x.id}" ${w.open ? "" : "disabled"}>Contratar</button></td></tr>`)).join("")}</tbody></table></div></section>`
          : ""
      }`;
    },
    life() {
      const e = Career.init(state);
      const life = D.Life.init(state);
      const media = Career.mediaProfile(state);
      return `<div class="grid"><section class="card"><h2>Fora das quatro linhas</h2>${bar("Relação com a família", state.family)}${bar("Pressão e estresse", state.stress)}${bar("Reputação", state.reputation)}${bar("Percepção da torcida", media.fanSentiment)}${bar("Apelo comercial", media.sponsorAppeal)}<div class="notice"><div class="tag">IMAGEM PÚBLICA</div><h3>${esc(media.image)}</h3><p>Pressão da mídia: <b>${Math.round(media.pressure)}/100</b><br>Entrevistas: <b>${media.interviews}</b> · Controvérsias: <b>${media.controversies}</b></p></div><p>Seguidores: ${state.fans.toLocaleString("pt-BR")}<br>Saldo: ${money(state.wallet)}</p>${life.agency ? `<div class="notice"><h3>Assessoria ativa</h3><p>${esc(life.agency.name)} · desde ${dayDate(life.agency.hiredDay)}</p><b>${money(life.agency.monthlyCost)} por mês</b></div>` : '<p class="muted">Sem agência contratada. Uma proposta pode chegar pela caixa de entrada.</p>'}<p class="muted">Decisões alteram indicadores, moral, finanças e progresso de treino.</p>${e.promise ? `<div class="notice"><h3>Promessa da entrevista</h3><p>Vencer dois dos próximos três jogos.</p><b>${e.promise.wins} vitória(s) · ${e.promise.games} jogo(s) restante(s)</b></div>` : ""}</section><section class="card"><div class="tag">CAIXA DE ENTRADA</div><h2 class="section">${esc(state.decision?.title || "Nenhum convite pendente")}</h2>${state.decision ? `<p>${esc(state.decision.body)}</p><div class="actions">${state.decision.choices.map(([id, label]) => `<button data-choice="${id}">${esc(label)}</button>`).join("")}</div>` : '<p class="muted">Continue a carreira. Convites surgem a cada três semanas.</p>'}</section></div><section class="card section"><h2>Repercussão na imprensa</h2>${
        e.feed
          .filter((p) => p.category === "Imprensa")
          .slice(0, 6)
          .map(
            (p) =>
              `<article class="news"><time>${dayDate(p.day)}</time><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></article>`,
          )
          .join("") || empty("Suas entrevistas e as cobranças aparecerão aqui.")
      }</section>`;
    },
    finance() {
      const c = D.club(state),
        e = Career.init(state),
        assets = Career.assetValue(state),
        cost = Career.upkeep(state);
      return `<div class="stats"><div class="stat"><small>Saldo disponível</small><b class="money-value">${money(state.wallet)}</b></div><div class="stat"><small>Bens pelo preço de compra</small><b class="money-value">${money(assets)}</b></div><div class="stat"><small>Patrimônio total</small><b class="money-value">${money(state.wallet + assets)}</b></div><div class="stat"><small>Manutenção dos bens / mês</small><b class="money-value">${money(cost)}</b></div></div><div class="grid"><section class="card"><h2>Finanças pessoais</h2><p>Salário mensal: ${money(state.salary)}${state.clubId ? "" : " (sem vínculo: não recebido)"}<br>Despesas pessoais: ${money(state.mode === "coach" ? 2000 : 650)} / mês<br>Manutenção: ${money(cost)} / mês<br>Contrato: ${state.contract} dias</p><p class="muted">Pagamentos a cada 30 dias. Bens não geram renda passiva. Revenda: 70% do preço de compra.</p></section><section class="card"><h2>Finanças do clube</h2>${c ? `<p>Orçamento disponível: <b>${money(c.budget)}</b><br>Custos mensais: ${money(22000)} + seu salário.</p><p class="muted">Compras pessoais usam apenas seu saldo; contratações usam o orçamento do clube.</p>` : empty("Sem clube atual.")}</section></div><section class="card section"><h2>Compras e patrimônio</h2><p class="chart-note">Valores e benefícios fictícios para a simulação. Sem pagamentos reais. Manutenção é cobrada no fechamento mensal.</p><div class="grid3 shop-grid">${Career.shop
        .map((item) => {
          const owned = e.assets.includes(item.id);
          return `<article class="card shop-item"><div class="tag">${esc(item.category)}</div><h3 class="section">${esc(item.name)}</h3><b>${money(item.price)}</b><p>${esc(item.effect)}<br>Manutenção: ${money(item.upkeep)} / mês</p>${owned ? `<span class="pill">ADQUIRIDO</span><button data-sell="${item.id}">Vender por ${money(Math.round(item.price * 0.7))}</button>` : `<button data-buy="${item.id}" ${state.wallet < item.price ? "disabled" : ""}>Comprar</button>`}</article>`;
        })
        .join(
          "",
        )}</div></section><section class="card section"><h2>Extrato pessoal</h2><div class="tablewrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th></tr></thead><tbody>${e.ledger
        .slice(0, 20)
        .map(
          (t) =>
            `<tr><td>${dayDate(t.day)}</td><td>${esc(t.label)}</td><td class="${t.amount >= 0 ? "good" : "bad"}">${money(t.amount)}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div>${!e.ledger.length ? empty("O extrato começa a registrar movimentos nesta versão.") : ""}</section>`;
    },
    legacy() {
      const l = Career.legacySnapshot(state), n=l.national;
      return `<div class="grid"><section class="card"><div class="tag">LEGADO DA CARREIRA</div><h1>${esc(l.tier)}</h1><div class="metric-row"><span><b>${l.score}</b><small>Pontos de legado</small></span><span><b>${l.seasons}</b><small>Temporadas</small></span><span><b>${l.titles}</b><small>Títulos de liga</small></span><span><b>${l.awards}</b><small>Prêmios</small></span></div><h3 class="section">Números da carreira</h3><div class="profile-data"><span>Jogos <b>${l.games}</b></span><span>Gols <b>${l.goals}</b></span><span>Assistências <b>${l.assists}</b></span><span>Reputação <b>${Math.round(state.reputation)}</b></span></div><h3 class="section">Eficiência ofensiva</h3>${(()=>{const a=l.offensiveAnalytics||{}, apps=a.appearances||0, shots=a.shots||0; return `<div class="profile-data"><span>Finalizações <b>${shots}</b></span><span>No alvo <b>${a.onTarget||0}</b></span><span>xG acumulado <b>${Number(a.xg||0).toFixed(1)}</b></span><span>Gols / jogo <b>${apps ? ((a.goals||0)/apps).toFixed(2) : "0.00"}</b></span><span>Conversão <b>${shots ? Math.round((a.goals||0)/shots*100) : 0}%</b></span></div>`})()}${l.retired ? `<div class="section"><span class="pill">CARREIRA ENCERRADA</span><p>O legado permanece disponível neste save.</p></div>` : `<p class="chart-note">Seu legado cresce com desempenho, títulos, Seleção e grandes temporadas.</p>`}</section><section class="card"><div class="tag">SELEÇÃO BRASILEIRA</div><h2>Marca internacional</h2><div class="profile-data"><span>Jogos <b>${n.caps}</b></span><span>Gols <b>${n.goals}</b></span><span>Assistências <b>${n.assists}</b></span></div><h3 class="section">Clubes defendidos</h3><p>${l.clubs.length ? l.clubs.map(esc).join(" · ") : "A trajetória por clubes será registrada nas transferências."}</p>${l.biggestTransfer ? `<p><b>Maior transferência:</b> ${esc(l.biggestTransfer.from)} → ${esc(l.biggestTransfer.to)} · ${money(l.biggestTransfer.fee || 0)}</p>` : ""}<h3 class="section">Rivalidades</h3>${l.rivals.length ? l.rivals.map((r)=>`<article class="news"><h3>${esc(r.club)}</h3><p>${r.games} jogos · ${r.wins}V ${r.draws}E ${r.losses}D · ${r.goals} gols · ${r.assists} assistências</p></article>`).join("") : empty("As rivalidades surgem conforme você enfrenta os mesmos adversários.")}</section></div>`;
    },
    history() {
      const e = Career.init(state),
        living = Career.livingWorldSnapshot(state),
        posts = e.feed.filter(
          (p) => feedKey === "Todos" || p.category === feedKey,
        );
      const worldPanel = `<section class="card"><div class="tag">MUNDO VIVO</div><h2>O futebol continua acontecendo</h2><div class="grid"><div><small>MOMENTO DO SEU CLUBE</small><h3>${esc(living.currentClubForm?.status || "Sem tendência")}</h3><p>${living.currentClubForm?.games ? `${living.currentClubForm.points} ponto(s) nos últimos ${living.currentClubForm.games} jogos registrados.` : "A forma será calculada conforme os jogos acontecem."}</p></div><div><small>DISPUTA NA SUA POSIÇÃO</small>${living.positionRivals.length ? living.positionRivals.map((r)=>`<p><b>${esc(r.name)}</b> · GER ${r.overall}${r.injury ? ` · lesionado (${r.injury}d)` : r.suspension ? " · suspenso" : ""}</p>`).join("") : "<p>Sem concorrentes diretos registrados.</p>"}</div></div><h3 class="section">Bastidores recentes</h3>${living.managerChanges.slice(0,3).map((x)=>`<article class="news"><time>${dayDate(x.day)}</time><h3>Mudança no comando</h3><p>${esc(x.club)} alterou a comissão técnica.</p></article>`).join("") || ""}${living.injuries.slice(0,3).map((x)=>`<article class="news"><time>${dayDate(x.day)}</time><h3>Departamento médico</h3><p>${esc(x.player)} · ${x.days} dias previstos.</p></article>`).join("") || empty("O mundo vivo ganhará acontecimentos conforme a carreira avança.")}</section>`;
      return `<div class="grid">${worldPanel}<section class="card"><h2>Histórico da carreira</h2>${state.history.length ? state.history.map((h) => `<article class="news"><time>Temporada ${h.season} · ${esc(h.league || "Carreira")}</time><h3>${h.event ? esc(h.event) : esc(h.champion) + " campeão"}</h3><p>${h.event ? esc(h.event) : "Sua posição: " + (h.position || "Sem participação") + " · " + h.goals + " gols · " + (h.minutes || 0) + " minutos"}</p></article>`).join("") : empty("Os títulos e resumos entram ao encerrar a temporada.")}<h3 class="section">Transferências registradas</h3>${
        e.transfers
          .slice(0, 12)
          .map(
            (t) =>
              `<article class="news"><time>${dayDate(t.day)}</time><h3>${esc(t.player)}</h3><p>${esc(t.from)} → ${esc(t.to)}${t.fee ? " · " + money(t.fee) : ""}</p></article>`,
          )
          .join("") || empty("Nenhuma transferência registrada.")
      }</section><section class="card social-feed"><div class="split"><div><div class="tag">REDE DO FUTEBOL</div><h2>O que está acontecendo</h2></div><label class="chart-select">Filtrar<select id="feed-key">${opt(["Todos", "Mundo do futebol", "Carreira", "Transferências", "Competições", "Imprensa", "Torcida", "Rumores", "Vida pessoal"], feedKey)}</select></label></div><p class="chart-note">Todas as publicações retratam sua carreira simulada. Rumores não confirmam acordos.</p>${
        posts
          .slice(0, 30)
          .map(
            (p) =>
              `<article class="social-post"><div class="post-author"><span class="author-mark">${esc(p.author.charAt(0))}</span><div><b>${esc(p.author)}</b><small>${dayDate(p.day)} · ${esc(p.category)}</small></div>${p.kind === "rumor" ? '<span class="pill">RUMOR</span>' : ""}</div><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p><button class="like-button ${p.liked ? "liked" : ""}" data-like="${esc(p.id)}">${p.liked ? "Curtido" : "Curtir"} · ${p.likes}</button></article>`,
          )
          .join("") || empty("Nenhuma publicação neste filtro.")
      }</section></div>`;
    },
    save() {
      return `<div class="grid"><section class="card"><h2>Guarde sua história</h2><p>Autosave usa o armazenamento deste navegador. Trocar de navegador, mover o jogo ou limpar dados pode impedir recuperar esse save.</p><div class="actions"><button class="primary" data-action="export">Exportar arquivo JSON</button><button data-action="import">Importar save</button></div><p>Exporte ao encerrar e guarde o JSON numa pasta sua. A importação valida estrutura, versão e dados expandidos.</p><button data-action="new" class="danger">Criar outra carreira</button></section><section class="card"><h2>Guia rápido</h2><p>1. Escolha uma proposta.<br>2. Configure treino ou tática.<br>3. Navegue por competições, estatísticas e prêmios.<br>4. Tome decisões de vida.<br>5. Exporte seu save.</p><p>Versão 0.4 inclui Séries A/B/C/D, cobertura parcial C/D, competições complementares, 27 atributos, estatísticas, prêmios e agência persistente.</p><p class="muted">Não há telemetria, conta, senha ou pagamentos reais.</p></section></div>`;
    },
  };
  function news(n) {
    return state.news
      .slice(0, n)
      .map(
        (x) =>
          `<article class="news"><time>T${x.season} · Dia ${x.day}</time><h3 style="margin-top:8px">${esc(x.title)}</h3><p>${esc(x.body)}</p></article>`,
      )
      .join("");
  }
  function persist() {
    if (!S.save(state))
      toast("Autosave indisponível neste navegador. Use Exportar save.");
  }
  function command(action, data) {
    try {
      A.execute(state, action, data);
      persist();
      render();
      toast("Ação concluída.");
    } catch (e) {
      toast(e.message);
    }
  }
  function exportSave() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "PRO_LIFE_T" + state.season + "_dia" + state.day + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Save exportado. Guarde o arquivo JSON.");
  }
  function importSave() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.addEventListener("change", async () => {
      try {
        const f = input.files[0];
        if (!f) return;
        if (f.size > 3000000)
          throw Error("Arquivo muito grande. Limite: 3 MB.");
        const parsed = S.parse(await f.text());
        if (
          state &&
          !confirm("Substituir a carreira atual pelo arquivo importado?")
        )
          return;
        state = parsed;
        setup = false;
        page = "home";
        persist();
        render();
        toast("Carreira importada.");
      } catch (e) {
        toast("Não foi possível importar: " + e.message);
      }
    });
    input.click();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.page) {
      page = b.dataset.page;
      if (page === "calendar" && !calendarMonth) calendarMonth = Calendar?.monthId(state);
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (b.dataset.advance) {
      command("advance", { days: Number(b.dataset.advance) });
      return;
    }
    if (b.dataset.calendar) {
      calendarMonth = b.dataset.calendar === "today" ? Calendar.monthId(state) : Calendar.shift(calendarMonth || Calendar.monthId(state), b.dataset.calendar === "prev" ? -1 : 1);
      render();
      return;
    }
    if (b.dataset.join) {
      command("join", { id: b.dataset.join });
      return;
    }
    if (b.dataset.reject) {
      command("reject", { id: b.dataset.reject });
      return;
    }
    if (b.dataset.counter) {
      command("counterOffer", { id: b.dataset.counter });
      return;
    }
    if (b.dataset.choice) {
      command("decide", { choice: b.dataset.choice });
      return;
    }
    for (const [key, action] of [
      ["buy", "buy"],
      ["sell", "sell"],
      ["like", "like"],
    ]) {
      if (b.dataset[key]) {
        command(action, { id: b.dataset[key] });
        return;
      }
    }
    if (b.dataset.recruit) {
      command("recruit", {
        clubId: b.dataset.source,
        playerId: b.dataset.recruit,
      });
      return;
    }
    if (b.dataset.specialization) {
      command("specialization", { id: b.dataset.specialization });
      return;
    }
    switch (b.dataset.action) {
      case "number":
        command("number", { value: $("#shirt-number").value });
        break;
      case "upgrade-world":
        command("upgradeWorld", { clubId: $("#upgrade-club").value });
        break;
      case "export":
        if (state) exportSave();
        break;
      case "import":
        importSave();
        break;
      case "new":
        setup = true;
        render();
        break;
      case "resume":
        setup = false;
        render();
        break;
      case "accept-renewal":
        command("acceptRenewal");
        break;
      case "reject-renewal":
        command("rejectRenewal");
        break;
      case "agent-strategy":
        command("agentStrategy", {
          priority: $("#agent-priority")?.value || "balanced",
          stance: $("#agent-stance")?.value || "open",
        });
        break;
      case "offer-prefs":
        command("offerPrefs", {
          leagues: [...document.querySelectorAll(".offer-league:checked")].map((el) => el.value),
          clubLevel: $("#offer-club-level")?.value || "any",
        });
        break;
      case "train":
        command("train", {
          focus: $("#focus").value,
          intensity: $("#intensity").value,
        });
        break;
      case "lineup":
        command("lineup", {
          ids: [...document.querySelectorAll(".lineup:checked")].map(
            (el) => el.value,
          ),
        });
        break;
      case "license":
        command("license");
        break;
      case "retire":
        if (
          confirm(
            "Encerrar sua carreira de jogador e iniciar como treinador neste universo?",
          )
        )
          command("retire");
        break;
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "appearance-editor") return;
    e.preventDefault();
    const f = new FormData(e.target),
      appearance = {};
    [
      "skin",
      "hairColor",
      "eyeColor",
      "hair",
      "beard",
      "body",
      "accessory",
      "tattoo",
    ].forEach((k) => (appearance[k] = f.get(k)));
    command("appearance", { appearance, celebration: f.get("celebration") });
  });
  document.addEventListener("input", (e) => {
    if (
      e.target.closest("#appearance-editor") &&
      e.target.name !== "celebration"
    ) {
      const f = new FormData($("#appearance-editor")),
        p = { ...state.person, appearance: Object.fromEntries(f.entries()) };
      const holder = $(".character-card .avatar-stage");
      window.ProLifeAvatar3D?.show(
        holder,
        { ...p, number: Career.init(state).number },
        C.kit(D.club(state)),
      );
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "chart-range") {
      chartRange = e.target.value;
      render();
      return;
    }
    if (e.target.id === "league-key") {
      leagueKey = e.target.value;
      render();
      return;
    }
    if (e.target.id === "statistics-key") {
      statisticsKey = e.target.value;
      render();
      return;
    }
    if (e.target.id === "feed-key") {
      feedKey = e.target.value;
      render();
      return;
    }
    if (e.target.id === "chart-key") {
      chartKey = e.target.value;
      render();
      return;
    }
    if (e.target.id === "tactic") command("tactic", { value: e.target.value });
  });
  render();
})();
