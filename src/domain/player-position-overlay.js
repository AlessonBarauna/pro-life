(function(root){
'use strict';
// 05A6: conservative identity-based positional supplement. Never guesses the general catalogue.
const codes=new Set(['GOL','LD','LE','ZAG','ALD','ALE','VOL','MC','MD','ME','MEI','PD','PE','SA','CA']);
const groups={GOL:'GOL',LD:'DEF',LE:'DEF',ZAG:'DEF',ALD:'DEF',ALE:'DEF',VOL:'MEI',MC:'MEI',MD:'MEI',ME:'MEI',MEI:'MEI',PD:'ATA',PE:'ATA',SA:'ATA',CA:'ATA'};
const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
// Names are matched only with a club identity to avoid homonyms.
const verified={
 'man utd':{
  'benjamin sesko':['CA'], 'b sesko':['CA'], 'sesko':['CA'],
  'marcus rashford':['PE','CA'], 'm rashford':['PE','CA'], 'rashford':['PE','CA'],
  'joshua zirkzee':['CA','SA'], 'j zirkzee':['CA','SA'], 'zirkzee':['CA','SA'],
  'bruno fernandes':['MEI','MC'], 'b fernandes':['MEI','MC'],
  'youri tielemans':['MC','VOL'], 'y tielemans':['MC','VOL'],
  'bryan mbeumo':['PD','CA'], 'b mbeumo':['PD','CA'],
  'matthijs de ligt':['ZAG'], 'm ligt':['ZAG'], 'de ligt':['ZAG'],
  'lisandro martinez':['ZAG'], 'l martinez':['ZAG'],
  'noussair mazraoui':['LD','LE'], 'n mazraoui':['LD','LE'],
  'luke shaw':['LE','ZAG'], 'l shaw':['LE','ZAG'],
  'senne lammens':['GOL'], 's lammens':['GOL'],
  'matheus cunha':['MEI','SA'], 'harry maguire':['ZAG'],
  'andrey santos':['MC','VOL'], 'kobbie mainoo':['MC','VOL'],
  'amad diallo':['PD','MEI'], 'amad':['PD','MEI'],
  'patrick dorgu':['LE','ALE'], 'leny yoro':['ZAG']
 }
};
function normalized(player,clubName){
 const original=player&&typeof player==='object'?player:{};
 const primary=String(original.primaryPosition||original.specificPosition||'').toUpperCase();
 const secondary=Array.isArray(original.secondaryPositions)?original.secondaryPositions.filter(p=>codes.has(String(p).toUpperCase())).map(p=>String(p).toUpperCase()):[];
 const cl=clean(clubName);const lookup=(cl==='man utd'||cl==='manchester united'||cl==='manchester utd')?verified['man utd']:null;
 const row=lookup?.[clean(original.name)]||lookup?.[clean(original.shortName)];
 // Curado tem prioridade e pode divergir do grupo generico do catalogo (ex.: Mbeumo MEI->PD); o campo `pos` legado nunca muda.
 if(row&&!original.positionEdited) return {primaryPosition:row[0],secondaryPositions:[...new Set(row.slice(1).filter(p=>p!==row[0]))],source:'curated'};
 if(codes.has(primary)&&groups[primary]===original.pos){return {primaryPosition:primary,secondaryPositions:[...new Set(secondary.filter(p=>p!==primary))].slice(0,6),source:'existing'};}
 return {primaryPosition:null,secondaryPositions:secondary,source:'legacy'};
}
root.ProLifePositionOverlay={normalized};
if(typeof module!=='undefined'&&module.exports)module.exports=root.ProLifePositionOverlay;
})(typeof globalThis!=='undefined'?globalThis:this);
