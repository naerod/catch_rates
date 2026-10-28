/* Infobulle du site : remplace l'infobulle native du navigateur par une bulle aux couleurs du site.
   - Sur tout element portant data-tip="Titre\nDetail" (1re ligne en gras), ou un attribut title (converti a la volee).
   - Survol (apres un court delai) et focus clavier ; disparait au depart, au clic, au defilement, sur Echap.
   - L'accessibilite est conservee : un bouton sans texte garde son nom via aria-label. */
(() => {
  const DELAY = 250;
  let tip, timer, current = null;

  const ensure = () => {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.id = 'site-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    document.body.appendChild(tip);
    return tip;
  };

  /* title -> data-tip (la bulle native ne s'affiche donc jamais), sans perdre le nom accessible */
  const adopt = el => {
    const t = el.getAttribute('title');
    if (t == null) return el.dataset.tip ? el : null;
    el.removeAttribute('title');
    if (!t.trim()) return el.dataset.tip ? el : null;
    el.dataset.tip = t;
    if (!el.hasAttribute('aria-label') && !el.textContent.trim() && !el.hasAttribute('aria-labelledby')) el.setAttribute('aria-label', t.split('\n')[0]);
    return el;
  };

  const place = el => {
    const b = el.getBoundingClientRect(), t = tip.getBoundingClientRect(), m = 8;
    let top = b.top - t.height - m, below = false;
    if (top < m) { top = b.bottom + m; below = true; }              // pas de place au-dessus : sous l'element
    const left = Math.min(Math.max(m, b.left + b.width / 2 - t.width / 2), innerWidth - t.width - m);
    tip.style.top = `${Math.round(top)}px`; tip.style.left = `${Math.round(left)}px`;
    tip.style.setProperty('--arrow-x', `${Math.round(b.left + b.width / 2 - left)}px`);
    tip.classList.toggle('is-below', below);
  };

  const show = el => {
    const [head, ...rest] = el.dataset.tip.split('\n');
    ensure().replaceChildren();
    const h = document.createElement('strong'); h.textContent = head; tip.appendChild(h);
    for (const line of rest) { const p = document.createElement('span'); p.textContent = line; tip.appendChild(p); }
    tip.hidden = false; current = el;
    el.setAttribute('aria-describedby', 'site-tip');
    place(el);
    tip.classList.add('is-on');
  };

  const hide = () => {
    clearTimeout(timer);
    if (current) { current.removeAttribute('aria-describedby'); current = null; }
    if (tip) { tip.classList.remove('is-on'); tip.hidden = true; }
  };

  const enter = e => {
    const src = e.target.closest?.('[title], [data-tip]');
    const el = src && adopt(src);
    if (!el || el === current) return;
    hide();
    timer = setTimeout(() => show(el), e.type === 'focusin' ? 0 : DELAY);
  };
  const leave = e => { if (!current || !current.contains(e.relatedTarget)) hide(); };

  document.addEventListener('mouseover', enter);
  document.addEventListener('focusin', enter);
  document.addEventListener('mouseout', leave);
  document.addEventListener('focusout', hide);
  document.addEventListener('click', hide, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, { passive: true, capture: true });
})();
