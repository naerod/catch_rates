// Generation du SQL PostgreSQL (le chargement reel dans PostgreSQL : scripts/test-postgres-migration.sh).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const initSqlJs = require('sql.js');
const { freshDbPath } = require('./helpers');
const { buildSql } = require('../scripts/migrate-to-postgres');

test('base seedee : tout est importe, transaction et sequences recalees', async () => {
  const { dbPath } = freshDbPath();
  const { sql, report } = await buildSql(dbPath);
  assert.match(sql, /^-- CatchR[\s\S]*\nBEGIN;\n[\s\S]*\nCOMMIT;\n$/);
  for (const [t, r] of Object.entries(report)) assert.strictEqual(r.imported, r.source, t);
  assert.ok(report.pokemon.imported > 600);
  assert.match(sql, /setval\(pg_get_serial_sequence\('events', 'id'\)/);
});

test('orphelins, slug invalide, apostrophes, ancien schema admin_users', async () => {
  const { dbPath } = freshDbPath();
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(dbPath));
  db.run('PRAGMA foreign_keys = OFF');
  db.run("INSERT INTO events (slug, name_en, name_fr, active) VALUES ('BAD SLUG', 'x', '', 1), ('ok-1', 'O''Brien''s day', '', 0)");
  db.run('INSERT INTO event_pokemon (event_id, pokemon_id) VALUES (9999, 25), (1, 99999)');
  db.run('DROP TABLE admin_users');
  db.run('CREATE TABLE admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL)');
  db.run("INSERT INTO admin_users (username, password_hash) VALUES ('first', 'h1'), ('second', 'h2')");
  fs.writeFileSync(dbPath, Buffer.from(db.export()));

  const logs = [];
  const { sql, report } = await buildSql(dbPath, m => logs.push(m));
  assert.strictEqual(report.events.skipped, 1);
  assert.strictEqual(report.event_pokemon.skipped, 2);
  assert.ok(logs.some(l => l.includes('orphelin')));
  assert.match(sql, /'O''Brien''s day'/);                         // echappement SQL
  assert.match(sql, /'ok-1', 'O''Brien''s day', '', FALSE/);       // booleen converti
  assert.match(sql, /'first', 'h1', 'admin'/);
  assert.match(sql, /'second', 'h2', 'manager'/);
  assert.doesNotMatch(sql, /BAD SLUG/);
});
