// Reactor Lab v4 testi: türlerin fiziği (Node), koruma sistemi, dil altyapısı, arayüz (tarayıcı). Ekran görüntüleri tests/out/.
// Kullanım: node tests/rbmk.js [html]   (varsayılan games/rbmk-sim/index.html)
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const HTML = path.resolve(process.argv[2] || path.join(__dirname, '..', 'games', 'rbmk-sim', 'index.html'));
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const M = require('../games/rbmk-sim/model.js');
const I18N = path.join(__dirname, '..', 'games', 'rbmk-sim', 'i18n'), META = JSON.parse(fs.readFileSync(path.join(I18N, '_meta.json'), 'utf8'));
const T = {}; for (const c of Object.keys(META)) { const f = path.join(I18N, c + '.json'); if (fs.existsSync(f)) T[c] = JSON.parse(fs.readFileSync(f, 'utf8')); }
const run = (s, secs, fn) => { for (let i = 0; i < secs * 20 && !s.destroyed; i++) { if (fn) fn(i * 0.05); M.step(s, 0.05); } };

/* 1) Fizik */
for (const ty of ['rbmk', 'pwr', 'bwr', 'candu']) { const s = M.create(ty); run(s, 120); ok(Math.abs(s.n - 1) < 0.01, ty + ': tam güçte denge kararlı (n=' + s.n.toFixed(3) + ')'); }
const azAt = orm => { const s = M.create('rbmk', { n: 0.0625, orm, flow: 0.55, nHist: 0.2, sub: 0.15 }); run(s, 2); const nb = s.n; M.azStart(s); run(s, 20); return { ratio: s.maxAz / nb, jam: s.jammed }; };
const r26 = azAt(26), r15 = azAt(15), r8 = azAt(8), r5 = azAt(5);
ok(r26.ratio < 1.2 && r15.ratio < 1.3, 'RBMK: ORM ≥ 15 iken AZ-5 güvenli'); ok(r8.ratio > 5, 'RBMK: ORM 8 pozitif scram sıçraması (x' + r8.ratio.toFixed(0) + ')'); ok(r5.jam, 'RBMK: ORM 5 çubuklar sıkışıyor');
{ const s = M.create('pwr'); s.auto = true; s.Dset = 0.7; run(s, 60); ok(Math.abs(s.n - 0.7) < 0.08 && Math.abs(s.Tm - M.tRef(0.7)) < 3, 'PWR: yük düşünce güç izliyor (n=' + s.n.toFixed(2) + ', Tavg ' + s.Tm.toFixed(1) + ')'); }
{ const s = M.create('pwr'); s.auto = true; let minPer = 1e9; run(s, 90, t => { s.Dset = t < 10 ? 1 : t < 40 ? 0.7 : 1; if (s.rate > 1e-3) minPer = Math.min(minPer, 1 / s.rate); }); ok(minPer > 6 && Math.abs(s.n - 1) < 0.05, 'PWR: yük basamağında periyot güvenli (en kısa ' + minPer.toFixed(1) + ' sn)'); }
{ const s = M.create('bwr'); s.flowTarget = 0.65; run(s, 40); ok(s.n < 0.85, 'BWR: debi azalınca güç düşüyor (n=' + s.n.toFixed(2) + ')'); }
{ const s = M.create('bwr'); s.auto = true; s.nSet = 0.7; run(s, 30); ok(Math.abs(s.n - 0.7) < 0.04 && s.flow < 0.85, 'BWR: OTOMATİK debiyi sürerek %70\'e iniyor (n=' + s.n.toFixed(2) + ', debi ' + s.flow.toFixed(2) + ')'); }
{ const s = M.create('rbmk'); s.flowTarget = 0.5; run(s, 40); ok(s.n > 2, 'RBMK: debi kaybında güç artıyor (pozitif boşluk) (n=' + s.n.toFixed(1) + ')'); }
{ const s = M.create('rbmk', { n: 0.001, orm: 20 }); s.auto = true; s.nSet = 0.5; let minPer = 1e9; run(s, 200, () => { if (s.rate > 1e-3) minPer = Math.min(minPer, 1 / s.rate); }); ok(minPer > s.T.prot.alertPer && s.n > 0.3, 'RBMK: OTOMATİK düşük güçten periyot sınırlı çıkıyor (en kısa ' + minPer.toFixed(0) + ' sn, n=' + s.n.toFixed(2) + ')'); }
{ const s = M.create('rbmk'); s.auto = true; s.nSet = 0.5; run(s, 1); s.auto = false; const p0 = s.p; run(s, 3); ok(Math.abs(s.p - p0) < 0.01, 'OTOMATİK kapatılınca çubuklar yerinde kalıyor'); }
const demand = (low, h0, h1, h2) => t => t < 20 ? 1 : t < h0 ? 1 - (1 - low) * (t - 20) / (h0 - 20) : t < h1 ? low : t < h2 ? low + (1 - low) * (t - h1) / (h2 - h1) : 1;
const maneuver = (ty, low, h0, h1, h2, opts, boronBot) => { const s = M.create(ty, opts || {}); s.auto = true; const d = demand(low, h0, h1, h2); run(s, 220, t => { s.Dset = d(t); s.nSet = s.Dset; if (boronBot) { const o = M.ORM(s, s.p); if (o < 18) s.boronTarget = Math.max(0, s.boronTarget - 2); else if (o > 26) s.boronTarget = Math.min(1500, s.boronTarget + 2); } }); return s; };
ok(Math.abs(maneuver('rbmk', 0.6, 40, 120, 150, { orm: 27 }).n - 1) < 0.05, 'RBMK: %60 manevrası sonunda tam güce dönüyor');
ok(Math.abs(maneuver('pwr', 0.4, 40, 120, 150, {}, true).n - 1) < 0.05, 'PWR: %40 manevrası (bor ile) tam güce dönüyor');
ok(Math.abs(maneuver('bwr', 0.4, 40, 120, 150).n - 1) < 0.05, 'BWR: %40 manevrası tam güce dönüyor');
ok(Math.abs(maneuver('candu', 0.5, 40, 70, 100).n - 1) < 0.05, 'CANDU: kısa manevra (30 sn düşük) tam güce dönüyor');
{ const s = maneuver('candu', 0.4, 40, 120, 150); ok(s.n < 0.05, 'CANDU: güç uzun süre düşük kalırsa ksenon zehirlenmesi (n=' + s.n.toFixed(2) + ', Xe ' + M.xenonPct(s).toFixed(0) + '%)'); }
{ const T = JSON.parse(JSON.stringify(M.TYPES.rbmk)); T.ps0 = 1.2; const s = M.create(T, { n: 0.0625, orm: 8, flow: 0.55, nHist: 0.2, sub: 0.15 }); run(s, 2); const nb = s.n; M.azStart(s); run(s, 20); ok(s.maxAz / nb < r8.ratio / 2 && !s.destroyed, 'Yükseltme: yeni çubuklarla ORM 8\'de pozitif scram çok küçük (x' + (s.maxAz / nb).toFixed(1) + ' / eski x' + r8.ratio.toFixed(0) + ')'); }
{ const s = M.create('rbmk'); M.azStart(s); run(s, 25); ok(M.resetTrip(s) && !s.az && !s.auto && Math.abs(s.pTarget - s.p) < 1e-9, 'Kapatma sonrası yeniden başlatma (resetTrip) durumu temizliyor'); }

/* 2) Dil dosyaları */
{
  const en = Object.keys(T.en), ph = v => (typeof v === 'object' ? Object.values(v).join(' ') : v).split('{0}').length - 1;
  const done = Object.keys(T).filter(l => en.every(k => k in T[l]));
  ok(Object.keys(META).length === 21, '21 dil tanımlı (_meta.json)');
  ok(done.includes('en') && done.includes('tr'), 'İngilizce ve Türkçe tam (' + done.length + '/' + Object.keys(META).length + ' dil tam: ' + done.join(' ') + ')');
  let phOK = true; for (const l of Object.keys(T)) for (const k of en) if (T[l][k] !== undefined && ph(T[l][k]) && ph(T[l][k]) !== ph(T.en[k]) && typeof T.en[k] !== 'object') { phOK = false; console.log('   yer tutucu farkı', l, k); }
  ok(phOK, 'Yer tutucular ({0}) tüm dillerde tutarlı');
}

/* 3) Tarayıcı */
(async () => {
  const b = await chromium.launch();
  for (const [name, vp, locale] of [['mobile', { width: 390, height: 844 }, 'en-US'], ['small', { width: 360, height: 640 }, 'tr-TR'], ['desktop', { width: 1280, height: 800 }, 'en-GB']]) {
    const ctx = await b.newContext({ viewport: vp, hasTouch: name !== 'desktop', isMobile: name !== 'desktop', locale });
    await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto('file://' + HTML); await p.waitForTimeout(500);
    const expect = { mobile: /▶ PLAY/, small: /▶ OYNA/, desktop: /▶ PLAY/ }[name];
    ok(expect.test(await p.textContent('#ov')), name + ': menü cihaz diline göre açıldı');
    ok(await p.evaluate(() => window.__rb.WIDE) === (name === 'desktop'), name + ': yerleşim ' + (name === 'desktop' ? 'yatay' : 'dikey'));
    await p.screenshot({ path: `${OUT}/rb-${name}-menu.png` });
    if (name === 'mobile') {
      for (const id of ['rbmk', 'pwr', 'bwr', 'candu']) {
        await p.click(`[data-a="r"][data-id="${id}"]`); await p.waitForTimeout(500);
        ok(await p.evaluate(() => document.querySelectorAll('[data-a="s"]').length) === (id === 'rbmk' ? 4 : 3), id + ': senaryo kartı sayısı (' + (id === 'rbmk' ? 'Test dahil' : 'Test yok') + ')');
        await p.click('[data-s="train"]'); await p.waitForTimeout(500);
        ok(await p.isVisible('.brief'), id + ': brifing gösteriliyor'); if (id === 'pwr') await p.screenshot({ path: `${OUT}/rb-mobile-brief-pwr.png` });
        await p.click('[data-a="go"]'); await p.waitForTimeout(700);
        const ui = await p.evaluate(() => ({ playing: window.__rb.playing, lF: document.getElementById('lF').textContent, lS: document.getElementById('lS').textContent, type: window.__rb.TY.id }));
        ok(ui.playing && ui.type === id, id + ': eğitim başladı (' + ui.lS + ' / ' + ui.lF + ')');
        ok((id === 'pwr') === /BORON/.test(ui.lF), id + ': alt kaydırıcı ' + (id === 'pwr' ? 'bor' : 'debi'));
        await p.evaluate(() => { const R = window.__rb; R.playing = false; for (let i = 0; i < 20 * 20; i++) R.tick(); R.playing = true; }); await p.waitForTimeout(300);
        await p.screenshot({ path: `${OUT}/rb-mobile-play-${id}.png` });
        await p.keyboard.press('Escape'); await p.waitForTimeout(400); ok(await p.isVisible('[data-a="resume"]'), id + ': Esc duraklatıyor');
        await p.click('[data-a="quit"]'); await p.waitForTimeout(400); await p.click('[data-a="back"]'); await p.waitForTimeout(400);
      }
      // ipucu kartı
      await p.click('[data-a="r"][data-id="rbmk"]'); await p.waitForTimeout(300); await p.click('[data-s="sand"]'); await p.waitForTimeout(300); await p.click('[data-a="go"]'); await p.waitForTimeout(500);
      const tipped = await p.evaluate(() => { const R = window.__rb, g = R.REG.find(r => r.key === 'tip_xe'); if (!g) return false; const c = document.getElementById('c'), b = c.getBoundingClientRect(), k = b.width / c.width; return { x: b.left + (g.x0 + g.x1) / 2 * k, y: b.top + (g.y0 + g.y1) / 2 * k }; });
      ok(!!tipped, 'ipucu bölgeleri kaydediliyor'); if (tipped) { await p.mouse.click(tipped.x, tipped.y); await p.waitForTimeout(300); ok(await p.isVisible('#tip') && !(await p.evaluate(() => window.__rb.playing)), 'ⓘ dokununca ipucu açılıyor ve oyun duruyor'); await p.screenshot({ path: `${OUT}/rb-mobile-tip.png` }); await p.click('#tip button'); await p.waitForTimeout(200); ok(await p.evaluate(() => window.__rb.playing), 'ipucu kapanınca oyun sürüyor'); }
      // klavye
      const k0 = await p.evaluate(() => window.__rb.S.nSet); await p.keyboard.press('ArrowUp'); ok(await p.evaluate(() => window.__rb.S.nSet) !== k0 || k0 >= 1, 'klavye ↑ güç ayarını değiştiriyor');
      // ayarlar ve dil
      await p.keyboard.press('Escape'); await p.waitForTimeout(300); await p.click('[data-a="set"]'); await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/rb-mobile-settings.png`, fullPage: true });
      await p.click('[data-a="seg"][data-k="prot"][data-v="full"]'); ok(await p.evaluate(() => window.__rb.save.prot === 'full' && window.__rb.S.prot === 'full'), 'koruma modu ayarı oyuna uygulanıyor');
      await p.click('[data-a="tg"][data-k="flash"]'); await p.click('[data-a="seg"][data-k="pct"][data-v="pct"]');
      await p.click('[data-a="lang"]'); await p.waitForTimeout(400); await p.fill('#lq', 'russ'); await p.waitForTimeout(100);
      ok(await p.evaluate(() => [...document.querySelectorAll('.lang')].filter(b => !b.hidden).map(b => b.dataset.c).join()) === 'ru', 'dil araması çalışıyor (russ → ru)');
      await p.click('[data-a="pick"][data-c="ru"]'); await p.waitForTimeout(400); ok(/ЯЗЫК/.test(await p.textContent('#ov')), 'dil Rusça\'ya değişti, ayarlara dönüldü');
      await p.click('[data-a="back"]'); await p.waitForTimeout(300); await p.click('[data-a="quit"]'); await p.waitForTimeout(300); await p.click('[data-a="back"]'); await p.waitForTimeout(300);
      ok(/▶ ИГРАТЬ/.test(await p.textContent('#ov')), 'menü yeni dilde');
      await p.reload(); await p.waitForTimeout(400); ok(/▶ ИГРАТЬ/.test(await p.textContent('#ov')), 'dil seçimi yeniden yüklemede korunuyor');
      ok(await p.evaluate(() => window.__rb.save.flash === false && window.__rb.save.pct === true && window.__rb.save.prot === 'full'), 'ayarlar (flaş, birim, koruma) kalıcı');
      // biçimlendirme ve çoğul
      const fmt = await p.evaluate(() => { const R = window.__rb, o = {}; R.setLang('de'); o.de = document.documentElement.lang; R.setLang('tr'); o.trPct = document.createElement('x') && null; R.setLang('en'); o.one = R.T.en.why_trips.one; R.setLang('pseudo'); o.pseudo = R.T.pseudo && R.T.pseudo.title; R.setLang('en'); return o; });
      ok(fmt.de === 'de' && /\[/.test(fmt.pseudo || ''), 'setLang: html lang güncelleniyor, sahte dil üretilebiliyor');
      // RBMK Test senaryosu: tarihsel yol
      await p.evaluate(() => { document.getElementById('ov').hidden = true; });
      const res = await p.evaluate(() => {
        const R = window.__rb, M = R.M; R.initScenario('test', 'rbmk'); R.playing = false; const S = () => R.S, out = {};
        out.prot = S().prot;
        for (let i = 0; i < 20 * 100 && R.scenT < 100; i++) R.tick();
        S().auto = true; S().nSet = 0.0625; for (let i = 0; i < 20 * 60; i++) R.tick(); out.lockedORM = M.ORM(S(), S().p);
        R.setBypass(true); for (let i = 0; i < 20 * 15; i++) R.tick(); out.ormEarly = M.ORM(S(), S().p); out.mwEarly = S().n * 3200; out.byp = R.flags.bypassUsed;
        S().test = true; S().testT = 0; S().flowBase = S().flow; for (let i = 0; i < 20 * 5; i++) R.tick(); R.trip(false, 'm_trip_man'); for (let i = 0; i < 20 * 20 && !S().destroyed; i++) R.tick(); out.peak = S().maxAz * 3200; R.finish('done'); R.playing = false; return out;
      });
      console.log('   tarihsel yol:', JSON.stringify(res));
      ok(res.prot === 'full', 'RBMK Test: koruma TAM başlıyor'); ok(res.lockedORM >= 14.9, 'RBMK Test: kilit açıkken ORM 15 altına inilemiyor'); ok(res.ormEarly < 15 && res.byp, 'RBMK Test: kilit devre dışıyken ORM 15 altına düşüyor (' + res.ormEarly.toFixed(1) + ')'); ok(res.peak > 2 * res.mwEarly, 'RBMK Test: pozitif scram sıçraması');
      await p.waitForTimeout(2500); await p.screenshot({ path: `${OUT}/rb-mobile-report.png`, fullPage: true }); ok(await p.isVisible('.rep'), 'vardiya raporu açılıyor');
      // koruma sistemi
      const pr = await p.evaluate(() => {
        const R = window.__rb, M = R.M, o = {}, S = () => R.S, go = (sn, ty, prot) => { R.save.prot = prot; R.initScenario(sn, ty); R.playing = false; };
        go('sand', 'rbmk', 'assist'); S().auto = false; S().pTarget = 0; for (let i = 0; i < 20 * 40; i++) R.tick(); o.orm = M.ORM(S(), S().p); o.alive = !S().destroyed;
        go('sand', 'rbmk', 'full'); S().flowTarget = 0.3; for (let i = 0; i < 20 * 120 && !S().az; i++) R.tick(); o.lowFlowTrip = S().az && !S().destroyed;
        go('sand', 'rbmk', 'assist'); S().flowTarget = 0.3; for (let i = 0; i < 20 * 60; i++) R.tick(); o.assistNoTrip = !S().az && !S().destroyed && R.flags.stepbacks > 0;
        go('sand', 'pwr', 'assist'); R.trip(false, 'm_trip_man'); o.turbOff = S().Dset === 0; for (let i = 0; i < 20 * 2; i++) R.tick(); o.early = R.canReset(); for (let i = 0; i < 20 * 5; i++) R.tick(); o.can = R.canReset(); R.doReset(); o.reset = !S().az && S().Dset > 0.5;
        go('sand', 'rbmk', 'off'); R.setBypass(true); S().auto = false; S().pTarget = 0; let slow = false; for (let i = 0; i < 20 * 120 && !S().destroyed; i++) { R.tick(); if (R.ts < 0.5) slow = true; } o.slow = slow;
        R.save.prot = 'assist'; return o;
      });
      console.log('   koruma:', JSON.stringify(pr));
      ok(pr.orm >= 14.9 && pr.alive, 'RBMK: çubuklar sonuna çekilse bile kilit ORM 15\'te tutuyor'); ok(pr.lowFlowTrip, 'Koruma TAM: düşük debide otomatik kapatma, reaktör sağlam');
      ok(pr.assistNoTrip, 'Koruma YARDIMCI: düşük debide kapatma yerine geri çekme'); ok(pr.turbOff && !pr.early && pr.can && pr.reset, 'PWR: kapatmada türbin düşüyor, çubuklar inince yeniden başlatma');
      ok(pr.slow, 'RBMK: korumasız güç sıçramasında ağır çekim');
    }
    if (name === 'desktop') {
      await p.click('[data-a="r"][data-id="bwr"]'); await p.waitForTimeout(300); await p.click('[data-s="move"]'); await p.waitForTimeout(300); await p.click('[data-a="go"]'); await p.waitForTimeout(500);
      await p.evaluate(() => { const R = window.__rb; R.playing = false; for (let i = 0; i < 20 * 50; i++) R.tick(); R.playing = true; }); await p.waitForTimeout(300);
      await p.screenshot({ path: `${OUT}/rb-desktop-play-bwr.png` }); ok(await p.isVisible('#kbHint'), 'masaüstü: klavye ipucu görünüyor');
    }
    ok(errs.length === 0, name + ': hata yok ' + errs.join('|'));
    await ctx.close();
  }
  // RTL ve sahte dil
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + HTML + '?lang=pseudo'); await p.waitForTimeout(400);
    ok(/\[/.test(await p.textContent('#ov')) && (await p.evaluate(() => [...window.__rb.MISSING].filter(k => !k.includes(':')).length)) === 0, '?lang=pseudo: tüm metinler çeviriden geliyor (eksik anahtar yok)');
    await p.screenshot({ path: `${OUT}/rb-pseudo-menu.png` });
    if (T.ar) { await p.goto('file://' + HTML + '?lang=ar'); await p.waitForTimeout(400); ok(await p.evaluate(() => document.documentElement.dir) === 'rtl', 'Arapça: sayfa sağdan sola'); await p.screenshot({ path: `${OUT}/rb-ar-menu.png` }); }
    ok(errs.length === 0, 'sahte dil/RTL: hata yok ' + errs.join('|')); await ctx.close();
  }
  // yükseltmeler: kredi kazanma, satın alma animasyonu, fiziğe etkisi, 1986 testinde kapalı
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto('file://' + HTML + '?lang=en'); await p.waitForTimeout(400);
    const e1 = await p.evaluate(() => { const R = window.__rb; R.initScenario('train', 'pwr'); R.playing = false; for (let i = 0; i < 20 * 160 && !R.ended; i++) R.tick(); return { cr: R.save.cr, stars: R.save.stars['pwr:train'] }; });
    ok(e1.cr > 0 && e1.stars > 0, 'yükseltme: vardiya bitince kredi kazanılıyor (+' + e1.cr + ')');
    await p.waitForTimeout(2500); ok(/\+\d+ ⚡/.test(await p.textContent('#ov')), 'yükseltme: raporda kazanılan kredi gösteriliyor');
    await p.evaluate(() => { window.__rb.save.cr = 500; window.__rb.reactorMenu('pwr'); }); await p.waitForTimeout(400);
    await p.click('[data-a="upg"]'); await p.waitForTimeout(500); ok(await p.evaluate(() => document.querySelectorAll('.upc').length) === 3, 'yükseltme: ekranda 3 kart');
    await p.click('[data-a="buy"][data-u="boron"]'); await p.waitForTimeout(1500);
    const e2 = await p.evaluate(() => { const R = window.__rb; R.initScenario('train', 'pwr'); return { cr: R.save.cr, own: R.save.up['pwr:boron'], bRate: R.S.T.bRate, stamp: !!document.querySelector('.upc.own .stamp') }; });
    ok(e2.own === 1 && e2.cr === 440 && e2.stamp, 'yükseltme: satın alındı, kredi düştü, KURULDU damgası (' + e2.cr + ')'); ok(e2.bRate === 10, 'yükseltme: fizik parametresi değişti (bor hızı 4 → 10 ppm/s)');
    await p.evaluate(() => { window.__rb.save.up['rbmk:rods'] = 1; }); const e3 = await p.evaluate(() => { const R = window.__rb; R.initScenario('test', 'rbmk'); const a = R.S.T.ps0; R.initScenario('move', 'rbmk'); return [a, R.S.T.ps0]; });
    ok(e3[0] === 4.4 && e3[1] === 1.2, 'yükseltme: 1986 testi özgün tasarımla, diğer senaryolar yükseltilmiş');
    await p.evaluate(() => { window.__rb.save.cr = 10; window.__rb.upgradesScreen('bwr', () => {}); }); await p.waitForTimeout(400);
    ok(await p.evaluate(() => [...document.querySelectorAll('.buy')].every(b => b.disabled)), 'yükseltme: kredi yetmezse satın alınamıyor');
    // çocuk modu: menüden oyna, kol + su, seviye sonu yıldız ve kilit açma
    await p.evaluate(() => window.__rb.mainMenu()); await p.waitForTimeout(400); await p.click('[data-a="quick"]'); await p.waitForTimeout(500);
    ok(await p.evaluate(() => document.querySelectorAll('.klv').length) === 12, 'çocuk modu: 12 seviye listeleniyor');
    await p.click('[data-a="play"]'); await p.waitForTimeout(600); ok(await p.isVisible('#kids') && await p.isVisible('#kwater'), 'çocuk modu: oyun ekranı, kol ve su düğmesi');
    await p.fill('#klev', '100'); await p.waitForTimeout(3000); const hot = await p.evaluate(() => window.__rb.K.H); await p.click('#kwater'); await p.waitForTimeout(900); const cooled = await p.evaluate(() => window.__rb.K.H);
    ok(hot > 0 && cooled < hot, 'çocuk modu: yüksek güç ısıtıyor, su soğutuyor (' + hot.toFixed(2) + ' → ' + cooled.toFixed(2) + ')');
    await p.evaluate(() => { const K = window.__rb.K; K.t = K.dur - 0.05; K.green = K.tot; }); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => window.__rb.save.klv >= 2 && window.__rb.save.kls[1] === 3), 'çocuk modu: seviye bitince 3 yıldız ve sonraki seviye açılıyor');
    await p.click('[data-a="hats"]'); await p.waitForTimeout(500); ok(await p.evaluate(() => document.querySelectorAll('.hat').length) === 6, 'çocuk modu: şapka dükkanı');
    ok(errs.length === 0, 'yükseltme: hata yok ' + errs.join('|')); await ctx.close();
  }
  console.log(fails ? 'BAŞARISIZ ' + fails : '\nHEPSİ GEÇTİ'); await b.close(); process.exit(fails ? 1 : 0);
})();
