/* ════════════════════════════════════════════
   Money making — methodes de farm d'argent PokeMMO
   Une methode = un bouton ; chacune se decrit par un fichier de donnees.
   ════════════════════════════════════════════ */

const Money = (() => {
  const METHODS = [{ id: 'gym-rerun', icon: 'account_balance', nameKey: 'gr_name', src: '/data/gym-rerun.json' }];
  const STORE = 'money.gym-rerun';
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

  function sprite(dex, label, cls = '') {
    const [w, h] = data.size[dex];
    return `<picture><source media="(prefers-reduced-motion: reduce)" srcset="/gym-rerun/sprites/${dex}.png">` +
      `<img class="sprite ${cls}" src="/gym-rerun/sprites/${dex}.gif" alt="${esc(label)}" style="--w:${w};--h:${h}" width="${w}" height="${h}" loading="lazy"></picture>`;
  }
  const monSprite = id => sprite(data.mons[id].dex, name(data.mons, id));

  function token(tk) {
    if (tk === '+') return '<span class="tk-plus" aria-hidden="true">+</span>';
    if ('/(),'.includes(tk)) return `<span class="tk-raw">${tk}</span>`;
    const c = tk[0], rest = tk.slice(1);
    if (c === '@') return `<span class="tk-word">${esc(t('gr_' + rest))}</span>`;
    if (c === '~') return `<span class="tk-act" data-mon="${rest}">${monSprite(rest)}</span>`;
    if (c === '.') return `<b class="tk-move">${esc(t('mv_' + rest))}</b>`;
    if (c === '#') {
      const [dex, lvl] = rest.split(':');
      const lv = lvl ? `<span class="tk-lvl">${esc(t('gr_lvl'))} ${+lvl}</span>` : '';
      return `<span class="tk-opp">${sprite(dex, name(data.opponents, dex), 'is-opp')}${lv}</span>`;
    }
    const [mon, move] = tk.split('.');
    return `<span class="tk-act" data-mon="${mon}">${monSprite(mon)}<b class="tk-move">${esc(t('mv_' + move))}</b></span>`;
  }
  const line = l => `<p class="gym-line${l.i ? ' is-variant' : ''}">${l.i ? icon('subdirectory_arrow_right') : ''}` +
    `<span class="gym-line-body">${l.s.split(' ').map(token).join('')}</span></p>`;

  /* ── Rendu des blocs ── */
  function menu() {
    $('money-menu').innerHTML = METHODS.map(m =>
      `<button type="button" class="money-card" data-method="${m.id}">${icon(m.icon)}<span>${esc(t(m.nameKey))}</span>${icon('arrow_forward')}</button>`).join('');
  }

  /* Bascule menu <-> methode, avec fondu (cf. DA : tout ce qui apparait s'anime). */
  function view(method) {
    state.method = method;
    $('page-money').classList.toggle('in-method', !!method);
    $('money-menu').hidden = !!method;
    $('money-method').hidden = !method;
    const shown = method ? $('money-method') : $('money-menu');
    shown.classList.remove('is-entering'); void shown.offsetWidth; shown.classList.add('is-entering');
    if (!method) { history.replaceState(null, '', '#money'); menu(); return; }
    $('money-method-name').textContent = t(METHODS.find(m => m.id === method).nameKey);
  }

  function infoBar() {
    const total = new Intl.NumberFormat(i18n.lang).format(data.total);
    const stock = data.stock.map(x => `${x.qty} × ${esc(t('item_' + x.item))}`).join(' · ');
    const team = data.team.map(id => `<li data-mon="${id}">${monSprite(id)}<b>${esc(name(data.mons, id))}</b></li>`).join('');
    $('money-info').innerHTML =
      `<span class="info-item info-total"><span class="info-label">${esc(t('gr_total'))}</span><strong>${total}+ ¥</strong><span class="info-note">${esc(t('gr_total_note'))}</span></span>` +
      `<span class="info-item"><span class="info-label">${esc(t('gr_stock'))}</span>${stock}</span>` +
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

  function stage(animate) {
    const r = data.regions[state.region];
    const cards = r.gyms.map((g, i) => {
      const tip = g.tip ? `<p class="gym-tip">${icon('info')}<span>${esc(t('gr_' + g.tip))}</span></p>` : '';
      return `<article class="gym">` +
        `<img class="gym-map" src="/gym-rerun/maps/${r.id}-${g.id}.webp" alt="${esc(t('gr_map_of'))} ${esc(g.name)}" width="${r.mapSize[0]}" height="${r.mapSize[1]}" loading="lazy">` +
        `<div class="gym-body"><h3 class="gym-title"><span class="gym-num">${i + 1}.</span>${esc(g.name)}</h3>${tip}` +
        `${g.lines.map(line).join('')}</div></article>`;
    }).join('');
    const el = $('money-stage');
    el.innerHTML = `<div class="stage-body">${cards}</div>`;
    el.setAttribute('aria-label', r.name);
    if (animate) { el.classList.remove('is-entering'); void el.offsetWidth; el.classList.add('is-entering'); }
  }

  /* Plus grand texte qui tienne dans la fenetre : recherche par dichotomie sur la taille de police. */
  function fit() {
    const box = $('money-stage'), body = box.querySelector('.stage-body');
    if (!body) return;
    body.style.fontSize = '';
    if (matchMedia('(max-width: 899px)').matches) return;     // mobile : la page defile
    let lo = 11, hi = 19;       // plafond : au-dela, trop gros pour lire d'un coup d'oeil
    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2;
      body.style.fontSize = mid + 'px';
      if (body.scrollHeight <= box.clientHeight) lo = mid; else hi = mid;
    }
    body.style.fontSize = lo + 'px';
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
      if (!state.method) return menu();
      if (data) { $('money-method-name').textContent = t(METHODS.find(m => m.id === state.method).nameKey); renderAll(false); }
    });
  });

  return { open };
})();
