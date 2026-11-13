// Formation de la page ({ name, slots }) → équipe du moteur. Partagé par la page et les workers d'optimisation.
import { baseAttack } from './engine.js';
import { NINJAS } from './data.js';
import { equipmentEntries, slotsToChoice, choiceToSlots } from './equipment.js';

const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));

// Anciennes fiches (attaque physique et magique séparées) → une seule « Attaque ».
export function withAtk(stats = {}) {
  if (stats.atk != null) return stats;
  const { patk, matk, ...rest } = stats;
  return { ...rest, atk: baseAttack(stats) };
}

export function toTeam(t) {
  const members = [];
  for (const [key, m] of Object.entries(t.slots)) {
    if (!m || !byId[m.ninjaId]) continue;
    members.push({
      ninja: byId[m.ninjaId], pos: Number(key.slice(1)), stats: withAtk(m.stats), label: m.label || undefined,
      attackType: byId[m.ninjaId].isMain ? m.attackType : undefined,
      mainTalents: byId[m.ninjaId].isMain ? m.mainTalents : undefined,
      nature: byId[m.ninjaId].isMain ? 'none' : m.nature || 'none', natureLevel: m.natureLevel || 1, awakening: m.awakening, skillAwakening: m.skillAwakening,
      equipment: equipmentEntries(slotsToChoice(m.equip || choiceToSlots(m.gear))),
    });
  }
  return { name: t.name, members };
}
