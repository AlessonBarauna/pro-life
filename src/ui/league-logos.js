(function leagueLogosModule(root){
  "use strict";
  // Logo da liga: usa o arquivo instalado (ProLifeLeagueLogoData[id]) ou, enquanto nao existir, um selo provisorio
  // com as iniciais da liga. O selo nunca imita o logo oficial.
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const STOP=new Set(["de","da","do","dos","das","the","of","la","el","league","liga","ea","sports","fc27","campeonato"]);
  function initials(name){
    const br=/s[eé]rie\s+([a-d])\b/i.exec(String(name||""));if(br)return "BR"+br[1].toUpperCase();
    const w=String(name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").split(/[^A-Za-z0-9]+/).filter(Boolean);
    const key=w.filter(x=>!STOP.has(x.toLowerCase()));const use=key.length?key:w;
    if(use.length===1)return use[0].slice(0,3).toUpperCase();
    return use.slice(0,3).map(x=>x[0]).join("").toUpperCase();
  }
  function hue(str){let h=0;for(const ch of String(str))h=(h*31+ch.charCodeAt(0))>>>0;return h%360;}
  function render(id,name,opts){
    const size=(opts&&opts.size)||44,file=(root.ProLifeLeagueLogoData||{})[id];
    if(file)return `<img class="lg-logo" src="${esc(file)}" width="${size}" height="${size}" alt="${esc(name)}" loading="lazy" />`;
    const h=hue(id||name),t=/^state-[a-z]{2}$/.test(String(id))?String(id).slice(6).toUpperCase():initials(name);
    return `<svg class="lg-logo lg-badge" width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="${esc(name)}"><defs><linearGradient id="lgb${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${h} 45% 34%)"/><stop offset="1" stop-color="hsl(${h} 50% 18%)"/></linearGradient></defs><path d="M24 3 42 9v14c0 11-8 18-18 22C14 41 6 34 6 23V9z" fill="url(#lgb${h})" stroke="hsl(${h} 60% 62%)" stroke-width="1.6"/><text x="24" y="29" text-anchor="middle" font-size="${t.length>2?13:16}" font-weight="800" fill="#fff" font-family="system-ui,Arial,sans-serif">${esc(t)}</text></svg>`;
  }
  root.ProLifeLeagueLogos={render,initials};
  if(typeof module!=="undefined"&&module.exports)module.exports=root.ProLifeLeagueLogos;
})(typeof globalThis!=="undefined"?globalThis:this);
