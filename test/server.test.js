const test = require('node:test');
const assert = require('node:assert');
const { startServer } = require('./helpers');

let s;
test.before(async () => { s = await startServer(); });
test.after(async () => { await s.close(); });

test('API publique : liste et recherche de Pokemon', async () => {
  const r = await s.req('/api/pokemon/search?q=pika');
  assert.strictEqual(r.status, 200);
  const rows = await r.json();
  assert.ok(rows.some(p => p.name === 'Pikachu'));
});

test('API publique : evenements', async () => {
  const r = await s.req('/api/events');
  assert.strictEqual(r.status, 200);
  assert.ok(Array.isArray(await r.json()));
});

test('Accueil servi avec les URL versionnees', async () => {
  const r = await s.req('/');
  assert.strictEqual(r.status, 200);
  assert.match(await r.text(), /\/js\/app\.js\?v=/);
});

test('Routes admin refusees sans session', async () => {
  s.resetCookie();
  assert.strictEqual((await s.req('/api/admin/events', { method: 'POST', body: { slug: 'x', name_en: 'x' } })).status, 401);
  assert.strictEqual((await s.req('/api/admin/events/1', { method: 'DELETE' })).status, 401);
  assert.strictEqual((await s.req('/api/admin/users')).status, 401);
});
