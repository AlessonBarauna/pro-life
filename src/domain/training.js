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
  const archetypeCatalog = {
    guardian: { id: "guardian", positions: ["GOL"], name: "Guardião", description: "Segurança, posicionamento e saída limpa sob pressão.", focus: ["positioning", "composure", "longPass", "jumping"], weak: ["dribbling", "finish"], xpActions: ["defesas", "clean sheets"] },
    wall: { id: "wall", positions: ["DEF"], name: "Muralha", description: "Leitura defensiva, força e domínio dos duelos.", focus: ["defense", "tackling", "interception", "strength", "heading"], weak: ["dribbling", "finesseShot"], xpActions: ["desarmes", "interceptações"] },
    builder: { id: "builder", positions: ["DEF", "MEI"], name: "Construtor", description: "Defende e inicia jogadas com qualidade desde trás.", focus: ["pass", "longPass", "vision", "interception", "composure"], weak: ["finish", "sprint"], xpActions: ["passes-chave", "saídas limpas"] },
    engine: { id: "engine", positions: ["MEI", "DEF"], name: "Motor", description: "Intensidade, resistência e presença nas duas fases.", focus: ["stamina", "interception", "pass", "strength", "positioning"], weak: ["finesseShot", "heading"], xpActions: ["recuperações", "minutos"] },
    maestro: { id: "maestro", positions: ["MEI"], name: "Maestro", description: "Visão, técnica e criação entre as linhas.", focus: ["vision", "pass", "technique", "ballControl", "longPass"], weak: ["defense", "strength"], xpActions: ["assistências", "passes-chave"] },
    dribbler: { id: "dribbler", positions: ["MEI", "ATA"], name: "Driblador", description: "Desequilíbrio individual, controle e aceleração com a bola.", focus: ["dribbling", "ballControl", "agility", "acceleration", "technique"], weak: ["defense", "heading"], xpActions: ["dribles", "criação"] },
    finisher: { id: "finisher", positions: ["ATA"], name: "Finalizador", description: "Movimentação, frieza e definição das chances.", focus: ["finish", "positioning", "composure", "powerShot", "heading"], weak: ["defense", "longPass"], xpActions: ["gols", "finalizações"] },
    nine: { id: "nine", positions: ["ATA"], name: "Camisa 9", description: "Presença de área, força e jogo aéreo para decidir perto do gol.", focus: ["finish", "heading", "strength", "positioning", "jumping"], weak: ["defense", "crossing"], xpActions: ["gols", "duelos aéreos"] },
    winger: { id: "winger", positions: ["ATA", "MEI"], name: "Ponta Veloz", description: "Ataca o espaço pelos lados com aceleração e cruzamento.", focus: ["pace", "acceleration", "sprint", "crossing", "dribbling"], weak: ["heading", "defense"], xpActions: ["assistências", "arrancadas"] },
    fullback: { id: "fullback", positions: ["DEF"], name: "Lateral Ofensivo", description: "Defende o corredor e chega ao ataque com fôlego e cruzamento.", focus: ["pace", "stamina", "crossing", "defense", "acceleration"], weak: ["heading", "finish"], xpActions: ["assistências", "desarmes"] },
  };
  const defaultArchetypeId = { GOL: "guardian", DEF: "wall", MEI: "maestro", ATA: "finisher" };
  const archetypes = Object.fromEntries(Object.entries(defaultArchetypeId).map(([pos,id]) => [pos, archetypeCatalog[id]]));
  const origins = {
    academy: { name: "Jovem da Base", description: "Formação estruturada, disciplina alta e pressão por evolução.", age: 16, reputation: 12, potential: 4, attrs: { pass: 2, stamina: 2 }, offerBoost: 0, story: { title: "Joia da Base", tagline: "Formado no clube desde cedo: técnica refinada e boa projeção.", ages: [17, 19], age: 18, ovr: [67, 72], potential: [74, 88], reputation: [16, 22], popularity: [7, 11], wallet: 3500, salaryMult: 0.95, expectation: 35, offers: 3, tiers: { serieA: .8, serieB: 3, serieC: 2, serieD: .5 }, level: "Promissor", hint: "Equilibrada" } },
    regional: { name: "Promessa Regional", description: "Destaque local que chega ao profissional já conhecido na região.", age: 18, reputation: 20, potential: 2, attrs: { pace: 2, finish: 2 }, offerBoost: 1, story: { title: "Grande Promessa", tagline: "A mídia já fala de você. Clubes grandes observam — e cobram.", ages: [18, 20], age: 19, ovr: [70, 75], potential: [80, 94], reputation: [26, 34], popularity: [16, 24], wallet: 6000, salaryMult: 1.1, expectation: 60, offers: 3, tiers: { serieA: 3, serieB: 3, serieC: .8, serieD: .1 }, level: "Alto", hint: "Exigente" } },
    comeback: { name: "Recomeço", description: "Uma segunda oportunidade: mais maturidade, menos margem para errar.", age: 23, reputation: 14, potential: -2, attrs: { strength: 3, stamina: 2 }, offerBoost: 0, story: { title: "Recomeço", tagline: "Uma segunda chance depois de anos longe do topo. Menos tempo, mais maturidade.", ages: [23, 28], age: 24, ovr: [64, 70], potential: [66, 76], reputation: [10, 16], popularity: [4, 8], wallet: 3000, salaryMult: 0.95, expectation: 25, offers: 3, tiers: { serieA: .2, serieB: 2, serieC: 3, serieD: 3 }, level: "Maduro", hint: "Desafiadora" } },
    legacy: { name: "Herdeiro de uma Lenda", description: "Nome conhecido, atenção imediata e expectativa elevada.", age: 17, reputation: 28, potential: 3, attrs: { pass: 2, finish: 2 }, offerBoost: 1, story: { title: "Herdeiro de uma Lenda", tagline: "Sobrenome pesado, atenção imediata e comparações inevitáveis.", ages: [16, 19], age: 17, ovr: [64, 70], potential: [78, 92], reputation: [28, 36], popularity: [20, 28], wallet: 8000, salaryMult: 1.05, expectation: 70, offers: 3, tiers: { serieA: 2, serieB: 3, serieC: 1.2, serieD: .3 }, level: "Promissor", hint: "Exigente" } },
    blank: { name: "Página em Branco", description: "Sem vantagem narrativa: sua trajetória será definida em campo.", age: 16, reputation: 15, potential: 0, attrs: {}, offerBoost: 0, story: { title: "Começando do Zero", tagline: "Ninguém conhece você ainda. Cada minuto em campo será conquistado.", ages: [17, 19], age: 18, ovr: [62, 67], potential: [66, 82], reputation: [8, 13], popularity: [3, 6], wallet: 2500, salaryMult: 0.9, expectation: 15, offers: 3, tiers: { serieA: 0, serieB: 1, serieC: 3, serieD: 3 }, level: "Modesto", hint: "Moderada" } },
    hardRoad: { name: "Caminho Difícil", description: "Pouca estrutura, pouca atenção e pouco dinheiro: tudo precisa ser provado em campo.", age: 18, reputation: 6, potential: 0, attrs: {}, offerBoost: -1, story: { title: "Caminho Difícil", tagline: "Pouca estrutura, pouca atenção, pouco dinheiro. Tudo precisa ser provado.", ages: [17, 22], age: 18, ovr: [55, 61], potential: [62, 80], reputation: [4, 8], popularity: [1, 3], wallet: 1200, salaryMult: 0.8, expectation: 10, offers: 2, tiers: { serieA: 0, serieB: .2, serieC: 1.5, serieD: 4 }, level: "Baixo", hint: "Alta" } },
    custom: { name: "Personalizada", description: "Mantém idade e perfil definidos por você, sem bônus forçados.", age: null, reputation: 15, potential: 0, attrs: {}, offerBoost: 0, story: { title: "História Personalizada", tagline: "Você define o ponto de partida dentro de limites realistas.", ages: [16, 32], age: 18, ovr: [45, 80], potential: [70, 86], reputation: [0, 60], popularity: [0, 45], wallet: 5000, salaryMult: 1, expectation: 30, offers: 3, tiers: { serieA: 1, serieB: 2, serieC: 2, serieD: 2 }, level: "Livre", hint: "Você escolhe" } },
  };
  // Especializações da Etapa 13: árvores por arquétipo. Requisitos e efeitos pertencem ao domínio (ver identity.js).
  // req.stats usa somente métricas registradas pela Estatística (carreira do herói).
  const S = (archetype, name, description, attrs, action, req) => ({ archetype, name, description, attrs, action, req });
  const archetypeSpecializations = {
    matador: S("finisher", "Matador", "Frieza para transformar chances em gols.", ["finish", "composure", "positioning"], "goals", { level: 6, affinity: 62, attrs: { finish: 78, composure: 70 }, stats: { goals: 15 } }),
    areaSpecialist: S("finisher", "Especialista de Área", "Movimentação curta e presença no primeiro e segundo pau.", ["positioning", "heading", "finish", "strength"], "onTarget", { level: 5, affinity: 58, attrs: { positioning: 74, heading: 66 }, stats: { goals: 8 } }),
    longRange: S("finisher", "Longa Distância", "Ameaça constante de fora da área.", ["longShot", "powerShot", "finesseShot"], "onTarget", { level: 7, affinity: 55, attrs: { longShot: 74, powerShot: 72 }, stats: { shots: 60 } }),
    targetMan: S("nine", "Pivô", "Segura a bola de costas e faz o time jogar.", ["strength", "ballControl", "pass", "balance"], "assists", { level: 5, affinity: 58, attrs: { strength: 74, ballControl: 68 }, stats: { appearances: 20 } }),
    aerialNine: S("nine", "Cabeceador", "Domínio do jogo aéreo dentro da área.", ["heading", "jumping", "strength"], "goals", { level: 6, affinity: 60, attrs: { heading: 76, jumping: 72 }, stats: { goals: 10 } }),
    mobileNine: S("nine", "Centroavante Móvel", "Ataca a profundidade sem perder a referência.", ["pace", "acceleration", "finish", "positioning"], "goals", { level: 7, affinity: 58, attrs: { pace: 74, finish: 74 }, stats: { goals: 12 } }),
    artist: S("dribbler", "Artista", "Controle curto e repertório no um contra um.", ["dribbling", "ballControl", "agility", "balance"], "rating", { level: 5, affinity: 60, attrs: { dribbling: 78, ballControl: 74 }, stats: { appearances: 20 } }),
    infiltrator: S("dribbler", "Infiltrador", "Conduz em velocidade até a finalização.", ["acceleration", "dribbling", "finish"], "goals", { level: 6, affinity: 58, attrs: { dribbling: 74, acceleration: 74 }, stats: { goals: 6 } }),
    skilledPlaymaker: S("dribbler", "Armador Habilidoso", "Dribla para abrir linhas de passe.", ["dribbling", "vision", "pass", "technique"], "assists", { level: 7, affinity: 58, attrs: { dribbling: 72, vision: 72 }, stats: { assists: 6 } }),
    sprinter: S("winger", "Velocista", "Explosão para ganhar as costas da defesa.", ["pace", "acceleration", "sprint"], "rating", { level: 5, affinity: 60, attrs: { pace: 80, sprint: 76 }, stats: { appearances: 20 } }),
    breakaway: S("winger", "Ponta de Ruptura", "Diagonal curta e finalização após a arrancada.", ["acceleration", "finish", "positioning"], "goals", { level: 6, affinity: 58, attrs: { acceleration: 76, finish: 70 }, stats: { goals: 6 } }),
    creativeWinger: S("winger", "Ponta Criador", "Último passe e cruzamento com qualidade.", ["crossing", "vision", "pass", "dribbling"], "assists", { level: 7, affinity: 58, attrs: { crossing: 76, vision: 68 }, stats: { assists: 8 } }),
    numberTen: S("maestro", "Camisa 10", "Decide entre as linhas com técnica e visão.", ["vision", "technique", "finesseShot", "dribbling"], "assists", { level: 7, affinity: 62, attrs: { vision: 78, technique: 76 }, stats: { assists: 10 } }),
    organizer: S("maestro", "Organizador", "Dita o ritmo e mantém a posse sob pressão.", ["pass", "composure", "vision", "ballControl"], "assists", { level: 5, affinity: 58, attrs: { pass: 76, composure: 70 }, stats: { appearances: 20 } }),
    verticalPass: S("maestro", "Passe Vertical", "Quebra linhas com passes longos e em profundidade.", ["longPass", "vision", "pass"], "assists", { level: 6, affinity: 58, attrs: { longPass: 76, vision: 72 }, stats: { assists: 6 } }),
    marker: S("engine", "Marcador", "Recupera bolas e protege a defesa.", ["tackling", "interception", "defense", "stamina"], "tackles", { level: 5, affinity: 58, attrs: { tackling: 74, interception: 72 }, stats: { tackles: 40 } }),
    distributor: S("engine", "Distribuidor", "Primeiro passe limpo depois da recuperação.", ["pass", "longPass", "composure"], "assists", { level: 6, affinity: 58, attrs: { pass: 74, longPass: 70 }, stats: { appearances: 25 } }),
    boxToBox: S("engine", "Box-to-box", "Presença nas duas áreas durante os 90 minutos.", ["stamina", "strength", "positioning", "finish"], "minutes", { level: 7, affinity: 60, attrs: { stamina: 80, strength: 70 }, stats: { appearances: 30 } }),
    sheriff: S("wall", "Xerife", "Impõe respeito nos duelos e comanda a linha.", ["tackling", "strength", "defense", "heading"], "tackles", { level: 6, affinity: 60, attrs: { tackling: 76, strength: 76 }, stats: { tackles: 50 } }),
    anticipator: S("wall", "Antecipador", "Lê a jogada e intercepta antes do duelo.", ["interception", "positioning", "pace"], "tackles", { level: 5, affinity: 58, attrs: { interception: 76, positioning: 70 }, stats: { tackles: 35 } }),
    aerialDefender: S("wall", "Defensor Aéreo", "Vence as bolas altas na própria área.", ["heading", "jumping", "strength"], "cleanSheet", { level: 6, affinity: 58, attrs: { heading: 74, jumping: 72 }, stats: { cleanSheets: 8 } }),
    cleanExit: S("builder", "Saída Limpa", "Calma para iniciar a jogada sob pressão.", ["pass", "composure", "ballControl"], "rating", { level: 5, affinity: 58, attrs: { pass: 74, composure: 72 }, stats: { appearances: 20 } }),
    launcher: S("builder", "Lançador", "Inverte o jogo e acha o atacante em profundidade.", ["longPass", "vision"], "assists", { level: 6, affinity: 58, attrs: { longPass: 78, vision: 70 }, stats: { assists: 4 } }),
    modernSweeper: S("builder", "Líbero Moderno", "Cobre espaços e sai jogando após interceptar.", ["interception", "positioning", "pass"], "tackles", { level: 7, affinity: 60, attrs: { interception: 74, pass: 72 }, stats: { tackles: 30 } }),
    wingBack: S("fullback", "Ala Incansável", "Sobe e volta o jogo inteiro pelo corredor.", ["stamina", "pace", "sprint"], "minutes", { level: 5, affinity: 58, attrs: { stamina: 78, pace: 74 }, stats: { appearances: 25 } }),
    supportFullback: S("fullback", "Lateral Apoiador", "Chega ao fundo e cruza com precisão.", ["crossing", "pass", "dribbling"], "assists", { level: 6, affinity: 58, attrs: { crossing: 76, pass: 70 }, stats: { assists: 5 } }),
    defensiveFullback: S("fullback", "Lateral Marcador", "Fecha o corredor e vence o ponta adversário.", ["defense", "tackling", "interception", "pace"], "tackles", { level: 5, affinity: 58, attrs: { defense: 74, tackling: 72 }, stats: { tackles: 35 } }),
    reflexKeeper: S("guardian", "Reflexo", "Reação rápida em finalizações de perto.", ["jumping", "agility", "positioning"], "saves", { level: 5, affinity: 60, attrs: { jumping: 74, positioning: 74 }, stats: { saves: 60 } }),
    sweeperKeeper: S("guardian", "Goleiro Líbero", "Sai da área e participa da construção.", ["longPass", "composure", "pass", "pace"], "cleanSheet", { level: 6, affinity: 58, attrs: { longPass: 72, composure: 72 }, stats: { cleanSheets: 8 } }),
    boxCommander: S("guardian", "Comandante da Área", "Domina cruzamentos e organiza a defesa.", ["positioning", "jumping", "strength", "composure"], "cleanSheet", { level: 7, affinity: 60, attrs: { positioning: 76, composure: 74 }, stats: { cleanSheets: 12 } }),
  };
  const specializations = {
    ...archetypeSpecializations,
    explosive: { legacy: true, name: "Explosão", description: "Treinos de velocidade rendem mais progresso.", attrs: ["pace", "acceleration", "sprint"] },
    creator: { legacy: true, name: "Criador", description: "Ações de criação valorizam passe, visão e técnica.", attrs: ["pass", "vision", "technique", "longPass"] },
    finisher: { legacy: true, name: "Matador", description: "Gols aceleram o desenvolvimento ofensivo.", attrs: ["finish", "positioning", "composure", "powerShot"] },
    engine: { legacy: true, name: "Motor", description: "Treino físico favorece resistência e equilíbrio.", attrs: ["stamina", "strength", "balance"] },
    stopper: { legacy: true, name: "Especialista Defensivo", description: "Atuações sólidas favorecem marcação e desarme.", attrs: ["defense", "tackling", "interception", "positioning"] },
  };
  const trainingCategories = {
    finishing: { name: "Finalização", positions: ["ATA", "MEI"], attrs: ["finish", "powerShot", "finesseShot", "positioning"], action: "goals", multiplier: 1.28 },
    passing: { name: "Passe", positions: ["MEI", "DEF", "ATA"], attrs: ["pass", "vision", "longPass", "crossing"], action: "assists", multiplier: 1.25 },
    dribbling: { name: "Drible", positions: ["ATA", "MEI"], attrs: ["dribbling", "ballControl", "agility", "technique"], action: "rating", multiplier: 1.18 },
    physical: { name: "Físico", positions: ["ATA", "MEI", "DEF", "GOL"], attrs: ["strength", "stamina", "balance", "jumping"], action: "minutes", multiplier: 1.16 },
    defending: { name: "Defesa", positions: ["DEF", "MEI"], attrs: ["defense", "tackling", "interception", "positioning"], action: "tackles", multiplier: 1.28 },
    setpieces: { name: "Bola parada", positions: ["ATA", "MEI", "DEF"], attrs: ["freeKick", "penalty", "crossing", "finesseShot"], action: "goals", multiplier: 1.20 },
    speed: { name: "Velocidade", positions: ["ATA", "MEI", "DEF"], attrs: ["pace", "acceleration", "sprint", "agility"], action: "rating", multiplier: 1.18 },
    goalkeeper: { name: "Goleiro", positions: ["GOL"], attrs: ["positioning", "composure", "jumping", "longPass"], action: "saves", multiplier: 1.30 },
  };
  const exercises = {
    boxFinish: { id:"boxFinish", category:"finishing", name:"Finalização dentro da área", difficulty:"C" },
    pressureFinish: { id:"pressureFinish", category:"finishing", name:"Finalização sob pressão", difficulty:"A" },
    quickPass: { id:"quickPass", category:"passing", name:"Passe rápido", difficulty:"C" },
    throughPass: { id:"throughPass", category:"passing", name:"Passe em profundidade", difficulty:"B" },
    closeControl: { id:"closeControl", category:"dribbling", name:"Controle próximo e 1 contra 1", difficulty:"B" },
    sprint: { id:"sprint", category:"speed", name:"Arrancada e sprint", difficulty:"B" },
    endurance: { id:"endurance", category:"physical", name:"Resistência, força e impulsão", difficulty:"C" },
    defensiveDuel: { id:"defensiveDuel", category:"defending", name:"Marcação, interceptação e desarme", difficulty:"B" },
    setpieces: { id:"setpieces", category:"setpieces", name:"Faltas, pênaltis e cruzamentos", difficulty:"A" },
    goalkeeper: { id:"goalkeeper", category:"goalkeeper", name:"Reflexo e posicionamento", difficulty:"B" },
  };
  // Aliases não enumeráveis mantêm compatibilidade com saves/comandos do Treinamento 2.0 sem duplicar cartões na UI.
  for (const [legacy,current] of Object.entries({finishing:"boxFinish",passing:"quickPass",dribbling:"closeControl",physical:"endurance",defending:"defensiveDuel",speed:"sprint"}))
    Object.defineProperty(exercises,legacy,{value:exercises[current],enumerable:false});
  const gradeRank = { D:1, C:2, B:3, A:4 };
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
    const a = attrs;
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
    if (!s.trainingPlan) s.trainingPlan = { focus: s.training || "balanced", style: s.person.style || "Técnico", sessions: 0, improvements: 0, accoladePoints: 0, weeklyXI: 0 };
    if (!Number.isFinite(s.trainingPlan.accoladePoints)) s.trainingPlan.accoladePoints = 0;
    if (!Number.isFinite(s.trainingPlan.weeklyXI)) s.trainingPlan.weeklyXI = 0;
    if (!Number.isFinite(s.trainingPlan.developmentXp)) s.trainingPlan.developmentXp = 0;
    if (!Number.isFinite(s.trainingPlan.level)) s.trainingPlan.level = 1;
    if (!Array.isArray(s.trainingPlan.specializations)) s.trainingPlan.specializations = [];
    if (!Number.isFinite(s.trainingPlan.specializationPoints)) s.trainingPlan.specializationPoints = 0;
    if (s.trainingPlan.activeSpecialization !== undefined && s.trainingPlan.activeSpecialization !== null && (!specializations[s.trainingPlan.activeSpecialization] || specializations[s.trainingPlan.activeSpecialization].legacy || !s.trainingPlan.specializations.includes(s.trainingPlan.activeSpecialization))) s.trainingPlan.activeSpecialization = null;
    if (s.trainingPlan.activeSpecialization === undefined) s.trainingPlan.activeSpecialization = null;
    if (!s.trainingPlan.exerciseGrades || typeof s.trainingPlan.exerciseGrades !== "object") s.trainingPlan.exerciseGrades = {};
    if (!s.trainingPlan.activeMultiplier || typeof s.trainingPlan.activeMultiplier !== "object") s.trainingPlan.activeMultiplier = null;
    const legacyExercise = { finishing:"boxFinish", passing:"quickPass", dribbling:"closeControl", physical:"endurance", defending:"defensiveDuel", speed:"sprint" };
    if (legacyExercise[s.trainingPlan.exerciseId]) s.trainingPlan.exerciseId = legacyExercise[s.trainingPlan.exerciseId];
    if (!s.trainingPlan.exerciseId || !exercises[s.trainingPlan.exerciseId]) s.trainingPlan.exerciseId = null;
    if (!s.trainingPlan.attributeProgress || typeof s.trainingPlan.attributeProgress !== "object") s.trainingPlan.attributeProgress = {};
    for (const key of Object.keys(skills)) if (!Number.isFinite(s.trainingPlan.attributeProgress[key])) s.trainingPlan.attributeProgress[key] = 0;
    if (!Number.isFinite(s.trainingPlan.lastTrainingDay)) s.trainingPlan.lastTrainingDay = -999;
    if (!Number.isFinite(s.trainingPlan.lastAutoDay)) s.trainingPlan.lastAutoDay = -999;
    if (!Array.isArray(s.trainingPlan.recentTraining)) s.trainingPlan.recentTraining = [];
    if (!Array.isArray(s.trainingPlan.processedMatches)) s.trainingPlan.processedMatches = [];
    if (!s.trainingPlan.lastResult || typeof s.trainingPlan.lastResult !== "object") s.trainingPlan.lastResult = null;
    const requested = s.person.archetypeId && archetypeCatalog[s.person.archetypeId];
    const compatible = requested && requested.positions.includes(s.person.pos);
    s.person.archetypeId = compatible ? requested.id : (defaultArchetypeId[s.person.pos] || "maestro");
    s.trainingPlan.archetype = archetypeCatalog[s.person.archetypeId];
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
  const MAX_SPECIALIZATIONS = 6;
  function unlockSpecialization(s, id) {
    const plan = init(s), spec = specializations[id];
    if (!spec) throw Error("Especialização inválida.");
    if (plan.specializations.includes(id)) return plan;
    if (!spec.legacy) {
      const check = root.ProLifeIdentity?.requirements?.(s, id);
      if (!check || !check.met) throw Error(check?.reason || "Requisitos da especialização não atendidos.");
    }
    if (plan.specializationPoints < 1) throw Error("Você precisa de um ponto de especialização.");
    if (plan.specializations.length >= MAX_SPECIALIZATIONS) throw Error("Limite de especializações atingido.");
    plan.specializationPoints--;
    plan.specializations.push(id);
    if (!spec.legacy) {
      if (!plan.activeSpecialization) plan.activeSpecialization = id;
      root.ProLifeIdentity?.onUnlock?.(s, id);
    }
    return plan;
  }
  function activateSpecialization(s, id) {
    const plan = init(s), spec = specializations[id];
    if (!spec || spec.legacy) throw Error("Especialização inválida.");
    if (!plan.specializations.includes(id)) throw Error("Desbloqueie a especialização antes de ativá-la.");
    plan.activeSpecialization = id;
    return plan;
  }
  // Legadas (Treinamento 2.0) mantêm o bônus original; as novas só orientam a progressão quando ativas e de forma moderada.
  function specializationBonus(plan, key) {
    const legacy = plan.specializations.some((id) => specializations[id]?.legacy && specializations[id].attrs.includes(key)) ? 0.18 : 0;
    const active = specializations[plan.activeSpecialization];
    return Math.max(legacy, active && !active.legacy && active.attrs.includes(key) ? 0.10 : 0);
  }
  function ageFactor(age) { return age <= 20 ? 1.28 : age <= 24 ? 1.14 : age <= 29 ? 1 : 0.76; }
  function gradeMultiplier(grade) { return ({D:.55,C:.78,B:1,A:1.25})[grade] || 1; }
  function difficultyCost(value) { return 62 + Math.max(0, value - 60) * 1.55 + Math.max(0, value - 80) * 1.8 + Math.max(0, value - 90) * 2.6; }
  function progressAttribute(s, key, points, helpers) {
    const plan=init(s); expand(s.person.attrs);
    const arch=plan.archetype || {};
    const archBoost=arch.focus?.includes(key) ? 1.16 : 1;
    const styleBoost=styleFocus[s.person.style]?.includes(key) ? 1.18 : 1;
    const specBoost=1+specializationBonus(plan,key);
    let gain=Math.max(0,points)*ageFactor(s.person.age)*archBoost*styleBoost*specBoost*(root.ProLifeCreation?.progressionMultiplier?.(s)||1);
    const changes=[];
    while(gain>0 && s.person.attrs[key] < 100 && helpers.overall(s.person) < ceiling(s,helpers)){
      const need=difficultyCost(s.person.attrs[key]);
      const current=plan.attributeProgress[key]||0, remaining=need-current;
      if(gain < remaining){ plan.attributeProgress[key]=current+gain; gain=0; break; }
      gain-=remaining; const before=s.person.attrs[key]; improve(s,key,1,helpers); plan.attributeProgress[key]=0;
      if(s.person.attrs[key]>before){ plan.improvements++; changes.push({key,label:skills[key],before,after:s.person.attrs[key]}); } else break;
    }
    const parent=related[key];
    if(parent && !core.includes(key) && parent!==key) changes.push(...progressAttribute(s,parent,points*.55,helpers));
    return changes;
  }
  function attributeProgressPercent(s,key){ const plan=init(s), value=s.person.attrs[key]||20; return Math.max(0,Math.min(99,Math.round((plan.attributeProgress[key]||0)/difficultyCost(value)*100))); }
  function mandatoryCommitmentToday(s){
    const own=s.clubId;
    if(!own) return false;
    const seasonBase=(s.season-2026)*365;
    const leagueDay=seasonBase+(s.calendarDays?.[s.round] ?? 7+(s.round||0)*21);
    const leaguePair=s.fixtures?.[s.round]?.some(pair=>pair.includes(own));
    if(leaguePair && leagueDay===s.day) return true;
    const schedule=s.competitionSchedule||{};
    for(const state of [schedule.state,...(schedule.otherStates||[])].filter(Boolean))
      for(const round of state.rounds||[]) if(round.date===s.day && round.pairs?.some(pair=>!pair.played&&(pair.home===own||pair.away===own))) return true;
    for(const round of schedule.cup?.rounds||[]) if(round.date===s.day && round.pairs?.some(pair=>!pair.played&&(pair.home===own||pair.away===own))) return true;
    if(s.nationalTeam?.calledUp && s.nationalTeam.schedule?.some(match=>!match.played&&match.day===s.day)) return true;
    return false;
  }
  function trainingAvailable(s){ return s.mode==="player" && !s.person.injury && !mandatoryCommitmentToday(s) && s.day > init(s).lastTrainingDay; }
  function performTraining(s,rng,helpers,{automatic=false}={}){
    const plan=init(s);
    const available = automatic ? (s.mode==="player" && !s.person.injury && s.day > plan.lastAutoDay) : trainingAvailable(s);
    if(!available) return {available:false,reason:s.person.injury?"Lesionado":(!automatic&&mandatoryCommitmentToday(s))?"Há um compromisso obrigatório hoje.":"Você já treinou hoje."};
    const ex=plan.exerciseId && exercises[plan.exerciseId];
    if(!ex) return {available:false,reason:"Escolha um exercício."};
    const category=trainingCategories[ex.category];
    const intensity=s.intensity || "normal";
    if(intensity==="rest") return {available:false,reason:"Recuperação não conta como sessão de treino."};
    const quality=Math.max(0,Math.min(.999,rng.next()+s.person.discipline/520));
    const grade=quality>=.88?"A":quality>=.66?"B":quality>=.42?"C":"D";
    const gm=gradeMultiplier(grade), load=intensity==="hard"?1.28:1;
    const energyCost=intensity==="hard"?11:6;
    const xp=(intensity==="hard"?3.8:2.8)*gm*ageFactor(s.person.age)*(root.ProLifeIdentity?.trainingXpMultiplier?.(s,category)||1);
    const beforeLevel=plan.level; addDevelopmentXp(s,xp);
    const changes=[];
    for(const key of category.attrs){
      changes.push(...progressAttribute(s,key,(automatic?(intensity==="hard"?24:9):(intensity==="hard"?29:22))*gm/category.attrs.length,helpers));
    }
    const previous=plan.exerciseGrades[ex.id];
    if(!previous || gradeRank[grade]>gradeRank[previous]) plan.exerciseGrades[ex.id]=grade;
    plan.activeMultiplier={exerciseId:ex.id,category:ex.category,action:category.action,value:Math.max(1.03,Math.min(1.35,category.multiplier*gm)),expiresDay:s.day+7,grade};
    if(automatic) plan.lastAutoDay=s.day; else plan.lastTrainingDay=s.day;
    plan.sessions++;
    root.ProLifeIdentity?.onTraining?.(s,category);
    s.person.condition=helpers.clamp(s.person.condition-energyCost,0,100);
    const result={available:true,automatic,day:s.day,exerciseId:ex.id,exercise:ex.name,grade,xp,energyCost,changes,levelBefore:beforeLevel,levelAfter:plan.level};
    plan.lastResult=result; plan.recentTraining.unshift(result); plan.recentTraining=plan.recentTraining.slice(0,12);
    return result;
  }
  function daily(s,rng,helpers){
    const plan=init(s);
    if(s.mode!=="player" || s.person.injury) return null;
    if(root.ProLifeNationalTeam?.onDuty?.(s)) return null;
    // Todo dia simulado executa a rotina canônica de treino, respeitando foco/exercício/intensidade e impedimentos do dia.
    if(!plan.exerciseId){
      const compatible=Object.values(exercises).filter(ex=>trainingCategories[ex.category].positions.includes(s.person.pos));
      const focused=compatible.find(ex=>trainingCategories[ex.category].attrs.includes(s.training));
      const archetyped=compatible.find(ex=>trainingCategories[ex.category].attrs.some(k=>plan.archetype?.focus?.includes(k)));
      plan.exerciseId=(focused||archetyped||compatible[0])?.id||null;
    }
    if(plan.exerciseId && s.day>plan.lastAutoDay) return performTraining(s,rng,helpers,{automatic:true});
    return null;
  }
  function matchDevelopment(s, match, helpers) {
    if (s.mode !== "player" || !match?.participants?.flat().includes("hero")) return null;
    const plan=init(s), matchKey=[match.season||s.season,match.date??s.day,match.competitionId||match.leagueId||"match",match.homeId||"",match.awayId||"",match.round||""].join(":");
    if(plan.processedMatches.includes(matchKey)) return {duplicate:true,xp:0,changes:[]};
    plan.processedMatches.push(matchKey); plan.processedMatches=plan.processedMatches.slice(-160);
    const rating=Number(match.ratings?.hero||0), stats=match.playerStats?.hero||{}, events=match.events||[];
    const goals=events.filter(e=>e.type==="goal"&&e.playerId==="hero").length;
    const assists=events.filter(e=>e.assistPlayerId==="hero").length;
    const minutes=Number(stats.minutes||90), tackles=Number(stats.tackles||0), saves=Number(stats.saves||0);
    const heroSide=(match.participants?.[0]||[]).includes("hero")?0:1, conceded=heroSide===0?Number(match.ag||0):Number(match.hg||0), cleanSheet=conceded===0?1:0;
    const motm=rating>=8.3?1:0;
    let xp=Math.max(0,(rating-5.8)*1.55)+(minutes/90)*.8+motm*.9;
    let pool=[];
    if(s.person.pos==="ATA"){ xp+=goals*2.1+assists*1.25; pool=goals?["finish","positioning","composure","powerShot"]:["finish","pace","dribbling","positioning"]; }
    else if(s.person.pos==="MEI"){ xp+=assists*1.8+goals*1.1+tackles*.12; pool=["pass","vision","ballControl","stamina","technique"]; }
    else if(s.person.pos==="DEF"){ xp+=tackles*.28+cleanSheet*1.15+goals*.8; pool=["defense","tackling","interception","strength","positioning"]; }
    else { xp+=saves*.25+cleanSheet*1.35-Math.max(0,conceded-2)*.2; pool=["positioning","composure","jumping","longPass"]; }
    const mult=plan.activeMultiplier&&plan.activeMultiplier.expiresDay>=s.day?plan.activeMultiplier:null;
    if(mult){ const relatedAction=mult.action==="goals"?goals:mult.action==="assists"?assists:mult.action==="tackles"?tackles:mult.action==="saves"?saves:mult.action==="minutes"?minutes/90:Math.max(0,rating-6.5); xp+=relatedAction*Math.max(0,mult.value-1); }
    const offense=match.offensiveStats?.hero||{}, metrics={goals,assists,minutes,tackles,saves,cleanSheet,rating,shots:Number(offense.shots||0),onTarget:Number(offense.onTarget||0),xg:Number(offense.xg||0)};
    xp+=root.ProLifeIdentity?.matchXpBonus?.(s,metrics,Math.max(.35,xp))||0;
    xp=Math.max(.35,xp); s.trainingProgress=Math.min(100,(s.trainingProgress||0)+xp); const beforeLevel=plan.level; addDevelopmentXp(s,xp);
    const changes=[]; const performancePoints=Math.max(2,((rating-6)*4+goals*4+assists*3+tackles*.35+saves*.3+cleanSheet)*3.6);
    for(const key of pool.slice(0,4)) changes.push(...progressAttribute(s,key,performancePoints/pool.slice(0,4).length,helpers));
    root.ProLifeIdentity?.onMatch?.(s,metrics);
    if(rating>=8){plan.weeklyXI++;plan.accoladePoints+=1;} if(goals)plan.accoladePoints+=goals*.6;if(assists)plan.accoladePoints+=assists*.5;
    return {bonus:true,rating,goals,assists,xp,changes,levelBefore:beforeLevel,levelAfter:plan.level};
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
  const api = { core, skills, groups, styleFocus, archetypes, archetypeCatalog, defaultArchetypeId, origins, specializations, trainingCategories, exercises, gradeRank, expand, groupRatings, init, ceiling, addDevelopmentXp, unlockSpecialization, activateSpecialization, MAX_SPECIALIZATIONS, archetypeSpecializations, ageFactor, attributeProgressPercent, mandatoryCommitmentToday, trainingAvailable, performTraining, progressAttribute, daily, matchDevelopment, seasonRewards };
  root.ProLifeTraining = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
