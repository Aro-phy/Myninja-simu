// Équipements (sets de 6 pièces : bonus à 2, 4 et 6 pièces) et accessoires (4 paires + bonus à 8 pièces).
// « Weaken enemy's ATK +X % » (weakenAtk) et « Weaken enemy's DEF +X % » (weakenDef) : bonus permanents qui s'opposent.
// Quand le porteur frappe, net = son weakenDef − weakenAtk de la cible : si positif, la défense de la cible baisse de net %,
// sinon l'attaque du porteur baisse de −net %. Non affectés par la résistance à l'ignore défense.
// Les bonus de stats visibles à l'écran du ninja (PV, attaque, Dégâts, Absorption, défenses…) sont déjà
// dans les stats saisies : le moteur les ignore (règle « selfStatsInPanel »). Les autres s'appliquent en combat.
import { GEAR_SETS_2, ACCESSORY_SETS_2 } from './equipment-extra.js';
import { ALLIES, ALLIES_BUT_SELF, ENEMIES, SELF, rand, role, nature, lowestHp, m, buff, debuff, st, fixed } from './ninjas/helpers.js';

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
//   « Immune Weaken DEF »   → immuneWeakenDef (annule le « Weaken enemy's DEF » adverse)
//   « Crit DMG »             → dégâts critiques (critDmg) ; Crit, S.Attack, Dodge, Avoid injury : stats de l'écran
//   « Weaken enemy's DEF » / « Weaken enemy's ATK »                               → weakenDef / weakenAtk (voir plus haut)

export const GEAR_SETS = [
  // ----- Sets lus dans la vidéo des fils Discord « gear-and-accessories » -----
  {
    id: 'gear-crystalys', name: 'Crystalys',
    tiers: {
      2: [self(m('atk', 20), m('dr', 15))],
      4: [self(m('atk', 20), m('finalDmg', 15)), afterSkill(st(role('ally', 'supporter'), 'strong', 2, { value: 10, ...C }))],
      6: [self(m('atk', 5), m('dr', 15), m('weakenAtk', 25)), afterSkill(st(role('enemy', 'assaulter'), 'chaoticStorm', 2, { value: 10 }))],
    },
  },
  {
    id: 'gear-defiance', name: 'Defiance',
    tiers: {
      2: [self(m('air', 30), m('hp', 30))],
      4: [self(m('finalReduction', 30), m('weakenAtk', 30))],
      6: [self(m('hp', 30), m('dodge', 30), m('ccRes', 25)),
        afterSkill(st(SELF, 'shielding', 2, C), st(rand('ally', 1), 'shielding', 2, { chance: 35, ...C }))],
    },
  },
  {
    id: 'gear-flamvell', name: 'Flamvell',
    tiers: {
      2: [self(m('atk', 20), m('air', 20))],
      4: [self(m('finalReduction', 25), m('weakenAtk', 30))],
      6: [self(m('atk', 20), m('ccRes', 25), m('dr', 25)), afterSkill({ to: ENEMIES, penetration: 50, attackType: 'physical' })],
    },
  },
  {
    id: 'gear-vylon', name: 'Vylon',
    tiers: {
      2: [self(m('hp', 30), m('air', 40))],
      4: [self(m('dr', 45), m('atk', 30)), afterSkill({ to: rand('enemy', 2), cleanse: 'buff' })],
      6: [self(m('weakenAtk', 30), m('air', 30)), afterSkill(together(70, st(role('ally', 'supporter'), 'superarmor', 2, C)))],
    },
  },
  {
    id: 'gear-izanami', name: 'Izanami',
    tiers: {
      2: [self(m('atk', 20), m('air', 20))],
      4: [self(m('air', 15), m('weakenDef', 30), m('weakenAtk', 30), m('ccRes', 15))],
      6: [self(m('immuneWeakenDef', 35), m('atk', 22), m('dr', 35), m('ccRes', 17)),
        afterSkill({ to: ENEMIES, penetration: 50, attackType: 'physical' })],
    },
  },
  {
    id: 'gear-iron-will', name: 'Iron Will',
    tiers: {
      2: [self(m('hp', 30), m('atk', 10), m('critDmg', 15))],
      4: [self(m('dr', 23), m('weakenAtk', 30), m('crit', 20))],
      6: [self(m('atk', 18), m('air', 30), m('ccRes', 25)), afterSkill(st(rand('ally', 1), 'strong', 2, { value: 20, ...C }))],
    },
  },
  {
    id: 'gear-sand-burial', name: 'Sand Burial',
    tiers: {
      2: [self(m('atk', 15), m('dr', 35), m('hp', 15))],
      4: [self(m('atk', 23), m('punch', 20), m('hp', 15), m('weakenDef', 20))],
      6: [self(m('atk', 7), m('weakenAtk', 32)), afterSkill(
        { to: nature('enemy', ['thunder', 'fire', 'earth']), strike: 50, attackType: 'physical' },
        { to: nature('enemy', 'water'), strike: 100, attackType: 'physical' })],
    },
  },
  {
    id: 'gear-branded', name: 'Branded',
    tiers: {
      2: [self(m('atk', 15), m('hp', 35))],
      4: [self(m('finalDmg', 30), m('weakenAtk', 30))],
      6: [self(m('atk', 20), m('ccRes', 25), m('immuneWeakenDef', 35)), afterSkill(st(SELF, 'superarmor', 2, C))],
    },
  },
  {
    id: 'gear-radiance', name: 'Radiance',
    tiers: {
      2: [self(m('finalDmg', 30), m('atk', 10), m('dr', 15))],
      4: [self(m('atk', 10), m('dr', 15)), afterSkill(st(rand('ally', 1), 'sSuperDodge', 2, { chance: 50, ...C }))],
      6: [self(m('atk', 10), m('dr', 20), m('weakenAtk', 30)), afterSkill(st(rand('ally', 1), 'superarmor', 2, C))],
    },
  },
  {
    id: 'gear-meka', name: 'Meka',
    tiers: {
      2: [self(m('air', 30), m('immuneWeakenDef', 40))],
      4: [self(m('def', 30), m('air', 30)), { to: SELF, immune: ['weakened'] }],
      6: [self(m('def', 30), m('hp', 50), m('weakenAtk', 30), m('ccRes', 20))],
    },
  },
  {
    id: 'gear-arcane', name: 'Arcane',
    tiers: {
      2: [self(m('sAtk', 35), m('dr', 30))],
      4: [self(m('crit', 20), m('atk', 40), m('dr', 40))],
      6: [self(m('finalDmg', 25), m('weakenAtk', 30)), afterSkill(st(rand('enemy', 1), 'charm', 2, { chance: 50 }))],
    },
  },
  {
    id: 'gear-butterfly', name: 'Butterfly',
    tiers: {
      2: [self(m('finalDmg', 20), m('atk', 13), m('dr', 20))],
      4: [self(m('atk', 15), m('dr', 20)), afterSkill(fixed(st(rand('enemy', 2), 'healReduction', 2, { value: 50 })))],
      6: [self(m('atk', 15), m('dr', 30), m('weakenAtk', 30)), afterSkill(together(80, st(rand('enemy', 2), 'upwind', 2)))],
    },
  },
  {
    id: 'gear-infernity', name: 'Infernity',
    tiers: {
      2: [self(m('hp', 20), m('punch', 30), m('air', 30))],
      4: [self(m('ccRate', 40), m('hp', 30)), afterSkill(st(rand('enemy', 1), 'forbidFury', 2, { chance: 90 }))],
      6: [self(m('ccRate', 10), m('weakenAtk', 33), m('air', 40)),
        afterSkill(together(30, st(role('ally', 'supporter'), 'shielding', 2, C)))],
    },
  },
  {
    id: 'gear-green', name: 'Sange',
    tiers: {
      2: [self(m('air', 30), m('hp', 40))], // + Chakra 40 000
      4: [
        self(m('def', 25), m('finalReduction', 36)), // + Agilité 40 000
        attacked(100, together(30, st(nature('enemy', 'water'), 'chaoticStorm', 2, { value: 8 }))),
      ],
      6: [
        self(m('def', 25), m('air', 15), m('weakenAtk', 33)), // + Puissance 80 000
        attacked(100, together(60, st(nature('ally', 'earth'), 'shatterStorm', 2, { value: 10, ...C }))),
      ],
    },
  },
  {
    id: 'gear-red', name: 'Summoning',
    tiers: {
      2: [self(m('hp', 25), m('air', 20))], // + Agilité / Chakra 25 000
      4: [
        self(m('ccRes', 15), m('air', 20)), // + Agilité / Chakra 35 000
        afterSkill(fixed(debuff(role('enemy', 'assaulter'), 2, [m('dr', -25)], 'Dégâts −25 % (non dissipable)'))),
      ],
      6: [
        self(m('weakenAtk', 30), m('ccRes', 20)), // + Puissance 80 000
        afterSkill(st(ALLIES, 'windEscape', 2, { value: 10, cleansable: false })),
      ],
    },
  },
  {
    id: 'gear-susano', name: 'Susano',
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
    id: 'gear-akatsuki', name: 'Truth-Seeking',
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
    id: 'gear-yin-yang', name: 'Yin-Yang',
    tiers: {
      2: [self(m('atk', 20), m('dr', 30))], // + Agilité 25 000
      4: [
        self(m('matk', 15), m('finalDmg', 10)),
        afterSkill(debuff(role('enemy', 'assaulter'), 2, [m('dr', -30)]), st(ALLIES_BUT_SELF, 'windEscape', 2, { value: 10, ...C })),
      ],
      6: [
        self(m('atk', 20), m('dr', 20), m('weakenAtk', 30)), // + Agilité 35 000
        afterSkill(st(SELF, 'shielding', 2, C), st(rand('enemy', 3), 'armorBreak', 2, { value: 30 })),
      ],
    },
  },
];


const p = (id, _unused, ...talents) => ({ id, name: { force: 'Force', chakra: 'Chakra', agility: 'Agilité', power: 'Puissance' }[id], talents });

export const ACCESSORY_SETS = [
  // ----- Sets lus dans la vidéo des fils Discord « gear-and-accessories » -----
  {
    id: 'acc-iron-will', name: 'Accessoires Iron Will',
    pairs: [
      p('force', 0, self(m('ccRes', 30), m('hp', 20)), afterSkill(st(rand('ally', 2), 'bond', 2, { value: 10, ...C }))),
      p('chakra', 0, self(m('ccRes', 30), m('mdef', 20), m('pdef', 20)), afterSkill(st(rand('ally', 2), 'strong', 2, { value: 10, ...C }))),
      p('agility', 0, self(m('ccRes', 30), m('air', 17)), afterSkill(buff(rand('ally', 2), 2, [m('finalReduction', 20)]))),
      p('power', 0, self(m('ccRes', 30), m('finalReduction', 17), m('weakenAtk', 20))),
    ],
    full: [self(m('weakenAtk', 3)), afterSkill({ to: SELF, cleanse: 'debuff' })],
  },
  {
    id: 'acc-izanami', name: 'Accessoires Izanami',
    pairs: [
      p('force', 0, self(m('ccRes', 30), m('hp', 25)), afterSkill(together(40, st(ALLIES, 'bond', 2, { value: 20, ...C })))),
      p('chakra', 0, self(m('ccRes', 30), m('def', 25)), afterSkill(together(40, st(ALLIES, 'strong', 2, { value: 20, ...C })))),
      p('agility', 0, self(m('ccRes', 30), m('air', 20)), afterSkill(st(SELF, 'shielding', 2, C))),
      p('power', 0, self(m('ccRes', 30), m('finalReduction', 20), m('weakenAtk', 20))),
    ],
    full: [self(m('ccRes', 5), m('weakenAtk', 5)), afterSkill(st(role('enemy', 'assaulter'), 'chaoticStorm', 2, { value: 20 }))],
  },
  {
    id: 'acc-crystalys', name: 'Accessoires Crystalys',
    pairs: [
      p('force', 0, self(m('ccRate', 30), m('hp', 40), m('air', 10))),
      p('chakra', 0, self(m('ccRate', 30), m('air', 5))),
      p('agility', 0, self(m('ccRate', 25), m('finalReduction', 17))),
      p('power', 0, self(m('ccRate', 25), m('weakenAtk', 17), m('air', 10))),
    ],
    full: [self(m('ccRate', 7), m('air', 10))],
  },
  {
    id: 'acc-sand-burial', name: 'Accessoires Sand Burial',
    pairs: [
      p('force', 0, self(m('hp', 50)), attacked(80, st(rand('ally', 2), 'bond', 2, { value: 10, ...C }))),
      p('chakra', 0, self(m('def', 50)), attacked(80, st(rand('enemy', 2), 'dispirited', 2, { value: 15 }))),
      p('agility', 0, self(m('finalReduction', 40)), attacked(100, buff(ALLIES, 2, [m('finalReduction', 30)]))),
      p('power', 0, self(m('air', 48)), attacked(100, buff(ALLIES, 2, [m('air', 30)]))),
    ],
    full: [self(m('weakenAtk', 30))],
  },
  {
    id: 'acc-defiance', name: 'Accessoires Defiance',
    pairs: [
      p('force', 0, self(m('ccRes', 30), m('finalReduction', 20), m('hp', 25))),
      p('chakra', 0, self(m('ccRes', 30), m('finalReduction', 20), m('hp', 25))),
      p('agility', 0, self(m('ccRes', 30), m('finalReduction', 20), m('air', 20))),
      p('power', 0, self(m('ccRes', 30), m('finalReduction', 20), m('air', 20))),
    ],
    full: [self(m('weakenAtk', 30))],
  },
  {
    id: 'acc-radiance', name: 'Accessoires Radiance',
    pairs: [
      p('force', 0, self(m('dr', 35), m('finalDmg', 20))),
      p('chakra', 0, self(m('atk', 30), m('finalDmg', 20))),
      p('agility', 0, self(m('dr', 35), m('finalDmg', 20))),
      p('power', 0, self(m('atk', 20), m('finalDmg', 20), m('ccRes', 15))),
    ],
    full: [self(m('weakenDef', 60), m('weakenAtk', 15)), afterSkill({ to: lowestHp('enemy'), strike: 240, attackType: 'magic' })],
  },
  {
    id: 'acc-flamvell', name: 'Accessoires Flamvell',
    pairs: [
      p('force', 0, self(m('immuneWeakenDef', 25), m('def', 25), m('air', 25))),
      p('chakra', 0, self(m('immuneWeakenDef', 25), m('def', 25), m('finalReduction', 25))),
      p('agility', 0, self(m('immuneWeakenDef', 25), m('def', 25), m('hp', 50))),
      p('power', 0, self(m('immuneWeakenDef', 25), m('def', 25), m('weakenAtk', 20))),
    ],
    full: [self(m('weakenAtk', 5)), attacked(35, st(role('ally', 'assaulter'), 'shatterStorm', 2, C))],
  },
  {
    id: 'acc-mekansm', name: 'Accessoires Mekansm',
    pairs: [
      p('force', 0, self(m('ccRes', 30), m('dr', 30), m('air', 15))),
      p('chakra', 0, self(m('ccRes', 30), m('atk', 25), m('air', 15))),
      p('agility', 0, self(m('ccRes', 30), m('dr', 30), m('hp', 15))),
      p('power', 0, self(m('ccRes', 20), m('finalDmg', 20), m('hp', 15))),
    ],
    full: [self(m('weakenAtk', 25), m('atk', 15)), afterSkill(st(rand('enemy', 1), 'weakened', 2))],
  },
  {
    id: 'acc-arcane', name: 'Accessoires Arcane',
    pairs: [
      p('force', 0, self(m('ccRes', 35), m('air', 40), m('hp', 10))),
      p('chakra', 0, self(m('ccRes', 30), m('finalReduction', 30), m('hp', 10))),
      p('agility', 0, self(m('ccRes', 30), m('def', 50), m('hp', 10))),
      p('power', 0, self(m('ccRes', 20), m('weakenAtk', 20), m('hp', 10))),
    ],
    full: [self(m('hp', 40), m('air', 30))],
  },
  {
    id: 'acc-butterfly', name: 'Accessoires Butterfly',
    pairs: [
      p('force', 0, self(m('ccRes', 35), m('air', 30)), attacked(100, debuff(ALLIES, 2, [m('aid', -90)]))),
      p('chakra', 0, self(m('ccRate', 30)), afterSkill({ to: rand('ally', 2), fury: 30 })),
      p('agility', 0, self(m('dr', 40)), afterSkill(st(rand('enemy', 1), 'untreatment', 2))),
      p('power', 0, self(m('weakenAtk', 25)), attacked(40, { to: 'attacker', cleanse: 'buff' })),
    ],
    full: [self(m('atk', 45), m('hp', 60))],
  },
  {
    id: 'acc-infernity', name: 'Accessoires Infernity',
    pairs: [
      p('force', 0, self(m('ccRate', 35), m('hp', 30))),
      p('chakra', 0, self(m('atk', 30)), afterSkill(st(rand('ally', 1), 'pyroblast', 2, C))),
      p('agility', 0, self(m('ccRate', 25), m('finalReduction', 20))),
      p('power', 0, self(m('ccRate', 25), m('weakenAtk', 15))),
    ],
    full: [self(m('hp', 30), m('air', 30))],
  },
  {
    id: 'acc-vylon', name: 'Accessoires Vylon',
    pairs: [
      p('force', 0, self(m('air', 15), m('finalReduction', 30), m('ccRes', 15))),
      p('chakra', 0, self(m('hp', 50), m('ccRes', 30))),
      p('agility', 0, self(m('air', 35), m('ccRes', 30))),
      p('power', 0, self(m('weakenAtk', 25), m('ccRes', 15))),
    ],
    full: [self(m('immuneWeakenDef', 35), m('weakenAtk', 5))],
  },
  {
    id: 'acc-green', name: 'Accessoires Sange',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('ccRes', 30), m('atk', 22), m('dr', 10))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('ccRes', 30), m('atk', 10), m('dr', 25))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('ccRes', 30), m('finalDmg', 30), m('air', 12))] },
      { id: 'power', name: 'Puissance', talents: [self(m('ccRes', 30), m('finalReduction', 20), m('hp', 20))] },
    ],
    full: [self(m('ccRes', 2), m('weakenAtk', 25), m('finalReduction', 10), m('air', 10))],
  },
  {
    id: 'acc-red', name: 'Accessoires Summoning',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('ccRes', 30), m('atk', 30), m('air', 10))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('ccRes', 30), m('def', 30), m('dr', 25))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('ccRes', 30), m('finalDmg', 35), m('hp', 30))] },
      { id: 'power', name: 'Puissance', talents: [self(m('ccRes', 30), m('finalReduction', 25), m('air', 20))] },
    ],
    full: [self(m('ccRes', 10), m('weakenAtk', 20), m('atk', 5), m('air', 15)), attacked(100, { to: SELF, cleanse: 'debuff' })],
  },
  {
    id: 'acc-gold', name: 'Accessoires Susano',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('dr', 35), m('finalDmg', 20))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('atk', 30), m('dr', 25))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('finalDmg', 35)),
        afterSkill(st({ side: 'ally', pick: 'highest-dr' }, 'strong', 2, { value: 15, ...C }))] },
      { id: 'power', name: 'Puissance', talents: [self(m('atk', 20), m('dr', 25), m('ccRes', 20))] },
    ],
    full: [
      self(m('weakenDef', 40), m('weakenAtk', 25), m('matk', 15)),
      afterSkill({ to: lowestHp('enemy'), penetration: 55, attackType: 'magic' }),
    ],
  },
  {
    id: 'acc-tarrasque', name: 'Accessoires Tarrasque',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('dr', 30), m('weakenDef', 30))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('atk', 30), m('weakenDef', 25))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('finalDmg', 30), m('weakenDef', 30))] },
      { id: 'power', name: 'Puissance', talents: [self(m('atk', 30), m('weakenDef', 25))] },
    ],
    full: [self(m('dr', 25), m('finalDmg', 25), m('weakenAtk', 25))],
  },
  {
    id: 'acc-akatsuki', name: 'Accessoires Truth-Seeking',
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
    id: 'acc-baryon', name: 'Accessoires Baryon',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('ccRes', 30), m('dr', 40))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('ccRes', 30), m('atk', 30))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('ccRes', 30), m('weakenDef', 45), m('atk', 10))] },
      { id: 'power', name: 'Puissance', talents: [self(m('ccRes', 20), m('dr', 50))] },
    ],
    full: [self(m('weakenAtk', 25), m('finalDmg', 30)), afterSkill(st(rand('enemy', 3), 'painfulWill', 2))],
  },
  {
    id: 'acc-black-feather', name: 'Accessoires Black Feather',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('ccRate', 30), m('hp', 35))] }, // + Force 30 000
      { id: 'chakra', name: 'Chakra', talents: [self(m('ccRate', 30), m('air', 10))] }, // + Agilité 30 000
      { id: 'agility', name: 'Agilité', talents: [self(m('finalReduction', 35)), afterSkill(st(rand('ally', 1), 'shatterStorm', 2, C))] }, // + Chakra 30 000
      { id: 'power', name: 'Puissance', talents: [self(m('ccRate', 30), m('weakenAtk', 15))] }, // + Puissance 30 000
    ],
    full: [self(m('ccRate', 20), m('weakenAtk', 10), m('hp', 30), m('air', 20))],
  },
  {
    id: 'acc-violet', name: 'Accessoires Branded',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('atk', 30)), afterSkill(st(rand('enemy', 1), 'upwind', 2))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('finalDmg', 35)), afterSkill(st(rand('ally', 1), 'pyroblast', 2, C))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('dr', 35)), afterSkill(st(rand('ally', 1), 'superarmor', 2, C))] },
      { id: 'power', name: 'Puissance', talents: [self(m('weakenAtk', 25)), afterSkill(st(rand('enemy', 1), 'corrosion', 2))] },
    ],
    full: [self(m('hp', 40), m('air', 30))],
  },
  {
    id: 'acc-yin-yang', name: 'Accessoires Yin-Yang',
    pairs: [
      { id: 'force', name: 'Force', talents: [self(m('hp', 40)), attacked(100, st(rand('ally', 2), 'strong', 2, { value: 20, ...C }))] },
      { id: 'chakra', name: 'Chakra', talents: [self(m('finalReduction', 40)), attacked(100, st(rand('ally', 2), 'superDefense', 2, { value: 20, ...C }))] },
      { id: 'agility', name: 'Agilité', talents: [self(m('air', 50)), attacked(35, { to: rand('enemy', 3), cleanse: 'buff' })] },
      { id: 'power', name: 'Puissance', talents: [self(m('def', 50)),
        attacked(100, fixed(debuff(role('enemy', 'assaulter'), 2, [m('crit', -30)], 'Critique −30 % (non dissipable)')))] },
    ],
    full: [self(m('weakenAtk', 32))],
  },
];

GEAR_SETS.push(...GEAR_SETS_2);
ACCESSORY_SETS.push(...ACCESSORY_SETS_2);

const gearById = Object.fromEntries(GEAR_SETS.map((g) => [g.id, g]));
const accById = Object.fromEntries(ACCESSORY_SETS.map((a) => [a.id, a]));

// Convertit les choix d'un ninja ({ gear: { set: pièces }, acc: { set: [paires] } }) en entrées pour le moteur.
export function equipmentEntries(choice = {}) {
  const out = [];
  for (const [id, pieces] of Object.entries(choice.gear || {})) {
    const g = gearById[id];
    if (!g || !pieces || pieces < 2) continue; // aucun bonus sous 2 pièces
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

// Emplacements de la fiche : 6 pièces d'équipement, 8 accessoires (2 par paire).
export const GEAR_SLOTS = ['Attaque physique', 'Défense physique', 'Attaque stratégique', 'Défense stratégique', 'Vitesse', 'Puissance'];
export const ACC_SLOTS = [
  { pair: 'force', label: 'Force' }, { pair: 'force', label: 'Force' },
  { pair: 'chakra', label: 'Chakra' }, { pair: 'chakra', label: 'Chakra' },
  { pair: 'agility', label: 'Agilité' }, { pair: 'agility', label: 'Agilité' },
  { pair: 'power', label: 'Puissance' }, { pair: 'power', label: 'Puissance' },
];

// Pièce par pièce → choix par set : nombre de pièces d'équipement par set, et paires complètes d'accessoires
// (les 2 accessoires d'une paire doivent venir du même set ; les 4 paires du même set donnent le bonus 8 pièces).
export function slotsToChoice(slots = {}) {
  const gear = {}, acc = {};
  for (const id of slots.gear || []) if (id) gear[id] = (gear[id] || 0) + 1;
  const a = slots.acc || [];
  for (let i = 0; i < ACC_SLOTS.length; i += 2) {
    if (a[i] && a[i] === a[i + 1]) (acc[a[i]] ||= []).push(ACC_SLOTS[i].pair);
  }
  return { gear, acc };
}

// Ancien format ({ gear: { set: pièces }, acc: { set: [paires] } }) → emplacements.
export function choiceToSlots(choice = {}) {
  const gear = Array(GEAR_SLOTS.length).fill(null), acc = Array(ACC_SLOTS.length).fill(null);
  let i = 0;
  for (const [id, n] of Object.entries(choice.gear || {})) for (let k = 0; k < n && i < gear.length; k++) gear[i++] = id;
  for (const [id, pairs] of Object.entries(choice.acc || {})) {
    for (const pair of pairs || []) ACC_SLOTS.forEach((s, j) => { if (s.pair === pair && !acc[j]) acc[j] = id; });
  }
  return { gear, acc };
}

export function checkEquipment(choice = {}) {
  const errors = [];
  const pieces = Object.values(choice.gear || {}).reduce((s, n) => s + (n || 0), 0);
  const pairs = Object.values(choice.acc || {}).reduce((s, p) => s + (p?.length || 0), 0);
  if (pieces > 6) errors.push(`${pieces} pièces d'équipement (6 maximum).`);
  if (pairs > 4) errors.push(`${pairs} paires d'accessoires (4 maximum).`);
  return errors;
}
