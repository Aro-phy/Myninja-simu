// Tournoi final entre les meilleures formations trouvées, puis sensibilité des meilleures à leurs stats.
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { key, core, describe, describeEq, toTeam, byId } from './common.mjs';
import { simulate, inspect } from '../../engine.js';

const files = process.argv.slice(2);
const N = Number(process.env.N || 40), TOP = Number(process.env.TOP || 24);
const all = new Map();
for (const f of files) { const d = JSON.parse(readFileSync(f, 'utf8')); for (const g of [...d.hall, ...d.pop]) all.set(key(g), g); }
let cands = [...all.values()];
console.log(`${cands.length} formations candidates`);

const workers = Array.from({ length: 4 }, () => new Worker(new URL('./worker.mjs', import.meta.url)));
let jobId = 0; const pending = new Map(); let rr = 0;
for (const w of workers) w.on('message', (m) => { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error)) : p.resolve(m.rates); });
const evalCand = (cand, pool, n, seed, scale) => new Promise((resolve, reject) => {
  const id = jobId++; pending.set(id, { resolve, reject }); workers[rr++ % 4].postMessage({ id, cand, pool, n, seed, scale });
});
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// 1) pré-sélection : chacun contre tous, peu de combats
let scores = await Promise.all(cands.map((c, i) => evalCand(c, cands, 8, 777 + i).then(mean)));
// une seule variante (natures, équipement) par groupe de ninjas : la meilleure
const bestByCore = new Map();
for (const x of cands.map((g, i) => ({ g, s: scores[i] })).sort((a, b) => b.s - a.s)) if (!bestByCore.has(core(x.g))) bestByCore.set(core(x.g), x.g);
cands = [...bestByCore.values()].slice(0, TOP);
// 2) tournoi : chacun contre tous les autres finalistes, N combats par duel
const matrix = await Promise.all(cands.map((c, i) => evalCand(c, cands, N, 99991 + i * 13)));
const table = cands.map((g, i) => ({ g, s: mean(matrix[i].filter((_, j) => j !== i)), rates: matrix[i] })).sort((a, b) => b.s - a.s);
// indicateurs : combats finis avant le round 20, taux et résistance de contrôle moyens
for (const x of table) {
  let ko = 0, n = 0;
  for (const o of table) if (o !== x) for (let s = 0; s < 6; s++) { const r = simulate(toTeam(x.g, 'A'), toTeam(o.g, 'B'), { seed: s, log: false }); n++; if (!r.timeout) ko++; }
  const ins = inspect(toTeam(x.g, 'A'), toTeam(table[0] === x ? table[1].g : table[0].g, 'B')).filter((u) => u.team === 0);
  x.ko = ko / n;
  x.cc = ins.reduce((a, u) => a + u.mods.ccRate, 0) / ins.length;
  x.res = ins.reduce((a, u) => a + u.mods.ccRes, 0) / ins.length;
}
table.forEach((x, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${(x.s * 100).toFixed(1)} %  ${describe(x.g)}   [fini avant le round 20 : ${(x.ko * 100).toFixed(0)} %, taux CC moyen ${x.cc.toFixed(0)}, résist. CC moyenne ${x.res.toFixed(0)}]`);
  if (i < 6) for (const id of ['main', x.g.v, ...x.g.a, ...x.g.s].filter(Boolean)) console.log(`      ${id === 'main' ? 'Perso principal' : byId[id].name} : ${describeEq(x.g, id)}`);
});

// 3) sensibilité des 5 meilleures : stats de toute la formation modifiées, contre les autres finalistes
const SCALES = {
  'vitesse −15 %': { speed: 0.85 }, 'vitesse +15 %': { speed: 1.15 },
  'attaque −20 %': { atk: 0.8 }, 'PV −20 %': { hp: 0.8 }, 'défenses −20 %': { pdef: 0.8, mdef: 0.8 },
  'Dégâts −60': { dr: (v) => v - 60 }, 'Absorption −60': { air: (v) => v - 60 },
  'Précision −60': { hit: (v) => v - 60 }, 'Critique −40': { crit: (v) => v - 40 }, 'Tour Bonus −30': { extraTurn: (v) => v - 30 },
  'taux CC −40': { ccRate: (v) => v - 40 }, 'résist. CC −40': { ccRes: (v) => v - 40 },
};
const sens = [];
for (const x of table.slice(0, 5)) {
  const others = table.filter((y) => y !== x).map((y) => y.g);
  const base = mean(await evalCand(x.g, others, N, 5551));
  const row = { formation: describe(x.g), base };
  for (const [lbl, sc] of Object.entries(SCALES)) {
    // les fonctions ne passent pas par postMessage : on les transforme en décalages
    const plain = Object.fromEntries(Object.entries(sc).map(([k, v]) => [k, typeof v === 'function' ? { add: v(0) } : v]));
    row[lbl] = mean(await evalCand(x.g, others, N, 5551, plain)) - base;
  }
  sens.push(row);
  console.log(`\n${row.formation}\n  base ${(base * 100).toFixed(1)} % | ` + Object.keys(SCALES).map((l) => `${l} ${(row[l] * 100 >= 0 ? '+' : '')}${(row[l] * 100).toFixed(1)}`).join(' | '));
}
writeFileSync(process.env.OUT || 'meta-final.json', JSON.stringify({ table: table.map((x) => ({ g: x.g, s: x.s, ko: x.ko, cc: x.cc, res: x.res, rates: x.rates })), sens }, null, 1));
await Promise.all(workers.map((w) => w.terminate()));
