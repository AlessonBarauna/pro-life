(function (root) {
  "use strict";
  const decisions = [
    { id: "family", title: "Um fim de semana em família", body: "Uma pausa pode aliviar a pressão, mas reduz o foco no treino.", choices: [["visit", "Visitar a família"], ["work", "Priorizar o trabalho"]] },
    { id: "media", title: "Convite para uma entrevista", body: "Sua opinião pode aproximar a torcida e aumentar a cobrança.", choices: [["humble", "Falar com equilíbrio"], ["bold", "Prometer grandes resultados"]] },
    { id: "agent", title: "Assessoria de carreira", body: "Uma agência oferece representação contínua e novas oportunidades.", choices: [["hire", "Contratar a agência"], ["decline", "Seguir por conta própria"]] },
    { id: "community", title: "Projeto social do bairro", body: "Sua presença inspira jovens, mas ocupa um dia de recuperação.", choices: [["support", "Participar do projeto"], ["skip", "Preservar a rotina"]] },
    { id: "sponsor", title: "Campanha de patrocinador", body: "Uma campanha curta paga cachê e amplia sua exposição.", choices: [["campaign", "Aceitar a campanha"], ["protect", "Proteger a imagem"]] },
    { id: "criticism", title: "Crítica após uma atuação", body: "Um comentarista questionou seu momento. Sua resposta pode mudar a pressão e a percepção pública.", choices: [["respond_calm", "Responder com serenidade"], ["respond_fire", "Rebater publicamente"]] },
    { id: "fans", title: "Encontro inesperado com torcedores", body: "Torcedores pedem sua atenção depois do treino, em uma semana de agenda cheia.", choices: [["meet_fans", "Atender os torcedores"], ["leave_fans", "Preservar a recuperação"]] },
    { id: "social", title: "Publicação viral", body: "Uma postagem sua ganhou grande repercussão. Você pode aproveitar o alcance ou reduzir a exposição.", choices: [["embrace_social", "Aproveitar a repercussão"], ["quiet_social", "Diminuir a exposição"]] },
  ];
  function init(s) {
    if (!s.life) s.life = { agency: null, events: [], lastDecisionDay: 0 };
    return s.life;
  }
  function next(s, rng) {
    const life = init(s), pool = life.agency ? decisions.filter((d) => d.id !== "agent") : decisions;
    life.lastDecisionDay = s.day;
    return JSON.parse(JSON.stringify(rng.pick(pool)));
  }
  function decide(s, choice, helpers) {
    const life = init(s);
    if (choice === "hire") {
      if (s.wallet < 900) throw Error("Saldo insuficiente.");
      helpers.transaction(s, -900, "Contratação de assessoria");
      life.agency = { name: "Pro Carreiras", hiredDay: s.day, monthlyCost: 250, level: 1 };
      s.reputation = Math.min(100, s.reputation + 4);
    }
    if (choice === "support") { s.family = Math.min(100, s.family + 5); s.reputation = Math.min(100, s.reputation + 3); s.fans += 150; }
    if (choice === "campaign") { helpers.transaction(s, 1800, "Campanha de patrocinador"); s.fans += 250; s.stress = Math.min(100, s.stress + 5); }
    if (choice === "protect") s.reputation = Math.min(100, s.reputation + 1);
    if (choice === "respond_calm") { s.reputation = Math.min(100, s.reputation + 2); s.stress = Math.max(0, s.stress - 2); helpers.updateMediaProfile?.(s,{pressure:-4,fans:3,sponsor:2}); }
    if (choice === "respond_fire") { s.fans += 180; s.stress = Math.min(100,s.stress+8); helpers.updateMediaProfile?.(s,{pressure:10,fans:-4,sponsor:-4,controversy:1}); }
    if (choice === "meet_fans") { s.fans += 300; s.reputation = Math.min(100,s.reputation+2); s.person.condition=Math.max(0,s.person.condition-3); helpers.updateMediaProfile?.(s,{fans:8,sponsor:3}); }
    if (choice === "leave_fans") { s.person.condition=Math.min(100,s.person.condition+2); helpers.updateMediaProfile?.(s,{fans:-3,pressure:-1}); }
    if (choice === "embrace_social") { s.fans += 500; s.stress=Math.min(100,s.stress+5); helpers.updateMediaProfile?.(s,{fans:5,sponsor:5,pressure:4}); }
    if (choice === "quiet_social") { s.stress=Math.max(0,s.stress-6); helpers.updateMediaProfile?.(s,{pressure:-5,sponsor:-1}); }
    life.events.unshift({ day: s.day, season: s.season, choice });
    life.events = life.events.slice(0, 80);
  }
  function monthly(s, helpers) {
    const life = init(s);
    if (!life.agency) return;
    helpers.transaction(s, -life.agency.monthlyCost, "Mensalidade da assessoria");
    s.fans += 80 * life.agency.level;
  }
  const api = { decisions, init, next, decide, monthly };
  root.ProLifeLife = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
