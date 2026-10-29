(function (root) {
  "use strict";
  const D =
    root.ProLife ||
    (typeof require === "function" ? require("../domain/engine.js") : null);
  const PlayerEconomy=root.ProLifePlayerEconomy||(typeof require==="function"?require("../domain/player-economy.js"):null);
  const ClubFinance=root.ProLifeClubFinance||(typeof require==="function"?require("../domain/club-finance.js"):null);
  function queueCoachPresentation(s,p,from,to,fee,type){
    if(s.mode!=="coach"||to?.id!==s.clubId||!p?.id)return;
    s.coachCareer||={version:1};
    const entries=s.coachCareer.presentations||=[];
    const id=["signing",s.season,s.day,to.id,p.id].join("_");
    if(entries.some(x=>x.id===id))return;
    entries.push({id,playerId:p.id,playerName:p.name,fromClubId:from?.id||null,fromClubName:from?.name||"Sem clube",toClubId:to.id,toClubName:to.name,fee,type,day:s.day,season:s.season,overall:p.overall??p.ovr??null,position:p.pos||p.position||null,age:p.age??null,presented:false});
    s.coachCareer.presentations=entries.slice(-100);
  }
  function execute(s, action, data = {}) {
    switch (action) {
      case "ackCoachPresentation": {
        if(s.mode!=="coach")throw Error("Disponível somente no modo treinador.");
        const entry=s.coachCareer?.presentations?.find(x=>x.id===data.id&&x.toClubId===s.clubId);
        if(!entry)throw Error("Apresentação indisponível.");
        entry.presented=true;entry.presentedDay=s.day;
        break;
      }
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
        if (s.mode !== "player")
          throw Error("O treino individual pertence à carreira de jogador. No modo treinador, defina o foco coletivo da equipe.");
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
      case "coachTacticPreset": {
        const club=D.club(s);
        if(s.mode!=="coach"||!club)throw Error("Predefinições exclusivas do treinador.");
        const slot=Number(data.slot);
        if(!Number.isInteger(slot)||slot<1||slot>3)throw Error("Slot tático inválido.");
        s.coachCareer||={version:1};
        const presets=s.coachCareer.tacticPresets||={};
        const clubPresets=presets[club.id]||={};
        if(data.operation==="save"){
          const settings=club.coachTactics||s.coachCareer.teamTactics;
          if(!settings)throw Error("Salve primeiro uma tática.");
          const name=String(data.name||"Plano "+slot).trim().slice(0,30);
          clubPresets[slot]={name,settings:{...settings}};
        }else if(data.operation==="load"){
          const saved=clubPresets[slot];
          if(!saved)throw Error("Predefinição não encontrada.");
          execute(s,"coachTeamTactics",{...saved.settings});
        }else throw Error("Operação inválida.");
        break;
      }
      case "coachTeamTactics": {
        const club=D.club(s);
        if(s.mode!=="coach"||!club)throw Error("Táticas exclusivas do treinador.");
        const style=String(data.style||"balanced");
        const pressing=String(data.pressing||"balanced");
        const buildup=String(data.buildup||"balanced");
        const width=Number(data.width),depth=Number(data.depth);
        if(!["balanced","possession","counter","attack"].includes(style)||
           !["low","balanced","high"].includes(pressing)||
           !["short","balanced","direct"].includes(buildup)||
           !Number.isSafeInteger(width)||width<20||width>80||
           !Number.isSafeInteger(depth)||depth<20||depth>80)
          throw Error("Configuração tática inválida.");
        s.coachCareer||={version:1};
        s.coachCareer.teamTactics={style,pressing,buildup,width,depth};
        club.tactic=style;
        club.coachTactics={style,pressing,buildup,width,depth};
        break;
      }
      case "coachDevelopmentPlan": {
        const club=D.club(s);
        if(s.mode!=="coach"||!club)throw Error("Plano disponível apenas ao treinador.");
        const p=club.roster?.find(x=>x.id===data.playerId);
        if(!p)throw Error("Jogador indisponível.");
        const focus=String(data.focus||"");
        const plans=["equilibrado","velocidade","finalizacao","criacao","marcacao","fisico"];
        if(!plans.includes(focus))throw Error("Plano de desenvolvimento inválido.");
        p.developmentPlan={focus,startDay:Number(s.day)||0,source:"manager"};
        break;
      }
      case "coachPlayerRole": {
        const club=D.club(s);
        if(s.mode!=="coach"||!club)throw Error("Funções disponíveis apenas ao treinador.");
        const player=club.roster?.find(p=>p.id===data.playerId);
        if(!player)throw Error("Jogador não pertence ao elenco.");
        const roles={
          GOL:["traditional","sweeper"],ZAG:["defender","ball_playing","stopper"],
          LE:["fullback","wingback","inverted"],LD:["fullback","wingback","inverted"],DEF:["defender","ball_playing","stopper"],
          VOL:["holding","deep_playmaker","box_to_box"],MC:["box_to_box","playmaker","holding"],
          MEI:["playmaker","advanced","shadow"],ME:["wide","winger","playmaker"],MD:["wide","winger","playmaker"],
          PE:["winger","inside_forward","wide_playmaker"],PD:["winger","inside_forward","wide_playmaker"],
          ATA:["poacher","false_nine","target"],CA:["poacher","false_nine","target"]
        };
        const position=String(data.position||player.pos||"").toUpperCase();
        if(!roles[position]?.includes(data.role))throw Error("Função incompatível com a posição escolhida.");
        s.coachCareer||={version:1};
        s.coachCareer.playerRoles||={};
        s.coachCareer.playerRoles[player.id]={position,role:data.role};
        club.coachPlayerRoles||={};
        club.coachPlayerRoles[player.id]={position,role:data.role};
        break;
      }
      case "coachFormation": {
        const c=D.club(s);
        if(s.mode!=="coach"||!c)throw Error("Formação exclusiva do treinador.");
        if(!["4-3-3","4-4-2","4-2-3-1"].includes(data.value))throw Error("Formação inválida.");
        c.formation=data.value;
        if(s.coachCareer){delete s.coachCareer.pitchSlots;delete s.coachCareer.pitchFormation;}
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
      case "coachDecideSponsorship": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const economy=root.ProLifeClubEconomy;
        const brands=root.ProLifeCommercial?.brands;
        if(!economy?.decideSponsorship||!Array.isArray(brands))throw Error("Catálogo de patrocínios indisponível.");
        economy.decideSponsorship(s,D.club(s),brands,String(data.offerId||""),String(data.decision||""),data.amount);
        break;
      }
      case "coachAcceptSponsorship": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const club=D.club(s);
        const economy=root.ProLifeClubEconomy;
        const brands=root.ProLifeCommercial?.brands;
        if(!economy?.acceptSponsorshipOffer||!Array.isArray(brands))throw Error("Catálogo de patrocínios indisponível.");
        economy.acceptSponsorshipOffer(s,club,brands,String(data.offerId||""));
        break;
      }
      case "coachMarketDifficulty": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const difficulty=String(data.difficulty||"");
        if(!["flexible","normal","strict"].includes(difficulty))throw Error("Rigor de negociação inválido.");
        s.coachCareer||={version:1};
        s.coachCareer.settings||={};
        s.coachCareer.settings.marketStrictness=difficulty;
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
        const n=s.coachCareer?.negotiations?.find(n=>n.id===data.id && n.status==="pending"&&(!Number.isFinite(Number(n.expiresDay))||Number(s.day)<=Number(n.expiresDay)));
        if(!n)throw Error("Proposta indisponível.");
        n.status="rejected";n.closedDay=s.day;
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Negociação recusada",body:"Proposta recusada pelo treinador."});
        break;
      }
      case "negotiateCoachContract": {
        if(s.mode!=="coach")throw Error("Disponível apenas ao treinador.");
        const n=s.coachCareer?.negotiations?.find(x=>x.id===data.id&&x.buyerClubId===s.clubId&&x.status==="pending");
        if(!n||Number(s.day)>Number(n.expiresDay))throw Error("Negociação indisponível.");
        if(n.response!=="accepted")throw Error("Acerte primeiro a transferência com o clube.");
        const seller=D.club(s,n.sellerClubId);
        const player=seller?.roster?.find(x=>x.id===n.playerId)||D.GlobalFootball?.playerById?.(s,n.playerId);
        if(!player)throw Error("Jogador indisponível.");
        const years=Number(data.years),salary=Number(data.salary),bonus=Number(data.bonus);
        const role=String(data.role||"rotation");
        if(!Number.isSafeInteger(years)||years<1||years>5||!Number.isSafeInteger(salary)||salary<1000||salary>100000000||!Number.isSafeInteger(bonus)||bonus<0||bonus>100000000||!["rotation","important","starter","star"].includes(role))
          throw Error("Condições contratuais inválidas.");
        const previous=n.contractOffer;
        if(previous?.status==="accepted")throw Error("Contrato já acordado.");
        if((previous?.round||0)>=3)throw Error("Limite de rodadas contratuais atingido.");
        const requirements=coachContractRequirements(player,buyerOrCurrentClub(s,n),seller,role,years);
        const required=requirements.requiredSalary;
        // Bonus reduces the monthly asking price only within a capped range.
        // This keeps a signing bonus from replacing a viable recurring wage.
        const bonusCredit=Math.min(Math.floor(required*0.15),Math.floor(bonus/Math.max(1,years*12)));
        const accepted=salary+bonusCredit>=required;
        const round=(previous?.round||0)+1;
        n.contractOffer={round,status:accepted?"accepted":round>=3?"rejected":"counter",salary,years,bonus,role,requiredSalary:required,history:[...(previous?.history||[]),{round,day:s.day,salary,years,bonus,role,accepted}]};
        (s.news||[]).unshift({day:s.day,season:s.season,title:accepted?"Contrato acordado":"Resposta do agente",body:accepted?"O jogador aceitou as condições apresentadas.":"O agente solicita salário e bônus mais competitivos."});
        return s;
      }
      case "acceptCoachDeal": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const n=s.coachCareer?.negotiations?.find(n=>n.id===data.id && n.status==="pending");
        if(!n||s.day>n.expiresDay||n.buyerClubId!==s.clubId)throw Error("Proposta expirada ou indisponível.");
        if(n.response!=="accepted")throw Error("Aguarde o aceite do clube vendedor antes de concluir.");
        if(n.contractOffer&&n.contractOffer.status!=="accepted")throw Error("Acordo contratual pendente.");
        const plan=data.paymentPlan==="split"?"split":"upfront";
        const exchangeIds=(Array.isArray(data.exchangeIds)?data.exchangeIds:[]).map(String).slice(0,3);
        const sellOnPct=Number(data.sellOn||0);if(![0,10,20].includes(sellOnPct))throw Error("Cláusula de revenda inválida.");
        n.sellOn=sellOnPct;
        const rights=["first_refusal","buyback"].includes(data.rights)?data.rights:"";n.rights=rights;
        if(!D.Career.windowStatus(s).open){
          n.status="awaiting_window";n.paymentPlan=plan;n.agreedDay=s.day;n.expiresDay=null;n.exchangeIds=exchangeIds;
          (s.news||[]).unshift({day:s.day,season:s.season,title:"Contratação acordada",body:"Transferência programada para a próxima janela. Nenhum pagamento antecipado."});
          return s;
        }
        return execute(s,"recruit",{clubId:n.sellerClubId,playerId:n.playerId,paymentPlan:plan,dealType:"permanent",exchangeIds,sellOn:sellOnPct,rights});
      }
      case "settleCoachWindowDeals": {
        if(s.mode!=="coach"||!D.Career.windowStatus(s).open)return s;
        for(const n of s.coachCareer?.negotiations||[]){
          if(n.status!=="awaiting_window"||n.buyerClubId!==s.clubId)continue;
          try{
            execute(s,"recruit",{clubId:n.sellerClubId,playerId:n.playerId,paymentPlan:n.paymentPlan||"upfront",dealType:"permanent",exchangeIds:n.exchangeIds||[],sellOn:n.sellOn||0,rights:n.rights||""});
          }catch(error){
            n.lastSettlementError=String(error.message||error);
            // Retain agreed deal so the manager can address a budget or availability problem.
          }
        }
        return s;
      }
      case "toggleCoachShortlist": {
        if(s.mode!=="coach"||!s.clubId)throw Error("Disponível somente ao treinador com clube.");
        const current=s.coachCareer?.shortlist?.findIndex(x=>x.clubId===data.clubId&&x.playerId===data.playerId)??-1;
        if(s.mode==="coach"&&current>=0){s.coachCareer.shortlist.splice(current,1);break;}
        const own=D.club(s),seller=D.club(s,data.clubId);
        const player=seller?.roster?.find(p=>p.id===data.playerId)||D.GlobalFootball?.playersByClub?.(s,seller?.id)?.find(p=>p.id===data.playerId);
        if(!own||!seller||seller.id===own.id||!player||player.id==="hero")throw Error("Jogador indisponível.");
        s.coachCareer||={version:1};
        const list=s.coachCareer.shortlist||[];
        const existing=list.findIndex(x=>x.clubId===seller.id&&x.playerId===player.id);
        if(existing>=0)list.splice(existing,1);
        else {
          if(list.length>=80)throw Error("Lista de observação cheia.");
          list.push({clubId:seller.id,playerId:player.id,addedDay:s.day});
        }
        s.coachCareer.shortlist=list;
        break;
      }
      case "setCoachTargetPriority": {
        if(s.mode!=="coach"||!s.clubId)throw Error("Disponível apenas ao treinador com clube.");
        const priority=String(data.priority||"");
        if(!["alta","media","baixa"].includes(priority))throw Error("Prioridade inválida.");
        const entry=s.coachCareer?.shortlist?.find(x=>String(x.clubId)===String(data.clubId)&&String(x.playerId)===String(data.playerId));
        if(!entry)throw Error("Alvo não encontrado na lista.");
        entry.priority=priority;
        break;
      }
      case "setCoachOfferPreference": {
        if(s.mode!=="coach"||!D.club(s))throw Error("Preferências disponíveis apenas ao treinador.");
        const mode=String(data.mode||"");
        if(!["all","listed","none"].includes(mode))throw Error("Preferência inválida.");
        s.coachCareer||={version:1};
        s.coachCareer.offerPreferences||={mode:"all",blockedIds:[],listedIds:[],loanListedIds:[]};
        s.coachCareer.offerPreferences.loanListedIds||=[];
        s.coachCareer.offerPreferences.mode=mode;
        break;
      }
      case "setCoachPlayerOfferStatus": {
        if(s.mode!=="coach")throw Error("Disponível apenas ao treinador.");
        const club=D.club(s),player=club?.roster?.find(p=>p.id===data.playerId);
        if(!player||player.id==="hero")throw Error("Atleta indisponível.");
        if(!["available","listed","loan_listed","blocked"].includes(data.status))throw Error("Status inválido.");
        if(data.status==="loan_listed"&&s.coachCareer?.settings?.loans==="off")throw Error("Empréstimos estão desativados nesta carreira.");
        s.coachCareer||={version:1};
        const prefs=s.coachCareer.offerPreferences||={mode:"all",blockedIds:[],listedIds:[],loanListedIds:[]};
        prefs.blockedIds=(prefs.blockedIds||[]).filter(id=>id!==player.id);
        prefs.listedIds=(prefs.listedIds||[]).filter(id=>id!==player.id);
        prefs.loanListedIds=(prefs.loanListedIds||[]).filter(id=>id!==player.id);
        if(data.status==="blocked")prefs.blockedIds.push(player.id);
        if(data.status==="listed")prefs.listedIds.push(player.id);
        if(data.status==="loan_listed")prefs.loanListedIds.push(player.id);
        break;
      }
      case "renewCoachPlayerContract": {
        if(s.mode!=="coach")throw Error("Disponível apenas ao treinador.");
        const club=D.club(s),player=club?.roster?.find(p=>p.id===data.playerId);
        if(!player||player.id==="hero")throw Error("Atleta indisponível para renovação.");
        const activeLoan=(s.coachCareer?.loans||[]).find(l=>!l.returned&&l.playerId===player.id);
        if(activeLoan&&activeLoan.toClubId===club.id&&activeLoan.fromClubId!==club.id)throw Error("Jogador emprestado por outro clube não pode renovar aqui.");
        if((s.coachCareer?.saleOffers||[]).some(o=>o.playerId===player.id&&(o.status==="pending"||o.status==="awaiting_window")))throw Error("Resolva a proposta ativa antes de renovar.");
        const salary=Number(data.salary),years=Number(data.years),bonus=Number(data.bonus||0),role=String(data.role||"");
        if(!Number.isSafeInteger(salary)||salary<1000||salary>1000000000)throw Error("Salário inválido.");
        if(!Number.isInteger(years)||years<1||years>5)throw Error("Duração do contrato inválida.");
        if(!Number.isSafeInteger(bonus)||bonus<0||bonus>10000000000)throw Error("Luvas inválidas.");
        if(!["Rotação","Importante","Titular","Estrela"].includes(role))throw Error("Papel no elenco inválido.");
        if(Number.isFinite(Number(player.lastContractSignedDay))&&Number(s.day)-Number(player.lastContractSignedDay)<30)throw Error("Aguarde 30 dias para renegociar este contrato.");
        if(!Number.isFinite(Number(club.budget))||Number(club.budget)<bonus)throw Error("Orçamento insuficiente para as luvas.");
        club.budget=Number(club.budget)-bonus;
        if(bonus)ClubFinance?.movement?.(s,club,"transferencia",-bonus,"Luvas da renovação · "+player.name);
        player.salary=salary;player.contractEndDay=Number(s.day)+years*365;player.squadRole=role;player.lastSigningBonus=bonus;player.lastContractSignedDay=Number(s.day);
        if(player.contract&&typeof player.contract==="object")Object.assign(player.contract,{salary,endDay:player.contractEndDay,role});
        s.coachCareer||={version:1};
        const renewals=s.coachCareer.contractRenewals||[];
        renewals.push({id:"renew_"+s.season+"_"+s.day+"_"+player.id,playerId:player.id,playerName:player.name,day:Number(s.day),salary,years,bonus,role,endDay:player.contractEndDay});
        s.coachCareer.contractRenewals=renewals.slice(-120);
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Contrato renovado",body:player.name+" renovou por "+years+" ano(s), com salário mensal de R$ "+salary.toLocaleString("pt-BR")+"."});
        break;
      }
      case "releaseCoachPlayer": {
        if(s.mode!=="coach")throw Error("Disponível apenas ao treinador.");
        const club=D.club(s),player=club?.roster?.find(p=>p.id===data.playerId);
        if(!player||player.id==="hero")throw Error("Atleta indisponível para liberação.");
        if((club.roster||[]).filter(Boolean).length<=18)throw Error("O elenco precisa manter ao menos 18 jogadores.");
        if((s.coachCareer?.loans||[]).some(l=>!l.returned&&l.playerId===player.id))throw Error("Jogador com empréstimo ativo não pode ser liberado.");
        if((s.coachCareer?.saleOffers||[]).some(o=>o.playerId===player.id&&(o.status==="pending"||o.status==="awaiting_window")))throw Error("Resolva a proposta ativa antes de liberar o jogador.");
        const end=[player.contractEndDay,player.contract?.endDay,player.contract?.expiresDay].map(Number).find(Number.isFinite);
        const months=Number.isFinite(end)?Math.max(0,Math.ceil((end-Number(s.day))/30)):0;
        const wage=Math.max(0,Math.round(Number(player.salary??player.monthlySalary??player.wage)||0));
        const cost=wage*Math.min(12,months);
        if(!Number.isFinite(Number(club.budget))||Number(club.budget)<cost)throw Error("Orçamento insuficiente para pagar a rescisão.");
        club.budget=Number(club.budget)-cost;
        if(cost)ClubFinance?.movement?.(s,club,"transferencia",-cost,"Rescisão contratual · "+player.name);
        club.roster=club.roster.filter(p=>p.id!==player.id);club.lineup=(club.lineup||[]).filter(id=>id!==player.id);
        const prefs=s.coachCareer?.offerPreferences;
        if(prefs){for(const key of ["blockedIds","listedIds","loanListedIds"])prefs[key]=(prefs[key]||[]).filter(id=>id!==player.id);}
        player.clubId=null;player.leagueId=null;player.squadRole=null;
        s.internationalPlayers||=[];
        if(!s.internationalPlayers.some(p=>p.id===player.id))s.internationalPlayers.push(player);
        s.coachCareer||={version:1};
        const releases=s.coachCareer.releases||[];
        releases.push({id:"release_"+s.season+"_"+s.day+"_"+player.id,playerId:player.id,playerName:player.name,clubId:club.id,day:Number(s.day),cost});
        s.coachCareer.releases=releases.slice(-120);
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Jogador liberado",body:player.name+" deixou o clube"+(cost?" após rescisão de R$ "+cost.toLocaleString("pt-BR"):"")+"."});
        break;
      }
      case "generateSaleInterest": {
        if(s.mode!=="coach"||!s.clubId)throw Error("Disponível apenas ao treinador com clube.");
        const own=D.club(s),clubs=(s.clubs||[]).concat(s.globalFootball?.clubs||[]);
        const buyers=clubs.filter(c=>c.id!==own.id&&c.active!==false&&Array.isArray(c.roster)&&Number.isFinite(Number(c.budget))&&Number(c.budget)>0&&D.club(s,c.id)===c);
        const loans=s.coachCareer?.loans||[];
        const prefs=s.coachCareer?.offerPreferences||{mode:"all",blockedIds:[],listedIds:[],loanListedIds:[]};
        if(prefs.mode==="none")throw Error("Recebimento de propostas desativado nas preferências.");
        const listedSet=new Set([...(prefs.listedIds||[]),...(prefs.loanListedIds||[])]);
        const eligible=(own.roster||[]).filter(p=>p.id!=="hero"&&!p.injury&&!loans.some(l=>!l.returned&&l.playerId===p.id)&&!(prefs.blockedIds||[]).includes(p.id)&&(prefs.mode!=="listed"||listedSet.has(p.id))&&!s.coachCareer?.saleOffers?.some(o=>o.playerId===p.id&&(o.status==="pending"||o.status==="awaiting_window")));
        if(own.roster.length<=18||!eligible.length||!buyers.length)throw Error("Nenhuma proposta elegível segundo as preferências e elencos atuais.");
        eligible.sort((a,b)=>(listedSet.has(b.id)?1:0)-(listedSet.has(a.id)?1:0)||String(a.id).localeCompare(String(b.id)));
        const preferred=eligible.filter(p=>listedSet.has(p.id)),pool=preferred.length?preferred:eligible;
        const p=pool[(Math.floor(s.day/7)+pool.length)%pool.length];
        const price=valuation(p);
        const isLoan=(prefs.loanListedIds||[]).includes(p.id);
        if(isLoan&&s.coachCareer?.settings?.loans==="off")throw Error("Empréstimos estão desativados nesta carreira.");
        const amount=Math.ceil(price*(isLoan?0.08:(s.coachCareer?.settings?.marketStrictness==="strict"?1.1:0.95))/1000)*1000;
        const buyer=buyers.filter(c=>Number(c.budget)>=amount).sort((a,b)=>String(a.id).localeCompare(String(b.id)))[0];
        if(!buyer)throw Error("Nenhum clube possui orçamento para apresentar proposta.");
        s.coachCareer||={version:1};s.coachCareer.saleOffers||=[];
        const offer={id:"sale_"+s.season+"_"+s.day+"_"+p.id+"_"+s.coachCareer.saleOffers.length,playerId:p.id,buyerClubId:buyer.id,sellerClubId:own.id,amount,requested:amount,round:1,status:"pending",createdDay:s.day,expiresDay:s.day+10,dealType:isLoan?"loan":"permanent",loanDays:isLoan?180:null,salaryShare:isLoan?50:null,buyOption:0,history:[{day:s.day,round:1,offer:amount}]};
        s.coachCareer.saleOffers.push(offer);
        (s.news||[]).unshift({day:s.day,season:s.season,title:isLoan?"Proposta de empréstimo recebida":"Proposta recebida",body:buyer.name+" oferece R$ "+amount.toLocaleString("pt-BR")+(isLoan?" pelo empréstimo de ":" por ")+p.name+"."});
        break;
      }
      case "counterSaleOffer": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const offer=s.coachCareer?.saleOffers?.find(o=>o.id===data.id&&o.status==="pending"&&o.sellerClubId===s.clubId&&s.day<=o.expiresDay);
        if(!offer||offer.round>=3)throw Error("Negociação indisponível ou limite de rodadas atingido.");
        const amount=Number(data.amount),buyer=D.club(s,offer.buyerClubId);
        if(!Number.isSafeInteger(amount)||amount<1000||amount>100000000000||!buyer||!Number.isFinite(Number(buyer.budget))||Number(buyer.budget)<1000)throw Error("Valor inválido.");
        const buyerLimit=Math.floor(Number(buyer.budget)*0.9);
        offer.round+=1;offer.requested=amount;
        offer.amount=amount<=buyerLimit?amount:Math.max(1000,Math.floor(buyerLimit/1000)*1000);
        offer.response=amount<=buyerLimit?"accepted":"counter";
        offer.expiresDay=s.day+7;
        offer.history||=[];
        offer.history.push({day:s.day,round:offer.round,offer:amount,response:offer.amount});
        (s.news||[]).unshift({day:s.day,season:s.season,title:offer.response==="accepted"?"Contraproposta aceita":"Clube apresentou contraproposta",body:"Oferta por "+(D.club(s)?.roster||[]).find(p=>p.id===offer.playerId)?.name+" · R$ "+offer.amount.toLocaleString("pt-BR")+". Responda até o dia "+offer.expiresDay+"."});
        break;
      }
      case "rejectSaleOffer": {
        const offer=s.coachCareer?.saleOffers?.find(o=>o.id===data.id&&o.status==="pending"&&o.sellerClubId===s.clubId&&(!Number.isFinite(Number(o.expiresDay))||Number(s.day)<=Number(o.expiresDay)));
        if(s.mode!=="coach"||!offer)throw Error("Proposta indisponível.");
        offer.status="rejected";offer.closedDay=s.day;
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Proposta recusada",body:"Você recusou a oferta recebida. O jogador permanece no clube."});
        break;
      }
      case "acceptSaleOffer": {
        if(s.mode!=="coach")throw Error("Disponível apenas ao treinador.");
        const open=D.Career.windowStatus(s).open;
        const offer=s.coachCareer?.saleOffers?.find(o=>o.id===data.id&&o.sellerClubId===s.clubId&&(o.status==="awaiting_window"&&open||o.status==="pending"&&s.day<=o.expiresDay));
        if(offer&&!open){
          const seller=D.club(s,offer.sellerClubId),buyer=D.club(s,offer.buyerClubId);
          const p=seller?.roster?.find(x=>x.id===offer.playerId);
          if(!p||p.id==="hero"||!buyer||seller.roster.length<=18||(s.coachCareer?.loans||[]).some(l=>!l.returned&&l.playerId===p.id))throw Error("Jogador indisponível para acordo futuro.");
          offer.status="awaiting_window";offer.agreedDay=s.day;offer.lastSettlementError=null;
          (s.news||[]).unshift({day:s.day,season:s.season,title:offer.dealType==="loan"?"Empréstimo acordado":"Venda acordada",body:p.name+" permanece no clube até a próxima janela. "+(offer.dealType==="loan"?"O empréstimo será concluído":"A transferência será concluída")+" quando o mercado abrir."});
          break;
        }
        if(!offer)throw Error("Proposta indisponível.");
        const seller=D.club(s,offer.sellerClubId);let buyer=D.club(s,offer.buyerClubId);
        const p=seller?.roster?.find(x=>x.id===offer.playerId);
        let fee=Number(offer.amount);
        if(!p||p.id==="hero"||seller.id===buyer?.id||seller.roster.length<=18||!buyer||!Array.isArray(buyer.roster)||!Number.isSafeInteger(fee)||fee<=0||fee>100000000000||!Number.isFinite(Number(buyer.budget))||Number(buyer.budget)<fee||buyer.roster.some(x=>x.id===p.id))throw Error("Transferência indisponível ou orçamento insuficiente.");
        if((s.coachCareer?.loans||[]).some(l=>!l.returned&&l.playerId===p.id))throw Error("Jogador emprestado não pode ser vendido.");
        if(offer.dealType==="loan"){
          const duration=Number(offer.loanDays||180),salaryShare=Number(offer.salaryShare??50);
          if(![180,365].includes(duration)||![0,50,100].includes(salaryShare))throw Error("Termos do empréstimo inválidos.");
          seller.roster=seller.roster.filter(x=>x.id!==p.id);seller.lineup=(seller.lineup||[]).filter(id=>id!==p.id);
          buyer.roster.push(p);buyer.budget-=fee;seller.budget=(Number(seller.budget)||0)+fee;
          ClubFinance?.movement?.(s,seller,"transferencia",fee,"Taxa de empréstimo · "+p.name);
          p.clubId=buyer.id;p.leagueId=buyer.leagueId||p.leagueId;
          if(Array.isArray(s.internationalPlayers))s.internationalPlayers=s.internationalPlayers.filter(x=>x.id!==p.id);
          s.coachCareer.loans||=[];
          s.coachCareer.loans.push({id:"loan_out_"+s.season+"_"+s.day+"_"+p.id,playerId:p.id,fromClubId:seller.id,toClubId:buyer.id,startDay:Number(s.day)||0,dueDay:(Number(s.day)||0)+duration,fee,salaryShare,buyOption:Number(offer.buyOption)||0,nextSalaryDay:(Number(s.day)||0)+30,returned:false});
          offer.status="accepted";offer.closedDay=s.day;offer.finalFee=fee;
          const prefs=s.coachCareer.offerPreferences;
          if(prefs)for(const key of ["blockedIds","listedIds","loanListedIds"])prefs[key]=(prefs[key]||[]).filter(id=>id!==p.id);
          const history=D.Career.init(s).transfers||[];
          history.unshift({day:s.day,season:s.season,player:p.name,from:seller.name||"Sem clube",to:buyer.name,fee,pos:p.pos||"—",transferType:"loan",salary:Number(p.salary)||0});
          D.Career.init(s).transfers=history.slice(0,100);
          (s.news||[]).unshift({day:s.day,season:s.season,title:"Empréstimo concluído",body:p.name+" foi emprestado ao "+buyer.name+" por "+duration+" dias. Taxa: R$ "+fee.toLocaleString("pt-BR")+"."});
          break;
        }
        // Direito de preferência e recompra: o clube de origem pode ficar com o jogador antes de um terceiro.
        const rightsClause=(s.coachCareer?.rightsClauses||[]).find(x=>x.active&&x.playerId===p.id&&x.ownerClubId===seller.id&&Number(s.day)<=Number(x.expiresDay));
        if(rightsClause){
          const holder=D.club(s,rightsClause.holderClubId);
          if(holder&&holder.id!==buyer.id&&holder.id!==seller.id){
            if(!Array.isArray(holder.roster)){holder.roster=(D.GlobalFootball?.playersByClub?.(s,holder.id)||[]).slice();holder.lineup||=[];}
            const price=rightsClause.type==="buyback"?Number(rightsClause.price):fee;
            const applies=rightsClause.type==="buyback"?fee>=price:true;
            if(applies&&Number(holder.budget)>=price&&holder.roster.length>0){
              (s.news||[]).unshift({day:s.day,season:s.season,title:rightsClause.type==="buyback"?"Cláusula de recompra acionada":"Direito de preferência exercido",
                body:holder.name+" ficou com "+p.name+" por R$ "+price.toLocaleString("pt-BR")+(rightsClause.type==="buyback"?" (valor de recompra)":", igualando a melhor oferta")+"."});
              buyer=holder;offer.buyerClubId=holder.id;fee=price;offer.amount=price;rightsClause.active=false;
              if(!Array.isArray(buyer.roster))buyer.roster=[];
            }
          }
        }
        const clauses=(s.coachCareer?.sellOnClauses||[]).filter(x=>x.active&&x.playerId===p.id&&x.buyerClubId===seller.id);
        const payments=clauses.map(x=>({x,beneficiary:D.club(s,x.sellerClubId),value:Math.floor(fee*Number(x.percentage)/100)}));
        if(payments.some(v=>!Number.isFinite(v.value)||v.value<0||v.value>fee)||payments.reduce((sum,v)=>sum+v.value,0)>fee)throw Error("Cláusula de revenda inválida.");
        const payable=payments.reduce((sum,v)=>sum+(v.beneficiary&&v.beneficiary.id!==seller.id&&v.beneficiary.id!==buyer.id?v.value:0),0);
        seller.roster=seller.roster.filter(x=>x.id!==p.id);
        seller.lineup=(seller.lineup||[]).filter(id=>id!==p.id);
        buyer.roster.push(p);buyer.budget-=fee;seller.budget=(Number(seller.budget)||0)+fee-payable;
        ClubFinance?.movement?.(s,seller,"transferencia",fee-payable,"Venda de jogador · "+p.name,{gross:fee,sellOnPaid:payable});
        for(const v of payments){if(v.beneficiary&&v.beneficiary.id!==seller.id&&v.beneficiary.id!==buyer.id)v.beneficiary.budget=(Number(v.beneficiary.budget)||0)+v.value;v.x.active=false;}
        offer.status="accepted";offer.closedDay=s.day;offer.finalFee=fee;offer.sellOnPaid=payable;
        const prefs=s.coachCareer?.offerPreferences;
        if(prefs)for(const key of ["blockedIds","listedIds","loanListedIds"])prefs[key]=(prefs[key]||[]).filter(id=>id!==p.id);
        D.Career.transfer(s,p,seller,buyer,fee);
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Venda concluída",body:p.name+" vendido por R$ "+fee.toLocaleString("pt-BR")+"."});
        break;
      }
      case "settleCoachWindowSales": {
        if(s.mode!=="coach"||!D.Career.windowStatus(s).open)return s;
        for(const offer of s.coachCareer?.saleOffers||[]){
          if(offer.status!=="awaiting_window"||offer.sellerClubId!==s.clubId)continue;
          try{execute(s,"acceptSaleOffer",{id:offer.id});}
          catch(error){offer.lastSettlementError=String(error?.message||error);}
        }
        return s;
      }
      case "reviseCoachDeal": {
        if(s.mode!=="coach")throw Error("Disponível apenas no modo treinador.");
        const n=s.coachCareer?.negotiations?.find(x=>x.id===data.id&&x.status==="pending");
        if(!n||n.buyerClubId!==s.clubId||Number(s.day)>Number(n.expiresDay))throw Error("Negociação expirada ou indisponível.");
        if(n.response==="awaiting_reply")throw Error("Aguarde a resposta do clube antes de apresentar outra oferta.");
        if((n.round||1)>=3)throw Error("Limite de três rodadas atingido.");
        const buyer=D.club(s,n.buyerClubId),seller=D.club(s,n.sellerClubId);
        const p=seller?.roster?.find(x=>x.id===n.playerId);
        if(!buyer||!p||seller.roster.length<=18)throw Error("Jogador não está mais disponível.");
        const offer=Number(data.offer);
        if(!Number.isSafeInteger(offer)||offer<1000||offer>100000000000)throw Error("Valor da proposta inválido.");
        const currentInquiry=s.coachCareer?.inquiries?.find(x=>x.playerId===p.id&&x.clubId===seller.id&&x.buyerClubId===buyer.id);
        if(currentInquiry&&(!["accepted","asking_price"].includes(currentInquiry.status)||Number(s.day)>Number(currentInquiry.expiresDay)))
          throw Error("Clube e jogador ainda não autorizaram esta negociação.");
        const base=valuation(p)*(s.coachCareer?.settings?.marketStrictness==="strict"?1.25:s.coachCareer?.settings?.marketStrictness==="flexible"?0.85:1);
        const threshold=Math.ceil(base*((s.coachCareer?.settings?.marketStrictness==="flexible"?0.78:0.9)+Math.min(n.round||1,2)*0.025)/1000)*1000;
        const accepted=offer>=threshold;
        const finalFee=accepted?offer:Math.ceil(base*(1+Math.min(n.round||1,2)*0.025)/1000)*1000;
        n.history ||= [{round:1,day:n.day??s.day,offered:n.requested,response:n.finalFee,accepted:n.requested>=n.finalFee}];
        n.round=(n.round||1)+1;
        n.requested=offer;n.finalFee=null;n.response="awaiting_reply";n.replyDay=Number(s.day)+2;n.pendingOutcome={accepted,finalFee};
        n.expiresDay=s.day+(D.Career.windowStatus(s).open?7:Math.max(7,Number(D.Career.windowStatus(s).remaining)||7)+7);
        n.history.push({round:n.round,day:s.day,offered:offer,status:"sent"});
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Contraproposta enviada",body:p.name+" · aguardando resposta do clube vendedor."});
        return s;
      }
      case "coachInquiry": {
        if(s.mode!=="coach")throw Error("Sondagem disponível apenas ao treinador.");
        const buyer=D.club(s),seller=D.club(s,data.clubId);
        const p=seller?.roster?.find(x=>x.id===data.playerId)||D.GlobalFootball?.playersByClub?.(s,seller?.id)?.find(x=>x.id===data.playerId);
        if(!buyer||!seller||buyer.id===seller.id||!p||p.id==="hero")throw Error("Jogador indisponível para sondagem.");
        s.coachCareer||={version:1};
        const inquiries=s.coachCareer.inquiries||=[];
        const existing=inquiries.find(x=>x.clubId===seller.id&&x.playerId===p.id&&x.buyerClubId===buyer.id);
        if(existing&&existing.status==="pending")throw Error("Já existe uma sondagem em andamento.");
        if(existing&&existing.status==="rejected"&&Number(s.day)<Number(existing.answeredDay||existing.responseDay)+14)throw Error("Aguarde 14 dias após a recusa para consultar novamente.");
        if(existing&&["accepted","asking_price"].includes(existing.status)&&Number(s.day)<=Number(existing.expiresDay))throw Error("Sondagem aprovada: você já pode negociar.");
        const entry={id:"inq_"+s.season+"_"+s.day+"_"+p.id,playerId:p.id,clubId:seller.id,buyerClubId:buyer.id,playerName:p.name,clubName:seller.name,position:p.primaryPosition||p.pos,startDay:Number(s.day)||0,responseDay:(Number(s.day)||0)+2,expiresDay:(Number(s.day)||0)+12,status:"pending"};
        if(existing)inquiries.splice(inquiries.indexOf(existing),1);
        inquiries.push(entry);
        break;
      }
      case "counterRecruit": {
        if(s.mode!=="coach")throw Error("Negociação disponível apenas ao treinador.");
        const buyer=D.club(s),seller=D.club(s,data.clubId);
        const p=seller?.roster?.find(x=>x.id===data.playerId)||D.GlobalFootball?.playersByClub?.(s,seller?.id)?.find(x=>x.id===data.playerId);
        if(!buyer||!seller||buyer.id===seller.id||!p||p.id==="hero")throw Error("Jogador indisponível.");
        const base=valuation(p)*(s.coachCareer?.settings?.marketStrictness==="strict"?1.25:s.coachCareer?.settings?.marketStrictness==="flexible"?0.85:1);
        const requested=Number(data.offer);
        if(!Number.isFinite(requested)||requested<=0)throw Error("Proposta inválida.");
        if(!Array.isArray(seller.roster)){
          const roster=D.GlobalFootball?.playersByClub?.(s,seller.id)||[];
          if(roster.length<=18)throw Error("Elenco de origem indisponível para negociação.");
          seller.roster=roster.slice();
          seller.lineup ||= [];
        }
        const minimum=Math.ceil(base*(s.coachCareer?.settings?.marketStrictness==="flexible"?0.78:0.9)/1000)*1000;
        s.coachCareer ||= {version:1};
        s.coachCareer.negotiations ||= [];
        s.coachCareer.negotiations=s.coachCareer.negotiations.filter(n=>!(n.playerId===p.id&&n.buyerClubId===buyer.id&&n.status==="pending"));
        const accepted=requested>=minimum;
        const finalFee=accepted?Math.ceil(requested/1000)*1000:Math.ceil(base/1000)*1000;
        const entry={id:"neg_"+s.season+"_"+s.day+"_"+p.id,day:s.day,playerId:p.id,sellerClubId:seller.id,buyerClubId:buyer.id,requested,finalFee:null,status:"pending",round:1,response:"awaiting_reply",replyDay:Number(s.day)+2,pendingOutcome:{accepted,finalFee},expiresDay:s.day+(D.Career.windowStatus(s).open?10:Math.max(10,Number(D.Career.windowStatus(s).remaining)||10)+10),history:[{round:1,day:s.day,offered:requested,status:"sent"}]};
        s.coachCareer.negotiations.push(entry);
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Proposta enviada",body:"O clube recebeu a oferta. Resposta prevista em dois dias da carreira."});
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
        ClubFinance?.movement?.(s,buyer,"transferencia",-loan.buyOption,"Opção de compra · "+player.name);
        loan.purchased=true;loan.purchaseDay=s.day;loan.returned=true;
        D.Career.transfer(s,player,seller,buyer,loan.buyOption);
        queueCoachPresentation(s,player,seller,buyer,loan.buyOption,"purchase-option");
        (s.news||[]).unshift({day:s.day,season:s.season,title:"Opção de compra exercida",body:player.name+" foi contratado em definitivo."});
        return s;
      }
      case "payReleaseClause": {
        if(s.mode!=="coach")throw Error("Disponível apenas ao treinador.");
        return execute(s,"recruit",{clubId:data.clubId,playerId:data.playerId,paymentPlan:"upfront",dealType:"permanent",releaseClause:true});
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
        if(source&&!Array.isArray(source.roster)){
          const roster=D.GlobalFootball?.playersByClub?.(s,source.id)||[];
          if(roster.length<=18)throw Error("Elenco internacional indisponível.");
          source.roster=roster.slice();source.lineup||=[];
        }
        const p = source?.roster?.find((p) => p.id === data.playerId);
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
        const byClause=data.releaseClause===true&&!isLoan;
        if(data.releaseClause===true&&isLoan)throw Error("A rescisória só vale para compra definitiva.");
        const negotiation=!isLoan?s.coachCareer?.negotiations?.find(n=>n.playerId===p.id&&n.sellerClubId===source.id&&n.buyerClubId===own.id&&(n.status==="pending"||n.status==="awaiting_window")&&(n.expiresDay==null||n.expiresDay>=s.day)):null;
        if(negotiation&&!byClause){
          if(negotiation.response==="awaiting_reply")throw Error("Aguarde a resposta do clube antes de concluir a contratação.");
          if(negotiation.status==="pending"&&negotiation.response!=="accepted")throw Error("O clube vendedor ainda não aceitou a proposta.");
          const agreedFee=Number(negotiation.finalFee);
          if(!Number.isSafeInteger(agreedFee)||agreedFee<=0||agreedFee>100000000000)
            throw Error("Negociação sem valor final válido.");
          fee=agreedFee;
        }
        if(byClause)fee=releaseClause(p);
        const agreedContract=negotiation?.contractOffer?.status==="accepted"?negotiation.contractOffer:null;
        const contractBonus=!isLoan&&agreedContract?agreedContract.bonus:0;
        // Troca de jogadores: atletas do seu elenco entram no negócio e abatem o valor em dinheiro.
        const exchangeIds=isLoan?[]:[...new Set((Array.isArray(data.exchangeIds)?data.exchangeIds:(negotiation?.exchangeIds||[])).map(String))].slice(0,3);
        const exchangePlayers=exchangeIds.map(id=>own.roster.find(x=>String(x.id)===id));
        if(exchangePlayers.some(x=>!x||x.id==="hero"))throw Error("Jogador da troca indisponível no seu elenco.");
        if(exchangePlayers.length&&own.roster.length+1-exchangePlayers.length<18)throw Error("Seu elenco ficaria abaixo do mínimo com esta troca.");
        const exchangeCredit=Math.min(fee,Math.round(exchangePlayers.reduce((sum,x)=>sum+valuation(x),0)*0.9/1000)*1000);
        const cashFee=fee-exchangeCredit;
        const due=plan==="split"?Math.floor(cashFee/2):0,upfront=cashFee-due;
        if (own.budget < upfront+contractBonus) throw Error("Orçamento insuficiente para a entrada e bônus contratual.");
        // The deferred half becomes a persistent financial obligation, not free money.
        if (!byClause && D.overall(p) > own.structure + (rules?.marketStrictness==="strict"?7:rules?.marketStrictness==="flexible"?25:14))
          throw Error(
            "O jogador recusou: busca um projeto com maior estrutura.",
          );
        if(negotiation)negotiation.status="accepted";
        if(byClause&&negotiation)negotiation.status="superseded";
        if(byClause&&Array.isArray(s.coachCareer?.negotiations))for(const n of s.coachCareer.negotiations)if(n!==negotiation&&n.playerId===p.id&&n.buyerClubId===own.id&&n.status==="pending")n.status="superseded";
        own.budget -= upfront+contractBonus;
        ClubFinance?.movement?.(s,own,"transferencia",-(upfront+contractBonus),"Contratação · "+p.name,{fee:upfront,signingBonus:contractBonus});
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
        for(const x of exchangePlayers){
          own.roster=own.roster.filter(y=>y.id!==x.id);own.lineup=(own.lineup||[]).filter(id=>id!==x.id);
          source.roster.push(x);x.clubId=source.id;x.leagueId=source.leagueId||x.leagueId;
        }
        if(exchangePlayers.length)(s.news||[]).unshift({day:s.day,season:s.season,title:"Troca concluída",body:exchangePlayers.map(x=>x.name).join(", ")+" seguiu"+(exchangePlayers.length>1?"ram":"")+" para "+source.name+" na negociação por "+p.name+". Abatimento de R$ "+exchangeCredit.toLocaleString("pt-BR")+" no valor em dinheiro."});
        // Keep the global catalog's canonical player and avoid duplicate ownership.
        if(Array.isArray(s.internationalPlayers)){
          s.internationalPlayers=s.internationalPlayers.filter(x=>x.id!==p.id);
        }
        p.clubId=own.id;p.leagueId=own.leagueId||p.leagueId;
        if(!isLoan&&agreedContract){
          p.salary=agreedContract.salary;
          p.contractEndDay=Number(s.day)+agreedContract.years*365;
          p.squadRole=agreedContract.role;
          p.lastSigningBonus=contractBonus;
          p.lastContractSignedDay=Number(s.day);
        }
        if(isLoan){
          s.coachCareer.loans ||= [];
          s.coachCareer.loans.push({id:"loan_"+s.season+"_"+s.day+"_"+p.id,playerId:p.id,fromClubId:source.id,toClubId:own.id,startDay:Number(s.day)||0,dueDay:(Number(s.day)||0)+duration,fee,salaryShare,buyOption:optionPrice,nextSalaryDay:(Number(s.day)||0)+30,returned:false});
        }else if(sellOn){
          s.coachCareer.sellOnClauses ||= [];
          s.coachCareer.sellOnClauses.push({playerId:p.id,buyerClubId:own.id,sellerClubId:source.id,percentage:sellOn,active:true});
        }
        if(!isLoan&&["first_refusal","buyback"].includes(data.rights)){
          s.coachCareer.rightsClauses||=[];
          s.coachCareer.rightsClauses.push({id:"rights_"+s.season+"_"+s.day+"_"+p.id,type:data.rights,playerId:p.id,holderClubId:source.id,ownerClubId:own.id,
            price:data.rights==="buyback"?Math.ceil(fee*1.3/1000)*1000:null,createdDay:Number(s.day)||0,expiresDay:(Number(s.day)||0)+730,active:true});
        }
        D.Career.transfer(s, p, source, own, fee);
        // A sondagem deixa de ser uma pendência assim que o atleta passa a
        // integrar o elenco comprador. Mantemos o registro apenas como histórico.
        for(const inquiry of s.coachCareer?.inquiries||[]){
          if(inquiry.playerId===p.id&&inquiry.buyerClubId===own.id){
            inquiry.status="converted";
            inquiry.convertedDay=Number(s.day)||0;
          }
        }
        queueCoachPresentation(s,p,source,own,fee,isLoan?"loan":"permanent");
        s.news.unshift({
          day: s.day,
          season: s.season,
          title: isLoan ? "Jogador contratado por empréstimo" : byClause ? "Rescisória paga" : "Reforço contratado",
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
  // Market model v2: BRL nominal values; existing accepted deals retain their stored finalFee.
  // Calibrated for career-gameplay rather than claimed as official EA/TransferRoom prices.
  function valuation(p) {
    if(PlayerEconomy)return PlayerEconomy.marketValue(p);
    const overall = Math.max(40, Math.min(99, Number(D.overall(p)) || 65));
    const age = Math.max(14, Math.min(45, Number(p.age) || 26));
    const potential = Math.max(overall, Math.min(99, Number(p.potential) || overall));
    const ageFactor = age <= 22 ? 1.22 : age <= 27 ? 1.1 : age <= 30 ? 1 : age <= 33 ? .72 : .45;
    const potentialFactor = 1 + Math.min(0.35, Math.max(0, potential - overall) * 0.025);
    const base = 39000000 * Math.pow(overall / 84, 9) * ageFactor * potentialFactor;
    return Math.max(100000, Math.round(base / 10000) * 10000);
  }
  // Cláusula de rescisória (estilo FC): valor fixo por atleta; pagando o total, o clube é obrigado a liberar
  // e o jogador aceita o acordo, independentemente do interesse. Determinístico a partir do id e do valor.
  function releaseClause(p) {
    const overall = Math.max(40, Math.min(99, Number(D.overall(p)) || 65));
    const age = Math.max(14, Math.min(45, Number(p.age) || 26));
    let h = 2166136261;
    for (const ch of String(p.id)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const jitter = ((h >>> 0) % 41) / 100; // 0.00 a 0.40
    const star = overall >= 88 ? 1.1 : overall >= 82 ? 0.6 : overall >= 75 ? 0.25 : 0;
    const ageCut = age >= 34 ? 0.55 : age >= 31 ? 0.8 : 1;
    const multiplier = (1.9 + star + jitter) * ageCut;
    return Math.max(250000, Math.round(valuation(p) * multiplier / 100000) * 100000);
  }
  // Salary uses a monthly storage unit for legacy compatibility; the UI may also show weekly.
  // Newly negotiated contracts use a financially coherent market-level monthly floor.
  function minimumMarketSalaryMonthly(p) {
    if(PlayerEconomy)return PlayerEconomy.expectedSalary(p);
    const weekly = Math.max(750, Math.round(valuation(p) * 0.00085 / 250) * 250);
    return Math.ceil(weekly * 52 / 12 / 1000) * 1000;
  }
  function buyerOrCurrentClub(s,n) {
    return D.club(s,n.buyerClubId);
  }
  function coachContractRequirements(player,buyer,seller,role="important",years=3) {
    const baseline=Math.max(minimumMarketSalaryMonthly(player), Number(player.salary)||0);
    const overall=Math.max(40,Math.min(99,Number(D.overall(player))||65));
    const seniority=1+Math.max(0,overall-70)*0.007;
    const roleFactor={rotation:0.92,important:1,starter:1.04,star:1.12}[role]||1;
    // Prestige influences asking wages, but never discounts a player's salary.
    const buyerRep=Number(buyer?.reputation??buyer?.prestige??buyer?.strength??60);
    const sellerRep=Number(seller?.reputation??seller?.prestige??seller?.strength??60);
    const prestigePremium=Math.max(0,Math.min(.15,(buyerRep-sellerRep)*.0025));
    const requiredSalary=Math.ceil(baseline*seniority*roleFactor*(1+prestigePremium)/1000)*1000;
    const suggestedBonus=Math.ceil(requiredSalary*Math.max(1,Math.min(5,Number(years)||3))*0.35/10000)*10000;
    return {requiredSalary,suggestedBonus,baseline};
  }
  root.ProLifeApp = { execute, valuation, releaseClause, minimumMarketSalaryMonthly, coachContractRequirements };
  if (typeof module !== "undefined" && module.exports)
    module.exports = root.ProLifeApp;
})(typeof globalThis !== "undefined" ? globalThis : this);
