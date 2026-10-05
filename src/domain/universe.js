(function (root) {
  "use strict";
  // Etapa 15 — Mundo vivo: evolução/declínio, contratos, mercado da IA, aposentadorias e novos talentos.
  // Princípios: (1) o protagonista (id "hero") nunca é alterado aqui; (2) idade canônica = player.age, avançada uma vez por virada de temporada;
  // (3) todo sorteio usa RNG derivado de (universe.seed, temporada, fase) — independente do RNG das partidas e sem Math.random()/Date.now();
  // (4) cada fase tem marcador em universe.done, então salvar/recarregar nunca repete aposentadoria, geração, transferência ou progressão;
  // (5) processamento por evento (janela) e por fim de temporada, nunca por dia, com shortlist antes de avaliar alvos.
  const Training = root.ProLifeTraining || (typeof require === "function" ? require("./training.js") : null);
  const Creation = root.ProLifeCreation || (typeof require === "function" ? require("./creation.js") : null);
  const VERSION = 1;
  const CORE = ["pace", "finish", "pass", "defense", "strength", "stamina"];
  const POS = ["GOL", "DEF", "MEI", "ATA"];
  const TARGET = { GOL: 2, DEF: 7, MEI: 7, ATA: 5 };
  const MINIMUM = { GOL: 2, DEF: 5, MEI: 5, ATA: 3 };
  const STARTERS = { GOL: 1, DEF: 4, MEI: 4, ATA: 2 };
  const ROSTER_MAX = 34;
  const WEIGHTS = {
    GOL: { pace: 0.08, finish: 0.03, pass: 0.12, defense: 0.32, strength: 0.2, stamina: 0.25 },
    DEF: { pace: 0.13, finish: 0.04, pass: 0.12, defense: 0.34, strength: 0.22, stamina: 0.15 },
    MEI: { pace: 0.14, finish: 0.13, pass: 0.32, defense: 0.1, strength: 0.09, stamina: 0.22 },
    ATA: { pace: 0.23, finish: 0.32, pass: 0.13, defense: 0.03, strength: 0.12, stamina: 0.17 },
  };
  // Janelas (mesmas da Etapa 7, career.js): início, meio e final do ano.
  const WINDOWS = [{ id: 0, start: 0, end: 58 }, { id: 1, start: 181, end: 242 }, { id: 2, start: 318, end: 364 }];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const logistic = (x) => 1 / (1 + Math.exp(-x));

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const unit = (id, salt) => hash(String(id) + "|" + salt) / 4294967296;
  const money = (v) => "R$ " + Number(v).toLocaleString("pt-BR");

  const firstNames = ["Ademir", "Alan", "Alex", "Anderson", "Arthur", "Augusto", "Benício", "Breno", "Bruno", "Caio", "Carlos", "César", "Cléber", "Danilo", "Davi", "Diego", "Douglas", "Edson", "Elias", "Emerson", "Enzo", "Everton", "Fábio", "Felipe", "Fernando", "Gabriel", "Gilberto", "Giovani", "Guilherme", "Gustavo", "Heitor", "Henrique", "Hugo", "Igor", "Isaac", "Jair", "Jean", "Joaquim", "Jonas", "Jorge", "José", "Julio", "Kaique", "Kleber", "Leandro", "Leonardo", "Lucas", "Luan", "Luiz", "Mateus", "Marcelo", "Marcos", "Matheus", "Murilo", "Nathan", "Neto", "Otávio", "Paulo", "Pedro", "Rafael", "Raul", "Renan", "Ricardo", "Roberto", "Rodrigo", "Ronaldo", "Samuel", "Sérgio", "Tiago", "Thales", "Vagner", "Vinícius", "Vitor", "Wellington", "Wesley", "Yago", "Yuri"];
  const lastNames = ["Alves", "Andrade", "Araújo", "Azevedo", "Barbosa", "Barros", "Batista", "Borges", "Campos", "Cardoso", "Carvalho", "Castro", "Cavalcante", "Coelho", "Correia", "Costa", "Dias", "Duarte", "Farias", "Ferraz", "Ferreira", "Fonseca", "Freitas", "Gomes", "Guimarães", "Lacerda", "Leite", "Lima", "Lopes", "Machado", "Magalhães", "Marques", "Martins", "Mendes", "Moraes", "Moreira", "Moura", "Nascimento", "Nogueira", "Nunes", "Oliveira", "Pacheco", "Paiva", "Pereira", "Pinto", "Ramos", "Rezende", "Ribeiro", "Rocha", "Rodrigues", "Salles", "Santana", "Santos", "Siqueira", "Soares", "Souza", "Teixeira", "Torres", "Vasconcelos", "Vieira", "Xavier"];
  const foreign = [["Argentina", ["Matías", "Nicolás", "Facundo", "Lautaro", "Santiago"], ["Fernández", "Gómez", "Pereyra", "Acosta", "Benítez"]], ["Uruguai", ["Federico", "Maximiliano", "Rodrigo", "Agustín"], ["Techera", "Cabrera", "Núñez", "Olivera"]], ["Colômbia", ["Juan", "Andrés", "Camilo", "Sebastián"], ["Ríos", "Mosquera", "Cuesta", "Valencia"]], ["Paraguai", ["Derlis", "Óscar", "Alan", "Fabián"], ["Ayala", "Giménez", "Bogado", "Villalba"]], ["Chile", ["Cristóbal", "Matías", "Felipe", "Ignacio"], ["Muñoz", "Contreras", "Araya", "Soto"]], ["Portugal", ["Tomás", "Rúben", "Diogo", "Nuno"], ["Cardoso", "Matos", "Figueiredo", "Pires"]]];

  // ---------- estado ----------
  function init(s, api, seed) {
    if (api?.overall) overallFn = api.overall;
    if (!s.universe || typeof s.universe !== "object") {
      const base = Number.isFinite(Number(seed)) ? Number(seed) >>> 0 : hash(`${s.clubs?.length || 0}|${s.clubs?.[0]?.roster?.[0]?.id || ""}|${s.clubs?.[s.clubs.length - 1]?.roster?.[0]?.id || ""}|${s.mode}`);
      const day = s.day % 365, done = {};
      // A janela corrente (e as anteriores do ano) não são reprocessadas: sem retroatividade em saves antigos e no início de carreira.
      for (const w of WINDOWS) if (w.start <= day) done[`${s.season}:w${w.id}:a`] = done[`${s.season}:w${w.id}:b`] = 1;
      s.universe = { version: VERSION, seed: (base ^ 0x9e3779b1) >>> 0 || 1, lastRolled: s.season, done, nextYouth: 0, transfers: [], retirements: [], free: [], retiredCount: 0, generatedCount: 0, transferCount: 0, seasons: [], perf: null, credit: {} };
    }
    const u = s.universe;
    if (!Array.isArray(u.transfers)) u.transfers = [];
    if (!Array.isArray(u.retirements)) u.retirements = [];
    if (!Array.isArray(u.free)) u.free = [];
    if (!Array.isArray(u.seasons)) u.seasons = [];
    if (!u.done) u.done = {};
    if (!u.credit) u.credit = {};
    for (const c of s.clubs || []) {
      if (!Number.isFinite(c.baseStructure)) c.baseStructure = c.structure;
      if (!Number.isFinite(c.baseSize)) c.baseSize = clamp(c.roster.length, 22, ROSTER_MAX);
      for (const p of c.roster) { stripSubs(p); ensurePlayer(p, c, s); }
    }
    for (const p of u.free) { stripSubs(p); ensurePlayer(p, null, s); }
    return u;
  }
  // Jogadores da IA guardam apenas os seis atributos principais (subatributos são do protagonista): save ~60% menor, mesmo overall.
  function stripSubs(p) { if (p.id === "hero" || !p.attrs) return; for (const k of Object.keys(p.attrs)) if (!CORE.includes(k)) delete p.attrs[k]; }
  // Estado mínimo e determinístico por jogador (sem tocar em RNG): contrato e potencial coerentes.
  function ensurePlayer(p, c, s) {
    if (p.id === "hero") return p;
    if (!p.contract) {
      const yrs = p.age <= 21 ? 2 + Math.floor(unit(p.id, "c") * 3) : 1 + Math.floor(unit(p.id, "c") * 3);
      p.contract = { end: s.season + yrs - 1, salary: salaryOf(p, c) };
    }
    if (p.age <= 27 && !p.generated) {
      // Potencial coerente com o nível atual e a idade (evita "explosão de estrelas" por potenciais sorteados sem relação com o overall).
      const o = ovrOf(p), left = Math.max(0, 25 - p.age), u2 = unit(p.id, "p");
      const cap = o + 1 + Math.round(left * (0.35 + 1.5 * u2 * u2));
      p.potential = Math.max(o + 1, Math.min(Number.isFinite(p.potential) ? p.potential : cap, cap));
    }
    if (!Number.isFinite(p.potential)) p.potential = clamp(ovrOf(p) + 3, 40, 95);
    return p;
  }
  let overallFn = null;
  function ovrOf(p) { return (overallFn || root.ProLife?.overall)(p); }
  function salaryOf(p, c) {
    const lvl = c ? c.structure : 50;
    return Math.max(1500, Math.round(2500 * Math.pow(1.14, ovrOf(p) - 55) * (0.6 + lvl / 100) / 500) * 500);
  }
  function valueOf(p, ovr) {
    const o = ovr ?? ovrOf(p), age = p.age;
    const ageF = age <= 19 ? 1.35 : age <= 22 ? 1.2 : age <= 27 ? 1 : age <= 30 ? 0.8 : age <= 33 ? 0.45 : 0.2;
    const potF = age <= 24 ? 1 + clamp((p.potential - o) / 40, 0, 0.6) : 1;
    return Math.max(50000, Math.round(150000 * Math.pow(1.22, o - 55) * ageF * potF / 10000) * 10000);
  }
  function rngFor(s, api, tag) { return new api.Random((hash(`${s.universe.seed}|${tag}`) ^ s.universe.seed) >>> 0 || 1); }

  // ---------- necessidade de elenco (reutilizável) ----------
  // squadNeeds(club): contagem por posição, qualidade dos titulares, idade e contratos. need > 0 indica prioridade de mercado.
  function squadNeeds(s, club, api, cache) {
    const ov = (p) => (cache ? (cache.get(p) ?? (cache.set(p, ovrOf(p)), cache.get(p))) : ovrOf(p));
    const players = club.roster.filter((p) => p.id !== "hero");
    const top = players.map(ov).sort((a, b) => b - a).slice(0, 14), level = top.length ? top.reduce((n, x) => n + x, 0) / top.length : 50;
    const byPos = {};
    for (const pos of POS) {
      const list = players.filter((p) => p.pos === pos).sort((a, b) => ov(b) - ov(a));
      const starters = list.slice(0, STARTERS[pos]), avg = starters.length ? starters.reduce((n, p) => n + ov(p), 0) / starters.length : 0;
      const deficit = Math.max(0, TARGET[pos] - list.length), surplus = Math.max(0, list.length - TARGET[pos] - 2);
      const aging = starters.filter((p) => p.age >= 33).length, expiring = starters.filter((p) => p.contract && p.contract.end <= s.season).length;
      const gap = list.length ? clamp((level - avg) / 6, -1, 1.6) : 1.6;
      const need = deficit * 1.2 + gap * (pos === "GOL" ? 0.8 : 1) + aging * 0.4 + expiring * 0.2 - surplus * 0.8;
      byPos[pos] = { count: list.length, target: TARGET[pos], deficit, surplus, startersAvg: Math.round(avg * 10) / 10, aging, expiring, need: Math.round(need * 100) / 100 };
    }
    const ranked = POS.slice().sort((a, b) => byPos[b].need - byPos[a].need || POS.indexOf(a) - POS.indexOf(b));
    return { level: Math.round(level * 10) / 10, size: players.length, byPos, priority: ranked[0], ranked };
  }

  // ---------- desenvolvimento / declínio ----------
  function snapshotPerformance(s) {
    const u = s.universe, rows = s.statistics?.players || {}, perf = {};
    for (const c of s.clubs) for (const p of c.roster) {
      if (p.id === "hero") continue;
      const r = rows[p.id] || {};
      perf[p.id] = { apps: r.appearances || 0, goals: r.goals || 0, assists: r.assists || 0, rating: r.appearances ? r.ratingTotal / r.appearances : 0, minutes: p.minutes || 0, clubId: c.id };
    }
    u.perf = perf;
    return perf;
  }
  function growthShare(age) { return age <= 18 ? 0.27 : age <= 20 ? 0.27 : age <= 22 ? 0.26 : age <= 24 ? 0.24 : age <= 26 ? 0.12 : 0.04; }
  function declineRate(age, pos) {
    const a = age - (pos === "GOL" ? 3.5 : 0);
    return a < 29.5 ? 0 : clamp(0.4 + (a - 30) * 0.42, 0.2, 3.2);
  }
  function shiftAttrs(p, total, weights, shape, rng) {
    // total = variação desejada de overall; shape distribui pelos atributos principais (físicos caem mais; foco da posição cresce mais).
    const norm = CORE.reduce((n, k) => n + weights[k] * shape[k], 0) || 1, scale = total / norm;
    let moved = 0;
    for (const k of CORE) {
      const raw = scale * shape[k], base = Math.trunc(raw), frac = Math.abs(raw - base);
      const d = base + (rng.next() < frac ? Math.sign(raw) : 0);
      if (!d) continue;
      const before = p.attrs[k];
      p.attrs[k] = clamp(before + d, 20, 96);
      const real = p.attrs[k] - before;
      if (real) moved += real;
    }
    return moved;
  }
  function develop(p, club, perf, level, rng, season) {
    const before = ovrOf(p), w = WEIGHTS[p.pos] || WEIGHTS.MEI, maxMin = club ? Math.max(1, club.__maxMinutes || 1) : 1;
    const share = clamp((perf?.minutes || 0) / maxMin, 0, 1), rating = perf?.apps >= 5 ? perf.rating : 0;
    const perfAdj = rating ? clamp((rating - 6.45) * 0.55, -0.35, 0.35) : 0;
    if (p.age <= 27) {
      const room = (p.potential + (unit(p.id, "s" + season) - 0.5) * 4) - before;
      let gain = Math.max(0, room) * growthShare(p.age);
      gain *= (0.6 + 0.45 * share) * (1 + perfAdj * 0.6) * (1 + clamp((level - 60) / 120, -0.1, 0.15));
      gain += (rng.next() - 0.5) * 1.1;
      if (room <= 0) gain = Math.min(gain, 0.6);
      const shape = {}; for (const k of CORE) shape[k] = 0.5 + w[k] * 3 + (k === "pace" && p.age <= 20 ? 0.4 : 0);
      shiftAttrs(p, gain, w, shape, rng);
      // potencial é elástico: boa temporada com minutos sobe um pouco; temporada ruim ou sem jogar desacelera.
      const drift = (share > 0.5 ? 0.4 : share < 0.15 ? -0.5 : 0) + perfAdj * 2;
      p.potential = clamp(Math.round(p.potential + clamp(drift, -0.9, 0.6) * (rng.next() < 0.5 ? 1 : 0.5)), Math.max(40, before), Math.min(97, Math.max(before, p.peakOvr || 0) + 12));
    } else {
      let loss = declineRate(p.age, p.pos) * (1.15 - 0.3 * share) * (1 - perfAdj * 0.5) + (rng.next() - 0.5) * 0.7;
      if (p.age < 30) loss = Math.max(0, loss * 0.3);
      const phys = p.pos === "GOL" ? { pace: 1.1, stamina: 1, strength: 0.9, finish: 0.5, pass: 0.5, defense: 0.6 } : { pace: 1.9, stamina: 1.5, strength: 1.0, finish: 0.55, pass: 0.4, defense: 0.5 };
      shiftAttrs(p, -loss, w, phys, rng);
      if (p.potential > ovrOf(p) + 2) p.potential = clamp(Math.round(ovrOf(p) + 2), 40, 97);
    }
    return ovrOf(p) - before;
  }

  // ---------- contratos ----------
  function renewOrRelease(s, api, club, p, rank, rng) {
    const starter = rank <= STARTERS[p.pos] + 1;
    let prob = starter ? 0.96 : rank <= STARTERS[p.pos] + 4 ? 0.74 : 0.45;
    if (ovrOf(p) >= (club?.__level || 0) + 4) prob = 0.99;
    if (p.age <= 21 && p.potential >= ovrOf(p) + 6) prob = Math.max(prob, 0.92);
    if (p.age >= 33 && !starter) prob *= 0.6;
    if (p.age >= 35) prob *= 0.7;
    if (rng.next() > prob) return false;
    const yrs = p.age <= 22 ? rng.int(2, 4) : p.age <= 29 ? rng.int(1, 4) : rng.int(1, 2);
    p.contract = { end: s.season + yrs - 1, salary: Math.max(p.contract?.salary || 0, salaryOf(p, club)) };
    return true;
  }

  // ---------- aposentadoria ----------
  function retirementChance(p, ctx) {
    if (p.age < 31) return 0;
    const motive = unit(p.id, "retire") * 2 - 1;
    let mid = (p.pos === "GOL" ? 41.5 : 38) + motive * 1.5;
    mid += ctx.starter ? 1 : 0;
    mid -= clamp((ctx.level - 10 - ctx.ovr) / 6, 0, 2.5);
    mid -= ctx.freeSeasons * 1.5;
    const hardCap = p.pos === "GOL" ? 45 : 42;
    if (p.age >= hardCap) return 1;
    return clamp(logistic((p.age - mid) / 1.7), 0, 0.97);
  }
  function retireOne(s, api, p, club, why) {
    const u = s.universe, o = ovrOf(p);
    const rec = { season: s.season - 1, id: p.id, name: p.name, pos: p.pos, age: p.age, ovr: o, peak: Math.max(o, p.peakOvr || 0), club: club?.name || "Sem clube", clubId: club?.id || null, why: why || "idade" };
    u.retirements.unshift(rec); u.retirements = u.retirements.slice(0, 400); u.retiredCount++;
    if (!u.retiredIds) u.retiredIds = {};
    u.retiredIds[p.id] = s.season - 1;
    return rec;
  }

  // ---------- novos talentos ----------
  function pickName(rng, used, nat) {
    const f = nat === "Brasil" ? firstNames : foreign.find((x) => x[0] === nat)[1], l = nat === "Brasil" ? lastNames : foreign.find((x) => x[0] === nat)[2];
    for (let i = 0; i < 14; i++) {
      const n = rng.pick(f) + " " + rng.pick(l);
      if (!used.has(n)) { used.add(n); return n; }
    }
    const n = rng.pick(f) + " " + rng.pick(lastNames) + " " + rng.pick(l);
    used.add(n); return n;
  }
  function usedNames(s) {
    const set = new Set();
    for (const c of s.clubs) for (const p of c.roster) set.add(p.name);
    for (const p of s.universe.free) set.add(p.name);
    return set;
  }
  // Distribuição: muitos comuns, alguns bons, poucos grandes, raríssimos geracionais. Pico relativo ao nível do clube formador.
  function talentTier(rng) {
    const r = rng.next();
    return r < 0.003 ? { id: "geracional", shift: 12, spread: 3 } : r < 0.07 ? { id: "grande", shift: 7, spread: 3 } : r < 0.28 ? { id: "bom", shift: 3, spread: 4 } : { id: "comum", shift: -3, spread: 5 };
  }
  function buildYouth(s, api, rng, pos, level, club, used) {
    const u = s.universe, tier = talentTier(rng), age = rng.pick([16, 17, 17, 18, 18, 19, 20]);
    const peakCap = tier.id === "geracional" ? 95 : 89;
    const peak = clamp(Math.round(level + tier.shift + (rng.next() - 0.5) * 2 * tier.spread), 48, peakCap);
    const yearsToPeak = Math.max(2, 25 - age);
    let target = Math.round(peak - yearsToPeak * 1.8 * (0.85 + rng.next() * 0.35));
    target = clamp(target, 34, age <= 18 ? 72 : 78);
    const nat = rng.next() < 0.9 ? "Brasil" : foreign[rng.int(0, foreign.length - 1)][0];
    const off = Creation?.posOffsets?.[pos] || { pace: 0, finish: 0, pass: 0, defense: 0, strength: 0, stamina: 0 };
    const a = {};
    for (const k of CORE) a[k] = clamp(Math.round(target + off[k] * 0.7 + rng.int(-4, 4)), 20, 90);
    const p = { id: "", pos, attrs: a };
    for (let i = 0; i < 4; i++) { const diff = target - ovrOf(p); if (!diff) break; for (const k of CORE) a[k] = clamp(a[k] + Math.round(diff * 1.1 * (0.6 + WEIGHTS[pos][k] * 2)), 20, 90); }
    const seq = ++u.nextYouth, id = `g${s.season}_${String(seq).padStart(5, "0")}`;
    const arch = Training.archetypeCatalog ? Object.values(Training.archetypeCatalog).filter((x) => x.positions.includes(pos)) : [];
    const youth = {
      id, name: pickName(rng, used, nat), age, pos, attrs: a, condition: 100, morale: rng.int(60, 85), discipline: rng.int(45, 95),
      potential: clamp(peak + rng.int(0, 2), 40, peakCap + 1), injury: 0, goals: 0, minutes: 0, nationality: nat, real: false, generated: true, talent: tier.id,
      foot: rng.next() < 0.78 ? "right" : "left", number: 0, archetypeId: arch.length ? rng.pick(arch).id : null, origin: club ? club.name : "Mercado jovem",
    };
    youth.contract = { end: s.season + rng.int(1, 3), salary: salaryOf(youth, club) };
    u.generatedCount++;
    return youth;
  }
  function freeNumber(club) {
    const taken = new Set(club.roster.map((p) => p.number));
    for (let n = 2; n <= 99; n++) if (!taken.has(n)) return n;
    return 99;
  }
  function removeFromClub(club, p) {
    club.roster = club.roster.filter((x) => x !== p);
    club.lineup = (club.lineup || []).filter((id) => id !== p.id);
  }
  function addToClub(club, p) { p.number = freeNumber(club); club.roster.push(p); }
  function pushTransfer(s, row) {
    const u = s.universe; u.transfers.unshift(row); u.transfers = u.transfers.slice(0, 400); u.transferCount++;
  }

  // ---------- virada de temporada ----------
  // Chamado por engine.newSeason depois de s.season++ . Ordem: histórico → idade → desenvolvimento/declínio → aposentadoria →
  // contratos → reposição de jovens → prestígio. O mercado roda depois, nas janelas (World.daily).
  function rollSeason(s, api) {
    const u = init(s, api), key = `${s.season}:roll`;
    if (u.done[key]) return u.summary || null;
    u.done[key] = 1;
    const prevSeason = s.season - 1, perf = u.perf || {};
    const rng = rngFor(s, api, key), used = usedNames(s);
    overallFn = api.overall;
    // 1. histórico por passagem de clube (mantém a temporada anterior mesmo após transferência no meio do ano)
    for (const c of s.clubs) for (const p of c.roster) {
      if (p.id === "hero") continue;
      const f = perf[p.id];
      if (f && f.apps > 0) pushHistory(p, { season: prevSeason, clubId: c.id, club: c.name, apps: f.apps - (p.seasonBase?.apps || 0), goals: f.goals - (p.seasonBase?.goals || 0), assists: f.assists - (p.seasonBase?.assists || 0), ovr: ovrOf(p) });
      delete p.seasonBase;
    }
    let developed = 0, retired = 0, released = 0, renewed = 0;
    const retiredNotable = [];
    for (const c of s.clubs) {
      const maxMin = Math.max(1, ...c.roster.map((p) => (perf[p.id]?.minutes ?? p.minutes ?? 0)));
      c.__maxMinutes = maxMin;
      const ranks = {};
      for (const pos of POS) c.roster.filter((p) => p.pos === pos && p.id !== "hero").sort((a, b) => ovrOf(b) - ovrOf(a) || a.id.localeCompare(b.id)).forEach((p, i) => (ranks[p.id] = i + 1));
      const top = c.roster.filter((p) => p.id !== "hero").map(ovrOf).sort((a, b) => b - a).slice(0, 14), level = top.length ? top.reduce((n, x) => n + x, 0) / top.length : 50;
      c.__level = level;
      for (const p of c.roster.slice()) {
        if (p.id === "hero") continue;
        p.age++;
        const before = ovrOf(p);
        p.peakOvr = Math.max(p.peakOvr || 0, before);
        const fp = perf[p.id];
        develop(p, c, fp, level, rng, prevSeason); developed++;
        const ovr = ovrOf(p);
        if (retirementChance(p, { level, ovr, starter: (ranks[p.id] || 9) <= STARTERS[p.pos], freeSeasons: 0 }) > rng.next()) {
          const rec = retireOne(s, api, p, c); removeFromClub(c, p); retired++;
          if (rec.peak >= 76 || rec.ovr >= 74) retiredNotable.push(rec);
          continue;
        }
        if (p.contract && p.contract.end < s.season) {
          if (renewOrRelease(s, api, c, p, ranks[p.id] || 9, rng)) renewed++;
          else { removeFromClub(c, p); p.freeSince = s.season; p.freeSeasons = 0; p.prevClub = c.name; s.universe.free.push(p); released++; pushTransfer(s, { season: prevSeason, day: s.day, id: p.id, name: p.name, pos: p.pos, age: p.age, ovr, from: c.name, fromId: c.id, to: "Sem clube", toId: null, fee: 0, type: "release", window: "fim de contrato" }); }
        }
        p.minutes = 0; p.goals = 0;
      }
      delete c.__maxMinutes; delete c.__level;
    }
    // jogadores livres: envelhecem, perdem ritmo, podem se aposentar
    for (const p of u.free.slice()) {
      if (p.freeSince === s.season) continue;
      p.age++; p.freeSeasons = (p.freeSeasons || 0) + 1;
      develop(p, null, null, 60, rng, prevSeason);
      if (retirementChance(p, { level: 62, ovr: ovrOf(p), starter: false, freeSeasons: p.freeSeasons }) > rng.next() || (p.freeSeasons >= 3 && ovrOf(p) < 60)) {
        retireOne(s, api, p, null, "sem clube"); retired++;
        u.free = u.free.filter((x) => x !== p);
      }
    }
    // reposição por posição: clubes completam o mínimo com jovens da própria formação; sobra de fôlego vai ao mercado jovem
    let generated = 0;
    for (const c of s.clubs) {
      const needs = squadNeeds(s, c, api), lvl = needs.level;
      for (const pos of POS) {
        const have = c.roster.filter((p) => p.pos === pos && p.id !== "hero").length;
        const need = Math.max(0, TARGET[pos] - have);
        for (let i = 0; i < need; i++) { addToClub(c, buildYouth(s, api, rng, pos, lvl, c, used)); generated++; }
      }
      // mantém o tamanho do plantel próximo ao original (elencos grandes não encolhem só por aposentadorias)
      for (let guard = 0; guard < 12 && c.roster.length < (c.baseSize || 22) - 2; guard++) {
        const nd = squadNeeds(s, c, api); addToClub(c, buildYouth(s, api, rng, nd.priority, nd.level, c, used)); generated++;
      }
    }
    const pool = 4 + Math.floor(s.clubs.length / 12);
    for (let i = 0; i < pool; i++) { u.free.push(Object.assign(buildYouth(s, api, rng, POS[rng.int(0, 3)], 58, null, used), { freeSince: s.season, freeSeasons: 0, origin: "Mercado jovem" })); generated++; }
    u.free.sort((a, b) => ovrOf(b) - ovrOf(a) || a.id.localeCompare(b.id));
    u.free = u.free.slice(0, 160);
    // prestígio dinâmico e lento
    prestige(s, api);
    for (const c of s.clubs) { c.lineup = (c.lineup || []).filter((id) => c.roster.some((p) => p.id === id)); u.credit[c.id] = 0; }
    // notícias de aposentadorias relevantes
    for (const r of retiredNotable.sort((a, b) => b.peak - a.peak).slice(0, 5)) news(s, api, `RETIRE:${r.id}`, `${r.name} anuncia aposentadoria`, `${r.name}, ${r.age} anos, encerra a carreira após passar por ${r.club}. Seu auge foi de overall ${r.peak}.`);
    const stats = audit(s, api);
    u.summary = { season: prevSeason, players: stats.players, avgAge: stats.avgAge, avgOvr: stats.avgOvr, maxOvr: stats.maxOvr, retired, generated, released, renewed, developed };
    u.seasons.unshift(u.summary); u.seasons = u.seasons.slice(0, 40);
    u.perf = null;
    return u.summary;
  }
  function pushHistory(p, row) { if (!p.history) p.history = []; p.history.unshift(row); p.history = p.history.slice(0, 8); }
  function prestige(s, api) {
    // alteração lenta (±1 por temporada, máx. ±8 em relação à base) segundo a posição final na própria divisão.
    for (const league of s.leagues || []) {
      const order = api.table(s, league.id), n = order.length;
      order.forEach((c, i) => {
        const expected = n - Math.round(((c.baseStructure ?? c.structure) - 40) / 50 * (n - 1)), place = i + 1;
        c.prestigeFrac = (c.prestigeFrac || 0) + clamp((expected - place) / n, -0.5, 0.5) * 1.6 + (i === 0 ? 0.4 : 0);
        const step = Math.trunc(c.prestigeFrac);
        if (step) { c.prestigeFrac -= step; c.structure = clamp(c.structure + step, (c.baseStructure ?? c.structure) - 8, (c.baseStructure ?? c.structure) + 8); }
      });
    }
  }
  function news(s, api, id, title, body) {
    if (s.mode !== "player" && s.mode !== "coach") return;
    api.Career.addArticle?.(s, { category: "IMPRENSA", title, body, eventId: `WORLD:${s.season}:${id}` });
  }

  // ---------- mercado da IA ----------
  function windowAt(day) { const d = day % 365; return WINDOWS.find((w) => d >= w.start && d <= w.end) || null; }
  function daily(s, api) {
    const u = init(s, api), w = windowAt(s.day);
    if (!w) return null;
    const open = s.day % 365 - w.start;
    // passagem A na abertura da janela; passagem B três semanas depois (sobras e jogadores livres).
    for (const [part, offset] of [["a", 0], ["b", 21]]) {
      const key = `${s.season}:w${w.id}:${part}`;
      if (open >= offset && !u.done[key]) {
        u.done[key] = 1;
        overallFn = api.overall;
        return marketPass(s, api, key, part === "b", w);
      }
    }
    return null;
  }
  function marketPass(s, api, key, late, w) {
    const u = s.universe, rng = rngFor(s, api, "mkt:" + key), cache = new Map();
    const ov = (p) => (cache.get(p) ?? (cache.set(p, ovrOf(p)), cache.get(p)));
    const info = new Map(), moved = new Set(), incoming = {}, outgoing = {};
    for (const c of s.clubs) info.set(c.id, squadNeeds(s, c, api, cache));
    const winName = ["início do ano", "meio do ano", "final do ano"][w.id];
    const buyers = s.clubs.slice().sort((a, b) => info.get(b.id).byPos[info.get(b.id).priority].need - info.get(a.id).byPos[info.get(a.id).priority].need || a.id.localeCompare(b.id));
    // índice por posição (shortlist): jogadores de clubes e livres, ordenados por overall
    const index = Object.fromEntries(POS.map((p) => [p, []]));
    for (const c of s.clubs) for (const p of c.roster) if (p.id !== "hero") index[p.pos].push({ p, c, o: ov(p) });
    for (const p of u.free) index[p.pos].push({ p, c: null, o: ov(p) });
    for (const pos of POS) index[pos].sort((a, b) => b.o - a.o || a.p.id.localeCompare(b.p.id));
    const maxMoves = Math.ceil(s.clubs.length * (late ? 0.4 : 0.7)); let moves = 0, signed = 0; const done = [];
    // jogadores livres: os melhores procuram o clube de maior nível que tenha espaço; a paciência aumenta a cada janela sem contrato.
    const stamp = key.slice(0, key.lastIndexOf(":"));
    for (const fa of u.free.slice().sort((a, b) => ov(b) - ov(a) || a.id.localeCompare(b.id)).slice(0, 90)) {
      const o = ov(fa), patience = (fa.freeSeasons || 0) * 4 + (late ? 3 : 0) + (o < 70 ? 2 : 0);
      const options = s.clubs.filter((c) => {
        const bi = info.get(c.id), g = bi.byPos[fa.pos];
        if (c.roster.length >= ROSTER_MAX || (incoming[c.id] || 0) >= 3) return false;
        if (bi.level < o - 12 - patience || bi.level > o + 14) return false;
        return g.need >= 0.3 || g.startersAvg < o + 1 || g.deficit > 0;
      });
      if (!options.length || (rng.next() > 0.7 + patience * 0.05)) continue;
      options.sort((a, b) => info.get(b.id).level - info.get(a.id).level || a.id.localeCompare(b.id));
      const club = options[Math.min(options.length - 1, Math.floor(rng.next() * Math.min(3, options.length)))];
      u.free = u.free.filter((x) => x !== fa);
      fa.contract = { end: s.season + (fa.age <= 24 ? rng.int(2, 4) : fa.age <= 30 ? rng.int(1, 4) : rng.int(1, 2)) - 1, salary: salaryOf(fa, club) };
      fa.lastMove = { key: stamp }; fa.freeSeasons = 0; delete fa.freeSince;
      addToClub(club, fa); incoming[club.id] = (incoming[club.id] || 0) + 1; moved.add(fa.id); signed++;
      const row = { season: s.season, day: s.day, id: fa.id, name: fa.name, pos: fa.pos, age: fa.age, ovr: o, from: "Sem clube", fromId: null, to: club.name, toId: club.id, fee: 0, type: "free", window: winName };
      pushTransfer(s, row); done.push(row);
      info.set(club.id, squadNeeds(s, club, api, cache));
    }
    for (const pos of POS) index[pos] = index[pos].filter((e) => !moved.has(e.p.id));
    for (const buyer of buyers) {
      if (moves >= maxMoves) break;
      const bi = info.get(buyer.id);
      if ((incoming[buyer.id] || 0) >= 2 || buyer.roster.length >= ROSTER_MAX) continue;
      const pos = bi.ranked.filter((x) => bi.byPos[x].need >= 0.3 && bi.byPos[x].surplus === 0)[rng.next() < 0.35 ? 1 : 0] || bi.ranked.find((x) => bi.byPos[x].need >= 0.3 && bi.byPos[x].surplus === 0);
      if (!pos) continue;
      const own = bi.byPos[pos], wantOvr = Math.max(own.startersAvg + 3, bi.level - 1), level = bi.level;
      const credit = u.credit[buyer.id] || 0, allowance = Math.max(250000, buyer.budget * 0.2) + credit;
      const cands = [];
      for (const e of index[pos]) {
        if (e.o > level + 8) continue;
        if (e.o < wantOvr - 7) break;
        if (e.c && e.c.id === buyer.id) continue;
        if (moved.has(e.p.id) || (e.p.lastMove && e.p.lastMove.key === stamp)) continue;
        const si = e.c ? info.get(e.c.id) : null;
        if (si && ((outgoing[e.c.id] || 0) >= 2 || e.c.roster.length - 1 < 20 || si.byPos[pos].count - 1 < MINIMUM[pos])) continue;
        const rankAtSeller = e.c ? e.c.roster.filter((x) => x.pos === pos && x.id !== "hero" && ov(x) > e.o).length + 1 : 99;
        const starter = rankAtSeller <= STARTERS[pos];
        const sellerLevel = si ? si.level : 0;
        const appeal = e.c ? (level - sellerLevel) / 10 + (starter ? -0.5 : 0.35) + (e.p.age >= 31 ? 0.2 : 0) : 0.4;
        if (appeal < -0.3) continue;
        const expiring = e.p.contract && e.p.contract.end <= s.season;
        const value = valueOf(e.p, e.o), fee = e.c ? Math.round(value * (expiring ? 0.55 : 1) * (starter ? 1.2 : 1) / 10000) * 10000 : 0;
        if (fee > allowance) continue;
        if (starter && e.c && !expiring && level < sellerLevel + 6 && rng.next() > 0.18) continue;
        let fit = 1.2 - Math.abs(e.o - wantOvr) / 9 + (e.p.age <= 23 ? clamp((e.p.potential - e.o) / 30, 0, 0.5) : 0) - (e.p.age >= 33 ? 0.45 : 0) + (e.c ? 0 : 0.35) - fee / Math.max(1, allowance) * 0.3 + (rng.next() - 0.5) * 0.3;
        if (own.deficit) fit += 0.2;
        cands.push({ e, fit, fee, expiring });
        if (cands.length >= 12) break;
      }
      if (!cands.length) continue;
      cands.sort((a, b) => b.fit - a.fit || a.e.p.id.localeCompare(b.e.p.id));
      const pick = cands[Math.min(cands.length - 1, rng.next() < 0.25 ? 1 : 0)], p = pick.e.p, seller = pick.e.c;
      if (seller) { removeFromClub(seller, p); outgoing[seller.id] = (outgoing[seller.id] || 0) + 1; u.credit[seller.id] = (u.credit[seller.id] || 0) + Math.round(pick.fee * 0.9); }
      else u.free = u.free.filter((x) => x !== p);
      p.contract = { end: s.season + (p.age <= 24 ? rng.int(2, 4) : p.age <= 30 ? rng.int(1, 4) : rng.int(1, 2)) - 1, salary: Math.max(salaryOf(p, buyer), Math.round((p.contract?.salary || 0) * 1.05)) };
      p.lastMove = { key: stamp }; p.freeSeasons = 0; delete p.freeSince;
      snapshotStint(s, p, seller);
      addToClub(buyer, p);
      u.credit[buyer.id] = Math.max(-buyer.budget * 0.2, (u.credit[buyer.id] || 0) - pick.fee);
      incoming[buyer.id] = (incoming[buyer.id] || 0) + 1; moved.add(p.id); moves++;
      const row = { season: s.season, day: s.day, id: p.id, name: p.name, pos: p.pos, age: p.age, ovr: pick.e.o, from: seller?.name || "Sem clube", fromId: seller?.id || null, to: buyer.name, toId: buyer.id, fee: pick.fee, type: seller ? "transfer" : "free", window: winName };
      pushTransfer(s, row); done.push(row);
      info.set(buyer.id, squadNeeds(s, buyer, api, cache)); if (seller) info.set(seller.id, squadNeeds(s, seller, api, cache));
    }
    // sobras de elenco são liberadas (nunca o protagonista)
    for (const c of s.clubs) {
      while (c.roster.length > ROSTER_MAX) {
        const spare = c.roster.filter((p) => p.id !== "hero").sort((a, b) => ov(a) + (a.age >= 30 ? -3 : 0) - (ov(b) + (b.age >= 30 ? -3 : 0)) || a.id.localeCompare(b.id))[0];
        if (!spare) break;
        removeFromClub(c, spare); spare.freeSince = s.season; spare.prevClub = c.name; u.free.push(spare);
        pushTransfer(s, { season: s.season, day: s.day, id: spare.id, name: spare.name, pos: spare.pos, age: spare.age, ovr: ov(spare), from: c.name, fromId: c.id, to: "Sem clube", toId: null, fee: 0, type: "release", window: winName });
      }
    }
    u.free = u.free.slice(0, 200);
    // notícias só das movimentações relevantes
    const relevant = done.filter((r) => r.ovr >= 76 || r.fee >= 8000000).sort((a, b) => b.ovr - a.ovr || b.fee - a.fee).slice(0, 5);
    for (const r of relevant) news(s, api, `TR:${r.id}:${key}`, `${r.name} muda de clube`, `${r.name} (${r.pos}, ${r.age} anos, GER ${r.ovr}) deixa o ${r.from} e é anunciado pelo ${r.to}${r.fee ? ` por ${money(r.fee)}` : " como agente livre"}.`);
    return { moves, signed, relevant: relevant.length };
  }
  // Ao sair do clube anterior, a temporada em curso fica registrada como uma passagem (estatísticas não se perdem).
  function snapshotStint(s, p, seller) {
    const r = s.statistics?.players?.[p.id];
    if (!seller || !r || !r.appearances) return;
    const base = p.seasonBase || { apps: 0, goals: 0, assists: 0 };
    pushHistory(p, { season: s.season, clubId: seller.id, club: seller.name, apps: r.appearances - base.apps, goals: (r.goals || 0) - base.goals, assists: (r.assists || 0) - base.assists, ovr: ovrOf(p), partial: true });
    p.seasonBase = { apps: r.appearances, goals: r.goals || 0, assists: r.assists || 0 };
  }

  // ---------- consultas / auditoria ----------
  function recentMoves(s, { limit = 12, minOvr = 0, season } = {}) {
    const u = s.universe; if (!u) return [];
    return u.transfers.filter((t) => t.ovr >= minOvr && (season === undefined || t.season === season)).slice(0, limit);
  }
  function audit(s, api) {
    overallFn = api.overall;
    const seen = new Set(), dupIds = [], multi = [], retiredActive = [], badAge = [], gkLess = [];
    let n = 0, ageSum = 0, ovrSum = 0, maxOvr = 0, over90 = 0, ovrHist = {};
    const retired = s.universe?.retiredIds || {};
    for (const c of s.clubs) {
      for (const p of c.roster) {
        n++; ageSum += p.age;
        if (seen.has(p.id)) (dupIds.push(p.id), multi.push(p.id)); seen.add(p.id);
        if (retired[p.id] !== undefined) retiredActive.push(p.id);
        if (p.id === "hero") continue;
        const o = ovrOf(p); ovrSum += o; maxOvr = Math.max(maxOvr, o); if (o >= 90) over90++;
        const b = Math.floor(o / 10) * 10; ovrHist[b] = (ovrHist[b] || 0) + 1;
        if (!(p.age >= 15 && p.age <= 46)) badAge.push(p.id);
      }
      if (!c.roster.some((p) => p.pos === "GOL")) gkLess.push(c.id);
    }
    for (const p of s.universe?.free || []) { if (seen.has(p.id)) dupIds.push(p.id); seen.add(p.id); }
    const ai = Math.max(1, n - 1);
    const byLeague = {};
    for (const c of s.clubs) { const o = c.roster.filter((p) => p.id !== "hero").map(ovrOf); if (o.length) { const r = byLeague[c.leagueId] || (byLeague[c.leagueId] = { sum: 0, n: 0 }); r.sum += o.reduce((a, b) => a + b, 0); r.n += o.length; } }
    for (const k of Object.keys(byLeague)) byLeague[k] = Math.round(byLeague[k].sum / byLeague[k].n * 10) / 10;
    return { byLeague, players: n, free: (s.universe?.free || []).length, avgAge: Math.round(ageSum / Math.max(1, n) * 10) / 10, avgOvr: Math.round(ovrSum / ai * 10) / 10, maxOvr, over90, ovrHist, dupIds, multi, retiredActive, badAge, gkLess };
  }
  function playerView(s, api, id) {
    overallFn = api.overall;
    for (const c of s.clubs) { const p = c.roster.find((x) => x.id === id); if (p) return { id, name: p.name, age: p.age, pos: p.pos, club: c.name, ovr: ovrOf(p), potential: p.potential, contract: p.contract || null, history: p.history || [], transfers: (s.universe?.transfers || []).filter((t) => t.id === id).slice(0, 6) }; }
    return null;
  }

  // Resumo determinístico do universo (clubes, jogadores, livres e contadores) para comparar execuções e save/load.
  function snapshotHash(s, api) {
    overallFn = api.overall; let h = 2166136261;
    const mix = (str) => { for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } };
    for (const c of s.clubs) { mix(`${c.id}:${c.structure}:${c.leagueId}`); for (const p of c.roster) mix(`${p.id}|${p.age}|${ovrOf(p)}|${p.pos}|${p.contract ? p.contract.end : ""}`); }
    for (const p of s.universe.free) mix(`F${p.id}${p.age}`);
    mix(`${s.universe.transferCount}:${s.universe.retiredCount}:${s.universe.generatedCount}`);
    return (h >>> 0).toString(16);
  }
  const api = { VERSION, snapshotHash, recordStint: snapshotStint, TARGET, MINIMUM, STARTERS, WINDOWS, init, ensurePlayer, squadNeeds, snapshotPerformance, develop, retirementChance, declineRate, growthShare, valueOf, buildYouth, rollSeason, daily, marketPass, recentMoves, audit, playerView, windowAt, rngFor, hash, setOverall: (fn) => { overallFn = fn; } };
  root.ProLifeUniverse = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
