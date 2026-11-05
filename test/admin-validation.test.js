// Validation des routes admin (session locale de test) et migration de admin_users.
const test = require('node:test');
const assert = require('node:assert');
const { startServer } = require('./helpers');
const { hashPassword } = require('../lib/passwords');

let s;
test.before(async () => {
  s = await startServer({ ALLOW_LOCAL_ADMIN: '1' });
  s.mod.getDb().run("INSERT INTO admin_users (username, password_hash, role) VALUES ('tester', ?, 'admin')", [hashPassword('tester-pw')]);
  const r = await s.req('/api/admin/login', { method: 'POST', body: { username: 'tester', password: 'tester-pw' } });
  assert.strictEqual(r.status, 200);
});
test.after(async () => { await s.close(); });

test('migration : admin_users a les colonnes role et created_at', () => {
  const cols = s.mod.getDb().exec('PRAGMA table_info(admin_users)')[0].values.map(c => c[1]);
  assert.ok(cols.includes('role') && cols.includes('created_at'));
});

test('liste des utilisateurs accessible a un admin local (plus de 500)', async () => {
  const r = await s.req('/api/admin/users');
  assert.strictEqual(r.status, 200);
  assert.ok((await r.json()).some(u => u.username === 'tester' && u.role === 'admin'));
});

test('creation d\'evenement : slug et noms valides, slug normalise', async () => {
  const r = await s.req('/api/admin/events', { method: 'POST', body: { slug: 'Test-Event-2030', name_en: 'Test 2030', starts_at: '2030-01-01' } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual((await r.json()).slug, 'test-event-2030');
});

test('creation d\'evenement : entrees invalides refusees', async () => {
  const bad = [
    { slug: '<img src=x onerror=alert(1)>', name_en: 'x' },
    { slug: 'ok-slug', name_en: 'x'.repeat(101) },
    { slug: 'ok-slug', name_en: { a: 1 } },
    { slug: ['a'], name_en: 'x' },
    { slug: 'ok-slug', name_en: 'x', starts_at: '2030-02-31' },
    { slug: 'ok-slug', name_en: 'x', ends_at: 'demain' },
  ];
  for (const body of bad) assert.strictEqual((await s.req('/api/admin/events', { method: 'POST', body })).status, 400, JSON.stringify(body));
});

test('mise a jour d\'evenement : champs manquants refuses', async () => {
  assert.strictEqual((await s.req('/api/admin/events/1', { method: 'PUT', body: {} })).status, 400);
  assert.strictEqual((await s.req('/api/admin/events/abc/dates', { method: 'PUT', body: {} })).status, 400);
});

test('ajout de Pokemon : id invalide refuse', async () => {
  assert.strictEqual((await s.req('/api/admin/events/1/pokemon', { method: 'POST', body: { pokemon_id: '1 OR 1=1' } })).status, 400);
});

test('utilisateurs : nom et mot de passe valides requis', async () => {
  assert.strictEqual((await s.req('/api/admin/users', { method: 'POST', body: { username: '<b>', password: 'longenough', role: 'manager' } })).status, 400);
  assert.strictEqual((await s.req('/api/admin/users', { method: 'POST', body: { username: 'bob', password: ['x'], role: 'manager' } })).status, 400);
  assert.strictEqual((await s.req('/api/admin/users', { method: 'POST', body: { username: 'bob', password: 'longenough', role: 'root' } })).status, 400);
  assert.strictEqual((await s.req('/api/admin/users', { method: 'POST', body: { username: 'bob', password: 'longenough', role: 'manager' } })).status, 200);
});

test('corps JSON trop gros refuse', async () => {
  const r = await s.req('/api/admin/events', { method: 'POST', body: { slug: 'big', name_en: 'x'.repeat(60 * 1024) } });
  assert.strictEqual(r.status, 413);
});
