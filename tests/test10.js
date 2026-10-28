const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path'); const SCR = path.join(__dirname, 'out');
const body = fs.readFileSync(path.join(__dirname, '..', 'prototype', 'evolute.html'), 'utf8');
fs.writeFileSync(SCR + '/wrapped.html', `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>${body}</body></html>`);
const BOT = fs.readFileSync(path.join(__dirname, 'test.js'), 'utf8').match(/const BOT = `([\s\S]*?)`;/)[1];
let fails = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'en-US' });
  await ctx.addInitScript(() => { window.__EVO_TEST__ = true; });
  const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await page.goto('file://' + SCR + '/wrapped.html', { waitUntil: 'domcontentloaded' }); await page.evaluate(BOT);
  await page.evaluate(() => { const E = window.__evolute; E.save.tut = 1; E.save.up = { atk: 12, hp: 8, spawn: 8 }; E.persist(); E.showMenu(); });
  await page.waitForTimeout(400);
  ok(/Level 1/.test(await page.textContent('.ov')), 'menüde seviye çubuğu var');
  const q = await page.evaluate(() => window.__evolute.qList());
  ok(q.length === 3 && new Set(q.map(x => x.k)).size === 3, 'günlük 3 farklı görev: ' + q.map(x => x.k + ':' + x.n).join(','));
  // bir tur oynat, görev ilerlemesi ve seviye
  const r = await page.evaluate(() => {
    const E = window.__evolute; E.newGame(); let s = 0;
    while (E.g.mode !== 'over' && s < 9000) { E.step(0.05); s++; if (E.g.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.g.mode === 'play') window.__bot(E); }
    return { p: E.save.q.p.slice(), xp: E.save.xp, mode: E.g.mode, dna: E.save.dna };
  });
  console.log(r);
  ok(r.xp > 0, 'XP kazanıldı');
  ok(r.p.some(x => x > 0), 'görev ilerlemesi işlendi');
  // zorla tamamla ve talep et
  const c = await page.evaluate(() => { const E = window.__evolute, L = E.qList(); E.save.q.p = L.map(x => x.n); const d0 = E.save.dna; E.claimQuest(0); E.claimQuest(0); const d1 = E.save.dna; E.claimQuest(1); E.claimQuest(2); const d2 = E.save.dna; E.claimQuest('b'); const d3 = E.save.dna; E.claimQuest('b'); return { r0: L[0].r, once: d1 - d0, all: d2 - d1, bonus: d3 - d2, again: E.save.dna - d3, ready: E.qReadyN() }; });
  ok(c.once === c.r0, 'ödül yalnızca bir kez verilir ' + JSON.stringify(c));
  ok(c.bonus >= 60 && c.again === 0, 'tüm görev bonusu bir kez (+60, seviye ödülü hariç)');
  await page.evaluate(() => window.__evolute.showQuests()); await page.waitForTimeout(500);
  await page.screenshot({ path: SCR + '/quests.png' });
  // kurcalama: sahte görev ilerlemesi sınırlanır
  const t = await page.evaluate(() => { const E = window.__evolute; const s = E.sanitize({ q: { d: '2026-1-1', p: [1e12, -5, 'x'], c: [1, 0, 1], b: 1 }, xp: 1e15 }); return s; });
  ok(t.q.p[0] === 1e5 && t.q.p[1] === 0 && t.q.p[2] === 0 && t.xp === 1e7, 'sanitize görev/xp sınırları');
  // yeni gün sıfırlanır
  const nd = await page.evaluate(() => { const E = window.__evolute; E.save.q.d = '2020-1-1'; return E.qEnsure() && E.save.q.p.every(x => x === 0) && E.save.q.d !== '2020-1-1'; });
  ok(nd, 'yeni günde görevler sıfırlanır');
  // dil eşitliği
  const keys = await page.evaluate(() => { const S = window.__evolute.STR, a = Object.keys(S.tr); return Object.keys(S).every(l => a.every(k => k in S[l])); });
  ok(keys, '5 dilde tüm anahtarlar var');
  ok(errs.length === 0, 'hata yok ' + errs.join('|'));
  console.log(fails ? 'BAŞARISIZ' : '\nHEPSİ GEÇTİ'); await browser.close(); process.exit(fails ? 1 : 0);
})();
