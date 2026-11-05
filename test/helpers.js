// Demarre l'application sur une COPIE temporaire de la base (jamais la base versionnee).
const fs = require('fs');
const os = require('os');
const path = require('path');

async function startServer(env = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catchr-test-'));
  const dbPath = path.join(dir, 'catchrates.db');
  fs.copyFileSync(path.join(__dirname, '..', 'db', 'catchrates.db'), dbPath);
  Object.assign(process.env, { CATCHR_DB_PATH: dbPath, ...env });
  for (const k of Object.keys(require.cache)) if (k.endsWith(path.join('catch_rates', 'server.js'))) delete require.cache[k];
  const mod = require('../server.js');
  await mod.init();
  const server = await new Promise(r => { const s = mod.app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  // Petit client avec gestion du cookie de session
  let cookie = '';
  const req = async (url, opts = {}) => {
    const headers = { ...(opts.headers || {}) };
    if (cookie) headers.cookie = cookie;
    let body = opts.body;
    if (body && typeof body === 'object') { body = JSON.stringify(body); headers['content-type'] = 'application/json'; }
    const r = await fetch(base + url, { ...opts, headers, body, redirect: 'manual' });
    const sc = r.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return r;
  };
  const close = () => new Promise(r => server.close(() => { fs.rmSync(dir, { recursive: true, force: true }); r(); }));
  return { base, req, close, mod, resetCookie: () => { cookie = ''; } };
}

module.exports = { startServer };
