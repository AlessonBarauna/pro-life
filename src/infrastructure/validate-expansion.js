(function (root) {
  "use strict";
  function validate(s, fail) {
    const finite = (v, a, b) => Number.isFinite(v) && v >= a && v <= b;
    if (s.trainingPlan && (!s.trainingPlan.style || !finite(s.trainingPlan.sessions, 0, 1e8) || !finite(s.trainingPlan.improvements, 0, 1e8))) fail();
    if (s.life) {
      if (!Array.isArray(s.life.events) || s.life.events.length > 80 || !finite(s.life.lastDecisionDay, 0, s.day)) fail();
      if (s.life.agency && (typeof s.life.agency.name !== "string" || !finite(s.life.agency.monthlyCost, 0, 1e7))) fail();
    }
    if (s.statistics) {
      if (!s.statistics.players || !Array.isArray(s.statistics.awards) || !Array.isArray(s.statistics.seasons)) fail();
      for (const row of Object.values(s.statistics.players)) {
        if (!["appearances", "goals", "assists", "motm", "ratingTotal"].every((k) => finite(row[k], 0, 1e9))) fail();
        if (row.byCompetition === undefined) row.byCompetition = {};
        if (!row.byCompetition || typeof row.byCompetition !== "object") fail();
        for (const [id, competition] of Object.entries(row.byCompetition)) {
          if (!id || !["appearances", "goals", "assists", "motm", "ratingTotal"].every((k) => finite(competition[k], 0, 1e9))) fail();
        }
      }
    }
    if (s.competitions && (!Array.isArray(s.competitions) || s.competitions.length > 30)) fail();
    if (s.competitionSchedule) {
      const schedule = s.competitionSchedule, clubIds = new Set(s.clubs.map((c) => c.id));
      if (!finite(schedule.season, 2026, 2300) || !schedule.cup || !Array.isArray(schedule.cup.entrants) || schedule.cup.entrants.length !== 32 || !Array.isArray(schedule.cup.rounds) || schedule.cup.rounds.length > 5) fail();
      if (new Set(schedule.cup.entrants.map((e) => e.clubId)).size !== 32 || !schedule.cup.entrants.every((e) => clubIds.has(e.clubId) && finite(e.rank, 1, 80) && typeof e.qualifiedBy === "string")) fail();
      for (const round of schedule.cup.rounds) {
        if (!finite(round.index, 0, 4) || !finite(round.date, 1, 100000) || !Array.isArray(round.pairs) || !round.pairs.every((p) => clubIds.has(p.home) && clubIds.has(p.away) && p.home !== p.away && typeof p.played === "boolean" && (p.winnerId === null || clubIds.has(p.winnerId)))) fail();
      }
      if (schedule.state) {
        const state = schedule.state;
        if (!clubIds.has(state.clubId) || !Array.isArray(state.fixtures) || state.fixtures.length > 5 || !state.fixtures.every((f) => clubIds.has(f.home) && clubIds.has(f.away) && finite(f.date, 1, 100000) && typeof f.played === "boolean")) fail();
        if (!state.stats || !["points", "played", "w", "d", "l", "gf", "ga"].every((k) => finite(state.stats[k], 0, 1000))) fail();
      }
    }
    return s;
  }
  root.ProLifeValidateExpansion = { validate };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeValidateExpansion;
})(typeof globalThis !== "undefined" ? globalThis : this);
