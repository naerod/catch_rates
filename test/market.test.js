const test = require('node:test');
const assert = require('node:assert');
const { invList, ts } = require('../lib/market');

test('invList : accepte une liste propre, refuse le reste', () => {
  assert.deepStrictEqual(invList([{ id: 5223, qty: 3, price: 1200, date: '2026-11-16', junk: 1 }]), [{ id: 5223, qty: 3, price: 1200, date: '2026-11-16' }]);
  assert.strictEqual(invList([{ id: 1, qty: 0, price: 1 }]), null);
  assert.strictEqual(invList([{ id: 1, qty: 1, price: -5 }]), null);
  assert.strictEqual(invList([{ id: 1, qty: 1, price: 5, date: 'demain' }]), null);
  assert.strictEqual(invList('x'), null);
});

test('ts : date de l API en millisecondes UTC', () => {
  assert.strictEqual(ts([2026, 11, 16, 12, 5, 34, 0]), Date.UTC(2026, 10, 16, 12, 5));
  assert.strictEqual(ts(null), null);
});
