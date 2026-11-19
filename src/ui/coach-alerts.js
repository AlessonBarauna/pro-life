(function (root) {
  "use strict";
  // Alertas em pop-up do treinador: olheiro concluído, proposta por jogador do elenco, resposta de sondagem,
  // lesão, suspensão, convocação da seleção e proposta de investidor. Cada alerta tem uma chave estável; a lista
  // de chaves já mostradas fica no save (coachCareer.alertsSeen) e a primeira leitura de um save só registra o que
  // já existia, sem inundar a tela.
  const brl = (v) => { const n = Number(v) || 0, a = Math.abs(n); return a >= 1e9 ? "R$ " + (a / 1e9).toFixed(2).replace(".", ",") + " bi" : a >= 1e6 ? "R$ " + (a / 1e6).toFixed(1).replace(".", ",") + " mi" : "R$ " + Math.round(a).toLocaleString("pt-BR"); };
  const daysOf = (v) => v && typeof v === "object" ? Number(v.daysLeft ?? v.days ?? 0) : Number(v) || 0;
  const list = (a) => a.length <= 3 ? a.join(", ") : a.slice(0, 3).join(", ") + " e mais " + (a.length - 3);

  function scan(s, D) {
    const c = s && s.mode === "coach" ? s.coachCareer : null;
    if (!c || !s.clubId) return [];
    const out = [], day = Number(s.day) || 0, GF = D.GlobalFootball;
    let club = null; try { club = D.club(s, s.clubId); } catch (e) { club = null; }
    const roster = club?.roster || [];
    const pname = (id) => GF?.playerById?.(s, id)?.name || roster.find((p) => String(p.id) === String(id))?.name || "um jogador";
    const cname = (id) => { try { return (GF?.clubById?.(s, id) || D.club(s, id))?.name || "Um clube"; } catch (e) { return "Um clube"; } };

    for (const o of c.saleOffers || []) {
      if (o.status !== "pending" || String(o.sellerClubId) !== String(s.clubId)) continue;
      if (Number.isFinite(Number(o.expiresDay)) && day > Number(o.expiresDay)) continue;
      const fee = o.fee ?? o.offer ?? o.amount ?? o.price;
      out.push({ key: "offer:" + o.id, title: "Proposta por " + pname(o.playerId),
        message: cname(o.buyerClubId) + " quer comprar " + pname(o.playerId) + (Number(fee) > 0 ? " por " + brl(fee) : "") + ". Aceite, recuse ou negocie em Mercado > Negociações.",
        label: "Responder proposta", go: { page: "market", tab: "negociacoes" } });
    }
    const scouts = (c.scoutingV2?.missions || []).filter((m) => m.status === "complete");
    if (scouts.length) {
      const fresh = scouts.map((m) => ({ k: "scout:m:" + m.id, n: pname(m.playerId) }));
      out.push({ group: true, keys: fresh.map((x) => x.k), title: fresh.length > 1 ? "Relatórios dos olheiros prontos" : "Relatório do olheiro pronto",
        message: "A pesquisa terminou: " + list(fresh.map((x) => x.n)) + ". Veja o relatório em Mercado > Scouting.", label: "Ver relatório", go: { page: "market", tab: "scout" } });
    }
    const youth = (c.youth?.missions || []).filter((m) => m.status === "complete");
    if (youth.length) out.push({ group: true, keys: youth.map((m) => "scout:y:" + m.id), title: youth.length > 1 ? "Relatórios da base prontos" : "Relatório da base pronto",
      message: "A pesquisa dos olheiros da base terminou. Veja em Academia > Relatórios.", label: "Abrir academia", go: { page: "academy" } });
    for (const i of c.inquiries || []) {
      if (String(i.buyerClubId) !== String(s.clubId) || i.dismissed || !["accepted", "asking_price", "rejected"].includes(i.status)) continue;
      const nm = pname(i.playerId), rej = i.status === "rejected";
      out.push({ key: "inq:" + i.id + ":" + i.status, title: rej ? "Sondagem recusada: " + nm : i.status === "asking_price" ? "O clube pediu um valor por " + nm : "Sondagem aceita: " + nm,
        message: rej ? cname(i.sellerClubId) + " não tem interesse em negociar " + nm + " agora." : "A resposta saiu: o clube aceitou conversar sobre " + nm + ". Abra a negociação para fazer a proposta.",
        label: rej ? "Ver sondagens" : "Negociar contratação", go: rej ? { page: "market", tab: "negociacoes" } : { page: "market", list: "sondagens", playerId: i.playerId } });
    }
    const inj = [], sus = [];
    for (const p of roster) {
      if (!p || p.id === "hero") continue;
      const d = daysOf(p.injury); if (d > 0) inj.push({ k: "inj:" + p.id + ":" + (day + d), n: p.name + " (" + d + " d)" });
      const z = Number(p.suspension) || 0; if (z > 0) sus.push({ k: "sus:" + p.id + ":" + (day + z), n: p.name + " (" + z + " jogo" + (z > 1 ? "s" : "") + ")" });
    }
    if (inj.length) out.push({ group: true, keys: inj.map((x) => x.k), title: inj.length > 1 ? "Jogadores lesionados" : "Jogador lesionado", message: list(inj.map((x) => x.n)) + ". Quem estiver fora é trocado na escalação; ajuste como preferir.", label: "Abrir elenco", go: { page: "squad" } });
    if (sus.length) out.push({ group: true, keys: sus.map((x) => x.k), title: sus.length > 1 ? "Jogadores suspensos" : "Jogador suspenso", message: list(sus.map((x) => x.n)) + " não pode(m) jogar. Ajuste a escalação.", label: "Abrir elenco", go: { page: "squad" } });
    const cu = s.coachNational?.teamId ? s.coachNational.callup : null;
    if (cu && cu.status === "open") out.push({ key: "nat:" + cu.first + ":" + cu.label, title: "Convocação da seleção aberta", message: "Monte a lista para " + cu.label + " e confirme até o dia " + cu.deadline + ".", label: "Convocar", go: { page: "national" } });
    for (const d of c.investors?.deals || []) {
      if (d.status !== "proposed" || String(d.clubId) !== String(s.clubId)) continue;
      out.push({ key: "inv:" + d.id, title: "Proposta de investidor: " + d.investor, message: d.investor + " quer investir " + brl(d.amount) + " no clube em troca de metas. Veja em Finanças > Investidores.", label: "Ver proposta", attrs: "data-sm27-finance-investors" });
    }
    return out;
  }

  // Devolve só os alertas ainda não mostrados e marca as chaves como vistas. Primeira leitura: apenas registra.
  function fresh(s, D) {
    const c = s?.coachCareer; if (!c) return [];
    const all = scan(s, D), keysOf = (a) => a.group ? a.keys : [a.key];
    const first = !Array.isArray(c.alertsSeen);
    const seen = new Set(first ? [] : c.alertsSeen), out = [];
    for (const a of all) {
      const ks = keysOf(a), todo = ks.filter((k) => !seen.has(k));
      if (!todo.length) continue;
      todo.forEach((k) => seen.add(k));
      if (!first) out.push(a);
    }
    c.alertsSeen = [...seen].slice(-500);
    return out;
  }

  const api = { scan, fresh };
  root.ProLifeCoachAlerts = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
