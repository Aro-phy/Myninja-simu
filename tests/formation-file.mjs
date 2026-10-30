// Fichier d'échange de formation : export lisible puis relecture à l'identique.
import assert from 'node:assert/strict';
import { formationToFile, parseFormationFile, fileName } from '../formation-file.js';

const slots = {
  V0: { ninjaId: 'warrior-sakura', nature: 'water', natureLevel: 2, awakening: 1,
    stats: { hp: 65870148, atk: 45887220, pdef: 10612755, mdef: 6982662, speed: 14144340, fury: 106, dr: 508.4, air: 320.7, hit: 323.2, dodge: 56.1, crit: 110, antiCrit: 90, sAtk: 125, block: 90, extraTurn: 52, aid: 52 },
    equip: { gear: ['gear-arcane', 'gear-arcane', 'gear-moonlit', 'gear-moonlit', 'gear-arcane', 'gear-arcane'], acc: Array(8).fill('acc-warlord') } },
  A0: { ninjaId: 'main', attackType: 'physical', mainTalents: [{ side: 'ally', stat: 'atk', value: 20 }],
    stats: { hp: 51927584, atk: 9476371, pdef: 10391625, mdef: 9321000, speed: 8321000, fury: 50 },
    equip: { gear: ['gear-guard', 'gear-guard', 'gear-longen', 'gear-longen', 'gear-senju', 'gear-senju'], acc: Array(8).fill('acc-sakura') } },
  S1: { ninjaId: 'uchiha-sarada', nature: 'water', natureLevel: 2, awakening: 1, label: 'Ma Sarada',
    stats: { hp: 81502576, atk: 12641142 },
    equip: { gear: Array(6).fill('gear-warlord'), acc: ['acc-arcane', 'acc-arcane', 'acc-moonlit', 'acc-moonlit', 'acc-yaksa', 'acc-yaksa', null, null] } },
};
const file = formationToFile('Lava X1', slots);
const text = JSON.stringify(file, null, 2);
assert.equal(file.ninjas[0].ninja, 'Warrior Sakura');
assert.equal(file.ninjas[0].nature, 'Eau');
assert.equal(file.ninjas[0].stats.Vie, 65870148);
assert.equal(file.ninjas[0].equipement['Attaque physique'], 'Arcane');
assert.equal(file.ninjas[0].accessoires['Force 1'], 'Warlord [R1]');
assert.equal(file.ninjas[2].accessoires['Puissance 2'], null);
assert.equal(fileName('Lava X1'), 'formation-lava-x1.json');

const [back] = parseFormationFile(text);
assert.equal(back.name, 'Lava X1');
assert.deepEqual(back.warnings, []);
for (const [k, m] of Object.entries(slots)) {
  const b = back.slots[k];
  assert.ok(b, k);
  assert.equal(b.ninjaId, m.ninjaId);
  assert.deepEqual(b.stats, m.stats, k);
  assert.deepEqual(b.equip, { gear: m.equip.gear, acc: m.equip.acc.map((x) => x ?? null) }, k);
  if (m.nature) { assert.equal(b.nature, m.nature); assert.equal(b.natureLevel, m.natureLevel); }
  if (m.awakening != null) assert.equal(b.awakening, m.awakening);
}
assert.deepEqual(back.slots.A0.mainTalents, slots.A0.mainTalents);
assert.equal(back.slots.A0.attackType, 'physical');
assert.equal(back.slots.S1.label, 'Ma Sarada');

// fichier corrigé à la main : nom d'équipement en minuscules, set inconnu signalé
const edited = JSON.parse(text);
edited.ninjas[0].equipement['Vitesse'] = 'moonlit';
edited.ninjas[0].equipement['Puissance'] = 'Inexistant';
const [b2] = parseFormationFile(JSON.stringify(edited));
assert.equal(b2.slots.V0.equip.gear[4], 'gear-moonlit');
assert.equal(b2.slots.V0.equip.gear[5], null);
assert.equal(b2.warnings.length, 1);

// ancienne sauvegarde (liste copiée depuis « Copier la sauvegarde »)
const old = parseFormationFile(JSON.stringify([{ id: 'x', name: 'Ancienne', slots }]));
assert.equal(old[0].name, 'Ancienne');
assert.throws(() => parseFormationFile('{"a":1}'));
console.log('test fichier de formation OK');
