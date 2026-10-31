// Formations de référence ajoutées aux adversaires de chaque génération : rapides et orientées contrôle,
// pour que la résistance au contrôle et les natures comptent dans la recherche.
const e = (gear, acc) => ({ gear, acc });
export const REFERENCE = [
  // type Lava X1, avec Legend Madara à la place de Sarada et des équipements de contrôle et de vitesse
  { v: 'warrior-sakura', a: ['hashirama-madara'], s: ['kamado-nezuko', 'legende-madara'], mainType: 'physical',
    nat: { 'warrior-sakura': 'water', 'hashirama-madara': 'water', 'kamado-nezuko': 'water', 'legende-madara': 'water' },
    eq: { 'warrior-sakura': e('gear-susano', 'acc-black-feather'), main: e('gear-amegakure', 'acc-hyuga'), 'hashirama-madara': e('gear-black-feather', 'acc-black-feather'),
      'kamado-nezuko': e('gear-infernity', 'acc-black-feather'), 'legende-madara': e('gear-susano', 'acc-black-feather') } },
  // contrôle de masse : Natsu, X-mas Temari, Shikamaru (DPS), Hinata (soccer)
  { v: 'hinata-soccer', a: [], s: ['natsu-dragneel', 'xmas-temari', 'shikamaru-nara'], mainType: 'magic',
    nat: { 'hinata-soccer': 'earth', 'natsu-dragneel': 'fire', 'xmas-temari': 'earth', 'shikamaru-nara': 'earth' },
    eq: { 'hinata-soccer': e('gear-susano', 'acc-guren'), main: e('gear-amegakure', 'acc-hyuga'), 'natsu-dragneel': e('gear-black-feather', 'acc-black-feather'),
      'xmas-temari': e('gear-infernity', 'acc-black-feather'), 'shikamaru-nara': e('gear-susano', 'acc-black-feather') } },
  // contrôle et anti-contrôle : Hidan & Kakuzu, Orochimaru [Akatsuki], Orochimaru (New Hera), Nezuko
  { v: 'hidan-kakuzu', a: [], s: ['orochimaru-akatsuki', 'orochimaru-boruto', 'kamado-nezuko'], mainType: 'magic',
    nat: { 'hidan-kakuzu': 'fire', 'orochimaru-akatsuki': 'earth', 'orochimaru-boruto': 'earth', 'kamado-nezuko': 'fire' },
    eq: { 'hidan-kakuzu': e('gear-susano', 'acc-gold'), main: e('gear-amegakure', 'acc-hyuga'), 'orochimaru-akatsuki': e('gear-infernity', 'acc-black-feather'),
      'orochimaru-boruto': e('gear-susano', 'acc-black-feather'), 'kamado-nezuko': e('gear-black-feather', 'acc-black-feather') } },
];
