(function (root) {
  "use strict";
  // PRO LIFE — investidores e projetos ambiciosos (modo treinador).
  // - Investidores propõem aportes ao clube do usuário em troca de objetivos (contratações, posição, títulos).
  // - Clubes comprados por xeques convidam o treinador para um projeto com metas.
  // Cada acordo guarda seus objetivos, mostra o progresso e é avaliado no fim da temporada.
  const VERSION = 1;
  const NAMES = ["Grupo Atlas Capital", "Holding Vértice", "Fundo Meridiano", "Consórcio Alvorada", "Pampa Sports Investimentos", "Grupo Horizonte Esportes", "Aurora Ventures", "Albuquerque Investimentos"];
  const OPEN = ["proposed", "negotiating", "active"];
  const PROPOSAL_TTL = 30, MAX_ROUNDS = 2, GAP_DAYS = 150;

  const lazy = (name, file) => root[name] || (typeof require === "function" ? (() => { try { return require(file); } catch (_) { return null; } })() : null);
  const Engine = () => lazy("ProLife", "./engine.js");
  const Career = () => lazy("ProLifeCareer", "./career.js");
  const Finance = () => lazy("ProLifeClubFinance", "./club-finance.js");

  function hash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const roll = (key) => (hash(key) % 10000) / 10000;
  const isCoach = (s) => s && s.mode === "coach" && s.clubId;
  const brl = (v) => "R$ " + (v >= 1e9 ? (v / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + " bi" : Math.round(v / 1e6).toLocaleString("pt-BR") + " mi");
  const ordinal = (n) => n + "º";

  function store(s) {
    s.coachCareer = s.coachCareer || { version: 1 };
    const v = s.coachCareer.investors || (s.coachCareer.investors = { version: VERSION, deals: [], lastProposalDay: -9999, lastReply: "" });
    if (!Array.isArray(v.deals)) v.deals = [];
    return v;
  }
  const deals = (s) => store(s).deals;
  const mine = (s, d) => String(d.clubId) === String(s.clubId);
  const openDeals = (s) => deals(s).filter((d) => mine(s, d) && OPEN.includes(d.status));
  const userClub = (s) => Engine()?.club?.(s, s.clubId) || null;
  const ovrOf = (p) => Number(p?.ovr ?? p?.overall ?? 0);

  function squadLevel(club) {
    const top = (club?.roster || []).filter((p) => p && p.id !== "hero").map(ovrOf).sort((a, b) => b - a).slice(0, 11);
    return top.length ? top.reduce((n, x) => n + x, 0) / top.length : 70;
  }
  function lastPosition(s, club) {
    const rep = Number(club?.reputation) || 60;
    return Math.max(3, Math.min(14, Math.round(1 + (100 - rep) / 5)));
  }

  // Liga europeia (temporada atravessa o ano civil): a meta vale até o FIM do campeonato, não até a virada do ano.
  function euroLeague(s) {
    const club = userClub(s);
    const st = s.globalFootball?.worldCompetitions?.leagues?.[club?.leagueId];
    return st && st.calendarMode === "european_v1" ? st : null;
  }
  const seasonText = (o) => o.euro ? o.deadlineSeason + "/" + String((Number(o.deadlineSeason) + 1) % 100).padStart(2, "0") : String(o.deadlineSeason);

  function makeObjectives(s, club, amount, kind) {
    const level = squadLevel(club), rep = Number(club?.reputation) || 60, season = Number(s.season);
    const eu = euroLeague(s), dl = eu && eu.status === "active" ? Number(eu.season) : season + 1, euro = !!(eu && eu.status === "active");
    const last = lastPosition(s, club);
    const items = [];
    const nSign = Math.max(2, Math.min(8, 2 + Math.floor(amount / 0.7e9)));
    const minOvr = Math.max(60, Math.min(88, Math.round(level + (kind === "project" ? 2 : 1))));
    items.push({ id: "sign", type: "sign", target: kind === "project" ? Math.max(5, nSign) : nSign, minOvr, deadlineSeason: dl, euro, progress: 0, status: "open" });
    const topK = kind === "project" ? 1 : rep >= 80 ? 2 : Math.max(1, Math.min(8, last - 3));
    items.push({ id: "position", type: "position", target: topK, deadlineSeason: dl, euro, progress: 0, status: "open" });
    const trophies = kind === "project" ? 2 : amount >= 1e9 || rep >= 75 ? 1 : 0;
    if (trophies) items.push({ id: "trophy", type: "trophy", target: trophies, deadlineSeason: dl, euro, progress: 0, status: "open" });
    return items;
  }
  function label(o) {
    const until = "até o fim da temporada " + seasonText(o);
    if (o.type === "sign") return "Contratar " + o.target + " jogador" + (o.target > 1 ? "es" : "") + " com GER " + o.minOvr + " ou mais " + until;
    if (o.type === "position") return o.target === 1 ? "Ser campeão da liga " + until : "Terminar a liga entre os " + o.target + " primeiros " + until;
    if (o.type === "trophy") return "Conquistar " + o.target + " título" + (o.target > 1 ? "s" : "") + " " + until + " (liga, copas ou torneios continentais)";
    return o.id;
  }
  function progressText(o) {
    if (o.type === "sign") return o.progress + " de " + o.target + " contratações";
    if (o.type === "trophy") return o.progress + " de " + o.target + " títulos";
    return o.status === "done" ? "meta atingida" : o.status === "failed" ? "meta não atingida" : "avaliada no fim da temporada";
  }
  function note(d) {
    if (d.kind === "project") return d.investor + " quer um treinador para um projeto de poder: o clube já tem verba e vai contratar grandes nomes. Em troca, a diretoria espera resultado rápido.";
    return d.investor + " propõe investir " + brl(d.amount) + " em " + d.clubName + ": " + Math.round((d.upfrontPct || .5) * 100) + "% entra no caixa de transferências ao aceitar e o restante é liberado se as metas forem cumpridas.";
  }

  function addMessage(s, d, subject, body) {
    try { Career()?.addMessage?.(s, { category: "TREINADOR", sender: d.investor, subject, body, eventId: "inv_" + d.id + "_" + subject.length }); } catch (_) {}
    try { s.news = s.news || []; s.news.unshift({ day: s.day, season: s.season, title: subject, body }); s.news = s.news.slice(0, 160); } catch (_) {}
  }

  function propose(s, opts) {
    if (!isCoach(s)) return null;
    const club = userClub(s); if (!club) return null;
    const v = store(s), o = opts || {};
    const rep = Number(club.reputation) || 60;
    const base = Math.pow(Math.max(8, 100 - rep), 1.3) * 12e6;
    const amount = Math.round(base * (0.8 + roll("amt|" + s.season + "|" + s.day + "|" + club.id) * 0.5) / 1e7) * 1e7;
    const investor = NAMES[hash("inv|" + s.season + "|" + s.day + "|" + club.id) % NAMES.length];
    const d = { id: "inv_" + s.season + "_" + s.day + "_" + club.id, kind: "investment", clubId: club.id, clubName: club.name, investor, amount, upfrontPct: 0.5, status: "proposed", createdDay: s.day, expiresDay: s.day + PROPOSAL_TTL, round: 0, activatedDay: null, startSeason: s.season, objectives: makeObjectives(s, club, amount, "investment") };
    if (o.amount) d.amount = o.amount;
    v.deals.unshift(d); v.deals = v.deals.slice(0, 40); v.lastProposalDay = s.day;
    addMessage(s, d, "Proposta de investidor: " + investor, note(d) + " Veja os objetivos em Finanças > Investidores (prazo de " + PROPOSAL_TTL + " dias).");
    return d;
  }

  // Convite de um clube de xeque: o treinador assume um projeto com metas.
  function projectFor(s, club, fund) {
    const objectives = makeObjectives(s, club, fund, "project").map((x) => ({ ...x, deadlineSeason: Number(s.season) + 1 }));
    return { kind: "project", investor: (club.sheikh && club.sheikh.owner) || "Dono do clube", fund, objectives, clubName: club.name };
  }
  function activateProject(s, project, clubId) {
    if (!project || !isCoach(s)) return null;
    const v = store(s);
    for (const d of v.deals) if (mine(s, d) && OPEN.includes(d.status)) d.status = "cancelled";
    const d = { id: "prj_" + s.season + "_" + s.day + "_" + clubId, kind: "project", clubId, clubName: project.clubName, investor: project.investor, amount: 0, upfrontPct: 0, status: "active", createdDay: s.day, activatedDay: s.day, startSeason: s.season, round: 0, objectives: project.objectives.map((x) => ({ ...x, progress: 0, status: "open" })) };
    v.deals.unshift(d);
    addMessage(s, d, "Projeto aceito: " + project.clubName, "Metas combinadas com " + project.investor + ": " + d.objectives.map(label).join("; ") + ".");
    return d;
  }

  function applyMoney(s, d, amount, why) {
    const club = userClub(s); if (!club || !(amount > 0)) return;
    club.budget = (Number(club.budget) || 0) + amount;
    try { Finance()?.movement?.(s, club, "transferencia", amount, why); } catch (_) {}
  }

  // Resposta do usuário: accept | reject | negotiate (ask = money | easier | time).
  function respond(s, id, action, ask) {
    if (!isCoach(s)) throw Error("Disponível apenas no modo treinador.");
    const v = store(s), d = v.deals.find((x) => x.id === id && mine(s, x));
    if (!d || !["proposed", "negotiating"].includes(d.status)) throw Error("Esta proposta não está mais disponível.");
    if (Number(s.day) > Number(d.expiresDay)) { d.status = "expired"; throw Error("A proposta expirou."); }
    let reply = "";
    if (action === "accept") {
      d.status = "active"; d.activatedDay = s.day; d.startSeason = s.season;
      for (const o of d.objectives) { o.progress = 0; o.status = "open"; }
      const up = Math.round(d.amount * (d.upfrontPct || .5));
      applyMoney(s, d, up, "Investimento: " + d.investor);
      reply = "Acordo fechado com " + d.investor + ". " + brl(up) + " entraram no orçamento de transferências.";
      addMessage(s, d, "Investimento confirmado: " + d.investor, reply + " Metas: " + d.objectives.map(label).join("; ") + ".");
    } else if (action === "reject") {
      d.status = "rejected"; d.closedDay = s.day;
      reply = "Você recusou a proposta de " + d.investor + ".";
    } else if (action === "negotiate") {
      if (d.round >= MAX_ROUNDS) throw Error("O investidor já deu a última resposta. Aceite ou recuse.");
      if (!["money", "easier", "time"].includes(ask)) throw Error("Escolha o que quer negociar.");
      const r = roll("neg|" + d.id + "|" + d.round + "|" + ask);
      d.round++; d.status = "negotiating"; d.expiresDay = Number(s.day) + 7;
      const chance = ask === "money" ? 0.5 : 0.62;
      if (r < chance) {
        if (ask === "money") { d.amount = Math.round(d.amount * 1.25 / 1e7) * 1e7; reply = d.investor + " topou aumentar o aporte para " + brl(d.amount) + "."; }
        else if (ask === "easier") {
          for (const o of d.objectives) { if (o.type === "sign") o.target = Math.max(1, o.target - 1); else if (o.type === "position") o.target = Math.min(12, o.target + 2); else if (o.type === "trophy") o.target = Math.max(0, o.target - 1); }
          d.objectives = d.objectives.filter((o) => !(o.type === "trophy" && o.target === 0));
          reply = d.investor + " aceitou metas mais leves.";
        } else { for (const o of d.objectives) o.deadlineSeason = Number(o.deadlineSeason) + 1; reply = d.investor + " deu mais uma temporada de prazo."; }
      } else if (r < chance + 0.25) {
        if (ask === "money") { d.amount = Math.round(d.amount * 1.1 / 1e7) * 1e7; reply = d.investor + " ofereceu um meio-termo: aporte de " + brl(d.amount) + "."; }
        else if (ask === "easier") { const o = d.objectives.find((x) => x.type === "sign"); if (o) o.target = Math.max(1, o.target - 1); reply = d.investor + " aliviou só a meta de contratações."; }
        else { const o = d.objectives.find((x) => x.type === "position"); if (o) o.deadlineSeason = Number(o.deadlineSeason) + 1; reply = d.investor + " estendeu o prazo só da meta de posição."; }
      } else if (d.round >= MAX_ROUNDS && r > 0.9) {
        d.status = "withdrawn"; d.closedDay = s.day; reply = d.investor + " se irritou com a insistência e retirou a proposta.";
      } else reply = d.investor + " manteve a proposta como estava.";
      d.objectives.forEach((o) => { o.text = label(o); });
      if (d.status === "negotiating") reply += d.round >= MAX_ROUNDS ? " Esta foi a última rodada: aceite ou recuse." : " Você ainda pode negociar mais uma vez.";
    } else throw Error("Ação inválida.");
    v.lastReply = reply;
    return reply;
  }

  function onSigning(s, p) {
    if (!isCoach(s) || !p) return;
    for (const d of openDeals(s)) {
      if (d.status !== "active") continue;
      for (const o of d.objectives) {
        if (o.type !== "sign" || o.status !== "open") continue;
        if (ovrOf(p) >= Number(o.minOvr)) { o.progress++; if (o.progress >= o.target) o.status = "done"; }
      }
    }
  }

  function settle(s, d, hooks) {
    const done = d.objectives.filter((o) => o.status === "done").length, total = d.objectives.length;
    const ratio = total ? done / total : 1;
    const club = userClub(s);
    d.closedDay = s.day; d.result = { done, total };
    if (ratio >= 1) {
      d.status = "completed";
      const rest = Math.round(d.amount * (1 - (d.upfrontPct || .5)));
      applyMoney(s, d, rest, "Investimento (parcela final): " + d.investor);
      s.board = Math.min(100, (Number(s.board) || 50) + 10); s.reputation = Math.min(100, (Number(s.reputation) || 0) + (d.kind === "project" ? 4 : 2));
      addMessage(s, d, "Metas cumpridas: " + d.investor, "Todos os objetivos foram atingidos." + (rest > 0 ? " A parcela final de " + brl(rest) + " foi liberada." : " Sua reputação subiu."));
    } else if (ratio >= 0.5) {
      d.status = "partial";
      const rest = Math.round(d.amount * (1 - (d.upfrontPct || .5)) * ratio);
      applyMoney(s, d, rest, "Investimento (parcela parcial): " + d.investor);
      addMessage(s, d, "Metas parcialmente cumpridas: " + d.investor, done + " de " + total + " objetivos atingidos." + (rest > 0 ? " Parcela final reduzida: " + brl(rest) + "." : ""));
    } else {
      d.status = "failed";
      s.board = Math.max(0, (Number(s.board) || 50) - (d.kind === "project" ? 12 : 8)); s.reputation = Math.max(0, (Number(s.reputation) || 0) - 2);
      addMessage(s, d, "Metas não cumpridas: " + d.investor, "Só " + done + " de " + total + " objetivos foram atingidos. O investidor encerrou o acordo e a confiança da diretoria caiu.");
    }
    try { hooks?.log?.("Investidor: " + d.investor, "Acordo encerrado: " + d.status + " (" + done + "/" + total + ")."); } catch (_) {}
  }

  // Acordos antigos (criados antes desta regra) passam a seguir o fim real da liga europeia.
  function migrateEuro(s, d) {
    if (d.status !== "active" || d.objectives.some((o) => o.euro)) return;
    const eu = euroLeague(s);
    if (!eu || eu.status !== "active") return;
    for (const o of d.objectives) {
      o.euro = true; o.deadlineSeason = Number(eu.season);
      if (o.type === "position") { o.status = "open"; o.progress = 0; }
      else if (o.type === "trophy" && o.status === "failed") o.status = "open";
      o.text = label(o);
    }
  }

  // Chamado quando a liga europeia do clube termina de verdade (última rodada jogada).
  function leagueFinished(s, info) {
    if (!isCoach(s)) return;
    const club = userClub(s);
    if (!club || String(club.leagueId) !== String(info?.leagueId)) return;
    const pos = (info.orderIds || []).indexOf(s.clubId) + 1 || 99;
    for (const d of deals(s)) {
      if (d.status !== "active" || !mine(s, d)) continue;
      migrateEuro(s, d);
      if (!d.objectives.some((o) => o.euro && Number(o.deadlineSeason) <= Number(info.season))) continue;
      for (const o of d.objectives) {
        if (o.status !== "open") continue;
        if (o.type === "position") o.status = pos <= o.target ? "done" : "failed";
        else if (o.type === "trophy") { if (pos === 1) o.progress++; o.status = o.progress >= o.target ? "done" : "failed"; }
        else o.status = "failed";
      }
      settle(s, d, info);
    }
  }

  // Fim da temporada: avalia posição final e títulos e fecha acordos que chegaram ao prazo.
  function seasonEnd(s, info) {
    if (!isCoach(s)) return;
    const season = Number(s.season), pos = Number(info?.pos) || 99, won = (info?.trophies || []).length;
    for (const d of deals(s)) {
      if (d.status !== "active") continue;
      if (!mine(s, d)) { d.status = "cancelled"; continue; }
      migrateEuro(s, d);
      if (d.objectives.some((o) => o.euro)) {
        // Virada do ano no meio do campeonato europeu: só acumula títulos já conquistados; a avaliação espera o fim da liga.
        for (const o of d.objectives) if (o.euro && o.type === "trophy" && o.status === "open") { o.progress += won; if (o.progress >= o.target) o.status = "done"; }
        continue;
      }
      for (const o of d.objectives) {
        if (o.status !== "open") continue;
        if (o.type === "trophy") { o.progress += won; if (o.progress >= o.target) o.status = "done"; }
        else if (o.type === "position" && pos <= o.target) o.status = "done";
        if (o.status === "open" && season >= Number(o.deadlineSeason)) o.status = "failed";
      }
      const last = Math.max(...d.objectives.map((o) => Number(o.deadlineSeason)));
      if (d.objectives.every((o) => o.status !== "open") || season >= last) {
        for (const o of d.objectives) if (o.status === "open") o.status = "failed";
        settle(s, d, info);
      }
    }
  }

  // Dia a dia: expira propostas e, de tempos em tempos, um investidor aparece.
  function daily(s) {
    if (!isCoach(s)) return null;
    const v = store(s);
    for (const d of v.deals) if (mine(s, d) && ["proposed", "negotiating"].includes(d.status) && Number(s.day) > Number(d.expiresDay)) { d.status = "expired"; d.closedDay = s.day; }
    if (Number(s.day) % 15 !== 0 || openDeals(s).length) return null;
    if (Number(s.day) - Number(v.lastProposalDay) < GAP_DAYS) return null;
    if (roll("inv-appear|" + s.season + "|" + s.day + "|" + s.clubId) > 0.35) return null;
    return propose(s);
  }

  function view(s) {
    if (!isCoach(s)) return { proposals: [], active: [], recent: [] };
    const all = deals(s).filter((d) => mine(s, d)).map((d) => ({ ...d, objectives: d.objectives.map((o) => ({ ...o, label: label(o), progressText: progressText(o) })), note: note(d), daysLeft: Math.max(0, Number(d.expiresDay) - Number(s.day)), amountText: d.amount > 0 ? brl(d.amount) : "" }));
    return { proposals: all.filter((d) => ["proposed", "negotiating"].includes(d.status)), active: all.filter((d) => d.status === "active"), recent: all.filter((d) => !OPEN.includes(d.status)).slice(0, 5), lastReply: store(s).lastReply || "" };
  }

  const api = { VERSION, propose, projectFor, activateProject, respond, onSigning, seasonEnd, leagueFinished, daily, view, openDeals, label, brl };
  root.ProLifeClubInvestors = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
