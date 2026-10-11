(function (root) {
  "use strict";
  // Stage 32B — perfis de evolução individuais. Módulo puro: não altera GER, atributos nem estado,
  // não grava nada e não usa Date/Math.random. Integração futura: protagonista e NPCs.
  const VERSION = 1;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v, d) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : d);

  // growth: [idadeDe, idadeAte, multiplicador] sobre a base etária; null = 1.
  const PROFILES = Object.freeze({
    prodigy: Object.freeze({ id: "prodigy", label: "Prodígio", peakAge: 24, peakDuration: 3, growthRate: 1.4, declineRate: 1.0, volatility: 0.15, weight: 10,
      growth: [[14, 22, 1.7], [23, 26, 0.7]], description: "Evolui muito rápido entre 14 e 22 anos e amadurece cedo." }),
    steady_rise: Object.freeze({ id: "steady_rise", label: "Ascensão constante", peakAge: 28, peakDuration: 5, growthRate: 1.0, declineRate: 1.0, volatility: 0.1, weight: 32,
      growth: [[14, 30, 1.0]], description: "Crescimento equilibrado, auge entre 26 e 30 anos." }),
    late_bloomer: Object.freeze({ id: "late_bloomer", label: "Talento tardio", peakAge: 28, peakDuration: 4, growthRate: 1.1, declineRate: 1.0, volatility: 0.15, weight: 18,
      growth: [[14, 22, 0.55], [23, 29, 1.7]], description: "Início lento e forte crescimento entre 23 e 29 anos." }),
    career_burst: Object.freeze({ id: "career_burst", label: "Explosão de carreira", peakAge: 27, peakDuration: 4, growthRate: 1.0, declineRate: 1.0, volatility: 0.25, weight: 14,
      growth: [[14, 30, 1.0]], burst: Object.freeze({ chance: 0.4, multiplier: 2.0, minRating: 7.1, minMinutes: 0.6 }), description: "Temporadas de salto quando desempenho e oportunidade coincidem." }),
    longevity: Object.freeze({ id: "longevity", label: "Longevidade", peakAge: 29, peakDuration: 7, growthRate: 0.85, declineRate: 0.6, volatility: 0.08, weight: 16,
      growth: [[14, 31, 0.9]], description: "Evolução moderada, auge longo e declínio físico lento." }),
    early_unstable: Object.freeze({ id: "early_unstable", label: "Precoce e instável", peakAge: 23, peakDuration: 2, growthRate: 1.5, declineRate: 1.5, volatility: 0.5, weight: 10,
      growth: [[14, 21, 1.6], [22, 24, 0.6]], description: "Cresce cedo, oscila muito e pode declinar antes." }),
  });
  const PROFILE_IDS = Object.freeze(Object.keys(PROFILES));
  const isGK = (p) => String(p?.pos || p?.position || "").toUpperCase() === "GOL";

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // PRNG determinístico (mulberry32) a partir de uma chave textual.
  function unit(key) {
    let a = hash(String(key)) + 0x6d2b79f5;
    a = Math.imul(a ^ (a >>> 15), a | 1);
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61);
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
  }
  // Chave estável: seed (se existir) + identidade do jogador. Não exige initialSeed.
  function identityKey(player, context) {
    const seed = context?.seed ?? player?.initialSeed ?? context?.initialSeed ?? "legacy";
    return [seed, player?.id ?? "", player?.name ?? "", player?.birthYear ?? player?.birthDate ?? "", String(player?.pos || "")].join("|");
  }

  function weightsFor(player) {
    const age = num(player?.age, 22), pot = num(player?.potential, NaN);
    const ovr = num(player?.overall ?? player?.ovr, NaN), gap = Number.isFinite(pot) && Number.isFinite(ovr) ? pot - ovr : 0;
    const w = {}; for (const id of PROFILE_IDS) w[id] = PROFILES[id].weight;
    if (age <= 19 && pot >= 85) { w.prodigy *= 2.5; w.early_unstable *= 1.6; }
    if (age >= 22 && gap >= 15) { w.late_bloomer *= 2.2; w.prodigy *= 0.2; w.early_unstable *= 0.5; }
    if (age >= 30 && gap <= 4) { w.longevity *= 2; w.prodigy *= 0.3; }
    if (isGK(player)) { w.longevity *= 1.4; w.early_unstable *= 0.5; }
    return w;
  }
  function pickProfileId(player, context) {
    const w = weightsFor(player), total = PROFILE_IDS.reduce((n, id) => n + w[id], 0);
    let r = unit("profile|" + identityKey(player, context)) * total;
    for (const id of PROFILE_IDS) { r -= w[id]; if (r < 0) return id; }
    return PROFILE_IDS[PROFILE_IDS.length - 1];
  }

  const validRecord = (r) => !!r && typeof r === "object" && PROFILE_IDS.includes(r.id);
  // Perfil existente (válido) ou atribuído de forma determinística. Nunca altera o jogador.
  function resolveProfile(player, context) {
    const existing = player?.developmentProfile;
    if (validRecord(existing)) return { id: existing.id, v: num(existing.v, VERSION), source: "stored" };
    return { id: pickProfileId(player || {}, context), v: VERSION, source: "derived" };
  }
  // Registro mínimo para armazenar futuramente (2 campos).
  const createProfileRecord = (player, context) => { const r = resolveProfile(player, context); return { id: r.id, v: r.v }; };

  // Parâmetros individuais: idade de auge, duração do auge, taxa de crescimento e de declínio.
  function parametersFor(profileId, player, context) {
    const base = PROFILES[profileId] || PROFILES.steady_rise, gk = isGK(player);
    const j = (tag, span) => Math.round((unit(tag + "|" + identityKey(player, context)) * 2 - 1) * span); // ±span, inteiro
    const peakAge = clamp(base.peakAge + j("peak", 1) + (gk ? 3 : 0), 20, 35);
    const peakDuration = clamp(base.peakDuration + j("dur", 1) + (gk ? 2 : 0), 1, 10);
    const rv = (tag, span) => (unit(tag + "|" + identityKey(player, context)) * 2 - 1) * span;
    return {
      profile: base.id, peakAge, peakDuration,
      peakStart: peakAge - Math.floor(peakDuration / 2), peakEnd: peakAge + Math.ceil(peakDuration / 2),
      growthRate: clamp(base.growthRate + rv("gr", 0.12), 0.3, 2),
      declineRate: clamp((base.declineRate + rv("dr", 0.1)) * (gk ? 0.6 : 1), 0.3, 2),
      volatility: clamp(base.volatility, 0, 0.6), goalkeeper: gk,
    };
  }

  const ageBase = (age) => (age <= 17 ? 3.4 : age <= 20 ? 3.0 : age <= 23 ? 2.2 : age <= 26 ? 1.4 : age <= 29 ? 0.8 : 0.2);
  function growthWindowMultiplier(profileId, age) {
    const win = (PROFILES[profileId] || PROFILES.steady_rise).growth;
    for (const [a, b, m] of win) if (age >= a && age <= b) return m;
    return 1;
  }
  function phaseAt(params, age) { return age < params.peakStart ? "growth" : age <= params.peakEnd ? "peak" : "decline"; }

  // Fatores de contexto → multiplicadores (limitados). Todos opcionais.
  function evolutionModifier(f) {
    const rating = num(f?.avgRating, 6.8), minutes = clamp(num(f?.minutesShare, 0.5), 0, 1), routine = clamp(num(f?.routine, 0.5), 0, 1);
    const injuries = clamp(num(f?.injuries, 0), 0, 6);
    const growth = clamp(1 + 0.25 * clamp(rating - 6.8, -1.5, 1.5) + 0.3 * (minutes - 0.5) + 0.3 * (routine - 0.5) - 0.07 * injuries, 0.6, 1.4);
    const decline = clamp(2 - growth + (f?.severeInjury ? 0.15 : 0), 0.7, 1.5);
    return { growth, decline };
  }

  function burstActive(profileId, params, factors, player, context, season) {
    const b = PROFILES[profileId]?.burst;
    if (!b) return false;
    if (num(factors?.avgRating, 0) < b.minRating || num(factors?.minutesShare, 0) < b.minMinutes) return false;
    return unit(`burst|${season ?? ""}|${identityKey(player, context)}`) < b.chance;
  }

  // Variação anual esperada de GER (números, sem aplicar). Faixa final limitada a [-6, +8].
  function expectedAnnualChange(player, context) {
    const profile = resolveProfile(player, context), params = parametersFor(profile.id, player, context);
    const age = clamp(num(player?.age, 22), 14, 45), phase = phaseAt(params, age);
    const mod = evolutionModifier(context?.factors);
    const pot = num(player?.potential, NaN), ovr = num(player?.overall ?? player?.ovr, NaN);
    const gap = Number.isFinite(pot) && Number.isFinite(ovr) ? Math.max(0, pot - ovr) : 8;
    const gapFactor = clamp(gap / 10, 0.15, 1.5);
    let expected = 0, physical = 0, technical = 0, burst = false;
    if (phase === "growth" || (phase === "peak" && age <= params.peakAge)) {
      let g = ageBase(age) * growthWindowMultiplier(profile.id, age) * params.growthRate * gapFactor * mod.growth;
      if (phase === "peak") g *= 0.35;
      burst = burstActive(profile.id, params, context?.factors, player, context, context?.season);
      if (burst) g *= PROFILES[profile.id].burst.multiplier;
      expected = g; physical = g * 0.9; technical = g * 1.1;
    } else if (phase === "decline") {
      const yrs = age - params.peakEnd, base = (0.6 + 0.45 * yrs) * params.declineRate * mod.decline;
      physical = -base * 1.3 * (params.goalkeeper ? 0.7 : 1); technical = -base * 0.5; expected = (physical + technical) / 2;
    }
    const noise = profile.id === "early_unstable" || params.volatility >= 0.2
      ? (unit(`noise|${context?.season ?? ""}|${identityKey(player, context)}`) * 2 - 1) * params.volatility * 1.5 : 0;
    expected = clamp(expected + noise, -6, 8);
    const spread = clamp(0.4 + params.volatility * 2.5, 0.4, 1.8);
    return { profile: profile.id, source: profile.source, phase, age, expected, physical: clamp(physical, -6, 8), technical: clamp(technical, -6, 8),
      min: clamp(expected - spread, -6, 8), max: clamp(expected + spread, -6, 8), burst, params };
  }

  // Reavaliação justificada: devolve novo registro só diante de eventos importantes; sem efeitos colaterais.
  function reassessProfile(player, events, context) {
    const cur = resolveProfile(player, context), changes = num(player?.developmentProfile?.changes, 0);
    if (changes >= 2) return { changed: false, profile: cur, reason: "limite de reavaliações" };
    const e = events || {};
    let next = null, reason = "";
    if (e.severeInjuries >= 2 && cur.id !== "early_unstable" && cur.id !== "longevity") { next = "early_unstable"; reason = "lesões graves recorrentes"; }
    else if (e.breakoutSeasons >= 2 && ["steady_rise", "late_bloomer"].includes(cur.id)) { next = "career_burst"; reason = "temporadas de desempenho acima do esperado"; }
    else if (e.seasonsAsRegular >= 6 && e.severeInjuries === 0 && cur.id === "steady_rise") { next = "longevity"; reason = "regularidade e ausência de lesões graves"; }
    if (!next) return { changed: false, profile: cur, reason: "sem evento relevante" };
    return { changed: true, profile: { id: next, v: VERSION, source: "reassessed", changes: changes + 1 }, from: cur.id, reason };
  }

  const api = { VERSION, PROFILES, PROFILE_IDS, resolveProfile, createProfileRecord, parametersFor, expectedAnnualChange, evolutionModifier, reassessProfile, phaseAt, weightsFor };
  root.ProLifePlayerDevelopment = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
