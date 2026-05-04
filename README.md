# naerod's Catch Calculator — PokeMMO

A catch rate calculator for PokeMMO, replacing the old Google Sheets workflow.

## Quick Start

```bash
npm install
npm run seed
npm start
# → http://localhost:3000
```

## Features

- Gen 3-5 catch rate formula (same as PokeMMO)
- 650 Pokémon (Gen 1–5 + 2 Gen 6)
- All 8 Pokéballs with correct multipliers and conditions
- FR/EN bilingual interface
- Dark gaming theme
- Admin panel to manage events
- PokeMMO event pages (XMAS 2024, LNY 2025...)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `SESSION_SECRET` | *(hardcoded)* | Change in production! |

## Deployment (VPS)

```bash
# Install dependencies
npm install

# Seed the database
npm run seed

# Start with PM2 (recommended)
npm install -g pm2
pm2 start server.js --name pokecalc
pm2 save
pm2 startup
```

Set `SESSION_SECRET` as an environment variable in production:
```bash
SESSION_SECRET=your-long-random-secret pm2 start server.js --name pokecalc
```

## File Structure

```
├── server.js              Express server + API routes
├── package.json
├── pokemon_data.json      650 Pokémon source data
├── db/
│   ├── seed.js            Database init + seeding
│   └── catchrates.db      SQLite database (created by seed.js)
└── public/
    ├── index.html         Single Page Application
    ├── css/style.css      Dark gaming theme
    └── js/
        ├── i18n.js        FR/EN translation system
        ├── calc.js        Catch rate formula engine
        └── app.js         UI logic
```

## Catch Rate Formula

Gen 3-5 formula used by PokeMMO:

```
a = ((3 × MaxHP - 2 × CurrentHP) / (3 × MaxHP)) × CatchRate × BallMultiplier × StatusMultiplier
p = (a / 255)^0.25   [simplified]
```

MaxHP is fixed at 100. If probability > 1.0, capture is guaranteed.
