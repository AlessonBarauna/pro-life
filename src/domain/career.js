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
    if (!s.extras.communications) s.extras.communications = { version:1, sequence:0, events:[], processed:{}, messages:[], articles:[], interviews:[], responses:[] };
    const comm=s.extras.communications;
    if (!Number.isInteger(comm.sequence)) comm.sequence=0;
    for (const k of ["events","messages","articles","interviews","responses"]) if (!Array.isArray(comm[k])) comm[k]=[];
    if (!comm.processed || typeof comm.processed!=="object") comm.processed={};
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
    if (!pc.contractNotices || typeof pc.contractNotices !== "object") pc.contractNotices = {};
    if (!Number.isFinite(pc.lastRenewalRequestDay)) pc.lastRenewalRequestDay = -9999;
    if (!pc.offensiveAnalytics) pc.offensiveAnalytics = { shots: 0, onTarget: 0, xg: 0, goals: 0, appearances: 0 };
    if (!pc.agentStrategy) pc.agentStrategy = { priority: "balanced", stance: "open" };
    if (pc.agentAdvice === undefined) pc.agentAdvice = null;
    if (pc.targetClub === undefined) pc.targetClub = null;
    if (!pc.agent) pc.agent = { id:"prolife-base", name:"Rafael Nunes", agency:"Nunes Career", reputation:55, commission:5, network:"Brasil e América do Sul", negotiation:55, specialty:"Desenvolvimento de carreira", hiredDay:s.day };
    if (!pc.marketState) pc.marketState = { version:3, rejectionCooldowns:{}, signedAgreement:null, futureTransfer:null, lastInterestTick:-9999 };
    if (!pc.marketState.rejectionCooldowns) pc.marketState.rejectionCooldowns={};
    if (pc.marketState.signedAgreement === undefined) pc.marketState.signedAgreement=null;
    if (pc.marketState.futureTransfer === undefined) pc.marketState.futureTransfer=null;
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

  function playerOverall(s) {
    return root.ProLife?.overall ? root.ProLife.overall(s.person) : Math.round(Object.values(s.person.attrs).slice(0,6).reduce((a,b)=>a+b,0)/6);
  }
  function marketValue(s) {
    if (s.mode !== "player") return 0;
    const level = playerOverall(s);
    const ageFactor = s.person.age <= 20 ? 1.32 : s.person.age <= 23 ? 1.22 : s.person.age <= 27 ? 1.08 : s.person.age <= 30 ? .96 : Math.max(.42, .96 - (s.person.age - 30) * .085);
    const rep = .78 + (s.reputation || 0) / 180;
    const form = .88 + (s.person.morale || 50) / 420;
    const base = 1000000 * Math.pow(1.12, level - 55);
    return Math.max(250000, Math.round(base * ageFactor * rep * form / 100000) * 100000);
  }
  function realisticSalary(s, clubId = s.clubId) {
    if (s.mode !== "player") return s.salary || 0;
    const level = playerOverall(s);
    const c = root.ProLife?.club ? root.ProLife.club(s, clubId) : null;
    const clubFactor = .55 + ((c?.structure || 50) / 100) * .9;
    const repFactor = .78 + (s.reputation || 0) / 220;
    const ageFactor = s.person.age <= 20 ? .72 : s.person.age <= 23 ? .88 : s.person.age <= 31 ? 1 : .9;
    const roleFactor = {"Estrela":1.18,"Importante":1.08,"Titular":1,"Rotação":.82,"Reserva":.65,"Fora dos planos":.55}[s.extras?.playerCareer?.squadRole] || 1;
    const base = 5000 * Math.pow(1.13, level - 55);
    return Math.max(2500, Math.round(base * clubFactor * repFactor * ageFactor * roleFactor / 1000) * 1000);
  }
  function transferValue(s, source = null, target = null, type = "permanent") {
    if (s.mode !== "player" || !source || type === "free") return 0;
    const value = marketValue(s);
    if (type === "loan") return Math.round(value * .045 / 100000) * 100000;
    const pc = init(s).playerCareer;
    const remaining = pc.contract ? Math.max(0, pc.contract.endDay - s.day) : Math.max(0, s.contract || 0);
    if (remaining <= 0) return 0;
    const contractFactor = remaining < 180 ? .55 : remaining < 365 ? .72 : remaining < 730 ? .9 : 1.06;
    const buyerFactor = .92 + ((target?.structure || 50) / 100) * .22;
    return Math.max(100000, Math.round(value * contractFactor * buyerFactor / 100000) * 100000);
  }
  function updateProfessionalCareer(s) {
    const pc = s.extras?.playerCareer;
    if (!pc || s.mode !== "player") return;
    pc.marketValue = marketValue(s);
    if (!Number.isFinite(pc.economyVersion) || pc.economyVersion < 2) {
      const fair = realisticSalary(s);
      if (s.clubId && s.salary < fair * .35) s.salary = Math.round(fair * .65 / 1000) * 1000;
      pc.economyVersion = 2;
      const own = (s.extras.transfers || []).find(t => t.player === s.person.name && t.to === root.ProLife?.club(s)?.name);
      if (own) {
        if (own.salary <= 1500) own.salary = s.salary;
        if (!own.marketValue) own.marketValue = pc.marketValue;
        if (!own.fee && own.from !== "Sem clube" && pc.contract?.type !== "loan") own.fee = Math.round(pc.marketValue * .85 / 100000) * 100000;
      }
    }
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
  function targetClubAssessment(s, clubId) {
    const pc=init(s).playerCareer, c=root.ProLife?.club(s,clubId);
    if(s.mode!=="player" || !c || clubId===s.clubId) return null;
    const ov=playerOverall(s), required=Math.round(54+(c.structure||50)*.34);
    const perf=(pc.lastEvaluation?.rating||6.5)*7 + (s.reputation||0)*.22 + (pc.coachTrust||50)*.12;
    const score=Math.round(ov*.62+perf*.38), gap=Math.max(0,required-score);
    return {clubId,score,required,gap,realistic:gap<=8,label:gap===0?"Perfil compatível":gap<=5?"No radar":gap<=10?"Objetivo ambicioso":"Distante no momento"};
  }
  function setTargetClub(s, clubId) {
    const pc=init(s).playerCareer, a=targetClubAssessment(s,clubId);
    if(!a) throw Error("Clube-alvo inválido.");
    pc.targetClub={clubId,selectedDay:s.day,assessment:a}; registerInterest(s,clubId,a.gap<=4?"Sondagem":"Rumor");
    const c=root.ProLife?.club(s,clubId); post(s,"Carreira","Agente","Novo clube-alvo",`${c.name} virou seu objetivo de carreira. Avaliação do agente: ${a.label}.`); return pc.targetClub;
  }
  function clearTargetClub(s) { const pc=init(s).playerCareer; pc.targetClub=null; return null; }
  function progressInterest(s, rng, createOffers) {
    if (s.mode !== "player") return;
    const pc = init(s).playerCareer;
    const strategy = pc.agentStrategy || { priority:"balanced", stance:"open" };
    if (strategy.stance === "stay" && s.clubId && s.contract > 120) return;
    const active = pc.interests.filter(x => x.expires >= s.day);
    if (!active.length && canTransfer(s)) {
      const candidates = s.clubs.filter(c => c.id !== s.clubId);
      if (candidates.length) {
        const c = (pc.targetClub && candidates.find(x=>x.id===pc.targetClub.clubId)) || rng.pick(candidates); registerInterest(s,c.id,"Rumor");
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

  function renewalTerms(s, requested = null) {
    const pc=init(s).playerCareer;
    const years = requested?.years || (pc.coachTrust >= 75 ? 4 : pc.coachTrust >= 50 ? 3 : 2);
    const raise = 1.08 + (s.reputation/100)*.22 + (pc.coachTrust/100)*.12;
    const fairSalary = realisticSalary(s);
    const baseSalary=Math.round(Math.max(s.salary*raise, fairSalary*.92)/1000)*1000;
    const role = requested?.role || (pc.coachTrust >= 88 ? "Estrela" : pc.coachTrust >= 70 ? "Importante" : pc.squadRole);
    return { clubId:s.clubId, salary:requested?.salary || baseSalary, durationDays:years*365, signingBonus:requested?.signingBonus || Math.round(s.salary*(2+s.reputation/40)/100)*100, performanceBonus:requested?.performanceBonus || Math.round(baseSalary*.45/100)*100, role, expires:s.day+30, round:requested?.round || 0, source:requested?.source || "club" };
  }
  function createRenewalOffer(s, requested = null) {
    const pc=init(s).playerCareer;
    if(s.mode!=="player" || !s.clubId || s.contract<=0 || (s.contract>180 && !requested) || pc.renewalOffer) return null;
    pc.renewalOffer=renewalTerms(s, requested);
    post(s,"Carreira","Diretoria","Oferta de renovação",`O clube apresentou uma proposta de renovação por ${Math.round(pc.renewalOffer.durationDays/365)} anos, salário de R$ ${pc.renewalOffer.salary.toLocaleString("pt-BR")}/mês, bônus de assinatura e bônus por desempenho. Negocie pela Caixa de Entrada.`);
    return pc.renewalOffer;
  }
  function requestRenewal(s) {
    const pc=init(s).playerCareer;
    if(s.mode!=="player" || !s.clubId || s.contract<=0) throw Error("Você não possui contrato ativo.");
    if(s.contract>365) throw Error("Seu vínculo ainda tem mais de um ano. O clube não abriu negociação agora.");
    if(pc.renewalOffer) return pc.renewalOffer;
    if(s.day-pc.lastRenewalRequestDay<30) throw Error("Seu agente já procurou o clube recentemente.");
    pc.lastRenewalRequestDay=s.day;
    const leverage=(pc.coachTrust*.45+s.reputation*.3+(s.person.morale||50)*.25);
    if(leverage<38){ post(s,"Carreira","Agente","Renovação ainda sem acordo","Seu agente procurou a diretoria, mas o clube prefere esperar antes de apresentar termos."); return null; }
    post(s,"Carreira","Agente","Conversas de renovação abertas","Seu agente procurou a diretoria e abriu negociação para ampliar seu vínculo.");
    return createRenewalOffer(s,{source:"agent"});
  }
  function counterRenewal(s, terms={}) {
    const pc=init(s).playerCareer,o=pc.renewalOffer;
    if(!o || o.expires<s.day) throw Error("Não há renovação disponível.");
    if((o.round||0)>=2) throw Error("A negociação chegou à proposta final do clube.");
    const salary=Math.max(o.salary,Math.round(Number(terms.salary||o.salary)/100)*100);
    const years=Math.max(1,Math.min(5,Number(terms.years||Math.round(o.durationDays/365))));
    const signingBonus=Math.max(o.signingBonus,Math.round(Number(terms.signingBonus||o.signingBonus)/100)*100);
    const performanceBonus=Math.max(o.performanceBonus||0,Math.round(Number(terms.performanceBonus||o.performanceBonus||0)/100)*100);
    const role=["Rotação","Titular","Importante","Estrela"].includes(terms.role)?terms.role:o.role;
    const demand=(salary/Math.max(1,o.salary)-1)*80+(signingBonus/Math.max(1,o.signingBonus)-1)*20+(role==="Estrela"?10:role==="Importante"?5:0);
    const leverage=(pc.coachTrust*.5+s.reputation*.3+(s.person.morale||50)*.2)/100;
    const accepted=demand <= 8+leverage*18;
    if(accepted){ pc.renewalOffer={...o,salary,durationDays:years*365,signingBonus,performanceBonus,role,round:(o.round||0)+1,source:"counter",expires:s.day+21}; post(s,"Carreira","Agente","Contraproposta aceita",`O clube aceitou os termos negociados pelo seu agente. A nova proposta está pronta para assinatura.`); }
    else { pc.renewalOffer={...o,salary:Math.round(o.salary*(1.03+leverage*.03)/100)*100,signingBonus:Math.round(o.signingBonus*1.05/100)*100,performanceBonus:Math.round((o.performanceBonus||0)*1.05/100)*100,round:(o.round||0)+1,source:"club-final",expires:s.day+14}; post(s,"Carreira","Diretoria","Clube responde à contraproposta","A diretoria não aceitou todos os termos e enviou uma proposta revisada."); }
    return pc.renewalOffer;
  }
  function acceptRenewal(s) {
    const pc=init(s).playerCareer,o=pc.renewalOffer;
    if(!o || o.expires<s.day || o.clubId!==s.clubId) throw Error("Não há renovação disponível.");
    s.salary=o.salary; s.contract=o.durationDays;
    pc.contract={clubId:s.clubId,signedDay:s.day,endDay:s.day+o.durationDays,durationDays:o.durationDays,salary:o.salary,signingBonus:o.signingBonus,performanceBonus:o.performanceBonus||0,role:o.role||pc.squadRole,type:"permanent"};
    transaction(s,o.signingBonus,"Luvas de renovação"); pc.renewalOffer=null;
    post(s,"Carreira","Diretoria","Contrato renovado",`Novo vínculo assinado. Salário de R$ ${o.salary.toLocaleString("pt-BR")} por mês · papel ${o.role||pc.squadRole} · bônus por desempenho R$ ${(o.performanceBonus||0).toLocaleString("pt-BR")}.`);
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


  const agencies = [
    {id:"nunes",name:"Nunes Career",reputation:55,commission:4,network:"Brasil e América do Sul",negotiation:55,specialty:"Jovens e desenvolvimento"},
    {id:"atlas",name:"Atlas Football",reputation:72,commission:7,network:"América do Sul e Europa",negotiation:72,specialty:"Carreira internacional"},
    {id:"prime",name:"Prime Eleven",reputation:64,commission:6,network:"Brasil e mercados intermediários",negotiation:65,specialty:"Negociação contratual"}
  ];
  function hireAgency(s,id){ const pc=init(s).playerCareer,a=agencies.find(x=>x.id===id); if(!a) throw Error("Agência inválida."); if(Number.isFinite(pc.agent?.changedDay) && s.day-pc.agent.changedDay<180) throw Error("Seu vínculo com a agência atual ainda está no período mínimo."); pc.agent={...a,name:a.name,agency:a.name,hiredDay:s.day,changedDay:s.day}; post(s,"Carreira","Agente","Representação definida",`${a.name} passa a representar sua carreira. Comissão ${a.commission}% · rede ${a.network}.`); return pc.agent; }
  function clubLevel(c) { return Math.round((c?.structure || 50) * .7 + Math.min(30, ((c?.roster || []).reduce((a,p)=>a+(root.ProLife?.overall?root.ProLife.overall(p):60),0)/Math.max(1,(c?.roster||[]).length)-55)*2)); }
  function positionCompetition(s,c){ const peers=(c?.roster||[]).filter(p=>p.id!=="hero"&&p.pos===s.person.pos).map(p=>root.ProLife?.overall?root.ProLife.overall(p):60).sort((a,b)=>b-a); return {best:peers[0]||55, depth:peers.length}; }
  function sportingReputation(s){ const pc=init(s).playerCareer, st=s.statistics?.players?.hero||{}; return clamp(Math.round(playerOverall(s)*.48+(s.reputation||0)*.22+(pc.coachTrust||50)*.12+Math.min(18,(st.goals||0)*.7+(st.assists||0)*.5)),0,100); }
  function interestAssessment(s,clubId){ const c=root.ProLife?.club(s,clubId); if(!c||clubId===s.clubId) return null; const pc=init(s).playerCareer, ov=playerOverall(s), comp=positionCompetition(s,c), level=clubLevel(c), rep=sportingReputation(s), age=s.person.age; const ageBonus=age<=21?6:age<=25?3:age>=32?-5:0; const form=((pc.lastEvaluation?.rating||6.5)-6.5)*7; const need=Math.max(-18,Math.min(18,(ov-comp.best)*2.4 + (5-comp.depth)*1.5)); const levelGap=Math.abs(level-(ov+rep*.18)); const fit=Math.max(-20,18-levelGap*.8); const score=clamp(Math.round(28+rep*.28+form+ageBonus+need+fit),0,100); return {clubId,score,label:score>=72?"ALTO":score>=48?"MÉDIO":"BAIXO",clubLevel:level,bestRival:comp.best,competition:comp.best>=ov+5?"Alta":comp.best>=ov-2?"Média":"Favorável",recommendedOverall:Math.max(55,comp.best-1),sportingReputation:rep}; }
  function nextWindowStart(day){ const year=Math.floor(day/365)*365,current=day%365; const w=windows.find(x=>x.start>current); return w?year+w.start:year+365+windows[0].start; }
  function holdOffer(s,clubId){ const o=s.offers.find(x=>x.clubId===clubId&&x.expires>=s.day); if(!o) throw Error("Esta proposta não está disponível."); o.expires=Math.max(o.expires,s.day+7); o.onHold=true; post(s,"Carreira","Agente","Mais tempo para decidir",`Seu agente conseguiu prazo até o dia ${o.expires} para responder.`); return o; }
  function rejectOffer(s,clubId){ const i=s.offers.findIndex(x=>x.clubId===clubId&&x.expires>=s.day); if(i<0) throw Error("Esta proposta não está disponível."); const o=s.offers.splice(i,1)[0],pc=init(s).playerCareer; pc.marketState.rejectionCooldowns[clubId]=s.day+60; const it=pc.interests.find(x=>x.clubId===clubId); if(it){it.stage="Recusado";it.expires=s.day+60;} post(s,"Carreira","Agente","Proposta recusada",`A proposta de ${root.ProLife?.club(s,clubId)?.name||"clube"} foi recusada. Um novo contato não é esperado no curto prazo.`); return o; }
  function signAgreement(s,offer){ const pc=init(s).playerCareer; if(pc.marketState.signedAgreement) throw Error("Você já possui um acordo assinado pendente."); const startDay=windowStatus(s).open?s.day:nextWindowStart(s.day); pc.marketState.signedAgreement={...offer,agreedDay:s.day,startDay,status:startDay===s.day?"ready":"scheduled"}; pc.marketState.futureTransfer=startDay>s.day?{clubId:offer.clubId,startDay,agreedDay:s.day}:null; s.offers=s.offers.filter(x=>x.clubId===offer.clubId); post(s,"Transferências","Agente",startDay>s.day?"Transferência acordada":"Acordo assinado",`${root.ProLife?.club(s,offer.clubId)?.name||"Clube"} e jogador chegaram a um acordo. ${startDay>s.day?`A mudança será efetivada no dia ${startDay}.`:"A transferência pode ser efetivada agora."}`); return pc.marketState.signedAgreement; }
  function clearAgreement(s){ const pc=init(s).playerCareer; pc.marketState.signedAgreement=null; pc.marketState.futureTransfer=null; }
  function marketTick(s){ const pc=init(s).playerCareer; for(const o of s.offers||[]) if(o.expires<s.day){ const it=pc.interests.find(x=>x.clubId===o.clubId); if(it&&it.stage==="Oferta oficial") it.stage="Encerrado"; } s.offers=(s.offers||[]).filter(o=>o.expires>=s.day); const a=pc.marketState.signedAgreement; return a&&a.startDay<=s.day?a:null; }

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
  function eventId(type, parts) {
    return [type, ...parts].map((x)=>String(x ?? "").replace(/[^a-zA-Z0-9_-]/g,"_")).join(":");
  }
  function emitEvent(s, type, id, data = {}) {
    const comm=init(s).communications;
    const eid=id || eventId(type,[s.season,s.day,++comm.sequence]);
    if (comm.events.some((e)=>e.id===eid)) return comm.events.find((e)=>e.id===eid);
    const ev={id:eid,type,day:s.day,season:s.season,data};
    comm.events.unshift(ev); comm.events=comm.events.slice(0,240);
    return ev;
  }
  function addMessage(s, spec) {
    const comm=init(s).communications, event=spec.eventId||null;
    if (event && comm.messages.some((m)=>m.eventId===event && m.category===spec.category && m.subject===spec.subject)) return null;
    const m={id:`msg_${s.season}_${s.day}_${++comm.sequence}`,category:spec.category||"CARREIRA",sender:spec.sender||"PRO LIFE",day:s.day,season:s.season,subject:spec.subject||"Atualização",body:spec.body||"",read:false,priority:spec.priority||"NORMAL",action:spec.action||null,deadline:Number.isFinite(spec.deadline)?spec.deadline:null,eventId:event};
    comm.messages.unshift(m); comm.messages=comm.messages.slice(0,160); return m;
  }
  function addArticle(s, spec) {
    const comm=init(s).communications, event=spec.eventId||null;
    if (event && comm.articles.some((n)=>n.eventId===event && n.category===spec.category)) return null;
    const n={id:`news_${s.season}_${s.day}_${++comm.sequence}`,category:spec.category||"JOGADOR",day:s.day,season:s.season,title:spec.title,body:spec.body,eventId:event};
    comm.articles.unshift(n); comm.articles=comm.articles.slice(0,160); return n;
  }
  function markMessageRead(s,id){ const m=init(s).communications.messages.find((x)=>x.id===id); if(!m) throw Error("Mensagem indisponível."); m.read=true; return m; }
  function processMatchEvent(s,m) {
    if(s.mode!=="player" || ![m.home,m.away].includes(s.clubId)) return;
    const base=eventId("MATCH_FINISHED",[s.season,m.date,m.home,m.away,m.competitionId||m.leagueId||"match"]), ev=emitEvent(s,"MATCH_FINISHED",base,{home:m.home,away:m.away,hg:m.hg,ag:m.ag});
    const comm=init(s).communications; if(comm.processed[base]) return; comm.processed[base]=true;
    const played=!!m.ratings?.hero, goals=(m.events||[]).filter((x)=>x.type==="goal"&&x.playerId==="hero").length, rating=Number(m.ratings?.hero||0), pc=init(s).playerCareer;
    if(!played){ addMessage(s,{category:"TREINADOR",sender:"Treinador",subject:"Decisão de escalação",body:"Você não foi utilizado nesta partida. A decisão refletiu a disputa por posição, condição e momento do elenco.",eventId:base}); return; }
    if(goals>=3){ const id=eventId("PLAYER_HAT_TRICK",[base,"hero"]); emitEvent(s,"PLAYER_HAT_TRICK",id,{goals,rating}); addArticle(s,{category:"JOGADOR",title:`${s.person.name} marca hat-trick`,body:`Três gols em uma atuação de destaque. Nota ${rating.toFixed(1)} na partida.`,eventId:id}); addMessage(s,{category:"IMPRENSA",sender:"Imprensa",subject:"Atuação em destaque",body:"Seu hat-trick ganhou repercussão. Há interesse em ouvir você sobre a atuação.",priority:"IMPORTANTE",eventId:id}); if(!comm.interviews.some(x=>x.eventId===id)){ comm.interviews.unshift({id:`interview_${s.season}_${s.day}_${++comm.sequence}`,eventId:id,day:s.day,season:s.season,question:"Você marcou três vezes hoje. Como avalia sua atuação?",choices:[{id:"team",label:"O mais importante foi ajudar a equipe."},{id:"moment",label:"Estou vivendo um grande momento."},{id:"work",label:"Tenho trabalhado muito para isso."}],answered:false,response:null}); } }
    const total=Number(init(s).played||0); for(const milestone of [1,50,100]) if(total===milestone){ const id=eventId("MILESTONE_REACHED",["games",milestone]); emitEvent(s,"MILESTONE_REACHED",id,{kind:"games",value:milestone}); addArticle(s,{category:"JOGADOR",title:milestone===1?"Estreia profissional":`${milestone} jogos na carreira`,body:`${s.person.name} alcançou a marca de ${milestone} ${milestone===1?"partida":"partidas"} registrada na carreira.`,eventId:id}); }
    if(pc?.lastEvaluation){ const subj=rating>=7.5?"Bom desempenho":rating<6?"Precisamos de mais consistência":null; if(subj) addMessage(s,{category:"TREINADOR",sender:"Treinador",subject:subj,body:rating>=7.5?"Sua atuação fortaleceu sua posição na disputa por espaço.":"Uma partida ruim não define sua situação, mas quero uma resposta nos próximos compromissos.",eventId:base}); }
  }
  function respondInterview(s,id,choice){ const comm=init(s).communications,i=comm.interviews.find(x=>x.id===id); if(!i||i.answered) throw Error("Entrevista indisponível."); if(!i.choices.some(x=>x.id===choice)) throw Error("Resposta inválida."); i.answered=true;i.response=choice;i.answeredDay=s.day; const delta=choice==="team"?{rep:1,morale:1,fans:1}:choice==="moment"?{rep:1,morale:2,fans:2}: {rep:1,morale:1,fans:1}; s.reputation=clamp(s.reputation+delta.rep,0,100);s.person.morale=clamp(s.person.morale+delta.morale,0,100);updateMediaProfile(s,{fans:delta.fans,sponsor:choice==="work"?2:1,pressure:choice==="moment"?1:-1,interview:1});comm.responses.unshift({interviewId:id,eventId:i.eventId,day:s.day,choice,effects:delta});comm.responses=comm.responses.slice(0,80);return i;}
  function messageRetentionDays(m){
    if(m?.priority==="URGENT") return 120;
    if(m?.priority==="IMPORTANT") return 90;
    return 60;
  }
  function pruneMessages(s){
    const comm=init(s).communications;
    const before=comm.messages.length;
    comm.messages=comm.messages.filter((m)=>{
      // Decisões/ações ainda válidas permanecem visíveis até o prazo terminar.
      if(m?.action && Number.isFinite(m.deadline) && m.deadline>=s.day) return true;
      const age=Math.max(0,s.day-Number(m.day||0));
      return age<=messageRetentionDays(m);
    });
    return before-comm.messages.length;
  }
  function unreadCount(s){ return init(s).communications.messages.filter((m)=>!m.read).length; }
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
    const cat = author === "Agente" ? "AGENTE" : author === "Diretoria" || category === "Transferências" ? "CLUBE" : category === "Imprensa" ? "IMPRENSA" : null;
    if (cat) {
      const eid=eventId("COMMUNICATION",[s.season,s.day,category,author,title]);
      emitEvent(s,"COMMUNICATION",eid,{category,author,title});
      addMessage(s,{category:cat,sender:author,subject:title,body,priority:/Oferta|Contrato|Renovação|prazo|acordo/i.test(title)?"IMPORTANTE":"NORMAL",eventId:eid});
    }
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
    pruneMessages(s);
    if (s.mode === "player" && s.clubId && s.contract > 0) {
      const pc=e.playerCareer;
      for (const threshold of [180,90,30]) {
        if (s.contract <= threshold && !pc.contractNotices[threshold]) {
          pc.contractNotices[threshold]=s.day;
          post(s,"Carreira","Agente",`Contrato: ${threshold} dias ou menos`,`Seu vínculo entra na reta final. Restam ${s.contract} dias. Acompanhe a situação e, se quiser permanecer, peça ao seu agente para abrir conversas com o clube.`);
        }
      }
    }
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
        const perf=m.playerStats?.hero||{}, minutes=Number(perf.minutes||90), starter=perf.starter!==false;
        if(starter) pc.starts++; else pc.benchGames++;
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
        pc.lastEvaluation = { day:s.day, rating, met, total:objectives.length, goals, assists, minutes, starter, shots:attack.shots||0, onTarget:attack.onTarget||0, xg:+(attack.xg||0).toFixed(2) };
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
    if (m.ratings.hero) e.careerMinutes += Number(m.playerStats?.hero?.minutes||90);
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
      marketValue: p.id === "hero" ? marketValue(s) : undefined,
      transferType: p.id === "hero" ? (init(s).playerCareer.contract?.type || (source ? "permanent" : "free")) : "permanent",
      salary: p.id === "hero" ? s.salary : Math.max(2500, Math.round((fee ? fee / 180 : 2500) / 1000) * 1000),
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
    emitEvent,
    addMessage,
    addArticle,
    markMessageRead,
    pruneMessages,
    processMatchEvent,
    unreadCount,
    respondInterview,
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
    realisticSalary,
    transferValue,
    updateProfessionalCareer,
    registerInterest,
    signContract,
    counterOffer,
    createRenewalOffer,
    requestRenewal,
    counterRenewal,
    acceptRenewal,
    rejectRenewal,
    agentAdvice,
    setAgentStrategy,
    targetClubAssessment,
    agencies,
    hireAgency,
    interestAssessment,
    sportingReputation,
    clubLevel,
    holdOffer,
    rejectOffer,
    signAgreement,
    clearAgreement,
    marketTick,
    nextWindowStart,
    setTargetClub,
    clearTargetClub,
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
