/* ============================================================
   DREAMWARD — interpret.js
   Dream interpretation view — tradition picker, column rendering, API calls
   ============================================================ */
'use strict';

const INTERPRET_API = 'https://dreamward-production.up.railway.app';

// ─── Main View Router ───────────────────────────────────────────

function renderInterpretView() {
    const entryEl  = document.getElementById('interpret-entry');
    const pickerEl = document.getElementById('interpret-picker');
    const resultsEl = document.getElementById('interpret-results');

    if (AppState.interpretTraditions.length > 0) {
        entryEl.style.display = 'none';
        pickerEl.style.display = 'none';
        resultsEl.style.display = 'block';
        renderInterpretResults();
        return;
    }
    if (AppState.interpretDreamText && AppState.interpretMatchedIds.length > 0) {
        entryEl.style.display = 'none';
        pickerEl.style.display = 'block';
        resultsEl.style.display = 'none';
        renderInterpretPicker();
        return;
    }
    entryEl.style.display = 'block';
    pickerEl.style.display = 'none';
    resultsEl.style.display = 'none';
}

// ─── State B: Tradition Picker ───────────────────────────────────

function renderInterpretPicker() {
    const el = document.getElementById('interpret-picker');
    const dreamText = AppState.interpretDreamText;
    const dreamPreview = dreamText.length > 120 ? dreamText.slice(0, 120) + '…' : dreamText;

    const items = AppState.interpretMatchedIds.map((id, i) => {
        const trad = AppState.traditions.find(t => t.id === id);
        if (!trad) return '';
        const color = window.getClusterColor(trad.cluster);
        return `
        <button class="interpret-pick-item" onclick="selectInterpretTradition('${window.escHtml(id)}')">
            <span class="interpret-pick-rank">${i + 1}</span>
            <span class="interpret-pick-dot" style="background:${color}"></span>
            <div class="interpret-pick-info">
                <span class="interpret-pick-name">${window.escHtml(trad.name)}</span>
                <span class="interpret-pick-cluster">${window.escHtml(trad.cluster)}</span>
            </div>
            <svg class="interpret-pick-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>`;
    }).join('');

    el.innerHTML = `
    <div class="interpret-picker-inner">
        <button class="interpret-back-btn" onclick="interpretGoBack()">← New dream</button>
        <h2 class="interpret-picker-title">Choose a tradition</h2>
        <p class="interpret-picker-subtitle">Select a tradition to interpret your dream through its lens</p>
        <div class="interpret-dream-preview">
            <span class="interpret-dream-preview-label">Your dream</span>
            <p class="interpret-dream-preview-text">${window.escHtml(dreamPreview)}</p>
        </div>
        <div class="interpret-pick-list">${items}</div>
    </div>`;
}

function selectInterpretTradition(id) {
    if (AppState.interpretTraditions.includes(id)) return;
    if (AppState.interpretTraditions.length >= 3) return;
    AppState.interpretTraditions.push(id);
    AppState.interpretResults[id] = { loading: true, narrative: null, symbols: null, themes: null, questions: null, resources: null, error: null };
    renderInterpretView();
    generateInterpretation(id);
}

function interpretGoBack() {
    AppState.interpretDreamText = null;
    AppState.interpretMatchedIds = [];
    AppState.interpretTraditions = [];
    AppState.interpretResults = {};
    // Clear inner HTML of dynamic sections
    const pickerEl = document.getElementById('interpret-picker');
    const resultsEl = document.getElementById('interpret-results');
    if (pickerEl) { pickerEl.innerHTML = ''; pickerEl.style.display = 'none'; }
    if (resultsEl) { resultsEl.innerHTML = ''; resultsEl.style.display = 'none'; }
    // Show entry form directly
    const entryEl = document.getElementById('interpret-entry');
    if (entryEl) entryEl.style.display = 'block';
    // Clear textarea too
    const textarea = document.getElementById('interpret-textarea');
    if (textarea) textarea.value = '';
}

function interpretReset() {
    interpretGoBack();
}

// ─── State C: Results ────────────────────────────────────────────

function renderInterpretResults() {
    const el = document.getElementById('interpret-results');
    const dreamText = AppState.interpretDreamText;
    const colCount = AppState.interpretTraditions.length;
    const columns = AppState.interpretTraditions.map(id => renderInterpretColumn(id)).join('');

    const addColHtml = colCount < 3 ? `
        <div class="interpret-add-col">
            <button class="interpret-add-btn" onclick="interpretShowPicker()">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                Add another perspective
            </button>
        </div>` : '';

    el.innerHTML = `
    <div class="interpret-results-inner">
        <header class="interpret-results-header">
            <div class="interpret-results-header-left">
                <button class="interpret-back-btn" onclick="interpretReset()">← New dream</button>
                <h2 class="interpret-results-title">Dream Interpretation</h2>
            </div>
            <details class="interpret-dream-echo">
                <summary>Your dream</summary>
                <p>${window.escHtml(dreamText)}</p>
            </details>
        </header>
        <div class="interpret-columns interpret-columns-${colCount}">
            ${columns}
            ${addColHtml}
        </div>
    </div>`;
}

// ─── Single Column Renderer ──────────────────────────────────────

function renderInterpretColumn(traditionId) {
    const trad = AppState.traditions.find(t => t.id === traditionId);
    const result = AppState.interpretResults[traditionId];
    if (!trad || !result) return '';
    const color = window.getClusterColor(trad.cluster);
    const esc = window.escHtml;

    // LOADING STATE
    if (result.loading) {
        return `
        <div class="interpret-col" data-tradition-id="${esc(traditionId)}">
            <div class="interpret-col-header">
                <span class="interpret-col-dot" style="background:${color}"></span>
                <h3 class="interpret-col-name">${esc(trad.name)}</h3>
                <button class="interpret-col-remove" onclick="removeInterpretTradition('${esc(traditionId)}')" aria-label="Remove">&times;</button>
            </div>
            <div class="interpret-col-loading">
                <div class="interpret-loading-spinner"></div>
                <p class="interpret-loading-text">Interpreting through ${esc(window.shortCluster(trad.cluster))} lens…</p>
            </div>
        </div>`;
    }

    // ERROR STATE
    if (result.error) {
        return `
        <div class="interpret-col" data-tradition-id="${esc(traditionId)}">
            <div class="interpret-col-header">
                <span class="interpret-col-dot" style="background:${color}"></span>
                <h3 class="interpret-col-name">${esc(trad.name)}</h3>
                <button class="interpret-col-remove" onclick="removeInterpretTradition('${esc(traditionId)}')" aria-label="Remove">&times;</button>
            </div>
            <div class="interpret-col-error">
                <p>${esc(result.error)}</p>
                <button class="btn btn-ghost btn-sm" onclick="retryInterpretation('${esc(traditionId)}')">Try again</button>
            </div>
        </div>`;
    }

    // SUCCESS STATE
    const narrativeHtml = (result.narrative || '').split('\n\n').filter(p => p.trim())
        .map(p => `<p>${esc(p)}</p>`).join('');

    const symbolsHtml = (result.symbols || []).map(s => `
        <div class="interpret-symbol-item">
            <span class="interpret-symbol-name">${esc(s.symbol)}</span>
            <span class="interpret-symbol-meaning">${esc(s.meaning)}</span>
        </div>`).join('');

    const themesHtml = (result.themes || [])
        .map(t => `<span class="interpret-theme-pill">${esc(t)}</span>`).join('');

    const questionsHtml = (result.questions || [])
        .map(q => `<li class="interpret-question">${esc(q)}</li>`).join('');

    const resourcesHtml = (result.resources || []).map(r => `
        <a class="interpret-resource-link" href="${esc(r.url || '#')}" target="_blank" rel="noopener noreferrer">
            <span class="interpret-resource-type">${esc(r.type || 'Resource')}</span>
            <span class="interpret-resource-title">${esc(r.title)}</span>
        </a>`).join('');

    return `
    <div class="interpret-col" data-tradition-id="${esc(traditionId)}">
        <div class="interpret-col-header">
            <span class="interpret-col-dot" style="background:${color}"></span>
            <h3 class="interpret-col-name">${esc(trad.name)}</h3>
            <span class="interpret-ai-badge">AI-generated</span>
            <button class="interpret-col-remove" onclick="removeInterpretTradition('${esc(traditionId)}')" aria-label="Remove">&times;</button>
        </div>

        <div class="interpret-section interpret-narrative">
            <h4 class="interpret-section-heading">Interpretation</h4>
            <div class="interpret-narrative-body">${narrativeHtml}</div>
        </div>

        ${symbolsHtml ? `
        <div class="interpret-section interpret-symbols">
            <h4 class="interpret-section-heading">Key Symbols</h4>
            <div class="interpret-symbols-list">${symbolsHtml}</div>
        </div>` : ''}

        ${themesHtml ? `
        <div class="interpret-section interpret-themes">
            <h4 class="interpret-section-heading">Emotional Themes</h4>
            <div class="interpret-themes-list">${themesHtml}</div>
        </div>` : ''}

        ${questionsHtml ? `
        <div class="interpret-section interpret-questions">
            <h4 class="interpret-section-heading">Questions to Sit With</h4>
            <ul class="interpret-questions-list">${questionsHtml}</ul>
        </div>` : ''}

        ${resourcesHtml ? `
        <div class="interpret-section interpret-resources">
            <h4 class="interpret-section-heading">Learn More</h4>
            <div class="interpret-resources-list">${resourcesHtml}</div>
        </div>` : ''}

        <button class="btn btn-ghost btn-sm interpret-regen" onclick="retryInterpretation('${esc(traditionId)}')">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M1 8a7 7 0 0113.4-2.8M15 8a7 7 0 01-13.4 2.8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                <path d="M14.4 1v4.2h-4.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M1.6 15v-4.2h4.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Regenerate
        </button>
        <p class="interpret-disclaimer">This interpretation is AI-generated based on the tradition's framework. It is not clinical advice.</p>
    </div>`;
}

// ─── Add / Remove Traditions ─────────────────────────────────────

function interpretShowPicker() {
    const modal = document.getElementById('add-modal');
    const list = document.getElementById('modal-list');
    const input = document.getElementById('modal-search-input');
    window._interpretPickerMode = true;

    const available = AppState.interpretMatchedIds
        .filter(id => !AppState.interpretTraditions.includes(id));

    list.innerHTML = available.map(id => {
        const trad = AppState.traditions.find(t => t.id === id);
        if (!trad) return '';
        const color = window.getClusterColor(trad.cluster);
        return `
        <div class="modal-list-item" onclick="addInterpretTraditionFromModal('${window.escHtml(id)}')" role="listitem" tabindex="0">
            <span class="modal-list-item-dot" style="background:${color}"></span>
            <div>
                <div class="modal-list-item-name">${window.escHtml(trad.name)}</div>
                <div class="modal-list-item-cluster">${window.escHtml(trad.cluster)}</div>
            </div>
        </div>`;
    }).join('');

    document.querySelector('#add-modal .modal-title').textContent = 'Add Perspective';
    input.value = '';
    modal.classList.add('open');
    setTimeout(() => input.focus(), 50);
}

function addInterpretTraditionFromModal(id) {
    window._interpretPickerMode = false;
    window.closeAddModal();
    selectInterpretTradition(id);
}

function removeInterpretTradition(id) {
    AppState.interpretTraditions = AppState.interpretTraditions.filter(x => x !== id);
    delete AppState.interpretResults[id];
    if (AppState.interpretTraditions.length === 0) {
        renderInterpretView();
    } else {
        renderInterpretResults();
    }
}

function retryInterpretation(id) {
    AppState.interpretResults[id] = { loading: true, narrative: null, symbols: null, themes: null, questions: null, resources: null, error: null };
    renderInterpretResults();
    generateInterpretation(id);
}

// ─── Interpret Form Submit (State A → State B) ──────────────────

function handleInterpretSubmit(event) {
    event.preventDefault();
    const textarea = document.getElementById('interpret-textarea');
    const text = textarea.value.trim();
    if (!text) { textarea.focus(); return; }
    const matchResults = window.matchDreamToTraditions(text);
    AppState.interpretDreamText = text;
    AppState.interpretMatchedIds = matchResults.map(r => r.id);
    AppState.interpretTraditions = [];
    AppState.interpretResults = {};
    renderInterpretView();
}

// ─── API Call ────────────────────────────────────────────────────

async function generateInterpretation(traditionId) {
    const trad = AppState.traditions.find(t => t.id === traditionId);
    if (!trad) return;

    try {
        const response = await fetch(INTERPRET_API + '/api/interpret-dream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dream_text: AppState.interpretDreamText,
                tradition: {
                    id: trad.id,
                    name: trad.name,
                    cluster: trad.cluster,
                    epistemologyPrimary: trad.epistemologyPrimary,
                    ontology: trad.ontology,
                    functions: trad.functions,
                    agencyStyle: trad.agencyStyle,
                    keyFigures: trad.keyFigures,
                    dreamKeywords: trad.dreamKeywords
                }
            }),
            signal: AbortSignal.timeout(45000)
        });

        if (!response.ok) throw new Error('Server responded ' + response.status);
        const data = await response.json();
        const tradResources = getTopResourcesForTradition(trad, 3);

        AppState.interpretResults[traditionId] = {
            loading: false,
            error: null,
            narrative: data.narrative || '',
            symbols: data.symbols || [],
            themes: data.themes || [],
            questions: data.questions || [],
            resources: tradResources
        };
    } catch (err) {
        const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
        AppState.interpretResults[traditionId] = {
            loading: false,
            error: isTimeout
                ? 'The interpretation is taking longer than expected. Please try again.'
                : 'Unable to generate interpretation. ' + (err.message || ''),
            narrative: null, symbols: null, themes: null, questions: null, resources: null
        };
    }
    renderInterpretResults();
}

// ─── Resource Matching ───────────────────────────────────────────

function getTopResourcesForTradition(tradition, count) {
    const tradName = tradition.name.toLowerCase();
    const tradId = tradition.id;

    const matched = AppState.resources.filter(r => {
        const rTrad = (r.tradition || '').toLowerCase();
        const rTrads = (r.traditions || []).map(t => t.toLowerCase());
        return rTrad.includes(tradName) ||
               rTrads.some(t => t.includes(tradName)) ||
               rTrad.includes(tradId) ||
               rTrads.some(t => t.includes(tradId));
    });

    matched.sort((a, b) => (b.year || 0) - (a.year || 0));

    return matched.slice(0, count).map(r => ({
        title: r.title || 'Untitled',
        type: r.type || 'Resource',
        url: r.doi ? ('https://doi.org/' + r.doi)
           : r.scholarUrl ? r.scholarUrl
           : r.url ? r.url
           : '#'
    }));
}

// ─── Expose Globals ──────────────────────────────────────────────

window.renderInterpretView         = renderInterpretView;
window.handleInterpretSubmit       = handleInterpretSubmit;
window.selectInterpretTradition    = selectInterpretTradition;
window.interpretGoBack             = interpretGoBack;
window.interpretReset              = interpretReset;
window.interpretShowPicker         = interpretShowPicker;
window.addInterpretTraditionFromModal = addInterpretTraditionFromModal;
window.removeInterpretTradition    = removeInterpretTradition;
window.retryInterpretation         = retryInterpretation;
window.generateInterpretation      = generateInterpretation;
