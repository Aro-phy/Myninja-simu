// Recherche évolutive de formations PvP : chaque génération, les candidats affrontent un groupe d'adversaires
// (meilleures formations trouvées jusqu'ici + formations au hasard) ; les meilleurs sont gardés et modifiés.
import { Worker } from 'node:worker_threads';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { POOL, NATURE_LIST, GEAR_IDS, ACC_IDS, key, describe, byId } from './common.mjs';
import { talentAwakenings } from '../../engine.js';
// ninjas avec plusieurs éveils de talent qui s'excluent (Kyo, Natsu, Hinata soccer, Sesshomaru…) : l'éveil fait partie du génome
const AW_CHOICE = (id) => (id && byId[id] && talentAwakenings(byId[id]).some((a) => a.replacePrevious) ? talentAwakenings(byId[id]).length : 0);
import { REFERENCE } from './reference.mjs';

const GENS = Number(process.env.GENS || 40), POP = Number(process.env.POP || 48), N = Number(process.env.N || 12);
const OUT = process.env.OUT || 'meta-result.json';
if (process.env.MODE === 'meta' && !REFERENCE.length) throw new Error('MODE=meta : aucune formation dans tools/meta/references/');
let seed = Number(process.env.SEED || 12345);
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

const workers = Array.from({ length: 4 }, () => new Worker(new URL('./worker.mjs', import.meta.url)));
let jobId = 0; const pending = new Map();
for (const w of workers) w.on('message', (m) => { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error)) : p.resolve(m.rates); });
let rr = 0;
const evalCand = (cand, pool, n, s) => new Promise((resolve, reject) => {
  const id = jobId++; pending.set(id, { resolve, reject });
  workers[rr++ % workers.length].postMessage({ id, cand, pool, n, seed: s });
});

const randomEq = () => ({ gear: pick(GEAR_IDS), acc: rnd() < 0.5 ? Array(4).fill(pick(ACC_IDS)) : [pick(ACC_IDS), pick(ACC_IDS), pick(ACC_IDS), pick(ACC_IDS)] });
// formation au hasard : 4 ninjas en plus du personnage principal
function randomGenome() {
  for (;;) {
    const hasV = rnd() < 0.6;
    const nA = Math.floor(rnd() * 3); // 0 à 2 attaquants en plus du principal
    const nS = 4 - (hasV ? 1 : 0) - nA;
    if (nS < 0 || nS > 3) continue;
    const g = { v: hasV ? pick(POOL.vanguard) : null, a: [], s: [], nat: {}, mainType: rnd() < 0.5 ? 'physical' : 'magic' };
    while (g.a.length < nA) { const x = pick(POOL.assaulter); if (!g.a.includes(x)) g.a.push(x); }
    while (g.s.length < nS) { const x = pick(POOL.supporter); if (!g.s.includes(x)) g.s.push(x); }
    for (const id of [g.v, ...g.a, ...g.s].filter(Boolean)) g.nat[id] = pick(NATURE_LIST);
    g.eq = {};
    for (const id of ['main', g.v, ...g.a, ...g.s].filter(Boolean)) g.eq[id] = randomEq();
    return g;
  }
}
// FORCE=id : ce ninja est imposé dans toutes les formations (formation construite autour de lui).
const FORCE = process.env.FORCE || null;
function forceIn(g) {
  if (!FORCE || [g.v, ...g.a, ...g.s].includes(FORCE)) return g;
  const role = byId[FORCE].role;
  const ids = [g.v, ...g.a, ...g.s].filter(Boolean);
  // on retire un ninja du même poste s'il y en a un, sinon un ninja au hasard
  let old = role === 'vanguard' ? g.v : (role === 'assaulter' ? g.a : g.s)[0];
  if (!old) old = ids[Math.floor(rnd() * ids.length)];
  if (g.v === old) g.v = null; else { g.a = g.a.filter((x) => x !== old); g.s = g.s.filter((x) => x !== old); }
  if (role === 'vanguard') { if (g.v) return g; g.v = FORCE; }
  else if (role === 'assaulter') { if (g.a.length >= 2) return g; g.a.push(FORCE); } else { if (g.s.length >= 3) return g; g.s.push(FORCE); }
  g.nat[FORCE] = g.nat[old] || pick(NATURE_LIST); delete g.nat[old];
  g.eq[FORCE] = g.eq[old] || randomEq(); delete g.eq[old];
  return g;
}
const clone = (g) => ({ v: g.v, a: [...g.a], s: [...g.s], nat: { ...g.nat }, mainType: g.mainType, eq: structuredClone(g.eq || {}), ...(g.aw ? { aw: { ...g.aw } } : {}) });
function mutate(g0) {
  const g = clone(g0);
  const ids = () => [g.v, ...g.a, ...g.s].filter(Boolean);
  const r0 = rnd();
  if (r0 < 0.06) { // éveil : un ninja à éveils exclusifs change de niveau
    const cand = ids().filter((id) => AW_CHOICE(id));
    if (cand.length) { const id = pick(cand); g.aw = { ...(g.aw || {}) }; g.aw[id] = 1 + Math.floor(rnd() * AW_CHOICE(id)); return g; }
  }
  if (r0 < 0.4) { // équipement : le set de 6 pièces, une paire d'accessoires, ou les 8 accessoires d'un même set
    const id = pick(['main', ...ids()]);
    const e = g.eq[id] || (g.eq[id] = randomEq());
    const q = rnd();
    if (q < 0.28) e.gear = pick(GEAR_IDS);
    else if (q < 0.4) { const a = pick(GEAR_IDS), b = pick(GEAR_IDS); e.gear = [a, a, b, b, a, a]; } // 4 + 2 pièces
    else if (q < 0.8) e.acc[Math.floor(rnd() * 4)] = pick(ACC_IDS);
    else e.acc = Array(4).fill(pick(ACC_IDS));
    return g;
  }
  const r = rnd();
  if (r < 0.45) { // remplace un ninja par un autre du même poste
    const slots = [...(g.v ? [['v', 0]] : []), ...g.a.map((_, i) => ['a', i]), ...g.s.map((_, i) => ['s', i])];
    const [k, i] = pick(slots);
    const role = k === 'v' ? 'vanguard' : k === 'a' ? 'assaulter' : 'supporter';
    const cur = ids();
    let x; do { x = pick(POOL[role]); } while (cur.includes(x));
    const old = k === 'v' ? g.v : g[k][i];
    if (k === 'v') g.v = x; else g[k][i] = x;
    g.nat[x] = g.nat[old]; delete g.nat[old];
    g.eq[x] = g.eq[old]; delete g.eq[old];
  } else if (r < 0.75) { // change une nature
    g.nat[pick(ids())] = pick(NATURE_LIST);
  } else if (r < 0.85) { g.mainType = g.mainType === 'magic' ? 'physical' : 'magic'; }
  else { // change la composition : un poste contre un autre
    const roles = [];
    if (g.v) roles.push('v'); if (g.a.length) roles.push('a'); if (g.s.length) roles.push('s');
    const from = pick(roles);
    const to = pick(['v', 'a', 's'].filter((x) => x !== from && (x === 'v' ? !g.v : g[x].length < (x === 'a' ? 2 : 3))));
    if (!to) return g;
    let old; if (from === 'v') { old = g.v; g.v = null; } else old = g[from].splice(Math.floor(rnd() * g[from].length), 1)[0];
    const role = to === 'v' ? 'vanguard' : to === 'a' ? 'assaulter' : 'supporter';
    let x; do { x = pick(POOL[role]); } while (ids().includes(x));
    if (to === 'v') g.v = x; else g[to].push(x);
    g.nat[x] = g.nat[old]; delete g.nat[old];
    g.eq[x] = g.eq[old]; delete g.eq[old];
  }
  return g;
}

let pop = Array.from({ length: POP }, () => forceIn(randomGenome()));
const hall = [];
// RESUME=1 : reprend depuis le fichier OUT d'une recherche interrompue (meilleures formations et nombre de générations faites).
let gen0 = 1;
if (process.env.RESUME && existsSync(OUT)) {
  const prev = JSON.parse(readFileSync(OUT, 'utf8'));
  hall.push(...prev.hall);
  gen0 = (prev.gen || 0) + 1;
  const seen = new Set(prev.pop.map(key));
  pop = [...prev.pop];
  while (pop.length < POP) { const c = forceIn(mutate(pop[Math.floor(rnd() * prev.pop.length)])); if (!seen.has(key(c))) { seen.add(key(c)); pop.push(c); } }
  seed += gen0 * 7919;
  console.log(`reprise à la génération ${gen0}`);
}
const t0 = Date.now();
for (let gen = gen0; gen <= GENS; gen++) {
  // MODE=meta : les formations sont jugées uniquement contre les formations de référence (le méta actuel du jeu)
  const opponents = process.env.MODE === 'meta' ? REFERENCE
    : [...REFERENCE, ...hall.slice(-12), ...Array.from({ length: Math.max(3, 15 - hall.length) }, randomGenome)];
  const scores = await Promise.all(pop.map((c, i) => evalCand(c, opponents, N, gen * 100000 + i * 7).then((r) => r.reduce((a, b) => a + b, 0) / r.length)));
  const ranked = pop.map((g, i) => ({ g, s: scores[i] })).sort((a, b) => b.s - a.s);
  if (!hall.length || key(hall[hall.length - 1]) !== key(ranked[0].g)) hall.push(ranked[0].g);
  console.log(`gén ${gen} (${Math.round((Date.now() - t0) / 1000)} s) meilleur ${(ranked[0].s * 100).toFixed(0)} % : ${describe(ranked[0].g)}`);
  const elite = ranked.slice(0, Math.floor(POP / 4)).map((x) => x.g);
  const seen = new Set(elite.map(key));
  const next = [...elite];
  while (next.length < POP) {
    const child = forceIn(rnd() < 0.15 ? randomGenome() : mutate(rnd() < 0.3 ? mutate(pick(elite)) : pick(elite)));
    if (!seen.has(key(child))) { seen.add(key(child)); next.push(child); }
  }
  pop = next;
  writeFileSync(OUT, JSON.stringify({ hall, pop: elite, gen }, null, 1));
}
await Promise.all(workers.map((w) => w.terminate()));
