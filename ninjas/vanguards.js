// Avant-gardes. Transcription des descriptions du jeu (wiki Discord).
// base : ligne de base du talent (vitesse / Dégâts / Absorption propres) ; prise en compte seulement
//        si la règle « applyBaseLine » est activée (sinon on considère qu'elle est déjà dans les stats saisies).
import {
  ALLIES, ALLIES_BUT_SELF, ENEMIES, SELF, TARGET, ATTACKER, rand, role, nature, lowestHp, highestHp,
  m, buff, debuff, st, FURY_68, FURY_50,
} from './helpers.js';

const V = 'vanguard';
const cleanseAllies = { to: ALLIES, cleanse: 'debuff' };
const dispelEnemies = { to: ENEMIES, cleanse: 'buff' };
const heal = (pct, to = ALLIES) => ({ to, heal: pct });
const allHit = (pct, attackType) => ({ target: ENEMIES, pct, ...(attackType ? { attackType } : {}) });
const self = (...mods) => ({ to: SELF, mods });
const allies = (...mods) => ({ to: ALLIES, mods });
const enemies = (...mods) => ({ to: ENEMIES, mods });
const immune = (...ids) => ({ to: SELF, immune: ids });

export const VANGUARDS = [
  {
    id: 'hidan-kakuzu', name: 'Hidan & Kakuzu', role: V,
    base: { speed: 87, dr: 75, air: 75 },
    talents: [
      self(m('hp', 50), m('block', 60)),
      allies(m('speed', 118), m('def', 25), m('immuneIgnoreDef', 20), m('atk', 30), m('dr', 30), m('finalReduction', 30), m('hp', 35)),
      enemies(m('ccRate', -25), m('atk', -30), m('dr', -35), m('punch', -45)),
      { on: 'attacked', chance: 30, effects: [cleanseAllies] },
      { on: 'death', once: true, effects: [{ revive: 60 }, cleanseAllies] },
      self(m('ignoreEnemyAtk', 10), m('ccRes', 55), m('reflectRes', 150)),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'imprison', 'weakened'),
    ],
    awakenings: [{ name: 'Power of Akatsuki', talents: [self(m('sBlock', 60))] }],
    special: {
      name: 'Beyond Death', hits: [allHit(330)], fury: FURY_68,
      effects: [
        heal(50),
        st(SELF, 'shatterStorm', 2, { value: 15 }),
        st(rand('ally', 2), 'strong', 2, { value: 20 }),
        st(rand('enemy', 2), 'chaoticStorm', 2, { value: 20 }),
        st(rand('enemy', 2), 'healReduction', 2, { value: 70 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'hinata-soccer', name: 'Hinata (soccer)', role: V,
    base: { speed: 87, dr: 75, air: 75 },
    talents: [
      self(m('atk', 10), m('dmgTaken', 50)),
      allies(m('speed', 118), m('atk', 30), m('dr', 30), m('finalDmg', 30), m('finalReduction', 30), m('hp', 40)),
      { to: { side: 'enemy', pick: 'highest-ccres' }, mods: [m('ccRes', -5)] },
      { to: { side: 'ally', pick: 'highest-ccres' }, mods: [m('ccRes', 5)] },
      enemies(m('aid', -15)),
      { to: ALLIES, scale: 10, mods: [m('atk', 3), m('finalReduction', 5)] },
      self(m('ccRes', 55), m('reflectRes', 150)),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'upwind', 'weakened', 'poisonousWind', 'corrosion'),
    ],
    awakenings: [
      { name: 'Twin Lion Fists', talents: [
        allies(m('atk', 5), m('punch', 25), m('ccRate', 30)),
        enemies(m('atk', -15), m('aid', -15), m('def', -40)),
      ] },
      { name: 'Twin Lion Strike', replacePrevious: true, talents: [
        allies(m('ccRes', 25), m('def', 30), m('immuneIgnoreDef', 30)),
        enemies(m('atk', -30), m('punch', -45), m('dr', -50)),
      ] },
    ],
    special: {
      name: 'Eight Trigrams: Rift', hits: [allHit(300), allHit(150, 'magic')], fury: FURY_68,
      effects: [
        heal(50),
        st(role('ally', ['vanguard', 'assaulter']), 'pyroblast', 2),
        st(rand('ally', 2), 'strong', 2, { value: 20 }),
        st(rand('enemy', 2), 'corrosion', 2, { value: 30 }),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'karin-guyver', name: 'Karin (Guyver)', role: V,
    base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('finalDmg', 30), m('atk', 30), m('ignoreDef', 35), m('hp', 50), m('air', 40)),
      self(m('hp', -25), m('air', -15)),
      { to: nature('ally', ['earth', 'fire', 'thunder']), mods: [m('ccRate', 30), m('punch', 25)] },
      enemies(m('atk', -20)),
      { on: 'death', once: true, effects: [{ revive: 65 }, cleanseAllies] },
      self(m('ccRes', 55), m('reflectRes', 150)),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'weakened', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Energy Disruption Shield', talents: [enemies(m('air', -15))] }],
    special: {
      name: 'Railgun', hits: [allHit(300), { target: lowestHp('enemy'), pct: 150, attackType: 'physical' }], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 2), 'dispirited', 2),
        st(rand('enemy', 2), 'upwind', 2),
        st(SELF, 'acceleration', 2, { value: 15 }),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'sai-knight', name: 'Sai (Knight errant)', role: V,
    base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('atk', 30), m('dr', 30), m('hp', 35)),
      { to: nature('ally', ['earth', 'fire', 'thunder']), mods: [m('ccRes', 25), m('immuneIgnoreDef', 30)] },
      enemies(m('atk', -30), m('dr', -30), m('punch', -45)),
      { on: 'attacked', chance: 30, effects: [cleanseAllies] },
      { on: 'attacked', chance: 60, effects: [st(rand('ally', 1), 'shatterStorm', 2, { value: 10 })] },
      self(m('block', 50), m('ccRes', 55)),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'poisonousWind', 'weakened'),
    ],
    awakenings: [{ name: 'Ink Clone', talents: [self(m('sBlock', 50))] }],
    special: {
      name: 'Choshin Giga', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 2), 'bond', 2, { value: 10 }),
        st(rand('enemy', 2), 'chaoticStorm', 2, { value: 10 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'kashin-koji', name: 'Kashin Koji', role: V,
    base: { speed: 86, dr: 55, air: 85 },
    talents: [
      allies(m('speed', 116), m('atk', 30), m('finalReduction', 30), m('immuneIgnoreDef', 20)),
      { to: nature('ally', ['water', 'thunder', 'wind']), mods: [m('hp', 40)] },
      { to: role('ally', ['assaulter', 'supporter']), mods: [m('aid', 20)] },
      enemies(m('atk', -30), m('ccRate', -25)),
      { to: SELF, scale: 10, mods: [m('def', 10), m('air', 8)] },
      self(m('hp', 150), m('critDmgTaken', -50)),
      immune('deathSeed', 'chaos', 'charm', 'weakened', 'corrosion'),
    ],
    awakenings: [{ name: 'Sage Mode', talents: [self(m('ignoreEnemyAtk', 12))] }],
    special: {
      name: 'Fire of Flame Mountain', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(rand('enemy', 1), 'poisonousWind', 2),
        st(rand('ally', 2), 'shielding', 2),
        st(rand('ally', 2), 'superarmor', 2),
        debuff(ENEMIES, 2, [m('finalDmg', -30)]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'warrior-sakura', name: 'Warrior Sakura', role: V,
    base: { speed: 86, dr: 115, air: 70 },
    talents: [
      allies(m('speed', 116), m('atk', 30), m('ignoreDef', 35)),
      { to: role('ally', ['assaulter', 'supporter']), mods: [m('finalReduction', 30)] },
      { to: nature('ally', ['thunder', 'water', 'wind']), mods: [m('ccRate', 25)] },
      { to: nature('ally', ['earth', 'fire', 'water']), mods: [m('ccRes', 25)] },
      { to: ALLIES_BUT_SELF, mods: [m('hp', 50)] },
      self(m('hp', 100)),
      enemies(m('atk', -30), m('air', -30)),
      { to: SELF, scale: 10, mods: [m('atk', 3), m('finalDmg', 4)] },
      self(m('ccRes', 55), m('reflectRes', 150)),
      immune('superDodge', 'sSuperDodge', 'weakened', 'furyReduction', 'deathSeed', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Sakura Regeneration', talents: [
      { on: 'attacked', effects: [buff(SELF, 1, [m('speed', 15, 'icon')])] },
    ] }],
    special: {
      name: 'Sakura·Storm', hits: [allHit(330), allHit(150, 'magic')], fury: FURY_68,
      pre: [{ to: ALLIES, hpLossPct: 80 }],
      effects: [
        st(rand('enemy', 1), 'poisonousWind', 2),
        st(rand('enemy', 2), 'upwind', 2),
        st(rand('ally', 2), 'bond', 2),
        st(role('ally', ['assaulter', 'supporter']), 'shielding', 2),
        st(role('ally', ['assaulter', 'supporter']), 'sSuperDodge', 2),
        st(SELF, 'superDodge', 1),
      ],
    },
  },
  {
    id: 'han', name: '5-tail Han', role: V, tags: ['jinchuriki'],
    base: { speed: 86, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 35), m('atk', 30), m('finalDmg', 25)),
      { to: nature('ally', ['wind', 'thunder']), mods: [m('ccRate', 25), m('air', 40)] },
      { to: nature('ally', ['water', 'earth']), mods: [m('dr', 40), m('sAtk', 30)] },
      { to: nature('ally', 'fire'), mods: [m('finalReduction', 30), m('crit', 30), m('critDmg', 40)] },
      enemies(m('atk', -30)),
      self(m('ignoreEnemyAtk', 7), m('ccRes', 55), m('reflectRes', 150)),
      immune('superDodge', 'deathSeed', 'poisonousWind', 'weakened', 'disable', 'furyReduction'),
    ],
    awakenings: [{ name: 'Steam Armor', talents: [
      { to: { side: 'ally', pick: 'all', tag: 'jinchuriki' }, mods: [m('ccRes', 20), m('def', 40)] },
    ] }],
    special: {
      name: 'Five-Mountain Jump', hits: [{ target: { side: 'enemy', pick: 'highest-air' }, pct: 600 }], fury: FURY_68,
      effects: [
        { to: highestHp('enemy'), penetration: 80, attackType: 'physical' },
        heal(50),
        st(rand('ally', 2), 'bond', 2),
        st(SELF, 'superarmor', 2, { chance: 50 }),
        dispelEnemies,
        st(rand('enemy', 2), 'weakened', 2),
      ],
    },
  },
  {
    id: 'boruto', name: 'Uzumaki Boruto', role: V,
    base: { speed: 86, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 40), m('atk', 25), m('ccRes', 20)),
      { to: nature('ally', 'wind'), mods: [m('air', 25)] },
      { to: nature('ally', 'water'), mods: [m('def', 40)] },
      { to: nature('ally', 'fire'), mods: [m('finalReduction', 20)] },
      enemies(m('dr', -35), m('punch', -45)),
      { to: ALLIES, scale: 10, mods: [m('finalReduction', 5), m('def', 10)] },
      self(m('dodge', 120), m('ccRes', 55)),
      immune('furyReduction', 'windBound', 'deathSeed'),
    ],
    awakenings: [
      { name: 'Fuuton: Gale Palm', talents: [{ on: 'attacked', chance: 30, effects: [{ to: nature('ally', 'wind'), cleanse: 'debuff' }] }] },
      { name: 'Éveil 2', talents: [{ on: 'attacked', effects: [debuff(ALLIES, Infinity, [m('aid', -90)])] }] },
    ],
    special: {
      name: 'Ultra-Big Ball Rasengan', hits: [{ target: rand('enemy', 2), pct: 480 }], fury: FURY_68,
      effects: [
        st(highestHp('enemy'), 'windBound', 2),
        st(role('enemy', 'supporter'), 'weakened', 2),
        debuff(ENEMIES, 2, [m('atk', -35, 'icon'), m('recoveryCut', 50)]),
        st(ALLIES, 'superDodge', 2),
        st(role('ally', 'supporter'), 'ccFree', 2),
      ],
    },
  },
  {
    id: 'hanzo', name: 'Reanimated Hanzo', role: V,
    base: { speed: 86, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 112), m('air', 30), m('hp', 30), m('penBonus', 30)),
      { to: nature('ally', ['water', 'fire']), mods: [m('dr', 30), m('atk', 30), m('def', 30), m('finalReduction', 20)] },
      enemies(m('block', -20), m('crit', -20)),
      self(m('ccRes', 55), m('reflectRes', 150)),
      immune('imprison', 'freeze', 'deathSeed'),
    ],
    awakenings: [{ name: 'Awaken Body Flicker Technique', talents: [
      self(m('immuneIgnoreDef', 50)),
      { on: 'attacked', chance: 80, effects: [{ to: nature('ally', 'water'), fury: 30 }, { to: rand('ally', 2), cleanse: 'debuff' }] },
    ] }],
    special: {
      name: 'Sanshoyu Bifu', hits: [allHit(360)], fury: FURY_68,
      effects: [
        { to: ENEMIES, dot: { name: 'Poison', pct: 120, duration: 2 } },
        { to: ENEMIES, dot: { name: 'Burst', pct: 120, duration: 2 } },
        { to: ENEMIES, dot: { name: 'Bleed', pct: 120, duration: 2 } },
        st(ENEMIES, 'painfulWill', 2),
        st(ENEMIES, 'corrosion', 2),
        st(ALLIES, 'pyroblast', 2),
        heal(120),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'pain-animal', name: 'Animal Path Pain', role: V,
    base: { speed: 86, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 112), m('hp', 30), m('atk', 30)),
      { to: nature('ally', 'thunder'), mods: [m('sAtk', 40), m('ccRate', 30), m('finalDmg', 30)] },
      { to: nature('ally', 'water'), mods: [m('def', 60), m('finalReduction', 25), m('air', 40)] },
      enemies(m('atk', -30)),
      self(m('ignoreEnemyAtk', 10), m('ccRes', 55), m('reflectRes', 150)),
      immune('chaos', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Psychic Panda', talents: [self(m('block', 30)), immune('blind')] }],
    normal: {
      hits: [allHit(150)],
      effects: [
        heal(120),
        st(nature('enemy', 'earth'), 'seal', 2), st(nature('enemy', 'earth'), 'upwind', 2), { to: nature('enemy', 'earth'), cleanse: 'buff' },
        { to: nature('enemy', 'fire'), penetration: 100, attackType: 'physical' },
        { to: nature('enemy', 'fire'), dot: { name: 'Incinerate', pct: 120, duration: 2 } },
        st(nature('enemy', 'fire'), 'windBound', 2), debuff(nature('enemy', 'fire'), 2, [m('ccRes', -30)]),
        { to: nature('enemy', 'wind'), penetration: 100, attackType: 'magic' },
        st(nature('enemy', 'wind'), 'freeze', 2), st(nature('enemy', 'wind'), 'weakened', 2), debuff(nature('enemy', 'wind'), 2, [m('ccRate', -30)]),
        st(nature('enemy', ['thunder', 'water', 'none']), 'blind', 2),
        debuff(nature('enemy', ['thunder', 'water', 'none']), 2, [m('atk', -30, 'icon'), m('def', -30, 'icon')]),
        st(nature('ally', 'thunder'), 'upwind', 2), buff(nature('ally', 'thunder'), 2, [m('crit', 30)]), { to: nature('ally', 'thunder'), cleanse: 'debuff' },
        st(nature('ally', 'water'), 'bond', 2), st(nature('ally', 'water'), 'windEscape', 2, { value: 10 }),
        buff(nature('ally', 'water'), 2, [m('def', 200, 'icon')]),
      ],
    },
    special: {
      name: 'Spéciale', hits: [allHit(330)],
      effects: [
        st(SELF, 'superDodge', 2, { chance: 30 }),
        st(role('ally', 'supporter'), 'superDodge', 3, { chance: 50 }),
        buff(ALLIES, 3, [m('dr', 50), m('air', 50)]),
        debuff(ENEMIES, 3, [m('dr', -50), m('air', -50)]),
        dispelEnemies,
        st(ENEMIES, 'painfulWill', 3),
      ],
    },
  },
  {
    id: 'kakuzu-jiongu', name: 'Jiongu Kakuzu', role: V,
    base: { speed: 86, dr: 70, air: 65 },
    talents: [
      allies(m('speed', 112), m('hp', 30)),
      { to: nature('ally', ['earth', 'wind']), mods: [m('air', 35), m('hp', 20)] },
      { to: nature('ally', ['thunder', 'fire']), mods: [m('dr', 40), m('punch', 20)] },
      { to: nature('ally', 'water'), mods: [m('def', 35), m('atk', 35)] },
      { to: ALLIES_BUT_SELF, scale: 10, mods: [m('atk', 5), m('def', 10)] },
      { on: 'death', once: true, effects: [{ revive: 80 }] },
      { on: 'attacked', chance: 50, effects: [st(ATTACKER, 'poisonousWind', 2)] },
      { on: 'attacked', chance: 50, effects: [st(SELF, 'shatterStorm', 2)] },
      self(m('ccRes', 60), m('reflectRes', 150)),
      immune('seal', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Immortal Fighter', talents: [self(m('block', 30), m('crit', 30))] }],
    special: {
      name: 'Jiongu Kimen no Baku', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByNature: { wind: 450, earth: 450, fire: 300, thunder: 300, water: 400, none: 500 } }],
      effects: [
        { to: ENEMIES, dot: { name: 'Split', pct: 120, duration: 2 } },
        { to: ENEMIES, dot: { name: 'Scorching flame', pct: 120, duration: 2 } },
        { to: ENEMIES, dot: { name: 'Burst', pct: 120, duration: 2 } },
        st(nature('enemy', ['thunder', 'wind']), 'weakened', 2),
        dispelEnemies,
        buff(role('ally', ['assaulter', 'supporter']), 2, [m('def', 80, 'icon')]),
      ],
    },
  },
  {
    id: 'hokage7-sasuke', name: '7th Hokage & Sasuke', role: V,
    base: { speed: 86, dr: 70, air: 60 },
    talents: [
      allies(m('speed', 110), m('hp', 40), m('atk', 30)),
      enemies(m('atk', -30)),
      { on: 'attacked', effects: [st(SELF, 'bond', 2), st(lowestHp('ally'), 'bond', 2)] },
      self(m('ccRes', 55), m('reflectRes', 150)),
      immune('imprison', 'blind', 'deathSeed'),
    ],
    awakenings: [{ name: 'Will of Fire', talents: [self(m('atk', 10), m('dr', 10))] }],
    // Son attaque normale est décrite comme une compétence.
    normal: {
      name: 'Majestic Attire: Susano', hits: [allHit(330)], fury: FURY_50,
      effects: [
        { to: TARGET, penetration: 50, chance: 70 },
        cleanseAllies,
        heal(150),
        debuff(ENEMIES, 2, [m('speed', -20, 'icon'), m('air', -40)]),
        buff(ALLIES, 2, [m('aid', 30), m('def', 30, 'icon')]),
      ],
    },
    special: {
      name: 'Scorch Release: Halo Hurricane Jet Black Arrow Style Zero', hits: [allHit(330)], fury: { self: 0, allies: 50 },
      effects: [
        st(rand('enemy', 2), 'deathSeed', 2),
        st(rand('enemy', 1), 'deathSeed', 2, { chance: 25 }),
        dispelEnemies,
        st(role('enemy', 'vanguard'), 'untreatment', 2),
        buff(SELF, 2, [m('speed', 50, 'icon')]),
        st(ALLIES, 'furyShield', 2),
      ],
    },
  },
  {
    id: 'boa-hancock', name: 'Boa Hancock', role: V,
    base: { speed: 80, dr: 60, air: 40 },
    talents: [
      allies(m('speed', 102), m('dr', 30), m('atk', 20)),
      { to: role('ally', 'vanguard'), mods: [m('hp', 50)] },
      { to: role('ally', ['assaulter', 'supporter']), mods: [m('hp', 30)] },
      { on: 'attacked', chance: 25, effects: [{ to: ENEMIES, fury: -30 }] },
      { on: 'attacked', chance: 60, effects: [{ to: ATTACKER, reflect: 200 }] },
      self(m('ccRes', 50)),
      immune('imprison', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Awaken Arrow of the Captives', talents: [self(m('dr', 10), m('air', 10))] }],
    special: {
      name: 'Mero Mero no Mi', hits: [allHit(300)], fury: FURY_50,
      effects: [
        heal(120),
        cleanseAllies,
        buff(ALLIES, 2, [m('def', 30, 'icon'), m('aid', 30)]),
        debuff(role('enemy', 'vanguard'), 2, [m('def', -50, 'icon')]),
        debuff(role('enemy', 'assaulter'), 2, [m('def', -40, 'icon')]),
        debuff(role('enemy', 'supporter'), 2, [m('def', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'sage-jugo', name: 'Sage Jugo', role: V,
    base: { speed: 83, dr: 70, air: 60 },
    talents: [
      self(m('atk', 10), m('hp', 100)),
      allies(m('speed', 110), m('hp', 40), m('air', 30)),
      { to: role('ally', ['assaulter', 'supporter']), mods: [m('finalReduction', 30)] },
      { to: SELF, scale: 10, mods: [m('finalDmg', 4), m('sAtk', 10)] },
      self(m('ccRes', 60), m('reflectRes', 150)),
      immune('seal', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [immune('superDodge', 'sSuperDodge')] },
      { name: 'Éveil 2', talents: [enemies(m('atk', -30)), { on: 'attacked', effects: [buff(SELF, Infinity, [m('speed', 20, 'icon')])] }] },
      { name: 'Éveil 3 (carte spéciale)', base: { speed: 86, dr: 70, air: 60 },
        talents: [allies(m('speed', 2)), self(m('dr', 40)), immune('weakened', 'charm')],
        specialEffects: [
          st(rand('enemy', 3), 'painfulWill', 2),
          st(rand('enemy', 2), 'weakened', 2),
          st(role('enemy', 'assaulter'), 'upwind', 2),
        ] },
    ],
    special: {
      name: 'Taren Fujizuho', fury: FURY_50,
      pre: [{ to: ALLIES, hpLossPct: 60 }],
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 380, assaulter: 330, supporter: 300 } }],
      effects: [
        { to: ENEMIES, dot: { name: 'Split', pct: 100, duration: 2 } },
        st(rand('enemy', 3), 'painfulWill', 2),
        st(role('ally', ['assaulter', 'supporter']), 'shielding', 1),
        st(role('ally', ['assaulter', 'supporter']), 'superDodge', 2),
        debuff(role('enemy', ['assaulter', 'supporter']), 2, [m('atk', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'guren', name: 'Guren', role: V,
    base: { speed: 82, dr: 60, air: 60 },
    talents: [
      enemies(m('speed', -52), m('atk', -30)),
      allies(m('hp', 30), m('def', 30)),
      self(m('block', 50), m('sBlock', 60), m('ccRes', 50)),
      immune('freeze', 'imprison', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [{ on: 'attacked', chance: 70, effects: [{ to: ALLIES, fury: 30 }] }],
      specialEffects: [debuff(highestHp('enemy'), 2, [m('air', -30)])] }],
    special: {
      name: 'Broken Crystal Dragon', hits: [{ target: rand('enemy', 3), pct: 400 }], fury: FURY_50,
      effects: [
        st(role('enemy', 'supporter'), 'freeze', 2),
        cleanseAllies,
        debuff(role('enemy', ['supporter', 'assaulter']), 2, [m('dr', -40)]),
        debuff(role('enemy', 'vanguard'), 2, [m('def', -50, 'icon')]),
        buff(ALLIES, 2, [m('aid', 40)]),
      ],
    },
  },
  {
    id: 'tobirama', name: 'Reanimated Tobirama', role: V,
    base: { speed: 78, dr: 55, air: 60 },
    talents: [
      allies(m('speed', 100)),
      { to: role('ally', ['assaulter', 'supporter']), mods: [m('finalReduction', 40)] },
      self(m('dmgTaken', 90), m('hp', 60), m('def', 30), m('ignoreDef', 100), m('ccRes', 50)),
      enemies(m('atk', -23)),
      { on: 'attacked', effects: [heal(80, SELF)] },
      immune('superDodge', 'blind', 'freeze', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil', talents: [self(m('penMalus', 30))],
      specialHits: [{ target: lowestHp('enemy'), pct: 200 }] }],
    special: {
      name: 'Water Release: Water Dragon', hits: [{ target: role('enemy', 'supporter'), pct: 600 }], fury: FURY_68,
      effects: [
        debuff(ENEMIES, 2, [m('hit', -300)]),
        buff(ALLIES, 2, [m('air', 25), m('ccRes', 30)]),
        buff(role('ally', 'supporter'), 2, [m('speed', 20, 'icon')]),
        buff(SELF, 2, [m('atk', 30, 'icon'), m('block', 60)]),
      ],
    },
  },
  {
    id: 'indra', name: 'Otsutsuki Indra', role: V,
    base: { speed: 75, dr: 55, air: 55 },
    talents: [
      allies(m('speed', 95)),
      { to: role('ally', ['vanguard', 'assaulter']), mods: [m('hp', 30)] },
      { to: role('enemy', ['assaulter', 'supporter']), mods: [m('atk', -25)] },
      { on: 'attacked', chance: 25, effects: [cleanseAllies] },
      { on: 'attacked', chance: 40, effects: [{ to: SELF, cleanse: 'debuff' }] },
      self(m('sCrit', 20), m('ccRes', 40)),
      immune('imprison', 'furyReduction'),
    ],
    special: {
      name: 'Susanoo: Takemikazuchi', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'imprison', 2, { chance: 80 }),
        dispelEnemies,
        debuff(ENEMIES, 2, [m('punch', -50)]),
        buff(SELF, 2, [m('def', 50, 'icon')]),
        buff(ALLIES, 2, [m('dr', 30)]),
        buff(SELF, 2, [m('crit', 40)]),
      ],
    },
  },
  {
    id: 'obito', name: 'Uchiwa Obito', role: V,
    base: { speed: 70, dr: 55, air: 45 },
    talents: [
      allies(m('speed', 87), m('dr', 25)),
      enemies(m('air', -20)),
      self(m('hp', 60), m('ccRes', 40)),
      { on: 'attacked', effects: [{ to: ATTACKER, reflect: 120 }] },
      immune('deathSeed', 'furyReduction'),
    ],
    special: {
      name: 'Wood Style: Hellish Chaos', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'silence', 2, { chance: 70 }),
        heal(120),
        buff(ALLIES, 2, [m('atk', 30, 'icon')]),
        debuff(ENEMIES, 2, [m('aid', -50)]),
        { to: role('ally', ['assaulter', 'supporter']), cleanse: 'debuff' },
      ],
    },
  },
  {
    id: 'nagato-itachi', name: 'Nagato & Itachi', role: V,
    base: { speed: 60, dr: 50, air: 50 },
    talents: [
      enemies(m('speed', -45)),
      { to: role('enemy', 'supporter'), mods: [m('atk', -20)] },
      self(m('ignoreDef', 100)),
      { to: role('ally', ['assaulter', 'vanguard']), mods: [m('air', 30)] },
      { to: role('ally', 'supporter'), mods: [m('hp', 30)] },
      { on: 'attacked', chance: 60, effects: [{ to: SELF, cleanse: 'debuff' }] },
      immune('freeze', 'blind'),
    ],
    special: {
      name: 'Dual Sealing Eyes', hits: [allHit(300)], fury: { self: 50 },
      effects: [
        st(ENEMIES, 'shock', 2, { chance: 70 }),
        st(ENEMIES, 'acupoint', 2, { chance: 70 }),
        buff(role('ally', 'supporter'), 2, [m('air', 30), m('punch', 30)]),
        debuff(role('enemy', ['assaulter', 'supporter']), 2, [m('dr', -20)]),
        debuff(ENEMIES, 2, [m('dodge', -50)]),
        st(rand('ally', 1), 'ccFree', 2),
      ],
    },
  },
  {
    id: 'minato-naruto', name: 'Minato & Naruto', role: V,
    base: { speed: 50, dr: 45, air: 45 },
    talents: [
      enemies(m('speed', -40)),
      self(m('ignoreDef', 100)),
      allies(m('atk', 20), m('air', 20)),
      { on: 'attacked', effects: [{ to: SELF, cleanse: 'debuff' }, st(SELF, 'superDodge', 1)] },
      immune('superDodge'),
    ],
    special: {
      name: 'Hiraishin Rasengan', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'chaos', 3, { chance: 70 }),
        debuff(ENEMIES, 2, [m('ccRate', -20)]),
        buff(ALLIES, 2, [m('def', 20, 'icon')]),
        debuff(ENEMIES, 2, [m('aid', -25), m('speed', -10, 'icon')]),
      ],
    },
  },
  {
    id: 'final-sasuke', name: 'Final Sasuke', role: V,
    base: { speed: 40, dr: 40, air: 40 },
    talents: [
      enemies(m('speed', -30), m('air', -20)),
      self(m('hp', 60)),
      { on: 'attacked', effects: [{ to: ATTACKER, reflect: 120 }, { to: SELF, cleanse: 'debuff' }] },
      { to: SELF, scale: 10, mods: [m('air', 3), m('speed', 3)] },
      immune('deathSeed', 'furyReduction'),
    ],
    special: {
      name: 'Chidori Planet Splitter', hits: [allHit(320)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 60 }),
        heal(250, SELF),
        buff(role('ally', 'supporter'), 2, [m('matk', 20, 'icon')]),
        debuff(ENEMIES, 2, [m('punch', -30), m('aid', -30)]),
        { to: role('ally', ['assaulter', 'supporter']), cleanse: 'debuff' },
      ],
    },
  },
  {
    id: 'madara-obito', name: 'Madara & Obito', role: V,
    base: { speed: 35, dr: 40, air: 35 },
    talents: [
      allies(m('speed', 35), m('atk', 20), m('air', 15)),
      self(m('ignoreDef', 100)),
      { on: 'attacked', chance: 75, effects: [{ to: SELF, fury: 30 }] },
      { to: SELF, scale: 10, mods: [m('dr', 10), m('air', 10)] },
      immune('paralysis', 'expel', 'blind'),
    ],
    special: {
      name: 'Heavenly Insertion Hammering Star', hits: [allHit(320)],
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 80 }),
        buff(role('ally', 'assaulter'), 2, [m('aid', 70)]),
        { to: role('ally', 'supporter'), cleanse: 'debuff' },
        debuff(SELF, 2, [m('air', -30)]),
        debuff(ENEMIES, 2, [m('atk', -20, 'icon')]),
        buff(role('ally', 'supporter'), 1, [m('speed', 10, 'icon')]),
      ],
    },
  },
  {
    id: 'momoshiki', name: 'Otsutsuki Momoshiki', role: V,
    base: { speed: 30, dr: 30, air: 30 },
    talents: [
      allies(m('speed', 20), m('atk', 12), m('hp', 30)),
      { on: 'attacked', chance: 75, effects: [{ to: SELF, fury: 30 }] },
      { to: SELF, scale: 10, mods: [m('air', 3)] },
      immune('superDodge', 'silence', 'acupoint'),
    ],
    special: {
      name: 'Escape Technique Void', hits: [allHit(300)],
      effects: [
        st(ENEMIES, 'petrify', 2, { chance: 75 }),
        dispelEnemies,
        { to: ENEMIES, dot: { name: 'Unification', pct: 120, duration: 1 } },
        buff(role('ally', ['assaulter', 'supporter']), 2, [m('air', 10)]),
      ],
    },
  },
  {
    id: 'orochimaru-rashomon', name: 'Rashomon Orochimaru', role: V,
    base: { speed: 25, dr: 40, air: 25 },
    talents: [
      allies(m('speed', 8), m('air', 8), m('hp', 20), m('def', 20)),
      { on: 'attacked', chance: 75, effects: [{ to: SELF, fury: 30 }] },
      { to: SELF, scale: 10, mods: [m('dr', 2)] },
      immune('superDodge', 'stun', 'petrify'),
    ],
    special: {
      name: 'Orochi Jutsu', hits: [allHit(260)],
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 75 }),
        { to: ENEMIES, dot: { name: 'Orochi poison', pct: 100, duration: 1 } },
        heal(50, SELF),
        buff(role('ally', 'assaulter'), 2, [m('aid', 65)]),
      ],
    },
  },
  {
    id: 'kushina', name: 'Kushina Uzumaki', role: V,
    base: { speed: 25, air: 20 },
    talents: [
      allies(m('speed', 5), m('air', 5)),
      { on: 'attacked', chance: 25, effects: [{ to: ATTACKER, fury: -20 }] },
      immune('superDodge', 'stun'),
    ],
    special: {
      name: 'Sealing Jutsu: Kongo Fusa', hits: [allHit(220)],
      effects: [
        st(role('enemy', 'supporter'), 'forbidFury', 2, { chance: 75 }),
        dispelEnemies,
        { to: ENEMIES, dot: { name: 'Burn', pct: 90, duration: 1 } },
        buff(role('ally', 'assaulter'), 2, [m('aid', 65)]),
      ],
    },
  },
  {
    id: 'itachi-reanimated', name: 'Reanimated Itachi', role: V,
    base: { speed: 15, air: 15 },
    talents: [immune('stun')],
    special: {
      name: 'Amaterasu', hits: [allHit(240)],
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 55 }),
        { to: ENEMIES, dot: { name: 'Burn', pct: 50, duration: 2 } },
        buff(role('ally', 'assaulter'), 2, [m('aid', 65)]),
      ],
    },
  },
  {
    id: 'choji-butterfly', name: 'Butterfly Choji', role: V,
    base: { speed: 15, dr: 20, air: 10 },
    talents: [],
    special: {
      name: 'S.Butterfly Bomb', hits: [{ target: role('enemy', ['vanguard', 'assaulter']), pct: 220 }],
      effects: [buff(SELF, 2, [m('def', 20, 'icon'), m('block', 50)])],
    },
  },
  {
    id: 'hinata-warm', name: 'Warm Hinata', role: V,
    base: { air: 10 },
    talents: [],
    special: {
      name: 'Double Lion Punch', hits: [allHit(90)],
      effects: [buff(role('ally', 'assaulter'), 2, [m('aid', 70)])],
    },
  },
  {
    id: 'sasuke-cursed', name: 'Cursed Seal Sasuke', role: V,
    talents: [],
    awakenings: [
      { name: 'Éveil du talent', base: { speed: 80, dr: 60, air: 55 }, talents: [
        allies(m('speed', 100), m('hp', 30)),
        enemies(m('dr', -30)),
        { to: role('enemy', ['supporter', 'assaulter']), mods: [m('punch', -30)] },
        { on: 'attacked', chance: 70, effects: [{ to: ATTACKER, reflect: 200 }] },
        { on: 'attacked', effects: [heal(70, SELF)] },
        self(m('immuneIgnoreDef', 100), m('ccRes', 40)),
        immune('deathSeed', 'furyReduction'),
      ] },
      { name: 'Éveil de la compétence', special: {
        name: 'Chidori Stream (éveillé)', fury: FURY_50,
        hits: [{ target: ENEMIES, pctByRole: { vanguard: 100, assaulter: 100, supporter: 450 } }],
        effects: [
          st(ENEMIES, 'paralysis', 2),
          { to: ENEMIES, dot: { name: 'Incinerate', pct: 100, duration: 2 } },
          buff(SELF, 2, [m('def', 120, 'icon')]),
          debuff(ENEMIES, 2, [m('dr', -20), m('dodge', -50), m('atk', -25, 'icon')]),
        ],
      } },
    ],
    special: {
      name: 'Chidori Stream', hits: [allHit(100)],
      effects: [
        buff(role('ally', 'assaulter'), 3, [m('aid', 40), m('atk', 5, 'icon')]),
        buff(SELF, 3, [m('def', 5, 'icon')]),
      ],
    },
  },
];
