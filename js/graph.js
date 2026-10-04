/* ============================================================
   DREAMWARD — graph.js
   D3 v7 force-directed graph of dream traditions
   ============================================================ */

'use strict';

let graphSim    = null;
let graphZoom   = null;
let activeFilters = new Set(Object.keys(window.CLUSTER_COLOR || {}));

function initGraph() {
  const traditions = window.AppState.traditions;
  if (!traditions || traditions.length === 0) {
    setTimeout(initGraph, 100);
    return;
  }

  window.AppState.graphInitialized = true;

  // Populate cluster filters
  populateClusterFilters();

  // Build graph
  buildGraph();
}

function getGraphDimensions() {
  const svg = document.getElementById('graph-svg');
  const rect = svg.getBoundingClientRect();
  return { width: rect.width || window.innerWidth, height: rect.height || window.innerHeight - 52 };
}

// ── Build Graph ──────────────────────────────────────────────
function buildGraph() {
  const traditions = window.AppState.traditions;
  const { width, height } = getGraphDimensions();

  const svg = d3.select('#graph-svg');
  svg.attr('viewBox', `0 0 ${width} ${height}`);

  const root = svg.select('#graph-root');
  root.selectAll('*').remove();

  // ── Edges: shared cluster, epistemology, agency ─────────
  const edges = buildEdges(traditions);

  // ── Force Simulation ─────────────────────────────────────
  const nodes = traditions.map(t => ({
    id:          t.id,
    name:        t.name,
    cluster:     t.cluster,
    entryType:   t.entryType || 'Tradition',
    epistemology: t.epistemologyPrimary,
    agency:      t.agencyStyle,
    period:      t.period,
    region:      t.region,
    ontology:    t.ontology,
    color:       window.getClusterColor(t.cluster),
    radius:      t.entryType === 'Provocation' ? 9 : 13,
  }));

  graphSim = d3.forceSimulation(nodes)
    .force('link',   d3.forceLink(edges).id(d => d.id).distance(90).strength(0.25))
    .force('charge', d3.forceManyBody().strength(-220))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collide', d3.forceCollide().radius(d => d.radius + 18).strength(0.7))
    .force('x',      d3.forceX(width / 2).strength(0.05))
    .force('y',      d3.forceY(height / 2).strength(0.05))
    .alphaDecay(0.025);

  // ── Edge Layer ────────────────────────────────────────────
  const edgeLayer = root.append('g').attr('class', 'edges');
  const edgeSel = edgeLayer.selectAll('.edge')
    .data(edges)
    .join('line')
    .attr('class', d => `edge edge-${d.type}`)
    .attr('stroke', d => {
      if (d.type === 'cluster') return d.color;
      if (d.type === 'epistemology') return 'rgba(255,255,255,0.18)';
      return 'rgba(255,255,255,0.12)';
    })
    .attr('stroke-width', d => d.type === 'cluster' ? 1 : 0.75)
    .attr('stroke-dasharray', d => d.type === 'agency' ? '3 5' : null)
    .attr('stroke-opacity', d => d.type === 'cluster' ? 0.25 : 0.15);

  // ── Node Layer ────────────────────────────────────────────
  const nodeLayer = root.append('g').attr('class', 'nodes');
  const nodeSel = nodeLayer.selectAll('.node')
    .data(nodes, d => d.id)
    .join('g')
    .attr('class', 'node')
    .attr('id', d => `node-${d.id}`)
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', dragStart)
      .on('drag',  dragged)
      .on('end',   dragEnd)
    )
    .on('mouseenter', function(event, d) {
      if (!window.isTouchDevice || !window.isTouchDevice()) {
        window.showHoverCard(d.id, event.clientX, event.clientY);
      }
    })
    .on('mousemove', function(event, d) {
      if (!window.isTouchDevice || !window.isTouchDevice()) {
        window.showHoverCard(d.id, event.clientX, event.clientY);
      }
    })
    .on('mouseleave', function() {
      if (!window.isTouchDevice || !window.isTouchDevice()) {
        window.hideHoverCard();
      }
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      window.navigateTo('profile', d.id);
    });

  // Shapes: Tradition = circle, Provocation = diamond
  nodeSel.each(function(d) {
    const el = d3.select(this);
    if (d.entryType === 'Provocation') {
      const s = d.radius * 1.3;
      el.append('polygon')
        .attr('points', `0,${-s} ${s},0 0,${s} ${-s},0`)
        .attr('fill', d.color)
        .attr('fill-opacity', 0.65)
        .attr('stroke', d.color)
        .attr('stroke-width', 1);
    } else {
      el.append('circle')
        .attr('r', d.radius)
        .attr('fill', d.color)
        .attr('fill-opacity', 0.65)
        .attr('stroke', d.color)
        .attr('stroke-width', 1);
    }
  });

  // Labels
  nodeSel.append('text')
    .text(d => d.name.split(/[\/(]/)[0].trim())
    .attr('x', d => d.radius + 6)
    .attr('y', 1)
    .attr('class', 'node-label')
    .style('font-family', 'Inter, system-ui, sans-serif')
    .style('font-size', '11px')
    .style('fill', 'rgba(232,227,217,0.65)')
    .style('pointer-events', 'none');

  // ── Zoom ──────────────────────────────────────────────────
  graphZoom = d3.zoom()
    .scaleExtent([0.2, 3])
    .on('zoom', ({ transform }) => {
      root.attr('transform', transform);
      // Show/hide labels based on zoom
      const z = transform.k;
      nodeLayer.selectAll('.node-label')
        .style('opacity', z >= 0.7 ? 1 : 0);
    });

  svg.call(graphZoom);
  svg.on('click', function(event) {
    if (event.target === svg.node()) {
      window.hideHoverCard(true);
    }
  });

  // ── Tick ──────────────────────────────────────────────────
  graphSim.on('tick', () => {
    edgeSel
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Update count
  updateGraphCount(nodes.length, edges.length);
}

// ── Edge Builder ─────────────────────────────────────────────
function buildEdges(traditions) {
  const edges = [];
  const edgeCounts = {};

  function addEdge(aId, bId, type, color) {
    const key = [aId, bId].sort().join('--') + '--' + type;
    if (edgeCounts[key]) return;
    edgeCounts[aId] = (edgeCounts[aId] || 0) + 1;
    edgeCounts[bId] = (edgeCounts[bId] || 0) + 1;
    if (edgeCounts[aId] > 6 || edgeCounts[bId] > 6) return;
    edgeCounts[key] = true;
    edges.push({ source: aId, target: bId, type, color });
  }

  for (let i = 0; i < traditions.length; i++) {
    for (let j = i + 1; j < traditions.length; j++) {
      const a = traditions[i];
      const b = traditions[j];
      if (a.cluster === b.cluster) {
        addEdge(a.id, b.id, 'cluster', window.getClusterColor(a.cluster));
      } else if (a.epistemologyPrimary === b.epistemologyPrimary) {
        addEdge(a.id, b.id, 'epistemology', '#fff');
      } else if (a.agencyStyle === b.agencyStyle && a.agencyStyle !== 'Neither' && a.agencyStyle !== 'Observe') {
        addEdge(a.id, b.id, 'agency', '#fff');
      }
    }
  }
  return edges;
}

// ── Drag Handlers ────────────────────────────────────────────
function dragStart(event, d) {
  if (!event.active) graphSim.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(event, d) {
  d.fx = event.x;
  d.fy = event.y;
}

function dragEnd(event, d) {
  if (!event.active) graphSim.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// ── Controls ─────────────────────────────────────────────────
function graphGroupBy(value) {
  if (!graphSim) return;
  // Re-cluster forces based on grouping
  const traditions = window.AppState.traditions;
  const { width, height } = getGraphDimensions();

  if (value === 'cluster') {
    graphSim
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));
  } else if (value === 'epistemology') {
    const epiValues = [...new Set(traditions.map(t => t.epistemologyPrimary))];
    graphSim
      .force('x', d3.forceX(d => {
        const idx = epiValues.indexOf(d.epistemology);
        return 100 + (idx / (epiValues.length - 1)) * (width - 200);
      }).strength(0.15))
      .force('y', d3.forceY(height / 2).strength(0.05));
  } else if (value === 'agency') {
    const agencyVals = [...new Set(traditions.map(t => t.agencyStyle))];
    graphSim
      .force('y', d3.forceY(d => {
        const idx = agencyVals.indexOf(d.agency);
        return 80 + (idx / Math.max(agencyVals.length - 1, 1)) * (height - 160);
      }).strength(0.15))
      .force('x', d3.forceX(width / 2).strength(0.05));
  }

  graphSim.alpha(0.4).restart();
}

function graphToggleEdges(show) {
  d3.selectAll('.edge').style('opacity', show ? 1 : 0);
}

function graphReset() {
  if (!graphZoom) return;
  const svg = d3.select('#graph-svg');
  const { width, height } = getGraphDimensions();
  svg.transition().duration(500).call(
    graphZoom.transform,
    d3.zoomIdentity.translate(0, 0).scale(1)
  );
  clearDreamMatch();
}

// ── Dream Match Highlight ────────────────────────────────────
function graphApplyDreamMatch(matches) {
  const matchIds = new Set(matches.map(m => m.id));

  // Highlight matched, dim others
  d3.selectAll('.node').each(function(d) {
    const el = d3.select(this);
    if (matchIds.has(d.id)) {
      el.classed('highlighted', true).classed('dimmed', false);
      el.select('circle,polygon')
        .attr('r', d.entryType !== 'Provocation' ? d.radius * 1.5 : null)
        .attr('fill-opacity', 1)
        .attr('stroke-width', 2.5)
        .attr('filter', 'drop-shadow(0 0 8px currentColor)');
    } else {
      el.classed('dimmed', true).classed('highlighted', false);
      el.select('circle,polygon').attr('fill-opacity', 0.2);
    }
  });

  d3.selectAll('.edge').attr('stroke-opacity', 0.04);

  // Show match panel
  const panel = document.getElementById('match-results');
  panel.style.display = 'block';

  // Update subtitle
  const subtitle = document.getElementById('match-results-subtitle');
  if (subtitle) subtitle.textContent = 'Why these traditions resonate with your dream';

  // Dream echo (collapsible dream text)
  const dreamEchoEl = document.getElementById('match-dream-echo');
  if (dreamEchoEl) {
    if (window.AppState.dreamText) {
      dreamEchoEl.innerHTML = `
        <details class="match-dream-echo">
          <summary>Your dream</summary>
          <p class="match-dream-text">${escapeHtml(window.AppState.dreamText)}</p>
        </details>`;
    } else {
      dreamEchoEl.innerHTML = '';
    }
  }

  const list = document.getElementById('match-results-list');
  list.innerHTML = matches.map((m, i) => {
    const trad = window.AppState.traditions.find(t => t.id === m.id);
    const color = window.getClusterColor(trad ? trad.cluster : '');
    const keywords = m.matchedKeywords || [];
    const detail = window.AppState.dreamMatchDetails ? window.AppState.dreamMatchDetails[m.id] : null;
    const rationale = detail ? detail.rationale : '';
    const dreamTokens = detail ? (detail.dreamTokensMatched || []) : [];

    // Rationale sentence
    const rationaleHtml = rationale
      ? `<p class="match-rationale">${escapeHtml(rationale)}</p>`
      : '';

    // Dream words pills (cream)
    const dreamPillsHtml = dreamTokens.length > 0
      ? `<div class="match-kw-group-label">from your dream</div>
         <div class="match-keywords">${dreamTokens.slice(0, 5).map(w =>
           `<span class="match-kw match-kw--dream">${escapeHtml(w)}</span>`
         ).join('')}</div>`
      : '';

    // Tradition keyword pills (gold)
    const tradPillsHtml = keywords.length > 0
      ? `<div class="match-kw-group-label">tradition concepts</div>
         <div class="match-keywords">${keywords.map(k => {
           const typeClass = k.matchType === 'exact' || k.matchType === 'phrase'
             ? 'match-kw--strong' : 'match-kw--soft';
           return `<span class="match-kw ${typeClass}">${escapeHtml(k.keyword)}</span>`;
         }).join('')}</div>`
      : '';

    return `
      <div class="match-result-item" onclick="navigateTo('profile','${m.id}')" style="cursor:pointer;">
        <div class="match-result-header">
          <span class="match-result-rank">${i + 1}</span>
          <span class="match-result-name">${escapeHtml(m.name)}</span>
          <span class="match-result-score" style="color:${color}">${m.score}</span>
        </div>
        ${rationaleHtml}
        ${dreamPillsHtml}
        ${tradPillsHtml}
      </div>
    `;
  }).join('');

  // Show banner
  document.getElementById('dream-match-banner').style.display = 'flex';
}

// HTML-safe helper for graph context
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function graphClearHighlight() {
  d3.selectAll('.node').classed('highlighted', false).classed('dimmed', false);
  d3.selectAll('.node circle, .node polygon')
    .attr('fill-opacity', 0.65)
    .attr('stroke-width', 1)
    .attr('filter', null);
  d3.selectAll('.node circle').each(function(d) {
    d3.select(this).attr('r', d ? d.radius : null);
  });
  d3.selectAll('.edge').attr('stroke-opacity', null);
}

// ── Cluster Filters ──────────────────────────────────────────
function populateClusterFilters() {
  const container = document.getElementById('cluster-filters');
  if (!container) return;

  container.innerHTML = window.CLUSTERS_ORDER.map(cluster => {
    const color = window.getClusterColor(cluster);
    const cls   = window.getClusterClass(cluster);
    const label = window.shortCluster(cluster);
    return `
      <label class="cluster-filter-item">
        <input type="checkbox" checked
          onchange="graphFilterCluster('${cluster}', this.checked)"
          style="--cluster-color: ${color}">
        <span class="cluster-dot" style="background:${color}"></span>
        <span>${label}</span>
      </label>
    `;
  }).join('');
}

function graphFilterCluster(cluster, visible) {
  if (visible) {
    activeFilters.add(cluster);
  } else {
    activeFilters.delete(cluster);
  }
  applyClusterFilter();
}

function applyClusterFilter() {
  d3.selectAll('.node').each(function(d) {
    const show = activeFilters.has(d.cluster);
    d3.select(this).style('display', show ? null : 'none');
  });

  const visibleCount = window.AppState.traditions.filter(t => activeFilters.has(t.cluster)).length;
  updateGraphCount(visibleCount);
}

function updateGraphCount(count) {
  const el = document.getElementById('graph-count');
  if (el) el.textContent = `${count} tradition${count !== 1 ? 's' : ''}`;
}

function resizeGraph() {
  if (!graphSim) return;
  const { width, height } = getGraphDimensions();
  d3.select('#graph-svg').attr('viewBox', `0 0 ${width} ${height}`);
  graphSim.force('center', d3.forceCenter(width / 2, height / 2)).alpha(0.1).restart();
}

function handleInterpretFromGraph() {
    AppState.interpretDreamText = AppState.dreamText;
    AppState.interpretMatchedIds = AppState.dreamMatchIds.slice();
    AppState.interpretTraditions = [];
    AppState.interpretResults = {};
    navigateTo('interpret');
}
window.handleInterpretFromGraph = handleInterpretFromGraph;

// Expose
window.initGraph           = initGraph;
window.graphGroupBy        = graphGroupBy;
window.graphToggleEdges    = graphToggleEdges;
window.graphReset          = graphReset;
window.graphApplyDreamMatch = graphApplyDreamMatch;
window.graphClearHighlight = graphClearHighlight;
window.resizeGraph         = resizeGraph;
