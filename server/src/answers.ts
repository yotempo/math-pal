// Answer parsing and comparison. Accepts decimals, fractions ("3/4"),
// mixed numbers ("1 3/8"), money ("$4.50"), commas, and percent signs.

export function parseNumeric(raw: string): number | null {
  let s = raw.trim().toLowerCase();
  s = s.replace(/[$]/g, '').replace(/%$/, '').trim();
  if (s.includes(',')) {
    // Commas are accepted only as well-formed thousands separators ("1,250,000").
    // Anything else ("1,5" European decimal) is ambiguous — reject instead of
    // silently parsing 10x off.
    if (/^-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else return null;
  }
  if (!s) return null;

  // mixed number: "1 3/8" (also accept "1-3/8")
  const mixed = s.match(/^(-?\d+)[\s-]+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const whole = parseInt(mixed[1], 10);
    const n = parseInt(mixed[2], 10);
    const d = parseInt(mixed[3], 10);
    if (d === 0) return null;
    const sign = whole < 0 ? -1 : 1;
    return whole + sign * (n / d);
  }

  // simple fraction: "11/8"
  const frac = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const n = parseInt(frac[1], 10);
    const d = parseInt(frac[2], 10);
    if (d === 0) return null;
    return n / d;
  }

  const num = Number(s);
  return Number.isFinite(num) ? num : null;
}

function normalizeText(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\s*:\s*/g, ':').replace(/\s*(am|pm)$/i, ' $1');
}

export function checkAnswer(expected: string, given: string, answerType: string): boolean {
  if (answerType === 'text') {
    return normalizeText(expected) === normalizeText(given);
  }
  const e = parseNumeric(expected);
  const g = parseNumeric(given);
  if (e === null || g === null) {
    return normalizeText(expected) === normalizeText(given);
  }
  return Math.abs(e - g) < 1e-6;
}
