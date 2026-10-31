import { parentPort } from 'node:worker_threads';
import { toTeam, winRate } from './common.mjs';
parentPort.on('message', ({ id, cand, pool, n, seed, scale }) => {
  try {
    const A = toTeam(cand, 'A', scale);
    const rates = pool.map((p, j) => winRate(A, toTeam(p, 'B'), n, seed + j * 1000));
    parentPort.postMessage({ id, rates });
  } catch (e) { parentPort.postMessage({ id, error: String(e && e.stack || e) }); }
});
