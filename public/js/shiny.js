/* ════════════════════════════════════════════
   shiny.js — Shiny Hunter Helper
   Best spots, methods & cost calculator
   ════════════════════════════════════════════ */

const Shiny = {

  // PokeMMO shiny rate
  BASE_RATE: 1 / 30000,
  // Bonus multipliers (additive percentage bonuses applied to the base rate)
  CHARM_BONUS: 1.10,     // Shiny Charm: +10%
  DONATOR_BONUS: 1.05,   // Donator Status: +5%
  EVENT_BONUS: 1.05,     // Event Bonus (Shiny Wars / Lunar Year): +5%

  // Encounter methods multiplier (Pokemon seen per encounter)
  METHODS: {
    horde5:  { pokemon: 5, key: 'shiny_horde5',  timePerEnc: 25 },
    horde3:  { pokemon: 3, key: 'shiny_horde3',  timePerEnc: 25 },
    single:  { pokemon: 1, key: 'shiny_single',  timePerEnc: 15 },
    fishing: { pokemon: 1, key: 'shiny_fishing', timePerEnc: 12 },
    egg:     { pokemon: 1, key: 'shiny_egg',     timePerEnc: 120 },
  },

  // ── Shiny hunting spot database ──
  // Maps Pokemon ID → array of spots with method, location, encounter rate, etc.
  SPOTS: {
    // ── Starters (egg only) ──
    1:   [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    4:   [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    7:   [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    152: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    155: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    158: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    252: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    255: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    258: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    387: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    390: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    393: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    495: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    498: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],
    501: [{ method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' }],

    // ── Common horde Pokemon ──
    // Zubat
    41:  [
      { method: 'horde5', location: 'Granite Cave B1F', encounterRate: 100, region: 'Hoenn', pcDistance: 'close' },
      { method: 'horde5', location: 'Mt. Moon 1F', encounterRate: 80, region: 'Kanto', pcDistance: 'medium' },
    ],
    // Geodude
    74:  [
      { method: 'horde5', location: 'Granite Cave B2F', encounterRate: 50, region: 'Hoenn', pcDistance: 'close' },
      { method: 'horde5', location: 'Mt. Moon 1F', encounterRate: 20, region: 'Kanto', pcDistance: 'medium' },
    ],
    // Tentacool
    72:  [
      { method: 'horde5', location: 'Route 107 (Surf)', encounterRate: 60, region: 'Hoenn', pcDistance: 'medium' },
      { method: 'fishing', location: 'Route 19', encounterRate: 40, region: 'Kanto', pcDistance: 'close' },
    ],
    // Ralts
    280: [
      { method: 'horde5', location: 'Route 102', encounterRate: 4, region: 'Hoenn', pcDistance: 'close' },
      { method: 'single', location: 'Route 102', encounterRate: 4, region: 'Hoenn', pcDistance: 'close' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Magikarp
    129: [
      { method: 'horde5', location: 'Route 119 (Surf)', encounterRate: 30, region: 'Hoenn', pcDistance: 'medium' },
      { method: 'fishing', location: 'Any water (Old Rod)', encounterRate: 100, region: 'Any', pcDistance: 'varies' },
    ],
    // Pikachu
    25:  [
      { method: 'horde5', location: 'Viridian Forest', encounterRate: 5, region: 'Kanto', pcDistance: 'close' },
      { method: 'single', location: 'Viridian Forest', encounterRate: 5, region: 'Kanto', pcDistance: 'close' },
    ],
    // Eevee
    133: [
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Gastly
    92:  [
      { method: 'horde5', location: 'Pokémon Tower 3F', encounterRate: 90, region: 'Kanto', pcDistance: 'medium' },
      { method: 'single', location: 'Pokémon Tower 3F', encounterRate: 90, region: 'Kanto', pcDistance: 'medium' },
    ],
    // Abra
    63:  [
      { method: 'horde5', location: 'Route 24', encounterRate: 15, region: 'Kanto', pcDistance: 'medium' },
      { method: 'single', location: 'Route 24', encounterRate: 15, region: 'Kanto', pcDistance: 'medium' },
    ],
    // Machop
    66:  [
      { method: 'horde5', location: 'Rock Tunnel 1F', encounterRate: 30, region: 'Kanto', pcDistance: 'medium' },
    ],
    // Mareep
    179: [
      { method: 'horde5', location: 'Route 32', encounterRate: 25, region: 'Johto', pcDistance: 'close' },
    ],
    // Larvitar
    246: [
      { method: 'horde5', location: 'Mt. Silver exterior', encounterRate: 5, region: 'Johto', pcDistance: 'far' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Bagon
    371: [
      { method: 'single', location: 'Meteor Falls deep', encounterRate: 5, region: 'Hoenn', pcDistance: 'far' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Beldum
    374: [
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Dratini
    147: [
      { method: 'fishing', location: 'Safari Zone', encounterRate: 15, region: 'Kanto', pcDistance: 'medium' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Riolu
    447: [
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Gible
    443: [
      { method: 'single', location: 'Wayward Cave hidden', encounterRate: 15, region: 'Sinnoh', pcDistance: 'far' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Shinx
    403: [
      { method: 'horde5', location: 'Route 202', encounterRate: 25, region: 'Sinnoh', pcDistance: 'close' },
    ],
    // Ponyta
    77:  [
      { method: 'horde5', location: 'Route 206', encounterRate: 20, region: 'Sinnoh', pcDistance: 'close' },
      { method: 'horde5', location: 'Route 17', encounterRate: 25, region: 'Kanto', pcDistance: 'medium' },
    ],
    // Vulpix
    37:  [
      { method: 'horde5', location: 'Route 7', encounterRate: 20, region: 'Kanto', pcDistance: 'close' },
      { method: 'single', location: 'Route 36', encounterRate: 10, region: 'Johto', pcDistance: 'close' },
    ],
    // Growlithe
    58:  [
      { method: 'horde5', location: 'Route 7', encounterRate: 20, region: 'Kanto', pcDistance: 'close' },
      { method: 'horde5', location: 'Route 36', encounterRate: 10, region: 'Johto', pcDistance: 'close' },
    ],
    // Horsea
    116: [
      { method: 'fishing', location: 'Route 132 (Good Rod)', encounterRate: 30, region: 'Hoenn', pcDistance: 'medium' },
    ],
    // Chansey
    113: [
      { method: 'single', location: 'Safari Zone', encounterRate: 1, region: 'Kanto', pcDistance: 'medium' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Axew
    610: [
      { method: 'single', location: 'Mistralton Cave', encounterRate: 20, region: 'Unova', pcDistance: 'medium' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Deino
    633: [
      { method: 'single', location: 'Victory Road (Unova)', encounterRate: 5, region: 'Unova', pcDistance: 'far' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Litwick
    607: [
      { method: 'horde5', location: 'Celestial Tower 2F', encounterRate: 50, region: 'Unova', pcDistance: 'medium' },
    ],
    // Zorua
    570: [
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Magnemite
    81:  [
      { method: 'horde5', location: 'New Mauville', encounterRate: 50, region: 'Hoenn', pcDistance: 'medium' },
      { method: 'horde5', location: 'Route 6', encounterRate: 25, region: 'Kanto', pcDistance: 'close' },
    ],
    // Marill
    183: [
      { method: 'horde5', location: 'Mt. Mortar exterior', encounterRate: 20, region: 'Johto', pcDistance: 'medium' },
    ],
    // Heracross
    214: [
      { method: 'single', location: 'Route 33 (Headbutt)', encounterRate: 20, region: 'Johto', pcDistance: 'close' },
    ],
    // Scyther
    123: [
      { method: 'single', location: 'Safari Zone', encounterRate: 5, region: 'Kanto', pcDistance: 'medium' },
      { method: 'single', location: 'National Park (Contest)', encounterRate: 10, region: 'Johto', pcDistance: 'close' },
    ],
    // Houndour
    228: [
      { method: 'horde5', location: 'Route 7 (Night)', encounterRate: 15, region: 'Johto', pcDistance: 'close' },
    ],
    // Feebas
    349: [
      { method: 'fishing', location: 'Route 119 (tiles)', encounterRate: 5, region: 'Hoenn', pcDistance: 'medium' },
      { method: 'egg', location: 'Daycare', encounterRate: 100, region: 'Any' },
    ],
    // Swablu
    333: [
      { method: 'horde5', location: 'Route 114', encounterRate: 30, region: 'Hoenn', pcDistance: 'medium' },
    ],
    // Aron
    304: [
      { method: 'horde5', location: 'Granite Cave B1F', encounterRate: 40, region: 'Hoenn', pcDistance: 'close' },
    ],
    // Trapinch
    328: [
      { method: 'single', location: 'Route 111 Desert', encounterRate: 20, region: 'Hoenn', pcDistance: 'medium' },
    ],
  },

  /**
   * Get shiny hunting spots for a given Pokemon
   */
  getSpots(pokemonId) {
    return this.SPOTS[pokemonId] || [];
  },

  /**
   * Calculate efficiency score (higher = better)
   * Based on: Pokemon per encounter × encounter rate, adjusted by PC distance
   */
  efficiency(spot) {
    const method = this.METHODS[spot.method];
    if (!method) return 0;
    const distPenalty = spot.pcDistance === 'far' ? 0.7 : spot.pcDistance === 'medium' ? 0.85 : 1.0;
    return method.pokemon * (spot.encounterRate / 100) * distPenalty;
  },

  /**
   * Compute the effective shiny rate given active bonuses.
   * Bonuses are multiplicative: base × charm × donator × event
   * @param {Object} bonuses - { charm: bool, donator: bool, event: bool }
   * @returns {number} effective shiny rate (e.g. 1/24793)
   */
  effectiveRate(bonuses) {
    let multiplier = 1;
    if (bonuses.charm)   multiplier *= this.CHARM_BONUS;
    if (bonuses.donator) multiplier *= this.DONATOR_BONUS;
    if (bonuses.event)   multiplier *= this.EVENT_BONUS;
    return this.BASE_RATE * multiplier;
  },

  /**
   * Calculate expected encounters to find a shiny
   * @param {string} method - horde5, single, etc.
   * @param {Object} bonuses - { charm, donator, event }
   */
  avgEncounters(method, bonuses) {
    // Support legacy boolean argument (backwards compat)
    if (typeof bonuses === 'boolean') bonuses = { charm: bonuses, donator: false, event: false };
    const rate = this.effectiveRate(bonuses);
    const m = this.METHODS[method];
    if (!m) return Infinity;
    // Each encounter checks m.pokemon Pokemon for shiny
    const perEncRate = 1 - Math.pow(1 - rate, m.pokemon);
    return 1 / perEncRate;
  },

  /**
   * Calculate total estimated time in seconds
   */
  estimatedTime(method, bonuses, customTime) {
    const m = this.METHODS[method];
    if (!m) return Infinity;
    const timePerEnc = customTime || m.timePerEnc;
    return this.avgEncounters(method, bonuses) * timePerEnc;
  },

  /**
   * Calculate total estimated cost
   */
  estimatedCost(method, bonuses, ballPrice, repelPrice) {
    const enc = this.avgEncounters(method, bonuses);
    const m = this.METHODS[method];
    if (!m) return Infinity;
    return enc * (ballPrice + repelPrice);
  },

  /**
   * Format time from seconds to readable string
   */
  formatTime(seconds) {
    if (!isFinite(seconds)) return '∞';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours.toLocaleString()} ${i18n.t('shiny_hours')} ${mins} ${i18n.t('shiny_minutes')}`;
    return `${mins} ${i18n.t('shiny_minutes')}`;
  },

  /**
   * Render the spots table for a Pokemon
   */
  renderSpots(pokemonId) {
    const spots = this.getSpots(pokemonId);
    if (!spots.length) return `<p class="shiny-empty">${i18n.t('shiny_no_spots')}</p>`;

    // Sort by efficiency descending
    const sorted = [...spots].sort((a, b) => this.efficiency(b) - this.efficiency(a));

    return `<div class="shiny-spots-table">
      <div class="shiny-spots-header">
        <span>${i18n.t('shiny_method')}</span>
        <span>${i18n.t('shiny_location')}</span>
        <span>${i18n.t('shiny_encounter_rate')}</span>
        <span>${i18n.t('shiny_efficiency')}</span>
      </div>
      ${sorted.map((spot, idx) => {
        const m = this.METHODS[spot.method];
        const eff = this.efficiency(spot);
        const effClass = eff >= 3 ? 'eff-high' : eff >= 1 ? 'eff-med' : 'eff-low';
        const bestClass = idx === 0 ? 'spot-best' : '';
        return `<div class="shiny-spot-row ${bestClass}">
          <span class="spot-method">${i18n.t(m.key)}</span>
          <span class="spot-location">${spot.location}<span class="spot-region">${spot.region}</span></span>
          <span class="spot-rate">${spot.encounterRate}%</span>
          <span class="spot-eff ${effClass}">${eff.toFixed(2)}</span>
        </div>`;
      }).join('')}
    </div>`;
  },

  /**
   * Render the cost calculator
   * @param {string} method
   * @param {Object} bonuses - { charm, donator, event }
   * @param {number} timePerEnc
   * @param {number} ballPrice
   */
  renderCalculator(method, bonuses, timePerEnc, ballPrice) {
    // Support legacy boolean argument
    if (typeof bonuses === 'boolean') bonuses = { charm: bonuses, donator: false, event: false };
    const m = this.METHODS[method];
    if (!m) return '';

    const effectiveRate = this.effectiveRate(bonuses);
    const hasAnyBonus = bonuses.charm || bonuses.donator || bonuses.event;
    const avgEnc = this.avgEncounters(method, bonuses);
    const time = avgEnc * (timePerEnc || m.timePerEnc);
    const repelCost = 350; // Max Repel ≈ 350¥ per use, ~3 encounters
    const totalCost = avgEnc * (ballPrice + repelCost / 3);

    // Build active bonuses label
    const activeBonuses = [];
    if (bonuses.charm)   activeBonuses.push(i18n.t('shiny_charm'));
    if (bonuses.donator) activeBonuses.push(i18n.t('shiny_donator'));
    if (bonuses.event)   activeBonuses.push(i18n.t('shiny_event'));

    return `<div class="shiny-calc-results">
      <div class="calc-row">
        <span class="calc-label">${i18n.t('shiny_base_rate')}</span>
        <span class="calc-value">1/${Math.round(1/this.BASE_RATE).toLocaleString()}</span>
      </div>
      ${hasAnyBonus ? `<div class="calc-row">
        <span class="calc-label">${i18n.t('shiny_effective_rate')}</span>
        <span class="calc-value calc-value-bonus">1/${Math.round(1/effectiveRate).toLocaleString()}</span>
      </div>
      <div class="calc-row">
        <span class="calc-label">${i18n.t('shiny_active_bonuses')}</span>
        <span class="calc-value calc-value-bonus">${activeBonuses.join(' + ')}</span>
      </div>` : ''}
      <div class="calc-row">
        <span class="calc-label">${i18n.t('shiny_pokemon_per_encounter')}</span>
        <span class="calc-value">${m.pokemon}</span>
      </div>
      <div class="calc-row calc-row-main">
        <span class="calc-label">${i18n.t('shiny_encounters_avg')}</span>
        <span class="calc-value calc-value-big">${Math.round(avgEnc).toLocaleString()}</span>
      </div>
      <div class="calc-row calc-row-main">
        <span class="calc-label">${i18n.t('shiny_total_time')}</span>
        <span class="calc-value calc-value-big">${this.formatTime(time)}</span>
      </div>
      <div class="calc-row calc-row-main">
        <span class="calc-label">${i18n.t('shiny_total_cost')}</span>
        <span class="calc-value calc-value-big calc-cost">${Math.round(totalCost).toLocaleString()}¥</span>
      </div>
    </div>`;
  }
};
