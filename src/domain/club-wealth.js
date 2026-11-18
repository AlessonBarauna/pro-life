(function (root) {
  "use strict";
  // PRO LIFE — riqueza dos clubes.
  // 1) Gigantes (alta reputação) nunca ficam sem caixa para fechar compras: o orçamento tem um piso.
  // 2) A cada temporada um xeque milionário compra um clube pequeno, reforça o elenco e o leva a brigar por títulos.
  const GF = root.ProLifeGlobalFootball || (typeof require === "function" ? require("./global-football.js") : null);
  const Career = root.ProLifeCareer || (typeof require === "function" ? require("./career.js") : null);
  const VERSION = 1;
  const SHEIKH_FUND = 100e9;
  const SHEIKH_FLOOR = 5e9;
  // [reputação mínima, piso de orçamento]
  const FLOORS = [[84, 6e9], [80, 4e9], [76, 2.5e9], [72, 1.2e9]];
  const OWNERS = ["Xeque Khalid Al-Mansouri", "Xeque Hamdan bin Rashid", "Xeque Tariq Al-Nasser", "Xeque Faisal bin Saud", "Xeque Mansour Al-Qasimi", "Xeque Zayed Al-Rumaihi", "Xeque Omar Al-Thani Jr.", "Xeque Rashid Al-Maktabi"];
  const MIN_BY_POS = { GOL: 2, DEF: 5, MEI: 5, ATA: 3 };
  const BUY_BY_POS = { GOL: 2, DEF: 5, MEI: 5, ATA: 4 };
  const MAX_SQUAD = 36;

  function hash(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rngFrom(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function allClubs(s) {
    const seen = new Set(), out = [];
    for (const c of [...(s.globalFootball?.clubs || []), ...(s.clubs || [])]) { if (c?.id && !seen.has(c.id)) { seen.add(c.id); out.push(c); } }
    return out;
  }
  function realClubs(s, id) {
    return [...(s.globalFootball?.clubs || []), ...(s.clubs || [])].filter((c) => c?.id === id);
  }
  function floorFor(club) {
    let floor = 0;
    if (club?.sheikh) floor = SHEIKH_FLOOR;
    const rep = Number(club?.reputation);
    if (Number.isFinite(rep)) for (const [min, value] of FLOORS) if (rep >= min) { floor = Math.max(floor, value); break; }
    return floor;
  }
  // Garante caixa para um clube rico: sobe até o piso ou até cobrir a compra (com folga).
  function ensureFunds(s, club, need) {
    if (!club) return 0;
    const floor = floorFor(club);
    if (!floor) return Number(club.budget) || 0;
    const target = Math.max(floor, Math.ceil((Number(need) || 0) * 1.1));
    const apply = (c) => { if (!Number.isFinite(Number(c.budget)) || Number(c.budget) < target) c.budget = target; };
    apply(club);
    for (const c of realClubs(s, club.id)) apply(c);
    return Number(club.budget) || 0;
  }
  function topUp(s) {
    let n = 0;
    for (const club of allClubs(s)) {
      if (club.active === false) continue;
      const floor = floorFor(club);
      if (floor && (!Number.isFinite(Number(club.budget)) || Number(club.budget) < floor)) { club.budget = floor; for (const c of realClubs(s, club.id)) c.budget = floor; n++; }
    }
    return n;
  }

  function state(s) {
    s.extras = s.extras || {};
    const w = s.extras.clubWealth || (s.extras.clubWealth = { version: VERSION, lastSeason: null, history: [] });
    if (!Array.isArray(w.history)) w.history = [];
    return w;
  }
  function valueOf(s, player, club) {
    const PE = root.ProLifePlayerEconomy;
    try { const v = PE?.estimateMarketValue?.(player, club); if (Number.isFinite(Number(v)) && v > 0) return Math.round(v); } catch (_) {}
    const ovr = Number(player.ovr ?? player.overall ?? 60);
    return Math.round(Math.max(1e6, Math.pow(Math.max(8, ovr - 38), 2) * 1.2e6));
  }
  const posOf = (p) => p.pos === "GOL" || p.pos === "GK" ? "GOL" : ["DEF", "ZAG", "LD", "LE"].includes(p.pos) ? "DEF" : ["MEI", "VOL", "MC", "MD", "ME"].includes(p.pos) ? "MEI" : ["ATA", "PE", "PD", "CA"].includes(p.pos) ? "ATA" : null;
  const ovrOf = (p) => Number(p.ovr ?? p.overall ?? 0);

  function pickClub(s, rng, protectedId) {
    const used = new Set((state(s).history || []).map((h) => h.clubId));
    const gfIds = new Set((s.globalFootball?.clubs || []).map((c) => c.id));
    const pool = allClubs(s).filter((c) => gfIds.has(c.id) && c.active !== false && c.generated !== true && !c.sheikh && c.id !== protectedId && !used.has(c.id) && Number(c.division || 1) === 1 && Number(c.reputation) >= 42 && Number(c.reputation) <= 66);
    if (!pool.length) return null;
    pool.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return pool[Math.floor(rng() * pool.length)];
  }

  function takeover(s, opts) {
    const w = state(s), o = opts || {};
    const protectedId = s.clubId || null;
    const rng = rngFrom(hash(["sheikh", s.season, s.clubId || "", w.history.length].join("|")));
    const club = o.club || pickClub(s, rng, protectedId);
    if (!club) { w.lastSeason = s.season; return null; }
    const owner = OWNERS[Math.floor(rng() * OWNERS.length)];
    club.sheikh = { owner, season: s.season };
    club.budget = (Number.isFinite(Number(club.budget)) ? Number(club.budget) : 0) + SHEIKH_FUND;
    club.reputation = Math.min(82, Math.max(Number(club.reputation) || 50, 50) + 10);
    club.structure = Math.min(100, (Number(club.structure) || 50) + 3);
    for (const c of realClubs(s, club.id)) { c.sheikh = club.sheikh; c.budget = club.budget; c.reputation = club.reputation; c.structure = club.structure; }

    // Reformulação: contrata os melhores jogadores disponíveis em cada setor, pagando o valor de mercado.
    const players = (GF?.activePlayers?.(s) || []).filter((p) => p?.id && p.id !== "hero" && p.clubId && !p.academy && p.clubId !== protectedId && p.clubId !== club.id && posOf(p));
    const counts = new Map(), squad = new Map();
    for (const p of players) { const k = p.clubId + "|" + posOf(p); counts.set(k, (counts.get(k) || 0) + 1); }
    for (const p of GF?.activePlayers?.(s) || []) if (p.clubId && !p.academy) squad.set(p.clubId, (squad.get(p.clubId) || 0) + 1);
    players.sort((a, b) => ovrOf(b) - ovrOf(a) || String(a.id).localeCompare(String(b.id)));
    const signed = [], perClub = new Map(), bought = { GOL: 0, DEF: 0, MEI: 0, ATA: 0 };
    let spent = 0;
    for (const p of players) {
      const pos = posOf(p);
      if (bought[pos] >= BUY_BY_POS[pos]) continue;
      if (ovrOf(p) < 74) continue;
      if ((counts.get(p.clubId + "|" + pos) || 0) <= MIN_BY_POS[pos]) continue;
      if ((perClub.get(p.clubId) || 0) >= 2) continue;
      const seller = realClubs(s, p.clubId)[0] || GF?.clubById?.(s, p.clubId);
      const fee = valueOf(s, p, club);
      if (club.budget < fee) continue;
      if (!GF?.transferPlayer?.(s, p.id, club.id)) continue;
      club.budget -= fee; spent += fee;
      for (const c of realClubs(s, club.id)) c.budget = club.budget;
      if (seller && Number.isFinite(Number(seller.budget))) { const nb = Number(seller.budget) + fee; seller.budget = nb; for (const c of realClubs(s, seller.id)) c.budget = nb; }
      counts.set(p.clubId + "|" + pos, counts.get(p.clubId + "|" + pos) - 1);
      perClub.set(p.clubId, (perClub.get(p.clubId) || 0) + 1);
      squad.set(p.clubId, (squad.get(p.clubId) || 1) - 1);
      squad.set(club.id, (squad.get(club.id) || 0) + 1);
      bought[pos]++; signed.push({ id: p.id, name: p.name, ovr: ovrOf(p), pos: p.pos, from: seller?.name || "", fee });
    }
    // Elenco no limite: os mais fracos seguem para clubes com vaga.
    let size = squad.get(club.id) || 0;
    if (size > MAX_SQUAD) {
      const mine = (GF?.activePlayers?.(s) || []).filter((p) => p.clubId === club.id && !p.academy && p.id !== "hero" && !signed.some((x) => x.id === p.id)).sort((a, b) => ovrOf(a) - ovrOf(b) || String(a.id).localeCompare(String(b.id)));
      const gfSet = new Set((s.globalFootball?.clubs || []).map((c) => c.id));
      const homes = allClubs(s).slice().sort((a, b) => String(a.id).localeCompare(String(b.id))).filter((c) => gfSet.has(c.id) && c.active !== false && c.generated !== true && c.id !== club.id && c.id !== protectedId && (squad.get(c.id) || 0) < MAX_SQUAD - 1 && Number(c.reputation) <= Number(club.reputation));
      for (const p of mine) {
        if (size <= MAX_SQUAD) break;
        const home = homes[Math.floor(rng() * homes.length)];
        if (!home) break;
        if (GF.transferPlayer(s, p.id, home.id)) { size--; squad.set(home.id, (squad.get(home.id) || 0) + 1); }
      }
    }
    w.lastSeason = s.season;
    w.history.unshift({ season: s.season, clubId: club.id, clubName: club.name, owner, signed: signed.length, spent: Math.round(spent) });
    w.history = w.history.slice(0, 30);
    announce(s, club, owner, signed, spent);
    return { club, owner, signed, spent };
  }

  const brl = (v) => "R$ " + (v >= 1e9 ? (v / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " bi" : Math.round(v / 1e6).toLocaleString("pt-BR") + " mi");
  function announce(s, club, owner, signed, spent) {
    const stars = signed.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 5).map((x) => x.name + " (" + x.ovr + ")").join(", ");
    const title = owner + " compra o " + club.name;
    const body = "Investimento de " + brl(SHEIKH_FUND) + " para montar uma potência. " + signed.length + " contratações por " + brl(spent) + (stars ? ", entre elas " + stars : "") + ". O clube agora quer brigar por títulos.";
    try { Career?.post?.(s, "Mercado", "Mercado mundial", title, body); } catch (_) {}
    try { Career?.addMessage?.(s, { category: "CARREIRA", sender: "Imprensa", subject: title, body, eventId: "sheikh_" + s.season }); } catch (_) {}
    try { s.news = s.news || []; s.news.unshift({ day: s.day, season: s.season, title, body }); s.news = s.news.slice(0, 160); } catch (_) {}
  }

  // Chamado pelo dia a dia: reabastece os gigantes e, uma vez por temporada, dispara o xeque.
  function daily(s) {
    if (!s || (s.day % 7) !== 0) return null;
    topUp(s);
    const w = state(s);
    if (w.lastSeason === s.season) return null;
    return takeover(s);
  }

  const api = { VERSION, SHEIKH_FUND, floorFor, ensureFunds, topUp, takeover, daily, state };
  root.ProLifeClubWealth = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
