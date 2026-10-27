const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const read=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
test("ajuste de tela: script registrado, mínimo de 60% e rolagem de reserva fora do shell",()=>{
  const js=read("src/ui/viewport-fit.js");
  assert.match(js,/MIN=\.6/);assert.match(js,/\.game-stage/);
  assert.match(read("index.html"),/src\/ui\/viewport-fit\.js/);assert.match(read("tools/assets.cjs"),/src\/ui\/viewport-fit\.js/);
  assert.match(read("src/ui/fc27-game-shell-desktop.css"),/#app:not\(:has\(\.game-shell\)\)\s*\{\s*overflow-y:auto/);
});
