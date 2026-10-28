(function(root){
  "use strict";
  // Finanças do clube: extrato, bilheteria, camisas, TV, folha real e caixa separado
  // (orçamento de transferências = club.budget; reserva salarial = entry.reserve).
  const VERSION="cf1";
  const SHARE=Object.freeze({gate:.20,tv:.40,sponsor:.10,merch:.10,other:.10});
  const WAGE_RATIO=.65,OPS_RATIO=.25,OPS_FIXED=22000,RESERVE_MONTHS=6,LEDGER_MAX=400;
  const CATEGORIES=Object.freeze({
    bilheteria:"Bilheteria",tv:"Direitos de TV",patrocinio:"Patrocínios",camisas:"Camisas e produtos",
    premios:"Premiações",outras:"Outras receitas",folha:"Folha salarial",operacao:"Operação do clube",
    transferencia:"Transferência de caixa"
  });
  const STORE_PRODUCTS=Object.freeze([
    Object.freeze({id:"shirts",name:"Camisas oficiais",share:.52,price:349}),
    Object.freeze({id:"training",name:"Linha de treino",share:.18,price:229}),
    Object.freeze({id:"accessories",name:"Acessórios",share:.17,price:119}),
    Object.freeze({id:"souvenirs",name:"Souvenires",share:.13,price:69})
  ]);
  const STORE_MULTIPLIERS=Object.freeze([1,1.15,1.32]);
  let resolver=null;
  const getClub=(state,id)=>resolver?resolver(state,id):root.ProLife?.club?.(state,id);
  const bind=fn=>{resolver=fn;};
  const num=(v,d=0)=>{const n=Number(v);return Number.isFinite(n)?n:d;};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const hash=v=>{let h=2166136261;for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const unit=key=>(hash(key)%10000)/10000;
  const monthOf=day=>Math.floor(num(day)/30);
  const calendarMonth=day=>new Date(Date.UTC(2026,0,1+Math.floor(num(day)))).getUTCMonth();

  function payroll(club,state){
    const roster=Array.isArray(club?.roster)?club.roster:[];
    let sum=0,hero=false;
    for(const p of roster){
      const sal=num(p?.contract?.salary,num(p?.salary,0));
      if(p?.id==="hero")hero=true;
      sum+=sal;
    }
    if(!roster.length)sum=Math.round(270000*Math.pow(clamp(num(club?.structure,num(club?.strength,60)),30,100)/60,4.5));
    return {players:Math.round(sum),hero};
  }
  function staffCost(state,club,pay){
    // Salário do protagonista (técnico ou jogador sem contrato no elenco) sai do clube.
    return state&&String(state.clubId)===String(club?.id)&&!pay.hero?num(state.salary):0;
  }
  function annualRevenue(club,state){
    return Math.max(1,payroll(club,state).players)*12/WAGE_RATIO;
  }
  function root_(state){
    if(!state.clubFinance||typeof state.clubFinance!=="object")state.clubFinance={version:1,clubs:{}};
    state.clubFinance.clubs||={};
    return state.clubFinance;
  }
  function reserveCap(club,state){return Math.round(payroll(club,state).players*(1+OPS_RATIO)*RESERVE_MONTHS);}
  // Migração preguiçosa: saves antigos ganham reserva salarial sem tocar no orçamento atual.
  function ensure(state,club){
    const store=root_(state),id=String(club.id);
    let e=store.clubs[id];
    if(!e){
      e=store.clubs[id]={reserve:Math.round(reserveCap(club,state)*.5),ledger:[],lastClose:null,created:num(state.day)};
    }
    if(!Array.isArray(e.ledger))e.ledger=[];
    if(!e.store||typeof e.store!=="object")e.store={level:1,lastUpgradeDay:null};
    e.store.level=clamp(Math.round(num(e.store.level,1)),1,STORE_MULTIPLIERS.length);
    return e;
  }
  const isUser=(state,club)=>String(state.clubId)===String(club.id);
  function record(state,club,e,category,amount,label,meta){
    if(!isUser(state,club))return;
    e.ledger.unshift({day:num(state.day),month:monthOf(state.day),category,amount:Math.round(amount),label,...(meta||{})});
    if(e.ledger.length>LEDGER_MAX)e.ledger.length=LEDGER_MAX;
  }
  // Registra uma movimentação já aplicada por outro domínio (ex.: transferência),
  // sem creditar ou debitar o caixa uma segunda vez.
  function movement(state,club,category,amount,label,meta){
    if(!club||!Number.isFinite(Number(amount))||Number(amount)===0)return 0;
    record(state,club,ensure(state,club),category,Number(amount),label,meta);
    return Math.round(Number(amount));
  }
  // Receita: primeiro completa a reserva salarial, o resto vai para o orçamento de transferências.
  function income(state,club,category,amount,label,meta){
    amount=Math.round(num(amount));if(!club||amount<=0)return 0;
    const e=ensure(state,club),room=Math.max(0,reserveCap(club,state)-num(e.reserve));
    const toReserve=Math.min(room,amount);
    e.reserve=num(e.reserve)+toReserve;
    club.budget=num(club.budget)+(amount-toReserve);
    record(state,club,e,category,amount,label,meta);
    return amount;
  }
  // Despesa: sai da reserva salarial; se faltar, do orçamento de transferências.
  function expense(state,club,category,amount,label,meta){
    amount=Math.round(num(amount));if(!club||amount<=0)return 0;
    const e=ensure(state,club),fromReserve=Math.min(Math.max(0,num(e.reserve)),amount);
    e.reserve=num(e.reserve)-fromReserve;
    club.budget=num(club.budget)-(amount-fromReserve);
    record(state,club,e,category,-amount,label,meta);
    return amount;
  }
  function form(club){
    const t=club?.stats||{};const played=num(t.played);
    return played>0?clamp((num(t.w)+num(t.d)*.5)/played,0,1):.5;
  }
  function capacityOf(club){
    return Math.round((6000+Math.pow(clamp(num(club?.reputation,num(club?.structure,60)),20,100)/100,2.2)*70000)/100)*100;
  }
  // Bilheteria de um jogo em casa do clube do jogador.
  function matchGate(state,home,away,meta){
    const rep=num(home.reputation,num(home.structure,60)),opp=num(away?.reputation,num(away?.structure,60));
    const competitive=meta&&(meta.continentalMatch||meta.competitionId&&!/league|liga/i.test(String(meta.competitionId)));
    const occupancy=clamp(.45+rep/200+(form(home)-.5)*.2+clamp((opp-rep)/50,-1,1)*.1+(competitive?.05:0),.35,1);
    const capacity=capacityOf(home),attendance=Math.round(capacity*occupancy);
    const base=annualRevenue(home,state)*SHARE.gate/12;
    const amount=Math.round(base*(occupancy/.8)*(competitive?1.15:1));
    return {capacity,attendance,occupancy:Math.round(occupancy*1000)/1000,amount,avgTicket:attendance?Math.round(amount/attendance*100)/100:0};
  }
  function onMatch(state,match,home,away,meta){
    if(!state||!home||!match||!isUser(state,home))return null;
    const g=matchGate(state,home,away,meta);
    income(state,home,"bilheteria",g.amount,`Bilheteria: ${home.shortName||home.name} x ${away?.shortName||away?.name||"adversário"}`,
      {attendance:g.attendance,capacity:g.capacity});
    match.attendance=g.attendance;match.capacity=g.capacity;match.gate=g.amount;
    const win=(num(match.hg)-num(match.ag))>0;
    if(win){const e=ensure(state,home);e.winBoost=Math.min(.25,num(e.winBoost)+.04);}
    return g;
  }
  function storeDemand(state,club,e){
    const rep=clamp(num(club?.reputation,num(club?.structure,60)),20,100)/100;
    const star=(club.roster||[]).some(p=>num(p.ovr??p.overall)>=85)?1.1:1;
    return clamp((.72+form(club)*.36+num(e.winBoost))*(.75+rep*.35)*star,.55,1.55);
  }
  function merchMonth(state,club,e){
    const base=annualRevenue(club,state)*SHARE.merch/12;
    const m=calendarMonth(state.day),seasonal=m===11?1.4:m===7||m===0?1.2:m===5||m===6?.8:1;
    const level=clamp(Math.round(num(e.store?.level,1)),1,STORE_MULTIPLIERS.length);
    return Math.round(base*seasonal*storeDemand(state,club,e)*STORE_MULTIPLIERS[level-1]);
  }
  function storeSnapshot(state,club){
    club=club||(state?.clubId?getClub(state,state.clubId):null);if(!club)return null;
    const e=ensure(state,club),level=e.store.level,total=merchMonth(state,club,e),demand=storeDemand(state,club,e);
    const products=STORE_PRODUCTS.map((product,index)=>{
      const revenue=index===STORE_PRODUCTS.length-1?total-STORE_PRODUCTS.slice(0,-1).reduce((sum,x)=>sum+Math.round(total*x.share),0):Math.round(total*product.share);
      return {...product,revenue,units:Math.max(0,Math.round(revenue/product.price))};
    });
    const upgradeCost=level>=STORE_MULTIPLIERS.length?0:Math.max(500000,Math.round(annualRevenue(club,state)*(.018+.012*level)/10000)*10000);
    return {level,maxLevel:STORE_MULTIPLIERS.length,demand:Math.round(demand*100),expectedMonthly:total,products,upgradeCost,lastUpgradeDay:e.store.lastUpgradeDay};
  }
  function upgradeStore(state){
    const club=state?.clubId?getClub(state,state.clubId):null;if(!club)return {ok:false,reason:"Sem clube."};
    const e=ensure(state,club),shop=storeSnapshot(state,club);
    if(shop.level>=shop.maxLevel)return {ok:false,reason:"A loja já está no nível máximo."};
    if(num(club.budget)+num(e.reserve)<shop.upgradeCost)return {ok:false,reason:"Caixa insuficiente para ampliar a loja."};
    expense(state,club,"operacao",shop.upgradeCost,`Ampliação da loja do clube · nível ${shop.level+1}`);
    e.store.level=shop.level+1;e.store.lastUpgradeDay=num(state.day);
    return {ok:true,level:e.store.level,cost:shop.upgradeCost};
  }
  // Fechamento do mês de um clube. Clubes da IA usam o modelo simplificado (sem extrato).
  function closeClub(state,club){
    const e=ensure(state,club),user=isUser(state,club),ar=annualRevenue(club,state),pay=payroll(club,state);
    const f=form(club),jitter=.95+unit([club.id,state.day].join("|"))*.1;
    const detail={};
    const add=(cat,amount,label)=>{amount=Math.round(amount);detail[cat]=(detail[cat]||0)+amount;income(state,club,cat,amount,label);};
    add("tv",ar*SHARE.tv/12,"Direitos de TV (parcela mensal)");
    add("patrocinio",ar*SHARE.sponsor/12,"Patrocínios e publicidade fixos");
    const store=storeSnapshot(state,club);
    for(const product of store.products)add("camisas",product.revenue,`Loja do clube · ${product.name}`);
    add("outras",ar*SHARE.other/12,"Estádio, museu e eventos");
    if(!user)add("bilheteria",ar*SHARE.gate/12*(.8+f*.4)*jitter,"Bilheteria (média do mês)");
    e.winBoost=num(e.winBoost)*.5;
    const spend=(cat,amount,label)=>{amount=Math.round(amount);detail[cat]=(detail[cat]||0)-amount;expense(state,club,cat,amount,label);};
    spend("folha",pay.players,"Folha salarial do elenco");
    const staff=staffCost(state,club,pay);
    if(staff)spend("folha",staff,"Salário da comissão e do protagonista");
    spend("operacao",OPS_FIXED+pay.players*OPS_RATIO,"Operação do clube");
    e.lastClose={day:num(state.day),month:monthOf(state.day),detail,result:Object.values(detail).reduce((a,b)=>a+b,0)};
    return e.lastClose;
  }
  function monthlyClose(state){
    if(!state)return null;
    const seen=new Set(),all=[...(state.clubs||[]),...(state.globalFootball?.clubs||[])];
    let user=null;
    for(const club of all){
      if(!club||seen.has(String(club.id))||!Number.isFinite(Number(club.budget)))continue;
      seen.add(String(club.id));
      const r=closeClub(state,club);
      if(isUser(state,club))user=r;
    }
    maybeExtraSponsor(state);
    return user;
  }
  // Pagamentos de patrocínio já creditados em club.budget pelo ClubEconomy entram no extrato.
  function syncContracts(state){
    const club=state?.clubId?(getClub(state,state.clubId)||null):null;
    const history=state?.coachCareer?.finance?.revenueHistory;
    if(!club||!Array.isArray(history))return 0;
    const e=ensure(state,club);e.synced||=[];
    let n=0;
    for(const h of history){
      if(!h.paymentId||e.synced.includes(h.paymentId)||!(num(h.amount)>0))continue;
      e.synced.push(h.paymentId);
      record(state,club,e,"patrocinio",h.amount,`${h.event==="bonus"?"Bônus":"Parcela"} · ${h.brandName||"Patrocinador"}`,{day:num(h.processedDay,num(h.day))});
      n++;
    }
    if(e.synced.length>300)e.synced=e.synced.slice(-300);
    return n;
  }
  // Novos patrocinadores podem aparecer no meio da temporada quando o clube vai bem.
  function maybeExtraSponsor(state){
    const Eco=root.ProLifeClubEconomy,brands=root.ProLifeCommercial?.brands,fin=state?.coachCareer?.finance;
    const club=state?.clubId?getClub(state,state.clubId):null;
    if(!Eco||!Array.isArray(brands)||!fin||!club)return null;
    const offers=fin.sponsorshipOffers||=([]),contracts=fin.revenueContracts||=[];
    const open=offers.filter(o=>o.role==="partner"&&["pending","proposal","brand_accepted","brand_countered"].includes(o.status)).length;
    const active=contracts.filter(c=>c.sponsorRole==="partner"&&["scheduled","active"].includes(String(c.status||"scheduled"))&&num(c.endDay)>=num(state.day)).length;
    if(open>0||active>=Eco.SPONSORSHIP_RULES.roles.find(r=>r.id==="partner").maxActive)return null;
    if(form(club)<.5||unit([state.clubId,"extra",state.day].join("|"))>.45)return null;
    const used=new Set([...contracts.map(c=>String(c.brandId||"")),...offers.map(o=>String(o.brandId||""))]);
    const pool=Eco.sponsorshipCandidates(club,brands).filter(b=>!used.has(String(b.id))&&b.category!=="SPORTSWEAR").slice(0,6);
    if(!pool.length)return null;
    const brand=pool[hash([state.clubId,state.day].join("|"))%pool.length];
    const annual=Math.max(100000,Math.round(Eco.revenueProjection(club).sponsorshipAnnual*.15*(.9+form(club)*.3)/100000)*100000);
    const offer={id:`sponsor_${state.clubId}_partner_${state.season}_d${state.day}`,clubId:String(club.id),season:num(state.season),
      brandId:brand.id,brandName:brand.name,brandCategory:brand.category,brandTier:brand.tier,role:"partner",label:"Parceiro comercial",
      annualAmount:annual,durationDays:365,paymentFrequency:"monthly",paymentIntervalDays:30,
      bonus:{id:"league_position",kind:"league_position",targetPosition:10,label:"Terminar a liga entre os 10 primeiros",amount:Math.round(annual*.06/1000)*1000},
      obligations:["Cumprir a exclusividade comercial informada"],exclusive:false,exclusiveGroups:[],status:"pending",
      createdDay:num(state.day),expiresDay:num(state.day)+21,source:"club_finance_midseason"};
    offers.push(offer);
    return offer;
  }
  // Move dinheiro entre reserva salarial e orçamento de transferências (valor positivo = para salários).
  function moveFunds(state,amount){
    const club=state?.clubId?getClub(state,state.clubId):null;
    if(!club)return {ok:false,reason:"Sem clube."};
    const e=ensure(state,club);amount=Math.round(num(amount));
    if(!amount)return {ok:false,reason:"Informe um valor."};
    if(amount>0){amount=Math.min(amount,Math.max(0,num(club.budget)));club.budget-=amount;e.reserve+=amount;}
    else{amount=-Math.min(-amount,Math.max(0,num(e.reserve)));club.budget-=amount;e.reserve+=amount;}
    if(amount)record(state,club,e,"transferencia",0,amount>0?"Caixa movido para salários":"Caixa movido para transferências",{moved:amount});
    return {ok:true,moved:amount,transferBudget:club.budget,wageReserve:e.reserve};
  }
  function summary(state,monthsBack){
    const club=state?.clubId?getClub(state,state.clubId):null;
    if(!club)return null;
    syncContracts(state);
    const e=ensure(state,club),pay=payroll(club,state),staff=staffCost(state,club,pay);
    const monthlyCost=pay.players+staff+OPS_FIXED+Math.round(pay.players*OPS_RATIO);
    const cur=monthOf(state.day),from=cur-Math.max(1,num(monthsBack,3))+1,months={};
    for(const x of e.ledger){
      if(x.month<from)continue;
      const m=months[x.month]||={month:x.month,in:0,out:0,byCategory:{}};
      if(x.amount>0)m.in+=x.amount;else m.out+=-x.amount;
      m.byCategory[x.category]=(m.byCategory[x.category]||0)+x.amount;
    }
    const ar=annualRevenue(club,state);
    return {totalCash:Math.round(num(club.budget)+num(e.reserve)),transferBudget:Math.round(num(club.budget)),wageReserve:Math.round(num(e.reserve)),reserveCap:reserveCap(club,state),
      monthlyPayroll:pay.players+staff,monthlyCost,monthsCovered:monthlyCost?Math.round(num(e.reserve)/monthlyCost*10)/10:0,
      expectedMonthlyRevenue:Math.round(ar*(SHARE.tv+SHARE.sponsor+SHARE.merch+SHARE.other+SHARE.gate)/12),
      current:months[cur]||{month:cur,in:0,out:0,byCategory:{}},months:Object.values(months).sort((a,b)=>b.month-a.month),
      ledger:e.ledger.slice(0,60),lastClose:e.lastClose||null,capacity:capacityOf(club),store:storeSnapshot(state,club)};
  }
  const api={VERSION,bind,CATEGORIES,SHARE,STORE_PRODUCTS,payroll,annualRevenue,reserveCap,ensure,income,expense,movement,matchGate,onMatch,monthlyClose,closeClub,
    syncContracts,maybeExtraSponsor,moveFunds,summary,capacityOf,storeSnapshot,upgradeStore};
  root.ProLifeClubFinance=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
