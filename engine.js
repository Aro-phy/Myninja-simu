// Moteur de combat Myninja : tour par tour, ordre par vitesse, formation 1-3-3.
import * as F from './formulas.js';
import { STATUSES, UNCLEANSABLE_DOTS } from './statuses.js';

// Règles dont on n'est pas sûr à 100 % : regroupées ici pour pouvoir les ajuster.
export const DEFAULT_RULES = {
  normalFury: 50,          // fury gagnée par une attaque normale
  specialCost: 100,        // fury nécessaire / dépensée pour la spéciale
  specialTeamFury: 33,     // fury rendue à toute la formation si la spéciale ne précise rien
  blockReduction: 33,      // % de dégâts retirés par un blocage
  critFirst: true,         // critique testé avant le blocage (les deux ne peuvent pas arriver ensemble)
  punchChains: false,      // un ninja qui vient d'agir grâce au Tour Bonus peut-il à son tour en déclencher un ?
  assist: true,            // Aide (aid rate) : chance que les dégâts reçus soient en partie absorbés (voir strike)
  assistReduction: 50,     // % des dégâts supprimés par une Aide réussie
  assistHelperShare: 25,   // % des dégâts reportés sur l'allié qui a le plus de PV (le reste va à la cible)
  drCap: 800,              // plafond du taux de Dégâts (wiki : environ 800 %)
  airCap: 700,             // plafond de l'Absorption (wiki : environ 700 %)
  furyCap: 122,            // fury maximale gagnée en combat (la fury de départ peut la dépasser)
  maxRounds: 20,           // limite de rounds ; au-delà : la formation avec le plus de PV restants gagne
  defenseMode: 'corrected',// 'excel' = reproduit le bug de la cellule DEF de l'Excel
  applyBaseLine: false,    // ajouter la ligne de base du talent (vitesse/Dégâts/Absorption propres) aux stats saisies
  selfStatsInPanel: true,  // les bonus fixes « self » sur des stats visibles à l'écran du ninja y sont déjà inclus
  roleFallback: true,      // une attaque sur un poste vide (ex. « les supports ») vise la première ligne à la place
};

export const ROWS = { vanguard: 'V', assaulter: 'A', supporter: 'S' };
// Stats visibles sur l'écran du ninja : un bonus fixe « self » sur l'une d'elles y est déjà compté.
export const PANEL_STATS = new Set(['hp', 'atk', 'patk', 'matk', 'def', 'pdef', 'mdef', 'dr', 'air', 'hit', 'dodge', 'crit',
  'antiCrit', 'sAtk', 'block', 'punch', 'extraTurn', 'aid', 'speed']);
const ROW_ORDER = ['V', 'A', 'S'];
export const ROLE_LABEL = { vanguard: 'Avant-garde', assaulter: 'Attaquant', supporter: 'Support' };
export const NATURES = { none: 'Non activé', earth: 'Terre', fire: 'Feu', thunder: 'Foudre', water: 'Eau', wind: 'Vent' };
// Nature de chakra : X contre Y (X attaque Y avec +Dégâts, Y attaque X avec -Dégâts), X renforce les alliés Y.
export const COUNTERS = { water: 'fire', fire: 'wind', wind: 'thunder', thunder: 'earth', earth: 'water' };
export const BOOSTS = { water: 'thunder', fire: 'earth', thunder: 'fire', wind: 'water', earth: 'wind' };
// Bonus / malus de Dégâts selon l'écart de niveau (mon niveau - niveau adverse), tableau de la communauté.
const COUNTER_UP = [25, 27, 29, 31, 33, 36, 39, 42, 45, 50, 51, 52, 53, 54, 55];
const COUNTERED_DOWN = [25, 23, 21, 19, 17, 15, 13, 11, 9, 7, 6, 5, 4, 3, 2];
export const NATURE_BOOST = { hp: 11, atk: 1 }; // niveau 1 (valeurs des niveaux supérieurs inconnues)

// Bonus de Dégâts (en points de %) quand `att` frappe `tgt` selon leurs natures.
export function natureDrBonus(att, tgt) {
  if (att.nature === 'none' || tgt.nature === 'none') return 0;
  const d = (att.natureLevel || 1) - (tgt.natureLevel || 1);
  if (COUNTERS[att.nature] === tgt.nature) return d >= 0 ? COUNTER_UP[Math.min(d, 14)] : Math.max(0, 25 + d);
  if (COUNTERS[tgt.nature] === att.nature) return d >= 0 ? -COUNTERED_DOWN[Math.min(d, 14)] : -25;
  return 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const fmtNum = (n) => nf.format(Math.round(n));
const fmtPctNum = (n) => `${(Math.round(n * 10) / 10).toLocaleString('fr-FR')} %`;

export function validateTeam(team) {
  const errors = [];
  const m = team.members || [];
  if (m.length === 0) errors.push('La formation est vide.');
  if (m.length > 5) errors.push('5 ninjas maximum.');
  const count = (r) => m.filter((x) => x.ninja.role === r).length;
  if (count('vanguard') > 1) errors.push('1 avant-garde maximum.');
  if (count('assaulter') > 3) errors.push('3 attaquants maximum.');
  if (count('supporter') > 3) errors.push('3 supports maximum.');
  return errors;
}

// Talents et compétences effectifs d'un ninja selon son niveau d'éveil.
export function resolveKit(ninja, level) {
  const aw = ninja.awakenings || [];
  const lvl = Math.min(level ?? aw.length, aw.length);
  let awTalents = [];
  const extraEffects = [];
  const extraHits = [];
  let special = ninja.special;
  let base = ninja.base;
  let replacedHits = null;
  for (let i = 0; i < lvl; i++) {
    const a = aw[i];
    if (a.base) base = a.base;
    if (a.replacePrevious) awTalents = [];
    awTalents.push(...(a.talents || []));
    if (a.specialEffects) extraEffects.push(...a.specialEffects);
    if (a.specialHits) extraHits.push(...a.specialHits);
    if (a.replaceHits) replacedHits = a.replaceHits;
    if (a.special) special = a.special;
  }
  if (special && (extraEffects.length || extraHits.length || replacedHits)) {
    special = { ...special, effects: [...(special.effects || []), ...extraEffects], hits: [...(replacedHits || skillHits(special)), ...extraHits] };
  }
  return { talents: [...(ninja.talents || []), ...awTalents], special, normal: ninja.normal || {}, base, level: lvl };
}

function skillHits(skill, rng) {
  if (skill.noDamage) return [];
  if (skill.hitChoices && rng) {
    let r = rng() * skill.hitChoices.reduce((a, c) => a + (c.chance ?? 1), 0);
    for (const c of skill.hitChoices) { r -= c.chance ?? 1; if (r <= 0) return c.hits; }
    return skill.hitChoices[skill.hitChoices.length - 1].hits;
  }
  if (skill.hits) return skill.hits;
  return [{ target: skill.target || 'front-row', pct: skill.skillPct ?? 100 }];
}

// ---------- Création des unités ----------

function makeUnit(member, team, index) {
  const n = member.ninja;
  const kit = resolveKit(n, member.awakening);
  return {
    uid: `${team}-${index}`,
    team,
    ninja: n,
    kit,
    name: member.label || n.name,
    role: n.role,
    nature: member.nature || n.nature || 'none',
    natureLevel: member.natureLevel || 1,
    tags: n.tags || [],
    gender: n.gender,
    isMain: !!n.isMain,
    attackType: member.attackType || n.attackType || (n.role === 'supporter' ? 'magic' : 'physical'),
    row: ROWS[n.role],
    pos: member.pos ?? 0,
    stats: { ...member.stats },
    maxHp: member.stats.hp || 1,
    hp: member.stats.hp || 1,
    fury: member.stats.fury ?? 100,
    alive: true,
    effects: [],
    passives: {},   // modificateurs permanents par stat : { stat: [{ value, kind, source, scaleSrc?, per? }] }
    immune: new Set(),
    triggers: [],   // { on, chance, effects, once, used }
    procs: [],      // effets d'équipement déclenchés à chaque attaque
    equipment: member.equipment || [],
  };
}

// ---------- Lecture des modificateurs ----------

const lostPct = (u) => Math.max(0, 100 * (1 - u.hp / u.maxHp));

function allMods(u, stat) {
  const out = [];
  for (const p of u.passives[stat] || []) {
    if (p.hpBelow && 100 * u.hp / u.maxHp >= p.hpBelow) continue;
    const v = p.scaleSrc ? p.value * Math.floor(lostPct(p.scaleSrc) / p.per) : p.value;
    if (v) out.push({ value: v, kind: p.kind || 'talent' });
  }
  for (const e of u.effects) for (const m of e.mods || []) if (m.stat === stat) out.push({ value: m.value, kind: m.kind || 'icon' });
  return out;
}
function addPassive(u, p) { (u.passives[p.stat] ||= []).push(p); }
// Somme des modificateurs d'une stat (version sans allocation : appelée très souvent).
function modSum(u, stat) {
  let sum = 0;
  const ps = u.passives[stat];
  if (ps) for (const p of ps) if (!(p.hpBelow && 100 * u.hp / u.maxHp >= p.hpBelow)) sum += p.scaleSrc ? p.value * Math.floor(lostPct(p.scaleSrc) / p.per) : p.value;
  for (const e of u.effects) for (const m of e.mods) if (m.stat === stat) sum += m.value;
  return sum;
}
const hasFlag = (u, flag) => u.effects.some((e) => e.flags && e.flags[flag]);
// Buff de la cible pris en compte contre cet attaquant : un attaquant immunisé à ce buff l'ignore.
const hasFlagVs = (u, flag, att) => u.effects.some((e) => e.flags && e.flags[flag] && !(att && att.immune.has(e.id)));
const stat = (u, s) => (u.stats[s] || 0) + modSum(u, s);

function atkParts(u, type = u.attackType) {
  const key = type === 'magic' ? 'matk' : 'patk';
  const mods = [...allMods(u, 'atk'), ...allMods(u, key)];
  return {
    atk: u.stats[key] || 0,
    talents: mods.filter((m) => m.kind === 'talent').map((m) => m.value),
    icons: mods.filter((m) => m.kind !== 'talent').reduce((a, m) => a + m.value, 0),
    negIcons: mods.filter((m) => m.kind !== 'talent' && m.value < 0).reduce((a, m) => a - m.value, 0),
  };
}

// extraIcons : % additif en plus sur la défense (ex. « Weaken enemy's DEF » net, négatif).
function defEff(att, tgt, type, rules, extraIcons = 0) {
  const key = type === 'magic' ? 'mdef' : 'pdef';
  const cutRes = 1 - Math.min(100, modSum(tgt, 'defCutRes')) / 100; // résistance à la réduction de défense
  const mods = [...allMods(tgt, 'def'), ...allMods(tgt, key)].map((m) => (m.value < 0 ? { ...m, value: m.value * cutRes } : m));
  return F.effectiveDefense({
    def: tgt.stats[key] || 0,
    talents: mods.filter((m) => m.kind === 'talent').map((m) => m.value),
    icons: mods.filter((m) => m.kind !== 'talent').reduce((a, m) => a + m.value, 0) + extraIcons,
    ignoreDef: att ? modSum(att, 'ignoreDef') : 0,
    immuneIgnoreDef: modSum(tgt, 'immuneIgnoreDef'),
    mode: rules.defenseMode,
  });
}

// Bouclier de défense : un % de la défense (talents compris) retiré des dégâts directs et des DoT.
function shieldAmount(att, tgt) {
  const pierce = 1 - Math.min(100, att ? modSum(att, 'shieldPierce') : 0) / 100;
  const part = (key, stat) => {
    const pct = modSum(tgt, stat);
    if (pct <= 0) return 0;
    const talents = [...allMods(tgt, 'def'), ...allMods(tgt, key)].filter((m) => m.kind === 'talent').map((m) => m.value);
    return F.effectiveAttack({ atk: tgt.stats[key] || 0, talents, icons: 0 }) * pct / 100;
  };
  return (part('pdef', 'pdefShield') + part('mdef', 'mdefShield')) * pierce;
}

export function currentSpeed(u) {
  const mods = allMods(u, 'speed');
  return F.battleSpeed({
    speed: u.stats.speed || 0,
    talents: mods.filter((m) => m.kind === 'talent').map((m) => m.value),
    icons: mods.filter((m) => m.kind !== 'talent').reduce((a, m) => a + m.value, 0),
  });
}

// ---------- Ciblage ----------

const SHORTHANDS = {
  self: { side: 'self' },
  allies: { side: 'ally', pick: 'all' },
  enemies: { side: 'enemy', pick: 'all' },
  'front-row': { side: 'enemy', pick: 'front-row' },
};
const asList = (v) => (v == null ? null : Array.isArray(v) ? v : [v]);

function resolve(sel, caster, units, rng, rules) {
  if (typeof sel === 'string') sel = SHORTHANDS[sel] || { side: 'enemy', pick: sel };
  if (sel.side === 'self') return [caster];
  let pool = units.filter((u) => u.alive && (sel.side === 'ally' ? u.team === caster.team : u.team !== caster.team));
  if (sel.excludeSelf) pool = pool.filter((u) => u !== caster);
  const roles = asList(sel.role), natures = asList(sel.nature);
  if (roles) pool = pool.filter((u) => roles.includes(u.role));
  if (natures) pool = pool.filter((u) => natures.includes(u.nature));
  if (sel.tag) pool = pool.filter((u) => u.tags.includes(sel.tag));
  if (sel.gender) pool = pool.filter((u) => u.gender === sel.gender);
  if (sel.main) pool = pool.filter((u) => u.isMain);
  if (sel.name) { const names = asList(sel.name); pool = pool.filter((u) => names.some((n) => u.ninja.name.toLowerCase().includes(n))); }
  if (!pool.length && roles && sel.fallback !== false && rules?.roleFallback && sel.side !== 'ally') {
    return resolve({ side: sel.side, pick: 'front-row' }, caster, units, rng, rules);
  }
  const count = Array.isArray(sel.count) ? sel.count[0] + Math.floor(rng() * (sel.count[1] - sel.count[0] + 1)) : sel.count || 1;
  const sortBy = (fn, dir) => [...pool].sort((a, b) => dir * (fn(a) - fn(b))).slice(0, count);
  switch (sel.pick || 'all') {
    case 'all': return pool;
    case 'front-row': {
      for (const r of ROW_ORDER) { const row = pool.filter((u) => u.row === r); if (row.length) return row; }
      return [];
    }
    case 'back-row': {
      for (const r of [...ROW_ORDER].reverse()) { const row = pool.filter((u) => u.row === r); if (row.length) return row; }
      return [];
    }
    case 'lowest-hp': return sortBy((u) => u.hp, 1);
    case 'highest-hp': return sortBy((u) => u.hp, -1);
    case 'lowest-hp-pct': return sortBy((u) => u.hp / u.maxHp, 1);
    case 'highest-atk': return sortBy((u) => atkParts(u).atk, -1);
    case 'highest-speed': return sortBy((u) => currentSpeed(u), -1);
    case 'highest-air': return sortBy((u) => stat(u, 'air'), -1);
    case 'lowest-air': return sortBy((u) => stat(u, 'air'), 1);
    case 'highest-ccres': return sortBy((u) => stat(u, 'ccRes'), -1);
    case 'lowest-ccres': return sortBy((u) => stat(u, 'ccRes'), 1);
    case 'lowest-ccrate': return sortBy((u) => stat(u, 'ccRate'), 1);
    case 'highest-dr': return sortBy((u) => stat(u, 'dr'), -1);
    case 'lowest-speed': return sortBy((u) => currentSpeed(u), 1);
    case 'random': {
      const p = [...pool], out = [];
      while (p.length && out.length < count) out.push(p.splice(Math.floor(rng() * p.length), 1)[0]);
      return out;
    }
    default: return pool;
  }
}

// ---------- Combat ----------

// Stats suivies par le mode inspection (page « Comparatif des bonus »).
export const INSPECT_STATS = ['hp', 'atk', 'patk', 'matk', 'def', 'pdef', 'mdef', 'dr', 'air', 'finalDmg', 'finalReduction', 'dmgTaken',
  'speed', 'ccRate', 'ccRes', 'crit', 'antiCrit', 'critDmg', 'block', 'sAtk', 'sBlock', 'sCrit', 'hit', 'dodge', 'punch', 'aid',
  'ignoreDef', 'immuneIgnoreDef', 'ignoreEnemyAtk', 'weakenAtk', 'weakenDef', 'immuneWeakenDef', 'penBonus', 'penMalus',
  'pdefShield', 'mdefShield', 'recovery', 'healCut', 'reflectRes', 'sBlockRes', 'dotBonus'];

export function inspect(teamA, teamB, opts = {}) {
  return simulate(teamA, teamB, { ...opts, inspect: true, log: false });
}

export function simulate(teamA, teamB, opts = {}) {
  const rules = { ...DEFAULT_RULES, ...(opts.rules || {}) };
  const rng = mulberry32(opts.seed ?? Math.floor(Math.random() * 2 ** 31));
  const logOn = opts.log !== false;
  // Sans journal (simulation de masse), on évite de mettre en forme des textes inutiles.
  const fmt = logOn ? fmtNum : () => '';
  const fmtPct = logOn ? fmtPctNum : () => '';
  const log = [];
  const units = [
    ...teamA.members.map((m, i) => makeUnit(m, 0, i)),
    ...teamB.members.map((m, i) => makeUnit(m, 1, i)),
  ];
  const teamNames = [teamA.name || 'Formation A', teamB.name || 'Formation B'];
  let round = 0;
  let current = null; // unité dont c'est le tour (pour la gestion des durées)
  const L = (type, text, extra = {}) => { if (logOn) log.push({ round, type, text, ...extra }); };
  const who = (u) => `${u.name}${u.team === 0 ? ' (A)' : ' (B)'}`;
  const hpTxt = (u) => `${fmtPct((100 * Math.max(0, u.hp)) / u.maxHp)} PV`;
  const roll = (p) => rng() < p;
  const R = (sel, caster) => resolve(sel, caster, units, rng, rules);
  // Tour Bonus (« punch rate ») : stat de l'écran + bonus/malus de combat (talents alliés, réductions ennemies).
  const punchChance = (u) => stat(u, 'extraTurn') + modSum(u, 'punch');

  // --- talents, éveils et équipements ---
  function applyEntry(owner, p, source) {
    if (p.on) { owner.triggers.push({ ...p, source, used: false }); return; }
    const targets = R(p.to || 'self', owner);
    const selfOnly = (p.to || 'self') === 'self' && !p.scale;
    for (const t of targets) {
      for (const m of p.mods || []) {
        if (selfOnly && rules.selfStatsInPanel && PANEL_STATS.has(m.stat)) continue;
        addPassive(t, { ...m, kind: m.kind || 'talent', source, ...(p.scale ? { scaleSrc: owner, per: p.scale } : {}), ...(p.hpBelow ? { hpBelow: p.hpBelow } : {}) });
      }
      for (const im of p.immune || []) t.immune.add(im);
      if (p.status) addStatus(owner, t, { status: p.status, value: p.value, duration: Infinity }, true);
    }
  }
  for (const u of units) {
    const b = u.kit.base;
    if (rules.applyBaseLine && b) {
      for (const [k, v] of Object.entries(b)) if (typeof v === 'number') addPassive(u, { stat: k, value: v, kind: 'talent', source: 'base' });
    }
    for (const p of u.kit.talents) applyEntry(u, p, `talent ${u.ninja.name}`);
    for (const eq of u.equipment) {
      for (const p of eq.talents || []) applyEntry(u, p, eq.name);
      for (const p of eq.passives || []) applyEntry(u, p, eq.name);
      for (const pr of eq.procs || []) u.procs.push({ ...pr, source: eq.name });
    }
  }
  // Renforcement de nature : un allié de nature X renforce les alliés de nature BOOSTS[X] (non cumulable).
  for (const u of units) {
    if (u.nature === 'none') continue;
    if (units.some((a) => a.team === u.team && a !== u && BOOSTS[a.nature] === u.nature)) {
      addPassive(u, { stat: 'hp', value: NATURE_BOOST.hp, kind: 'talent', source: 'nature' });
      addPassive(u, { stat: 'atk', value: NATURE_BOOST.atk, kind: 'talent', source: 'nature' });
    }
  }
  for (const u of units) {
    u.maxHp = (u.stats.hp || 1) * (1 + modSum(u, 'hp') / 100);
    u.hp = u.maxHp;
  }
  // Mode « inspection » : bonus de combat de chaque ninja (talents, éveils, natures, équipements fournis),
  // en tenant compte des bonus alliés et des malus ennemis, sans lancer le combat.
  if (opts.inspect) {
    return units.map((u) => ({
      uid: u.uid, team: u.team, name: u.name, role: u.role,
      mods: Object.fromEntries(INSPECT_STATS.map((k) => [k, modSum(u, k)])),
      immune: [...u.immune],
    }));
  }

  // --- états ---
  function dodgeKind(src, tgt) {
    if (!src || src.team === tgt.team) return null;
    const e = tgt.effects.find((x) => x.flags?.superDodge && !src.immune.has(x.flags.superDodge));
    return e ? e.name : null;
  }

  function addStatus(src, tgt, eff, silent = false) {
    const def = STATUSES[eff.status] || (eff.type === 'debuff' ? STATUSES.customDebuff : STATUSES.customBuff);
    const type = eff.type || def.type;
    const name = eff.name || def.name;
    if (!tgt.alive) return false;
    const hostile = type !== 'buff';
    const say = (m) => { if (!silent) L('info', m); };
    // Immunité à un buff (Super Dodge…) : elle sert à ignorer celui des ennemis, pas à empêcher de le recevoir.
    if (eff.status && hostile && (tgt.immune.has(eff.status) || tgt.effects.some((e) => e.flags?.immuneTo === eff.status))) { say(`${who(tgt)} est immunisé à ${name}.`); return false; }
    if (hostile && src && src.team !== tgt.team) {
      const dk = dodgeKind(src, tgt);
      if (dk) { say(`${who(tgt)} évite ${name} (${dk}).`); return false; }
    }
    if (type === 'buff' && hasFlag(tgt, 'noBuffs')) { say(`${who(tgt)} ne peut pas recevoir de buff (${name} bloqué).`); return false; }
    if ((type === 'debuff' || type === 'dot') && hasFlag(tgt, 'debuffImmune')) { say(`${who(tgt)} est immunisé aux debuffs (${name}).`); return false; }
    if (type === 'cc' && hasFlag(tgt, 'ccImmune')) { say(`${who(tgt)} est immunisé aux contrôles (${name}).`); return false; }
    const value = eff.value ?? def.value;
    const e = {
      id: eff.status || name,
      name,
      type,
      cleansable: eff.cleansable ?? def.cleansable,
      flags: { ...(def.flags || {}), ...(eff.flags || {}) },
      mods: eff.mods ? eff.mods.map((m) => ({ kind: 'icon', ...m })) : def.mods ? def.mods(value) : [],
      value,
      remaining: eff.duration ?? 2,
      fresh: current === tgt, // posé pendant le tour de son porteur : ne décompte pas ce tour-ci
      dot: eff.dot,
      source: src,
    };
    // Un effet déjà présent est remplacé par le nouveau (valeur et durée), sans cumul.
    // Un effet permanent (talent, équipement) n'est pas remplacé par une version temporaire.
    const idx = tgt.effects.findIndex((x) => x.id === e.id);
    if (idx >= 0) {
      if (!Number.isFinite(tgt.effects[idx].remaining) && Number.isFinite(e.remaining)) return true;
      tgt.effects[idx] = e;
      if (!silent) L('effect', `${who(tgt)} : ${name} renouvelé (${Number.isFinite(e.remaining) ? `${e.remaining} tour(s)` : 'permanent'}).`, { target: tgt.uid });
      return true;
    }
    tgt.effects.push(e);
    if (!silent) {
      const v = value != null && !e.dot && def.mods ? ` (${value} %)` : '';
      L('effect', `${who(tgt)} reçoit ${name}${v}${Number.isFinite(e.remaining) ? ` pour ${e.remaining} tour(s)` : ''}.`, { target: tgt.uid });
    }
    return true;
  }

  function kill(u, src, kind) {
    const deathFx = u.triggers.filter((t) => t.on === 'death' && !t.effects.some((e) => e.revive));
    const rev = u.triggers.find((t) => t.on === 'death' && t.effects.some((e) => e.revive) && !(t.once !== false && t.used));
    if (rev) {
      rev.used = true;
      const pct = rev.effects.find((e) => e.revive)?.revive ?? 50;
      u.hp = u.maxHp * pct / 100;
      u.effects = u.effects.filter((e) => e.type === 'buff');
      L('death', `✨ ${who(u)} tombe${src ? ` sous les coups de ${who(src)}` : ''} mais ressuscite avec ${pct} % PV.`, { target: u.uid });
      runEffects(u, rev.effects.filter((e) => !e.revive), { attacker: src });
      return;
    }
    u.hp = 0;
    u.alive = false;
    L('death', `💀 ${who(u)} est mis K.O.${src ? ` par ${who(src)}` : ''} (${kind}).`, { target: u.uid });
    for (const t of deathFx) {
      if (t.chance != null && t.chance < 100 && !roll(t.chance / 100)) continue;
      runEffects(u, t.effects, { attacker: src, ownerDead: true });
    }
  }

  // msg : texte du coup, journalisé avant l'éventuel K.O.
  function damage(tgt, amount, src, kind, msg) {
    if (!tgt.alive) return;
    tgt.hp -= amount;
    if (msg) L(msg.type, msg.text(), msg.extra);
    if (tgt.hp <= 0) kill(tgt, src, kind);
  }

  function heal(src, tgt, pctHeal, type) {
    if (!tgt.alive) return;
    if (hasFlag(tgt, 'noHeal')) { L('info', `${who(tgt)} ne peut pas être soigné.`); return; }
    const a = atkParts(src, type || src.attackType);
    const amount = F.healAmount({
      atkTalentOnly: F.effectiveAttack({ atk: a.atk, talents: a.talents, icons: 0 }),
      atkDebuffIcon: a.negIcons,
      healerDr: F.effectiveRate(src.stats.dr || 0, [modSum(src, 'dr')]),
      targetRecoveryRate: F.recoveryRate({
        bonuses: [tgt.stats.recovery || 0, modSum(tgt, 'recovery')],
        maluses: [],
        isVanguard: tgt.role === 'vanguard',
        upwind: modSum(tgt, 'recoveryCut'),
      }),
      healPct: pctHeal,
      fury: src.fury,
      healDebuff: modSum(tgt, 'healCut'),
    });
    const real = Math.max(0, Math.min(amount, tgt.maxHp - tgt.hp));
    tgt.hp += real;
    if (real > 0) L('heal', `${who(src)} soigne ${who(tgt)} de ${fmt(real)} → ${hpTxt(tgt)}.`, { actor: src.uid, amount: real });
  }

  function changeFury(src, t, n) {
    if (!t.alive) return;
    if (n > 0 && hasFlag(t, 'noFury')) { L('info', `${who(t)} ne peut pas gagner de fury.`); return; }
    if (n < 0 && src && src.team !== t.team && t.immune.has('furyReduction')) { L('info', `${who(t)} est immunisé à la réduction de fury.`); return; }
    // Un gain ne dépasse pas le plafond (une fury de départ plus haute est conservée) ; une perte descend au plus à 0.
    t.fury = n > 0 ? Math.max(t.fury, Math.min(rules.furyCap, t.fury + n)) : Math.max(0, t.fury + n);
  }

  // Un coup direct. Renvoie { hit, dmg }.
  function strike(att, tgt, skillPct, mult, label, type = att.attackType, ctx) {
    const dk = dodgeKind(att, tgt);
    if (dk) { L('miss', `${who(tgt)} évite totalement l'attaque (${dk}).`, { attacker: att.uid }); return { hit: false, dmg: 0 }; }
    if (!roll(F.chance(stat(att, 'hit'), stat(tgt, 'dodge')))) { L('miss', `${who(att)} rate ${who(tgt)} (esquive).`, { attacker: att.uid }); return { hit: false, dmg: 0 }; }
    const a = atkParts(att, type);
    // Équipements : « Weaken enemy's DEF » de l'attaquant contre « Weaken enemy's ATK » de la cible.
    // Le plus fort l'emporte de la différence : défense de la cible baissée, ou attaque de l'attaquant baissée.
    // Ce bonus n'est pas réduit par la résistance à l'ignore défense.
    // « Immune Weaken DEF » de la cible annule d'abord une partie du « Weaken enemy's DEF » de l'attaquant.
    const weaken = Math.max(0, modSum(att, 'weakenDef') - modSum(tgt, 'immuneWeakenDef')) - modSum(tgt, 'weakenAtk');
    const atkEff = F.effectiveAttack({ atk: a.atk, talents: a.talents, icons: a.icons - modSum(tgt, 'ignoreEnemyAtk') - Math.max(0, -weaken) });
    const dEff = defEff(att, tgt, type, rules, -Math.max(0, weaken));
    const drEff = Math.min(rules.drCap, F.effectiveRate(att.stats.dr || 0, [modSum(att, 'dr'), natureDrBonus(att, tgt)]));
    const airEff = Math.min(rules.airCap, F.effectiveRate(tgt.stats.air || 0, [modSum(tgt, 'air')]));
    // (ATK - DEF) et (Dégâts - Absorption) bornés à 0 séparément : deux termes négatifs ne doivent pas donner des dégâts positifs.
    const base = atkEff <= dEff || drEff <= airEff ? 0 : F.hitDamage({
      atkEff,
      defEff: dEff,
      skillPct,
      drEff,
      airEff,
      fury: att.fury,
      finalBonus: F.finalDamageBonus({
        bonus: modSum(att, 'finalDmg'),
        reduction: modSum(tgt, 'finalReduction'),
        decreaseReduction: modSum(att, 'decreaseReduction') + modSum(tgt, 'decreaseReduction'),
      }),
    }) * mult * Math.max(0, 1 + modSum(tgt, 'dmgTaken') / 100);
    const pCrit = F.chance(stat(att, 'crit'), stat(tgt, 'antiCrit'));
    const pBlock = F.chance(stat(tgt, 'block'), stat(att, 'sAtk'));
    let crit = false, block = false;
    if (rules.critFirst) { crit = roll(pCrit); if (!crit) block = roll(pBlock); }
    else { block = roll(pBlock); if (!block) crit = roll(pCrit); }
    let dmg = Math.max(0, base); // jamais de dégâts négatifs (malus de dégâts finaux sous −100 %)
    if (crit) dmg *= F.critMultiplier(modSum(att, 'critDmg'), -modSum(tgt, 'critDmgTaken'));
    if (block) dmg *= 1 - rules.blockReduction / 100;
    if (dmg > 0) dmg = Math.max(0, dmg - shieldAmount(att, tgt));
    if (label === 'spéciale' && hasFlagVs(tgt, 'voidSkill', att)) {
      L('hit', `${who(tgt)} ne subit pas les dégâts de la compétence (Vide).`, { attacker: att.uid });
      dmg = 0;
    } else if (hasFlagVs(tgt, 'ignoreDirect', att)) {
      L('hit', `${who(tgt)} ignore les dégâts directs (Shielding).`, { attacker: att.uid });
      dmg = 0;
    } else {
      // Aide (wiki) : selon l'aid rate de la cible, 50 % des dégâts sont supprimés ; 25 % vont à la cible
      // et 25 % à l'allié qui a le plus de PV à ce moment (la cible elle-même si c'est elle).
      let helper = null, helperDmg = 0;
      if (rules.assist && dmg > 0 && roll(Math.max(0, stat(tgt, 'aid')) / 100)) {
        helper = units.filter((x) => x.alive && x.team === tgt.team).reduce((a, b) => (b.hp > a.hp ? b : a));
        const full = dmg;
        helperDmg = full * rules.assistHelperShare / 100;
        dmg = full * (100 - rules.assistReduction) / 100 - helperDmg;
        if (helper === tgt) { dmg += helperDmg; helperDmg = 0; }
        L('aid', `🤝 Aide : ${who(tgt)} est assisté, ${fmt(full)} dégâts réduits de ${rules.assistReduction} %${helperDmg ? `, ${who(helper)} en prend ${rules.assistHelperShare} %` : ''}.`, { target: tgt.uid });
      }
      damage(tgt, dmg, att, label, { type: 'hit', extra: { attacker: att.uid, target: tgt.uid, amount: dmg, crit, block },
        text: () => `${who(att)} → ${who(tgt)} : ${fmt(dmg)} dégâts${type !== att.attackType ? (type === 'magic' ? ' stratégiques' : ' physiques') : ''}${crit ? ' (CRITIQUE)' : ''}${block ? ' (BLOQUÉ)' : ''} → ${hpTxt(tgt)}.` });
      ctx.lost.set(tgt, (ctx.lost.get(tgt) || 0) + dmg);
      if (helperDmg > 0 && helper.alive) {
        damage(helper, helperDmg, att, 'aide', { type: 'hit', extra: { target: helper.uid, amount: helperDmg },
          text: () => `${who(helper)} absorbe ${fmt(helperDmg)} dégâts (Aide) → ${hpTxt(helper)}.` });
      }
    }
    const sCrit = stat(att, 'sCrit') - modSum(tgt, 'sCritRes');
    if (crit && sCrit > 0 && tgt.alive) {
      const d = tgt.hp * sCrit / 100;
      damage(tgt, d, att, 's.crit', { type: 'hit', extra: { attacker: att.uid, amount: d }, text: () => `S.crit : ${who(tgt)} perd ${fmt(d)} PV (${sCrit} % de ses PV actuels) → ${hpTxt(tgt)}.` });
    }
    const sBlock = stat(tgt, 'sBlock') - modSum(att, 'sBlockRes');
    if (block && sBlock > 0 && att.alive && tgt.alive) {
      const d = att.hp * sBlock / 100;
      damage(att, d, tgt, 's.block', { type: 'hit', extra: { attacker: tgt.uid, amount: d }, text: () => `S.block : ${who(att)} perd ${fmt(d)} PV (${sBlock} % de ses PV actuels) → ${hpTxt(att)}.` });
    }
    return { hit: true, dmg };
  }

  // ctx : { hit: [cibles touchées], attacker: unité qui vient d'attaquer (déclencheurs), lost: Map PV perdus }
  function runEffects(owner, effects, ctx = {}) {
    for (const eff of effects || []) {
      if (eff.oneOf) { // un seul des groupes d'effets, tiré au hasard (pondéré par `weights`)
        if (eff.chance != null && eff.chance < 100 && !roll(eff.chance / 100)) continue;
        const w = eff.weights || eff.oneOf.map(() => 1);
        let r = rng() * w.reduce((a, b) => a + b, 0), i = 0;
        while (i < w.length - 1 && (r -= w[i]) > 0) i++;
        runEffects(owner, eff.oneOf[i], ctx);
        continue;
      }
      let targets;
      if (eff.to === 'target' || eff.to === undefined) targets = ctx.hit || [];
      else if (eff.to === 'attacker') targets = ctx.attacker ? [ctx.attacker] : [];
      else targets = R(eff.to, owner);
      for (const t of targets) {
        if (!t || !t.alive) continue;
        if (!owner.alive && !ctx.ownerDead) continue;
        if (eff.status && STATUSES[eff.status]?.type !== 'buff' && t.immune.has(eff.status)) { L('info', `${who(t)} est immunisé à ${STATUSES[eff.status]?.name || eff.status}.`, { target: t.uid }); continue; }
        const isCc = eff.status && STATUSES[eff.status]?.type === 'cc';
        let p = eff.chance ?? 100;
        if (isCc && t.team !== owner.team) p += stat(owner, 'ccRate') - stat(t, 'ccRes');
        if (p < 100 && !roll(Math.max(0, p) / 100)) {
          if (isCc) L('info', `${who(t)} résiste à ${STATUSES[eff.status].name}.`, { target: t.uid });
          continue;
        }
        applyOne(owner, t, eff, ctx);
      }
    }
  }

  function applyOne(owner, t, eff, ctx) {
    if (eff.strike) strike(owner, t, eff.strike, 1, 'coup', eff.attackType || owner.attackType, { hit: [], lost: new Map() });
    else if (eff.hot) addStatus(owner, t, { name: `Soin continu ${eff.hot} %`, type: 'buff', duration: eff.duration ?? 2, cleansable: true, flags: { hot: eff.hot } });
    else if (eff.heal) heal(owner, t, eff.heal, eff.attackType);
    else if (eff.penetration) {
      const dk = dodgeKind(owner, t);
      if (dk) { L('miss', `${who(t)} évite la pénétration (${dk}).`); return; }
      const a = atkParts(owner, eff.attackType || owner.attackType);
      const d = F.penetrationDamage({
        atkEff: F.effectiveAttack({ atk: a.atk, talents: a.talents, icons: 0 }),
        penPct: eff.penetration, penBonus: modSum(owner, 'penBonus'),
        penMalus: modSum(t, 'penMalus'), penMultiplier: modSum(t, 'penMultiplier'),
      });
      damage(t, d, owner, 'pénétration', { type: 'hit', extra: { attacker: owner.uid, amount: d },
        text: () => `${who(owner)} → ${who(t)} : ${fmt(d)} dégâts de pénétration → ${hpTxt(t)}.` });
    } else if (eff.dot) {
      if (eff.dot.name === 'Sticky acid' && t.immune.has('stickyAcid')) { L('info', `${who(t)} est immunisé à Sticky acid.`); return; }
      const a = atkParts(owner);
      const snap = F.effectiveAttack({ atk: a.atk, talents: a.talents, icons: a.icons });
      addStatus(owner, t, { name: eff.dot.name || 'DoT', type: 'dot', duration: eff.dot.duration ?? 2,
        cleansable: !UNCLEANSABLE_DOTS.includes(eff.dot.name),
        dot: { pct: eff.dot.pct, atk: snap * (1 + (modSum(owner, 'dotBonus') + modSum(owner, `dotBonus:${eff.dot.name}`)) / 100), attType: owner.attackType, bypassBloodline: eff.dot.name === 'Sticky acid' } });
    } else if (eff.fury) {
      changeFury(owner, t, eff.fury);
      L('effect', `${who(t)} : fury ${eff.fury > 0 ? '+' : ''}${eff.fury} (${fmt(t.fury)}).`, { target: t.uid });
    } else if (eff.cleanse) {
      const before = t.effects.length;
      const kinds = eff.cleanse === 'all' ? ['buff', 'debuff', 'dot', 'cc'] : eff.cleanse === 'debuff' ? ['debuff', 'dot', 'cc'] : [eff.cleanse];
      // Wiki : un buff non dissipable comme le S-Super Dodge le devient pour un ennemi immunisé à ce buff (ex. Hiruko).
      const canRemove = (e) => e.cleansable || (owner.team !== t.team && owner.immune.has(e.id));
      t.effects = t.effects.filter((e) => !(canRemove(e) && Number.isFinite(e.remaining) && kinds.includes(e.type)));
      if (before !== t.effects.length) L('effect', `${who(t)} : ${before - t.effects.length} effet(s) dissipé(s).`, { target: t.uid });
    } else if (eff.hpLossPct) {
      const d = t.hp * eff.hpLossPct / 100;
      damage(t, d, owner, 'perte de PV', { type: 'dot', extra: { target: t.uid, amount: d },
        text: () => `${who(t)} perd ${eff.hpLossPct} % de ses PV actuels (${fmt(d)}) → ${hpTxt(t)}.` });
    } else if (eff.reflect) {
      const lost = ctx.lost?.get(owner) || 0;
      const pct = eff.reflect - stat(t, 'reflectRes');
      if (lost > 0 && pct > 0) {
        const d = lost * pct / 100;
        damage(t, d, owner, 'renvoi', { type: 'hit', extra: { attacker: owner.uid, amount: d },
          text: () => `Renvoi : ${who(owner)} renvoie ${fmt(d)} dégâts à ${who(t)} → ${hpTxt(t)}.` });
      }
    } else if (eff.status || eff.mods) {
      addStatus(owner, t, eff);
    }
  }

  // Une action : 'main' (tour normal ou tour bonus) ou 'aid' (aide).
  function act(u, mode) {
    const sealed = u.effects.find((e) => e.flags?.cc === 'seal');
    const canSpecial = u.kit.special && u.fury >= rules.specialCost;
    const noNormal = u.effects.find((e) => e.flags?.cc === 'noNormal');
    const followUp = false; // une action déclenchée par le Tour Bonus peut aussi être une spéciale
    if (noNormal && (followUp || !canSpecial || sealed)) {
      L('info', `${who(u)} est sous ${noNormal.name} : attaque normale impossible.`, { actor: u.uid });
      return;
    }
    const useSpecial = !followUp && canSpecial && !sealed;
    const skill = useSpecial ? u.kit.special : u.kit.normal;
    const name = useSpecial ? `la compétence spéciale « ${skill.name || 'Spéciale'} »` : mode === 'punch' ? 'une attaque normale (Tour Bonus)'
      : skill.name ? `l'attaque normale « ${skill.name} »` : 'une attaque normale';
    L('action', `${who(u)} utilise ${name} (fury ${fmt(u.fury)}).`, { actor: u.uid, special: useSpecial });
    if (sealed && canSpecial && !followUp) L('info', `${who(u)} est sous ${sealed.name} : spéciale impossible.`, { actor: u.uid });
    const ctx = { hit: [], attacker: u, lost: new Map() };
    if (useSpecial) runEffects(u, skill.pre, ctx);
    const struck = new Set();
    const mult = 1;
    for (const h of skillHits(skill, rng)) {
      for (const t of R(h.target || 'front-row', u)) {
        if (!t.alive || !u.alive) continue;
        const pct = h.pctByRole?.[t.role] ?? h.pctByNature?.[t.nature] ?? h.pct ?? 100;
        struck.add(t);
        const r = strike(u, t, pct, mult, useSpecial ? 'spéciale' : 'attaque', h.attackType || u.attackType, ctx);
        if (r.hit && !ctx.hit.includes(t)) ctx.hit.push(t);
      }
    }
    if (skill.noDamage) ctx.hit.push(...R(skill.target || 'front-row', u));
    if (u.alive) {
      runEffects(u, skill.effects, ctx);
      for (const pr of u.procs) if (!pr.on || pr.on === 'any' || (pr.on === 'special') === useSpecial) runEffects(u, [pr], ctx);
    }
    // fury
    // Une compétence (spéciale ou attaque normale décrite) peut fixer sa propre récupération de fury.
    const f = skill.fury;
    const restore = () => {
      if (f.self) changeFury(u, u, f.self);
      if (f.allies) for (const a of units) if (a.alive && a.team === u.team && a !== u) changeFury(u, a, f.allies);
    };
    if (useSpecial) {
      u.fury -= rules.specialCost;
      if (f) {
        restore();
        L('info', `Fury : ${who(u)} dépense ${rules.specialCost}${f.self ? `, récupère ${f.self}` : ''}${f.allies ? `, alliés +${f.allies}` : ''}.`, { actor: u.uid });
      } else {
        for (const a of units) if (a.alive && a.team === u.team) changeFury(u, a, rules.specialTeamFury);
        L('info', `Fury : ${who(u)} dépense ${rules.specialCost}, toute la formation gagne ${rules.specialTeamFury}.`, { actor: u.uid });
      }
    } else {
      if (f) restore(); else changeFury(u, u, rules.normalFury);
    }
    // déclencheurs « après avoir attaqué » (et « après une compétence spéciale »)
    if (u.alive) for (const tr of u.triggers) {
      if (!(tr.on === 'acted' || (tr.on === 'skill' && useSpecial)) || (tr.chance != null && tr.chance < 100 && !roll(tr.chance / 100))) continue;
      runEffects(u, tr.effects, { attacker: u, lost: ctx.lost, hit: ctx.hit });
    }
    // déclencheurs « après avoir été attaqué »
    for (const t of struck) {
      if (!t.alive) continue;
      for (const tr of t.triggers) {
        if (tr.on !== 'attacked') continue;
        if (tr.cond === 'hpHigher' && !(t.hp > u.hp)) continue;
        if (tr.cond === 'hpLower' && !(t.hp < u.hp)) continue;
        if (tr.requires && !t.effects.some((e) => e.name === tr.requires)) continue;
        if (tr.chance != null && tr.chance < 100 && !roll(tr.chance / 100)) continue;
        runEffects(t, tr.effects, { attacker: u, lost: ctx.lost, hit: [] });
      }
    }
  }

  function aidPartner(u) {
    if (u.row === 'V') return null;
    const line = units.filter((x) => x.alive && x.team === u.team && x.row === u.row && x !== u).sort((a, b) => a.pos - b.pos);
    if (!line.length) return null;
    return line.find((x) => x.pos > u.pos) || line[0]; // proche → milieu → loin → proche
  }

  // Tour Bonus : le voisin de ligne agit aussitôt (proche → milieu → loin → proche), sans tenir compte de la vitesse.
  function maybePunch(u) {
    if (!u.alive) return;
    const chance = punchChance(u);
    if (chance <= 0 || !roll(chance / 100)) return;
    const p = aidPartner(u);
    if (!p || p.effects.some((e) => e.flags?.cc === 'hard')) return;
    L('extra', `⚡ Tour Bonus (${fmt(chance)} %) : ${who(u)} fait agir ${who(p)}.`, { actor: u.uid });
    act(p, 'punch');
    if (rules.punchChains && !over()) maybePunch(p);
  }

  const alive = (t) => units.some((u) => u.team === t && u.alive);
  const over = () => !alive(0) || !alive(1);

  function startOfTurn(u) {
    if (hasFlag(u, 'deathSeed')) {
      u.effects = u.effects.filter((e) => !e.flags?.deathSeed);
      L('effect', `Death Seed se déclenche sur ${who(u)}.`, { target: u.uid });
      kill(u, null, 'Death Seed');
      return;
    }
    for (const e of [...u.effects]) {
      if (!u.alive) return;
      if (e.flags?.hot && e.source?.alive) heal(e.source, u, e.flags.hot);
      if (e.flags?.poisonWind) {
        const d = u.hp * (e.value ?? 30) / 100;
        damage(u, d, null, 'Poisonous Wind', { type: 'dot', extra: { target: u.uid, amount: d },
          text: () => `Poisonous Wind : ${who(u)} perd ${fmt(d)} PV → ${hpTxt(u)}.` });
      }
      if (e.dot) {
        if (dodgeKind(e.source, u)) continue;
        const dEff = defEff(null, u, e.dot.attType, rules);
        const raw = F.dotDamage({ atkEff: e.dot.atk, dotPct: e.dot.pct, defEff: dEff, bloodlinePct: e.dot.bypassBloodline ? 0 : stat(u, 'bloodline') });
        const d = e.dot.bypassBloodline ? raw : Math.max(0, raw - shieldAmount(e.source, u));
        damage(u, d, e.source, e.name, { type: 'dot', extra: { target: u.uid, amount: d },
          text: () => `${e.name} : ${who(u)} subit ${fmt(d)} dégâts → ${hpTxt(u)}.` });
      }
    }
  }

  function endOfTurn(u) {
    for (const e of u.effects) {
      if (!Number.isFinite(e.remaining)) continue;
      if (e.fresh) { e.fresh = false; continue; }
      e.remaining -= 1;
    }
    const expired = u.effects.filter((e) => e.remaining <= 0);
    u.effects = u.effects.filter((e) => e.remaining > 0);
    if (expired.length) L('expire', `Fin d'effet sur ${who(u)} : ${expired.map((e) => e.name).join(', ')}.`, { target: u.uid });
  }

  function turn(u) {
    current = u;
    L('turn', `— Tour de ${who(u)} (vitesse ${fmt(currentSpeed(u))}, ${hpTxt(u)}, fury ${fmt(u.fury)})`, { actor: u.uid });
    startOfTurn(u);
    if (u.alive && !over()) {
      const hard = u.effects.find((e) => e.flags?.cc === 'hard');
      if (hard) {
        L('info', `${who(u)} est sous ${hard.name} et ne peut pas agir.`, { actor: u.uid });
        if (u.effects.some((e) => e.flags?.chaos)) {
          L('action', `${who(u)} est sous Chaos et s'attaque lui-même.`, { actor: u.uid });
          strike(u, u, 100, 1, 'Chaos', u.attackType, { hit: [], lost: new Map() });
        }
      } else {
        act(u, 'main');
        if (!over()) maybePunch(u);
      }
    }
    if (u.alive) endOfTurn(u);
    current = null;
  }

  L('start', `Début du combat : ${teamNames[0]} contre ${teamNames[1]}.`);
  while (!over() && round < rules.maxRounds) {
    round++;
    L('round', `Round ${round}`);
    const acted = new Set();
    while (!over()) {
      const ready = units.filter((u) => u.alive && !acted.has(u));
      if (!ready.length) break;
      let best = null, bestSpd = -1;
      for (const u of ready) {
        const s = currentSpeed(u);
        if (s > bestSpd || (s === bestSpd && rng() < 0.5)) { best = u; bestSpd = s; }
      }
      acted.add(best);
      turn(best);
    }
  }
  let winner = !alive(1) && alive(0) ? 0 : !alive(0) && alive(1) ? 1 : null;
  const hpLeft = [0, 1].map((t) => units.filter((u) => u.team === t && u.alive).reduce((a, u) => a + u.hp, 0));
  const timeout = winner == null && alive(0) && alive(1);
  if (timeout) {
    L('info', `Limite de ${rules.maxRounds} rounds atteinte. PV restants : ${teamNames[0]} ${fmt(hpLeft[0])}, ${teamNames[1]} ${fmt(hpLeft[1])}.`);
    if (hpLeft[0] !== hpLeft[1]) winner = hpLeft[0] > hpLeft[1] ? 0 : 1;
  }
  L('end', winner == null ? `Fin du combat après ${round} round(s) : égalité.`
    : `🏆 ${teamNames[winner]} remporte le combat en ${round} round(s)${timeout ? ' aux PV restants' : ''} !`);
  return {
    winner,
    timeout,
    hpLeft,
    rounds: round,
    log,
    units: units.map((u) => ({ uid: u.uid, team: u.team, name: u.name, role: u.role, hp: u.hp, maxHp: u.maxHp, alive: u.alive, fury: u.fury })),
  };
}

export function simulateMany(teamA, teamB, n = 1000, opts = {}) {
  const res = { n, wins: [0, 0], draws: 0, timeouts: 0, rounds: 0 };
  const base = opts.seed ?? 1;
  for (let i = 0; i < n; i++) {
    const r = simulate(teamA, teamB, { ...opts, seed: base + i, log: false });
    if (r.winner == null) res.draws++; else res.wins[r.winner]++;
    if (r.timeout) res.timeouts++;
    res.rounds += r.rounds;
  }
  res.avgRounds = res.rounds / n;
  return res;
}
