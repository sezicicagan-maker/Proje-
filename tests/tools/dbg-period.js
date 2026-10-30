const M = require('/home/user/Proje-/games/rbmk-sim/model.js');
const steps = (arr, d0) => tt => { let v = d0; for (const [a, b] of arr) if (tt >= a) v = b; return v; };
function trace(ty, opts, demand, secs, label) {
  const s = M.create(ty, opts); s.auto = true; const T = s.T; let maxRho = -9, firstShort = null, rows = [];
  for (let k = 0; k < 20 * secs; k++) { const t = k * 0.05; s.D = demand(t); if (ty !== 'pwr') s.nSet = s.D; M.step(s, 0.05); const per = s.rate > 1e-3 ? 1 / s.rate : Infinity, rho = M.rho(s) / T.beta; maxRho = Math.max(maxRho, rho);
    if (!firstShort && per < T.tripPer && s.n > 0.02) { firstShort = { t: +t.toFixed(1), per: +per.toFixed(2), rho: +rho.toFixed(2), n: +s.n.toFixed(3) }; }
    if (Math.abs(t - 75) < 0.03 || Math.abs(t - 76) < 0.03 || Math.abs(t - 78) < 0.03 || Math.abs(t - 85) < 0.03) rows.push(`${t.toFixed(0)}s n=${s.n.toFixed(3)} D=${s.D.toFixed(2)} per=${isFinite(per) ? per.toFixed(1) : '∞'} rho$=${rho.toFixed(2)} Tm=${s.Tm.toFixed(1)}`); }
  console.log(label, 'maxRho$=', maxRho.toFixed(2), 'ilk kısa periyot:', JSON.stringify(firstShort), '\n   ', rows.join(' | '));
}
trace('pwr', {}, steps([[30, 0.7], [75, 1], [110, 0.85]], 1), 150, 'PWR train');
trace('rbmk', { n: 0.6, orm: 22, nHist: 0.6 }, steps([[30, 0.42], [75, 0.6], [110, 0.5]], 0.6), 150, 'RBMK train');
trace('candu', {}, steps([[30, 0.7], [75, 1], [110, 0.85]], 1), 150, 'CANDU train');
trace('bwr', {}, steps([[30, 0.7], [75, 1], [110, 0.85]], 1), 150, 'BWR train');
