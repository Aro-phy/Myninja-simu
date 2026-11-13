// Optimisation de l'équipement et des accessoires d'une formation contre des formations adverses choisies.
// 1. Classique : ninja par ninja, chaque set d'équipement (×6), chaque paire d'accessoires et chaque set ×8 ; on garde
//    ce qui fait gagner le plus (puis, à victoires égales, ce qui finit les combats plus vite).
// 2. En cascade : on retire, chez nous et chez chaque adversaire, le ninja de contrôle (ou le plus rapide), puis les
//    attaquants par attaque décroissante, jusqu'au main contre main. À chaque étape, on optimise les ninjas restants
//    contre les adversaires réduits, puis on teste ce nouvel équipement sur les formations complètes : gardé s'il est
//    meilleur, sinon on revient au précédent.
// 3. Classique limitée : de nouveau ninja par ninja, mais seulement avec les équipements trouvés pour lui pendant la
//    cascade, jugés sur les formations complètes.
// Les stats saisies tiennent compte de l'équipement porté : quand on change de set, on ajoute l'écart de stats
// (attaque, défenses, vitesse, PV) estimé par le modèle d'équipement (equip-raw.js).
import { resolveKit } from './engine.js';
import { STATUSES } from './statuses.js';
import { NINJAS } from './data.js';
import { GEAR_SETS, ACCESSORY_SETS, choiceToSlots } from './equipment.js';
import { equipDelta } from './equip-raw.js';
import { runJob } from './opt-job.js';
import { withAtk } from './team.js';

const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const GEAR_IDS = GEAR_SETS.map((g) => g.id);
const ACC_IDS = ACCESSORY_SETS.map((a) => a.id);
const setName = (id) => [...GEAR_SETS, ...ACCESSORY_SETS].find((x) => x.id === id)?.name.replace(/^Accessoires /, '') || '—';
const PAIRS = ['Force', 'Chakra', 'Agilité', 'Puissance'];

// ---------- Équipement ----------

const emptyEquip = () => ({ gear: Array(6).fill(null), acc: Array(8).fill(null) });
export const equipOf = (m) => structuredClone(m.equip || (m.gear ? choiceToSlots(m.gear) : null) || emptyEquip());
const sameEquip = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function describeEquip(e) {
  const count = {};
  for (const x of e.gear || []) if (x) count[x] = (count[x] || 0) + 1;
  const gear = Object.entries(count).map(([x, c]) => `${setName(x)} ×${c}`).join(' + ') || 'aucun';
  const pairs = [0, 2, 4, 6].map((i) => (e.acc?.[i] && e.acc[i] === e.acc[i + 1] ? e.acc[i] : null));
  const acc = pairs.every((x) => x && x === pairs[0]) ? `${setName(pairs[0])} ×8`
    : pairs.some(Boolean) ? pairs.map((x, i) => `${PAIRS[i]} ${x ? setName(x) : '—'}`).join(', ') : 'aucun';
  return { gear, acc };
}

const isMagic = (m) => byId[m.ninjaId].role === 'supporter' || (byId[m.ninjaId].isMain && m.attackType === 'magic');

// Formation avec les équipements donnés ({ ninjaId: équipement }) ; stats ajustées de l'écart dû au changement.
export function applyEquip(slots, equips) {
  const out = {};
  for (const [k, m] of Object.entries(slots)) {
    if (!m || !byId[m.ninjaId] || !equips[m.ninjaId] || sameEquip(equipOf(m), equips[m.ninjaId])) { out[k] = m; continue; }
    const d = equipDelta(equipOf(m), equips[m.ninjaId], isMagic(m));
    const st = { ...withAtk(m.stats) };
    for (const [s, v] of Object.entries(d)) if (v) st[s] = Math.max(0, (st[s] || 0) + v);
    out[k] = { ...m, stats: st, equip: structuredClone(equips[m.ninjaId]) };
  }
  return out;
}

// ---------- Ordre de retrait (cascade) ----------

const flat = (effects = []) => effects.flatMap((e) => (e.oneOf ? e.oneOf.flatMap(flat) : [e]));
const ccSupport = (n) => n.role === 'supporter' && flat(resolveKit(n).special?.effects)
  .some((e) => STATUSES[e.status]?.type === 'cc' && (e.to?.side === 'enemy' || (typeof e.to === 'string' && /enemy|target/.test(e.to))));

export function removalOrder(slots) {
  const ms = Object.values(slots).filter((m) => m && byId[m.ninjaId] && !byId[m.ninjaId].isMain);
  const speed = (m) => m.stats?.speed || 0, atk = (m) => withAtk(m.stats || {}).atk || 0;
  const cc = ms.filter((m) => ccSupport(byId[m.ninjaId])).sort((a, b) => speed(b) - speed(a))[0] || [...ms].sort((a, b) => speed(b) - speed(a))[0];
  return cc ? [cc, ...ms.filter((m) => m !== cc).sort((a, b) => atk(b) - atk(a))].map((m) => m.ninjaId) : [];
}

export const optimizableIds = (slots) => Object.values(slots).filter((m) => m && byId[m.ninjaId]).map((m) => m.ninjaId);

// ---------- Exécution des combats (workers, sinon dans la page) ----------

class Pool {
  constructor(size) {
    this.q = []; this.pend = new Map(); this.jid = 0; this.workers = []; this.idle = [];
    try {
      for (let i = 0; i < size; i++) {
        const w = new Worker(new URL('./opt-worker.js', import.meta.url), { type: 'module' });
        w.onmessage = (e) => this.done(w, e.data);
        w.onerror = (e) => { e.preventDefault?.(); this.fail(w); };
        this.workers.push(w); this.idle.push(w);
      }
    } catch { this.workers = []; this.idle = []; }
  }
  run(job) { return new Promise((res, rej) => { this.q.push({ job, res, rej }); this.pump(); }); }
  pump() {
    if (!this.workers.length) { this.syncPump(); return; }
    while (this.idle.length && this.q.length) {
      const w = this.idle.pop(), t = this.q.shift(), id = this.jid++;
      this.pend.set(id, { ...t, w });
      w.postMessage({ id, job: t.job });
    }
  }
  done(w, { id, out, error }) {
    const p = this.pend.get(id); if (!p) return;
    this.pend.delete(id); this.idle.push(w);
    if (error) p.rej(new Error(error)); else p.res(out);
    this.pump();
  }
  // worker inutilisable (module workers non pris en charge…) : ses paquets repartent dans la file
  fail(w) {
    w.terminate();
    this.workers = this.workers.filter((x) => x !== w); this.idle = this.idle.filter((x) => x !== w);
    for (const [id, p] of this.pend) if (p.w === w) { this.pend.delete(id); this.q.unshift({ job: p.job, res: p.res, rej: p.rej }); }
    this.pump();
  }
  async syncPump() {
    if (this.syncing) return;
    this.syncing = true;
    while (this.q.length) {
      const t = this.q.shift();
      try { t.res(runJob(t.job)); } catch (e) { t.rej(e); }
      await new Promise((r) => setTimeout(r, 0));
    }
    this.syncing = false;
  }
  clear() { for (const t of this.q) t.rej(new Error('arrêt')); this.q = []; }
  close() { this.clear(); for (const w of this.workers) w.terminate(); }
}

// ---------- Critères ----------

// pendant l'optimisation d'un ninja : un peu plus de victoires, ou autant et des combats plus courts
const improves = (a, b) => a.w > b.w + 0.003 || (a.w >= b.w - 0.001 && a.r < b.r - 0.03);
// sur les formations complètes : plus d'1 point de victoires sans allonger les combats (≤ 0,3 round),
// ou autant de victoires (−0,3 point) et moins de rounds
const keepFull = (a, b) => { const dw = a.w - b.w, dr = a.r - b.r; return (dw > 0.01 && dr <= 0.3) || (dw >= -0.003 && dr < -0.05); };
const rank = (a, b) => b.w - a.w || a.r - b.r;

// ---------- Optimisation ----------

// opts : { base: { name, slots }, opps: [{ name, slots }], rules, ids, modes: { classic, cascade, restricted },
//          n, passes, jitter, onProgress(done, total, text), onStep(text), signal: { stopped } }
export async function runOptimizer(opts) {
  const { base, opps, rules, modes, n = 20, passes = 1, jitter = 0.03, onProgress = () => {}, onStep = () => {}, signal = {} } = opts;
  const ids = opts.ids?.length ? opts.ids : optimizableIds(base.slots);
  const cores = Math.max(1, Math.min(8, (globalThis.navigator?.hardwareConcurrency || 4) - 1));
  const pool = new Pool(cores);
  const ourOrder = removalOrder(base.slots), oppOrders = opps.map((o) => removalOrder(o.slots));
  const nv = n * 2; // validation sur les formations complètes : plus de combats, autres tirages
  const TSEED = 4242, VSEED = 777, FSEED = 90001;
  let done = 0, total = 1;
  const tick = (text) => onProgress(done, total, text);

  async function ev(equips, k, nn, seed) {
    if (signal.stopped) throw new Error('arrêt');
    const A = applyEquip(base.slots, equips), removeA = ourOrder.slice(0, k);
    const chunk = Math.max(4, Math.min(nn, Math.ceil((nn * opps.length) / (cores * 2))));
    const per = await Promise.all(opps.map(async (o, j) => {
      const jobs = [];
      for (let i0 = 0; i0 < nn; i0 += chunk) {
        jobs.push(pool.run({ A, removeA, B: o.slots, removeB: oppOrders[j].slice(0, k), n: Math.min(chunk, nn - i0), seed: seed + j * 1000, i0, rules, jitter }));
      }
      const outs = await Promise.all(jobs);
      const w = outs.reduce((s, x) => s + x.w, 0), r = outs.reduce((s, x) => s + x.r, 0);
      return { w: w / nn, r: r / nn };
    }));
    done++; tick();
    return { w: per.reduce((s, x) => s + x.w, 0) / per.length, r: per.reduce((s, x) => s + x.r, 0) / per.length, per };
  }

  // variantes d'un ninja : [« équipement »] puis [« accessoires »]
  const classicGroups = (eq) => [
    GEAR_IDS.map((g) => ({ ...structuredClone(eq), gear: Array(6).fill(g) })),
    ...[0, 1, 2, 3].map((p) => ACC_IDS.map((a) => { const e = structuredClone(eq); e.acc[2 * p] = a; e.acc[2 * p + 1] = a; return e; })),
    ACC_IDS.map((a) => ({ ...structuredClone(eq), acc: Array(8).fill(a) })),
  ];
  const groupsCost = (list) => list.reduce((s, g) => s + g.length, 0);

  async function tune(equips, k, tuneIds, nPasses, groupsFor, accept, seed, nn, label) {
    let best = await ev(equips, k, nn, seed);
    for (let p = 0; p < nPasses; p++) {
      for (const id of tuneIds) {
        for (const variants of groupsFor(id, equips[id])) {
          const cand = variants.filter((v) => !sameEquip(v, equips[id]));
          const res = await Promise.all(cand.map(async (v) => ({ v, s: await ev({ ...equips, [id]: v }, k, nn, seed) })));
          res.sort((a, b) => rank(a.s, b.s));
          const pick = res.find((x) => accept(x.s, best));
          if (pick) { equips = { ...equips, [id]: pick.v }; best = pick.s; }
        }
        const d = describeEquip(equips[id]);
        onStep(`${label} — ${byId[id].isMain ? 'Personnage principal' : byId[id].name} : ${d.gear} ; ${d.acc} → ${(100 * best.w).toFixed(1)} % / ${best.r.toFixed(2)} rounds`);
      }
    }
    return { equips, best };
  }

  const original = Object.fromEntries(ids.map((id) => [id, equipOf(Object.values(base.slots).find((m) => m?.ninjaId === id))]));
  const allEquip = (eqs) => ({ ...Object.fromEntries(optimizableIds(base.slots).map((id) => [id, equipOf(Object.values(base.slots).find((m) => m?.ninjaId === id))])), ...eqs });
  const classicCost = (cnt, np) => cnt * np * (GEAR_IDS.length + 5 * ACC_IDS.length);
  const casc = ourOrder.map((_, i) => ids.filter((id) => !ourOrder.slice(0, i + 1).includes(id)).length);
  total = 4 + (modes.classic ? classicCost(ids.length, passes) : 0) + (modes.cascade ? casc.reduce((s, c) => s + classicCost(c, 1) + 2, 0) : 0)
    + (modes.restricted ? ids.length * 2 * 8 : 0);
  const steps = [];
  let E = allEquip(original);
  let full;
  try {
    full = await ev(E, 0, nv, VSEED);
    steps.push({ label: 'Départ', s: full, kept: true });
    onStep(`Départ : ${(100 * full.w).toFixed(1)} % / ${full.r.toFixed(2)} rounds`);

    if (modes.classic) {
      const groupsFor = (id, eq) => classicGroups(eq);
      const r = await tune(E, 0, ids, passes, groupsFor, improves, TSEED, n, 'Classique');
      const s = await ev(r.equips, 0, nv, VSEED);
      const kept = keepFull(s, full);
      steps.push({ label: 'Optimisation classique', s, kept });
      onStep(`Optimisation classique, formations complètes : ${(100 * s.w).toFixed(1)} % / ${s.r.toFixed(2)} rounds → ${kept ? 'gardée' : 'rejetée'}`);
      if (kept) { E = r.equips; full = s; }
    }

    const found = Object.fromEntries(ids.map((id) => [id, [original[id], E[id]]]));
    if (modes.cascade) {
      for (let k = 1; k <= ourOrder.length; k++) {
        const removed = ourOrder.slice(0, k), rest = ids.filter((id) => !removed.includes(id));
        if (!rest.length) continue;
        const label = `Cascade, sans ${removed.map((id) => byId[id].name).join(', ')}`;
        const r = await tune(E, k, rest, 1, (id, eq) => classicGroups(eq), improves, TSEED + k, n, label);
        for (const id of rest) found[id].push(r.equips[id]);
        const s = await ev(r.equips, 0, nv, VSEED);
        const kept = keepFull(s, full);
        steps.push({ label, s, kept, reduced: r.best });
        onStep(`${label} : formations complètes ${(100 * s.w).toFixed(1)} % / ${s.r.toFixed(2)} rounds → ${kept ? 'gardée' : 'rejetée'}`);
        if (kept) { E = r.equips; full = s; }
      }
    }

    if (modes.restricted) {
      const uniq = (list) => list.filter((x, i) => list.findIndex((y) => JSON.stringify(y) === JSON.stringify(x)) === i);
      const groupsFor = (id, eq) => [
        uniq(found[id].map((f) => ({ ...structuredClone(eq), gear: structuredClone(f.gear) }))),
        uniq(found[id].map((f) => ({ ...structuredClone(eq), acc: structuredClone(f.acc) }))),
      ];
      const r = await tune(E, 0, ids, 2, groupsFor, keepFull, VSEED, nv, 'Classique limitée');
      const kept = keepFull(r.best, full) || sameEquip(r.equips, E);
      steps.push({ label: 'Classique limitée aux équipements trouvés', s: r.best, kept });
      if (kept) { E = r.equips; full = r.best; }
    }
  } catch (e) {
    if (e.message !== 'arrêt') { pool.close(); throw e; }
    onStep('Arrêté : meilleur résultat gardé jusqu\'ici.');
  }
  pool.clear();
  // vérification finale sur d'autres tirages
  signal.stopped = false;
  const v0 = await ev(allEquip(original), 0, nv, FSEED), v1 = await ev(E, 0, nv, FSEED);
  pool.close();
  return { equips: E, original: allEquip(original), before: v0, after: v1, steps, slots: applyEquip(base.slots, E) };
}
