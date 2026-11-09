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

test('recherche en francais, sans accents, et nom FR joint aux reponses', async () => {
  const fr = await (await s.req('/api/pokemon/search?q=' + encodeURIComponent('nosferapti'))).json();
  assert.deepStrictEqual(fr.map(p => [p.id, p.name, p.name_fr]), [[41, 'Zubat', 'Nosferapti']]);
  const accent = await (await s.req('/api/pokemon/search?q=dracaufeu')).json();
  assert.ok(accent.some(p => p.name === 'Charizard'));
  assert.strictEqual((await (await s.req('/api/pokemon/25')).json()).name_fr, 'Pikachu');
});

test('recherche : jokers LIKE traites comme du texte, q borne', async () => {
  const all = await (await s.req('/api/pokemon/search?q=%25')).json();
  assert.strictEqual(all.length, 0);
  const under = await (await s.req('/api/pokemon/search?q=_')).json();
  assert.strictEqual(under.length, 0);
  const r = await s.req('/api/pokemon/search?q[]=a&q[]=b');
  assert.strictEqual(r.status, 200);
  const long = await s.req('/api/pokemon/search?q=' + 'a'.repeat(5000));
  assert.strictEqual(long.status, 200);
});

test('API inconnue : 404 JSON ; route SPA : page versionnee', async () => {
  const r = await s.req('/api/nexiste-pas');
  assert.strictEqual(r.status, 404);
  assert.match(r.headers.get('content-type'), /json/);
  const spa = await s.req('/une/page');
  assert.match(await spa.text(), /app-version/);
});

test('JSON invalide : 400 JSON sans pile d\'appels', async () => {
  const r = await fetch(s.base + '/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' });
  assert.strictEqual(r.status, 400);
  const body = await r.text();
  assert.doesNotMatch(body, /at .*\.js/);
});
