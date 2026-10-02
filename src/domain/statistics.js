(function (root) {
  "use strict";
  const fields = ["appearances", "goals", "assists", "motm", "ratingTotal", "saves", "tackles"];
  const blank = () => ({ appearances: 0, goals: 0, assists: 0, motm: 0, ratingTotal: 0, saves: 0, tackles: 0, byCompetition: {} });
  function normalize(row) {
    const value = row || blank();
    for (const key of fields) if (!Number.isFinite(value[key])) value[key] = 0;
    if (!value.byCompetition || typeof value.byCompetition !== "object") value.byCompetition = {};
    return value;
  }
  function competitionRow(row, id) {
    const normalized = normalize(row), key = id || "career";
    const value = normalized.byCompetition[key] || (normalized.byCompetition[key] = {});
    for (const field of fields) if (!Number.isFinite(value[field])) value[field] = 0;
    return value;
  }
  function init(s) {
    if (!s.statistics) s.statistics = { players: {}, awards: [], seasons: [] };
    for (const [id, row] of Object.entries(s.statistics.players || {})) s.statistics.players[id] = normalize(row);
    const hero = s.statistics.players.hero || (s.statistics.players.hero = blank());
    return { root: s.statistics, hero };
  }
  function add(stats, id, competitionId, field, value = 1) {
    const row = stats.players[id] || (stats.players[id] = blank());
    row[field] += value;
    competitionRow(row, competitionId)[field] += value;
  }
  function recordMatch(s, m) {
    const stats = init(s).root, competitionId = m.competitionId || m.leagueId || "career";
    for (const ids of m.participants || []) for (const id of new Set(ids)) {
      add(stats, id, competitionId, "appearances");
      add(stats, id, competitionId, "ratingTotal", Number(m.ratings?.[id] || 0));
    }
    for (const e of m.events || []) {
      if (e.type === "goal" && e.playerId) add(stats, e.playerId, competitionId, "goals");
      if (e.assistPlayerId) add(stats, e.assistPlayerId, competitionId, "assists");
    }
    for (const [id, performance] of Object.entries(m.playerStats || {})) {
      if (Number.isFinite(performance.saves) && performance.saves > 0) add(stats, id, competitionId, "saves", performance.saves);
      if (Number.isFinite(performance.tackles) && performance.tackles > 0) add(stats, id, competitionId, "tackles", performance.tackles);
    }
    const best = Object.entries(m.ratings || {}).sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] >= 7.5) add(stats, best[0], competitionId, "motm");
  }
  function playerAndClub(s, id) {
    if (id === "hero") return { player: s.person, club: s.clubs.find((c) => c.roster.some((x) => x.id === id)) };
    for (const club of s.clubs) {
      const player = club.roster.find((x) => x.id === id);
      if (player) return { player, club };
    }
    return {};
  }
  function leaders(s, field, limit = 10, competitionId = null) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const source = competitionId ? normalize(row).byCompetition[competitionId] : row;
      const { player, club } = playerAndClub(s, id);
      return { id, name: player?.name || "Atleta", age: player?.age ?? 99, club: club?.name || "—", clubId: club?.id || null, value: source?.[field] || 0, appearances: source?.appearances || 0, ratingTotal: source?.ratingTotal || 0 };
    }).filter((x) => x.value > 0 || x.appearances > 0).sort((a, b) => b.value - a.value || b.appearances - a.appearances || a.name.localeCompare(b.name)).slice(0, limit);
  }
  function bestRated(s, competitionId = null, minimum = 5) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const source = competitionId ? normalize(row).byCompetition[competitionId] : normalize(row), { player, club } = playerAndClub(s, id);
      return { id, name: player?.name || "Atleta", age: player?.age ?? 99, club: club?.name || "—", clubId: club?.id || null, value: source?.appearances ? +(source.ratingTotal / source.appearances).toFixed(2) : 0, appearances: source?.appearances || 0 };
    }).filter((x) => x.appearances >= minimum).sort((a, b) => b.value - a.value || b.appearances - a.appearances)[0] || null;
  }
  function bestYoung(s) {
    return Object.entries(init(s).root.players).map(([id, row]) => {
      const { player, club } = playerAndClub(s, id), source = normalize(row);
      return { id, name: player?.name || "Atleta", age: player?.age ?? 99, club: club?.name || "—", clubId: club?.id || null, value: source.appearances ? +(source.ratingTotal / source.appearances).toFixed(2) : 0, appearances: source.appearances };
    }).filter((item) => item.age <= 21 && item.appearances >= 5).sort((a, b) => b.value - a.value || b.appearances - a.appearances)[0] || null;
  }
  function teamOfSeason(s, competitionId, minimum = 2) {
    const candidates = Object.entries(init(s).root.players).map(([id, row]) => {
      const source = competitionId ? normalize(row).byCompetition[competitionId] : normalize(row), { player, club } = playerAndClub(s, id);
      if (!source) return null;
      if (!player || source.appearances < minimum) return null;
      const average = source.appearances ? source.ratingTotal / source.appearances : 0, position = player.pos || "MEI",
        goals = source.goals || 0, assists = source.assists || 0, motm = source.motm || 0, saves = source.saves || 0, tackles = source.tackles || 0;
      const contribution = position === "GOL"
        ? saves * 0.7 + assists * 1.2 + motm * 2
        : position === "DEF"
          ? tackles * 0.34 + goals * 1.8 + assists * 1.2 + motm * 2
          : position === "MEI"
            ? assists * 2 + goals * 1.45 + tackles * 0.16 + motm * 2
            : goals * 2.2 + assists * 1.45 + motm * 2;
      return { id, name: player.name, club: club?.name || "—", clubId: club?.id || null, position, appearances: source.appearances, average: +average.toFixed(2), goals, assists, saves, tackles, score: +(average * 10 + contribution).toFixed(2) };
    }).filter(Boolean);
    const chosen = [], slots = { GOL: 1, DEF: 4, MEI: 3, ATA: 3 };
    for (const [position, amount] of Object.entries(slots)) chosen.push(...candidates.filter((player) => player.position === position).sort((a, b) => b.score - a.score || b.appearances - a.appearances || a.name.localeCompare(b.name)).slice(0, amount));
    if (chosen.length < 11) chosen.push(...candidates.filter((player) => !chosen.some((selected) => selected.id === player.id)).sort((a, b) => b.score - a.score).slice(0, 11 - chosen.length));
    return chosen;
  }
  function competitionName(s, id) {
    if (id === "overall") return "Melhores do ano";
    return root.ProLifeCompetitions?.statCompetitions?.(s).find((item) => item.id === id)?.name || root.ProLifeCompetitions?.leagueNames?.[id] || id;
  }
  function award(s, competitionId, name, winner) {
    return winner && { season: s.season, leagueId: competitionId, competitionId, league: competitionName(s, competitionId), name, winner: winner.name, winnerClub: winner.club, clubId: winner.clubId, value: winner.value };
  }
  function bestCoach(s) {
    const champions = new Set([s.competitionSchedule?.cup?.championId, ...(root.ProLifeCompetitions?.allStates?.(s) || []).map((state) => state.championId)].filter(Boolean));
    const club = s.clubs.slice().sort((a, b) => (champions.has(b.id) ? 40 : 0) + b.stats.points - ((champions.has(a.id) ? 40 : 0) + a.stats.points) || b.structure - a.structure)[0];
    return club && { name: s.mode === "coach" && club.id === s.clubId ? s.person.name : `Técnico do ${club.name}`, club: club.name, clubId: club.id, value: club.stats.points + (champions.has(club.id) ? 40 : 0) };
  }
  function closeSeason(s) {
    const stats = init(s).root, awards = [];
    const competitions = root.ProLifeCompetitions?.statCompetitions?.(s) || s.leagues || [];
    const teams = competitions.map((competition) => ({ competitionId: competition.id, competition: competition.name, players: teamOfSeason(s, competition.id, competition.type === "league" ? 5 : 1) })).filter((team) => team.players.length);
    for (const competition of competitions) {
      const minimum = competition.type === "league" ? 5 : 2;
      awards.push(
        award(s, competition.id, "Artilheiro", leaders(s, "goals", 1, competition.id)[0]),
        award(s, competition.id, "Líder de assistências", leaders(s, "assists", 1, competition.id)[0]),
        award(s, competition.id, "Mais vezes melhor em campo", leaders(s, "motm", 1, competition.id)[0]),
        award(s, competition.id, "Craque da competição", bestRated(s, competition.id, minimum)),
      );
    }
    awards.push(
      award(s, "overall", "Artilheiro do ano", leaders(s, "goals", 1)[0]),
      award(s, "overall", "Líder de assistências do ano", leaders(s, "assists", 1)[0]),
      award(s, "overall", "Melhor jogador do ano", bestRated(s)),
      award(s, "overall", "Revelação do ano", bestYoung(s)),
      award(s, "overall", "Melhor técnico", bestCoach(s)),
    );
    const valid = awards.filter(Boolean);
    stats.awards.unshift(...valid);
    stats.awards = stats.awards.slice(0, 500);
    stats.seasons.unshift({ season: s.season, awards: valid, teams });
    for (const row of Object.values(stats.players)) {
      for (const competition of competitions) delete normalize(row).byCompetition[competition.id];
    }
    return valid;
  }
  const api = { init, recordMatch, leaders, bestRated, bestYoung, bestCoach, teamOfSeason, closeSeason };
  root.ProLifeStatistics = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
