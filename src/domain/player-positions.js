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
    if (valid.includes(assigned)) return {kind: assigned===valid[0]?'PRIMARY':'SECONDARY', multiplier:1};
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
  const api={positionList,definitions,group,isSpecific,eligible,normalize,suitability,positionalOverall};
  root.ProLifePlayerPositions=api;
  if(typeof module !== 'undefined' && module.exports) module.exports=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
