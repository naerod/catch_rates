// Badge de version du pied de page : lit la version en tête de changelog.json
// (source unique) et renvoie vers /changelog.
(function () {
  const el = document.getElementById('ver-badge');
  if (!el) return;
  fetch('/changelog.json', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : null))
    .then(d => { if (d && d.versions && d.versions[0]) el.textContent = 'v' + d.versions[0].v; })
    .catch(() => {});
})();
