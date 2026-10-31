/* ---------- Simülasyon: senaryolar, koruma sistemi, puanlama ---------- */
const DT = 0.05;
let S = null, TY = null, typeId = 'rbmk', scen = 'train', sdef = null, scenT = 0, ts = 1, slowT = 0, speed = 1, playing = false, ended = false;
let flags = {}, score = { ok: 0, tot: 0 }, EVENTS = [], HIST = { p: [], d: [], x: [] }, histT = 0;
let msg = '', msgT = 0, msgKind = 'info', msgKey = null, msgArg;
const SCENS = id => ['train', 'move', ...(id === 'rbmk' ? ['test'] : []), 'sand'];
const steps = (arr, d0) => tt => { let v = d0; for (const [a, b] of arr) if (tt >= a) v = b; return v; };
const ramp = (low, t0, t1, t2, t3) => tt => tt < t0 ? 1 : tt < t1 ? 1 - (1 - low) * (tt - t0) / (t1 - t0) : tt < t2 ? low : tt < t3 ? low + (1 - low) * (tt - t2) / (t3 - t2) : 1;
function scenDef(id, sn) {
  const rb = id === 'rbmk', cd = id === 'candu';
  if (sn === 'train') return rb ? { opts: { n: 0.6, orm: 28, nHist: 0.6 }, demand: steps([[30, 0.42], [75, 0.6], [110, 0.5]], 0.6), end: 150, auto: true } : { opts: {}, demand: steps([[30, 0.7], [75, 1], [110, 0.85]], 1), end: 150, auto: true };
  if (sn === 'move') return rb ? { opts: { orm: 27 }, demand: ramp(0.6, 20, 40, 120, 150), end: 200, auto: true } : cd ? { opts: {}, demand: ramp(0.5, 20, 40, 70, 100), end: 160, auto: true } : { opts: {}, demand: ramp(0.4, 20, 40, 120, 150), end: 200, auto: true };
  if (sn === 'test') return { opts: { n: 0.22, orm: 27, nHist: 1.0, sub: 0.15 }, demand: null, end: 420, auto: true, n0: 0.22 };
  return { opts: {}, demand: null, end: Infinity, auto: true };
}
/* Mesajlar ve olay günlüğü */
function logEv(key, kind, arg, extra) { EVENTS.push(Object.assign({ t: scenT, key, arg, kind: kind || 'info', i: HIST.p.length }, extra || {})); if (EVENTS.length > 400) EVENTS.shift(); }
function note(key, kind, arg, toastToo, extra) {
  msgKey = key; msgArg = arg; msg = t(key, arg); msgKind = kind || 'info'; msgT = 7;
  logEv(key, kind, arg, extra); if (toastToo) toast(msg, kind);
}
function toast(text, kind, ms) {
  const box = E('toast'); while (box.children.length >= 2) box.firstChild.remove();
  const d = document.createElement('div'); d.className = 'tst ' + (kind || 'info'); d.textContent = text; box.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 420); }, ms || 2800);
}
function goalText() {
  if (scen === 'sand') return t('goal_sand');
  if (scen === 'test') return t('goal_test');
  return TY.id === 'pwr' ? t('goal_pwr') : t('goal_' + scen);
}
/* Senaryo başlat */
function initScenario(sn, id) {
  if (id) typeId = id; scen = sn; sdef = scenDef(typeId, sn); ended = false; scenT = 0; histT = 0; ts = 1; slowT = 0; speed = 1; acc = 0;
  FXP = []; RINGS = [];
  flags = { trips: 0, autoTrips: 0, stepbacks: 0, minORM: 99, maxV: 0, maxXe: 0 }; score = { ok: 0, tot: 0 }; EVENTS = []; HIST = { p: [], d: [], x: [] };
  S = M.create(typeFor(typeId, sn), sdef.opts); TY = S.T; S.auto = sdef.auto; S.prot = sn === 'test' ? 'full' : save.prot; S.interlock = true; S._dxe = 0;
  const d0 = sdef.demand ? sdef.demand(0) : S.n; S.Dset = S.D = d0; if (TY.id !== 'pwr') S.nSet = sdef.n0 || d0;
  flags.loadMem = S.Dset; ARM.lim = 0; ARM.prot = 0;
  for (const k of Object.keys(SM)) delete SM[k]; PLANT_ERR = null; VIEW = 'core'; msg = ''; msgT = 0;
  E('toast').innerHTML = ''; cover.classList.remove('open'); ctlConfig();
  note(sn === 'train' ? 'm_t1' : sn === 'move' ? 'm_mv' : sn === 'test' ? 'm_a0' : 'm_hold', 'info');
  histPush();
}
function histPush() {
  const d = sdef.demand ? (TY.id === 'pwr' ? S.D : sdef.demand(scenT)) * TY.Pn : scen === 'test' ? null : (TY.id === 'pwr' ? S.D * TY.Pn : S.auto ? S.nSet * TY.Pn : null);
  HIST.p.push(S.n * TY.Pn); HIST.d.push(S.az ? null : d); HIST.x.push(M.xenonPct(S));
  if (HIST.p.length > 3600) { for (const k of ['p', 'd', 'x']) HIST[k].splice(0, 600); for (const e of EVENTS) e.i -= 600; }
}
/* Kapatma ve yeniden başlatma */
function trip(auto, why) {
  if (!S || S.az || S.destroyed) return;
  M.azStart(S); flags.trips++; if (auto) flags.autoTrips++; S.stepback = false;
  if (TY.id === 'pwr') { flags.turbOff = true; S.Dset = 0; S.D = 0; }
  const now = performance.now(); SHAKE = now + 600; FLASH = now + 700; FLASHC = '255,60,80';
  SFX.trip(); buzz([90, 50, 180]); tripFX(); note(why, 'bad', undefined, true, { trip: true }); attn('lamps');
  if (TY.id === 'pwr') logEv('m_turb', 'warn'); if (TY.id === 'candu' && scen !== 'test') logEv('m_candu_hint', 'warn');
  azHold = 0; keyHold = 0; azb.firstChild.style.width = '0'; setTimeout(() => cover.classList.remove('open'), 900);
  ctlSync(true);
}
const canReset = () => !!(S && S.az && !S.destroyed && !S.jammed && S.p >= TY.stroke - 0.02 && S.azT > 3 && !ended);
function doReset() {
  if (!S || !S.az) return;
  if (!canReset()) { if (!S.destroyed) toast(t(S.jammed ? 'm_jam' : 'm_reset_wait'), 'warn', 1800); SFX.lock(); return; }
  M.resetTrip(S); flags.turbOff = false; slowT = 0; ts = 1;
  if (TY.id === 'pwr') S.Dset = sdef.demand ? sdef.demand(scenT) : (flags.loadMem || 1);
  else S.nSet = clamp(S.n, 0.02, 1);
  SFX.reset(); buzz(30); FLASH = performance.now() + 500; FLASHC = '70,224,160'; note('m_reset', 'ok', undefined, true); ctlSync(true);
}
/* Koruma sistemi v2: uyarı → geri çekme → kapatma (moda göre) */
function protect(dt) {
  const P = TY.prot, n = S.n, per = period(), mode = S.prot;
  if (S.az || S.destroyed) { S.stepback = false; flags.sbT = flags.tpT = flags.thT = flags.tfT = 0; return; }
  const alert = per < P.alertPer && n > 1e-3;
  if (alert && !flags.alertOn) { flags.alertOn = true; logEv('m_alert', 'warn'); attn('power'); } else if (!alert && per > P.alertPer * 1.3) flags.alertOn = false;
  if (mode === 'off') { S.stepback = false; return; }
  if (S.stepback && !(S.auto && TY.actuator === 'rods' && TY.id !== 'pwr')) S.pTarget = Math.max(S.pTarget, S.p); // geri çekilen çubuklar yerinde kalır
  const lowF = P.lowFlow > 0 && S.flow < P.lowFlow && n > P.lowFlowN;
  const sbWhy = per < P.stepPer && n > 1e-4 ? 'm_step_p' : n > P.stepN ? 'm_step_n' : lowF ? 'm_step_f' : null;
  if (sbWhy) {
    flags.sbT = (flags.sbT || 0) + dt; flags.sbClr = 0;
    if (!S.stepback && flags.sbT >= 0.3) {
      // geri çekme ile birlikte yük de düşürülür (türbin geri çekmesi), yoksa OTOMATİK çubukları yeniden çeker
      if (TY.id === 'pwr') { if (!sdef.demand) { S.Dset = Math.max(0.3, Math.min(S.Dset, S.n) - 0.1); flags.loadMem = S.Dset; } } else if (S.auto) S.nSet = Math.max(0.02, Math.min(S.nSet, S.n) * 0.9);
      S.stepback = true; flags.stepbacks++; note(sbWhy, 'warn', undefined, true); SFX.step(); buzz(40); attn('rods'); }
  } else {
    flags.sbT = 0;
    if (S.stepback) { flags.sbClr = (flags.sbClr || 0) + dt; if (flags.sbClr > 2 && per > P.stepPer * 1.5 && n < P.stepN - 0.03) { S.stepback = false; note('m_step_end', 'ok'); } }
  }
  const full = mode === 'full';
  const tp = per < P.tripPer * (full ? 1 : 0.5) && n > 1e-4; // periyot koruması düşük güçte de çalışır (kaynak/ara bölge)
  const th = full ? n > P.tripN : n > Math.max(P.tripN * 1.25, 1.4);
  const tf = full && lowF;
  flags.tpT = tp ? (flags.tpT || 0) + dt : 0; flags.thT = th ? (flags.thT || 0) + dt : 0; flags.tfT = tf ? (flags.tfT || 0) + dt : 0;
  const why = flags.tpT >= (full ? 0.5 : 0.3) ? 'm_tp' : flags.thT >= (full ? 0.8 : 0.5) ? 'm_th' : flags.tfT >= 2 ? 'm_tf' : null;
  if (why) trip(true, why);
}
/* Ağır çekim: yalnız gerçek sıçramada */
function slowmo(dt) {
  const P = TY.prot, n = S.n, per = period(), rho = M.rho(S) / TY.beta;
  if (!S.auto) S._ref = S._ref ? lerp(S._ref, n, 0.002) : n; else S._ref = TY.id === 'pwr' ? Math.max(S.D, 0.02) : S.nSet;
  const ref = Math.max(0.02, S._ref || n);
  const exc = !S.destroyed && ((per < P.tripPer * 1.2 && n > 0.05) || rho > 0.8 || (n > 3 * ref && n > 0.1));
  if (exc && save.slow) {
    if (slowT <= 0 && (!flags.excT || scenT - flags.excT > 20)) { flags.excT = scenT; note('m_exc', 'bad', undefined, true); SFX.warn(); buzz([60, 40, 60]); }
    slowT = 2.5;
  } else slowT = Math.max(0, slowT - dt);
  ts = slowT > 0 ? 0.25 : 1;
}
/* Bir simülasyon adımı */
function tick() {
  const pwr = TY.id === 'pwr';
  if (sdef.demand) { const d = sdef.demand(scenT); if (pwr) { if (!flags.turbOff) S.Dset = d; } else { S.Dset = d; if (S.auto && !S.az) S.nSet = d; } }
  const p0 = S.p; M.step(S, DT); scenT += DT; S._dp = (S.p - p0) / DT;
  if (pwr && S.az) S.Tm += (M.tRef(0) - S.Tm) * (1 - Math.exp(-DT / 15)); // buhar boşaltma Tavg'ı yüksüz değerde tutar
  protect(DT); slowmo(DT);
  const orm = M.ORM(S, S.p), xp = M.xenonPct(S);
  if (S._xe1 === undefined) S._xe1 = xp;
  if (Math.floor(scenT / DT + 0.5) % 20 === 0) { S._dxe = (xp - S._xe1) / 100; S._xe1 = xp; }
  flags.minORM = Math.min(flags.minORM, orm); flags.maxV = Math.max(flags.maxV, S.v); flags.maxXe = Math.max(flags.maxXe, xp);
  if (S.test) flags.minORMtest = Math.min(flags.minORMtest === undefined ? 99 : flags.minORMtest, orm);
  if (!S.az) {
    if (orm < TY.warn - 0.05 && !flags.o1) { flags.o1 = 1; note('m_m1', 'warn'); attn('power'); } else if (orm > TY.warn + 1) flags.o1 = 0;
    if (orm < TY.minM - 0.05 && !flags.o2) { flags.o2 = 1; note('m_m2', 'bad', undefined, true); SFX.warn(); attn('power'); } else if (orm > TY.minM + 1) flags.o2 = 0;
  }
  if (TY.actuator === 'flow' && S.auto && !S.az) { // BWR: OTOMATİK debi sınırına dayandı mı?
    const sat = S.flowTarget <= TY.flowMin + 1e-3 && S.n > S.nSet * 1.05 ? 'm_bwr_min' : S.flowTarget >= TY.flowMax - 1e-3 && S.n < S.nSet * 0.95 ? 'm_bwr_max' : null;
    flags.satT = sat ? (flags.satT || 0) + DT : 0; flags.satClr = sat ? 0 : (flags.satClr || 0) + DT;
    if (sat && flags.satT > 4 && flags.satK !== sat) { flags.satK = sat; note(sat, 'warn', undefined, true); attn('rods'); }
    if (flags.satClr > 8) flags.satK = null;
  }
  if (scen === 'train' || scen === 'move') {
    if (scen === 'train') for (const tt of [30, 75, 110]) if (scenT >= tt && !flags['m' + tt]) { flags['m' + tt] = 1; note('m_t2', 'info'); attn('trend'); }
    score.tot++;
    const okT = pwr ? Math.abs(S.Tm - M.tRef(S.D)) <= 2.5 && !flags.turbOff : Math.abs(S.n - S.D) <= 0.05 * S.D;
    if (okT && orm >= TY.minM && !S.az) score.ok++;
    if (scenT >= sdef.end) return finish('done');
  }
  if (TY.id === 'candu' && xp > 260 && S.n < 0.05 && !flags.poison && scen !== 'test') {
    flags.poison = 1; note('m_poison', 'bad', undefined, true);
    if (scen !== 'sand') { const sid = S; setTimeout(() => { if (!ended && S === sid) finish('poison'); }, 2500); }
  }
  if (scen === 'test') {
    for (const [tt, k] of [[60, 'm_a1'], [100, 'm_a2'], [140, 'm_a2b']]) if (scenT >= tt && !flags['m' + tt]) { flags['m' + tt] = 1; note(k, tt === 60 ? 'bad' : 'warn', undefined, tt !== 140); }
    if (scenT >= 60 && !flags.dip) { flags.dip = 1; S.auto = false; S.pTarget = Math.min(TY.stroke, S.p + 2.8); ctlSync(true); }
    if (S.test && S.testT > 55 && !flags.m4) { flags.m4 = 1; note('m_a4', 'info', undefined, true); }
    if (scenT > sdef.end && !S.az) return finish('done');
  }
  if (S.jammed && !flags.jam) { flags.jam = 1; note('m_jam', 'bad', undefined, true); SHAKE = performance.now() + 900; }
  if (S.destroyed && !flags.boom) { flags.boom = 1; boomFX(); SFX.boom(); buzz([300, 80, 500]); SHAKE = performance.now() + 1500; logEv('destroyed', 'bad', undefined, { trip: true }); }
  histT += DT; if (histT >= 1 - 1e-9) { histT = 0; histPush(); }
  if (S.destroyed && S.destroyT > 2.5) finish('destroyed');
  else if (scen === 'test' && S.az && !S.destroyed && S.azT > 30 && S.n < 0.05) finish('done');
}
/* Vardiya sonu */
function finish(kind) {
  if (ended || !S) return; ended = true; playing = false; slowT = 0; ts = 1;
  const orm = S.azORM !== undefined ? S.azORM : M.ORM(S, S.p), dead = S.destroyed || kind === 'destroyed';
  const R = { kind, type: typeId, scen, stars: 0, title: 'done', why: [], pct: null, best: 0, isNew: false };
  const peakMW = Math.round((S.maxAz || S.maxN) * TY.Pn);
  if (scen === 'train' || scen === 'move') {
    R.pct = Math.round(score.ok / Math.max(1, score.tot) * 100);
    R.stars = R.pct >= 85 ? 3 : R.pct >= 65 ? 2 : R.pct >= 40 ? 1 : 0;
    if (flags.trips > 0) R.stars = Math.min(R.stars, 2);
    if (kind === 'poison') { R.stars = 0; R.title = 'poisoned'; R.why.push(['why8', 'bad']); }
    if (dead) { R.stars = 0; R.title = 'destroyed'; }
    if (flags.trips) R.why.push(['why_trips', 'warn', flags.trips]);
    if (flags.stepbacks) R.why.push(['why_steps', 'info', flags.stepbacks]);
    if (flags.minORM < TY.minM) R.why.push(['why3', 'bad', nf(flags.minORM, 1)]);
    if (flags.bypassUsed) R.why.push(['why6', 'warn']);
    if (TY.id === 'pwr' && R.pct < 65) R.why.push(['why_pwr', 'info']);
    if (TY.id === 'bwr' && R.pct < 65) R.why.push(['why_bwr', 'info']);
    if (scen === 'move' && flags.maxXe > 130 && R.pct < 85) R.why.push(['why_xe', 'info']);
    if (R.stars === 3) R.why.push(['why_great', 'ok']);
  } else if (scen === 'test') {
    const spike = (S.maxAz || 0) > 2 * (S.azN || 0.01), mo = flags.minORM;
    if (dead) { R.title = 'destroyed'; R.stars = 0; }
    else if (S.az) { R.title = 'safe'; R.stars = flags.bypassUsed || orm < 15 ? 1 : (S.test && S.testT >= 55 && (flags.minORMtest === undefined || flags.minORMtest >= 15)) ? 3 : 2; }
    else { R.title = 'done'; R.stars = !S.test && mo >= 15 && !flags.bypassUsed ? 2 : 1; if (!S.test && mo >= 15) R.why.push(['why10', 'ok']); }
    R.why.push(['why_orm', orm < 15 ? 'bad' : 'ok', nf(orm, 1)]);
    if (flags.bypassUsed) R.why.push(['why6', 'warn']);
    if (spike) R.why.push(['why2', 'bad', nf(S.psF * TY.ps0, 1)]);
    if (flags.maxV > 0.05 && (spike || dead)) R.why.push(['why1', 'bad']);
    if (mo < 15) R.why.push(['why3', 'warn', nf(mo, 0)]);
    if (S.jammed) R.why.push(['why4', 'bad']);
    if (R.stars === 3) R.why.push(['why7', 'ok']);
  } else { R.title = dead ? 'destroyed' : S.az ? 'safe' : 'done'; }
  R.kpis = [];
  if (R.pct !== null) R.kpis.push(['k_pct', R.pct, 0, '%']);
  R.kpis.push(['k_trips', flags.trips, 0, ''], ['k_orm', +flags.minORM.toFixed(1), 1, ''], ['k_peak', peakMW, 0, ' MW'], ['k_xe', Math.round(flags.maxXe), 0, '%'], ['k_time', Math.round(scenT), -1, '']);
  const key = typeId + ':' + scen, prevStars = save.stars[key] || 0;
  R.earned = creditsFor(R, prevStars); R.crFrom = save.cr; save.cr = Math.min(999999, save.cr + R.earned);
  if (scen !== 'sand') {
    if (R.stars > (save.stars[key] || 0)) { save.stars[key] = R.stars; R.isNew = R.stars > 0; }
    if (R.pct !== null && R.pct > (save.best[key] || 0)) save.best[key] = R.pct;
    R.best = save.best[key] || 0;
  }
  persist();
  const sid = S; setTimeout(() => { if (S === sid) reportScreen(R); }, dead ? 200 : 350); // bu arada menüye çıkıldıysa rapor açılmaz
}
