/* ════════════════════════════════════════════
   Market — prix GTL de tous les objets, historique, investissements du compte
   Donnees : /api/market/* (le serveur relaie l'API publique de Fiereu).
   ════════════════════════════════════════════ */

const Market = (() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const t = k => i18n.t(k);
  const icon = n => `<span class="material-symbols-outlined" aria-hidden="true">${n}</span>`;
  const num = n => new Intl.NumberFormat(i18n.lang).format(Math.round(n));
  const PAGE = 100;

  let items = null, byId = new Map(), invest = null;
  const st = { view: 'prices', q: '', filter: 'all', sort: 'name', shown: PAGE, open: null };

  const name = i => (i18n.lang === 'fr' ? i.fr : i.en) || `${t('mk_item')} #${i.id}`;
  const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const isNew = i => !i.known;                                    // absent de la liste communautaire : objet recent
  const canName = () => !!(currentOidcUser?.isAdmin || currentOidcUser?.isEventManager);
  const ago = ms => {
    const h = Math.max(0, Math.round((Date.now() - ms) / 3600000));
    return h < 24 ? `${h} h` : `${Math.round(h / 24)} ${t('cd_days')}`;
  };

  async function load() {
    if (items) return;
    $('market-body').innerHTML = `<div class="mk-skel">${'<div></div>'.repeat(8)}</div>`;
    try {
      const r = await fetch('/api/market/items');
      if (!r.ok) throw new Error();
      items = (await r.json()).items.filter(i => i.price > 0);
      byId = new Map(items.map(i => [i.id, i]));
    } catch {
      $('market-body').innerHTML = `<p class="mk-empty">${icon('cloud_off')}<span>${esc(t('mk_error'))}</span><button type="button" class="btn btn-outline" id="mk-retry">${esc(t('mk_retry'))}</button></p>`;
      return;
    }
    if (currentOidcUser) {
      try { const r = await fetch('/api/me/investments'); if (r.ok) invest = (await r.json()).items; } catch { /* liste vide */ }
    }
  }

  /* ── Liste des prix ── */
  function filtered() {
    const q = fold(st.q.trim());
    let list = items.filter(i => (st.filter !== 'new' || isNew(i)) && (!q || fold(name(i)).includes(q) || String(i.id) === q));
    const by = { name: (a, b) => name(a).localeCompare(name(b), i18n.lang), price: (a, b) => b.price - a.price, qty: (a, b) => b.qty - a.qty, recent: (a, b) => b.id - a.id }[st.sort];
    return list.sort(by);
  }

  const row = i => `<li><button type="button" class="mk-row${st.open === i.id ? ' is-open' : ''}" data-item="${i.id}" aria-expanded="${st.open === i.id}">` +
    `<span class="mk-name">${esc(name(i))}${isNew(i) ? `<span class="mk-new">${esc(t('mk_new'))}</span>` : ''}</span>` +
    `<span class="mk-price">${num(i.price)}</span><span class="mk-qty">${num(i.qty)}</span><span class="mk-age">${ago(i.updated)}</span></button>` +
    (st.open === i.id ? `<div class="mk-detail" id="mk-detail"></div>` : '') + '</li>';

  function renderPrices() {
    const list = filtered();
    $('market-body').innerHTML =
      `<div class="mk-tools"><label class="mk-search">${icon('search')}<span class="mk-sr">${esc(t('mk_search'))}</span><input type="search" id="mk-q" value="${esc(st.q)}" placeholder="${esc(t('mk_search'))}"></label>` +
      `<div class="mk-seg" role="group">${['all', 'new'].map(f => `<button type="button" data-filter="${f}" aria-pressed="${st.filter === f}">${esc(t('mk_f_' + f))}</button>`).join('')}</div>` +
      `<label class="mk-sort"><span>${esc(t('mk_sort'))}</span><select id="mk-sort">${['name', 'price', 'qty', 'recent'].map(s => `<option value="${s}"${st.sort === s ? ' selected' : ''}>${esc(t('mk_s_' + s))}</option>`).join('')}</select></label></div>` +
      (list.length ? `<div class="mk-head" aria-hidden="true"><span>${esc(t('mk_col_item'))}</span><span>${esc(t('mk_col_price'))}</span><span>${esc(t('mk_col_qty'))}</span><span>${esc(t('mk_col_age'))}</span></div>` +
        `<ul class="mk-list">${list.slice(0, st.shown).map(row).join('')}</ul>` +
        (list.length > st.shown ? `<button type="button" class="btn btn-outline mk-more" id="mk-more">${esc(t('mk_more'))} (${list.length - st.shown})</button>` : '')
        : `<p class="mk-empty">${icon('search_off')}<span>${esc(t('mk_none'))}</span></p>`);
    if (st.open != null) renderDetail();
  }

  /* ── Detail d'un objet : courbe, nommage, ajout aux investissements ── */
  async function renderDetail() {
    const box = $('mk-detail'), i = byId.get(st.open);
    if (!box || !i) return;
    const nameForm = canName() && isNew(i) ? `<form class="mk-form" id="mk-name-form"><label><span>${esc(t('mk_name_en'))}</span><input name="en" required maxlength="80" value="${esc(i.en || '')}"></label>` +
      `<label><span>${esc(t('mk_name_fr'))}</span><input name="fr" maxlength="80" value="${esc(i.fr && i.fr !== i.en ? i.fr : '')}"></label><button type="submit" class="btn btn-outline">${icon('edit')}${esc(t('mk_name_save'))}</button></form>` : '';
    const addForm = currentOidcUser ? `<form class="mk-form" id="mk-add-form"><label><span>${esc(t('mk_qty'))}</span><input name="qty" type="number" min="1" step="1" required value="1"></label>` +
      `<label><span>${esc(t('mk_buy_price'))}</span><input name="price" type="number" min="0" step="1" required value="${i.price}"></label><button type="submit" class="btn btn-primary">${icon('add')}${esc(t('mk_add'))}</button></form>`
      : `<p class="mk-hint">${icon('login')}<span>${esc(t('mk_login'))}</span></p>`;
    box.innerHTML = `<div class="mk-chart" id="mk-chart"><div class="mk-skel-chart"></div></div>${addForm}${nameForm}`;
    try {
      const r = await fetch(`/api/market/items/${i.id}/history`);
      const pts = r.ok ? (await r.json()).points : [];
      if (st.open === i.id && $('mk-chart')) $('mk-chart').innerHTML = chart(pts);
    } catch { if ($('mk-chart')) $('mk-chart').innerHTML = `<p class="mk-hint">${esc(t('mk_no_history'))}</p>`; }
  }

  // courbe SVG simple : prix minimum par jour, 180 derniers jours
  function chart(all) {
    const pts = all.slice(-180);
    if (pts.length < 2) return `<p class="mk-hint">${esc(t('mk_no_history'))}</p>`;
    const W = 600, H = 160, ys = pts.map(p => p.price), lo = Math.min(...ys), hi = Math.max(...ys) || 1;
    const x = k => (k / (pts.length - 1)) * W, y = v => H - 8 - ((v - lo) / (hi - lo || 1)) * (H - 16);
    const d = pts.map((p, k) => `${k ? 'L' : 'M'}${x(k).toFixed(1)},${y(p.price).toFixed(1)}`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(t('mk_chart'))}"><path d="${d}" /></svg>` +
      `<div class="mk-chart-legend"><span>${esc(pts[0].day)}</span><span>${esc(t('mk_min'))} ${num(lo)} · ${esc(t('mk_max'))} ${num(hi)}</span><span>${esc(pts.at(-1).day)}</span></div>`;
  }

  /* ── Investissements ── */
  function renderInvest() {
    if (!currentOidcUser) { $('market-body').innerHTML = `<p class="mk-empty">${icon('login')}<span>${esc(t('mk_login'))}</span></p>`; return; }
    const list = invest || [];
    if (!list.length) { $('market-body').innerHTML = `<p class="mk-empty">${icon('savings')}<span>${esc(t('mk_inv_empty'))}</span><button type="button" class="btn btn-outline" data-view-go="prices">${esc(t('mk_tab_prices'))}</button></p>`; return; }
    let cost = 0, value = 0;
    const rows = list.map((v, k) => {
      const i = byId.get(v.id), now = i ? i.price : 0, c = v.qty * v.price, w = v.qty * now, g = w - c;
      cost += c; value += w;
      return `<tr><th scope="row">${esc(i ? name(i) : '#' + v.id)}</th><td>${num(v.qty)}</td><td>${num(v.price)}</td><td>${i ? num(now) : '?'}</td>` +
        `<td class="${g >= 0 ? 'is-up' : 'is-down'}">${icon(g >= 0 ? 'trending_up' : 'trending_down')}${g >= 0 ? '+' : ''}${num(g)}</td>` +
        `<td><button type="button" class="btn-icon-sm" data-del="${k}" aria-label="${esc(t('mk_remove'))}" title="${esc(t('mk_remove'))}">${icon('delete')}</button></td></tr>`;
    }).join('');
    const g = value - cost;
    $('market-body').innerHTML = `<div class="mk-total"><span>${esc(t('mk_cost'))} <b>${num(cost)}</b></span><span>${esc(t('mk_value'))} <b>${num(value)}</b></span>` +
      `<span class="${g >= 0 ? 'is-up' : 'is-down'}">${icon(g >= 0 ? 'trending_up' : 'trending_down')}<b>${g >= 0 ? '+' : ''}${num(g)}</b>${cost ? ` (${(g / cost * 100).toFixed(1)} %)` : ''}</span></div>` +
      `<div class="mk-table-wrap"><table class="mk-table"><thead><tr><th>${esc(t('mk_col_item'))}</th><th>${esc(t('mk_qty'))}</th><th>${esc(t('mk_buy_price'))}</th><th>${esc(t('mk_col_price'))}</th><th>${esc(t('mk_gain'))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }

  async function saveInvest(next) {
    const r = await fetch('/api/me/investments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: next }) });
    if (!r.ok) throw new Error();
    invest = (await r.json()).items;
  }

  /* ── Rendu et navigation ── */
  function render() {
    document.querySelectorAll('#market-tabs [data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === st.view));
    if (!items) return;
    st.view === 'invest' ? renderInvest() : renderPrices();
  }

  async function open() {
    st.view = location.hash.split('/')[1] === 'investments' ? 'invest' : 'prices';
    render(); await load(); render();
  }

  function setView(v) {
    st.view = v;
    const h = v === 'invest' ? '#market/investments' : '#market';
    if (location.hash !== h) history.pushState(null, '', h);
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = $('page-market');
    page.addEventListener('click', async e => {
      const el = e.target.closest('button'); if (!el) return;
      if (el.dataset.view || el.dataset.viewGo) return setView(el.dataset.view || el.dataset.viewGo);
      if (el.dataset.filter) { st.filter = el.dataset.filter; st.shown = PAGE; return renderPrices(); }
      if (el.id === 'mk-more') { st.shown += PAGE; return renderPrices(); }
      if (el.id === 'mk-retry') { await load(); return render(); }
      if (el.dataset.item) { const id = +el.dataset.item; st.open = st.open === id ? null : id; return renderPrices(); }
      if (el.dataset.del != null) {
        const next = invest.filter((_, k) => k !== +el.dataset.del);
        el.disabled = true;
        try { await saveInvest(next); } catch { el.disabled = false; alert(t('mk_save_error')); }
        return renderInvest();
      }
    });
    page.addEventListener('input', e => { if (e.target.id === 'mk-q') { st.q = e.target.value; st.shown = PAGE; const pos = e.target.selectionStart; renderPrices(); const q = $('mk-q'); q.focus(); q.setSelectionRange(pos, pos); } });
    page.addEventListener('change', e => { if (e.target.id === 'mk-sort') { st.sort = e.target.value; renderPrices(); } });
    page.addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target, btn = f.querySelector('[type=submit]'), d = Object.fromEntries(new FormData(f));
      btn.disabled = true;
      try {
        if (f.id === 'mk-add-form') {
          await saveInvest([...(invest || []), { id: st.open, qty: Math.round(+d.qty), price: Math.round(+d.price), date: new Date().toISOString().slice(0, 10) }]);
          btn.innerHTML = `${icon('check')}${esc(t('mk_added'))}`;
          return;
        }
        if (f.id === 'mk-name-form') {
          const r = await fetch(`/api/admin/market/names/${st.open}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ en: d.en, fr: d.fr }) });
          if (!r.ok) throw new Error();
          const n = await r.json(); Object.assign(byId.get(st.open), { en: n.en, fr: n.fr, named: true });
          return renderPrices();
        }
      } catch { alert(t('mk_save_error')); }
      btn.disabled = false;
    });
    addEventListener('popstate', () => { if (document.documentElement.dataset.page === 'market') open(); });
    document.addEventListener('langchange', () => { if (document.documentElement.dataset.page === 'market') render(); });
  });

  return { open };
})();
