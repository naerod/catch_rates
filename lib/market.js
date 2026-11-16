// Market : prix GTL de tous les objets (API publique de Fiereu), historique, investissements par compte.
// Le navigateur n'appelle jamais l'API externe. Noms : liste communautaire (pokemmohub) + noms saisis
// par les gestionnaires pour les objets recents qu'elle ne connait pas.
const NAMES = require('./market-names.json');
const API = 'https://apis.fiereu.de/pokemmoprices/v1';
const TTL = 10 * 60 * 1000;

async function getJson(url) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

const ts = a => Array.isArray(a) ? Date.UTC(a[0], a[1] - 1, a[2], a[3] || 0, a[4] || 0) : null;   // [Y,M,D,h,m,...] -> ms
const day = ms => new Date(ms).toISOString().slice(0, 10);

// Investissement : objet suivi, quantite, prix d'achat unitaire, date
const invList = v => Array.isArray(v) && v.length <= 200 && v.every(x => x && Number.isInteger(x.id) && x.id >= 0 &&
  Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 1e7 && Number.isFinite(x.price) && x.price >= 0 && x.price <= 1e10 &&
  (x.date == null || /^\d{4}-\d{2}-\d{2}$/.test(x.date))) ? v.map(({ id, qty, price, date }) => ({ id, qty, price, date: date || null })) : null;

function mount(app, { dbAll, dbGet, dbRun, saveDb, requireAuth }) {
  let cache = null;               // { at, items }
  const histCache = new Map();    // item_id -> { at, points }

  function names() {
    const custom = {};
    for (const r of dbAll('SELECT item_id, en, fr FROM market_names')) custom[r.item_id] = [r.en, r.fr || r.en];
    return custom;
  }

  async function refresh() {
    const list = await getJson(API + '/items');
    const custom = names();
    const items = list.map(i => {
      const n = custom[i.item_id] || NAMES[i.item_id];
      return { id: i.item_id, en: n?.[0] || null, fr: n?.[1] || null, named: !!custom[i.item_id], price: i.price, listings: i.listings,
        qty: i.quantity, tradable: i.tradable, updated: ts(i.last_updated), known: !!NAMES[i.item_id] };
    });
    cache = { at: Date.now(), items };
    const today = day(Date.now());
    for (const i of items) if (i.price > 0 && i.updated && day(i.updated) === today)
      dbRun('INSERT INTO market_daily (item_id, day, price, qty) VALUES (?, ?, ?, ?) ON CONFLICT(item_id, day) DO UPDATE SET price = MIN(price, excluded.price), qty = excluded.qty', [i.id, today, i.price, i.qty]);
    saveDb();
    return cache;
  }

  async function items() {
    if (!cache || Date.now() - cache.at >= TTL) {
      try { await refresh(); } catch (e) { console.error('market:', e.message); }
    }
    return cache;
  }

  app.get('/api/market/items', async (req, res) => {
    const c = await items();
    if (!c) return res.status(502).json({ error: 'Market prices unavailable' });
    res.json({ fetchedAt: c.at, stale: Date.now() - c.at >= TTL, items: c.items });
  });

  // historique = celui de l'API (jusqu'a sa derniere mise a jour) + nos releves quotidiens apres
  app.get('/api/market/items/:id/history', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 0) return res.status(400).json({ error: 'Bad request' });
    let h = histCache.get(id);
    if (!h || Date.now() - h.at >= 6 * TTL) {
      try {
        const raw = await getJson(`${API}/graph/items/${id}/min`);
        const byDay = new Map();
        for (const p of raw) { const d = day(p.x * 1000); if (!byDay.has(d) || p.y < byDay.get(d)) byDay.set(d, p.y); }
        h = { at: Date.now(), points: [...byDay].map(([d, price]) => ({ day: d, price })) };
        histCache.set(id, h);
      } catch (e) { console.error('market history:', e.message); h = h || { at: 0, points: [] }; }
    }
    const last = h.points.at(-1)?.day || '';
    const own = dbAll('SELECT day, price FROM market_daily WHERE item_id = ? AND day > ? ORDER BY day', [id, last]);
    res.json({ points: [...h.points, ...own] });
  });

  // nommer un objet que la liste communautaire ne connait pas (gestionnaires d'events et admins)
  app.put('/api/admin/market/names/:id', requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const en = String(req.body?.en || '').trim(), fr = String(req.body?.fr || '').trim();
    if (!Number.isInteger(id) || id < 0 || !en || en.length > 80 || fr.length > 80) return res.status(400).json({ error: 'Bad request' });
    const by = req.session?.oidcUser?.username || 'local';
    dbRun('INSERT INTO market_names (item_id, en, fr, author, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(item_id) DO UPDATE SET en = excluded.en, fr = excluded.fr, author = excluded.author, at = excluded.at',
      [id, en, fr || null, by, new Date().toISOString()]);
    saveDb();
    if (cache) for (const i of cache.items) if (i.id === id) Object.assign(i, { en, fr: fr || en, named: true });
    res.json({ id, en, fr: fr || en });
  });

  app.get('/api/me/investments', (req, res) => {
    const u = req.session?.oidcUser?.username; if (!u) return res.status(401).json({ error: 'Unauthorized' });
    res.json({ items: JSON.parse(dbGet('SELECT items FROM user_investments WHERE username = ?', [u])?.items || '[]') });
  });
  app.put('/api/me/investments', (req, res) => {
    const u = req.session?.oidcUser?.username; if (!u) return res.status(401).json({ error: 'Unauthorized' });
    const list = invList(req.body?.items);
    if (!list) return res.status(400).json({ error: 'Bad request' });
    dbRun('INSERT INTO user_investments (username, items) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET items = excluded.items', [u, JSON.stringify(list)]);
    saveDb();
    res.json({ items: list });
  });

  // appele une fois la base chargee (init du serveur)
  return function setup() {
    dbRun('CREATE TABLE IF NOT EXISTS market_names (item_id INTEGER PRIMARY KEY, en TEXT NOT NULL, fr TEXT, author TEXT, at TEXT)');
    // un point par objet et par jour (prix minimum du jour) : notre propre historique, independant de celui de l'API
    dbRun('CREATE TABLE IF NOT EXISTS market_daily (item_id INTEGER NOT NULL, day TEXT NOT NULL, price INTEGER NOT NULL, qty INTEGER, PRIMARY KEY (item_id, day))');
    dbRun('CREATE TABLE IF NOT EXISTS user_investments (username TEXT PRIMARY KEY, items TEXT NOT NULL DEFAULT \'[]\')');
    // releve horaire meme sans visiteur, pour que l'historique n'ait pas de trou
    if (process.env.NODE_ENV !== 'test') setInterval(() => refresh().catch(e => console.error('market:', e.message)), 60 * 60 * 1000).unref();
  };
}

module.exports = { mount, invList, ts };
