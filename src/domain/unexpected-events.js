(function (root) {
  "use strict";

  const VERSION = 1;
  const HISTORY_LIMIT = 80;
  const GLOBAL_COOLDOWN = 10;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));

  function initialRngState(s) {
    let value = ((Number(s.rng) >>> 0) ^ 0x9e3779b9 ^ ((Number(s.day) || 0) * 2654435761)) >>> 0;
    for (const char of String(s.person?.id || s.person?.name || "hero")) value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0;
    return value || 1;
  }

  function nextRandom(state) {
    let value = state.rngState >>> 0 || 1;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    state.rngState = value >>> 0;
    return state.rngState / 4294967296;
  }

  function recentRatings(s, limit = 5) {
    return (s.matches || [])
      .filter((match) => Number.isFinite(Number(match?.ratings?.hero)))
      .slice(0, limit)
      .map((match) => Number(match.ratings.hero));
  }

  function recentPerformance(s) {
    const ratings = recentRatings(s);
    const average = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 6.5;
    const recent = (s.matches || []).find((match) => Number.isFinite(Number(match?.ratings?.hero)));
    const goals = (recent?.events || []).filter((event) => event.type === "goal" && event.playerId === "hero").length;
    return { ratings, average, latest: ratings[0] || 0, goals };
  }

  function playerCareer(s) {
    return s.extras?.playerCareer || {};
  }

  function hasCurrentClub(s) {
    return Boolean(s.clubId && (s.clubs || []).some((club) => club.id === s.clubId));
  }

  function hasPositionRival(s) {
    const club = (s.clubs || []).find((item) => item.id === s.clubId);
    return Boolean(club?.roster?.some((player) => player.id !== "hero" && player.pos === s.person?.pos));
  }

  function familyActivityAge(s) {
    const day = s.life?.finance?.activityCooldowns?.family;
    return Number.isFinite(day) ? s.day - day : 45;
  }

  const catalog = [
    {
      id: "family_request", category: "VIDA PESSOAL", title: "Um compromisso importante em família",
      body: "Um familiar pediu sua presença em um compromisso importante que coincide com parte da rotina do clube.",
      weight: 10, cooldown: 45, deadline: 7, defaultChoice: "balance",
      eligible: (s) => Number(s.family) < 88 || Number(s.stress) >= 45,
      choices: [
        ["attend", "Comparecer", { family: 10, stress: -5, morale: 3, training: -2 }],
        ["balance", "Tentar conciliar", { family: 5, stress: 3, training: -1 }],
        ["career", "Priorizar a carreira", { family: -7, stress: 4, training: 2 }],
      ],
    },
    {
      id: "family_distance", category: "VIDA PESSOAL", title: "A distância começou a pesar",
      body: "A sequência intensa da temporada aumentou a saudade e a família sente sua ausência.",
      weight: 12, cooldown: 55, deadline: 7, defaultChoice: "call",
      eligible: (s) => Number(s.family) <= 58 || Number(s.stress) >= 68 || familyActivityAge(s) >= 35,
      choices: [
        ["visit_family", "Reservar um dia para a família", { family: 11, stress: -7, training: -2 }],
        ["call", "Organizar uma conversa longa", { family: 5, stress: -3 }],
        ["postpone", "Adiar até a agenda aliviar", { family: -5, stress: 3, training: 1 }],
      ],
    },
    {
      id: "training_conflict", category: "CLUBE", title: "Atrito durante o treino",
      body: "Um companheiro da sua posição contestou uma jogada e o clima ficou tenso no treinamento.",
      weight: 8, cooldown: 60, deadline: 5, defaultChoice: "private_talk",
      eligible: (s) => hasCurrentClub(s) && hasPositionRival(s),
      choices: [
        ["private_talk", "Conversar em particular", { morale: 2, stress: -2, trust: 1 }],
        ["firm_reply", "Responder com firmeza", { morale: 2, stress: 4, trust: -2, rep: -1 }],
        ["staff_help", "Procurar a comissão", { stress: -1, trust: 2, morale: -1 }],
      ],
    },
    {
      id: "teammate_support", category: "CLUBE", title: "Apoio no momento difícil",
      body: "Um companheiro experiente percebeu seu momento e ofereceu ajuda para recuperar a confiança.",
      weight: 11, cooldown: 50, deadline: 7, defaultChoice: "accept_support",
      eligible: (s) => hasCurrentClub(s) && (Number(s.person?.morale) <= 55 || Number(playerCareer(s).coachTrust) <= 48 || recentPerformance(s).average < 6.15 || Number(s.person?.injury) > 0),
      choices: [
        ["accept_support", "Aceitar o apoio", { morale: 7, stress: -5, trust: 1 }],
        ["solo_focus", "Preferir trabalhar sozinho", { morale: 2, stress: 1, training: 2 }],
        ["team_motivation", "Transformar em motivação coletiva", { morale: 5, rep: 1, trust: 2 }],
      ],
    },
    {
      id: "press_misquote", category: "IMPRENSA", title: "Declaração fora de contexto",
      body: "Uma frase sua foi recortada nas redes e ganhou um sentido diferente do que você pretendia.",
      weight: 8, cooldown: 65, deadline: 4, defaultChoice: "clarify",
      article: true,
      eligible: (s) => Number(s.reputation) >= 28 || Number(playerCareer(s).mediaProfile?.interviews) > 0,
      choices: [
        ["clarify", "Esclarecer com calma", { rep: 2, fans: 90, stress: 2, mediaFans: 3, mediaPressure: -2 }],
        ["ignore_press", "Ignorar a repercussão", { stress: -2, fans: -40, mediaPressure: 1 }],
        ["public_reply", "Responder publicamente", { rep: -1, fans: 160, stress: 6, mediaPressure: 5, controversy: 1 }],
      ],
    },
    {
      id: "dissatisfaction_rumor", category: "IMPRENSA", title: "Rumor sobre insatisfação",
      body: "A imprensa publicou que você estaria insatisfeito com seu espaço no clube.",
      weight: 7, cooldown: 75, deadline: 5, defaultChoice: "deny_rumor",
      article: true,
      eligible: (s) => hasCurrentClub(s) && (Number(playerCareer(s).coachTrust) < 55 || ["Reserva", "Banco", "Fora da relação"].includes(playerCareer(s).squadRole) || (playerCareer(s).interests || []).length > 0 || Number(s.contract) <= 180),
      choices: [
        ["deny_rumor", "Negar o rumor", { rep: 1, trust: 2, fans: 40, stress: -1 }],
        ["open_doors", "Manter as portas abertas", { rep: 1, trust: -2, fans: 70, stress: 2 }],
        ["ask_space", "Dizer que quer mais espaço", { morale: 2, trust: -3, fans: 110, stress: 3 }],
      ],
    },
    {
      id: "fan_pressure", category: "TORCIDA", title: "Cobrança nas redes",
      body: "Torcedores aumentaram a cobrança depois das últimas atuações e esperam uma resposta em campo.",
      weight: 10, cooldown: 45, deadline: 4, defaultChoice: "stay_silent",
      eligible: (s) => Number(s.reputation) >= 25 && (recentPerformance(s).average < 6.2 || Number(s.person?.morale) < 48),
      choices: [
        ["humble_reply", "Responder com humildade", { rep: 2, fans: 120, stress: 2, mediaFans: 3 }],
        ["stay_silent", "Não responder", { stress: -2, fans: -30 }],
        ["confident_reply", "Prometer uma reação", { morale: 3, fans: 180, stress: 6, mediaPressure: 3 }],
      ],
    },
    {
      id: "positive_viral", category: "TORCIDA", title: "Um momento viral positivo",
      body: "Um lance seu ganhou destaque e a torcida começou a compartilhar o momento nas redes.",
      weight: 7, cooldown: 70, deadline: 5, defaultChoice: "thank_team",
      article: true,
      eligible: (s) => recentPerformance(s).latest >= 7.7 || recentPerformance(s).goals > 0,
      choices: [
        ["share_moment", "Compartilhar o momento", { fans: 320, rep: 1, stress: 2, mediaFans: 4 }],
        ["thank_team", "Agradecer à equipe", { fans: 220, rep: 2, trust: 1, mediaFans: 3 }],
        ["keep_focus", "Ignorar e manter o foco", { morale: 2, stress: -2, training: 1 }],
      ],
    },
    {
      id: "club_event", category: "CLUBE", title: "Convite para evento do clube",
      body: "O clube convidou você para uma ação institucional com a comunidade local.",
      weight: 9, cooldown: 50, deadline: 6, defaultChoice: "partial_presence",
      eligible: (s) => hasCurrentClub(s),
      choices: [
        ["participate", "Participar de toda a ação", { fans: 240, rep: 2, stress: 4, board: 1 }],
        ["rest_instead", "Recusar para descansar", { fitness: 4, stress: -4, board: -1 }],
        ["partial_presence", "Fazer participação parcial", { fans: 110, rep: 1, stress: 1 }],
      ],
    },
    {
      id: "logistics_problem", category: "CARREIRA", title: "Imprevisto na logística",
      body: "Um atraso na viagem comprometeu parte da programação planejada para o dia.",
      weight: 12, cooldown: 40, deadline: 3, defaultChoice: "reorganize",
      eligible: (s) => hasCurrentClub(s) && (Number(s.stress) >= 35 || Number(s.person?.condition) <= 82),
      choices: [
        ["reorganize", "Reorganizar a agenda", { stress: 2, training: -1 }],
        ["take_rest", "Usar o tempo para descansar", { fitness: 5, stress: -4, training: -2 }],
        ["normal_routine", "Manter a rotina normal", { stress: 5, fitness: -2, training: 1 }],
      ],
    },
    {
      id: "charity_invite", category: "VIDA PESSOAL", title: "Convite para ação beneficente",
      body: "Uma organização local convidou você para apoiar uma ação beneficente fora dos gramados.",
      weight: 5, cooldown: 90, deadline: 8, defaultChoice: "remote_support",
      article: true,
      eligible: (s) => Number(s.reputation) >= 38 && Number(s.fans) >= 500,
      choices: [
        ["join_charity", "Participar pessoalmente", { rep: 4, fans: 300, morale: 4, stress: 3 }],
        ["remote_support", "Apoiar à distância", { rep: 2, fans: 140, morale: 1 }],
        ["decline_charity", "Recusar com discrição", { stress: -2, fans: -40 }],
      ],
    },
    {
      id: "recovery_emotion", category: "CARREIRA", title: "O peso emocional do retorno",
      body: "A volta após o período difícil trouxe ansiedade, mas também uma nova motivação.",
      weight: 6, cooldown: 85, deadline: 7, defaultChoice: "gradual_return",
      eligible: (s) => Boolean(s.person?.physical?.history?.length) && !Number(s.person?.injury) && Number(s.person?.morale) <= 72,
      choices: [
        ["share_recovery", "Compartilhar a recuperação", { morale: 5, fans: 170, rep: 1, stress: 2 }],
        ["gradual_return", "Trabalhar com calma", { morale: 3, stress: -5, fitness: 3 }],
        ["extra_work", "Acelerar o ritmo", { training: 2, fitness: -2, stress: 5 }],
      ],
    },
  ];

  function init(s) {
    s.extras ||= {};
    const old = s.extras.unexpectedEvents;
    if (!old || typeof old !== "object") {
      s.extras.unexpectedEvents = { version: VERSION, history: [], cooldowns: {}, processed: {}, lastEventDay: Number(s.day) || 0, rngState: initialRngState(s), stats: { created: 0, resolved: 0, expired: 0 } };
    }
    const state = s.extras.unexpectedEvents;
    state.version = VERSION;
    if (!Array.isArray(state.history)) state.history = [];
    state.history = state.history.slice(0, HISTORY_LIMIT);
    if (!state.cooldowns || typeof state.cooldowns !== "object" || Array.isArray(state.cooldowns)) state.cooldowns = {};
    if (!state.processed || typeof state.processed !== "object" || Array.isArray(state.processed)) state.processed = {};
    if (Object.keys(state.processed).length > HISTORY_LIMIT * 2) {
      const retained = new Set(state.history.map((row) => row.eventId));
      state.processed = Object.fromEntries(Object.entries(state.processed).filter(([id]) => retained.has(id)));
    }
    if (!Number.isFinite(state.lastEventDay)) state.lastEventDay = -9999;
    if (!Number.isFinite(state.rngState)) state.rngState = initialRngState(s);
    state.rngState = state.rngState >>> 0 || 1;
    if (!state.stats || typeof state.stats !== "object") state.stats = {};
    for (const key of ["created", "resolved", "expired"]) if (!Number.isFinite(state.stats[key])) state.stats[key] = 0;
    return state;
  }

  function eligible(template, s, options = {}) {
    if (!template || s.mode !== "player" || !s.person) return false;
    if (!options.ignoreDecision && s.decision) return false;
    const state = s.extras?.unexpectedEvents || { history: [], cooldowns: {}, lastEventDay: -9999 };
    if (!options.ignoreCooldown) {
      if (s.day - state.lastEventDay < GLOBAL_COOLDOWN) return false;
      if (s.day < Number(state.cooldowns[template.id] || -9999)) return false;
      if (state.history[0]?.eventType === template.id) return false;
    }
    return template.eligible(s);
  }

  function eligibleEvents(s, options = {}) {
    return catalog.filter((template) => eligible(template, s, options));
  }

  function isEligible(s, eventType, options = {}) {
    return eligible(catalog.find((template) => template.id === eventType), s, options);
  }

  function hasUrgentConflict(s, career, api) {
    const pc = career?.init(s)?.playerCareer;
    if (pc?.renewalOffer || (s.offers || []).some((offer) => offer.expires >= s.day)) return true;
    if ((career?.init(s)?.communications?.interviews || []).some((interview) => !interview.answered)) return true;
    const commercial = api?.Commercial?.init?.(s, api);
    return Boolean(
      (commercial?.proposals || []).some((proposal) => proposal.status === "PROPOSTA" && proposal.expires >= s.day) ||
      (commercial?.events || []).some((event) => ["AGENDADO", "REAGENDADO"].includes(event.status) && event.mandatory && event.day >= s.day),
    );
  }

  function weightedPick(items, rng) {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let cursor = rng.next() * total;
    for (const item of items) {
      cursor -= item.weight;
      if (cursor <= 0) return item;
    }
    return items[items.length - 1];
  }

  function create(s, eventType, career = root.ProLifeCareer, api = root.ProLife, options = {}) {
    const template = catalog.find((item) => item.id === eventType);
    if (!template) throw Error("Evento inesperado inexistente.");
    if (s.mode !== "player") return null;
    if (s.decision) return null;
    if (!options.force && !eligible(template, s)) return null;
    const state = init(s);
    const eventId = `unexpected_${s.season}_${s.day}_${template.id}`;
    if (state.processed[eventId]) return null;
    const decision = {
      id: eventId,
      source: "unexpected_event",
      eventType: template.id,
      category: template.category,
      title: template.title,
      body: template.body,
      choices: template.choices.map(([id, label]) => [id, label]),
      createdDay: s.day,
      deadline: s.day + template.deadline,
      eventId,
    };
    s.decision = decision;
    state.lastEventDay = s.day;
    state.cooldowns[template.id] = s.day + template.cooldown;
    state.stats.created++;
    career?.emitEvent?.(s, "UNEXPECTED_EVENT_CREATED", eventId, { eventType: template.id, category: template.category, deadline: decision.deadline });
    career?.addMessage?.(s, {
      category: template.category,
      sender: template.category === "IMPRENSA" ? "Assessoria de imprensa" : "Equipe de carreira",
      subject: template.title,
      body: template.body,
      priority: "IMPORTANTE",
      deadline: decision.deadline,
      action: { type: "decision", page: "life", anchor: "current-decision" },
      eventId,
    });
    return decision;
  }

  function force(s, eventType, career = root.ProLifeCareer, api = root.ProLife) {
    return create(s, eventType, career, api, { force: true });
  }

  function applyEffects(s, effects, api) {
    if (effects.family) s.family = clamp(Number(s.family) + effects.family, 0, 100);
    if (effects.stress) s.stress = clamp(Number(s.stress) + effects.stress, 0, 100);
    if (effects.morale) s.person.morale = clamp(Number(s.person.morale) + effects.morale, 0, 100);
    if (effects.rep) s.reputation = clamp(Number(s.reputation) + effects.rep, 0, 100);
    if (effects.fans) s.fans = clamp(Number(s.fans) + effects.fans, 0, 1e9);
    if (effects.training) s.trainingProgress = clamp(Number(s.trainingProgress) + effects.training, 0, 100);
    if (effects.fitness) {
      const next = clamp(Number(s.person.fitness ?? s.person.condition) + effects.fitness, 0, 100);
      s.person.fitness = next;
      s.person.condition = next;
    }
    if (effects.board) s.board = clamp(Number(s.board) + effects.board, 0, 100);
    if (effects.trust) {
      const pc = playerCareer(s);
      const before = clamp(pc.coachTrust, 0, 100);
      pc.coachTrust = clamp(before + effects.trust, 0, 100);
      api?.Squad?.recordTrustChange?.(s, "unexpected_event", before, pc.coachTrust, { reason: "Um acontecimento fora de campo repercutiu na relação com o treinador." });
    }
    if (effects.mediaFans || effects.mediaPressure || effects.controversy) {
      api?.Career?.updateMediaProfile?.(s, { fans: effects.mediaFans || 0, pressure: effects.mediaPressure || 0, controversy: effects.controversy || 0 });
    }
  }

  function resolve(s, choice, career = root.ProLifeCareer, api = root.ProLife, options = {}) {
    const decision = s.decision;
    const state = init(s);
    if (!decision || decision.source !== "unexpected_event") {
      const previous = state.history[0];
      if (previous && previous.choice === choice && state.processed[previous.eventId]) return previous;
      throw Error("Decisão inesperada indisponível.");
    }
    if (state.processed[decision.eventId]) {
      const previous = state.history.find((row) => row.eventId === decision.eventId) || null;
      s.decision = null;
      return previous;
    }
    const template = catalog.find((item) => item.id === decision.eventType);
    const selected = template?.choices.find(([id]) => id === choice);
    if (!template || !selected) throw Error("Decisão inválida.");
    const before = api?.decisionSnapshot ? api.decisionSnapshot(s) : null;
    applyEffects(s, selected[2], api);
    const consequence = before && api?.applyDecisionConsequence ? api.applyDecisionConsequence(s, decision, choice, before) : { delta: {}, summary: "Escolha registrada." };
    const status = options.expired ? "EXPIRED" : "RESOLVED";
    const row = {
      eventId: decision.eventId,
      eventType: template.id,
      day: s.day,
      season: s.season,
      category: template.category,
      title: template.title,
      choice,
      choiceLabel: selected[1],
      status,
      summary: consequence.summary || "Escolha registrada.",
      delta: consequence.delta || {},
    };
    state.history.unshift(row);
    state.history = state.history.slice(0, HISTORY_LIMIT);
    state.processed[decision.eventId] = status;
    if (options.expired) state.stats.expired++;
    else state.stats.resolved++;
    const resultId = `${decision.eventId}_result`;
    career?.emitEvent?.(s, options.expired ? "UNEXPECTED_EVENT_EXPIRED" : "UNEXPECTED_EVENT_RESOLVED", resultId, { eventType: template.id, choice, status, delta: row.delta });
    career?.addMessage?.(s, {
      category: template.category,
      sender: "Equipe de carreira",
      subject: options.expired ? `Prazo encerrado: ${template.title}` : `Desfecho: ${template.title}`,
      body: `${options.expired ? "A resposta segura foi aplicada ao fim do prazo" : `Você escolheu: ${selected[1]}`}. ${row.summary}`,
      priority: "NORMAL",
      eventId: resultId,
    });
    if (template.article) career?.addArticle?.(s, { category: template.category, title: template.title, body: `${selected[1]}. ${row.summary}`, eventId: resultId });
    s.decision = null;
    return row;
  }

  function expire(s, career = root.ProLifeCareer, api = root.ProLife) {
    const decision = s.decision;
    if (!decision || decision.source !== "unexpected_event" || !Number.isFinite(decision.deadline) || s.day <= decision.deadline) return null;
    const template = catalog.find((item) => item.id === decision.eventType);
    return resolve(s, template?.defaultChoice, career, api, { expired: true });
  }

  function daily(s, _sharedRng, career = root.ProLifeCareer, api = root.ProLife) {
    const state = init(s);
    expire(s, career, api);
    if (s.mode !== "player" || s.decision || hasUrgentConflict(s, career, api)) return null;
    const choices = eligibleEvents(s);
    if (!choices.length) return null;
    const daysSince = Math.max(0, s.day - state.lastEventDay - GLOBAL_COOLDOWN);
    const chance = Math.min(0.085, 0.025 + daysSince * 0.0015);
    if (nextRandom(state) >= chance) return null;
    return create(s, weightedPick(choices, { next: () => nextRandom(state) }).id, career, api);
  }

  function recent(s, limit = 8) {
    return init(s).history.slice(0, Math.max(0, limit));
  }

  const api = { VERSION, HISTORY_LIMIT, GLOBAL_COOLDOWN, catalog, init, eligible, isEligible, eligibleEvents, create, force, resolve, expire, daily, recent };
  root.ProLifeUnexpectedEvents = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
