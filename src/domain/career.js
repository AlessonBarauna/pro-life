/* Career rules: windows, personal assets, press and the simulated news feed. */
(function (root) {
  "use strict";
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const windows = [
    { name: "Início do ano", start: 0, end: 58 },
    { name: "Meio do ano", start: 181, end: 242 },
    { name: "Final do ano", start: 318, end: 364 },
  ];
  const shop = [
    {
      id: "recovery",
      name: "Equipamento de recuperação",
      category: "Saúde",
      price: 1800,
      upkeep: 40,
      effect: "Recuperação física diária +1.",
      condition: 1,
    },
    {
      id: "bike",
      name: "Bicicleta urbana",
      category: "Mobilidade",
      price: 2500,
      upkeep: 30,
      effect: "Estresse -3 em cada fechamento mensal.",
      stress: -3,
    },
    {
      id: "car",
      name: "Carro compacto",
      category: "Veículos",
      price: 65000,
      upkeep: 650,
      effect: "Relação com a família +2 por mês.",
      family: 2,
    },
    {
      id: "sportscar",
      name: "Carro esportivo",
      category: "Veículos",
      price: 420000,
      upkeep: 2500,
      effect: "Seguidores +120 por mês.",
      fans: 120,
    },
    {
      id: "apartment",
      name: "Apartamento",
      category: "Imóveis",
      price: 280000,
      upkeep: 800,
      effect: "Estresse -6 e família +3 por mês.",
      stress: -6,
      family: 3,
    },
    {
      id: "house",
      name: "Casa com área de lazer",
      category: "Imóveis",
      price: 780000,
      upkeep: 1800,
      effect: "Estresse -10 e família +5 por mês.",
      stress: -10,
      family: 5,
    },
    {
      id: "gym",
      name: "Academia em casa",
      category: "Treino",
      price: 18000,
      upkeep: 120,
      effect: "Progresso diário de treinamento +0,15.",
      training: 0.15,
    },
  ];
  function init(s) {
    if (!s.extras)
      s.extras = {
        number: 10,
        assets: [],
        ledger: [],
        feed: [],
        transfers: [],
        promise: null,
        careerGoals: s.person.goals,
        careerMinutes: s.person.minutes,
        played: 0,
        ratingTotal: 0,
      };
    if (s.extras.postSequence === undefined) s.extras.postSequence = 0;
    if (s.careerTransferAvailableDay === undefined) {
      const club = s.clubs.find((c) => c.id === s.clubId);
      const signing = s.extras.transfers.find(
        (t) => t.player === s.person.name && t.to === club?.name,
      );
      const news = s.news.find(
        (n) =>
          n.title === "Contrato assinado" && n.body.includes(s.person.name),
      );
      s.careerTransferAvailableDay = club
        ? nextWindowDay(signing?.day ?? news?.day ?? s.day)
        : 0;
    }
    if (s.day < s.careerTransferAvailableDay) s.offers = [];
    return s.extras;
  }
  function nextWindowDay(day) {
    const year = Math.floor(day / 365) * 365,
      current = day % 365;
    const next = windows.find((w) => w.start > current);
    return next ? year + next.start : year + 365;
  }
  function canTransfer(s) {
    init(s);
    return windowStatus(s).open && s.day >= s.careerTransferAvailableDay;
  }
  function windowStatus(s) {
    const day = s.day % 365,
      w = windows.find((w) => day >= w.start && day <= w.end);
    const next = windows.find((w) => w.start > day) || windows[0];
    return {
      open: !!w,
      name: w?.name || "Janela fechada",
      remaining: w ? w.end - day + 1 : (next.start - day + 365) % 365,
      next: next.name,
    };
  }
  function post(s, category, author, title, body, kind = "confirmed") {
    const e = init(s);
    e.feed.unshift({
      id: "post_" + ++e.postSequence,
      day: s.day,
      season: s.season,
      category,
      author,
      title,
      body,
      kind,
      liked: false,
      likes: Math.floor(s.fans / 20) + category.length,
    });
    e.feed = e.feed.slice(0, 160);
  }
  function transaction(s, amount, label) {
    const e = init(s);
    s.wallet += amount;
    e.ledger.unshift({ day: s.day, season: s.season, amount, label });
    e.ledger = e.ledger.slice(0, 120);
  }
  function assetValue(s) {
    return init(s).assets.reduce(
      (sum, id) => sum + (shop.find((x) => x.id === id)?.price || 0),
      0,
    );
  }
  function upkeep(s) {
    return init(s).assets.reduce(
      (sum, id) => sum + (shop.find((x) => x.id === id)?.upkeep || 0),
      0,
    );
  }
  function buy(s, id) {
    const item = shop.find((x) => x.id === id),
      e = init(s);
    if (!item) throw Error("Item indisponível.");
    if (e.assets.includes(id)) throw Error("Você já possui este item.");
    if (s.wallet < item.price) throw Error("Saldo insuficiente.");
    transaction(s, -item.price, "Compra: " + item.name);
    e.assets.push(id);
    post(
      s,
      "Vida pessoal",
      "Sua carreira",
      "Nova aquisição",
      s.person.name +
        " comprou " +
        item.name.toLowerCase() +
        ". " +
        item.effect,
    );
  }
  function sell(s, id) {
    const item = shop.find((x) => x.id === id),
      e = init(s);
    if (!item || !e.assets.includes(id))
      throw Error("Você não possui este item.");
    e.assets = e.assets.filter((x) => x !== id);
    transaction(s, Math.round(item.price * 0.7), "Venda: " + item.name);
  }
  function daily(s) {
    const e = init(s);
    for (const id of e.assets) {
      const item = shop.find((x) => x.id === id);
      s.person.condition = clamp(
        s.person.condition + (item?.condition || 0),
        0,
        100,
      );
      if (s.mode === "player" && !s.person.injury)
        s.trainingProgress += item?.training || 0;
    }
  }
  function monthly(s) {
    for (const id of init(s).assets) {
      const item = shop.find((x) => x.id === id);
      if (!item) continue;
      transaction(s, -item.upkeep, "Manutenção: " + item.name);
      s.stress = clamp(s.stress + (item.stress || 0), 0, 100);
      s.family = clamp(s.family + (item.family || 0), 0, 100);
      s.fans = clamp(s.fans + (item.fans || 0), 0, 1e9);
    }
  }
  function match(s, m) {
    const e = init(s);
    if (m.ratings.hero) {
      e.played++;
      e.ratingTotal += m.ratings.hero;
    }
    e.careerGoals += m.events.filter(
      (x) => x.type === "goal" && x.playerId === "hero",
    ).length;
    if (m.ratings.hero) e.careerMinutes += 90;
    const own = m.home === s.clubId ? m.hg : m.ag,
      other = m.home === s.clubId ? m.ag : m.hg;
    if (e.promise) {
      e.promise.games--;
      if (own > other) e.promise.wins++;
      if (!e.promise.games) {
        const ok = e.promise.wins >= 2;
        s.reputation = clamp(s.reputation + (ok ? 4 : -3), 0, 100);
        s.board = clamp(s.board + (ok ? 5 : -7), 0, 100);
        s.person.morale = clamp(s.person.morale + (ok ? 4 : -5), 0, 100);
        s.stress = clamp(s.stress + (ok ? -5 : 8), 0, 100);
        post(
          s,
          "Imprensa",
          "Sala de imprensa",
          ok ? "Promessa cumprida" : "Cobrança pela entrevista",
          e.promise.wins +
            " vitória(s) nos últimos três jogos. " +
            (ok
              ? "A confiança aumentou."
              : "Torcida e diretoria esperavam mais."),
        );
        e.promise = null;
      }
    }
    post(
      s,
      "Torcida",
      "Arquibancada",
      own > other
        ? "Torcida celebra a vitória"
        : own < other
          ? "Torcida cobra reação"
          : "Empate divide opiniões",
      s.person.name +
        (m.ratings.hero
          ? " recebeu nota " + m.ratings.hero + "."
          : " acompanhou o jogo sem entrar em campo.") +
        " " +
        (own > other
          ? "A equipe ganhou confiança."
          : "O próximo compromisso será decisivo para a sequência."),
    );
  }
  function interview(s, choice) {
    const e = init(s);
    if (choice === "humble") {
      s.fans = clamp(s.fans + 70, 0, 1e9);
      s.stress = clamp(s.stress - 3, 0, 100);
      post(
        s,
        "Imprensa",
        "Sala de imprensa",
        "Discurso de equilíbrio",
        s.person.name +
          ": “Vamos trabalhar um jogo de cada vez.” Moral +3; reputação +1; seguidores +70.",
      );
    }
    if (choice === "bold") {
      e.promise = { games: 3, wins: 0 };
      post(
        s,
        "Imprensa",
        "Sala de imprensa",
        "Promessa diante das câmeras",
        s.person.name +
          " promete uma reação. Meta: vencer dois dos próximos três jogos. Cumprir ou falhar altera reputação, moral e confiança da diretoria.",
      );
    }
  }
  function transfer(s, p, source, target, fee) {
    const e = init(s);
    e.transfers.unshift({
      day: s.day,
      season: s.season,
      player: p.name,
      from: source?.name || "Sem clube",
      to: target.name,
      fee,
      pos: p.pos || "—",
      salary: Math.max(1000, Math.round((fee ? fee / 120 : 1000) / 100) * 100),
    });
    e.transfers = e.transfers.slice(0, 100);
    post(
      s,
      "Transferências",
      "Central do mercado",
      "Transferência confirmada",
      p.name +
        ": " +
        (source?.name || "Sem clube") +
        " → " +
        target.name +
        (fee ? " por R$ " + fee.toLocaleString("pt-BR") : "") +
        ".",
    );
  }
  function world(s, rng, D) {
    const current = D.club(s),
      leader = D.table(s, current?.leagueId)[0];
    if (leader)
      post(
        s,
        "Competições",
        "Central das ligas",
        "Disputa pela liderança",
        leader.name +
          " lidera " +
          (s.leagues?.find((l) => l.id === leader.leagueId)?.name || "Liga Horizonte") +
          " com " + leader.stats.points + " pontos após " + leader.stats.played + " jogos.",
      );
    if (!windowStatus(s).open) return;
    const desired = { GOL: 2, DEF: 8, MEI: 8, ATA: 5 };
    const attempts = rng.int(2, 5);
    for (let attempt = 0; attempt < attempts; attempt++) {
      const targets = s.clubs
        .filter((c) => c.id !== s.clubId && c.roster.length < 42)
        .map((c) => {
          const needs = Object.keys(desired)
            .map((pos) => ({ pos, gap: Math.max(0, desired[pos] - c.roster.filter((p) => p.pos === pos).length) }))
            .filter((x) => x.gap > 0);
          return { c, needs };
        })
        .filter((x) => x.needs.length);
      if (!targets.length) break;
      const targetInfo = rng.pick(targets),
        need = rng.pick(targetInfo.needs),
        target = targetInfo.c;
      const sources = s.clubs.filter((c) => c.id !== target.id && c.id !== s.clubId && c.roster.length > 20);
      const candidates = sources.flatMap((source) =>
        source.roster
          .filter((p) => p.id !== "hero" && p.pos === need.pos && source.roster.filter((x) => x.pos === need.pos).length > Math.max(1, desired[need.pos] - 1))
          .filter((p) => target.structure + 16 >= D.overall(p))
          .map((p) => ({ source, p })),
      );
      if (!candidates.length) continue;
      const { source, p } = rng.pick(candidates),
        fee = Math.round((D.overall(p) ** 2 * 35 * (p.age < 23 ? 1.25 : p.age > 30 ? 0.72 : 1)) / 1000) * 1000;
      if (target.budget < fee) continue;
      source.roster = source.roster.filter((x) => x.id !== p.id);
      source.lineup = source.lineup.filter((x) => x !== p.id);
      target.roster.push(p);
      source.budget += fee;
      target.budget -= fee;
      transfer(s, p, source, target, fee);
    }
  }
  function rumor(s, rng) {
    const clubs = s.clubs.filter((c) => c.id !== s.clubId);
    if (!clubs.length) return;
    post(
      s,
      "Rumores",
      "Rádio do mercado",
      "Nome nos bastidores",
      rng.pick(clubs).name +
        " observa o perfil de " +
        s.person.name +
        ". Nenhum acordo foi confirmado.",
      "rumor",
    );
  }
  const api = {
    init,
    windows,
    shop,
    windowStatus,
    nextWindowDay,
    canTransfer,
    post,
    transaction,
    assetValue,
    upkeep,
    buy,
    sell,
    daily,
    monthly,
    match,
    interview,
    transfer,
    world,
    rumor,
  };
  root.ProLifeCareer = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
