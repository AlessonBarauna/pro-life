(function(root){
  "use strict";
  const VERSION="fc27-contract-v1";
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const number=(value,fallback=0)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:fallback;};
  const hash=value=>{let result=2166136261;for(const char of String(value||"player")){result^=char.charCodeAt(0);result=Math.imul(result,16777619);}return result>>>0;};
  const roundMoney=value=>{const step=value>=200000000?1000000:value>=20000000?500000:value>=1000000?100000:50000;return Math.max(100000,Math.round(value/step)*step);};
  const overallOf=player=>clamp(number(player?.overall??player?.ovr,65),40,99);
  const potentialOf=player=>clamp(number(player?.potential,overallOf(player)),overallOf(player),99);
  const clubLevel=club=>clamp(number(club?.reputation??club?.prestige??club?.strength??club?.structure,60),20,100);
  const ageFactor=age=>age<=21?1.12:age<=24?1.08:age<=27?1:age<=30?.9:age<=32?.72:age<=34?.48:age<=36?.28:.14;
  const positionFactor=position=>({GOL:.86,GK:.86,ZAG:.9,DEF:.9,CB:.9,LD:.92,RB:.92,LE:.92,LB:.92,VOL:.96,CDM:.96,MC:1,CM:1,MEI:1.04,CAM:1.04,ATA:1.08,CA:1.08,ST:1.08,PE:1.06,PD:1.06,LW:1.06,RW:1.06})[String(position||"").toUpperCase()]||1;

  function estimateMarketValue(player,club){
    const overall=overallOf(player),potential=potentialOf(player),age=clamp(number(player?.age,26),14,45);
    const growth=1+Math.min(.6,Math.max(0,potential-overall)*.04);
    const team=.65+clubLevel(club)/200;
    const variation=.94+(hash(player?.id)%13)/100;
    const base=210000000*Math.pow(overall/84,10);
    return roundMoney(base*growth*ageFactor(age)*positionFactor(player?.primaryPosition||player?.pos||player?.position)*team*variation);
  }
  function marketValue(player,club){
    const stored=number(player?.marketValue??player?.value,-1);
    if(stored>0)return Math.round(stored);
    return estimateMarketValue(player,club);
  }
  function expectedSalary(player,club){
    const overall=overallOf(player),potential=potentialOf(player);
    const team=.52+clubLevel(club)/145;
    const prospect=Number(player?.age)<=23&&potential-overall>=5?1.08:1;
    const variation=.94+(hash("salary|"+(player?.id||"player"))%13)/100;
    return Math.max(5000,Math.round(20000*Math.pow(1.18,overall-55)*team*prospect*variation/1000)*1000);
  }
  const weeklySalary=monthly=>Math.round(Math.max(0,number(monthly))*12/52/100)*100;
  function contractYears(player){
    const age=clamp(number(player?.age,26),14,45),roll=hash("contract|"+(player?.id||"player"))%3;
    if(age>=35)return 1;
    if(age>=32)return 1+(roll%2);
    if(age<=22)return 3+roll;
    return 2+roll;
  }
  function ensurePlayer(state,player,club){
    if(!player||!player.id)return player;
    if((!number(player.marketValue)&&!number(player.value))||player.marketValueSource===VERSION){
      player.marketValue=estimateMarketValue(player,club);
      player.marketValueSource=VERSION;
    }
    const existingSalary=number(player.salary??player.monthlySalary??player.wage,-1);
    if(existingSalary<=0){
      player.salary=expectedSalary(player,club);
      player.salarySource=VERSION;
    }
    const day=number(state?.day,0);
    let end=[player.contractEndDay,player.contract?.endDay,player.contract?.expiresDay].map(Number).find(Number.isFinite);
    if(!Number.isFinite(end)||end<=day){end=day+contractYears(player)*365;player.contractEndDay=end;player.contractEndSource=VERSION;}
    else player.contractEndDay=end;
    const role=player.squadRole||player.contract?.role||"rotation";
    player.contract={...(player.contract&&typeof player.contract==="object"?player.contract:{}),clubId:club?.id??player.clubId??null,salary:Number(player.salary),endDay:end,role,type:player.contract?.type||"permanent",source:player.contract?.source||VERSION};
    return player;
  }
  function ensureState(state){
    if(!state||typeof state!=="object")return state;
    const seen=new Set(),clubs=[];
    for(const club of state.clubs||[])if(club?.id&&!seen.has(club.id)){seen.add(club.id);clubs.push(club);}
    for(const club of Object.values(state.worldMatchClubs||{}))if(club?.id&&!seen.has(club.id)){seen.add(club.id);clubs.push(club);}
    for(const club of state.globalFootball?.clubs||[])if(club?.id&&Array.isArray(club.roster)&&!seen.has(club.id)){seen.add(club.id);clubs.push(club);}
    for(const club of clubs)for(const player of club.roster||[])if(player?.id!=="hero")ensurePlayer(state,player,club);
    return state;
  }
  const api={VERSION,estimateMarketValue,marketValue,expectedSalary,weeklySalary,contractYears,ensurePlayer,ensureState};
  root.ProLifePlayerEconomy=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
