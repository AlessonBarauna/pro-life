(function(root){
  "use strict";
  // Premiação de fim de temporada da liga: valor por posição final + bônus de título.
  // Cada liga tem escala e nome próprios (a Premier League paga "mérito" por posição, o Brasileirão
  // paga a premiação da CBF, e assim por diante). Os valores acompanham a receita média da liga,
  // então um título na Premier League rende bem mais que um título numa liga pequena.
  const VERSION="lp1";
  // [trecho do id da liga, peso de prestígio, nome da premiação, bônus do título (x receita média), expoente da curva]
  const RULES=[
    ["premier_league",1.45,"Premiação por mérito da Premier League",1.1,1.25],
    ["laliga_ea",1.1,"Distribuição de direitos da LALIGA por classificação",.9,1.35],
    ["serie_a_enilive",1,"Distribuição da Serie A por classificação",.9,1.35],
    ["bundesliga_2",.3,"Premiação da 2. Bundesliga",.6,1.2],
    ["bundesliga",1,"Distribuição de direitos da Bundesliga por classificação",.8,1.2],
    ["ligue_1",.85,"Distribuição de direitos da Ligue 1 por classificação",.8,1.3],
    ["liga_portugal",.6,"Premiação da Liga Portugal",.9,1.4],
    ["eredivisie",.6,"Premiação da Eredivisie",.9,1.4],
    ["saudi",.8,"Premiação da Saudi League",1.2,1.5],
    ["efl_championship",.7,"Premiação da EFL Championship",.8,1.2],
    ["serieA",.8,"Premiação da CBF — Série A",1.2,1.6],
    ["serieB",.35,"Premiação da CBF — Série B",1,1.5],
    ["serieC",.18,"Premiação da CBF — Série C",1,1.4],
    ["serieD",.1,"Premiação da CBF — Série D",1,1.3]
  ];
  const DEFAULT={weight:.4,label:"Premiação da liga",title:.9,curve:1.35};
  function ruleFor(leagueId){
    const id=String(leagueId||"");
    const hit=RULES.find(r=>id.includes(r[0]));
    return hit?{weight:hit[1],label:hit[2],title:hit[3],curve:hit[4]}:DEFAULT;
  }
  // position: 1..count; avgRevenue: receita anual média dos clubes da liga (mesma unidade do caixa).
  function prizeFor({leagueId,position,count,avgRevenue}){
    const n=Math.max(2,Math.round(Number(count)||0)),pos=Math.min(n,Math.max(1,Math.round(Number(position)||n)));
    const rule=ruleFor(leagueId),avg=Math.max(0,Number(avgRevenue)||0);
    const pool=avg*n*.22*rule.weight;
    const w=i=>Math.pow(n-i+1,rule.curve);
    let total=0;for(let i=1;i<=n;i++)total+=w(i);
    // 40% do bolo é dividido igualmente (todo clube recebe) e 60% depende da posição final.
    const byPosition=Math.round(pool*(.4/n+.6*w(pos)/total));
    const titleBonus=pos===1?Math.round(avg*rule.title*rule.weight):0;
    const equalShare=Math.round(pool*.4/n);
    return {amount:byPosition+titleBonus,byPosition,equalShare,titleBonus,position:pos,count:n,label:rule.label,pool:Math.round(pool)};
  }
  const api={VERSION,RULES,ruleFor,prizeFor};
  root.ProLifeLeaguePrizes=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
