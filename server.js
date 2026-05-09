const express = require('express');
const session = require('express-session');
const initSqlJs = require('sql.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db', 'catchrates.db');

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

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ball-images', express.static(path.join(__dirname, 'db', 'images')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-production-pokemmo-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ─── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminRole === 'admin') return next();
  res.status(403).json({ error: 'Forbidden' });
}

// ─── Pokémon ───────────────────────────────────────────────────────────────────
app.get('/api/pokemon/search', (req, res) => {
  const q = req.query.q || '';
  const rows = dbAll(
    'SELECT id, name, catch_rate, generation, type1, type2 FROM pokemon WHERE name LIKE ? LIMIT 20',
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
  res.json(dbAll('SELECT * FROM events ORDER BY sort_order ASC, created_at DESC'));
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
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const user = dbGet('SELECT * FROM admin_users WHERE username = ? AND password_hash = ?', [username, hash]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  req.session.adminId = user.id;
  req.session.adminUsername = user.username;
  req.session.adminRole = user.role;
  res.json({ success: true, username: user.username, role: user.role });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/admin/check', (req, res) => {
  if (req.session && req.session.adminId) {
    res.json({ authenticated: true, username: req.session.adminUsername, role: req.session.adminRole });
  } else {
    res.json({ authenticated: false });
  }
});

// ─── Admin Events ──────────────────────────────────────────────────────────────
app.put('/api/admin/events/reorder', requireAuth, (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids must be an array' });
  ids.forEach((id, i) => dbRun('UPDATE events SET sort_order=? WHERE id=?', [i, id]));
  saveDb();
  res.json({ success: true });
});

app.post('/api/admin/events', requireAuth, (req, res) => {
  const { slug, name_en, name_fr, active } = req.body;
  if (!slug || !name_en) return res.status(400).json({ error: 'Missing fields' });
  try {
    const result = dbRun(
      'INSERT INTO events (slug, name_en, name_fr, active) VALUES (?, ?, ?, ?)',
      [slug, name_en, name_fr, active ? 1 : 0]
    );
    saveDb();
    res.json({ id: result.lastInsertRowid, slug, name_en, name_fr, active: active ? 1 : 0 });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/events/:id', requireAuth, (req, res) => {
  const { slug, name_en, name_fr, active } = req.body;
  try {
    dbRun('UPDATE events SET slug=?, name_en=?, name_fr=?, active=? WHERE id=?',
      [slug, name_en, name_fr, active ? 1 : 0, req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/events/:id', requireAuth, (req, res) => {
  dbRun('DELETE FROM events WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

app.post('/api/admin/events/:id/pokemon', requireAuth, (req, res) => {
  const { pokemon_id } = req.body;
  if (!pokemon_id) return res.status(400).json({ error: 'Missing pokemon_id' });
  try {
    dbRun('INSERT INTO event_pokemon (event_id, pokemon_id) VALUES (?, ?)', [req.params.id, pokemon_id]);
    saveDb();
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/events/:eventId/pokemon/:pokemonId', requireAuth, (req, res) => {
  dbRun('DELETE FROM event_pokemon WHERE event_id=? AND pokemon_id=?',
    [req.params.eventId, req.params.pokemonId]);
  saveDb();
  res.json({ success: true });
});

app.post('/api/admin/change-password', requireAuth, (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password too short (min 6 chars)' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
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
  if (!username || !password || !['admin', 'manager'].includes(role))
    return res.status(400).json({ error: 'Missing or invalid fields' });
  if (password.length < 6) return res.status(400).json({ error: 'Password too short (min 6 chars)' });
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  try {
    const result = dbRun('INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role]);
    saveDb();
    res.json({ id: result.lastInsertRowid, username, role });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  const { username, role, password } = req.body;
  if (!username || !['admin', 'manager'].includes(role))
    return res.status(400).json({ error: 'Missing or invalid fields' });
  try {
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password too short (min 6 chars)' });
      const hash = crypto.createHash('sha256').update(password).digest('hex');
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
  if (Number(req.params.id) === req.session.adminId)
    return res.status(400).json({ error: 'Cannot delete your own account' });
  dbRun('DELETE FROM admin_users WHERE id=?', [req.params.id]);
  saveDb();
  res.json({ success: true });
});

// ─── Serve SPA ─────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ─────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found. Run: npm run seed');
    process.exit(1);
  }
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(fileBuffer);
  db.run('PRAGMA foreign_keys = ON;');

  app.listen(PORT, () => {
    console.log(`naerod's Catch Calculator running at http://localhost:${PORT}`);
  });
})();
