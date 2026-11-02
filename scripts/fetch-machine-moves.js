#!/usr/bin/env node
/**
 * fetch-machine-moves.js
 * Complète le CSV level-up avec les attaques suicide/recoil apprises par CT ou
 * par tuteur en Gen 5 (PokeAPI) -> db/recoil-machine-moves.json (level 0 = CT/tuteur).
 * Usage: node scripts/fetch-machine-moves.js && npm run seed:recoil
 */
const fs = require('fs');
const path = require('path');

const MOVES = {
  'self-destruct': ['Self-Destruct', 'User faints'], 'explosion': ['Explosion', 'User faints'],
  'memento': ['Memento', 'User faints'], 'healing-wish': ['Healing Wish', 'User faints'],
  'final-gambit': ['Final Gambit', 'User faints'],
  'head-smash': ['Head Smash', 'Recoil'], 'brave-bird': ['Brave Bird', 'Recoil'],
  'double-edge': ['Double-Edge', 'Recoil'], 'flare-blitz': ['Flare Blitz', 'Recoil'],
  'volt-tackle': ['Volt Tackle', 'Recoil'], 'wood-hammer': ['Wood Hammer', 'Recoil'],
  'take-down': ['Take Down', 'Recoil'], 'submission': ['Submission', 'Recoil'],
  'head-charge': ['Head Charge', 'Recoil'], 'wild-charge': ['Wild Charge', 'Recoil'],
};
const GEN5 = ['black-white', 'black-2-white-2'];
const getJson = async u => { for (let i = 0; i < 4; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch {} await new Promise(r => setTimeout(r, 1000 * (i + 1))); } throw new Error(u); };

(async () => {
  const ids = new Set();
  for (const m of Object.keys(MOVES)) {
    const d = await getJson(`https://pokeapi.co/api/v2/move/${m}`);
    d.learned_by_pokemon.forEach(p => { const id = +p.url.match(/\/(\d+)\/$/)[1]; if (id <= 649) ids.add(id); });
  }
  const rows = [];
  for (const id of [...ids].sort((a, b) => a - b)) {
    const p = await getJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const name = p.name.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    for (const mv of p.moves) {
      const def = MOVES[mv.move.name];
      if (!def) continue;
      const ok = mv.version_group_details.some(v => GEN5.includes(v.version_group.name) && ['machine', 'tutor'].includes(v.move_learn_method.name));
      if (ok) rows.push({ name, dex: id, move: def[0], type: def[1] });
    }
  }
  fs.writeFileSync(path.join(__dirname, '..', 'db', 'recoil-machine-moves.json'), JSON.stringify(rows));
  console.log(rows.length, 'machine/tutor entries');
})();
