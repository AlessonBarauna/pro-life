(function(root){
  'use strict';
  // 05A.3: selecao opt-in por subposicoes; nao altera atletas, attrs ou saves.
  const P=root.ProLifePlayerPositions||(typeof require==='function'?require('./player-positions.js'):null);
  const formationSlots=Object.freeze({
    '4-3-3':['GOL','LD','ZAG','ZAG','LE','VOL','MC','MC','PD','CA','PE'],
    '4-4-2':['GOL','LD','ZAG','ZAG','LE','MD','MC','MC','ME','CA','CA'],
    '4-2-3-1':['GOL','LD','ZAG','ZAG','LE','VOL','VOL','PD','MEI','PE','CA']
  });
  function supportsSpecific(roster){
    return !!P && Array.isArray(roster) && roster.some(p=>
      (P.isSpecific(p?.primaryPosition)||P.isSpecific(p?.specificPosition)||
      (Array.isArray(p?.secondaryPositions)&&p.secondaryPositions.some(P.isSpecific))));
  }
  // 05A.8: afinidade entre posicoes (somente para a ESCOLHA do treinador; nao altera GER nem atributos).
  // Pares "vizinhos" sao improvisos plausiveis; fora disso o custo cresce (ex.: centroavante de ponta).
  const NEAR=(()=>{const m=new Map(),add=(a,b)=>{m.set(a+'>'+b,1);m.set(b+'>'+a,1);};
    [['VOL','MC'],['MC','MEI'],['MEI','SA'],['SA','CA'],['PD','PE'],['PD','MD'],['PE','ME'],['MD','MC'],['ME','MC'],['LD','ALD'],['LE','ALE'],['LD','LE'],['MD','ME'],['SA','PD'],['SA','PE'],['MEI','PD'],['MEI','PE'],['MEI','VOL']].forEach(([a,b])=>add(a,b));
    return m;})();
  const COST={secondary:1,near:3,sameGroup:8,otherGroup:18,keeperMismatch:1e6};
  function fitCost(p,role){
    const gk=P.group(p.pos)==='GOL'||P.eligible(p)[0]==='GOL';
    if(role==='GOL')return gk?0:COST.keeperMismatch;
    if(gk)return COST.keeperMismatch;
    const valid=P.eligible(p);
    if(!valid.length)return P.group(p.pos)===P.group(role)?0:COST.otherGroup; // legado sem subposicao: sem inventar
    if(valid[0]===role)return 0;
    if(valid.includes(role))return p.secondaryPositionsSource==='suggested'?1.5:COST.secondary;
    if(valid.some(v=>NEAR.has(v+'>'+role)))return COST.near;
    return P.group(valid[0])===P.group(role)?COST.sameGroup:COST.otherGroup;
  }
  // Atribuicao otima (Hungarian, custo minimo). Deterministica: entrada ordenada por id; empates pelo menor indice.
  function hungarian(cost){
    const n=cost.length,m=cost[0].length,u=new Array(n+1).fill(0),v=new Array(m+1).fill(0),pp=new Array(m+1).fill(0),way=new Array(m+1).fill(0);
    for(let i=1;i<=n;i++){
      pp[0]=i;let j0=0;const minv=new Array(m+1).fill(Infinity),used=new Array(m+1).fill(false);
      do{
        used[j0]=true;const i0=pp[j0];let delta=Infinity,j1=0;
        for(let j=1;j<=m;j++)if(!used[j]){const cur=cost[i0-1][j-1]-u[i0]-v[j];if(cur<minv[j]){minv[j]=cur;way[j]=j0;}if(minv[j]<delta){delta=minv[j];j1=j;}}
        for(let j=0;j<=m;j++){if(used[j]){u[pp[j]]+=delta;v[j]-=delta;}else minv[j]-=delta;}
        j0=j1;
      }while(pp[j0]!==0);
      do{const j1=way[j0];pp[j0]=pp[j1];j0=j1;}while(j0);
    }
    const rowToCol=new Array(n).fill(-1);for(let j=1;j<=m;j++)if(pp[j])rowToCol[pp[j]-1]=j-1;
    return rowToCol;
  }
  function choose({formation,active,roster,score,overall,restsToday,maxGap=9}){
    if(!P||!formationSlots[formation])return null;
    if(!Array.isArray(active)||!Array.isArray(roster))return null;
    if(typeof score!=='function'||typeof overall!=='function')return null;
    const roles=formationSlots[formation];
    const players=active.slice().sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    const baseOf=p=>{const b=Number(overall(p));return Number.isFinite(b)?b:50;};
    const rank=(p,role)=>{
      const base=baseOf(p);
      return Number(score(p))+(P.positionalOverall(base,p,role)-base)*.64-fitCost(p,role);
    };
    const size=Math.max(players.length,roles.length),BIG=1000;
    // linhas = vagas (+ vagas vazias), colunas = jogadores (+ jogadores fantasma); par real sempre preferido ao fantasma.
    const cost=[];
    for(let r=0;r<size;r++){
      const row=[];
      for(let c=0;c<size;c++){
        if(r<roles.length&&c<players.length)row.push(-(BIG+rank(players[c],roles[r]))+c*1e-7);
        else row.push(0);
      }
      cost.push(row);
    }
    const match=hungarian(cost);
    const starters=[],rested=[],assignedPositions={},roleOf=new Map();
    for(let r=0;r<roles.length;r++){
      const c=match[r];if(c<0||c>=players.length)continue;
      roleOf.set(r,players[c]);
    }
    // Rodizio (34F.20): quem deve descansar cede a vaga a um reserva de nivel proximo cujo encaixe naquela vaga seja bom.
    const used=new Set([...roleOf.values()]);
    if(typeof restsToday==='function'){
      for(let r=0;r<roles.length;r++){
        const cur=roleOf.get(r);if(!cur||!restsToday(cur))continue;
        const subs=players.filter(p=>!used.has(p)&&!restsToday(p)&&baseOf(p)>=baseOf(cur)-maxGap&&fitCost(p,roles[r])<=COST.near)
          .sort((a,b)=>rank(b,roles[r])-rank(a,roles[r])||String(a.id).localeCompare(String(b.id)));
        if(subs.length){rested.push(cur);used.delete(cur);used.add(subs[0]);roleOf.set(r,subs[0]);}
      }
    }
    for(let r=0;r<roles.length;r++){const p=roleOf.get(r);if(!p)continue;starters.push(p);assignedPositions[p.id]=roles[r];}
    const bench=active.filter(p=>!starters.includes(p)).sort((a,b)=>score(b)-score(a)||String(a.id).localeCompare(String(b.id))).slice(0,7);
    const out=roster.filter(p=>!starters.includes(p)&&!bench.includes(p));
    return {formation,starters,bench,out,rested,assignedPositions};
  }
  // Atribuicao otima (menor custo de improvisacao) de 11 jogadores ja escolhidos as vagas da formacao.
  function assignRoles(players,roles){
    if(!P||!Array.isArray(players)||!Array.isArray(roles)||players.length!==roles.length)return null;
    const cost=roles.map((role,r)=>players.map((p,c)=>fitCost(p,role)+c*1e-7+r*0));
    const match=hungarian(cost);
    return roles.map((role,r)=>[players[match[r]],role]);
  }
  // Sugestao manual do melhor XI: primeiro respeita a posicao (primaria ou
  // secundaria real) e, entre jogadores com o mesmo encaixe, escolhe o maior GER.
  // A atribuicao global evita usar um atleta versatil cedo e prejudicar outra vaga.
  function suggestIdeal({formation,roster,overall}){
    if(!P||!formationSlots[formation]||!Array.isArray(roster)||typeof overall!=='function')return null;
    const roles=formationSlots[formation];
    const players=roster.filter(p=>p&&!p.injury&&!(Number(p.suspension)>0))
      .sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    if(players.length<roles.length)return null;
    const goalkeeper=p=>P.group(p?.pos)==='GOL'||P.eligible(p)[0]==='GOL';
    if(!players.some(goalkeeper))return null;
    const fitTier=(p,role)=>{
      if(role==='GOL')return goalkeeper(p)?0:1000;
      if(goalkeeper(p))return 1000;
      const valid=P.eligible(p);
      if(valid.includes(role))return 0;
      if(!valid.length&&P.group(p?.pos)===P.group(role))return 1;
      if(valid.some(v=>NEAR.has(v+'>'+role)))return 2;
      if(valid.length&&P.group(valid[0])===P.group(role))return 3;
      return 4;
    };
    const cost=roles.map(role=>players.map((p,index)=>{
      const value=Number(overall(p));
      const ger=Number.isFinite(value)?Math.max(0,Math.min(100,value)):0;
      return fitTier(p,role)*1000-ger+index*1e-7;
    }));
    const match=hungarian(cost);
    const assignments=roles.map((role,index)=>({role,player:players[match[index]]}));
    if(assignments.some(x=>!x.player)||new Set(assignments.map(x=>x.player.id)).size!==roles.length)return null;
    if(assignments.some(x=>(x.role==='GOL')!==goalkeeper(x.player)))return null;
    const assignedPositions={};
    for(const item of assignments)assignedPositions[item.player.id]=item.role;
    return {formation,assignments,starters:assignments.map(x=>x.player),assignedPositions};
  }
  const api={formationSlots,supportsSpecific,choose,assignRoles,suggestIdeal};
  root.ProLifeSquadPositionSelection=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
