(function(root){
  "use strict";
  // Stage 34F.27.1 - resolvedor unico de nomes para a camada de apresentacao.
  // Nunca altera IDs nem o save: so traduz IDs internos (gf_*, fc27_*) para nomes do catalogo carregado.
  // IDs internos desconhecidos recebem rotulo seguro, sem inventar clube/competicao.
  const INTERNAL=/^(gf_|fc27_)/;
  const isInternal=id=>typeof id==="string"&&INTERNAL.test(id);
  const UNKNOWN_CLUB="Clube não identificado",UNKNOWN_COMP="Competição não identificada";
  const cache=new WeakMap();

  // Indice por referencia do array (reconstruido se o tamanho mudar) para evitar buscas lineares repetidas nos 670 clubes.
  function index(list,keyName){
    if(!Array.isArray(list))return null;
    let hit=cache.get(list);
    if(!hit||hit.len!==list.length||hit.key!==keyName){
      const map=new Map();
      for(const item of list)if(item&&item.id!=null&&!map.has(item.id))map.set(item.id,item);
      hit={len:list.length,key:keyName,map};cache.set(list,hit);
    }
    return hit.map;
  }
  const nameOf=item=>item&&(item.name||item.shortName)||null;

  function club(s,id,stored){
    if(id==null||id==="")return stored||"—";
    const own=index(s?.clubs,"clubs")?.get(id);if(nameOf(own))return nameOf(own);
    const world=index(s?.globalFootball?.clubs,"gf")?.get(id);if(nameOf(world))return nameOf(world);
    if(stored&&stored!==id&&!isInternal(stored))return String(stored);
    return isInternal(id)?UNKNOWN_CLUB:String(id);
  }
  function league(s,id,stored){
    if(id==null||id==="")return stored||"—";
    const own=index(s?.leagues,"leagues")?.get(id);if(nameOf(own))return nameOf(own);
    const world=index(s?.globalFootball?.leagues,"gfl")?.get(id);if(nameOf(world))return nameOf(world);
    const wc=s?.globalFootball?.worldCompetitions?.leagues;
    const wcHit=Array.isArray(wc)?index(wc,"wc")?.get(id):wc&&wc[id];if(nameOf(wcHit))return nameOf(wcHit);
    const named=root.ProLifeCompetitions?.leagueNames?.[id];if(named)return named;
    if(stored&&stored!==id&&!isInternal(stored))return String(stored);
    return isInternal(id)?UNKNOWN_COMP:String(id);
  }
  // Texto livre que pode ser um ID cru (ex.: campo "club" de passagens gravadas antes desta correcao).
  function text(s,value,kind){
    if(!isInternal(value))return value;
    return kind==="league"?league(s,value):club(s,value);
  }
  const api={club,league,text,isInternal,UNKNOWN_CLUB,UNKNOWN_COMP};
  root.ProLifeNames=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
