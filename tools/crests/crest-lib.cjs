"use strict";
// PRO-LIFE 04E5 - funcoes puras do instalador de escudos (testaveis offline).
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const STOP = new Set(["fc", "cf", "sc", "ac", "as", "cd", "ud", "sd", "rc", "de", "da", "do", "dos", "das", "club", "clube", "futebol", "football", "calcio", "the", "afc", "ssc", "us", "sv", "fk", "sk", "if", "bk", "og"]);
const tokens = (name) => norm(name).split(" ").filter((t) => t && !STOP.has(t));
// Titulos de arquivo que nao sao o escudo atual (historico, uniforme, estadio, bandeira...).
const BAD_TITLE = /(\bold\b|histor|\bkit\b|jersey|shirt|stadium|estadio|stadion|flag|map\b|banner|supporters|torcida|\b(18|19)\d{2}\b|\b20[01]\d\b|wordmark|\bsponsor|\bfemin|\bwomen|\bu-?\d{2}\b|\breserve|\bsecond team|\bb team)/i;
const GOOD_LICENSE = /^(public domain|pd[- ]|pd$|cc0|cc[- ]by(?![- ]nc)(?![- ]nd))/i;
function licenseOk(meta) {
  if (!meta) return { ok: false, reason: "sem metadados" };
  const v = (k) => (meta[k] && meta[k].value != null ? String(meta[k].value) : "");
  const lic = v("LicenseShortName");
  if (!lic) return { ok: false, reason: "licenca nao informada" };
  if (/^true$/i.test(v("NonFree")) || /fair use|non-?free/i.test(lic)) return { ok: false, reason: "uso nao livre (" + lic + ")" };
  if (/\bNC\b|\bND\b|-nc|-nd/i.test(lic)) return { ok: false, reason: "licenca restritiva (" + lic + ")" };
  if (!GOOD_LICENSE.test(lic)) return { ok: false, reason: "licenca nao reconhecida (" + lic + ")" };
  return { ok: true, license: lic, licenseUrl: v("LicenseUrl") || null, author: v("Artist").replace(/<[^>]+>/g, "").trim().slice(0, 160) || null };
}
function titleMatches(clubName, title, aliases = []) {
  const t = norm(String(title).replace(/^File:/i, "").replace(/\.[a-z0-9]+$/i, ""));
  const want = [clubName, ...aliases].map(tokens).filter((x) => x.length);
  return want.some((tk) => tk.every((w) => t.split(" ").includes(w)));
}
// 04E: o titulo precisa ser SO nome do clube + palavra de escudo (rejeita "Remo Real Betis", "Museo ... Cagliari logo", "Frosinone Inside", "... stylized"...).
const CREST_WORDS = new Set(["logo", "logotipo", "crest", "escudo", "badge", "emblem", "wappen", "blason", "ecusson", "stemma", "brasao", "shield"]);
const FILLER = new Set(["de", "of", "the", "la", "el", "le", "do", "da", "svg", "png", "official", "oficial", "new", "novo", "atual", "current", "fc", "cf", "sc", "ac", "club", "football", "futbol"]);
function titleIsPlainCrest(clubName, title, aliases = []) {
  const t = norm(String(title).replace(/^File:/i, "").replace(/\.[a-z0-9]+$/i, "")).split(" ").filter(Boolean);
  if (!t.some((w) => CREST_WORDS.has(w))) return false;
  const names = [clubName, ...aliases].map(tokens).filter((x) => x.length);
  return names.some((nm) => t.filter((w) => !nm.includes(w) && !CREST_WORDS.has(w) && !FILLER.has(w) && !/^20[2-9]\d$/.test(w)).length === 0);
}
function score(clubName, title, mime) {
  let s = 0; const t = norm(title);
  if (/svg/.test(mime)) s += 3; else if (/png/.test(mime)) s += 1;
  if (/\b(logo|crest|escudo|badge|emblem|wappen|blason|logotipo)\b/.test(t)) s += 2;
  const ct = tokens(clubName).length, tt = t.split(" ").length;
  s -= Math.max(0, tt - ct - 4) * 0.2;
  return s;
}
// Escolhe um candidato unico e inequivoco; empate em pontuacao com arquivos diferentes = ambiguo (fica pendente).
// Nomes com homonimos conhecidos: nunca instalar automaticamente; exigem conferencia manual (club.confirmedSource).
const HOMONYMS = new Set(["botafogo", "corinthians", "londrina", "nautico", "ponte preta", "sao bernardo", "estrela da amadora", "america", "atletico", "athletic", "central", "sport", "uniao", "juventude", "real", "dynamo", "dinamo", "spartak", "olympic", "racing", "independiente", "nacional", "united", "city", "sporting"]);
function pickCandidate(club, pages) {
  if (HOMONYMS.has(norm(club.name)) && !club.confirmedSource) return { status: "review", reason: "nome com homonimos conhecidos (" + club.name + "): conferir manualmente o clube correto", rejected: [] };
  const ok = []; const rejected = [];
  for (const p of pages || []) {
    const ii = (p.imageinfo || [])[0]; if (!ii) continue;
    const mime = ii.mime || "";
    if (!/^image\/(svg\+xml|png|webp)$/.test(mime)) { rejected.push([p.title, "formato"]); continue; }
    if (BAD_TITLE.test(p.title)) { rejected.push([p.title, "titulo historico/nao escudo"]); continue; }
    if (!titleMatches(club.name, p.title, club.aliases || [])) { rejected.push([p.title, "nome nao confere"]); continue; }
    if (!titleIsPlainCrest(club.name, p.title, club.aliases || [])) { rejected.push([p.title, "titulo nao e apenas o escudo do clube"]); continue; }
    const lic = licenseOk(ii.extmetadata); if (!lic.ok) { rejected.push([p.title, lic.reason]); continue; }
    ok.push({ page: p, ii, lic, score: score(club.name, p.title, mime) });
  }
  ok.sort((a, b) => b.score - a.score);
  if (!ok.length) return { status: "pending", reason: rejected.length ? "sem candidato livre: " + rejected.slice(0, 3).map((r) => r.join(" -> ")).join("; ") : "nenhum resultado", rejected };
  if (ok.length > 1 && ok[0].score - ok[1].score < 1) return { status: "ambiguous", reason: "candidatos empatados: " + ok.slice(0, 3).map((c) => c.page.title).join(" | "), rejected };
  return { status: "ok", pick: ok[0], rejected };
}
function svgIsSafe(text) {
  if (typeof text !== "string" || text.length > 200000) return false;
  if (!/<svg[\s>]/i.test(text)) return false;
  if (/<script|<foreignObject|<iframe|<object|<embed|<!ENTITY|<!DOCTYPE[^>]*\[|javascript:|\son[a-z]+\s*=/i.test(text)) return false;
  if (/<image[\s>]/i.test(text) && /href\s*=\s*["'](?!data:image\/(png|jpeg|webp);base64)/i.test(text)) return false;
  if (/(xlink:)?href\s*=\s*["'](?!#)/i.test(text.replace(/<image[\s\S]*?>/gi, ""))) return false;
  if (/url\(\s*["']?(?:https?:|\/\/)/i.test(text) || /@import/i.test(text)) return false;
  return true;
}
function bufferKind(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.slice(1, 4).toString() === "PNG") return "png";
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "webp";
  const head = buf.slice(0, 400).toString("utf8").trimStart();
  if (/^(<\?xml|<svg|<!--|<!DOCTYPE svg)/i.test(head)) return "svg";
  return null;
}
module.exports = { titleIsPlainCrest, norm, tokens, licenseOk, titleMatches, pickCandidate, svgIsSafe, bufferKind, BAD_TITLE };
