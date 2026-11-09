/* ════════════════════════════════════════════
   warnings.js — Capture Warning System v3
   Only 2 warning types:
     💀 SUICIDE — moves that instantly KO the user
     🟠 RECOIL  — moves that deal recoil damage
   Data comes from the API: /api/pokemon/:id/recoil-warnings
   ════════════════════════════════════════════ */

/* Noms d'attaques en francais (la base ne stocke que l'anglais) */
const MOVES_FR = {"Take Down": "Bélier", "Double-Edge": "Damoclès", "Submission": "Sacrifice", "Self-Destruct": "Destruction", "Explosion": "Explosion", "Memento": "Souvenir", "Healing Wish": "Vœu Soin", "Flare Blitz": "Boutefeu", "Brave Bird": "Rapace", "Wood Hammer": "Martobois", "Head Smash": "Fracass’Tête", "Final Gambit": "Tout ou Rien", "Wild Charge": "Éclair Fou", "Head Charge": "Peignée", "Misty Explosion": "Explo-Brume"};
const moveName = n => (i18n.lang === 'fr' && MOVES_FR[n]) || n;

const Warnings = {

  /**
   * Render SUICIDE and RECOIL warning banners as an HTML string.
   *
   * @param {Object|null} recoilData
   *   { suicideMoves: [{move_name, level}], recoilMoves: [{move_name, level}] }
   * @returns {string} HTML string (empty string if no warnings)
   */
  renderWarnings(recoilData) {
    if (!recoilData) return '';
    const { suicideMoves, recoilMoves } = recoilData;
    if (!suicideMoves.length && !recoilMoves.length) return '';

    let html = '<div class="capture-warnings">';

    // ── SUICIDE warning (red) — shown first ──
    if (suicideMoves.length) {
      // Sort by level ascending, list each move with its minimum level
      const sorted   = [...suicideMoves].sort((a, b) => a.level - b.level);
      const moveText = sorted.map(m => `${moveName(m.move_name)} (${m.level ? i18n.t('if_min_level') + m.level : i18n.t('via_tm')})`).join(' / ');
      html += `<div class="capture-warning warn-suicide">
        <span class="warn-icon">💀</span>
        <span class="warn-text"><strong>${i18n.t('warn_tag_suicide')}</strong> — ${moveText}</span>
      </div>`;
    }

    // ── RECOIL warning (orange) ──
    if (recoilMoves.length) {
      const sorted   = [...recoilMoves].sort((a, b) => a.level - b.level);
      const moveText = sorted.map(m => `${moveName(m.move_name)} (${m.level ? i18n.t('if_min_level') + m.level : i18n.t('via_tm')})`).join(' / ');
      html += `<div class="capture-warning warn-recoil">
        <span class="warn-icon">🟠</span>
        <span class="warn-text"><strong>${i18n.t('warn_tag_recoil')}</strong> — ${moveText}</span>
      </div>`;
    }

    html += '</div>';
    return html;
  }
};
