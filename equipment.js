// Équipements (sets de 6 pièces : bonus à 2, 4 et 6 pièces) et accessoires (4 paires + bonus à 8 pièces).
// Les bonus de stats visibles à l'écran du ninja (PV, attaque, Dégâts, Absorption, défenses…) sont déjà
// dans les stats saisies : le moteur les ignore (règle « selfStatsInPanel »). Les autres s'appliquent en combat.
import { ALLIES, ALLIES_BUT_SELF, ENEMIES, SELF, rand, role, m, buff, debuff, st } from './ninjas/helpers.js';

const self = (...mods) => ({ to: SELF, mods });
const attacked = (chance, ...effects) => ({ on: 'attacked', ...(chance < 100 ? { chance } : {}), effects });
const afterSkill = (...effects) => ({ on: 'skill', effects });

export const GEAR_SETS = [
  {
    id: 'gear-yin-yang', name: 'Équipement Yin-Yang (nom à confirmer)',
    tiers: {
      2: [self(m('atk', 20), m('dr', 30))], // + Agilité 25 000
      4: [
        self(m('matk', 15), m('finalDmg', 20)),
        afterSkill(debuff(role('enemy', 'assaulter'), 2, [m('dr', -30)]), st(ALLIES_BUT_SELF, 'windEscape', 2, { value: 10 })),
      ],
      6: [
        self(m('atk', 20), m('dr', 20), m('ignoreEnemyAtk', 30)), // + Agilité 35 000
        afterSkill(st(SELF, 'shielding', 2), st(rand('enemy', 3), 'armorBreak', 2, { value: 30 })),
      ],
    },
  },
];

export const ACCESSORY_SETS = [
  {
    id: 'acc-yin-yang', name: 'Accessoires Yin-Yang (nom à confirmer)',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('hp', 40)), attacked(100, st(rand('ally', 2), 'strong', 2, { value: 20 }))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('finalReduction', 40)), attacked(100, st(rand('ally', 2), 'superDefense', 2, { value: 20 }))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('air', 50)), attacked(35, { to: rand('enemy', 3), cleanse: 'buff' })] },
      { id: 'power', name: 'Puissance', talents: [self(m('def', 50)),
        attacked(100, debuff(role('enemy', 'assaulter'), 2, [m('crit', -30)], 'Critique −30 % (non dissipable)'))] },
    ],
    full: [self(m('ignoreEnemyAtk', 32))],
  },
];

const gearById = Object.fromEntries(GEAR_SETS.map((g) => [g.id, g]));
const accById = Object.fromEntries(ACCESSORY_SETS.map((a) => [a.id, a]));

// Convertit les choix d'un ninja ({ gear: { set: pièces }, acc: { set: [paires] } }) en entrées pour le moteur.
export function equipmentEntries(choice = {}) {
  const out = [];
  for (const [id, pieces] of Object.entries(choice.gear || {})) {
    const g = gearById[id];
    if (!g || !pieces) continue;
    const talents = [2, 4, 6].filter((t) => pieces >= t).flatMap((t) => g.tiers[t] || []);
    out.push({ name: `${g.name} (${pieces} pièces)`, talents });
  }
  for (const [id, pairs] of Object.entries(choice.acc || {})) {
    const a = accById[id];
    if (!a || !pairs?.length) continue;
    const talents = a.pairs.filter((p) => pairs.includes(p.id)).flatMap((p) => p.talents);
    if (pairs.length >= a.pairs.length) talents.push(...a.full);
    out.push({ name: `${a.name} (${pairs.length * 2} pièces)`, talents });
  }
  return out;
}

export function checkEquipment(choice = {}) {
  const errors = [];
  const pieces = Object.values(choice.gear || {}).reduce((s, n) => s + (n || 0), 0);
  const pairs = Object.values(choice.acc || {}).reduce((s, p) => s + (p?.length || 0), 0);
  if (pieces > 6) errors.push(`${pieces} pièces d'équipement (6 maximum).`);
  if (pairs > 4) errors.push(`${pairs} paires d'accessoires (4 maximum).`);
  return errors;
}
