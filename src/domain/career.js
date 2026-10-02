/* Career rules: windows, personal assets, press and the simulated news feed. */
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const windows = [
    { name: "Início do ano", start: 0, end: 58 },
    { name: "Meio do ano", start: 181, end: 242 },
    { name: "Final do ano", start: 318, end: 364 },
  ];
  const shop = [
    {
      id: "recovery",
      name: "Equipamento de recuperação",
      category: "Saúde",
      price: 1800,
      upkeep: 40,
      effect: "Recuperação física diária +1.",
      condition: 1,
    },
    {
      id: "bike",
      name: "Bicicleta urbana",
      category: "Mobilidade",
      price: 2500,
      upkeep: 30,
      effect: "Estresse -3 em cada fechamento mensal.",
      stress: -3,
    },
    {
      id: "car",
      name: "Carro compacto",
      category: "Veículos",
      price: 65000,
      upkeep: 650,
      effect: "Relação com a família +2 por mês.",
      family: 2,
    },
    {
      id: "sportscar",
      name: "Carro esportivo",
      category: "Veículos",
      price: 420000,
      upkeep: 2500,
      effect: "Seguidores +120 por mês.",
      fans: 120,
    },
    {
      id: "apartment",
      name: "Apartamento",
      category: "Imóveis",
      price: 280000,
      upkeep: 800,
      effect: "Estresse -6 e família +3 por mês.",
      stress: -6,
      family: 3,
    },
    {
      id: "house",
      name: "Casa com área de lazer",
      category: "Imóveis",
      price: 780000,
      upkeep: 1800,
      effect: "Estresse -10 e família +5 por mês.",
      stress: -10,
      family: 5,
    },
    {
      id: "gym",
      name: "Academia em casa",
      category: "Treino",
      price: 18000,
      upkeep: 120,
      effect: "Progresso diário de treinamento +0,15.",
      training: 0.15,
    },
  ];
  function init(s) {
    if (!s.extras)
      s.extras = {
        number: 10,
        assets: [],
        ledger: [],
        feed: [],
        transfers: [],
        promise: null,
        careerGoals: s.person.goals,
        careerMinutes: s.person.minutes,
        played: 0,
        ratingTotal: 0,
      };
    if (s.extras.postSequence === undefined) s.extras.postSequence = 0;
    if (!s.extras.offerPreferences)
      s.extras.offerPreferences = {
        leagues: ["serieA", "serieB", "serieC", "serieD"],
        clubLevel: "any",
      };
    if (!s.extras.playerCareer)
      s.extras.playerCareer = {
        coachTrust: 55,
        squadRole: "Rotação",
        starts: 0,
        benchGames: 0,
        objectivesMet: 0,
        objectivesTotal: 0,
        lastEvaluation: null,
        contract: null,
        marketValue: 0,
        interests: [],
        negotiations: 0,
        renewalOffer: null,
        agentStrategy: { priority: "balanced", stance: "open" },
        agentAdvice: null,
        mediaProfile: { image: "Equilibrada", pressure: 20, fanSentiment: 55, sponsorAppeal: 45, interviews: 0, controversies: 0 },
      };
    const pc = s.extras.playerCareer;
    if (pc.contract === undefined) pc.contract = null;
    if (!Array.isArray(pc.interests)) pc.interests = [];
    if (!Number.isFinite(pc.marketValue)) pc.marketValue = 0;
    if (!Number.isFinite(pc.negotiations)) pc.negotiations = 0;
    if (pc.renewalOffer === undefined) pc.renewalOffer = null;
    if (!pc.offensiveAnalytics) pc.offensiveAnalytics = { shots: 0, onTarget: 0, xg: 0, goals: 0, appearances: 0 };
    if (!pc.agentStrategy) pc.agentStrategy = { priority: "balanced", stance: "open" };
    if (pc.agentAdvice === undefined) pc.agentAdvice = null;
    if (!pc.mediaProfile) pc.mediaProfile = { image: "Equilibrada", pressure: 20, fanSentiment: 55, sponsorAppeal: 45, interviews: 0, controversies: 0 };
    if (!s.extras.legacy) s.extras.legacy = { rivalries: {}, records: {}, milestones: [], retired: false, retirement: null };
    const legacy = s.extras.legacy;
    if (!legacy.rivalries || typeof legacy.rivalries !== "object") legacy.rivalries = {};
    if (!legacy.records || typeof legacy.records !== "object") legacy.records = {};
    if (!Array.isArray(legacy.milestones)) legacy.milestones = [];
    if (legacy.retired === undefined) legacy.retired = false;
    if (legacy.retirement === undefined) legacy.retirement = null;
    if (!s.extras.livingWorld) s.extras.livingWorld = { headlines: [], managerChanges: [], injuries: [], suspensions: [], clubForm: {}, lastTick: -1 };
    const lw = s.extras.livingWorld;
    if (!Array.isArray(lw.headlines)) lw.headlines = [];
    if (!Array.isArray(lw.managerChanges)) lw.managerChanges = [];
    if (!Array.isArray(lw.injuries)) lw.injuries = [];
    if (!Array.isArray(lw.suspensions)) lw.suspensions = [];
    if (!lw.clubForm || typeof lw.clubForm !== "object") lw.clubForm = {};
    if (!Number.isFinite(lw.lastTick)) lw.lastTick = -1;
    updatePlayerRole(s);
    updateProfessionalCareer(s);
    if (s.careerTransferAvailableDay === undefined) {
      const club = s.clubs.find((c) => c.id === s.clubId);
      const signing = s.extras.transfers.find(
        (t) => t.player === s.person.name && t.to === club?.name,
      );
      const news = s.news.find(
        (n) =>
          n.title === "Contrato assinado" && n.body.includes(s.person.name),
      );
      s.careerTransferAvailableDay = club
        ? nextWindowDay(signing?.day ?? news?.day ?? s.day)
        : 0;
    }
    if (s.day < s.careerTransferAvailableDay) s.offers = [];
    return s.extras;
  }

  function updatePlayerRole(s) {
    const pc = s.extras?.playerCareer;
    if (!pc) return;
    const t = clamp(pc.coachTrust, 0, 100);
    pc.coachTrust = t;
    pc.squadRole = t >= 88 ? "Estrela" : t >= 74 ? "Importante" : t >= 58 ? "Titular" : t >= 42 ? "Rotação" : t >= 25 ? "Reserva" : "Fora dos planos";
  }
  function matchObjectives(s) {
    const pos = s.person.pos;
    return pos === "ATA" ? [{id:"rating",label:"Nota mínima 7,0"},{id:"goal",label:"Marcar ou dar assistência"}]
      : pos === "MEI" ? [{id:"rating",label:"Nota mínima 6,8"},{id:"assist",label:"Criar uma assistência"}]
      : pos === "DEF" ? [{id:"rating",label:"Nota mínima 6,7"},{id:"result",label:"Ajudar o time a não perder"}]
      : [{id:"rating",label:"Nota mínima 6,7"},{id:"result",label:"Ajudar o time a não perder"}];
  }

  function marketValue(s) {
    if (s.mode !== "player") return 0;
    const level = root.ProLife?.overall ? root.ProLife.overall(s.person) : Math.round(Object.values(s.person.attrs).slice(0,6).reduce((a,b)=>a+b,0)/6);
    const ageFactor = s.person.age <= 21 ? 1.35 : s.person.age <= 25 ? 1.2 : s.person.age <= 29 ? 1 : Math.max(.55, 1 - (s.person.age - 29) * .07);
    const rep = .65 + s.reputation / 90;
    const form = .8 + (s.person.morale || 50) / 250;
    return Math.max(50000, Math.round((level ** 3) * 18 * ageFactor * rep * form / 10000) * 10000);
  }
  function updateProfessionalCareer(s) {
    const pc = s.extras?.playerCareer;
    if (!pc || s.mode !== "player") return;
    pc.marketValue = marketValue(s);
    if (s.clubId && !pc.contract) {
      pc.contract = { clubId:s.clubId, signedDay:Math.max(0,s.day-(365-s.contract)), endDay:s.day+s.contract, durationDays:s.contract, salary:s.salary, signingBonus:0, role:pc.squadRole, type:"permanent" };
    }
    if (pc.contract && pc.contract.clubId === s.clubId) { pc.contract.salary=s.salary; }
    pc.interests = pc.interests.filter(x => x.expires >= s.day).slice(0,8);
  }
  function registerInterest(s, clubId, stage="Sondagem") {
    const pc=init(s).playerCareer;
    if (s.mode!=="player" || clubId===s.clubId) return;
    const old=pc.interests.find(x=>x.clubId===clubId);
    if(old){ old.stage=stage; old.expires=s.day+45; } else pc.interests.unshift({clubId,stage,day:s.day,expires:s.day+45});
    pc.interests=pc.interests.slice(0,8);
  }
  function agentAdvice(s) {
    const pc = init(s).playerCareer;
    if (s.mode !== "player") return null;
    const months = pc.contract ? Math.max(0, Math.ceil((pc.contract.endDay - s.day) / 30)) : 0;
    let action = "Manter opções abertas", reason = "Seu momento permite avaliar projetos antes de decidir.";
    if (!s.clubId) { action = "Buscar contrato"; reason = "Você está sem vínculo e deve priorizar uma proposta compatível com seu nível."; }
    else if (months <= 4) { action = "Definir futuro contratual"; reason = "Seu contrato está perto do fim; renovação e mercado ganham prioridade."; }
    else if (pc.coachTrust < 35) { action = s.person.age <= 23 ? "Buscar empréstimo" : "Considerar transferência"; reason = "A confiança do técnico está baixa e o tempo de jogo pode limitar sua evolução."; }
    else if (pc.squadRole === "Estrela" || pc.squadRole === "Importante") { action = "Valorizar o momento"; reason = "Você tem espaço no elenco; só vale mudar por um projeto claramente melhor para sua estratégia."; }
    const advice = { action, reason, day: s.day };
    pc.agentAdvice = advice;
    return advice;
  }
  function setAgentStrategy(s, strategy = {}) {
    const pc = init(s).playerCareer;
    const priorities = ["balanced", "playtime", "salary", "prestige", "development"];
    const stances = ["stay", "open", "loan", "leave"];
    pc.agentStrategy = {
      priority: priorities.includes(strategy.priority) ? strategy.priority : "balanced",
      stance: stances.includes(strategy.stance) ? strategy.stance : "open",
    };
    agentAdvice(s);
    post(s, "Carreira", "Agente", "Estratégia atualizada", `Prioridade: ${pc.agentStrategy.priority}. Postura no mercado: ${pc.agentStrategy.stance}.`);
    return pc.agentStrategy;
  }
  function progressInterest(s, rng, createOffers) {
    if (s.mode !== "player") return;
    const pc = init(s).playerCareer;
    const strategy = pc.agentStrategy || { priority:"balanced", stance:"open" };
    if (strategy.stance === "stay" && s.clubId && s.contract > 120) return;
    const active = pc.interests.filter(x => x.expires >= s.day);
    if (!active.length && canTransfer(s)) {
      const candidates = s.clubs.filter(c => c.id !== s.clubId);
      if (candidates.length) {
        const c = rng.pick(candidates); registerInterest(s,c.id,"Rumor");
        post(s,"Rumores","Agente","Rumor de mercado",`${c.name} acompanha sua situação. Ainda não houve contato oficial.`,"rumor");
      }
      return;
    }
    for (const interest of active.slice(0,3)) {
      const c = root.ProLife?.club(s, interest.clubId);
      if (!c) continue;
      if (interest.stage === "Rumor") { interest.stage="Sondagem"; interest.expires=s.day+45; post(s,"Carreira","Agente","Sondagem recebida",`${c.name} procurou seu agente para entender sua situação.`); }
      else if (interest.stage === "Sondagem") { interest.stage="Negociação"; interest.expires=s.day+35; pc.negotiations++; post(s,"Carreira","Agente","Negociação iniciada",`${c.name} avançou as conversas e discute um possível projeto para você.`); }
      else if (interest.stage === "Negociação" && canTransfer(s) && typeof createOffers === "function") {
        const offer = createOffers(s,rng,8).find(o=>o.clubId===interest.clubId);
        if (offer) {
          if (strategy.stance === "loan") offer.transferType="loan";
          if (strategy.priority === "salary") { offer.salary=Math.round(offer.salary*1.1/100)*100; offer.signingBonus=Math.round(offer.signingBonus*1.1/100)*100; }
          if (strategy.priority === "playtime") offer.squadRole="Titular";
          s.offers = s.offers.filter(o=>o.clubId!==offer.clubId); s.offers.push(offer);
          interest.stage="Oferta oficial"; interest.expires=offer.expires;
          post(s,"Carreira","Agente","Oferta oficial",`${c.name} transformou o interesse em proposta oficial.`);
        }
      }
    }
    agentAdvice(s);
  }

  function signContract(s, offer) {
    const pc=init(s).playerCareer;
    pc.contract={clubId:offer.clubId,signedDay:s.day,endDay:s.day+(offer.durationDays||730),durationDays:offer.durationDays||730,salary:offer.salary,signingBonus:offer.signingBonus||0,role:offer.squadRole||offer.role,type:offer.transferType||"permanent",...(offer.parentClubId?{parentClubId:offer.parentClubId,parentSalary:offer.parentSalary,parentContractRemaining:offer.parentContractRemaining}:{})};
    pc.negotiations=0; pc.interests=pc.interests.filter(x=>x.clubId!==offer.clubId);
    s.contract=offer.durationDays||730;
    if(offer.signingBonus) transaction(s,offer.signingBonus,"Luvas de assinatura");
  }

  function createRenewalOffer(s) {
    const pc=init(s).playerCareer;
    if(s.mode!=="player" || !s.clubId || s.contract<=0 || s.contract>120 || pc.renewalOffer) return null;
    const years = pc.coachTrust >= 75 ? 4 : pc.coachTrust >= 50 ? 3 : 2;
    const raise = 1.08 + (s.reputation/100)*.22 + (pc.coachTrust/100)*.12;
    pc.renewalOffer={clubId:s.clubId,salary:Math.round(s.salary*raise/100)*100,durationDays:years*365,signingBonus:Math.round(s.salary*(2+s.reputation/40)/100)*100,expires:s.day+30};
    post(s,"Carreira","Diretoria","Oferta de renovação",`Seu clube apresentou uma renovação por ${years} anos. A proposta fica disponível por 30 dias.`);
    return pc.renewalOffer;
  }
  function acceptRenewal(s) {
    const pc=init(s).playerCareer,o=pc.renewalOffer;
    if(!o || o.expires<s.day || o.clubId!==s.clubId) throw Error("Não há renovação disponível.");
    s.salary=o.salary; s.contract=o.durationDays;
    pc.contract={clubId:s.clubId,signedDay:s.day,endDay:s.day+o.durationDays,durationDays:o.durationDays,salary:o.salary,signingBonus:o.signingBonus,role:pc.squadRole,type:"permanent"};
    transaction(s,o.signingBonus,"Luvas de renovação"); pc.renewalOffer=null;
    post(s,"Carreira","Diretoria","Contrato renovado",`Novo vínculo assinado. Salário de R$ ${o.salary.toLocaleString("pt-BR")} por mês.`);
  }
  function rejectRenewal(s) {
    const pc=init(s).playerCareer; if(!pc.renewalOffer) throw Error("Não há renovação disponível."); pc.renewalOffer=null;
    post(s,"Carreira","Agente","Renovação recusada","Você decidiu não aceitar a proposta de renovação neste momento.");
  }

  function counterOffer(s, clubId) {
    const o=s.offers.find(x=>x.clubId===clubId && x.expires>=s.day);
    if(!o) throw Error("Esta proposta não está disponível.");
    if(o.negotiated) throw Error("Este clube já respondeu à sua contraproposta.");
    const pc=init(s).playerCareer, leverage=(s.reputation+(pc.coachTrust||50))/200;
    const raise=1.08+Math.min(.12,leverage*.12);
    o.salary=Math.round(o.salary*raise/100)*100; o.signingBonus=Math.round((o.signingBonus||o.salary)*1.15/100)*100; o.negotiated=true; pc.negotiations++;
    post(s,"Carreira","Agente","Contraproposta aceita",`O ${root.ProLife?.club(s,clubId)?.name||"clube"} melhorou salário e luvas. A oferta continua válida até o prazo original.`);
    return o;
  }

  function nextWindowDay(day) {
    const year = Math.floor(day / 365) * 365,
      current = day % 365;
    const next = windows.find((w) => w.start > current);
    return next ? year + next.start : year + 365;
  }
  function canTransfer(s) {
    init(s);
    return windowStatus(s).open && s.day >= s.careerTransferAvailableDay;
  }
  function windowStatus(s) {
    const day = s.day % 365,
      w = windows.find((w) => day >= w.start && day <= w.end);
    const next = windows.find((w) => w.start > day) || windows[0];
    return {
      open: !!w,
      name: w?.name || "Janela fechada",
      remaining: w ? w.end - day + 1 : (next.start - day + 365) % 365,
      next: next.name,
    };
  }
  function post(s, category, author, title, body, kind = "confirmed") {
    const e = init(s);
    e.feed.unshift({
      id: "post_" + ++e.postSequence,
      day: s.day,
      season: s.season,
      category,
      author,
      title,
      body,
      kind,
      liked: false,
      likes: Math.floor(s.fans / 20) + category.length,
    });
    e.feed = e.feed.slice(0, 160);
  }
  function transaction(s, amount, label) {
    const e = init(s);
    s.wallet += amount;
    e.ledger.unshift({ day: s.day, season: s.season, amount, label });
    e.ledger = e.ledger.slice(0, 120);
  }
  function assetValue(s) {
    return init(s).assets.reduce(
      (sum, id) => sum + (shop.find((x) => x.id === id)?.price || 0),
      0,
    );
  }
  function upkeep(s) {
    return init(s).assets.reduce(
      (sum, id) => sum + (shop.find((x) => x.id === id)?.upkeep || 0),
      0,
    );
  }
  function buy(s, id) {
    const item = shop.find((x) => x.id === id),
      e = init(s);
    if (!item) throw Error("Item indisponível.");
    if (e.assets.includes(id)) throw Error("Você já possui este item.");
    if (s.wallet < item.price) throw Error("Saldo insuficiente.");
    transaction(s, -item.price, "Compra: " + item.name);
    e.assets.push(id);
    post(
      s,
      "Vida pessoal",
      "Sua carreira",
      "Nova aquisição",
      s.person.name +
        " comprou " +
        item.name.toLowerCase() +
        ". " +
        item.effect,
    );
  }
  function sell(s, id) {
    const item = shop.find((x) => x.id === id),
      e = init(s);
    if (!item || !e.assets.includes(id))
      throw Error("Você não possui este item.");
    e.assets = e.assets.filter((x) => x !== id);
    transaction(s, Math.round(item.price * 0.7), "Venda: " + item.name);
  }
  function daily(s) {
    const e = init(s);
    for (const id of e.assets) {
      const item = shop.find((x) => x.id === id);
      s.person.condition = clamp(
        s.person.condition + (item?.condition || 0),
        0,
        100,
      );
      if (s.mode === "player" && !s.person.injury)
        s.trainingProgress += item?.training || 0;
    }
  }
  function monthly(s) {
    for (const id of init(s).assets) {
      const item = shop.find((x) => x.id === id);
      if (!item) continue;
      transaction(s, -item.upkeep, "Manutenção: " + item.name);
      s.stress = clamp(s.stress + (item.stress || 0), 0, 100);
      s.family = clamp(s.family + (item.family || 0), 0, 100);
      s.fans = clamp(s.fans + (item.fans || 0), 0, 1e9);
    }
  }
  function match(s, m) {
    const e = init(s);
    if (s.mode === "player" && s.clubId && (m.home === s.clubId || m.away === s.clubId)) {
      const opponentId = m.home === s.clubId ? m.away : m.home, opponent = s.clubs.find((c) => c.id === opponentId);
      if (opponent) {
        const r = e.legacy.rivalries[opponentId] || { clubId: opponentId, club: opponent.name, games: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, points: 0 };
        const own = m.home === s.clubId ? m.hg : m.ag, other = m.home === s.clubId ? m.ag : m.hg;
        const goals = m.events.filter((x) => x.type === "goal" && x.playerId === "hero").length;
        const assists = m.events.filter((x) => x.type === "goal" && x.assistPlayerId === "hero").length;
        r.games++; r.goals += goals; r.assists += assists; r.points += Math.max(0, goals * 4 + assists * 3 + (m.ratings.hero || 0) - 6);
        if (own > other) r.wins++; else if (own < other) r.losses++; else r.draws++;
        e.legacy.rivalries[opponentId] = r;
      }
    }
    if (s.mode === "player" && s.clubId) {
      const pc = e.playerCareer, played = !!m.ratings.hero;
      const own = m.home === s.clubId ? m.hg : m.ag, other = m.home === s.clubId ? m.ag : m.hg;
      if (played) {
        pc.starts++;
        const rating = m.ratings.hero || 0;
        const goals = m.events.filter((x) => x.type === "goal" && x.playerId === "hero").length;
        const assists = m.events.filter((x) => x.type === "goal" && x.assistPlayerId === "hero").length;
        const objectives = matchObjectives(s);
        const met = objectives.filter((o) => o.id === "rating" ? rating >= (s.person.pos === "ATA" ? 7 : s.person.pos === "MEI" ? 6.8 : 6.7) : o.id === "goal" ? goals + assists > 0 : o.id === "assist" ? assists > 0 : own >= other).length;
        pc.objectivesMet += met; pc.objectivesTotal += objectives.length;
        const delta = (rating >= 7.5 ? 5 : rating >= 6.8 ? 2 : rating < 6 ? -4 : 0) + met * 2 + (goals + assists) * 2;
        pc.coachTrust = clamp(pc.coachTrust + delta, 0, 100);
        s.person.morale = clamp(s.person.morale + (met === objectives.length ? 3 : met === 0 ? -2 : 1), 0, 100);
        const attack = m.offensiveStats?.hero || { shots: 0, onTarget: 0, xg: 0, goals };
        pc.offensiveAnalytics.shots += attack.shots || 0;
        pc.offensiveAnalytics.onTarget += attack.onTarget || 0;
        pc.offensiveAnalytics.xg += attack.xg || 0;
        pc.offensiveAnalytics.goals += goals;
        pc.offensiveAnalytics.appearances++;
        pc.lastEvaluation = { day:s.day, rating, met, total:objectives.length, goals, assists, shots:attack.shots||0, onTarget:attack.onTarget||0, xg:+(attack.xg||0).toFixed(2) };
      } else {
        pc.benchGames++;
        pc.coachTrust = clamp(pc.coachTrust - 1, 0, 100);
      }
      updatePlayerRole(s);
    }
    if (m.ratings.hero) {
      e.played++;
      e.ratingTotal += m.ratings.hero;
    }
    e.careerGoals += m.events.filter(
      (x) => x.type === "goal" && x.playerId === "hero",
    ).length;
    if (m.ratings.hero) e.careerMinutes += 90;
    const own = m.home === s.clubId ? m.hg : m.ag,
      other = m.home === s.clubId ? m.ag : m.hg;
    if (s.mode === "player") {
      const rating = m.ratings.hero || 0;
      updateMediaProfile(s, own > other ? { fans: 2, sponsor: rating >= 7.5 ? 2 : 0, pressure: -1 } : own < other ? { fans: -2, pressure: 3 } : { pressure: 1 });
    }
    if (e.promise) {
      e.promise.games--;
      if (own > other) e.promise.wins++;
      if (!e.promise.games) {
        const ok = e.promise.wins >= 2;
        s.reputation = clamp(s.reputation + (ok ? 4 : -3), 0, 100);
        s.board = clamp(s.board + (ok ? 5 : -7), 0, 100);
        s.person.morale = clamp(s.person.morale + (ok ? 4 : -5), 0, 100);
        s.stress = clamp(s.stress + (ok ? -5 : 8), 0, 100);
        post(
          s,
          "Imprensa",
          "Sala de imprensa",
          ok ? "Promessa cumprida" : "Cobrança pela entrevista",
          e.promise.wins +
            " vitória(s) nos últimos três jogos. " +
            (ok
              ? "A confiança aumentou."
              : "Torcida e diretoria esperavam mais."),
        );
        e.promise = null;
      }
    }
    post(
      s,
      "Torcida",
      "Arquibancada",
      own > other
        ? "Torcida celebra a vitória"
        : own < other
          ? "Torcida cobra reação"
          : "Empate divide opiniões",
      s.person.name +
        (m.ratings.hero
          ? " recebeu nota " + m.ratings.hero + "."
          : " acompanhou o jogo sem entrar em campo.") +
        " " +
        (own > other
          ? "A equipe ganhou confiança."
          : "O próximo compromisso será decisivo para a sequência."),
    );
  }
  function updateMediaProfile(s, delta = {}) {
    const pc = init(s).playerCareer, m = pc.mediaProfile;
    m.pressure = clamp(m.pressure + (delta.pressure || 0), 0, 100);
    m.fanSentiment = clamp(m.fanSentiment + (delta.fans || 0), 0, 100);
    m.sponsorAppeal = clamp(m.sponsorAppeal + (delta.sponsor || 0), 0, 100);
    if (delta.interview) m.interviews++;
    if (delta.controversy) m.controversies++;
    const rep = s.reputation;
    m.image = rep >= 80 && m.fanSentiment >= 70 ? "Referência" : rep >= 65 ? "Em alta" : m.controversies >= 3 || m.fanSentiment < 35 ? "Controversa" : rep < 35 ? "Em reconstrução" : "Equilibrada";
    return m;
  }
  function mediaProfile(s) { return updateMediaProfile(s); }
  function interview(s, choice) {
    const e = init(s);
    updateMediaProfile(s, choice === "humble" ? {pressure:-4,fans:5,sponsor:3,interview:1} : {pressure:10,fans:2,sponsor:-2,interview:1,controversy:1});
    if (choice === "humble") {
      s.fans = clamp(s.fans + 70, 0, 1e9);
      s.stress = clamp(s.stress - 3, 0, 100);
      post(
        s,
        "Imprensa",
        "Sala de imprensa",
        "Discurso de equilíbrio",
        s.person.name +
          ": “Vamos trabalhar um jogo de cada vez.” Moral +3; reputação +1; seguidores +70.",
      );
    }
    if (choice === "bold") {
      e.promise = { games: 3, wins: 0 };
      post(
        s,
        "Imprensa",
        "Sala de imprensa",
        "Promessa diante das câmeras",
        s.person.name +
          " promete uma reação. Meta: vencer dois dos próximos três jogos. Cumprir ou falhar altera reputação, moral e confiança da diretoria.",
      );
    }
  }
  function transfer(s, p, source, target, fee) {
    const e = init(s);
    e.transfers.unshift({
      day: s.day,
      season: s.season,
      player: p.name,
      from: source?.name || "Sem clube",
      to: target.name,
      fee,
      pos: p.pos || "—",
      salary: Math.max(1000, Math.round((fee ? fee / 120 : 1000) / 100) * 100),
    });
    e.transfers = e.transfers.slice(0, 100);
    post(
      s,
      "Transferências",
      "Central do mercado",
      "Transferência confirmada",
      p.name +
        ": " +
        (source?.name || "Sem clube") +
        " → " +
        target.name +
        (fee ? " por R$ " + fee.toLocaleString("pt-BR") : "") +
        ".",
    );
  }
  function world(s, rng, D) {
    const current = D.club(s),
      leader = D.table(s, current?.leagueId)[0];
    if (leader)
      post(
        s,
        "Competições",
        "Central das ligas",
        "Disputa pela liderança",
        leader.name +
          " lidera " +
          (s.leagues?.find((l) => l.id === leader.leagueId)?.name || "Liga Horizonte") +
          " com " + leader.stats.points + " pontos após " + leader.stats.played + " jogos.",
      );
    if (!windowStatus(s).open) return;
    const desired = { GOL: 2, DEF: 8, MEI: 8, ATA: 5 };
    const attempts = rng.int(2, 5);
    for (let attempt = 0; attempt < attempts; attempt++) {
      const targets = s.clubs
        .filter((c) => c.id !== s.clubId && c.roster.length < 42)
        .map((c) => {
          const needs = Object.keys(desired)
            .map((pos) => ({ pos, gap: Math.max(0, desired[pos] - c.roster.filter((p) => p.pos === pos).length) }))
            .filter((x) => x.gap > 0);
          return { c, needs };
        })
        .filter((x) => x.needs.length);
      if (!targets.length) break;
      const targetInfo = rng.pick(targets),
        need = rng.pick(targetInfo.needs),
        target = targetInfo.c;
      const sources = s.clubs.filter((c) => c.id !== target.id && c.id !== s.clubId && c.roster.length > 20);
      const candidates = sources.flatMap((source) =>
        source.roster
          .filter((p) => p.id !== "hero" && p.pos === need.pos && source.roster.filter((x) => x.pos === need.pos).length > Math.max(1, desired[need.pos] - 1))
          .filter((p) => target.structure + 16 >= D.overall(p))
          .map((p) => ({ source, p })),
      );
      if (!candidates.length) continue;
      const { source, p } = rng.pick(candidates),
        fee = Math.round((D.overall(p) ** 2 * 35 * (p.age < 23 ? 1.25 : p.age > 30 ? 0.72 : 1)) / 1000) * 1000;
      if (target.budget < fee) continue;
      source.roster = source.roster.filter((x) => x.id !== p.id);
      source.lineup = source.lineup.filter((x) => x !== p.id);
      target.roster.push(p);
      source.budget += fee;
      target.budget -= fee;
      transfer(s, p, source, target, fee);
    }
  }

  function livingWorld(s, rng, D) {
    const e = init(s), lw = e.livingWorld;
    if (lw.lastTick === s.day) return lw;
    lw.lastTick = s.day;
    const recent = (clubId) => s.matches.filter((m) => m.home === clubId || m.away === clubId).slice(0, 5);
    for (const c of s.clubs) {
      const ms = recent(c.id);
      let points = 0;
      for (const m of ms) {
        const gf = m.home === c.id ? m.hg : m.ag, ga = m.home === c.id ? m.ag : m.hg;
        points += gf > ga ? 3 : gf === ga ? 1 : 0;
      }
      lw.clubForm[c.id] = { games: ms.length, points, status: ms.length < 3 ? "Sem tendência" : points >= 11 ? "Grande fase" : points <= 3 ? "Em crise" : "Estável" };
    }
    const leagueClubs = s.clubs.filter((c) => c.stats?.played > 0);
    if (leagueClubs.length) {
      const hot = leagueClubs.slice().sort((a,b) => (b.stats.points - a.stats.points) || (b.stats.gf - a.stats.gf))[0];
      if (hot) {
        const body = `${hot.name} vive ${lw.clubForm[hot.id]?.status.toLowerCase() || "bom momento"} e soma ${hot.stats.points} pontos na temporada.`;
        lw.headlines.unshift({ day:s.day, season:s.season, type:"form", title:"Momento dos clubes", body, clubId:hot.id });
        post(s,"Mundo do futebol","Central PRO LIFE","Momento dos clubes",body);
      }
    }
    if (s.day > 0 && s.day % 28 === 0) {
      const candidates = s.clubs.filter((c) => c.id !== s.clubId && c.roster.some((p) => p.id !== "hero" && !p.injury));
      if (candidates.length && rng.next() < 0.65) {
        const c = rng.pick(candidates), pool = c.roster.filter((p) => p.id !== "hero" && !p.injury);
        const p = rng.pick(pool), days = rng.int(5, 24); p.injury = Math.max(p.injury || 0, days);
        const item={day:s.day,season:s.season,clubId:c.id,playerId:p.id,player:p.name,days}; lw.injuries.unshift(item); lw.injuries=lw.injuries.slice(0,40);
        post(s,"Mundo do futebol","Departamento médico","Baixa confirmada",`${p.name}, do ${c.name}, ficará fora por cerca de ${days} dias.`);
      }
    }
    if (s.day > 0 && s.day % 35 === 0) {
      const candidates=s.clubs.filter((c)=>c.id!==s.clubId && c.roster.some((p)=>p.id!=="hero" && !p.injury && !(p.suspension>0)));
      if(candidates.length && rng.next()<0.55){ const c=rng.pick(candidates), p=rng.pick(c.roster.filter((x)=>x.id!=="hero"&&!x.injury&&!(x.suspension>0))); p.suspension=1; const item={day:s.day,season:s.season,clubId:c.id,playerId:p.id,player:p.name,games:1}; lw.suspensions.unshift(item); lw.suspensions=lw.suspensions.slice(0,40); post(s,"Mundo do futebol","Tribunal esportivo","Suspensão",`${p.name}, do ${c.name}, cumprirá uma partida de suspensão.`); }
    }
    if (s.day > 0 && s.day % 56 === 0) {
      const crisis=s.clubs.filter((c)=>c.id!==s.clubId && lw.clubForm[c.id]?.status==="Em crise");
      if(crisis.length && rng.next()<0.45){ const c=rng.pick(crisis), item={day:s.day,season:s.season,clubId:c.id,club:c.name,reason:"sequência ruim"}; lw.managerChanges.unshift(item); lw.managerChanges=lw.managerChanges.slice(0,24); post(s,"Mundo do futebol","Noticiário dos clubes","Mudança no comando",`${c.name} mudou a comissão técnica após uma sequência ruim de resultados.`); }
    }
    lw.headlines = lw.headlines.slice(0, 50);
    return lw;
  }
  function livingWorldSnapshot(s) {
    const lw=init(s).livingWorld, c=s.clubs.find((x)=>x.id===s.clubId);
    const rivals = s.mode === "player" && c ? c.roster.filter((p)=>p.id!=="hero" && p.pos===s.person.pos).map((p)=>({name:p.name,overall:root.ProLife?.overall?root.ProLife.overall(p):0,injury:p.injury||0,suspension:p.suspension||0})).sort((a,b)=>b.overall-a.overall).slice(0,5) : [];
    return { ...lw, currentClubForm:c ? lw.clubForm[c.id] || null : null, positionRivals:rivals };
  }
  function legacySnapshot(s) {
    const e = init(s), n = s.nationalTeam || {}, heroStats = s.statistics?.players?.hero || {}, seasons = new Set((s.history || []).map((h) => h.season));
    const rivals = Object.values(e.legacy.rivalries).sort((a,b) => (b.points + b.games) - (a.points + a.games)).slice(0, 8);
    const titles = (s.history || []).filter((h) => !h.event && h.position === 1).length;
    const ownTransfers = (e.transfers || []).filter((t) => t.player === s.person.name);
    const clubs = [...new Set(ownTransfers.flatMap((t) => [t.from, t.to]).filter((name) => name && name !== "Sem clube"))];
    const biggestTransfer = ownTransfers.slice().sort((a,b) => (b.fee || 0) - (a.fee || 0))[0] || null;
    const awards = (s.statistics?.awards || s.awards || []).length || 0;
    const score = Math.round((e.careerGoals || 0) * 3 + (heroStats.assists || 0) * 2 + (e.played || 0) + titles * 80 + awards * 35 + (n.caps || 0) * 2 + (n.goals || 0) * 5 + s.reputation * 2);
    const tier = score >= 1800 ? "Lenda" : score >= 1000 ? "Ídolo" : score >= 500 ? "Referência" : score >= 200 ? "Destaque" : "Em construção";
    return { score, tier, seasons: seasons.size || 1, titles, awards, games: e.played || 0, goals: e.careerGoals || 0, assists: heroStats.assists || 0, offensiveAnalytics: e.playerCareer?.offensiveAnalytics || {shots:0,onTarget:0,xg:0,goals:0,appearances:0}, national: { caps:n.caps||0, goals:n.goals||0, assists:n.assists||0 }, clubs, biggestTransfer, rivals, milestones:e.legacy.milestones.slice(0,30), retired:e.legacy.retired, retirement:e.legacy.retirement };
  }
  function retirementSnapshot(s) {
    const e=init(s), snap=legacySnapshot(s);
    e.legacy.retired=true;
    e.legacy.retirement={ day:s.day, season:s.season, age:s.person.age, club:s.clubs.find((c)=>c.id===s.clubId)?.name||"Sem clube", ...snap, retired:true };
    return e.legacy.retirement;
  }
  function rumor(s, rng) {
    const clubs = s.clubs.filter((c) => c.id !== s.clubId);
    if (!clubs.length) return;
    post(
      s,
      "Rumores",
      "Rádio do mercado",
      "Nome nos bastidores",
      rng.pick(clubs).name +
        " observa o perfil de " +
        s.person.name +
        ". Nenhum acordo foi confirmado.",
      "rumor",
    );
  }
  const api = {
    init,
    windows,
    shop,
    windowStatus,
    nextWindowDay,
    canTransfer,
    post,
    transaction,
    assetValue,
    upkeep,
    buy,
    sell,
    daily,
    monthly,
    match,
    interview,
    transfer,
    world,
    rumor,
    marketValue,
    updateProfessionalCareer,
    registerInterest,
    signContract,
    counterOffer,
    createRenewalOffer,
    acceptRenewal,
    rejectRenewal,
    agentAdvice,
    setAgentStrategy,
    progressInterest,
    mediaProfile,
    updateMediaProfile,
    updatePlayerRole,
    matchObjectives,
    livingWorld,
    livingWorldSnapshot,
    legacySnapshot,
    retirementSnapshot,
  };
  root.ProLifeCareer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
