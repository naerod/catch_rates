const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'catchrates.db');
const DATA_PATH = path.join(__dirname, '..', 'pokemon_data.json');
const TYPES_PATH = path.join(__dirname, 'pokemon_types.json');

function getGeneration(id) {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  return 6;
}

(async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run('PRAGMA foreign_keys = ON;');

  db.run(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      catch_rate INTEGER NOT NULL,
      generation INTEGER NOT NULL,
      type1 TEXT NOT NULL DEFAULT 'normal',
      type2 TEXT DEFAULT NULL
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS pokeballs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      multiplier REAL NOT NULL,
      cost INTEGER NOT NULL,
      condition_key TEXT DEFAULT NULL,
      sort_order INTEGER DEFAULT 0
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS event_pokemon (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      pokemon_id INTEGER NOT NULL,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      UNIQUE(event_id, pokemon_id)
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
  `);

  console.log('Tables created.');

  // Seed Pokémon
  const pokemonData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const typesData = JSON.parse(fs.readFileSync(TYPES_PATH, 'utf8'));
  const insertPokemon = db.prepare('INSERT OR REPLACE INTO pokemon (id, name, catch_rate, generation, type1, type2) VALUES (?, ?, ?, ?, ?, ?)');
  for (const p of pokemonData) {
    const types = typesData[String(p.id)] || ['normal', null];
    insertPokemon.run([p.id, p.name, p.catch_rate, getGeneration(p.id), types[0], types[1]]);
  }
  insertPokemon.free();
  console.log(`Inserted ${pokemonData.length} Pokémon with types.`);

  // Seed Pokéballs
  const balls = [
    { key: 'quick_ball',  name_en: 'Quick Ball',  name_fr: 'Rapide Ball', multiplier: 5.0,  cost: 1200, condition_key: 'quick',    sort_order: 1 },
    { key: 'pokeball',    name_en: 'Poke Ball',   name_fr: 'Poke Ball',   multiplier: 1.0,  cost: 200,  condition_key: null,        sort_order: 2 },
    { key: 'greatball',   name_en: 'Great Ball',  name_fr: 'Super Ball',  multiplier: 1.5,  cost: 600,  condition_key: null,        sort_order: 3 },
    { key: 'ultraball',   name_en: 'Ultra Ball',  name_fr: 'Hyper Ball',  multiplier: 2.0,  cost: 1200, condition_key: null,        sort_order: 4 },
    { key: 'timerball',   name_en: 'Timer Ball',  name_fr: 'Chrono Ball', multiplier: 4.0,  cost: 1200, condition_key: 'timer',     sort_order: 5 },
    { key: 'loveball',    name_en: 'Love Ball',   name_fr: 'Love Ball',   multiplier: 8.0,  cost: 1200, condition_key: 'love',      sort_order: 6 },
    { key: 'duskball',    name_en: 'Dusk Ball',   name_fr: 'Sombre Ball', multiplier: 2.5,  cost: 1200, condition_key: 'night',     sort_order: 7 },
    { key: 'netball',     name_en: 'Net Ball',    name_fr: 'Filet Ball',  multiplier: 3.5,  cost: 1200, condition_key: 'bugwater',  sort_order: 8 },
  ];
  const insertBall = db.prepare('INSERT OR REPLACE INTO pokeballs (key, name_en, name_fr, multiplier, cost, condition_key, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const b of balls) {
    insertBall.run([b.key, b.name_en, b.name_fr, b.multiplier, b.cost, b.condition_key ?? null, b.sort_order]);
  }
  insertBall.free();
  console.log('Inserted Pokéballs.');

  // Seed admin user (SHA-256 of 'admin123')
  const passwordHash = crypto.createHash('sha256').update('admin123').digest('hex');
  db.run('INSERT OR IGNORE INTO admin_users (username, password_hash) VALUES (?, ?)', ['naerod', passwordHash]);
  console.log('Admin user created (naerod / admin123).');

  // Seed events
  db.run("INSERT OR IGNORE INTO events (slug, name_en, name_fr, active) VALUES (?, ?, ?, ?)",
    ['xmas-2024', 'XMAS 2024', 'Noel 2024', 1]);
  db.run("INSERT OR IGNORE INTO events (slug, name_en, name_fr, active) VALUES (?, ?, ?, ?)",
    ['lny-2025', 'LNY 2025', 'Nouvel An Lunaire 2025', 1]);

  const getEventId = (slug) => {
    const stmt = db.prepare('SELECT id FROM events WHERE slug = ?');
    stmt.bind([slug]);
    let id = null;
    if (stmt.step()) id = stmt.getAsObject().id;
    stmt.free();
    return id;
  };

  const xmasId = getEventId('xmas-2024');
  const lnyId = getEventId('lny-2025');

  // XMAS 2024 Pokémon (by correct Pokédex IDs)
  // Spheal=363, Staryu=120, Swinub=220, Deerling=585, Pineco=204, Seel=86,
  // Snorunt=361, Snover=459, Chingling=433, Dewgong=87, Stantler=234, Glaceon=471,
  // Lapras=131, Smoochum=238, Treecko=252, Delibird=225
  const xmasPokemon = [363, 120, 220, 585, 204, 86, 361, 459, 433, 87, 234, 471, 131, 238, 252, 225];

  // LNY 2025 Pokémon
  // Spoink=325, Minccino=572, Spinda=327, Numel=322, Nidoran-F=29, Nidoran-M=32,
  // Swinub=220, Growlithe=58, Pikachu=25, Deerling=585, Meditite=307, Cottonee=546
  const lnyPokemon = [325, 572, 327, 322, 29, 32, 220, 58, 25, 585, 307, 546];

  const insertEP = db.prepare('INSERT OR IGNORE INTO event_pokemon (event_id, pokemon_id) VALUES (?, ?)');
  for (const pid of xmasPokemon) insertEP.run([xmasId, pid]);
  for (const pid of lnyPokemon) insertEP.run([lnyId, pid]);
  insertEP.free();

  console.log('Events seeded.');

  // ── Recoil Moves ────────────────────────────────────────────────────────────
  const CSV_PATH = path.join(__dirname, 'pokemon_recoil_moves_gen_1_to_5_and_6.csv');
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

  if (fs.existsSync(CSV_PATH)) {
    const csv   = fs.readFileSync(CSV_PATH, 'utf8').replace(/^\uFEFF/, '');
    const lines = csv.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim());
    console.log(`Recoil CSV: ${lines.length - 1} data lines`);

    const insertRecoil = db.prepare(
      'INSERT INTO pokemon_recoil_moves (dex_number, pokemon_name, move_name, level, recoil_type) VALUES (?, ?, ?, ?, ?)'
    );
    let recoilCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length < 5) continue;
      const pokemonName = parts[0].trim();
      const dexNumber   = parseInt(parts[1].trim(), 10);
      const moveName    = parts[2].trim();
      const level       = parseInt(parts[3].trim(), 10);
      const recoilType  = parts.slice(4).join(',').trim();
      if (isNaN(dexNumber) || isNaN(level) || !moveName) continue;
      insertRecoil.run([dexNumber, pokemonName, moveName, level, recoilType]);
      recoilCount++;
    }
    insertRecoil.free();

    const chk = db.prepare('SELECT COUNT(*) as cnt FROM pokemon_recoil_moves');
    chk.step();
    const { cnt } = chk.getAsObject();
    chk.free();
    console.log(`Inserted ${recoilCount} recoil entries (${cnt} rows in table).`);
  } else {
    console.warn(`Recoil CSV not found — skipping (${CSV_PATH})`);
  }

  // Save to disk
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log('\nDatabase initialized successfully!');
  console.log('Run: npm start');
})();
