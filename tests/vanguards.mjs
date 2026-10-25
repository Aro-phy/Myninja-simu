// Fait combattre chaque avant-garde (éveil max) contre chaque autre, avec les mêmes stats, pour détecter les erreurs.
import { simulate } from '../engine.js';
import { NINJAS, SAMPLE_STATS } from '../data.js';
const vg = NINJAS.filter((n) => n.role === 'vanguard');
const ex = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const team = (v, name) => ({ name, members: [
  { ninja: v, pos: 0, stats: { ...SAMPLE_STATS, hp: 120e6, air: 460 }, nature: 'water' },
  { ninja: ex['ex-assaulter'], pos: 0, stats: { ...SAMPLE_STATS, air: 460 }, nature: 'fire' },
  { ninja: ex['ex-assassin'], pos: 1, stats: { ...SAMPLE_STATS, air: 460 }, nature: 'wind' },
  { ninja: ex['ex-healer'], pos: 0, stats: { ...SAMPLE_STATS, air: 460 }, nature: 'earth' },
  { ninja: ex['ex-controller'], pos: 1, stats: { ...SAMPLE_STATS, air: 460 }, nature: 'thunder' },
] });
let n = 0, errors = 0;
const wins = Object.fromEntries(vg.map((v) => [v.id, 0]));
for (const a of vg) for (const b of vg) {
  if (a === b) continue;
  try {
    const r = simulate(team(a, 'A'), team(b, 'B'), { seed: n, log: n < 3 });
    if (r.winner === 0) wins[a.id]++; else if (r.winner === 1) wins[b.id]++;
    if (n === 0) console.log(r.log.slice(0, 40).map((l) => l.text).join('\n'));
  } catch (e) { errors++; console.log('ERREUR', a.id, b.id, e.stack); if (errors > 3) process.exit(1); }
  n++;
}
console.log(`${vg.length} avant-gardes, ${n} combats, ${errors} erreur(s)`);
console.log(Object.entries(wins).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}:${v}`).join('  '));
