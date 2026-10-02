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
  let chartKey = "overall",
    chartRange = "90",
    leagueKey = "",
    feedKey = "Todos";
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
      )}</div><p class="chart-note">Foco: ${esc(D.labels[state.training] || "Equilibrado")} · Carga: ${esc({ normal: "Normal", hard: "Intensa", rest: "Recuperação" }[state.intensity])} · Progresso de treino: ${state.trainingProgress.toFixed(1)} / 10. Registros semanais e a cada melhoria. Histórico disponível desde ${dayDate(entries[0].day)}.</p><details><summary>Ver registros e variações</summary><div class="tablewrap"><table><thead><tr><th>Data</th><th>GER</th>${D.attrs.map((k) => `<th>${esc(D.labels[k])}</th>`).join("")}<th>Físico</th><th>Moral</th></tr></thead><tbody>${rows.map((e) => `<tr><td>${dayDate(e.day)}</td><td>${e.overall}</td>${D.attrs.map((k) => `<td>${e.attrs[k]}</td>`).join("")}<td>${e.condition === undefined ? "—" : Math.round(e.condition) + "%"}</td><td>${e.morale === undefined ? "—" : Math.round(e.morale)}</td></tr>`).join("")}</tbody></table></div></details></section>`;
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
      nav = [
        ["home", "Visão geral"],
        ["profile", "Meu personagem"],
        ["squad", "Elenco e tática"],
        ["training", "Treinamento"],
        ["league", "Liga e calendário"],
        ["competitions", "Competições"],
        ["matches", "Central de partidas"],
        ["statistics", "Estatísticas"],
        ["awards", "Prêmios"],
        ["market", "Mercado"],
        ["life", "Vida e decisões"],
        ["finance", "Finanças"],
        ["history", "História"],
        ["save", "Saves e ajuda"],
      ];
    $("#app").innerHTML =
      `<div class="layout"><aside class="sidebar"><div class="brand">PRO<span>LIFE</span></div><nav>${nav.map(([id, label]) => `<button data-page="${id}" class="${page === id ? "active" : ""}">${label}</button>`).join("")}</nav><small>FOOTBALL CAREER<br><br>CARREIRA ${state.season}<br>${state.world === "legacy" ? "Liga Horizonte" : "Brasil A/B/C/D 2026"}<br>Carreira simulada<br>Modo ${state.mode === "player" ? "Jogador" : "Treinador"}</small></aside><main class="main"><div class="topbar"><div><div class="tag">${esc(c?.name || "Livre no mercado")} · Temporada ${state.season}</div><h1>${esc(nav.find((n) => n[0] === page)?.[1] || "Visão geral")}</h1><small>${date()} · Rodada ${state.round}/${state.fixtures.length}</small></div><div class="actions"><button data-action="export">Exportar save</button><button data-advance="1">+1 dia</button><button class="primary" data-advance="7">Avançar 7 dias →</button><button data-advance="30">+30 dias</button></div></div>${views[page]()}<div class="footer">PRO LIFE 0.4 · Carreira salva automaticamente · Exportar save cria sua cópia de segurança.</div></main></div>`;
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
      const c = D.club(state),
        p = state.person,
        e = Career.init(state),
        m = state.matches.find(
          (m) => m.home === state.clubId || m.away === state.clubId,
        ),
        next = state.fixtures[state.round]?.find((pair) =>
          pair.includes(state.clubId),
        ),
        w = Career.windowStatus(state);
      const facts = [
        ["Nacionalidade", p.nationality],
        ["Posição", state.mode === "coach" ? "Treinador" : p.pos],
        ["Pé dominante", p.foot === "left" ? "Esquerdo" : "Direito"],
        ["Altura / peso", p.height + " cm / " + p.weight + " kg"],
        ["Estilo", p.style],
        ["Comemoração", p.celebration],
        ["Salário mensal", money(state.salary)],
        ["Contrato", state.contract + " dias"],
        ["Seguidores", state.fans.toLocaleString("pt-BR")],
        ["Disciplina", Math.round(p.discipline) + " / 100"],
        ["Família", Math.round(state.family) + " / 100"],
        ["Pressão", Math.round(state.stress) + " / 100"],
      ];
      return `<section class="card hero"><div class="profileflex">${avatar(p)}<div class="hero-info"><div class="tag">${esc(c ? leagueName(c.leagueId) : "Livre no mercado")} · ${state.mode === "player" ? "Jogador" : "Treinador"}</div><div class="identity-line"><span class="shirt-number">${e.number}</span><div><h1>${esc(p.name)}</h1><p>${p.age} anos · ${esc(p.city)} · ${esc(c?.name || "Sem clube")}</p></div><span class="rating-badge">${state.mode === "player" ? D.overall(p) : Math.round(state.board)}<small>${state.mode === "player" ? "GER" : "CONF"}</small></span></div><span class="pill">${p.injury ? "Lesão: " + p.injury + " dias" : "Disponível"}</span><span class="pill">${esc(p.style)}</span><div class="hero-attributes">${D.attrs.map((k) => `<div><small>${esc(D.labels[k])}</small><b>${p.attrs[k]}</b></div>`).join("")}</div></div></div></section><div class="stats"><div class="stat"><small>Gols na temporada</small><b>${p.goals}</b></div><div class="stat"><small>Minutos na temporada</small><b>${p.minutes}</b></div><div class="stat"><small>Nota média registrada</small><b>${e.played ? (e.ratingTotal / e.played).toFixed(1) : "—"}</b></div><div class="stat"><small>Posição na liga</small><b>${c ? D.table(state).findIndex((x) => x.id === c.id) + 1 + "º" : "—"}</b></div></div><div class="grid"><section class="card"><h2>Ficha completa da carreira</h2><div class="facts-grid">${facts.map(([l, v]) => `<div><small>${esc(l)}</small><b>${esc(v)}</b></div>`).join("")}</div><div class="profile-data"><span>Gols de carreira registrados<b>${e.careerGoals}</b></span><span>Minutos registrados<b>${e.careerMinutes}</b></span><span>Reputação<b>${Math.round(state.reputation)}</b></span><span>Saldo disponível<b>${money(state.wallet)}</b></span></div><p class="chart-note">Potencial de desenvolvimento existe, mas não garante evolução. A nota média começa a ser registrada nesta versão.</p><button data-page="profile">Editar meu personagem</button></section><section class="card"><h2>Próximos compromissos</h2>${next ? `<div class="fixture-preview"><small>${leagueName(c.leagueId)} · Rodada ${state.round + 1}</small><h3>${esc(D.club(state, next[0]).name)} × ${esc(D.club(state, next[1]).name)}</h3><p>${dayDate(D.nextFixtureDay(state))} · Em ${Math.max(0, D.nextFixtureDay(state) - state.day)} dias</p></div>` : empty(c ? "Calendário da temporada encerrado." : "Escolha um clube no mercado.")}${state.decision ? `<div class="notice">${esc(state.decision.title)}<p><button data-page="life">Responder convite</button></p></div>` : ""}<p class="${w.open ? "good" : "muted"}">${esc(w.name)} · ${w.open ? w.remaining + " dias restantes" : "Abre em " + w.remaining + " dias"}</p>${bar("Condição física", p.condition)}${bar("Moral", p.morale)}${m ? `<p>Último resultado: ${esc(D.club(state, m.home).name)} <b>${m.hg} × ${m.ag}</b> ${esc(D.club(state, m.away).name)}</p><button data-page="matches">Relatório da partida</button>` : ""}</section></div>${evolutionPanel()}<section class="card section"><h2>Notícias da carreira</h2>${news(5)}</section>`;
    },
    profile() {
      const p = state.person,
        c = D.club(state);
      return `<div class="grid character-profile"><section class="card character-card"><h2>PERFIL DO PERSONAGEM</h2>${avatar(p)}<div class="kit-caption"><b>${esc(c?.name || "UNIFORME DE TREINO")}</b><small>Uniforme definido pelo clube.</small></div><h1>${esc(p.name)}</h1><p>${p.age} anos · ${esc(p.city)} · ${p.height} cm · ${p.weight} kg</p><div class="profile-data"><span>Posição <b>${p.pos}</b></span><span>Pé <b>${p.foot === "left" ? "Esquerdo" : "Direito"}</b></span><span>Estilo <b>${esc(p.style)}</b></span></div><div class="section"><label>Número da camisa<input id="shirt-number" type="number" min="1" max="99" value="${Career.init(state).number}"></label><button data-action="number">Salvar número</button><h3 class="section">APARÊNCIA</h3><form id="appearance-editor">${appearanceFields(p.appearance)}<label>Comemoração<select name="celebration">${opt(C.celebrations, p.celebration)}</select></label><button class="primary" type="submit">Salvar aparência</button></form></div>${state.mode === "player" && p.age >= 30 ? '<button class="section" data-action="retire">Aposentar e virar treinador</button>' : ""}</section><section class="card"><div class="split"><h2>ATRIBUTOS</h2><span class="rating-badge">${D.overall(p)}</span></div>${Charts.radar(p.attrs)}${D.attrs.map((k) => bar(D.labels[k], p.attrs[k])).join("")}<div class="profile-data"><span>Gols <b>${p.goals}</b></span><span>Minutos <b>${p.minutes}</b></span><span>Seguidores <b>${state.fans}</b></span></div><p class="chart-note">Comemoração: ${esc(p.celebration)}. Registrada no perfil; ainda sem animação.</p></section></div>${evolutionPanel()}`;
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
      return `<div class="grid"><section class="card"><h2>Rotina de trabalho</h2><label>Especialidade<select id="focus">${opt([["balanced", "Plano pelo estilo"], ...Object.entries(D.Training.skills)], state.training)}</select></label><label>Carga<select id="intensity">${opt(
        [
          ["rest", "Recuperação"],
          ["normal", "Normal"],
          ["hard", "Intensa"],
        ],
        state.intensity,
        )}</select></label><button data-action="train" class="primary">Aplicar rotina</button><p class="muted">${state.mode === "player" ? "A evolução combina especialidade, estilo de jogo, disciplina, idade e carga. O progresso fecha ciclos a cada 10 pontos; carga intensa evolui mais rápido e aumenta o risco de lesão." : "O plano individual é voltado ao atleta. Como treinador, use tática, escalação e licenças."}</p></section><section class="card"><h2>Seu estado</h2>${bar("Condição", state.person.condition)}${bar("Moral", state.person.morale)}${bar("Pressão", state.stress)}<p>Estilo aplicado: <b>${esc(D.Training.init(state).style)}</b><br>Sessões registradas: ${D.Training.init(state).sessions}<br>Melhorias: ${D.Training.init(state).improvements}</p><p>${state.person.injury ? "Lesão: " + state.person.injury + " dias de recuperação." : "Sem lesão atual."}</p>${state.mode === "coach" ? `<p>Licença atual: <b>${state.license}</b></p><button data-action="license">Curso de licença (${money({ C: 2500, B: 5000, A: 10000, PRO: 0 }[state.license] || 0)})</button>` : ""}</section></div><section class="card section"><h2>27 atributos técnicos e físicos</h2><div class="skill-grid">${Object.entries(D.Training.skills).map(([k, label]) => `<div><small>${esc(label)}</small><b>${state.person.attrs[k]}</b></div>`).join("")}</div></section>`;
    },
    competitions() {
      return Expansion.competitions(state);
    },
    statistics() {
      return Expansion.statistics(state);
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
      return `<div class="grid"><section class="card"><div class="tag">Rodada ${m.round} · Temporada ${m.season}</div><h2 class="section">${esc(D.club(state, m.home).name)}<br>${esc(D.club(state, m.away).name)}</h2><div class="score">${m.hg} × ${m.ag}</div><p>${esc(m.summary)}</p><table><thead><tr><th>Indicador</th><th>Casa</th><th>Fora</th></tr></thead><tbody><tr><td>Posse</td><td>${m.possession}%</td><td>${100 - m.possession}%</td></tr>${[
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
            `<div class="news">T${x.season} · R${x.round} · ${esc(D.club(state, x.home).name)} <b>${x.hg} × ${x.ag}</b> ${esc(D.club(state, x.away).name)}</div>`,
        )
        .join("")}</section>`;
    },
    market() {
      const eligible = Career.canTransfer(state);
      const c = D.club(state),
        w = Career.windowStatus(state);
      return `<section class="card"><h2>Janelas de transferências</h2><div class="grid3">${[
        ["Início do ano", "01/01 a 28/02"],
        ["Meio do ano", "01/07 a 31/08"],
        ["Final do ano", "15/11 a 31/12"],
      ]
        .map(
          ([name, dates]) =>
            `<div class="window-card ${w.name === name ? "open" : ""}"><small>${name}</small><h3>${dates}</h3><b>${w.name === name ? "ABERTA" : ""}</b></div>`,
        )
        .join(
          "",
        )}</div><p class="${w.open ? "good" : "bad"}">${esc(w.name)} · ${w.open ? w.remaining + " dias restantes" : "Próxima abertura em " + w.remaining + " dias"}</p><p class="chart-note">Três janelas definidas para o jogo. Aceites e contratações ficam bloqueados fora delas; essas datas não representam o regulamento oficial da CBF.</p></section><section class="card section"><h2>Propostas para sua carreira</h2><p class="muted">Salários pessoais e mensais. Confira o projeto e a concorrência no elenco.</p><div class="grid3">${
        (eligible ? state.offers : [])
          .map((o) => {
            const c = D.club(state, o.clubId);
            return `<article class="card offer"><div class="tag">${esc(c.city)}</div><h3 class="section">${esc(c.name)}</h3><p>${esc(o.role)}</p><p>Estrutura: ${c.structure}/100<br>Salário: ${money(o.salary)}<br>Expira em ${Math.max(0, o.expires - state.day)} dias</p><button class="primary" data-join="${o.clubId}" ${w.open ? "" : "disabled"}>${w.open ? "Aceitar proposta" : "Janela fechada"}</button></article>`;
          })
          .join("") ||
        empty(
          state.day < state.careerTransferAvailableDay
            ? "Você já escolheu seu clube. Novas propostas só estarão disponíveis na próxima janela, a partir de " +
                dayDate(state.careerTransferAvailableDay) +
                "."
            : "Novas propostas chegam durante as janelas abertas.",
        )
      }</div></section>${
        state.mode === "coach" && c
          ? `<section class="card section"><h2>Scouting e contratação</h2><p>Orçamento do clube: <b>${money(c.budget)}</b></p><p class="muted">Valores estimados por nível e idade. Atletas muito acima da estrutura podem recusar; clubes preservam ao menos 18 jogadores.</p><div class="tablewrap"><table><thead><tr><th>Atleta</th><th>Clube</th><th>Pos.</th><th>Idade</th><th>Nível</th><th>Preço</th><th></th></tr></thead><tbody>${state.clubs
              .filter((x) => x.id !== c.id)
              .flatMap((x) =>
                x.roster
                  .filter((p) => p.pos !== "GOL")
                  .slice()
                  .sort((a, b) => D.overall(b) - D.overall(a))
                  .slice(0, 3)
                  .map(
                    (p) =>
                      `<tr><td>${esc(p.name)}</td><td>${esc(x.name)}</td><td>${p.pos}</td><td>${p.age}</td><td>${D.overall(p)}</td><td>${money(A.valuation(p))}</td><td><button data-recruit="${p.id}" data-source="${x.id}" ${w.open ? "" : "disabled"}>Contratar</button></td></tr>`,
                  ),
              )
              .join("")}</tbody></table></div></section>`
          : ""
      }`;
    },
    life() {
      const e = Career.init(state);
      const life = D.Life.init(state);
      return `<div class="grid"><section class="card"><h2>Fora das quatro linhas</h2>${bar("Relação com a família", state.family)}${bar("Pressão e estresse", state.stress)}${bar("Reputação", state.reputation)}<p>Seguidores: ${state.fans.toLocaleString("pt-BR")}<br>Saldo: ${money(state.wallet)}</p>${life.agency ? `<div class="notice"><h3>Assessoria ativa</h3><p>${esc(life.agency.name)} · desde ${dayDate(life.agency.hiredDay)}</p><b>${money(life.agency.monthlyCost)} por mês</b></div>` : '<p class="muted">Sem agência contratada. Uma proposta pode chegar pela caixa de entrada.</p>'}<p class="muted">Decisões alteram indicadores, moral, finanças e progresso de treino.</p>${e.promise ? `<div class="notice"><h3>Promessa da entrevista</h3><p>Vencer dois dos próximos três jogos.</p><b>${e.promise.wins} vitória(s) · ${e.promise.games} jogo(s) restante(s)</b></div>` : ""}</section><section class="card"><div class="tag">CAIXA DE ENTRADA</div><h2 class="section">${esc(state.decision?.title || "Nenhum convite pendente")}</h2>${state.decision ? `<p>${esc(state.decision.body)}</p><div class="actions">${state.decision.choices.map(([id, label]) => `<button data-choice="${id}">${esc(label)}</button>`).join("")}</div>` : '<p class="muted">Continue a carreira. Convites surgem a cada três semanas.</p>'}</section></div><section class="card section"><h2>Repercussão na imprensa</h2>${
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
    history() {
      const e = Career.init(state),
        posts = e.feed.filter(
          (p) => feedKey === "Todos" || p.category === feedKey,
        );
      return `<div class="grid"><section class="card"><h2>Histórico da carreira</h2>${state.history.length ? state.history.map((h) => `<article class="news"><time>Temporada ${h.season} · ${esc(h.league || "Carreira")}</time><h3>${h.event ? esc(h.event) : esc(h.champion) + " campeão"}</h3><p>${h.event ? esc(h.event) : "Sua posição: " + (h.position || "Sem participação") + " · " + h.goals + " gols · " + (h.minutes || 0) + " minutos"}</p></article>`).join("") : empty("Os títulos e resumos entram ao encerrar a temporada.")}<h3 class="section">Transferências registradas</h3>${
        e.transfers
          .slice(0, 12)
          .map(
            (t) =>
              `<article class="news"><time>${dayDate(t.day)}</time><h3>${esc(t.player)}</h3><p>${esc(t.from)} → ${esc(t.to)}${t.fee ? " · " + money(t.fee) : ""}</p></article>`,
          )
          .join("") || empty("Nenhuma transferência registrada.")
      }</section><section class="card social-feed"><div class="split"><div><div class="tag">REDE DO FUTEBOL</div><h2>O que está acontecendo</h2></div><label class="chart-select">Filtrar<select id="feed-key">${opt(["Todos", "Carreira", "Transferências", "Competições", "Imprensa", "Torcida", "Rumores", "Vida pessoal"], feedKey)}</select></label></div><p class="chart-note">Todas as publicações retratam sua carreira simulada. Rumores não confirmam acordos.</p>${
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
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (b.dataset.advance) {
      command("advance", { days: Number(b.dataset.advance) });
      return;
    }
    if (b.dataset.join) {
      command("join", { id: b.dataset.join });
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
