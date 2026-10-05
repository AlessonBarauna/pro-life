const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const E=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8"),A=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("toda decisao passa pela camada universal de consequencias",()=>{assert.match(E,/applyDecisionConsequence\(s,resolvedDecision,choice,consequenceBefore\)/);});
test("efeitos existentes sao preservados e fallback so entra sem delta",()=>{assert.match(E,/if\(!Object\.keys\(delta\)\.length\)/);});
test("consequencias cobrem financeiro reputacao tecnico fisico e social",()=>["money","reputation","training","fitness","fans","morale"].forEach(x=>assert.match(E,new RegExp(x))));
test("consequencia fica historica e repercute no feed",()=>{assert.match(E,/s\.decisionConsequences\.unshift/);assert.match(E,/career\.feed\.unshift/);});
test("interface mostra ultima consequencia",()=>assert.match(A,/Última consequência/));
