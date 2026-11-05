// Base au schema historique (avant les colonnes role / dates d'evenement) : le demarrage la migre sans perte.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { startServer } = require('./helpers');

async function toLegacySchema(dbPath) {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  db.run('DROP TABLE admin_users');
  db.run('CREATE TABLE admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL)');
  db.run("INSERT INTO admin_users (username, password_hash) VALUES ('naerod', 'x'), ('helper', 'y')");
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

test('migration admin_users : role ajoute, premier compte admin, autres manager', async () => {
  const s = await startServer({}, { prepareDb: toLegacySchema });
  try {
    const rows = s.mod.getDb().exec('SELECT username, role FROM admin_users ORDER BY id')[0].values;
    assert.deepStrictEqual(rows, [['naerod', 'admin'], ['helper', 'manager']]);
    const evCols = s.mod.getDb().exec('PRAGMA table_info(events)')[0].values.map(c => c[1]);
    for (const c of ['starts_at', 'ends_at', 'kind', 'forecast', 'unverified']) assert.ok(evCols.includes(c), c);
    // La base sur disque a ete sauvegardee migree
    const SQL = await initSqlJs();
    const disk = new SQL.Database(fs.readFileSync(s.dbPath));
    assert.ok(disk.exec('PRAGMA table_info(admin_users)')[0].values.some(c => c[1] === 'role'));
  } finally { await s.close(); }
});

test('seed : refuse d\'ecraser une base existante sans --force', () => {
  const { execFileSync } = require('child_process');
  const path = require('path');
  const { freshDbPath } = require('./helpers');
  const { dbPath } = freshDbPath();
  const before = fs.readFileSync(dbPath);
  assert.throws(() => execFileSync(process.execPath, [path.join(__dirname, '..', 'db', 'seed.js')], { env: { ...process.env, CATCHR_DB_PATH: dbPath }, stdio: 'pipe' }));
  assert.ok(fs.readFileSync(dbPath).equals(before));
});
