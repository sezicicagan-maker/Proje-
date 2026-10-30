// Core Shift arayüz testi: menü, vardiya, kaydırıcılar, acil durdur, sonuç ekranı, hata yok. Ekran görüntüleri tests/out/.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  for (const [name, vp, locale] of [['mobile', { width: 390, height: 844 }, 'en-US'], ['small', { width: 360, height: 640 }, 'tr-TR'], ['desktop', { width: 1280, height: 800 }, 'en-US']]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: name !== 'desktop', isMobile: name !== 'desktop', locale });
    await ctx.addInitScript(() => { window.__CS_TEST__ = true; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file://' + path.join(__dirname, '..', 'games', 'core-shift', 'index.html')); await p.waitForTimeout(400);
    ok(await p.evaluate(() => !document.getElementById('ov').hidden), name + ': menü açık');
    await p.screenshot({ path: `${OUT}/cs-${name}-menu.png` });
    await p.click('[data-a="start"]'); await p.waitForTimeout(300);
    ok(await p.evaluate(() => window.__cs.playing), name + ': vardiya başladı');
    // kaydırıcıları kullan
    await p.evaluate(() => { const r = document.getElementById('rods'); r.value = 40; r.dispatchEvent(new Event('input')); const q = document.getElementById('pump'); q.value = 70; q.dispatchEvent(new Event('input')); });
    await p.waitForTimeout(2500);
    ok(await p.evaluate(() => Math.abs(window.__cs.S.rods - 0.4) < 0.01 && Math.abs(window.__cs.S.pump - 0.7) < 0.01), name + ': kaydırıcılar oyunu etkiliyor');
    await p.screenshot({ path: `${OUT}/cs-${name}-play.png` });
    // acil durdur
    await p.click('#scram'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => window.__cs.S.rods === 1 && window.__cs.S.t < window.__cs.S.lockUntil), name + ': acil durdur çubukları sokup kilitliyor');
    // vardiyayı hızlandırarak bitir
    await p.evaluate(() => { const C = window.__cs, S = C.S; for (let i = 0; i < 1600 && !S.over; i++) C.step(S, C.DT); });
    await p.waitForTimeout(400);
    ok(await p.evaluate(() => !document.getElementById('ov').hidden && /★|Core|Çekirdek|Shift|Vardiya/.test(document.getElementById('ov').textContent)), name + ': sonuç ekranı');
    await p.screenshot({ path: `${OUT}/cs-${name}-end.png` });
    ok(errs.length === 0, name + ': hata yok ' + errs.join('|'));
    await ctx.close();
  }
  console.log(fails ? 'BAŞARISIZ ' + fails : '\nHEPSİ GEÇTİ'); await b.close(); process.exit(fails ? 1 : 0);
})();
