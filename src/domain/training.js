(function (root) {
  "use strict";
  const core = ["pace", "finish", "pass", "defense", "strength", "stamina"];
  const skills = {
    pace: "Velocidade", acceleration: "Aceleração", sprint: "Pique", agility: "Agilidade",
    finish: "Finalização", powerShot: "Força do chute", finesseShot: "Chute colocado", longShot: "Chute de longe",
    freeKick: "Falta", penalty: "Pênalti", heading: "Cabeceio", jumping: "Impulsão",
    pass: "Passe curto", longPass: "Passe longo", vision: "Visão", crossing: "Cruzamento", technique: "Técnica",
    dribbling: "Drible", ballControl: "Controle de bola", defense: "Marcação", tackling: "Desarme",
    interception: "Interceptação", strength: "Força", balance: "Equilíbrio", stamina: "Resistência",
    positioning: "Posicionamento", composure: "Compostura",
  };
  const groups = {
    pace: ["pace", "acceleration", "sprint", "agility"],
    finish: ["finish", "powerShot", "finesseShot", "longShot", "freeKick", "penalty", "heading", "positioning", "composure"],
    pass: ["pass", "longPass", "vision", "crossing", "technique", "dribbling", "ballControl", "composure"],
    defense: ["defense", "tackling", "interception", "positioning"],
    strength: ["strength", "balance", "jumping", "heading"],
    stamina: ["stamina", "pace", "balance"],
  };
  const styleFocus = {
    "Técnico": ["technique", "ballControl", "dribbling", "finesseShot", "composure"],
    Velocista: ["pace", "acceleration", "sprint", "agility", "stamina"],
    Organizador: ["pass", "longPass", "vision", "crossing", "technique", "ballControl"],
    Combativo: ["defense", "tackling", "interception", "strength", "stamina", "positioning"],
  };
  const archetypes = {
    GOL: { name: "Guardião", description: "Reflexos, posicionamento e segurança sob pressão.", focus: ["positioning", "composure", "longPass", "jumping"] },
    ZAG: { name: "Muralha", description: "Leitura defensiva, força e domínio dos duelos.", focus: ["defense", "tackling", "interception", "strength", "heading"] },
    LAT: { name: "Ala Dinâmico", description: "Explosão, resistência e apoio pelos lados.", focus: ["pace", "stamina", "crossing", "tackling", "acceleration"] },
    VOL: { name: "Motor", description: "Equilíbrio entre proteção, intensidade e construção.", focus: ["interception", "stamina", "pass", "strength", "positioning"] },
    MEI: { name: "Maestro", description: "Visão, técnica e criação entre as linhas.", focus: ["vision", "pass", "technique", "ballControl", "longPass"] },
    PE: { name: "Ponta Incisivo", description: "Aceleração, drible e agressividade no último terço.", focus: ["acceleration", "sprint", "dribbling", "finesseShot", "crossing"] },
    PD: { name: "Ponta Incisivo", description: "Aceleração, drible e agressividade no último terço.", focus: ["acceleration", "sprint", "dribbling", "finesseShot", "crossing"] },
    ATA: { name: "Finalizador", description: "Movimentação, frieza e definição das chances.", focus: ["finish", "positioning", "composure", "powerShot", "heading"] },
  };
  const specializations = {
    explosive: { name: "Explosão", description: "Treinos de velocidade rendem mais progresso.", attrs: ["pace", "acceleration", "sprint"] },
    creator: { name: "Criador", description: "Ações de criação valorizam passe, visão e técnica.", attrs: ["pass", "vision", "technique", "longPass"] },
    finisher: { name: "Matador", description: "Gols aceleram o desenvolvimento ofensivo.", attrs: ["finish", "positioning", "composure", "powerShot"] },
    engine: { name: "Motor", description: "Treino físico favorece resistência e equilíbrio.", attrs: ["stamina", "strength", "balance"] },
    stopper: { name: "Especialista Defensivo", description: "Atuações sólidas favorecem marcação e desarme.", attrs: ["defense", "tackling", "interception", "positioning"] },
  };
  const related = {
    acceleration: "pace", sprint: "pace", agility: "pace", powerShot: "finish", finesseShot: "finish", longShot: "finish",
    freeKick: "finish", penalty: "finish", heading: "finish", jumping: "strength", longPass: "pass", vision: "pass",
    crossing: "pass", technique: "pass", dribbling: "pass", ballControl: "pass", tackling: "defense", interception: "defense",
    balance: "strength", positioning: "finish", composure: "finish",
  };
  function clamp(v) { return Math.max(20, Math.min(100, Math.round(v))); }
  function expand(attrs) {
    const a = attrs || {};
    const source = {
      acceleration: a.pace, sprint: a.pace, agility: a.pace, powerShot: a.finish, finesseShot: a.finish, longShot: a.finish,
      freeKick: a.finish, penalty: a.finish, heading: ((a.finish || 40) + (a.strength || 40)) / 2, jumping: a.strength,
      longPass: a.pass, vision: a.pass, crossing: a.pass, technique: a.pass, dribbling: a.pass, ballControl: a.pass,
      tackling: a.defense, interception: a.defense, balance: a.strength,
      positioning: ((a.pass || 40) + (a.finish || 40)) / 2, composure: ((a.pass || 40) + (a.finish || 40)) / 2,
    };
    for (const key of Object.keys(skills)) if (!Number.isFinite(a[key])) a[key] = clamp(source[key] ?? 40);
    return a;
  }
  function groupRatings(attrs) {
    const a = expand(attrs);
    // Os seis atributos principais são a fonte canônica exibida em todo o jogo.
    // Os 21 subatributos detalham esses grupos e afetam treino/desempenho, sem criar um segundo valor visual.
    return Object.fromEntries(core.map((key) => [key, clamp(a[key])]));
  }
  function ceiling(s, helpers) {
    const plan = init(s);
    const current = helpers.overall(s.person);
    const earned = Math.floor((plan.accoladePoints || 0) / 4);
    return Math.min(100, Math.max(Number(s.person.potential) || 70, current + 3, 82 + earned));
  }
  function init(s) {
    expand(s.person.attrs);
    for (const c of s.clubs) for (const p of c.roster) expand(p.attrs);
    if (!s.trainingPlan) s.trainingPlan = { focus: s.training || "balanced", style: s.person.style || "Técnico", sessions: 0, improvements: 0, accoladePoints: 0, weeklyXI: 0 };
    if (!Number.isFinite(s.trainingPlan.accoladePoints)) s.trainingPlan.accoladePoints = 0;
    if (!Number.isFinite(s.trainingPlan.weeklyXI)) s.trainingPlan.weeklyXI = 0;
    if (!Number.isFinite(s.trainingPlan.developmentXp)) s.trainingPlan.developmentXp = 0;
    if (!Number.isFinite(s.trainingPlan.level)) s.trainingPlan.level = 1;
    if (!Array.isArray(s.trainingPlan.specializations)) s.trainingPlan.specializations = [];
    if (!Number.isFinite(s.trainingPlan.specializationPoints)) s.trainingPlan.specializationPoints = 0;
    s.trainingPlan.archetype = archetypes[s.person.pos] || archetypes.MEI;
    s.trainingPlan.style = s.person.style || s.trainingPlan.style || "Técnico";
    return s.trainingPlan;
  }
  function improve(s, key, amount, helpers) {
    expand(s.person.attrs);
    const before = s.person.attrs[key];
    s.person.attrs[key] = helpers.clamp(before + amount, 20, 100);
    return s.person.attrs[key] > before;
  }
  function addDevelopmentXp(s, amount) {
    const plan = init(s), before = plan.level;
    plan.developmentXp += Math.max(0, amount || 0);
    plan.level = Math.min(30, 1 + Math.floor(plan.developmentXp / 18));
    if (plan.level > before) plan.specializationPoints += plan.level - before;
    return plan.level - before;
  }
  function unlockSpecialization(s, id) {
    const plan = init(s);
    if (!specializations[id]) throw Error("Especialização inválida.");
    if (plan.specializations.includes(id)) return plan;
    if (plan.specializationPoints < 1) throw Error("Você precisa de um ponto de especialização.");
    if (plan.specializations.length >= 3) throw Error("Limite de três especializações atingido.");
    plan.specializationPoints--;
    plan.specializations.push(id);
    return plan;
  }
  function specializationBonus(plan, key) {
    return plan.specializations.some((id) => specializations[id]?.attrs.includes(key)) ? 0.18 : 0;
  }
  function daily(s, rng, helpers) {
    const plan = init(s);
    if (s.person.injury || s.mode !== "player") return null;
    const ageFactor = s.person.age <= 20 ? 1.35 : s.person.age <= 24 ? 1.2 : s.person.age <= 29 ? 1 : 0.72;
    const focusKey = plan.focus === "balanced" ? null : plan.focus;
    const specBoost = focusKey ? specializationBonus(plan, focusKey) : 0;
    const gain = (s.intensity === "hard" ? 3.6 : s.intensity === "rest" ? 0.4 : 2.35) * ageFactor * (1 + specBoost);
    s.trainingProgress += gain; plan.sessions++; addDevelopmentXp(s, 0.35 + gain * 0.08);
    if (s.trainingProgress < 8) return null;
    s.trainingProgress -= 8;
    const stylePool = styleFocus[plan.style] || Object.keys(skills);
    // O foco escolhido domina o treino; o estilo define a evolução secundária.
    const pool = plan.focus === "balanced" ? stylePool : [plan.focus, plan.focus, plan.focus, plan.focus, ...(stylePool.includes(plan.focus) ? [] : stylePool.slice(0, 3))];
    const key = pool[Math.floor(rng.next() * pool.length)] || "pace";
    const currentOverall = helpers.overall(s.person), cap = ceiling(s, helpers);
    const chance = Math.min(0.99, 0.78 + s.person.discipline / 500 + (s.person.age < 23 ? 0.08 : 0));
    if (rng.next() <= chance && currentOverall < cap && s.person.age < 36) {
      const improved = improve(s, key, 1, helpers);
      const parent = related[key];
      if (improved && parent && !core.includes(key) && plan.improvements % 2 === 0) improve(s, parent, 1, helpers);
      if (improved) { plan.improvements++; s.person.potential = Math.max(s.person.potential || 0, Math.min(100, cap)); return { key, label: skills[key], groups: groupRatings(s.person.attrs) }; }
    }
    return null;
  }
  function matchDevelopment(s, match, helpers) {
    if (s.mode !== "player" || !match?.participants?.flat().includes("hero")) return null;
    const plan = init(s), rating = Number(match.ratings?.hero || 0);
    if (rating < 6.5) return null;
    const events = match.events || [];
    const goals = events.filter((e) => e.type === "goal" && e.playerId === "hero").length;
    const assists = events.filter((e) => e.assistPlayerId === "hero").length;
    let xp = rating >= 8.5 ? 3.2 : rating >= 7.5 ? 2.2 : 1.1;
    xp += goals * 1.4 + assists;
    s.trainingProgress += xp;
    addDevelopmentXp(s, Math.max(0.5, (rating - 6) * 1.4 + goals * 1.5 + assists));
    if (rating >= 8) { plan.weeklyXI++; plan.accoladePoints += 1; }
    if (goals) plan.accoladePoints += goals * 0.6;
    if (assists) plan.accoladePoints += assists * 0.5;
    const performance = goals ? ["finish", "positioning", "composure", "powerShot"] : assists ? ["pass", "vision", "technique", "ballControl"] : (styleFocus[s.person.style] || core);
    // Atuações excepcionais podem gerar uma melhoria direta, além do progresso de treino.
    if (rating >= 8.2 && helpers.overall(s.person) < ceiling(s, helpers)) {
      const key = performance[Math.floor((rating * 10 + goals + assists) % performance.length)];
      if (improve(s, key, 1, helpers)) {
        const parent = related[key]; if (parent && !core.includes(key)) improve(s, parent, 1, helpers);
        plan.improvements++;
      }
    }
    return { bonus: true, rating, goals, assists, xp };
  }
  function seasonRewards(s, awards, helpers) {
    if (s.mode !== "player") return 0;
    const plan = init(s); let points = 0;
    for (const a of awards || []) if (a?.winner === s.person.name) {
      points += /Craque/.test(a.name) ? 5 : /Artilheiro|assistências/.test(a.name) ? 4 : 3;
    }
    const own = s.clubId && s.clubs.find((c) => c.id === s.clubId);
    const leagueTitle = own && s.clubs.filter((c) => c.leagueId === own.leagueId).slice().sort((a,b)=>b.stats.points-a.stats.points || (b.stats.gf-b.stats.ga)-(a.stats.gf-a.stats.ga))[0]?.id === own.id;
    if (leagueTitle) points += 4;
    if (s.competitionSchedule?.cup?.champion === own?.name) points += 4;
    if (s.competitionSchedule?.state?.champion === own?.name) points += 2;
    plan.accoladePoints += points;
    if (points) s.person.potential = Math.min(100, Math.max(s.person.potential || 0, helpers.overall(s.person) + 4 + Math.floor(points / 2)));
    return points;
  }
  const api = { core, skills, groups, styleFocus, archetypes, specializations, expand, groupRatings, init, ceiling, addDevelopmentXp, unlockSpecialization, daily, matchDevelopment, seasonRewards };
  root.ProLifeTraining = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
