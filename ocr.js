// Lecture des stats depuis une capture de l'écran du ninja (OCR tesseract.js, hébergé dans vendor/tesseract).

// Libellés de l'écran du jeu (sans accents ni espaces) → stat du simulateur. Le jeu affiche une seule attaque,
// souvent libellée « Atq Magique » même pour une attaque physique : toutes vont dans « Attaque ».
const LABELS = [
  ['hp', 'vie'], ['atk', 'atqphysique'], ['atk', 'atqmagique'], ['atk', 'attaque'], ['pdef', 'defphysique'], ['mdef', 'defmagique'],
  ['speed', 'vitesse'], ['fury', 'furieinitiale'], ['dr', 'degats'], ['air', 'absorption'], ['hit', 'precision'],
  ['dodge', 'esquive'], ['crit', 'critique'], ['antiCrit', 'contre'], ['sAtk', 'attaques'], ['block', 'bloquage'],
  ['block', 'blocage'], ['extraTurn', 'tourbonus'], ['aid', 'aide'],
  // lus mais ignorés (évitent qu'un libellé voisin soit pris pour une stat)
  [null, 'force'], [null, 'chakra'], [null, 'endurance'], [null, 'agilite'],
];
export const OCR_STATS = ['hp', 'atk', 'pdef', 'mdef', 'speed', 'fury', 'dr', 'air', 'hit', 'dodge', 'crit', 'antiCrit',
  'sAtk', 'block', 'extraTurn', 'aid'];

// Distance d'édition (lettres ajoutées, retirées ou remplacées).
function distance(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

// Libellé lu (avec d'éventuelles erreurs de lecture) → stat, ou undefined s'il ne ressemble à aucun libellé connu.
function matchLabel(raw) {
  const w = raw.replace(/[^a-z]/g, '');
  if (w.length < 3) return undefined;
  let best, bestD = Infinity;
  for (const [key, label] of LABELS) {
    // le libellé peut être précédé de débris (« l », « | » lus comme lettres) : on compare aussi la fin du texte lu
    const tail = w.length > label.length ? w.slice(-label.length) : w;
    const d = Math.min(distance(w, label), distance(tail, label) + 0.5);
    if (d < bestD) { best = key; bestD = d; }
  }
  const tolerance = (len) => (len <= 4 ? 1 : Math.floor(len / 4) + 1);
  const label = LABELS.find(([k]) => k === best);
  return bestD <= tolerance(label ? label[1].length : 0) ? best : undefined;
}

// Texte reconnu → { stats, found, missing }. Chaque libellé est suivi de sa valeur, deux paires par ligne.
export function parseStats(text) {
  const t = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const stats = {};
  // un libellé (lettres et espaces), quelques caractères parasites (« = », « - », « … »), puis le nombre
  const re = /([a-z][a-z .'|]*?)[^a-z0-9]{0,8}([0-9]+(?:[.,][0-9]+)?)/g;
  for (const m of t.matchAll(re)) {
    const key = matchLabel(m[1]);
    if (key && stats[key] == null) stats[key] = parseFloat(m[2].replace(',', '.'));
  }
  const found = OCR_STATS.filter((k) => stats[k] != null);
  const out = Object.fromEntries(found.map((k) => [k, stats[k]]));
  return { stats: out, found, missing: OCR_STATS.filter((k) => stats[k] == null) };
}

let workerPromise = null;
const base = new URL('./vendor/tesseract/', import.meta.url).href;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error(`Chargement impossible : ${src}`));
    document.head.append(s);
  });
}

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      if (!window.Tesseract) await loadScript(`${base}tesseract.min.js`);
      // Données de langue française (compressées), stockées en base64 dans un .txt pour être servies partout.
      const resp = await fetch(`${base}fra.traineddata.gz.b64.txt`);
      if (!resp.ok) throw new Error(`Données de langue introuvables (${resp.status})`);
      const data = Uint8Array.from(atob((await resp.text()).trim()), (ch) => ch.charCodeAt(0));
      return window.Tesseract.createWorker([{ code: 'fra', data }], 1, {
        workerPath: `${base}worker.min.js`,
        corePath: `${base}tesseract-core-lstm.wasm.js`,
        workerBlobURL: false,
      });
    })();
    workerPromise.catch(() => { workerPromise = null; }); // un nouvel essai reste possible
  }
  return workerPromise;
}

// Agrandit l'image, la passe en niveaux de gris, l'inverse si le fond est sombre (texte clair) et étire le contraste.
async function prepare(file) {
  const img = await createImageBitmap(file);
  const scale = Math.max(1, 1300 / img.width);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  let sum = 0, lo = 255, hi = 0;
  const gray = new Uint8ClampedArray(px.length / 4);
  for (let i = 0; i < gray.length; i++) {
    const v = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    gray[i] = v; sum += v;
  }
  const invert = sum / gray.length < 128;
  for (let i = 0; i < gray.length; i++) { const v = invert ? 255 - gray[i] : gray[i]; gray[i] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
  const span = Math.max(1, hi - lo);
  for (let i = 0; i < gray.length; i++) gray[i] = ((gray[i] - lo) * 255) / span;
  // Léger renforcement de la netteté (images compressées) : pixel + 0,5 × (pixel − moyenne de ses 4 voisins).
  const W = c.width, H = c.height;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      let v = gray[i];
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) v += 0.5 * (4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - W] - gray[i + W]) / 4;
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v; px[i * 4 + 3] = 255;
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}

// Fichier image (ou image collée) → { stats, found, missing, text }.
export async function readStatsImage(file) {
  const [worker, canvas] = await Promise.all([getWorker(), prepare(file)]);
  const { data } = await worker.recognize(canvas);
  return { ...parseStats(data.text), text: data.text };
}
