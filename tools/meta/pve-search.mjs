// Recherche de formations PvE : évolution (ninjas, natures, équipement, accessoires) jugée contre les mêmes formations
// PvE (pve.mjs), puis optimisation de l'équipement des meilleures. SEED_FILE : formations de départ (génomes JSON).
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { POOL, NATURE_LIST, GEAR_IDS, ACC_IDS, key, describe, describeEq, byId } from './common.mjs';

const GENS = Number(process.env.GENS || 60), POP = Number(process.env.POP || 48), K = Number(process.env.K || 10), N = Number(process.env.N || 4);
const OUT = process.env.OUT || 'pve-result.json';
let seed = Number(process.env.SEED || 7);
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const workers = Array.from({ length: 4 }, () => new Worker(new URL('./worker-pve.mjs', import.meta.url)));
let jobId = 0; const pending = new Map(); let rr = 0;
for (const w of workers) w.on('message', (m) => { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error)) : p.resolve(m.res); });
export const evalPve = (cand, k = K, n = N, s = 1) => new Promise((resolve, reject) => {
  const id = jobId++; pending.set(id, { resolve, reject }); workers[rr++ % 4].postMessage({ id, cand, K: k, n, seed: s });
});

const randomEq = () => ({ gear: pick(GEAR_IDS), acc: rnd() < 0.5 ? Array(4).fill(pick(ACC_IDS)) : [pick(ACC_IDS), pick(ACC_IDS), pick(ACC_IDS), pick(ACC_IDS)] });
function randomGenome() {
  for (;;) {
    const hasV = rnd() < 0.7, nA = Math.floor(rnd() * 3), nS = 4 - (hasV ? 1 : 0) - nA;
    if (nS < 0 || nS > 3) continue;
    const g = { v: hasV ? pick(POOL.vanguard) : null, a: [], s: [], nat: {}, mainType: rnd() < 0.5 ? 'physical' : 'magic', eq: {} };
    while (g.a.length < nA) { const x = pick(POOL.assaulter); if (!g.a.includes(x)) g.a.push(x); }
    while (g.s.length < nS) { const x = pick(POOL.supporter); if (!g.s.includes(x)) g.s.push(x); }
    for (const id of [g.v, ...g.a, ...g.s].filter(Boolean)) g.nat[id] = pick(NATURE_LIST);
    for (const id of ['main', g.v, ...g.a, ...g.s].filter(Boolean)) g.eq[id] = randomEq();
    return g;
  }
}
function mutate(g0) {
  const g = structuredClone(g0);
  const ids = () => [g.v, ...g.a, ...g.s].filter(Boolean);
  const r = rnd();
  if (r < 0.45) {
    const id = pick(['main', ...ids()]); const e = g.eq[id] || (g.eq[id] = randomEq());
    if (!Array.isArray(e.acc)) e.acc = Array(4).fill(e.acc);
    const q = rnd();
    if (q < 0.3) e.gear = pick(GEAR_IDS);
    else if (q < 0.4) { const a = pick(GEAR_IDS), b = pick(GEAR_IDS); e.gear = [a, a, b, b, a, a]; }
    else if (q < 0.8) e.acc[Math.floor(rnd() * 4)] = pick(ACC_IDS);
    else e.acc = Array(4).fill(pick(ACC_IDS));
  } else if (r < 0.8) {
    const slots = [...(g.v ? [['v', 0]] : []), ...g.a.map((_, i) => ['a', i]), ...g.s.map((_, i) => ['s', i])];
    const [k, i] = pick(slots); const role = k === 'v' ? 'vanguard' : k === 'a' ? 'assaulter' : 'supporter';
    let x; do { x = pick(POOL[role]); } while (ids().includes(x));
    const old = k === 'v' ? g.v : g[k][i];
    if (k === 'v') g.v = x; else g[k][i] = x;
    g.nat[x] = g.nat[old]; delete g.nat[old]; g.eq[x] = g.eq[old]; delete g.eq[old];
  } else if (r < 0.95) g.nat[pick(ids())] = pick(NATURE_LIST);
  else g.mainType = g.mainType === 'magic' ? 'physical' : 'magic';
  return g;
}

if (process.argv[1]?.endsWith('pve-search.mjs')) {
  const seeds = process.env.SEED_FILE ? JSON.parse(readFileSync(process.env.SEED_FILE, 'utf8')) : [];
  let pop = [...seeds, ...Array.from({ length: POP - seeds.length }, randomGenome)];
  const t0 = Date.now(); let ranked = [];
  for (let gen = 1; gen <= GENS; gen++) {
    const res = await Promise.all(pop.map((c) => evalPve(c)));
    ranked = pop.map((g, i) => ({ g, ...res[i] })).sort((a, b) => b.score - a.score);
    const b = ranked[0];
    console.log(`gén ${gen} (${Math.round((Date.now() - t0) / 1000)} s) meilleur : ${(100 * b.win).toFixed(0)} % de victoires, ${(100 * b.dmg).toFixed(0)} % des PV ennemis retirés — ${describe(b.g)}`);
    const elite = ranked.slice(0, Math.floor(POP / 4)).map((x) => x.g);
    const seen = new Set(elite.map(key)); const next = [...elite];
    while (next.length < POP) { const c = rnd() < 0.1 ? randomGenome() : mutate(rnd() < 0.3 ? mutate(pick(elite)) : pick(elite)); if (!seen.has(key(c))) { seen.add(key(c)); next.push(c); } }
    pop = next;
    writeFileSync(OUT, JSON.stringify(ranked.slice(0, 20).map((x) => ({ g: x.g, win: x.win, dmg: x.dmg })), null, 1));
  }
  await Promise.all(workers.map((w) => w.terminate()));
}
