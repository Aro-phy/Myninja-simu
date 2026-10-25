// Attaquants. Bonus d'équipe importés du classeur « Formation ninja » (fromSheet) ;
// effets particuliers et compétences transcrits depuis le texte français du même classeur.
import {
  ALLIES, ENEMIES, SELF, TARGET, rand, role, nature, lowestHp, highestHp, m, buff, debuff, st, FURY_68,
  fromSheet, named, gendered,
} from './helpers.js';

const A = 'assaulter';
const cleanseAllies = { to: ALLIES, cleanse: 'debuff' };
const dispelEnemies = { to: ENEMIES, cleanse: 'buff' };
const heal = (pct, to = ALLIES) => ({ to, heal: pct });
const allHit = (pct, attackType) => ({ target: ENEMIES, pct, ...(attackType ? { attackType } : {}) });
const pen = (pct, to = TARGET, attackType) => ({ to, penetration: pct, ...(attackType ? { attackType } : {}) });
const self = (...mods) => ({ to: SELF, mods });
const immune = (...ids) => ({ to: SELF, immune: ids });
const VG = role('ally', 'vanguard');
const VG_AS = role('ally', ['vanguard', 'assaulter']);
const E_VG_AS = role('enemy', ['vanguard', 'assaulter']);
const byRole = (side, v, a, s, stat) => [
  { to: role(side, 'vanguard'), mods: [m(stat, v)] },
  { to: role(side, 'assaulter'), mods: [m(stat, a)] },
  { to: role(side, 'supporter'), mods: [m(stat, s)] },
];

export const ASSAULTERS = [
  {
    id: 'daiguren-toshiro', name: 'Daiguren Toshiro', role: A, gender: 'male',
    talents: [...fromSheet('daiguren-toshiro'), { on: 'attacked', chance: 50, effects: [dispelEnemies] }],
    awakenings: [{ name: 'Éveil', talents: [self(m('sBlockRes', 40))] }],
    special: {
      name: 'Spéciale', hits: [allHit(350)], fury: FURY_68,
      effects: [
        pen(60, gendered('enemy', 'male')),
        st(ENEMIES, 'charm', 2, { chance: 95, value: 120 }),
        debuff(ENEMIES, 2, [m('healCut', 60)]),
        st(SELF, 'ccFree', 2), st(VG, 'ccFree', 2),
        buff(VG, 2, [m('def', 500, 'icon')]),
      ],
    },
  },
  {
    id: 'hotaru', name: 'Hotaru', role: A, gender: 'female',
    talents: [...fromSheet('hotaru'), ...byRole('ally', 30, 30, 40, 'hp'), ...byRole('ally', 35, 35, 50, 'def')],
    awakenings: [{ name: 'Éveil', talents: [
      { on: 'attacked', chance: 30, effects: [st(role('ally', 'supporter'), 'superDodge', 2)] },
      { to: ALLIES, mods: [m('recovery', 40)] },
    ] }],
    normal: {
      name: 'Attaque normale', hits: [{ target: rand('enemy', 3), pct: 450 }],
      effects: [
        dispelEnemies,
        st(TARGET, 'charm', 2, { value: 160 }), // approximation : « 1 ennemi attaqué » → les cibles touchées
        st(rand('enemy', 1), 'charm', 2, { chance: 35, value: 160 }),
        { to: ENEMIES, dot: { name: 'Safeguard', pct: 120, duration: 2 } },
        debuff(ENEMIES, 2, [m('sAtk', -30)]),
      ],
    },
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: { allies: 100 },
      effects: [
        { to: ENEMIES, dot: { name: 'Incinerate', pct: 120, duration: 2 } },
        st(ENEMIES, 'painfulWill', 2),
        heal(100),
        buff(rand('ally', 3), 2, [m('def', 500, 'icon')]),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'urashiki-otsutsuki', name: 'Urashiki Otsutsuki', role: A, gender: 'male',
    talents: [...fromSheet('urashiki-otsutsuki'), ...byRole('ally', 50, 40, 30, 'hp'), ...byRole('enemy', -50, -40, -30, 'def')],
    awakenings: [{ name: 'Éveil', talents: [immune('disable')] }],
    normal: {
      name: 'Attaque normale', hits: [allHit(350), allHit(200, 'magic')],
      effects: [
        { to: rand('ally', 2), cleanse: 'debuff' },
        { to: rand('enemy', 2), cleanse: 'buff' },
        st(rand('enemy', 1), 'poisonousWind', 2, { chance: 95 }),
        st(role('enemy', 'supporter'), 'weakened', 2),
        buff(ALLIES, 2, [m('atk', 30, 'icon')]),
      ],
    },
    special: {
      name: 'Spéciale', hits: [allHit(300)],
      effects: [
        st(ENEMIES, 'curseFixation', 3), st(ENEMIES, 'acupoint', 3),
        buff(ALLIES, 3, [m('crit', 40)]),
        debuff(ENEMIES, 3, [m('def', -30, 'icon')]),
        debuff(nature('enemy', ['fire', 'earth', 'water']), 3, [m('speed', -40, 'icon'), m('atk', -40, 'icon')]),
      ],
    },
  },
  {
    id: 'warlord-sakura', name: 'Warlord Sakura', role: A, gender: 'female',
    talents: [
      ...fromSheet('warlord-sakura'), ...byRole('ally', 30, 50, 50, 'hp'),
      { on: 'attacked', chance: 30, effects: [st(VG, 'bond', 2), st(SELF, 'bond', 2)] },
      { to: ALLIES, scale: 10, mods: [m('ignoreDef', 10), m('crit', 5)] },
    ],
    awakenings: [{ name: 'Éveil', talents: [{ to: VG, mods: [m('speed', 8), m('atk', 30)] }] }],
    special: {
      name: 'Spéciale', hits: [allHit(320)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 90 }),
        st(role('enemy', 'assaulter'), 'charm', 2, { value: 120 }),
        st(VG, 'shatterStorm', 2), st(SELF, 'shatterStorm', 2),
        cleanseAllies,
        debuff(ENEMIES, 2, [m('atk', -30, 'icon'), m('dr', -30)]),
      ],
    },
  },
  {
    id: '6th-mizukage-chojuro', name: '6th Mizukage Chojuro', role: A, gender: 'male',
    talents: [
      ...fromSheet('6th-mizukage-chojuro'),
      { to: ALLIES, mods: [m('dotBonus', 30)] },
      { to: nature('enemy', 'fire'), mods: [m('air', -40), m('ccRes', -30)] },
      { on: 'attacked', chance: 40, effects: [{ to: nature('ally', 'water'), hot: 50, duration: 2 }] },
    ],
    special: {
      name: 'Spéciale', hits: [allHit(330)], fury: FURY_68,
      effects: [
        pen(50, TARGET, 'physical'),
        st(highestHp('enemy'), 'freeze', 2),
        st(ENEMIES, 'blind', 2, { chance: 90 }),
        st(SELF, 'shielding', 2, { chance: 40 }), st(VG, 'shielding', 2, { chance: 40 }),
        buff(ALLIES, 2, [m('def', 50, 'icon')]),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon'), m('dr', -30)]),
      ],
    },
  },
  {
    id: 'hades', name: 'Hadès', role: A, gender: 'male',
    talents: [...fromSheet('hades'), immune('sSuperDodge')],
    awakenings: [{ name: 'Éveil', talents: [immune('charm', 'superDodge')] }],
    normal: {
      name: 'Attaque normale', hits: [allHit(300)],
      effects: [
        pen(50, highestHp('enemy')),
        st(lowestHp('enemy'), 'imprison', 2),
        { to: rand('ally', 2), cleanse: 'debuff' },
        { to: rand('enemy', 3), cleanse: 'buff' },
        st(rand('enemy', 1), 'upwind', 2),
        st(role('enemy', 'assaulter'), 'weakened', 2),
        heal(50),
      ],
    },
    special: {
      name: 'Spéciale', hits: [allHit(330)], fury: FURY_68,
      effects: [
        pen(200, lowestHp('enemy'), 'physical'),
        st(lowestHp('enemy'), 'blind', 2),
        { to: rand('ally', 3), cleanse: 'debuff' },
        { to: rand('enemy', 2), cleanse: 'buff' },
        st(ALLIES, 'shatterStorm', 2, { value: 20 }),
        st(role('ally', 'supporter'), 'superDodge', 2),
        { to: ALLIES, hot: 50, duration: 2 },
      ],
    },
  },
  {
    id: 'kawaki', name: 'Kawaki', role: A, gender: 'male',
    talents: [
      ...fromSheet('kawaki'),
      { to: named('ally', 'baryon', 'naruko', 'daiguren', 'yasaka', 'snow sakura', 'yugao'), mods: [m('air', 30), m('def', 40)] },
    ],
    awakenings: [{ name: 'Éveil', talents: [{ on: 'attacked', chance: 25, effects: [cleanseAllies] }] }],
    special: {
      name: 'Spéciale', hits: [allHit(200)], fury: FURY_68,
      effects: [
        st(E_VG_AS, 'upwind', 2),
        st(ALLIES, 'furyShield', 2),
        st(rand('ally', 2), 'bond', 2),
        st(role('ally', 'supporter'), 'shielding', 2),
      ],
    },
  },
  {
    id: 'premier-hokage', name: 'Premier Hokage', role: A, gender: 'male',
    talents: [...fromSheet('premier-hokage'), { on: 'attacked', chance: 30, effects: [st(role('ally', 'supporter'), 'superDodge', 2)] }],
    // Éveil (conditionnel selon les PV des attaquants) non modélisé pour l'instant.
    special: {
      name: 'Spéciale', hits: [allHit(420)], fury: FURY_68,
      effects: [
        heal(100),
        st(role('enemy', 'vanguard'), 'untreatment', 2),
        buff(VG, 2, [m('def', 200, 'icon')]), st(VG, 'bond', 2),
        st(role('enemy', 'assaulter'), 'weakened', 2),
        debuff(role('enemy', 'assaulter'), 2, [m('air', -50)]),
        st(role('ally', 'assaulter'), 'pyroblast', 2),
        buff(role('ally', 'assaulter'), 2, [m('atk', 30, 'icon')]),
        st(role('enemy', 'supporter'), 'forbidFury', 2, { chance: 30 }),
        debuff(role('enemy', 'supporter'), 2, [m('ccRate', -30)]),
        st(role('ally', 'supporter'), 'furyShield', 2, { value: 30 }),
        buff(role('ally', 'supporter'), 2, [m('speed', 15, 'icon')]),
      ],
    },
  },
  {
    id: 'cyber-naruto', name: 'Cyber Naruto', role: A, gender: 'male',
    talents: [
      ...fromSheet('cyber-naruto'), immune('superDodge'),
      { to: role('ally', 'assaulter'), mods: [m('finalDmg', 20)] },
      { to: role('ally', 'supporter'), mods: [m('ccRate', 15)] },
      { to: nature('enemy', 'thunder'), mods: [m('air', -30)] },
      { to: nature('enemy', 'water'), mods: [m('def', -40)] },
      { to: nature('enemy', 'fire'), mods: [m('finalDmg', -20)] },
    ],
    awakenings: [{ name: 'Éveil', talents: [immune('poisonousWind', 'weakened')] }],
    special: {
      name: 'Spéciale', hits: [allHit(330), allHit(150, 'magic')], fury: FURY_68,
      effects: [
        heal(50), cleanseAllies,
        st(role('ally', 'assaulter'), 'superarmor', 2, { chance: 50 }),
        st(role('ally', 'supporter'), 'superDodge', 2, { chance: 30 }),
        st(role('enemy', 'assaulter'), 'weakened', 2),
        st(role('enemy', 'vanguard'), 'upwind', 2),
      ],
    },
  },
  {
    id: 'kushina-d-ete', name: 'Kushina d\'été', role: A, gender: 'female',
    talents: [...fromSheet('kushina-d-ete'), immune('superDodge'), self(m('block', -50)),
      { to: named('ally', 'naruto'), mods: [m('ccRes', 20)] }],
    awakenings: [{ name: 'Éveil', talents: [immune('charm', 'poisonousWind')] }],
    normal: {
      name: 'Attaque normale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(rand('enemy', 1), 'seal', 2),
        st(rand('enemy', 2), 'weakened', 2),
        st(rand('enemy', 2), 'upwind', 2),
        st(rand('enemy', 1), 'forbidFury', 2, { chance: 50 }),
        dispelEnemies, heal(50),
      ],
    },
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(rand('enemy', 2), 'charm', 2, { chance: 90 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'windEscape', 2),
        st(ALLIES, 'furyShield', 2),
        st(ENEMIES, 'painfulWill', 2),
        cleanseAllies, heal(50),
      ],
    },
  },
  {
    id: 'hashirama-madara', name: 'Hashirama-Madara', role: A, gender: 'male',
    talents: [
      ...fromSheet('hashirama-madara'), immune('superDodge'),
      self(m('hp', 80), m('def', 80)),
      { to: VG_AS, mods: [m('mdefShield', 60)] },
      { to: role('ally', 'supporter'), mods: [m('pdefShield', 60)] },
      { to: ALLIES, scale: 10, mods: [m('atk', 8), m('def', 8)] },
      { on: 'attacked', chance: 30, effects: [cleanseAllies] },
    ],
    special: {
      name: 'Spéciale', hits: [allHit(410)], fury: FURY_68,
      effects: [
        pen(40, TARGET, 'physical'),
        st(rand('enemy', 1), 'freeze', 2, { chance: 90 }),
        st(ENEMIES, 'imprison', 2, { chance: 80 }),
        heal(100),
        st(rand('enemy', 2), 'healReduction', 2, { value: 90 }),
        st(named('ally', 'hashirama'), 'shielding', 2, { chance: 30 }),
        st(named('ally', 'madara'), 'superDodge', 2, { chance: 40 }),
        buff(role('ally', 'supporter'), 2, [m('def', 60, 'icon')]),
        st(role('ally', 'assaulter'), 'pyroblast', 2),
      ],
    },
  },
  {
    id: 'otsutsuki-jigen', name: 'Otsutsuki Jigen', role: A, gender: 'male',
    talents: [...fromSheet('otsutsuki-jigen'), { on: 'attacked', chance: 30, effects: [cleanseAllies] },
      { to: named('ally', 'hashirama'), mods: [m('air', 20)] }],
    normal: {
      name: 'Skill normal', hits: [allHit(450)], fury: { self: 50, allies: 30 },
      effects: [
        heal(100),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'bond', 2), st(rand('ally', 2), 'windEscape', 2),
        st(role('ally', 'assaulter'), 'pyroblast', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        dispelEnemies,
      ],
    },
    special: {
      name: 'Skill spécial', hits: [allHit(100)], fury: FURY_68,
      effects: [
        pen(70),
        { to: ENEMIES, dot: { name: 'Incinerate', pct: 60, duration: 2 } },
        heal(100),
        st(role('ally', 'assaulter'), 'superarmor', 2, { chance: 50 }),
        st(rand('enemy', 2), 'weakened', 2),
        st(role('enemy', 'assaulter'), 'upwind', 2),
      ],
    },
  },
  {
    id: 'human-path-pain', name: 'Human Path Pain', role: A, gender: 'male',
    talents: [...fromSheet('human-path-pain'), { to: role('ally', 'assaulter'), mods: [m('def', 40)] }],
    special: {
      name: 'Spéciale', hits: [allHit(330)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'windEscape', 2, { value: 10 }),
        st(rand('ally', 2), 'bond', 2), // « wind bond » sur des alliés : lu comme Bond State
        debuff(ENEMIES, 2, [m('atk', -30, 'icon')]),
        st(rand('enemy', 2), 'upwind', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'reanimated-deidara', name: 'Reanimated Deidara', role: A, gender: 'male',
    talents: [...fromSheet('reanimated-deidara'), self(m('ignoreDef', 40))],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        pen(35), heal(50),
        st(SELF, 'sSuperDodge', 2),
        st(rand('ally', 2), 'shatterStorm', 3),
        st(rand('enemy', 2), 'upwind', 3),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'kusanagi-kyo', name: 'Kusanagi Kyo', role: A, gender: 'male',
    talents: [...fromSheet('kusanagi-kyo'), immune('superDodge', 'sSuperDodge')],
    awakenings: [
      { name: 'Éveil 1', talents: [
        { to: nature('ally', ['water', 'earth', 'fire']), mods: [m('ccRes', 25), m('immuneIgnoreDef', 40)] },
        { to: ENEMIES, mods: [m('atk', -30), m('punch', -40)] },
      ] },
      { name: 'Éveil 2', replacePrevious: true, talents: [
        { to: nature('ally', ['water', 'earth', 'fire']), mods: [m('ccRate', 30), m('ignoreDef', 40)] },
        { to: ENEMIES, mods: [m('atk', -20)] },
      ] },
    ],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'bond', 2),
        st(rand('enemy', 2), 'chaoticStorm', 3),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'hayate-yugao', name: 'Hayate & Yugao', role: A,
    talents: [...fromSheet('hayate-yugao'), immune('superDodge', 'sSuperDodge'), self(m('ignoreEnemyAtk', 10))],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 90 }),
        st(rand('ally', 1), 'superarmor', 2, { chance: 90 }),
        st(rand('enemy', 2), 'chaoticStorm', 2, { chance: 90 }),
        st(rand('enemy', 1), 'corrosion', 2, { chance: 90 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: '7-tails-fuu', name: '7 tails Fuu', role: A, gender: 'female',
    talents: [...fromSheet('7-tails-fuu'), immune('superDodge', 'sSuperDodge'), self(m('ignoreEnemyAtk', 10)),
      { on: 'attacked', chance: 30, effects: [cleanseAllies] }],
    awakenings: [{ name: 'Éveil', talents: [self(m('shieldPierce', 25))] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'bond', 2),
        st(rand('ally', 2), 'shatterStorm', 2),
        st(rand('enemy', 2), 'upwind', 2),
        st(rand('enemy', 2), 'painfulWill', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'hiruko-sasori', name: 'Hiruko Sasori', role: A, gender: 'male',
    talents: [...fromSheet('hiruko-sasori'), immune('superDodge', 'sSuperDodge'), self(m('crit', 30))],
    awakenings: [{ name: 'Éveil', talents: [self(m('sCrit', 25))] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'windEscape', 2, { value: 10 }),
        st(rand('enemy', 2), 'corrosion', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'danzo-root-hokage', name: 'Danzo Root Hokage', role: A, gender: 'male',
    talents: [
      ...fromSheet('danzo-root-hokage'), immune('superDodge', 'sSuperDodge'), self(m('crit', 40)),
      { to: role('enemy', ['assaulter', 'vanguard']), mods: [m('atk', -30)] },
      { to: role('enemy', 'supporter'), mods: [m('atk', -40)] },
      { on: 'attacked', effects: [{ to: SELF, cleanse: 'debuff' }] },
    ],
    awakenings: [{ name: 'Éveil', talents: [self(m('sCrit', 25))] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'pyroblast', 2),
        st(rand('enemy', 2), 'untreatment', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'eveil-de-kawaki', name: 'Éveil de Kawaki', role: A, gender: 'male',
    talents: [...fromSheet('eveil-de-kawaki'), immune('superDodge', 'sSuperDodge'),
      { to: named('ally', 'mitsuki'), mods: [m('ccRes', 10), m('dr', -20)] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 2), 'pyroblast', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        st(rand('enemy', 1), 'chaoticStorm', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'gai-porte-de-la-mort', name: 'Gai porte de la mort', role: A, gender: 'male',
    talents: [...fromSheet('gai-porte-de-la-mort'), immune('superDodge', 'sSuperDodge'), self(m('punch', 50))],
    awakenings: [{ name: 'Éveil 1', talents: [{ on: 'death', effects: [st(rand('enemy', 1), 'corrosion', 2, { value: 40 })] }] }],
    special: {
      name: 'Spéciale', hits: [allHit(280)], fury: { self: 30, allies: 68 }, // tel qu'écrit dans le classeur
      effects: [
        heal(50),
        st(role('ally', 'assaulter'), 'shatterStorm', 2, { value: 10 }),
        st(rand('enemy', 2), 'critResReduction', 2, { value: 20 }),
        st(role('ally', 'assaulter'), 'furyShield', 2, { value: 30 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'kakashi-kamui', name: 'Kakashi Kamui', role: A, gender: 'male',
    talents: [...fromSheet('kakashi-kamui'), immune('superDodge', 'sSuperDodge'), self(m('ignoreEnemyAtk', 10)),
      { to: role('ally', 'supporter'), mods: [m('ccRate', 10)] }],
    awakenings: [{ name: 'Éveil 1', talents: [
      { on: 'acted', effects: [heal(30), st(rand('enemy', 1), 'corrosion', 2, { chance: 50 })] },
    ] }],
    special: {
      name: 'Spéciale', hits: [allHit(300), allHit(150, 'magic')], fury: FURY_68, // fury non précisée dans le classeur
      effects: [
        heal(50),
        st(ALLIES, 'superDefense', 2, { value: 20 }),
        st(rand('enemy', 2), 'corrosion', 2, { value: 15 }),
        st(rand('enemy', 3), 'armorBreak', 2, { value: 30 }),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'naruto-six-tails-mode', name: 'Naruto [Six-Tails Mode]', role: A, gender: 'male',
    talents: [...fromSheet('naruto-six-tails-mode'), immune('superDodge', 'sSuperDodge'), self(m('ignoreEnemyAtk', 10))],
    awakenings: [{ name: 'Éveil 1', talents: [{ on: 'death', effects: [pen(100, ENEMIES, 'physical')] }] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('enemy', 2), 'chaoticStorm', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        st(rand('ally', 2), 'superDefense', 2),
        buff(VG, 2, [m('speed', 15, 'icon')]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'sasuke-taka', name: 'Sasuke [Taka]', role: A, gender: 'male',
    talents: [...fromSheet('sasuke-taka'), immune('superDodge', 'sSuperDodge'),
      self(m('ccRes', 55), m('reflectRes', 150), m('ignoreEnemyAtk', 10))],
    awakenings: [{ name: 'Éveil 1', talents: [{ on: 'attacked', chance: 30, effects: [dispelEnemies] }] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        pen(50), heal(50),
        st(role('enemy', 'vanguard'), 'seal', 2),
        st(rand('enemy', 3), 'healReduction', 2, { value: 70 }),
        st(rand('enemy', 3), 'armorBreak', 2),
        cleanseAllies,
      ],
    },
  },
];
