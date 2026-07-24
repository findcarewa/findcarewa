/**
 * Fuzzy string matching utilities — Levenshtein distance, trigram similarity,
 * and a light stemmer. Used by the search engine to tolerate typos, variant
 * spellings, and different word forms.
 */

// ─── Levenshtein distance ────────────────────────────────────────────────────

/**
 * Compute Levenshtein edit distance between two strings.
 * Uses a memory-optimized two-row DP approach.
 */
export function levenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);

  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,        // deletion
        curr[j - 1] + 1,    // insertion
        prev[j - 1] + cost, // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

/**
 * Normalized similarity ratio between two strings (0 = completely different,
 * 1 = identical). Based on Levenshtein distance relative to the longer string.
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ─── Trigram similarity ──────────────────────────────────────────────────────

/** Extract the set of character trigrams from a string. */
export function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    set.add(padded.slice(i, i + 3));
  }
  return set;
}

/**
 * Jaccard similarity between two strings based on character trigrams.
 * More tolerant of letter transpositions and minor spelling differences than
 * pure Levenshtein. Returns 0–1.
 */
export function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const ta = trigrams(a);
  const tb = trigrams(b);
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ─── Combined fuzzy match ────────────────────────────────────────────────────

/**
 * Combined fuzzy similarity score — takes the max of Levenshtein ratio and
 * trigram Jaccard. This gives good results across both short words (where
 * trigrams are sparse) and longer phrases.
 */
export function fuzzyScore(a: string, b: string): number {
  if (a === b) return 1;
  return Math.max(similarity(a, b), trigramSimilarity(a, b));
}

/**
 * Returns true if `token` fuzzy-matches `target` within the given threshold.
 * Threshold 0.75 catches most single-character typos; 0.85 is stricter.
 */
export function fuzzyMatch(token: string, target: string, threshold = 0.75): boolean {
  if (token === target) return true;
  // Skip fuzzy for very short tokens (too noisy)
  if (token.length < 3 || target.length < 3) return token.startsWith(target) || target.startsWith(token);
  return fuzzyScore(token, target) >= threshold;
}

/**
 * Best fuzzy match score of a token against an array of targets.
 * Returns the highest similarity found (0 if no target meets threshold).
 */
export function bestFuzzyMatch(token: string, targets: string[], threshold = 0.7): number {
  let best = 0;
  for (const target of targets) {
    const score = fuzzyScore(token, target);
    if (score > best) best = score;
  }
  return best >= threshold ? best : 0;
}

// ─── Light stemmer ───────────────────────────────────────────────────────────

/**
 * Very light English suffix stripper — reduces plurals and common verb/adjective
 * endings so that "dentists" matches "dentist", "counseling" matches "counsel",
 * "anxiety" matches "anxious", etc. Not a full Porter stemmer; just enough to
 * bridge the most common morphological gaps in healthcare search.
 */
export function stem(word: string): string {
  let w = word.toLowerCase();

  // Order matters — try longer suffixes first
  const suffixes = [
    'ization', 'izations', 'iveness', 'fulness', 'ousness',
    'ational', 'tional', 'encies', 'ancies', 'ically', 'fully',
    'ously', 'alism', 'ality', 'ality', 'ement', 'ation',
    'ements', 'ations', 'ables', 'ibles', 'izing', 'ized',
    'ation', 'ement', 'ities', 'iness', 'ingly', 'edly',
    'ing', 'ies', 'ied', 'ier', 'iest', 'edly',
    'ers', 'est', 'est', 'ed', 'es', 'er', 'ly', 's',
  ];

  for (const suffix of suffixes) {
    if (w.length > suffix.length + 2 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length);
      break;
    }
  }

  // Normalize a few common healthcare-specific stems
  if (w === 'dent') w = 'dental';
  if (w === 'psych') w = 'psychiatr';
  if (w === 'therap') w = 'therap';
  if (w === 'counsel') w = 'counsel';

  return w;
}

/** Tokenize and stem a phrase into a Set of stemmed tokens. */
export function stemTokens(phrase: string): Set<string> {
  return new Set(
    phrase
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 2)
      .map(stem),
  );
}
