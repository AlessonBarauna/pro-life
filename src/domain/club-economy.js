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
  const api={estimate,VERSION:"m04.1"};
  root.ProLifeClubEconomy=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
