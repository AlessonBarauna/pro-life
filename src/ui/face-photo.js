(function (root) {
  "use strict";
  // PRO LIFE — Foto do rosto (jogador e treinador). A foto é recortada em 256×256, vira JPEG e fica no save (s.person.photo).
  const doc = root.document;
  const MAX = 120000;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const valid = (v) => typeof v === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v) && v.length <= MAX;
  const person = () => root.ProLifeSM27Ctx?.()?.s?.person || null;

  function img(p, cls) {
    return p && valid(p.photo) ? `<img class="fp-img ${cls || ""}" src="${p.photo}" alt="Foto de ${esc(p.name || "você")}" width="256" height="256">` : "";
  }
  function stage(p) {
    return `<div class="avatar-stage fp-stage" data-mode="photo">${img(p, "fp-hero")}<span class="fp-ring"></span></div>`;
  }
  function card(p) {
    const has = valid(p?.photo);
    return `<section class="fp-card" aria-label="Foto do rosto"><div class="fp-preview">${has ? img(p) : '<span class="fp-empty" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="16" cy="12" r="6" fill="currentColor"/><path d="M4 30c0-8 5-12 12-12s12 4 12 12z" fill="currentColor"/></svg></span>'}</div><div class="fp-body"><b>Seu rosto no jogo</b><small>${has ? "Aparece no seu perfil e nos cards." : "Tire uma foto ou escolha da galeria. Fica só neste aparelho."}</small><div class="fp-actions"><label class="fp-btn primary">Tirar foto<input type="file" accept="image/*" capture="user" data-fp-input hidden></label><label class="fp-btn">Galeria<input type="file" accept="image/*" data-fp-input hidden></label>${has ? '<button type="button" class="fp-btn" data-fp-remove>Remover foto</button>' : ""}</div></div></section>`;
  }

  // ----- recorte -----
  let layer = null, im = null, S = { scale: 1, min: 1, x: 0, y: 0 };
  const SIZE = 240;
  function draw() {
    const cv = layer?.querySelector("canvas"); if (!cv || !im) return;
    const g = cv.getContext("2d"); g.fillStyle = "#0c1a26"; g.fillRect(0, 0, SIZE, SIZE);
    const w = im.width * S.scale, h = im.height * S.scale;
    S.x = Math.min(0, Math.max(SIZE - w, S.x)); S.y = Math.min(0, Math.max(SIZE - h, S.y));
    g.drawImage(im, S.x, S.y, w, h);
  }
  function openCrop(file) {
    if (!file || !doc) return;
    const url = URL.createObjectURL(file), el = new Image();
    el.onload = () => {
      URL.revokeObjectURL(url); close(); im = el;
      S.min = SIZE / Math.min(el.width, el.height); S.scale = S.min;
      S.x = (SIZE - el.width * S.scale) / 2; S.y = (SIZE - el.height * S.scale) / 2;
      layer = doc.createElement("div"); layer.className = "fp-layer";
      layer.innerHTML = `<div class="fp-modal" role="dialog" aria-modal="true" aria-label="Ajustar foto"><b>Ajuste o rosto no círculo</b><div class="fp-crop"><canvas width="${SIZE}" height="${SIZE}"></canvas><span class="fp-mask"></span></div><label class="fp-zoom">Zoom<input type="range" min="100" max="300" value="100" data-fp-zoom></label><div class="fp-actions"><button type="button" class="fp-btn" data-fp-cancel>Cancelar</button><button type="button" class="fp-btn primary" data-fp-save>Salvar foto</button></div></div>`;
      doc.body.appendChild(layer); draw();
    };
    el.onerror = () => { URL.revokeObjectURL(url); toast("Não consegui abrir essa imagem."); };
    el.src = url;
  }
  function close() { if (layer) { layer.remove(); layer = null; } im = null; }
  function toast(t) { const x = doc?.getElementById("toast"); if (x) { x.textContent = t; x.style.display = "block"; setTimeout(() => { x.style.display = ""; }, 2500); } }
  function save() {
    const out = doc.createElement("canvas"); out.width = out.height = 256;
    const g = out.getContext("2d"), k = 256 / SIZE;
    g.fillStyle = "#0c1a26"; g.fillRect(0, 0, 256, 256);
    g.drawImage(im, S.x * k, S.y * k, im.width * S.scale * k, im.height * S.scale * k);
    let q = 0.85, data = out.toDataURL("image/jpeg", q);
    while (data.length > MAX && q > 0.4) { q -= 0.1; data = out.toDataURL("image/jpeg", q); }
    close();
    root.ProLifeSM27Cmd?.("setPhoto", { photo: data });
  }

  if (doc) {
    let drag = null;
    doc.addEventListener("change", (ev) => {
      const t = ev.target;
      if (t?.matches?.("[data-fp-input]")) { const f = t.files?.[0]; t.value = ""; openCrop(f); return; }
    });
    doc.addEventListener("input", (ev) => {
      const t = ev.target;
      if (t?.matches?.("[data-fp-zoom]") && im) {
        const c = SIZE / 2, old = S.scale; S.scale = S.min * (Number(t.value) / 100);
        S.x = c - (c - S.x) * (S.scale / old); S.y = c - (c - S.y) * (S.scale / old); draw();
      }
    });
    doc.addEventListener("click", (ev) => {
      const t = ev.target instanceof Element ? ev.target : null; if (!t) return;
      if (t.closest("[data-fp-cancel]")) close();
      else if (t.closest("[data-fp-save]")) save();
      else if (t.closest("[data-fp-remove]")) root.ProLifeSM27Cmd?.("setPhoto", { photo: null });
    });
    doc.addEventListener("pointerdown", (ev) => { if (ev.target?.closest?.(".fp-crop") && im) { drag = { x: ev.clientX, y: ev.clientY, sx: S.x, sy: S.y }; ev.target.setPointerCapture?.(ev.pointerId); } });
    doc.addEventListener("pointermove", (ev) => { if (drag) { S.x = drag.sx + ev.clientX - drag.x; S.y = drag.sy + ev.clientY - drag.y; draw(); } });
    const end = () => { drag = null; };
    doc.addEventListener("pointerup", end); doc.addEventListener("pointercancel", end);
  }

  root.ProLifeFacePhoto = { valid, img, stage, card, MAX };
  if (typeof module !== "undefined" && module.exports) module.exports = root.ProLifeFacePhoto;
})(typeof window !== "undefined" ? window : globalThis);
