(function(root){
  "use strict";
  // 34F.30A - Nacionalidade como fonte de verdade da carreira internacional.
  // Derivado do estado (s.person.nationality); nada novo e persistido, nenhuma nacionalidade e alterada.
  const UEFA="ESP ENG ITA GER FRA POR NED BEL CRO SUI AUT DEN NOR SWE FIN ISL POL CZE SVK SVN HUN ROU SRB UKR TUR SCO WAL IRL NIR GRE ALB GEO BIH KOS MKD MNE BUL ARM LUX RUS CYP EST LVA LTU FRO ISR".split(" ");
  const CONMEBOL="BRA ARG URU COL ECU PAR CHI PER VEN BOL".split(" ");
  const CONCACAF="MEX USA CAN CRC PAN JAM HAI CUW SUR HON TRI PUR DOM".split(" ");
  const CAF="MAR SEN CIV ALG EGY TUN GHA NGA CMR MLI COD GUI GAB BFA CPV ZAM RSA BEN TOG GAM ZIM MOZ EQG ANG GNB BDI MTN MAD".split(" ");
  const AFC="JPN KOR AUS IRN KSA UZB IRQ QAT JOR IDN LBN".split(" ");
  const OFC=["NZL"];
  const CONF={};
  for(const [name,list] of [["UEFA",UEFA],["CONMEBOL",CONMEBOL],["CONCACAF",CONCACAF],["CAF",CAF],["AFC",AFC],["OFC",OFC]])for(const c of list)CONF[c]=name;
  const EXTRA={"republic of ireland":"IRL","ireland":"IRL","eire":"IRL","brazil":"BRA","brasil":"BRA","england":"ENG","inglaterra":"ENG"};
  const plain=v=>String(v==null?"":v).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim();
  const gf=()=>root.ProLifeGlobalFootball||(root.ProLife&&root.ProLife.GlobalFootball)||(typeof require==="function"?(()=>{try{return require("./global-football.js");}catch(e){return null;}})():null);
  const codeOf=value=>{
    const raw=String(value==null?"":value).trim();if(!raw)return null;
    if(/^[A-Za-z]{3}$/.test(raw)&&CONF[raw.toUpperCase()])return raw.toUpperCase();
    const k=plain(raw);if(EXTRA[k])return EXTRA[k];
    const g=gf();const c=g&&g.nationCode?g.nationCode(raw):null;return c||null;
  };
  const teamCache=new WeakMap();
  function teamIds(s,D){
    const key=(s.season||0);const hit=teamCache.get(s);if(hit&&hit.key===key)return hit.set;
    const set=new Set();
    for(const n of (D&&D.NationalTeam&&D.NationalTeam.nations)||[])set.add(n.id);
    try{const w=D&&D.NationalTeam&&D.NationalTeam.worldCupSummary&&D.NationalTeam.worldCupSummary(s);for(const p of (w&&w.participants)||[])set.add(p.id);}catch(e){}
    teamCache.set(s,{key,set});return set;
  }
  function resolve(value,s,D){
    const raw=value==null?"":String(value);const code=codeOf(raw);
    const g=gf();const name=code?((g&&g.nationName&&g.nationName(code))||raw):(raw||null);
    const represented=!!(code&&(CONF[code]||(s&&teamIds(s,D||root.ProLife).has(code))));
    let reason=null;
    if(!raw.trim())reason="Nacionalidade não informada nesta carreira.";
    else if(!code)reason=`A nacionalidade "${raw}" não tem seleção cadastrada no PRO-LIFE.`;
    else if(!represented)reason=`${name} ainda não tem seleção simulada no PRO-LIFE (a nacionalidade foi preservada).`;
    return {raw,code,name,confederation:code?(CONF[code]||null):null,represented,reason};
  }
  function heroTeam(s,D){return resolve(s&&s.person&&s.person.nationality,s,D);}
  function coachTeam(s){
    const id=s&&s.coach&&(s.coach.nationalTeamId||s.coach.nationalTeam&&s.coach.nationalTeam.id)||null;
    return {assigned:!!id,teamId:id||null,reason:id?null:"Sem vínculo com uma seleção. A nacionalidade do treinador não define a seleção comandada."};
  }
  const QUOTA={GOL:3,DEF:8,MEI:8,ATA:7},SHAPE={GOL:1,DEF:4,MEI:3,ATA:3};
  // 34F.30C - GER canonico: o protagonista (atributos reais) e sempre medido por ProLife.overall(person);
  // person.ovr/overall sao snapshots antigos e nunca devem ser usados para ele. Catalogo FC 27 segue usando ovr/overall.
  let ENGINE=null;
  const engine=D=>D&&typeof D.overall==="function"?D:(ENGINE||root.ProLife||null);
  const isHeroPlayer=p=>!!(p&&p.id==="hero"&&p.attrs);
  function gerOf(p,D){
    if(!p)return 0;
    if(isHeroPlayer(p)){const E=engine(D);if(E&&typeof E.overall==="function"){try{const v=Number(E.overall(p));if(Number.isFinite(v))return v;}catch(e){}}}
    return Number(p.ovr||p.overall||0);
  }
  const ovrOf=p=>gerOf(p,null);
  function pick(list,n,used){const out=[];for(const p of list){if(out.length>=n)break;if(!used.has(p.id)){used.add(p.id);out.push(p);}}return out;}
  function lineupFrom(squad,formation){
    const by=pos=>squad.filter(p=>p.pos===pos).sort((a,b)=>ovrOf(b)-ovrOf(a));
    const used=new Set(),starters=[];
    for(const pos of ["GOL","DEF","MEI","ATA"])starters.push(...pick(by(pos),SHAPE[pos],used));
    if(starters.length<11){const rest=squad.filter(p=>!used.has(p.id)&&p.pos!=="GOL").sort((a,b)=>ovrOf(b)-ovrOf(a));starters.push(...pick(rest,11-starters.length,used));}
    const bench=squad.filter(p=>!used.has(p.id));
    return {formation:formation||"4-3-3",starters,bench};
  }
  const squadCache=new WeakMap();
  const clubLabel=(s,p)=>{const N=root.ProLifeNames;const id=p.clubId;if(id&&N&&N.club){const n=N.club(s,id,p.club||p.externalClub);if(n)return n;}return p.club||p.externalClub||"Sem clube";};
  const light=(s,p,heroId,avail)=>({id:p.id,name:p.name||p.shortName||"Atleta",pos:p.pos,club:clubLabel(s,p),clubId:p.clubId||null,age:Number(p.age||0),overall:gerOf(p,ENGINE),hero:p.id===heroId,available:avail!==false,injury:Number(p.injury||0)>0,suspended:!!(p.suspension&&(p.suspension.games>0||p.suspension>0))});
  const isSynthetic=p=>/^intlgen_/.test(String(p.id))||p.generatedInternational===true;
  const MERIT=(a,b)=>b.overall-a.overall||(a.age-b.age)||String(a.id).localeCompare(String(b.id));
  // 34F.30B.1 - Mecanismo unico para TODAS as selecoes: elenco elegivel -> pre-lista -> elenco-base -> escalacao.
  // Usa apenas atletas reais da carreira/catalogo com a nacionalidade da selecao; nunca completa com ficticios nem outra nacionalidade.
  function pool(s,D,team){
    const g=gf();if(!team||!team.code||!g)return [];
    ENGINE=D||ENGINE;
    const heroId=s.person&&s.person.id;
    return g.playersByNationality(s,team.name)
      .filter(p=>p.status!=="retired"&&p.active!==false&&Number(p.age||0)<=45&&!isSynthetic(p)&&["GOL","DEF","MEI","ATA"].includes(p.pos))
      .map(p=>light(s,p,heroId,!(Number(p.injury||0)>0)&&!(p.suspension&&(p.suspension.games>0||p.suspension>0))));
  }
  function squad(s,D,team){
    const empty={source:"none",eligible:[],preList:[],squad:[],starters:[],bench:[],formation:null,complete:false,limited:true,eligibleCount:0,availableCount:0,note:team&&team.reason||"Seleção indisponível."};
    if(!team||!team.code)return empty;
    ENGINE=D||ENGINE;
    const key=`${s.season}|${s.day||0}|${team.code}|${gerOf(s.person,D)}`;
    const hit=squadCache.get(s);if(hit&&hit.key===key&&hit.code===team.code)return hit.value;
    const eligible=pool(s,D,team).sort(MERIT),avail=eligible.filter(p=>p.available);
    const used=new Set(),sel=[];
    for(const pos of ["GOL","DEF","MEI","ATA"])sel.push(...pick(avail.filter(p=>p.pos===pos),QUOTA[pos],used));
    if(sel.length<26)sel.push(...pick(avail.filter(p=>p.pos!=="GOL"),26-sel.length,used));
    sel.sort(MERIT);
    const lu=lineupFrom(sel,"4-3-3");
    const preUsed=new Set(),preList=[];
    for(const [pos,n] of [["GOL",5],["DEF",12],["MEI",10],["ATA",8]])preList.push(...pick(avail.filter(p=>p.pos===pos),n,preUsed));
    const hasGk=lu.starters.some(p=>p.pos==="GOL"),complete=lu.starters.length===11&&hasGk;
    const limited=avail.length<26;
    const value={source:"catalogo",eligible,preList:preList.sort(MERIT),squad:sel,...lu,complete,limited,eligibleCount:eligible.length,availableCount:avail.length,
      note:limited?`${team.name} tem apenas ${avail.length} atleta(s) elegível(is) e disponível(is) no catálogo. O PRO-LIFE não completa a lista com atletas fictícios nem de outra nacionalidade.`:null,
      nationPool:"elenco-base calculado a partir de jogadores reais do catálogo (não é uma convocação oficial)"};
    squadCache.set(s,{key,code:team.code,value});return value;
  }
  // Disputa por posicao entre os jogadores elegiveis da propria nacionalidade (dados reais do catalogo/carreira).
  function competition(s,D,team,limit){
    if(!team||!team.code)return {rank:null,total:0,rows:[]};
    const g=gf();if(!g)return {rank:null,total:0,rows:[]};
    ENGINE=D||ENGINE;
    const hero=s.person,pos=hero&&hero.pos;
    const elig=g.playersByNationality(s,team.name).filter(p=>p.pos===pos&&p.status!=="retired"&&p.active!==false&&!isSynthetic(p)&&(p.id===hero.id||(!p.injury&&Number(p.age||0)<=45)));
    // Protagonista exatamente uma vez; GER atual do protagonista; desempate estavel (GER, idade, id) igual ao da convocacao.
    const seen=new Set(),uniq=[];for(const p of elig){if(p&&p.id&&!seen.has(p.id)){seen.add(p.id);uniq.push(p);}}
    if(hero&&hero.id&&!seen.has(hero.id)&&hero.pos===pos)uniq.push(hero);
    const gv=new Map(uniq.map(p=>[p.id,gerOf(p,D)]));
    uniq.sort((a,b)=>gv.get(b.id)-gv.get(a.id)||Number(a.age||99)-Number(b.age||99)||String(a.id).localeCompare(String(b.id)));
    elig.length=0;elig.push(...uniq);
    const idx=elig.findIndex(p=>p.id===hero.id);
    const rows=elig.slice(0,limit||8).map((p,i)=>({rank:i+1,...light(s,p,hero.id)}));
    if(idx>=(limit||8))rows.push({rank:idx+1,...light(s,hero,hero.id)});
    return {rank:idx<0?null:idx+1,total:elig.length,rows,pos};
  }
  function worldCupOf(s,D,team){
    if(!team||!team.code)return null;
    let w=null;try{w=D.NationalTeam.worldCupSummary(s);}catch(e){}
    if(!w)return null;
    const grp=(w.allGroups||[]).find(g=>(g.table||[]).some(r=>r.id===team.code));
    if(!grp)return {year:w.year,status:w.status,phase:w.phase,qualified:false,note:`${team.name} não está entre as seleções da Copa ${w.year}.`};
    const matches=(grp.matches||[]).filter(m=>m.homeId===team.code||m.awayId===team.code);
    const ko=(w.allKnockout||[]).filter(m=>m&&(m.homeId===team.code||m.awayId===team.code));
    const row=grp.table.find(r=>r.id===team.code);
    const sorted=grp.table.slice();
    return {year:w.year,status:w.status,phase:w.phase,qualified:true,group:grp.name,table:sorted,row,matches,knockout:ko};
  }
  function profile(s,D){
    const team=heroTeam(s,D),hero=s.person||{};
    const n=(D.NationalTeam&&D.NationalTeam.init)?D.NationalTeam.init(s):{};
    const comp=team.represented?competition(s,D,team,8):{rank:null,total:0,rows:[]};
    const isBRA=team.code==="BRA";
    let callup;
    if(!team.represented)callup="Sem seleção disponível";
    else if(isBRA)callup=n.calledUp?"Convocado":"Fora da convocação atual";
    else{
      const NCs=root.ProLifeNationalCallups,cur=NCs&&NCs.current?NCs.current(s):null;
      callup=NCs&&NCs.onDuty&&NCs.onDuty(s)?"A serviço da seleção":cur?(cur.called?"Convocado":"Fora da convocação atual"):"Aguardando a próxima convocação";
    }
    return {team,hero:{name:hero.name,nationality:hero.nationality||null,overall:gerOf(hero,D),pos:hero.pos,reputation:hero.reputation,morale:hero.morale,age:hero.age},competition:comp,callup,callupSimulated:isBRA,
      history:isBRA?{caps:n.caps||0,goals:n.goals||0,assists:n.assists||0,callups:n.callups||0}:{caps:0,goals:0,assists:0,callups:(root.ProLifeNationalCallups&&root.ProLifeNationalCallups.calledCount)?root.ProLifeNationalCallups.calledCount(s,team.code):0},
      nextWindow:isBRA?(n.nextWindow||null):null};
  }
  const api={gerOf,resolve,codeOf,heroTeam,coachTeam,squad,pool,competition,worldCupOf,profile,lineupFrom,confederationOf:c=>CONF[c]||null,CONFEDERATIONS:["UEFA","CONMEBOL","CONCACAF","CAF","AFC","OFC","FIFA"]};
  root.ProLifeNationalIdentity=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
