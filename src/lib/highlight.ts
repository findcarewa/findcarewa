/**
 * Text highlighting utility for search results.
 * Wraps matched substrings in <mark> tags for visual emphasis.
 */

/**
 * Highlight all occurrences of the query terms within a text string.
 * Returns an array of React-renderable segments: plain strings and
 * { match: true, text: string } objects for highlighted portions.
 */
export interface HighlightSegment {
  text: string;
  match: boolean;
}

export function highlightSegments(text: string, query: string): HighlightSegment[] {
  if (!query || !text) return [{ text, match: false }];

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .sort((a, b) => b.length - a.length);

  if (terms.length === 0) return [{ text, match: false }];

  const pattern = terms
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);

  const segments: HighlightSegment[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i]) continue;
    const isMatch = i % 2 === 1;
    if (segments.length > 0 && segments[segments.length - 1].match === isMatch) {
      segments[segments.length - 1].text += parts[i];
    } else {
      segments.push({ text: parts[i], match: isMatch });
    }
  }

  return segments.length > 0 ? segments : [{ text, match: false }];
}

/**
 * Check whether a text string contains any of the query terms.
 */
export function hasMatch(text: string, query: string): boolean {
  if (!query || !text) return false;
  const lower = text.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .some((term) => lower.includes(term));
}
