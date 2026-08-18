// ─── Hours normalization ───────────────────────────────────────────────────
// The database contains hours in multiple formats: full day names ("monday"),
// 12-hour times ("8am-5pm"), inconsistent casing ("closed" vs "Closed"), and
// 24-hour variants ("24hours", "Open 24 hours"). These functions normalize all
// of them at read time so the UI and open/closed logic work correctly.

const DAY_KEY_MAP: Record<string, string> = {
  monday: 'mon', tuesday: 'tue', wednesday: 'wed', thursday: 'thu',
  friday: 'fri', saturday: 'sat', sunday: 'sun',
  mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu',
  fri: 'fri', sat: 'sat', sun: 'sun',
};

const VALID_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function normalizeTimeValue(v: string): string {
  let s = v.trim();

  if (s.toLowerCase() === 'closed' || s.toLowerCase() === 'close') return 'Closed';
  if (/^24\s*hours?$/i.test(s) || /^open\s*24\s*hours?$/i.test(s)) return '24hours';
  const openMatch = s.match(/^open\s+(\d+)\s*hours?$/i);
  if (openMatch) return `${openMatch[1]}hours`;
  if (/^\d+hours$/i.test(s)) return s;
  if (s.toLowerCase() === 'varies') return 'varies';

  if (s.includes(',')) {
    return s.split(',').map((p) => normalizeTimeValue(p.trim())).join(',');
  }

  // Convert 12-hour times to 24-hour: "8am" → "8:00", "5pm" → "17:00"
  s = s.replace(/(\d{1,2})(?::(\d{2}))?(am|pm)/gi, (match, hStr, mStr, ap) => {
    let h = parseInt(hStr, 10);
    const m = mStr ? parseInt(mStr, 10) : 0;
    if (ap.toLowerCase() === 'pm' && h !== 12) h += 12;
    if (ap.toLowerCase() === 'am' && h === 12) h = 0;
    return `${h}:${m.toString().padStart(2, '0')}`;
  });

  s = s.replace(/(am|pm)/gi, '');
  s = s.replace(/\s*[-\u2013]\s*/g, '-');
  s = s.replace(/!/g, '');

  // Ensure bare hours have minutes: "8-17" → "8:00-17:00"
  s = s.replace(/(^|[-,])(\d{1,2})(?=[-,]|$)/g, (_m, pre, h) => `${pre}${h}:00`);

  return s.trim();
}

const hoursCache = new WeakMap<Record<string, string>, Record<string, string>>();

function normalizeHours(hours: Record<string, string>): Record<string, string> {
  const cached = hoursCache.get(hours);
  if (cached) return cached;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(hours)) {
    const dayKey = DAY_KEY_MAP[k.toLowerCase()] ?? k.toLowerCase();
    if (!VALID_DAYS.includes(dayKey)) continue;
    out[dayKey] = normalizeTimeValue(v);
  }
  hoursCache.set(hours, out);
  return out;
}

export function formatTodayHours(hours: Record<string, string>): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[new Date().getDay()];
  const normalized = normalizeHours(hours);
  return normalized[today] ?? 'Closed';
}

export function isOpenNow(hours: Record<string, string>): boolean {
  const today = formatTodayHours(hours);
  if (today === 'Closed') return false;
  if (today === '24hours' || /^\d+hours$/.test(today)) return true;
  if (today === 'varies') return false;

  // Handle comma-separated ranges (e.g. "8:00-12:00,13:00-17:00")
  const ranges = today.split(',');
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  for (const range of ranges) {
    const match = range.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
    if (!match) continue;
    const [, startH, startM, endH, endM] = match.map(Number);
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
  const normalized = normalizeHours(hours);
  return entries.map((e) => ({
    day: e.label,
    hours: normalized[e.key] ?? 'Closed',
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
