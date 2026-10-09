(function () {
  "use strict";
  const D = ProLife,
    A = ProLifeApp,
    S = ProLifeSave;
  let state = null,
    page = "home",
    setup = false,
    classicForm = false;
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
  function closeSimulationStop() { document.getElementById("simulation-stop-modal")?.remove(); }
  function decisionMeta(decision) {
    if (decision?.source !== "unexpected_event") return "";
    const remaining = Number.isFinite(decision.deadline) ? Math.max(0, decision.deadline - state.day) : null;
    return `<p class="chart-note"><b>${esc(decision.category || "CARREIRA")}</b>${remaining === null ? "" : ` · prazo: ${remaining} dia${remaining === 1 ? "" : "s"}`}</p>`;
  }
  const popupSeen = new Set();
  let popupCheckTimer = null;
  function popupFromPending(action) {
    if (!action) return null;
    const id=action.entityId ?? String(action.id||"").split(":").slice(1).join(":");
    return {
      type:action.type, id, title:action.title, page:action.page, anchor:action.anchor,
      message: action.type==="decision" ? `Decisão pendente: ${action.title}.`
        : action.type==="interview" ? `Você recebeu uma decisão de entrevista: ${action.title}.`
        : action.type==="renewal" ? "Há uma proposta de renovação aguardando sua resposta."
        : action.type==="offer" ? `Há uma proposta de transferência aguardando sua resposta: ${action.title}.`
        : action.type==="commercial" ? `Há uma proposta de patrocinador aguardando sua resposta: ${action.title}.`
        : action.type==="commercial-event" ? `Há uma campanha de patrocinador aguardando sua decisão: ${action.title}.`
        : "Existe uma decisão importante aguardando sua resposta."
    };
  }
  function ensurePendingDecisionPopup(force=false) {
    clearTimeout(popupCheckTimer);
    popupCheckTimer=setTimeout(()=>{
      if(!state || setup || document.getElementById("simulation-stop-modal")) return;
      const pending=(D.pendingActions?.(state)||[]);
      const activeIds=new Set(pending.map(x=>x.id));
      for(const id of [...popupSeen]) if(!activeIds.has(id)) popupSeen.delete(id);
      const next=pending.find(x=>force || !popupSeen.has(x.id));
      if(!next) return;
      popupSeen.add(next.id);
      showSimulationStop(popupFromPending(next));
    },0);
  }
  function showSimulationStop(stop) {
    if (!stop) return;
    const pending=(D.pendingActions?.(state)||[]).find(x=>x.type===stop.type && (String(x.entityId??"")===String(stop.id??"") || x.title===stop.title));
    if(pending) popupSeen.add(pending.id);
    closeSimulationStop();
    const career = state.mode === "player" ? Career.init(state) : null;
    const interview = stop.type === "interview" ? (career?.communications?.interviews || []).find(i => i.id === stop.id && !i.answered) : null;
    const decision = stop.type === "decision" ? state.decision : null;
    const title = stop.title || (stop.type === "renewal" ? "Proposta de renovação" : stop.type === "offer" ? "Nova proposta de transferência" : "Simulação interrompida");
    const directChoices = decision?.choices?.length ? `<div class="simulation-stop-choices">${decision.choices.map(([id,label])=>`<button data-stop-choice="${esc(id)}">${esc(label)}</button>`).join("")}</div>` : interview?.choices?.length ? `<div class="simulation-stop-choices">${interview.choices.map(c=>`<button data-stop-interview="${esc(interview.id)}" data-stop-interview-choice="${esc(c.id)}">${esc(c.label)}</button>`).join("")}</div>` : "";
    const routes = {
      interview:{page:"inbox",anchor:`interview-${stop.id}`,label:"Ir para entrevista"},
      renewal:{page:"proposals",anchor:"renewal-offer",label:"Ir para renovação"},
      offer:{page:"proposals",anchor:`transfer-offer-${stop.id}`,label:"Ir para proposta"},
      decision:{page:"life",anchor:"current-decision",label:"Ir para decisão"},
      commercial:{page:"sponsorships",anchor:`commercial-proposal-${stop.id}`,label:"Ir para proposta"},
      "commercial-event":{page:"sponsorships",anchor:`commercial-event-${stop.id}`,label:"Ir para campanha"}
    };
    const route=routes[stop.type] || {page:stop.page||"inbox",anchor:stop.anchor||"",label:"Ir para decisão"};
    const el=document.createElement("div"); el.id="simulation-stop-modal"; el.className="simulation-stop-backdrop";
    el.innerHTML=`<section class="simulation-stop-dialog" role="dialog" aria-modal="true"><div class="tag">SIMULAÇÃO INTERROMPIDA</div><h2>${esc(title)}</h2>${decisionMeta(decision)}<p>${esc(decision?.body || stop.message || "Existe uma ação importante aguardando sua resposta.")}</p>${directChoices}<div class="actions"><button class="primary" data-stop-go="${esc(route.page)}" data-stop-anchor="${esc(route.anchor)}">${esc(route.label)}</button><button data-stop-close>Agora não</button></div></section>`;
    document.body.appendChild(el);
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
  // Etapa 13: apresentação da identidade. Regras e requisitos vêm de D.Identity (domínio).
  function identityTree(v) {
    const stateLabel = { ATIVA: "ATIVA", DESBLOQUEADA: "DESBLOQUEADA", "DISPONÃVEL": "DISPONÃVEL", BLOQUEADA: "BLOQUEADA" };
    return v.tree.map((branch) => `<div class="id-branch"><div class="id-root"><b>${esc(branch.name)}</b><small>${esc(branch.role)}</small></div><ul>${branch.specializations.map((sp) => {
      const reqs = sp.state === "BLOQUEADA" ? `<div class="id-reqs">${sp.requirements.map((r) => `<span class="${r.met ? "ok" : "no"}">${r.met ? "✓" : "○"} ${esc(r.label)}${r.current !== undefined && !r.met ? ` <small>(${r.current})</small>` : ""}</span>`).join("")}</div>` : "";
      const action = sp.state === "DISPONÃVEL" ? `<button data-specialization="${sp.id}" ${sp.canUnlock ? "" : "disabled"}>Desbloquear · 1 ponto</button>` : sp.state === "DESBLOQUEADA" ? `<button data-activate-specialization="${sp.id}">Ativar</button>` : "";
      return `<li class="id-spec ${sp.state === "ATIVA" ? "active" : sp.state === "BLOQUEADA" ? "locked" : "open"}"><div class="split"><div><b>${esc(sp.name)}</b> <span class="pill">${stateLabel[sp.state]}</span><p class="muted">${esc(sp.description)} · Foco: ${sp.attrs.map(esc).join(", ")}</p></div>${action}</div>${reqs}</li>`;
    }).join("")}</ul></div>`).join("");
  }
  // Etapa 15: movimentações do mundo (somente apresentação; dados vêm de D.World2).
  function worldMovesPanel() {
    const u = state?.universe;
    if (!u || !D.World2) return "";
    const moves = D.World2.recentMoves(state, { limit: 10, minOvr: 70 }).filter((m) => m.type !== "release");
    const rets = u.retirements.filter((r) => r.peak >= 74).slice(0, 5);
    const free = u.free.slice().sort((a, b) => D.overall(b) - D.overall(a)).slice(0, 5);
    const row = (m) => `<tr><td>${m.season}</td><td>${esc(m.name)}</td><td>${esc(m.pos)}</td><td>${m.age}</td><td>${m.ovr}</td><td>${esc(m.from)} → ${esc(m.to)}</td><td>${m.fee ? money(m.fee) : "Livre"}</td></tr>`;
    return `<section class="card section" data-world-market-legacy><div class="tag">HISTÓRICO LEGADO</div><h2>Movimentações do mundo</h2><p class="muted">Somente as mais relevantes (GER 70+). O mercado da IA acontece uma vez por janela.</p>${moves.length ? `<div class="tablewrap"><table><thead><tr><th>Ano</th><th>Jogador</th><th>Pos</th><th>Idade</th><th>GER</th><th>Clubes</th><th>Valor</th></tr></thead><tbody>${moves.map(row).join("")}</tbody></table></div>` : `<p class="muted">Nenhuma movimentação relevante registrada ainda.</p>`}<details><summary>Aposentadorias e jogadores livres</summary><p><b>Aposentados recentes:</b> ${rets.length ? rets.map((r) => `${esc(r.name)} (${r.age}, ${esc(r.club)})`).join(" · ") : "—"}</p><p><b>Melhores jogadores livres:</b> ${free.length ? free.map((p) => `${esc(p.name)} (${p.pos}, ${p.age}, GER ${D.overall(p)})`).join(" · ") : "—"}</p></details></section>`;
  }
  // Etapa 14: história de origem e início de carreira (somente apresentação; dados vêm de D.Creation.summary).
  function originPanel() {
    if (state?.mode !== "player") return "";
    const v = D.Creation?.summary?.(state);
    if (!v) return `<section class="card section"><div class="tag">HISTÓRIA DE ORIGEM</div><h2>${esc(state.person.originName || "Carreira em andamento")}</h2><p class="muted">Esta carreira foi criada antes do criador de histórias. Nenhuma origem foi atribuída retroativamente.</p></section>`;
    const ex = v.expectation, ob = v.objectives, i = v.initial;
    return `<section class="card section origin-panel"><div class="split"><div><div class="tag">HISTÓRIA DE ORIGEM</div><h2>${esc(v.title)}</h2></div><span class="pill">${esc(v.difficulty.name)}</span></div><p class="muted">${esc(v.hint ? "Desafio da história: " + v.hint + ". " : "")}Personalidade: <b>${esc(v.personality.name)}</b>. Ponto de partida: ${i.age} anos · ${i.overall} GER · reputação ${i.reputation} · popularidade ${i.popularity}.</p>${ex ? `<p><b>Expectativa do clube:</b> ${esc(ex.label)} (${ex.value}/100)</p>` : `<p class="muted">Sem clube: escolha uma proposta para iniciar a carreira profissional.</p>`}${ob.length ? `<div class="stats">${ob.map((o) => `<div class="stat"><small>${o.done ? "✓ CUMPRIDO" : "OBJETIVO"}</small><b>${esc(o.label)}</b></div>`).join("")}</div>` : ""}</section>`;
  }
  function archetypePerkPanel() {
    if (state?.mode !== "player") return "";

    const plan = D.Training.init(state);
    D.Training.reconcileArchetypePerks?.(state);

    const view = D.Identity?.view?.(state);
    const primary = state.person.archetypeId;
    const secondary = view?.secondary?.id || null;

    const slots = D.Training.archetypePerkSlots(state);
    const active = D.Training.activeArchetypePerks(state);
    const activeIds = new Set(active.map((x) => x.id));
    const unlockedIds = new Set(plan.archetypePerks || []);
    const perks = D.Training.availableArchetypePerks(state);

    const branches = [primary, secondary]
      .filter(Boolean)
      .map((archetypeId) => {
        const arch = D.Training.archetypeCatalog[archetypeId];
        const list = perks.filter((perk) => perk.archetype === archetypeId);

        if (!list.length) return "";

        const role = archetypeId === primary ? "principal" : "secundário";

        const items = list.map((perk) => {
          const isActive = activeIds.has(perk.id);
          const unlocked = unlockedIds.has(perk.id);
          const eligible = plan.archetypeLevel >= perk.level;

          const status =
            isActive ? "ATIVO" :
            unlocked ? "DESBLOQUEADO" :
            eligible ? "DISPONÍVEL" :
            "BLOQUEADO";

          let action = "";

          if (!unlocked && eligible) {
            action = `<button data-unlock-archetype-perk="${perk.id}">Desbloquear</button>`;
          }
          else if (unlocked && !isActive) {
            const full = active.length >= slots;
            action = `<button data-activate-archetype-perk="${perk.id}" ${full ? "disabled" : ""}>Ativar</button>`;
          }
          else if (isActive) {
            action = `<button data-deactivate-archetype-perk="${perk.id}">Desativar</button>`;
          }

          const effect = perk.kind === "training"
            ? `Treino: ${esc(D.Training.trainingCategories[perk.category]?.name || perk.category)} +${Math.round(perk.value * 100)}%`
            : `Partida: ${esc(perk.action)} +${Math.round(perk.value * 100)}%`;

          const requirement = !eligible
            ? `<div class="id-reqs"><span class="no">○ Nível de arquétipo ${perk.level} <small>(atual: ${plan.archetypeLevel})</small></span></div>`
            : "";

          return `<li class="id-spec ${isActive ? "active" : !eligible ? "locked" : "open"}"><div class="split"><div><b>${esc(perk.name)}</b> <span class="pill">${status}</span><p class="muted">${esc(perk.description)}</p><small>${effect}</small></div>${action}</div>${requirement}</li>`;
        }).join("");

        return `<div class="id-branch archetype-perk-branch"><div class="id-root"><b>${esc(arch?.name || archetypeId)}</b><small>${role}</small></div><ul>${items}</ul></div>`;
      })
      .join("");

    const activeNames = active.length
      ? active.map((perk) => esc(perk.name)).join(" · ")
      : "Nenhum";

    return `<div class="archetype-perk-panel"><div class="split"><div><h3>Perks de arquétipo</h3><p class="muted">Características situacionais do seu perfil. Não aumentam o overall diretamente.</p></div><div><small>Nível de arquétipo</small><h3>${plan.archetypeLevel}</h3><p class="muted">XP: ${Math.round(plan.archetypeXp || 0)} · Slots: ${active.length}/${slots}</p></div></div><div class="notice"><b>Perks ativos:</b> ${activeNames}</div><div class="id-tree">${branches}</div></div>`;
  }
  function identityPanel() {
    const v = D.Identity?.view?.(state);
    if (!v) return "";
    const affs = v.affinities.slice(0, 6).map((a) => `<div class="id-aff ${a.id === v.primary.id ? "lead" : ""}"><span>${esc(a.name)}${a.compatible ? "" : " <small>(posição vizinha)</small>"}</span><b>${a.value}</b><i><em style="width:${a.value}%"></em></i></div>`).join("");
    const attrList = (list, withTarget) => list.length ? list.map((x) => `<span><small>${esc(x.label)}</small><b>${x.value}${withTarget ? ` / ${x.target}` : ""}</b></span>`).join("") : `<span><small>Sem lacunas no perfil atual</small><b>—</b></span>`;
    const rec = v.recommendation;
    return `<section id="player-identity" class="card section"><div class="tag">IDENTIDADE</div><div class="id-head"><div><small>Arquétipo atual</small><h2>${esc(v.primary.name)}</h2><p class="muted">${esc(v.primary.description || "")}</p>${v.secondary ? `<p>Perfil secundário: <b>${esc(v.secondary.name)}</b></p>` : `<p class="muted">Sem perfil secundário definido.</p>`}</div><div><small>Especialização ativa</small><h3>${esc(v.activeSpecialization?.name || "Nenhuma")}</h3><p class="muted">${v.points} ponto(s) de especialização · Nível ${v.level}</p>${v.legacy.length ? `<p class="muted">Anteriores: ${v.legacy.map((x) => esc(x.name)).join(" · ")}</p>` : ""}</div></div>
      <div class="id-grid"><div><h3>Afinidades</h3>${affs}<p class="muted">Afinidades mudam aos poucos com o que você faz em campo e no treino.${v.shiftStreak ? ` Sinais de mudança de perfil: ${v.shiftStreak} jogo(s).` : ""}</p></div><div><h3>Pontos fortes</h3><div class="player-kpis">${attrList(v.strengths)}</div><h3>Pontos a desenvolver</h3><div class="player-kpis">${attrList(v.toDevelop, true)}</div>${rec ? `<div class="notice"><b>Recomendação de treino: ${esc(rec.name)}</b><p>${esc(rec.category)} · ${esc(rec.reason)}</p></div>` : ""}</div></div>
      <h3>Especializações</h3><div class="id-tree">${identityTree(v)}</div>${archetypePerkPanel()}</section>`;
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
      groups = state.mode === "player"
        ? [
            ["home", "Início", [["home", "Central"], ["lineup", "Escalação do próximo jogo"]]],
            ["inbox", "Caixa", [["inbox", "Mensagens"]]],
            ["profile", "Meu jogador", [["profile", "Perfil e carreira"], ["training", "Treinamento"], ["statistics", "Estatísticas"], ["awards", "Prêmios"], ["agency", "Empresário e Agência"], ["legacy", "Evolução e legado"], ["story", "Objetivos e História"]]],
            ["market", "Mercado", [["market", "Central do mercado"], ["proposals", "Minhas propostas"]]],
            ["league", "Temporada", [["league", "Campeonatos"], ["calendar", "Calendário"], ["matches", "Partidas"], ["competitions", "Competições"], ["panorama", "Panorama"], ["squad", "Elenco"]]],
            ["national", "Seleção", []],
            ["history", "Mundo", [["history", "Mundo vivo"], ["worldCompetitions", "Competições Mundiais"], ["clubs", "Clubes"], ["life", "Perfil e Vida"], ["finance", "Finanças"], ["sponsorships", "Patrocínios"]]],
            ["save", "Saves", [["save", "Gerenciar saves"]]],
          ]
        : [
            ["home", "Início", [["home", "Central"]]],
            ["inbox", "Caixa", [["inbox", "Mensagens"]]],
            ["profile", "Treinador", [["profile", "Perfil"], ["training", "Desenvolvimento"], ["finance", "Diretoria"]]],
            ["market", "Transferências", [["market", "Mercado"], ["proposals", "Propostas"]]],
            ["league", "Temporada", [["league", "Campeonatos"], ["calendar", "Calendário"], ["matches", "Partidas"], ["competitions", "Competições"], ["panorama", "Panorama"], ["squad", "Elenco e tática"], ["statistics", "Estatísticas"], ["awards", "Prêmios"]]],
            ["history", "Mundo", [["history", "Mundo vivo"], ["worldCompetitions", "Competições Mundiais"], ["clubs", "Clubes"], ["life", "Decisões"]]],
            ["save", "Saves", [["save", "Gerenciar saves"]]],
          ],
      allPages = groups.flatMap((g) => g[2]),
      activeGroup = groups.find((g) => g[2].some(([id]) => id === page)) || groups[0],
      nav = groups.map(([id, label]) => [id, label]),
      subnav = activeGroup[2];
    const unread = Career.unreadCount(state) + (state.decision ? 1 : 0),
      offerCount = Career.canTransfer(state) ? state.offers.length : 0;
    $("#app").innerHTML =
      `<div class="game-shell"><header class="game-nav"><div class="brand">PRO<span>LIFE</span></div><nav>${groups.map(([id, label, pages]) => `<button data-page="${id}" class="${pages.some(([pid])=>pid===page) ? "active" : ""}">${label}${id === "inbox" && unread ? `<i>${unread}</i>` : id === "market" && offerCount ? `<i>${offerCount}</i>` : ""}</button>`).join("")}</nav><div class="club-chip"><small>${state.mode === "player" ? "CARREIRA DE JOGADOR" : "CARREIRA DE TREINADOR"}</small><b>${esc(c?.name || "Livre no mercado")}</b></div></header><div class="game-subnav">${subnav.map(([id,label])=>`<button data-page="${id}" class="${page===id?"active":""}">${esc(label)}${id==="proposals" && offerCount ? ` <i>${offerCount}</i>`:""}</button>`).join("")}</div><main class="main"><div class="topbar"><div><div class="tag">TEMPORADA ${state.season} · ${date()}</div><h1>${esc(allPages.find((n) => n[0] === page)?.[1] || activeGroup[1] || "Início")}</h1><small>${topNext ? `${esc(topNext.competitionName)} · ${esc(topStage)} · ${dayDate(topNext.date)}` : "Sem compromisso oficial agendado"}</small></div><div class="actions"><button data-action="export">Salvar</button><button data-advance="1">+1 dia</button><button class="primary" data-simulate="nextCommitment">Até próximo jogo →</button><button data-simulate="30days">+30 dias</button><button data-simulate="season">Até fim da temporada</button></div></div>${views[page]()}<div class="footer">PRO LIFE 0.5 · Interface de carreira · Autosave ativo.</div></main></div>`;
    mountInternationalOfferPreference();
    window.ProLifeTargetClubSelector?.mount?.(state,D,Career);
    mountAvatar();
    revealActiveTab();
    ensurePendingDecisionPopup();
  }
  function mountInternationalOfferPreference(){
    const levelSelect=$("#offer-club-level");
    if(!levelSelect||$("#offer-international")) return;
    const enabled=Career.init(state).offerPreferences?.international!==false;
    const label=document.createElement("label"),note=document.createElement("p");
    label.innerHTML=`<input id="offer-international" type="checkbox" ${enabled?"checked":""}> Clubes internacionais`;
    note.className="chart-note";
    note.textContent=`Mercado internacional ${enabled?"habilitado":"desabilitado"}.`;
    levelSelect.closest("label")?.before(label,note);
  }
  // Celular: a barra de abas rola na horizontal e é recriada a cada render; mantém a aba atual visível.
  function revealActiveTab() {
    const nav = document.querySelector(".game-nav nav"), on = nav?.querySelector("button.active");
    if (nav && on && nav.scrollWidth > nav.clientWidth) nav.scrollLeft = on.offsetLeft - (nav.clientWidth - on.offsetWidth) / 2;
  }
  function careerHub() {
    const slots=S.listSlots?.()||[], active=S.activeId?.();
    const last=slots.find(x=>x.id===active)||slots[0];
    const cards=slots.map(x=>`<article class="career-slot ${x.id===active?"active":""}"><div><small>${x.mode==="coach"?"TREINADOR":"JOGADOR"} · TEMPORADA ${x.season}</small><h2>${esc(x.label||x.name)}</h2><p>${esc(x.club)}${x.pos?` · ${esc(x.pos)}`:""} · ${x.age} anos</p><small>Último acesso: ${new Date(x.updatedAt||Date.now()).toLocaleDateString("pt-BR")}</small></div><div class="career-slot-actions"><button class="primary" data-load-slot="${esc(x.id)}">Carregar</button><button data-rename-slot="${esc(x.id)}">Renomear</button><button class="danger" data-delete-slot="${esc(x.id)}">Excluir</button></div></article>`).join("");
    $("#app").innerHTML=`<div class="landing career-hub"><header><div class="brand">PRO<span>LIFE</span></div><div class="tag">FOOTBALL CAREER</div></header><div class="tag">CENTRAL DE CARREIRAS</div><h1>Escolha sua carreira</h1><p class="intro">Continue de onde parou, carregue outro save ou comece uma nova história.</p>${last?`<section class="career-continue"><div><small>ÚLTIMA CARREIRA</small><h2>${esc(last.label||last.name)}</h2><p>${esc(last.club)} · Temporada ${last.season}</p></div><button class="primary" data-load-slot="${esc(last.id)}">Continuar carreira →</button></section>`:""}<div class="career-hub-actions"><button class="primary" data-action="new-player">Nova carreira de jogador</button><button data-action="new-coach">Nova carreira de treinador</button><button data-action="import">Importar carreira</button></div><section class="career-slots"><div class="split"><div><div class="tag">CARREIRAS SALVAS</div><h2>Carregar carreira</h2></div><span class="pill">${slots.length} save${slots.length===1?"":"s"}</span></div>${cards||'<div class="empty">Nenhuma carreira salva neste aparelho.</div>'}</section><p class="muted">Os saves ficam separados neste navegador. No iPhone, exporte uma carreira se quiser manter uma cópia fora do navegador.</p></div>`;
  }
  function landing() {
    if (!setup) { careerHub(); return; }
    if (window.ProLifeCreator && !classicForm) {
      window.ProLifeCreator.mount({
        $, esc, opt, D, C, Charts, avatar, appearanceFields, toast,
        hasSaved: () => !!state,
        classic: () => { classicForm = true; landing(); },
        confirmReplace: () => true,
        onStart: (fresh) => { S.saveAsNew?.(fresh); state = fresh; setup = false; page = "home"; persist(); render(); window.scrollTo(0, 0); },
      });
      return;
    }
    classicLanding();
  }
  function classicLanding() {
    const saved = state;
    $("#app").innerHTML =
      `<div class="landing"><header><div class="brand">PRO<span>LIFE</span></div><div class="tag">FOOTBALL CAREER / 2026</div></header><div class="tag">CENTRAL DE CARREIRA</div><h1>NOVA CARREIRA</h1><p class="intro">Defina seu perfil, escolha seu primeiro projeto e entre no mundo do futebol.</p>${saved ? '<button data-action="resume">Voltar à carreira atual</button>' : ""}${window.ProLifeCreator ? '<button type="button" data-action="guided">Criador guiado de jogador</button>' : ""}<form id="creator" class="setup"><div class="grid"><section class="card"><h2>PERFIL DO ATLETA OU TREINADOR</h2><div class="formgrid"><label>Carreira<select name="mode" id="mode">${opt(
        [
          ["player", "Jogador — da base ao profissional"],
          ["coach", "Treinador — conduza seu projeto"],
        ],
        "player",
      )}</select></label><label>Nome completo<input name="name" maxlength="60" required value="Alesson Rodrigues"></label><label>Cidade natal<input name="city" maxlength="60" value="Mogi das Cruzes" required></label><label>Data de nascimento<input name="birthDate" id="birthDate" type="date" value="2010-01-01" min="1991-01-01" max="2012-12-31" required></label><label>Idade<input name="age" id="age" type="number" min="14" max="35" value="16" readonly required></label><label>Posição<select name="pos">${opt(
        [
          ["MEI", "Meio-campista"],
          ["ATA", "Atacante"],
          ["DEF", "Defensor"],
          ["GOL", "Goleiro"],
        ],
        "MEI",
      )}</select></label><label>História de origem<select name="origin" id="origin">${opt(Object.entries(D.Training.origins).map(([id,o])=>[id,o.name]), "academy")}</select></label><label>Arquétipo<select name="archetypeId" id="archetypeId">${opt(Object.values(D.Training.archetypeCatalog).filter(a=>a.positions.includes("MEI")).map(a=>[a.id,a.name]), "maestro")}</select></label><label>Pé dominante<select name="foot">${opt(
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
        )}</select></label><label>Estilo de jogo<select name="style">${opt(["Técnico", "Velocista", "Organizador", "Combativo"], "Técnico")}</select></label><label>Comemoração (perfil)<select name="celebration">${opt(C.celebrations, "Braços abertos")}</select></label></div><div id="career-identity" class="notice">Escolha uma origem e um arquétipo. A origem altera contexto inicial, reputação e pequenos bônus; o arquétipo define sua identidade de desenvolvimento.</div><p class="muted">Potencial e sucesso não são garantidos. Treinador usa reputação e licenças; os atributos abaixo são futebolísticos.</p><h3>Distribua até 30 pontos adicionais</h3><div id="points">${D.attrs.map((k) => `<label class="attribute">${D.labels[k]}<input name="point_${k}" type="number" min="0" max="20" value="5" required></label>`).join("")}</div><small id="points-total">30 / 30 pontos</small><div id="initial-radar">${Charts.radar(Object.fromEntries(D.attrs.map((k) => [k, 45])))}</div></section><section class="card"><h2>PERSONALIZAR PERSONAGEM</h2><div id="preview">${avatar({ appearance: {} })}</div><div class="kit-caption"><b id="kit-name">UNIFORME DE TREINO</b><small>O uniforme acompanha o clube escolhido.</small></div>${appearanceFields({})}<div class="notice">Brasil 2026: Séries A, B, C e D, 80 clubes e 38 rodadas por liga. A/B têm referência completa; C/D possuem cobertura parcial. Atributos e resultados são simulados.</div><label>Seed do mundo (opcional)<input name="seed" type="number" placeholder="Um número para reproduzir o mesmo universo"></label><button class="primary" type="submit">Iniciar minha carreira →</button><div class="section"><button type="button" data-action="import">Importar carreira salva</button></div></section></div></form><p class="footer">Sem contas ou pagamentos reais. Base de nomes de 2026; carreira simulada. Leia LEIA_PRIMEIRO.txt para começar.</p></div>`;
    mountAvatar();
    $("#creator").addEventListener("input", (e) => {
      const birth=$("#birthDate");
      const ageInput=$("#age");
      const syncAge=()=>{
        if(!birth?.value||!ageInput)return;
        const [y,m,d]=birth.value.split("-").map(Number), ref=new Date(2026,0,1);
        let age=ref.getFullYear()-y;
        if((ref.getMonth()+1)<m||((ref.getMonth()+1)===m&&ref.getDate()<d))age--;
        ageInput.value=Math.max(14,Math.min(35,age));
      };
      if(e.target.name==="birthDate")syncAge();
      const f = new FormData($("#creator"));
      if (e.target.name === "mode") {
        const coach = f.get("mode") === "coach";
        $("#age").min = coach ? 25 : 14;
        $("#age").max = coach ? 65 : 35;
        $("#age").readOnly = !coach;
        if($("#birthDate")) $("#birthDate").disabled = coach;
        $("#age").value = coach ? 35 : 16;
      }
      if (e.target.name === "origin" && f.get("mode") === "player") {
        const origin = D.Training.origins[f.get("origin")];
        if (origin?.age) {
          $("#age").value = origin.age;
          if($("#birthDate")) $("#birthDate").value = `${2026-origin.age}-01-01`;
        }
      }
      if (e.target.name === "pos") {
        const choices = Object.values(D.Training.archetypeCatalog).filter((a)=>a.positions.includes(f.get("pos")));
        $("#archetypeId").innerHTML = opt(choices.map((a)=>[a.id,a.name]), choices[0]?.id);
      }
      const identity = $("#career-identity");
      if (identity && f.get("mode") === "player") {
        const origin = D.Training.origins[f.get("origin")], arch = D.Training.archetypeCatalog[$("#archetypeId")?.value];
        identity.innerHTML = `<b>${esc(origin?.name || "Origem")}</b> · ${esc(origin?.description || "")}<br><b>${esc(arch?.name || "Arquétipo")}</b> · ${esc(arch?.description || "")}`;
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
        if(config.mode==="player"){
          if(!config.birthDate) throw Error("Escolha a data de nascimento do jogador.");
          const [by,bm,bd]=config.birthDate.split("-").map(Number);
          let calculatedAge=2026-by-((1<bm||(1===bm&&1<bd))?1:0);
          if(calculatedAge<14||calculatedAge>35) throw Error("A idade inicial do jogador deve ficar entre 14 e 35 anos.");
          config.age=calculatedAge;
        }
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
        S.saveAsNew?.(fresh);
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

  function agencyManagementPanel() {
    if(state.mode!=="player") return "";

    const career=Career.init(state);
    const pc=career.playerCareer;
    const st=Career.agencyState(state);
    const current=pc.agent;
    const terms=Career.agencyCommissionTerms(current);

    const relationshipLabel=
      st.relationship>=85 ? "EXCELENTE" :
      st.relationship>=70 ? "BOA" :
      st.relationship>=50 ? "ESTAVEL" :
      st.relationship>=30 ? "FRAGIL" :
      "RUIM";

    const objectives=(st.objectives||[]);

    const objectiveProgress=(o)=>{
      const stats=state.statistics?.players?.hero||{};

      if(o.kind==="REPUTATION")
        return Number(state.reputation||0);

      if(o.kind==="OVERALL")
        return D.overall(state.person);

      if(o.kind==="SALARY")
        return Number(state.salary||0);

      if(o.kind==="PLAYTIME")
        return Number(stats.appearances||0);

      if(o.kind==="TRANSFER")
        return pc.marketState?.signedAgreement ? 1 : 0;

      return Number(o.baseline||0);
    };

    const objectiveHtml=objectives.length
      ? objectives.map(o=>{
          const currentValue=objectiveProgress(o);
          const total=Math.max(
            1,
            Number(o.target||0)-
            Number(o.baseline||0)
          );

          const progress=Math.max(
            0,
            Math.min(
              100,
              Math.round(
                (
                  (
                    currentValue-
                    Number(o.baseline||0)
                  )/
                  total
                )*100
              )
            )
          );

          const statusClass=
            o.status==="CONCLU\u00cdDO"
              ? "good"
              : o.status==="N\u00c3O CUMPRIDO"
                ? "bad"
                : "";

          return `
            <article class="card agency-objective">
              <div class="split">
                <b>${esc(o.title)}</b>
                <small class="${statusClass}">
                  ${esc(o.status)}
                </small>
              </div>

              <div class="fc-manager-bar">
                <i style="width:${progress}%"></i>
              </div>

              <p class="muted">
                Progresso: ${progress}% ?
                prazo ${dayDate(o.deadline)}
              </p>
            </article>
          `;
        }).join("")
      : '<p class="muted">Nenhum objetivo ativo.</p>';

    const openOffers=(st.offers||[])
      .filter(x=>
        x.status==="ABERTA" &&
        x.expires>=state.day
      );

    const representationOffers=openOffers.length
      ? openOffers.map(o=>{
          const agency=Career.agencyById(o.agencyId);

          return `
            <article class="offer-card">
              <small>
                PROPOSTA DE REPRESENTACAO ?
                ${esc(o.level||agency?.level||"LOCAL")}
              </small>

              <h3>${esc(o.agency)}</h3>

              <p>
                ${esc(agency?.specialty||"Gestao de carreira")}
                <br>
                Rede: ${esc(agency?.network||"Brasil")}
                <br>
                Comissao: ${agency?.commission||0}%
                <br>
                Expira em ${dayDate(o.expires)}
              </p>

              <div class="actions">
                <button
                  class="primary"
                  data-hire-agency="${esc(o.agencyId)}"
                >
                  Aceitar representacao
                </button>

                <button
                  data-reject-agency-offer="${esc(o.id)}"
                >
                  Recusar
                </button>
              </div>
            </article>
          `;
        }).join("")
      : '<p class="muted">Nenhuma proposta de representacao pendente.</p>';

    const agencyMarket=Career.availableAgencies(state)
      .filter(a=>a.id!=="prolife-base")
      .map(a=>{
        const e=a.eligibility;
        const active=current?.id===a.id;

        const requirementText=e.eligible
          ? "Requisitos atendidos"
          : (e.missing||[]).map(x=>{
              if(x==="reputation")
                return "Reputacao";

              if(x==="overall")
                return "Overall";

              if(x==="marketValue")
                return "Valor de mercado";

              return x;
            }).join(" · ");

        return `
          <article class="offer-card ${active?"on":""}">
            <div class="split">
              <span class="tag">
                ${esc(a.level)}
              </span>

              <span class="pill">
                ${a.reputation}/100
              </span>
            </div>

            <h3>${esc(a.name)}</h3>

            <p>
              ${esc(a.specialty)}
              <br>
              Rede: ${esc(a.network)}
              <br>
              Negociacao: ${a.negotiation}/100
              <br>
              Comissao: ${a.commission}%
            </p>

            <small class="${e.eligible?"good":"muted"}">
              ${esc(requirementText||e.reason)}
            </small>

            <div class="section">
              <button
                data-hire-agency="${esc(a.id)}"
                ${active||!e.eligible?"disabled":""}
              >
                ${active
                  ? "Agencia atual"
                  : e.eligible
                    ? "Contratar"
                    : "Bloqueada"}
              </button>
            </div>
          </article>
        `;
      }).join("");

    const history=(st.history||[]).length
      ? st.history.slice(0,6).map(h=>`
          <div class="central-list-item">
            <small>
              ${dayDate(h.startDay)} ?
              ${dayDate(h.endDay)}
            </small>

            <b>${esc(h.agency)}</b>

            <p>
              ${esc(h.status)}
              ${Number(h.exitFee||0)>0
                ? " ? rescisao "+money(h.exitFee)
                : ""}
            </p>
          </div>
        `).join("")
      : '<p class="muted">Nenhuma agencia anterior registrada.</p>';

    return `
      <section
        class="card section"
        id="agency-management"
      >
        <div class="split">
          <div>
            <div class="tag">
              EMPRESARIO E AGENCIA
            </div>

            <h2>
              Gestao profissional da carreira
            </h2>
          </div>

          <span class="pill">
            ${current
              ? esc(current.level||"LOCAL")
              : "SEM AGENCIA"}
          </span>
        </div>

        <div class="stats">
          <div class="stat">
            <small>Agencia atual</small>
            <b>
              ${esc(
                current?.agency||
                current?.name||
                "Sem representacao"
              )}
            </b>
          </div>

          <div class="stat">
            <small>Relacionamento</small>
            <b>
              ${st.relationship}/100 ?
              ${relationshipLabel}
            </b>
          </div>

          <div class="stat">
            <small>Negociacao</small>
            <b>
              ${current?.negotiation||0}/100
            </b>
          </div>

          <div class="stat">
            <small>Total em comissoes</small>
            <b>
              ${money(st.totalCommission||0)}
            </b>
          </div>
        </div>

        ${current ? `
          <div class="notice section">
            <b>${esc(current.specialty||"Gestao de carreira")}</b>

            <p>
              Rede: ${esc(current.network||"Brasil")}
              ? salario ${terms.salary}%
              ? luvas ${terms.signingBonus}%
              ? comercial ${terms.commercial}%
            </p>

            ${current.id!=="prolife-base" ? `
              <button
                data-dismiss-agency="1"
              >
                Encerrar representacao
              </button>
            ` : ""}
          </div>
        ` : `
          <div class="notice section">
            <b>Sem representacao ativa</b>

            <p>
              Voce pode receber propostas de agencias
              conforme sua carreira evolui.
            </p>
          </div>
        `}

        <h3 class="section">
          Objetivos definidos pelo empresario
        </h3>

        <div class="grid3">
          ${objectiveHtml}
        </div>

        <h3 class="section">
          Propostas de representacao
        </h3>

        <div class="grid3">
          ${representationOffers}
        </div>

        <h3 class="section">
          Mercado de agencias
        </h3>

        <p class="muted">
          Agencias de nivel superior exigem reputacao,
          overall e valor de mercado compat?veis.
        </p>

        <div class="grid3">
          ${agencyMarket}
        </div>

        <details class="section">
          <summary>
            <b>Historico de representacao</b>
          </summary>

          <div class="section">
            ${history}
          </div>
        </details>
      </section>
    `;
  }

  let worldCupSquadTeamId="BRA";
  let nationalCompetitionId="WORLD_CUP";
  let nationsLeagueDivision="A";
  let concacafNationsLeagueDivision="A";
  let fifaSeriesVenueId="AUSTRALIA";
  let worldCompetitionLeagueId=null;
  let worldCompetitionRound=null;
  let worldMarketTab="rumors";
  let worldMarketFilters={country:"ALL",league:"ALL",club:"ALL",period:"ALL"};

  const views = {
    worldCompetitions() {
      return window.ProLifeWorldCompetitionsView?.render
        ? window.ProLifeWorldCompetitionsView.render(
            state,
            D,
            {
              leagueId:worldCompetitionLeagueId,
              round:worldCompetitionRound
            }
          )
        : '<section class="card"><h2>Competições Mundiais</h2><p class="muted">Módulo de competições mundiais indisponível.</p></section>';
    },

    clubs() {
      return window.ProLifeClubBrowser?.render
        ? window.ProLifeClubBrowser.render(
            state,
            D
          )
        : '<section class="card"><h2>Central de Clubes</h2><p class="muted">Modulo de clubes indisponivel.</p></section>';
    },

    home() {
      const H = window.ProLifeHomeDashboard.snapshot(state, D, Calendar), p=state.person, c=H.c, next=H.next, cur=H.current;
      const resultClass=(r)=>r==="V"?"form-win":r==="D"?"form-loss":"form-draw";
      const safe=(value,fallback="—")=>value===null||value===undefined||value===""||Number.isNaN(value)?fallback:value;
      const monogram=(name)=>String(name||"—").split(/\s+/).filter(Boolean).slice(0,3).map(part=>part[0]).join("").toUpperCase();
      const daysToMatch=next?Math.max(0,Number(next.date||state.day)-state.day):null;
      window.__proLifeRecentMatches=H.recent;
      const taskItems=[];
      if(next)taskItems.push(`<article class="central-v3-task"><small>PRÓXIMO JOGO</small><b>${esc(next.home)} × ${esc(next.away)}</b><span>${daysToMatch===0?"Hoje":`Em ${daysToMatch} dia(s)`}</span></article>`);
      if(H.objectives[0])taskItems.push(`<article class="central-v3-task"><small>OBJETIVO</small><b>${esc(H.objectives[0].label)}</b><span>Próxima atuação</span></article>`);
      if(state.mode==="player"&&H.lineup)taskItems.push(`<article class="central-v3-task"><small>ELENCO</small><b>${esc(H.lineup.heroRole||"Situação a definir")}</b><span>${esc(H.player.squadRole||"Sem papel definido")}</span><button data-page="lineup">Ver escalação</button></article>`);
      if(state.offers?.length)taskItems.push(`<article class="central-v3-task"><small>MERCADO</small><b>${state.offers.length} proposta${state.offers.length>1?"s":""} aguardando análise</b><span>Resposta pendente</span><button data-page="proposals">Analisar</button></article>`);
      if(taskItems.length<4)taskItems.push(`<article class="central-v3-task"><small>TREINO</small><b>${esc(H.training.focus||"Rotina diária")}</b><span>${esc(H.training.next||"Disponível")}</span><button data-page="training">Abrir treino</button></article>`);
      const decisionTask=state.decision?`<article class="central-v3-task central-v3-decision"><small>DECISÃO PENDENTE</small><b>${esc(state.decision.title)}</b><span>${esc(state.decision.body)}</span><div class="actions">${state.decision.choices.map(([id,label])=>`<button data-choice="${id}">${esc(label)}</button>`).join("")}</div></article>`:"";
      const nextActions=next?`<div class="central-v3-actions"><button class="primary" data-live-match>Acompanhar partida</button><button data-simulate="nextCommitment">Simular até o jogo</button><button data-advance="1">Avançar 1 dia</button></div>`:`<div class="central-v3-actions"><button class="primary" data-page="calendar">Abrir calendário</button><button data-advance="1">Avançar 1 dia</button></div>`;
      return `<div class="career-dashboard career-central-v3">
        <header class="central-v3-header"><div><span>TEMPORADA ${safe(state.season)}</span><time>${dayDate(state.day)}</time><h1>Central</h1></div><p>${esc(next?.competitionName||H.table.league||"Temporada atual")} <b>·</b> ${esc(next?.stage||"Visão geral")}</p></header>
        <section class="central-v3-hero central-main-match">
          <div class="central-v3-match"><div class="central-v3-eyebrow">PRÓXIMO COMPROMISSO</div>${next?`<div class="central-v3-competition"><b>${esc(next.competitionName||"Competição")}</b><span>${esc(next.stage||"Próxima rodada")}</span></div><div class="central-v3-matchup"><div class="central-v3-team"><i>${esc(monogram(next.home))}</i><small>MANDANTE</small><strong>${esc(next.home)}</strong></div><em>×</em><div class="central-v3-team away"><i>${esc(monogram(next.away))}</i><small>VISITANTE</small><strong>${esc(next.away)}</strong></div></div><div class="central-v3-match-meta"><span>${dayDate(next.date)}</span><span>${daysToMatch===0?"Hoje":`Em ${daysToMatch} dia(s)`}</span>${next.stadium?`<span>${esc(next.stadium)}</span>`:""}${H.table.position&&!next.national?`<span>${H.table.position}º · ${esc(H.table.league)}</span>`:""}</div>${state.mode==="player"?`<div class="central-v3-status-row"><span><small>PAPEL</small>${esc(H.player.squadRole||"—")}</span><span><small>PRÓXIMO JOGO</small>${esc(H.lineup?.heroRole||"A definir")}</span><span><small>META</small>${esc(H.objectives[0]?.label||"—")}</span></div><button class="central-v3-lineup" data-page="lineup">Ver escalação</button>`:""}`:`<div class="central-v3-empty"><h2>Sem compromisso oficial agendado</h2><p>Consulte o calendário para planejar os próximos passos da carreira.</p></div>`}${nextActions}</div>
          <aside class="central-v3-player central-player-card">${state.mode==="player"?`<div class="central-v3-avatar">${avatar(p)}</div><div class="central-v3-player-id"><span class="central-v3-rating">${safe(H.player.overall)}<small>GER</small></span><div><h2>${esc(H.player.name||"Jogador")}</h2><p>${esc(c?.name||"Sem clube")} · ${esc(H.player.pos||"—")} · ${safe(H.player.age)} anos</p></div></div><div class="central-v3-player-state"><span><small>FASE</small><b>${safe(H.player.form)}</b></span><span><small>MORAL</small><b>${Number.isFinite(Number(H.player.morale))?Math.round(H.player.morale):"—"}</b></span><span><small>PREPARO</small><b>${Number.isFinite(Number(H.player.condition))?`${Math.round(H.player.condition)}%`:"—"}</b></span></div><div class="central-v3-player-stats"><span><small>Valor</small><b>${H.player.marketValue?money(H.player.marketValue):"—"}</b></span><span><small>Jogos</small><b>${safe(cur.appearances??cur.games,0)}</b></span><span><small>Gols</small><b>${safe(cur.goals,0)}</b></span><span><small>Assist.</small><b>${safe(cur.assists,0)}</b></span><span><small>Nota</small><b>${safe(cur.averageRating)}</b></span></div><button data-page="profile">Abrir Meu jogador</button>`:`<div class="central-v3-coach"><span class="central-v3-rating">${Math.round(state.board)}<small>CONF</small></span><h2>${esc(p.name||"Treinador")}</h2><p>${esc(c?.name||"Sem clube")}</p>${bar("Diretoria",state.board)}${bar("Moral",p.morale)}</div>`}</aside>
        </section>
        <div class="central-v3-grid central-grid">
          <section class="central-v3-tile central-v3-table central-table"><div class="central-v3-eyebrow">CLASSIFICAÇÃO</div><h2>${esc(H.table.league||"Competição atual")}</h2>${H.table.rows.length?H.table.rows.slice(0,5).map(x=>`<div class="central-v3-standing ${x.id===state.clubId?"me":""}"><span>${x.position}</span><b>${esc(D.club(state,x.id)?.name||x.id||"—")}</b><strong>${safe(x.stats?.points,0)} pts</strong></div>`).join(""):`<p class="muted">Classificação indisponível.</p>`}<button data-page="league">Ver classificação</button></section>
          <section class="central-v3-tile central-v3-form central-form"><div class="central-v3-eyebrow">FORMA RECENTE</div><h2>Últimos jogos</h2>${H.recent.length?`<div class="central-v3-form-list">${H.recent.slice(0,5).map((x,i)=>`<button type="button" class="central-v3-form-row match-peek ${resultClass(x.result)}" data-recent-match="${i}" aria-expanded="false"><b>${esc(x.result)}</b><span>${esc(x.home)} <strong>${esc(x.score)}</strong> ${esc(x.away)}</span>${x.rating?`<small>Nota ${safe(x.rating)}</small>`:""}</button>`).join("")}</div><div id="recent-match-detail" class="recent-match-detail" hidden></div>`:`<p class="central-v3-empty-copy">Nenhuma partida disputada nesta temporada.</p>`}<button data-page="matches">Ver partidas</button></section>
          <section class="central-v3-tile central-v3-tasks central-inbox central-training central-objectives"><div class="central-v3-eyebrow">TASK LIST</div><h2>Prioridades</h2>${decisionTask}${taskItems.slice(0,state.decision?3:4).join("")||`<p class="muted">Nenhuma prioridade pendente.</p>`}</section>
        </div>
        <footer class="central-v3-context central-news central-calendar"><div><small>CONTEXTO DA CARREIRA</small><b>${esc(H.events[0]?.title||H.news[0]?.title||`Temporada ${state.season}`)}</b><span>${esc(H.events[0]?.detail||H.news[0]?.body||`${c?.name||"Carreira"} · ${H.table.league||"Calendário profissional"}`)}</span></div><nav><button data-page="inbox">Caixa de entrada</button><button data-page="calendar">Abrir calendário</button></nav></footer>
      </div>`;
    },
    lineup() {
      const H=window.ProLifeHomeDashboard.snapshot(state,D,Calendar), L=H.lineup, next=H.next, pc=Career.init(state).playerCareer;
      if(state.mode!=="player") return `<section class="card"><h2>Escalação</h2><p class="muted">Disponível na carreira de jogador.</p></section>`;
      if(!state.clubId) return `<section class="card"><h2>Sem clube</h2><p class="muted">Assine com um clube para disputar uma vaga.</p></section>`;
      if(next?.national) {
        const n=D.NationalTeam?.init?.(state);
        const nationalLineup=D.NationalTeam?.matchLineup?.(state,D);

        if(!n || !nationalLineup){
          return `<section class="card">
            <h2>Escala\u00e7\u00e3o da Sele\u00e7\u00e3o</h2>
            <p class="muted">A rela\u00e7\u00e3o da Sele\u00e7\u00e3o Brasileira ainda n\u00e3o est\u00e1 dispon\u00edvel.</p>
          </section>`;
        }

        const nationalPlayerCard=(p)=>`
          <div class="fc-lineup-player ${p.id==="hero"?"hero":""}">
            <span class="fc-shirt">${esc(p.pos||"-")}</span>
            <span>
              <b>${esc(p.name)}${p.id==="hero"?" \u00b7 VOC\u00ca":""}</b>
              <small>${Number(p.overall||0)} GER \u00b7 ${esc(p.club||"Sele\u00e7\u00e3o Brasileira")}</small>
            </span>
          </div>`;

        const starters=nationalLineup.starters
          .map(nationalPlayerCard)
          .join("");

        const bench=nationalLineup.bench
          .map(nationalPlayerCard)
          .join("");

        const status=nationalLineup.calledUp
          ? nationalLineup.status
          : (n.status||"N\u00e3o convocado");

        const roleClass=status==="Titular"
          ? "starter"
          : ["Rota\u00e7\u00e3o","Reserva"].includes(status)
            ? "bench"
            : "out";

        return `<div class="lineup-page fc-career-lineup national-lineup-stage23">

          <section class="card fc-match-header">
            <div>
              <div class="tag">SELE\u00c7\u00c3O BRASILEIRA \u00b7 PR\u00d3XIMO JOGO</div>
              <h2>${esc(next.home)} \u00d7 ${esc(next.away)}</h2>
              <p>
                ${dayDate(next.date)}
                \u00b7
                ${esc(next.stage||next.competitionName||"Amistoso internacional")}
              </p>
            </div>

            <span class="pill">4-3-3</span>
          </section>

          <section class="card section">
            <div class="split">
              <div>
                <div class="tag">SUA SITUA\u00c7\u00c3O</div>
                <h2>${esc(status)}</h2>
              </div>

              <span class="pill ${roleClass}">
                ${nationalLineup.calledUp
                  ? "CONVOCADO"
                  : "FORA DA CONVOCA\u00c7\u00c3O"}
              </span>
            </div>

            <p class="muted">
              Esta escala\u00e7\u00e3o usa o elenco e a hierarquia atuais da Sele\u00e7\u00e3o Brasileira.
            </p>
          </section>

          <div class="grid section">

            <section class="card">
              <div class="tag">TITULARES</div>
              <h2>Brasil \u00b7 XI inicial</h2>

              <div class="fc-lineup-list">
                ${starters}
              </div>
            </section>

            <section class="card">
              <div class="tag">BANCO</div>
              <h2>Relacionados</h2>

              <div class="fc-lineup-list">
                ${bench || '<p class="muted">Banco ainda n\u00e3o definido.</p>'}
              </div>
            </section>

          </div>

          <section class="card section">
            <button data-page="national">
              Abrir Central da Sele\u00e7\u00e3o Brasileira
            </button>
          </section>

        </div>`;
      }
      if(!L) return `<section class="card"><h2>Escalação ainda não disponível</h2><p class="muted">Não há uma relação de jogo do clube para exibir agora.</p></section>`;
      const actualRole=D.Squad.roleForHero(state,L.selection), roleClass=actualRole==="Titular"?"starter":actualRole==="Banco"?"bench":"out", plan=actualRole==="Banco"?H.subPlan:null;
      const leadership=H.leadership||D.captaincy?.(state,D.club(state)), capId=D.club(state)?.captainId||leadership?.captain?.id, viceId=D.club(state)?.viceCaptainId||leadership?.vice?.id;
      const chance=plan?Math.round(plan.chance*100):actualRole==="Titular"?100:0;
      const perspective=actualRole==="Titular"?"ESCALADO ENTRE OS 11":actualRole==="Banco"?"RELACIONADO NO BANCO":"FORA DA RELAÇÃO";
      const playerCard=p=>`<div class="fc-lineup-player ${p.id==="hero"?"hero":""}"><span class="fc-shirt">${p.pos}</span><span><b>${esc(p.name)}${p.id===capId?' <strong class="captain-mark" title="Capitão: líder da equipe em campo e principal interlocutor com a arbitragem.">C</strong>':p.id===viceId?' <strong class="captain-mark vice" title="Vice-capitão: assume a braçadeira quando o capitão não está em campo.">VC</strong>':""}</b><small>${D.overall(p)} GER · ${esc(p.pos)}</small></span>${p.id==="hero"?'<em>VOCÊ</em>':""}</div>`;
      const starters=L.selection.starters.map(playerCard).join(""), bench=L.selection.bench.map(playerCard).join("");
      return `<div class="lineup-page fc-career-lineup">
        <section class="card fc-match-header"><div><div class="tag">PRÓXIMO JOGO</div><h2>${next?`${esc(next.home)} × ${esc(next.away)}`:"Próxima partida"}</h2><p>${next?`${dayDate(next.date)} · ${esc(next.competitionName||"")}`:""}</p></div><div class="fc-selection-badge ${roleClass}"><small>SITUAÇÃO</small><strong>${esc(actualRole.toUpperCase())}</strong></div></section>
        <section class="card fc-manager-panel"><div class="split"><div><div class="tag">AVALIAÇÃO DO MANAGER</div><h2>${Math.round(pc.coachTrust)}/100</h2></div><span class="pill">${esc(pc.squadRole)}</span></div>
          <div class="fc-manager-bar"><i style="width:${Math.max(0,Math.min(100,Math.round(pc.coachTrust)))}%"></i></div>
          <div class="central-kpis"><span><small>Condição</small><b>${Math.round(state.person.condition)}%</b></span><span><small>Forma</small><b>${H.player.form??"—"}</b></span><span><small>GER</small><b>${D.overall(state.person)}</b></span><span><small>Posição</small><b>${esc(state.person.pos)}</b></span></div>
          <div class="notice"><b>${perspective}</b><p>${actualRole==="Titular"?"Você aparece abaixo no XI inicial.":actualRole==="Banco"?`Você aparece abaixo entre os reservas${plan?` e a janela prevista de entrada começa por volta de ${plan.minute}'`:""}.`:"Você não aparece no XI nem no banco para esta partida."}</p></div>
        </section>
        <div class="grid section"><section class="card"><div class="tag">ESCALAÇÃO</div><h2>${esc(L.formation)} · 11 iniciais</h2><div class="fc-lineup-list">${starters}</div></section><section class="card"><div class="tag">RESERVAS</div><h2>Banco</h2><div class="fc-lineup-list">${bench||'<p class="muted">Sem reservas.</p>'}</div></section></div>
        ${(()=>{const key=String(next?.competitionId||next?.leagueId||next?.competitionName||"geral"),d=D.disciplineCompetition?.(state.person,key)||{yellows:0,suspensions:0,yellowTotal:0,redTotal:0};return `<section class="card section"><div class="tag">DISCIPLINA</div><h2>Cartões · ${esc(next?.competitionName||"Competição")}</h2><div class="central-kpis"><span><small>Amarelos na série</small><b>${d.yellows}/3</b></span><span><small>Amarelos totais</small><b>${d.yellowTotal}</b></span><span><small>Vermelhos</small><b>${d.redTotal}</b></span><span><small>Suspensões pendentes</small><b>${d.suspensions}</b></span></div><p class="muted">A contagem é separada por competição. A cada série de 3 amarelos há suspensão automática; vermelho gera suspensão. Segundo amarelo na mesma partida resulta em expulsão e esses dois amarelos não entram na série de 3.</p></section>`})()}
        <section class="card section"><div class="tag">HIERARQUIA DE LIDERANÇA</div><h2>Capitães do elenco</h2><div class="central-kpis"><span><small>Capitão</small><b>${esc(leadership?.captain?.name||"—")}</b></span><span><small>Vice-capitão</small><b>${esc(leadership?.vice?.name||"—")}</b></span><span><small>Sua posição</small><b>${leadership?.heroRank?`${leadership.heroRank}º`:"—"}</b></span><span><small>Tempo no clube</small><b>${leadership?.heroYears!=null?`${leadership.heroYears.toFixed(1)} ano(s)`:"—"}</b></span></div><p class="muted">A hierarquia prioriza longevidade no clube e experiência; titularidade/importância, GER, forma e perfil posicional complementam a avaliação. A braçadeira da partida fica com o líder mais bem ranqueado que estiver no XI.</p></section>
        <section class="card section"><div class="tag">DISPUTA POR POSIÇÃO</div><h2>Seu caminho no time</h2><p>Treinos e objetivos de partida alimentam sua avaliação do manager; a relação acima mostra a seleção efetiva usada pelo jogo.</p></section>
      </div>`;
    },
    story() {
      if(state.mode!=="player"){
        return '<section class="card"><h2>Objetivos e História</h2><p class="muted">Disponível apenas na carreira de jogador.</p></section>';
      }

      const hub=window.ProLifeStoryHub?.snapshot?.(state);

      if(!hub?.available){
        return '<section class="card"><h2>Objetivos e História</h2><p class="muted">Central indisponível nesta carreira.</p></section>';
      }

      const days=(deadline)=>{
        if(!Number.isFinite(deadline)) return "";
        const value=Math.max(0,deadline-state.day);
        return value===0 ? "vence hoje" : value===1 ? "1 dia restante" : value+" dias restantes";
      };

      const statusClass=(item)=>
        item.priority==="URGENTE" ? "bad" :
        item.status==="CONCLUÃDO" || item.status==="CONCLUIDO" ? "good" :
        "";

      const objectiveCard=(item)=>{
        const progress=Number.isFinite(item.progress)
          ? `<div class="fc-manager-bar"><i style="width:${Math.max(0,Math.min(100,item.progress))}%"></i></div>`
          : "";

        const values=
          Number.isFinite(item.current)&&Number.isFinite(item.target)
            ? `<small>Progresso: ${item.current} / ${item.target}</small>`
            : Number.isFinite(item.target)
              ? `<small>Meta: ${item.target}</small>`
              : "";

        const deadline=Number.isFinite(item.deadline)
          ? `<small>${days(item.deadline)}</small>`
          : "";

        const action=item.actionable&&item.page
          ? `<button data-page="${esc(item.page)}"${item.anchor?` data-target="${esc(item.anchor)}"`:""}>Responder agora</button>`
          : item.page
            ? `<button data-page="${esc(item.page)}"${item.anchor?` data-target="${esc(item.anchor)}"`:""}>Ver detalhes</button>`
            : "";

        return `<article class="card story-objective">
          <div class="split">
            <div>
              <div class="tag">${esc(item.category)}</div>
              <h3>${esc(item.title)}</h3>
            </div>
            <span class="pill ${statusClass(item)}">${esc(item.status)}</span>
          </div>
          ${item.description?`<p class="muted">${esc(item.description)}</p>`:""}
          ${progress}
          <div class="split story-objective-meta">
            <span>${values}</span>
            <span>${deadline}</span>
          </div>
          ${action}
        </article>`;
      };

      const urgent=hub.urgent||[];
      const active=(hub.active||[]).filter(x=>x.priority!=="URGENTE");
      const history=hub.timeline||[];
      const milestones=hub.milestones;

      const milestoneHtml=milestones
        ? `<section class="card section story-milestones">
            <div class="split">
              <div>
                <div class="tag">LEGADO</div>
                <h2>${esc(milestones.tier||"Em construção")}</h2>
              </div>
              <span class="pill">${Math.round(milestones.score||0)} pts</span>
            </div>
            <div class="profile-data">
              ${(milestones.items||[]).map(x=>`<span>${esc(x.label)} <b>${x.value}</b></span>`).join("")}
            </div>
            ${milestones.clubs?.length
              ? `<p class="muted">Clubes na carreira: ${milestones.clubs.map(esc).join(" • ")}</p>`
              : ""}
          </section>`
        : "";

      const timelineHtml=history.length
        ? history.slice(0,30).map(row=>`
            <article class="news story-timeline-row">
              <time>Dia ${row.day} · ${esc(row.category)}</time>
              <h3>${esc(row.title)}</h3>
              ${row.detail?`<p>${esc(row.detail)}</p>`:""}
            </article>
          `).join("")
        : '<p class="muted">A história da carreira ainda não possui registros suficientes.</p>';

      return `<div class="story-hub-stage23">
        <section class="card player-hero">
          <div class="player-hero-copy">
            <div class="tag">CENTRAL DA CARREIRA</div>
            <h1>Objetivos e História</h1>
            <p>Acompanhe o que exige sua atenção agora e como suas escolhas estão formando sua carreira.</p>
          </div>
          <div class="player-ovr">
            <strong>${urgent.length}</strong>
            <small>URGENTES</small>
            <span>${active.length}</span>
            <small>OBJETIVOS</small>
          </div>
        </section>

        <nav class="player-tabs">
          <a href="#story-priorities">Prioridades</a>
          <a href="#story-objectives">Objetivos</a>
          <a href="#story-milestones">Marcos</a>
          <a href="#story-timeline">História</a>
        </nav>

        <section id="story-priorities" class="section">
          <div class="tag">PRIORIDADES</div>
          <h2>O que precisa da sua atenção</h2>
          ${urgent.length
            ? `<div class="grid">${urgent.map(objectiveCard).join("")}</div>`
            : '<section class="card"><p class="muted">Nenhuma pendência urgente no momento.</p></section>'}
        </section>

        <section id="story-objectives" class="section">
          <div class="tag">OBJETIVOS ATIVOS</div>
          <h2>Seu caminho na carreira</h2>
          ${active.length
            ? `<div class="grid">${active.map(objectiveCard).join("")}</div>`
            : '<section class="card"><p class="muted">Nenhum objetivo ativo no momento.</p></section>'}
        </section>

        <div id="story-milestones">
          ${milestoneHtml}
        </div>

        <section id="story-timeline" class="card section story-timeline">
          <div class="tag">HISTÓRIA DA CARREIRA</div>
          <h2>Sua trajetória</h2>
          <p class="muted">Partidas marcantes, transferências, decisões, personalidade e acontecimentos importantes aparecem aqui em ordem cronológica.</p>
          ${timelineHtml}
        </section>
      </div>`;
    },

    agency() {
      if(state.mode!=="player"){
        return '<section class="card"><h2>Empres?rio e Ag?ncia</h2><p class="muted">Dispon?vel apenas na carreira de jogador.</p></section>';
      }

      return agencyManagementPanel();
    },

    profile() {
      const p = state.person,
        c = D.club(state);
      const career = Career.init(state), pc = career.playerCareer, ct = pc?.contract, interests = pc?.interests || [], advice = state.mode === "player" ? Career.agentAdvice(state) : null, strategy = pc?.agentStrategy || { priority: "balanced", stance: "open" }, prefs = career.offerPreferences || { leagues: ["serieA", "serieB", "serieC", "serieD"], clubLevel: "any", international: true }, remaining = ct ? Math.max(0, ct.endDay - state.day) : 0;
      const contractAgent = state.mode !== "player" ? "" : `<section class="card section" id="contract-agent"><div class="split"><div><div class="tag">CONTRATO E AGENTE</div><h2>Sua carreira profissional</h2></div><span class="pill">${ct ? `${Math.ceil(remaining / 30)} mês(es)` : "SEM VÃNCULO"}</span></div><div class="stats"><div class="stat"><small>Valor de mercado</small><b>${money(pc.marketValue || 0)}</b></div><div class="stat"><small>Salário</small><b>${money(state.salary)}/mês</b></div><div class="stat"><small>Papel no elenco</small><b>${esc(ct?.role || pc.squadRole || "—")}</b></div><div class="stat"><small>Contrato</small><b>${ct ? dayDate(ct.endDay) : "Sem contrato"}</b></div></div>${ct && remaining <= 180 ? `<div class="notice"><b>Seu contrato está perto do fim.</b><p>Restam aproximadamente ${Math.ceil(remaining / 30)} mês(es). Acompanhe as conversas com a diretoria e defina os próximos passos com seu agente.</p></div>` : ""}<div class="grid"><div><div class="tag">MEU AGENTE</div><h3>${esc(pc.agent?.name || "Agente PRO-LIFE")}</h3><p>${esc(pc.agent?.agency || "Agência independente")} · reputação ${pc.agent?.reputation||50}/100 · comissão ${pc.agent?.commission||5}%<br>Rede: ${esc(pc.agent?.network||"Nacional")} · negociação ${pc.agent?.negotiation||50}/100</p><h3>${esc(advice?.action || "Planejamento de carreira")}</h3><p>${esc(advice?.reason || "Seu agente está analisando o próximo passo.")}</p><label>Prioridade<select id="agent-priority"><option value="balanced" ${strategy.priority === "balanced" ? "selected" : ""}>Equilíbrio</option><option value="playtime" ${strategy.priority === "playtime" ? "selected" : ""}>Tempo de jogo</option><option value="salary" ${strategy.priority === "salary" ? "selected" : ""}>Salário</option><option value="prestige" ${strategy.priority === "prestige" ? "selected" : ""}>Prestígio</option><option value="development" ${strategy.priority === "development" ? "selected" : ""}>Desenvolvimento</option></select></label><label>Postura<select id="agent-stance"><option value="stay" ${strategy.stance === "stay" ? "selected" : ""}>Quero permanecer</option><option value="open" ${strategy.stance === "open" ? "selected" : ""}>Aberto a propostas</option><option value="loan" ${strategy.stance === "loan" ? "selected" : ""}>Buscar empréstimo</option><option value="leave" ${strategy.stance === "leave" ? "selected" : ""}>Buscar saída</option></select></label><button class="primary" data-action="agent-strategy">Atualizar estratégia</button><div class="actions">${Career.agencies.map(a=>`<button data-hire-agency="${a.id}" ${pc.agent?.id===a.id?"disabled":""}>${pc.agent?.id===a.id?"Agência atual":`Contratar ${esc(a.name)}`}</button>`).join("")}</div></div><div><div class="tag">SITUAÇÃO CONTRATUAL</div>${ct ? `<p><b>Clube:</b> ${esc(c?.name || "—")}<br><b>Vínculo:</b> ${ct.type === "loan" ? "Empréstimo" : "Definitivo"}<br><b>Término:</b> ${dayDate(ct.endDay)}<br><b>Tempo restante:</b> ${Math.ceil(remaining / 30)} mês(es)</p>` : `<p>Você está sem contrato ativo.</p>`}<p><b>Interesses:</b><br>${interests.length ? interests.slice(0, 5).map(x => `${esc(D.club(state, x.clubId)?.name || "Clube")} · ${esc(x.stage)}`).join("<br>") : "Nenhuma sondagem ativa."}</p>${!pc.renewalOffer && ct && remaining <= 365 ? `<button class="primary" data-action="request-renewal">Pedir ao agente para renovar</button>` : ""}</div></div>${pc.renewalOffer ? `<article class="news offer section"><time>NEGOCIAÇÃO DE RENOVAÇÃO</time><h3>${esc(c?.name || "Clube atual")}</h3><p>Proposta atual: ${Math.round(pc.renewalOffer.durationDays / 365)} ano(s) · ${money(pc.renewalOffer.salary)}/mês · luvas ${money(pc.renewalOffer.signingBonus)} · bônus ${money(pc.renewalOffer.performanceBonus || 0)} · papel ${esc(pc.renewalOffer.role || pc.squadRole)}</p><div class="grid3"><label>Salário desejado<input id="renew-salary" type="number" min="0" step="100" value="${pc.renewalOffer.salary}"></label><label>Anos<input id="renew-years" type="number" min="1" max="5" value="${Math.round(pc.renewalOffer.durationDays / 365)}"></label><label>Luvas<input id="renew-bonus" type="number" min="0" step="100" value="${pc.renewalOffer.signingBonus}"></label><label>Bônus desempenho<input id="renew-performance" type="number" min="0" step="100" value="${pc.renewalOffer.performanceBonus || 0}"></label><label>Papel<select id="renew-role">${["Rotação", "Titular", "Importante", "Estrela"].map(r => `<option ${r === (pc.renewalOffer.role || pc.squadRole) ? "selected" : ""}>${r}</option>`).join("")}</select></label></div><div class="actions"><button class="primary" data-action="accept-renewal">Aceitar renovação</button><button data-action="counter-renewal">Pedir meus termos</button><button data-action="reject-renewal">Recusar</button></div></article>` : ""}<details class="section"><summary><b>Preferências de propostas</b></summary><p class="muted">Defina o tipo de oportunidade que seu agente deve priorizar.</p>${state.world === "brazil2026" ? `<div class="offer-pref-leagues">${[["serieA", "Série A"], ["serieB", "Série B"], ["serieC", "Série C"], ["serieD", "Série D"]].map(([id, label]) => `<label><input type="checkbox" class="offer-league" value="${id}" ${prefs.leagues.includes(id) ? "checked" : ""}> ${label}</label>`).join("")}</div>` : ""}<label><input id="offer-international" type="checkbox" ${prefs.international!==false?"checked":""}> Clubes internacionais</label><p class="chart-note">Mercado internacional ${prefs.international!==false?"habilitado":"desabilitado"}.</p><label>Nível dos clubes<select id="offer-club-level"><option value="any" ${prefs.clubLevel === "any" ? "selected" : ""}>Qualquer clube</option><option value="elite" ${prefs.clubLevel === "elite" ? "selected" : ""}>Somente clubes de elite</option><option value="competitive" ${prefs.clubLevel === "competitive" ? "selected" : ""}>Clubes competitivos</option><option value="intermediate" ${prefs.clubLevel === "intermediate" ? "selected" : ""}>Clubes intermediários</option><option value="small" ${prefs.clubLevel === "small" ? "selected" : ""}>Clubes menores</option></select></label><button class="primary" data-action="offer-prefs">Salvar preferências</button></details></section>`;
      if (state.mode === "player") {
        const P = window.ProLifePlayerProfile.init(state, D), I=P.identity, S=P.season, CS=P.careerStats, DEV=P.development;
        const attrClass=(v)=>v>=80?"elite":v>=65?"solid":"develop";
        const stat=(label,value)=>`<span><small>${label}</small><b>${value}</b></span>`;
        const attrGroups=P.attributes.map(g=>`<section class="player-attr-group"><h3>${esc(g.name)}</h3>${g.items.map(a=>`<div class="player-attr ${attrClass(a.value)}"><span>${esc(a.label)}</span><b>${Math.round(a.value)}</b><i><em style="width:${D.clamp(a.value,0,100)}%"></em></i></div>`).join("")}</section>`).join("");
        const history=P.development.history.map(h=>`<div class="player-history-row"><span>${h.season?`Temporada ${h.season}`:"Registro atual"}</span><b>${h.start}${h.end!==h.start?` → ${h.end}`:""}</b>${h.current?"<small>Atual</small>":""}</div>`).join("");
        const gains=DEV.gains.length?DEV.gains.map(g=>`<div class="player-gain"><span>${esc(g.label)}</span><b>${g.from} → ${g.to}</b><small class="good">${signed(g.to-g.from)}</small></div>`).join(""):`<p class="muted">Ainda não houve alteração de atributos registrada nesta temporada.</p>`;
        const transferHistory=window.ProLifePlayerTransferHistory?.render
          ? window.ProLifePlayerTransferHistory.render(state,p.id)
          : `<section id="player-transfers" class="card section"><h2>Histórico de transferências</h2><p class="muted">Histórico indisponível.</p></section>`;
        const ct=P.contract;
        return `<div class="player-hub">
          <section class="card player-hero">${avatar(p)}<div class="player-hero-copy"><div class="tag">MEU JOGADOR</div><h1>${esc(I.name)}</h1><p><b>#${I.number}</b> · ${esc(I.club)} · ${esc(I.position)} · ${I.age} anos${I.nationality?` · ${esc(I.nationality)}`:""}</p><div class="player-tags"><span>${esc(I.squadRole||"Status não definido")}</span>${I.archetype?.name?`<span>${esc(I.archetype.name)}</span>`:""}${I.origin?`<span>${esc(I.origin)}</span>`:""}</div></div><div class="player-ovr"><strong>${I.overall}</strong><small>GER</small><span>${money(I.marketValue)}</span><small>Valor de mercado</small></div></section>
          <nav class="player-tabs"><a href="#player-overview">Visão Geral</a><a href="#player-identity">Identidade</a><a href="#player-attributes">Atributos</a><a href="#player-development">Evolução</a><a href="#player-career">Carreira</a><a href="#player-transfers">Transferências</a></nav>
          <section id="player-overview" class="card section"><div class="tag">VISÃO GERAL</div><div class="player-overview-grid"><div><h2>Temporada atual</h2><div class="player-kpis">${stat("Jogos",S.appearances)}${stat("Titular",S.starts)}${stat("Minutos",S.minutes)}${stat("Gols",S.goals)}${stat("Assistências",S.assists)}${stat("Nota média",S.averageRating||"—")}${stat("Cartões",(S.yellowCards||0)+(S.redCards||0))}${stat("Melhor em campo",S.motm||0)}</div></div><div><h2>Perfil profissional</h2><div class="player-kpis">${stat("Salário",money(I.salary)+"/mês")}${stat("Status",esc(I.squadRole||"—"))}${stat("Forma",I.form??"—")}${stat("Condição",Math.round(I.condition)+"%")}${stat("Moral",Math.round(I.morale))}${stat("Estilo",esc(I.style||"—"))}</div></div></div><div class="player-archetype"><div><div class="tag">ARQUÉTIPO</div><h2>${esc(P.archetype.name||"Perfil em formação")}</h2><p>${esc(P.archetype.description||"A identidade futebolística evolui com sua carreira.")}</p></div>${P.archetype.specializations.length?`<div><small>Especializações</small><p>${P.archetype.specializations.map(x=>esc(x.name)).join(" · ")}</p></div>`:""}</div></section>
          ${(()=>{const q=D.Physical?.init?.(p,state.day);if(!q)return"";const a=q.active;return `<section class="card section"><div class="tag">STATUS FÃSICO</div><div class="player-kpis">${stat("Condição",Math.round(q.fitness)+"%")}${stat("Fadiga",Math.round(q.fatigue)+"%")}${stat("Status",esc(D.Physical.status(p)))}</div>${a?`<p><b>${esc(a.name)}</b> · ${esc(a.severity)}<br>Previsão: ${Math.max(0,p.injury)} dia(s) · Recuperação ${Math.round((1-Math.max(0,p.injury)/Math.max(1,a.totalDays))*100)}%</p>${a.status==="RETORNO PARCIAL"&&a.severity!=="GRAVE"?`<button data-physical-return="gradual">Retornar gradualmente</button><button data-physical-return="wait">Aguardar recuperação completa</button>`:""}`:`<p class="muted">Sem lesão ativa. Carga recente: ${Math.round(q.recentLoad)} min.</p>`}</section>`})()}
          ${originPanel()}${identityPanel()}
          <section id="player-attributes" class="card section"><div class="split"><div><div class="tag">ATRIBUTOS</div><h2>Perfil técnico</h2></div><span class="rating-badge">${I.overall}</span></div><p class="muted">Os atributos abaixo são os mesmos usados pelo treino e pela simulação. Verde destaca pontos fortes; valores menores indicam áreas em desenvolvimento.</p><div class="player-attributes-grid">${attrGroups}</div></section>
          <section id="player-development" class="card section"><div class="tag">EVOLUÇÃO DO JOGADOR</div><div class="player-development-head"><div><small>GER no início da temporada</small><b>${DEV.seasonStart}</b></div><strong>${DEV.overall}</strong><div><small>Evolução na temporada</small><b class="${DEV.seasonGrowth>=0?"good":"bad"}">${signed(DEV.seasonGrowth)}</b></div></div><div class="player-kpis">${stat("Nível",DEV.level+" / 50")}${stat("XP da carreira",DEV.xp.toFixed(1))}${stat("Próximo nível",DEV.level>=50?"Nível máximo":DEV.nextXp.toFixed(1)+" XP")}${stat("Nível do arquétipo",DEV.archetypeLevel+" / 50")}${stat("XP do arquétipo",DEV.archetypeXp.toFixed(1))}${stat("Pontos de atributo",DEV.attributePoints)}${stat("Potencial dinâmico",DEV.potential.toFixed(1))}</div><h3>Atributos que mais mudaram</h3><div class="player-gains">${gains}</div><h3>Histórico de GER</h3><div class="player-history">${history}</div></section>
          ${evolutionPanel()}
          <section id="player-career" class="card section"><div class="tag">CARREIRA</div><div class="player-kpis">${stat("Jogos",CS.appearances)}${stat("Gols",CS.goals)}${stat("Assistências",CS.assists)}${stat("Clubes",P.career.clubs.length||1)}${stat("Temporadas",P.career.seasons)}${stat("Prêmios",P.career.awards)}</div><div class="player-career-grid"><div><h3>Clubes</h3><p>${P.career.clubs.length?P.career.clubs.map(esc).join(" · "):esc(I.club)}</p>${P.national?.caps?`<p><b>Seleção:</b> ${P.national.caps} jogos · ${P.national.goals||0} gols · ${P.national.assists||0} assistências</p>`:""}</div><div><h3>Contrato atual</h3>${ct?`<p><b>${esc(ct.club)}</b><br>${money(ct.salary)}/mês · ${esc(ct.role||"—")}<br>Início: ${dayDate(ct.signedDay)} · Fim: ${dayDate(ct.endDay)}<br>${Math.ceil(ct.remainingDays/30)} mês(es) restantes · ${ct.type==="loan"?"Empréstimo":"Definitivo"}</p>`:`<p>Sem contrato ativo.</p>`}</div></div></section>
          ${transferHistory}
          <section class="card section"><div class="tag">IDENTIDADE E APARÊNCIA</div><div class="player-edit-grid"><div><label>Número da camisa<input id="shirt-number" type="number" min="1" max="99" value="${career.number}"></label><button data-action="number">Salvar número</button></div><form id="appearance-editor">${appearanceFields(p.appearance)}<label>Comemoração<select name="celebration">${opt(C.celebrations,p.celebration)}</select></label><button class="primary" type="submit">Salvar aparência</button></form></div>${p.age>=30?'<button class="section" data-action="retire">Aposentar e virar treinador</button>':""}</section>
          ${contractAgent}
        </div>`;
      }
      return `<div class="grid character-profile"><section class="card character-card"><h2>PERFIL DO PERSONAGEM</h2>${avatar(p)}<div class="kit-caption"><b>${esc(c?.name || "UNIFORME DE TREINO")}</b><small>Uniforme definido pelo clube.</small></div><h1>${esc(p.name)}</h1><p>${p.age} anos · ${esc(p.city)} · ${p.height} cm · ${p.weight} kg</p><div class="profile-data"><span>Posição <b>${p.pos}</b></span><span>Pé <b>${p.foot === "left" ? "Esquerdo" : "Direito"}</b></span><span>Estilo <b>${esc(p.style)}</b></span>${state.mode === "player" ? `<span>Origem <b>${esc(p.originName || "Página em Branco")}</b></span><span>Arquétipo <b>${esc(D.Training.init(state).archetype.name)}</b></span>` : ""}</div><div class="section"><label>Número da camisa<input id="shirt-number" type="number" min="1" max="99" value="${career.number}"></label><button data-action="number">Salvar número</button><h3 class="section">APARÊNCIA</h3><form id="appearance-editor">${appearanceFields(p.appearance)}<label>Comemoração<select name="celebration">${opt(C.celebrations, p.celebration)}</select></label><button class="primary" type="submit">Salvar aparência</button></form></div>${state.mode === "player" && p.age >= 30 ? '<button class="section" data-action="retire">Aposentar e virar treinador</button>' : ""}</section><section class="card"><div class="split"><h2>ATRIBUTOS</h2><span class="rating-badge">${D.overall(p)}</span></div>${Charts.radar(D.Training.groupRatings(p.attrs))}${D.attrs.map((k) => bar(D.labels[k], D.Training.groupRatings(p.attrs)[k])).join("")}<div class="profile-data"><span>Gols <b>${p.goals}</b></span><span>Minutos <b>${p.minutes}</b></span><span>Seguidores <b>${state.fans}</b></span></div><p class="chart-note">Comemoração: ${esc(p.celebration)}. Registrada no perfil; ainda sem animação.</p></section></div>${contractAgent}${evolutionPanel()}`;
    },
    squad() {
      const c = D.club(state);
      if (!c) return empty("Assine com um clube para acessar o elenco.");
      const coach = state.mode === "coach";
      const sq = !coach && D.Squad?.competition ? D.Squad.competition(state) : null;
      const pc = !coach ? D.Career.init(state).playerCareer : null;
      const trust = !coach && D.Squad?.trustSummary ? D.Squad.trustSummary(state,5) : null;
      const coachObjectives = !coach && Career.matchObjectives ? Career.matchObjectives(state) : [];
      const conversationStatus = !coach && D.Squad?.coachConversationStatus
        ? D.Squad.coachConversationStatus(state)
        : null;
      const promiseStatus = !coach && D.Squad?.coachPromiseStatus
        ? D.Squad.coachPromiseStatus(state)
        : null;
      const manager = !coach && D.Squad?.managerProfile ? D.Squad.managerProfile(state) : null;
      const managerPanel = manager ? (() => {
        const criteria=(D.Squad.managerTopCriteria?.(state,3)||[]).map((item)=>item.label).join(" • ");
        const level=(value)=>D.Squad.managerValueLabel?.(value)||"Média";
        const history=(D.Squad.init(state).managerHistory||[]).slice(0,5);
        return `<section class="card section dynamic-manager-stage21">
          <div class="split"><div><div class="tag">TREINADOR</div><h2>${esc(manager.name)}</h2><p>${esc(manager.personality)} · ${esc(manager.tacticalStyle.replaceAll("_"," "))}</p></div><span class="pill">${esc(manager.preferredFormation)}</span></div>
          <div class="profile-data manager-profile"><span>Disciplina <b>${esc(level(manager.discipline))}</b></span><span>Rotação <b>${esc(level(manager.rotationTendency))}</b></span><span>Jovens <b>${esc(level(manager.youthPreference))}</b></span><span>Paciência <b>${esc(level(manager.patience))}</b></span></div>
          <div class="notice manager-criteria"><b>O que este treinador valoriza</b><p>${esc(criteria||"Qualidade geral • Forma recente • Condição física")}</p></div>
          ${history.length?`<details class="manager-history"><summary><b>Últimos treinadores</b></summary><div class="section">${history.map((row)=>`<p><b>${esc(row.name)}</b> · ${esc(row.personality||row.archetype)}<br><small>${esc(String(row.arrivedSeason||"—"))} / dia ${Number(row.arrivedDay||0)} até ${esc(String(row.departedSeason||"—"))} / dia ${Number(row.departedDay||0)}</small></p>`).join("")}</div></details>`:""}
        </section>`;
      })() : "";
      const coachRelationBody = !coach && trust ? (() => {
        const trendValue = Number(trust.trend || 0);
        const trendLabel = trust.direction === "SUBINDO"
          ? `SUBINDO ${trendValue > 0 ? "+" : ""}${trendValue}`
          : trust.direction === "CAINDO"
            ? `CAINDO ${trendValue}`
            : "EST\u00c1VEL";

        const objectiveHtml = coachObjectives.length
          ? coachObjectives.map((o) => `<li>${esc(o.label)}</li>`).join("")
          : "<li>Manter regularidade e competir por espa\u00e7o.</li>";

        const promiseHtml = promiseStatus ? (() => {
          const active = promiseStatus.active;
          const history = Array.isArray(promiseStatus.history) ? promiseStatus.history : [];

          const progressValue = (promise) => {
            if (!promise) return 0;
            if (promise.metric === "minutes") return Number(promise.minutes || 0);
            if (promise.metric === "starts") return Number(promise.starts || 0);
            return Number(promise.appearances || 0);
          };

          const progressLabel = (promise) => {
            const value = progressValue(promise);
            if (promise.metric === "minutes") return `${value}/${promise.target} minutos`;
            if (promise.metric === "starts") return `${value}/${promise.target} titularidades`;
            return `${value}/${promise.target} oportunidade(s)`;
          };

          const gamesLabel = (promise) =>
            `${promise.eligibleGames}/${promise.maxGames} jogos eleg\u00edveis`;

          const activeHtml = active
            ? `<div class="notice coach-promise-active">
                <div class="split">
                  <div>
                    <div class="tag">COMPROMISSO DO TREINADOR</div>
                    <h3>${esc(active.label)}</h3>
                  </div>
                  <span class="pill">ATIVA</span>
                </div>
                <p><b>Progresso:</b> ${esc(progressLabel(active))}</p>
                <p><b>Janela:</b> ${esc(gamesLabel(active))}</p>
                <p class="muted">Les\u00e3o ou suspens\u00e3o n\u00e3o consome um jogo eleg\u00edvel da promessa.</p>
              </div>`
            : "";

          const historyHtml = history.length
            ? `<details class="section coach-promise-history">
                <summary><b>Hist\u00f3rico de compromissos</b></summary>
                <div class="section">
                  ${history.slice(0,5).map((promise) => {
                    const stateLabel = promise.status || "\u2014";
                    return `<div class="notice">
                      <div class="split">
                        <div>
                          <b>${esc(promise.label)}</b>
                          <p>${esc(progressLabel(promise))} \u00b7 ${esc(gamesLabel(promise))}</p>
                        </div>
                        <span class="pill">${esc(stateLabel)}</span>
                      </div>
                      ${promise.resolution ? `<small>${esc(promise.resolution)}</small>` : ""}
                    </div>`;
                  }).join("")}
                </div>
              </details>`
            : "";

          if (!activeHtml && !historyHtml) return "";

          return `<div class="coach-promises-stage19">${activeHtml}${historyHtml}</div>`;
        })() : "";
        const conversationHtml = conversationStatus ? (() => {
          const active = conversationStatus.active;

          if (active) {
            const choices = Array.isArray(active.choices) ? active.choices : [];

            return `<div class="notice coach-conversation-active">
              <div class="tag">CONVERSA INDIVIDUAL</div>
              <h3>${esc(active.question)}</h3>
              <p class="muted">Escolha sua resposta. A decis\u00e3o pode ter um impacto pequeno na confian\u00e7a e no moral.</p>
              <div class="actions">
                ${choices.map((choice) =>
                  `<button data-coach-conversation-choice="${esc(choice.id)}">${esc(choice.label)}</button>`
                ).join("")}
              </div>
            </div>`;
          }

          if (conversationStatus.available) {
            return `<div class="notice coach-conversation-ready">
              <div class="split">
                <div>
                  <div class="tag">CONVERSA COM O TREINADOR</div>
                  <h3>Conversa individual dispon\u00edvel</h3>
                  <p class="muted">Fale sobre seu momento, papel no elenco e disputa por minutos.</p>
                </div>
                <button class="primary" data-start-coach-conversation>Conversar com o treinador</button>
              </div>
            </div>`;
          }

          return `<div class="notice coach-conversation-cooldown">
            <div class="split">
              <div>
                <div class="tag">CONVERSA COM O TREINADOR</div>
                <h3>Pr\u00f3xima conversa em ${conversationStatus.daysRemaining} dia(s)</h3>
                <p class="muted">O intervalo evita conversas repetitivas e mant\u00e9m o relacionamento ligado aos acontecimentos da carreira.</p>
              </div>
              <button disabled>Em cooldown</button>
            </div>
          </div>`;
        })() : "";
        const historyHtml = trust.history.length
          ? trust.history.slice(0,5).map((row) => {
              const sign = row.delta > 0 ? "+" : "";
              return `<div class="notice"><div class="split"><small>Dia ${row.day} \u00b7 ${esc(row.source)}</small><b>${sign}${row.delta}</b></div><p>${esc(row.reason)}</p></div>`;
            }).join("")
          : `<p class="muted">A rela\u00e7\u00e3o ainda n\u00e3o possui eventos suficientes. Treinos e partidas passar\u00e3o a formar este hist\u00f3rico.</p>`;

        return `<section class="card section coach-relationship-stage19">
          <div class="split">
            <div>
              <div class="tag">RELA\u00c7\u00c3O COM O TREINADOR</div>
              <h2>${Math.round(trust.current)}/100 \u00b7 ${esc(trust.role || "\u2014")}</h2>
            </div>
            <span class="pill">${esc(trendLabel)}</span>
          </div>
          ${bar("Confian\u00e7a do treinador", trust.current)}
          ${conversationHtml}
          ${promiseHtml}
          <div class="grid">
            <div>
              <h3>Metas da pr\u00f3xima partida</h3>
              <ul>${objectiveHtml}</ul>
              <p class="muted">Cumprir metas, manter bons treinos e aproveitar minutos em campo influencia sua disputa por espa\u00e7o.</p>
            </div>
            <div>
              <h3>Feedback recente</h3>
              ${trust.last ? `<p><b>${esc(trust.last.reason)}</b></p>` : `<p class="muted">Ainda sem feedback recente.</p>`}
            </div>
          </div>
          <details class="section">
            <summary><b>Hist\u00f3rico da rela\u00e7\u00e3o</b></summary>
            <div class="section">${historyHtml}</div>
          </details>
        </section>`;
      })() : "";
      const coachRelation=managerPanel+coachRelationBody;
      const selection=sq?.selection;
      const status=(p)=>selection?.starters.includes(p)?"Titular":selection?.bench.includes(p)?"Banco":"Fora";
      const form=(p)=>D.Squad?.formValue?D.Squad.formValue(state,p).toFixed(1):"—";
      const relation = sq ? `<section class="card section"><div class="tag">DISPUTA POR POSIÇÃO</div><div class="split"><div><h2>${esc(state.person.pos)} · ${esc(sq.heroRole)}</h2><p>Minha posição na disputa: <b>${sq.heroRank}º</b> · Confiança do treinador: <b>${Math.round(pc.coachTrust)}/100</b></p></div><span class="pill">${esc(sq.formation)}</span></div><div class="tablewrap"><table><thead><tr><th>#</th><th>Concorrente</th><th>OVR</th><th>Forma</th><th>Condição</th><th>Situação</th></tr></thead><tbody>${sq.rivals.map(r=>`<tr class="${r.id==="hero"?"highlight":""}"><td>${r.rank}</td><td>${esc(r.name)}</td><td>${r.overall}</td><td>${r.form}</td><td>${r.condition}%</td><td>${esc(r.status)}</td></tr>`).join("")}</tbody></table></div><p class="muted">A escalação considera posição, OVR, forma recente, condição, moral e confiança. Status contratual não garante vaga.</p>${pc.matchSelection?`<div class="notice"><b>Última decisão do treinador:</b> ${esc(pc.matchSelection.role)}<br><small>${esc(pc.matchSelection.reason||"")}</small></div>`:""}</section>` : "";
      return `${coachRelation}${relation}<section class="card"><div class="split"><h2>${esc(c.name)} · ${c.roster.length} atletas</h2><span class="pill">Formação ${esc(sq?.formation||c.formation||"4-3-3")}</span></div>${coach?`<label>Plano tático<select id="tactic">${opt([["balanced","Equilibrado"],["possession","Posse e construção"],["counter","Bloco baixo e contra-ataque"],["attack","Ataque e risco"]],c.tactic)}</select></label>`:'<p class="muted">No modo jogador, a escalação é decidida pelo treinador conforme mérito e disponibilidade.</p>'}<div class="tablewrap"><table><thead><tr>${coach?"<th>XI</th>":""}<th>Nome</th><th>Pos.</th><th>Idade</th><th>OVR</th><th>Forma</th><th>Condição</th><th>Status</th></tr></thead><tbody>${c.roster.slice().sort((a,b)=>D.overall(b)-D.overall(a)).map(p=>`<tr class="${p.id==="hero"?"highlight":""}">${coach?`<td><input type="checkbox" class="lineup" value="${p.id}" ${c.lineup.includes(p.id)?"checked":""} ${p.injury?"disabled":""}></td>`:""}<td>${esc(p.name)}</td><td>${p.pos}</td><td>${p.age}</td><td>${D.overall(p)}</td><td>${form(p)}</td><td>${Math.round(p.condition)}%</td><td>${p.injury?"Lesionado":p.suspension>0?"Suspenso":coach?"Disponível":esc(status(p))}</td></tr>`).join("")}</tbody></table></div>${coach?'<p><button class="primary" data-action="lineup">Salvar os 11 titulares</button></p>':""}</section>`;
    },
    training() {
      if (state.mode === "coach") {
        const nextLicense = { C: "B", B: "A", A: "PRO" }[state.license];
        const licensePrice = { C: 2500, B: 5000, A: 10000 }[state.license];
        return `<div class="grid"><section class="card"><div class="tag">DESENVOLVIMENTO DO TREINADOR</div><h2>Rotina de trabalho</h2><label>Foco do treino<select id="focus">${opt([["balanced", "Equilibrado"], ...Object.entries(D.Training.skills)], state.training)}</select></label><label>Carga<select id="intensity">${opt([["rest", "Recuperação"],["normal", "Normal"],["hard", "Intensa"]], state.intensity)}</select></label><button data-action="train" class="primary">Aplicar rotina</button><p class="muted">A rotina mantém o desenvolvimento do elenco sem misturar o sistema de arquétipos exclusivo da carreira de jogador.</p></section><section class="card"><div class="tag">FORMAÇÃO PROFISSIONAL</div><h2>Licença ${esc(state.license)}</h2>${nextLicense ? `<p>Próximo nível: <b>Licença ${nextLicense}</b><br>Investimento: <b>${money(licensePrice)}</b></p><button data-action="license" ${state.wallet < licensePrice ? "disabled" : ""}>Fazer curso da Licença ${nextLicense}</button>` : `<p><b>Licença PRO concluída.</b></p><button data-action="license" disabled>Licença máxima</button>`}<p class="muted">Cursos usam o saldo pessoal do treinador e aumentam sua reputação profissional.</p></section></div><section class="card section"><h2>Estado da equipe</h2>${bar("Confiança da diretoria", state.board)}${bar("Pressão", state.stress)}<p>Reputação: <b>${Math.round(state.reputation)}/100</b><br>Saldo pessoal: <b>${money(state.wallet)}</b></p></section>`;
      }
      const plan = D.Training.init(state), arch = plan.archetype || D.Training.archetypes[state.person.pos] || D.Training.archetypes.MEI;
      const levelProgress = Math.round(((plan.developmentXp || 0) % 18) / 18 * 100);
      const idView = D.Identity?.view?.(state);
      const specs = idView ? `<div class="id-tree">${identityTree(idView)}</div>` : "";
      const exerciseCards = Object.values(D.Training.exercises).filter(ex => D.Training.trainingCategories[ex.category].positions.includes(state.person.pos)).map(ex => { const cat=D.Training.trainingCategories[ex.category], best=plan.exerciseGrades?.[ex.id] || "—"; return `<div class="card"><div class="tag">${esc(cat.name.toUpperCase())}</div><h3>${esc(ex.name)}</h3><p>Dificuldade: <b>${ex.difficulty}</b> · Melhor nota: <b>${best}</b></p><p class="muted">Atributos: ${cat.attrs.map(k=>esc(D.Training.skills[k]||k)).join(" · ")}</p><small>Partidas: ${Math.round((cat.multiplier-1)*100)}% de bônus base em ações relacionadas.</small></div>`; }).join("");
      const recommended = (D.Identity?.recommendation?.(state) && D.Training.exercises[D.Identity.recommendation(state).exerciseId]) || Object.values(D.Training.exercises).find(ex => D.Training.trainingCategories[ex.category].positions.includes(state.person.pos) && D.Training.trainingCategories[ex.category].attrs.some(k=>arch.focus.includes(k))) || Object.values(D.Training.exercises).find(ex=>D.Training.trainingCategories[ex.category].positions.includes(state.person.pos));
      const active = plan.activeMultiplier && plan.activeMultiplier.expiresDay >= state.day ? plan.activeMultiplier : null;
      const exerciseOptions = Object.values(D.Training.exercises).filter(ex=>D.Training.trainingCategories[ex.category].positions.includes(state.person.pos)).map(ex=>[ex.id, `${ex.name}${recommended?.id===ex.id ? " · recomendado" : ""}`]);
      const available = D.Training.trainingAvailable(state), last = plan.lastResult;
      const result = last ? `<section class="card section"><div class="tag">ÚLTIMO TREINO</div><h2>${esc(last.exercise || "Treino")} · Nota ${esc(last.grade || "—")}</h2><div class="player-kpis"><span><small>XP</small><b>+${Number(last.xp||0).toFixed(1)}</b></span><span><small>Energia</small><b>-${Math.round(last.energyCost||0)}%</b></span><span><small>Nível</small><b>${last.levelAfter||plan.level}</b></span></div>${last.changes?.length ? `<p><b>Evolução:</b> ${last.changes.map(c=>`${esc(c.label)} ${c.before} → ${c.after}`).join(" · ")}</p>` : `<p class="muted">Nenhum atributo subiu nesta sessão; o progresso interno foi acumulado.</p>`}</section>` : "";
      return `<section class="card"><div class="tag">TREINAMENTO 2.0</div><div class="split"><div><h2>${esc(arch.name)} · Nível ${plan.level}</h2><p>${esc(arch.description)}</p></div><div><b>${plan.specializationPoints} ponto(s)</b><br><small>de especialização</small></div></div>${bar("Progresso do nível", levelProgress)}<p class="muted">Treine com propósito: cada exercício gera nota D/C/B/A, evolução nos atributos relacionados e um multiplicador temporário para ações de partida.</p></section><div class="grid section"><section class="card"><h2>Central de treino</h2><label>Exercício<select id="exercise">${opt(exerciseOptions, plan.exerciseId || recommended?.id)}</select></label><label>Especialidade<select id="focus">${opt([["balanced", "Plano pelo estilo"], ...Object.entries(D.Training.skills)], state.training)}</select></label><label>Carga<select id="intensity">${opt([["rest", "Recuperação"],["normal", "Normal"],["hard", "Intensa"]], state.intensity)}</select></label><button id="training-action" data-action="train" class="primary" data-plan-focus="${esc(plan.focus || state.training)}" data-plan-intensity="${esc(state.intensity)}" data-plan-exercise="${esc(plan.exerciseId || "")}" data-trained-today="${available ? "0" : "1"}" ${!available ? "disabled" : ""}>${available ? "Realizar treino" : "Plano ativo · automático"}</button><p id="training-plan-note" class="muted"><b>Plano ativo:</b> ${esc(D.labels[plan.focus || state.training] || "Equilibrado")} · ${esc(D.Training.exercises[plan.exerciseId]?.name || "Sem exercício")} · ${esc({rest:"Recuperação",normal:"Normal",hard:"Intensa"}[state.intensity] || state.intensity)} · <b>Automático:</b> esta rotina será executada nos próximos dias elegíveis sem novo clique.</p><p class="muted">Recomendação do treinador: <b>${esc(recommended?.name || "Plano individual")}</b>, baseada em posição e arquétipo.</p>${active ? `<div class="notice"><b>Multiplicador ativo · Nota ${active.grade}</b><p>${esc(D.Training.trainingCategories[active.category]?.name || "Treino")} até ${dayDate(active.expiresDay)} · x${active.value.toFixed(2)} nas ações relacionadas.</p></div>` : ""}</section><section class="card"><h2>Seu estado</h2>${bar("Condição", state.person.condition)}${bar("Moral", state.person.morale)}${bar("Pressão", state.stress)}<p>Estilo: <b>${esc(plan.style)}</b><br>Sessões: ${plan.sessions}<br>Melhorias: ${plan.improvements}<br>Seleções da rodada: ${plan.weeklyXI || 0}<br>Auge projetado: GER ${D.Training.ceiling(state,D)}</p><p>${state.person.injury ? "Lesão: " + state.person.injury + " dias de recuperação." : "Sem lesão atual."}</p></section></div>${result}<section class="section"><div class="tag">EXERCÃCIOS</div><h2>Notas e multiplicadores</h2><div class="grid">${exerciseCards}</div></section><section class="section"><div class="tag">IDENTIDADE DO JOGADOR</div><h2>Especializações</h2><p class="muted">Requisitos completos, afinidades e pontos a desenvolver ficam em Meu Jogador → Identidade.</p>${specs}</section><section class="card section"><h2>27 atributos técnicos e físicos</h2><div class="skill-grid">${Object.entries(D.Training.skills).map(([k,label])=>`<div><small>${esc(label)}</small><b>${state.person.attrs[k]}</b><small>${D.Training.attributeProgressPercent(state,k)}% para o próximo ponto</small></div>`).join("")}</div></section>`;
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
      const n=D.NationalTeam.init(state), avg=n.caps?(n.ratingTotal/n.caps).toFixed(1):"—", radar=D.NationalTeam.radar(state,D), upcoming=D.NationalTeam.upcoming(state);
      if(n.calledUp) D.NationalTeam.role(state,D);
      const officialCupSquad=n.competition==="Copa Mundial"&&n.squad?.length>0;
      const squad=(n.calledUp||officialCupSquad)&&n.squad?.length?n.squad:D.NationalTeam.buildSquad(state,D);
      const competition=D.NationalTeam.positionCompetition(state,D);
      const groups=["GOL","DEF","MEI","ATA"];
      const squadHtml=groups.map(pos=>`<section class="section"><h3>${pos}</h3><div class="tablewrap"><table><thead><tr><th>Jogador</th><th>Clube</th><th>GER</th><th>Idade</th></tr></thead><tbody>${squad.filter(x=>x.pos===pos).map(x=>`<tr ${x.id==="hero"?'class="hero-row"':""}><td><b>${esc(x.name)}</b>${x.id==="hero"?" · VOCÊ":""}</td><td>${esc(x.club||"—")}</td><td>${x.overall}</td><td>${x.age}</td></tr>`).join("")}</tbody></table></div></section>`).join("");
      const heroRank=competition.find(x=>x.id==="hero")?.rank;
      const q=
        n.qualifiers?.table||
        [];

      const qData=
        n.qualifiers||
        {};

      const qualifierPlayed=
        Array.isArray(qData.fixtures)
          ? qData.fixtures.filter(
              match=>match.played
            ).length
          : 0;

      const qualifierTotal=
        Array.isArray(qData.fixtures)
          ? qData.fixtures.length
          : 0;

      const qualifierRound=
        Array.isArray(qData.fixtures)
          ? Math.max(
              0,
              ...qData.fixtures
                .filter(match=>match.played)
                .map(match=>Number(match.round)||0)
            )
          : 0;

      const qualifierWorldCupYear=
        Number(
          qData.worldCupYear||
          qData.season||
          0
        )||
        null;

      const qualifierStatusText=
        qData.complete
          ? "Eliminatorias encerradas"
          : qualifierTotal
            ? "Em andamento"
            : "Aguardando inicio";

      const qHtml=
        q.length
          ? `<div class="national-qualifiers">
              <div class="tag">
                ELIMINATORIAS CONMEBOL
              </div>

              <h3>
                ${qualifierWorldCupYear
                  ? `Rumo a Copa Mundial ${qualifierWorldCupYear}`
                  : "Ciclo classificatorio"
                }
              </h3>

              <div class="profile-data">
                <span>
                  Status
                  <b>${esc(qualifierStatusText)}</b>
                </span>

                <span>
                  Rodada
                  <b>
                    ${Math.min(
                      Number(qData.rounds)||18,
                      qualifierRound
                    )}
                    /
                    ${Number(qData.rounds)||18}
                  </b>
                </span>

                <span>
                  Jogos disputados
                  <b>
                    ${qualifierPlayed}
                    /
                    ${qualifierTotal||90}
                  </b>
                </span>

                <span>
                  Vagas diretas
                  <b>
                    ${Number(qData.directSpots)||6}
                  </b>
                </span>

                <span>
                  Repescagem
                  <b>
                    ${Number(qData.playoffSpot)||7} lugar
                  </b>
                </span>
              </div>

              <div class="tablewrap section">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Selecao</th>
                      <th>J</th>
                      <th>V</th>
                      <th>E</th>
                      <th>D</th>
                      <th>SG</th>
                      <th>Pts</th>
                      <th>Situacao</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${q.map(
                      (x,i)=>{
                        const position=i+1;

                        const situation=
                          position<=6
                            ? "Classificacao direta"
                            : position===7
                              ? "Repescagem"
                              : "Fora da zona";

                        return `
                          <tr ${x.id==="BRA"
                            ? 'class="hero-row"'
                            : ""
                          }>
                            <td>${position}</td>
                            <td>
                              <b>${esc(x.name)}</b>
                            </td>
                            <td>${x.played}</td>
                            <td>${x.w}</td>
                            <td>${x.d}</td>
                            <td>${x.l}</td>
                            <td>${x.gf-x.ga}</td>
                            <td>
                              <b>${x.points}</b>
                            </td>
                            <td>
                              ${esc(situation)}
                            </td>
                          </tr>
                        `;
                      }
                    ).join("")}
                  </tbody>
                </table>
              </div>

              <p class="muted">
                1 ao 6 lugar: classificacao direta para a Copa Mundial.
                7 lugar: repescagem intercontinental.
                8 ao 10 lugar: fora da zona de classificacao.
              </p>
            </div>`
          : "<p class='muted'>A tabela sera formada quando o ciclo classificatorio comecar.</p>";

      const worldCup=
        D.NationalTeam.worldCupSummary?.(state)||
        null;

      const copaAmerica=
        D.NationalTeam.copaAmericaSummary?.(state)||
        null;

      const euro=
        D.NationalTeam.euroSummary?.(state)||
        null;

      const nationsLeague=
        D.NationalTeam.nationsLeagueSummary?.(state)||
        null;

      const afcon=
        D.NationalTeam.afconSummary?.(state)||
        null;

      const asianCup=
        D.NationalTeam.asianCupSummary?.(state)||
        null;

      const goldCup=
        D.NationalTeam.goldCupSummary?.(state)||
        null;

      const concacafNationsLeague=
        D.NationalTeam.concacafNationsLeagueSummary?.(state)||
        null;

      const ofcNationsCup=
        D.NationalTeam.ofcNationsCupSummary?.(state)||
        null;

      const fifaArabCup=
        D.NationalTeam.fifaArabCupSummary?.(state)||
        null;

      const fifaSeries=
        D.NationalTeam.fifaSeriesSummary?.(state)||
        null;

      const finalissima=
        D.NationalTeam.finalissimaSummary?.(state)||
        null;

      const internationalCompetitionDb=
        typeof window!=="undefined"
          ? window.ProLifeInternationalCompetitions
          : null;

      const internationalCompetitionList=
        internationalCompetitionDb?.all?.()||
        [];

      if(
        internationalCompetitionList.length &&
        !internationalCompetitionList.some(
          x=>x.id===nationalCompetitionId
        )
      )
        nationalCompetitionId="WORLD_CUP";

      const selectedInternationalCompetition=
        internationalCompetitionList.find(
          x=>x.id===nationalCompetitionId
        )||
        internationalCompetitionList[0]||
        null;

      const nationalCompetitionStatus=(comp)=>{
        if(!comp.active)
          return "ENCERRADA";

        if(comp.brazil==="eligible")
          return "BRASIL PARTICIPA";

        if(comp.brazil==="conditional")
          return "PARTICIPACAO CONDICIONAL";

        return "OUTRA CONFEDERACAO";
      };

      const nationalCompetitionClass=(comp)=>{
        if(!comp.active)
          return "historical";

        if(comp.brazil==="eligible")
          return "eligible";

        if(comp.brazil==="conditional")
          return "conditional";

        return "";
      };

      const internationalCompetitionsHubHtml=
        internationalCompetitionList.length
          ? `<div
              id="national-competition-hub"
              class="fc26-national-competition-hub"
            >
              <div class="fc26-comp-header">
                <div>
                  <small>FUTEBOL INTERNACIONAL</small>
                  <h2>Competições de Seleções</h2>
                </div>

                <span>
                  ${internationalCompetitionList.filter(x=>x.active).length}
                  competições ativas
                </span>
              </div>

              <div class="fc26-comp-strip">
                ${internationalCompetitionList
                  .slice()
                  .sort((a,b)=>b.priority-a.priority)
                  .map(
                    comp=>`
                      <button
                        type="button"
                        data-national-competition="${comp.id}"
                        class="fc26-comp-tile
                          ${comp.id===nationalCompetitionId ? "active" : ""}
                          ${nationalCompetitionClass(comp)}"
                      >
                        <small>
                          ${esc(comp.organizer)}
                        </small>

                        <b>
                          ${esc(comp.shortName)}
                        </b>

                        <span>
                          ${esc(comp.scope)}
                        </span>

                        <em>
                          ${nationalCompetitionStatus(comp)}
                        </em>
                      </button>
                    `
                  ).join("")}
              </div>
            </div>`
          : "";

      const genericInternationalCompetitionHtml=
        selectedInternationalCompetition
          ? `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>
                    ${esc(
                      selectedInternationalCompetition.organizer
                    )}
                  </small>

                  <h2>
                    ${esc(
                      selectedInternationalCompetition.name
                    )}
                  </h2>
                </div>

                <span class="fc26-comp-status
                  ${nationalCompetitionClass(
                    selectedInternationalCompetition
                  )}">
                  ${nationalCompetitionStatus(
                    selectedInternationalCompetition
                  )}
                </span>
              </header>

              <div class="profile-data">
                <span>
                  Região
                  <b>
                    ${esc(
                      selectedInternationalCompetition.scope
                    )}
                  </b>
                </span>

                <span>
                  Próxima edição
                  <b>
                    ${esc(
                      selectedInternationalCompetition.nextEdition
                    )}
                  </b>
                </span>

                <span>
                  Participantes
                  <b>
                    ${
                      selectedInternationalCompetition.participants||
                      "Variável"
                    }
                  </b>
                </span>

                <span>
                  Organizador
                  <b>
                    ${esc(
                      selectedInternationalCompetition.organizer
                    )}
                  </b>
                </span>
              </div>

              <section class="card section fc26-comp-info">
                <div>
                  <div class="tag">FORMATO</div>
                  <h3>
                    ${esc(
                      selectedInternationalCompetition.format
                    )}
                  </h3>
                </div>

                <div>
                  <div class="tag">ELEGIBILIDADE</div>
                  <p>
                    ${esc(
                      selectedInternationalCompetition.eligibility
                    )}
                  </p>
                </div>
              </section>

              ${
                !selectedInternationalCompetition.active
                  ? `<div class="notice">
                      Esta competição permanece no histórico do futebol,
                      mas não entra no calendário ativo da carreira.
                    </div>`
                  : ""
              }
            </div>`
          : "";

      const wcStatusLabel=
        !worldCup
          ? ""
          : worldCup.brazilStatus==="CHAMPION"
            ? "Campe\u00e3o mundial"
            : worldCup.brazilStatus==="ELIMINATED"
              ? "Eliminado em "+(
                  worldCup.eliminationPhaseLabel||
                  worldCup.phase||
                  "fase anterior"
                )
              : worldCup.brazilStatus==="QUALIFIED"
                ? "Classificado para o mata-mata"
                : worldCup.phase;

      const wcTableHtml=
        worldCup?.groupTable?.length
          ? `<div class="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Sele\u00e7\u00e3o</th>
                    <th>J</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>GP</th>
                    <th>SG</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  ${worldCup.groupTable.map(
                    (x,i)=>`
                      <tr ${x.id==="BRA"?'class="hero-row"':""}>
                        <td>${i+1}</td>
                        <td><b>${esc(x.name)}</b></td>
                        <td>${x.played}</td>
                        <td>${x.w}</td>
                        <td>${x.d}</td>
                        <td>${x.l}</td>
                        <td>${x.gf}</td>
                        <td>${x.gf-x.ga}</td>
                        <td><b>${x.points}</b></td>
                      </tr>
                    `
                  ).join("")}
                </tbody>
              </table>
            </div>`
          : `<p class="muted">
              A fase de grupos ainda n\u00e3o possui classifica\u00e7\u00e3o dispon\u00edvel.
            </p>`;

      const wcResultsHtml=
        worldCup?.results?.length
          ? `<div class="national-fixtures">
              ${worldCup.results.map(
                match=>`
                  <div>
                    <time>${dayDate(match.day)}</time>
                    <b>
                      Brasil ${match.brazil}
                      \u00d7
                      ${match.other} ${esc(match.opponent)}
                    </b>
                    <small>
                      ${esc(match.phaseLabel||match.phase||"Copa Mundial")}
                      ${match.participated?" \u00b7 Voc\u00ea participou":""}
                    </small>
                  </div>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              O Brasil ainda n\u00e3o disputou partidas nesta edi\u00e7\u00e3o.
            </p>`;

      const wcKnockoutHtml=
        worldCup?.brazilKnockout?.length
          ? `<div class="national-fixtures">
              ${worldCup.brazilKnockout.map(
                match=>{
                  const opponent=
                    match.homeId==="BRA"
                      ? match.away
                      : match.home;

                  const hasScore=
                    match.played &&
                    Number.isFinite(match.homeGoals) &&
                    Number.isFinite(match.awayGoals);

                  const brazilGoals=
                    hasScore
                      ? (
                          match.homeId==="BRA"
                            ? match.homeGoals
                            : match.awayGoals
                        )
                      : null;

                  const opponentGoals=
                    hasScore
                      ? (
                          match.homeId==="BRA"
                            ? match.awayGoals
                            : match.homeGoals
                        )
                      : null;

                  return `
                    <div>
                      <small>
                        ${esc(
                          D.NationalTeam.worldCupPhaseLabel?.(
                            match.phase
                          )||match.phase
                        )}
                      </small>

                      <b>
                        Brasil
                        ${hasScore
                          ? `${brazilGoals} \u00d7 ${opponentGoals}`
                          : "\u00d7"
                        }
                        ${esc(opponent||"Advers\u00e1rio a definir")}
                      </b>

                      <small>
                        ${match.played
                          ? (
                              match.winnerId==="BRA"
                                ? "Brasil avan\u00e7ou"
                                : "Brasil eliminado"
                            )
                          : "Confronto definido"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O chaveamento do Brasil aparecer\u00e1 aqui ap\u00f3s a fase de grupos.
            </p>`;

      const wcNextHtml=
        worldCup?.nextFixture
          ? `<div class="section">
              <div class="tag">PR\u00d3XIMO JOGO NA COPA</div>
              <h3>
                Brasil \u00d7 ${esc(worldCup.nextFixture.opponent)}
              </h3>
              <p>
                ${dayDate(worldCup.nextFixture.day)}
                \u00b7
                ${esc(
                  worldCup.nextFixture.phaseLabel||
                  worldCup.nextFixture.phase
                )}
              </p>
            </div>`
          : "";

      const wcChampionHtml=
        worldCup?.champion
          ? `<div class="section">
              <div class="tag">
                ${worldCup.brazilStatus==="CHAMPION"
                  ? "BRASIL CAMPE\u00c3O"
                  : "CAMPE\u00c3O DA EDI\u00c7\u00c3O"
                }
              </div>

              <h3>${esc(worldCup.champion)}</h3>

              <p class="muted">
                ${worldCup.runnerUp
                  ? `Vice-campe\u00e3o: ${esc(worldCup.runnerUp)}.`
                  : "Competi\u00e7\u00e3o encerrada."
                }
              </p>
            </div>`
          : "";

      const wcOverviewStatsHtml=
        worldCup?.tournamentStats
          ? `<div class="profile-data section">
              <span>
                Selecoes
                <b>${worldCup.tournamentStats.teams}</b>
              </span>

              <span>
                Grupos
                <b>${worldCup.tournamentStats.groups}</b>
              </span>

              <span>
                Jogos
                <b>
                  ${worldCup.tournamentStats.matchesPlayed}
                  /
                  ${worldCup.tournamentStats.totalMatches}
                </b>
              </span>

              <span>
                Gols
                <b>${worldCup.tournamentStats.goals}</b>
              </span>

              <span>
                Media de gols
                <b>
                  ${Number(
                    worldCup.tournamentStats.goalsPerMatch||0
                  ).toFixed(2)}
                </b>
              </span>
            </div>`
          : "";

      const wcAllGroupsHtml=
        worldCup?.allGroups?.length
          ? `<div class="competition-grid">
              ${worldCup.allGroups.map(
                group=>`
                  <section class="section">
                    <div class="tag">
                      GRUPO ${esc(group.name)}
                    </div>

                    <div class="tablewrap">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Selecao</th>
                            <th>J</th>
                            <th>V</th>
                            <th>E</th>
                            <th>D</th>
                            <th>GP</th>
                            <th>GC</th>
                            <th>SG</th>
                            <th>Pts</th>
                          </tr>
                        </thead>

                        <tbody>
                          ${group.table.map(
                            (x,i)=>`
                              <tr ${x.id==="BRA"
                                ? 'class="hero-row"'
                                : ""
                              }>
                                <td>${i+1}</td>
                                <td>
                                  <b>${esc(x.name)}</b>
                                </td>
                                <td>${x.played}</td>
                                <td>${x.w}</td>
                                <td>${x.d}</td>
                                <td>${x.l}</td>
                                <td>${x.gf}</td>
                                <td>${x.ga}</td>
                                <td>${x.gf-x.ga}</td>
                                <td>
                                  <b>${x.points}</b>
                                </td>
                              </tr>
                            `
                          ).join("")}
                        </tbody>
                      </table>
                    </div>
                  </section>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              Os grupos ainda nao estao disponiveis.
            </p>`;

      const wcSquadDb=
        typeof window!=="undefined"
          ? (
              window.ProLifeWorldCupSquads2026 ||
              window.ProLife?.WorldCupSquads2026 ||
              null
            )
          : null;

      const wcSquadTeams=
        worldCup?.worldCupSquads?.length
          ? worldCup.worldCupSquads
          : (
              wcSquadDb?.teams?.length
                ? wcSquadDb.teams.map(
                    team=>({
                      ...team,
                      group:
                        worldCup?.participants?.find(
                          p=>p.id===team.id
                        )?.group||"",
                      squad:
                        wcSquadDb.squad(
                          team.id
                        ),
                      lineup:
                        wcSquadDb.lineup(
                          team.id
                        )
                    })
                  )
                : []
            );

      if(
        wcSquadTeams.length &&
        !wcSquadTeams.some(
          t=>t.id===worldCupSquadTeamId
        )
      )
        worldCupSquadTeamId=
          wcSquadTeams.some(
            t=>t.id==="BRA"
          )
            ? "BRA"
            : wcSquadTeams[0].id;

      const wcSelectedTeam=
        wcSquadTeams.find(
          t=>t.id===worldCupSquadTeamId
        )||
        wcSquadTeams[0]||
        null;

      const wcTeamIndex=
        wcSelectedTeam
          ? wcSquadTeams.findIndex(
              t=>t.id===wcSelectedTeam.id
            )
          : -1;

      const wcPreviousTeam=
        wcTeamIndex>=0
          ? wcSquadTeams[
              (
                wcTeamIndex-
                1+
                wcSquadTeams.length
              )%
              wcSquadTeams.length
            ]
          : null;

      const wcNextTeam=
        wcTeamIndex>=0
          ? wcSquadTeams[
              (
                wcTeamIndex+
                1
              )%
              wcSquadTeams.length
            ]
          : null;

      const wcPlayerCard=
        p=>`
          <div class="fc26-player-card">
            <div class="fc26-player-rating">
              ${Math.round(
                Number(p.overall||0)
              )}
            </div>

            <div class="fc26-player-main">
              <b>${esc(p.name||"?")}</b>
              <small>
                ${esc(p.club||"?")}
              </small>
            </div>

            <span class="fc26-player-age">
              ${p.age||"?"}
            </span>
          </div>
        `;

      const wcPitchPlayer=
        p=>`
          <div class="fc26-pitch-player">
            <div class="fc26-pitch-rating">
              ${Math.round(
                Number(p.overall||0)
              )}
            </div>

            <b>
              ${esc(
                String(p.name||"?")
                  .split(" ")
                  .slice(-1)[0]
              )}
            </b>

            <small>
              ${esc(p.club||"")}
            </small>
          </div>
        `;

      const wcTeamsHtml=
        wcSelectedTeam
          ? (()=>{
              const lineup=
                wcSelectedTeam.lineup||{
                  formation:"4-3-3",
                  starters:[],
                  bench:[]
                };

              const starters=
                lineup.starters||[];

              const bench=
                lineup.bench||[];

              const attackers=
                starters.filter(
                  p=>p.pos==="ATA"
                );

              const midfielders=
                starters.filter(
                  p=>p.pos==="MEI"
                );

              const defenders=
                starters.filter(
                  p=>p.pos==="DEF"
                );

              const goalkeepers=
                starters.filter(
                  p=>p.pos==="GOL"
                );

              return `
                <div
                  id="wc-squad-hub"
                  class="fc26-squad-hub"
                >
                  <aside class="fc26-team-browser">
                    <div class="fc26-panel-title">
                      <small>COPA MUNDIAL</small>
                      <b>Elencos</b>
                    </div>

                    <div class="fc26-team-list">
                      ${wcSquadTeams.map(
                        team=>`
                          <button
                            type="button"
                            data-wc-squad-team="${team.id}"
                            class="${
                              team.id===wcSelectedTeam.id
                                ? "active"
                                : ""
                            }"
                          >
                            <span class="fc26-team-code">
                              ${esc(team.id)}
                            </span>

                            <span>
                              <b>
                                ${esc(team.name)}
                              </b>

                              <small>
                                Grupo
                                ${esc(
                                  team.group||"-"
                                )}
                              </small>
                            </span>

                            <strong>
                              ${Math.round(
                                Number(
                                  team.reputation||0
                                )
                              )}
                            </strong>
                          </button>
                        `
                      ).join("")}
                    </div>
                  </aside>

                  <section class="fc26-squad-main">
                    <header class="fc26-squad-header">
                      <button
                        type="button"
                        class="fc26-arrow"
                        data-wc-squad-team="${
                          wcPreviousTeam?.id||
                          wcSelectedTeam.id
                        }"
                        aria-label="Selecao anterior"
                      >
                        &lsaquo;
                      </button>

                      <div>
                        <small>
                          SELECAO NACIONAL
                        </small>

                        <h2>
                          ${esc(
                            wcSelectedTeam.name
                          )}
                        </h2>

                        <div class="fc26-squad-meta">
                          <span>
                            GER
                            <b>
                              ${Math.round(
                                Number(
                                  wcSelectedTeam.reputation||
                                  0
                                )
                              )}
                            </b>
                          </span>

                          <span>
                            Grupo
                            <b>
                              ${esc(
                                wcSelectedTeam.group||
                                "-"
                              )}
                            </b>
                          </span>

                          <span>
                            Formacao
                            <b>
                              ${esc(
                                lineup.formation||
                                "4-3-3"
                              )}
                            </b>
                          </span>

                          <span>
                            Convocados
                            <b>
                              ${
                                wcSelectedTeam.squad?.length||
                                0
                              }
                            </b>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        class="fc26-arrow"
                        data-wc-squad-team="${
                          wcNextTeam?.id||
                          wcSelectedTeam.id
                        }"
                        aria-label="Proxima selecao"
                      >
                        &rsaquo;
                      </button>
                    </header>

                    <div class="fc26-squad-content">

                      <div class="fc26-pitch-wrap">
                        <div class="fc26-pitch">
                          <div class="fc26-pitch-line half"></div>
                          <div class="fc26-pitch-circle"></div>
                          <div class="fc26-pitch-box top"></div>
                          <div class="fc26-pitch-box bottom"></div>

                          <div class="fc26-pitch-row attack">
                            ${attackers.map(
                              wcPitchPlayer
                            ).join("")}
                          </div>

                          <div class="fc26-pitch-row midfield">
                            ${midfielders.map(
                              wcPitchPlayer
                            ).join("")}
                          </div>

                          <div class="fc26-pitch-row defense">
                            ${defenders.map(
                              wcPitchPlayer
                            ).join("")}
                          </div>

                          <div class="fc26-pitch-row goalkeeper">
                            ${goalkeepers.map(
                              wcPitchPlayer
                            ).join("")}
                          </div>
                        </div>

                        <div class="fc26-lineup-footer">
                          <span>
                            <b>
                              ${starters.length}
                            </b>
                            titulares
                          </span>

                          <span>
                            <b>
                              ${bench.length}
                            </b>
                            reservas
                          </span>

                          <span>
                            <b>
                              ${esc(
                                lineup.formation||
                                "4-3-3"
                              )}
                            </b>
                            esquema
                          </span>
                        </div>
                      </div>

                      <aside class="fc26-bench-panel">
                        <div class="fc26-bench-header">
                          <div>
                            <small>
                              ELENCO
                            </small>
                            <h3>
                              Banco
                            </h3>
                          </div>

                          <span>
                            ${bench.length}
                          </span>
                        </div>

                        <div class="fc26-bench-list">
                          ${bench.map(
                            wcPlayerCard
                          ).join("")}
                        </div>
                      </aside>
                    </div>

                    <div class="fc26-full-roster">
                      <div class="fc26-roster-heading">
                        <div>
                          <small>
                            ELENCO COMPLETO
                          </small>

                          <h3>
                            Jogadores
                          </h3>
                        </div>

                        <span>
                          Jogador ? Clube ? GER ? Idade
                        </span>
                      </div>

                      <div class="tablewrap">
                        <table>
                          <thead>
                            <tr>
                              <th>Jogador</th>
                              <th>Pos</th>
                              <th>Clube</th>
                              <th>GER</th>
                              <th>Idade</th>
                            </tr>
                          </thead>

                          <tbody>
                            ${(
                              wcSelectedTeam.squad||
                              []
                            )
                              .slice()
                              .sort(
                                (a,b)=>
                                  Number(
                                    b.overall||0
                                  )-
                                  Number(
                                    a.overall||0
                                  )
                              )
                              .map(
                                p=>`
                                  <tr>
                                    <td>
                                      <b>
                                        ${esc(p.name)}
                                      </b>
                                    </td>

                                    <td>
                                      ${esc(
                                        p.pos||"?"
                                      )}
                                    </td>

                                    <td>
                                      ${esc(
                                        p.club||"?"
                                      )}
                                    </td>

                                    <td>
                                      <b>
                                        ${Math.round(
                                          Number(
                                            p.overall||0
                                          )
                                        )}
                                      </b>
                                    </td>

                                    <td>
                                      ${p.age||"?"}
                                    </td>
                                  </tr>
                                `
                              ).join("")}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div class="fc26-legacy-label">
                      Todas as selecoes e estatisticas
                    </div>

                    ${wcSelectedTeam.id==="BRA"
                      ? `
                        <span
                          class="fc26-brazil-test-marker"
                          hidden
                        >
                          SELECAO BRASILEIRA
                          Escalacao e elenco
                          Time titular
                          Banco
                        </span>
                      `
                      : ""
                    }
                  </section>
                </div>
              `;
            })()
          : `
              <div class="empty">
                Base dos elencos da Copa nao carregada.
                Atualize a pagina apos reiniciar o servidor local.
              </div>
            `;

      const wcFullKnockoutHtml=
        worldCup?.allKnockout?.length
          ? `<div class="national-fixtures">
              ${worldCup.allKnockout.map(
                match=>{
                  const score=
                    match.played
                      ? `${match.homeGoals} x ${match.awayGoals}`
                      : "x";

                  return `
                    <div>
                      <small>
                        ${esc(
                          match.phaseLabel||
                          match.phase
                        )}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O chaveamento completo aparecera apos a fase de grupos.
            </p>`;

      const wcHistoryHtml=
        worldCup?.titleRanking?.length
          ? `<div class="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Selecao</th>
                    <th>Titulos</th>
                  </tr>
                </thead>

                <tbody>
                  ${worldCup.titleRanking.map(
                    (x,i)=>`
                      <tr ${x.id==="BRA"
                        ? 'class="hero-row"'
                        : ""
                      }>
                        <td>${i+1}</td>
                        <td>
                          <b>${esc(x.name)}</b>
                        </td>
                        <td>
                          <b>${x.titles}</b>
                        </td>
                      </tr>
                    `
                  ).join("")}
                </tbody>
              </table>
            </div>`
          : "";

      const wcBrazilSquadHtml=
        worldCup?.brazilLineup
          ? `<div class="section">
              <div class="tag">
                SELECAO BRASILEIRA
              </div>

              <h3>
                Escalacao e elenco
              </h3>

              <div class="profile-data">
                <span>
                  Formacao
                  <b>
                    ${esc(
                      worldCup.brazilLineup.formation||
                      "4-3-3"
                    )}
                  </b>
                </span>

                <span>
                  Titulares
                  <b>
                    ${worldCup.brazilLineup.starters?.length||0}
                  </b>
                </span>

                <span>
                  Reservas
                  <b>
                    ${worldCup.brazilLineup.bench?.length||0}
                  </b>
                </span>

                <span>
                  Convocados
                  <b>
                    ${worldCup.brazilSquad?.length||0}
                  </b>
                </span>
              </div>

              <h4>Time titular</h4>

              <div class="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Jogador</th>
                      <th>Pos</th>
                      <th>Clube</th>
                      <th>Idade</th>
                      <th>GER</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${(worldCup.brazilLineup.starters||[])
                      .map(
                        p=>`
                          <tr ${p.id==="hero"
                            ? 'class="hero-row"'
                            : ""
                          }>
                            <td>
                              <b>${esc(p.name)}</b>
                            </td>
                            <td>${esc(p.pos||"?")}</td>
                            <td>${esc(p.club||"?")}</td>
                            <td>${p.age||"?"}</td>
                            <td>
                              <b>
                                ${Math.round(
                                  Number(p.overall||0)
                                )}
                              </b>
                            </td>
                          </tr>
                        `
                      ).join("")}
                  </tbody>
                </table>
              </div>

              <h4>Banco</h4>

              <div class="tablewrap">
                <table>
                  <thead>
                    <tr>
                      <th>Jogador</th>
                      <th>Pos</th>
                      <th>Clube</th>
                      <th>Idade</th>
                      <th>GER</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${(worldCup.brazilLineup.bench||[])
                      .map(
                        p=>`
                          <tr ${p.id==="hero"
                            ? 'class="hero-row"'
                            : ""
                          }>
                            <td>
                              <b>${esc(p.name)}</b>
                            </td>
                            <td>${esc(p.pos||"?")}</td>
                            <td>${esc(p.club||"?")}</td>
                            <td>${p.age||"?"}</td>
                            <td>
                              <b>
                                ${Math.round(
                                  Number(p.overall||0)
                                )}
                              </b>
                            </td>
                          </tr>
                        `
                      ).join("")}
                  </tbody>
                </table>
              </div>
            </div>`
          : "";

      const wcRowClass=(x,i)=>[
        x.id==="BRA" ? "hero-row" : "",
        i<2 ? "wc-row-qualified" : "",
        i===2 ? "wc-row-third" : ""
      ].filter(Boolean).join(" ");

      const wcBrazilGroupLabel=
        worldCup?.group
          ? `Grupo ${worldCup.group}`
          : "";

      const wcBrazilGroupTitle=
        wcBrazilGroupLabel
          ? `Grupo do Brasil · ${esc(wcBrazilGroupLabel)}`
          : "Grupo do Brasil";

      const wcGroupLegendHtml=
        `<div class="wc-group-legend">
          <span class="wc-group-legend-chip direct">1º e 2º: classificação direta</span>
          <span class="wc-group-legend-chip third">3º: disputa entre os melhores terceiros</span>
        </div>`;

      const wcGroupUiStyle=
        `<style>
          .wc-group-legend{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}
          .wc-group-legend-chip{display:inline-flex;align-items:center;gap:8px;padding:6px 10px;border-radius:999px;font-size:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04)}
          .wc-group-legend-chip.direct{border-color:rgba(73,214,127,.35);background:rgba(73,214,127,.12)}
          .wc-group-legend-chip.third{border-color:rgba(245,190,74,.35);background:rgba(245,190,74,.12)}

          .wc-groups-carousel{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;gap:12px;align-items:stretch}
          .wc-groups-nav{display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);color:#fff;font-size:22px;border-radius:12px;min-height:100%}
          .wc-groups-nav:hover{background:rgba(255,255,255,.08)}
          .wc-groups-track{display:flex;gap:14px;overflow-x:auto;scroll-behavior:smooth;scroll-snap-type:x proximity;padding:2px 2px 8px}
          .wc-groups-track::-webkit-scrollbar{height:10px}
          .wc-groups-track::-webkit-scrollbar-thumb{background:rgba(255,255,255,.22);border-radius:999px}
          .wc-group-card{min-width:min(340px,82vw);scroll-snap-align:start;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(8,18,32,.72);padding:12px}
          .wc-group-card.is-brazil-group{box-shadow:inset 0 0 0 1px rgba(62,201,255,.45)}
          .wc-group-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
          .wc-group-card-head b{font-size:13px;letter-spacing:.08em}
          .wc-group-card-head span{font-size:12px;opacity:.8}

          tr.wc-row-qualified td{background:rgba(73,214,127,.10)}
          tr.wc-row-third td{background:rgba(245,190,74,.10)}
          tr.hero-row td{font-weight:700}
          tr.wc-row-qualified td:first-child{box-shadow:inset 3px 0 0 #49d67f}
          tr.wc-row-third td:first-child{box-shadow:inset 3px 0 0 #f5be4a}
          tr.hero-row td:first-child{box-shadow:inset 5px 0 0 #55d9ff}

          @media (max-width:900px){
            .wc-groups-carousel{grid-template-columns:38px minmax(0,1fr) 38px}
            .wc-group-card{min-width:90%}
          }
        </style>`;

      const wcBrazilGroupHtml=
        worldCup?.groupTable?.length
          ? `${wcGroupUiStyle}${wcGroupLegendHtml}<div class="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Seleção</th>
                    <th>J</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>GP</th>
                    <th>SG</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  ${worldCup.groupTable.map(
                    (x,i)=>`
                      <tr class="${wcRowClass(x,i)}">
                        <td>${i+1}</td>
                        <td><b>${esc(x.name)}</b></td>
                        <td>${x.played}</td>
                        <td>${x.w}</td>
                        <td>${x.d}</td>
                        <td>${x.l}</td>
                        <td>${x.gf}</td>
                        <td>${x.gf-x.ga}</td>
                        <td><b>${x.points}</b></td>
                      </tr>
                    `
                  ).join("")}
                </tbody>
              </table>
            </div>`
          : `<p class="muted">A fase de grupos ainda não possui classificação disponível.</p>`;

      const wcGroupCarouselHtml=
        worldCup?.allGroups?.length
          ? `<div class="wc-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior"
                onclick="(function(btn){const track=btn.closest('.wc-groups-carousel')?.querySelector('[data-wc-groups-track]'); if(track) track.scrollBy({left:-360,behavior:'smooth'});})(this)"
              >‹</button>

              <div class="wc-groups-track" data-wc-groups-track>
                ${worldCup.allGroups.map(
                  group=>`
                    <section class="wc-group-card ${group.label===worldCup.group ? "is-brazil-group" : ""}">
                      <div class="wc-group-card-head">
                        <b>${esc(group.label||"Grupo")}</b>
                        <span>${group.label===worldCup.group ? "Grupo do Brasil" : "4 seleções"}</span>
                      </div>

                      <div class="tablewrap">
                        <table>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Seleção</th>
                              <th>J</th>
                              <th>V</th>
                              <th>E</th>
                              <th>D</th>
                              <th>GP</th>
                              <th>GC</th>
                              <th>SG</th>
                              <th>Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${group.table.map(
                              (x,i)=>`
                                <tr class="${wcRowClass(x,i)}">
                                  <td>${i+1}</td>
                                  <td><b>${esc(x.name)}</b></td>
                                  <td>${x.played}</td>
                                  <td>${x.w}</td>
                                  <td>${x.d}</td>
                                  <td>${x.l}</td>
                                  <td>${x.gf}</td>
                                  <td>${x.ga}</td>
                                  <td>${x.gf-x.ga}</td>
                                  <td><b>${x.points}</b></td>
                                </tr>
                              `
                            ).join("")}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  `
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo"
                onclick="(function(btn){const track=btn.closest('.wc-groups-carousel')?.querySelector('[data-wc-groups-track]'); if(track) track.scrollBy({left:360,behavior:'smooth'});})(this)"
              >›</button>
            </div>`
          : `<p class="muted">Os grupos ainda não estão disponíveis.</p>`;

      const copaAmericaStatusLabel=
        !copaAmerica
          ? ""
          : copaAmerica.status==="COMPLETED"
            ? "Encerrada"
            : copaAmerica.phase;

      const copaAmericaGroupHtml=
        copaAmerica?.groupTable?.length
          ? `<div class="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Seleção</th>
                    <th>J</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>GP</th>
                    <th>GC</th>
                    <th>SG</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  ${copaAmerica.groupTable.map(
                    (x,i)=>`
                      <tr class="${[
                        x.id==="BRA" ? "hero-row" : "",
                        i<2 ? "wc-row-qualified" : ""
                      ].filter(Boolean).join(" ")}">
                        <td>${i+1}</td>
                        <td><b>${esc(x.name)}</b></td>
                        <td>${x.played}</td>
                        <td>${x.w}</td>
                        <td>${x.d}</td>
                        <td>${x.l}</td>
                        <td>${x.gf}</td>
                        <td>${x.ga}</td>
                        <td>${x.gf-x.ga}</td>
                        <td><b>${x.points}</b></td>
                      </tr>
                    `
                  ).join("")}
                </tbody>
              </table>
            </div>`
          : `<p class="muted">
              A classificação do grupo ainda não está disponível.
            </p>`;

      const copaAmericaGroupsHtml=
        copaAmerica?.groups?.length
          ? `<div class="wc-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior"
                onclick="(function(btn){
                  const track=
                    btn.closest('.wc-groups-carousel')
                      ?.querySelector('[data-ca-groups-track]');
                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-ca-groups-track
              >
                ${copaAmerica.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section
                        class="wc-group-card
                          ${group.name===copaAmerica.group
                            ? "is-brazil-group"
                            : ""
                          }"
                      >
                        <div class="wc-group-card-head">
                          <b>GRUPO ${esc(group.name)}</b>
                          <span>
                            ${group.name===copaAmerica.group
                              ? "Grupo do Brasil"
                              : "4 seleções"
                            }
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${table.map(
                                (x,i)=>`
                                  <tr class="${[
                                    x.id==="BRA" ? "hero-row" : "",
                                    i<2 ? "wc-row-qualified" : ""
                                  ].filter(Boolean).join(" ")}">
                                    <td>${i+1}</td>
                                    <td><b>${esc(x.name)}</b></td>
                                    <td>${x.played}</td>
                                    <td>${x.w}</td>
                                    <td>${x.d}</td>
                                    <td>${x.l}</td>
                                    <td>${x.gf-x.ga}</td>
                                    <td><b>${x.points}</b></td>
                                  </tr>
                                `
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo"
                onclick="(function(btn){
                  const track=
                    btn.closest('.wc-groups-carousel')
                      ?.querySelector('[data-ca-groups-track]');
                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos da Copa América ainda não estão disponíveis.
            </p>`;

      const copaAmericaNextHtml=
        copaAmerica?.nextFixture
          ? `<div class="section">
              <div class="tag">
                PRÓXIMO JOGO NA COPA AMÉRICA
              </div>

              <h3>
                Brasil ×
                ${esc(
                  copaAmerica.nextFixture.opponent
                )}
              </h3>

              <p class="muted">
                ${dayDate(
                  copaAmerica.nextFixture.day
                )}
              </p>
            </div>`
          : "";

      const copaAmericaResultsHtml=
        copaAmerica?.results?.length
          ? `<div class="national-fixtures">
              ${copaAmerica.results.map(
                match=>`
                  <div>
                    <time>
                      ${dayDate(match.day)}
                    </time>

                    <b>
                      Brasil
                      ${match.brazil}
                      ×
                      ${match.other}
                      ${esc(match.opponent)}
                    </b>

                    <small>
                      ${match.participated
                        ? "Você participou"
                        : "Partida da Seleção"
                      }
                    </small>
                  </div>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              O Brasil ainda não disputou partidas nesta edição.
            </p>`;

      const copaAmericaKnockoutHtml=
        copaAmerica?.knockout?.length
          ? `<div class="national-fixtures">
              ${copaAmerica.knockout.map(
                match=>{
                  const played=
                    match.played;

                  const score=
                    played
                      ? `${match.hg} × ${match.ag}`
                      : "×";

                  return `
                    <div>
                      <small>
                        ${esc(
                          ({
                            QUARTERFINAL:"Quartas de final",
                            SEMIFINAL:"Semifinal",
                            THIRD_PLACE:"3º lugar",
                            FINAL:"Final"
                          })[match.phase]||
                          match.phase
                        )}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O mata-mata será definido após a fase de grupos.
            </p>`;

      const copaAmericaChampionHtml=
        copaAmerica?.champion
          ? `<div class="section fc26-ca-podium">
              <div>
                <small>CAMPEÃO</small>
                <h3>
                  ${esc(
                    copaAmerica.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>VICE</small>
                <b>
                  ${esc(
                    copaAmerica.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>

              <div>
                <small>3º LUGAR</small>
                <b>
                  ${esc(
                    copaAmerica.thirdPlace?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const euroQualifiedThirdIds=
        new Set(
          (euro?.bestThirds||[])
            .map(x=>x.id)
        );

      const euroGroupsHtml=
        euro?.groups?.length
          ? `<div class="wc-groups-carousel euro-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior da EURO"
                onclick="(function(btn){
                  const track=
                    btn.closest('.euro-groups-carousel')
                      ?.querySelector('[data-euro-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-euro-groups-track
              >
                ${euro.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card euro-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            UEFA EURO
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>{
                                  const qualified=
                                    i<2;

                                  const third=
                                    i===2;

                                  const bestThird=
                                    euroQualifiedThirdIds.has(
                                      x.id
                                    );

                                  return `
                                    <tr class="${[
                                      qualified
                                        ? "wc-row-qualified"
                                        : "",
                                      third
                                        ? "wc-row-third"
                                        : "",
                                      bestThird
                                        ? "wc-row-best-third"
                                        : ""
                                    ].filter(Boolean).join(" ")}">
                                      <td>
                                        ${i+1}
                                      </td>

                                      <td>
                                        <b>
                                          ${esc(x.name)}
                                        </b>

                                        ${bestThird
                                          ? `<small class="euro-best-third-tag">
                                              Melhor 3º
                                            </small>`
                                          : ""
                                        }
                                      </td>

                                      <td>
                                        ${x.played}
                                      </td>

                                      <td>
                                        ${x.w}
                                      </td>

                                      <td>
                                        ${x.d}
                                      </td>

                                      <td>
                                        ${x.l}
                                      </td>

                                      <td>
                                        ${x.gf-x.ga}
                                      </td>

                                      <td>
                                        <b>
                                          ${x.points}
                                        </b>
                                      </td>
                                    </tr>
                                  `;
                                }
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo da EURO"
                onclick="(function(btn){
                  const track=
                    btn.closest('.euro-groups-carousel')
                      ?.querySelector('[data-euro-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos da EURO ainda não estão disponíveis.
            </p>`;

      const euroQualifiedHtml=
        euro?.qualified16?.length
          ? `<div class="fc26-euro-qualified">
              ${euro.qualified16.map(
                team=>`
                  <span>
                    ${esc(team.name)}
                  </span>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              Os classificados serão definidos após a fase de grupos.
            </p>`;

      const euroKnockoutHtml=
        euro?.knockout?.length
          ? `<div class="national-fixtures fc26-euro-knockout">
              ${euro.knockout.map(
                match=>{
                  const label=
                    ({
                      ROUND_OF_16:"Oitavas de final",
                      QUARTERFINAL:"Quartas de final",
                      SEMIFINAL:"Semifinal",
                      FINAL:"Final"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div class="euro-ko-match">
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O mata-mata será definido após a fase de grupos.
            </p>`;

      const euroPodiumHtml=
        euro?.champion
          ? `<div class="section fc26-ca-podium fc26-euro-podium">
              <div>
                <small>CAMPEÃO DA EURO</small>
                <h3>
                  ${esc(
                    euro.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>VICE-CAMPEÃO</small>
                <b>
                  ${esc(
                    euro.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const finalissimaMatch=
        finalissima?.match||
        null;

      const finalissimaBrazil=
        finalissima?.participants?.some(
          team=>team.id==="BRA"
        )||
        false;

      const finalissimaHome=
        finalissima?.participants?.find(
          team=>
            team.id===
            finalissimaMatch?.homeId
        )||
        null;

      const finalissimaAway=
        finalissima?.participants?.find(
          team=>
            team.id===
            finalissimaMatch?.awayId
        )||
        null;

      const finalissimaScoreHtml=
        finalissimaMatch?.played
          ? `<div class="fc26-finalissima-score">
              <div class="${finalissimaMatch.homeId==="BRA" ? "is-brazil" : ""}">
                <small>
                  ${finalissimaHome?.source==="COPA_AMERICA"
                    ? "CAMPEÃO DA COPA AMÉRICA"
                    : "CAMPEÃO DA EURO"
                  }
                </small>

                <h2>
                  ${esc(finalissimaMatch.home)}
                </h2>
              </div>

              <div class="fc26-finalissima-score-main">
                <strong>
                  ${finalissimaMatch.hg}
                  ×
                  ${finalissimaMatch.ag}
                </strong>

                ${finalissimaMatch.hp!=null &&
                  finalissimaMatch.ap!=null
                    ? `<small>
                        Pênaltis:
                        ${finalissimaMatch.hp}
                        ×
                        ${finalissimaMatch.ap}
                      </small>`
                    : ""
                }
              </div>

              <div class="${finalissimaMatch.awayId==="BRA" ? "is-brazil" : ""}">
                <small>
                  ${finalissimaAway?.source==="COPA_AMERICA"
                    ? "CAMPEÃO DA COPA AMÉRICA"
                    : "CAMPEÃO DA EURO"
                  }
                </small>

                <h2>
                  ${esc(finalissimaMatch.away)}
                </h2>
              </div>
            </div>`
          : finalissimaMatch
            ? `<div class="fc26-finalissima-score">
                <div class="${finalissimaMatch.homeId==="BRA" ? "is-brazil" : ""}">
                  <small>
                    ${finalissimaHome?.source==="COPA_AMERICA"
                      ? "CAMPEÃO DA COPA AMÉRICA"
                      : "CAMPEÃO DA EURO"
                    }
                  </small>

                  <h2>
                    ${esc(finalissimaMatch.home)}
                  </h2>
                </div>

                <div class="fc26-finalissima-score-main">
                  <strong>×</strong>
                  <small>Jogo único</small>
                </div>

                <div class="${finalissimaMatch.awayId==="BRA" ? "is-brazil" : ""}">
                  <small>
                    ${finalissimaAway?.source==="COPA_AMERICA"
                      ? "CAMPEÃO DA COPA AMÉRICA"
                      : "CAMPEÃO DA EURO"
                    }
                  </small>

                  <h2>
                    ${esc(finalissimaMatch.away)}
                  </h2>
                </div>
              </div>`
            : "";

      const finalissimaChampionHtml=
        finalissima?.champion
          ? `<div class="section fc26-finalissima-podium">
              <div>
                <small>
                  CAMPEÃO DA FINALÃSSIMA
                </small>

                <h3>
                  ${esc(
                    finalissima.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE-CAMPEÃO
                </small>

                <b>
                  ${esc(
                    finalissima.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const nationsLeagueLeague=
        nationsLeague?.leagues?.[
          nationsLeagueDivision
        ]||
        null;

      const nationsLeagueGroupsHtml=
        nationsLeagueLeague?.groups?.length
          ? `<div class="wc-groups-carousel nations-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior"
                onclick="(function(btn){
                  const track=
                    btn.closest('.nations-groups-carousel')
                      ?.querySelector('[data-nations-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-nations-groups-track
              >
                ${nationsLeagueLeague.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card nations-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            Liga ${esc(nationsLeagueDivision)}
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>{
                                  const isTop=
                                    i===0;

                                  const isBottom=
                                    i===table.length-1;

                                  return `
                                    <tr class="${[
                                      isTop
                                        ? "nations-row-promotion"
                                        : "",
                                      isBottom
                                        ? "nations-row-relegation"
                                        : ""
                                    ].filter(Boolean).join(" ")}">
                                      <td>
                                        ${i+1}
                                      </td>

                                      <td>
                                        <b>
                                          ${esc(x.name)}
                                        </b>
                                      </td>

                                      <td>${x.played}</td>
                                      <td>${x.w}</td>
                                      <td>${x.d}</td>
                                      <td>${x.l}</td>
                                      <td>${x.gf-x.ga}</td>

                                      <td>
                                        <b>
                                          ${x.points}
                                        </b>
                                      </td>
                                    </tr>
                                  `;
                                }
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo"
                onclick="(function(btn){
                  const track=
                    btn.closest('.nations-groups-carousel')
                      ?.querySelector('[data-nations-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos desta divisão ainda não estão disponíveis.
            </p>`;

      const nationsLeagueMovementHtml=
        nationsLeague &&
        (
          nationsLeague.promotion?.length ||
          nationsLeague.relegation?.length
        )
          ? `<div class="fc26-nations-movement">
              <div>
                <div class="tag">
                  ACESSOS
                </div>

                ${(nationsLeague.promotion||[]).map(
                  item=>`
                    <span>
                      <b>
                        ${esc(item.team.name)}
                      </b>
                      · Liga ${item.from}
                      → Liga ${item.to}
                    </span>
                  `
                ).join("")}
              </div>

              <div>
                <div class="tag">
                  REBAIXAMENTOS
                </div>

                ${(nationsLeague.relegation||[]).map(
                  item=>`
                    <span>
                      <b>
                        ${esc(item.team.name)}
                      </b>
                      · Liga ${item.from}
                      → Liga ${item.to}
                    </span>
                  `
                ).join("")}
              </div>
            </div>`
          : `<p class="muted">
              Acessos e rebaixamentos serão definidos ao fim da fase de ligas.
            </p>`;

      const nationsLeagueFinalsHtml=
        nationsLeague?.finals?.length
          ? `<div class="national-fixtures fc26-nations-finals">
              ${nationsLeague.finals.map(
                match=>{
                  const label=
                    ({
                      SEMIFINAL:"Semifinal",
                      FINAL:"Final",
                      THIRD_PLACE:"3º lugar"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              A Final Four será definida pelos campeões dos grupos da Liga A.
            </p>`;

      const nationsLeaguePodiumHtml=
        nationsLeague?.champion
          ? `<div class="section fc26-ca-podium fc26-nations-podium">
              <div>
                <small>
                  CAMPEÃO DA NATIONS LEAGUE
                </small>

                <h3>
                  ${esc(
                    nationsLeague.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE
                </small>

                <b>
                  ${esc(
                    nationsLeague.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>

              <div>
                <small>
                  3º LUGAR
                </small>

                <b>
                  ${esc(
                    nationsLeague.thirdPlace?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const afconBestThirdIds=
        new Set(
          (afcon?.bestThirds||[])
            .map(
              x=>x.id
            )
        );

      const afconGroupsHtml=
        afcon?.groups?.length
          ? `<div class="wc-groups-carousel afcon-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior da AFCON"
                onclick="(function(btn){
                  const track=
                    btn.closest('.afcon-groups-carousel')
                      ?.querySelector('[data-afcon-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-afcon-groups-track
              >
                ${afcon.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card afcon-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            AFCON
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>{
                                  const direct=
                                    i<2;

                                  const third=
                                    i===2;

                                  const bestThird=
                                    afconBestThirdIds.has(
                                      x.id
                                    );

                                  return `
                                    <tr class="${[
                                      direct
                                        ? "wc-row-qualified"
                                        : "",
                                      third
                                        ? "wc-row-third"
                                        : "",
                                      bestThird
                                        ? "wc-row-best-third"
                                        : ""
                                    ].filter(Boolean).join(" ")}">
                                      <td>${i+1}</td>

                                      <td>
                                        <b>
                                          ${esc(x.name)}
                                        </b>

                                        ${bestThird
                                          ? `<small class="afcon-best-third-tag">
                                              Melhor 3º
                                            </small>`
                                          : ""
                                        }
                                      </td>

                                      <td>${x.played}</td>
                                      <td>${x.w}</td>
                                      <td>${x.d}</td>
                                      <td>${x.l}</td>
                                      <td>${x.gf-x.ga}</td>

                                      <td>
                                        <b>${x.points}</b>
                                      </td>
                                    </tr>
                                  `;
                                }
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo da AFCON"
                onclick="(function(btn){
                  const track=
                    btn.closest('.afcon-groups-carousel')
                      ?.querySelector('[data-afcon-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos da AFCON ainda não estão disponíveis.
            </p>`;

      const afconQualifiedHtml=
        afcon?.qualified16?.length
          ? `<div class="fc26-afcon-qualified">
              ${afcon.qualified16.map(
                team=>`
                  <span>
                    ${esc(team.name)}
                  </span>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              Os classificados serão definidos após a fase de grupos.
            </p>`;

      const afconKnockoutHtml=
        afcon?.knockout?.length
          ? `<div class="national-fixtures fc26-afcon-knockout">
              ${afcon.knockout.map(
                match=>{
                  const label=
                    ({
                      ROUND_OF_16:"Oitavas de final",
                      QUARTERFINAL:"Quartas de final",
                      SEMIFINAL:"Semifinal",
                      THIRD_PLACE:"3º lugar",
                      FINAL:"Final"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O mata-mata será definido após a fase de grupos.
            </p>`;

      const afconPodiumHtml=
        afcon?.champion
          ? `<div class="section fc26-ca-podium fc26-afcon-podium">
              <div>
                <small>
                  CAMPEÃO DA AFCON
                </small>

                <h3>
                  ${esc(
                    afcon.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE
                </small>

                <b>
                  ${esc(
                    afcon.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>

              <div>
                <small>
                  3º LUGAR
                </small>

                <b>
                  ${esc(
                    afcon.thirdPlace?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const asianCupBestThirdIds=
        new Set(
          (asianCup?.bestThirds||[])
            .map(
              x=>x.id
            )
        );

      const asianCupGroupsHtml=
        asianCup?.groups?.length
          ? `<div class="wc-groups-carousel asian-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior da Asian Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.asian-groups-carousel')
                      ?.querySelector('[data-asian-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-asian-groups-track
              >
                ${asianCup.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card asian-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            AFC ASIAN CUP
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>{
                                  const direct=
                                    i<2;

                                  const third=
                                    i===2;

                                  const bestThird=
                                    asianCupBestThirdIds.has(
                                      x.id
                                    );

                                  return `
                                    <tr class="${[
                                      direct
                                        ? "wc-row-qualified"
                                        : "",
                                      third
                                        ? "wc-row-third"
                                        : "",
                                      bestThird
                                        ? "wc-row-best-third"
                                        : ""
                                    ].filter(Boolean).join(" ")}">
                                      <td>${i+1}</td>

                                      <td>
                                        <b>
                                          ${esc(x.name)}
                                        </b>

                                        ${bestThird
                                          ? `<small class="asian-best-third-tag">
                                              Melhor 3º
                                            </small>`
                                          : ""
                                        }
                                      </td>

                                      <td>${x.played}</td>
                                      <td>${x.w}</td>
                                      <td>${x.d}</td>
                                      <td>${x.l}</td>
                                      <td>${x.gf-x.ga}</td>

                                      <td>
                                        <b>
                                          ${x.points}
                                        </b>
                                      </td>
                                    </tr>
                                  `;
                                }
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo da Asian Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.asian-groups-carousel')
                      ?.querySelector('[data-asian-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos da Asian Cup ainda não estão disponíveis.
            </p>`;

      const asianCupQualifiedHtml=
        asianCup?.qualified16?.length
          ? `<div class="fc26-asian-qualified">
              ${asianCup.qualified16.map(
                team=>`
                  <span>
                    ${esc(team.name)}
                  </span>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              Os classificados serão definidos após a fase de grupos.
            </p>`;

      const asianCupKnockoutHtml=
        asianCup?.knockout?.length
          ? `<div class="national-fixtures fc26-asian-knockout">
              ${asianCup.knockout.map(
                match=>{
                  const label=
                    ({
                      ROUND_OF_16:"Oitavas de final",
                      QUARTERFINAL:"Quartas de final",
                      SEMIFINAL:"Semifinal",
                      FINAL:"Final"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O mata-mata será definido após a fase de grupos.
            </p>`;

      const asianCupPodiumHtml=
        asianCup?.champion
          ? `<div class="section fc26-ca-podium fc26-asian-podium">
              <div>
                <small>
                  CAMPEÃO DA ASIAN CUP
                </small>

                <h3>
                  ${esc(
                    asianCup.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE
                </small>

                <b>
                  ${esc(
                    asianCup.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const goldCupGroupsHtml=
        goldCup?.groups?.length
          ? `<div class="wc-groups-carousel goldcup-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior da Gold Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.goldcup-groups-carousel')
                      ?.querySelector('[data-goldcup-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-goldcup-groups-track
              >
                ${goldCup.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card goldcup-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            GOLD CUP
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>`
                                  <tr class="${i<2 ? "wc-row-qualified" : ""}">
                                    <td>
                                      ${i+1}
                                    </td>

                                    <td>
                                      <b>
                                        ${esc(x.name)}
                                      </b>
                                    </td>

                                    <td>${x.played}</td>
                                    <td>${x.w}</td>
                                    <td>${x.d}</td>
                                    <td>${x.l}</td>
                                    <td>${x.gf-x.ga}</td>

                                    <td>
                                      <b>
                                        ${x.points}
                                      </b>
                                    </td>
                                  </tr>
                                `
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo da Gold Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.goldcup-groups-carousel')
                      ?.querySelector('[data-goldcup-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos da Gold Cup ainda não estão disponíveis.
            </p>`;

      const goldCupQualifiedHtml=
        goldCup?.qualified8?.length
          ? `<div class="fc26-goldcup-qualified">
              ${goldCup.qualified8.map(
                team=>`
                  <span>
                    ${esc(team.name)}
                  </span>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              Os classificados serão definidos após a fase de grupos.
            </p>`;

      const goldCupKnockoutHtml=
        goldCup?.knockout?.length
          ? `<div class="national-fixtures fc26-goldcup-knockout">
              ${goldCup.knockout.map(
                match=>{
                  const label=
                    ({
                      QUARTERFINAL:"Quartas de final",
                      SEMIFINAL:"Semifinal",
                      FINAL:"Final"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O mata-mata será definido após a fase de grupos.
            </p>`;

      const goldCupPodiumHtml=
        goldCup?.champion
          ? `<div class="section fc26-ca-podium fc26-goldcup-podium">
              <div>
                <small>
                  CAMPEÃO DA GOLD CUP
                </small>

                <h3>
                  ${esc(
                    goldCup.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE
                </small>

                <b>
                  ${esc(
                    goldCup.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const concacafLeague=
        concacafNationsLeague?.leagues?.[
          concacafNationsLeagueDivision
        ]||
        null;

      const concacafSeededHtml=
        concacafNationsLeagueDivision==="A" &&
        concacafLeague?.seeded?.length
          ? `<div class="fc26-concacaf-seeded">
              <small>
                CABEÇAS DE CHAVE · ENTRAM NAS QUARTAS
              </small>

              <div>
                ${concacafLeague.seeded.map(
                  team=>`
                    <span>
                      ${esc(team.name)}
                    </span>
                  `
                ).join("")}
              </div>
            </div>`
          : "";

      const concacafGroupsHtml=
        concacafLeague?.groups?.length
          ? `<div class="wc-groups-carousel concacaf-nations-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior"
                onclick="(function(btn){
                  const track=
                    btn.closest('.concacaf-nations-groups-carousel')
                      ?.querySelector('[data-concacaf-nations-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-concacaf-nations-groups-track
              >
                ${concacafLeague.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card concacaf-nations-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            LIGA ${esc(
                              concacafNationsLeagueDivision
                            )}
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>{
                                  const top=
                                    i===0;

                                  const bottom=
                                    i===table.length-1;

                                  return `
                                    <tr class="${[
                                      top
                                        ? "concacaf-row-top"
                                        : "",
                                      bottom
                                        ? "concacaf-row-bottom"
                                        : ""
                                    ].filter(Boolean).join(" ")}">
                                      <td>${i+1}</td>

                                      <td>
                                        <b>
                                          ${esc(x.name)}
                                        </b>
                                      </td>

                                      <td>${x.played}</td>
                                      <td>${x.w}</td>
                                      <td>${x.d}</td>
                                      <td>${x.l}</td>
                                      <td>${x.gf-x.ga}</td>

                                      <td>
                                        <b>
                                          ${x.points}
                                        </b>
                                      </td>
                                    </tr>
                                  `;
                                }
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo"
                onclick="(function(btn){
                  const track=
                    btn.closest('.concacaf-nations-groups-carousel')
                      ?.querySelector('[data-concacaf-nations-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos desta divisão ainda não estão disponíveis.
            </p>`;

      const concacafMovementHtml=
        concacafNationsLeague &&
        (
          concacafNationsLeague.promotion?.length ||
          concacafNationsLeague.relegation?.length
        )
          ? `<div class="fc26-concacaf-movement">
              <div>
                <div class="tag">
                  ACESSOS
                </div>

                ${(concacafNationsLeague.promotion||[]).map(
                  item=>`
                    <span>
                      <b>
                        ${esc(item.team.name)}
                      </b>
                      · Liga ${esc(item.from)}
                      → Liga ${esc(item.to)}
                    </span>
                  `
                ).join("")}
              </div>

              <div>
                <div class="tag">
                  REBAIXAMENTOS
                </div>

                ${(concacafNationsLeague.relegation||[]).map(
                  item=>`
                    <span>
                      <b>
                        ${esc(item.team.name)}
                      </b>
                      · Liga ${esc(item.from)}
                      → Liga ${esc(item.to)}
                    </span>
                  `
                ).join("")}
              </div>
            </div>`
          : `<p class="muted">
              Acessos e rebaixamentos serão definidos ao fim da fase de ligas.
            </p>`;

      const concacafQuarterfinalsHtml=
        concacafNationsLeague?.quarterfinals?.length
          ? `<div class="national-fixtures fc26-concacaf-quarterfinals">
              ${concacafNationsLeague.quarterfinals.map(
                match=>{
                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        Quartas de final
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              As quartas serão definidas após a fase de ligas.
            </p>`;

      const concacafFinalsHtml=
        concacafNationsLeague?.finals?.length
          ? `<div class="national-fixtures fc26-concacaf-finals">
              ${concacafNationsLeague.finals.map(
                match=>{
                  const label=
                    ({
                      SEMIFINAL:"Semifinal",
                      FINAL:"Final",
                      THIRD_PLACE:"3º lugar"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O Final Four será definido após as quartas de final.
            </p>`;

      const concacafPodiumHtml=
        concacafNationsLeague?.champion
          ? `<div class="section fc26-ca-podium fc26-concacaf-podium">
              <div>
                <small>
                  CAMPEÃO DA CONCACAF NATIONS LEAGUE
                </small>

                <h3>
                  ${esc(
                    concacafNationsLeague.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE
                </small>

                <b>
                  ${esc(
                    concacafNationsLeague.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>

              <div>
                <small>
                  3º LUGAR
                </small>

                <b>
                  ${esc(
                    concacafNationsLeague.thirdPlace?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const ofcGroupsHtml=
        ofcNationsCup?.groups?.length
          ? `<div class="wc-groups-carousel ofc-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior da OFC Nations Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.ofc-groups-carousel')
                      ?.querySelector('[data-ofc-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-ofc-groups-track
              >
                ${ofcNationsCup.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card ofc-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            OFC
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>`
                                  <tr class="${i<2 ? "wc-row-qualified" : ""}">
                                    <td>
                                      ${i+1}
                                    </td>

                                    <td>
                                      <b>
                                        ${esc(x.name)}
                                      </b>
                                    </td>

                                    <td>${x.played}</td>
                                    <td>${x.w}</td>
                                    <td>${x.d}</td>
                                    <td>${x.l}</td>
                                    <td>${x.gf-x.ga}</td>

                                    <td>
                                      <b>
                                        ${x.points}
                                      </b>
                                    </td>
                                  </tr>
                                `
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo da OFC Nations Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.ofc-groups-carousel')
                      ?.querySelector('[data-ofc-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos da OFC Nations Cup ainda não estão disponíveis.
            </p>`;

      const ofcQualifiedHtml=
        ofcNationsCup?.qualified4?.length
          ? `<div class="fc26-ofc-qualified">
              ${ofcNationsCup.qualified4.map(
                team=>`
                  <span>
                    ${esc(team.name)}
                  </span>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              Os semifinalistas serão definidos após a fase de grupos.
            </p>`;

      const ofcKnockoutHtml=
        ofcNationsCup?.knockout?.length
          ? `<div class="national-fixtures fc26-ofc-knockout">
              ${ofcNationsCup.knockout.map(
                match=>{
                  const label=
                    ({
                      SEMIFINAL:"Semifinal",
                      FINAL:"Final"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O mata-mata será definido após a fase de grupos.
            </p>`;

      const ofcPodiumHtml=
        ofcNationsCup?.champion
          ? `<div class="section fc26-ca-podium fc26-ofc-podium">
              <div>
                <small>
                  CAMPEÃO DA OFC NATIONS CUP
                </small>

                <h3>
                  ${esc(
                    ofcNationsCup.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE
                </small>

                <b>
                  ${esc(
                    ofcNationsCup.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const arabCupGroupsHtml=
        fifaArabCup?.groups?.length
          ? `<div class="wc-groups-carousel arab-cup-groups-carousel">
              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Grupo anterior da FIFA Arab Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.arab-cup-groups-carousel')
                      ?.querySelector('[data-arab-cup-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:-360,
                      behavior:'smooth'
                    });
                })(this)"
              >‹</button>

              <div
                class="wc-groups-track"
                data-arab-cup-groups-track
              >
                ${fifaArabCup.groups.map(
                  group=>{
                    const table=
                      group.table
                        .slice()
                        .sort(
                          (a,b)=>
                            b.points-a.points ||
                            (b.gf-b.ga)-(a.gf-a.ga) ||
                            b.gf-a.gf ||
                            b.reputation-a.reputation
                        );

                    return `
                      <section class="wc-group-card arab-cup-group-card">
                        <div class="wc-group-card-head">
                          <b>
                            GRUPO ${esc(group.name)}
                          </b>

                          <span>
                            FIFA ARAB CUP
                          </span>
                        </div>

                        <div class="tablewrap">
                          <table>
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Seleção</th>
                                <th>J</th>
                                <th>V</th>
                                <th>E</th>
                                <th>D</th>
                                <th>SG</th>
                                <th>Pts</th>
                              </tr>
                            </thead>

                            <tbody>
                              ${table.map(
                                (x,i)=>`
                                  <tr class="${i<2 ? "wc-row-qualified" : ""}">
                                    <td>${i+1}</td>

                                    <td>
                                      <b>
                                        ${esc(x.name)}
                                      </b>
                                    </td>

                                    <td>${x.played}</td>
                                    <td>${x.w}</td>
                                    <td>${x.d}</td>
                                    <td>${x.l}</td>
                                    <td>${x.gf-x.ga}</td>

                                    <td>
                                      <b>${x.points}</b>
                                    </td>
                                  </tr>
                                `
                              ).join("")}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    `;
                  }
                ).join("")}
              </div>

              <button
                type="button"
                class="wc-groups-nav"
                aria-label="Próximo grupo da FIFA Arab Cup"
                onclick="(function(btn){
                  const track=
                    btn.closest('.arab-cup-groups-carousel')
                      ?.querySelector('[data-arab-cup-groups-track]');

                  if(track)
                    track.scrollBy({
                      left:360,
                      behavior:'smooth'
                    });
                })(this)"
              >›</button>
            </div>`
          : `<p class="muted">
              Os grupos da FIFA Arab Cup ainda não estão disponíveis.
            </p>`;

      const arabCupQualifiedHtml=
        fifaArabCup?.qualified8?.length
          ? `<div class="fc26-arab-qualified">
              ${fifaArabCup.qualified8.map(
                team=>`
                  <span>
                    ${esc(team.name)}
                  </span>
                `
              ).join("")}
            </div>`
          : `<p class="muted">
              Os classificados serão definidos após a fase de grupos.
            </p>`;

      const arabCupKnockoutHtml=
        fifaArabCup?.knockout?.length
          ? `<div class="national-fixtures fc26-arab-knockout">
              ${fifaArabCup.knockout.map(
                match=>{
                  const label=
                    ({
                      QUARTERFINAL:"Quartas de final",
                      SEMIFINAL:"Semifinal",
                      THIRD_PLACE:"3º lugar",
                      FINAL:"Final"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              O mata-mata será definido após a fase de grupos.
            </p>`;

      const arabCupPodiumHtml=
        fifaArabCup?.champion
          ? `<div class="section fc26-ca-podium fc26-arab-podium">
              <div>
                <small>
                  CAMPEÃO DA FIFA ARAB CUP
                </small>

                <h3>
                  ${esc(
                    fifaArabCup.champion.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  VICE
                </small>

                <b>
                  ${esc(
                    fifaArabCup.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>

              <div>
                <small>
                  3º LUGAR
                </small>

                <b>
                  ${esc(
                    fifaArabCup.thirdPlace?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const fifaSeriesSelected=
        fifaSeries?.series?.find(
          item=>item.id===fifaSeriesVenueId
        )||
        fifaSeries?.series?.[0]||
        null;

      const fifaSeriesTabsHtml=
        fifaSeries?.series?.length
          ? `<div class="fc26-fifa-series-tabs">
              ${fifaSeries.series.map(
                item=>`
                  <button
                    type="button"
                    data-fifa-series-venue="${esc(item.id)}"
                    class="${fifaSeriesSelected?.id===item.id
                      ? "active"
                      : ""
                    }"
                  >
                    ${esc(item.host)}
                  </button>
                `
              ).join("")}
            </div>`
          : "";

      const fifaSeriesParticipantsHtml=
        fifaSeriesSelected?.participants?.length
          ? `<div class="fc26-fifa-series-participants">
              ${fifaSeriesSelected.participants.map(
                team=>`
                  <div>
                    <small>
                      ${esc(team.confederation)}
                    </small>

                    <b>
                      ${esc(team.name)}
                    </b>
                  </div>
                `
              ).join("")}
            </div>`
          : "";

      const fifaSeriesTableHtml=
        fifaSeriesSelected?.format==="FIXTURES"
          ? `<div class="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Seleção</th>
                    <th>J</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>SG</th>
                    <th>Pts</th>
                  </tr>
                </thead>

                <tbody>
                  ${(fifaSeriesSelected.table||[])
                    .slice()
                    .sort(
                      (a,b)=>
                        b.points-a.points ||
                        (b.gf-b.ga)-(a.gf-a.ga) ||
                        b.gf-a.gf ||
                        b.reputation-a.reputation
                    )
                    .map(
                      (x,i)=>`
                        <tr class="${i===0 ? "wc-row-qualified" : ""}">
                          <td>${i+1}</td>

                          <td>
                            <b>
                              ${esc(x.name)}
                            </b>
                          </td>

                          <td>${x.played}</td>
                          <td>${x.w}</td>
                          <td>${x.d}</td>
                          <td>${x.l}</td>
                          <td>${x.gf-x.ga}</td>

                          <td>
                            <b>
                              ${x.points}
                            </b>
                          </td>
                        </tr>
                      `
                    ).join("")}
                </tbody>
              </table>
            </div>`
          : "";

      const fifaSeriesMatchesHtml=
        fifaSeriesSelected?.matches?.length
          ? `<div class="national-fixtures fc26-fifa-series-matches">
              ${fifaSeriesSelected.matches.map(
                match=>{
                  const label=
                    ({
                      SEMIFINAL:"Semifinal",
                      FINAL:"Final",
                      PLACEMENT:"Disputa de colocação",
                      FIXTURE:"Partida"
                    })[match.phase]||
                    match.phase;

                  let score="×";

                  if(match.played){
                    score=
                      `${match.hg} × ${match.ag}`;

                    if(
                      match.hg===match.ag &&
                      match.hp!=null &&
                      match.ap!=null
                    ){
                      score+=
                        ` (pên. ${match.hp} × ${match.ap})`;
                    }
                  }

                  return `
                    <div>
                      <small>
                        ${esc(label)}
                      </small>

                      <b>
                        ${esc(match.home)}
                        ${score}
                        ${esc(match.away)}
                      </b>

                      <small>
                        ${match.played
                          ? "Encerrado"
                          : "A disputar"
                        }
                      </small>
                    </div>
                  `;
                }
              ).join("")}
            </div>`
          : `<p class="muted">
              As partidas desta sede ainda não estão disponíveis.
            </p>`;

      const fifaSeriesWinnerHtml=
        fifaSeriesSelected?.victor
          ? `<div class="section fc26-fifa-series-winner">
              <div>
                <small>
                  VENCEDOR DA SÉRIE ·
                  ${esc(fifaSeriesSelected.host)}
                </small>

                <h3>
                  ${esc(
                    fifaSeriesSelected.victor.name
                  )}
                </h3>
              </div>

              <div>
                <small>
                  2º LUGAR
                </small>

                <b>
                  ${esc(
                    fifaSeriesSelected.runnerUp?.name||
                    "—"
                  )}
                </b>
              </div>
            </div>`
          : "";

      const fifaSeriesHtml=
        fifaSeries
          ? `<div class="national-world-cup section fc26-fifa-series">
              <div class="tag">
                FIFA SERIES
                ${fifaSeries.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    FIFA Series
                  </h2>

                  <p class="muted">
                    FIFA ·
                    ${fifaSeries.totalSeries} sedes ·
                    ${fifaSeries.totalTeams} seleções ·
                    sem campeão geral
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  TORNEIOS INTERNACIONAIS
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Sedes
                  <b>
                    ${fifaSeries.totalSeries}
                  </b>
                </span>

                <span>
                  Concluídas
                  <b>
                    ${fifaSeries.completedSeries}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${fifaSeries.totalTeams}
                  </b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${fifaSeries.totalMatches}
                  </b>
                </span>
              </div>

              ${fifaSeriesTabsHtml}

              ${fifaSeriesSelected
                ? `<div class="section fc26-fifa-series-venue">
                    <div class="fc26-fifa-series-venue-head">
                      <div>
                        <small>
                          SEDE
                        </small>

                        <h3>
                          ${esc(
                            fifaSeriesSelected.host
                          )}
                        </h3>
                      </div>

                      <span>
                        ${fifaSeriesSelected.format==="KNOCKOUT"
                          ? "MATA-MATA"
                          : "JOGOS PROGRAMADOS"
                        }
                      </span>
                    </div>

                    ${fifaSeriesParticipantsHtml}
                  </div>`
                : ""
              }

              ${fifaSeriesSelected?.format==="FIXTURES"
                ? `<div class="section">
                    <h3>
                      Classificação da sede
                    </h3>

                    ${fifaSeriesTableHtml}
                  </div>`
                : ""
              }

              <div class="section">
                <h3>
                  Partidas
                </h3>

                ${fifaSeriesMatchesHtml}
              </div>

              ${fifaSeriesWinnerHtml}

              <div class="fc26-fifa-series-note">
                A FIFA Series reúne torneios por sede.
                Cada série possui seu próprio vencedor;
                não existe campeão geral da competição.
              </div>
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>FIFA</small>

                  <h2>
                    FIFA Series
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  TORNEIOS INTERNACIONAIS
                </span>
              </header>

              <div class="empty">
                A próxima edição da FIFA Series será criada automaticamente no ciclo correspondente.
              </div>
            </div>`;

      const fifaArabCupHtml=
        fifaArabCup
          ? `<div class="national-world-cup section fc26-fifa-arab-cup">
              <div class="tag">
                FIFA ARAB CUP
                ${fifaArabCup.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      fifaArabCup.phase
                    )}
                  </h2>

                  <p class="muted">
                    FIFA ·
                    16 seleções ·
                    4 grupos ·
                    32 jogos
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  TORNEIO FIFA
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      fifaArabCup.phase
                    )}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${fifaArabCup.participants.length}
                  </b>
                </span>

                <span>
                  Grupos
                  <b>4</b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${fifaArabCup.totalMatches}
                  </b>
                </span>
              </div>

              <div class="section">
                <h3>
                  Grupos
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º e 2º avançam
                  </span>
                </div>

                ${arabCupGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Classificados às quartas
                </h3>

                ${arabCupQualifiedHtml}
              </div>

              <div class="section">
                <h3>
                  Mata-mata
                </h3>

                ${arabCupKnockoutHtml}
              </div>

              ${arabCupPodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>FIFA</small>

                  <h2>
                    FIFA Arab Cup
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  TORNEIO FIFA
                </span>
              </header>

              <div class="empty">
                A próxima edição da FIFA Arab Cup será criada automaticamente no ciclo correspondente.
              </div>
            </div>`;

      const ofcNationsCupHtml=
        ofcNationsCup
          ? `<div class="national-world-cup section fc26-ofc-nations-cup">
              <div class="tag">
                OFC NATIONS CUP
                ${ofcNationsCup.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      ofcNationsCup.phase
                    )}
                  </h2>

                  <p class="muted">
                    OFC ·
                    8 seleções ·
                    2 grupos ·
                    15 jogos
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      ofcNationsCup.phase
                    )}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${ofcNationsCup.participants.length}
                  </b>
                </span>

                <span>
                  Grupos
                  <b>2</b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${ofcNationsCup.totalMatches}
                  </b>
                </span>
              </div>

              <div class="section">
                <h3>
                  Grupos
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º e 2º avançam
                  </span>
                </div>

                ${ofcGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Semifinalistas
                </h3>

                ${ofcQualifiedHtml}
              </div>

              <div class="section">
                <h3>
                  Mata-mata
                </h3>

                ${ofcKnockoutHtml}
              </div>

              ${ofcPodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>OFC</small>

                  <h2>
                    OFC Nations Cup
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </header>

              <div class="empty">
                A próxima edição da OFC Nations Cup será criada automaticamente no ciclo correspondente.
              </div>
            </div>`;

      const concacafNationsLeagueHtml=
        concacafNationsLeague
          ? `<div class="national-world-cup section fc26-concacaf-nations">
              <div class="tag">
                CONCACAF NATIONS LEAGUE
                ${concacafNationsLeague.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      concacafNationsLeague.phase
                    )}
                  </h2>

                  <p class="muted">
                    CONCACAF ·
                    Ligas A, B e C
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      concacafNationsLeague.phase
                    )}
                  </b>
                </span>

                <span>
                  Divisões
                  <b>3</b>
                </span>

                <span>
                  Divisão exibida
                  <b>
                    Liga ${esc(
                      concacafNationsLeagueDivision
                    )}
                  </b>
                </span>

                <span>
                  Continuidade
                  <b>
                    ${concacafNationsLeague.carriedFromYear
                      ? `Herdada de ${concacafNationsLeague.carriedFromYear}`
                      : "Edição inicial"
                    }
                  </b>
                </span>
              </div>

              <div class="fc26-concacaf-tabs">
                ${["A","B","C"].map(
                  id=>`
                    <button
                      type="button"
                      data-concacaf-nations-division="${id}"
                      class="${concacafNationsLeagueDivision===id
                        ? "active"
                        : ""
                      }"
                    >
                      Liga ${id}
                    </button>
                  `
                ).join("")}
              </div>

              ${concacafSeededHtml}

              <div class="section">
                <h3>
                  ${esc(
                    concacafLeague?.name||
                    `Liga ${concacafNationsLeagueDivision}`
                  )}
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    Melhor campanha
                  </span>

                  <span class="wc-group-legend-chip third">
                    Zona inferior
                  </span>
                </div>

                ${concacafGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Acesso e rebaixamento
                </h3>

                ${concacafMovementHtml}
              </div>

              <div class="section">
                <h3>
                  Quartas de final
                </h3>

                ${concacafQuarterfinalsHtml}
              </div>

              <div class="section">
                <h3>
                  Final Four
                </h3>

                ${concacafFinalsHtml}
              </div>

              ${concacafPodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>CONCACAF</small>

                  <h2>
                    Concacaf Nations League
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </header>

              <div class="empty">
                A próxima edição será criada automaticamente no ciclo correspondente.
              </div>
            </div>`;

      const goldCupHtml=
        goldCup
          ? `<div class="national-world-cup section fc26-gold-cup">
              <div class="tag">
                CONCACAF GOLD CUP
                ${goldCup.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      goldCup.phase
                    )}
                  </h2>

                  <p class="muted">
                    CONCACAF ·
                    16 seleções ·
                    4 grupos ·
                    31 jogos
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      goldCup.phase
                    )}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${goldCup.participants.length}
                  </b>
                </span>

                <span>
                  Grupos
                  <b>4</b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${goldCup.totalMatches}
                  </b>
                </span>
              </div>

              <div class="section">
                <h3>
                  Todos os grupos
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º e 2º avançam
                  </span>
                </div>

                ${goldCupGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Classificados às quartas
                </h3>

                ${goldCupQualifiedHtml}
              </div>

              <div class="section">
                <h3>
                  Mata-mata
                </h3>

                ${goldCupKnockoutHtml}
              </div>

              ${goldCupPodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>CONCACAF</small>

                  <h2>
                    Gold Cup
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </header>

              <div class="empty">
                A próxima edição da Gold Cup será criada automaticamente no ciclo correspondente.
              </div>
            </div>`;

      const asianCupHtml=
        asianCup
          ? `<div class="national-world-cup section fc26-asian-cup">
              <div class="tag">
                AFC ASIAN CUP
                ${asianCup.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      asianCup.phase
                    )}
                  </h2>

                  <p class="muted">
                    AFC ·
                    24 seleções ·
                    6 grupos ·
                    51 jogos
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      asianCup.phase
                    )}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${asianCup.participants.length}
                  </b>
                </span>

                <span>
                  Grupos
                  <b>6</b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${asianCup.totalMatches}
                  </b>
                </span>
              </div>

              <div class="section">
                <h3>
                  Todos os grupos
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º e 2º avançam
                  </span>

                  <span class="wc-group-legend-chip third">
                    4 melhores terceiros avançam
                  </span>
                </div>

                ${asianCupGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Classificados às oitavas
                </h3>

                ${asianCupQualifiedHtml}
              </div>

              <div class="section">
                <h3>
                  Mata-mata
                </h3>

                ${asianCupKnockoutHtml}
              </div>

              ${asianCupPodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>AFC</small>
                  <h2>
                    AFC Asian Cup
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </header>

              <div class="empty">
                A próxima edição da Asian Cup será criada automaticamente quando a carreira chegar ao ciclo correspondente.
              </div>
            </div>`;

      const afconHtml=
        afcon
          ? `<div class="national-world-cup section fc26-afcon">
              <div class="tag">
                AFRICA CUP OF NATIONS
                ${afcon.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      afcon.phase
                    )}
                  </h2>

                  <p class="muted">
                    CAF ·
                    24 seleções ·
                    6 grupos ·
                    52 jogos
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      afcon.phase
                    )}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${afcon.participants.length}
                  </b>
                </span>

                <span>
                  Grupos
                  <b>6</b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${afcon.totalMatches}
                  </b>
                </span>
              </div>

              <div class="section">
                <h3>
                  Todos os grupos
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º e 2º avançam
                  </span>

                  <span class="wc-group-legend-chip third">
                    4 melhores terceiros avançam
                  </span>
                </div>

                ${afconGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Classificados às oitavas
                </h3>

                ${afconQualifiedHtml}
              </div>

              <div class="section">
                <h3>
                  Mata-mata
                </h3>

                ${afconKnockoutHtml}
              </div>

              ${afconPodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>CAF</small>
                  <h2>
                    Africa Cup of Nations
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </header>

              <div class="empty">
                A próxima edição da AFCON será criada automaticamente quando a carreira chegar ao ciclo correspondente.
              </div>
            </div>`;

      const nationsLeagueHtml=
        nationsLeague
          ? `<div class="national-world-cup section fc26-nations-league">
              <div class="tag">
                UEFA NATIONS LEAGUE
                ${nationsLeague.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      nationsLeague.phase
                    )}
                  </h2>

                  <p class="muted">
                    UEFA ·
                    Ligas A, B, C e D
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      nationsLeague.phase
                    )}
                  </b>
                </span>

                <span>
                  Divisões
                  <b>
                    4
                  </b>
                </span>

                <span>
                  Divisão exibida
                  <b>
                    Liga ${esc(
                      nationsLeagueDivision
                    )}
                  </b>
                </span>

                <span>
                  Final Four
                  <b>
                    ${nationsLeague.finals?.length
                      ? "Definida"
                      : "Pendente"
                    }
                  </b>
                </span>
              </div>

              <div class="fc26-nations-tabs">
                ${["A","B","C","D"].map(
                  id=>`
                    <button
                      type="button"
                      data-nations-league-division="${id}"
                      class="${nationsLeagueDivision===id
                        ? "active"
                        : ""
                      }"
                    >
                      Liga ${id}
                    </button>
                  `
                ).join("")}
              </div>

              <div class="section">
                <h3>
                  ${esc(
                    nationsLeagueLeague?.name||
                    `Liga ${nationsLeagueDivision}`
                  )}
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º do grupo
                  </span>

                  <span class="wc-group-legend-chip third">
                    Último colocado
                  </span>
                </div>

                ${nationsLeagueGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Acesso e rebaixamento
                </h3>

                ${nationsLeagueMovementHtml}
              </div>

              <div class="section">
                <h3>
                  Final Four
                </h3>

                ${nationsLeagueFinalsHtml}
              </div>

              ${nationsLeaguePodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>UEFA</small>
                  <h2>
                    UEFA Nations League
                  </h2>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </header>

              <div class="empty">
                A próxima edição da Nations League será criada automaticamente no ciclo correspondente.
              </div>
            </div>`;

      const finalissimaHtml=
        finalissima
          ? `<div class="national-world-cup section fc26-finalissima">
              <div class="tag">
                FINALÃSSIMA
                ${finalissima.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    CONMEBOL × UEFA
                  </h2>

                  <p class="muted">
                    Campeão da Copa América
                    contra
                    campeão da EURO
                  </p>
                </div>

                <span class="fc26-comp-status ${finalissimaBrazil ? "eligible" : "foreign"}">
                  ${finalissimaBrazil
                    ? "BRASIL PARTICIPA"
                    : finalissima.status==="COMPLETED"
                      ? "ENCERRADA"
                      : "JOGO INTERNACIONAL"
                  }
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Edição
                  <b>
                    ${finalissima.year}
                  </b>
                </span>

                <span>
                  Formato
                  <b>
                    Jogo único
                  </b>
                </span>

                <span>
                  Confederações
                  <b>
                    CONMEBOL × UEFA
                  </b>
                </span>

                <span>
                  Status
                  <b>
                    ${finalissima.status==="COMPLETED"
                      ? "Encerrada"
                      : "Agendada"
                    }
                  </b>
                </span>
              </div>

              <div class="section">
                <h3>
                  Confronto
                </h3>

                ${finalissimaScoreHtml}
              </div>

              <div class="section">
                <h3>
                  Origem dos campeões
                </h3>

                <div class="fc26-finalissima-origins">
                  ${finalissima.participants.map(
                    team=>`
                      <article class="${team.id==="BRA" ? "is-brazil" : ""}">
                        <small>
                          ${team.source==="COPA_AMERICA"
                            ? "COPA AMÉRICA"
                            : "UEFA EURO"
                          }
                        </small>

                        <h3>
                          ${esc(team.name)}
                        </h3>

                        <span>
                          Campeão continental
                        </span>
                      </article>
                    `
                  ).join("")}
                </div>
              </div>

              ${finalissimaChampionHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>
                    CONMEBOL × UEFA
                  </small>

                  <h2>
                    Finalíssima
                  </h2>
                </div>

                <span class="fc26-comp-status">
                  AGUARDANDO CAMPEÕES
                </span>
              </header>

              <div class="empty">
                A Finalíssima será criada
                automaticamente quando
                os campeões da Copa América
                e da EURO estiverem definidos.
              </div>
            </div>`;

      const euroHtml=
        euro
          ? `<div class="national-world-cup section fc26-euro">
              <div class="tag">
                UEFA EURO
                ${euro.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      euro.phase
                    )}
                  </h2>

                  <p class="muted">
                    UEFA ·
                    24 seleções ·
                    6 grupos ·
                    51 jogos
                  </p>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      euro.phase
                    )}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${euro.participants.length}
                  </b>
                </span>

                <span>
                  Grupos
                  <b>
                    6
                  </b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${euro.totalMatches}
                  </b>
                </span>
              </div>

              <div class="section">
                <h3>
                  Todos os grupos
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º e 2º avançam
                  </span>

                  <span class="wc-group-legend-chip third">
                    4 melhores terceiros avançam
                  </span>
                </div>

                ${euroGroupsHtml}
              </div>

              <div class="section">
                <h3>
                  Classificados às oitavas
                </h3>

                ${euroQualifiedHtml}
              </div>

              <div class="section">
                <h3>
                  Mata-mata
                </h3>

                ${euroKnockoutHtml}
              </div>

              ${euroPodiumHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>UEFA</small>
                  <h2>UEFA EURO</h2>
                </div>

                <span class="fc26-comp-status foreign">
                  OUTRA CONFEDERAÇÃO
                </span>
              </header>

              <div class="empty">
                A próxima edição da EURO
                será criada automaticamente
                quando a carreira chegar ao
                ciclo correspondente.
              </div>
            </div>`;

      const copaAmericaHtml=
        copaAmerica
          ? `<div class="national-world-cup section fc26-copa-america">
              <div class="tag">
                COPA AMÉRICA
                ${copaAmerica.year}
              </div>

              <div class="fc26-ca-header">
                <div>
                  <h2>
                    ${esc(
                      copaAmericaStatusLabel
                    )}
                  </h2>

                  <p class="muted">
                    CONMEBOL ·
                    16 seleções ·
                    4 grupos ·
                    32 jogos
                  </p>
                </div>

                <span class="pill">
                  ${copaAmerica.group
                    ? `Grupo ${esc(copaAmerica.group)}`
                    : "Copa América"
                  }
                </span>
              </div>

              <div class="profile-data">
                <span>
                  Fase
                  <b>
                    ${esc(
                      copaAmericaStatusLabel
                    )}
                  </b>
                </span>

                <span>
                  Grupo do Brasil
                  <b>
                    ${esc(
                      copaAmerica.group||
                      "—"
                    )}
                  </b>
                </span>

                <span>
                  Seleções
                  <b>
                    ${copaAmerica.participants.length}
                  </b>
                </span>

                <span>
                  Jogos
                  <b>
                    ${copaAmerica.totalMatches}
                  </b>
                </span>
              </div>

              ${copaAmericaNextHtml}

              <div class="section">
                <h3>
                  Grupo do Brasil
                  ${copaAmerica.group
                    ? ` · Grupo ${esc(copaAmerica.group)}`
                    : ""
                  }
                </h3>

                <div class="wc-group-legend">
                  <span class="wc-group-legend-chip direct">
                    1º e 2º avançam às quartas
                  </span>
                </div>

                ${copaAmericaGroupHtml}
              </div>

              <div class="section">
                <h3>Todos os grupos</h3>
                ${copaAmericaGroupsHtml}
              </div>

              <div class="section">
                <h3>Campanha do Brasil</h3>
                ${copaAmericaResultsHtml}
              </div>

              <div class="section">
                <h3>Mata-mata</h3>
                ${copaAmericaKnockoutHtml}
              </div>

              ${copaAmericaChampionHtml}
            </div>`
          : `<div class="fc26-competition-detail">
              <header>
                <div>
                  <small>CONMEBOL</small>
                  <h2>Copa América</h2>
                </div>

                <span class="fc26-comp-status eligible">
                  BRASIL PARTICIPA
                </span>
              </header>

              <div class="empty">
                A próxima edição da Copa América
                será criada quando a carreira
                chegar ao ciclo correspondente.
              </div>
            </div>`;

      const worldCupHtml=
        worldCup
          ? `<div class="national-world-cup section">
              <div class="tag">
                COPA MUNDIAL ${worldCup.year}
              </div>

              <h2>${esc(worldCup.phase)}</h2>

              <div class="profile-data">
                <span>
                  Situa\u00e7\u00e3o
                  <b>${esc(wcStatusLabel)}</b>
                </span>

                <span>
                  Grupo
                  <b>${esc(worldCup.group||"\u2014")}</b>
                </span>

                <span>
                  Jogos
                  <b>${worldCup.matchesPlayed}</b>
                </span>

                <span>
                  Classificado
                  <b>${worldCup.brazilQualified?"Sim":"\u2014"}</b>
                </span>
              </div>

              ${wcOverviewStatsHtml}

              ${wcNextHtml}

              <div class="section">
                <h3>${wcBrazilGroupTitle}</h3>
                ${wcBrazilGroupHtml}
              </div>

              <div class="section">
                <h3>Todos os grupos</h3>
                ${wcGroupCarouselHtml}
              </div>

              <div class="section">
                <h3>Todas as selecoes e estatisticas</h3>
                ${wcTeamsHtml}
              </div>



              <div class="section">
                <h3>Campanha do Brasil</h3>
                ${wcResultsHtml}
              </div>

              <div class="section">
                <h3>Caminho do Brasil no mata-mata</h3>
                ${wcKnockoutHtml}
              </div>

              <div class="section">
                <h3>Chave completa do mata-mata</h3>
                ${wcFullKnockoutHtml}
              </div>

              <div class="section">
                <h3>Ranking historico de campeoes</h3>
                ${wcHistoryHtml}
              </div>

              ${wcChampionHtml}
            </div>`
          : `<div class="national-world-cup section">
              <div class="tag">COPA MUNDIAL</div>
              <p class="muted">
                Nenhuma edi\u00e7\u00e3o da Copa Mundial foi registrada nesta carreira.
              </p>
            </div>`;

      const nationalCompetitionDetailsHtml=
        nationalCompetitionId==="WORLD_CUP"
          ? worldCupHtml
          : nationalCompetitionId==="COPA_AMERICA"
            ? copaAmericaHtml
          : nationalCompetitionId==="EURO"
            ? euroHtml
          : nationalCompetitionId==="UEFA_NATIONS_LEAGUE"
            ? nationsLeagueHtml
          : nationalCompetitionId==="AFCON"
            ? afconHtml
          : nationalCompetitionId==="ASIAN_CUP"
            ? asianCupHtml
          : nationalCompetitionId==="GOLD_CUP"
            ? goldCupHtml
          : nationalCompetitionId==="CONCACAF_NATIONS_LEAGUE"
            ? concacafNationsLeagueHtml
          : nationalCompetitionId==="OFC_NATIONS_CUP"
            ? ofcNationsCupHtml
          : nationalCompetitionId==="FIFA_ARAB_CUP"
            ? fifaArabCupHtml
          : nationalCompetitionId==="FIFA_SERIES"
            ? fifaSeriesHtml
          : nationalCompetitionId==="FINALISSIMA"
            ? finalissimaHtml
          : nationalCompetitionId==="WORLD_CUP_QUALIFIERS"
            ? `<div class="fc26-competition-detail">
                <header>
                  <div>
                    <small>FIFA + CONMEBOL</small>
                    <h2>Eliminatórias da Copa Mundial</h2>
                  </div>
                  <span class="fc26-comp-status eligible">
                    BRASIL PARTICIPA
                  </span>
                </header>

                <h3>Classificação sul-americana</h3>
                ${qHtml}
              </div>`
            : genericInternationalCompetitionHtml;


      return `<nav class="subnav national-tabs"><a href="#national-overview">Visão geral</a><a href="#national-squad">Convocados</a><a href="#national-dispute">Disputa</a><a href="#national-calendar">Calendário</a><a href="#national-competitions">Competições</a><a href="#national-stats">Estatísticas</a><a href="#national-history">Histórico</a></nav>
      <div id="national-overview" class="grid national-dashboard"><section class="card"><div class="tag">SELEÇÃO BRASILEIRA</div><h2>${esc(n.calledUp?n.status:radar.label)}</h2><p>${n.calledUp?`Você faz parte da convocação atual para <b>${esc(n.competition)}</b>. Papel previsto: <b>${esc(n.status)}</b>.`:radar.gap?`Você está a aproximadamente <b>${radar.gap} ponto(s)</b> do nível atual de disputa. Continue atuando bem pelo clube.`:"Seu desempenho já coloca você na disputa pela próxima convocação."}</p>${bar("Momento para convocação",radar.score)}<div class="profile-data"><span>GER <b>${D.overall(state.person)}</b></span><span>Reputação <b>${Math.round(state.reputation)}</b></span><span>Moral <b>${Math.round(state.person.morale)}</b></span><span>Posição <b>${esc(state.person.pos)}</b></span><span>Nacionalidade <b>${esc(n.nationality||state.person.nationality||"Brasil")}</b></span><span>Camisa <b>${n.shirtNumber||"—"}</b></span></div></section>
      <section id="national-calendar" class="card"><div class="tag">PRÓXIMA DATA FIFA</div><h2>${dayDate(n.nextWindow)}</h2><p>Em aproximadamente <b>${Math.max(0,n.nextWindow-state.day)} dias</b> · ${esc(upcoming[0]?.competition||"Agenda internacional")}</p><div class="national-fixtures">${upcoming.map(match=>`<div><time>${dayDate(match.day)}</time><b>Brasil × ${esc(match.opponent)}</b><small>${esc(match.callupStatus||"Convocação ainda não definida")}</small></div>`).join("")}</div><button data-page="calendar">Ver no calendário</button></section></div>
      <section id="national-squad" class="card section"><div class="tag">${officialCupSquad?"CONVOCAÇÃO OFICIAL · COPA MUNDIAL":n.calledUp?"CONVOCADOS":"PROJEÇÃO DA PRÓXIMA LISTA"}</div><h2>Elenco da Seleção</h2><p class="muted">${officialCupSquad?`Lista congelada de 26 jogadores desta edição. ${n.calledUp?"Você foi convocado.":"Você não foi convocado."}`:n.calledUp?"Esta é a lista usada pelo motor na convocação atual.":"A lista abaixo é uma projeção por mérito; a convocação oficial ainda pode mudar."}</p>${squadHtml}</section>
      <section id="national-dispute" class="card section"><div class="tag">DISPUTA POR POSIÇÃO</div><h2>${esc(state.person.pos)}${heroRank?` · você está em ${heroRank}º`:''}</h2><div class="tablewrap"><table><thead><tr><th>#</th><th>Jogador</th><th>Clube</th><th>GER</th><th>Ãndice</th></tr></thead><tbody>${competition.map(x=>`<tr ${x.id==="hero"?'class="hero-row"':""}><td>${x.rank}</td><td><b>${esc(x.name)}</b>${x.id==="hero"?" · VOCÊ":""}</td><td>${esc(x.club||"—")}</td><td>${x.overall}</td><td>${Math.round(x.score)}</td></tr>`).join("")}</tbody></table></div><p class="muted">GER, desempenho, experiência, disponibilidade e concorrência do setor influenciam convocação e papel.</p></section>
      <section id="national-competitions" class="card section">
        <div class="tag">COMPETIÇÕES</div>
        ${internationalCompetitionsHubHtml}
        ${nationalCompetitionDetailsHtml}
      </section>
      <section id="national-stats" class="card section"><div class="tag">CARREIRA INTERNACIONAL</div><h2>Números pela Seleção</h2><div class="profile-data"><span>Jogos <b>${n.caps}</b></span><span>Titular <b>${n.starts}</b></span><span>Gols <b>${n.goals}</b></span><span>Assist. <b>${n.assists}</b></span><span>Minutos <b>${n.minutes||0}</b></span><span>Nota média <b>${avg}</b></span><span>Melhor em campo <b>${n.motm}</b></span></div><p>Última convocação: <b>${n.lastCallupDay==null?"Ainda não convocado":dayDate(n.lastCallupDay)}</b></p></section>
      <section id="national-history" class="card section"><h2>Jogos pela Seleção</h2>${n.matches.length?`<div class="tablewrap"><table><thead><tr><th>Data</th><th>Competição</th><th>Jogo</th><th>Min.</th><th>Nota</th><th>G</th><th>A</th></tr></thead><tbody>${n.matches.map(m=>`<tr><td>${dayDate(m.day)}</td><td>${esc(m.competition)}</td><td>Brasil ${m.brazil} × ${m.other} ${esc(m.opponent)}</td><td>${m.minutes}</td><td>${Number(m.rating).toFixed(1)}</td><td>${m.goals}</td><td>${m.assists}</td></tr>`).join("")}</tbody></table></div>`:'<div class="empty">Nenhuma partida disputada pela Seleção ainda.</div>'}</section>`;
    },
    calendar() {
      if (!Calendar) return empty("O calendário não pôde ser carregado.");
      calendarMonth ||= Calendar.monthId(state);
      return Calendar.render(state, D, { month: calendarMonth, esc, dayDate });
    },
    awards() {
      return Expansion.awards(state);
    },
    panorama() {
      const seasons=state.statistics?.seasons||[], latest=seasons[0];
      if(!latest?.panorama) return `<section class="card"><div class="tag">FIM DE TEMPORADA</div><h2>Panorama da temporada</h2><div class="empty">O panorama completo será registrado quando a temporada terminar.</div></section>`;
      const winner=(item,label)=>item ? `<div class="panorama-winner"><small>${label}</small><b>${esc(item.name||item.winner||"—")}</b><span>${esc(item.club||item.winnerClub||"")}${item.value!==undefined ? ` · ${item.value}` : ""}</span></div>` : `<div class="panorama-winner"><small>${label}</small><b>—</b></div>`;
      const cards=latest.panorama.map((c)=>`<details class="card section" open><summary><b>${esc(c.name)}</b> · Temporada ${latest.season}</summary><div class="profile-data section"><span>Campeão <b>${esc(c.champion||"—")}</b></span><span>Vice <b>${esc(c.runnerUp||"—")}</b></span></div><div class="competition-grid section">${winner(c.topScorer,"Artilheiro")}${winner(c.assistLeader,"Líder de assistências")}${winner(c.bestPlayer,"Melhor jogador")}${winner(c.bestYoung,"Revelação / melhor jovem")}${winner(c.bestCoach,"Melhor técnico")}</div>${c.team?.length ? `<h3 class="section">Seleção da competição</h3><div class="award-grid">${c.team.map((p)=>`<article class="award-card"><span>${esc(p.position)}</span><h3>${esc(p.name)}</h3><b>${esc(p.club)}</b><small>Nota ${Number(p.average||0).toFixed(2)} · ${p.goals||0}G · ${p.assists||0}A</small></article>`).join("")}</div>`:""}</details>`).join("");
      const p=latest.player||{};
      const player=`<section class="card"><div class="tag">SEU ANO</div><h2>${esc(p.club||"Carreira")} · ${latest.season}</h2><div class="metric-row"><span><b>${p.appearances||0}</b><small>Jogos</small></span><span><b>${p.goals||0}</b><small>Gols</small></span><span><b>${p.assists||0}</b><small>Assistências</small></span><span><b>${Number(p.averageRating||0).toFixed(2)}</b><small>Nota média</small></span></div><div class="profile-data section"><span>Minutos <b>${p.minutes||0}</b></span><span>MOTM <b>${p.motm||0}</b></span><span>GER <b>${p.overallStart??"—"} → ${p.overallEnd??"—"}</b></span><span>Reputação <b>${p.reputation||0}</b></span><span>Seleção <b>${p.national?.caps||0} jogos · ${p.national?.goals||0} gols</b></span></div></section>`;
      const archive=seasons.length>1 ? `<section class="card"><h2>Temporadas arquivadas</h2>${seasons.slice(1).map((season)=>`<article class="news"><time>Temporada ${season.season}</time><h3>${season.player?.club ? esc(season.player.club) : "Carreira"}</h3><p>${season.player?.appearances||0}J · ${season.player?.goals||0}G · ${season.player?.assists||0}A · nota ${Number(season.player?.averageRating||0).toFixed(2)}</p></article>`).join("")}</section>`:"";
      return `<div class="grid">${player}${archive}</div>${cards}`;
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
      const report = state.mode === "player" ? Career.init(state).playerCareer?.lastMatchReport : null;
      const signed = (value) => `${Number(value || 0) >= 0 ? "+" : ""}${Number(value || 0).toFixed(1)}`;
      const changes = report?.attributeChanges || [];
      const postMatch = report ? `<section class="card section" id="post-match-stage25"><div class="tag">PÓS-JOGO · ${esc(report.competition || "Partida")} · ${esc(report.importance?.label || "Jogo oficial")}</div><h2>${report.national ? "Seleção Brasileira" : "Relatório do jogador"} · ${esc(report.opponent || "Adversário")}</h2><p class="muted">${esc(String(report.status || "PARTICIPAÇÃO").replaceAll("_", " "))}${report.entryMinute != null ? ` · entrou aos ${report.entryMinute}'` : ""} · peso ${Number(report.importance?.factor || 1).toFixed(2)}x</p><div class="kpis"><div><b>${report.minutes || 0}</b><small>MINUTOS</small></div><div><b>${report.goals || 0}</b><small>GOLS</small></div><div><b>${report.assists || 0}</b><small>ASSIST.</small></div><div><b>${report.rating == null ? "—" : Number(report.rating).toFixed(1)}</b><small>NOTA</small></div><div><b>+${Number(report.xp || 0).toFixed(1)}</b><small>XP</small></div></div><div class="grid3"><div class="notice"><b>Evolução</b><p>${changes.length ? changes.map(x => `${esc(x.label || x.key)}: ${x.before} → ${x.after}`).join("<br>") : "Nenhum atributo subiu nesta partida."}</p></div><div class="notice"><b>Confiança e papel</b><p>${report.national ? "Sem alteração na confiança do clube." : `${signed(Number(report.coachTrustAfter || 0) - Number(report.coachTrustBefore || 0))} de confiança`}<br>${esc(report.squadRoleBefore || "—")} → ${esc(report.squadRoleAfter || report.squadRoleBefore || "—")}</p></div><div class="notice"><b>Reputação${report.national ? " e Seleção" : ""}</b><p>${signed(report.reputationDelta)} de reputação${report.nationalImpact ? `<br>${esc(report.nationalImpact)}` : ""}</p></div></div></section>` : "";
      if (!m)
        return `${postMatch}${empty("Avance até a primeira rodada para ver os relatórios.")}`;
      return `${postMatch}<div class="grid"><section class="card"><div class="tag">${esc(m.competitionName || leagueName(m.leagueId))} · Etapa ${m.round} · Temporada ${m.season}</div><h2 class="section">${esc(D.club(state, m.home).name)}<br>${esc(D.club(state, m.away).name)}</h2><div class="score">${m.hg} × ${m.ag}</div>${m.penalties ? `<p class="good">Pênaltis: ${m.penalties[0]} × ${m.penalties[1]}</p>` : ""}<p>${esc(m.summary)}</p><table><thead><tr><th>Indicador</th><th>Casa</th><th>Fora</th></tr></thead><tbody><tr><td>Posse</td><td>${m.possession}%</td><td>${100 - m.possession}%</td></tr>${[
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
      const comm=Career.init(state).communications, messages=comm.messages||[], articles=comm.articles||[], unread=messages.filter(m=>!m.read).length;
      return `<div class="grid"><section class="card"><div class="tag">CAIXA DE ENTRADA · ${unread} NOVA${unread===1?"":"S"}</div><h2>Mensagens da carreira</h2><p class="muted">Treinador, agente, clube, Seleção, imprensa e carreira. Propostas continuam em Mercado → Minhas propostas.</p>${state.decision ? `<article class="news"><time>DECISÃO PENDENTE</time><h3>${esc(state.decision.title)}</h3><p>${esc(state.decision.body)}</p><button data-page="life" data-target="current-decision">Responder agora</button></article>` : ""}${messages.slice(0,20).map(m=>`<article class="news ${m.read?"":"notice"}"><time>${esc(m.category)} · ${esc(m.priority)} · ${dayDate(m.day)}</time><h3>${esc(m.subject)}</h3><p><b>${esc(m.sender)}</b> · ${esc(m.body)}</p>${m.read?`<small>Lida</small>`:`<button data-message-read="${esc(m.id)}">Marcar como lida</button>`}</article>`).join("")||empty("Nenhuma mensagem registrada.")}${comm.interviews.filter(i=>!i.answered).slice(0,2).map(i=>`<article class="news notice" id="interview-${esc(i.id)}"><time>ENTREVISTA · ${dayDate(i.day)}</time><h3>${esc(i.question)}</h3><div class="actions">${i.choices.map(c=>`<button data-interview="${esc(i.id)}" data-interview-choice="${esc(c.id)}">${esc(c.label)}</button>`).join("")}</div></article>`).join("")}</section><section class="card"><div class="tag">NOTÃCIAS</div><h2>A carreira reage ao que acontece</h2>${articles.slice(0,16).map(n=>`<article class="news"><time>${esc(n.category)} · ${dayDate(n.day)}</time><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join("")||empty("Nenhuma notícia contextual ainda.")}</section></div>`;
    },
    proposals() {
      const eligible = Career.canTransfer(state),
        w = Career.windowStatus(state),
        e = Career.init(state);
      const offers = state.offers.filter(o=>o.expires>=state.day),
        prefs = e.offerPreferences || { leagues: ["serieA", "serieB", "serieC", "serieD"], clubLevel: "any", international: true },
        leagueOptions = [["serieA", "Série A"], ["serieB", "Série B"], ["serieC", "Série C"], ["serieD", "Série D"]];
      return `<div class="grid"><section class="card"><div class="tag">CAIXA DE ENTRADA</div><h2>Mensagens da carreira</h2><p class="muted">Propostas, decisões e comunicados importantes ficam concentrados aqui.</p>${state.decision ? `<article class="news"><time>DECISÃO PENDENTE</time><h3>${esc(state.decision.title)}</h3><p>${esc(state.decision.body)}</p><button data-page="life" data-target="current-decision">Responder agora</button></article>` : ""}${offers.map((o) => {
        const c = D.club(state, o.clubId), uf = D.Competitions.clubState(c) || "—";
        return `<article class="news offer" id="transfer-offer-${esc(o.clubId)}"><time>${o.transferType === "loan" ? "PROPOSTA DE EMPRÉSTIMO" : "PROPOSTA DE CONTRATO"} · expira em ${Math.max(0, o.expires - state.day)} dias</time><h3>${esc(c.name)}</h3><p><b>Estado:</b> ${esc(uf)}<br><b>Competição:</b> ${esc(worldLeagueName(c.leagueId))}<br><b>Projeto:</b> ${esc(o.role)}<br><b>Papel esperado:</b> ${esc(o.squadRole || "Rotação")}<br><b>Duração:</b> ${Math.round((o.durationDays || 730)/365)} ano(s)<br><b>Salário:</b> ${money(o.salary)}/mês · <b>Luvas:</b> ${money(o.signingBonus || 0)}<br>Estrutura: ${c.structure}/100${o.negotiated ? " · <b>Contraproposta negociada</b>" : ""}</p><div class="actions"><button class="primary" data-join="${o.clubId}">${w.open ? "Aceitar e assinar" : "Aceitar · agendar transferência"}</button><button data-hold-offer="${o.clubId}">Pedir tempo</button><button data-counter="${o.clubId}" ${o.negotiated ? "disabled" : ""}>${o.negotiated ? "Negociado" : "Pedir melhores termos"}</button><button data-reject="${o.clubId}">Recusar</button></div></article>`;
      }).join("") || empty(state.day < state.careerTransferAvailableDay ? "Você já assinou nesta janela. Novas propostas chegam na próxima janela." : "Nenhuma proposta pendente no momento.")}</section>${state.mode==="player"?(()=>{const pc=e.playerCareer,tc=pc.targetClub,ta=tc?Career.interestAssessment(state,tc.clubId):null,clubs=state.clubs.filter(x=>x.id!==state.clubId).sort((a,b)=>b.structure-a.structure);return `<section class="card section"><div class="tag">CLUBE-ALVO</div><h2>Planeje sua próxima transferência</h2><p class="muted">Escolher um alvo não garante proposta. Seu agente acompanha o clube e o interesse evolui conforme nível, desempenho, reputação e janela.</p><label>Clube desejado<select id="target-club"><option value="">Escolha um clube</option>${clubs.map(x=>`<option value="${x.id}" ${tc?.clubId===x.id?"selected":""}>${esc(x.name)} · ${esc(leagueName(x.leagueId))}</option>`).join("")}</select></label><div class="actions"><button class="primary" data-action="target-club">Definir clube-alvo</button>${tc?`<button data-action="clear-target-club">Remover alvo</button>`:""}</div>${ta?`<div class="notice"><h3>${esc(D.club(state,ta.clubId)?.name||"Clube")} · Interesse ${esc(ta.label)}</h3><p>Concorrência: <b>${esc(ta.competition)}</b> · OVR recomendado: <b>${ta.recommendedOverall}</b> · seu OVR: <b>${D.overall(state.person)}</b></p><p>Pipeline: <b>${esc((pc.interests||[]).find(x=>x.clubId===ta.clubId)?.stage||"Monitoramento")}</b></p></div>`:""}</section>`})():""}<section class="card"><div class="tag">PREFERÊNCIAS DO AGENTE</div><h2>Quais propostas quero receber?</h2><p class="muted">As preferências são usadas na geração das próximas propostas, não apenas na tela.</p>${state.mode === "player" ? (() => { const pc=e.playerCareer, ct=pc.contract, interests=pc.interests||[], advice=Career.agentAdvice(state), strategy=pc.agentStrategy||{priority:"balanced",stance:"open"}; return `<div class="notice"><div class="tag">MEU AGENTE</div><h3>${esc(pc.agent?.name || "Agente PRO-LIFE")}</h3><p>${esc(pc.agent?.agency || "Agência independente")} · reputação ${pc.agent?.reputation||50}/100 · comissão ${pc.agent?.commission||5}%<br>Rede: ${esc(pc.agent?.network||"Nacional")} · negociação ${pc.agent?.negotiation||50}/100</p><h3>${esc(advice?.action || "Planejamento de carreira")}</h3><p>${esc(advice?.reason || "Seu agente está analisando o próximo passo.")}</p><label>Prioridade<select id="agent-priority"><option value="balanced" ${strategy.priority==="balanced"?"selected":""}>Equilíbrio</option><option value="playtime" ${strategy.priority==="playtime"?"selected":""}>Tempo de jogo</option><option value="salary" ${strategy.priority==="salary"?"selected":""}>Salário</option><option value="prestige" ${strategy.priority==="prestige"?"selected":""}>Prestígio</option><option value="development" ${strategy.priority==="development"?"selected":""}>Desenvolvimento</option></select></label><label>Postura<select id="agent-stance"><option value="stay" ${strategy.stance==="stay"?"selected":""}>Quero permanecer</option><option value="open" ${strategy.stance==="open"?"selected":""}>Aberto a propostas</option><option value="loan" ${strategy.stance==="loan"?"selected":""}>Buscar empréstimo</option><option value="leave" ${strategy.stance==="leave"?"selected":""}>Buscar saída</option></select></label><button class="primary" data-action="agent-strategy">Atualizar estratégia</button><div class="actions">${Career.agencies.map(a=>`<button data-hire-agency="${a.id}" ${pc.agent?.id===a.id?"disabled":""}>${pc.agent?.id===a.id?"Agência atual":`Contratar ${esc(a.name)}`}</button>`).join("")}</div><p><b>Pipeline de mercado:</b><br>${interests.length ? interests.slice(0,5).map(x=>`${esc(D.club(state,x.clubId)?.name||"Clube")} · ${esc(x.stage)}`).join("<br>") : "Nenhum interesse ativo."}</p></div><div class="notice"><div class="tag">CARREIRA PROFISSIONAL</div><h3>Valor de mercado: ${money(pc.marketValue || 0)}</h3>${ct ? `<p><b>Contrato atual:</b> ${Math.max(0, Math.ceil((ct.endDay-state.day)/30))} mês(es) restantes<br><b>Salário:</b> ${money(state.salary)}/mês · <b>Papel:</b> ${esc(ct.role || pc.squadRole)}<br><b>Vínculo:</b> ${ct.type === "loan" ? "Empréstimo" : "Definitivo"}</p>` : `<p>Sem contrato ativo.</p>`}<p><b>Clubes interessados:</b><br>${interests.length ? interests.slice(0,5).map(x=>`${esc(D.club(state,x.clubId)?.name||"Clube")} · ${esc(x.stage)}`).join("<br>") : "Nenhuma sondagem ativa."}</p>${pc.renewalOffer ? `<div class="news" id="renewal-offer"><b>Renovação disponível</b><br>${Math.round(pc.renewalOffer.durationDays/365)} anos · ${money(pc.renewalOffer.salary)}/mês · luvas ${money(pc.renewalOffer.signingBonus)} · bônus ${money(pc.renewalOffer.performanceBonus||0)} · papel ${esc(pc.renewalOffer.role||pc.squadRole)}<div class="grid3"><label>Salário desejado<input id="renew-salary" type="number" min="0" step="100" value="${pc.renewalOffer.salary}"></label><label>Anos<input id="renew-years" type="number" min="1" max="5" value="${Math.round(pc.renewalOffer.durationDays/365)}"></label><label>Luvas<input id="renew-bonus" type="number" min="0" step="100" value="${pc.renewalOffer.signingBonus}"></label><label>Bônus desempenho<input id="renew-performance" type="number" min="0" step="100" value="${pc.renewalOffer.performanceBonus||0}"></label><label>Papel<select id="renew-role">${["Rotação","Titular","Importante","Estrela"].map(r=>`<option ${r===(pc.renewalOffer.role||pc.squadRole)?"selected":""}>${r}</option>`).join("")}</select></label></div><div class="actions"><button class="primary" data-action="accept-renewal">Aceitar renovação</button><button data-action="counter-renewal">Pedir meus termos</button><button data-action="reject-renewal">Recusar</button></div></div>` : (ct && Math.max(0,ct.endDay-state.day)<=365 ? `<button class="primary" data-action="request-renewal">Pedir ao agente para renovar</button>` : "")}</div>`; })() : ""}${state.mode === "player" && state.clubId ? (() => { const pc=e.playerCareer, objectives=Career.matchObjectives(state); return `<div class="notice"><div class="tag">RELAÇÃO COM O TÉCNICO</div><h3>${esc(pc.squadRole)} · ${Math.round(pc.coachTrust)}/100</h3>${bar("Confiança do técnico",pc.coachTrust)}<p><b>Objetivos da próxima partida:</b><br>${objectives.map(o=>"• "+esc(o.label)).join("<br>")}</p><small>Cumpridos na carreira: ${pc.objectivesMet}/${pc.objectivesTotal}${pc.lastEvaluation ? ` · última nota ${pc.lastEvaluation.rating}` : ""}</small></div>`; })() : ""}${state.world === "brazil2026" ? `<h3>Divisões</h3><div class="offer-pref-leagues">${leagueOptions.map(([id, label]) => `<label><input type="checkbox" class="offer-league" value="${id}" ${prefs.leagues.includes(id) ? "checked" : ""}> ${label}</label>`).join("")}</div>` : ""}<label>Nível dos clubes<select id="offer-club-level"><option value="any" ${prefs.clubLevel === "any" ? "selected" : ""}>Qualquer clube</option><option value="elite" ${prefs.clubLevel === "elite" ? "selected" : ""}>Somente clubes de elite</option><option value="competitive" ${prefs.clubLevel === "competitive" ? "selected" : ""}>Clubes competitivos</option><option value="intermediate" ${prefs.clubLevel === "intermediate" ? "selected" : ""}>Clubes intermediários</option><option value="small" ${prefs.clubLevel === "small" ? "selected" : ""}>Clubes menores</option></select></label><button class="primary" data-action="offer-prefs">Salvar preferências</button></section></div>`;
    },
    market() {
      const c = D.club(state),
        w = Career.windowStatus(state),
        e = Career.init(state),
        rejectedTransfers = state.rejectedTransfers || [],
        confirmedTransfers = (e.transfers || []).filter(t => {
          if(rejectedTransfers.some(r=>r.player===t.player&&r.to===t.to&&(!r.from||r.from===t.from))) return false;
          if(t.status==="CONFIRMED"||t.accepted===true) return true;
          return t.player!==state.person.name;
        }),
        worldMarketPanel = window.ProLifeWorldLiveMarketView?.render
          ? window.ProLifeWorldLiveMarketView.render(state,D,{
              tab:worldMarketTab,
              country:worldMarketFilters.country,
              league:worldMarketFilters.league,
              club:worldMarketFilters.club,
              period:worldMarketFilters.period,
            })
          : `<section class="card section"><div class="tag">CENTRAL DO MERCADO</div><h2>Mercado mundial indisponível</h2><p class="muted">O componente visual não foi carregado.</p></section>`;
      return `<section class="card"><h2>Janelas de transferências</h2><div class="grid3">${[
        ["Início do ano", "01/01 a 28/02"], ["Meio do ano", "01/07 a 31/08"], ["Final do ano", "15/11 a 31/12"],
      ].map(([name, dates]) => `<div class="window-card ${w.name === name ? "open" : ""}"><small>${name}</small><h3>${dates}</h3><b>${w.name === name ? "ABERTA" : ""}</b></div>`).join("")}</div><p class="${w.open ? "good" : "bad"}">${esc(w.name)} · ${w.open ? w.remaining + " dias restantes" : "Próxima abertura em " + w.remaining + " dias"}</p><p class="chart-note">O mercado registra negociações simuladas entre os clubes conforme orçamento, nível do atleta e carências do elenco.</p></section>${worldMarketPanel}${
        state.mode === "coach" && c
          ? `<section class="card section"><h2>Scouting e contratação</h2><p>Orçamento do clube: <b>${money(c.budget)}</b></p><p class="muted">Valores estimados por nível e idade. Atletas muito acima da estrutura podem recusar; clubes preservam o elenco mínimo.</p><div class="tablewrap"><table><thead><tr><th>Atleta</th><th>Clube</th><th>Pos.</th><th>Idade</th><th>Nível</th><th>Preço</th><th></th></tr></thead><tbody>${state.clubs.filter((x) => x.id !== c.id).flatMap((x) => x.roster.filter((p) => p.pos !== "GOL").slice().sort((a, b) => D.overall(b) - D.overall(a)).slice(0, 3).map((p) => `<tr><td>${esc(p.name)}</td><td>${esc(x.name)}</td><td>${p.pos}</td><td>${p.age}</td><td>${D.overall(p)}</td><td>${money(A.valuation(p))}</td><td><button data-recruit="${p.id}" data-source="${x.id}" ${w.open ? "" : "disabled"}>Contratar</button></td></tr>`)).join("")}</tbody></table></div></section>`
          : ""
      }`;
    },
    sponsorships() {
      const C=D.Commercial,c=C.init(state,D),s=C.summary(state,D),fmtFollowers=(n)=>n>=1000000?(n/1000000).toLocaleString("pt-BR",{maximumFractionDigits:1})+" milhões":n>=1000?(n/1000).toLocaleString("pt-BR",{maximumFractionDigits:0})+" mil":Math.round(n).toLocaleString("pt-BR");
      const proposals=c.proposals.filter(p=>p.status==="PROPOSTA"&&p.expires>=state.day), active=s.active;
      return `<div class="subnav life-tabs"><a href="#commercial-overview">Visão geral</a><a href="#commercial-proposals">Propostas</a><a href="#commercial-contracts">Contratos</a><a href="#commercial-brands">Marcas</a><a href="#commercial-history">Histórico</a></div>
      <section class="card" id="commercial-overview"><div class="tag">IMAGEM E VALOR COMERCIAL</div><h2>Popularidade não é reputação esportiva</h2><div class="stats"><div class="stat"><small>Popularidade pública</small><b>${Math.round(s.popularity)}/100</b></div><div class="stat"><small>Reputação esportiva</small><b>${Math.round(state.reputation)}/100</b></div><div class="stat"><small>Seguidores</small><b>${fmtFollowers(s.followers)}</b></div><div class="stat"><small>Valor comercial</small><b>${money(s.commercialValue)}</b></div></div><div class="profile-data"><span>Patrocínios ativos <b>${active.length}</b></span><span>Receita comercial <b>${money(s.revenue)}</b></span><span>Bônus recebidos <b>${money(s.bonusRevenue)}</b></span><span>Próximo evento <b>${s.nextEvent?`${dayDate(s.nextEvent.day)} · ${esc(s.nextEvent.brand)}`:"Nenhum"}</b></span></div>${s.nextEvent?`<article class="news offer section" id="commercial-event-${esc(s.nextEvent.id)}"><time>${dayDate(s.nextEvent.day)} · ${esc(s.nextEvent.status)}</time><h3>${esc(s.nextEvent.type)} · ${esc(s.nextEvent.brand)}</h3><p>${s.nextEvent.mandatory?"Obrigação importante do contrato.":"Atividade comercial opcional."} Partidas oficiais sempre têm prioridade.</p>${s.nextEvent.status === "CONFIRMADO" ? `<div class="notice"><b>Presença confirmada.</b><p>Compromisso adicionado à agenda para ${dayDate(s.nextEvent.day)}. O resultado chegará após a realização.</p></div>` : `<div class="actions"><button class="primary" data-commercial-event="${esc(s.nextEvent.id)}" data-commercial-event-choice="participate">Confirmar presença</button><button data-commercial-event="${esc(s.nextEvent.id)}" data-commercial-event-choice="reschedule">Pedir reagendamento</button><button data-commercial-event="${esc(s.nextEvent.id)}" data-commercial-event-choice="decline">Recusar</button></div>`}</article>`:""}<p class="muted">Valor de mercado mede o atleta para transferências. Valor comercial mede imagem, alcance, exposição e capacidade de gerar acordos.</p></section>
      <section class="card section" id="commercial-proposals"><div class="tag">PROPOSTAS REAIS</div><h2>Negociações comerciais</h2>${proposals.map(p=>{const rival=active.find(x=>x.category===p.category&&x.brandId!==p.brandId&&(x.exclusive||p.exclusive));const diff=rival?p.amount-rival.amount:0;const dispute=rival?`<div class="notice"><div class="tag">DISPUTA DE PATROCÃNIO</div><h3>${esc(rival.brand)} × ${esc(p.brand)}</h3><div class="profile-data"><span>Patrocinador atual <b>${esc(rival.brand)}</b></span><span>Contrato atual <b>${money(rival.amount)}</b></span><span>Nova proposta <b>${money(p.amount)}</b></span><span>Diferença <b class="${diff>0?"good":diff<0?"bad":""}">${diff>0?"+":""}${money(diff)}</b></span></div><p class="muted">As duas marcas disputam a categoria ${esc(C.categoryLabel(p.category))}. Você pode negociar valor, duração e bônus antes de decidir.</p><p><b>Ao assinar com ${esc(p.brand)}, o contrato exclusivo com ${esc(rival.brand)} será encerrado.</b></p></div>`:"";return `<article class="news offer" id="commercial-proposal-${esc(p.id)}"><time>${esc(C.categoryLabel(p.category))} · ${esc(p.tier||"NATIONAL")} · expira em ${Math.max(0,p.expires-state.day)} dias</time><h3>${esc(p.brand)}</h3><p><b>${esc(p.type)}</b> · ${money(p.amount)} por pagamento<br>Duração: ${Math.ceil(p.durationDays/30)} meses · ${p.exclusive?"Exclusividade na categoria":"Sem exclusividade"}<br>${esc(p.bonus.label)}: ${money(p.bonus.amount)}<br>Exigências: ${p.requirements.map(esc).join(" · ")}</p>${dispute}<div class="grid3"><label>Valor desejado<input id="commercial-amount-${esc(p.id)}" type="number" min="${p.amount}" step="1000" value="${p.amount}"></label><label>Duração (dias)<input id="commercial-duration-${esc(p.id)}" type="number" min="90" max="1095" value="${p.durationDays}"></label><label>Bônus desejado<input id="commercial-bonus-${esc(p.id)}" type="number" min="0" step="1000" value="${p.bonus.amount}"></label></div><div class="actions"><button class="primary" data-commercial-accept="${esc(p.id)}">${rival?"Assinar e trocar patrocinador":"Aceitar"}</button><button data-commercial-negotiate="${esc(p.id)}" ${p.round>=2?"disabled":""}>Negociar${p.round?" · rodada "+p.round:""}</button><button data-commercial-hold="${esc(p.id)}">Pedir tempo</button><button data-commercial-reject="${esc(p.id)}">Recusar</button></div></article>`}).join("")||empty("Nenhuma proposta comercial pendente. O interesse surge após desempenho, reputação e exposição consistentes.")}</section>
      <section class="card section" id="commercial-contracts"><div class="tag">PATROCÃNIOS ATIVOS</div><h2>Contratos</h2><div class="grid3">${active.map(x=>`<article class="card"><small>${esc(C.categoryLabel(x.category))} · ${esc(x.tier||"NATIONAL")} · ${x.exclusive?"EXCLUSIVO":"NÃO EXCLUSIVO"}</small><h3>${esc(x.brand)}</h3><b>${money(x.amount)}</b><p>${dayDate(x.startDay)} a ${dayDate(x.endDay)}<br>Próximo pagamento: ${dayDate(x.nextPaymentDay)}<br>${esc(x.bonus.label)}: ${money(x.bonus.amount)}<br>Relação: ${x.relationship>=85?"EXCELENTE":x.relationship>=65?"BOA":x.relationship>=40?"NORMAL":"RUIM"}</p></article>`).join("")||empty("Nenhum patrocínio ativo.")}</div></section>
      <section class="card section" id="commercial-brands"><div class="tag">UNIVERSO PRO-LIFE</div><h2>Marcas</h2><div class="grid3">${C.brands.map(b=>{const i=c.interests.find(x=>x.brandId===b.id);return `<article class="card"><small>${esc(C.categoryLabel(b.category))} · ${esc(b.tier)} · prestígio ${b.prestige}</small><h3>${esc(b.name)}</h3><p>${esc(b.profile)}<br>Mercados: ${b.regions.map(esc).join(" · ")}<br>Status: <b>${esc(i?.stage||"SEM INTERESSE")}</b></p></article>`}).join("")}</div></section>
      <section class="card section" id="commercial-history"><div class="tag">HISTÓRICO COMERCIAL</div><h2>Contratos da carreira</h2>${c.history.map(h=>`<article class="news"><time>${dayDate(h.startDay)} — ${dayDate(h.endDay)}</time><h3>${esc(h.brand)}</h3><p>${esc(h.category)} · ${money(h.value)} · ${esc(h.status)}</p></article>`).join("")||empty("Nenhum contrato comercial registrado.")}</section>`;
    },
    life() {
      const e=Career.init(state), life=D.Life.init(state), f=D.Life.snapshot(state), media=Career.mediaProfile(state);
      const ledger=e.ledger.slice(0,12), unexpected=D.UnexpectedEvents?.recent(state,6)||[];
      const personality=D.Personality?.init?.(state);
      const personalityPanel=personality?(()=>{
        const traits=(D.Personality.topTraits?.(state,6)||[]).map(item=>`<span>${esc(item.label)} <b>${esc(D.Personality.valueLabel(item.value))}</b></span>`).join("");
        const history=(personality.history||[]).slice(0,5);
        const deltaLabels={professionalism:"Profissionalismo",ambition:"Ambição",loyalty:"Lealdade",humility:"Humildade",leadership:"Liderança",discipline:"Disciplina",mediaPresence:"Presença na mídia",teamOrientation:"Espírito de equipe",public:"Reputação pública",dressingRoom:"Reputação no vestiário",coach:"Reputação com o treinador",commercial:"Reputação comercial"};
        const mainDelta=(row)=>{const entries=[...Object.entries(row.deltas?.traits||{}),...Object.entries(row.deltas?.reputation||{})].sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));return entries[0]?(deltaLabels[entries[0][0]]||entries[0][0])+" "+(entries[0][1]>0?"+":"")+entries[0][1]:"Escolha registrada";};
        return `<section class="card section player-personality-stage22"><div class="split"><div><div class="tag">PERSONALIDADE</div><h2>${esc(personality.dominantProfile)}</h2><p class="muted">Identidade formada pelas escolhas da carreira.</p></div><span class="pill">DINÂMICA</span></div><div class="profile-data personality-traits">${traits}</div><div class="grid section"><div class="personality-reputation"><div class="tag">REPUTAÇÃO</div><p><b>Geral:</b> ${Math.round(state.reputation)}/100</p><div class="profile-data"><span>Pública <b>${Math.round(personality.reputation.public)}</b></span><span>Vestiário <b>${Math.round(personality.reputation.dressingRoom)}</b></span><span>Treinador <b>${Math.round(personality.reputation.coach)}</b></span><span>Comercial <b>${Math.round(personality.reputation.commercial)}</b></span></div></div><div class="personality-media"><div class="tag">IMAGEM PÚBLICA</div><p><b>${esc(media.image)}</b></p><small>Pressão ${Math.round(media.pressure)} · Torcida ${Math.round(media.fanSentiment)} · Apelo comercial ${Math.round(media.sponsorAppeal)}</small></div></div><details class="personality-history"><summary><b>Histórico de personalidade</b></summary><div class="section">${history.length?history.map(row=>`<p><small>Dia ${row.day} · ${esc(row.source)}</small><br><b>${esc(row.label||row.choice)}</b> · ${esc(mainDelta(row))}${row.profileAfter!==row.profileBefore?` · perfil ${esc(row.profileAfter)}`:""}</p>`).join(""):'<p class="muted">Suas próximas escolhas formarão este histórico.</p>'}</div></details></section>`;
      })():"";
      return `<div class="subnav life-tabs"><a href="#life">Visão geral</a><a href="#life-finances">Finanças</a><a href="#life-assets">Patrimônio</a><a href="#life-activities">Atividades</a><a href="#life-family">Família</a><a href="#life-investments">Investimentos</a></div>
      ${personalityPanel}
      ${state.decision?`<section class="card notice section" id="current-decision"><div class="tag">DECISÃO PENDENTE</div><h2>${esc(state.decision.title)}</h2>${decisionMeta(state.decision)}<p>${esc(state.decision.body)}</p><div class="actions">${state.decision.choices.map(([id,label])=>`<button class="primary" data-choice="${esc(id)}">${esc(label)}</button>`).join("")}</div></section>`:""}
      <div class="stats"><div class="stat"><small>Bem-estar</small><b>${Math.round(f.wellbeing)}/100</b></div><div class="stat"><small>Saldo</small><b>${money(f.balance)}</b></div><div class="stat"><small>Patrimônio</small><b>${money(f.netWorth)}</b></div><div class="stat"><small>Salário atual</small><b>${money(f.salary)}/mês</b></div></div>
      <div class="grid"><section class="card"><div class="tag">VIDA PESSOAL</div><h2>Visão geral</h2>${(()=>{const b=D.birthdayDefaults?.(state);return b?`<p><b>Data de nascimento:</b> ${String(b.day).padStart(2,"0")}/${String(b.month).padStart(2,"0")}/${b.year} · <b>Idade:</b> ${state.person.age} anos</p>`:""})()}${state.decisionConsequences?.length?`<div class="card"><b>Última consequência</b><p>${state.decisionConsequences[0].summary}</p></div>`:""}${bar("Bem-estar",f.wellbeing)}${bar("Família",state.family)}${bar("Pressão e estresse",state.stress)}<p><b>Moradia:</b> ${esc(f.housing.type)}<br><b>Veículo principal:</b> ${f.vehicles[0]?esc(f.vehicles[0].name):"Nenhum"}<br><b>Estilo de vida:</b> ${esc(f.lifestyle)}</p><label>Estilo de vida<select id="life-style">${["SIMPLES","CONFORTÃVEL","ALTO PADRÃO","LUXO"].map(x=>`<option ${x===f.lifestyle?"selected":""}>${x}</option>`).join("")}</select></label><button data-action="life-style">Salvar estilo</button></section>
      <section class="card" id="life-finances"><div class="tag">FINANÇAS</div><h2>Conta pessoal</h2><p>O salário vem do contrato atual. Pagamentos e despesas são processados pelo calendário.</p><div class="profile-data"><span>Saldo <b>${money(f.balance)}</b></span><span>Renda contratual <b>${money(f.salary)}/mês</b></span><span>Investido <b>${money(f.investments.reduce((n,x)=>n+x.principal,0))}</b></span><span>Patrimônio líquido <b>${money(f.netWorth)}</b></span></div><h3>Últimas movimentações</h3>${ledger.length?ledger.map(t=>`<p><small>${dayDate(t.day)}</small> · ${esc(t.label)} · <b class="${t.amount>=0?"good":"bad"}">${money(t.amount)}</b></p>`).join(""):"<p class=muted>Sem movimentações.</p>"}</section></div>
      <section class="card section" id="life-assets"><div class="tag">PATRIMÔNIO</div><h2>Moradia, veículos e estilo de vida</h2><h3>Moradia atual: ${esc(f.housing.type)}</h3><div class="grid3">${D.Life.housing.map(x=>`<article class="card"><small>${x.mode==="rent"?"ALUGUEL":"COMPRA"}</small><h3>${esc(x.name)}</h3><b>${money(x.price)}</b><p>Custo mensal: ${money(x.monthly)}</p><button data-life-housing="${x.id}" ${state.wallet<x.price?"disabled":""}>${x.mode==="rent"?"Alugar":"Comprar"}</button></article>`).join("")}</div><h3 class="section">Veículos</h3><div class="grid3">${D.Life.vehicles.map(x=>{const own=f.vehicles.find(v=>v.id===x.id),locked=(x.tier||0)>f.tier;return `<article class="card"><small>${esc(x.category)} · nível ${x.tier||0}</small><h3>${esc(x.name)}</h3><b>${money(x.price)}</b><p>Valor atual: ${money(x.value)} · custo mensal ${money(x.monthly)}</p>${own?`<button data-life-sell-vehicle="${x.id}">Vender por ${money(x.value)}</button>`:`<button data-life-vehicle="${x.id}" ${state.wallet<x.price||locked?"disabled":""}>${locked?"Bloqueado pela carreira":"Comprar"}</button>`}</article>`}).join("")}</div><h3 class="section">Compras e serviços</h3><div class="grid3">${D.Life.purchases.map(x=>{const own=f.possessions.some(v=>v.id===x.id);return `<article class="card"><small>${esc(x.category)}</small><h3>${esc(x.name)}</h3><b>${money(x.price)}</b><p>${esc(x.benefit)}${x.monthly?` · mensal ${money(x.monthly)}`:""}</p><button data-life-purchase="${x.id}" ${own||state.wallet<x.price?"disabled":""}>${own?"Adquirido":"Adquirir"}</button></article>`}).join("")}</div></section>
      <div class="grid section"><section class="card" id="life-activities"><div class="tag">DIA LIVRE</div><h2>Atividades</h2><p>Atividades respeitam cooldown e têm consequências moderadas.</p><div class="actions"><button data-life-activity="rest">Descansar</button><button data-life-activity="family">Visitar família</button><button data-life-activity="friends">Sair com amigos</button></div></section><section class="card" id="life-family"><div class="tag">FAMÃLIA</div><h2>Relação pessoal</h2>${bar("Proximidade",state.family)}<p>Visitar a família melhora o bem-estar e reduz a pressão, mas respeita cooldown.</p></section></div>
      <section class="card section" id="unexpected-events-history"><div class="tag">ACONTECIMENTOS RECENTES</div><h2>Decisões fora de campo</h2>${unexpected.length?unexpected.map(row=>`<article class="news"><time>${dayDate(row.day)} · ${esc(row.category)} · ${esc(row.status)}</time><h3>${esc(row.title)}</h3><p><b>${esc(row.choiceLabel)}</b>${row.summary?` · ${esc(row.summary)}`:""}</p></article>`).join(""):empty("Nenhum acontecimento inesperado registrado nesta carreira.")}</section>
      <section class="card section" id="life-investments"><div class="tag">INVESTIMENTOS</div><h2>Oportunidades de investimento</h2><p class="muted">Prazos, risco e retorno variam por oportunidade. A maior parte tende a render; investimentos de maior risco têm pequena chance de perda.</p>${f.investments.length?`<h3>Ativos</h3><div class="grid3">${f.investments.map(x=>`<article class="card"><small>${esc(x.category||"Investimento")}</small><h3>${esc(x.name)}</h3><b>${money(x.principal)}</b><p>Vence em ${Math.max(0,x.maturesDay-state.day)} dias · retorno projetado ${(x.rate*100).toFixed(1)}%</p></article>`).join("")}</div>`:""}<h3>Novas oportunidades</h3><div class="grid3">${D.Life.investmentTypes.map(x=>`<article class="card"><small>${esc(x.category)} · risco ${x.risk===0?"baixo":x.risk===1?"moderado":"alto"}</small><h3>${esc(x.name)}</h3><p>Mínimo ${money(x.minimum)} · prazo ${x.months} meses · retorno projetado ${(x.rate*100).toFixed(1)}%</p><input id="invest-${x.id}" type="number" min="${x.minimum}" step="1000" value="${x.minimum}"><button data-life-invest="${x.id}" ${state.wallet<x.minimum?"disabled":""}>Investir</button></article>`).join("")}</div></section>`;
    },
    finance() {
      const c = D.club(state),
        e = Career.init(state),
        assets = Career.assetValue(state),
        cost = Career.upkeep(state);
      const commercial=state.mode==="player"?D.Commercial.summary(state,D):null;
      return `<div class="stats"><div class="stat"><small>Saldo disponível</small><b class="money-value">${money(state.wallet)}</b></div><div class="stat"><small>Bens pelo preço de compra</small><b class="money-value">${money(assets)}</b></div><div class="stat"><small>Patrimônio total</small><b class="money-value">${money(state.wallet + assets)}</b></div><div class="stat"><small>Receita de patrocínios</small><b class="money-value">${money(commercial?.revenue||0)}</b></div></div><div class="grid"><section class="card"><h2>Finanças pessoais</h2><p>Salário mensal: ${money(state.salary)}${state.clubId ? "" : " (sem vínculo: não recebido)"}<br>Patrocínios: ${money(commercial?.revenue||0)} acumulados · bônus ${money(commercial?.bonusRevenue||0)}<br>Despesas pessoais: ${money(state.mode === "coach" ? 2000 : 650)} / mês<br>Manutenção: ${money(cost)} / mês<br>Contrato: ${state.contract} dias</p><p class="muted">Toda receita comercial entra na mesma carteira e no mesmo extrato pessoal.</p></section><section class="card"><h2>Finanças do clube</h2>${c ? `<p>Orçamento disponível: <b>${money(c.budget)}</b><br>Custos mensais: ${money(22000)} + seu salário.</p><p class="muted">Compras pessoais usam apenas seu saldo; contratações usam o orçamento do clube.</p>` : empty("Sem clube atual.")}</section></div><section class="card section"><h2>Compras e patrimônio</h2><p class="chart-note">Valores e benefícios fictícios para a simulação. Sem pagamentos reais. Manutenção é cobrada no fechamento mensal.</p><div class="grid3 shop-grid">${Career.shop
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
      return `<div class="grid"><section class="card"><h2>Guarde sua história</h2><p>Autosave usa o armazenamento deste navegador. Trocar de navegador, mover o jogo ou limpar dados pode impedir recuperar esse save.</p><div class="actions"><button class="primary" data-action="export">Exportar arquivo JSON</button><button data-action="import">Importar save</button></div><p>Exporte ao encerrar e guarde o JSON numa pasta sua. A importação valida estrutura, versão e dados expandidos.</p><button data-action="careers">Selecionar outra carreira</button><button data-action="new" class="danger">Criar nova carreira</button></section><section class="card"><h2>Guia rápido</h2><p>1. Escolha uma proposta.<br>2. Configure treino ou tática.<br>3. Navegue por competições, estatísticas e prêmios.<br>4. Tome decisões de vida.<br>5. Exporte seu save.</p><p>Versão 0.4 inclui Séries A/B/C/D, cobertura parcial C/D, competições complementares, 27 atributos, estatísticas, prêmios e agência persistente.</p><p class="muted">Não há telemetria, conta, senha ou pagamentos reais.</p></section></div>`;
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
        const parsed = S.parse(await f.text());
        S.saveAsNew?.(parsed);
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

    if (b.dataset.targetClubSelect) {
      command("targetClub",{clubId:b.dataset.targetClubSelect});
      return;
    }

    if (b.dataset.worldMarketTab !== undefined) {
      worldMarketTab=b.dataset.worldMarketTab||"rumors";
      render();
      return;
    }

    if (b.dataset.worldLeague !== undefined) {
      worldCompetitionLeagueId=b.dataset.worldLeague||null;
      worldCompetitionRound=null;
      render();
      return;
    }

    if (b.dataset.worldRound !== undefined) {
      worldCompetitionRound=Number(b.dataset.worldRound)||null;
      render();
      return;
    }

    if (b.dataset.nationalCompetition) {
      nationalCompetitionId=b.dataset.nationalCompetition;
      render();

      requestAnimationFrame(()=>{
        document
          .getElementById("national-competition-hub")
          ?.scrollIntoView({
            behavior:"smooth",
            block:"start"
          });
      });

      return;
    }

    if (b.dataset.wcSquadTeam) {
      worldCupSquadTeamId=
        b.dataset.wcSquadTeam;

      render();

      requestAnimationFrame(()=>{
        document
          .getElementById(
            "wc-squad-hub"
          )
          ?.scrollIntoView({
            behavior:"smooth",
            block:"start"
          });
      });

      return;
    }
    if (b.dataset.loadSlot) {
      const loaded=S.loadSlot?.(b.dataset.loadSlot);
      if(!loaded){toast("Não foi possível carregar esta carreira.");return;}
      state=loaded; setup=false; page="home"; render(); return;
    }
    if (b.dataset.deleteSlot) {
      if(!confirm("Excluir esta carreira deste aparelho? Esta ação não pode ser desfeita.")) return;
      const deleting=b.dataset.deleteSlot, wasActive=S.activeId?.()===deleting;
      S.removeSlot?.(deleting); if(wasActive) state=null; render(); return;
    }
    if (b.dataset.renameSlot) {
      const slots=S.listSlots?.()||[], slot=slots.find(x=>x.id===b.dataset.renameSlot);
      const name=prompt("Nome desta carreira:",slot?.label||slot?.name||"Carreira");
      if(name!==null&&String(name).trim()) S.renameSlot?.(b.dataset.renameSlot,name);
      render(); return;
    }
    if (b.dataset.recentMatch !== undefined) {
      const x=(window.__proLifeRecentMatches||[])[Number(b.dataset.recentMatch)], box=document.getElementById("recent-match-detail");
      if(!x||!box) return;
      document.querySelectorAll("[data-recent-match]").forEach(el=>el.setAttribute("aria-expanded",el===b?"true":"false"));
      const goals=x.goals?.length ? x.goals.map(g=>`<div class="match-detail-event"><b>${g.minute}' ${esc(g.scorer)}</b>${g.assist?`<small>Assistência: ${esc(g.assist)}</small>`:""}</div>`).join("") : `<p class="muted">Sem gols na partida.</p>`;
      const hero=x.hero?.played ? `<div class="match-detail-hero"><b>Seu jogo</b><span>${x.hero.starter?"Titular":`Entrou aos ${x.hero.entryMinute}'`} · ${x.hero.minutes} min · ${x.hero.goals} gol${x.hero.goals===1?"":"s"} · ${x.hero.assists} assist. ${x.hero.rating?`· Nota ${x.hero.rating}`:""}</span></div>` : `<div class="match-detail-hero"><b>Seu jogo</b><span>Não participou desta partida.</span></div>`;
      box.innerHTML=`<div class="match-detail-head"><div><small>${esc(x.competition)}</small><b>${esc(x.home)} ${esc(x.score)} ${esc(x.away)}</b></div><button type="button" data-close-match-detail aria-label="Fechar">×</button></div>${hero}<div class="match-detail-grid"><div><small>Gols e assistências</small>${goals}</div><div><small>Melhor da partida</small>${x.motm?`<p><b>${esc(x.motm.name)}</b><br>Nota ${x.motm.rating}</p>`:`<p class="muted">Sem avaliação registrada.</p>`}</div></div>`;
      box.hidden=false; return;
    }
    if (b.hasAttribute("data-close-match-detail")) { const box=document.getElementById("recent-match-detail"); if(box) box.hidden=true; document.querySelectorAll("[data-recent-match]").forEach(el=>el.setAttribute("aria-expanded","false")); return; }
    if (b.hasAttribute("data-live-match")) {
      const next = D.nextCommitment(state);
      if (!next) { toast("Não há próximo jogo agendado."); return; }
      if (next.date !== state.day + 1) { toast("Use Simular até o jogo primeiro. O acompanhamento abre na véspera da partida."); return; }
      const before = next.national ? null : new Set(state.matches.map((m) => `${m.season}:${m.date}:${m.home}:${m.away}:${m.competitionId||m.leagueId||""}`));
      D.advance(state, 1);
      const played = next.national
        ? D.NationalTeam.init(state).lastMatchday
        : state.matches.find((m) => [m.home,m.away].includes(state.clubId) && m.date === state.day && !before.has(`${m.season}:${m.date}:${m.home}:${m.away}:${m.competitionId||m.leagueId||""}`));
      persist();
      render();
      if (!played || played.date !== state.day) { toast("A partida não pôde ser localizada no calendário deste dia."); return; }
      const home = next.national ? { name:played.homeName || "Brasil" } : D.club(state, played.home);
      const away = next.national ? { name:played.awayName || next.opponent } : D.club(state, played.away);
      window.ProLifeLiveMatch.start({ match: played, home, away });
      return;
    }
    if (b.dataset.stopClose !== undefined) { closeSimulationStop(); return; }
    if (b.dataset.stopGo) {
      const anchor=b.dataset.stopAnchor || "", destination=b.dataset.stopGo;
      closeSimulationStop();
      page=destination;
      if (page === "calendar" && !calendarMonth) calendarMonth=Calendar?.monthId(state);
      render();
      requestAnimationFrame(()=>{
        const target=anchor ? document.getElementById(anchor) : null;
        if(target){
          target.scrollIntoView({behavior:"smooth",block:"center"});
          target.classList.add("popup-decision-target");
          setTimeout(()=>target.classList.remove("popup-decision-target"),2200);
        } else window.scrollTo(0,0);
      });
      return;
    }
    if (b.dataset.stopChoice) { command("decide", { choice:b.dataset.stopChoice }); closeSimulationStop(); return; }
    if (b.dataset.stopInterview) { command("respondInterview", { id:b.dataset.stopInterview, choice:b.dataset.stopInterviewChoice }); closeSimulationStop(); return; }
    if (b.dataset.page) {
      page = b.dataset.page;
      if (page === "calendar" && !calendarMonth) calendarMonth = Calendar?.monthId(state);
      const target = b.dataset.target;
      render();
      if (target) {
        requestAnimationFrame(() => {
          const el = document.getElementById(target);
          if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("notice"); }
          else window.scrollTo(0, 0);
        });
      } else window.scrollTo(0, 0);
      return;
    }
    if (b.dataset.advance) {
      command("advance", { days: Number(b.dataset.advance) });
      return;
    }
    if (b.dataset.simulate) {
      const mode = b.dataset.simulate;
      if (mode === "season" && !confirm("Simular até o fim da temporada? Eventos, treinamentos, propostas e negociações de contrato serão resolvidos automaticamente e registrados no histórico.")) return;
      try {
        const result = A.execute(state, "simulateAdvance", { mode });
        persist();
        render();
        if (result?.stop) showSimulationStop(result.stop);
        else toast(mode === "nextCommitment" ? "Simulação pausada antes do próximo jogo." : mode === "nextMatch" ? "Próximo jogo processado." : mode === "season" ? "Temporada simulada." : "30 dias simulados.");
      } catch (err) { toast(err.message); }
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
      const rejectedId=b.dataset.reject, beforeClub=D.club(state), rejectedClub=state.clubs.find(c=>String(c.id)===String(rejectedId));
      state.rejectedTransfers ||= [];
      state.rejectedTransfers.push({player:state.person.name,from:beforeClub?.name||"",to:rejectedClub?.name||"",rejectedDay:Number(state.day)});
      command("reject", { id: rejectedId });
      const career=Career.init(state);
      if(Array.isArray(career.transfers)&&rejectedClub) career.transfers=career.transfers.filter(t=>!(t.player===state.person.name&&t.to===rejectedClub.name&&(!beforeClub||t.from===beforeClub.name)&&t.status!=="CONFIRMED"));
      persist(); render(); return;
    }
    if (b.dataset.dismissAgency) {
      const agent=Career.init(state).playerCareer.agent;
      const fee=Career.agencyExitFee(state,agent);

      const message=fee>0
        ? "Encerrar a representacao atual? A rescisao estimada e de "+money(fee)+"."
        : "Encerrar a representacao atual?";

      if(window.confirm(message)){
        command("dismissAgency");
      }

      return;
    }

    if (b.dataset.rejectAgencyOffer) {
      command(
        "rejectAgencyOffer",
        { id:b.dataset.rejectAgencyOffer }
      );
      return;
    }

    if (b.dataset.hireAgency) { command("hireAgency", { id:b.dataset.hireAgency }); return; }
    if (b.dataset.holdOffer) { command("holdOffer", { id:b.dataset.holdOffer }); return; }
    if (b.dataset.counter) {
      command("counterOffer", { id: b.dataset.counter });
      return;
    }
    if (b.dataset.messageRead) { command("markMessageRead", { id:b.dataset.messageRead }); return; }
    if (b.hasAttribute("data-start-coach-conversation")) {
      command("startCoachConversation");
      return;
    }

    if (b.dataset.coachConversationChoice) {
      command(
        "respondCoachConversation",
        { choiceId:b.dataset.coachConversationChoice }
      );
      return;
    }
    if (b.dataset.interview) { command("respondInterview", { id:b.dataset.interview, choice:b.dataset.interviewChoice }); return; }
    if (b.dataset.choice) {
      command("decide", { choice: b.dataset.choice });
      return;
    }
    if (b.dataset.physicalReturn) { command("physicalReturn", { choice:b.dataset.physicalReturn }); return; }
    if (b.dataset.lifeActivity) { command("lifeActivity", { id:b.dataset.lifeActivity }); return; }
    if (b.dataset.lifeHousing) { command("lifeHousing", { id:b.dataset.lifeHousing }); return; }
    if (b.dataset.lifeVehicle) { command("lifeVehicle", { id:b.dataset.lifeVehicle }); return; }
    if (b.dataset.lifeSellVehicle) { command("lifeSellVehicle", { id:b.dataset.lifeSellVehicle }); return; }
    if (b.dataset.lifeInvest) { command("lifeInvest", { id:b.dataset.lifeInvest, amount:Number($("#invest-"+b.dataset.lifeInvest)?.value||0) }); return; }
    if (b.dataset.lifePurchase) { command("lifePurchase", { id:b.dataset.lifePurchase }); return; }
    if (b.dataset.commercialAccept) {
      const id=b.dataset.commercialAccept;
      const commercial=D.Commercial.init(state,D);
      const proposal=commercial.proposals.find(p=>p.id===id&&p.status==="PROPOSTA");
      const current=proposal
        ? D.Commercial.active(state).find(x=>x.category===proposal.category&&x.brandId!==proposal.brandId&&(x.exclusive||proposal.exclusive))
        : null;

      if(current){
        const difference=proposal.amount-current.amount;
        const differenceText=difference>0
          ? `A nova proposta paga ${money(difference)} a mais por pagamento.`
          : difference<0
            ? `A nova proposta paga ${money(Math.abs(difference))} a menos por pagamento.`
            : "As duas propostas possuem o mesmo valor por pagamento.";

        const confirmed=window.confirm(
          `Trocar patrocinador de ${proposal.category}?

` +
          `Atual: ${current.brand} — ${money(current.amount)} por pagamento
` +
          `Nova: ${proposal.brand} — ${money(proposal.amount)} por pagamento

` +
          differenceText +
          `

Ao confirmar, o contrato com ${current.brand} será encerrado e ${proposal.brand} assumirá a categoria.`
        );

        if(!confirmed)return;
      }

      command("commercialAccept", { id });
      return;
    }
    if (b.dataset.commercialReject) { command("commercialReject", { id:b.dataset.commercialReject }); return; }
    if (b.dataset.commercialHold) { command("commercialHold", { id:b.dataset.commercialHold }); return; }
    if (b.dataset.commercialEvent) {
      const choice=b.dataset.commercialEventChoice;
      command("commercialEvent", { id:b.dataset.commercialEvent, choice });
      if(choice==="participate") toast("Presença confirmada. A atividade foi adicionada à agenda; o resultado chegará após a realização.");
      return;
    }
    if (b.dataset.commercialNegotiate) {
      const id=b.dataset.commercialNegotiate;
      command("commercialNegotiate", { id, amount:Number(document.getElementById("commercial-amount-"+id)?.value||0), durationDays:Number(document.getElementById("commercial-duration-"+id)?.value||0), bonus:Number(document.getElementById("commercial-bonus-"+id)?.value||0) });
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
    if (b.dataset.activateSpecialization) {
      command("activateSpecialization", { id: b.dataset.activateSpecialization });
      return;
    }
    if (b.dataset.unlockArchetypePerk) {
      command("unlockArchetypePerk", {
        id: b.dataset.unlockArchetypePerk
      });
      return;
    }

    if (b.dataset.activateArchetypePerk) {
      command("activateArchetypePerk", {
        id: b.dataset.activateArchetypePerk
      });
      return;
    }

    if (b.dataset.deactivateArchetypePerk) {
      command("deactivateArchetypePerk", {
        id: b.dataset.deactivateArchetypePerk
      });
      return;
    }
    switch (b.dataset.action) {
      case "life-style":
        command("lifeLifestyle", { value: $("#life-style")?.value || "SIMPLES" });
        break;
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
      case "guided":
        classicForm = false;
        window.ProLifeCreator?.reset();
        render();
        break;
      case "new":
      case "new-player":
        classicForm = false;
        window.ProLifeCreator?.reset();
        setup = true;
        render();
        break;
      case "new-coach":
        classicForm = true;
        setup = true;
        render();
        setTimeout(()=>{const mode=document.getElementById("mode");if(mode){mode.value="coach";mode.dispatchEvent(new Event("change",{bubbles:true}));}},0);
        break;
      case "careers":
        state = null; setup = false; S.clearActive?.(); render(); break;
      case "resume":
        if(!state){const id=S.activeId?.(); state=id?S.loadSlot?.(id):null;}
        setup = false;
        render();
        break;
      case "accept-renewal":
        command("acceptRenewal");
        break;
      case "request-renewal":
        command("requestRenewal");
        break;
      case "counter-renewal":
        command("counterRenewal", {
          salary: Number($("#renew-salary")?.value || 0),
          years: Number($("#renew-years")?.value || 0),
          signingBonus: Number($("#renew-bonus")?.value || 0),
          performanceBonus: Number($("#renew-performance")?.value || 0),
          role: $("#renew-role")?.value || "Titular",
        });
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
      case "target-club":
        if (!$("#target-club")?.value) return alert("Escolha um clube-alvo.");
        command("targetClub", { clubId: $("#target-club").value }); break;
      case "clear-target-club":
        command("clearTargetClub"); break;
      case "offer-prefs":
        command("offerPrefs", {
          leagues: [...document.querySelectorAll(".offer-league:checked")].map((el) => el.value),
          international: $("#offer-international")?.checked === true,
          clubLevel: $("#offer-club-level")?.value || "any",
        });
        break;
      case "train":
        command("train", {
          focus: $("#focus").value,
          intensity: $("#intensity").value,
          exerciseId: $("#exercise")?.value || undefined,
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

    const nationsDivisionButton=
      event.target.closest(
        "[data-nations-league-division]"
      );

    if(nationsDivisionButton){
      nationsLeagueDivision=
        nationsDivisionButton.dataset
          .nationsLeagueDivision||
        "A";

      render();
      return;
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

    const concacafDivisionButton=
      event.target.closest(
        "[data-concacaf-nations-division]"
      );

    if(concacafDivisionButton){
      concacafNationsLeagueDivision=
        concacafDivisionButton.dataset
          .concacafNationsDivision||
        "A";

      render();
      return;
    }

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

    const fifaSeriesVenueButton=
      event.target.closest(
        "[data-fifa-series-venue]"
      );

    if(fifaSeriesVenueButton){
      fifaSeriesVenueId=
        fifaSeriesVenueButton.dataset
          .fifaSeriesVenue||
        "AUSTRALIA";

      render();
      return;
    }

});
  document.addEventListener("change", (e) => {
    const worldMarketFilter = [
      ["worldMarketCountry","country"],
      ["worldMarketLeague","league"],
      ["worldMarketClub","club"],
      ["worldMarketPeriod","period"],
    ].find(([datasetKey])=>e.target.dataset?.[datasetKey]!==undefined);
    if(worldMarketFilter){
      const [,filterKey]=worldMarketFilter;
      worldMarketFilters={...worldMarketFilters,[filterKey]:e.target.value||"ALL"};
      if(filterKey==="country") worldMarketFilters.league="ALL";
      render();
      return;
    }
    if (["focus", "intensity", "exercise"].includes(e.target.id)) {
      const button = $("#training-action");
      if (button && button.dataset.trainedToday === "1") {
        const changed = $("#focus")?.value !== button.dataset.planFocus || $("#intensity")?.value !== button.dataset.planIntensity || ($("#exercise")?.value || "") !== button.dataset.planExercise;
        button.disabled = !changed;
        button.textContent = changed ? "Aplicar novo plano" : "Plano ativo · automático";
        const note = $("#training-plan-note");
        if (note) note.innerHTML = changed ? "<b>Alterações pendentes.</b> Aplique para usar esta rotina nos próximos dias." : note.innerHTML;
      }
      return;
    }
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

    const fifaSeriesVenueButton=
      event.target.closest(
        "[data-fifa-series-venue]"
      );

    if(fifaSeriesVenueButton){
      fifaSeriesVenueId=
        fifaSeriesVenueButton.dataset
          .fifaSeriesVenue||
        "AUSTRALIA";

      render();
      return;
    }

});
  render();
})();
