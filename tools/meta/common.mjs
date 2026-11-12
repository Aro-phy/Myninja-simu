// Outils communs à la recherche de formations « méta » : stats types, génome d'une formation, évaluation.
import { simulate, resolveKit } from '../../engine.js';
import { STATUSES } from '../../statuses.js';
import { NINJAS } from '../../data.js';
import { GEAR_SETS, ACCESSORY_SETS, equipmentEntries, slotsToChoice } from '../../equipment.js';
import { testStats, RELEASES } from './ninja-stats.mjs';

export const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
// TEAM_SPEED=id:valeur,… : test hypothétique, remplace le talent de vitesse d'équipe de ces ninjas (aussi dans les workers).
for (const [id, v] of (process.env.TEAM_SPEED || '').split(',').filter(Boolean).map((x) => x.split(':'))) {
  const t = byId[id]?.talents.flatMap((x) => x.mods || []).find((m) => m.stat === 'speed' && m.value >= 100);
  if (!t) throw new Error(`TEAM_SPEED : pas de talent de vitesse d'équipe pour ${id}`);
  t.value = Number(v);
}
// POOL=recent : seulement les ninjas encore méta (6 dernières avant-gardes, 14 derniers attaquants, 18 derniers supports).
const recent = (role, k) => RELEASES.filter((id) => byId[id]?.role === role).slice(-k);
export const POOL = process.env.POOL === 'recent'
  ? { vanguard: recent('vanguard', 6), assaulter: recent('assaulter', 14), supporter: recent('supporter', 18) }
  : {
    vanguard: NINJAS.filter((n) => n.role === 'vanguard').map((n) => n.id),
    assaulter: NINJAS.filter((n) => n.role === 'assaulter' && !n.isMain).map((n) => n.id),
    supporter: NINJAS.filter((n) => n.role === 'supporter').map((n) => n.id),
  };
export const NATURE_LIST = ['water', 'fire', 'wind', 'thunder', 'earth'];

// Avec RULES.selfStatsInPanel = false, les bonus de stats des sets comptent aussi : tous les sets sont candidats.
export const GEAR_IDS = GEAR_SETS.map((g) => g.id);
export const ACC_IDS = ACCESSORY_SETS.map((a) => a.id);

// Stats de test : PV, attaque, défenses et vitesse viennent de ninja-stats.mjs (stats brutes selon le poste, l'ancienneté,
// le type DPS/tank et les stats brutes connues de l'équipement). Le reste est commun à tous ; chaque ninja y ajoute
// sa ligne de base de talent (vitesse, Dégâts, Absorption), ses bonus personnels et les bonus en % de son équipement.
export const BASE = { fury: 100, dr: 200, air: 200, hit: 300, dodge: 50, crit: 80, antiCrit: 80, sAtk: 90, block: 70, extraTurn: 50, aid: 45 };
export const RULES = { applyBaseLine: true, selfStatsInPanel: false };

// Génome : { v: id|null, a: [ids] (0 à 2, le personnage principal est toujours là), s: [ids], nat: {id: nature}, mainType, eq?: {id: {gear, acc}} }
// Éveil de talent utilisé par défaut quand le dernier n'est pas celui que jouent les joueurs (l'éveil de compétence reste appliqué).
export const AWAKENING = { 'natsu-dragneel': 1 };
const awk = (g, id) => g.aw?.[id] ?? AWAKENING[id];

export function toTeam(g, name = 'F', statScale = null) {
  const members = [];
  const stats = (id) => {
    const base = testStats(id, g.eq?.[id], g.mainType, BASE);
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
    return equipmentEntries(slotsToChoice({ gear: Array.isArray(e.gear) ? e.gear : Array(6).fill(e.gear), acc }));
  };
  if (g.v) members.push({ ninja: byId[g.v], pos: 0, stats: stats(g.v), nature: g.nat[g.v], natureLevel: 3, awakening: awk(g, g.v), equipment: eq(g.v) });
  members.push({ ninja: byId.main, pos: 0, stats: stats('main'), attackType: g.mainType, equipment: eq('main'), mainTalents: g.mainTalents });
  g.a.forEach((id, i) => members.push({ ninja: byId[id], pos: i + 1, stats: stats(id), nature: g.nat[id], natureLevel: 3, awakening: awk(g, id), equipment: eq(id) }));
  g.s.forEach((id, i) => members.push({ ninja: byId[id], pos: i, stats: stats(id), nature: g.nat[id], natureLevel: 3, awakening: awk(g, id), equipment: eq(id) }));
  if (ADJUST) focusStats(members);
  return { name, members };
}

// En jeu, les joueurs concentrent leurs ressources : la vitesse sur le support de contrôle, l'attaque sur leur
// meilleur attaquant. Stats de test ajustées dans ce sens (ADJUST=0 pour désactiver) :
// - le support de contrôle (sa spéciale pose un contrôle aux ennemis ; le plus rapide s'il y en a plusieurs) : vitesse × 2 ;
// - le ninja à la plus forte attaque : attaque +5 % et Dégâts +5 ; tous les autres : attaque −5 % et Dégâts −5.
const ADJUST = process.env.ADJUST !== '0';
const isCc = (id) => STATUSES[id]?.type === 'cc';
const flat = (effects = []) => effects.flatMap((e) => (e.oneOf ? e.oneOf.flatMap(flat) : [e]));
export const ccSupport = (n) => n.role === 'supporter' && flat(resolveKit(n).special?.effects)
  .some((e) => isCc(e.status) && (e.to?.side === 'enemy' || typeof e.to === 'string' && /enemy|target/.test(e.to)));
function focusStats(members) {
  const cc = members.filter((m) => ccSupport(m.ninja)).sort((a, b) => b.stats.speed - a.stats.speed)[0];
  if (cc) cc.stats = { ...cc.stats, speed: cc.stats.speed * 2 };
  const top = [...members].sort((a, b) => b.stats.atk - a.stats.atk)[0];
  for (const m of members) {
    const up = m === top ? 1 : -1;
    m.stats = { ...m.stats, atk: m.stats.atk * (1 + 0.05 * up), dr: (m.stats.dr || 0) + 5 * up };
  }
}

// Natures qui profitent au maximum des bonus de nature des talents de la formation (ids : ninjas hors personnage
// principal). Score = nombre de bonus de talent (ou d'éveil) réservés à certaines natures que reçoivent les alliés ;
// à égalité, on préfère le plus de ninjas de même nature.
export function bestNatures(ids) {
  const kits = ids.map((id) => resolveKit(byId[id]));
  const allyNat = kits.flatMap((k) => k.talents.filter((t) => t.to?.side === 'ally' && t.to.nature)
    .map((t) => ({ nat: [].concat(t.to.nature), role: t.to.role && [].concat(t.to.role), w: t.mods?.length || 1 })));
  let best = null;
  const combo = Array(ids.length).fill(0);
  for (let c = 0; c < 5 ** ids.length; c++) {
    let x = c; for (let i = 0; i < ids.length; i++) { combo[i] = x % 5; x = Math.floor(x / 5); }
    let score = 0;
    ids.forEach((id, i) => { for (const t of allyNat) if (t.nat.includes(NATURE_LIST[combo[i]]) && (!t.role || t.role.includes(byId[id].role))) score += t.w; });
    const same = Math.max(...NATURE_LIST.map((_, k) => combo.filter((v) => v === k).length));
    if (!best || score > best.score || (score === best.score && same > best.same)) best = { score, same, nat: combo.map((v) => NATURE_LIST[v]) };
  }
  return Object.fromEntries(ids.map((id, i) => [id, best.nat[i]]));
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
  ['main', g.v, ...g.a, ...g.s].filter(Boolean).sort().map((id) => JSON.stringify(g.eq?.[id] || null)).join(';'), JSON.stringify(g.aw || {})].join('|');
// même ninjas (sans regarder natures ni équipement)
export const core = (g) => [g.v || '-', [...g.a].sort().join(','), [...g.s].sort().join(',')].join('|');
const setName = (id) => [...GEAR_SETS, ...ACCESSORY_SETS].find((x) => x.id === id)?.name.replace(/^Accessoires /, '') || '—';
export const describeEq = (g, id) => {
  const e = g.eq?.[id];
  if (!e) return 'sans équipement';
  const gearTxt = Array.isArray(e.gear)
    ? Object.entries(e.gear.reduce((o, x) => ({ ...o, [x]: (o[x] || 0) + 1 }), {})).map(([x, c]) => `${setName(x)} ×${c}`).join(' + ')
    : `${setName(e.gear)} ×6`;
  const acc = Array.isArray(e.acc) ? e.acc : Array(4).fill(e.acc);
  const same = acc.every((x) => x === acc[0]);
  return `équipement ${gearTxt}, accessoires ${same ? `${setName(acc[0])} ×8` : `Force ${setName(acc[0])}, Chakra ${setName(acc[1])}, Agilité ${setName(acc[2])}, Puissance ${setName(acc[3])}`}`;
};
export const describe = (g) => [g.v ? `${byId[g.v].name} (${g.nat[g.v]})` : null, `Perso principal (${g.mainType === 'magic' ? 'magique' : 'physique'})`,
  ...g.a.map((id) => `${byId[id].name} (${g.nat[id]})`), ...g.s.map((id) => `${byId[id].name} (${g.nat[id]})`)].filter(Boolean).join(' + ');
