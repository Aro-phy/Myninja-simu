// Catalogue des états (buffs, debuffs, CC) tirés du wiki du jeu.
// mods : modificateurs { stat, value, kind } ; kind 'icon' = additif, 'talent' = multiplicatif (ATK/DEF).
// Les valeurs par défaut peuvent être remplacées par la compétence qui pose l'état ("value").
//
// Stats utilisables dans les mods :
//   atk, def, dr, air, finalDmg, finalReduction, decreaseReduction, critDmg, critDmgTaken,
//   hit, dodge, crit, antiCrit, block, sAtk, extraTurn, aid, speed, ccRes,
//   ignoreDef, immuneIgnoreDef, ignoreEnemyAtk, recovery, recoveryCut, healCut,
//   penBonus, penMalus, penMultiplier, bloodline

export const STATUSES = {
  // --- Buffs dissipables ---
  superDodge: { name: 'Super Dodge', type: 'buff', cleansable: true, flags: { superDodge: true } },
  furyShield: { name: 'Fury Shield', type: 'buff', cleansable: true, value: 30, mods: (v) => [{ stat: 'finalDmg', value: v }] },
  ccFree: { name: 'CC-free', type: 'buff', cleansable: true, flags: { ccImmune: true } },
  deathSeedImmune: { name: 'Immunité Death Seed', type: 'buff', cleansable: true, flags: { deathSeedImmune: true } },

  // --- Buffs non dissipables ---
  sSuperDodge: { name: 'S-Super Dodge', type: 'buff', cleansable: false, flags: { superDodge: true } },
  shielding: { name: 'Shielding / Amenotejikara', type: 'buff', cleansable: false, flags: { ignoreDirect: true } },
  shatterStorm: { name: 'Shatter Storm', type: 'buff', cleansable: false, value: 15,
    mods: (v) => [{ stat: 'atk', value: v, kind: 'icon' }, { stat: 'def', value: v, kind: 'icon' }] },
  windEscape: { name: 'Wind Escape', type: 'buff', cleansable: false, value: 10, mods: (v) => [{ stat: 'ignoreEnemyAtk', value: v }] },
  bond: { name: 'Bond State', type: 'buff', cleansable: false, value: 35,
    mods: (v) => [{ stat: 'air', value: v }, { stat: 'block', value: v }, { stat: 'ccRes', value: v }] },
  pyroblast: { name: 'Pyroblast', type: 'buff', cleansable: false, value: 30,
    mods: (v) => [{ stat: 'dr', value: v }, { stat: 'finalDmg', value: v }] },
  superarmor: { name: 'Superarmor', type: 'buff', cleansable: false, flags: { debuffImmune: true } },
  acceleration: { name: 'Acceleration', type: 'buff', cleansable: false, value: 15, mods: (v) => [{ stat: 'speed', value: v, kind: 'icon' }] },
  strong: { name: 'Strong State', type: 'buff', cleansable: false, value: 20, // valeur non précisée par le wiki
    mods: (v) => [{ stat: 'air', value: v }, { stat: 'finalReduction', value: v }] },
  superDefense: { name: 'Super Defense', type: 'buff', cleansable: false, value: 20, mods: (v) => [{ stat: 'def', value: v, kind: 'icon' }] },

  // --- Debuffs dissipables ---
  painfulWill: { name: 'Painful Will', type: 'debuff', cleansable: true, flags: { noBuffs: true } },

  // --- Debuffs non dissipables ---
  upwind: { name: 'Upwind', type: 'debuff', cleansable: false, value: 30,
    mods: (v) => [{ stat: 'recoveryCut', value: v }, { stat: 'ccRes', value: -v }] },
  weakened: { name: 'Weakened', type: 'debuff', cleansable: false, value: 20, flags: { noBuffs: true },
    mods: (v) => [{ stat: 'speed', value: -v, kind: 'icon' }, { stat: 'def', value: -v, kind: 'icon' }] },
  corrosion: { name: 'Corrosion', type: 'debuff', cleansable: false, value: 30,
    mods: (v) => [{ stat: 'air', value: -v }, { stat: 'decreaseReduction', value: v }] },
  deathSeed: { name: 'Death Seed', type: 'debuff', cleansable: false, flags: { deathSeed: true } },
  chaoticStorm: { name: 'Chaotic Storm', type: 'debuff', cleansable: false, value: 20,
    mods: (v) => [{ stat: 'atk', value: -v, kind: 'icon' }, { stat: 'def', value: -v, kind: 'icon' }] },
  dispirited: { name: 'Dispirited', type: 'debuff', cleansable: false, value: 25,
    mods: (v) => [{ stat: 'dr', value: -v }, { stat: 'finalDmg', value: -v }] },
  untreatment: { name: 'Untreatment', type: 'debuff', cleansable: false, flags: { noHeal: true } },
  armorBreak: { name: 'Armor Break', type: 'debuff', cleansable: false, value: 30, mods: (v) => [{ stat: 'def', value: -v, kind: 'icon' }] },
  critResReduction: { name: 'Réduction résist. crit', type: 'debuff', cleansable: false, value: 20, mods: (v) => [{ stat: 'antiCrit', value: -v }] },

  // --- CC non dissipables ---
  poisonousWind: { name: 'Poisonous Wind', type: 'cc', cleansable: false, value: 30, flags: { cc: 'hard', poisonWind: true } },
  curseFixation: { name: 'Curse Fixation', type: 'cc', cleansable: false, value: 20, flags: { cc: 'hard' },
    mods: (v) => [{ stat: 'block', value: -v }] },
  blind: { name: 'Blind', type: 'cc', cleansable: false, flags: { cc: 'hard' } },
  imprison: { name: 'Imprison', type: 'cc', cleansable: false, flags: { cc: 'hard' } },
  freeze: { name: 'Freeze', type: 'cc', cleansable: false, flags: { cc: 'hard' } },
  windBound: { name: 'Wind Bound', type: 'cc', cleansable: false, flags: { cc: 'hard' } },
  charm: { name: 'Charm', type: 'cc', cleansable: false, flags: { cc: 'hard' } },
  seal: { name: 'Seal', type: 'cc', cleansable: false, flags: { cc: 'seal' } }, // bloque seulement la spéciale

  // --- Buff / debuff générique : modificateurs libres ---
  customBuff: { name: 'Buff', type: 'buff', cleansable: true },
  customDebuff: { name: 'Debuff', type: 'debuff', cleansable: true },
};

// DoTs : tous dissipables sauf Incinerate / Burn.
export const DOTS = ['Poison', 'Ignite', 'Power loss', 'Orochi poison', 'Vein damage', 'Bleed', 'Split',
  'Unification', 'Safeguard', 'Burst', 'Scorching flame', 'Sticky acid', 'Incinerate'];
export const UNCLEANSABLE_DOTS = ['Incinerate', 'Burn'];
