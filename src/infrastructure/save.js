(function (root) {
  "use strict";
  const KEY = "prolife.v1.save";
  function validate(s) {
    const fail = () => {
      throw Error("Arquivo de save inválido ou incompatível.");
    };
    const num = (v, a, b) => typeof v === "number" && Number.isFinite(v) && v >= a && v <= b;
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
      !num(s.round, 0, 14) ||
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
      !["balanced", "pace", "finish", "pass", "defense", "strength", "stamina"].includes(s.training)
    )
      fail();
    if (
      !Array.isArray(s.clubs) ||
      s.clubs.length !== 8 ||
      new Set(s.clubs.map((c) => c.id)).size !== 8
    )
      fail();
    const allIds = [];
    for (const c of s.clubs) {
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
        !["points", "played", "w", "d", "l", "gf", "ga"].every((k) => num(c.stats[k], 0, 100000))
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
      s.fixtures.length !== 14 ||
      !s.fixtures.every(
        (r) =>
          Array.isArray(r) &&
          r.length === 4 &&
          r.every(
            (p) =>
              Array.isArray(p) &&
              p.length === 2 &&
              p[0] !== p[1] &&
              p.every((id) => s.clubs.some((c) => c.id === id)),
          ),
      )
    )
      fail();
    if (
      !Array.isArray(s.news) ||
      s.news.length > 200 ||
      !s.news.every(
        (n) =>
          str(n.title) && str(n.body, 2000) && num(n.day, 0, 100000) && num(n.season, 2026, 2300),
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
      s.matches.length > 140 ||
      !s.matches.every(
        (m) =>
          s.clubs.some((c) => c.id === m.home) &&
          s.clubs.some((c) => c.id === m.away) &&
          num(m.hg, 0, 100) &&
          num(m.ag, 0, 100) &&
          num(m.possession, 0, 100) &&
          num(m.date, 0, 100000) &&
          num(m.round, 1, 14) &&
          num(m.season, 2026, 2300) &&
          m.ratings &&
          Object.values(m.ratings).every((v) => num(v, 0, 10)) &&
          Array.isArray(m.participants) &&
          m.participants.length === 2 &&
          m.participants.every(
            (ps) => Array.isArray(ps) && ps.length <= 30 && ps.every((id) => str(id, 80)),
          ) &&
          Array.isArray(m.events) &&
          m.events.length < 500 &&
          m.events.every((e) => str(e.text, 1000) && num(e.minute, 0, 120) && num(e.side, 0, 1)) &&
          ["shots", "target", "xg"].every(
            (k) => Array.isArray(m[k]) && m[k].length === 2 && m[k].every((v) => num(v, 0, 1000)),
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
              [null, 1, 2, 3, 4, 5, 6, 7, 8].includes(h.position) &&
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
          (c) => Array.isArray(c) && c.length === 2 && str(c[0], 30) && str(c[1], 100),
        ))
    )
      fail();
    if (s.mode === "player" && s.clubId) {
      const c = s.clubs.find((c) => c.id === s.clubId),
        p = c.roster.find((p) => p.id === "hero");
      if (!p || JSON.stringify(p) !== JSON.stringify(s.person)) fail();
      c.roster[c.roster.indexOf(p)] = s.person;
    }
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
      return data ? parse(data) : null;
    } catch {
      return null;
    }
  }
  root.ProLifeSave = { parse, validate, save, load, KEY };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSave;
})(typeof globalThis !== "undefined" ? globalThis : this);
