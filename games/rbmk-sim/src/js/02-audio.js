/* ---------- Ses: efektler, ortam uğultusu, çubuk motoru, titreşim ---------- */
const AU = { c: null, m: null, humG: null, humF: null, motG: null, ok: false };
function audioInit() {
  if (AU.c) { if (AU.c.state === 'suspended') AU.c.resume(); return; }
  if (AU.c === false) return;
  try { AU.c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AU.c = false; return; }
  const c = AU.c;
  AU.m = c.createGain(); AU.m.gain.value = save.muted ? 0 : save.vol; AU.m.connect(c.destination);
  // ortam uğultusu: iki testere dişi + alçak geçiren filtre, güçle ses ve parlaklık artar
  AU.humF = c.createBiquadFilter(); AU.humF.type = 'lowpass'; AU.humF.frequency.value = 220; AU.humF.Q.value = 0.7;
  AU.humG = c.createGain(); AU.humG.gain.value = 0;
  const o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
  o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 50; o2.frequency.value = 100.7; g2.gain.value = 0.35;
  o1.connect(AU.humF); o2.connect(g2); g2.connect(AU.humF); AU.humF.connect(AU.humG); AU.humG.connect(AU.m); o1.start(); o2.start();
  // çubuk tahrik motoru
  const mo = c.createOscillator(), mf = c.createBiquadFilter(); mo.type = 'square'; mo.frequency.value = 118; mf.type = 'bandpass'; mf.frequency.value = 600; mf.Q.value = 2;
  AU.motG = c.createGain(); AU.motG.gain.value = 0; mo.connect(mf); mf.connect(AU.motG); AU.motG.connect(AU.m); mo.start();
  AU.ok = true;
}
function audioVol() { if (AU.ok) AU.m.gain.setTargetAtTime(save.muted ? 0 : save.vol, AU.c.currentTime, 0.04); }
function tone(f, d, type, v, slide, delay) {
  if (!AU.ok || save.muted) return;
  try {
    const c = AU.c, t0 = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t0 + d);
    g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(v || 0.05, t0 + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(AU.m); o.start(t0); o.stop(t0 + d + 0.02);
  } catch (e) {}
}
const SFX = {
  click() { tone(640, 0.045, 'triangle', 0.045); },
  toggle(on) { tone(on ? 780 : 520, 0.07, 'triangle', 0.06); tone(on ? 1040 : 390, 0.06, 'triangle', 0.04, null, 0.05); },
  open() { tone(520, 0.08, 'sine', 0.05); tone(780, 0.1, 'sine', 0.04, null, 0.06); },
  back() { tone(600, 0.09, 'sine', 0.05, 0.65); },
  start() { [392, 523, 659].forEach((f, i) => tone(f, 0.14, 'triangle', 0.06, null, i * 0.07)); },
  warn() { tone(880, 0.11, 'square', 0.045); tone(660, 0.13, 'square', 0.045, null, 0.13); },
  step() { [0, 0.11, 0.22].forEach(d => tone(990, 0.06, 'square', 0.045, null, d)); },
  trip() { tone(240, 1.0, 'sawtooth', 0.09, 0.35); tone(120, 1.2, 'square', 0.05, 0.5, 0.05); },
  reset() { tone(440, 0.1, 'triangle', 0.06); tone(660, 0.12, 'triangle', 0.06, null, 0.1); tone(880, 0.14, 'triangle', 0.05, null, 0.2); },
  lock() { tone(300, 0.14, 'square', 0.05); tone(240, 0.14, 'square', 0.04, null, 0.1); },
  star(i) { tone(660 + i * 200, 0.22, 'triangle', 0.08); tone(1320 + i * 400, 0.12, 'sine', 0.03, null, 0.04); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'triangle', 0.07, null, i * 0.1)); },
  fail() { [392, 311, 262].forEach((f, i) => tone(f, 0.28, 'sawtooth', 0.05, null, i * 0.16)); },
  tick(i) { tone(900 + i * 60, 0.03, 'square', 0.025); },
  buy() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'triangle', 0.07, null, i * 0.07)); tone(2093, 0.3, 'sine', 0.03, null, 0.38); },
  coin(i) { tone(1180 + (i % 5) * 90, 0.07, 'square', 0.03); tone(1760 + (i % 5) * 120, 0.09, 'sine', 0.025, null, 0.04); },
  boom() { tone(80, 1.6, 'sawtooth', 0.12, 0.3); tone(55, 2, 'square', 0.08, 0.5, 0.1); }
};
function audioUpdate(playingNow) {
  if (!AU.ok) return;
  const now = AU.c.currentTime; let hg = 0, hf = 180, mg = 0;
  if (playingNow && S && save.amb && !save.muted && !S.destroyed) {
    const k = clamp(Math.log10(Math.max(1, S.n * TY.Pn)) / 3.6, 0, 1.25);
    hg = 0.01 + 0.028 * k; hf = 150 + 560 * k;
  }
  if (playingNow && S && !save.muted && S._pp !== undefined && Math.abs(S.p - S._pp) > 1e-5) mg = 0.018;
  if (S) S._pp = S.p;
  AU.humG.gain.setTargetAtTime(hg, now, 0.35); AU.humF.frequency.setTargetAtTime(hf, now, 0.35); AU.motG.gain.setTargetAtTime(mg, now, 0.04);
}
function buzz(p) { if (!save.hap) return; try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
