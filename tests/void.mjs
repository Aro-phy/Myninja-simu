// Vide : pas de dégâts de compétence spéciale, mais les attaques normales touchent.
import assert from 'node:assert/strict';
import { simulate } from '../engine.js';
import { NINJAS, SAMPLE_STATS } from '../data.js';
const by = Object.fromEntries(NINJAS.map((n) => [n.id, n]));
const st = { ...SAMPLE_STATS, hp: 5e9, air: 460, hit: 999 };
const r = simulate(
  // Hyakki pose Vide sur B, puis un allié de A lance sa spéciale sur B : ses dégâts de compétence sont évités.
  { name: 'A', members: [{ ninja: by['hyakki-sasori'], pos: 0, stats: { ...st, fury: 0, speed: 9e9 } },
    { ninja: by['kawaki'], pos: 0, stats: { ...st, fury: 100, speed: 8e9 } }] },
  { name: 'B', members: [{ ninja: by['sasuke-taka'], pos: 0, stats: { ...st, fury: 100 } }] },
  { seed: 3, rules: { maxRounds: 2 } });
const txt = r.log.map((l) => l.text);
assert.ok(txt.some((t) => t.includes('reçoit Vide')), 'Vide posé');
assert.ok(txt.some((t) => t.includes('(Vide)')), 'dégâts de spéciale évités');
console.log(txt.filter((t) => /Vide/.test(t)).slice(0, 3).join('\n'));
console.log('test Vide OK');
