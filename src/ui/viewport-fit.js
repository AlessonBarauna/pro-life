(function(root){
  "use strict";
  // Em telas de desktop o jogo não deve exigir rolagem: se o conteúdo passar da janela,
  // ele é reduzido (zoom) até caber, sem ficar menor que MIN. Abaixo disso a rolagem volta.
  const MIN=.6,DESKTOP="(min-width:1100px) and (min-height:650px)";
  let queued=false;
  function targets(){
    const stage=root.document.querySelector(".game-stage");
    if(stage)return {scroller:stage,items:[...stage.children],height:()=>stage.clientHeight};
    const app=root.document.getElementById("app");
    if(!app)return null;
    return {scroller:root.document.documentElement,items:[...app.children],height:()=>root.innerHeight,app};
  }
  function apply(items,z){for(const el of items)el.style.zoom=z===1?"":String(z);}
  function overflow(t){return t.app?Math.max(root.document.documentElement.scrollHeight,t.app.scrollHeight)-t.height():t.scroller.scrollHeight-t.scroller.clientHeight;}
  function fit(){
    queued=false;
    if(!root.matchMedia(DESKTOP).matches){const t=targets();if(t)apply(t.items,1);return;}
    const t=targets();if(!t||!t.items.length)return;
    apply(t.items,1);
    if(overflow(t)<=2)return;
    let z=1;
    for(let i=0;i<4;i++){
      const total=t.app?Math.max(root.document.documentElement.scrollHeight,t.app.scrollHeight):t.scroller.scrollHeight;
      z=Math.max(MIN,Math.min(1,Math.round(z*(t.height()/total)*100)/100-(i?0:.0)));
      apply(t.items,z);
      if(overflow(t)<=2||z===MIN)break;
    }
    for(let i=0;i<12&&overflow(t)>2&&z>MIN;i++){z=Math.max(MIN,Math.round((z-.02)*100)/100);apply(t.items,z);}
  }
  function schedule(){if(queued)return;queued=true;root.requestAnimationFrame(fit);}
  function start(){
    const app=root.document.getElementById("app");if(!app)return;
    new root.MutationObserver(schedule).observe(app,{childList:true,subtree:true});
    root.addEventListener("resize",schedule);
    schedule();
  }
  if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",start);else start();
  root.ProLifeViewportFit={fit:schedule,MIN};
})(typeof window!=="undefined"?window:globalThis);
