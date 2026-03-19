/* ════════════════════════════════════════════
   warnings.js — Capture Warning System v3
   Only 2 warning types:
     💀 SUICIDE — moves that instantly KO the user
     🟠 RECOIL  — moves that deal recoil damage
   Data comes from the API: /api/pokemon/:id/recoil-warnings
   ════════════════════════════════════════════ */

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
      const moveText = sorted.map(m => `${m.move_name} (si ≥ Lv.${m.level})`).join(' / ');
      html += `<div class="capture-warning warn-suicide">
        <span class="warn-icon">💀</span>
        <span class="warn-text"><strong>SUICIDE</strong> — ${moveText}</span>
      </div>`;
    }

    // ── RECOIL warning (orange) ──
    if (recoilMoves.length) {
      const sorted   = [...recoilMoves].sort((a, b) => a.level - b.level);
      const moveText = sorted.map(m => `${m.move_name} (si ≥ Lv.${m.level})`).join(' / ');
      html += `<div class="capture-warning warn-recoil">
        <span class="warn-icon">🟠</span>
        <span class="warn-text"><strong>RECOIL</strong> — ${moveText}</span>
      </div>`;
    }

    html += '</div>';
    return html;
  }
};
