/* ---------- Kontroller: kaydırıcılar, düğmeler, çipler, klavye ---------- */
const CT = {};
for (const k of ['S', 'R', 'F']) CT[k] = { row: E('row' + k), l: E('l' + k), v: E('v' + k), in: E('in' + k), s: E('s' + k) };
const scenDriven = () => !!(sdef && sdef.demand);
const isActive = inp => document.activeElement === inp && inp.matches(':active');
function setRange(inp, min, max, step) { inp.min = min; inp.max = max; inp.step = step; }
function setMark(c, f) { c.s.style.setProperty('--m', clamp(Number.isFinite(f) ? f : 0, 0, 1).toFixed(4)); }
const unitP = n => save.pct ? pc(n * 100, n * 100 < 10 ? 1 : 0) : fmtMW(n * TY.Pn) + ' MW';
let ARM = { lim: 0, prot: 0 };
function ctlConfig() {
  const pwr = TY.id === 'pwr';
  if (pwr) setRange(CT.S.in, 30, 100, 1); else setRange(CT.S.in, Math.round(0.02 * TY.Pn), Math.round(TY.Pn), Math.max(1, Math.round(TY.Pn / 320)));
  setRange(CT.R.in, 0, Math.round(TY.stroke * 100), 1);
  if (pwr) setRange(CT.F.in, 0, TY.bMax, 5); else setRange(CT.F.in, Math.round(TY.flowMin * 100), Math.round(TY.flowMax * 100), 1);
  ctlLabels(); ctlSync(true);
}
function ctlLabels() {
  if (!TY) return; const pwr = TY.id === 'pwr', trip = t(TY.id === 'rbmk' ? 'trip_rbmk' : 'trip_o');
  CT.S.l.textContent = pwr ? t('c_load') : t('c_set'); CT.R.l.textContent = t('c_rods_' + TY.id); CT.F.l.textContent = pwr ? t('c_boron') : t(TY.id === 'bwr' ? 'c_flow_bwr' : 'c_flow');
  for (const k of ['S', 'R', 'F']) CT[k].in.setAttribute('aria-label', CT[k].l.textContent);
  E('azt').textContent = trip; E('cvt').textContent = trip + ' ▲'; E('rstt').textContent = t('reset_trip'); E('bTest').textContent = t('test');
  E('bHelp').setAttribute('aria-label', t('how')); E('bSet').setAttribute('aria-label', t('set')); E('bMenu').setAttribute('aria-label', t('pause')); E('bPause').setAttribute('aria-label', t('pause'));
  E('kbHint').textContent = t('kb_hint'); cv.setAttribute('aria-label', t('hdr2'));
}
function ctlSync(force) {
  if (!S || !TY) return;
  const pwr = TY.id === 'pwr', act = TY.actuator, locked = S.az || S.jammed || S.destroyed || (scen === 'test' && scenT >= 60 && scenT < 100);
  // 1) hedef / yük
  const sOn = pwr ? (!scenDriven() && !S.az && !flags.turbOff) : (S.auto && !scenDriven() && !S.az);
  if (force || !isActive(CT.S.in)) CT.S.in.value = Math.round(pwr ? S.Dset * 100 : S.nSet * TY.Pn);
  CT.S.in.disabled = !sOn; CT.S.row.classList.toggle('dis', !sOn && !(S.auto || pwr));
  CT.S.v.textContent = pwr ? pc(Math.round(S.D * 100)) : (S.auto ? unitP(S.nSet) : t('auto_off'));
  setMark(CT.S, pwr ? (S.n * 100 - 30) / 70 : (S.n * TY.Pn - +CT.S.in.min) / (+CT.S.in.max - +CT.S.in.min));
  // 2) çubuklar
  const rodsAuto = S.auto && act === 'rods' && !S.az, rOn = !rodsAuto && !locked;
  if (force || !isActive(CT.R.in)) CT.R.in.value = Math.round((rodsAuto || S.az ? S.p : S.pTarget) * 100);
  CT.R.in.disabled = !rOn; CT.R.row.classList.toggle('dis', !rOn && !rodsAuto); CT.R.row.classList.toggle('hot', !!S.stepback);
  CT.R.v.textContent = rodsAuto || S.az || Math.abs(S.pTarget - S.p) < 0.01 ? `${nf(S.p, 2)} m` : `${nf(S.p, 2)} → ${nf(S.pTarget, 1)} m`; CT.R.row.classList.toggle('auto', rodsAuto);
  setMark(CT.R, S.p / TY.stroke);
  const ch = E('chLim'); ch.textContent = ARM.lim ? t('conf') : (S.interlock ? t('lim_on') : t('lim_off')); ch.classList.toggle('off', !S.interlock); ch.classList.toggle('arm', !!ARM.lim);
  // 3) debi / bor
  if (pwr) {
    if (force || !isActive(CT.F.in)) CT.F.in.value = Math.round(S.boronTarget); CT.F.in.disabled = !!S.az && false;
    CT.F.v.textContent = Math.abs(S.boronTarget - S.boron) < 1 ? `${nf(Math.round(S.boron))} ppm` : `${nf(Math.round(S.boron))} → ${nf(Math.round(S.boronTarget))} ppm`;
    setMark(CT.F, S.boron / TY.bMax); CT.F.row.classList.remove('dis');
  } else {
    const flowAuto = S.auto && act === 'flow' && !S.az, fOn = !flowAuto && !S.test && !S.az && !S.destroyed;
    if (force || !isActive(CT.F.in)) CT.F.in.value = Math.round(S.flowTarget * 100);
    CT.F.in.disabled = !fOn; CT.F.row.classList.toggle('dis', !fOn && !flowAuto);
    CT.F.v.textContent = pc(Math.round(S.flow * 100)); CT.F.row.classList.toggle('auto', flowAuto);
    setMark(CT.F, (S.flow * 100 - +CT.F.in.min) / (+CT.F.in.max - +CT.F.in.min));
  }
  // düğmeler
  const ba = E('bAuto'); ba.textContent = S.auto ? t('auto') : t('man'); ba.classList.toggle('on', S.auto); ba.disabled = S.az || locked;
  const bt = E('bTest'); bt.hidden = scen !== 'test'; bt.disabled = S.test || S.az || scenT < 100 || S.n < 0.04;
  E('bSpd').textContent = '×' + speed; E('bPause').textContent = 'II';
  const tripped = S.az && !S.destroyed;
  E('az').hidden = tripped; E('cover').hidden = tripped; E('rst').hidden = !tripped; E('rst').disabled = !canReset();
  sideSync();
  const bp = E('bProt'); bp.className = ARM.prot ? S.prot + ' arm' : S.prot; bp.textContent = ARM.prot ? t('conf') : t('prot_' + S.prot + '_s');
  fitCtl();
}
function sideSync() {
  if (!WIDE || !S) return; const end = sdef.end, fin = Number.isFinite(end);
  E('sdT').textContent = `${rname(TY.id)} · ${t('s_' + scen)}`; E('sdG').textContent = msgT > 0 && msg ? msg : goalText();
  E('sdP').style.width = fin ? clamp(scenT / end * 100, 0, 100) + '%' : '100%'; E('sdTm').textContent = fin ? `${fmtTime(scenT)} / ${fmtTime(end)}` : fmtTime(scenT);
  E('sdK').textContent = score.tot ? `${t('k_pct')} ${pc(Math.round(score.ok / score.tot * 100))}` : flags.trips ? `${t('k_trips')} ${nf(flags.trips)}` : '';
}
/* Metni kutusuna sığdır: taşarsa yazı boyutunu küçült (tüm dillerde düğmeler ve etiketler okunur kalır) */
const FIT = new Map();
function fitEl(el, min) {
  const key = el.textContent + '|' + el.clientWidth; if (FIT.get(el) === key) return; FIT.set(el, key);
  el.style.fontSize = ''; let fs = parseFloat(getComputedStyle(el).fontSize), g = 0;
  while ((el.scrollWidth > el.clientWidth + 0.5 || el.scrollHeight > el.clientHeight + 1) && fs > min && g++ < 40) { fs -= 0.5; el.style.fontSize = fs + 'px'; }
}
function fitCtl() { for (const el of document.querySelectorAll('#ctl .b, #az, #rst, #cover span, #ctl .rl, #ctl .chip, #bProt')) if (el.offsetParent) fitEl(el, 7.5); }
function lockNotice() { if (!flags.lockT || scenT - flags.lockT > 3) { flags.lockT = scenT; note('m_lock', 'warn'); SFX.lock(); buzz(30); } attn('rods'); }
CT.S.in.addEventListener('input', () => { if (!S || S.az) return; const v = +CT.S.in.value; if (TY.id === 'pwr') { if (!scenDriven() && !flags.turbOff) { S.Dset = v / 100; flags.loadMem = S.Dset; } } else if (S.auto && !scenDriven()) S.nSet = v / TY.Pn; ctlSync(); });
CT.R.in.addEventListener('input', () => { if (!S || S.az || (S.auto && TY.actuator === 'rods')) return; let v = +CT.R.in.value / 100; if (S.interlock && v < Math.min(S.p, S.pLock) - 0.005) { v = Math.min(S.p, S.pLock); CT.R.in.value = Math.round(v * 100); lockNotice(); } S.pTarget = v; ctlSync(); });
CT.F.in.addEventListener('input', () => { if (!S || S.az) return; if (TY.id === 'pwr') S.boronTarget = +CT.F.in.value; else if (!S.test && !(S.auto && TY.actuator === 'flow')) S.flowTarget = +CT.F.in.value / 100; ctlSync(); });
for (const k of ['S', 'R', 'F']) CT[k].in.addEventListener('change', () => SFX.click());
function setAuto(on) {
  if (!S || S.az) return; S.auto = on;
  if (on && TY.id !== 'pwr') S.nSet = scenDriven() ? S.D : clamp(S.n, 0.02, 1);
  if (!on) { S.pTarget = S.p; S.flowTarget = S.flow; }
  SFX.toggle(on); ctlSync(true);
}
E('bAuto').addEventListener('click', () => { audioInit(); setAuto(!S.auto); });
E('bTest').addEventListener('click', () => { if (scen === 'test' && S && !S.test) { S.test = true; S.testT = 0; S.flowBase = S.flow; note('m_a3', 'info', undefined, true); SFX.start(); ctlSync(); } });
E('bSpd').addEventListener('click', () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; SFX.click(); ctlSync(); });
E('bPause').addEventListener('click', () => { if (S && !ended) { SFX.click(); pauseMenu(); } });
E('bMenu').addEventListener('click', () => { if (S && !ended) { SFX.click(); pauseMenu(); } });
function inGameOverlay(fn) { if (!S || ended) return; audioInit(); playing = false; tipEl.hidden = true; SFX.open(); fn(); }
E('bHelp').addEventListener('click', () => inGameOverlay(() => helpScreen(resumeGame)));
E('bSet').addEventListener('click', () => inGameOverlay(() => settingsScreen(resumeGame)));
function armed(k) { return ARM[k] && performance.now() - ARM[k] < 3000; }
function arm(k) { ARM[k] = performance.now(); SFX.warn(); ctlSync(); setTimeout(() => { if (ARM[k] && performance.now() - ARM[k] >= 2900) { ARM[k] = 0; ctlSync(); } }, 3000); }
function setLimit(on) { S.interlock = on; if (!on) { flags.bypassUsed = true; note('m_limoff', 'bad', undefined, true); SFX.lock(); } else { note('m_limon', 'ok'); SFX.toggle(true); } ctlSync(); }
function setProt(mode, quiet) {
  if (!S || S.prot === mode) return; S.prot = mode; if (mode === 'off' || (scen === 'test' && mode !== 'full')) flags.bypassUsed = true;
  if (mode === 'off') S.stepback = false;
  note('m_prot_' + mode, mode === 'off' ? 'bad' : 'info', undefined, !quiet); SFX.toggle(mode !== 'off'); ctlSync();
}
E('chLim').addEventListener('click', () => { if (!S) return; audioInit(); if (!S.interlock) { setLimit(true); return; } if (armed('lim')) { ARM.lim = 0; setLimit(false); } else arm('lim'); });
E('bProt').addEventListener('click', () => { if (!S || ended) return; audioInit(); const next = { full: 'assist', assist: 'off', off: 'full' }[S.prot]; if (next === 'off') { if (armed('prot')) { ARM.prot = 0; setProt('off'); } else arm('prot'); } else { ARM.prot = 0; setProt(next); } });
function setBypass(on) { if (!S) return; if (S.interlock === on) setLimit(!on); setProt(on ? 'off' : 'full', true); }
/* Kapatma: kapak + basılı tut; kapatma sonrası yeniden başlat */
const azb = E('az'), cover = E('cover'); let coverT = 0, azHold = 0, keyHold = 0;
cover.addEventListener('click', () => { audioInit(); cover.classList.add('open'); coverT = performance.now(); SFX.click(); setTimeout(() => { if (performance.now() - coverT > 5900) cover.classList.remove('open'); }, 6000); });
azb.addEventListener('pointerdown', e => { e.preventDefault(); if (!playing || !S || S.az || !cover.classList.contains('open')) return; azHold = performance.now(); });
const azUp = () => { azHold = 0; azb.firstChild.style.width = '0'; };
azb.addEventListener('pointerup', azUp); azb.addEventListener('pointerleave', azUp); azb.addEventListener('pointercancel', azUp);
E('rst').addEventListener('click', () => doReset());
function azHoldUpdate() {
  const t0 = azHold || keyHold; if (!t0 || !S || S.az) return;
  const k = (performance.now() - t0) / 450; azb.firstChild.style.width = Math.min(100, k * 100) + '%';
  if (k >= 1) { azHold = 0; keyHold = 0; azb.firstChild.style.width = '0'; trip(false, 'm_trip_man'); setTimeout(() => cover.classList.remove('open'), 900); }
}
/* Klavye (masaüstü) */
function nudgePower(dir, big) {
  if (!S || S.az) return; const pwr = TY.id === 'pwr';
  if (S.auto && !pwr && !scenDriven()) S.nSet = clamp(S.nSet + dir * (big ? 0.05 : 0.01), 0.02, 1);
  else if (pwr && S.auto && !scenDriven() && !flags.turbOff) { S.Dset = clamp(S.Dset + dir * (big ? 0.1 : 0.02), 0.3, 1); flags.loadMem = S.Dset; }
  else if (!(S.auto && TY.actuator === 'rods')) { let v = clamp(S.pTarget - dir * (big ? 0.5 : 0.1), 0, TY.stroke); if (S.interlock && v < Math.min(S.p, S.pLock) - 0.005) { v = Math.min(S.p, S.pLock); lockNotice(); } S.pTarget = v; }
  ctlSync(true);
}
function nudgeF(dir, big) {
  if (!S || S.az) return;
  if (TY.id === 'pwr') S.boronTarget = clamp(S.boronTarget + dir * (big ? 50 : 10), 0, TY.bMax);
  else if (!S.test && !(S.auto && TY.actuator === 'flow')) S.flowTarget = clamp(S.flowTarget + dir * (big ? 0.05 : 0.01), TY.flowMin, TY.flowMax);
  ctlSync(true);
}
document.addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'search') return;
  if (!E('tip').hidden) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeTip(); } return; }
  if (!ov.hidden) { if (e.key === 'Escape') { const b = ov.querySelector('[data-a="back"],[data-a="resume"]'); if (b) b.click(); } return; }
  if (!S || ended) return; const k = e.key, big = e.shiftKey;
  if (k === ' ') { e.preventDefault(); pauseMenu(); }
  else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); nudgePower(1, big); }
  else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); nudgePower(-1, big); }
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); nudgeF(DIR === 'rtl' ? -1 : 1, big); }
  else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); nudgeF(DIR === 'rtl' ? 1 : -1, big); }
  else if (k === 'm' || k === 'M') setAuto(!S.auto);
  else if (k === '1' || k === '2' || k === '4') { speed = +k; ctlSync(); }
  else if (k === 'Escape' || k === 'p' || k === 'P') pauseMenu();
  else if (k === 'h' || k === 'H' || k === '?') E('bHelp').click();
  else if (k === 'v' || k === 'V') { VIEW = VIEW === 'core' ? 'plant' : 'core'; SFX.click(); }
  else if (k === 'r' || k === 'R') doReset();
  else if ((k === 'x' || k === 'X') && !e.repeat && !S.az) { keyHold = performance.now(); }
});
document.addEventListener('keyup', e => { if (e.key === 'x' || e.key === 'X') { keyHold = 0; azb.firstChild.style.width = '0'; } });
