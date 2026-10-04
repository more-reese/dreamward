/* ============================================================
   DREAMWARD — matrix.js
   Grouped card grid — replaces old SVG scatter plot
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
const MatrixState = {
  groupBy:  'cluster',
  sortBy:   'alpha',
  search:   '',
  activePreset: null,
};

// ── Field label map ──────────────────────────────────────────
const MATRIX_GROUP_LABELS = {
  cluster:              'Cluster',
  epistemologyPrimary:  'Epistemology',
  agencyStyle:          'Agency Style',
  period:               'Period',
  ontology:             'Ontology',
};

// ── Get grouping value for a tradition ──────────────────────
function matrixGetGroupValue(t, field) {
  if (field === 'ontology') {
    return Array.isArray(t.ontology)
      ? t.ontology[0].replace(/\(.*?\)/g, '').trim()
      : (t.ontology || 'Unknown');
  }
  return t[field] || 'Unknown';
}

// ── Sort traditions within a group ──────────────────────────
function matrixSortGroup(traditions, sortBy) {
  return [...traditions].sort((a, b) => {
    if (sortBy === 'alpha') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'period') {
      const periodOrder = [
        'Ancient', 'Classical', 'Classical–Contemporary',
        'Medieval', 'Early Modern', 'Modern', 'Contemporary',
        '20th century–Contemporary', '20th–21st century',
        '20th Century–Contemporary', 'Mid-20th–21st century',
        'Late 20th–21st century',
      ];
      const ai = periodOrder.findIndex(p => a.period && a.period.includes(p.split('–')[0]));
      const bi = periodOrder.findIndex(p => b.period && b.period.includes(p.split('–')[0]));
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    } else if (sortBy === 'cluster') {
      const oi = (window.CLUSTERS_ORDER || []).indexOf(a.cluster);
      const oj = (window.CLUSTERS_ORDER || []).indexOf(b.cluster);
      return (oi === -1 ? 999 : oi) - (oj === -1 ? 999 : oj);
    }
    return 0;
  });
}

// ── Render Matrix View ───────────────────────────────────────
function renderMatrix() {
  const traditions = window.AppState.traditions;
  if (!traditions || traditions.length === 0) {
    setTimeout(renderMatrix, 100);
    return;
  }

  // Ensure the container is ready
  const container = document.getElementById('matrix-card-container');
  if (!container) return;

  _renderMatrixContent();
}

function _renderMatrixContent() {
  const traditions = window.AppState.traditions;
  const { groupBy, sortBy, search } = MatrixState;

  // Filter by search
  const q = search.trim().toLowerCase();
  const filtered = q
    ? traditions.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.cluster.toLowerCase().includes(q) ||
        (t.epistemologyPrimary || '').toLowerCase().includes(q)
      )
    : traditions;

  // Group
  const groups = {};
  filtered.forEach(t => {
    const key = matrixGetGroupValue(t, groupBy);
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  // Sort group keys
  let groupKeys = Object.keys(groups);
  if (groupBy === 'cluster') {
    groupKeys = groupKeys.sort((a, b) => {
      const oi = (window.CLUSTERS_ORDER || []).indexOf(a);
      const oj = (window.CLUSTERS_ORDER || []).indexOf(b);
      return (oi === -1 ? 999 : oi) - (oj === -1 ? 999 : oj);
    });
  } else {
    groupKeys = groupKeys.sort();
  }

  // Render count badge
  const countEl = document.getElementById('matrix-count-badge');
  if (countEl) {
    const total = filtered.length;
    countEl.textContent = `${total} tradition${total !== 1 ? 's' : ''}`;
  }

  // Render groups
  const container = document.getElementById('matrix-card-container');
  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="matrix-empty">
        <p class="matrix-empty-text">No traditions match your search.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = groupKeys.map(key => {
    const groupTraditions = matrixSortGroup(groups[key], sortBy);
    const color = groupBy === 'cluster'
      ? window.getClusterColor(key)
      : 'var(--color-primary)';

    return `
      <div class="matrix-group" data-group="${encodeURIComponent(key)}">
        <div class="matrix-group-header">
          <span class="matrix-group-dot" style="background:${color}"></span>
          <h3 class="matrix-group-name">${escapeHtml(key)}</h3>
          <span class="matrix-group-count">${groupTraditions.length}</span>
        </div>
        <div class="matrix-cards-grid">
          ${groupTraditions.map(t => renderTraditionCard(t)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ── Render single tradition card ─────────────────────────────
function renderTraditionCard(t) {
  const color = window.getClusterColor(t.cluster);
  const shortName = t.name.split(/[/(]/)[0].trim();

  return `
    <div class="matrix-card"
         role="button"
         tabindex="0"
         onclick="window.navigateTo('profile', '${t.id}')"
         onkeydown="if(event.key==='Enter'||event.key===' '){window.navigateTo('profile','${t.id}')}"
         style="--card-cluster-color: ${color}">
      <div class="matrix-card-inner">
        <span class="matrix-card-cluster-dot" style="background:${color}"></span>
        <div class="matrix-card-content">
          <p class="matrix-card-name">${escapeHtml(shortName)}</p>
          <div class="matrix-card-chips">
            ${t.period ? `<span class="matrix-chip" title="${escapeHtml(t.period)}">${escapeHtml(t.period)}</span>` : ''}
            ${t.epistemologyPrimary ? `<span class="matrix-chip" title="${escapeHtml(t.epistemologyPrimary)}">${escapeHtml(t.epistemologyPrimary)}</span>` : ''}
            ${t.agencyStyle ? `<span class="matrix-chip" title="${escapeHtml(t.agencyStyle)}">${escapeHtml(t.agencyStyle)}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Event handlers ───────────────────────────────────────────
function matrixSetGroupBy(val) {
  MatrixState.groupBy = val;
  _renderMatrixContent();
}

function matrixSetSortBy(val) {
  MatrixState.sortBy = val;
  _renderMatrixContent();
}

function matrixSetSearch(val) {
  MatrixState.search = val;
  _renderMatrixContent();
}

// ── Preset Views ─────────────────────────────────────────
const MATRIX_PRESETS = {
  epistemology: { groupBy: 'epistemologyPrimary', sortBy: 'alpha', search: '' },
  indigenous:   { groupBy: 'cluster', sortBy: 'alpha', search: 'Indigenous' },
  timeline:     { groupBy: 'period', sortBy: 'period', search: '' },
  ontology:     { groupBy: 'ontology', sortBy: 'alpha', search: '' },
  active:       { groupBy: 'agencyStyle', sortBy: 'alpha', search: 'active' },
};

function matrixApplyPreset(presetKey) {
  const p = MATRIX_PRESETS[presetKey];
  if (!p) return;

  MatrixState.groupBy = p.groupBy;
  MatrixState.sortBy = p.sortBy;
  MatrixState.search = p.search;
  MatrixState.activePreset = presetKey;

  // Sync dropdowns
  const grpSel = document.getElementById('matrix-group-select');
  const srtSel = document.getElementById('matrix-sort-select');
  const srchInput = document.getElementById('matrix-search-input');
  if (grpSel) grpSel.value = p.groupBy;
  if (srtSel) srtSel.value = p.sortBy;
  if (srchInput) srchInput.value = p.search;

  // Update preset button states
  document.querySelectorAll('.matrix-preset-btn[data-preset]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });
  const clearBtn = document.getElementById('matrix-preset-clear');
  if (clearBtn) clearBtn.style.display = 'inline-flex';

  _renderMatrixContent();
}

function matrixClearPreset() {
  MatrixState.groupBy = 'cluster';
  MatrixState.sortBy = 'alpha';
  MatrixState.search = '';
  MatrixState.activePreset = null;

  const grpSel = document.getElementById('matrix-group-select');
  const srtSel = document.getElementById('matrix-sort-select');
  const srchInput = document.getElementById('matrix-search-input');
  if (grpSel) grpSel.value = 'cluster';
  if (srtSel) srtSel.value = 'alpha';
  if (srchInput) srchInput.value = '';

  document.querySelectorAll('.matrix-preset-btn[data-preset]').forEach(btn => {
    btn.classList.remove('active');
  });
  const clearBtn = document.getElementById('matrix-preset-clear');
  if (clearBtn) clearBtn.style.display = 'none';

  _renderMatrixContent();
}

// ── HTML escape utility ──────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Expose
window.renderMatrix      = renderMatrix;
window.matrixSetGroupBy  = matrixSetGroupBy;
window.matrixSetSortBy   = matrixSetSortBy;
window.matrixSetSearch   = matrixSetSearch;
window.matrixApplyPreset = matrixApplyPreset;
window.matrixClearPreset = matrixClearPreset;
