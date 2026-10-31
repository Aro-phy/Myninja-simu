// Outils communs à la recherche de formations « méta » : stats types, génome d'une formation, évaluation.
import { simulate } from '../../engine.js';
import { NINJAS } from '../../data.js';
import { GEAR_SETS, ACCESSORY_SETS, equipmentEntries, slotsToChoice } from '../../equipment.js';

export const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
export const POOL = {
  vanguard: NINJAS.filter((n) => n.role === 'vanguard').map((n) => n.id),
  assaulter: NINJAS.filter((n) => n.role === 'assaulter' && !n.isMain).map((n) => n.id),
  supporter: NINJAS.filter((n) => n.role === 'supporter').map((n) => n.id),
};
export const NATURE_LIST = ['water', 'fire', 'wind', 'thunder', 'earth'];

// Sets dont un bonus agit en combat (les bonus de stats de l'écran sont déjà dans les stats types).
const PANEL = new Set(['hp', 'atk', 'patk', 'matk', 'def', 'pdef', 'mdef', 'dr', 'air', 'hit', 'dodge', 'crit', 'antiCrit', 'sAtk', 'block', 'punch', 'extraTurn', 'aid', 'speed']);
const acts = (entries) => entries.some((x) => (x.talents || []).some((t) => t.on || (t.to && t.to !== 'self') || (t.mods || []).some((m) => !PANEL.has(m.stat))));
export const GEAR_IDS = GEAR_SETS.filter((g) => acts(equipmentEntries(slotsToChoice({ gear: Array(6).fill(g.id) })))).map((g) => g.id);
export const ACC_IDS = ACCESSORY_SETS.filter((a) => acts(equipmentEntries(slotsToChoice({ acc: Array(8).fill(a.id) })))).map((a) => a.id);

// Stats types par poste (moyennes arrondies des ninjas relevés dans la vidéo Lava X1 / Skalypan).
// Les mêmes pour tous : on compare les kits (talents, compétences), pas les comptes.
export const TEMPLATE = {
  vanguard: { hp: 70e6, atk: 40e6, pdef: 12e6, mdef: 8e6, speed: 15e6, fury: 100, dr: 450, air: 330, hit: 320, dodge: 60, crit: 90, antiCrit: 90, sAtk: 90, block: 90, extraTurn: 50, aid: 45 },
  assaulter: { hp: 85e6, atk: 24e6, pdef: 14e6, mdef: 10e6, speed: 16e6, fury: 100, dr: 380, air: 330, hit: 325, dodge: 40, crit: 80, antiCrit: 80, sAtk: 90, block: 70, extraTurn: 40, aid: 42 },
  supporter: { hp: 95e6, atk: 12e6, pdef: 7.5e6, mdef: 9e6, speed: 21e6, fury: 100, dr: 340, air: 360, hit: 300, dodge: 70, crit: 85, antiCrit: 70, sAtk: 90, block: 75, extraTurn: 80, aid: 52 },
  main: { hp: 70e6, atk: 10e6, pdef: 20e6, mdef: 22e6, speed: 11e6, fury: 50, dr: 330, air: 330, hit: 270, dodge: 90, crit: 80, antiCrit: 80, sAtk: 90, block: 45, extraTurn: 30, aid: 40 },
};

// Génome : { v: id|null, a: [ids] (0 à 2, le personnage principal est toujours là), s: [ids], nat: {id: nature}, mainType, eq?: {id: {gear, acc}} }
export function toTeam(g, name = 'F', statScale = null) {
  const members = [];
  const stats = (role, id) => {
    const base = { ...TEMPLATE[role] };
    // facteur (× f) ou décalage ({ add: n })
    if (statScale) for (const [k, f] of Object.entries(statScale)) {
      if (typeof f === 'object') base[k] = (base[k] || 0) + f.add;
      else if (base[k] != null) base[k] *= f;
    }
    return base;
  };
  // équipement : un set de 6 pièces ; accessoires : 4 paires (Force, Chakra, Agilité, Puissance), chacune d'un set
  const eq = (id) => {
    const e = g.eq?.[id];
    if (!e) return [];
    const acc = Array.isArray(e.acc) ? e.acc.flatMap((x) => [x, x]) : Array(8).fill(e.acc);
    return equipmentEntries(slotsToChoice({ gear: Array(6).fill(e.gear), acc }));
  };
  if (g.v) members.push({ ninja: byId[g.v], pos: 0, stats: stats('vanguard'), nature: g.nat[g.v], natureLevel: 3, equipment: eq(g.v) });
  members.push({ ninja: byId.main, pos: 0, stats: stats('main'), attackType: g.mainType, equipment: eq('main') });
  g.a.forEach((id, i) => members.push({ ninja: byId[id], pos: i + 1, stats: stats('assaulter'), nature: g.nat[id], natureLevel: 3, equipment: eq(id) }));
  g.s.forEach((id, i) => members.push({ ninja: byId[id], pos: i, stats: stats('supporter'), nature: g.nat[id], natureLevel: 3, equipment: eq(id) }));
  return { name, members };
}

// Taux de victoire de A contre B sur n combats (moitié côté A, moitié côté B, graines différentes).
export function winRate(A, B, n, seed) {
  let w = 0;
  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) { const r = simulate(A, B, { seed: seed + i, log: false }); if (r.winner === 0) w++; else if (r.winner == null) w += 0.5; }
    else { const r = simulate(B, A, { seed: seed + i, log: false }); if (r.winner === 1) w++; else if (r.winner == null) w += 0.5; }
  }
  return w / n;
}

export const key = (g) => [g.v || '-', [...g.a].sort().join(','), [...g.s].sort().join(','), g.mainType,
  [g.v, ...g.a, ...g.s].filter(Boolean).sort().map((id) => g.nat[id][0]).join(''),
  ['main', g.v, ...g.a, ...g.s].filter(Boolean).sort().map((id) => JSON.stringify(g.eq?.[id] || null)).join(';')].join('|');
// même ninjas (sans regarder natures ni équipement)
export const core = (g) => [g.v || '-', [...g.a].sort().join(','), [...g.s].sort().join(',')].join('|');
const setName = (id) => [...GEAR_SETS, ...ACCESSORY_SETS].find((x) => x.id === id)?.name.replace(/^Accessoires /, '') || '—';
export const describeEq = (g, id) => {
  const e = g.eq?.[id];
  if (!e) return 'sans équipement';
  const acc = Array.isArray(e.acc) ? e.acc : Array(4).fill(e.acc);
  const same = acc.every((x) => x === acc[0]);
  return `équipement ${setName(e.gear)} ×6, accessoires ${same ? `${setName(acc[0])} ×8` : `Force ${setName(acc[0])}, Chakra ${setName(acc[1])}, Agilité ${setName(acc[2])}, Puissance ${setName(acc[3])}`}`;
};
export const describe = (g) => [g.v ? `${byId[g.v].name} (${g.nat[g.v]})` : null, `Perso principal (${g.mainType === 'magic' ? 'magique' : 'physique'})`,
  ...g.a.map((id) => `${byId[id].name} (${g.nat[id]})`), ...g.s.map((id) => `${byId[id].name} (${g.nat[id]})`)].filter(Boolean).join(' + ');
