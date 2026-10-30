const M = require('/home/user/Proje-/games/rbmk-sim/model.js');
const steps = (arr, d0) => tt => { let v = d0; for (const [a, b] of arr) if (tt >= a) v = b; return v; };
const ramp = (low, t0, t1, t2, t3) => tt => tt < t0 ? 1 : tt < t1 ? 1 - (1 - low) * (tt - t0) / (t1 - t0) : tt < t2 ? low : tt < t3 ? low + (1 - low) * (tt - t2) / (t3 - t2) : 1;
function run(params, demand, secs, boronBot) {
  const T = M.TYPES.pwr; Object.assign(T, params); const s = M.create('pwr'); s.auto = true; let ok = 0, tot = 0, maxOver = 0, maxTm = 0, minORM = 99, maxRate = 0, trip = 0;
  for (let k = 0; k < 20 * secs; k++) { const t = k * 0.05; s.Dset = demand(t); if (boronBot) { const o = M.ORM(s, s.p); if (o < 17) s.boronTarget = Math.max(0, s.boronTarget - 1.5); else if (o > 25) s.boronTarget = Math.min(1500, s.boronTarget + 1.5); } M.step(s, 0.05);
    const dT = Math.abs(s.Tm - M.tRef(s.D)); tot++; if (dT <= 2.5) ok++; maxOver = Math.max(maxOver, (s.n - s.D) / s.D); maxTm = Math.max(maxTm, dT); minORM = Math.min(minORM, M.ORM(s, s.p)); maxRate = Math.max(maxRate, s.rate); if (s.n > 1.09) trip++; }
  return { pct: Math.round(ok / tot * 100), over: +maxOver.toFixed(2), maxTm: +maxTm.toFixed(1), minORM: +minORM.toFixed(1), per: +(1 / Math.max(1e-6, maxRate)).toFixed(1), n109: trip, final: +s.n.toFixed(2) };
}
const orig = Object.assign({}, M.TYPES.pwr);
for (const kT of [16]) for (const vRod of [0.06]) for (const gain of [2]) for (const tauF of [8]) {
  const P = { kT: 16, vRod: 0.06, autoGain: 2, autoDead: 0.25, tauF: 8 };
  const a = run(P, steps([[30, 0.7], [75, 1], [110, 0.85]], 1), 150, false), b = run(P, ramp(0.4, 20, 40, 120, 150), 200, true);
  console.log(`kT ${kT} vRod ${vRod} gain ${gain} tauF ${tauF} | train: ${JSON.stringify(a)} | move: ${JSON.stringify(b)}`);
}
