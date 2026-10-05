const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const E=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8"),A=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
test("confirma somente depois da transferencia real",()=>assert.ok(E.indexOf('status="CONFIRMED"')>E.indexOf("Career.transfer(s, s.person, previous, next, fee);")));
test("recusa persistente",()=>{assert.match(A,/state\.rejectedTransfers \|\|=/);assert.match(A,/career\.transfers=career\.transfers\.filter/)});
test("legado ambiguo do heroi nao aparece confirmado",()=>{assert.match(A,/return t\.player!==state\.person\.name/);assert.match(A,/confirmedTransfers\.slice\(0, 30\)/)});
