/* PRO LIFE — pure domain. No DOM, network or storage. */
(function (root) {
  "use strict";
  const Character =
    root.ProLifeCharacter ||
    (typeof require === "function" ? require("./character.js") : null);
  const Career =
    root.ProLifeCareer ||
    (typeof require === "function" ? require("./career.js") : null);
  const Personality =
    root.ProLifePlayerPersonality ||
    (typeof require === "function" ? require("./player-personality.js") : null);
  const World =
    root.ProLifeWorld ||
    (typeof require === "function" ? require("./world2026.js") : null);
  const BrazilData =
    root.ProLifeBrazilData ||
    (typeof require === "function" ? require("./brazil-data.js") : null);
  const Competitions =
    root.ProLifeCompetitions ||
    (typeof require === "function" ? require("./competitions.js") : null);
  const Training =
    root.ProLifeTraining ||
    (typeof require === "function" ? require("./training.js") : null);
  const Creation =
    root.ProLifeCreation ||
    (typeof require === "function" ? require("./creation.js") : null);
  const World2 =
    root.ProLifeUniverse ||
    (typeof require === "function" ? require("./universe.js") : null);
  const Identity =
    root.ProLifeIdentity ||
    (typeof require === "function" ? require("./identity.js") : null);
  const Statistics =
    root.ProLifeStatistics ||
    (typeof require === "function" ? require("./statistics.js") : null);
  const Squad =
    root.ProLifeSquad ||
    (typeof require === "function" ? require("./squad.js") : null);
  const Physical =
    root.ProLifePhysical ||
    (typeof require === "function" ? require("./physical.js") : null);
  const SimulationTactics =
    root.ProLifeSimulationTactics ||
    (typeof require === "function" ? require("./simulation-tactics.js") : null);
  const NationalTeam =
    root.ProLifeNationalTeam ||
    (typeof require === "function" ? require("./national-team.js") : null);
  const Life =
    root.ProLifeLife ||
    (typeof require === "function" ? require("./life.js") : null);
  const Commercial =
    root.ProLifeCommercial ||
    (typeof require === "function" ? require("./commercial.js") : null);
  const UnexpectedEvents =
    root.ProLifeUnexpectedEvents ||
    (typeof require === "function" ? require("./unexpected-events.js") : null);
  const VERSION = 1,
    clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  class Random {
    constructor(seed) {
      this.state = seed >>> 0 || 1;
    }
    next() {
      let x = this.state;
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      this.state = x >>> 0;
      return this.state / 4294967296;
    }
    int(a, b) {
      return a + Math.floor(this.next() * (b - a + 1));
    }
    pick(a) {
      return a[this.int(0, a.length - 1)];
    }
  }
  const teams = [
    ["Mogi Atlético", "Mogi das Cruzes", "#45d6b0", 53],
    ["Guarulhos União", "Guarulhos", "#ffc86c", 58],
    ["Litoral FC", "Santos", "#59aaff", 67],
    ["Capital Esporte", "São Paulo", "#aa8bfa", 76],
    ["Campinas Sporting", "Campinas", "#f088a2", 64],
    ["Vale Associação", "São José dos Campos", "#74c8f0", 60],
    ["Sorocaba Clube", "Sorocaba", "#f1ad6f", 62],
    ["Interior Real", "Ribeirão Preto", "#9bcc70", 69],
  ];
  const first = [
    "Lucas",
    "Gabriel",
    "Matheus",
    "João",
    "Pedro",
    "Rafael",
    "Diego",
    "Bruno",
    "André",
    "Caio",
    "Vitor",
    "Felipe",
    "Samuel",
    "Davi",
    "Daniel",
    "Thiago",
  ];
  const last = [
    "Silva",
    "Costa",
    "Santos",
    "Souza",
    "Lima",
    "Almeida",
    "Rocha",
    "Pereira",
    "Barbosa",
    "Ferreira",
  ];
  const attrs = ["pace", "finish", "pass", "defense", "strength", "stamina"];
  const labels = {
    pace: "Velocidade",
    finish: "Finalização",
    pass: "Passe",
    defense: "Marcação",
    strength: "Força",
    stamina: "Resistência",
  };
  function overall(p) {
    const ratings = Training?.groupRatings ? Training.groupRatings(p.attrs) : Object.fromEntries(attrs.map((k) => [k, p.attrs[k]]));
    const weights = {
      GOL: { pace: 0.08, finish: 0.03, pass: 0.12, defense: 0.32, strength: 0.2, stamina: 0.25 },
      DEF: { pace: 0.13, finish: 0.04, pass: 0.12, defense: 0.34, strength: 0.22, stamina: 0.15 },
      MEI: { pace: 0.14, finish: 0.13, pass: 0.32, defense: 0.1, strength: 0.09, stamina: 0.22 },
      ATA: { pace: 0.23, finish: 0.32, pass: 0.13, defense: 0.03, strength: 0.12, stamina: 0.17 },
    }[p.pos] || { pace: 1 / 6, finish: 1 / 6, pass: 1 / 6, defense: 1 / 6, strength: 1 / 6, stamina: 1 / 6 };
    return Math.round(attrs.reduce((n, k) => n + ratings[k] * weights[k], 0));
  }
  function player(rng, id, level, pos) {
    const a = {};
    attrs.forEach((k) => (a[k] = clamp(level + rng.int(-13, 13), 20, 91)));
    a[pos === "ATA" ? "finish" : pos === "MEI" ? "pass" : "defense"] += 5;
    return {
      id,
      name: rng.pick(first) + " " + rng.pick(last),
      age: rng.int(17, 34),
      pos,
      attrs: a,
      condition: 100,
      morale: rng.int(55, 85),
      discipline: rng.int(40, 95),
      potential: rng.int(65, 95),
      injury: 0,
      goals: 0,
      minutes: 0,
    };
  }
  function schedule(ids) {
    let circle = ids.slice(),
      rounds = [];
    for (let r = 0; r < ids.length - 1; r++) {
      let pairs = [];
      for (let i = 0; i < ids.length / 2; i++) {
        let a = circle[i],
          b = circle[circle.length - 1 - i];
        pairs.push((r + i) % 2 ? [b, a] : [a, b]);
      }
      rounds.push(pairs);
      circle = [circle[0], circle[circle.length - 1], ...circle.slice(1, -1)];
    }
    return rounds.concat(rounds.map((ps) => ps.map(([a, b]) => [b, a])));
  }

  function positionNeed(c, pos) {
    const targets = { GOL: 2, DEF: 8, MEI: 8, ATA: 5 };
    const count = c.roster.filter((p) => p.pos === pos && p.id !== "hero").length;
    return Math.max(0, (targets[pos] || 5) - count);
  }
  function weightedCareerOffers(s, rng, count = 3) {
    const heroLevel = overall(s.person);
    const preferences = Career.init(s).offerPreferences || { leagues: ["serieA", "serieB", "serieC", "serieD"], clubLevel: "any" };
    const allowedLeagues = new Set(preferences.leagues || []);
    const levelAllowed = (c) => {
      if (preferences.clubLevel === "elite") return c.structure >= 75;
      if (preferences.clubLevel === "competitive") return c.structure >= 60 && c.structure < 75;
      if (preferences.clubLevel === "intermediate") return c.structure >= 45 && c.structure < 60;
      if (preferences.clubLevel === "small") return c.structure < 45;
      return true;
    };
    const pool = s.clubs
      .filter((c) => c.id !== s.clubId)
      .filter((c) => (s.world === "brazil2026" ? allowedLeagues.has(c.leagueId) : true))
      .filter(levelAllowed)
      .filter((c) => !(Career.init(s).playerCareer?.marketState?.rejectionCooldowns?.[c.id] > s.day))
      .map((c) => {
        const assessment = s.mode === "player" ? Career.interestAssessment(s,c.id) : null;
        const need = s.mode === "player" ? positionNeed(c, s.person.pos) : 1;
        const fit = Math.max(0, 24 - Math.abs(c.structure - (heroLevel + s.reputation / 3)));
        const budgetFit = Math.max(1, Math.min(10, c.budget / 1000000));
        const weight = s.mode === "coach"
          ? 2 + fit / 6 + budgetFit / 3
          : Math.max(0, (assessment?.score || 0) - 34) / 8 + need * 1.5 + budgetFit / 6 + (Identity?.styleFit?.(s, c) || 0) * 0.8;
        return { c, need, weight, assessment };
      })
      .filter((x) => x.weight > 0);
    const picked = [];
    while (pool.length && picked.length < count) {
      const total = pool.reduce((n, x) => n + x.weight, 0);
      let roll = rng.next() * total, index = 0;
      for (; index < pool.length - 1; index++) {
        roll -= pool[index].weight;
        if (roll <= 0) break;
      }
      picked.push(pool.splice(index, 1)[0]);
    }
    return picked.map(({ c, need, assessment }, i) => ({
      clubId: c.id,
      salary: s.mode === "coach" ? Math.round(
        6500 + s.reputation * 70 + c.structure * 45 + heroLevel * 10 + rng.int(0, 1800)
      ) : Math.max(2500, Math.round((Career.realisticSalary(s, c.id) * (0.94 + rng.next() * .14)) / 1000) * 1000),
      role: s.mode === "coach"
        ? (need >= 2 ? "Projeto com necessidade imediata" : "Projeto de reconstrução")
        : (need >= 2 ? "Necessidade imediata na sua posição" : need === 1 ? "Disputa aberta por posição" : "Concorrência forte por posição"),
      squadRole: s.mode === "player" ? (need >= 2 ? "Titular" : c.structure < heroLevel ? "Importante" : "Rotação") : "Treinador",
      durationDays: (s.mode === "player" ? (s.person.age <= 22 && need >= 2 && c.structure + 10 < heroLevel ? 365 : rng.pick([365, 730, 1095, 1460])) : 730),
      signingBonus: s.mode === "player" ? Math.round((1200 + s.reputation * 140 + heroLevel * 90 + c.structure * 60) / 100) * 100 : 0,
      transferType: s.mode === "player" && s.person.age <= 22 && need >= 2 && c.structure + 10 < heroLevel ? "loan" : "permanent",
      expires: s.day + 14 + rng.int(0, 8),
      interestScore: assessment?.score,
      interestLabel: assessment?.label,
      responseDeadline: s.day + 14 + rng.int(0, 8),
      round: 0,
    }));
  }

  function create(config, seed = Date.now()) {
    const rng = new Random(seed),
      mode = config.mode === "coach" ? "coach" : "player";
    const real = config.world !== "legacy";
    const definitions = real ? World.clubs.concat(BrazilData?.clubs || []) : teams;
    const clubs = definitions.map((t, i) => {
      let roster = real
        ? t.players.map((r) => ({
            ...player(rng, r.id, t.level, r.pos),
            name: r.name,
            age: r.age,
            number: r.number,
            nationality: r.nationality,
            real: true,
          }))
        : Array.from({ length: 22 }, (_, j) =>
            player(
              rng,
              "p" + i + "_" + j,
              t[3],
              j < 2 ? "GOL" : j < 9 ? "DEF" : j < 16 ? "MEI" : "ATA",
            ),
          );
      while (real && roster.length < 22) {
        const j = roster.length;
        roster.push({
          ...player(rng, "sim_" + i + "_" + j, t.level, j < 2 ? "GOL" : j < 9 ? "DEF" : j < 16 ? "MEI" : "ATA"),
          real: false,
          partial: t.coverage === "partial",
          number: j + 1,
          nationality: "Brasil",
        });
      }
      return {
        id: "c" + i,
        name: real ? t.name : t[0],
        city: real ? t.city : t[1],
        color: real ? t.color : t[2],
        leagueId: real ? t.leagueId : "horizonte",
        roster,
        lineup: roster
          .filter((p) => p.pos === "GOL")
          .slice(0, 1)
          .concat(
            roster.filter((p) => p.pos === "DEF").slice(0, 4),
            roster.filter((p) => p.pos === "MEI").slice(0, 4),
            roster.filter((p) => p.pos === "ATA").slice(0, 2),
          )
          .map((p) => p.id),
        tactic: "balanced",
        budget: real ? t.level * 200000 : 900000 + i * 200000,
        structure: real ? t.level : 45 + i * 5,
        coverage: t.coverage || "complete",
        stats: { points: 0, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      };
    });
    const profile = config.profile || "realistic",
      originId = Training?.origins?.[config.origin] ? config.origin : "blank",
      origin = Training?.origins?.[originId] || { age: null, reputation: 15, potential: 0, attrs: {}, offerBoost: 0 },
      base = profile === "prodigy" ? 54 : profile === "promise" ? 46 : 40;
    const plan = mode === "player" && config.creation && Creation ? Creation.resolve(API, config, seed) : null;
    const a = {};
    attrs.forEach(
      (k) => (a[k] = base + clamp(Number(config.points?.[k]) || 0, 0, 20)),
    );
    Training?.expand(a);
    if (mode === "player" && origin.attrs) for (const [key, bonus] of Object.entries(origin.attrs)) if (Number.isFinite(a[key])) a[key] = clamp(a[key] + bonus, 20, 100);
    const points = attrs.reduce((n, k) => n + (base + clamp(Number(config.points?.[k]) || 0, 0, 20)) - base, 0);
    if (points > 30 && !plan) throw Error("Distribua no máximo 30 pontos.");
    const person = {
      id: "hero",
      name: String(config.name || "Alesson Rodrigues")
        .trim()
        .slice(0, 60),
      city: String(config.city || "Mogi das Cruzes").slice(0, 60),
      nationality: "Brasil",
      age: plan ? plan.age : clamp(
        Number(config.age) || (mode === "coach" ? 35 : (origin.age || 16)),
        mode === "coach" ? 25 : 14,
        mode === "coach" ? 65 : 35,
      ),
      pos: ["GOL", "DEF", "MEI", "ATA"].includes(config.pos)
        ? config.pos
        : "MEI",
      attrs: plan ? plan.attrs : a,
      condition: 100,
      morale: plan ? plan.morale : 70,
      discipline: plan ? plan.discipline : 70,
      potential: plan ? plan.potential : clamp(rng.int(profile === "prodigy" ? 85 : 65, 96) + (mode === "player" ? origin.potential || 0 : 0), 55, 100),
      injury: 0,
      goals: 0,
      minutes: 0,
      appearance: Character.normalize(config.appearance),
      height: clamp(Number(config.height) || 178, 150, 210),
      weight: clamp(Number(config.weight) || 72, 45, 120),
      foot: config.foot === "left" ? "left" : "right",
      style: config.style || "Técnico",
      originId: mode === "player" ? originId : null,
      originName: mode === "player" ? (plan ? plan.story.title : origin.name) : null,
      archetypeId: mode === "player" ? (plan ? plan.archetypeId : config.archetypeId || Training?.defaultArchetypeId?.[config.pos] || "maestro") : null,
      celebration: config.celebration || "Braços abertos",
      birthDate: (()=>{const age=plan ? plan.age : clamp(Number(config.age)||(origin.age||16),14,35), raw=String(config.birthDate||""); const m=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?{year:Number(m[1]),month:Number(m[2]),day:Number(m[3])}:{year:2026-age,month:1,day:1};})(),
    };
    let s = {
      version: VERSION,
      rng: rng.state,
      mode,
      season: 2026,
      day: 0,
      round: 0,
      clubs,
      world: real ? "brazil2026" : "legacy",
      leagues: real
        ? [
            { id: "serieA", name: "Brasileirão Série A" },
            { id: "serieB", name: "Brasileirão Série B" },
            { id: "serieC", name: "Brasileirão Série C" },
            { id: "serieD", name: "Brasileirão Série D" },
          ]
        : [{ id: "horizonte", name: "Liga Horizonte" }],
      calendarDays: real
        ? World.roundDays.slice()
        : Array.from({ length: 14 }, (_, i) => 7 + i * 21),
      fixtures: real
        ? World.serieAFixtures.map((r, i) => r.map((p) => p.slice()).concat(
            ...["serieB", "serieC", "serieD"].map((leagueId) => schedule(clubs.filter((c) => c.leagueId === leagueId).map((c) => c.id))[i]),
          ))
        : schedule(clubs.map((c) => c.id)),
      person,
      clubId: null,
      training: "balanced",
      intensity: "normal",
      wallet: 5000,
      salary: mode === "coach" ? 8000 : 1200,
      contract: 365,
      reputation: mode === "coach" ? 35 : clamp(origin.reputation || 15, 0, 100),
      board: 65,
      license: mode === "coach" ? "C" : "Sem licença",
      family: 70,
      stress: 20,
      fans: 100,
      news: [],
      matches: [],
      offers: [],
      history: [],
      decision: null,
      birthday: { lastCelebratedYear:null, history:[] },
      development: [
        {
          day: 0,
          season: 2026,
          overall: overall(person),
          attrs: { ...person.attrs },
        },
      ],
      trainingProgress: 0,
      seasonGoals: 0,
    };
    Career.init(s);
    Career.updateProfessionalCareer(s);
    Training?.init(s);
    Identity?.init(s);
    Statistics?.init(s);
    Competitions?.init(s);
    Life?.init(s);
    Commercial?.init(s, { overall, club });
    UnexpectedEvents?.init(s);
    NationalTeam?.init(s);
    World2?.init(s, API, seed);
    if (plan) Creation.applyContext(s, plan);
    s.offers = plan ? Creation.opportunities(s, rng, API, plan) : weightedCareerOffers(s, rng, mode === "player" ? Math.min(5, 3 + (origin.offerBoost || 0)) : 3);
    if (plan && config.clubId) Creation.accept(s, config.clubId, API);
    else if (config.clubId && clubs.some((c) => c.id === config.clubId)) {
      movePlayerToClub(s, config.clubId);
      if (mode === "player") {
        const initialOffer = s.offers.find((o) => o.clubId === config.clubId);
        const durationDays = Math.max(730, initialOffer?.durationDays || 730);
        Career.signContract(s, { clubId: config.clubId, salary: s.salary, durationDays, signingBonus: 0, squadRole: "Rotação", transferType: "permanent" });
        s.careerTransferAvailableDay = Career.nextWindowDay(s.day);
        s.offers = [];
        Statistics?.ensureHeroStint?.(s, config.clubId);
        Competitions?.ensureState(s);
        Career.updatePlayerRole(s);
      }
    }
    log(
      s,
      "Sua história começa",
      "Analise estrutura, concorrência e salário antes de escolher seu clube.",
    );
    if (plan && s.creation?.started) return s;
    if (mode === "player") Career.post(s, "Carreira", "Agente", "Sua origem: " + (plan ? plan.story.title : origin.name), origin.description + " Seu arquétipo inicial é " + (Training?.init(s)?.archetype?.name || "definido pela posição") + ".");
    Career.post(
      s,
      "Carreira",
      "Sua carreira",
      "Sua história começa",
      s.person.name +
        " entra no futebol. Clubes e atletas usam a base 2026; todos os acontecimentos desta carreira são simulados.",
    );
    return s;
  }
  function club(s, id = s.clubId) {
    return s.clubs.find((c) => c.id === id);
  }
  function log(s, title, body) {
    s.news.unshift({ day: s.day, season: s.season, title, body });
    s.news = s.news.slice(0, 160);
    Career.post(s, "Carreira", "Diário da carreira", title, body);
  }
  function movePlayerToClub(s, id) {
    const next = club(s, id);
    if (!next) throw Error("Clube inválido.");
    if (s.mode === "player") {
      for (const c of s.clubs) {
        c.roster = c.roster.filter((p) => p.id !== "hero");
        c.lineup = c.lineup.filter((pid) => pid !== "hero");
      }
      next.roster.push(s.person);
    }
    s.clubId = id;
    return next;
  }
  function join(s, id, salary) {
    if (Career.windowStatus(s).open && s.clubId && s.day < s.careerTransferAvailableDay) throw Error("Você já assinou nesta janela. Aguarde a próxima janela para trocar de clube.");
    const proposed = s.offers.find((o) => o.clubId === id && o.expires >= s.day) || (s.mode === "player" && Career.init(s).playerCareer?.marketState?.signedAgreement?.clubId === id ? Career.init(s).playerCareer.marketState.signedAgreement : null) || (s.mode === "coach" && !s.clubId ? {clubId:id,salary,durationDays:730,signingBonus:0,squadRole:"Rotação",transferType:"free",expires:s.day+1} : null);
    if (!proposed) throw Error("Esta proposta não está disponível.");
    const pc0 = s.mode === "player" ? Career.init(s).playerCareer : null;
    const trustBeforeTransfer = Number(pc0?.coachTrust || 0);
    if (pc0?.marketState?.signedAgreement && pc0.marketState.signedAgreement.clubId !== id) throw Error("Você já possui um acordo assinado com outro clube.");
    if (!Career.windowStatus(s).open) {
      if (s.mode === "player") { Career.signAgreement(s, proposed); return { scheduled:true, startDay:Career.nextWindowStart(s.day) }; }
      throw Error("Janela de transferências fechada. Aguarde a próxima abertura.");
    }
    if (!Career.canTransfer(s)) throw Error("Você já assinou nesta janela. Aguarde a próxima janela para trocar de clube.");
    const previous = club(s);
    if (s.mode === "player" && previous) Statistics?.closeHeroStint?.(s, previous.id, "transfer");
    const previousSalary = s.salary, previousContract = s.contract;
    const next = movePlayerToClub(s, id);
    if (s.mode === "player") Statistics?.ensureHeroStint?.(s, id);
    s.careerTransferAvailableDay = Career.nextWindowDay(s.day);
    const acceptedOffer = s.offers.find((o) => o.clubId === id && o.expires >= s.day) || { clubId:id, salary, durationDays:730, signingBonus:0, squadRole:"Rotação", transferType:"permanent" };
    if (acceptedOffer.transferType === "loan" && previous) { acceptedOffer.parentClubId=previous.id; acceptedOffer.parentSalary=previousSalary; acceptedOffer.parentContractRemaining=Math.max(previousContract, acceptedOffer.durationDays+30); }
    s.salary = salary;
    Career.signContract(s, acceptedOffer);
    // Novo clube, nova hierarquia: reputação e contrato influenciam a primeira impressão,
    // mas o atleta precisa conquistar o status esportivo com treino e partidas neste clube.
    if (s.mode === "player" && previous && previous.id !== next.id) {
      const pc = Career.init(s).playerCareer;
      const promised = acceptedOffer.squadRole || acceptedOffer.role || "Rotação";
      const promiseBoost = {"Fora dos planos":0,"Reserva":0,"Rotação":1,"Titular":4,"Importante":6,"Estrela":7}[promised] || 0;
      const reputationBoost = clamp(Math.round((Number(s.reputation || 50) - 50) / 25), -2, 2);
      pc.coachTrust = clamp(51 + promiseBoost + reputationBoost, 42, 60);
      pc.clubArrival = { clubId: next.id, day: s.day, promisedRole: promised, initialTrust: pc.coachTrust };
      Career.updatePlayerRole(s);
      Squad?.handlePlayerTransfer?.(s,previous,next);
      Squad?.recordTrustChange?.(s,"transfer",trustBeforeTransfer,pc.coachTrust,{
        eventId:`coach-transfer:${s.season}:${s.day}:${previous.id}:${next.id}`
      });
    }
    s.offers = [];
    s.board = 65;
    Competitions?.ensureState(s);
    const transferType = acceptedOffer.transferType || "permanent";
    const fee = Career.transferValue(s, previous, next, previous ? transferType : "free");
    Career.transfer(s, s.person, previous, next, fee);
    const careerAfterTransfer=Career.init(s);
    const confirmedRecord=(careerAfterTransfer.transfers||[]).find(t=>t.player===s.person.name&&Number(t.day)===Number(s.day)&&t.to===next.name);
    if(confirmedRecord){confirmedRecord.status="CONFIRMED";confirmedRecord.accepted=true;confirmedRecord.confirmedDay=s.day;}
    if (s.mode === "player") { Career.clearAgreement(s); Career.updatePlayerRole(s); }
    if (s.creation?.status === "unsigned") Creation.registerStart(s, API);
    log(
      s,
      "Contrato assinado",
      s.person.name +
        " chega ao " +
        next.name +
        ". Salário mensal: R$ " +
        salary.toLocaleString("pt-BR") +
        ".",
    );
  }
  function selected(c) {
    const active = c.roster.filter((p) => !p.injury && !(p.suspension > 0) && !p._competitionSuspended && p.condition > 35);
    let chosen = c.lineup
      .map((id) => active.find((p) => p.id === id))
      .filter(Boolean);
    if (!chosen.some((p) => p.pos === "GOL")) {
      chosen.unshift(active.find((p) => p.pos === "GOL"));
    }
    for (const p of active.slice().sort((a, b) => overall(b) - overall(a))) {
      if (chosen.filter(Boolean).length >= 11) break;
      if (!chosen.includes(p)) chosen.push(p);
    }
    return chosen.filter(Boolean).slice(0, 11);
  }
  function quality(ps, key) {
    if (!ps.length) return 25;
    return (
      ps.reduce(
        (n, p) =>
          n +
          p.attrs[key] *
            (0.55 + (0.45 * p.condition) / 100) *
            (0.85 + (0.15 * p.morale) / 100),
        0,
      ) / ps.length
    );
  }
  function simulate(home, away, rng, context = null) {
    const hp = selected(home),
      ap = selected(away);
    let m = {
      home: home.id,
      away: away.id,
      hg: 0,
      ag: 0,
      shots: [0, 0],
      target: [0, 0],
      xg: [0, 0],
      possessions: [0, 0],
      events: [],
      participants: [hp.map((p) => p.id), ap.map((p) => p.id)],
      ratings: {},
      playerStats: {},
      offensiveStats: {},
      date: 0,
      participation: {},
    };
    [hp,ap].forEach((ps,side)=>ps.forEach(p=>{m.participation[p.id]={side,starter:true,entryMinute:0,exitMinute:94,minutes:94};}));
    const squads = [hp, ap],
      clubs = [home, away],
      tactical = SimulationTactics ? [SimulationTactics.matchup(home, away), SimulationTactics.matchup(away, home)] : [{possession:0,attack:0,defense:0,fatigue:0},{possession:0,attack:0,defense:0,fatigue:0}],
      fatigue = [0, 0];
    for (let minute = 1; minute <= 94; minute++) {
      const control = squads.map(
        (ps, i) =>
          quality(ps, "pass") +
          quality(ps, "stamina") * 0.2 +
          (i === 0 ? 3 : 0) +
          (clubs[i].tactic === "possession" ? 5 : 0) +
          tactical[i].possession -
          fatigue[i],
      );
      const i =
          rng.next() < clamp(0.5 + (control[0] - control[1]) / 280, 0.34, 0.66)
            ? 0
            : 1,
        j = 1 - i,
        ps = squads[i],
        opp = squads[j];
      m.possessions[i]++;
      fatigue[i] += 0.07 + tactical[i].fatigue;
      const attack =
        quality(ps, "pace") * 0.4 +
        quality(ps, "pass") * 0.6 +
        (clubs[i].tactic === "attack"
          ? 7
          : clubs[i].tactic === "counter"
            ? 2
            : 0) +
        tactical[i].attack;
      const defense =
        quality(opp, "defense") * 0.65 +
        quality(opp, "strength") * 0.35 +
        (clubs[j].tactic === "counter"
          ? 8
          : clubs[j].tactic === "attack"
            ? -6
            : 0) +
        tactical[j].defense;
      if (rng.next() < clamp(0.2 + (attack - defense) / 650, 0.12, 0.29)) {
        m.shots[i]++;
        const candidates = ps.filter((p) => p.pos !== "GOL").length ? ps.filter((p) => p.pos !== "GOL") : ps;
        const shooterWeights = candidates.map((p) => {
          const g = Training?.groupRatings ? Training.groupRatings(p.attrs) : p.attrs;
          const role = p.pos === "ATA" ? 1.65 : p.pos === "MEI" ? 1.02 : 0.58;
          const candidateOverall = overall(p);
          const peers = candidates.filter((x) => x.pos === p.pos && x.id !== p.id);
          const peerOverall = peers.length ? peers.reduce((n, x) => n + overall(x), 0) / peers.length : candidateOverall;
          const relativeQuality = clamp(1 + (candidateOverall - peerOverall) / 42, 0.72, 1.55);
          let protagonism = 1;
          if (context && p.id === "hero") {
            const pc = Career.init(context).playerCareer;
            const trust = clamp(pc?.coachTrust ?? 50, 0, 100);
            const morale = clamp(p.morale ?? 50, 0, 100);
            protagonism *= 0.82 + trust / 260 + morale / 500;
            if (p.archetypeId === "finisher") protagonism *= 1.16;
            else if (p.archetypeId === "nine") protagonism *= 1.09;
          }
          return Math.max(1, role * relativeQuality * protagonism * (g.finish * 0.5 + g.pace * 0.16 + (p.attrs.positioning ?? (((p.attrs.pass ?? g.pass) + (p.attrs.finish ?? g.finish)) / 2)) * 0.34));
        });
        let shooterRoll = rng.next() * shooterWeights.reduce((n, v) => n + v, 0), shooter = candidates[0];
        for (let si = 0; si < candidates.length; si++) { shooterRoll -= shooterWeights[si]; if (shooterRoll <= 0) { shooter = candidates[si]; break; } }
        if (!shooter) continue;
        if (!m.offensiveStats[shooter.id]) m.offensiveStats[shooter.id] = { shots: 0, onTarget: 0, xg: 0, goals: 0 };
        m.offensiveStats[shooter.id].shots++;
        const shotXg = clamp(
          0.045 + rng.next() * 0.18 + (attack - defense) / 1600,
          0.025,
          0.32,
        );
        m.xg[i] += shotXg;
        m.offensiveStats[shooter.id].xg += shotXg;
        const shooterGroups = Training?.groupRatings ? Training.groupRatings(shooter.attrs) : shooter.attrs,
          finish = shooterGroups.finish * (0.7 + (0.3 * shooter.condition) / 100),
          keeper = opp.find((p) => p.pos === "GOL"),
          keeperGroups = keeper && Training?.groupRatings ? Training.groupRatings(keeper.attrs) : keeper?.attrs;
        const onTarget = rng.next() < clamp(0.28 + finish / 220, 0.3, 0.72);
        if (onTarget) { m.target[i]++; m.offensiveStats[shooter.id].onTarget++; }
        const heroTrust = context && shooter.id === "hero" ? clamp(Career.init(context).playerCareer?.coachTrust ?? 50, 0, 100) : 50;
        const heroMorale = context && shooter.id === "hero" ? clamp(shooter.morale ?? 50, 0, 100) : 50;
        const archetypeFinish = shooter.id === "hero" && shooter.archetypeId === "finisher" ? 1.12 : shooter.id === "hero" && shooter.archetypeId === "nine" ? 1.06 : 1;
        const conversionBoost = shooter.id === "hero" && context ? (0.9 + heroTrust / 500 + heroMorale / 1000) * archetypeFinish : 1;
        const conversion = clamp(
          shotXg *
            (0.82 + finish / 310) * conversionBoost *
            (1 - ((keeperGroups?.defense || 50) - 50) / 360),
          0.015,
          0.6,
        );
        if (
          onTarget &&
          rng.next() < clamp(conversion / (0.28 + finish / 220), 0.025, 0.85)
        ) {
          if (i === 0) m.hg++;
          else m.ag++;
          shooter.goals++;
          m.offensiveStats[shooter.id].goals++;
          m.events.push({
            minute,
            type: "goal",
            side: i,
            player: shooter.name,
            playerId: shooter.id,
            assistPlayerId: rng.next() < 0.72 ? ps.filter((p) => p.id !== shooter.id).slice().sort((a, b) => {
              const ga = Training?.groupRatings ? Training.groupRatings(a.attrs) : a.attrs;
              const gb = Training?.groupRatings ? Training.groupRatings(b.attrs) : b.attrs;
              return (gb.pass + (b.attrs.vision ?? gb.pass)) - (ga.pass + (a.attrs.vision ?? ga.pass));
            })[Math.floor(rng.next() * Math.min(3, Math.max(1, ps.length - 1)))]?.id : undefined,
            text:
              shooter.name +
              " aproveitou " +
              (clubs[i].tactic === "counter"
                ? "uma transição rápida"
                : "uma oportunidade construída pelo time") +
              ".",
          });
        } else if (onTarget && rng.next() < 0.4)
          m.events.push({
            minute,
            type: "save",
            side: j,
            player: keeper?.name,
            playerId: keeper?.id,
            text: "Defesa importante de " + (keeper?.name || "goleiro") + ".",
          });
      }
      if (context && [home.id,away.id].includes(context.clubId)) {
        const heroSide=home.id===context.clubId?0:1, heroSquad=squads[heroSide], ownClub=clubs[heroSide];
        const hero=ownClub.roster.find(p=>p.id==="hero"), pc=Career.init(context).playerCareer;
        if(hero && !hero.injury && !(hero.suspension>0)){
          const on=heroSquad.some(p=>p.id==="hero"), subPlan=Squad?.substitutePlan?.(context,hero)||{minute:65,chance:clamp(.35+(pc.coachTrust-50)/120+(hero.morale-50)/180,.15,.9)};
          if(!on && minute===subPlan.minute){
            const eligible=pc.matchSelection?.bench?.includes("hero");
            // Se foi relacionado no banco, recebe minutos para ganhar experiencia.
            if(eligible){
              let idx=heroSquad.findIndex(p=>p.pos===hero.pos); if(idx<0)idx=heroSquad.length-1;
              const out=heroSquad[idx]; heroSquad[idx]=hero;
              if(m.participation[out.id]){m.participation[out.id].exitMinute=minute;m.participation[out.id].minutes=minute-m.participation[out.id].entryMinute;}
              m.participation.hero={side:heroSide,starter:false,entryMinute:minute,exitMinute:94,minutes:94-minute};m.participants[heroSide].push("hero");
              m.events.push({minute,type:"substitution",side:heroSide,player:hero.name,playerId:"hero",outPlayer:out.name,outPlayerId:out.id,text:`Substituição: sai ${out.name}, entra ${hero.name}.`});
            }
          } else if(on && minute===65 && hero.condition<58 && rng.next()<.7){
            const sub=ownClub.roster.filter(x=>!heroSquad.includes(x)&&!x.injury&&!(x.suspension>0)&&x.pos===hero.pos).sort((a,b)=>overall(b)-overall(a))[0];
            if(sub){const idx=heroSquad.findIndex(p=>p.id==="hero");heroSquad[idx]=sub;m.participation.hero.exitMinute=minute;m.participation.hero.minutes=minute;m.participation[sub.id]={side:heroSide,starter:false,entryMinute:minute,exitMinute:94,minutes:94-minute};m.participants[heroSide].push(sub.id);m.events.push({minute,type:"substitution",side:heroSide,player:sub.name,playerId:sub.id,outPlayer:hero.name,outPlayerId:"hero",text:`Substituição: sai ${hero.name}, entra ${sub.name}.`});}
          }
        }
      }
      if (rng.next() < 0.012 && ps.length) {
        const eligible=ps.filter(p=>!m.events.some(ev=>ev.type==="red"&&ev.playerId===p.id));
        let p = eligible.length ? rng.pick(eligible) : null;
        if (p && rng.next() > p.discipline / 120) {
          const previousYellow=m.events.some(ev=>ev.type==="yellow"&&ev.playerId===p.id);
          m.events.push({minute,type:"yellow",side:i,player:p.name,playerId:p.id,text:p.name+" recebeu cartão amarelo."});
          if(previousYellow){
            m.events.push({minute,type:"red",reason:"second-yellow",side:i,player:p.name,playerId:p.id,text:p.name+" recebeu o segundo amarelo e foi expulso."});
            const idx=ps.findIndex(x=>x.id===p.id); if(idx>=0)ps.splice(idx,1);
            if(m.participation[p.id]){m.participation[p.id].exitMinute=minute;m.participation[p.id].minutes=Math.max(1,minute-m.participation[p.id].entryMinute);}
          }
        }
      }
      if (rng.next() < 0.00065 && ps.length) {
        const eligible=ps.filter(p=>!m.events.some(ev=>ev.type==="red"&&ev.playerId===p.id));
        const p=eligible.length?rng.pick(eligible):null;
        if(p && rng.next() > (p.discipline||60)/150){
          m.events.push({minute,type:"red",reason:"direct",side:i,player:p.name,playerId:p.id,text:p.name+" recebeu cartão vermelho direto."});
          const idx=ps.findIndex(x=>x.id===p.id); if(idx>=0)ps.splice(idx,1);
          if(m.participation[p.id]){m.participation[p.id].exitMinute=minute;m.participation[p.id].minutes=Math.max(1,minute-m.participation[p.id].entryMinute);}
        }
      }
      if (ps.length) {
        let p = rng.pick(ps);
        const injuryChance = Physical?.risk ? Physical.risk(p, "match") : 0.0018;
        if (rng.next() < injuryChance) {
        const diagnosed = Physical?.injure?.(p, rng, context?.day ?? 0, "partida");
        if (!diagnosed) p.injury = rng.int(3, 25);
        m.events.push({
          minute,
          type: "injury",
          side: i,
          text: p.name + " sofreu " + (diagnosed?.name || "uma lesão") + " (" + p.injury + " dias).",
        });
        const sub = clubs[i].roster.find(
          (x) => !ps.includes(x) && !x.injury && x.pos === p.pos,
        );
        if (sub) {
          ps[ps.indexOf(p)] = sub;
          if(m.participation[p.id]){m.participation[p.id].exitMinute=minute;m.participation[p.id].minutes=Math.max(1,minute-m.participation[p.id].entryMinute);}
          m.participation[sub.id]={side:i,starter:false,entryMinute:minute,exitMinute:94,minutes:94-minute};
          m.participants[i].push(sub.id);
          m.events.push({minute,type:"substitution",side:i,player:sub.name,playerId:sub.id,outPlayer:p.name,outPlayerId:p.id,text:`Substituição: sai ${p.name}, entra ${sub.name}.`});
        }
        }
      }
    }
    for (const [id,part] of Object.entries(m.participation)) {
      const p=clubs[part.side].roster.find(x=>x.id===id); if(!p)continue;
      const minutes=Math.max(0,Math.min(94,Number(part.exitMinute??94)-Number(part.entryMinute??0)));part.minutes=minutes;
      p.condition=clamp(p.condition-rng.int(15,28)*(minutes/94),0,100); Physical?.matchLoad?.(p,minutes); p.minutes+=minutes;
      const groups=Training?.groupRatings?Training.groupRatings(p.attrs):p.attrs,
        saves=m.events.filter(e=>e.type==="save"&&e.playerId===p.id).length,
        tackleBase=p.pos==="DEF"?1.8:p.pos==="MEI"?1.05:p.pos==="ATA"?.38:0,
        tackles=p.pos==="GOL"?0:Math.max(0,Math.round(tackleBase*(groups.defense||50)/25+rng.next()*2-.7)),
        assists=m.events.filter(ev=>ev.type==="goal"&&ev.assistPlayerId===p.id).length;
      m.playerStats[p.id]={saves,tackles,assists,minutes,starter:!!part.starter,entryMinute:part.entryMinute,exitMinute:part.exitMinute};
      m.ratings[p.id]=+clamp(6+(part.side===0?m.hg-m.ag:m.ag-m.hg)*.2+rng.next()*.8+m.events.filter(e=>e.playerId===p.id&&e.type==="goal").length*.8+saves*.08+tackles*.035,3,10).toFixed(1);
    }
    m.xg = m.xg.map((x) => +x.toFixed(2));
    m.possession = Math.round((m.possessions[0] / 94) * 100);
    m.summary =
      (m.hg === m.ag
        ? "Equilíbrio no placar. "
        : m.hg > m.ag
          ? home.name + " venceu. "
          : away.name + " venceu. ") +
      (m.possession > 57
        ? home.name + " teve mais posse. "
        : m.possession < 43
          ? away.name + " teve mais posse. "
          : "A posse foi equilibrada. ") +
      (m.shots[0] + m.shots[1]) +
      " finalizações; " +
      m.events.filter((e) => e.type === "save").length +
      " defesas importantes registradas.";
    return m;
  }
  function table(s, leagueId = club(s)?.leagueId || s.leagues?.[0]?.id) {
    return s.clubs
      .filter((c) => !leagueId || c.leagueId === leagueId)
      .slice()
      .sort(
        (a, b) =>
          b.stats.points - a.stats.points ||
          b.stats.w - a.stats.w ||
          b.stats.gf - b.stats.ga - (a.stats.gf - a.stats.ga) ||
          b.stats.gf - a.stats.gf ||
          a.name.localeCompare(b.name),
      );
  }
  function competitionDisciplineKey(meta={}) {
    return String(meta.competitionId || meta.leagueId || meta.competitionName || "geral");
  }
  function disciplineState(p) {
    p.disciplineState ||= { competitions:{} };
    p.disciplineState.competitions ||= {};
    return p.disciplineState;
  }
  function disciplineCompetition(p,key) {
    const d=disciplineState(p);
    d.competitions[key] ||= { yellows:0, suspensions:0, yellowTotal:0, redTotal:0 };
    return d.competitions[key];
  }
  function isSuspendedFor(p,key) { return Number(disciplineCompetition(p,key).suspensions||0)>0; }
  function processDiscipline(s,m,meta,home,away) {
    const key=competitionDisciplineKey(meta), all=[...(home?.roster||[]),...(away?.roster||[])];
    const byId=new Map(all.map(p=>[p.id,p]));
    const grouped=new Map();
    for(const ev of (m.events||[]).filter(ev=>["yellow","red"].includes(ev.type)&&ev.playerId)){
      const g=grouped.get(ev.playerId)||{yellows:[],directRed:false,secondYellowRed:false};
      if(ev.type==="yellow") g.yellows.push(ev);
      if(ev.type==="red"){ if(ev.reason==="second-yellow")g.secondYellowRed=true; else g.directRed=true; }
      grouped.set(ev.playerId,g);
    }
    for(const [id,g] of grouped){
      const p=byId.get(id); if(!p)continue;
      const d=disciplineCompetition(p,key);
      d.yellowTotal+=g.yellows.length; d.redTotal+=(g.directRed||g.secondYellowRed)?1:0;
      if(g.secondYellowRed){
        // No Brasil, os dois amarelos que produzem o vermelho não entram na série de 3.
        d.suspensions+=1;
      } else {
        d.yellows+=g.yellows.length;
        if(g.directRed) d.suspensions+=1;
        while(d.yellows>=3){d.yellows-=3;d.suspensions+=1;}
      }
      d.lastDay=s.day;
    }
    m.disciplineKey=key;
  }
  function prepareDisciplineAvailability(s,team,meta) {
    const key=competitionDisciplineKey(meta);
    for(const p of (team?.roster||[])) p._competitionSuspended=isSuspendedFor(p,key);
    return key;
  }
  function serveDisciplineSuspensions(team,key) {
    for(const p of (team?.roster||[])){
      if(p._competitionSuspended){
        const d=disciplineCompetition(p,key); d.suspensions=Math.max(0,d.suspensions-1);
      }
      delete p._competitionSuspended;
    }
  }
  function captaincy(s, team = club(s)) {
    if (!team) return { captain:null, vice:null, ranking:[], heroRank:null, heroScore:null };
    const pc=s.mode==="player" ? Career.init(s).playerCareer : null;
    const arrivalDay=pc?.clubArrival?.clubId===team.id ? Number(pc.clubArrival.day||s.day) : null;
    const heroYears=arrivalDay==null ? 0 : Math.max(0,(s.day-arrivalDay)/365);
    const score=(p)=>{
      const age=Math.max(14,Number(p.age||24)), ovr=overall(p), form=Number(p.form||6.5);
      const years=p.id==="hero" ? heroYears : Math.max(0,Number(p.clubYears ?? p.yearsAtClub ?? Math.max(0,(age-20)*0.45)));
      const experience=Math.min(12,Math.max(0,age-20));
      const positionLeadership=["GOL","DEF","MEI"].includes(p.pos)?4:1;
      const regularity=Math.max(0,Math.min(8,(form-6)*4));
      const heroRole=p.id==="hero" ? ({Estrela:8,Importante:6,Titular:4,Rotação:2,Reserva:0,"Fora dos planos":-5}[pc?.squadRole]||0) : 3;
      // Longevidade e experiência pesam mais; GER/status e forma apenas complementam.
      return +(years*7 + experience*2.1 + ovr*.32 + positionLeadership + regularity + heroRole).toFixed(2);
    };
    const ranking=(team.roster||[]).filter(p=>!p.injury).map(p=>({player:p,score:score(p)})).sort((x,y)=>y.score-x.score || overall(y.player)-overall(x.player));
    const captain=ranking[0]?.player||null, vice=ranking[1]?.player||null, heroIndex=ranking.findIndex(x=>x.player.id==="hero");
    return {captain,vice,ranking,heroRank:heroIndex>=0?heroIndex+1:null,heroScore:heroIndex>=0?ranking[heroIndex].score:null,heroYears:+heroYears.toFixed(1)};
  }
  function preparePlayerLineup(s, rng, homeId, awayId) {
    if (s.mode !== "player" || !s.clubId || ![homeId, awayId].includes(s.clubId)) return;
    const c = club(s), pc = Career.init(s).playerCareer;
    const selection = Squad?.choose ? Squad.choose(s,c) : null;
    if (selection) {
      c.formation=selection.formation;
      c.lineup=selection.starters.map(p=>p.id);
      const leadership=captaincy(s,c);
      const xiIds=new Set(selection.starters.map(p=>p.id));
      const captain=leadership.ranking.find(x=>xiIds.has(x.player.id))?.player || selection.starters[0] || null;
      const vice=leadership.ranking.find(x=>xiIds.has(x.player.id) && x.player.id!==captain?.id)?.player || selection.starters.find(p=>p.id!==captain?.id) || null;
      c.captainId=captain?.id||null;
      c.viceCaptainId=vice?.id||null;
      pc.captaincy={captainId:c.captainId,viceCaptainId:c.viceCaptainId,heroRank:leadership.heroRank,heroYears:leadership.heroYears,day:s.day};
      const role=Squad.roleForHero(s,selection);
      const reason=role==="Titular"?"Mérito na disputa por posição, forma, confiança e condição física.":role==="Banco"?"Você está relacionado, mas outro atleta inicia na posição.":"Concorrência, condição ou disponibilidade deixaram você fora da relação.";
      Squad.recordDecision(s,role,reason);
      pc.matchSelection={day:s.day,role,formation:selection.formation,bench:selection.bench.map(p=>p.id),reason};
      return;
    }
  }
  function registerMatch(s, rng, homeId, awayId, meta, leagueMatch) {
    const hc = club(s, homeId), ac = club(s, awayId);
    const disciplineMeta={...meta,leagueId:leagueMatch?hc.leagueId:null};
    const disciplineKey=prepareDisciplineAvailability(s,hc,disciplineMeta);
    prepareDisciplineAvailability(s,ac,disciplineMeta);
    preparePlayerLineup(s, rng, homeId, awayId);
    const m = simulate(hc, ac, rng, s);
    if (s.mode === "player") {
      const q=Physical?.init?.(s.person,s.day), a=q?.active, key=a&&`injury:${a.startDay}:${a.type}`;
      if(a&&a.startDay===s.day&&key&&!q.processed.includes(key)){q.processed.push(key);Career.addMessage?.(s,{category:"CARREIRA",sender:"Departamento médico",subject:`Diagnóstico: ${a.name}`,body:`${a.severity}. Previsão inicial: ${a.totalDays} dia(s). A recuperação será acompanhada pelo calendário.`,priority:a.severity==="GRAVE"?"IMPORTANTE":"NORMAL",eventId:key});}
    }
    Object.assign(m, {
      date: s.day,
      round: meta.round,
      season: s.season,
      leagueId: leagueMatch ? hc.leagueId : null,
      competitionId: meta.competitionId,
      competitionName: meta.competitionName,
    });
    processDiscipline(s,m,disciplineMeta,hc,ac);
    serveDisciplineSuspensions(hc,disciplineKey);
    serveDisciplineSuspensions(ac,disciplineKey);
    if (!leagueMatch) Competitions?.recordResult(s, m, rng);
    const heroOffense = m.offensiveStats?.hero;
    m.offensiveStats = heroOffense ? { hero: heroOffense } : {};
    s.matches.unshift(m);
    Statistics?.recordMatch(s, m);
    const heroDevelopment = Training?.matchDevelopment?.(s, m, { overall, clamp });
    if (![homeId, awayId].includes(s.clubId)) { delete m.participation; delete m.playerStats; }
    else m.playerStats = m.playerStats?.hero ? { hero:m.playerStats.hero } : {};
    if (leagueMatch) [hc, ac].forEach((c, i) => {
      const gf = i ? m.ag : m.hg, ga = i ? m.hg : m.ag, t = c.stats;
      t.played++; t.gf += gf; t.ga += ga;
      if (gf > ga) { t.w++; t.points += 3; } else if (gf === ga) { t.d++; t.points++; } else t.l++;
      c.roster.forEach((p) => (p.morale = clamp(p.morale + (gf > ga ? 4 : gf < ga ? -4 : 0), 15, 100)));
    });
    if ([homeId, awayId].includes(s.clubId)) {
      const trustBefore = s.mode === "player" ? Number(Career.init(s).playerCareer?.coachTrust || 0) : 0;
      Career.match(s, m);
      if (s.mode === "player") {
        const pc = Career.init(s).playerCareer, perf = m.playerStats?.hero, played = !!m.ratings?.hero;
        const goals = m.events.filter((e) => e.type === "goal" && e.playerId === "hero").length;
        const assists = m.events.filter((e) => e.type === "goal" && e.assistPlayerId === "hero").length;
        const yellowCards=m.events.filter(e=>e.type==="yellow"&&e.playerId==="hero").length, redCard=m.events.some(e=>e.type==="red"&&e.playerId==="hero");
        const selection = pc.matchSelection || {}, unavailable = !!s.person.injury || Number(s.person.suspension || 0) > 0;
        const status = played ? (perf?.starter === false ? "ENTROU_DO_BANCO" : "TITULAR") : unavailable ? "INDISPONIVEL" : selection.role === "Banco" ? "NAO_UTILIZADO" : "NAO_RELACIONADO";
        const report = {
          day:s.day, season:s.season, competition:m.competitionName || "Partida", opponent:(homeId===s.clubId?ac:hc)?.name || "Adversário",
          status, entryMinute:played && perf?.starter === false ? Number(perf.entryMinute || 0) : null, minutes:played ? Number(perf?.minutes || 0) : 0,
          rating:played ? Number(m.ratings.hero || 0) : null, goals, assists, yellowCards, redCard, xp:played ? +(heroDevelopment?.xp || 0).toFixed(2) : 0,
          levelBefore:heroDevelopment?.levelBefore ?? null, levelAfter:heroDevelopment?.levelAfter ?? null, coachTrustBefore:trustBefore, coachTrustAfter:Number(pc.coachTrust || 0),
          objectivesMet:played ? Number(pc.lastEvaluation?.met || 0) : 0, objectivesTotal:played ? Number(pc.lastEvaluation?.total || 0) : 0
        };
        pc.lastMatchReport = report;
        Squad?.evaluateCoachPromise?.(s,report);
        Squad?.recordTrustChange?.(s,"match",trustBefore,pc.coachTrust,{
          eventId:`coach-trust:${s.season}:${s.day}:${homeId}:${awayId}`,
          status,
          rating:report.rating,
          objectivesMet:report.objectivesMet,
          objectivesTotal:report.objectivesTotal
        });
        const eventId = `match-report:${s.season}:${s.day}:${homeId}:${awayId}`;
        let body;
        if (status === "TITULAR") body = `${s.person.name} foi titular, jogou ${report.minutes} min, nota ${report.rating.toFixed(1)}, ${goals} gol(s) e ${assists} assistência(s). XP +${report.xp.toFixed(1)} · confiança ${report.coachTrustAfter-trustBefore>=0?"+":""}${Math.round(report.coachTrustAfter-trustBefore)}.`;
        else if (status === "ENTROU_DO_BANCO") body = `${s.person.name} entrou aos ${report.entryMinute}', jogou ${report.minutes} min, nota ${report.rating.toFixed(1)}, ${goals} gol(s) e ${assists} assistência(s). XP +${report.xp.toFixed(1)} · confiança ${report.coachTrustAfter-trustBefore>=0?"+":""}${Math.round(report.coachTrustAfter-trustBefore)}.`;
        else if (status === "INDISPONIVEL") body = `${s.person.name} não esteve disponível para a partida por condição clínica ou suspensão.`;
        else if (status === "NAO_UTILIZADO") body = `${s.person.name} ficou no banco, mas não foi utilizado pelo treinador.`;
        else body = `${s.person.name} não foi relacionado para esta partida.`;
        Career.addMessage?.(s,{category:"TREINADOR",sender:"Comissão técnica",subject:"Resumo da partida",body,eventId});
      }
      Career.processMatchEvent?.(s, m);
      Commercial?.onMatch?.(s, m, Career, API);
      const own = homeId === s.clubId ? m.hg : m.ag, other = homeId === s.clubId ? m.ag : m.hg;
      s.board = clamp(s.board + (own > other ? 5 : own < other ? -5 : 0), 0, 100);
      s.reputation = clamp(s.reputation + (own > other ? 1 : own < other ? -0.4 : 0.2), 0, 100);
      s.fans += own > other ? 60 : 10;
      log(s, (m.competitionName || "Partida") + " · " + hc.name + " " + m.hg + " × " + m.ag + " " + ac.name, m.summary);
      if (s.mode === "player" && !m.participants.flat().includes("hero")) log(s, "Fora da escalação", "O treinador priorizou outros jogadores. Treino, moral, atributos e concorrência influenciam a escolha.");
    }
    s.matches = s.matches.slice(0, 800);
    for (const old of s.matches.slice(120)) {
      if ([old.home, old.away].includes(s.clubId)) continue;
      old.events=[];
      old.participants=[[],[]];
      old.ratings={};
      old.summary="Arquivado";
      old.shots=[0,0]; old.target=[0,0]; old.xg=[0,0]; old.possession=50;
      delete old.offensiveStats;
      delete old.playerStats;
      delete old.possessions;
    }
    return m;
  }
  function playRound(s, rng) {
    const pairs = s.fixtures[s.round];
    if (!pairs) return;
    for (const [homeId, awayId] of pairs) {
      const leagueId = club(s, homeId).leagueId;
      registerMatch(s, rng, homeId, awayId, { round: s.round + 1, competitionId: leagueId, competitionName: s.leagues.find((l) => l.id === leagueId)?.name || leagueId }, true);
    }
    s.round++;
  }
  function playCompetitions(s, rng) {
    for (const fixture of Competitions?.due(s) || []) registerMatch(s, rng, fixture.home, fixture.away, fixture, false);
  }
  function nextFixtureDay(s) {
    return (
      (s.season - 2026) * 365 + (s.calendarDays?.[s.round] ?? 7 + s.round * 21)
    );
  }
  function nextCommitment(s) {
    const pair = s.fixtures[s.round]?.find((fixture) => fixture.includes(s.clubId));
    const league = pair && { home: pair[0], away: pair[1], date: nextFixtureDay(s), round: s.round + 1, competitionId: club(s)?.leagueId, competitionName: s.leagues.find((l) => l.id === club(s)?.leagueId)?.name };
    const extra = Competitions?.nextFixture(s);
    const nationalMatch = s.mode === "player" && NationalTeam?.init(s).calledUp ? NationalTeam.upcoming(s)[0] : null;
    const national = nationalMatch && { date: nationalMatch.day, competitionId: "nationalTeam", competitionName: nationalMatch.competition, stage: "Seleção Brasileira", opponent: nationalMatch.opponent, homeName: "Brasil", awayName: nationalMatch.opponent };
    return [league, extra, national].filter(Boolean).sort((a, b) => a.date - b.date)[0] || null;
  }
  function newSeason(s, rng) {
    World2?.init(s, API);
    World2?.snapshotPerformance(s);
    const orders = Object.fromEntries((s.leagues || []).map((league) => [league.id, table(s, league.id)]));
    Competitions?.closeSeason(s, table);
    const seasonAwards = Statistics?.closeSeason(s) || [];
    if (s.mode === "player" && Career && seasonAwards.length) {
      const heroAwards=seasonAwards.filter(a=>a?.winner===s.person.name);
      for(const a of heroAwards){
        const eid=`AWARD_WON:${s.season}:${a.competitionId||a.leagueId}:${String(a.name).replace(/[^a-zA-Z0-9_-]/g,"_")}:hero`;
        Career.emitEvent?.(s,"AWARD_WON",eid,{name:a.name,competition:a.league,value:a.value});
        Career.addMessage?.(s,{category:"CARREIRA",sender:"PRO LIFE",subject:`Prêmio: ${a.name}`,body:`Você conquistou ${a.name} em ${a.league}.`,priority:"IMPORTANTE",eventId:eid});
        Career.addArticle?.(s,{category:"JOGADOR",title:`${s.person.name} conquista ${a.name}`,body:`O reconhecimento foi confirmado em ${a.league}, com base no desempenho registrado na temporada.`,eventId:eid});
      }
      if(heroAwards.length) s.reputation=clamp(s.reputation+Math.min(6,heroAwards.length*1.5),0,100);
    }
    Training?.seasonRewards?.(s, seasonAwards, { overall, clamp });
    for (const league of s.leagues || [
      { id: undefined, name: "Liga Horizonte" },
    ]) {
      const order = table(s, league.id);
      s.history.unshift({
        season: s.season,
        leagueId: league.id,
        league: league.name,
        champion: order[0].name,
        position:
          s.clubId && club(s)?.leagueId === league.id
            ? order.findIndex((c) => c.id === s.clubId) + 1
            : null,
        mode: s.mode,
        goals: s.person.goals,
        minutes: s.person.minutes,
      });
      log(
        s,
        "Fim da temporada",
        order[0].name +
          " é campeão de " +
          league.name +
          ". " +
          order[0].stats.points +
          " pontos e " +
          order[0].stats.w +
          " vitórias.",
      );
    }
    s.history = s.history.slice(0, 300);
    const movement = [];
    if (s.world === "brazil2026") {
      for (const [upper, lower] of [["serieA", "serieB"], ["serieB", "serieC"], ["serieC", "serieD"]]) {
        const relegated = orders[upper].slice(-4), promoted = orders[lower].slice(0, 4);
        for (const c of relegated) movement.push({ club: c, from: upper, to: lower, type: "rebaixado" });
        for (const c of promoted) movement.push({ club: c, from: lower, to: upper, type: "promovido" });
      }
      for (const move of movement) move.club.leagueId = move.to;
      log(s, "Acesso e rebaixamento", movement.map((m) => m.club.name + " " + (m.type === "promovido" ? "subiu para " : "caiu para ") + (Competitions?.leagueNames[m.to] || m.to)).join("; ") + ".");
    }
    s.season++;
    if (s.mode === "player") Statistics?.ensureHeroStint?.(s, s.clubId);
    s.round = 0;
    s.person.age++;
    for (const c of s.clubs) {
      c.budget += 180000 + c.stats.points * 1000;
      c.stats = { points: 0, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    }
    // Etapa 15: idade, evolução/declínio, aposentadoria, contratos e novos talentos (World2). O protagonista segue seu fluxo próprio.
    World2.rollSeason(s, API);
    for (const c of s.clubs) for (const p of c.roster) { if (p.id === "hero") { p.goals = 0; p.minutes = 0; } }
    s.person.goals = 0;
    if (s.world === "brazil2026") {
      const rounds = ["serieA", "serieB", "serieC", "serieD"].map((leagueId) =>
        schedule(s.clubs.filter((c) => c.leagueId === leagueId).map((c) => c.id)),
      );
      s.fixtures = rounds[0].map((round, i) => round.concat(...rounds.slice(1).map((leagueRounds) => leagueRounds[i])));
    } else s.fixtures = schedule(s.clubs.map((c) => c.id));
    Competitions?.nextSeason(s, orders);
    if (s.upgradeClub) migrateWorld(s, s.upgradeClub, rng);
    if (s.person.age >= 35 && s.mode === "player")
      log(
        s,
        "Uma nova etapa",
        "Você já pode se aposentar e seguir como treinador no mesmo universo.",
      );
  }
  function recordDevelopment(s) {
    if (!s.development) s.development = [];
    const entry = {
      day: s.day,
      season: s.season,
      overall: overall(s.person),
      attrs: { ...s.person.attrs },
      condition: s.person.condition,
      morale: s.person.morale,
      reputation: s.reputation,
      minutes: s.person.minutes,
      goals: s.person.goals,
      training: s.training,
      intensity: s.intensity,
    };
    if (s.development.at(-1)?.day === s.day)
      s.development[s.development.length - 1] = entry;
    else s.development.push(entry);
    s.development = s.development.slice(-260);
  }
  function birthdayDefaults(s) {
    if (s.mode!=="player") return null;
    if(!s.person.birthDate){
      // Compatibilidade com saves antigos: preserva a idade atual e fixa uma data de aniversário.
      // 01/01 evita alterar retroativamente a idade do save.
      const startYear=2026-Math.max(14,Number(s.person.age||18));
      s.person.birthDate={day:1,month:1,year:startYear};
    }
    s.birthday ||= { lastCelebratedYear:null, history:[] };
    return s.person.birthDate;
  }
  function calendarDateForDay(day){
    const d=new Date(Date.UTC(2026,0,1)+Number(day||0)*86400000);
    return {day:d.getUTCDate(),month:d.getUTCMonth()+1,year:d.getUTCFullYear()};
  }
  function birthdayTick(s){
    if(s.mode!=="player")return false;
    const b=birthdayDefaults(s), now=calendarDateForDay(s.day);
    const age=Math.max(14,now.year-Number(b.year||now.year-18)-((now.month<b.month||(now.month===b.month&&now.day<b.day))?1:0));
    s.person.age=age;
    if(now.day!==Number(b.day)||now.month!==Number(b.month)||s.birthday.lastCelebratedYear===now.year||s.decision)return false;
    s.birthday.lastCelebratedYear=now.year;
    s.decision={
      id:`birthday_${now.year}`, kind:"birthday", title:`Seu aniversário de ${age} anos`,
      body:"Hoje é seu aniversário. Como você quer comemorar? Sua escolha pode repercutir na vida pessoal, no elenco, entre os fãs e nas redes sociais.",
      choices:[
        ["birthday_family","Comemorar com a família"],
        ["birthday_team","Jantar com companheiros de equipe"],
        ["birthday_fans","Evento com os fãs"],
        ["birthday_charity","Ação beneficente"],
        ["birthday_private","Comemoração reservada"]
      ],
      createdDay:s.day,deadline:s.day+1,birthdayYear:now.year
    };
    log(s,"Aniversário",`${s.person.name} completa ${age} anos.`);
    return true;
  }
  function birthdayDecision(s,choice,resolvedDecision){
    if(resolvedDecision?.kind!=="birthday")return false;
    const effects={
      birthday_family:{family:14,morale:5,stress:-10,fans:80,reputation:1,title:"Aniversário em família",body:"O jogador escolheu passar o aniversário perto da família. A postura reservada foi bem recebida."},
      birthday_team:{family:1,morale:8,stress:-5,fans:180,reputation:1,title:"Celebração com o elenco",body:"Companheiros celebraram o aniversário juntos, reforçando o ambiente e a integração no grupo."},
      birthday_fans:{family:0,morale:4,stress:5,fans:650,reputation:2,title:"Festa perto da torcida",body:"A comemoração com torcedores movimentou as redes e aproximou ainda mais o jogador dos fãs."},
      birthday_charity:{family:3,morale:6,stress:1,fans:450,reputation:4,title:"Aniversário com propósito",body:"O aniversário foi marcado por uma ação beneficente e recebeu forte repercussão positiva."},
      birthday_private:{family:2,morale:3,stress:-12,fans:20,reputation:0,title:"Dia reservado",body:"O jogador preferiu uma comemoração discreta, preservando a vida pessoal e recuperando as energias."}
    };
    const x=effects[choice]; if(!x)return false;
    s.family=clamp(s.family+x.family,0,100);s.person.morale=clamp(s.person.morale+x.morale,0,100);
    s.stress=clamp(s.stress+x.stress,0,100);s.fans=Math.max(0,Number(s.fans||0)+x.fans);
    s.reputation=clamp(s.reputation+x.reputation,0,100);
    const career=Career.init(s); career.feed ||= [];
    career.feed.unshift({id:`birthday_${s.day}_${choice}`,day:s.day,author:"PRO LIFE Futebol",category:"Vida pessoal",kind:"story",title:x.title,body:x.body,likes:Math.max(25,Math.round(x.fans*.7+Math.max(0,s.reputation)*5)),liked:false});
    s.birthday.history.push({day:s.day,age:s.person.age,choice,title:x.title,effects:{family:x.family,morale:x.morale,stress:x.stress,fans:x.fans,reputation:x.reputation}});
    Career.addMessage?.(s,{category:"VIDA PESSOAL",sender:"Assessoria",subject:x.title,body:x.body,priority:"NORMAL",eventId:`birthday_result_${s.day}_${choice}`});
    return true;
  }
  function advance(s, days = 1) {
    Career.init(s);
    Training?.init(s);
    Statistics?.init(s);
    Competitions?.init(s);
    Life?.init(s);
    Commercial?.init(s, API);
    UnexpectedEvents?.init(s);
    const rng = new Random(s.rng);
    for (let d = 0; d < clamp(days, 1, 30); d++) {
      s.day++;
      Career.daily(s);
      birthdayTick(s);
      World2?.daily(s, API);
      NationalTeam?.daily(s, rng, API, log);
      Commercial?.daily?.(s, rng, Career, API);
      s.contract = Math.max(0, s.contract - 1);
      s.offers = s.offers.filter((o) => o.expires >= s.day);
      if (s.mode === "player" && s.clubId) {
        const pc = Career.init(s).playerCareer;
        if (pc.renewalOffer && pc.renewalOffer.expires < s.day) pc.renewalOffer = null;
        if (s.contract > 0 && s.contract <= 180 && !pc.renewalOffer && s.day % 30 === 0) Career.createRenewalOffer(s);
        if (s.contract === 0) {
          const old = club(s);
          if (old) { old.roster = old.roster.filter((p) => p.id !== "hero"); old.lineup = old.lineup.filter((id) => id !== "hero"); }
          if (pc.contract?.type === "loan" && pc.contract.parentClubId) {
            const parent=club(s,pc.contract.parentClubId);
            if(parent){ parent.roster.push(s.person); s.clubId=parent.id; s.salary=pc.contract.parentSalary||s.salary; s.contract=Math.max(30,(pc.contract.parentContractRemaining||395)-pc.contract.durationDays); pc.contract={clubId:parent.id,signedDay:s.day,endDay:s.day+s.contract,durationDays:s.contract,salary:s.salary,signingBonus:0,role:pc.squadRole,type:"permanent"}; log(s,"Fim do empréstimo",`Você retornou ao ${parent.name} após o período de empréstimo.`); }
          } else { s.clubId = null; pc.contract = null; s.careerTransferAvailableDay = 0; log(s, "Fim de contrato", "Seu vínculo terminou. Você está livre para assinar com um novo clube."); }
          pc.renewalOffer = null;
        }
      }
      for (const c of s.clubs)
        for (const p of c.roster) {
          Physical?.daily?.(p, s.day, p.id === "hero" ? s.intensity : "normal");
          if (!Physical) { p.injury = Math.max(0, p.injury - 1); p.condition = clamp(p.condition + (p.id === "hero" && s.intensity === "hard" ? 2 : 5), 0, 100); }
          p.suspension = Math.max(0, (p.suspension || 0));
        }
      if (s.mode === "player" && !s.clubId) {
        Physical?.daily?.(s.person, s.day, s.intensity);
        if (!Physical) { s.person.injury = Math.max(0, s.person.injury - 1); s.person.condition = clamp(s.person.condition + 5, 0, 100); }
      }
      if (!s.person.injury && s.mode === "player") {
        s.person.condition = clamp(
          s.person.condition -
            (s.intensity === "hard" ? 5 : s.intensity === "rest" ? 0 : 2),
          0,
          100,
        );
        const improved = Training?.daily(s, rng, { overall, clamp });
        if (improved) {
          Squad?.trainingResult?.(s, improved);
          log(s, "Evolução no treino", improved.label + " melhorou com a rotina de trabalho.");
        }
        Physical?.trainLoad?.(s.person, s.intensity);
        if (s.intensity === "hard" && rng.next() < (Physical?.risk?.(s.person, "hard") ?? 0.015)) {
          const trainingInjury = Physical?.injure?.(s.person, rng, s.day, "treino");
          if (!trainingInjury) s.person.injury = rng.int(3, 12);
          log(
            s,
            "Carga elevada",
            "Você sofreu uma lesão no treino. Recuperação estimada: " +
              s.person.injury +
              " dias.",
          );
        }
      }
      if (s.day === nextFixtureDay(s) && s.round < s.fixtures.length)
        playRound(s, rng);
      playCompetitions(s, rng);
      // Investimentos vencem no dia exato, independentemente do fechamento mensal.
      Life?.dailyFinance?.(s, Career);
      UnexpectedEvents?.daily?.(s, rng, Career, API);
      if (s.day % 30 === 0) {
        Life?.monthlyFinance?.(s, Career);
        Career.monthly(s);
        Life?.monthly(s, Career);
        const c = club(s);
        if (c) {
          c.budget -= s.salary + 22000;
          log(
            s,
            "Fechamento financeiro",
            "Salário e despesas do mês foram contabilizados.",
          );
        }
        if (s.mode === "coach" && s.board <= 15) {
          s.clubId = null;
          s.board = 50;
          log(
            s,
            "Demissão",
            "A diretoria encerrou seu vínculo pelos resultados. Você pode buscar uma nova oportunidade.",
          );
        }
      }
      if (s.day % 21 === 0 && !s.decision) {
        s.decision = Life?.next(s, rng);
        if (s.decision) { s.decision.createdDay = s.day; s.decision.deadline = s.day + 7; }
        log(s, "Decisão pendente", s.decision.title);
      }
      if (s.mode === "player") {
        const due = Career.marketTick(s);
        if (due && Career.windowStatus(s).open && s.day >= due.startDay) join(s,due.clubId,due.salary);
      }
      if (s.day % 28 === 0 && Career.windowStatus(s).open)
        Career.world(s, rng, API);
      if (
        (s.day % 28 === 0 ||
          Career.windows.some((w) => w.start === s.day % 365)) &&
        Career.canTransfer(s) && s.mode === "coach"
      ) {
        s.offers = weightedCareerOffers(s, rng, 3);
        if (s.mode === "player") s.offers.forEach((o) => Career.registerInterest(s, o.clubId, "Oferta oficial"));
        log(
          s,
          "Mercado de trabalho",
          "Três clubes demonstram interesse. As propostas expiram em 21 dias.",
        );
      }
      if (s.day % 7 === 0) Career.livingWorld(s, rng, API);
      if (s.day % 7 === 0 && s.mode === "player") Career.progressInterest(s, rng, weightedCareerOffers);
      if (s.day % 14 === 0) Career.rumor(s, rng);
      if (s.day % 365 === 0) newSeason(s, rng);
      if (s.day % 7 === 0 || s.day % 365 === 0) recordDevelopment(s);
      s.stress = clamp(
        s.stress + (s.intensity === "hard" ? 0.3 : -0.1),
        0,
        100,
      );
    }
    s.rng = rng.state;
    return s;
  }
  function pendingActions(s) {
    if (s.mode !== "player") return [];
    const pc = Career.init(s).playerCareer, out = [];
    if (s.decision) out.push({ id:`life:${s.decision.id || s.decision.title}`, entityId:s.decision.id, type:"decision", title:s.decision.title, deadline:Number.isFinite(s.decision.deadline)?s.decision.deadline:s.day+7, page:"life", anchor:"current-decision", priority:"URGENTE" });
    const interviews=(Career.init(s)?.communications?.interviews || []).filter(i=>!i.answered);
    for (const i of interviews) out.push({ id:`interview:${i.id}`, entityId:i.id, type:"interview", title:i.title || i.subject || "Convite para uma entrevista", deadline:Number.isFinite(i.deadline)?i.deadline:s.day+7, page:"inbox", anchor:`interview-${i.id}`, priority:"URGENTE" });
    if (pc?.renewalOffer) out.push({ id:`renewal:${pc.renewalOffer.expires}`, entityId:String(pc.renewalOffer.expires), type:"renewal", title:"Responder proposta de renovação", deadline:pc.renewalOffer.expires, page:"proposals", anchor:"renewal-offer", priority:"URGENTE" });
    for (const o of (s.offers || []).filter(o=>o.expires>=s.day)) out.push({ id:`offer:${o.clubId}:${o.expires}`, entityId:o.clubId, type:"offer", title:`Responder proposta de ${club(s,o.clubId)?.name || "transferência"}`, deadline:o.expires, page:"proposals", anchor:`transfer-offer-${o.clubId}`, priority:"URGENTE" });
    const commercial=Commercial?.init(s,API);
    for (const p of (commercial?.proposals || []).filter(p=>p.status==="PROPOSTA"&&p.expires>=s.day)) out.push({ id:`commercial:${p.id}`, entityId:p.id, type:"commercial", title:`Responder proposta de ${p.brand}`, deadline:p.expires, page:"sponsorships", anchor:`commercial-proposal-${p.id}`, priority:"URGENTE" });
    for (const e of (commercial?.events || []).filter(e=>["AGENDADO","REAGENDADO"].includes(e.status)&&e.mandatory&&e.day>=s.day)) out.push({ id:`commercial-event:${e.id}`, entityId:e.id, type:"commercial-event", title:`Confirmar compromisso com ${e.brand}`, deadline:e.day, page:"sponsorships", anchor:`commercial-event-${e.id}`, priority:"URGENTE" });
    return out.sort((a,b)=>a.deadline-b.deadline);
  }
  function expiringAction(s, targetDay) { return pendingActions(s).find(x=>x.deadline<=targetDay) || null; }
  function simulationBlocker(s, before = {}) {
    const career = s.mode === "player" ? Career.init(s) : null;
    const pc = career?.playerCareer || null;
    if (s.decision && !before.decision) return { type:"decision", id:s.decision.id, title:s.decision.title, page:"life", anchor:"current-decision", message:`Simulação interrompida: ${s.decision.title}.` };
    if (pc?.renewalOffer && !before.renewalOffer) return { type:"renewal", page:"proposals", anchor:"renewal-offer", message:"Simulação interrompida: chegou uma proposta de renovação." };
    const previousOffers = new Set(before.offers || []);
    const newOffer = (s.offers || []).find(o=>!previousOffers.has(`${o.clubId}:${o.expires}:${o.salary}`));
    if (newOffer) return { type:"offer", id:newOffer.clubId, page:"proposals", anchor:`transfer-offer-${newOffer.clubId}`, message:`Simulação interrompida: chegou uma proposta de ${club(s,newOffer.clubId)?.name || "outro clube"}.` };
    const previousInterviews = new Set(before.interviews || []);
    const interview = (career?.communications?.interviews || []).find(i=>!i.answered && !previousInterviews.has(i.id));
    if (interview) return { type:"interview", id:interview.id, title:"Convite para uma entrevista", page:"inbox", anchor:`interview-${interview.id}`, message:"Simulação interrompida: convite para uma entrevista." };
    const commercial = Commercial?.init(s, API);
    const previousCommercial = new Set(before.commercialProposals || []);
    const proposal = (commercial?.proposals || []).find(p=>p.status==="PROPOSTA" && !previousCommercial.has(p.id));
    if (proposal) return { type:"commercial", id:proposal.id, title:`Proposta de ${proposal.brand}`, page:"sponsorships", anchor:`commercial-proposal-${proposal.id}`, message:`Simulação interrompida: ${proposal.brand} enviou uma proposta comercial.` };
    const previousEvents = new Set(before.commercialEvents || []);
    const event = (commercial?.events || []).find(ev=>["AGENDADO","REAGENDADO"].includes(ev.status) && !previousEvents.has(ev.id));
    if (event) return { type:"commercial-event", id:event.id, title:`Campanha de ${event.brand}`, page:"sponsorships", anchor:`commercial-event-${event.id}`, message:`Simulação interrompida: há uma campanha de patrocinador aguardando sua decisão.` };
    return null;
  }
  function autoTrainingPlan(s) {
    if (s.mode !== "player" || !s.person?.attrs) return;
    const archetype = Training?.archetypes?.[s.person.pos];
    const focusAttrs = archetype?.focus || [];
    const groups = Training?.groups || {};
    const candidates = Object.entries(groups).map(([group, attrs]) => {
      const relevant = attrs.filter((a) => focusAttrs.includes(a));
      const pool = relevant.length ? relevant : attrs;
      const avg = pool.reduce((sum, a) => sum + Number(s.person.attrs[a] || 50), 0) / Math.max(1, pool.length);
      return { group, avg, relevant: relevant.length };
    }).sort((a,b) => (b.relevant-a.relevant) || (a.avg-b.avg));
    if (candidates[0]) s.training = candidates[0].group;
    s.intensity = s.person.condition < 58 ? "rest" : s.person.condition > 82 && !s.person.injury ? "hard" : "normal";
  }
  function autoResolveDecision(s) {
    if (!s.decision?.choices?.length) return false;
    const rng = new Random(s.rng);
    const picked = rng.pick(s.decision.choices);
    s.rng = rng.state;
    const title = s.decision.title, label = picked[1];
    decide(s, picked[0]);
    log(s, "Decisão automática", `${title} · Escolha: ${label}.`);
    return true;
  }
  function autoResolveRenewal(s) {
    if (s.mode !== "player" || !s.clubId) return false;
    const pc = Career.init(s).playerCareer;
    if (!pc.renewalOffer) return false;
    const fair = Career.realisticSalary(s);
    const offer = pc.renewalOffer;
    if ((offer.round || 0) < 2 && offer.salary < fair * 1.02) {
      Career.counterRenewal(s, {
        salary: Math.round(Math.max(fair * 1.08, offer.salary * 1.08) / 1000) * 1000,
        years: pc.coachTrust >= 80 ? 4 : 3,
        signingBonus: Math.round(Math.max(offer.signingBonus || 0, fair * 3) / 1000) * 1000,
        performanceBonus: Math.round(Math.max(offer.performanceBonus || 0, fair * .5) / 1000) * 1000,
        role: pc.coachTrust >= 88 ? "Estrela" : pc.coachTrust >= 70 ? "Importante" : "Titular",
      });
    }
    const finalOffer = pc.renewalOffer;
    if (finalOffer && finalOffer.salary >= fair * .82) {
      const salary = finalOffer.salary;
      Career.acceptRenewal(s);
      log(s, "Decisão automática · Agente", `Renovação concluída por R$ ${salary.toLocaleString("pt-BR")}/mês após negociação automática.`);
      return true;
    }
    if (pc.renewalOffer) {
      Career.rejectRenewal(s);
      log(s, "Decisão automática · Agente", "A proposta de renovação ficou abaixo do valor considerado adequado e foi recusada.");
    }
    return true;
  }
  function autoResolveOffers(s) {
    if (!s.offers?.length || s.mode !== "player") return false;
    const pc = Career.init(s).playerCareer;
    const stance = pc.agentStrategy?.stance || "stay";
    const valid = s.offers.filter(o => o.expires >= s.day);
    if (!valid.length) return false;
    const currentSalary = s.salary || 0;
    const candidates = valid.slice().sort((a,b) => (b.salary || 0) - (a.salary || 0));
    const best = candidates[0];
    const wantsMove = ["exit", "loan"].includes(stance) || !s.clubId;
    if (wantsMove && best && (!s.clubId || best.salary >= currentSalary * 1.12)) {
      const name = club(s, best.clubId)?.name || "novo clube";
      join(s, best.clubId, best.salary);
      log(s, "Decisão automática · Agente", `A melhor proposta disponível foi aceita: ${name}, salário de R$ ${best.salary.toLocaleString("pt-BR")}/mês.`);
    } else {
      s.offers = [];
      log(s, "Decisão automática · Agente", "As propostas de transferência foram analisadas e recusadas para preservar o projeto atual.");
    }
    return true;
  }
  function autoSeasonActions(s) {
    if (s.mode === "player") {
      const pc = Career.init(s).playerCareer;
      if (s.clubId && s.contract > 0 && s.contract <= 180 && !pc.renewalOffer && (s.day - (pc.lastRenewalRequestDay || -999)) >= 30) {
        try { Career.requestRenewal(s); } catch (_) {}
      }
      autoResolveRenewal(s);
      autoResolveOffers(s);
      for (const proposal of (Commercial?.init(s, API)?.proposals || []).filter((p) => p.status === "PROPOSTA" && p.expires >= s.day)) {
        try { Commercial.accept(s, proposal.id, Career, API); }
        catch (_) { Commercial.reject(s, proposal.id, Career, API); }
      }
      // A simulação não substitui as preferências de treino escolhidas pelo jogador.
    }
    autoResolveDecision(s);
  }
  function simulateAdvance(s, mode = "nextMatch") {
    Career.init(s);
    const startDay = s.day;
    const startSeason = s.season;
    const initialCommitment = nextCommitment(s);
    let targetDay;
    if (mode === "nextMatch") {
      if (!initialCommitment || initialCommitment.date <= s.day) throw Error("Não há próximo jogo agendado.");
      targetDay = initialCommitment.date;
    } else if (mode === "nextCommitment") {
      if (!initialCommitment || initialCommitment.date <= s.day) throw Error("Não há próximo compromisso agendado.");
      targetDay = Math.max(s.day, initialCommitment.date - 1);
    } else if (mode === "30days") targetDay = s.day + 30;
    else if (mode === "season") targetDay = (Math.floor(s.day / 365) + 1) * 365;
    else throw Error("Tipo de simulação inválido.");
    let stop = null;
    const automatic = mode === "season";
    while (s.day < targetDay && s.season === startSeason) {
      const career = s.mode === "player" ? Career.init(s) : null;
      const pc = career?.playerCareer || null;
      const commercialBefore = s.mode === "player" ? Commercial?.init(s, API) : null;
      const before = {
        decision: !!s.decision,
        renewalOffer: !!pc?.renewalOffer,
        offers: (s.offers || []).map((o) => `${o.clubId}:${o.expires}:${o.salary}`),
        interviews: (career?.communications?.interviews || []).map((i) => i.id),
        commercialProposals: (commercialBefore?.proposals || []).filter(p=>p.status==="PROPOSTA").map(p=>p.id),
        commercialEvents: (commercialBefore?.events || []).filter(ev=>["AGENDADO","REAGENDADO"].includes(ev.status)).map(ev=>ev.id)
      };
      advance(s, 1);
      if (automatic) autoSeasonActions(s);
      else {
        stop = simulationBlocker(s, before);
        if (stop) break;
      }
    }
    const completed = mode === "season" ? s.season !== startSeason : s.day >= targetDay;
    const result = { mode, startDay, endDay: s.day, days: s.day - startDay, completed, stop, automatic };
    s.lastSimulation = result;
    if (stop) log(s, "Simulação pausada", stop.message);
    else if (mode === "nextCommitment") log(s, "Próximo compromisso preparado", `A carreira avançou ${result.days} dia(s) e parou antes do próximo compromisso.`);
    else if (mode === "nextMatch") log(s, "Próximo jogo alcançado", `A carreira avançou ${result.days} dia(s) até o próximo compromisso.`);
    else if (mode === "30days") log(s, "Simulação concluída", `A carreira avançou ${result.days} dia(s).`);
    else if (completed) log(s, "Temporada simulada", `A temporada ${startSeason} foi processada até o encerramento com decisões automáticas.`);
    return result;
  }
  function decisionSnapshot(s){
    return {
      money:Number(s.money||0), reputation:Number(s.reputation||0), fans:Number(s.fans||0),
      morale:Number(s.person?.morale||0), stress:Number(s.stress||0), family:Number(s.family||0),
      training:Number(s.trainingProgress||0), fitness:Number(s.person?.fitness??s.person?.condition??0),
      overall:Number(s.person?.overall||0), board:Number(s.board||0)
    };
  }
  function decisionDelta(before,s){
    const after=decisionSnapshot(s), delta={};
    for(const k of Object.keys(before)){const d=Number(after[k]||0)-Number(before[k]||0);if(Math.abs(d)>0.0001)delta[k]=d;}
    return delta;
  }
  function applyDecisionConsequence(s,decision,choice,before){
    let delta=decisionDelta(before,s);
    // Regra estrutural: nenhuma escolha narrativa termina sem efeito jogável.
    // Se o sistema específico já aplicou efeito, preserva-o. Caso contrário aplica
    // uma consequência contextual, pequena e coerente.
    if(!Object.keys(delta).length){
      const id=String(decision?.id||decision?.kind||"").toLowerCase();
      const label=String(decision?.choices?.find(c=>c[0]===choice)?.[1]||choice).toLowerCase();
      if(/treino|training|academ|coach|técn|tecn|work/.test(id+" "+label)){
        s.trainingProgress=Number(s.trainingProgress||0)+2;
      }else if(/descans|saúde|saude|fisic|físic|recovery|recover/.test(id+" "+label)){
        s.person.fitness=clamp(Number(s.person.fitness??s.person.condition??75)+4,0,100);
        s.person.condition=s.person.fitness;
        s.stress=clamp(Number(s.stress||0)-3,0,100);
      }else if(/patro|sponsor|invest|compra|buy|carro|casa|finance|dinheiro/.test(id+" "+label)){
        s.reputation=clamp(Number(s.reputation||0)+1,0,100);
        s.fans=Math.max(0,Number(s.fans||0)+75);
      }else if(/fam|amig|festa|social|fan|mídia|midia|media|entrevista/.test(id+" "+label)){
        s.reputation=clamp(Number(s.reputation||0)+1,0,100);
        s.fans=Math.max(0,Number(s.fans||0)+100);
        s.person.morale=clamp(Number(s.person.morale||0)+2,0,100);
      }else{
        s.person.morale=clamp(Number(s.person.morale||0)+2,0,100);
        s.reputation=clamp(Number(s.reputation||0)+1,0,100);
      }
      delta=decisionDelta(before,s);
    }
    s.decisionConsequences ||= [];
    const labels={money:"Finanças",reputation:"Reputação",fans:"Seguidores",morale:"Moral",stress:"Estresse",family:"Família",training:"Evolução técnica",fitness:"Físico",overall:"Overall",board:"Diretoria"};
    const parts=Object.entries(delta).map(([k,v])=>`${labels[k]||k} ${v>0?"+":""}${Math.round(v*100)/100}`);
    const result={day:s.day,decisionId:decision?.id||decision?.kind||"decision",choice,delta,summary:parts.join(" · ")};
    s.decisionConsequences.unshift(result);
    s.decisionConsequences=s.decisionConsequences.slice(0,100);
    const career=Career.init(s); career.feed ||= [];
    career.feed.unshift({id:`decision_effect_${s.day}_${result.decisionId}_${choice}`,day:s.day,author:"PRO LIFE",category:"Repercussão",kind:"story",title:"Consequências da decisão",body:result.summary||"A escolha teve impacto na carreira.",likes:Math.max(10,Math.round(Number(s.reputation||0)*4+Number(s.fans||0)*0.01)),liked:false});
    return result;
  }
  function decide(s, choice) {
    if (!s.decision || !s.decision.choices.some((c) => c[0] === choice))
      throw Error("Decisão inválida.");
    const resolvedDecision = s.decision;
    if (resolvedDecision.source === "unexpected_event") {
      const result = UnexpectedEvents.resolve(s, choice, Career, API);
      log(s, "Escolha registrada", `${result.choiceLabel} | ${result.summary}`);
      return result;
    }
    const consequenceBefore=decisionSnapshot(s);
    if (choice === "visit") {
      s.family = clamp(s.family + 12, 0, 100);
      s.stress = clamp(s.stress - 15, 0, 100);
      s.trainingProgress = Math.max(0, s.trainingProgress - 3);
    }
    if (choice === "work") {
      s.family = clamp(s.family - 8, 0, 100);
      s.trainingProgress += 2;
    }
    if (choice === "humble") {
      s.reputation = clamp(s.reputation + 1, 0, 100);
      s.person.morale = clamp(s.person.morale + 3, 0, 100);
    }
    if (choice === "bold") {
      s.fans += 200;
      s.stress = clamp(s.stress + 15, 0, 100);
      s.board = clamp(s.board - 3, 0, 100);
    }
    const handledBirthday=birthdayDecision(s,choice,resolvedDecision);
    if(!handledBirthday) Life?.decide(s, choice, Career);
    if (resolvedDecision.id === "media") Career.interview(s, choice);
    const choiceLabel = resolvedDecision.choices.find((c) => c[0] === choice)[1];
    const consequence=applyDecisionConsequence(s,resolvedDecision,choice,consequenceBefore);
    log(s, "Escolha registrada", `${choiceLabel} | ${consequence.summary}`);
    if (Career?.addMessage) {
      const eventId = `decision_${s.season}_${s.day}_${resolvedDecision.id}_${choice}`;
      Career.emitEvent?.(s, "CAREER_DECISION_RESOLVED", eventId, { decisionId: resolvedDecision.id, choice });
      Career.addMessage(s, {
        category: "CARREIRA",
        sender: "PRO LIFE",
        subject: "Escolha registrada",
        body: `${resolvedDecision.title}: ${choiceLabel}. Consequências: ${consequence.summary}`,
        priority: "NORMAL",
        eventId,
      });
    }
    s.decision = null;
  }
  function retire(s) {
    if (s.mode !== "player" || s.person.age < 30)
      throw Error("A transição está disponível a partir dos 30 anos.");
    Career.retirementSnapshot?.(s);
    for (const c of s.clubs) {
      c.roster = c.roster.filter((p) => p.id !== "hero");
      c.lineup = c.lineup.filter((id) => id !== "hero");
    }
    s.history.unshift({
      season: s.season,
      event: "Aposentadoria de jogador",
      goals: s.person.goals,
    });
    s.mode = "coach";
    s.clubId = null;
    s.salary = 8000;
    s.license = "C";
    s.offers = s.clubs.slice(0, 3).map((c) => ({
      clubId: c.id,
      salary: 8000,
      role: "Primeiro trabalho como treinador",
      expires: s.day + 30,
    }));
    log(
      s,
      "Do campo ao banco",
      "Seu patrimônio, reputação e história permanecem. Escolha seu primeiro projeto como treinador.",
    );
  }
  function migrateWorld(s, id, rng) {
    const fresh = create({ world: "brazil2026", mode: s.mode }, rng.state),
      next = fresh.clubs.find((c) => c.id === id);
    if (!next) throw Error("Clube de destino inválido.");
    s.clubs = fresh.clubs;
    s.leagues = fresh.leagues;
    s.world = fresh.world;
    s.calendarDays = fresh.calendarDays;
    s.fixtures = fresh.fixtures;
    s.matches = [];
    s.clubId = null;
    s.upgradeClub = null;
    movePlayerToClub(s, id);
    if (s.mode === "player") {
      const pc = Career.init(s).playerCareer;
      if (pc.contract) pc.contract.clubId = id;
      Statistics?.ensureHeroStint?.(s, id);
      Career.updatePlayerRole(s);
    }
    log(
      s,
      "Novo universo brasileiro",
      "Sua carreira e patrimônio foram preservados. A temporada agora usa as Séries A, B, C e D, Copa do Brasil e o estadual do clube. Os relatórios da antiga liga ficam resumidos no diário e no histórico.",
    );
  }
  const API = {
    Career,
    Personality,
    World,
    BrazilData,
    Competitions,
    Training,
    Identity,
    Creation,
    World2,
    log,
    Statistics,
    Squad,
    Life,
    Commercial,
    UnexpectedEvents,
    Physical,
    NationalTeam,
    schedule,
    migrateWorld,
    VERSION,
    Random,
    positionNeed,
    weightedCareerOffers,
    create,
    advance,
    simulateAdvance,
    pendingActions,
    birthdayDefaults,
    birthdayTick,
    decisionSnapshot,
    applyDecisionConsequence,
    captaincy,
    preparePlayerLineup,
    disciplineState,
    disciplineCompetition,
    isSuspendedFor,
    recordDevelopment,
    simulate,
    selected,
    overall,
    table,
    club,
    join,
    movePlayerToClub,
    decide,
    retire,
    attrs,
    labels,
    clamp,
    nextFixtureDay,
    nextCommitment,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.ProLife = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
