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
    sweeper: { id: "sweeper", positions: ["GOL"], name: "Goleiro Líbero", description: "Antecipa bolas longas, participa da construção e protege o espaço fora da área.", focus: ["positioning", "longPass", "composure", "pace", "ballControl"], weak: ["finish", "dribbling"], xpActions: ["defesas", "saídas", "passes longos"] },
    anchor: { id: "anchor", positions: ["DEF", "MEI"], name: "Sentinela", description: "Protege a defesa, fecha linhas de passe e oferece equilíbrio posicional.", focus: ["interception", "positioning", "defense", "tackling", "composure"], weak: ["finish", "dribbling"], xpActions: ["interceptações", "desarmes", "recuperações"] },
    shadow: { id: "shadow", positions: ["ATA", "MEI"], name: "Atacante Móvel", description: "Flutua entre linhas, associa com o meio e ataca o espaço para finalizar.", focus: ["positioning", "acceleration", "ballControl", "finish", "pass"], weak: ["defense", "heading"], xpActions: ["gols", "assistências", "movimentações"] },
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
    keeperAnticipator: S("sweeper", "Antecipador", "Lê a profundidade e chega primeiro nas bolas fora da área.", ["positioning", "pace", "composure"], "saves", { level: 5, affinity: 58, attrs: { positioning: 74, pace: 62 }, stats: { saves: 40 } }),
    keeperBuilder: S("sweeper", "Construtor", "Participa da primeira fase e encontra passes seguros sob pressão.", ["longPass", "pass", "composure", "ballControl"], "cleanSheet", { level: 6, affinity: 60, attrs: { longPass: 72, composure: 72 }, stats: { cleanSheets: 6 } }),
    keeperLauncher: S("sweeper", "Lançador de Transição", "Transforma recuperações em ataques com distribuição longa.", ["longPass", "vision", "composure"], "rating", { level: 7, affinity: 60, attrs: { longPass: 76, vision: 66 }, stats: { appearances: 25 } }),
    defensiveScreen: S("anchor", "Protetor da Zaga", "Ocupa o espaço à frente dos zagueiros e reduz linhas de progressão.", ["interception", "positioning", "defense", "stamina"], "tackles", { level: 5, affinity: 58, attrs: { interception: 74, positioning: 72 }, stats: { tackles: 35 } }),
    ballHunter: S("anchor", "Caçador de Bolas", "Aumenta a agressividade funcional nas recuperações sem abandonar a estrutura.", ["tackling", "strength", "stamina", "interception"], "tackles", { level: 6, affinity: 60, attrs: { tackling: 76, stamina: 72 }, stats: { tackles: 50 } }),
    deepController: S("anchor", "Regista Recuado", "Recupera e organiza a primeira construção com passe seguro.", ["pass", "longPass", "vision", "composure"], "assists", { level: 7, affinity: 60, attrs: { pass: 74, composure: 72 }, stats: { appearances: 30 } }),
    roamingForward: S("shadow", "Atacante Flutuante", "Sai da referência para receber entre linhas e conectar o ataque.", ["ballControl", "pass", "positioning", "agility"], "assists", { level: 5, affinity: 58, attrs: { ballControl: 74, pass: 68 }, stats: { assists: 5 } }),
    spaceRunner: S("shadow", "Ataque ao Espaço", "Acelera nas costas da defesa e aparece em zonas de finalização.", ["acceleration", "pace", "positioning", "finish"], "goals", { level: 6, affinity: 60, attrs: { acceleration: 76, positioning: 74 }, stats: { goals: 8 } }),
    supportStriker: S("shadow", "Segundo Atacante", "Combina criação e chegada à área para participar de gols e assistências.", ["finish", "pass", "vision", "composure"], "goals", { level: 7, affinity: 60, attrs: { finish: 74, pass: 70 }, stats: { goals: 10, assists: 5 } }),
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
  const archetypePerks = {
    guardianReflex: {
      id: "guardianReflex",
      archetype: "guardian",
      name: "Reflexo de Emergencia",
      description: "Melhora levemente a eficiencia em defesas quando o goleiro e muito exigido.",
      level: 5,
      kind: "match",
      action: "saves",
      value: 0.05
    },
    guardianCommand: {
      id: "guardianCommand",
      archetype: "guardian",
      name: "Comando da Area",
      description: "Premia atuacoes seguras em partidas sem sofrer gols.",
      level: 10,
      kind: "match",
      action: "cleanSheet",
      value: 0.05
    },

    sweeperRush: {
      id: "sweeperRush",
      archetype: "sweeper",
      name: "Saida Antecipada",
      description: "Valoriza jogos em que o goleiro libero participa ativamente e mantem boa nota.",
      level: 5,
      kind: "match",
      action: "rating",
      value: 0.05
    },
    sweeperDistribution: {
      id: "sweeperDistribution",
      archetype: "sweeper",
      name: "Distribuicao Rapida",
      description: "Favorece treino de passe e distribuicao para goleiros liberos.",
      level: 10,
      kind: "training",
      category: "goalkeeper",
      value: 0.05
    },

    wallDuel: {
      id: "wallDuel",
      archetype: "wall",
      name: "Dominio de Duelo",
      description: "Premia defensores que acumulam desarmes em uma atuacao.",
      level: 5,
      kind: "match",
      action: "tackles",
      value: 0.05
    },
    wallCleanSheet: {
      id: "wallCleanSheet",
      archetype: "wall",
      name: "Linha Intocavel",
      description: "Favorece o desenvolvimento apos partidas defensivamente solidas.",
      level: 10,
      kind: "match",
      action: "cleanSheet",
      value: 0.05
    },

    builderProgression: {
      id: "builderProgression",
      archetype: "builder",
      name: "Primeiro Passe",
      description: "Favorece sessoes de passe para defensores construtores.",
      level: 5,
      kind: "training",
      category: "passing",
      value: 0.05
    },
    builderComposure: {
      id: "builderComposure",
      archetype: "builder",
      name: "Saida Sob Pressao",
      description: "Premia partidas de boa nota no perfil construtor.",
      level: 10,
      kind: "match",
      action: "rating",
      value: 0.05
    },

    engineEndurance: {
      id: "engineEndurance",
      archetype: "engine",
      name: "Pulmao",
      description: "Favorece treinos fisicos coerentes com o perfil Motor.",
      level: 5,
      kind: "training",
      category: "physical",
      value: 0.05
    },
    enginePresence: {
      id: "enginePresence",
      archetype: "engine",
      name: "Area a Area",
      description: "Premia minutos e participacao constante durante a partida.",
      level: 10,
      kind: "match",
      action: "minutes",
      value: 0.05
    },

    anchorIntercept: {
      id: "anchorIntercept",
      archetype: "anchor",
      name: "Leitura Defensiva",
      description: "Favorece atuacoes com volume defensivo consistente.",
      level: 5,
      kind: "match",
      action: "tackles",
      value: 0.05
    },
    anchorDiscipline: {
      id: "anchorDiscipline",
      archetype: "anchor",
      name: "Equilibrio Tatico",
      description: "Favorece treino defensivo do perfil Sentinela.",
      level: 10,
      kind: "training",
      category: "defending",
      value: 0.05
    },

    maestroVision: {
      id: "maestroVision",
      archetype: "maestro",
      name: "Visao de Jogo",
      description: "Premia criacao direta de gols.",
      level: 5,
      kind: "match",
      action: "assists",
      value: 0.05
    },
    maestroPassing: {
      id: "maestroPassing",
      archetype: "maestro",
      name: "Controle do Ritmo",
      description: "Favorece sessoes de passe do perfil Maestro.",
      level: 10,
      kind: "training",
      category: "passing",
      value: 0.05
    },

    dribblerConfidence: {
      id: "dribblerConfidence",
      archetype: "dribbler",
      name: "Um Contra Um",
      description: "Favorece treino tecnico voltado ao drible.",
      level: 5,
      kind: "training",
      category: "dribbling",
      value: 0.05
    },
    dribblerImpact: {
      id: "dribblerImpact",
      archetype: "dribbler",
      name: "Desequilibrio",
      description: "Premia atuacoes de alta nota.",
      level: 10,
      kind: "match",
      action: "rating",
      value: 0.05
    },

    finisherInstinct: {
      id: "finisherInstinct",
      archetype: "finisher",
      name: "Instinto de Gol",
      description: "Premia partidas em que o jogador marca.",
      level: 5,
      kind: "match",
      action: "goals",
      value: 0.05
    },
    finisherSharpness: {
      id: "finisherSharpness",
      archetype: "finisher",
      name: "Finalização Afiada",
      description: "Favorece treino de finalização.",
      level: 10,
      kind: "training",
      category: "finishing",
      value: 0.05
    },

    ninePresence: {
      id: "ninePresence",
      archetype: "nine",
      name: "Presença de Área",
      description: "Premia gols marcados pelo centroavante de referência.",
      level: 5,
      kind: "match",
      action: "goals",
      value: 0.05
    },
    nineStrength: {
      id: "nineStrength",
      archetype: "nine",
      name: "Jogo de Corpo",
      description: "Favorece treino físico do Camisa 9.",
      level: 10,
      kind: "training",
      category: "physical",
      value: 0.05
    },

    wingerBurst: {
      id: "wingerBurst",
      archetype: "winger",
      name: "Explosao pelo Corredor",
      description: "Favorece treino de velocidade.",
      level: 5,
      kind: "training",
      category: "speed",
      value: 0.05
    },
    wingerCreation: {
      id: "wingerCreation",
      archetype: "winger",
      name: "Ultimo Passe",
      description: "Premia assistencias produzidas pelos lados.",
      level: 10,
      kind: "match",
      action: "assists",
      value: 0.05
    },

    fullbackEngine: {
      id: "fullbackEngine",
      archetype: "fullback",
      name: "Corredor Infinito",
      description: "Favorece treino fisico do lateral ofensivo.",
      level: 5,
      kind: "training",
      category: "physical",
      value: 0.05
    },
    fullbackSupport: {
      id: "fullbackSupport",
      archetype: "fullback",
      name: "Apoio Constante",
      description: "Premia assistencias e contribuicao ofensiva do lateral.",
      level: 10,
      kind: "match",
      action: "assists",
      value: 0.05
    },

    shadowMovement: {
      id: "shadowMovement",
      archetype: "shadow",
      name: "Movimento Entre Linhas",
      description: "Premia partidas de boa nota no perfil Atacante Móvel.",
      level: 5,
      kind: "match",
      action: "rating",
      value: 0.05
    },
    shadowCombination: {
      id: "shadowCombination",
      archetype: "shadow",
      name: "Associacao Ofensiva",
      description: "Premia assistencias do atacante que participa da construcao.",
      level: 10,
      kind: "match",
      action: "assists",
      value: 0.05
    }
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
    const module32C = root.ProLifeDynamicPotential;
    if (module32C && typeof module32C.effectiveCeiling === "function") {
      const current = helpers.overall(s.person);
      return module32C.effectiveCeiling({
        ...s.person,
        overall: current,
        ovr: current
      }, {
        seed: s.initialSeed ?? s.rng
      });
    }
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
    if (!Number.isFinite(s.trainingPlan.archetypeXp)) s.trainingPlan.archetypeXp = 0;
    if (!Number.isFinite(s.trainingPlan.archetypeLevel)) s.trainingPlan.archetypeLevel = 1;
    if (!Number.isFinite(s.trainingPlan.attributePoints)) s.trainingPlan.attributePoints = 0;
    if (!Number.isFinite(s.trainingPlan.lastPotentialReviewSeason)) s.trainingPlan.lastPotentialReviewSeason = s.season || 2026;
    if (!Array.isArray(s.trainingPlan.specializations)) s.trainingPlan.specializations = [];
    if (!Number.isFinite(s.trainingPlan.specializationPoints)) s.trainingPlan.specializationPoints = 0;
    if (!Array.isArray(s.trainingPlan.archetypePerks)) s.trainingPlan.archetypePerks = [];
    s.trainingPlan.archetypePerks = [...new Set(s.trainingPlan.archetypePerks)].filter((id) => archetypePerks[id]);
    if (!Array.isArray(s.trainingPlan.activeArchetypePerks)) s.trainingPlan.activeArchetypePerks = [];
    s.trainingPlan.activeArchetypePerks = [...new Set(s.trainingPlan.activeArchetypePerks)].filter((id) => s.trainingPlan.archetypePerks.includes(id) && archetypePerks[id]);

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
  function xpForLevel(level) {
    const n = Math.max(1, Math.min(50, Number(level) || 1));
    // Mantém os primeiros níveis compatíveis com saves antigos (18 XP por nível)
    // e aumenta gradualmente o custo após o nível 3.
    if (n <= 3) return (n - 1) * 18;
    return Math.round(36 + 18 * Math.pow(n - 3, 1.18));
  }
  function addDevelopmentXp(s, amount) {
    const plan = init(s), before = plan.level;
    plan.developmentXp += Math.max(0, amount || 0);
    let level = 1;
    while (level < 50 && plan.developmentXp >= xpForLevel(level + 1)) level++;
    plan.level = level;
    const gained = Math.max(0, plan.level - before);
    if (gained) {
      plan.attributePoints += gained;
      // Compatibilidade: níveis 2 e 3 continuam concedendo pontos como no Development 2.0.
      // A partir daí, novas especializações são liberadas em marcos de 5 níveis.
      const legacyBefore = Math.min(2, Math.max(0, before - 1));
      const legacyAfter = Math.min(2, Math.max(0, plan.level - 1));
      const milestoneBefore = Math.max(0, Math.floor(before / 5));
      const milestoneAfter = Math.max(0, Math.floor(plan.level / 5));
      plan.specializationPoints += Math.max(0, legacyAfter - legacyBefore) + Math.max(0, milestoneAfter - milestoneBefore);
    }
    return gained;
  }
  function archetypePerkSlots(s) {
    if (s.mode !== "player") return 0;
    const plan = init(s);
    const level = Math.max(1, Number(plan.archetypeLevel) || 1);
    return level >= 20 ? 3 : level >= 10 ? 2 : 1;
  }

  function availableArchetypePerks(s) {
    if (s.mode !== "player") return [];
    const plan = init(s);
    const primary = s.person.archetypeId;
    const secondary = root.ProLifeIdentity?.profile?.(s)?.secondary || null;
    const allowed = new Set([primary, secondary].filter(Boolean));

    return Object.values(archetypePerks)
      .filter((perk) => allowed.has(perk.archetype))
      .map((perk) => ({
        ...perk,
        unlocked: plan.archetypePerks.includes(perk.id),
        active: plan.activeArchetypePerks.includes(perk.id),
        eligible: plan.archetypeLevel >= perk.level
      }));
  }

  function unlockArchetypePerk(s, id) {
    if (s.mode !== "player") throw Error("Perks de arqu\u00e9tipo s\u00e3o da carreira de jogador.");
    if (s.mode !== "player")
      throw Error("Perks de arquétipo são da carreira de jogador.");

    const plan = init(s);
    const perk = archetypePerks[id];

    if (!perk)
      throw Error("Perk de arquétipo inválido.");

    if (plan.archetypePerks.includes(id))
      return plan;

    const primary = s.person.archetypeId;
    const secondary = root.ProLifeIdentity?.profile?.(s)?.secondary || null;

    if (perk.archetype !== primary && perk.archetype !== secondary)
      throw Error("Este perk não pertence ao seu perfil atual.");

    if (plan.archetypeLevel < perk.level)
      throw Error(`Perk disponível a partir do nível de arquétipo ${perk.level}.`);

    plan.archetypePerks.push(id);

    return plan;
  }

  function activateArchetypePerk(s, id) {
    if (s.mode !== "player") throw Error("Perks de arqu\u00e9tipo s\u00e3o da carreira de jogador.");
    if (s.mode !== "player")
      throw Error("Perks de arquétipo são da carreira de jogador.");

    const plan = init(s);
    const perk = archetypePerks[id];

    if (!perk)
      throw Error("Perk de arquétipo inválido.");

    if (!plan.archetypePerks.includes(id))
      throw Error("Desbloqueie o perk antes de ativ?-lo.");

    const primary = s.person.archetypeId;
    const secondary = root.ProLifeIdentity?.profile?.(s)?.secondary || null;

    if (perk.archetype !== primary && perk.archetype !== secondary)
      throw Error("Este perk não pertence ao seu perfil atual.");

    if (plan.activeArchetypePerks.includes(id))
      return plan;

    const slots = archetypePerkSlots(s);

    if (plan.activeArchetypePerks.length >= slots)
      throw Error("Todos os slots de perks est?o ocupados.");

    plan.activeArchetypePerks.push(id);

    return plan;
  }

  function deactivateArchetypePerk(s, id) {
    if (s.mode !== "player") throw Error("Perks de arqu\u00e9tipo s\u00e3o da carreira de jogador.");
    if (s.mode !== "player")
      throw Error("Perks de arquétipo são da carreira de jogador.");

    const plan = init(s);

    if (!archetypePerks[id])
      throw Error("Perk de arquétipo inválido.");

    plan.activeArchetypePerks =
      plan.activeArchetypePerks.filter((x) => x !== id);

    return plan;
  }

  function activeArchetypePerks(s) {
    if (s.mode !== "player") return [];
    reconcileArchetypePerks(s);
    return compatibleActiveArchetypePerks(s);
  }

  function reconcileArchetypePerks(s) {
    const plan = init(s);

    if (s.mode !== "player") {
      plan.activeArchetypePerks = [];
      return plan;
    }

    plan.archetypePerks = [...new Set(
      Array.isArray(plan.archetypePerks)
        ? plan.archetypePerks
        : []
    )].filter((id) => archetypePerks[id]);

    const primary = s.person.archetypeId;
    const secondary =
      root.ProLifeIdentity?.profile?.(s)?.secondary || null;

    const allowed = new Set(
      [primary, secondary].filter(Boolean)
    );

    const level =
      Math.max(
        1,
        Number(plan.archetypeLevel) || 1
      );

    const slots =
      level >= 20
        ? 3
        : level >= 10
          ? 2
          : 1;

    plan.activeArchetypePerks = [...new Set(
      Array.isArray(plan.activeArchetypePerks)
        ? plan.activeArchetypePerks
        : []
    )]
      .filter((id) =>
        plan.archetypePerks.includes(id) &&
        archetypePerks[id] &&
        allowed.has(
          archetypePerks[id].archetype
        )
      )
      .slice(0, slots);

    return plan;
  }

  function compatibleActiveArchetypePerks(s) {
    if (s.mode !== "player") return [];

    const plan = init(s);
    const primary = s.person.archetypeId;
    const secondary =
      root.ProLifeIdentity?.profile?.(s)?.secondary || null;

    const allowed = new Set(
      [primary, secondary].filter(Boolean)
    );

    const slots =
      archetypePerkSlots(s);

    return plan.activeArchetypePerks
      .map((id) => archetypePerks[id])
      .filter((perk) =>
        perk &&
        allowed.has(perk.archetype)
      )
      .slice(0, slots);
  }

  function archetypePerkTrainingMultiplier(s, category) {
    if (s.mode !== "player" || !category) return 1;

    const bonus = compatibleActiveArchetypePerks(s)
      .filter((perk) =>
        perk.kind === "training" &&
        perk.category === category.id
      )
      .reduce((sum, perk) => sum + Number(perk.value || 0), 0);

    return 1 + Math.min(0.10, Math.max(0, bonus));
  }

  function archetypePerkMatchBonus(s, metrics, xp) {
    if (s.mode !== "player" || !metrics) return 0;

    const signal = (action) => {
      if (action === "goals")
        return Number(metrics.goals || 0) > 0;

      if (action === "assists")
        return Number(metrics.assists || 0) > 0;

      if (action === "tackles")
        return Number(metrics.tackles || 0) > 0;

      if (action === "saves")
        return Number(metrics.saves || 0) > 0;

      if (action === "cleanSheet")
        return Number(metrics.cleanSheet || 0) > 0;

      if (action === "rating")
        return Number(metrics.rating || 0) >= 7.2;

      if (action === "minutes")
        return Number(metrics.minutes || 0) >= 60;

      return false;
    };

    const bonus = compatibleActiveArchetypePerks(s)
      .filter((perk) =>
        perk.kind === "match" &&
        signal(perk.action)
      )
      .reduce((sum, perk) => sum + Number(perk.value || 0), 0);

    return Math.max(0, Number(xp || 0)) *
      Math.min(0.10, Math.max(0, bonus));
  }

  function archetypeTrainingXp(s, category, xp) {
    if (s.mode !== "player" || !category) return 0;

    const plan = init(s);
    const focus = plan.archetype?.focus || [];

    const aligned = category.attrs.some(
      (key) => focus.includes(key)
    );

    if (!aligned) return 0;

    return Math.max(0, Number(xp || 0)) * 0.55;
  }

  function addArchetypeXp(s, amount) {
    const plan = init(s), before = plan.archetypeLevel;
    plan.archetypeXp += Math.max(0, amount || 0);
    plan.archetypeLevel = Math.min(50, 1 + Math.floor(Math.sqrt(plan.archetypeXp / 3.2)));
    return Math.max(0, plan.archetypeLevel - before);
  }
  // Stage 32D.3B - o potencial nao muda mais por partida; a revisao ocorre uma vez por temporada (reviewSeasonPotential).
  function potentialReview() { return 0; }
  function helpersPotentialFloor(s) {
    const attrs = core.map(k => Number(s.person.attrs?.[k] || 20));
    return Math.max(45, Math.round(attrs.reduce((a,b)=>a+b,0) / attrs.length));
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
  // Stage 32D.2 - fator de progressao dos seis perfis (32B). Ajusta (nao substitui) o fator de idade legado.
  // Somente leitura: o perfil e derivado como no teto da 32D.1 e nunca gravado. Dados ausentes = neutro.
  // Stage 32D.3A - perfil persistido do heroi. Registro minimo {id, v} gravado SOMENTE no primeiro
  // desenvolvimento efetivo (progressAttribute com ganho > 0, modo jogador). Consultas nunca gravam.
  // Save antigo sem perfil: o perfil e derivado de forma deterministica (seed + identidade) e, no primeiro
  // evento de desenvolvimento, fica fixado; dai em diante idade, GER, potencial e clube nao o alteram.
  function devModule() {
    return root.ProLifePlayerDevelopment || (typeof require === "function" ? (() => { try { return require("./player-development.js"); } catch { return null; } })() : null);
  }
  function ensureDevelopmentProfile(s, helpers) {
    if (s.mode !== "player" || !s.person) return null;
    const Dev = devModule();
    if (!Dev || typeof Dev.createProfileRecord !== "function") return null;
    const cur = s.person.developmentProfile;
    if (cur && typeof cur === "object" && Dev.PROFILE_IDS.includes(cur.id)) return cur;
    const overall = helpers.overall(s.person);
    s.person.developmentProfile = Dev.createProfileRecord({ ...s.person, overall, ovr: overall }, { seed: s.initialSeed ?? s.rng });
    return s.person.developmentProfile;
  }
  // Reavaliacao so por eventos importantes (limite de 2 no modulo 32B). Nao e chamada automaticamente.
  function reassessDevelopmentProfile(s, events, helpers) {
    const Dev = devModule();
    if (!Dev || typeof Dev.reassessProfile !== "function" || s.mode !== "player") return { changed: false };
    ensureDevelopmentProfile(s, helpers);
    const overall = helpers.overall(s.person);
    const r = Dev.reassessProfile({ ...s.person, overall, ovr: overall }, events, { seed: s.initialSeed ?? s.rng });
    if (r.changed) s.person.developmentProfile = { id: r.profile.id, v: r.profile.v, changes: r.profile.changes };
    return r;
  }
  const DEV_REF = { developmentProfile: { id: "steady_rise" } };
  function developmentAdjust(s, helpers, source) {
    const Dev = root.ProLifePlayerDevelopment || (typeof require === "function" ? (() => { try { return require("./player-development.js"); } catch { return null; } })() : null);
    if (!Dev || typeof Dev.expectedAnnualChange !== "function") return 1;
    try {
      const person = s.person, current = helpers.overall(person), age = Number(person.age) || 22;
      const hero = s.statistics?.players?.hero, apps = Number(hero?.appearances) || 0;
      // Nota media real so conta para o treino; nas partidas o desempenho ja gera os pontos (evita contar duas vezes).
      const factors = source === "training" && apps >= 5 && Number(hero.ratingTotal) > 0 ? { avgRating: Number(hero.ratingTotal) / apps } : {};
      const ctx = { seed: s.initialSeed ?? s.rng, season: s.season, factors };
      const subject = { ...person, overall: current, ovr: current };
      const exp = Dev.expectedAnnualChange(subject, ctx);
      const mod = Dev.evolutionModifier(factors);
      let adj;
      if (exp.phase === "decline") {
        adj = 1.08 - 0.09 * Math.max(1, age - exp.params.peakEnd) * exp.params.declineRate * mod.decline;
      } else if (exp.phase === "growth" || age <= exp.params.peakAge) {
        const ref = Dev.expectedAnnualChange({ ...subject, ...DEV_REF }, { ...ctx, factors: {} }).expected;
        adj = ref > 0.05 ? exp.expected / ref : 1;
        adj *= Math.min(1.15, Math.max(0.85, mod.growth));
      } else adj = 1;
      return Number.isFinite(adj) ? Math.max(0.55, Math.min(1.4, adj)) : 1;
    } catch { return 1; }
  }
  function gradeMultiplier(grade) { return ({D:.55,C:.78,B:1,A:1.25})[grade] || 1; }
  function difficultyCost(value) { return 62 + Math.max(0, value - 60) * 1.55 + Math.max(0, value - 80) * 1.8 + Math.max(0, value - 90) * 2.6; }
  function progressAttribute(s, key, points, helpers, source) {
    const plan=init(s); expand(s.person.attrs);
    if(points>0) ensureDevelopmentProfile(s,helpers);
    const arch=plan.archetype || {};
    const archBoost=arch.focus?.includes(key) ? 1.16 : 1;
    const styleBoost=styleFocus[s.person.style]?.includes(key) ? 1.18 : 1;
    const specBoost=1+specializationBonus(plan,key);
    const ageMult=Math.max(0.4,Math.min(1.75,ageFactor(s.person.age)*developmentAdjust(s,helpers,source)));
    let gain=Math.max(0,points)*ageMult*archBoost*styleBoost*specBoost*(root.ProLifeCreation?.progressionMultiplier?.(s)||1);
    const changes=[];
    while(gain>0 && s.person.attrs[key] < 100 && helpers.overall(s.person) < ceiling(s,helpers)){
      const need=difficultyCost(s.person.attrs[key]);
      const current=plan.attributeProgress[key]||0, remaining=need-current;
      if(gain < remaining){ plan.attributeProgress[key]=current+gain; gain=0; break; }
      gain-=remaining; const before=s.person.attrs[key]; improve(s,key,1,helpers); plan.attributeProgress[key]=0;
      if(s.person.attrs[key]>before){ plan.improvements++; changes.push({key,label:skills[key],before,after:s.person.attrs[key]}); } else break;
    }
    const parent=related[key];
    if(parent && !core.includes(key) && parent!==key) changes.push(...progressAttribute(s,parent,points*.55,helpers,source));
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
    const category={...trainingCategories[ex.category],id:ex.category};
    const intensity=s.intensity || "normal";
    if(intensity==="rest") return {available:false,reason:"Recuperação não conta como sessão de treino."};
    const quality=Math.max(0,Math.min(.999,rng.next()+s.person.discipline/520));
    const grade=quality>=.88?"A":quality>=.66?"B":quality>=.42?"C":"D";
    const gm=gradeMultiplier(grade), load=intensity==="hard"?1.28:1;
    const energyCost=intensity==="hard"?11:6;
    const specializationMultiplier=root.ProLifeIdentity?.trainingXpMultiplier?.(s,category)||1;
    const perkMultiplier=archetypePerkTrainingMultiplier(s,category);
    const xp=(intensity==="hard"?3.8:2.8)*gm*ageFactor(s.person.age)*specializationMultiplier*perkMultiplier;
    const beforeLevel=plan.level, beforeArchetypeLevel=plan.archetypeLevel;
    addDevelopmentXp(s,xp);
    const gainedArchetypeXp=archetypeTrainingXp(s,category,xp);
    if(gainedArchetypeXp>0) addArchetypeXp(s,gainedArchetypeXp);
    const changes=[];
    for(const key of category.attrs){
      changes.push(...progressAttribute(s,key,(automatic?(intensity==="hard"?24:9):(intensity==="hard"?29:22))*gm/category.attrs.length,helpers,"training"));
    }
    const previous=plan.exerciseGrades[ex.id];
    if(!previous || gradeRank[grade]>gradeRank[previous]) plan.exerciseGrades[ex.id]=grade;
    plan.activeMultiplier={exerciseId:ex.id,category:ex.category,action:category.action,value:Math.max(1.03,Math.min(1.35,category.multiplier*gm)),expiresDay:s.day+7,grade};
    if(automatic) plan.lastAutoDay=s.day; else plan.lastTrainingDay=s.day;
    plan.sessions++;
    root.ProLifeIdentity?.onTraining?.(s,category);
    s.person.condition=helpers.clamp(s.person.condition-energyCost,0,100);
    const result={available:true,automatic,day:s.day,exerciseId:ex.id,exercise:ex.name,grade,xp,archetypeXp:gainedArchetypeXp,perkMultiplier,energyCost,changes,levelBefore:beforeLevel,levelAfter:plan.level,archetypeLevelBefore:beforeArchetypeLevel,archetypeLevelAfter:plan.archetypeLevel};
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
    xp=Math.max(.35,xp);
    const perkMatchBonus=archetypePerkMatchBonus(s,metrics,xp);
    xp+=perkMatchBonus;
    const importanceFactor=Math.max(1,Math.min(1.25,Number(match.importance?.factor||1)));
    const matchXp = xp * 1.35 * importanceFactor;
    const archetypeFocus = plan.archetype?.focus || [];
    const archetypeActionBonus = archetypeFocus.length ? 1.12 : 1;
    const archetypeXp = matchXp * archetypeActionBonus;
    s.trainingProgress=Math.min(100,(s.trainingProgress||0)+matchXp);
    const beforeLevel=plan.level, beforeArchetypeLevel=plan.archetypeLevel;
    addDevelopmentXp(s,matchXp);
    addArchetypeXp(s,archetypeXp);
    const potentialDelta=potentialReview(s,metrics);
    const changes=[]; const performancePoints=Math.max(2,((rating-6)*4+goals*4+assists*3+tackles*.35+saves*.3+cleanSheet)*4.25);
    for(const key of pool.slice(0,4)) changes.push(...progressAttribute(s,key,performancePoints/pool.slice(0,4).length,helpers,"match"));
    root.ProLifeIdentity?.onMatch?.(s,metrics);
    if(rating>=8){plan.weeklyXI++;plan.accoladePoints+=1;} if(goals)plan.accoladePoints+=goals*.6;if(assists)plan.accoladePoints+=assists*.5;
    return {bonus:true,rating,goals,assists,xp:matchXp,archetypeXp,perkMatchBonus,potentialDelta,changes,levelBefore:beforeLevel,levelAfter:plan.level,archetypeLevelBefore:beforeArchetypeLevel,archetypeLevelAfter:plan.archetypeLevel};
  }
  // Dados anuais reais do heroi (somente leitura). Retorna null quando nao ha base confiavel.
  function seasonStatsFor(s) {
    const snap = s.statistics?.seasons?.[0];
    if (!snap || snap.season !== s.season || !snap.player) return null;
    const pl = snap.player, stints = Array.isArray(pl.stints) ? pl.stints.filter((x) => x && x.season === s.season) : [];
    if (!stints.length) return null;
    // Jogos do(s) clube(s) do heroi enquanto ele estava neles = oportunidades reais de jogar.
    let opportunities = 0;
    for (const m of s.matches || []) {
      if (m?.season !== s.season || !Number.isFinite(m.date)) continue;
      if (stints.some((st) => (m.home === st.clubId || m.away === st.clubId) && m.date >= (st.startDay ?? -Infinity) && m.date <= (st.endDay ?? Infinity))) opportunities++;
    }
    if (opportunities < 8) return null;
    const apps = Number(pl.appearances) || 0, minutes = Number(pl.minutes) || 0;
    if (apps > 0 && minutes <= 0) return null;               // minutagem nao registrada: nao inventar
    const out = { season: s.season, minutesShare: Math.max(0, Math.min(1, minutes / (opportunities * 90))), regularity: Math.max(0, Math.min(1, apps / opportunities)), injuries: 0, severeInjuries: 0 };
    if (apps >= 5 && Number(pl.averageRating) > 0) out.avgRating = Number(pl.averageRating);
    const base = (s.season - 2026) * 365, q = s.person?.physical, list = [...(Array.isArray(q?.history) ? q.history : []), ...(q?.active ? [q.active] : [])];
    for (const h of list) if (Number.isFinite(h?.startDay) && h.startDay >= base && h.startDay < base + 365) { out.injuries++; if (String(h.severity).toUpperCase() === "GRAVE") out.severeInjuries++; }
    return out;
  }
  function reviewSeasonPotential(s, helpers) {
    const DP = root.ProLifeDynamicPotential || (typeof require === "function" ? (() => { try { return require("./dynamic-potential.js"); } catch { return null; } })() : null);
    if (s.mode !== "player" || !s.person || !DP || typeof DP.reviewPotential !== "function" || !Number.isFinite(s.person.potential)) return { applied: false, reason: "indisponivel" };
    const rec = s.person.potentialReview, last = Number.isFinite(rec?.lastReviewSeason) ? rec.lastReviewSeason : null;
    if (last !== null && last >= s.season) return { applied: false, reason: "temporada ja avaliada" };
    const st = seasonStatsFor(s);
    if (!st) return { applied: false, reason: "dados insuficientes" };
    const overall = helpers.overall(s.person), original = Number.isFinite(rec?.originalPotential) ? rec.originalPotential : s.person.potential;
    const r = DP.reviewPotential({ ...s.person, overall, ovr: overall }, st, { seed: s.initialSeed ?? s.rng, originalPotential: original, lastReviewSeason: last ?? undefined });
    if (r.repeated) return { applied: false, reason: r.reason };
    s.person.potential = r.potential;
    s.person.potentialReview = { originalPotential: original, lastReviewSeason: s.season };
    return { applied: true, ...r, stats: st };
  }
  // Stage 32D.3C - recompensas de temporada idempotentes.
  // Marcador minimo: trainingPlan.lastRewardSeason (ultima temporada recompensada).
  // Politica para saves antigos (sem marcador): a recompensa so e paga quando o snapshot da temporada
  // encerrada (Statistics.closeSeason, executado imediatamente antes na virada) corresponde a s.season,
  // ou quando nao ha nenhum snapshot (chamada direta sem estatisticas). Depois da virada s.season avanca e o
  // snapshot fica atras, entao reabrir/importar/avancar um save antigo nunca repete a recompensa.
  // Stage 32D.4 - envelhecimento anual do protagonista (auge e declinio por perfil).
  // Aplicado uma vez por virada, dentro de seasonRewards (nenhuma mudanca em engine.js). Marcador: trainingPlan.lastAgingSeason.
  // O motor soma +1 a idade logo depois; o declinio usa a idade que o jogador tera na proxima temporada.
  // Atributos fisicos caem mais que os tecnicos; subatributos acompanham o principal relacionado.
  const PHYSICAL_CORE = ["pace", "strength", "stamina"], TECH_CORE = ["finish", "pass", "defense"];
  const AGING_CAP = { physical: 4, technical: 2, overall: 3 };
  function agingUnit(key) { let h = 2166136261; const str = String(key); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; }
  function applySeasonAging(s, helpers) {
    if (s.mode !== "player" || !s.person?.attrs) return { applied: false, reason: "indisponivel" };
    const plan = init(s);
    if (Number.isFinite(plan.lastAgingSeason) && plan.lastAgingSeason >= s.season) return { applied: false, reason: "temporada ja envelhecida" };
    const seasons = s.statistics?.seasons;
    if (Array.isArray(seasons) && seasons.length && seasons[0]?.season !== s.season) return { applied: false, reason: "fora da virada" };
    const Dev = devModule();
    if (!Dev || typeof Dev.expectedAnnualChange !== "function") return { applied: false, reason: "indisponivel" };
    ensureDevelopmentProfile(s, helpers);
    const person = s.person, before = helpers.overall(person), ageNext = (Number(person.age) || 0) + 1;
    const st = seasonStatsFor(s);
    const factors = st ? { ...(st.avgRating ? { avgRating: st.avgRating } : {}), minutesShare: st.minutesShare, injuries: st.injuries, severeInjury: st.severeInjuries > 0 } : {};
    const seed = s.initialSeed ?? s.rng;
    const exp = Dev.expectedAnnualChange({ ...person, age: ageNext, overall: before, ovr: before }, { seed, season: s.season, factors });
    plan.lastAgingSeason = s.season;
    if (exp.phase !== "decline") return { applied: true, declined: false, phase: exp.phase, profile: exp.profile, changes: [] };
    expand(person.attrs);
    const snapshot = { ...person.attrs }, changes = [];
    const dropFor = (core, amount, cap) => {
      const raw = Math.min(cap, Math.max(0, amount)), n = Math.floor(raw);
      return n + (agingUnit([seed, s.season, person.id || person.name, core].join("|")) < raw - n ? 1 : 0);
    };
    const run = (scale) => {
      Object.assign(person.attrs, snapshot);
      for (const core of [...PHYSICAL_CORE, ...TECH_CORE]) {
        const physical = PHYSICAL_CORE.includes(core), d = dropFor(core, -(physical ? exp.physical : exp.technical) * scale, physical ? AGING_CAP.physical : AGING_CAP.technical);
        if (!d) continue;
        const prev = person.attrs[core]; person.attrs[core] = Math.max(20, prev - d);
        const real = prev - person.attrs[core];
        if (!real) continue;
        for (const sub of Object.keys(related)) if (related[sub] === core && Number.isFinite(person.attrs[sub])) person.attrs[sub] = Math.max(20, person.attrs[sub] - real);
      }
    };
    run(1);
    for (let scale = 0.75; helpers.overall(person) < before - AGING_CAP.overall && scale > 0; scale -= 0.25) run(scale);
    if (helpers.overall(person) < before - AGING_CAP.overall) Object.assign(person.attrs, snapshot);
    for (const k of Object.keys(person.attrs)) if (person.attrs[k] !== snapshot[k]) changes.push({ key: k, before: snapshot[k], after: person.attrs[k] });
    return { applied: true, declined: changes.length > 0, phase: exp.phase, profile: exp.profile, overallBefore: before, overallAfter: helpers.overall(person), changes };
  }
  function rewardsDue(s, plan) {
    if (Number.isFinite(plan.lastRewardSeason) && plan.lastRewardSeason >= s.season) return false;
    const seasons = s.statistics?.seasons;
    if (Array.isArray(seasons) && seasons.length) return seasons[0]?.season === s.season;
    return true;
  }
  function seasonRewards(s, awards, helpers) {
    if (s.mode !== "player") return 0;
    const plan = init(s); let points = 0;
    // A revisao de potencial e independente: tem a propria guarda (lastReviewSeason) e nunca bloqueia a recompensa.
    // Ordem: revisao de potencial (GER antes do envelhecimento) e depois envelhecimento; ambos com guarda propria.
    reviewSeasonPotential(s, helpers); applySeasonAging(s, helpers);
    if (!rewardsDue(s, plan)) return 0;
    for (const a of awards || []) if (a?.winner === s.person.name) {
      points += /Craque/.test(a.name) ? 5 : /Artilheiro|assistências/.test(a.name) ? 4 : 3;
    }
    const own = s.clubId && s.clubs.find((c) => c.id === s.clubId);
    const leagueTitle = own && s.clubs.filter((c) => c.leagueId === own.leagueId).slice().sort((a,b)=>b.stats.points-a.stats.points || (b.stats.gf-b.stats.ga)-(a.stats.gf-a.stats.ga))[0]?.id === own.id;
    if (leagueTitle) points += 4;
    if (s.competitionSchedule?.cup?.champion === own?.name) points += 4;
    if (s.competitionSchedule?.state?.champion === own?.name) points += 2;
    plan.accoladePoints += points;
    plan.lastRewardSeason = s.season;
    // 32D.3B: titulos e premios geram pontos de conquista, mas nao elevam o potencial diretamente.
    return points;
  }
  const api = { applySeasonAging, reviewSeasonPotential, reassessDevelopmentProfile, core, skills, groups, styleFocus, archetypes, archetypeCatalog, defaultArchetypeId, origins, specializations, archetypePerks, trainingCategories, exercises, gradeRank, expand, groupRatings, init, ceiling, xpForLevel, addDevelopmentXp, addArchetypeXp, archetypePerkSlots, availableArchetypePerks, unlockArchetypePerk, activateArchetypePerk, deactivateArchetypePerk, activeArchetypePerks, reconcileArchetypePerks, compatibleActiveArchetypePerks, archetypePerkTrainingMultiplier, archetypePerkMatchBonus, archetypeTrainingXp, unlockSpecialization, activateSpecialization, MAX_SPECIALIZATIONS, archetypeSpecializations, ageFactor, attributeProgressPercent, mandatoryCommitmentToday, trainingAvailable, performTraining, progressAttribute, daily, matchDevelopment, seasonRewards };
  root.ProLifeTraining = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
