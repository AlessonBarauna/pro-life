(function(root){
  "use strict";
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
    return levels.map(level=>({
      id:level.id,label:level.label,clubId:base.clubId,
      estimatedClubValue:base.economicValue,
      proposedTransferBudget:Math.round(base.suggestedTransferBudget*level.multiplier/100000)*100000,
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
  // M04.11: deterministic sponsorship offers with one role per club.
  function sponsorshipOffers(state,club,brands){
    if(!state||!club||String(club.id)!==String(state.clubId))return [];
    const candidates=sponsorshipCandidates(club,brands);
    const projection=revenueProjection(club).sponsorshipAnnual;
    const roles=[["main","Patrocinador principal",.6],["kit","Material esportivo",.25],["partner","Parceiro comercial",.15]];
    const contracts=state.coachCareer?.finance?.revenueContracts||[];
    const offers=state.coachCareer?.finance?.sponsorshipOffers||[];
    const occupiedBrands=new Set(contracts.filter(x=>Number(x.endDay)>Number(state.day)).map(x=>String(x.brandId||x.brandName||"")));
    for(const o of offers){if(o.status!=="rejected"&&o.status!=="brand_rejected")occupiedBrands.add(String(o.brandId||o.brandName||""));}
    return roles.filter(([role])=>!contracts.some(x=>x.sponsorRole===role&&x.endDay>state.day)&&
      !offers.some(x=>x.role===role&&["accepted","rejected","counter","awaiting_brand","brand_accepted","brand_rejected","brand_countered"].includes(x.status))).map(([role,label,fraction])=>{
      const available=candidates.filter(b=>(role!=="kit"||b.category==="SPORTSWEAR")&&!occupiedBrands.has(b.id));
      const brand=available[0];
      if(!brand)return null;
      occupiedBrands.add(brand.id);
      const annualAmount=Math.max(100000,Math.round(projection*fraction/100000)*100000);
      return {id:"sponsor_"+String(state.clubId)+"_"+role+"_"+String(state.season||0),
        brandId:brand.id,brandName:brand.name,role,label,annualAmount,durationDays:365,
        status:"proposal",expiresDay:Number(state.day)+14,readOnly:true};
    }).filter(Boolean);
  }
  function acceptSponsorshipOffer(state,club,brands,offerId){
    if(!state||!club||String(club.id)!==String(state.clubId)||!state.coachCareer)throw Error("Clube invalido.");
    const finance=state.coachCareer.finance||={};
    const existing=(finance.sponsorshipOffers||[]).find(x=>x.id===offerId);
    if(existing&&!["brand_accepted","brand_countered"].includes(existing.status))throw Error("Proposta ja finalizada.");
    const offer=existing&&["brand_accepted","brand_countered"].includes(existing.status)?existing:sponsorshipOffers(state,club,brands).find(x=>x.id===offerId);
    if(!offer)throw Error("Proposta indisponivel.");
    if(Number(state.day)>Number(existing?.responseExpiresDay??offer.expiresDay??(Number(state.day)+1)))throw Error("Proposta expirada.");
    const startDay=Number(state.day)+1;
    const contractId="contract_"+offer.id;
    const signed=registerRevenueContract(state,club.id,{
      id:contractId,type:"sponsorship",annualAmount:existing?.status==="brand_countered"?existing.brandCounterAmount:(offer.counterAmount||offer.annualAmount),startDay,
      durationDays:offer.durationDays
    });
    signed.brandId=offer.brandId;signed.brandName=offer.brandName;signed.sponsorRole=offer.role;
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
    if(existing)throw Error("Proposta ja respondida.");
    const proposed=Number(amount);
    if(decision==="counter"&&(!Number.isSafeInteger(proposed)||proposed<offer.annualAmount||
      proposed>Math.round(offer.annualAmount*1.2)))throw Error("Contraproposta fora do limite.");
    const record={...offer,status:decision==="reject"?"rejected":"awaiting_brand",counterAmount:decision==="counter"?proposed:null,answeredDay:Number(state.day),replyDay:decision==="counter"?Number(state.day)+3:null};
    finance.sponsorshipOffers||=[];
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
    const entry={id,clubId:String(clubId),type,annualAmount:amount,startDay:start,
      endDay:start+duration,status:"scheduled",postedAmount:0,postedPeriods:[],createdDay:Number(state.day)};
    contracts.push(entry);
    finance.revenueHistory||=[];
    finance.revenueHistory.push({contractId:id,day:Number(state.day),event:"registered",amount:0});
    return entry;
  }
  function revenueContractsSnapshot(state,clubId){
    const records=state?.coachCareer?.finance?.revenueContracts;
    return (Array.isArray(records)?records:[]).filter(x=>String(x.clubId)===String(clubId))
      .map(x=>({...x,postedPeriods:[...(x.postedPeriods||[])]}));
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
      let period=0;
      for(let day=start+30;day<=end;day+=30){
        period++;
        if(day<today||posted.has(period))continue;
        events.push({contractId:contract.id,type:contract.type,dueDay:day,
          expectedAmount:Math.round(amount/12),period,status:"forecast_only"});
      }
    }
    return events.sort((a,b)=>a.dueDay-b.dueDay||String(a.contractId).localeCompare(String(b.contractId))).slice(0,36);
  }
  const api={estimate,scenarios,compare,calibration,fundingSnapshot,revenueProjection,registerRevenueContract,revenueContractsSnapshot,revenueSchedule,sponsorshipCandidates,sponsorshipOffers,acceptSponsorshipOffer,decideSponsorship,settleSponsorshipReplies,rejectBrandCounter,VERSION:"m04.14"};
  root.ProLifeClubEconomy=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
