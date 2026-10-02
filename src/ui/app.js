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
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
      ),
    money = (v) =>
      v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const color = (v, f) => (/^#[a-fA-F0-9]{6}$/.test(v || "") ? v : f);
  function toast(t) {
    $("#toast").textContent = t;
    $("#toast").style.display = "block";
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ($("#toast").style.display = "none"), 4500);
  }
  const C = ProLifeCharacter,
    Charts = ProLifeCharts;
  let chartKey = "overall";
  function avatar(p, team = !setup && state ? D.club(state) : null) {
    const a = C.normalize(p.appearance),
      kit = C.kit(team),
      skin = color(a.skin, "#bc8660"),
      hair = color(a.hairColor, "#241e1a");
    return `<div class="avatar-stage" data-mode="fallback"><svg class="avatar-fallback" viewBox="0 0 260 350" role="img" aria-label="Retrato de corpo superior com braços e uniforme"><rect width="260" height="350" fill="#171b20"/><path d="M53 160Q43 174 32 284L48 292L76 185M207 160Q217 174 228 284L212 292L184 185" fill="${skin}"/><path d="M75 155Q130 136 185 155L205 195L189 205L174 178L179 312H81L86 178L71 205L55 195Z" fill="${kit.primary}"/><path d="M112 147v19q18 20 36 0v-19" fill="${skin}"/><ellipse cx="130" cy="99" rx="41" ry="59" fill="${skin}"/><path d="M102 100h15m26 0h15" stroke="${hair}" stroke-width="4"/><circle cx="112" cy="112" r="3" fill="${a.eyeColor}"/><circle cx="148" cy="112" r="3" fill="${a.eyeColor}"/><path d="M125 117v14h10M115 141q15 6 30 0" fill="none" stroke="#7d5040" stroke-width="2"/>${a.hair === "bald" ? "" : `<path d="M89 100V70Q92 34 130 35T171 70V98L159 65Q121 59 100 74V100" fill="${hair}"/>`}${a.beard === "none" ? "" : `<path d="M100 131Q100 163 130 166Q160 163 160 131L149 145Q130 157 111 145Z" fill="${hair}"/>`}${a.tattoo === "none" ? "" : `<g stroke="#222d35" fill="none" stroke-width="2.5">${["left", "both"].includes(a.tattoo) ? '<path d="M218 234l-9 9 8 10-10 10 8 8M217 244l-13 3M214 265l-10 5"/>' : ""}${["right", "both"].includes(a.tattoo) ? '<path d="M42 234l9 9-8 10 10 10-8 8M43 244l13 3M46 265l10 5"/>' : ""}</g>`}<path d="M112 168l18 13 18-13" stroke="${kit.secondary}" stroke-width="6" fill="none"/><text x="130" y="248" text-anchor="middle" fill="#fff" font-family="Arial" font-size="38" font-weight="bold">10</text></svg><span class="avatar-render-label">3D · ARRASTE PARA GIRAR</span><span class="avatar-fallback-label">Retrato 2D · 3D indisponível neste navegador</span></div>`;
  }
  function configFromForm() {
    const form = $("#creator");
    if (!form) return null;
    const f = new FormData(form),
      config = Object.fromEntries(f.entries());
    config.appearance = {};
    ["skin", "hairColor", "eyeColor", "hair", "beard", "body", "accessory", "tattoo"].forEach(
      (k) => (config.appearance[k] = f.get(k)),
    );
    config.points = {};
    D.attrs.forEach((k) => (config.points[k] = Number(f.get("point_" + k)) || 0));
    const base = config.profile === "prodigy" ? 54 : config.profile === "promise" ? 46 : 40;
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
    if (person) window.ProLifeAvatar3D?.show(container, person, C.kit(team));
  }
  function appearanceFields(a) {
    a = C.normalize(a);
    return `<div class="formgrid avatar-options"><label>Tom de pele<input name="skin" type="color" value="${a.skin}"></label><label>Cor do cabelo<input name="hairColor" type="color" value="${a.hairColor}"></label><label>Cor dos olhos<input name="eyeColor" type="color" value="${a.eyeColor}"></label><label>Corte de cabelo<select name="hair">${opt(C.hair, a.hair)}</select></label><label>Barba e bigode<select name="beard">${opt(C.beard, a.beard)}</select></label><label>Porte físico<select name="body">${opt(C.body, a.body)}</select></label><label>Acessório<select name="accessory">${opt(C.accessory, a.accessory)}</select></label><label>Tatuagens<select name="tattoo">${opt(C.tattoo, a.tattoo)}</select></label></div>`;
  }
  function evolutionPanel() {
    return `<section class="card section development-panel"><div class="split"><div><div class="tag">RELATÓRIO DE DESENVOLVIMENTO</div><h2>Evolução do jogador</h2></div><label class="chart-select">Indicador<select id="chart-key">${opt([["overall", "Nível geral"], ...D.attrs.map((k) => [k, D.labels[k]])], chartKey)}</select></label></div>${Charts.evolution(state.development, chartKey)}</section>`;
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
    return new Date(Date.UTC(2026, 0, 5) + state.day * 86400000).toLocaleDateString("pt-BR", {
      timeZone: "UTC",
    });
  }
  function render() {
    window.ProLifeAvatar3D?.dispose();
    if (!state || setup) {
      landing();
      return;
    }
    const c = D.club(state),
      nav = [
        ["home", "Visão geral"],
        ["profile", "Meu personagem"],
        ["squad", "Elenco e tática"],
        ["training", "Treinamento"],
        ["league", "Liga e calendário"],
        ["matches", "Central de partidas"],
        ["market", "Mercado"],
        ["life", "Vida e decisões"],
        ["finance", "Finanças"],
        ["history", "História"],
        ["save", "Saves e ajuda"],
      ];
    $("#app").innerHTML =
      `<div class="layout"><aside class="sidebar"><div class="brand">PRO<span>LIFE</span></div><nav>${nav.map(([id, label]) => `<button data-page="${id}" class="${page === id ? "active" : ""}">${label}</button>`).join("")}</nav><small>FOOTBALL CAREER<br><br>CARREIRA 2026<br>Universo fictício<br>Modo ${state.mode === "player" ? "Jogador" : "Treinador"}</small></aside><main class="main"><div class="topbar"><div><div class="tag">${esc(c?.name || "Livre no mercado")} · Temporada ${state.season}</div><h1>${esc(nav.find((n) => n[0] === page)?.[1] || "Visão geral")}</h1><small>${date()} · Rodada ${state.round}/14</small></div><div class="actions"><button data-action="export">Exportar save</button><button data-advance="1">+1 dia</button><button class="primary" data-advance="7">Avançar 7 dias →</button><button data-advance="30">+30 dias</button></div></div>${views[page]()}<div class="footer">PRO LIFE 0.2 · Carreira salva automaticamente · Exportar save cria sua cópia de segurança.</div></main></div>`;
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
        )}</select></label><label>Estilo de jogo<select name="style">${opt(["Técnico", "Velocista", "Organizador", "Combativo"], "Técnico")}</select></label><label>Comemoração (perfil)<select name="celebration">${opt(C.celebrations, "Braços abertos")}</select></label></div><p class="muted">Começos diferentes alteram seus atributos iniciais. Potencial e sucesso não são garantidos. Treinador usa reputação e licenças; os atributos abaixo são futebolísticos.</p><h3>Distribua até 30 pontos adicionais</h3><div id="points">${D.attrs.map((k) => `<label class="attribute">${D.labels[k]}<input name="point_${k}" type="number" min="0" max="20" value="5" required></label>`).join("")}</div><small id="points-total">30 / 30 pontos</small><div id="initial-radar">${Charts.radar(Object.fromEntries(D.attrs.map((k) => [k, 45])))}</div></section><section class="card"><h2>PERSONALIZAR PERSONAGEM</h2><div id="preview">${avatar({ appearance: {} })}</div><div class="kit-caption"><b id="kit-name">UNIFORME DE TREINO</b><small>O uniforme acompanha o clube escolhido.</small></div>${appearanceFields({})}<div class="notice">Liga Horizonte: oito clubes, 14 rodadas por temporada. As semanas entre partidas também importam.</div><label>Seed do mundo (opcional)<input name="seed" type="number" placeholder="Um número para reproduzir o mesmo universo"></label><button class="primary" type="submit">Iniciar minha carreira →</button><div class="section"><button type="button" data-action="import">Importar carreira salva</button></div></section></div></form><p class="footer">Sem conexão, contas ou compras. Clubes e jogadores fictícios. Leia LEIA_PRIMEIRO.txt para começar.</p></div>`;
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
        D.attrs.forEach((k) => (config.points[k] = Number(f.get("point_" + k))));
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
        const fresh = D.create(config, config.seed ? Number(config.seed) : Date.now());
        if (
          state &&
          !confirm("Substituir a carreira atual? Exporte seu save primeiro para guardá-lo.")
        )
          return;
        state = fresh;
        setup = false;
        page = "home";
        persist();
        render();
      } catch (e) {
        toast(e.message);
      }
    });
  }
  const views = {
    home() {
      const c = D.club(state),
        p = state.person,
        m = state.matches.find((m) => m.home === state.clubId || m.away === state.clubId);
      return `<section class="card hero"><div class="profileflex">${avatar(p)}<div><div class="tag">${state.mode === "player" ? (p.age < 20 ? "Da base ao profissional" : "Carreira de jogador") : "Carreira de treinador"}</div><h1>${esc(p.name)}</h1><p>${p.age} anos · ${esc(p.city)} · ${c ? esc(c.name) : "À procura do primeiro projeto"}</p><span class="pill">${state.mode === "player" ? p.pos : "Licença " + state.license}</span><span class="pill">${esc(p.style)}</span><span class="pill">${p.injury ? "Lesionado por " + p.injury + " dias" : "Disponível"}</span></div></div></section><div class="stats"><div class="stat"><small>${state.mode === "player" ? "Nível atual" : "Confiança da diretoria"}</small><b>${state.mode === "player" ? D.overall(p) : Math.round(state.board)}</b></div><div class="stat"><small>Reputação</small><b>${Math.round(state.reputation)}</b></div><div class="stat"><small>Patrimônio pessoal</small><b style="font-size:21px">${money(state.wallet)}</b></div><div class="stat"><small>${c ? "Posição na liga" : "Propostas disponíveis"}</small><b>${c ? D.table(state).findIndex((t) => t.id === c.id) + 1 + "º" : state.offers.length}</b></div></div><div class="grid"><section class="card"><h2>Agenda da carreira</h2>${state.decision ? `<div class="notice">${esc(state.decision.title)}<p>Há uma escolha esperando por você.</p><button data-page="life">Resolver decisão</button></div>` : ""}${!c ? '<div class="notice">Escolha um projeto para disputar a liga.<p><button data-page="market">Ver propostas</button></p></div>' : `<p>${state.round < 14 ? `Próxima rodada em ${Math.max(0, D.nextFixtureDay(state) - state.day)} dia(s).` : `Temporada encerrada. O novo ciclo começa em ${365 - (state.day % 365)} dias.`} O treinador escolhe quem joga conforme nível, disponibilidade e concorrência.</p>${m ? `<div class="score">${m.hg} × ${m.ag}</div><p>${esc(m.summary)}</p><button data-page="matches">Ver relatório</button>` : "<p>A temporada ainda está começando.</p>"}`}${bar("Condição física", p.condition)}${bar("Moral", p.morale)}</section><section class="card"><h2>Caixa de entrada</h2>${news(5)}</section></div>${evolutionPanel()}`;
    },
    profile() {
      const p = state.person,
        c = D.club(state);
      return `<div class="grid character-profile"><section class="card character-card"><h2>PERFIL DO PERSONAGEM</h2>${avatar(p)}<div class="kit-caption"><b>${esc(c?.name || "UNIFORME DE TREINO")}</b><small>Uniforme definido pelo clube.</small></div><h1>${esc(p.name)}</h1><p>${p.age} anos · ${esc(p.city)} · ${p.height} cm · ${p.weight} kg</p><div class="profile-data"><span>Posição <b>${p.pos}</b></span><span>Pé <b>${p.foot === "left" ? "Esquerdo" : "Direito"}</b></span><span>Estilo <b>${esc(p.style)}</b></span></div><div class="section"><h3>APARÊNCIA</h3><form id="appearance-editor">${appearanceFields(p.appearance)}<label>Comemoração<select name="celebration">${opt(C.celebrations, p.celebration)}</select></label><button class="primary" type="submit">Salvar aparência</button></form></div>${state.mode === "player" && p.age >= 30 ? '<button class="section" data-action="retire">Aposentar e virar treinador</button>' : ""}</section><section class="card"><div class="split"><h2>ATRIBUTOS</h2><span class="rating-badge">${D.overall(p)}</span></div>${Charts.radar(p.attrs)}${D.attrs.map((k) => bar(D.labels[k], p.attrs[k])).join("")}<div class="profile-data"><span>Gols <b>${p.goals}</b></span><span>Minutos <b>${p.minutes}</b></span><span>Seguidores <b>${state.fans}</b></span></div><p class="chart-note">Comemoração: ${esc(p.celebration)}. Registrada no perfil; ainda sem animação.</p></section></div>${evolutionPanel()}`;
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
      return `<div class="grid"><section class="card"><h2>Rotina de trabalho</h2><label>Foco<select id="focus">${opt([["balanced", "Desenvolvimento equilibrado"], ...D.attrs.map((k) => [k, D.labels[k]])], state.training)}</select></label><label>Carga<select id="intensity">${opt(
        [
          ["rest", "Recuperação"],
          ["normal", "Normal"],
          ["hard", "Intensa"],
        ],
        state.intensity,
      )}</select></label><button data-action="train" class="primary">Aplicar rotina</button><p class="muted">${state.mode === "player" ? "Carga intensa acelera o progresso, aumenta o desgaste e traz risco de lesão. Descanso recupera a condição. Melhorias são graduais e incertas." : "Na versão 0.1, esta rotina desenvolve apenas o personagem jogador. Para o treinador, use o plano tático e os cursos de licença."}</p></section><section class="card"><h2>Seu estado</h2>${bar("Condição", state.person.condition)}${bar("Moral", state.person.morale)}${bar("Pressão", state.stress)}<p>${state.person.injury ? "Lesão: " + state.person.injury + " dias de recuperação." : "Sem lesão atual."}</p>${state.mode === "coach" ? `<p>Licença atual: <b>${state.license}</b></p><button data-action="license">Curso de licença (${money({ C: 2500, B: 5000, A: 10000, PRO: 0 }[state.license] || 0)})</button>` : ""}</section></div>`;
    },
    league() {
      return `<section class="card"><div class="tag">Universo regional fictício</div><h2 class="section">Liga Horizonte · ${state.season}</h2><div class="tablewrap"><table><thead><tr><th>#</th><th>Clube</th><th>PTS</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th></tr></thead><tbody>${D.table(
        state,
      )
        .map(
          (c, i) =>
            `<tr class="${c.id === state.clubId ? "highlight" : ""}"><td>${i + 1}</td><td>${esc(c.name)}</td>${["points", "played", "w", "d", "l", "gf", "ga"].map((k) => `<td>${c.stats[k]}</td>`).join("")}<td>${c.stats.gf - c.stats.ga}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div><p class="muted">Dois turnos, 14 rodadas. Vitória: 3 pontos; empate: 1. Desempate por saldo de gols e gols marcados. A primeira rodada ocorre no dia 7, com intervalo de 21 dias. O ano tem 365 dias; após a última rodada há período sem jogos.</p></section><section class="card section"><h2>Próximos confrontos</h2>${state.fixtures
        .slice(state.round, state.round + 3)
        .map(
          (r, i) =>
            `<h3 class="section">Rodada ${state.round + i + 1}</h3>${r.map(([h, a]) => `<p>${esc(D.club(state, h).name)} × ${esc(D.club(state, a).name)}</p>`).join("")}`,
        )
        .join("")}</section>`;
    },
    matches() {
      const own = state.matches.filter((m) => m.home === state.clubId || m.away === state.clubId),
        list = own.length ? own : state.matches;
      const m = list[0];
      if (!m) return empty("Avance até a primeira rodada para ver os relatórios.");
      return `<div class="grid"><section class="card"><div class="tag">Rodada ${m.round} · Temporada ${m.season}</div><h2 class="section">${esc(D.club(state, m.home).name)}<br>${esc(D.club(state, m.away).name)}</h2><div class="score">${m.hg} × ${m.ag}</div><p>${esc(m.summary)}</p><table><thead><tr><th>Indicador</th><th>Casa</th><th>Fora</th></tr></thead><tbody><tr><td>Posse</td><td>${m.possession}%</td><td>${100 - m.possession}%</td></tr>${[
        ["shots", "Finalizações"],
        ["target", "No alvo"],
        ["xg", "xG estimado"],
      ]
        .map(([k, l]) => `<tr><td>${l}</td><td>${m[k][0]}</td><td>${m[k][1]}</td></tr>`)
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
      const c = D.club(state);
      return `<section class="card"><h2>Propostas para sua carreira</h2><p class="muted">Você pode trocar de clube durante a temporada. Na versão 0.1, a negociação é direta; não há janela ou multa rescisória. Salários são pessoais e mensais.</p><div class="grid3">${
        state.offers
          .map((o) => {
            const c = D.club(state, o.clubId);
            return `<article class="card offer"><div class="tag">${esc(c.city)}</div><h3 class="section">${esc(c.name)}</h3><p>${esc(o.role)}</p><p>Estrutura: ${c.structure}/100<br>Salário: ${money(o.salary)}<br>Expira em ${Math.max(0, o.expires - state.day)} dias</p><button class="primary" data-join="${o.clubId}">Aceitar proposta</button></article>`;
          })
          .join("") || empty("Novas propostas chegam a cada 28 dias.")
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
                      `<tr><td>${esc(p.name)}</td><td>${esc(x.name)}</td><td>${p.pos}</td><td>${p.age}</td><td>${D.overall(p)}</td><td>${money(A.valuation(p))}</td><td><button data-recruit="${p.id}" data-source="${x.id}">Contratar</button></td></tr>`,
                  ),
              )
              .join("")}</tbody></table></div></section>`
          : ""
      }`;
    },
    life() {
      return `<div class="grid"><section class="card"><h2>Fora das quatro linhas</h2>${bar("Relação com a família", state.family)}${bar("Pressão e estresse", state.stress)}${bar("Reputação", state.reputation)}<p>Seguidores: ${state.fans}<br>Patrimônio: ${money(state.wallet)}</p><p class="muted">Família e pressão fazem parte da camada de vida desta versão. As escolhas alteram esses indicadores, o treino, a moral ou a reputação; não há casas, redes sociais interativas ou patrocínios ainda.</p></section><section class="card"><h2>${esc(state.decision?.title || "Um dia de cada vez")}</h2>${state.decision ? `<p>${esc(state.decision.body)}</p><div class="actions">${state.decision.choices.map(([id, label]) => `<button data-choice="${id}">${esc(label)}</button>`).join("")}</div>` : '<p class="muted">Continue sua carreira. Novas situações surgem a cada três semanas, se não houver uma escolha pendente.</p>'}</section></div>`;
    },
    finance() {
      const c = D.club(state);
      return `<div class="grid"><section class="card"><h2>Finanças pessoais</h2><div class="score" style="font-size:29px">${money(state.wallet)}</div><p>Salário mensal: ${money(state.salary)}${state.clubId ? "" : " (sem vínculo: não recebido)"}<br>Despesas mensais: ${money(state.mode === "coach" ? 2000 : 650)}<br>Contrato: ${state.contract} dias restantes</p><p class="muted">No protótipo, contrato de zero dias permanece ativo até a troca de clube. A renovação contratual detalhada ainda não está implementada. Pagamentos a cada 30 dias.</p></section><section class="card"><h2>Finanças do clube</h2>${c ? `<div class="score" style="font-size:29px">${money(c.budget)}</div><p>Saldo disponível para contratar.<br>Custo fixo mensal: ${money(22000)} + seu salário.<br>Receita base por temporada: ${money(180000)}.</p><p class="muted">Modelo financeiro simplificado, sem balanço contábil ou patrocínios.</p>` : empty("Sem clube atual.")}</section></div>`;
    },
    history() {
      return `<section class="card"><h2>O universo continua</h2>${state.history.length ? state.history.map((h) => `<div class="news"><h3>Temporada ${h.season}</h3><p>${h.event ? esc(h.event) : `Campeão: ${esc(h.champion)} · Sua posição: ${h.position || "Sem clube"} · ${h.goals} gols`}</p></div>`).join("") : empty("Finalize uma temporada para registrar sua história.")}<h3 class="section">Diário</h3>${news(30)}</section>`;
    },
    save() {
      return `<div class="grid"><section class="card"><h2>Guarde sua história</h2><p>Autosave usa o armazenamento deste navegador. Trocar de navegador, mover o jogo ou limpar dados pode impedir recuperar esse save.</p><div class="actions"><button class="primary" data-action="export">Exportar arquivo JSON</button><button data-action="import">Importar save</button></div><p>Exporte ao encerrar e guarde o JSON numa pasta sua. A importação valida a estrutura e a versão do arquivo.</p><button data-action="new" class="danger">Criar outra carreira</button><p class="muted">Criar uma carreira substitui o autosave após confirmação. Exporte primeiro.</p></section><section class="card"><h2>Guia rápido</h2><p>1. Escolha uma proposta no Mercado.<br>2. Ajuste o treino, ou escalação e tática como treinador.<br>3. Avance sete dias para a primeira rodada.<br>4. Leia relatórios e tome decisões de vida.<br>5. Exporte seu save.</p><p>Versão 0.2 inclui uma liga fictícia de oito clubes, personagem 3D editável e histórico de evolução. Sem partidas visuais ou competições reais. Acesse a pasta docs para arquitetura, regras, testes e limitações.</p><p class="muted">Não há telemetria, chamadas externas, conta, senha ou conexão de rede no jogo.</p></section></div>`;
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
    if (!S.save(state)) toast("Autosave indisponível neste navegador. Use Exportar save.");
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
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }),
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
        if (f.size > 3000000) throw Error("Arquivo muito grande. Limite: 3 MB.");
        const parsed = S.parse(await f.text());
        if (state && !confirm("Substituir a carreira atual pelo arquivo importado?")) return;
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
    if (b.dataset.recruit) {
      command("recruit", { clubId: b.dataset.source, playerId: b.dataset.recruit });
      return;
    }
    switch (b.dataset.action) {
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
        command("train", { focus: $("#focus").value, intensity: $("#intensity").value });
        break;
      case "lineup":
        command("lineup", {
          ids: [...document.querySelectorAll(".lineup:checked")].map((el) => el.value),
        });
        break;
      case "license":
        command("license");
        break;
      case "retire":
        if (confirm("Encerrar sua carreira de jogador e iniciar como treinador neste universo?"))
          command("retire");
        break;
    }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "appearance-editor") return;
    e.preventDefault();
    const f = new FormData(e.target),
      appearance = {};
    ["skin", "hairColor", "eyeColor", "hair", "beard", "body", "accessory", "tattoo"].forEach(
      (k) => (appearance[k] = f.get(k)),
    );
    command("appearance", { appearance, celebration: f.get("celebration") });
  });
  document.addEventListener("input", (e) => {
    if (e.target.closest("#appearance-editor") && e.target.name !== "celebration") {
      const f = new FormData($("#appearance-editor")),
        p = { ...state.person, appearance: Object.fromEntries(f.entries()) };
      const holder = $(".character-card .avatar-stage");
      window.ProLifeAvatar3D?.show(holder, p, C.kit(D.club(state)));
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id === "chart-key") {
      chartKey = e.target.value;
      render();
      return;
    }
    if (e.target.id === "tactic") command("tactic", { value: e.target.value });
  });
  render();
})();
