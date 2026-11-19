(function (root) {
  "use strict";
  // Estatísticas individuais de TODOS os jogos de seleções (Copa, eliminatórias, Liga das Nações, copas continentais...).
  // O motor das seleções só decide placares; aqui cada jogo já disputado ganha autores de gols, assistências, minutos,
  // cartões e nota para os atletas das duas seleções. Tudo vai para o acumulador anual "nat" do WorldStats, que alimenta
  // rankings, prêmios individuais e a Bola de Ouro. O jogo da seleção que o treinador comanda segue o fluxo próprio
  // (coach-national.js); aqui só entra o adversário dele.
  const VERSION = 1, MAX_PER_DAY = 160;
  const hash = (v) => { let h = 2166136261; for (const ch of String(v)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return h >>> 0; };
  const unit = (key) => hash(key) / 4294967296;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NI = () => root.ProLifeNationalIdentity || (typeof require === "function" ? require("./national-identity.js") : null);
  const GF = () => root.ProLifeGlobalFootball || (typeof require === "function" ? require("./global-football.js") : null);
  const WS = () => root.ProLifeWorldStats || (typeof require === "function" ? require("./world-stats.js") : null);
  const EC = () => root.ProLifeEuropeanCalendar || (typeof require === "function" ? require("./european-calendar.js") : null);
  const POS_SCORE = { GOL: 0, DEF: 0.6, MEI: 2.2, ATA: 5 }, POS_ASSIST = { GOL: 0, DEF: 1.2, MEI: 4, ATA: 3 };
  const ovrOf = (p) => Number(p.ovr ?? p.overall) || 50;
  const isSynthetic = (p) => /^intlgen_/.test(String(p.id)) || p.generatedInternational === true;
  const POS4 = ["GOL", "DEF", "MEI", "ATA"];

  // Cartões determinísticos (também usados pelo jogo da seleção do treinador).
  function cardsFor(key, id, pos) {
    const y = unit(`${key}|y|${id}`) < (pos === "DEF" ? 0.14 : pos === "GOL" ? 0.04 : 0.1) ? 1 : 0;
    const r = unit(`${key}|r|${id}`) < 0.008 ? 1 : 0;
    return { yc: y, rc: r };
  }

  function squadOf(s, D, code, cache) {
    if (cache.has(code)) return cache.get(code);
    let out = null;
    try {
      const team = NI().resolve(code, s, D);
      if (team && team.represented && team.name) {
        const list = GF().playersByNationality(s, team.name)
          .filter((p) => p && p.id && p.status !== "retired" && p.active !== false && Number(p.age || 0) <= 45 && !isSynthetic(p) && POS4.includes(p.pos) && !(Number(p.injury || 0) > 0))
          .sort((a, b) => ovrOf(b) - ovrOf(a) || String(a.id).localeCompare(String(b.id)));
        const used = new Set(), xi = [];
        for (const [pos, n] of [["GOL", 1], ["DEF", 4], ["MEI", 3], ["ATA", 3]]) {
          for (const p of list.filter((x) => x.pos === pos).slice(0, n)) { xi.push(p); used.add(p.id); }
        }
        for (const p of list) { if (xi.length >= 11) break; if (!used.has(p.id) && p.pos !== "GOL") { xi.push(p); used.add(p.id); } }
        const subs = list.filter((p) => !used.has(p.id) && p.pos !== "GOL").slice(0, 3);
        if (xi.length === 11) out = { xi, subs };
      }
    } catch (e) { out = null; }
    cache.set(code, out);
    return out;
  }

  // Distribui gols e assistências do placar de um lado entre os atletas, e gera minutos, cartões e notas.
  function detail(sq, gf, ga, key) {
    const goals = new Map(), assists = new Map();
    const pool = sq.xi.map((p) => ({ p, w: 1 })).concat(sq.subs.map((p) => ({ p, w: 0.35 })));
    const pick = (weightFn, tag, skip) => {
      const items = pool.filter((x) => x.p.id !== skip).map((x) => ({ p: x.p, w: weightFn(x.p) * x.w })).filter((x) => x.w > 0);
      const total = items.reduce((n, x) => n + x.w, 0);
      if (!(total > 0)) return null;
      let r = unit(`${key}|${tag}`) * total;
      for (const x of items) { r -= x.w; if (r <= 0) return x.p; }
      return items[items.length - 1].p;
    };
    for (let i = 0; i < gf; i++) {
      const sc = pick((p) => POS_SCORE[p.pos] * Math.pow(ovrOf(p) / 70, 3), `g${i}`, null);
      if (!sc) continue;
      goals.set(sc.id, (goals.get(sc.id) || 0) + 1);
      if (unit(`${key}|a?${i}`) < 0.65) {
        const as = pick((p) => POS_ASSIST[p.pos] * Math.pow(ovrOf(p) / 70, 2), `a${i}`, sc.id);
        if (as) assists.set(as.id, (assists.get(as.id) || 0) + 1);
      }
    }
    const result = gf > ga ? "V" : gf < ga ? "D" : "E", out = [];
    const all = sq.xi.map((p) => ({ p, min: 90 })).concat(sq.subs.map((p, i) => ({ p, min: 15 + Math.floor(unit(`${key}|m|${p.id}`) * 20) + i })));
    for (const { p, min } of all) {
      const g = goals.get(p.id) || 0, a = assists.get(p.id) || 0, c = cardsFor(key, p.id, p.pos);
      if (!min && !g && !a) continue;
      out.push({ id: p.id, pos: p.pos, goals: g, assists: a, min, yc: c.yc, rc: c.rc, cs: ga === 0 && min >= 60, result });
    }
    return out;
  }

  const inYear = (day, season) => {
    const cal = EC();
    if (!cal || !Number.isFinite(Number(day))) return null;
    return Number(day) >= cal.dateDay(`${season}-01-01`) && Number(day) < cal.dateDay(`${Number(season) + 1}-01-01`);
  };

  // Varre torneios e eliminatórias do ano e devolve os jogos disputados ainda não contabilizados.
  const hkey = (k) => hash(k).toString(36);
  function collect(s, seen) {
    const nt = s.nationalTeam;
    if (!nt) return [];
    const out = [];
    const looks = (o) => o && o.played === true && o.homeId && o.awayId && Number.isFinite(Number(o.hg)) && Number.isFinite(Number(o.ag));
    const walk = (o, ctx, depth) => {
      if (!o || typeof o !== "object" || depth > 6 || out.length >= MAX_PER_DAY) return;
      if (Array.isArray(o)) { for (const x of o) { if (looks(x)) push(x, ctx); else walk(x, ctx, depth + 1); } return; }
      for (const k of Object.keys(o)) { if (k === "history" || k === "participants") continue; walk(o[k], ctx, depth + 1); }
    };
    const push = (m, ctx) => {
      const key = `${s.season}|${ctx}|${m.id ?? `${m.day}:${m.homeId}:${m.awayId}`}`;
      if (seen[hkey(key)]) return;
      if (m.day != null && inYear(m.day, s.season) === false) return;
      out.push({ key, m });
    };
    for (const t of nt.tournaments || []) {
      if (!t || Number(t.year) !== Number(s.season)) continue;
      walk(t, String(t.type || "T"), 0);
    }
    const q = nt.qualifiers;
    if (q) walk(q, "Q", 0);
    return out.slice(0, MAX_PER_DAY);
  }

  function daily(s, D) {
    if (!s || !s.nationalTeam) return 0;
    const ws = WS();
    if (!ws || !ws.recordNational) return 0;
    const L = ws.init(s)?.leagues?.nat;
    const todo = collect(s, (L && L.seen) || {});
    if (!todo.length) return 0;
    const own = s.mode === "coach" && s.coachNational && s.coachNational.teamId ? String(s.coachNational.teamId) : null;
    const cache = new Map();
    let n = 0;
    for (const { key, m } of todo) {
      const entries = [];
      for (const [code, gf, ga] of [[m.homeId, Number(m.hg), Number(m.ag)], [m.awayId, Number(m.ag), Number(m.hg)]]) {
        if (own && String(code) === own) continue;   // o time do treinador já tem o fluxo detalhado
        const sq = squadOf(s, D, code, cache);
        if (!sq) continue;
        entries.push(...detail(sq, gf, ga, `${key}|${code}`));
      }
      if (entries.length && ws.recordNational(s, "nat", hkey(key), entries, null)) n++;
      else if (!entries.length) { const W = ws.init(s); if (W) { const NL = W.leagues.nat || (W.leagues.nat = { ids: [], v: [], n: 0, r: -1, seen: {} }); (NL.seen || (NL.seen = {}))[hkey(key)] = 1; } }
    }
    return n;
  }

  const api = { VERSION, daily, cardsFor, detail, collect };
  root.ProLifeNationalStats = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
