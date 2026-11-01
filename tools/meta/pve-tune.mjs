// Optimise l'équipement et les accessoires d'une formation pour le PvE (même principe que tune-equip.mjs).
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { GEAR_IDS, ACC_IDS, describe, describeEq, byId } from './common.mjs';
const g = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const K = Number(process.env.K || 10), N = Number(process.env.N || 4), PASSES = Number(process.env.PASSES || 2);
const workers = Array.from({ length: 4 }, () => new Worker(new URL('./worker-pve.mjs', import.meta.url)));
let jobId = 0; const pending = new Map(); let rr = 0;
for (const w of workers) w.on('message', (m) => { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error)) : p.resolve(m.res); });
const score = (cand) => new Promise((resolve, reject) => { const id = jobId++; pending.set(id, { resolve, reject }); workers[rr++ % 4].postMessage({ id, cand, K, n: N, seed: 1 }); }).then((r) => r.score);
const FIX = (process.env.FIX || '').split(',').filter(Boolean);       // ninjas dont l'équipement est imposé
const MIN_GAIN = Number(process.env.MIN_GAIN || 0.003);              // gain minimal pour adopter un changement
const all = ['main', g.v, ...g.a, ...g.s].filter(Boolean);
const ids = all.filter((id) => !FIX.includes(id));
for (const id of all) { g.eq[id] ||= { gear: GEAR_IDS[0], acc: Array(4).fill(ACC_IDS[0]) }; if (!Array.isArray(g.eq[id].acc)) g.eq[id].acc = Array(4).fill(g.eq[id].acc); }
let best = await score(g);
for (let pass = 0; pass < PASSES; pass++) for (const id of ids) {
  const t = await Promise.all(GEAR_IDS.map((sid) => { const c = structuredClone(g); c.eq[id].gear = sid; return score(c).then((s) => ({ sid, s })); }));
  t.sort((a, b) => b.s - a.s); if (t[0].s > best + MIN_GAIN) { g.eq[id].gear = t[0].sid; best = t[0].s; }
  for (let k = 0; k < 4; k++) {
    const u = await Promise.all(ACC_IDS.map((sid) => { const c = structuredClone(g); c.eq[id].acc[k] = sid; return score(c).then((s) => ({ sid, s })); }));
    u.sort((a, b) => b.s - a.s); if (u[0].s > best + MIN_GAIN) { g.eq[id].acc[k] = u[0].sid; best = u[0].s; }
  }
}
console.log(describe(g)); for (const id of all) console.log(`  ${id === 'main' ? 'Perso principal' : byId[id].name} : ${describeEq(g, id)}`);
writeFileSync(process.env.OUT || 'pve-tuned.json', JSON.stringify([{ g }]));
await Promise.all(workers.map((w) => w.terminate()));
