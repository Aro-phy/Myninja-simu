// Les deux formations de la vidéo (Lava X1 contre Skalypan), pour comparer au résultat réel.
import { simulate, simulateMany, validateTeam, inspect } from '../engine.js';
import { NINJAS } from '../data.js';
import { equipmentEntries, slotsToChoice } from '../equipment.js';
const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const S = (hp, patk, matk, pdef, mdef, speed, fury, dr, air, hit, dodge, crit, antiCrit, sAtk, block, extraTurn, aid) =>
  ({ hp, patk, matk, pdef, mdef, speed, fury, dr, air, hit, dodge, crit, antiCrit, sAtk, block, extraTurn, aid });
const eq = (gear, acc) => equipmentEntries(slotsToChoice({ gear: gear.map((g) => `gear-${g}`), acc: acc.flatMap((a) => [`acc-${a}`, `acc-${a}`]) }));
const g6 = (s) => Array(6).fill(s);
const mk = (id, pos, stats, equipment, o = {}) => ({ ninja: byId[id], pos, stats, equipment, natureLevel: 1, nature: 'none', ...o });
const over = JSON.parse(process.env.OVER || '{}'); // corrections à tester : { "lava-hm": { patk: ... } }
const fix = (key, st) => ({ ...st, ...(over[key] || {}) });

export const LAVA = { name: 'Lava X1', members: [
  mk('warrior-sakura', 0, fix('lava-sakura', S(65870148, 45887220, 0, 10612755, 6982662, 14144340, 106, 508.4, 320.7, 323.2, 56.1, 110, 90, 125, 90, 52, 52)),
    eq(['arcane', 'arcane', 'moonlit', 'moonlit', 'arcane', 'arcane'], ['warlord', 'warlord', 'warlord', 'warlord']), { nature: 'water', natureLevel: 2, awakening: 1 }),
  mk('main', 0, fix('lava-main', S(51927584, 9476371, 0, 10391625, 9321000, 8321000, 50, 319.4, 383.2, 248.5, 168.4, 70.8, 67, 90, 7, 25, 47.5)),
    eq(['guard', 'guard', 'longen', 'longen', 'senju', 'senju'], ['sakura', 'sakura', 'sakura', 'sakura']), { attackType: 'physical' }),
  mk('hashirama-madara', 1, fix('lava-hm', S(89458592, 14252756, 0, 8929956, 6691507, 12847793, 104, 384.4, 347.2, 316.5, 104.6, 90, 90, 90, 90, 45, 39.5)),
    eq(g6('vylon'), ['butterfly', 'guard', 'guard', 'moonlit']), { nature: 'water', natureLevel: 2, awakening: 1 }),
  mk('kamado-nezuko', 0, fix('lava-nezuko', S(69045936, 0, 10065135, 7933432, 6251527, 23397840, 104, 319.4, 324.2, 282.2, 105.2, 90, 90, 90, 90, 88, 47.5)),
    eq(g6('infernity'), ['reanimated', 'pain', 'izanami', 'warlord']), { nature: 'water', natureLevel: 2, awakening: 1 }),
  mk('uchiha-sarada', 1, fix('lava-sarada', S(81502576, 0, 12641142, 6101383, 7601828, 15156390, 101, 394.4, 393.2, 283, 94, 90, 90, 90, 90, 87, 71.5)),
    eq(g6('warlord'), ['arcane', 'moonlit', 'yaksa', 'arcane']), { nature: 'water', natureLevel: 2, awakening: 1 }),
] };
export const SKALYPAN = { name: 'Skalypan', members: [
  mk('uchiha-sarada', 0, fix('sk-sarada', S(105941512, 0, 13715390, 5384584, 8530956, 25714858, 100, 330, 388.1, 324.6, 45.9, 90, 0, 90, 33.3, 83.1, 51.1)),
    eq(g6('infernity'), ['black-feather', 'black-feather', 'yaksa', 'black-feather']), { nature: 'thunder', natureLevel: 3, awakening: 1 }),
  mk('uzumaki-menma', 1, fix('sk-menma', S(139656272, 0, 12402791, 10455001, 17029720, 19566648, 100, 318, 328.1, 318, 40.3, 79.7, 90, 90, 69.9, 60.1, 46.6)),
    eq(g6('meka'), ['sakura', 'sakura', 'sakura', 'sakura']), { nature: 'earth', natureLevel: 3, awakening: 1 }),
  mk('main', 0, fix('sk-main', S(92328896, 0, 9795980, 29292136, 38997668, 13021616, 50, 342, 274.6, 291.4, 24.7, 90, 90, 90, 79.8, 36.1, 35.6)),
    eq(g6('pain'), ['flamvell', 'flamvell', 'flamvell', 'flamvell']), { attackType: 'magic' }),
  mk('hashirama-madara', 1, fix('sk-hm', S(75271688, 27335854, 0, 13690092, 8280378, 16981528, 100, 387, 345.6, 331.2, 10.7, 35.4, 90, 90, 90, 36.1, 42.6)),
    eq(g6('vylon'), ['green', 'mekansm', 'arcane', 'defiance']), { nature: 'water', natureLevel: 3, awakening: 1 }),
  mk('premier-hokage', 2, fix('sk-shodai', S(172874816, 20970576, 0, 29921104, 17858588, 17205918, 100, 364, 272.6, 338.4, 13.4, 90, 0, 90, 6.4, 36.1, 43.6)),
    eq(g6('pain'), ['pain', 'sunfire', 'moonlit', 'moonlit']), { nature: 'earth', natureLevel: 3, awakening: 3 }),
] };

if (process.argv[1].endsWith('lava-skalypan.mjs')) {
  console.log(validateTeam(LAVA), validateTeam(SKALYPAN));
  const n = Number(process.env.N || 1000);
  const r1 = simulateMany(LAVA, SKALYPAN, n, { seed: 1 });
  const r2 = simulateMany(SKALYPAN, LAVA, n, { seed: 2 });
  console.log('Lava en A :', JSON.stringify(r1).slice(0, 300));
  console.log('Lava en B :', JSON.stringify(r2).slice(0, 300));
  if (process.env.LOG) {
    const r = simulate(LAVA, SKALYPAN, { seed: Number(process.env.LOG) });
    console.log(r.log.map((l) => l.text).join('\n'));
  }
}
