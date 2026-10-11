(function (root) {
  "use strict";
  // Stage 32C — potencial dinâmico e teto realista. Módulo puro: não altera GER, atributos nem potencial,
  // não grava nada, não usa Date/Math.random. Os perfis vêm de player-development.js (32B).
  // Três conceitos separados: GER base (player.overall/ovr), potencial máximo (player.potential)
  // e teto efetivo (limite que o treino/evolução pode alcançar agora).
  const Dev = root.ProLifePlayerDevelopment || (typeof require === "function" ? require("./player-development.js") : null);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const num = (v, d) => (v !== null && v !== "" && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : d);
  const round2 = (v) => Math.round(v * 100) / 100;

  const LIMITS = Object.freeze({
    absoluteMax: 99, maxRiseTotal: 8, maxFallTotal: 10, maxRisePerReview: 2.5, maxFallPerReview: 3,
    surpriseMax: 4, tiers: Object.freeze({ low: 65, mid: 78, high: 88 }),
  });

  const isGK = (p) => String(p?.pos || p?.position || "").toUpperCase() === "GOL";
  const baseOvr = (p) => clamp(num(p?.overall ?? p?.ovr, 50), 1, 100);
  const ageOf = (p) => clamp(num(p?.age, 22), 14, 45);

  // Potencial atual; sem o campo (save antigo) é estimado a partir de GER e idade e marcado como estimado.
  function potentialOf(p) {
    const ovr = baseOvr(p), raw = num(p?.potential, NaN);
    if (Number.isFinite(raw)) return { value: clamp(raw, 1, LIMITS.absoluteMax), estimated: false }; // sem piso no GER: evita a catraca GER -> potencial -> teto
    const age = ageOf(p);
    return { value: clamp(ovr + Math.max(0, (24 - age) * 1.2), 1, LIMITS.absoluteMax), estimated: true };
  }
  function profileOf(p, ctx) {
    if (!Dev) return { id: "steady_rise", source: "fallback", params: { peakAge: isGK(p) ? 31 : 28, peakStart: 26, peakEnd: 30, peakDuration: 5, goalkeeper: isGK(p) } };
    const r = Dev.resolveProfile(p, ctx);
    return { id: r.id, source: r.source, params: Dev.parametersFor(r.id, p, ctx) };
  }

  // Margem de surpresa acima do potencial: pequena, maior nos jovens e em perfis de crescimento tardio/explosão.
  function surpriseMargin(p, prof) {
    const age = ageOf(p);
    let m = 1.5 + (age <= 21 ? 1.5 : age <= 24 ? 0.8 : 0);
    if (prof.id === "late_bloomer" && age >= 20 && age <= 28) m += 1;
    if (prof.id === "career_burst" && age <= 28) m += 1;
    if (prof.id === "early_unstable") m -= 0.5;
    if (age > prof.params.peakEnd) m = 0;
    return clamp(m, 0, LIMITS.surpriseMax);
  }

  // Teto efetivo: nunca abaixo do GER atual, nunca acima de potencial + margem, e colapsa após o auge.
  function effectiveCeiling(player, context) {
    const ovr = baseOvr(player), pot = potentialOf(player).value, prof = profileOf(player || {}, context);
    let ceil = pot + surpriseMargin(player, prof);
    const age = ageOf(player);
    if (age > prof.params.peakEnd) ceil = Math.min(ceil, ovr + Math.max(0, 1.5 - 0.5 * (age - prof.params.peakEnd - 1)));
    return round2(clamp(Math.max(ovr, ceil), 1, LIMITS.absoluteMax));
  }

  function profileGrowthFactor(profId, age, exceptional) {
    switch (profId) {
      case "prodigy": return age <= 22 ? 1.3 : 0.5;
      case "late_bloomer": return age >= 23 && age <= 29 ? 1.4 : age <= 22 ? 0.6 : 0.6;
      case "career_burst": return exceptional ? 1.5 : 1.0;
      case "longevity": return 0.8;
      case "early_unstable": return age <= 21 ? 1.2 : 0.5;
      default: return 1;
    }
  }

  // Revisão de potencial ao fim de uma temporada. Devolve o resultado, não aplica.
  // seasonStats: { season, avgRating, minutesShare (0..1), regularity (0..1), severeInjuries, injuries }
  // context: { seed, originalPotential?, lastReviewSeason? }
  function reviewPotential(player, seasonStats, context) {
    const st = seasonStats || {}, ctx = context || {}, cur = potentialOf(player), ovr = baseOvr(player), age = ageOf(player);
    const prof = profileOf(player || {}, ctx), gk = isGK(player);
    const out = (delta, reason, extra) => {
      const orig = num(ctx.originalPotential, cur.value);
      // O teto de alta (original + 8) prevalece sobre o piso do GER: evita o efeito catraca potencial -> GER -> potencial.
      const hi = Math.min(LIMITS.absoluteMax, orig + LIMITS.maxRiseTotal), lo = Math.min(Math.max(ovr, orig - LIMITS.maxFallTotal), hi);
      const next = round2(clamp(cur.value + delta, lo, hi));
      return { previous: cur.value, delta: round2(next - cur.value), potential: next, reason, profile: prof.id, applied: false, estimated: cur.estimated, ...extra };
    };
    if (Number.isFinite(num(ctx.lastReviewSeason, NaN)) && num(st.season, NaN) === Number(ctx.lastReviewSeason)) return out(0, "temporada já avaliada", { repeated: true });
    if (!Number.isFinite(num(st.avgRating, NaN)) && !Number.isFinite(num(st.minutesShare, NaN))) return out(0, "sem dados da temporada");

    const rating = clamp(num(st.avgRating, 6.5), 1, 10), minutes = clamp(num(st.minutesShare, 0.5), 0, 1), reg = clamp(num(st.regularity, 0.5), 0, 1);
    const severe = clamp(Math.floor(num(st.severeInjuries, 0)), 0, 5), inj = clamp(Math.floor(num(st.injuries, 0)), 0, 10);
    const exceptional = rating >= 7.6 && minutes >= 0.7 && reg >= 0.6;
    const ageW = age <= 21 ? 1 : age <= 24 ? 0.7 : age <= 27 ? 0.35 : 0;
    const closeness = clamp((LIMITS.absoluteMax - cur.value) / 20, 0.2, 1);   // retornos decrescentes perto de 99
    let delta = 0, reason = "estável";

    const gain = clamp((rating - 6.9) * 1.6, 0, 3) * clamp((minutes - 0.4) / 0.6, 0, 1) * (0.5 + 0.5 * reg);
    if (gain > 0 && ageW > 0 && severe === 0) { delta += gain * ageW * closeness * profileGrowthFactor(prof.id, age, exceptional); reason = exceptional ? "desempenho excepcional" : "bom desempenho"; }
    // quedas
    let loss = 0;
    if (minutes < 0.2 && age <= 24) loss += 0.4 * (1 - minutes / 0.2 * 0.5);
    if (rating < 6.2) loss += clamp((6.2 - rating) * 1.0, 0, 2);
    if (age >= 30) loss += 0.4 + 0.1 * (age - 30);
    if (severe > 0) loss += Math.min(2, 0.8 * severe) + (severe >= 2 ? 0.5 : 0);
    if (inj >= 4) loss += 0.3;
    if (prof.id === "early_unstable") loss *= 1.3;
    if (prof.id === "longevity") loss *= 0.8;
    if (loss > 0) { delta -= loss; reason = severe > 0 ? "lesões graves" : minutes < 0.2 ? "pouca minutagem" : rating < 6.2 ? "temporada ruim" : age >= 30 ? "idade" : reason; }

    if (gk) delta *= delta > 0 ? 0.8 : 0.7;               // goleiros oscilam menos
    delta = clamp(delta, -LIMITS.maxFallPerReview, LIMITS.maxRisePerReview);
    return out(delta, reason, { exceptional });
  }

  const tierOf = (pot) => (pot < LIMITS.tiers.low ? "baixo" : pot < LIMITS.tiers.mid ? "medio" : pot < LIMITS.tiers.high ? "alto" : "elite");
  // Panorama sem efeito colateral: faixa, teto e pico projetado usando as variações esperadas da 32B.
  function potentialOutlook(player, context) {
    const pot = potentialOf(player), ovr = baseOvr(player), ceil = effectiveCeiling(player, context), prof = profileOf(player || {}, context);
    let o = ovr, age = ageOf(player), steps = 0;
    while (Dev && age <= prof.params.peakAge && steps < 30) {
      const e = Dev.expectedAnnualChange({ ...player, age, overall: o, ovr: o, potential: pot.value, developmentProfile: { id: prof.id } }, context);
      o = Math.min(ceil, o + Math.max(0, e.expected)); age++; steps++;
    }
    const peak = round2(clamp(Math.max(ovr, o), ovr, ceil));
    return { tier: tierOf(Math.max(pot.value, ovr)), potential: Math.max(pot.value, ovr), estimated: pot.estimated, overall: ovr, ceiling: ceil, headroom: round2(ceil - ovr),
      projectedPeak: peak, peakAge: prof.params.peakAge, profile: prof.id, profileSource: prof.source, goalkeeper: isGK(player) };
  }

  const api = { LIMITS, effectiveCeiling, reviewPotential, potentialOutlook, potentialOf, tierOf };
  root.ProLifeDynamicPotential = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
