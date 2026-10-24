(function(root){
  "use strict";
  const SPONSORSHIP_RULES=Object.freeze({
    roles:Object.freeze([
      Object.freeze({id:"main",label:"Patrocinador principal",share:.6,allowedCategories:null,exclusive:true,maxActive:1}),
      Object.freeze({id:"kit",label:"Material esportivo",share:.25,allowedCategories:["SPORTSWEAR"],exclusive:true,maxActive:1}),
      Object.freeze({id:"partner",label:"Parceiro comercial",share:.15,excludedCategories:["SPORTSWEAR"],exclusive:false,maxActive:3})
    ]),
    responseDays:21,durationDays:365,paymentIntervalDays:30,maxCounterPremium:.2
  });
  const hash=value=>{let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  const financeOf=state=>state?.coachCareer?(state.coachCareer.finance||={}):null;
  const activeContract=(x,day)=>x&&["scheduled","active"].includes(String(x.status||"scheduled"))&&Number(x.endDay)>=Number(day);
  // M04.1: informative valuation for new-career calibration only.
  // Never rewrites club budgets, existing saves, or historical transfers.
  function estimate(club){
    const power=Math.max(30,Math.min(100,Number(club?.structure??club?.strength??club?.reputation??60)||60));
    const size=Array.isArray(club?.roster)?club.roster.length:0;
    const division=String(club?.leagueId||"");
    const leagueFactor=/serieA|premier|laliga|bundesliga|seriea_it|ligue1/i.test(division)?1.6:
      /serieB|championship/i.test(division)?.9:/serieC/i.test(division)?.55:/serieD/i.test(division)?.35:1;
    const economicValue=Math.round((20000000*Math.pow(power/60,4.5)*leagueFactor)/100000)*100000;
    const suggestedTransferBudget=Math.round(economicValue*.18/100000)*100000;
    const budget=Number(club?.budget);
    return {clubId:String(club?.id||""),economicValue,suggestedTransferBudget,
      currentBudget:Number.isFinite(budget)&&club?.budget!=null?budget:null,
      rosterSize:size,source:"pro_life_estimate",readOnly:true};
  }
  // M04.2: side-by-side economic scenarios, never mutate a club.
  function scenarios(club){
    const base=estimate(club);
    const levels=[
      {id:"conservative",label:"Conservador",multiplier:.7},
      {id:"standard",label:"Padrão",multiplier:1},
      {id:"ambitious",label:"Ambicioso",multiplier:1.5}
    ];
    // 100% = orçamento real do clube; só usa a estimativa quando o clube não tem orçamento.
    const reference=base.currentBudget>0?base.currentBudget:base.suggestedTransferBudget;
    return levels.map(level=>({
      id:level.id,label:level.label,clubId:base.clubId,
      estimatedClubValue:base.economicValue,
      proposedTransferBudget:Math.round(reference*level.multiplier/100000)*100000,
      existingBudget:base.currentBudget,
      readOnly:true,source:"pro_life_scenario"
    }));
  }
  function compare(clubs){
    return (Array.isArray(clubs)?clubs:[]).filter(c=>c&&c.id).map(c=>({
      clubId:c.id,leagueId:c.leagueId||null,...estimate(c),
      scenarios:scenarios(c)
    }));
  }
  // M04.3: calibration report only; no budget assignment, no save writes.
  function calibration(clubs){
    const rows=compare(clubs).map(row=>{
      const proposed=row.suggestedTransferBudget;
      const current=row.currentBudget;
      const ratio=current!=null&&proposed>0?current/proposed:null;
      const assessment=ratio==null?"sem_orcamento":
        ratio<.5?"abaixo_da_referencia":ratio>2?"acima_da_referencia":"dentro_da_faixa";
      return {...row,ratio,assessment};
    });
    const counts={sem_orcamento:0,abaixo_da_referencia:0,acima_da_referencia:0,dentro_da_faixa:0};
    rows.forEach(row=>{counts[row.assessment]++;});
    return {rows,counts,total:rows.length,readOnly:true,method:"reference_comparison",version:"m04.3"};
  }
  // M04.6: reporting model only; never creates income, charges wages or changes budgets.
  function fundingSnapshot(club,finance,monthlyPayroll){
    const data=finance&&typeof finance==="object"?finance:{};
    const sources=Array.isArray(data.recurringRevenues)?data.recurringRevenues:[];
    const valid=sources.filter(x=>x&&x.active===true&&
      Number.isFinite(Number(x.monthlyAmount))&&Number(x.monthlyAmount)>0);
    const monthlyRevenue=valid.reduce((sum,x)=>sum+Number(x.monthlyAmount),0);
    const payroll=Number.isFinite(Number(monthlyPayroll))?Math.max(0,Number(monthlyPayroll)):0;
    const salaryBudget=Number.isFinite(Number(data.salaryBudget))&&
      data.salaryBudget!==null&&data.salaryBudget!==""&&Number(data.salaryBudget)>=0?Number(data.salaryBudget):null;
    const fundingGap=Math.max(0,payroll-monthlyRevenue);
    return {clubId:String(club?.id||""),monthlyPayroll:payroll,monthlyRevenue,
      annualRevenue:monthlyRevenue*12,salaryBudget,fundingGap,
      revenueSourceCount:valid.length,
      salaryBudgetGap:salaryBudget===null?null:Math.max(0,payroll-salaryBudget),
      revenueConfigured:valid.length>0,readOnly:true};
  }
  // M04.7: hypothetical annual media/sponsorship projection; NOT contracted income.
  function revenueProjection(club){
    const structure=Math.max(30,Math.min(100,Number(club?.structure??club?.strength??club?.reputation??60)||60));
    const league=String(club?.leagueId||"").toLowerCase();
    const tier=league==="seriea"?1:league==="serieb"?.46:league==="seriec"?.18:league==="seried"?.07:.5;
    const scale=Math.pow(structure/70,2.4);
    const sponsorshipAnnual=Math.round(12000000*tier*scale/100000)*100000;
    const broadcastAnnual=Math.round(30000000*tier*scale/100000)*100000;
    return {clubId:String(club?.id||""),leagueId:String(club?.leagueId||""),
      sponsorshipAnnual,broadcastAnnual,totalAnnual:sponsorshipAnnual+broadcastAnnual,
      status:"simulation_only",recognizedRevenue:0,readOnly:true};
  }
  // M04.10: read-only reuse of existing player-commercial brand identities.
  // It is a candidate catalog, not a record of current club sponsorships.
  function sponsorshipCandidates(club,brands){
    const tierRank={LOCAL:1,REGIONAL:2,NATIONAL:3,PREMIUM:4,GLOBAL:5};
    const strength=Math.max(0,Math.min(100,Number(club?.structure??club?.strength??club?.reputation??60)||60));
    const minTier=strength>=85?3:strength>=65?2:1;
    return (Array.isArray(brands)?brands:[]).filter(b=>b&&b.id&&b.name&&
      Number.isFinite(tierRank[String(b.tier)])&&tierRank[String(b.tier)]>=minTier)
      .map(b=>({id:String(b.id),name:String(b.name),category:String(b.category||""),
        tier:String(b.tier),prestige:Number(b.prestige)||0,source:"commercial_brand_catalog",
        existingClubContract:false,readOnly:true}))
      .sort((a,b)=>b.prestige-a.prestige||a.name.localeCompare(b.name,"pt-BR"));
  }
  function categoryGroups(category,role,exclusive=role!=="partner"){
    const groups=exclusive?["role:"+String(role)]:[];
    if(String(category)==="SPORTSWEAR")groups.push("sportswear");
    return groups;
  }
  function conflictReason(offer,contract){
    const a=new Set(offer.exclusiveGroups||categoryGroups(offer.brandCategory,offer.role,offer.exclusive));
    const b=contract.exclusiveGroups||categoryGroups(contract.brandCategory,contract.sponsorRole,contract.exclusive);
    const group=b.find(x=>a.has(x));
    if(!group)return "";
    return group==="sportswear"?"Conflito de exclusividade entre marcas de material esportivo.":
      "A categoria "+String(offer.label||offer.role)+" já possui contrato ativo.";
  }
  function sponsorshipConflict(state,offer){
    const contracts=financeOf(state)?.revenueContracts||[];
    const contract=contracts.find(x=>activeContract(x,state.day)&&x.type==="sponsorship"&&conflictReason(offer,x));
    return contract?{contract,reason:conflictReason(offer,contract)}:null;
  }
  function makeBonus(club,role,annualAmount){
    const strength=Math.max(30,Math.min(100,Number(club?.structure??club?.strength??60)||60));
    const targetPosition=strength>=82?4:strength>=65?8:strength>=48?12:16;
    const rate=role==="main"?.12:role==="kit"?.08:.06;
    return {id:"league_position",kind:"league_position",targetPosition,
      label:"Terminar a liga entre os "+targetPosition+" primeiros",amount:Math.round(annualAmount*rate/1000)*1000};
  }
  // Materializa propostas no save: notificações, painel e decisões usam os mesmos IDs.
  function initializeSponsorships(state,club,brands){
    if(!state?.coachCareer||!club||String(club.id)!==String(state.clubId)||!Array.isArray(brands))return [];
    const finance=financeOf(state),offers=finance.sponsorshipOffers||=([]),contracts=finance.revenueContracts||=[];
    const season=Number(state.season)||0,candidates=sponsorshipCandidates(club,brands),projection=revenueProjection(club).sponsorshipAnnual;
    const occupiedBrands=new Set(contracts.filter(x=>activeContract(x,state.day)).map(x=>String(x.brandId||x.brandName||"")));
    for(const o of offers)if(!["rejected","expired","brand_rejected","ended"].includes(o.status))occupiedBrands.add(String(o.brandId||o.brandName||""));
    for(const rule of SPONSORSHIP_RULES.roles){
      if(contracts.filter(x=>activeContract(x,state.day)&&x.sponsorRole===rule.id).length>=rule.maxActive)continue;
      if(offers.some(x=>x.role===rule.id&&Number(x.season)===season))continue;
      let available=candidates.filter(b=>!occupiedBrands.has(b.id));
      if(rule.allowedCategories)available=available.filter(b=>rule.allowedCategories.includes(b.category));
      if(rule.excludedCategories)available=available.filter(b=>!rule.excludedCategories.includes(b.category));
      if(!available.length)continue;
      const pool=available.slice(0,Math.min(6,available.length));
      const brand=pool[hash([state.clubId,season,rule.id].join("|"))%pool.length];
      occupiedBrands.add(brand.id);
      const annualAmount=Math.max(100000,Math.round(projection*rule.share/100000)*100000);
      const prior=contracts.filter(x=>x.type==="sponsorship"&&x.sponsorRole===rule.id).sort((a,b)=>Number(b.endDay)-Number(a.endDay))[0];
      offers.push({id:"sponsor_"+String(state.clubId)+"_"+rule.id+"_"+season,
        clubId:String(club.id),season,brandId:brand.id,brandName:brand.name,brandCategory:brand.category,
        brandTier:brand.tier,role:rule.id,label:rule.label,annualAmount,durationDays:SPONSORSHIP_RULES.durationDays,
        paymentFrequency:"monthly",paymentIntervalDays:SPONSORSHIP_RULES.paymentIntervalDays,
        bonus:makeBonus(club,rule.id,annualAmount),obligations:["Manter o clube elegível nas competições oficiais","Cumprir a exclusividade comercial informada"],
        exclusive:rule.exclusive,exclusiveGroups:categoryGroups(brand.category,rule.id,rule.exclusive),status:"pending",
        createdDay:Number(state.day),expiresDay:Number(state.day)+SPONSORSHIP_RULES.responseDays,
        renewalOf:prior?.id||null,source:"club_sponsorship_engine"});
    }
    return offers;
  }
  // M04.11: retorna somente propostas acionáveis e persistidas.
  function sponsorshipOffers(state,club,brands){
    const stored=state?.coachCareer?.finance?.sponsorshipOffers||[];
    const pending=stored.filter(o=>["pending","proposal"].includes(o.status)&&Number(o.expiresDay)>=Number(state.day));
    if(pending.length)return pending;
    // Compatibilidade: consultas antigas continuam puras; a materialização explícita ocorre na carreira/UI.
    const shadow={...state,coachCareer:{...state.coachCareer,finance:{...(state.coachCareer?.finance||{}),
      sponsorshipOffers:[...stored],revenueContracts:[...(state.coachCareer?.finance?.revenueContracts||[])]}}};
    initializeSponsorships(shadow,club,brands);
    return (shadow.coachCareer.finance.sponsorshipOffers||[]).filter(o=>["pending","proposal"].includes(o.status)&&Number(o.expiresDay)>=Number(state.day))
      .map(o=>({...o,status:"proposal",readOnly:true}));
  }
  function acceptSponsorshipOffer(state,club,brands,offerId){
    if(!state||!club||String(club.id)!==String(state.clubId)||!state.coachCareer)throw Error("Clube invalido.");
    const finance=state.coachCareer.finance||={};
    const existing=(finance.sponsorshipOffers||[]).find(x=>x.id===offerId);
    if(existing&&!["pending","proposal","brand_accepted","brand_countered"].includes(existing.status))throw Error("Proposta ja finalizada.");
    const offer=existing&&["brand_accepted","brand_countered"].includes(existing.status)?existing:sponsorshipOffers(state,club,brands).find(x=>x.id===offerId);
    if(!offer)throw Error("Proposta indisponivel.");
    if(Number(state.day)>Number(existing?.responseExpiresDay??offer.expiresDay??(Number(state.day)+1)))throw Error("Proposta expirada.");
    const conflict=sponsorshipConflict(state,offer);
    if(conflict)throw Error(conflict.reason+" Contrato atual: "+String(conflict.contract.brandName||"patrocinador vigente")+".");
    const startDay=Number(state.day)+1;
    const contractId="contract_"+offer.id;
    const signed=registerRevenueContract(state,club.id,{
      id:contractId,type:"sponsorship",annualAmount:existing?.status==="brand_countered"?existing.brandCounterAmount:(offer.counterAmount||offer.annualAmount),startDay,
      durationDays:offer.durationDays,paymentIntervalDays:offer.paymentIntervalDays,
      bonus:offer.bonus,obligations:offer.obligations
    });
    Object.assign(signed,{brandId:offer.brandId,brandName:offer.brandName,brandCategory:offer.brandCategory,
      sponsorRole:offer.role,sponsorRoleLabel:offer.label,exclusive:offer.exclusive,
      exclusiveGroups:[...(offer.exclusiveGroups||[])],bonus:offer.bonus,obligations:[...(offer.obligations||[])]});
    finance.sponsorshipOffers||=[];
    if(existing){Object.assign(existing,{status:"accepted",acceptedDay:Number(state.day),contractId});}
    else finance.sponsorshipOffers.push({...offer,status:"accepted",acceptedDay:Number(state.day),contractId});
    return signed;
  }
  // Rejection and counteroffers are stored without changing the club budget.
  function decideSponsorship(state,club,brands,offerId,decision,amount){
    if(!["reject","counter"].includes(decision))throw Error("Decisao invalida.");
    if(!state?.coachCareer||String(club?.id)!==String(state?.clubId))throw Error("Clube invalido.");
    const finance=state.coachCareer.finance||={};
    const offer=sponsorshipOffers(state,club,brands).find(x=>x.id===offerId);
    if(!offer)throw Error("Proposta indisponivel.");
    const existing=(finance.sponsorshipOffers||[]).find(x=>x.id===offerId);
    if(existing&&!["pending","proposal"].includes(existing.status))throw Error("Proposta ja respondida.");
    const proposed=Number(amount);
    if(decision==="counter"&&(!Number.isSafeInteger(proposed)||proposed<offer.annualAmount||
      proposed>Math.round(offer.annualAmount*(1+SPONSORSHIP_RULES.maxCounterPremium))))throw Error("Contraproposta fora do limite.");
    const record={...offer,status:decision==="reject"?"rejected":"awaiting_brand",counterAmount:decision==="counter"?proposed:null,answeredDay:Number(state.day),replyDay:decision==="counter"?Number(state.day)+3:null};
    finance.sponsorshipOffers||=[];
    if(existing){Object.assign(existing,record);return existing;}
    finance.sponsorshipOffers.push(record);
    return record;
  }
  // M04.12: brand decisions occur only on career-day progression, never on render.
  function settleSponsorshipReplies(state){
    const offers=state?.coachCareer?.finance?.sponsorshipOffers;
    if(!Array.isArray(offers))return [];
    const resolved=[];
    for(const o of offers){
      if(o.status!=="awaiting_brand"&&o.status!=="counter")continue;
      const due=Number.isSafeInteger(o.replyDay)?o.replyDay:Number(o.answeredDay||state.day)+3;
      if(Number(state.day)<due)continue;
      // Deterministic, stable brand response: modest increases are more likely to succeed.
      const premium=Number(o.counterAmount)/Number(o.annualAmount||1);
      const approved=Number.isFinite(premium)&&premium<=1.12;
      const negotiable=Number.isFinite(premium)&&premium>1.12&&premium<=1.2;
      o.status=approved?"brand_accepted":negotiable?"brand_countered":"brand_rejected";
      if(negotiable)o.brandCounterAmount=Math.round((Number(o.annualAmount)*1.08)/1000)*1000;
      if(approved||negotiable)o.responseExpiresDay=Number(state.day)+7;
      o.replyDay=due;
      o.respondedDay=Number(state.day);
      o.brandResponse=approved?"Contraproposta aceita pela marca. Confirme para assinar.":negotiable?"A marca enviou uma nova oferta de R$ "+o.brandCounterAmount.toLocaleString("pt-BR")+" por ano. Você tem 7 dias para responder.":"Marca recusou a contraproposta.";
      resolved.push(o);
    }
    return resolved;
  }
  function rejectBrandCounter(state,offerId){
    const offers=state?.coachCareer?.finance?.sponsorshipOffers;
    const offer=Array.isArray(offers)?offers.find(x=>x.id===offerId):null;
    if(!offer||offer.status!=="brand_countered")throw Error("Resposta de marca indisponivel.");
    offer.status="rejected";
    offer.rejectedDay=Number(state.day);
    return offer;
  }
  // M04.8: explicit contract registration; no automatic funding or retroactive receivables.
  function registerRevenueContract(state,clubId,input){
    if(!state||!state.coachCareer||String(state.clubId)!==String(clubId))throw Error("Clube da carreira invalido.");
    const type=String(input?.type||"");
    if(!["sponsorship","broadcast"].includes(type))throw Error("Tipo de receita invalido.");
    const amount=Number(input?.annualAmount),start=Number(input?.startDay),duration=Number(input?.durationDays);
    if(!Number.isSafeInteger(amount)||amount<=0||!Number.isSafeInteger(start)||start<Number(state.day)||
      !Number.isSafeInteger(duration)||duration<30||duration>1825)throw Error("Dados do contrato invalidos.");
    const finance=state.coachCareer.finance||={};
    const contracts=finance.revenueContracts||=[];
    const id=String(input?.id||"");
    if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw Error("Identificador do contrato invalido.");
    if(contracts.some(x=>x.id===id))throw Error("Contrato ja registrado.");
    const interval=Number(input?.paymentIntervalDays||30);
    if(!Number.isSafeInteger(interval)||interval<7||interval>365)throw Error("Periodicidade de pagamento invalida.");
    const entry={id,clubId:String(clubId),type,annualAmount:amount,startDay:start,
      endDay:start+duration,status:"scheduled",paymentIntervalDays:interval,paymentFrequency:interval===30?"monthly":"custom",
      postedAmount:0,postedPeriods:[],processedBonusIds:[],createdDay:Number(state.day),
      bonus:input?.bonus?{...input.bonus}:null,obligations:Array.isArray(input?.obligations)?[...input.obligations]:[]};
    contracts.push(entry);
    finance.revenueHistory||=[];
    finance.revenueHistory.push({contractId:id,day:Number(state.day),event:"registered",amount:0});
    return entry;
  }
  function revenueContractsSnapshot(state,clubId){
    const records=state?.coachCareer?.finance?.revenueContracts;
    return (Array.isArray(records)?records:[]).filter(x=>String(x.clubId)===String(clubId))
      .map(x=>({...x,postedPeriods:[...(x.postedPeriods||[])],processedBonusIds:[...(x.processedBonusIds||[])],
        bonus:x.bonus?{...x.bonus}:null,obligations:[...(x.obligations||[])]}));
  }
  // M04.9: read-only future due dates, measured in career days.
  function revenueSchedule(state,clubId){
    const today=Number(state?.day)||0,events=[];
    for(const contract of revenueContractsSnapshot(state,clubId)){
      const start=Number(contract.startDay),end=Number(contract.endDay);
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<=start)continue;
      const amount=Number(contract.annualAmount);
      if(!Number.isFinite(amount)||amount<=0)continue;
      const posted=new Set(contract.postedPeriods||[]);
      const interval=Number(contract.paymentIntervalDays)||30;
      let period=0;
      for(let day=start+interval;day<=end;day+=interval){
        period++;
        if(day<today||posted.has(period))continue;
        events.push({contractId:contract.id,type:contract.type,dueDay:day,
          expectedAmount:Math.round(amount/Math.max(1,Math.round(365/interval))),period,status:"forecast_only"});
      }
    }
    return events.sort((a,b)=>a.dueDay-b.dueDay||String(a.contractId).localeCompare(String(b.contractId))).slice(0,36);
  }
  function processRevenuePayments(state,club){
    if(!state?.coachCareer||!club||String(club.id)!==String(state.clubId))return [];
    const finance=financeOf(state),history=finance.revenueHistory||=([]),paid=[];
    for(const contract of (finance.revenueContracts||[])){
      if(String(contract.clubId)!==String(club.id)||!["sponsorship","broadcast"].includes(contract.type))continue;
      contract.postedPeriods||=[];contract.processedBonusIds||=[];
      const start=Number(contract.startDay),end=Number(contract.endDay),interval=Number(contract.paymentIntervalDays)||30;
      if(Number(state.day)>=start&&Number(state.day)<=end)contract.status="active";
      for(let period=1,due=start+interval;due<=Math.min(Number(state.day),end);period++,due+=interval){
        if(contract.postedPeriods.includes(period))continue;
        const amount=Math.round(Number(contract.annualAmount)/Math.max(1,Math.round(365/interval)));
        const paymentId=contract.id+":period:"+period;
        if(history.some(x=>x.paymentId===paymentId)){contract.postedPeriods.push(period);continue;}
        club.budget=(Number(club.budget)||0)+amount;
        contract.postedPeriods.push(period);contract.postedAmount=(Number(contract.postedAmount)||0)+amount;
        history.push({paymentId,contractId:contract.id,day:due,processedDay:Number(state.day),event:"payment",amount,period,
          brandName:contract.brandName||null});
        paid.push({contractId:contract.id,paymentId,amount,period,dueDay:due});
      }
      if(Number(state.day)>end)contract.status="ended";
    }
    return paid;
  }
  function processSponsorshipBonuses(state,club,table){
    if(Number(state?.day)%365!==0||!club)return [];
    const rows=Array.isArray(table)?table:[],index=rows.findIndex(x=>String(x.id||x.clubId)===String(club.id));
    if(index<0)return [];
    const position=index+1,finance=financeOf(state),paid=[];
    if(!finance)return paid;
    const history=finance.revenueHistory||=([]);
    for(const contract of (finance?.revenueContracts||[])){
      const bonus=contract.bonus,bonusId=String(state.season)+":"+String(bonus?.id||"");
      contract.processedBonusIds||=[];
      if(contract.type!=="sponsorship"||!activeContract(contract,state.day)||!bonus||contract.processedBonusIds.includes(bonusId))continue;
      if(bonus.kind!=="league_position"||position>Number(bonus.targetPosition))continue;
      const paymentId=contract.id+":bonus:"+bonusId,amount=Number(bonus.amount)||0;
      if(amount<=0)continue;
      if(!history.some(x=>x.paymentId===paymentId)){
        club.budget=(Number(club.budget)||0)+amount;
        history.push({paymentId,contractId:contract.id,day:Number(state.day),event:"bonus",amount,bonusId,brandName:contract.brandName||null});
      }
      contract.processedBonusIds.push(bonusId);paid.push({contractId:contract.id,paymentId,amount,bonusId});
    }
    return paid;
  }
  function processSponsorshipLifecycle(state,club,brands){
    const finance=financeOf(state);if(!finance)return {expired:[],created:[]};
    const expired=[];
    for(const offer of (finance.sponsorshipOffers||[])){
      const deadline=["brand_accepted","brand_countered"].includes(offer.status)?offer.responseExpiresDay:offer.expiresDay;
      if(["pending","proposal","brand_accepted","brand_countered"].includes(offer.status)&&Number(deadline)<Number(state.day)){
        offer.status="expired";offer.expiredDay=Number(state.day);expired.push(offer.id);
      }
    }
    const before=(finance.sponsorshipOffers||[]).length;
    initializeSponsorships(state,club,brands);
    return {expired,created:(finance.sponsorshipOffers||[]).slice(before).map(x=>x.id)};
  }
  const api={estimate,scenarios,compare,calibration,fundingSnapshot,revenueProjection,registerRevenueContract,revenueContractsSnapshot,revenueSchedule,
    sponsorshipCandidates,sponsorshipOffers,initializeSponsorships,sponsorshipConflict,acceptSponsorshipOffer,decideSponsorship,
    settleSponsorshipReplies,rejectBrandCounter,processRevenuePayments,processSponsorshipBonuses,processSponsorshipLifecycle,
    SPONSORSHIP_RULES,VERSION:"m05.0"};
  root.ProLifeClubEconomy=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
