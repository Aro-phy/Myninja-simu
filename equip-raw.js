// Stats brutes apportées par l'équipement (modèle de test : Force, Chakra, Agilité des paliers, paires et
// accessoires, et stats finales des 6 pièces). Sans dépendance à Node : utilisable dans le navigateur.
// Conversions : Force → attaque physique ×2 et défense physique ×1, Chakra → attaque magique ×2 et défense magique ×1,
// Agilité → vitesse ×2, Endurance → PV ×5.
import { GEAR_PIECE, GEAR_TIER, ACC_PIECE, ACC_PAIR, ACC_FULL } from './tools/meta/raw-equipment.mjs';

export const HP_SCALE_DEFAULT = 4.7;

// Stats de l'équipement : brutes (Force, Chakra, Agilité) des paliers, paires et accessoires,
// et finales (attaque, défenses, vitesse) des 6 pièces d'équipement.
export function equipRaw(eq) {
  const raw = { force: 0, chakra: 0, agility: 0, endurance: 0, atk: 0, pdef: 0, mdef: 0, speed: 0 };
  const add = (o) => { for (const [k, v] of Object.entries(o || {})) raw[k] += v; };
  if (eq?.gear) {
    // gear : un set pour les 6 pièces, ou 6 sets dans l'ordre des cases
    // (Attaque physique, Défense physique, Attaque stratégique, Défense stratégique, Vitesse, Puissance)
    const slots = Array.isArray(eq.gear) ? eq.gear : Array(6).fill(eq.gear);
    const count = {};
    for (const id of slots) if (id) count[id] = (count[id] || 0) + 1;
    for (const [id, c] of Object.entries(count)) for (const t of [2, 4, 6]) if (c >= t) add(GEAR_TIER[id]?.[t]);
    const piece = (i) => {
      const p = GEAR_PIECE[slots[i]];
      if (p == null) return { atk: 0, pdef: 0, mdef: 0 };
      return typeof p === 'number' ? { atk: p, pdef: p, mdef: p } : { atk: p.atk, pdef: p.pdef ?? p.def ?? p.atk, mdef: p.mdef ?? p.def ?? p.atk };
    };
    raw.patkPiece = piece(0).atk; raw.matkPiece = piece(2).atk;
    add({ pdef: piece(1).pdef, mdef: piece(3).mdef, speed: piece(4).atk });
  }
  const acc = Array.isArray(eq?.acc) ? eq.acc : eq?.acc ? Array(4).fill(eq.acc) : [];
  ['force', 'chakra', 'agility', 'power'].forEach((pair, i) => {
    const id = acc[i];
    if (!id) return;
    add(ACC_PAIR[id]?.[pair]);
    const p = ACC_PIECE[id];
    if (p != null && pair !== 'power') raw[pair] += 2 * (typeof p === 'number' ? p : p[pair]); // 2 pièces par paire
  });
  if (acc.length === 4 && acc.every((x) => x && x === acc[0])) add(ACC_FULL[acc[0]]);
  return raw;
}


// Emplacements de la fiche ({ gear: [6], acc: [8] }) → format du modèle ({ gear: [6], acc: [4 paires] }).
export function slotsToEq(slots) {
  if (!slots) return null;
  const a = slots.acc || [];
  return { gear: (slots.gear || []).slice(0, 6), acc: [0, 2, 4, 6].map((i) => (a[i] && a[i] === a[i + 1] ? a[i] : null)) };
}

// Stats finales apportées par un équipement (emplacements de la fiche) selon le modèle.
export function equipStats(slots, magic, hpScale = HP_SCALE_DEFAULT) {
  const e = equipRaw(slotsToEq(slots));
  return {
    atk: 2 * (magic ? e.chakra : e.force) + (magic ? e.matkPiece || 0 : e.patkPiece || 0),
    pdef: e.force + e.pdef, mdef: e.chakra + e.mdef,
    speed: 2 * e.agility + e.speed,
    hp: hpScale * 5 * e.endurance,
  };
}

// Écart de stats quand on passe de l'équipement « from » à « to » (emplacements de la fiche).
export function equipDelta(from, to, magic) {
  const a = equipStats(from, magic), b = equipStats(to, magic);
  return Object.fromEntries(Object.keys(a).map((k) => [k, b[k] - a[k]]));
}
