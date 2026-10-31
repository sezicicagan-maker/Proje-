/* ---------- Santral şeması: BWR (kaynar su reaktörü, doğrudan çevrim) ----------
   Kap içi: kor (alttan yukarı kaynayan karışım) -> üst plenum -> yükseltici borular -> buhar ayırıcılar -> kurutucular -> buhar kubbesi.
   Ayrılan su ve besi suyu iniş halkasından (gövde ile kor zarfı arası) jet pompalarına iner, alt plenumdan kora döner.
   Dış çevrim: iki resirkülasyon döngüsü (halka dibinden emer, jet pompası lülelerine basar), ana buhar hattı -> türbin -> kondenser
   -> besi suyu pompası -> kap. Kontrol bıçakları (haç kesitli) ALTTAN girer: ekleme S.p / S.T.stroke.
   Yalnız çizim: S değiştirilmez; animasyon fazları zamanla tümlenir, böylece hız değişince noktalar sıçramaz. */
PLANT.bwr = (() => {
  const TAU = Math.PI * 2, HP = Math.PI / 2;
  const cl = (v, a, b) => (v < a ? a : v > b ? b : v);
  const mk = pts => { const seg = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); tot += l; } return { pts, seg, tot }; };
  const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const MX = 84;                                                                  // ayna ekseni x2 (sol döngü -> sağ döngü)
  const mir = pts => pts.map(p => [MX - p[0], p[1]]);

  /* --- Geometri (tasarım birimi, 158 x 146 kutu) --- */
  const RV = { x0: 24, x1: 60, cx: 42, top: 22, hr: 8, bot: 121, br: 9 };         // reaktör basınç kabı
  const WALL = 1.7, IX0 = RV.x0 + WALL, IX1 = RV.x1 - WALL;
  const SH = { x0: 32, x1: 52, top: 67, bot: 115 };                                // kor zarfı (shroud)
  const CORE = { x0: 33, x1: 51, y0: 80, y1: 111 };
  const CH = CORE.y1 - CORE.y0;
  const ASM = [33, 37.9, 42.8, 47.7], AW = 3.3;                                    // yakıt demetleri (sol kenar)
  const BLX = [37.1, 42, 46.9];                                                    // haç kesitli kontrol bıçakları
  const WL = 47;                                                                   // normal su seviyesi
  const SEPX = [37, 42, 47], SEP_T = 39, SEP_B = 56, SEP_R = 1.9;                  // buhar ayırıcılar
  const DRY = { x0: 30, x1: 54, y0: 29, y1: 36 };                                  // buhar kurutucu
  const JPX = 28.85, JP_T = 68, JP_M = 92, JP_B = 117;                             // jet pompası (sol; sağ = MX - x)
  const STM_Y = 26, FW_Y = 52, RI_Y = 65, RO_Y = 107;                              // ağız kotları
  const LOOP_X = 5, RCP_X = 14, RCP_R = 4.6;                                       // sol resirkülasyon döngüsü
  const TB = { x0: 97, x1: 128, cy: STM_Y, h0: 6, h1: 13 };
  const GEN = { x: 132, y: 18, w: 17, h: 16 };
  const CND = { x: 92, y: 58, w: 60, h: 50 };
  const FWP = { x: 100, y: 133, r: 5 };
  const FW_X = 84, BYP_X = 88.5, BYP_Y = 66, TSV_X = 92.8, CW_UP = 76, CW_LO = 88;
  const DOME = (x, dx) => Math.sqrt(Math.max(0, 1 - (dx / 10) ** 2)) * 5;         // kor zarfı kapağı (kubbe) yüksekliği

  /* --- Akış yolları --- */
  const recL = [[26.7, 74], [26.7, RO_Y], [LOOP_X, RO_Y], [LOOP_X, RI_Y], [JPX, RI_Y], [JPX, JP_T + 1]];
  const dcL = [[35.1, 50], [29.9, 55], [29.9, 66.5], [JPX, 69.5], [JPX, JP_B], [30.6, 122], [34.2, 124.6], [39.5, 124.6], [39.5, CORE.y1 + 0.5]];
  const P = {
    recL: mk(recL), recR: mk(mir(recL)), dcL: mk(dcL), dcR: mk(mir(dcL)),
    rise: SEPX.map(x => mk([[x, 64 - DOME(x, x - 42) + 1.5], [x, SEP_T + 1]])),
    dome: SEPX.map(x => mk([[x, SEP_T - 0.5], [x, 27.5], [IX1, STM_Y]])),
    steam: mk([[IX1, STM_Y], [TB.x0, STM_Y]]),
    byp: mk([[BYP_X, STM_Y], [BYP_X, BYP_Y], [CND.x, BYP_Y]]),
    hood: mk([[118, 40], [118, CND.y + 8]]),
    cond: mk([[FWP.x, CND.y + CND.h], [FWP.x, FWP.y - FWP.r]]),
    feed: mk([[FWP.x - FWP.r, FWP.y], [FW_X, FWP.y], [FW_X, FW_Y], [RV.x1, FW_Y]]),
    spar: mk([[IX1, FW_Y], [53.4, FW_Y]]),
    cwA: mk([[CND.x + 5, CW_UP], [CND.x + CND.w - 1, CW_UP]]),
    cwB: mk([[CND.x + CND.w - 1, CW_LO], [CND.x + 5, CW_LO]])
  };
  const LOOPL = [[RV.x0, RO_Y], [LOOP_X, RO_Y], [LOOP_X, RI_Y], [RV.x0, RI_Y]], LOOPR = mir(LOOPL);
  /* akış yönü okları (hareketsiz kipte de yön okunur): x, y, açı */
  const CHEV = [[LOOP_X, 86, -HP], [MX - LOOP_X, 86, -HP], [17.5, RI_Y, 0], [MX - 17.5, RI_Y, Math.PI], [FW_X, 95, -HP], [76, STM_Y, 0]];

  /* --- Animasyon fazları (tümlenmiş) --- */
  const ph = { rec: 0, rcp: 0, stm: 0, fw: 0, dump: 0, cw: 0, fwp: 0, turb: 0, boil: 0, puff: 0, wave: 0 };
  let last = 0;

  /* --- Önbellekli gradyanlar (bağlam başına bir kez) --- */
  let G = null, Gc = null;
  function grads(c) {
    if (G && Gc === c) return G; Gc = c;
    const metal = (x0, x1) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#1a2940'); g.addColorStop(0.35, '#34496a'); g.addColorStop(1, '#152238'); return g; };
    const vert = (y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
    G = { rv: metal(RV.x0, RV.x1), motL: metal(RCP_X - 3, RCP_X + 3), motR: metal(MX - RCP_X - 3, MX - RCP_X + 3),
      tb: vert(TB.cy - TB.h1, TB.cy + TB.h1, '#41597b', '#1b2a40'), cn: vert(CND.y, CND.y + CND.h, '#18293f', '#0c1626'),
      gn: vert(GEN.y, GEN.y + GEN.h, '#35496a', '#17243a'), hood: vert(38, CND.y, '#22344f', '#162538') };
    return G;
  }

  const rgbOf = s => { const m = String(s).match(/\d+/g); return m && m.length >= 3 ? [+m[0], +m[1], +m[2]] : [200, 120, 80]; };
  const rgba = (a, k) => `rgba(${a[0]},${a[1]},${a[2]},${k})`;

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
  function poly(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
  function chev(c, x, y, a, s) { const ca = Math.cos(a), sa = Math.sin(a), b = s * 0.65; c.moveTo(x + ca * s, y + sa * s); c.lineTo(x - ca * b - sa * b, y - sa * b + ca * b); c.lineTo(x - ca * b + sa * b, y - sa * b - ca * b); c.closePath(); }
  function valve(c, x, y, vert, state) { // state: 0 kapalı (normal), 1 açık, 2 kapalı (açma)
    c.save(); c.translate(x, y); if (vert) c.rotate(HP);
    c.beginPath(); c.moveTo(-3, -2.3); c.lineTo(3, 2.3); c.lineTo(3, -2.3); c.lineTo(-3, 2.3); c.closePath();
    c.fillStyle = state === 1 ? '#46e0a0' : state === 2 ? '#ff5468' : '#1a2638'; c.fill();
    c.strokeStyle = state === 0 ? '#6f89ab' : '#0b1626'; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#9fb6d6'; c.fillRect(-0.4, -4.8, 0.8, 2.6); c.fillRect(-1.7, -5.3, 3.4, 1);
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
  const botY = x => RV.bot + RV.br * Math.sqrt(Math.max(0, 1 - ((x - RV.cx) / ((RV.x1 - RV.x0) / 2)) ** 2));
  function turbPath(c) { c.beginPath(); c.moveTo(TB.x0, TB.cy - TB.h0); c.lineTo(TB.x1, TB.cy - TB.h1); c.lineTo(TB.x1, TB.cy + TB.h1); c.lineTo(TB.x0, TB.cy + TB.h0); c.closePath(); }
  function motor(c, H, x, y, g) { // dikey motor (pompanın üstünde)
    H.rr(x - 3, y - 7.5, 6, 6, 1.4); c.fillStyle = g; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 0.8; c.stroke();
    c.strokeStyle = '#4b607d'; c.lineWidth = 0.5; c.beginPath(); for (let i = 1; i < 3; i++) { const xx = x - 3 + i * 2; c.moveTo(xx, y - 6.6); c.lineTo(xx, y - 2.4); } c.stroke();
  }
  const lerpX = (a, b, k) => a + (b - a) * k;

  return function (c, S, now, H) {
    /* --- Durum --- */
    const dead = !!S.destroyed, trip = !!S.az && !dead;
    const n = dead ? 0 : Math.max(0, S.n), nv = cl(n, 0, 1.3);
    const flow = dead ? 0 : cl(S.flow, 0, 1.2);
    const vd = dead ? 0 : cl(S.v, 0, 0.7), vk = cl(vd / 0.6, 0, 1.15);
    const ins = cl(S.p / S.T.stroke, 0, 1);
    const azT = S.azT || 0, dT = S.destroyT || 0;
    const w0 = cl(S.azN === undefined ? 1 : S.azN, 0.2, 1.1);
    const steamK = dead || trip ? 0 : cl(n, 0, 1.15);                                          // türbine giden buhar
    const turbW = dead ? w0 * Math.exp(-dT / 6) : trip ? w0 * Math.exp(-azT / 25) : steamK;   // açmada rotor serbestçe yavaşlar
    const dumpK = dead ? 0 : trip ? cl(0.25 + 0.75 * Math.exp(-azT / 40), 0, 1) * cl(n * 8 + 0.2, 0, 1) : 0; // bypass -> kondenser
    const sepK = dead ? 0 : Math.max(steamK, dumpK * 0.4);                                     // kap içi buhar üretimi
    const feedK = Math.max(steamK, dumpK * 0.35);
    const outK = trip || dead ? 0 : cl(steamK, 0, 1);
    const blink = now ? Math.sin(now / 140) > -0.1 : true;

    /* --- Fazları tümle (now = 0: hareketsiz) --- */
    let dt = 0; if (now > 0) { dt = last > 0 ? cl((now - last) / 1000, 0, 0.1) : 0; last = now; }
    ph.rec += dt * 22 * flow; ph.rcp += dt * 13 * flow; ph.stm += dt * 34 * steamK; ph.dump += dt * 26 * dumpK;
    ph.fw += dt * 16 * feedK; ph.fwp += dt * 12 * Math.max(feedK, dead ? 0 : 0.05); ph.turb += dt * 6 * turbW;
    ph.cw += dt * (dead ? 0 : 9); ph.boil += dt * (dead ? 0 : 0.25 + 0.45 * flow); ph.puff += dt; ph.wave += dt * (dead ? 0.3 : 1 + vk);
    ph.turb %= TAU; ph.rcp %= TAU; ph.fwp %= TAU; if (ph.rec > 1e5 || ph.stm > 1e5) for (const k in ph) ph[k] %= 840;

    const g = grads(c);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';

    /* ===== Renkler ===== */
    const Trec = 210 + 70 * Math.min(nv, 1);                                                    // doymuş su (gösterim ölçeği)
    const recS = dead ? '#6e3a40' : H.tempCol(Trec - 40), recA = rgbOf(recS);
    const steamCol = dead ? '#5b6170' : '#cfdcec', feedCol = dead ? '#3a4c66' : '#4f9cff', cwCol = dead ? '#2c4a52' : '#2fb3c9';
    const gc = H.glowCol(Math.max(n, 1e-4)), gk = dead ? 0 : cl((Math.log10(Math.max(n, 1e-4)) + 3) / 3.2, 0, 1);

    /* ===== Borular (kapların altında) ===== */
    H.pipe([[CND.x + CND.w, CW_UP], [155.5, CW_UP]], 2, cwCol);
    H.pipe([[CND.x + CND.w, CW_LO], [155.5, CW_LO]], 2, cwCol);
    H.pipe(P.cond.pts, 2.2, feedCol);
    H.pipe(P.feed.pts, 2.4, feedCol);
    H.pipe(P.byp.pts, 1.8, dumpK > 0.02 ? steamCol : '#5a6a80');
    H.pipe([[RV.x1 - 1, STM_Y], [BYP_X, STM_Y]], 3.2, steamCol);
    H.pipe([[BYP_X, STM_Y], [TB.x0, STM_Y]], 3.2, steamK > 0.01 ? steamCol : '#5a6a80');
    H.pipe([[TB.x1, TB.cy], [GEN.x, TB.cy]], 1.6, '#7f8ea3');
    H.pipe(LOOPL, 3, recS);
    H.pipe(LOOPR, 3, recS);

    /* ===== Kontrol çubuğu tahrikleri (kabın altında) ===== */
    const lampC = dead ? '#ff5468' : trip ? (blink ? '#ff5468' : '#5a1f2a') : S.stepback || S.jammed ? '#ffc83d' : '#46e0a0';
    c.beginPath(); for (const x of BLX) c.rect(x - 1.1, botY(x) - 2, 2.2, 140 - botY(x) + 2); c.fillStyle = '#22344f'; c.fill(); c.strokeStyle = '#4b607d'; c.lineWidth = 0.6; c.stroke();
    c.beginPath(); for (const x of BLX) c.rect(x - 1.6, 139.5, 3.2, 3.4); c.fillStyle = lampC; c.fill();
    c.strokeStyle = '#4b607d'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(BLX[0] - 3, 139.5); c.lineTo(BLX[2] + 3, 139.5); c.stroke();

    /* ===== Reaktör basınç kabı ===== */
    vesselPath(c, 0); c.fillStyle = g.rv; c.fill();
    c.fillStyle = '#4b607d'; c.fillRect(RV.x0 - 1.5, RV.top - 0.8, RV.x1 - RV.x0 + 3, 2);            // kapak flanşı
    c.save(); vesselPath(c, WALL); c.clip();
    const yT = RV.top - RV.hr, yB = RV.bot + RV.br;
    c.fillStyle = '#0c1727'; c.fillRect(RV.x0, yT, RV.x1 - RV.x0, yB - yT);
    // buhar boşluğu ve su
    c.fillStyle = dead ? 'rgba(150,150,160,.08)' : 'rgba(205,220,240,.13)'; c.fillRect(RV.x0, yT, RV.x1 - RV.x0, WL - yT);
    const wl = dead ? 76 : WL;
    c.fillStyle = dead ? 'rgba(40,60,90,.5)' : 'rgba(38,100,180,.5)'; c.fillRect(RV.x0, wl, RV.x1 - RV.x0, yB - wl);
    // kor zarfı içi: sıcak iki fazlı karışım
    c.fillStyle = rgba(recA, dead ? 0.1 : 0.22); c.fillRect(SH.x0, SH.top - 5, SH.x1 - SH.x0, SH.bot - SH.top + 5);
    if (!dead && vk > 0.02) {
      const vg = c.createLinearGradient(0, CORE.y1, 0, SEP_T);
      vg.addColorStop(0, 'rgba(230,240,255,0)'); vg.addColorStop(0.45, `rgba(230,240,255,${0.16 * vk})`); vg.addColorStop(1, `rgba(235,245,255,${0.3 * vk})`);
      c.fillStyle = vg; c.fillRect(SH.x0, SEP_T, SH.x1 - SH.x0, CORE.y1 - SEP_T);
    }
    // kurutucu (şevron paketleri)
    c.fillStyle = '#1b2b44'; c.fillRect(DRY.x0, DRY.y0, DRY.x1 - DRY.x0, DRY.y1 - DRY.y0);
    c.strokeStyle = '#5d7697'; c.lineWidth = 0.6; c.strokeRect(DRY.x0, DRY.y0, DRY.x1 - DRY.x0, DRY.y1 - DRY.y0);
    c.beginPath(); for (let i = 0; i <= 12; i++) { const x = DRY.x0 + 1 + i * 1.83; i ? c.lineTo(x, DRY.y0 + 2 + (i % 2) * 3) : c.moveTo(x, DRY.y0 + 2); } c.stroke();
    c.beginPath(); c.moveTo(DRY.x0, DRY.y1); c.lineTo(DRY.x0, WL + 3); c.moveTo(DRY.x1, DRY.y1); c.lineTo(DRY.x1, WL + 3); c.strokeStyle = '#4b607d'; c.stroke();  // kurutucu eteği
    // kor zarfı, kapağı ve yükseltici borular
    c.strokeStyle = '#4b607d'; c.lineWidth = 0.9; c.beginPath();
    c.moveTo(SH.x0, SH.top); c.lineTo(SH.x0, SH.bot); c.moveTo(SH.x1, SH.top); c.lineTo(SH.x1, SH.bot);
    c.moveTo(SH.x0, SH.top); c.quadraticCurveTo(RV.cx, SH.top - 10, SH.x1, SH.top);
    c.moveTo(IX0, SH.bot - 1); c.lineTo(SH.x0, SH.bot - 1); c.moveTo(SH.x1, SH.bot - 1); c.lineTo(IX1, SH.bot - 1);       // halka taban plakası
    c.moveTo(SH.x0, CORE.y0 - 1.3); c.lineTo(SH.x1, CORE.y0 - 1.3); c.moveTo(SH.x0, CORE.y1 + 1.3); c.lineTo(SH.x1, CORE.y1 + 1.3);
    c.stroke();
    c.fillStyle = '#22344f'; c.strokeStyle = '#5d7697'; c.lineWidth = 0.5;
    for (const x of SEPX) { const yb = 64 - DOME(x, x - 42) + 1; c.fillRect(x - 0.8, SEP_B, 1.6, yb - SEP_B); c.strokeRect(x - 0.8, SEP_B, 1.6, yb - SEP_B); }
    for (const x of SEPX) { H.rr(x - SEP_R, SEP_T, SEP_R * 2, SEP_B - SEP_T, 1.2); c.fillStyle = 'rgba(34,52,79,.85)'; c.fill(); c.strokeStyle = '#6f89ab'; c.lineWidth = 0.6; c.stroke(); }
    c.strokeStyle = 'rgba(160,190,225,.35)'; c.lineWidth = 0.45; c.beginPath();                      // girdap kanatları
    for (const x of SEPX) for (let k = 0; k < 3; k++) { const y = SEP_B - 3 - k * 4.5; c.moveTo(x - SEP_R + 0.4, y + 1.2); c.lineTo(x + SEP_R - 0.4, y - 1.2); }
    c.stroke();
    // jet pompaları (iniş halkasında)
    c.beginPath();
    for (const jx of [JPX, MX - JPX]) {
      c.moveTo(jx - 1.7, JP_T); c.lineTo(jx - 0.8, JP_T + 2.5); c.lineTo(jx - 0.8, JP_M); c.lineTo(jx - 1.5, JP_B); c.lineTo(jx + 1.5, JP_B); c.lineTo(jx + 0.8, JP_M); c.lineTo(jx + 0.8, JP_T + 2.5); c.lineTo(jx + 1.7, JP_T);
    }
    c.fillStyle = 'rgba(30,48,74,.9)'; c.fill(); c.strokeStyle = '#6f89ab'; c.lineWidth = 0.55; c.stroke();
    // yakıt (güçle parlar)
    c.save(); if (gk > 0.05) { c.shadowColor = rgba(gc, 0.9); c.shadowBlur = 3 + 7 * gk; }
    c.fillStyle = dead ? '#2a0d10' : rgba(gc, 0.35 + 0.6 * gk); c.beginPath();
    for (const x of ASM) c.rect(x, CORE.y0, AW, CH);
    c.fill(); c.restore();
    if (!dead) { c.fillStyle = `rgba(255,255,255,${0.1 + 0.28 * gk})`; c.beginPath(); for (const x of ASM) c.rect(x + AW / 2 - 0.35, CORE.y0 + 1, 0.7, CH - 2); c.fill(); }
    // alt plenumda kılavuz borular
    c.strokeStyle = 'rgba(127,166,211,.2)'; c.lineWidth = 2.2; c.beginPath(); for (const x of BLX) { c.moveTo(x, CORE.y1 + 2); c.lineTo(x, yB); } c.stroke();
    // kontrol bıçakları (alttan girer)
    const tipY = CORE.y1 - ins * CH;
    c.beginPath(); for (const x of BLX) c.rect(x - 0.85, tipY, 1.7, CH); c.fillStyle = '#141b27'; c.fill(); c.strokeStyle = 'rgba(170,190,215,.6)'; c.lineWidth = 0.4; c.stroke();
    c.strokeStyle = 'rgba(170,190,215,.35)'; c.beginPath(); for (const x of BLX) { c.moveTo(x, tipY + 1.5); c.lineTo(x, tipY + CH); } c.stroke();   // haç kanadının sırtı
    c.beginPath(); for (const x of BLX) c.rect(x - 0.85, tipY, 1.7, 1.1); c.fillStyle = S.jammed ? '#ffc83d' : trip ? '#ff8a7a' : '#8a9ab0'; c.fill();
    c.strokeStyle = '#7f90a8'; c.lineWidth = 0.6; c.beginPath(); for (const x of BLX) { c.moveTo(x, tipY + CH); c.lineTo(x, yB); } c.stroke();                // tahrik mili
    // besi suyu dağıtıcısı
    c.fillStyle = feedCol; c.fillRect(53.2, FW_Y - 0.7, IX1 - 53.2, 1.4);
    // su seviyesi (dalgalı)
    if (!dead) {
      c.strokeStyle = 'rgba(220,235,255,.6)'; c.lineWidth = 0.6; c.beginPath();
      for (let x = IX0; x <= IX1 + 0.1; x += 2) { const y = wl + Math.sin(x * 0.9 + ph.wave * 3) * 0.35 * (0.5 + vk); x === IX0 ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.stroke();
    }
    // akış: iniş halkası, jet pompaları, alt plenum
    if (flow > 0.01) {
      dots(c, P.dcL, ph.rec, 6, 0.7, 'rgba(210,232,255,.8)'); dots(c, P.dcR, ph.rec + 3, 6, 0.7, 'rgba(210,232,255,.8)');
    }
    // kaynama: kor içinde yükselen kabarcıklar (boşluk oranıyla)
    if (!dead) {
      const nb = Math.round(4 + 56 * vd), top = 64 - 3;
      c.fillStyle = 'rgba(240,248,255,.78)'; c.beginPath();
      for (let i = 0; i < nb; i++) {
        const p = (ph.boil * (0.8 + 0.4 * hash(i)) + i * 0.618) % 1, h0 = 0.12 * (1 - vk);
        if (p < h0) continue;
        const col = i % 4, x = ASM[col] + 0.5 + hash(i + 7) * (AW - 1) + Math.sin(p * 11 + i) * 0.3;
        const y = CORE.y1 - 1 - p * (CORE.y1 - 1 - top), r = 0.3 + 0.55 * p * (0.6 + vk);
        const xx = y < CORE.y0 ? lerpX(x, RV.cx, (CORE.y0 - y) / (CORE.y0 - top) * 0.35) : x;
        c.moveTo(xx + r, y); c.arc(xx, y, r, 0, TAU);
      }
      c.fill();
      if (sepK > 0.01 || vd > 0.01) for (const Pp of P.rise) dots(c, Pp, ph.boil * 20, 4.5, 0.6, 'rgba(240,248,255,.75)');
      if (sepK > 0.01) for (let i = 0; i < 3; i++) dots(c, P.dome[i], ph.stm * 0.6 + i * 2, 6, 0.75, 'rgba(240,248,255,.8)');
      if (feedK > 0.01) dots(c, P.spar, ph.fw, 2.5, 0.5, 'rgba(225,240,255,.9)');
    }
    // ağızlar
    c.fillStyle = steamCol; c.fillRect(IX1 - 0.5, STM_Y - 1.6, WALL + 1, 3.2);
    c.fillStyle = recS; c.fillRect(RV.x0 - 0.2, RI_Y - 1.5, WALL + 0.6, 3); c.fillRect(RV.x0 - 0.2, RO_Y - 1.5, WALL + 0.6, 3);
    c.fillRect(IX1 - 0.4, RI_Y - 1.5, WALL + 0.6, 3); c.fillRect(IX1 - 0.4, RO_Y - 1.5, WALL + 0.6, 3);
    c.restore();
    vesselPath(c, 0); c.strokeStyle = dead ? '#ff7b6b' : '#7fa6d3'; c.lineWidth = 1.2; c.stroke();

    /* ===== Resirkülasyon pompaları (motor üstte) ===== */
    motor(c, H, RCP_X, RO_Y - RCP_R, g.motL); motor(c, H, MX - RCP_X, RO_Y - RCP_R, g.motR);
    H.pump(RCP_X, RO_Y, RCP_R, -ph.rcp, dead ? '#ff7b6b' : '#7fa6d3');
    H.pump(MX - RCP_X, RO_Y, RCP_R, ph.rcp, dead ? '#ff7b6b' : '#7fa6d3');

    /* ===== Türbin, jeneratör ===== */
    c.beginPath(); c.moveTo(106, 34); c.lineTo(TB.x1, TB.cy + TB.h1); c.lineTo(140, CND.y + 1); c.lineTo(100, CND.y + 1); c.closePath();   // egzoz boynu
    c.fillStyle = g.hood; c.fill(); if (steamK > 0.02) { c.fillStyle = `rgba(220,235,255,${0.05 + 0.08 * steamK})`; c.fill(); } c.strokeStyle = '#5d7697'; c.lineWidth = 0.9; c.stroke();
    turbPath(c); c.fillStyle = g.tb; c.fill();
    c.save(); turbPath(c); c.clip();
    if (steamK > 0.02) { c.fillStyle = `rgba(220,235,255,${0.06 + 0.12 * steamK})`; c.fillRect(TB.x0, TB.cy - TB.h1, TB.x1 - TB.x0, TB.h1 * 2); }
    c.strokeStyle = '#121d2e'; c.lineWidth = 2; c.beginPath(); c.moveTo(TB.x0, TB.cy); c.lineTo(TB.x1, TB.cy); c.stroke();
    const wv = cl(turbW, 0, 1);
    const stX = s => TB.x0 + 3 + s * 4.3, stH = x => TB.h0 + (TB.h1 - TB.h0) * (x - TB.x0) / (TB.x1 - TB.x0) - 1.2;
    c.beginPath(); for (let s = 0; s < 7; s++) { const x = stX(s), hh = stH(x); c.moveTo(x, TB.cy - hh); c.lineTo(x, TB.cy + hh); }
    c.strokeStyle = 'rgba(150,180,215,.28)'; c.lineWidth = 1.6; c.stroke();
    c.beginPath();
    for (let s = 0; s < 7; s++) {
      const x = stX(s), hh = stH(x);
      for (let j = 0; j < 8; j++) { const th = ph.turb + j * TAU / 8 + s * 0.45; if (Math.sin(th) <= 0) continue; const y = TB.cy - hh * Math.cos(th); c.moveTo(x - 1.3, y - 0.5); c.lineTo(x + 1.3, y + 0.5); }
    }
    c.strokeStyle = `rgba(220,236,255,${0.5 + 0.4 * wv})`; c.lineWidth = 0.9; c.stroke();
    c.restore();
    turbPath(c); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.1; c.stroke();
    H.rr(GEN.x, GEN.y, GEN.w, GEN.h, 3); c.fillStyle = g.gn; c.fill(); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.1; c.stroke();
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
    if (dumpK > 0.02) {
      const tt = now ? ph.puff : 0.45;
      for (let i = 0; i < 7; i++) { const p = (tt / 1.2 + i / 7) % 1, x = CND.x + 1.5 + p * 26, y = BYP_Y + Math.sin(i * 2.3) * p * 5; c.fillStyle = `rgba(235,242,255,${0.55 * (1 - p) * dumpK})`; c.beginPath(); c.arc(x, y, 0.8 + p * 3.4, 0, TAU); c.fill(); }
    }
    const hw = CND.y + CND.h - 9;
    c.fillStyle = dead ? 'rgba(40,60,90,.6)' : 'rgba(60,140,240,.55)'; c.fillRect(CND.x, hw, CND.w, 12);
    c.strokeStyle = 'rgba(220,235,255,.5)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(CND.x, hw); c.lineTo(CND.x + CND.w, hw); c.stroke();
    c.restore();
    H.rr(CND.x, CND.y, CND.w, CND.h, 5); c.strokeStyle = '#7fa6d3'; c.lineWidth = 1.2; c.stroke();
    if (!dead) { H.arrow(155.4, CW_UP, 0, 2, cwCol); H.arrow(CND.x + CND.w + 1.6, CW_LO, Math.PI, 2, cwCol); }

    /* ===== Besi suyu pompası ===== */
    H.pump(FWP.x, FWP.y, FWP.r, ph.fwp, '#7fa6d3');

    /* ===== Akış noktaları (dış) ===== */
    if (flow > 0.01) { dots(c, P.recL, ph.rec, 6, 0.95, 'rgba(255,255,255,.85)'); dots(c, P.recR, ph.rec + 3, 6, 0.95, 'rgba(255,255,255,.85)'); }
    if (steamK > 0.01 || dumpK > 0.01) dots(c, P.steam, steamK > 0.01 ? ph.stm : ph.dump, 8, 1, '#ffffff');
    if (dumpK > 0.01) dots(c, P.byp, ph.dump, 6, 0.9, '#ffffff');
    if (feedK > 0.01) { dots(c, P.feed, ph.fw, 8, 0.9, 'rgba(225,240,255,.9)'); dots(c, P.cond, ph.fw, 8, 0.9, 'rgba(225,240,255,.9)'); }
    c.fillStyle = 'rgba(230,240,255,.55)'; c.beginPath(); for (const ch of CHEV) chev(c, ch[0], ch[1], ch[2], 1.7); c.fill();

    /* ===== Vanalar: türbin durdurma (açmada kapanır) ve bypass (açmada açılır) ===== */
    valve(c, TSV_X, STM_Y, false, dead || trip ? 2 : 1);
    valve(c, BYP_X, 46, true, dumpK > 0.02 ? 1 : 0);

    /* ===== Hasar ===== */
    if (dead) {
      const pulse = now ? 0.5 + 0.5 * Math.sin(now / 220) : 0.7, tt = now ? ph.puff : 1.3;
      c.fillStyle = 'rgba(6,10,18,.45)'; c.fillRect(82, 0, 76, 146);
      const rg = c.createRadialGradient(RV.cx, 108, 2, RV.cx, 108, 40); rg.addColorStop(0, `rgba(255,70,50,${0.5 + 0.3 * pulse})`); rg.addColorStop(1, 'rgba(255,40,60,0)');
      c.fillStyle = rg; c.fillRect(0, 60, 84, 86);
      c.fillStyle = `rgba(255,${Math.round(120 + 60 * pulse)},60,.9)`; c.beginPath(); c.ellipse(RV.cx, RV.bot + 4, 13, 4, 0, 0, TAU); c.fill();
      c.strokeStyle = '#ffb36b'; c.lineWidth = 0.9; c.beginPath();
      c.moveTo(34, 82); c.lineTo(38, 90); c.lineTo(35, 97); c.lineTo(41, 104); c.lineTo(39, 110); c.moveTo(49, 84); c.lineTo(46, 93); c.lineTo(50, 101);
      c.moveTo(RV.x0, 40); c.lineTo(RV.x0 + 3, 45); c.lineTo(RV.x0 + 1, 50); c.lineTo(RV.x0 + 4, 56); c.moveTo(RV.x1, 92); c.lineTo(RV.x1 - 3, 97); c.lineTo(RV.x1 - 1, 103);
      c.stroke();
      c.fillStyle = 'rgba(255,40,60,.08)'; c.fillRect(0, 0, 158, 146);
      puffs(c, RV.cx, RV.top - 10, tt, 1, 9, 30, '96,96,104', 8);
      puffs(c, 70, STM_Y, tt + 1.1, 0.9, 6, 22, '110,108,112', 6);
      c.strokeStyle = `rgba(255,84,104,${0.5 + 0.4 * pulse})`; c.lineWidth = 1.2; c.strokeRect(0.8, 0.8, 156.4, 144.4);
    }

    /* ===== Etiketler (en çok 4) ===== */
    H.label(H.t('pl_turb'), 112, 7.5, 7, '#9fb6d6', 'center', 36);
    H.label(H.t('pl_cond'), CND.x + CND.w / 2, 94, 7, '#9fb6d6', 'center', 54);
    H.label(H.t('pl_pump'), RCP_X, 118, 7, '#9fb6d6', 'center', 20);
    H.label(H.t('pl_fw'), 108, FWP.y, 7, '#9fb6d6', 'left', 44);
    c.restore();
  };
})();
