#!/usr/bin/env node
/**
 * fetch-recoil-data.js
 * Fetches recoil/suicide move data from PokeAPI for Gen 5 Pokémon (ID 1-649).
 * Outputs public/js/recoil-data.js for the warning system.
 *
 * Usage: node scripts/fetch-recoil-data.js
 */

const fs = require('fs');
const path = require('path');

// ── Recoil moves with severity classification ──
const RECOIL_MOVES = [
  // Critical — KO the user
  { api: 'self-destruct', display: 'Self-Destruct', severity: 'critical', recoilType: 'KO' },
  { api: 'explosion', display: 'Explosion', severity: 'critical', recoilType: 'KO' },
  { api: 'memento', display: 'Memento', severity: 'critical', recoilType: 'KO' },
  { api: 'healing-wish', display: 'Healing Wish', severity: 'critical', recoilType: 'KO' },
  { api: 'final-gambit', display: 'Final Gambit', severity: 'critical', recoilType: 'KO' },
  // High — ≥1/2 recoil
  { api: 'head-smash', display: 'Head Smash', severity: 'high', recoilType: '1/2 damage dealt' },
  // Medium — 1/3 recoil
  { api: 'brave-bird', display: 'Brave Bird', severity: 'medium', recoilType: '1/3 damage dealt' },
  { api: 'double-edge', display: 'Double-Edge', severity: 'medium', recoilType: '1/3 damage dealt' },
  { api: 'flare-blitz', display: 'Flare Blitz', severity: 'medium', recoilType: '1/3 damage dealt' },
  { api: 'volt-tackle', display: 'Volt Tackle', severity: 'medium', recoilType: '1/3 damage dealt' },
  { api: 'wood-hammer', display: 'Wood Hammer', severity: 'medium', recoilType: '1/3 damage dealt' },
  // Low — ≤1/4 recoil
  { api: 'take-down', display: 'Take Down', severity: 'low', recoilType: '1/4 damage dealt' },
  { api: 'submission', display: 'Submission', severity: 'low', recoilType: '1/4 damage dealt' },
  { api: 'head-charge', display: 'Head Charge', severity: 'low', recoilType: '1/4 damage dealt' },
  { api: 'wild-charge', display: 'Wild Charge', severity: 'low', recoilType: '1/4 damage dealt' },
];

const GEN5_VERSIONS = ['black-white', 'black-2-white-2'];
const MAX_ID = 649;
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const wait = ms => new Promise(r => setTimeout(r, ms));

async function apiFetch(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await wait(1000 * (i + 1));
    }
  }
}

async function main() {
  console.log('=== Fetching recoil move data from PokeAPI ===\n');

  // ── Phase 1: Fetch each move endpoint to get Pokemon learners ──
  // Only 15 API calls needed
  const pokemonMap = {}; // id → { name, moveSet: Set }

  for (const move of RECOIL_MOVES) {
    process.stdout.write(`  Fetching move: ${move.display}... `);
    try {
      const data = await apiFetch(`https://pokeapi.co/api/v2/move/${move.api}`);
      if (!data) { console.log('NOT FOUND'); continue; }

      let count = 0;
      for (const p of data.learned_by_pokemon) {
        const id = parseInt(p.url.match(/\/(\d+)\/$/)[1]);
        if (id > MAX_ID) continue;
        const name = p.name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        if (!pokemonMap[id]) pokemonMap[id] = { name, moveSet: new Set() };
        pokemonMap[id].moveSet.add(move.api);
        count++;
      }
      console.log(`${count} Pokemon`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
    await wait(600);
  }

  const uniqueIds = Object.keys(pokemonMap).map(Number).sort((a, b) => a - b);
  console.log(`\nPhase 1 complete: ${uniqueIds.length} unique Pokemon found.`);
  console.log('Phase 2: Verifying Gen 5 availability & getting method details...\n');

  // ── Phase 2: Fetch each Pokemon to verify Gen 5 move availability ──
  const results = {};
  let verified = 0, skipped = 0;

  for (let i = 0; i < uniqueIds.length; i++) {
    const id = uniqueIds[i];
    if (i % 50 === 0) {
      console.log(`  Progress: ${i}/${uniqueIds.length} (${Math.round(i / uniqueIds.length * 100)}%)`);
    }

    try {
      const pokemon = await apiFetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!pokemon) { skipped++; continue; }

      const verifiedMoves = [];

      for (const moveEntry of pokemon.moves) {
        const moveName = moveEntry.move.name;
        const recoilDef = RECOIL_MOVES.find(m => m.api === moveName);
        if (!recoilDef) continue;

        // Check Gen 5 version groups
        const gen5Details = moveEntry.version_group_details.filter(
          d => GEN5_VERSIONS.includes(d.version_group.name)
        );
        if (gen5Details.length === 0) continue;

        // Pick best method (prefer level-up for display)
        const methodPriority = { 'level-up': 0, 'machine': 1, 'egg': 2, 'tutor': 3 };
        gen5Details.sort((a, b) =>
          (methodPriority[a.move_learn_method.name] ?? 99) -
          (methodPriority[b.move_learn_method.name] ?? 99)
        );
        const best = gen5Details[0];

        verifiedMoves.push({
          move: recoilDef.display,
          method: best.move_learn_method.name,
          level: best.level_learned_at || null,
          severity: recoilDef.severity,
          recoilType: recoilDef.recoilType,
        });
      }

      if (verifiedMoves.length > 0) {
        verifiedMoves.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
        results[id] = {
          name: pokemonMap[id].name,
          moves: verifiedMoves,
        };
        verified++;
      }
    } catch (err) {
      // On error, include with Phase 1 data (no method details)
      const fallbackMoves = [];
      for (const moveApi of pokemonMap[id].moveSet) {
        const def = RECOIL_MOVES.find(m => m.api === moveApi);
        if (def) fallbackMoves.push({
          move: def.display, method: 'unknown', level: null,
          severity: def.severity, recoilType: def.recoilType,
        });
      }
      if (fallbackMoves.length > 0) {
        fallbackMoves.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
        results[id] = { name: pokemonMap[id].name, moves: fallbackMoves };
        verified++;
      }
      skipped++;
    }
    await wait(500);
  }

  console.log(`\nPhase 2 complete: ${verified} Pokemon verified, ${skipped} skipped.`);

  // ── Write output as JavaScript file ──
  const jsContent = `/* ════════════════════════════════════════════
   recoil-data.js — Comprehensive recoil/suicide move data (Gen 5)
   Auto-generated from PokeAPI on ${new Date().toISOString().split('T')[0]}
   Pokemon: ${Object.keys(results).length} | Moves tracked: ${RECOIL_MOVES.length}
   DO NOT EDIT MANUALLY — run: node scripts/fetch-recoil-data.js
   ════════════════════════════════════════════ */

const RECOIL_DATA = ${JSON.stringify(results, null, 2)};
`;

  const outPath = path.join(__dirname, '..', 'public', 'js', 'recoil-data.js');
  fs.writeFileSync(outPath, jsContent);

  // Also write JSON for reference
  const jsonPath = path.join(__dirname, '..', 'public', 'data', 'recoil-pokemon.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  console.log(`\n=== Done! ===`);
  console.log(`Output JS:   ${outPath}`);
  console.log(`Output JSON: ${jsonPath}`);
  console.log(`Total Pokemon with recoil moves in Gen 5: ${Object.keys(results).length}`);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
