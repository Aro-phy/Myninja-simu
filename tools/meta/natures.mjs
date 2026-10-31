// Réglage final des natures : pour chacune des meilleures formations du tournoi, chaque ninja essaie les 5 natures
// (beaucoup de combats contre les autres finalistes et les formations de référence) ; la meilleure est gardée. Deux passages.
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { NATURE_LIST, describe, describeEq, byId } from './common.mjs';
import { REFERENCE } from './reference.mjs';

const { table } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const TOP = Number(process.env.TOP || 6), N = Number(process.env.N || 100);
const workers = Array.from({ length: 4 }, () => new Worker(new URL('./worker.mjs', import.meta.url)));
let jobId = 0; const pending = new Map(); let rr = 0;
for (const w of workers) w.on('message', (m) => { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error)) : p.resolve(m.rates); });
const evalCand = (cand, pool, n, seed) => new Promise((resolve, reject) => {
  const id = jobId++; pending.set(id, { resolve, reject }); workers[rr++ % 4].postMessage({ id, cand, pool, n, seed });
});
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

const out = [];
for (let i = 0; i < Math.min(TOP, table.length); i++) {
  const g = structuredClone(table[i].g);
  const opponents = [...table.filter((_, j) => j !== i).map((x) => x.g), ...REFERENCE];
  const score = (c) => evalCand(c, opponents, N, 31337).then(mean);
  let best = await score(g);
  const start = best;
  for (let pass = 0; pass < 2; pass++) {
    for (const id of [g.v, ...g.a, ...g.s].filter(Boolean)) {
      const tries = await Promise.all(NATURE_LIST.map((n) => { const c = structuredClone(g); c.nat[id] = n; return score(c).then((s) => ({ n, s })); }));
      tries.sort((a, b) => b.s - a.s);
      if (tries[0].s > best + 0.003) { g.nat[id] = tries[0].n; best = tries[0].s; }
    }
  }
  console.log(`\n${i + 1}. ${describe(g)}\n   natures réglées : ${(start * 100).toFixed(1)} % → ${(best * 100).toFixed(1)} %`);
  for (const id of ['main', g.v, ...g.a, ...g.s].filter(Boolean)) console.log(`      ${id === 'main' ? 'Perso principal' : byId[id].name} : ${describeEq(g, id)}`);
  out.push({ g, before: start, after: best });
}
writeFileSync(process.env.OUT || 'meta-natures.json', JSON.stringify(out, null, 1));
await Promise.all(workers.map((w) => w.terminate()));
