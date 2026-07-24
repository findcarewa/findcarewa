export function formatTodayHours(hours: Record<string, string>): string {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[new Date().getDay()];
  return hours[today] ?? 'Closed';
}

export function isOpenNow(hours: Record<string, string>): boolean {
  const today = formatTodayHours(hours);
  if (today === 'Closed' || today === '24 hours') return today === '24 hours';
  const match = today.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
  if (!match) return false;
  const [, startH, startM, endH, endM] = match.map(Number);
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  return currentMin >= startMin && currentMin <= endMin;
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
  return entries.map((e) => ({
    day: e.label,
    hours: hours[e.key] ?? 'Closed',
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

export function getDirectionsUrl(r: { address: string; city: string; state: string; zip_code: string }): string {
  const query = encodeURIComponent(`${r.address}, ${r.city}, ${r.state} ${r.zip_code}`);
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
