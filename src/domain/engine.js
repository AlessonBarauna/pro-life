/* PRO LIFE — pure domain. No DOM, network or storage. */
(function (root) {
  "use strict";
  const Character =
    root.ProLifeCharacter ||
    (typeof require === "function" ? require("./character.js") : null);
  const Career =
    root.ProLifeCareer ||
    (typeof require === "function" ? require("./career.js") : null);
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
  const Statistics =
    root.ProLifeStatistics ||
    (typeof require === "function" ? require("./statistics.js") : null);
  const Life =
    root.ProLifeLife ||
    (typeof require === "function" ? require("./life.js") : null);
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
    return Math.round(attrs.reduce((n, k) => n + p.attrs[k], 0) / 6);
  }
  function player(rng, id, level, pos) {
    const a = {};
    attrs.forEach((k) => (a[k] = clamp(level + rng.int(-13, 13), 20, 91)));
    a[pos === "ATA" ? "finish" : pos === "MEI" ? "pass" : "defense"] += 5;
    Training?.expand(a);
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
      base = profile === "prodigy" ? 54 : profile === "promise" ? 46 : 40;
    const a = {};
    attrs.forEach(
      (k) => (a[k] = base + clamp(Number(config.points?.[k]) || 0, 0, 20)),
    );
    Training?.expand(a);
    const points = attrs.reduce((n, k) => n + a[k] - base, 0);
    if (points > 30) throw Error("Distribua no máximo 30 pontos.");
    const person = {
      id: "hero",
      name: String(config.name || "Alesson Rodrigues")
        .trim()
        .slice(0, 60),
      city: String(config.city || "Mogi das Cruzes").slice(0, 60),
      nationality: "Brasil",
      age: clamp(
        Number(config.age) || (mode === "coach" ? 35 : 16),
        mode === "coach" ? 25 : 14,
        mode === "coach" ? 65 : 35,
      ),
      pos: ["GOL", "DEF", "MEI", "ATA"].includes(config.pos)
        ? config.pos
        : "MEI",
      attrs: a,
      condition: 100,
      morale: 70,
      discipline: 70,
      potential: rng.int(profile === "prodigy" ? 85 : 65, 96),
      injury: 0,
      goals: 0,
      minutes: 0,
      appearance: Character.normalize(config.appearance),
      height: clamp(Number(config.height) || 178, 150, 210),
      weight: clamp(Number(config.weight) || 72, 45, 120),
      foot: config.foot === "left" ? "left" : "right",
      style: config.style || "Técnico",
      celebration: config.celebration || "Braços abertos",
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
      reputation: mode === "coach" ? 35 : 15,
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
    Training?.init(s);
    Statistics?.init(s);
    Competitions?.init(s);
    Life?.init(s);
    let candidates = clubs.filter((c) => mode === "coach" || c.structure < 70);
    s.offers = candidates.slice(0, 3).map((c, i) => ({
      clubId: c.id,
      salary: s.salary + i * 400,
      role:
        mode === "coach"
          ? "Treinador principal"
          : i === 0
            ? "Base e integração gradual"
            : "Disputa por espaço",
      expires: 30,
    }));
    if (config.clubId && clubs.some((c) => c.id === config.clubId))
      join(s, config.clubId, s.salary);
    log(
      s,
      "Sua história começa",
      "Analise estrutura, concorrência e salário antes de escolher seu clube.",
    );
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
  function join(s, id, salary) {
    if (!Career.windowStatus(s).open)
      throw Error(
        "Janela de transferências fechada. Aguarde a próxima abertura.",
      );
    if (!Career.canTransfer(s))
      throw Error(
        "Você já assinou nesta janela. Aguarde a próxima janela para trocar de clube.",
      );
    const previous = club(s);
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
    s.careerTransferAvailableDay = Career.nextWindowDay(s.day);
    s.salary = salary;
    s.contract = 365;
    s.offers = [];
    s.board = 65;
    Career.transfer(s, s.person, previous, next, 0);
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
    const active = c.roster.filter((p) => !p.injury && p.condition > 35);
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
  function simulate(home, away, rng) {
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
      date: 0,
    };
    const squads = [hp, ap],
      clubs = [home, away],
      fatigue = [0, 0];
    for (let minute = 1; minute <= 94; minute++) {
      const control = squads.map(
        (ps, i) =>
          quality(ps, "pass") +
          quality(ps, "stamina") * 0.2 +
          (i === 0 ? 3 : 0) +
          (clubs[i].tactic === "possession" ? 5 : 0) -
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
      fatigue[i] += 0.07;
      const attack =
        quality(ps, "pace") * 0.4 +
        quality(ps, "pass") * 0.6 +
        (clubs[i].tactic === "attack"
          ? 7
          : clubs[i].tactic === "counter"
            ? 2
            : 0);
      const defense =
        quality(opp, "defense") * 0.65 +
        quality(opp, "strength") * 0.35 +
        (clubs[j].tactic === "counter"
          ? 8
          : clubs[j].tactic === "attack"
            ? -6
            : 0);
      if (rng.next() < clamp(0.2 + (attack - defense) / 650, 0.12, 0.29)) {
        m.shots[i]++;
        const shooter = rng.pick(
          ps.filter((p) => p.pos !== "GOL").length
            ? ps.filter((p) => p.pos !== "GOL")
            : ps,
        );
        if (!shooter) continue;
        const shotXg = clamp(
          0.045 + rng.next() * 0.18 + (attack - defense) / 1600,
          0.025,
          0.32,
        );
        m.xg[i] += shotXg;
        const finish =
            shooter.attrs.finish * (0.7 + (0.3 * shooter.condition) / 100),
          keeper = opp.find((p) => p.pos === "GOL");
        const onTarget = rng.next() < clamp(0.28 + finish / 220, 0.3, 0.72);
        if (onTarget) m.target[i]++;
        const conversion = clamp(
          shotXg *
            (0.9 + finish / 500) *
            (1 - ((keeper?.attrs.defense || 50) - 50) / 500),
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
          m.events.push({
            minute,
            type: "goal",
            side: i,
            player: shooter.name,
            playerId: shooter.id,
            assistPlayerId: rng.next() < 0.7 ? rng.pick(ps.filter((p) => p.id !== shooter.id))?.id : undefined,
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
            text: "Defesa importante de " + (keeper?.name || "goleiro") + ".",
          });
      }
      if (rng.next() < 0.012 && ps.length) {
        let p = rng.pick(ps);
        if (rng.next() > p.discipline / 120)
          m.events.push({
            minute,
            type: "yellow",
            side: i,
            player: p.name,
            text: p.name + " recebeu cartão amarelo.",
          });
      }
      if (rng.next() < 0.0018 && ps.length) {
        let p = rng.pick(ps);
        p.injury = rng.int(3, 25);
        m.events.push({
          minute,
          type: "injury",
          side: i,
          text: p.name + " sofreu uma lesão (" + p.injury + " dias).",
        });
        const sub = clubs[i].roster.find(
          (x) => !ps.includes(x) && !x.injury && x.pos === p.pos,
        );
        if (sub) {
          ps[ps.indexOf(p)] = sub;
          m.participants[i].push(sub.id);
        }
      }
    }
    [hp, ap].forEach((ps, i) =>
      ps.forEach((p) => {
        p.condition = clamp(p.condition - rng.int(15, 28), 0, 100);
        p.minutes += 90;
        m.ratings[p.id] = +clamp(
          6 +
            (i === 0 ? m.hg - m.ag : m.ag - m.hg) * 0.2 +
            rng.next() * 0.8 +
            m.events.filter((e) => e.playerId === p.id && e.type === "goal")
              .length *
              0.8,
          3,
          10,
        ).toFixed(1);
      }),
    );
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
          b.stats.gf - b.stats.ga - (a.stats.gf - a.stats.ga) ||
          b.stats.gf - a.stats.gf,
      );
  }
  function playRound(s, rng) {
    const pairs = s.fixtures[s.round];
    if (!pairs) return;
    for (const [h, a] of pairs) {
      let hc = club(s, h),
        ac = club(s, a);
      if (s.mode === "player" && s.clubId) {
        let c = club(s);
        c.lineup = c.roster
          .filter((p) => !p.injury)
          .slice()
          .sort(
            (a, b) => overall(b) + b.morale / 20 - overall(a) - a.morale / 20,
          )
          .slice(0, 10)
          .map((p) => p.id);
        let g = c.roster.find((p) => p.pos === "GOL" && !p.injury);
        if (g && !c.lineup.includes(g.id)) c.lineup.push(g.id);
        const hero = s.person;
        if (
          !hero.injury &&
          hero.condition > 65 &&
          !c.lineup.includes("hero") &&
          rng.next() <
            clamp(0.18 + (overall(hero) - c.structure) / 140, 0.08, 0.45)
        ) {
          const replace = c.lineup.findIndex(
            (id) => c.roster.find((p) => p.id === id)?.pos === hero.pos,
          );
          if (replace >= 0) c.lineup[replace] = "hero";
        }
      }
      const m = simulate(hc, ac, rng);
      m.date = s.day;
      m.round = s.round + 1;
      m.season = s.season;
      m.leagueId = hc.leagueId;
      s.matches.unshift(m);
      Statistics?.recordMatch(s, m);
      [hc, ac].forEach((c, i) => {
        let gf = i ? m.ag : m.hg,
          ga = i ? m.hg : m.ag,
          t = c.stats;
        t.played++;
        t.gf += gf;
        t.ga += ga;
        if (gf > ga) {
          t.w++;
          t.points += 3;
        } else if (gf === ga) {
          t.d++;
          t.points++;
        } else t.l++;
        c.roster.forEach(
          (p) =>
            (p.morale = clamp(
              p.morale + (gf > ga ? 4 : gf < ga ? -4 : 0),
              15,
              100,
            )),
        );
      });
      if (h === s.clubId || a === s.clubId) {
        Career.match(s, m);
        const own = h === s.clubId ? m.hg : m.ag,
          other = h === s.clubId ? m.ag : m.hg;
        s.board = clamp(
          s.board + (own > other ? 5 : own < other ? -5 : 0),
          0,
          100,
        );
        s.reputation = clamp(
          s.reputation + (own > other ? 1 : own < other ? -0.4 : 0.2),
          0,
          100,
        );
        s.fans += own > other ? 60 : 10;
        log(s, hc.name + " " + m.hg + " × " + m.ag + " " + ac.name, m.summary);
        if (s.mode === "player") {
          const played = m.participants.flat().includes("hero");
          if (!played)
            log(
              s,
              "Fora da escalação",
              "O treinador priorizou outros jogadores. Treino, moral, atributos e concorrência influenciam a escolha.",
            );
        }
      }
    }
    s.round++;
    s.matches = s.matches.slice(0, 800);
  }
  function nextFixtureDay(s) {
    return (
      (s.season - 2026) * 365 + (s.calendarDays?.[s.round] ?? 7 + s.round * 21)
    );
  }
  function newSeason(s, rng) {
    Statistics?.closeSeason(s);
    Competitions?.closeSeason(s, table);
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
    s.season++;
    Competitions?.nextSeason(s);
    s.round = 0;
    s.person.age++;
    for (const c of s.clubs) {
      c.budget += 180000 + c.stats.points * 1000;
      c.stats = { points: 0, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
      for (const p of c.roster) {
        if (p.id !== "hero") p.age++;
        p.goals = 0;
        p.minutes = 0;
        if (p.age > 36 && p.id !== "hero") {
          const n = player(rng, p.id, clamp(overall(p) - 8, 35, 75), p.pos);
          n.age = 17;
          n.real = false;
          n.number = p.number || 0;
          n.nationality = "Brasil";
          Object.assign(p, n);
        }
        attrs.forEach(
          (k) =>
            (p.attrs[k] = clamp(
              p.attrs[k] +
                (p.age < 23 ? rng.int(0, 2) : p.age > 31 ? -rng.int(0, 2) : 0),
              20,
              95,
            )),
        );
      }
    }
    s.person.goals = 0;
    if (s.world === "brazil2026") {
      const lower = ["serieB", "serieC", "serieD"].map((leagueId) =>
        schedule(s.clubs.filter((c) => c.leagueId === leagueId).map((c) => c.id)),
      );
      s.fixtures = World.serieAFixtures.map((r, i) => r.map((p) => p.slice()).concat(...lower.map((rounds) => rounds[i])));
    } else s.fixtures = schedule(s.clubs.map((c) => c.id));
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
  function advance(s, days = 1) {
    Career.init(s);
    Training?.init(s);
    Statistics?.init(s);
    Competitions?.init(s);
    Life?.init(s);
    const rng = new Random(s.rng);
    for (let d = 0; d < clamp(days, 1, 30); d++) {
      s.day++;
      Career.daily(s);
      s.contract = Math.max(0, s.contract - 1);
      s.offers = s.offers.filter((o) => o.expires >= s.day);
      for (const c of s.clubs)
        for (const p of c.roster) {
          p.injury = Math.max(0, p.injury - 1);
          p.condition = clamp(
            p.condition + (p.id === "hero" && s.intensity === "hard" ? 2 : 5),
            0,
            100,
          );
        }
      if (s.mode === "player" && !s.clubId) {
        s.person.injury = Math.max(0, s.person.injury - 1);
        s.person.condition = clamp(s.person.condition + 5, 0, 100);
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
          recordDevelopment(s);
          log(s, "Evolução no treino", improved.label + " melhorou com a rotina de trabalho.");
        }
        if (s.intensity === "hard" && rng.next() < 0.015) {
          s.person.injury = rng.int(3, 12);
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
      if (s.day % 30 === 0) {
        if (s.clubId) Career.transaction(s, s.salary, "Salário mensal");
        Career.transaction(
          s,
          -(s.mode === "coach" ? 2000 : 650),
          "Despesas pessoais",
        );
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
        log(s, "Decisão pendente", s.decision.title);
      }
      if (s.day % 28 === 0 && Career.windowStatus(s).open)
        Career.world(s, rng, API);
      if (
        (s.day % 28 === 0 ||
          Career.windows.some((w) => w.start === s.day % 365)) &&
        Career.canTransfer(s)
      ) {
        let candidates = s.clubs
          .filter((c) => c.id !== s.clubId)
          .sort(
            (a, b) =>
              Math.abs(a.structure - (overall(s.person) + s.reputation / 3)) -
              Math.abs(b.structure - (overall(s.person) + s.reputation / 3)),
          );
        s.offers = candidates.slice(0, 3).map((c, i) => ({
          clubId: c.id,
          salary: Math.round(
            (s.mode === "coach" ? 7000 : 1000) + s.reputation * 60 + i * 250,
          ),
          role:
            s.mode === "coach"
              ? "Projeto de reconstrução"
              : "Contrato com disputa por posição",
          expires: s.day + 21,
        }));
        log(
          s,
          "Mercado de trabalho",
          "Três clubes demonstram interesse. As propostas expiram em 21 dias.",
        );
      }
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
  function decide(s, choice) {
    if (!s.decision || !s.decision.choices.some((c) => c[0] === choice))
      throw Error("Decisão inválida.");
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
    Life?.decide(s, choice, Career);
    if (s.decision.id === "media") Career.interview(s, choice);
    log(
      s,
      "Escolha registrada",
      s.decision.choices.find((c) => c[0] === choice)[1],
    );
    s.decision = null;
  }
  function retire(s) {
    if (s.mode !== "player" || s.person.age < 30)
      throw Error("A transição está disponível a partir dos 30 anos.");
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
    join(s, id, s.salary);
    log(
      s,
      "Novo universo brasileiro",
      "Sua carreira e patrimônio foram preservados. A temporada agora usa as Séries A e B da base 2026. Os relatórios da antiga liga ficam resumidos no diário e no histórico.",
    );
  }
  const API = {
    Career,
    World,
    BrazilData,
    Competitions,
    Training,
    Statistics,
    Life,
    schedule,
    migrateWorld,
    VERSION,
    Random,
    create,
    advance,
    recordDevelopment,
    simulate,
    selected,
    overall,
    table,
    club,
    join,
    decide,
    retire,
    attrs,
    labels,
    clamp,
    nextFixtureDay,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.ProLife = API;
})(typeof globalThis !== "undefined" ? globalThis : this);
