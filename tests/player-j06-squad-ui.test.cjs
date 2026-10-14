"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs");
const app=fs.readFileSync("src/ui/app.js","utf8"),css=fs.readFileSync("src/ui/fc27-j06-squad.css","utf8"),html=fs.readFileSync("index.html","utf8");
test("J06 aplica visual somente no modo jogador",()=>{assert.match(app,/state\.mode==="player"\?"pl-j06-squad":""/);assert.match(css,/\.pl-j06-squad \.pl-squad-workspace/);});
test("campo tático, titulares, reservas e atleta selecionado preservados",()=>{for(const fragment of ["pl-j06-pitch","pl-squad-row","pl-squad-bench-scroll","pl-squad-detail-hero","data-squad-player"])assert.ok(app.includes(fragment),fragment);});
test("concorrência e confiança usam valores reais da carreira",()=>{assert.match(app,/pc\.coachTrust/);assert.match(app,/pc\?\.matchSelection\?\.reason/);assert.match(app,/D\.overall\(comparison\)/);assert.match(app,/selectionStatus\(selected\)/);});
test("não aparecem abas decorativas sem ação",()=>{assert.doesNotMatch(app,/<button class="active">Atributos<\/button><button>Comparação<\/button><button>Contrato<\/button>/);});
test("estilo J06 carregado após CSS antigo",()=>{assert.ok(html.indexOf("fc27-j06-squad.css")>html.indexOf("fc27-05c-player.css"));assert.match(css,/@media\(max-width:1000px\)/);});
