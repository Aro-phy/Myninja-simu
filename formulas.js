// Formules de calcul reprises du fichier Excel "Damage_formula_En.xlsx" (onglets Dmg et Speed).
// Toutes les valeurs en pourcentage sont des nombres "comme dans le jeu" : 30 = 30 %.

const pct = (v) => (v || 0) / 100;
const sum = (arr) => (arr || []).reduce((a, b) => a + (b || 0), 0);
// Talents : multiplicatifs entre eux. Une valeur négative = malus (1 - x%).
const talentFactor = (arr) => (arr || []).reduce((acc, v) => acc * (1 + pct(v)), 1);

export function furyMultiplier(fury) {
  return fury < 100 ? 1 : 1 + 0.0025 * (fury - 100);
}

// Attaque effective (Excel Dmg!E6).
// talents : liste de % (positif = bonus, négatif = malus), chacun multiplicatif
// icons   : somme des icônes/états additifs (buff icône, Shatter storm, -debuff icône,
//           -ignore attaque ennemie (équipement / accessoire / propre), -Wind escape)
export function effectiveAttack({ atk, talents, icons }) {
  const v = atk * talentFactor(talents) * (1 + pct(icons));
  return v < 0 ? 0 : v;
}

// Défense effective (Excel Dmg!H6).
// ignoreDef : somme des ignore-défense de l'attaquant (équipement, accessoire, naturel, jinchuuriki, talent)
// immuneIgnoreDef : somme des immunités à l'ignore-défense de la cible
// mode 'excel' reproduit le comportement exact de la cellule (qui double la défense quand
// il n'y a pas d'ignore-défense) ; mode 'corrected' applique -max(0, ignore - immunité).
export function effectiveDefense({ def, talents, icons, ignoreDef = 0, immuneIgnoreDef = 0, ignoreDefCells, mode = 'corrected' }) {
  let ignorePart;
  if (mode === 'excel') {
    if (immuneIgnoreDef >= ignoreDef) {
      const cells = ignoreDefCells || [immuneIgnoreDef, ignoreDef];
      const allNonZero = cells.every((c) => c !== 0);
      ignorePart = allNonZero ? 0 : 1;
    } else {
      ignorePart = pct(immuneIgnoreDef) - pct(ignoreDef);
    }
  } else {
    ignorePart = -pct(Math.max(0, ignoreDef - immuneIgnoreDef));
  }
  return def * talentFactor(talents) * (1 + pct(icons) + ignorePart);
}

// Taux de dégâts (Dégâts / Dr) et Absorption (AIR) : additifs, plancher à 0 (Excel K6 / N6).
export function effectiveRate(base, bonuses) {
  const v = base + sum(bonuses);
  return v < 0 ? 0 : v;
}

// Bonus de dégâts finaux (Excel Q6) :
// bonus de l'attaquant - max(0, réduction de la cible - diminution de réduction (Corrosion...)).
export function finalDamageBonus({ bonus = 0, reduction = 0, decreaseReduction = 0 }) {
  const red = reduction > 0 ? Math.max(0, reduction - decreaseReduction) : 0;
  return bonus - red;
}

// Dégâts d'un coup (Excel Dmg!E1).
export function hitDamage({ atkEff, defEff, skillPct, drEff, airEff, fury, finalBonus }) {
  return (atkEff - defEff) * pct(skillPct) * pct(drEff - airEff) * furyMultiplier(fury) * (1 + pct(finalBonus));
}

// Multiplicateur de critique (Excel Dmg!H1).
export function critMultiplier(buffCrit = 0, debuffCrit = 0) {
  return 1.5 + pct(buffCrit - debuffCrit);
}

// Dégâts sur la durée (Excel Dmg!B16) : ATK (talents + icônes) x DoT% - DEF effective x Bloodline%.
export function dotDamage({ atkEff, dotPct, defEff = 0, bloodlinePct = 0 }) {
  const v = atkEff * pct(dotPct) - defEff * pct(bloodlinePct);
  return v < 0 ? 0 : v;
}

// Dégâts de pénétration (Excel Dmg!K28).
export function penetrationDamage({ atkEff, penPct, penBonus = 0, penMalus = 0, penMultiplier = 0 }) {
  const v = atkEff * (pct(penPct) + pct(penBonus) - pct(penMalus) * (1 + pct(penMultiplier)));
  return v < 0 ? 0 : v;
}

// Taux de soin reçu par la cible (Excel Dmg!H34 / H35). Avant-garde : +40 grâce à la formation.
export function recoveryRate({ bonuses, maluses, isVanguard, upwind = 0 }) {
  const v = sum(bonuses) + (isVanguard ? 40 : 0) - sum(maluses);
  return (v < 0 ? 0 : v) * (1 - pct(upwind));
}

// Soin (Excel Dmg!E34 / E35).
export function healAmount({ atkTalentOnly, atkDebuffIcon = 0, healerDr, targetRecoveryRate, healPct, fury, healDebuff = 0 }) {
  return atkTalentOnly * (1 - pct(atkDebuffIcon)) * pct(healerDr + targetRecoveryRate) * pct(healPct) *
    furyMultiplier(fury) * (1 - pct(healDebuff));
}

// Vitesse en combat (onglet Speed) :
// vitesse PvP x (1 + Σ talents vitesse alliés - Σ talents vitesse ennemis) x (1 + icône buff - icône debuff)
export function battleSpeed({ speed, talents, icons }) {
  return speed * (1 + pct(sum(talents))) * (1 + pct(icons));
}

// Chances opposées (attaquant contre cible), bornées entre 0 et 1.
export const chance = (a, b) => Math.min(1, Math.max(0, pct(a - b)));
