// Étapes 2 et 3 : optimise l'équipement des TOP meilleures compositions du tournoi (et des formations ajoutées),
// puis tournoi entre toutes les formations optimisées.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { winRate, toTeam, describe, describeEq, byId } from './common.mjs';
import { REFERENCE } from './reference.mjs';
const [, , finalFile, dir, ...extra] = process.argv;
const TOP = Number(process.env.TOP || 10);
const table = JSON.parse(readFileSync(finalFile, 'utf8')).table.slice(0, TOP).map((x) => x.g);
const forms = [...table, ...extra.map((f) => JSON.parse(readFileSync(f, 'utf8')))];
const oppFile = `${dir}/top-opponents.json`;
writeFileSync(oppFile, JSON.stringify(forms));
const tuned = [];
forms.forEach((g, i) => {
  const f = `${dir}/top-${i}.json`, out = `${dir}/top-${i}-tuned.json`;
  writeFileSync(f, JSON.stringify(g));
  execFileSync('node', [new URL('./tune-equip.mjs', import.meta.url).pathname, f, oppFile], { env: { ...process.env, OUT: out, N: '30', PASSES: '1' }, stdio: 'ignore' });
  tuned.push(JSON.parse(readFileSync(out, 'utf8')));
  console.error(`optimisée ${i + 1}/${forms.length}`);
});
const pool = [...tuned, ...REFERENCE];
const res = tuned.map((g, i) => {
  const r = pool.map((o, j) => (j === i ? null : winRate(toTeam(g, 'A'), toTeam(o, 'B'), 200, 55555 + i * 101 + j)));
  const v = r.filter((x) => x != null);
  return { g, s: v.reduce((a, b) => a + b) / v.length, r };
}).sort((a, b) => b.s - a.s);
res.forEach((x, k) => {
  console.log(`\n${k + 1}. ${(x.s * 100).toFixed(1)} %  ${describe(x.g)}`);
  for (const id of ['main', x.g.v, ...x.g.a, ...x.g.s].filter(Boolean)) console.log(`      ${id === 'main' ? 'Perso principal' : byId[id].name} : ${describeEq(x.g, id)}`);
});
writeFileSync(`${dir}/top-final.json`, JSON.stringify(res, null, 1));
