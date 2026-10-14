(function(root){
  "use strict";
  const list=Array.isArray(root.ProLifeCrestData)?root.ProLifeCrestData:[];
  const catalog=new Map(list.map(x=>[x.id,x]));
  const safeId=id=>typeof id==="string"&&/^[a-zA-Z0-9_-]+$/.test(id);
  const escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&#39;"}[c]));
  const validAsset=p=>typeof p==="string"&&/^src\/assets\/club-crests\/[a-zA-Z0-9_-]+\.(?:webp|png|svg)$/.test(p);
  function metadata(id){return safeId(id)?catalog.get(id)||null:null;}
  function render(id,options={}){
    const item=metadata(id),size=["sm","md","lg"].includes(options.size)?options.size:"md";
    const name=item?.name||"Clube";
    const src=item?.verified&&validAsset(item.asset)?item.asset:null;
    // No external image request before asset verification; deterministic offline fallback.
    if(src)return `<img class="pl-club-crest pl-club-crest--${size}" src="${escape(src)}" alt="Escudo: ${escape(name)}" loading="lazy" decoding="async">`;
    const color=/^#[0-9a-fA-F]{6}$/.test(item?.color||"")?item.color:"#384b62";
    const initial=(name.replace(/[^\p{L}\p{N} ]/gu,"").trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("")||"FC").toUpperCase();
    return `<span class="pl-club-crest pl-club-crest--${size} pl-club-crest--fallback" role="img" aria-label="Escudo genérico: ${escape(name)}" style="--pl-crest-color:${color}">${escape(initial)}</span>`;
  }
  function inline(id,size){const h=render(id,{size:size||'sm'});return h.startsWith('<img')?h+' ':'';}
  const api={metadata,render,inline,stats:()=>({total:catalog.size,verified:list.filter(x=>x.verified&&validAsset(x.asset)).length,pending:list.filter(x=>!x.verified||!validAsset(x.asset)).length})};
  root.ProLifeClubCrests=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
