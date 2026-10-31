/* ---------- Reaktör Dostu: küçük çocuklar için basit mod ----------
   Tek kol (güç) + su düğmesi. Hedef: şehrin istediği kadar elektrik üret, evlerin ışıklarını yak, maskotu serin tut.
   Patlama yok: aşırı ısınınca maskot bayılır, soğur ve bir can gider. Yıldızlarla şapka alınır. */
const HATS = [
  { id: 'party', cost: 0, ic: '🎉' }, { id: 'cap', cost: 6, ic: '🧢' }, { id: 'glasses', cost: 10, ic: '🕶' },
  { id: 'chef', cost: 15, ic: '👨‍🍳' }, { id: 'crown', cost: 24, ic: '👑' }, { id: 'wizard', cost: 32, ic: '🧙' }
];
const KLV = 12, KEV = ['night', 'evening', 'factory', 'match', 'rain', 'morning'];
const KEVD = { night: 0.3, evening: 0.85, factory: 1.0, match: 0.95, rain: 0.65, morning: 0.55 };
const kidsEl = E('kids'), kc = E('kc'), kx = kc.getContext('2d'), klev = E('klev'), kwat = E('kwater');
let K = null, kRaf = 0, kLast = 0, kW = 360, kH = 520, kS = 1;
const kSave = () => { save.kst = save.kst || 0; save.klv = save.klv || 1; save.kls = save.kls || {}; save.hats = save.hats || { party: 1 }; save.hat = save.hat || 'party'; };
/* --- Ekranlar --- */
function kidsMenu(dir) {
  kSave(); kidsStop(); playing = false;
  const lv = Array.from({ length: KLV }, (_, i) => i + 1).map(n => { const st = save.kls[n] || 0, lock = n > save.klv; return `<button class="klv ${lock ? 'lock' : st ? 'done' : 'next'}" data-a="lv" data-n="${n}" ${lock ? 'disabled' : ''}><b>${lock ? '🔒' : nf(n)}</b><span>${'★'.repeat(st)}${'☆'.repeat(lock ? 0 : 3 - st)}</span></button>`; }).join('');
  show(`${topBar('🤖 ' + t('k_title'), `<span class="crp"><i>⭐</i><b>${nf(save.kst)}</b></span>`)}
  <div class="pad"><canvas id="kbud" width="220" height="200" class="kbud"></canvas><p class="kgoal">${t('k_goal')}</p></div>
  <button class="btn go quick" data-a="play">▶ ${t('k_level', save.klv)}</button>
  <div class="klvs stag">${lv}</div>
  <div class="mini"><button class="ghost" data-a="hats">🎩 ${t('k_shop')}</button><button class="ghost" data-a="exp">🔬 ${t('k_expert')}</button></div>`, dir, {
    back: () => { SFX.back(); mainMenu('back'); },
    play: () => kidsStart(save.klv),
    lv: b => kidsStart(+b.dataset.n),
    hats: () => { SFX.open(); hatShop(() => kidsMenu('back')); },
    exp: () => { SFX.open(); mainMenu('back'); setTimeout(() => { const g = ov.querySelector('.grid'); if (g) g.scrollIntoView({ behavior: 'smooth' }); }, 400); }
  }, 'kids');
  buddyPreview(E('kbud'));
}
function hatShop(back, dir) {
  kSave();
  const card = h => { const own = save.hats[h.id], wear = save.hat === h.id, can = save.kst >= h.cost;
    return `<button class="hat ${wear ? 'wear' : own ? 'own' : can ? 'can' : 'lock'}" data-a="hat" data-h="${h.id}"><canvas width="120" height="110" data-hat="${h.id}"></canvas><b>${t('h_' + h.id)}</b><span>${wear ? t('k_wearing') : own ? t('k_wear') : '⭐ ' + nf(h.cost)}</span></button>`; };
  show(`${topBar('🎩 ' + t('k_shop'), `<span class="crp"><i>⭐</i><b class="crv">${nf(save.kst)}</b></span>`)}<div class="hats stag">${HATS.map(card).join('')}</div>`, dir, {
    back: () => { SFX.back(); back(); },
    hat: b => { const h = HATS.find(x => x.id === b.dataset.h); if (save.hats[h.id]) { save.hat = h.id; SFX.toggle(true); } else if (save.kst >= h.cost) { save.kst -= h.cost; save.hats[h.id] = 1; save.hat = h.id; SFX.buy(); buzz([20, 30, 60]); burst(b); } else { SFX.lock(); return; } persist(); setTimeout(() => hatShop(back, 'none'), 450); }
  }, 'hats');
  ov.querySelectorAll('canvas[data-hat]').forEach(c => buddyPreview(c, c.dataset.hat, 0.55));
}
function buddyPreview(c, hat, sc) { if (!c) return; const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.save(); x.translate(c.width / 2, c.height * 0.58); x.scale(sc || 0.9, sc || 0.9); drawBuddy(x, 0, 0, 0.6, 0.15, 0, performance.now(), hat || save.hat); x.restore(); }
/* --- Oyun --- */
function kidsStart(n) {
  kSave(); audioInit(); hide(); SFX.start();
  const L = Math.min(KLV, Math.max(1, n));
  K = { L, t: 0, dur: 40 + L * 4, P: 0.2, D: 0.5, Dt: 0.5, H: 0, hearts: 3, faint: 0, water: 0, cool: 0, green: 0, tot: 0, coin: 0, earned: 0, ev: 'morning', evT: 0, nextEv: 6, msg: t('k_tip1'), msgT: 4, night: 0, pops: [], drops: [], blink: 0, end: false };
  klev.value = 20; kidsEl.hidden = false; kidsResize(); kLast = performance.now(); cancelAnimationFrame(kRaf); kRaf = requestAnimationFrame(kidsLoop);
}
function kidsStop() { cancelAnimationFrame(kRaf); kidsEl.hidden = true; K = null; }
klev.addEventListener('input', () => { audioInit(); });
kwat.addEventListener('click', () => { if (!K || K.cool > 0 || K.faint > 0) return; audioInit(); K.water = 1.3; K.cool = 3.5; tone(500, 0.35, 'sine', 0.06, 0.4); buzz(25); for (let i = 0; i < 40; i++) K.drops.push({ x: 0.3 + Math.random() * 0.1, y: 0.25, vx: (Math.random() - 0.5) * 0.5, vy: Math.random() * 0.3, t: 0 }); });
E('kpause').addEventListener('click', () => { if (!K) return; SFX.click(); const k = K; cancelAnimationFrame(kRaf); show(`<div class="pad" style="margin-top:12vh"><div class="pz">II</div><h2>${t('paused')}</h2></div><div class="pad stag"><button class="btn" data-a="resume">▶ ${t('resume')}</button><button class="ghost w" data-a="restart">⟲ ${t('restart')}</button><button class="ghost w" data-a="quit">⌂ ${t('menu')}</button></div>`, 'up', { resume: () => { hide(); K = k; kLast = performance.now(); kRaf = requestAnimationFrame(kidsLoop); }, restart: () => kidsStart(k.L), quit: () => kidsMenu('back') }, 'kpause'); });
function kidsResize() { const r = kc.parentElement.getBoundingClientRect(), ar = r.width / Math.max(1, r.height); if (ar >= 1) { kH = 520; kW = clamp(Math.round(520 * ar), 360, 1000); } else { kW = 360; kH = clamp(Math.round(360 / ar), 420, 700); } kS = Math.min(r.width / kW, r.height / kH); const d = Math.min(2.5, devicePixelRatio || 1); kc.style.width = kW * kS + 'px'; kc.style.height = kH * kS + 'px'; kc.width = kW * kS * d; kc.height = kH * kS * d; kx.setTransform(kS * d, 0, 0, kS * d, 0, 0); }
window.addEventListener('resize', () => { if (K) kidsResize(); });
function kSay(k, dur) { K.msg = t(k); K.msgT = dur || 3.5; }
function kidsTick(dt) {
  const k = K, f = 1 + k.L * 0.07; k.t += dt;
  // olaylar: şehrin ihtiyacı değişir
  if (k.t >= k.nextEv) { let e; do { e = KEV[Math.floor(Math.random() * KEV.length)]; } while (e === k.ev); k.ev = e; k.Dt = clamp(KEVD[e] + (Math.random() - 0.5) * 0.1 * k.L / 4, 0.2, 1.05); k.nextEv = k.t + Math.max(6, 13 - k.L * 0.6); kSay('k_ev_' + e, 3.5); SFX.open(); }
  k.D += (k.Dt - k.D) * (1 - Math.exp(-dt / Math.max(0.6, 2.2 - k.L * 0.12)));
  k.night += ((k.ev === 'night' || k.ev === 'evening' || k.ev === 'match' ? 1 : 0) - k.night) * dt * 0.8;
  const lever = klev.value / 100;
  if (k.faint > 0) { k.faint -= dt; k.P += (0 - k.P) * dt * 3; k.H = Math.max(0, k.H - dt * 0.4); if (k.faint <= 0) { klev.value = 25; kSay('k_back', 2.5); } }
  else k.P += (lever * 1.25 - k.P) * (1 - Math.exp(-dt / 1.1));
  const over = Math.max(0, k.P - k.D - 0.15), waterOn = k.water > 0;
  k.H = clamp(k.H + (0.16 * (k.P - 0.75) + 0.5 * over - 0.04) * dt * f - (waterOn ? 0.75 * dt : 0), 0, 1.05);
  if (k.water > 0) k.water -= dt; if (k.cool > 0) k.cool -= dt;
  if (k.H >= 1 && k.faint <= 0) { k.faint = 3.2; k.hearts--; kSay('k_faint', 3); SFX.fail(); buzz([60, 40, 120]); if (k.hearts <= 0) return kidsEnd(false); }
  const ok = Math.abs(k.P - k.D) < 0.12 && k.faint <= 0; k.tot += dt; if (ok) { k.green += dt; k.coin += dt; }
  if (k.coin >= 2.5) { k.coin = 0; k.earned++; k.pops.push({ t: 0 }); SFX.coin(k.earned); }
  if (k.msgT <= 0 && k.faint <= 0) { if (k.H > 0.75) kSay('k_too_hot', 2); else if (k.P < k.D - 0.2) kSay('k_low', 2); else if (ok && Math.random() < dt * 0.3) kSay('k_good', 2); }
  k.msgT -= dt;
  if (k.H > 0.75 && Math.floor(k.t * 2) !== Math.floor((k.t - dt) * 2)) tone(980, 0.06, 'square', 0.03);
  if (k.t >= k.dur) kidsEnd(true);
}
function kidsEnd(alive) {
  const k = K; if (!k || k.end) return; k.end = true; cancelAnimationFrame(kRaf);
  const pct = Math.round(k.green / Math.max(1, k.tot) * 100), st = !alive ? 0 : pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 35 ? 1 : 0;
  const prev = save.kls[k.L] || 0, bonus = Math.max(0, st - prev) * 3, gain = k.earned + bonus;
  save.kst = (save.kst || 0) + gain; if (st > prev) save.kls[k.L] = st; if (st > 0 && k.L >= save.klv) save.klv = Math.min(KLV, k.L + 1); persist();
  show(`<div class="pad" style="margin-top:20px"><canvas id="kbud" width="220" height="200" class="kbud"></canvas><h2>${t(st ? 'k_win' : 'k_lose')}</h2><p>${t('k_level', k.L)}</p></div>
  <div class="rep"><div class="stars" id="stars">${[0, 1, 2].map(() => '<i>★</i>').join('')}</div>
  <div class="earn"><span class="plus">+${nf(gain)} ⭐</span></div>
  <div class="btnrow">${st && k.L < KLV ? `<button class="btn go" data-a="next">${t('k_next')} ▶</button>` : `<button class="btn go" data-a="again">⟲ ${t('again')}</button>`}<button class="ghost" data-a="again2">⟲</button><button class="ghost" data-a="hats">🎩 ${t('k_shop')}</button><button class="ghost" data-a="menu">${t('menu')}</button></div></div>`, 'up', {
    next: () => kidsStart(k.L + 1), again: () => kidsStart(k.L), again2: () => kidsStart(k.L),
    hats: () => { SFX.open(); hatShop(() => kidsMenu('back')); }, menu: () => { SFX.back(); kidsMenu('back'); }
  }, 'kend');
  kidsEl.hidden = true; K = null;
  const c = E('kbud'); if (c) { const x = c.getContext('2d'); x.translate(110, 116); drawBuddy(x, 0, 0, st ? 0.7 : 0.2, st ? 0.1 : 0.5, st ? 0 : 1, performance.now(), save.hat, st ? 'joy' : 'sad'); }
  const stars = E('stars'); for (let i = 0; i < st; i++) setTimeout(() => { stars.children[i].classList.add('on'); SFX.star(i); if (i === 2) burst(stars); }, 500 + i * 380);
  if (st) setTimeout(() => SFX.win(), 600 + st * 380); else SFX.fail();
}
function kidsLoop(now) {
  if (!K) return; const dt = Math.min(0.05, (now - kLast) / 1000); kLast = now;
  kidsTick(dt); if (!K) return; kidsDraw(now); kidsHud();
  kRaf = requestAnimationFrame(kidsLoop);
}
function kidsHud() {
  const k = K; E('khl').textContent = t('k_level', k.L); E('khh').textContent = '❤'.repeat(Math.max(0, k.hearts)) + '🤍'.repeat(Math.max(0, 3 - k.hearts));
  E('khs').textContent = '⭐ ' + nf((save.kst || 0) + k.earned); E('khb').style.width = clamp(k.t / k.dur * 100, 0, 100) + '%';
  kwat.classList.toggle('cd', k.cool > 0); kwat.style.setProperty('--cd', clamp(k.cool / 3.5, 0, 1)); kwat.classList.toggle('hot', k.H > 0.7 && k.cool <= 0);
}
/* --- Çizim --- */
function drawBuddy(x, cx, cy, P, H, faint, now, hat, mood) {
  const R = 46, hot = clamp(H, 0, 1), col = hot < 0.4 ? [95, 211, 255] : hot < 0.7 ? [255, 210, 63] : [255, 110, 70], wob = RM() ? 0 : Math.sin(now / 300) * 2 * (1 + hot * 2);
  x.save(); x.translate(cx, cy + wob);
  const g = x.createRadialGradient(0, 0, 10, 0, 0, R * 2.2); g.addColorStop(0, `rgba(${col},${0.35 + P * 0.3})`); g.addColorStop(1, `rgba(${col},0)`); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * 2.2, 0, TAU); x.fill();
  const b = x.createRadialGradient(-14, -18, 6, 0, 0, R); b.addColorStop(0, '#ffffff'); b.addColorStop(0.35, `rgb(${col})`); b.addColorStop(1, `rgb(${col.map(v => Math.round(v * 0.55))})`);
  x.fillStyle = b; x.beginPath(); x.ellipse(0, 0, R, R * 0.95, 0, 0, TAU); x.fill(); x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.25)'; x.stroke();
  x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.ellipse(-16, -22, 10, 6, -0.5, 0, TAU); x.fill(); // parlama
  x.fillStyle = 'rgba(255,120,150,.45)'; x.beginPath(); x.arc(-26, 10, 7, 0, TAU); x.arc(26, 10, 7, 0, TAU); x.fill(); // yanaklar
  const blink = !RM() && (now % 3200) < 140;
  x.fillStyle = '#152238'; x.strokeStyle = '#152238'; x.lineWidth = 3.5; x.lineCap = 'round';
  if (faint) { for (const ex of [-16, 16]) { x.beginPath(); for (let a = 0; a < 12; a += 0.4) { const rr2 = a * 0.8; x.lineTo(ex + Math.cos(a + now / 200) * rr2, -6 + Math.sin(a + now / 200) * rr2); } x.lineWidth = 2; x.stroke(); } }
  else if (mood === 'joy') { for (const ex of [-16, 16]) { x.beginPath(); x.arc(ex, -4, 7, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); } }
  else for (const ex of [-16, 16]) { if (blink) { x.beginPath(); x.moveTo(ex - 6, -6); x.lineTo(ex + 6, -6); x.stroke(); } else { x.beginPath(); x.ellipse(ex, -6, 6, hot > 0.7 ? 9 : 8, 0, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 2, -9, 2.4, 0, TAU); x.fill(); x.fillStyle = '#152238'; } }
  x.beginPath(); x.lineWidth = 3.5;
  if (faint) { x.arc(0, 18, 5, 0, TAU); x.stroke(); }
  else if (mood === 'sad' || hot > 0.75) { x.arc(0, 24, 9, Math.PI * 1.15, Math.PI * 1.85); x.stroke(); }
  else if (hot > 0.45) { x.moveTo(-8, 16); x.lineTo(8, 16); x.stroke(); }
  else { x.arc(0, 10, 12, Math.PI * 0.15, Math.PI * 0.85); x.stroke(); }
  if (hot > 0.45 && !faint) for (let i = 0; i < 2; i++) { const ph = RM() ? 0.3 : ((now / 700) + i * 0.5) % 1; x.fillStyle = `rgba(120,200,255,${1 - ph})`; x.beginPath(); const sx = i ? 34 : -36, sy = -20 + ph * 26; x.moveTo(sx, sy - 6); x.quadraticCurveTo(sx + 5, sy + 2, sx, sy + 4); x.quadraticCurveTo(sx - 5, sy + 2, sx, sy - 6); x.fill(); }
  if (faint) { x.fillStyle = '#e6f0ff'; x.font = `800 16px ${FONT}`; x.fillText('z', 36, -40 - (now / 40) % 12); x.font = `800 12px ${FONT}`; x.fillText('z', 48, -56 - (now / 50) % 10); }
  drawHat(x, hat || 'party', R, now);
  x.restore();
}
function drawHat(x, h, R, now) {
  x.save(); x.translate(0, -R * 0.82);
  if (h === 'party') { x.fillStyle = '#ff5fa2'; x.beginPath(); x.moveTo(-18, 6); x.lineTo(0, -38); x.lineTo(18, 6); x.closePath(); x.fill(); x.fillStyle = '#ffd23f'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(-8 + i * 8, -6 - i * 9, 3, 0, TAU); x.fill(); } x.beginPath(); x.arc(0, -40, 5, 0, TAU); x.fill(); }
  else if (h === 'cap') { x.fillStyle = '#e8334a'; x.beginPath(); x.arc(0, 4, 26, Math.PI, 0); x.fill(); x.fillRect(4, 0, 38, 7); x.fillStyle = '#fff'; x.beginPath(); x.arc(0, -20, 3, 0, TAU); x.fill(); }
  else if (h === 'chef') { x.fillStyle = '#fff'; x.fillRect(-20, -6, 40, 12); for (const [dx, r] of [[-14, 12], [0, 15], [14, 12]]) { x.beginPath(); x.arc(dx, -16, r, 0, TAU); x.fill(); } }
  else if (h === 'crown') { x.fillStyle = '#ffd23f'; x.beginPath(); x.moveTo(-24, 8); x.lineTo(-24, -14); x.lineTo(-12, -2); x.lineTo(0, -20); x.lineTo(12, -2); x.lineTo(24, -14); x.lineTo(24, 8); x.closePath(); x.fill(); x.fillStyle = '#ff5468'; x.beginPath(); x.arc(0, -2, 4, 0, TAU); x.fill(); x.fillStyle = '#5fd3ff'; x.beginPath(); x.arc(-14, 2, 3, 0, TAU); x.arc(14, 2, 3, 0, TAU); x.fill(); }
  else if (h === 'wizard') { x.fillStyle = '#6b4bff'; x.beginPath(); x.moveTo(-26, 8); x.lineTo(6, -46); x.lineTo(26, 8); x.closePath(); x.fill(); x.fillStyle = '#ffd23f'; x.font = '14px sans-serif'; x.fillText('★', -8, -6); x.fillText('✦', 4, -22); }
  else if (h === 'glasses') { x.translate(0, R * 0.82 - 6); x.fillStyle = '#111'; x.beginPath(); x.ellipse(-16, 0, 13, 9, 0, 0, TAU); x.ellipse(16, 0, 13, 9, 0, 0, TAU); x.fill(); x.fillRect(-4, -3, 8, 3); x.fillStyle = 'rgba(255,255,255,.35)'; x.fillRect(-24, -5, 6, 3); x.fillRect(8, -5, 6, 3); }
  x.restore();
}
function kidsDraw(now) {
  const k = K, x = kx, W = kW, Hh = kH, n = k.night, gy = Hh * 0.62;
  // gökyüzü
  const sky = x.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, `rgb(${lerp(110, 12, n)},${lerp(200, 26, n)},${lerp(255, 70, n)})`); sky.addColorStop(1, `rgb(${lerp(200, 40, n)},${lerp(236, 64, n)},${lerp(255, 120, n)})`); x.fillStyle = sky; x.fillRect(0, 0, W, Hh);
  if (n > 0.3) { x.fillStyle = `rgba(255,255,255,${(n - 0.3) * 1.2})`; for (let i = 0; i < 30; i++) { const sx = (i * 97) % W, sy = (i * 53) % (gy * 0.7); x.fillRect(sx, sy, 1.6, 1.6); } }
  const sunY = lerp(50, gy + 40, n); x.fillStyle = '#ffe066'; x.beginPath(); x.arc(W - 110, sunY, 22, 0, TAU); x.fill(); x.fillStyle = `rgba(240,244,255,${n})`; x.beginPath(); x.arc(56, lerp(gy + 40, 50, n), 16, 0, TAU); x.fill();
  // tepeler
  x.fillStyle = `rgb(${lerp(110, 20, n)},${lerp(200, 70, n)},${lerp(110, 60, n)})`; x.beginPath(); x.moveTo(0, gy); for (let i = 0; i <= 12; i++) x.lineTo(i * W / 12, gy - 14 - Math.sin(i * 1.3) * 10); x.lineTo(W, Hh); x.lineTo(0, Hh); x.fill();
  x.fillStyle = `rgb(${lerp(80, 14, n)},${lerp(170, 50, n)},${lerp(90, 40, n)})`; x.fillRect(0, gy + 30, W, Hh);
  // soğutma kulesi ve buhar
  const tx = 40, ty = gy - 70; x.fillStyle = '#c9d6e8'; x.beginPath(); x.moveTo(tx - 22, gy + 6); x.quadraticCurveTo(tx - 10, ty + 40, tx - 16, ty); x.lineTo(tx + 16, ty); x.quadraticCurveTo(tx + 10, ty + 40, tx + 22, gy + 6); x.fill();
  for (let i = 0; i < 6; i++) { const ph = RM() ? 0.4 : ((now / 2200) + i / 6) % 1; x.fillStyle = `rgba(255,255,255,${(1 - ph) * 0.8 * clamp(k.P, 0.15, 1)})`; x.beginPath(); x.arc(tx + Math.sin(i * 2 + now / 900) * 8 * ph, ty - ph * 60, 10 + ph * 16, 0, TAU); x.fill(); }
  // elektrik hattı ve kıvılcımlar
  const lx0 = 150, ly = gy - 50, lx1 = W - 20; x.strokeStyle = '#3a4a62'; x.lineWidth = 3; x.beginPath(); x.moveTo(lx0, ly); x.quadraticCurveTo((lx0 + lx1) / 2, ly + 24, lx1, ly - 4); x.stroke();
  const sp = Math.min(k.P, 1.3); for (let i = 0; i < 6; i++) { const ph = ((now / 1000) * sp * 0.8 + i / 6) % 1, px = lerp(lx0, lx1, ph), py = ly + Math.sin(ph * Math.PI) * 12 - ph * 4; x.fillStyle = `rgba(255,230,90,${sp > 0.05 ? 0.95 : 0})`; x.beginPath(); x.arc(px, py, 3.5, 0, TAU); x.fill(); }
  // şehir
  const cols = clamp(Math.round((W - 230) / 52), 4, 12), houses = cols * 2, lit = clamp(Math.round(houses * Math.min(1, k.P / Math.max(0.05, k.D)) + 0.01), 0, houses), hw = (W - 230 + 60) / cols;
  for (let i = 0; i < houses; i++) { const col = i % cols, row = Math.floor(i / cols), hx = 160 + col * hw, hy = gy + 6 + row * 64, hh = 40 + (i * 7) % 14;
    x.fillStyle = ['#ff8a65', '#ffd54f', '#81c784', '#64b5f6'][i % 4]; x.fillRect(hx, hy - hh + 40, hw - 10, hh); x.fillStyle = '#7b4b3a'; x.beginPath(); x.moveTo(hx - 4, hy - hh + 40); x.lineTo(hx + (hw - 10) / 2, hy - hh + 22); x.lineTo(hx + hw - 6, hy - hh + 40); x.fill();
    const on = i < lit; x.fillStyle = on ? '#fff59d' : '#37474f'; if (on) { x.save(); x.shadowColor = '#ffee58'; x.shadowBlur = 12; }
    x.fillRect(hx + 6, hy - hh + 48, 10, 10); x.fillRect(hx + hw - 26, hy - hh + 48, 10, 10); if (on) x.restore(); }
  if (k.P > k.D + 0.2 && !RM()) for (let i = 0; i < 4; i++) { x.fillStyle = 'rgba(255,240,120,.9)'; x.fillRect(160 + Math.random() * (W - 180), gy - 10 + Math.random() * 120, 3, 3); }
  // ihtiyaç göstergesi
  const mx = W - 30, my0 = 70, mh = gy - 120; x.fillStyle = 'rgba(10,20,36,.65)'; rrK(x, mx - 12, my0 - 10, 24, mh + 20, 10); x.fill();
  const yv = v => my0 + mh - clamp(v / 1.3, 0, 1) * mh; x.fillStyle = 'rgba(70,224,160,.85)'; x.fillRect(mx - 9, yv(k.D + 0.12), 18, yv(k.D - 0.12) - yv(k.D + 0.12));
  x.fillStyle = '#fff'; x.beginPath(); x.moveTo(mx - 16, yv(k.P)); x.lineTo(mx - 8, yv(k.P) - 6); x.lineTo(mx - 8, yv(k.P) + 6); x.fill(); x.fillRect(mx - 10, yv(k.P) - 1.5, 20, 3);
  x.font = `800 16px ${FONT}`; x.textAlign = 'center'; x.fillText('🏠', mx, my0 - 20);
  // maskot (reaktör binası önünde)
  x.fillStyle = '#d0dae8'; x.beginPath(); x.arc(100, gy + 6, 56, Math.PI, 0); x.fill(); x.fillStyle = '#a8b6ca'; x.fillRect(44, gy + 4, 112, 26);
  { const bs = W > 500 ? 1.4 : 1; x.save(); x.translate(100, gy - 40 * bs); x.scale(bs, bs); drawBuddy(x, 0, 0, k.P, k.H, k.faint > 0 ? 1 : 0, now, save.hat); x.restore(); }
  // su
  if (k.water > 0 || k.drops.length) { k.drops = k.drops.filter(d => { d.t += 0.016; d.x += d.vx * 0.016; d.y += (d.vy + d.t * 1.4) * 0.016; x.fillStyle = 'rgba(120,200,255,.85)'; x.beginPath(); x.arc(d.x * W, d.y * Hh + gy * 0.4, 3, 0, TAU); x.fill(); return d.t < 0.9; }); }
  // ısı çubuğu
  const hx2 = 40, hy2 = gy + 96, hw2 = 120; x.fillStyle = 'rgba(10,20,36,.6)'; rrK(x, hx2 - 4, hy2 - 4, hw2 + 8, 18, 9); x.fill();
  const hg = x.createLinearGradient(hx2, 0, hx2 + hw2, 0); hg.addColorStop(0, '#5fd3ff'); hg.addColorStop(0.55, '#ffd23f'); hg.addColorStop(1, '#ff5468'); x.fillStyle = hg; rrK(x, hx2, hy2, hw2 * clamp(k.H, 0.02, 1), 10, 5); x.fill();
  x.font = `16px ${FONT}`; x.textAlign = 'left'; x.fillText('🌡', hx2 - 26, hy2 + 9);
  // konuşma balonu
  if (k.msgT > 0 && k.msg) { x.font = `800 ${13 * FS}px ${FONT}`; const lines = kWrap(x, k.msg, 170), bw = 186, bh = 14 + lines.length * 16, bx = 14, by = gy - 150 - bh; x.fillStyle = 'rgba(255,255,255,.95)'; rrK(x, bx, by, bw, bh, 12); x.fill(); x.beginPath(); x.moveTo(80, by + bh); x.lineTo(92, by + bh + 12); x.lineTo(100, by + bh); x.fill(); x.fillStyle = '#152238'; x.textAlign = 'left'; x.textBaseline = 'middle'; lines.forEach((l, i) => x.fillText(l, bx + 10, by + 15 + i * 16)); }
  // yıldız uçuşu
  k.pops = k.pops.filter(p => { p.t += 0.016; const a = p.t / 0.9, px = lerp(260, W - 40, a), py = lerp(gy + 20, 10, a) - Math.sin(a * Math.PI) * 40; x.font = `${22 - a * 8}px sans-serif`; x.textAlign = 'center'; x.fillText('⭐', px, py); return a < 1; });
}
function rrK(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function kWrap(x, s, mw) { const parts = CJK ? Array.from(s) : s.split(' '), sep = CJK ? '' : ' ', out = []; let l = ''; for (const p of parts) { const tt = l ? l + sep + p : p; if (x.measureText(tt).width > mw && l) { out.push(l); l = p; } else l = tt; } if (l) out.push(l); return out.slice(0, 4); }
