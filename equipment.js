// Équipements (sets de 6 pièces : bonus à 2, 4 et 6 pièces) et accessoires (4 paires + bonus à 8 pièces).
// « Weaken enemy's ATK +X % » (weakenAtk) et « Weaken enemy's DEF +X % » (weakenDef) : bonus permanents qui s'opposent.
// Quand le porteur frappe, net = son weakenDef − weakenAtk de la cible : si positif, la défense de la cible baisse de net %,
// sinon l'attaque du porteur baisse de −net %. Non affectés par la résistance à l'ignore défense.
// Les bonus de stats visibles à l'écran du ninja (PV, attaque, Dégâts, Absorption, défenses…) sont déjà
// dans les stats saisies : le moteur les ignore (règle « selfStatsInPanel »). Les autres s'appliquent en combat.
import { ALLIES, ALLIES_BUT_SELF, ENEMIES, SELF, rand, role, m, buff, debuff, st } from './ninjas/helpers.js';

const self = (...mods) => ({ to: SELF, mods });
const attacked = (chance, ...effects) => ({ on: 'attacked', ...(chance < 100 ? { chance } : {}), effects });
const afterSkill = (...effects) => ({ on: 'skill', effects });
// Les buffs posés par un équipement ou un accessoire sont dissipables (sauf mention contraire).
const C = { cleansable: true };
// Un seul tirage pour tout le groupe (« X % de chance de faire entrer 2 ... »).
const together = (chance, ...effects) => ({ chance, oneOf: [effects] });
// Vocabulaire des descriptions :
//   « Decrease the success rate of enemy's control skills » / « Decrease CC Rate » → résistance au contrôle (ccRes)
//   « Increase the success rate of control skills » / « Increase CC Rate »        → taux de contrôle (ccRate)
//   « Bonus damage after attack »                                                  → dégâts finaux (finalDmg)
//   « Damage taken reduction »                                                     → réduction des dégâts finaux (finalReduction)
//   « Weaken enemy's DEF » / « Weaken enemy's ATK »                               → weakenDef / weakenAtk (voir plus haut)

export const GEAR_SETS = [
  {
    id: 'gear-gold', name: 'Équipement doré (nom à confirmer)',
    tiers: {
      2: [self(m('hp', 35), m('punch', 30), m('def', 30))],
      4: [
        self(m('ccRate', 40), m('air', 30)), // + Agilité 30 000
        afterSkill(st(rand('enemy', 1), 'untreatment', 2)),
      ],
      6: [
        self(m('ccRate', 15), m('weakenAtk', 33), m('finalReduction', 35)), // + Agilité 40 000
        afterSkill(st(role('ally', 'supporter'), 'shatterStorm', 2, { value: 10, ...C }), { to: role('ally', 'supporter'), heal: 40 }),
      ],
    },
  },
  {
    id: 'gear-tarrasque', name: 'Tarrasque',
    tiers: {
      2: [self(m('dr', 40)), afterSkill(debuff(ENEMIES, 2, [m('air', -30)]))],
      4: [self(m('atk', 30)), afterSkill(st(rand('enemy', 1), 'upwind', 2))], // + Agilité 25 000
      6: [
        self(m('weakenAtk', 30), m('weakenDef', 35)), // + Agilité 30 000
        afterSkill(together(60, st(role('ally', 'assaulter'), 'acceleration', 2, { value: 15, cleansable: false }))),
      ],
    },
  },
  {
    id: 'gear-akatsuki', name: 'Équipement Akatsuki (nom à confirmer)',
    tiers: {
      2: [self(m('atk', 15), m('finalDmg', 15), m('dr', 20))], // + Agilité 15 000
      4: [self(m('atk', 20), m('punch', 20), m('weakenDef', 25))], // + Agilité 20 000
      6: [
        self(m('atk', 15), m('weakenAtk', 30), m('dr', 30)), // + Agilité 25 000
        afterSkill({ to: ENEMIES, penetration: 50, attackType: 'physical' }),
      ],
    },
  },
  {
    id: 'gear-baryon', name: 'Baryon',
    tiers: {
      2: [self(m('atk', 20), m('dr', 20))], // + Agilité / Force 25 000
      4: [
        self(m('finalDmg', 20), m('weakenAtk', 30)), // + Agilité / Force 35 000
        afterSkill(st(rand('ally', 1), 'superarmor', 2, { chance: 50, ...C })),
      ],
      6: [
        self(m('atk', 20), m('ccRes', 25), m('dr', 10), m('finalDmg', 10)),
        afterSkill(together(75, st(rand('enemy', 2), 'chaoticStorm', 2))),
      ],
    },
  },
  {
    id: 'gear-black-feather', name: 'Black Feather',
    tiers: {
      2: [self(m('hp', 30), m('punch', 30), m('air', 30))],
      4: [
        self(m('ccRate', 40), m('hp', 30)), // + Agilité 25 000
        afterSkill({ to: ALLIES, heal: 40, attackType: 'physical' }),
      ],
      6: [
        self(m('ccRate', 15), m('weakenAtk', 33), m('finalReduction', 40)), // + Agilité 35 000
        afterSkill(together(35, st(rand('ally', 2), 'shielding', 2, C))),
      ],
    },
  },
  {
    id: 'gear-yin-yang', name: 'Équipement Yin-Yang (nom à confirmer)',
    tiers: {
      2: [self(m('atk', 20), m('dr', 30))], // + Agilité 25 000
      4: [
        self(m('matk', 15), m('finalDmg', 20)),
        afterSkill(debuff(role('enemy', 'assaulter'), 2, [m('dr', -30)]), st(ALLIES_BUT_SELF, 'windEscape', 2, { value: 10, ...C })),
      ],
      6: [
        self(m('atk', 20), m('dr', 20), m('weakenAtk', 30)), // + Agilité 35 000
        afterSkill(st(SELF, 'shielding', 2, C), st(rand('enemy', 3), 'armorBreak', 2, { value: 30 })),
      ],
    },
  },
];

export const ACCESSORY_SETS = [
  {
    id: 'acc-tarrasque', name: 'Accessoires Tarrasque (nom à confirmer)',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('dr', 30), m('weakenDef', 30))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('atk', 30), m('weakenDef', 25))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('finalDmg', 30), m('weakenDef', 30))] },
      { id: 'power', name: 'Puissance', talents: [self(m('atk', 30), m('weakenDef', 25))] },
    ],
    full: [self(m('dr', 25), m('finalDmg', 25), m('weakenAtk', 25))],
  },
  {
    id: 'acc-akatsuki', name: 'Accessoires Akatsuki (nom à confirmer)',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('finalDmg', 30), m('weakenDef', 30))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('atk', 30), m('weakenDef', 25))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('dr', 30), m('weakenDef', 30))] },
      { id: 'power', name: 'Puissance', talents: [self(m('atk', 20), m('dr', 30), m('punch', 15))] },
    ],
    full: [
      self(m('finalDmg', 30), m('weakenAtk', 25), m('patk', 15)),
      afterSkill({ to: { side: 'enemy', pick: 'lowest-air' }, strike: 60, attackType: 'physical' }),
    ],
  },
  {
    id: 'acc-baryon', name: 'Accessoires Baryon (nom à confirmer)',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('ccRes', 30), m('dr', 40))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('ccRes', 30), m('atk', 30))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('ccRes', 30), m('weakenDef', 45), m('atk', 10))] },
      { id: 'power', name: 'Puissance', talents: [self(m('ccRes', 20), m('dr', 50))] },
    ],
    full: [self(m('weakenAtk', 25), m('finalDmg', 30)), afterSkill(st(rand('enemy', 3), 'painfulWill', 2))],
  },
  {
    id: 'acc-black-feather', name: 'Accessoires Black Feather (nom à confirmer)',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('ccRate', 30), m('hp', 35))] }, // + Force 30 000
      { id: 'chakra', name: 'Chakra', talents: [self(m('ccRate', 30), m('air', 10))] }, // + Agilité 30 000
      { id: 'agility', name: 'Agilité', talents: [self(m('finalReduction', 35)), afterSkill(st(rand('ally', 1), 'shatterStorm', 2, C))] }, // + Chakra 30 000
      { id: 'power', name: 'Puissance', talents: [self(m('ccRate', 30), m('weakenAtk', 15))] }, // + Puissance 30 000
    ],
    full: [self(m('ccRate', 20), m('weakenAtk', 10), m('hp', 30), m('air', 20))],
  },
  {
    id: 'acc-violet', name: 'Accessoires violets (nom à confirmer)',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('atk', 30)), afterSkill(st(rand('enemy', 1), 'upwind', 2))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('finalDmg', 35)), afterSkill(st(rand('ally', 1), 'pyroblast', 2, C))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('dr', 35)), afterSkill(st(rand('ally', 1), 'superarmor', 2, C))] },
      { id: 'power', name: 'Puissance', talents: [self(m('weakenAtk', 25)), afterSkill(st(rand('enemy', 1), 'corrosion', 2))] },
    ],
    full: [self(m('hp', 40), m('air', 30))],
  },
  {
    id: 'acc-yin-yang', name: 'Accessoires Yin-Yang (nom à confirmer)',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('hp', 40)), attacked(100, st(rand('ally', 2), 'strong', 2, { value: 20, ...C }))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('finalReduction', 40)), attacked(100, st(rand('ally', 2), 'superDefense', 2, { value: 20, ...C }))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('air', 50)), attacked(35, { to: rand('enemy', 3), cleanse: 'buff' })] },
      { id: 'power', name: 'Puissance', talents: [self(m('def', 50)),
        attacked(100, debuff(role('enemy', 'assaulter'), 2, [m('crit', -30)], 'Critique −30 % (non dissipable)'))] },
    ],
    full: [self(m('weakenAtk', 32))],
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
