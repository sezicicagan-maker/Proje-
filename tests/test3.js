const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path'); const SCR = path.join(__dirname, 'out');
const body = fs.readFileSync(path.join(__dirname, '..', 'prototype', 'evolute.html'), 'utf8');
fs.writeFileSync(SCR + '/wrapped.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const BOT = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
async function open(browser, locale, vp) {
  const ctx = await browser.newContext({ viewport: vp || { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale });
  await ctx.addInitScript(() => { window.__EVO_TEST__ = true; }); const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('file://' + SCR + '/wrapped.html', { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: BOT }); await page.waitForTimeout(250);
  return page;
}
(async () => {
  const browser = await chromium.launch();
  // 1) dil algılama
  for (const [loc, exp] of [['tr-TR', 'tr'], ['en-US', 'en'], ['de-DE', 'de'], ['es-MX', 'es'], ['pt-BR', 'pt'], ['ja-JP', 'en']]) {
    const pg = await open(browser, loc); const l = await pg.evaluate(() => window.__evolute.save.lang);
    ok(l === exp, `locale ${loc} -> ${l}`); await pg.context().close();
  }
  // 2) anahtar eşitliği ve tür adları
  const pg = await open(browser, 'en-US');
  const parity = await pg.evaluate(() => { const E = window.__evolute, base = Object.keys(E.STR.en), out = {};
    for (const l of Object.keys(E.STR)) { out[l] = { missing: base.filter(k => !(k in E.STR[l])), extra: Object.keys(E.STR[l]).filter(k => !(k in E.STR.en)), emptySp: 0, spCount: 0 };
      for (const e of E.SPECIES[l]) for (const el of e) { out[l].spCount += el.length; el.forEach(n => { if (!n || !n.trim()) out[l].emptySp++; }); } } return out; });
  for (const l in parity) ok(!parity[l].missing.length && !parity[l].extra.length && parity[l].spCount === 144 && !parity[l].emptySp, `${l}: anahtar eşit, 144 tür adı (${JSON.stringify(parity[l].missing)})`);
  // 3) menü ekran görüntüleri
  await pg.screenshot({ path: SCR + '/h-menu-en.png' });
  // dil değiştir
  await pg.click('[data-act="settings"]'); await pg.screenshot({ path: SCR + '/h-settings.png' });
  await pg.click('[data-lang="tr"]');
  ok((await pg.textContent('.ov')).includes('Dil'), 'ayarlarda dil Türkçe oldu');
  await pg.click('[data-act="back"]'); await pg.screenshot({ path: SCR + '/h-menu-tr.png' });
  ok((await pg.textContent('.ov')).includes('Birleştir'), 'menü Türkçe');
  // 4) eğitim akışı
  await pg.click('[data-act="start"]'); await pg.screenshot({ path: SCR + '/h-tut.png' });
  ok((await pg.evaluate(() => window.__evolute.mode)) === 'menu', 'ilk oyunda eğitim açılır (oyun başlamadı)');
  await pg.click('[data-act="tnext"]'); await pg.click('[data-act="tnext"]'); await pg.click('[data-act="tnext"]');
  ok((await pg.evaluate(() => window.__evolute.mode)) === 'play', 'eğitim sonrası oyun başladı');
  // 5) duraklat
  const pr = await pg.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return [r.left + (336 / 360) * r.width, r.top + (17 / 720) * r.height]; });
  await pg.mouse.click(pr[0], pr[1]);
  ok((await pg.evaluate(() => window.__evolute.mode)) === 'paused', 'duraklat düğmesi çalışıyor');
  const t0 = await pg.evaluate(() => window.__evolute.g.t); await pg.waitForTimeout(400);
  ok((await pg.evaluate(() => window.__evolute.g.t)) === t0, 'duraklatınca zaman akmıyor');
  await pg.screenshot({ path: SCR + '/h-pause.png' });
  await pg.click('[data-act="resume"]');
  ok((await pg.evaluate(() => window.__evolute.mode)) === 'play', 'devam');
  await pg.mouse.click(pr[0], pr[1]); await pg.click('[data-act="quit"]');
  ok((await pg.textContent('.ov')).includes('EVOLUTE'), 'menüye dön');
  // 6) günlük ödül
  const d0 = await pg.evaluate(() => window.__evolute.save.dna);
  await pg.click('[data-act="daily"]');
  const d1 = await pg.evaluate(() => window.__evolute.save.dna);
  ok(d1 - d0 === 30, `günlük ödül +${d1 - d0}`);
  ok(await pg.evaluate(() => !window.__evolute.dailyReady()), 'günlük ödül tekrar alınamaz');
  // seri: dün alınmışsa seri artar
  await pg.evaluate(() => { const E = window.__evolute; const d = new Date(Date.now() - 864e5); E.save.daily = { last: d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(), streak: 2 }; });
  const s0 = await pg.evaluate(() => window.__evolute.save.dna); await pg.evaluate(() => { window.__evolute.claimDaily(); });
  const sv = await pg.evaluate(() => [window.__evolute.save.dna, window.__evolute.save.daily.streak]);
  ok(sv[1] === 3 && sv[0] - s0 === 50, `seri devam: ${sv[1]} gün, +${sv[0] - s0}`);
  // 7) kuluçka
  await pg.evaluate(() => { window.__evolute.save.idleT = Date.now() - 3 * 3600 * 1000; });
  const acc = await pg.evaluate(() => window.__evolute.idleAcc()); ok(acc >= 20 && acc <= 40, `3 saatte kuluçka ${acc} DNA`);
  await pg.evaluate(() => { window.__evolute.save.idleT = Date.now() - 30 * 3600 * 1000; });
  const cap = await pg.evaluate(() => window.__evolute.idleAcc()); ok(cap <= acc * 1.5, `30 saatte üst sınır uygulanıyor (${cap})`);
  // 8) yükseltme + laboratuvar
  await pg.evaluate(() => { window.__evolute.save.dna = 500; window.__evolute.showMenu(); });
  await pg.click('[data-act="lab"]'); await pg.screenshot({ path: SCR + '/h-lab.png' });
  await pg.click('[data-up="atk"]'); ok((await pg.evaluate(() => window.__evolute.save.up.atk)) === 1, 'laboratuvarda yükseltme alındı');
  // 9) sıfırlama
  await pg.click('[data-act="back"]'); await pg.click('[data-act="settings"]'); await pg.click('[data-act="reset"]');
  ok((await pg.textContent('.ov')).includes('silinsin'), 'sıfırlama onay ister');
  await pg.click('[data-act="resetyes"]');
  const rs = await pg.evaluate(() => ({ dna: window.__evolute.save.dna, atk: window.__evolute.save.up.atk, lang: window.__evolute.save.lang }));
  ok(rs.dna === 0 && rs.atk === 0 && rs.lang === 'tr', 'ilerleme silindi, dil korundu');
  // 10) her dilde ekranlar hata vermeden açılıyor + görüntüler
  for (const l of ['de', 'es', 'pt', 'en', 'tr']) {
    await pg.evaluate(l => { window.__evolute.setLang(l); window.__evolute.save.tut = 1; window.__evolute.newGame(); const E = window.__evolute; E.g.muts.crit = 1; for (let i = 0; i < 40; i++) E.step(0.05); }, l);
    if (l === 'de' || l === 'pt') await pg.screenshot({ path: `${SCR}/h-game-${l}.png` });
    await pg.evaluate(() => window.__evolute.showMenu());
    if (l === 'de' || l === 'es') await pg.screenshot({ path: `${SCR}/h-menu-${l}.png` });
  }
  // geri tuşu mantığı
  const bk = await pg.evaluate(() => { const E = window.__evolute; E.save.tut = 1; E.newGame(); const r = []; r.push(E.handleBack(), E.mode); r.push(E.handleBack(), E.mode); E.g.mode = 'over'; E.showMenu(); r.push(E.handleBack()); return r; });
  ok(bk[0] === true && bk[1] === 'paused' && bk[2] === true && bk[3] === 'play' && bk[4] === false, 'geri tuşu: oyunda duraklat/devam, ana menüde çıkış ' + JSON.stringify(bk));
  // 11) denge simülasyonu yeniden
  await pg.evaluate(() => { window.__evolute.save.tut = 1; });
  for (const [era, ups] of [[0, {}], [0, { atk: 4, hp: 3, spawn: 3 }], [1, { atk: 8, hp: 5, spawn: 5 }], [2, { atk: 12, hp: 8, spawn: 8 }]]) {
    const r = await pg.evaluate(([e, u]) => { window.__evolute.save.clears = [1, 1, 0]; return window.__sim(80, u, null, e); }, [era, ups]);
    console.log(`SIM era${era} ${JSON.stringify(ups).padEnd(30)} win ${r.winRate} crashes ${r.crashes}`); ok(r.crashes === 0, 'sim çökme yok');
  }
  // 12) küçük ekran düzeni
  const sm = await open(browser, 'de-DE', { width: 360, height: 640 });
  await sm.screenshot({ path: SCR + '/h-small-menu.png' });
  await sm.click('[data-act="settings"]'); await sm.screenshot({ path: SCR + '/h-small-settings.png' });
  const ovs = await sm.evaluate(() => { const o = document.getElementById('ov'); return [o.scrollHeight, o.clientHeight]; });
  console.log('küçük ekran ayarlar: scrollHeight/clientHeight', ovs);
  console.log('HATALAR:', [...pg.errs, ...sm.errs].length ? [...pg.errs, ...sm.errs] : 'yok'); if ([...pg.errs, ...sm.errs].length) fails++;
  console.log(fails ? `\n${fails} BAŞARISIZ` : '\nHEPSİ GEÇTİ');
  await browser.close();
})();
