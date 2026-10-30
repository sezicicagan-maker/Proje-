/*MODEL_BEGIN*/
/* Basitleştirilmiş, EĞİTİM amaçlı reaktör modelleri (RBMK, PWR, BWR, CANDU). Sayılar kamuya açık kaynaklardan hafızayla alınmış yaklaşık değerlerdir;
   mühendislik hesabı için KULLANILMAZ. Ortak yapı: nokta kinetik (tek gecikmiş grup), Xe-135/I-135 zinciri, buhar boşluğu ve Doppler geri beslemesi,
   çubuk hızı/ORM, türe özgü: RBMK pozitif boşluk + pozitif scram + sıkışma; PWR borik asit + moderatör sıcaklığı; BWR debiyle güç; CANDU hızlı kapatma + güçlü ksenon. */
const M = (() => {
  const Z = 300, gI = 0.061, gX = 0.003, lI = 0.1055, lX = 0.0758, lamD = 0.08;
  const XeqF = (n, kb) => (gI + gX) * n / (lX + kb * n);
  const TYPES = {
    rbmk: { id: 'rbmk', Pn: 3200, beta: 0.0048, Lam: 1e-3, stroke: 7, vRod: 0.4, vAz: 0.4, N: 30, wRod: 0.45, warn: 26, minM: 15, aD: 1.4e-5, Tf: 550,
      vsign: 1, vmax: 0.25, x0: 0.3, U0: 0.12, av0: 5, cV: 2, ps0: 4.4, tauV: 1.5, kb: 0.38, xeW: 6.5, boron: false, mod: false, tripN: 1.2, tripPer: 10, tripFlow: 0.45, init: { n: 1, orm: 15, flow: 1 } },
    pwr: { id: 'pwr', Pn: 3000, beta: 0.0065, Lam: 2e-5, stroke: 3.66, vRod: 0.06, vAz: 1.5, N: 30, wRod: 0.4, warn: 20, minM: 10, aD: 2.5e-5, Tf: 450,
      vsign: 1, vmax: 0.02, x0: 0.5, U0: 1, av0: 0, cV: 0, ps0: 0, tauV: 1.5, kb: 0.45, xeW: 5.5, boron: true, bW: 8e-5, bRate: 4, bMax: 1500, mod: true, aM: 3e-4, kT: 12, tripN: 1.09, tripPer: 3, tripFlow: 0, init: { n: 1, orm: 22, flow: 1, boron: 900 } },
    bwr: { id: 'bwr', Pn: 3300, beta: 0.0055, Lam: 4e-5, stroke: 3.66, vRod: 0.05, vAz: 1.2, N: 30, wRod: 0.45, warn: 20, minM: 10, aD: 2e-5, Tf: 500,
      vsign: -1, vmax: 0.6, x0: 0.5, U0: 0.05, av0: 27, cV: 0, ps0: 0, tauV: 2.2, kb: 0.45, xeW: 5.5, boron: false, mod: false, tripN: 1.2, tripPer: 5, tripFlow: 0.4, init: { n: 1, orm: 20, flow: 0.9 } },
    candu: { id: 'candu', Pn: 2060, beta: 0.0049, Lam: 9e-4, stroke: 3, vRod: 0.1, vAz: 3, N: 14, wRod: 0.5, warn: 8, minM: 4, aD: 1.2e-5, Tf: 500,
      vsign: 1, vmax: 0.4, x0: 0.4, U0: 1.05, av0: 2.9, cV: 0, ps0: 0, tauV: 1.5, kb: 0.8, xeW: 4.5, boron: false, mod: false, tripN: 1.1, tripPer: 6, tripFlow: 0.6, init: { n: 1, orm: 8, flow: 1 } }
  };
  const S3 = x => x * x * (3 - 2 * x);
  const ORM = (s, p) => s.T.N * S3(Math.max(0, Math.min(1, p / s.T.stroke)));
  const pForOrm = (T, orm) => { let lo = 0, hi = 1; const f = x => T.N * S3(x); for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; f(m) < orm ? lo = m : hi = m; } return lo * T.stroke; };
  const voidTarget = (s, q, f, sub) => { const T = s.T, x = Math.max(0, q / Math.max(0.05, f) - T.U0 * (sub === undefined ? 1 : sub)); return T.vmax * x / (x + T.x0); };
  const alphaV = (s, orm) => s.T.vsign * s.T.av0 * (1 + s.T.cV * Math.max(0, 1 - orm / s.T.warn)) * s.T.beta;
  const tRef = D => 288 + 16 * D;
  function rho(s) {
    const T = s.T, orm = ORM(s, s.p);
    const ps = s.az && T.ps0 ? T.ps0 * T.beta * s.psF * (s.azT < 3.2 ? Math.sin(Math.PI * s.azT / 3.2) ** 2 : 0) : 0;
    let r = s.bias - T.wRod * T.beta * orm - s.kappa * s.X - T.aD * (s.Tf - 300) + alphaV(s, orm) * s.v + ps;
    if (T.boron) r -= T.bW * s.boron; if (T.mod) r -= T.aM * (s.Tm - 300);
    return r;
  }
  function create(type, o) {
    const T = typeof type === 'string' ? TYPES[type] : type; o = o || {}; const I = T.init;
    const n0 = o.n === undefined ? I.n : o.n, p0 = o.p === undefined ? pForOrm(T, o.orm === undefined ? I.orm : o.orm) : o.p, f0 = o.flow === undefined ? I.flow : o.flow;
    const s = { T, type: T.id, t: 0, n: n0, C: T.beta * n0 / (T.Lam * lamD), p: p0, pTarget: p0, flow: f0, flowTarget: f0, v: 0, Tf: 300, Tm: 300, X: 0, I: 0, bias: 0, kappa: T.xeW * T.beta / XeqF(1, T.kb), az: false, azT: 0, psF: 0, jammed: false, destroyed: false, destroyT: 0, auto: false, interlock: true, bypass: false, nSet: n0, D: n0, maxN: n0, test: false, testT: 0, rate: 0, nPrev: n0,
      boron: o.boron === undefined ? (I.boron || 0) : o.boron, boronTarget: o.boron === undefined ? (I.boron || 0) : o.boron, pLock: pForOrm(T, T.minM), sub: o.sub === undefined ? 1 : o.sub };
    const nh = o.nHist === undefined ? n0 : o.nHist; s.I = gI * nh / lI; s.X = XeqF(nh, T.kb);
    s.Tm = T.mod ? tRef(n0) : 300; s.Tf = T.mod ? s.Tm + T.Tf * n0 : 300 + T.Tf * n0; s.v = voidTarget(s, n0, f0, s.sub);
    s.bias = 0; s.bias = -rho(s); return s;
  }
  function stepRods(s, dt) {
    if (s.jammed) return; const T = s.T; let tgt = s.az ? T.stroke : s.pTarget, v = s.az ? T.vAz : T.vRod;
    if (!s.az && s.auto) {
      let d; const k = T.stroke / 7;
      if (T.mod) { const e = (tRef(s.D) - s.Tm) / 2; d = -Math.max(-1, Math.min(1, e)) * 0.5 * k; }
      else { const e = (s.nSet - s.n) / Math.max(0.03, s.nSet); d = -Math.max(-1, Math.min(1, 2.2 * e)) * 0.8 * k; if (d < 0 && s.rate > 1 / 30) d = 0; if (s.rate > 1 / 15) d = Math.max(d, 0.3 * k); }
      tgt = Math.max(0, Math.min(T.stroke, s.p + d)); s.pTarget = tgt;
    }
    if (s.interlock) tgt = Math.max(tgt, Math.min(s.p, s.pLock));
    const d2 = tgt - s.p, m = v * dt; s.p += Math.abs(d2) <= m ? d2 : Math.sign(d2) * m;
  }
  function step(s, dt) {
    if (s.destroyed) { s.destroyT += dt; return; }
    const T = s.T; s.t += dt; if (s.az) s.azT += dt;
    if (s.test) { s.testT += dt; s.flowTarget = s.flowBase * (0.55 + 0.45 * Math.exp(-s.testT / 25)); }
    stepRods(s, dt);
    const df = s.flowTarget - s.flow, mf = 0.012 * dt * (s.test ? 6 : 1) * (T.id === 'bwr' ? 3 : 1); s.flow += Math.abs(df) <= mf ? df : Math.sign(df) * mf;
    if (T.boron) { const db = s.boronTarget - s.boron, mb = T.bRate * dt; s.boron += Math.abs(db) <= mb ? db : Math.sign(db) * mb; }
    const nsub = Math.max(1, Math.ceil(dt / 0.002)), h = dt / nsub;
    for (let i = 0; i < nsub; i++) {
      const r = rho(s), a = (r - T.beta) / T.Lam;
      s.n = a < 0 ? (s.n + h * lamD * s.C) / (1 - h * a) : s.n * Math.exp(a * h) + h * lamD * s.C; s.n = Math.max(1e-7, Math.min(4e3, s.n));
      s.C = Math.max(0, s.C + (T.beta / T.Lam * s.n - lamD * s.C) * h);
    }
    { const r = (Math.log(s.n) - Math.log(s.nPrev || s.n)) / dt; s.rate = 0.9 * (s.rate || 0) + 0.1 * r; s.nPrev = s.n; }
    const q = s.n;
    if (T.mod) { s.Tm += T.kT * (q - s.D) * dt; s.Tm = Math.max(250, Math.min(360, s.Tm)); s.Tf += (s.Tm + T.Tf * q - s.Tf) * (1 - Math.exp(-dt / 8)); }
    else s.Tf += (300 + T.Tf * q - s.Tf) * (1 - Math.exp(-dt / 8));
    s.v += (voidTarget(s, q, s.flow, s.sub) - s.v) * (1 - Math.exp(-dt / T.tauV));
    const dh = dt * Z / 3600; s.I += (gI * q - lI * s.I) * dh; s.X = Math.max(0, s.X + (gX * q + lI * s.I - lX * s.X - T.kb * q * s.X) * dh);
    s.maxN = Math.max(s.maxN, s.n); if (s.az) s.maxAz = Math.max(s.maxAz || 0, s.n);
    if (!s.jammed && s.n > 8 && T.id === 'rbmk') { s.jammed = true; s.jamP = s.p; }
    if (s.n > 10) { s.over10 = (s.over10 || 0) + dt; if (s.over10 > 0.3) { s.destroyed = true; s.destroyT = 0; } }
  }
  function azStart(s) { if (s.az) return; s.az = true; s.azN = s.n; s.azT = 0; s.psF = Math.max(0, 1 - ORM(s, s.p) / s.T.warn); s.azORM = ORM(s, s.p); }
  const xenonPct = s => s.X / XeqF(1, s.T.kb) * 100, xenonRods = s => s.kappa * s.X / (s.T.wRod * s.T.beta);
  const info = s => ({ mw: s.n * s.T.Pn, orm: ORM(s, s.p), 'rho$': rho(s) / s.T.beta, 'xe$': -s.kappa * s.X / s.T.beta, void: s.v, flow: s.flow, p: s.p });
  return { TYPES, Z, create, step, azStart, ORM, rho, info, pForOrm, xenonPct, xenonRods, tRef, XeqF };
})();
/*MODEL_END*/
if (typeof module !== 'undefined') module.exports = M;
