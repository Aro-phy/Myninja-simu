// Fichier d'échange d'une formation : JSON lisible (noms en français), relu tel quel à l'import.
import { NINJAS } from './data.js';
import { GEAR_SETS, ACCESSORY_SETS, GEAR_SLOTS, ACC_SLOTS, equipmentEntries, slotsToChoice, choiceToSlots } from './equipment.js';
import { NATURES, baseAttack } from './engine.js';

export const STAT_FIELDS = [
  ['hp', 'Vie'], ['atk', 'Attaque'], ['pdef', 'Def Physique'], ['mdef', 'Def Magique'],
  ['speed', 'Vitesse'], ['fury', 'Furie initiale'], ['dr', 'Dégâts %'], ['air', 'Absorption %'],
  ['hit', 'Précision %'], ['dodge', 'Esquive %'], ['crit', 'Critique %'], ['antiCrit', 'Contre %'],
  ['sAtk', 'Attaque S %'], ['block', 'Bloquage %'], ['extraTurn', 'Tour Bonus %'], ['aid', 'Aide %'],
  ['bloodline', 'Bouclier Bloodline %'], ['recovery', 'Taux de soin reçu %'],
];
const POSTES = { V: 'Avant-garde', A: 'Attaquant', S: 'Support' };
const FORMAT = 'myninja-formation';

const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const norm = (x) => String(x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const shortName = (set) => set.name.replace(/^Accessoires /, '');
const accSlotLabel = (i) => `${ACC_SLOTS[i].label} ${i % 2 + 1}`;

// Formation (nom + cases) → objet du fichier.
export function formationToFile(name, slots) {
  const ninjas = [];
  for (const [key, m] of Object.entries(slots || {}).sort(([a], [b]) => 'VAS'.indexOf(a[0]) - 'VAS'.indexOf(b[0]) || a.localeCompare(b))) {
    const n = m && byId[m.ninjaId];
    if (!n) continue;
    const stats = m.stats?.atk != null ? m.stats : { ...m.stats, atk: baseAttack(m.stats) };
    const aw = n.awakenings || [];
    const level = Math.min(m.awakening ?? aw.length, aw.length);
    const equip = m.equip || choiceToSlots(m.gear); // anciennes fiches : { set: pièces }
    const gearName = (id) => { const s = GEAR_SETS.find((x) => x.id === id); return s ? shortName(s) : null; };
    const accName = (id) => { const s = ACCESSORY_SETS.find((x) => x.id === id); return s ? shortName(s) : null; };
    ninjas.push({
      case: key,
      poste: POSTES[key[0]],
      ninja: n.name,
      id: n.id,
      ...(m.label ? { nomAffiche: m.label } : {}),
      ...(n.isMain ? { typeAttaque: m.attackType === 'magic' ? 'magique' : 'physique' } : {
        nature: NATURES[m.nature || 'none'], niveauNature: m.natureLevel || 1,
      }),
      ...(aw.length ? { eveil: level, eveilNom: level ? aw[level - 1].name : 'Aucun' } : {}),
      ...(n.isMain && m.mainTalents?.length ? {
        talentsPrincipal: m.mainTalents.map((t) => ({ cible: t.side === 'enemy' ? 'ennemis' : 'alliés', stat: t.stat, valeur: t.value })),
      } : {}),
      stats: Object.fromEntries(STAT_FIELDS.filter(([k]) => stats[k] != null && stats[k] !== '').map(([k, lbl]) => [lbl, stats[k]])),
      equipement: Object.fromEntries(GEAR_SLOTS.map((lbl, i) => [lbl, gearName(equip.gear?.[i])])),
      accessoires: Object.fromEntries(ACC_SLOTS.map((_, i) => [accSlotLabel(i), accName(equip.acc?.[i])])),
      bonusActifs: equipmentEntries(slotsToChoice(equip)).map((e) => e.name),
    });
  }
  return { format: FORMAT, version: 1, formation: name, exportee: new Date().toISOString().slice(0, 10), ninjas };
}

export const fileName = (name) => `formation-${norm(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'sans-nom'}.json`;

// Un nom d'équipement lu dans le fichier → id du set (null si vide), ou erreur si inconnu.
function setId(sets, name, where, warn) {
  if (name == null || name === '' || norm(name) === 'vide') return null;
  const s = sets.find((x) => norm(shortName(x)) === norm(name) || norm(x.name) === norm(name) || x.id === name);
  if (!s) warn.push(`${where} : « ${name} » inconnu, case laissée vide.`);
  return s ? s.id : null;
}

// Objet du fichier → { name, slots, warnings }.
function fileToFormation(f) {
  const warn = [];
  const slots = {};
  const natureKey = (v) => Object.keys(NATURES).find((k) => k === v || norm(NATURES[k]) === norm(v)) || 'none';
  for (const x of f.ninjas || []) {
    const n = byId[x.id] || NINJAS.find((y) => norm(y.name) === norm(x.ninja));
    if (!n) { warn.push(`Ninja « ${x.ninja ?? x.id} » inconnu, ignoré.`); continue; }
    const key = /^[VAS][0-2]$/.test(x.case) && x.case[0] === { vanguard: 'V', assaulter: 'A', supporter: 'S' }[n.role] ? x.case : null;
    const row = { vanguard: 'V', assaulter: 'A', supporter: 'S' }[n.role];
    const k = key && !slots[key] ? key : [0, 1, 2].map((i) => `${row}${i}`).find((c) => !slots[c] && (row !== 'V' || c === 'V0'));
    if (!k) { warn.push(`${n.name} : plus de place au poste ${POSTES[row]}, ignoré.`); continue; }
    const stats = {};
    for (const [key2, lbl] of STAT_FIELDS) {
      const v = x.stats?.[lbl] ?? x.stats?.[key2];
      if (v != null && v !== '') stats[key2] = Number(String(v).replace(/\s/g, '').replace(',', '.'));
    }
    const m = {
      ninjaId: n.id, stats,
      equip: {
        gear: GEAR_SLOTS.map((lbl) => setId(GEAR_SETS, x.equipement?.[lbl], `${n.name}, équipement ${lbl}`, warn)),
        acc: ACC_SLOTS.map((_, i) => setId(ACCESSORY_SETS, x.accessoires?.[accSlotLabel(i)], `${n.name}, accessoire ${accSlotLabel(i)}`, warn)),
      },
    };
    if (x.nomAffiche) m.label = x.nomAffiche;
    if (n.isMain) {
      m.attackType = norm(x.typeAttaque).startsWith('mag') ? 'magic' : 'physical';
      if (Array.isArray(x.talentsPrincipal)) {
        m.mainTalents = x.talentsPrincipal.map((t) => ({ side: norm(t.cible).startsWith('enn') ? 'enemy' : 'ally', stat: t.stat, value: Number(t.valeur) || 0 }));
      }
    } else {
      m.nature = natureKey(x.nature);
      m.natureLevel = Math.max(1, Math.round(Number(x.niveauNature) || 1));
    }
    if (x.eveil != null && n.awakenings?.length) m.awakening = Math.max(0, Math.min(n.awakenings.length, Math.round(Number(x.eveil) || 0)));
    slots[k] = m;
  }
  return { name: String(f.formation || 'Formation importée'), slots, warnings: warn };
}

// Texte d'un fichier (ou d'une ancienne sauvegarde copiée) → liste de { name, slots, warnings }.
export function parseFormationFile(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : [data];
  const out = [];
  for (const f of list) {
    if (f?.format === FORMAT) out.push(fileToFormation(f));
    else if (f?.slots && f?.name) out.push({ name: f.name, slots: f.slots, warnings: [] }); // ancienne sauvegarde
  }
  if (!out.length) throw new Error('Ce fichier ne contient aucune formation.');
  return out;
}
