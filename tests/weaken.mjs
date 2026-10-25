// « Weaken enemy's DEF » (attaquant) contre « Weaken enemy's ATK » (cible) : seule la différence compte.
import assert from 'node:assert/strict';
import { simulate } from '../engine.js';
import { NINJAS, SAMPLE_STATS } from '../data.js';
const by = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const st = { ...SAMPLE_STATS, hp: 5e9, air: 460, hit: 999, crit: 0, block: 0, fury: 0 };
const gear = (stat, value) => [{ name: 'test', talents: [{ to: 'self', mods: [{ stat, value }] }] }];
const firstHit = (eqA, eqB) => {
  const r = simulate({ name: 'A', members: [{ ninja: by['toad-sage'], pos: 0, stats: { ...st, speed: 9e9 }, equipment: eqA }] },
    { name: 'B', members: [{ ninja: by['toad-sage'], pos: 0, stats: st, equipment: eqB }] }, { seed: 1, rules: { maxRounds: 1 } });
  return r.log.find((l) => l.type === 'hit').amount;
};
const base = firstHit([], []);
const def30 = firstHit(gear('weakenDef', 30), []);
const atk30 = firstHit([], gear('weakenAtk', 30));
const both = firstHit(gear('weakenDef', 30), gear('weakenAtk', 30));
const net10 = firstHit(gear('weakenDef', 40), gear('weakenAtk', 30));
assert.ok(def30 > base && atk30 < base, 'chaque bonus agit seul');
assert.equal(Math.round(both), Math.round(base), '30 contre 30 : aucun effet');
assert.ok(net10 > base && net10 < def30, '40 contre 30 : comme 10 % de défense en moins');
// La résistance à l'ignore défense ne réduit pas « Weaken enemy's DEF »
const resist = firstHit(gear('weakenDef', 30), [{ name: 'r', talents: [{ to: 'self', mods: [{ stat: 'immuneIgnoreDef', value: 50 }] }] }]);
assert.equal(Math.round(resist), Math.round(def30));
console.log('test Weaken OK', { base: Math.round(base), def30: Math.round(def30), atk30: Math.round(atk30), net10: Math.round(net10) });
