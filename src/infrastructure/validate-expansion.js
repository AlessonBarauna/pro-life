(function (root) {
  "use strict";
  function validate(s, fail) {
    const finite = (v, a, b) => Number.isFinite(v) && v >= a && v <= b;
    if (s.universe !== undefined) {
      const u = s.universe;
      if (!u || typeof u !== "object" || !finite(u.seed, 0, 4294967295) || !u.done || typeof u.done !== "object" || !Array.isArray(u.transfers) || u.transfers.length > 500 || !Array.isArray(u.retirements) || u.retirements.length > 500 || !Array.isArray(u.free) || u.free.length > 300 || (u.seasons !== undefined && (!Array.isArray(u.seasons) || u.seasons.length > 60))) fail();
    }
    if (s.creation !== undefined) {
      const c = s.creation;
      if (!c || typeof c !== "object" || !["unsigned", "started"].includes(c.status) || !finite(c.seed, 0, 4294967295) || !["casual", "normal", "realistic", "challenging"].includes(c.difficulty) || !["balanced", "professional", "ambitious", "charismatic", "leader"].includes(c.personality) || typeof c.storyId !== "string" || (c.objectives !== undefined && (!Array.isArray(c.objectives) || c.objectives.length > 10))) fail();
    }
    if (s.trainingPlan && (!s.trainingPlan.style || !finite(s.trainingPlan.sessions, 0, 1e8) || !finite(s.trainingPlan.improvements, 0, 1e8))) fail();
    if (s.trainingPlan) {
      if (s.trainingPlan.developmentXp !== undefined && !finite(s.trainingPlan.developmentXp, 0, 1e9)) fail();
      if (s.trainingPlan.level !== undefined && !finite(s.trainingPlan.level, 1, 50)) fail();
      if (s.trainingPlan.archetypeXp !== undefined && !finite(s.trainingPlan.archetypeXp, 0, 1e9)) fail();
      if (s.trainingPlan.archetypeLevel !== undefined && !finite(s.trainingPlan.archetypeLevel, 1, 50)) fail();
      if (s.trainingPlan.attributePoints !== undefined && !finite(s.trainingPlan.attributePoints, 0, 1000)) fail();
      if (s.trainingPlan.lastPotentialReviewSeason !== undefined && !finite(s.trainingPlan.lastPotentialReviewSeason, 2026, 2300)) fail();
      if (s.trainingPlan.specializationPoints !== undefined && !finite(s.trainingPlan.specializationPoints, 0, 50)) fail();
      if (s.trainingPlan.specializations !== undefined && (!Array.isArray(s.trainingPlan.specializations) || s.trainingPlan.specializations.length > 6)) fail();
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
    if (s.commercial === undefined && root.ProLife?.Commercial) root.ProLife.Commercial.init(s, root.ProLife);
    if (s.commercial !== undefined) {
      const c=s.commercial, text=(v,n=300)=>typeof v==="string"&&v.length>0&&v.length<=n;
      if (!c || !finite(c.popularity,0,100) || !finite(c.followers,0,1e10) || !finite(c.commercialValue,0,1e12) || !finite(c.exposure,0,100) || !finite(c.revenue,0,1e12) || !finite(c.bonusRevenue,0,1e12)) fail();
      for (const key of ["interests","proposals","negotiations","contracts","events","history","milestones"]) if (!Array.isArray(c[key]) || c[key].length>300) fail();
      for (const key of ["payments","relations","processed"]) if (!c[key] || typeof c[key]!=="object" || Array.isArray(c[key])) fail();
      for (const i of c.interests) if (!i || !text(i.brandId,40) || !text(i.stage,40) || !finite(i.score,0,200) || !finite(i.startedDay,0,s.day)) fail();
      for (const p of c.proposals) if (!p || !text(p.id,160) || !text(p.brandId,40) || !text(p.brand,100) || !text(p.category,80) || !text(p.status,40) || !finite(p.amount,0,1e10) || !finite(p.durationDays,1,5000) || !finite(p.expires,0,s.day+5000) || !Number.isInteger(p.round) || !finite(p.round,0,5)) fail();
      for (const x of c.contracts) if (!x || !text(x.id,180) || !text(x.brandId,40) || !text(x.brand,100) || !text(x.category,80) || !text(x.status,40) || !finite(x.amount,0,1e10) || !finite(x.startDay,0,s.day+5000) || !finite(x.endDay,x.startDay,s.day+5000) || !finite(x.relationship,0,100)) fail();
      for (const e of c.events) if (!e || !text(e.id,200) || !text(e.brand,100) || !text(e.type,80) || !text(e.status,40) || !finite(e.day,0,s.day+5000)) fail();
    }
    return s;
  }
  root.ProLifeValidateExpansion = { validate };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeValidateExpansion;
})(typeof globalThis !== "undefined" ? globalThis : this);
