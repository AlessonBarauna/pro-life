(function (root) {
  "use strict";
  function validate(s, fail) {
    const finite = (v, a, b) => Number.isFinite(v) && v >= a && v <= b;
    if (s.trainingPlan && (!s.trainingPlan.style || !finite(s.trainingPlan.sessions, 0, 1e8) || !finite(s.trainingPlan.improvements, 0, 1e8))) fail();
    if (s.trainingPlan) {
      if (s.trainingPlan.developmentXp !== undefined && !finite(s.trainingPlan.developmentXp, 0, 1e9)) fail();
      if (s.trainingPlan.level !== undefined && !finite(s.trainingPlan.level, 1, 30)) fail();
      if (s.trainingPlan.specializationPoints !== undefined && !finite(s.trainingPlan.specializationPoints, 0, 30)) fail();
      if (s.trainingPlan.specializations !== undefined && (!Array.isArray(s.trainingPlan.specializations) || s.trainingPlan.specializations.length > 3)) fail();
    }
    if (s.life) {
      if (!Array.isArray(s.life.events) || s.life.events.length > 80 || !finite(s.life.lastDecisionDay, 0, s.day)) fail();
      if (s.life.agency && (typeof s.life.agency.name !== "string" || !finite(s.life.agency.monthlyCost, 0, 1e7))) fail();
    }
    if (s.statistics) {
      if (!s.statistics.players || !Array.isArray(s.statistics.awards) || !Array.isArray(s.statistics.seasons)) fail();
      for (const row of Object.values(s.statistics.players)) {
        for (const key of ["saves", "tackles"]) if (row[key] === undefined) row[key] = 0;
        if (!["appearances", "goals", "assists", "motm", "ratingTotal", "saves", "tackles"].every((k) => finite(row[k], 0, 1e9))) fail();
        if (row.byCompetition === undefined) row.byCompetition = {};
        if (!row.byCompetition || typeof row.byCompetition !== "object") fail();
        for (const [id, competition] of Object.entries(row.byCompetition)) {
          for (const key of ["saves", "tackles"]) if (competition[key] === undefined) competition[key] = 0;
          if (!id || !["appearances", "goals", "assists", "motm", "ratingTotal", "saves", "tackles"].every((k) => finite(competition[k], 0, 1e9))) fail();
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
      if (schedule.otherStates !== undefined && (!Array.isArray(schedule.otherStates) || schedule.otherStates.length > 30)) fail();
      const states = [schedule.state, ...(schedule.otherStates || [])].filter(Boolean);
      if (new Set(states.map((state) => state.id)).size !== states.length) fail();
      for (const state of states) {
        if (state.formatVersion !== 2) {
          if (!clubIds.has(state.clubId) || !Array.isArray(state.fixtures) || state.fixtures.length > 5 || !state.fixtures.every((fixture) => clubIds.has(fixture.home) && clubIds.has(fixture.away) && finite(fixture.date, 1, 100000) && typeof fixture.played === "boolean") || !state.stats || !["points", "played", "w", "d", "l", "gf", "ga"].every((key) => finite(state.stats[key], 0, 1000))) fail();
          continue;
        }
        if (!Array.isArray(state.entrants) || !state.entrants.length || !state.entrants.every((id) => clubIds.has(id)) || !Array.isArray(state.groups) || !state.groups.length || !Array.isArray(state.rounds) || state.rounds.length > 12 || !Array.isArray(state.fixtures) || state.fixtures.length > 100) fail();
        if (!state.table || !state.entrants.every((id) => state.table[id] && ["points", "played", "w", "d", "l", "gf", "ga"].every((key) => finite(state.table[id][key], 0, 1000)))) fail();
        for (const round of state.rounds) if (!finite(round.index, 0, 20) || !finite(round.date, 1, 100000) || !["group", "knockout"].includes(round.kind) || !Array.isArray(round.pairs) || !round.pairs.every((pair) => clubIds.has(pair.home) && clubIds.has(pair.away) && pair.home !== pair.away && typeof pair.played === "boolean" && (pair.winnerId === null || clubIds.has(pair.winnerId)))) fail();
      }
    }
    if (s.nationalTeam !== undefined) {
      const n = s.nationalTeam;
      if (!n || typeof n !== "object" || typeof n.country !== "string" || typeof n.calledUp !== "boolean" || typeof n.status !== "string" || !["caps", "starts", "goals", "assists", "ratingTotal", "motm"].every((key) => finite(n[key], 0, 1e9)) || (n.lastCallupDay !== null && !finite(n.lastCallupDay, 0, s.day)) || !finite(n.nextWindow, s.day, s.day + 365) || !Array.isArray(n.matches) || n.matches.length > 100 || !Array.isArray(n.history) || n.history.length > 80) fail();
      for (const match of n.matches) if (!match || !finite(match.day, 0, s.day) || typeof match.opponent !== "string" || typeof match.competition !== "string" || !finite(match.brazil, 0, 30) || !finite(match.other, 0, 30) || !finite(match.minutes, 0, 130) || !finite(match.rating, 0, 10) || !finite(match.goals, 0, 20) || !finite(match.assists, 0, 20)) fail();
      if (n.schedule !== undefined && (!Array.isArray(n.schedule) || n.schedule.length > 24 || !n.schedule.every((match) => match && typeof match.id === "string" && finite(match.day, 0, s.day + 730) && finite(match.windowDay, 0, s.day + 730) && typeof match.opponent === "string" && typeof match.competition === "string" && typeof match.played === "boolean" && typeof match.participated === "boolean" && (match.brazil === null || finite(match.brazil, 0, 30)) && (match.other === null || finite(match.other, 0, 30))))) fail();
    }
    return s;
  }
  root.ProLifeValidateExpansion = { validate };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeValidateExpansion;
})(typeof globalThis !== "undefined" ? globalThis : this);
