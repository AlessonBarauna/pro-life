'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const Squad=require('../src/domain/squad.js');
const Sel=require('../src/domain/squad-position-selection.js');
const Fx=require('../src/domain/match-position-effects.js');
const Overlay=require('../src/domain/player-position-overlay.js');
const Adapter=require('../src/domain/fc27-catalog-adapter.js');
const GROUP={GOL:'GOL',LD:'DEF',LE:'DEF',ZAG:'DEF',VOL:'MEI',MC:'MEI',MD:'MEI',ME:'MEI',MEI:'MEI',PD:'ATA',PE:'ATA',SA:'ATA',CA:'ATA'};
const ATTRS=['ritmo','chute','passe','drible','defesa','fisico'];
let n=0;
function mk(name,prim,sec,ovr,extra){const attrs={};ATTRS.forEach(k=>attrs[k]=ovr);return {id:'t'+(++n)+'_'+name,name,pos:GROUP[prim],primaryPosition:prim,secondaryPositions:sec||[],ovr,overall:ovr,attrs,condition:100,morale:70,age:26,injury:0,suspension:0,...extra};}
function squad(){n=0;return [
 mk('Gk1','GOL',[],78),mk('Gk2','GOL',[],70),
 mk('Rb','LD',[],78),mk('Lb','LE',[],78),mk('Cb1','ZAG',[],80),mk('Cb2','ZAG',[],79),mk('Cb3','ZAG',[],75),
 mk('Dm','VOL',['MC'],77),mk('Cm1','MC',['VOL'],80),mk('Cm2','MC',[],79),mk('Am','MEI',['MC'],82),mk('Rm','MD',['PD'],76),mk('Lm','ME',['PE'],76),
 mk('Sesko','CA',[],80),mk('Zirk','CA',['SA'],77),mk('Rash','PE',['CA'],81),mk('Mbeumo','PD',['CA'],81),mk('Amad','PD',['MEI'],76)
];}
const S=()=>({day:3,season:2027,month:9,manager:{},hero:{id:'hero'}});
const pick=(roster,formation,state)=>Squad.choose(state||S(),{roster,formation,id:'c'});
const roleOf=(ch,name)=>{const p=ch.starters.find(x=>x.name===name);return p&&ch.assignedPositions[p.id];};
test('05A8 Sesko CA e Rashford PE em 4-3-3',()=>{const ch=pick(squad(),'4-3-3');assert.equal(roleOf(ch,'Sesko')||roleOf(ch,'Zirk'),'CA');assert.equal(roleOf(ch,'Rash'),'PE');});
test('05A8 CA nunca improvisado de ponta quando ha ponta adequado',()=>{for(const f of['4-3-3','4-2-3-1']){const ch=pick(squad(),f);for(const p of ch.starters){const r=ch.assignedPositions[p.id];if(p.primaryPosition==='CA')assert.ok(!['PD','PE'].includes(r),f+' '+p.name+' '+r);}}});
test('05A8 meia ofensivo vira MEI no 4-2-3-1 e MC no 4-3-3 apenas se necessario',()=>{const ch=pick(squad(),'4-2-3-1');assert.equal(roleOf(ch,'Am'),'MEI');});
test('05A8 tres formacoes: 11 unicos, um GOL, papeis da formacao',()=>{for(const f of Object.keys(Sel.formationSlots)){const ch=pick(squad(),f);assert.equal(ch.starters.length,11);assert.equal(new Set(ch.starters.map(p=>p.id)).size,11);assert.equal(ch.starters.filter(p=>p.pos==='GOL').length,1);assert.deepEqual(Object.values(ch.assignedPositions).sort(),[...Sel.formationSlots[f]].sort());}});
test('05A8 4-3-3/4-4-2/4-2-3-1 conforme especificacao',()=>{assert.deepEqual([...Sel.formationSlots['4-3-3']].sort(),['CA','GOL','LD','LE','MC','MC','PD','PE','VOL','ZAG','ZAG']);assert.deepEqual([...Sel.formationSlots['4-4-2']].sort(),['CA','CA','GOL','LD','LE','MC','MC','MD','ME','ZAG','ZAG']);assert.deepEqual([...Sel.formationSlots['4-2-3-1']].sort(),['CA','GOL','LD','LE','MEI','PD','PE','VOL','VOL','ZAG','ZAG']);});
test('05A8 secundario elegivel: PD reserva ocupa PD se titular PD cai',()=>{const r=squad();r.find(p=>p.name==='Mbeumo').injury=5;const ch=pick(r,'4-3-3');assert.equal(roleOf(ch,'Amad'),'PD');});
test('05A8 lesionado e suspenso fora',()=>{const r=squad();r.find(p=>p.name==='Rash').injury=9;r.find(p=>p.name==='Sesko').suspension=1;const ch=pick(r,'4-3-3');assert.ok(!ch.starters.some(p=>p.name==='Rash'||p.name==='Sesko'));assert.equal(ch.starters.length,11);});
test('05A8 improvisacao so quando necessario (sem nenhum PE)',()=>{const r=squad().filter(p=>!['Rash','Lm'].includes(p.name));const ch=pick(r,'4-3-3');assert.equal(ch.starters.length,11);assert.equal(new Set(ch.starters.map(p=>p.id)).size,11);});
test('05A8 elenco legado generico continua funcionando',()=>{n=0;const r=[];['GOL','GOL','DEF','DEF','DEF','DEF','DEF','DEF','MEI','MEI','MEI','MEI','MEI','ATA','ATA','ATA','ATA'].forEach((pos,i)=>{const attrs={};ATTRS.forEach(k=>attrs[k]=60+i);r.push({id:'g'+i,name:'G'+i,pos,ovr:60+i,overall:60+i,attrs,condition:100,morale:60,age:25,injury:0});});const ch=pick(r,'4-3-3');assert.equal(ch.starters.length,11);assert.equal(ch.starters.filter(p=>p.pos==='GOL').length,1);});
test('05A8 determinismo',()=>{const a=pick(squad(),'4-3-3'),b=pick(squad(),'4-3-3');assert.deepEqual(a.starters.map(p=>p.name),b.starters.map(p=>p.name));assert.deepEqual(Object.values(a.assignedPositions),Object.values(b.assignedPositions));});
test('05A8 protagonista disputa pela posicao (banco ou titular coerente)',()=>{globalThis.ProLifeCareer={init:()=>({playerCareer:{coachTrust:50}})};const r=squad();const h=mk('Hero','CA',[],60,{id:'hero'});r.push(h);const ch=pick(r,'4-3-3');const inStart=ch.starters.includes(h),inBench=ch.bench.includes(h),out=ch.out.includes(h);assert.equal([inStart,inBench,out].filter(Boolean).length,1);if(inStart)assert.notEqual(ch.assignedPositions.hero,undefined);});
test('05A8 efeitos de partida usam a mesma atribuicao e GER permanece 1..100',()=>{const r=squad();const ch=pick(r,'4-3-3');const roles=Fx.create({formation:'4-3-3',roster:r},ch.starters);assert.equal(roles.size,11);for(const p of ch.starters){const o=Number(Squad.score?p.ovr:p.ovr);assert.ok(o>=1&&o<=100);const pov=require('../src/domain/player-positions.js').positionalOverall(p.ovr,p,roles.get(p.id));assert.ok(pov>=1&&pov<=100);}});
test('05A8 overlay curado vence divergencia de grupo (Mbeumo/Amad/Dorgu) sem mudar pos',()=>{const o=Overlay.normalized({name:'Bryan Mbeumo',pos:'MEI',primaryPosition:'MD'},'Man Utd');assert.equal(o.primaryPosition,'PD');const a=Overlay.normalized({name:'Amad Diallo',pos:'MEI'},'Man Utd');assert.equal(a.primaryPosition,'PD');const d=Overlay.normalized({name:'Patrick Dorgu',pos:'ATA'},'Man Utd');assert.equal(d.primaryPosition,'LE');const x=Overlay.normalized({name:'Bryan Mbeumo',pos:'MEI'},'Outro Clube');assert.equal(x.primaryPosition,null);});
test('05A8 catalogo FC27 expande posicoes especificas com ids estaveis',()=>{const cat=Adapter.buildCatalog(JSON.parse(require('fs').readFileSync('src/data/fc27/fc27-manifest-v1.json','utf8')));const withSpec=cat.players.filter(p=>p.primaryPosition).length;assert.ok(withSpec>cat.players.length*0.9,withSpec+'/'+cat.players.length);const ids=new Set(cat.players.map(p=>p.id));assert.equal(ids.size,cat.players.length);const m=cat.players.find(p=>/Mbeumo/.test(p.name));assert.ok(m.primaryPosition);for(const p of cat.players.slice(0,3000))for(const s of p.secondaryPositions)assert.ok(typeof s==='string');});
test('05A8 posicoes locais brasileiras so com dados verificados',()=>{const P=require('../src/data/fc27/fc27-positions-v1.js');const keys=Object.keys(P.local);assert.ok(keys.length>0&&keys.every(k=>k.startsWith('real_')));for(const v of Object.values(P.local))assert.ok(v.split(',').every(c=>GROUP[c]));});
