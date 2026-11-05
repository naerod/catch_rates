const express = require('express');
const session = require('express-session');
const initSqlJs = require('sql.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { hashPassword, verifyPassword, needsRehash } = require('./lib/passwords');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.CATCHR_DB_PATH || path.join(__dirname, 'db', 'catchrates.db');   // surchargeable (tests)

// ─── DB helpers ───────────────────────────────────────────────────────────────
let db;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function dbAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function dbGet(sql, params = []) {
  return dbAll(sql, params)[0] || null;
}

function dbRun(sql, params = []) {
  db.run(sql, params.length ? params : undefined);
  const row = dbGet('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: row ? row.id : null };
}


// Evenements saisonniers PokeMMO. Dates : wiki PokeMMO (debut) ; fin = fin du minuteur du charme d'event, a defaut debut + 14 jours.
// Swarms : seulement ceux verifies (Noel 2024 = guide officiel ; Halloween 2025 = guide communautaire d'Alisae, liste partielle).
// Idempotent : n'ecrase ni les dates ni les listes deja saisies via l'admin.
function seedEvents() {
  // LNY 2026 : tableur communautaire « Fastest Swarm Pokémon Catching Guide » (47 especes). Nidoran apparait deux fois (F et M).
  const L26 = ['Ekans', 'Meowth', 'Minccino', 'Numel', 'Poochyena', 'Sandshrew', 'Spinda', 'Spoink', 'Nidoran-F', 'Nidoran-M', 'Swinub', 'Deerling', 'Dunsparce', 'Growlithe', 'Mankey', 'Munna', 'Pikachu', 'Ponyta', 'Buneary', 'Cottonee', 'Meditite', 'Hippopotas', 'Gyarados', 'Raticate', 'Luxio', 'Rhyhorn', 'Vigoroth', 'Electrike', 'Flaaffy', 'Pidgeotto', 'Staravia', 'Seviper', 'Fearow', 'Girafarig', 'Riolu', 'Espeon', 'Tauros', 'Onix', 'Aipom', 'Combusken', 'Gabite', 'Miltank', 'Stantler', 'Dragonair', 'Electabuzz', 'Charmeleon', 'Monferno'];
  // Noel 2025 : aucune liste publiee ; les videos et le forum ne citent que des especes du lot de Noel 2024 -> meme lot, marque « a confirmer ».
  const X25 = ['Seel', 'Dewgong', 'Staryu', 'Lapras', 'Pineco', 'Swinub', 'Delibird', 'Stantler', 'Smoochum', 'Treecko', 'Snorunt', 'Spheal', 'Chingling', 'Snover', 'Glaceon', 'Deerling'];
  const H25 = ['Drifloon', 'Skorupi', 'Houndour', 'Seviper', 'Zorua', 'Gligar', 'Sableye', 'Misdreavus', 'Umbreon', 'Murkrow'];
  const EVENTS = [
    { slug: 'lny-2025',       name: 'LNY 2025',       kind: 'lny',       start: '2025-01-29', end: '2025-02-12' },
    { slug: 'xmas-2024',      name: 'XMAS 2024',      kind: 'xmas',      start: '2024-12-24', end: '2025-01-07' },
    { slug: 'halloween-2025', name: 'HALLOWEEN 2025', kind: 'halloween', start: '2025-10-31', end: '2025-11-14', mons: H25 },
    { slug: 'xmas-2025',      name: 'XMAS 2025',      kind: 'xmas',      start: '2025-12-24', end: '2026-01-08', mons: X25, unverified: 1 },
    { slug: 'lny-2026',       name: 'LNY 2026',       kind: 'lny',       start: '2026-02-18', end: '2026-03-03', mons: L26 },
    { slug: 'halloween-2026', name: 'HALLOWEEN 2026', kind: 'halloween', start: '2026-10-31', end: '2026-11-14', mons: H25, forecast: 1 },
  ];
  // Halloween 2024 retire (aucune liste de swarms disponible) : seulement si la ligne est intacte (jamais touchee depuis l'amorcage)
  dbRun("DELETE FROM events WHERE slug = 'halloween-2024' AND starts_at = '2024-10-31' AND id NOT IN (SELECT event_id FROM event_pokemon)");
  for (const e of EVENTS) {
    if (!dbGet('SELECT id FROM events WHERE slug = ?', [e.slug]))
      dbRun('INSERT INTO events (slug, name_en, name_fr, active, forecast) VALUES (?, ?, ?, 1, ?)', [e.slug, e.name, e.name, e.forecast || 0]);
    const row = dbGet('SELECT id, starts_at, ends_at, kind FROM events WHERE slug = ?', [e.slug]);
    if (!row.starts_at) dbRun('UPDATE events SET starts_at = ?, ends_at = COALESCE(ends_at, ?) WHERE id = ?', [e.start, e.end, row.id]);
    if (!row.kind) dbRun('UPDATE events SET kind = ? WHERE id = ?', [e.kind, row.id]);
    if (e.unverified && !dbGet('SELECT 1 AS x FROM event_pokemon WHERE event_id = ?', [row.id])) dbRun('UPDATE events SET unverified = 1 WHERE id = ?', [row.id]);
    if (e.mons && !dbGet('SELECT 1 AS x FROM event_pokemon WHERE event_id = ?', [row.id]))
      for (const n of e.mons) {
        const p = dbGet('SELECT id FROM pokemon WHERE lower(name) = lower(?)', [n]);
        if (p) dbRun('INSERT OR IGNORE INTO event_pokemon (event_id, pokemon_id) VALUES (?, ?)', [row.id, p.id]);
      }
  }
}

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
// Cloudflare garde les statiques 4 h cote navigateur : on versionne leurs URL (?v=<version du changelog>) pour qu'un deploiement les renouvelle tout de suite.
const APP_V = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'changelog.json'), 'utf8')).versions[0].v;
const INDEX_HTML = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8')
  .replace(/((?:src|href)="\/(?:js|css)\/[^"]+\.(?:js|css))"/g, `$1?v=${APP_V}"`)
  .replace('</head>', `  <meta name="app-version" content="${APP_V}" />\n</head>`);
app.get(['/', '/index.html'], (req, res) => res.type('html').send(INDEX_HTML));
app.use('/gym-rerun', express.static(path.join(__dirname, 'public', 'gym-rerun'), { maxAge: '1d' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ball-images', express.static(path.join(__dirname, 'db', 'images')));
// Derriere le reverse proxy (Cloudflare / proxy local) : X-Forwarded-Proto rend req.secure fiable -> cookie Secure en HTTPS.
app.set('trust proxy', 1);
if (!process.env.SESSION_SECRET) console.warn('[session] SESSION_SECRET absent : secret aleatoire genere au demarrage.');
app.use(session({
  name: 'catchr.sid',
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax', secure: 'auto' }
}));

// Nouvel identifiant de session a chaque connexion (anti-fixation de session)
const regenerate = req => new Promise((ok, ko) => req.session.regenerate(e => (e ? ko(e) : ok())));

// ─── OIDC Config ──────────────────────────────────────────────────────────────
const OIDC_ISSUER     = (process.env.OIDC_ISSUER || 'https://auth.naerod.com/application/o/catchr').replace(/\/$/, '');
const OIDC_CLIENT_ID  = process.env.OIDC_CLIENT_ID;
const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;
const OIDC_REDIRECT_URI  = process.env.OIDC_REDIRECT_URI || 'https://catchr.naerod.com/auth/callback';
const CATCHR_GROUPS   = ['catchr-users', 'catchr-event-managers', 'catchr-admins'];
// Comptes locaux (identifiant / mot de passe) : heritage d'avant le SSO, desactives par defaut.
// ALLOW_LOCAL_ADMIN=1 pour les reactiver. Le mot de passe d'amorcage historique est toujours refuse.
const LOCAL_ADMIN = process.env.ALLOW_LOCAL_ADMIN === '1';
const DEFAULT_PASSWORDS = ['admin123'];

// ─── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (LOCAL_ADMIN && req.session?.adminId) return next();
  const groups = req.session?.oidcUser?.groups || [];
  if (groups.some(g => ['catchr-event-managers', 'catchr-admins'].includes(g))) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
  if (LOCAL_ADMIN && req.session?.adminRole === 'admin') return next();
  if ((req.session?.oidcUser?.groups || []).includes('catchr-admins')) return next();
  res.status(403).json({ error: 'Forbidden' });
}

// ─── OIDC Routes ──────────────────────────────────────────────────────────────
// Authentik expose authorize/token/userinfo au niveau /application/o/ (pas sous le slug de l'application) ;
// seul end-session est propre au slug. On lit donc les adresses dans le document de decouverte
// (mis en cache), avec un repli sur les chemins standards d'Authentik.
let oidcMeta = null;
async function oidcEndpoints() {
  if (oidcMeta) return oidcMeta;
  const base = OIDC_ISSUER.replace(/\/[^/]+$/, '');                    // https://auth.naerod.com/application/o
  const fallback = {
    authorization_endpoint: `${base}/authorize/`, token_endpoint: `${base}/token/`,
    userinfo_endpoint: `${base}/userinfo/`, end_session_endpoint: `${OIDC_ISSUER}/end-session/`,
  };
  try {
    const r = await fetch(`${OIDC_ISSUER}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(8000) });
    if (r.ok) { oidcMeta = { ...fallback, ...(await r.json()) }; return oidcMeta; }
  } catch (e) { console.error('[OIDC] discovery:', e.message); }
  return fallback;                                                     // pas mis en cache : on reessaiera
}
const APP_ORIGIN = new URL(OIDC_REDIRECT_URI).origin;                  // prod ou preprod, selon l'environnement

// Retour apres connexion : uniquement un chemin du site (pas d'URL absolue, ni //hote, ni /\hote) -> pas d'open redirect.
function safeRedirect(rd) {
  if (typeof rd !== 'string' || !rd.startsWith('/') || rd.startsWith('//') || rd.startsWith('/\\')) return '/';
  if (/[\u0000-\u001f\\]/.test(rd)) return '/';
  return rd;
}

app.get('/auth/login', async (req, res) => {
  const state        = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  req.session.oidcState        = state;
  req.session.oidcCodeVerifier = codeVerifier;
  req.session.oidcRedirect     = safeRedirect(req.query.rd);
  const params = new URLSearchParams({
    response_type: 'code', client_id: OIDC_CLIENT_ID,
    redirect_uri: OIDC_REDIRECT_URI, scope: 'openid email profile',
    state, code_challenge: codeChallenge, code_challenge_method: 'S256',
  });
  res.redirect(`${(await oidcEndpoints()).authorization_endpoint}?${params}`);
});

app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || state !== req.session.oidcState) return res.redirect('/');
  const { oidcCodeVerifier: codeVerifier, oidcRedirect: redirect = '/' } = req.session;
  delete req.session.oidcState;
  delete req.session.oidcCodeVerifier;
  delete req.session.oidcRedirect;
  try {
    const meta = await oidcEndpoints();
    const tokenRes = await fetch(meta.token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code', code,
        redirect_uri: OIDC_REDIRECT_URI, client_id: OIDC_CLIENT_ID,
        client_secret: OIDC_CLIENT_SECRET, code_verifier: codeVerifier,
      }),
    });
    if (!tokenRes.ok) throw new Error(`Token exchange: ${tokenRes.status}`);
    const { access_token } = await tokenRes.json();
    const userRes = await fetch(meta.userinfo_endpoint, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!userRes.ok) throw new Error(`Userinfo: ${userRes.status}`);
    const u = await userRes.json();
    await regenerate(req);
    req.session.oidcUser = {
      sub: u.sub, username: u.preferred_username,
      name: u.name, email: u.email, groups: u.groups || [],
    };
    res.redirect(safeRedirect(redirect));
  } catch (e) {
    console.error('[OIDC] Callback error:', e.message);
    res.redirect('/');
  }
});

app.get('/auth/logout', async (req, res) => {
  const endSession = `${(await oidcEndpoints()).end_session_endpoint}?redirect_uri=${encodeURIComponent(APP_ORIGIN)}`;
  req.session.destroy(() => res.redirect(endSession));
});

// Photo de profil : service central naerod-profile (auth.naerod.com, ou preprod-auth.naerod.com depuis une preprod).
// Si le profil n'a pas de photo (404) ou si le service n'est pas encore en prod, la barre retombe sur l'initiale.
const avatarUrl = (req, username) => {
  const host = String(req.get('x-forwarded-host') || req.hostname || '').split(',')[0];
  const base = host.startsWith('preprod-') ? 'https://preprod-auth.naerod.com' : 'https://auth.naerod.com';
  return `${base}/avatar/${encodeURIComponent(username)}?w=160`;
};

app.get('/api/auth/me', (req, res) => {
  if (!req.session?.oidcUser) return res.json({ authenticated: false });
  const { username, name, email, groups } = req.session.oidcUser;
  const isAdmin        = groups.includes('catchr-admins');
  const isEventManager = groups.some(g => ['catchr-event-managers', 'catchr-admins'].includes(g));
  const isUser         = groups.some(g => CATCHR_GROUPS.includes(g));
  res.json({
    authenticated: true, username, name, email, avatar: avatarUrl(req, username),
    role: isAdmin ? 'admin' : isEventManager ? 'event-manager' : isUser ? 'user' : 'none',
    isAdmin, isEventManager, isUser,
  });
});

// ─── Pokémon ───────────────────────────────────────────────────────────────────
app.get('/api/pokemon/search', (req, res) => {
  // q borne et jokers LIKE (% _) echappes : la recherche porte sur le texte saisi, rien d'autre
  const q = (typeof req.query.q === 'string' ? req.query.q : '').slice(0, 50).replace(/[\\%_]/g, c => '\\' + c);
  const rows = dbAll(
    "SELECT id, name, catch_rate, generation, type1, type2 FROM pokemon WHERE name LIKE ? ESCAPE '\\' LIMIT 20",
    [`%${q}%`]
  );
  res.json(rows);
});

app.get('/api/pokemon', (req, res) => {
  res.json(dbAll('SELECT id, name, catch_rate, generation, type1, type2 FROM pokemon ORDER BY id'));
});

app.get('/api/pokemon/:id', (req, res) => {
  const row = dbGet('SELECT id, name, catch_rate, generation, type1, type2 FROM pokemon WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// ─── Recoil Warnings ──────────────────────────────────────────────────────────
// Returns SUICIDE and RECOIL move lists for a given Pokémon (by Pokédex #).
// Requires the pokemon_recoil_moves table (run: npm run seed:recoil).
app.get('/api/pokemon/:id/recoil-warnings', (req, res) => {
  // Moves that instantly KO the user → SUICIDE category
  const SUICIDE_MOVES = new Set([
    'Self-Destruct', 'Explosion', 'Memento',
    'Healing Wish', 'Final Gambit', 'Misty Explosion'
  ]);

  try {
    const rows = dbAll(
      'SELECT move_name, level FROM pokemon_recoil_moves WHERE dex_number = ? ORDER BY level ASC',
      [req.params.id]
    );
    const suicideMoves = rows.filter(r => SUICIDE_MOVES.has(r.move_name));
    const recoilMoves  = rows.filter(r => !SUICIDE_MOVES.has(r.move_name));
    res.json({ suicideMoves, recoilMoves });
  } catch (_e) {
    // Table doesn't exist yet (seed:recoil not run) — return empty
    res.json({ suicideMoves: [], recoilMoves: [] });
  }
});

// ─── Pokéballs ─────────────────────────────────────────────────────────────────
app.get('/api/pokeballs', (req, res) => {
  res.json(dbAll('SELECT * FROM pokeballs ORDER BY sort_order'));
});

// ─── Events ───────────────────────────────────────────────────────────────────
app.get('/api/events', (req, res) => {
  // Du plus recent au plus ancien : date de debut, a defaut date de creation ; egalite -> dernier ajoute d'abord
  res.json(dbAll("SELECT * FROM events ORDER BY COALESCE(starts_at, substr(created_at, 1, 10)) DESC, id DESC"));
});

app.get('/api/events/:slug', (req, res) => {
  const event = dbGet('SELECT * FROM events WHERE slug = ?', [req.params.slug]);
  if (!event) return res.status(404).json({ error: 'Not found' });
  const pokemon = dbAll(`
    SELECT p.id, p.name, p.catch_rate, p.generation, p.type1, p.type2
    FROM event_pokemon ep
    JOIN pokemon p ON ep.pokemon_id = p.id
    WHERE ep.event_id = ?
    ORDER BY p.id
  `, [event.id]);
  res.json({ ...event, pokemon });
});

// ─── Admin Auth ────────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
  if (!LOCAL_ADMIN) return res.status(403).json({ error: 'Local login disabled, use SSO' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const user = dbGet('SELECT * FROM admin_users WHERE username = ?', [String(username)]);
  if (!user || !verifyPassword(String(password), user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });
  if (DEFAULT_PASSWORDS.includes(String(password))) return res.status(403).json({ error: 'Default password refused: change it (see README, local admin account)' });
  if (needsRehash(user.password_hash)) {                                // ancien SHA-256 sans sel -> scrypt
    dbRun('UPDATE admin_users SET password_hash=? WHERE id=?', [hashPassword(String(password)), user.id]);
    saveDb();
  }
  try { await regenerate(req); } catch { return res.status(500).json({ error: 'Session error' }); }
  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  req.session.adminRole = user.role;
  res.json({ success: true, username: user.username, role: user.role });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/admin/check', (req, res) => {
  if (LOCAL_ADMIN && req.session && req.session.adminId) {
    res.json({ authenticated: true, localLogin: true, username: req.session.adminUsername, role: req.session.adminRole });
  } else {
    res.json({ authenticated: false, localLogin: LOCAL_ADMIN });
  }
});

// ─── Admin Events ──────────────────────────────────────────────────────────────
// Validation des entrees admin : types, longueurs, formats (les valeurs sont ensuite affichees a tous les visiteurs)
const isDate = v => v == null || v === '' || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().startsWith(v));
const normSlug = v => (typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(v.trim().toLowerCase()) ? v.trim().toLowerCase() : null);
const normName = (v, { optional = false } = {}) => {
  if (optional && (v == null || v === '')) return '';
  return typeof v === 'string' && v.trim() && v.trim().length <= 100 ? v.trim() : null;
};
const isId = v => /^\d{1,9}$/.test(String(v));
const isPassword = v => typeof v === 'string' && v.length >= 6 && v.length <= 200;
const isUsername = v => typeof v === 'string' && /^[\w.@-]{1,64}$/.test(v);
const badId = (res) => res.status(400).json({ error: 'Invalid id' });
app.post('/api/admin/events', requireAuth, (req, res) => {
  const { active, starts_at, ends_at } = req.body;
  const slug = normSlug(req.body.slug), name_en = normName(req.body.name_en), name_fr = normName(req.body.name_fr, { optional: true });
  if (!req.body.slug || !req.body.name_en) return res.status(400).json({ error: 'Missing fields' });
  if (!slug) return res.status(400).json({ error: 'Invalid slug (a-z, 0-9, -)' });
  if (name_en == null || name_fr == null) return res.status(400).json({ error: 'Invalid name (max 100 chars)' });
  if (!isDate(starts_at) || !isDate(ends_at)) return res.status(400).json({ error: 'Invalid date (YYYY-MM-DD)' });
  try {
    const kind = ['halloween', 'xmas', 'lny'].find(k => slug.toLowerCase().startsWith(k)) || null;   // icone de l'evenement, deduite du slug
    const result = dbRun(
      'INSERT INTO events (slug, name_en, name_fr, active, starts_at, ends_at, kind) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [slug, name_en, name_fr, active ? 1 : 0, starts_at || null, ends_at || null, kind]
    );
    saveDb();
    res.json({ id: result.lastInsertRowid, slug, name_en, name_fr, active: active ? 1 : 0 });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/events/:id', requireAuth, (req, res) => {
  if (!isId(req.params.id)) return badId(res);
  const slug = normSlug(req.body.slug), name_en = normName(req.body.name_en), name_fr = normName(req.body.name_fr, { optional: true });
  const { active } = req.body;
  if (!slug || name_en == null || name_fr == null) return res.status(400).json({ error: 'Missing or invalid fields' });
  try {
    dbRun('UPDATE events SET slug=?, name_en=?, name_fr=?, active=? WHERE id=?',
      [slug, name_en, name_fr, active ? 1 : 0, req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/events/:id/dates', requireAuth, (req, res) => {
  if (!isId(req.params.id)) return badId(res);
  const { starts_at, ends_at } = req.body;
  if (!isDate(starts_at) || !isDate(ends_at)) return res.status(400).json({ error: 'Invalid date (YYYY-MM-DD)' });
  dbRun('UPDATE events SET starts_at=?, ends_at=? WHERE id=?', [starts_at || null, ends_at || null, req.params.id]);
  saveDb();
  res.json({ success: true });
});

app.delete('/api/admin/events/:id', requireAuth, (req, res) => {
  if (!isId(req.params.id)) return badId(res);
  dbRun('DELETE FROM events WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

app.post('/api/admin/events/:id/pokemon', requireAuth, (req, res) => {
  const { pokemon_id } = req.body;
  if (!isId(req.params.id)) return badId(res);
  if (!pokemon_id || !isId(pokemon_id)) return res.status(400).json({ error: 'Missing pokemon_id' });
  try {
    dbRun('INSERT INTO event_pokemon (event_id, pokemon_id) VALUES (?, ?)', [req.params.id, pokemon_id]);
    saveDb();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/events/:eventId/pokemon/:pokemonId', requireAuth, (req, res) => {
  if (!isId(req.params.eventId) || !isId(req.params.pokemonId)) return badId(res);
  dbRun('DELETE FROM event_pokemon WHERE event_id=? AND pokemon_id=?',
    [req.params.eventId, req.params.pokemonId]);
  saveDb();
  res.json({ success: true });
});

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  if (!req.session.adminId) return res.status(400).json({ error: 'No local account (password managed by SSO)' });
  const { password } = req.body;
  if (!isPassword(password)) return res.status(400).json({ error: 'Password too short (min 6 chars)' });
  const hash = hashPassword(password);
  dbRun('UPDATE admin_users SET password_hash=? WHERE id=?', [hash, req.session.adminId]);
  saveDb();
  res.json({ success: true });
});

// ─── Admin Users ───────────────────────────────────────────────────────────────
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  res.json(dbAll('SELECT id, username, role, created_at FROM admin_users ORDER BY id'));
});

app.post('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  const { username, password, role } = req.body;
  if (!isUsername(username) || !password || !['admin', 'manager'].includes(role))
    return res.status(400).json({ error: 'Missing or invalid fields' });
  if (!isPassword(password)) return res.status(400).json({ error: 'Password too short (min 6 chars)' });
  const hash = hashPassword(password);
  try {
    const result = dbRun('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role]);
    saveDb();
    res.json({ id: result.lastInsertRowid, username, role });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  if (!isId(req.params.id)) return badId(res);
  const { username, role, password } = req.body;
  if (!isUsername(username) || !['admin', 'manager'].includes(role))
    return res.status(400).json({ error: 'Missing or invalid fields' });
  try {
    if (password) {
      if (!isPassword(password)) return res.status(400).json({ error: 'Password too short (min 6 chars)' });
      const hash = hashPassword(password);
      dbRun('UPDATE admin_users SET username=?, role=?, password_hash=? WHERE id=?', [username, role, hash, req.params.id]);
    } else {
      dbRun('UPDATE admin_users SET username=?, role=? WHERE id=?', [username, role, req.params.id]);
    }
    saveDb();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  if (!isId(req.params.id)) return badId(res);
  if (Number(req.params.id) === req.session.adminId)
    return res.status(400).json({ error: 'Cannot delete your own account' });
  dbRun('DELETE FROM admin_users WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

// ─── Prix du marche des charms (GTL PokeMMO) ───────────────────────────────────
// Meme source que CharmCalc : l'API publique apis.fiereu.de. Mise en cache cote serveur (10 min),
// le navigateur n'appelle jamais l'API externe ; si elle tombe, on sert le dernier prix connu.
const CHARM_IDS = { amulet_coin: 5223, riches_75: 1412, riches_100: 1413 };
let priceCache = null;           // { at, prices }
app.get('/api/prices', async (req, res) => {
  const fresh = priceCache && Date.now() - priceCache.at < 10 * 60 * 1000;
  if (!fresh) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 8000);
      const r = await fetch('https://apis.fiereu.de/pokemmoprices/v1/items', { signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const list = await r.json();
      const prices = {};
      for (const [key, id] of Object.entries(CHARM_IDS)) {
        const it = list.find(i => i.item_id === id);
        if (it) prices[key] = { price: it.price, listings: it.listings, updated: it.last_updated };
      }
      if (Object.keys(prices).length === 3) priceCache = { at: Date.now(), prices };
    } catch (err) {
      console.error('prices:', err.message);
    }
  }
  if (!priceCache) return res.status(502).json({ error: 'Market prices unavailable' });
  res.json({ fetchedAt: priceCache.at, stale: !fresh && Date.now() - priceCache.at >= 10 * 60 * 1000, prices: priceCache.prices });
});

// ─── Serve SPA ─────────────────────────────────────────────────────────────────
// Journal des versions (pas de .html dans les URL publiques)
app.get('/changelog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'changelog.html'));
});

// API inconnue : 404 JSON (et non la page HTML de l'application)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// SPA : meme page versionnee que '/' (URL ?v= pour le cache Cloudflare)
app.get('*', (req, res) => res.type('html').send(INDEX_HTML));

// Erreurs : JSON sans pile d'appels (corps JSON invalide, trop gros, exception imprevue)
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json({ error: status >= 500 ? 'Internal error' : (err.expose ? err.message : 'Bad request') });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
async function init() {
  if (!fs.existsSync(DB_PATH)) throw new Error('Database not found. Run: npm run seed');
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
  db.run('PRAGMA foreign_keys = ON;');
  // Migrations : dates de debut/fin d'evenement (tri par recence, "en cours") ; sort_order pour les bases anciennes
  const evCols = dbAll('PRAGMA table_info(events)').map(c => c.name);
  for (const [col, ddl] of [['sort_order', 'INTEGER DEFAULT 0'], ['starts_at', 'TEXT'], ['ends_at', 'TEXT'], ['kind', 'TEXT'], ['forecast', 'INTEGER DEFAULT 0'], ['unverified', 'INTEGER DEFAULT 0']])
    if (!evCols.includes(col)) db.run(`ALTER TABLE events ADD COLUMN ${col} ${ddl}`);
  const auCols = dbAll('PRAGMA table_info(admin_users)').map(c => c.name);
  if (!auCols.includes('role')) {
    db.run("ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'manager'");
    db.run("UPDATE admin_users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM admin_users)");   // compte d'amorcage = admin (cf. db/seed.js)
  }
  if (!auCols.includes('created_at')) db.run('ALTER TABLE admin_users ADD COLUMN created_at TEXT');
  seedEvents();
  saveDb();
  return app;
}

module.exports = { app, init, safeRedirect, getDb: () => db };

if (require.main === module) {
  init().then(() => {
    app.listen(PORT, () => console.log(`CatchR running at http://localhost:${PORT}`));
  }).catch(e => { console.error(e.message); process.exit(1); });
}
