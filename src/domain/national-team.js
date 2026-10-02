/* PRO LIFE — Brazil national team career simulation. */
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const windows = [74, 149, 224, 299];
  const opponents = ["Argentina", "Uruguai", "Colômbia", "Chile", "Equador", "Paraguai", "Peru", "México"];
  const windowOpponents = [["Chile", "Paraguai"], ["Argentina", "Uruguai"], ["Colômbia", "Equador"], ["Peru", "México"]];
  const defaults = () => ({
    country: "Brasil", calledUp: false, status: "Fora da convocação", caps: 0,
    starts: 0, goals: 0, assists: 0, ratingTotal: 0, motm: 0,
    lastCallupDay: null, nextWindow: windows[0], matches: [], history: [],
    competition: "Seleção Brasileira", schedule: [],
  });
  function protectedDay(day) { const relative = ((day % 365) + 365) % 365; return windows.some((value) => relative >= value - 7 && relative <= value + 4); }
  function protectClubCalendar(s) {
    let previous = -10;
    if (Array.isArray(s.calendarDays)) s.calendarDays = s.calendarDays.map((original) => {
      let day = Math.max(original, previous + 5);
      while (protectedDay(day)) day++;
      previous = day; return day;
    });
    for (const round of s.competitionSchedule?.cup?.rounds || []) while (protectedDay(round.date)) round.date++;
  }
  function ensureSchedule(s, n) {
    if (!Array.isArray(n.schedule)) n.schedule = [];
    const yearStart = Math.floor(s.day / 365) * 365;
    for (let seasonOffset = 0; seasonOffset <= 1; seasonOffset++) for (let index = 0; index < windows.length; index++) {
      const windowDay = yearStart + seasonOffset * 365 + windows[index];
      windowOpponents[index].forEach((opponent, matchIndex) => {
        const day = windowDay + matchIndex * 3, id = `${day}:${opponent}`;
        if (!n.schedule.some((match) => match.id === id)) n.schedule.push({ id, day, windowDay, opponent, competition: competition(s, day), played: false, participated: false, brazil: null, other: null });
      });
    }
    n.schedule = n.schedule.filter((match) => match.day >= s.day - 370 && match.day <= s.day + 730).sort((a, b) => a.day - b.day);
  }
  function nextWindowDay(s) {
    const yearStart = Math.floor(s.day / 365) * 365, day = s.day % 365;
    return yearStart + (windows.find((value) => value >= day) ?? 365 + windows[0]);
  }
  function init(s) {
    if (!s.nationalTeam || typeof s.nationalTeam !== "object") s.nationalTeam = defaults();
    const fallback = defaults();
    for (const [key, value] of Object.entries(fallback)) if (s.nationalTeam[key] === undefined) s.nationalTeam[key] = value;
    if (!Array.isArray(s.nationalTeam.matches)) s.nationalTeam.matches = [];
    if (!Array.isArray(s.nationalTeam.history)) s.nationalTeam.history = [];
    s.nationalTeam.matches = s.nationalTeam.matches.slice(0, 100);
    s.nationalTeam.history = s.nationalTeam.history.slice(0, 80);
    ensureSchedule(s, s.nationalTeam);
    protectClubCalendar(s);
    s.nationalTeam.nextWindow = s.nationalTeam.schedule.find((match) => !match.played && match.day >= s.day)?.day ?? nextWindowDay(s);
    return s.nationalTeam;
  }
  function score(s, api) {
    const e = s.career?.playerCareer || s.playerCareer || {};
    const avg = e.played ? e.ratingTotal / e.played : 6.5;
    return api.overall(s.person) * 0.58 + s.reputation * 0.18 + avg * 2.1 + (s.person.morale || 50) * 0.05 + (e.squadRole === "Estrela" ? 5 : e.squadRole === "Importante" ? 3 : 0);
  }
  function threshold(s) { return s.person.age <= 21 ? 65 : 70; }
  function role(s, api) { const value = score(s, api); return value >= 76 ? "Titular" : value >= 69 ? "Rotação" : "Reserva"; }
  function competition(s, day) { const n = day % 365; return n >= 205 && n <= 245 ? "Copa América" : n >= 120 ? "Eliminatórias" : "Amistoso internacional"; }
  function radar(s, api) {
    const value = score(s, api), target = threshold(s), unavailable = Boolean(s.person.injury);
    return { score: Math.round(value), target, gap: Math.max(0, Math.ceil(target - value)), label: unavailable ? "Indisponível por lesão" : value >= target + 7 ? "Forte candidato" : value >= target ? "Na disputa" : value >= target - 6 ? "No radar" : "Fora do radar" };
  }
  function upcoming(s) {
    const n = init(s);
    return n.schedule.filter((match) => !match.played && match.day >= s.day).slice(0, 4).map((match) => ({ ...match, calledUp: n.calledUp }));
  }
  function callup(s, api, log) {
    const n = init(s); if (s.mode !== "player") return false;
    const value = score(s, api), target = threshold(s);
    if (value < target || s.person.injury) { n.calledUp = false; n.status = s.person.injury ? "Cortado por lesão" : "Fora da convocação"; return false; }
    n.calledUp = true; n.status = role(s, api); n.lastCallupDay = s.day; n.competition = competition(s, s.day);
    n.history.unshift({ day: s.day, type: "callup", status: n.status, competition: n.competition }); n.history = n.history.slice(0, 80);
    log(s, "Convocação para a Seleção Brasileira", `${s.person.name} foi convocado para ${n.competition}. Situação no grupo: ${n.status}.`); return true;
  }
  function play(s, rng, api, log, fixture = null) {
    const n = init(s); if (!n.calledUp) return;
    const opponent = fixture?.opponent || opponents[rng.int(0, opponents.length - 1)], starter = n.status === "Titular" || (n.status === "Rotação" && rng.next() < 0.55), participated = starter || rng.next() < 0.7;
    const minutes = participated ? (starter ? rng.int(65, 90) : rng.int(12, 35)) : 0, quality = score(s, api), rating = participated ? clamp(5.7 + (quality - 65) / 18 + (rng.next() - 0.5) * 1.8, 5.5, 9.8) : 0;
    const goals = participated && rng.next() < clamp((quality - 55) / 100, 0.05, 0.42) ? 1 : 0, assists = participated && rng.next() < clamp((quality - 58) / 120, 0.04, 0.3) ? 1 : 0;
    const brazil = Math.max(0, Math.round(1.4 + (quality - 68) / 22 + (rng.next() - 0.5) * 2)), other = Math.max(0, Math.round(1.1 + (rng.next() - 0.5) * 2));
    if (fixture) Object.assign(fixture, { played: true, participated, brazil, other });
    if (participated) {
      n.caps++; if (starter) n.starts++; n.goals += goals; n.assists += assists; n.ratingTotal += rating; if (rating >= 8.6) n.motm++;
      const match = { day: s.day, season: s.season, competition: n.competition, opponent, brazil, other, starter, minutes, rating: +rating.toFixed(1), goals, assists };
      n.matches.unshift(match); n.matches = n.matches.slice(0, 100);
      s.reputation = clamp(s.reputation + (rating >= 8 ? 2 : rating >= 7 ? 1 : 0), 0, 100); s.fans += Math.round(500 + rating * 120 + goals * 1000);
    }
    log(s, `Brasil ${brazil} × ${other} ${opponent}`, participated ? `${s.person.name}: ${minutes} min · nota ${rating.toFixed(1)}${goals ? ` · ${goals} gol(s)` : ""}${assists ? ` · ${assists} assistência(s)` : ""}.` : `${s.person.name} permaneceu no banco nesta partida.`);
  }
  function daily(s, rng, api, log) {
    const n = init(s); if (s.mode !== "player") return;
    const relative = s.day % 365;
    const callWindow = windows.find((day) => relative === day - 7);
    if (callWindow !== undefined) callup(s, api, log);
    const fixture = n.schedule.find((match) => !match.played && match.day === s.day);
    if (fixture) {
      n.competition = fixture.competition;
      if (n.calledUp) play(s, rng, api, log, fixture);
      else {
        const brazil = Math.max(0, Math.round(1.7 + (rng.next() - 0.5) * 2.4));
        const other = Math.max(0, Math.round(1.1 + (rng.next() - 0.5) * 2.2));
        Object.assign(fixture, { played: true, participated: false, status: "Não convocado", brazil, other });
        log(s, `Brasil ${brazil} × ${other} ${fixture.opponent}`, `${fixture.competition} · partida da Seleção Brasileira.`);
      }
    }
    if (windows.some((day) => relative === day + 4)) { n.calledUp = false; n.status = "Aguardando próxima convocação"; }
    n.nextWindow = n.schedule.find((match) => !match.played && match.day >= s.day)?.day ?? nextWindowDay(s);
  }
  const api = { windows, init, score, threshold, radar, role, upcoming, nextWindowDay, protectedDay, protectClubCalendar, callup, play, daily };
  root.ProLifeNationalTeam = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
