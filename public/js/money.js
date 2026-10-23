/* ════════════════════════════════════════════
   Money making — methodes de farm d'argent PokeMMO
   Une methode = un bouton ; chacune se decrit par un fichier de donnees.
   ════════════════════════════════════════════ */

const Money = (() => {
  const METHODS = [{ id: 'gym-rerun', icon: 'account_balance', nameKey: 'gr_name', src: '/data/gym-rerun.json' }];
  const STORE = 'money.gym-rerun';
  const FAVS = 'money.favs';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const t = k => i18n.t(k);
  const icon = n => `<span class="material-symbols-outlined" aria-hidden="true">${n}</span>`;

  let data = null;
  let loading = false;
  const state = { method: null, region: 0 };

  /* ── Persistance : hash (#money/gym-rerun/kanto) puis localStorage ── */
  function restore() {
    try { Object.assign(state, JSON.parse(localStorage.getItem(STORE)) || {}); } catch { /* stockage indisponible */ }
    const seg = location.hash.slice(1).split('/').slice(1);
    if (seg[0] === state.method) seg.shift();
    const ri = data.regions.findIndex(r => r.id === seg[0]);
    if (ri >= 0) state.region = ri;
    state.region = Math.min(Math.max(+state.region || 0, 0), data.regions.length - 1);
  }
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify({ region: state.region })); } catch { /* idem */ }
    history.replaceState(null, '', `#money/${state.method}/${data.regions[state.region].id}`);
  }

  /* ── Rendu des jetons ── */
  const name = (table, key) => (table[key] && (table[key][i18n.lang] || table[key].en)) || key;

  /* Encadre carre derriere le sprite, teinte d'une seule couleur (type dominant du Pokemon). */
  function sprite(dex, label, cls = '', type = '') {
    const [w, h] = data.size[dex];
    const img = `<picture><source media="(prefers-reduced-motion: reduce)" srcset="/gym-rerun/sprites/${dex}.png">` +
      `<img class="sprite ${cls}" src="/gym-rerun/sprites/${dex}.gif" alt="${esc(label)}" style="--w:${w};--h:${h}" width="${w}" height="${h}" loading="lazy"></picture>`;
    return type ? `<span class="sprite-box" style="--t:var(--type-${type})">${img}</span>` : img;
  }
  let gymItems = {};                                              // objets de la carte en cours de rendu
  const ITEM_ICON = { black_glasses: 'black-glasses', choice_band: 'choice-band', choice_scarf: 'choice-scarf', choice_specs: 'choice-specs' };
  /* Petite bulle (coin bas-droit) : l'objet a faire tenir au Pokemon avant ce combat. */
  function itemBadge(id) {
    const it = gymItems[id];
    if (!it) return '';
    const label = esc(t('it_' + it));
    return `<span class="item-badge" title="${label}"><img src="/gym-rerun/items/${ITEM_ICON[it]}.png" alt="${label}" width="30" height="30"></span>`;
  }
  const monSprite = (id, withItem = true) => {
    const s = sprite(data.mons[id].dex, name(data.mons, id), '', data.mons[id].type);
    return withItem && gymItems[id] ? s.replace('</span>', `${itemBadge(id)}</span>`) : s;
  };

  function token(tk) {
    // Pas de caracteres de ponctuation : des icones, ou rien (l'espacement suffit).
    if (tk === '+') return icon('add').replace('class="', 'class="tk-plus ');
    if (tk === '/') return icon('swap_horiz').replace('class="', 'class="tk-raw ');
    if ('(),'.includes(tk)) return '';
    const c = tk[0], rest = tk.slice(1);
    if (c === '@') return `<span class="tk-word">${esc(t('gr_' + rest))}</span>`;
    if (c === '=') return `<b class="tk-trainer">${esc(rest)}</b>`;                 // nom propre (dresseur)
    if (c === '~') return `<span class="tk-act" data-mon="${rest}">${monSprite(rest)}</span>`;
    if (c === '.') return `<b class="tk-move">${esc(t('mv_' + rest))}</b>`;
    if (c === '#') {
      const [dex, lvl] = rest.split(':');
      const lv = lvl ? `<span class="tk-lvl">${esc(t('gr_lvl'))} ${+lvl}</span>` : '';
      return `<span class="tk-opp">${sprite(dex, name(data.opponents, dex), 'is-opp', data.opponents[dex].type)}${lv}</span>`;
    }
    const [mon, move] = tk.split('.');
    return `<span class="tk-act" data-mon="${mon}">${monSprite(mon)}<b class="tk-move">${esc(t('mv_' + move))}</b></span>`;
  }
  const line = (l, n) => {
    const cont = l.s.startsWith('@into');                       // suite d'une exception : fleche droite, legerement decalee
    return `<p class="gym-line${l.i ? ' is-variant' : ''}${n === 0 ? ' is-lead' : ''}${cont ? ' is-cont' : ''}">${l.i ? icon(cont ? 'arrow_right_alt' : 'subdirectory_arrow_right') : ''}` +
    `<span class="gym-line-body">${l.s.split(/ (?=@into )/).map(seg => `<span class="gym-seg">${seg.split(' ').map(token).join('')}</span>`).join('')}</span></p>`;
  };

  /* ── Rendu des blocs ── */
  /* ── Favoris : memorises dans le navigateur ; les favoris passent en tete du menu ── */
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAVS)) || []; } catch { /* stockage indisponible */ }
  const isFav = id => favs.includes(id);
  function toggleFav(id) {
    favs = isFav(id) ? favs.filter(f => f !== id) : [...favs, id];
    try { localStorage.setItem(FAVS, JSON.stringify(favs)); } catch { /* idem */ }
    favButtons();
    if (!state.method) menu(true);
  }
  const favLabel = id => t(isFav(id) ? 'money_fav_remove' : 'money_fav_add');
  const favBtn = id => `<button type="button" class="fav-btn" data-fav="${id}" aria-pressed="${isFav(id)}" aria-label="${esc(favLabel(id))}" title="${esc(favLabel(id))}">${icon('star')}</button>`;
  function favButtons() {                                          // met a jour les etoiles deja affichees
    document.querySelectorAll('[data-fav]').forEach(b => {
      const id = b.dataset.fav, l = favLabel(id);
      b.setAttribute('aria-pressed', isFav(id)); b.setAttribute('aria-label', l); b.title = l;
    });
  }

  function menu(animate) {
    const el = $('money-menu');
    const first = new Map([...el.children].map(c => [c.dataset.id, c.getBoundingClientRect()]));
    const sorted = [...METHODS].sort((a, b) => isFav(b.id) - isFav(a.id));        // tri stable : favoris d'abord
    el.innerHTML = sorted.map(m =>
      `<div class="money-item" data-id="${m.id}"><button type="button" class="money-card" data-method="${m.id}">${icon(m.icon)}<span>${esc(t(m.nameKey))}</span>${icon('arrow_forward')}</button>${favBtn(m.id)}</div>`).join('');
    if (!animate) return;
    [...el.children].forEach(c => {                                // FLIP : les cartes glissent vers leur nouvelle place
      const a = first.get(c.dataset.id), b = c.getBoundingClientRect();
      if (!a || (a.left === b.left && a.top === b.top)) return;
      c.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: 'none' }], { duration: 250, easing: 'ease-in-out' });
    });
  }

  /* Bascule menu <-> methode, avec fondu (cf. DA : tout ce qui apparait s'anime). */
  function view(method) {
    state.method = method;
    $('page-money').classList.toggle('in-method', !!method);
    $('money-menu').hidden = !!method;
    $('money-method').hidden = !method;
    const shown = method ? $('money-method') : $('money-menu');
    shown.classList.remove('is-entering'); void shown.offsetWidth; shown.classList.add('is-entering');
    if (!method) { history.replaceState(null, '', '#money'); menu(false); return; }
    $('money-method-name').textContent = t(METHODS.find(m => m.id === method).nameKey);
    $('money-fav').innerHTML = favBtn(method);
  }

  function infoBar() {
    const total = new Intl.NumberFormat(i18n.lang).format(data.total);
    const stock = data.stock.map(x => `<span class="info-stock"><b>${x.qty}</b>${esc(t('item_' + x.item))}</span>`).join('');
    const team = data.team.map(id => `<li data-mon="${id}">${monSprite(id, false)}<b>${esc(name(data.mons, id))}</b></li>`).join('');
    $('money-info').innerHTML =
      `<span class="info-item info-total"><span class="info-label">${esc(t('gr_total'))}</span><strong>${total}+ ¥</strong><span class="info-note">${esc(t('gr_total_note'))}</span></span>` +
      `<span class="info-item"><span class="info-label">${esc(t('gr_stock'))}</span><span class="info-stocks">${stock}</span></span>` +
      `<span class="info-item">${icon('flight')}${esc(t('gr_ocarina'))}</span>` +
      `<ul class="info-item info-team" aria-label="${esc(t('gr_team'))}">${team}</ul>`;
  }

  function regionTabs() {
    $('money-regions').innerHTML = data.regions.map((r, i) =>
      `<button type="button" class="region-tab" data-region="${i}" aria-pressed="${i === state.region}">${esc(r.name)}</button>`).join('');
  }

  function controls() {
    const last = state.region === data.regions.length - 1;
    $('money-progress').textContent = `${state.region + 1} / ${data.regions.length}`;
    const prev = $('money-prev'), next = $('money-next');
    prev.disabled = state.region === 0;
    prev.title = prev.disabled ? t('gr_first') : '';
    next.querySelector('span:first-child').textContent = t(last ? 'gr_restart' : 'gr_next');
    next.querySelector('.material-symbols-outlined').textContent = last ? 'restart_alt' : 'arrow_forward';
  }

  /* Une ligne de strategie ne passe jamais a la ligne : elle ne doit pas deborder de sa carte. */
  const overflowsX = body => [...body.querySelectorAll('.gym-body')].some(el => el.scrollWidth > el.clientWidth + 1);

  /* Plus grand texte qui tienne dans la fenetre (dichotomie sur la taille de police).
     Phase 1 : chaque ligne sur une seule ligne. Si le texte tombe sous 14 px, phase 2 : une ligne
     longue peut passer a la ligne, mais seulement avant un "into". */
  function fit() {
    const box = $('money-stage'), body = box.querySelector('.stage-body');
    if (!body) return;
    body.style.fontSize = '';
    if (matchMedia('(max-width: 899px)').matches) return;     // mobile : la page defile
    const search = (hi, ok) => {
      let lo = 11;
      for (let i = 0; i < 7; i++) {
        const mid = (lo + hi) / 2;
        body.style.fontSize = mid + 'px';
        if (ok()) lo = mid; else hi = mid;
      }
      return lo;
    };
    const tall = () => body.scrollHeight <= box.clientHeight;
    body.classList.add('nowrap');
    let size = search(19, () => tall() && !overflowsX(body));
    if (size < 14) { body.classList.remove('nowrap'); size = search(19, tall); }
    body.style.fontSize = size + 'px';
  }

  function stage(animate) {
    const r = data.regions[state.region];
    const cards = r.gyms.map((g, i) => {
      const tip = g.tip ? `<span class="gym-tip">${icon('info')}<span>${esc(t('gr_' + g.tip))}</span></span>` : '';
      return `<article class="gym" style="--n:${i}">` +
        `<img class="gym-map" src="/gym-rerun/maps/${r.id}-${g.id}.webp" alt="${esc(t('gr_map_of'))} ${esc(g.name)}" width="${r.mapSize[0]}" height="${r.mapSize[1]}" loading="lazy">` +
        `<div class="gym-body"><div class="gym-top"><h3 class="gym-title"><span class="gym-num">${i + 1}.</span>${esc(g.name)}</h3>${tip}</div>` +
        `${g.lines.map((l, n) => { gymItems = n === 0 ? g.items || {} : {}; return line(l, n); }).join('')}</div></article>`;   // objets : ligne de lead seulement
    });
    gymItems = {};
    // Deux colonnes independantes (1,3,5 | 2,4,6) : pas de hauteur de rangee imposee par la plus haute carte.
    const col = k => `<div class="stage-col">${cards.filter((_, i) => i % 2 === k).join('')}</div>`;
    const el = $('money-stage');
    el.innerHTML = `<div class="stage-body">${col(0)}${col(1)}</div>`;
    el.setAttribute('aria-label', r.name);
    if (animate) { el.classList.remove('is-entering'); void el.offsetWidth; el.classList.add('is-entering'); }
  }

  function renderAll(animate) {
    infoBar(); regionTabs(); controls(); stage(animate); fit();
  }

  /* ── Navigation : de region en region ── */
  function go(region) {
    const changed = region !== state.region;
    state.region = region; persist(); renderAll(changed);
  }
  function step(dir) {
    const n = data.regions.length;
    if (dir > 0) return go((state.region + 1) % n);          // apres la derniere : on recommence
    if (state.region > 0) go(state.region - 1);
  }

  /* ── Chargement ── */
  function showError() {
    $('money-stage').innerHTML = `<div class="money-state" role="alert">${icon('cloud_off')}<p>${esc(t('gr_error'))}</p>` +
      `<button type="button" class="btn btn-outline" id="money-retry">${esc(t('gr_retry'))}</button></div>`;
    $('money-retry').addEventListener('click', load);
  }
  async function load() {
    if (loading) return;
    loading = true;
    $('money-stage').innerHTML = '<div class="stage-body is-skeleton" aria-hidden="true">' + '<div class="gym"></div>'.repeat(6) + '</div>';
    try {
      const res = await fetch(METHODS[0].src);
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
      restore(); renderAll(false); persist();
    } catch { showError(); }
    loading = false;
  }

  function enter(method) {
    view(method);
    if (data) { restore(); renderAll(false); persist(); } else load();
  }

  /* fresh = clic dans la barre (menu) ; sinon lien profond (#money/gym-rerun/...) */
  function open(fresh) {
    const [, method] = location.hash.slice(1).split('/');
    const legacy = method && !METHODS.some(m => m.id === method);   // ancien #money/hoenn/3
    const id = fresh ? null : METHODS.some(m => m.id === method) ? method : legacy ? METHODS[0].id : null;
    if (id) enter(id); else view(null);
  }

  /* ── Evenements ── */
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', e => {
      const f = e.target.closest('[data-fav]'); if (f && $('page-money').contains(f)) toggleFav(f.dataset.fav);
    });
    $('money-menu').addEventListener('click', e => {
      const b = e.target.closest('[data-method]'); if (b) enter(b.dataset.method);
    });
    $('money-back').addEventListener('click', () => view(null));
    $('money-prev').addEventListener('click', () => step(-1));
    $('money-next').addEventListener('click', () => step(1));
    $('money-regions').addEventListener('click', e => {
      const b = e.target.closest('[data-region]'); if (b) go(+b.dataset.region);
    });
    document.addEventListener('keydown', e => {
      if (!$('page-money').classList.contains('active') || !data || !state.method) return;
      if (e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (state.method && data && !$('money-method').hidden) fit(); }, 100);
    });
    document.addEventListener('langchange', () => {
      if (!$('page-money').classList.contains('active')) return;
      if (!state.method) return menu(false);
      if (data) { $('money-method-name').textContent = t(METHODS.find(m => m.id === state.method).nameKey); renderAll(false); }
    });
  });

  return { open };
})();
