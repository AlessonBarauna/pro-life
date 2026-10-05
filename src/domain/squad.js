(function(root){
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const slots={"4-3-3":{GOL:1,DEF:4,MEI:3,ATA:3},"4-4-2":{GOL:1,DEF:4,MEI:4,ATA:2},"4-2-3-1":{GOL:1,DEF:4,MEI:5,ATA:1}};
  function init(s){
    const pc=root.ProLifeCareer?.init(s)?.playerCareer;
    if(!pc) return null;
    if(!pc.squadCompetition) pc.squadCompetition={formation:"4-3-3",history:[],lastDecision:null,formRatings:[],trainingTrend:0,version:1};
    const q=pc.squadCompetition;
    if(!slots[q.formation]) q.formation="4-3-3";
    if(!Array.isArray(q.history)) q.history=[];
    if(!Array.isArray(q.formRatings)) q.formRatings=[];
    if(!Number.isFinite(q.trainingTrend)) q.trainingTrend=0;
    return q;
  }
  function recentRatings(s,id="hero",limit=5){return (s.matches||[]).filter(m=>Number.isFinite(Number(m.ratings?.[id]))).slice(0,limit).map(m=>Number(m.ratings[id]));}
  function formValue(s,p){const rs=recentRatings(s,p.id);return rs.length?rs.reduce((a,b)=>a+b,0)/rs.length:6.5;}
  function score(s,p){
    const ov=root.ProLife?.overall?root.ProLife.overall(p):50, form=formValue(s,p), cond=Number(p.condition??100), morale=Number(p.morale??50);
    let v=ov*.64+form*2.6+cond*.075+morale*.045;
    if(p.id==="hero"){const pc=root.ProLifeCareer.init(s).playerCareer,q=init(s);v+=(pc.coachTrust-50)*.105+clamp(q.trainingTrend,-5,5)*.35;}
    if(p.injury||p.suspension>0||cond<25) v=-999;
    return v;
  }
  function formationFor(c){return c?.formation&&slots[c.formation]?c.formation:"4-3-3";}
  function choose(s,c){
    const formation=formationFor(c), need=slots[formation], active=c.roster.filter(p=>!p.injury&&!(p.suspension>0)&&Number(p.condition??100)>=25);
    const starters=[];
    for(const [pos,count] of Object.entries(need)){
      const pool=active.filter(p=>p.pos===pos&&!starters.includes(p)).sort((a,b)=>score(s,b)-score(s,a));
      starters.push(...pool.slice(0,count));
    }
    for(const p of active.slice().sort((a,b)=>score(s,b)-score(s,a))) if(starters.length<11&&!starters.includes(p)) starters.push(p);
    const bench=active.filter(p=>!starters.includes(p)).sort((a,b)=>score(s,b)-score(s,a)).slice(0,7);
    const out=c.roster.filter(p=>!starters.includes(p)&&!bench.includes(p));
    return {formation,starters,bench,out};
  }
  function roleForHero(s,selection){const pc=root.ProLifeCareer.init(s).playerCareer;if(selection.starters.some(p=>p.id==="hero"))return "Titular";if(selection.bench.some(p=>p.id==="hero"))return "Banco";return "Fora da relação";}
  function competition(s){
    const c=root.ProLife?.club(s);if(!c)return null;const selection=choose(s,c),hero=s.person,rivals=c.roster.filter(p=>p.pos===hero.pos&&!p.injury&&!(p.suspension>0)).slice().sort((a,b)=>score(s,b)-score(s,a));
    return {formation:selection.formation,selection,heroRole:roleForHero(s,selection),rivals:rivals.map((p,i)=>({id:p.id,name:p.name,pos:p.pos,age:p.age,overall:root.ProLife.overall(p),form:+formValue(s,p).toFixed(2),condition:Math.round(p.condition),score:+score(s,p).toFixed(2),rank:i+1,status:selection.starters.includes(p)?"Titular":selection.bench.includes(p)?"Banco":"Fora"})),heroRank:Math.max(1,rivals.findIndex(p=>p.id==="hero")+1)};
  }
  function recordDecision(s,role,reason){const q=init(s),pc=root.ProLifeCareer.init(s).playerCareer;const row={day:s.day,season:s.season,role,trust:Math.round(pc.coachTrust),reason};if(!q.lastDecision||q.lastDecision.day!==s.day||q.lastDecision.role!==role){q.history.unshift(row);q.history=q.history.slice(0,40);q.lastDecision=row;}return row;}
  function trainingResult(s,result){if(!result?.available||result.automatic)return;const pc=root.ProLifeCareer.init(s).playerCareer,q=init(s),d={A:1.2,B:.7,C:.25,D:-.2}[result.grade]||0;pc.coachTrust=clamp(pc.coachTrust+d,0,100);q.trainingTrend=clamp(q.trainingTrend*.72+d,-5,5);root.ProLifeCareer.updatePlayerRole(s);}
  const api={init,slots,recentRatings,formValue,score,formationFor,choose,competition,roleForHero,recordDecision,trainingResult};
  root.ProLifeSquad=api;if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
