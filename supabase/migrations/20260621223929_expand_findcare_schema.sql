/*
# FindCare: Expanded resource schema with rich metadata

## Overview
Expands the healthcare navigation platform to support 1,500+ resources across
hospitals, primary care, specialists, dental, mental health, crisis lines,
substance use, free clinics, FQHCs, community organizations, food banks,
transportation assistance, and insurance assistance.

## 1. New Tables

### resource_categories
Reference table for the broad categories of resources.
- `id` (uuid, primary key)
- `name` (text — e.g. "Primary Care Clinic", "Food Bank")
- `slug` (text, unique)
- `description` (text)
- `icon` (text — lucide icon name)
- `color` (text — tailwind color token)
- `sort_order` (int)

### resources
Generalized table replacing the old `facilities` table. Supports every category
with rich metadata for AI search and filtering.
- `id` (uuid, primary key)
- `name` (text)
- `category_id` (uuid FK → resource_categories)
- `subcategory` (text — e.g. "Cardiology" under "Specialist", "Food Pantry" under "Food Bank")
- `description` (text)
- `address`, `city`, `county`, `state`, `zip_code`, `latitude`, `longitude`
- `phone`, `website`, `email`
- `hours` (jsonb)
- `accepts_uninsured`, `sliding_scale`, `medicaid`, `medicare`, `private_insurance`
- `walk_ins_welcome`, `appointments`, `telehealth`
- `cost_free` (boolean — explicitly free service)
- `cost_estimate_min`, `cost_estimate_max` (int)
- `languages` (text[])
- `accessibility` (text[])
- `services` (text[])
- `specialties` (text[] — e.g. ["Cardiology","Electrophysiology"])
- `audiences` (text[] — e.g. ["Pediatrics","LGBTQ+","Veterans"])
- `rating` (numeric 0-5)
- `photo_url` (text — Pexels image URL for real clinic photos)
- `search_text` (text — denormalized lowercase text for full-text search)
- `created_at` (timestamptz)

### resource_requests
Form submissions from users requesting resources be added.
- `id` (uuid, primary key)
- `category` (text)
- `name` (text — the resource being requested)
- `city` (text)
- `details` (text)
- `contact_email` (text, nullable)
- `created_at` (timestamptz)

### feedback
User feedback on the platform / specific resources.
- `id` (uuid, primary key)
- `resource_id` (uuid, nullable — if feedback is about a specific resource)
- `feedback_type` (text — "suggestion"|"report_issue"|"praise"|"data_correction")
- `message` (text)
- `contact_email` (text, nullable)
- `created_at` (timestamptz)

### saved_searches
Kept from original schema for bookmarking searches.

## 2. Full-Text Search
Adds a GIN index on `search_text` for fast keyword matching in AI search.
A trigger denormalizes key fields into `search_text` on insert/update.

## 3. Indexes
- resources.category_id, resources.city, resources.county
- resources on (city, county, category_id) composite

## 4. Security (RLS)
All tables are public-read (single-tenant). resource_requests and feedback
allow anon inserts (form submissions). No auth required.
*/

-- ===== RESOURCE CATEGORIES =====
CREATE TABLE IF NOT EXISTS resource_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Building2',
  color text NOT NULL DEFAULT 'teal',
  sort_order integer NOT NULL DEFAULT 0
);

-- ===== RESOURCES =====
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid REFERENCES resource_categories(id) ON DELETE SET NULL,
  subcategory text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  city text NOT NULL,
  county text NOT NULL,
  state text NOT NULL DEFAULT 'WA',
  zip_code text NOT NULL DEFAULT '',
  latitude numeric(9,6),
  longitude numeric(9,6),
  phone text NOT NULL DEFAULT '',
  website text,
  email text,
  hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepts_uninsured boolean NOT NULL DEFAULT false,
  sliding_scale boolean NOT NULL DEFAULT false,
  medicaid boolean NOT NULL DEFAULT false,
  medicare boolean NOT NULL DEFAULT false,
  private_insurance boolean NOT NULL DEFAULT false,
  walk_ins_welcome boolean NOT NULL DEFAULT false,
  appointments boolean NOT NULL DEFAULT true,
  telehealth boolean NOT NULL DEFAULT false,
  cost_free boolean NOT NULL DEFAULT false,
  cost_estimate_min integer NOT NULL DEFAULT 0,
  cost_estimate_max integer NOT NULL DEFAULT 0,
  languages text[] NOT NULL DEFAULT '{English}',
  accessibility text[] NOT NULL DEFAULT '{}',
  services text[] NOT NULL DEFAULT '{}',
  specialties text[] NOT NULL DEFAULT '{}',
  audiences text[] NOT NULL DEFAULT '{}',
  rating numeric(2,1) NOT NULL DEFAULT 4.0 CHECK (rating BETWEEN 0 AND 5),
  photo_url text,
  search_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== RESOURCE REQUESTS =====
CREATE TABLE IF NOT EXISTS resource_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  details text NOT NULL DEFAULT '',
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== FEEDBACK =====
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid,
  feedback_type text NOT NULL DEFAULT 'suggestion',
  message text NOT NULL,
  contact_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== SEARCH TEXT TRIGGER =====
-- Denormalize searchable fields into search_text for fast AI-style search
CREATE OR REPLACE FUNCTION update_resource_search_text() RETURNS trigger AS $$
BEGIN
  NEW.search_text := lower(
    coalesce(NEW.name, '') || ' ' ||
    coalesce(NEW.subcategory, '') || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(NEW.address, '') || ' ' ||
    coalesce(NEW.city, '') || ' ' ||
    coalesce(NEW.county, '') || ' ' ||
    coalesce(NEW.zip_code, '') || ' ' ||
    coalesce(array_to_string(NEW.services, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.specialties, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.languages, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.audiences, ' '), '') || ' ' ||
    coalesce(array_to_string(NEW.accessibility, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resource_search_text ON resources;
CREATE TRIGGER trg_resource_search_text
  BEFORE INSERT OR UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_resource_search_text();

-- ===== INDEXES =====
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_city ON resources(city);
CREATE INDEX IF NOT EXISTS idx_resources_county ON resources(county);
CREATE INDEX IF NOT EXISTS idx_resources_search ON resources(city, county, category_id);
CREATE INDEX IF NOT EXISTS idx_resources_search_text ON resources USING gin (to_tsvector('simple', search_text));
CREATE INDEX IF NOT EXISTS idx_resources_languages ON resources USING gin (languages);
CREATE INDEX IF NOT EXISTS idx_resources_specialties ON resources USING gin (specialties);
CREATE INDEX IF NOT EXISTS idx_resources_location ON resources(latitude, longitude) WHERE latitude IS NOT NULL;

-- ===== RLS: resource_categories (public read) =====
ALTER TABLE resource_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON resource_categories;
CREATE POLICY "public_read_categories" ON resource_categories FOR SELECT
  TO anon, authenticated USING (true);

-- ===== RLS: resources (public read) =====
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_resources" ON resources;
CREATE POLICY "public_read_resources" ON resources FOR SELECT
  TO anon, authenticated USING (true);

-- ===== RLS: resource_requests (public read + anon insert) =====
ALTER TABLE resource_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_requests" ON resource_requests;
CREATE POLICY "anon_select_requests" ON resource_requests FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_requests" ON resource_requests;
CREATE POLICY "anon_insert_requests" ON resource_requests FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- ===== RLS: feedback (public read + anon insert) =====
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_feedback" ON feedback;
CREATE POLICY "anon_select_feedback" ON feedback FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_feedback" ON feedback;
CREATE POLICY "anon_insert_feedback" ON feedback FOR INSERT
  TO anon, authenticated WITH CHECK (true);
