(function (root) {
  "use strict";
  // PRO LIFE — Registros: Estatísticas · Registos · Troféus · Galeria de honra.
  // Tudo é derivado do que já existe no save (partidas, histórico de campeões, passagens do treinador).
  const doc = root.document;
  if (!doc) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  let layer = null, tab = "estatisticas";

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
    const history = (s.history || []).map((h) => ({ season: h.season, league: h.league, champion: h.champion, position: h.position }));
    return { s, res, w, d, l, gf, ga, best, worst, mostGoals, rows, bestSeason, trophies, history, stints, clubName: id ? nameOf(id) : null };
  }

  const kv = (rows) => `<ul class="obj-list">${rows.map(([k, v]) => `<li class="obj-row"><span class="obj-top"><b>${esc(k)}</b><em>${esc(v)}</em></span></li>`).join("")}</ul>`;
  const score = (r) => `${r.gf}–${r.ga} ${r.home ? "em casa contra" : "fora contra"} ${r.opp}`;

  function view(c) {
    if (!c) return `<p class="shd-note">Registros disponíveis com uma carreira ativa.</p>`;
    if (tab === "estatisticas") {
      const j = c.res.length, pct = j ? Math.round(((c.w * 3 + c.d) / (j * 3)) * 100) : 0;
      const rows = [["Jogos registrados", j], ["Vitórias · Empates · Derrotas", `${c.w} · ${c.d} · ${c.l}`], ["Aproveitamento", pct + "%"], ["Gols pró · contra", `${c.gf} · ${c.ga}`], ["Saldo de gols", (c.gf - c.ga > 0 ? "+" : "") + (c.gf - c.ga)]];
      if (c.s.mode === "coach") rows.push(["Temporadas como treinador", c.rows.length], ["Passagens por clubes", c.stints.length]);
      else rows.push(["Gols na carreira", num(c.s.person?.goals)], ["Minutos jogados", num(c.s.person?.minutes)]);
      return `<p class="shd-sub">${esc(c.clubName || "Sem clube")}</p>` + kv(rows);
    }
    if (tab === "registos") {
      return kv([
        ["Maior vitória", c.best ? score(c.best) : "Ainda sem vitórias"],
        ["Pior derrota", c.worst ? score(c.worst) : "Ainda sem derrotas"],
        ["Jogo com mais gols", c.mostGoals ? score(c.mostGoals) : "—"],
        ["Melhor temporada", c.bestSeason ? `${c.bestSeason.club} ${c.bestSeason.season} · ${c.bestSeason.pos}º lugar · ${c.bestSeason.points} pts` : "Ainda sem temporadas concluídas"]
      ]);
    }
    if (tab === "trofeus") {
      return c.trophies.length ? kv(c.trophies.map((t) => [t.name, `${t.club} · ${t.season}`])) : `<p class="shd-note">Nenhum troféu ainda. Vença campeonatos e copas para encher esta estante.</p>`;
    }
    return c.history.length ? kv(c.history.slice(0, 40).map((h) => [`${h.season} · ${h.league || "Liga"}`, `${h.champion}${h.position ? " · você: " + h.position + "º" : ""}`])) : `<p class="shd-note">A galeria de honra mostra os campeões de cada temporada concluída.</p>`;
  }

  function html() {
    const tabs = [["estatisticas", "Estatísticas"], ["registos", "Registos"], ["trofeus", "Troféus"], ["honra", "Galeria de honra"]];
    return `<div class="sm27-dialog-backdrop" data-sm27rc-close></div><section class="sm27-dialog" role="dialog" aria-modal="true" aria-label="Registros"><header class="sm27-dialog-head"><span></span><h2>Registros</h2><button type="button" class="sm27-dialog-x" data-sm27rc-close aria-label="Fechar">×</button></header><div class="sm27-dialog-body"><nav class="shd-tabs rc-tabs" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${tab === id}" data-sm27rc-tab="${id}">${l}</button>`).join("")}</nav>${view(compute())}</div></section>`;
  }
  function open() {
    if (!layer) { layer = doc.createElement("div"); layer.className = "sm27-dialog-layer"; doc.body.appendChild(layer); doc.body.classList.remove("sm27-menu-open"); }
    layer.innerHTML = html();
    layer.querySelector(".sm27-dialog-x")?.focus({ preventScroll: true });
  }
  function close() { if (layer) { layer.remove(); layer = null; } }

  doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest("[data-sm27-records]")) { ev.preventDefault(); tab = "estatisticas"; open(); return; }
    if (!layer) return;
    if (t.closest("[data-sm27rc-close]")) { close(); return; }
    const tb = t.closest("[data-sm27rc-tab]");
    if (tb) { tab = tb.dataset.sm27rcTab; open(); }
  }, true);
  doc.addEventListener("keydown", (ev) => { if (layer && ev.key === "Escape") close(); });

  root.ProLifeSM27Records = { open, close, compute };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeSM27Records;
})(typeof window !== "undefined" ? window : globalThis);
