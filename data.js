// Base de données : ninjas, compétences et équipements.
// Avant-gardes : wiki du jeu. Attaquants et supports : classeur « Formation ninja » (dossier ninjas/).
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

import { VANGUARDS } from './ninjas/vanguards.js';
import { ASSAULTERS } from './ninjas/assaulters.js';
import { SUPPORTERS } from './ninjas/supporters.js';

// Genre des avant-gardes (utilisé par les effets qui visent les ninjas masculins / féminins).
const FEMALE_VANGUARDS = ['hinata-soccer', 'karin-guyver', 'warrior-sakura', 'boa-hancock', 'kushina', 'hinata-warm', 'guren'];
for (const v of VANGUARDS) v.gender = FEMALE_VANGUARDS.includes(v.id) ? 'female' : 'male';

export const NINJAS = [
  ...VANGUARDS,
  ...ASSAULTERS,
  ...SUPPORTERS,
  {
    id: 'main', name: 'Personnage principal', role: 'assaulter', isMain: true,
    talents: [],
    normal: { skillPct: 100 },
    special: { name: 'Spéciale du personnage', skillPct: 220, target: 'front-row', effects: [] },
  },
];

export const EQUIPMENT = [
  { id: 'ex-ring-speed', name: 'Bague de vitesse (exemple)', passives: [{ to: 'allies', mods: [{ stat: 'speed', value: 116 }] }] },
  { id: 'ex-pain-gear', name: 'Équipement Pain (exemple)', passives: [{ to: 'self', mods: [{ stat: 'immuneIgnoreDef', value: 20 }] }] },
  { id: 'ex-guren-acc', name: 'Accessoire Guren (exemple)', procs: [{ on: 'any', to: { side: 'ally', pick: 'all', nature: 'water' }, status: 'bond', duration: 1, chance: 50 }] },
  // Les équipements réels seront ajoutés ici.
];

// Statistiques d'exemple (reprises de la capture d'écran du jeu).
export const SAMPLE_STATS = {
  hp: 65870148, patk: 45887220, matk: 45887220, pdef: 10612755, mdef: 6982662,
  dr: 508.4, air: 320.7, hit: 323.2, dodge: 56.1, crit: 110, antiCrit: 90,
  sAtk: 125, block: 90, extraTurn: 52, aid: 52, speed: 14144340, fury: 106,
};
