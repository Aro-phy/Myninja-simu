// Stats de test d'un ninja, à partir de stats brutes (Force, Chakra, Agilité) selon son poste, son ancienneté et son type,
// plus les stats brutes de son équipement. Conversion : Force → attaque physique ×2 et défense physique ×1,
// Chakra → attaque magique ×2 et défense magique ×1, Agilité → vitesse ×2, Endurance → PV ×5.
import { NINJAS } from '../../data.js';
import { resolveKit } from '../../engine.js';
import { GEAR_PIECE, GEAR_TIER, ACC_PIECE, ACC_PAIR } from './raw-equipment.mjs';

const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));

// Ordre de sortie (du plus ancien au plus récent), donné par le joueur.
export const RELEASES = ['premier-hokage', 'boruto', 'neji-ying-yang', 'uzumaki-menma', 'cyber-naruto', 'pain-d-ete', 'kushina-d-ete',
  '9-tails-minato', 'han', 'kamado-nezuko', 'orochimaru-boruto', 'hashirama-madara', 'uchiha-hikari', 'otsutsuki-jigen', 'otsutsuki-isshiki',
  'warrior-sakura', 'indra-ashura', 'human-path-pain', 'hinata-the-last', 'reanimated-deidara', 'susanoo-itachi-sasuke', 'kashin-koji',
  'kusanagi-kyo', 'mitarashi-anko', 'uchiha-sarada', 'hayate-yugao', '7-tails-fuu', 'legende-madara', 'awaken-mitsuki', 'hiruko-sasori',
  'danzo-root-hokage', 'sai-knight', 'karin-guyver', 'eveil-de-kawaki', 'natsu-dragneel', 'xmas-temari', 'shikamaru-nara',
  'gai-porte-de-la-mort', 'madara-moon-eyes', 'kakashi-kamui', 'naruto-six-tails-mode', 'hinata-soccer', 'sakura-tsunade',
  'orochimaru-akatsuki', 'sasuke-taka', 'hidan-kakuzu'];

const BASE_RAW = {
  supporter: { force: 22000, chakra: 44000, agility: 44500, hp: 440000 }, // PV = Chakra × 10
  assaulter: { force: 46000, chakra: 22500, agility: 43500, hp: 430000 },
  vanguard: { force: 46000, chakra: 22500, agility: 43500, hp: 460000 },
};

// Ancienneté : tous les 6 ninjas du même poste (du plus récent au plus ancien), −500 Force/Chakra/Agilité et −5 000 PV.
// Les ninjas absents de la liste sont plus anciens que tous ceux de la liste : un palier de plus que le plus ancien.
export function ageStep(id) {
  const role = byId[id].role;
  const listed = RELEASES.filter((x) => byId[x]?.role === role).reverse(); // du plus récent au plus ancien
  const i = listed.indexOf(id);
  return i >= 0 ? Math.floor(i / 6) : Math.floor((listed.length - 1) / 6) + 1;
}

// Type d'après les bonus de groupe des talents (alliés ou ennemis, sans les effets déclenchés), plus les bonus de
// contrôle personnels du ninja (son propre taux ou sa propre résistance au contrôle) :
// DPS = (taux de contrôle des alliés + ou résistance au contrôle ennemie −) + (attaque ou ignore défense des alliés +)
//       + (Dégâts ou dégâts finaux des alliés +, ou Absorption ennemie −) ;
// tank = (taux de contrôle ennemi − ou résistance au contrôle des alliés +) + (défenses des alliés + ou attaque ennemie −)
//       + (Absorption des alliés + ou Dégâts ennemis −).
// Un ninja qui a les trois groupes de l'un seulement est DPS ou tank ; les trois groupes des deux : « DPS et tank »
// (il reçoit les deux bonus) ; sinon hybride.
export function ninjaType(id) {
  const n = byId[id];
  const f = { cc: false, atk: false, dmg: false, tcc: false, tdef: false, tair: false };
  for (const p of resolveKit(n).talents) {
    if (p.on || !p.mods) continue;
    // bonus de contrôle personnels (taux de contrôle, résistance au contrôle) : comptent aussi pour le critère contrôle
    if (!p.to || p.to === 'self') {
      for (const { stat, value } of p.mods) {
        if (stat === 'ccRate' && value > 0) f.cc = true;
        if (stat === 'ccRes' && value > 0) f.tcc = true;
      }
      continue;
    }
    const side = typeof p.to === 'object' ? p.to.side : null;
    for (const { stat, value } of p.mods) {
      if (side === 'ally' && value > 0) {
        if (stat === 'ccRate') f.cc = true;
        if (stat === 'ccRes') f.tcc = true;
        if (stat === 'atk' || stat === 'ignoreDef') f.atk = true;
        if (stat === 'dr' || stat === 'finalDmg') f.dmg = true;
        if (stat === 'def') f.tdef = true;
        if (stat === 'air') f.tair = true;
      }
      if (side === 'enemy' && value < 0) {
        if (stat === 'air') f.dmg = true;
        if (stat === 'ccRate') f.tcc = true;
        if (stat === 'ccRes') f.cc = true;
        if (stat === 'atk') f.tdef = true;
        if (stat === 'dr') f.tair = true;
      }
    }
  }
  const dps = f.cc && f.atk && f.dmg, tank = f.tcc && f.tdef && f.tair;
  return dps && tank ? 'DPS et tank' : dps ? 'DPS' : tank ? 'tank' : 'hybride';
}

// Stats de l'équipement : brutes (Force, Chakra, Agilité) des paliers, paires et accessoires,
// et finales (attaque, défenses, vitesse) des 6 pièces d'équipement.
function equipRaw(eq) {
  const raw = { force: 0, chakra: 0, agility: 0, endurance: 0, atk: 0, pdef: 0, mdef: 0, speed: 0 };
  const add = (o) => { for (const [k, v] of Object.entries(o || {})) raw[k] += v; };
  if (eq?.gear) {
    for (const t of [2, 4, 6]) add(GEAR_TIER[eq.gear]?.[t]);
    const p = GEAR_PIECE[eq.gear];
    if (p != null) {
      const v = typeof p === 'number' ? { atk: p, pdef: p, mdef: p } : { atk: p.atk, pdef: p.pdef ?? p.def ?? p.atk, mdef: p.mdef ?? p.def ?? p.atk };
      // une pièce d'attaque du type du ninja, les deux pièces de défense, la pièce de vitesse
      add({ atk: v.atk, pdef: v.pdef, mdef: v.mdef, speed: v.atk });
    }
  }
  const acc = Array.isArray(eq?.acc) ? eq.acc : eq?.acc ? Array(4).fill(eq.acc) : [];
  ['force', 'chakra', 'agility', 'power'].forEach((pair, i) => {
    const id = acc[i];
    if (!id) return;
    add(ACC_PAIR[id]?.[pair]);
    const p = ACC_PIECE[id];
    if (p != null && pair !== 'power') raw[pair] += 2 * (typeof p === 'number' ? p : p[pair]); // 2 pièces par paire
  });
  return raw;
}

// Stats de test d'un ninja (id, ou 'main' pour le personnage principal) avec son équipement.
export function testStats(id, eq, mainType = 'physical', common = {}) {
  const role = id === 'main' ? 'assaulter' : byId[id].role;
  const r = { ...BASE_RAW[role] };
  if (id !== 'main') {
    const step = ageStep(id);
    for (const k of ['force', 'chakra', 'agility']) r[k] -= 500 * step;
    r.hp -= 5000 * step;
    const type = ninjaType(id);
    if (type.includes('DPS')) r.agility += 1000;
    if (type.includes('tank')) r.hp += 10000;
  }
  const e = equipRaw(eq);
  const force = r.force + e.force, chakra = r.chakra + e.chakra, agility = r.agility + e.agility;
  const magic = role === 'supporter' || (id === 'main' && mainType === 'magic');
  return {
    ...common,
    hp: r.hp + 5 * e.endurance,
    atk: (magic ? 2 * chakra : 2 * force) + e.atk,
    pdef: force + e.pdef, mdef: chakra + e.mdef,
    speed: 2 * agility + e.speed,
  };
}
