"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const D=require("../src/domain/engine.js");global.ProLife=D;
const HD=require("../src/ui/home-dashboard.js"),Cal=require("../src/ui/calendar.js"),PC=require("../src/ui/player-central-view.js");
const util={esc:v=>String(v??""),money:v=>"R$ "+v,dayDate:d=>"dia "+d,crest:()=>""};
const make=(mode,days=0)=>{const s=D.create({mode,clubId:"c0",catalogVersion:"fc27_v1"},5);for(let i=0;i<days;i++)D.advance(s,1);return s;};
const html=s=>PC.render(s,D,HD.snapshot(s,D,Cal),util);
const text=h=>h.replace(/<[^>]+>/g," ").replace(/\s+/g," ");

test("Central do jogador: card do atleta, partida, forma, contrato e numeros da temporada",()=>{
  const s=make("player"),h=html(s),t=text(h);
  for(const x of ["PRÓXIMA PARTIDA","Como você está","Sua temporada","Contrato","Suas últimas atuações","Evolução e objetivos","SEU PAPEL"])assert.ok(t.includes(x),x);
  assert.ok(t.includes(s.person.name)&&/RIT\s+\d+/.test(t)&&/potencial \d+/.test(t));
  assert.ok(h.includes("data-live-match")&&h.includes('data-simulate="nextCommitment"')&&h.includes('data-page="lineup"')&&h.includes('data-page="contract"'));
});
test("Central do jogador: sem undefined/NaN em varias fases da carreira",()=>{
  for(const days of [0,40,200]){const t=text(html(make("player",days)));assert.ok(!/undefined|NaN|\[object|null/.test(t),days+": "+(t.match(/.{20}(undefined|NaN|\[object|null).{10}/)||[])[0]);}
});
test("Central do jogador e do treinador sao telas diferentes (app.js so troca no modo jogador)",()=>{
  const app=read("src/ui/app.js");
  assert.match(app,/state\.mode==="player"&&window\.ProLifePlayerCentral\)return window\.ProLifePlayerCentral\.render/);
  assert.ok(!/central-v3-header/.test(html(make("player"))),"nao reutiliza a Central do treinador");
});
test("Central do jogador: arquivos publicados e CSS antes do Central 2.0",()=>{
  const index=read("index.html"),assets=read("tools/assets.cjs");
  assert.ok(index.includes("src/ui/player-central-view.js")&&index.includes("src/ui/fc27-player-central.css"));
  assert.match(assets,/"src\/ui\/player-central-view\.js"/);assert.match(assets,/"src\/ui\/fc27-player-central\.css"/);
  const styles=[...index.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(x=>x[0]);assert.ok(styles.at(-1).includes("fc27-central-v2.css"));
});

test("Central do jogador: jogo pela Seleção aparece em 'Suas últimas atuações' e na temporada",()=>{
  const s=make("player");
  s.nationalTeam={...(s.nationalTeam||{}),country:"Brasil",calledUp:true,caps:1,starts:1,goals:1,assists:0,ratingTotal:7.4,motm:0,matches:[{season:s.season,day:Math.max(0,s.day),competition:"Copa Mundial",opponent:"Haiti",brazil:2,other:1,starter:true,minutes:90,goals:1,assists:0,rating:7.4}],history:[],schedule:[]};
  const t=text(html(s));
  assert.ok(/Haiti/.test(t)&&/Copa Mundial/.test(t),"partida pela Seleção listada");
  assert.ok(/Pela Seleção: 1 jogo · 1 gol/.test(t),"números da Seleção na temporada");
});
