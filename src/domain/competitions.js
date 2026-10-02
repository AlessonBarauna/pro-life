(function (root) {
  "use strict";
  const leagueNames = {
    serieA: "Brasileirão Série A",
    serieB: "Brasileirão Série B",
    serieC: "Brasileirão Série C",
    serieD: "Brasileirão Série D",
  };
  const stateNames = {
    SP: "Campeonato Paulista", RJ: "Campeonato Carioca", MG: "Campeonato Mineiro",
    RS: "Campeonato Gaúcho", PR: "Campeonato Paranaense", SC: "Campeonato Catarinense",
    BA: "Campeonato Baiano", PE: "Campeonato Pernambucano", CE: "Campeonato Cearense",
    GO: "Campeonato Goiano", PA: "Campeonato Paraense", AL: "Campeonato Alagoano",
    RN: "Campeonato Potiguar", PB: "Campeonato Paraibano", SE: "Campeonato Sergipano",
    AM: "Campeonato Amazonense", MT: "Campeonato Mato-Grossense", DF: "Campeonato Brasiliense",
    PI: "Campeonato Piauiense", TO: "Campeonato Tocantinense",
  };
  const cityStates = {
    Curitiba: "PR", Londrina: "PR", "Ponta Grossa": "PR", Maringá: "PR", Cianorte: "PR",
    "Belo Horizonte": "MG", "São João del-Rei": "MG", "Poços de Caldas": "MG",
    Salvador: "BA", Juazeiro: "BA", "Rio de Janeiro": "RJ", "Volta Redonda": "RJ", "Nova Iguaçu": "RJ",
    Chapecó: "SC", Florianópolis: "SC", Criciúma: "SC", Brusque: "SC", Joinville: "SC",
    "São Paulo": "SP", Mirassol: "SP", "Bragança Paulista": "SP", Santos: "SP", "Ribeirão Preto": "SP",
    "Novo Horizonte": "SP", Campinas: "SP", "São Bernardo do Campo": "SP", Diadema: "SP", Araraquara: "SP", Limeira: "SP",
    "Porto Alegre": "RS", "Caxias do Sul": "RS", Erechim: "RS", Pelotas: "RS", Belém: "PA",
    Goiânia: "GO", Anápolis: "GO", Maceió: "AL", Arapiraca: "AL", Fortaleza: "CE", Cuiabá: "MT",
    Recife: "PE", Natal: "RN", Manaus: "AM", "João Pessoa": "PB", Sousa: "PB", "Campina Grande": "PB",
    Aracaju: "SE", Itabaiana: "SE", Brasília: "DF", Altos: "PI", Tocantinópolis: "TO",
  };
  const catalog = [
    ...Object.entries(leagueNames).map(([id, name]) => ({ id, name, type: "league", coverage: ["serieC", "serieD"].includes(id) ? "partial" : "complete" })),
    { id: "copaBrasil", name: "Copa do Brasil", type: "cup", coverage: "simulated" },
  ];
  const cupDates = [50, 100, 170, 240, 340];
  const cupRoundNames = ["Primeira fase", "Oitavas de final", "Quartas de final", "Semifinal", "Final"];
  const stateDates = [8, 12, 16, 20, 24];
  const baseDay = (s) => (s.season - 2026) * 365;
  function hash(value) {
    let h = 2166136261;
    for (const c of String(value)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  function shuffled(values, seed) {
    return values.slice().sort((a, b) => hash(seed + ":" + a.id) - hash(seed + ":" + b.id));
  }
  function clubState(club) { return cityStates[club?.city] || null; }
  function nationalRanking(s) {
    return s.clubs.slice().sort((a, b) => b.structure - a.structure || b.stats.points - a.stats.points || a.name.localeCompare(b.name));
  }
  function leagueOrder(s, id, orders) {
    if (orders?.[id]) return orders[id];
    return s.clubs.filter((c) => c.leagueId === id).slice().sort((a, b) => b.stats.points - a.stats.points || b.structure - a.structure || a.name.localeCompare(b.name));
  }
  function cupEntrants(s, orders) {
    const ranking = nationalRanking(s), rank = new Map(ranking.map((c, i) => [c.id, i + 1])), selected = [];
    for (const id of Object.keys(leagueNames)) {
      for (const c of leagueOrder(s, id, orders).slice(0, 4)) selected.push({ clubId: c.id, rank: rank.get(c.id), qualifiedBy: "Top 4 da " + leagueNames[id] });
    }
    const chosen = new Set(selected.map((x) => x.clubId));
    const extra = shuffled(ranking.filter((c) => !chosen.has(c.id)), s.season).slice(0, 16);
    for (const c of extra) selected.push({ clubId: c.id, rank: rank.get(c.id), qualifiedBy: "Ranking e sorteio nacional" });
    return selected.sort((a, b) => a.rank - b.rank);
  }
  function pairSeeds(ids, entrantMap) {
    const seeded = ids.slice().sort((a, b) => entrantMap.get(a).rank - entrantMap.get(b).rank), pairs = [];
    while (seeded.length) pairs.push({ home: seeded.shift(), away: seeded.pop(), played: false, winnerId: null });
    return pairs;
  }
  function buildCup(s, orders) {
    const entrants = cupEntrants(s, orders), map = new Map(entrants.map((x) => [x.clubId, x]));
    return {
      id: "copaBrasil", name: "Copa do Brasil", season: s.season, status: "Classificados definidos",
      format: "Adaptação com 32 clubes: top 4 de A/B/C/D + 16 por ranking e sorteio.", entrants,
      rounds: [{ index: 0, name: cupRoundNames[0], date: baseDay(s) + cupDates[0], pairs: pairSeeds(entrants.map((x) => x.clubId), map) }],
      champion: null, runnerUp: null,
    };
  }
  function buildState(s) {
    const own = s.clubs.find((c) => c.id === s.clubId), code = clubState(own);
    if (!own || !code) return null;
    const candidates = shuffled(s.clubs.filter((c) => c.id !== own.id && clubState(c) === code), s.season + ":" + own.id).slice(0, 5);
    if (!candidates.length) return null;
    const fixtures = candidates.map((opponent, i) => ({
      date: baseDay(s) + stateDates[i], home: i % 2 ? opponent.id : own.id,
      away: i % 2 ? own.id : opponent.id, played: false,
    })).filter((fixture) => fixture.date >= s.day);
    return {
      id: "state-" + code.toLowerCase(), name: stateNames[code] || "Campeonato Estadual", state: code,
      season: s.season, clubId: own.id, status: fixtures.length ? "Em andamento" : "Calendário encerrado", champion: null,
      stats: { points: 0, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      fixtures,
    };
  }
  function syncCatalog(s) {
    const cup = s.competitionSchedule?.cup, state = s.competitionSchedule?.state;
    s.competitions = catalog.map((c) => ({
      ...c, season: s.season,
      status: c.type === "league" ? "Em andamento" : (cup?.status || "Aguardando calendário"),
      champion: c.type === "cup" ? cup?.champion || null : null,
    }));
    if (state) s.competitions.push({ id: state.id, name: state.name, type: "state", coverage: "career", season: s.season, status: state.status, champion: state.champion });
    return s.competitions;
  }
  function prepareSeason(s, orders) {
    if (s.world !== "brazil2026") return syncCatalog(s);
    s.competitionSchedule = { season: s.season, cup: buildCup(s, orders), state: buildState(s) };
    return syncCatalog(s);
  }
  function init(s) {
    if (s.world === "brazil2026" && (!s.competitionSchedule || s.competitionSchedule.season !== s.season)) prepareSeason(s);
    else if (!Array.isArray(s.competitions)) syncCatalog(s);
    return s.competitions;
  }
  function ensureState(s) {
    if (s.world !== "brazil2026") return null;
    init(s);
    const current = s.competitionSchedule.state;
    if (current?.fixtures?.some((fixture) => !fixture.played && fixture.date < s.day)) {
      current.fixtures = current.fixtures.filter((fixture) => fixture.played || fixture.date >= s.day);
      if (!current.fixtures.some((fixture) => !fixture.played)) current.status = "Calendário encerrado";
      syncCatalog(s);
    }
    if (s.clubId && (!current || (current.clubId !== s.clubId && s.day - baseDay(s) < 25))) {
      s.competitionSchedule.state = buildState(s);
      syncCatalog(s);
    }
    return s.competitionSchedule.state;
  }
  function due(s) {
    init(s); ensureState(s);
    const result = [], state = s.competitionSchedule?.state, cup = s.competitionSchedule?.cup;
    if (state) for (let i = 0; i < state.fixtures.length; i++) {
      const f = state.fixtures[i];
      if (!f.played && f.date === s.day) result.push({ ...f, competitionId: state.id, competitionName: state.name, round: i + 1, kind: "state" });
    }
    const round = cup?.rounds.find((r) => r.pairs.some((p) => !p.played));
    if (round?.date === s.day) for (const p of round.pairs.filter((x) => !x.played)) result.push({ ...p, competitionId: cup.id, competitionName: cup.name, round: round.index + 1, kind: "cup" });
    return result;
  }
  function recordResult(s, match, rng) {
    const schedule = s.competitionSchedule;
    if (!schedule) return match;
    if (match.competitionId === schedule.state?.id) {
      const state = schedule.state, fixture = state.fixtures.find((f) => !f.played && f.home === match.home && f.away === match.away);
      if (!fixture) return match;
      Object.assign(fixture, { played: true, hg: match.hg, ag: match.ag });
      const ownHome = match.home === state.clubId, gf = ownHome ? match.hg : match.ag, ga = ownHome ? match.ag : match.hg, t = state.stats;
      t.played++; t.gf += gf; t.ga += ga;
      if (gf > ga) { t.w++; t.points += 3; } else if (gf === ga) { t.d++; t.points++; } else t.l++;
      if (state.fixtures.every((f) => f.played)) {
        state.status = "Finalizado";
        const own = s.clubs.find((c) => c.id === state.clubId), strongest = state.fixtures.map((f) => s.clubs.find((c) => c.id === (f.home === state.clubId ? f.away : f.home))).filter(Boolean).sort((a, b) => b.structure - a.structure)[0];
        state.champion = t.points >= Math.ceil(state.fixtures.length * 1.8) ? own?.name : strongest?.name;
      }
    }
    if (match.competitionId === schedule.cup?.id) {
      const cup = schedule.cup, round = cup.rounds.find((r) => r.pairs.some((p) => !p.played)), pair = round?.pairs.find((p) => !p.played && p.home === match.home && p.away === match.away);
      if (!pair) return match;
      const winnerId = match.hg > match.ag ? match.home : match.ag > match.hg ? match.away : (rng.next() < 0.5 ? match.home : match.away);
      if (match.hg === match.ag) {
        match.penalties = winnerId === match.home ? [5, 4] : [4, 5];
        match.summary += " Classificação decidida nos pênaltis.";
      }
      match.winnerId = winnerId;
      Object.assign(pair, { played: true, hg: match.hg, ag: match.ag, penalties: match.penalties || null, winnerId });
      if (round.pairs.every((p) => p.played)) {
        const winners = round.pairs.map((p) => p.winnerId);
        if (winners.length === 1) {
          cup.champion = s.clubs.find((c) => c.id === winners[0])?.name || null;
          cup.runnerUp = s.clubs.find((c) => c.id === (round.pairs[0].home === winners[0] ? round.pairs[0].away : round.pairs[0].home))?.name || null;
          cup.status = "Finalizada";
        } else {
          const entrantMap = new Map(cup.entrants.map((x) => [x.clubId, x])), index = round.index + 1;
          cup.rounds.push({ index, name: cupRoundNames[index], date: baseDay(s) + cupDates[index], pairs: pairSeeds(winners, entrantMap) });
          cup.status = cupRoundNames[index];
        }
      }
    }
    syncCatalog(s);
    return match;
  }
  function nextFixture(s, clubId = s.clubId) {
    init(s); ensureState(s);
    const pending = [], state = s.competitionSchedule?.state, cup = s.competitionSchedule?.cup;
    if (state) for (let i = 0; i < state.fixtures.length; i++) {
      const f = state.fixtures[i];
      if (!f.played && [f.home, f.away].includes(clubId)) pending.push({ ...f, round: i + 1, competitionId: state.id, competitionName: state.name });
    }
    if (cup) for (const r of cup.rounds) for (const p of r.pairs) if (!p.played && [p.home, p.away].includes(clubId)) pending.push({ ...p, date: r.date, round: r.index + 1, competitionId: cup.id, competitionName: cup.name });
    return pending.sort((a, b) => a.date - b.date)[0] || null;
  }
  function closeSeason(s, table) {
    init(s);
    for (const c of s.competitions.filter((x) => x.type === "league")) {
      c.champion = table(s, c.id)[0]?.name || null;
      c.status = "Finalizada";
    }
    const cup = s.competitionSchedule?.cup, state = s.competitionSchedule?.state;
    if (cup && !cup.champion) cup.status = "Encerrada sem campeão";
    if (state && !state.champion) state.status = "Encerrado";
    syncCatalog(s);
  }
  function nextSeason(s, orders) { return prepareSeason(s, orders); }
  const api = { catalog, leagueNames, stateNames, clubState, nationalRanking, init, ensureState, prepareSeason, due, recordResult, nextFixture, closeSeason, nextSeason };
  root.ProLifeCompetitions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
