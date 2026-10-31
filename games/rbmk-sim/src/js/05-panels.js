/* ---------- Kontrol paneli: yerleşim ve paneller ---------- */
let LAYOUT = null, sc = 1, dpr = 1, WIDE = false, VIEW = 'core', SHAKE = 0, FLASH = 0, FLASHC = '255,60,80';
function computeLayout() {
  const box = cw.getBoundingClientRect(), bw = Math.max(1, box.width), bh = Math.max(1, box.height);
  let W, Hh, r;
  if (WIDE) {
    W = 720; Hh = 480;
    r = { head: { x: 0, y: 0, w: 720, h: 22 }, core: { x: 6, y: 24, w: 230, h: 196 }, xread: { x: 6, y: 226, w: 230, h: 62 }, xchart: { x: 6, y: 294, w: 230, h: 92 }, rodflow: { x: 6, y: 392, w: 230, h: 82 },
      power: { x: 244, y: 24, w: 232, h: 196 }, trend: { x: 244, y: 226, w: 232, h: 120 }, lamps: { x: 244, y: 352, w: 232, h: 122, cols: 2 }, plant: { x: 484, y: 24, w: 230, h: 196 }, msg: { x: 484, y: 226, w: 230, h: 248 } };
  } else {
    W = 360; Hh = clamp(Math.round(W * bh / bw), 520, 640); const EX = Hh - 520, e1 = EX * 0.12, e2 = EX * 0.26, e3 = EX * 0.46;
    r = { head: { x: 0, y: 0, w: 360, h: 22 }, core: { x: 6, y: 24, w: 170, h: 168 }, power: { x: 180, y: 24, w: 174, h: 168 }, trend: { x: 6, y: 198 + e1, w: 170, h: 72 }, xchart: { x: 180, y: 198 + e1, w: 174, h: 72 },
      xread: { x: 6, y: 276 + e2, w: 230, h: 62 }, rodflow: { x: 242, y: 276 + e2, w: 112, h: 62 }, lamps: { x: 6, y: 344 + e3, w: 348, h: 62, cols: 4 }, msg: { x: 6, y: 412 + e3, w: 348, h: 102 + EX - e3 } };
  }
  sc = Math.max(0.25, Math.min(bw / W, bh / Hh)); dpr = Math.min(2.5, window.devicePixelRatio || 1);
  cv.style.width = Math.round(W * sc) + 'px'; cv.style.height = Math.round(Hh * sc) + 'px';
  cv.width = Math.round(W * sc * dpr); cv.height = Math.round(Hh * sc * dpr);
  LAYOUT = { W, H: Hh, r };
}
const period = () => (S && S.rate > 1e-3) ? 1 / S.rate : Infinity;

function pHeader(w) {
  const topW = (E('top').offsetWidth || 120) / sc, avail = w - topW - 16;
  const title = `${rname(TY.id)} · ${t('s_' + scen)}`;
  const tw = fitTxt(title, 10, 11.5, 12, '#c9d9ee', 'left', avail * 0.55, 800);
  ctx.font = font(800, tw); const used = 10 + Math.min(avail * 0.55, ctx.measureText(title).width) + 10;
  const st = `${fmtTime(scenT)}  ×${speed}  Xe×${M.Z}${ts < 0.9 ? '  ' + t('slow') : ''}`;
  fitTxt(st, w - topW - 10, 11.5, 10.5, ts < 0.9 ? '#ff7b6b' : '#7e96b6', 'right', Math.max(30, w - topW - 10 - used), 700);
}
function coreDraw(now) {
  const id = TY.id, n = S.n, col = glowCol(n), cx = 85, cy = 90, ins = S.p / TY.stroke, jam = S.jammed;
  const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, 84); halo.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.12 + 0.3 * clamp(Math.log10(Math.max(n, 1e-3)) / 2 + 0.8, 0, 1) + (RM() ? 0 : 0.05 * Math.sin(now / 500))})`); halo.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = halo; ctx.fillRect(2, 14, 166, 152);
  if (id === 'candu') {
    ctx.save(); rr(cx - 76, cy - 52, 152, 104, 16); ctx.clip(); ctx.fillStyle = '#0a111d'; ctx.fillRect(cx - 76, cy - 52, 152, 104);
    for (let r = 0; r < 12; r++) { const y = cy - 46 + r * 8.4; ctx.fillStyle = '#1d2733'; ctx.fillRect(cx - 74, y - 2.5, 148, 5); for (let c = 0; c < 22; c++) { const x = cx - 70 + c * 6.8, fl = RM() ? 1 : 0.9 + 0.1 * Math.sin(now / 260 + c + r), a = clamp(0.25 + Math.cos((c - 10.5) / 11 * 1.3) * 0.75, 0.2, 1) * fl; ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`; ctx.fillRect(x, y - 1.8, 5.2, 3.6); } }
    if (S.v > 0.01) bubbles(cx, cy, 44, S.v, now, 1.2);
    for (let i = 0; i < 7; i++) { const x = cx - 54 + i * 18; ctx.fillStyle = '#05080d'; ctx.fillRect(x - 3, cy - 52, 6, 104); ctx.fillStyle = jam ? '#ffc83d' : '#9fb4d0'; ctx.fillRect(x - 2, cy - 52, 4, 104 * ins); }
    ctx.restore(); ctx.strokeStyle = S.destroyed ? '#ff5468' : '#3a5a8a'; ctx.lineWidth = 2.5; rr(cx - 76, cy - 52, 152, 104, 16); ctx.stroke();
    for (let r = 0; r < 12; r++) { ctx.fillStyle = '#4b607d'; ctx.fillRect(cx - 82, cy - 48 + r * 8.4, 5, 3); ctx.fillRect(cx + 77, cy - 48 + r * 8.4, 5, 3); }
    return;
  }
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 70, 0, TAU); ctx.clip(); ctx.fillStyle = '#0a111d'; ctx.fillRect(cx - 72, cy - 72, 144, 144);
  for (let i = -7; i <= 7; i++) for (let j = -7; j <= 7; j++) {
    const d = Math.hypot(i, j); if (d > 7.6) continue; const x = cx + i * 9.2, y = cy + j * 9.2, sh = SHADE[(i + 7) * 15 + j + 7], shape = Math.cos(d / 8.2 * 1.35), fl = RM() ? 1 : 0.88 + 0.12 * Math.sin(now / 260 + i * 1.7 + j * 2.3), a = clamp(0.2 + shape * 0.8, 0.15, 1) * fl;
    if (id === 'rbmk') { ctx.fillStyle = `rgb(${34 + sh * 14},${38 + sh * 14},${46 + sh * 14})`; ctx.fillRect(x - 4.4, y - 4.4, 8.8, 8.8); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x - 4.4, y - 4.4, 8.8, 1); ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`; ctx.beginPath(); ctx.arc(x, y, 2.9, 0, TAU); ctx.fill(); }
    else { ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`; ctx.fillRect(x - 4.1, y - 4.1, 8.2, 8.2); ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = 0.8; ctx.strokeRect(x - 4.1, y - 4.1, 8.2, 8.2); ctx.fillStyle = 'rgba(0,0,0,.22)'; for (const dx of [-2.4, 0, 2.4]) ctx.fillRect(x + dx - 0.4, y - 3.4, 0.8, 6.8); }
    if (id === 'rbmk' && S.v > 0.015 && ((i * 5 + j * 3 + 100) % 4) === 0) { ctx.fillStyle = `rgba(230,246,255,${Math.min(0.9, S.v * 4)})`; ctx.beginPath(); ctx.arc(x + 1, y - 1 - (RM() ? 0 : (now / 300 + i) % 2), 1.3, 0, TAU); ctx.fill(); }
  }
  if (id === 'pwr') { ctx.fillStyle = `rgba(70,170,255,${0.06 + clamp(S.boron / 1500, 0, 1) * 0.22})`; ctx.fillRect(cx - 72, cy - 72, 144, 144); }
  if (id === 'bwr') { bubbles(cx, cy, 66, S.v, now, 1.8); ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(cx + k * 18.4, cy - 70); ctx.lineTo(cx + k * 18.4, cy + 70); ctx.moveTo(cx - 70, cy + k * 18.4); ctx.lineTo(cx + 70, cy + k * 18.4); ctx.stroke(); } }
  if (id === 'bwr') {
    for (let a = -3; a <= 3; a += 2) for (let b = -3; b <= 3; b += 2) { const x = cx + a * 9.2, y = cy + b * 9.2, L = 7 * ins + 1; ctx.fillStyle = jam ? '#ffc83d' : '#0b0f17'; ctx.fillRect(x - 1, y - L, 2, 2 * L); ctx.fillRect(x - L, y - 1, 2 * L, 2); ctx.fillStyle = '#9fb4d0'; ctx.fillRect(x - 0.6, y - L, 1.2, 2 * L); ctx.fillRect(x - L, y - 0.6, 2 * L, 1.2); }
  } else {
    for (const [i, j] of [[-4, -4], [0, -5], [4, -4], [-5, 0], [0, 0], [5, 0], [-4, 4], [0, 5], [4, 4], [-2, -2], [2, -2], [-2, 2], [2, 2]]) { const x = cx + i * 9.2, y = cy + j * 9.2; ctx.fillStyle = '#05080d'; ctx.beginPath(); ctx.arc(x, y, 4.2, 0, TAU); ctx.fill(); ctx.strokeStyle = jam ? '#ffc83d' : '#5fd3ff'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.fillStyle = jam ? '#ffc83d' : '#9fb4d0'; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 2.8, Math.PI * 1.5 - ins * Math.PI, Math.PI * 1.5 + ins * Math.PI); ctx.closePath(); ctx.fill(); }
  }
  ctx.restore(); ctx.strokeStyle = S.destroyed ? '#ff5468' : '#3a5a8a'; ctx.lineWidth = id === 'pwr' ? 4 : 2.5; ctx.beginPath(); ctx.arc(cx, cy, 71, 0, TAU); ctx.stroke();
  if (id === 'pwr') { ctx.fillStyle = '#4b607d'; ctx.fillRect(6, cy - 5, 8, 10); ctx.fillRect(156, cy - 5, 8, 10); }
}
function bubbles(cx, cy, R, v, now, size) { if (v < 0.01) return; const n = Math.round(v * 70), tt = RM() ? 0 : now; for (let i = 0; i < n; i++) { const a = (i * 2.399) % TAU, r2 = Math.sqrt((i * 0.618) % 1) * R, ph = (tt / 900 + i * 0.37) % 1, x = cx + Math.cos(a) * r2, y = cy + Math.sin(a) * r2 - ph * 6; ctx.fillStyle = `rgba(230,246,255,${0.55 * (1 - ph)})`; ctx.beginPath(); ctx.arc(x, y, size * (0.5 + ph * 0.8), 0, TAU); ctx.fill(); } }
function viewToggle(w) { if (WIDE) return; const x = w - 52, y = 2; ctx.fillStyle = '#0b1626'; rr(x, y, 20, 14, 4); ctx.fill(); ctx.strokeStyle = '#3f6a9a'; ctx.lineWidth = 1; ctx.stroke(); txt('⇄', x + 10, y + 7.5, 9, '#8fb3da', 'center', 800); region('view', x - 6, 0, 32, 22); }
function pCore(now, w, h) { panel(w, h, t('hdr1'), 'tip_core', 'core'); viewToggle(w); coreDraw(now); fitTxt(`${t('rd')} ${nf(S.p, 1)} m`, 85, 161, 8.5, S.jammed ? '#ffc83d' : '#8fa8c8', 'center', 150); }
let PLANT_ERR = null;
function pPlant(now, w, h) {
  panel(w, h, t('hdr_plant'), 'tip_plant', 'plant'); viewToggle(w);
  ctx.save(); ctx.translate(6, 16); ctx.beginPath(); ctx.rect(0, 0, 158, 146); ctx.clip();
  const fn = PLANT[TY.id] || PLANT._generic;
  try { fn(ctx, S, RM() ? 0 : now, H); } catch (e) { if (!PLANT_ERR) { PLANT_ERR = e; console.error('plant', e); } }
  ctx.restore();
}
function pPower(now, w, h) {
  panel(w, h, t('hdr2'), 'tip_power', 'power');
  const n = S.n, mw = n * TY.Pn, P = TY.prot;
  ctx.fillStyle = '#04110b'; rr(8, 12, 158, 36, 7); ctx.fill(); ctx.strokeStyle = '#1a3a2a'; ctx.lineWidth = 1.5; ctx.stroke();
  const ln = smooth('lcd', Math.log(Math.max(n, 1e-6)), 0.4), dn = Math.exp(ln), big = n > P.tripN * 0.98 || S.destroyed;
  const s = save.pct ? nf(dn * 100, dn * 100 < 10 ? 1 : 0) + '%' : fmtMW(dn * TY.Pn);
  ctx.save(); ctx.shadowColor = big ? '#ff5468' : '#46ffa8'; ctx.shadowBlur = 8; txt(s, 160, 31, s.length > 8 ? 21 : 27, big ? '#ff7b8a' : '#7dffb4', 'right', 700, MONO); ctx.restore();
  txt(save.pct ? '%' : t('mw'), 14, 20, 8, '#2f7a56', 'left');
  if (S.auto || TY.id === 'pwr') { const tg = TY.id === 'pwr' ? S.D : S.nSet; fitTxt(`${t('tgt')} ${save.pct ? nf(tg * 100) + '%' : fmtMW(tg * TY.Pn)}`, 14, 41, 8, '#3f9a70', 'left', 80); }
  const orm = M.ORM(S, S.p), rho = M.rho(S) / TY.beta;
  dial(42, 94, 32, orm, 0, TY.N, [[0, TY.minM, '#ff5468'], [TY.minM, TY.warn, '#ffc83d'], [TY.warn, TY.N, '#46e0a0']], TY.id === 'rbmk' ? t('orm_rbmk') : t('orm_o'), nf(orm, 1), 'orm');
  dial(132, 94, 32, clamp(rho, -3, 2), -3, 2, [[-3, -0.6, '#3a6ea8'], [-0.6, 0.5, '#46e0a0'], [0.5, 1, '#ffc83d'], [1, 2, '#ff5468']], '$', nf(rho, 2), 'rho');
  region('tip_margin', 6, 56, 74, 78); region('tip_rho', 96, 56, 74, 78);
  const per = period();
  fitTxt(`${t('per')}: ${Number.isFinite(per) && per < 999 ? nf(per) + ' s' : '—'}`, 10, 148, 9.5, Number.isFinite(per) && per < P.alertPer ? '#ff7b6b' : '#b8cbe6', 'left', 76);
  fitTxt(t('rho'), 10, 160, 8, '#6f89ab', 'left', 76);
  if (TY.id === 'pwr') { const dT = S.Tm - M.tRef(S.D); fitTxt(`${t('tavg')}: ${nf(S.Tm, 1)}°C`, 166, 148, 9.5, Math.abs(dT) > 2.5 ? '#ffc83d' : '#b8cbe6', 'right', 86); fitTxt(`${t('bor')}: ${nf(Math.round(S.boron))} ppm`, 166, 160, 9.5, '#b8cbe6', 'right', 86); }
  else { fitTxt(`${t('void')}: ${nf(S.v * 100)}%`, 166, 148, 9.5, S.v > 0.3 ? '#ffc83d' : '#b8cbe6', 'right', 86); fitTxt(`${t('fl')}: ${nf(Math.round(S.flow * 100))}%`, 166, 160, 9.5, S.flow < 0.6 ? '#ffc83d' : '#b8cbe6', 'right', 86); }
}
function chartGrid(x, y, w, h, n) { ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.lineWidth = 1; for (let i = 0; i <= n; i++) { const yy = y + h - i / n * h; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); } }
function curve(data, x, y, w, h, f, col, dashed, NMAX) {
  const N = NMAX || 300, off = Math.max(0, data.length - N), sl = data.slice(off); if (sl.length < 2) return;
  ctx.beginPath(); let started = false; sl.forEach((v, i) => { if (v === null || v === undefined) { started = false; return; } const px = x + i / (N - 1) * w, py = y + h - f(v) * h; if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py); });
  if (dashed) { ctx.setLineDash([3, 3]); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]); return; }
  ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = 0.28; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke();
  const last = sl[sl.length - 1]; if (last !== null && last !== undefined) { const lx = x + (sl.length - 1) / (N - 1) * w, ly = y + h - f(last) * h; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lx, ly, 2.2, 0, TAU); ctx.fill(); }
}
const logF = v => clamp(Math.log10(Math.max(1, v)) / 5, 0, 1);
function pTrend(w, h) {
  panel(w, h, t('hdr3'), 'tip_trend', 'trend');
  const x = 26, y = 16, cw2 = w - 34, ch = h - 22; chartGrid(x, y, cw2, ch, 5);
  for (const [lv, s] of [[0, '1'], [1, '10'], [2, '100'], [3, '1k'], [4, '10k'], [5, '100k']]) if (ch > 60 || lv % 2 === 1) txt(s, x - 3, y + ch - lv / 5 * ch, 7, '#3f5a7e', 'right', 700);
  const N = 300, off = Math.max(0, HIST.p.length - N);
  for (const e of EVENTS) if (e.trip && e.i >= off) { const px = x + (e.i - off) / (N - 1) * cw2; ctx.strokeStyle = 'rgba(255,84,104,.55)'; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, y + ch); ctx.stroke(); ctx.setLineDash([]); }
  curve(HIST.d, x, y, cw2, ch, logF, 'rgba(255,255,255,.55)', true, N); curve(HIST.p, x, y, cw2, ch, logF, '#5fd3ff', false, N);
}
function pXChart(w, h) {
  panel(w, h, t('hdr4'), 'tip_xe', 'xe');
  const x = 8, y = 16, cw2 = w - 16, ch = h - 22;
  for (const [a, b, c] of [[0, 110, 'rgba(70,224,160,.15)'], [110, 160, 'rgba(255,200,61,.15)'], [160, 260, 'rgba(255,84,104,.17)']]) { ctx.fillStyle = c; ctx.fillRect(x, y + ch - b / 260 * ch, cw2, (b - a) / 260 * ch); }
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.setLineDash([2, 3]); const y100 = y + ch - 100 / 260 * ch; ctx.beginPath(); ctx.moveTo(x, y100); ctx.lineTo(x + cw2, y100); ctx.stroke(); ctx.setLineDash([]); txt('100%', x + cw2 - 2, y100 - 5, 7, '#7e96b6', 'right');
  curve(HIST.x, x, y, cw2, ch, v => clamp(v / 260, 0, 1), '#ffc83d');
}
function pXRead(now, w, h) {
  panel(w, h, t('xeT'), 'tip_xe', 'xe');
  const xp = M.xenonPct(S), xr = M.xenonRods(S), dx = S._dxe || 0, zone = xp > 160 ? 2 : xp > 110 ? 1 : 0, zc = ['#46e0a0', '#ffc83d', '#ff5468'][zone];
  ctx.fillStyle = '#0a1220'; rr(8, 20, 214, 11, 5); ctx.fill(); for (const [a, b, c] of [[0, 110, '#2f8f6a'], [110, 160, '#9a7a1f'], [160, 260, '#9a3340']]) { ctx.fillStyle = c; ctx.fillRect(8 + a / 260 * 214, 21, (b - a) / 260 * 214, 9); }
  const mx = 8 + clamp(smooth('xebar', xp, 0.2) / 260, 0, 1) * 214; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(mx, 18); ctx.lineTo(mx - 4, 12); ctx.lineTo(mx + 4, 12); ctx.fill(); ctx.fillRect(mx - 1, 18, 2, 14);
  const pulse = zone === 2 && !RM() ? 0.6 + 0.4 * Math.sin(now / 220) : 1;
  ctx.globalAlpha = pulse; txt(`${nf(Math.round(xp))}%`, 8, 45, 17, zc, 'left', 800, MONO); ctx.globalAlpha = 1;
  fitTxt(`${dx > 0.02 ? '▲ ' + t('xeUp') : dx < -0.02 ? '▼ ' + t('xeDn') : '■ ' + t('xeFl')}`, 66, 45, 10, '#b8cbe6', 'left', 86);
  fitTxt(zone === 2 ? t('xePit') : zone === 1 ? t('xeHigh') : t('xeNorm'), 222, 45, 10, zc, 'right', 70, 800);
  fitTxt(t('xeRods', Math.round(xr)), 8, 56, 8.5, '#8fa8c8', 'left', 214);
}
function pRodFlow(now, w, h) {
  panel(w, h, t('hdr5'), 'tip_rods', 'rods');
  const pwr = TY.id === 'pwr', b2 = pwr ? [S.boron, TY.bMax, '#6aa8ff', nf(Math.round(S.boron)), 'ppm'] : [S.flow * 100, TY.flowMax * 100, '#5fd3ff', nf(Math.round(S.flow * 100)), '%'];
  const bars = [[10, S.p, TY.stroke, S.jammed ? '#ffc83d' : '#9fb4d0', S._dp || 0], [62, b2[0], b2[1], b2[2], 0]];
  for (const [bx, v, mx2, c, dv] of bars) {
    ctx.fillStyle = '#0a1220'; rr(bx, 12, 14, 44, 4); ctx.fill(); const h2 = clamp(v / mx2, 0, 1) * 42; ctx.fillStyle = c; rr(bx + 1.5, 55 - h2, 11, h2, 3); ctx.fill();
    if (Math.abs(dv) > 1e-5 && !RM()) { const up = dv < 0, ph = (now / 400) % 1; ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 2; k++) { const yy = up ? 50 - ((ph + k / 2) % 1) * 36 : 16 + ((ph + k / 2) % 1) * 36; ctx.beginPath(); ctx.moveTo(bx + 7, yy + (up ? -3 : 3)); ctx.lineTo(bx + 3.5, yy + (up ? 2 : -2)); ctx.lineTo(bx + 10.5, yy + (up ? 2 : -2)); ctx.fill(); } }
  }
  txt(nf(S.p, 1), 40, 28, 12, '#e6f0ff', 'center', 800, MONO); txt('m', 40, 40, 8, '#6f89ab', 'center');
  txt(b2[3], 92, 28, pwr ? 10 : 12, '#e6f0ff', 'center', 800, MONO); txt(b2[4], 92, 40, 8, '#6f89ab', 'center');
}
function lampList() {
  const P = TY.prot, orm = M.ORM(S, S.p), per = period(), xp = M.xenonPct(S), byp = S.prot === 'off' || !S.interlock;
  let l7;
  if (TY.id === 'pwr') l7 = [t('aTavg'), '#ffc83d', Math.abs(S.Tm - M.tRef(S.D)) > 2.5];
  else if (S.jammed) l7 = [t('aJam'), '#ff5468', true, 1];
  else if (scen === 'test') l7 = [t('aTest'), '#5fd3ff', S.test];
  else if (TY.id === 'bwr') l7 = [t('aFlowLo'), '#ffc83d', S.flow < 0.65 && S.n > 0.5];
  else l7 = [t('aVoid'), '#ffc83d', TY.id === 'candu' ? S.v > 0.05 : S.v > 0.3];
  return [[t('aM1', TY.warn), '#ffc83d', orm < TY.warn - 0.05], [t('aM2', TY.minM), '#ff5468', orm < TY.minM - 0.05, 1],
    scen === 'test' ? [t('aLow'), '#ffc83d', S.n * TY.Pn < 700 && !S.az] : [t('aXe'), '#ffc83d', xp > 160],
    [t('aPer'), '#ffc83d', per < P.alertPer && S.n > 1e-3, 1], [t('aStep'), '#ff9a3d', !!S.stepback, 1], [t('aTrip'), '#ff5468', S.az, 1], l7, [t('aByp'), '#ff5468', byp, 1]];
}
function pLamps(w, h, cols, now) {
  panel(w, h, t('hdr6'), 'tip_lamps', 'lamps');
  const L = lampList(), rows = Math.ceil(L.length / cols), gx = 5, gy = 4, lw = (w - 16 - (cols - 1) * gx) / cols, lh = Math.min(22, (h - 22 - (rows - 1) * gy) / rows), y0 = 17 + ((h - 22) - (rows * lh + (rows - 1) * gy)) / 2;
  L.forEach((l, i) => lamp(8 + (i % cols) * (lw + gx), y0 + Math.floor(i / cols) * (lh + gy), lw, lh, l[0], l[1], l[2], l[3], now));
}
const KINDC = { bad: '#ff9aa6', warn: '#ffd77a', ok: '#8ff0c4', info: '#e6f0ff' };
function pMsg(w, h, now) {
  panel(w, h, t('hdr7'));
  const live = msgT > 0 && msg, s = live ? msg : goalText(), col = live ? (KINDC[msgKind] || '#e6f0ff') : '#7e96b6';
  const top = WIDE ? 70 : Math.min(62, h * 0.62);
  wrapTxt(s, w / 2, 16 + (top - 16) / 2 + 2, w - 24, top - 18, WIDE ? 12.5 : 12.5, col, 700, 3);
  const evs = EVENTS.slice(-(WIDE ? 10 : Math.max(0, Math.floor((h - top - 6) / 13)))).reverse();
  let y = top + 8;
  for (const e of evs) { if (y > h - 6) break; txt(fmtTime(e.t), 10, y, 8.5, '#5d7698', 'left', 700, MONO); fitTxt(t(e.key, e.arg), 44, y, 9.5, KINDC[e.kind] || '#a8bcd6', 'left', w - 54, 600); y += 13; }
}
function draw(now) {
  REG = [];
  const L = LAYOUT; if (!L) return;
  ctx.setTransform(sc * dpr, 0, 0, sc * dpr, 0, 0); ctx.clearRect(0, 0, L.W, L.H); ctx.drawImage(bgTex(L.W, L.H), 0, 0);
  if (!S) return;
  const R = L.r;
  if (SHAKE > now && !RM()) { const k = (SHAKE - now) / 600; ctx.translate((rnd() - 0.5) * 6 * k, (rnd() - 0.5) * 6 * k); }
  placeFlex(R.head, w => pHeader(w));
  place(R.core, 170, 168, (w, h) => (WIDE || VIEW === 'core') ? pCore(now, w, h) : pPlant(now, w, h));
  if (WIDE) place(R.plant, 170, 168, (w, h) => pPlant(now, w, h));
  place(R.power, 174, 168, (w, h) => pPower(now, w, h));
  placeFlex(R.trend, (w, h) => pTrend(w, h)); placeFlex(R.xchart, (w, h) => pXChart(w, h));
  place(R.xread, 230, 62, (w, h) => pXRead(now, w, h)); place(R.rodflow, 112, 62, (w, h) => pRodFlow(now, w, h));
  placeFlex(R.lamps, (w, h) => pLamps(w, h, R.lamps.cols, now)); placeFlex(R.msg, (w, h) => pMsg(w, h, now));
  ctx.setTransform(sc * dpr, 0, 0, sc * dpr, 0, 0);
  if (ts < 0.9 && save.flash) { const p = RM() ? 0.5 : 0.5 + 0.5 * Math.sin(now / 160), g = ctx.createRadialGradient(L.W / 2, L.H / 2, Math.min(L.W, L.H) * 0.35, L.W / 2, L.H / 2, Math.max(L.W, L.H) * 0.7); g.addColorStop(0, 'rgba(255,40,70,0)'); g.addColorStop(1, `rgba(255,40,70,${0.22 + 0.12 * p})`); ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H); }
  else if (S.stepback && save.flash) { const g = ctx.createRadialGradient(L.W / 2, L.H / 2, Math.min(L.W, L.H) * 0.4, L.W / 2, L.H / 2, Math.max(L.W, L.H) * 0.7); g.addColorStop(0, 'rgba(255,154,61,0)'); g.addColorStop(1, `rgba(255,154,61,${0.1 + (RM() ? 0 : 0.06 * Math.sin(now / 200))})`); ctx.fillStyle = g; ctx.fillRect(0, 0, L.W, L.H); }
  if (FLASH > now && save.flash) { ctx.fillStyle = `rgba(${FLASHC},${0.45 * (FLASH - now) / 700})`; ctx.fillRect(0, 0, L.W, L.H); }
  if (S.destroyed) { ctx.fillStyle = `rgba(255,255,255,${clamp((save.flash ? 0.85 : 0.3) - S.destroyT * 0.3, 0, 0.85)})`; ctx.fillRect(0, 0, L.W, L.H); }
}
