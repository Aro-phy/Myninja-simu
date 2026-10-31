// Optimise l'équipement et les accessoires d'une formation donnée : pour chaque ninja, chaque set d'équipement (×6)
// et chaque paire d'accessoires (Force, Chakra, Agilité, Puissance) est essayé, le meilleur est gardé. Deux passages.
// Adversaires : les formations d'un fichier de résultats (hnat.json…) et les formations de référence.
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { GEAR_IDS, ACC_IDS, describe, describeEq, byId } from './common.mjs';
import { REFERENCE } from './reference.mjs';

const [, , formationFile, opponentsFile] = process.argv;
const g = JSON.parse(readFileSync(formationFile, 'utf8'));
const opponents = [...JSON.parse(readFileSync(opponentsFile, 'utf8')).map((x) => x.g || x), ...REFERENCE];
const N = Number(process.env.N || 40), PASSES = Number(process.env.PASSES || 2);
const workers = Array.from({ length: 4 }, () => new Worker(new URL('./worker.mjs', import.meta.url)));
let jobId = 0; const pending = new Map(); let rr = 0;
for (const w of workers) w.on('message', (m) => { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error)) : p.resolve(m.rates); });
const evalCand = (cand, n, seed) => new Promise((resolve, reject) => {
  const id = jobId++; pending.set(id, { resolve, reject }); workers[rr++ % 4].postMessage({ id, cand, pool: opponents, n, seed });
});
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const score = (c) => evalCand(c, N, 4242).then(mean);

const ids = ['main', g.v, ...g.a, ...g.s].filter(Boolean);
for (const id of ids) {
  g.eq[id] ||= { gear: GEAR_IDS[0], acc: Array(4).fill(ACC_IDS[0]) };
  if (!Array.isArray(g.eq[id].acc)) g.eq[id].acc = Array(4).fill(g.eq[id].acc);
}
let best = await score(g);
const start = best;
console.log(`départ : ${(best * 100).toFixed(1)} %`);
for (let pass = 0; pass < PASSES; pass++) {
  for (const id of ids) {
    const name = id === 'main' ? 'Perso principal' : byId[id].name;
    // équipement : un set pour les 6 pièces
    const tries = await Promise.all(GEAR_IDS.map((sid) => { const c = structuredClone(g); c.eq[id].gear = sid; return score(c).then((s) => ({ sid, s })); }));
    tries.sort((a, b) => b.s - a.s);
    if (tries[0].s > best + 0.003) { g.eq[id].gear = tries[0].sid; best = tries[0].s; }
    // accessoires : chaque paire, puis les 8 du même set
    for (let k = 0; k < 4; k++) {
      const t = await Promise.all(ACC_IDS.map((sid) => { const c = structuredClone(g); c.eq[id].acc[k] = sid; return score(c).then((s) => ({ sid, s })); }));
      t.sort((a, b) => b.s - a.s);
      if (t[0].s > best + 0.003) { g.eq[id].acc[k] = t[0].sid; best = t[0].s; }
    }
    const t8 = await Promise.all(ACC_IDS.map((sid) => { const c = structuredClone(g); c.eq[id].acc = Array(4).fill(sid); return score(c).then((s) => ({ sid, s })); }));
    t8.sort((a, b) => b.s - a.s);
    if (t8[0].s > best + 0.003) { g.eq[id].acc = Array(4).fill(t8[0].sid); best = t8[0].s; }
    console.log(`passage ${pass + 1}, ${name} : ${(best * 100).toFixed(1)} % — ${describeEq(g, id)}`);
  }
}
console.log(`\n${describe(g)}\n${(start * 100).toFixed(1)} % → ${(best * 100).toFixed(1)} %`);
writeFileSync(process.env.OUT || 'tuned.json', JSON.stringify(g, null, 1));
await Promise.all(workers.map((w) => w.terminate()));
