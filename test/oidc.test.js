// Flux OIDC complet contre un faux fournisseur Authentik local (decouverte, authorize, token + PKCE, userinfo),
// puis droits par groupe sur les routes admin.
const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const crypto = require('crypto');
const { startServer } = require('./helpers');

// ── Faux fournisseur ─────────────────────────────────────────────────────────
function startProvider() {
  const codes = new Map();          // code -> { challenge, user }
  const tokens = new Map();         // access_token -> user
  const calls = [];
  let nextUser = null;
  const srv = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    calls.push(url.pathname);
    const json = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    const base = `http://127.0.0.1:${srv.address().port}/application/o`;
    if (url.pathname === '/application/o/catchr/.well-known/openid-configuration')
      return json(200, { issuer: `${base}/catchr/`, authorization_endpoint: `${base}/authorize/`, token_endpoint: `${base}/token/`, userinfo_endpoint: `${base}/userinfo/`, end_session_endpoint: `${base}/catchr/end-session/` });
    if (url.pathname === '/application/o/token/' && req.method === 'POST') {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        const p = new URLSearchParams(body);
        const entry = codes.get(p.get('code'));
        if (!entry || p.get('grant_type') !== 'authorization_code' || p.get('client_id') !== 'test-client' || p.get('client_secret') !== 'test-secret') return json(400, { error: 'invalid_grant' });
        const expected = crypto.createHash('sha256').update(p.get('code_verifier') || '').digest('base64url');
        if (expected !== entry.challenge) return json(400, { error: 'invalid_grant', error_description: 'PKCE' });
        codes.delete(p.get('code'));                                        // code a usage unique
        const at = crypto.randomBytes(8).toString('hex');
        tokens.set(at, entry.user);
        json(200, { access_token: at, token_type: 'Bearer' });
      });
      return;
    }
    if (url.pathname === '/application/o/userinfo/') {
      const user = tokens.get((req.headers.authorization || '').replace('Bearer ', ''));
      return user ? json(200, user) : json(401, { error: 'invalid_token' });
    }
    json(404, {});
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({
    issuer: `http://127.0.0.1:${srv.address().port}/application/o/catchr`,
    calls,
    // Simule le passage de l'utilisateur chez le fournisseur : emet un code lie au code_challenge recu
    authorize(authUrl, user) {
      const u = new URL(authUrl);
      const code = crypto.randomBytes(8).toString('hex');
      codes.set(code, { challenge: u.searchParams.get('code_challenge'), user });
      return { code, state: u.searchParams.get('state') };
    },
    close: () => new Promise(c => srv.close(c)),
  })));
}

let provider, s;
test.before(async () => {
  provider = await startProvider();
  s = await startServer({
    OIDC_ISSUER: provider.issuer, OIDC_CLIENT_ID: 'test-client', OIDC_CLIENT_SECRET: 'test-secret',
    OIDC_REDIRECT_URI: 'http://127.0.0.1/auth/callback', ALLOW_LOCAL_ADMIN: '',
  });
});
test.after(async () => { await s.close(); await provider.close(); });

async function loginAs(user, rd = '/admin') {
  s.resetCookie();
  const r = await s.req(`/auth/login?rd=${encodeURIComponent(rd)}`);
  assert.strictEqual(r.status, 302);
  const authUrl = r.headers.get('location');
  const { code, state } = provider.authorize(authUrl, user);
  return { cb: await s.req(`/auth/callback?code=${code}&state=${state}`), authUrl, code, state };
}

test('login : redirection vers authorize avec PKCE S256, state et redirect_uri', async () => {
  s.resetCookie();
  const r = await s.req('/auth/login');
  const u = new URL(r.headers.get('location'));
  assert.strictEqual(u.pathname, '/application/o/authorize/');            // lu dans la decouverte
  assert.strictEqual(u.searchParams.get('code_challenge_method'), 'S256');
  assert.match(u.searchParams.get('state'), /^[0-9a-f]{32}$/);
  assert.strictEqual(u.searchParams.get('client_id'), 'test-client');
  assert.strictEqual(u.searchParams.get('scope'), 'openid email profile');
});

test('callback : admin connecte, redirige vers rd, /api/auth/me renvoie le role', async () => {
  const before = s.getCookie();
  const { cb } = await loginAs({ sub: '1', preferred_username: 'dorian', name: 'Dorian', email: 'd@example.invalid', groups: ['catchr-admins'] });
  assert.strictEqual(cb.status, 302);
  assert.strictEqual(cb.headers.get('location'), '/admin');
  assert.notStrictEqual(s.getCookie(), before);                           // session regeneree
  const me = await (await s.req('/api/auth/me')).json();
  assert.strictEqual(me.authenticated, true);
  assert.strictEqual(me.role, 'admin');
  assert.strictEqual(me.username, 'dorian');
  assert.match(me.avatar, /\/avatar\/dorian\?w=160$/);
});

test('admin OIDC : peut gerer les evenements', async () => {
  await loginAs({ sub: '1', preferred_username: 'dorian', groups: ['catchr-admins'] });
  const r = await s.req('/api/admin/events', { method: 'POST', body: { slug: 'oidc-2031', name_en: 'OIDC 2031' } });
  assert.strictEqual(r.status, 200);
  const { id } = await r.json();
  assert.strictEqual((await s.req(`/api/admin/events/${id}/pokemon`, { method: 'POST', body: { pokemon_id: 25 } })).status, 200);
  const ev = await (await s.req('/api/events/oidc-2031')).json();
  assert.deepStrictEqual(ev.pokemon.map(p => p.id), [25]);
  assert.strictEqual((await s.req(`/api/admin/events/${id}/pokemon/25`, { method: 'DELETE' })).status, 200);
  assert.strictEqual((await s.req(`/api/admin/events/${id}`, { method: 'DELETE' })).status, 200);
  assert.strictEqual((await s.req('/api/events/oidc-2031')).status, 404);
});

test('event-manager : evenements oui, gestion des comptes non', async () => {
  await loginAs({ sub: '2', preferred_username: 'manager', groups: ['catchr-event-managers'] });
  assert.strictEqual((await s.req('/api/auth/me').then(r => r.json())).role, 'event-manager');
  assert.strictEqual((await s.req('/api/admin/events', { method: 'POST', body: { slug: 'mgr-2031', name_en: 'Mgr' } })).status, 200);
  assert.strictEqual((await s.req('/api/admin/users')).status, 403);
  assert.strictEqual((await s.req('/api/admin/change-password', { method: 'POST', body: { password: 'whatever123' } })).status, 400);
});

test('simple utilisateur et compte sans groupe : aucune route admin', async () => {
  for (const groups of [['catchr-users'], []]) {
    await loginAs({ sub: '3', preferred_username: 'user', groups });
    const me = await (await s.req('/api/auth/me')).json();
    assert.strictEqual(me.role, groups.length ? 'user' : 'none');
    assert.strictEqual((await s.req('/api/admin/events', { method: 'POST', body: { slug: 'nope-1', name_en: 'x' } })).status, 401);
    assert.strictEqual((await s.req('/api/admin/users')).status, 401);
  }
});

test('callback : state invalide ou rejoue -> pas de session', async () => {
  s.resetCookie();
  const r = await s.req('/auth/login');
  const { code } = provider.authorize(r.headers.get('location'), { sub: '9', preferred_username: 'x', groups: ['catchr-admins'] });
  const cb = await s.req(`/auth/callback?code=${code}&state=forged`);
  assert.strictEqual(cb.headers.get('location'), '/');
  assert.strictEqual((await (await s.req('/api/auth/me')).json()).authenticated, false);
  // Rejeu d'un callback deja consomme
  const { code: c2, state } = await loginAs({ sub: '9', preferred_username: 'x', groups: ['catchr-admins'] });
  s.resetCookie();
  const replay = await s.req(`/auth/callback?code=${c2}&state=${state}`);
  assert.strictEqual(replay.headers.get('location'), '/');
  assert.strictEqual((await (await s.req('/api/auth/me')).json()).authenticated, false);
});

test('callback : echec de l\'echange de code -> retour accueil, pas de session', async () => {
  s.resetCookie();
  const r = await s.req('/auth/login');
  const state = new URL(r.headers.get('location')).searchParams.get('state');
  const cb = await s.req(`/auth/callback?code=inconnu&state=${state}`);
  assert.strictEqual(cb.headers.get('location'), '/');
  assert.strictEqual((await (await s.req('/api/auth/me')).json()).authenticated, false);
});

test('rd externe neutralise sur le flux complet', async () => {
  const { cb } = await loginAs({ sub: '1', preferred_username: 'dorian', groups: ['catchr-admins'] }, '//evil.example/x');
  assert.strictEqual(cb.headers.get('location'), '/');
});

test('logout : session detruite, redirection vers end-session du fournisseur', async () => {
  await loginAs({ sub: '1', preferred_username: 'dorian', groups: ['catchr-admins'] });
  const r = await s.req('/auth/logout');
  assert.strictEqual(r.status, 302);
  assert.match(r.headers.get('location'), /\/application\/o\/catchr\/end-session\/\?redirect_uri=http%3A%2F%2F127\.0\.0\.1$/);
  assert.strictEqual((await (await s.req('/api/auth/me')).json()).authenticated, false);
});
