"use strict";

const fs = typeof require === "function" ? require("fs") : null;

const FORMAT = "PRO_LIFE_FC27_MANIFEST_V1";

function validate(manifest) {
  if (!manifest || manifest.format !== FORMAT)
    throw Error("Formato FC27 incompatível.");

  const leagues = manifest.leagues || [];
  const clubs = manifest.clubs || [];
  const players = manifest.players || [];

  const leagueIds = new Set(leagues.map(x => x.id));
  const clubIds = new Set(clubs.map(x => x.id));
  const playerIds = new Set(players.map(x => x.id));

  if (leagueIds.size !== leagues.length)
    throw Error("Ligas duplicadas.");

  if (clubIds.size !== clubs.length)
    throw Error("Clubes duplicados.");

  if (playerIds.size !== players.length)
    throw Error("Jogadores duplicados.");

  if (clubs.some(c => !leagueIds.has(c.leagueId)))
    throw Error("Clube sem liga válida.");

  if (players.some(p => !clubIds.has(p.clubId)))
    throw Error("Jogador sem clube válido.");

  if (players.some(p =>
    !Number.isFinite(Number(p.overall)) ||
    !["GOL","DEF","MEI","ATA"].includes(p.pos)
  )) throw Error("Jogador com atributos inválidos.");

  const ownership = new Map();

  for (const club of clubs) {
    for (const id of club.playerIds || []) {
      ownership.set(id, (ownership.get(id) || 0) + 1);
    }
  }

  if (players.some(p => ownership.get(p.id) !== 1))
    throw Error("Vínculo de jogador inconsistente.");

  return {
    leagues: leagues.length,
    clubs: clubs.length,
    players: players.length
  };
}

function load(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  validate(data);
  return data;
}



function estimatePotential(player, season = 2026) {
  const overall = Number(player.overall);
  const age = season - Number(player.birthYear);

  if (!Number.isFinite(overall) || !Number.isFinite(age))
    throw Error("Dados invalidos para potencial.");

  const bonus =
    age <= 18 ? 12 :
    age <= 21 ? 10 :
    age <= 24 ? 7 :
    age <= 27 ? 4 :
    age <= 30 ? 2 : 0;

  return Math.min(99, Math.max(overall, overall + bonus));
}

function buildCatalog(manifest) {
  validate(manifest);

  const leagues = manifest.leagues.map(l => ({
    id: l.id,
    name: l.name,
    shortName: l.name,
    source: "EA SPORTS FC 27",
    active: true
  }));

  const clubs = manifest.clubs.map(c => ({
    id: c.id,
    name: c.name,
    shortName: c.name,
    leagueId: c.leagueId,
    active: true,
    division: 1,
    roster: [],
    playerIds: [...c.playerIds]
  }));

  const clubIndex = new Map(
    clubs.map(c => [c.id, c])
  );

  const players = manifest.players.map(p => ({
    id: p.id,
    eaId: p.eaId,
    name: p.name,
    shortName: p.commonName || p.name,
    birthYear: p.birthYear,
    nationality: p.nationality,
    clubId: p.clubId,
    pos: p.pos,
    secondaryPositions: [...p.secondaryPositions],
    ovr: p.overall,
    overall: p.overall,
    potential: p.potential ?? estimatePotential(p),
    active: true,
    status: "active",
    external: true
  }));

  for (const p of players) {
    clubIndex.get(p.clubId).roster.push(p.id);
  }

  return {
    catalogVersion: "fc27_v1",
    leagues,
    clubs,
    players
  };
}


// ===== Etapa 34F.12 - instalacao experimental do catalogo FC 27 em um estado novo =====
const CATALOG_VERSION = "fc27_v1";
let manifestCache = null;
let catalogCache = null;

// Node: JSON local. Navegador: manifesto ja registrado em globalThis. Nunca usa fetch.
function getManifest() {
  if (manifestCache) return manifestCache;
  let data = typeof globalThis !== "undefined" ? globalThis.ProLifeFC27Manifest : null;
  if (!data && fs && typeof require === "function") {
    const path = require("path");
    data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "fc27", "fc27-manifest-v1.json"), "utf8"));
  }
  if (!data) throw Error("Manifesto FC27 indisponivel.");
  validate(data);
  manifestCache = data;
  return data;
}

const clampNum = (v, a, b) => Math.max(a, Math.min(b, v));
const modeOf = (list) => {
  const count = new Map();
  for (const v of list) if (v) count.set(v, (count.get(v) || 0) + 1);
  let best = null, n = 0;
  for (const [k, c] of count) if (c > n || (c === n && String(k) < String(best))) { best = k; n = c; }
  return best;
};

// Forma de estado (clubes/ligas/jogadores) derivada do catalogo; deterministica.
function stateCatalog() {
  if (catalogCache) return catalogCache;
  const cat = buildCatalog(getManifest());
  const playerById = new Map(cat.players.map(p => [p.id, p]));
  const leagueClubs = new Map();
  const clubs = cat.clubs.map(c => {
    const ovrs = c.playerIds.map(id => playerById.get(id).overall).sort((a, b) => b - a).slice(0, 16);
    const strength = clampNum(Math.round(ovrs.reduce((x, y) => x + y, 0) / Math.max(1, ovrs.length)), 30, 99);
    const reputation = clampNum(Math.round((strength - 45) * 2.1), 20, 99);
    const out = {
      id: c.id, name: c.name, shortName: c.shortName, leagueId: c.leagueId, division: 1,
      reputation, strength, structure: strength, budget: Math.round(Math.pow(reputation / 100, 6) * 400) * 1000000,
      active: true, fc27: true
    };
    if (!leagueClubs.has(c.leagueId)) leagueClubs.set(c.leagueId, []);
    leagueClubs.get(c.leagueId).push(out);
    return out;
  });
  const leagues = cat.leagues.map(l => {
    const own = leagueClubs.get(l.id) || [];
    const nations = [];
    for (const c of cat.clubs) if (c.leagueId === l.id) for (const id of c.playerIds) nations.push(playerById.get(id).nationality);
    const country = modeOf(nations) || "Mundo";
    for (const c of own) c.country = country;
    const reputation = own.length ? clampNum(Math.round(own.reduce((x, c) => x + c.reputation, 0) / own.length), 20, 99) : 50;
    return {
      id: l.id, name: l.name, shortName: l.shortName, country, level: 1, clubCount: own.length, reputation,
      continent: "Mundo", confederation: "WORLD", active: true, competitionEligible: true, source: l.source
    };
  });
  const players = cat.players.map(p => ({
    id: p.id, eaId: p.eaId, name: p.name, shortName: p.shortName, nationality: p.nationality, birthYear: p.birthYear,
    pos: p.pos, secondaryPositions: [...p.secondaryPositions], ovr: p.overall, overall: p.overall, potential: p.potential,
    clubId: p.clubId, status: "active", active: true,
    reputation: Math.max(40, p.overall - 12), external: true, marketStatus: "external"
  }));
  const leagueOfClub = new Map(clubs.map(c => [c.id, c.leagueId]));
  for (const p of players) p.leagueId = leagueOfClub.get(p.clubId);
  catalogCache = { leagues, clubs, players };
  return catalogCache;
}

// Prepara a representacao internacional ANTES de GlobalFootball.init(): ligas/clubes em globalFootball e
// atletas em internationalPlayers. Idempotente; nao toca em s.clubs (clubes brasileiros locais).
function installState(s) {
  if (!s || typeof s !== "object") throw Error("Estado invalido.");
  if (s.globalFootball?.fc27?.version === CATALOG_VERSION) return s;
  if ((s.internationalPlayers || []).length || (s.globalFootball?.clubs || []).length)
    throw Error("Estado ja possui catalogo internacional; FC27 so pode ser instalado em estado novo.");
  const cat = stateCatalog();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  s.catalogVersion = CATALOG_VERSION;
  s.globalFootball = {
    version: 1, baseYear: 2026, leagues: clone(cat.leagues), clubs: clone(cat.clubs), retirements: [], processedSeasons: {}, packs: {},
    fc27: { version: CATALOG_VERSION, leagues: cat.leagues.length, clubs: cat.clubs.length, players: cat.players.length }
  };
  s.internationalPlayers = clone(cat.players);
  return s;
}

function summary(s) {
  return { leagues: (s.globalFootball?.leagues || []).length, clubs: (s.globalFootball?.clubs || []).length, players: (s.internationalPlayers || []).length };
}

const API = {
  estimatePotential,
  buildCatalog,
  CATALOG_VERSION,
  getManifest,
  installState,
  summary,
  FORMAT,
  validate,
  load
};

if (typeof globalThis !== "undefined")
  globalThis.ProLifeFC27CatalogAdapter = API;

if (typeof module !== "undefined" && module.exports)
  module.exports = API;
