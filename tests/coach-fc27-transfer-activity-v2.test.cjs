const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const view=fs.readFileSync(path.join(__dirname,"../src/ui/coach-career-view.js"),"utf8");
test("FC27-style transfer activity queue uses only persisted incoming and outgoing records",()=>{
 assert.match(view,/const activeTasks=\[/);
 assert.match(view,/const activeDealPlayerKeys=new Set\(pending\.map/);
 assert.match(view,/const ownedPlayerIds=new Set/);
 assert.match(view,/!ownedPlayerIds\.has\(String\(x\.playerId\)\)/);
 assert.match(view,/!activeDealPlayerKeys\.has\(String\(x\.playerId\)\+"::"\+String\(x\.clubId\)\)/);
 assert.match(view,/\.\.\.sales\.map\(o=>/);
 assert.match(view,/\.\.\.pending\.map\(n=>/);
 assert.match(view,/activeTasks\.slice\(0,4\)/);
});
test("transfer activity prioritizes actionable deadlines and routes to actual deal tabs",()=>{
 assert.match(view,/\.sort\(\(a,b\)=>\(a\.waiting\?1:0\)-\(b\.waiting\?1:0\)\|\|a\.due-b\.due\)/);
 assert.match(view,/data-coach-deal-tab/);
 assert.match(view,/marketOverview\+taskPanel/);
});
test("negotiation details describe actual state without imaginary interest scores",()=>{
 assert.match(view,/const dealStage=n=>/);
 assert.match(view,/Etapa atual:/);
 assert.match(view,/Próxima ação:/);
 assert.match(view,/never from invented AI replies or hidden probabilities/);
});
