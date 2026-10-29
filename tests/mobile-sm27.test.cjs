const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const read=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
const M=require("../src/ui/mobile-sm27.js");
test("arquivos do layout de celular estão registrados",()=>{
  const html=read("index.html"),assets=read("tools/assets.cjs");
  for(const f of ["src/ui/fc27-mobile-sm27.css","src/ui/mobile-sm27.js"]){assert.ok(html.includes(f),f+" no index.html");assert.ok(assets.includes(f),f+" em assets.cjs");}
  assert.ok(html.indexOf("mobile-sm27.js")<html.indexOf("src/ui/app.js"),"módulo carrega antes do app");
});
test("Central do celular gera blocos clicáveis e ação principal",()=>{
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const state={mode:"coach",day:10,clubId:"a",reputation:40,board:60,offers:[],coachCareer:{negotiations:{}}};
  const D={club:(s,id)=>({id,shortName:id==="a"?"Alfa":"Beta",strength:70})};
  const H={c:{id:"a",name:"Alfa",budget:1000},next:{home:"Alfa",away:"Beta",homeClubId:"a",awayClubId:"b",date:12,competitionName:"Liga",stage:"Rodada 1"},messages:[{subject:"Oi",read:false}],unread:1,competitionTable:{rows:[{id:"a",name:"Alfa",position:1,stats:{played:0,points:0}}]},recent:[],events:[{day:12,title:"Jogo"}],news:[]};
  const html=M.home(state,D,H,{esc,dayDate:d=>"d"+d,money:v=>"R$ "+v});
  assert.match(html,/data-live-match/);
  assert.match(html,/class="sm27-skip-match" data-simulate="nextMatch">Pular partida/);
  for(const page of ["inbox","profile","league","market","calendar","matches"])assert.ok(html.includes(`data-page="${page}"`),page);
  assert.ok(!/<ul|<li/.test(html),"sem listas dentro de botões");
  assert.match(html,/<button type="button" class="sm27-card sm27-tile"/);
});
test("CSS do celular fica restrito à orientação horizontal de aparelhos baixos",()=>{
  const css=read("src/ui/fc27-mobile-sm27.css");
  assert.match(css,/@media \(orientation: landscape\) and \(min-width: 568px\) and \(max-width: 1024px\) and \(max-height: 560px\)/);
  assert.match(css,/\.phone-only, \.sm27-backdrop, \.sm27-drawer \{ display:none !important; \}/);
});
test("menu lateral usa navegação profissional, compacta e sem rolagem",()=>{
  const app=read("src/ui/app.js"),css=read("src/ui/fc27-mobile-sm27.css"),mobile=read("src/ui/mobile-sm27.js");
  for(const group of ["Carreira","Clube","Competições","Gestão"])assert.ok(app.includes('["'+group+'",'),group);
  assert.match(app,/class="sm27-drawer-nav"/);
  assert.match(app,/class="sm27-drawer-footer"/);
  assert.match(app,/drawerIcon\("settings"\)/);
  assert.match(css,/width:min\(232px,44vw\)/);
  assert.match(css,/\.sm27-drawer-nav \{[\s\S]*?overflow:hidden/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/\.sm27-drawer-group \{[\s\S]*?width:100%[\s\S]*?max-width:100%[\s\S]*?overflow:hidden/);
  assert.match(css,/\.sm27-drawer-group > small, \.sm27-drawer-group > button \{[\s\S]*?max-width:100%[\s\S]*?margin-left:0/);
  assert.match(css,/\.sm27-drawer button\.active::before/);
  assert.match(css,/backdrop-filter:blur\(2px\)/);
  assert.match(mobile,/ev\.key === "Escape"/);
  assert.match(mobile,/drawerPointerX-ev\.clientX>42/);
});
