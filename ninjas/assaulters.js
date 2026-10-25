// Attaquants. Transcription des descriptions du wiki du jeu.
// base : ligne de base du talent (déjà comptée dans les stats saisies).
import {
  ALLIES, ALLIES_BUT_SELF, ENEMIES, SELF, TARGET, ATTACKER, rand, role, nature, lowestHp, highestHp,
  m, buff, debuff, st, FURY_68, FURY_50, named, gendered,
} from './helpers.js';

const A = 'assaulter';
const cleanseAllies = { to: ALLIES, cleanse: 'debuff' };
const cleanseSelf = { to: SELF, cleanse: 'debuff' };
const dispelEnemies = { to: ENEMIES, cleanse: 'buff' };
const heal = (pct, to = ALLIES) => ({ to, heal: pct });
const allHit = (pct, attackType) => ({ target: ENEMIES, pct, ...(attackType ? { attackType } : {}) });
const pen = (pct, to = TARGET, attackType) => ({ to, penetration: pct, ...(attackType ? { attackType } : {}) });
const self = (...mods) => ({ to: SELF, mods });
const allies = (...mods) => ({ to: ALLIES, mods });
const enemies = (...mods) => ({ to: ENEMIES, mods });
const immune = (...ids) => ({ to: SELF, immune: ids });
const nat = (side, n, ...mods) => ({ to: nature(side, n), mods });
const rl = (side, r, ...mods) => ({ to: role(side, r), mods });
const VG = role('ally', 'vanguard');
const VG_AS = role('ally', ['vanguard', 'assaulter']);
const AS_SU = role('ally', ['assaulter', 'supporter']);
const E_VG_AS = role('enemy', ['vanguard', 'assaulter']);
const EFT = ['earth', 'fire', 'thunder'];
const WEF = ['water', 'earth', 'fire'];
const byRole = (side, [v, a, s], stat) => [rl(side, 'vanguard', m(stat, v)), rl(side, 'assaulter', m(stat, a)), rl(side, 'supporter', m(stat, s))];
const attacked = (chance, ...effects) => ({ on: 'attacked', ...(chance < 100 ? { chance } : {}), effects });
const onDeath = (chance, ...effects) => ({ on: 'death', ...(chance < 100 ? { chance } : {}), effects });
// Immunités courantes : « Immune to X% control rate, 150% reflect rate, ... »
const resist = (cc, reflect = 150, extra = []) => self(m('ccRes', cc), ...(reflect ? [m('reflectRes', reflect)] : []), ...extra);
const either = (...groups) => ({ oneOf: groups });

export const ASSAULTERS = [
  // ---------- Haut niveau (vitesse d'équipe 118 %) ----------
  {
    id: 'sasuke-taka', name: 'Sasuke [Taka]', role: A, gender: 'male', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 40), m('atk', 30), m('finalDmg', 25), m('ccRes', 25), m('def', 30), m('immuneIgnoreDef', 20)),
      enemies(m('crit', -20), m('air', -30), m('atk', -30), m('dr', -30), m('punch', -45)),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'imprison', 'weakened'),
    ],
    awakenings: [{ name: 'Rinnegan', talents: [attacked(30, dispelEnemies)] }],
    special: {
      name: 'Susanoo Arrow', hits: [allHit(300)], fury: FURY_68,
      effects: [
        pen(50, ENEMIES), heal(50),
        st(role('enemy', 'vanguard'), 'seal', 2),
        st(rand('enemy', 3), 'healReduction', 2, { value: 70 }),
        st(rand('enemy', 3), 'armorBreak', 2, { value: 30 }),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'naruto-six-tails-mode', name: 'Naruto [Six-Tails Mode]', role: A, gender: 'male', base: { speed: 87, dr: 130, air: 75 },
    talents: [
      allies(m('speed', 118), m('atk', 30), m('dr', 30), m('finalDmg', 25), m('hp', 35)),
      nat('ally', EFT, m('ccRate', 30), m('punch', 25)),
      enemies(m('atk', -15), m('def', -35)),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'weakened', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Violent Nature', talents: [onDeath(100, { to: lowestHp('enemy'), strike: 120, attackType: 'physical' })] }],
    special: {
      name: 'Tailed Beast Bomb', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('enemy', 2), 'chaoticStorm', 2, { value: 20 }),
        st(rand('enemy', 2), 'corrosion', 2, { value: 30 }),
        st(rand('ally', 2), 'strong', 2, { value: 20 }),
        buff(VG, 2, [m('speed', 15, 'icon')]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'kakashi-kamui', name: 'Kakashi Kamui', role: A, gender: 'male', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 35), m('atk', 30), m('finalReduction', 30), m('immuneIgnoreDef', 30)),
      nat('ally', EFT, m('def', 30), m('ccRes', 25)),
      rl('ally', 'supporter', m('ccRes', 10)),
      enemies(m('air', -30), m('atk', -30), m('dr', -40), m('punch', -45)),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'imprison', 'weakened'),
    ],
    awakenings: [{ name: 'Shiden', talents: [attacked(100, heal(30), st(rand('enemy', 1), 'corrosion', 2, { chance: 50, value: 15 }))] }],
    special: {
      name: 'Susanoo: Kamui Strike', hits: [allHit(300), allHit(150, 'magic')], fury: FURY_68,
      effects: [
        heal(50),
        st(ALLIES, 'superDefense', 2, { value: 20 }),
        cleanseAllies,
        st(rand('enemy', 2), 'corrosion', 2, { value: 15 }),
        st(rand('enemy', 3), 'armorBreak', 2, { value: 30 }),
      ],
    },
  },
  {
    id: 'gai-porte-de-la-mort', name: 'Might Gai (Gate of Death)', role: A, gender: 'male', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      self(m('punch', 50)),
      allies(m('speed', 118), m('finalDmg', 20), m('atk', 30), m('hp', 40)),
      nat('ally', EFT, m('ccRate', 30), m('punch', 25)),
      enemies(m('atk', -20), m('def', -40), m('air', -45)),
      resist(55),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'weakened', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Morning Peacock', talents: [onDeath(100, st(rand('enemy', 1), 'corrosion', 2, { value: 40 }))] }],
    special: {
      name: 'Evening Elephant', hits: [allHit(280)], fury: FURY_68,
      effects: [
        heal(50),
        st(AS_SU, 'shatterStorm', 2, { value: 20 }),
        st(rand('enemy', 2), 'critResReduction', 2, { value: 20 }),
        st(role('ally', 'assaulter'), 'furyShield', 2, { value: 30 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'eveil-de-kawaki', name: 'Awakened Kawaki', role: A, gender: 'male', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 35), m('atk', 30), m('immuneIgnoreDef', 35)),
      nat('ally', EFT, m('ccRes', 25), m('dr', 30), m('finalDmg', 30)),
      enemies(m('atk', -30), m('dr', -30), m('punch', -45)),
      resist(55),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'freeze', 'weakened'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [{ to: named('ally', 'mitsuki'), mods: [m('ccRes', 10), m('dr', -20)] }] }],
    special: {
      name: 'Chakra Stick', hits: [allHit(300)], fury: FURY_68,
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
    id: 'danzo-root-hokage', name: 'Hokage candidate Danzo', role: A, gender: 'male', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 30), m('immuneIgnoreDef', 30), m('atk', 30)),
      nat('ally', EFT, m('ccRes', 25), m('dr', 30)),
      rl('enemy', ['vanguard', 'assaulter'], m('atk', -30)), rl('enemy', 'supporter', m('atk', -40)),
      enemies(m('dr', -20), m('def', -30), m('punch', -40)),
      attacked(100, cleanseSelf),
      self(m('crit', 40)),
      resist(55),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'freeze', 'weakened'),
    ],
    awakenings: [{ name: 'Raging Eye', talents: [self(m('sCrit', 25))] }],
    special: {
      name: 'Izanagi', hits: [allHit(300)], fury: FURY_68,
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
    id: 'hiruko-sasori', name: 'Hiruko Sasori', role: A, gender: 'male', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('dr', 35), m('finalDmg', 30), m('hp', 30), m('atk', 30)),
      nat('ally', EFT, m('ccRate', 30), m('ignoreDef', 35), m('punch', 25)),
      enemies(m('crit', -10), m('atk', -20)),
      self(m('crit', 30)),
      resist(55),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'poisonousWind', 'weakened'),
    ],
    awakenings: [{ name: 'Sand Clone', talents: [self(m('sCrit', 25))] }],
    special: {
      name: 'Prosthetic Arm Senbon', hits: [allHit(300)], fury: FURY_68,
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
    id: '7-tails-fuu', name: '7 tails Fuu', role: A, gender: 'female', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('finalDmg', 25), m('atk', 30), m('immuneIgnoreDef', 35)),
      nat('ally', WEF, m('ccRes', 25), m('dr', 30)),
      enemies(m('atk', -30), m('punch', -40), m('def', -30)),
      attacked(30, cleanseAllies),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'sSuperDodge', 'weakened', 'furyReduction', 'deathSeed', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Insect Bite', talents: [self(m('shieldPierce', 25))] }],
    special: {
      name: 'Scale Powder Burst', hits: [allHit(300)], fury: FURY_68,
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
    id: 'hayate-yugao', name: 'Hayate & Yugao', role: A, base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('finalDmg', 30), m('atk', 30), m('hp', 40), m('ignoreDef', 30)),
      nat('ally', WEF, m('ccRate', 30), m('punch', 25)),
      enemies(m('air', -30), m('def', -30)),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'sSuperDodge', 'weakened', 'furyReduction', 'deathSeed', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [self(m('shieldPierce', 25))] }],
    special: {
      name: 'Skill', hits: [allHit(330)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 2), 'shatterStorm', 2),
        st(rand('enemy', 2), 'upwind', 2),
        st(rand('enemy', 2), 'chaoticStorm', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'kusanagi-kyo', name: 'Kusanagi Kyo', role: A, gender: 'male', base: { speed: 87, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('finalDmg', 30), m('atk', 30), m('hp', 40), m('dr', 30)),
      attacked(100, cleanseSelf),
      self(m('atk', 10)),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'furyReduction', 'poisonousWind', 'weakened'),
    ],
    awakenings: [
      { name: 'Poisonous Bite', talents: [nat('ally', WEF, m('ccRes', 25), m('immuneIgnoreDef', 40)), enemies(m('atk', -30), m('punch', -40))] },
      { name: 'Sin Chant', replacePrevious: true, talents: [nat('ally', WEF, m('ccRate', 30), m('ignoreDef', 40)), enemies(m('atk', -20))] },
    ],
    special: {
      name: 'Orochanagi', hits: [allHit(300)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'bond', 2),
        st(rand('enemy', 2), 'chaoticStorm', 3),
        dispelEnemies,
      ],
    },
  },
  // ---------- Vitesse d'équipe 116 % ----------
  {
    id: 'reanimated-deidara', name: 'Reanimated Deidara', role: A, gender: 'male', base: { speed: 86, dr: 75, air: 65 },
    talents: [
      allies(m('speed', 116), m('atk', 35), m('dr', 30), m('ignoreDef', 40)),
      nat('ally', ['water', 'earth', 'wind'], m('ccRate', 30), m('crit', 20)),
      enemies(m('aid', -35), m('dr', -35), m('atk', -20)),
      resist(55),
      immune('superDodge', 'sSuperDodge', 'weakened', 'furyReduction', 'deathSeed', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Ningyo Kibaku Nendo', talents: [self(m('atk', 10))] }],
    special: {
      name: 'C2 Dragon', hits: [allHit(300)], fury: FURY_68,
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
    id: 'human-path-pain', name: 'Human Path Pain', role: A, gender: 'male', base: { speed: 86, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('atk', 30), m('dr', 30), m('hp', 40)),
      nat('ally', ['water', 'wind', 'fire'], m('ccRate', 30), m('finalDmg', 30)),
      enemies(m('atk', -20)),
      resist(55, 150, [m('ignoreEnemyAtk', 15)]),
      immune('superDodge', 'sSuperDodge', 'weakened', 'furyReduction', 'deathSeed', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Chakra Transfer', talents: [allies(m('ignoreDef', 40))] }],
    special: {
      name: 'Absorption Soul·Impale', hits: [allHit(360)], fury: FURY_68,
      effects: [
        heal(50),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'windEscape', 2, { value: 10 }),
        st(rand('ally', 2), 'bond', 2),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon')]),
        st(rand('enemy', 2), 'upwind', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'otsutsuki-jigen', name: 'Otsutsuki Jigen', role: A, gender: 'male', base: { speed: 86, dr: 80, air: 60 },
    talents: [
      allies(m('speed', 116), m('dr', 30), m('finalDmg', 30), m('hp', 45)),
      nat('ally', ['water', 'earth', 'thunder'], m('ccRes', 25), m('atk', 30), m('immuneIgnoreDef', 30)),
      enemies(m('atk', -30), m('punch', -45)),
      attacked(100, cleanseSelf), attacked(30, { to: rand('enemy', 2), cleanse: 'buff' }),
      resist(55, 150, [m('ignoreEnemyAtk', 9)]),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'poisonousWind', 'weakened'),
    ],
    awakenings: [{ name: 'Wedge·Absorption', talents: [{ to: named('ally', 'hashirama'), mods: [m('air', 20)] }] }],
    // La première compétence décrite est son attaque normale.
    normal: {
      name: 'Sealed Cauldron', hits: [allHit(100)], fury: { self: 50, allies: 30 },
      effects: [
        pen(80),
        { to: ENEMIES, dot: { name: 'Incinerate', pct: 70, duration: 2 } },
        heal(100),
        st(role('ally', 'assaulter'), 'superarmor', 2, { chance: 50 }),
        st(role('enemy', 'assaulter'), 'upwind', 2),
        st(rand('enemy', 2), 'weakened', 2),
      ],
    },
    special: {
      name: 'Wedge·Mahakala', hits: [allHit(390)], fury: FURY_68,
      effects: [
        heal(100),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'bond', 2),
        st(rand('ally', 2), 'windEscape', 2, { value: 10 }),
        st(rand('enemy', 2), 'corrosion', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'hashirama-madara', name: 'Hashirama & Madara', role: A, gender: 'male', base: { speed: 86, dr: 70, air: 70 },
    talents: [
      self(m('hp', 80), m('def', 80)),
      allies(m('speed', 116), m('dr', 40), m('hp', 35), m('def', 35)),
      nat('ally', ['water', 'fire', 'earth'], m('ccRes', 25), m('air', 40), m('atk', 30)),
      enemies(m('atk', -30), m('def', -30), m('punch', -45)),
      { to: VG_AS, mods: [m('pdefShield', 60)] },
      { to: role('ally', 'supporter'), mods: [m('mdefShield', 60)] },
      { to: ALLIES, scale: 10, mods: [m('atk', 8), m('def', 8)] },
      resist(55),
      immune('sSuperDodge', 'deathSeed', 'furyReduction', 'poisonousWind', 'weakened'),
    ],
    awakenings: [{ name: 'Seal of Reconciliation', talents: [attacked(30, cleanseAllies)] }],
    special: {
      name: 'Immortal Technique: Susanoo Senju Fall', hits: [allHit(350)], fury: FURY_68,
      effects: [
        pen(40),
        st(ENEMIES, 'imprison', 2, { chance: 80 }),
        st(rand('enemy', 1), 'freeze', 2, { chance: 90 }),
        heal(100),
        st(rand('enemy', 2), 'healReduction', 2, { value: 90 }),
        st(SELF, 'shielding', 2, { chance: 30 }), st(named('ally', 'hashirama'), 'shielding', 2, { chance: 30 }),
        st(role('ally', 'supporter'), 'superDodge', 2, { chance: 40 }), st(named('ally', 'madara'), 'superDodge', 2, { chance: 40 }),
        buff(role('ally', 'supporter'), 2, [m('def', 60, 'icon')]),
        st(role('ally', 'assaulter'), 'pyroblast', 2),
      ],
    },
  },
  {
    id: 'kushina-d-ete', name: 'Uzumaki Kushina', role: A, gender: 'female', base: { speed: 86, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('atk', 30), m('hp', 40), m('dr', 30)),
      nat('ally', ['water', 'thunder'], m('ccRate', 10), m('crit', 25)),
      nat('ally', ['fire', 'earth', 'wind'], m('ccRate', 25), m('hit', 50)),
      enemies(m('block', -35)), self(m('block', -50)),
      resist(55, 150, [m('ignoreEnemyAtk', 7)]),
      immune('chaos', 'superDodge', 'deathSeed', 'weakened'),
    ],
    awakenings: [{ name: 'Uzumaki Clan', talents: [immune('poisonousWind', 'charm'), { to: named('ally', 'naruto'), mods: [m('ccRes', 20)] }] }],
    normal: {
      name: 'Love Pan', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(rand('enemy', 1), 'seal', 2),
        st(rand('enemy', 2), 'weakened', 2),
        st(rand('enemy', 2), 'upwind', 2),
        st(rand('enemy', 1), 'forbidFury', 2, { chance: 50 }),
        dispelEnemies, heal(50),
      ],
    },
    special: {
      name: 'Five Elements Refall', hits: [allHit(330)], fury: FURY_68,
      effects: [
        st(rand('enemy', 2), 'charm', 2, { chance: 90 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'windEscape', 2, { value: 8 }),
        st(ALLIES, 'furyShield', 2),
        st(ENEMIES, 'painfulWill', 2),
        cleanseAllies, heal(50),
      ],
    },
  },
  {
    id: 'cyber-naruto', name: 'Cyber Naruto', role: A, gender: 'male', base: { speed: 86, dr: 75, air: 65 },
    talents: [
      allies(m('speed', 116), m('atk', 30), m('hp', 35), m('dr', 30)),
      rl('ally', 'assaulter', m('finalDmg', 20)), rl('ally', 'supporter', m('ccRate', 15)),
      enemies(m('atk', -20)),
      nat('enemy', 'thunder', m('air', -30)), nat('enemy', 'water', m('def', -40)), nat('enemy', 'fire', m('finalReduction', -20)),
      resist(55),
      immune('superDodge', 'sSuperDodge', 'blind', 'deathSeed'),
    ],
    awakenings: [{ name: 'Antiparticle Model', talents: [immune('weakened', 'poisonousWind')] }],
    special: {
      name: 'Heavy Magnetic · Anti-Spiral Jade', hits: [allHit(350), allHit(150, 'magic')], fury: FURY_68,
      effects: [
        heal(50), cleanseAllies,
        st(role('ally', 'assaulter'), 'superarmor', 2, { chance: 35 }),
        st(role('ally', 'supporter'), 'sSuperDodge', 2, { chance: 30 }),
        st(role('enemy', 'assaulter'), 'weakened', 2),
        st(role('enemy', 'vanguard'), 'upwind', 2),
      ],
    },
  },
  {
    id: 'premier-hokage', name: 'Shodai Hokage', role: A, gender: 'male', base: { speed: 86, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 40), m('air', 40), m('finalReduction', 30), m('ccRes', 15)),
      enemies(m('atk', -30), m('dr', -30), m('punch', -30)),
      attacked(30, st(role('ally', 'supporter'), 'superDodge', 2)),
      resist(55, 0, [m('ignoreEnemyAtk', 10)]),
      immune('deathSeed', 'freeze', 'furyReduction', 'weakened'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [
        { on: 'attacked', cond: 'hpHigher', effects: [buff(ALLIES, Infinity, [m('def', 90, 'icon')], 'Défenses +90 % (éveil Shodai)')] },
        { on: 'attacked', cond: 'hpLower', effects: [buff(ALLIES, Infinity, [m('air', 30)], 'Absorption +30 % (éveil Shodai)')] },
      ] },
      { name: 'Éveil 2', talents: [{ on: 'attacked', effects: [debuff(ALLIES, Infinity, [m('aid', -100)], 'Aide −100 % (éveil Shodai)')] }] },
      { name: 'Éveil 3 (annule l\'éveil 2)', replacePrevious: true, talents: [
        { on: 'attacked', cond: 'hpHigher', effects: [buff(ALLIES, Infinity, [m('def', 90, 'icon')], 'Défenses +90 % (éveil Shodai)')] },
        { on: 'attacked', cond: 'hpLower', effects: [buff(ALLIES, Infinity, [m('air', 30)], 'Absorption +30 % (éveil Shodai)')] },
      ] },
    ],
    special: {
      name: 'Skill', hits: [allHit(420)], fury: FURY_68,
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
        st(role('ally', 'supporter'), 'furyShield', 2),
        buff(role('ally', 'supporter'), 2, [m('speed', 15, 'icon')]),
      ],
    },
  },
  {
    id: 'kawaki', name: 'Kawaki', role: A, gender: 'male', base: { speed: 86, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('atk', 30), m('dr', 30)),
      nat('ally', 'water', m('ccRate', 30), m('sAtk', 30)),
      { to: named('ally', 'baryon', 'naruko', 'daiguren', 'yasaka', 'snow sakura', 'yugao'), mods: [m('air', 30), m('def', 40)] },
      enemies(m('atk', -30)),
      resist(55),
      immune('deathSeed', 'poisonousWind', 'weakened'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [attacked(25, cleanseAllies)] }],
    special: {
      name: 'Skill', hits: [allHit(200)], fury: FURY_68,
      effects: [
        st(E_VG_AS, 'upwind', 2),
        st(ALLIES, 'furyShield', 2),
        st(rand('ally', 2), 'bond', 2),
        st(role('ally', 'supporter'), 'shielding', 2, { chance: 30 }),
      ],
    },
  },
  // ---------- Vitesse d'équipe 112 % ----------
  {
    id: 'hades', name: 'Hadès', role: A, gender: 'male', base: { speed: 86, dr: 75, air: 65 },
    talents: [
      allies(m('speed', 112), m('atk', 25), m('hp', 30), m('dr', 30), m('finalDmg', 20), m('def', 60)),
      enemies(m('atk', -20), m('air', -20)),
      onDeath(100, { revive: 100 }),
      resist(55, 150, [m('ignoreEnemyAtk', 15)]),
      immune('sSuperDodge', 'poisonousWind', 'weakened', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [self(m('crit', 20)), immune('superDodge', 'charm')] }],
    normal: {
      name: 'Sword of Hell', hits: [allHit(300)],
      effects: [
        pen(50, highestHp('enemy'), 'physical'),
        st(lowestHp('enemy'), 'imprison', 2),
        { to: rand('ally', 2), cleanse: 'debuff' },
        { to: rand('enemy', 3), cleanse: 'buff' },
        st(rand('enemy', 1), 'upwind', 2),
        st(role('enemy', 'assaulter'), 'weakened', 2),
        heal(50),
      ],
    },
    special: {
      name: 'Great Eclipse of the Sun', hits: [allHit(330), { target: lowestHp('enemy'), pct: 200, attackType: 'physical' }], fury: FURY_68,
      effects: [
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
    id: '6th-mizukage-chojuro', name: '6th Mizukage Chojuro', role: A, gender: 'male', base: { speed: 86, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 112), m('hp', 40), m('pdefShield', 70)),
      nat('ally', 'water', m('recovery', 40), m('air', 40), m('atk', 30)),
      rl('ally', 'vanguard', m('dotBonus', 30)),
      nat('enemy', 'fire', m('air', -40), m('ccRes', -30)),
      enemies(m('atk', -30), m('dr', -30)),
      self(m('def', 30)),
      resist(55),
      immune('freeze', 'deathSeed', 'weakened'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [
      attacked(40, { to: nature('ally', 'water'), hot: 50, duration: 2 }),
      attacked(30, { to: rand('ally', 2), cleanse: 'debuff' }),
    ] }],
    special: {
      name: 'Hiramekarei Twinsword', hits: [allHit(330)], fury: FURY_68,
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
    id: 'warlord-sakura', name: 'Warlord Sakura', role: A, gender: 'female', base: { speed: 86, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 112), m('finalReduction', 30), m('finalDmg', 30)),
      ...byRole('ally', [30, 50, 50], 'hp'),
      enemies(m('atk', -30), m('dr', -30)),
      { to: ALLIES, scale: 10, mods: [m('ignoreDef', 10), m('crit', 5)] },
      attacked(40, dispelEnemies),
      attacked(30, st(SELF, 'bond', 2), st(VG, 'bond', 2)),
      resist(55),
      immune('chaos', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [{ to: VG, mods: [m('speed', 8), m('atk', 30)] }] }],
    special: {
      name: 'Sakura Illusion-Slash', hits: [allHit(320)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 90 }),
        st(role('enemy', 'assaulter'), 'charm', 2, { value: 120 }),
        st(SELF, 'shatterStorm', 2), st(VG, 'shatterStorm', 2),
        cleanseAllies,
        debuff(ENEMIES, 2, [m('atk', -30, 'icon'), m('dr', -30)]),
      ],
    },
  },
  {
    id: 'urashiki-otsutsuki', name: 'Urashiki Otsutsuki', role: A, gender: 'male', base: { speed: 86, dr: 70, air: 60 },
    talents: [
      allies(m('speed', 112), m('dr', 30)),
      ...byRole('ally', [30, 30, 20], 'hp'),
      ...byRole('enemy', [-50, -40, -30], 'def'),
      enemies(m('air', -30)),
      nat('enemy', ['none', 'earth'], m('speed', -5)),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('chaos', 'charm', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Temporal Rewind', talents: [self(m('block', 30)), immune('disable')] }],
    normal: {
      name: 'Normal Skill', hits: [allHit(350), allHit(200, 'magic')],
      effects: [
        { to: rand('ally', 2), cleanse: 'debuff' },
        { to: rand('enemy', 2), cleanse: 'buff' },
        st(rand('enemy', 1), 'poisonousWind', 2, { chance: 95 }),
        st(role('enemy', 'supporter'), 'weakened', 2),
        buff(ALLIES, 2, [m('atk', 30, 'icon')]),
      ],
    },
    special: {
      name: 'Special Skill', hits: [allHit(300)],
      effects: [
        st(ENEMIES, 'curseFixation', 3), st(ENEMIES, 'acupoint', 3),
        buff(ALLIES, 3, [m('crit', 40)]),
        debuff(ENEMIES, 3, [m('def', -30, 'icon')]),
        debuff(nature('enemy', ['fire', 'earth', 'water']), 3, [m('speed', -40, 'icon'), m('atk', -40, 'icon')]),
      ],
    },
  },
  {
    id: 'hotaru', name: 'Hotaru', role: A, gender: 'female', base: { speed: 86, dr: 60, air: 70 },
    talents: [
      allies(m('speed', 112), m('dr', 25)),
      ...byRole('ally', [30, 30, 40], 'hp'), ...byRole('ally', [35, 35, 50], 'def'),
      enemies(m('atk', -30)),
      resist(55, 150, [m('ignoreEnemyAtk', 10)]),
      immune('chaos', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [attacked(30, st(role('ally', 'supporter'), 'superDodge', 2)), allies(m('recovery', 40))] }],
    normal: {
      name: 'Normal Skill', hits: [{ target: rand('enemy', 3), pct: 450 }],
      effects: [
        dispelEnemies,
        st(rand('enemy', 1), 'charm', 2, { value: 160 }),
        st(rand('enemy', 1), 'charm', 2, { chance: 35, value: 160 }),
        { to: ENEMIES, dot: { name: 'Safeguard', pct: 120, duration: 2 } },
        debuff(ENEMIES, 2, [m('sAtk', -30)]),
      ],
    },
    special: {
      name: 'Special Skill', hits: [allHit(300)], fury: { allies: 100 },
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
    id: 'daiguren-toshiro', name: 'Daiguren Toshiro', role: A, gender: 'male', base: { speed: 86, dr: 70, air: 60 },
    talents: [
      allies(m('speed', 112), m('atk', 30), m('hp', 30)),
      enemies(m('dr', -30)),
      attacked(50, dispelEnemies),
      attacked(50, st(ATTACKER, 'petrify', 2)),
      resist(75, 150, [m('ignoreEnemyAtk', 10)]),
      immune('charm', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Awaken Ice Dragon', talents: [self(m('sBlockRes', 40))] }],
    special: {
      name: 'Sennen Hyoro', hits: [allHit(350)], fury: FURY_68,
      effects: [
        pen(60, gendered('enemy', 'male')),
        st(ENEMIES, 'charm', 2, { chance: 95, value: 220 }),
        debuff(ENEMIES, 2, [m('recoveryCut', 60)]),
        st(SELF, 'ccFree', 2), st(VG, 'ccFree', 2),
        buff(VG, 2, [m('def', 500, 'icon')]),
      ],
    },
  },
  {
    id: 'gekko-hayate', name: 'Gekko Hayate', role: A, gender: 'male', base: { speed: 86, dr: 75, air: 50 },
    talents: [
      allies(m('speed', 112), m('atk', 30), m('finalDmg', 25)),
      { to: AS_SU, mods: [m('punch', 15)] },
      rl('enemy', 'assaulter', m('ccRes', -15)),
      resist(50, 150, [m('immuneIgnoreDef', 50)]),
      immune('disable', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [enemies(m('recoveryCut', 40)), immune('petrify')] }],
    special: {
      name: 'Secret Sword: Moonlight', hits: [allHit(300), allHit(170, 'magic')], fury: FURY_68,
      effects: [
        dispelEnemies,
        { to: ENEMIES, dot: { name: 'Split', pct: 130, duration: 2 } },
        st(E_VG_AS, 'upwind', 2),
        st(role('ally', 'assaulter'), 'superDodge', 2),
        st(role('ally', 'supporter'), 'sSuperDodge', 2, { chance: 30 }),
      ],
    },
  },
  {
    id: 'uchiha-mikoto', name: 'Uchiha Mikoto', role: A, gender: 'female', base: { speed: 86, dr: 70, air: 60 },
    talents: [
      allies(m('speed', 112), m('hp', 30), m('atk', 30)),
      rl('ally', 'supporter', m('ccRate', 20)),
      rl('enemy', ['vanguard', 'assaulter'], m('pdef', -50)), rl('enemy', 'supporter', m('mdef', -50)),
      onDeath(100, st(rand('ally', 2), 'ccFree', 2)),
      resist(50, 150, [m('immuneIgnoreDef', 50)]),
      immune('furyReduction', 'charm', 'blind'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [self(m('finalDmg', 20))] }],
    special: {
      name: 'Magic Mirror', hits: [allHit(330)], fury: FURY_68,
      effects: [
        pen(70, TARGET, 'physical'),
        st(ENEMIES, 'seal', 2, { chance: 90 }), st(ENEMIES, 'chaos', 2, { chance: 90 }),
        heal(100),
        buff(ALLIES, 2, [m('sAtk', 40)]),
        debuff(ENEMIES, 2, [m('finalReduction', -30), m('air', -30)]),
      ],
    },
  },
  {
    id: 'nadeshiko-shizuka', name: 'Nadeshiko Shizuka', role: A, gender: 'female', base: { speed: 86, dr: 70, air: 50 },
    talents: [
      allies(m('speed', 112), m('hp', 20)),
      ...byRole('ally', [20, 40, 30], 'dr'),
      { to: gendered('ally', 'female'), mods: [m('atk', 30)] },
      { to: gendered('enemy', 'male'), mods: [m('air', -40), m('def', -40)] },
      onDeath(100, { to: gendered('enemy', 'male'), dot: { name: 'DoT', pct: 250, duration: 2 } },
        debuff(gendered('enemy', 'male'), 2, [m('atk', -60, 'icon')])),
      resist(50),
      immune('blind', 'chaos'),
    ],
    awakenings: [
      { name: 'Violent Whirlwind', talents: [{ to: gendered('ally', 'female'), mods: [m('ccRate', 10)] }] },
      { name: 'Roaring Gale Chop', talents: [attacked(70, { to: gendered('enemy', 'male'), cleanse: 'buff' })] },
    ],
    special: {
      name: 'Deep Crimson Dance', hits: [allHit(300), { target: gendered('enemy', 'male'), pct: 200 }], fury: FURY_68,
      effects: [
        either([st(gendered('enemy', 'male'), 'blind', 2)], [st(gendered('enemy', 'male'), 'imprison', 2)]),
        either([st(gendered('enemy', 'male'), 'expel', 2)], [st(gendered('enemy', 'male'), 'paralysis', 2)]),
        { to: ENEMIES, fury: -40 },
        { to: ALLIES, hot: 120, duration: 2 },
        debuff(ENEMIES, 2, [m('air', -40), m('speed', -15, 'icon')]),
      ],
    },
  },
  {
    id: 'armored-jiraiya', name: 'Armored Jiraiya', role: A, gender: 'male', base: { speed: 86, dr: 75, air: 55 },
    talents: [
      allies(m('speed', 112), m('dr', 30), m('finalDmg', 40)),
      enemies(m('antiCrit', -30), m('aid', -40)),
      self(m('atk', 10)),
      resist(50, 170),
      immune('superDodge', 'sSuperDodge', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [
      { to: gendered('enemy', 'female'), mods: [m('def', -30), m('ccRes', -30)] },
      { to: gendered('ally', 'male'), mods: [m('atk', 25)] },
    ] }],
    special: {
      name: 'Summoning: Toad Shop', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 380, assaulter: 360, supporter: 330 } }],
      effects: [
        st(ENEMIES, 'collapse', 2, { chance: 90 }),
        { to: ENEMIES, dot: { name: 'Incinerate', pct: 120, duration: 2 } },
        pen(45, gendered('enemy', 'female')),
        buff(ALLIES, 2, [m('atk', 30, 'icon'), m('speed', 20, 'icon')]),
        debuff(highestHp('enemy'), 2, [m('def', -80, 'icon')]),
      ],
    },
  },
  // ---------- Vitesse d'équipe 111 % et moins ----------
  {
    id: 'roshi', name: '4-tail Roshi', role: A, gender: 'male', tags: ['jinchuriki'], base: { speed: 84, dr: 55, air: 70 },
    talents: [
      allies(m('speed', 111), m('hp', 30), m('dr', 40), m('finalReduction', 30)),
      enemies(m('atk', -25)),
      { to: SELF, scale: 10, mods: [m('def', 10)] },
      { to: ALLIES, scale: 10, mods: [m('air', 10)] },
      resist(50),
      immune('imprison', 'freeze'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [self(m('def', 20))] },
      { name: 'Éveil 2', talents: [self(m('penMalus', 30))] },
    ],
    normal: {
      name: 'Mountain of Flower (normale)', hits: [{ target: role('enemy', 'supporter'), pct: 450 }],
      effects: [
        st(role('enemy', 'supporter'), 'petrify', 2),
        st(role('enemy', 'supporter'), 'painfulWill', 2),
        debuff(role('enemy', 'supporter'), 2, [m('crit', -50), m('block', -30), m('ccRate', -30), m('air', -30)]),
        buff(SELF, 2, [m('dodge', 300)]),
        buff(VG_AS, 2, [m('dr', 60)]),
      ],
    },
    special: {
      name: 'Mountain of Flower (spéciale)', hits: [allHit(320)], fury: FURY_50,
      effects: [
        { to: ENEMIES, dot: { name: 'Burst', pct: 100, duration: 2 } },
        { to: highestHp('enemy'), dot: { name: 'Incinerate', pct: 130, duration: 2 } },
        dispelEnemies,
        st(SELF, 'ccFree', 2), st(VG, 'ccFree', 2),
        buff(VG, 2, [m('atk', 60, 'icon')]),
        debuff(role('enemy', ['supporter', 'assaulter']), 2, [m('def', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'gaara-one-tail', name: '1-tail Gaara', role: A, gender: 'male', tags: ['jinchuriki'], base: { speed: 83, dr: 75, air: 50 },
    talents: [
      allies(m('speed', 110), m('dr', 40), m('atk', 30)),
      enemies(m('def', -30)),
      self(m('atk', 10), m('sCrit', 50)),
      attacked(24, buff(SELF, 1, [m('def', 100, 'icon')], 'Bouclier de la grue')),
      { on: 'attacked', chance: 8, requires: 'Bouclier de la grue', effects: [st(SELF, 'chaos', 1)] },
      resist(50),
      immune('windBound', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [self(m('crit', 30))] },
      { name: 'Éveil 2', talents: [immune('superDodge', 'sSuperDodge')] },
    ],
    special: {
      name: 'Sand Funeral', hits: [allHit(350), { target: lowestHp('enemy'), pct: 200 }], fury: FURY_50,
      effects: [
        st(ENEMIES, 'windBound', 2, { chance: 90 }),
        debuff(ENEMIES, 2, [m('aid', -40), m('air', -30)]),
      ],
    },
  },
  {
    id: 'hiruko', name: 'Hiruko', role: A, gender: 'male', base: { speed: 82, dr: 80, air: 45 },
    talents: [
      allies(m('speed', 109), m('hp', 30)),
      enemies(m('air', -40)),
      self(m('def', 20)),
      attacked(100, buff(SELF, 2, [m('speed', 100, 'icon')])),
      attacked(50, dispelEnemies),
      resist(50, 150, [m('immuneIgnoreDef', 40)]),
      immune('blind', 'sSuperDodge', 'furyReduction'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [self(m('dotBonus', 30))] }, // « burst rate +30 % » : appliqué à tous ses DoT
      { name: 'Éveil 2', talents: [allies(m('finalReduction', 15))] },
    ],
    special: {
      name: 'Chimera Technique', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 480, assaulter: 400, supporter: 350 } }],
      effects: [
        buff(ALLIES, 2, [m('dr', 30)]),
        { to: ENEMIES, fury: -25 },
        either([buff(ALLIES_BUT_SELF, 2, [m('crit', 45)])], [debuff(rand('enemy', 3), 2, [m('air', -50)])]),
        either([buff(VG_AS, 2, [m('def', 500, 'icon')])], [st(role('enemy', 'supporter'), 'chaos', 2)]),
        either([{ to: ENEMIES, dot: { name: 'Burst', pct: 100, duration: 2 } }], [debuff(ENEMIES, 2, [m('ccRate', -50)])]),
      ],
    },
  },
  {
    id: 'orochimaru-kabuto', name: 'Orochimaru & Kabuto', role: A, gender: 'male', base: { speed: 80, dr: 65, air: 55 },
    talents: [
      enemies(m('speed', -52)),
      allies(m('hp', 30), m('atk', 30)),
      { to: ENEMIES, scale: 15, mods: [m('atk', -5)] },
      onDeath(100, { revive: 50 }, { to: SELF, cleanse: 'debuff' }, st(SELF, 'ccFree', 2)),
      resist(50, 999),
      immune('blind', 'deathSeed'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [attacked(100, buff(SELF, Infinity, [m('def', 20, 'icon')], 'Défenses +20 % (éveil)'))] },
      { name: 'Éveil 2', talents: [attacked(60, st(ATTACKER, 'chaos', 2))] },
    ],
    special: {
      name: 'Evil Snake Winding', fury: { self: 68, allies: 50 },
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 500, assaulter: 400, supporter: 330 } }],
      effects: [
        { to: highestHp('enemy'), dot: { name: 'Poison', pct: 200, duration: 2 } },
        either([st(lowestHp('enemy'), 'blind', 2)], [st(lowestHp('enemy'), 'imprison', 2)]),
        dispelEnemies,
        buff(ALLIES, 2, [m('reflectRes', 70)]),
      ],
    },
  },
  {
    id: 'kimimaro-cursed', name: 'Cursed Kimimaro', role: A, gender: 'male', base: { speed: 80, dr: 60, air: 55 },
    talents: [
      allies(m('speed', 98), m('hp', 30)),
      enemies(m('air', -35)),
      { to: ALLIES, scale: 10, mods: [m('dr', 10)] },
      resist(50, 0),
      immune('freeze', 'furyReduction', 'deathSeed'),
    ],
    special: {
      name: 'Dance of the False Cleavers', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 80 }),
        cleanseAllies,
        pen(120, TARGET, 'physical'),
        buff(SELF, 2, [m('def', 500, 'icon')]),
      ],
    },
  },
  {
    id: 'sasuke-konoha-shadow', name: 'Konoha\'s Shadow Sasuke', role: A, gender: 'male', base: { speed: 79, dr: 60, air: 50 },
    talents: [
      enemies(m('speed', -49)),
      allies(m('atk', 30), m('hp', 30)),
      attacked(80, st(ATTACKER, 'stun', 1)),
      resist(50, 999, [m('ignoreEnemyAtk', 30)]),
      immune('blind', 'deathSeed'),
    ],
    special: {
      name: 'Chibaku Tensei', hits: [allHit(380)], fury: FURY_50,
      effects: [
        { to: ENEMIES, dot: { name: 'Bleed', pct: 100, duration: 2 } },
        st(SELF, 'shielding', 1),
        debuff(ENEMIES, 2, [m('def', -20, 'icon')]),
        buff(ALLIES, 2, [m('sAtk', 60)]),
      ],
    },
  },
  {
    id: 'might-gai', name: 'Might Gai', role: A, gender: 'male', base: { speed: 77, dr: 55, air: 55 },
    talents: [
      enemies(m('speed', -48)),
      rl('enemy', 'supporter', m('atk', -25)),
      { to: AS_SU, mods: [m('hp', 30)] },
      onDeath(100, st(ENEMIES, 'chaos', 2, { chance: 90 })),
      resist(40, 0),
      immune('forbidFury', 'freeze'),
    ],
    special: {
      name: 'Night Guy', hits: [allHit(320)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'petrify', 2, { chance: 80 }), st(ENEMIES, 'forbidFury', 2, { chance: 80 }),
        debuff(ENEMIES, 2, [m('air', -30)]),
        debuff(role('enemy', 'supporter'), 2, [m('aid', -40)]),
        buff(role('ally', 'assaulter'), 2, [m('atk', 20, 'icon')]),
        buff(role('ally', 'supporter'), 2, [m('speed', 25, 'icon')]),
        { to: rand('ally', 2), cleanse: 'debuff' },
      ],
    },
  },
  {
    id: 'ay-bee', name: 'Ay-Bee Combo', role: A, gender: 'male', base: { speed: 77, dr: 55, air: 50 },
    talents: [
      allies(m('speed', 90), m('air', 30)),
      { to: AS_SU, mods: [m('hp', 30)] },
      attacked(50, cleanseSelf),
      immune('superDodge', 'blind', 'deathSeed'),
    ],
    special: {
      name: 'Liger Two Platoons Bomb', hits: [allHit(350)], fury: { self: 50, allies: 50 },
      effects: [
        st(ENEMIES, 'expel', 2, { chance: 90 }),
        { to: ENEMIES, dot: { name: 'Burst', pct: 100, duration: 1 } },
        buff(ALLIES, 3, [m('block', 60)]),
        debuff(ENEMIES, 2, [m('def', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'chino', name: 'Chino', role: A, gender: 'female', base: { speed: 75, dr: 50, air: 55 },
    talents: [
      enemies(m('speed', -46)),
      rl('ally', ['vanguard', 'assaulter'], m('hp', 40)), rl('ally', 'supporter', m('dr', 30)),
      onDeath(60, st(rand('enemy', 1), 'deathSeed', 2)),
      resist(40, 0),
      immune('furyReduction', 'deathSeed'),
    ],
    special: {
      name: 'Exploding Human Technique', hits: [allHit(330)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'acupoint', 2, { chance: 80 }),
        { to: role('enemy', 'supporter'), fury: -50 },
        buff(ALLIES, 2, [m('air', 30)]),
        st(rand('ally', 1), 'superDodge', 1),
        debuff(ENEMIES, 2, [m('atk', -20, 'icon'), m('punch', -40)]),
      ],
    },
  },
  // ---------- Duos et ninjas de vitesse 25 à 70 % ----------
  {
    id: 'gai-rock-lee', name: 'Gai & Rock Lee', role: A, gender: 'male', base: { speed: 70, dr: 50, air: 50 },
    talents: [
      enemies(m('speed', -42), m('dr', -40)),
      rl('ally', 'assaulter', m('air', 40)),
      { to: VG_AS, mods: [m('hp', 40)] },
      resist(50, 0),
      immune('freeze', 'blind'),
    ],
    special: {
      name: 'Tiger & Phoenix', hits: [allHit(300)], fury: FURY_68,
      effects: [
        { chance: 80, ...either([st(ENEMIES, 'freeze', 2)], [st(ENEMIES, 'blind', 2)]) },
        { chance: 80, ...either([st(ENEMIES, 'stun', 2)], [st(ENEMIES, 'silence', 2)]) },
        buff(role('ally', 'supporter'), 2, [m('atk', 30, 'icon'), m('reflectRes', 100)]),
        buff(VG, 2, [m('air', 40)]),
        debuff(role('enemy', 'supporter'), 2, [m('def', -20, 'icon')]),
        debuff(ENEMIES, 2, [m('aid', -50)]),
      ],
    },
  },
  {
    id: 'kisame-samehada', name: 'Samehada Kisame', role: A, gender: 'male', base: { speed: 72, dr: 50, air: 55 },
    talents: [
      enemies(m('speed', -45)),
      rl('ally', 'supporter', m('hp', 40)),
      attacked(30, st(SELF, 'sSuperDodge', 1)),
      resist(40, 0, [m('ignoreEnemyAtk', 20)]),
      immune('imprison', 'blind'),
    ],
    special: {
      name: 'Water Imprison', hits: [allHit(330)], fury: { self: 100, allies: 30 },
      effects: [
        st(ENEMIES, 'blind', 2, { chance: 80 }),
        heal(120),
        buff(ALLIES, 2, [m('atk', 25, 'icon')]),
        debuff(ENEMIES, 2, [m('dr', -20), m('aid', -20)]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'zabuza-haku', name: 'Zabuza & Haku', role: A, gender: 'male', base: { speed: 65, dr: 50, air: 50 },
    talents: [
      enemies(m('speed', -42)),
      allies(m('dr', 30), m('hp', 30)),
      attacked(60, cleanseSelf),
      immune('superDodge', 'freeze', 'stun'),
    ],
    special: {
      name: 'Thousand Flying Water Needles of Death', hits: [allHit(330)], fury: { self: 100, allies: 30 },
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 65 }), st(ENEMIES, 'curseFixation', 2, { chance: 65 }),
        buff(ALLIES, 2, [m('speed', 30, 'icon'), m('def', 30, 'icon')]),
        debuff(ENEMIES, 2, [m('air', -30), m('punch', -30)]),
      ],
    },
  },
  {
    id: 'tenten-cheongsam', name: 'Cheongsam Tenten', role: A, gender: 'female', base: { speed: 60, dr: 45, air: 45 },
    talents: [
      enemies(m('speed', -38), m('dr', -30)),
      attacked(70, cleanseSelf),
      onDeath(100, st(ENEMIES, 'stun', 1)),
      self(m('ignoreDef', 40)),
      immune('blind', 'imprison'),
    ],
    special: {
      name: 'Blade Chaos', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'paralysis', 2, { chance: 60 }),
        { to: ENEMIES, cleanse: 'buff', chance: 60 },
        buff(ALLIES, 2, [m('atk', 20, 'icon')]),
        { to: rand('ally', 2), cleanse: 'debuff' },
        debuff(ENEMIES, 2, [m('dr', -20), m('aid', -30)]),
      ],
    },
  },
  {
    id: 'seventh-hokage', name: 'The Seventh Hokage', role: A, gender: 'male', base: { speed: 55, dr: 45, air: 45 },
    talents: [
      allies(m('speed', 50)),
      { to: AS_SU, mods: [m('hp', 40)] },
      enemies(m('atk', -25)),
      onDeath(100, { to: ENEMIES, strike: 300 }),
      resist(30, 0),
      immune('superDodge', 'blind'),
    ],
    special: {
      name: 'Kurama', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'silence', 2, { chance: 60 }), st(ENEMIES, 'petrify', 2, { chance: 60 }),
        buff(ALLIES, 2, [m('air', 20), m('dr', 20)]),
        debuff(ENEMIES, 2, [m('def', -30, 'icon'), m('air', -30)]),
        st(SELF, 'superDodge', 1),
      ],
    },
  },
  {
    id: 'minato-kushina', name: 'Minato & Kushina', role: A, gender: 'male', base: { speed: 50, dr: 35, air: 40 },
    talents: [
      enemies(m('speed', -30)),
      rl('enemy', 'supporter', m('mdef', -20)),
      { to: AS_SU, mods: [m('hp', 30)] },
      attacked(70, cleanseSelf),
      immune('blind', 'furyReduction'),
    ],
    special: {
      name: 'True Great Rasengan', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'petrify', 2, { chance: 60 }), st(ENEMIES, 'forbidFury', 2, { chance: 60 }),
        debuff(ENEMIES, 2, [m('dr', -30), m('aid', -30)]),
        buff(role('ally', 'assaulter'), 1, [m('atk', 20, 'icon')]),
        buff(role('ally', 'supporter'), 1, [m('speed', 15, 'icon')]),
        { to: rand('ally', 2), cleanse: 'debuff' },
        heal(30, role('ally', 'supporter')),
      ],
    },
  },
  {
    id: 'hidan-kakuzu-assaulter', name: 'Hidan & Kakuzu (attaquant)', role: A, gender: 'male', base: { speed: 50, dr: 30, air: 35 },
    talents: [
      enemies(m('speed', -25), m('dr', -35)),
      rl('ally', 'assaulter', m('air', 30)),
      { to: SELF, scale: 10, mods: [m('atk', 5), m('def', 5)] },
      immune('superDodge', 'blind', 'furyReduction'),
    ],
    special: {
      name: 'Fatal Death', hits: [allHit(300)], fury: { self: 100, allies: 30 },
      effects: [
        { chance: 70, ...either(...['acupoint', 'chaos', 'fear', 'paralysis', 'silence'].map((s) => [st(rand('enemy', 1), s, 2)])) },
        debuff(ENEMIES, 2, [m('air', -30), m('atk', -20, 'icon')]),
        buff(rand('ally', 2), 2, [m('atk', 15, 'icon')]),
        buff(role('ally', 'supporter'), 2, [m('def', 20, 'icon')]),
      ],
    },
  },
  {
    id: 'kakashi-gai', name: 'Kakashi & Gai', role: A, gender: 'male', base: { speed: 45, dr: 30, air: 35 },
    talents: [
      enemies(m('speed', -25), m('air', -20)),
      rl('enemy', 'supporter', m('dr', -30)),
      attacked(100, st(ATTACKER, 'stun', 1)),
      immune('paralysis', 'furyReduction', 'shock'),
    ],
    special: {
      name: 'Lightning Beast Running Technique', hits: [allHit(300)], fury: { self: 50, allies: 50 },
      effects: [
        st(rand('enemy', 1), 'deathSeed', 2),
        st(rand('enemy', 1), 'deathSeed', 2, { chance: 50 }),
        st(SELF, 'stun', 1),
        buff(ALLIES, 2, [m('dr', 15)]),
      ],
    },
  },
  {
    id: 'naruto-hinata', name: 'Naruto & Hinata', role: A, gender: 'male', base: { speed: 40, dr: 30, air: 25 },
    talents: [
      enemies(m('speed', -20), m('atk', -30)),
      { to: SELF, scale: 15, mods: [m('air', 6)] },
      immune('stun', 'petrify', 'shock'),
    ],
    special: {
      name: 'Super Giant Trigram Rasengan', hits: [allHit(320)], fury: { self: 50, allies: 50 },
      effects: [
        st(ENEMIES, 'expel', 2, { chance: 65 }),
        { to: ENEMIES, dot: { name: 'Burst', pct: 100, duration: 1 } },
        buff(role('ally', 'supporter'), 2, [m('atk', 30, 'icon')]),
        debuff(ENEMIES, 2, [m('def', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'sand-burial-baara', name: 'Sand Burial Baara', role: A, gender: 'male', base: { speed: 35, dr: 25, air: 25 },
    talents: [
      enemies(m('speed', -15)),
      onDeath(100, { to: ENEMIES, strike: 200 }),
      immune('petrify', 'acupoint'),
    ],
    special: {
      name: 'Spear Burial', hits: [allHit(300)], fury: FURY_50,
      effects: [
        { oneOf: [[st({ side: 'enemy', pick: 'random', count: [1, 3] }, 'deathSeed', 2)], [st(SELF, 'stun', 1)]], weights: [60, 40] },
        buff(ALLIES, 1, [m('atk', 15, 'icon')]),
        debuff(ENEMIES, 2, [m('air', -25)]),
        buff(role('ally', 'supporter'), 2, [m('aid', 50)]),
      ],
    },
  },
  {
    id: 'rabbit-goddess', name: 'The Rabbit Goddess', role: A, gender: 'female', base: { speed: 30, dr: 30, air: 20 },
    talents: [
      enemies(m('atk', -30)),
      rl('ally', 'assaulter', m('mdef', 40), m('pdef', 20)),
      { to: SELF, scale: 10, mods: [m('air', 3)] },
      immune('superDodge', 'stun', 'acupoint'),
    ],
    special: {
      name: 'Amenominaka', hits: [allHit(280)], fury: { self: 50, allies: 50 },
      effects: [
        st(ENEMIES, 'shock', 2, { chance: 60 }),
        { to: ENEMIES, dot: { name: 'Bleed', pct: 100, duration: 1 } },
        buff(ALLIES, 2, [m('speed', 30, 'icon')]),
        debuff(SELF, 2, [m('def', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'otsutsuki-hamura', name: 'Otsutsuki Hamura', role: A, gender: 'male', base: { speed: 30, dr: 30, air: 15 },
    talents: [
      self(m('punch', 50), m('hp', 30)),
      rl('ally', 'supporter', m('def', 30)), rl('ally', 'assaulter', m('hp', 30)),
      { on: 'attacked', cond: 'hpHigher', effects: [buff(SELF, 2, [m('def', 20, 'icon')])] },
      immune('stun', 'furyReduction'),
    ],
    special: {
      name: 'Six Paths Planetary Devastation', hits: [allHit(300)], fury: { self: 30, allies: 50 },
      effects: [
        { to: ENEMIES, fury: -60 },
        debuff(ENEMIES, 1, [m('speed', -20, 'icon')]),
        { to: ENEMIES, dot: { name: 'Bleed', pct: 100, duration: 1 } },
        buff(ALLIES, 1, [m('dr', 20)]),
      ],
    },
  },
  {
    id: 'asura-naruto', name: 'Asura Naruto', role: A, gender: 'male', base: { speed: 25, dr: 20, air: 15 },
    talents: [
      enemies(m('speed', -10), m('def', -10)),
      attacked(80, st(ATTACKER, 'stun', 1)),
      immune('silence', 'petrify'),
    ],
    special: {
      name: 'Asura\'s Rasen Shuriken', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 65 }),
        debuff(ENEMIES, 2, [m('atk', -20, 'icon'), m('air', -10)]),
        buff(role('ally', 'supporter'), 2, [m('aid', 50)]),
      ],
    },
  },
  {
    id: 'otsutsuki-kaguya', name: 'Otsutsuki Kaguya', role: A, gender: 'female', base: { speed: 25, dr: 20 },
    talents: [immune('stun', 'silence')],
    special: {
      name: 'Six Path — Eight Gods Kuukeki', hits: [allHit(230)], fury: { self: 25, allies: 30 },
      effects: [
        { to: ENEMIES, dot: { name: 'Bleed', pct: 80, duration: 1 } },
        buff(ALLIES, 2, [m('dr', 20)]),
      ],
    },
  },
  {
    id: 'kakashi-susano', name: 'Susano Kakashi', role: A, gender: 'male', base: { speed: 20, dr: 15 },
    talents: [immune('stun')],
    special: {
      name: 'Power Shuriken', hits: [allHit(220)], fury: { self: 25, allies: 25 },
      effects: [
        { to: ENEMIES, fury: -30 },
        st(ENEMIES, 'normalForbid', 2, { chance: 60 }),
        { to: AS_SU, hot: 35, duration: 2 },
        buff(ALLIES, 2, [m('atk', 15, 'icon')]),
      ],
    },
  },
  {
    id: 'shisui-teleporter', name: 'Shisui the Teleporter', role: A, gender: 'male', base: { speed: 15, dr: 15 },
    talents: [immune('stun')],
    special: {
      name: 'Susanoo Explosion', hits: [allHit(200)], fury: { self: 65 },
      effects: [
        debuff(ENEMIES, 2, [m('speed', -15, 'icon'), m('def', -20, 'icon')]),
        buff(role('ally', 'supporter'), 2, [m('aid', 65)]),
        buff(ALLIES, 1, [m('dodge', 50)]),
      ],
    },
  },
  {
    id: 'itachi-susano', name: 'Susano Itachi', role: A, gender: 'male', base: { speed: 15 },
    talents: [self(m('block', 20)), immune('stun')],
    special: {
      name: 'Susanoo', hits: [allHit(190)], fury: { self: 25 },
      effects: [
        debuff(ENEMIES, 3, [m('sAtk', -30), m('air', -15)]),
        buff(SELF, 1, [m('punch', 100), m('atk', 30, 'icon')]),
      ],
    },
  },
  {
    id: 'gai-eight-gates', name: 'Eight Gate Gai', role: A, gender: 'male', base: { speed: 15, dr: 10 },
    talents: [self(m('punch', 15))],
    special: {
      name: 'S.Ability-Night Guy', hits: [{ target: role('enemy', 'supporter'), pct: 500 }], fury: { self: 50 },
      effects: [
        debuff(role('enemy', 'supporter'), 2, [m('speed', -15, 'icon'), m('crit', -15)]),
        debuff(SELF, 1, [m('def', -60, 'icon')]),
      ],
    },
  },
  {
    id: 'ginkaku', name: 'Ginkaku', role: A, gender: 'male', base: { speed: 15, dr: 10 },
    talents: [],
    special: {
      name: 'Drive Word Soul', hits: [allHit(180)], fury: { self: 45 },
      effects: [
        debuff(ENEMIES, 1, [m('atk', -30, 'icon')]),
        { to: role('enemy', 'supporter'), fury: -5 },
      ],
    },
  },
  {
    id: 'toad-sage', name: 'Toad Sage', role: A, gender: 'male', base: { speed: 15 },
    talents: [],
    special: { name: 'Sage Art: Bath of Boiling Oil', hits: [allHit(160)], fury: { self: 50 },
      effects: [buff(role('ally', 'assaulter'), 3, [m('atk', 25, 'icon')])] },
  },
  {
    id: 'star-sakura', name: 'Star Sakura', role: A, gender: 'female', base: { dr: 95 },
    talents: [],
    special: { name: 'Sakura Punch', hits: [{ target: role('enemy', 'vanguard'), pct: 100 }],
      effects: [buff(role('ally', 'assaulter'), 2, [m('block', 10)])] },
  },
  {
    id: 'variable-sakura', name: 'Variable Sakura', role: A, gender: 'female', base: { dr: 10 },
    talents: [self(m('punch', 5))],
    special: { name: 'Super Strength', hits: [{ target: role('enemy', 'vanguard'), pct: 280 }],
      effects: [buff(ALLIES, 3, [m('dr', 10)])] },
  },
];
