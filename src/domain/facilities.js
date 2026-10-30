(function (root) {
  "use strict";
  // PRO LIFE — Instalações do clube (modo treinador). Níveis 0–5, custo debitado do orçamento do clube.
  // Estado em s.coachCareer.facilities = { version, clubId, levels:{...}, log:[] }.
  // Saves antigos não têm o campo: tudo é nível 0, que reproduz exatamente as regras anteriores.
  const VERSION = 1, MAX = 5, LOG_LIMIT = 20;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const DEFS = Object.freeze({
    stadium: { label: "Estádio", base: 6000000, blurb: "Capacidade e atmosfera do estádio.", effects: ["Capacidade de público", "Base de adeptos"], active: false },
    academy: { label: "Academia", base: 3000000, blurb: "Formação de jovens e evolução dos mais novos.", effects: ["Evolução de jogadores até 21 anos"], active: true },
    training: { label: "Centro de treino", base: 2500000, blurb: "Qualidade do treino coletivo e recuperação.", effects: ["Chance de evolução no treino", "Recuperação de condição"], active: true },
    scouting: { label: "Rede de olheiros", base: 1500000, blurb: "Alcance e velocidade da observação.", effects: ["Observações simultâneas do olheiro"], active: true },
    clubzone: { label: "Zona do clube", base: 4000000, blurb: "Receitas comerciais do clube.", effects: ["Receita comercial mensal"], active: true }
  });
  const IDS = Object.keys(DEFS);

  function ensure(s) {
    if (!s || s.mode !== "coach" || !s.coachCareer) return null;
    const c = s.coachCareer;
    let f = c.facilities;
    if (!f || typeof f !== "object" || f.version !== VERSION) f = c.facilities = { version: VERSION, clubId: s.clubId ?? null, levels: {}, log: [] };
    // trocou de clube: as instalações pertencem ao clube anterior
    if (f.clubId !== (s.clubId ?? null)) { f.clubId = s.clubId ?? null; f.levels = {}; f.log = []; }
    for (const id of IDS) f.levels[id] = clamp(Math.round(Number(f.levels[id]) || 0), 0, MAX);
    return f;
  }
  function levelOf(s, id) {
    if (!DEFS[id] || !s || s.mode !== "coach") return 0;
    const f = s.coachCareer?.facilities;
    if (!f || f.version !== VERSION || f.clubId !== (s.clubId ?? null)) return 0;
    return clamp(Math.round(Number(f.levels?.[id]) || 0), 0, MAX);
  }
  function multiplier(club) { return 0.5 + clamp(Number(club?.reputation) || 50, 0, 100) / 100; }
  function upgradeCost(s, club, id) {
    const def = DEFS[id], lv = levelOf(s, id);
    if (!def || lv >= MAX) return null;
    return Math.round((def.base * (lv + 1) * multiplier(club)) / 10000) * 10000;
  }

  // efeitos por nível (nível 0 = comportamento original)
  function effects(s, club) {
    const t = levelOf(s, "training"), a = levelOf(s, "academy"), sc = levelOf(s, "scouting"), cz = levelOf(s, "clubzone"), st = levelOf(s, "stadium");
    const rep = clamp(Number(club?.reputation) || 50, 0, 100);
    const CF = root.ProLifeClubFinance || (typeof require === "function" ? (() => { try { return require("./club-finance.js"); } catch (e) { return null; } })() : null);
    const baseCap = CF?.capacityOf ? CF.capacityOf(club) : Math.round((8000 + rep * 450) / 100) * 100;
    return {
      trainingGrowthMult: 1 + 0.2 * t,
      trainingRecoveryBonus: 0.5 * t,
      academyGrowthBonus: 0.01 * a,
      scoutSlots: 3 + 2 * sc,
      commercialMonthly: Math.round((cz * (60000 + rep * 3000)) / 1000) * 1000,
      stadiumCapacity: Math.round(baseCap * (1 + 0.12 * st) / 100) * 100,
      stadiumBase: baseCap
    };
  }
  function describe(s, club, id) {
    const e = effects(s, club), lv = levelOf(s, id), nx = Math.min(MAX, lv + 1);
    const at = (lvl) => { const fake = { mode: "coach", clubId: s.clubId, coachCareer: { facilities: { version: VERSION, clubId: s.clubId ?? null, levels: { ...(s.coachCareer?.facilities?.levels || {}), [id]: lvl } } } }; return effects(fake, club); };
    const cur = e, nxt = at(nx);
    const fmt = {
      stadium: (x) => `${x.stadiumCapacity.toLocaleString("pt-BR")} lugares`,
      academy: (x) => `+${Math.round(x.academyGrowthBonus * 100)}% de chance de evolução (até 21 anos)`,
      training: (x) => `+${Math.round((x.trainingGrowthMult - 1) * 100)}% de evolução · +${x.trainingRecoveryBonus.toFixed(1).replace(".", ",")} de recuperação/semana`,
      scouting: (x) => `${x.scoutSlots} observações simultâneas`,
      clubzone: (x) => (x.commercialMonthly ? `+R$ ${Math.round(x.commercialMonthly / 1000)} mil/mês` : "Sem receita extra")
    }[id];
    return { id, ...DEFS[id], level: lv, max: MAX, current: fmt(cur), next: lv >= MAX ? null : fmt(nxt), cost: upgradeCost(s, club, id) };
  }

  function upgrade(s, club, id) {
    if (!s || s.mode !== "coach") throw Error("Disponível para treinadores.");
    if (!DEFS[id]) throw Error("Instalação inválida.");
    if (!club) throw Error("Assine com um clube para melhorar as instalações.");
    const f = ensure(s);
    if (!f) throw Error("Carreira de treinador indisponível.");
    if (f.levels[id] >= MAX) throw Error("Esta instalação já está no nível máximo.");
    const cost = upgradeCost(s, club, id);
    if (!Number.isFinite(cost) || cost <= 0) throw Error("Custo indisponível.");
    if (!(Number(club.budget) >= cost)) throw Error("Orçamento insuficiente para esta melhoria.");
    club.budget = Math.round(Number(club.budget) - cost);
    f.levels[id] += 1;
    f.log.unshift({ day: Number(s.day) || 0, season: s.season, id, level: f.levels[id], cost });
    f.log.length = Math.min(f.log.length, LOG_LIMIT);
    return { id, level: f.levels[id], cost };
  }

  // receita comercial mensal creditada no dia 1 de cada ciclo de 30 dias
  function monthlyIncome(s, club) {
    const e = effects(s, club).commercialMonthly;
    return e > 0 ? e : 0;
  }

  const api = { VERSION, MAX, DEFS, IDS, ensure, levelOf, upgradeCost, effects, describe, upgrade, monthlyIncome };
  root.ProLifeFacilities = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
