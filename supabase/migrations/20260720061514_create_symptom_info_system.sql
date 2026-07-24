/*
# Create scalable symptom information system

## Purpose
A curated catalog of medical symptoms/conditions that powers symptom-based search,
care recommendations, and educational content in FindCareWA. Designed to scale to
hundreds of symptoms — each symptom carries its own keywords, related specialties,
urgency level, recommended care types, FAQ entries, and trusted medical source
citations.

## 1. New Tables

### symptoms
The main symptom catalog. Each row is one symptom/condition.
- `id` (uuid, primary key)
- `name` (text, not null) — display name, e.g. "Pink Eye"
- `slug` (text, unique, not null) — URL-friendly identifier, e.g. "pink-eye"
- `description` (text) — plain-English explanation of the symptom
- `keywords` (text[], default '{}') — synonyms and search terms users might type
- `specialties` (text[], default '{}') — medical specialties that treat this (e.g. "ophthalmology")
- `urgency` (text, not null, default 'moderate') — one of: 'low', 'moderate', 'high', 'emergency'
- `recommended_care_types` (text[], default '{}') — care type slugs (e.g. "urgent-care", "primary-care")
- `category_slugs` (text[], default '{}') — resource_categories slugs to boost in search (e.g. "hospital", "mental-health")
- `red_flag` (boolean, default false) — if true, display emergency warning
- `sort_order` (integer, default 0) — display ordering
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### symptom_faqs
Frequently asked questions for each symptom. Many FAQs per symptom.
- `id` (uuid, primary key)
- `symptom_id` (uuid, FK → symptoms.id ON DELETE CASCADE, not null)
- `question` (text, not null)
- `answer` (text, not null)
- `sort_order` (integer, default 0)
- `created_at` (timestamptz, default now())

### symptom_sources
Trusted medical source citations for each symptom. Many sources per symptom.
- `id` (uuid, primary key)
- `symptom_id` (uuid, FK → symptoms.id ON DELETE CASCADE, not null)
- `title` (text, not null) — e.g. "CDC — Conjunctivitis"
- `url` (text, not null) — full URL to the trusted source
- `publisher` (text) — e.g. "CDC", "Mayo Clinic", "NIH"
- `sort_order` (integer, default 0)
- `created_at` (timestamptz, default now())

## 2. Indexes
- `symptoms.slug` — unique index for slug lookups
- `symptoms.urgency` — filter by urgency level
- `symptom_faqs.symptom_id` — join FAQs to symptoms
- `symptom_sources.symptom_id` — join sources to symptoms
- GIN index on `symptoms.keywords` — fast keyword array search
- GIN index on `symptoms.specialties` — fast specialty array search

## 3. Security (RLS)
This is a single-tenant public application — no sign-in required to browse.
All three tables are read-only public reference data (curated via dashboard/SQL).
- `symptoms`, `symptom_faqs`, `symptom_sources`: SELECT to anon + authenticated.
- No INSERT/UPDATE/DELETE via the anon key — data is curated through migrations.

## 4. Important Notes
1. The `keywords` array enables flexible search — users typing "red eye" or
   "eye infection" will match the "Pink Eye" symptom row.
2. `category_slugs` links symptoms to existing resource_categories slugs so the
   search engine can boost relevant resource categories.
3. `recommended_care_types` uses care type slugs (e.g. "urgent-care") that can
   map to resource categories in the UI.
4. CASCADE on FK deletes ensures FAQs and sources are removed when a symptom is deleted.
5. `updated_at` is maintained by the application or migrations, not a trigger
   (keeps the schema simple for curated data).
*/

-- ===== SYMPTOMS =====
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  specialties text[] NOT NULL DEFAULT '{}',
  urgency text NOT NULL DEFAULT 'moderate'
    CHECK (urgency IN ('low', 'moderate', 'high', 'emergency')),
  recommended_care_types text[] NOT NULL DEFAULT '{}',
  category_slugs text[] NOT NULL DEFAULT '{}',
  red_flag boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptoms_slug ON symptoms(slug);
CREATE INDEX IF NOT EXISTS idx_symptoms_urgency ON symptoms(urgency);
CREATE INDEX IF NOT EXISTS idx_symptoms_keywords ON symptoms USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_symptoms_specialties ON symptoms USING GIN (specialties);

-- ===== SYMPTOM_FAQS =====
CREATE TABLE IF NOT EXISTS symptom_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id uuid NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptom_faqs_symptom_id ON symptom_faqs(symptom_id);

-- ===== SYMPTOM_SOURCES =====
CREATE TABLE IF NOT EXISTS symptom_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom_id uuid NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  publisher text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_symptom_sources_symptom_id ON symptom_sources(symptom_id);

-- ===== RLS: symptoms (public read) =====
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_symptoms" ON symptoms;
CREATE POLICY "public_read_symptoms" ON symptoms FOR SELECT
  TO anon, authenticated USING (true);

-- ===== RLS: symptom_faqs (public read) =====
ALTER TABLE symptom_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_symptom_faqs" ON symptom_faqs;
CREATE POLICY "public_read_symptom_faqs" ON symptom_faqs FOR SELECT
  TO anon, authenticated USING (true);

-- ===== RLS: symptom_sources (public read) =====
ALTER TABLE symptom_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_symptom_sources" ON symptom_sources;
CREATE POLICY "public_read_symptom_sources" ON symptom_sources FOR SELECT
  TO anon, authenticated USING (true);
