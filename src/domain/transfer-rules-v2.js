(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ProLifeTransferRulesV2 = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  // Regras puras do Mercado v2: nada aqui muda o estado do jogo.
  const SHORTLIST_LIMIT = 50;
  const ATTRS = [["pace", "Velocidade"], ["finish", "Finalização"], ["pass", "Passe"], ["defense", "Defesa"], ["strength", "Força"], ["stamina", "Resistência"]];
  const ROLES = { pace: "Velocista", finish: "Finalizador", pass: "Armador", defense: "Marcador", strength: "Pivô forte", stamina: "Motorzinho" };
  const POSITIONS = ["GOL", "ZAG", "LE", "LD", "VOL", "MC", "MEI", "PE", "PD", "SA", "ATA"];

  function hash(str) { let h = 2166136261; const t = String(str); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0); }
  const ovrOf = (p) => Number(p && (p.ovr ?? p.overall)) || 0;

  // Fim de contrato: usa o dado do jogador; para os de clubes de IA, deriva de forma estável pelo id.
  function contractEndOf(p, s) {
    const own = Number(p && (p.contractEnd ?? p.contractUntil));
    if (Number.isFinite(own) && own > 1900) return own;
    return Number(s && s.season || 2026) + (hash((p && p.id) + "c") % 5);
  }
  function monthsLeft(p, s) {
    // Contrato vence em 30/jun do ano de fim; a temporada começa em jan (dia 0).
    const day = Number(s && s.day) || 0, yearsGone = Math.floor(day / 365), dayInYear = day % 365;
    const end = contractEndOf(p, s) - Number(s && s.season || 2026) - yearsGone;
    return Math.max(0, Math.round(end * 12 + (6 - dayInYear / 30.4)));
  }
  // Situação para transferência/empréstimo dos jogadores de clubes de IA (estável por temporada).
  function aiListing(p, s) {
    if (!p) return "none";
    if (!p.clubId) return "free";
    const h = hash(p.id + ":" + (s && s.season || 0)) % 100;
    return h < 11 ? "sale" : h < 17 ? "loan" : "none";
  }
  const LISTING_LABEL = { free: "Agente livre", sale: "À venda", loan: "Para empréstimo", none: "" };
  function roleOf(p) {
    if (!p || !p.attrs) return "";
    if (p.pos === "GOL") return "Goleiro";
    let best = null;
    for (const [k] of ATTRS) { const v = Number(p.attrs[k]) || 0; if (!best || v > best[1]) best = [k, v]; }
    return best ? ROLES[best[0]] : "";
  }
  function interestedCount(p, s) {
    const deals = (s && s.worldLiveMarket && s.worldLiveMarket.deals) || [];
    const real = deals.filter((d) => d.playerId === p.id && d.state !== "cancelled").length;
    return real + (ovrOf(p) >= 78 ? hash(p.id + "i") % 4 : 0);
  }
  function positionMatches(p, pos) {
    if (!pos) return true;
    return p.primaryPosition === pos || (p.secondaryPositions || []).includes(pos);
  }
  // Alertas da lista preferencial.
  function shortlistAlerts(entry, p, s, valueNow) {
    const out = [];
    if (!p) return out;
    if (!p.clubId) out.push({ k: "free", text: "Ficou livre no mercado" });
    else if (monthsLeft(p, s) < 6) out.push({ k: "contract", text: "Contrato acaba em menos de 6 meses" });
    const base = Number(entry && entry.valueAtAdd);
    if (base > 0 && valueNow > 0 && valueNow <= base * 0.8) out.push({ k: "drop", text: "Valor caiu mais de 20%" });
    return out;
  }
  function advancedFilter(players, f, s, valueOf, clubOf) {
    const n = (v) => Number(v) || 0;
    return players.filter((p) => {
      if (!positionMatches(p, f.pos)) return false;
      if (f.role && roleOf(p) !== f.role) return false;
      const age = n(p.age);
      if (f.ageMin && age < n(f.ageMin)) return false;
      if (f.ageMax && age > n(f.ageMax)) return false;
      const chosen = (f.attrs || []).slice(0, 5);
      for (const k of chosen) if ((Number(p.attrs && p.attrs[k]) || 0) < 75) return false;
      if (f.valueMax && valueOf(p) > n(f.valueMax) * 1e6) return false;
      if (f.valueMin && valueOf(p) < n(f.valueMin) * 1e6) return false;
      if (f.contract) { const m = monthsLeft(p, s); if (f.contract === "6" && !(m < 6)) return false; if (f.contract === "12" && !(m < 12)) return false; if (f.contract === "24" && !(m < 24)) return false; }
      if (f.listing) { const l = aiListing(p, s); if (f.listing === "any" ? l === "none" : l !== f.listing) return false; }
      const club = clubOf(p);
      if (f.country && ((club && club.country) || "") !== f.country) return false;
      if (f.league && ((club && club.leagueId) || p.leagueId) !== f.league) return false;
      if (f.nat && p.nationality !== f.nat) return false;
      if (f.interest && interestedCount(p, s) < n(f.interest)) return false;
      return true;
    });
  }

  // ---- Etapa 2: proposta de compra e empréstimo ----
  const KEY_PLAYERS = 14; // titulares e reservas imediatas do clube vendedor
  const KEY_MULTIPLIER = 1.35;
  const GLOVES_MONTHS = 6;
  const LOAN_MONTHS = [6, 12, 18];
  const rnd = (v) => Math.ceil(Number(v) / 1000) * 1000;
  function isKeyPlayer(p, roster) {
    const list = (roster || []).slice().sort((a, b) => ovrOf(b) - ovrOf(a)).slice(0, KEY_PLAYERS);
    return list.some((x) => x.id === (p && p.id));
  }
  // Pedido mínimo do clube já na 1ª proposta: titular/chave exige 135% do valor; os demais, o piso normal de 95%.
  function minimumOffer(value, key) { return rnd(Number(value) * (key ? KEY_MULTIPLIER : 0.95)); }
  // Luvas: 6 meses de salário pagos ao jogador na assinatura (sem comissão de agente). Rival histórico paga o dobro.
  function gloves(monthlySalary, rival) { return rnd(Number(monthlySalary || 0) * GLOVES_MONTHS * (rival ? 2 : 1)); }
  function loanTerms(value, months) {
    const m = LOAN_MONTHS.includes(Number(months)) ? Number(months) : 6;
    const days = { 6: 180, 12: 365, 18: 545 }[m];
    return { months: m, days, fee: rnd(Number(value) * 0.08 * (days / 180)), buyOption: rnd(Number(value) * 1.15), salaryShare: 100 };
  }
  // Jogador-chave só sai por empréstimo se o clube o colocou na lista.
  function canLoanOut(p, roster, s) { return !isKeyPlayer(p, roster) || aiListing(p, s) === "loan"; }
  return { KEY_MULTIPLIER, GLOVES_MONTHS, LOAN_MONTHS, isKeyPlayer, minimumOffer, gloves, loanTerms, canLoanOut, SHORTLIST_LIMIT, ATTRS, ROLES, POSITIONS, LISTING_LABEL, hash, contractEndOf, monthsLeft, aiListing, roleOf, interestedCount, positionMatches, shortlistAlerts, advancedFilter };
});
