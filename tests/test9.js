const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path'); const SCR = path.join(__dirname, 'out');
const body = fs.readFileSync(path.join(__dirname, '..', 'prototype', 'evolute.html'), 'utf8');
fs.writeFileSync(SCR + '/wrapped.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  await ctx.addInitScript(() => { window.__EVO_TEST__ = true; });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('file://' + SCR + '/wrapped.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { const E = window.__evolute; E.save.tut = 1; E.save.dna = 900; E.save.unlocked = 2; E.persist(); E.showMenu(); });
  await page.waitForTimeout(700);
  // tek tıklamada sınıf yakala (animasyon bitmeden)
  const probe = async sel => page.evaluate(s => new Promise(res => {
    const b = document.querySelector(s); if (!b) return res(null);
    b.click(); requestAnimationFrame(() => res({ cls: [...b.classList].filter(c => c.startsWith('fx-'))[0] || null, bp: document.querySelectorAll('.bp').length }));
  }), sel);
  const seen = {};
  const goMenu = () => page.evaluate(() => window.__evolute.showMenu()).then(() => page.waitForTimeout(450));
  for (const [name, sel] of [['lab', '[data-act=lab]'], ['ach', '[data-act=ach]'], ['hab', '[data-act=hab]'], ['codex', '[data-act=codex]'], ['settings', '[data-act=settings]'], ['mode', '[data-mode]'], ['era', '[data-era="1"]']]) {
    const r = await probe(sel); await page.waitForTimeout(450); seen[name] = r && r.cls; await goMenu();
  }
  console.log(seen);
  ok(new Set(Object.values(seen)).size >= 6, 'menü düğmeleri farklı animasyonlar kullanıyor: ' + [...new Set(Object.values(seen))].join(','));
  // ayarlar anahtarları
  await page.evaluate(() => window.__evolute.showSettings()); await page.waitForTimeout(500);
  const t1 = await probe('[data-act=vib]'); await page.waitForTimeout(450);
  ok(t1 && t1.cls === 'fx-squeeze', 'anahtar düğmesi squeeze: ' + (t1 && t1.cls));
  const lg = await probe('[data-lang=de]'); await page.waitForTimeout(450);
  ok(lg && lg.cls === 'fx-flip', 'dil düğmesi flip');
  ok(await page.evaluate(() => !!document.querySelector('.mini.sw')), 'switch görünümü var');
  await page.screenshot({ path: SCR + '/fx-settings.png' });
  // geri: sola kayış
  const bk = await page.evaluate(() => new Promise(res => { document.querySelector('[data-act=back]').click(); requestAnimationFrame(() => res(document.getElementById('ov').className)); }));
  ok(/go-l/.test(bk), 'geri düğmesi sol geçiş: ' + bk);
  await page.waitForTimeout(500);
  // oyna: parçacıklar
  const st = await page.evaluate(() => new Promise(res => { document.querySelector('[data-act=start]').click(); requestAnimationFrame(() => res(document.querySelectorAll('.bp').length)); }));
  ok(st > 0, 'oyna düğmesi parçacık patlatıyor: ' + st);
  await page.waitForTimeout(150); await page.screenshot({ path: SCR + '/fx-start.png' });
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => document.querySelectorAll('.bp,.rip').length === 0), 'parçacıklar temizleniyor');
  // canvas HUD
  const hud = await page.evaluate(() => { const E = window.__evolute; if (E.g) E.g.mode = 'play'; return !!E.g; });
  ok(hud, 'oyun başladı');
  const box = await page.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
  const tap = async (x, y) => page.touchscreen.tap(box[0] + x / 360 * box[2], box[1] + y / 720 * box[3]);
  await page.waitForTimeout(300);
  await tap(180, 696); await page.waitForTimeout(120); await page.screenshot({ path: SCR + '/fx-spawn.png' });
  await tap(42, 696); await tap(320, 696);
  await page.waitForTimeout(300);
  ok(errs.length === 0, 'hata yok ' + errs.join('|'));
  // reduced motion
  const c2 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await c2.addInitScript(() => { window.__EVO_TEST__ = true; });
  const p2 = await c2.newPage(); await p2.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p2.goto('file://' + SCR + '/wrapped.html', { waitUntil: 'domcontentloaded' });
  await p2.evaluate(() => { const E = window.__evolute; E.save.tut = 1; E.persist(); E.showMenu(); }); await p2.waitForTimeout(500);
  const rm = await p2.evaluate(() => { document.querySelector('[data-act=start]').click(); return document.querySelectorAll('.bp').length; });
  ok(rm === 0, 'azaltılmış harekette parçacık yok');
  console.log(fails ? 'BAŞARISIZ ' + fails : '\nHEPSİ GEÇTİ');
  await browser.close(); process.exit(fails ? 1 : 0);
})();
