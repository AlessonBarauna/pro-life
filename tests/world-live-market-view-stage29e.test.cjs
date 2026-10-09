"use strict";

const test=require("node:test");
const assert=require("node:assert/strict");
const View=require("../src/ui/world-live-market-view.js");

function fixture(){
  const states=["rumor","scouting","negotiating","offer","completed","completed","rejected","cancelled"];
  const players=states.map((state,index)=>({
    id:`p${index}`,
    name:`Jogador ${index}`,
    age:20+index,
    pos:index%2?"MEI":"ATA",
    ovr:70+index,
    clubId:index%2?"eng_a":"bra_a",
  }));
  const deals=states.map((state,index)=>({
    id:`deal_${index}`,
    playerId:`p${index}`,
    fromClubId:index%2?"eng_a":"bra_a",
    toClubId:index%2?"bra_b":"eng_b",
    value:1000000*(index+1),
    salary:10000*(index+1),
    startDay:100+index,
    updatedDay:110+index,
    state,
    ...(index===4?{}:index===5?{executionStatus:"executed",executedDay:118,operationId:"op_5"}:{}),
  }));
  return {
    day:120,
    leagues:[{id:"serieA",name:"Brasileirão Série A",country:"Brasil"}],
    clubs:[
      {id:"bra_a",name:"Aurora Brasil",country:"Brasil",leagueId:"serieA",roster:players.filter(player=>player.clubId==="bra_a")},
      {id:"bra_b",name:"Boreal Brasil",country:"Brasil",leagueId:"serieA",roster:[]},
    ],
    internationalPlayers:players.filter(player=>player.clubId==="eng_a"),
    globalFootball:{
      leagues:[{id:"premier",name:"Premier League",country:"Inglaterra"}],
      clubs:[
        {id:"eng_a",name:"Albion FC",country:"Inglaterra",leagueId:"premier"},
        {id:"eng_b",name:"City United",country:"Inglaterra",leagueId:"premier"},
      ],
    },
    worldLiveMarket:{
      version:1,
      deals,
      events:[
        {id:"ev_1",dealId:"deal_0",day:110,state:"scouting"},
        {id:"op_5",type:"transfer-executed",operationId:"op_5",dealId:"deal_5",day:118,playerId:"p5",fromClubId:"eng_a",toClubId:"bra_b",value:6000000,salary:60000},
      ],
    },
  };
}

test("29E: renderiza abas, indicadores e cards com dados reais",()=>{
  const s=fixture();
  const html=View.render(s,null,{tab:"rumors"});
  for(const marker of [
    "data-world-live-market-view","Rumores","Negociações","Propostas","Concluídas","Histórico",
    "Jogador 0","GER","ATA","20 anos","Aurora Brasil","City United","R$ 1.000.000","Rumor",
    "world-live-market-dark","ATIVAS","ACORDOS","EFETIVADAS",
  ]) assert.ok(html.includes(marker),marker);
  const data=View.snapshot(s,null,{tab:"rumors"});
  assert.equal(data.visible.length,2);
  assert.deepEqual(data.indicators,{active:4,agreements:2,executed:1});
});

test("29F: Concluidas exibe execucoes e Historico preserva acordos",()=>{
  const s=fixture();
  const offers=View.snapshot(s,null,{tab:"offers"});
  assert.deepEqual(offers.visible.map(item=>item.deal.state),["offer"]);
  const completed=View.snapshot(s,null,{tab:"completed"});
  assert.equal(completed.visible.length,1);
  assert.ok(completed.visible.every(item=>item.deal.executionStatus==="executed"));
  const history=View.snapshot(s,null,{tab:"history"});
  assert.equal(history.visible.length,4);
  assert.ok(history.visible.some(item=>item.deal.state==="completed"&&item.deal.executionStatus!=="executed"));
  const html=View.render(s,null,{tab:"history"});
  assert.ok(html.includes("world-market-resolution agreement"));
  assert.ok(html.includes("efetivada no dia 118"));
});

test("29E: filtros por país, liga, clube e período usam somente negociações existentes",()=>{
  const s=fixture();
  assert.equal(View.snapshot(s,null,{tab:"history",country:"Brasil"}).visible.length,2);
  assert.equal(View.snapshot(s,null,{tab:"history",league:"premier"}).visible.length,2);
  assert.equal(View.snapshot(s,null,{tab:"history",club:"eng_a"}).visible.length,2);
  assert.equal(View.snapshot(s,null,{tab:"history",period:"14"}).visible.length,2);
  assert.equal(View.snapshot(s,null,{tab:"history",country:"Portugal"}).visible.length,0);
});

test("29E: linha do tempo usa eventos persistidos sem inventar novos",()=>{
  const s=fixture();
  const before=s.worldLiveMarket.events.length;
  const html=View.render(s,null,{tab:"completed"});
  assert.ok(html.includes("LINHA DO TEMPO"));
  assert.ok(html.includes("Transferência efetivada"));
  assert.ok(html.includes("Albion FC → Boreal Brasil"));
  assert.equal(s.worldLiveMarket.events.length,before);
});

test("29E: estados vazios e dados incompletos são informativos",()=>{
  const empty={day:0,worldLiveMarket:{deals:[],events:[]},clubs:[],globalFootball:{clubs:[],leagues:[]}};
  const html=View.render(empty,null,{tab:"offers"});
  assert.ok(html.includes("Nenhuma negociação nesta etapa"));
  assert.ok(html.includes("Ainda não há eventos"));
  assert.doesNotMatch(html,/\b(?:undefined|null|NaN)\b/);

  const incomplete={day:4,worldLiveMarket:{deals:[{id:"x",playerId:"missing",fromClubId:"a",toClubId:"b",state:"rumor",startDay:1}],events:[]}};
  const fallback=View.render(incomplete);
  assert.ok(fallback.includes("Jogador indisponível"));
  assert.doesNotMatch(fallback,/\b(?:undefined|null|NaN)\b/);
});

test("29E: textos dinâmicos são escapados contra HTML malicioso",()=>{
  const s=fixture();
  s.clubs[0].name='<img src=x onerror="attack()">';
  s.globalFootball.clubs[1].name="<script>attack()</script>";
  s.clubs[0].roster[0].name='<svg onload="attack()">';
  const html=View.render(s,null,{tab:"rumors"});
  assert.doesNotMatch(html,/<(?:script|svg|img)\b/i);
  assert.ok(html.includes("&lt;svg onload=&quot;attack()&quot;&gt;"));
  assert.ok(html.includes("&lt;script&gt;attack()&lt;/script&gt;"));
});

test("29E: renderização é pura e não gera rumores ou altera o estado",()=>{
  const s=fixture();
  const before=JSON.stringify(s);
  View.snapshot(s,null,{tab:"history",country:"Brasil",period:"30"});
  View.render(s,null,{tab:"completed",club:"eng_a"});
  assert.equal(JSON.stringify(s),before);
  assert.equal(s.worldLiveMarket.deals.length,8);
  assert.equal(s.worldLiveMarket.events.length,2);
});
