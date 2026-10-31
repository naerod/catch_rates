/* ════════════════════════════════════════════
   Money making — methodes de farm d'argent PokeMMO
   Une methode = un bouton ; chacune se decrit par un fichier de donnees.
   ════════════════════════════════════════════ */

const Money = (() => {
  const METHODS = [
    { id: 'technical-route', icon: 'route', nameKey: 'gr_tech_name', shortKey: 'gr_tech_short', tags: [], wip: true, src: '/data/technical-route.json' },
    { id: 'gym-rerun', icon: 'account_balance', nameKey: 'gr_name', shortKey: 'gr_short', tags: ['ITEM SWAP', 'X.ITEMLESS'], src: '/data/gym-rerun.json' },
  ];
  const FAVS = 'money.favs';
  const isWip = m => m.wip && location.hostname === 'catchr.naerod.com';   // en construction : visible seulement en preprod
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const t = k => i18n.t(k);
  const icon = n => `<span class="material-symbols-outlined" aria-hidden="true">${n}</span>`;

  const datas = {};                                                   // donnees deja chargees, par methode
  let data = null;                                                    // donnees de la methode ouverte
  let loading = false;
  const state = { method: null, region: null, view: 'route' };   // region : region a faire defiler en vue (lien profond)

  /* ── Persistance : hash (#money/gym-rerun[/kanto]) puis localStorage ── */
  function restore() {
    const seg = location.hash.slice(1).split('/').slice(1);
    if (seg[0] === state.method) seg.shift();
    state.view = seg[0] === 'team' ? 'team' : 'route';
    if (state.view === 'team') seg.shift();
    state.region = data.regions.find(r => r.id === seg[0])?.id || null;
  }
  /* Historique : chaque changement d'ecran est une entree, le retour arriere du navigateur reste dans le site. */
  const push = h => { if (location.hash !== h) history.pushState({ m: 1 }, '', h); };
  function persist(navigate = false) {
    const h = `#money/${state.method}${state.view === 'team' ? '/team' : ''}`;
    if (navigate) push(h); else history.replaceState({ m: 1 }, '', h);
  }

  /* ── Rendu des jetons ── */
  const name = (table, key) => (table[key] && (table[key][i18n.lang] || table[key].en)) || key;

  /* Icones de menu 8 bits (40x30, comme l'equipe et le PC du jeu), affichees en pixels nets. */
  function sprite(dex, label, cls = '') {
    return `<span class="sprite-box"><img class="sprite icon ${cls}" src="/gym-rerun/icons/${dex}.png" alt="${esc(label)}" width="40" height="30" decoding="async"></span>`;
  }
  let gymItems = {}, curItems = {}, leadMode = false;     // leadMode : ligne principale, le sprite se place au-dessus de son attaque                                              // objets de la carte en cours de rendu
  const ITEM_ICON = { black_glasses: 'black-glasses', choice_band: 'choice-band', choice_scarf: 'choice-scarf', choice_specs: 'choice-specs' };
  /* Petite bulle (coin bas-droit) : l'objet a faire tenir au Pokemon avant ce combat. */
  function itemBadge(id) {
    const it = gymItems[id];
    if (!it) return '';
    const label = esc(t('it_' + it));
    return `<span class="item-badge" data-item="${it}" data-tip="${esc(name(data.mons, id))}&#10;${label}"><img src="/gym-rerun/items/${ITEM_ICON[it]}.png" alt="${label}" width="30" height="30"></span>`;
  }
  const monSprite = (id, withItem = true) => {
    const s = sprite(data.mons[id].dex, name(data.mons, id));
    return withItem && gymItems[id] ? s.replace('</span>', `${itemBadge(id)}</span>`) : s;
  };

  function token(tk) {
    // Pas de caracteres de ponctuation : des icones, ou rien (l'espacement suffit).
    if (tk === '+') return icon('add').replace('class="', 'class="tk-plus ');
    if (tk === '?') return '<span class="tk-raw">?</span>';                      // incertitude, comme dans le guide
    if (tk === '/') return '<span class="tk-raw">/</span>';                      // tel que dans le guide
    if (tk === ',') return '';
    if (tk === '(' || tk === ')') return `<span class="tk-raw ${tk === '(' ? 'tk-open' : 'tk-close'}">${tk}</span>`;                 // parentheses du guide
    const c = tk[0], rest = tk.slice(1);
    if (c === '@') return `<span class="tk-word">${esc(t('gr_' + rest))}</span>`;
    if (c === '=') return `<b class="tk-trainer">${esc(rest)}</b>`;                 // nom propre (dresseur)
    if (c === '~') return leadMode ? `<span class="tk-act tk-stack" data-mon="${rest}">${monSprite(rest)}<b>${esc(name(data.mons, rest))}</b></span>` : `<span class="tk-act" data-mon="${rest}">${monSprite(rest, false)}<b>${esc(name(data.mons, rest))}</b></span>`;
    if (c === '.') return `<b class="tk-move">${esc(t('mv_' + rest))}</b>`;
    if (c === '#') {
      const [dex, lvl] = rest.split(':');
      const lv = lvl ? `<span class="tk-lvl">${esc(t('gr_lvl'))} ${+lvl}</span>` : '';
      return `<span class="tk-opp">${sprite(dex, name(data.opponents, dex), 'is-opp')}${lv}</span>`;
    }
    const [mon, move] = tk.split('.');
    return leadMode ? `<span class="tk-act tk-stack" data-mon="${mon}">${monSprite(mon)}<b class="tk-move">${esc(t('mv_' + move))}</b></span>` : `<span class="tk-act" data-mon="${mon}">${monSprite(mon, false)}<b class="tk-move">${esc(t('mv_' + move))}</b></span>`;
  }
  const line = (l, n) => {
    leadMode = n === 0 || !!l.lead; gymItems = leadMode ? curItems : {};
    const cont = l.s.startsWith('@into') || l.i === 2;           // suite d'une exception : fleche droite, legerement decalee
    return `<p class="gym-line${l.i ? ' is-variant' : ''}${n === 0 || l.lead ? ' is-lead' : ''}${cont ? ' is-cont' : ''}">${l.i ? icon(l.info || !/@vs\b/.test(l.s) && !cont ? 'info' : cont ? 'arrow_right_alt' : 'subdirectory_arrow_right') : ''}` +
    `<span class="gym-line-body">${l.s.split(/ (?=@into )/).map(seg => `<span class="gym-seg">${seg.split(' ').map(token).join('')}</span>`).join('')}</span></p>`;
  };

  /* Entre deux cartes : soin conseille apres le combat, puis les objets a changer avant le suivant. */
  function between(a) {
    if (!a) return '';
    const healTip = a.heal ? esc(`${t('gr_heal_' + a.heal)}\n${t('gr_heal_hint_' + a.heal)}`) : '';
    const heal = a.heal ? `<span class="after-chip is-heal" data-tip="${healTip}" tabindex="0">${icon('local_hospital')}${esc(t('gr_heal_' + a.heal))}${a.healMon ? monSprite(a.healMon, false) : ''}</span>` : '';
    const swaps = (a.switch || []).map(s => {
      const label = esc(`${name(data.mons, s.mon)} → ${t('it_' + s.item)}`);
      const tip = esc(`${name(data.mons, s.mon)} → ${t('it_' + s.item)}\n${t('gr_swap_hint')}${s.exit ? ' · ' + t('gr_on_exit') : ''}`);
      return `<span class="after-chip is-swap" data-item="${s.item}" data-tip="${tip}" aria-label="${label}" tabindex="0">${icon('swap_horiz')}${monSprite(s.mon, false)}` +
        `<img class="swap-item" src="/gym-rerun/items/${ITEM_ICON[s.item]}.png" alt="" width="30" height="30">${s.exit ? icon('logout') : ''}</span>`;
    }).join('');
    return `<div class="gym-between">${heal}${swaps}</div>`;
  }

  /* ── Calculateur de charm : quel objet de gains choisir selon les prix du marche ── */
  const CHARMS = [
    { id: 'none', mult: 1, nameKey: 'charm_none' },
    { id: 'amulet_coin', mult: 1.5, nameKey: 'charm_amulet', img: 'amulet-coin' },
    { id: 'riches_75', mult: 1.75, nameKey: 'charm_r75', img: 'riches-charm' },
    { id: 'riches_100', mult: 2, nameKey: 'charm_r100', img: 'riches-charm' },
  ];
  const CHARM_STORE = 'money.charm';
  const charm = { donator: false, sel: {}, prices: {} };           // sel : arenes cochees/decochees par rapport au guide ; prices : prix saisis a la main
  try { Object.assign(charm, JSON.parse(localStorage.getItem(CHARM_STORE)) || {}); } catch { /* stockage indisponible */ }
  if (Object.keys(charm.sel).some(k => k.includes('/'))) charm.sel = { 'gym-rerun': charm.sel };   // ancien format : une seule methode
  let market = null;                                               // { fetchedAt, prices } renvoye par /api/prices
  let marketState = 'idle';                                        // idle | loading | ok | error
  const saveCharm = () => { try { localStorage.setItem(CHARM_STORE, JSON.stringify(charm)); } catch { /* idem */ } };
  const money = n => new Intl.NumberFormat(i18n.lang).format(Math.round(n));
  const gymKey = (r, g) => `${r.id}/${g.id}`;
  const gymOn = (r, g) => { const s = charm.sel[state.method] || {}; return gymKey(r, g) in s ? s[gymKey(r, g)] : !g.optional; };   // par defaut : les arenes du guide, sauf les optionnelles

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

  const charmImg = c => c?.img ? `<img class="charm-img" src="/gym-rerun/items/${c.img}.png" alt="" width="24" height="24">` : '';
  function charmButton() {
    const c = charmCalc();
    const best = c.best && c.best.id !== 'none' ? c.best : null;
    const label = best ? `<span class="cb-name">${esc(t(best.nameKey))}</span><span class="cb-net">${money(best.net)} ¥</span>`
      : `<span class="cb-net">${esc(marketState === 'error' ? t('charm_unavailable') : t('charm_title'))}</span>`;
    return `<button type="button" class="charm-btn" popovertarget="money-charm" title="${esc(t('charm_title'))}" aria-label="${esc(t('charm_title'))}${best ? ' — ' + esc(t(best.nameKey)) : ''}">${best ? charmImg(best) : icon('savings')}${label}</button>`;
  }

  function charmPanel() {
    const panel = $('money-charm');
    if (!panel || !data) return;
    const c = charmCalc();
    const rows = c.rows.map(r => `<tr class="${c.best && c.best.id === r.id ? 'is-best' : ''}">` +
      `<th scope="row">${charmImg(r)}${esc(t(r.nameKey))}${c.best && c.best.id === r.id ? `<span class="best-chip">${icon('check_circle')}${esc(t('charm_best'))}</span>` : ''}</th>` +
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

  const tagsHTML = m => { const tags = isWip(m) ? ['WIP', ...m.tags] : m.tags; return tags.length ? `<span class="money-tags">${tags.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</span>` : ''; };

  function menu(animate) {
    const el = $('money-menu');
    const first = new Map([...el.children].map(c => [c.dataset.id, c.getBoundingClientRect()]));
    const sorted = [...METHODS].sort((a, b) => isFav(b.id) - isFav(a.id));        // tri stable : favoris d'abord
    el.innerHTML = sorted.map(m =>
      `<div class="money-item" data-id="${m.id}"><button type="button" class="money-card" data-method="${m.id}">${icon(m.icon)}<span class="mc-text"><span class="mc-name">${esc(t(m.nameKey))}</span>${tagsHTML(m)}</span>${icon('arrow_forward')}</button>${favBtn(m.id)}</div>`).join('');
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
    if (!method && location.hash !== '#money' && $('page-money').classList.contains('active')) history.replaceState(history.state, '', '#money');
    document.documentElement.classList.remove('bars-hidden');
    $('page-money').classList.toggle('in-method', !!method);
    $('money-menu').hidden = !!method;
    $('money-method').hidden = !method;
    const shown = method ? $('money-method') : $('money-menu');
    shown.classList.remove('is-entering'); void shown.offsetWidth; shown.classList.add('is-entering');
    if (!method) { push('#money'); menu(false); return; }
    setTitle();
    $('money-fav').innerHTML = favBtn(method);
  }

  /* Titre court dans la barre (le nom complet reste dans l'infobulle et le menu) ; change sur la page equipe. */
  function setTitle() {
    const m = METHODS.find(x => x.id === state.method); if (!m) return;
    const team = state.view === 'team', el = $('money-method-name'), back = $('money-back');
    el.textContent = t(team ? 'gr_team_guide' : m.shortKey); el.title = t(m.nameKey);
    $('money-tags').innerHTML = team ? '' : tagsHTML(m);
    const l = t(team ? 'tp_back' : 'money_back'); back.title = l; back.setAttribute('aria-label', l);
  }

  function infoBar() {
    const st = data.teamGuide?.start, label = esc(t('gr_team_guide'));
    gymItems = st || {};
    $('money-guide').innerHTML = st
      ? `<button type="button" class="start-panel" data-view="team" title="${label}" aria-label="${label}"><ul>${Object.keys(st).map(id => `<li>${monSprite(id)}</li>`).join('')}</ul>${icon('chevron_right')}</button>`
      : `<button type="button" class="btn btn-outline guide-link" data-view="team" title="${label}">${icon('groups')}<span class="lbl">${label}</span></button>`;
    gymItems = {};
    $('money-charm-slot').innerHTML = charmButton();
  }

  /* Une carte d'arene (sans le bandeau "entre deux cartes"). */
  function card(g, i, r) {
    const endTip = g.tip === 'tip_channel';                       // info de fin de combat : tout en bas de la carte
    const tip = g.tip && !g.bonus && !endTip ? `<span class="gym-tip">${icon('info')}<span>${esc(t('gr_' + g.tip))}</span></span>` : '';
    const chips = (g.badge ? `<span class="gym-chip is-optional">${icon('flag')}${esc(t('gr_' + g.badge))}</span>` : '') + (g.skip ? `<span class="gym-chip is-warn">${icon('help')}${esc(t('gr_skip'))}</span>` : '') +
      (g.time != null ? `<span class="gym-chip is-time">${icon('timer')}${g.time} ${esc(t('gr_min'))}</span>` : '');
    const endNote = endTip ? `<p class="gym-note is-end">${icon('info')}<span>${esc(t('gr_' + g.tip))}</span></p>` : '';
    const note = g.bonus ? `<p class="gym-note">${icon('info')}<span>${esc(t('gr_' + g.tip))}</span></p>` : '';
    const expanded = [...g.lines];
    const pri = expanded[0]?.s.match(/ \( (@prioritize #\d+) \)/);   // "(prioritize X)" sort de la ligne principale : 1re exception, avec une icone info
    if (pri) { expanded[0] = { ...expanded[0], s: expanded[0].s.replace(pri[0], '') }; expanded.splice(1, 0, { i: 1, info: true, s: pri[1] }); }
    curItems = g.items || {};
    const lead = [], exc = [];                                    // ligne principale a cote de la carte, exceptions pleine largeur dessous
    expanded.forEach((l, n) => (n === 0 || l.lead ? lead : exc).push(line(l, n)));
    gymItems = {}; leadMode = false;
    // 1 seule option a 2 Pokemon, aucune exception : le soin remonte a cote de la carte au lieu d'une ligne vide en dessous
    const compact = !exc.length && !endNote && (expanded[0]?.s.match(/[a-z]+\.[a-z_0-9]+|~[a-z]+/g) || []).length <= 2;
    return `<article class="gym${g.bonus ? ' is-bonus' : ''}" style="--n:${i}">` +
      (g.charm ? `<span class="gym-charm" data-tip="${esc(t('gr_charm_start'))}" tabindex="0"><img src="/gym-rerun/items/riches-charm.png" alt="${esc(t('gr_charm_start'))}" width="32" height="32"></span>` : '') +
      `<img class="gym-map" src="/gym-rerun/maps/${r.id}-${g.id}.webp" alt="${esc(t('gr_map_of'))} ${esc(g.name)}" width="${r.mapSize[0]}" height="${r.mapSize[1]}" decoding="async"${r === data.regions[0] ? '' : ' loading="lazy"'}>` +
      `<div class="gym-head"><div class="gym-top"><h3 class="gym-title"><span class="gym-num">${g.bonus ? icon('add_circle') : i + 1 + '.'}</span>${esc(g.name)}</h3>${tip}<span class="gym-chips">${chips}</span></div>` +
      `${note}${lead.join('')}${compact ? between(g.after) : ''}</div>` +
      (compact ? '' : `<div class="gym-exc">${exc.join('')}${endNote}${between(g.after)}</div>`) + `</article>`;
  }

  function stage(animate) {
    const el = $('money-stage');
    // Ordre de lecture d'un livre : de gauche a droite, puis de haut en bas (1 2 / 3 4 / 5 6 ...).
    el.innerHTML = [].concat(data.note || []).map(k => `<p class="gym-note guide-note">${icon('info')}<span>${esc(t('gr_' + k))}</span></p>`).join('') + data.regions.map(r => `<section class="region" id="region-${r.id}" aria-labelledby="rt-${r.id}"><h2 class="region-title" id="rt-${r.id}">${esc(r.name)}</h2>` +
      `<div class="stage-body">${r.gyms.map((g, i) => card(g, i, r)).join('')}</div></section>`).join('');
    if (animate) { el.classList.remove('is-entering'); void el.offsetWidth; el.classList.add('is-entering'); }
  }

  /* ── Page "Team building guide" : l'equipe a construire et les points d'attention, tires des donnees de la methode ── */
  function teamPage() {
    const tg = data.teamGuide || {};
    const itemChip = it => `<span class="tp-item"><img src="/gym-rerun/items/${ITEM_ICON[it]}.png" alt="" width="30" height="30">${esc(t('it_' + it))}</span>`;
    const typeChip = ty => `<span class="type-chip" style="--t:var(--type-${ty})">${esc(t('ty_' + ty))}</span>`;
    const order = tg.start ? Object.keys(tg.start) : data.team;      // meme ordre que le bandeau de l'en-tete
    const mons = order.map(id => {
      const x = (tg.mons || {})[id] || {};
      const extra = ['ability', 'nature', 'ivs', 'evs', 'note'].filter(k => x[k]).map(k => `<div class="tp-row${k === 'ivs' ? ' is-ivs' : ''}"><span class="tp-label">${esc(t('tp_' + k))}</span><span>${esc(x[k])}</span></div>`).join('');
      return `<article class="tp-mon" data-mon="${id}"><header class="tp-mon-head">${monSprite(id, false)}<div><h3>${esc(name(data.mons, id))}</h3>` +
        `<div class="tp-meta"><span class="tp-lv">${esc(t('tp_level'))} 100</span>${(tg.types?.[id] || []).map(typeChip).join('')}</div></div></header>` +
        extra + (x.moves ? `<div class="tp-row"><span class="tp-label">${esc(t('tp_moves'))}</span><ol class="tp-slots">${x.moves.map(m => !m ? `<li class="is-empty" data-tip="${esc(t('tp_free_slot'))}" tabindex="0">${icon('add')}</li>` :
        `<li class="${m.opt || m.rec ? 'is-opt' : 'is-req'}"><b class="tk-move">${esc(t('mv_' + m.m))}</b>` +
        (m.hm ? `<span class="tp-i" data-tip="${esc(t('tp_hm_tip'))}" tabindex="0">${icon('info')}</span>` : m.rec ? `<span class="tp-i is-rec" data-tip="${esc(t('tp_rec_tip'))}" tabindex="0">${icon('info')}</span>` : '') + '</li>').join('')}</ol></div>` : '') + '</article>';
    }).join('');
    const stock = data.stock.map(x => `<li><img src="/gym-rerun/items/${ITEM_ICON[x.item.replace('_extra', '')] || ITEM_ICON[x.item]}.png" alt="" width="30" height="30"><b>${x.qty}</b>${esc(t('it_' + x.item))}</li>`).join('');
    const notes = (data.teamGuide?.attention || []).map(a => `<li>${icon(a.icon)}<span>${a.gym ? `<b class="tp-gym">${esc(a.gym)}</b> ` : ''}${esc(t(a.key))}</span></li>`).join('');
    // Equipement de depart : en tete, c'est la premiere chose a preparer avant de lancer la course.
    const startSet = tg.start ? `<section class="tp-start"><h3>${icon('backpack')}${esc(t('tp_start_set'))}</h3><ul>${order.map(id =>
      `<li data-mon="${id}">${monSprite(id, false)}${itemChip(tg.start[id])}<b>${esc(name(data.mons, id))}</b></li>`).join('')}</ul></section>` : '';
    $('money-stage').innerHTML = startSet +
      `<div class="tp"><section class="tp-team" aria-label="${esc(t('tp_team'))}">${mons}</section>` +
      `<aside class="tp-side"><section class="tp-card"><h3>${icon('inventory_2')}${esc(t('tp_stock'))}</h3><ul class="tp-stock">${stock}</ul></section>` +
      (notes ? `<section class="tp-card"><ul class="tp-notes">${notes}</ul></section>` : '') + `</aside></div>`;
  }

  function renderAll(animate) {
    $('money-method').classList.toggle('is-team', state.view === 'team');
    setTitle(); infoBar();
    if (state.view === 'team') { teamPage(); return; }
    stage(animate);
    if (state.region) { $('region-' + state.region)?.scrollIntoView(); state.region = null; }
  }
  function setView(v) { state.view = v; persist(true); renderAll(true); }

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
      const m = METHODS.find(x => x.id === state.method);
      const res = await fetch(m.src + '?v=' + (document.querySelector('meta[name=app-version]')?.content || ''));
      if (!res.ok) throw new Error(res.status);
      data = datas[m.id] = await res.json();
      restore(); renderAll(false); persist(); loadMarket();
    } catch { showError(); }
    loading = false;
  }

  function enter(method) {
    view(method);
    if (isWip(METHODS.find(m => m.id === method))) {
      data = null; $('money-guide').innerHTML = ''; $('money-charm-slot').innerHTML = '';
      $('money-stage').innerHTML = `<div class="money-state">${icon('construction')}<p>${esc(t('money_wip'))}</p></div>`;
      return;
    }
    data = datas[method] || null;
    if (data) { restore(); renderAll(false); persist(); loadMarket(); } else load();
  }

  /* fresh = clic dans la barre (menu) ; sinon lien profond (#money/gym-rerun/...) */
  function open(fresh) {
    const [, method] = location.hash.slice(1).split('/');
    const legacy = method && !METHODS.some(m => m.id === method);   // ancien #money/hoenn/3
    const id = fresh ? null : METHODS.some(m => m.id === method) ? method : legacy ? METHODS[0].id : null;
    if (id && !history.state?.m) {               // lien profond : une entree "menu" derriere, pour que le retour ne quitte pas le site
      const target = location.hash;
      history.replaceState({ m: 1 }, '', '#money'); history.pushState({ m: 1 }, '', target);
    }
    if (id) enter(id); else view(null);
  }

  /* Barres masquees en descendant, reaffichees des qu'on remonte (sans retourner tout en haut). */
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, dy = y - lastY;
    if (Math.abs(dy) < 8) return;                                 // ignore les micro-mouvements
    lastY = y;
    const on = $('page-money').classList.contains('active') && !!state.method;
    document.documentElement.classList.toggle('bars-hidden', on && dy > 0 && y > 120);
  }, { passive: true });

  /* ── Evenements ── */
  addEventListener('popstate', () => {            // retour / avance du navigateur : on affiche l'ecran du lien
    const [page, method] = location.hash.slice(1).split('/');
    if (page !== 'money' || !$('page-money').classList.contains('active')) return;
    if (!METHODS.some(m => m.id === method)) return view(null);
    if (state.method !== method || !data) return enter(method);
    state.method = method; restore(); view(method); renderAll(true);
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', e => {
      const f = e.target.closest('[data-fav]'); if (f && $('page-money').contains(f)) toggleFav(f.dataset.fav);
      const v = e.target.closest('[data-view]'); if (v && $('page-money').contains(v)) setView(v.dataset.view);
    });
    $('money-menu').addEventListener('click', e => {
      const b = e.target.closest('[data-method]'); if (b) { push('#money/' + b.dataset.method); enter(b.dataset.method); }
    });
    $('money-back').addEventListener('click', () => (state.view === 'team' ? setView('route') : view(null)));
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
      else if (el.dataset.gym) (charm.sel[state.method] ??= {})[el.dataset.gym] = el.checked;
      else if (el.dataset.price) { const v = parseInt(el.value, 10); if (Number.isFinite(v) && v >= 0) charm.prices[el.dataset.price] = v; else delete charm.prices[el.dataset.price]; }
      else return;
      charmRefresh();
    });
    panel.addEventListener('click', e => {
      const r = e.target.closest('[data-price-reset]');
      if (r) { delete charm.prices[r.dataset.priceReset]; charmRefresh(); }
      if (e.target.closest('#charm-reset')) { charm.sel[state.method] = {}; charm.prices = {}; charm.donator = false; charmRefresh(); }
    });
    $('home-shortcuts').addEventListener('click', e => {
      const b = e.target.closest('[data-go]'); if (!b) return;
      history.pushState(null, '', b.dataset.go); showPage(b.dataset.go.slice(1).split('/')[0], false);
    });
    document.addEventListener('langchange', () => {
      if (!$('page-money').classList.contains('active')) return;
      if (!state.method) return menu(false);
      if (data) renderAll(false);
    });
  });

  /* Accueil : cartes de raccourci (la page d'accueil, dans app.js, les assemble en sections). */
  const homeCard = (go, ic, label, tags = '', cls = '', tone = '') => `<button type="button" class="home-card${cls}${tone ? ' tone-' + tone : ''}" data-go="${go}">${icon(ic)}<span class="hc-text"><span class="hc-name">${esc(label)}</span>${tags}</span>${icon('arrow_forward')}</button>`;
  const homeFavCards = () => METHODS.filter(m => isFav(m.id)).map(m => homeCard(`#money/${m.id}`, m.icon, t(m.nameKey), tagsHTML(m), ' is-fav', 'money')).join('');

  return { open, homeCard, homeFavCards };
})();
