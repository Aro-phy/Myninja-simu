import { simulate, simulateMany, validateTeam, DEFAULT_RULES, ROLE_LABEL } from './engine.js';
import { NINJAS, EQUIPMENT, SAMPLE_STATS } from './data.js';
import { STATUSES } from './statuses.js';

const STORE_KEY = 'myninja-sim-v1';
const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const eqById = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));
const ROWS = [
  { key: 'V', role: 'vanguard', label: 'Avant-garde', slots: 1 },
  { key: 'A', role: 'assaulter', label: 'Attaquants', slots: 3 },
  { key: 'S', role: 'supporter', label: 'Supports', slots: 3 },
];
const STAT_FIELDS = [
  ['hp', 'Vie'], ['patk', 'Atq Physique'], ['matk', 'Atq Magique'], ['pdef', 'Def Physique'], ['mdef', 'Def Magique'],
  ['speed', 'Vitesse'], ['fury', 'Furie initiale'], ['dr', 'Dégâts %'], ['air', 'Absorption %'],
  ['hit', 'Précision %'], ['dodge', 'Esquive %'], ['crit', 'Critique %'], ['antiCrit', 'Contre %'],
  ['sAtk', 'Attaque S %'], ['block', 'Bloquage %'], ['extraTurn', 'Tour Bonus %'], ['aid', 'Aide %'],
  ['bloodline', 'Bouclier Bloodline %'], ['recovery', 'Taux de soin reçu %'],
];
const RULE_FIELDS = [
  ['normalFury', 'Fury gagnée par attaque normale', 'number'],
  ['specialCost', 'Coût de la spéciale', 'number'],
  ['specialTeamFury', 'Fury rendue à l\'équipe après une spéciale', 'number'],
  ['blockReduction', 'Réduction des dégâts par blocage (%)', 'number'],
  ['critFirst', 'Critique testé avant le blocage', 'bool'],
  ['aidDamagePct', 'Dégâts d\'une attaque d\'aide (% du normal)', 'number'],
  ['aidGivesFury', 'L\'attaque d\'aide donne de la fury', 'bool'],
  ['aidChains', 'Un ninja aidé peut à son tour donner un punch', 'bool'],
  ['maxRounds', 'Limite de rounds (puis victoire aux PV restants)', 'number'],
  ['defenseMode', 'Formule de défense', 'select', [['corrected', 'Corrigée'], ['excel', 'Identique à l\'Excel']]],
];

// ---------- État ----------

const demoStats = (over = {}) => ({ ...SAMPLE_STATS, air: 460, ...over });
function demoState() {
  return {
    teams: [
      { name: 'Ma formation', slots: {
        V0: { ninjaId: 'ex-vanguard', stats: demoStats({ hp: 90e6, pdef: 14e6, mdef: 11e6 }), equipment: ['ex-pain-gear'] },
        A0: { ninjaId: 'main', stats: demoStats(), equipment: [], attackType: 'physical' },
        A1: { ninjaId: 'ex-assassin', stats: demoStats({ speed: 15e6 }), equipment: ['ex-ring-speed'] },
        S0: { ninjaId: 'ex-healer', stats: demoStats({ hp: 55e6 }), equipment: [] },
        S1: { ninjaId: 'ex-controller', stats: demoStats({ hp: 55e6 }), equipment: [] },
      } },
      { name: 'Adversaire', slots: {
        V0: { ninjaId: 'ex-vanguard', stats: demoStats({ hp: 95e6, pdef: 15e6, mdef: 12e6 }), equipment: [] },
        A0: { ninjaId: 'ex-assaulter', stats: demoStats({ patk: 48e6 }), equipment: [] },
        A1: { ninjaId: 'ex-assassin', stats: demoStats({ speed: 14.6e6 }), equipment: ['ex-ring-speed'] },
        S0: { ninjaId: 'ex-healer', stats: demoStats({ hp: 55e6 }), equipment: ['ex-guren-acc'] },
        S1: { ninjaId: 'ex-controller', stats: demoStats({ hp: 55e6 }), equipment: [] },
      } },
    ],
    rules: { ...DEFAULT_RULES },
  };
}

let state = load() || demoState();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.teams) { s.rules = { ...DEFAULT_RULES, ...s.rules }; return s; }
  } catch { /* stockage indisponible */ }
  return null;
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* ignoré */ } }

// ---------- Utilitaires ----------

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : String(k));
  return e;
};
const nf = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const short = (n) => (n >= 1e6 ? `${nf.format(n / 1e6)} M` : nf.format(n));
const parseNum = (s) => {
  const v = parseFloat(String(s).replace(/\s| /g, '').replace(',', '.').replace('%', ''));
  return Number.isFinite(v) ? v : 0;
};

function toTeam(t) {
  const members = [];
  for (const [key, m] of Object.entries(t.slots)) {
    if (!m || !byId[m.ninjaId]) continue;
    members.push({
      ninja: byId[m.ninjaId], pos: Number(key.slice(1)), stats: m.stats, label: m.label || undefined,
      attackType: byId[m.ninjaId].isMain ? m.attackType : undefined,
      equipment: (m.equipment || []).map((id) => eqById[id]).filter(Boolean),
    });
  }
  return { name: t.name, members };
}

// ---------- Formations ----------

function renderTeam(ti) {
  const t = state.teams[ti];
  const root = $(`#team${ti}`);
  root.replaceChildren();
  const nameInput = el('input', { type: 'text', id: `teamName${ti}`, value: t.name, 'aria-label': 'Nom de la formation',
    oninput: (e) => { t.name = e.target.value; save(); } });
  root.append(el('div', { class: 'team-head' }, nameInput));
  const grid = el('div', { class: 'grid133' });
  for (const row of ROWS) {
    const filled = Object.entries(t.slots).filter(([k, m]) => k[0] === row.key && m).length;
    const col = el('div', { class: 'col' },
      el('div', { class: 'col-label' }, `${row.label} `, el('span', { class: 'count' }, `${filled}/${row.slots}`)));
    for (let i = 0; i < row.slots; i++) {
      const key = `${row.key}${i}`;
      const m = t.slots[key];
      const n = m && byId[m.ninjaId];
      const btn = el('button', { class: `slot${n ? ' filled' : ''}`, type: 'button', id: `slot-${ti}-${key}`,
        'aria-label': n ? `Modifier ${n.name}` : `Ajouter un ninja (${row.label})`, onclick: () => openEditor(ti, key) },
      n ? [el('span', { class: 'nm' }, m.label || n.name),
        el('span', { class: 'st' }, `PV ${short(m.stats.hp || 0)} · Vit ${short(m.stats.speed || 0)}`)]
        : el('span', { class: 'empty' }, '+ Ajouter'));
      col.append(btn);
    }
    grid.append(col);
  }
  root.append(grid);
  const errs = validateTeam(toTeam(t)).filter((e) => !e.includes('vide'));
  if (errs.length) root.append(el('div', { class: 'count bad' }, errs.join(' ')));
}

// ---------- Fiche d'un ninja ----------

const TARGET_LABEL = (t) => {
  if (!t || t === 'front-row') return 'la première ligne ennemie';
  if (typeof t === 'string') return { self: 'lui-même', allies: 'tous les alliés', enemies: 'tous les ennemis' }[t] || t;
  const side = t.side === 'ally' ? 'allié' : 'ennemi';
  const picks = { all: `tous les ${side}s`, 'lowest-hp': `l'${side} avec le moins de PV`, 'lowest-hp-pct': `l'${side} avec le plus faible % de PV`,
    'highest-hp': `l'${side} avec le plus de PV`, 'highest-atk': `l'${side} avec la plus forte attaque`, 'highest-speed': `l'${side} le plus rapide`,
    random: `${t.count || 1} ${side}(s) au hasard`, 'front-row': 'la première ligne', 'back-row': 'la dernière ligne' };
  let s = picks[t.pick || 'all'] || t.pick;
  if (t.role) s += ` (${ROLE_LABEL[t.role]})`;
  if (t.tag) s += ` [${t.tag}]`;
  return s;
};
function describeEffect(e) {
  const ch = e.chance != null && e.chance < 100 ? `${e.chance} % de chance : ` : '';
  const to = e.to === 'target' || !e.to ? 'la cible' : TARGET_LABEL(e.to);
  if (e.heal) return `${ch}soigne ${to} (${e.heal} %)`;
  if (e.penetration) return `${ch}pénétration ${e.penetration} % sur ${to}`;
  if (e.dot) return `${ch}${e.dot.name} ${e.dot.pct} % sur ${to} (${e.dot.duration} tours)`;
  if (e.fury) return `${ch}${e.fury > 0 ? '+' : ''}${e.fury} fury à ${to}`;
  if (e.cleanse) return `${ch}dissipe les ${e.cleanse}s de ${to}`;
  const st = STATUSES[e.status];
  return `${ch}${st ? st.name : e.name || 'effet'} sur ${to}${e.duration ? ` (${e.duration} tours)` : ''}`;
}
function describeNinja(n) {
  const parts = [];
  if (n.talents?.length) parts.push(`Talents : ${n.talents.map((t) => (t.mods || []).map((m) => `${m.stat} ${m.value > 0 ? '+' : ''}${m.value} %`).join(', ') + ` → ${TARGET_LABEL(t.to || 'self')}`).join(' ; ')}.`);
  if (n.special) {
    const s = n.special;
    parts.push(`Spéciale « ${s.name} » : ${s.noDamage ? 'sans dégâts' : `${s.skillPct} %`} sur ${TARGET_LABEL(s.target)}${s.effects?.length ? ', ' + s.effects.map(describeEffect).join(', ') : ''}.`);
  }
  return parts.join(' ');
}

function openEditor(ti, key) {
  const t = state.teams[ti];
  const row = ROWS.find((r) => r.key === key[0]);
  const current = t.slots[key];
  const draft = current ? structuredClone(current) : { ninjaId: '', stats: { ...SAMPLE_STATS }, equipment: [] };
  const form = $('#dlgForm');
  const options = NINJAS.filter((n) => n.role === row.role);
  const render = () => {
    const n = byId[draft.ninjaId];
    form.replaceChildren(
      el('div', { class: 'dlg-head' },
        el('h2', {}, `${t.name} · ${row.label}`),
        el('button', { class: 'btn small', value: 'cancel', type: 'submit' }, 'Fermer')),
      el('label', { class: 'field', for: 'f-ninja' }, 'Ninja',
        el('select', { id: 'f-ninja', onchange: (e) => { draft.ninjaId = e.target.value; render(); } },
          el('option', { value: '' }, '— choisir —'),
          options.map((o) => el('option', { value: o.id, selected: o.id === draft.ninjaId }, o.name)))),
      n ? el('div', { class: 'skill-desc' }, describeNinja(n) || 'Pas encore de compétence enregistrée.') : null,
      n?.isMain ? el('label', { class: 'field', for: 'f-type' }, 'Type d\'attaque',
        el('select', { id: 'f-type', onchange: (e) => { draft.attackType = e.target.value; } },
          el('option', { value: 'physical', selected: draft.attackType !== 'magic' }, 'Physique'),
          el('option', { value: 'magic', selected: draft.attackType === 'magic' }, 'Magique'))) : null,
      el('label', { class: 'field', for: 'f-label' }, 'Nom affiché (facultatif)',
        el('input', { type: 'text', id: 'f-label', value: draft.label || '', oninput: (e) => { draft.label = e.target.value; } })),
      el('div', { class: 'form-grid' }, STAT_FIELDS.map(([k, lbl]) => el('label', { for: `f-${k}` }, lbl,
        el('input', { class: 'num', id: `f-${k}`, inputmode: 'decimal', value: draft.stats[k] ?? '',
          oninput: (e) => { draft.stats[k] = parseNum(e.target.value); } })))),
      el('div', {}, el('div', { class: 'col-label' }, 'Équipements et accessoires'),
        el('div', { class: 'eq-list' }, EQUIPMENT.map((eq) => el('label', { for: `f-eq-${eq.id}` },
          el('input', { type: 'checkbox', id: `f-eq-${eq.id}`, checked: draft.equipment.includes(eq.id),
            onchange: (e) => { draft.equipment = e.target.checked ? [...draft.equipment, eq.id] : draft.equipment.filter((x) => x !== eq.id); } }),
          eq.name)))),
      el('div', { class: 'dlg-foot' },
        current ? el('button', { class: 'btn danger', type: 'button', onclick: () => { delete t.slots[key]; done(); } }, 'Retirer de la formation') : el('span'),
        el('button', { class: 'btn primary', type: 'button', onclick: () => {
          if (!draft.ninjaId) { $('#f-ninja').focus(); return; }
          if (byId[draft.ninjaId].isMain && !draft.attackType) draft.attackType = 'physical';
          t.slots[key] = draft; done();
        } }, 'Enregistrer')),
    );
  };
  const done = () => { save(); renderTeam(ti); $('#dlg').close(); };
  render();
  $('#dlg').showModal();
}

// ---------- Règles ----------

function renderRules() {
  const root = $('#rules');
  root.replaceChildren(...RULE_FIELDS.map(([k, lbl, type, opts]) => {
    const id = `r-${k}`;
    let input;
    if (type === 'bool') input = el('select', { id, onchange: (e) => { state.rules[k] = e.target.value === '1'; save(); } },
      el('option', { value: '1', selected: state.rules[k] }, 'Oui'), el('option', { value: '0', selected: !state.rules[k] }, 'Non'));
    else if (type === 'select') input = el('select', { id, onchange: (e) => { state.rules[k] = e.target.value; save(); } },
      opts.map(([v, l]) => el('option', { value: v, selected: state.rules[k] === v }, l)));
    else input = el('input', { type: 'number', id, value: state.rules[k], oninput: (e) => { state.rules[k] = parseNum(e.target.value); save(); } });
    return el('label', { for: id }, lbl, input);
  }), el('div', {}, el('button', { class: 'btn small', type: 'button', onclick: () => { state.rules = { ...DEFAULT_RULES }; save(); renderRules(); } }, 'Rétablir les valeurs par défaut')));
}

// ---------- Combat ----------

function checkTeams() {
  const A = toTeam(state.teams[0]), B = toTeam(state.teams[1]);
  const errs = [...validateTeam(A).map((e) => `${A.name} : ${e}`), ...validateTeam(B).map((e) => `${B.name} : ${e}`)];
  $('#err').textContent = errs.join(' ');
  return errs.length ? null : [A, B];
}

const MINOR = new Set(['effect', 'expire', 'info']);
function runOne() {
  const teams = checkTeams();
  if (!teams) return;
  const seed = Math.round(parseNum($('#seed').value));
  const r = simulate(teams[0], teams[1], { seed, rules: state.rules });
  const panel = $('#result');
  panel.hidden = false;
  const names = [teams[0].name, teams[1].name];
  const verdict = el('div', { class: 'verdict' },
    r.winner == null ? el('span', { class: 'who' }, 'Égalité')
      : el('span', { class: `who ${r.winner === 0 ? 'a' : 'b'}` }, `${names[r.winner]} gagne`),
    el('span', { class: 'note' }, `en ${r.rounds} round(s)${r.timeout ? ' · limite atteinte, victoire aux PV restants' : ''} · graine ${seed}`));
  const side = (team) => el('div', { class: 'side' }, el('div', { class: 'col-label' }, names[team]),
    r.units.filter((u) => u.team === team).map((u) => {
      const p = Math.max(0, (100 * u.hp) / u.maxHp);
      return el('div', { class: `unit${u.alive ? '' : ' dead'}` },
        el('span', {}, `${u.name} · ${ROLE_LABEL[u.role]}`),
        el('span', { class: 'pct' }, u.alive ? `${nf.format(p)} %` : 'K.O.'),
        el('div', { class: 'bar' }, el('i', { style: `width:${p}%;background:${p < 30 ? 'var(--hp-low)' : 'var(--hp)'}` })));
    }));
  const log = el('div', { class: 'log compact', id: 'logBox' });
  for (const l of r.log) {
    if (l.type === 'round') { log.append(el('div', { class: 'round' }, l.text)); continue; }
    const uid = l.actor || l.attacker || l.target || '';
    const teamCls = uid ? ` t${uid[0]}` : '';
    log.append(el('div', { class: `ln ${l.type}${teamCls}${MINOR.has(l.type) ? ' minor' : ''}` }, l.text));
  }
  const toggle = el('label', { class: 'inline', for: 'showMinor' },
    el('input', { type: 'checkbox', id: 'showMinor', onchange: (e) => log.classList.toggle('compact', !e.target.checked) }),
    'Afficher buffs, debuffs et détails');
  panel.replaceChildren(el('h2', {}, 'Résultat du combat'), verdict,
    el('div', { class: 'final' }, side(0), side(1)),
    el('div', { class: 'log-tools' }, el('h2', {}, 'Déroulement'), toggle), log);
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function runMany() {
  const teams = checkTeams();
  if (!teams) return;
  const n = Math.min(20000, Math.max(10, Math.round(parseNum($('#manyN').value))));
  const seed = Math.round(parseNum($('#seed').value));
  const r = simulateMany(teams[0], teams[1], n, { seed, rules: state.rules });
  const pa = (100 * r.wins[0]) / n, pb = (100 * r.wins[1]) / n, pd = (100 * r.draws) / n;
  const panel = $('#manyPanel');
  panel.hidden = false;
  const seg = (cls, p, txt) => (p > 0 ? el('div', { class: cls, style: `width:${p}%` }, p >= 8 ? txt : '') : null);
  panel.replaceChildren(
    el('h2', {}, `Sur ${nf.format(n)} combats`),
    el('div', { class: 'winbar', role: 'img', 'aria-label': `${teams[0].name} ${nf.format(pa)} %, ${teams[1].name} ${nf.format(pb)} %, égalités ${nf.format(pd)} %` },
      seg('wa', pa, `${nf.format(pa)} %`), seg('wd', pd, `${nf.format(pd)} %`), seg('wb', pb, `${nf.format(pb)} %`)),
    el('div', { class: 'stats-line' },
      el('span', {}, `${teams[0].name} : `, el('b', {}, `${nf.format(pa)} %`)),
      el('span', {}, `${teams[1].name} : `, el('b', {}, `${nf.format(pb)} %`)),
      el('span', {}, 'Égalités : ', el('b', {}, `${nf.format(pd)} %`)),
      el('span', {}, 'Durée moyenne : ', el('b', {}, `${nf.format(r.avgRounds)} rounds`)),
      el('span', {}, 'Décidés aux PV (limite de rounds) : ', el('b', {}, `${nf.format((100 * r.timeouts) / n)} %`))),
  );
}

$('#runOne').addEventListener('click', runOne);
$('#runMany').addEventListener('click', runMany);
renderTeam(0);
renderTeam(1);
renderRules();
