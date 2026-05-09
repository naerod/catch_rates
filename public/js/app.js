/* ════════════════════════════════════════════
   app.js — Main UI logic
   ════════════════════════════════════════════ */

/* ── State ── */
const state = {
  pokemon: null,
  balls: [],
  hp: 100,             // Actual HP value: 1 | 25 | 50 | 75 | 100
  status: 'none',      // none | sleep | freeze | para | poison | burn
  night: false,
  page: 'calc',
  recoilWarnings: null // { suicideMoves: [], recoilMoves: [] } — fetched from API
};

const HP_VALUES = [1, 25, 50, 75, 100];

const $ = id => document.getElementById(id);
const sprite = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

/* ══════════════ THEME ══════════════ */
const themeBtn = $('theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

themeBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

initTheme();

/* ══════════════ NAVIGATION ══════════════ */
function showPage(page) {
  state.page = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  $('page-' + page).classList.add('active');
  document.querySelector(`.nav-link[data-page="${page}"]`).classList.add('active');
  if (page === 'events') loadEvents();
  if (page === 'admin') initAdmin();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); showPage(link.dataset.page); });
});

/* ══════════════ SEARCH ══════════════ */
let searchTimer = null;
let activeSearchIndex = -1;
const searchInput = $('pokemon-search');
const searchDropdown = $('search-dropdown');
const searchClear = $('search-clear');

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  searchClear.style.display = q ? '' : 'none';
  clearTimeout(searchTimer);
  if (!q) { searchDropdown.style.display = 'none'; return; }
  searchTimer = setTimeout(() => fetchSearch(q), 180);
});

searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    searchDropdown.style.display = 'none';
    searchInput.blur();
    return;
  }
  const items = searchDropdown.querySelectorAll('.search-item');
  if (!items.length || searchDropdown.style.display === 'none') return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeSearchIndex = Math.min(activeSearchIndex + 1, items.length - 1);
    _updateSearchActive(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeSearchIndex = Math.max(activeSearchIndex - 1, -1);
    _updateSearchActive(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const idx = activeSearchIndex >= 0 ? activeSearchIndex : 0;
    if (items[idx]) selectPokemonById(Number(items[idx].dataset.id));
  }
});

function _updateSearchActive(items) {
  items.forEach((el, i) => el.classList.toggle('active', i === activeSearchIndex));
  if (activeSearchIndex >= 0) items[activeSearchIndex].scrollIntoView({ block: 'nearest' });
}

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchDropdown.style.display = 'none';
  searchInput.focus();
});

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper')) searchDropdown.style.display = 'none';
});

async function fetchSearch(q) {
  const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(q)}`);
  const data = await res.json();
  renderDropdown(data);
}

function renderDropdown(pokemon) {
  if (!pokemon.length) { searchDropdown.style.display = 'none'; return; }
  activeSearchIndex = -1;
  searchDropdown.innerHTML = pokemon.map(p => `
    <div class="search-item" data-id="${p.id}">
      <img src="${sprite(p.id)}" alt="${p.name}" loading="lazy" />
      <span class="search-item-id">#${String(p.id).padStart(3,'0')}</span>
      <span class="search-item-name">${p.name}</span>
      <span class="search-item-rate">${p.catch_rate}</span>
    </div>
  `).join('');
  searchDropdown.style.display = '';
  searchDropdown.querySelectorAll('.search-item').forEach(item => {
    item.addEventListener('click', () => selectPokemonById(Number(item.dataset.id)));
  });
}

async function selectPokemonById(id) {
  // Fetch Pokémon data and recoil warnings in parallel
  const [pokemonRes, warningsRes] = await Promise.all([
    fetch(`/api/pokemon/${id}`),
    fetch(`/api/pokemon/${id}/recoil-warnings`)
  ]);
  const p = await pokemonRes.json();
  const warnings = await warningsRes.json();
  selectPokemon(p, warnings);
}

async function selectPokemon(p, recoilWarnings = { suicideMoves: [], recoilMoves: [] }) {
  state.pokemon = p;
  state.recoilWarnings = recoilWarnings;
  searchInput.value = p.name;
  searchDropdown.style.display = 'none';

  // Update Pokémon card
  $('pokemon-sprite').src = sprite(p.id);
  $('pokemon-id-display').textContent = String(p.id).padStart(3,'0');
  $('pokemon-name-display').textContent = p.name;
  $('pokemon-gen-badge').textContent = `${i18n.t('gen_label')} ${p.generation}`;
  $('pokemon-rate-display').textContent = `${i18n.t('catch_rate_label')}: ${p.catch_rate}`;
  $('pokemon-card').style.display = '';

  // Show sections (all-balls only visible when params are open)
  $('result-cards').style.display = '';
  $('more-params-section').style.display = '';
  $('all-balls-section').style.display = paramsOpen ? '' : 'none';

  await updateResults();

  // Add to history with the best (fastest) result
  await ensureBalls();
  const optBest = Calc.computeOptimalFastest(p, state.balls);
  addToHistory(p, optBest);
}

/* ══════════════ HP SLIDER ══════════════ */
const hpSlider = $('hp-slider');

function updateSliderStyle(idx) {
  const pct = (idx / 4) * 100;
  hpSlider.style.setProperty('--slider-pct', pct + '%');
  // Update labels
  document.querySelectorAll('.hp-label-item').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.idx) === idx);
  });
}

hpSlider.addEventListener('input', () => {
  const idx = Number(hpSlider.value);
  state.hp = HP_VALUES[idx];
  updateSliderStyle(idx);
  updateResults();
});

// Click on label to jump slider
document.querySelectorAll('.hp-label-item').forEach(el => {
  el.addEventListener('click', () => {
    const idx = Number(el.dataset.idx);
    hpSlider.value = idx;
    state.hp = HP_VALUES[idx];
    updateSliderStyle(idx);
    updateResults();
  });
});

// Init slider style
updateSliderStyle(4);

/* ══════════════ CONDITION TOGGLES ══════════════ */
$('toggle-night').addEventListener('click', () => {
  state.night = !state.night;
  $('toggle-night').classList.toggle('active', state.night);
  updateResults();
});

document.querySelectorAll('.status-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const s = btn.dataset.status;
    state.status = (state.status === s) ? 'none' : s;
    document.querySelectorAll('.status-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.status === state.status);
    });
    updateResults();
  });
});

/* ══════════════ MORE PARAMS EXPAND ══════════════ */
let paramsOpen = false;
$('expand-params').addEventListener('click', () => {
  paramsOpen = !paramsOpen;
  $('params-content').style.display = paramsOpen ? '' : 'none';
  $('params-arrow').classList.toggle('open', paramsOpen);
  $('expand-params').style.borderRadius = paramsOpen ? 'var(--radius) var(--radius) 0 0' : '';
  if (state.pokemon) {
    $('all-balls-section').style.display = paramsOpen ? '' : 'none';
    if (paramsOpen) updateResults(); // render grid immediately on open
  }
});

/* ══════════════ RESULTS ══════════════ */
async function ensureBalls() {
  if (state.balls.length) return;
  const res = await fetch('/api/pokeballs');
  state.balls = await res.json();
}

async function updateResults() {
  if (!state.pokemon) return;
  await ensureBalls();

  // Capture warnings (SUICIDE / RECOIL — data from API via state.recoilWarnings)
  const warningsContainer = $('capture-warnings');
  const warningsHtml = Warnings.renderWarnings(state.recoilWarnings);
  if (warningsHtml) {
    warningsContainer.innerHTML = warningsHtml;
    warningsContainer.style.display = '';
  } else {
    warningsContainer.innerHTML = '';
    warningsContainer.style.display = 'none';
  }

  // Quickable banner (Quick Ball at full HP, no status)
  const qbProb = Calc.probability(state.pokemon.catch_rate, 100, 5, 1);
  const banner = $('quickable-banner');
  banner.style.display = qbProb >= 0.75 ? '' : 'none';
  if (qbProb >= 0.75) {
    $('qb-rate-big').textContent = Calc.formatPercent(qbProb);
    const isStrong = qbProb >= 0.95;
    banner.classList.toggle('banner-accessible', !isStrong);
    $('qb-title').textContent  = isStrong ? i18n.t('quickable_title')      : i18n.t('quickable_title_accessible');
    $('qb-desc').textContent   = isStrong ? i18n.t('quickable_desc')       : i18n.t('quickable_desc_accessible');
  }

  // Optimal result cards — computed automatically, independent of current state sliders
  const optBest  = Calc.computeOptimalFastest(state.pokemon, state.balls);
  const optCheap = Calc.computeOptimalCheapest(state.pokemon, state.balls);

  const bestCard  = document.querySelector('.best-card');
  const cheapCard = document.querySelector('.cheap-card');

  if (optBest)  { bestCard.style.display  = ''; renderResultCard('best',  optBest);  }
  else            bestCard.style.display  = 'none';

  if (optCheap) { cheapCard.style.display = ''; renderResultCard('cheap', optCheap); }
  else            cheapCard.style.display = 'none';

  $('result-cards').style.display = (optBest || optCheap) ? '' : 'none';

  // All balls grid — uses current state (HP slider / status toggles), only when panel is open
  if (paramsOpen) {
    const results   = Calc.computeAll(state.pokemon, state.balls, state);
    const gridBest  = Calc.getBest(results);
    const gridCheap = Calc.getCheapest(results);
    renderAllBallsGrid(results, gridBest, gridCheap);
  }
}


/**
 * Compute avg turns and avg cost for a result card.
 * Formula:
 *   - Quick Ball: turns = avgThrows (no setup, no sleep)
 *   - Others: turns = 2 (False Swipe + Sleep) + avgThrows + re_sleep_turns
 *             re_sleep_turns = max(0, ceil(avgThrows/2) - 1)
 *   - cost = r.avgCost (already = avgThrows × ball_price)
 */
function computeAvgStats(r) {
  if (!r || !isFinite(r.avgThrows) || r.avgThrows <= 0) return null;
  const avgBalls = r.avgThrows;

  if (r.technique && r.technique.quick) {
    // Quick Ball: throw on turn 1, no setup needed
    return { turns: Math.round(avgBalls), cost: r.avgCost };
  }

  // Standard technique: 2 setup turns (False Swipe + Sleep) + throws + re-sleeps
  const sleepCycles   = Math.ceil(avgBalls / 2);
  const reSleepTurns  = Math.max(0, sleepCycles - 1);
  const totalTurns    = 2 + avgBalls + reSleepTurns;
  return { turns: Math.round(totalTurns), cost: r.avgCost };
}

function buildTechniqueChips(technique) {
  const chips = [];
  if (technique.quick) chips.push({ label: i18n.t('turn1_badge'), cls: 'chip-timer' });
  if (technique.soak)  chips.push({ label: i18n.t('technique_soak'), cls: 'chip-night' });
  if (technique.hp < 100) {
    const hpLabel = technique.hp === 1 ? i18n.t('technique_1hp') : `${technique.hp}%`;
    chips.push({ label: hpLabel, cls: 'chip-1hp' });
  }
  if (technique.status === 'sleep')  chips.push({ label: i18n.t('technique_sleep'),  cls: 'chip-sleep' });
  if (technique.status === 'freeze') chips.push({ label: i18n.t('technique_freeze'), cls: 'chip-freeze' });
  if (technique.status === 'para')   chips.push({ label: i18n.t('technique_para'),   cls: 'chip-para' });
  if (technique.status === 'poison') chips.push({ label: i18n.t('technique_poison'), cls: 'chip-poison' });
  if (technique.status === 'burn')   chips.push({ label: i18n.t('technique_burn'),   cls: 'chip-burn' });
  if (technique.night) chips.push({ label: i18n.t('technique_night'), cls: 'chip-night' });
  if (technique.timer) chips.push({ label: i18n.t('technique_wait10'), cls: 'chip-timer' });
  return chips.map(c => `<span class="technique-chip ${c.cls}">${c.label}</span>`).join('');
}

function renderResultCard(type, r) {
  const name = i18n.ballName(r.key);
  const prob = r.probability;

  $(`${type}-ball-img`).src = Calc.ballSprite(r.key);
  $(`${type}-ball-img`).alt = name;
  $(`${type}-ball-name`).textContent = name;

  const rateEl = $(`${type}-rate`);
  rateEl.textContent = Calc.formatPercent(prob);
  let rateClass = 'result-rate-big';
  if (prob >= 1)         rateClass += ' rate-100';
  else if (prob >= 0.5)  rateClass += ' rate-high';
  else if (prob >= 0.15) rateClass += ' rate-med';
  else rateClass += ' rate-low';
  rateEl.className = rateClass;

  $(`${type}-technique`).innerHTML = buildTechniqueChips(r.technique);

  // ── Avg stats line: "~X turns · ~X,XXX¥ avg cost" ──
  const avgStatsEl = $(`${type}-avg-stats`);
  if (avgStatsEl) {
    const stats = computeAvgStats(r);
    if (stats) {
      avgStatsEl.textContent = `~${stats.turns} ${i18n.t('turns_label')} · ~${Calc.formatCost(stats.cost)} avg cost`;
      avgStatsEl.style.display = '';
    } else {
      avgStatsEl.style.display = 'none';
    }
  }
}

function renderAllBallsGrid(results, best, cheap) {
  const grid = $('all-balls-grid');

  grid.innerHTML = results.map(r => {
    const name = i18n.ballName(r.key);

    // Quick Ball: gray out if HP has been changed or a status is active (not turn 1 anymore)
    const isQuickBallInvalid = r.key === 'quick_ball' && (state.hp !== 100 || state.status !== 'none');
    const unavailable = r.conditionMet === false || isQuickBallInvalid;

    const pct = unavailable ? null : r.probability;

    let rateText, rateClass;
    if (unavailable) {
      rateText = '—';
      rateClass = '';
    } else if (r.guaranteed) {
      rateText = '100%';
      rateClass = 'rate-guaranteed';
    } else {
      rateText = Calc.formatPercent(pct);
      rateClass = pct >= 0.5 ? 'rate-high' : pct >= 0.15 ? 'rate-med' : 'rate-low';
    }

    const isBest = best && r.key === best.key && !unavailable;
    const isCheap = cheap && r.key === cheap.key && !unavailable;
    const showBestTag = isBest;
    const showCheapTag = isCheap && !(isBest && isCheap);

    let itemClass = 'ball-grid-item';
    if (unavailable) itemClass += ' ball-unavailable';
    else if (r.guaranteed && r.conditionNote !== 'love') itemClass += ' ball-guaranteed';
    if (isBest) itemClass += ' ball-best';
    else if (isCheap) itemClass += ' ball-cheapest';

    const condLabel = getCondLabel(r, state.pokemon);
    const condHtml = condLabel ? `<span class="ball-grid-cond">${condLabel}</span>` : '';

    // State parameter chips (only for non-unavailable balls)
    const stateChips = !unavailable ? buildGridStateChips(r) : '';

    const bestTag = showBestTag ? `<span class="ball-tag ball-tag-best">BEST</span>` : '';
    const cheapTag = showCheapTag ? `<span class="ball-tag ball-tag-cheap">CHEAP</span>` : '';

    return `
      <div class="${itemClass}">
        ${bestTag}${cheapTag}
        <img class="ball-grid-img" src="${Calc.ballSprite(r.key)}" alt="${name}" loading="lazy" />
        <span class="ball-grid-name">${name}</span>
        <span class="ball-grid-rate ${rateClass}">${rateText}</span>
        ${stateChips}
        ${condHtml}
      </div>
    `;
  }).join('');
}

function buildGridStateChips(r) {
  const chips = [];
  // HP chip
  if (state.hp < 100) {
    const label = state.hp === 1 ? i18n.t('technique_1hp') : `${state.hp}%`;
    chips.push(`<span class="ball-state-chip chip-1hp">${label}</span>`);
  }
  // Status chip
  const statusChipMap = {
    sleep:  { label: () => i18n.t('technique_sleep'),  cls: 'chip-sleep'  },
    freeze: { label: () => i18n.t('technique_freeze'), cls: 'chip-freeze' },
    para:   { label: () => i18n.t('technique_para'),   cls: 'chip-para'   },
    poison: { label: () => i18n.t('technique_poison'), cls: 'chip-poison' },
    burn:   { label: () => i18n.t('technique_burn'),   cls: 'chip-burn'   },
  };
  if (state.status !== 'none' && statusChipMap[state.status]) {
    const s = statusChipMap[state.status];
    chips.push(`<span class="ball-state-chip ${s.cls}">${s.label()}</span>`);
  }
  // Night chip (only for dusk ball)
  if (r.key === 'duskball' && state.night) {
    chips.push(`<span class="ball-state-chip chip-night">${i18n.t('technique_night')}</span>`);
  }
  if (!chips.length) return '';
  return `<div class="ball-state-chips">${chips.join('')}</div>`;
}

function getCondLabel(r, pokemon) {
  if (r.conditionNote === 'quick')    return i18n.t('cond_quick');
  if (r.conditionNote === 'love')     return i18n.t('cond_love');
  if (r.conditionNote === 'bugwater') {
    // Show the pokemon's actual type(s) instead of generic "Type Bug/Water"
    if (pokemon) {
      const t1 = pokemon.type1 ? pokemon.type1.charAt(0).toUpperCase() + pokemon.type1.slice(1) : null;
      const t2 = pokemon.type2 ? pokemon.type2.charAt(0).toUpperCase() + pokemon.type2.slice(1) : null;
      const typeStr = (t1 && t2) ? `${t1}/${t2}` : (t1 || '');
      return `Type ${typeStr}`;
    }
    return i18n.t('cond_bugwater');
  }
  if (r.conditionNote === 'timer')    return i18n.t('cond_timer');
  if (r.conditionMet === false)       return i18n.t('cond_night');
  return null;
}

/* ── Re-apply on lang change ── */
document.addEventListener('langchange', () => {
  if (state.pokemon) {
    $('pokemon-gen-badge').textContent = `${i18n.t('gen_label')} ${state.pokemon.generation}`;
    $('pokemon-rate-display').textContent = `${i18n.t('catch_rate_label')}: ${state.pokemon.catch_rate}`;
    updateResults();
  }
  renderHistory();
});

/* ══════════════ EVENTS PAGE ══════════════ */
async function loadEvents() {
  const res = await fetch('/api/events');
  const events = await res.json();
  const container = $('events-list');

  if (!events.length) {
    container.innerHTML = `<p class="loading-spinner">${i18n.t('no_events')}</p>`;
    return;
  }

  const detailed = await Promise.all(
    events.map(ev => fetch(`/api/events/${ev.slug}`).then(r => r.json()))
  );
  container.innerHTML = detailed.map(ev => `
    <div class="event-card">
      <div class="event-card-header">
        <span class="event-name">${ev.name_en}</span>
        <button class="btn btn-sm btn-outline event-edit-btn">Edit</button>
      </div>
      <div class="event-pokemon-grid">
        ${(ev.pokemon || []).map(p => `
          <div class="event-pokemon-item" data-id="${p.id}" title="${p.name}">
            <img src="${sprite(p.id)}" alt="${p.name}" loading="lazy" />
            <span class="ep-name">${p.name}</span>
            <span class="ep-rate">${p.catch_rate}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.event-pokemon-item').forEach(item => {
    item.addEventListener('click', () => {
      showPage('calc');
      selectPokemonById(Number(item.dataset.id));
    });
  });

  container.querySelectorAll('.event-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => showPage('admin'));
  });
}

/* ══════════════ ADMIN ══════════════ */
let currentAdminRole = null;

async function initAdmin() {
  const res = await fetch('/api/admin/check');
  const data = await res.json();
  if (data.authenticated) {
    currentAdminRole = data.role;
    showAdminDashboard();
    loadAdminEvents();
  } else {
    $('admin-login').style.display = '';
    $('admin-dashboard').style.display = 'none';
  }
}

function showAdminDashboard() {
  $('admin-login').style.display = 'none';
  $('admin-dashboard').style.display = '';
  $('manage-users-btn').style.display = currentAdminRole === 'admin' ? '' : 'none';
}

$('login-btn').addEventListener('click', async () => {
  const username = $('login-username').value.trim();
  const password = $('login-password').value;
  $('login-error').style.display = 'none';
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (res.ok) {
    const data = await res.json();
    currentAdminRole = data.role;
    showAdminDashboard();
    loadAdminEvents();
  } else {
    $('login-error').textContent = i18n.t('login_error');
    $('login-error').style.display = '';
  }
});

$('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') $('login-btn').click(); });

$('logout-btn').addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  currentAdminRole = null;
  $('admin-dashboard').style.display = 'none';
  $('admin-login').style.display = '';
  $('login-username').value = '';
  $('login-password').value = '';
});

// ── Users section ────────────────────────────────────────────────────────────
function showUsersSection() {
  $('admin-events-view').style.display = 'none';
  $('admin-users-section').style.display = '';
  $('add-user-form').style.display = 'none';
  $('show-add-user-btn').style.display = '';
  loadUsersList();
}

function showEventsSection() {
  $('admin-users-section').style.display = 'none';
  $('admin-events-view').style.display = '';
}

$('manage-users-btn').addEventListener('click', showUsersSection);
$('back-to-events-btn').addEventListener('click', showEventsSection);

async function loadUsersList() {
  const res = await fetch('/api/admin/users');
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    $('users-list').innerHTML = `<p style="color:var(--red)">Error ${res.status}: ${d.error || 'Failed to load users'}</p>`;
    return;
  }
  const users = await res.json();
  const roleLabel = r => r === 'admin' ? 'Administrator' : 'Manager';
  $('users-list').innerHTML = users.map(u => `
    <div class="admin-user-row" data-uid="${u.id}">
      <div class="aur-info">
        <span class="aur-name">${u.username}</span>
        <span class="aur-role ${u.role === 'admin' ? 'role-admin' : 'role-manager'}">${roleLabel(u.role)}</span>
      </div>
      <div class="aur-actions">
        <button class="btn btn-sm btn-outline edit-user-btn" data-id="${u.id}" data-username="${u.username}" data-role="${u.role}">Edit</button>
        <button class="btn btn-sm btn-danger delete-user-btn" data-id="${u.id}" data-username="${u.username}">Delete</button>
      </div>
      <div class="aur-edit-form" id="edit-form-${u.id}" style="display:none">
        <div class="aur-edit-fields">
          <div class="form-group">
            <label>Username</label>
            <input type="text" class="ef-username" value="${u.username}" autocomplete="off" />
          </div>
          <div class="form-group">
            <label>New Password <span style="color:var(--text-muted);font-size:.8em">(leave empty to keep)</span></label>
            <input type="password" class="ef-password" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label>Role</label>
            <select class="ef-role input-select">
              <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrator</option>
            </select>
          </div>
          <div class="aur-edit-actions">
            <button class="btn btn-sm btn-primary save-edit-btn" data-id="${u.id}">Save</button>
            <button class="btn btn-sm btn-outline cancel-edit-btn" data-id="${u.id}">Cancel</button>
          </div>
          <div class="ef-error alert alert-error" style="display:none"></div>
        </div>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-muted)">No users.</p>';

  $('users-list').querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // close any other open form
      $('users-list').querySelectorAll('.aur-edit-form').forEach(f => f.style.display = 'none');
      document.getElementById(`edit-form-${btn.dataset.id}`).style.display = '';
    });
  });

  $('users-list').querySelectorAll('.cancel-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById(`edit-form-${btn.dataset.id}`).style.display = 'none';
    });
  });

  $('users-list').querySelectorAll('.save-edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const form = document.getElementById(`edit-form-${btn.dataset.id}`);
      const username = form.querySelector('.ef-username').value.trim();
      const password = form.querySelector('.ef-password').value;
      const role = form.querySelector('.ef-role').value;
      const errEl = form.querySelector('.ef-error');
      errEl.style.display = 'none';
      const r = await fetch(`/api/admin/users/${btn.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role, password: password || undefined })
      });
      if (r.ok) { loadUsersList(); }
      else { const d = await r.json(); errEl.textContent = d.error; errEl.style.display = ''; }
    });
  });

  $('users-list').querySelectorAll('.delete-user-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`Delete user "${btn.dataset.username}"?`)) return;
      const r = await fetch(`/api/admin/users/${btn.dataset.id}`, { method: 'DELETE' });
      if (r.ok) { loadUsersList(); }
      else { const d = await r.json(); alert(d.error); }
    });
  });
}

$('show-add-user-btn').addEventListener('click', () => {
  $('add-user-form').style.display = '';
  $('show-add-user-btn').style.display = 'none';
  $('new-user-username').focus();
});
$('cancel-add-user-btn').addEventListener('click', () => {
  $('add-user-form').style.display = 'none';
  $('show-add-user-btn').style.display = '';
  $('users-form-error').style.display = 'none';
});

$('add-user-btn').addEventListener('click', async () => {
  const username = $('new-user-username').value.trim();
  const password = $('new-user-password').value;
  const role = $('new-user-role').value;
  $('users-form-error').style.display = 'none';
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  });
  if (res.ok) {
    $('new-user-username').value = '';
    $('new-user-password').value = '';
    $('new-user-role').value = 'manager';
    $('add-user-form').style.display = 'none';
    $('show-add-user-btn').style.display = '';
    loadUsersList();
  } else {
    const d = await res.json();
    $('users-form-error').textContent = d.error;
    $('users-form-error').style.display = '';
  }
});

$('change-pw-btn').addEventListener('click', () => {
  $('change-pw-modal').style.display = 'flex';
  $('pw-error').style.display = 'none';
  $('pw-success').style.display = 'none';
  $('new-password').value = '';
});
$('cancel-pw-btn').addEventListener('click', () => { $('change-pw-modal').style.display = 'none'; });
$('save-pw-btn').addEventListener('click', async () => {
  const password = $('new-password').value;
  $('pw-error').style.display = 'none';
  $('pw-success').style.display = 'none';
  const res = await fetch('/api/admin/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (res.ok) {
    $('pw-success').textContent = i18n.t('pw_success');
    $('pw-success').style.display = '';
    setTimeout(() => { $('change-pw-modal').style.display = 'none'; }, 1500);
  } else {
    const d = await res.json();
    $('pw-error').textContent = d.error || i18n.t('pw_error');
    $('pw-error').style.display = '';
  }
});

$('create-event-btn').addEventListener('click', async () => {
  const slug = $('event-slug').value.trim();
  const name_en = $('event-name-en').value.trim();
  const active = true;
  $('event-form-error').style.display = 'none';
  if (!slug || !name_en) {
    $('event-form-error').textContent = 'All fields required.';
    $('event-form-error').style.display = '';
    return;
  }
  const res = await fetch('/api/admin/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, name_en, name_fr: '', active })
  });
  if (res.ok) {
    $('event-slug').value = '';
    $('event-name-en').value = '';
    loadAdminEvents();
  } else {
    const d = await res.json();
    $('event-form-error').textContent = d.error;
    $('event-form-error').style.display = '';
  }
});

async function loadAdminEvents() {
  const res = await fetch('/api/events');
  const events = await res.json();
  const detailed = await Promise.all(
    events.map(ev => fetch(`/api/events/${ev.slug}`).then(r => r.json()))
  );
  renderAdminEvents(detailed);
}

function renderAdminEvents(events) {
  const container = $('admin-events-list');
  if (!events.length) { container.innerHTML = '<p style="color:var(--text-muted)">No events yet.</p>'; return; }

  container.innerHTML = events.map((ev, idx) => `
    <div class="admin-event-row" data-event-id="${ev.id}">
      <div class="admin-event-top">
        <div class="aer-order-btns">
          <button class="btn-order move-up-btn" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn-order move-down-btn" data-idx="${idx}" ${idx === events.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
        <div class="admin-event-info">
          <div class="aei-name">${ev.name_en}</div>
          <div class="aei-slug">${ev.slug}</div>
        </div>
        <div class="admin-event-actions">
          <button class="btn btn-sm btn-danger delete-event-btn" data-id="${ev.id}">
            ${i18n.t('btn_delete')}
          </button>
        </div>
      </div>
      <div class="admin-event-pokemon">
        ${(ev.pokemon || []).map(p => `
          <div class="admin-pokemon-chip">
            <img src="${sprite(p.id)}" alt="${p.name}" />
            <span>${p.name}</span>
            <button class="remove-pokemon-btn" data-pid="${p.id}" data-eid="${ev.id}">✕</button>
          </div>
        `).join('')}
      </div>
      <div class="add-pokemon-form" data-event-id="${ev.id}">
        <input type="text" class="add-pokemon-input" placeholder="${i18n.t('add_pokemon_placeholder')}" />
        <div class="add-pokemon-dropdown" style="display:none"></div>
        <button class="btn btn-sm btn-primary add-pokemon-btn" data-eid="${ev.id}">${i18n.t('btn_add_pokemon')}</button>
      </div>
    </div>
  `).join('');


  // Reorder arrows
  const reorder = async (fromIdx, toIdx) => {
    const reordered = [...events];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    await fetch('/api/admin/events/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: reordered.map(e => e.id) })
    });
    loadAdminEvents();
  };
  container.querySelectorAll('.move-up-btn').forEach(btn => {
    btn.addEventListener('click', () => reorder(Number(btn.dataset.idx), Number(btn.dataset.idx) - 1));
  });
  container.querySelectorAll('.move-down-btn').forEach(btn => {
    btn.addEventListener('click', () => reorder(Number(btn.dataset.idx), Number(btn.dataset.idx) + 1));
  });

  // Delete event
  container.querySelectorAll('.delete-event-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(i18n.t('confirm_delete_event'))) return;
      await fetch(`/api/admin/events/${btn.dataset.id}`, { method: 'DELETE' });
      loadAdminEvents();
    });
  });

  // Remove Pokémon
  container.querySelectorAll('.remove-pokemon-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(i18n.t('confirm_remove_pokemon'))) return;
      await fetch(`/api/admin/events/${btn.dataset.eid}/pokemon/${btn.dataset.pid}`, { method: 'DELETE' });
      loadAdminEvents();
    });
  });

  // Add Pokémon search per event
  container.querySelectorAll('.add-pokemon-form').forEach(form => {
    const input = form.querySelector('.add-pokemon-input');
    const dropdown = form.querySelector('.add-pokemon-dropdown');
    const addBtn = form.querySelector('.add-pokemon-btn');
    const eid = form.dataset.eventId;
    let selectedPokemonId = null;
    let addTimer = null;

    input.addEventListener('input', () => {
      const q = input.value.trim();
      clearTimeout(addTimer);
      if (!q) { dropdown.style.display = 'none'; return; }
      addTimer = setTimeout(async () => {
        const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!data.length) { dropdown.style.display = 'none'; return; }
        dropdown.innerHTML = data.slice(0, 8).map(p => `
          <div class="search-item" data-id="${p.id}">
            <img src="${sprite(p.id)}" alt="${p.name}" loading="lazy" />
            <span class="search-item-id">#${String(p.id).padStart(3,'0')}</span>
            <span class="search-item-name">${p.name}</span>
          </div>
        `).join('');
        dropdown.style.display = '';
        dropdown.querySelectorAll('.search-item').forEach(item => {
          item.addEventListener('click', () => {
            selectedPokemonId = Number(item.dataset.id);
            input.value = item.querySelector('.search-item-name').textContent;
            dropdown.style.display = 'none';
          });
        });
      }, 200);
    });

    addBtn.addEventListener('click', async () => {
      if (!selectedPokemonId) return;
      await fetch(`/api/admin/events/${eid}/pokemon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pokemon_id: selectedPokemonId })
      });
      input.value = '';
      selectedPokemonId = null;
      loadAdminEvents();
    });

    document.addEventListener('click', e => {
      if (!form.contains(e.target)) dropdown.style.display = 'none';
    });
  });
}



/* ══════════════ HISTORY ══════════════ */
const HISTORY_KEY = 'catchCalc_history';
const HISTORY_MAX = 15;
let historyData = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');

const historyPanel = $('history-panel');
const historyListEl = $('history-list');

// Toggle panel
$('history-toggle').addEventListener('click', () => {
  historyPanel.classList.toggle('open');
  renderHistory();
});

// Close (mobile)
$('history-close-btn').addEventListener('click', () => {
  historyPanel.classList.remove('open');
});

// Close overlay on backdrop click (mobile)
historyPanel.addEventListener('click', e => {
  if (e.target === historyPanel) historyPanel.classList.remove('open');
});

// Clear history
$('history-clear-btn').addEventListener('click', () => {
  historyData = [];
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
});

function addToHistory(pokemon, bestResult) {
  // Remove existing entry for this pokemon
  historyData = historyData.filter(h => h.id !== pokemon.id);

  const entry = {
    id: pokemon.id,
    name: pokemon.name,
    spriteUrl: sprite(pokemon.id),
    bestBallKey: bestResult ? bestResult.key : null,
    bestBallPercent: bestResult ? bestResult.probability : null,
  };

  // Insert at front
  historyData.unshift(entry);

  // Cap at max
  if (historyData.length > HISTORY_MAX) historyData.length = HISTORY_MAX;

  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyData));
  renderHistory();
}

function renderHistory() {
  if (!historyData.length) {
    historyListEl.innerHTML = `<p class="history-empty" data-i18n="history_empty">${i18n.t('history_empty')}</p>`;
    return;
  }

  historyListEl.innerHTML = historyData.map(h => {
    let badgeHtml = '';
    if (h.bestBallKey && h.bestBallPercent != null) {
      const pct = h.bestBallPercent >= 1 ? '100%' : (h.bestBallPercent * 100).toFixed(1) + '%';
      badgeHtml = `
        <div class="history-item-badge">
          <img src="${Calc.ballSprite(h.bestBallKey)}" alt="${h.bestBallKey}" />
          <span>${pct}</span>
        </div>`;
    }
    return `
      <div class="history-item" data-id="${h.id}">
        <img class="history-item-sprite" src="${h.spriteUrl}" alt="${h.name}" />
        <div class="history-item-info">
          <div class="history-item-name">${h.name}</div>
          ${badgeHtml}
        </div>
      </div>`;
  }).join('');

  historyListEl.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = Number(item.dataset.id);
      selectPokemonById(id);
      // Close mobile overlay
      if (window.innerWidth <= 680) historyPanel.classList.remove('open');
    });
  });
}

// Initial render
renderHistory();

/* ══════════════ URL param: auto-select ══════════════ */
(async () => {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get('pokemon');
  if (pid) await selectPokemonById(Number(pid));
})();
