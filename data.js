// Base de données : ninjas, compétences et équipements.
// Les ninjas ci-dessous sont des EXEMPLES fictifs pour tester le moteur ; ils seront remplacés
// par les vrais ninjas du jeu au fur et à mesure.
//
// Format d'un ninja :
//   role        : 'vanguard' | 'assaulter' | 'supporter'
//   attackType  : 'physical' | 'magic' (par défaut : magic pour les supports, physical sinon)
//   talents     : effets permanents  { to, mods: [{ stat, value, kind }], status? }
//   normal      : attaque normale    { skillPct } (cible : la première ligne ennemie en entier)
//   special     : compétence spéciale { name, skillPct, target, effects: [...] , noDamage? }
// Cibles (target / to) : 'self', 'allies', 'enemies', 'front-row', 'target' (les ninjas touchés)
//   ou { side: 'enemy'|'ally', pick: 'all'|'front-row'|'back-row'|'lowest-hp'|'lowest-hp-pct'|
//        'highest-hp'|'highest-atk'|'highest-speed'|'random', role?, tag?, count?, excludeSelf? }
// Effets : { chance, to, status, value?, duration } | { heal: % } | { penetration: % }
//   | { dot: { name, pct, duration } } | { fury: ±n } | { cleanse: 'debuff'|'buff'|'all' }
//   | { mods: [...], type: 'buff'|'debuff', name, duration }

export const NINJAS = [
  {
    id: 'main', name: 'Personnage principal', role: 'assaulter', isMain: true,
    talents: [],
    normal: { skillPct: 100 },
    special: { name: 'Spéciale du personnage', skillPct: 220, target: 'front-row', effects: [] },
  },
  {
    id: 'ex-vanguard', name: 'Exemple Avant-garde', role: 'vanguard', tags: ['terre'],
    talents: [
      { to: 'self', mods: [{ stat: 'def', value: 30 }] },
      { to: 'allies', mods: [{ stat: 'air', value: 20 }] },
    ],
    normal: { skillPct: 100 },
    special: {
      name: 'Mur de pierre', skillPct: 150, target: 'front-row',
      effects: [
        { to: 'allies', status: 'superDefense', duration: 2 },
        { to: 'self', status: 'bond', duration: 2, chance: 50 },
      ],
    },
  },
  {
    id: 'ex-assaulter', name: 'Exemple Attaquant', role: 'assaulter', tags: ['feu'],
    talents: [
      { to: 'self', mods: [{ stat: 'atk', value: 30 }, { stat: 'ignoreDef', value: 20 }] },
    ],
    normal: { skillPct: 100 },
    special: {
      name: 'Grande boule de feu', skillPct: 260, target: { side: 'enemy', pick: 'all' },
      effects: [
        { to: 'target', dot: { name: 'Ignite', pct: 60, duration: 2 }, chance: 60 },
        { to: 'self', status: 'pyroblast', duration: 2 },
      ],
    },
  },
  {
    id: 'ex-assassin', name: 'Exemple Assassin', role: 'assaulter', tags: ['vent'],
    talents: [
      { to: 'self', mods: [{ stat: 'crit', value: 30 }, { stat: 'critDmg', value: 20 }] },
      { to: 'allies', mods: [{ stat: 'speed', value: 40 }] },
    ],
    normal: { skillPct: 100 },
    special: {
      name: 'Lame du vent', skillPct: 380, target: { side: 'enemy', pick: 'lowest-hp-pct' },
      effects: [
        { to: 'target', status: 'armorBreak', duration: 2, chance: 70 },
        { to: 'target', penetration: 80 },
      ],
    },
  },
  {
    id: 'ex-healer', name: 'Exemple Soigneur', role: 'supporter', tags: ['eau'],
    talents: [
      { to: 'allies', mods: [{ stat: 'recovery', value: 20 }] },
    ],
    normal: { skillPct: 100 },
    special: {
      name: 'Pluie de soin', noDamage: true, target: { side: 'ally', pick: 'all' },
      effects: [
        { to: 'allies', heal: 120 },
        { to: 'allies', cleanse: 'debuff' },
      ],
    },
  },
  {
    id: 'ex-controller', name: 'Exemple Contrôleur', role: 'supporter', tags: ['foudre'],
    talents: [
      { to: 'enemies', mods: [{ stat: 'speed', value: -20 }] },
    ],
    normal: { skillPct: 100 },
    special: {
      name: 'Prison de foudre', skillPct: 180, target: { side: 'enemy', pick: 'highest-atk' },
      effects: [
        { to: 'target', status: 'imprison', duration: 1, chance: 60 },
        { to: 'target', status: 'corrosion', duration: 2 },
      ],
    },
  },
];

export const EQUIPMENT = [
  { id: 'ex-ring-speed', name: 'Bague de vitesse (exemple)', passives: [{ to: 'allies', mods: [{ stat: 'speed', value: 116 }] }] },
  { id: 'ex-pain-gear', name: 'Équipement Pain (exemple)', passives: [{ to: 'self', mods: [{ stat: 'immuneIgnoreDef', value: 20 }] }] },
  { id: 'ex-guren-acc', name: 'Accessoire Guren (exemple)', procs: [{ on: 'any', to: { side: 'ally', pick: 'all', tag: 'eau' }, status: 'bond', duration: 1, chance: 50 }] },
];

// Statistiques d'exemple (reprises de la capture d'écran du jeu).
export const SAMPLE_STATS = {
  hp: 65870148, patk: 45887220, matk: 45887220, pdef: 10612755, mdef: 6982662,
  dr: 508.4, air: 320.7, hit: 323.2, dodge: 56.1, crit: 110, antiCrit: 90,
  sAtk: 125, block: 90, extraTurn: 52, aid: 52, speed: 14144340, fury: 106,
};
