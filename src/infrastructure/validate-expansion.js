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
      for (const row of Object.values(s.statistics.players)) if (!["appearances", "goals", "assists", "motm", "ratingTotal"].every((k) => finite(row[k], 0, 1e9))) fail();
    }
    if (s.competitions && (!Array.isArray(s.competitions) || s.competitions.length > 30)) fail();
    return s;
  }
  root.ProLifeValidateExpansion = { validate };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeValidateExpansion;
})(typeof globalThis !== "undefined" ? globalThis : this);
