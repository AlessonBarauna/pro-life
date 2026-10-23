#!/usr/bin/env node
"use strict";
/* PRO-LIFE: baixa logos de liga de https://football-logos.cc (rode no seu PC, com internet).
   Licenca do site: uso informativo/de fas, sem fins comerciais; logos sao marcas dos donos (ver /license/). Nao use em produto comercial.
   - Padrao = simulacao: so lista o que casou com cada liga do jogo (nada e baixado). Use --apply para baixar e gravar.
   - Casa por nome (pais + liga). O que nao casar fica na lista "sem correspondencia": ponha o arquivo na mao e use import-league-logos.cjs.
   - 1 requisicao por segundo; so aceita PNG/WEBP/SVG validos (SVG passa por checagem de seguranca).
   Uso: node tools/crests/install-league-logos.cjs [--apply] [--only gf_fc27_bundesliga] */
const fs = require("fs"), path = require("path"), cp = require("child_process"), L = require("./crest-lib.cjs");
const BASE = "https://football-logos.cc", UA = "PRO-LIFE-league-logo-installer/1.0 (offline football career game; local dev tool)";
const APPLY = process.argv.includes("--apply"), oi = process.argv.indexOf("--only"), ONLY = oi >= 0 ? process.argv[oi + 1] : null;
const index = JSON.parse(fs.readFileSync(path.join(__dirname, "league-index.json"), "utf8")).filter((l) => !ONLY || l.id === ONLY);
const CACHE = path.join(__dirname, ".cache", "league-logos");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); let last = 0;
async function get(url, bin) {
  const wait = Math.max(0, 1000 - (Date.now() - last)); if (wait) await sleep(wait); last = Date.now();
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: bin ? "*/*" : "text/html" } });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + url);
  return bin ? Buffer.from(await res.arrayBuffer()) : res.text();
}
// Pais em portugues (catalogo do jogo) -> slug do site.
const COUNTRY = { "Alemanha": "germany", "Inglaterra": "england", "Espanha": "spain", "Itália": "italy", "França": "france", "Portugal": "portugal", "Brasil": "brazil", "Argentina": "argentina", "Países Baixos": "netherlands", "Bélgica": "belgium", "Turquia": "turkey", "Escócia": "scotland", "Suíça": "switzerland", "Áustria": "austria", "Dinamarca": "denmark", "Suécia": "sweden", "Noruega": "norway", "Polônia": "poland", "Romênia": "romania", "Grécia": "greece", "Chipre": "cyprus", "Croácia": "croatia", "Hungria": "hungary", "Tchéquia": "czech-republic", "Ucrânia": "ukraine", "Finlândia": "finland", "Azerbaijão": "azerbaijan", "Bulgaria": "bulgaria", "Bulgária": "bulgaria", "Republic of Ireland": "ireland", "Estados Unidos": "united-states", "México": "mexico", "Colômbia": "colombia", "Chile": "chile", "Uruguai": "uruguay", "Paraguai": "paraguay", "Equador": "ecuador", "Peru": "peru", "Arábia Saudita": "saudi-arabia", "Emirados Árabes Unidos": "united-arab-emirates", "Coreia do Sul": "south-korea", "China": "china", "Índia": "india", "Japão": "japan", "Tailândia": "thailand", "Thailand": "thailand", "Austrália": "australia", "Australia": "australia", "Nova Zelândia": "new-zealand", "África do Sul": "south-africa", "Egito": "egypt", "Marrocos": "morocco", "Canadá": "canada", "Catar": "qatar" };
const slug = (s) => L.norm(s).replace(/ /g, "-");
// Caminho exato de cada liga no site (primeiro que existir vence). Ligas fora do site ficam sem correspondencia.
const MAP = {
  gf_fc27_1a_pro_league: ["belgium/jupiler-pro-league", "belgium/belgian-pro-league"], gf_fc27_3_liga: ["germany/3-liga"], gf_fc27_allsvenskan: ["sweden/allsvenskan"],
  gf_fc27_brack_super_league: ["switzerland/swiss-football-league"], gf_fc27_bundesliga: ["germany/bundesliga"], gf_fc27_bundesliga_2: ["germany/2-bundesliga"],
  gf_fc27_ceska_liga: ["czech-republic/chance-liga"], gf_fc27_conmebol_libertadores: ["tournaments/conmebol-libertadores"], gf_fc27_conmebol_sudamericana: ["tournaments/conmebol-copa-sudamericana"],
  gf_fc27_csl: ["china/chinese-super-league"], gf_fc27_efl_championship: ["england/efl-championship"], gf_fc27_efl_league_one: ["england/efl-league-one"], gf_fc27_efl_league_two: ["england/efl-league-two"],
  gf_fc27_ekstraklasa: ["poland/ekstraklasa"], gf_fc27_eliteserien: ["norway/eliteserien"], gf_fc27_eredivisie: ["netherlands/eredivisie"], gf_fc27_finnliiga: ["finland/veikkausliiga"],
  gf_fc27_hellas_liga: ["greece/super-league-greece", "greece/super-league-1", "greece/super-league"], gf_fc27_isuzu_ute_a_league: ["australia/a-league"], gf_fc27_k_league_1: ["south-korea/k-league-1"],
  gf_fc27_laliga_ea_sports: ["spain/la-liga"], gf_fc27_laliga_hypermotion: ["spain/la-liga-2"], gf_fc27_liga_bbva_mx: ["mexico/liga-mx"], gf_fc27_liga_portugal: ["portugal/primeira-liga"],
  gf_fc27_ligue_1_mcdonald_s: ["france/ligue-1"], gf_fc27_ligue_2_bkt: ["france/ligue-2"], gf_fc27_lpf: ["argentina/argentina-primera-division"], gf_fc27_magyar_liga: ["hungary/nemzeti-bajnoksag"],
  gf_fc27_metropolitan_division: ["denmark/danish-super-liga"], gf_fc27_mls: ["usa/mls"], gf_fc27_o_bundesliga: ["austria/austrian-football-bundesliga"], gf_fc27_premier_league: ["england/english-premier-league"],
  gf_fc27_roshn_saudi_league: ["saudi-arabia/saudi-professional-league"], gf_fc27_scottish_premiership: ["scotland/scottish-premiership"], gf_fc27_serie_a_enilive: ["italy/serie-a"], gf_fc27_serie_bkt: ["italy/serie-b"],
  gf_fc27_superliga: ["romania/superliga"], gf_fc27_trendyol_super_lig: ["turkey/super-lig"], gf_fc27_ukrayina_liha: ["ukraine/ukrainian-premier-league"],
  ucl: ["tournaments/uefa-champions-league"], uel: ["tournaments/uefa-europa-league"], uecl: ["tournaments/uefa-conference-league"], lib: ["tournaments/conmebol-libertadores"], sud: ["tournaments/conmebol-copa-sudamericana"], mundial: ["tournaments/fifa-club-world-cup"],
  copaBrasil: ["brazil/copa-do-brasil"], fa_cup: ["england/fa-cup", "england/emirates-fa-cup", "england/english-fa-cup"], efl_cup: ["england/efl-cup", "england/carabao-cup", "england/english-efl-cup"], community_shield: ["england/community-shield", "england/fa-community-shield"],
  serieA: ["brazil/brazilian-serie-a"], serieB: ["brazil/brazilian-serie-b"], serieC: ["brazil/brazilian-serie-c"], serieD: ["brazil/brazilian-serie-d"]
};
async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const found = [], missing = [];
  for (const lg of index) {
    const cands = MAP[lg.id]; if (!cands) { missing.push(`${lg.name} (${lg.country}): a liga nao existe no site`); continue; }
    let hit = null;
    for (const c of cands) { try { const html = await get(`${BASE}/${c}/`); hit = { path: "/" + c + "/", html }; break; } catch (e) { /* tenta o proximo */ } }
    if (!hit) { missing.push(`${lg.name} (${lg.country}): pagina nao encontrada (${cands.join(", ")})`); continue; }
    found.push({ lg, page: hit.path, html: hit.html });
  }
  console.log(`Casadas: ${found.length} · sem correspondencia: ${missing.length} · modo: ${APPLY ? "APLICAR" : "simulacao (use --apply)"}`);
  for (const f of found) console.log("  " + f.lg.name + " -> " + BASE + f.page + (/assets\.football-logos\.cc\/logos\//.test(f.html) ? "" : "  (sem URL de imagem no HTML)"));
  if (!APPLY) { missing.forEach((m) => console.log("  sem correspondencia: " + m)); return; }
  let ok = 0;
  for (const f of found) {
    try {
      const html = f.html, s = f.page.split("/")[2];
      // URLs de imagem da propria liga (slug no nome do arquivo); prefere SVG, depois o maior PNG.
      const urls = [...new Set([...html.matchAll(/https:\/\/assets\.football-logos\.cc\/logos\/[^"'\s)<>]+/g)].map((m) => m[0]))].filter((u) => new RegExp("/" + s.replace(/-/g, "[-_]") + "\\.", "i").test(u));
      const size = (u) => { const m = /\/(\d+)x\1\//.exec(u); return m ? Number(m[1]) : 0; };
      urls.sort((a, b) => (/\.svg/.test(b) - /\.svg/.test(a)) || size(b) - size(a));
      if (!urls.length) { missing.push(f.lg.name + " (pagina sem URL de logo reconhecida)"); continue; }
      const buf = await get(urls[0], true), kind = L.bufferKind(buf);
      if (!kind || buf.length > 600000) { missing.push(f.lg.name + " (arquivo invalido)"); continue; }
      if (kind === "svg" && !L.svgIsSafe(buf.toString("utf8"))) { missing.push(f.lg.name + " (svg inseguro)"); continue; }
      fs.writeFileSync(path.join(CACHE, f.lg.id + "." + kind), buf); ok++; console.log("+ " + f.lg.name + " <- " + urls[0]);
    } catch (e) { missing.push(f.lg.name + " (" + e.message + ")"); }
  }
  console.log(`Baixadas: ${ok}. Gravando no jogo...`);
  cp.spawnSync(process.execPath, [path.join(__dirname, "import-league-logos.cjs"), CACHE, "--apply"], { stdio: "inherit" });
  if (missing.length) { console.log("Sem correspondencia / falhas (ponha o arquivo na mao e use import-league-logos.cjs):"); missing.forEach((m) => console.log("  " + m)); }
}
main().catch((e) => { console.error("Falha:", e.message); process.exit(1); });
