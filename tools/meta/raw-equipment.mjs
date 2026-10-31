// Stats brutes des sets, relevées dans les deux vidéos d'équipement (captures du Discord du jeu).
// Utilisées seulement pour fabriquer les stats de test de la recherche de formations : le simulateur ne les lit pas.
//
// GEAR_PIECE : valeur de chaque pièce d'équipement (Attaque physique, Attaque stratégique, Vitesse ; défenses à part si
//   elles diffèrent). Ce sont des stats finales : ajoutées telles quelles.
// GEAR_TIER  : Force / Chakra / Agilité données par les paliers 2, 4 et 6 pièces.
// ACC_PIECE  : Force, Chakra et Agilité de chaque accessoire (une paire = 2 pièces) ; la Puissance n'est pas convertie.
// ACC_PAIR   : Force / Chakra / Agilité données par le bonus d'une paire.
// Valeurs estimées (lecture incomplète, déduites de la suite décroissante des sets) : marquées « est. ».
// Sets absents (Noël) : valeurs inconnues, négligées.

export const GEAR_PIECE = {
  'gear-yin-yang': 78500, 'gear-akatsuki': 77500, 'gear-izanami': 77000, 'gear-susano': 76500, 'gear-crystalys': 76000,
  'gear-iron-will': 75500, 'gear-green': 75000, 'gear-sand-burial': 74500, 'gear-baryon': 74000, 'gear-tarrasque': 73500,
  'gear-red': 73000, 'gear-branded': 72500, 'gear-radiance': 71500, 'gear-flamvell': 71000, 'gear-meka': 70500,
  'gear-arcane': 70000, 'gear-butterfly': 69500, 'gear-infernity': 69000, 'gear-vylon': 68500, 'gear-moonlit': 68000,
  'gear-yaksa': 67500, 'gear-sunfire': 67000, 'gear-guren': 64000, 'gear-guard': 64000, 'gear-pain': 64000,
  'gear-amenohoko': 63000, 'gear-reanimated': 62000, 'gear-sunagakure': 61000, 'gear-sakura': 60000, 'gear-amegakure': 59000,
  'gear-longen': 58000,
  'gear-kumogakure': 57000, 'gear-kirigakure': { atk: 57000, def: 56000 }, 'gear-cursed': { atk: 55000, def: 54000 },
  'gear-sarutobi': { atk: 55000, def: 54000 }, 'gear-uzumaki': { atk: 53000, def: 52000 }, 'gear-hyuga': { atk: 53000, def: 52000 },
  'gear-uchiha': { atk: 51000, def: 50000 }, 'gear-saint': { atk: 49000, def: 48000 }, 'gear-senju': { atk: 47000, def: 46000 },
  'gear-ashura': { atk: 45000, def: 44000 }, 'gear-indora': { atk: 44000, def: 42000 }, 'gear-bloodfang': { atk: 42000, def: 40000 },
  'gear-otsutsuki': { atk: 40000, def: 38000 }, 'gear-heroism': { atk: 38000, pdef: 36000, mdef: 38000 },
  'gear-devout': { atk: 36000, pdef: 34000, mdef: 36000 }, 'gear-hallowed': { atk: 34000, pdef: 32000, mdef: 34000 },
  'gear-skyshatter': { atk: 32000, pdef: 30000, mdef: 32000 }, 'gear-darkmantle': { atk: 30000, pdef: 28000, mdef: 30000 },
  'gear-deatbone': { atk: 28000, pdef: 26000, mdef: 30000 }, 'gear-corruptor': { atk: 26000, pdef: 24000, mdef: 28000 },
  'gear-oblivion': { atk: 24000, pdef: 22000, mdef: 26000 }, 'gear-stormrage': { atk: 22000, pdef: 20000, mdef: 24000 },
  'gear-frost-fire': { atk: 20000, pdef: 18000, mdef: 22000 },
  'gear-defiance': 73000, 'gear-black-feather': 72000, 'gear-warlord': 66000,
};

const a = (agility) => ({ agility });
const af = (agility, force) => ({ agility, force });
export const GEAR_TIER = {
  'gear-yin-yang': { 2: a(25000), 6: a(35000) },
  'gear-akatsuki': { 2: a(15000), 4: a(20000), 6: a(25000) },
  'gear-izanami': { 2: af(25000, 25000), 4: af(35000, 35000) },
  'gear-susano': { 4: a(30000), 6: a(40000) },
  'gear-crystalys': { 2: a(25000), 6: a(35000) },
  'gear-iron-will': { 2: af(25000, 25000), 4: af(35000, 35000) },
  'gear-green': { 2: { chakra: 40000 }, 4: a(40000) },
  'gear-sand-burial': { 2: a(25000), 6: a(35000) },
  'gear-baryon': { 2: af(25000, 25000), 4: af(35000, 35000) },
  'gear-tarrasque': { 4: a(25000), 6: a(30000) },
  'gear-red': { 2: { agility: 25000, chakra: 25000 }, 4: { agility: 35000, chakra: 35000 } },
  'gear-branded': { 2: af(25000, 25000), 4: af(35000, 35000) },
  'gear-radiance': { 4: a(24000), 6: a(35000) },
  'gear-flamvell': { 2: af(20000, 20000), 4: af(33000, 35000) },
  'gear-meka': { 4: a(25000), 6: a(35000) },
  'gear-arcane': { 2: a(10000), 4: a(15000), 6: a(35000) },
  'gear-butterfly': { 4: a(23000), 6: a(35000) },
  'gear-infernity': { 4: a(25000), 6: a(35000) },
  'gear-vylon': { 2: a(11000), 4: a(23000), 6: a(25000) },
  'gear-black-feather': { 4: a(25000), 6: a(35000) },
  'gear-moonlit': { 2: af(10000, 10000), 4: af(23000, 25000), 6: af(25000, 40000) },
  'gear-yaksa': { 2: a(10000), 4: a(23000), 6: a(25000) },
  'gear-sunfire': { 2: a(10000), 4: a(22000), 6: a(25000) },
  'gear-guren': { 2: a(10000), 4: a(22000), 6: a(25000) },
  'gear-guard': { 2: a(10000), 4: a(20000), 6: a(25000) },
  'gear-pain': { 4: a(25000), 6: a(32000) },
  'gear-amenohoko': { 4: a(30000), 6: a(30000) },
  'gear-reanimated': { 4: a(25000), 6: a(32000) },
  'gear-sunagakure': { 2: af(15000, 20000), 4: af(15000, 20000), 6: af(23000, 25000) },
  'gear-sakura': { 2: a(22000), 6: a(30000) },
  'gear-amegakure': { 6: a(50000) },
  'gear-longen': { 2: af(10000, 10000), 4: af(20000, 20000), 6: af(20000, 30000) },
  'gear-kumogakure': { 2: a(24000), 4: a(34000) },
  'gear-kirigakure': { 4: af(25000, 25000), 6: af(25000, 25000) },
  'gear-cursed': { 2: a(22000), 4: a(28000) },
  'gear-sarutobi': { 2: { force: 20000, chakra: 20000, agility: 20000 }, 4: { force: 22000, chakra: 22000 } },
  'gear-uzumaki': { 4: a(24000), 6: a(26000) },
  'gear-uchiha': { 4: a(20000), 6: a(28000) },
  'gear-saint': { 4: a(20000), 6: a(30000) },
  'gear-senju': { 4: { force: 20000 }, 6: { force: 40000 } },
  'gear-ashura': { 2: a(10000), 4: a(18000), 6: a(24000) },
  'gear-indora': { 4: a(18000), 6: a(30000) },
  'gear-bloodfang': { 4: a(18000), 6: a(28000) },
  'gear-otsutsuki': { 4: a(18000), 6: a(26000) },
  'gear-heroism': { 2: a(12000), 4: a(16000), 6: a(22000) },
  'gear-devout': { 4: a(18000), 6: a(26000) },
  'gear-hallowed': { 2: { force: 10000, agility: 10000, chakra: 10000 }, 4: a(15000), 6: a(22000) },
  'gear-skyshatter': { 4: a(18000), 6: a(25000) },
  'gear-darkmantle': { 2: a(12000), 4: a(16000), 6: a(22000) },
  'gear-deatbone': { 4: a(15000), 6: a(20000) },
  'gear-corruptor': { 2: a(10000), 4: a(12000), 6: a(15000) },
  'gear-oblivion': { 2: { force: 8000, agility: 8000, chakra: 8000 }, 4: a(10000), 6: a(15000) },
  'gear-stormrage': { 2: a(6000), 4: a(10000), 6: a(15000) },
  'gear-frost-fire': { 2: a(8000), 4: a(10000), 6: a(15000) },
  'gear-warlord': { 2: { force: 15000, agility: 15000, chakra: 15000 }, 4: a(20000), 6: a(20000) },
  'gear-defiance': { 2: { chakra: 25000, agility: 25000 }, 4: { chakra: 35000, agility: 35000 } },
};

// Accessoires : valeur par pièce, identique pour Force, Chakra et Agilité, ou { force, chakra, agility }.
export const ACC_PIECE = {
  'acc-yin-yang': 68000, 'acc-akatsuki': 68000, 'acc-izanami': 68000, 'acc-gold': 67500 /* est. */, 'acc-crystalys': 67000,
  'acc-iron-will': 66500 /* est. */, 'acc-green': 66000, 'acc-sand-burial': 65500, 'acc-baryon': 65000, 'acc-tarrasque': 64500,
  'acc-red': 64000 /* est. */, 'acc-radiance': 62500, 'acc-flamvell': 62000, 'acc-mekansm': 61500 /* est. */, 'acc-arcane': 61000,
  'acc-butterfly': 60500, 'acc-infernity': 60000, 'acc-vylon': 59500 /* est. */, 'acc-moonlit': 59000, 'acc-yaksa': 58500,
  'acc-sunfire': 58000, 'acc-guren': 57500, 'acc-guard': 57000, 'acc-pain': 56500, 'acc-amenohoko': 56000, 'acc-reanimated': 55500,
  'acc-sunagakure': 55000, 'acc-sakura': { force: 53500, chakra: 53500, agility: 55000 }, 'acc-amegakure': 54000,
  'acc-longen': { force: 53000, chakra: 53000, agility: 54500 }, 'acc-kumogakure': { force: 52500, chakra: 52500, agility: 54000 },
  'acc-kirigakure': { force: 52000, chakra: 52000, agility: 54000 }, 'acc-cursed': { force: 50000, chakra: 50000, agility: 52000 },
  'acc-sarutobi': { force: 50000, chakra: 50000, agility: 52000 }, 'acc-uzumaki': { force: 49000, chakra: 49000, agility: 51000 },
  'acc-hyuga': { force: 48000, chakra: 48000, agility: 50000 }, 'acc-uchiha': { force: 47000, chakra: 47000, agility: 49000 },
  'acc-saint': 40000, 'acc-senju': { force: 46000, chakra: 46000, agility: 48000 }, 'acc-ashura': { force: 45000, chakra: 45000, agility: 47000 },
  'acc-indora': { force: 43000, chakra: 43000, agility: 45000 }, 'acc-bloodfang': { force: 43000, chakra: 43000, agility: 44000 },
  'acc-otsutsuki': 42000, 'acc-heroism': { force: 40000, chakra: 40000, agility: 42000 }, 'acc-devout': { force: 34000, chakra: 34000, agility: 38000 },
};
export const ACC_PAIR = {
  'acc-pain': { force: { force: 30000, agility: 30000 }, chakra: { chakra: 30000, agility: 30000 } },
  'acc-sunagakure': { force: { force: 20000 }, agility: { force: 20000 } },
  'acc-saint': { chakra: { agility: 20000 } },
  'acc-bloodfang': { force: { agility: 12000 } },
  'acc-otsutsuki': { chakra: { agility: 22000 } },
  'acc-black-feather': { force: { force: 30000 }, chakra: { agility: 30000 }, agility: { chakra: 30000 } },
  'acc-warlord': { force: { force: 40000 }, chakra: { chakra: 40000 }, agility: { agility: 40000 } },
};
