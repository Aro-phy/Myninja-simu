// Choix des sets d'équipement et d'accessoires pour une formation : un ninja à la fois, chaque set essayé
// (6 pièces de l'équipement, 8 pièces des accessoires), le meilleur gardé ; deux passages.
import { Worker } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { GEAR_SETS, ACCESSORY_SETS, equipmentEntries, slotsToChoice } from '../../equipment.js';
import { describe, byId } from './common.mjs';

const { table } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const which = (process.env.WHICH || '0,1,2').split(',').map(Number);
const N = Number(process.env.N || 16);
const workers = Array.from({ length: 4 }, () => new Worker(new URL('./worker.mjs', import.meta.url)));
let jobId = 0; const pending = new Map(); let rr = 0;
for (const w of workers) w.on('message', (m) => { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(m.error)) : p.resolve(m.rates); });
const evalCand = (cand, pool, n, seed) => new Promise((resolve, reject) => {
  const id = jobId++; pending.set(id, { resolve, reject }); workers[rr++ % 4].postMessage({ id, cand, pool, n, seed });
});
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
// seuls les sets avec un effet en combat (pas uniquement des stats de l'écran) changent quelque chose
const useful = (sets, kind) => sets.filter((s) => {
  const e = equipmentEntries(slotsToChoice(kind === 'gear' ? { gear: Array(6).fill(s.id) } : { acc: Array(8).fill(s.id) }));
  return e.some((x) => (x.talents || []).some((t) => t.on || (t.mods || []).some((m) => !['hp', 'atk', 'patk', 'matk', 'def', 'pdef', 'mdef', 'dr', 'air', 'hit', 'dodge', 'crit', 'antiCrit', 'sAtk', 'block', 'punch', 'extraTurn', 'aid', 'speed'].includes(m.stat)) || (t.to && t.to !== 'self')));
}).map((s) => s.id);
const GEAR = useful(GEAR_SETS, 'gear'), ACC = useful(ACCESSORY_SETS, 'acc');
console.log(`${GEAR.length} équipements et ${ACC.length} accessoires avec des effets en combat`);

const out = [];
for (const idx of which) {
  const g = structuredClone(table[idx].g);
  const opponents = table.filter((_, j) => j !== idx).map((x) => x.g);
  g.eq = {};
  const ids = ['main', g.v, ...g.a, ...g.s].filter(Boolean);
  let best = mean(await evalCand(g, opponents, N, 4242));
  console.log(`\n${describe(g)}\n  sans équipement : ${(best * 100).toFixed(1)} %`);
  for (let pass = 0; pass < 2; pass++) {
    for (const id of ids) {
      for (const kind of ['gear', 'acc']) {
        const opts = kind === 'gear' ? GEAR : ACC;
        const tries = await Promise.all(opts.map((sid) => {
          const c = structuredClone(g); c.eq[id] = { ...(c.eq[id] || {}), [kind]: sid };
          return evalCand(c, opponents, N, 4242).then((r) => ({ sid, s: mean(r) }));
        }));
        tries.sort((a, b) => b.s - a.s);
        if (tries[0].s > best + 0.005) { g.eq[id] = { ...(g.eq[id] || {}), [kind]: tries[0].sid }; best = tries[0].s; }
      }
    }
    console.log(`  passage ${pass + 1} : ${(best * 100).toFixed(1)} %`);
  }
  for (const id of ids) console.log(`   ${id === 'main' ? 'Perso principal' : byId[id].name} : ${g.eq[id]?.gear || '—'} / ${g.eq[id]?.acc || '—'}`);
  out.push({ idx, g, s: best });
}
writeFileSync(process.env.OUT || 'meta-equip.json', JSON.stringify(out, null, 1));
await Promise.all(workers.map((w) => w.terminate()));
