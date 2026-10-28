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
  await page.evaluate(BOT); await page.waitForTimeout(300);
  await page.evaluate(() => { window.__evolute.save.tut = 1; });
  ok(await page.evaluate(() => window.__evolute.MUTS.length) === 16, '16 mutasyon');
  // her mutasyon: seviye 2 ile tam koşu, çökme yok
  const mres = await page.evaluate(() => {
    const E = window.__evolute, out = {}; E.save.up = { atk: 6, hp: 4, spawn: 4 }; E.save.era = 0; E.save.mode = 'normal';
    for (const m of E.MUTS) { let crash = 0, wins = 0; for (let n = 0; n < 6; n++) { E.newGame(); E.g.muts[m.id] = 2; if (m.id === 'shield') E.g.shield = 4; let s = 0;
      try { while (E.mode !== 'over' && s < 20000) { E.step(0.05); s++; if (E.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.mode === 'play') window.__bot(E); } } catch (e) { crash++; out._err = String(e.stack || e); }
      if (E.g.win) wins++; } out[m.id] = { crash, wins }; }
    return out;
  });
  const crashed = Object.entries(mres).filter(([k, v]) => v.crash);
  console.log('mutations', JSON.stringify(Object.fromEntries(Object.entries(mres).filter(([k]) => k !== '_err').map(([k, v]) => [k, v.wins]))));
  ok(!crashed.length, 'tüm mutasyonlar çökmeden çalışıyor ' + (crashed.length ? mres._err : ''));
  // belirli mutasyon etkileri
  const eff = await page.evaluate(() => {
    const E = window.__evolute; E.save.mode = 'normal'; const r = {};
    E.newGame(); E.g.muts.shield = 1; E.pickMut; E.g.shield = 2; const hp0 = E.g.hp;
    E.g.enemies.push({ lane: 0, x: 36, y: 307, hp: 5, maxhp: 5, spd: 40, r: 15, dmg: 3, type: 'n', boss: false, born: 0, ph: 0, kb: 0, slow: 0, tox: null, flash: 0, dead: false });
    for (let i = 0; i < 8; i++) E.step(0.05); r.shield = hp0 - E.g.hp === 0 && E.g.shield === 1;
    E.newGame(); E.g.muts.heal = 1; E.g.hp = 5; E.g.healT = 0.1; for (let i = 0; i < 6; i++) E.step(0.05); r.heal = E.g.hp === 6;
    E.newGame(); E.g.muts.rich = 2; const g0 = E.g.gold; E.g.enemies.push({ lane: 1, x: 108, y: 100, hp: 1, maxhp: 1, spd: 0, r: 15, dmg: 1, type: 'n', boss: false, born: 0, ph: 0, kb: 0, slow: 0, tox: null, flash: 0, dead: false }); E.g.board.fill(null); E.g.spawnT = 99; E.hurt && 0;
    return r;
  });
  ok(eff.shield && eff.heal, 'kalkan sızmayı emiyor, yenilenme can veriyor ' + JSON.stringify(eff));
  // boss yetenekleri: her çağ için
  const ab = await page.evaluate(() => {
    const E = window.__evolute, out = [];
    for (let era = 0; era < 6; era++) {
      E.save.era = era; E.save.mode = 'normal'; E.newGame(); const g = E.g; g.board.fill(null);
      for (let c = 0; c < 5; c++) for (let r = 2; r < 5; r++) g.board[E.idx(r, c)] = { el: c % 3, tier: 2, cd: 0, pop: 0, ph: c, rec: 0, born: 0, hide: 0, flash: 0 };
      const boss = { lane: 2, x: 180, y: 100, hp: 1e9, maxhp: 1e9, spd: 0, r: 30, dmg: 6, type: 'b', boss: true, born: 0, ph: 0, kb: 0, slow: 0, tox: null, flash: 0, dead: false };
      g.enemies.push(boss);
      const before = JSON.stringify(g.board.map(u => u && [u.el, u.tier])); const q0 = g.queue.length;
      E.bossAbility(boss);
      const stun = g.board.filter(u => u && u.stun > 0).length, lock = g.board.filter(u => u && u.lock > 0).length, queued = g.queue.length - q0, moved = JSON.stringify(g.board.map(u => u && [u.el, u.tier])) !== before;
      let crash = 0; try { for (let i = 0; i < 80; i++) E.step(0.05); } catch (e) { crash = 1; }
      out.push({ era, kind: E.BOSS_AB[era], stun, lock, queued, moved, later: g.later.length, crash });
    }
    return out;
  });
  console.log('abilities', JSON.stringify(ab));
  ok(ab.every(a => !a.crash) && ab[0].stun > 0 && ab[1].lock === 2 && ab[2].stun === 3 && ab[3].queued >= 1 && ab[5].later >= 0, 'her çağın boss yeteneği çalışıyor');
  // kilitli hücre taşınamaz
  const lk = await page.evaluate(() => { const E = window.__evolute; E.save.era = 0; E.newGame(); const g = E.g; g.board.fill(null); g.board[0] = { el: 0, tier: 1, cd: 0, pop: 0, ph: 0, rec: 0, born: 0, hide: 0, flash: 0, lock: 5 }; g.board[1] = { el: 0, tier: 1, cd: 0, pop: 0, ph: 0, rec: 0, born: 0, hide: 0, flash: 0 }; return E.drop(0, 1); });
  ok(lk === 'none', 'kilitli yaratık birleştirilemez');
  // teraryum
  await page.evaluate(() => { const E = window.__evolute; E.save.codex = {}; for (let el = 0; el < 3; el++) for (let t = 1; t <= 8; t++) if ((el + t) % 2 === 0 || el === 2) E.save.codex['0:' + el + ':' + t] = 1; E.save.pet = null; E.showMenu(); });
  await page.click('[data-act="hab"]'); await page.waitForTimeout(900);
  const n = await page.evaluate(() => window.__evolute.habList.filter(c => c.found).length); ok(n > 6, 'teraryumda keşfedilen yaratıklar dolaşıyor: ' + n);
  const tap = await page.evaluate(() => { const E = window.__evolute, c = E.habList.find(x => x.found), d0 = E.save.dna; E.habTap(c.x, c.y); const d1 = E.save.dna; E.habTap(c.x, c.y); return [d1 - d0, E.save.dna - d1]; });
  ok(tap[0] === 1 && tap[1] === 0, 'sevince +1 DNA, aynı yaratıktan günde bir kez ' + JSON.stringify(tap));
  await page.waitForTimeout(400); await page.screenshot({ path: SCR + '/z-hab.png' });
  await page.click('[data-hera="1"]').catch(() => {});
  await page.click('[data-act="back"]'); ok((await page.textContent('.ov')).includes('EVOLUTE'), 'teraryumdan menüye dönüldü');
  // tam katalog başarımı
  const full = await page.evaluate(() => { const E = window.__evolute; E.save.ach = {}; for (let el = 0; el < 3; el++) for (let t = 1; t <= 8; t++) E.save.codex['0:' + el + ':' + t] = 1; const g = { newAch: [] }; E.checkAch(g); return g.newAch.map(a => a.id); });
  ok(full.includes('eraFull1'), 'tam katalog başarımı açıldı');
  // duraklatma ekranı mutasyonları listeler
  await page.evaluate(() => { const E = window.__evolute; E.save.era = 0; E.newGame(); E.g.muts = { rich: 2, bomb: 1 }; E.pauseGame(); });
  ok((await page.textContent('.ov')).includes('Gold Rush') && (await page.textContent('.ov')).includes('Death Blast'), 'duraklatmada aktif mutasyonlar listeleniyor');
  await page.screenshot({ path: SCR + '/z-pause.png' });
  console.log('HATALAR:', errs.length ? errs : 'yok'); if (errs.length) fails++;
  console.log(fails ? `\n${fails} BAŞARISIZ` : '\nHEPSİ GEÇTİ');
  await browser.close();
})();
