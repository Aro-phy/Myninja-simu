// Raccourcis pour écrire les fiches des ninjas.
export const ALLIES = { side: 'ally', pick: 'all' };
export const ALLIES_BUT_SELF = { side: 'ally', pick: 'all', excludeSelf: true };
export const ENEMIES = { side: 'enemy', pick: 'all' };
export const SELF = 'self';
export const TARGET = 'target';
export const ATTACKER = 'attacker';
export const rand = (side, count) => ({ side, pick: 'random', count });
export const role = (side, r) => ({ side, pick: 'all', role: r });
export const nature = (side, n) => ({ side, pick: 'all', nature: n });
export const lowestHp = (side) => ({ side, pick: 'lowest-hp' });
export const highestHp = (side) => ({ side, pick: 'highest-hp' });
export const m = (stat, value, kind) => (kind ? { stat, value, kind } : { stat, value });
// Buff / debuff libre avec durée : buff(cible, durée, [m(...)], nom?)
export const buff = (to, duration, mods, name) => ({ to, type: 'buff', duration, mods, name: name || describeMods(mods) });
export const debuff = (to, duration, mods, name) => ({ to, type: 'debuff', duration, mods, name: name || describeMods(mods) });
export const st = (to, status, duration, extra = {}) => ({ to, status, duration, ...extra });
export const FURY_68 = { self: 68, allies: 30 };
export const FURY_50 = { self: 50, allies: 30 };

const STAT_FR = {
  atk: 'attaque', patk: 'attaque physique', matk: 'attaque stratégique', def: 'défenses', hp: 'PV', dr: 'Dégâts', air: 'Absorption',
  finalDmg: 'dégâts finaux', finalReduction: 'réduction dégâts finaux', speed: 'vitesse', hit: 'précision', dodge: 'esquive',
  crit: 'critique', block: 'blocage', aid: 'aide', punch: 'punch', ccRate: 'taux de contrôle', ccRes: 'résist. contrôle',
  recoveryCut: 'taux de soin', sAtk: 'attaque S',
};
export function describeMods(mods) {
  return mods.map((x) => `${STAT_FR[x.stat] || x.stat} ${x.value > 0 ? '+' : ''}${x.value} %`).join(', ');
}
