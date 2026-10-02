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
  const styleFocus = {
    "Técnico": ["technique", "ballControl", "dribbling", "finesseShot"],
    Velocista: ["pace", "acceleration", "sprint", "agility"],
    Organizador: ["pass", "longPass", "vision", "crossing"],
    Combativo: ["defense", "tackling", "interception", "strength"],
  };
  function expand(attrs) {
    const a = attrs || {};
    const source = {
      acceleration: a.pace, sprint: a.pace, agility: a.pace,
      powerShot: a.finish, finesseShot: a.finish, longShot: a.finish, freeKick: a.finish, penalty: a.finish,
      heading: Math.round(((a.finish || 40) + (a.strength || 40)) / 2), jumping: a.strength,
      longPass: a.pass, vision: a.pass, crossing: a.pass, technique: a.pass, dribbling: a.pass, ballControl: a.pass,
      tackling: a.defense, interception: a.defense, balance: a.strength,
      positioning: Math.round(((a.pass || 40) + (a.finish || 40)) / 2), composure: Math.round(((a.pass || 40) + (a.finish || 40)) / 2),
    };
    for (const key of Object.keys(skills)) if (!Number.isFinite(a[key])) a[key] = Math.max(20, Math.min(95, Number(source[key] ?? 40)));
    return a;
  }
  function init(s) {
    expand(s.person.attrs);
    for (const c of s.clubs) for (const p of c.roster) expand(p.attrs);
    if (!s.trainingPlan) s.trainingPlan = { focus: s.training || "balanced", style: s.person.style || "Técnico", sessions: 0, improvements: 0 };
    return s.trainingPlan;
  }
  function daily(s, rng, helpers) {
    const plan = init(s);
    if (s.person.injury || s.mode !== "player") return null;
    const gain = s.intensity === "hard" ? 2.5 : s.intensity === "rest" ? 0.25 : 1.45;
    s.trainingProgress += gain;
    plan.sessions++;
    if (s.trainingProgress < 10) return null;
    s.trainingProgress -= 10;
    const pool = plan.focus === "balanced" ? (styleFocus[plan.style] || Object.keys(skills)) : [plan.focus];
    const key = pool[Math.floor(rng.next() * pool.length)] || "pace";
    const chance = Math.min(0.92, 0.48 + s.person.discipline / 220 + (s.person.age < 23 ? 0.12 : 0));
    if (rng.next() <= chance && helpers.overall(s.person) < s.person.potential && s.person.age < 33) {
      s.person.attrs[key] = helpers.clamp(s.person.attrs[key] + 1, 20, 95);
      if (!core.includes(key)) {
        const related = key.includes("pass") || ["vision", "crossing", "technique", "dribbling", "ballControl"].includes(key) ? "pass" :
          ["tackling", "interception"].includes(key) ? "defense" : ["acceleration", "sprint", "agility"].includes(key) ? "pace" :
          ["balance", "jumping"].includes(key) ? "strength" : "finish";
        if (plan.improvements % 2 === 1) s.person.attrs[related] = helpers.clamp(s.person.attrs[related] + 1, 20, 95);
      }
      plan.improvements++;
      return { key, label: skills[key] };
    }
    return null;
  }
  const api = { core, skills, styleFocus, expand, init, daily };
  root.ProLifeTraining = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
