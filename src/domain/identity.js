(function (root) {
  "use strict";
  // Etapa 13 — Identidade do jogador: afinidades, perfil híbrido e árvore de especializações.
  // Catálogos (arquétipos/especializações) vivem em training.js; aqui ficam regras derivadas.
  // Tudo é determinístico: nenhuma decisão usa RNG, relógio ou UUID.
  const Training = root.ProLifeTraining || (typeof require === "function" ? require("./training.js") : null);
  const Stats = () => root.ProLifeStatistics || (typeof require === "function" ? require("./statistics.js") : null);
  const VERSION = 1;
  const MATCH_RATE = 0.02, TRAINING_RATE = 0.004, SHIFT_MARGIN = 7, SHIFT_STREAK = 20, SHIFT_COOLDOWN = 40, SECONDARY_MIN = 55, XP_BONUS = 0.06;
  // Perfil secundário pode vir de posição vizinha (híbrido); o principal precisa ser compatível com a posição.
  const adjacent = { ATA: ["MEI"], MEI: ["ATA", "DEF"], DEF: ["MEI"], GOL: [] };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round3 = (v) => Math.round(v * 1000) / 1000;
  const catalog = () => Training.archetypeCatalog;
  const specs = () => Training.specializations;

  function compatible(pos) { return Object.values(catalog()).filter((a) => a.positions.includes(pos)).map((a) => a.id); }
  function tracked(pos) { const near = adjacent[pos] || []; return Object.values(catalog()).filter((a) => a.positions.includes(pos) || a.positions.some((p) => near.includes(p))).map((a) => a.id); }
  function mean(attrs, keys) { return keys.length ? keys.reduce((n, k) => n + Number(attrs?.[k] || 40), 0) / keys.length : 40; }
  function fitScore(s, id) { return clamp(mean(s.person.attrs, catalog()[id]?.focus || []) * 1.25 - 25, 0, 100); }
  function styleBonus(s, id) {
    const focus = Training.styleFocus[s.person.style] || [];
    return (catalog()[id]?.focus || []).some((k) => focus.includes(k)) ? 4 : 0;
  }
  function fresh(s) {
    // Migração/criação: apenas posição, atributos atuais e estilo existentes. Sem histórico inventado.
    const behavior = {};
    const ok = compatible(s.person.pos);
    for (const id of tracked(s.person.pos)) behavior[id] = round3(clamp(fitScore(s, id) * 0.6 + 18 + (id === s.person.archetypeId ? 12 : 0) + styleBonus(s, id) - (ok.includes(id) ? 0 : 10), 0, 100));
    return { version: VERSION, behavior, matches: 0, sessions: 0, shiftStreak: 0, notified: [], history: [], derivedFrom: "current" };
  }
  function init(s) {
    if (s.mode !== "player" || !s.person) return null;
    const plan = Training.init(s);
    let id = plan.identity;
    if (!id || typeof id !== "object" || !id.behavior || typeof id.behavior !== "object") id = plan.identity = fresh(s);
    if (!Array.isArray(id.notified)) id.notified = [];
    if (!Array.isArray(id.history)) id.history = [];
    for (const k of ["matches", "sessions", "shiftStreak"]) if (!Number.isFinite(id[k])) id[k] = 0;
    // Mudança de posição: novos arquétipos rastreados entram com base nos atributos, sem apagar os anteriores.
    const seed = fresh(s).behavior;
    for (const a of tracked(s.person.pos)) if (!Number.isFinite(id.behavior[a])) id.behavior[a] = seed[a];
    return id;
  }
  function affinities(s) {
    const id = init(s); if (!id) return [];
    const ok = compatible(s.person.pos);
    return tracked(s.person.pos).map((a) => ({ id: a, name: catalog()[a].name, value: Math.round(clamp(id.behavior[a] * 0.55 + fitScore(s, a) * 0.45, 0, 100)), compatible: ok.includes(a) }))
      .sort((x, y) => y.value - x.value || x.id.localeCompare(y.id));
  }
  function profile(s) {
    const list = affinities(s), primary = s.person.archetypeId;
    const second = list.find((a) => a.id !== primary && a.value >= SECONDARY_MIN);
    return { primary, secondary: second?.id || null, list };
  }
  // Sinal por partida usando somente métricas registradas (gols, assistências, finalizações, xG, desarmes, defesas, clean sheet, minutos, nota).
  function matchSignal(id, m) {
    const base = 30 + clamp((Number(m.rating || 6.5) - 6.5) * 10, -10, 15), g = m.goals || 0, a = m.assists || 0, tk = m.tackles || 0, sv = m.saves || 0, cs = m.cleanSheet || 0, sh = m.shots || 0, ot = m.onTarget || 0, xg = m.xg || 0, mins = (m.minutes || 0) / 90;
    const table = {
      finisher: g * 28 + ot * 5 + xg * 10, nine: g * 24 + ot * 4 + xg * 12, dribbler: a * 18 + g * 10 + sh * 3 + (m.rating >= 7.5 ? 10 : 0),
      winger: a * 20 + g * 14 + sh * 2, maestro: a * 30 + (m.rating >= 7.2 ? 8 : 0), engine: tk * 5 + a * 10 + g * 8 + mins * 10,
      builder: tk * 4 + a * 14 + cs * 12, wall: tk * 7 + cs * 22, fullback: tk * 4 + a * 22 + cs * 8, guardian: sv * 7 + cs * 30,
    };
    return clamp(base + (table[id] || 0), 0, 100);
  }
  function trainingSignal(id, category) {
    const focus = catalog()[id]?.focus || [], attrs = category?.attrs || [];
    const overlap = attrs.filter((k) => focus.includes(k)).length / Math.max(1, Math.min(focus.length, attrs.length));
    return 35 + 65 * overlap;
  }
  function post(s, title, body) { const C = root.ProLifeCareer || root.ProLife?.Career; try { C?.post?.(s, "Carreira", "Treinador", title, body); } catch (_) { /* notícia é opcional */ } }
  function onTraining(s, category) {
    const id = init(s); if (!id || !category) return;
    for (const a of Object.keys(id.behavior)) if (tracked(s.person.pos).includes(a)) id.behavior[a] = round3(id.behavior[a] + TRAINING_RATE * (trainingSignal(a, category) - id.behavior[a]));
    id.sessions++;
  }
  function onMatch(s, metrics) {
    const id = init(s); if (!id) return null;
    for (const a of tracked(s.person.pos)) id.behavior[a] = round3(id.behavior[a] + MATCH_RATE * (matchSignal(a, metrics) - id.behavior[a]));
    id.matches++;
    const shifted = reviewPrimary(s, id);
    notifyAvailable(s, id);
    return shifted;
  }
  // Mudança gradual: o líder precisa superar o principal por margem durante várias partidas seguidas.
  function reviewPrimary(s, id) {
    const list = affinities(s).filter((a) => a.compatible), primary = s.person.archetypeId;
    const leader = list[0], current = list.find((a) => a.id === primary);
    const last = id.history.length ? Number(id.history[id.history.length - 1].match || 0) : -Infinity;
    if (!leader || !current || leader.id === primary || leader.value - current.value < SHIFT_MARGIN || id.matches - last < SHIFT_COOLDOWN) { id.shiftStreak = 0; return null; }
    id.shiftStreak++;
    if (id.shiftStreak < SHIFT_STREAK) return null;
    id.shiftStreak = 0;
    s.person.archetypeId = leader.id;
    const plan = Training.init(s);
    id.history.push({ season: s.season, day: s.day, match: id.matches, from: primary, to: leader.id });
    id.history = id.history.slice(-20);
    post(s, "Evolução de perfil reconhecida", `A comissão técnica percebeu que seu jogo mudou: de ${catalog()[primary]?.name || primary} para ${plan.archetype.name}. Os treinos passam a considerar essa identidade.`);
    return { from: primary, to: leader.id };
  }
  function careerStats(s) { try { return Stats()?.heroDashboard?.(s)?.career || {}; } catch (_) { return {}; } }
  function treeArchetypes(s) {
    const p = profile(s), out = [p.primary];
    if (p.secondary && p.secondary !== p.primary) out.push(p.secondary);
    return out;
  }
  function requirements(s, specId, cache) {
    const spec = specs()[specId];
    if (!spec || spec.legacy) return { met: false, items: [], reason: "Especialização inválida." };
    const plan = Training.init(s), aff = affinities(s).find((a) => a.id === spec.archetype), req = spec.req || {};
    const items = [];
    const inTree = treeArchetypes(s).includes(spec.archetype);
    items.push({ type: "archetype", label: `Perfil ${catalog()[spec.archetype]?.name || spec.archetype} (principal ou secundário)`, met: inTree });
    items.push({ type: "level", label: `Nível ${req.level || 1}`, current: plan.level, target: req.level || 1, met: plan.level >= (req.level || 1) });
    items.push({ type: "affinity", label: `Afinidade ${req.affinity || 0}`, current: aff?.value || 0, target: req.affinity || 0, met: (aff?.value || 0) >= (req.affinity || 0) });
    for (const [k, v] of Object.entries(req.attrs || {})) items.push({ type: "attr", key: k, label: `${Training.skills[k] || k} ${v}`, current: Math.round(Number(s.person.attrs[k] || 0)), target: v, met: Number(s.person.attrs[k] || 0) >= v });
    if (cache?.gate && !items.every((x) => x.met)) return { met: false, items, reason: `Requisito pendente: ${items.find((x) => !x.met).label}.` };
    const statLabels = { goals: "Gols", assists: "Assistências", tackles: "Desarmes", saves: "Defesas", cleanSheets: "Jogos sem sofrer gol", appearances: "Jogos", shots: "Finalizações" };
    const needStats = Object.keys(req.stats || {}).length;
    const career = needStats ? (cache?.career || careerStats(s)) : {};
    if (cache && needStats) cache.career = career;
    for (const [k, v] of Object.entries(req.stats || {})) items.push({ type: "stat", key: k, label: `${statLabels[k] || k} na carreira: ${v}`, current: Number(career[k] || 0), target: v, met: Number(career[k] || 0) >= v });
    const met = items.every((x) => x.met);
    const missing = items.find((x) => !x.met);
    return { met, items, reason: met ? null : `Requisito pendente: ${missing.label}.` };
  }
  function notifyAvailable(s, id) {
    const plan = Training.init(s), cache = { gate: true };
    for (const arch of treeArchetypes(s)) for (const [specId, spec] of Object.entries(specs())) {
      if (spec.legacy || spec.archetype !== arch || plan.specializations.includes(specId) || id.notified.includes(specId)) continue;
      if (!requirements(s, specId, cache).met) continue;
      id.notified.push(specId);
      post(s, "Nova especialização disponível", `${spec.name} (${catalog()[arch].name}) já pode ser desbloqueada no seu desenvolvimento.`);
    }
  }
  function onUnlock(s, specId) {
    const id = init(s); if (!id) return;
    if (!id.notified.includes(specId)) id.notified.push(specId);
  }
  function activeSpec(s) { const plan = Training.init(s), spec = specs()[plan.activeSpecialization]; return spec && !spec.legacy ? spec : null; }
  function matchXpBonus(s, metrics, xp) {
    const spec = activeSpec(s); if (!spec) return 0;
    const action = spec.action, value = action === "rating" ? Math.max(0, (metrics.rating || 0) - 6.8) : action === "minutes" ? (metrics.minutes || 0) / 90 : Number(metrics[action] || 0);
    return value > 0 ? xp * XP_BONUS : 0;
  }
  function trainingXpMultiplier(s, category) {
    const spec = activeSpec(s); if (!spec || !category) return 1;
    return category.attrs.some((k) => spec.attrs.includes(k)) ? 1 + XP_BONUS : 1;
  }
  function relevantKeys(s) { const set = new Set(); for (const a of tracked(s.person.pos)) for (const k of catalog()[a].focus) set.add(k); return [...set]; }
  function strengths(s, n = 3) {
    return relevantKeys(s).map((k) => ({ key: k, label: Training.skills[k] || k, value: Math.round(Number(s.person.attrs[k] || 0)) }))
      .sort((a, b) => b.value - a.value || a.key.localeCompare(b.key)).slice(0, n);
  }
  function toDevelop(s, n = 3) {
    const spec = activeSpec(s), arch = catalog()[s.person.archetypeId], targets = {};
    const add = (k, t) => { targets[k] = Math.max(targets[k] || 0, t); };
    for (const k of arch?.focus || []) add(k, 75);
    for (const sp of Object.values(specs())) if (!sp.legacy && sp.archetype === arch?.id) for (const [k, v] of Object.entries(sp.req?.attrs || {})) add(k, v);
    if (spec) { for (const k of spec.attrs) add(k, 78); for (const [k, v] of Object.entries(spec.req?.attrs || {})) add(k, v + 4); }
    return Object.entries(targets).map(([k, t]) => ({ key: k, label: Training.skills[k] || k, value: Math.round(Number(s.person.attrs[k] || 0)), target: t }))
      .filter((x) => x.value < x.target).sort((a, b) => (a.value - a.target) - (b.value - b.target) || a.key.localeCompare(b.key)).slice(0, n);
  }
  function recommendation(s) {
    const gaps = toDevelop(s, 4), keys = gaps.length ? gaps.map((g) => g.key) : (catalog()[s.person.archetypeId]?.focus || []);
    let best = null;
    for (const ex of Object.values(Training.exercises)) {
      const cat = Training.trainingCategories[ex.category];
      if (!cat.positions.includes(s.person.pos)) continue;
      const score = cat.attrs.filter((k) => keys.includes(k)).length;
      if (!best || score > best.score) best = { score, ex, cat };
    }
    if (!best) return null;
    const hits = best.cat.attrs.filter((k) => keys.includes(k)).map((k) => Training.skills[k] || k);
    return { exerciseId: best.ex.id, name: best.ex.name, category: best.cat.name, reason: hits.length ? `Trabalha ${hits.join(", ")}.` : "Mantém a base do seu arquétipo." };
  }
  function tree(s) {
    const plan = Training.init(s), cache = {};
    return treeArchetypes(s).map((arch, i) => ({
      archetype: arch, name: catalog()[arch].name, role: i === 0 ? "principal" : "secundário",
      specializations: Object.entries(specs()).filter(([, sp]) => !sp.legacy && sp.archetype === arch).map(([specId, sp]) => {
        const unlocked = plan.specializations.includes(specId), req = requirements(s, specId, cache);
        const state = plan.activeSpecialization === specId ? "ATIVA" : unlocked ? "DESBLOQUEADA" : req.met ? "DISPONÍVEL" : "BLOQUEADA";
        return { id: specId, name: sp.name, description: sp.description, attrs: sp.attrs.map((k) => Training.skills[k] || k), state, requirements: req.items, canUnlock: !unlocked && req.met && plan.specializationPoints > 0 && plan.specializations.length < Training.MAX_SPECIALIZATIONS };
      }),
    }));
  }
  function view(s) {
    const id = init(s); if (!id) return null;
    const plan = Training.init(s), p = profile(s), spec = activeSpec(s);
    return {
      primary: { id: p.primary, ...catalog()[p.primary] }, secondary: p.secondary ? { id: p.secondary, ...catalog()[p.secondary] } : null,
      affinities: p.list, activeSpecialization: spec ? { id: plan.activeSpecialization, ...spec } : null,
      legacy: plan.specializations.filter((x) => specs()[x]?.legacy).map((x) => specs()[x]),
      points: plan.specializationPoints, level: plan.level, tree: tree(s), strengths: strengths(s), toDevelop: toDevelop(s), recommendation: recommendation(s),
      history: id.history.slice(-5), shiftStreak: id.shiftStreak, matches: id.matches,
    };
  }
  // ---- Integrações leves (peso pequeno, nunca decisivo) ----
  const tacticPrefs = { possession: ["maestro", "builder", "dribbler", "fullback"], counter: ["winger", "finisher", "engine", "wall"], attack: ["finisher", "nine", "dribbler", "winger", "fullback"] };
  // Mercado: clube valoriza o que o jogador agrega ao grupo da posição (complementaridade) e, se houver, o plano tático.
  function styleFit(s, club) {
    if (s.mode !== "player" || !club || !s.person?.archetypeId) return 0;
    const focus = catalog()[s.person.archetypeId]?.focus || [];
    const group = (club.roster || []).filter((p) => p.pos === s.person.pos && p.id !== "hero");
    const rosterAvg = group.length ? group.reduce((n, p) => n + mean(p.attrs, focus), 0) / group.length : 50;
    let fit = clamp((mean(s.person.attrs, focus) - rosterAvg) / 15, 0, 1);
    const p = profile(s), pref = tacticPrefs[club.tactic] || [];
    if (pref.includes(p.primary)) fit += 0.5; else if (p.secondary && pref.includes(p.secondary)) fit += 0.25;
    return round3(clamp(fit, 0, 1.5));
  }
  // Seleção: identidade bem definida facilita encaixe tático (até +1 ponto).
  function tacticalFit(s) {
    if (s.mode !== "player" || !s.person?.archetypeId || !s.trainingPlan?.identity) return 0;
    const a = affinities(s).find((x) => x.id === s.person.archetypeId);
    return round3(clamp(((a?.value || 50) - 50) / 40, 0, 1));
  }
  // Patrocínio: identidade marcante tem apelo comercial pequeno (até +2,5 pontos no score).
  const flair = ["finisher", "nine", "dribbler", "winger", "maestro"];
  function commercialAppeal(s) {
    if (s.mode !== "player" || !s.person?.archetypeId || !s.trainingPlan?.identity) return 0;
    const a = affinities(s).find((x) => x.id === s.person.archetypeId), strength = clamp(((a?.value || 50) - 45) / 40, 0, 1);
    return round3(strength * (flair.includes(s.person.archetypeId) ? 2.5 : 1.5));
  }
  const api = { VERSION, init, affinities, profile, requirements, tree, view, strengths, toDevelop, recommendation, onTraining, onMatch, onUnlock, matchXpBonus, trainingXpMultiplier, styleFit, tacticalFit, commercialAppeal, compatible, tracked, matchSignal };
  root.ProLifeIdentity = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
