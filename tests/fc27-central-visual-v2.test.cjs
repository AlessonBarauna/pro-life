"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const app=read("src/ui/app.js"),css=read("src/ui/fc27-central-v2.css"),html=read("index.html"),assets=read("tools/assets.cjs");
test("Central 2.0: CSS isolado e publicado sem grid externo",()=>{
 const styles=[...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*>/g)].map(x=>x[0]);
 assert.ok(!styles.some(x=>x.includes("bootstrap-grid.min.css")));
 assert.ok(styles.at(-1).includes("fc27-central-v2.css"));
 assert.match(assets,/"src\/ui\/fc27-central-v2\.css"/);
});
test("Central 2.0: grid isolado envolve confronto, paineis e rodape",()=>{
 const start=app.indexOf('class="career-dashboard fc27-central-v2-approved"');
 const end=app.indexOf('    lineup() {',start);
 assert.ok(start>=0&&end>start);
 const home=app.slice(start,end);
 const row=home.indexOf('class="fc27-v2-layout"');
 const hero=home.indexOf('class="central-v3-hero central-main-match"');
 const board=home.indexOf('class="fc27-v2-board"');
 const old=home.indexOf('class="central-v3-grid central-grid"');
 const footer=home.indexOf('class="central-v3-context central-news central-calendar"');
 assert.ok(row>=0&&row<hero&&hero<board&&board<old&&old<footer);
 assert.match(home,/central-calendar"[\s\S]*<\/footer>\s*<\/div>\s*<\/div>`;/);
});
test("Central 2.0: nao dissolve wrappers com display contents",()=>{
 assert.ok(!/display\s*:\s*contents\s*!important/.test(css));
 assert.ok(css.includes(".fc27-central-v2-approved .fc27-v2-board"));
 assert.ok(css.includes('grid-template-areas:"hero board" "details details" "context context"'));
 assert.ok(css.includes("grid-template-columns:repeat(2,minmax(0,1fr))"));
});
test("Central 2.0: dispositivos estreitos recebem uma coluna",()=>{
 assert.ok(css.includes("@media(max-width:760px)"));
 assert.ok(css.includes("grid-template-columns:minmax(0,1fr)!important"));
});
test("Central 2.0: paineis e botoes originais preservados",()=>{
 for(const name of ["fc27-v2-calendar","fc27-v2-competitions","fc27-v2-summary","fc27-v2-alerts"])assert.ok(app.includes('class="fc27-v2-panel '+name+'"'));
 assert.ok(app.includes("data-live-match"));assert.ok(app.includes('data-simulate="nextCommitment"'));
 assert.ok(app.includes("D.seasonCompetitionCatalog?.(state)"));
 assert.ok(app.includes("H.events"));assert.ok(app.includes("c?.stats?.gf"));
});
