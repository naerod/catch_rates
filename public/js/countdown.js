/* Compte a rebours vers le prochain event PokeMMO (accueil + Money making).
   Dates habituelles de debut : Halloween 31/10, Noel 25/12, Nouvel An lunaire (date variable, table).
   Toujours affiche : des qu'un event commence, on passe au suivant. */
(() => {
  // shortcut: table du Nouvel An lunaire jusqu'en 2035, a prolonger ensuite
  const LUNAR = { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08' };
  const ICON = { halloween: '<img class="pix-icon" src="/img/event-halloween.png" alt="" aria-hidden="true">', christmas: 'ac_unit', lunar: 'bedtime' };
  const next = (now = new Date()) => {
    const y = now.getFullYear(), list = [];
    for (const yy of [y, y + 1]) {
      list.push(['halloween', new Date(yy, 9, 31)], ['christmas', new Date(yy, 11, 25)]);
      if (LUNAR[yy]) { const [m, d] = LUNAR[yy].split('-').map(Number); list.push(['lunar', new Date(yy, m - 1, d)]); }
    }
    return list.filter(([, d]) => d > now).sort((a, b) => a[1] - b[1])[0];
  };
  const t = k => (typeof i18n !== 'undefined' ? i18n.t(k) : k);
    function paint() {
    const els = document.querySelectorAll('[data-countdown]'); if (!els.length) return;
    const [id, at] = next(), s = Math.max(0, Math.floor((at - Date.now()) / 1000));
    // Jamais a l'heure pile (parfois la veille, parfois le lendemain) : ~jours, puis ~heures le dernier jour
    const d = Math.floor(s / 86400), h = Math.max(1, Math.ceil(s / 3600));
    const ic = ICON[id].startsWith('<') ? ICON[id] : `<span class="material-symbols-outlined" aria-hidden="true">${ICON[id]}</span>`;
    const html = `${ic}<span class="cd-label">${t('cd_next')}<b>${t('mev_' + id)}</b></span><span class="cd-time"><span class="cd-part"><b>~${d ? d : h}</b>${t(d ? (d > 1 ? 'cd_days' : 'cd_day') : (h > 1 ? 'cd_hours' : 'cd_hour'))}</span></span>`;
    els.forEach(el => { el.dataset.event = id; el.innerHTML = html; });
  }
  paint();
  setInterval(paint, 60000);
  document.addEventListener('naerod:i18n', () => setTimeout(paint));
  window.Countdown = { next };
})();
