import { parentPort } from 'node:worker_threads';
import { pveScore } from './pve.mjs';
parentPort.on('message', ({ id, cand, K, n, seed }) => {
  try { parentPort.postMessage({ id, res: pveScore(cand, K, n, seed) }); }
  catch (e) { parentPort.postMessage({ id, error: String(e && e.stack || e) }); }
});
