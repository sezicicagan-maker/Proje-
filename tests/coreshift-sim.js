// Core Shift denge ölçümü: botlar vardiyaları oynar, kazanma oranı ve ısı raporlanır.
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); await ctx.addInitScript(() => { window.__CS_TEST__ = true; });
  const p = await ctx.newPage(); await p.goto('file://' + path.join(__dirname, '..', 'games', 'core-shift', 'index.html')); await p.waitForTimeout(300);
  const res = await p.evaluate(() => {
    const C = window.__cs; const out = {};
    const mkRng = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const bots = {
      idle: S => {},
      maxCool: S => { S.pump = 1; S.rods = Math.max(0, Math.min(1, 1 - C.demandAt(S, S.t + 3) / 100)); },
      good: S => {
        const D = C.demandAt(S, S.t + 3), v = Math.max(0, S.T - 75) * 0.012;
        const target = Math.min(1, Math.max(0, 1 - D / (100 * (1 + v))));
        if (S.t >= S.lockUntil) S.rods += (target - S.rods) * 0.4;
        let pump = 0.55 * S.P / 46 + (S.T - 66) * 0.05; if (S.T > 80) S.rods = Math.min(1, S.rods + 0.03);
        S.pump = Math.max(0.1, Math.min(1, pump));
      },
      sloppy: S => { if (Math.floor(S.t * 20) % 40 === 0) { S.rods = Math.max(0, Math.min(1, 1 - C.demandAt(S, S.t) / 100 + (Math.random() - 0.5) * 0.25)); S.pump = Math.max(0.2, Math.min(1, 0.4 + Math.random() * 0.5)); } },
    };
    for (const [name, bot] of Object.entries(bots)) {
      out[name] = {};
      for (const n of [1, 2, 4, 6, 8]) {
        let melts = 0, sum = 0, peak = 0, N = 25, star = [0, 0, 0, 0];
        for (let k = 0; k < N; k++) {
          const S = C.newShift(n, mkRng(1000 * n + k + 7)); let steps = 0;
          while (!S.over && steps < 4000) { bot(S); if (name === 'good' && S.hot) C.scram && 0; C.step(S, C.DT); steps++; }
          const pc = C.pct(S); if (S.melted) melts++; sum += pc; peak += S.peakT; star[C.starsOf(S, pc)]++;
        }
        out[name][n] = { avg: Math.round(sum / N), melts, peak: Math.round(peak / N), stars: star.join('/') };
      }
    }
    return out;
  });
  for (const [k, v] of Object.entries(res)) { console.log(k); for (const [n, r] of Object.entries(v)) console.log('  shift', n, JSON.stringify(r)); }
  await b.close();
})();
