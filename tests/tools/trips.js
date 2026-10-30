const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join('/home/user/Proje-', 'games', 'rbmk-sim', 'index.html')); await p.waitForTimeout(300);
  const res = await p.evaluate(() => {
    const R = window.__rb, M = R.M, out = {}; let seed = 1; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const reasons = () => R.S._tripWhy || (R.S.az ? 'trip' : null);
    for (const ty of ['rbmk', 'pwr', 'bwr', 'candu']) for (const sn of ['train', 'move', 'sand']) {
      const stats = { runs: 0, trips: 0, slow: 0, destroyed: 0, ended: 0, tripTimes: [], maxN: 0 };
      for (let k = 0; k < 12; k++) {
        seed = 100 * k + 7; R.initScenario(sn, ty); R.playing = false; const S = () => R.S; let tripped = false, slowSeen = false, t = 0; seed += 1;
        // insan benzeri: sandbox'ta rastgele kaydırıcı hareketleri; train/move'da varsayılan AUTO + arada küçük müdahale
        for (let i = 0; i < 20 * (sn === 'sand' ? 240 : 220); i++) {
          t = i * 0.05; if (sn === 'sand' && i % (20 * (4 + Math.floor(rnd() * 6))) === 0) {
            const a = rnd(), s = S(); const T = s.T;
            if (a < 0.35) { s.auto = false; s.pTarget = Math.max(0, Math.min(T.stroke, s.pTarget + (rnd() - 0.5) * 1.6)); }
            else if (a < 0.6 && T.id !== 'pwr') s.flowTarget = Math.max(0.5, Math.min(1.1, s.flowTarget + (rnd() - 0.5) * 0.25));
            else if (a < 0.8 && T.id === 'pwr') s.boronTarget = Math.max(300, Math.min(1400, s.boronTarget + (rnd() - 0.5) * 200));
            else if (a < 0.9 && T.id === 'pwr') s.D = Math.max(0.3, Math.min(1, s.D + (rnd() - 0.5) * 0.4));
            else { s.auto = !s.auto; if (s.auto && T.id !== 'pwr') s.nSet = Math.max(0.05, Math.min(1, s.n + (rnd() - 0.5) * 0.3)); }
          }
          R.tick(); if (S().az && !tripped) { tripped = true; stats.trips++; stats.tripTimes.push(Math.round(t)); }
          if (R.ts < 0.5) slowSeen = true; if (S().destroyed) break; stats.maxN = Math.max(stats.maxN, S().n);
          if (document.getElementById('ov') && !document.getElementById('ov').hidden) break; // senaryo bitti
        }
        stats.runs++; if (slowSeen) stats.slow++; if (S().destroyed) stats.destroyed++; if (!document.getElementById('ov').hidden) stats.ended++;
        document.getElementById('ov').hidden = true;
      }
      out[ty + ':' + sn] = stats;
    }
    return out;
  });
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(12), `runs ${v.runs} trip ${v.trips} slowmo ${v.slow} destroyed ${v.destroyed} ended ${v.ended} maxN ${v.maxN.toFixed(2)} tripTimes ${v.tripTimes.join(',')}`);
  console.log('errs', errs); await b.close();
})();
