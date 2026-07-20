/*
# Washington State Healthcare Navigation Platform Schema

## Overview
This migration creates the database schema for an AI-powered healthcare navigation platform
that helps Washington State residents identify the most appropriate type of care and connect
them with affordable, accessible healthcare resources.

## 1. New Tables

### care_types
Reference table for the levels of care available (emergency, urgent care, primary care, etc.).
- `id` (uuid, primary key)
- `name` (text, e.g. "Emergency Room", "Urgent Care", "Telehealth")
- `slug` (text, unique — URL-friendly identifier)
- `description` (text — what this level of care is for)
- `when_to_use` (text — guidance on when to choose this option)
- `average_cost_min` / `average_cost_max` (int — typical cost range in USD without insurance)
- `wait_time_typical` (text — e.g. "Immediate", "30-60 min", "1-3 days")
- `severity_level` (int 1-5, 1 = lowest urgency, 5 = life-threatening)
- `icon` (text — lucide icon name for the UI)
- `color` (text — tailwind color token for UI theming)
- `sort_order` (int — display ordering)

### facilities
Healthcare facilities across Washington State.
- `id` (uuid, primary key)
- `name` (text — facility name)
- `care_type_id` (uuid FK → care_types)
- `description` (text — facility description)
- `address` (text — street address)
- `city` (text)
- `county` (text)
- `state` (text, default 'WA')
- `zip_code` (text)
- `latitude` / `longitude` (numeric — for proximity search)
- `phone` (text)
- `website` (text, nullable)
- `email` (text, nullable)
- `hours` (jsonb — structured hours, e.g. {"mon": "8:00-20:00", ...})
- `accepts_uninsured` (boolean)
- `sliding_scale` (boolean — offers income-based sliding scale fees)
- `mediad` (boolean — accepts Washington Medicaid / Apple Health)
- `medicare` (boolean)
- `private_insurance` (boolean)
- `walk_ins_welcome` (boolean)
- `appointments` (boolean)
- `telehealth` (boolean — offers virtual visits)
- `languages` (text[] — languages spoken beyond English)
- `accessibility` (text[] — accessibility features, e.g. "wheelchair", "as_interp")
- `cost_estimate_min` / `cost_estimate_max` (int — self-pay cost range)
- `rating` (numeric 0-5 — aggregated quality rating)
- `image_url` (text, nullable — facility photo)
- `services` (text[] — list of services offered)
- `created_at` (timestamptz)

### symptoms
Symptom catalog used by the AI care navigator to recommend care levels.
- `id` (uuid, primary key)
- `name` (text — symptom name, e.g. "Chest pain")
- `slug` (text, unique)
- `category` (text — e.g. "Cardiac", "Respiratory", "Mental Health")
- `severity_level` (int 1-5 — urgency)
- `recommended_care_type_id` (uuid FK → care_types)
- `keywords` (text[] — search keywords)
- `red_flag` (boolean — if true, this symptom needs emergency care)

### saved_searches
Lets users save their care searches. Single-tenant (no auth) so any visitor can save.
- `id` (uuid, primary key)
- `session_label` (text — a label the user gives their saved search)
- `search_params` (jsonb — the query parameters that were saved)
- `created_at` (timestamptz)

## 2. Indexes
- facilities.care_type_id — filter by care level
- facilities.county — regional filtering
- facilities.city — regional filtering
- facilities.slug (via unique)
- facilities.city, county, care_type_id composite for the directory search
- symptoms.category — symptom browsing
- symptoms.recommended_care_type_id — join for recommendations

## 3. Security (RLS)
This is a single-tenant public application — no sign-in required. All tables are read by anon
users (browsing the directory, getting care recommendations). `saved_searches` allows anon
inserts so a visitor can bookmark a search across their device.

- care_types, symptoms, facilities: SELECT to anon+authenticated (public reference data).
- saved_searches: full CRUD to anon+authenticated (a visitor's own saved searches).
- No INSERT/UPDATE/DELETE on care_types, symptoms, facilities via the anon key — they are
  curated reference data managed through the Supabase dashboard.

Important: USING(true) is acceptable here because all data is intentionally public/shared.
*/

-- ===== CARE TYPES =====
CREATE TABLE IF NOT EXISTS care_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  when_to_use text NOT NULL,
  average_cost_min integer NOT NULL DEFAULT 0,
  average_cost_max integer NOT NULL DEFAULT 0,
  wait_time_typical text NOT NULL,
  severity_level integer NOT NULL DEFAULT 3 CHECK (severity_level BETWEEN 1 AND 5),
  icon text NOT NULL DEFAULT 'Activity',
  color text NOT NULL DEFAULT 'sky',
  sort_order integer NOT NULL DEFAULT 0
);

-- ===== FACILITIES =====
CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  care_type_id uuid REFERENCES care_types(id) ON DELETE SET NULL,
  description text NOT NULL DEFAULT '',
  address text NOT NULL,
  city text NOT NULL,
  county text NOT NULL,
  state text NOT NULL DEFAULT 'WA',
  zip_code text NOT NULL,
  latitude numeric(9,6),
  longitude numeric(9,6),
  phone text NOT NULL,
  website text,
  email text,
  hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepts_uninsured boolean NOT NULL DEFAULT false,
  sliding_scale boolean NOT NULL DEFAULT false,
  medicaid boolean NOT NULL DEFAULT false,
  medicare boolean NOT NULL DEFAULT false,
  private_insurance boolean NOT NULL DEFAULT true,
  walk_ins_welcome boolean NOT NULL DEFAULT false,
  appointments boolean NOT NULL DEFAULT true,
  telehealth boolean NOT NULL DEFAULT false,
  languages text[] NOT NULL DEFAULT '{English}',
  accessibility text[] NOT NULL DEFAULT '{}',
  cost_estimate_min integer NOT NULL DEFAULT 0,
  cost_estimate_max integer NOT NULL DEFAULT 0,
  rating numeric(2,1) NOT NULL DEFAULT 4.0 CHECK (rating BETWEEN 0 AND 5),
  image_url text,
  services text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== SYMPTOMS =====
CREATE TABLE IF NOT EXISTS symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL,
  severity_level integer NOT NULL DEFAULT 3 CHECK (severity_level BETWEEN 1 AND 5),
  recommended_care_type_id uuid REFERENCES care_types(id) ON DELETE SET NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  red_flag boolean NOT NULL DEFAULT false
);

-- ===== SAVED SEARCHES =====
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_label text NOT NULL,
  search_params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_facilities_care_type ON facilities(care_type_id);
CREATE INDEX IF NOT EXISTS idx_facilities_county ON facilities(county);
CREATE INDEX IF NOT EXISTS idx_facilities_city ON facilities(city);
CREATE INDEX IF NOT EXISTS idx_facilities_search ON facilities(city, county, care_type_id);
CREATE INDEX IF NOT EXISTS idx_symptoms_category ON symptoms(category);
CREATE INDEX IF NOT EXISTS idx_symptoms_care_type ON symptoms(recommended_care_type_id);

-- ===== RLS: care_types (public read) =====
ALTER TABLE care_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_care_types" ON care_types;
CREATE POLICY "public_read_care_types" ON care_types FOR SELECT
  TO anon, authenticated USING (true);

-- ===== RLS: facilities (public read) =====
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_facilities" ON facilities;
CREATE POLICY "public_read_facilities" ON facilities FOR SELECT
  TO anon, authenticated USING (true);

-- ===== RLS: symptoms (public read) =====
ALTER TABLE symptoms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_symptoms" ON symptoms;
CREATE POLICY "public_read_symptoms" ON symptoms FOR SELECT
  TO anon, authenticated USING (true);

-- ===== RLS: saved_searches (public CRUD — single-tenant bookmark feature) =====
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_saved_searches" ON saved_searches;
CREATE POLICY "anon_select_saved_searches" ON saved_searches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_saved_searches" ON saved_searches;
CREATE POLICY "anon_insert_saved_searches" ON saved_searches FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_saved_searches" ON saved_searches;
CREATE POLICY "anon_update_saved_searches" ON saved_searches FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_saved_searches" ON saved_searches;
CREATE POLICY "anon_delete_saved_searches" ON saved_searches FOR DELETE
  TO anon, authenticated USING (true);
