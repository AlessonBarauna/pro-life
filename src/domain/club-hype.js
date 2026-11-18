(function (root) {
  "use strict";
  // PRO LIFE — exposição do clube na Champions League.
  // Quanto mais longe o clube vai, mais a mídia fala dele ("em alta"). Isso aumenta bilheteria, loja, patrocínio e o moral do elenco.
  const Career = root.ProLifeCareer || (typeof require === "function" ? require("./career.js") : null);
  const Continental = root.ProLifeContinental || (typeof require === "function" ? require("./continental.js") : null);
  const VERSION = 1;
  // Alvo de exposição por fase (0 a 1).
  const TARGET = { league: 0.14, playoffs: 0.24, round16: 0.4, quarters: 0.56, semis: 0.74, final: 0.92, champion: 1 };
  const LABEL = { league: "fase de liga", playoffs: "playoffs", round16: "oitavas de final", quarters: "quartas de final", semis: "semifinais", final: "final", champion: "campeão" };
  const MORALE = { league: 0, playoffs: 3, round16: 4, quarters: 5, semis: 7, final: 9, champion: 12 };
  const ORDER = ["league", "playoffs", "round16", "quarters", "semis", "final", "champion"];

  function hash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function state(s) {
    s.extras = s.extras || {};
    const h = s.extras.clubHype || (s.extras.clubHype = { version: VERSION, level: 0, season: null, stage: null, alive: false, announced: {}, hold: 0 });
    if (!h.announced) h.announced = {};
    return h;
  }
  function clubOf(s) { return [...(s.clubs || []), ...(s.globalFootball?.clubs || [])].find((c) => c?.id === s.clubId) || null; }

  // Onde o clube está na Champions desta temporada.
  function position(s) {
    if (!s.clubId) return null;
    let ed = null;
    try { ed = Continental?.activeEdition?.(s, "ucl") || Continental?.edition?.(s, "ucl"); } catch (_) {}
    const inLeague = ed?.leagueSchedule?.matches?.some((m) => m.homeId === s.clubId || m.awayId === s.clubId);
    if (!ed || !inLeague) return null;
    const ko = ed.knockout;
    if (!ko) return { season: ed.season, stage: "league", alive: true };
    if (ko.championId === s.clubId) return { season: ed.season, stage: "champion", alive: true };
    let reached = null, out = false;
    for (const st of ko.stages || []) {
      const here = (st.matches || []).some((m) => m.homeId === s.clubId || m.awayId === s.clubId);
      if (!here) continue;
      reached = st.key;
      if (st.winners && !st.winners.includes(s.clubId)) out = true;
    }
    if (!reached) {
      // Classificação da fase de liga: 1º a 8º vão direto às oitavas, 9º a 24º disputam os playoffs, o resto cai.
      const idx = (ko.ranking || []).findIndex((r) => (r?.id ?? r) === s.clubId);
      if (idx >= 0 && idx < 8) return { season: ed.season, stage: "round16", alive: true };
      if (idx >= 8 && idx < 24) return { season: ed.season, stage: "playoffs", alive: true };
      return { season: ed.season, stage: "league", alive: false, eliminated: true };
    }
    if (ko.status === "completed" && ko.championId !== s.clubId) out = true;
    return { season: ed.season, stage: reached, alive: !out, eliminated: out };
  }

  // Multiplicadores usados pelas finanças do clube do jogador.
  function level(s, club) {
    if (!s || !club || club.id !== s.clubId) return 0;
    const l = Number(s.extras?.clubHype?.level);
    return Number.isFinite(l) ? Math.max(0, Math.min(1, l)) : 0;
  }
  const boosts = (lvl) => ({ occupancy: 0.2 * lvl, gate: 1 + 0.5 * lvl, merch: 0.9 * lvl, sponsor: 1 + 0.6 * lvl });

  const PRESS = {
    league: [
      (n) => `${n} está de volta à Champions League e a imprensa europeia já fala do sorteio.`,
      (n) => `Noites europeias no estádio: ${n} estreia na fase de liga da Champions com a expectativa em alta.`
    ],
    playoffs: [
      (n) => `${n} garante vaga nos playoffs da Champions e a mídia destaca a sequência do time.`,
      (n) => `Sobrevivência europeia: ${n} segue vivo na Champions e ganha espaço nos programas esportivos.`
    ],
    round16: [
      (n) => `${n} está entre os 16 melhores da Europa. Colunistas já falam em "temporada histórica".`,
      (n) => `Oitavas de final! ${n} vira assunto no continente e a procura por camisas dispara.`
    ],
    quarters: [
      (n) => `${n} nas quartas de final da Champions: manchetes na Europa e estádio esgotado nos próximos jogos.`,
      (n) => `Entre os oito melhores: ${n} atrai patrocinadores e todos os olhares do mundo da bola.`
    ],
    semis: [
      (n) => `${n} está na semifinal da Champions League. A torcida lota as ruas e a marca vive o melhor momento.`,
      (n) => `Semifinalista! A imprensa mundial acompanha cada passo de ${n}.`
    ],
    final: [
      (n) => `${n} na FINAL da Champions League. É o ápice da exposição da marca: todos falam do clube.`,
      (n) => `Final europeia! ${n} vive a maior semana da sua história recente, com transmissão para o mundo todo.`
    ],
    champion: [
      (n) => `${n} É CAMPEÃO DA CHAMPIONS LEAGUE! Festa, capas de jornais no mundo todo e uma marca em seu auge.`,
      (n) => `Campeão da Europa! ${n} entra para a história e a loja do clube não dá conta dos pedidos.`
    ],
    out: [
      (n, st) => `${n} se despede da Champions nas ${LABEL[st] || "fases finais"}. A imprensa elogia a campanha e a exposição segue alta por algumas semanas.`,
      (n, st) => `Fim da linha na Champions: ${n} cai em ${LABEL[st] || "fase final"}, mas deixa a Europa com a marca fortalecida.`
    ]
  };
  const pct = (v) => Math.round(v * 100) + "%";

  function announce(s, club, stage, kind) {
    const name = club?.name || "O clube";
    const list = PRESS[kind] || PRESS[stage];
    const text = list[hash(s.season + "|" + stage + "|" + kind) % list.length](name, stage);
    const lvl = level(s, club), b = boosts(Math.max(lvl, TARGET[stage] || 0));
    const subject = kind === "out" ? `Champions: campanha termina (${LABEL[stage]})` : stage === "champion" ? "Champions: CAMPEÃO DA EUROPA" : `Champions: ${LABEL[stage]}`;
    const effects = kind === "out"
      ? "A exposição da marca desce aos poucos nas próximas semanas."
      : `Efeito no clube: bilheteria +${Math.round((b.gate - 1) * 100)}%, loja +${Math.round(b.merch * 100)}%, patrocínios +${Math.round((b.sponsor - 1) * 100)}% e moral do elenco em alta.`;
    try { Career?.addArticle?.(s, { category: "MUNDO", title: subject, body: text, eventId: `hype:${s.season}:${stage}:${kind}` }); } catch (_) {}
    try { Career?.addMessage?.(s, { category: "CARREIRA", sender: "Imprensa", subject, body: `${text}\n\n${effects}`, eventId: `hype:${s.season}:${stage}:${kind}:msg` }); } catch (_) {}
    if (kind !== "out" && ORDER.indexOf(stage) >= 2) {
      try { Career?.addMessage?.(s, { category: "CARREIRA", sender: "Comercial", subject: "Patrocinadores comemoram a campanha", body: `Com o clube em ${LABEL[stage]} da Champions, parceiros comerciais reforçam a presença da marca. Nas próximas receitas mensais, patrocínios e loja já refletem o novo momento.`, eventId: `hype:${s.season}:${stage}:spons` }); } catch (_) {}
    }
  }

  function lift(s, club, stage) {
    const bump = MORALE[stage] || 0;
    if (!bump || !club) return;
    for (const p of club.roster || []) { if (p?.status === "retired") continue; p.morale = Math.min(100, (Number(p.morale) || 60) + bump); }
  }

  function daily(s) {
    if (!s || !s.clubId || (s.mode !== "coach" && s.mode !== "player")) return null;
    const h = state(s), club = clubOf(s);
    const pos = position(s);
    let target = 0, decay = 0.02;
    if (pos) {
      if (h.season !== pos.season) { h.season = pos.season; h.stage = null; h.hold = 0; }
      if (pos.alive) target = TARGET[pos.stage] || 0;
      if (pos.stage === "champion") { target = 1; h.hold = h.hold || s.day + 30; if (s.day > h.hold) target = 0; decay = 0.01; }
      const prev = h.stage;
      if (pos.alive && pos.stage !== prev && ORDER.indexOf(pos.stage) > ORDER.indexOf(prev || "x")) {
        h.stage = pos.stage;
        if (!h.announced[pos.season + ":" + pos.stage]) {
          h.announced[pos.season + ":" + pos.stage] = 1;
          announce(s, club, pos.stage, "up"); lift(s, club, pos.stage);
        }
      }
      if (pos.eliminated && !h.announced[pos.season + ":out"]) {
        h.announced[pos.season + ":out"] = 1;
        announce(s, club, pos.stage, "out");
      }
      h.alive = !!pos.alive;
    } else { h.alive = false; }
    const diff = target - (h.level || 0);
    h.level = Math.max(0, Math.min(1, (h.level || 0) + (diff > 0 ? Math.min(diff, 0.04) : Math.max(diff, -decay))));
    if (h.level < 0.005) h.level = 0;
    // moral do elenco acompanha a exposição (só sobe, devagar)
    if (club && h.level >= 0.2 && s.day % 3 === 0) {
      const floor = 55 + h.level * 35;
      for (const p of club.roster || []) if (p?.status !== "retired" && (Number(p.morale) || 60) < floor) p.morale = Math.min(100, (Number(p.morale) || 60) + 1);
    }
    const keys = Object.keys(h.announced); if (keys.length > 60) for (const k of keys.slice(0, keys.length - 60)) delete h.announced[k];
    return h;
  }

  function view(s) {
    const h = s.extras?.clubHype, l = Number(h?.level) || 0;
    const stage = h?.stage;
    const tag = l >= 0.85 ? "Auge da marca" : l >= 0.55 ? "Em alta" : l >= 0.25 ? "Em evidência" : l > 0 ? "Chamando atenção" : "Discreto";
    return { level: l, percent: pct(l), tag, stage: stage ? LABEL[stage] : null, alive: !!h?.alive };
  }

  const api = { VERSION, TARGET, LABEL, position, level, boosts, daily, view, state };
  root.ProLifeClubHype = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
