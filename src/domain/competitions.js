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
  const stateDates = [8, 13, 18, 23, 28, 33, 38, 43];
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
      champion: null, championId: null, runnerUp: null, runnerUpId: null,
    };
  }
  const blankStanding = () => ({ points: 0, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
  function groupRounds(ids) {
    const list = ids.slice(); if (list.length % 2) list.push(null);
    const rounds = [];
    for (let round = 0; round < list.length - 1; round++) {
      const pairs = [];
      for (let i = 0; i < list.length / 2; i++) {
        const home = list[i], away = list[list.length - 1 - i];
        if (home && away) pairs.push(round % 2 ? { home: away, away: home } : { home, away });
      }
      rounds.push(pairs); list.splice(1, 0, list.pop());
    }
    return rounds;
  }
  function buildStateTournament(s, code) {
    const clubs = shuffled(s.clubs.filter((c) => clubState(c) === code), `${s.season}:${code}`);
    if (!clubs.length) return null;
    const groupCount = clubs.length >= 8 ? Math.min(4, Math.floor(clubs.length / 2)) : clubs.length >= 4 ? 2 : 1;
    const groups = Array.from({ length: groupCount }, (_, index) => ({ id: String.fromCharCode(65 + index), clubIds: [] }));
    clubs.forEach((club, index) => groups[index % groupCount].clubIds.push(club.id));
    const maxRounds = Math.max(0, ...groups.map((group) => groupRounds(group.clubIds).length));
    const rounds = Array.from({ length: maxRounds }, (_, index) => ({ index, name: `Fase de grupos · Rodada ${index + 1}`, kind: "group", date: baseDay(s) + stateDates[index], pairs: [] }));
    for (const group of groups) groupRounds(group.clubIds).forEach((pairs, round) => rounds[round].pairs.push(...pairs.map((pair) => ({ ...pair, group: group.id, played: false, winnerId: null }))));
    const table = Object.fromEntries(clubs.map((club) => [club.id, blankStanding()]));
    const tournament = {
      id: "state-" + code.toLowerCase(), name: stateNames[code] || "Campeonato Estadual", state: code,
      season: s.season, formatVersion: 2, format: `${groups.length} grupo(s), classificados para mata-mata e final em jogo único.`,
      entrants: clubs.map((club) => club.id), groups, table, rounds, fixtures: rounds.flatMap((round) => round.pairs.map((pair) => ({ ...pair, date: round.date, stage: round.name }))),
      status: clubs.length === 1 ? "Finalizado" : "Fase de grupos", champion: clubs.length === 1 ? clubs[0].name : null,
      championId: clubs.length === 1 ? clubs[0].id : null, runnerUp: null, stats: blankStanding(),
    };
    return tournament;
  }
  function buildStates(s) {
    return Object.keys(stateNames).map((code) => buildStateTournament(s, code)).filter(Boolean);
  }
  function allStates(s) {
    const schedule = s.competitionSchedule || {};
    return [schedule.state, ...(schedule.otherStates || [])].filter(Boolean);
  }
  function stateTable(state, groupId = null) {
    const ids = groupId ? state.groups.find((group) => group.id === groupId)?.clubIds || [] : state.entrants || [];
    return ids.map((id) => ({ id, ...(state.table?.[id] || blankStanding()) })).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || a.id.localeCompare(b.id));
  }
  function assignCareerState(s, tournaments) {
    const code = clubState(s.clubs.find((club) => club.id === s.clubId));
    const state = tournaments.find((item) => item.state === code) || null;
    if (state) { state.clubId = s.clubId; state.stats = state.table[s.clubId] || blankStanding(); }
    return { state, otherStates: tournaments.filter((item) => item !== state) };
  }
  function syncCatalog(s) {
    const cup = s.competitionSchedule?.cup, states = allStates(s);
    s.competitions = catalog.map((c) => ({
      ...c, season: s.season,
      status: c.type === "league" ? "Em andamento" : (cup?.status || "Aguardando calendário"),
      champion: c.type === "cup" ? cup?.champion || null : null,
    }));
    for (const state of states) s.competitions.push({ id: state.id, name: state.name, type: "state", coverage: "simulated", season: s.season, status: state.status, champion: state.champion });
    return s.competitions;
  }
  function prepareSeason(s, orders) {
    if (s.world !== "brazil2026") return syncCatalog(s);
    const states = buildStates(s), assigned = assignCareerState(s, states);
    s.competitionSchedule = { season: s.season, cup: buildCup(s, orders), ...assigned };
    for (const state of states) fastForwardState(s, state);
    return syncCatalog(s);
  }
  function migrateStates(s) {
    const states = buildStates(s);
    Object.assign(s.competitionSchedule, assignCareerState(s, states));
    for (const state of states) fastForwardState(s, state);
    return syncCatalog(s);
  }
  function init(s) {
    const savedStates = s.competitionSchedule ? [s.competitionSchedule.state, ...(s.competitionSchedule.otherStates || [])].filter(Boolean) : [];
    if (s.world === "brazil2026" && (!s.competitionSchedule || s.competitionSchedule.season !== s.season)) prepareSeason(s);
    else if (s.world === "brazil2026" && (!savedStates.length || savedStates.some((state) => state.formatVersion !== 2))) migrateStates(s);
    else if (!Array.isArray(s.competitions)) syncCatalog(s);
    return s.competitions;
  }
  function ensureState(s) {
    if (s.world !== "brazil2026") return null;
    init(s);
    const tournaments = allStates(s), code = clubState(s.clubs.find((club) => club.id === s.clubId));
    if (s.competitionSchedule.state?.state !== code) Object.assign(s.competitionSchedule, assignCareerState(s, tournaments));
    const current = s.competitionSchedule.state;
    if (current) current.stats = current.table?.[s.clubId] || blankStanding();
    syncCatalog(s);
    return current;
  }
  function knockoutPairs(ids) {
    const seeded = ids.slice(), pairs = [];
    while (seeded.length > 1) pairs.push({ home: seeded.shift(), away: seeded.pop(), played: false, winnerId: null });
    return pairs;
  }
  function advanceState(s, state) {
    const pending = state.rounds.some((round) => round.pairs.some((pair) => !pair.played));
    if (pending || state.champion) return;
    const last = state.rounds.at(-1);
    let qualified;
    if (last?.kind === "group") qualified = state.groups.flatMap((group) => stateTable(state, group.id).slice(0, Math.min(2, group.clubIds.length)).map((row) => row.id));
    else qualified = last?.pairs.map((pair) => pair.winnerId) || [];
    if (qualified.length <= 1) {
      const championId = qualified[0] || state.entrants[0];
      state.championId = championId; state.champion = s.clubs.find((club) => club.id === championId)?.name || null;
      state.runnerUp = last?.kind === "knockout" && last.pairs.length === 1 ? s.clubs.find((club) => club.id === (last.pairs[0].home === championId ? last.pairs[0].away : last.pairs[0].home))?.name || null : null;
      state.status = "Finalizado"; return;
    }
    while (![2, 4, 8, 16].includes(qualified.length)) qualified.pop();
    const pairs = knockoutPairs(qualified), index = state.rounds.length;
    const name = qualified.length === 2 ? "Final" : qualified.length === 4 ? "Semifinal" : qualified.length === 8 ? "Quartas de final" : "Oitavas de final";
    const previousDate = last?.date || baseDay(s) + stateDates[0], date = Math.max(previousDate + 5, baseDay(s) + 28 + Math.max(0, index - 3) * 5);
    state.rounds.push({ index, name, kind: "knockout", date, pairs });
    state.fixtures.push(...pairs.map((pair) => ({ ...pair, date, stage: name })));
    state.status = name;
  }
  function fastForwardState(s, state) {
    while (!state.champion) {
      const round = state.rounds.find((item) => item.date < s.day && item.pairs.some((pair) => !pair.played));
      if (!round) break;
      for (const pair of round.pairs.filter((item) => !item.played)) {
        const home = s.clubs.find((club) => club.id === pair.home), away = s.clubs.find((club) => club.id === pair.away), seed = hash(`${s.season}:${state.id}:${round.index}:${pair.home}:${pair.away}`);
        const hg = Math.max(0, Math.round(1.2 + ((home?.structure || 50) - (away?.structure || 50)) / 24 + (seed % 3) - 1));
        const ag = Math.max(0, Math.round(1 + ((away?.structure || 50) - (home?.structure || 50)) / 28 + (Math.floor(seed / 7) % 3) - 1));
        let winnerId = null;
        if (round.kind === "knockout") winnerId = hg > ag ? pair.home : ag > hg ? pair.away : (seed % 2 ? pair.home : pair.away);
        Object.assign(pair, { played: true, hg, ag, winnerId, penalties: round.kind === "knockout" && hg === ag ? (winnerId === pair.home ? [5, 4] : [4, 5]) : null });
        const flat = state.fixtures.find((item) => !item.played && item.home === pair.home && item.away === pair.away && item.stage === round.name);
        if (flat) Object.assign(flat, pair);
        if (round.kind === "group") for (const [id, gf, ga] of [[pair.home, hg, ag], [pair.away, ag, hg]]) {
          const row = state.table[id]; row.played++; row.gf += gf; row.ga += ga;
          if (gf > ga) { row.w++; row.points += 3; } else if (gf === ga) { row.d++; row.points++; } else row.l++;
        }
      }
      advanceState(s, state);
    }
    if (state === s.competitionSchedule?.state) state.stats = state.table[s.clubId] || blankStanding();
  }
  function due(s) {
    init(s); ensureState(s);
    const result = [], cup = s.competitionSchedule?.cup;
    for (const state of allStates(s)) for (const round of state.rounds) if (round.date === s.day) for (const pair of round.pairs.filter((item) => !item.played)) result.push({ ...pair, competitionId: state.id, competitionName: state.name, round: round.index + 1, stage: round.name, kind: "state" });
    const round = cup?.rounds.find((r) => r.pairs.some((p) => !p.played));
    if (round?.date === s.day) for (const p of round.pairs.filter((x) => !x.played)) result.push({ ...p, competitionId: cup.id, competitionName: cup.name, round: round.index + 1, kind: "cup" });
    return result;
  }
  function recordResult(s, match, rng) {
    const schedule = s.competitionSchedule;
    if (!schedule) return match;
    const state = allStates(s).find((item) => item.id === match.competitionId);
    if (state) {
      const round = state.rounds.find((item) => item.pairs.some((pair) => !pair.played && pair.home === match.home && pair.away === match.away));
      const pair = round?.pairs.find((item) => !item.played && item.home === match.home && item.away === match.away);
      if (!pair) return match;
      let winnerId = null;
      if (round.kind === "knockout") {
        winnerId = match.hg > match.ag ? match.home : match.ag > match.hg ? match.away : (rng.next() < 0.5 ? match.home : match.away);
        if (match.hg === match.ag) { match.penalties = winnerId === match.home ? [5, 4] : [4, 5]; match.summary += " Classificação decidida nos pênaltis."; }
      }
      Object.assign(pair, { played: true, hg: match.hg, ag: match.ag, penalties: match.penalties || null, winnerId });
      const flat = state.fixtures.find((item) => !item.played && item.home === match.home && item.away === match.away && item.stage === round.name);
      if (flat) Object.assign(flat, pair);
      if (round.kind === "group") for (const [id, gf, ga] of [[match.home, match.hg, match.ag], [match.away, match.ag, match.hg]]) {
        const table = state.table[id] || (state.table[id] = blankStanding()); table.played++; table.gf += gf; table.ga += ga;
        if (gf > ga) { table.w++; table.points += 3; } else if (gf === ga) { table.d++; table.points++; } else table.l++;
      }
      if (state === schedule.state) state.stats = state.table[s.clubId] || blankStanding();
      advanceState(s, state);
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
          cup.championId = winners[0]; cup.runnerUpId = round.pairs[0].home === winners[0] ? round.pairs[0].away : round.pairs[0].home;
          cup.champion = s.clubs.find((c) => c.id === cup.championId)?.name || null;
          cup.runnerUp = s.clubs.find((c) => c.id === cup.runnerUpId)?.name || null;
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
  function fixtureStage(s, fixture) {
    if (!fixture) return "Sem compromisso";
    if (fixture.competitionId === "nationalTeam") return fixture.stage || "Seleção Brasileira";
    if (fixture.competitionId === "copaBrasil") {
      const round = s.competitionSchedule?.cup?.rounds?.find((r) => r.index + 1 === fixture.round);
      return round?.name || "Copa do Brasil";
    }
    if (String(fixture.competitionId || "").startsWith("state-")) {
      return fixture.stage || allStates(s).find((state) => state.id === fixture.competitionId)?.rounds?.find((round) => round.index + 1 === fixture.round)?.name || "Campeonato estadual";
    }
    return "Rodada " + fixture.round + "/" + (s.fixtures?.length || 38);
  }
  function clubStatus(s, clubId = s.clubId) {
    init(s); ensureState(s);
    const own = s.clubs.find((c) => c.id === clubId);
    if (!own) return [];
    const leagueTable = s.clubs.filter((c) => c.leagueId === own.leagueId).slice().sort((a,b) => b.stats.points-a.stats.points || (b.stats.gf-b.stats.ga)-(a.stats.gf-a.stats.ga) || b.stats.gf-a.stats.gf);
    const leagueNextRound = Math.min((s.round || 0) + 1, s.fixtures?.length || 38);
    const leagueDone = (s.round || 0) >= (s.fixtures?.length || 38);
    const league = {
      id: own.leagueId, name: leagueNames[own.leagueId] || "Liga Horizonte", type: "league",
      status: leagueDone ? "Finalizado" : "Rodada " + leagueNextRound + "/" + (s.fixtures?.length || 38),
      detail: "Posição: " + (leagueTable.findIndex((c) => c.id === clubId) + 1) + "º",
    };
    const cup = s.competitionSchedule?.cup;
    let cupStatus = "Não classificado", cupDetail = "Fora da edição atual";
    if (cup?.entrants?.some((e) => e.clubId === clubId)) {
      if (cup.champion) {
        cupStatus = cup.champion === own.name ? "Campeão" : "Eliminado";
        cupDetail = cup.champion === own.name ? "Título conquistado" : "Competição encerrada";
      } else {
        const pending = cup.rounds.flatMap((r) => r.pairs.map((pair) => ({ r, pair }))).find(({ pair }) => !pair.played && [pair.home, pair.away].includes(clubId));
        if (pending) { cupStatus = pending.r.name; cupDetail = "Próximo confronto definido"; }
        else {
          const played = cup.rounds.flatMap((r) => r.pairs.map((pair) => ({ r, pair }))).filter(({ pair }) => pair.played && [pair.home, pair.away].includes(clubId));
          const last = played.at(-1);
          cupStatus = last && last.pair.winnerId !== clubId ? "Eliminado" : (cup.status || "Aguardando próxima fase");
          cupDetail = last && last.pair.winnerId !== clubId ? "Eliminado em " + last.r.name : "Aguardando chave";
        }
      }
    }
    const state = allStates(s).find((item) => item.entrants?.includes(clubId));
    const stateStats = state?.table?.[clubId] || blankStanding();
    const stateItem = state ? {
      id: state.id, name: state.name, type: "state",
      status: state.champion ? (state.championId === clubId ? "Campeão" : "Finalizado") : state.status,
      detail: stateStats.points + " pts · " + stateStats.w + "V " + stateStats.d + "E " + stateStats.l + "D",
    } : null;
    return [league, { id: "copaBrasil", name: "Copa do Brasil", type: "cup", status: cupStatus, detail: cupDetail }, stateItem].filter(Boolean);
  }
  function nextFixture(s, clubId = s.clubId) {
    init(s); ensureState(s);
    const pending = [], state = allStates(s).find((item) => item.entrants?.includes(clubId)), cup = s.competitionSchedule?.cup;
    if (state) for (const round of state.rounds) for (const pair of round.pairs) if (!pair.played && [pair.home, pair.away].includes(clubId)) pending.push({ ...pair, date: round.date, round: round.index + 1, stage: round.name, competitionId: state.id, competitionName: state.name });
    if (cup) for (const r of cup.rounds) for (const p of r.pairs) if (!p.played && [p.home, p.away].includes(clubId)) pending.push({ ...p, date: r.date, round: r.index + 1, competitionId: cup.id, competitionName: cup.name });
    return pending.sort((a, b) => a.date - b.date)[0] || null;
  }
  function closeSeason(s, table) {
    init(s);
    for (const c of s.competitions.filter((x) => x.type === "league")) {
      c.champion = table(s, c.id)[0]?.name || null;
      c.status = "Finalizada";
    }
    const cup = s.competitionSchedule?.cup, states = allStates(s);
    if (cup && !cup.champion) cup.status = "Encerrada sem campeão";
    for (const state of states) if (!state.champion) state.status = "Encerrado sem campeão";
    syncCatalog(s);
  }
  function nextSeason(s, orders) { return prepareSeason(s, orders); }
  function statCompetitions(s) {
    init(s);
    return [...(s.leagues || []).map((league) => ({ id: league.id, name: league.name, type: "league" })), { id: "copaBrasil", name: "Copa do Brasil", type: "cup" }, ...allStates(s).map((state) => ({ id: state.id, name: state.name, type: "state" }))];
  }
  const api = { catalog, leagueNames, stateNames, clubState, nationalRanking, init, ensureState, prepareSeason, allStates, stateTable, statCompetitions, due, recordResult, fixtureStage, clubStatus, nextFixture, closeSeason, nextSeason };
  root.ProLifeCompetitions = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
