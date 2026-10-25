// Moteur de combat Myninja : tour par tour, ordre par vitesse, formation 1-3-3.
import * as F from './formulas.js';
import { STATUSES } from './statuses.js';

// Règles dont on n'est pas sûr à 100 % : regroupées ici pour pouvoir les ajuster.
export const DEFAULT_RULES = {
  normalFury: 50,          // fury gagnée par une attaque normale
  specialCost: 100,        // fury nécessaire / dépensée pour la spéciale
  specialTeamFury: 33,     // fury rendue à toute la formation après une spéciale
  blockReduction: 33,      // % de dégâts retirés par un blocage
  critFirst: true,         // critique testé avant le blocage (les deux ne peuvent pas arriver ensemble)
  aidDamagePct: 10,        // dégâts d'une action d'aide (punch) en % d'une attaque normale (Excel : Aid dmg = DMG/10)
  aidGivesFury: true,      // l'action d'aide donne-t-elle de la fury ?
  aidChains: false,        // un ninja qui vient d'aider peut-il à son tour donner un punch ?
  maxRounds: 20,           // limite de rounds ; au-delà : la formation avec le plus de PV restants gagne
  defenseMode: 'corrected',// 'excel' = reproduit le bug de la cellule DEF de l'Excel
};

export const ROWS = { vanguard: 'V', assaulter: 'A', supporter: 'S' };
const ROW_ORDER = ['V', 'A', 'S'];
export const ROLE_LABEL = { vanguard: 'Avant-garde', assaulter: 'Attaquant', supporter: 'Support' };

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
const fmt = (n) => nf.format(Math.round(n));
const fmtPct = (n) => `${(Math.round(n * 10) / 10).toLocaleString('fr-FR')} %`;

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

// ---------- Création des unités ----------

function makeUnit(member, team, index) {
  const n = member.ninja;
  const st = { ...member.stats };
  const row = ROWS[n.role];
  return {
    uid: `${team}-${index}`,
    team,
    ninja: n,
    name: member.label || n.name,
    role: n.role,
    attackType: member.attackType || n.attackType || (n.role === 'supporter' ? 'magic' : 'physical'),
    row,
    pos: member.pos ?? 0,
    stats: st,
    maxHp: st.hp,
    hp: st.hp,
    fury: st.fury ?? 100,
    alive: true,
    effects: [],
    passives: [],      // modificateurs permanents (talents, équipements) : { stat, value, kind, source }
    procs: [],         // effets d'équipement déclenchés à chaque attaque
    equipment: member.equipment || [],
  };
}

// ---------- Lecture des modificateurs ----------

function allMods(u, stat) {
  const out = [];
  for (const p of u.passives) if (p.stat === stat) out.push({ value: p.value, kind: p.kind || 'talent' });
  for (const e of u.effects) for (const m of e.mods || []) if (m.stat === stat) out.push({ value: m.value, kind: m.kind || 'icon' });
  return out;
}
const modSum = (u, stat) => allMods(u, stat).reduce((a, m) => a + m.value, 0);
const hasFlag = (u, flag) => u.effects.some((e) => e.flags && e.flags[flag]);
const stat = (u, s) => (u.stats[s] || 0) + modSum(u, s);

function atkParts(u) {
  const mods = allMods(u, 'atk');
  return {
    atk: u.attackType === 'magic' ? u.stats.matk || 0 : u.stats.patk || 0,
    talents: mods.filter((m) => m.kind === 'talent').map((m) => m.value),
    icons: mods.filter((m) => m.kind !== 'talent').reduce((a, m) => a + m.value, 0),
    negIcons: mods.filter((m) => m.kind !== 'talent' && m.value < 0).reduce((a, m) => a - m.value, 0),
  };
}

function defEff(att, tgt, rules) {
  const key = att.attackType === 'magic' ? 'mdef' : 'pdef';
  const mods = [...allMods(tgt, 'def'), ...allMods(tgt, key)];
  return F.effectiveDefense({
    def: tgt.stats[key] || 0,
    talents: mods.filter((m) => m.kind === 'talent').map((m) => m.value),
    icons: mods.filter((m) => m.kind !== 'talent').reduce((a, m) => a + m.value, 0),
    ignoreDef: modSum(att, 'ignoreDef'),
    immuneIgnoreDef: modSum(tgt, 'immuneIgnoreDef'),
    mode: rules.defenseMode,
  });
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

function resolve(sel, caster, units, rng) {
  if (typeof sel === 'string') sel = SHORTHANDS[sel] || { side: 'enemy', pick: sel };
  if (sel.side === 'self') return [caster];
  let pool = units.filter((u) => u.alive && (sel.side === 'ally' ? u.team === caster.team : u.team !== caster.team));
  if (sel.side === 'ally' && sel.excludeSelf) pool = pool.filter((u) => u !== caster);
  if (sel.role) pool = pool.filter((u) => u.role === sel.role);
  if (sel.tag) pool = pool.filter((u) => (u.ninja.tags || []).includes(sel.tag));
  const count = sel.count || 1;
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
    case 'random': {
      const p = [...pool], out = [];
      while (p.length && out.length < count) out.push(p.splice(Math.floor(rng() * p.length), 1)[0]);
      return out;
    }
    default: return pool;
  }
}

// ---------- Combat ----------

export function simulate(teamA, teamB, opts = {}) {
  const rules = { ...DEFAULT_RULES, ...(opts.rules || {}) };
  const rng = mulberry32(opts.seed ?? Math.floor(Math.random() * 2 ** 31));
  const logOn = opts.log !== false;
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

  // --- application des talents et équipements ---
  function applyPassive(owner, p, source) {
    const targets = resolve(p.to || 'self', owner, units, rng);
    for (const t of targets) {
      for (const m of p.mods || []) t.passives.push({ ...m, kind: m.kind || 'talent', source });
      if (p.status) addStatus(owner, t, { status: p.status, value: p.value, duration: Infinity }, source, true);
    }
  }
  for (const u of units) {
    for (const p of u.ninja.talents || []) applyPassive(u, p, `talent ${u.ninja.name}`);
    for (const eq of u.equipment) {
      for (const p of eq.passives || []) applyPassive(u, p, eq.name);
      for (const pr of eq.procs || []) u.procs.push({ ...pr, source: eq.name });
    }
  }

  // --- états ---
  function addStatus(src, tgt, eff, source, silent = false) {
    const def = STATUSES[eff.status] || STATUSES.customBuff;
    const type = eff.type || def.type;
    if (!tgt.alive) return false;
    if (type === 'buff' && hasFlag(tgt, 'noBuffs')) { if (!silent) L('info', `${who(tgt)} ne peut pas recevoir de buff (${def.name} bloqué).`); return false; }
    if ((type === 'debuff' || type === 'dot') && hasFlag(tgt, 'debuffImmune')) { if (!silent) L('info', `${who(tgt)} est immunisé aux debuffs.`); return false; }
    if (type === 'cc' && hasFlag(tgt, 'ccImmune')) { if (!silent) L('info', `${who(tgt)} est immunisé aux CC.`); return false; }
    const value = eff.value ?? def.value;
    const name = eff.name || def.name;
    const e = {
      id: eff.status || name,
      name,
      type,
      cleansable: eff.cleansable ?? def.cleansable,
      flags: { ...(def.flags || {}), ...(eff.flags || {}) },
      mods: eff.mods ? eff.mods.map((m) => ({ kind: 'icon', ...m })) : def.mods ? def.mods(value) : [],
      value,
      remaining: eff.duration ?? 1,
      fresh: current === tgt, // posé pendant le tour de son porteur : ne décompte pas ce tour-ci
      dot: eff.dot,
      source: src,
    };
    tgt.effects = tgt.effects.filter((x) => !(x.id === e.id && x.source === src));
    tgt.effects.push(e);
    if (!silent) L('effect', `${who(tgt)} reçoit ${name}${value != null && !e.dot ? ` (${value} %)` : ''}${Number.isFinite(e.remaining) ? ` pour ${e.remaining} tour(s)` : ''}.`);
    return true;
  }

  // msg : texte du coup, journalisé avant l'éventuel K.O.
  function damage(tgt, amount, src, kind, msg) {
    tgt.hp -= amount;
    if (msg) L(msg.type, msg.text(), msg.extra);
    if (tgt.hp <= 0 && tgt.alive) {
      tgt.hp = 0;
      tgt.alive = false;
      L('death', `💀 ${who(tgt)} est mis K.O.${src ? ` par ${who(src)}` : ''} (${kind}).`, { target: tgt.uid });
    }
  }

  function heal(src, tgt, pctHeal) {
    if (!tgt.alive) return;
    if (hasFlag(tgt, 'noHeal')) { L('info', `${who(tgt)} ne peut pas être soigné (Untreatment).`); return; }
    const a = atkParts(src);
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
    const real = Math.min(amount, tgt.maxHp - tgt.hp);
    tgt.hp += real;
    L('heal', `${who(src)} soigne ${who(tgt)} de ${fmt(real)} → ${hpTxt(tgt)}.`, { amount: real });
  }

  // Un coup direct d'une compétence sur une cible. Renvoie true si l'attaque a touché.
  function strike(att, tgt, skillPct, mult, label) {
    if (hasFlag(tgt, 'superDodge')) { L('miss', `${who(tgt)} esquive totalement (Super Dodge).`); return false; }
    if (!roll(F.chance(stat(att, 'hit'), stat(tgt, 'dodge')))) { L('miss', `${who(att)} rate ${who(tgt)} (esquive).`); return false; }
    const a = atkParts(att);
    const atkEff = F.effectiveAttack({ atk: a.atk, talents: a.talents, icons: a.icons - modSum(tgt, 'ignoreEnemyAtk') });
    const dEff = defEff(att, tgt, rules);
    const drEff = F.effectiveRate(att.stats.dr || 0, [modSum(att, 'dr')]);
    const airEff = F.effectiveRate(tgt.stats.air || 0, [modSum(tgt, 'air')]);
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
    }) * mult;
    const pCrit = F.chance(stat(att, 'crit'), stat(tgt, 'antiCrit'));
    const pBlock = F.chance(stat(tgt, 'block'), stat(att, 'sAtk'));
    let crit = false, block = false;
    if (rules.critFirst) { crit = roll(pCrit); if (!crit) block = roll(pBlock); }
    else { block = roll(pBlock); if (!block) crit = roll(pCrit); }
    let dmg = base;
    if (crit) dmg *= F.critMultiplier(modSum(att, 'critDmg'), modSum(tgt, 'critDmgTaken'));
    if (block) dmg *= 1 - rules.blockReduction / 100;
    if (hasFlag(tgt, 'ignoreDirect')) { L('hit', `${who(tgt)} ignore les dégâts directs (Shielding).`); return true; }
    damage(tgt, dmg, att, label, { type: 'hit', extra: { attacker: att.uid, target: tgt.uid, amount: dmg, crit, block },
      text: () => `${who(att)} → ${who(tgt)} : ${fmt(dmg)} dégâts${crit ? ' (CRITIQUE)' : ''}${block ? ' (BLOQUÉ)' : ''} → ${hpTxt(tgt)}.` });
    return true;
  }

  function runEffect(att, eff, hitTargets) {
    const targets = eff.to === 'target' || eff.to === undefined ? hitTargets : resolve(eff.to, att, units, rng);
    for (const t of targets) {
      if (!t.alive) continue;
      if (eff.chance != null && eff.chance < 100 && !roll(eff.chance / 100)) continue;
      if (eff.heal) heal(att, t, eff.heal);
      else if (eff.penetration) {
        const a = atkParts(att);
        const d = F.penetrationDamage({
          atkEff: F.effectiveAttack({ atk: a.atk, talents: a.talents, icons: 0 }),
          penPct: eff.penetration, penBonus: modSum(att, 'penBonus'),
          penMalus: modSum(t, 'penMalus'), penMultiplier: modSum(t, 'penMultiplier'),
        });
        damage(t, d, att, 'pénétration', { type: 'hit', extra: { amount: d },
          text: () => `${who(att)} → ${who(t)} : ${fmt(d)} dégâts de pénétration → ${hpTxt(t)}.` });
      } else if (eff.dot) {
        const a = atkParts(att);
        const snap = F.effectiveAttack({ atk: a.atk, talents: a.talents, icons: a.icons });
        addStatus(att, t, { name: eff.dot.name || 'DoT', type: 'dot', duration: eff.dot.duration ?? 2,
          cleansable: !['Incinerate', 'Burn'].includes(eff.dot.name),
          dot: { pct: eff.dot.pct, atk: snap, attType: att.attackType, bypassBloodline: eff.dot.name === 'Sticky acid' } });
      } else if (eff.fury) {
        t.fury = Math.max(0, t.fury + eff.fury);
        L('effect', `${who(t)} ${eff.fury > 0 ? 'gagne' : 'perd'} ${Math.abs(eff.fury)} de fury (${fmt(t.fury)}).`);
      } else if (eff.cleanse) {
        const before = t.effects.length;
        t.effects = t.effects.filter((e) => !(e.cleansable && Number.isFinite(e.remaining) && (eff.cleanse === 'all' || e.type === eff.cleanse || (eff.cleanse === 'debuff' && e.type === 'dot'))));
        if (before !== t.effects.length) L('effect', `${who(t)} : ${before - t.effects.length} effet(s) dissipé(s).`);
      } else if (eff.status || eff.mods) {
        addStatus(att, t, eff);
      }
    }
  }

  // Une action : 'main' (tour normal ou tour bonus) ou 'aid' (punch).
  function act(u, mode) {
    const sealed = u.effects.some((e) => e.flags?.cc === 'seal');
    const useSpecial = mode !== 'aid' && u.ninja.special && u.fury >= rules.specialCost && !sealed;
    const skill = useSpecial ? u.ninja.special : (u.ninja.normal || {});
    const name = useSpecial ? `la compétence spéciale « ${skill.name || 'Spéciale'} »` : mode === 'aid' ? 'une attaque d\'aide (punch)' : 'une attaque normale';
    L('action', `${who(u)} utilise ${name} (fury ${fmt(u.fury)}).`, { actor: u.uid, special: useSpecial });
    if (sealed && u.fury >= rules.specialCost && u.ninja.special) L('info', `${who(u)} est sous Seal : spéciale impossible.`);
    const targets = resolve(skill.target || 'front-row', u, units, rng);
    const hit = [];
    if (!skill.noDamage) {
      const mult = mode === 'aid' ? rules.aidDamagePct / 100 : 1;
      for (const t of targets) if (t.alive && strike(u, t, skill.skillPct ?? 100, mult, useSpecial ? 'spéciale' : 'attaque')) hit.push(t);
    } else hit.push(...targets);
    for (const eff of skill.effects || []) runEffect(u, eff, hit);
    for (const pr of u.procs) if (!pr.on || pr.on === 'any' || (pr.on === 'special') === useSpecial) runEffect(u, pr, hit);
    // fury
    if (useSpecial) {
      u.fury -= rules.specialCost;
      for (const a of units) if (a.alive && a.team === u.team) a.fury += rules.specialTeamFury;
      L('info', `Fury : ${who(u)} dépense ${rules.specialCost}, toute la formation ${teamNames[u.team]} gagne ${rules.specialTeamFury}.`);
    } else if (mode !== 'aid' || rules.aidGivesFury) {
      u.fury += rules.normalFury;
    }
  }

  function aidPartner(u) {
    if (u.row === 'V') return null;
    const line = units.filter((x) => x.alive && x.team === u.team && x.row === u.row && x !== u).sort((a, b) => a.pos - b.pos);
    if (!line.length) return null;
    return line.find((x) => x.pos > u.pos) || line[0]; // proche → milieu → loin → proche
  }

  function maybeAid(u) {
    if (!u.alive || !roll(stat(u, 'aid') / 100)) return;
    const p = aidPartner(u);
    if (!p || p.effects.some((e) => e.flags?.cc === 'hard')) return;
    L('aid', `👊 Punch ! ${who(u)} déclenche l'aide de ${who(p)}.`);
    act(p, 'aid');
    if (rules.aidChains && !over()) maybeAid(p);
  }

  const alive = (t) => units.some((u) => u.team === t && u.alive);
  const over = () => !alive(0) || !alive(1);

  function startOfTurn(u) {
    if (hasFlag(u, 'deathSeed') && !hasFlag(u, 'deathSeedImmune')) {
      L('effect', `Death Seed se déclenche sur ${who(u)}.`);
      damage(u, u.hp, null, 'Death Seed');
      return;
    }
    for (const e of u.effects) {
      if (!u.alive) return;
      if (e.flags?.poisonWind) {
        const d = u.hp * (e.value ?? 30) / 100;
        damage(u, d, null, 'Poisonous Wind', { type: 'dot', extra: { amount: d },
          text: () => `Poisonous Wind : ${who(u)} perd ${fmt(d)} PV → ${hpTxt(u)}.` });
      }
      if (e.dot) {
        if (hasFlag(u, 'superDodge')) continue;
        const dEff = defEff({ attackType: e.dot.attType, passives: [], effects: [] }, u, rules);
        const d = F.dotDamage({ atkEff: e.dot.atk, dotPct: e.dot.pct, defEff: dEff, bloodlinePct: e.dot.bypassBloodline ? 0 : stat(u, 'bloodline') });
        damage(u, d, e.source, e.name, { type: 'dot', extra: { amount: d },
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
    if (expired.length) L('expire', `Fin d'effet sur ${who(u)} : ${expired.map((e) => e.name).join(', ')}.`);
  }

  function turn(u) {
    current = u;
    L('turn', `— Tour de ${who(u)} (vitesse ${fmt(currentSpeed(u))}, ${hpTxt(u)}, fury ${fmt(u.fury)})`, { actor: u.uid });
    startOfTurn(u);
    if (u.alive && !over()) {
      const hard = u.effects.find((e) => e.flags?.cc === 'hard');
      if (hard) L('info', `${who(u)} est sous ${hard.name} et ne peut pas agir.`);
      else {
        act(u, 'main');
        if (!over()) maybeAid(u);
        if (!over() && u.alive && roll(stat(u, 'extraTurn') / 100)) {
          L('extra', `⚡ Tour bonus pour ${who(u)} !`);
          act(u, 'main');
          if (!over()) maybeAid(u);
        }
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
