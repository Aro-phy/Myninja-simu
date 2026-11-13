// Un paquet de combats pour l'optimisation : formation A (emplacements) contre une formation adverse, avec des
// ninjas retirés de chaque côté (optimisation en cascade) et une vitesse adverse qui varie un peu à chaque combat,
// pour qu'un écart de vitesse minuscule ne décide pas tout. Utilisé par les workers et, à défaut, par la page.
import { simulate, mulberry32 } from './engine.js';
import { toTeam } from './team.js';

const without = (team, remove) => (remove?.length ? { ...team, members: team.members.filter((m) => !remove.includes(m.ninja.id)) } : team);

// job : { A, removeA, B, removeB, n, seed, i0, rules, jitter } → { w, r, n } (victoires de A, rounds cumulés)
export function runJob({ A, removeA, B, removeB, n, seed, i0 = 0, rules, jitter = 0.03 }) {
  const TA = without(toTeam({ name: 'A', slots: A }), removeA);
  const TB0 = without(toTeam({ name: 'B', slots: B }), removeB);
  if (!TA.members.length) return { w: 0, r: 0, n };
  if (!TB0.members.length) return { w: n, r: 0, n };
  let w = 0, r = 0;
  for (let i = 0; i < n; i++) {
    const k = i0 + i, s = seed + k;
    const jit = jitter ? jitter * (2 * mulberry32(s * 7 + 1)() - 1) : 0;
    const TB = jit ? { ...TB0, members: TB0.members.map((m) => ({ ...m, stats: { ...m.stats, speed: (m.stats.speed || 0) * (1 + jit) } })) } : TB0;
    const first = k % 2 === 0; // on alterne qui est l'équipe A du moteur
    const res = first ? simulate(TA, TB, { seed: s, log: false, rules }) : simulate(TB, TA, { seed: s, log: false, rules });
    const us = first ? 0 : 1;
    if (res.winner === us) w++; else if (res.winner == null) w += 0.5;
    r += res.rounds;
  }
  return { w, r, n };
}
