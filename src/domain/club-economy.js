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
  const api={estimate,scenarios,compare,calibration,VERSION:"m04.3"};
  root.ProLifeClubEconomy=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
