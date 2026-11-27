(function (root) {
  "use strict";
  // PRO LIFE — Registros: Estatísticas · Registos · Troféus · Galeria de honra.
  // Tudo é derivado do que já existe no save (partidas, histórico de campeões, passagens do treinador).
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

  function compute() {
    const ctx = root.ProLifeSM27Ctx?.();
    if (!ctx?.s) return null;
    const { s, D } = ctx, id = s.clubId;
    const nameOf = (cid) => { try { return D.club(s, cid)?.name || String(cid); } catch (e) { return String(cid); } };
    const mine = (s.matches || []).filter((m) => id && (m.home === id || m.away === id) && Number.isFinite(Number(m.hg)) && Number.isFinite(Number(m.ag)));
    const res = mine.map((m) => {
      const home = m.home === id, gf = home ? num(m.hg) : num(m.ag), ga = home ? num(m.ag) : num(m.hg);
      return { gf, ga, opp: nameOf(home ? m.away : m.home), home, season: m.season };
    });
    const w = res.filter((r) => r.gf > r.ga).length, l = res.filter((r) => r.gf < r.ga).length, d = res.length - w - l;
    const gf = res.reduce((a, r) => a + r.gf, 0), ga = res.reduce((a, r) => a + r.ga, 0);
    const best = res.filter((r) => r.gf > r.ga).sort((a, b) => (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)[0] || null;
    const worst = res.filter((r) => r.gf < r.ga).sort((a, b) => (b.ga - b.gf) - (a.ga - a.gf))[0] || null;
    const mostGoals = [...res].sort((a, b) => (b.gf + b.ga) - (a.gf + a.ga))[0] || null;
    const coachC = s.mode === "coach" ? s.coachCareer : null;
    const stints = coachC?.stints || [];
    const rows = stints.flatMap((st) => (st.rows || []).map((r) => ({ ...r, club: st.club })));
    const bestSeason = [...rows].filter((r) => num(r.pos) > 0).sort((a, b) => num(a.pos) - num(b.pos) || num(b.points) - num(a.points))[0] || null;
    const trophies = rows.flatMap((r) => (Array.isArray(r.trophies) ? r.trophies : []).map((t) => ({ season: r.season, club: r.club, name: typeof t === "string" ? t : t?.name || t?.label || t?.competition || "Título" })));
    try {
      const live = root.ProLifeCoachCareer?.liveTrophies?.(s, D) || [];
      const stint = stints.find((x) => x.exit === null) || stints[0];
      for (const t of live) trophies.push({ season: s.season, club: stint?.club || nameOf(id), name: t?.name || "Título" });
    } catch (e) {}
    const history = (s.history || []).map((h) => ({ season: h.season, league: h.league, champion: h.champion, position: h.position }));
    try {
      const seen = new Set(history.map((h) => h.season + "|" + h.league));
      for (const h of s.globalFootball?.worldCompetitions?.history || []) {
        const key = h.season + "|" + h.league;
        if (!h?.champion || seen.has(key)) continue;
        seen.add(key);
        const pos = Array.isArray(h.orderIds) && id ? h.orderIds.indexOf(id) + 1 : 0;
        history.push({ season: h.season, league: h.league, champion: h.champion, position: pos || null });
      }
      const CONT = { ucl: "Liga dos Campeões", uel: "Liga Europa", uecl: "Liga Conferência", lib: "Libertadores", sud: "Sul-Americana" };
      for (const ed of Object.values(s.continental?.editions || {})) {
        const champ = ed?.championId || ed?.knockout?.championId;
        const label = CONT[ed?.comp];
        if (!champ || !label) continue;
        const key = ed.season + "|" + label;
        if (seen.has(key)) continue;
        seen.add(key);
        history.push({ season: ed.season, league: label, champion: nameOf(champ), position: null });
      }
      const cup = s.competitionSchedule?.cup;
      if (cup?.championId && !seen.has(cup.season + "|" + (cup.name || "Copa do Brasil"))) history.push({ season: cup.season, league: cup.name || "Copa do Brasil", champion: nameOf(cup.championId), position: null });
      history.sort((a, b) => num(b.season) - num(a.season));
    } catch (e) {}
    return { s, res, w, d, l, gf, ga, best, worst, mostGoals, rows, bestSeason, trophies, history, stints, clubName: id ? nameOf(id) : null };
  }

  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (t?.closest("[data-sm27-records]")) { ev.preventDefault(); doc.body.classList.remove("sm27-menu-open"); root.ProLifeCoachArea?.go("registos"); }
  }, true);
  root.ProLifeSM27Records = { open: () => root.ProLifeCoachArea?.go("registos"), close() {}, compute };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Records;
})(typeof window !== "undefined" ? window : globalThis);
