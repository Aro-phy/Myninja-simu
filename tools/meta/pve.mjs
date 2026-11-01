// PvE : formations ennemies hypothétiques et évaluation d'une formation joueur contre elles.
// Un ennemi PvE reprend seulement la spéciale (avec ses buffs / debuffs) et les immunités d'un ninja existant tiré au
// hasard, à un poste tiré au hasard ; 5 ennemis, sans personnage principal. Ils sont immunisés au contrôle (pas aux
// autres debuffs), ont un fort taux de contrôle, beaucoup de PV, de l'Absorption, et jouent toujours en premier.
// Le joueur gagne seulement s'il tue les 5 ennemis avant la fin des 20 rounds.
// Réglages calibrés sur Lava X1 en jeu : morte en 2 à 3 rounds, Warrior Sakura à 0 dégât direct, supports ennemis qui enchaînent les Tour Bonus.
import { simulate, resolveKit } from '../../engine.js';
import { NINJAS } from '../../data.js';
import { toTeam, RULES } from './common.mjs';

export const PVE = {
  hpMult: Number(process.env.PVE_HP || 10),        // PV : × la base de test (450 000)
  ccRate: Number(process.env.PVE_CC || 200),       // taux de contrôle
  atk: Number(process.env.PVE_ATK || 6000000),      // attaque
  def: Number(process.env.PVE_DEF || 20000000),      // défenses physique et stratégique
  extraTurn: Number(process.env.PVE_PUNCH || 100),  // Tour Bonus
  dr: 250, air: 300,
};
const POOL = NINJAS.filter((n) => !n.isMain);
const ROLES = ['vanguard', 'assaulter', 'supporter'];

function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// Formation PvE n° k (déterministe : la même pour toutes les formations testées).
export function pveTeam(k) {
  const r = rng(1000 + k * 7919);
  const members = [];
  const used = new Set();
  for (let i = 0; i < 5; i++) {
    let n; do { n = POOL[Math.floor(r() * POOL.length)]; } while (used.has(n.id)); used.add(n.id);
    const kit = resolveKit(n);
    const role = ROLES[Math.floor(r() * 3)];
    const ninja = {
      id: `pve-${k}-${i}`, name: `Ennemi ${i + 1} (spéciale de ${n.name})`, role, gender: n.gender, tags: n.tags,
      talents: kit.talents.filter((p) => p.immune?.length).map((p) => ({ immune: p.immune })),
      special: kit.special, normal: kit.normal,
    };
    members.push({
      ninja, pos: members.filter((m) => m.ninja.role === role).length, nature: 'none',
      attackType: role === 'supporter' ? 'magic' : 'physical',
      stats: { hp: 450000 * PVE.hpMult, atk: PVE.atk, pdef: PVE.def, mdef: PVE.def, speed: 1e9, fury: 100, dr: PVE.dr, air: PVE.air,
        hit: 300, dodge: 50, crit: 80, antiCrit: 80, sAtk: 90, block: 70, extraTurn: PVE.extraTurn, aid: 45, ccRate: PVE.ccRate, ccRes: 1e9 },
    });
  }
  return { name: `PvE ${k}`, members };
}

// Résultat d'une formation joueur (génome) contre les formations PvE 0..K-1, n combats chacune.
// score = victoires + 0,3 × part moyenne des PV ennemis retirés (pour départager quand personne ne gagne).
export function pveScore(g, K, n, seed = 1) {
  let wins = 0, dmg = 0, games = 0;
  const me = toTeam(g, 'Joueur');
  for (let k = 0; k < K; k++) {
    const foe = pveTeam(k);
    for (let i = 0; i < n; i++) {
      const r = simulate(me, foe, { seed: seed + k * 1000 + i, log: false, rules: RULES });
      if (r.winner === 0 && !r.timeout) wins++;
      const foes = r.units.filter((u) => u.team === 1);
      dmg += foes.reduce((a, u) => a + (u.maxHp - Math.max(0, u.hp)), 0) / foes.reduce((a, u) => a + u.maxHp, 0);
      games++;
    }
  }
  return { win: wins / games, dmg: dmg / games, score: wins / games + 0.3 * dmg / games };
}
