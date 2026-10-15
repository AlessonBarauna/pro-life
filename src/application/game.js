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
        if (D.NationalCallups?.blocker?.(s)) throw Error("Reconheça a convocação pendente antes de continuar.");
        D.advance(s, data.days);
        break;
      case "acknowledgeCallup":
        return D.NationalCallups.acknowledge(s, data.id);
      case "simulateAdvance":
        return D.simulateAdvance(s, data.mode);
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
      case "requestRenewal":
        D.Career.requestRenewal(s);
        break;
      case "counterRenewal":
        D.Career.counterRenewal(s, data);
        break;
      case "rejectRenewal":
        D.Career.rejectRenewal(s);
        break;
      case "counterOffer": {
        D.Career.counterOffer(s, data.id);
        break;
      }
      case "reject": D.Career.rejectOffer(s,data.id); break;
      case "holdOffer": D.Career.holdOffer(s,data.id); break;
      case "hireAgency": D.Career.hireAgency(s,data.id); break;
      case "dismissAgency": D.Career.dismissAgency(s); break;
      case "rejectAgencyOffer": D.Career.rejectAgencyOffer(s,data.id); break;
      case "agentStrategy": {
        D.Career.setAgentStrategy(s, { priority: data.priority, stance: data.stance });
        break;
      }
      case "targetClub":
        D.Career.setTargetClub(s, data.clubId); break;
      case "clearTargetClub":
        D.Career.clearTargetClub(s); break;
      case "offerPrefs": {
        const validLeagues = ["serieA", "serieB", "serieC", "serieD"];
        const leagues = Array.isArray(data.leagues) ? data.leagues.filter((x) => validLeagues.includes(x)) : [];
        const hasInternational=typeof data.international==="boolean";
        const international=hasInternational?data.international:false;
        if (s.world === "brazil2026" && !leagues.length && !international) throw Error("Selecione pelo menos uma divisão ou clubes internacionais.");
        const clubLevel = ["any", "elite", "competitive", "intermediate", "small"].includes(data.clubLevel) ? data.clubLevel : "any";
        const nextPreferences={leagues,clubLevel};
        if(hasInternational) nextPreferences.international=international;
        else Object.defineProperty(nextPreferences,"international",{value:false,writable:true,configurable:true,enumerable:false});
        D.Career.init(s).offerPreferences = nextPreferences;
        s.offers = s.offers.filter((o) => {
          const c = D.club(s, o.clubId);
          if (!c) return false;
          const local=(s.clubs||[]).some(item=>item.id===c.id);
          if(local&&s.world==="brazil2026"&&!leagues.includes(c.leagueId)) return false;
          if(!local&&!international) return false;
          const level=Number(c.structure??c.strength??c.reputation??50);
          if (clubLevel === "elite") return level >= 75;
          if (clubLevel === "competitive") return level >= 60 && level < 75;
          if (clubLevel === "intermediate") return level >= 45 && level < 60;
          if (clubLevel === "small") return level < 45;
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
        {
          const plan = D.Training.init(s);
          const nextExercise = data.exerciseId !== undefined ? (data.exerciseId || null) : plan.exerciseId;
          if (nextExercise && !D.Training.exercises[nextExercise]) throw Error("Exercício inválido.");
          const changed = plan.focus !== data.focus || s.intensity !== data.intensity || plan.exerciseId !== nextExercise;
          s.training = data.focus;
          s.intensity = data.intensity;
          plan.focus = data.focus;
          plan.style = data.style || s.person.style;
          plan.exerciseId = nextExercise;
          if (s.mode === "player" && nextExercise) {
            // Alterar o plano após a sessão do dia apenas salva a nova rotina.
            // Não concede XP, não consome condição e não cria uma segunda sessão manual.
            if (s.day <= Math.max(Number(plan.lastTrainingDay) || 0, Number(plan.lastAutoDay) || 0) && changed) return { planUpdated: true, trained: false };
            const rng = new D.Random(s.rng);
            const result = D.Training.performTraining(s, rng, { overall: D.overall, clamp: D.clamp });
            D.Squad?.trainingResult?.(s, result);
            s.rng = rng.state;
            if (!result.available) throw Error(result.reason || "Treino indisponível.");
          }
        }
        break;
      case "specialization":
        if (s.mode !== "player") throw Error("Especializações são da carreira de jogador.");
        D.Training.unlockSpecialization(s, data.id);
        break;
      case "activateSpecialization":
        if (s.mode !== "player") throw Error("Especializações são da carreira de jogador.");
        D.Training.activateSpecialization(s, data.id);
        break;
            case "unlockArchetypePerk":
        if (s.mode !== "player")
          throw Error("Perks de arqu\u00e9tipo s\u00e3o da carreira de jogador.");
        D.Training.unlockArchetypePerk(s, data.id);
        break;

      case "activateArchetypePerk":
        if (s.mode !== "player")
          throw Error("Perks de arqu\u00e9tipo s\u00e3o da carreira de jogador.");
        D.Training.activateArchetypePerk(s, data.id);
        break;

      case "deactivateArchetypePerk":
        if (s.mode !== "player")
          throw Error("Perks de arqu\u00e9tipo s\u00e3o da carreira de jogador.");
        D.Training.deactivateArchetypePerk(s, data.id);
        break;

      case "startCoachConversation":
        if(s.mode!=="player")
          throw Error("Dispon\u00edvel apenas para carreira de jogador.");
        return D.Squad.startCoachConversation(s);

      case "respondCoachConversation":
        if(s.mode!=="player")
          throw Error("Dispon\u00edvel apenas para carreira de jogador.");
        return D.Squad.respondCoachConversation(s,data.choiceId);
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
      case "markMessageRead":
        D.Career.markMessageRead(s, data.id);
        break;
      case "respondInterview":
        D.Career.respondInterview(s, data.id, data.choice);
        break;
      case "decide":
        D.decide(s, data.choice);
        break;
      case "physicalReturn":
        D.Physical.chooseReturn(s.person, s.day, data.choice);
        break;
      case "lifeActivity":
        D.Life.activity(s, data.id, D.Career);
        break;
      case "lifeHousing":
        D.Life.buyHousing(s, data.id, D.Career);
        break;
      case "lifeVehicle":
        D.Life.buyVehicle(s, data.id, D.Career);
        break;
      case "lifeSellVehicle":
        D.Life.sellVehicle(s, data.id, D.Career);
        break;
      case "lifeInvest":
        D.Life.invest(s, data.id, data.amount, D.Career);
        break;
      case "lifePurchase":
        D.Life.buyPurchase(s, data.id, D.Career);
        break;
      case "lifeLifestyle":
        D.Life.setLifestyle(s, data.value);
        break;
      case "commercialAccept":
        D.Commercial.accept(s, data.id, D.Career, D);
        break;
      case "commercialReject":
        D.Commercial.reject(s, data.id, D.Career, D);
        break;
      case "commercialHold":
        D.Commercial.hold(s, data.id, D.Career, D);
        break;
      case "commercialNegotiate":
        return D.Commercial.negotiate(s, data.id, data, D.Career, D);
      case "commercialEvent":
        return D.Commercial.eventAction(s, data.id, data.choice, D.Career, D);
      case "retire":
        D.retire(s);
        break;
      case "offFieldPost":
        D.OffField.post(s, D, data.kind);
        break;
      case "offFieldContact":
        D.OffField.cultivate(s, D, data.id);
        break;
      case "offFieldFamily":
        D.OffField.resolve(s, D, Number(data.choice), false);
        break;
      case "coachTalk": {
        if (s.mode !== "coach") throw Error("Disponível para treinadores.");
        D.CoachCareer.talk(s, D, data.kind, data.playerId);
        break;
      }
      case "coachCaptain": {
        if (s.mode !== "coach") throw Error("Disponível para treinadores.");
        D.CoachCareer.setCaptain(s, D, data.playerId || null);
        break;
      }
      case "coachFocus": {
        if (s.mode !== "coach") throw Error("Disponível para treinadores.");
        D.CoachCareer.setFocus(s, data.focus);
        break;
      }
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
      case "rejectCoachDeal": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const n=s.coachCareer?.negotiations?.find(n=>n.id===data.id && n.status==="pending");
        if(!n)throw Error("Proposta indisponível.");
        n.status="rejected";n.closedDay=s.day;
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Negociação recusada",body:"Proposta recusada pelo treinador."});
        break;
      }
      case "acceptCoachDeal": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const n=s.coachCareer?.negotiations?.find(n=>n.id===data.id && n.status==="pending");
        if(!n||s.day>n.expiresDay||n.buyerClubId!==s.clubId)throw Error("Proposta expirada ou indisponível.");
        return execute(s,"recruit",{clubId:n.sellerClubId,playerId:n.playerId,paymentPlan:data.paymentPlan==="split"?"split":"upfront",dealType:"permanent"});
      }
      case "reviseCoachDeal": {
        if(s.mode!=="coach"||!D.Career.windowStatus(s).open)throw Error("Mercado de transferências fechado.");
        const n=s.coachCareer?.negotiations?.find(x=>x.id===data.id&&x.status==="pending");
        if(!n||n.buyerClubId!==s.clubId||Number(s.day)>Number(n.expiresDay))throw Error("Negociação expirada ou indisponível.");
        if((n.round||1)>=3)throw Error("Limite de três rodadas atingido.");
        const buyer=D.club(s,n.buyerClubId),seller=D.club(s,n.sellerClubId);
        const p=seller?.roster?.find(x=>x.id===n.playerId);
        if(!buyer||!p||seller.roster.length<=18)throw Error("Jogador não está mais disponível.");
        const offer=Number(data.offer);
        if(!Number.isSafeInteger(offer)||offer<1000||offer>100000000000)throw Error("Valor da proposta inválido.");
        const base=valuation(p)*(s.coachCareer?.settings?.marketStrictness==="strict"?1.25:1);
        const threshold=Math.ceil(base*(0.9+Math.min(n.round||1,2)*0.025)/1000)*1000;
        const accepted=offer>=threshold;
        const finalFee=accepted?offer:Math.ceil(base*(1+Math.min(n.round||1,2)*0.025)/1000)*1000;
        n.history ||= [{round:1,day:n.day??s.day,offered:n.requested,response:n.finalFee,accepted:n.requested>=n.finalFee}];
        n.round=(n.round||1)+1;
        n.requested=offer;n.finalFee=finalFee;n.response=accepted?"accepted":"counter";
        n.expiresDay=s.day+7;
        n.history.push({round:n.round,day:s.day,offered:offer,response:finalFee,accepted});
        (s.news||[]).unshift({day:s.day,season:s.season,title:accepted?"Oferta aceita pelo clube":"Nova contraproposta do clube",body:p.name+" · "+finalFee.toLocaleString("pt-BR")+"."});
        return s;
      }
      case "counterRecruit": {
        if(s.mode!=="coach"||!D.Career.windowStatus(s).open)throw Error("Negociação indisponível.");
        const buyer=D.club(s),seller=D.club(s,data.clubId);
        const p=seller?.roster?.find(x=>x.id===data.playerId);
        if(!buyer||!seller||buyer.id===seller.id||!p||p.id==="hero")throw Error("Jogador indisponível.");
        const base=valuation(p)*(s.coachCareer?.settings?.marketStrictness==="strict"?1.25:1);
        const requested=Number(data.offer);
        if(!Number.isFinite(requested)||requested<=0)throw Error("Proposta inválida.");
        const minimum=Math.ceil(base*0.9/1000)*1000;
        s.coachCareer ||= {version:1};
        s.coachCareer.negotiations ||= [];
        s.coachCareer.negotiations=s.coachCareer.negotiations.filter(n=>!(n.playerId===p.id&&n.buyerClubId===buyer.id&&n.status==="pending"));
        const accepted=requested>=minimum;
        const finalFee=accepted?Math.ceil(requested/1000)*1000:Math.ceil(base/1000)*1000;
        const entry={id:"neg_"+s.season+"_"+s.day+"_"+p.id,day:s.day,playerId:p.id,sellerClubId:seller.id,buyerClubId:buyer.id,requested,finalFee,status:"pending",round:1,response:accepted?"accepted":"counter",expiresDay:s.day+7,history:[{round:1,day:s.day,offered:requested,response:finalFee,accepted}]};
        s.coachCareer.negotiations.push(entry);
        (s.news||[]).unshift({day:s.day,season:s.season,title:accepted?"Proposta aceita":"Contraproposta recebida",body:accepted?"O clube aceitou R$ "+finalFee.toLocaleString("pt-BR")+".":"O clube pede R$ "+finalFee.toLocaleString("pt-BR")+" pelo atleta."});
        return s;
      }
      case "buyLoan": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const loan=s.coachCareer?.loans?.find(l=>l.id===data.loanId&&!l.returned&&!l.purchased);
        if(!loan||loan.toClubId!==s.clubId||Number(s.day)>=loan.dueDay)throw Error("Empréstimo indisponível para compra.");
        if(!Number.isFinite(loan.buyOption)||loan.buyOption<=0)throw Error("Este empréstimo não possui opção de compra.");
        const buyer=D.club(s,loan.toClubId),seller=D.club(s,loan.fromClubId);
        const player=buyer?.roster?.find(p=>p.id===loan.playerId);
        if(!player||!seller||Number(buyer.budget)<loan.buyOption)throw Error("Saldo ou jogador indisponível.");
        buyer.budget-=loan.buyOption;seller.budget=(Number(seller.budget)||0)+loan.buyOption;
        loan.purchased=true;loan.purchaseDay=s.day;loan.returned=true;
        D.Career.transfer(s,player,seller,buyer,loan.buyOption);
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Opção de compra exercida",body:player.name+" foi contratado em definitivo."});
        return s;
      }
      case "recruit": {
        const rules=s.mode==="coach"?s.coachCareer?.settings:null;
        if(rules?.firstWindow==="off" && Number(s.day||0)>=Number(rules.firstWindowStartDay||0) && Number(s.day||0)<59)
          throw Error("Primeira janela de transferências desativada nas configurações da carreira.");
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
        if(rules?.marketStrictness==="strict")fee=Math.ceil(fee*1.25/1000)*1000;
        const isLoan=data.dealType==="loan";
        if(isLoan && rules?.loans!=="on")throw Error("Empréstimos não estão habilitados nesta carreira.");
        const duration=Number(data.loanDays||180);
        if(isLoan&&![180,365].includes(duration))throw Error("Prazo de empréstimo inválido.");
        const sellOn=Number(data.sellOn||0);
        if(!isLoan&&![0,10,20].includes(sellOn))throw Error("Cláusula de revenda inválida.");
        if(isLoan && (s.coachCareer?.loans||[]).some(l=>l.playerId===p.id&&!l.returned))throw Error("O atleta já está emprestado.");
        const salaryShare=isLoan?Number(data.salaryShare??50):0;
        if(isLoan&&![0,50,100].includes(salaryShare))throw Error("Divisão salarial inválida.");
        const optionPrice=isLoan&&data.buyOption==="on"?Math.ceil(valuation(p)*1.1/1000)*1000:0;
        const plan=rules?.installments==="on"&&data.paymentPlan==="split"&&!isLoan?"split":"upfront";
        if(isLoan)fee=Math.ceil(fee*0.08*(duration/180)/1000)*1000;
        const negotiation=!isLoan?s.coachCareer?.negotiations?.find(n=>n.playerId===p.id&&n.sellerClubId===source.id&&n.buyerClubId===own.id&&n.status==="pending"&&n.expiresDay>=s.day):null;
        if(negotiation)fee=negotiation.finalFee;
        const due=plan==="split"?Math.floor(fee/2):0,upfront=fee-due;
        if (own.budget < upfront) throw Error("Orçamento insuficiente para a entrada.");
        // The deferred half becomes a persistent financial obligation, not free money.
        if (D.overall(p) > own.structure + (rules?.marketStrictness==="strict"?7:14))
          throw Error(
            "O jogador recusou: busca um projeto com maior estrutura.",
          );
        if(negotiation)negotiation.status="accepted";
        own.budget -= upfront;
        source.budget = (Number(source.budget)||0) + upfront;
        // Pay the previous selling club its agreed percentage from proceeds
        // of a later permanent sale. Loan fees do not trigger this clause.
        if(!isLoan&&Array.isArray(s.coachCareer?.sellOnClauses)){
          for(const clause of s.coachCareer.sellOnClauses){
            if(!clause.active||clause.playerId!==p.id||clause.buyerClubId!==source.id)continue;
            const beneficiary=D.club(s,clause.sellerClubId);
            if(beneficiary&&beneficiary.id!==source.id&&beneficiary.id!==own.id){
              const share=Math.floor(fee*clause.percentage/100);
              source.budget-=share;
              beneficiary.budget=(Number(beneficiary.budget)||0)+share;
            }
            clause.active=false;
          }
        }
        if(due){
          if(!s.coachCareer)s.coachCareer={version:1};
          if(!Array.isArray(s.coachCareer.transferDebts))s.coachCareer.transferDebts=[];
          s.coachCareer.transferDebts.push({id:"coach_debt_"+s.season+"_"+s.day+"_"+p.id,sourceClubId:source.id,buyerClubId:own.id,playerId:p.id,amount:due,dueDay:(Number(s.day)||0)+180,paid:false});
        }
        source.roster = source.roster.filter((x) => x.id !== p.id);
        source.lineup = source.lineup.filter((id) => id !== p.id);
        own.roster.push(p);
        if(isLoan){
          s.coachCareer.loans ||= [];
          s.coachCareer.loans.push({id:"loan_"+s.season+"_"+s.day+"_"+p.id,playerId:p.id,fromClubId:source.id,toClubId:own.id,startDay:Number(s.day)||0,dueDay:(Number(s.day)||0)+duration,fee,salaryShare,buyOption:optionPrice,nextSalaryDay:(Number(s.day)||0)+30,returned:false});
        }else if(sellOn){
          s.coachCareer.sellOnClauses ||= [];
          s.coachCareer.sellOnClauses.push({playerId:p.id,buyerClubId:own.id,sellerClubId:source.id,percentage:sellOn,active:true});
        }
        D.Career.transfer(s, p, source, own, fee);
        s.news.unshift({
          day: s.day,
          season: s.season,
          title: isLoan ? "Jogador contratado por empréstimo" : "Reforço contratado",
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
