/* ============================================================
   DREAMWARD — about.js
   About page: project orientation, guide, and disclaimers
   ============================================================ */

'use strict';

function renderAbout() {
  const el = document.getElementById('about-content');
  if (!el) return;

  const tradCount = (window.AppState.traditions || []).length;
  const resCount  = (window.AppState.resources || []).length;
  const glossCount = (window.AppState.glossary || []).length;

  el.innerHTML = `
    <div class="about-inner">

      <!-- Hero section -->
      <header class="about-hero">
        <span class="about-wordmark">DREAMWARD</span>
        <h1 class="about-title">A Comparative Atlas<br>of Dream Traditions</h1>
        <p class="about-lead">
          An interactive scholarly tool for exploring how different cultures, disciplines, 
          and traditions understand the experience of dreaming &mdash; their ontologies, 
          epistemologies, interpretive methods, and the boundaries of what dreams mean.
        </p>
      </header>

      <!-- Status banner -->
      <div class="about-status-banner" role="alert">
        <div class="about-status-icon">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="1.5"/>
            <path d="M10 6v5M10 13.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="about-status-text">
          <strong>Research Preview</strong> &mdash; This project is under active development. 
          Data has not been fully verified, and the resource library is still being curated. 
          Entries marked "Unverified" have not yet undergone peer review or editorial vetting.
          Not all traditions are represented, and coverage across regions is uneven. 
          Use for exploration and inquiry, not as a definitive reference.
        </div>
      </div>

      <!-- What is this -->
      <section class="about-section">
        <h2 class="about-section-title">What is this?</h2>
        <div class="about-prose">
          <p>
            Dreamward maps <strong>${tradCount} dream traditions</strong> across eight thematic clusters &mdash; 
            from Tibetan Dream Yoga and Jungian analysis to neurocognitive theory and Indigenous dreaming practices. 
            Each tradition is profiled with its ontological position (what dreams <em>are</em>), 
            epistemological framework (how we <em>know</em> about them), key figures, institutional homes, 
            and connections to other traditions.
          </p>
          <p>
            The atlas is backed by a curated library of <strong>${resCount} scholarly resources</strong> 
            (peer-reviewed papers, academic press monographs, and institutional publications) 
            and a <strong>${glossCount}-term glossary</strong> of cross-cultural and tradition-specific vocabulary.
          </p>
          <p>
            The project sits at the intersection of comparative religion, philosophy of mind, 
            clinical psychology, neuroscience, and Indigenous knowledge systems. It does not advocate 
            for any single tradition &mdash; it maps the landscape so you can navigate it yourself.
          </p>
        </div>
      </section>

      <!-- How to use -->
      <section class="about-section">
        <h2 class="about-section-title">How to use Dreamward</h2>
        <div class="about-guide">

          <div class="about-guide-item">
            <div class="about-guide-num">1</div>
            <div>
              <h3 class="about-guide-heading">Describe a Dream</h3>
              <p>Start from the home screen by writing a dream &mdash; as much or as little as you remember. 
              Dreamward analyzes your language against each tradition's keyword signature 
              and highlights the traditions that resonate most strongly. You'll see which specific keywords matched and why.</p>
            </div>
          </div>

          <div class="about-guide-item">
            <div class="about-guide-num">2</div>
            <div>
              <h3 class="about-guide-heading">Explore the Graph</h3>
              <p>The force-directed graph shows all traditions as nodes, connected by shared clusters, 
              epistemologies, or agency styles. Group by different dimensions, filter by cluster, 
              and hover over nodes for quick previews. Click any node to open its full profile.</p>
            </div>
          </div>

          <div class="about-guide-item">
            <div class="about-guide-num">3</div>
            <div>
              <h3 class="about-guide-heading">Browse the Matrix</h3>
              <p>The Matrix view displays traditions as cards you can filter and sort. 
              Use the curated preset views &mdash; like "Body-Based Traditions" or "Indigenous & Place-Based" &mdash; 
              or build your own combination of filters.</p>
            </div>
          </div>

          <div class="about-guide-item">
            <div class="about-guide-num">4</div>
            <div>
              <h3 class="about-guide-heading">Compare Traditions</h3>
              <p>Add two or three traditions to the Comparator for a side-by-side view of their 
              ontologies, functions, and epistemologies. Generate an AI-powered summary that synthesizes 
              the key differences and unexpected commonalities between them.</p>
            </div>
          </div>

          <div class="about-guide-item">
            <div class="about-guide-num">5</div>
            <div>
              <h3 class="about-guide-heading">Dive into Resources</h3>
              <p>The Resource Library catalogs ${resCount} scholarly sources, filterable by type, cluster, 
              source category, and access level. Every resource links to its DOI, direct source, 
              or a Google Scholar search. Annotations provide a one-to-three sentence summary of each work.</p>
            </div>
          </div>

          <div class="about-guide-item">
            <div class="about-guide-num">6</div>
            <div>
              <h3 class="about-guide-heading">Learn the Language</h3>
              <p>The Glossary defines ${glossCount} terms used across dream traditions &mdash; from <em>bardo</em> 
              and <em>hypnagogia</em> to <em>individuation</em> and <em>oneirocriticism</em>. 
              Terms link back to the traditions that use them.</p>
            </div>
          </div>

        </div>
      </section>

      <!-- Methodology & data notes -->
      <section class="about-section">
        <h2 class="about-section-title">Data &amp; Methodology</h2>
        <div class="about-prose">
          <p>
            Traditions were identified through a literature review spanning comparative dream studies, 
            the history of oneirology, clinical dream research, and ethnographic accounts. 
            Each entry is classified along five axes: <em>ontology</em> (what dreams are), 
            <em>epistemology</em> (how dreams are known), <em>function</em> (what dreams do), 
            <em>agency</em> (the dreamer's role), and <em>institutional home</em> (where the tradition lives).
          </p>
          <p>
            The resource library restricts itself to peer-reviewed journals, academic press publications, 
            and institutional sources. Blogs, Medium posts, and Wikipedia are excluded. 
            For Indigenous traditions (Anishinaabe/Ojibwe, Iroquois, Mapuche, Australian Aboriginal), 
            the project prioritizes Indigenous-authored sources and flags any entry where the 
            primary author is a non-Indigenous outside scholar.
          </p>
          <p>
            The dream-matching algorithm uses keyword signatures assigned to each tradition. 
            When you describe a dream, it tokenizes your text, strips stopwords, applies simple stemming, 
            and scores each tradition using exact, stem, partial, and phrase matches. 
            It is a heuristic, not a clinical tool &mdash; it is designed to surface interesting connections, 
            not to diagnose or prescribe.
          </p>
        </div>
      </section>

      <!-- Disclaimers -->
      <section class="about-section about-section--disclaimer">
        <h2 class="about-section-title">Important Disclaimers</h2>
        <div class="about-disclaimers">

          <div class="about-disclaimer-item">
            <span class="about-disclaimer-label">Not a clinical tool</span>
            <p>Dreamward is a scholarly exploration tool. It does not provide medical, 
            psychological, or spiritual advice. Dream interpretation is culturally situated &mdash; 
            no algorithm can replace a trained practitioner, elder, or analyst.</p>
          </div>

          <div class="about-disclaimer-item">
            <span class="about-disclaimer-label">Data is unverified</span>
            <p>All entries are currently flagged as "Unverified." While sourced from academic literature, 
            the classifications and annotations have not undergone formal peer review. 
            Errors, omissions, and mischaracterizations may exist.</p>
          </div>

          <div class="about-disclaimer-item">
            <span class="about-disclaimer-label">Coverage is incomplete</span>
            <p>Thirty-two traditions is a starting point, not a comprehensive survey. 
            Significant traditions are missing, and the current set reflects the available literature 
            in English. Non-Western and oral traditions are inherently harder to represent 
            in this format.</p>
          </div>

          <div class="about-disclaimer-item">
            <span class="about-disclaimer-label">Indigenous knowledge</span>
            <p>Entries on Indigenous traditions are included with care but carry inherent limitations. 
            Written academic accounts may not reflect lived practice. Community members and knowledge 
            keepers are the authoritative voices on their own traditions.</p>
          </div>

          <div class="about-disclaimer-item">
            <span class="about-disclaimer-label">AI-generated content</span>
            <p>The Comparator's AI-generated summaries use a large language model to synthesize 
            tradition comparisons. These summaries should be read as analytical starting points, 
            not authoritative scholarship. Always verify against primary sources.</p>
          </div>

        </div>
      </section>

      <!-- Colophon -->
      <section class="about-section about-section--colophon">
        <h2 class="about-section-title">Colophon</h2>
        <div class="about-prose">
          <p>
            Built with D3.js for the force graph, vanilla JavaScript for all views, 
            and a FastAPI backend for AI-assisted comparisons. 
            Typeset in Playfair Display and Inter. 
            Data sourced from scholarly literature and stored as structured JSON.
          </p>
          <p class="about-version">
            Version 0.3 &middot; Research Preview &middot; ${new Date().getFullYear()}
          </p>
        </div>
      </section>

    </div>
  `;
}

// Expose
window.renderAbout = renderAbout;
