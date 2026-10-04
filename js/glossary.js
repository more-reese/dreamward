/* ============================================================
   DREAMWARD — glossary.js
   Glossary view: searchable, sectioned term definitions
   ============================================================ */

'use strict';

// ── State ────────────────────────────────────────────────────
const GlossaryState = {
  search: '',
  activeSection: null,
  activeLetter: null,
};

// ── Match tradition name to traditions.json ──────────────────
function matchTradition(tradName) {
  const traditions = window.AppState.traditions;
  if (!traditions || !tradName) return null;

  const lowerName = tradName.toLowerCase().trim();

  // "All" → special case
  if (lowerName === 'all') return { type: 'all' };

  // Exact match
  let match = traditions.find(t => t.name.toLowerCase() === lowerName);
  if (match) return { type: 'match', id: match.id, name: match.name, cluster: match.cluster };

  // Partial match: tradition name contains glossary string or vice versa
  match = traditions.find(t => {
    const tLower = t.name.toLowerCase();
    return tLower.includes(lowerName) || lowerName.includes(tLower);
  });
  if (match) return { type: 'match', id: match.id, name: match.name, cluster: match.cluster };

  // Try matching on first word (at least 4 chars)
  const firstWord = lowerName.split(/[\s/(]/)[0];
  if (firstWord.length >= 4) {
    match = traditions.find(t => t.name.toLowerCase().includes(firstWord));
    if (match) return { type: 'match', id: match.id, name: match.name, cluster: match.cluster };
  }

  return null;
}

// ── Get unique sections from glossary data ───────────────────
function getGlossarySections() {
  const glossary = window.AppState.glossary;
  const sectionMap = {};
  glossary.forEach(term => {
    const sec = term.section || 'Uncategorized';
    if (!sectionMap[sec]) sectionMap[sec] = 0;
    sectionMap[sec]++;
  });
  return sectionMap;
}

// ── Filter glossary terms ────────────────────────────────────
function getFilteredGlossary() {
  const glossary = window.AppState.glossary;
  const { search, activeSection, activeLetter } = GlossaryState;
  const q = search.trim().toLowerCase();

  let results = glossary.filter(term => {
    // Section filter
    if (activeSection && term.section !== activeSection) return false;

    // Letter filter
    if (activeLetter) {
      const firstChar = (term.term || '').charAt(0).toUpperCase();
      if (firstChar !== activeLetter) return false;
    }

    // Search filter
    if (q) {
      const inTerm = (term.term || '').toLowerCase().includes(q);
      const inDef = (term.definition || '').toLowerCase().includes(q);
      const inNotes = (term.notes || '').toLowerCase().includes(q);
      const inTraditions = (term.traditions || []).some(t =>
        (typeof t === 'string' ? t : '').toLowerCase().includes(q)
      );
      if (!inTerm && !inDef && !inNotes && !inTraditions) return false;
    }

    return true;
  });

  // Sort exact term-name matches first when searching
  if (q) {
    results.sort((a, b) => {
      const aExact = (a.term || '').toLowerCase() === q ? 0 : 1;
      const bExact = (b.term || '').toLowerCase() === q ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      // Then prefer term-name contains over body-only matches
      const aInTerm = (a.term || '').toLowerCase().includes(q) ? 0 : 1;
      const bInTerm = (b.term || '').toLowerCase().includes(q) ? 0 : 1;
      return aInTerm - bInTerm;
    });
  }

  return results;
}

// ── Render Glossary View ─────────────────────────────────────
function renderGlossary() {
  const glossary = window.AppState.glossary;
  if (!glossary || glossary.length === 0) {
    setTimeout(renderGlossary, 100);
    return;
  }

  renderGlossarySidebar();
  renderGlossaryAlphaBar();
  _renderGlossaryContent();
}

// ── Render Sidebar ───────────────────────────────────────────
function renderGlossarySidebar() {
  const sidebar = document.getElementById('glossary-sidebar');
  if (!sidebar) return;

  const sections = getGlossarySections();
  const sectionKeys = Object.keys(sections);

  // Group tradition-specific sub-sections
  const coreSections = sectionKeys.filter(s => !s.startsWith('Tradition-specific:') && s !== 'Tradition-specific');
  const tradSpecific = sectionKeys.filter(s => s.startsWith('Tradition-specific:'));
  const hasGenericTradSpecific = sectionKeys.includes('Tradition-specific');

  let html = `<p class="glossary-sidebar-title">Sections</p>`;

  // "All" button
  html += `
    <button class="glossary-sidebar-section-btn${!GlossaryState.activeSection ? ' active' : ''}"
      onclick="glossaryFilterSection(null)">
      All terms
      <span class="glossary-sidebar-section-count">${window.AppState.glossary.length}</span>
    </button>
  `;

  // Core sections
  coreSections.forEach(sec => {
    html += `
      <button class="glossary-sidebar-section-btn${GlossaryState.activeSection === sec ? ' active' : ''}"
        onclick="glossaryFilterSection('${escGlossaryAttr(sec)}')">
        ${escGlossaryHtml(sec)}
        <span class="glossary-sidebar-section-count">${sections[sec]}</span>
      </button>
    `;
  });

  // Generic Tradition-specific
  if (hasGenericTradSpecific) {
    html += `
      <button class="glossary-sidebar-section-btn${GlossaryState.activeSection === 'Tradition-specific' ? ' active' : ''}"
        onclick="glossaryFilterSection('Tradition-specific')">
        Tradition-specific
        <span class="glossary-sidebar-section-count">${sections['Tradition-specific']}</span>
      </button>
    `;
  }

  // Tradition-specific sub-sections (collapsible)
  if (tradSpecific.length > 0) {
    const tradSubTotal = tradSpecific.reduce((sum, s) => sum + sections[s], 0);
    html += `
      <div class="glossary-sidebar-section">
        <button class="glossary-sidebar-section-btn expanded" onclick="toggleGlossarySidebarSub(this)">
          <span class="glossary-sidebar-section-arrow">\u25B6</span>
          Tradition-specific
          <span class="glossary-sidebar-section-count">${tradSubTotal}</span>
        </button>
        <div class="glossary-sidebar-sub-items open">
          ${tradSpecific.map(sec => {
            const label = sec.replace('Tradition-specific: ', '');
            return `
              <button class="glossary-sidebar-sub-item${GlossaryState.activeSection === sec ? ' active' : ''}"
                onclick="glossaryFilterSection('${escGlossaryAttr(sec)}')"
                style="${GlossaryState.activeSection === sec ? 'color:var(--color-primary);' : ''}">
                ${escGlossaryHtml(label)}
                <span style="margin-left:auto;font-size:10px;color:var(--color-text-faint);">${sections[sec]}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  sidebar.innerHTML = html;
}

function toggleGlossarySidebarSub(btn) {
  btn.classList.toggle('expanded');
  const subItems = btn.nextElementSibling;
  if (subItems) subItems.classList.toggle('open');
}

// ── Render Alpha Bar ─────────────────────────────────────────
function renderGlossaryAlphaBar() {
  const bar = document.getElementById('glossary-alpha-bar');
  if (!bar) return;

  const glossary = window.AppState.glossary;
  const letters = new Set(glossary.map(t => (t.term || '').charAt(0).toUpperCase()));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  bar.innerHTML = alphabet.map(letter => {
    const exists = letters.has(letter);
    const isActive = GlossaryState.activeLetter === letter;
    return `
      <button class="glossary-alpha-link${isActive ? ' active' : ''}${!exists ? ' disabled' : ''}"
        onclick="glossaryFilterLetter('${letter}')"
        ${!exists ? 'disabled' : ''}>
        ${letter}
      </button>
    `;
  }).join('') + `
    <button class="glossary-alpha-link${!GlossaryState.activeLetter ? ' active' : ''}"
      onclick="glossaryFilterLetter(null)"
      style="width:auto;padding:0 var(--space-2);">
      All
    </button>
  `;
}

// ── Render Content ───────────────────────────────────────────
function _renderGlossaryContent() {
  const content = document.getElementById('glossary-content');
  if (!content) return;

  const filtered = getFilteredGlossary();

  if (filtered.length === 0) {
    content.innerHTML = `
      <div class="glossary-empty">
        <p class="glossary-empty-text">No terms match your search or filter.</p>
      </div>
    `;
    return;
  }

  // Group by section
  const groups = {};
  filtered.forEach(term => {
    const sec = term.section || 'Uncategorized';
    if (!groups[sec]) groups[sec] = [];
    groups[sec].push(term);
  });

  // Sort terms alphabetically within each group
  Object.values(groups).forEach(arr => arr.sort((a, b) => (a.term || '').localeCompare(b.term || '')));

  const html = Object.entries(groups).map(([section, terms]) => `
    <h2 class="glossary-section-heading" id="glossary-sec-${slugify(section)}">${escGlossaryHtml(section)}</h2>
    ${terms.map(term => renderGlossaryTermCard(term)).join('')}
  `).join('');

  content.innerHTML = `
    <p class="glossary-count">${filtered.length} term${filtered.length !== 1 ? 's' : ''}</p>
    ${html}
  `;
}

// ── Render single term card ──────────────────────────────────
function renderGlossaryTermCard(term) {
  const traditions = term.traditions || [];
  const cardId = `glossary-term-${term.id}`;

  const tradTags = traditions.map(tradName => {
    if (typeof tradName !== 'string') return '';
    const matched = matchTradition(tradName);

    if (matched && matched.type === 'all') {
      return `<span class="glossary-tradition-tag glossary-tradition-tag--all">All traditions</span>`;
    }

    if (matched && matched.type === 'match') {
      const color = window.getClusterColor(matched.cluster);
      return `
        <button class="glossary-tradition-tag glossary-tradition-tag--link"
          onclick="window.navigateTo('profile', '${matched.id}')"
          title="View ${escGlossaryAttr(matched.name)} profile">
          <span class="glossary-tradition-dot" style="background:${color}"></span>
          ${escGlossaryHtml(tradName)}
        </button>
      `;
    }

    // No match — plain tag
    return `<span class="glossary-tradition-tag">${escGlossaryHtml(tradName)}</span>`;
  }).filter(Boolean).join('');

  const notesHtml = term.notes ? `
    <div class="glossary-notes">
      <button class="glossary-notes-toggle" onclick="toggleGlossaryNotes('${term.id}')">
        <span class="glossary-notes-toggle-arrow" id="glossary-notes-arrow-${term.id}">\u25B6</span>
        Notes &amp; Disputes
      </button>
      <div class="glossary-notes-content" id="glossary-notes-${term.id}">
        <p class="glossary-notes-text">${escGlossaryHtml(term.notes)}</p>
      </div>
    </div>
  ` : '';

  return `
    <div class="glossary-term-card" id="${cardId}">
      <h3 class="glossary-term-name">${escGlossaryHtml(term.term)}</h3>
      <p class="glossary-term-def">${escGlossaryHtml(term.definition)}</p>
      ${tradTags ? `<div class="glossary-traditions">${tradTags}</div>` : ''}
      ${notesHtml}
    </div>
  `;
}

// ── Toggle notes ─────────────────────────────────────────────
function toggleGlossaryNotes(termId) {
  const content = document.getElementById(`glossary-notes-${termId}`);
  const arrow = document.getElementById(`glossary-notes-arrow-${termId}`);
  const btn = arrow ? arrow.closest('.glossary-notes-toggle') : null;
  if (content) content.classList.toggle('open');
  if (btn) btn.classList.toggle('open');
}

// ── Event handlers ───────────────────────────────────────────
function glossarySetSearch(val) {
  GlossaryState.search = val;
  _renderGlossaryContent();
}

function glossaryFilterSection(section) {
  GlossaryState.activeSection = section;
  GlossaryState.activeLetter = null;
  renderGlossarySidebar();
  renderGlossaryAlphaBar();
  _renderGlossaryContent();
}

function glossaryFilterLetter(letter) {
  GlossaryState.activeLetter = letter;
  renderGlossaryAlphaBar();
  _renderGlossaryContent();
}

// ── Utilities ────────────────────────────────────────────────
function escGlossaryHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escGlossaryAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, "\\'");
}

function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Expose
window.renderGlossary       = renderGlossary;
window.glossarySetSearch     = glossarySetSearch;
window.glossaryFilterSection = glossaryFilterSection;
window.glossaryFilterLetter  = glossaryFilterLetter;
window.toggleGlossaryNotes   = toggleGlossaryNotes;
window.toggleGlossarySidebarSub = toggleGlossarySidebarSub;
