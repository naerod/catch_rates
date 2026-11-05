// Demarre l'application sur une base TEMPORAIRE generee par db/seed.js (independante de toute base locale).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
let template = null;

// Une base neuve est generee une fois par processus de test, puis copiee pour chaque serveur
function seededDb() {
  if (template && fs.existsSync(template)) return template;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catchr-seed-'));
  template = path.join(dir, 'catchrates.db');
  execFileSync(process.execPath, [path.join(ROOT, 'db', 'seed.js')], {
    env: { ...process.env, CATCHR_DB_PATH: template, ADMIN_PASSWORD: 'seed-only-test-pw' }, stdio: 'ignore',
  });
  process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
  return template;
}

function freshDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catchr-test-'));
  const dbPath = path.join(dir, 'catchrates.db');
  fs.copyFileSync(seededDb(), dbPath);
  return { dir, dbPath };
}

async function startServer(env = {}, { prepareDb } = {}) {
  const { dir, dbPath } = freshDbPath();
  if (prepareDb) await prepareDb(dbPath);
  Object.assign(process.env, { CATCHR_DB_PATH: dbPath, ...env });
  for (const k of Object.keys(require.cache)) if (k.startsWith(ROOT) && !k.includes('node_modules') && !k.includes(`${path.sep}test${path.sep}`)) delete require.cache[k];
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
  return { base, req, close, mod, dbPath, resetCookie: () => { cookie = ''; }, getCookie: () => cookie, setCookie: c => { cookie = c; } };
}

module.exports = { startServer, seededDb, freshDbPath };
