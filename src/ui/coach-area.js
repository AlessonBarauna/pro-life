(function (root) {
  "use strict";
  // PRO LIFE — Área do Treinador: Treinador · Finanças · Registos · Vagas de emprego.
  // Só lê dados do jogo (habilidades, finanças, histórico, propostas). Ações usam comandos que já existem.
  const doc = root.document;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const st = { sec: "treinador", branch: "treino", node: null, fin: "projecao", reg: "estatisticas", identity: false };
  const money = (v) => { const n = Math.round(num(v)), a = Math.abs(n), sg = n < 0 ? "-" : ""; return a >= 1e9 ? sg + "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi" : a >= 1e6 ? sg + "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi" : a >= 1e3 ? sg + "R$ " + Math.round(a / 1e3) + " mil" : sg + "R$ " + a; };
  const LEVELS = [[0, "Amador"], [25, "Regional"], [45, "Profissional"], [65, "Classe mundial"], [85, "Lenda"]];
  const levelOf = (rep) => { let i = 0; LEVELS.forEach(([min], k) => { if (rep >= min) i = k; }); return { i, label: LEVELS[i][1], next: LEVELS[i + 1] || null }; };
  const HOST = () => root.ProLifeCoachAreaHost || {};

  // ---------- ícones (gradientes e brilho, sem fotos) ----------
  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <linearGradient id="cai-lime" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6ff7a"/><stop offset="1" stop-color="#8fc01c"/></linearGradient>
    <linearGradient id="cai-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#e0b030"/><stop offset="1" stop-color="#a87414"/></linearGradient>
    <linearGradient id="cai-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f6fa"/><stop offset="1" stop-color="#7e93a5"/></linearGradient>
    <linearGradient id="cai-dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3e50"/><stop offset="1" stop-color="#101c28"/></linearGradient></defs></svg>`;
  const I = {
    coach: '<svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="6" fill="url(#cai-steel)"/><path d="M4 30c0-8 5-13 12-13s12 5 12 13z" fill="url(#cai-lime)"/><path d="M13 17l3 5 3-5" fill="none" stroke="#10202c" stroke-width="1.6"/><circle cx="16" cy="10" r="6" fill="none" stroke="#fff" stroke-opacity=".35"/></svg>',
    coins: '<svg viewBox="0 0 32 32"><ellipse cx="11" cy="23" rx="8" ry="3.5" fill="url(#cai-gold)"/><path d="M3 23v-4c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v4" fill="#a87414"/><ellipse cx="11" cy="19" rx="8" ry="3.5" fill="url(#cai-gold)"/><path d="M3 19v-4c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v4" fill="#b8841c"/><ellipse cx="21" cy="12" rx="8" ry="3.5" fill="url(#cai-gold)"/><path d="M13 12V8c0 2 3.6 3.5 8 3.5s8-1.5 8-3.5v4" fill="#c99a24"/><ellipse cx="21" cy="8" rx="8" ry="3.5" fill="url(#cai-gold)"/><ellipse cx="21" cy="7.4" rx="5" ry="1.6" fill="#fff4c0" opacity=".7"/></svg>',
    chart: '<svg viewBox="0 0 32 32"><rect x="4" y="16" width="6" height="12" rx="1.5" fill="url(#cai-steel)"/><rect x="13" y="8" width="6" height="20" rx="1.5" fill="url(#cai-lime)"/><rect x="22" y="12" width="6" height="16" rx="1.5" fill="url(#cai-steel)"/><path d="M4 11l8-5 6 3 10-6" fill="none" stroke="#e6ff7a" stroke-width="1.8" stroke-linecap="round"/></svg>',
    shirt: '<svg viewBox="0 0 32 32"><path d="M11 4l-8 4 3 7 3-1.5V28h12V13.5l3 1.5 3-7-8-4c-.5 2.2-2.4 3.5-5 3.5S11.5 6.2 11 4z" fill="url(#cai-lime)"/><path d="M11 4c.5 2.2 2.4 3.5 5 3.5S20.5 6.2 21 4" fill="none" stroke="#10202c" stroke-width="1.4"/><path d="M9 14v14" stroke="#fff" stroke-opacity=".3"/></svg>',
    briefcase: '<svg viewBox="0 0 32 32"><rect x="3" y="10" width="26" height="17" rx="3" fill="url(#cai-steel)"/><path d="M11 10V7a2 2 0 012-2h6a2 2 0 012 2v3" fill="none" stroke="#9fb2c1" stroke-width="2"/><rect x="3" y="16" width="26" height="3" fill="#10202c" opacity=".45"/><rect x="14" y="14.5" width="4" height="6" rx="1" fill="url(#cai-gold)"/></svg>',
    trophy: '<svg viewBox="0 0 32 32"><path d="M9 4h14v8a7 7 0 01-14 0z" fill="url(#cai-gold)"/><path d="M9 7H4c0 5 2 8 6 8M23 7h5c0 5-2 8-6 8" fill="none" stroke="#c99a24" stroke-width="2"/><rect x="14" y="19" width="4" height="5" fill="#b8841c"/><rect x="9" y="24" width="14" height="4" rx="1.5" fill="url(#cai-gold)"/><path d="M12 6v6" stroke="#fff8d0" stroke-width="1.6" opacity=".7" stroke-linecap="round"/></svg>',
    cone: '<svg viewBox="0 0 32 32"><path d="M16 3l9 22H7z" fill="url(#cai-lime)"/><path d="M12.5 12h7M10.5 18h11" stroke="#10202c" stroke-width="2.2" opacity=".55"/><rect x="3" y="25" width="26" height="4" rx="1.5" fill="url(#cai-dark)"/></svg>',
    users: '<svg viewBox="0 0 32 32"><circle cx="11" cy="11" r="5" fill="url(#cai-steel)"/><circle cx="22" cy="12" r="4.2" fill="url(#cai-lime)"/><path d="M2 28c0-7 4-11 9-11s9 4 9 11z" fill="url(#cai-steel)"/><path d="M17 28c0-5 2-8 5-8s7 3 7 8z" fill="url(#cai-lime)"/></svg>',
    tactic: '<svg viewBox="0 0 32 32"><rect x="3" y="5" width="26" height="22" rx="3" fill="url(#cai-dark)" stroke="#6f8aa0" stroke-width="1.2"/><circle cx="10" cy="20" r="2.4" fill="#e6ff7a"/><circle cx="22" cy="11" r="2.4" fill="#fff"/><path d="M12 19c4-1 6-4 8-7" fill="none" stroke="#e6ff7a" stroke-width="1.8" stroke-dasharray="3 2.4" stroke-linecap="round"/><path d="M19 9l3 .5-.6 3" fill="none" stroke="#fff" stroke-width="1.6"/></svg>',
    lock: '<svg viewBox="0 0 32 32"><rect x="6" y="14" width="20" height="14" rx="3" fill="url(#cai-steel)"/><path d="M10 14v-3a6 6 0 0112 0v3" fill="none" stroke="#9fb2c1" stroke-width="2.4"/><circle cx="16" cy="21" r="2.2" fill="#10202c"/></svg>',
    check: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="url(#cai-lime)"/><path d="M9.5 16.5l4.4 4.4 8.6-9" fill="none" stroke="#10202c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pencil: '<svg viewBox="0 0 32 32"><path d="M5 27l2-8L21 5l6 6L13 25z" fill="url(#cai-lime)"/><path d="M19 7l6 6" stroke="#10202c" stroke-width="1.4"/><path d="M5 27l2-8 6 6z" fill="#f1d9a8"/></svg>',
    stadium: '<svg viewBox="0 0 32 32"><ellipse cx="16" cy="13" rx="13" ry="7" fill="url(#cai-dark)" stroke="#8fa3b3"/><ellipse cx="16" cy="13" rx="8" ry="3.8" fill="#2f7d3b"/><path d="M3 13v8c0 3.5 5.8 6 13 6s13-2.5 13-6v-8" fill="url(#cai-steel)" opacity=".85"/></svg>',
    tv: '<svg viewBox="0 0 32 32"><rect x="3" y="6" width="26" height="17" rx="3" fill="url(#cai-dark)" stroke="#8fa3b3" stroke-width="1.4"/><rect x="6" y="9" width="20" height="11" rx="1.5" fill="url(#cai-lime)" opacity=".85"/><path d="M11 28h10" stroke="#9fb2c1" stroke-width="2.4" stroke-linecap="round"/></svg>',
    star: '<svg viewBox="0 0 32 32"><path d="M16 3l3.8 8.2 9 1-6.7 6 1.9 8.8L16 22.5 8 27l1.9-8.8-6.7-6 9-1z" fill="url(#cai-gold)"/><path d="M16 6l2.4 5.6" stroke="#fff8d0" stroke-width="1.4" opacity=".7" stroke-linecap="round"/></svg>',
    empty: '<svg viewBox="0 0 32 32"><circle cx="14" cy="14" r="9" fill="none" stroke="#6f8aa0" stroke-width="2.4"/><path d="M21 21l7 7" stroke="#6f8aa0" stroke-width="3" stroke-linecap="round"/><path d="M10 10l8 8M18 10l-8 8" stroke="#6f8aa0" stroke-width="1.8" stroke-linecap="round"/></svg>'
  };
  const ic = (n, cls) => `<span class="ca-ic ${cls || ""}" aria-hidden="true">${I[n] || ""}</span>`;
  const SKILL_ICON = { treino: "cone", vestiario: "users", tatico: "tactic" };

  function ctxOf() { return root.ProLifeSM27Ctx?.() || null; }
  const ring = (v, max, label, cls) => `<span class="ca-ring ${cls || ""}" style="--p:${Math.max(0, Math.min(100, (num(v) / max) * 100))}"><b>${esc(label ?? Math.round(v))}</b></span>`;
  const empty = (t, icon) => `<div class="ca-empty">${ic(icon || "empty")}<p>${t}</p></div>`;
  const tabs = (list, on, attr) => `<nav class="ca-tabs" role="tablist">${list.map(([id, l]) => `<button type="button" role="tab" aria-selected="${id === on}" ${attr}="${id}">${esc(l)}</button>`).join("")}</nav>`;
  const table = (head, rows, cls) => `<div class="ca-tablewrap"><table class="ca-table ${cls || ""}"><thead><tr>${head.map((h, i) => `<th${i ? ' class="r"' : ""}>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;

  // ---------- Treinador ----------
  function viewCoach(c) {
    const { s, D } = c, K = D.CoachSkills, cc = s.coachCareer || {};
    if (!K) return empty("As habilidades ficam disponíveis na carreira de treinador.");
    const club = D.club(s), rep = num(s.reputation), lv = levelOf(rep), pts = K.available(s), have = new Set(K.unlocked(s));
    const p = s.person || {}, crest = club?.id && root.ProLifeClubCrests?.render ? root.ProLifeClubCrests.render(club.id, { size: "sm" }) : "";
    const board = num(s.board, 50), risk = cc.board?.risk, bd = cc.board?.breakdown;
    const factor = (l, v) => `<div class="ca-fr"><span>${l}</span><i class="ca-mini"><em style="width:${v == null ? 0 : Math.max(4, v)}%"></em></i><b>${v == null ? "—" : v}</b></div>`;
    const left = `<aside class="ca-left"><section class="ca-card ca-id"><button type="button" class="ca-edit" data-ca-identity aria-label="Editar identidade e aparência">${ic("pencil")}</button><div class="ca-portrait">${ic("coach", "big")}</div><b class="ca-name">${esc(p.name || "Treinador")}</b><small>${esc(num(p.age, "") )} anos · ${esc(p.nationality || "")}</small><div class="ca-clubline">${crest}<span>${esc(club?.name || "Sem clube")}</span><span class="ca-pill">${esc(lv.label)}</span></div><div class="ca-xp"><i style="width:${Math.min(100, rep)}%"></i></div><small>Reputação ${rep}/100${lv.next ? " · " + esc(lv.next[1]) + " com " + lv.next[0] : ""}</small><div class="ca-pts">${ic("coins", "sm")}<b>${pts}</b><span>ponto${pts === 1 ? "" : "s"} de habilidade</span></div></section>
      <section class="ca-card ca-board"><h4>Voto da diretoria</h4><div class="ca-boardrow">${ring(board, 100, board, board >= 65 ? "good" : board >= 45 ? "mid" : "bad")}<div class="ca-bf"><b class="ca-risk">${esc(risk?.label || (board >= 65 ? "Seguro" : board >= 45 ? "Estável" : "Sob pressão"))}</b>${bd ? [["Resultados", bd.resultados], ["Metas", bd.metas], ["Finanças", bd.financas], ["Vestiário", bd.vestiario]].filter((x) => x[1] != null).map((x) => factor(x[0], x[1])).join("") : ""}</div></div></section></aside>`;
    const nodes = K.NODES.filter((n) => n.branch === st.branch);
    const sel = nodes.find((n) => n.id === st.node) || nodes.find((n) => !have.has(n.id)) || nodes[0];
    const stateOf = (n) => (have.has(n.id) ? "done" : n.requires && !have.has(n.requires) ? "locked" : pts >= n.cost ? "open" : "short");
    const chain = nodes.map((n, i) => { const s2 = stateOf(n); return `${i ? `<span class="ca-link ${have.has(nodes[i - 1].id) ? "on" : ""}"></span>` : ""}<button type="button" class="ca-node ${s2}${n.id === sel.id ? " sel" : ""}" data-ca-node="${n.id}">${ic(s2 === "locked" ? "lock" : s2 === "done" ? "check" : SKILL_ICON[n.branch])}<b>${esc(n.label)}</b><small>${s2 === "done" ? "Ativa" : s2 === "locked" ? "Bloqueada" : n.cost + " ponto" + (n.cost > 1 ? "s" : "")}</small></button>`; }).join("");
    const ss = stateOf(sel), req = sel.requires ? K.NODES.find((x) => x.id === sel.requires) : null;
    const detail = `<section class="ca-card ca-detail">${ic(SKILL_ICON[sel.branch], "huge")}<h3>${esc(sel.label)}</h3><p>${esc(sel.text)}</p><div class="ca-fr"><span>Custo</span><b>${sel.cost} ponto${sel.cost > 1 ? "s" : ""}</b></div>${req ? `<div class="ca-fr"><span>Requer</span><b>${esc(req.label)}</b></div>` : ""}<button type="button" class="ca-btn" data-ca-unlock="${sel.id}" ${ss === "open" ? "" : "disabled"}><span>${ss === "done" ? "Ativa" : ss === "locked" ? "Bloqueada" : ss === "short" ? "Pontos insuficientes" : "Comprar"}</span>${ss === "open" || ss === "short" ? `<em>${ic("coins", "xs")}${sel.cost}</em>` : ""}</button></section>`;
    return left + `<div class="ca-right">${tabs(Object.entries(K.BRANCHES), st.branch, "data-ca-branch")}<div class="ca-tree"><div class="ca-chain">${chain}</div>${detail}</div></div>`;
  }

  // ---------- Finanças ----------
  const FIN_TABS = [["projecao", "Projeção"], ["detalhado", "Detalhado"], ["competicoes", "Competições"], ["zona", "Zona do clube"], ["caixa", "Caixa e loja"], ["extrato", "Extrato"], ["investidores", "Investidores"], ["pessoal", "Pessoal"], ["compras", "Compras"]];
  function finData(c) {
    const { s, D } = c, F = root.ProLifeClubFinance, club = D.club(s);
    if (!F?.summary || !club) return null;
    let sm; try { sm = F.summary(s, 12); } catch (e) { return null; }
    if (!sm) return null;
    const ann = F.annualRevenue(club, s), S = F.SHARE || {}, closed = (sm.months || []).length;
    const real = {};
    for (const m of [...(sm.months || []), sm.current].filter(Boolean)) for (const [k, v] of Object.entries(m.byCategory || {})) real[k] = (real[k] || 0) + num(v);
    const exp = { bilheteria: ann * num(S.gate), tv: ann * num(S.tv), patrocinio: ann * num(S.sponsor), camisas: num(sm.store?.expectedMonthly) * 12 };
    exp.outras = Math.max(0, num(sm.expectedMonthlyRevenue) * 12 - exp.bilheteria - exp.tv - exp.patrocinio - exp.camisas);
    const left = Math.max(0, 12 - closed);
    const proj = (k) => num(real[k]) + (exp[k] || 0) / 12 * left;
    const rev = ["bilheteria", "tv", "patrocinio", "camisas", "premios", "outras"].map((k) => [k, num(real[k]), k === "premios" ? num(real[k]) : proj(k)]);
    const payroll = num(sm.monthlyPayroll), ops = Math.max(0, num(sm.monthlyCost) - payroll);
    const exps = [["folha", num(real.folha), num(real.folha) + payroll * left], ["operacao", num(real.operacao), num(real.operacao) + ops * left]];
    const sumR = rev.reduce((a, r) => [a[0] + r[1], a[1] + r[2]], [0, 0]), sumE = exps.reduce((a, r) => [a[0] + Math.abs(r[1]), a[1] + Math.abs(r[2])], [0, 0]);
    return { sm, F, rev, exps, sumR, sumE, exp, ann, closed, net: sumR[1] - sumE[1], realNet: sumR[0] - sumE[0] };
  }
  function viewFin(c) {
    if (c.s.mode !== "coach") return empty("As finanças ficam disponíveis na carreira de treinador.");
    const f = finData(c);
    if (!f) return empty("Assine com um clube para ver as finanças.");
    const { sm, F } = f, L = F.CATEGORIES || {};
    const left = `<aside class="ca-left"><section class="ca-card ca-sum"><h4>Sumário</h4><small>Caixa total do clube</small><b class="ca-big">${money(sm.totalCash)}</b><small>Resultado já registrado</small><b class="${f.realNet < 0 ? "neg" : "pos"}">${money(f.realNet)}</b><p>${f.closed ? f.closed + " mês(es) fechado(s)." : "Nenhum mês fechado ainda."}</p></section><section class="ca-card ca-sum"><h4>Projeção da época</h4><b class="ca-big ${f.net < 0 ? "neg" : "pos"}">${money(f.net)}</b><p>${f.net < 0 ? "Prejuízo previsto" : "Lucro previsto"} com a receita esperada e a folha atual.</p></section></aside>`;
    let body = "";
    if (st.fin === "projecao") {
      const rows = f.rev.map(([k, r, p]) => `<tr><td>${esc(L[k] || k)}</td><td class="r">${money(r)}</td><td class="r">${money(p)}</td><td class="r"></td></tr>`).concat(f.exps.map(([k, r, p]) => `<tr><td>${esc(L[k] || k)}</td><td class="r neg">${money(-Math.abs(r))}</td><td class="r"></td><td class="r neg">${money(-Math.abs(p))}</td></tr>`));
      body = table(["Finanças", "Realizado", "Receita da época", "Despesa da época"], rows.concat([`<tr class="tot ${f.net < 0 ? "bad" : "good"}"><td>Total</td><td class="r">${money(f.realNet)}</td><td class="r">${money(f.sumR[1])}</td><td class="r">${money(-f.sumE[1])}</td></tr>`]));
    } else if (st.fin === "detalhado") {
      const ms = [...sm.months].reverse();
      body = ms.length || sm.current ? table(["Mês", "Receitas", "Despesas", "Resultado"], [sm.current && sm.current.month != null ? sm.current : null, ...ms].filter(Boolean).map((m, i) => `<tr><td>Mês ${num(m.month) + 1}${m === sm.current ? " (atual)" : ""}</td><td class="r">${money(m.in)}</td><td class="r neg">${money(-num(m.out))}</td><td class="r ${num(m.in) - num(m.out) < 0 ? "neg" : "pos"}">${money(num(m.in) - num(m.out))}</td></tr>`)) : empty("O primeiro fechamento mensal ainda não aconteceu.", "chart");
    } else if (st.fin === "competicoes") {
      const club = c.D.club(c.s); let pos = 0, n = 0, league = "";
      try { const W = root.ProLifeWorldClubCompetitions, tb = W?.standings?.(c.s, club.leagueId) || []; n = tb.length; pos = tb.findIndex((x) => x.id === club.id) + 1; league = root.ProLifeGlobalFootball?.leagueById?.(c.s, club.leagueId)?.name || club.leagueId; } catch (e) {}
      const prem = (sm.ledger || []).filter((x) => x.category === "premios");
      const recebido = prem.reduce((a, x) => a + num(x.amount), 0);
      const guess = n && pos ? f.ann * 0.08 * Math.pow((n - pos + 1) / n, 2) : 0;
      body = table(["Competição", "Posição atual", "Prêmio esperado", "Prêmio recebido"], [`<tr><td>${ic("trophy", "xs")} ${esc(league || "Liga")}</td><td class="r">${pos ? pos + "º de " + n : "—"}</td><td class="r">${guess ? money(guess) : "—"}</td><td class="r">${money(recebido)}</td></tr>`]) + (prem.length ? table(["Premiação recebida", "Valor"], prem.slice(0, 20).map((x) => `<tr><td>${esc(x.label || "Premiação")}</td><td class="r pos">${money(x.amount)}</td></tr>`)) : `<p class="ca-note">O prêmio esperado é uma estimativa pela posição na tabela; o valor recebido vem do livro-caixa do clube.</p>`);
    } else if (st.fin === "zona") {
      const D = c.D, club = D.club(c.s), fx = D.Facilities?.effects?.(c.s, club);
      const contracts = ((c.s.coachCareer?.finance?.revenueContracts) || []).filter((x) => x.type === "sponsorship" && String(x.clubId) === String(club.id) && c.s.day >= num(x.startDay) && c.s.day <= num(x.endDay) && x.status !== "ended");
      const src = [["tv", "Direitos de TV", f.exp.tv], ["stadium", "Dia de jogo", f.exp.bilheteria], ["shirt", "Camisas e produtos", f.exp.camisas], ["star", "Patrocínios", f.exp.patrocinio]];
      const spons = contracts.length ? contracts.map((x) => `<div class="ca-fr"><span>${esc(x.brand || x.name || x.sponsor || "Patrocinador")}</span><b>${money(x.annualValue || x.amount || x.value)}</b></div>`).join("") : `<small>Nenhum contrato ativo. Veja a aba Patrocínios do Treinador.</small>`;
      body = `<div class="ca-zone"><section class="ca-card ca-spons">${ic("star", "big")}<h4>Patrocinador principal</h4>${spons}<small>Estádio: ${num(fx?.stadiumCapacity || sm.capacity).toLocaleString("pt-BR")} lugares</small></section>${table(["Fonte", "Por mês", "Por época"], src.map(([i, l, v]) => `<tr><td>${ic(i, "xs")} ${esc(l)}</td><td class="r">${money(v / 12)}</td><td class="r">${money(v)}</td></tr>`).concat([`<tr class="tot good"><td>Total esperado</td><td class="r">${money(src.reduce((a, x) => a + x[2], 0) / 12)}</td><td class="r">${money(src.reduce((a, x) => a + x[2], 0))}</td></tr>`]))}</div>`;
    } else if (st.fin === "investidores") {
      const H = root.ProLifeTransferHub, reply = c.s.coachCareer?.investors?.lastReply;
      body = `<div class="ca-legacy">${reply ? `<p class="ca-note">${esc(reply)}</p>` : ""}${H?.investorHtml?.() || empty("Nenhuma proposta de investidor no momento.")}</div>`;
    } else {
      const map = { caixa: ["clube", "loja"], extrato: ["extrato"], pessoal: ["resumo", "pessoal"], compras: ["compras"] }[st.fin] || [];
      body = `<div class="ca-legacy">${map.map((id) => HOST().finance?.(id) || "").join("")}</div>`;
    }
    return left + `<div class="ca-right">${tabs(FIN_TABS, st.fin, "data-ca-fin")}<div class="ca-scroll">${body}</div></div>`;
  }

  // ---------- Registos ----------
  const REG_TABS = [["estatisticas", "Estatísticas"], ["registos", "Registos"], ["trofeus", "Troféus"], ["honra", "Galeria de honra"]];
  function viewReg(c) {
    const R = root.ProLifeSM27Records?.compute?.();
    if (!R) return empty("Os registros ficam disponíveis com uma carreira ativa.");
    const w = num(R.w), d = num(R.d), l = num(R.l), g = w + d + l, pct = g ? Math.round((100 * w) / g) : 0, lv = levelOf(num(c.s.reputation));
    const left = `<aside class="ca-left"><section class="ca-card ca-rec"><h4>Registo do treinador</h4>${ring(pct, 100, pct + "%", pct >= 50 ? "good" : pct >= 30 ? "mid" : "bad")}<small>Percentual de vitórias</small><span class="ca-pill">${esc(lv.label)}</span>${[["Jogos disputados", g], ["Vitórias", w], ["Empates", d], ["Derrotas", l], ["Troféus", R.trophies.length]].map(([k, v]) => `<div class="ca-fr"><span>${k}</span><b>${v}</b></div>`).join("")}</section></aside>`;
    let body = "";
    const sc = (r) => `${r.gf}–${r.ga} ${r.home ? "em casa contra" : "fora contra"} ${esc(r.opp)}`;
    if (st.reg === "estatisticas") {
      const rows = R.rows.slice().reverse().map((r) => `<tr><td>${esc(r.season)}</td><td>${esc(r.club)}</td><td class="r">${num(r.w)}</td><td class="r">${num(r.d)}</td><td class="r">${num(r.l)}</td><td class="r">${num(r.pos) ? num(r.pos) + "º" : "—"}</td><td class="r">${num(r.points)}</td></tr>`);
      const club = c.D.club(c.s);
      body = `<section class="ca-card ca-clubbar">${club?.id && root.ProLifeClubCrests?.render ? root.ProLifeClubCrests.render(club.id, { size: "sm" }) : ""}<b>${esc(R.clubName || "Sem clube")}</b><span>${R.res.length} jogo(s) registrado(s) · ${R.gf} gols pró · ${R.ga} contra</span></section>` + (rows.length ? table(["Época", "Clube", "V", "E", "D", "Pos", "Pts"], rows) : empty("Nenhuma temporada concluída ainda. Cada época aparece aqui ao terminar.", "chart"));
    } else if (st.reg === "registos") {
      const items = [["Maior vitória", R.best ? sc(R.best) : "Ainda sem vitórias"], ["Pior derrota", R.worst ? sc(R.worst) : "Ainda sem derrotas"], ["Jogo com mais gols", R.mostGoals ? sc(R.mostGoals) : "—"], ["Melhor temporada", R.bestSeason ? `${esc(R.bestSeason.club)} ${esc(R.bestSeason.season)} · ${R.bestSeason.pos}º lugar · ${R.bestSeason.points} pts` : "Ainda sem temporadas concluídas"]];
      body = table(["Registo", "Valor"], items.map(([k, v]) => `<tr><td>${k}</td><td class="r">${v}</td></tr>`));
    } else if (st.reg === "trofeus") {
      body = R.trophies.length ? `<div class="ca-trophies">${R.trophies.map((t) => `<div class="ca-card ca-trophy">${ic("trophy", "big")}<b>${esc(t.name)}</b><small>${esc(t.club)} · ${esc(t.season)}</small></div>`).join("")}</div>` : empty("Nenhum troféu ainda. Vença campeonatos e copas para encher esta estante.", "trophy");
    } else {
      const hist = R.history.slice(0, 60), mine = hist.filter((h) => h.position === 1).length;
      body = (hist.length ? table(["Temporada · competição", "Campeão", "Sua posição"], hist.map((h) => `<tr><td>${esc(h.season)} · ${esc(h.league || "Liga")}</td><td class="r">${esc(h.champion)}</td><td class="r">${h.position ? h.position + "º" : "—"}</td></tr>`)) : empty("A galeria mostra os campeões de cada temporada concluída.", "trophy")) + (hist.length ? `<p class="ca-note">Títulos seus nesta lista: ${mine}.</p>` : "");
    }
    return left + `<div class="ca-right">${tabs(REG_TABS, st.reg, "data-ca-reg")}<div class="ca-scroll">${body}</div></div>`;
  }

  // ---------- Vagas ----------
  function viewJobs(c) {
    if (c.s.mode !== "coach") return empty("As vagas aparecem na carreira de treinador.");
    const pending = (c.s.offers || []).filter((o) => !Number.isFinite(Number(o.expires)) || Number(o.expires) >= Number(c.s.day));
    if (!pending.length) return `<div class="ca-right ca-wide"><section class="ca-card ca-jobs-empty">${ic("briefcase", "huge")}<h3>Sem vagas abertas</h3><p>Clubes interessados no seu trabalho enviam propostas aqui. Boas campanhas e reputação alta (hoje ${num(c.s.reputation)}) atraem mais ofertas. Convites de seleções ficam na aba Seleção.</p></section></div>`;
    return `<div class="ca-right ca-wide"><div class="ca-scroll"><p class="ca-note">${pending.length} vaga(s) aberta(s). Aceite ou negocie abaixo.</p><div class="ca-legacy">${HOST().offers?.() || ""}</div></div></div>`;
  }

  // ---------- casca ----------
  const SIDE = [["treinador", "Treinador", "coach"], ["financas", "Finanças", "coins"], ["registos", "Registos", "chart"], ["vagas", "Vagas de emprego", "briefcase"]];
  const SIDE2 = [["coachCareer", "Vestiário", "users"], ["training", "Treino da equipe", "cone"], ["clubSponsorships", "Patrocínios", "star"]];
  function render() {
    const c = ctxOf();
    if (!c?.s) return "";
    const body = st.sec === "financas" ? viewFin(c) : st.sec === "registos" ? viewReg(c) : st.sec === "vagas" ? viewJobs(c) : viewCoach(c);
    return `<div class="ca-area" data-ca-sec="${st.sec}">${defs}<nav class="ca-side" aria-label="Área do treinador">${SIDE.map(([id, l, i]) => `<button type="button" class="${st.sec === id ? "on" : ""}" data-ca-sec-go="${id}">${ic(i)}<span>${l}</span></button>`).join("")}</nav><div class="ca-main">${body}</div></div>`;
  }

  let internal = false;
  function goPage() {
    if (!doc) return;
    internal = true;
    let b = doc.querySelector('[data-page="profile"]');
    const host = doc.querySelector("#app");
    if (!b && host) { b = doc.createElement("button"); b.type = "button"; b.dataset.page = "profile"; b.hidden = true; host.appendChild(b); b.click(); b.remove(); }
    else b?.click();
    internal = false;
  }
  function go(sec, tab) {
    st.sec = sec; st.identity = false;
    if (sec === "financas" && tab) st.fin = tab;
    if (sec === "registos" && tab) st.reg = tab;
    goPage();
  }
  const rerender = () => goPage();

  if (doc) doc.addEventListener("click", (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    const pg = t.closest('[data-page="profile"],[data-page="finance"],[data-page="jobOffers"]');
    if (pg && !internal && !pg.closest(".ca-area")) { st.identity = false; st.sec = pg.dataset.page === "finance" ? "financas" : pg.dataset.page === "jobOffers" ? "vagas" : "treinador"; }
    const sec = t.closest("[data-ca-sec-go]"); if (sec) { ev.preventDefault(); go(sec.dataset.caSecGo); return; }
    const br = t.closest("[data-ca-branch]"); if (br) { st.branch = br.dataset.caBranch; st.node = null; rerender(); return; }
    const nd = t.closest("[data-ca-node]"); if (nd) { st.node = nd.dataset.caNode; rerender(); return; }
    const un = t.closest("[data-ca-unlock]"); if (un && !un.disabled) { root.ProLifeSM27Cmd?.("unlockCoachSkill", { id: un.dataset.caUnlock }); rerender(); return; }
    const fn = t.closest("[data-ca-fin]"); if (fn) { st.fin = fn.dataset.caFin; rerender(); return; }
    const rg = t.closest("[data-ca-reg]"); if (rg) { st.reg = rg.dataset.caReg; rerender(); return; }
    if (t.closest("[data-ca-identity]")) { st.identity = true; st.idFresh = true; rerender(); return; }
    if (t.closest("[data-ca-back]")) { st.identity = false; st.sec = "treinador"; rerender(); }
  }, true);

  root.ProLifeCoachArea = { render, go, state: st, levelOf, money };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeCoachArea;
})(typeof window !== "undefined" ? window : globalThis);
