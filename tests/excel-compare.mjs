// Compare formulas.js au fichier Excel d'origine, recalculé par LibreOffice.
// Usage : node tests/excel-compare.mjs <chemin.xlsx> <dossier de travail>
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import * as F from '../formulas.js';

const [xlsx, work] = process.argv.slice(2);
mkdirSync(work, { recursive: true });
let seed = 42;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const ri = (a, b) => Math.floor(a + rnd() * (b - a + 1));
const N = 40;
const cases = [];
for (let i = 0; i < N; i++) {
  const ignore = [ri(0, 30), ri(0, 1) * ri(0, 20), 0, 0, ri(0, 1) * 10];
  const c = {
    B5: ri(20e6, 60e6), B6: ri(200, 600), B7: ri(3e6, 15e6), B8: ri(100, 400), B9: ri(80, 122), B12: ri(100, 400),
    B17: ri(0, 30), B18: ri(50, 300),
    E7: ri(0, 50), E8: ri(0, 30), E9: 0, E10: ri(0, 20), E11: 0, E12: ri(0, 40), E13: ri(0, 1) * 15,
    E19: ri(0, 20), E20: 0, E21: 0, E22: 0, E23: 0, E24: ri(0, 30), E25: ri(0, 10), E26: 0, E27: 0, E28: ri(0, 1) * 10,
    H7: ri(0, 40), H8: 0, H9: ri(0, 20), H10: 0, H11: 0, H12: ri(0, 30), H13: ri(0, 1) * 15,
    H19: ri(0, 30), H20: 0, H21: 0, H22: 0, H23: 0, H24: ri(0, 30), H25: ri(0, 1) * 20,
    H14: ri(0, 1) * 10, H15: 0, H16: 0,
    H26: ignore[0], H27: ignore[1], H28: ignore[2], H29: ignore[3], H30: ignore[4],
    K7: ri(0, 60), K8: 0, K9: 0, K10: 0, K11: 0, K12: ri(0, 30), K13: ri(0, 1) * 30,
    K19: ri(0, 25), K20: 0, K21: 0, K22: 0, K23: 0, K24: ri(0, 20),
    N7: ri(0, 50), N8: 0, N9: 0, N10: 0, N11: 0, N12: ri(0, 20), N13: ri(0, 1) * 35,
    N19: ri(0, 20), N20: 0, N21: 0, N22: 0, N23: 0, N24: ri(0, 20), N25: ri(0, 1) * 30,
    Q7: ri(0, 40), Q8: 0, Q9: 0, Q10: 0, Q11: 0, Q12: ri(0, 30), Q13: ri(0, 1) * 30,
    Q19: ri(0, 40), Q20: 0, Q21: 0, Q22: 0, Q23: 0, Q24: ri(0, 1) * 20,
    T7: ri(0, 30), T8: 0, T9: 0, T10: 0, T11: 0, T12: 0, T13: ri(0, 1) * 30,
    H2: ri(0, 50), H3: ri(0, 30),
    K29: ri(50, 200), N28: ri(0, 30), N29: 0, N30: 0, Q28: ri(0, 30), Q29: 0, Q30: 0, Q31: ri(0, 1) * 30,
    E33: ri(50, 300), H36: ri(0, 30), H37: 0, H38: 0, H39: 0, H40: 0, H41: ri(0, 20), H42: ri(0, 1) * 40,
    K34: ri(0, 20), K35: 0, K36: 0, K37: 0, K38: 0, K39: ri(0, 1) * 30, K40: ri(0, 30),
    // onglet Speed (en fraction dans Excel)
    S_F2: ri(10e6, 20e6), S_B2: ri(0, 120), S_B3: ri(0, 60), S_C6: ri(0, 30), S_B10: ri(0, 1) * 15, S_C11: ri(0, 1) * 20,
  };
  cases.push(c);
}
writeFileSync(`${work}/cases.json`, JSON.stringify(cases));
const py = `
import json, sys, openpyxl
cases = json.load(open(sys.argv[2]))
for i, c in enumerate(cases):
    wb = openpyxl.load_workbook(sys.argv[1])
    d, s = wb['Dmg'], wb['Speed']
    for k, v in c.items():
        if k.startswith('S_'):
            cell = k[2:]
            s[cell] = v if cell.startswith('F') else v / 100
        elif k == 'B17':
            d[k] = v / 100
        else:
            d[k] = v
    wb.save(f"{sys.argv[3]}/in/case{i}.xlsx")
`;
mkdirSync(`${work}/in`, { recursive: true });
mkdirSync(`${work}/out`, { recursive: true });
writeFileSync(`${work}/fill.py`, py);
execFileSync('python3', ['-I', `${work}/fill.py`, xlsx, `${work}/cases.json`, work]);
const files = cases.map((_, i) => `${work}/in/case${i}.xlsx`);
execFileSync('soffice', ['--headless', '--convert-to', 'xlsx', '--outdir', `${work}/out`, ...files], { stdio: 'ignore' });
const rd = `
import json, sys, openpyxl
res = []
for i in range(int(sys.argv[2])):
    wb = openpyxl.load_workbook(f"{sys.argv[1]}/out/case{i}.xlsx", data_only=True)
    d, s = wb['Dmg'], wb['Speed']
    res.append({k: d[k].value for k in ['E1','H1','E6','H6','K6','N6','Q6','B16','K28','E34','E35','H34','H35']} | {'SG2': s['G2'].value})
print(json.dumps(res))
`;
writeFileSync(`${work}/read.py`, rd);
const excel = JSON.parse(execFileSync('python3', ['-I', `${work}/read.py`, work, String(N)]).toString());

const s = (c, ks) => ks.map((k) => c[k]);
let fails = 0, skippedExcelBug = 0;
cases.forEach((c, i) => {
  const ex = excel[i];
  const atkTalents = [...s(c, ['E7', 'E8', 'E9', 'E10', 'E11']), ...s(c, ['E19', 'E20', 'E21', 'E22', 'E23']).map((v) => -v)];
  const atkEff = F.effectiveAttack({ atk: c.B5, talents: atkTalents, icons: c.E12 + c.E13 - c.E24 - c.E25 - c.E26 - c.E27 - c.E28 });
  const defTalents = [...s(c, ['H7', 'H8', 'H9', 'H10', 'H11']), ...s(c, ['H19', 'H20', 'H21', 'H22', 'H23']).map((v) => -v)];
  const ignore = c.H26 + c.H27 + c.H28 + c.H29 + c.H30, immune = c.H14 + c.H15 + c.H16;
  const cells = [c.H14, c.H15, c.H16, c.H26, c.H27, c.H28, c.H29, c.H30];
  const defX = F.effectiveDefense({ def: c.B7, talents: defTalents, icons: c.H12 + c.H13 - c.H24 - c.H25, ignoreDef: ignore, immuneIgnoreDef: immune, ignoreDefCells: cells, mode: 'excel' });
  const drEff = F.effectiveRate(c.B6, [c.K7, c.K12, c.K13, -c.K19, -c.K24]);
  const airEff = F.effectiveRate(c.B8, [c.N7, c.N12, c.N13, -c.N19, -c.N24, -c.N25]);
  const fin = F.finalDamageBonus({ bonus: c.Q7 + c.Q12 + c.Q13, reduction: c.Q19 + c.Q24, decreaseReduction: c.T7 + c.T13 });
  const dmg = F.hitDamage({ atkEff, defEff: defX, skillPct: c.B12, drEff, airEff, fury: c.B9, finalBonus: fin });
  const crit = dmg * F.critMultiplier(c.H2, c.H3);
  const dotAtk = F.effectiveAttack({ atk: c.B5, talents: atkTalents, icons: c.E12 + c.E13 - c.E24 });
  const dot = c.B5 * atkTalents.reduce((a, v) => a * (1 + v / 100), 1) * (1 + (c.E12 + c.E13 - c.E24) / 100) * c.B18 / 100 - defX * c.B17 / 100; // Excel ne borne pas à 0
  const atkT = F.effectiveAttack({ atk: c.B5, talents: atkTalents, icons: 0 });
  const pen = atkT * (c.K29 / 100 + c.N28 / 100 - (c.Q28 / 100) * (1 + c.Q31 / 100));
  const rrV = F.recoveryRate({ bonuses: [c.H36, c.H41, c.H42], maluses: [c.K34], isVanguard: false, upwind: c.K39 });
  const rrA = F.recoveryRate({ bonuses: [c.H36, c.H41], maluses: [c.K34], isVanguard: false, upwind: c.K39 });
  const healerDr = c.B6 + c.K7 - c.K19 - c.K24;
  const heal = (rr) => F.healAmount({ atkTalentOnly: atkT, atkDebuffIcon: c.E24, healerDr, targetRecoveryRate: rr, healPct: c.E33, fury: c.B9, healDebuff: c.K40 });
  const spd = F.battleSpeed({ speed: c.S_F2, talents: [c.S_B2, c.S_B3, -c.S_C6], icons: c.S_B10 - c.S_C11 });
  const checks = { E6: atkEff, H6: defX, K6: drEff, N6: airEff, Q6: fin, E1: dmg, H1: crit, B16: dot, K28: pen, H34: rrV, H35: rrA, E34: heal(rrV), E35: heal(rrA), SG2: spd };
  for (const [k, mine] of Object.entries(checks)) {
    const ref = ex[k];
    const rel = Math.abs(mine - ref) / Math.max(1, Math.abs(ref));
    if (rel > 1e-9) { fails++; console.log(`cas ${i} ${k}: moi=${mine} excel=${ref}`); }
  }
  if (immune >= ignore) skippedExcelBug++;
  // Vérifie aussi que le mode corrigé == Excel quand ignore > immunité
  if (ignore > immune) {
    const defC = F.effectiveDefense({ def: c.B7, talents: defTalents, icons: c.H12 + c.H13 - c.H24 - c.H25, ignoreDef: ignore, immuneIgnoreDef: immune });
    if (Math.abs(defC - defX) > 1e-6) { fails++; console.log(`cas ${i}: mode corrigé diffère`); }
  }
});
console.log(`${N} cas, ${N * 14} valeurs comparées, ${fails} écart(s). (${skippedExcelBug} cas dans la zone du bug défense, reproduit en mode 'excel')`);
process.exit(fails ? 1 : 0);
