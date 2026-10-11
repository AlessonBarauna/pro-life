const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const View=require("../src/ui/player-development-view.js");
const D=require("../src/domain/engine.js");

function career(){
  const s=D.create({world:"legacy",mode:"player",name:"Jogador 32E",age:24,pos:"MEI",clubId:"c0"},3205);
  s.person.developmentProfile={id:"steady_rise",v:1};
  s.person.potential=84;
  s.person.morale=82;
  s.person.condition=91;
  s.matches.unshift({day:8,ratings:{hero:7.8}},{day:5,ratings:{hero:7.2}});
  s.development=[
    {day:0,season:s.season,overall:D.overall(s.person)-1,attrs:{...s.person.attrs,pace:s.person.attrs.pace-2},condition:88,morale:75},
    {day:7,season:s.season,overall:D.overall(s.person),attrs:{...s.person.attrs},condition:91,morale:82}
  ];
  return s;
}

test("32E renderiza GER, trajetória, potencial, indicadores e seis atributos",()=>{
  const s=career(),html=View.render(s,D);
  assert.match(html,/CENTRAL DE DESENVOLVIMENTO/);
  assert.match(html,/GER BASE/);
  assert.match(html,/GER ATUAL/);
  assert.match(html,/Ascensão constante/);
  assert.match(html,/FASE DA CARREIRA/);
  assert.match(html,/Auge projetado/);
  assert.match(html,/Teto de desenvolvimento/);
  assert.match(html,/não uma promessa de GER futuro/);
  assert.match(html,/Forma recente/);
  assert.match(html,/Moral/);
  assert.match(html,/Condicionamento/);
  assert.equal((html.match(/class="dev32-attribute"/g)||[]).length,6);
  for(const key of D.attrs.slice(0,6))assert.match(html,new RegExp(D.labels[key]));
});

test("32E usa somente histórico persistido e renderização não altera o estado",()=>{
  const s=career(),before=JSON.stringify(s),html=View.render(s,D);
  assert.equal(JSON.stringify(s),before);
  assert.match(html,/Dia 7/);
  assert.match(html,/Dia 0/);
  assert.match(html,/Somente registros já persistidos/);
  assert.match(html,/\+2 desde o primeiro registro da temporada/);
});

test("32E trata dados ausentes e protege HTML dinâmico",()=>{
  const s=career();
  s.person.name='<img src=x onerror="alert(1)">';
  delete s.person.potential;
  delete s.person.morale;
  delete s.person.condition;
  delete s.person.physical;
  delete s.person.developmentProfile;
  s.matches=[];
  s.development=[];
  const html=View.render(s,D);
  assert.doesNotMatch(html,/<img/);
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(html,/Estimado por dados disponíveis/);
  assert.match(html,/Ainda não há variações persistidas/);
  assert.match(html,/Sem histórico comparável/);
});

test("32E mantém modo treinador fora da central do jogador",()=>{
  const s=D.create({world:"legacy",mode:"coach",clubId:"c0"},12);
  const html=View.render(s,D);
  assert.match(html,/exclusiva da carreira de jogador/);
  assert.doesNotMatch(html,/GER ATUAL/);
});

test("32E está integrado à área existente e registrado uma única vez",()=>{
  const root=path.join(__dirname,"..");
  const app=fs.readFileSync(path.join(root,"src/ui/app.js"),"utf8");
  const index=fs.readFileSync(path.join(root,"index.html"),"utf8");
  const assets=fs.readFileSync(path.join(root,"tools/assets.cjs"),"utf8");
  assert.match(app,/ProLifePlayerDevelopmentView\?\.render/);
  assert.match(app,/href="#player-development">Evolução/);
  assert.equal((index.match(/src\/ui\/player-development-view\.js/g)||[]).length,1);
  assert.equal((assets.match(/src\/ui\/player-development-view\.js/g)||[]).length,1);
  assert.ok(index.indexOf("src/ui/player-development-view.js")<index.indexOf("src/ui/app.js"));
});
