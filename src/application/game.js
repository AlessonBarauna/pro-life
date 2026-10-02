(function (root) {
  "use strict";
  const D =
    root.ProLife ||
    (typeof require === "function" ? require("../domain/engine.js") : null);
  function execute(s, action, data = {}) {
    switch (action) {
      case "buy":
        D.Career.buy(s, data.id);
        break;
      case "sell":
        D.Career.sell(s, data.id);
        break;
      case "like": {
        const post = D.Career.init(s).feed.find((p) => p.id === data.id);
        if (!post) throw Error("Publicação indisponível.");
        post.liked = !post.liked;
        post.likes += post.liked ? 1 : -1;
        break;
      }
      case "number": {
        const n = Number(data.value);
        if (!Number.isInteger(n) || n < 1 || n > 99)
          throw Error("Número inválido.");
        D.Career.init(s).number = n;
        break;
      }
      case "upgradeWorld":
        if (
          s.world !== "legacy" ||
          !D.World.clubs.some((c) => c.id === data.clubId)
        )
          throw Error("Destino inválido.");
        s.upgradeClub = data.clubId;
        break;
      case "appearance": {
        const C = root.ProLifeCharacter || require("../domain/character.js");
        s.person.appearance = C.normalize(data.appearance);
        if (C.celebrations.includes(data.celebration))
          s.person.celebration = data.celebration;
        break;
      }
      case "advance":
        D.advance(s, data.days);
        break;
      case "join": {
        const o = s.offers.find(
          (x) => x.clubId === data.id && x.expires >= s.day,
        );
        if (!o) throw Error("Esta proposta não está disponível.");
        D.join(s, o.clubId, o.salary);
        break;
      }
      case "acceptRenewal":
        D.Career.acceptRenewal(s);
        break;
      case "rejectRenewal":
        D.Career.rejectRenewal(s);
        break;
      case "counterOffer": {
        D.Career.counterOffer(s, data.id);
        break;
      }
      case "reject": {
        const index = s.offers.findIndex((x) => x.clubId === data.id && x.expires >= s.day);
        if (index < 0) throw Error("Esta proposta não está disponível.");
        const rejected = s.offers.splice(index, 1)[0];
        const c = D.club(s, rejected.clubId);
        D.Career.post(s, "Carreira", "Agente", "Proposta recusada", `A proposta de ${c?.name || "clube"} foi recusada.`);
        break;
      }
      case "agentStrategy": {
        D.Career.setAgentStrategy(s, { priority: data.priority, stance: data.stance });
        break;
      }
      case "offerPrefs": {
        const validLeagues = ["serieA", "serieB", "serieC", "serieD"];
        const leagues = Array.isArray(data.leagues) ? data.leagues.filter((x) => validLeagues.includes(x)) : [];
        if (s.world === "brazil2026" && !leagues.length) throw Error("Selecione pelo menos uma divisão.");
        const clubLevel = ["any", "elite", "competitive", "intermediate", "small"].includes(data.clubLevel) ? data.clubLevel : "any";
        D.Career.init(s).offerPreferences = { leagues, clubLevel };
        s.offers = s.offers.filter((o) => {
          const c = D.club(s, o.clubId);
          if (!c) return false;
          if (s.world === "brazil2026" && !leagues.includes(c.leagueId)) return false;
          if (clubLevel === "elite") return c.structure >= 75;
          if (clubLevel === "competitive") return c.structure >= 60 && c.structure < 75;
          if (clubLevel === "intermediate") return c.structure >= 45 && c.structure < 60;
          if (clubLevel === "small") return c.structure < 45;
          return true;
        });
        break;
      }
      case "train":
        if (
          !["balanced", ...Object.keys(D.Training.skills)].includes(data.focus) ||
          !["rest", "normal", "hard"].includes(data.intensity)
        )
          throw Error("Treino inválido.");
        s.training = data.focus;
        s.intensity = data.intensity;
        D.Training.init(s).focus = data.focus;
        D.Training.init(s).style = data.style || s.person.style;
        break;
      case "specialization":
        if (s.mode !== "player") throw Error("Especializações são da carreira de jogador.");
        D.Training.unlockSpecialization(s, data.id);
        break;
      case "tactic": {
        const c = D.club(s);
        if (s.mode !== "coach" || !c)
          throw Error("Escolha um clube como treinador.");
        if (
          !["balanced", "possession", "counter", "attack"].includes(data.value)
        )
          throw Error("Tática inválida.");
        c.tactic = data.value;
        break;
      }
      case "lineup": {
        const c = D.club(s);
        if (s.mode !== "coach" || !c)
          throw Error("A escalação é responsabilidade do treinador.");
        if (
          !Array.isArray(data.ids) ||
          data.ids.length !== 11 ||
          new Set(data.ids).size !== 11 ||
          !data.ids.every((id) =>
            c.roster.some((p) => p.id === id && !p.injury),
          ) ||
          !data.ids.some((id) =>
            c.roster.some((p) => p.id === id && p.pos === "GOL"),
          )
        )
          throw Error(
            "Selecione 11 jogadores disponíveis, incluindo um goleiro.",
          );
        c.lineup = data.ids;
        break;
      }
      case "decide":
        D.decide(s, data.choice);
        break;
      case "retire":
        D.retire(s);
        break;
      case "license": {
        if (s.mode !== "coach") throw Error("Disponível para treinadores.");
        const next = { C: "B", B: "A", A: "PRO" },
          price = { C: 2500, B: 5000, A: 10000 };
        if (!next[s.license]) throw Error("Você já possui a licença máxima.");
        if (s.wallet < price[s.license]) throw Error("Saldo insuficiente.");
        D.Career.transaction(
          s,
          -price[s.license],
          "Curso de licença " + next[s.license],
        );
        s.license = next[s.license];
        s.reputation = D.clamp(s.reputation + 3, 0, 100);
        break;
      }
      case "recruit": {
        if (!D.Career.windowStatus(s).open)
          throw Error("Janela de transferências fechada.");
        const own = D.club(s),
          source = D.club(s, data.clubId);
        if (s.mode !== "coach" || !own || !source || source.id === own.id)
          throw Error("Operação inválida.");
        const p = source.roster.find((p) => p.id === data.playerId);
        if (!p || p.id === "hero" || source.roster.length <= 18)
          throw Error("Jogador indisponível.");
        let fee = valuation(p);
        if (own.budget < fee) throw Error("Orçamento insuficiente.");
        if (D.overall(p) > own.structure + 14)
          throw Error(
            "O jogador recusou: busca um projeto com maior estrutura.",
          );
        own.budget -= fee;
        source.budget += fee;
        source.roster = source.roster.filter((x) => x.id !== p.id);
        source.lineup = source.lineup.filter((id) => id !== p.id);
        own.roster.push(p);
        D.Career.transfer(s, p, source, own, fee);
        s.news.unshift({
          day: s.day,
          season: s.season,
          title: "Reforço contratado",
          body:
            p.name +
            " foi contratado por R$ " +
            fee.toLocaleString("pt-BR") +
            ".",
        });
        break;
      }
      default:
        throw Error("Ação desconhecida.");
    }
    return s;
  }
  function valuation(p) {
    return (
      Math.round(
        (D.overall(p) ** 2 * 35 * (p.age < 23 ? 1.3 : p.age > 30 ? 0.7 : 1)) /
          1000,
      ) * 1000
    );
  }
  root.ProLifeApp = { execute, valuation };
  if (typeof module !== "undefined" && module.exports)
    module.exports = root.ProLifeApp;
})(typeof globalThis !== "undefined" ? globalThis : this);
