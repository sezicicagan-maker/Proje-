/* ---------- Santral şeması: PWR (basınçlı su reaktörü, iki devre) ----------
   Birincil devre: reaktör kabı -> sıcak bacak -> buhar üreteci (ters U borular) -> döngü contası -> RCP -> soğuk bacak -> kap.
   Basınçlandırıcı sıcak bacağa bağlı. İkincil devre: BÜ buhar çıkışı -> türbin -> kondenser -> besi suyu pompası -> BÜ.
   Yalnız çizim: S değiştirilmez; animasyon fazları kapalı alanda zamanla tümlenir, böylece hız değişince noktalar sıçramaz. */
PLANT.pwr = (() => {
  const TAU = Math.PI * 2;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mkPath = pts => { const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; } return { pts, seg, tot }; };

  /* --- Geometri (tasarım birimi, 158 x 146 kutu) --- */
  const HOT_Y = 86, COLD_Y = 102, STM_Y = 11.5;                                     // ağız ve hat kotları
  const RV = { x0: 6, x1: 34, cx: 20, top: 63, bot: 132, hr: 7, br: 9 };           // reaktör basınç kabı
  const BAR = { x0: 10.5, x1: 29.5, y0: 67, y1: 130 };                              // çekirdek fıçısı
  const CORE = { x0: 11.5, x1: 28.5, y0: 108, y1: 129 };                            // yakıt bölgesi
  const RODX = [14.9, 18.3, 21.7, 25.1];                                            // kontrol çubuğu demetleri
  const SG = { cx: 68, domeY: 21, x0: 56, x1: 80, coneY: 40, lx0: 58, lx1: 78, coneB: 46, tsY: 72, chY: 74, bendY: 55, wl: 42 };
  const PZ = { x: 40.5, y: 27, w: 9, h: 43 };                                       // basınçlandırıcı
  const RCP = { x: 60, y: COLD_Y, r: 5.5 };
  const TB = { x0: 100, x1: 132, cy: 30, h0: 6, h1: 13 };                           // türbin (YB dar -> AB geniş)
  const GEN = { x: 136, y: 22, w: 16, h: 16 };
  const CND = { x: 92, y: 60, w: 60, h: 62 };                                        // kondenser
  const FWP = { x: 104, y: 133, r: 5 };
  const RISER = 84, DUMPX = 90;
  const CW_UP = 77, CW_LO = 89;                                                     // soğutma suyu geçişleri

  /* --- Akış yolları --- */
  const P = {
    hot: mkPath([[34, HOT_Y], [63, HOT_Y], [63, 80.2]]),
    surge: mkPath([[45, PZ.y + PZ.h], [45, HOT_Y]]),
    xo: mkPath([[73, 80.2], [73, 114], [60, 114], [60, RCP.y + RCP.r]]),
    cold: mkPath([[RCP.x - RCP.r, COLD_Y], [34, COLD_Y]]),
    inR: mkPath([[32.2, COLD_Y], [32.2, 131], [27, 136.5], [23.4, 133], [23.4, 109], [26, 96], [29.5, HOT_Y]]),
    inL: mkPath([[7.9, COLD_Y], [7.9, 131], [13, 136.5], [16.6, 133], [16.6, 109], [21, 95], [29.5, HOT_Y - 0.6]]),
    steam: mkPath([[SG.cx, 16], [SG.cx, STM_Y], [DUMPX, STM_Y], [DUMPX, TB.cy], [TB.x0, TB.cy]]),
    dump: mkPath([[DUMPX, TB.cy], [DUMPX, 66], [CND.x, 66]]),
    hood: mkPath([[121, 41], [121, CND.y + 8]]),
    cond: mkPath([[FWP.x, CND.y + CND.h], [FWP.x, FWP.y - FWP.r]]),
    feed: mkPath([[FWP.x - FWP.r, FWP.y], [RISER, FWP.y], [RISER, 36], [SG.x1, 36]]),
    cwA: mkPath([[CND.x + 5, CW_UP], [CND.x + CND.w - 1, CW_UP]]),
    cwB: mkPath([[CND.x + CND.w - 1, CW_LO], [CND.x + 5, CW_LO]])
  };

  /* --- Animasyon fazları (tümlenmiş) --- */
  const ph = { prim: 0, stm: 0, fw: 0, dump: 0, cw: 0, rcp: 0, fwp: 0, turb: 0, boil: 0, puff: 0 };
  let last = 0;

  /* --- Önbellekli gradyanlar (bağlam başına bir kez) --- */
  let G = null, Gc = null;
  function grads(c) {
    if (G && Gc === c) return G; Gc = c;
    const metal = (x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#1a2940'); g.addColorStop(0.35, '#34496a'); g.addColorStop(1, '#152238'); return g; };
    const vert = (y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
    G = { rv: metal(RV.x0, RV.x1), sg: metal(SG.x0, SG.x1), pz: metal(PZ.x, PZ.x + PZ.w), mot: metal(RCP.x - 4, RCP.x + 4),
      tb: vert(TB.cy - TB.h1, TB.cy + TB.h1, '#41597b', '#1b2a40'), cn: vert(CND.y, CND.y + CND.h, '#18293f', '#0c1626'),
      gn: vert(GEN.y, GEN.y + GEN.h, '#35496a', '#17243a'), hood: vert(38, CND.y, '#22344f', '#162538') };
    return G;
  }

  const rgbOf = s => { const m = String(s).match(/\d+/g); return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [200, 120, 80]; };
  const rgba = (a, k) => `rgba(${a[0]},${a[1]},${a[2]},${k})`;
  /* Gösterim sıcaklığı: birincil devre 280-310 °C arasında çalışır; H.tempCol'un 40..340 ölçeğinde bu fark görünmez.
     Sıcak/soğuk bacak farkı okunsun diye 290 °C çevresinde gerilmiş bir ölçek kullanılır (sıfır güçte iki bacak aynı renk). */
  const disp = T => cl(232 + (T - 290) * 9, 40, 340);

  function dots(c, Pp, off, gap, r, col) {
    if (Pp.tot <= 0) return; const pts = Pp.pts, seg = Pp.seg; let i = 0, acc = 0;
    c.fillStyle = col; c.beginPath();
    for (let d = ((off % gap) + gap) % gap; d < Pp.tot; d += gap) {
      while (i < seg.length - 1 && d > acc + seg[i]) { acc += seg[i]; i++; }
      const f = (d - acc) / seg[i], a = pts[i], b = pts[i + 1], x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
      c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    }
    c.fill();
  }
  function valve(c, x, y, vert, state) { // state: 0 kapalı (normal), 1 açık, 2 kapalı (açma)
    c.save(); c.translate(x, y); if (vert) c.rotate(-Math.PI / 2);
    c.beginPath(); c.moveTo(-3, -2.3); c.lineTo(3, 2.3); c.lineTo(3, -2.3); c.lineTo(-3, 2.3); c.closePath();
    c.fillStyle = state === 1 ? '#46e0a0' : state === 2 ? '#ff5468' : '#1a2638'; c.fill();
    c.strokeStyle = state === 0 ? '#6f89ab' : '#0b1626'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#9fb6d6'; c.fillRect(-0.4, -4.8, 0.8, 2.6); c.fillRect(-1.7, -5.3, 3.4, 1); // tahrik
    c.restore();
  }
  function puffs(c, x, y, t, amt, spread, rise, col, n) {
    for (let i = 0; i < n; i++) {
      const p = (t / 2.6 + i / n) % 1, xx = x + Math.sin(i * 2.1 + t * 0.7) * spread * p, yy = y - p * rise;
      c.fillStyle = `rgba(${col},${0.45 * (1 - p) * amt})`; c.beginPath(); c.arc(xx, yy, 1.6 + p * 5.5, 0, TAU); c.fill();
    }
  }
  function vesselPath(c, ins) {
    const rx = (RV.x1 - RV.x0) / 2 - ins;
    c.beginPath(); c.moveTo(RV.cx - rx, RV.top); c.ellipse(RV.cx, RV.top, rx, RV.hr - ins, 0, Math.PI, TAU); c.lineTo(RV.cx + rx, RV.bot); c.ellipse(RV.cx, RV.bot, rx, RV.br - ins, 0, 0, Math.PI); c.closePath();
  }
  function sgPath(c, ins) {
    const s = SG;
    c.beginPath(); c.moveTo(s.x0 + ins, s.domeY); c.ellipse(s.cx, s.domeY, 12 - ins, 5 - ins, 0, Math.PI, TAU);
    c.lineTo(s.x1 - ins, s.coneY); c.lineTo(s.lx1 - ins, s.coneB); c.lineTo(s.lx1 - ins, s.chY);
    c.ellipse(s.cx, s.chY, 10 - ins, 7 - ins, 0, 0, Math.PI); c.lineTo(s.lx0 + ins, s.coneB); c.lineTo(s.x0 + ins, s.coneY); c.closePath();
  }
  function turbPath(c) { c.beginPath(); c.moveTo(TB.x0, TB.cy - TB.h0); c.lineTo(TB.x1, TB.cy - TB.h1); c.lineTo(TB.x1, TB.cy + TB.h1); c.lineTo(TB.x0, TB.cy + TB.h0); c.closePath(); }

  return function (c, S, now, H) {
    /* --- Durum --- */
    const dead = !!S.destroyed, trip = !!S.az && !dead;
    const n = dead ? 0 : Math.max(0, S.n), nv = cl(n, 0, 1.3);
    const flow = dead ? 0 : cl(S.flow, 0, 1.2);
    const D = dead ? 0 : cl(S.D, 0, 1.1);
    const ins = cl(S.p / S.T.stroke, 0, 1);
    const b = cl(S.boron / 1500, 0, 1);
    const azT = S.azT || 0, dT = S.destroyT || 0;
    // türbin hızı yükü izler; açmada (S.D = 0) buhar kesilir ve rotor serbestçe yavaşlar
    const w0 = cl(S.azN === undefined ? 0.6 : S.azN, 0.2, 1);
    const turbW = dead ? w0 * Math.exp(-dT / 6) : trip ? w0 * Math.exp(-azT / 25) : D;
    const steamK = dead || trip ? 0 : D;                                                                   // ana buhar debisi
    const dumpK = dead ? 0 : trip ? cl(0.3 + 0.7 * Math.exp(-azT / 40), 0, 1) : cl((n - D - 0.06) * 4, 0, 1); // buhar boşaltma (kondensere)
    const feedK = Math.max(steamK, dumpK * 0.35);
    const Th = 290 + 18 * nv, Tc = 290 - 12 * nv;
    const hotS = dead ? '#6e3a40' : H.tempCol(disp(Th)), coldS = dead ? '#4a3a4c' : H.tempCol(disp(Tc));
    const hotA = rgbOf(hotS);
    const blink = now ? Math.sin(now / 140) > -0.1 : true;

    /* --- Fazları tümle (now = 0: hareketsiz) --- */
    let dt = 0; if (now > 0) { dt = last > 0 ? cl((now - last) / 1000, 0, 0.1) : 0; last = now; }
    ph.prim += dt * 24 * flow; ph.rcp += dt * 14 * flow; ph.stm += dt * 34 * steamK; ph.dump += dt * 26 * dumpK;
    ph.fw += dt * 16 * feedK; ph.fwp += dt * 12 * Math.max(feedK, dead ? 0 : 0.05); ph.turb += dt * 6 * turbW;
    ph.cw += dt * (dead ? 0 : 9); ph.boil += dt * (dead ? 0 : 0.35 + 0.9 * nv); ph.puff += dt;
    if (ph.prim > 1e5) for (const k in ph) ph[k] %= 840;

    const g = grads(c);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';

    /* ===== Borular (kapların altında) ===== */
    const steamCol = dead ? '#5b6170' : '#cfdcec', feedCol = dead ? '#3a4c66' : '#4f9cff', cwCol = dead ? '#2c4a52' : '#2fb3c9';
    H.pipe([[CND.x + CND.w, CW_UP], [155.5, CW_UP]], 2, cwCol);
    H.pipe([[CND.x + CND.w, CW_LO], [155.5, CW_LO]], 2, cwCol);
    H.pipe(P.cond.pts, 2.2, feedCol);
    H.pipe(P.feed.pts, 2.4, feedCol);
    H.pipe(P.dump.pts, 1.8, dumpK > 0.02 ? steamCol : '#5a6a80');
    H.pipe(P.steam.pts.slice(0, 4), 3, steamCol);
    H.pipe([[DUMPX, TB.cy], [TB.x0, TB.cy]], 3, steamK > 0.01 ? steamCol : '#5a6a80');
    H.pipe([[TB.x1, TB.cy], [GEN.x, TB.cy]], 1.6, '#7f8ea3');
    H.pipe(P.surge.pts, 2, hotS);
    H.pipe(P.xo.pts, 3.4, coldS);
    H.pipe(P.cold.pts, 3.4, coldS);
    H.pipe(P.hot.pts, 3.4, hotS);

    /* ===== Reaktör basınç kabı ===== */
    const lampC = dead ? '#ff5468' : trip ? (blink ? '#ff5468' : '#5a1f2a') : S.stepback || S.jammed ? '#ffc83d' : '#46e0a0';
    c.beginPath(); for (const x of RODX) c.rect(x - 1, 45, 2, 12); c.fillStyle = '#22344f'; c.fill(); c.strokeStyle = '#4b607d'; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); for (const x of RODX) c.rect(x - 1.5, 41.8, 3, 3.2); c.fillStyle = lampC; c.fill();
    vesselPath(c, 0); c.fillStyle = g.rv; c.fill();
    c.fillStyle = '#4b607d'; c.fillRect(RV.x0 - 1.5, RV.top - 0.8, RV.x1 - RV.x0 + 3, 2);          // kapak flanşı
    c.save(); vesselPath(c, 1.8); c.clip();
    const yT = RV.top - RV.hr, hT = RV.bot + RV.br - yT;
    c.fillStyle = dead ? '#1c1418' : `rgb(${Math.round(20 + 4 * b)},${Math.round(34 + 58 * b)},${Math.round(48 + 150 * b)})`; c.fillRect(RV.x0, yT, RV.x1 - RV.x0, hT);   // bor -> mavi
    c.fillStyle = rgba(hotA, dead ? 0.1 : 0.24); c.fillRect(BAR.x0, yT, BAR.x1 - BAR.x0, CORE.y0 - yT);          // üst plenum (sıcak)
    c.fillStyle = 'rgba(120,150,230,.10)'; c.fillRect(RV.x0, RV.top, BAR.x0 - RV.x0, RV.bot - RV.top); c.fillRect(BAR.x1, RV.top, RV.x1 - BAR.x1, RV.bot - RV.top);
    c.strokeStyle = '#4b607d'; c.lineWidth = 0.9; c.beginPath();
    c.moveTo(BAR.x0, BAR.y0); c.lineTo(BAR.x0, BAR.y1); c.moveTo(BAR.x1, BAR.y0); c.lineTo(BAR.x1, HOT_Y - 2.2); c.moveTo(BAR.x1, HOT_Y + 2.2); c.lineTo(BAR.x1, BAR.y1);
    c.moveTo(BAR.x0, CORE.y0 - 1.2); c.lineTo(BAR.x1, CORE.y0 - 1.2); c.moveTo(BAR.x0, CORE.y1 + 1.2); c.lineTo(BAR.x1, CORE.y1 + 1.2); c.stroke();
    c.strokeStyle = 'rgba(127,166,211,.16)'; c.lineWidth = 1.8; c.beginPath(); for (const x of RODX) { c.moveTo(x, BAR.y0); c.lineTo(x, CORE.y0 - 1.5); } c.stroke();  // kılavuz borular
    // yakıt (güçle parlar)
    const gc = H.glowCol(Math.max(n, 1e-4)), gk = cl((Math.log10(Math.max(n, 1e-4)) + 3) / 3.2, 0, 1), fw = (CORE.x1 - CORE.x0) / 5;
    c.save(); if (gk > 0.05 && !dead) { c.shadowColor = rgba(gc, 0.9); c.shadowBlur = 3 + 7 * gk; }
    c.fillStyle = dead ? '#2a0d10' : rgba(gc, 0.35 + 0.6 * gk); c.beginPath();
    for (let i = 0; i < 5; i++) c.rect(CORE.x0 + i * fw + 0.35, CORE.y0, fw - 0.7, CORE.y1 - CORE.y0);
    c.fill(); c.restore();
    if (!dead) { c.fillStyle = `rgba(255,255,255,${0.1 + 0.3 * gk})`; c.beginPath(); for (let i = 0; i < 5; i++) c.rect(CORE.x0 + i * fw + fw / 2 - 0.35, CORE.y0 + 1, 0.7, CORE.y1 - CORE.y0 - 2); c.fill(); }
    if (flow > 0.01) { dots(c, P.inR, ph.prim, 7, 0.75, 'rgba(225,240,255,.7)'); dots(c, P.inL, ph.prim + 3.5, 7, 0.75, 'rgba(225,240,255,.7)'); }
    // kontrol çubukları (üstten girer)
    const tipY = CORE.y0 - 1 + ins * (CORE.y1 - CORE.y0 + 1), absL = CORE.y1 - CORE.y0;
    c.strokeStyle = '#7f90a8'; c.lineWidth = 0.6; c.beginPath(); for (const x of RODX) { c.moveTo(x, yT); c.lineTo(x, tipY - absL); } c.stroke();
    c.beginPath(); for (const x of RODX) c.rect(x - 0.85, tipY - absL, 1.7, absL); c.fillStyle = '#1a2230'; c.fill(); c.strokeStyle = 'rgba(160,180,205,.55)'; c.lineWidth = 0.4; c.stroke();
    c.beginPath(); for (const x of RODX) c.rect(x - 0.85, tipY - 1, 1.7, 1); c.fillStyle = S.jammed ? '#ffc83d' : '#8a9ab0'; c.fill();
    c.fillStyle = hotS; c.fillRect(BAR.x1 - 0.5, HOT_Y - 1.7, RV.x1 - BAR.x1 + 1, 3.4);                     // sıcak ağız
    c.fillStyle = coldS; c.fillRect(RV.x1 - 3, COLD_Y - 1.7, 3.2, 3.4);                                    // soğuk ağız
    c.restore();
    vesselPath(c, 0); c.strokeStyle = dead ? '#ff7b6b' : '#7fa6d3'; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.rect(RV.x1 + 0.2, HOT_Y - 2.9, 1.8, 5.8); c.rect(RV.x1 + 0.2, COLD_Y - 2.9, 1.8, 5.8); c.fillStyle = '#4b607d'; c.fill();

    /* ===== Basınçlandırıcı ===== */
    const lvl = dead ? 0.03 : cl(0.25 + (S.Tm - 280) * 0.011, 0.12, 0.9);
    const ref = 288 + 16 * D, heat = dead ? 0 : cl(0.35 + (ref - S.Tm) * 0.25, 0.15, 1), spray = dead ? 0 : cl((S.Tm - ref - 1.5) * 0.4, 0, 1);
    H.rr(PZ.x, PZ.y, PZ.w, PZ.h, 4.5); c.fillStyle = g.pz; c.fill();
    c.save(); H.rr(PZ.x + 1.5, PZ.y + 1.5, PZ.w - 3, PZ.h - 3, 3); c.clip();
    const ly = PZ.y + 1.5 + (PZ.h - 3) * (1 - lvl);
    c.fillStyle = 'rgba(205,220,240,.16)'; c.fillRect(PZ.x, PZ.y, PZ.w, ly - PZ.y);
    c.fillStyle = rgba(hotA, 0.55); c.fillRect(PZ.x, ly, PZ.w, PZ.y + PZ.h - ly);
    c.fillStyle = `rgba(70,150,255,${0.12 + 0.35 * b})`; c.fillRect(PZ.x, ly, PZ.w, PZ.y + PZ.h - ly);
    c.strokeStyle = 'rgba(220,235,255,.7)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(PZ.x, ly); c.lineTo(PZ.x + PZ.w, ly); c.stroke();
    c.save(); if (heat > 0.2) { c.shadowColor = '#ff9a3d'; c.shadowBlur = 4 * heat; }                    // ısıtıcılar
    c.strokeStyle = dead ? '#4b607d' : `rgba(255,${Math.round(120 + 60 * heat)},60,${0.45 + 0.5 * heat})`; c.lineWidth = 0.9; c.beginPath();
    for (let i = 0; i < 3; i++) { const x = PZ.x + 2.6 + i * 1.9; c.moveTo(x, PZ.y + PZ.h - 2); c.lineTo(x, PZ.y + PZ.h - 9); } c.stroke(); c.restore();
    if (!dead && lvl > 0.2) { c.fillStyle = 'rgba(235,245,255,.7)'; c.beginPath(); for (let i = 0; i < 4; i++) { const p = (ph.boil * 0.6 + i / 4) % 1, x = PZ.x + 2.6 + (i % 3) * 1.9 + Math.sin(i * 3 + p * 6) * 0.5, y = PZ.y + PZ.h - 9 - p * (PZ.y + PZ.h - 9 - ly); c.moveTo(x + 0.55, y); c.arc(x, y, 0.55, 0, TAU); } c.fill(); }
    if (spray > 0.02) { c.fillStyle = `rgba(150,200,255,${0.5 + 0.4 * spray})`; c.beginPath(); for (let i = 0; i < 6; i++) { const p = (ph.boil * 1.4 + i / 6) % 1, x = PZ.x + PZ.w / 2 + (i - 2.5) * 1.4 * p, y = PZ.y + 4 + p * (ly - PZ.y - 5); c.moveTo(x + 0.45, y); c.arc(x, y, 0.45, 0, TAU); } c.fill(); }
    c.restore();
    H.rr(PZ.x, PZ.y, PZ.w, PZ.h, 4.5); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.1; c.stroke();
    c.fillStyle = '#4b607d'; c.fillRect(PZ.x + PZ.w / 2 - 1, PZ.y - 2, 2, 2.2);

    /* ===== Buhar üreteci ===== */
    sgPath(c, 0); c.fillStyle = g.sg; c.fill();
    c.save(); sgPath(c, 1.6); c.clip();
    c.fillStyle = 'rgba(205,220,240,.13)'; c.fillRect(SG.x0, 14, SG.x1 - SG.x0, SG.wl - 14);
    c.fillStyle = dead ? 'rgba(40,60,90,.5)' : 'rgba(38,100,180,.5)'; c.fillRect(SG.x0, SG.wl, SG.x1 - SG.x0, SG.tsY - SG.wl);
    c.strokeStyle = 'rgba(220,235,255,.55)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(SG.x0, SG.wl); c.lineTo(SG.x1, SG.wl); c.stroke();
    c.fillStyle = '#26395a'; c.strokeStyle = '#5d7697'; c.lineWidth = 0.6;                                // ayırıcılar ve kurutucu
    for (const x of [61.2, 66.3, 71.4]) { c.fillRect(x, 28, 3.4, 9); c.strokeRect(x, 28, 3.4, 9); }
    c.beginPath(); for (let i = 0; i <= 10; i++) { const x = 58.5 + i * 1.9; i ? c.lineTo(x, 23.5 + (i % 2) * 1.8) : c.moveTo(x, 23.5); } c.stroke();
    const ug = c.createLinearGradient(SG.cx - 8, 0, SG.cx + 8, 0); ug.addColorStop(0, hotS); ug.addColorStop(1, coldS);  // ters U borular
    c.strokeStyle = ug; c.lineWidth = 1.05; c.beginPath();
    for (const r of [2, 4, 6, 8]) { c.moveTo(SG.cx - r, SG.tsY); c.lineTo(SG.cx - r, SG.bendY); c.arc(SG.cx, SG.bendY, r, Math.PI, TAU); c.lineTo(SG.cx + r, SG.tsY); }
    c.stroke();
    if (!dead) {                                                                                             // kaynama
      const nb = Math.round(3 + 13 * cl(n, 0, 1.2)); c.fillStyle = 'rgba(235,245,255,.75)'; c.beginPath();
      for (let i = 0; i < nb; i++) { const p = (ph.boil + i * 0.618) % 1, x = 59.5 + ((i * 0.381) % 1) * 17 + Math.sin(p * 9 + i) * 0.5, y = SG.tsY - 2 - p * (SG.tsY - 2 - SG.wl); c.moveTo(x + 0.6, y); c.arc(x, y, 0.45 + 0.35 * p, 0, TAU); }
      c.fill();
    }
    c.fillStyle = feedCol; c.fillRect(SG.x1 - 6.5, 35.4, 5, 1.2);                                       // besi suyu halkası
    c.restore();
    c.fillStyle = '#3a4e6a'; c.fillRect(SG.lx0, SG.tsY, SG.lx1 - SG.lx0, SG.chY - SG.tsY);               // boru plakası
    c.save(); c.beginPath(); c.ellipse(SG.cx, SG.chY, 8.4, 5.4, 0, 0, Math.PI); c.closePath(); c.clip();  // su kutusu (birincil)
    c.fillStyle = hotS; c.fillRect(SG.cx - 10, SG.chY, 10, 8); c.fillStyle = coldS; c.fillRect(SG.cx, SG.chY, 10, 8);
    c.fillStyle = `rgba(70,150,255,${0.08 + 0.3 * b})`; c.fillRect(SG.cx - 10, SG.chY, 20, 8);
    c.restore();
    c.strokeStyle = '#4b607d'; c.lineWidth = 1; c.beginPath(); c.moveTo(SG.cx, SG.chY); c.lineTo(SG.cx, SG.chY + 6.6); c.stroke();
    sgPath(c, 0); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.2; c.stroke();

    /* ===== Reaktör soğutucu pompası (motor üstte) ===== */
    H.rr(RCP.x - 4, RCP.y - RCP.r - 6.5, 8, 6, 1.6); c.fillStyle = g.mot; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 0.9; c.stroke();
    c.strokeStyle = '#4b607d'; c.lineWidth = 0.6; c.beginPath(); for (let i = 1; i < 4; i++) { const x = RCP.x - 4 + i * 2; c.moveTo(x, RCP.y - RCP.r - 5.5); c.lineTo(x, RCP.y - RCP.r - 1.5); } c.stroke();
    H.pump(RCP.x, RCP.y, RCP.r, ph.rcp, dead ? '#ff7b6b' : '#7fa6d3');

    /* ===== Türbin, jeneratör ===== */
    c.beginPath(); c.moveTo(110, 37); c.lineTo(TB.x1, TB.cy + TB.h1); c.lineTo(138, CND.y + 1); c.lineTo(104, CND.y + 1); c.closePath();   // egzoz boynu
    c.fillStyle = g.hood; c.fill(); if (steamK > 0.02) { c.fillStyle = `rgba(220,235,255,${0.05 + 0.08 * steamK})`; c.fill(); } c.strokeStyle = '#5d7697'; c.lineWidth = 0.9; c.stroke();
    turbPath(c); c.fillStyle = g.tb; c.fill();
    c.save(); turbPath(c); c.clip();
    if (steamK > 0.02) { c.fillStyle = `rgba(220,235,255,${0.06 + 0.12 * steamK})`; c.fillRect(TB.x0, TB.cy - TB.h1, TB.x1 - TB.x0, TB.h1 * 2); }
    c.strokeStyle = '#121d2e'; c.lineWidth = 2; c.beginPath(); c.moveTo(TB.x0, TB.cy); c.lineTo(TB.x1, TB.cy); c.stroke();   // rotor
    const wv = cl(turbW, 0, 1);
    const stX = s => TB.x0 + 3 + s * 4.4, stH = x => TB.h0 + (TB.h1 - TB.h0) * (x - TB.x0) / (TB.x1 - TB.x0) - 1.2;
    c.beginPath(); for (let s = 0; s < 7; s++) { const x = stX(s), hh = stH(x); c.moveTo(x, TB.cy - hh); c.lineTo(x, TB.cy + hh); }   // kanat kademeleri
    c.strokeStyle = 'rgba(150,180,215,.28)'; c.lineWidth = 1.6; c.stroke();
    c.beginPath();                                                                                           // dönen kanatlar (tambur görünümü)
    for (let s = 0; s < 7; s++) {
      const x = stX(s), hh = stH(x);
      for (let j = 0; j < 8; j++) { const th = ph.turb + j * TAU / 8 + s * 0.45; if (Math.sin(th) <= 0) continue; const y = TB.cy - hh * Math.cos(th); c.moveTo(x - 1.3, y - 0.5); c.lineTo(x + 1.3, y + 0.5); }
    }
    c.strokeStyle = `rgba(220,236,255,${0.5 + 0.4 * wv})`; c.lineWidth = 0.9; c.stroke();
    c.restore();
    turbPath(c); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.1; c.stroke();
    H.rr(GEN.x, GEN.y, GEN.w, GEN.h, 3); c.fillStyle = g.gn; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.1; c.stroke();
    const outK = trip || dead ? 0 : cl(D, 0, 1);
    c.save(); if (outK > 0.05) { c.shadowColor = '#ffc83d'; c.shadowBlur = 5 * outK; }
    c.strokeStyle = outK > 0.02 ? `rgba(255,200,61,${0.45 + 0.55 * outK})` : '#4b607d'; c.lineWidth = 1.3; c.beginPath();
    for (let i = 0; i <= 12; i++) { const x = GEN.x + 3 + i * (GEN.w - 6) / 12, y = GEN.y + GEN.h / 2 - Math.sin(i / 12 * TAU) * 3; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.restore();
    H.pipe([[GEN.x + GEN.w, TB.cy], [153.5, TB.cy]], 1.4, outK > 0.02 ? '#ffc83d' : '#4b607d');
    H.arrow(154.5, TB.cy, 0, 2.6, outK > 0.02 ? '#ffc83d' : '#4b607d');

    /* ===== Kondenser ===== */
    H.rr(CND.x, CND.y, CND.w, CND.h, 5); c.fillStyle = g.cn; c.fill();
    c.save(); H.rr(CND.x + 1.2, CND.y + 1.2, CND.w - 2.4, CND.h - 2.4, 4); c.clip();
    c.fillStyle = 'rgba(47,179,201,.10)'; c.fillRect(CND.x, CW_UP - 4.5, CND.w, CW_LO - CW_UP + 9);
    c.fillStyle = cwCol; c.beginPath();
    for (let r = 0; r < 4; r++) { const y = CW_UP - 1.5 + r * 5; for (let i = 0; i < 9; i++) { const x = CND.x + 9 + i * 5.3 + (r % 2) * 2.6; c.moveTo(x + 1, y); c.arc(x, y, 1, 0, TAU); } }
    c.fill();
    if (!dead) { dots(c, P.cwA, ph.cw, 6, 0.6, 'rgba(210,250,255,.85)'); dots(c, P.cwB, ph.cw, 6, 0.6, 'rgba(210,250,255,.85)'); }
    if (steamK > 0.01) dots(c, P.hood, ph.stm, 6, 1, 'rgba(235,245,255,.65)');
    if (dumpK > 0.02) {                                                                                     // kondensere boşaltılan buhar jeti
      const tt = now ? ph.puff : 0.45;
      for (let i = 0; i < 7; i++) { const p = (tt / 1.2 + i / 7) % 1, x = CND.x + 1.5 + p * 26, y = 66 + Math.sin(i * 2.3) * p * 5; c.fillStyle = `rgba(235,242,255,${0.55 * (1 - p) * dumpK})`; c.beginPath(); c.arc(x, y, 0.8 + p * 3.4, 0, TAU); c.fill(); }
    }
    const hw = CND.y + CND.h - 10;
    c.fillStyle = dead ? 'rgba(40,60,90,.6)' : 'rgba(60,140,240,.55)'; c.fillRect(CND.x, hw, CND.w, 12);
    c.strokeStyle = 'rgba(220,235,255,.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(CND.x, hw); c.lineTo(CND.x + CND.w, hw); c.stroke();
    c.restore();
    H.rr(CND.x, CND.y, CND.w, CND.h, 5); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.2; c.stroke();
    if (!dead) { H.arrow(156, CW_UP, 0, 2, cwCol); H.arrow(CND.x + CND.w + 1.6, CW_LO, Math.PI, 2, cwCol); }

    /* ===== Besi suyu pompası ===== */
    H.pump(FWP.x, FWP.y, FWP.r, ph.fwp, '#7fa6d3');

    /* ===== Akış noktaları ===== */
    const pc = 'rgba(255,255,255,.85)';
    if (flow > 0.01) { dots(c, P.hot, ph.prim, 7, 1.05, pc); dots(c, P.xo, ph.prim, 7, 1.05, pc); dots(c, P.cold, ph.prim, 7, 1.05, pc); dots(c, P.surge, ph.boil * 2, 6, 0.6, 'rgba(255,255,255,.35)'); }
    if (steamK > 0.01) dots(c, P.steam, ph.stm, 8, 1, '#ffffff');
    if (dumpK > 0.01) dots(c, P.dump, ph.dump, 6, 0.9, '#ffffff');
    if (feedK > 0.01) { dots(c, P.feed, ph.fw, 8, 0.9, 'rgba(225,240,255,.9)'); dots(c, P.cond, ph.fw, 8, 0.9, 'rgba(225,240,255,.9)'); }

    /* ===== Vanalar: türbin durdurma (açmada kapanır) ve buhar boşaltma (açmada açılır) ===== */
    valve(c, 95, TB.cy, false, dead || trip ? 2 : 1);
    valve(c, DUMPX, 50, true, dumpK > 0.02 ? 1 : 0);

    /* ===== Hasar ===== */
    if (dead) {
      const pulse = now ? 0.5 + 0.5 * Math.sin(now / 220) : 0.7, tt = now ? ph.puff : 1.3;
      c.fillStyle = 'rgba(6,10,18,.45)'; c.fillRect(82, 0, 76, 146);                                         // ikincil devre karanlık
      const rg = c.createRadialGradient(RV.cx, 120, 2, RV.cx, 120, 36); rg.addColorStop(0, `rgba(255,70,50,${0.5 + 0.3 * pulse})`); rg.addColorStop(1, 'rgba(255,40,60,0)');
      c.fillStyle = rg; c.fillRect(0, 80, 62, 66);
      c.fillStyle = `rgba(255,${Math.round(120 + 60 * pulse)},60,.9)`; c.beginPath(); c.ellipse(RV.cx, RV.bot + 3.5, 10.5, 3.6, 0, 0, TAU); c.fill();   // alt kapakta erimiş çekirdek
      c.strokeStyle = '#ffb36b'; c.lineWidth = 0.9; c.beginPath();                                          // çatlaklar
      c.moveTo(12, 102); c.lineTo(17, 110); c.lineTo(14, 116); c.lineTo(21, 123); c.lineTo(19, 130); c.moveTo(27, 98); c.lineTo(24, 107); c.lineTo(28, 114);
      c.moveTo(RV.x0, 72); c.lineTo(RV.x0 + 3, 76); c.lineTo(RV.x0 + 1, 80); c.lineTo(RV.x0 + 4, 85); c.moveTo(RV.x1, 112); c.lineTo(RV.x1 - 3, 116); c.lineTo(RV.x1 - 1, 121);
      c.moveTo(48, HOT_Y - 2.5); c.lineTo(50, HOT_Y); c.lineTo(48.5, HOT_Y + 2.5); c.stroke();
      c.fillStyle = 'rgba(255,40,60,.08)'; c.fillRect(0, 0, 158, 146);
      puffs(c, RV.cx, RV.top - 12, tt, 1, 8, 32, '96,96,104', 8);
      puffs(c, 50, HOT_Y - 2, tt + 1.1, 0.9, 6, 24, '110,108,112', 7);
      c.strokeStyle = `rgba(255,84,104,${0.5 + 0.4 * pulse})`; c.lineWidth = 1.2; c.strokeRect(0.8, 0.8, 156.4, 144.4);
    }

    /* ===== Etiketler (en çok 4) ===== */
    H.label(H.t('pl_press'), PZ.x + 3.5, 20.5, 7, '#9fb6d6', 'right', 43);
    H.label(H.t('pl_sg'), SG.cx, 5, 7, '#9fb6d6', 'center', 40);
    H.label(H.t('pl_turb'), 116, 12.5, 7, '#9fb6d6', 'center', 34);
    H.label(H.t('pl_cond'), CND.x + CND.w / 2, CND.y + CND.h - 18, 7, '#9fb6d6', 'center', 52);
    c.restore();
  };
})();
