// RBMK simülatörü testi: model eşikleri (Node), arayüz ve senaryolar (tarayıcı). Ekran görüntüleri tests/out/.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const M = require('../games/rbmk-sim/model.js');
// 1) fizik: 100% güç kararlı, ORM eşikleri
{ let s = M.create({ n: 1, p: 3.5, flow: 1, nHist: 1 }); for (let i = 0; i < 3000; i++) M.step(s, 0.05); ok(Math.abs(s.n - 1) < 0.01, 'tam güçte denge kararlı (n=' + s.n.toFixed(3) + ')'); }
const azAt = orm => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; (30 * m * m * (3 - 2 * m) < orm) ? lo = m : hi = m; } let s = M.create({ n: 0.0625, p: lo * 7, flow: 0.55, nHist: 0.2, sub: 0.15 }); for (let i = 0; i < 40; i++) M.step(s, 0.05); const nb = s.n; M.azStart(s); for (let i = 0; i < 400 && !s.destroyed; i++) M.step(s, 0.05); return { ratio: s.maxN / nb, jam: s.jammed, dead: s.destroyed }; };
const r26 = azAt(26), r15 = azAt(15), r8 = azAt(8), r5 = azAt(5);
ok(r26.ratio < 1.2 && r15.ratio < 1.3, 'ORM ≥ 15: AZ-5 güvenli (x' + r26.ratio.toFixed(1) + ', x' + r15.ratio.toFixed(1) + ')');
ok(r8.ratio > 5, 'ORM 8: pozitif scram güçlü sıçrama yapıyor (x' + r8.ratio.toFixed(0) + ')');
ok(r5.jam, 'ORM 5: güç sıçramasında çubuklar sıkışıyor');
// 2) arayüz
(async () => {
  const b = await chromium.launch();
  for (const [name, vp, locale] of [['mobile', { width: 390, height: 844 }, 'en-US'], ['small', { width: 360, height: 640 }, 'tr-TR'], ['desktop', { width: 1280, height: 800 }, 'en-US']]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: name !== 'desktop', isMobile: name !== 'desktop', locale });
    await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file://' + path.join(__dirname, '..', 'games', 'rbmk-sim', 'index.html')); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/rb-${name}-menu.png` });
    await p.click('[data-s="2"]'); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => window.__rb.playing), name + ': senaryo başladı');
    await p.screenshot({ path: `${OUT}/rb-${name}-play.png` });
    if (name === 'mobile') {
      // tarihsel yol: regülatör hatası, 200 MW'a dönüş, test, AZ-5 (düşük ORM)
      const res = await p.evaluate(() => {
        const R = window.__rb, S = () => R.S, M = R.M; R.playing = false; const out = {};
        for (let i = 0; i < 20 * 100 && R.scenT < 100; i++) R.tick();
        S().auto = true; S().nSet = 0.0625; for (let i = 0; i < 20 * 15; i++) R.tick();
        out.ormEarly = M.ORM(S().p); out.mwEarly = S().n * 3200;
        S().test = true; S().testT = 0; S().flowBase = S().flow; for (let i = 0; i < 20 * 5; i++) R.tick();
        out.ormAtAz = M.ORM(S().p); M.azStart(S()); for (let i = 0; i < 20 * 20 && !S().destroyed; i++) R.tick();
        out.peak = S().maxAz * 3200; out.dead = S().destroyed;
        R.finish('done'); R.playing = false; return out;
      });
      console.log('   tarihsel yol:', JSON.stringify(res));
      ok(res.ormEarly < 15, name + ': ksenon çukurundan dönüşte ORM 15 altına düşüyor (' + res.ormEarly.toFixed(1) + ')');
      ok(res.peak > 2 * res.mwEarly, name + ': düşük ORM + AZ-5 → pozitif scram sıçraması (' + Math.round(res.mwEarly) + ' → ' + Math.round(res.peak) + ' MW)');
      await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/rb-${name}-end.png` });
      ok(await p.evaluate(() => !document.getElementById('ov').hidden), name + ': bitiş ekranı açıldı');
    }
    ok(errs.length === 0, name + ': hata yok ' + errs.join('|'));
    await ctx.close();
  }
  console.log(fails ? 'BAŞARISIZ ' + fails : '\nHEPSİ GEÇTİ'); await b.close(); process.exit(fails ? 1 : 0);
})();
