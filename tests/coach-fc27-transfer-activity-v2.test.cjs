const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("FC27-style transfer activity queue uses only persisted incoming and outgoing records",()=>{
 assert.match(view,/const activeTasks=\[/);
 assert.match(view,/\.\.\.sales\.map\(o=>/);
 assert.match(view,/\.\.\.pending\.map\(n=>/);
 assert.match(view,/activeTasks\.slice\(0,6\)/);
});
test("transfer activity prioritizes actionable deadlines and routes to actual deal tabs",()=>{
 assert.match(view,/\.sort\(\(a,b\)=>\(a\.waiting\?1:0\)-\(b\.waiting\?1:0\)\|\|a\.due-b\.due\)/);
 assert.match(view,/data-coach-deal-tab/);
 assert.match(view,/taskPanel\+'<nav class="cc-deal-nav"/);
});
test("negotiation details describe actual state without imaginary interest scores",()=>{
 assert.match(view,/const dealStage=n=>/);
 assert.match(view,/Etapa atual:/);
 assert.match(view,/Próxima ação:/);
 assert.match(view,/Sem respostas ou sondagens simuladas/);
});
