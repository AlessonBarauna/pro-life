'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const src=fs.readFileSync(process.argv[2]||'src/ui/app.js','utf8');
const begin=src.indexOf('      const abbreviatedName=',src.indexOf('    lineup() {'));
const end=src.indexOf('      if(state.mode!=="player")',begin);
assert.ok(begin>0&&end>begin,'Escalacao nao encontrada');
const ctx={D:{overall:p=>p.ovr},window:{ProLifePlayerPositions:{normalize:p=>({primaryPosition:p.primaryPosition||null}),positionalOverall:(ovr,p,role)=>role===p.primaryPosition?ovr:ovr-3}},esc:x=>String(x),state:{},console};
vm.createContext(ctx);
vm.runInContext(src.slice(begin,end)+'\n globalThis.renderPitch=tacticalPitch;',ctx);
const formationData={
'4-3-3':[['PE','CA','PD'],['MC','VOL','MC'],['LE','ZAG','ZAG','LD'],['GOL']],
'4-4-2':[['CA','CA'],['ME','MC','MC','MD'],['LE','ZAG','ZAG','LD'],['GOL']],
'4-2-3-1':[['CA'],['PE','MEI','PD'],['VOL','VOL'],['LE','ZAG','ZAG','LD'],['GOL']]
};
for(const [formation,rows] of Object.entries(formationData))test('05A7 ordem real '+formation,()=>{
 const list=rows.flat().map((role,i)=>({id:'p'+i,name:'Player '+i,pos:['LD','LE','ZAG'].includes(role)?'DEF':['CA','PE','PD'].includes(role)?'ATA':role==='GOL'?'GOL':'MEI',ovr:80,primaryPosition:role}));
 const assigned=Object.fromEntries(list.map((p,i)=>[p.id,rows.flat()[i]]));
 const html=ctx.renderPitch(list.reverse(),formation,{assignedPositions:assigned});
 const found=[...html.matchAll(/data-position="([A-Z]+)"/g)].map(x=>x[1]);
 assert.deepEqual(found,rows.flat());assert.equal((html.match(/class="fc-pitch-player/g)||[]).length,11);
});
test('05A7 fallback sem atribuicoes',()=>{const roster=['ATA','ATA','ATA','MEI','MEI','MEI','DEF','DEF','DEF','DEF','GOL'].map((pos,i)=>({id:''+i,name:'Player '+i,pos,ovr:70})); const html=ctx.renderPitch(roster,'4-3-3');assert.equal((html.match(/class="fc-pitch-player/g)||[]).length,11);assert.match(html,/data-position="DEF"/);});
