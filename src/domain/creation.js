(function (root) {
  "use strict";
  // Etapa 14 — Histórias de origem, criação de jogador e início de carreira.
  // O catálogo das histórias vive em Training.origins[id].story (fonte única). Aqui ficam as regras:
  // geração de atributos por posição/arquétipo, saneamento do modo personalizado, oportunidades iniciais,
  // contexto inicial (reputação, popularidade, finanças), objetivos e registro do primeiro dia.
  // Determinismo: tudo deriva de (config, seed). Nenhuma decisão usa Math.random(), Date.now() ou UUID.
  const Training = root.ProLifeTraining || (typeof require === "function" ? require("./training.js") : null);
  const VERSION = 1, POINT_BUDGET = 10, POINT_MAX = 6;
  const CORE = ["pace", "finish", "pass", "defense", "strength", "stamina"];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (range, rng) => rng.int(range[0], range[1]);

  // CASUAL / NORMAL / REALISTA / DESAFIADOR: ajustes moderados e transparentes (nunca alteram resultados de jogo).
  const difficulties = {
    casual: { name: "Casual", description: "Evolução um pouco mais rápida e metas mais leves.", progression: 1.12, objectives: 0.75, salary: 1.06 },
    normal: { name: "Normal", description: "Equilíbrio padrão do PRO-LIFE.", progression: 1, objectives: 1, salary: 1 },
    realistic: { name: "Realista", description: "Evolução mais lenta e metas mais exigentes.", progression: 0.94, objectives: 1.1, salary: 1 },
    challenging: { name: "Desafiador", description: "Evolução lenta, metas duras e propostas mais modestas.", progression: 0.88, objectives: 1.25, salary: 0.95 },
  };
  // Personalidade simples: pequenos efeitos reais no ponto de partida; independente da origem.
  const personalities = {
    balanced: { name: "Equilibrado", description: "Sem inclinações marcantes.", discipline: 0, morale: 0, fan: 0, sponsor: 0, pressure: 0, potential: 0 },
    professional: { name: "Profissional", description: "Rotina séria: treina melhor, menos brilho fora de campo.", discipline: 8, morale: 0, fan: 0, sponsor: 0, pressure: 0, potential: 0 },
    ambitious: { name: "Ambicioso", description: "Quer mais e cedo: teto maior, pressão maior.", discipline: 2, morale: 0, fan: 0, sponsor: 0, pressure: 8, potential: 2 },
    charismatic: { name: "Carismático", description: "A torcida e as marcas gostam de você.", discipline: 0, morale: 0, fan: 6, sponsor: 6, pressure: 0, potential: 0 },
    leader: { name: "Líder", description: "Cresce com responsabilidade; vestiário confiante.", discipline: 3, morale: 6, fan: 2, sponsor: 0, pressure: 0, potential: 0 },
  };
  // Distribuição inicial por posição: deslocamentos dos 6 atributos principais em relação ao overall alvo.
  const posOffsets = {
    ATA: { pace: 6, finish: 10, pass: -3, defense: -24, strength: 1, stamina: -1 },
    MEI: { pace: -1, finish: -4, pass: 11, defense: -9, strength: -4, stamina: 4 },
    DEF: { pace: -3, finish: -26, pass: -6, defense: 13, strength: 7, stamina: 2 },
    GOL: { pace: -20, finish: -30, pass: -3, defense: 12, strength: 3, stamina: 8 },
  };
  const posLabels = { GOL: "Goleiro", DEF: "Defensor", MEI: "Meio-campista", ATA: "Atacante" };

  function storyOf(originId) {
    const id = Training.origins[originId] ? originId : "blank";
    return { id, origin: Training.origins[id], story: Training.origins[id].story };
  }
  function compatibleArchetypes(pos) { return Object.values(Training.archetypeCatalog).filter((a) => a.positions.includes(pos)); }
  function maxOverallForAge(age) { return Math.round(Math.min(84, 68 + (age - 16) * 2.5)); }
  // Modo personalizado: valores controlados; nunca produz estado impossível. Devolve também o que foi ajustado.
  function sanitizeCustom(input = {}) {
    const notes = [], num = (v, d) => (Number.isFinite(Number(v)) && v !== "" && v !== null && v !== undefined ? Number(v) : d);
    const age = clamp(Math.round(num(input.age, 18)), 14, 32);
    const cap = maxOverallForAge(age);
    let overall = clamp(Math.round(num(input.overall, 64)), 45, 80);
    if (overall > cap) { overall = cap; notes.push(`Aos ${age} anos o overall máximo realista é ${cap}.`); }
    let reputation = clamp(Math.round(num(input.reputation, 12)), 0, 60);
    const repCap = Math.max(10, Math.round((overall - 40) * 1.4));
    if (reputation > repCap) { reputation = repCap; notes.push(`Reputação limitada a ${repCap} para esse nível.`); }
    let popularity = clamp(Math.round(num(input.popularity, 5)), 0, 45);
    if (popularity > reputation + 15) { popularity = reputation + 15; notes.push(`Popularidade limitada a ${popularity} (reputação + 15).`); }
    const wallet = clamp(Math.round(num(input.wallet, 5000)), 0, 40000);
    return { age, overall, reputation, popularity, wallet, notes };
  }
  function ageRange(storyId, story) { return [14, story.ages[1]]; }

  // Geração de atributos: perfil por posição + arquétipo + estilo + variação semeada, normalizado ao overall alvo.
  function buildAttributes(api, { pos, archetypeId, style, target, age, points }, rng) {
    const arch = Training.archetypeCatalog[archetypeId], styleKeys = Training.styleFocus[style] || [];
    const maturity = age >= 22 ? { strength: 3, stamina: 2, pace: -2 } : age <= 18 ? { pace: 2, strength: -2 } : {};
    const raw = {};
    for (const k of CORE) raw[k] = posOffsets[pos][k] + (arch.focus.includes(k) ? 3 : 0) + (arch.weak.includes(k) ? -3 : 0) + (styleKeys.includes(k) ? 2 : 0) + (maturity[k] || 0) + rng.int(-3, 3);
    let shift = target, core = {};
    for (let i = 0; i < 14; i++) {
      core = {};
      for (const k of CORE) core[k] = clamp(Math.round(shift + raw[k]), 20, 99);
      const ov = api.overall({ pos, attrs: { ...core } });
      if (ov === target) break;
      shift += target - ov > 0 ? Math.max(1, (target - ov) * 0.8) : Math.min(-1, (target - ov) * 0.8);
    }
    for (const k of CORE) core[k] = clamp(core[k] + (points?.[k] || 0), 20, 99);
    const attrs = { ...core };
    Training.expand(attrs);
    // Subatributos refletem o arquétipo e o estilo (não afetam o overall, que usa os 6 principais).
    for (const k of Object.keys(Training.skills)) {
      if (CORE.includes(k)) continue;
      const bias = (arch.focus.includes(k) ? 6 : 0) + (arch.weak.includes(k) ? -5 : 0) + (styleKeys.includes(k) ? 3 : 0) + rng.int(-3, 3);
      attrs[k] = clamp(Math.round(attrs[k] + bias), 20, 100);
    }
    return attrs;
  }
  function checkPoints(points) {
    let total = 0;
    for (const k of CORE) {
      const v = Number(points?.[k]) || 0;
      if (v < 0 || v > POINT_MAX) throw Error(`Cada atributo aceita no máximo ${POINT_MAX} pontos de ajuste.`);
      total += v;
    }
    if (total > POINT_BUDGET) throw Error(`Distribua no máximo ${POINT_BUDGET} pontos de ajuste.`);
    return total;
  }
  // Resolve a criação inteira (sem mundo): usado pelo preview da UI e por engine.create. Mesma entrada => mesma saída.
  function resolve(api, config, seed) {
    const input = config.creation || {};
    const { id: storyId, origin, story } = storyOf(config.origin);
    const rng = new api.Random(((Number(seed) >>> 0) ^ 0x5bd1e995) >>> 0 || 1);
    const custom = storyId === "custom" ? sanitizeCustom({ ...(input.custom || {}), age: input.custom?.age ?? config.age }) : null;
    const [minAge, maxAge] = ageRange(storyId, story);
    const age = custom ? custom.age : clamp(Math.round(Number(config.age)) || story.age, minAge, maxAge);
    const pos = posOffsets[config.pos] ? config.pos : "MEI";
    const options = compatibleArchetypes(pos);
    const archetypeId = options.some((a) => a.id === config.archetypeId) ? config.archetypeId : Training.defaultArchetypeId[pos];
    const difficulty = difficulties[input.difficulty] ? input.difficulty : "normal";
    const personality = personalities[input.personality] ? input.personality : "balanced";
    const style = Training.styleFocus[config.style] ? config.style : "Técnico";
    const points = {}; for (const k of CORE) points[k] = Number(config.points?.[k]) || 0;
    checkPoints(points);
    const target = custom ? custom.overall : clamp(pick(story.ovr, rng) + clamp(age - story.age, -1, 2), story.ovr[0], story.ovr[1] + 2);
    const potentialBase = custom ? clamp(custom.overall + 6 + rng.int(0, 14), 55, 96) : pick(story.potential, rng);
    const attrs = buildAttributes(api, { pos, archetypeId, style, target, age, points }, rng);
    const reputation = custom ? custom.reputation : pick(story.reputation, rng);
    const popularity = custom ? custom.popularity : pick(story.popularity, rng);
    const wallet = custom ? custom.wallet : story.wallet;
    const traits = personalities[personality];
    return {
      version: VERSION, storyId, story, origin, seed: Number(seed) >>> 0, custom, notes: custom ? custom.notes : [],
      difficulty, personality, age, pos, archetypeId, style, points, target, attrs,
      potential: clamp(potentialBase + traits.potential, 55, 100), reputation, popularity, wallet,
      discipline: clamp(70 + traits.discipline, 30, 100), morale: clamp(70 + traits.morale, 30, 100),
      overall: api.overall({ pos, attrs }), startMode: input.startMode === "club" ? "club" : "offers",
    };
  }
  // Prévia leve para a UI (não gera mundo/clubes).
  function preview(api, config, seed) {
    const r = resolve(api, config, seed);
    const strengths = Object.entries(r.attrs).map(([key, value]) => ({ key, label: Training.skills[key] || key, value })).sort((a, b) => b.value - a.value || a.key.localeCompare(b.key)).slice(0, 4);
    return { ...r, strengths, archetypes: compatibleArchetypes(r.pos).map((a) => ({ id: a.id, name: a.name, description: a.description })) };
  }
  function progressionMultiplier(s) { return s?.creation?.difficulty ? difficulties[s.creation.difficulty]?.progression || 1 : 1; }

  // Aplica o contexto inicial ao estado recém-criado (reputação ≠ popularidade; finanças modestas).
  function applyContext(s, plan) {
    s.reputation = plan.reputation;
    s.wallet = plan.wallet;
    const c = s.commercial;
    if (c) {
      const traits = personalities[plan.personality];
      c.popularity = clamp(plan.popularity + Math.round(traits.fan / 3), 0, 100);
      c.exposure = c.popularity;
      c.followers = Math.max(100, Math.round(1000 * Math.pow(1.09, c.popularity)));
      s.fans = c.followers;
      c.lastFansSnapshot = s.fans;
    }
    const pc = s.extras?.playerCareer, traits = personalities[plan.personality];
    if (pc?.mediaProfile) {
      pc.mediaProfile.pressure = clamp(Math.round(plan.story.expectation * 0.5) + traits.pressure, 0, 100);
      pc.mediaProfile.fanSentiment = clamp(pc.mediaProfile.fanSentiment + traits.fan, 0, 100);
      pc.mediaProfile.sponsorAppeal = clamp(pc.mediaProfile.sponsorAppeal + traits.sponsor, 0, 100);
    }
    s.creation = {
      version: VERSION, status: "unsigned", seed: plan.seed, storyId: plan.storyId, difficulty: plan.difficulty, personality: plan.personality,
      archetypeId: plan.archetypeId, style: plan.style, points: { ...plan.points }, custom: plan.custom ? { age: plan.custom.age, overall: plan.custom.overall, reputation: plan.custom.reputation, popularity: plan.custom.popularity, wallet: plan.custom.wallet } : null,
      notes: plan.notes.slice(0, 6),
      initial: { age: plan.age, pos: plan.pos, overall: plan.overall, reputation: plan.reputation, popularity: s.commercial ? s.commercial.popularity : plan.popularity, wallet: plan.wallet, potential: plan.potential, core: Object.fromEntries(CORE.map((k) => [k, plan.attrs[k]])) },
      clubId: null, contract: null, expectation: null, objectives: [], startedDay: null, started: false, startMode: plan.startMode,
    };
  }

  // Oportunidades iniciais: clubes coerentes com origem, nível, posição e necessidade real do elenco.
  function competitionAt(api, club, pos, heroOvr, s = null) {
    const embedded=Array.isArray(club?.roster)?club.roster:[];
    const globalPlayers=!embedded.length&&s&&api.GlobalFootball?.playersByClub?api.GlobalFootball.playersByClub(s,club?.id):[];
    const group=(Array.isArray(globalPlayers)?globalPlayers:embedded).filter((p) => p?.pos === pos && p.id !== "hero").map((p) => {
      const stored=Number(p.ovr ?? p.overall);
      return Number.isFinite(stored)?stored:(p.attrs?api.overall(p):60);
    }).filter(Number.isFinite).sort((a, b) => b - a);
    const top = group.slice(0, 3), topAvg = top.length ? top.reduce((n, x) => n + x, 0) / top.length : heroOvr;
    return { rank: 1 + group.filter((o) => o > heroOvr).length, count: group.length + 1, topOvr: group[0] || 0, topAvg, need: api.positionNeed(club, pos, s), gap: topAvg - heroOvr };
  }
  const roleByRank = (rank) => (rank <= 2 ? "Importante" : rank <= 4 ? "Rotação" : "Reserva");
  const pitches = {
    showcase: { label: "Vitrine", text: "Clube de maior estrutura e melhor salário, com disputa forte por posição." },
    playing: { label: "Espaço para jogar", text: "Menos concorrência na sua posição: minutos serão decididos por mérito." },
    development: { label: "Projeto de desenvolvimento", text: "Contrato longo e acompanhamento de evolução, com salário mais contido." },
    direct: { label: "Escolha direta", text: "Você escolheu este projeto. A titularidade continuará dependendo de mérito e concorrência." },
  };
  function countryOf(s,api,club){return club?.country||api.GlobalFootball?.leagueById?.(s,club?.leagueId)?.country||(String(club?.id||"").match(/^c\d+$/)?"Brasil":"");}
  function sameCountry(api,a,b){const normalize=api.GlobalFootball?.normalizedNationality||(value=>String(value||"").toLowerCase());return !!a&&!!b&&normalize(a)===normalize(b);}
  function offerFor(s,api,plan,c,comp,kind){
    const heroOvr=api.overall(s.person),diff=difficulties[plan.difficulty]||difficulties.normal,young=s.person.age<=20;
    const assessment=api.Career.interestAssessment(s,c.id),kindMult={showcase:1.12,playing:.94,development:.88,direct:1}[kind]||1;
    const base=api.Career.realisticSalary(s,c.id)*plan.story.salaryMult*diff.salary*kindMult;
    const structure=Number(c.structure??c.strength??c.reputation??60),bonusBase=(600+s.reputation*70+heroOvr*40+structure*30)/100,expires=s.day+45;
    return {clubId:c.id,salary:Math.max(1500,Math.round(base/100)*100),role:pitches[kind].label,squadRole:roleByRank(comp.rank),durationDays:kind==="development"?(young?1095:730):kind==="showcase"?(young?730:1095):730,signingBonus:Math.round(bonusBase*({showcase:1,playing:.6,development:.5,direct:.6}[kind]||.6))*100,transferType:"permanent",expires,interestScore:assessment?.score,interestLabel:assessment?.label,responseDeadline:expires,round:0,pitch:{kind,...pitches[kind]},competition:{rank:comp.rank,count:comp.count,topOvr:comp.topOvr,need:comp.need,structure,leagueId:c.leagueId}};
  }
  function opportunities(s, rng, api, plan) {
    const heroOvr = api.overall(s.person), story = plan.story;
    const rows = [];
    const clubs=(api.careerClubPool?.(s)||s.clubs||[]).filter((c)=>c?.id&&c.active!==false&&c.generated!==true);
    const seen=new Set(),nationality=s.person?.nationality||"Brasil";
    for (const c of clubs) {
      if(seen.has(c.id)){continue;} seen.add(c.id);
      const structure=Number(c.structure??c.strength??c.reputation??60),tier=story.tiers[c.leagueId]||Math.max(.2,1.5-Math.max(0,structure-heroOvr-4)/18);
      if (tier <= 0 || c.id === s.clubId) continue;
      const comp = competitionAt(api, c, s.person.pos, heroOvr, s),assessment=api.Career.interestAssessment(s,c.id);
      if(assessment?.eligible===false)continue;
      const plausible = Math.exp(-Math.max(0, comp.gap - 6) / 8);
      const weight = tier * plausible * (1 + 0.35 * comp.need);
      if (weight > 0.02) rows.push({ c:{...c,structure}, comp, weight, preferred:sameCountry(api,nationality,countryOf(s,api,c)) });
    }
    const pool = [];
    const wantedCount=Math.min(story.offers,3),preferred=rows.filter(r=>r.preferred),fallback=rows.filter(r=>!r.preferred);
    const sample=(source,limit)=>{for(let guard=0;guard<limit&&source.length;guard++){
      const total = source.reduce((n, r) => n + r.weight, 0);
      let roll = rng.next() * total, i = 0;
      for (; i < source.length - 1; i++) { roll -= source[i].weight; if (roll <= 0) break; }
      pool.push(source.splice(i, 1)[0]);
    }};
    sample(preferred,9);
    if(pool.length<wantedCount)sample(fallback,9-pool.length);
    const wanted = story.offers >= 3 ? ["showcase", "playing", "development"] : ["playing", "development"];
    const chosen = [], take = (row, kind) => { if (row) { pool.splice(pool.indexOf(row), 1); chosen.push({ ...row, kind }); } };
    for (const kind of wanted) {
      if (!pool.length) break;
      const byId = (a, b) => a.c.id.localeCompare(b.c.id);
      let row;
      if (kind === "showcase") row = pool.slice().sort((a, b) => b.c.structure - a.c.structure || byId(a, b))[0];
      else if (kind === "playing") row = pool.slice().sort((a, b) => a.comp.rank - b.comp.rank || b.comp.need - a.comp.need || a.c.structure - b.c.structure || byId(a, b))[0];
      else {
        const mid = chosen.length ? chosen.reduce((n, x) => n + x.c.structure, 0) / chosen.length : 60;
        row = pool.slice().sort((a, b) => (b.comp.need * 2 - Math.abs(b.c.structure - mid)) - (a.comp.need * 2 - Math.abs(a.c.structure - mid)) || byId(a, b))[0];
      }
      take(row, kind);
    }
    while (chosen.length < Math.min(story.offers, 3) && pool.length) take(pool.slice().sort((a, b) => b.weight - a.weight || a.c.id.localeCompare(b.c.id))[0], "playing");
    return chosen.map(({ c, comp, kind }) => offerFor(s,api,plan,c,comp,kind));
  }

  // Expectativa inicial e objetivos (progresso derivado das estatísticas reais; nada é garantido ao jogador).
  function expectationOf(plan, club, offer) {
    const value = clamp(Math.round(plan.story.expectation + (club.structure - 60) * 0.4 + personalities[plan.personality].pressure + (offer?.competition?.rank <= 2 ? 6 : 0)), 0, 100);
    return { value, label: value >= 60 ? "Alta" : value >= 35 ? "Moderada" : "Baixa" };
  }
  function objectivesFor(s, offer, expectation) {
    const ease = difficulties[s.creation.difficulty].objectives, rank = offer?.competition?.rank || 3;
    const games = Math.max(3, Math.round((rank <= 2 ? 20 : rank <= 4 ? 12 : 6) * ease));
    const arch = Training.archetypeCatalog[s.creation.archetypeId], key = (arch.focus.find((k) => CORE.includes(k)) || CORE[0]);
    const list = [{ id: "games", label: `Disputar ${games} partidas pelo clube`, metric: "appearances", target: games }];
    if (expectation.value >= 45) list.push({ id: "rating", label: `Nota média ${(6.6 + 0.2 * ease).toFixed(1).replace(".", ",")} ou mais em pelo menos 8 jogos`, metric: "rating", target: +(6.6 + 0.2 * ease).toFixed(1), minGames: 8 });
    else list.push({ id: "training", label: `Completar ${Math.round(40 * ease)} sessões de treino`, metric: "sessions", target: Math.round(40 * ease) });
    list.push({ id: "attribute", label: `Evoluir ${Training.skills[key]} em +${ease > 1 ? 3 : 2}`, metric: "attr", key, base: s.person.attrs[key], target: s.person.attrs[key] + (ease > 1 ? 3 : 2) });
    return list;
  }
  function objectives(s) {
    const c = s?.creation;
    if (!c?.started) return [];
    const stats = root.ProLifeStatistics?.heroDashboard?.(s)?.career || {}, plan = s.trainingPlan || {};
    return c.objectives.map((o) => {
      let current = 0, done = false;
      if (o.metric === "appearances") { current = Number(stats.appearances || 0); done = current >= o.target; }
      else if (o.metric === "sessions") { current = Number(plan.sessions || 0); done = current >= o.target; }
      else if (o.metric === "attr") { current = Math.round(Number(s.person.attrs[o.key] || 0)); done = current >= o.target; }
      else if (o.metric === "rating") { current = Number(stats.averageRating || 0); done = Number(stats.appearances || 0) >= o.minGames && current >= o.target; }
      return { ...o, current, done };
    });
  }

  // Primeiro dia profissional: idempotente (evento, inbox e objetivos nascem uma única vez).
  function registerStart(s, api) {
    const c = s?.creation;
    if (!c || c.started || s.mode !== "player" || !s.clubId) return false;
    const club = api.club(s), pc = api.Career.init(s).playerCareer, ct = pc.contract;
    const plan = { story: Training.origins[c.storyId].story, personality: c.personality };
    const offer = c.acceptedOffer || null;
    c.started = true; c.status = "started"; c.startedDay = s.day; c.clubId = s.clubId;
    c.contract = ct ? { clubId: ct.clubId, salary: ct.salary, durationDays: ct.durationDays, role: ct.role, signingBonus: ct.signingBonus || 0, signedDay: ct.signedDay } : null;
    c.expectation = expectationOf(plan, club, offer);
    c.objectives = objectivesFor(s, offer, c.expectation);
    delete c.acceptedOffer;
    const story = Training.origins[c.storyId].story, arch = Training.archetypeCatalog[c.archetypeId], money = (v) => "R$ " + Number(v).toLocaleString("pt-BR");
    api.log(s, "Início da carreira profissional", `${s.person.name} assina com o ${club.name} (${story.title}). ${ct ? `Contrato de ${Math.round(ct.durationDays / 365 * 10) / 10} ano(s), ${money(ct.salary)} por mês.` : ""}`);
    api.Career.post(s, "Clube", club.name, `Bem-vindo ao ${club.name}`, `A diretoria recebe você como ${s.person.pos} ${arch.name}. A expectativa inicial é ${c.expectation.label.toLowerCase()}. ${ct ? `Seu contrato prevê ${money(ct.salary)} mensais.` : ""}`);
    api.Career.post(s, "Clube", "Comissão técnica", "Primeira conversa", `Seu espaço no elenco será decidido por desempenho e disponibilidade. Para começar: ${c.objectives.map((o) => o.label.toLowerCase()).join("; ")}.`);
    if (pc.agent) api.Career.post(s, "Carreira", pc.agent.name || "Agente", "Orientação inicial", "Foque nos treinos e nos primeiros minutos. As propostas e renovações voltam a aparecer conforme sua evolução.");
    return true;
  }
  // Assinatura da proposta inicial escolhida no criador (reutiliza contrato da Etapa 7).
  function accept(s, clubId, api) {
    const c = s?.creation;
    if (!c || c.started) throw Error("A carreira já começou.");
    let offer = (s.offers || []).find((o) => o.clubId === clubId);
    if(!offer&&c.startMode==="club"){
      const club=(api.careerClubPool?.(s)||s.clubs||[]).find((candidate)=>candidate?.id===clubId&&candidate.active!==false&&candidate.generated!==true);
      if(club){const story=Training.origins[c.storyId].story,plan={story,difficulty:c.difficulty,personality:c.personality};offer=offerFor(s,api,plan,club,competitionAt(api,club,s.person.pos,api.overall(s.person),s),"direct");}
    }
    if (!offer) throw Error("Escolha uma das oportunidades iniciais.");
    api.movePlayerToClub(s, clubId);
    s.salary = offer.salary;
    api.Career.signContract(s, offer);
    s.careerTransferAvailableDay = api.Career.nextWindowDay(s.day);
    s.offers = [];
    root.ProLifeStatistics?.ensureHeroStint?.(s, clubId);
    root.ProLifeCompetitions?.ensureState?.(s);
    api.Career.updatePlayerRole(s);
    c.acceptedOffer = { competition: offer.competition, pitch: offer.pitch };
    registerStart(s, api);
    return offer;
  }
  // Textos de contexto para a tela Meu Jogador.
  function summary(s) {
    const c = s?.creation;
    if (!c) return null;
    const story = Training.origins[c.storyId]?.story;
    return { storyId: c.storyId, title: story?.title || "Carreira", level: story?.level, hint: story?.hint, difficulty: { id: c.difficulty, ...difficulties[c.difficulty] }, personality: { id: c.personality, ...personalities[c.personality] }, initial: c.initial, expectation: c.expectation, objectives: objectives(s), started: c.started, status: c.status, seed: c.seed, notes: c.notes || [] };
  }

  const api = { VERSION, POINT_BUDGET, POINT_MAX, CORE, difficulties, personalities, posOffsets, posLabels, storyOf, compatibleArchetypes, sanitizeCustom, maxOverallForAge, resolve, preview, progressionMultiplier, applyContext, competitionAt, opportunities, expectationOf, objectives, registerStart, accept, summary };
  root.ProLifeCreation = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
