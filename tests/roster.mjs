// Chaque ninja (éveil max) joue dans une formation complète contre une formation tirée au hasard : détecte les erreurs de données.
import { simulate, validateTeam } from '../engine.js';
import { NINJAS, SAMPLE_STATS } from '../data.js';
import { mulberry32 } from '../engine.js';
const rng = mulberry32(7);
const pickN = (arr, n) => [...arr].sort(() => rng() - 0.5).slice(0, n);
const by = (r) => NINJAS.filter((n) => n.role === r && !n.isMain);
const natures = ['water', 'fire', 'earth', 'thunder', 'wind', 'none'];
const stats = { ...SAMPLE_STATS, air: 460 };
const team = (name, forced) => {
  const v = forced?.role === 'vanguard' ? forced : pickN(by('vanguard'), 1)[0];
  let as = pickN(by('assaulter'), 2), su = pickN(by('supporter'), 2);
  if (forced?.role === 'assaulter') as = [forced, ...as.filter((x) => x !== forced)].slice(0, 2);
  if (forced?.role === 'supporter') su = [forced, ...su.filter((x) => x !== forced)].slice(0, 2);
  const nat = () => natures[Math.floor(rng() * natures.length)];
  return { name, members: [
    { ninja: v, pos: 0, stats: { ...stats, hp: 150e6 }, nature: nat() },
    ...as.map((n, i) => ({ ninja: n, pos: i, stats, nature: nat() })),
    ...su.map((n, i) => ({ ninja: n, pos: i, stats, nature: nat() })),
  ] };
};
let n = 0, err = 0, timeouts = 0;
for (const ninja of NINJAS.filter((x) => !x.isMain)) {
  for (let k = 0; k < 6; k++) {
    const A = team('A', ninja), B = team('B');
    if (validateTeam(A).length || validateTeam(B).length) throw new Error('formation invalide');
    try { const r = simulate(A, B, { seed: n }); if (r.timeout) timeouts++; }
    catch (e) { err++; console.log('ERREUR', ninja.id, e.stack.split('\n').slice(0, 3).join(' | ')); }
    n++;
  }
}
console.log(`${NINJAS.length - 1} ninjas, ${n} combats, ${err} erreur(s), ${timeouts} combat(s) jusqu'à la limite de rounds`);
process.exit(err ? 1 : 0);
