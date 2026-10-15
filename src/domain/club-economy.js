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
  const api={estimate,scenarios,compare,calibration,fundingSnapshot,revenueProjection,VERSION:"m04.7"};
  root.ProLifeClubEconomy=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
