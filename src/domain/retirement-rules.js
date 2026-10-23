(function retirementRulesModule(root){
  "use strict";
  // Regra ÚNICA de aposentadoria (clubes brasileiros e mundo FC 27). Determinística: o sorteio vem de quem chama.
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  // Probabilidade anual de encerrar a carreira para jogador de linha, por idade (calibrada: média ~36 anos, ninguém joga após 42).
  const TABLE=[[30,0],[31,.008],[32,.02],[33,.04],[34,.08],[35,.15],[36,.25],[37,.38],[38,.52],[39,.66],[40,.8],[41,.9],[42,.97],[43,1]];
  const GK_SHIFT=3.5;
  function base(age,gk){
    const a=gk?age-GK_SHIFT:age;
    if(a<=TABLE[0][0])return 0;
    if(a>=TABLE[TABLE.length-1][0])return 1;
    for(let i=1;i<TABLE.length;i++){const [x1,y1]=TABLE[i],[x0,y0]=TABLE[i-1];if(a<=x1)return y0+(y1-y0)*((a-x0)/(x1-x0));}
    return 1;
  }
  const hardCap=pos=>pos==="GOL"?45:42;
  // ctx: {ovr, peak, level (força do clube), starter, freeSeasons, motive (-1..1, estável por jogador)}
  function chance(p,ctx={}){
    const age=Number(p.age)||0,gk=p.pos==="GOL";
    if(age>=hardCap(p.pos))return 1;
    let c=base(age,gk);if(c<=0)return 0;
    const ovr=Number(ctx.ovr)||Number(p.ovr||p.overall)||60,peak=Number(ctx.peak)||Number(p.peakOvr)||ovr,level=Number(ctx.level)||60;
    if(ovr>=level+4)c*=.8;                    // craque em clube de ponta joga mais tempo
    else if(ovr<level-12)c*=1.5;              // sem espaço no elenco
    if(peak>=86)c*=.8;                         // lendas decidem a hora de parar
    c*=ctx.starter===false?1.15:1;
    c+= (Number(ctx.freeSeasons)||0)*.12*(age>=33?1:0.3);
    c*=1+clamp(Number(ctx.motive)||0,-1,1)*.25;
    return clamp(c,0,.98);
  }
  // Quem sai do futebol profissional sem ser por idade (dispensa) NÃO é aposentadoria: abaixo de 30 anos.
  const isDismissal=p=>(Number(p.age)||0)<30;
  const api={chance,base,hardCap,isDismissal,TABLE};
  root.ProLifeRetirementRules=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
