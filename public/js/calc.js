/* ════════════════════════════════════════════
   calc.js — Catch Rate Engine (Gen 3-5 formula)
   ════════════════════════════════════════════ */

const Calc = {
  MAX_HP: 100,

  // Local ball images (served from db/images/ via /ball-images/)
  BALL_SPRITES: {
    quick_ball: '/ball-images/Dream_Quick_Ball_Sprite.png',
    pokeball:   '/ball-images/Dream_Pok%C3%A9_Ball_Sprite.png',
    greatball:  '/ball-images/Bag_Great_Ball_SV_Sprite.png',
    ultraball:  '/ball-images/Dream_Ultra_Ball_Sprite.png',
    timerball:  '/ball-images/Dream_Timer_Ball_Sprite.png',
    loveball:   '/ball-images/Dream_Love_Ball_Sprite.png',
    duskball:   '/ball-images/Dream_Dusk_Ball_Sprite.png',
    netball:    '/ball-images/Dream_Net_Ball_Sprite.png',
  },

  ballSprite(key) {
    return this.BALL_SPRITES[key] || '/ball-images/Dream_Quick_Ball_Sprite.png';
  },

  /**
   * Compute catch probability for one throw.
   * Gen 3-5 formula: b = 65535 / (255/a)^0.25, prob = (b/65535)^4
   */
  probability(catchRate, currentHP, ballMult, statusMult) {
    const maxHP = this.MAX_HP;
    const hpFactor = (3 * maxHP - 2 * currentHP) / (3 * maxHP);
    const a = hpFactor * catchRate * ballMult * statusMult;
    if (a >= 255) return 1.0;
    const inner = 65535 / Math.pow(255 / a, 0.25);
    const p4 = Math.pow(inner / 65535, 4);
    return Math.min(p4, 1.0);
  },

  avgThrows(prob) {
    if (prob >= 1) return 1;
    if (prob <= 0) return Infinity;
    return 1 / prob;
  },

  statusMultiplier(status) {
    const map = { none: 1, sleep: 2, freeze: 2, para: 1.5, poison: 1.5, burn: 1.5 };
    return map[status] || 1;
  },

  /**
   * Compute results for all pokéballs given current state.
   */
  computeAll(pokemon, balls, state) {
    const { hp, status, night } = state;
    const statusMult = this.statusMultiplier(status);
    const results = [];

    for (const ball of balls) {
      const { key, multiplier, cost, condition_key } = ball;
      let conditionMet = true;
      let conditionNote = null;

      if (condition_key === 'quick') {
        conditionNote = 'quick';
      } else if (condition_key === 'night') {
        conditionMet = !!night;
        if (!night) conditionNote = 'night_off';
      } else if (condition_key === 'love') {
        conditionNote = 'love';
      } else if (condition_key === 'bugwater') {
        conditionMet = this._isBugOrWater(pokemon);
        conditionNote = 'bugwater';
      } else if (condition_key === 'timer') {
        conditionNote = 'timer';
      }

      const prob = this.probability(pokemon.catch_rate, hp, multiplier, statusMult);
      const avg = this.avgThrows(prob);

      results.push({
        key,
        name_en: ball.name_en,
        name_fr: ball.name_fr,
        multiplier,
        cost,
        probability: prob,
        avgThrows: avg,
        avgCost: avg * cost,
        conditionMet,
        conditionNote,
        guaranteed: prob >= 1.0
      });
    }

    return results;
  },

  /**
   * Best = highest probability, excluding quick/love/bugwater/night-off.
   * Timer ball is always eligible (player can always wait 10 turns).
   */
  getBest(results) {
    const candidates = results.filter(r =>
      r.conditionNote !== 'quick' &&
      r.conditionNote !== 'love' &&
      r.conditionNote !== 'bugwater' &&
      r.conditionMet !== false
    );
    if (!candidates.length) return null;
    return candidates.reduce((best, r) => r.probability > best.probability ? r : best);
  },

  /**
   * Cheapest = lowest average cost, same exclusions.
   */
  getCheapest(results) {
    const candidates = results.filter(r =>
      r.conditionNote !== 'quick' &&
      r.conditionNote !== 'love' &&
      r.conditionNote !== 'bugwater' &&
      r.conditionMet !== false
    );
    if (!candidates.length) return null;
    return candidates.reduce((cheap, r) => r.avgCost < cheap.avgCost ? r : cheap);
  },

  /**
   * Check if Pokémon is "quickable" (Quick Ball ≥ 75% at full HP, no status).
   */
  isQuickable(pokemon) {
    const prob = this.probability(pokemon.catch_rate, 100, 5, 1);
    return prob >= 0.75;
  },

  // ══════════ Optimal technique finder ══════════

  /**
   * Find the fastest technique: highest probability ≥ 95%, fewest setup steps.
   * Independent of current UI state — considers all ball × HP × status combinations.
   */
  computeOptimalFastest(pokemon, balls) {
    const candidates = this._allTechniques(pokemon, balls).filter(c => c.probability >= 0.95);
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      if (Math.abs(b.probability - a.probability) > 1e-9) return b.probability - a.probability;
      return this._techniqueComplexity(a.technique) - this._techniqueComplexity(b.technique);
    });
    return candidates[0];
  },

  /**
   * Find the cheapest technique: lowest expected Pokéyen cost, probability ≥ 75%.
   */
  computeOptimalCheapest(pokemon, balls) {
    const candidates = this._allTechniques(pokemon, balls).filter(c => c.probability >= 0.75);
    if (!candidates.length) return null;
    candidates.sort((a, b) => {
      if (Math.abs(a.avgCost - b.avgCost) > 0.01) return a.avgCost - b.avgCost;
      if (Math.abs(b.probability - a.probability) > 1e-9) return b.probability - a.probability;
      return this._techniqueComplexity(a.technique) - this._techniqueComplexity(b.technique);
    });
    return candidates[0];
  },

  _allTechniques(pokemon, balls) {
    const HP_OPTS = [1, 25, 50, 75, 100];
    const STATUS_OPTS = ['none', 'sleep', 'freeze', 'para', 'poison', 'burn'];
    const isGhost = this._isGhost(pokemon);
    const out = [];

    const pushTechnique = (key, multiplier, cost, hp, status, flags) => {
      const sMult = this.statusMultiplier(status);
      const prob = this.probability(pokemon.catch_rate, hp, multiplier, sMult);
      const avg = this.avgThrows(prob);
      // Ghost types need Soak before False Swipe (Normal-type move)
      const soak = isGhost && hp < 100;
      out.push({ key, multiplier, cost, probability: prob, avgThrows: avg, avgCost: cost * avg,
        technique: { ...flags, hp, status, soak } });
    };

    for (const ball of balls) {
      const { key, multiplier, cost, condition_key } = ball;
      if (condition_key === 'love') continue;
      if (condition_key === 'bugwater' && !this._isBugOrWater(pokemon)) continue;

      if (condition_key === 'quick') {
        // Quick Ball: thrown turn 1 at full HP, no status setup possible
        const prob = this.probability(pokemon.catch_rate, 100, multiplier, 1);
        const avg = this.avgThrows(prob);
        out.push({ key, multiplier, cost, probability: prob, avgThrows: avg, avgCost: cost * avg,
          technique: { quick: true, hp: 100, status: 'none', night: false, timer: false, soak: false } });

      } else if (condition_key === 'night') {
        for (const hp of HP_OPTS)
          for (const status of STATUS_OPTS)
            pushTechnique(key, multiplier, cost, hp, status, { quick: false, night: true, timer: false });

      } else if (condition_key === 'timer') {
        for (const hp of HP_OPTS)
          for (const status of STATUS_OPTS)
            pushTechnique(key, multiplier, cost, hp, status, { quick: false, night: false, timer: true });

      } else {
        // Regular ball (pokeball, greatball, ultraball, netball when applicable)
        for (const hp of HP_OPTS)
          for (const status of STATUS_OPTS)
            pushTechnique(key, multiplier, cost, hp, status, { quick: false, night: false, timer: false });
      }
    }
    return out;
  },

  _techniqueComplexity(t) {
    let score = 0;
    if (t.hp < 100)          score++; // False Swipe needed
    if (t.soak)              score++; // Soak needed (Ghost type)
    if (t.status !== 'none') score++; // Status move needed
    if (t.timer)             score++; // Wait 10 turns
    if (t.night)             score++; // Wait for night
    return score;
  },

  _isBugOrWater(pokemon) {
    return pokemon.type1 === 'water' || pokemon.type1 === 'bug' ||
           pokemon.type2 === 'water' || pokemon.type2 === 'bug';
  },

  _isGhost(pokemon) {
    return pokemon.type1 === 'ghost' || pokemon.type2 === 'ghost';
  },

  formatPercent(prob) {
    if (prob >= 1) return '100%';
    const pct = prob * 100;
    if (pct >= 10) return pct.toFixed(1) + '%';
    return pct.toFixed(2) + '%';
  },

  formatCost(cost) {
    return Math.round(cost).toLocaleString('fr-FR') + '¥';
  },

  formatThrows(avg) {
    if (!isFinite(avg) || avg > 9999) return '∞';
    if (avg <= 1) return '1';
    return avg.toFixed(1);
  }
};
