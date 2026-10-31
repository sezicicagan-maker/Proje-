// Koruma sistemi botu (v4): node tests/tools/trips.js [assist|full|off] [html]
// Her tür x senaryo için 12 koşu: Eğitim/Manevra'da varsayılan OTOMATİK (müdahalesiz), Serbest'te insan benzeri rastgele müdahaleler.
// Sayar: kapatma, geri çekme, ağır çekim, patlama, puan. Beklenen: eğitim/manevrada 0 kapatma, 0 ağır çekim.
const { chromium } = require('playwright'); const path = require('path');
const mode = process.argv[2] || 'assist', file = path.resolve(process.argv[3] || path.join(__dirname, '..', '..', 'games', 'rbmk-sim', 'index.html'));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { window.__RB_TEST__ = true; });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + file); await p.waitForTimeout(300);
  const res = await p.evaluate(mode => {
    const R = window.__rb, out = {}; let seed = 1; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    R.save.prot = mode; R.save.slow = true;
    for (const ty of ['rbmk', 'pwr', 'bwr', 'candu']) for (const sn of ['train', 'move', 'sand']) {
      const st = { runs: 0, trips: 0, steps: 0, slow: 0, destroyed: 0, ended: 0, score: [], tripTimes: [], maxN: 0 };
      for (let k = 0; k < 12; k++) {
        seed = 100 * k + 7; R.initScenario(sn, ty); R.playing = false; const S = R.S, T = S.T; let slowSeen = false;
        for (let i = 0; i < 20 * 240; i++) {
          if (sn === 'sand' && i % (20 * (4 + Math.floor(rnd() * 6))) === 0) {
            const a = rnd();
            if (a < 0.35) { if (T.actuator === 'rods' && T.id !== 'pwr') S.auto = false; if (!(S.auto && T.actuator === 'rods')) S.pTarget = Math.max(0, Math.min(T.stroke, S.pTarget + (rnd() - 0.5) * 1.6)); }
            else if (a < 0.6 && T.id !== 'pwr') { if (!(S.auto && T.actuator === 'flow')) S.flowTarget = Math.max(T.flowMin, Math.min(T.flowMax, S.flowTarget + (rnd() - 0.5) * 0.25)); }
            else if (a < 0.8 && T.id === 'pwr') S.boronTarget = Math.max(300, Math.min(1400, S.boronTarget + (rnd() - 0.5) * 200));
            else if (a < 0.9 && T.id === 'pwr') S.Dset = Math.max(0.3, Math.min(1, S.Dset + (rnd() - 0.5) * 0.4));
            else { S.auto = !S.auto; if (S.auto && T.id !== 'pwr') S.nSet = Math.max(0.05, Math.min(1, S.n + (rnd() - 0.5) * 0.3)); }
            if (S.auto && T.actuator === 'rods') S.pTarget = S.p;
          }
          if (S.az && R.canReset() && sn === 'sand') R.doReset();
          R.tick(); if (R.ts < 0.5) slowSeen = true; st.maxN = Math.max(st.maxN, S.n);
          if (R.ended || S.destroyed) break;
        }
        st.runs++; st.trips += R.flags.trips; st.steps += R.flags.stepbacks; if (slowSeen) st.slow++; if (S.destroyed) st.destroyed++; if (R.ended) st.ended++;
        if (R.score.tot) st.score.push(Math.round(R.score.ok / R.score.tot * 100));
        for (const e of R.EVENTS) if (e.trip) st.tripTimes.push(Math.round(e.t));
      }
      out[ty + ':' + sn] = st;
    }
    return out;
  }, mode);
  console.log('mode', mode);
  for (const [k, v] of Object.entries(res)) console.log(k.padEnd(12), `trips ${v.trips} steps ${v.steps} slowmo ${v.slow}/${v.runs} destroyed ${v.destroyed} ended ${v.ended} score ${v.score.length ? Math.min(...v.score) + '-' + Math.max(...v.score) : '-'} maxN ${v.maxN.toFixed(2)} tripT ${v.tripTimes.slice(0, 8).join(',')}`);
  console.log('errs', errs); await b.close();
})();
