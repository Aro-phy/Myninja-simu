// Supports. Transcription des descriptions du wiki du jeu.
// base : ligne de base du talent (déjà comptée dans les stats saisies).
import {
  ALLIES, ALLIES_BUT_SELF, ENEMIES, SELF, TARGET, ATTACKER, rand, role, nature, lowestHp, highestHp,
  m, buff, debuff, st, fixed, FURY_68, FURY_50, named, gendered,
} from './helpers.js';

const S = 'supporter';
const cleanseAllies = { to: ALLIES, cleanse: 'debuff' };
const cleanseSelf = { to: SELF, cleanse: 'debuff' };
const dispelEnemies = { to: ENEMIES, cleanse: 'buff' };
const heal = (pct, to = ALLIES) => ({ to, heal: pct });
const allHit = (pct, attackType) => ({ target: ENEMIES, pct, ...(attackType ? { attackType } : {}) });
const oneHit = (pct) => ({ target: rand('enemy', 1), pct });
const pen = (pct, to = TARGET, attackType) => ({ to, penetration: pct, ...(attackType ? { attackType } : {}) });
const self = (...mods) => ({ to: SELF, mods });
const allies = (...mods) => ({ to: ALLIES, mods });
const enemies = (...mods) => ({ to: ENEMIES, mods });
const immune = (...ids) => ({ to: SELF, immune: ids });
const nat = (side, n, ...mods) => ({ to: nature(side, n), mods });
const rl = (side, r, ...mods) => ({ to: role(side, r), mods });
const pick = (side, p) => ({ side, pick: p });
const VG = role('ally', 'vanguard');
const VG_AS = role('ally', ['vanguard', 'assaulter']);
const AS_SU = role('ally', ['assaulter', 'supporter']);
const E_VG_AS = role('enemy', ['vanguard', 'assaulter']);
const E_AS_SU = role('enemy', ['assaulter', 'supporter']);
const EFT = ['earth', 'fire', 'thunder'];
const WEF = ['water', 'earth', 'fire'];
const WET = ['water', 'earth', 'thunder'];
const byRole = (side, [v, a, s], stat) => [rl(side, 'vanguard', m(stat, v)), rl(side, 'assaulter', m(stat, a)), rl(side, 'supporter', m(stat, s))];
const attacked = (chance, ...effects) => ({ on: 'attacked', ...(chance < 100 ? { chance } : {}), effects });
const onDeath = (chance, ...effects) => ({ on: 'death', ...(chance < 100 ? { chance } : {}), effects });
const resist = (cc, reflect = 150, extra = []) => self(...(cc ? [m('ccRes', cc)] : []), ...(reflect ? [m('reflectRes', reflect)] : []), ...extra);
const either = (...groups) => ({ oneOf: groups });
// Un seul tirage pour tout un groupe d'effets (« X % de chance de ... à tous »).
const together = (chance, ...effects) => ({ chance, oneOf: [effects] });
const curseAll = st(ENEMIES, 'curseFixation', 2, { chance: 90 });

export const SUPPORTERS = [
  // ---------- Vitesse d'équipe 118 % ----------
  {
    id: 'orochimaru-akatsuki', name: 'Orochimaru [Akatsuki]', role: S, gender: 'male', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 40), m('finalReduction', 40), m('immuneIgnoreDef', 20), m('atk', 35), m('def', 50)),
      { to: lowestHp('ally'), mods: [m('air', 50)] },
      enemies(m('atk', -35), m('ccRate', -25), m('punch', -45), m('dr', -7)),
      attacked(35, { to: rand('ally', 2), cleanse: 'debuff' }),
      immune('furyReduction', 'charm', 'deathSeed', 'weakened', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Clone Technique', talents: [allies(m('finalDmg', 25))] }],
    special: {
      name: 'Summoning: Manda', hits: [oneHit(300)], fury: FURY_68,
      effects: [
        st(rand('enemy', 1), 'charm', 2),
        curseAll,
        buff(VG_AS, 2, [m('atk', 25, 'icon')]),
        st(VG_AS, 'pyroblast', 2, { value: 20 }),
        st(rand('enemy', 2), 'armorBreak', 2, { value: 30 }),
        st(rand('enemy', 2), 'untreatment', 2, { chance: 65 }),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'sakura-tsunade', name: 'Tsunade & Sakura', role: S, gender: 'female', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 30), m('atk', 30), m('dr', 35), m('finalDmg', 20)),
      nat('ally', EFT, m('ccRate', 30), m('punch', 30)),
      enemies(m('def', -35), m('dr', -20)),
      { to: SELF, scale: 10, mods: [m('atk', 3)] },
      { to: ALLIES, scale: 10, mods: [m('finalDmg', 4)] },
      resist(0, 150),
      immune('superDodge', 'sSuperDodge', 'stickyAcid', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Yin Seal', talents: [enemies(m('atk', -12))] }],
    special: {
      name: 'Byakugo: Beach Spike', fury: FURY_68,
      pre: [{ to: SELF, hpLossPct: 70 }],
      hits: [oneHit(610), { target: lowestHp('enemy'), pct: 150, attackType: 'physical' }],
      effects: [
        st(VG_AS, 'shatterStorm', 2),
        st(role('ally', 'assaulter'), 'furyShield', 2, { value: 20 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 1), 'critResReduction', 2, { value: 20 }),
        { to: rand('enemy', 1), chance: 60, dot: { name: 'Sticky acid', pct: 35, duration: 2 } },
        st(SELF, 'untreatment', 1),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'madara-moon-eyes', name: 'Uchiha Madara (Moon\'s Eye)', role: S, gender: 'male', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 40), m('atk', 25), m('finalReduction', 40), m('immuneIgnoreDef', 30)),
      nat('ally', EFT, m('ccRes', 25), m('def', 20)),
      enemies(m('atk', -35), m('dr', -40), m('punch', -45)),
      resist(45, 0),
      immune('furyReduction', 'deathSeed', 'charm', 'imprison'),
    ],
    awakenings: [{ name: 'Limbo · Border Jail', talents: [attacked(35, { to: rand('ally', 2), cleanse: 'debuff' })] }],
    special: {
      name: 'Truth-Seeking Pierce', hits: [oneHit(200)], fury: FURY_68,
      effects: [
        st(SELF, 'superarmor', 2),
        fixed(debuff(role('enemy', 'supporter'), 2, [m('punch', -45), m('ccRate', -30)], 'punch −45 %, contrôle −30 % (non dissipable)')),
        st(ENEMIES, 'dispirited', 2, { value: 25 }),
        st(role('ally', 'assaulter'), 'shatterStorm', 2, { value: 20 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'shikamaru-nara', name: 'Shikamaru Nara', role: S, gender: 'male', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      self(m('ccRate', 10)),
      allies(m('speed', 118), m('dr', 35), m('hp', 40), m('atk', 30)),
      nat('ally', EFT, m('finalDmg', 30)),
      rl('ally', 'supporter', m('punch', 20)),
      rl('enemy', ['vanguard', 'assaulter'], m('atk', -30)),
      enemies(m('def', -35)),
      resist(0, 150),
      immune('freeze', 'poisonousWind', 'weakened', 'deathSeed'),
    ],
    awakenings: [{ name: 'Shadow Stitching', talents: [allies(m('sAtk', 35))] }],
    special: {
      name: 'Shadow Fang', hits: [oneHit(450)], fury: FURY_68,
      effects: [
        curseAll, st(ENEMIES, 'windBound', 2, { chance: 90 }),
        st(VG_AS, 'pyroblast', 2, { value: 20 }),
        st(rand('enemy', 1), 'critResReduction', 2, { value: 30 }),
        debuff(ENEMIES, 2, [m('def', -30, 'icon')]),
        buff(role('ally', 'supporter'), 2, [m('dr', 30)]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'xmas-temari', name: 'X-mas Temari', role: S, gender: 'female', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 40), m('finalReduction', 40), m('immuneIgnoreDef', 30), m('atk', 35)),
      nat('ally', EFT, m('def', 40), m('ccRes', 25)),
      rl('ally', 'assaulter', m('air', 50)),
      rl('enemy', ['vanguard', 'assaulter'], m('atk', -30)), rl('enemy', 'supporter', m('atk', -35)),
      enemies(m('punch', -45)),
      attacked(100, st(role('ally', 'assaulter'), 'pyroblast', 2, { value: 15 })),
      attacked(30, { to: rand('enemy', 2), cleanse: 'buff' }),
      immune('furyReduction', 'charm', 'deathSeed', 'weakened', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [
      { on: 'attacked', cond: 'hpHigher', effects: [buff(ALLIES, Infinity, [m('air', 30)], 'Absorption +30 % (éveil Temari)')] },
      { on: 'attacked', cond: 'hpLower', effects: [buff(SELF, Infinity, [m('air', 30)], 'Absorption +30 % (éveil Temari, elle-même)')] },
    ] }],
    special: {
      name: 'Ice Dragon Tornado', hits: [allHit(300)], fury: FURY_68,
      effects: [
        curseAll,
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 2), 'armorBreak', 2, { value: 30 }),
        debuff(ENEMIES, 2, [m('finalDmg', -30)]),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'natsu-dragneel', name: 'Natsu Dragneel', role: S, gender: 'male', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 30), m('atk', 30), m('ccRate', 25), m('ccRes', 25)),
      enemies(m('dr', -20), m('air', -20)),
      resist(0, 150),
      immune('superDodge', 'sSuperDodge', 'deathSeed', 'disable', 'furyReduction', 'weakened'),
    ],
    awakenings: [
      { name: 'Fire Dragon\'s Iron Fist', talents: [nat('ally', EFT, m('ccRate', 5), m('finalDmg', 25), m('punch', 30)), enemies(m('atk', -12), m('def', -30))] },
      { name: 'Fire Dragon\'s Talon', replacePrevious: true, talents: [nat('ally', EFT, m('finalReduction', 25)), enemies(m('atk', -30), m('def', -15), m('punch', -40))] },
      { name: 'Éveil de compétence', replaceHits: [oneHit(550)] },
    ],
    special: {
      name: 'Fire Dragon\'s Roar', hits: [allHit(330)], fury: FURY_68,
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
    id: 'awaken-mitsuki', name: 'Awakened Mitsuki', role: S, gender: 'male', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 40), m('atk', 25), m('finalReduction', 35), m('immuneIgnoreDef', 30)),
      nat('ally', WEF, m('ccRes', 25)),
      rl('enemy', ['vanguard', 'assaulter'], m('atk', -30)), rl('enemy', 'supporter', m('atk', -40)),
      enemies(m('dr', -50), m('punch', -40)),
      resist(30, 0, [m('penMalus', 20)]),
      immune('furyReduction', 'charm', 'weakened', 'deathSeed'),
    ],
    awakenings: [{ name: 'Ray Escape', talents: [attacked(100, heal(30)), attacked(60, { to: rand('enemy', 1), cleanse: 'buff' })] }],
    special: {
      name: 'Great Serpent Biting Explosion', hits: [oneHit(400)], fury: FURY_68,
      effects: [
        st(E_VG_AS, 'painfulWill', 2),
        debuff(role('enemy', 'supporter'), 2, [m('punch', -20)]),
        st(rand('ally', 2), 'windEscape', 2, { value: 10 }),
        st(E_AS_SU, 'dispirited', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'legende-madara', name: 'Legend Madara', role: S, gender: 'male', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 30), m('atk', 30), m('dr', 35), m('ignoreDef', 35), m('penMalus', 20)),
      nat('ally', WEF, m('ccRate', 30), m('punch', 30)),
      enemies(m('dr', -30), m('def', -20)),
      resist(0, 150),
      immune('superDodge', 'sSuperDodge', 'disable', 'deathSeed'),
    ],
    awakenings: [{ name: 'Complete Susano', talents: [{ to: pick('ally', 'highest-dr'), mods: [m('speed', 5)] }] }],
    special: {
      name: 'Susano Divine Dharma Realm', hits: [oneHit(600)], fury: FURY_68,
      effects: [
        st(VG_AS, 'shatterStorm', 2),
        st(role('ally', 'supporter'), 'bond', 2, { value: 35 }),
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 1), 'upwind', 2),
        st(nature('enemy', 'water'), 'corrosion', 2, { value: 15 }),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'uchiha-sarada', name: 'Uchiha Sarada', role: S, gender: 'female', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      allies(m('speed', 118), m('hp', 40), m('atk', 30), m('finalReduction', 30), m('immuneIgnoreDef', 40)),
      nat('ally', WET, m('air', 30), m('ccRes', 25)),
      enemies(m('air', -30), m('atk', -30), m('punch', -40)),
      attacked(100, heal(30)), attacked(30, { to: rand('enemy', 2), cleanse: 'buff' }),
      immune('furyReduction', 'charm', 'deathSeed', 'weakened'),
    ],
    awakenings: [{ name: 'Sharingan', talents: [{ to: { side: 'ally', pick: 'all', main: true }, mods: [m('immuneIgnoreDef', 40)] }] }],
    special: {
      name: 'Thunderbolt', hits: [allHit(300)], fury: FURY_68,
      effects: [
        curseAll,
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('enemy', 2), 'chaoticStorm', 2),
        st(rand('enemy', 1), 'corrosion', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'mitarashi-anko', name: 'Mitarashi Anko', role: S, gender: 'female', base: { speed: 93, dr: 75, air: 75 },
    talents: [
      self(m('ccRate', 5)),
      allies(m('speed', 118), m('hp', 40), m('atk', 30), m('dr', 30), m('ignoreDef', 40)),
      nat('ally', ['earth', 'fire', 'water'], m('finalDmg', 30), m('sAtk', 30)),
      rl('enemy', ['vanguard', 'assaulter'], m('atk', -30)),
      resist(0, 150),
      immune('freeze', 'poisonousWind', 'weakened', 'deathSeed'),
    ],
    awakenings: [{ name: 'Double Snake Killing', talents: [rl('ally', 'supporter', m('punch', 15))] }],
    special: {
      name: 'Fierce Snake Ravage', hits: [oneHit(420)], fury: FURY_68,
      effects: [
        curseAll, st(ENEMIES, 'imprison', 2, { chance: 90 }),
        st(VG_AS, 'pyroblast', 2),
        st(rand('enemy', 1), 'upwind', 2),
        debuff(ENEMIES, 2, [m('def', -30, 'icon')]),
        dispelEnemies,
      ],
    },
  },
  // ---------- Vitesse d'équipe 116 % ----------
  {
    id: 'susanoo-itachi-sasuke', name: 'Susanoo Itachi & Sasuke', role: S, gender: 'male', base: { speed: 92, dr: 65, air: 75 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('atk', 30), m('ccRes', 25)),
      nat('ally', WET, m('air', 40), m('immuneIgnoreDef', 20)),
      { to: pick('ally', 'highest-air'), mods: [m('hp', 30)] },
      enemies(m('atk', -30), m('punch', -20)),
      attacked(30, { to: rand('ally', 2), cleanse: 'debuff' }),
      resist(30, 0, [m('penMalus', 10)]),
      immune('chaos', 'charm', 'seal', 'deathSeed', 'weakened'),
    ],
    awakenings: [{ name: 'Susanoo', talents: [rl('enemy', 'vanguard', m('ccRes', -15))] }],
    special: {
      name: 'Susanoo: Sojin Rairin', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(pick('ally', 'highest-speed'), 'bond', 2, { chance: 50 }),
        buff(ALLIES, 2, [m('finalReduction', 35)]),
        st(role('enemy', 'vanguard'), 'chaoticStorm', 2),
        st(role('enemy', 'assaulter'), 'chaoticStorm', 2, { chance: 35 }),
        st(E_VG_AS, 'painfulWill', 2),
        debuff(ENEMIES, 2, [m('dr', -30)]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'hinata-the-last', name: 'Hinata The Last', role: S, gender: 'female', base: { speed: 92, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('atk', 30), m('ignoreDef', 45)),
      nat('ally', ['water', 'wind', 'fire'], m('ccRate', 30), m('punch', 30)),
      enemies(m('block', -35), m('air', -50)),
      resist(0, 150),
      immune('superDodge', 'sSuperDodge', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Eight Trigrams Air Palm', talents: [{ to: pick('ally', 'highest-dr'), mods: [m('speed', 5)] }] }],
    special: {
      name: 'Eight Trigrams Twin Lion Surging Shot', hits: [oneHit(600)], fury: FURY_68,
      effects: [
        st(rand('ally', 2), 'superDodge', 2, { chance: 50 }),
        st(VG_AS, 'shatterStorm', 2),
        st(rand('enemy', 2), 'chaoticStorm', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'indra-ashura', name: 'Indra & Ashura', role: S, gender: 'male', base: { speed: 92, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 40), m('ignoreDef', 40), m('atk', 30)),
      nat('ally', ['wind', 'thunder', 'water'], m('dr', 35)),
      enemies(m('block', -30), m('dr', -25)),
      rl('enemy', ['vanguard', 'assaulter'], m('atk', -30)),
      { to: ENEMIES, scale: 10, mods: [m('def', -6)] },
      resist(0, 150),
      immune('disable', 'poisonousWind', 'weakened', 'deathSeed'),
    ],
    awakenings: [{ name: 'Ōtsutsuki Power', talents: [
      { to: { side: 'ally', pick: 'all', role: 'assaulter', name: 'hashirama' }, mods: [m('air', -10)] },
      { to: { side: 'ally', pick: 'all', role: 'vanguard', name: ['7th hokage', 'final sasuke'] }, mods: [m('dr', 30)] },
    ] }],
    special: {
      name: 'Sage Art: Susanoo Dashing Wind Slash', hits: [oneHit(420)], fury: FURY_68,
      effects: [
        curseAll, st(ENEMIES, 'freeze', 2, { chance: 90 }),
        st(VG_AS, 'pyroblast', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'otsutsuki-isshiki', name: 'Otsutsuki Isshiki', role: S, gender: 'male', base: { speed: 92, dr: 75, air: 65 },
    talents: [
      allies(m('speed', 116), m('dr', 30), m('finalDmg', 30), m('atk', 30)),
      nat('ally', ['wind', 'thunder', 'water'], m('ccRate', 30), m('punch', 30)),
      { to: pick('enemy', 'highest-dr'), mods: [m('ccRes', -10)] },
      { to: pick('ally', 'highest-dr'), mods: [m('speed', 5)] },
      resist(0, 150),
      immune('superDodge', 'sSuperDodge', 'disable', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Parasite', talents: [allies(m('sAtk', 40))] }],
    special: {
      name: 'Big Box Sky', fury: { self: 100, allies: 68 },
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
    id: 'uchiha-hikari', name: 'Uchiha Hikari', role: S, gender: 'female', base: { speed: 92, dr: 60, air: 80 },
    talents: [
      allies(m('speed', 116), m('hp', 35), m('atk', 30), m('finalReduction', 40)),
      nat('ally', WET, m('ccRes', 25), m('def', 50), m('immuneIgnoreDef', 45)),
      enemies(m('atk', -30), m('punch', -45)),
      immune('chaos', 'charm', 'deathSeed', 'furyReduction', 'weakened'),
    ],
    awakenings: [{ name: 'Pupil Technique', talents: [attacked(35, { to: rand('enemy', 2), cleanse: 'buff' })] }],
    special: {
      name: 'Unlimited Engraving Tsukuyomi', hits: [allHit(300)], fury: FURY_68,
      effects: [
        curseAll,
        st(rand('ally', 1), 'superarmor', 2),
        st(rand('ally', 2), 'bond', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'orochimaru-boruto', name: 'Orochimaru (New Hera)', role: S, gender: 'male', base: { speed: 92, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 40), m('finalDmg', 30), m('atk', 30)),
      enemies(m('block', -30), m('dr', -35)),
      rl('enemy', ['vanguard', 'assaulter'], m('atk', -30)),
      onDeath(100, { revive: 60 }),
      resist(0, 150),
      immune('windBound', 'poisonousWind', 'weakened', 'deathSeed'),
    ],
    awakenings: [{ name: 'Four Black Snakes Formation', talents: [nat('ally', ['wind', 'earth', 'water'], m('dr', 30))] }],
    special: {
      name: 'Naga\'s Curse', hits: [oneHit(420)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'windBound', 2, { chance: 90 }),
        { chance: 90, ...either([st(ENEMIES, 'curseFixation', 2)], [st(ENEMIES, 'seal', 2)]) },
        st(lowestHp('enemy'), 'poisonousWind', 2),
        st(VG_AS, 'pyroblast', 2),
        st(role('ally', 'supporter'), 'windEscape', 2, { value: 10 }),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'kamado-nezuko', name: 'Kamado Nezuko', role: S, gender: 'female', base: { speed: 92, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('atk', 30)),
      nat('ally', ['water', 'wind', 'thunder'], m('ccRate', 25)),
      nat('ally', ['water', 'fire', 'earth'], m('ccRes', 25)),
      nat('ally', ['fire', 'wind'], m('dr', 40), m('sAtk', 30)),
      nat('ally', ['earth', 'thunder'], m('air', 40), m('immuneIgnoreDef', 30)),
      nat('ally', 'water', m('dr', 30), m('air', 30), m('sAtk', 30), m('immuneIgnoreDef', 30)),
      { to: pick('ally', 'highest-dr'), mods: [m('finalDmg', 25)] },
      { to: pick('ally', 'highest-ccres'), mods: [m('finalReduction', 25)] },
      enemies(m('atk', -30)),
      resist(0, 150),
      immune('sSuperDodge', 'poisonousWind', 'weakened', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Complete Ghost', talents: [
      attacked(40, heal(40)),
      attacked(40, st({ side: 'ally', pick: 'lowest-ccrate' }, 'shatterStorm', 2)),
    ] }],
    special: {
      name: 'Bloodghost. Bloodburst', hits: [{ target: role('enemy', 'assaulter'), pct: 390 }], fury: FURY_68,
      effects: [
        st(ENEMIES, 'seal', 2, { chance: 90 }), st(ENEMIES, 'freeze', 2, { chance: 90 }),
        st(rand('enemy', 1), 'poisonousWind', 2),
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
    id: '9-tails-minato', name: 'Kyubi Minato', role: S, gender: 'male', base: { speed: 92, dr: 75, air: 65 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('atk', 30), m('sBlockRes', 35)),
      nat('ally', ['wind', 'water'], m('ccRate', 30)),
      enemies(m('air', -60), m('block', -40)),
      resist(0, 150),
      immune('superDodge', 'sSuperDodge', 'disable', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'Complete Family', talents: [
      { to: named('ally', 'kushina'), mods: [m('dr', 30)] },
      { to: named('ally', 'naruto'), mods: [m('def', 40)] },
    ] }],
    special: {
      name: 'Flying Thunder God Mutually Instantaneous Revolving Technique', hits: [oneHit(600)], fury: { self: 100, allies: 50 },
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
    id: 'pain-d-ete', name: 'Summer Pain', role: S, gender: 'male', base: { speed: 92, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('air', 30), m('mdefShield', 50)),
      rl('ally', 'assaulter', m('atk', 35), m('dr', 35)),
      nat('ally', ['water', 'fire', 'thunder'], m('ccRes', 25), m('def', 50)),
      enemies(m('atk', -30)),
      attacked(40, st(ATTACKER, 'weakened', 1)),
      attacked(75, { to: rand('enemy', 2), fury: -45 }, { to: ALLIES_BUT_SELF, fury: 30 }),
      immune('weakened', 'furyReduction', 'deathSeed'),
    ],
    awakenings: [{ name: 'The Art of Turning Images', talents: [immune('charm', 'poisonousWind')] }],
    special: {
      name: 'Wild Water Wave', hits: [allHit(200)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 90 }),
        st(rand('enemy', 2), 'untreatment', 2),
        st(rand('enemy', 2), 'weakened', 2),
        st(rand('enemy', 2), 'corrosion', 2),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'uzumaki-menma', name: 'Uzumaki Menma', role: S, gender: 'male', base: { speed: 92, dr: 65, air: 75 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('atk', 30)),
      nat('ally', WET, m('ccRes', 25)),
      enemies(m('atk', -30), m('dr', -40), m('critDmg', -30)),
      attacked(100, heal(40)), attacked(30, { to: rand('enemy', 2), cleanse: 'buff' }),
      self(m('hp', 30), m('def', 30)),
      immune('chaos', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Kumen Sowaka', talents: [attacked(30, { to: rand('ally', 2), cleanse: 'debuff' }), immune('freeze')] }],
    special: {
      name: 'Great Spiralling Ring', hits: [allHit(250)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'imprison', 2, { chance: 90 }),
        st(rand('enemy', 1), 'poisonousWind', 2),
        st(role('ally', 'assaulter'), 'shatterStorm', 2),
        st(role('ally', 'supporter'), 'bond', 2),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon'), m('finalDmg', -30)]),
      ],
    },
  },
  {
    id: 'neji-ying-yang', name: 'Neji Hyuga', role: S, gender: 'male', base: { speed: 92, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 35), m('air', 40)),
      enemies(m('ccRate', -30), m('atk', -30)),
      attacked(40, st(rand('ally', 1), 'ccFree', 2)),
      immune('chaos', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Light of a Firefly', talents: [immune('seal')] }],
    special: {
      name: 'Dharma Power Sealing Technique', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'chaos', 2, { chance: 90 }),
        st(rand('enemy', 2), 'seal', 2, { chance: 90 }),
        cleanseAllies,
        st(VG, 'bond', 2),
        st(role('ally', 'assaulter'), 'pyroblast', 2),
        st(rand('ally', 1), 'superarmor', 2),
      ],
    },
  },
  {
    id: 'snow-sakura', name: 'Snow Sakura', role: S, gender: 'female', base: { speed: 92, dr: 75, air: 65 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('ccRate', 30)),
      { to: gendered('ally', 'male'), mods: [m('dr', 30)] },
      enemies(m('air', -30), m('def', -30), m('block', -40)),
      resist(0, 150),
      immune('freeze', 'poisonousWind', 'deathSeed'),
    ],
    awakenings: [{ name: 'Yin Seal. Release', talents: [allies(m('critDmg', 30)), immune('superDodge')] }],
    special: {
      name: 'Cherry Blossom Array', fury: FURY_68,
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
    id: 'naruto-baryon', name: 'Baryon Naruto', role: S, gender: 'male', base: { speed: 92, dr: 70, air: 70 },
    talents: [
      allies(m('speed', 116), m('air', 30), m('hp', 30), m('atk', 30)),
      { to: AS_SU, mods: [m('punch', 25)] },
      enemies(m('block', -30)),
      rl('enemy', ['vanguard', 'assaulter'], m('finalReduction', -30)),
      rl('enemy', ['assaulter', 'supporter'], m('atk', -30)),
      resist(0, 150),
      immune('windBound', 'freeze', 'deathSeed'),
    ],
    awakenings: [{ name: 'Heavy Particle Mode', talents: [
      self(m('hp', -30)), { to: ALLIES_BUT_SELF, mods: [m('ignoreDef', 40)] }, immune('poisonousWind'),
    ] }],
    special: {
      name: 'Ultra-Big Ball Rasengan', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 200, assaulter: 420, supporter: 200 } }],
      effects: [
        st(ENEMIES, 'windBound', 2, { chance: 90 }),
        { chance: 90, ...either([st(ENEMIES, 'imprison', 2)], [st(ENEMIES, 'seal', 2)]) },
        st(rand('enemy', 2), 'weakened', 2),
        st(VG_AS, 'pyroblast', 2),
        cleanseAllies, heal(50),
      ],
    },
  },
  {
    id: 'terumi-mei-d-ete', name: 'Terumi Mei (summer)', role: S, gender: 'female', base: { speed: 92, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 116), m('hp', 30)),
      nat('ally', 'water', m('dr', 40), m('finalDmg', 30), m('def', 40)),
      enemies(m('recoveryCut', 40), m('atk', -30)),
      attacked(100, buff(SELF, 2, [m('speed', 10, 'icon')])),
      resist(30, 150),
      immune('superDodge', 'charm', 'chaos', 'deathSeed'),
    ],
    awakenings: [{ name: 'Boil Release - Fog', talents: [attacked(35, st(role('ally', 'supporter'), 'ccFree', 2)), self(m('immuneIgnoreDef', 50))] }],
    special: {
      name: 'Water Release: Water Dragon', fury: FURY_68,
      hits: [{ target: role('enemy', 'vanguard'), pct: 700 }, { target: lowestHp('enemy'), pct: 350 }],
      effects: [
        pen(100, highestHp('enemy'), 'magic'),
        st(rand('enemy', 1), 'charm', 2),
        { chance: 90, ...either([st(ENEMIES, 'freeze', 2)], [st(ENEMIES, 'imprison', 2)]) },
        heal(120),
        st(role('enemy', 'supporter'), 'weakened', 2),
        buff(nature('ally', 'water'), 2, [m('ccRes', 30), m('def', 50, 'icon')]),
      ],
    },
  },
  {
    id: 'utakata', name: '6-tail Utakata', role: S, gender: 'male', tags: ['jinchuriki'], base: { speed: 92, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 116), m('atk', 30)),
      ...byRole('ally', [30, 30, 50], 'hp'),
      nat('ally', 'water', m('def', 50), m('ccRes', 30)),
      nat('enemy', ['fire', 'thunder'], m('dr', -40)),
      attacked(100, st(ATTACKER, 'weakened', 1)),
      attacked(35, st(ATTACKER, 'freeze', 2)),
      immune('superDodge', 'freeze', 'windBound', 'deathSeed'),
    ],
    awakenings: [{ name: 'Wisdom Wolf Decay', talents: [self(m('def', 40), m('immuneIgnoreDef', 40))] }],
    special: {
      name: 'Shabondama', hits: [allHit(300)], fury: FURY_68,
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
    id: 'kurotsuchi', name: 'Kurotsuchi', role: S, gender: 'female', base: { speed: 92, dr: 60, air: 70 },
    talents: [
      allies(m('speed', 116), m('hp', 30), m('air', 40), m('def', 40)),
      { to: AS_SU, mods: [m('penMalus', 30)] },
      rl('enemy', 'supporter', m('ccRate', -20)),
      attacked(100, heal(40)),
      attacked(30, st(SELF, 'ccFree', 2), st(VG, 'ccFree', 2)),
      self(m('immuneIgnoreDef', 40)),
      immune('chaos', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [attacked(50, cleanseSelf), immune('imprison')] }],
    special: {
      name: 'Skill', hits: [allHit(250)], fury: FURY_68,
      effects: [
        { chance: 90, ...either([st(ENEMIES, 'imprison', 2)], [st(ENEMIES, 'freeze', 2)]) },
        { chance: 90, ...either([st(ENEMIES, 'petrify', 2)], [st(ENEMIES, 'collapse', 2)]) },
        st(role('enemy', 'supporter'), 'weakened', 2),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon'), m('punch', -30)]),
        buff(role('ally', 'supporter'), 2, [m('def', 200, 'icon')]),
        dispelEnemies,
      ],
    },
  },
  {
    id: 'hyakki-sasori', name: 'Hyakki Sasori', role: S, gender: 'male', base: { speed: 92, dr: 70, air: 60 },
    talents: [
      allies(m('speed', 116)),
      nat('ally', 'thunder', m('atk', 30), m('punch', 20)),
      nat('enemy', 'none', m('ccRes', -20)),
      nat('enemy', 'earth', m('air', -30)),
      nat('enemy', 'fire', m('dotBonus', -30)),
      resist(0, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'disable', 'void', 'poisonousWind'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [self(m('block', 30)), immune('charm')] }],
    normal: {
      name: 'Normal Skill', hits: [allHit(330)],
      effects: [
        st(ENEMIES, 'void', 2, { chance: 90 }),
        st(ENEMIES, 'windBound', 2, { chance: 90 }),
        st(ALLIES, 'soulPrison', 2),
        { to: rand('enemy', 3), cleanse: 'buff' },
        { to: nature('ally', 'thunder'), hot: 90, duration: 2 },
        st(VG_AS, 'shatterStorm', 2),
      ],
    },
    special: {
      name: 'Special Skill', hits: [allHit(300)],
      effects: [
        st(ENEMIES, 'imprison', 2, { chance: 90 }),
        { to: ENEMIES, dot: { name: 'Poison', pct: 120, duration: 3 } },
        cleanseAllies,
        st(VG_AS, 'furyShield', 3),
        debuff(ENEMIES, 3, [m('antiCrit', -40), m('recoveryCut', 50)]),
      ],
    },
  },
  {
    id: 'reanimated-hidan', name: 'Reanimated Hidan', role: S, gender: 'male', base: { speed: 92, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 116), m('hp', 40), m('atk', 25), m('finalReduction', 15)),
      rl('ally', ['vanguard', 'assaulter'], m('block', 35)),
      ...byRole('enemy', [-25, -50, -30], 'dr'),
      onDeath(100, { revive: 80 }),
      self(m('hp', 30), m('penMalus', 30)),
      immune('seal', 'blind', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [nat('ally', ['fire', 'earth'], m('ccRes', 25))] }],
    special: {
      name: 'Jujutsu: Shiji Hyketsu', hits: [allHit(350)], fury: FURY_68,
      effects: [
        { to: ENEMIES, dot: { name: 'Bleed', pct: 120, duration: 2 } },
        st(ENEMIES, 'chaos', 2, { chance: 90 }),
        st(ENEMIES, 'disable', 2),
        st(role('enemy', 'assaulter'), 'painfulWill', 2),
        buff(VG, 2, [m('speed', 40, 'icon')]),
      ],
    },
  },
  {
    id: 'christmas-mito', name: 'Christmas Mito', role: S, gender: 'female', base: { speed: 92, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 116), m('hp', 35), m('atk', 30)),
      enemies(m('atk', -30)),
      nat('enemy', ['fire', 'earth', 'wind'], m('ccRes', -15), m('ccRate', -15)),
      self(m('hp', 30)),
      resist(0, 150, [m('ignoreEnemyAtk', 10)]),
      immune('superDodge', 'chaos', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [nat('ally', 'thunder', m('ccRes', 25)), self(m('def', 20), m('block', 30))] }],
    normal: {
      name: 'Normal Skill', hits: [allHit(350)],
      effects: [
        st(VG, 'ccFree', 2),
        st(role('ally', 'supporter'), 'ccFree', 2, { chance: 50 }),
        st(rand('enemy', 1), 'imprison', 2),
        st(rand('enemy', 2), 'upwind', 2),
        { to: rand('ally', 2), cleanse: 'debuff' },
        st(role('enemy', 'vanguard'), 'chaos', 2, { chance: 110 }),
        heal(100),
      ],
    },
    special: { name: 'Special Skill', hits: [allHit(300)], effects: [st(ALLIES, 'shatterStorm', 4), dispelEnemies] },
  },
  {
    id: 'sakon-ukon', name: 'Sakon & Ukon', role: S, gender: 'male', base: { speed: 92, dr: 65, air: 65 },
    talents: [
      allies(m('speed', 116), m('air', 40), m('hp', 30)),
      nat('ally', 'fire', m('atk', 50)),
      nat('ally', 'earth', m('def', 60), m('finalReduction', 30)),
      enemies(m('dr', -30)),
      nat('enemy', 'wind', m('ccRate', -30)),
      nat('enemy', 'fire', m('atk', -50)),
      attacked(40, st(nature('ally', 'earth'), 'ccFree', 2)),
      resist(0, 150),
      immune('seal', 'charm', 'deathSeed'),
    ],
    awakenings: [{ name: 'Multiple Rakshasa', specialHits: [{ target: nature('enemy', 'fire'), pct: 300 }],
      specialEffects: [{ to: nature('enemy', 'wind'), dot: { name: 'Incinerate', pct: 150, duration: 2 } }] }],
    special: {
      name: 'Attack of the Twin Demons', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(nature('enemy', ['fire', 'wind']), 'seal', 2),
        st(nature('ally', 'fire'), 'shatterStorm', 2),
        debuff(ENEMIES, 2, [m('finalDmg', -30)]),
        debuff(nature('enemy', 'fire'), 2, [m('atk', -40, 'icon')]),
      ],
    },
  },
  {
    id: 'yugao-uzuki', name: 'Yugao Uzuki', role: S, gender: 'female', base: { speed: 92, dr: 65, air: 60 },
    talents: [
      allies(m('speed', 116), m('sAtk', 35), m('hit', 70)),
      ...byRole('ally', [40, 40, 20], 'dr'),
      enemies(m('air', -30)),
      resist(0, 150),
      immune('freeze', 'chaos', 'deathSeed'),
    ],
    awakenings: [{ name: 'Leaf Style Slay', talents: [rl('ally', 'assaulter', m('matk', 40))] }],
    special: {
      name: 'Skill', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 500, assaulter: 300, supporter: 300 } }],
      effects: [
        st(ENEMIES, 'expel', 2, { chance: 90 }),
        st(role('enemy', 'vanguard'), 'weakened', 2),
        st(role('ally', 'assaulter'), 'shatterStorm', 2),
        debuff(ENEMIES, 2, [m('def', -40, 'icon')]),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'uzumaki-naruko', name: 'Uzumaki Naruko', role: S, gender: 'female', base: { speed: 92, dr: 60, air: 60 },
    talents: [
      allies(m('speed', 116), m('hp', 30)),
      { to: gendered('ally', 'male'), mods: [m('finalDmg', 40), m('ccRate', 30), m('atk', 30)] },
      { to: gendered('enemy', 'male'), mods: [m('def', -30), m('finalReduction', -30)] },
      { to: gendered('enemy', 'female'), mods: [m('speed', -5), m('def', 20)] },
      resist(0, 150),
      immune('charm', 'chaos', 'deathSeed'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [attacked(30, st(SELF, 'shielding', 2))] }],
    special: {
      name: 'Harem Technique', hits: [allHit(300)], fury: FURY_68,
      effects: [
        { chance: 90, ...either([st(gendered('enemy', 'female'), 'disable', 2)], [st(gendered('enemy', 'female'), 'stun', 2)]) },
        st(gendered('enemy', 'male'), 'chaos', 2, { chance: 110 }),
        st(gendered('enemy', 'male'), 'weakened', 2, { chance: 50 }),
        buff(gendered('ally', 'male'), 2, [m('dr', 30), m('crit', 50)]),
        debuff(gendered('enemy', 'male'), 2, [m('def', -30, 'icon'), m('dr', -40)]),
      ],
    },
  },
  {
    id: 'kurenai-kimono', name: 'Kimono Kurenai', role: S, gender: 'female', base: { speed: 92, dr: 50, air: 75 },
    talents: [
      allies(m('speed', 116), m('air', 40), m('hp', 30), m('ccRes', 25)),
      rl('enemy', ['assaulter', 'supporter'], m('punch', -30)),
      attacked(50, { to: ENEMIES, fury: -30 }, debuff(ENEMIES, 2, [m('hit', -300)])),
      immune('imprison', 'blind', 'furyReduction'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [self(m('hp', 20), m('def', 30))] }],
    special: {
      name: 'Magic Bondage Kill', hits: [allHit(280)], fury: FURY_68,
      effects: [
        { chance: 80, ...either([st(ENEMIES, 'collapse', 2)], [st(ENEMIES, 'stun', 2)]) },
        { chance: 90, ...either([st(ENEMIES, 'imprison', 2)], [st(ENEMIES, 'blind', 2)]) },
        st(ENEMIES, 'seal', 2),
        heal(120),
        either([debuff(role('enemy', 'assaulter'), 2, [m('dr', -60)])], [buff(role('ally', 'assaulter'), 2, [m('dr', 50)])]),
        either([debuff(ENEMIES, 2, [m('atk', -30, 'icon')])], [buff(ALLIES_BUT_SELF, 2, [m('atk', 30, 'icon')])]),
        either([debuff(role('enemy', 'vanguard'), 2, [m('def', -100, 'icon')])], [buff(SELF, 2, [m('def', 500, 'icon')])]),
      ],
    },
  },
  {
    id: 'mitsuki', name: 'Mitsuki', role: S, gender: 'male', base: { speed: 92, dr: 65, air: 60 },
    talents: [
      allies(m('speed', 116), m('dr', 30), m('air', 30)),
      rl('ally', 'vanguard', m('speed', 20)),
      enemies(m('def', -30), m('air', -30)),
      rl('enemy', ['assaulter', 'supporter'], m('atk', -25)),
      { to: SELF, hpBelow: 50, mods: [m('ignoreDef', 40)] },
      resist(0, 150),
      immune('windBound', 'imprison', 'furyReduction'),
    ],
    awakenings: [{ name: 'Éveil 1', talents: [onDeath(100, pen(100, rand('enemy', 1)))] }],
    special: {
      name: 'Sage Art: Great Snake', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 300, assaulter: 380, supporter: 300 } }],
      effects: [
        st(ENEMIES, 'windBound', 2, { chance: 80 }), st(ENEMIES, 'paralysis', 2, { chance: 80 }),
        st(role('enemy', 'assaulter'), 'weakened', 2),
        buff(ALLIES, 2, [m('atk', 30, 'icon'), m('aid', 40)]),
      ],
    },
  },
  // ---------- Vitesse d'équipe 115 % et moins ----------
  {
    id: 'miko-shion', name: 'Miko Shion', role: S, gender: 'female', base: { speed: 90, dr: 50, air: 70 },
    talents: [
      allies(m('speed', 115), m('hp', 30)),
      ...byRole('ally', [15, 20, 25], 'sBlockRes'),
      ...byRole('ally', [10, 15, 20], 'sCritRes'),
      enemies(m('def', -30), m('dr', -30)),
      { to: ALLIES_BUT_SELF, scale: 10, mods: [m('finalReduction', 5), m('def', 10)] },
      attacked(100, heal(70)),
      immune('windBound', 'chaos', 'deathSeed'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [{ to: ENEMIES, scale: 10, mods: [m('air', -6)] }] },
      { name: 'Éveil 2', talents: [attacked(40, cleanseAllies)] },
    ],
    special: {
      name: 'Seal of the Miko', hits: [allHit(250)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'windBound', 2),
        { to: role('enemy', 'supporter'), cleanse: 'buff' },
        buff(VG, 2, [m('dr', 50)]),
        buff(ALLIES, 2, [m('air', 30)]),
        debuff(E_AS_SU, 2, [m('punch', -30), m('ccRate', -30)]),
      ],
    },
  },
  {
    id: 'kabuto-sage-dragon', name: 'Sage Dragon Kabuto', role: S, gender: 'male', base: { speed: 89, dr: 60, air: 60 },
    talents: [
      allies(m('speed', 114), m('atk', 30)),
      ...byRole('enemy', [-20, -35, -30], 'atk'),
      rl('ally', 'vanguard', m('dr', 40)),
      { to: ALLIES_BUT_SELF, scale: 8, mods: [m('ignoreDef', 10), m('ccRate', 10)] },
      onDeath(100, { revive: 60 }),
      resist(0, 150),
      immune('imprison', 'blind', 'deathSeed'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [attacked(50, { to: ALLIES, fury: 30 })] },
      { name: 'Éveil 2', talents: [enemies(m('recoveryCut', 40))] },
    ],
    special: {
      name: 'Senpo White Rage', hits: [allHit(350)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'chaos', 2), st(ENEMIES, 'blind', 2, { chance: 80 }),
        cleanseAllies,
        buff(VG, 2, [m('dodge', 340)]),
        buff(AS_SU, 2, [m('atk', 30, 'icon')]),
      ],
    },
  },
  {
    id: 'tayuya-cursed', name: 'Cursed Tayuya', role: S, gender: 'female', base: { speed: 88, dr: 70, air: 55 },
    talents: [
      enemies(m('speed', -53)),
      rl('enemy', 'assaulter', m('ccRes', -15)),
      rl('enemy', 'supporter', m('pdef', -30)), rl('enemy', 'vanguard', m('mdef', -50)), rl('enemy', 'assaulter', m('mdef', -30)),
      allies(m('atk', 30), m('hp', 20)),
      { to: ALLIES, scale: 10, mods: [m('dr', 10), m('atk', 5)] },
      resist(0, 150),
      immune('seal', 'windBound', 'chaos'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [self(m('dr', 15))] },
      { name: 'Éveil 2', talents: [onDeath(100, { to: role('enemy', 'assaulter'), strike: 300 })] },
      { name: 'Éveil 3 (carte spéciale)', base: { speed: 92, dr: 70, air: 55 }, talents: [
        enemies(m('speed', 53)), allies(m('speed', 116), m('hp', 10), m('air', 30)), immune('charm'),
      ] },
    ],
    special: {
      name: 'Final Chapter 9: Chaotic Demon', fury: FURY_68,
      hits: [{ target: ENEMIES, pctByRole: { vanguard: 450, assaulter: 180, supporter: 180 } }],
      effects: [
        st(ENEMIES, 'seal', 2, { chance: 80 }),
        heal(150, ALLIES_BUT_SELF),
        st(ALLIES_BUT_SELF, 'furyShield', 2),
        buff(ALLIES, 2, [m('dr', 40), m('def', 40, 'icon')]),
      ],
    },
  },
  {
    id: 'pain-naraka', name: 'Naraka Path Pain', role: S, gender: 'male', base: { speed: 87, dr: 55, air: 70 },
    talents: [
      allies(m('speed', 112), m('hp', 30), m('air', 30)),
      rl('enemy', ['assaulter', 'supporter'], m('dr', -30)),
      { on: 'attacked', cond: 'hpHigher', effects: [buff(role('ally', 'supporter'), Infinity, [m('def', 120, 'icon')], 'Défenses +120 % (Naraka)')] },
      { on: 'attacked', cond: 'hpLower', effects: [buff(SELF, Infinity, [m('air', 60)], 'Absorption +60 % (Naraka)')] },
      attacked(100, heal(50)),
      immune('blind', 'deathSeed', 'chaos'),
    ],
    awakenings: [
      { name: 'Awaken Religious Leader', talents: [allies(m('recovery', 30))] },
      { name: 'Awaken Sentence of King of Hell', talents: [
        onDeath(100, { oneOf: [[st(rand('enemy', 1), 'deathSeed', 2)], [st(rand('enemy', 2), 'deathSeed', 2)]], weights: [85, 15] }),
      ] },
    ],
    special: {
      name: 'Skill', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'chaos', 2), st(ENEMIES, 'silence', 2), st(ENEMIES, 'blind', 2),
        { to: role('enemy', 'assaulter'), fury: -100 }, { to: role('enemy', 'assaulter'), cleanse: 'buff' },
        debuff(ENEMIES, 2, [m('ccRate', -30)]),
        buff(AS_SU, 2, [m('punch', 30), m('atk', 30, 'icon')]),
      ],
    },
  },
  {
    id: 'hinata-princess', name: 'Princess Hinata', role: S, gender: 'female', base: { speed: 86, dr: 70, air: 55 },
    talents: [
      allies(m('speed', 110), m('ccRes', 25)),
      ...byRole('ally', [50, 30, 30], 'dr'),
      rl('ally', 'vanguard', m('finalReduction', 45)),
      self(m('atk', 15)),
      resist(0, 120),
      immune('superDodge', 'blind', 'imprison'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [allies(m('def', 20))] },
      { name: 'Éveil 2', talents: [{ to: gendered('ally', 'male'), mods: [m('atk', 20)] }, { to: gendered('enemy', 'male'), mods: [m('atk', -30)] }] },
    ],
    special: {
      name: 'Memories of Fireworks', hits: [allHit(330)], fury: { self: 100, allies: 30 },
      effects: [
        { chance: 90, ...either([st(ENEMIES, 'imprison', 2)], [st(ENEMIES, 'blind', 2)]) },
        { chance: 90, ...either([st(ENEMIES, 'acupoint', 2)], [st(ENEMIES, 'stun', 2)]) },
        pen(65),
        buff(ALLIES, 2, [m('ccRate', 50)]),
        debuff(ENEMIES, 2, [m('atk', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'mui', name: 'Mui', role: S, gender: 'male', base: { speed: 85, dr: 30, air: 80 },
    talents: [
      allies(m('speed', 104)),
      ...byRole('ally', [55, 40, 40], 'air'),
      enemies(m('atk', -25)),
      attacked(100,
        either([st(ATTACKER, 'stun', 2)], [st(ATTACKER, 'silence', 2)]),
        either([st(ATTACKER, 'curseFixation', 2)], [st(ATTACKER, 'paralysis', 2)]),
        either([st(ATTACKER, 'forbidFury', 2)], [st(ATTACKER, 'fear', 2)])),
      immune('imprison', 'furyReduction', 'windBound'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [self(m('dr', 10))] },
      { name: 'Éveil de compétence', replaceHits: [allHit(180)] },
    ],
    special: {
      name: 'Fire Release: Great Fire Heavenly Prison', hits: [allHit(120)], fury: FURY_68,
      effects: [
        { to: ENEMIES, chance: 80, dot: { name: 'Burn', pct: 80, duration: 2 } },
        { to: ENEMIES, dot: { name: 'Incinerate', pct: 100, duration: 2 } },
        st(role('enemy', 'supporter'), 'imprison', 2), st(role('enemy', 'supporter'), 'skillForbid', 2),
        st(role('enemy', 'vanguard'), 'untreatment', 2),
        debuff(role('enemy', 'assaulter'), 2, [m('def', -50, 'icon')]),
        buff(ALLIES, 2, [m('atk', 30, 'icon'), m('air', 20)]),
      ],
    },
  },
  {
    id: 'yamanaka-ino', name: 'Yamanaka Ino', role: S, gender: 'female', base: { speed: 84, dr: 60, air: 55 },
    talents: [
      allies(m('speed', 102), m('hp', 25)),
      enemies(m('dr', -20)),
      attacked(35, cleanseSelf), attacked(50, cleanseAllies),
      attacked(80, either([st(ATTACKER, 'blind', 2)], [st(ATTACKER, 'imprison', 2)])),
      attacked(100, either([st(ATTACKER, 'curseFixation', 2)], [st(ATTACKER, 'chaos', 2)])),
      immune('blind', 'freeze'),
    ],
    awakenings: [
      { name: 'Éveil 1', talents: [self(m('aid', 10), m('punch', 10))] },
      { name: 'Éveil 2', talents: [attacked(50, cleanseSelf)] },
    ],
    special: {
      name: 'Charm', hits: [{ target: lowestHp('enemy'), pct: 400 }, { target: rand('enemy', 2), pct: 400 }], fury: FURY_68,
      effects: [
        heal(150, ALLIES_BUT_SELF),
        together(55, st(ALLIES_BUT_SELF, 'sSuperDodge', 2)),
        st(E_AS_SU, 'painfulWill', 2),
        debuff(E_AS_SU, 2, [m('atk', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'temari-wing-blaster', name: 'Wing Blaster Temari', role: S, gender: 'female', base: { speed: 82, dr: 60, air: 50 },
    talents: [
      enemies(m('speed', -50), m('air', -28)),
      allies(m('atk', 25), m('dr', 30), m('hit', 80)),
      resist(0, 150, [m('ignoreEnemyAtk', 20)]),
      immune('deathSeed', 'windBound'),
    ],
    special: {
      name: 'Dragon Hurricane', hits: [allHit(330)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'windBound', 2, { chance: 80 }),
        { to: ENEMIES, dot: { name: 'Incinerate', pct: 90, duration: 2 } },
        buff(AS_SU, 2, [m('atk', 25, 'icon'), m('punch', 30)]),
        buff(VG, 2, [m('def', 500, 'icon')]),
        debuff(ENEMIES, 2, [m('recoveryCut', 90)]),
      ],
    },
  },
  {
    id: 'naori-uchiha', name: 'Naori Uchiha', role: S, gender: 'female', base: { speed: 80, dr: 60, air: 55 },
    talents: [
      allies(m('speed', 97), m('air', 30)),
      enemies(m('dr', -30)),
      attacked(70, cleanseSelf),
      resist(0, 999),
      immune('furyReduction'),
    ],
    special: {
      name: 'Izanami', hits: [allHit(300)], fury: { self: 100, allies: 30 },
      effects: [
        { chance: 80, ...either([st(ENEMIES, 'stun', 2)], [st(ENEMIES, 'skillForbid', 2)]) },
        buff(ALLIES, 2, [m('ccRate', 50), m('def', 25, 'icon')]),
        debuff(ENEMIES, 2, [m('atk', -20, 'icon')]),
        { to: ENEMIES, fury: -20 },
      ],
    },
  },
  {
    id: 'otsutsuki-ashura', name: 'Otsutsuki Ashura', role: S, gender: 'male', base: { speed: 79, dr: 55, air: 55 },
    talents: [
      allies(m('speed', 96), m('ccRes', 20)),
      rl('enemy', ['assaulter', 'supporter'], m('def', -20)),
      attacked(100, heal(40)),
      resist(0, 150),
      immune('imprison', 'blind', 'deathSeed'),
    ],
    special: {
      name: 'Six Paths: Planetary Rasengan', hits: [allHit(300)], fury: FURY_68,
      effects: [
        { chance: 80, ...either([st(ENEMIES, 'imprison', 2)], [st(ENEMIES, 'blind', 2)]) },
        st(SELF, 'windEscape', 2, { value: 30 }),
        debuff(ENEMIES, 2, [m('antiCrit', -50)]),
        buff(ALLIES, 2, [m('dr', 40)]),
      ],
    },
  },
  {
    id: 'haku-xmas', name: 'X-mas Haku', role: S, gender: 'male', base: { speed: 78, dr: 55, air: 50 },
    talents: [
      allies(m('speed', 93)),
      rl('ally', 'supporter', m('hp', 20)),
      enemies(m('air', -25)),
      attacked(100, { to: ATTACKER, dot: { name: 'Poison', pct: 120, duration: 1 } }),
      immune('superDodge', 'sSuperDodge', 'chaos', 'freeze'),
    ],
    special: {
      name: 'Crystal Ice Dragon', hits: [allHit(330)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 80 }), dispelEnemies,
        debuff(ENEMIES, 2, [m('dr', -25)]),
        debuff(role('enemy', 'assaulter'), 2, [m('def', -30, 'icon')]),
        buff(ALLIES, 2, [m('reflectRes', 80), m('atk', 25, 'icon')]),
      ],
    },
  },
  {
    id: 'momoshiki-awaken', name: 'Momoshiki (Awaken)', role: S, gender: 'male', base: { speed: 77, dr: 50, air: 50 },
    talents: [
      allies(m('speed', 92), m('atk', 20)),
      enemies(m('dr', -20)),
      attacked(80, st(ATTACKER, 'freeze', 1)),
      immune('superDodge', 'freeze', 'chaos'),
    ],
    special: {
      name: 'Monkey Rock', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 80 }), st(ENEMIES, 'chaos', 2, { chance: 80 }),
        debuff(ENEMIES, 2, [m('punch', -60), m('atk', -20, 'icon')]),
        heal(120),
      ],
    },
  },
  {
    id: 'chiruku', name: 'Chiruku', role: S, gender: 'male', base: { speed: 76, dr: 50, air: 50 },
    talents: [
      enemies(m('speed', -47), m('def', -20)),
      allies(m('atk', 23)),
      attacked(60, cleanseSelf),
      resist(0, 110),
      immune('blind', 'chaos'),
    ],
    special: {
      name: 'Raigo: Thousand Hand Strike', hits: [allHit(330)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'chaos', 2),
        buff(SELF, 1, [m('def', 500, 'icon')]),
        debuff(E_AS_SU, 2, [m('dr', -20)]),
        buff(AS_SU, 2, [m('ccRate', 40)]),
        buff(ALLIES, 2, [m('hit', 90)]),
      ],
    },
  },
  {
    id: 'tsunade-swimsuit', name: 'Swimsuit Tsunade', role: S, gender: 'female', base: { speed: 75, dr: 50, air: 50 },
    talents: [
      allies(m('speed', 85), m('dr', 30)),
      enemies(m('air', -20)),
      attacked(50, cleanseSelf),
      onDeath(100, cleanseAllies),
      immune('blind', 'stun', 'deathSeed'),
    ],
    special: {
      name: 'Tongue Tooth Sticky Acid', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'blind', 2, { chance: 70 }), st(ENEMIES, 'stun', 2, { chance: 70 }),
        buff(role('ally', 'assaulter'), 2, [m('def', 30, 'icon')]),
        buff(ALLIES, 2, [m('air', 30)]),
        debuff(ENEMIES, 2, [m('recoveryCut', 100)]),
      ],
    },
  },
  {
    id: 'otsutsuki-kinshiki', name: 'Otsutsuki Kinshiki', role: S, gender: 'male', base: { speed: 75, dr: 50, air: 45 },
    talents: [
      allies(m('speed', 82), m('def', 20)),
      { to: AS_SU, mods: [m('atk', 20)] },
      enemies(m('air', -30)),
      attacked(100, buff(SELF, 1, [m('speed', 30, 'icon')])),
      immune('freeze', 'deathSeed'),
    ],
    special: {
      name: 'Notaqi Wind', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 80 }),
        st(SELF, 'ccFree', 1, { chance: 70 }),
        buff(ALLIES, 2, [m('dr', 20), m('air', 30)]),
        debuff(ENEMIES, 2, [m('aid', -50)]),
      ],
    },
  },
  {
    id: 'hyuga-hanabi', name: 'Hyuga Hanabi', role: S, gender: 'female', base: { speed: 72, dr: 50, air: 45 },
    talents: [
      allies(m('speed', 80), m('air', 20)),
      enemies(m('atk', -20)),
      self(m('def', 30)),
      resist(0, 120),
      immune('chaos', 'blind'),
    ],
    special: {
      name: 'Flower Fire Flow', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'chaos', 2),
        { to: ENEMIES, dot: { name: 'Burn', pct: 100, duration: 2 } },
        debuff(role('enemy', 'supporter'), 2, [m('ccRate', -30)]),
        buff(AS_SU, 2, [m('dr', 30)]),
        debuff(E_AS_SU, 2, [m('atk', -20, 'icon')]),
      ],
    },
  },
  {
    id: 'hagoromo-hamura', name: 'Hagoromo & Hamura', role: S, gender: 'male', base: { dr: 50, air: 50 },
    talents: [
      allies(m('speed', 75), m('dr', 30)),
      enemies(m('def', -20)),
      attacked(20, cleanseSelf),
      immune('imprison', 'petrify'),
    ],
    special: {
      name: 'Ying-Yang Shield Planetar', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'blind', 2, { chance: 70 }), st(ENEMIES, 'petrify', 2, { chance: 70 }),
        buff(SELF, 1, [m('def', 500, 'icon')]),
        buff(role('ally', 'assaulter'), 2, [m('atk', 20, 'icon')]),
        debuff(ENEMIES, 2, [m('air', -40)]),
      ],
    },
  },
  {
    id: 'kakashi-obito', name: 'Kakashi & Obito', role: S, gender: 'male', base: { dr: 50, air: 50 },
    talents: [
      allies(m('speed', 70)),
      rl('ally', 'supporter', m('atk', 20)),
      enemies(m('air', -30)),
      attacked(100, { to: ATTACKER, reflect: 120 }),
      immune('freeze', 'deathSeed'),
    ],
    special: {
      name: 'Double Kamui Lightning Cutter', hits: [allHit(330)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'freeze', 2, { chance: 60 }), st(ENEMIES, 'chaos', 2, { chance: 60 }),
        st(rand('enemy', 3), 'painfulWill', 2),
        buff(ALLIES, 2, [m('dr', 30)]),
        debuff(ENEMIES, 2, [m('punch', -50)]),
      ],
    },
  },
  {
    id: 'neji-hinata', name: 'Neji & Hinata', role: S, gender: 'male', base: { speed: 65, dr: 50, air: 45 },
    talents: [
      allies(m('speed', 68), m('dr', 30)),
      enemies(m('air', -25)),
      { to: SELF, scale: 10, mods: [m('air', 8), m('dr', 8)] },
      immune('silence', 'stun', 'deathSeed'),
    ],
    special: {
      name: 'Gentle Fist Art: 8 Trigrams 64 Palms', hits: [allHit(330)], fury: FURY_68,
      effects: [
        { chance: 60, ...either([st(ENEMIES, 'stun', 2)], [st(ENEMIES, 'silence', 2)]) },
        { to: ALLIES, hot: 50, duration: 2 },
        buff(rand('ally', 1), 1, [m('speed', 50, 'icon')]),
        buff(role('ally', 'supporter'), 2, [m('atk', 25, 'icon')]),
        debuff(role('enemy', 'supporter'), 2, [m('dr', -30)]),
        st(VG_AS, 'deathSeedImmune', 2),
      ],
    },
  },
  {
    id: 'sakura-uchiha', name: 'Uchiha Sakura', role: S, gender: 'female', base: { speed: 65, dr: 45, air: 45 },
    talents: [
      allies(m('speed', 55), m('atk', 20), m('hp', 30)),
      attacked(80, st(ATTACKER, 'blind', 1)),
      immune('imprison', 'deathSeed'),
    ],
    special: {
      name: 'Blossom Sakura Dash', hits: [allHit(300)], fury: { self: 100, allies: 30 },
      effects: [
        { chance: 60, ...either([st(ENEMIES, 'fear', 2)], [st(ENEMIES, 'petrify', 2)]) },
        buff(ALLIES, 2, [m('air', 25)]),
        debuff(ENEMIES, 2, [m('def', -30, 'icon'), m('aid', -30)]),
        cleanseAllies,
      ],
    },
  },
  {
    id: 'shisui-itachi', name: 'Shisui & Itachi', role: S, gender: 'male', base: { speed: 60, dr: 45, air: 40 },
    talents: [
      allies(m('speed', 50)),
      rl('ally', 'supporter', m('hp', 50)),
      enemies(m('dr', -20)),
      attacked(100, buff(SELF, Infinity, [m('speed', 10, 'icon')], 'Vitesse +10 % (Shisui & Itachi)')),
      immune('blind', 'imprison'),
    ],
    special: {
      name: 'Turbulent Snow Moon and Flowers', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'imprison', 2, { chance: 70 }),
        buff(ALLIES, 2, [m('dr', 15)]),
        buff(role('ally', 'assaulter'), 2, [m('aid', 20)]),
        debuff(role('enemy', 'vanguard'), 2, [m('def', -30, 'icon')]),
        st(role('ally', 'supporter'), 'deathSeedImmune', 2),
      ],
    },
  },
  {
    id: 'tsunade-mei', name: 'Tsunade & Terumi Mei', role: S, gender: 'female', base: { speed: 55, dr: 45, air: 40 },
    talents: [
      allies(m('speed', 45)),
      rl('enemy', ['assaulter', 'supporter'], m('mdef', -25)),
      enemies(m('aid', -40)),
      onDeath(100, buff(ALLIES, 3, [m('speed', 45, 'icon'), m('atk', 25, 'icon')])),
      immune('stun', 'curseFixation'),
    ],
    special: {
      name: 'Strange Power Lava', hits: [allHit(300)], fury: FURY_50,
      effects: [
        { chance: 60, ...either([st(ENEMIES, 'blind', 2)], [st(ENEMIES, 'paralysis', 2)]) },
        st(ALLIES, 'furyShield', 2),
        st(ENEMIES, 'untreatment', 2),
      ],
    },
  },
  {
    id: 'naruto-sasuke', name: 'Naruto & Sasuke', role: S, gender: 'male', base: { speed: 55, dr: 40, air: 40 },
    talents: [
      allies(m('speed', 40), m('hp', 30)),
      rl('ally', 'supporter', m('atk', 15)), rl('ally', 'assaulter', m('air', 30)),
      { to: SELF, scale: 10, mods: [m('dr', 3)] },
      immune('curseFixation', 'acupoint'),
    ],
    special: {
      name: 'Power of Six Paths', hits: [allHit(300)], fury: FURY_68,
      effects: [
        st(ENEMIES, 'acupoint', 2, { chance: 60 }), st(ENEMIES, 'stun', 2, { chance: 60 }),
        buff(role('ally', 'assaulter'), 2, [m('speed', 25, 'icon'), m('dr', 10), m('ccRate', 30)]),
        debuff(ENEMIES, 2, [m('pdef', -20, 'icon')]),
        debuff(role('enemy', 'supporter'), 2, [m('mdef', -30, 'icon')]),
      ],
    },
  },
  {
    id: 'sasuke-sakura', name: 'Sasuke & Sakura', role: S, gender: 'male', base: { speed: 50, dr: 40, air: 35 },
    talents: [
      allies(m('speed', 35), m('dr', 15), m('air', 10)),
      attacked(80, st(ATTACKER, 'curseFixation', 2)),
      attacked(100, { to: SELF, fury: 100 }),
      immune('blind', 'chaos'),
    ],
    special: {
      name: 'Great Amaterasu', hits: [allHit(300)], fury: FURY_50,
      effects: [
        st(ENEMIES, 'curseFixation', 2, { chance: 60 }), st(ENEMIES, 'silence', 2, { chance: 60 }),
        debuff(ENEMIES, 2, [m('aid', -30)]),
        debuff(ENEMIES, 1, [m('def', -20, 'icon')]),
        buff(role('ally', 'assaulter'), 1, [m('def', 25, 'icon'), m('air', 25)]),
        heal(150),
      ],
    },
  },
  {
    id: 'deidara-sasori', name: 'Deidara & Sasori', role: S, gender: 'male', base: { speed: 50, dr: 35, air: 35 },
    talents: [
      allies(m('speed', 35)),
      rl('ally', ['assaulter', 'vanguard'], m('hp', 50)),
      rl('enemy', 'supporter', m('atk', -35)),
      onDeath(100, st(rand('enemy', 1), 'deathSeed', 2), st(rand('enemy', 1), 'deathSeed', 2, { chance: 50 })),
      attacked(80, st(ATTACKER, 'stun', 1)),
      immune('furyReduction', 'chaos'),
    ],
    special: {
      name: 'Ultimate Art', hits: [allHit(300)], fury: { self: 68, allies: 50 },
      effects: [
        { to: ENEMIES, fury: -50 },
        st(VG, 'superDodge', 1),
        debuff(ENEMIES, 1, [m('punch', -20), m('aid', -20)]),
        debuff(ENEMIES, 2, [m('recoveryCut', 70)]),
      ],
    },
  },
  {
    id: 'pain-konan', name: 'Pain & Konan', role: S, gender: 'male', base: { speed: 48, dr: 30, air: 30 },
    talents: [
      allies(m('speed', 35)),
      rl('ally', 'supporter', m('dr', 15)),
      immune('paralysis', 'stun'),
    ],
    special: {
      name: 'Fiery Paper Star of God', hits: [allHit(300)], fury: { self: 60, allies: 30 },
      effects: [
        st(ENEMIES, 'blind', 2, { chance: 60 }),
        { to: ENEMIES, dot: { name: 'Burn', pct: 130, duration: 1 } },
        st(role('ally', 'assaulter'), 'stunImmune', 2),
        buff(role('ally', 'assaulter'), 1, [m('speed', 15, 'icon'), m('mdef', 20, 'icon')]),
      ],
    },
  },
];
