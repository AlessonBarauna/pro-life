"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const E=require("../src/domain/engine.js");
const HD=require("../src/ui/home-dashboard.js");

for(const comp of ["uel","uecl"]){
  test(`treinador: jogos da fase de liga da ${comp.toUpperCase()} entram no histórico e na forma (V/E/D)`,{timeout:0},()=>{
    const s=E.create({mode:"coach",catalogVersion:"fc27_v1"},4242);
    const ed=Object.values(s.continental.editions).find(x=>x.comp===comp);
    const id=ed.leagueSchedule.matches[0].homeId;
    s.clubId=null;E.join(s,id,90000);
    for(let i=0;i<10;i++){s.board=100;E.advance(s,30);}
    const own=s.matches.filter(m=>m.competitionId===comp&&(m.home===id||m.away===id));
    assert.ok(own.length>0,"o jogo do clube do treinador deve ser registrado");
    for(const m of own)assert.match(HD.resultFor(s,m),/^[VED]$/);
    const keys=own.map(m=>`${m.round}:${m.date}`);
    assert.equal(new Set(keys).size,keys.length,"sem partidas duplicadas");
    const recent=HD.recentEntries(s).filter(e=>e.match.competitionId===comp);
    assert.ok(recent.length>0,"a forma recente deve listar a partida europeia");
  });
}
