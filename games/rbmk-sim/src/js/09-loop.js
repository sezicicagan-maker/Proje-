/* ---------- Döngü: kare, alarm sesleri, boyutlandırma, dokunma, açılış ---------- */
let last = 0, acc = 0, lastBeep = 0, lastSync = 0, lastDraw = 0;
function alarms(now) {
  if (!S || S.destroyed || !playing) return;
  const P = TY.prot, per = period(), orm = M.ORM(S, S.p), gap = S.az ? 1100 : 750;
  if (now - lastBeep < gap) return;
  if (S.az) { if (S.azT < 8) { lastBeep = now; tone(440, 0.12, 'square', 0.03); } }
  else if (per < P.alertPer && S.n > 1e-3) { lastBeep = now; tone(per < P.stepPer ? 1250 : 1050, 0.08, 'square', 0.04); }
  else if (orm < TY.minM) { lastBeep = now; tone(880, 0.1, 'square', 0.03); }
}
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
  if (playing && S && !ended) {
    acc += dt * speed * ts; let g = 0; while (acc >= DT && playing && !ended && g++ < 400) { tick(); acc -= DT; }
    if (msgT > 0) msgT -= dt;
    azHoldUpdate(); alarms(now);
    if (now - lastSync > 110) { lastSync = now; ctlSync(); }
  }
  audioUpdate(playing && !ended);
  if (ov.hidden || now - lastDraw > 500) { lastDraw = now; draw(now); }
  requestAnimationFrame(frame);
}
/* Boyutlandırma: geniş ekranda yatay yerleşim */
let rzq = 0;
function resize() {
  const w = window.innerWidth, h = window.innerHeight, wide = w >= 640 && w / h >= 1.2;
  if (wide !== WIDE) { WIDE = wide; E('app').classList.toggle('wide', WIDE); VIEW = 'core'; if (WIDE) E('ctl').insertBefore(E('top'), E('ctl').firstChild); else cw.appendChild(E('top')); }
  computeLayout(); if (S) draw(performance.now());
}
window.addEventListener('resize', () => { cancelAnimationFrame(rzq); rzq = requestAnimationFrame(resize); });
if (window.ResizeObserver) new ResizeObserver(() => { cancelAnimationFrame(rzq); rzq = requestAnimationFrame(resize); }).observe(cw);
/* Panel dokunma: ⓘ ipuçları ve çekirdek/santral görünümü */
cv.addEventListener('pointerdown', e => {
  if (!S) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
  for (let i = REG.length - 1; i >= 0; i--) { const g = REG[i]; if (x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1) { audioInit(); if (g.key === 'view') { VIEW = VIEW === 'core' ? 'plant' : 'core'; SFX.click(); } else showTip(g.key); return; } }
});
cv.addEventListener('pointermove', e => {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
  cv.style.cursor = REG.some(g => x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1) ? 'pointer' : '';
});
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pauseMenu(); });
try { matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', applyPrefs); } catch (e) {}
/* Açılış */
loadSave(); setLang(pickLang(), false); applyPrefs(); resize(); mainMenu('up'); requestAnimationFrame(frame);
if (window.__RB_TEST__) window.__rb = {
  M, T, LANGS, QA, MISSING, get REG() { return REG; }, initScenario, tick, finish, trip, doReset, canReset, setBypass, setProt, setLimit, setAuto, setLang, relabel, mainMenu, reactorMenu, briefing, settingsScreen, langPicker, helpScreen, pauseMenu, showTip, closeTip, go, draw, resize, computeLayout,
  get S() { return S; }, get TY() { return TY; }, get save() { return save; }, get scen() { return scen; }, get scenT() { return scenT; }, get flags() { return flags; }, get score() { return score; }, get EVENTS() { return EVENTS; }, get HIST() { return HIST; },
  get playing() { return playing; }, set playing(v) { playing = v; }, get ended() { return ended; }, get ts() { return ts; }, get LANG() { return LANG; }, get WIDE() { return WIDE; }, get LAYOUT() { return LAYOUT; }, get VIEW() { return VIEW; }, set VIEW(v) { VIEW = v; }, get PLANT_ERR() { return PLANT_ERR; }
};
