const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path'); const SCR = path.join(__dirname, 'out');
const body = fs.readFileSync(path.join(__dirname, '..', 'prototype', 'evolute.html'), 'utf8');
fs.writeFileSync(SCR + '/wrapped.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const BOT = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const URL = 'file://' + SCR + '/wrapped.html';
const mk = async (browser, flag = true, storageState) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true, locale: 'en-US', storageState });
  if (flag) await ctx.addInitScript(() => { window.__EVO_TEST__ = true; });
  const page = await ctx.newPage(); page.errs = [];
  page.on('pageerror', e => page.errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto(URL, { waitUntil: 'domcontentloaded' }); await page.evaluate(BOT); await page.waitForTimeout(250);
  return { ctx, page };
};
(async () => {
  const browser = await chromium.launch();
  // 1) kancalar bayraksız yok
  { const { ctx, page } = await mk(browser, false); ok(await page.evaluate(() => typeof window.__evolute === 'undefined' && typeof window.__EVO_TEST__ === 'undefined'), 'test kancaları bayraksız yok (konsoldan hile yok)'); await ctx.close(); }
  // 2) kayıt imzası ve kurcalama
  const { ctx, page } = await mk(browser);
  await page.evaluate(() => { const E = window.__evolute; E.save.dna = 500; E.save.tut = 1; E.persist(); });
  const raw = await page.evaluate(() => ({ a: localStorage.getItem('evolute_v2'), b: localStorage.getItem('evolute_v2b') }));
  ok(raw.a && raw.a === raw.b && JSON.parse(raw.a).v === 2 && JSON.parse(raw.a).h, 'kayıt imzalı ve iki kopya');
  ok(await page.evaluate(() => localStorage.getItem('evolute_g0') === null), 'eski imzasız kayıt anahtarı kullanılmıyor');
  const tamperVal = v => { const w = JSON.parse(v), p = JSON.parse(w.p); p.dna = 99999999; w.p = JSON.stringify(p); return JSON.stringify(w); };
  const reload = async (a, b) => {
    await page.evaluate(([a, b]) => { localStorage.removeItem('evolute_v2'); localStorage.removeItem('evolute_v2b'); if (a !== null) localStorage.setItem('evolute_v2', a); if (b !== null) localStorage.setItem('evolute_v2b', b); }, [a, b]);
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.evaluate(BOT); await page.waitForTimeout(250);
    return page.evaluate(() => ({ dna: window.__evolute.save.dna, notice: window.__evolute.loadNotice, txt: document.querySelector('.ov').textContent }));
  };
  let r = await reload(raw.a, raw.b); ok(r.dna === 500 && !r.notice, 'değişmemiş kayıt yüklendi');
  r = await reload(tamperVal(raw.a), tamperVal(raw.b)); ok(r.dna === 0 && /has been reset/.test(r.txt), 'iki kopya da düzenlenirse kayıt sıfırlanır ve uyarı gösterilir');
  await page.evaluate(() => { const E = window.__evolute; E.save.dna = 500; E.save.tut = 1; E.persist(); });
  r = await reload(tamperVal(raw.a), raw.b); ok(r.dna === 500 && !r.notice, 'yalnızca bir kopya bozulursa diğerinden kurtarılır');
  r = await reload(null, raw.b); ok(r.dna === 500, 'ana kopya silinirse yedekten yüklenir');
  r = await reload('{"v":2,"p":"x","h":"y"}', '{"v":2,"p":"x","h":"y"}'); ok(r.dna === 0 && /has been reset/.test(r.txt), 'bozuk kayıt çökme yapmaz, sıfırlanır');
  r = await reload('not json', 'also not'); ok(r.dna === 0, 'JSON olmayan kayıt çökme yapmaz');
  await ctx.close();
  // 3) hostile sanitize
  const { ctx: c2, page: p2 } = await mk(browser);
  const san = await p2.evaluate(() => {
    const E = window.__evolute, h = { dna: '1e99', runs: 5, wins: 99999, up: { atk: 999, hp: -5, spawn: 'x', gold: 1.9, evil: 5 }, unlocked: 99, era: 99, clears: [1, 1, 0, 9, 9, 9], codex: { '0:0:1': 1, '9:0:1': 1, 'x': 1, '3:0:1': 1, '0:5:5': 1 }, ach: { 'merges50': 1, '<script>': 1 }, stats: { merges: 'NaN', maxTier: 99 }, daily: { last: 'hack', streak: -3 }, idleT: Date.now() + 1e12, maxT: -1, lang: '<img>', mode: 'god', gfx: 'x', speed: 99, pet: { d: '2026-1-1', k: { '0:0:1': 1, 'zz': 1 } }, __proto__: { polluted: 1 } };
    const s = E.sanitize(JSON.parse(JSON.stringify(h)));
    return { dna: s.dna, wins: s.wins, up: s.up, unlocked: s.unlocked, era: s.era, codex: Object.keys(s.codex), ach: Object.keys(s.ach), maxTier: s.stats.maxTier, merges: s.stats.merges, daily: s.daily, idleOk: s.idleT <= Date.now(), lang: s.lang, mode: s.mode, gfx: s.gfx, speed: s.speed, pet: s.pet && Object.keys(s.pet.k), polluted: ({}).polluted };
  });
  console.log('sanitize', JSON.stringify(san));
  ok(san.dna === 1e9 && san.wins === 5 && san.up.atk === 20 && san.up.hp === 0 && san.up.spawn === 0 && san.up.gold === 1 && !('evil' in san.up), 'sayısal alanlar sınırlandı');
  ok(san.unlocked === 2 && san.era === 2, 'çağ kilidi temizlenen çağlarla tutarlı (kilit atlanamaz)');
  ok(JSON.stringify(san.codex) === '["0:0:1"]' || (san.codex.length <= 2 && !san.codex.includes('9:0:1') && !san.codex.includes('x')), 'katalog anahtarları doğrulandı ' + JSON.stringify(san.codex));
  ok(san.ach.length === 1 && san.maxTier === 8 && san.merges === 0 && san.daily.last === '' && san.daily.streak === 0 && san.idleOk, 'başarım, istatistik, tarih ve zaman alanları temizlendi');
  ok(san.lang === null && san.mode === 'normal' && san.gfx === 'auto' && san.speed === 1 && JSON.stringify(san.pet) === '["0:0:1"]' && san.polluted === undefined, 'metin alanları beyaz listeyle sınırlandı, prototype kirletme yok');
  // 4) monoton saat
  const tm = await p2.evaluate(() => {
    const E = window.__evolute, real = Date.now.bind(Date); window.__off = 0; Date.now = () => real() + window.__off;
    E.save.maxT = 0; E.save.idleT = Date.now() - 3 * 3600e3; const a0 = E.idleAcc();
    window.__off = -2 * 864e5; const a1 = E.idleAcc(); const t1 = E.nowT();
    E.save.idleT = E.nowT(); window.__off = -5 * 864e5; const a2 = E.idleAcc();
    const today1 = E.save.maxT; window.__off = -60 * 864e5; E.nowT(); const reset = Math.abs(E.save.maxT - Date.now()) < 5000;
    window.__off = 0; return { a0, a1, a2, frozen: t1 >= real() - 100, reset };
  });
  console.log('time', JSON.stringify(tm));
  ok(tm.a0 > 0 && tm.a1 >= tm.a0 && tm.a2 === 0, 'saat geri alınınca bekleme DNA\'sı artmaz, kazanç dondurulur');
  ok(tm.reset, 'saat 30+ gün geri giderse zaman damgası güvenle sıfırlanır');
  // 5) çökme kurtarma
  await p2.evaluate(() => { const E = window.__evolute; E.save.tut = 1; E.newGame(); window.__orig = CanvasRenderingContext2D.prototype.clearRect; CanvasRenderingContext2D.prototype.clearRect = function () { throw new Error('boom'); }; });
  await p2.waitForTimeout(600);
  ok(/Something went wrong/.test(await p2.textContent('.ov')), 'tekrarlayan hata çökme ekranı verir (oyun donmaz)');
  await p2.evaluate(() => { CanvasRenderingContext2D.prototype.clearRect = window.__orig; });
  await p2.click('[data-act="menu"]'); await p2.waitForTimeout(300);
  ok(/EVOLUTE/.test(await p2.textContent('.ov')), 'çökme sonrası menüye dönülebiliyor');
  await c2.close();
  console.log(fails ? `\n${fails} BAŞARISIZ` : '\nHEPSİ GEÇTİ');
  await browser.close();
})();
