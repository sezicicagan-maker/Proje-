/*MODEL_BEGIN*/
/* Basitleştirilmiş, EĞİTİM amaçlı RBMK tipi reaktör modeli. Sayılar INSAG-7 düzeyindeki bilgilerden hafızayla alınmış yaklaşık değerlerdir;
   mühendislik hesabı için KULLANILMAZ. Yapı gerçek fiziği izler: nokta kinetik (tek gecikmiş grup), Xe-135/I-135 zinciri, buhar boşluğu geri beslemesi,
   Doppler, çubuk hızı 0,4 m/s, ORM ve grafit uçlu çubukların pozitif scram etkisi, güç sıçramasında kanal deformasyonu (çubuk sıkışması). */
const M = (() => {
  const Pn = 3200, beta = 0.0048, Lam = 1e-3, lamD = 0.08;
  const NMAX = 30, wRod = 0.45, STROKE = 7, ROD_V = 0.4, FLOW_V = 0.012, Z = 300, ORM_SAFE = 26, ORM_MIN = 15;
  const gI = 0.061, gX = 0.003, lI = 0.1055, lX = 0.0758, kb = 0.38;
  const aD = 1.4e-5, vmax = 0.25, x0 = 0.3, U0 = 0.12, av0 = 5.0, cV = 2.0, ps0 = 4.4;
  const Xeq = n => (gI + gX) * n / (lX + kb * n), kappa = 6.5 * beta / Xeq(1);
  const S3 = x => x * x * (3 - 2 * x), ORM = p => NMAX * S3(Math.max(0, Math.min(1, p / STROKE)));
  const voidTarget = (q, f, sub) => { const x = Math.max(0, q / Math.max(0.05, f) - U0 * (sub === undefined ? 1 : sub)); return vmax * x / (x + x0); };
  const alphaV = orm => av0 * (1 + cV * Math.max(0, 1 - orm / ORM_SAFE)) * beta;
  function rho(s) {
    const orm = ORM(s.p), ps = s.az ? ps0 * beta * s.psF * (s.azT < 3.2 ? Math.sin(Math.PI * s.azT / 3.2) ** 2 : 0) : 0;
    return s.bias - wRod * beta * orm - kappa * s.X - aD * (s.Tf - 300) + alphaV(orm) * s.v + ps;
  }
  function create(o) {
    const s = { t: 0, n: o.n, C: beta * o.n / (Lam * lamD), p: o.p, pTarget: o.p, flow: o.flow, flowTarget: o.flow, v: 0, Tf: 300, X: 0, I: 0, bias: 0, az: false, azT: 0, psF: 0, jammed: false, destroyed: false, destroyT: 0, auto: false, nSet: o.n, hist: [], maxN: o.n, test: false, testT: 0, flowBase: o.flow, peakORMlow: 99 };
    const nh = o.nHist === undefined ? o.n : o.nHist;
    s.I = gI * nh / lI; s.X = Xeq(nh);
    s.Tf = 300 + 550 * o.n; s.sub = o.sub === undefined ? 1 : o.sub; s.v = voidTarget(o.n, o.flow, s.sub);
    s.bias = 0; s.bias = -rho(s);
    return s;
  }
  function stepRods(s, dt, cmd) {
    if (s.jammed) return;
    let tgt = s.az ? STROKE : s.pTarget;
    if (!s.az && s.auto) { const e = (s.nSet - s.n) / Math.max(0.03, s.nSet); tgt = s.p - Math.max(-1, Math.min(1, 2.2 * e)) * 0.8; tgt = Math.max(0, Math.min(STROKE, tgt)); s.pTarget = tgt; }
    const d = tgt - s.p, m = ROD_V * dt; s.p += Math.abs(d) <= m ? d : Math.sign(d) * m;
  }
  function step(s, dt) {
    if (s.destroyed) { s.destroyT += dt; return; }
    s.t += dt;
    if (s.az) s.azT += dt;
    if (s.test) { s.testT += dt; s.flowTarget = s.flowBase * (0.55 + 0.45 * Math.exp(-s.testT / 25)); }
    stepRods(s, dt);
    const df = s.flowTarget - s.flow, mf = FLOW_V * dt * (s.test ? 6 : 1); s.flow += Math.abs(df) <= mf ? df : Math.sign(df) * mf;
    const nsub = Math.max(1, Math.ceil(dt / 0.002)), h = dt / nsub;
    for (let i = 0; i < nsub; i++) {
      const r = rho(s), a = (r - beta) / Lam;
      const dn = (a * s.n + lamD * s.C) * h, dC = (beta / Lam * s.n - lamD * s.C) * h;
      s.n = Math.max(1e-7, s.n + dn); s.C = Math.max(0, s.C + dC);
      if (s.n > 4e3) { s.n = 4e3; }
    }
    const q = s.n;
    s.Tf += (300 + 550 * q - s.Tf) * (1 - Math.exp(-dt / 8));
    s.v += (voidTarget(q, s.flow, s.sub) - s.v) * (1 - Math.exp(-dt / 1.5));
    const dh = dt * Z / 3600;
    s.I += (gI * q - lI * s.I) * dh; s.X = Math.max(0, s.X + (gX * q + lI * s.I - lX * s.X - kb * q * s.X) * dh);
    s.maxN = Math.max(s.maxN, s.n);
    if (s.az) s.maxAz = Math.max(s.maxAz || 0, s.n);
    if (!s.jammed && s.n > 8) { s.jammed = true; s.jamP = s.p; }
    if (s.n > 10) { s.over10 = (s.over10 || 0) + dt; if (s.over10 > 0.3) { s.destroyed = true; s.destroyT = 0; } }
  }
  function azStart(s) { if (s.az) return; s.az = true; s.azN = s.n; s.azT = 0; s.psF = Math.max(0, 1 - ORM(s.p) / ORM_SAFE); s.azORM = ORM(s.p); }
  const info = s => ({ mw: s.n * Pn, orm: ORM(s.p), rho$: rho(s) / beta, xe$: -kappa * s.X / beta, void: s.v, flow: s.flow, p: s.p, period: 0 });
  return { ps0, Pn, beta, ORM_SAFE, ORM_MIN, STROKE, ROD_V, Z, create, step, azStart, ORM, rho, info, Xeq, kappa, voidTarget, alphaV };
})();
/*MODEL_END*/
if (typeof module !== 'undefined') module.exports = M;
