const DAY_KEY_ALIASES: Record<string, string> = {
  monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu',
  friday: 'fri', saturday: 'sat', sunday: 'sun',
};

/** Normalize hours object so all keys are 3-letter day abbreviations. */
function normalizeHoursKeys(hours: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(hours)) {
    const key = DAY_KEY_ALIASES[k.toLowerCase()] ?? k;
    out[key] = v;
  }
  return out;
}

/** Convert a military-time range like "8:00-17:00" to "8am-5pm". */
function toAmPm(value: string): string {
  if (!value) return value;
  const lower = value.toLowerCase();
  if (lower === 'closed') return 'Closed';
  if (lower === '24 hours' || lower === '24hours') return '24 hours';

  // Handle comma-separated ranges like "11:00-13:30,15:00-17:00"
  const parts = value.split(',').map((p) => {
    const part = p.trim();
    const m = part.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!m) return part; // already am/pm or unknown format — leave as-is
    const [, sH, sM, eH, eM] = m.map(Number);
    return `${sH > 12 ? sH - 12 : sH}${sM === 0 ? '' : ':' + String(sM).padStart(2, '0')}am-${eH > 12 ? eH - 12 : eH === 0 ? 12 : eH}${eM === 0 ? '' : ':' + String(eM).padStart(2, '0')}pm`;
  });
  return parts.join(', ');
}

export function formatTodayHours(hours: Record<string, string>): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[new Date().getDay()];
  const normalized = normalizeHoursKeys(hours);
  const raw = normalized[today] ?? 'Closed';
  return toAmPm(raw);
}

export function isOpenNow(hours: Record<string, string>): boolean {
  const today = formatTodayHours(hours);
  if (today === 'Closed' || today === '24 hours') return today === '24 hours';

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Handle comma-separated ranges like "8am-12pm,1pm-5pm"
  const ranges = today.split(',');
  for (const range of ranges) {
    const match = range.match(/(\d+)(?::(\d+))?\s*(am|pm)?\s*-\s*(\d+)(?::(\d+))?\s*(am|pm)?/i);
    if (!match) continue;
    let [, sH, sM, sApm, eH, eM, eApm] = match;
    let startH = parseInt(sH, 10);
    let startM = sM ? parseInt(sM, 10) : 0;
    let endH = parseInt(eH, 10);
    let endM = eM ? parseInt(eM, 10) : 0;

    // Normalize to 24-hour for comparison
    if (sApm && sApm.toLowerCase() === 'pm' && startH < 12) startH += 12;
    if (sApm && sApm.toLowerCase() === 'am' && startH === 12) startH = 0;
    if (eApm && eApm.toLowerCase() === 'pm' && endH < 12) endH += 12;
    if (eApm && eApm.toLowerCase() === 'am' && endH === 12) endH = 0;

    // If no am/pm marker, infer from 12-hour convention
    if (!sApm && startH <= 12 && endH <= 12) {
      if (endH < startH || (endH === startH && endM < startM)) endH += 12;
      // e.g. 8am-5pm → if end is less than 12, assume pm
      if (endH < 12 && endH < startH + 4) endH += 12;
    }

    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    if (currentMin >= startMin && currentMin <= endMin) return true;
  }
  return false;
}

export function formatHoursList(hours: Record<string, string>): { day: string; hours: string; isToday: boolean }[] {
  const entries = [
    { key: 'mon', label: 'Monday' },
    { key: 'tue', label: 'Tuesday' },
    { key: 'wed', label: 'Wednesday' },
    { key: 'thu', label: 'Thursday' },
    { key: 'fri', label: 'Friday' },
    { key: 'sat', label: 'Saturday' },
    { key: 'sun', label: 'Sunday' },
  ];
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = days[new Date().getDay()];
  const normalized = normalizeHoursKeys(hours);
  return entries.map((e) => ({
    day: e.label,
    hours: toAmPm(normalized[e.key] ?? 'Closed'),
    isToday: e.key === todayKey,
  }));
}

export function formatCost(min: number, max: number, free?: boolean, slidingScale?: boolean): string {
  if (free) return 'Free';
  if (slidingScale && min === 0 && max === 0) return 'Free options avail.';
  if (min === 0 && max === 0) return 'Cost varies';
  if (min === 0) return `Up to ${max}`;
  if (min === max) return `~${min}`;
  return `${min} – ${max}`;
}

export function formatLanguages(langs: string[]): string {
  if (langs.length === 0) return 'English';
  if (langs.length === 1) return langs[0];
  return `${langs.slice(0, -1).join(', ')} & ${langs[langs.length - 1]}`;
}

export function getDirectionsUrl(r: {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  google_place_id?: string | null;
}): string {
  // Prefer a verified Google Place ID when available — it points to the
  // exact business listing (e.g. "Central Washington Hospital") rather
  // than a street address that may land a minute away.
  if (r.google_place_id) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.google_place_id)}&query_place_id=${encodeURIComponent(r.google_place_id)}`;
  }
  // Otherwise search by the facility name + city/state so Google Maps
  // finds the actual place listing instead of a bare street address.
  const query = encodeURIComponent(`${r.name}, ${r.city}, ${r.state}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  if (cleaned.length === 11) return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  return phone;
}

export function estimateCost(
  r: { medicaid: boolean; medicare: boolean; private_insurance: boolean;
       accepts_uninsured: boolean; sliding_scale: boolean; cost_free: boolean;
       cost_estimate_min: number; cost_estimate_max: number },
  coverage: 'uninsured' | 'medicaid' | 'medicare' | 'private'
): { min: number; max: number; label: string; note: string } {
  if (r.cost_free) {
    return { min: 0, max: 0, label: 'Free Service', note: 'This resource provides services at no cost.' };
  }
  if (coverage === 'medicaid' && r.medicaid) {
    return {
      min: 0, max: Math.round(r.cost_estimate_max * 0.1), label: 'Apple Health (Medicaid)',
      note: 'Apple Health covers most services with little to no copay.',
    };
  }
  if (coverage === 'medicare' && r.medicare) {
    return {
      min: Math.round(r.cost_estimate_min * 0.2), max: Math.round(r.cost_estimate_max * 0.2),
      label: 'Medicare', note: 'Medicare typically covers 80% after the deductible.',
    };
  }
  if (coverage === 'private' && r.private_insurance) {
    return {
      min: Math.round(r.cost_estimate_min * 0.15), max: Math.round(r.cost_estimate_max * 0.25),
      label: 'Private Insurance', note: 'Out-of-pocket depends on your plan  -  copay, coinsurance, and deductible apply.',
    };
  }
  if (coverage === 'uninsured' && r.sliding_scale) {
    return {
      min: 0, max: r.cost_estimate_max, label: 'Sliding Scale (Income-Based)',
      note: 'Sliding-scale fees adjust to your income. Bring proof of income to your visit.',
    };
  }
  return {
    min: r.cost_estimate_min, max: r.cost_estimate_max, label: 'Self-Pay (No Insurance)',
    note: r.accepts_uninsured
      ? 'This facility accepts uninsured patients at their self-pay rate.'
      : 'This facility may require payment or financial assistance application at the time of service.',
  };
}

/**
 * Rounds a count down to a "friendly" rounded number for display.
 * 747 → 700, 1258 → 1200, 42 → 40, 8 → 8 (small numbers stay exact).
 */
export function roundDownFriendly(n: number): number {
  if (n <= 20) return n;
  if (n < 100) return Math.floor(n / 10) * 10;
  if (n < 1000) return Math.floor(n / 100) * 100;
  return Math.floor(n / 100) * 100;
}
