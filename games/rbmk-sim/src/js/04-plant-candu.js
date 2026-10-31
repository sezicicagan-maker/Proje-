/* ---------- Santral şeması: CANDU (basınçlı ağır su, yatay kanallar) ----------
   Birincil (ağır su): kalandriya içindeki yatay basınç tüpleri -> çıkış başlığı (sağ) -> sıcak bacak -> buhar üreteci (U tüpler)
   -> ısı taşıma pompası -> giriş başlığı (sol) -> kanallar. Moderatör: kalandriyadaki soğuk ağır su.
   Reaktivite güvertesi (üstte): ayar çubukları S.p / S.T.stroke kadar içeride; SDS1 kapatma çubukları açmada düşer;
   SDS2 sol üstteki tanktan sıvı zehir (gadolinyum nitrat) püskürtür. İkincil: buhar üreteci -> türbin -> kondenser -> besi pompası.
   Yalnız çizim: S değiştirilmez. */
PLANT.candu = (() => {
  const TAU = Math.PI * 2;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  /* --- Geometri (158 x 146 kutu) --- */
  const CAL = { x0: 10, x1: 78, y0: 62, y1: 104 };                  // kalandriya gövdesi
  const ROWS = [68, 74.5, 81, 87.5, 94, 100.5].map(y => y - 1.5);       // yatay kanal sıraları
  const ADJ = [24, 36, 52, 64];                                         // ayar çubukları
  const SD1 = [30, 44, 58];                                             // SDS1 kapatma çubukları
  const DECK = { x0: 16, x1: 72, y0: 52, y1: 58 };
  const HDR_L = 5, HDR_R = 83;                                          // giriş / çıkış başlıkları
  const SG = { x0: 92, x1: 112, y0: 14, y1: 66, ts: 58 };               // buhar üreteci, tüp plakası
  const TB = { x0: 120, x1: 142, cy: 24, h0: 5, h1: 10 };
  const GEN = { x: 144, y: 17, w: 12, h: 14 };
  const CND = { x: 120, y: 42, w: 34, h: 38 };
  const FWP = { x: 137, y: 94, r: 4.2 }, HTP = { x: 108, y: 124, r: 5 };
  const TANK = { x: 3, y: 22, w: 10, h: 16 };                           // SDS2 zehir tankı
  const P = {
    hot: [[HDR_R + 1, 80], [96, 80], [96, SG.y1]],
    cold: [[108, SG.y1], [108, HTP.y - HTP.r]],
    ret: [[HTP.x - HTP.r, HTP.y], [HDR_L, HTP.y], [HDR_L, CAL.y1]],
    steam: [[102, SG.y0], [102, 8], [114, 8], [114, TB.cy], [TB.x0, TB.cy]],
    hood: [[131, TB.cy + 9], [131, CND.y]],
    cnd: [[FWP.x, CND.y + CND.h], [FWP.x, FWP.y - FWP.r]],
    feed: [[FWP.x, FWP.y + FWP.r], [FWP.x, 104], [116, 104], [116, 46], [SG.x1, 46]],
    poison: [[TANK.x + TANK.w / 2, TANK.y + TANK.h], [TANK.x + TANK.w / 2, 46], [14, 46], [14, CAL.y0 + 3]]
  };
  const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  let G = null, Gc = null;
  function grads(c) {
    if (G && Gc === c) return G; Gc = c;
    const v = (y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
    const h = (x0, x1, a, b, m) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, a); g.addColorStop(0.4, m); g.addColorStop(1, b); return g; };
    G = { cal: v(CAL.y0, CAL.y1, '#16314f', '#0b1a2e'), sg: h(SG.x0, SG.x1, '#1a2940', '#152238', '#34496a'), cn: v(CND.y, CND.y + CND.h, '#18293f', '#0c1626'),
      deck: v(DECK.y0, DECK.y1, '#2b3f5c', '#18263b'), gn: v(GEN.y, GEN.y + GEN.h, '#35496a', '#17243a'), tank: v(TANK.y, TANK.y + TANK.h, '#24384f', '#132033') };
    return G;
  }
  function line(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
  return function (c, S, now, H) {
    const dead = !!S.destroyed, trip = !!S.az && !dead, t = now / 1000;
    const n = dead ? 0 : Math.max(0, S.n), k = cl(n, 0, 1.2), flow = dead ? 0 : cl(S.flow, 0, 1.2);
    const ins = cl(S.p / S.T.stroke, 0, 1), azT = S.azT || 0, g = grads(c), gc = H.glowCol(n);
    const hot = H.tempCol(dead ? 360 : 200 + 110 * Math.min(1.2, k)), cold = H.tempCol(dead ? 300 : 150 + 20 * k); // ~310 °C çıkış, ~266 °C giriş: ayırt edilebilir renk ölçeği
    const steamAmt = dead ? 0 : cl(n, 0, 1.1), turbK = trip ? Math.max(0, 1 - azT / 25) * Math.min(1, steamAmt + 0.2) : steamAmt;
    /* İkincil devre: buhar hattı, türbin, jeneratör, kondenser, besi suyu */
    H.pipe(P.steam, 3, steamAmt > 0.03 ? '#dfe9f6' : '#5d7698'); H.flow(P.steam, 26 * steamAmt, now, '#ffffff', 7, 1);
    H.pipe(P.hood, 6, '#22344f');
    H.turbine(TB.x0, TB.cy - TB.h1, TB.x1 - TB.x0, TB.h1 * 2, t * 7 * turbK, turbK);
    c.save(); H.rr(GEN.x, GEN.y, GEN.w, GEN.h, 3); c.fillStyle = g.gn; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1; c.stroke();
    c.strokeStyle = turbK > 0.05 ? `rgba(255,210,63,${0.4 + 0.6 * Math.min(1, turbK)})` : '#4b607d'; c.lineWidth = 1.2; c.beginPath();
    for (let i = 0; i <= 12; i++) { const x = GEN.x + 2 + i * (GEN.w - 4) / 12, y = GEN.y + GEN.h / 2 + Math.sin(i / 12 * TAU + t * 6 * turbK) * 3.2; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
    c.fillStyle = '#0b1626'; c.fillRect(TB.x1, TB.cy - 1, GEN.x - TB.x1, 2);
    H.rr(CND.x, CND.y, CND.w, CND.h, 5); c.fillStyle = g.cn; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(70,140,220,.35)'; c.fillRect(CND.x + 1, CND.y + CND.h - 8, CND.w - 2, 7);
    c.fillStyle = 'rgba(95,211,255,.55)'; for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(CND.x + 5 + i * 4.8 + (r % 2) * 2.4, CND.y + 9 + r * 4.5, 1.1, 0, TAU); c.fill(); }
    if (trip && azT < 30) H.steam(CND.x + 9, CND.y + 8, now, 0.5 * (1 - azT / 30), 3);
    H.pipe(P.cnd, 2.2, '#3f8ed8'); H.pipe(P.feed, 2.2, '#3f8ed8'); H.flow(P.feed, 14 * Math.max(0.15, steamAmt), now, '#bfe6ff', 8, 0.9);
    H.pump(FWP.x, FWP.y, FWP.r, t * 8 * Math.max(0.2, steamAmt), '#7fa6d3');
    /* Birincil devre: sıcak bacak, buhar üreteci, ısı taşıma pompası, dönüş */
    H.pipe(P.hot, 3, hot); H.pipe(P.cold, 3, cold); H.pipe(P.ret, 3, cold);
    const pf = 22 * flow; H.flow(P.hot, pf, now, '#fff4e6', 8, 1); H.flow(P.cold, pf, now, '#e6f4ff', 8, 1); H.flow(P.ret, pf, now, '#e6f4ff', 8, 1);
    H.pump(HTP.x, HTP.y, HTP.r, t * 10 * flow, '#7fa6d3');
    c.save(); c.beginPath(); c.moveTo(SG.x0, SG.y0 + 10); c.quadraticCurveTo(SG.x0, SG.y0, (SG.x0 + SG.x1) / 2, SG.y0); c.quadraticCurveTo(SG.x1, SG.y0, SG.x1, SG.y0 + 10);
    c.lineTo(SG.x1, SG.y1 - 4); c.quadraticCurveTo(SG.x1, SG.y1, SG.x1 - 4, SG.y1); c.lineTo(SG.x0 + 4, SG.y1); c.quadraticCurveTo(SG.x0, SG.y1, SG.x0, SG.y1 - 4); c.closePath();
    c.fillStyle = g.sg; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1; c.stroke(); c.clip();
    c.fillStyle = 'rgba(60,130,210,.28)'; c.fillRect(SG.x0, 36, SG.x1 - SG.x0, SG.ts - 36);
    for (let i = 0; i < 4; i++) { const r = 2 + i * 1.8, x = (SG.x0 + SG.x1) / 2; c.strokeStyle = i % 2 ? hot : cold; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x - r, SG.ts); c.lineTo(x - r, 40 - r * 0.6); c.arc(x, 40 - r * 0.6, r, Math.PI, 0); c.lineTo(x + r, SG.ts); c.stroke(); }
    if (!RM() && steamAmt > 0.05) for (let i = 0; i < 6; i++) { const ph = (t * 0.8 + hash(i)) % 1; c.fillStyle = `rgba(230,245,255,${0.6 * (1 - ph) * steamAmt})`; c.beginPath(); c.arc(SG.x0 + 4 + hash(i + 9) * 12, 36 - ph * 18, 0.9 + ph, 0, TAU); c.fill(); }
    c.fillStyle = '#4b607d'; c.fillRect(SG.x0, SG.ts, SG.x1 - SG.x0, 1.6); c.restore();
    c.strokeStyle = 'rgba(159,182,214,.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(80, 20); c.lineTo(SG.x0 - 1, 24); c.stroke();
    /* SDS2 zehir tankı ve hattı */
    const poisonK = trip ? cl(azT / 0.6, 0, 1) : 0, plumeA = trip ? Math.max(0.25, 1 - azT / 40) : 0;
    H.rr(TANK.x, TANK.y, TANK.w, TANK.h, 3); c.fillStyle = g.tank; c.fill(); c.strokeStyle = trip ? '#46e0a0' : '#7fa6d3'; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(70,224,160,.55)'; const lv = (TANK.h - 3) * (1 - 0.8 * poisonK); c.fillRect(TANK.x + 1.5, TANK.y + TANK.h - 1.5 - lv, TANK.w - 3, lv);
    H.pipe(P.poison, 1.4, trip ? '#46e0a0' : '#4b607d'); if (trip && azT < 6) H.flow(P.poison, 40, now, '#d9fff0', 5, 0.8);
    /* Kalandriya */
    c.save(); H.rr(CAL.x0, CAL.y0, CAL.x1 - CAL.x0, CAL.y1 - CAL.y0, 8); c.fillStyle = g.cal; c.fill(); c.clip();
    for (let i = 0; i < ROWS.length; i++) {
      const y = ROWS[i], prof = 0.55 + 0.45 * Math.cos((i - 2.5) / 3 * 1.2);
      c.fillStyle = '#0a111d'; c.fillRect(CAL.x0, y - 1.9, CAL.x1 - CAL.x0, 3.8);
      for (let x = CAL.x0 + 2; x < CAL.x1 - 2; x += 4) {
        const ax = Math.cos((x - (CAL.x0 + CAL.x1) / 2) / ((CAL.x1 - CAL.x0) / 2) * 1.25), fl = RM() || dead ? 1 : 0.9 + 0.1 * Math.sin(t * 4 + x * 0.7 + i), a = dead ? 0.25 : cl((0.15 + 0.85 * ax * prof) * Math.min(1, 0.25 + Math.log10(Math.max(n, 1e-4) * 1e4) / 4), 0.06, 1) * fl;
        c.fillStyle = dead ? `rgba(255,84,104,${0.5 * ax})` : `rgba(${gc[0]},${gc[1]},${gc[2]},${a})`; c.fillRect(x, y - 1.3, 3.2, 2.6);
      }
      if (S.v > 0.02 && !dead) { c.fillStyle = `rgba(230,246,255,${Math.min(0.8, S.v * 6)})`; for (let j = 0; j < 4; j++) { const ph = RM() ? 0.5 : (t * 0.6 + hash(i * 7 + j)) % 1; c.beginPath(); c.arc(CAL.x0 + 6 + ph * (CAL.x1 - CAL.x0 - 12), y, 0.7, 0, TAU); c.fill(); } }
    }
    if (trip) { // SDS2: gadolinyum bulutu üst nozuldan moderatöre yayılır
      const R = 6 + 60 * cl(azT / 4, 0, 1), gr = c.createRadialGradient(14, CAL.y0 + 4, 1, 14, CAL.y0 + 4, R);
      gr.addColorStop(0, `rgba(70,224,160,${0.45 * plumeA})`); gr.addColorStop(1, 'rgba(70,224,160,0)'); c.fillStyle = gr; c.fillRect(CAL.x0, CAL.y0, CAL.x1 - CAL.x0, CAL.y1 - CAL.y0);
    }
    for (const x of ADJ) { const L = 4 + ins * (CAL.y1 - CAL.y0 - 8); c.fillStyle = '#05080d'; c.fillRect(x - 1.6, CAL.y0, 3.2, L); c.fillStyle = '#9fb4d0'; c.fillRect(x - 0.9, CAL.y0, 1.8, L); }
    const drop = trip ? cl(azT / 1.0, 0, 1) : 0;
    for (const x of SD1) { const L = drop * (CAL.y1 - CAL.y0 - 4); if (L > 0.5) { c.fillStyle = '#05080d'; c.fillRect(x - 1.8, CAL.y0, 3.6, L); c.fillStyle = '#ff7b8a'; c.fillRect(x - 1.1, CAL.y0, 2.2, L); } }
    if (dead) { c.strokeStyle = 'rgba(255,200,180,.7)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(30, CAL.y0); c.lineTo(36, 78); c.lineTo(31, 88); c.lineTo(40, CAL.y1); c.moveTo(56, CAL.y0); c.lineTo(52, 80); c.lineTo(60, 92); c.stroke(); }
    c.restore();
    c.lineWidth = 1.6; c.strokeStyle = dead ? '#ff5468' : '#7fa6d3'; H.rr(CAL.x0, CAL.y0, CAL.x1 - CAL.x0, CAL.y1 - CAL.y0, 8); c.stroke();
    c.fillStyle = '#4b607d'; c.fillRect(CAL.x0 - 2, CAL.y0 + 2, 2.5, CAL.y1 - CAL.y0 - 4); c.fillRect(CAL.x1 - 0.5, CAL.y0 + 2, 2.5, CAL.y1 - CAL.y0 - 4); // uç kalkanları
    /* Başlıklar ve besleyiciler */
    c.lineWidth = 0.9; for (const y of ROWS) { c.strokeStyle = cold; c.beginPath(); c.moveTo(CAL.x0 - 2, y); c.lineTo(HDR_L + 1, y); c.stroke(); c.strokeStyle = hot; c.beginPath(); c.moveTo(CAL.x1 + 2, y); c.lineTo(HDR_R - 1, y); c.stroke(); }
    H.rr(HDR_L - 2, CAL.y0 + 2, 4, CAL.y1 - CAL.y0 - 2, 2); c.fillStyle = cold; c.fill(); H.rr(HDR_R - 2, CAL.y0 + 2, 4, CAL.y1 - CAL.y0 - 4, 2); c.fillStyle = hot; c.fill();
    /* Reaktivite güvertesi ve çubuk tahrikleri */
    H.rr(DECK.x0, DECK.y0, DECK.x1 - DECK.x0, DECK.y1 - DECK.y0, 2); c.fillStyle = g.deck; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#4b607d'; for (const x of ADJ) c.fillRect(x - 0.7, DECK.y1, 1.4, CAL.y0 - DECK.y1);
    for (const x of ADJ) { const top = DECK.y0 - 4 - (1 - ins) * 6; c.fillStyle = '#9fb4d0'; c.fillRect(x - 0.9, top, 1.8, DECK.y0 - top); }
    for (const x of SD1) { const h = 10 * (1 - drop); if (h > 0.4) { c.fillStyle = '#ff7b8a'; c.fillRect(x - 1.1, DECK.y0 - h, 2.2, h); } c.fillStyle = trip ? '#ff5468' : '#46e0a0'; c.beginPath(); c.arc(x, DECK.y0 - 12.5, 1.4, 0, TAU); c.fill(); }
    if (dead) { H.steam(30, CAL.y0 - 2, now, 1, 8); H.steam(56, CAL.y0 - 2, now, 1, 8); }
    /* Etiketler */
    H.label(H.t('pl_cal'), (CAL.x0 + CAL.x1) / 2, 113, 7.5, '#9fb6d6', 'center', 62);
    H.label(H.t('pl_sg'), 78, 18, 7, '#9fb6d6', 'right', 56);
    H.label(H.t('pl_turb'), 131, 38, 7, '#9fb6d6', 'center', 32);
    H.label(H.t('pl_cond'), CND.x + CND.w / 2 - 1, CND.y + CND.h - 14, 7, '#9fb6d6', 'center', CND.w + 8);
  };
})();
