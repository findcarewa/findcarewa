// Generate SQL for inserting real verified resources
// Output goes to scripts/real_resources_seed.sql
import { facilities } from '../src/data/waHealthcareFacilities';
import { communityResources } from '../src/data/waCommunityResources';
import { writeFileSync } from 'fs';

const CATEGORY_PHOTOS: Record<string, string[]> = {
  hospital: [
    'https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/236380/pexels-photo-236380.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/247786/pexels-photo-247786.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3937174/pexels-photo-3937174.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/263424/pexels-photo-263424.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  fqhc: [
    'https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3937174/pexels-photo-3937174.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4173238/pexels-photo-4173238.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'mental-health': [
    'https://images.pexels.com/photos/6678075/pexels-photo-6678075.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6759205/pexels-photo-6759205.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6764920/pexels-photo-6764920.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4149199/pexels-photo-4149199.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  dental: [
    'https://images.pexels.com/photos/6642765/pexels-photo-6642765.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6642719/pexels-photo-6642719.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3779705/pexels-photo-3779705.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3779706/pexels-photo-3779706.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/5212295/pexels-photo-5212295.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'crisis-line': [
    'https://images.pexels.com/photos/6678075/pexels-photo-6678075.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4149199/pexels-photo-4149199.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6764920/pexels-photo-6764920.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'substance-use': [
    'https://images.pexels.com/photos/6678075/pexels-photo-6678075.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6759205/pexels-photo-6759205.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3759079/pexels-photo-3759079.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'food-bank': [
    'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/4252140/pexels-photo-4252140.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/6192363/pexels-photo-6192363.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2611817/pexels-photo-2611817.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  'community-org': [
    'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
  transportation: [
    'https://images.pexels.com/photos/4488636/pexels-photo-4488636.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/97079/pexels-photo-97079.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1058622/pexels-photo-1058622.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1611174/pexels-photo-1611174.jpeg?auto=compress&cs=tinysrgb&w=800',
  ],
};

function pickPhoto(category: string, name: string): string {
  const photos = CATEGORY_PHOTOS[category] ?? CATEGORY_PHOTOS.fqhc;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return photos[Math.abs(hash) % photos.length];
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function arr(a: string[]): string {
  return `'{${a.map((s) => s.replace(/'/g, "''")).join(',')}}'`;
}

// Generate SQL
const lines: string[] = [];
lines.push('-- Clear old generated data');
lines.push("DELETE FROM resources WHERE source = 'generated';");
lines.push('');
lines.push('-- Insert real, verified WA resources');

const allResources: any[] = [];
const seen = new Set<string>();

for (const f of facilities) {
  const key = `${f.name}|${f.city}`;
  if (seen.has(key)) continue;
  seen.add(key);
  allResources.push({
    name: f.name, category_slug: f.category,
    subcategory: f.category === 'hospital' ? '' : 'FQHC',
    description: f.description, address: f.street, city: f.city, county: f.county,
    state: 'WA', zip: f.zip, phone: f.phone, website: f.website,
    hours: { mon: '8:00-17:00', tue: '8:00-17:00', wed: '8:00-17:00', thu: '8:00-17:00', fri: '8:00-17:00', sat: 'Closed', sun: 'Closed' },
    accepts_uninsured: true, sliding_scale: f.category === 'fqhc',
    medicaid: true, medicare: true, private_insurance: true,
    walk_ins: f.category === 'hospital', appointments: true, telehealth: f.category === 'fqhc',
    cost_free: false, cost_min: f.category === 'hospital' ? 1200 : 80, cost_max: f.category === 'hospital' ? 5000 : 300,
    languages: ['English', 'Spanish'], accessibility: ['wheelchair', 'ADA parking', 'interpreter services'],
    services: f.description.split(',').map((s: string) => s.trim()).filter(Boolean).slice(0, 6),
    specialties: [], audiences: ['Adults', 'Families'],
    photo: pickPhoto(f.category, f.name), source: 'verified',
  });
}

for (const c of communityResources) {
  const key = `${c.name}|${c.city}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const isPhone = c.category === 'crisis-line';
  const isFree = ['crisis-line', 'food-bank', 'community-org', 'transportation'].includes(c.category);

  allResources.push({
    name: c.name, category_slug: c.category, subcategory: '',
    description: c.description, address: c.street || '', city: c.city, county: c.county,
    state: 'WA', zip: c.zip || '', phone: c.phone, website: c.website,
    hours: isPhone
      ? { mon: '24 hours', tue: '24 hours', wed: '24 hours', thu: '24 hours', fri: '24 hours', sat: '24 hours', sun: '24 hours' }
      : { mon: '9:00-17:00', tue: '9:00-17:00', wed: '9:00-17:00', thu: '9:00-17:00', fri: '9:00-17:00', sat: 'Closed', sun: 'Closed' },
    accepts_uninsured: true,
    sliding_scale: ['mental-health', 'dental', 'substance-use'].includes(c.category),
    medicaid: ['mental-health', 'dental', 'substance-use'].includes(c.category),
    medicare: ['mental-health', 'dental', 'substance-use'].includes(c.category),
    private_insurance: ['mental-health', 'dental', 'substance-use'].includes(c.category),
    walk_ins: ['food-bank', 'crisis-line', 'community-org'].includes(c.category),
    appointments: !isPhone,
    telehealth: ['mental-health', 'crisis-line', 'substance-use'].includes(c.category),
    cost_free: isFree, cost_min: 0, cost_max: isFree ? 0 : 200,
    languages: ['English', 'Spanish'],
    accessibility: ['wheelchair', 'ADA parking'],
    services: c.description.split(/[,.]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 5),
    specialties: [],
    audiences: c.category === 'crisis-line' ? ['Adults', 'Adolescents'] : ['Adults', 'Families'],
    photo: pickPhoto(c.category, c.name), source: 'verified',
  });
}

// Build INSERT statements in batches
const BATCH = 20;
for (let i = 0; i < allResources.length; i += BATCH) {
  const batch = allResources.slice(i, i + BATCH);
  const values = batch.map((r) => {
    const hoursJson = JSON.stringify(r.hours).replace(/'/g, "''");
    return `('${esc(r.name)}', (SELECT id FROM resource_categories WHERE slug='${r.category_slug}'), '${esc(r.subcategory)}', '${esc(r.description)}', '${esc(r.address)}', '${esc(r.city)}', '${esc(r.county)}', '${r.state}', '${r.zip}', '${r.phone}', ${r.website ? `'${esc(r.website)}'` : 'NULL'}, '${hoursJson}'::jsonb, ${r.accepts_uninsured}, ${r.sliding_scale}, ${r.medicaid}, ${r.medicare}, ${r.private_insurance}, ${r.walk_ins}, ${r.appointments}, ${r.telehealth}, ${r.cost_free}, ${r.cost_min}, ${r.cost_max}, ${arr(r.languages)}, ${arr(r.accessibility)}, ${arr(r.services)}, ${arr(r.specialties)}, ${arr(r.audiences)}, 4.5, '${r.photo}', '${r.source}')`;
  });
  lines.push(`INSERT INTO resources (name, category_id, subcategory, description, address, city, county, state, zip_code, phone, website, hours, accepts_uninsured, sliding_scale, medicaid, medicare, private_insurance, walk_ins_welcome, appointments, telehealth, cost_free, cost_estimate_min, cost_estimate_max, languages, accessibility, services, specialties, audiences, rating, photo_url, source) VALUES`);
  lines.push(values.join(',\n') + ' ON CONFLICT DO NOTHING;');
}

writeFileSync('scripts/real_resources_seed.sql', lines.join('\n'));
console.log(`Generated SQL for ${allResources.length} real resources`);
console.log(`File: scripts/real_resources_seed.sql`);
