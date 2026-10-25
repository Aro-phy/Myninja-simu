// Supports. Bonus d'équipe importés du classeur « Formation ninja » (fromSheet) ;
// effets particuliers et compétences transcrits depuis le texte français du même classeur.
import {
  ALLIES, ENEMIES, SELF, TARGET, rand, role, nature, lowestHp, highestHp, m, buff, debuff, st, FURY_68,
  fromSheet, named, gendered, natureTalents, SHEET_DATA,
} from './helpers.js';

const S = 'supporter';
const cleanseAllies = { to: ALLIES, cleanse: 'debuff' };
const dispelEnemies = { to: ENEMIES, cleanse: 'buff' };
const heal = (pct, to = ALLIES) => ({ to, heal: pct });
const allHit = (pct, attackType) => ({ target: ENEMIES, pct, ...(attackType ? { attackType } : {}) });
const oneHit = (pct) => ({ target: rand('enemy', 1), pct });
const pen = (pct, to = TARGET, attackType) => ({ to, penetration: pct, ...(attackType ? { attackType } : {}) });
const self = (...mods) => ({ to: SELF, mods });
const immune = (...ids) => ({ to: SELF, immune: ids });
const VG_AS = role('ally', ['vanguard', 'assaulter']);
const E_VG_AS = role('enemy', ['vanguard', 'assaulter']);
const pick = (side, p) => ({ side, pick: p });
const byRole = (side, v, a, s, stat) => [
  { to: role(side, 'vanguard'), mods: [m(stat, v)] },
  { to: role(side, 'assaulter'), mods: [m(stat, a)] },
  { to: role(side, 'supporter'), mods: [m(stat, s)] },
];
// Groupe d'effets posés « avec 90 % de chance » (Hayate & Yugao, Uchiha Sarada).
const ninetyGroup = [
  st(ENEMIES, 'curseFixation', 2, { chance: 90 }),
  st(rand('ally', 1), 'superarmor', 2, { chance: 90 }),
  st(rand('enemy', 2), 'chaoticStorm', 2, { chance: 90 }),
  st(rand('enemy', 1), 'corrosion', 2, { chance: 90 }),
];

export const SUPPORTERS = [
  {
    id: 'christmas-mito', name: 'Christmas Mito', role: S, gender: 'female',
    talents: [...fromSheet('christmas-mito'), immune('superDodge')],
    normal: {
      name: 'Attaque normale', hits: [allHit(350)],
      effects: [
        st(role('ally', 'vanguard'), 'ccFree', 2),
        st(role('ally', 'supporter'), 'ccFree', 2, { chance: 50 }),
        st(rand('enemy', 1), 'imprison', 2),
        st(rand('enemy', 2), 'upwind', 2),
        { to: rand('ally', 2), cleanse: 'debuff' },
        st(role('enemy', 'vanguard'), 'chaos', 2, { chance: 110 }),
        heal(100),
      ],
    },
    special: { name: 'Spéciale', hits: [allHit(300)], effects: [st(ALLIES, 'shatterStorm', 2), dispelEnemies] },
  },
  {
    id: 'reanimated-hidan', name: 'Reanimated Hidan', role: S, gender: 'male',
    talents: [...fromSheet('reanimated-hidan'),
      { to: role('ally', ['assaulter', 'vanguard']), mods: [m('block', 35)] },
      ...byRole('ally', -25, -50, -30, 'dmgTaken')],
    special: {
      name: 'Spéciale', hits: [allHit(350)], fury: FURY_68,
      effects: [
        { to: ENEMIES, dot: { name: 'Bleed', pct: 120, duration: 2 } },
        st(ENEMIES, 'chaos', 2, { chance: 90 }),
        st(ENEMIES, 'disable', 2),
        st(role('enemy', 'assaulter'), 'painfulWill', 2),
        buff(role('ally', 'vanguard'), 2, [m('speed', 40, 'icon')]),
      ],
    },
  },
  {
    id: 'hyakki-sasori', name: 'Hyakki Sasori', role: S, gender: 'male',
    talents: [...fromSheet('hyakki-sasori'), immune('void'),
      { to: nature('enemy', 'fire'), mods: [m('dotBonus', -30)] }],
    awakenings: [{ name: 'Éveil', talents: [immune('charm')] }],
    normal: {
      name: 'Attaque normale', hits: [allHit(330)],
      effects: [
        st(ENEMIES, 'void', 2, { chance: 90 }),
        st(ENEMIES, 'windBound', 2, { chance: 90 }),
        st(ALLIES, 'soulPrison', 2),
        { to: rand('enemy', 3), cleanse: 'buff' },
        { to: nature('ally', 'thunder'), hot: 90, duration: 2 },
        st(role('ally', ['assaulter', 'vanguard']), 'shatterStorm', 2),
      ],
    },
    special: {
      name: 'Spéciale', hits: [allHit(300)],
      effects: [
        st(ENEMIES, 'imprison', 2, { chance: 90 }),
        { to: ENEMIES, dot: { name: 'Poison', pct: 120, duration: 3 } },
        cleanseAllies,
        st(role('ally', ['vanguard', 'assaulter']), 'furyShield', 3),
        debuff(ENEMIES, 3, [m('antiCrit', -40), m('recoveryCut', 50)]),
      ],
    },
  },
  {
    id: 'kurotsuchi', name: 'Kurotsuchi', role: S, gender: 'female',
    talents: [...fromSheet('kurotsuchi'), self(m('immuneIgnoreDef', 40)),
      { to: role('ally', ['assaulter', 'supporter']), mods: [m('penMalus', 30)] },
      { to: role('enemy', 'supporter'), mods: [m('ccRate', -20)] }],
    special: {
      name: 'Spéciale', hits: [allHit(250)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'imprison', 2, { chance: 90 }), // « l'un emprisonnement et gel, l'autre pétrification et effondrement » : simplifié
        st(role('enemy', 'supporter'), 'weakened', 2),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon'), m('punch', -30)]),
        buff(role('ally', 'supporter'), 2, [m('def', 200, 'icon')]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'utakata', name: 'Utakata', role: S, gender: 'male',
    talents: [...fromSheet('utakata'), immune('superDodge'), ...byRole('ally', 30, 30, 50, 'hp'),
      { to: nature('enemy', ['fire', 'thunder']), mods: [m('finalDmg', -40)] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        pen(40),
        st(rand('enemy', 2), 'upwind', 2),
        st(lowestHp('enemy'), 'poisonousWind', 2),
        { to: ENEMIES, dot: { name: 'Bleed', pct: 120, duration: 2 } },
        { to: ENEMIES, dot: { name: 'Unification', pct: 120, duration: 2 } },
        buff(VG_AS, 2, [m('atk', 40, 'icon'), m('speed', 40, 'icon')]),
        debuff(nature('enemy', 'fire'), 2, [m('air', -50)]),
        debuff(nature('enemy', 'thunder'), 2, [m('atk', -40, 'icon')]),
      ],
    },
  },
  {
    id: 'terumi-mei-d-ete', name: 'Terumi Mei d\'été', role: S, gender: 'female',
    talents: [...fromSheet('terumi-mei-d-ete'), immune('superDodge', 'chaos'), self(m('ccRes', 30)),
      { on: 'attacked', chance: 35, effects: [st(role('ally', 'supporter'), 'ccFree', 2)] }],
    special: {
      name: 'Spéciale', fury: FURY_68,
      hits: [{ target: role('enemy', 'vanguard'), pct: 700 }, { target: lowestHp('enemy'), pct: 350 }],
      effects: [
        pen(100, highestHp('enemy'), 'magic'),
        st(rand('enemy', 1), 'charm', 2),
        st(ENEMIES, 'freeze', 2, { chance: 90 }),
        heal(120),
        st(role('enemy', 'supporter'), 'weakened', 2),
        buff(nature('ally', 'water'), 2, [m('ccRes', 30), m('def', 50, 'icon')]),
      ],
    },
  },
  {
    id: 'naruto-baryon', name: 'Naruto Baryon', role: S, gender: 'male',
    talents: [...fromSheet('naruto-baryon'),
      { to: role('ally', ['assaulter', 'supporter']), mods: [m('punch', 25), m('atk', 30)] },
      { to: role('enemy', ['assaulter', 'vanguard']), mods: [m('finalDmg', -30)] },
      { to: role('enemy', ['assaulter', 'supporter']), mods: [m('atk', -30)] }],
    awakenings: [{ name: 'Éveil', talents: [immune('poisonousWind')] }],
    special: {
      name: 'Spéciale', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 200, assaulter: 420, supporter: 200 } }],
      effects: [
        st(ENEMIES, 'windBound', 2, { chance: 90 }),
        st(ENEMIES, 'imprison', 2, { chance: 90 }),
        st(rand('enemy', 2), 'weakened', 2),
        st(VG_AS, 'pyroblast', 2),
        cleanseAllies, heal(50),
      ],
    },
  },
  {
    id: 'snow-sakura', name: 'Snow Sakura', role: S, gender: 'female',
    talents: [...fromSheet('snow-sakura'), immune('superDodge'),
      { to: gendered('ally', 'male'), mods: [m('dr', 30)] },
      { to: ALLIES, mods: [m('crit', 30)] }],
    special: {
      name: 'Spéciale', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 500, assaulter: 200, supporter: 200 } }],
      effects: [
        st(rand('enemy', 1), 'charm', 2, { chance: 150 }),
        st(rand('ally', 2), 'ccFree', 2),
        st(role('ally', 'assaulter'), 'shatterStorm', 2),
        st(gendered('enemy', 'female'), 'corrosion', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'neji-ying-yang', name: 'Neji Ying Yang', role: S, gender: 'male',
    talents: [...fromSheet('neji-ying-yang'), { on: 'attacked', chance: 40, effects: [st(ALLIES, 'ccFree', 2)] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 90 }),
        st(rand('enemy', 2), 'seal', 2, { chance: 90 }),
        cleanseAllies,
        st(role('ally', 'vanguard'), 'bond', 2),
        st(role('ally', 'assaulter'), 'pyroblast', 2),
        st(rand('ally', 1), 'superarmor', 2),
      ],
    },
  },
  {
    id: 'uzumaki-menma', name: 'Uzumaki Menma', role: S, gender: 'male',
    talents: [...fromSheet('uzumaki-menma'),
      { on: 'attacked', effects: [heal(40)] },
      { on: 'attacked', chance: 30, effects: [{ to: rand('ally', 2), cleanse: 'debuff' }] }],
    awakenings: [{ name: 'Éveil', talents: [immune('freeze'), { on: 'attacked', chance: 30, effects: [{ to: rand('ally', 2), cleanse: 'debuff' }] }] }],
    special: {
      name: 'Spéciale', hits: [allHit(250)], fury: FURY_68, // fury non précisée dans le classeur
      effects: [
        st(ENEMIES, 'imprison', 2, { chance: 90 }),
        st(rand('enemy', 1), 'poisonousWind', 2, { chance: 90 }),
        st(role('ally', 'assaulter'), 'shatterStorm', 2),
        st(role('ally', 'supporter'), 'bond', 2),
        debuff(ENEMIES, 2, [m('finalDmg', -30), m('atk', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'pain-d-ete', name: 'Pain d\'été', role: S, gender: 'male',
    talents: [...fromSheet('pain-d-ete'),
      { on: 'attacked', chance: 40, effects: [st(role('enemy', 'assaulter'), 'weakened', 1)] },
      { on: 'attacked', chance: 75, effects: [{ to: rand('enemy', 2), fury: -45 }, { to: { side: 'ally', pick: 'all', excludeSelf: true }, fury: 30 }] }],
    special: {
      name: 'Spéciale', hits: [allHit(200)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 90 }),
        st(rand('enemy', 2), 'untreatment', 2),
        st(rand('enemy', 2), 'weakened', 2), st(rand('enemy', 2), 'corrosion', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: '9-tails-minato', name: '9 tails Minato', role: S, gender: 'male',
    talents: [...fromSheet('9-tails-minato'), immune('superDodge'),
      { to: named('ally', 'kushina'), mods: [m('dr', 30)] },
      { to: named('ally', 'naruto'), mods: [m('def', 40)] }],
    special: {
      name: 'Spéciale', hits: [oneHit(600)], fury: { self: 100, allies: 50 },
      effects: [
        st(SELF, 'sSuperDodge', 2, { chance: 50 }),
        st(rand('ally', 2), 'superDodge', 2, { chance: 50 }),
        st(role('ally', 'assaulter'), 'shatterStorm', 2),
        st(rand('enemy', 2), 'upwind', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'kamado-nezuko', name: 'Kamado Nezuko', role: S, gender: 'female',
    talents: [...fromSheet('kamado-nezuko'), immune('superDodge'),
      { to: pick('ally', 'highest-dr'), mods: [m('finalDmg', 25)] },
      { to: pick('ally', 'lowest-ccres'), mods: [m('finalReduction', 25)] },
      { on: 'attacked', chance: 40, effects: [heal(40), st(pick('ally', 'lowest-ccres'), 'windEscape', 2)] }],
    special: {
      name: 'Spéciale', hits: [{ target: role('enemy', 'assaulter'), pct: 390 }], fury: FURY_68,
      effects: [
        st(ENEMIES, 'seal', 2, { chance: 90 }), st(ENEMIES, 'freeze', 2, { chance: 90 }),
        st(ENEMIES, 'poisonousWind', 2),
        st(pick('ally', 'highest-speed'), 'shielding', 2, { chance: 35 }),
        st(pick('ally', 'lowest-speed'), 'superarmor', 2, { chance: 35 }),
        st(VG_AS, 'pyroblast', 2),
        buff(ALLIES, 2, [m('atk', 30, 'icon')]),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon')]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'orochimaru-boruto', name: 'Orochimaru-Boruto', role: S, gender: 'male',
    talents: [...fromSheet('orochimaru-boruto'),
      { to: E_VG_AS, mods: [m('atk', -30)] },
      { to: nature('ally', ['earth', 'water']), mods: [m('dr', 30)] }],
    special: {
      name: 'Spéciale', hits: [oneHit(420)], fury: FURY_68,
      effects: [
        st(TARGET, 'windBound', 2, { chance: 90 }),
        st(TARGET, 'curseFixation', 2, { chance: 90 }),
        st(lowestHp('enemy'), 'poisonousWind', 2),
        st(VG_AS, 'pyroblast', 2),
        st(role('ally', 'supporter'), 'windEscape', 2, { chance: 10 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'uchiha-hikari', name: 'Uchiha Hikari', role: S, gender: 'female',
    talents: [...fromSheet('uchiha-hikari'), { on: 'attacked', chance: 35, effects: [{ to: rand('ally', 2), cleanse: 'debuff' }] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 90 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'bond', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'otsutsuki-isshiki', name: 'Otsutsuki Isshiki', role: S, gender: 'male',
    talents: [...fromSheet('otsutsuki-isshiki'),
      { to: pick('enemy', 'highest-dr'), mods: [m('ccRes', -10)] },
      { to: pick('ally', 'highest-dr'), mods: [m('speed', 5)] }],
    awakenings: [{ name: 'Éveil', talents: [{ to: ALLIES, mods: [m('sAtk', 40)] }] }],
    special: {
      name: 'Spéciale', fury: { self: 100, allies: 68 },
      hitChoices: [
        { chance: 25, hits: [oneHit(550)] },
        { chance: 25, hits: [{ target: role('enemy', 'assaulter'), pct: 450 }] },
        { chance: 25, hits: [{ target: role('enemy', 'vanguard'), pct: 600 }] },
        { chance: 25, hits: [{ target: rand('enemy', 2), pct: 400 }] },
      ],
      effects: [
        cleanseAllies,
        st(E_VG_AS, 'upwind', 3, { chance: 40 }),
        st(role('ally', 'assaulter'), 'shatterStorm', 3, { chance: 40 }),
        st(rand('enemy', 1), 'corrosion', 3, { chance: 60, value: 40 }),
      ],
    },
  },
  {
    id: 'indra-ashura', name: 'Indra & Ashura', role: S, gender: 'male',
    talents: [...fromSheet('indra-ashura'),
      { to: E_VG_AS, mods: [m('atk', -30)] },
      { to: ENEMIES, scale: 10, mods: [m('def', -6)] },
      { to: named('enemy', 'hashirama'), mods: [m('air', -10)] },
      { to: named('ally', '7th hokage'), mods: [m('dr', 30)] }],
    special: {
      name: 'Spéciale', hits: [oneHit(420)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 90 }), st(ENEMIES, 'freeze', 2, { chance: 90 }),
        st(VG_AS, 'pyroblast', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'hinata-the-last', name: 'Hinata The Last', role: S, gender: 'female',
    talents: [...fromSheet('hinata-the-last'), { to: pick('ally', 'highest-dr'), mods: [m('speed', 5)] }],
    special: {
      name: 'Spéciale', hits: [oneHit(600)], fury: FURY_68,
      effects: [
        st(rand('ally', 2), 'superDodge', 2, { chance: 50 }),
        st(VG_AS, 'shatterStorm', 2),
        st(rand('enemy', 2), 'chaoticStorm', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'susanoo-itachi-sasuke', name: 'Susanoo Itachi & Sasuke', role: S, gender: 'male',
    talents: [...fromSheet('susanoo-itachi-sasuke'), self(m('ccRes', 30), m('penMalus', 20)),
      { to: pick('ally', 'highest-air'), mods: [m('hp', 30)] }],
    awakenings: [{ name: 'Éveil', talents: [{ to: role('enemy', 'vanguard'), mods: [m('ccRes', -15)] }] }],
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(pick('ally', 'highest-speed'), 'bond', 2, { chance: 50 }),
        buff(ALLIES, 2, [m('finalReduction', 35)]),
        st(role('enemy', 'vanguard'), 'chaoticStorm', 2, { chance: 50 }),
        st(role('enemy', 'assaulter'), 'chaoticStorm', 2, { chance: 35 }),
        st(E_VG_AS, 'painfulWill', 2),
        debuff(ENEMIES, 2, [m('dr', -30)]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'mitarashi-anko', name: 'Mitarashi Anko', role: S, gender: 'female',
    talents: [...fromSheet('mitarashi-anko'),
      { to: E_VG_AS, mods: [m('atk', -20)] },
      { to: role('ally', 'supporter'), mods: [m('punch', 15)] }],
    special: {
      name: 'Spéciale', hits: [oneHit(420)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 90 }), st(ENEMIES, 'imprison', 2, { chance: 90 }),
        st(VG_AS, 'pyroblast', 2),
        st(rand('enemy', 1), 'upwind', 2),
        debuff(ENEMIES, 2, [m('def', -30, 'icon')]),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'uchiha-sarada', name: 'Uchiha Sarada', role: S, gender: 'female',
    talents: [...fromSheet('uchiha-sarada'),
      { on: 'attacked', effects: [heal(30)] },
      { on: 'attacked', chance: 30, effects: [{ to: rand('enemy', 2), cleanse: 'buff' }] },
      { to: { side: 'ally', pick: 'all', main: true }, mods: [m('defCutRes', 30)] }],
    special: { name: 'Spéciale', hits: [allHit(300)], fury: FURY_68, effects: [...ninetyGroup, dispelEnemies] },
  },
  {
    id: 'legende-madara', name: 'Légende Madara', role: S, gender: 'male',
    talents: [...fromSheet('legende-madara'), immune('superDodge', 'sSuperDodge', 'disable')],
    awakenings: [{ name: 'Éveil', talents: [{ to: pick('ally', 'highest-dr'), mods: [m('speed', 5)] }] }],
    special: {
      name: 'Spéciale', hits: [oneHit(600)], fury: FURY_68,
      effects: [
        st(VG_AS, 'shatterStorm', 2),
        st(role('ally', 'supporter'), 'bond', 2, { chance: 35 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 1), 'upwind', 2),
        st(nature('enemy', 'water'), 'corrosion', 2, { chance: 15 }),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'awaken-mitsuki', name: 'Awaken Mitsuki', role: S, gender: 'male',
    talents: [...fromSheet('awaken-mitsuki'), self(m('ccRes', 30), m('penMalus', 20)),
      { to: E_VG_AS, mods: [m('atk', -30)] },
      { to: role('enemy', 'supporter'), mods: [m('atk', -40)] }],
    awakenings: [{ name: 'Éveil', talents: [
      { on: 'attacked', effects: [heal(30)] },
      { on: 'attacked', chance: 60, effects: [{ to: rand('enemy', 1), cleanse: 'buff' }] },
    ] }],
    special: {
      name: 'Spéciale', hits: [oneHit(400)], fury: FURY_68,
      effects: [
        st(E_VG_AS, 'painfulWill', 2),
        debuff(ENEMIES, 2, [m('punch', -20)]),
        st(rand('ally', 2), 'windEscape', 2, { value: 10 }),
        st(role('enemy', ['supporter', 'assaulter']), 'dispirited', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'natsu-dragneel', name: 'Natsu Dragneel', role: S, gender: 'male',
    talents: [...fromSheet('natsu-dragneel-eveil-1').filter((t) => !t.to?.nature), immune('superDodge', 'sSuperDodge')],
    awakenings: [
      { name: 'Éveil 1', talents: natureTalents(SHEET_DATA['natsu-dragneel-eveil-1'].natures),
        specialHits: [oneHit(550)] },
      { name: 'Éveil 2', replacePrevious: true, talents: natureTalents(SHEET_DATA['natsu-dragneel-eveil-2'].natures) },
    ],
    special: {
      name: 'Spéciale', hits: [allHit(330)], fury: FURY_68,
      effects: [
        st(VG_AS, 'shatterStorm', 2),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 3), 'armorBreak', 2, { value: 30 }),
        st(rand('enemy', 1), 'critResReduction', 2, { value: 20 }),
        st(rand('enemy', 2), 'painfulWill', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'xmas-temari', name: 'Xmas Temari', role: S, gender: 'female',
    talents: [...fromSheet('xmas-temari'),
      { to: role('ally', 'assaulter'), mods: [m('air', 50)] },
      { to: E_VG_AS, mods: [m('atk', -30)] },
      { to: role('enemy', 'supporter'), mods: [m('atk', -35)] },
      { on: 'attacked', effects: [st(role('ally', 'assaulter'), 'pyroblast', 2, { value: 15 })] },
      { on: 'attacked', chance: 30, effects: [{ to: rand('enemy', 2), cleanse: 'buff' }] }],
    // Éveil 1 (conditionnel selon les PV comparés à l'attaquant) non modélisé pour l'instant.
    special: {
      name: 'Spéciale', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 90 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 2), 'armorBreak', 2, { value: 30 }),
        debuff(ENEMIES, 2, [m('finalDmg', -30)]),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'shikamaru-nara', name: 'Shikamaru Nara', role: S, gender: 'male',
    talents: [...fromSheet('shikamaru-nara'), { to: role('ally', 'supporter'), mods: [m('punch', 20)] }],
    awakenings: [{ name: 'Éveil 1', talents: [{ to: ALLIES, mods: [m('sAtk', 35)] }, { to: E_VG_AS, mods: [m('atk', -30)] }] }],
    special: {
      name: 'Spéciale', hits: [oneHit(450)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 90 }), st(ENEMIES, 'windBound', 2, { chance: 90 }),
        st(VG_AS, 'pyroblast', 2, { value: 20 }),
        st(rand('enemy', 1), 'critResReduction', 2, { value: 30 }),
        debuff(ENEMIES, 2, [m('def', -30, 'icon')]),
        buff(role('ally', 'supporter'), 2, [m('dr', 30)]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'madara-moon-eyes', name: 'Madara moon eyes', role: S, gender: 'male',
    talents: [...fromSheet('madara-moon-eyes'), self(m('ccRes', 45))],
    awakenings: [{ name: 'Éveil 1', talents: [{ on: 'attacked', chance: 35, effects: [{ to: rand('ally', 2), cleanse: 'debuff' }] }] }],
    special: {
      name: 'Spéciale', hits: [oneHit(200)], fury: FURY_68,
      effects: [
        st(SELF, 'superarmor', 2),
        debuff(ENEMIES, 2, [m('punch', -45), m('ccRate', -30)], 'punch −45 %, taux de contrôle −30 % (non dissipable)'),
        st(ENEMIES, 'dispirited', 2, { value: 25 }),
        st(role('ally', 'assaulter'), 'shatterStorm', 2, { value: 20 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'sakura-tsunade', name: 'Sakura & Tsunade', role: S, gender: 'female',
    talents: [...fromSheet('sakura-tsunade'), immune('superDodge', 'sSuperDodge'), self(m('reflectRes', 150)),
      { to: SELF, scale: 10, mods: [m('atk', 3)] },
      { to: ALLIES, scale: 10, mods: [m('finalDmg', 4)] }],
    awakenings: [{ name: 'Éveil 1', talents: [{ to: ENEMIES, mods: [m('atk', -12)] }] }],
    special: {
      name: 'Spéciale', fury: FURY_68,
      pre: [{ to: SELF, hpLossPct: 70 }],
      hits: [oneHit(610), { target: lowestHp('enemy'), pct: 150, attackType: 'physical' }],
      effects: [
        st(VG_AS, 'shatterStorm', 2),
        st(role('ally', 'assaulter'), 'furyShield', 2, { value: 20 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 1), 'critResReduction', 2, { value: 20 }),
        { to: rand('enemy', 1), chance: 60, dot: { name: 'Sticky acid', pct: 35, duration: 2 } },
        { ...st(SELF, 'untreatment', 1) },
        cleanseAllies,
      ],
    },
  },
  {
    id: 'orochimaru-akatsuki', name: 'Orochimaru [Akatsuki]', role: S, gender: 'male',
    talents: [...fromSheet('orochimaru-akatsuki'), { on: 'attacked', chance: 35, effects: [cleanseAllies] }],
    awakenings: [{ name: 'Éveil 1', talents: [{ to: ALLIES, mods: [m('finalDmg', 25)] }] }],
    special: {
      name: 'Spéciale', hits: [oneHit(300)], fury: FURY_68,
      effects: [
        st(rand('enemy', 1), 'charm', 2),
        st(ENEMIES, 'curseFixation', 2, { chance: 90 }),
        buff(VG_AS, 2, [m('atk', 25, 'icon')]),
        st(VG_AS, 'pyroblast', 2, { value: 20 }),
        st(rand('enemy', 2), 'armorBreak', 2, { value: 30 }),
        st(rand('enemy', 2), 'untreatment', 2, { chance: 65 }),
        cleanseAllies,
      ],
    },
  },
];
