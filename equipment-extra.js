// Sets lus dans la 2e vidéo des fils Discord « gear-and-accessories ».
// Mêmes conventions que equipment.js (les stats de l'écran du ninja sont ignorées par le moteur).
import { ALLIES, ALLIES_BUT_SELF, ENEMIES, SELF, ATTACKER, rand, role, nature, lowestHp, highestHp, m, buff, debuff, st, fixed } from './ninjas/helpers.js';

const self = (...mods) => ({ to: SELF, mods });
const attacked = (chance, ...effects) => ({ on: 'attacked', ...(chance < 100 ? { chance } : {}), effects });
const afterSkill = (...effects) => ({ on: 'skill', effects });
const afterAttack = (chance, ...effects) => ({ on: 'acted', ...(chance < 100 ? { chance } : {}), effects });
const together = (chance, ...effects) => ({ chance, oneOf: [effects] });
const C = { cleansable: true };
const p = (id, ...talents) => ({ id, name: { force: 'Force', chakra: 'Chakra', agility: 'Agilité', power: 'Puissance' }[id], talents });
const WATER = nature('ally', 'water');

export const GEAR_SETS_2 = [
  { id: 'gear-moonlit', name: 'Moonlit', tiers: {
    2: [self(m('atk', 20), m('dr', 30))],
    4: [self(m('hp', 30), m('weakenAtk', 30))],
    6: [self(m('dr', 40), m('atk', 20)), afterSkill({ to: ENEMIES, penetration: 50, attackType: 'physical' })],
  } },
  { id: 'gear-yaksa', name: 'Yaksa', tiers: {
    2: [self(m('hp', 30), m('finalDmg', 20))],
    4: [self(m('atk', 30), m('air', 40)), afterSkill(st(rand('enemy', 1), 'corrosion', 2))],
    6: [self(m('dr', 40), m('weakenAtk', 30)), afterSkill(fixed(debuff(rand('enemy', 2), 2, [m('recoveryCut', 40)])))],
  } },
  { id: 'gear-sunfire', name: 'Sunfire', tiers: {
    2: [self(m('atk', 20), m('dr', 20))],
    4: [self(m('dr', 30), m('weakenAtk', 30)),
      afterSkill(together(40, { to: nature('enemy', ['thunder', 'earth']), strike: 200, attackType: 'physical' }))],
    6: [self(m('dr', 30), m('atk', 20)),
      afterSkill(together(60, { to: nature('enemy', ['water', 'fire']), penetration: 80, attackType: 'physical' }))],
  } },
  { id: 'gear-guren', name: 'Guren', tiers: {
    2: [self(m('ccRes', 20), m('dr', 20))],
    4: [self(m('atk', 20), m('dr', 20), m('air', 20)), { to: SELF, immune: ['weakened'] }],
    6: [self(m('hp', 30), m('weakenAtk', 30)), attacked(100, st(WATER, 'shatterStorm', 2, C))],
  } },
  { id: 'gear-guard', name: 'Guard', tiers: {
    2: [self(m('def', 30), m('air', 40))],
    4: [self(m('hp', 30), m('ccRes', 20))],
    6: [self(m('weakenAtk', 30)), attacked(100, st(rand('ally', 2), 'windEscape', 2, { value: 8, ...C }))],
  } },
  { id: 'gear-pain', name: 'Pain', tiers: {
    2: [self(m('immuneWeakenDef', 15), m('def', 40), m('hp', 20))],
    4: [self(m('immuneWeakenDef', 15), m('def', 50), m('hp', 30), m('dr', 30))],
    6: [self(m('immuneWeakenDef', 20), m('def', 60), m('weakenAtk', 30), m('air', 40))],
  } },
  { id: 'gear-amenohoko', name: 'Amenohoko', tiers: {
    2: [self(m('atk', 25), m('air', 30)), afterSkill(st(rand('enemy', 1), 'windBound', 2, { chance: 80 }))],
    4: [self(m('dr', 40)), afterSkill(buff(role('ally', 'assaulter'), 2, [m('speed', 30, 'icon')]))],
    6: [self(m('weakenAtk', 30)), afterSkill(st(rand('ally', 1), 'bond', 2, C))],
  } },
  { id: 'gear-reanimated', name: 'Reanimated', tiers: {
    2: [self(m('hp', 25), m('def', 25))],
    4: [self(m('air', 40))], // « Immune Imprison +80 % » : immunité partielle non modélisée
    6: [self(m('weakenAtk', 30)), afterSkill({ to: role('enemy', 'assaulter'), cleanse: 'buff' })],
  } },
  { id: 'gear-sunagakure', name: 'Sunagakure', tiers: {
    2: [self(m('hp', 30), m('air', 35))],
    4: [self(m('atk', 20)), attacked(40, { to: nature('ally', 'fire'), cleanse: 'debuff' })],
    6: [self(m('weakenAtk', 30)), attacked(60, st(SELF, 'bond', 1, C))],
  } },
  { id: 'gear-sakura', name: 'Sakura', tiers: {
    2: [self(m('dr', 40)), afterSkill(st(rand('ally', 2), 'furyShield', 2, C))],
    4: [self(m('atk', 20)), afterSkill({ to: rand('enemy', 2), dot: { name: 'Incinerate', pct: 120, duration: 2 } },
      buff(rand('ally', 2), 2, [m('crit', 40)]))],
    6: [self(m('weakenAtk', 25)), afterSkill(st(rand('enemy', 2), 'painfulWill', 2), st(SELF, 'shielding', 2, { chance: 50, cleansable: false }))],
  } },
  { id: 'gear-amegakure', name: 'Amegakure', tiers: {
    2: [self(m('atk', 25), m('dr', 20), m('punch', 30))],
    4: [self(m('dr', 20), m('ccRate', 40)), afterSkill(together(80, st(rand('enemy', 2), 'freeze', 2)))],
    6: [self(m('weakenAtk', 30)), afterSkill({ to: rand('ally', 2), cleanse: 'debuff' })],
  } },
  { id: 'gear-longen', name: 'Longen', tiers: {
    2: [self(m('hp', 30), m('air', 30))],
    4: [self(m('dr', 40)), attacked(100, buff(SELF, 1, [m('def', 100, 'icon')]))],
    6: [self(m('weakenAtk', 30)), attacked(100, buff(SELF, 2, [m('speed', 20, 'icon')]))],
  } },
  { id: 'gear-kumogakure', name: 'Kumogakure', tiers: {
    2: [self(m('dr', 40), m('weakenDef', 10))],
    4: [self(m('weakenDef', 20), m('sAtk', 50))],
    6: [self(m('atk', 20), m('weakenDef', 30), m('weakenAtk', 25))],
  } },
  { id: 'gear-kirigakure', name: 'Kirigakure', tiers: {
    2: [self(m('atk', 20), m('air', 30))],
    4: [self(m('air', 30), m('ccRate', 20))],
    // « 80 % de chance de désactiver l'attaquant s'il est masculin » : le genre de l'attaquant n'est pas vérifié
    6: [self(m('dr', 30)), attacked(80, st(ATTACKER, 'disable', 2))],
  } },
  { id: 'gear-cursed', name: 'Cursed', tiers: {
    2: [self(m('dr', 30))],
    4: [self(m('dr', 30), m('weakenAtk', 35))],
    6: [self(m('air', 30), m('hp', 20)), afterSkill({ to: SELF, heal: 40 })],
  } },
  { id: 'gear-sarutobi', name: 'Sarutobi', tiers: {
    2: [self(m('dr', 30))],
    4: [self(m('atk', 25), m('hp', 30))],
    6: [self(m('dr', 30), m('air', 30)), { to: SELF, scale: 10, mods: [m('ignoreEnemyAtk', 6)] }],
  } },
  { id: 'gear-uzumaki', name: 'Uzumaki', tiers: {
    2: [self(m('aid', 20), m('dr', 30), m('air', 30))],
    4: [self(m('hp', 20), m('ccRes', 15))],
    6: [self(m('weakenAtk', 30)), attacked(40, st(SELF, 'ccFree', 2, C))],
  } },
  { id: 'gear-hyuga', name: 'Hyuga', tiers: {
    2: [self(m('dr', 30), m('weakenDef', 30))],
    4: [self(m('atk', 25), m('hp', 20))],
    6: [self(m('dr', 40)), afterSkill({ to: rand('enemy', 3), penetration: 40 })],
  } },
  { id: 'gear-uchiha', name: 'Uchiha', tiers: {
    2: [self(m('air', 30), m('hp', 30))],
    4: [self(m('dr', 40), m('finalReduction', 30))],
    6: [self(m('weakenAtk', 20)), attacked(35, st(SELF, 'sSuperDodge', 1, C))],
  } },
  { id: 'gear-saint', name: 'Saint', tiers: {
    2: [self(m('punch', 25), m('atk', 20), m('hp', 20))],
    4: [self(m('dr', 30)), afterSkill({ to: SELF, heal: 120 })],
    6: [self(m('weakenDef', 40)), afterSkill({ to: role('ally', 'supporter'), cleanse: 'debuff' }, st(role('ally', 'supporter'), 'ccFree', 1, C))],
  } },
  { id: 'gear-senju', name: 'Senju', tiers: {
    2: [self(m('air', 30), m('ccRes', 15))],
    4: [self(m('hp', 30), m('def', 30))],
    6: [self(m('weakenAtk', 35), m('sBlock', 20))],
  } },
  { id: 'gear-ashura', name: 'Ashura', tiers: {
    2: [self(m('def', 30))],
    4: [self(m('air', 30), m('ccRes', 30))],
    6: [self(m('air', 40)), attacked(100, { to: SELF, heal: 40 })],
  } },
  { id: 'gear-indora', name: 'Indora', tiers: {
    2: [self(m('air', 30), m('hp', 20))],
    4: [self(m('dr', 40), m('atk', 30))],
    6: [self(m('ccRate', 40)), afterAttack(100, { to: rand('enemy', 1), dot: { name: 'Poison', pct: 80, duration: 2 } })],
  } },
  { id: 'gear-bloodfang', name: 'Bloodfang', tiers: {
    2: [self(m('dr', 30), m('aid', 20))],
    4: [self(m('hp', 30), m('weakenAtk', 30))],
    6: [self(m('weakenDef', 30)), afterAttack(100, { to: rand('ally', 2), cleanse: 'debuff' })],
  } },
  { id: 'gear-otsutsuki', name: 'Otsutsuki', tiers: {
    2: [self(m('punch', 20), m('atk', 20))],
    4: [self(m('hp', 30), m('def', 30))],
    6: [self(m('dr', 40), m('ccRes', 40))],
  } },
  { id: 'gear-heroism', name: 'Heroism', tiers: {
    2: [self(m('dr', 30))],
    4: [self(m('ccRate', 40), m('finalDmg', 30))],
    6: [self(m('air', 40)), attacked(50, { to: SELF, cleanse: 'debuff' })],
  } },
  { id: 'gear-devout', name: 'Devout', tiers: {
    2: [self(m('air', 30), m('hp', 10))],
    4: [self(m('def', 20)), afterAttack(100, buff(role('ally', 'supporter'), 1, [m('atk', 20, 'icon')]))],
    6: [self(m('finalReduction', 30)), attacked(50, st(ATTACKER, 'stun', 1))],
  } },
  { id: 'gear-hallowed', name: 'Hallowed', tiers: {
    2: [self(m('aid', 20))],
    4: [self(m('air', 30)), attacked(100, buff(SELF, 1, [m('speed', 15, 'icon')]))],
    6: [self(m('dr', 40), m('weakenAtk', 30))],
  } },
  { id: 'gear-skyshatter', name: 'Skyshatter', tiers: {
    2: [self(m('punch', 20), m('dr', 30))],
    4: [self(m('atk', 20), m('finalReduction', 30))],
    6: [self(m('air', 40)), attacked(40, st(SELF, 'superDodge', 1, C))],
  } },
  { id: 'gear-darkmantle', name: 'Darkmantle', tiers: {
    2: [self(m('air', 30))],
    4: [self(m('hp', 30)), attacked(40, { to: SELF, cleanse: 'debuff' })],
    6: [{ to: SELF, scale: 10, mods: [m('dr', 6), m('air', 6)] }, afterAttack(100, { to: rand('ally', 2), cleanse: 'debuff' })],
  } },
  { id: 'gear-deatbone', name: 'Deatbone', tiers: {
    2: [self(m('air', 30), m('dr', 30))],
    4: [self(m('air', 40), m('def', 20))],
    6: [self(m('dr', 40)), afterAttack(100, { to: rand('enemy', 1), dot: { name: 'Poison', pct: 100, duration: 2 } })],
  } },
  { id: 'gear-corruptor', name: 'Corruptor', tiers: {
    2: [self(m('dr', 30))],
    4: [self(m('ccRate', 30)), afterAttack(100, st(rand('enemy', 1), 'painfulWill', 2))],
    6: [self(m('air', 50), m('critDmg', 50)), attacked(50, st(ATTACKER, 'stun', 1))],
  } },
  { id: 'gear-oblivion', name: 'Oblivion', tiers: {
    2: [self(m('dr', 30))],
    4: [self(m('ccRes', 30), m('finalDmg', 30))],
    6: [self(m('air', 50)), afterAttack(100, buff(role('ally', 'supporter'), 1, [m('speed', 15, 'icon')]))],
  } },
  { id: 'gear-stormrage', name: 'Stormrage', tiers: {
    2: [self(m('air', 40))],
    4: [self(m('weakenDef', 20), m('finalReduction', 30))],
    6: [self(m('dr', 50)), afterSkill(st(SELF, 'superDodge', 1, C))],
  } },
  { id: 'gear-frost-fire', name: 'Frost Fire', tiers: {
    2: [self(m('dr', 30))],
    4: [self(m('weakenDef', 30), m('ccRes', 20))],
    6: [self(m('air', 30), m('finalDmg', 30))],
  } },
];

export const ACCESSORY_SETS_2 = [
  { id: 'acc-moonlit', name: 'Accessoires Moonlit', pairs: [
    p('force', self(m('hp', 60), m('air', 20))),
    p('chakra', self(m('hp', 60), m('finalReduction', 20))),
    p('agility', self(m('hp', 60), m('def', 30))),
    p('power', self(m('hp', 60), m('weakenAtk', 25))),
  ], full: [self(m('ccRes', 40), m('air', 20))] },
  { id: 'acc-yaksa', name: 'Accessoires Yaksa', pairs: [
    p('force', self(m('ccRes', 46))),
    p('chakra', self(m('hp', 90))),
    p('agility', self(m('air', 65))),
    p('power', self(m('def', 99))),
  ], full: [self(m('finalReduction', 30), m('weakenAtk', 25))] },
  { id: 'acc-sunfire', name: 'Accessoires Sunfire', pairs: [
    p('force', self(m('dr', 25), m('finalDmg', 20))),
    p('chakra', self(m('atk', 20), m('finalDmg', 20))),
    p('agility', self(m('dr', 25), m('finalDmg', 20))),
    p('power', self(m('atk', 20), m('finalDmg', 20))),
  ], full: [self(m('weakenDef', 30), m('dr', 25))] },
  { id: 'acc-guren', name: 'Accessoires Guren', pairs: [
    p('force', self(m('ccRes', 30)), afterSkill(together(40, st(WATER, 'ccFree', 2, C))), attacked(30, st(WATER, 'bond', 2, C))),
    p('chakra', self(m('atk', 30)), afterSkill(together(50, st(ENEMIES, 'upwind', 2))),
      attacked(30, st(WATER, 'windEscape', 2, { value: 8, ...C }))),
    p('agility', self(m('ccRes', 30)), afterSkill(together(50, { to: ENEMIES, cleanse: 'buff' })),
      attacked(100, buff(WATER, 2, [m('def', 40, 'icon')]))),
    p('power', self(m('hp', 30)), afterSkill(st(WATER, 'furyShield', 2, C)), attacked(100, buff(WATER, 2, [m('dr', 50)]))),
  ], full: [self(m('weakenAtk', 30), m('air', 40))] },
  { id: 'acc-guard', name: 'Accessoires Guard', pairs: [
    p('force', self(m('ccRes', 30)), attacked(100, buff(ALLIES, 2, [m('air', 30)]))),
    p('chakra', self(m('hp', 30)), attacked(100, buff(ALLIES, 2, [m('finalReduction', 20)]))),
    p('agility', self(m('ccRes', 30)), attacked(100, buff(ALLIES, 2, [m('ccRes', 25)]))),
    p('power', self(m('ccRes', 30)), attacked(100, buff(ALLIES, 2, [m('def', 40, 'icon')]))),
  ], full: [self(m('weakenAtk', 25)), attacked(70, st(ATTACKER, 'expel', 2))] },
  { id: 'acc-pain', name: 'Accessoires Pain', pairs: [
    p('force', self(m('atk', 30))),
    p('chakra', self(m('ccRate', 25))),
    p('agility', self(m('ccRes', 30), m('immuneWeakenDef', 20), m('weakenDef', 20))),
    p('power', self(m('weakenAtk', 25), m('immuneWeakenDef', 20), m('weakenDef', 20))),
  ], full: [self(m('dr', 50), m('air', 40))] },
  { id: 'acc-amenohoko', name: 'Accessoires Amenohoko', pairs: [
    p('force', self(m('ccRate', 32)), afterSkill({ to: ENEMIES, dot: { name: 'Burst', pct: 50, duration: 2 } })),
    p('chakra', self(m('atk', 30)), afterSkill({ to: ENEMIES, dot: { name: 'Scorching flame', pct: 50, duration: 2 } })),
    p('agility', self(m('ccRes', 32)), afterSkill({ to: ENEMIES, dot: { name: 'Safeguard', pct: 50, duration: 2 } })),
    p('power', self(m('weakenAtk', 25)), afterSkill({ to: ENEMIES, dot: { name: 'Unification', pct: 50, duration: 2 } })),
  ], full: [self(m('atk', 30)), afterSkill(st(rand('enemy', 1), 'poisonousWind', 2))] },
  { id: 'acc-reanimated', name: 'Accessoires Reanimated', pairs: [
    p('force', self(m('ccRate', 20)), afterSkill(debuff(ENEMIES, 2, [m('ccRes', -25)]))),
    p('chakra', self(m('atk', 25)), afterSkill(debuff(ENEMIES, 2, [m('finalReduction', -20)]))),
    p('agility', self(m('ccRate', 20)), afterSkill(debuff(ENEMIES, 2, [m('air', -30)]))),
    p('power', self(m('atk', 25)), afterSkill(debuff(ENEMIES, 2, [m('def', -30, 'icon')]))),
  ], full: [self(m('weakenAtk', 25)), afterSkill(st(rand('enemy', 1), 'upwind', 2))] },
  { id: 'acc-sunagakure', name: 'Accessoires Sunagakure', pairs: [
    p('force', self(m('dr', 30))), // + Immunité Disable 60 % (non modélisée)
    p('chakra', self(m('air', 30))), // + Immunité Seal 60 % (non modélisée)
    p('agility', self(m('atk', 25))),
    p('power', self(m('hp', 25))),
  ], full: [self(m('weakenAtk', 30))] },
  { id: 'acc-sakura', name: 'Accessoires Sakura', pairs: [
    p('force', self(m('air', 20)), attacked(100, debuff(ATTACKER, 2, [m('ccRate', -25)]))),
    p('chakra', self(m('hp', 25)), attacked(100, debuff(ATTACKER, 2, [m('atk', -25, 'icon')]))),
    p('agility', self(m('air', 20)), attacked(100, debuff(ATTACKER, 2, [m('dr', -20)]))),
    p('power', self(m('hp', 25)), attacked(100, debuff(ATTACKER, 2, [m('finalReduction', -25)]))),
  ], full: [self(m('weakenAtk', 20)), attacked(50, st(SELF, 'ccFree', 2, C))] },
  { id: 'acc-amegakure', name: 'Accessoires Amegakure', pairs: [
    p('force', self(m('def', 20)), attacked(30, { to: role('ally', 'supporter'), cleanse: 'debuff' })),
    p('chakra', self(m('air', 20)), attacked(100, { to: role('ally', 'supporter'), heal: 30 })),
    p('agility', self(m('def', 20)), attacked(30, { to: role('ally', ['assaulter', 'vanguard']), cleanse: 'debuff' })),
    p('power', self(m('hp', 20)), attacked(100, { to: role('ally', ['assaulter', 'vanguard']), heal: 30 })),
  ], full: [self(m('weakenAtk', 20)), attacked(40, st(rand('enemy', 1), 'weakened', 2))] },
  { id: 'acc-longen', name: 'Accessoires Longen', pairs: [
    p('force', self(m('dr', 30), m('ccRate', 30))),
    p('chakra', self(m('def', 35))), // « reduce own fury by 500 » après avoir été attaqué : ignoré (valeur douteuse)
    p('agility', self(m('finalDmg', 25), m('ccRate', 25))),
    p('power', self(m('ccRate', 20), m('weakenAtk', 20))),
  ], full: [self(m('atk', 35), m('air', 40))] },
  { id: 'acc-kumogakure', name: 'Accessoires Kumogakure', pairs: [
    p('force', self(m('atk', 20)), afterSkill(st(SELF, 'superDodge', 2, C))),
    p('chakra', self(m('dr', 25)), afterSkill({ to: lowestHp('enemy'), strike: 200, attackType: 'magic' })),
    p('agility', self(m('dr', 25)), afterSkill({ to: highestHp('enemy'), strike: 300, attackType: 'magic' })),
    p('power', self(m('atk', 20), m('sBlockRes', 20))),
  ], full: [self(m('sBlockRes', 30), m('dr', 30))] },
  { id: 'acc-kirigakure', name: 'Accessoires Kirigakure', pairs: [
    p('force', self(m('ccRes', 30)), attacked(50, { to: rand('enemy', 1), penetration: 20 })),
    p('chakra', self(m('atk', 20), m('sAtk', 20))),
    p('agility', self(m('dr', 30)), attacked(100, debuff(ENEMIES, 2, [m('punch', -30)]))),
    p('power', self(m('ccRes', 30)), attacked(100, debuff(ENEMIES, 2, [m('ccRate', -20)]))),
  ], full: [self(m('weakenAtk', 25), m('air', 30))] },
  { id: 'acc-cursed', name: 'Accessoires Cursed', pairs: [
    p('force', self(m('ccRes', 30)), attacked(100, buff(role('ally', 'supporter'), 1, [m('speed', 10, 'icon')]))),
    p('chakra', self(m('air', 30)), afterSkill(buff(role('ally', 'vanguard'), 2, [m('speed', 40, 'icon')]))),
    p('agility', self(m('sBlockRes', 15)), afterSkill(buff(role('ally', 'assaulter'), 2, [m('speed', 40, 'icon')]))),
    p('power', self(m('sBlockRes', 10), m('atk', 20))),
  ], full: [self(m('ccRes', 20), m('weakenAtk', 15))] },
  { id: 'acc-sarutobi', name: 'Accessoires Sarutobi', pairs: [
    p('force', self(m('dr', 25)), { to: SELF, scale: 15, mods: [m('dr', 6)] }),
    p('chakra', self(m('atk', 25)), { to: SELF, scale: 15, mods: [m('air', 6)] }),
    p('agility', self(m('ccRes', 35)), { to: SELF, scale: 15, mods: [m('atk', 6)] }),
    p('power', self(m('hp', 25)), { to: SELF, scale: 15, mods: [m('def', 6)] }),
  ], full: [self(m('weakenAtk', 30))] },
  { id: 'acc-uzumaki', name: 'Accessoires Uzumaki', pairs: [
    p('force', self(m('hp', 25)), afterSkill(st(rand('enemy', 1), 'windBound', 1, { chance: 90 }))),
    p('chakra', self(m('dr', 25)), afterSkill(st(rand('enemy', 1), 'imprison', 1, { chance: 90 }))),
    p('agility', self(m('atk', 25)), afterSkill(st(rand('enemy', 1), 'silence', 1, { chance: 110 }))),
    p('power', self(m('weakenAtk', 25)), afterSkill(st(rand('enemy', 1), 'chaos', 1, { chance: 110 }))),
  ], full: [self(m('weakenAtk', 5)), { to: ENEMIES, mods: [m('punch', -40)] }] }, // « Punch Rate −40 % » appliqué aux ennemis (à confirmer)
  { id: 'acc-hyuga', name: 'Accessoires Hyuga', pairs: [
    p('force', self(m('ccRate', 25), m('weakenDef', 20))),
    p('chakra', self(m('atk', 20), m('weakenDef', 20))),
    p('agility', self(m('ccRate', 25), m('weakenDef', 20))),
    p('power', self(m('atk', 20), m('punch', 20))),
  ], full: [self(m('dr', 50), m('atk', 20))] },
  { id: 'acc-uchiha', name: 'Accessoires Uchiha', pairs: [
    p('force', self(m('def', 25)), afterAttack(100, { to: rand('enemy', 1), dot: { name: 'Split', pct: 50, duration: 1 } })),
    p('chakra', self(m('air', 30)), afterAttack(100, { to: rand('enemy', 1), dot: { name: 'Vein damage', pct: 50, duration: 1 } })),
    p('agility', self(m('def', 25)), afterAttack(100, { to: rand('enemy', 1), dot: { name: 'Poison', pct: 50, duration: 1 } })),
    p('power', self(m('air', 30)), afterAttack(100, { to: rand('enemy', 1), dot: { name: 'Bleed', pct: 50, duration: 1 } })),
  ], full: [self(m('dr', 30), m('weakenAtk', 25))] },
  { id: 'acc-saint', name: 'Accessoires Saint', pairs: [
    p('force', self(m('dr', 20), m('ccRes', 20))),
    p('chakra', self(m('air', 20))),
    p('agility', self(m('dr', 20), m('weakenDef', 20))),
    p('power', self(m('air', 20), m('aid', 20))),
  ], full: [] },
  { id: 'acc-senju', name: 'Accessoires Senju', pairs: [
    p('force', self(m('block', 25), m('ccRes', 30))),
    p('chakra', self(m('block', 25), m('atk', 20))),
    p('agility', self(m('crit', 25), m('ccRes', 30))),
    p('power', self(m('crit', 25), m('hp', 30))),
  ], full: [self(m('dr', 40), m('air', 40))] },
  { id: 'acc-ashura', name: 'Accessoires Ashura', pairs: [
    p('force', self(m('patk', 15), m('ccRes', 40))),
    p('chakra', self(m('patk', 15), m('hp', 30))),
    p('agility', self(m('patk', 15), m('air', 30))),
    p('power', self(m('patk', 15)), afterSkill({ to: role('ally', 'supporter'), cleanse: 'debuff' })),
  ], full: [attacked(30, st(SELF, 'sSuperDodge', 1, C))] },
  { id: 'acc-indora', name: 'Accessoires Indora', pairs: [
    p('force', self(m('air', 25), m('atk', 20))),
    p('chakra', self(m('dr', 25), m('def', 20))),
    p('agility', self(m('dr', 20), m('hp', 20))),
    p('power', self(m('air', 20), m('weakenAtk', 20))),
  ], full: [self(m('ccRes', 40))] },
  { id: 'acc-bloodfang', name: 'Accessoires Bloodfang', pairs: [
    p('force', self(m('finalDmg', 25))),
    p('chakra', self(m('dr', 30), m('finalDmg', 25))),
    p('agility', self(m('punch', 20), m('finalDmg', 25))),
    p('power', self(m('air', 30), m('finalDmg', 25))),
  ], full: [] },
  { id: 'acc-otsutsuki', name: 'Accessoires Otsutsuki', pairs: [
    p('force', self(m('air', 22)), attacked(100, buff(SELF, 1, [m('speed', 20, 'icon')]))),
    p('chakra', self(m('atk', 20))),
    p('agility', self(m('weakenDef', 20))),
    p('power', self(m('dr', 25), m('ccRes', 20))),
  ], full: [] },
  { id: 'acc-heroism', name: 'Accessoires Heroism', pairs: [
    p('force', self(m('dr', 20), m('atk', 25))),
    p('chakra', self(m('air', 20)), afterAttack(100, buff(rand('ally', 1), 1, [m('speed', 20, 'icon')]))),
    p('agility', self(m('dr', 20)), afterAttack(100, { to: rand('ally', 1), cleanse: 'debuff' })),
    p('power', self(m('hp', 20)), attacked(50, buff(SELF, 1, [m('def', 50, 'icon')]))),
  ], full: [] },
  { id: 'acc-devout', name: 'Accessoires Devout', pairs: [
    p('force', self(m('dr', 20), m('ccRes', 20))),
    p('chakra', self(m('air', 20), m('finalReduction', 20))),
    p('agility', self(m('punch', 20), m('ccRate', 20))),
    p('power', self(m('air', 20), m('hp', 20))),
  ], full: [] },
];
