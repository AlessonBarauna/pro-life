(function (root) {
  "use strict";
  // PRO LIFE — som do jogo. Tudo gerado por código (WebAudio): funciona offline e sem arquivos.
  // Trilha de estádio (bateria, baixo e canto de torcida) em loop, tique nos botões, jingle de conquista e aviso de novas mensagens.
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
      musicBus = ctx.createGain(); musicBus.gain.value = 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.004; comp.release.value = 0.12;
      musicBus.connect(comp); comp.connect(master);
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

  // ---- Trilha: torcida e bateria de estádio, 126 bpm em Dó maior (C - G - Am - F), loop de 8 compassos ----
  const BPM = 126, STEP = 60 / BPM / 4; // semicolcheias
  const CHORDS = [
    { root: 36, triad: [60, 64, 67], hook: [67, 72, 76, 79] },  // C
    { root: 43, triad: [59, 62, 67], hook: [67, 71, 74, 79] },  // G
    { root: 45, triad: [57, 60, 64], hook: [69, 72, 76, 81] },  // Am
    { root: 41, triad: [57, 60, 65], hook: [65, 69, 72, 77] },  // F
  ];
  // Seção A: pergunta e resposta, estilo canto de arquibancada (índices do "hook"; -1 = pausa)
  const HOOK_A = [0, -1, -1, 0, -1, 1, -1, 2, -1, -1, 2, -1, 1, -1, 0, -1];
  const HOOK_B = [2, -1, 2, -1, 3, -1, 2, -1, 1, -1, 1, 2, -1, -1, 0, -1];
  const BASS = [0, -1, 0, 0, -1, 0, 12, -1, 0, -1, 0, 0, -1, 7, 0, -1]; // semitons sobre a fundamental
  let noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  function burst(t, dur, type, freq, gain) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noise(); f.type = type; f.frequency.value = freq; f.Q.value = 0.9;
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(musicBus);
    src.start(t); src.stop(t + dur + 0.02);
  }
  const kick = (t) => tone(150, t, 0.16, { type: "sine", gain: 0.55, slide: 42, attack: 0.002, bus: musicBus });
  const snare = (t) => { burst(t, 0.16, "bandpass", 1900, 0.32); tone(190, t, 0.1, { type: "triangle", gain: 0.2, attack: 0.002, bus: musicBus }); };
  const clap = (t) => { burst(t, 0.07, "bandpass", 1300, 0.26); burst(t + 0.018, 0.09, "bandpass", 1500, 0.2); };
  const hat = (t, open) => burst(t, open ? 0.13 : 0.035, "highpass", 7500, open ? 0.12 : 0.09);

  function scheduleStep(t, i) {
    const barIdx = Math.floor(i / 16), bar = barIdx % 8, pos = i % 16, ch = CHORDS[bar % 4];
    const lastBar = bar === 7;
    // bateria: bumbo nos tempos, caixa+palma no 2 e no 4, chimbal em colcheias, com virada no último compasso
    if (pos % 4 === 0 && !(lastBar && pos >= 12)) kick(t);
    if (pos === 4 || pos === 12) { if (!(lastBar && pos === 12)) { snare(t); clap(t); } }
    if (pos % 2 === 0) hat(t, pos % 8 === 6);
    if (lastBar && pos >= 12) snare(t); // virada de caixa antes de repetir o loop
    if (lastBar && pos === 15) { kick(t); }
    // baixo pulsante
    const bn = BASS[pos];
    if (bn >= 0) tone(midi(ch.root + bn), t, STEP * 1.7, { type: "sawtooth", gain: 0.2, attack: 0.006, lp: 420, bus: musicBus });
    // acordes em staccato nos contratempos
    if (pos === 3 || pos === 6 || pos === 10 || pos === 14) ch.triad.forEach((n) => tone(midi(n), t, STEP * 1.1, { type: "sawtooth", gain: 0.05, attack: 0.004, lp: 2600, bus: musicBus }));
    // melodia de torcida: segunda metade do loop troca de frase e sobe uma oitava no refrão
    const hook = bar >= 4 ? HOOK_B : HOOK_A, hi = hook[pos];
    if (hi >= 0) {
      const n = ch.hook[hi] + (bar >= 4 ? 12 : 0);
      tone(midi(n), t, STEP * 1.9, { type: "square", gain: 0.07, attack: 0.006, lp: 3200, bus: musicBus });
      tone(midi(n + 0.12), t, STEP * 1.9, { type: "triangle", gain: 0.05, attack: 0.006, bus: musicBus });
    }
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
    musicBus.gain.setTargetAtTime(0.8, ctx.currentTime, 0.8);
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
