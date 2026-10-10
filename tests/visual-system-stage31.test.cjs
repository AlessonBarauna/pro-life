const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const css=fs.readFileSync(path.join(__dirname,"../src/ui/style.css"),"utf8");
const layer=css.slice(css.indexOf("/* ===== Stage 31.6"));

test("31.6 camada visual existe e o CSS está balanceado",()=>{
  assert.ok(layer.length>4000);
  let depth=0;for(const ch of css.replace(/\/\*[\s\S]*?\*\//g,"")){if(ch==="{")depth++;if(ch==="}")depth--;assert.ok(depth>=0);}
  assert.equal(depth,0);
});
test("31.6 tokens do sistema visual definidos",()=>{
  for(const t of ["--pl-bg","--pl-surface","--pl-cyan","--pl-gold","--pl-r-lg","--pl-shadow","--pl-focus"])assert.match(layer,new RegExp(t+":"));
});
test("31.6 variantes de card, botão e estado vazio padronizados",()=>{
  for(const c of ["pl-card--primary","pl-card--secondary","pl-card--info","pl-card--action","pl-card--status","pl-card--alert","pl-btn--primary","pl-empty"])assert.ok(layer.includes("."+c),c);
});
test("31.6 navegação com estado ativo evidente, foco visível e contador",()=>{
  assert.match(layer,/\.game-nav nav button\.active\{/);
  assert.match(layer,/\.game-subnav button\.active\{[^}]*var\(--pl-cyan\)/);
  assert.match(layer,/focus-visible/);
  assert.match(layer,/\.game-nav nav button i\{/);
});
test("31.6 regras genéricas de elemento não sobrescrevem componentes (zero especificidade)",()=>{
  for(const sel of [":where(.game-shell h2)",":where(.game-shell button",":where(.game-shell p)"])assert.ok(layer.includes(sel),sel);
  assert.doesNotMatch(layer,/^\.game-shell button\{/m);
  assert.doesNotMatch(layer,/^\.game-shell (h2|h3|p)\{/m);
});
test("31.6 responsividade em tablet, mobile e telas estreitas, sem overflow horizontal",()=>{
  for(const w of ["1180px","900px","760px","420px"])assert.ok(layer.includes(`max-width:${w}`),w);
  assert.match(layer,/overflow-wrap:anywhere/);
  assert.match(layer,/\.tablewrap\{[^}]*overflow:auto/);
  assert.match(layer,/img,svg,canvas,video\{max-width:100%\}/);
});
test("31.6 identidade própria: sem assets ou marcas externas",()=>{
  assert.doesNotMatch(layer,/url\(|@import|EA SPORTS|FC ?27/i);
});
