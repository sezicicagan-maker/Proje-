const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
  const p = await ctx.newPage(); await p.goto('file://' + path.join('/home/user/Proje-', 'games', 'rbmk-sim', 'index.html')); await p.waitForTimeout(300);
  const res = await p.evaluate(() => {
    const R = window.__rb, out = {};
    for (const ty of ['rbmk', 'candu', 'pwr']) {
      R.initScenario('train', ty); R.playing = false; const S = () => R.S; let first = null;
      for (let i = 0; i < 20 * 150; i++) { R.tick(); if (R.ts < 0.5 && !first) { const s = S(); const per = s.rate > 1e-3 ? 1 / s.rate : Infinity; first = { t: +(i * 0.05).toFixed(2), n: +s.n.toFixed(3), nSet: +s.nSet.toFixed(3), D: +s.D.toFixed(3), per: isFinite(per) ? +per.toFixed(1) : 'inf', rate: +s.rate.toFixed(4), auto: s.auto }; } }
      out[ty] = first; document.getElementById('ov').hidden = true;
    }
    return out;
  });
  console.log(JSON.stringify(res, null, 1)); await b.close();
})();
