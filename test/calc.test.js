// Moteur de capture (public/js/calc.js, script navigateur charge dans un contexte vm).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'public', 'js', 'calc.js'), 'utf8') + '\nthis.Calc = Calc;', ctx);
const { Calc } = ctx;

// Lot de Pokeballs identique a db/seed.js
const BALLS = [
  { key: 'quick_ball', multiplier: 5.0, cost: 1200, condition_key: 'quick' },
  { key: 'pokeball', multiplier: 1.0, cost: 200, condition_key: null },
  { key: 'greatball', multiplier: 1.5, cost: 600, condition_key: null },
  { key: 'ultraball', multiplier: 2.0, cost: 1200, condition_key: null },
  { key: 'timerball', multiplier: 4.0, cost: 1200, condition_key: 'timer' },
  { key: 'loveball', multiplier: 8.0, cost: 1200, condition_key: 'love' },
  { key: 'duskball', multiplier: 2.5, cost: 1200, condition_key: 'night' },
  { key: 'netball', multiplier: 3.5, cost: 1200, condition_key: 'bugwater' },
];
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

test('formule Gen 3-5 : p = a / 255 (a = facteur PV x taux x ball x statut)', () => {
  // PV pleins : facteur 1/3
  close(Calc.probability(45, 100, 1, 1), (45 / 3) / 255);
  // 1 PV sur 100 : facteur (300 - 2) / 300
  close(Calc.probability(45, 1, 2, 2), (298 / 300) * 45 * 2 * 2 / 255);
  assert.strictEqual(Calc.probability(255, 1, 2, 2), 1);       // a >= 255 -> capture assuree
  assert.strictEqual(Calc.probability(0, 100, 1, 1), 0);
});

test('multiplicateurs de statut', () => {
  assert.strictEqual(Calc.statusMultiplier('sleep'), 2);
  assert.strictEqual(Calc.statusMultiplier('freeze'), 2);
  for (const s of ['para', 'poison', 'burn']) assert.strictEqual(Calc.statusMultiplier(s), 1.5);
  assert.strictEqual(Calc.statusMultiplier('none'), 1);
  assert.strictEqual(Calc.statusMultiplier('inconnu'), 1);
});

test('lancers moyens et formats', () => {
  assert.strictEqual(Calc.avgThrows(1), 1);
  assert.strictEqual(Calc.avgThrows(0), Infinity);
  close(Calc.avgThrows(0.25), 4);
  assert.strictEqual(Calc.formatPercent(1), '100%');
  assert.strictEqual(Calc.formatPercent(0.5), '50.0%');
  assert.strictEqual(Calc.formatPercent(0.05), '5.00%');
  assert.strictEqual(Calc.formatThrows(Infinity), '∞');
  assert.strictEqual(Calc.formatThrows(0.5), '1');
  assert.strictEqual(Calc.formatThrows(2.345), '2.3');
});

test('conditions des balls : nuit, insecte/eau', () => {
  const magikarp = { catch_rate: 255, type1: 'water', type2: null };
  const pidgey = { catch_rate: 255, type1: 'normal', type2: 'flying' };
  const day = Calc.computeAll(pidgey, BALLS, { hp: 100, status: 'none', night: false });
  assert.strictEqual(day.find(r => r.key === 'duskball').conditionMet, false);
  assert.strictEqual(day.find(r => r.key === 'netball').conditionMet, false);
  const night = Calc.computeAll(magikarp, BALLS, { hp: 100, status: 'none', night: true });
  assert.strictEqual(night.find(r => r.key === 'duskball').conditionMet, true);
  assert.strictEqual(night.find(r => r.key === 'netball').conditionMet, true);
});

test('meilleure ball / moins chere : jamais Quick, Love, Net ni Dusk de jour', () => {
  const p = { catch_rate: 45, type1: 'water', type2: null };
  const results = Calc.computeAll(p, BALLS, { hp: 1, status: 'sleep', night: false });
  const best = Calc.getBest(results), cheap = Calc.getCheapest(results);
  for (const r of [best, cheap]) assert.ok(!['quick_ball', 'loveball', 'netball', 'duskball'].includes(r.key), r.key);
  assert.strictEqual(best.key, 'timerball');                  // x4, toujours eligible
  assert.strictEqual(Calc.getBest([]), null);
});

test('Quick Ball : detection et technique optimale au 1er tour', () => {
  assert.ok(Calc.isQuickable({ catch_rate: 255 }));
  assert.ok(!Calc.isQuickable({ catch_rate: 3 }));
  // 5 x (1/3) x 190 / 255 = 1.24 -> 100 % au 1er tour : la technique la plus rapide est la Quick Ball sans preparation
  const fast = Calc.computeOptimalFastest({ catch_rate: 190, type1: 'normal', type2: null }, BALLS);
  assert.strictEqual(fast.key, 'quick_ball');
  assert.strictEqual(fast.probability, 1);
});

test('technique optimale : un fantome a PV reduits demande Detrempe (Soak)', () => {
  const gastly = { catch_rate: 3, type1: 'ghost', type2: 'poison' };      // taux tres bas -> preparation obligatoire
  const fast = Calc.computeOptimalFastest(gastly, BALLS);
  assert.ok(fast.technique.hp < 100);
  assert.strictEqual(fast.technique.soak, true);
  const cheap = Calc.computeOptimalCheapest(gastly, BALLS);
  assert.ok(cheap && Number.isFinite(cheap.avgCost));
  assert.strictEqual(Calc.computeOptimalFastest(gastly, []), null);
});

test('sprite de ball : repli sur une image existante', () => {
  assert.strictEqual(Calc.ballSprite('inconnue'), Calc.BALL_SPRITES.quick_ball);
  for (const src of Object.values(Calc.BALL_SPRITES)) {
    const file = decodeURIComponent(src.replace('/ball-images/', ''));
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'db', 'images', file)), file);
  }
});
