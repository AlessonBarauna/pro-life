/* PRO LIFE — pure domain. No DOM, network or storage. */
(function (root) {
  "use strict";
  const WorldClubCompetitions=root.ProLifeWorldClubCompetitions||(typeof require==="function"?require("./world-club-competitions.js"):null);
  const ClubIntelligence=root.ProLifeClubIntelligence||(typeof require==="function"?require("./club-intelligence.js"):null);
  const WorldStats=root.ProLifeWorldStats||(typeof require==="function"?require("./world-stats.js"):null);
  const Continental=root.ProLifeContinental||(typeof require==="function"?require("./continental.js"):null);
  const ChampionsKnockout=root.ProLifeChampionsKnockout||(typeof require==="function"?require("./champions-knockout.js"):null);
  const EuropaSeason=root.ProLifeEuropaSeason||(typeof require==="function"?require("./europa-season.js"):null);
  const EuropaKnockout=root.ProLifeEuropaKnockout||(typeof require==="function"?require("./europa-knockout.js"):null);
  const ConferenceLive=root.ProLifeConferenceLive||(typeof require==="function"?require("./conference-live.js"):null);
  const ConferenceKnockout=root.ProLifeConferenceKnockout||(typeof require==="function"?require("./conference-knockout.js"):null);
  const ChampionsSeason=root.ProLifeChampionsSeason||(typeof require==="function"?require("./champions-season.js"):null);
  const NationalCallups=root.ProLifeNationalCallups||(typeof require==="function"?require("./national-callups.js"):null);
  const OffField=root.ProLifeOffField||(typeof require==="function"?require("./off-field.js"):null);
  const ClubEconomy=root.ProLifeClubEconomy||(typeof require==="function"?require("./club-economy.js"):null);
  const CoachCareer=root.ProLifeCoachCareer||(typeof require==="function"?require("./coach-career.js"):null);
  const WorldLiveMarket=root.ProLifeWorldLiveMarket||(typeof require==="function"?require("./world-live-market.js"):null);
  const SeasonCompetitionCenter=root.ProLifeSeasonCompetitionCenter||(typeof require==="function"?require("./season-competition-center.js"):null);
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
  const PositionOverlay = root.ProLifePositionOverlay ||
    (typeof require === "function" ? require("./player-position-overlay.js") : null);
  const MatchPositions = root.ProLifeMatchPositionEffects ||
    (typeof require === "function" ? require("./match-position-effects.js") : null);
  const Physical =
    root.ProLifePhysical ||
    (typeof require === "function" ? require("./physical.js") : null);
  const SimulationTactics =
    root.ProLifeSimulationTactics ||
    (typeof require === "function" ? require("./simulation-tactics.js") : null);
  const FC27 =
    root.ProLifeFC27CatalogAdapter ||
    (typeof require === "function" ? require("./fc27-catalog-adapter.js") : null);
  const GlobalFootball =
    root.ProLifeGlobalFootball ||
    (typeof require === "function" ? require("./global-football.js") : null);
  const InternationalPool =
    root.ProLifeInternationalPool ||
    (typeof require === "function" ? require("./international-pool.js") : null);
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

  function positionNeed(c, pos, s) {
    const targets = {
      GOL: 2,
      DEF: 8,
      MEI: 8,
      ATA: 5
    };

    let roster =
      Array.isArray(c?.roster)
        ? c.roster
        : [];

    if (
      !roster.length &&
      s &&
      c?.id &&
      GlobalFootball?.playersByClub
    ) {
      roster =
        GlobalFootball.playersByClub(
          s,
          c.id
        ) || [];
    }

    const count =
      roster.filter(
        p =>
          p &&
          p.pos === pos &&
          p.id !== "hero"
      ).length;

    return Math.max(
      0,
      (targets[pos] || 5) - count
    );
  }
  function weightedCareerOffers(s, rng, count = 3, options = {}) {
    const heroLevel = overall(s.person);
    const preferences = Career.init(s).offerPreferences || { leagues: ["serieA", "serieB", "serieC", "serieD"], clubLevel: "any" };
    const allowedLeagues = new Set(preferences.leagues || []);
    const allowInternational = preferences.international !== false;
    const levelAllowed = (c) => {
      if (preferences.clubLevel === "elite") return c.structure >= 75;
      if (preferences.clubLevel === "competitive") return c.structure >= 60 && c.structure < 75;
      if (preferences.clubLevel === "intermediate") return c.structure >= 45 && c.structure < 60;
      if (preferences.clubLevel === "small") return c.structure < 45;
      return true;
    };
    const pool = careerClubPool(s)
      .filter((c) => c.id !== s.clubId)
      .filter((c) => {
        const local =
          (s.clubs || [])
            .some(
              item => item.id === c.id
            );

        if(local) return s.world !== "brazil2026" || allowedLeagues.has(c.leagueId);
        return allowInternational;
      })
      .filter(levelAllowed)
      .filter((c) => !options?.clubId || c.id === options.clubId)
      .filter((c) => !(Career.init(s).playerCareer?.marketState?.rejectionCooldowns?.[c.id] > s.day))
      .map((c) => {
        const assessment = s.mode === "player" ? Career.interestAssessment(s,c.id) : null;
        const need = s.mode === "player" ? positionNeed(c, s.person.pos, s) : 1;
        const marketStructure = Number.isFinite(Number(c.structure)) ? Number(c.structure) : Number(c.strength || c.reputation || 60); const fit = Math.max(0, 24 - Math.abs(marketStructure - (heroLevel + s.reputation / 3)));
        const marketBudget = Number.isFinite(Number(c.budget)) ? Number(c.budget) : Math.max(3000000, marketStructure * marketStructure * 12000); const budgetFit = Math.max(1, Math.min(10, marketBudget / 1000000));
        const weight = s.mode === "coach"
          ? 2 + fit / 6 + budgetFit / 3
          : Math.max(0, (assessment?.score || 0) - 34) / 8 + need * 1.5 + budgetFit / 6 + (Identity?.styleFit?.(s, c) || 0) * 0.8;
        return { c, need, weight, assessment };
      })
      .filter((x) =>
        Number.isFinite(x.weight) &&
        x.weight > 0 &&
        (s.mode !== "player" ||
         x.assessment?.eligible === true)
      );
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
    return picked.map(({ c, need, assessment }, i) => {
      const marketStructure = Number.isFinite(Number(c.structure))
        ? Number(c.structure)
        : Number(c.strength || c.reputation || 60);
      return ({
      offerId:`offer:${s.season}:${s.day}:${c.id}`,
      createdDay:s.day,
      stage:"FORMAL_OFFER",
      status:"formal",
      clubId: c.id,
      salary: s.mode === "coach" ? Math.round(
        6500 + s.reputation * 70 + c.structure * 45 + heroLevel * 10 + rng.int(0, 1800)
      ) : Math.max(2500, Math.round((Career.realisticSalary(s, c.id) * (0.94 + rng.next() * .14)) / 1000) * 1000),
      role: s.mode === "coach"
        ? (need >= 2 ? "Projeto com necessidade imediata" : "Projeto de reconstrução")
        : (need >= 2 ? "Necessidade imediata na sua posição" : need === 1 ? "Disputa aberta por posição" : "Concorrência forte por posição"),
      squadRole: s.mode === "player" ? (need >= 2 ? "Titular" : marketStructure < heroLevel ? "Importante" : "Rotação") : "Treinador",
      durationDays: (s.mode === "player" ? (s.person.age <= 22 && need >= 2 && marketStructure + 10 < heroLevel ? 365 : rng.pick([365, 730, 1095, 1460])) : 730),
      signingBonus: s.mode === "player" ? Math.round((1200 + s.reputation * 140 + heroLevel * 90 + marketStructure * 60) / 100) * 100 : 0,
      transferType: s.mode === "player" && s.person.age <= 22 && need >= 2 && marketStructure + 10 < heroLevel ? "loan" : "permanent",
      expires: s.day + 14 + rng.int(0, 8),
      interestScore: assessment?.score,
      interestLabel: assessment?.label,
      responseDeadline: s.day + 14 + rng.int(0, 8),
      round: 0,
    });
    });
  }

  // 05A.8: posicoes especificas vinculadas por id estavel (somente dados verificados; sem inventar).
  const SPEC_GROUP = { GOL:"GOL", LD:"DEF", LE:"DEF", ZAG:"DEF", ALD:"DEF", ALE:"DEF", VOL:"MEI", MC:"MEI", MD:"MEI", ME:"MEI", MEI:"MEI", PD:"ATA", PE:"ATA", SA:"ATA", CA:"ATA" };
  function localPositions(r) {
    const row = root.ProLifeFC27Positions?.local?.[r.id] ||
      (typeof require === "function" && !root.ProLifeFC27Positions ? (() => { try { return require("../data/fc27/fc27-positions-v1.js").local?.[r.id]; } catch (e) { return null; } })() : null);
    if (typeof row !== "string" || !row) return {};
    const list = row.split(",").filter((c) => SPEC_GROUP[c]);
    if (!list.length) return {};
    const main = SPEC_GROUP[list[0]] === r.pos ? list[0] : null;
    return { primaryPosition: main, secondaryPositions: (main ? list.slice(1) : list).slice(0, 6) };
  }
  function create(config, seed = Date.now()) {
    const rng = new Random(seed),
      mode = config.mode === "coach" ? "coach" : "player";
    const real = config.world !== "legacy";
    const definitions = real ? World.clubs.concat(BrazilData?.clubs || []) : teams;
    const clubs = definitions.map((t, i) => {
      let roster = real
        ? t.players.map((r) => ({
            ...player(
          rng,
          r.id,
          Number.isFinite(Number(r.ovr ?? r.overall))
            ? Number(r.ovr ?? r.overall)
            : t.level,
          r.pos
        ),
        ...(r.attrs && Number.isFinite(Number(r.ovr ?? r.overall))
          ? {
              attrs: { ...r.attrs },
              ovr: Number(r.ovr ?? r.overall),
              overall: Number(r.ovr ?? r.overall),
            }
          : {}),
            name: r.name,
            age: r.age,
            number: r.number,
            nationality: r.nationality,
            real: true,
            ...localPositions(r),
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
      nationality: mode === "coach" ? (GlobalFootball?.resolveNationality?.(config.nationality,null) || String(config.nationality||"Brasil").trim().slice(0,60) || "Brasil") : (GlobalFootball?.resolveNationality?.(config.nationality,"Brasil") || "Brasil"),
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
      initialSeed: seed,
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
    // 34F.12: catálogo FC 27 experimental (opt-in). Instalado ANTES de qualquer GlobalFootball.init; ausente = legado.
    if (config.catalogVersion !== undefined && config.catalogVersion !== null && config.catalogVersion !== "legacy") {
      if (config.catalogVersion !== "fc27_v1" || !FC27) throw Error("catalogVersion desconhecido: " + config.catalogVersion);
      FC27.installState(s);
    }
    Career.init(s);
    Career.updateProfessionalCareer(s);
    Training?.init(s);
    Identity?.init(s);
    Statistics?.init(s);
    Competitions?.init(s);
    WorldClubCompetitions?.init(s);
    Life?.init(s);
    Commercial?.init(s, { overall, club });
    UnexpectedEvents?.init(s);
    GlobalFootball?.init(s);
    InternationalPool?.init(s);
    GlobalFootball?.init(s);
    WorldLiveMarket?.init?.(s);
    NationalTeam?.init(s);
    World2?.init(s, API, seed);
    // M04.4: opt-in only at new coach career creation; existing saves untouched.
    if(mode==="coach"&&config.financialScenario!=null&&config.financialScenario!=="legacy"){
      const allowed=["conservative","standard","ambitious"];
      if(!allowed.includes(config.financialScenario))throw Error("Cenario financeiro desconhecido.");
      if(!ClubEconomy?.scenarios)throw Error("Modulo de economia de clubes indisponivel.");
      const target=(s.clubs||[]).find(c=>c.id===config.clubId)||
        (s.globalFootball?.clubs||[]).find(c=>c.id===config.clubId);
      if(!target)throw Error("Selecione um clube para configurar o orcamento inicial.");
      const option=ClubEconomy.scenarios(target).find(o=>o.id===config.financialScenario);
      target.budget=option.proposedTransferBudget;
      s.coachInitialFinance={version:1,clubId:target.id,scenario:option.id,
        initialTransferBudget:option.proposedTransferBudget};
    }
    if (plan) Creation.applyContext(s, plan);
    s.offers = plan ? Creation.opportunities(s, rng, API, plan) : weightedCareerOffers(s, rng, mode === "player" ? Math.min(5, 3 + (origin.offerBoost || 0)) : 3);
    if (plan && config.clubId) Creation.accept(s, config.clubId, API);
    else if (config.clubId && (clubs.some((c) => c.id === config.clubId) || (mode === "coach" && (s.globalFootball?.clubs || []).some(c => c.id === config.clubId && c.generated !== true && c.active !== false)))) {
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
    // UCL_CREATE_DAY_ZERO_V35
    if (s.catalogVersion === "fc27_v1" &&
        Continental && ChampionsSeason && WorldClubCompetitions) {
      Continental.init(s);
      const ucl = Continental.edition(s, "ucl");
      if (ucl?.status === "ready" && !ucl.leagueSchedule) {
        ChampionsSeason.prepare(s, Continental, WorldClubCompetitions);
      }
    }
    // UEL_CREATE_DAY_ZERO_V1 - Independent Europa League edition.
    if (s.catalogVersion === "fc27_v1" && Continental && EuropaSeason && WorldClubCompetitions) {
      Continental.init(s);
      const uel = Continental.edition(s, "uel");
      if (uel?.status === "ready" && !uel.leagueSchedule) EuropaSeason.prepare(s, Continental, WorldClubCompetitions);
    }
    if (s.catalogVersion === "fc27_v1" && ConferenceLive && Continental) {
      const ed=Continental.edition(s,"uecl");
      if(ed?.status==="ready") { try{ConferenceLive.prepare(s,ed);}catch(e){ed.conferenceError=String(e?.message||e);} }
    }
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
    return s.clubs.find((c) => c.id === id) ||
      worldMatchClub(s, id) ||
      GlobalFootball?.clubById?.(s, id) ||
      null;
  }
  // Stage 31.4.2: clubes de ligas internacionais ganham elenco jogável (mesmo formato dos clubes locais)
  // para usar o pipeline completo de partida. Só o clube do protagonista é persistido; adversários
  // são reconstruídos de forma determinística apenas durante a partida.
  let worldMatchScope = null;
  const wmHash = (v) => { let h = 2166136261; for (const ch of String(v)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function worldPlayer(s, gp, gc, number) {
    const ovr = clamp(Math.round(Number(gp.ovr) || 55), 30, 99), h = wmHash(gp.id), j = (k) => ((h >> k) % 5) - 2;
    const off = { GOL: [-8, -20, -6, 4, 2, -2], DEF: [-2, -10, 0, 4, 3, 0], MEI: [0, -3, 4, -4, -3, 2], ATA: [3, 4, 0, -12, 0, -1] }[gp.pos] || [0, 0, 0, 0, 0, 0];
    const a = {}; attrs.forEach((k, i) => (a[k] = clamp(ovr + off[i] + j(i * 3), 20, 99)));
    const p = { id: gp.id, name: gp.name, shortName: gp.shortName || gp.name, age: s.season - (gp.birthYear || s.season - 26), pos: gp.pos, attrs: a, condition: 100, morale: 60 + (h % 21), discipline: 40 + (h % 51), potential: gp.potential || ovr, injury: 0, goals: 0, minutes: 0, ovr, overall: ovr, number, nationality: gp.nationality, birthYear: gp.birthYear, primaryPosition: (PositionOverlay?.normalized(gp,gc.name).primaryPosition || null), secondaryPositions: (PositionOverlay?.normalized(gp,gc.name).secondaryPositions || []), status: "active", active: true, reputation: clamp(ovr - 15, 10, 95), clubId: gc.id, leagueId: gc.leagueId, contract: { end: s.season + 1 + (h % 3), salary: Math.round(ovr * ovr * 6) } };
    const diff = ovr - overall(p);
    if (diff) attrs.forEach((k) => (a[k] = clamp(a[k] + diff, 20, 99)));
    return p;
  }
  function buildWorldClub(s, gc) {
    const real = (GlobalFootball?.playersByClub?.(s, gc.id) || []).filter((p) => p.id !== "hero" && p.status !== "retired" && p.active !== false && ["GOL", "DEF", "MEI", "ATA"].includes(p.pos));
    const need = { GOL: 3, DEF: 7, MEI: 7, ATA: 5 }, roster = [];
    real.sort((x, y) => (y.ovr || 0) - (x.ovr || 0) || String(x.id).localeCompare(String(y.id)));
    real.forEach((gp, i) => roster.push(worldPlayer(s, gp, gc, i + 1)));
    for (const pos of Object.keys(need)) {
      let have = roster.filter((p) => p.pos === pos).length;
      while (have < need[pos]) {
        const n = roster.length + 1;
        roster.push(worldPlayer(s, { id: `${gc.id}_wm_${pos}_${have}`, name: `Reserva ${gc.shortName || gc.name} ${n}`, pos, ovr: Math.max(35, Math.round((gc.strength || 60) - 8)), potential: 60, birthYear: s.season - 22, nationality: gc.country }, gc, n));
        have++;
      }
    }
    const lineup = [];
    for (const [pos, n] of [["GOL", 1], ["DEF", 4], ["MEI", 3], ["ATA", 3]]) roster.filter((p) => p.pos === pos).sort((x, y) => y.ovr - x.ovr).slice(0, n).forEach((p) => lineup.push(p.id));
    return { id: gc.id, name: gc.name, shortName: gc.shortName || gc.name, city: gc.city || "", color: gc.color || "#456", country: gc.country, leagueId: gc.leagueId, division: gc.division || 1, reputation: gc.reputation, strength: gc.strength, budget: gc.budget || 0, active: true, structure: gc.strength || 60, coverage: "complete", tactic: "balanced", formation: "4-3-3", roster, lineup, stats: { points: 0, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }, worldMatch: true, joinedDay: s.day };
  }
  function linkWorldHero(s, c) {
    if (s.mode !== "player" || c.id !== s.clubId || !s.person) return c;
    const i = c.roster.findIndex((p) => p.id === "hero");
    if (i < 0) c.roster.push(s.person); else if (c.roster[i] !== s.person) c.roster[i] = s.person;
    if (!c.lineup.includes("hero") && c.lineup.length < 11) c.lineup.push("hero");
    return c;
  }
  function worldMatchClub(s, id) {
    if (!id) return null;
    const own = s.mode === "player" && id === s.clubId;
    const cached = worldMatchScope && worldMatchScope.s === s ? worldMatchScope.cache[id] : null;
    if (cached) return cached;
    if (own) { const saved = s.worldMatchClubs?.[id]; if (saved) return linkWorldHero(s, saved); }
    else if (!(worldMatchScope && worldMatchScope.s === s && worldMatchScope.ids.includes(id))) return null;
    const gc = GlobalFootball?.clubById?.(s, id);
    if (!gc || !gc.leagueId || (s.clubs || []).some((c) => c.id === id)) return null;
    const built = buildWorldClub(s, gc);
    if (own) { (s.worldMatchClubs ||= {})[id] = built; return linkWorldHero(s, built); }
    worldMatchScope.cache[id] = built;
    return built;
  }
  function dropWorldMatchClubs(s, keepId) {
    if (!s.worldMatchClubs) return;
    for (const id of Object.keys(s.worldMatchClubs)) if (id !== keepId) delete s.worldMatchClubs[id];
  }
  function worldHeroFixture(s, rng, leagueId, roundIndex, pairIndex, home, away, date) {
    if (s.mode !== "player" || !s.clubId || ![home, away].includes(s.clubId)) return null;
    const hero = worldMatchClub(s, s.clubId);
    if (!hero || date < (hero.joinedDay ?? s.day)) return null;
    worldMatchScope = { s, ids: [home, away], cache: {} };
    try {
      const league = GlobalFootball?.leagueById?.(s, leagueId);
      const m = registerMatch(s, rng, home, away, { round: roundIndex + 1, competitionId: leagueId, competitionName: league?.name || leagueId }, true);
      m.worldMatch = true;
      return [m.hg, m.ag];
    } finally { worldMatchScope = null; }
  }
  function careerClubPool(s) {
    GlobalFootball?.init?.(s);

    const local = s.clubs || [];

    const global =
      (s.globalFootball?.clubs || [])
        .filter(
          c =>
            c &&
            c.generated !== true &&
            c.active !== false
        );

    const seen = new Set();
    const out = [];

    for (const c of local) {

      if (!c?.id || seen.has(c.id))
        continue;

      seen.add(c.id);
      out.push(c);
    }

    for (const c of global) {

      if (!c?.id || seen.has(c.id))
        continue;

      seen.add(c.id);

      const strength =
        Number.isFinite(Number(c.strength))
          ? Number(c.strength)
          : Number.isFinite(Number(c.reputation))
            ? Number(c.reputation)
            : 60;

      const structure =
        Number.isFinite(Number(c.structure))
          ? Number(c.structure)
          : Math.max(
              35,
              Math.min(
                95,
                Math.round(strength)
              )
            );

      const budget =
        Number.isFinite(Number(c.budget))
          ? Number(c.budget)
          : Math.max(
              3000000,
              Math.round(
                structure *
                structure *
                12000
              )
            );

      const roster =
        GlobalFootball?.playersByClub
          ? GlobalFootball.playersByClub(
              s,
              c.id
            )
          : [];

      /*
        Clone de mercado.
        Nao altera/pesa o save global.
      */
      out.push({
        ...c,
        structure,
        budget,
        roster
      });
    }

    return out;
  }
  function worldMarketClubStrength(c) {
    for (const value of [c?.structure, c?.strength, c?.reputation]) {
      if (Number.isFinite(Number(value))) return clamp(Number(value), 20, 100);
    }
    return 60;
  }
  function worldMarketPlayerLevel(p) {
    const value = Number(p?.ovr ?? p?.overall);
    return Number.isFinite(value) ? clamp(value, 20, 100) : overall(p);
  }
  function worldMarketTerms(player, destination) {
    const level = worldMarketPlayerLevel(player);
    const potential = clamp(Number(player.potential ?? level), level, 100);
    const age = clamp(Number(player.age || 25), 15, 45);
    const growth = 1 + Math.max(0, potential - level) / 35;
    const ageFactor = age <= 23 ? 1.25 : age >= 32 ? 0.68 : 1;
    const clubFactor = 0.8 + worldMarketClubStrength(destination) / 250;
    const value = Math.round(
      Math.max(100000, Math.pow(Math.max(8, level - 38), 2) * 10500 * growth * ageFactor * clubFactor) / 10000,
    ) * 10000;
    const salary = Math.round(Math.max(2500, value / 520) / 100) * 100;
    return { value, salary };
  }
  // 34F.19: o mercado da IA respeita o minimo de jogadores por posicao, o tamanho maximo do elenco e o orcamento do comprador,
  // e nunca mexe no clube do usuario no modo treinador. Volume maior dentro da janela de transferencias.
  const MARKET_MIN = { GOL: 2, DEF: 5, MEI: 5, ATA: 3 };
  const MARKET_TARGET = { GOL: 3, DEF: 8, MEI: 8, ATA: 5 };
  const MARKET_MAX_SQUAD = 36;
  const MARKET_ACTIVE_STATES = new Set(["rumor", "scouting", "negotiating", "offer"]);
  function marketProtectedClub(s) {
    return s.mode === "coach" && s.clubId ? s.clubId : null;
  }
  function marketCounts(s, adjustForPending = true) {
    const counts = new Map(), squad = new Map();
    for (const player of GlobalFootball?.activePlayers?.(s) || []) {
      if (player.academy || !player.clubId) continue; // base e livres nao contam para o elenco principal
      const key = `${player.clubId}|${player.pos}`;
      counts.set(key, (counts.get(key) || 0) + 1);
      squad.set(player.clubId, (squad.get(player.clubId) || 0) + 1);
    }
    if (adjustForPending) {
      // Negociacoes em andamento (e fechadas ainda nao executadas) ja contam como saida/entrada.
      for (const deal of WorldLiveMarket?.getDeals?.(s) || []) {
        const pending = MARKET_ACTIVE_STATES.has(deal.state) || (deal.state === "completed" && deal.executionStatus === undefined);
        if (!pending) continue;
        const player = GlobalFootball?.playerById?.(s, deal.playerId);
        if (!player) continue;
        counts.set(`${deal.fromClubId}|${player.pos}`, (counts.get(`${deal.fromClubId}|${player.pos}`) || 0) - 1);
        counts.set(`${deal.toClubId}|${player.pos}`, (counts.get(`${deal.toClubId}|${player.pos}`) || 0) + 1);
        squad.set(deal.fromClubId, (squad.get(deal.fromClubId) || 0) - 1);
        squad.set(deal.toClubId, (squad.get(deal.toClubId) || 0) + 1);
      }
    }
    return { counts, squad };
  }
  // Usado por executeCompleted: devolve o motivo do cancelamento ou null.
  function worldMarketCanExecute(s, deal) {
    const player = GlobalFootball?.playerById?.(s, deal.playerId);
    if (!player) return "player-unavailable";
    const { counts, squad } = marketCounts(s, false);
    const min = MARKET_MIN[player.pos];
    if (min !== undefined && (counts.get(`${deal.fromClubId}|${player.pos}`) || 0) <= min) return "squad-minimum";
    if ((squad.get(deal.toClubId) || 0) >= MARKET_MAX_SQUAD) return "squad-full";
    return null;
  }
  function applyMarketBudgets(s, executedIds) {
    for (const id of executedIds || []) {
      const deal = WorldLiveMarket.getDeal(s, id);
      if (!deal || deal.budgetApplied) continue;
      // grava no objeto real do estado (clubById pode devolver copia)
      const real = (cid) => (s.globalFootball?.clubs || []).find((c) => c.id === cid) || (s.clubs || []).find((c) => c.id === cid) || null;
      const b = real(deal.toClubId), l = real(deal.fromClubId);
      if (b && Number.isFinite(Number(b.budget))) b.budget = Math.max(0, Math.round(Number(b.budget) - deal.value));
      if (l && Number.isFinite(Number(l.budget))) l.budget = Math.max(0, Math.round(Number(l.budget) + deal.value));
      deal.budgetApplied = true;
    }
  }
  function generateWorldMarket(s, rng) {
    const market = WorldLiveMarket?.init?.(s);
    if (!market || s.day % 14 !== 0 || market.lastGenerationDay === s.day)
      return [];
    market.lastGenerationDay = s.day;
    GlobalFootball?.init?.(s);
    const busy = new Set(
      WorldLiveMarket.getDeals(s)
        .filter((deal) => MARKET_ACTIVE_STATES.has(deal.state))
        .map((deal) => deal.playerId),
    );
    const protectedClub = marketProtectedClub(s);
    const { counts, squad } = marketCounts(s);
    const players = (GlobalFootball?.activePlayers?.(s) || []).filter(
      (player) =>
        player?.id &&
        player.id !== "hero" &&
        player.clubId &&
        !player.academy &&
        player.clubId !== protectedClub &&
        !busy.has(player.id) &&
        MARKET_MIN[player.pos] !== undefined &&
        GlobalFootball.clubById(s, player.clubId)?.active !== false,
    );
    const seen = new Set();
    const clubs = [...(s.clubs || []), ...(s.globalFootball?.clubs || [])].filter(
      (club) => {
        if (!club?.id || seen.has(club.id) || club.active === false || club.generated === true || club.id === protectedClub)
          return false;
        seen.add(club.id);
        return true;
      },
    );
    const wanted = Career.windowStatus(s).open ? 10 : 2;
    const created = [];
    for (let slot = 0; slot < wanted && players.length; slot++) {
      // Vendedor: so clubes que podem ceder; prefere quem tem sobra na posicao e jogadores veteranos.
      const sellers = [];
      let sellerTotal = 0;
      for (let i = 0; i < players.length; i++) {
        const p = players[i];
        const have = counts.get(`${p.clubId}|${p.pos}`) || 0;
        if (have <= MARKET_MIN[p.pos]) continue;
        const weight = 1 + Math.max(0, have - MARKET_TARGET[p.pos]) * 2 + (Number(p.age || 25) >= 31 ? 1.5 : 0);
        sellers.push([i, weight]); sellerTotal += weight;
      }
      if (!sellerTotal) break;
      let pick = rng.next() * sellerTotal, chosen = sellers.at(-1);
      for (const entry of sellers) { pick -= entry[1]; if (pick <= 0) { chosen = entry; break; } }
      const player = players.splice(chosen[0], 1)[0];
      const level = worldMarketPlayerLevel(player);
      const potential = Number(player.potential ?? level);
      const age = Number(player.age || 25);
      const projected = level + (age <= 23 ? clamp((potential - level) * 0.2, 0, 6) : 0);
      const weighted = clubs
        .filter((candidate) => candidate.id !== player.clubId && (squad.get(candidate.id) || 0) < MARKET_MAX_SQUAD)
        .map((candidate) => {
          const terms = worldMarketTerms(player, candidate);
          const budget = Number(candidate.budget);
          if (Number.isFinite(budget) && terms.value > budget * 0.6) return { candidate, terms, weight: 0 };
          const strength = worldMarketClubStrength(candidate);
          const gap = Math.abs(strength - projected);
          const need = Math.max(0, MARKET_TARGET[player.pos] - (counts.get(`${candidate.id}|${player.pos}`) || 0));
          const ageFit = age <= 22 && potential > level ? 4 : age >= 33 ? -2 : 0;
          return { candidate, terms, weight: Math.max(0, 26 - gap * 1.15 + need * 2.8 + ageFit) };
        })
        .filter((entry) => entry.weight > 0);
      const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
      if (!total) continue;
      let roll = rng.next() * total;
      let selected = weighted.at(-1);
      for (const entry of weighted) {
        roll -= entry.weight;
        if (roll <= 0) { selected = entry; break; }
      }
      try {
        const terms = selected.terms;
        created.push(WorldLiveMarket.createDeal(s, {
          playerId: player.id,
          fromClubId: player.clubId,
          toClubId: selected.candidate.id,
          value: terms.value,
          salary: terms.salary,
          state: "rumor",
          startDay: s.day,
        }));
        counts.set(`${player.clubId}|${player.pos}`, (counts.get(`${player.clubId}|${player.pos}`) || 0) - 1);
        counts.set(`${selected.candidate.id}|${player.pos}`, (counts.get(`${selected.candidate.id}|${player.pos}`) || 0) + 1);
        squad.set(player.clubId, (squad.get(player.clubId) || 0) - 1);
        squad.set(selected.candidate.id, (squad.get(selected.candidate.id) || 0) + 1);
      } catch (_) {}
    }
    return created;
  }
  function log(s, title, body) {
    s.news.unshift({ day: s.day, season: s.season, title, body });
    s.news = s.news.slice(0, 160);
    Career.post(s, "Carreira", "Diário da carreira", title, body);
  }
  function movePlayerToClub(s, id) {
    const next = club(s, id);

    if (!next)
      throw Error("Clube inv?lido.");

    if (s.mode === "player") {

      /*
        Hero sai de qualquer elenco local.
        Clubes globais usam identidade por clubId,
        portanto nao exigem roster embutido no clube.
      */
      for (const c of s.clubs || []) {
        c.roster = (c.roster || [])
          .filter((p) => p.id !== "hero");

        c.lineup = (c.lineup || [])
          .filter((pid) => pid !== "hero");
      }

      /*
        Atualiza a identidade mundial compartilhada.
        Isso funciona tanto para clube global quanto local.
      */
      if (GlobalFootball?.transferPlayer) {
        GlobalFootball.transferPlayer(
          s,
          "hero",
          id
        );
      } else {
        s.person.clubId = id;
        s.person.leagueId = next.leagueId;
      }

      /*
        Somente clubes do universo brasileiro possuem
        roster/lineup embutidos em s.clubs.
      */
      const local =
        (s.clubs || [])
          .find(c => c.id === id);

      if (local) {

        local.roster ||= [];
        local.lineup ||= [];

        if (
          !local.roster.some(
            p => p.id === "hero"
          )
        ) {
          local.roster.push(
            s.person
          );
        }
      }
    }

    s.clubId = id;
    dropWorldMatchClubs(s, id);
    if (s.mode === "player") worldMatchClub(s, id);

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
    // 33B: acordo assinado válido para este clube é a fonte de verdade dos termos (não depende de a oferta original continuar em s.offers).
    const agreedTerms = s.mode === "player" && pc0?.marketState?.signedAgreement?.clubId === id ? { ...pc0.marketState.signedAgreement } : null;
    const acceptedOffer = agreedTerms || s.offers.find((o) => o.clubId === id && o.expires >= s.day) || { clubId:id, salary, durationDays:730, signingBonus:0, squadRole:"Rotação", transferType:"permanent" };
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
    // 33B: primeiro contrato (sem clube anterior) também deixa rastro de chegada efetiva, usado só pela apresentação oficial.
    if (s.mode === "player" && !previous) Career.init(s).playerCareer.firstClubArrival = { clubId: next.id, day: s.day, promisedRole: acceptedOffer.squadRole || acceptedOffer.role || "Rotação" };
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
  // 04D: Forma recente e somente um efeito de rendimento, nao um atributo persistido.
  // Dados ausentes ou chamada D.simulate() sem contexto preservam o modelo anterior.
  function recentMatchFormFactors(context){
    if(!context || !Array.isArray(context.matches)) return null;
    const lists = new Map();
    for(const match of context.matches){
      for(const [id, raw] of Object.entries(match?.ratings || {})){
        const rating = Number(raw);
        if(!Number.isFinite(rating)) continue;
        let values = lists.get(id);
        if(!values){ values = []; lists.set(id,values); }
        if(values.length < 5) values.push(rating);
      }
    }
    const result = new Map();
    for(const [id, values] of lists){
      const avg = values.reduce((a,b)=>a+b,0)/values.length;
      result.set(id, clamp(1 + (avg-6.5)*0.012, 0.958, 1.042));
    }
    return result;
  }
  function quality(ps, key, formFactors = null, roles = null) {
    if (!ps.length) return 25;
    return (
      ps.reduce(
        (n, p) =>
          n +
          p.attrs[key] *
            (MatchPositions?.factor(p, roles) ?? 1) *
            (formFactors?.get(p.id) ?? 1) *
            (0.55 + (0.45 * p.condition) / 100) *
            (0.85 + (0.15 * p.morale) / 100),
        0,
      ) / ps.length
    );
  }
  function simulate(home, away, rng, context = null, coachActions = []) {
    const runner=simulateSteps(home,away,rng,context,coachActions);
    let step=runner.next();
    while(!step.done)step=runner.next();
    return step.value;
  }
  // Resumable official simulation core: each next() completes exactly one minute.
  // The caller must NOT commit the result until this generator finishes.
  function* simulateSteps(home, away, rng, context = null, coachActions = []) {
    const hp = selected(home),
      ap = selected(away);
    const formFactors = recentMatchFormFactors(context);
    const positionRoles = [MatchPositions?.create(home,hp)??null,MatchPositions?.create(away,ap)??null];
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
    // Coach-only collective controls. Neutral values preserve existing match balance.
    for(let side=0;side<2;side++){
      const t=clubs[side]?.coachTactics;
      if(!t)continue;
      const safe=(value)=>Math.max(20,Math.min(80,Number(value)||50));
      const width=(safe(t.width)-50)/30,depth=(safe(t.depth)-50)/30;
      tactical[side].possession+=(t.buildup==="short"?2:t.buildup==="direct"?-1:0)+width;
      tactical[side].attack+=(t.buildup==="direct"?2:t.buildup==="short"?-1:0)+depth;
      tactical[side].defense+=(t.pressing==="low"?2:t.pressing==="high"?-1:0)-depth;
      tactical[side].fatigue+=t.pressing==="high"?0.025:t.pressing==="low"?-0.01:0;
    }
    // E10: small bonuses for selected starters with an individual role.
    // Absent role data leaves the established simulator unchanged.
    for(let side=0;side<2;side++){
      const roles=clubs[side]?.coachPlayerRoles;
      if(!roles)continue;
      const active=squads[side].map(p=>roles[p.id]?.role).filter(Boolean);
      const offensive=active.filter(role=>["poacher","false_nine","inside_forward","playmaker","advanced","shadow","winger","wide_playmaker","target"].includes(role)).length;
      const defensive=active.filter(role=>["defender","stopper","holding","fullback","sweeper"].includes(role)).length;
      tactical[side].attack+=Math.min(2,offensive*0.3);
      tactical[side].defense+=Math.min(2,defensive*0.3);
    }
    // Pre-authorized coach actions are applied at their exact minute, before
    // that minute's chance calculation. Default [] preserves legacy matches.
    const plannedActions=Array.isArray(coachActions)?coachActions:[];
    const coachSubs=[0,0],usedIncoming=[new Set(),new Set()];
    for (let minute = 1; minute <= 94; minute++) {
      if(context?.mode==="coach"||!context){
        for(const action of plannedActions){
          if(action?.type!=="substitution"||Number(action.minute)!==minute)continue;
          const side=Number(action.side),club=clubs[side],ps=squads[side];
          if(![0,1].includes(side)||!club||!ps||coachSubs[side]>=5)continue;
          const outgoing=ps.find(p=>String(p.id)===String(action.outId));
          const incoming=club.roster.find(p=>String(p.id)===String(action.inId));
          if(!outgoing||!incoming||outgoing.id===incoming.id||ps.includes(incoming)||usedIncoming[side].has(incoming.id)||
             incoming.injury||incoming.suspension>0||incoming._competitionSuspended||incoming.condition<=35)continue;
          const index=ps.indexOf(outgoing);
          ps[index]=incoming;coachSubs[side]++;usedIncoming[side].add(incoming.id);
          if(m.participation[outgoing.id]){
            m.participation[outgoing.id].exitMinute=minute;
            m.participation[outgoing.id].minutes=minute-m.participation[outgoing.id].entryMinute;
          }
          m.participation[incoming.id]={side,starter:false,entryMinute:minute,exitMinute:94,minutes:94-minute};
          m.participants[side].push(incoming.id);
          m.events.push({minute,type:"substitution",side,player:incoming.name,playerId:incoming.id,outPlayer:outgoing.name,outPlayerId:outgoing.id,text:`Substituição: sai ${outgoing.name}, entra ${incoming.name}.`});
        }
      }
      const control = squads.map(
        (ps, i) =>
          quality(ps, "pass", formFactors, positionRoles[i]) +
          quality(ps, "stamina", formFactors, positionRoles[i]) * 0.2 +
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
        quality(ps, "pace", formFactors, positionRoles[i]) * 0.4 +
        quality(ps, "pass", formFactors, positionRoles[i]) * 0.6 +
        (clubs[i].tactic === "attack"
          ? 7
          : clubs[i].tactic === "counter"
            ? 2
            : 0) +
        tactical[i].attack;
      const defense =
        quality(opp, "defense", formFactors, positionRoles[j]) * 0.65 +
        quality(opp, "strength", formFactors, positionRoles[j]) * 0.35 +
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
          return Math.max(1, role * relativeQuality * protagonism * (MatchPositions?.factor(p, positionRoles[i]) ?? 1) * (g.finish * 0.5 + g.pace * 0.16 + (p.attrs.positioning ?? (((p.attrs.pass ?? g.pass) + (p.attrs.finish ?? g.finish)) / 2)) * 0.34));
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
          finish = shooterGroups.finish * (MatchPositions?.factor(shooter, positionRoles[i]) ?? 1) * (0.7 + (0.3 * shooter.condition) / 100),
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
          const on=heroSquad.some(p=>p.id==="hero"), ownGoals=heroSide===0?m.hg:m.ag, opponentGoals=heroSide===0?m.ag:m.hg, subPlan=Squad?.substitutePlan?.(context,hero,{ownGoals,opponentGoals})||{minute:65,chance:clamp(.35+(pc.coachTrust-50)/120+(hero.morale-50)/180,.15,.9)};
          if(!on && minute===subPlan.minute){
            const eligible=pc.matchSelection?.bench?.includes("hero");
            if(eligible&&rng.next()<subPlan.chance){
              let idx=MatchPositions?.bestExit(heroSquad,hero,positionRoles[heroSide])??-1;
              if(idx<0)idx=heroSquad.findIndex(p=>p.pos===hero.pos); if(idx<0)idx=heroSquad.length-1;
              const out=heroSquad[idx]; heroSquad[idx]=hero;
              if(positionRoles[heroSide]?.has(out.id)){const role=positionRoles[heroSide].get(out.id);positionRoles[heroSide].delete(out.id);positionRoles[heroSide].set(hero.id,role);}
              if(m.participation[out.id]){m.participation[out.id].exitMinute=minute;m.participation[out.id].minutes=minute-m.participation[out.id].entryMinute;}
              m.participation.hero={side:heroSide,starter:false,entryMinute:minute,exitMinute:94,minutes:94-minute};m.participants[heroSide].push("hero");
              m.events.push({minute,type:"substitution",side:heroSide,player:hero.name,playerId:"hero",outPlayer:out.name,outPlayerId:out.id,text:`Substituição: sai ${out.name}, entra ${hero.name}.`});
            }
          } else if(on && minute===65 && hero.condition<58 && rng.next()<.7){
            const replacements=ownClub.roster.filter(x=>!heroSquad.includes(x)&&!x.injury&&!(x.suspension>0)&&!x._competitionSuspended&&x.pos===hero.pos);
            const heroRole=positionRoles[heroSide]?.get(hero.id);
            const sub=MatchPositions?.bestReplacement(replacements,heroRole,overall)||replacements.sort((a,b)=>overall(b)-overall(a))[0];
            if(sub){const idx=heroSquad.findIndex(p=>p.id==="hero");heroSquad[idx]=sub;if(heroRole){positionRoles[heroSide].delete(hero.id);positionRoles[heroSide].set(sub.id,heroRole);}m.participation.hero.exitMinute=minute;m.participation.hero.minutes=minute;m.participation[sub.id]={side:heroSide,starter:false,entryMinute:minute,exitMinute:94,minutes:94-minute};m.participants[heroSide].push(sub.id);m.events.push({minute,type:"substitution",side:heroSide,player:sub.name,playerId:sub.id,outPlayer:hero.name,outPlayerId:"hero",text:`Substituição: sai ${hero.name}, entra ${sub.name}.`});}
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
      yield {minute,match:m};
    }
    // A caller may inspect the score/events after each completed minute.
    // No standings or match statistics have been committed yet.
    for (const [id,part] of Object.entries(m.participation)) {
      const p=clubs[part.side].roster.find(x=>x.id===id); if(!p)continue;
      const minutes=Math.max(0,Math.min(94,Number(part.exitMinute??94)-Number(part.entryMinute??0)));part.minutes=minutes;
      Physical?.init?.(p); // materializa o estado físico (padrão) antes de a condição mudar
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
  // Consultas disciplinares são somente-leitura: sem registro, devolvem um objeto zerado descartável
  // (nada é gravado no jogador). Registros persistentes só nascem em ensureDisciplineCompetition (escrita).
  const emptyDisciplineCompetition = () => ({ yellows:0, suspensions:0, yellowTotal:0, redTotal:0 });
  function disciplineState(p) {
    const st=p?.disciplineState;
    return st && typeof st==="object" && st.competitions && typeof st.competitions==="object" ? st : { competitions:{} };
  }
  function disciplineCompetition(p,key) {
    return disciplineState(p).competitions[key] || emptyDisciplineCompetition();
  }
  function ensureDisciplineCompetition(p,key) {
    p.disciplineState ||= { competitions:{} };
    p.disciplineState.competitions ||= {};
    return p.disciplineState.competitions[key] ||= emptyDisciplineCompetition();
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
      const d=ensureDisciplineCompetition(p,key);
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
    for(const p of (team?.roster||[])){ if(isSuspendedFor(p,key)) p._competitionSuspended=true; else delete p._competitionSuspended; }
    return key;
  }
  function serveDisciplineSuspensions(team,key) {
    for(const p of (team?.roster||[])){
      if(p._competitionSuspended){
        const d=ensureDisciplineCompetition(p,key); d.suspensions=Math.max(0,d.suspensions-1);
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
      const years=p.id==="hero" ? heroYears : Math.max(0,Number(p.clubYears ?? p.yearsAtClub ?? 0));
      const experience=Math.min(12,Math.max(0,age-20));
      const positionLeadership=["GOL","DEF","MEI"].includes(p.pos)?4:1;
      const regularity=Math.max(0,Math.min(8,(form-6)*4));
      const heroRole=p.id==="hero" ? ({Estrela:8,Importante:6,Titular:4,Rotação:2,Reserva:0,"Fora dos planos":-5}[pc?.squadRole]||0) : 3;
      // Longevidade e experiência pesam mais; GER/status e forma apenas complementam.
      return +(Math.min(years,8)*1.6 + experience*.7 + ovr*.85 + positionLeadership + regularity + heroRole).toFixed(2);
    };
    const ranking=(team.roster||[]).filter(p=>!p.injury).map(p=>({player:p,score:score(p)})).sort((x,y)=>y.score-x.score || overall(y.player)-overall(x.player));
    const chosen=CoachCareer?.captainOverride(s,team)||null;
    if(chosen){const at=ranking.findIndex(x=>x.player===chosen);if(at>0)ranking.unshift(ranking.splice(at,1)[0]);}
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
      Squad.registerStarters?.(c,selection.starters);
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
  // Unsaved official-simulator controller. Caller may submit decisions between minutes.
  // A completed result must be committed through the existing registerMatch pipeline,
  // never directly from this controller.
  function createCoachLiveController(home,away,rng,context,initialActions=[]){
    if(!home||!away||!rng||context?.mode!=="coach")return null;
    const actions=Array.isArray(initialActions)?initialActions.map(a=>({...a})):[];
    const runner=simulateSteps(home,away,rng,context,actions);
    let minute=0,finished=false,result=null,last=null;
    const used=[new Set(),new Set()],windows=[new Set(),new Set()];
    const substitutions=[0,0];
    for(const a of actions){
      if(![0,1].includes(a.side))continue;
      used[a.side].add(String(a.inId));
      if(a.minute!==46)windows[a.side].add(a.minute);
      substitutions[a.side]++;
    }
    return {
      advanceTo(target){
        if(finished||!Number.isInteger(target)||target<minute||target>94)return null;
        while(minute<target&&!finished){
          const next=runner.next();
          if(next.done){finished=true;result=next.value;break;}
          minute=next.value.minute;last=next.value.match;
        }
        if(minute===94&&!finished){const end=runner.next();if(end.done){finished=true;result=end.value;}}
        return {minute,finished,score:[last?.hg||0,last?.ag||0]};
      },
      substitute(side,outId,inId){
        if(finished||minute>=90||![0,1].includes(side))return false;
        const field=(side===0?home:away);
        if(!field||substitutions[side]>=5||used[side].has(String(inId)))return false;
        const windowMinute=minute+1;
        const nextWindows=new Set(windows[side]);if(windowMinute!==46)nextWindows.add(windowMinute);
        if(nextWindows.size>3)return false;
        const outgoing=field.roster?.find(p=>String(p.id)===String(outId));
        const incoming=field.roster?.find(p=>String(p.id)===String(inId));
        const lineupIds=new Set((field.lineup||[]).map(String));
        const reserveOrder=context?.coachCareer?.benchOrder||[];
        const orderRank=new Map(reserveOrder.map((id,i)=>[String(id),i]));
        const eligible=(field.roster||[]).filter(p=>p&&!lineupIds.has(String(p.id))&&!p.injury&&
          !(Number(p.suspension)>0)&&!p._competitionSuspended&&Number(p.condition??100)>35);
        const bench=new Set(eligible.sort((a,b)=>(orderRank.get(String(a.id))??99999)-(orderRank.get(String(b.id))??99999))
          .slice(0,7).map(p=>String(p.id)));
        const participants=(last?.participation||{});
        if(!outgoing||!incoming||!bench.has(String(inId))||!participants[outId]||participants[outId].exitMinute<minute||
          participants[inId]||incoming.injury||Number(incoming.suspension)>0||
          incoming._competitionSuspended||Number(incoming.condition??100)<=35)return false;
        actions.push({type:"substitution",side,minute:windowMinute,outId:String(outId),inId:String(inId)});
        used[side].add(String(inId));windows[side]=nextWindows;substitutions[side]++;
        return true;
      },
      snapshot(side){
        if(![0,1].includes(side))return null;
        const field=side===0?home:away;
        const roster=Array.isArray(field?.roster)?field.roster:[];
        const participation=last?.participation||{};
        const starters=new Set((field.lineup||[]).map(String));
        const incoming=new Set(actions.filter(a=>a.side===side&&a.minute<=minute).map(a=>a.inId));
        const outgoing=new Set(actions.filter(a=>a.side===side&&a.minute<=minute).map(a=>a.outId));
        const onField=new Set([...starters,...incoming].filter(id=>!outgoing.has(id)));
        const rank=new Map((context?.coachCareer?.benchOrder||[]).map((id,i)=>[String(id),i]));
        const reserved=roster.filter(p=>p&&!starters.has(String(p.id))&&!p.injury&&
          !(Number(p.suspension)>0)&&!p._competitionSuspended&&Number(p.condition??100)>35)
          .sort((a,b)=>(rank.get(String(a.id))??99999)-(rank.get(String(b.id))??99999)).slice(0,7);
        return {minute,side,score:[Number(last?.hg||0),Number(last?.ag||0)],events:(last?.events||[]).map(e=>({...e})),players:roster.filter(p=>onField.has(String(p.id))).map(p=>({
            id:String(p.id),name:String(p.name||p.id),pos:String(p.pos||""),
            condition:Number(p.condition??100),rating:Number(last?.ratings?.[p.id]??0),
            minutes:Math.max(0,minute-Number(participation[p.id]?.entryMinute??0))
          })),bench:reserved.filter(p=>!used[side].has(String(p.id))).map(p=>({
            id:String(p.id),name:String(p.name||p.id),pos:String(p.pos||""),
            condition:Number(p.condition??100)
          })),substitutions:substitutions[side],windows:windows[side].size,
          history:actions.filter(a=>a.side===side&&a.minute<=minute).map(a=>({...a}))};
      },
      get minute(){return minute;},get finished(){return finished;},
      get match(){return finished?result:last;},
      get result(){return finished?result:null;},
      get actions(){return actions.map(a=>({...a}));},
      get substitutionCounts(){return substitutions.slice();},
      get windowCounts(){return windows.map(w=>w.size);}
    };
  }
  // Ephemeral coach-only action queue. Never serialized into career saves.
  // The matching fixture consumes the queue once, before official simulation.
  const coachActionPlans=new WeakMap();
  function scheduleCoachActions(s,fixture,actions){
    if(!s||typeof s!=="object"||s.mode!=="coach"||!fixture||!Array.isArray(actions))return false;
    if(!fixture.home||!fixture.away||!Number.isInteger(fixture.date)||fixture.date<=s.day)return false;
    if(![fixture.home,fixture.away].includes(s.clubId))return false;
    if((s.matches||[]).some(m=>m.home===fixture.home&&m.away===fixture.away&&m.date===fixture.date))return false;
    if(actions.length>5||actions.some(a=>a?.type!=="substitution"||a.side!==(s.clubId===fixture.home?0:1)||
      !Number.isInteger(a.minute)||a.minute<1||a.minute>90||
      typeof a.outId!=="string"||!a.outId||typeof a.inId!=="string"||!a.inId||a.outId===a.inId))return false;
    // Maximum three substitution windows outside the half-time interval.
    // Multiple changes in the same minute consume one window.
    const windows=new Set(actions.filter(a=>a.minute!==45).map(a=>a.minute));
    if(windows.size>3)return false;
    const team=club(s,s.clubId);
    if(!team||!Array.isArray(team.roster))return false;
    const starters=new Set((team.lineup||[]).map(String));
    const available=team.roster.filter(p=>p&&!starters.has(String(p.id))&&!p.injury&&
      !(Number(p.suspension)>0)&&!p._competitionSuspended&&Number(p.condition??100)>35);
    const rank=new Map((s.coachCareer?.benchOrder||[]).map((id,i)=>[String(id),i]));
    const bench=available.slice().sort((x,y)=>(rank.get(String(x.id))??99999)-(rank.get(String(y.id))??99999)).slice(0,7);
    const benchIds=new Set(bench.map(p=>String(p.id)));
    if(actions.some(a=>!benchIds.has(a.inId)))return false;
    const byId=new Map(team.roster.map(p=>[String(p.id),p]));
    // Every substitution must remove a currently playing player.
    // Prevent accidentally deploying a goalkeeper in an outfield slot, or vice versa.
    const active=new Set(starters);
    for(const a of actions.slice().sort((x,y)=>x.minute-y.minute)){
      if(!active.has(a.outId)||active.has(a.inId))return false;
      const outgoing=byId.get(a.outId),incoming=byId.get(a.inId);
      if(!outgoing||!incoming||outgoing.injury||Number(outgoing.suspension)>0)return false;
      if((String(outgoing.pos)==="GOL")!==(String(incoming.pos)==="GOL"))return false;
      active.delete(a.outId);active.add(a.inId);
    }
    const seenOut=new Set(),seenIn=new Set();
    for(const a of actions){
      const out=a.side+":"+a.outId,incoming=a.side+":"+a.inId;
      if(seenOut.has(out)||seenIn.has(incoming))return false;
      seenOut.add(out);seenIn.add(incoming);
    }
    coachActionPlans.set(s,{home:fixture.home,away:fixture.away,date:fixture.date,
      actions:actions.map(a=>({type:"substitution",side:a.side,minute:a.minute,outId:a.outId,inId:a.inId}))});
    return true;
  }
  function coachActionPlan(s){
    const plan=s&&coachActionPlans.get(s);
    return plan?{home:plan.home,away:plan.away,date:plan.date,actions:plan.actions.map(a=>({...a}))}:null;
  }
  // Only the completed interactive official match may be committed, once.
  // Never persist a partially simulated match or a second set of career effects.
  const coachLiveResults=new WeakMap();
  function stageCoachLiveResult(s,fixture,controller){
    if(!s||s.mode!=="coach"||!fixture||!controller?.finished||!controller.result)return false;
    if(fixture.date!==s.day+1||![fixture.home,fixture.away].includes(s.clubId))return false;
    if(controller.result.home!==fixture.home||controller.result.away!==fixture.away)return false;
    if(coachLiveResults.has(s))return false;
    coachLiveResults.set(s,{home:fixture.home,away:fixture.away,date:fixture.date,result:controller.result});
    return true;
  }
  function discardCoachLiveResult(s){coachLiveResults.delete(s);}
  function registerMatch(s, rng, homeId, awayId, meta, leagueMatch) {
    const hc = club(s, homeId), ac = club(s, awayId);
    const disciplineMeta={...meta,leagueId:leagueMatch?hc.leagueId:null};
    const disciplineKey=prepareDisciplineAvailability(s,hc,disciplineMeta);
    prepareDisciplineAvailability(s,ac,disciplineMeta);
    preparePlayerLineup(s, rng, homeId, awayId);
    const pendingCoachPlan=coachActionPlans.get(s);
    const applies=pendingCoachPlan&&s.mode==="coach"&&pendingCoachPlan.home===homeId&&
      pendingCoachPlan.away===awayId&&pendingCoachPlan.date===s.day;
    if(applies)coachActionPlans.delete(s);
    // Validate actions against the actual prepared XI, not the stale pre-match display.
    const eligibleActions=[];
    if(applies){
      const team=s.clubId===homeId?hc:ac,side=s.clubId===homeId?0:1;
      const onField=new Set(selected(team).map(p=>String(p.id)));
      const usedBench=new Set();
      for(const a of pendingCoachPlan.actions.slice().sort((a,b)=>a.minute-b.minute)){
        const incoming=team.roster.find(p=>String(p.id)===a.inId);
        if(a.side!==side||!onField.has(a.outId)||onField.has(a.inId)||usedBench.has(a.inId)||
          !incoming||incoming.injury||incoming.suspension>0||incoming._competitionSuspended||incoming.condition<=35)continue;
        onField.delete(a.outId);onField.add(a.inId);usedBench.add(a.inId);eligibleActions.push(a);
      }
    }
    const staged=coachLiveResults.get(s);
    const useLive=staged&&s.mode==="coach"&&staged.date===s.day&&
      staged.home===homeId&&staged.away===awayId;
    if(useLive)coachLiveResults.delete(s);
    const m = useLive ? staged.result : simulate(hc, ac, rng, s, eligibleActions);
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
    m.importance=matchImportance(s,{...meta,home:homeId,away:awayId});
    processDiscipline(s,m,disciplineMeta,hc,ac);
    serveDisciplineSuspensions(hc,disciplineKey);
    serveDisciplineSuspensions(ac,disciplineKey);
    if (!leagueMatch && meta.continentalMatch !== true) Competitions?.recordResult(s, m, rng);
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
      const reputationBefore = Number(s.reputation || 0), roleBefore=s.mode === "player" ? Career.init(s).playerCareer?.squadRole : null;
      Career.match(s, m);
      if (s.mode === "player") {
        const pc = Career.init(s).playerCareer, perf = m.playerStats?.hero, played = !!m.ratings?.hero;
        const importanceFactor=Number(m.importance?.factor||1), rawTrust=Number(pc.coachTrust||0)-trustBefore;
        pc.coachTrust=clamp(trustBefore+rawTrust*importanceFactor,0,100);Career.updatePlayerRole?.(s);
        const goals = m.events.filter((e) => e.type === "goal" && e.playerId === "hero").length;
        const assists = m.events.filter((e) => e.type === "goal" && e.assistPlayerId === "hero").length;
        const yellowCards=m.events.filter(e=>e.type==="yellow"&&e.playerId==="hero").length, redCard=m.events.some(e=>e.type==="red"&&e.playerId==="hero");
        const selection = pc.matchSelection || {}, unavailable = !!s.person.injury || Number(s.person.suspension || 0) > 0;
        const status = played ? (perf?.starter === false ? "ENTROU_DO_BANCO" : "TITULAR") : unavailable ? "INDISPONIVEL" : selection.role === "Banco" ? "NAO_UTILIZADO" : "NAO_RELACIONADO";
        const report = {
          day:s.day, season:s.season, competition:m.competitionName || "Partida", opponent:(homeId===s.clubId?ac:hc)?.name || "Adversário",
          status, entryMinute:played && perf?.starter === false ? Number(perf.entryMinute || 0) : null, minutes:played ? Number(perf?.minutes || 0) : 0,
          rating:played ? Number(m.ratings.hero || 0) : null, goals, assists, yellowCards, redCard, xp:played ? +(heroDevelopment?.xp || 0).toFixed(2) : 0,
          levelBefore:heroDevelopment?.levelBefore ?? null, levelAfter:heroDevelopment?.levelAfter ?? null, attributeChanges:heroDevelopment?.changes||[], coachTrustBefore:trustBefore, coachTrustAfter:Number(pc.coachTrust || 0),
          squadRoleBefore:roleBefore, squadRoleAfter:pc.squadRole, reputationBefore, reputationAfter:null, importance:m.importance,
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
      s.reputation = clamp(s.reputation + (own > other ? 1 : own < other ? -0.4 : 0.2)*Number(m.importance?.factor||1), 0, 100);
      if(s.mode==="player"){
        const report=Career.init(s).playerCareer.lastMatchReport;
        if(report&&report.day===s.day){report.reputationAfter=Number(s.reputation||0);report.reputationDelta=+(report.reputationAfter-Number(report.reputationBefore||0)).toFixed(2);}
        const rating=Number(m.ratings?.hero||0),extraPressure=(Number(m.importance?.factor||1)-1)*(rating>=8?-4:rating<6?8:2);
        if(extraPressure)Career.updateMediaProfile?.(s,{pressure:+extraPressure.toFixed(2)});
      }
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
  function matchImportance(s, fixture = {}, options = {}) {
    const stageText=String(fixture.stage || fixture.phase || fixture.roundName || "").trim().toLowerCase();
    const text = `${fixture.competitionName || fixture.competition || ""} ${stageText}`.toLowerCase();
    const national = options.national || fixture.competitionId === "nationalTeam";
    let factor = national ? 1.1 : 1, label = national ? "Jogo de Seleção" : "Jogo oficial";
    if (/copa do mundo|copa mundial|world cup|finalissima/.test(text)) { factor = Math.max(factor, 1.18); label = "Competição internacional importante"; }
    if (/mata-mata|oitavas|quartas|knockout|round_of_16|quarterfinal/.test(text)) { factor = Math.max(factor, 1.1); label = "Mata-mata"; }
    if (/semi/.test(text)) { factor = Math.max(factor, 1.15); label = "Semifinal"; }
    if (/^(grande )?final$/.test(stageText)) { factor = Math.max(factor, 1.22); label = "Final"; }
    const home = fixture.home && club(s, fixture.home), away = fixture.away && club(s, fixture.away);
    if (home && away && home.city && home.city === away.city) { factor = Math.max(factor, 1.08); label = "Clássico"; }
    return { factor:+Math.min(1.25, factor).toFixed(2), label };
  }
  function nextCommitment(s) {
    const pair = s.fixtures[s.round]?.find((fixture) => fixture.includes(s.clubId));
    const league = pair && { home: pair[0], away: pair[1], date: nextFixtureDay(s), round: s.round + 1, competitionId: club(s)?.leagueId, competitionName: s.leagues.find((l) => l.id === club(s)?.leagueId)?.name };
    const extra = Competitions?.nextFixture(s);
    const nationalMatch = s.mode === "player" && NationalTeam?.init(s).calledUp ? NationalTeam.upcoming(s)[0] : null;
    const nationalIdentity = root.ProLifeNationalIdentity?.heroTeam?.(s, API);
    const trackedCup = (s.nationalTeam?.tournaments || []).find(t => t?.type === "WORLD_CUP" && Number(t.year) === 2026 + Math.floor(s.day / 365));
    const trackedId = trackedCup?.trackedTeamId;
    const nationalCode = nationalIdentity?.code || (s.person?.nationality === "Brasil" ? "BRA" : null);
    const nationalEligible = !trackedId || trackedId === nationalCode;
    const nationalName = nationalIdentity?.name || s.person?.nationality || "Brasil";
    const national = nationalMatch && nationalEligible && { national:true, date: nationalMatch.day, competitionId: "nationalTeam", competitionName: nationalMatch.competition, stage: nationalMatch.stage || "Seleção", opponent: nationalMatch.opponent, homeName: nationalName, awayName: nationalMatch.opponent };
    let world = null;
    const hc = s.mode === "player" && s.clubId ? club(s) : null;
    if (hc?.worldMatch && WorldClubCompetitions?.nextFixture) {
      const f = WorldClubCompetitions.nextFixture(s, hc.leagueId, s.clubId);
      if (f && f.date >= s.day) world = { home: f.home, away: f.away, date: f.date, round: f.round, competitionId: hc.leagueId, competitionName: GlobalFootball?.leagueById?.(s, hc.leagueId)?.name || hc.leagueId };
    }
    const uclSchedule = Continental?.edition?.(s, "ucl", s.season)?.leagueSchedule;
    const uclMatch = Array.isArray(uclSchedule?.matches)
      ? uclSchedule.matches
          .filter(m =>
            !m.played &&
            Number.isInteger(m.day) &&
            m.day > s.day &&
            [m.homeId, m.awayId].includes(s.clubId)
          )
          .sort((a, b) => a.day - b.day)[0]
      : null;
    const continental = uclMatch && {
      home: uclMatch.homeId,
      away: uclMatch.awayId,
      date: uclMatch.day,
      round: uclMatch.round,
      competitionId: "ucl",
      competitionName: "UEFA Champions League",
      stage: "Fase de liga"
    };
    const koFixture = ChampionsKnockout?.nextFixture?.(s,Continental?.edition?.(s,"ucl"),s.clubId);
    const knockout = koFixture && {home:koFixture.homeId,away:koFixture.awayId,date:koFixture.day,round:koFixture.pair+1,competitionId:"ucl",competitionName:"UEFA Champions League",stage:koFixture.stage};
    const uelEd=Continental?.edition?.(s,"uel",s.season);
    const uelGame=uelEd?.leagueSchedule?.matches?.filter(m=>!m.played&&m.day>s.day&&[m.homeId,m.awayId].includes(s.clubId)).sort((a,b)=>a.day-b.day)[0];
    const europa=uelGame&&{home:uelGame.homeId,away:uelGame.awayId,date:uelGame.day,round:uelGame.round,competitionId:"uel",competitionName:"UEFA Europa League",stage:"Fase de liga"};
    const uelKo=EuropaKnockout?.nextFixture?.(s,uelEd,s.clubId);
    const europaKo=uelKo&&{home:uelKo.homeId,away:uelKo.awayId,date:uelKo.day,round:uelKo.pair+1,competitionId:"uel",competitionName:"UEFA Europa League",stage:uelKo.stage};
    const ueclEd=Continental?.edition?.(s,"uecl",s.season);
    const ueclMatch=ueclEd?.leagueSchedule?.matches?.filter(m=>!m.played&&m.day>s.day&&[m.homeId,m.awayId].includes(s.clubId)).sort((a,b)=>a.day-b.day)[0];
    const conference=ueclMatch&&{home:ueclMatch.homeId,away:ueclMatch.awayId,date:ueclMatch.day,round:ueclMatch.round,competitionId:"uecl",competitionName:"UEFA Conference League",stage:"Fase de liga"};
    const ueclKo=ConferenceKnockout?.nextFixture?.(s,ueclEd,s.clubId);
    const conferenceKo=ueclKo&&{home:ueclKo.homeId,away:ueclKo.awayId,date:ueclKo.day,round:ueclKo.pair+1,competitionId:"uecl",competitionName:"UEFA Conference League",stage:ueclKo.stage};
    return [league, extra, national, world, continental, knockout, europa, europaKo,conference,conferenceKo].filter(Boolean).sort((a,b)=>a.date-b.date)[0] || null;
  }
  function newSeason(s, rng) {
    WorldClubCompetitions?.closeSeason(s);
    WorldStats?.closeSeason(s);
    CoachCareer?.closeSeason(s, API, { log: (title, body) => log(s, title, body) });
    ClubIntelligence?.closeSeason(s, { log: (title, body) => log(s, title, body) });
    World2?.init(s, API);
    World2?.snapshotPerformance(s);
    const orders = Object.fromEntries((s.leagues || []).map((league) => [league.id, table(s, league.id)]));
    Competitions?.closeSeason(s, table);
    try { Continental?.closeSeason(s, { orders }); } catch (e) { /* infraestrutura continental nunca bloqueia o fim da temporada */ }
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
    const heroWorld = s.mode === "player" && s.clubId ? club(s) : null;
    if (heroWorld?.worldMatch && WorldClubCompetitions?.standings) {
      const order = WorldClubCompetitions.standings(s, heroWorld.leagueId) || [];
      const lg = GlobalFootball?.leagueById?.(s, heroWorld.leagueId);
      if (order.length) {
        s.history.unshift({ season: s.season, leagueId: heroWorld.leagueId, league: lg?.name || heroWorld.leagueId, champion: order[0].name, position: order.findIndex((c) => c.id === s.clubId) + 1 || null, mode: s.mode, goals: s.person.goals, minutes: s.person.minutes });
        log(s, "Fim da temporada", order[0].name + " é campeão de " + (lg?.name || heroWorld.leagueId) + ".");
      }
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
    s.worldMatchClubs = {};
    GlobalFootball?.rollSeason(s);
    WorldClubCompetitions?.nextSeason(s);
    try { Continental?.startSeason(s); } catch (e) { /* idem */ }
    // UCL annual lifecycle: initialize fixtures immediately on season rollover.
    // This also covers advancing across 1 January in a single 30-day simulation.
    if (ChampionsSeason && Continental && WorldClubCompetitions) {
      const ucl=Continental.edition(s,"ucl");
      if (ucl?.status==="ready" && !ucl.leagueSchedule &&
          s.day < Continental.windows(s.season,"ucl")[0]) {
        ChampionsSeason.prepare(s,Continental,WorldClubCompetitions);
      }
    }
    if (EuropaSeason && Continental && WorldClubCompetitions && s.catalogVersion === "fc27_v1") {
      const uel=Continental.edition(s,"uel");
      if (uel?.status==="ready" && !uel.leagueSchedule && s.day<Continental.windows(s.season,"uel")[0])
        EuropaSeason.prepare(s,Continental,WorldClubCompetitions);
    }
    if (s.catalogVersion === "fc27_v1" && ConferenceLive && Continental) {
      const ed=Continental.edition(s,"uecl");
      if(ed?.status==="ready") {try{ConferenceLive.prepare(s,ed);}catch(e){ed.conferenceError=String(e?.message||e);}}
    }
    ClubIntelligence?.startSeason(s);
    CoachCareer?.startSeason(s, API);
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
  // 34F.32B.4E.3 - Processamento diario da fase de liga.
  function processChampionsDay(s, rng) {
    if (!ChampionsSeason || !Continental || !WorldClubCompetitions) return null;

    const ed = Continental.edition(s, "ucl");
    if (!Array.isArray(ed?.leagueSchedule?.matches)) return null;

    return ChampionsSeason.processDay(
      s, Continental, WorldClubCompetitions, {
        otherFixture(match) {
          const home = GlobalFootball?.clubById?.(s, match.homeId);
          const away = GlobalFootball?.clubById?.(s, match.awayId);
          const hs = Number(home?.strength ?? home?.reputation ?? 65);
          const as = Number(away?.strength ?? away?.reputation ?? 65);

          let hash = 2166136261;
          const key = match.id + "|" + String(s.season);

          for (const c of key) {
            hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
          }

          const seed = hash >>> 0;
          const hg = Math.max(0, Math.min(6,
            Math.round(1.35 + (hs - as) / 28 + ((seed % 5) - 2) / 2)
          ));
          const ag = Math.max(0, Math.min(6,
            Math.round(1.05 + (as - hs) / 28 +
              ((Math.floor(seed / 17) % 5) - 2) / 2)
          ));

          return { hg, ag };
        },

        heroFixture(match) {
          if (s.mode !== "player" || !s.clubId) return null;

          const hero = worldMatchClub(s, s.clubId);
          if (!hero || match.day < (hero.joinedDay ?? s.day)) return null;

          const previousScope = worldMatchScope;

          worldMatchScope = {
            s,
            ids: [match.homeId, match.awayId],
            cache: {}
          };

          try {
            const m = registerMatch(
              s, rng, match.homeId, match.awayId,
              {
                round: match.round,
                competitionId: "ucl",
                competitionName: "UEFA Champions League",
                stage: "Fase de liga",
                continentalMatch: true
              },
              false
            );

            m.continentalMatch = true;
            return { hg: m.hg, ag: m.ag };
          } finally {
            worldMatchScope = previousScope;
          }
        }
      }
    );
  }
  // 34F.32B.6 - Knockout UCL persistente, separado da liga nacional.
  function processChampionsKnockoutDay(s, rng) {
    const ed=Continental?.edition?.(s,"ucl");
    if(!ChampionsKnockout||!ed?.leagueSchedule?.matches)return null;
    const score=(m)=>{
      const hc=GlobalFootball?.clubById?.(s,m.homeId);
      const ac=GlobalFootball?.clubById?.(s,m.awayId);
      const hs=Number(hc?.strength??hc?.reputation??65),as=Number(ac?.strength??ac?.reputation??65);
      const key=String(m.id)+"|"+String(s.season);
      let h=2166136261;for(const c of key)h=Math.imul(h^c.charCodeAt(0),16777619);
      const seed=h>>>0;
      return {
        hg:Math.max(0,Math.min(6,Math.round(1.35+(hs-as)/28+((seed%5)-2)/2))),
        ag:Math.max(0,Math.min(6,Math.round(1.05+(as-hs)/28+((Math.floor(seed/17)%5)-2)/2)))
      };
    };
    const koResult=ChampionsKnockout.daily(s,ed,{
      otherFixture:score,
      heroFixture(m){
        const hero=worldMatchClub(s,s.clubId);
        if(!hero||m.day<(hero.joinedDay??s.day))return null;
        const before=worldMatchScope;
        worldMatchScope={s,ids:[m.homeId,m.awayId],cache:{}};
        try{
          const names={playoffs:"Playoffs",round16:"Oitavas",quarters:"Quartas",semis:"Semifinais",final:"Final"};
          const result=registerMatch(s,rng,m.homeId,m.awayId,{
            round:m.pair+1,competitionId:"ucl",competitionName:"UEFA Champions League",
            stage:names[m.stage]||m.stage,continentalMatch:true
          },false);
          result.continentalMatch=true;
          return {hg:result.hg,ag:result.ag};
        }finally{worldMatchScope=before}
      }
    });
    // desfecho (agregado / prorrogacao / penaltis) fica guardado no registro dos jogos do seu clube
    try{
      for(const st of koResult?.stages||[])for(const km of st.matches||[]){
        if(!km.tie||!km.played)continue;
        const rec=(s.matches||[]).find(x=>x.competitionId==="ucl"&&x.home===km.homeId&&x.away===km.awayId&&x.season===s.season&&!x.tie&&x.round===km.pair+1&&x.date===km.playedDay);
        if(rec)rec.tie=km.tie;
      }
    }catch(e){}
    return koResult;
  }
  function processEuropaDay(s, rng) {
    if (!EuropaSeason || !Continental || !WorldClubCompetitions) return null;

    const ed = Continental.edition(s, "uel");
    if (!Array.isArray(ed?.leagueSchedule?.matches)) return null;

    return EuropaSeason.processDay(
      s, Continental, WorldClubCompetitions, {
        otherFixture(match) {
          const home = GlobalFootball?.clubById?.(s, match.homeId);
          const away = GlobalFootball?.clubById?.(s, match.awayId);
          const hs = Number(home?.strength ?? home?.reputation ?? 65);
          const as = Number(away?.strength ?? away?.reputation ?? 65);

          let hash = 2166136261;
          const key = match.id + "|" + String(s.season);

          for (const c of key) {
            hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
          }

          const seed = hash >>> 0;
          const hg = Math.max(0, Math.min(6,
            Math.round(1.35 + (hs - as) / 28 + ((seed % 5) - 2) / 2)
          ));
          const ag = Math.max(0, Math.min(6,
            Math.round(1.05 + (as - hs) / 28 +
              ((Math.floor(seed / 17) % 5) - 2) / 2)
          ));

          return { hg, ag };
        },

        heroFixture(match) {
          if (s.mode !== "player" || !s.clubId) return null;

          const hero = worldMatchClub(s, s.clubId);
          if (!hero || match.day < (hero.joinedDay ?? s.day)) return null;

          const previousScope = worldMatchScope;

          worldMatchScope = {
            s,
            ids: [match.homeId, match.awayId],
            cache: {}
          };

          try {
            const m = registerMatch(
              s, rng, match.homeId, match.awayId,
              {
                round: match.round,
                competitionId: "uel",
                competitionName: "UEFA Europa League",
                stage: "Fase de liga",
                continentalMatch: true
              },
              false
            );

            m.continentalMatch = true;
            return { hg: m.hg, ag: m.ag };
          } finally {
            worldMatchScope = previousScope;
          }
        }
      }
    );
  }
  // 34F.32B.6 - Knockout UCL persistente, separado da liga nacional.
  function processEuropaKnockoutDay(s, rng) {
    const ed=Continental?.edition?.(s,"uel");
    if(!EuropaKnockout||!ed?.leagueSchedule?.matches)return null;
    const score=(m)=>{
      const hc=GlobalFootball?.clubById?.(s,m.homeId);
      const ac=GlobalFootball?.clubById?.(s,m.awayId);
      const hs=Number(hc?.strength??hc?.reputation??65),as=Number(ac?.strength??ac?.reputation??65);
      const key=String(m.id)+"|"+String(s.season);
      let h=2166136261;for(const c of key)h=Math.imul(h^c.charCodeAt(0),16777619);
      const seed=h>>>0;
      return {
        hg:Math.max(0,Math.min(6,Math.round(1.35+(hs-as)/28+((seed%5)-2)/2))),
        ag:Math.max(0,Math.min(6,Math.round(1.05+(as-hs)/28+((Math.floor(seed/17)%5)-2)/2)))
      };
    };
    return EuropaKnockout.daily(s,ed,{
      otherFixture:score,
      heroFixture(m){
        const hero=worldMatchClub(s,s.clubId);
        if(!hero||m.day<(hero.joinedDay??s.day))return null;
        const before=worldMatchScope;
        worldMatchScope={s,ids:[m.homeId,m.awayId],cache:{}};
        try{
          const names={playoffs:"Playoffs",round16:"Oitavas",quarters:"Quartas",semis:"Semifinais",final:"Final"};
          const result=registerMatch(s,rng,m.homeId,m.awayId,{
            round:m.pair+1,competitionId:"uel",competitionName:"UEFA Europa League",
            stage:names[m.stage]||m.stage,continentalMatch:true
          },false);
          result.continentalMatch=true;
          return {hg:result.hg,ag:result.ag};
        }finally{worldMatchScope=before}
      }
    });
  }
  function processConferenceDay(s, rng) {
    if (!ConferenceLive || !Continental || !WorldClubCompetitions) return null;

    const ed = Continental.edition(s, "uecl");
    if (!Array.isArray(ed?.leagueSchedule?.matches)) return null;

    return ConferenceLive.daily(
      s, ed, {
        otherFixture(match) {
          const home = GlobalFootball?.clubById?.(s, match.homeId);
          const away = GlobalFootball?.clubById?.(s, match.awayId);
          const hs = Number(home?.strength ?? home?.reputation ?? 65);
          const as = Number(away?.strength ?? away?.reputation ?? 65);

          let hash = 2166136261;
          const key = match.id + "|" + String(s.season);

          for (const c of key) {
            hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
          }

          const seed = hash >>> 0;
          const hg = Math.max(0, Math.min(6,
            Math.round(1.35 + (hs - as) / 28 + ((seed % 5) - 2) / 2)
          ));
          const ag = Math.max(0, Math.min(6,
            Math.round(1.05 + (as - hs) / 28 +
              ((Math.floor(seed / 17) % 5) - 2) / 2)
          ));

          return { hg, ag };
        },

        heroFixture(match) {
          if (s.mode !== "player" || !s.clubId) return null;

          const hero = worldMatchClub(s, s.clubId);
          if (!hero || match.day < (hero.joinedDay ?? s.day)) return null;

          const previousScope = worldMatchScope;

          worldMatchScope = {
            s,
            ids: [match.homeId, match.awayId],
            cache: {}
          };

          try {
            const m = registerMatch(
              s, rng, match.homeId, match.awayId,
              {
                round: match.round,
                competitionId: "uecl",
                competitionName: "UEFA Conference League",
                stage: "Fase de liga",
                continentalMatch: true
              },
              false
            );

            m.continentalMatch = true;
            return { hg: m.hg, ag: m.ag };
          } finally {
            worldMatchScope = previousScope;
          }
        }
      }
    );
  }
  function advance(s, days = 1) {
    // FC27/UCL: every advance reconciles missing continental editions.
    // Legacy careers may have skipped the seasonal rollover entirely.
    if (ChampionsSeason && Continental && WorldClubCompetitions) {
      // Reconcile either a missing edition OR a registered edition without fixtures.
      // A legacy fingerprint is an existing historical continental edition.
      // Never recover a freshly created game that merely skipped its old window.
      const legacyContinental = s.catalogVersion === "fc27_v1" &&
        Number(s.season) > 2026 &&
        Object.values(s.continental?.editions || {}).some(e =>
          e && Number(e.season) < Number(s.season) && e.comp === "ucl"
        );
      Continental.init(s);
      const ed=Continental.edition(s,"ucl");
      if (ed?.status==="ready" && !ed.leagueSchedule) {
        const firstDay=Continental.windows(s.season,"ucl")[0];
        const base=(Number(s.season)-2026)*365;
        if(s.day<firstDay) {
          ChampionsSeason.prepare(s,Continental,WorldClubCompetitions);
        } else if(legacyContinental && s.day<base+152) {
          // One-time controlled 8-round rescheduling entirely after today.
          // Recover only when all eight rounds fit before the knockout.
          try {
            ChampionsSeason.prepare(s,Continental,WorldClubCompetitions,{recover:true});
          } catch(e) {
            // Prevent corrupt saves / missing team coverage from stopping a career.
            ed.recoveryError=String(e?.message||e);
          }
        }
      }
    }
    if (s.catalogVersion === "fc27_v1" && EuropaSeason && Continental && WorldClubCompetitions) {
      Continental.init(s);
      const uel=Continental.edition(s,"uel");
      if (uel?.status==="ready" && !uel.leagueSchedule && s.day<Continental.windows(s.season,"uel")[0])
        EuropaSeason.prepare(s,Continental,WorldClubCompetitions);
    }
    if (s.catalogVersion === "fc27_v1" && ConferenceLive && Continental) {
      Continental.init(s);
      const ed=Continental.edition(s,"uecl");
      if(ed?.status==="ready"&&!ed.leagueSchedule) {try{ConferenceLive.prepare(s,ed);}catch(e){ed.conferenceError=String(e?.message||e);}}
    }
    if (s.catalogVersion === "fc27_v1") GlobalFootball?.ensureAcademies?.(s);
    Career.init(s);
    Training?.init(s);
    Statistics?.init(s);
    Competitions?.init(s);
    Life?.init(s);
    Commercial?.init(s, API);
    UnexpectedEvents?.init(s);
    WorldLiveMarket?.init?.(s);
    const rng = new Random(s.rng);
    for (let d = 0; d < clamp(days, 1, 30); d++) {
      s.day++;
      generateWorldMarket(s, rng);
      WorldLiveMarket?.tick?.(s, rng);
      applyMarketBudgets(s, WorldLiveMarket?.executeCompleted?.(s, { canExecute: worldMarketCanExecute })?.executed);
      Career.daily(s);
      birthdayTick(s);
      World2?.daily(s, API);
      WorldClubCompetitions?.daily(s, { heroFixture: (...a) => worldHeroFixture(s, rng, ...a) });
      processChampionsDay(s, rng);
      processChampionsKnockoutDay(s, rng);
      processEuropaDay(s, rng);
      processEuropaKnockoutDay(s, rng);
      processConferenceDay(s, rng);
      ClubIntelligence?.daily(s, { log: (title, body) => log(s, title, body) });
      CoachCareer?.daily(s, API, { log: (title, body) => log(s, title, body) });
      OffField?.daily(s, API, { log: (title, body) => log(s, title, body) });
      NationalTeam?.daily(s, rng, API, log);
      const pendingBefore = new Set((NationalCallups?.pending?.(s) || []).map((r) => r.id));
      try { NationalCallups?.daily(s, API, log); } catch (e) { /* convocacao nunca bloqueia o avanco do dia */ }
      if ((NationalCallups?.pending?.(s) || []).some((r) => !pendingBefore.has(r.id))) days = d + 1; // convocacao NOVA: o avanco multi-dia termina neste dia
      Commercial?.daily?.(s, rng, Career, API);
      s.contract = Math.max(0, s.contract - 1);
      s.offers = s.offers.filter((o) => o.expires >= s.day);
      if (s.mode === "player" && s.clubId) {
        const pc = Career.init(s).playerCareer;
        if (pc.renewalOffer && pc.renewalOffer.expires < s.day) pc.renewalOffer = null;
        if (s.contract > 0 && s.contract <= 180 && !pc.renewalOffer && s.day % 30 === 0) Career.createRenewalOffer(s);
        if (s.contract === 0) {
          const old = club(s);
          if (old) { if (Array.isArray(old.roster)) old.roster = old.roster.filter((p) => p.id !== "hero"); old.lineup = Array.isArray(old.lineup) ? old.lineup.filter((id) => id !== "hero") : []; }
          if (pc.contract?.type === "loan" && pc.contract.parentClubId) {
            const parent=club(s,pc.contract.parentClubId);
            if(parent){ parent.roster.push(s.person); s.clubId=parent.id; s.salary=pc.contract.parentSalary||s.salary; s.contract=Math.max(30,(pc.contract.parentContractRemaining||395)-pc.contract.durationDays); pc.contract={clubId:parent.id,signedDay:s.day,endDay:s.day+s.contract,durationDays:s.contract,salary:s.salary,signingBonus:0,role:pc.squadRole,type:"permanent"}; log(s,"Fim do empréstimo",`Você retornou ao ${parent.name} após o período de empréstimo.`); }
          } else { s.clubId = null; dropWorldMatchClubs(s, null); pc.contract = null; s.careerTransferAvailableDay = 0; log(s, "Fim de contrato", "Seu vínculo terminou. Você está livre para assinar com um novo clube."); }
          pc.renewalOffer = null;
        }
      }
      for (const c of s.clubs)
        for (const p of c.roster) {
          Physical?.daily?.(p, s.day, p.id === "hero" ? s.intensity : "normal");
          if (!Physical) { p.injury = Math.max(0, p.injury - 1); p.condition = clamp(p.condition + (p.id === "hero" && s.intensity === "hard" ? 2 : 5), 0, 100); }
          if (p.suspension !== undefined) { const sv = Math.max(0, Number(p.suspension) || 0); if (sv > 0) p.suspension = sv; else delete p.suspension; } // ausência = 0
        }
      if (s.mode === "player" && s.clubId && s.worldMatchClubs?.[s.clubId]) {
        for (const p of club(s).roster) {
          Physical?.daily?.(p, s.day, p.id === "hero" ? s.intensity : "normal");
          if (!Physical) { p.injury = Math.max(0, p.injury - 1); p.condition = clamp(p.condition + (p.id === "hero" && s.intensity === "hard" ? 2 : 5), 0, 100); }
        }
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
          if (CoachCareer) CoachCareer.dismiss(s, API, "Confiança da diretoria esgotada");
          else { s.clubId = null; s.board = 50; }
          log(
            s,
            "Demissão",
            "A diretoria encerrou seu vínculo pelos resultados. Você pode buscar uma nova oportunidade.",
          );
        }
      }
      if (s.day % 21 === 0 && !s.decision) {
        s.decision = Life?.next(s, rng);
        if (s.decision) {
          s.decision.createdDay = s.day;
          s.decision.deadline = s.day + 7;
          log(s, "Decisão pendente", s.decision.title);
        }
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
    Life?.sanitizeDecision?.(s);
    if (s.mode !== "player") return [];
    const pc = Career.init(s).playerCareer, out = [];
    if (s.decision) out.push({ id:`life:${s.decision.id || s.decision.title}`, entityId:s.decision.id, type:"decision", title:s.decision.title, deadline:Number.isFinite(s.decision.deadline)?s.decision.deadline:s.day+7, page:"life", anchor:"current-decision", priority:"URGENTE" });
    const interviews=(Career.init(s)?.communications?.interviews || []).filter(i=>!i.answered);
    for (const i of interviews) out.push({ id:`interview:${i.id}`, entityId:i.id, type:"interview", title:i.title || i.subject || "Convite para uma entrevista", deadline:Number.isFinite(i.deadline)?i.deadline:s.day+7, page:"inbox", anchor:`interview-${i.id}`, priority:"URGENTE" });
    if (pc?.renewalOffer) out.push({ id:`renewal:${pc.renewalOffer.expires}`, entityId:String(pc.renewalOffer.expires), type:"renewal", title:"Responder proposta de renovação", deadline:pc.renewalOffer.expires, page:"proposals", anchor:"renewal-offer", priority:"URGENTE" });
    for (const o of (s.offers || []).filter(o=>o.expires>=s.day && o.clubId!==pc?.marketState?.signedAgreement?.clubId)) out.push({ id:`offer:${o.clubId}:${o.expires}`, entityId:o.clubId, type:"offer", title:`Responder proposta de ${club(s,o.clubId)?.name || "transferência"}`, deadline:o.expires, page:"proposals", anchor:`transfer-offer-${o.clubId}`, priority:"URGENTE" });
    const commercial=Commercial?.init(s,API);
    for (const p of (commercial?.proposals || []).filter(p=>p.status==="PROPOSTA"&&p.expires>=s.day)) out.push({ id:`commercial:${p.id}`, entityId:p.id, type:"commercial", title:`Responder proposta de ${p.brand}`, deadline:p.expires, page:"sponsorships", anchor:`commercial-proposal-${p.id}`, priority:"URGENTE" });
    for (const e of (commercial?.events || []).filter(e=>["AGENDADO","REAGENDADO"].includes(e.status)&&e.mandatory&&e.day>=s.day)) out.push({ id:`commercial-event:${e.id}`, entityId:e.id, type:"commercial-event", title:`Confirmar compromisso com ${e.brand}`, deadline:e.day, page:"sponsorships", anchor:`commercial-event-${e.id}`, priority:"URGENTE" });
    return out.sort((a,b)=>a.deadline-b.deadline);
  }
  function expiringAction(s, targetDay) { return pendingActions(s).find(x=>x.deadline<=targetDay) || null; }
  function callupBlocker(s) {
    try { return s.mode === "player" ? (NationalCallups?.blocker(s) || null) : null; } catch (e) { return null; }
  }
  function contractualSimulationBlocker(s) {
    if (s.mode !== "player") return null;
    const callupStop = callupBlocker(s);
    if (callupStop) return callupStop;
    const pc = Career.init(s).playerCareer;
    if (pc?.renewalOffer) return { type:"renewal", contractKind:"renewal", page:"proposals", anchor:"renewal-offer", message:"Simulação interrompida: há uma proposta de renovação aguardando sua autorização." };
    // Proposta do clube com acordo ja assinado nao e mais uma decisao pendente: a transferencia agendada segue sozinha.
    const agreedClub = pc?.marketState?.signedAgreement?.clubId || null;
    const offer = (s.offers || []).find(o => o.clubId !== agreedClub && o.expires >= s.day && (!o.onHold || o.expires <= s.day + 1));
    if (!offer) return null;
    const loan = offer.transferType === "loan";
    return { type:"offer", contractKind:loan?"loan":"transfer", id:offer.clubId, page:"proposals", anchor:`transfer-offer-${offer.clubId}`, message:`Simulação interrompida: há uma proposta de ${loan?"empréstimo":"transferência"} de ${club(s,offer.clubId)?.name || "outro clube"}.` };
  }
  function simulationBlocker(s, before = {}, options = {}) {
    const career = s.mode === "player" ? Career.init(s) : null;
    const pc = career?.playerCareer || null;
    if (options.contractOnly) return contractualSimulationBlocker(s);
    const callupStop = callupBlocker(s);
    if (callupStop) return callupStop;
    if (s.decision && !before.decision) return { type:"decision", id:s.decision.id, title:s.decision.title, page:"life", anchor:"current-decision", message:`Simulação interrompida: ${s.decision.title}.` };
    if (s.decision && before.decision) return { type:"pending", id:s.decision.id, title:s.decision.title, page:"life", anchor:"current-decision", message:`Simulação pausada: responda ${s.decision.title}.` };
    if (pc?.renewalOffer && !before.renewalOffer) return { type:"renewal", page:"proposals", anchor:"renewal-offer", message:"Simulação interrompida: chegou uma proposta de renovação." };
    const previousOffers = new Set(before.offers || []);
    const agreedClubId = pc?.marketState?.signedAgreement?.clubId || null;
    const newOffer = (s.offers || []).find(o=>o.clubId!==agreedClubId && !previousOffers.has(`${o.clubId}:${o.expires}:${o.salary}`));
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
    Life?.sanitizeDecision?.(s);
    if (!s.decision?.choices?.length) return false;
    const picked = contextualChoice(s, s.decision, s.decision.choices);
    const title = s.decision.title, label = picked[1];
    decide(s, picked[0]);
    log(s, "Decisão automática", `${title} · Escolha: ${label}.`);
    return true;
  }
  function stableChoiceNoise(s, decision, choice) {
    let h = (Number(s.seed || 1) >>> 0) || 1;
    for (const ch of `${decision?.id || decision?.kind || "decision"}:${s.day}:${choice}`) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    return (h % 1000) / 1000;
  }
  function contextualChoiceScore(s, decision, choice) {
    const pc = s.mode === "player" ? Career.init(s).playerCareer : null;
    const personality = Personality?.init?.(s);
    const traits = personality?.traits || {};
    const reputations = personality?.reputation || {};
    const effects = Personality?.effectsFor?.(decision?.id || decision?.kind, choice) || { traits:{}, reputation:{} };
    let score = 0;
    for (const [key, delta] of Object.entries(effects.traits || {})) score += Number(delta || 0) * (Number(traits[key] ?? 50) - 50) / 8;
    for (const [key, delta] of Object.entries(effects.reputation || {})) score += Number(delta || 0) * (Number(reputations[key] ?? 50) - 50) / 12;
    const created = s.creation?.personality || "balanced", style = String(s.person?.style || s.creation?.style || "").toLowerCase();
    const profileBias = {
      professional:/work|focus|protect|calm|quiet|private|reorganize|gradual|rest|leave/,
      ambitious:/bold|moment|career|demand|extra|confident|open_doors|share/,
      charismatic:/social|fans|community|support|campaign|participate|charity|media/,
      leader:/team|support|community|private_talk|motivation|thank/,
    }[created];
    if (profileBias?.test(String(choice))) score += 24;
    if (/técn|tecn|criativ/.test(style) && /work|focus|reorganize|extra/.test(String(choice))) score += 3;
    const condition = Number(s.person?.condition ?? 70), fatigue = Number(s.person?.physical?.fatigue || 0), morale = Number(s.person?.morale ?? 70), stress = Number(s.stress || 0), family = Number(s.family ?? 60), coach = Number(pc?.coachTrust ?? 50);
    const id = String(choice);
    if (/visit|family|call/.test(id)) score += (65-family) * .35 + (stress-45) * .15;
    if (/work|focus|extra|reorganize/.test(id)) score += (condition-55) * .18 + (coach-50) * .08;
    if (/rest|quiet|private|protect|leave|postpone|reschedule/.test(id)) score += (65-condition) * .28 + fatigue * .12 + (stress-50) * .18;
    if (/bold|moment|campaign|social|fans|public|share|confident/.test(id)) score += (Number(s.reputation || 0)-40) * .12 + (morale-50) * .08 - Math.max(0,stress-70) * .2;
    if (/humble|calm|team|support|charity|clarify|thank/.test(id)) score += (Number(traits.humility ?? 50)-50) * .18 + (Number(traits.teamOrientation ?? 50)-50) * .12;
    if (id === "hire" && Number(s.wallet || 0) < 900) score -= 100;
    return score + stableChoiceNoise(s, decision, choice);
  }
  function contextualChoice(s, decision, choices) {
    return choices.slice().sort((a,b) => contextualChoiceScore(s,decision,b[0] ?? b.id)-contextualChoiceScore(s,decision,a[0] ?? a.id) || String(a[0] ?? a.id).localeCompare(String(b[0] ?? b.id)))[0];
  }
  function autoResolveRenewal(s) {
    // Renovacoes e contrapropostas nunca sao decididas pela simulacao.
    return false;
  }
  function autoResolveOffers(s) {
    // Transferencias, emprestimos e acordos futuros pertencem sempre ao jogador.
    return false;
  }
  function autoResolveInterviews(s) {
    if (s.mode !== "player") return false;
    let changed = false;
    for (const interview of (Career.init(s).communications?.interviews || []).filter(i => !i.answered && i.choices?.length)) {
      const choices = interview.choices.map(c => [c.id,c.label]);
      const picked = contextualChoice(s,{id:"interview",kind:"interview"},choices);
      Career.respondInterview(s,interview.id,picked[0]);
      log(s,"Decisão automática · Entrevista",`${interview.title || interview.question || "Entrevista"} · Escolha: ${picked[1]}.`);
      changed = true;
    }
    return changed;
  }
  function autoResolveCommercial(s) {
    if (s.mode !== "player" || !Commercial) return false;
    const commercial = Commercial.init(s,API), personality = Personality?.init?.(s), traits = personality?.traits || {};
    let changed = false;
    for (const proposal of (commercial.proposals || []).filter(p => p.status === "PROPOSTA" && p.expires >= s.day)) {
      const acceptScore = Number(traits.professionalism ?? 50) + Number(traits.mediaPresence ?? 50) + Number(s.reputation || 0) - Number(s.stress || 0) - Math.max(0,55-Number(s.person?.condition ?? 70));
      try {
        if (acceptScore >= 80) Commercial.accept(s,proposal.id,Career,API);
        else Commercial.reject(s,proposal.id,Career,API);
      } catch (_) { try { Commercial.reject(s,proposal.id,Career,API); } catch (_) {} }
      log(s,"Decisão automática · Comercial",`${proposal.brand} · ${acceptScore >= 80 ? "proposta aceita" : "proposta recusada"}.`);
      changed = true;
    }
    for (const event of (commercial.events || []).filter(e => ["AGENDADO","REAGENDADO"].includes(e.status) && e.day <= s.day + 1)) {
      const tired = Number(s.person?.condition ?? 70) < 52 || Number(s.person?.physical?.fatigue || 0) > 70;
      const choice = tired && (event.reschedules || 0) < 2 ? "reschedule" : tired && !event.mandatory ? "decline" : "participate";
      try { Commercial.eventAction(s,event.id,choice,Career,API); log(s,"Decisão automática · Compromisso",`${event.brand} · ${choice === "participate" ? "presença confirmada" : choice === "reschedule" ? "evento reagendado" : "participação recusada"}.`); changed = true; } catch (_) {}
    }
    return changed;
  }
  function autoSeasonActions(s) {
    if (s.mode === "player") {
      autoResolveInterviews(s);
      autoResolveCommercial(s);
      // A simulação não substitui as preferências de treino escolhidas pelo jogador.
    }
    autoResolveDecision(s);
  }
  function simulateAdvance(s, mode = "nextMatch") {
    Career.init(s);
    const segmentStartDay = s.day;
    const longMode = mode === "30days" || mode === "season";
    const resumable = longMode && s.simulationPlan?.mode === mode && s.simulationPlan.targetDay > s.day;
    const startDay = resumable ? s.simulationPlan.startDay : s.day;
    const startSeason = resumable ? s.simulationPlan.startSeason : s.season;
    const initialCommitment = nextCommitment(s);
    let targetDay;
    if (mode === "nextMatch") {
      if (!initialCommitment || initialCommitment.date <= s.day) throw Error("Não há próximo jogo agendado.");
      targetDay = initialCommitment.date;
    } else if (mode === "nextCommitment") {
      if (!initialCommitment || initialCommitment.date <= s.day) throw Error("Não há próximo compromisso agendado.");
      targetDay = Math.max(s.day, initialCommitment.date - 1);
    } else if (mode === "30days") targetDay = resumable ? s.simulationPlan.targetDay : s.day + 30;
    else if (mode === "season") targetDay = resumable ? s.simulationPlan.targetDay : (Math.floor(s.day / 365) + 1) * 365;
    else throw Error("Tipo de simulação inválido.");
    let stop = null;
    const automatic = longMode;
    if (!automatic) stop = callupBlocker(s);
    if (automatic) s.simulationPlan = { mode,startDay,startSeason,targetDay };
    if (automatic) {
      stop = contractualSimulationBlocker(s);
      if (!stop) autoSeasonActions(s);
    }
    while (!stop && s.day < targetDay && (mode !== "season" || s.season === startSeason)) {
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
      if (automatic) {
        stop = simulationBlocker(s,before,{contractOnly:true});
        if (!stop) autoSeasonActions(s);
      }
      else {
        stop = simulationBlocker(s, before);
        if (stop) break;
      }
    }
    const completed = mode === "season" ? s.season !== startSeason : s.day >= targetDay;
    const result = { mode, startDay, segmentStartDay, endDay: s.day, days: s.day - startDay, segmentDays:s.day-segmentStartDay, remainingDays:Math.max(0,targetDay-s.day), completed, stop, automatic };
    if (automatic && completed) delete s.simulationPlan;
    s.lastSimulation = result;
    if (stop) log(s, "Simulação pausada", stop.message);
    else if (mode === "nextCommitment") log(s, "Próximo compromisso preparado", `A carreira avançou ${result.days} dia(s) e parou antes do próximo compromisso.`);
    else if (mode === "nextMatch") log(s, "Próximo jogo alcançado", `A carreira avançou ${result.days} dia(s) até o próximo compromisso.`);
    else if (mode === "30days") log(s, "Simulação concluída", `A carreira avançou ${result.days} dia(s).`);
    else if (completed) log(s, "Temporada simulada", `A temporada ${startSeason} foi processada até o encerramento com decisões automáticas.`);
    return result;
  }
  function seasonCompetitionCatalog(s) {
    return SeasonCompetitionCenter?.catalog(s, API) || [];
  }
  function seasonCompetitionOverview(s, competitionId) {
    return SeasonCompetitionCenter?.overview(s, competitionId, API) || null;
  }
  function seasonCalendarEvents(s, fromDay, toDay, filters = {}) {
    return SeasonCompetitionCenter?.calendarEvents(s, fromDay, toDay, filters, API) || [];
  }
  function advanceToDay(s, targetDay, options = {}) {
    if (!Number.isInteger(targetDay)) throw Error("Data de destino inválida.");
    if (targetDay <= s.day) throw Error("A data de destino deve ser posterior ao dia atual.");
    const maxDays = Number.isInteger(options.maxDays) ? Math.max(1, Math.min(options.maxDays, 3660)) : 3660;
    if (targetDay - s.day > maxDays || targetDay > 100000) throw Error("Data de destino fora do limite permitido.");
    Career.init(s);
    const segmentStart = s.day;
    const stored = s.advanceToDayPlan;
    const resumable = stored?.targetDay === targetDay && stored.targetDay > s.day;
    const planOptions = {
      simulateMatches: options.simulateMatches !== false && options.stopBeforeNextMatch !== true,
      stopBeforeNextMatch: options.stopBeforeNextMatch === true || options.simulateMatches === false,
    };
    s.advanceToDayPlan = {
      requestedDay: targetDay,
      targetDay,
      startDay: resumable ? stored.startDay : s.day,
      options: planOptions,
    };
    let pauseReason = contractualSimulationBlocker(s);
    if (!pauseReason) autoSeasonActions(s);
    let guard = 0;
    while (!pauseReason && s.day < targetDay) {
      if (++guard > maxDays + 1) {
        pauseReason = { type:"guard", message:"Simulação interrompida pelo limite de segurança." };
        break;
      }
      if (planOptions.stopBeforeNextMatch) {
        const upcoming = nextCommitment(s);
        if (upcoming && upcoming.date <= targetDay && s.day >= upcoming.date - 1) {
          pauseReason = { type:"match", day:upcoming.date, competitionId:upcoming.competitionId, message:"Simulação pausada antes da próxima partida do personagem." };
          break;
        }
      }
      try {
        advance(s, 1);
      } catch (error) {
        pauseReason = { type:"error", message:error?.message || "Falha ao avançar a carreira." };
        break;
      }
      pauseReason = contractualSimulationBlocker(s);
      if (!pauseReason) autoSeasonActions(s);
    }
    const completed = s.day === targetDay;
    if (completed) delete s.advanceToDayPlan;
    const result = {
      requestedDay: targetDay,
      reachedDay: s.day,
      daysAdvanced: s.day - segmentStart,
      completed,
      paused: !completed,
      pauseReason: completed ? null : pauseReason,
      pendingTargetDay: completed ? null : targetDay,
    };
    s.lastAdvanceToDay = result;
    if (pauseReason) log(s,"Simulação por data pausada",pauseReason.message);
    else log(s,"Simulação por data concluída",`A carreira avançou até o dia ${targetDay}.`);
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
    Life?.sanitizeDecision?.(s);
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
    WorldClubCompetitions,
    ClubIntelligence,
    CoachCareer,
    OffField,
    WorldStats,
    Continental,
    NationalCallups,
    WorldLiveMarket,
    SeasonCompetitionCenter,
    log,
    Statistics,
    Squad,
    Life,
    Commercial,
    UnexpectedEvents,
    Physical,
    GlobalFootball,
    InternationalPool,
    NationalTeam,
    schedule,
    migrateWorld,
    VERSION,
    Random,
    positionNeed,
    weightedCareerOffers,
    careerClubPool,
    create,
    advance,
    simulateAdvance,
    advanceToDay,
    seasonCompetitionCatalog,
    seasonCompetitionOverview,
    seasonCalendarEvents,
    contractOfferOverview:(s,offerId)=>Career.contractOfferOverview(s,offerId),
    pendingActions,
    birthdayDefaults,
    birthdayTick,
    decisionSnapshot,
    applyDecisionConsequence,
    captaincy,
    preparePlayerLineup,
    disciplineState,
    disciplineCompetition,
    ensureDisciplineCompetition,
    isSuspendedFor,
    recordDevelopment,
    simulate,
    stageCoachLiveResult,
    discardCoachLiveResult,
    simulateSteps,
    createCoachLiveController,
    scheduleCoachActions,
    coachActionPlan,
    selected,
    overall,
    playerDevelopment: root.ProLifePlayerDevelopment,
    dynamicPotential: root.ProLifeDynamicPotential,
    currentOverall: (state, player, context = {}) => {
      const calculator = root.ProLifeCurrentOverall;
      if (!calculator || typeof calculator.currentOverall !== "function") {
        throw Error("Modulo de GER atual indisponivel.");
      }
      return calculator.currentOverall(state, player, {
        ...context,
        baseOverall: overall
      });
    },
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
    matchImportance,
    nextCommitment,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.ProLife = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
