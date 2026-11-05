// Comptes locaux : desactives par defaut, mot de passe d'amorcage refuse, migration SHA-256 -> scrypt.
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { startServer } = require('./helpers');

test('connexion locale desactivee par defaut', async () => {
  const s = await startServer({ ALLOW_LOCAL_ADMIN: '' });
  try {
    const r = await s.req('/api/admin/login', { method: 'POST', body: { username: 'naerod', password: 'admin123' } });
    assert.strictEqual(r.status, 403);
    const chk = await (await s.req('/api/admin/check')).json();
    assert.deepStrictEqual(chk, { authenticated: false, localLogin: false });
  } finally { await s.close(); }
});

test('connexion locale activee : mot de passe par defaut refuse, vrai mot de passe accepte et rehache', async () => {
  const s = await startServer({ ALLOW_LOCAL_ADMIN: '1' });
  try {
    // La base versionnee contient naerod / admin123 (SHA-256) : il doit etre refuse
    let r = await s.req('/api/admin/login', { method: 'POST', body: { username: 'naerod', password: 'admin123' } });
    assert.strictEqual(r.status, 403);
    r = await s.req('/api/admin/login', { method: 'POST', body: { username: 'naerod', password: 'wrong' } });
    assert.strictEqual(r.status, 401);

    // Un compte a l'ancien format SHA-256 avec un vrai mot de passe
    const db = s.mod.getDb();
    const legacy = crypto.createHash('sha256').update('correct horse').digest('hex');
    db.run("INSERT INTO admin_users (username, password_hash) VALUES ('legacy', ?)", [legacy]);
    r = await s.req('/api/admin/login', { method: 'POST', body: { username: 'legacy', password: 'correct horse' } });
    assert.strictEqual(r.status, 200);
    const row = db.exec("SELECT password_hash FROM admin_users WHERE username = 'legacy'")[0].values[0][0];
    assert.match(row, /^scrypt\$/);

    // Session locale -> routes d'evenements accessibles
    r = await s.req('/api/admin/check');
    assert.strictEqual((await r.json()).authenticated, true);
  } finally { await s.close(); }
});

test('corps de requete invalide : pas de crash', async () => {
  const s = await startServer({ ALLOW_LOCAL_ADMIN: '1' });
  try {
    const r = await s.req('/api/admin/login', { method: 'POST', body: { username: { $ne: 1 }, password: ['x'] } });
    assert.ok([400, 401].includes(r.status));
  } finally { await s.close(); }
});

test('cookie de session durci et regenere a la connexion', async () => {
  const s = await startServer({ ALLOW_LOCAL_ADMIN: '1' });
  try {
    s.mod.getDb().run("INSERT INTO admin_users (username, password_hash) VALUES ('fix', ?)", [require('../lib/passwords').hashPassword('pw-fixation')]);
    // Une session pre-existante (creee par /auth/login)
    const pre = await fetch(s.base + '/auth/login', { redirect: 'manual' }).catch(() => null);
    const preCookie = pre?.headers.get('set-cookie') || '';
    const r = await fetch(s.base + '/api/admin/login', {
      method: 'POST', headers: { 'content-type': 'application/json', cookie: preCookie.split(';')[0] },
      body: JSON.stringify({ username: 'fix', password: 'pw-fixation' }),
    });
    assert.strictEqual(r.status, 200);
    const sc = r.headers.get('set-cookie');
    assert.match(sc, /HttpOnly/i);
    assert.match(sc, /SameSite=Lax/i);
    if (preCookie) assert.notStrictEqual(sc.split(';')[0], preCookie.split(';')[0]);
  } finally { await s.close(); }
});
