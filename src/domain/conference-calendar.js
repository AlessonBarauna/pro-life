(function(root){
"use strict";
// Stage 33B: read-only calendar preview. Does not mutate state or fixtures.
// 'reserved' contains match days from UCL/UEL and any known domestic fixtures.
function preview(edition,fixtures,options){
 if(!edition||edition.comp!=="uecl"||!Array.isArray(fixtures)||fixtures.length!==108)throw Error("Conference exige 108 jogos sorteados.");
 const start=Number(options?.startDay),step=Number(options?.stepDays||21),maxOffset=Number(options?.maxOffset??6);
 if(!Number.isInteger(start)||!Number.isInteger(step)||step<1||!Number.isInteger(maxOffset)||maxOffset<0)throw Error("Calendario invalido.");
 const roundWindows=options?.roundWindows;
 if(roundWindows!=null&&(!Array.isArray(roundWindows)||roundWindows.length!==6||
   roundWindows.some((d,i)=>!Number.isInteger(d)||(i>0&&d<=roundWindows[i-1]))))
   throw Error("Janelas oficiais da Conference invalidas.");
 const reserved=(options?.reserved||[]).map(x=>({day:Number(x.day),clubs:[x.homeId,x.awayId].filter(Boolean)}));
 const used=new Set(reserved.flatMap(x=>x.clubs.map(id=>`${id}|${x.day}`)));
 const fixturesByRound=new Map();for(const m of fixtures){if(!fixturesByRound.has(m.round))fixturesByRound.set(m.round,[]);fixturesByRound.get(m.round).push(m);}
 if([...fixturesByRound.keys()].sort().join(",")!=="1,2,3,4,5,6"||[...fixturesByRound.values()].some(x=>x.length!==18))throw Error("Rodadas incorretas.");
 const matches=[],conflicts=[];
 for(let round=1;round<=6;round++){
  for(const m of fixturesByRound.get(round)){
   let day=null;
   for(let offset=0;offset<=maxOffset;offset++){
    const d=(roundWindows?roundWindows[round-1]:start+(round-1)*step)+offset;
    if(!used.has(`${m.homeId}|${d}`)&&!used.has(`${m.awayId}|${d}`)){day=d;break;}
   }
   if(day===null){conflicts.push(m.id||`${m.homeId}-${m.awayId}`);continue;}
   used.add(`${m.homeId}|${day}`);used.add(`${m.awayId}|${day}`);
   matches.push({...m,day});
  }
 }
 return {ready:conflicts.length===0,scheduled:matches.length,matches,conflicts,warning:"Prévia adaptada: datas oficiais e descanso mínimo ainda não certificados."};
}
const api={preview};root.ProLifeConferenceCalendar=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
