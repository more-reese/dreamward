/* ============================================================
   DREAMWARD — resources.js
   Resource Library: filterable, sortable list of 168 resources
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
const ResourceState = {
  search:         '',
  filterType:     '',
  filterCluster:  '',
  filterSource:   '',
  filterAccess:   '',
  sortBy:         'year-desc',
  visibleCount:   20,
  PAGE_SIZE:      20,
};

// ── Unique values helpers ─────────────────────────────────────
function resGetUnique(field) {
  const resources = window.AppState.resources;
  const vals = [...new Set(resources.map(r => r[field] || '').filter(Boolean))].sort();
  return vals;
}

// ── Filter & sort resources ──────────────────────────────────
function resGetFiltered() {
  const resources = window.AppState.resources;
  const { search, filterType, filterCluster, filterSource, filterAccess } = ResourceState;
  const q = search.trim().toLowerCase();

  return resources.filter(r => {
    if (filterType    && r.resourceType    !== filterType)    return false;
    if (filterCluster && r.cluster         !== filterCluster) return false;
    if (filterSource  && r.sourceCategory  !== filterSource)  return false;
    if (filterAccess  && r.access          !== filterAccess)  return false;
    if (q) {
      const inTitle      = (r.title || '').toLowerCase().includes(q);
      const inAuthors    = (Array.isArray(r.authors) ? r.authors.join(' ') : r.authors || '').toLowerCase().includes(q);
      const inTradition  = (Array.isArray(r.traditions) ? r.traditions.join(' ') : '').toLowerCase().includes(q);
      const inAnnotation = (r.annotation || '').toLowerCase().includes(q);
      const inCluster    = (r.cluster || '').toLowerCase().includes(q);
      if (!inTitle && !inAuthors && !inTradition && !inAnnotation && !inCluster) return false;
    }
    return true;
  });
}

function resSorted(list) {
  const { sortBy } = ResourceState;
  return [...list].sort((a, b) => {
    if (sortBy === 'title-asc') {
      return (a.title || '').localeCompare(b.title || '');
    } else if (sortBy === 'year-desc') {
      return (parseInt(b.year) || 0) - (parseInt(a.year) || 0);
    } else if (sortBy === 'year-asc') {
      return (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
    } else if (sortBy === 'tradition') {
      const at = Array.isArray(a.traditions) ? a.traditions[0] : '';
      const bt = Array.isArray(b.traditions) ? b.traditions[0] : '';
      return at.localeCompare(bt);
    } else if (sortBy === 'cluster') {
      const oi = (window.CLUSTERS_ORDER || []).indexOf(a.cluster);
      const oj = (window.CLUSTERS_ORDER || []).indexOf(b.cluster);
      return (oi === -1 ? 999 : oi) - (oj === -1 ? 999 : oj);
    }
    return 0;
  });
}

// ── Render resource library ──────────────────────────────────
function renderResources() {
  const resources = window.AppState.resources;
  if (!resources || resources.length === 0) {
    setTimeout(renderResources, 100);
    return;
  }

  // Populate filter dropdowns once
  populateResourceFilters();

  // Render the list
  _renderResourceList();
}

function _renderResourceList() {
  const filtered = resGetFiltered();
  const sorted   = resSorted(filtered);
  const visible  = sorted.slice(0, ResourceState.visibleCount);

  // Count
  const countEl = document.getElementById('res-count');
  if (countEl) {
    countEl.textContent = `${filtered.length} resource${filtered.length !== 1 ? 's' : ''}`;
  }

  // Active filter chips
  renderActiveFilterChips();

  // List
  const listEl = document.getElementById('res-list');
  if (!listEl) return;

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div class="res-empty">
        <p class="res-empty-text">No resources match your search or filters.</p>
      </div>
    `;
    const loadMoreEl = document.getElementById('res-load-more');
    if (loadMoreEl) loadMoreEl.style.display = 'none';
    return;
  }

  listEl.innerHTML = visible.map(r => renderResourceCard(r)).join('');

  // Load more button
  const loadMoreEl = document.getElementById('res-load-more');
  if (loadMoreEl) {
    if (ResourceState.visibleCount < filtered.length) {
      const remaining = filtered.length - ResourceState.visibleCount;
      loadMoreEl.style.display = 'flex';
      loadMoreEl.textContent = `Load ${Math.min(remaining, ResourceState.PAGE_SIZE)} more`;
    } else {
      loadMoreEl.style.display = 'none';
    }
  }
}

// ── Render single resource card ──────────────────────────────
function renderResourceCard(r) {
  const color = window.getClusterColor(r.cluster || '');

  // Build link: DOI → direct URL → Google Scholar fallback
  let url = '';
  if (r.doi) {
    url = r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`;
  } else if (r.url) {
    url = r.url;
  }
  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(r.title || '')}`;

  const titleHtml = url
    ? `<a class="res-card-title res-card-title--link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title || 'Untitled')}</a>`
    : `<a class="res-card-title res-card-title--link res-card-title--scholar" href="${escapeAttr(scholarUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title || 'Untitled')}</a>`;

  // Authors — truncate after first author if many
  const authorsRaw = Array.isArray(r.authors)
    ? r.authors.join(', ')
    : (r.authors || '');
  const authorsDisplay = authorsRaw.length > 120
    ? authorsRaw.slice(0, 118) + '…'
    : authorsRaw;

  // Tradition names
  const traditions = Array.isArray(r.traditions) ? r.traditions : [];
  const traditionHtml = traditions.length > 0
    ? traditions.map(t => `
        <span class="res-tradition">
          <span class="res-tradition-dot" style="background:${color}"></span>
          ${escapeHtml(t)}
        </span>
      `).join('')
    : '';

  // Badges
  const accessClass = (r.access || '').toLowerCase().includes('open')
    ? 'res-badge res-badge--open'
    : 'res-badge res-badge--paid';
  const qualityClass = (r.qualityFlag || '').toLowerCase().includes('unverified')
    ? 'res-badge res-badge--unverified'
    : '';

  // Link badges
  const linkBadges = [];
  if (r.doi) {
    const doiUrl = r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`;
    linkBadges.push(`<a href="${escapeAttr(doiUrl)}" target="_blank" rel="noopener noreferrer" class="res-link-badge res-link-badge--doi" title="Open via DOI">DOI</a>`);
  }
  if (r.url && r.doi) {
    linkBadges.push(`<a href="${escapeAttr(r.url)}" target="_blank" rel="noopener noreferrer" class="res-link-badge" title="Direct link">Source</a>`);
  }
  linkBadges.push(`<a href="${escapeAttr(scholarUrl)}" target="_blank" rel="noopener noreferrer" class="res-link-badge res-link-badge--scholar" title="Find on Google Scholar">Scholar</a>`);

  return `
    <article class="res-card">
      <div class="res-card-header">
        ${titleHtml}
      </div>
      ${authorsDisplay ? `<p class="res-card-authors">${escapeHtml(authorsDisplay)}</p>` : ''}
      <div class="res-card-meta-row">
        ${r.year ? `<span class="res-card-year">${escapeHtml(r.year)}</span>` : ''}
        ${r.resourceType ? `<span class="res-badge">${escapeHtml(r.resourceType)}</span>` : ''}
        ${r.sourceCategory ? `<span class="res-badge">${escapeHtml(r.sourceCategory)}</span>` : ''}
        ${r.access ? `<span class="${accessClass}">${escapeHtml(r.access)}</span>` : ''}
        ${r.qualityFlag && qualityClass ? `<span class="${qualityClass}">${escapeHtml(r.qualityFlag)}</span>` : ''}
      </div>
      <div class="res-card-links">${linkBadges.join('')}</div>
      ${traditionHtml ? `<div class="res-card-traditions">${traditionHtml}</div>` : ''}
      ${r.annotation ? `<p class="res-card-annotation">${escapeHtml(r.annotation)}</p>` : ''}
    </article>
  `;
}

// ── Populate filter dropdowns ────────────────────────────────
let filtersPopulated = false;
function populateResourceFilters() {
  if (filtersPopulated) return;
  filtersPopulated = true;

  const typeEl    = document.getElementById('res-filter-type');
  const clusterEl = document.getElementById('res-filter-cluster');
  const sourceEl  = document.getElementById('res-filter-source');
  const accessEl  = document.getElementById('res-filter-access');

  if (typeEl) {
    resGetUnique('resourceType').forEach(v => {
      typeEl.innerHTML += `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`;
    });
  }
  if (clusterEl) {
    (window.CLUSTERS_ORDER || resGetUnique('cluster')).forEach(v => {
      clusterEl.innerHTML += `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`;
    });
  }
  if (sourceEl) {
    resGetUnique('sourceCategory').forEach(v => {
      sourceEl.innerHTML += `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`;
    });
  }
  if (accessEl) {
    resGetUnique('access').forEach(v => {
      accessEl.innerHTML += `<option value="${escapeAttr(v)}">${escapeHtml(v)}</option>`;
    });
  }
}

// ── Active filter chips ──────────────────────────────────────
function renderActiveFilterChips() {
  const wrap = document.getElementById('res-active-filters');
  if (!wrap) return;

  const chips = [];
  const { filterType, filterCluster, filterSource, filterAccess } = ResourceState;

  if (filterType)    chips.push({ label: filterType,    field: 'filterType' });
  if (filterCluster) chips.push({ label: filterCluster, field: 'filterCluster' });
  if (filterSource)  chips.push({ label: filterSource,  field: 'filterSource' });
  if (filterAccess)  chips.push({ label: filterAccess,  field: 'filterAccess' });

  wrap.innerHTML = chips.map(c => `
    <button class="res-filter-chip" onclick="resClearFilter('${c.field}')" aria-label="Remove filter: ${escapeAttr(c.label)}">
      ${escapeHtml(c.label)}
      <span class="res-filter-chip-x">×</span>
    </button>
  `).join('');

  wrap.style.display = chips.length ? 'flex' : 'none';
}

// ── Event handlers ────────────────────────────────────────────
function resSetSearch(val) {
  ResourceState.search = val;
  ResourceState.visibleCount = ResourceState.PAGE_SIZE;
  _renderResourceList();
}

function resSetFilter(field, val) {
  ResourceState[field] = val;
  ResourceState.visibleCount = ResourceState.PAGE_SIZE;
  _renderResourceList();
}

function resClearFilter(field) {
  ResourceState[field] = '';
  // Also reset the corresponding select
  const map = {
    filterType:    'res-filter-type',
    filterCluster: 'res-filter-cluster',
    filterSource:  'res-filter-source',
    filterAccess:  'res-filter-access',
  };
  const el = document.getElementById(map[field]);
  if (el) el.value = '';
  ResourceState.visibleCount = ResourceState.PAGE_SIZE;
  _renderResourceList();
}

function resSetSort(val) {
  ResourceState.sortBy = val;
  ResourceState.visibleCount = ResourceState.PAGE_SIZE;
  _renderResourceList();
}

function resLoadMore() {
  ResourceState.visibleCount += ResourceState.PAGE_SIZE;
  _renderResourceList();
}

// ── Utilities ────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Expose
window.renderResources = renderResources;
window.resSetSearch    = resSetSearch;
window.resSetFilter    = resSetFilter;
window.resClearFilter  = resClearFilter;
window.resSetSort      = resSetSort;
window.resLoadMore     = resLoadMore;
