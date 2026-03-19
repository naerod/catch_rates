/* ═══════════════════════════════════════════════════════════════
   seed-recoil.js — Imports self-damaging move data from CSV
   into the pokemon_recoil_moves table.

   Source of truth: .claude/fichiers/pokemon_recoil_moves_gen_1_to_5_and_6.csv
   Columns: Pokémon, Dex #, Move, Level, Recoil Type

   Recoil Type values:
     "User faints"  → SUICIDE category (Self-Destruct, Explosion, Memento, etc.)
     "1/4 damage"   → RECOIL category
     "1/3 damage"   → RECOIL category
     "1/2 damage"   → RECOIL category
   ═══════════════════════════════════════════════════════════════ */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH  = path.join(__dirname, 'catchrates.db');
const CSV_PATH = path.join(__dirname, '..', '.claude', 'fichiers', 'pokemon_recoil_moves_gen_1_to_5_and_6.csv');

(async () => {
  if (!fs.existsSync(DB_PATH)) {
    console.error('Database not found. Run: npm run seed');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV file not found at:', CSV_PATH);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Drop and recreate to allow re-running this script safely
  db.run('DROP TABLE IF EXISTS pokemon_recoil_moves');
  db.run(`
    CREATE TABLE pokemon_recoil_moves (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_name TEXT    NOT NULL,
      dex_number   INTEGER NOT NULL,
      move_name    TEXT    NOT NULL,
      level        INTEGER NOT NULL,
      recoil_type  TEXT    NOT NULL
    )
  `);
  db.run('CREATE INDEX idx_recoil_dex ON pokemon_recoil_moves (dex_number)');

  // Parse CSV (UTF-8, comma-separated, no quoting)
  // Header line is skipped (line 1: Pokémon,Dex #,Move,Level,Recoil Type)
  const csvText = fs.readFileSync(CSV_PATH, 'utf8');
  const lines   = csvText.split('\n').slice(1); // skip header

  const insert = db.prepare(
    'INSERT INTO pokemon_recoil_moves (pokemon_name, dex_number, move_name, level, recoil_type) VALUES (?, ?, ?, ?, ?)'
  );

  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Split on comma — field values never contain commas in this CSV
    const parts = trimmed.split(',');
    if (parts.length < 5) continue;

    const pokemonName = parts[0].trim();
    const dexNumber   = parseInt(parts[1].trim(), 10);
    const moveName    = parts[2].trim();
    const level       = parseInt(parts[3].trim(), 10);
    // Recoil Type may be "1/4 damage", "1/3 damage", etc. — safe as-is
    const recoilType  = parts.slice(4).join(',').trim();

    if (!pokemonName || isNaN(dexNumber) || !moveName || isNaN(level) || !recoilType) {
      console.warn('Skipping malformed row:', trimmed);
      continue;
    }

    insert.run([pokemonName, dexNumber, moveName, level, recoilType]);
    count++;
  }

  insert.free();
  console.log(`Inserted ${count} recoil move records.`);

  // Save updated DB back to disk
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log('Recoil data seeded successfully!');
  console.log('Restart the server (npm start) to apply changes.');
})();
