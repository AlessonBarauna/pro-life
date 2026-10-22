"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const ROOT = path.join(__dirname, "..");
require(path.join(ROOT, "src/ui/club-crests-data.js"));
const C = require(path.join(ROOT, "src/ui/club-crests.js"));
const L = require(path.join(ROOT, "tools/crests/crest-lib.cjs"));
const list = global.ProLifeCrestData;
const meta = (lic, extra = {}) => ({ LicenseShortName: { value: lic }, Artist: { value: "<a>Fulano</a>" }, NonFree: { value: extra.nonfree ? "true" : "" }, LicenseUrl: { value: "https://x" } });
const page = (title, lic, mime = "image/svg+xml", extra) => ({ title, imageinfo: [{ mime, url: "https://u/" + title, extmetadata: meta(lic, extra) }] });

test("04E5 catalogo: 750 ids unicos, ativos verificados existem, formato valido e sem arquivo compartilhado por clubes diferentes sem registro", () => {
  assert.equal(list.length, 750); assert.equal(new Set(list.map((x) => x.id)).size, 750);
  const files = new Map();
  for (const c of list.filter((x) => x.asset)) {
    assert.match(c.asset, /^src\/assets\/club-crests\/[a-zA-Z0-9_-]+\.(png|svg|webp)$/, c.id);
    const full = path.join(ROOT, c.asset); assert.ok(fs.existsSync(full), "arquivo existe: " + c.asset);
    const kind = L.bufferKind(fs.readFileSync(full)); assert.ok(kind, "formato de imagem valido: " + c.asset);
    if (kind === "svg") assert.ok(L.svgIsSafe(fs.readFileSync(full, "utf8")), "svg seguro: " + c.asset);
    files.set(c.asset, (files.get(c.asset) || []).concat(c.id));
  }
  for (const [file, ids] of files) assert.ok(ids.length === 1 || ids.every((i) => !!manifest()[i]), "arquivo repetido sem registro de reuso: " + file);
  const st = C.stats(); assert.equal(st.verified + st.pending, 750);
});
function manifest() { const p = path.join(ROOT, "src/assets/club-crests/manifest.json"); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {}; }
test("04E5 manifesto (quando existe): cada escudo instalado pelo instalador tem fonte, licenca livre e aviso de marca", () => {
  for (const [id, m] of Object.entries(manifest())) {
    assert.ok(list.some((c) => c.id === id), "id do catalogo: " + id); assert.ok(m.sourceUrl && /^https:\/\//.test(m.sourceUrl), id); assert.ok(m.license, id); assert.ok(m.trademarkNotice, id);
    assert.ok(L.licenseOk({ LicenseShortName: { value: m.license } }).ok, "licenca livre: " + id + " " + m.license);
  }
});
test("04E5 licencas: livre aceita; nao livre, restritiva e ausente recusadas", () => {
  assert.equal(L.licenseOk(meta("Public domain")).ok, true); assert.equal(L.licenseOk(meta("PD-textlogo")).ok, true);
  assert.equal(L.licenseOk(meta("CC BY-SA 4.0")).ok, true); assert.equal(L.licenseOk(meta("CC0")).ok, true);
  assert.equal(L.licenseOk(meta("CC BY-NC 4.0")).ok, false); assert.equal(L.licenseOk(meta("CC BY-ND 3.0")).ok, false);
  assert.equal(L.licenseOk(meta("Fair use")).ok, false); assert.equal(L.licenseOk(meta("Public domain", { nonfree: true })).ok, false);
  assert.equal(L.licenseOk({}).ok, false); assert.equal(L.licenseOk(null).ok, false);
});
test("04E5 identidade: homonimos e arquivos historicos nao sao aceitos; ambiguo fica pendente", () => {
  const botRJ = { name: "Botafogo" };
  assert.equal(L.pickCandidate(botRJ, [page("File:Botafogo logo.svg", "Public domain")]).status, "review", "Botafogo-RJ/SP/PB: homonimo exige conferencia manual");
  assert.equal(L.pickCandidate({ name: "Ponte Preta" }, [page("File:Ponte Preta logo.svg", "Public domain")]).status, "review");
  assert.equal(L.pickCandidate({ name: "Flamengo" }, [page("File:Flamengo logo.svg", "Public domain")]).status, "ok");
  assert.equal(L.pickCandidate({ name: "Flamengo" }, [page("File:Flamengo logo 1912.svg", "Public domain")]).status, "pending");
  assert.equal(L.pickCandidate({ name: "Flamengo" }, [page("File:Flamengo logo.svg", "Fair use")]).status, "pending");
  assert.equal(L.pickCandidate({ name: "Flamengo" }, [page("File:Flamengo logo.png", "Public domain", "image/png"), page("File:Flamengo crest.png", "Public domain", "image/png")]).status, "ambiguous");
  assert.equal(L.pickCandidate({ name: "Flamengo" }, [page("File:Flamengo logo.svg", "Public domain"), page("File:Flamengo logo.png", "Public domain", "image/png")]).pick.page.title, "File:Flamengo logo.svg", "prefere SVG");
  assert.equal(L.pickCandidate({ name: "Flamengo" }, [page("File:Flamengo kit shirt.svg", "Public domain")]).status, "pending");
});
test("04E5 seguranca de arquivos: SVG com script/referencia externa recusado, PNG/SVG reconhecidos por assinatura", () => {
  assert.equal(L.svgIsSafe('<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>'), true);
  assert.equal(L.svgIsSafe('<svg><script>alert(1)</script></svg>'), false);
  assert.equal(L.svgIsSafe('<svg onload="x()"></svg>'), false);
  assert.equal(L.svgIsSafe('<svg><image href="https://evil/x.png"/></svg>'), false);
  assert.equal(L.svgIsSafe('<svg><a href="https://evil"/></svg>'), false);
  assert.equal(L.bufferKind(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0])), "png");
  assert.equal(L.bufferKind(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'></svg>")), "svg");
  assert.equal(L.bufferKind(Buffer.from("not an image at all!!")), null);
});
test("04E5 render: offline (sem URL externa), fallback para clube sem escudo e cada clube usa so o proprio arquivo", () => {
  const withAsset = list.find((c) => c.verified && c.asset), without = list.find((c) => !c.verified);
  if (withAsset) { const h = C.render(withAsset.id); assert.match(h, new RegExp(withAsset.asset.replace(/\./g, "\\."))); assert.doesNotMatch(h, /https?:\/\//); }
  assert.match(C.render(without.id), /pl-club-crest--fallback/); assert.doesNotMatch(C.render(without.id), /<img/);
  const seen = new Map(); for (const c of list.filter((x) => x.verified && x.asset)) { const h = C.render(c.id); assert.ok(h.includes(c.asset), c.id); seen.set(c.id, c.asset); }
});
test("04E5 tela: negociacao usa o componente de escudos e mantem fallback", () => {
  const src = fs.readFileSync(path.join(ROOT, "src/ui/app.js"), "utf8");
  assert.ok(/window\.ProLifeClubCrests\.render\(info\.id/.test(src)); assert.ok(/neg-crest--img/.test(src));
});

test("04E5 mosaico: escudos provisorios tem registro, arquivo PNG valido, id unico e cobertura variavel", () => {
  const p = path.join(ROOT, "src/assets/club-crests/manifest-mosaic.json");
  const mm = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
  const byFile = new Map();
  for (const [id, m] of Object.entries(mm)) {
    const c = list.find((x) => x.id === id); assert.ok(c, "id do catalogo: " + id);
    assert.equal(m.file, c.asset.split("/").pop(), "arquivo do registro = asset do catalogo: " + id);
    assert.equal(m.provisional, true, id); assert.ok(m.origin && m.licenseStatus, id);
    const buf = fs.readFileSync(path.join(ROOT, c.asset)); assert.equal(L.bufferKind(buf), "png", id);
    assert.equal(require("node:crypto").createHash("sha256").update(buf).digest("hex"), m.sha256, "hash: " + id);
    assert.ok(c.verified, id); byFile.set(m.file, (byFile.get(m.file) || 0) + 1);
  }
  for (const [f, n] of byFile) assert.equal(n, 1, "arquivo nao compartilhado entre clubes: " + f);
  assert.ok(Object.keys(mm).length >= 0);
});
test("04E5 render: clube com escudo verificado gera <img> local; sem escudo gera fallback; id invalido nao quebra", () => {
  const withAsset = list.find((x) => x.verified && x.asset);
  if (withAsset) assert.match(C.render(withAsset.id, { size: "sm" }), /^<img [^>]*src="src\/assets\/club-crests\/[\w-]+\.(png|svg|webp)"/);
  const without = list.find((x) => !x.asset); if (without) assert.match(C.render(without.id), /pl-club-crest--fallback/);
  assert.match(C.render("../x\"onerror=1"), /fallback/);
});
test("04E5 css: imagem de escudo nao e cortada em circulo", () => {
  const css = fs.readFileSync(path.join(ROOT, "src/ui/club-crests.css"), "utf8");
  assert.match(css, /\.pl-club-crest\{[^}]*border-radius:0/); assert.match(css, /\.pl-club-crest--fallback\{border-radius:50%/);
});

test("04E5 repositorios comunitarios: manifestos provisorios consistentes (arquivo, hash, id do catalogo, svg seguro, sem reuso)", () => {
  const dir = path.join(ROOT, "src/assets/club-crests"), seen = new Set();
  for (const mf of ["manifest-luukhopman.json", "manifest-hugomiura.json", "manifest-footballlogoscc.json"]) {
    const p = path.join(dir, mf); if (!fs.existsSync(p)) continue;
    for (const [id, m] of Object.entries(JSON.parse(fs.readFileSync(p, "utf8")))) {
      const c = list.find((x) => x.id === id); assert.ok(c, "id do catalogo: " + id); assert.ok(m.sourceRepo || m.sourceFile, id);
      assert.equal(m.provisional, true, id); assert.ok(!seen.has(id), "id em dois manifestos: " + id); seen.add(id);
      if (c.asset && c.asset.endsWith("/" + m.file)) {
        let buf = fs.readFileSync(path.join(dir, m.file)); if (/\.svg$/i.test(m.file)) buf = Buffer.from(buf.toString("latin1").replace(/\r\n/g, "\n"), "latin1"); /* checkout Windows (autocrlf) converte SVG para CRLF; o hash do manifesto e do conteudo em LF */ assert.equal(require("node:crypto").createHash("sha256").update(buf).digest("hex"), m.sha256, "hash " + id);
        if (L.bufferKind(buf) === "svg") assert.ok(L.svgIsSafe(buf.toString("utf8")), "svg seguro " + id);
      }
    }
  }
});
