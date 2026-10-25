// Catalogue des états (buffs, debuffs, CC) tirés du wiki du jeu.
// mods : modificateurs { stat, value, kind } ; kind 'icon' = additif, 'talent' = multiplicatif (ATK/DEF).
// Les valeurs par défaut peuvent être remplacées par la compétence qui pose l'état ("value").
//
// Stats utilisables dans les mods :
//   atk, patk, matk, def, pdef, mdef, hp (PV max), dr, air, finalDmg, finalReduction, decreaseReduction,
//   dmgTaken (dégâts totaux reçus), critDmg, critDmgTaken, hit, dodge, crit, antiCrit, block, sAtk,
//   sBlock, sCrit, punch, aid, extraTurn, speed, ccRate, ccRes, reflectRes,
//   ignoreDef, immuneIgnoreDef, ignoreEnemyAtk, recovery, recoveryCut, healCut,
//   penBonus, penMalus, penMultiplier, bloodline

const hard = (name) => ({ name, type: 'cc', cleansable: false, flags: { cc: 'hard' } });

export const STATUSES = {
  // --- Buffs dissipables ---
  superDodge: { name: 'Super Dodge', type: 'buff', cleansable: true, flags: { superDodge: 'superDodge' } },
  furyShield: { name: 'Fury Shield', type: 'buff', cleansable: true, value: 30, mods: (v) => [{ stat: 'finalDmg', value: v }] },
  ccFree: { name: 'Immunité CC', type: 'buff', cleansable: true, flags: { ccImmune: true } },
  deathSeedImmune: { name: 'Immunité Death Seed', type: 'buff', cleansable: true, flags: { deathSeedImmune: true } },

  // --- Buffs non dissipables ---
  sSuperDodge: { name: 'S-Super Dodge', type: 'buff', cleansable: false, flags: { superDodge: 'sSuperDodge' } },
  shielding: { name: 'Shielding', type: 'buff', cleansable: false, flags: { ignoreDirect: true } },
  shatterStorm: { name: 'Shatter Storm', type: 'buff', cleansable: false, value: 15,
    mods: (v) => [{ stat: 'atk', value: v, kind: 'icon' }, { stat: 'def', value: v, kind: 'icon' }] },
  windEscape: { name: 'Wind Escape', type: 'buff', cleansable: false, value: 10, mods: (v) => [{ stat: 'ignoreEnemyAtk', value: v }] },
  bond: { name: 'Bond State', type: 'buff', cleansable: false, value: 35,
    mods: (v) => [{ stat: 'air', value: v }, { stat: 'block', value: v }, { stat: 'ccRes', value: v }] },
  pyroblast: { name: 'Pyroblast', type: 'buff', cleansable: false, value: 30,
    mods: (v) => [{ stat: 'dr', value: v }, { stat: 'finalDmg', value: v }] },
  superarmor: { name: 'Superarmor', type: 'buff', cleansable: false, flags: { debuffImmune: true } },
  acceleration: { name: 'Acceleration', type: 'buff', cleansable: false, value: 15, mods: (v) => [{ stat: 'speed', value: v, kind: 'icon' }] },
  strong: { name: 'Strong State', type: 'buff', cleansable: false, value: 20,
    mods: (v) => [{ stat: 'air', value: v }, { stat: 'finalReduction', value: v }] },
  superDefense: { name: 'Super Defense', type: 'buff', cleansable: false, value: 20, mods: (v) => [{ stat: 'def', value: v, kind: 'icon' }] },

  // --- Debuffs dissipables ---
  painfulWill: { name: 'Painful Will', type: 'debuff', cleansable: true, flags: { noBuffs: true } },
  healReduction: { name: 'Réduction de soin', type: 'debuff', cleansable: true, value: 50, mods: (v) => [{ stat: 'healCut', value: v }] },

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
  untreatment: { name: 'Interdiction de soin', type: 'debuff', cleansable: false, flags: { noHeal: true } },
  armorBreak: { name: 'Armor Break', type: 'debuff', cleansable: false, value: 30, mods: (v) => [{ stat: 'def', value: -v, kind: 'icon' }] },
  critResReduction: { name: 'Réduction résist. crit', type: 'debuff', cleansable: false, value: 20, mods: (v) => [{ stat: 'antiCrit', value: -v }] },

  // --- CC (non dissipables) ---
  poisonousWind: { name: 'Poisonous Wind', type: 'cc', cleansable: false, value: 30, flags: { cc: 'hard', poisonWind: true } },
  curseFixation: { name: 'Curse Fixation', type: 'cc', cleansable: false, value: 20, flags: { cc: 'hard' },
    mods: (v) => [{ stat: 'block', value: -v }] },
  blind: hard('Blind'),
  imprison: hard('Imprison'),
  freeze: hard('Freeze'),
  windBound: hard('Wind Bound'),
  charm: hard('Charm'),
  chaos: hard('Chaos'),
  stun: hard('Stun'),
  shock: hard('Shock'),
  acupoint: hard('Acupoint'),
  paralysis: hard('Paralysis'),
  petrify: hard('Petrify'),
  expel: hard('Expel'),
  disable: hard('Disable'),
  seal: { name: 'Seal', type: 'cc', cleansable: false, flags: { cc: 'seal' } },       // bloque seulement la spéciale
  silence: { name: 'Silence', type: 'cc', cleansable: false, flags: { cc: 'seal' } }, // supposé identique à Seal
  forbidFury: { name: 'Interdiction de fury', type: 'cc', cleansable: false, flags: { noFury: true } },

  // --- Buff / debuff générique : modificateurs libres ---
  customBuff: { name: 'Buff', type: 'buff', cleansable: true },
  customDebuff: { name: 'Debuff', type: 'debuff', cleansable: true },
};

export const UNCLEANSABLE_DOTS = ['Incinerate', 'Burn'];
