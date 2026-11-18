(function(root){
  'use strict';
  // 05A.2: metadados e calculos puros. Nao altera saves, elenco, engine ou a interface.
  const definitions = Object.freeze({
    GOL: ['GOL','Goleiro'],
    LD: ['DEF','Lateral direito'], LE: ['DEF','Lateral esquerdo'],
    ZAG: ['DEF','Zagueiro'], ALD: ['DEF','Ala direito'], ALE: ['DEF','Ala esquerdo'],
    VOL: ['MEI','Volante'], MC: ['MEI','Meio-campista central'],
    MD: ['MEI','Meia direito'], ME: ['MEI','Meia esquerdo'], MEI: ['MEI','Meia ofensivo'],
    PD: ['ATA','Ponta direita'], PE: ['ATA','Ponta esquerda'],
    SA: ['ATA','Segundo atacante'], CA: ['ATA','Centroavante']
  });
  const groups = new Set(['GOL','DEF','MEI','ATA']);
  const positionList = Object.freeze(Object.keys(definitions));
  const toCode = value => String(value ?? '').trim().toUpperCase();
  const group = code => definitions[toCode(code)]?.[0] || (groups.has(toCode(code)) ? toCode(code) : null);
  const isSpecific = code => !!definitions[toCode(code)];
  function eligible(player){
    const main = toCode(player?.primaryPosition ?? player?.specificPosition ?? player?.pos);
    const extras = Array.isArray(player?.secondaryPositions) ? player.secondaryPositions : [];
    const values = [main,...extras].map(toCode).filter(isSpecific);
    return [...new Set(values)].slice(0,7);
  }
  function normalize(player){
    if(!player || typeof player !== 'object') throw new TypeError('Jogador invalido');
    const primary = toCode(player.primaryPosition ?? player.specificPosition ?? player.pos);
    // Para saves antigos, nao inventar lateralidade nem subposicao de quem so tem DEF/ATA.
    return {
      primaryPosition: isSpecific(primary) ? primary : null,
      legacyGroup: group(player.pos),
      secondaryPositions: eligible(player).filter(p => p !== primary).slice(0,6)
    };
  }
  function suitability(player, assignedPosition){
    const assigned = toCode(assignedPosition);
    if (!isSpecific(assigned)) return null;
    const valid = eligible(player);
    if (valid.includes(assigned)) {
      if (assigned===valid[0]) return {kind:'PRIMARY',multiplier:1};
      const suggested=player?.secondaryPositionsSource==='suggested';
      if (!suggested) return {kind:'SECONDARY',multiplier:1};
      return {kind:'SUGGESTED',multiplier:group(assigned)===group(valid[0])?0.94:0.85};
    }
    const legacy = group(player?.pos);
    // Sem posicao especifica nos saves antigos, nao aplicar penalidade artificial.
    if (!valid.length && legacy === group(assigned)) return {kind:'LEGACY_UNKNOWN',multiplier:1};
    if (valid.length && group(assigned)===group(valid[0])) return {kind:'RELATED',multiplier:0.94};
    return {kind:'OUT_OF_POSITION',multiplier:0.85};
  }
  function positionalOverall(baseOverall,player,assignedPosition){
    const base=Number(baseOverall);
    if (!Number.isFinite(base)) throw new TypeError('GER base invalido');
    const fit=suitability(player,assignedPosition);
    return Math.max(1,Math.min(100,Math.round(base*(fit?.multiplier ?? 1))));
  }
  // Todo jogador precisa de uma posição específica (nada de DEF/MEI/ATA genéricos na tela).
  // Deduz a partir do grupo e dos atributos; o sorteio usa o id, então é estável entre execuções.
  function hash(text){let h=2166136261;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function infer(player){
    const g=group(player?.pos)||group(player?.primaryPosition);
    if(!g) return null;
    if(g==='GOL') return 'GOL';
    const a=player?.attrs||{};
    const n=k=>Number.isFinite(Number(a[k]))?Number(a[k]):0;
    const u=hash(String(player.id||player.name||'x')+'|pos')%100, side=hash(String(player.id||player.name||'x')+'|side')%2===0;
    const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
    if(g==='DEF'){
      const cut=cl(38+(n('pace')-n('strength'))*3,18,63);
      return u<cut?(side?'LD':'LE'):'ZAG';
    }
    if(g==='MEI'){
      const vol=cl(22+(n('defense')-n('pass'))*4,8,55), mei=cl(22+(n('finish')-n('pass'))*3,8,40);
      if(u<vol) return 'VOL';
      if(u<vol+mei) return 'MEI';
      if(u<vol+mei+16) return side?'MD':'ME';
      return 'MC';
    }
    const wing=cl(28+(n('pace')-n('finish'))*4,10,60);
    if(u<wing) return side?'PD':'PE';
    if(u<wing+(100-wing)*0.3) return 'SA';
    return 'CA';
  }
  // Preenche a posição específica quando falta ou quando contradiz o grupo; respeita edição manual.
  function ensure(player){
    if(!player||typeof player!=='object'||player.positionEdited) return false;
    const cur=toCode(player.primaryPosition);
    if(isSpecific(cur)&&group(cur)===group(player.pos)) return false;
    const p=infer(player);
    if(!p) return false;
    player.primaryPosition=p;
    if(Array.isArray(player.secondaryPositions)) player.secondaryPositions=player.secondaryPositions.filter(x=>toCode(x)!==p);
    return true;
  }
  const api={positionList,definitions,group,isSpecific,eligible,normalize,suitability,positionalOverall,infer,ensure};
  root.ProLifePlayerPositions=api;
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
