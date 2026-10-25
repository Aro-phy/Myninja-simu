// Traduit la fiche d'un ninja (données du simulateur) en français lisible, pour vérifier la transcription.
import { STATUSES } from './statuses.js';
import { ROLE_LABEL, NATURES, PANEL_STATS } from './engine.js';

const STAT = {
  atk: 'attaque', patk: 'attaque physique', matk: 'attaque stratégique', def: 'défenses', pdef: 'déf. physique', mdef: 'déf. stratégique',
  hp: 'PV', dr: 'Dégâts', air: 'Absorption', finalDmg: 'dégâts finaux', finalReduction: 'réduction des dégâts finaux',
  decreaseReduction: 'baisse de la réduction adverse', dmgTaken: 'dégâts totaux reçus', critDmg: 'dégâts critiques',
  critDmgTaken: 'dégâts critiques reçus', hit: 'précision', dodge: 'esquive', crit: 'critique', antiCrit: 'contre', block: 'blocage',
  sAtk: 'attaque S', sBlock: 's.block', sCrit: 's.crit', punch: 'punch', aid: 'aide', extraTurn: 'tour bonus', speed: 'vitesse',
  ccRate: 'taux de contrôle', ccRes: 'résistance au contrôle', reflectRes: 'résistance au renvoi', ignoreDef: 'ignore défense',
  immuneIgnoreDef: 'résistance à l\'ignore défense', ignoreEnemyAtk: 'ignore attaque ennemie', recovery: 'taux de soin reçu',
  recoveryCut: 'baisse du taux de soin', healCut: 'réduction de soin', penBonus: 'dégâts de pénétration', penMalus: 'résistance à la pénétration',
  pdefShield: 'bouclier de défense physique', mdefShield: 'bouclier de défense stratégique', dotBonus: 'dégâts des DoT',
  shieldPierce: 'résistance aux boucliers de défense', weakenAtk: 'Weaken enemy\'s ATK', weakenDef: 'Weaken enemy\'s DEF', sCritRes: 'résistance au s.crit', sBlockRes: 'résistance au s.block', defCutRes: 'résistance à la réduction de défense',
};
const IMMUNE_EXTRA = { furyReduction: 'réduction de fury', superDodge: 'Super Dodge (l\'ignore)', sSuperDodge: 'S-Super Dodge (l\'ignore)' };
const PICK = {
  'lowest-hp': 'le moins de PV', 'highest-hp': 'le plus de PV', 'lowest-hp-pct': 'le plus faible % de PV', 'highest-atk': 'la plus forte attaque',
  'highest-speed': 'le plus rapide', 'lowest-speed': 'le plus lent', 'lowest-ccres': 'la plus faible résistance au contrôle',
  'lowest-ccrate': 'le plus faible taux de contrôle', 'highest-dr': 'le plus de Dégâts', 'highest-air': 'la plus forte Absorption', 'lowest-air': 'la plus faible Absorption', 'highest-ccres': 'la plus forte résistance au contrôle',
};
// « de les alliés » → « des alliés », « de le » → « du »
const de = (s) => (s.startsWith('les ') ? `des ${s.slice(4)}` : s.startsWith('tous ') || s.startsWith('2 ') ? `de ${s}` : s.startsWith('le ') ? `du ${s.slice(3)}` : `de ${s}`);
const list = (v) => (Array.isArray(v) ? v : [v]);
const join = (arr) => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} et ${arr[arr.length - 1]}`);

export function target(t) {
  if (t === undefined || t === 'target') return 'les cibles touchées';
  if (t === 'self') return 'lui-même';
  if (t === 'attacker') return 'l\'attaquant';
  if (t === 'allies') return 'tous les alliés';
  if (t === 'enemies') return 'tous les ennemis';
  if (t === 'front-row') return 'la première ligne ennemie';
  const side = t.side === 'ally' ? 'allié' : 'ennemi';
  let s;
  if (t.pick === 'random') s = `${t.count || 1} ${side}${(t.count || 1) > 1 ? 's' : ''} au hasard`;
  else if (PICK[t.pick]) s = `l'${side} avec ${PICK[t.pick]}`;
  else if (t.pick === 'front-row') s = `la première ligne ${side === 'allié' ? 'alliée' : 'ennemie'}`;
  else s = t.role || t.nature || t.tag ? `les ${side}s` : `tous les ${side}s`;
  if (t.role) s += ` ${join(list(t.role).map((r) => ROLE_LABEL[r].toLowerCase() + 's'))}`;
  if (t.nature) s += ` de chakra ${join(list(t.nature).map((n) => NATURES[n].toLowerCase()))}`;
  if (t.tag) s += ` [${t.tag}]`;
  if (t.excludeSelf) s += ' (sauf lui-même)';
  if (t.gender) s += t.gender === 'male' ? ' masculins' : ' féminins';
  if (t.name) s += ` « ${list(t.name).join(' », « ')} »`;
  if (t.main) s = 'le personnage principal';
  if (Array.isArray(t.count)) s = s.replace(/^\S+ /, `${t.count[0]} à ${t.count[1]} `);
  return s;
}

const statName = (k) => STAT[k] || (k.startsWith('dotBonus:') ? `dégâts de ${k.slice(9)}` : k);
const mods = (ms) => ms.map((x) => `${statName(x.stat)} ${x.value > 0 ? '+' : ''}${x.value} %${x.kind === 'icon' ? '' : ''}`).join(', ');

export function effect(e) {
  const ch = e.chance != null && e.chance < 100 ? `${e.chance} % de chance : ` : '';
  const to = target(e.to);
  const dur = e.duration === Infinity ? ' (permanent)' : e.duration ? ` pendant ${e.duration} tour${e.duration > 1 ? 's' : ''}` : '';
  if (e.oneOf && e.oneOf.length === 1) return `${ch}${e.oneOf[0].map(effect).join(' + ')}`;
  if (e.oneOf) return `${ch}un seul au hasard${e.weights ? ` (${e.weights.join(' / ')} %)` : ''} : ${e.oneOf.map((g) => g.map(effect).join(' + ')).join(' OU ')}`;
  if (e.strike) return `${ch}inflige ${e.strike} % de dégâts${e.attackType === 'physical' ? ' physiques' : e.attackType === 'magic' ? ' stratégiques' : ''} à ${to}`;
  if (e.hot) return `${ch}soin continu (taux ${e.hot} %) sur ${to}${dur}`;
  if (e.heal) return `${ch}soigne ${to} (taux ${e.heal} %)`;
  if (e.penetration) return `${ch}pénétration ${e.attackType === 'magic' ? 'stratégique ' : e.attackType === 'physical' ? 'physique ' : ''}${e.penetration} % sur ${to}`;
  if (e.dot) return `${ch}${e.dot.name} (taux ${e.dot.pct} %) sur ${to} pendant ${e.dot.duration} tour(s)`;
  if (e.fury) return `${ch}${e.fury > 0 ? '+' : ''}${e.fury} fury pour ${to}`;
  if (e.cleanse) return `${ch}dissipe les ${e.cleanse === 'buff' ? 'buffs' : e.cleanse === 'debuff' ? 'debuffs' : 'effets'} ${de(to)}`;
  if (e.hpLossPct) return `${ch}${to} perd ${e.hpLossPct} % de ses PV actuels`;
  if (e.reflect) return `${ch}renvoie ${e.reflect} % des PV perdus à ${to}`;
  if (e.revive) return `ressuscite avec ${e.revive} % PV`;
  if (e.status) {
    const s = STATUSES[e.status];
    return `${ch}${to} : ${s ? s.name : e.status}${e.value != null ? ` (${e.value} %)` : ''}${dur}`;
  }
  if (e.mods) return `${ch}${to} : ${mods(e.mods)}${dur}`;
  return JSON.stringify(e);
}

export function talent(p) {
  const cond = p.cond === 'hpHigher' ? ', si ses PV sont supérieurs à ceux de l\'attaquant' : p.cond === 'hpLower' ? ', si ses PV sont inférieurs à ceux de l\'attaquant' : p.requires ? `, sous « ${p.requires} »` : '';
  if (p.on === 'attacked') return `Après avoir été attaqué${p.chance != null && p.chance < 100 ? ` (${p.chance} %)` : ''}${cond} : ${p.effects.map(effect).join(' ; ')}`;
  if (p.on === 'skill') return `Après avoir lancé sa spéciale : ${p.effects.map(effect).join(' ; ')}`;
  if (p.on === 'acted') return `Après avoir attaqué${p.chance != null && p.chance < 100 ? ` (${p.chance} %)` : ''} : ${p.effects.map(effect).join(' ; ')}`;
  if (p.on === 'death') return `À sa mort${p.effects.some((e) => e.revive) ? ' (1 fois)' : ''}${p.chance != null && p.chance < 100 ? ` (${p.chance} %)` : ''} : ${p.effects.map(effect).join(' ; ')}`;
  const parts = [];
  if (p.mods?.length) {
    const selfFixed = (p.to || 'self') === 'self' && !p.scale;
    const inPanel = selfFixed ? p.mods.filter((x) => PANEL_STATS.has(x.stat)) : [];
    const applied = p.mods.filter((x) => !inPanel.includes(x));
    if (applied.length) parts.push(`${target(p.to || 'self')} : ${mods(applied)}${p.scale ? ` par tranche de ${p.scale} % de PV perdus` : ''}${p.hpBelow ? ` (tant que ses PV sont sous ${p.hpBelow} %)` : ''}`);
    if (inPanel.length) parts.push(`lui-même : ${mods(inPanel)} (déjà compté dans les stats saisies)`);
  }
  if (p.immune?.length) parts.push(`Immunisé : ${p.immune.map((i) => IMMUNE_EXTRA[i] || STATUSES[i]?.name || i).join(', ')}`);
  return parts.join(' · ');
}

export function skill(sk) {
  if (!sk) return [];
  const out = [];
  if (sk.pre?.length) out.push(`Au lancement : ${sk.pre.map(effect).join(' ; ')}`);
  const hits = sk.noDamage ? [] : sk.hits || [{ target: sk.target || 'front-row', pct: sk.skillPct ?? 100 }];
  for (const h of hits) {
    const type = h.attackType === 'magic' ? ' (attaque stratégique)' : h.attackType === 'physical' ? ' (attaque physique)' : '';
    let pct = `${h.pct} %`;
    if (h.pctByRole) pct = Object.entries(h.pctByRole).map(([r, v]) => `${ROLE_LABEL[r].toLowerCase()} ${v} %`).join(' / ');
    if (h.pctByNature) pct = Object.entries(h.pctByNature).map(([n, v]) => `${NATURES[n].toLowerCase()} ${v} %`).join(' / ');
    out.push(`Attaque ${target(h.target)} : ${pct}${type}`);
  }
  for (const e of sk.effects || []) out.push(effect(e));
  if (sk.fury) out.push(`Fury : ${sk.fury.self ? `+${sk.fury.self} pour lui` : ''}${sk.fury.self && sk.fury.allies ? ', ' : ''}${sk.fury.allies ? `+${sk.fury.allies} pour les alliés` : ''}`);
  return out;
}
