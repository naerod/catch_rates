/* ════════════════════════════════════════════
   seed-recoil.js — Seeds the pokemon_recoil_moves table
   from: db/pokemon_recoil_moves_gen_1_to_5_and_6.csv

   Run standalone:  npm run seed:recoil
   Also called by:  npm run seed (via seed.js)
   ════════════════════════════════════════════ */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH  = path.join(__dirname, 'catchrates.db');
const CSV_PATH = path.join(__dirname, 'pokemon_recoil_moves_gen_1_to_5_and_6.csv');

(async () => {
  if (!fs.existsSync(DB_PATH)) {
    console.error('DB not found. Run: npm run seed first.');
    process.exit(1);
  }
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV not found:', CSV_PATH);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(fileBuffer);

  // Create table
  db.run(`
    CREATE TABLE IF NOT EXISTS pokemon_recoil_moves (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      dex_number   INTEGER NOT NULL,
      pokemon_name TEXT    NOT NULL,
      move_name    TEXT    NOT NULL,
      level        INTEGER NOT NULL,
      recoil_type  TEXT    NOT NULL
    );
  `);
  db.run('DELETE FROM pokemon_recoil_moves');

  // Parse CSV (strip BOM, handle \r\n)
  const csv   = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
  const lines = csv.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());

  console.log(`CSV resolved: ${CSV_PATH}`);
  console.log(`Lines to parse (excl. header): ${lines.length - 1}`);

  const insert = db.prepare(
    'INSERT INTO pokemon_recoil_moves (dex_number, pokemon_name, move_name, level, recoil_type) VALUES (?, ?, ?, ?, ?)'
  );
  let count = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) { skipped++; continue; }

    const pokemonName = parts[0].trim();
    const dexNumber   = parseInt(parts[1].trim(), 10);
    const moveName    = parts[2].trim();
    const level       = parseInt(parts[3].trim(), 10);
    const recoilType  = parts.slice(4).join(',').trim();

    if (isNaN(dexNumber) || isNaN(level) || !moveName) { skipped++; continue; }

    insert.run([dexNumber, pokemonName, moveName, level, recoilType]);
    count++;
  }
  insert.free();

  if (skipped > 0) console.warn(`  Skipped ${skipped} malformed lines.`);
  console.log(`Inserted ${count} recoil move entries.`);

  // Verify
  const stmt = db.prepare('SELECT COUNT(*) as cnt FROM pokemon_recoil_moves');
  stmt.step();
  const { cnt } = stmt.getAsObject();
  stmt.free();
  console.log(`Table pokemon_recoil_moves: ${cnt} rows confirmed.`);

  // Save
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();
  console.log('Recoil data saved to DB.');
})();
