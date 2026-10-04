/* ============================================================
   DREAMWARD — profile view (embedded in main.js context)
   Renders the full tradition profile view
   ============================================================ */

'use strict';

// Generate extended rationale for profile page (richer than sidebar one-liner)
function generateExtendedRationale(tradition, matchDetails) {
  const { matchedKeywords, dreamTokensMatched } = matchDetails;
  const ontology = Array.isArray(tradition.ontology)
    ? tradition.ontology[0] : (tradition.ontology || '');
  const funcArr = Array.isArray(tradition.functions)
    ? tradition.functions : (tradition.functions || '').split(',');
  const func = funcArr[0] ? funcArr[0].replace(/\(.*?\)/g, '').trim() : '';
  const agency = tradition.agencyStyle;
  const dreamWords = dreamTokensMatched.slice(0, 4).map(w => '\u201c' + w + '\u201d').join(', ');
  const tradWords = matchedKeywords.slice(0, 4).join(', ');

  let text = `Your dream elements \u2014 ${dreamWords} \u2014 activated this tradition\u2019s keyword signature around ${tradWords}. `;
  text += `${tradition.name} understands dreams as ${ontology.toLowerCase()}`;
  if (func) {
    text += `, with a primary function of ${func.toLowerCase()}`;
  }
  text += '. ';
  if (agency && agency !== 'none' && agency !== 'Neither') {
    text += `In this framework, the dreamer\u2019s role is to ${agency.toLowerCase()}. `;
  }
  text += 'The connection is based on keyword and thematic overlap \u2014 it is a heuristic starting point for exploration, not a clinical interpretation.';

  return text;
}

function renderProfile(traditionId) {
  const traditions = window.AppState.traditions;
  const resources  = window.AppState.resources;

  const trad = traditions.find(t => t.id === traditionId);
  if (!trad) {
    document.getElementById('profile-content').innerHTML = `
      <div style="padding:var(--space-16);text-align:center;color:var(--color-text-faint);">
        Tradition not found.
      </div>
    `;
    return;
  }

  const color      = window.getClusterColor(trad.cluster);
  const clsCls     = window.getClusterClass(trad.cluster);
  const tradResources = resources.filter(r =>
    r.traditions && r.traditions.some(name =>
      name.toLowerCase().includes(trad.name.toLowerCase().split(' ')[0]) ||
      trad.name.toLowerCase().includes(name.toLowerCase().split(' ')[0])
    )
  ).slice(0, 8);

  // Synthesize "The Concept" paragraph
  const ontologyList = Array.isArray(trad.ontology)
    ? trad.ontology.map(o => o.replace(/\(.*?\)/g, '').trim()).filter(Boolean)
    : [trad.ontology];

  const functionsList = Array.isArray(trad.functions)
    ? trad.functions.map(f => f.replace(/\(.*?\)/g, '').trim()).filter(Boolean)
    : [trad.functions];

  const conceptPara = buildConceptParagraph(trad, ontologyList, functionsList);
  const contextPara = buildContextParagraph(trad);

  // Source note with Flag: highlighted (escape first, then add markup)
  const sourceNoteHtml = escHtml(trad.sourceNotes || '')
    .replace(/Flag:/g, '<span class="bias-flag">Flag:</span>');

  const keyFiguresHtml = (trad.keyFigures || []).map(kf => `
    <div class="profile-key-figure">${escHtml(kf)}</div>
  `).join('');

  const resourcesHtml = tradResources.length > 0
    ? tradResources.map(r => buildResourceHtml(r)).join('')
    : `<p style="font-size:var(--text-sm);color:var(--color-text-faint);font-style:italic;">No resources catalogued for this tradition yet.</p>`;

  const tagsHtml = [
    trad.epistemologyPrimary,
    ...(trad.epistemologySecondary && trad.epistemologySecondary !== '(none)' ? [trad.epistemologySecondary] : []),
    trad.agencyStyle,
    trad.period,
  ].filter(Boolean).map(tag =>
    `<span class="profile-tag">${escHtml(tag)}</span>`
  ).join('');

  document.getElementById('profile-content').innerHTML = `
    <div class="profile-inner">
      <!-- Left column -->
      <div class="profile-main">
        <button class="profile-back-btn" onclick="history.back()" aria-label="Go back">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Back
        </button>

        <div class="profile-cluster-badge ${clsCls}">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>
          ${escHtml(trad.cluster)}
          ${trad.entryType === 'Provocation'
            ? `<span class="badge badge-type" style="margin-left:var(--space-2)">Provocation</span>`
            : ''}
        </div>

        <h1 class="profile-name">${escHtml(trad.name)}</h1>
        <div class="profile-tags">${tagsHtml}</div>

        ${buildDreamLensHtml(trad, traditionId)}

        <!-- The Concept -->
        <section class="profile-section" aria-label="The Concept">
          <h2 class="profile-section-heading">The Concept</h2>
          <div class="profile-prose">
            ${conceptPara}
          </div>
        </section>

        <!-- Contextual Reading -->
        <section class="profile-section" aria-label="Contextual Reading">
          <h2 class="profile-section-heading">Contextual Reading</h2>
          <div class="profile-prose">
            ${contextPara}
          </div>
        </section>

        ${keyFiguresHtml ? `
        <!-- Key Figures & Texts -->
        <section class="profile-section" aria-label="Key Figures and Texts">
          <h2 class="profile-section-heading">Key Figures &amp; Texts</h2>
          <div class="profile-key-figures">${keyFiguresHtml}</div>
        </section>
        ` : ''}

        ${trad.sourceNotes ? `
        <!-- Source Notes -->
        <section class="profile-section" aria-label="Source Notes">
          <h2 class="profile-section-heading">Source Notes</h2>
          <p class="profile-source-note">${sourceNoteHtml}</p>
        </section>
        ` : ''}

        <!-- Resources -->
        <section class="profile-section" aria-label="Resources">
          <h2 class="profile-section-heading">Resources</h2>
          <div class="profile-resources">${resourcesHtml}</div>
        </section>
      </div>

      <!-- Right sidebar -->
      <aside class="profile-sidebar" aria-label="Metadata">
        <div class="sidebar-meta-card">
          <p class="sidebar-meta-title">Metadata</p>
          ${buildSidebarMeta(trad)}
        </div>

        <div class="sidebar-actions">
          <button class="btn btn-outline-gold" style="width:100%;justify-content:center;"
            onclick="addToComparator('${trad.id}'); showToast('Added to comparator')">
            Add to Comparator
          </button>
          <button class="btn btn-ghost" style="width:100%;justify-content:center;"
            onclick="viewInGraph('${trad.id}')">
            View in graph
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </aside>
    </div>
  `;
}

function viewInGraph(traditionId) {
  window.navigateTo('graph');
  setTimeout(() => {
    const matches = [{ id: traditionId, name: '', score: 99 }];
    if (window.graphApplyDreamMatch) window.graphApplyDreamMatch(matches);
  }, 300);
}

function buildSidebarMeta(trad) {
  const rows = [
    ['Entry Type',       trad.entryType || 'Tradition'],
    ['Cluster',          trad.cluster],
    ['Epistemology',     trad.epistemologyPrimary],
    ['Epistemology 2',   trad.epistemologySecondary !== '(none)' ? trad.epistemologySecondary : null],
    ['Agency Style',     trad.agencyStyle],
    ['Period',           trad.period],
    ['Region',           trad.region],
    ['Institutional Home', trad.institutionalHome],
  ].filter(r => r[1]);

  return rows.map(([key, val]) => `
    <div class="sidebar-meta-row">
      <span class="sidebar-meta-key">${escHtml(key)}</span>
      <span class="sidebar-meta-value">${escHtml(val)}</span>
    </div>
  `).join('');
}

function buildConceptParagraph(trad, ontologyList, functionsList) {
  const onto  = ontologyList.join(', ').toLowerCase();
  const funcs = functionsList.slice(0, 2).join(' and ').toLowerCase();

  // Construct a synthetic synthesis paragraph
  const epi = trad.epistemologyPrimary.toLowerCase();

  let para = `In this tradition, the dream is understood as `;
  if (ontologyList.length === 1) {
    para += `a <em>${escHtml(ontologyList[0])}</em>`;
  } else if (ontologyList.length >= 2) {
    para += `both a <em>${escHtml(ontologyList[0])}</em> and a <em>${escHtml(ontologyList[1])}</em>`;
  }
  para += `. `;

  para += `The approach is fundamentally <em>${escHtml(trad.epistemologyPrimary)}</em>, `;
  para += `treating dream experience as a site for <em>${escHtml(functionsList[0] || 'inquiry')}</em>. `;

  if (functionsList.length > 1) {
    const extraFuncs = functionsList.slice(1, 3).map(f => `<em>${escHtml(f)}</em>`).join(' and ');
    para += `Beyond this primary function, the tradition also addresses ${extraFuncs}.`;
  }

  return `<p>${para}</p>`;
}

function buildContextParagraph(trad) {
  let para = `Emerging from <em>${escHtml(trad.region)}</em> during the <em>${escHtml(trad.period)}</em> period, `;
  para += `${escHtml(trad.name)} belongs to the broader tradition of `;
  para += `<em>${escHtml(trad.cluster)}</em>. `;

  para += `Within this lineage, dreams are approached through an epistemology best characterized as `;
  para += `<em>${escHtml(trad.epistemologyPrimary)}</em>`;
  if (trad.epistemologySecondary && trad.epistemologySecondary !== '(none)') {
    para += `, with secondary resonances in <em>${escHtml(trad.epistemologySecondary)}</em>`;
  }
  para += `. `;

  para += `The dreamer's agency is understood as `;
  para += `<em>${escHtml(trad.agencyStyle)}</em>`;
  if (trad.agencyNotes) {
    para += ` — ${escHtml(trad.agencyNotes)}`;
  }
  para += `. `;

  if (trad.institutionalHome) {
    para += `This tradition has typically been housed in or developed through <em>${escHtml(trad.institutionalHome)}</em>.`;
  }

  return `<p>${para}</p>`;
}

function buildResourceHtml(r) {
  const authors = Array.isArray(r.authors) ? r.authors.join(', ') : (r.authors || '');
  const shortAuthors = authors.length > 80 ? authors.slice(0, 78) + '…' : authors;

  // Build link: DOI → direct URL → Google Scholar fallback
  let url = '';
  let linkLabel = '';
  if (r.doi) {
    url = r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`;
    linkLabel = 'DOI';
  } else if (r.url) {
    url = r.url;
    linkLabel = 'Source';
  }
  const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(r.title || '')}`;

  const titleHtml = url
    ? `<a href="${url}" target="_blank" rel="noopener noreferrer" class="resource-item-title" style="color:var(--color-text);text-decoration:underline;text-decoration-color:var(--color-border-strong);">${escHtml(r.title)}</a>`
    : `<a href="${scholarUrl}" target="_blank" rel="noopener noreferrer" class="resource-item-title" style="color:var(--color-text);text-decoration:underline;text-decoration-color:var(--color-border);text-decoration-style:dashed;">${escHtml(r.title)}</a>`;

  const accessColor = r.access === 'Open access' ? 'var(--cluster-sage)' : 'var(--color-text-faint)';

  // Link badges row
  const linkBadges = [];
  if (r.doi) {
    const doiUrl = r.doi.startsWith('http') ? r.doi : `https://doi.org/${r.doi}`;
    linkBadges.push(`<a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="resource-link-badge resource-link-badge--doi" title="Open via DOI">DOI</a>`);
  }
  if (r.url && r.doi) {
    linkBadges.push(`<a href="${r.url}" target="_blank" rel="noopener noreferrer" class="resource-link-badge" title="Direct link">Source</a>`);
  }
  linkBadges.push(`<a href="${scholarUrl}" target="_blank" rel="noopener noreferrer" class="resource-link-badge resource-link-badge--scholar" title="Find on Google Scholar">Scholar</a>`);

  return `
    <div class="resource-item">
      ${titleHtml}
      <div class="resource-item-meta">
        <span class="resource-type-badge">${escHtml(r.resourceType || '')}</span>
        ${r.year ? `<span>${escHtml(r.year)}</span>` : ''}
        ${shortAuthors ? `<span>${escHtml(shortAuthors)}</span>` : ''}
        ${r.access ? `<span style="color:${accessColor}">${escHtml(r.access)}</span>` : ''}
      </div>
      <div class="resource-item-links">${linkBadges.join('')}</div>
    </div>
  `;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDreamLensHtml(trad, traditionId) {
  const state = window.AppState;
  if (!state.dreamText || !state.dreamMatchDetails || !state.dreamMatchDetails[traditionId]) {
    return '';
  }

  const matchDetail = state.dreamMatchDetails[traditionId];
  const rank = state.dreamMatchIds.indexOf(traditionId) + 1;
  const total = state.dreamMatchIds.length;
  const rationale = generateExtendedRationale(trad, matchDetail);

  const dreamPills = (matchDetail.dreamTokensMatched || [])
    .map(w => `<span>${escHtml(w)}</span>`).join('');
  const tradPills = (matchDetail.matchedKeywords || [])
    .map(w => `<span>${escHtml(w)}</span>`).join('');

  return `
    <section class="profile-section dream-lens-section">
      <div class="dream-lens-card">
        <h3 class="dream-lens-heading">Your Dream Through This Lens</h3>
        <p class="dream-lens-rank">
          Ranked <strong>#${rank}</strong> of ${total} resonant traditions
        </p>
        <div class="dream-lens-body">
          <p class="dream-lens-rationale">${escHtml(rationale)}</p>
          <div class="dream-lens-keywords">
            <div class="dream-lens-kw-group">
              <span class="dream-lens-kw-label">From your dream</span>
              <div class="dream-lens-kw-pills">${dreamPills}</div>
            </div>
            <span class="dream-lens-arrow">\u2192</span>
            <div class="dream-lens-kw-group">
              <span class="dream-lens-kw-label">Tradition concepts activated</span>
              <div class="dream-lens-kw-pills">${tradPills}</div>
            </div>
          </div>
        </div>
        <details class="dream-lens-dream-echo">
          <summary>Your dream text</summary>
          <p>${escHtml(state.dreamText)}</p>
        </details>
        <button class="btn btn-ghost btn-sm dream-lens-dismiss" onclick="clearDreamLens()">
          Dismiss
        </button>
      </div>
    </section>`;
}

// Expose
window.renderProfile = renderProfile;
window.viewInGraph   = viewInGraph;
window.escHtml       = escHtml;
