(function (root) {
  "use strict";
  // PRO LIFE — Habilidades do treinador. Pontos ganhos com jogos, temporadas e títulos (sem moeda).
  // Estado em s.coachCareer.skills = { version, unlocked:[ids] }. Sem nada desbloqueado, não muda nenhuma regra.
  const VERSION = 1;
  const NODES = Object.freeze([
    { id: "prep_fisico", branch: "treino", label: "Preparação física", cost: 1, requires: null, text: "+1 de recuperação de condição por semana", fx: { recovery: 1 } },
    { id: "metodo", branch: "treino", label: "Método de treino", cost: 2, requires: "prep_fisico", text: "+10% de chance de evolução no treino", fx: { growth: 0.1 } },
    { id: "base", branch: "treino", label: "Trabalho com a base", cost: 2, requires: "metodo", text: "+1,5 ponto percentual de evolução até 21 anos", fx: { youth: 0.015 } },
    { id: "lider", branch: "vestiario", label: "Liderança", cost: 1, requires: null, text: "+0,3 de moral por semana", fx: { morale: 0.3 } },
    { id: "conversa", branch: "vestiario", label: "Conversa individual", cost: 2, requires: "lider", text: "+0,3 de moral por semana", fx: { morale: 0.3 } },
    { id: "clima", branch: "vestiario", label: "Clima de grupo", cost: 3, requires: "conversa", text: "+0,4 de moral e +0,5 de recuperação por semana", fx: { morale: 0.4, recovery: 0.5 } },
    { id: "leitura", branch: "tatico", label: "Leitura de jogo", cost: 1, requires: null, text: "+5% de chance de evolução no treino", fx: { growth: 0.05 } },
    { id: "video", branch: "tatico", label: "Análise de vídeo", cost: 2, requires: "leitura", text: "+5% de evolução e +0,2 de moral por semana", fx: { growth: 0.05, morale: 0.2 } },
    { id: "mestre", branch: "tatico", label: "Mestre tático", cost: 3, requires: "video", text: "+10% de evolução no treino", fx: { growth: 0.1 } }
  ]);
  const BRANCHES = Object.freeze({ treino: "Treino", vestiario: "Vestiário", tatico: "Tático" });
  const byId = Object.fromEntries(NODES.map((n) => [n.id, n]));

  function unlocked(s) {
    const k = s?.coachCareer?.skills;
    return s?.mode === "coach" && k?.version === VERSION && Array.isArray(k.unlocked) ? k.unlocked.filter((id) => byId[id]) : [];
  }
  function earned(s) {
    const c = s?.coachCareer;
    if (s?.mode !== "coach") return 0;
    let games = 0, seasons = 0, titles = 0;
    for (const st of c?.stints || []) { titles += Number(st.titles) || 0; for (const r of st.rows || []) { games += (Number(r.w) || 0) + (Number(r.d) || 0) + (Number(r.l) || 0); seasons++; } }
    return Math.floor(games / 10) + seasons + titles * 2 + 1;
  }
  const spent = (s) => unlocked(s).reduce((a, id) => a + byId[id].cost, 0);
  const available = (s) => Math.max(0, earned(s) - spent(s));
  function effects(s) {
    const e = { growth: 0, recovery: 0, morale: 0, youth: 0 };
    for (const id of unlocked(s)) for (const [k, v] of Object.entries(byId[id].fx)) e[k] += v;
    return e;
  }
  function unlock(s, id) {
    if (s?.mode !== "coach") throw Error("Disponível para treinadores.");
    const n = byId[id];
    if (!n) throw Error("Habilidade inválida.");
    const c = s.coachCareer;
    if (!c) throw Error("Carreira de treinador indisponível.");
    if (unlocked(s).includes(id)) throw Error("Habilidade já desbloqueada.");
    if (n.requires && !unlocked(s).includes(n.requires)) throw Error("Desbloqueie antes: " + byId[n.requires].label + ".");
    if (available(s) < n.cost) throw Error("Pontos de treinador insuficientes.");
    const k = c.skills && c.skills.version === VERSION ? c.skills : (c.skills = { version: VERSION, unlocked: [] });
    k.unlocked.push(id);
    return n;
  }
  const api = { VERSION, NODES, BRANCHES, unlocked, earned, spent, available, effects, unlock };
  root.ProLifeCoachSkills = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
