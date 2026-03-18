/* ════════════════════════════════════════════
   app.js — Main UI logic
   ════════════════════════════════════════════ */

/* ── State ── */
const state = {
  pokemon: null,
  balls: [],
  hp: 100,          // Actual HP value: 1 | 25 | 50 | 75 | 100
  status: 'none',   // none | sleep | freeze | para | poison | burn
  night: false,
  page: 'calc'
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
  if (page === 'shiny' && shinyState.pokemon) updateShinyPanel();
  if (page === 'admin') initAdmin();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); showPage(link.dataset.page); });
});

/* ══════════════ SEARCH ══════════════ */
let searchTimer = null;
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
  if (e.key === 'Escape') { searchDropdown.style.display = 'none'; searchInput.blur(); }
});

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
  const res = await fetch(`/api/pokemon/${id}`);
  const p = await res.json();
  selectPokemon(p);
}

function selectPokemon(p) {
  state.pokemon = p;
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
  $('catch-stats-section').style.display = '';
  $('more-params-section').style.display = '';
  $('all-balls-section').style.display = paramsOpen ? '' : 'none';

  updateResults();
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

  // Capture warnings
  const warningsContainer = $('capture-warnings');
  const warningsHtml = Warnings.renderWarnings(state.pokemon);
  if (warningsHtml) {
    warningsContainer.innerHTML = warningsHtml;
    warningsContainer.style.display = '';
  } else {
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

  // ── Catch Stats: Average Cost & Average Turns ──
  renderCatchStats(state.pokemon, state.balls);
}

/**
 * Render catch statistics: average cost per ball and estimated turns.
 * Uses optimal conditions: 1 HP + Sleep for best accuracy.
 */
function renderCatchStats(pokemon, balls) {
  if (!pokemon || !balls.length) {
    $('catch-stats-section').style.display = 'none';
    return;
  }
  $('catch-stats-section').style.display = '';

  const isGhost = Calc._isGhost(pokemon);
  const isSleepImmune = Warnings.SLEEP_IMMUNE && Warnings.SLEEP_IMMUNE[pokemon.id];
  const recoilMoves = (typeof RECOIL_DATA !== 'undefined' && RECOIL_DATA[pokemon.id])
    ? RECOIL_DATA[pokemon.id].moves : [];
  const hasRecoil = recoilMoves.length > 0;

  // ── Average Cost calculation ──
  // Compute at 1 HP + Sleep (optimal) for each ball
  const statusMult = isSleepImmune ? 1 : 2; // sleep = ×2, or ×1 if immune
  const hp = isGhost ? 100 : 1; // Ghost: can't False Swipe, use full HP

  const costResults = [];
  for (const ball of balls) {
    if (ball.condition_key === 'love') continue; // Skip love ball (conditional)
    if (ball.condition_key === 'bugwater' && !Calc._isBugOrWater(pokemon)) continue;

    let mult = ball.multiplier;
    let label = i18n.ballName(ball.key);
    let note = null;

    // Quick Ball: turn 1 at full HP, no status
    if (ball.condition_key === 'quick') {
      const prob = Calc.probability(pokemon.catch_rate, 100, mult, 1);
      const avg = Calc.avgThrows(prob);
      costResults.push({ key: ball.key, name: label, prob, avg, cost: ball.cost, avgCost: avg * ball.cost, note: i18n.t('cond_quick') });
      continue;
    }
    // Timer Ball: after 10 turns
    if (ball.condition_key === 'timer') note = i18n.t('cond_timer');
    // Dusk Ball: night only
    if (ball.condition_key === 'night') note = i18n.t('cond_night');

    const prob = Calc.probability(pokemon.catch_rate, hp, mult, statusMult);
    const avg = Calc.avgThrows(prob);
    costResults.push({ key: ball.key, name: label, prob, avg, cost: ball.cost, avgCost: avg * ball.cost, note });
  }

  // Find cheapest
  const cheapest = costResults.reduce((best, r) => (!best || r.avgCost < best.avgCost) ? r : best, null);

  if (cheapest) {
    $('catch-avg-cost-value').innerHTML = `
      <img class="catch-stat-ball-img" src="${Calc.ballSprite(cheapest.key)}" alt="${cheapest.name}" />
      <span>${cheapest.name} — ~${Calc.formatCost(cheapest.avgCost)}</span>`;

    const detailRows = costResults
      .sort((a, b) => a.avgCost - b.avgCost)
      .slice(0, 5)
      .map(r => {
        const isBest = r.key === cheapest.key;
        const noteSpan = r.note ? ` <span class="cost-note">${r.note}</span>` : '';
        return `<div class="cost-detail-row${isBest ? ' cost-best' : ''}">
          <img class="cost-ball-icon" src="${Calc.ballSprite(r.key)}" alt="${r.name}" />
          <span class="cost-ball-name">${r.name}${noteSpan}</span>
          <span class="cost-avg-balls">~${Calc.formatThrows(r.avg)} ${i18n.t('avg_balls')}</span>
          <span class="cost-avg-price">${Calc.formatCost(r.avgCost)}</span>
        </div>`;
      }).join('');
    $('catch-avg-cost-detail').innerHTML = detailRows;
  }

  // ── Average Turns calculation ──
  // Strategy: False Swipe (1 turn) + Sleep move (1 turn) + ball throws
  // Sleep lasts 1-3 turns (avg 2). Re-sleep needed periodically.
  const optimalBall = Calc.computeOptimalFastest(pokemon, balls);
  if (!optimalBall) return;

  const catchProb = Calc.probability(pokemon.catch_rate, hp, optimalBall.multiplier, statusMult);
  const avgBallThrows = Calc.avgThrows(catchProb);

  let setupTurns = 0;
  let setupNotes = [];

  if (!isGhost) {
    setupTurns += 1; // False Swipe
    setupNotes.push(i18n.t('turns_false_swipe'));
  } else {
    setupNotes.push(i18n.t('turns_no_false_swipe'));
  }

  if (!isSleepImmune) {
    setupTurns += 1; // Sleep move
    setupNotes.push(i18n.t('turns_sleep_move'));
  }

  // Sleep cycles: sleep lasts avg 2 turns, need to re-sleep periodically
  let reSleepTurns = 0;
  if (!isSleepImmune) {
    const avgSleepDuration = 2;
    const sleepCycles = Math.ceil(avgBallThrows / avgSleepDuration);
    reSleepTurns = Math.max(0, sleepCycles - 1);
  }

  const totalTurns = setupTurns + avgBallThrows + reSleepTurns;

  $('catch-avg-turns-value').textContent = `~${Math.round(totalTurns)} ${i18n.t('turns_label')}`;

  let detailHtml = `<div class="turns-detail">`;
  detailHtml += `<span>${i18n.t('turns_setup')}: ${setupTurns} (${setupNotes.join(' + ')})</span>`;
  detailHtml += `<span>${i18n.t('turns_ball_throws')}: ~${avgBallThrows.toFixed(1)}</span>`;
  if (reSleepTurns > 0) {
    detailHtml += `<span>${i18n.t('turns_resleep')}: ~${reSleepTurns}</span>`;
  }
  // Exception notes
  if (isGhost) {
    detailHtml += `<span class="turns-warn">👻 ${i18n.t('turns_ghost_note')}</span>`;
  }
  if (isSleepImmune) {
    detailHtml += `<span class="turns-warn">🚫💤 ${i18n.t('turns_insomnia_note')}</span>`;
  }
  if (hasRecoil) {
    const worstMove = recoilMoves[0]; // Already sorted by severity
    detailHtml += `<span class="turns-warn">⚠️ ${i18n.t('turns_recoil_note').replace('{move}', worstMove.move)}</span>`;
  }
  detailHtml += `</div>`;
  $('catch-avg-turns-detail').innerHTML = detailHtml;
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
    else if (r.guaranteed) itemClass += ' ball-guaranteed';
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
        <span class="event-name">${i18n.lang === 'fr' ? ev.name_fr : ev.name_en}</span>
        <span class="event-active-badge">${ev.active ? i18n.t('event_active') : i18n.t('event_inactive')}</span>
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
}

/* ══════════════ ADMIN ══════════════ */
async function initAdmin() {
  const res = await fetch('/api/admin/check');
  const data = await res.json();
  if (data.authenticated) {
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
  $('admin-dashboard').style.display = 'none';
  $('admin-login').style.display = '';
  $('login-username').value = '';
  $('login-password').value = '';
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
  const name_fr = $('event-name-fr').value.trim();
  const active = $('event-active').checked;
  $('event-form-error').style.display = 'none';
  if (!slug || !name_en || !name_fr) {
    $('event-form-error').textContent = 'All fields required.';
    $('event-form-error').style.display = '';
    return;
  }
  const res = await fetch('/api/admin/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, name_en, name_fr, active })
  });
  if (res.ok) {
    $('event-slug').value = '';
    $('event-name-en').value = '';
    $('event-name-fr').value = '';
    $('event-active').checked = false;
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

  container.innerHTML = events.map(ev => `
    <div class="admin-event-row" data-event-id="${ev.id}">
      <div class="admin-event-top">
        <div class="admin-event-info">
          <div class="aei-name">${ev.name_en} / ${ev.name_fr}</div>
          <div class="aei-slug">${ev.slug} — ${ev.active
            ? '<span style="color:var(--green)">Active</span>'
            : '<span style="color:var(--text-muted)">Inactive</span>'
          }</div>
        </div>
        <div class="admin-event-actions">
          <button class="btn btn-sm ${ev.active ? 'btn-success-outline' : 'btn-outline'} toggle-active-btn"
            data-id="${ev.id}" data-active="${ev.active}">
            ${ev.active ? 'Deactivate' : 'Activate'}
          </button>
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

  // Toggle active
  container.querySelectorAll('.toggle-active-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const active = btn.dataset.active === '1' ? 0 : 1;
      const ev = events.find(e => e.id == id);
      await fetch(`/api/admin/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: ev.slug, name_en: ev.name_en, name_fr: ev.name_fr, active })
      });
      loadAdminEvents();
    });
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

/* ══════════════ SHINY HUNTER PAGE ══════════════ */
const shinyState = { pokemon: null, tab: 'spots', charm: false, donator: false, event: false };

// Shiny search
const shinySearchInput = $('shiny-search');
const shinySearchDropdown = $('shiny-search-dropdown');
const shinySearchClear = $('shiny-search-clear');
let shinySearchTimer = null;

shinySearchInput.addEventListener('input', () => {
  const q = shinySearchInput.value.trim();
  shinySearchClear.style.display = q ? '' : 'none';
  clearTimeout(shinySearchTimer);
  if (!q) { shinySearchDropdown.style.display = 'none'; return; }
  shinySearchTimer = setTimeout(async () => {
    const res = await fetch(`/api/pokemon/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!data.length) { shinySearchDropdown.style.display = 'none'; return; }
    shinySearchDropdown.innerHTML = data.map(p => `
      <div class="search-item" data-id="${p.id}">
        <img src="${sprite(p.id)}" alt="${p.name}" loading="lazy" />
        <span class="search-item-id">#${String(p.id).padStart(3,'0')}</span>
        <span class="search-item-name">${p.name}</span>
      </div>
    `).join('');
    shinySearchDropdown.style.display = '';
    shinySearchDropdown.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => selectShinyPokemon(Number(item.dataset.id)));
    });
  }, 180);
});

shinySearchClear.addEventListener('click', () => {
  shinySearchInput.value = '';
  shinySearchClear.style.display = 'none';
  shinySearchDropdown.style.display = 'none';
  shinySearchInput.focus();
});

document.addEventListener('click', e => {
  if (!e.target.closest('#page-shiny .search-wrapper')) shinySearchDropdown.style.display = 'none';
});

async function selectShinyPokemon(id) {
  const res = await fetch(`/api/pokemon/${id}`);
  const p = await res.json();
  shinyState.pokemon = p;
  shinySearchInput.value = p.name;
  shinySearchDropdown.style.display = 'none';

  $('shiny-pokemon-sprite').src = sprite(p.id);
  $('shiny-pokemon-id').textContent = String(p.id).padStart(3, '0');
  $('shiny-pokemon-name').textContent = p.name;
  $('shiny-pokemon-gen').textContent = `${i18n.t('gen_label')} ${p.generation}`;
  $('shiny-pokemon-card').style.display = '';
  $('shiny-tabs').style.display = '';
  $('shiny-empty').style.display = 'none';

  updateShinyPanel();
}

// Shiny tabs
document.querySelectorAll('.shiny-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    shinyState.tab = tab.dataset.tab;
    document.querySelectorAll('.shiny-tab').forEach(t => t.classList.toggle('active', t === tab));
    updateShinyPanel();
  });
});

function updateShinyPanel() {
  const spotsPanel = $('shiny-panel-spots');
  const calcPanel = $('shiny-panel-calc');

  if (shinyState.tab === 'spots') {
    spotsPanel.style.display = '';
    calcPanel.style.display = 'none';
    if (shinyState.pokemon) {
      spotsPanel.innerHTML = Shiny.renderSpots(shinyState.pokemon.id);
    }
  } else {
    spotsPanel.style.display = 'none';
    calcPanel.style.display = '';
    updateShinyCalc();
  }
}

// Shiny charm toggle
$('shiny-charm-toggle').addEventListener('click', () => {
  shinyState.charm = !shinyState.charm;
  const btn = $('shiny-charm-toggle');
  btn.classList.toggle('active', shinyState.charm);
  btn.querySelector('.toggle-label').textContent = shinyState.charm
    ? i18n.t('shiny_charm') : i18n.t('shiny_no_charm');
  updateShinyCalc();
});

// Donator status toggle
$('shiny-donator-toggle').addEventListener('click', () => {
  shinyState.donator = !shinyState.donator;
  const btn = $('shiny-donator-toggle');
  btn.classList.toggle('active', shinyState.donator);
  btn.querySelector('.toggle-label').textContent = shinyState.donator
    ? i18n.t('shiny_donator') : i18n.t('shiny_donator_off');
  updateShinyCalc();
});

// Event bonus toggle
$('shiny-event-toggle').addEventListener('click', () => {
  shinyState.event = !shinyState.event;
  const btn = $('shiny-event-toggle');
  btn.classList.toggle('active', shinyState.event);
  btn.querySelector('.toggle-label').textContent = shinyState.event
    ? i18n.t('shiny_event') : i18n.t('shiny_event_off');
  updateShinyCalc();
});

// Calculator controls
$('shiny-method').addEventListener('change', updateShinyCalc);
$('shiny-time-input').addEventListener('input', updateShinyCalc);
$('shiny-ball-price').addEventListener('input', updateShinyCalc);

function getShinyBonuses() {
  return { charm: shinyState.charm, donator: shinyState.donator, event: shinyState.event };
}

function updateShinyCalc() {
  const method = $('shiny-method').value;
  const timePerEnc = Number($('shiny-time-input').value) || 25;
  const ballPrice = Number($('shiny-ball-price').value) || 200;
  const bonuses = getShinyBonuses();
  $('shiny-calc-output').innerHTML = Shiny.renderCalculator(method, bonuses, timePerEnc, ballPrice);

  // Update effective rate display
  const rateEl = $('shiny-effective-rate');
  const hasAny = bonuses.charm || bonuses.donator || bonuses.event;
  if (hasAny) {
    const effRate = Shiny.effectiveRate(bonuses);
    const labels = [];
    if (bonuses.charm) labels.push(i18n.t('shiny_charm'));
    if (bonuses.donator) labels.push(i18n.t('shiny_donator'));
    if (bonuses.event) labels.push(i18n.t('shiny_event'));
    rateEl.innerHTML = `<span class="eff-rate-label">${i18n.t('shiny_effective_rate')}:</span> <span class="eff-rate-value">1/${Math.round(1/effRate).toLocaleString()}</span> <span class="eff-rate-bonuses">(${labels.join(' + ')})</span>`;
    rateEl.style.display = '';
  } else {
    rateEl.style.display = 'none';
  }
}

/* ══════════════ URL param: auto-select ══════════════ */
(async () => {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get('pokemon');
  if (pid) await selectPokemonById(Number(pid));
})();
