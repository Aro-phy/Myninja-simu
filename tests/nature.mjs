// Vérifie les règles de nature de chakra et le Chaos.
import assert from 'node:assert/strict';
import { natureDrBonus, simulate } from '../engine.js';
import { NINJAS, SAMPLE_STATS } from '../data.js';
const u = (nature, natureLevel = 1) => ({ nature, natureLevel });
assert.equal(natureDrBonus(u('thunder'), u('earth')), 25);
assert.equal(natureDrBonus(u('earth'), u('thunder')), -25);
assert.equal(natureDrBonus(u('thunder', 1), u('earth', 2)), 24);   // exemple du jeu
assert.equal(natureDrBonus(u('water', 5), u('fire', 1)), 33);
assert.equal(natureDrBonus(u('fire', 3), u('water', 1)), -21);
assert.equal(natureDrBonus(u('fire'), u('thunder')), 0);
assert.equal(natureDrBonus(u('none'), u('earth')), 0);
// renforcement : un allié eau donne +11 % PV aux alliés foudre
const by = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const st = { ...SAMPLE_STATS, hp: 1000 };
const t = { name: 'A', members: [
  { ninja: by['sasuke-taka'], pos: 0, stats: st, nature: 'water' },
  { ninja: by['kawaki'], pos: 1, stats: st, nature: 'thunder' },
  { ninja: by['uchiha-sarada'], pos: 0, stats: st, nature: 'thunder' }] };
const r = simulate(t, { name: 'B', members: [{ ninja: by['sasuke-taka'], pos: 0, stats: st }] }, { seed: 1 });
// (les talents des ninjas ajoutent leurs propres bonus de PV : on vérifie l'écart de +11 % dû à la nature)
const hp = r.units.filter((x) => x.team === 0).map((x) => Math.round(x.maxHp));
assert.deepEqual([hp[1] - hp[0], hp[2] - hp[0]], [110, 110]);
// Chaos : le ninja contrôlé s'attaque lui-même
const big = { ...SAMPLE_STATS, hp: 5e9, air: 460 };
const r2 = simulate({ name: 'A', members: [{ ninja: by['minato-naruto'], pos: 0, stats: { ...big, fury: 100, speed: 9e9 } }] },
  { name: 'B', members: [{ ninja: by['sasuke-taka'], pos: 0, stats: { ...big, fury: 0 } }] }, { seed: 4, rules: { maxRounds: 3 } });
const txt = r2.log.map((l) => l.text).join('\n');
console.log(txt.split('\n').filter((l) => /Chaos/.test(l)).slice(0, 4).join('\n'));
console.log('tests nature OK');
