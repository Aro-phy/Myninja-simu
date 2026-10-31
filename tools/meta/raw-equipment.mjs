// Stats brutes (Force, Chakra, Agilité, Endurance) des sets, quand leur description est connue
// (reprises des commentaires de equipment.js / equipment-extra.js). La Puissance n'est pas convertie.
// « Agilité / Chakra 25 000 » = chacune des deux. Les sets absents ici n'ont pas de stats brutes connues : négligées.
export const RAW_GEAR = { // par palier de pièces (2, 4, 6) : total ajouté par ce palier
  'gear-green': { 2: { chakra: 40000 }, 4: { agility: 40000 }, 6: {} },
  'gear-red': { 2: { agility: 25000, chakra: 25000 }, 4: { agility: 35000, chakra: 35000 }, 6: {} },
  'gear-susano': { 4: { agility: 30000 }, 6: { agility: 40000 } },
  'gear-tarrasque': { 4: { agility: 25000 }, 6: { agility: 30000 } },
  'gear-akatsuki': { 2: { agility: 15000 }, 4: { agility: 20000 }, 6: { agility: 25000 } },
  'gear-baryon': { 2: { agility: 25000, force: 25000 }, 4: { agility: 35000, force: 35000 } },
  'gear-black-feather': { 4: { agility: 25000 }, 6: { agility: 35000 } },
  'gear-yin-yang': { 2: { agility: 25000 }, 6: { agility: 35000 } },
  'gear-warlord': { 2: { force: 15000, agility: 15000, chakra: 15000 }, 4: { agility: 20000 }, 6: { agility: 20000 } },
};
export const RAW_ACC = { // par paire (Force, Chakra, Agilité, Puissance)
  'acc-black-feather': { force: { force: 30000 }, chakra: { agility: 30000 }, agility: { chakra: 30000 }, power: {} },
  'acc-warlord': { force: { force: 40000 }, chakra: { chakra: 40000 }, agility: { agility: 40000 }, power: {} },
};
