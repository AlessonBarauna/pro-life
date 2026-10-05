const D=require('../src/domain/engine.js');
function scenario(age,target,starter,quality,seed){
 const s=D.create({clubId:'c0',pos:'ATA',age},seed); s.person.age=age;
 for(const k of Object.keys(D.Training.skills)) s.person.attrs[k]=target;
 s.person.potential=Math.min(100,target+12); const p=D.Training.init(s); p.exerciseId='boxFinish'; s.intensity='normal';
 const start=D.overall(s.person),rng=new D.Random(seed+1000); let games=0;
 for(let day=1;day<=300;day++){
  s.day=day; if(day-p.lastTrainingDay>=3) D.Training.performTraining(s,rng,D,{automatic:true});
  if(day%8===0 && (starter||games<10)){
   games++; const rating=quality+(rng.next()-.5)*.8, goals=rating>7.6&&rng.next()<.65?1:0, assists=rating>7.2&&rng.next()<.35?1:0;
   const events=[]; if(goals)events.push({type:'goal',playerId:'hero'}); if(assists)events.push({type:'goal',playerId:'x',assistPlayerId:'hero'});
   D.Training.matchDevelopment(s,{season:s.season,date:day,competitionId:'sim',round:games,homeId:s.clubId,awayId:'x',participants:[['hero'],[]],ratings:{hero:rating},playerStats:{hero:{minutes:starter?90:35,tackles:0}},events,hg:2,ag:1},D);
  }
 }
 return {age,start,end:D.overall(s.person),gain:D.overall(s.person)-start,games,sessions:p.sessions,level:p.level};
}
console.log(JSON.stringify({A:scenario(18,70,true,7.7,1),B:scenario(24,82,true,7.1,2),C:scenario(30,86,true,7.1,3),D:scenario(18,70,false,6.8,4)},null,2));
