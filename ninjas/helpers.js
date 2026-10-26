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
// Effet qui ne peut pas être dissipé (« cannot be dispelled »).
export const fixed = (e) => ({ ...e, cleansable: false });
export const FURY_68 = { self: 68, allies: 30 };
export const FURY_50 = { self: 50, allies: 30 };

const STAT_FR = {
  atk: 'attaque', patk: 'attaque physique', matk: 'attaque stratégique', def: 'défenses', hp: 'PV', dr: 'Dégâts', air: 'Absorption',
  finalDmg: 'dégâts finaux', finalReduction: 'réduction dégâts finaux', speed: 'vitesse', hit: 'précision', dodge: 'esquive',
  crit: 'critique', block: 'blocage', aid: 'aide', punch: 'Tour Bonus', ccRate: 'taux de contrôle', ccRes: 'résist. contrôle',
  recoveryCut: 'taux de soin', sAtk: 'attaque S',
};
export function describeMods(mods) {
  return mods.map((x) => `${STAT_FR[x.stat] || x.stat} ${x.value > 0 ? '+' : ''}${x.value} %`).join(', ');
}

// Talents d'équipe importés du classeur (bonus alliés / malus ennemis, bonus par nature, immunités).
import { SHEET } from './sheet-auras.js';
export function fromSheet(id) {
  const s = SHEET[id];
  if (!s) throw new Error(`Ninja absent du classeur : ${id}`);
  const out = [];
  const mk = (obj) => Object.entries(obj).map(([k, v]) => m(k, v));
  if (s.auras.ally) out.push({ to: ALLIES, mods: mk(s.auras.ally) });
  if (s.auras.enemy) out.push({ to: ENEMIES, mods: mk(s.auras.enemy) });
  if (s.auras.allySupport) out.push({ to: role('ally', 'supporter'), mods: mk(s.auras.allySupport) });
  out.push(...natureTalents(s.natures));
  if (s.immune.length) out.push({ to: SELF, immune: s.immune });
  return out;
}
// Bonus selon la nature : pour les alliés de cette nature (« enemy: » = ennemis de cette nature, « support: » = supports de cette nature).
export function natureTalents(natures) {
  const out = [];
  for (const [nat, obj] of Object.entries(natures)) {
    const groups = { ally: [], enemy: [], support: [] };
    for (const [k, v] of Object.entries(obj)) {
      const [g, stat] = k.includes(':') ? k.split(':') : ['ally', k];
      groups[g].push(m(stat, v));
    }
    if (groups.ally.length) out.push({ to: nature('ally', nat), mods: groups.ally });
    if (groups.enemy.length) out.push({ to: nature('enemy', nat), mods: groups.enemy });
    if (groups.support.length) out.push({ to: { side: 'ally', pick: 'all', role: 'supporter', nature: nat }, mods: groups.support });
  }
  return out;
}
export const SHEET_DATA = SHEET;
export const named = (side, ...names) => ({ side, pick: 'all', name: names });
export const gendered = (side, gender) => ({ side, pick: 'all', gender });
