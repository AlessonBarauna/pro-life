(function (root) {
  "use strict";
  // PRO LIFE — som do jogo. Tudo gerado por código (WebAudio): funciona offline e sem arquivos.
  // Trilha ambiente em loop, tique nos botões, jingle de conquista e aviso de novas mensagens.
  const PREF_KEY = "prolife.v1.uiPrefs";
  const doc = root.document;
  let ctx = null, master = null, sfxBus = null, musicBus = null, started = false, timer = null;
  let nextBeat = 0, beat = 0;

  function prefs() { try { return JSON.parse(root.localStorage.getItem(PREF_KEY) || "{}") || {}; } catch (_) { return {}; } }
  const sfxOn = () => prefs().sfx !== false;
  const musicOn = () => prefs().music !== false;

  function ensure() {
    if (ctx) return ctx;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    } catch (_) { ctx = null; }
    return ctx;
  }

  function tone(freq, t, dur, opts) {
    const o = opts || {};
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
    const peak = o.gain == null ? 0.3 : o.gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = osc;
    if (o.lp) { const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; osc.connect(f); node = f; }
    node.connect(g); g.connect(o.bus || sfxBus);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  const SFX = {
    click() { const t = ctx.currentTime; tone(1200, t, 0.05, { type: "triangle", gain: 0.12, slide: 700 }); },
    nav() { const t = ctx.currentTime; tone(520, t, 0.07, { type: "sine", gain: 0.16 }); tone(780, t + 0.05, 0.09, { type: "sine", gain: 0.14 }); },
    message() { const t = ctx.currentTime; tone(midi(79), t, 0.22, { gain: 0.26 }); tone(midi(86), t + 0.13, 0.4, { gain: 0.24 }); },
    error() { const t = ctx.currentTime; tone(220, t, 0.16, { type: "square", gain: 0.1, lp: 900 }); tone(165, t + 0.12, 0.22, { type: "square", gain: 0.1, lp: 900 }); },
    success() { const t = ctx.currentTime; tone(midi(72), t, 0.12, { type: "triangle", gain: 0.2 }); tone(midi(79), t + 0.09, 0.22, { type: "triangle", gain: 0.2 }); },
    achievement() {
      const t = ctx.currentTime;
      [72, 76, 79, 84].forEach((n, i) => tone(midi(n), t + i * 0.1, 0.5, { type: "triangle", gain: 0.24, attack: 0.012 }));
      [91, 96].forEach((n, i) => tone(midi(n), t + 0.45 + i * 0.09, 0.7, { gain: 0.13 }));
    },
  };

  function play(name) {
    if (!sfxOn()) return;
    if (!ensure()) return;
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (_) {} }
    if (ctx.state !== "running" && !started) return;
    const fn = SFX[name];
    if (fn) { try { fn(); } catch (_) {} }
  }

  // ---- Trilha: pad suave + arpejo, 4 acordes em loop (Am - F - C - G), ~84 bpm ----
  const BPM = 84, STEP = 60 / BPM / 2; // colcheias
  const CHORDS = [
    { root: 45, notes: [57, 60, 64, 69] },
    { root: 41, notes: [57, 60, 65, 69] },
    { root: 48, notes: [55, 60, 64, 67] },
    { root: 43, notes: [55, 59, 62, 67] },
  ];
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3];

  function scheduleStep(t, i) {
    const bar = Math.floor(i / 8) % CHORDS.length, pos = i % 8, ch = CHORDS[bar];
    if (pos === 0) {
      ch.notes.slice(0, 3).forEach((n, k) => tone(midi(n - 12 + (k ? 0 : 0)), t, STEP * 8.2, { type: "sawtooth", gain: 0.035, attack: 0.9, lp: 700, bus: musicBus }));
      tone(midi(ch.root - 12), t, STEP * 4, { type: "sine", gain: 0.12, attack: 0.05, bus: musicBus });
    }
    if (pos === 4) tone(midi(ch.root - 12), t, STEP * 3, { type: "sine", gain: 0.08, attack: 0.05, bus: musicBus });
    const n = ch.notes[ARP[pos]] + 12;
    tone(midi(n), t, STEP * 1.8, { type: "triangle", gain: pos % 2 ? 0.05 : 0.08, attack: 0.01, lp: 2200, bus: musicBus });
  }

  function tick() {
    if (!ctx || ctx.state !== "running") return;
    while (nextBeat < ctx.currentTime + 0.4) { scheduleStep(nextBeat, beat); nextBeat += STEP; beat++; }
  }

  function startMusic() {
    if (!ctx || timer) return;
    nextBeat = ctx.currentTime + 0.1; beat = 0;
    timer = root.setInterval(tick, 120);
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0.6, ctx.currentTime, 1.2);
  }
  function stopMusic() {
    if (!ctx || !timer) return;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    root.clearInterval(timer); timer = null;
  }

  function refresh() {
    if (!ctx) return;
    const hidden = doc.visibilityState === "hidden";
    if (musicOn() && !hidden) { if (ctx.state === "suspended") { try { ctx.resume(); } catch (_) {} } startMusic(); }
    else stopMusic();
  }

  function unlock() {
    if (!ensure()) return;
    const go = () => { started = true; refresh(); };
    if (ctx.state === "suspended") { try { ctx.resume().then(go, go); } catch (_) { go(); } } else go();
  }

  // Primeiro toque libera o áudio (exigência do iOS/Safari); depois o tique dos botões.
  const GESTURES = ["pointerdown", "touchend", "keydown", "click"];
  function firstGesture() { unlock(); if (started) GESTURES.forEach((g) => doc.removeEventListener(g, firstGesture, true)); }
  GESTURES.forEach((g) => doc.addEventListener(g, firstGesture, true));

  doc.addEventListener("click", (ev) => {
    const t = ev.target;
    if (!(t instanceof Element)) return;
    const b = t.closest("button,[role=button],[role=tab],a[href],summary,[data-page],[data-action],label.chip");
    if (!b || b.disabled || b.getAttribute("aria-disabled") === "true") return;
    play(b.matches("[role=tab],[data-page],[data-phone-menu],.game-nav button") ? "nav" : "click");
  }, true);

  doc.addEventListener("visibilitychange", refresh);

  // Avisos (toasts) também ganham som, conforme o conteúdo.
  function watchToast() {
    const el = doc.getElementById("toast");
    if (!el) return false;
    let last = "";
    new root.MutationObserver(() => {
      if (el.style.display === "none") { last = ""; return; }
      const txt = el.textContent || "";
      if (!txt || txt === last) return;
      last = txt;
      if (/erro|n[ãa]o foi poss[íi]vel|falh|recus|cancelad/i.test(txt)) play("error");
      else if (/t[íi]tulo|campe|conquist|trof[ée]u|acesso|promovid/i.test(txt)) play("achievement");
      else if (/nova proposta|novas propostas|nova mensagem|novas mensagens/i.test(txt)) play("message");
      else if (/conclu[íi]d|aceit|salv|contrat|vendid|acordo fechado|importad/i.test(txt)) play("success");
    }).observe(el, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    return true;
  }
  if (!watchToast()) doc.addEventListener("DOMContentLoaded", watchToast);

  root.ProLifeSound = { play, refresh, unlock };
})(window);
