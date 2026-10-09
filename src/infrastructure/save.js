(function (root) {
  "use strict";
  const KEY = "prolife.v1.save";
  const SLOTS_KEY = "prolife.v1.slots";
  const ACTIVE_KEY = "prolife.v1.activeSlot";
  const SLOT_PREFIX = "prolife.v1.slot.";
  const ExpansionValidator =
    root.ProLifeValidateExpansion ||
    (typeof require === "function" ? require("./validate-expansion.js") : null);
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
          str(o.role),
      )
    )
      fail();
    if (
      !Array.isArray(s.matches) ||
      s.matches.length > 800 ||
      !s.matches.every(
        (m) =>
          s.clubs.some((c) => c.id === m.home) &&
          s.clubs.some((c) => c.id === m.away) &&
          num(m.hg, 0, 100) &&
          num(m.ag, 0, 100) &&
          num(m.possession, 0, 100) &&
          num(m.date, 0, 100000) &&
          num(m.round, 1, 38) &&
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
        const contractOk = c => c===null || (c && str(c.clubId,20) && num(c.signedDay,0,s.day) && num(c.endDay,c.signedDay,s.day+5000) && num(c.durationDays,1,5000) && num(c.salary,0,1e9) && num(c.signingBonus,0,1e10) && str(c.role,100) && ["permanent","loan"].includes(c.type) && (c.parentClubId===undefined || str(c.parentClubId,20)) && (c.parentSalary===undefined || num(c.parentSalary,0,1e9)) && (c.parentContractRemaining===undefined || num(c.parentContractRemaining,1,5000)));
        if (!contractOk(pc.contract)) fail();
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
  function parse(text) {
    if (typeof text !== "string")
      throw Error("Arquivo de save inv?lido ou incompat?vel.");
    return validate(JSON.parse(text));
  }
  function readSlots() {
    try { return JSON.parse(localStorage.getItem(SLOTS_KEY) || "[]"); } catch { return []; }
  }
  function writeSlots(slots) { localStorage.setItem(SLOTS_KEY, JSON.stringify(slots)); }
  function slotSummary(id, s, updatedAt) {
    const club=s.clubs?.find(c=>c.id===s.clubId);
    return { id, name:s.person?.name||"Carreira", mode:s.mode, club:club?.name||"Sem clube", pos:s.person?.pos||"", age:s.person?.age||0, season:s.season, day:s.day, updatedAt:updatedAt||Date.now() };
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
  function listSlots() { return migrateLegacy().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)); }
  function activeId() { migrateLegacy(); return localStorage.getItem(ACTIVE_KEY); }
  function loadSlot(id) {
    try { const data=localStorage.getItem(SLOT_PREFIX+id); if(!data) return null; const s=validate(JSON.parse(data)); localStorage.setItem(ACTIVE_KEY,id); return s; } catch { return null; }
  }
  function saveAsNew(s) {
    try {
      validate(s);
      const id="career_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,7);
      localStorage.setItem(SLOT_PREFIX+id,JSON.stringify(s));
      const slots=readSlots(); slots.push(slotSummary(id,s,Date.now())); writeSlots(slots);
      localStorage.setItem(ACTIVE_KEY,id);
      return id;
    } catch { return null; }
  }
  function save(s) {
    try {
      validate(s);
      let id=activeId();
      if(!id) return !!saveAsNew(s);
      localStorage.setItem(SLOT_PREFIX+id,JSON.stringify(s));
      
      const slots=readSlots(), i=slots.findIndex(x=>x.id===id), summary=slotSummary(id,s,Date.now());
      if(i>=0) slots[i]=summary; else slots.push(summary);
      writeSlots(slots); return true;
    } catch { return false; }
  }
  function load() {
    const id=activeId();
    if(id) return loadSlot(id);
    return null;
  }
  function removeSlot(id) {
    const slots=readSlots().filter(x=>x.id!==id); writeSlots(slots); localStorage.removeItem(SLOT_PREFIX+id);
    if(localStorage.getItem(ACTIVE_KEY)===id) localStorage.removeItem(ACTIVE_KEY);
    return true;
  }
  function renameSlot(id,name) {
    const slots=readSlots(), x=slots.find(s=>s.id===id); if(!x) return false;
    x.label=String(name||"").trim().slice(0,60); writeSlots(slots); return true;
  }
  function clearActive() { localStorage.removeItem(ACTIVE_KEY); }
  root.ProLifeSave = { parse, validate, save, load, saveAsNew, listSlots, loadSlot, removeSlot, renameSlot, activeId, clearActive, KEY, SLOTS_KEY, ACTIVE_KEY };
  if (typeof module !== "undefined" && module.exports)
    module.exports = root.ProLifeSave;
})(typeof globalThis !== "undefined" ? globalThis : this);
