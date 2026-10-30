(function(root){
  "use strict";
  // Motor de regras de mercado inspirado nos comportamentos publicos do modo carreira.
  // Os coeficientes sao do PRO LIFE: a EA nao publica sua formula proprietaria.
  const VERSION="prolife-xtv-v1";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const number=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const money=v=>{const n=Math.max(100000,number(v));const step=n>=200000000?1000000:n>=20000000?500000:n>=1000000?100000:50000;return Math.round(n/step)*step;};
  const position=p=>String(p?.primaryPosition||p?.pos||p?.position||"").toUpperCase();
  const groupOf=p=>({GOL:"GK",GK:"GK",ZAG:"DEF",CB:"DEF",LD:"DEF",RB:"DEF",LE:"DEF",LB:"DEF",DEF:"DEF",VOL:"MID",CDM:"MID",MC:"MID",CM:"MID",MEI:"MID",CAM:"MID",ME:"MID",LM:"MID",MD:"MID",RM:"MID",PE:"ATT",LW:"ATT",PD:"ATT",RW:"ATT",ATA:"ATT",CA:"ATT",ST:"ATT",CF:"ATT"})[position(p)]||"MID";
  const posFactor=p=>({GK:.86,DEF:.93,MID:1,ATT:1.08})[groupOf(p)];
  const ageFactor=age=>age<=18?1.08:age<=21?1.18:age<=24?1.14:age<=27?1.06:age<=29?1:age<=31?.86:age<=33?.66:age<=35?.43:.25;
  function contractMonths(player,ctx){
    if(Number.isFinite(Number(ctx?.contractMonths)))return clamp(Number(ctx.contractMonths),0,72);
    const end=number(player?.contractEndDay??player?.contract?.endDay,NaN),day=number(ctx?.day,0);
    return Number.isFinite(end)?clamp((end-day)/30.4375,0,72):36;
  }
  const contractFactor=months=>months<=6?.58:months<=12?.72:months<=24?.9:months<=36?1:months<=48?1.08:1.13;
  function recentForm(player,ctx){
    const rows=Array.isArray(ctx?.recentRatings)?ctx.recentRatings:Array.isArray(player?.recentRatings)?player.recentRatings:[];
    const values=rows.slice(-5).map(Number).filter(Number.isFinite);
    if(!values.length)return {average:6.5,factor:1};
    const average=values.reduce((a,b)=>a+b,0)/values.length;
    return {average,factor:clamp(1+(average-6.5)*.08,.84,1.2)};
  }
  function squadDepth(player,ctx){
    if(Number.isFinite(Number(ctx?.squadDepth)))return Math.max(0,Number(ctx.squadDepth));
    const roster=ctx?.sellerClub?.roster||[];
    const group=groupOf(player);
    return roster.filter(p=>p?.id!==player?.id&&groupOf(p)===group&&p?.status!=="retired"&&p?.active!==false).length+1;
  }
  function marketValue(player,ctx={}){
    const overall=clamp(number(player?.overall??player?.ovr,65),40,99),potential=clamp(number(player?.potential,overall),overall,99),age=clamp(number(player?.age,26),14,45);
    const base=210000000*Math.pow(overall/84,10);
    const potentialFactor=1+Math.min(.65,Math.max(0,potential-overall)*.045);
    const months=contractMonths(player,ctx),form=recentForm(player,ctx),morale=clamp(number(ctx.morale??player?.morale,60),0,100);
    const moraleFactor=clamp(1+(morale-60)*.0025,.9,1.1),depth=squadDepth(player,ctx),depthFactor=depth<=2?1.4:depth===3?1.18:depth>=7?.94:1;
    const rival=ctx.historicalRival===true||ctx.isRival===true;
    if(rival&&ctx.rivalPolicy==="block")return {version:VERSION,blocked:true,reason:"rival_historico",xTV:null,baseValue:money(base)};
    const rivalryFactor=rival?1.5:1;
    const xTV=money(base*ageFactor(age)*potentialFactor*contractFactor(months)*posFactor(player)*form.factor*moraleFactor*depthFactor*rivalryFactor);
    return {version:VERSION,blocked:false,xTV,baseValue:money(base),inputs:{age,overall,potential,contractMonths:Math.round(months),position:position(player),recentForm:+form.average.toFixed(2),morale,squadDepth:depth},modifiers:{age:ageFactor(age),potential:potentialFactor,contract:contractFactor(months),position:posFactor(player),form:form.factor,morale:moraleFactor,depth:depthFactor,rivalry:rivalryFactor}};
  }
  function validateTerms(terms={}){
    const years=number(terms.installmentYears??terms.installments??1,1);
    if(!Number.isInteger(years)||years<1||years>6)throw Error("O parcelamento deve ter entre 1 e 6 anos.");
    const exchange=terms.exchangePlayer;
    if(exchange&&(exchange.loaned===true||exchange.contract?.type==="loan"||exchange.loan?.active===true))throw Error("Jogadores emprestados não podem ser incluídos em troca definitiva.");
    const sellOn=number(terms.sellOn,0);
    if(sellOn<0||sellOn>50)throw Error("Percentual de revenda inválido.");
    const bonuses=Array.isArray(terms.performanceBonuses)?terms.performanceBonuses:[];
    for(const b of bonuses){if(!["appearances","goals","titles"].includes(b?.type)||number(b.target)<=0||number(b.amount)<0)throw Error("Cláusula de desempenho inválida.");}
    return {installmentYears:years,exchangePlayer:exchange||null,sellOn,performanceBonuses:bonuses.map(b=>({type:b.type,target:Math.floor(number(b.target)),amount:Math.floor(number(b.amount)),paid:false}))};
  }
  function installmentSchedule(total,years=1,ctx={}){
    years=validateTerms({installmentYears:years}).installmentYears;total=Math.max(0,Math.floor(number(total)));
    const base=Math.floor(total/years),remainder=total-base*years,startDay=number(ctx.day,0),season=number(ctx.season,0);
    return Array.from({length:years},(_,i)=>({number:i+1,amount:base+(i<remainder?1:0),dueDay:startDay+i*365,dueSeason:season+i,paid:false}));
  }
  function evaluateOffer(negotiation={},proposal={},ctx={}){
    const xTV=Math.max(1,number(ctx.xTV??negotiation.xTV)),offer=Math.max(0,number(proposal.amount)),ratio=offer/xTV;
    let delta=ratio<.8?30:ratio<.95?15:ratio<=1.08?5:0;
    const prior=number(negotiation.lastOffer,NaN);
    if(Number.isFinite(prior)&&offer<=prior*1.02)delta+=20;
    if(number(proposal.sellOn)>=10)delta-=10;
    if(Array.isArray(proposal.performanceBonuses)&&proposal.performanceBonuses.some(b=>number(b.amount)>0))delta-=5;
    const tension=clamp(number(negotiation.tension,0)+delta,0,100),walkedAway=tension>=100;
    const currentDay=number(ctx.day,0),accepted=!walkedAway&&ratio>=number(ctx.acceptRatio,.95);
    return {ratio:+ratio.toFixed(4),delta,tension,accepted,walkedAway,status:walkedAway?"walked_away":accepted?"accepted":"counter",lockUntilDay:walkedAway?currentDay+21:null,counterAmount:walkedAway||accepted?null:money(xTV*(1+Math.min(.08,tension/1000)))};
  }
  const api={VERSION,marketValue,validateTerms,installmentSchedule,evaluateOffer,groupOf};
  root.ProLifeTransferMarketRules=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
