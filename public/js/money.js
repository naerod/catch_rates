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
  const state = { method: null, region: 0, gym: 0, mode: 'grid', tc: true };

  /* ── Persistance : hash (#money/gym-rerun/kanto[/3]) puis localStorage ── */
  function restore() {
    try { Object.assign(state, JSON.parse(localStorage.getItem(STORE)) || {}); } catch { /* stockage indisponible */ }
    const seg = location.hash.slice(1).split('/').slice(1);
    if (seg[0] === state.method) seg.shift();
    const ri = data.regions.findIndex(r => r.id === seg[0]);
    if (ri >= 0) { state.region = ri; state.gym = Math.max(0, (+seg[1] || 1) - 1); }
    else state.gym = 0;
    state.region = Math.min(Math.max(+state.region || 0, 0), data.regions.length - 1);
    state.gym = Math.min(Math.max(+state.gym || 0, 0), data.regions[state.region].gyms.length - 1);
    if (state.mode !== 'linear') state.mode = 'grid';
    state.tc = state.tc !== false;
  }
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify({ region: state.region, mode: state.mode, tc: state.tc })); } catch { /* idem */ }
    history.replaceState(null, '', `#money/${state.method}/${data.regions[state.region].id}${state.mode === 'linear' ? '/' + (state.gym + 1) : ''}`);
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
    return `<p class="gym-line${l.i ? ' is-variant' : ''}${n === 0 || l.lead ? ' is-lead' : ''}${cont ? ' is-cont' : ''}">${l.i ? icon(cont ? 'arrow_right_alt' : 'subdirectory_arrow_right') : ''}` +
    `<span class="gym-line-body">${l.s.split(/ (?=@into )/).map(seg => `<span class="gym-seg">${seg.split(' ').map(token).join('')}</span>`).join('')}</span></p>`;
  };

  /* Entre deux cartes : soin conseille apres le combat, puis les objets a changer avant le suivant. */
  function between(a) {
    if (!a) return '';
    const heal = a.heal ? `<span class="after-chip is-heal">${icon('local_hospital')}${esc(t('gr_heal_' + a.heal))}</span>` : '';
    const swaps = (a.switch || []).map(s => {
      const label = esc(`${name(data.mons, s.mon)} → ${t('it_' + s.item)}`);
      return `<span class="after-chip is-swap" title="${label}" aria-label="${label}">${icon('swap_horiz')}${monSprite(s.mon, false)}` +
        `<img class="swap-item" src="/gym-rerun/items/${ITEM_ICON[s.item]}.png" alt="" width="30" height="30"><span>${esc(t('it_' + s.item))}</span></span>`;
    }).join('');
    return `<div class="gym-between">${heal}${swaps}</div>`;
  }

  /* ── Calculateur de charm : quel objet de gains choisir selon les prix du marche ── */
  const CHARMS = [
    { id: 'none', mult: 1, nameKey: 'charm_none' },
    { id: 'amulet_coin', mult: 1.5, nameKey: 'charm_amulet' },
    { id: 'riches_75', mult: 1.75, nameKey: 'charm_r75' },
    { id: 'riches_100', mult: 2, nameKey: 'charm_r100' },
  ];
  const CHARM_STORE = 'money.charm';
  const charm = { donator: false, sel: {}, prices: {} };           // sel : arenes cochees/decochees par rapport au guide ; prices : prix saisis a la main
  try { Object.assign(charm, JSON.parse(localStorage.getItem(CHARM_STORE)) || {}); } catch { /* stockage indisponible */ }
  let market = null;                                               // { fetchedAt, prices } renvoye par /api/prices
  let marketState = 'idle';                                        // idle | loading | ok | error
  const saveCharm = () => { try { localStorage.setItem(CHARM_STORE, JSON.stringify(charm)); } catch { /* idem */ } };
  const money = n => new Intl.NumberFormat(i18n.lang).format(Math.round(n));
  const gymKey = (r, g) => `${r.id}/${g.id}`;
  const gymOn = (r, g) => (gymKey(r, g) in charm.sel ? charm.sel[gymKey(r, g)] : !g.optional);   // par defaut : toutes les arenes du guide

  function charmCalc() {
    const base = data.regions.reduce((s, r) => s + r.gyms.reduce((a, g) => a + (gymOn(r, g) ? g.profit : 0), 0), 0) * (charm.donator ? 1.05 : 1);
    const rows = CHARMS.map(c => {
      const price = c.id === 'none' ? 0 : (charm.prices[c.id] ?? market?.prices?.[c.id]?.price ?? null);
      const gain = base * c.mult;
      return { ...c, price, gain, net: price == null ? null : gain - price, custom: c.id !== 'none' && charm.prices[c.id] != null };
    });
    const priced = rows.filter(r => r.net != null);
    const best = priced.length ? priced.reduce((a, b) => (b.net > a.net ? b : a)) : null;
    return { base, rows, best, count: data.regions.reduce((s, r) => s + r.gyms.filter(g => gymOn(r, g)).length, 0) };
  }

  async function loadMarket() {
    if (marketState === 'loading' || marketState === 'ok') return;
    marketState = 'loading';
    try {
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error(res.status);
      market = await res.json(); marketState = 'ok';
    } catch { marketState = 'error'; }
    if (data && state.method) { infoBar(); charmPanel(); }
  }

  function charmButton() {
    const c = charmCalc();
    const label = c.best && c.best.id !== 'none' ? `${t(c.best.nameKey)} · ${money(c.best.net)} ¥` : marketState === 'error' ? t('charm_unavailable') : t('charm_title');
    return `<button type="button" class="charm-btn" popovertarget="money-charm" aria-label="${esc(t('charm_title'))}">${icon('savings')}<span>${esc(label)}</span></button>`;
  }

  function charmPanel() {
    const panel = $('money-charm');
    if (!panel || !data) return;
    const c = charmCalc();
    const rows = c.rows.map(r => `<tr class="${c.best && c.best.id === r.id ? 'is-best' : ''}">` +
      `<th scope="row">${esc(t(r.nameKey))}${c.best && c.best.id === r.id ? `<span class="best-chip">${icon('check_circle')}${esc(t('charm_best'))}</span>` : ''}</th>` +
      `<td>×${r.mult}</td>` +
      `<td>${r.id === 'none' ? '—' : `<span class="price-field"><input type="number" min="0" step="100" inputmode="numeric" data-price="${r.id}" aria-label="${esc(t('charm_price'))} — ${esc(t(r.nameKey))}" value="${r.price ?? ''}">` +
        (r.custom ? `<button type="button" class="btn-icon-sm" data-price-reset="${r.id}" title="${esc(t('charm_use_market'))}" aria-label="${esc(t('charm_use_market'))}">${icon('sync')}</button>` : '') + '</span>'}</td>` +
      `<td>${money(r.gain)}</td><td class="net">${r.net == null ? '—' : money(r.net)}</td></tr>`).join('');
    const status = marketState === 'ok' ? `${esc(t('charm_updated'))} ${new Date(market.fetchedAt).toLocaleTimeString(i18n.lang, { hour: '2-digit', minute: '2-digit' })}`
      : marketState === 'error' ? esc(t('charm_error')) : esc(t('charm_loading'));
    const gyms = data.regions.map(r => `<fieldset class="charm-region"><legend>${esc(r.name)}</legend>` +
      r.gyms.map(g => `<label class="charm-gym"><input type="checkbox" data-gym="${gymKey(r, g)}"${gymOn(r, g) ? ' checked' : ''}><span>${esc(g.name)}</span><small>${money(g.profit)}</small></label>`).join('') + '</fieldset>').join('');
    panel.innerHTML =
      `<div class="charm-head"><h3>${icon('savings')}${esc(t('charm_title'))}</h3>` +
      `<button type="button" class="btn-icon-sm" popovertarget="money-charm" popovertargetaction="hide" aria-label="${esc(t('charm_close'))}">${icon('close')}</button></div>` +
      `<label class="tc-toggle"><input type="checkbox" id="charm-donator"${charm.donator ? ' checked' : ''}><span>${esc(t('charm_donator'))}</span></label>` +
      `<table class="charm-table"><thead><tr><th></th><th></th><th>${esc(t('charm_price'))}</th><th>${esc(t('charm_gain'))}</th><th>${esc(t('charm_net'))}</th></tr></thead><tbody>${rows}</tbody></table>` +
      `<p class="charm-status">${status} · <a href="https://pokemmohub.com/items/amulet-coin/" target="_blank" rel="noopener">pokemmohub</a></p>` +
      `<h4>${esc(t('charm_gyms'))} <small>(${c.count} · ${money(c.base)} ¥)</small></h4><div class="charm-gyms">${gyms}</div>` +
      `<div class="charm-foot"><button type="button" class="btn btn-outline" id="charm-reset">${icon('restart_alt')}${esc(t('charm_reset'))}</button></div>`;
  }
  function charmRefresh() { saveCharm(); infoBar(); charmPanel(); }

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
    $('money-team').innerHTML = data.team.map(id => `<li data-mon="${id}" title="${esc(name(data.mons, id))}">${monSprite(id, false)}</li>`).join('');
    $('money-team').setAttribute('aria-label', t('gr_team'));
    const calc = charmCalc();
    const total = money(calc.rows.find(r => r.id === 'amulet_coin').gain);
    const stock = data.stock.map(x => `<span class="info-stock"><b>${x.qty}</b>${esc(t('item_' + x.item))}</span>`).join('');
    $('money-info').innerHTML =
      `<span class="info-item info-total"><span class="info-label">${esc(t('gr_total'))}</span><strong>${total}+ ¥</strong><span class="info-note">${esc(t('gr_total_note'))}</span></span>` +
      `<span class="info-item"><span class="info-label">${esc(t('gr_stock'))}</span><span class="info-stocks">${stock}</span></span>` +
      `<span class="info-item">${icon('flight')}${esc(t('gr_ocarina'))}</span>` +
      (data.requires ? `<span class="info-item is-require">${icon('warning')}${esc(t('gr_requires'))}</span>` : '') +
      `<span class="info-item info-charm">${charmButton()}</span>`;
  }

  function regionTabs() {
    $('money-regions').innerHTML = data.regions.map((r, i) =>
      `<button type="button" class="region-tab" data-region="${i}" aria-pressed="${i === state.region}">${esc(r.name)}</button>`).join('');
  }

  function controls() {
    const lin = state.mode === 'linear', regions = data.regions;
    const first = state.region === 0 && (!lin || state.gym === 0);
    const last = state.region === regions.length - 1 && (!lin || state.gym === regions[state.region].gyms.length - 1);
    $('money-progress').textContent = lin ? `${state.gym + 1} / ${regions[state.region].gyms.length}` : `${state.region + 1} / ${regions.length}`;
    const prev = $('money-prev'), next = $('money-next');
    prev.disabled = first;
    prev.title = first ? t('gr_first') : '';
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
    if (!body || state.mode !== 'grid') return;
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
    while (size > 11 && !tall()) body.style.fontSize = (size -= 0.5) + 'px';   // garde-fou : la dichotomie n'est pas monotone
  }

  /* Une carte d'arene (sans le bandeau "entre deux cartes"). */
  function card(g, i, r) {
    const tip = g.tip && !g.bonus ? `<span class="gym-tip">${icon('info')}<span>${esc(t('gr_' + g.tip))}</span></span>` : '';
    const chips = (g.skip ? `<span class="gym-chip is-warn">${icon('help')}${esc(t('gr_skip'))}</span>` : '') +
      (g.time != null ? `<span class="gym-chip is-time">${icon('timer')}${g.time} ${esc(t('gr_min'))}</span>` : '');
    const note = g.bonus ? `<p class="gym-note">${icon('info')}<span>${esc(t('gr_' + g.tip))}</span></p>` : '';
    // Une exception qui enchaine sur une action ("... into Eruption + ...") se coupe en deux : la suite passe sur sa propre ligne.
    const expanded = g.lines.flatMap(l => {
      const m = l.i && !l.s.startsWith('@into') && !/@switch_out ~\w+ @into /.test(l.s) && l.s.match(/ (@into [a-z]+\.[a-z_]+.*)$/);   // "switch out X into Y" reste d'un bloc
      return m ? [{ ...l, s: l.s.slice(0, m.index) }, { i: 1, s: m[1] }] : [l];
    });
    const lines = expanded.map((l, n) => { gymItems = n === 0 || l.lead ? g.items || {} : {}; return line(l, n); }).join('');
    gymItems = {};
    return `<article class="gym${g.bonus ? ' is-bonus' : ''}" style="--n:${i}">` +
      `<img class="gym-map" src="/gym-rerun/maps/${r.id}-${g.id}.webp" alt="${esc(t('gr_map_of'))} ${esc(g.name)}" width="${r.mapSize[0]}" height="${r.mapSize[1]}" loading="lazy">` +
      `<div class="gym-body"><div class="gym-top"><h3 class="gym-title"><span class="gym-num">${g.bonus ? icon('add_circle') : i + 1 + '.'}</span>${esc(g.name)}</h3>${tip}<span class="gym-chips">${chips}</span></div>` +
      `${note}${lines}</div></article>`;
  }

  function stage(animate) {
    const r = data.regions[state.region];
    const el = $('money-stage');
    el.setAttribute('aria-label', r.name);
    if (state.mode === 'linear') {
      el.innerHTML = `<div class="lin-stage">${r.gyms.map((g, i) => `<div class="lin-item" data-i="${i}">${card(g, i, r)}${between(g.after)}</div>`).join('')}</div>`;
      layoutLinear();
    } else {
      // Deux colonnes de hauteur voisine : les arenes se lisent de haut en bas, colonne apres colonne.
      const cards = r.gyms.map((g, i) => card(g, i, r) + between(g.after));
      const weight = g => 1 + g.lines.length + (g.after ? 1 : 0) + (g.bonus ? 3 : 0);
      const total = r.gyms.reduce((s, g) => s + weight(g), 0);
      let split = 1, best = Infinity;
      for (let k = 1, acc = 0; k < r.gyms.length; k++) {
        acc += weight(r.gyms[k - 1]);
        const worst = Math.max(acc, total - acc);
        if (worst < best) { best = worst; split = k; }
      }
      const col = (from, to) => `<div class="stage-col">${cards.slice(from, to).join('')}</div>`;
      el.innerHTML = `<div class="stage-body">${col(0, split)}${col(split)}</div>`;
    }
    if (animate) { el.classList.remove('is-entering'); void el.offsetWidth; el.classList.add('is-entering'); }
  }

  /* ── Mode lineaire : l'arene en cours en grand, la precedente grisee et les suivantes en petit ── */
  function layoutLinear() {
    const stageEl = $('money-stage').querySelector('.lin-stage');
    if (!stageEl) return;
    const items = [...stageEl.children], n = items.length, cur = state.gym;
    const flat = matchMedia('(max-width: 899px)').matches;          // mobile : liste normale, la page defile
    stageEl.classList.toggle('is-flat', flat);
    if (flat) { items.forEach((el, i) => { el.style.transform = ''; el.className = 'lin-item' + (i === cur ? ' is-current' : ''); }); stageEl.style.fontSize = ''; return; }
    const H = stageEl.clientHeight, SMALL = 0.66, GAP = 12;
    const first = Math.max(0, Math.min(cur - 1, n - 4)), last = Math.min(n - 1, first + 3);   // toujours 3 arenes au minimum
    const scale = i => (i === cur ? 1 : SMALL);
    const measure = size => {
      stageEl.style.fontSize = size + 'px';
      const pos = {}; let y = 0;
      for (let i = first; i <= last; i++) { pos[i] = y; y += items[i].offsetHeight * scale(i) + GAP; }
      return { pos, total: y - GAP };
    };
    let lo = 11, hi = 24;
    for (let k = 0; k < 7; k++) { const mid = (lo + hi) / 2; if (measure(mid).total <= H) lo = mid; else hi = mid; }
    const { pos } = measure(lo);
    items.forEach((el, i) => {
      const inView = i >= first && i <= last;
      el.className = 'lin-item ' + (!inView ? 'is-hidden' : i === cur ? 'is-current' : i < cur ? 'is-past' : 'is-next');
      el.inert = !inView;
      el.setAttribute('aria-current', i === cur ? 'step' : 'false');
      const y = inView ? pos[i] : i < first ? -(el.offsetHeight * SMALL) - 80 : H + 80;
      el.style.transform = `translateY(${y}px) scale(${scale(i)})`;
    });
  }

  function modeUI() {
    document.querySelectorAll('#money-mode [data-mode]').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.mode === state.mode);
      const l = t('money_mode_' + b.dataset.mode); b.title = l; b.setAttribute('aria-label', l);
    });
    $('money-tc').checked = state.tc;
    $('money-method').classList.toggle('no-tc', !state.tc);
  }

  function renderAll(animate) {
    infoBar(); regionTabs(); controls(); modeUI(); stage(animate);
    if (state.mode === 'grid') { fit(); document.fonts?.ready.then(() => state.mode === 'grid' && fit()); }   // les polices web changent les largeurs
    else document.fonts?.ready.then(() => state.mode === 'linear' && layoutLinear());
  }

  /* ── Navigation : region par region (grille) ou arene par arene (lineaire) ── */
  function goTo(region, gym) {
    const changed = region !== state.region;
    state.region = region; state.gym = gym; persist();
    if (changed || state.mode === 'grid') renderAll(changed);
    else { controls(); layoutLinear(); }
  }
  function step(dir) {
    const regions = data.regions, n = regions.length;
    if (state.mode === 'grid') {
      if (dir > 0) return goTo((state.region + 1) % n, 0);        // apres la derniere : on recommence
      return state.region > 0 && goTo(state.region - 1, 0);
    }
    const count = regions[state.region].gyms.length;
    if (dir > 0) return state.gym < count - 1 ? goTo(state.region, state.gym + 1) : goTo((state.region + 1) % n, 0);
    if (state.gym > 0) return goTo(state.region, state.gym - 1);
    if (state.region > 0) goTo(state.region - 1, regions[state.region - 1].gyms.length - 1);
  }
  function setMode(mode) { state.mode = mode; persist(); renderAll(false); }

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
      restore(); renderAll(false); persist(); loadMarket();
    } catch { showError(); }
    loading = false;
  }

  function enter(method) {
    view(method);
    if (data) { restore(); renderAll(false); persist(); loadMarket(); } else load();
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
      const b = e.target.closest('[data-region]'); if (b) goTo(+b.dataset.region, 0);
    });
    $('money-mode').addEventListener('click', e => {
      const b = e.target.closest('[data-mode]'); if (b && b.dataset.mode !== state.mode) setMode(b.dataset.mode);
    });
    $('money-tc').addEventListener('change', e => { state.tc = e.target.checked; persist(); modeUI(); if (state.mode === 'linear') layoutLinear(); else fit(); });
    const active = () => $('page-money').classList.contains('active') && data && state.method && !$('money-method').hidden;
    document.addEventListener('keydown', e => {
      if (!active() || e.target.closest('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
      const next = ['ArrowRight', ...(state.mode === 'linear' ? ['ArrowDown', 'PageDown'] : [])], prev = ['ArrowLeft', ...(state.mode === 'linear' ? ['ArrowUp', 'PageUp'] : [])];
      if (next.includes(e.key)) { e.preventDefault(); step(1); }
      if (prev.includes(e.key)) { e.preventDefault(); step(-1); }
    });
    /* Aimant du mode lineaire : un cran de molette (ou un balayage) = une arene, jamais entre deux. */
    const stageBox = $('money-stage');
    let wheelAcc = 0, locked = false;
    const lock = () => { locked = true; wheelAcc = 0; setTimeout(() => { locked = false; }, 450); };
    stageBox.addEventListener('wheel', e => {
      if (!active() || state.mode !== 'linear' || matchMedia('(max-width: 899px)').matches) return;
      e.preventDefault();
      if (locked) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) >= 40) { const d = wheelAcc > 0 ? 1 : -1; lock(); step(d); }
    }, { passive: false });
    let touchY = null;
    stageBox.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
    stageBox.addEventListener('touchend', e => {
      if (touchY == null || state.mode !== 'linear' || matchMedia('(max-width: 899px)').matches) return;
      const dy = touchY - e.changedTouches[0].clientY; touchY = null;
      if (Math.abs(dy) > 50 && !locked) { lock(); step(dy > 0 ? 1 : -1); }
    }, { passive: true });
    stageBox.addEventListener('click', e => {
      const it = e.target.closest('.lin-item'); if (it && !it.classList.contains('is-current') && !it.classList.contains('is-hidden')) goTo(state.region, +it.dataset.i);
    });
    const panel = $('money-charm');
    panel.addEventListener('beforetoggle', e => {                    // se place sous le bouton, a droite de l'ecran
      if (e.newState !== 'open') return;
      const b = document.querySelector('.charm-btn');
      panel.style.setProperty('--charm-top', `${(b ? b.getBoundingClientRect().bottom : 120) + 8}px`);
      charmPanel();
    });
    panel.addEventListener('change', e => {
      const el = e.target;
      if (el.id === 'charm-donator') charm.donator = el.checked;
      else if (el.dataset.gym) charm.sel[el.dataset.gym] = el.checked;
      else if (el.dataset.price) { const v = parseInt(el.value, 10); if (Number.isFinite(v) && v >= 0) charm.prices[el.dataset.price] = v; else delete charm.prices[el.dataset.price]; }
      else return;
      charmRefresh();
    });
    panel.addEventListener('click', e => {
      const r = e.target.closest('[data-price-reset]');
      if (r) { delete charm.prices[r.dataset.priceReset]; charmRefresh(); }
      if (e.target.closest('#charm-reset')) { charm.sel = {}; charm.prices = {}; charm.donator = false; charmRefresh(); }
    });
    let resizeTimer;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (active()) { state.mode === 'linear' ? layoutLinear() : fit(); } }, 100);
    });
    document.addEventListener('langchange', () => {
      if (!$('page-money').classList.contains('active')) return;
      if (!state.method) return menu(false);
      if (data) { $('money-method-name').textContent = t(METHODS.find(m => m.id === state.method).nameKey); renderAll(false); }
    });
  });

  return { open };
})();
