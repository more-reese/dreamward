/* ============================================================
   DREAMWARD — comparator.js
   Side-by-side comparison of 2–3 dream traditions
   ============================================================ */

'use strict';

const COMPARE_ROWS = [
  { key: 'cluster',               label: 'Cluster'       },
  { key: 'epistemologyPrimary',   label: 'Epistemology'  },
  { key: 'epistemologySecondary', label: 'Epistemology 2' },
  { key: 'ontology',              label: 'Ontology'      },
  { key: 'functions',             label: 'Functions'     },
  { key: 'agencyStyle',           label: 'Agency'        },
  { key: 'period',                label: 'Period'        },
  { key: 'region',                label: 'Region'        },
];

const COMPARE_API = 'http://localhost:8000';

function renderComparator() {
  const list       = window.AppState.comparatorList;
  const traditions = window.AppState.traditions;
  const content    = document.getElementById('compare-content');
  if (!content) return;

  if (list.length === 0) {
    content.innerHTML = `
      <div class="compare-empty">
        <svg class="compare-empty-icon" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="12" width="16" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <rect x="28" y="12" width="16" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="22" y1="24" x2="26" y2="24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p class="compare-empty-text">
          Add traditions to the comparator by using the "Compare +" button on hover cards,
          or the "Add to Comparator" button on any profile page.
        </p>
        <button class="btn btn-ghost btn-sm" onclick="openAddModal()">Add first tradition</button>
      </div>
    `;
    return;
  }

  const selected = list.map(id => traditions.find(t => t.id === id)).filter(Boolean);

  // Build value map for diff highlighting
  const valueMap = {};
  COMPARE_ROWS.forEach(row => {
    const vals = selected.map(t => normalizeValue(getFieldValue(t, row.key)));
    valueMap[row.key] = vals;
  });

  // Table headers
  const headerCells = selected.map(t => {
    const color = window.getClusterColor(t.cluster);
    return `
      <th class="compare-col-header">
        <button class="compare-remove-btn btn" onclick="removeFromComparator('${t.id}')" aria-label="Remove ${window.escHtml(t.name)}">×</button>
        <div class="compare-col-name">${window.escHtml(t.name)}</div>
        <span style="font-size:var(--text-xs);color:${color}">${window.escHtml(window.shortCluster(t.cluster))}</span>
      </th>
    `;
  }).join('');

  const addColHeader = list.length < 3 ? `
    <th style="padding:var(--space-4);vertical-align:top;min-width:160px;">
      <button class="compare-add-btn" onclick="openAddModal()">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        Add another
      </button>
    </th>
  ` : '';

  // Table rows
  const bodyRows = COMPARE_ROWS.map(row => {
    const vals = valueMap[row.key];
    const allSame = vals.every(v => v === vals[0]);
    const nonEmpty = vals.filter(v => v && v !== '(none)');

    if (nonEmpty.length === 0) return ''; // skip empty rows

    const cells = selected.map((t, i) => {
      const rawVal = getFieldValue(t, row.key);
      const normVal = normalizeValue(rawVal);
      const isShared = !allSame && vals.filter(v => v === normVal).length > 1;
      const displayVal = formatValue(rawVal);

      return `
        <td class="compare-cell${isShared ? ' shared' : ''}">
          ${displayVal || '<span style="color:var(--color-text-faint);font-style:italic;">—</span>'}
        </td>
      `;
    }).join('');

    const addCell = list.length < 3 ? `<td class="compare-add-col"></td>` : '';

    return `
      <tr>
        <td class="compare-row-label-col">${window.escHtml(row.label)}</td>
        ${cells}
        ${addCell}
      </tr>
    `;
  }).filter(Boolean).join('');

  // AI summary button (shown when 2+ traditions selected)
  const aiSummaryHtml = list.length >= 2 ? `
    <div class="compare-ai-section" id="compare-ai-section">
      <button class="btn btn-outline-gold" id="compare-gen-btn" onclick="generateAiSummary()" style="margin-top:var(--space-6);">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        Generate AI Summary
      </button>
      <div id="compare-ai-panel" style="display:none;"></div>
    </div>
  ` : '';

  content.innerHTML = `
    <div class="compare-table-wrap">
      <table class="compare-table" role="table">
        <thead>
          <tr>
            <th style="min-width:140px;padding:var(--space-4);"></th>
            ${headerCells}
            ${addColHeader}
          </tr>
        </thead>
        <tbody>${bodyRows}</tbody>
      </table>
      ${list.length > 0 ? `
        <div style="margin-top:var(--space-6);display:flex;gap:var(--space-3);flex-wrap:wrap;">
          ${list.length < 3
            ? `<button class="btn btn-ghost btn-sm" onclick="openAddModal()">Add another tradition</button>`
            : ''}
          <button class="btn btn-ghost btn-sm" onclick="clearComparator()">Clear all</button>
        </div>
      ` : ''}
      ${aiSummaryHtml}
    </div>
  `;
}

// ── AI Summary Generation ────────────────────────────────────
async function generateAiSummary() {
  const list = window.AppState.comparatorList;
  const traditions = window.AppState.traditions;
  const selected = list.map(id => traditions.find(t => t.id === id)).filter(Boolean);

  if (selected.length < 2) return;

  const btn = document.getElementById('compare-gen-btn');
  const panel = document.getElementById('compare-ai-panel');
  if (!panel) return;

  // Show loading state
  btn.disabled = true;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style="animation:spin 1s linear infinite;">
      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-dasharray="28" stroke-dashoffset="10"/>
    </svg>
    Generating scholarly comparison…
  `;

  panel.style.display = 'block';
  panel.innerHTML = `
    <div class="compare-ai-loading">
      <p style="font-size:var(--text-sm);color:var(--color-text-faint);font-style:italic;font-family:var(--font-display);">
        Analyzing ${selected.map(t => t.name).join(', ')}…
      </p>
    </div>
  `;

  try {
    const response = await fetch(`${COMPARE_API}/api/compare-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ traditions: selected }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) throw new Error(`Server responded ${response.status}`);

    const data = await response.json();
    const paragraphs = data.summary.split('\n\n').filter(p => p.trim());

    panel.innerHTML = `
      <div class="compare-ai-result">
        <div class="compare-ai-header">
          <h3 class="compare-ai-title">AI Comparative Analysis</h3>
          <span class="compare-ai-badge">AI-generated</span>
        </div>
        <div class="compare-ai-body">
          ${paragraphs.map(p => `<p>${window.escHtml(p)}</p>`).join('')}
        </div>
        <button class="btn btn-ghost btn-sm compare-ai-regen" onclick="generateAiSummary()">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M1 8a7 7 0 0113.4-2.8M15 8a7 7 0 01-13.4 2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M14.4 1v4.2h-4.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1.6 15v-4.2h4.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Regenerate
        </button>
      </div>
    `;
  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    const errorMsg = isTimeout
      ? 'The analysis is taking longer than expected. The server may be under heavy load — please try again in a moment.'
      : `Unable to generate summary. ${err.message || 'An unexpected error occurred.'}`;
    panel.innerHTML = `
      <div class="compare-ai-result compare-ai-error">
        <p style="font-size:var(--text-sm);color:var(--color-text-faint);">
          ${errorMsg}
        </p>
        <button class="btn btn-ghost btn-sm" onclick="generateAiSummary()" style="margin-top:var(--space-3);">Try again</button>
      </div>
    `;
  }

  // Restore button
  btn.disabled = false;
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
    </svg>
    Generate AI Summary
  `;
}

function clearComparator() {
  window.AppState.comparatorList = [];
  renderComparator();
}

function getFieldValue(trad, key) {
  if (key === 'ontology') {
    return Array.isArray(trad.ontology)
      ? trad.ontology.map(o => o.replace(/\(.*?\)/g, '').trim()).filter(Boolean).join('; ')
      : (trad.ontology || '');
  }
  if (key === 'functions') {
    return Array.isArray(trad.functions)
      ? trad.functions.map(f => f.replace(/\(.*?\)/g, '').trim()).filter(Boolean).join('; ')
      : (trad.functions || '');
  }
  return trad[key] || '';
}

function normalizeValue(val) {
  return String(val || '').toLowerCase().trim();
}

function formatValue(val) {
  if (!val) return '';
  const str = String(val);
  if (str === '(none)') return '';
  // Format lists with bullets
  if (str.includes('; ')) {
    const items = str.split('; ').filter(Boolean);
    if (items.length > 1) {
      return items.map(i => `<div style="margin-bottom:3px">• ${window.escHtml(i)}</div>`).join('');
    }
  }
  return window.escHtml(str);
}

// Expose
window.renderComparator    = renderComparator;
window.clearComparator     = clearComparator;
window.generateAiSummary   = generateAiSummary;
