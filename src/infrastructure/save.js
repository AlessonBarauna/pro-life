(function (root) {
  "use strict";
  const KEY = "prolife.v1.save";
  const SLOTS_KEY = "prolife.v1.slots";
  const ACTIVE_KEY = "prolife.v1.activeSlot";
  const SLOT_PREFIX = "prolife.v1.slot.";
  const ExpansionValidator =
    root.ProLifeValidateExpansion ||
    (typeof require === "function" ? require("./validate-expansion.js") : null);
  const StatsCompact =
    root.ProLifeStatisticsCompact ||
    (typeof require === "function" ? require("../domain/statistics-compact.js") : null);
  const SPARSE_STATS = "PRO_LIFE_STATS_SPARSE_1";
  const GlobalFootball =
    root.ProLifeGlobalFootball ||
    (typeof require === "function" ? require("../domain/global-football.js") : null);
  function validate(s) {
    const fail = () => {
      throw Error("Arquivo de save inválido ou incompatível.");
    };
    const num = (v, a, b) =>
      typeof v === "number" && Number.isFinite(v) && v >= a && v <= b;
    const str = (v, n = 200) => typeof v === "string" && v.length <= n;
    const player = (p) =>
      p &&
      str(p.id, 80) &&
      str(p.name, 60) &&
      num(p.age, 14, 150) &&
      ["GOL", "DEF", "MEI", "ATA"].includes(p.pos) &&
      p.attrs &&
      ["pace", "finish", "pass", "defense", "strength", "stamina"].every((k) =>
        num(p.attrs[k], 0, 100),
      ) &&
      Object.values(p.attrs).every((v) => num(v, 0, 100)) &&
      num(p.condition, 0, 100) &&
      num(p.morale, 0, 100) &&
      num(p.injury, 0, 10000) &&
      num(p.goals, 0, 1000000) &&
      num(p.minutes, 0, 10000000) &&
      num(p.discipline, 0, 100) &&
      num(p.potential, 0, 100);
    // Saves com XP de partida acumulado acima do limite histórico são normalizados em vez de descartados.
    if (s && typeof s.trainingProgress === "number" && Number.isFinite(s.trainingProgress) && s.trainingProgress > 100) s.trainingProgress = 100;
    if (
      !s ||
      s.version !== 1 ||
      !["player", "coach"].includes(s.mode) ||
      !player(s.person) ||
      !num(s.day, 0, 100000) ||
      !num(s.season, 2026, 2300) ||
      !num(s.rng, 0, 4294967295) ||
      !num(s.round, 0, 38) ||
      !num(s.wallet, -1e10, 1e10) ||
      !num(s.salary, 0, 1e9) ||
      !num(s.contract, 0, 10000) ||
      !num(s.reputation, 0, 100) ||
      !num(s.board, 0, 100) ||
      !num(s.stress, 0, 100) ||
      !num(s.family, 0, 100) ||
      !num(s.fans, 0, 1e9) ||
      !num(s.trainingProgress, 0, 100) ||
      !["C", "B", "A", "PRO", "Sem licença"].includes(s.license) ||
      !["rest", "normal", "hard"].includes(s.intensity) ||
      ![
        "balanced",
        "pace",
        "finish",
        "pass",
        "defense",
        "strength",
        "stamina",
        "acceleration", "sprint", "agility", "powerShot", "finesseShot", "longShot", "freeKick", "penalty",
        "heading", "jumping", "longPass", "vision", "crossing", "technique", "dribbling", "ballControl",
        "tackling", "interception", "balance", "positioning", "composure",
      ].includes(s.training)
    )
      fail();
    if (
      !Array.isArray(s.clubs) ||
      ![8, 40, 80].includes(s.clubs.length) ||
      new Set(s.clubs.map((c) => c.id)).size !== s.clubs.length
    )
      fail();
    const legacy = s.clubs.length === 8;
    if (s.world === undefined && legacy) s.world = "legacy";
    if (
      !["legacy", "brazil2026"].includes(s.world) ||
      legacy !== (s.world === "legacy")
    )
      fail();
    if (s.leagues === undefined && legacy)
      s.leagues = [{ id: "horizonte", name: "Liga Horizonte" }];
    if (
      !Array.isArray(s.leagues) ||
      s.leagues.length !== (legacy ? 1 : s.clubs.length === 80 ? 4 : 2) ||
      !s.leagues.every((l) => str(l.id, 30) && str(l.name, 100)) ||
      new Set(s.leagues.map((l) => l.id)).size !== s.leagues.length
    )
      fail();
    const expected = legacy ? ["horizonte"] : s.clubs.length === 80 ? ["serieA", "serieB", "serieC", "serieD"] : ["serieA", "serieB"];
    if (
      !expected.every((id) => s.leagues.some((l) => l.id === id)) ||
      !expected.every(
        (id) =>
          s.clubs.filter(
            (c) => (c.leagueId || (legacy ? "horizonte" : "")) === id,
          ).length === (legacy ? 8 : 20),
      )
    )
      fail();
    if (!s.clubs.every((c) => /^c([0-9]|[1-7][0-9])$/.test(c.id))) fail();
    if (![s.day, s.season, s.round].every(Number.isInteger)) fail();
    const allIds = [];
    for (const c of s.clubs) {
      if (legacy && c.leagueId === undefined) c.leagueId = "horizonte";
      if (!s.leagues.some((l) => l.id === c.leagueId)) fail();
      if (
        !str(c.id, 80) ||
        !str(c.name, 60) ||
        !str(c.city, 60) ||
        !/^#[a-fA-F0-9]{6}$/.test(c.color) ||
        !Array.isArray(c.roster) ||
        c.roster.length < 11 ||
        c.roster.length > 100 ||
        !c.roster.every(player) ||
        !Array.isArray(c.lineup) ||
        c.lineup.length > 11 ||
        !c.lineup.every((id) => c.roster.some((p) => p.id === id)) ||
        !num(c.budget, -1e10, 1e10) ||
        !num(c.structure, 0, 100) ||
        !["balanced", "possession", "counter", "attack"].includes(c.tactic) ||
        !c.stats ||
        !["points", "played", "w", "d", "l", "gf", "ga"].every((k) =>
          num(c.stats[k], 0, 100000),
        )
      )
        fail();
      allIds.push(...c.roster.map((p) => p.id));
    }
    GlobalFootball?.init?.(s);
    const globalClubs = s.globalFootball?.clubs || [];
    const globalIds = globalClubs.map((c) => c?.id);
    if (
      !Array.isArray(globalClubs) ||
      !globalClubs.every(
        (c) => c && str(c.id, 80) && /^gf_[a-z0-9_]+$/.test(c.id),
      ) ||
      new Set(globalIds).size !== globalIds.length
    )
      fail();
    const localClub = (id) => s.clubs.find((c) => c.id === id) || null;
    const globalClub = (id) => {
      if (!str(id, 80) || !/^gf_[a-z0-9_]+$/.test(id)) return null;
      const listed = globalClubs.find((c) => c.id === id);
      if (!listed || listed.generated === true || listed.active === false)
        return null;
      return GlobalFootball?.clubById?.(s, id) || null;
    };
    const knownClub = (id) => localClub(id) || globalClub(id);
    if (
      new Set(allIds).size !== allIds.length ||
      (s.clubId !== null && !knownClub(s.clubId))
    )
      fail();
    if (
      !Array.isArray(s.fixtures) ||
      s.fixtures.length !== (legacy ? 14 : 38) ||
      s.round > s.fixtures.length ||
      !s.fixtures.every(
        (r) =>
          Array.isArray(r) &&
          r.length === s.clubs.length / 2 &&
          new Set(r.flat()).size === s.clubs.length &&
          r.every(
            (p) =>
              Array.isArray(p) &&
              p.length === 2 &&
              p[0] !== p[1] &&
              s.clubs.find((c) => c.id === p[0])?.leagueId ===
                s.clubs.find((c) => c.id === p[1])?.leagueId &&
              p.every((id) => s.clubs.some((c) => c.id === id)),
          ),
      )
    )
      fail();
    if (s.calendarDays === undefined && legacy)
      s.calendarDays = Array.from({ length: 14 }, (_, i) => 7 + i * 21);
    if (
      !Array.isArray(s.calendarDays) ||
      s.calendarDays.length !== s.fixtures.length ||
      !s.calendarDays.every(
        (d, i) =>
          Number.isInteger(d) &&
          num(d, 1, 364) &&
          (!i || d > s.calendarDays[i - 1]),
      )
    )
      fail();
    const pairs = s.fixtures.flat().map((p) => p.join(":"));
    if (new Set(pairs).size !== pairs.length) fail();
    if (
      !Array.isArray(s.news) ||
      s.news.length > 200 ||
      !s.news.every(
        (n) =>
          str(n.title) &&
          str(n.body, 2000) &&
          num(n.day, 0, 100000) &&
          num(n.season, 2026, 2300),
      )
    )
      fail();
    if (
      !Array.isArray(s.offers) ||
      s.offers.length > 8 ||
      !s.offers.every(
        (o) =>
          knownClub(o.clubId) &&
          num(o.salary, 0, 1e9) &&
          num(o.expires, 0, 100000) &&
          str(o.role) &&
          (o.offerId === undefined || str(o.offerId,120)) &&
          (o.createdDay === undefined || num(o.createdDay,0,s.day)) &&
          (o.stage === undefined || str(o.stage,40)) &&
          (o.status === undefined || str(o.status,30)) &&
          (o.round === undefined || (Number.isInteger(o.round) && num(o.round,0,10))) &&
          (o.signingBonus === undefined || num(o.signingBonus,0,1e10)) &&
          (o.durationDays === undefined || num(o.durationDays,1,5000)),
      )
    )
      fail();
    if (
      !Array.isArray(s.matches) ||
      s.matches.length > 800 ||
      !s.matches.every(
        (m) =>
          (s.clubs.some((c) => c.id === m.home) || (m.worldMatch === true && str(m.home, 80))) &&
          (s.clubs.some((c) => c.id === m.away) || (m.worldMatch === true && str(m.away, 80))) &&
          num(m.hg, 0, 100) &&
          num(m.ag, 0, 100) &&
          num(m.possession, 0, 100) &&
          num(m.date, 0, 100000) &&
          num(m.round, 1, m.worldMatch === true ? 80 : 38) &&
          num(m.season, 2026, 2300) &&
          (m.competitionId === undefined || m.competitionId === null || str(m.competitionId, 60)) &&
          (m.competitionName === undefined || str(m.competitionName, 100)) &&
          (m.winnerId === undefined || s.clubs.some((c) => c.id === m.winnerId)) &&
          (m.penalties === undefined || (Array.isArray(m.penalties) && m.penalties.length === 2 && m.penalties.every((v) => num(v, 0, 30)))) &&
          m.ratings &&
          Object.values(m.ratings).every((v) => num(v, 0, 10)) &&
          Array.isArray(m.participants) &&
          m.participants.length === 2 &&
          m.participants.every(
            (ps) =>
              Array.isArray(ps) &&
              ps.length <= 30 &&
              ps.every((id) => str(id, 80)),
          ) &&
          Array.isArray(m.events) &&
          m.events.length < 500 &&
          m.events.every(
            (e) =>
              str(e.text, 1000) && num(e.minute, 0, 120) && num(e.side, 0, 1),
          ) &&
          ["shots", "target", "xg"].every(
            (k) =>
              Array.isArray(m[k]) &&
              m[k].length === 2 &&
              m[k].every((v) => num(v, 0, 1000)),
          ) &&
          str(m.summary, 2000),
      )
    )
      fail();
    if (
      !num(s.person.height, 150, 210) ||
      !num(s.person.weight, 45, 120) ||
      !str(s.person.city, 60) ||
      !str(s.person.style, 100) ||
      !str(s.person.celebration, 100) ||
      !["left", "right"].includes(s.person.foot)
    )
      fail();
    if (
      !Array.isArray(s.history) ||
      s.history.length > 300 ||
      !s.history.every(
        (h) =>
          num(h.season, 2026, 2300) &&
          num(h.goals, 0, 1000000) &&
          (h.event
            ? str(h.event)
            : str(h.champion) &&
              (h.position === null ||
                (Number.isInteger(h.position) && num(h.position, 1, 40))) &&
              ["coach", "player"].includes(h.mode)),
      )
    )
      fail();
    if (
      s.decision &&
      (!str(s.decision.title) ||
        !str(s.decision.body, 2000) ||
        !Array.isArray(s.decision.choices) ||
        s.decision.choices.length > 5 ||
        !s.decision.choices.every(
          (c) =>
            Array.isArray(c) &&
            c.length === 2 &&
            str(c[0], 30) &&
            str(c[1], 100),
        ))
    )
      fail();
    if (s.mode === "player" && s.clubId) {
      const c = localClub(s.clubId);
      if (c) {
        const p = c.roster.find((p) => p.id === "hero");
        if (!p || JSON.stringify(p) !== JSON.stringify(s.person)) fail();
        c.roster[c.roster.indexOf(p)] = s.person;
      } else {
        const pooledHeroes = [
          ...s.clubs.flatMap((club) => club.roster || []),
          ...(s.internationalPlayers || []),
        ].filter((p) => p?.id === "hero");
        if (
          pooledHeroes.length !== 0 ||
          s.person.id !== "hero" ||
          s.person.clubId !== s.clubId
        )
          fail();
      }
    }
    if (s.development !== undefined) {
      if (
        !Array.isArray(s.development) ||
        s.development.length > 260 ||
        !s.development.length ||
        !s.development.every(
          (e, i) =>
            e &&
            num(e.day, 0, s.day) &&
            num(e.season, 2026, s.season) &&
            num(e.overall, 0, 100) &&
            e.attrs &&
            ["pace", "finish", "pass", "defense", "strength", "stamina"].every(
              (k) => num(e.attrs[k], 0, 100),
            ) &&
            (i === 0 || e.day > s.development[i - 1].day),
        )
      )
        fail();
    } else
      s.development = [
        {
          day: s.day,
          season: s.season,
          overall: Math.round(
            ["pace", "finish", "pass", "defense", "strength", "stamina"].reduce(
              (total, key) => total + s.person.attrs[key],
              0,
            ) / 6,
          ),
          attrs: { ...s.person.attrs },
        },
      ];
    if (root.ProLifeCharacter)
      s.person.appearance = root.ProLifeCharacter.normalize(
        s.person.appearance,
      );
    if (
      s.upgradeClub !== undefined &&
      s.upgradeClub !== null &&
      (!str(s.upgradeClub, 80) ||
        s.world !== "legacy" ||
        !/^c([0-9]|[12][0-9]|3[0-9])$/.test(s.upgradeClub))
    )
      fail();
    if (s.extras !== undefined) {
      const e = s.extras,
        items = [
          "recovery",
          "bike",
          "car",
          "sportscar",
          "apartment",
          "house",
          "gym",
        ];
      if (
        !e ||
        !Number.isInteger(e.number) ||
        !num(e.number, 1, 99) ||
        !["careerGoals", "careerMinutes", "played", "ratingTotal"].every((k) =>
          num(e[k], 0, 1e8),
        ) ||
        !Array.isArray(e.assets) ||
        e.assets.length > items.length ||
        new Set(e.assets).size !== e.assets.length ||
        !e.assets.every((id) => items.includes(id))
      )
        fail();
      if (
        !Array.isArray(e.ledger) ||
        e.ledger.length > 120 ||
        !e.ledger.every(
          (t) =>
            num(t.day, 0, s.day) &&
            num(t.season, 2026, s.season) &&
            num(t.amount, -1e10, 1e10) &&
            str(t.label, 200),
        )
      )
        fail();
      if (!Array.isArray(e.feed) || e.feed.length > 160) fail();
      for (const p of e.feed) {
        if (!p || typeof p !== "object") fail();
        if (p.id === undefined) p.id = `legacy_feed_${p.day ?? s.day}_${Math.random().toString(36).slice(2, 8)}`;
        if (p.day === undefined) p.day = s.day;
        if (p.season === undefined) p.season = s.season;
        if (p.category === undefined) p.category = "Carreira";
        if (p.author === undefined) p.author = "PRO LIFE";
        if (p.title === undefined) p.title = "Atualização";
        if (p.body === undefined) p.body = "";
        if (p.kind === undefined || !["confirmed", "rumor", "story"].includes(p.kind)) p.kind = "story";
        if (p.liked === undefined) p.liked = false;
        if (p.likes === undefined) p.likes = 0;
        if (!str(p.id, 300) || !num(p.day, 0, s.day) || !num(p.season, 2026, s.season) ||
            !str(p.category, 120) || !str(p.author, 160) || !str(p.title, 300) ||
            !str(p.body, 4000) || typeof p.liked !== "boolean" || !num(p.likes, 0, 1e12)) fail();
      }
      if (
        !Array.isArray(e.transfers) ||
        e.transfers.length > 100 ||
        !e.transfers.every(
          (t) =>
            num(t.day, 0, s.day) &&
            num(t.season, 2026, s.season) &&
            str(t.player, 60) &&
            str(t.from, 60) &&
            str(t.to, 60) &&
            num(t.fee, 0, 1e10) &&
            (t.pos === undefined || str(t.pos, 10)) &&
            (t.salary === undefined || num(t.salary, 0, 1e9)),
        )
      )
        fail();
      if (e.promise !== undefined && e.promise !== null) {
        if (!e.promise || typeof e.promise !== "object") fail();
        if (e.promise.games !== undefined &&
            (!Number.isInteger(e.promise.games) || !num(e.promise.games, 1, 3))) fail();
        if (e.promise.wins !== undefined &&
            (!Number.isInteger(e.promise.wins) || !num(e.promise.wins, 0, 3))) fail();
      }
      if (
        e.postSequence !== undefined &&
        (!Number.isInteger(e.postSequence) || !num(e.postSequence, 0, 1e9))
      )
        fail();
      if (e.offerPreferences !== undefined) {
        const p = e.offerPreferences, validLeagues = ["serieA", "serieB", "serieC", "serieD"];
        if (!p || !Array.isArray(p.leagues) || p.leagues.length > 4 || new Set(p.leagues).size !== p.leagues.length || !p.leagues.every((id) => validLeagues.includes(id)) || !["any", "elite", "competitive", "intermediate", "small"].includes(p.clubLevel)) fail();
      }
      if (e.playerCareer !== undefined) {
        const pc=e.playerCareer;
        if (!pc || !num(pc.coachTrust,0,100) || !str(pc.squadRole,40) || !num(pc.marketValue,0,1e10) || !Array.isArray(pc.interests) || pc.interests.length>8 || !num(pc.negotiations,0,1000)) fail();
        if (!pc.interests.every(x=>x && str(x.clubId,20) && str(x.stage,40) && num(x.day,0,s.day) && num(x.expires,x.day,s.day+365))) fail();
        if (pc.targetClub!==undefined && pc.targetClub!==null && (!pc.targetClub || !str(pc.targetClub.clubId,20) || !num(pc.targetClub.selectedDay,0,s.day) || !pc.targetClub.assessment || !num(pc.targetClub.assessment.score,0,200) || !num(pc.targetClub.assessment.required,0,200) || !str(pc.targetClub.assessment.label,80))) fail();
        const contractOk = c => c===null || (c && str(c.clubId,20) && num(c.signedDay,0,s.day) && num(c.endDay,c.signedDay,s.day+5000) && num(c.durationDays,1,5000) && num(c.salary,0,1e9) && num(c.signingBonus,0,1e10) && str(c.role,100) && ["permanent","loan"].includes(c.type) && (c.performanceBonus===undefined || num(c.performanceBonus,0,1e10)) && (c.releaseClause===undefined || num(c.releaseClause,0,1e12)) && (c.parentClubId===undefined || str(c.parentClubId,20)) && (c.parentSalary===undefined || num(c.parentSalary,0,1e9)) && (c.parentContractRemaining===undefined || num(c.parentContractRemaining,1,5000)));
        if (!contractOk(pc.contract)) fail();
        if(pc.contractNegotiations!==undefined&&(!Array.isArray(pc.contractNegotiations)||pc.contractNegotiations.length>120||!pc.contractNegotiations.every(row=>row&&str(row.id,180)&&str(row.offerId,120)&&str(row.clubId,80)&&num(row.day,0,s.day)&&str(row.stage,40)&&Number.isInteger(row.round)&&num(row.round,0,10)&&(!row.terms||typeof row.terms==="object"))))fail();
        const r=pc.renewalOffer; if(r!==null && r!==undefined && (!r || !str(r.clubId,20) || !num(r.salary,0,1e9) || !num(r.durationDays,1,5000) || !num(r.signingBonus,0,1e10) || !num(r.expires,s.day,s.day+365))) fail();
        const mp=pc.mediaProfile; if(mp!==undefined && (!mp || !str(mp.image,40) || !num(mp.pressure,0,100) || !num(mp.fanSentiment,0,100) || !num(mp.sponsorAppeal,0,100) || !Number.isInteger(mp.interviews) || !num(mp.interviews,0,10000) || !Number.isInteger(mp.controversies) || !num(mp.controversies,0,10000))) fail();
      }
    } else if (root.ProLife?.Career) root.ProLife.Career.init(s);
    if (
      s.careerTransferAvailableDay !== undefined &&
      (!Number.isInteger(s.careerTransferAvailableDay) ||
        !num(s.careerTransferAvailableDay, 0, 100365))
    )
      fail();
    if (root.ProLife?.Career) root.ProLife.Career.init(s);
    ExpansionValidator?.validate(s, fail);
    return s;
  }
  function detectSaveFormat(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return "invalid";
    }

    if (
      value.format === "PRO_LIFE_HYBRID" &&
      (value.version === 1 || value.version === 2)
    ) {
      return "compact";
    }

    if (
      value.format !== undefined ||
      value.version !== 1
    ) {
      return "invalid";
    }

    return "legacy";
  }

  // Cache da base reconstruida (create() e caro). Chave: mundo|modo|seed.
  let baseCache = { key: "", base: null };
  function baseCatalogFor(st) {
    const engine = root.ProLife;
    if (!engine || typeof engine.create !== "function") throw Error("Engine indisponivel para reconstruir o save.");
    if (!Number.isSafeInteger(st?.initialSeed)) throw Error("Seed original ausente ou invalida.");
    // 34F.12: a base depende da versao do catalogo; versao desconhecida nao compacta (o save completo continua valido).
    const version = st.catalogVersion === undefined || st.catalogVersion === null ? "legacy" : st.catalogVersion;
    if (version !== "legacy" && version !== "fc27_v1") throw Error("Versao de catalogo sem reconstrucao suportada.");
    const key = [st.world, st.mode, st.initialSeed, version].join("|");
    if (baseCache.key !== key) {
      const fresh = engine.create({ world: st.world, mode: st.mode, name: "Reconstrucao", age: 22, pos: "ATA", clubId: "c0", ...(version === "fc27_v1" ? { catalogVersion: version } : {}) }, st.initialSeed);
      baseCache = { key, base: fresh.internationalPlayers, prepared: null, fp: null };
    }
    return baseCache.base;
  }
  // 34F.17: JSON por registro e impressao digital da base, calculados uma vez por base em cache (a base nao e alterada).
  function basePrepared(base, codec) {
    if (baseCache.base !== base) return null;
    if (!baseCache.prepared && typeof codec.prepareBase === "function") baseCache.prepared = codec.prepareBase(base);
    return baseCache.prepared;
  }
  function baseFingerprint(base, codec) {
    if (baseCache.base !== base) return codec.fingerprint(base);
    if (baseCache.fp === null || baseCache.fp === undefined) baseCache.fp = codec.fingerprint(base);
    return baseCache.fp;
  }

  // Modo de escrita compacta: "off" (padrao), "onQuota" (so se a gravacao completa falhar) ou "always".
  // Desligado por padrao: a reconstrucao depende do catalogo do codigo; apos uma atualizacao que mude o
  // catalogo o save compacto deixa de abrir (e preservado, mas so abre com a versao compativel).
  const COMPACT_MODE_KEY = "prolife.v1.compactWrite";
  let compactModeOverride = null;
  function compactWriteMode() {
    const v = compactModeOverride ?? (() => { try { return localStorage.getItem(COMPACT_MODE_KEY); } catch { return null; } })();
    return v === "always" || v === "onQuota" ? v : "off";
  }
  function setCompactWriteMode(mode) {
    if (!["off", "onQuota", "always"].includes(mode)) return false;
    compactModeOverride = mode;
    return true;
  }

  // Envelope v1: estatisticas completas. Envelope v2: igual, com `statsFormat` e estatisticas esparsas
  // (so na serializacao; o estado em memoria continua completo).
  function encodeHybridSave(s, opts) {
    const sparse = !!(opts && opts.sparseStats);
    const codec = root.ProLifeCompactSave;
    if (!codec || typeof codec.delta !== "function") throw Error("Codec compacto indisponivel.");
    if (!Array.isArray(s?.internationalPlayers)) throw Error("Sem catalogo internacional para compactar.");
    const base = baseCatalogFor(s);
    const { internationalPlayers, ...rest } = s;
    let stateOut = rest;
    if (sparse) {
      if (!StatsCompact || typeof StatsCompact.compact !== "function") throw Error("Codec de estatisticas indisponivel.");
      if (!rest.statistics || typeof rest.statistics !== "object") throw Error("Sem estatisticas para compactar.");
      stateOut = { ...rest, statistics: StatsCompact.compact(rest.statistics) };
      // Verificacao antes de gravar: expandir o esparso precisa equivaler a expandir o completo.
      if (JSON.stringify(StatsCompact.expand(JSON.parse(JSON.stringify(stateOut.statistics)))) !== JSON.stringify(StatsCompact.expand(rest.statistics))) throw Error("Verificacao das estatisticas compactas falhou.");
    }
    const prepared = typeof codec.deltaFast === "function" && typeof codec.verifyFast === "function" ? basePrepared(base, codec) : null;
    let patch;
    if (prepared) {
      // 34F.17: caminho rapido (mesmo envelope e mesma verificacao de ida e volta, sem reserializar a base inteira).
      const r = codec.deltaFast(prepared, base, internationalPlayers);
      patch = r.patch;
      if (!codec.verifyFast(prepared, patch, r.currentJson)) throw Error("Verificacao do save compacto falhou.");
    } else {
      patch = codec.delta(base, internationalPlayers);
      // Verificacao antes de gravar: a reconstrucao precisa ser identica ao estado atual.
      const back = codec.restore(base, patch);
      if (JSON.stringify(back) !== JSON.stringify(internationalPlayers)) throw Error("Verificacao do save compacto falhou.");
    }
    const value = { format: "PRO_LIFE_HYBRID", version: sparse ? 2 : 1, ...(sparse ? { statsFormat: SPARSE_STATS } : {}), state: stateOut, delta: patch, fingerprint: baseFingerprint(base, codec) };
    return JSON.stringify(value);
  }

  function decodeHybridSave(value) {
    const format = detectSaveFormat(value);

    if (format === "legacy") {
      return validate(value);
    }

    if (format !== "compact") {
      throw Error("Formato de save desconhecido.");
    }

    const codec = root.ProLifeCompactSave;

    if (!codec || typeof codec.restore !== "function" ||
        typeof codec.fingerprint !== "function") {
      throw Error("Codec compacto indisponivel.");
    }

    if (!value.state || !value.delta ||
        !Array.isArray(value.delta.changes) ||
        !Array.isArray(value.delta.removed) ||
        !Array.isArray(value.delta.order) ||
        typeof value.fingerprint !== "string") {
      throw Error("Save compacto incompleto.");
    }

    const engine = root.ProLife;

    if (!engine || typeof engine.create !== "function") {
      throw Error("Engine indisponivel para reconstruir o save.");
    }

    if (!Number.isSafeInteger(value.state.initialSeed)) {
      throw Error("Seed original ausente ou invalida.");
    }

    const base = baseCatalogFor(value.state);

    if (baseFingerprint(base, codec) !== value.fingerprint) {
      throw Error("Catalogo internacional incompat\u00edvel. Save preservado.");
    }

    let state = value.state;
    if (value.version === 2) {
      if (value.statsFormat !== SPARSE_STATS) throw Error("Formato de estatisticas desconhecido. Save preservado.");
      if (!StatsCompact || typeof StatsCompact.expand !== "function") throw Error("Codec de estatisticas indisponivel.");
      const st = state.statistics;
      if (!st || typeof st !== "object" || Array.isArray(st) || !st.players || typeof st.players !== "object" || Array.isArray(st.players)) throw Error("Estatisticas compactas malformadas.");
      const okRow = (row, maps) => {
        if (!row || typeof row !== "object" || Array.isArray(row)) return false;
        for (const f of StatsCompact.FIELDS) if (row[f] !== undefined && !(typeof row[f] === "number" && Number.isFinite(row[f]) && row[f] >= 0)) return false;
        if (!maps) return true;
        for (const k of ["byCompetition", "byClub"]) {
          if (row[k] === undefined) continue;
          if (!row[k] || typeof row[k] !== "object" || Array.isArray(row[k])) return false;
          for (const sub of Object.values(row[k])) if (!okRow(sub, false)) return false;
        }
        return true;
      };
      for (const row of Object.values(st.players)) if (!okRow(row, true)) throw Error("Estatisticas compactas malformadas.");
      state = { ...state, statistics: StatsCompact.expand(st) };
    } else if (value.statsFormat !== undefined) throw Error("Formato de estatisticas inesperado no envelope v1.");

    const prepared = typeof codec.restoreFast === "function" ? basePrepared(base, codec) : null;
    const restored = {
      ...state,
      internationalPlayers: prepared ? codec.restoreFast(prepared, value.delta) : codec.restore(base, value.delta)
    };

    return validate(restored);
  }

  function parse(text) {
    if (typeof text !== "string")
      throw Error("Arquivo de save inv?lido ou incompat?vel.");
    return decodeHybridSave(JSON.parse(text));
  }
  const stateSlotBindings = new WeakMap();

  function bindStateToSlot(state, slotId) {
    if (!state || typeof state !== "object" ||
        typeof slotId !== "string" || !slotId) {
      return false;
    }

    stateSlotBindings.set(state, slotId);
    return true;
  }

  function stateSlotId(state) {
    if (!state || typeof state !== "object") return null;
    return stateSlotBindings.get(state) || null;
  }

  function readSlots() {
    try { return JSON.parse(localStorage.getItem(SLOTS_KEY) || "[]"); } catch { return []; }
  }
  function writeSlots(slots) { localStorage.setItem(SLOTS_KEY, JSON.stringify(slots)); }
  function slotSummary(id, s, updatedAt) {
    // Clube atual tambem em ligas do mundo (globalFootball); antes so olhava os clubes do Brasil e mostrava "Sem clube".
    let clubName=null;
    try { clubName=globalThis.ProLifeCareerContext?.clubName?.(s)||null; } catch {}
    if(!clubName) clubName=(s.clubs||[]).find(c=>c.id===s.clubId)?.name||(s.globalFootball?.clubs||[]).find(c=>c.id===s.clubId)?.name||null;
    return { id, name:s.person?.name||"Carreira", mode:s.mode, clubId:s.clubId||null, club:clubName||"Sem clube", pos:s.person?.pos||"", age:s.person?.age||0, season:s.season, day:s.day, updatedAt:updatedAt||Date.now() };
  }
  function migrateLegacy() {
    let slots=readSlots();
    if(slots.length) return slots;
    const legacy=localStorage.getItem(KEY);
    if(!legacy) return slots;
    try {
      const s=validate(JSON.parse(legacy)), id="career_legacy";
      localStorage.setItem(SLOT_PREFIX+id, JSON.stringify(s));
      slots=[slotSummary(id,s,Date.now())]; writeSlots(slots); localStorage.setItem(ACTIVE_KEY,id); localStorage.removeItem(KEY);
    } catch {}
    return slots;
  }
  function listSlots() {
    const ls = migrateLegacy().filter((x) => !idbMem.has(x.id));
    const idb = [...idbMem.entries()].map(([id, r]) => ({ ...(r.summary || {}), id, updatedAt: (r.summary && r.summary.updatedAt) || r.updatedAt || 0 }));
    return ls.concat(idb).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  }
  function activeId() { migrateLegacy(); return localStorage.getItem(ACTIVE_KEY) || memActive; }
  // 34F.16: define a carreira ativa sem depender da cota do localStorage.
  function setActive(id) { memActive = id; if (!trySet(ACTIVE_KEY, id)) { try { localStorage.removeItem(ACTIVE_KEY); } catch {} } return true; }
  function loadSlot(id) {
    if (idbMem.has(id)) {
      try { const s = decodeHybridSave(JSON.parse(idbMem.get(id).text)); setActive(id); bindStateToSlot(s, id); return s; } catch (e) { noteFailure("decode", e); return null; }
    }
    try { const data=localStorage.getItem(SLOT_PREFIX+id); if(!data) return null; const s=decodeHybridSave(JSON.parse(data)); trySet(ACTIVE_KEY,id); bindStateToSlot(s,id); return s; } catch { return null; }
  }
  // 34F.15: motivo da ultima falha de gravacao (diagnostico para a interface; nao altera nenhum dado).
  let lastFailure = null;
  const noteFailure = (reason, e) => { lastFailure = { reason, message: String(e && e.message || e || ""), at: Date.now() }; };
  const isQuota = (e) => !!e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014 || /quota/i.test(String(e.name || "") + String(e.message || "")));
  const trySet = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { noteFailure(isQuota(e) ? "quota" : "storage", e); return false; } };
  function lastSaveError() { return lastFailure ? { ...lastFailure } : null; }
  // Caracteres ocupados no localStorage (chave+valor), para orientar o jogador quando o espaco acaba.
  function storageUsage() {
    let used = 0, own = 0;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i), n = (k || "").length + (localStorage.getItem(k) || "").length; used += n; if (k && k.indexOf("prolife") === 0) own += n; } } catch {}
    let idbChars = 0; for (const r of idbMem.values()) idbChars += (r.text || "").length;
    return { used, own, approxLimit: 5 * 1024 * 1024, idbSlots: idbMem.size, idbChars };
  }
  const tryGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  // ---- 34F.16: IndexedDB para carreiras FC 27 (sem a cota de ~5 MB do localStorage) ----
  // O cache em memoria (idbMem) guarda o ultimo estado CONFIRMADO no IndexedDB e mantem a API de leitura sincrona.
  // Saves existentes do localStorage nunca sao movidos, copiados ou apagados.
  const IDB_NAME = "prolife-saves", IDB_STORE = "slots";
  const idbMem = new Map(), idbPending = new Map(), idbRunning = new Map(), failListeners = [];
  let idbBackend = null, idbReady = null, idbOk = false, memActive = null;
  function makeIdbBackend() {
    const f = root.indexedDB || (typeof indexedDB !== "undefined" ? indexedDB : null);
    if (!f) return null;
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      let r; try { r = f.open(IDB_NAME, 1); } catch (e) { rej(e); return; }
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(IDB_STORE)) r.result.createObjectStore(IDB_STORE, { keyPath: "id" }); };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error || new Error("IndexedDB indisponivel."));
      r.onblocked = () => rej(new Error("IndexedDB bloqueado por outra aba."));
    }).catch((e) => { dbp = null; throw e; }));
    const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => {
      let t, req; try { t = db.transaction(IDB_STORE, mode); req = fn(t.objectStore(IDB_STORE)); } catch (e) { rej(e); return; }
      t.oncomplete = () => res(req && req.result);
      t.onerror = () => rej(t.error || (req && req.error) || new Error("Falha no IndexedDB."));
      t.onabort = () => rej(t.error || new Error("Transacao do IndexedDB abortada."));
    }));
    return { getAll: () => tx("readonly", (st) => st.getAll()), put: (rec) => tx("readwrite", (st) => st.put(rec)), del: (id) => tx("readwrite", (st) => st.delete(id)) };
  }
  // Retorna null quando nao ha IndexedDB (comportamento anterior, 100% localStorage) ou uma Promise.
  function ready() {
    if (idbReady) return idbReady;
    if (!idbBackend) idbBackend = makeIdbBackend();
    if (!idbBackend) return null;
    try { if (root.navigator && root.navigator.storage && root.navigator.storage.persist) root.navigator.storage.persist().catch(() => {}); } catch {}
    idbReady = Promise.resolve().then(() => idbBackend.getAll()).then((recs) => {
      for (const r of recs || []) if (r && typeof r.id === "string" && typeof r.text === "string") idbMem.set(r.id, { text: r.text, summary: r.summary, updatedAt: r.updatedAt });
      idbOk = true; return { ok: true, count: idbMem.size };
    }).catch((e) => { idbOk = false; noteFailure("idb", e); return { ok: false, error: String(e && e.message || e) }; });
    return idbReady;
  }
  function useIdbBackend(b) { idbBackend = b || null; idbReady = null; idbOk = false; idbMem.clear(); idbPending.clear(); idbRunning.clear(); memActive = null; }
  function onSaveFailure(fn) { if (typeof fn === "function") failListeners.push(fn); }
  function idbActive() { return idbOk; }
  // Grava (put atomico por slot); mais recente vence; em falha o registro anterior do IndexedDB permanece como esta.
  function idbWrite(id, rec) {
    return new Promise((resolve) => {
      const waiting = idbPending.get(id);
      if (waiting) { waiting.rec = rec; waiting.waiters.push(resolve); return; }
      const p = { rec, waiters: [resolve] };
      idbPending.set(id, p);
      const prev = idbRunning.get(id) || Promise.resolve();
      const run = prev.then(() => {
        if (idbPending.get(id) === p) idbPending.delete(id);
        return idbBackend.put({ id, ...p.rec }).then(() => { idbMem.set(id, p.rec); p.waiters.forEach((w) => w(true)); }, (e) => {
          noteFailure(isQuota(e) ? "quota" : "idb", e);
          for (const fn of failListeners) { try { fn(lastSaveError()); } catch {} }
          p.waiters.forEach((w) => w(false));
        });
      });
      idbRunning.set(id, run);
      run.then(() => { if (idbRunning.get(id) === run) idbRunning.delete(id); });
    });
  }
  function idbFlush() { return Promise.all([...idbRunning.values()]).then(() => (idbPending.size || idbRunning.size ? idbFlush() : true)); }
  function newSlotId() { return "career_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7); }
  function idbRecord(id, s, label) {
    const text = encodeHybridSave(s, { sparseStats: true });
    if (!text) throw Error("Nao foi possivel gerar uma gravacao valida.");
    const now = Date.now();
    return { text, updatedAt: now, summary: { ...slotSummary(id, s, now), id, catalogVersion: s.catalogVersion, ...(label ? { label } : {}) } };
  }
  // Nova carreira FC 27 -> IndexedDB (nada e escrito no localStorage alem do ponteiro da carreira ativa). Demais -> caminho anterior.
  function saveAsNewAsync(s) {
    if (!(idbOk && s && s.catalogVersion === "fc27_v1")) return Promise.resolve(saveAsNew(s));
    lastFailure = null;
    let id, rec;
    try { validate(s); id = newSlotId(); rec = idbRecord(id, s); } catch (e) { noteFailure("validate", e); return Promise.resolve(null); }
    return idbWrite(id, rec).then((ok) => { if (!ok) return null; setActive(id); bindStateToSlot(s, id); return id; });
  }
  function saveIdb(id, s) {
    validate(s);
    const prev = idbMem.get(id);
    idbWrite(id, idbRecord(id, s, prev && prev.summary && prev.summary.label));
    return true;
  }
  function slotCatalog(id) { const r = idbMem.get(id); return r ? (r.summary && r.summary.catalogVersion) || "fc27_v1" : null; }
  function storageMode() { return idbOk ? "indexeddb" : "localStorage"; }

  // Grava o slot e o indice sem apagar nada antes de confirmar; em falha restaura o estado anterior.
  function commitSlot(id, s, previousText) {
    const mode = compactWriteMode();
    const slotsBefore = tryGet(SLOTS_KEY);
    const full = () => JSON.stringify(s);
    const compact = () => { try { return encodeHybridSave(s, { sparseStats: true }); } catch { return null; } };
    // 34F.13: o save completo FC 27 (~12,5 MB) excede a cota do localStorage; essas carreiras usam o hibrido validado
    // (reconstrucao pelo manifesto versionado, verificada antes de gravar) e so caem no completo se ele falhar.
    const fc27 = s && s.catalogVersion === "fc27_v1";
    const order = fc27 || mode === "always" ? [compact, full] : mode === "onQuota" ? [full, compact] : [full];
    let written = false;
    for (const make of order) {
      let text; try { text = make(); } catch { text = null; }
      if (text && trySet(SLOT_PREFIX + id, text)) { written = true; break; }
    }
    if (!written) { if (!lastFailure || lastFailure.reason !== "quota") noteFailure("encode", "Nao foi possivel gerar uma gravacao valida."); return false; }
    try {
      const slots = readSlots(), i = slots.findIndex((x) => x.id === id), summary = slotSummary(id, s, Date.now());
      if (i >= 0) slots[i] = { ...slots[i], ...summary, label: slots[i].label }; else slots.push(summary);
      writeSlots(slots);
      return true;
    } catch (e) {
      noteFailure(isQuota(e) ? "quota" : "storage", e);
      if (previousText === null) { try { localStorage.removeItem(SLOT_PREFIX + id); } catch {} } else trySet(SLOT_PREFIX + id, previousText);
      if (slotsBefore === null) { try { localStorage.removeItem(SLOTS_KEY); } catch {} } else trySet(SLOTS_KEY, slotsBefore);
      return false;
    }
  }
  function saveAsNew(s) {
    lastFailure = null;
    try {
      validate(s);
      const id = "career_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
      const slotsBefore = tryGet(SLOTS_KEY);
      if (!commitSlot(id, s, null)) return null;
      if (!trySet(ACTIVE_KEY, id)) {
        try { localStorage.removeItem(SLOT_PREFIX + id); } catch {}
        if (slotsBefore === null) { try { localStorage.removeItem(SLOTS_KEY); } catch {} } else trySet(SLOTS_KEY, slotsBefore);
        return null;
      }
      bindStateToSlot(s, id);
      return id;
    } catch (e) { noteFailure("validate", e); return null; }
  }
  // Identidade: um autosave so substitui o slot se for a mesma carreira.
  function sameCareer(prev, s) {
    if (!prev || !s) return false;
    if (prev.mode !== s.mode || prev.world !== s.world) return false;
    if (Number.isSafeInteger(prev.initialSeed) && Number.isSafeInteger(s.initialSeed) && prev.initialSeed !== s.initialSeed) return false;
    if (prev.person?.name && s.person?.name && prev.person.name !== s.person.name) return false;
    return true;
  }
  function save(s) {
    try {
      validate(s);
      let id = activeId();
      if (!id) return !!saveAsNew(s);
      if (stateSlotId(s) !== id) return false;
      if (idbMem.has(id)) return saveIdb(id, s);
      const existing = localStorage.getItem(SLOT_PREFIX + id);
      if (existing === null) return false;
      try {
        const previous = JSON.parse(existing), fmt = detectSaveFormat(previous);
        if (fmt === "legacy") { validate(previous); if (!sameCareer(previous, s)) return false; }
        else if (fmt === "compact") { if (!previous.state || !sameCareer(previous.state, s)) return false; if (baseFingerprint(baseCatalogFor(previous.state), root.ProLifeCompactSave) !== previous.fingerprint) return false; if (previous.version === 2 ? previous.statsFormat !== SPARSE_STATS : previous.statsFormat !== undefined) return false; }
        else return false;
      } catch {
        return false;
      }
      return commitSlot(id, s, existing);
    } catch { return false; }
  }
  // Diagnostico sem alterar nada: o slot abre com este codigo?
  function slotStatus(id) {
    if (idbMem.has(id)) { try { decodeHybridSave(JSON.parse(idbMem.get(id).text)); return { ok: true, format: "indexeddb" }; } catch (e) { return { ok: false, reason: String(e && e.message || e) }; } }
    const data = tryGet(SLOT_PREFIX + id);
    if (data === null) return { ok: false, reason: "ausente" };
    try { const v = JSON.parse(data), fmt = detectSaveFormat(v); decodeHybridSave(v); return { ok: true, format: fmt }; }
    catch (e) { return { ok: false, reason: String(e && e.message || e) }; }
  }
  function load() {
    const id=activeId();
    if(id) return loadSlot(id);
    return null;
  }
  function removeSlot(id) {
    if (idbMem.has(id) || idbPending.has(id) || idbRunning.has(id)) {
      idbMem.delete(id); idbPending.delete(id);
      const prev = idbRunning.get(id) || Promise.resolve();
      const run = prev.then(() => idbBackend.del(id)).catch((e) => { noteFailure("idb", e); });
      idbRunning.set(id, run); run.then(() => { if (idbRunning.get(id) === run) idbRunning.delete(id); });
      if (activeId() === id) { memActive = null; try { localStorage.removeItem(ACTIVE_KEY); } catch {} }
      return true;
    }
    const slots=readSlots().filter(x=>x.id!==id); writeSlots(slots); localStorage.removeItem(SLOT_PREFIX+id);
    if(localStorage.getItem(ACTIVE_KEY)===id) localStorage.removeItem(ACTIVE_KEY);
    return true;
  }
  function renameSlot(id,name) {
    if (idbMem.has(id)) {
      const r = idbMem.get(id), label = String(name||"").trim().slice(0,60);
      idbWrite(id, { ...r, summary: { ...r.summary, label } });
      idbMem.set(id, { ...r, summary: { ...r.summary, label } });
      return true;
    }
    const slots=readSlots(), x=slots.find(s=>s.id===id); if(!x) return false;
    x.label=String(name||"").trim().slice(0,60); writeSlots(slots); return true;
  }
  function clearActive() { memActive = null; localStorage.removeItem(ACTIVE_KEY); }
  root.ProLifeSave = { ready, useIdbBackend, onSaveFailure, idbActive, idbFlush, saveAsNewAsync, slotCatalog, storageMode, lastSaveError, storageUsage, slotSummary, parse, validate, save, load, saveAsNew, listSlots, loadSlot, removeSlot, renameSlot, activeId, clearActive, bindStateToSlot, stateSlotId, slotStatus, encodeHybridSave, decodeHybridSave, detectSaveFormat, setCompactWriteMode, compactWriteMode, KEY, SLOTS_KEY, ACTIVE_KEY };
  if (typeof module !== "undefined" && module.exports)
    module.exports = root.ProLifeSave;
})(typeof globalThis !== "undefined" ? globalThis : this);
