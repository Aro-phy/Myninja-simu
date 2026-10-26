import { simulate, simulateMany, validateTeam, resolveKit, DEFAULT_RULES, ROLE_LABEL, NATURES } from './engine.js';
import { NINJAS, SAMPLE_STATS } from './data.js';
import { GEAR_SETS, ACCESSORY_SETS, GEAR_SLOTS, ACC_SLOTS, equipmentEntries, slotsToChoice, choiceToSlots } from './equipment.js';
import * as D from './describe.js';

const STORE_KEY = 'myninja-sim-v3';
const RULES_VERSION = 2; // incrémenté quand les règles par défaut changent
const byId = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
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
  ['punchChains', 'Un ninja qui agit grâce au Tour Bonus peut en déclencher un autre', 'bool'],
  ['aidEnabled', 'Activer l\'Aide (mécanique non confirmée)', 'bool'],
  ['aidDamagePct', 'Aide : dégâts (% d\'une attaque normale)', 'number'],
  ['maxRounds', 'Limite de rounds (puis victoire aux PV restants)', 'number'],
  ['defenseMode', 'Formule de défense', 'select', [['corrected', 'Corrigée'], ['excel', 'Identique à l\'Excel']]],
  ['applyBaseLine', 'Ajouter la ligne de base du talent (vitesse, Dégâts, Absorption propres) aux stats saisies', 'bool'],
  ['selfStatsInPanel', 'Les bonus fixes « self » sur les stats de l\'écran du ninja sont déjà dans les stats saisies', 'bool'],
  ['roleFallback', 'Attaque sur un poste vide : viser la première ligne', 'bool'],
];

// ---------- État ----------

const demoStats = (over = {}) => ({ ...SAMPLE_STATS, air: 460, ...over });
function demoState() {
  return {
    teams: [
      { name: 'Ma formation', slots: {
        V0: { ninjaId: 'hinata-soccer', nature: 'earth', stats: demoStats({ hp: 90e6, pdef: 14e6, mdef: 11e6 }) },
        A0: { ninjaId: 'main', stats: demoStats(), equipment: [], attackType: 'physical' },
        A1: { ninjaId: 'sasuke-taka', nature: 'earth', stats: demoStats({ speed: 15e6 }) },
        S0: { ninjaId: 'kamado-nezuko', nature: 'earth', stats: demoStats({ hp: 55e6 }) },
        S1: { ninjaId: 'uchiha-sarada', nature: 'earth', stats: demoStats({ hp: 55e6 }) },
      } },
      { name: 'Équipe visée', slots: {
        A0: { ninjaId: 'main', stats: demoStats(), equipment: [], attackType: 'physical' },
        A1: { ninjaId: 'eveil-de-kawaki', nature: 'thunder', stats: demoStats({ speed: 14.6e6 }) },
        A2: { ninjaId: 'hashirama-madara', nature: 'thunder', stats: demoStats({ hp: 80e6 }) },
        S0: { ninjaId: 'xmas-temari', nature: 'thunder', stats: demoStats({ hp: 55e6 }) },
        S1: { ninjaId: 'natsu-dragneel', nature: 'thunder', stats: demoStats({ hp: 55e6 }) },
      } },
    ],
    rules: { ...DEFAULT_RULES },
    rulesVersion: RULES_VERSION,
  };
}

let state = load() || demoState();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.teams) {
      // Règles par défaut modifiées depuis la sauvegarde : on repart des nouvelles valeurs.
      s.rules = s.rulesVersion === RULES_VERSION ? { ...DEFAULT_RULES, ...s.rules } : { ...DEFAULT_RULES };
      s.rulesVersion = RULES_VERSION;
      return s;
    }
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
      nature: byId[m.ninjaId].isMain ? 'none' : m.nature || 'none', natureLevel: m.natureLevel || 1, awakening: m.awakening,
      equipment: equipmentEntries(slotsToChoice(m.equip || choiceToSlots(m.gear))),
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
        el('span', { class: 'st' }, `${n.isMain ? 'Principal' : `${NATURES[m.nature || 'none']}${m.nature && m.nature !== 'none' ? ` niv. ${m.natureLevel || 1}` : ''}`} · PV ${short(m.stats.hp || 0)}`)]
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

function kitView(n, level) {
  const kit = resolveKit(n, level);
  const section = (title, items) => (items.length ? el('div', { class: 'kit-sec' }, el('div', { class: 'col-label' }, title), el('ul', {}, items.map((t) => el('li', {}, t)))) : null);
  const aw = (n.awakenings || []).map((a, i) => `${i < kit.level ? '✔' : '✘'} ${a.name}${a.replacePrevious ? ' (remplace l\'éveil précédent)' : ''}`);
  return el('div', { class: 'kit' },
    n.base ? el('div', { class: 'note' }, `Ligne de base : vitesse ${n.base.speed ?? 0} %, Dégâts ${n.base.dr ?? 0} %, Absorption ${n.base.air ?? 0} % (considérée comme déjà incluse dans les stats saisies).`) : null,
    section('Talents actifs', kit.talents.map(D.talent).filter(Boolean)),
    section('Éveils', aw),
    kit.normal?.effects?.length || kit.normal?.hits ? section('Attaque normale', D.skill(kit.normal)) : null,
    section(`Spéciale${kit.special?.name ? ` · ${kit.special.name}` : ''}`, D.skill(kit.special)));
}

// Équipement pièce par pièce (6 cases) et accessoires (8 cases, par paires), avec une liste de sets
// défilante et une barre de recherche pour équiper la case sélectionnée.
const gearById = Object.fromEntries(GEAR_SETS.map((g) => [g.id, g]));
const accById = Object.fromEntries(ACCESSORY_SETS.map((a) => [a.id, a]));
const shortName = (set) => set.name.replace(/^Accessoires /, '');
const norm = (x) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function gearView(draft) {
  const eq = draft.equip;
  const root = el('div', { class: 'gear' });
  let sel = { kind: 'gear', i: 0 };
  let query = '';
  const bonusList = (entries) => el('ul', {}, entries.map((t) => el('li', {}, D.talent(t))).filter((li) => li.textContent));

  const box = (kind, i, label) => {
    const id = eq[kind][i];
    const set = id && (kind === 'gear' ? gearById : accById)[id];
    const active = sel.kind === kind && sel.i === i;
    return el('button', { type: 'button', class: `eq-box${set ? ' filled' : ''}${active ? ' active' : ''}`, id: `eqb-${kind}-${i}`,
      'aria-pressed': active ? 'true' : 'false',
      onclick: () => { sel = { kind, i }; render(); setTimeout(() => root.querySelector('#eq-search')?.focus(), 0); } },
    el('span', { class: 'eq-slot' }, label),
    el('span', { class: 'eq-name' }, set ? shortName(set) : 'Vide'));
  };

  const equip = (id, all) => {
    if (all) eq[sel.kind] = eq[sel.kind].map(() => id);
    else {
      eq[sel.kind][sel.i] = id;
      const n = eq[sel.kind].length;
      if (id && sel.i < n - 1) sel = { kind: sel.kind, i: sel.i + 1 }; // passe à la case suivante
    }
    render();
  };

  const picker = () => {
    const sets = sel.kind === 'gear' ? GEAR_SETS : ACCESSORY_SETS;
    const list = sets.filter((x) => !query || norm(shortName(x)).includes(norm(query)))
      .sort((a, b) => shortName(a).localeCompare(shortName(b)));
    const slotLabel = sel.kind === 'gear' ? `Équipement · ${GEAR_SLOTS[sel.i]}` : `Accessoire · ${ACC_SLOTS[sel.i].label} ${sel.i % 2 + 1}`;
    const items = list.map((x) => el('li', {},
      el('button', { type: 'button', class: 'eq-pick', onclick: () => equip(x.id) }, shortName(x)),
      el('button', { type: 'button', class: 'eq-all', title: 'Équiper toutes les cases', onclick: () => equip(x.id, true) },
        sel.kind === 'gear' ? '×6' : '×8')));
    const search = el('input', { type: 'search', id: 'eq-search', placeholder: 'Rechercher un set…', value: query, autocomplete: 'off',
      oninput: (e) => { query = e.target.value; const ul = root.querySelector('.eq-list-scroll'); ul.replaceChildren(...picker().querySelector('.eq-list-scroll').children); } });
    return el('div', { class: 'eq-picker' },
      el('div', { class: 'eq-picker-head' }, el('strong', {}, slotLabel),
        el('button', { type: 'button', class: 'btn small', onclick: () => equip(null) }, 'Retirer la pièce')),
      search,
      el('ul', { class: 'eq-list-scroll' }, items.length ? items : [el('li', { class: 'note' }, 'Aucun set ne correspond.')]));
  };

  const summary = () => {
    const entries = equipmentEntries(slotsToChoice(eq));
    if (!entries.length) return el('p', { class: 'note' }, 'Aucun bonus actif : il faut au moins 2 pièces du même équipement, ou les 2 accessoires d\'une même paire.');
    return el('div', { class: 'eq-active' }, el('div', { class: 'col-label' }, 'Bonus actifs'),
      ...entries.map((e) => el('details', {}, el('summary', {}, e.name), bonusList(e.talents))));
  };

  const render = () => {
    const focusSearch = document.activeElement?.id === 'eq-search';
    root.replaceChildren(
      el('div', { class: 'col-label' }, 'Équipement'),
      el('div', { class: 'eq-grid eq-grid-gear' }, GEAR_SLOTS.map((l, i) => box('gear', i, l))),
      el('div', { class: 'col-label' }, 'Accessoires (une paire = les 2 cases d\'une colonne)'),
      el('div', { class: 'eq-grid eq-grid-acc' }, [0, 2, 4, 6].map((i) => el('div', { class: 'eq-pair' },
        box('acc', i, `${ACC_SLOTS[i].label} 1`), box('acc', i + 1, `${ACC_SLOTS[i].label} 2`)))),
      picker(),
      summary(),
      el('p', { class: 'note' }, 'Les bonus de stats visibles à l\'écran du ninja (et les Force, Agilité, Chakra, Puissance) sont déjà comptés dans les stats saisies : seuls les autres effets s\'appliquent en combat.'));
    if (focusSearch) { const s = root.querySelector('#eq-search'); s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
  };
  render();
  return root;
}

function openEditor(ti, key) {
  const t = state.teams[ti];
  const row = ROWS.find((r) => r.key === key[0]);
  const current = t.slots[key];
  const draft = current ? structuredClone(current) : { ninjaId: '', stats: { ...SAMPLE_STATS } };
  if (!draft.equip) draft.equip = choiceToSlots(draft.gear);
  delete draft.gear;
  const form = $('#dlgForm');
  const options = NINJAS.filter((n) => n.role === row.role);
  const render = () => {
    const n = byId[draft.ninjaId];
    form.replaceChildren(...[
      el('div', { class: 'dlg-head' },
        el('h2', {}, `${t.name} · ${row.label}`),
        el('button', { class: 'btn small', value: 'cancel', type: 'submit' }, 'Fermer')),
      el('label', { class: 'field', for: 'f-ninja' }, 'Ninja',
        el('select', { id: 'f-ninja', onchange: (e) => { draft.ninjaId = e.target.value; render(); } },
          el('option', { value: '' }, '— choisir —'),
          options.map((o) => el('option', { value: o.id, selected: o.id === draft.ninjaId }, o.name)))),
      n ? el('div', { class: 'two' },
        n.isMain ? null : el('label', { class: 'field', for: 'f-nature' }, 'Nature de chakra',
          el('select', { id: 'f-nature', onchange: (e) => { draft.nature = e.target.value; } },
            Object.entries(NATURES).map(([k, v]) => el('option', { value: k, selected: (draft.nature || 'none') === k }, v)))),
        n.isMain ? null : el('label', { class: 'field', for: 'f-nlvl' }, 'Niveau de nature',
          el('input', { type: 'number', id: 'f-nlvl', min: 1, max: 30, value: draft.natureLevel || 1,
            oninput: (e) => { draft.natureLevel = Math.max(1, Math.round(parseNum(e.target.value))); } })),
        n.awakenings?.length ? el('label', { class: 'field', for: 'f-aw' }, 'Niveau d\'éveil',
          el('select', { id: 'f-aw', onchange: (e) => { draft.awakening = Number(e.target.value); render(); } },
            Array.from({ length: n.awakenings.length + 1 }, (_, i) => el('option', { value: i, selected: (draft.awakening ?? n.awakenings.length) === i }, i === 0 ? 'Aucun' : `${i} · ${n.awakenings[i - 1].name}`)))) : null) : null,
      n ? el('details', { class: 'skill-desc' }, el('summary', {}, 'Talents et compétences (vérifier la transcription)'), kitView(n, draft.awakening)) : null,
      n?.isMain ? el('label', { class: 'field', for: 'f-type' }, 'Type d\'attaque',
        el('select', { id: 'f-type', onchange: (e) => { draft.attackType = e.target.value; } },
          el('option', { value: 'physical', selected: draft.attackType !== 'magic' }, 'Physique'),
          el('option', { value: 'magic', selected: draft.attackType === 'magic' }, 'Magique'))) : null,
      el('label', { class: 'field', for: 'f-label' }, 'Nom affiché (facultatif)',
        el('input', { type: 'text', id: 'f-label', value: draft.label || '', oninput: (e) => { draft.label = e.target.value; } })),
      el('div', { class: 'form-grid' }, STAT_FIELDS.map(([k, lbl]) => el('label', { for: `f-${k}` }, lbl,
        el('input', { class: 'num', id: `f-${k}`, inputmode: 'decimal', value: draft.stats[k] ?? '',
          oninput: (e) => { draft.stats[k] = parseNum(e.target.value); } })))),
      gearView(draft),
      el('div', { class: 'dlg-foot' },
        current ? el('button', { class: 'btn danger', type: 'button', onclick: () => { delete t.slots[key]; done(); } }, 'Retirer de la formation') : el('span'),
        el('button', { class: 'btn primary', type: 'button', onclick: () => {
          if (!draft.ninjaId) { $('#f-ninja').focus(); return; }
          if (byId[draft.ninjaId].isMain && !draft.attackType) draft.attackType = 'physical';
          t.slots[key] = draft; done();
        } }, 'Enregistrer')),
    ].filter(Boolean));
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

// Simulation par paquets pour garder la page réactive, avec progression affichée.
async function runMany() {
  const teams = checkTeams();
  if (!teams) return;
  const n = Math.min(20000, Math.max(10, Math.round(parseNum($('#manyN').value))));
  const seed = Math.round(parseNum($('#seed').value));
  const btn = $('#runMany');
  btn.disabled = true;
  const r = { n, wins: [0, 0], draws: 0, timeouts: 0, rounds: 0 };
  for (let i = 0; i < n; i += 50) {
    const part = simulateMany(teams[0], teams[1], Math.min(50, n - i), { seed: seed + i, rules: state.rules });
    r.wins[0] += part.wins[0]; r.wins[1] += part.wins[1]; r.draws += part.draws; r.timeouts += part.timeouts; r.rounds += part.rounds;
    btn.textContent = `Simulation… ${Math.min(n, i + 50)} / ${n}`;
    await new Promise((res) => setTimeout(res, 0));
  }
  r.avgRounds = r.rounds / n;
  btn.disabled = false;
  btn.textContent = 'Simuler plusieurs combats';
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
