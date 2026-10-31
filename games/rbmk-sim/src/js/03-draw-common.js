/* ---------- Çizim: ortak yardımcılar ---------- */
const cv = E('c'), ctx = cv.getContext('2d'), cw = E('cw');
const TAU = Math.PI * 2, MONO = "'Courier New',ui-monospace,monospace";
let FS = 1, seed = 7;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
const SHADE = Array.from({ length: 400 }, rnd);
const QA = { on: false, fit: [], wrap: [] };
const font = (w, size, mono) => `${w || 700} ${size}px ${mono ? MONO : FONT}`;
function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function txt(s, x, y, size, col, al, w, mono) { ctx.font = font(w, size, mono); ctx.textAlign = al || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); }
function fitTxt(s, x, y, size, col, al, maxW, w) {
  let sz = size * FS; ctx.font = font(w, sz); const mw = ctx.measureText(s).width;
  if (mw > maxW) { sz = Math.max(4.5, sz * maxW / mw); ctx.font = font(w, sz); if (QA.on && sz < 7 * Math.min(1, size / 8.5)) QA.fit.push({ s, sz: +sz.toFixed(1), size }); }
  ctx.textAlign = al || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y); return sz;
}
function wrapLines(s, maxW) {
  const charMode = CJK || (!/\s/.test(s) && ctx.measureText(s).width > maxW);
  const parts = charMode ? Array.from(s) : s.split(' '), sep = charMode ? '' : ' ', out = []; let line = '';
  for (const p of parts) { const tt = line ? line + sep + p : p; if (ctx.measureText(tt).width > maxW && line) { out.push(line); line = sep ? p : p; } else line = tt; }
  if (line) out.push(line); return out;
}
function wrapTxt(s, x, y, maxW, maxH, size, col, w, maxLines) {
  maxLines = maxLines || 3; let sz = size * FS, lines = [];
  for (let k = 0; k < 7; k++) { ctx.font = font(w || 700, sz); lines = wrapLines(s, maxW); if (lines.length <= maxLines && lines.length * sz * 1.25 <= maxH && lines.every(l => ctx.measureText(l).width <= maxW + 1)) break; sz *= 0.9; }
  ctx.font = font(w || 700, sz); lines = wrapLines(s, maxW); const lh = sz * 1.25;
  if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.$/, '…'); if (QA.on) QA.wrap.push({ s, sz: +sz.toFixed(1) }); }
  if (QA.on && sz < 7) QA.fit.push({ s, sz: +sz.toFixed(1), size });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
  lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh)); return sz;
}
/* İpucu bölgeleri: cihaz pikseli koordinatında saklanır */
let REG = [];
function region(key, x, y, w, h) {
  const m = ctx.getTransform(), a = m.transformPoint({ x, y }), b = m.transformPoint({ x: x + w, y: y + h });
  REG.push({ key, x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y), x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y) });
}
/* Dikkat çekme ve yumuşatma */
const ATT = {}, SM = {};
const attn = k => { ATT[k] = performance.now(); };
const attnLevel = k => { const d = performance.now() - (ATT[k] || -1e9); return d < 1800 ? 1 - d / 1800 : 0; };
function smooth(key, target, k) { if (SM[key] === undefined || !Number.isFinite(SM[key]) || !Number.isFinite(target)) SM[key] = target; else SM[key] += (target - SM[key]) * (RM() ? 1 : k); return SM[key]; }
/* Panel çerçevesi */
function infoIcon(x, y) { ctx.fillStyle = '#0b1626'; ctx.beginPath(); ctx.arc(x, y, 5.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#3f6a9a'; ctx.lineWidth = 1; ctx.stroke(); txt('i', x, y + 0.5, 8, '#8fb3da', 'center', 800, MONO); }
function panel(w, h, title, tip, attKey) {
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#17283f'); g.addColorStop(1, '#0d1829'); ctx.fillStyle = g; rr(0, 0, w, h, 9); ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = '#27426a'; ctx.stroke();
  const a = attKey ? attnLevel(attKey) : 0;
  if (a > 0) { ctx.save(); ctx.strokeStyle = `rgba(255,200,61,${a})`; ctx.lineWidth = 2; ctx.shadowColor = '#ffc83d'; ctx.shadowBlur = 12 * a; rr(1, 1, w - 2, h - 2, 9); ctx.stroke(); ctx.restore(); }
  ctx.strokeStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.moveTo(9, 1.5); ctx.lineTo(w - 9, 1.5); ctx.stroke();
  for (const [rx, ry] of [[5, 5], [w - 5, h - 5], [5, h - 5]]) { ctx.fillStyle = '#3a526f'; ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, TAU); ctx.fill(); }
  if (title) fitTxt(title, 12, 8.5, 8.5, '#6f89ab', 'left', w - (tip ? 40 : 22), 700);
  if (tip) { infoIcon(w - 12, 9); region(tip, w - 30, 0, 30, 22); }
}
function lamp(x, y, w, h, label, col, on, blink, now) {
  const lit = on && (!blink || RM() || Math.sin(now / 130) > -0.2);
  ctx.fillStyle = lit ? col : '#101a2a'; ctx.globalAlpha = lit ? 0.92 : 1; rr(x, y, w, h, 5); ctx.fill(); ctx.globalAlpha = 1;
  if (lit) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.fillStyle = col; ctx.globalAlpha = 0.35; rr(x, y, w, h, 5); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle = lit ? 'rgba(255,255,255,.5)' : '#22395c'; ctx.lineWidth = 1; rr(x, y, w, h, 5); ctx.stroke();
  fitTxt(label, x + w / 2, y + h / 2 + 0.5, Math.min(8.6, h * 0.5), lit ? '#06101c' : '#4a6485', 'center', w - 6, 800);
}
function dial(cx, cy, r, val, min, max, zones, label, valText, key) {
  const a0 = Math.PI * 0.78, a1 = Math.PI * 2.22, ang = v => a0 + (a1 - a0) * clamp((v - min) / (max - min), 0, 1);
  const g = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.2, cx, cy, r + 6); g.addColorStop(0, '#0d1a2c'); g.addColorStop(1, '#050b15');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r + 5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2d4a74'; ctx.lineWidth = 1.5; ctx.stroke();
  for (const [z0, z1, c] of zones) { ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(cx, cy, r - 2, ang(z0), ang(z1)); ctx.stroke(); } ctx.globalAlpha = 1;
  ctx.strokeStyle = '#6f89ab'; ctx.lineWidth = 1; for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0) * i / 10, l = i % 5 === 0 ? 7 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7)); ctx.lineTo(cx + Math.cos(a) * (r - 7 - l), cy + Math.sin(a) * (r - 7 - l)); ctx.stroke(); }
  const na = ang(smooth('dial_' + key, clamp(val, min, max), 0.16));
  ctx.save(); ctx.strokeStyle = '#ff7b6b'; ctx.lineWidth = 2; ctx.shadowColor = '#ff5468'; ctx.shadowBlur = 5; ctx.beginPath(); ctx.moveTo(cx - Math.cos(na) * 5, cy - Math.sin(na) * 5); ctx.lineTo(cx + Math.cos(na) * (r - 5), cy + Math.sin(na) * (r - 5)); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#c9d6e8'; ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, TAU); ctx.fill();
  txt(valText, cx, cy + r * 0.45, 12, '#fff', 'center', 800, MONO); fitTxt(label, cx, cy + r * 0.82, 8, '#8199b8', 'center', r * 1.7, 700);
}
function glowCol(n) { const k = clamp((Math.log10(Math.max(n, 1e-4)) + 3) / 4.2, 0, 1); return [Math.round(lerp(30, 255, Math.min(1, k * 1.5))), Math.round(lerp(70, 235, Math.max(0, k * 1.35 - 0.15))), Math.round(lerp(130, 190, Math.max(0, k * 1.5 - 0.55)))]; }
/* Fırçalanmış metal arka plan (boyuta göre önbellek) */
const BG = {};
function bgTex(w, h) {
  const k = w + 'x' + h; if (BG[k]) return BG[k];
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); let s2 = 11; const r2 = () => (s2 = (s2 * 1664525 + 1013904223) >>> 0) / 4294967296;
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0d1829'); bg.addColorStop(1, '#070d18'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < w * h / 190; i++) { g.fillStyle = `rgba(255,255,255,${0.012 + r2() * 0.02})`; g.fillRect(r2() * w, r2() * h, 20 + r2() * 60, 1); }
  for (let x = 0; x < w; x += 24) { g.fillStyle = 'rgba(95,211,255,.018)'; g.fillRect(x, 0, 1, h); }
  return (BG[k] = c);
}
/* Yerleştirme: tasarım boyutundaki paneli dikdörtgene ölçekle */
function place(r, dw, dh, fn) { const s = Math.min(r.w / dw, r.h / dh); ctx.save(); ctx.translate(r.x + (r.w - dw * s) / 2, r.y + (r.h - dh * s) / 2); ctx.scale(s, s); fn(dw, dh); ctx.restore(); }
function placeFlex(r, fn) { ctx.save(); ctx.translate(r.x, r.y); fn(r.w, r.h); ctx.restore(); }

/* ---------- Santral şeması: kayıt ve ortak çizim araçları ----------
   PLANT[tip] = function (c, S, now, H) — 158 x 146 yerel kutuya çizer (0,0 sol üst). Kutunun dışına çizmez.
   S: model durumu (S.n güç oranı, S.flow debi oranı, S.p çubuk konumu m, S.T.stroke, S.v buhar boşluğu, S.Tm, S.boron, S.az, S.destroyed, S.jammed, S.T.Pn). */
const PLANT = {};
const H = {
  TAU, clamp, lerp, rr, txt, fitTxt, glowCol, t, nf,
  tempCol(Tc) { const k = clamp((Tc - 40) / 300, 0, 1); return `rgb(${Math.round(lerp(60, 255, Math.min(1, k * 1.4)))},${Math.round(lerp(150, 120, k))},${Math.round(lerp(255, 60, k))})`; },
  pipe(pts, w, col) { ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = '#06101c'; ctx.lineWidth = w + 2.5; ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = Math.max(0.6, w * 0.25); ctx.stroke(); ctx.restore(); },
  flow(pts, speed, now, col, gap, r) {
    gap = gap || 9; r = r || 1.3; const seg = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; }
    if (L <= 0 || speed <= 0.01) return; const off = ((now / 1000) * speed) % gap; ctx.fillStyle = col;
    for (let d = off; d < L; d += gap) { let k = d, i = 0; while (i < seg.length && k > seg[i]) { k -= seg[i]; i++; } if (i >= seg.length) break; const a = pts[i], b = pts[i + 1], f = k / seg[i]; ctx.beginPath(); ctx.arc(lerp(a[0], b[0], f), lerp(a[1], b[1], f), r, 0, TAU); ctx.fill(); }
  },
  pump(x, y, r, ang, col) { ctx.save(); ctx.fillStyle = '#0b1626'; ctx.strokeStyle = col || '#7fa6d3'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.translate(x, y); ctx.rotate(ang); for (let i = 0; i < 4; i++) { ctx.rotate(TAU / 4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.5, -r * 0.2, r * 0.75, 0); ctx.stroke(); } ctx.restore(); },
  turbine(x, y, w, h, ang, glow) {
    ctx.save(); ctx.beginPath(); ctx.moveTo(x, y + h * 0.3); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h * 0.7); ctx.closePath();
    const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, '#3a5272'); g.addColorStop(1, '#1b2a40'); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#7fa6d3'; ctx.lineWidth = 1; ctx.stroke(); ctx.clip();
    const n = 7; for (let i = 0; i < n; i++) { const xx = x + ((i / n + (ang / TAU)) % 1) * w; ctx.strokeStyle = `rgba(200,225,255,${0.25 + 0.35 * (glow || 0)})`; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + 3, y + h); ctx.stroke(); }
    ctx.restore();
  },
  tank(x, y, w, h, level, col, stroke) { ctx.save(); rr(x, y, w, h, Math.min(6, w / 3)); ctx.fillStyle = '#0b1626'; ctx.fill(); ctx.clip(); const lh = h * clamp(level, 0, 1); ctx.fillStyle = col; ctx.fillRect(x, y + h - lh, w, lh); ctx.restore(); rr(x, y, w, h, Math.min(6, w / 3)); ctx.strokeStyle = stroke || '#7fa6d3'; ctx.lineWidth = 1.2; ctx.stroke(); },
  label(s, x, y, size, col, al, maxW) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 3; fitTxt(s, x, y, size || 7, col || '#9fb6d6', al || 'center', maxW || 60, 700); ctx.restore(); },
  steam(x, y, now, amount, spread) { if (amount <= 0.01) return; const n = Math.round(3 + amount * 6); for (let i = 0; i < n; i++) { const ph = ((now / 1700) + i / n) % 1, xx = x + Math.sin(i * 2.3 + now / 900) * (spread || 4) * ph, yy = y - ph * 22; ctx.fillStyle = `rgba(225,238,255,${0.45 * (1 - ph) * Math.min(1, amount * 1.5)})`; ctx.beginPath(); ctx.arc(xx, yy, 2 + ph * 5, 0, TAU); ctx.fill(); } },
  arrow(x, y, ang, size, col) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(size, 0); ctx.lineTo(-size * 0.6, size * 0.6); ctx.lineTo(-size * 0.6, -size * 0.6); ctx.closePath(); ctx.fill(); ctx.restore(); }
};
/* Yedek şema (tür modülü yoksa) */
PLANT._generic = function (c, S, now, h) {
  const k = clamp(S.n, 0, 1.5), fl = S.flow, hot = h.tempCol(150 + 180 * Math.min(1, S.n));
  h.pipe([[40, 50], [90, 50], [90, 100], [40, 100]], 4, hot); h.flow([[40, 50], [90, 50], [90, 100], [40, 100]], 30 * fl, now, '#fff');
  ctx.fillStyle = '#1d2733'; rr(14, 40, 30, 70, 8); ctx.fill(); ctx.strokeStyle = '#7fa6d3'; ctx.stroke();
  const gc = h.glowCol(S.n); ctx.fillStyle = `rgba(${gc[0]},${gc[1]},${gc[2]},.8)`; rr(18, 60, 22, 40, 5); ctx.fill();
  h.turbine(105, 40, 40, 30, now / 1000 * 6 * k, k);
  h.label(t('pl_core'), 29, 122, 7); h.label(t('pl_turb'), 125, 80, 7);
};
