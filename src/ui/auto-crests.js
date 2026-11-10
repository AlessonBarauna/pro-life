/* PRO-LIFE: logos automáticos. Coloca o escudo/logo ao lado de qualquer nome de clube, seleção ou competição
   que apareça como texto na interface (sem precisar editar cada tela). Telas que já mostram o logo não são duplicadas. */
(function (root) {
  "use strict";
  // Dobra cada caractere para minúscula sem acento mantendo o mesmo comprimento (índices servem ao texto original).
  const fold = (s) => {
    let out = "";
    for (const ch of String(s == null ? "" : s)) {
      const d = ch.normalize("NFD")[0] || ch;
      out += d.toLowerCase();
    }
    return out;
  };
  const isWord = (c) => !!c && /[\p{L}\p{N}]/u.test(c);
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Competições: nome exibido -> id no registro de logos (só entram as que têm arquivo de imagem).
  const COMP_ALIASES = {
    ucl: ["UEFA Champions League", "Champions League", "Liga dos Campeões"],
    uel: ["UEFA Europa League", "Europa League", "Liga Europa"],
    uecl: ["UEFA Conference League", "Conference League"],
    lib: ["Copa Libertadores", "CONMEBOL Libertadores", "Libertadores"],
    sud: ["Copa Sul-Americana", "CONMEBOL Sudamericana", "Sul-Americana"],
    mundial: ["Copa do Mundo", "Mundial de Seleções"],
    serieA: ["Brasileirão Série A", "Campeonato Brasileiro Série A"],
    serieB: ["Brasileirão Série B", "Campeonato Brasileiro Série B"],
    serieC: ["Brasileirão Série C"],
    serieD: ["Brasileirão Série D"],
    gf_fc27_1a_pro_league: ["1A Pro League"],
    gf_fc27_3_liga: ["3. Liga"],
    gf_fc27_allsvenskan: ["Allsvenskan"],
    gf_fc27_brack_super_league: ["Brack Super League"],
    gf_fc27_bundesliga: ["Bundesliga"],
    gf_fc27_bundesliga_2: ["Bundesliga 2"],
    gf_fc27_ceska_liga: ["Česká Liga"],
    gf_fc27_efl_championship: ["EFL Championship"],
    gf_fc27_efl_league_one: ["EFL League One"],
    gf_fc27_efl_league_two: ["EFL League Two"],
    gf_fc27_ekstraklasa: ["Ekstraklasa"],
    gf_fc27_eliteserien: ["Eliteserien"],
    gf_fc27_eredivisie: ["Eredivisie"],
    gf_fc27_finnliiga: ["Finnliiga"],
    gf_fc27_hellas_liga: ["Hellas Liga"],
    gf_fc27_isuzu_ute_a_league: ["Isuzu UTE A League", "A-League"],
    gf_fc27_k_league_1: ["K League 1"],
    gf_fc27_laliga_ea_sports: ["LALIGA EA SPORTS", "La Liga"],
    gf_fc27_laliga_hypermotion: ["LALIGA HYPERMOTION"],
    gf_fc27_liga_bbva_mx: ["Liga BBVA MX"],
    gf_fc27_liga_portugal: ["Liga Portugal"],
    gf_fc27_ligue_1_mcdonald_s: ["Ligue 1 McDonald's", "Ligue 1"],
    gf_fc27_ligue_2_bkt: ["Ligue 2 BKT", "Ligue 2"],
    gf_fc27_magyar_liga: ["Magyar Liga"],
    gf_fc27_metropolitan_division: ["Metropolitan Division"],
    gf_fc27_mls: ["MLS"],
    gf_fc27_o_bundesliga: ["Ö. Bundesliga"],
    gf_fc27_premier_league: ["Premier League"],
    gf_fc27_roshn_saudi_league: ["ROSHN Saudi League"],
    gf_fc27_scottish_premiership: ["Scottish Premiership"],
    gf_fc27_serie_a_enilive: ["Serie A Enilive", "Serie A"],
    gf_fc27_serie_bkt: ["Serie BKT", "Serie B"],
    gf_fc27_trendyol_super_lig: ["Trendyol Süper Lig", "Süper Lig"],
    gf_fc27_ukrayina_liha: ["Ukrayina Liha"]
  };

  // Índice: nome dobrado -> {type, id}. Clubes e competições primeiro; seleções por último (não sobrescrevem).
  function buildIndex(opts) {
    const clubs = (opts && opts.crestData) || [];
    const logos = (opts && opts.leagueLogos) || {};
    const nationals = (opts && opts.nationalNames) || [];
    const map = new Map();
    const put = (name, entry) => {
      const k = fold(name).trim();
      if (k.length < 3 || map.has(k)) return;
      map.set(k, entry);
    };
    Object.keys(COMP_ALIASES).forEach((id) => {
      if (!logos[id]) return;
      COMP_ALIASES[id].forEach((n) => put(n, { type: "comp", id, name: n }));
    });
    clubs.forEach((c) => {
      if (c && c.verified && c.asset && c.name) put(c.name, { type: "club", id: c.id, name: c.name });
    });
    nationals.forEach((pair) => {
      if (pair && pair[0] && pair[1]) put(pair[0], { type: "nat", id: pair[1], name: pair[0] });
    });
    const names = Array.from(map.keys()).sort((a, b) => b.length - a.length);
    const re = names.length ? new RegExp(names.map(escapeRe).join("|"), "g") : null;
    return { map, re };
  }

  // Acha ocorrências de nomes (palavra inteira) num texto; devolve [{start,end,entry}].
  function findMatches(index, text) {
    if (!index || !index.re || !text || text.length < 3) return [];
    const f = fold(text);
    const out = [];
    index.re.lastIndex = 0;
    let m;
    while ((m = index.re.exec(f))) {
      const start = m.index, end = start + m[0].length;
      if (isWord(f[start - 1]) || isWord(f[end])) {
        index.re.lastIndex = start + 1;
        continue;
      }
      out.push({ start, end, entry: index.map.get(m[0]) });
    }
    return out;
  }

  const api = { fold, buildIndex, findMatches, COMP_ALIASES };
  root.ProLifeAutoCrests = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;

  const doc = root.document;
  if (!doc) return;

  const SKIP = "script,style,textarea,input,select,option,svg,canvas,title,code,pre,noscript,[data-no-crest],.ac-wrap,[contenteditable='true']";
  const NATION_SKIP = /nationality|citizenship|birthplace|nacionalidade/i;
  let index = null;
  const made = new WeakSet();
  const NATIONAL_CLASS_SKIP = (el) => {
    for (let n = el, i = 0; n && i < 4; n = n.parentElement, i++) if (n.className && NATION_SKIP.test(String(n.className))) return true;
    return false;
  };

  function getIndex() {
    if (index) return index;
    index = buildIndex({
      crestData: Array.isArray(root.ProLifeCrestData) ? root.ProLifeCrestData : [],
      leagueLogos: root.ProLifeLeagueLogoData || {},
      nationalNames: root.ProLifeNationalCrests && root.ProLifeNationalCrests.names ? root.ProLifeNationalCrests.names() : []
    });
    return index;
  }

  const crestSel = "img.pl-club-crest,img.lg-logo,.pl-club-crest,svg.lg-badge";
  function altMatches(el, nameFold) {
    const imgs = el.matches && el.matches(crestSel) ? [el] : Array.from(el.querySelectorAll ? el.querySelectorAll(":scope > " + crestSel.split(",").join(",:scope > ")) : []);
    return imgs.some((i) => {
      const a = fold(i.getAttribute("alt") || i.getAttribute("aria-label") || "");
      return !a || a.indexOf(nameFold) >= 0;
    });
  }
  // Já existe um logo desse nome encostado no texto (irmão, ou dentro de até 3 níveis acima)?
  function crested(textNode, nameFold) {
    let node = textNode;
    for (let level = 0; node && level < 4; level++, node = node.parentNode) {
      const meaningful = (n, dir) => { while (n && n.nodeType === 3 && !/\S/.test(n.nodeValue)) n = dir < 0 ? n.previousSibling : n.nextSibling; return n; };
      for (const sib of [meaningful(node.previousSibling, -1), meaningful(node.nextSibling, 1)]) {
        if (sib && sib.nodeType === 1 && altMatches(sib, nameFold)) return true;
      }
      if (level === 1 && node.nodeType === 1) {
        const imgs = node.querySelectorAll("img.pl-club-crest,img.lg-logo");
        for (const i of imgs) {
          const a = fold(i.getAttribute("alt") || "");
          if (a && a.indexOf(nameFold) >= 0) return true;
        }
      }
    }
    return false;
  }

  function makeCrest(entry) {
    let html = "";
    try {
      if (entry.type === "club" && root.ProLifeClubCrests) html = root.ProLifeClubCrests.render(entry.id, { size: "sm" });
      else if (entry.type === "nat" && root.ProLifeNationalCrests) html = root.ProLifeNationalCrests.render(entry.id, { size: "sm" });
      else if (entry.type === "comp") {
        const f = (root.ProLifeLeagueLogoData || {})[entry.id];
        if (f) html = '<img class="lg-logo ac-comp" src="' + f + '" width="18" height="18" alt="' + String(entry.name).replace(/"/g, "") + '" loading="lazy">';
      }
    } catch (e) { html = ""; }
    if (!html) return null;
    const tpl = doc.createElement("template");
    tpl.innerHTML = html.trim();
    return tpl.content.firstElementChild;
  }

  function decorateText(node) {
    if (made.has(node)) return;
    const text = node.nodeValue;
    if (!text || text.length < 3 || !/\S/.test(text)) return;
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const ms = findMatches(getIndex(), text).filter((m) => !(m.entry.type === "nat" && NATIONAL_CLASS_SKIP(parent)));
    if (!ms.length) return;
    const frag = doc.createDocumentFragment();
    let pos = 0, changed = false;
    ms.forEach((m) => {
      if (m.start < pos) return;
      if (crested(node, fold(m.entry.name))) return;
      const crest = makeCrest(m.entry);
      if (!crest) return;
      if (m.start > pos) { const t = doc.createTextNode(text.slice(pos, m.start)); made.add(t); frag.appendChild(t); }
      const wrap = doc.createElement("span");
      wrap.className = "ac-wrap";
      wrap.appendChild(crest);
      const label = doc.createTextNode(text.slice(m.start, m.end));
      made.add(label);
      wrap.appendChild(label);
      frag.appendChild(wrap);
      pos = m.end;
      changed = true;
    });
    if (!changed) return;
    if (pos < text.length) { const t = doc.createTextNode(text.slice(pos)); made.add(t); frag.appendChild(t); }
    node.parentNode.replaceChild(frag, node);
  }

  function scan(rootNode) {
    if (!rootNode) return;
    if (rootNode.nodeType === 3) { decorateText(rootNode); return; }
    if (rootNode.nodeType !== 1 || (rootNode.closest && rootNode.closest(SKIP))) return;
    const walker = doc.createTreeWalker(rootNode, 4);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
    nodes.forEach(decorateText);
  }

  const pending = new Set();
  let scheduled = false, observer = null;
  function flush() {
    scheduled = false;
    if (observer) observer.disconnect();
    try {
      pending.forEach((n) => { if (n.isConnected) scan(n); });
    } finally {
      pending.clear();
      if (observer) observer.observe(doc.body, { childList: true, subtree: true, characterData: true });
    }
  }
  function queue(n) {
    pending.add(n);
    if (scheduled) return;
    scheduled = true;
    (root.requestAnimationFrame || ((f) => setTimeout(f, 30)))(flush);
  }
  function start() {
    if (!doc.body || observer || typeof MutationObserver === "undefined") return;
    observer = new MutationObserver((records) => {
      records.forEach((r) => {
        if (r.type === "characterData") queue(r.target);
        else r.addedNodes.forEach((n) => { if (n.nodeType === 1 || n.nodeType === 3) queue(n); });
      });
    });
    queue(doc.body);
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof globalThis !== "undefined" ? globalThis : this);
