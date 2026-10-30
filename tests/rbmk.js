// Reactor Lab testi: türlerin fiziği (Node), dil eşitliği, arayüz (tarayıcı). Ekran görüntüleri tests/out/.
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const M = require('../games/rbmk-sim/model.js'); const { T, LANGS } = require('../games/rbmk-sim/i18n.js');
const run = (s, secs, fn) => { for (let i = 0; i < secs * 20 && !s.destroyed; i++) { if (fn) fn(i * 0.05); M.step(s, 0.05); } };
// 1) her tür tam güçte kararlı
for (const ty of ['rbmk', 'pwr', 'bwr', 'candu']) { const s = M.create(ty); run(s, 120); ok(Math.abs(s.n - 1) < 0.01, ty + ': tam güçte denge kararlı (n=' + s.n.toFixed(3) + ')'); }
// 2) RBMK: ORM eşikleri (AZ-5)
const azAt = orm => { const s = M.create('rbmk', { n: 0.0625, orm, flow: 0.55, nHist: 0.2, sub: 0.15 }); run(s, 2); const nb = s.n; M.azStart(s); run(s, 20); return { ratio: s.maxAz / nb, jam: s.jammed }; };
const r26 = azAt(26), r15 = azAt(15), r8 = azAt(8), r5 = azAt(5);
ok(r26.ratio < 1.2 && r15.ratio < 1.3, 'RBMK: ORM ≥ 15 iken AZ-5 güvenli'); ok(r8.ratio > 5, 'RBMK: ORM 8 pozitif scram sıçraması (x' + r8.ratio.toFixed(0) + ')'); ok(r5.jam, 'RBMK: ORM 5 çubuklar sıkışıyor');
// 3) PWR kendini düzenler: yük 100→70%
{ const s = M.create('pwr'); s.auto = true; s.D = 0.7; run(s, 60); ok(Math.abs(s.n - 0.7) < 0.08 && Math.abs(s.Tm - M.tRef(0.7)) < 3, 'PWR: yük düşünce güç kendiliğinden izliyor (n=' + s.n.toFixed(2) + ', Tavg ' + s.Tm.toFixed(1) + ')'); }
// 4) BWR: debi gücü belirler; RBMK: debi kaybı gücü artırır
{ const s = M.create('bwr'); s.flowTarget = 0.65; run(s, 40); ok(s.n < 0.85, 'BWR: debi azalınca güç düşüyor (n=' + s.n.toFixed(2) + ')'); }
{ const s = M.create('rbmk'); s.flowTarget = 0.5; run(s, 40); ok(s.n > 2, 'RBMK: debi kaybında güç artıyor (pozitif boşluk) (n=' + s.n.toFixed(1) + ')'); }
// 5) güç manevrası: 100→düşük→100
const demand = (low, h0, h1, h2) => t => t < 20 ? 1 : t < h0 ? 1 - (1 - low) * (t - 20) / (h0 - 20) : t < h1 ? low : t < h2 ? low + (1 - low) * (t - h1) / (h2 - h1) : 1;
const maneuver = (ty, low, h0, h1, h2, opts, boronBot) => { const s = M.create(ty, opts || {}); s.auto = true; const d = demand(low, h0, h1, h2); run(s, 220, t => { s.D = d(t); s.nSet = s.D; if (boronBot) { const o = M.ORM(s, s.p); if (o < 18) s.boronTarget = Math.max(0, s.boronTarget - 2); else if (o > 26) s.boronTarget = Math.min(1500, s.boronTarget + 2); } if (ty === 'bwr') s.flowTarget = Math.max(0.5, Math.min(1.1, 0.9 * s.D / Math.max(0.3, s.n / s.D))); }); return s; };
ok(Math.abs(maneuver('rbmk', 0.6, 40, 120, 150, { orm: 27 }).n - 1) < 0.05, 'RBMK: %60 manevrası sonunda tam güce dönüyor');
ok(Math.abs(maneuver('pwr', 0.4, 40, 120, 150, {}, true).n - 1) < 0.05, 'PWR: %40 manevrası (bor ile) tam güce dönüyor');
ok(Math.abs(maneuver('bwr', 0.4, 40, 120, 150).n - 1) < 0.05, 'BWR: %40 manevrası tam güce dönüyor');
ok(Math.abs(maneuver('candu', 0.5, 40, 70, 100).n - 1) < 0.05, 'CANDU: kısa manevra (30 sn düşük) tam güce dönüyor');
{ const s = maneuver('candu', 0.4, 40, 120, 150); ok(s.n < 0.05, 'CANDU: güç uzun süre düşük kalırsa ksenon zehirlenmesi (n=' + s.n.toFixed(2) + ', Xe ' + M.xenonPct(s).toFixed(0) + '%)'); }
// 6) dil eşitliği
{ const en = Object.keys(T.en).filter(k => !k.startsWith('r_')); let all = true; for (const l of Object.keys(LANGS)) { const miss = en.filter(k => !(k in T[l])); if (miss.length) { all = false; console.log('   ' + l + ' eksik:', miss.join(',')); } } ok(all && Object.keys(LANGS).length === 7, '7 dilde tüm metin anahtarları var'); }
(async () => {
  const b = await chromium.launch();
  for (const [name, vp, locale] of [['mobile', { width: 390, height: 844 }, 'en-US'], ['small', { width: 360, height: 640 }, 'tr-TR'], ['desktop', { width: 1280, height: 800 }, 'de-DE']]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: name !== 'desktop', isMobile: name !== 'desktop', locale });
    await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file://' + path.join(__dirname, '..', 'games', 'rbmk-sim', 'index.html')); await p.waitForTimeout(400);
    const expect = { mobile: /CHOOSE A REACTOR/, small: /REAKTÖR SEÇ/, desktop: /REAKTOR WÄHLEN/ }[name];
    ok(expect.test(await p.textContent('#ov')), name + ': menü cihaz diline göre açıldı');
    await p.screenshot({ path: `${OUT}/rb-${name}-menu.png` });
    if (name === 'mobile') {
      for (const id of ['rbmk', 'pwr', 'bwr', 'candu']) {
        await p.evaluate(() => { const o = document.getElementById('ov'); o.hidden = false; }); await p.evaluate(() => window.__rb.initScenario('sand', 'rbmk')); await p.evaluate(() => { window.__rb.playing = false; });
        await p.evaluate(() => { document.querySelector('[data-a="menu"]') && 0; }); await p.evaluate(() => { const o = document.getElementById('ov'); o.innerHTML = ''; o.hidden = true; });
      }
      await p.reload(); await p.waitForTimeout(300);
      for (const id of ['rbmk', 'pwr', 'bwr', 'candu']) {
        await p.click(`[data-r="${id}"]`); await p.waitForTimeout(150); if (id === 'pwr') await p.screenshot({ path: `${OUT}/rb-mobile-reactor-pwr.png` });
        ok(await p.evaluate(() => document.querySelectorAll('[data-s]').length) === (id === 'rbmk' ? 4 : 3), id + ': senaryo kartı sayısı (' + (id === 'rbmk' ? 'Test dahil' : 'Test yok') + ')');
        await p.click('[data-s="train"]'); await p.waitForTimeout(900);
        const ui = await p.evaluate(() => ({ playing: window.__rb.playing, rowC: !document.getElementById('rowC').hidden, lf: document.getElementById('lf').textContent, type: window.__rb.TY.id }));
        ok(ui.playing && ui.type === id, id + ': eğitim başladı'); ok(ui.rowC === (id === 'pwr'), id + ': yük satırı yalnızca PWR\'de (' + ui.lf + ')');
        await p.screenshot({ path: `${OUT}/rb-mobile-play-${id}.png` });
        await p.evaluate(() => { window.__rb.playing = false; document.getElementById('ov').hidden = false; });
        await p.reload(); await p.waitForTimeout(250);
      }
      // dil değiştirme ve kalıcılık
      await p.click('[data-a="settings"]'); await p.waitForTimeout(150); await p.screenshot({ path: `${OUT}/rb-mobile-settings.png` });
      await p.click('[data-lang="ru"]'); await p.waitForTimeout(100); ok(/ЯЗЫК/.test(await p.textContent('#ov')), 'dil Rusça\'ya değişti');
      await p.click('[data-lang="fr"]'); ok(/LANGUE/.test(await p.textContent('#ov')), 'dil Fransızca\'ya değişti');
      await p.click('[data-tg="flash"]'); await p.click('[data-u="pct"]'); await p.click('[data-a="closeset"]'); await p.waitForTimeout(100);
      ok(/CHOISIR UN RÉACTEUR/.test(await p.textContent('#ov')), 'ayarlardan çıkınca menü yeni dilde');
      await p.reload(); await p.waitForTimeout(250); ok(/CHOISIR UN RÉACTEUR/.test(await p.textContent('#ov')), 'dil seçimi yeniden yüklemede korunuyor');
      ok(await p.evaluate(() => window.__rb.save.flash === false && window.__rb.save.pct === true), 'ayarlar (flaş, birim) kalıcı');
      await p.screenshot({ path: `${OUT}/rb-mobile-menu-fr.png` });
      // RBMK Test senaryosu: tarihsel yol ve korumalar
      await p.evaluate(() => { document.getElementById('ov').hidden = true; });
      const res = await p.evaluate(() => {
        const R = window.__rb, M = R.M; R.initScenario('test', 'rbmk'); R.playing = false; const S = () => R.S, out = {};
        for (let i = 0; i < 20 * 100 && R.scenT < 100; i++) R.tick();
        S().auto = true; S().nSet = 0.0625; for (let i = 0; i < 20 * 60; i++) R.tick(); out.lockedORM = M.ORM(S(), S().p);
        R.setBypass(true); for (let i = 0; i < 20 * 15; i++) R.tick(); out.ormEarly = M.ORM(S(), S().p); out.mwEarly = S().n * 3200;
        S().test = true; S().testT = 0; S().flowBase = S().flow; for (let i = 0; i < 20 * 5; i++) R.tick(); M.azStart(S()); for (let i = 0; i < 20 * 20 && !S().destroyed; i++) R.tick(); out.peak = S().maxAz * 3200; R.finish('done'); R.playing = false; return out;
      });
      console.log('   tarihsel yol:', JSON.stringify(res));
      ok(res.lockedORM >= 14.9, 'RBMK Test: kilit açıkken ORM 15 altına inilemiyor'); ok(res.ormEarly < 15, 'RBMK Test: kilit devre dışıyken ORM 15 altına düşüyor (' + res.ormEarly.toFixed(1) + ')'); ok(res.peak > 2 * res.mwEarly, 'RBMK Test: pozitif scram sıçraması');
      await p.waitForTimeout(250); await p.screenshot({ path: `${OUT}/rb-mobile-end.png` });
      const pr = await p.evaluate(() => {
        const R = window.__rb, M = R.M, o = {}; R.initScenario('sand', 'rbmk'); R.playing = false; const S = () => R.S;
        S().auto = false; S().pTarget = 0; for (let i = 0; i < 20 * 40; i++) R.tick(); o.orm = M.ORM(S(), S().p); o.alive = !S().destroyed;
        R.initScenario('sand', 'rbmk'); R.playing = false; S().flowTarget = 0.3; for (let i = 0; i < 20 * 120 && !S().az; i++) R.tick(); o.lowFlowTrip = S().az && !S().destroyed;
        R.initScenario('sand', 'rbmk'); R.playing = false; R.setBypass(true); S().auto = false; S().pTarget = 0; let slow = false; for (let i = 0; i < 20 * 120 && !S().destroyed; i++) { R.tick(); if (R.ts < 0.5) slow = true; } o.slow = slow;
        return o;
      });
      ok(pr.orm >= 14.9 && pr.alive, 'RBMK: çubuklar sonuna çekilse bile kilit ORM 15\'te tutuyor'); ok(pr.lowFlowTrip, 'RBMK: düşük debide otomatik trip ve reaktör sağlam'); ok(pr.slow, 'RBMK: güç sıçramasında ağır çekim');
    }
    ok(errs.length === 0, name + ': hata yok ' + errs.join('|'));
    await ctx.close();
  }
  console.log(fails ? 'BAŞARISIZ ' + fails : '\nHEPSİ GEÇTİ'); await b.close(); process.exit(fails ? 1 : 0);
})();
