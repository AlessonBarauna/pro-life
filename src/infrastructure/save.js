(function (root) {
  "use strict";
  const KEY = "prolife.v1.save";
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
      num(p.condition, 0, 100) &&
      num(p.morale, 0, 100) &&
      num(p.injury, 0, 10000) &&
      num(p.goals, 0, 1000000) &&
      num(p.minutes, 0, 10000000) &&
      num(p.discipline, 0, 100) &&
      num(p.potential, 0, 100);
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
      ].includes(s.training)
    )
      fail();
    if (
      !Array.isArray(s.clubs) ||
      ![8, 40].includes(s.clubs.length) ||
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
      s.leagues.length !== (legacy ? 1 : 2) ||
      !s.leagues.every((l) => str(l.id, 30) && str(l.name, 100)) ||
      new Set(s.leagues.map((l) => l.id)).size !== s.leagues.length
    )
      fail();
    const expected = legacy ? ["horizonte"] : ["serieA", "serieB"];
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
    if (!s.clubs.every((c) => /^c([0-9]|[12][0-9]|3[0-9])$/.test(c.id))) fail();
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
    if (
      new Set(allIds).size !== allIds.length ||
      (s.clubId !== null && !s.clubs.some((c) => c.id === s.clubId))
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
          s.clubs.some((c) => c.id === o.clubId) &&
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
      const c = s.clubs.find((c) => c.id === s.clubId),
        p = c.roster.find((p) => p.id === "hero");
      if (!p || JSON.stringify(p) !== JSON.stringify(s.person)) fail();
      c.roster[c.roster.indexOf(p)] = s.person;
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
            Object.values(s.person.attrs).reduce((a, b) => a + b, 0) / 6,
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
      if (
        !Array.isArray(e.feed) ||
        e.feed.length > 160 ||
        !e.feed.every(
          (p) =>
            str(p.id, 100) &&
            num(p.day, 0, s.day) &&
            num(p.season, 2026, s.season) &&
            str(p.category, 80) &&
            str(p.author, 100) &&
            str(p.title, 200) &&
            str(p.body, 2000) &&
            ["confirmed", "rumor"].includes(p.kind) &&
            typeof p.liked === "boolean" &&
            num(p.likes, 0, 1e9),
        )
      )
        fail();
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
            num(t.fee, 0, 1e10),
        )
      )
        fail();
      if (
        e.promise !== null &&
        (!e.promise ||
          !Number.isInteger(e.promise.games) ||
          !num(e.promise.games, 1, 3) ||
          !Number.isInteger(e.promise.wins) ||
          !num(e.promise.wins, 0, 3))
      )
        fail();
      if (
        e.postSequence !== undefined &&
        (!Number.isInteger(e.postSequence) || !num(e.postSequence, 0, 1e9))
      )
        fail();
    } else if (root.ProLife?.Career) root.ProLife.Career.init(s);
    if (
      s.careerTransferAvailableDay !== undefined &&
      (!Number.isInteger(s.careerTransferAvailableDay) ||
        !num(s.careerTransferAvailableDay, 0, 100365))
    )
      fail();
    if (root.ProLife?.Career) root.ProLife.Career.init(s);
    return s;
  }
  function parse(text) {
    if (typeof text !== "string" || text.length > 3000000)
      throw Error("Save excede o limite de 3 MB.");
    return validate(JSON.parse(text));
  }
  function save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      return true;
    } catch {
      return false;
    }
  }
  function load() {
    try {
      const data = localStorage.getItem(KEY);
      if (data) {
        const old = JSON.parse(data);
        if (
          old.world === undefined &&
          !localStorage.getItem("prolife.v02.backup")
        )
          localStorage.setItem("prolife.v02.backup", data);
        return validate(old);
      }
      return null;
    } catch {
      return null;
    }
  }
  root.ProLifeSave = { parse, validate, save, load, KEY };
  if (typeof module !== "undefined" && module.exports)
    module.exports = root.ProLifeSave;
})(typeof globalThis !== "undefined" ? globalThis : this);
