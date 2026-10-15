const test=require("node:test");const assert=require("node:assert/strict");const ui=require("../src/ui/coach-match-center-v2.js");
test("T match centre exposes 4 functional tabs",()=>{for(const id of ["acontecimentos","estatisticas","desempenho","taticas"])assert.match(ui.tabs(id),new RegExp('data-live-tab="'+id+'"'));});
test("T match centre only shows events already reached",()=>{const m={events:[{minute:5,text:"First"},{minute:68,text:"Later"}]};assert.deepEqual(ui.eventList(m,20).map(x=>x.text),["First"]);});
test("T match centre keeps values escaped",()=>{const html=ui.panel({events:[{minute:2,text:"<script>"}]},10,"acontecimentos");assert.ok(!html.includes("<script>"));});
test("T match centre labels tactical guidance as non-interactive",()=>{assert.match(ui.panel({},30,"taticas"),/não alterariam o resultado/);});
test("T match centre handles sparse match metadata",()=>{assert.match(ui.panel({},15,"estatisticas"),/Finalizações/);assert.match(ui.panel({},15,"desempenho"),/DESEMPENHO/);});
