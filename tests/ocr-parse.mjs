// Analyse du texte reconnu sur une capture des stats (texte réel lu par tesseract.js).
import assert from 'node:assert/strict';
import { parseStats } from '../ocr.js';
const text = `Force 730981 Chakra 4633855
Endurance 26349612 Agilité 6398152
Vie 72284592 Vitesse 24156684

Atq Magique 25928334 = Furie Initiale 103
Def Physique - 5550828 DefMagique … 8283397
Dégats 409.4% Absorption 290.5%
Précision 355.5% Esquive 62.3%
Critique 90% Contre 90%
Attaque S 90% Bloquage 81%

| Tour Bonus 93.8% Aide 42.8%`;
const r = parseStats(text);
assert.deepEqual(r.stats, {
  hp: 72284592, patk: 0, matk: 25928334, pdef: 5550828, mdef: 8283397, speed: 24156684, fury: 103,
  dr: 409.4, air: 290.5, hit: 355.5, dodge: 62.3, crit: 90, antiCrit: 90, sAtk: 90, block: 81, extraTurn: 93.8, aid: 42.8,
});
assert.deepEqual(r.missing, []);
const r2 = parseStats('Vie 1000\nAtq Physique 5000\nBlocage 12,5%');
assert.equal(r2.stats.patk, 5000);
assert.equal(r2.stats.block, 12.5);
assert.ok(r2.missing.includes('aid'));
assert.equal(r2.stats.matk, 0);
// Texte réel lu dans le navigateur (« Atg » au lieu de « Atq », virgules décimales).
const r3 = parseStats(`Vie 72284592 Vitesse 24156684

Atg Magique 25928334  Furie Initiale 103
Def Physique 5550828 — DefMagique 8283397
Tour Bonus 93,8% Aide 42,8%`);
assert.equal(r3.stats.matk, 25928334);
assert.equal(r3.stats.patk, 0);
assert.equal(r3.stats.extraTurn, 93.8);
assert.equal(r3.stats.aid, 42.8);
console.log('test lecture des stats OK');
