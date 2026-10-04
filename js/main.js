/* ============================================================
   DREAMWARD — main.js
   App state, routing, shared utilities, data loading
   ============================================================ */

'use strict';

// ── Global App State ────────────────────────────────────────
const AppState = {
  traditions: [],
  resources: [],
  glossary: [],
  currentView: 'entry',
  currentProfileId: null,
  comparatorList: [],       // array of tradition IDs
  dreamMatchIds: [],        // top 5 from dream entry
  dreamText: null,          // the raw dream text the user entered
  dreamElements: [],        // array of extracted keywords/themes that matched
  dreamMatchDetails: {},    // keyed by tradition ID: { score, matchedKeywords, dreamTokensMatched, rationale }
  interpretDreamText: null,       // the raw dream text for interpretation
  interpretTraditions: [],        // array of tradition IDs currently shown (max 3)
  interpretResults: {},           // keyed by tradition ID: { loading, narrative, symbols, themes, questions, resources, error }
  interpretMatchedIds: [],        // ranked tradition IDs from dream matching (top 5)
  hoverTarget: null,        // currently hovered tradition id
  hoverTimer: null,
  graphInitialized: false,
  matrixInitialized: false,
  resourcesInitialized: false,
  glossaryInitialized: false,
};

// ── Cluster → CSS class mapping ────────────────────────────
const CLUSTER_CLASS = {
  'Eastern Philosophical & Contemplative':   'eastern',
  'Depth & Clinical Psychology':             'depth',
  'Indigenous & Shamanic Traditions':        'indigenous',
  'Cognitive & Quantitative Psychology':     'cognitive',
  'Neurobiological & Evolutionary':          'neuro',
  'Ancient & Classical Worldviews':          'ancient',
  'Western Religious & Mystical':            'religious',
  'Contemporary, Frontier, & Esoteric':      'contemporary',
};

const CLUSTER_COLOR = {
  'Eastern Philosophical & Contemplative':   '#c9a84c',
  'Depth & Clinical Psychology':             '#b56b7a',
  'Indigenous & Shamanic Traditions':        '#6a9478',
  'Cognitive & Quantitative Psychology':     '#6a87a8',
  'Neurobiological & Evolutionary':          '#5a9090',
  'Ancient & Classical Worldviews':          '#b08050',
  'Western Religious & Mystical':            '#8a74a8',
  'Contemporary, Frontier, & Esoteric':      '#848484',
};

const CLUSTERS_ORDER = Object.keys(CLUSTER_CLASS);

function getClusterColor(cluster) {
  return CLUSTER_COLOR[cluster] || '#848484';
}

function getClusterClass(cluster) {
  return `cluster-${CLUSTER_CLASS[cluster] || 'contemporary'}`;
}

// ── Data Loading ─────────────────────────────────────────────
async function loadData() {
  try {
    const [tradRes, resRes, glossRes] = await Promise.all([
      fetch('./data/traditions.json'),
      fetch('./data/resources.json'),
      fetch('./data/glossary.json'),
    ]);
    if (tradRes.ok) AppState.traditions = await tradRes.json();
    if (resRes.ok)  AppState.resources  = await resRes.json();
    if (glossRes.ok) AppState.glossary  = await glossRes.json();
  } catch(e) {
    console.error('Failed to load data:', e);
    // Still continue — show the app with empty state
  }
}

// ── Router ───────────────────────────────────────────────────
function navigateTo(view, param) {
  const views = document.querySelectorAll('.view');
  views.forEach(v => v.classList.remove('active'));

  let targetId = `view-${view}`;
  if (view === 'profile') {
    AppState.currentProfileId = param;
    targetId = 'view-profile';
    renderProfile(param);
    window.location.hash = `profile/${param}`;
  } else if (view === 'graph') {
    window.location.hash = 'graph';
    if (!AppState.graphInitialized) {
      setTimeout(initGraph, 50);
    } else {
      setTimeout(resizeGraph, 50);
    }
  } else if (view === 'matrix') {
    window.location.hash = 'matrix';
    setTimeout(renderMatrix, 50);
  } else if (view === 'compare') {
    window.location.hash = 'compare';
    renderComparator();
  } else if (view === 'resources') {
    window.location.hash = 'resources';
    setTimeout(renderResources, 50);
  } else if (view === 'glossary') {
    window.location.hash = 'glossary';
    setTimeout(renderGlossary, 50);
  } else if (view === 'about') {
    window.location.hash = 'about';
    setTimeout(renderAbout, 50);
  } else if (view === 'interpret') {
    window.location.hash = 'interpret';
    setTimeout(renderInterpretView, 50);
  } else {
    window.location.hash = view === 'entry' ? '' : view;
  }

  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');

  // Update nav active state
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.view === view);
  });

  AppState.currentView = view;
  hideHoverCard();
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '');
  if (!hash || hash === 'entry') {
    navigateTo('entry');
  } else if (hash === 'graph') {
    navigateTo('graph');
  } else if (hash === 'matrix') {
    navigateTo('matrix');
  } else if (hash === 'compare') {
    navigateTo('compare');
  } else if (hash === 'resources') {
    navigateTo('resources');
  } else if (hash === 'glossary') {
    navigateTo('glossary');
  } else if (hash === 'about') {
    navigateTo('about');
  } else if (hash === 'interpret') {
    navigateTo('interpret');
  } else if (hash.startsWith('profile/')) {
    const id = hash.replace('profile/', '');
    navigateTo('profile', id);
  }
}

// ── Hover Card ───────────────────────────────────────────────
let hoverCardLeaveTimer = null;

function showHoverCard(traditionId, x, y) {
  const trad = AppState.traditions.find(t => t.id === traditionId);
  if (!trad) return;

  AppState.hoverTarget = traditionId;

  const card = document.getElementById('hover-card');
  const clusterEl = document.getElementById('hc-cluster');
  const nameEl    = document.getElementById('hc-name');
  const metaEl    = document.getElementById('hc-meta');
  const tagsEl    = document.getElementById('hc-tags');

  const color = getClusterColor(trad.cluster);

  clusterEl.innerHTML = `<span style="color:${color}">${trad.cluster}</span>`;
  nameEl.textContent = trad.name;

  metaEl.innerHTML = `
    <div class="hover-card-meta-row">
      <span class="hover-card-meta-label">Epistemology</span>
      <span class="hover-card-meta-value">${trad.epistemologyPrimary}</span>
    </div>
    <div class="hover-card-meta-row">
      <span class="hover-card-meta-label">Agency</span>
      <span class="hover-card-meta-value">${trad.agencyStyle}</span>
    </div>
    <div class="hover-card-meta-row">
      <span class="hover-card-meta-label">Period</span>
      <span class="hover-card-meta-value">${trad.period}</span>
    </div>
    <div class="hover-card-meta-row">
      <span class="hover-card-meta-label">Region</span>
      <span class="hover-card-meta-value">${trad.region}</span>
    </div>
  `;

  const ontologies = Array.isArray(trad.ontology) ? trad.ontology.slice(0, 2) : [];
  tagsEl.innerHTML = ontologies.map(o =>
    `<span class="hover-card-tag">${o.replace(/\(.*?\)/g,'').trim()}</span>`
  ).join('');
  if (trad.entryType === 'Provocation') {
    tagsEl.innerHTML += `<span class="hover-card-tag" style="color:var(--color-primary); border-color:rgba(201,168,76,0.2)">Provocation</span>`;
  }

  // If there's an active dream match for this tradition, show connection hint
  if (AppState.dreamMatchDetails && AppState.dreamMatchDetails[traditionId]) {
    const detail = AppState.dreamMatchDetails[traditionId];
    const dreamWords = (detail.dreamTokensMatched || []).slice(0, 3).map(w => `"${w}"`).join(', ');
    if (dreamWords) {
      tagsEl.innerHTML += `
        <span class="hc-dream-connection" style="
          display: block;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid var(--color-divider);
          font-size: 10px;
          color: var(--color-primary);
          line-height: 1.5;
          font-style: italic;
        ">
          Matched via ${dreamWords}
        </span>`;
    }
  }

  // Position card
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = 280;
  const cardH = 220;

  let cx = x + 16;
  let cy = y - 40;
  if (cx + cardW > vw - 20) cx = x - cardW - 16;
  if (cy + cardH > vh - 20) cy = vh - cardH - 20;
  if (cy < 60) cy = 60;

  card.style.left = `${cx}px`;
  card.style.top  = `${cy}px`;

  card.classList.add('visible');

  // Cancel any pending hide
  if (hoverCardLeaveTimer) clearTimeout(hoverCardLeaveTimer);
}

function hideHoverCard(immediate) {
  const card = document.getElementById('hover-card');
  if (immediate) {
    card.classList.remove('visible');
    AppState.hoverTarget = null;
  } else {
    hoverCardLeaveTimer = setTimeout(() => {
      card.classList.remove('visible');
      AppState.hoverTarget = null;
    }, 300);
  }
}

function hoverCardOpen() {
  if (AppState.hoverTarget) {
    navigateTo('profile', AppState.hoverTarget);
    hideHoverCard(true);
  }
}

function hoverCardCompare() {
  if (AppState.hoverTarget) {
    addToComparator(AppState.hoverTarget);
  }
}

// Hover card keeps itself alive when moused into
document.addEventListener('DOMContentLoaded', () => {
  const card = document.getElementById('hover-card');
  card.addEventListener('mouseenter', () => {
    if (hoverCardLeaveTimer) clearTimeout(hoverCardLeaveTimer);
  });
  card.addEventListener('mouseleave', () => {
    hideHoverCard();
  });
});

// ── Comparator helpers ───────────────────────────────────────
function addToComparator(id) {
  if (AppState.comparatorList.includes(id)) {
    showToast('Already in comparator');
    return;
  }
  if (AppState.comparatorList.length >= 3) {
    showToast('Comparator is full (max 3)');
    return;
  }
  AppState.comparatorList.push(id);
  const trad = AppState.traditions.find(t => t.id === id);
  showToast(`Added: ${trad ? trad.name : id}`);
  if (AppState.currentView === 'compare') renderComparator();
}

function removeFromComparator(id) {
  AppState.comparatorList = AppState.comparatorList.filter(x => x !== id);
  renderComparator();
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Modal ─────────────────────────────────────────────────────
function openAddModal() {
  const modal = document.getElementById('add-modal');
  modal.classList.add('open');
  const input = document.getElementById('modal-search-input');
  input.value = '';
  filterModalList('');
  setTimeout(() => input.focus(), 50);
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('open');
}

function filterModalList(query) {
  const list = document.getElementById('modal-list');
  const q = query.toLowerCase();
  const filtered = AppState.traditions.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.cluster.toLowerCase().includes(q)
  ).filter(t => !AppState.comparatorList.includes(t.id));

  list.innerHTML = filtered.map(t => {
    const color = getClusterColor(t.cluster);
    return `
      <div class="modal-list-item" onclick="addFromModal('${t.id}')" role="listitem" tabindex="0">
        <span class="modal-list-item-dot" style="background:${color}"></span>
        <div>
          <div class="modal-list-item-name">${t.name}</div>
          <div class="modal-list-item-cluster">${t.cluster}</div>
        </div>
      </div>
    `;
  }).join('') || '<p style="padding:var(--space-4);font-size:var(--text-xs);color:var(--color-text-faint);">No results</p>';
}

function addFromModal(id) {
  addToComparator(id);
  closeAddModal();
  renderComparator();
}

// Close modal on overlay click
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('add-modal');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeAddModal();
  });
});

// ── Dream Match ──────────────────────────────────────────────
function clearDreamMatch() {
  AppState.dreamMatchIds = [];
  AppState.dreamText = null;
  AppState.dreamElements = [];
  AppState.dreamMatchDetails = {};
  document.getElementById('dream-match-banner').style.display = 'none';
  document.getElementById('match-results').style.display = 'none';
  if (window.graphClearHighlight) window.graphClearHighlight();
}

function clearDreamLens() {
  AppState.dreamText = null;
  AppState.dreamElements = [];
  AppState.dreamMatchDetails = {};
  if (AppState.currentProfileId) {
    renderProfile(AppState.currentProfileId);
  }
}

// ── Utility ───────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.escHtml = escapeHtml;
window.escapeHtml = escapeHtml;

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function shortCluster(cluster) {
  const map = {
    'Eastern Philosophical & Contemplative': 'Eastern',
    'Depth & Clinical Psychology':           'Depth Psych.',
    'Indigenous & Shamanic Traditions':      'Indigenous',
    'Cognitive & Quantitative Psychology':   'Cognitive',
    'Neurobiological & Evolutionary':        'Neurobiological',
    'Ancient & Classical Worldviews':        'Ancient',
    'Western Religious & Mystical':          'Religious',
    'Contemporary, Frontier, & Esoteric':    'Contemporary',
  };
  return map[cluster] || cluster;
}

// ── Mobile hamburger menu ─────────────────────────────────────
function toggleMobileNav() {
  const nav = document.querySelector('.nav-links');
  const btn = document.querySelector('.nav-hamburger');
  const isOpen = nav.classList.toggle('mobile-open');
  if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}
// Close menu on nav link click or tap outside
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const nav = document.querySelector('.nav-links');
      const btn = document.querySelector('.nav-hamburger');
      nav.classList.remove('mobile-open');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  });
  // Tap outside to close
  document.addEventListener('click', (e) => {
    const nav = document.querySelector('.nav-links');
    const btn = document.querySelector('.nav-hamburger');
    if (!nav || !nav.classList.contains('mobile-open')) return;
    if (!nav.contains(e.target) && !btn.contains(e.target)) {
      nav.classList.remove('mobile-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
});
window.toggleMobileNav = toggleMobileNav;

// ── Touch device detection ────────────────────────────────────
const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;
window.isTouchDevice = isTouchDevice;

// ── Graph controls mobile drawer toggle ───────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const controls = document.querySelector('.graph-controls');
  const title = controls ? controls.querySelector('.graph-controls-title') : null;
  if (title) {
    title.addEventListener('click', () => {
      controls.classList.toggle('mobile-expanded');
    });
  }
});

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadData();

  // Dismiss loading screen immediately
  const ls = document.getElementById('loading-screen');
  if (ls) ls.remove();

  // Route to correct view (pass immediate=true to skip setTimeout)
  const hash = window.location.hash.replace('#', '');
  if (hash === 'matrix') {
    navigateTo('matrix');
    // Render immediately after nav completes
    renderMatrix();
  } else if (hash === 'resources') {
    navigateTo('resources');
    renderResources();
  } else if (hash === 'glossary') {
    navigateTo('glossary');
    renderGlossary();
  } else if (window.location.hash) {
    handleHashChange();
  }
});

window.addEventListener('hashchange', handleHashChange);

// Expose globals for cross-module communication
window.AppState     = AppState;
window.navigateTo   = navigateTo;
window.showHoverCard  = showHoverCard;
window.hideHoverCard  = hideHoverCard;
window.hoverCardOpen  = hoverCardOpen;
window.hoverCardCompare = hoverCardCompare;
window.addToComparator  = addToComparator;
window.removeFromComparator = removeFromComparator;
window.showToast      = showToast;
window.openAddModal   = openAddModal;
window.closeAddModal  = closeAddModal;
window.filterModalList = filterModalList;
window.addFromModal   = addFromModal;
window.clearDreamMatch = clearDreamMatch;
window.clearDreamLens  = clearDreamLens;
window.getClusterColor = getClusterColor;
window.getClusterClass = getClusterClass;
window.CLUSTER_COLOR   = CLUSTER_COLOR;
window.CLUSTERS_ORDER  = CLUSTERS_ORDER;
window.shortCluster    = shortCluster;
window.truncate        = truncate;
// resources — loaded from resources.js
// window.renderResources is set by resources.js
// window.renderGlossary is set by glossary.js
