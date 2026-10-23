const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const E=fs.readFileSync(path.join(__dirname,"../src/domain/engine.js"),"utf8"),A=fs.readFileSync(path.join(__dirname,"../src/ui/app.js"),"utf8");
const Career=require("../src/domain/career.js");
test("confirma somente depois da transferencia real",()=>assert.ok(E.indexOf('status="CONFIRMED"')>E.indexOf("Career.transfer(s, s.person, previous, next, fee);")));
test("recusa persistente",()=>{assert.match(A,/state\.rejectedTransfers \|\|=/);assert.match(A,/career\.transfers=career\.transfers\.filter/)});
test("legado ambiguo do heroi nao aparece confirmado",()=>{assert.match(A,/return t\.player!==state\.person\.name/);assert.match(A,/confirmedTransfers\.slice\(0, 30\)/)});
test("historico mantém os 100 registros mais recentes e save/reload não duplica",()=>{
 const state={day:0,season:2026,mode:"player",clubId:null,clubs:[],offers:[],person:{id:"hero",name:"Herói",age:20,pos:"ATA",goals:0,minutes:0,attrs:{pace:70,shooting:70,passing:70,dribbling:70,defending:40,physical:65}},news:[]};
 const from={name:"Origem"},to={name:"Destino"};
 for(let i=0;i<105;i++){state.day=i;Career.transfer(state,{id:"p"+i,name:"Jogador "+i,pos:"ATA"},from,to,1000+i);}
 assert.equal(state.extras.transfers.length,100);
 assert.equal(state.extras.transfers[0].player,"Jogador 104");
 assert.equal(state.extras.transfers[99].player,"Jogador 5");
 const serializedTransfers=JSON.stringify(state.extras.transfers);
 const restored=JSON.parse(JSON.stringify(state));
 Career.init(restored);
 assert.equal(JSON.stringify(restored.extras.transfers),serializedTransfers);
 assert.equal(new Set(restored.extras.transfers.map(t=>[t.day,t.player,t.from,t.to].join("|"))).size,100);
});
