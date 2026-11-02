// Formations de référence ajoutées aux adversaires de chaque génération et du tournoi.
// Ce sont des formations types construites par des joueurs (anti-contrôle, très offensives, hybrides…), pour que la
// recherche ne s'enferme pas dans un petit groupe de formations qui ne battent que leurs voisines.
// Chaque fichier .json du dossier references/ est un fichier « Télécharger » du simulateur ; seuls les ninjas, natures,
// éveils, équipements, accessoires et talents du personnage principal sont repris (les stats viennent de la base commune).
import { readdirSync, readFileSync } from 'node:fs';
import { parseFormationFile } from '../../formation-file.js';

// REF_DIR=/chemin : lit les fiches d'un autre dossier (par exemple des formations gardées hors du dépôt).
const dir = process.env.REF_DIR ? new URL(`file://${process.env.REF_DIR.replace(/\/?$/, '/')}`) : new URL('./references/', import.meta.url);

// Formation du simulateur ({ name, slots }) → génome de la recherche.
function toGenome({ name, slots }) {
  const g = { name, v: null, a: [], s: [], nat: {}, mainType: 'physical', eq: {} };
  for (const [key, m] of Object.entries(slots).sort()) {
    if (!m) continue;
    const id = m.ninjaId;
    if (id === 'main') {
      g.mainType = m.attackType === 'magic' ? 'magic' : 'physical';
      if (m.mainTalents?.length) g.mainTalents = m.mainTalents;
    } else {
      if (key[0] === 'V') g.v = id; else if (key[0] === 'A') g.a.push(id); else g.s.push(id);
      g.nat[id] = m.nature && m.nature !== 'none' ? m.nature : 'water';
    }
    const gear = m.equip?.gear || [], acc = m.equip?.acc || [];
    // une paire d'accessoires ne compte que si ses 2 pièces sont du même set
    g.eq[id] = { gear: gear.map((x) => x || null), acc: [0, 2, 4, 6].map((i) => (acc[i] && acc[i] === acc[i + 1] ? acc[i] : null)) };
  }
  return g;
}

export const REFERENCE = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
  .flatMap((f) => parseFormationFile(readFileSync(new URL(f, dir), 'utf8')).map(toGenome));
