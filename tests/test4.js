const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path'); const SCR = path.join(__dirname, 'out');
const body = fs.readFileSync(path.join(__dirname, '..', 'prototype', 'evolute.html'), 'utf8');
fs.writeFileSync(SCR + '/wrapped.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const BOT = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'en-US' });
  await ctx.addInitScript(() => { window.__EVO_TEST__ = true; }); const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts|net::/.test(m.text())) errs.push(m.text()); });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('file://' + SCR + '/wrapped.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(BOT); await page.waitForTimeout(400);
  await page.evaluate(() => { const E = window.__evolute; E.save.tut = 1; });

  // 1) sonsuz mod kilitli, çağ bitince açılır
  ok(await page.evaluate(() => document.querySelector('[data-mode="endless"]').disabled), 'sonsuz mod başta kilitli');
  await page.evaluate(() => { const E = window.__evolute; E.save.clears = [1, 0, 0]; E.showMenu(); });
  ok(await page.evaluate(() => !document.querySelector('[data-mode="endless"]').disabled), 'çağ tamamlanınca sonsuz mod açıldı');
  await page.click('[data-mode="endless"]');
  ok(await page.evaluate(() => window.__evolute.save.mode) === 'endless', 'mod seçildi');
  await page.screenshot({ path: SCR + '/x-menu.png' });
  // 2) sonsuz mod simülasyonu: 10. dalgada bitmemeli, boss dalga 20'de
  const sim = await page.evaluate(() => {
    const E = window.__evolute; const out = { runs: 0, wins: 0, over10: 0, maxWave: 0, crash: 0, bossesSeen: 0 };
    E.save.up = { atk: 12, hp: 8, spawn: 8 };
    for (let n = 0; n < 12; n++) {
      E.newGame(); let s = 0, boss = new Set();
      try { while (E.mode !== 'over' && s < 40000) { E.step(0.05); s++; if (E.g.enemies.some(e => e.boss)) boss.add(E.g.waveReached); if (E.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.mode === 'play') window.__bot(E); } } catch (e) { out.crash++; out.err = String(e.stack || e); }
      out.runs++; if (E.g.win) out.wins++; if (E.g.waveReached > 10) out.over10++; out.maxWave = Math.max(out.maxWave, E.g.waveReached); out.bossesSeen = Math.max(out.bossesSeen, boss.size);
      if (!E.g.endless) out.notEndless = true;
    }
    return out;
  });
  console.log('endless sim', JSON.stringify(sim));
  ok(sim.crash === 0 && !sim.notEndless && sim.wins === 0 && sim.over10 > 0, 'sonsuz mod: çökme yok, galibiyetle bitmiyor, 10. dalga geçiliyor');
  const nb = await page.evaluate(() => ({ best: window.__evolute.save.best[0], txt: document.querySelector('.ov').textContent }));
  ok(nb.best > 10, 'rekor kaydedildi: dalga ' + nb.best);
  await page.screenshot({ path: SCR + '/x-endless-result.png' });
  // sonsuz oyun HUD
  await page.evaluate(() => { const E = window.__evolute; E.newGame(); for (let i = 0; i < 40; i++) E.step(0.05); });
  await page.waitForTimeout(300); await page.screenshot({ path: SCR + '/x-endless-hud.png' });
  // 3) başarımlar
  const ach = await page.evaluate(() => {
    const E = window.__evolute; E.save.ach = {}; E.save.dna = 0; E.save.stats = { merges: 600, kills: 120, maxTier: 5, maxCombo: 4 }; E.save.wins = 1; E.save.runs = 3;
    const g = { newAch: [] }; E.checkAch(g); return { n: g.newAch.map(a => a.id), dna: E.save.dna, total: E.ACH.length };
  });
  console.log('achievements', JSON.stringify(ach));
  ok(ach.n.includes('merges50') && ach.n.includes('merges500') && !ach.n.includes('merges2500') && ach.n.includes('kills100') && ach.n.includes('wins1') && ach.dna > 0 && ach.total === 26, 'başarımlar doğru açılıyor, DNA ödülü verildi');
  await page.evaluate(() => { window.__evolute.showMenu(); });
  await page.click('[data-act="ach"]'); await page.waitForTimeout(600);
  ok(await page.evaluate(() => document.querySelectorAll('.ov .row').length) === 26, 'başarım ekranında 26 satır');
  await page.screenshot({ path: SCR + '/x-ach.png' });
  await page.click('[data-act="back"]');
  // 4) grafik kalitesi
  await page.click('[data-act="settings"]'); await page.screenshot({ path: SCR + '/x-settings.png' });
  await page.click('[data-act="gfx"]');
  ok(await page.evaluate(() => window.__evolute.LOW === true && window.__evolute.save.gfx === 'low'), 'düşük grafik açıldı');
  await page.evaluate(() => { const E = window.__evolute; E.save.mode = 'normal'; E.newGame(); for (let i = 0; i < 120; i++) { E.step(0.05); if (i % 6 === 0 && E.mode === 'play') window.__bot(E); } });
  await page.waitForTimeout(300); await page.screenshot({ path: SCR + '/x-low.png' });
  await page.evaluate(() => { window.__evolute.showSettings(); }); await page.click('[data-act="gfx"]');
  ok(await page.evaluate(() => window.__evolute.LOW === false), 'otomatiğe dönüldü');
  // 5) konfeti + zafer
  const cf = await page.evaluate(() => { const E = window.__evolute; E.newGame(); E.endRun(true); return E.g.fx.filter(f => f.type === 'conf').length; });
  ok(cf >= 60, 'zaferde konfeti: ' + cf);
  await page.waitForTimeout(500); await page.screenshot({ path: SCR + '/x-confetti.png' });
  // 6) normal mod hâlâ 10 dalgada bitiyor
  const nm = await page.evaluate(() => { const E = window.__evolute; E.save.mode = 'normal'; E.save.up = { atk: 14, hp: 9, spawn: 9 }; E.newGame(); let s = 0; while (E.mode !== 'over' && s < 20000) { E.step(0.05); s++; if (E.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.mode === 'play') window.__bot(E); } return { win: E.g.win, wave: E.g.waveReached, endless: E.g.endless }; });
  ok(!nm.endless && nm.wave <= 10, 'normal mod 10 dalgada bitiyor ' + JSON.stringify(nm));
  console.log('HATALAR:', errs.length ? errs : 'yok'); if (errs.length) fails++;
  console.log(fails ? `\n${fails} BAŞARISIZ` : '\nHEPSİ GEÇTİ');
  await browser.close();
})();
