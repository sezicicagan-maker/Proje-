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
  ok(await page.evaluate(() => window.__evolute.ERAS.length) === 6, '6 çağ');
  // genel simülasyon fonksiyonu
  await page.evaluate(() => {
    window.__run = (runs, era, up, mode, mod) => {
      const E = window.__evolute, keep = JSON.stringify(E.save), out = { wins: 0, crash: 0, wave: 0, boss: 0, kinds: {} };
      for (let n = 0; n < runs; n++) {
        E.save.up = Object.assign({ atk: 0, hp: 0, spawn: 0 }, up); E.save.era = era; E.save.mode = mode; E.save.clears = [1, 1, 1, 1, 1, 1].slice(0, 6); E.save.unlocked = 5;
        E.newGame(); if (mod) { E.g.mod = mod; if (mod === 'glass') { E.g.maxhp = 3; E.g.hp = 3; } }
        let s = 0;
        try { while (E.mode !== 'over' && s < 30000) { E.step(0.05); s++; if (E.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.mode === 'play') window.__bot(E); } } catch (e) { out.crash++; out.err = String(e.stack || e); }
        if (E.g.win) out.wins++; out.wave += E.g.waveReached; out.boss += E.g.bossKills || 0; out.kinds[E.g.kind] = 1;
      }
      out.wave = +(out.wave / runs).toFixed(1); out.boss = +(out.boss / runs).toFixed(1); out.winRate = +(out.wins / runs).toFixed(2);
      Object.assign(E.save, JSON.parse(keep)); return out;
    };
  });
  // çağ dengesi (hikaye)
  const plan = [[0, { atk: 4, hp: 3, spawn: 3 }], [1, { atk: 8, hp: 5, spawn: 5 }], [2, { atk: 12, hp: 8, spawn: 8 }], [3, { atk: 14, hp: 9, spawn: 9 }], [3, { atk: 18, hp: 11, spawn: 11 }], [4, { atk: 18, hp: 11, spawn: 11 }], [4, { atk: 20, hp: 14, spawn: 14 }], [5, { atk: 20, hp: 14, spawn: 14 }]];
  for (const [era, up] of plan) {
    const r = await page.evaluate(([e, u]) => window.__run(60, e, u, 'normal'), [era, plan.find(p => p[0] === era) && up]);
    console.log(`story era${era} ${JSON.stringify(up).padEnd(34)} win ${r.winRate} crash ${r.crash}`); ok(r.crash === 0, `era${era} çökme yok`);
  }
  // modlar
  for (const mode of ['endless', 'boss', 'daily']) {
    for (const era of [0, 3]) {
      const up = era === 0 ? { atk: 6, hp: 4, spawn: 4 } : { atk: 16, hp: 10, spawn: 10 };
      const r = await page.evaluate(([e, u, m]) => window.__run(30, e, u, m), [era, up, mode]);
      console.log(`${mode} era${era} win ${r.winRate} wave ${r.wave} boss ${r.boss} crash ${r.crash}`); ok(r.crash === 0 && r.kinds[mode], `${mode} era${era} çalışıyor`);
    }
  }
  // günlük kurallar
  const mods = await page.evaluate(() => window.__evolute.DAILY_MODS);
  for (const m of mods) { const r = await page.evaluate(([mm]) => window.__run(20, 1, { atk: 8, hp: 5, spawn: 5 }, 'daily', mm), [m]); console.log(`daily ${m.padEnd(6)} win ${r.winRate} crash ${r.crash}`); ok(r.crash === 0, `günlük kural ${m} çökme yok`); }
  // boss akını 5 boss ile kazanılabilir ve ödül mantığı
  const br = await page.evaluate(() => { const E = window.__evolute; E.save.clears = [1, 0, 0, 0, 0, 0]; E.save.mode = 'boss'; E.save.era = 0; E.save.up = { atk: 12, hp: 8, spawn: 8 }; E.save.bossBest = [0, 0, 0, 0, 0, 0]; E.save.bossTime = [0, 0, 0, 0, 0, 0]; let w = 0; for (let n = 0; n < 6 && !w; n++) { E.newGame(); let s = 0; while (E.mode !== 'over' && s < 30000) { E.step(0.05); s++; if (E.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.mode === 'play') window.__bot(E); } if (E.g.win) w = 1; } return { win: w, best: E.save.bossBest[0], time: E.save.bossTime[0], kills: E.g.bossKills }; });
  console.log('boss rush', JSON.stringify(br)); ok(br.win === 1 && br.best === 5 && br.time > 0, 'boss akını kazanıldı, rekorlar kaydedildi');
  // günlük bonus bir kez
  const db = await page.evaluate(() => { const E = window.__evolute; E.save.dailyDone = ''; E.save.mode = 'daily'; E.save.era = 0; E.save.up = { atk: 16, hp: 10, spawn: 10 }; const res = []; for (let n = 0; n < 8 && res.length < 2; n++) { E.newGame(); const d0 = E.save.dna; let s = 0; while (E.mode !== 'over' && s < 30000) { E.step(0.05); s++; if (E.mode === 'pick') E.pickMut(E.g.pickOffer[0]); if (s % 6 === 0 && E.mode === 'play') window.__bot(E); } if (E.g.win) res.push(E.g.dailyBonus || 0); } return res; });
  console.log('daily bonus', JSON.stringify(db)); ok(db.length === 2 && db[0] > 0 && !db[1], 'günlük bonus yalnızca ilk galibiyette');
  // UI: mod seçici ve kilitler
  await page.evaluate(() => { const E = window.__evolute; E.save.clears = [0, 0, 0, 0, 0, 0]; E.save.mode = 'normal'; E.save.unlocked = 5; E.save.era = 3; E.showMenu(); });
  ok(await page.evaluate(() => document.querySelector('[data-mode="endless"]').disabled && document.querySelector('[data-mode="boss"]').disabled && !document.querySelector('[data-mode="daily"]').disabled), 'sonsuz ve boss akını kilitli, günlük açık');
  await page.click('[data-mode="daily"]'); await page.waitForTimeout(700); await page.screenshot({ path: SCR + '/y-menu-daily.png' });
  await page.evaluate(() => { const E = window.__evolute; E.save.clears[3] = 1; E.showMenu(); });
  await page.click('[data-mode="boss"]'); await page.waitForTimeout(700); await page.screenshot({ path: SCR + '/y-menu-boss.png' });
  // yeni çağ görüntüleri
  for (const era of [3, 4, 5]) {
    await page.evaluate(era => { const E = window.__evolute; E.save.tut = 1; E.save.era = era; E.save.mode = 'normal'; E.save.up = { atk: 14, hp: 9, spawn: 9 }; E.newGame(); const g = E.g; g.board.fill(null); for (let c = 0; c < 5; c++) { g.board[E.idx(4, c)] = { el: c % 3, tier: 3 + c % 4, cd: 0, pop: 0, ph: c, rec: 0, born: 0, hide: 0, flash: 0 }; g.board[E.idx(3, c)] = { el: (c + 1) % 3, tier: 2 + c % 3, cd: 0, pop: 0, ph: c + 2, rec: 0, born: 0, hide: 0, flash: 0 }; }
      for (const [l, y, ty] of [[0, 130, 'n'], [1, 200, 'r'], [2, 160, 't'], [3, 110, 'n'], [4, 230, 'r']]) { const r = ty === 't' ? 19 : ty === 'r' ? 11 : 15; g.enemies.push({ lane: l, x: l * 72 + 36, y, hp: 60, maxhp: 100, spd: 20, r, dmg: 1, type: ty, boss: false, born: 0, ph: l, kb: 0, slow: 0, tox: null, flash: 0, dead: false }); }
      g.waveStarted = 6; g.t = 60; g.muts = { syn: 2 }; g.mode = 'paused'; }, era);
    await page.waitForTimeout(500); await page.screenshot({ path: `${SCR}/y-era${era}.png` });
  }
  console.log('HATALAR:', errs.length ? errs : 'yok'); if (errs.length) fails++;
  console.log(fails ? `\n${fails} BAŞARISIZ` : '\nHEPSİ GEÇTİ');
  await browser.close();
})();
