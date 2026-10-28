const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path'); const SCR = path.join(__dirname, 'out');
const BOT = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
(async () => {
  const browser = await chromium.launch(); const bctx = await browser.newContext(); await bctx.addInitScript(() => { window.__EVO_TEST__ = true; }); const page = await bctx.newPage();
  await page.goto('file://' + SCR + '/wrapped.html', { waitUntil: 'domcontentloaded' }); await page.evaluate(BOT);
  await page.evaluate(() => {
    window.__story = (runs, era, up) => { const E = window.__evolute, keep = JSON.stringify(E.save); let w = 0, wave = 0;
      for (let n = 0; n < runs; n++) { E.save.up = Object.assign({ atk: 0, hp: 0, spawn: 0 }, up); E.save.era = era; E.save.mode = 'normal'; E.save.clears = E.ERAS.map((_, i) => i < era ? 1 : 0); E.save.unlocked = era; E.newGame(); let s = 0;
        while (E.mode !== 'over' && s < 30000) { E.step(0.05); s++; if (E.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.mode === 'play') window.__bot(E); } if (E.g.win) w++; wave += E.g.waveReached; }
      Object.assign(E.save, JSON.parse(keep)); return +(w / runs).toFixed(2); };
    window.__evolute.ERAS = window.__evolute.ERAS; });
  const rows = [[0, [0, 0, 0]], [0, [4, 3, 3]], [1, [4, 3, 3]], [1, [8, 5, 5]], [2, [8, 5, 5]], [2, [12, 8, 8]], [3, [10, 6, 6]], [3, [14, 9, 9]], [3, [18, 11, 11]], [4, [14, 9, 9]], [4, [18, 11, 11]], [4, [20, 14, 14]], [5, [18, 11, 11]], [5, [20, 14, 14]], [5, [20, 20, 20]]];
  for (const [era, [a, h, sp]] of rows) console.log(`era${era} atk${a} hp${h} spawn${sp}: win`, await page.evaluate(([e, u]) => window.__story(80, e, u), [era, { atk: a, hp: h, spawn: sp }]));
  await browser.close();
})();
