// Analyse du texte reconnu sur une capture des stats (textes réels lus par tesseract.js, puis erreurs de lecture simulées).
import assert from 'node:assert/strict';
import { parseStats } from '../ocr.js';
const expected = {
  hp: 72284592, atk: 25928334, pdef: 5550828, mdef: 8283397, speed: 24156684, fury: 103,
  dr: 409.4, air: 290.5, hit: 355.5, dodge: 62.3, crit: 90, antiCrit: 90, sAtk: 90, block: 81, extraTurn: 93.8, aid: 42.8,
};
const check = (text, name) => {
  const r = parseStats(text);
  assert.deepEqual(r.stats, expected, name);
  assert.deepEqual(r.missing, [], name);
};
check(`Force 730981 Chakra 4633855
Endurance 26349612 Agilité 6398152
Vie 72284592 Vitesse 24156684

Atq Magique 25928334 = Furie Initiale 103
Def Physique - 5550828 DefMagique … 8283397
Dégats 409.4% Absorption 290.5%
Précision 355.5% Esquive 62.3%
Critique 90% Contre 90%
Attaque S 90% Bloquage 81%

| Tour Bonus 93.8% Aide 42.8%`, 'node');
check(`Force 730981 Chakra 4633855
Endurance 26349612 Agilité 6398152
Vie 72284592 Vitesse 24156684

Atg Magique 25928334  Furie Initiale 103
Def Physique 5550828 — DefMagique 8283397
Dégats 409.4% Absorption 290.5%
Précision 355.5% Esquive 62.3%
Critique 90% Contre 90%
Attaque S 90% Bloquage 81%
Tour Bonus 93,8% Aide 42,8%`, 'navigateur');
// erreurs de lecture plausibles sur les libellés
check(`Vie 72284592 Vitesse 24156684
Atq Physlque 25928334 Furie lnitiale 103
Dcf Physiquc 5550828 Def Magiquc 8283397
Degats 409.4% Absorptlon 290.5%
Precislon 355.5% Esqulve 62.3%
Critlque 90% Contre 90%
Attaque S 90% Blocage 81%
l Tour Bonus 93.8% Alde 42.8%`, 'erreurs');
const r2 = parseStats('Vie 1000\nAttaque 5000');
assert.equal(r2.stats.atk, 5000);
assert.ok(r2.missing.includes('pdef'));
console.log('test lecture des stats OK');
