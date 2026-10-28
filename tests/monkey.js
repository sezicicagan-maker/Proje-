const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path'); const SCR = path.join(__dirname, 'out');
const BOT = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
const SEED = +process.argv[2] || 1, N = +process.argv[3] || 700;
let a = SEED; const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, locale: ['en-US', 'tr-TR', 'de-DE', 'ja-JP'][SEED % 4] });
  await ctx.addInitScript(() => { window.__EVO_TEST__ = true; });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('file://' + SCR + '/wrapped.html', { waitUntil: 'domcontentloaded' }); await page.evaluate(BOT); await page.waitForTimeout(300);
  // zor ilerleme: rastgele kayıt durumu
  await page.evaluate(seed => { const E = window.__evolute; E.save.dna = 5e4; E.save.unlocked = 5; E.save.clears = [1, 1, 1, 1, 1, 0]; E.save.era = seed % 6; E.save.tut = seed % 2; for (let el = 0; el < 3; el++) for (let t = 1; t <= 8; t++) if (Math.random() < .5) E.save.codex[(seed % 6) + ':' + el + ':' + t] = 1; }, SEED);
  const box = await page.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
  const toScr = (x, y) => [box[0] + x / 360 * box[2], box[1] + y / 720 * box[3]];
  const stats = { clicks: 0, drags: 0, taps: 0, steps: 0 }; let bad = null;
  const check = () => page.evaluate(() => {
    const E = window.__evolute, g = E.g, probs = [], fin = (v, n) => { if (typeof v === 'number' && !Number.isFinite(v)) probs.push('NaN ' + n); };
    for (const k of ['dna', 'runs', 'wins']) fin(E.save[k], 'save.' + k);
    if (E.save.dna < 0) probs.push('dna<0'); if (E.save.era > E.save.unlocked) probs.push('era>unlocked');
    if (g) {
      for (const k of ['hp', 'gold', 't', 'shake']) fin(g[k], 'g.' + k); if (g.hp < 0) probs.push('hp<0'); if (g.gold < 0) probs.push('gold<0');
      g.board.forEach(u => { if (u && (!(u.tier >= 1 && u.tier <= 8) || ![0, 1, 2].includes(u.el))) probs.push('bad unit ' + JSON.stringify(u)); });
      g.enemies.forEach(e => { fin(e.x, 'e.x'); fin(e.y, 'e.y'); fin(e.hp, 'e.hp'); });
      if (g.fx.length > 4000) probs.push('fx leak ' + g.fx.length); if (g.enemies.length > 300) probs.push('enemy flood'); if (g.anims.length > 400) probs.push('anims leak'); if (g.proj.length > 3000) probs.push('proj leak');
    }
    return probs;
  });
  for (let i = 0; i < N && !bad; i++) {
    const r = rnd();
    try {
      if (r < 0.28) { // overlay düğmesine tıkla
        const btns = await page.$$('.ov button:not([disabled])');
        const cand = []; for (const b of btns) { const d = await b.evaluate(e => e.dataset.act || ''); if (d !== 'resetyes' && d !== 'reset') cand.push(b); }
        if (cand.length) { await cand[Math.floor(rnd() * cand.length)].click({ timeout: 1500 }).catch(() => {}); stats.clicks++; }
      } else if (r < 0.62) { // sürükle
        const [x0, y0] = toScr(rnd() * 360, 312 + rnd() * 360), [x1, y1] = toScr(rnd() * 360, 312 + rnd() * 360);
        await page.mouse.move(x0, y0); await page.mouse.down(); await page.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 2 }); await page.mouse.move(x1, y1, { steps: 2 }); await page.mouse.up(); stats.drags++;
      } else if (r < 0.74) { // rastgele dokunma (HUD dahil)
        const [x, y] = toScr(rnd() * 360, rnd() * 720); await page.mouse.click(x, y); stats.taps++;
      } else if (r < 0.9) { // zamanı ilerlet, botla oyna
        await page.evaluate(() => { const E = window.__evolute; if (E.g && (E.mode === 'play' || E.mode === 'ending')) for (let k = 0; k < 120; k++) { E.step(0.05); if (E.mode === 'pick') E.pickMut(E.g.pickOffer[Math.floor(Math.random() * 3)]); if (k % 10 === 0 && E.mode === 'play') window.__bot(E); } }); stats.steps++;
      } else if (r < 0.95) { await page.evaluate(() => { const E = window.__evolute; if (E.g && E.mode === 'play') E.pauseGame(); }); }
      else { await page.evaluate(() => { const E = window.__evolute; E.handleBack(); }); }
      await page.waitForTimeout(8);
      const pr = await check(); if (pr.length) bad = { i, pr };
    } catch (e) { errs.push('driver: ' + String(e.message).slice(0, 120)); }
    if (errs.some(e => e.startsWith('pageerror') || e.startsWith('console'))) bad = bad || { i, errs: errs.slice() };
  }
  console.log(`seed ${SEED}: actions ${N}`, JSON.stringify(stats), bad ? 'SORUN ' + JSON.stringify(bad).slice(0, 400) : 'temiz', errs.filter(e => !e.startsWith('driver')).length ? errs.slice(0, 3) : '');
  await browser.close(); process.exit(bad ? 1 : 0);
})();
