/* ════════════════════════════════════════════
   warnings.js — Capture Warning System
   Warns about dangerous abilities/moves when catching
   ════════════════════════════════════════════ */

const Warnings = {

  // ── 2a: Suicide / Recoil moves (Pokemon that can KO themselves in wild) ──
  // Maps Pokemon ID → array of dangerous move names
  SUICIDE_POKEMON: {
    // Self-Destruct / Explosion learners (level-up)
    74: ['Self-Destruct', 'Explosion'],   // Geodude
    75: ['Self-Destruct', 'Explosion'],   // Graveler
    76: ['Self-Destruct', 'Explosion'],   // Golem
    100: ['Self-Destruct', 'Explosion'],  // Voltorb
    101: ['Self-Destruct', 'Explosion'],  // Electrode
    109: ['Self-Destruct', 'Explosion'],  // Koffing
    110: ['Self-Destruct', 'Explosion'],  // Weezing
    204: ['Self-Destruct', 'Explosion'],  // Pineco
    205: ['Self-Destruct', 'Explosion'],  // Forretress
    337: ['Explosion'],                   // Lunatone
    338: ['Explosion'],                   // Solrock
    343: ['Self-Destruct', 'Explosion'],  // Baltoy
    344: ['Self-Destruct', 'Explosion'],  // Claydol
    362: ['Self-Destruct', 'Explosion'],  // Glalie
    436: ['Self-Destruct', 'Explosion'],  // Bronzor
    437: ['Self-Destruct', 'Explosion'],  // Bronzong
    557: ['Self-Destruct'],               // Dwebble
    558: ['Self-Destruct'],               // Crustle
    524: ['Self-Destruct', 'Explosion'],  // Roggenrola
    525: ['Self-Destruct', 'Explosion'],  // Boldore
    526: ['Self-Destruct', 'Explosion'],  // Gigalith
    597: ['Self-Destruct'],               // Ferroseed
    598: ['Explosion'],                   // Ferrothorn
    // Memento learners
    434: ['Memento'],                     // Stunky
    435: ['Memento'],                     // Skuntank
    // Healing Wish / Final Gambit
    550: ['Final Gambit'],                // Basculin
    539: ['Final Gambit'],                // Sawk
    // Recoil moves (Take Down / Double-Edge / Head Smash / Brave Bird)
    // Only listing Pokemon where these are primary STAB or very common
    408: ['Head Smash'],                  // Cranidos
    409: ['Head Smash'],                  // Rampardos
    566: ['Head Smash'],                  // Archen
    567: ['Head Smash'],                  // Archeops
    627: ['Brave Bird'],                  // Rufflet
    628: ['Brave Bird'],                  // Braviary
    396: ['Brave Bird'],                  // Starly
    397: ['Brave Bird'],                  // Staravia
    398: ['Brave Bird'],                  // Staraptor
    293: ['Whirlwind'],                   // Whismur — actually Roar/Whirlwind flee
    // Roar / Whirlwind (flee moves — not suicide but can end encounter)
    58: ['Roar'],                         // Growlithe
    59: ['Roar'],                         // Arcanine
    // Perish Song
    200: ['Perish Song'],                 // Misdreavus
    429: ['Perish Song'],                 // Mismagius
    359: ['Perish Song'],                 // Absol
  },

  // ── 2c: Insomnia / Vital Spirit (can't be put to sleep) ──
  // Pokemon ID → ability name
  SLEEP_IMMUNE: {
    // Insomnia
    163: 'Insomnia',    // Hoothoot
    164: 'Insomnia',    // Noctowl
    167: 'Insomnia',    // Spinarak
    168: 'Insomnia',    // Ariados
    198: 'Insomnia',    // Murkrow
    353: 'Insomnia',    // Shuppet
    354: 'Insomnia',    // Banette
    430: 'Insomnia',    // Honchkrow
    574: 'Insomnia',    // Gothita (hidden)
    575: 'Insomnia',    // Gothorita (hidden)
    576: 'Insomnia',    // Gothitelle (hidden)
    // Vital Spirit
    56: 'Vital Spirit',   // Mankey
    57: 'Vital Spirit',   // Primeape
    125: 'Vital Spirit',  // Electabuzz
    126: 'Vital Spirit',  // Magmar
    225: 'Vital Spirit',  // Delibird
    236: 'Vital Spirit',  // Tyrogue
    239: 'Vital Spirit',  // Elekid
    240: 'Vital Spirit',  // Magby
    288: 'Vital Spirit',  // Vigoroth
    466: 'Vital Spirit',  // Electivire
    467: 'Vital Spirit',  // Magmortar
    506: 'Vital Spirit',  // Lillipup
  },

  // ── 2d: Sand Stream / Snow Warning (weather damage) ──
  WEATHER_POKEMON: {
    // Sand Stream
    248: { ability: 'Sand Stream', weather: 'sandstorm' },  // Tyranitar
    449: { ability: 'Sand Stream', weather: 'sandstorm' },  // Hippopotas
    450: { ability: 'Sand Stream', weather: 'sandstorm' },  // Hippowdon
    // Snow Warning
    459: { ability: 'Snow Warning', weather: 'hail' },      // Snover
    460: { ability: 'Snow Warning', weather: 'hail' },      // Abomasnow
  },

  /**
   * Get all warnings for a given Pokemon.
   * Returns an array of warning objects: { type, severity, icon, moves/ability/weather }
   */
  getWarnings(pokemon) {
    if (!pokemon) return [];
    const warnings = [];
    const id = pokemon.id;

    // 2a: Suicide / Recoil / Flee moves
    if (this.SUICIDE_POKEMON[id]) {
      const moves = this.SUICIDE_POKEMON[id];
      const hasSuicide = moves.some(m =>
        ['Self-Destruct', 'Explosion', 'Memento', 'Final Gambit', 'Healing Wish'].includes(m)
      );
      const hasRecoil = moves.some(m =>
        ['Head Smash', 'Brave Bird', 'Double-Edge', 'Take Down'].includes(m)
      );
      const hasFlee = moves.some(m =>
        ['Roar', 'Whirlwind', 'Perish Song'].includes(m)
      );

      if (hasSuicide) {
        warnings.push({
          type: 'suicide',
          severity: 'danger',
          icon: '💀',
          moves: moves.filter(m =>
            ['Self-Destruct', 'Explosion', 'Memento', 'Final Gambit', 'Healing Wish'].includes(m)
          )
        });
      }
      if (hasRecoil) {
        warnings.push({
          type: 'recoil',
          severity: 'warning',
          icon: '💥',
          moves: moves.filter(m =>
            ['Head Smash', 'Brave Bird', 'Double-Edge', 'Take Down'].includes(m)
          )
        });
      }
      if (hasFlee) {
        warnings.push({
          type: 'flee',
          severity: 'warning',
          icon: '🌪️',
          moves: moves.filter(m =>
            ['Roar', 'Whirlwind', 'Perish Song'].includes(m)
          )
        });
      }
    }

    // 2b: Ghost type (False Swipe doesn't work)
    if (pokemon.type1 === 'ghost' || pokemon.type2 === 'ghost') {
      warnings.push({
        type: 'ghost',
        severity: 'info',
        icon: '👻',
      });
    }

    // 2c: Sleep immunity
    if (this.SLEEP_IMMUNE[id]) {
      warnings.push({
        type: 'sleep_immune',
        severity: 'info',
        icon: '🚫💤',
        ability: this.SLEEP_IMMUNE[id],
      });
    }

    // 2d: Weather damage
    if (this.WEATHER_POKEMON[id]) {
      const w = this.WEATHER_POKEMON[id];
      warnings.push({
        type: 'weather',
        severity: 'warning',
        icon: w.weather === 'sandstorm' ? '🏜️' : '🌨️',
        ability: w.ability,
        weather: w.weather,
      });
    }

    return warnings;
  },

  /**
   * Build localized warning text for a given warning object.
   */
  warningText(w) {
    switch (w.type) {
      case 'suicide':
        return i18n.t('warn_suicide').replace('{moves}', w.moves.join(', '));
      case 'recoil':
        return i18n.t('warn_recoil').replace('{moves}', w.moves.join(', '));
      case 'flee':
        return i18n.t('warn_flee').replace('{moves}', w.moves.join(', '));
      case 'ghost':
        return i18n.t('warn_ghost');
      case 'sleep_immune':
        return i18n.t('warn_sleep_immune').replace('{ability}', w.ability);
      case 'weather':
        return i18n.t('warn_weather').replace('{ability}', w.ability);
      default:
        return '';
    }
  },

  /**
   * Render warning badges as HTML string.
   */
  renderWarnings(pokemon) {
    const warnings = this.getWarnings(pokemon);
    if (!warnings.length) return '';

    return `<div class="capture-warnings">${
      warnings.map(w => {
        const severityClass = `warn-${w.severity}`;
        return `<div class="capture-warning ${severityClass}">
          <span class="warn-icon">${w.icon}</span>
          <span class="warn-text">${this.warningText(w)}</span>
        </div>`;
      }).join('')
    }</div>`;
  }
};
