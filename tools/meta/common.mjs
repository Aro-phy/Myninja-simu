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

// Avec RULES.selfStatsInPanel = false, les bonus de stats des sets comptent aussi : tous les sets sont candidats.
export const GEAR_IDS = GEAR_SETS.map((g) => g.id);
export const ACC_IDS = ACCESSORY_SETS.map((a) => a.id);

// Stats de base communes à tous les ninjas. Chaque ninja y ajoute ce que son kit lui donne :
// sa ligne de base de talent (vitesse, Dégâts, Absorption, ex. Warrior Sakura Dégâts +115 %, Absorption +70 %),
// ses bonus personnels (PV, défenses…) et les bonus de stats de son équipement (règles RULES ci-dessous).
export const BASE = { hp: 50e6, atk: 25e6, pdef: 8e6, mdef: 8e6, speed: 8e6, fury: 100, dr: 200, air: 200, hit: 300, dodge: 50,
  crit: 80, antiCrit: 80, sAtk: 90, block: 70, extraTurn: 50, aid: 45 };
export const RULES = { applyBaseLine: true, selfStatsInPanel: false };

// Génome : { v: id|null, a: [ids] (0 à 2, le personnage principal est toujours là), s: [ids], nat: {id: nature}, mainType, eq?: {id: {gear, acc}} }
export function toTeam(g, name = 'F', statScale = null) {
  const members = [];
  const stats = () => {
    const base = { ...BASE };
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
    if (i % 2 === 0) { const r = simulate(A, B, { seed: seed + i, log: false, rules: RULES }); if (r.winner === 0) w++; else if (r.winner == null) w += 0.5; }
    else { const r = simulate(B, A, { seed: seed + i, log: false, rules: RULES }); if (r.winner === 1) w++; else if (r.winner == null) w += 0.5; }
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
