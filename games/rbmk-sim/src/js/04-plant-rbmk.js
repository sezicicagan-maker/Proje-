/* ---------- Santral şeması: RBMK-1000 (grafit moderatörlü kanal tipi, tek devreli doğrudan çevrim) ----------
   Akış: ana sirkülasyon pompaları (MCP) -> basınç kolektörü -> alt su hatları -> kanallar (kor, yukarı) -> buhar-su
   hatları -> 2 ayırıcı tambur -> doymuş buhar -> türbin -> kondenser -> besleme suyu pompası -> tambur -> iniş boruları -> MCP.
   Kontrol çubukları üstten girer (ekleme S.p / S.T.stroke); RBMK'ya özgü grafit iticiler (displacer) soluk gri çizilir.
   Çizimler gruplanır (aynı renkteki borular/noktalar tek yol) ki kare başına çağrı sayısı düşük kalsın. */
PLANT.rbmk = (() => {
  const TAU = Math.PI * 2, HP = Math.PI / 2;
  /* yerleşim (158 x 146 tasarım birimi) */
  const CO = { x: 20, y: 53, w: 56, h: 40 };          // grafit yığını (kor)
  const US = { x: 15, y: 46.5, w: 66, h: 6.5 };       // üst biyolojik kalkan
  const LS = { x: 15, y: 93, w: 66, h: 9 };           // alt plaka (isim plakası)
  const CHX = [23, 33, 43, 53, 63, 73];               // yakıt kanalları
  const RODX = [28, 38, 48, 58, 68];                  // kontrol çubukları
  const DRV_Y = 37, DRV_H = 6;                        // çubuk sürücüleri
  const DR = [{ x: 3, y: 19, w: 38, h: 12 }, { x: 55, y: 19, w: 38, h: 12 }];
  const TB = { x: 104, y: 9.5, w: 34, h: 17.5 };      // türbin (giriş ortası TMID)
  const TMID = TB.y + TB.h / 2;
  const GEN = { x: 148, y: TMID, r: 7 };
  const CD = { x: 104, y: 44, w: 44, h: 24 };         // kondenser
  const MCP = [[12, 124], [84, 124]], FWP = [112, 124], PR = 6.5, FR = 5.5;
  const ccx = CO.x + CO.w / 2, ccy = CO.y + CO.h / 2;
  /* yollar: bir kez hesaplanır */
  const mk = pts => { const seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; } return { pts, seg, L }; };
  const P = {
    steamL: mk([[22, 19], [22, 13], [101, 13], [101, TMID], [104, TMID]]), steamR: mk([[74, 19], [74, 13]]),
    riseL: mk([[21, 46.5], [21, 31]]), riseR: mk([[75, 46.5], [75, 31]]),
    downL: mk([[12, 31], [12, 117.5]]), downR: mk([[84, 31], [84, 117.5]]),
    disL: mk([[18.5, 124], [48, 124], [48, 110]]), disR: mk([[77.5, 124], [48, 124]]),
    hdrL: mk([[48, 110], [23, 110], [23, 102]]), hdrR: mk([[48, 110], [73, 110], [73, 102]]),
    eq: mk([[55, 27.5], [41, 27.5]]),
    fw: mk([[106.5, 124], [97, 124], [97, 27], [92.6, 27]]),
    cond: mk([[112, CD.y + CD.h], [112, 118.5]]),
    cwIn: mk([[155.4, CD.y + 19], [148, CD.y + 19]]), cwOut: mk([[148, CD.y + 5], [155.4, CD.y + 5]]),
    exh: mk([[134, TB.y + TB.h + 0.5], [134, CD.y]])
  };
  const STUBS = [33, 43, 53, 63].map(x => mk([[x, 110], [x, 102]]));
  const HDR = [[23, 102], [23, 110], [73, 110], [73, 102]];
  /* boru grupları: [genişlik, renk anahtarı, yollar] */
  const PIPES = [
    [3.2, 'loop', [P.downL.pts, P.downR.pts, P.disL.pts, P.disR.pts]],
    [2.6, 'loop', [HDR]],
    [1.6, 'loop', STUBS.map(s => s.pts)],
    [2, 'loop', [P.eq.pts]],
    [4.2, 'rise', [P.riseL.pts, P.riseR.pts]],
    [2.6, 'fw', [P.fw.pts]],
    [2.4, 'cond', [P.cond.pts]],
    [2.6, 'cw', [P.cwIn.pts, P.cwOut.pts]],
    [3.6, 'steam', [P.steamL.pts, P.steamR.pts]]
  ];
  const LOOPDOTS = [P.downL, P.downR, P.disL, P.disR, P.hdrL, P.hdrR, ...STUBS];
  /* akış yönü okları (hareketsiz kipte de yön okunur): x, y, açı */
  const CHEV = [[12, 74, HP], [84, 74, HP], [48, 117.5, -HP], [31, 124, 0], [65, 124, Math.PI], [97, 64, -HP], [112, 94, HP], [90, 13, 0]];
  const NECK = [[130, TB.y + TB.h * (0.7 + 0.3 * 26 / 34)], [138, TB.y + TB.h], [141, CD.y], [126, CD.y]];
  /* sabit sözde rastgele (deterministik) */
  const hash = k => { const s = Math.sin(k * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  /* faz biriktiricileri: hız değişince noktalar sıçramasın diye zamanla entegre edilir (yalnız görsel) */
  const ph = { loop: 0, rise: 0, steam: 0, fw: 0, cw: 0, mcp: 0, fwp: 0, turb: 0, bub: 0 };
  let last = 0;
  const WRAP = 360 * 7;
  /* sabit gradyanlar: bağlam başına bir kez */
  let G = null, Gc = null;
  function grads(c) {
    if (G && Gc === c) return G; Gc = c; G = {};
    const lg = (x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
    G.graph = lg(CO.x, 0, CO.x + CO.w, 0, [[0, '#1b222c'], [0.5, '#2b3440'], [1, '#1b222c']]);
    G.us = lg(0, US.y, 0, US.y + US.h, [[0, '#3a4d68'], [1, '#1f2b3d']]);
    G.ls = lg(0, LS.y, 0, LS.y + LS.h, [[0, '#26364d'], [1, '#162132']]);
    G.drum = lg(0, DR[0].y, 0, DR[0].y + DR[0].h, [[0, '#2a3d58'], [0.5, '#17253a'], [1, '#0d1726']]);
    G.water = lg(0, DR[0].y + 3, 0, DR[0].y + DR[0].h, [[0, '#f0a866'], [1, '#a9572a']]);
    G.waterD = lg(0, DR[0].y + 3, 0, DR[0].y + DR[0].h, [[0, '#6a5050'], [1, '#3a2a2a']]);
    G.turb = lg(0, TB.y, 0, TB.y + TB.h, [[0, '#435d80'], [1, '#1b2a40']]);
    G.cond = lg(0, CD.y, 0, CD.y + CD.h, [[0, '#13223a'], [1, '#0a1424']]);
    return G;
  }
  /* yardımcılar: hepsi mevcut yola ekler (beginPath/fill çağıran tarafta) */
  function dotsP(c, Pt, off, gap, r) {
    let i = 0, acc = 0;
    for (let d = ((off % gap) + gap) % gap; d < Pt.L; d += gap) {
      while (i < Pt.seg.length - 1 && d > acc + Pt.seg[i]) { acc += Pt.seg[i]; i++; }
      const a = Pt.pts[i], b = Pt.pts[i + 1], f = (d - acc) / Pt.seg[i], x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
      c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    }
  }
  function polyP(c, pts) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); }
  function capsuleP(c, x, y, w, h) { const r = h / 2; c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.arc(x + w - r, y + r, r, -HP, HP); c.lineTo(x + r, y + h); c.arc(x + r, y + r, r, HP, Math.PI * 1.5); c.closePath(); }
  function pumpP(c, x, y, r, ang) {
    c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    for (let i = 0; i < 4; i++) { const a = ang + i * HP, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(x, y); c.quadraticCurveTo(x + r * (0.5 * ca + 0.2 * sa), y + r * (0.5 * sa - 0.2 * ca), x + ca * r * 0.75, y + sa * r * 0.75); }
  }
  function chevP(c, x, y, a, s) { const ca = Math.cos(a), sa = Math.sin(a), b = s * 0.65; c.moveTo(x + ca * s, y + sa * s); c.lineTo(x - ca * b - sa * b, y - sa * b + ca * b); c.lineTo(x - ca * b + sa * b, y - sa * b - ca * b); c.closePath(); }
  function smoke(c, x, y, now, amt, spread, k0) {
    for (let i = 0; i < 5; i++) {
      const p = (((now / 2600) + i / 5 + hash(k0 + i) * 0.15) % 1 + 1) % 1, xx = x + Math.sin(i * 2.3 + k0 + now / 1300) * spread * (0.3 + p), yy = y - p * 28;
      c.fillStyle = `rgba(${118 + 30 * p | 0},${116 + 28 * p | 0},${120 + 26 * p | 0},${(0.5 * (1 - p) * amt).toFixed(3)})`; c.beginPath(); c.arc(xx, yy, 2.5 + p * 7, 0, TAU); c.fill();
    }
  }

  return function (c, S, now, H) {
    const clamp = H.clamp, lerp = H.lerp, g = grads(c);
    /* --- durum --- */
    const dead = !!S.destroyed, az = !!S.az, azT = S.azT || 0, n = Math.max(0, S.n || 0);
    const flow = dead ? 0 : clamp(S.flow, 0, 1.2), v = clamp(S.v, 0, 0.35), vf = clamp((v - 0.02) / 0.22, 0, 1.3);
    const ins = clamp(S.p / S.T.stroke, 0, 1);
    const kk = clamp((Math.log10(Math.max(n, 1e-4)) + 3) / 4.2, 0, 1), bright = dead ? 1.4 : clamp(kk / 0.714, 0.06, 1.35);
    const valve = az ? Math.max(0, 1 - azT / 2.5) : 1;                  // türbin stop vanaları kapanır
    const steamAmt = dead ? 0 : clamp(n, 0, 1.25) * valve, sA = Math.min(1, steamAmt);
    const tSpd = dead ? 0 : az ? Math.exp(-azT / 20) : clamp(n / 0.05, 0, 1); // şebekede sabit devir; açmada yavaşlar
    const fwAmt = dead ? 0 : clamp(Math.max(az ? 0.12 : 0, n), 0, 1.2);
    const gc = H.glowCol(n);
    /* --- fazlar --- */
    let dt = 0; if (now > 0 && last > 0) { dt = (now - last) / 1000; if (!(dt > 0 && dt < 0.25)) dt = 0; } last = now;
    if (!now) { for (const k in ph) ph[k] = 0; }
    else {
      ph.loop = (ph.loop + 13 * flow * dt) % WRAP; ph.rise = (ph.rise + 15 * flow * (1 + 2.5 * v) * dt) % WRAP;
      ph.steam = (ph.steam + 30 * steamAmt * dt) % WRAP; ph.fw = (ph.fw + 12 * fwAmt * dt) % WRAP; if (!dead) ph.cw = (ph.cw + 9 * dt) % WRAP;
      ph.mcp = (ph.mcp + 9 * flow * dt) % TAU; ph.fwp = (ph.fwp + 8 * fwAmt * dt) % TAU; ph.turb = (ph.turb + 7 * tSpd * dt) % TAU; ph.bub = (ph.bub + 9 * (dead ? 0 : 0.4 + flow) * dt) % WRAP;
    }
    /* --- renk paleti --- */
    const nn = clamp(n, 0, 1), wm = Math.min(0.45, vf * 0.35);
    const COL = {
      loop: dead ? '#5a5050' : '#d4844a',
      rise: dead ? '#6a5048' : `rgb(${Math.round(lerp(255, 245, wm))},${Math.round(lerp(lerp(150, 118, nn), 228, wm))},${Math.round(lerp(lerp(90, 70, nn), 225, wm))})`,
      steam: dead ? '#55606e' : `rgb(${Math.round(lerp(88, 214, sA))},${Math.round(lerp(104, 228, sA))},${Math.round(lerp(126, 245, sA))})`,
      fw: dead ? '#46546a' : '#57a6e4', cond: dead ? '#3d4a5e' : '#3c7fd0', cw: dead ? '#33415a' : '#2c62a8'
    };
    const OUT = dead ? '#6a7a90' : '#7fa6d3', DIM = '#4b607d', DARK = '#06101c';
    const rodCol = S.jammed ? '#ffc83d' : az ? '#e4eefb' : '#9fb4d0';
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';

    /* --- arka plan: havalandırma bacası silueti --- */
    const ga = c.globalAlpha;
    c.globalAlpha = ga * 0.5;
    c.fillStyle = '#17263c'; c.fillRect(141, 76, 4, 70);
    c.strokeStyle = 'rgba(127,166,211,.24)'; c.lineWidth = 0.7; c.beginPath();
    c.moveTo(133, 145.5); c.lineTo(139.5, 84); c.moveTo(153, 145.5); c.lineTo(146.5, 84);
    for (let i = 0; i < 6; i++) { const y0 = 145.5 - i * 10.3, y1 = y0 - 10.3, w0 = lerp(10, 3.5, i / 6), w1 = lerp(10, 3.5, (i + 1) / 6); c.moveTo(143 - w0, y0); c.lineTo(143 + w1, y1); c.moveTo(143 + w0, y0); c.lineTo(143 - w1, y1); }
    c.stroke();
    c.fillStyle = 'rgba(255,84,104,.45)'; c.fillRect(141, 76, 4, 2.5); c.fillRect(141, 81, 4, 2.5);
    c.globalAlpha = ga;

    /* --- borular (gruplu: dış hat, renk, parlama) --- */
    c.strokeStyle = DARK;
    for (const [w, , list] of PIPES) { c.beginPath(); for (const pts of list) polyP(c, pts); c.lineWidth = w + 2.5; c.stroke(); }
    for (const [w, key, list] of PIPES) { c.beginPath(); for (const pts of list) polyP(c, pts); c.lineWidth = w; c.strokeStyle = COL[key]; c.stroke(); }
    c.beginPath(); for (const [, , list] of PIPES) for (const pts of list) polyP(c, pts); c.lineWidth = 0.7; c.strokeStyle = 'rgba(255,255,255,.2)'; c.stroke();
    /* yön okları */
    c.fillStyle = 'rgba(6,16,28,.72)'; c.beginPath(); for (const [x, y, a] of CHEV) chevP(c, x, y, a, 1.7); c.fill();

    /* --- akış noktaları --- */
    if (flow > 0.01) { c.fillStyle = 'rgba(255,236,214,.85)'; c.beginPath(); for (const Pt of LOOPDOTS) dotsP(c, Pt, ph.loop, 9, 0.95); c.fill(); }
    if (!dead) {
      /* yükselen hatlar: su noktaları + buhar kabarcıkları (boşluk oranıyla) */
      const wb = [], bb = [];
      c.fillStyle = 'rgba(255,236,214,.7)'; c.beginPath();
      for (const R of [P.riseL, P.riseR]) {
        const x = R.pts[0][0], y0 = R.pts[0][1], L = R.L;
        for (let k = 0; k < 6; k++) { const yy = y0 - ((ph.rise + k * L / 6) % L), xx = x + (hash(k * 3 + x) - 0.5) * 1.4; if (hash(k + x) < 0.15 + vf * 0.8) continue; c.moveTo(xx + 0.9, yy); c.arc(xx, yy, 0.9, 0, TAU); }
      }
      c.fill();
      c.fillStyle = `rgba(245,250,255,${(0.6 + 0.35 * Math.min(1, vf)).toFixed(2)})`; c.beginPath();
      for (const R of [P.riseL, P.riseR]) {
        const x = R.pts[0][0], y0 = R.pts[0][1], L = R.L;
        for (let k = 0; k < 6; k++) { if (hash(k + x) >= 0.15 + vf * 0.8) continue; const yy = y0 - ((ph.rise + k * L / 6) % L), xx = x + (hash(k * 3 + x) - 0.5) * 1.4, r = 0.7 + 0.9 * hash(k * 7 + x) * (0.4 + 0.6 * Math.min(1, vf)); c.moveTo(xx + r, yy); c.arc(xx, yy, r, 0, TAU); }
      }
      c.fill();
      c.fillStyle = 'rgba(220,240,255,.85)'; c.beginPath();
      if (fwAmt > 0.02) { dotsP(c, P.fw, ph.fw, 9, 0.95); dotsP(c, P.cond, ph.fw, 9, 0.9); }
      dotsP(c, P.cwIn, ph.cw, 6, 0.75); dotsP(c, P.cwOut, ph.cw, 6, 0.75);
      c.fill();
      if (fwAmt > 0.02) { c.fillStyle = 'rgba(255,236,214,.75)'; c.beginPath(); dotsP(c, P.eq, ph.fw * 0.5, 7, 0.75); c.fill(); }
      if (steamAmt > 0.02) { c.fillStyle = `rgba(255,255,255,${(0.35 + 0.6 * sA).toFixed(2)})`; c.beginPath(); dotsP(c, P.steamL, ph.steam, 10, 1.1); dotsP(c, P.steamR, ph.steam, 10, 1.1); c.fill(); }
    }

    /* --- kor halesi --- */
    {
      const hg = c.createRadialGradient(ccx, ccy, 6, ccx, ccy, 44), a = dead ? 0.55 : 0.3 * clamp(bright, 0, 1.2);
      hg.addColorStop(0, dead ? `rgba(255,70,40,${a})` : `rgba(${gc[0]},${gc[1]},${gc[2]},${a.toFixed(3)})`); hg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = hg; c.fillRect(ccx - 44, ccy - 44, 88, 88);
    }
    /* --- grafit yığını --- */
    c.save(); c.beginPath(); c.rect(CO.x, CO.y, CO.w, CO.h); c.clip();
    c.fillStyle = g.graph; c.fillRect(CO.x, CO.y, CO.w, CO.h);
    c.strokeStyle = 'rgba(0,0,0,.32)'; c.lineWidth = 0.6; c.beginPath();
    for (let y = CO.y + 5; y < CO.y + CO.h; y += 5) { c.moveTo(CO.x, y); c.lineTo(CO.x + CO.w, y); }
    for (let x = CO.x + 5.5; x < CO.x + CO.w; x += 10) { c.moveTo(x, CO.y); c.lineTo(x, CO.y + CO.h); }
    c.stroke();
    {
      /* kanallar: eksenel kosinüs profili, radyal zayıflama */
      const cs = dead ? [255, 90, 50] : gc, cg = c.createLinearGradient(0, CO.y, 0, CO.y + CO.h), rgb = `${cs[0]},${cs[1]},${cs[2]}`;
      cg.addColorStop(0, `rgba(${rgb},.35)`); cg.addColorStop(0.5, `rgb(${rgb})`); cg.addColorStop(1, `rgba(${rgb},.35)`);
      c.fillStyle = cg;
      for (let i = 0; i < CHX.length; i++) {
        const x = CHX[i], rad = Math.cos((x - ccx) / (CO.w * 0.62) * 1.2), fl = now ? 0.9 + 0.1 * Math.sin(now / 260 + i * 1.9) : 1;
        const a = clamp((0.25 + 0.75 * rad) * bright * fl, 0.05, 1);
        if (dead) { c.globalAlpha = ga * a; c.fillRect(x - 1.3 + (hash(i) - 0.5) * 3, CO.y + hash(i + 9) * 6, 2.6, CO.h * (0.5 + 0.4 * hash(i + 3))); continue; }
        c.globalAlpha = ga * a * 0.3; c.fillRect(x - 3.2, CO.y, 6.4, CO.h);
        c.globalAlpha = ga * a; c.fillRect(x - 1.2, CO.y, 2.4, CO.h);
      }
      c.globalAlpha = ga;
    }
    /* kanallarda kaynama: üst kısımda kabarcıklar */
    if (!dead && v > 0.005) {
      const top = CO.y + 1, span = CO.h * 0.62;
      c.fillStyle = `rgba(245,250,255,${(0.45 + 0.4 * Math.min(1, vf)).toFixed(2)})`; c.beginPath();
      for (let i = 0; i < CHX.length; i++) for (let k = 0; k < 4; k++) {
        if (hash(i * 4 + k + 50) > vf * 0.85) continue;
        const y = top + span - ((ph.bub * 0.7 + k * span / 4 + hash(i + 70) * span) % span), r = 0.55 + 0.5 * (1 - (y - top) / span), x = CHX[i] + 0.3 * Math.sin(k + i);
        c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
      }
      c.fill();
    }
    /* çubuklar (üstten): soğurucu + grafit itici */
    if (dead) {
      c.beginPath(); for (let j = 0; j < RODX.length; j++) { const x = RODX[j], b = CO.y + CO.h * (0.2 + 0.5 * hash(j + 20)); c.moveTo(x, CO.y); c.lineTo(x + (hash(j) - 0.5) * 6, b); }
      c.strokeStyle = '#05080d'; c.lineWidth = 2.8; c.stroke(); c.strokeStyle = rodCol; c.lineWidth = 1.4; c.stroke();
    } else {
      const tip = CO.y + ins * CO.h, d0 = tip + 0.18 * CO.h, d1 = Math.min(CO.y + CO.h, d0 + 0.64 * CO.h);
      if (d1 > d0) { c.beginPath(); for (const x of RODX) { c.moveTo(x, d0); c.lineTo(x, d1); } c.strokeStyle = 'rgba(150,160,175,.35)'; c.lineWidth = 1.4; c.stroke(); }
      if (tip > CO.y + 0.3) { c.beginPath(); for (const x of RODX) { c.moveTo(x, CO.y); c.lineTo(x, tip); } c.strokeStyle = '#05080d'; c.lineWidth = 3; c.stroke(); c.strokeStyle = rodCol; c.lineWidth = 1.6; c.stroke(); }
    }
    c.restore();
    c.strokeStyle = dead ? '#ff5468' : DIM; c.lineWidth = 1.2; c.strokeRect(CO.x, CO.y, CO.w, CO.h);
    if (!dead && n > 1.1) { /* aşırı güç: kor çerçevesi kırmızı nabız */
      c.strokeStyle = `rgba(255,84,104,${(now ? 0.55 + 0.45 * Math.sin(now / 140) : 1).toFixed(2)})`; c.lineWidth = 1.6; c.strokeRect(CO.x - 0.5, CO.y - 0.5, CO.w + 1, CO.h + 1);
    }
    if (dead) { /* çatlaklar */
      c.strokeStyle = 'rgba(255,140,90,.9)'; c.lineWidth = 0.9; c.beginPath();
      c.moveTo(30, CO.y); c.lineTo(36, 64); c.lineTo(31, 75); c.lineTo(38, 88); c.moveTo(62, CO.y); c.lineTo(57, 68); c.lineTo(65, 80); c.moveTo(48, 70); c.lineTo(52, 78); c.lineTo(46, 86);
      c.stroke();
    }

    /* --- üst kalkan ve çubuk sürücüleri --- */
    if (dead) {
      c.save(); c.translate(US.x + US.w / 2, US.y - 6); c.rotate(-0.32);
      c.fillStyle = '#2a3446'; c.fillRect(-US.w / 2, -US.h / 2, US.w, US.h); c.strokeStyle = '#ff7b6b'; c.lineWidth = 1; c.strokeRect(-US.w / 2, -US.h / 2, US.w, US.h);
      c.restore();
      c.fillStyle = '#3a4250'; c.beginPath();
      for (let i = 0; i < 8; i++) { const x = 22 + hash(i + 30) * 52, y = 30 + hash(i + 40) * 14, s = 1.2 + hash(i + 50) * 2.2, a = hash(i) * 3, ca = Math.cos(a) * s, sa = Math.sin(a) * s; c.moveTo(x + ca, y + sa); c.lineTo(x - sa, y + ca); c.lineTo(x - ca, y - sa); c.lineTo(x + sa, y - ca); c.closePath(); }
      c.fill();
    } else {
      /* sürücülerden kalkana çubuk gövdeleri */
      c.beginPath(); for (const x of RODX) { c.moveTo(x, DRV_Y + DRV_H); c.lineTo(x, US.y + US.h); }
      c.strokeStyle = '#05080d'; c.lineWidth = 2.6; c.stroke();
      c.fillStyle = g.us; c.fillRect(US.x, US.y, US.w, US.h); c.strokeStyle = OUT; c.lineWidth = 1; c.strokeRect(US.x, US.y, US.w, US.h);
      c.beginPath(); for (const x of RODX) { c.moveTo(x, DRV_Y + DRV_H); c.lineTo(x, US.y + US.h); } c.strokeStyle = rodCol; c.lineWidth = 1.3; c.stroke();
      const drvCol = S.jammed ? '#ffc83d' : az ? '#ff5468' : S.stepback ? '#ff9a3d' : S.auto ? '#5fd3ff' : OUT;
      c.beginPath(); for (const x of RODX) c.rect(x - 2.6, DRV_Y, 5.2, DRV_H);
      c.fillStyle = '#132037'; c.fill(); c.strokeStyle = drvCol; c.lineWidth = 0.9; c.stroke();
      if ((az && azT < 20) || (S.stepback && !az)) {
        if (!now || Math.sin(now / 160) > -0.3) { c.fillStyle = az ? '#ff5468' : '#ff9a3d'; c.beginPath(); for (const x of RODX) chevP(c, x, DRV_Y - 2.6, HP, 2.2); c.fill(); }
      }
    }
    /* alt plaka (isim plakası) */
    c.fillStyle = g.ls; c.fillRect(LS.x, LS.y, LS.w, LS.h); c.strokeStyle = dead ? '#ff5468' : OUT; c.lineWidth = 1; c.strokeRect(LS.x, LS.y, LS.w, LS.h);

    /* --- ayırıcı tamburlar (iki tambur tek yolda) --- */
    {
      const lvl = dead ? 0.18 : clamp(0.46 + (v - 0.08) * 0.9, 0.32, 0.72), wob = now ? Math.sin(now / 700) * 0.35 : 0, D0 = DR[0], wy = D0.y + D0.h * (1 - lvl) + wob;
      c.beginPath(); for (const D of DR) capsuleP(c, D.x, D.y, D.w, D.h);
      c.fillStyle = g.drum; c.fill();
      c.save(); c.clip();
      c.fillStyle = dead ? g.waterD : g.water; c.fillRect(DR[0].x, wy, DR[1].x + DR[1].w - DR[0].x, D0.y + D0.h - wy);
      c.strokeStyle = dead ? 'rgba(160,120,110,.6)' : 'rgba(255,226,190,.9)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(DR[0].x, wy); c.lineTo(DR[1].x + DR[1].w, wy); c.stroke();
      if (!dead) { /* kaynayan yüzey: yükselen kabarcıklar */
        c.fillStyle = 'rgba(250,252,255,.6)'; c.beginPath();
        for (let d = 0; d < 2; d++) for (let k = 0; k < 5; k++) {
          if (hash(k + d * 5 + 90) > 0.25 + Math.min(1, vf) * 0.75) continue;
          const x = DR[d].x + 8 + k * 5.5, p = (ph.bub * 0.06 + hash(k + d * 7)) % 1, y = D0.y + D0.h - 1 - p * (D0.y + D0.h - 1 - wy);
          c.moveTo(x + 0.65, y); c.arc(x, y, 0.65, 0, TAU);
        }
        c.fill();
        c.fillStyle = `rgba(225,238,255,${(0.05 + 0.08 * sA).toFixed(3)})`; c.fillRect(DR[0].x, D0.y, DR[1].x + DR[1].w - DR[0].x, wy - D0.y);
      }
      c.restore();
      c.beginPath(); for (const D of DR) capsuleP(c, D.x, D.y, D.w, D.h); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
      /* normal seviye işareti */
      c.beginPath(); for (const D of DR) { const y = D.y + D.h * 0.5; c.moveTo(D.x + 1.5, y); c.lineTo(D.x + 4.5, y); c.moveTo(D.x + D.w - 4.5, y); c.lineTo(D.x + D.w - 1.5, y); }
      c.strokeStyle = 'rgba(95,211,255,.7)'; c.lineWidth = 0.8; c.stroke();
    }

    /* --- pompalar --- */
    {
      const warn = dead ? '#ff7b6b' : S.flow < 0.5 ? '#ff5468' : S.flow < 0.7 ? '#ffc83d' : OUT;
      if (!dead && flow > 0.02) { c.fillStyle = `rgba(95,211,255,${(0.05 + 0.06 * Math.min(1, flow)).toFixed(3)})`; c.beginPath(); for (const [x, y] of MCP) { c.moveTo(x + PR + 3, y); c.arc(x, y, PR + 3, 0, TAU); } c.fill(); }
      c.fillStyle = '#0b1626'; c.beginPath(); for (const [x, y] of MCP) { c.moveTo(x + PR, y); c.arc(x, y, PR, 0, TAU); } c.moveTo(FWP[0] + FR, FWP[1]); c.arc(FWP[0], FWP[1], FR, 0, TAU); c.fill();
      c.lineWidth = 1.4;
      c.beginPath(); for (const [x, y] of MCP) pumpP(c, x, y, PR, ph.mcp + x); c.strokeStyle = warn; c.stroke();
      c.beginPath(); pumpP(c, FWP[0], FWP[1], FR, ph.fwp); c.strokeStyle = dead ? '#ff7b6b' : OUT; c.stroke();
    }

    /* --- türbin, jeneratör, kondenser --- */
    c.fillStyle = '#101c2e'; c.beginPath(); polyP(c, NECK); c.closePath(); c.fill(); c.strokeStyle = DIM; c.lineWidth = 1; c.stroke();
    if (steamAmt > 0.02) { c.fillStyle = `rgba(230,240,255,${(0.25 + 0.5 * sA).toFixed(2)})`; c.beginPath(); dotsP(c, P.exh, ph.steam * 0.6, 6, 1.05); c.fill(); }
    {
      const { x, y, w, h } = TB;
      c.save(); c.beginPath(); c.moveTo(x, y + h * 0.3); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h * 0.7); c.closePath();
      c.fillStyle = g.turb; c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); c.clip();
      c.beginPath(); for (let i = 0; i < 7; i++) { const xx = x + ((i / 7 + ph.turb / TAU) % 1) * w; c.moveTo(xx, y); c.lineTo(xx + 3, y + h); }
      c.strokeStyle = `rgba(200,225,255,${(0.22 + 0.4 * (dead ? 0 : sA)).toFixed(2)})`; c.stroke();
      c.restore();
    }
    c.strokeStyle = DIM; c.lineWidth = 2; c.beginPath(); c.moveTo(TB.x + TB.w, GEN.y); c.lineTo(GEN.x - GEN.r, GEN.y); c.stroke();
    {
      const e = dead ? 0 : Math.min(1.2, steamAmt);
      if (e > 0.02) { c.fillStyle = `rgba(95,211,255,${(0.08 + 0.2 * e).toFixed(3)})`; c.beginPath(); c.arc(GEN.x, GEN.y, GEN.r + 2.5, 0, TAU); c.fill(); }
      c.fillStyle = '#0b1626'; c.beginPath(); c.arc(GEN.x, GEN.y, GEN.r, 0, TAU); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
      c.strokeStyle = e > 0.02 ? `rgba(95,211,255,${(0.45 + 0.5 * Math.min(1, e)).toFixed(2)})` : DIM; c.lineWidth = 1.1; c.beginPath();
      for (let i = 0; i <= 12; i++) { const xx = GEN.x - 4 + i * 8 / 12, yy = GEN.y - Math.sin(i / 12 * TAU) * 2.4; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.stroke();
    }
    /* kondenser: soğutma boruları, sıcak kuyu */
    {
      H.rr(CD.x, CD.y, CD.w, CD.h, 4); c.fillStyle = g.cond; c.fill();
      const hw = CD.y + CD.h - 6;
      c.save(); c.clip(); c.fillStyle = dead ? 'rgba(60,70,90,.7)' : 'rgba(60,127,208,.55)'; c.fillRect(CD.x, hw, CD.w, 6); c.restore();
      c.beginPath(); for (let r = 0; r < 2; r++) for (let k = 0; k < 8; k++) { const x = CD.x + 6 + k * 4.6 + r * 2.3, y = CD.y + 8 + r * 4.2; c.moveTo(x + 1.3, y); c.arc(x, y, 1.3, 0, TAU); }
      c.strokeStyle = COL.cw; c.lineWidth = 1; c.stroke();
      if (steamAmt > 0.02) { c.fillStyle = `rgba(200,225,255,${(0.3 + 0.4 * sA).toFixed(2)})`; c.beginPath(); for (let k = 0; k < 7; k++) { const x = CD.x + 8 + k * 5.2, p = (ph.steam * 0.04 + hash(k + 11)) % 1, y = CD.y + 14 + p * (hw - CD.y - 15); c.moveTo(x + 0.7, y); c.arc(x, y, 0.7, 0, TAU); } c.fill(); }
      H.rr(CD.x, CD.y, CD.w, CD.h, 4); c.strokeStyle = OUT; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = COL.cw; c.beginPath(); chevP(c, 152.5, CD.y + 19, Math.PI, 2); chevP(c, 154.5, CD.y + 5, 0, 2); c.fill();
    }

    /* --- yıkım: duman, kızıl parıltı --- */
    if (dead) {
      const t = now || 0, fl = t ? 0.75 + 0.25 * Math.sin(t / 90) * Math.sin(t / 37) : 1;
      const rg = c.createRadialGradient(ccx, CO.y + 6, 4, ccx, CO.y + 6, 62); rg.addColorStop(0, `rgba(255,90,40,${(0.5 * fl).toFixed(3)})`); rg.addColorStop(1, 'rgba(255,40,40,0)');
      c.fillStyle = rg; c.fillRect(0, 0, 158, 146);
      const amt = clamp(1 - (S.destroyT || 0) / 120, 0.45, 1);
      for (let i = 0; i < 4; i++) smoke(c, 28 + i * 13, US.y - 6, t + i * 650, amt, 6, i * 3);
      c.fillStyle = 'rgba(255,40,60,.08)'; c.fillRect(0, 0, 158, 146);
    }

    /* --- etiketler --- */
    const LC = '#9fb6d6';
    H.label(H.t('pl_drum'), 48, 5, 7, LC, 'center', 86);
    H.label(H.t('pl_core'), 48, LS.y + LS.h / 2 + 0.5, 7, dead ? '#ff9a9a' : '#c4d4ea', 'center', 58);
    H.label(H.t('pl_turb'), TB.x + TB.w / 2, 5, 7, LC, 'center', 48);
    H.label(H.t('pl_pump'), 3, 138.5, 7, LC, 'left', 40);
    c.restore();
  };
})();
