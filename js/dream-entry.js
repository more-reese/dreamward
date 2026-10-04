/* ============================================================
   DREAMWARD — dream-entry.js
   Dream text analysis, keyword matching, scoring
   ============================================================ */

'use strict';

// Stopwords to ignore during tokenization
const STOPWORDS = new Set([
  'the','a','an','and','or','but','in','on','at','to','for','of',
  'with','is','was','were','are','i','me','my','it','its','this',
  'that','then','had','have','has','he','she','they','we','you',
  'from','as','by','be','do','did','not','so','if','what','when',
  'there','into','about','some','up','out','no','can','could',
  'would','will','been','her','his','him','them','their','who',
  'more','all','also','just','very','like','than','which','any',
  'one','two','three','after','before','over','under','around',
  'through','while','still','even','much','many','other','how',
  'where','see','saw','feel','felt','seemed','seem','went','go',
  'came','come','found','find','looked','look','knew','know',
  'told','tell','kept','keep','tried','try','made','make','got',
  'get','something','someone','nothing','everything','seemed',
  'being','suddenly','slowly','again','back','down','away','long',
  'most','both','place','well','between','same','later','let',
  'each','next','off','seem','once','too','without','cannot',
]);

// Build a normalized token list from free text
function tokenizeDream(text) {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

// Simple stemming: strip common suffixes
function stem(word) {
  return word
    .replace(/ing$/, '')
    .replace(/ness$/, '')
    .replace(/tion$/, 'te')
    .replace(/ations?$/, 'ate')
    .replace(/ment$/, '')
    .replace(/ful$/, '')
    .replace(/less$/, '')
    .replace(/ed$/, '')
    .replace(/s$/, '');
}

// Score a single tradition against the dream tokens
// Returns { score, matchedKeywords: [{ keyword, matchType }], dreamTokensMatched: [] }
function scoreTradition(tradition, dreamTokens, dreamStems) {
  let score = 0;
  const keywords = tradition.dreamKeywords || [];
  const matchedKeywords = [];
  const dreamTokensMatched = new Set();

  for (const kw of keywords) {
    const kwLower = kw.toLowerCase();
    const kwWords = kwLower.split(/\s+/);

    // Check multi-word keyword as phrase
    const dreamText = dreamTokens.join(' ');
    if (kwWords.length > 1 && dreamText.includes(kwLower)) {
      score += 4; // phrase match = highest score
      matchedKeywords.push({ keyword: kw, matchType: 'phrase' });
      // Find the dream tokens that overlap with the phrase
      kwWords.forEach(w => {
        if (dreamTokens.includes(w)) dreamTokensMatched.add(w);
      });
      continue;
    }

    for (const kwWord of kwWords) {
      // Exact match
      if (dreamTokens.includes(kwWord)) {
        score += 3;
        matchedKeywords.push({ keyword: kw, matchType: 'exact' });
        dreamTokensMatched.add(kwWord);
        break;
      }
      // Stem match
      const kwStem = stem(kwWord);
      const stemMatch = dreamTokens.find(dt => stem(dt) === kwStem);
      if (stemMatch) {
        score += 1;
        matchedKeywords.push({ keyword: kw, matchType: 'stem' });
        dreamTokensMatched.add(stemMatch);
        break;
      }
      // Partial containment (dream token contains keyword)
      const partialToken = dreamTokens.find(dt => dt.includes(kwWord) || kwWord.includes(dt));
      if (partialToken) {
        score += 1;
        matchedKeywords.push({ keyword: kw, matchType: 'partial' });
        dreamTokensMatched.add(partialToken);
        break;
      }
    }
  }

  return { score, matchedKeywords, dreamTokensMatched: [...dreamTokensMatched] };
}

// Return top N traditions matching dream text
function matchDream(dreamText, topN = 5) {
  if (!dreamText.trim()) return [];

  const traditions = window.AppState.traditions;
  const tokens = tokenizeDream(dreamText);
  const stems  = new Set(tokens.map(stem));

  const scored = traditions
    .map(t => {
      const { score, matchedKeywords, dreamTokensMatched } = scoreTradition(t, tokens, stems);
      return { id: t.id, name: t.name, score, matchedKeywords, dreamTokensMatched };
    })
    .filter(t => t.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topN);
}

// Generate a one-sentence rationale for the sidebar panel
function generateRationale(tradition, matchedKeywords, dreamTokens) {
  const kwList = matchedKeywords.slice(0, 3).map(k => k.keyword);
  const dreamList = dreamTokens.slice(0, 3);

  if (kwList.length === 0) return '';

  const dreamPart = dreamList.map(w => '\u201c' + w + '\u201d').join(', ');
  const kwPart = kwList.join(', ');
  const ontology = Array.isArray(tradition.ontology)
    ? tradition.ontology[0] : (tradition.ontology || '');

  return `Your dream\u2019s ${dreamPart} resonate with ${kwPart} \u2014 this tradition views dreams as ${ontology.toLowerCase()}.`;
}

// ── Reusable match function for interpret entry point ────────
function matchDreamToTraditions(text) {
  const matches = matchDream(text);
  return matches; // array of { id, name, score, matchedKeywords, dreamTokensMatched }
}
window.matchDreamToTraditions = matchDreamToTraditions;

// ── Build dream match details & store in AppState ────────────
function storeDreamMatchState(text, matches) {
  window.AppState.dreamText = text;
  window.AppState.dreamMatchIds = matches.map(m => m.id);

  const traditions = window.AppState.traditions;
  const allDreamTokens = new Set();
  const matchDetails = {};

  for (const m of matches) {
    const trad = traditions.find(t => t.id === m.id);
    const rationale = trad
      ? generateRationale(trad, m.matchedKeywords, m.dreamTokensMatched)
      : '';
    matchDetails[m.id] = {
      score: m.score,
      matchedKeywords: m.matchedKeywords.map(k => k.keyword),
      dreamTokensMatched: m.dreamTokensMatched,
      rationale: rationale,
    };
    m.dreamTokensMatched.forEach(t => allDreamTokens.add(t));
  }

  window.AppState.dreamMatchDetails = matchDetails;
  window.AppState.dreamElements = [...allDreamTokens];
}

// ── Handle Dream Submit ──────────────────────────────────────
function handleDreamSubmit(event) {
  event.preventDefault();
  const text = document.getElementById('dream-textarea').value.trim();
  if (!text) {
    showToast('Write something first…');
    return;
  }

  const matches = matchDream(text);
  if (matches.length === 0) {
    showToast('No strong resonances found. Try describing more details.');
    window.AppState.dreamMatchIds = [];
    window.AppState.dreamText = null;
    window.AppState.dreamElements = [];
    window.AppState.dreamMatchDetails = {};
    window.navigateTo('graph');
    return;
  }

  storeDreamMatchState(text, matches);

  // Navigate to graph with dream context
  window.navigateTo('graph');

  // After graph initializes, apply highlight
  const applyHighlight = () => {
    if (window.graphApplyDreamMatch) {
      window.graphApplyDreamMatch(matches);
    } else {
      setTimeout(applyHighlight, 100);
    }
  };
  setTimeout(applyHighlight, 200);
}

// ── Entry Point: Home → Interpret ────────────────────────────
function handleInterpretFromEntry() {
  const textarea = document.getElementById('dream-textarea');
  const text = textarea.value.trim();
  if (!text) { textarea.focus(); return; }
  const matchResults = matchDreamToTraditions(text);
  window.AppState.interpretDreamText = text;
  window.AppState.interpretMatchedIds = matchResults.map(r => r.id);
  window.AppState.interpretTraditions = [];
  window.AppState.interpretResults = {};
  window.navigateTo('interpret');
}
window.handleInterpretFromEntry = handleInterpretFromEntry;

// Expose
window.handleDreamSubmit = handleDreamSubmit;
window.matchDream = matchDream;
