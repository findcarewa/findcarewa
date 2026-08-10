/*
# Add resource slugs and remove true duplicate resources

## Summary
1. Removes 7 true duplicate resource entries (same organization, same or adjacent address)
2. Adds a `slug` column to the `resources` table
3. Generates SEO-friendly slugs from resource names, with city-based disambiguation for duplicate names
4. Adds a unique constraint on the slug column
5. Updates RLS policies for the new column (no policy changes needed — existing policies cover all columns)

## Duplicates Removed
These are entries that represent the same physical location/organization as another entry:
- Jefferson Healthcare Hospital (9cc37931...): same address 834 Sheridan St as 98de38a3...
- VA Puget Sound Health Care System - Seattle Division (ed51021b...): same address 1660 S Columbian Way as 1cb3580b...
- Tri-State Memorial Hospital (aa14675b...): same address 1221 Highland Ave as 105c8fa9...
- Comprehensive Healthcare - Yakima (b7a31d9c...): same address 402 S 4th Ave as 3b45da4c...
- Veterans Crisis Line (3a088c75...): duplicate of 2f247aba... (both Canandaigua PO Box 6000)
- Bellingham Food Bank (55348242...): adjacent address 1823 Ellis St vs 1824 Ellis St, same org
- Dayton General Hospital (b07de1ab...): adjacent address 1012 S 3rd St vs 1010 S 3rd St, same complex

## Slug Generation Strategy
- Base slug: resource name converted to URL-safe kebab-case
- If multiple resources share the same name AND same city, append a distinguishing suffix:
  - Different cities: append city name (e.g., "sea-mar-dental-clinic-seattle" vs "sea-mar-dental-clinic-vancouver")
  - Same city, different addresses: append a shortened street identifier (e.g., "ballard-food-bank-leary-way" vs "ballard-food-bank-nw-market")
  - Statewide/phone-only services: append "statewide" or keep as-is
- All slugs are unique via a unique constraint

## New Column
- `resources.slug` (text, unique) — URL-safe identifier for each resource

## Security
- No RLS policy changes needed — existing policies already cover all columns on resources table
*/

-- ─── Step 1: Remove true duplicates ─────────────────────────────────────────

-- Remove duplicate entries (keeping the more complete/original entry)
DELETE FROM resources WHERE id IN (
  '9cc37931-f80a-451f-86af-c8cc04546d3c',  -- Jefferson Healthcare Hospital (dup of 98de38a3)
  'ed51021b-dd5c-414b-9208-dac088b8cfcf',  -- VA Puget Sound (dup of 1cb3580b)
  'aa14675b-749a-4224-8430-53273da93eaa', -- Tri-State Memorial Hospital (dup of 105c8fa9)
  'b7a31d9c-45c0-4726-95e6-7b544918c7d1', -- Comprehensive Healthcare - Yakima (dup of 3b45da4c)
  '3a088c75-ab5b-4d7f-87ef-10ad0f472f48', -- Veterans Crisis Line (dup of 2f247aba, both Canandaigua)
  '55348242-1b3a-4d72-bfa1-909bff9f9e1f', -- Bellingham Food Bank (dup of 381fe882, adjacent address)
  'b07de1ab-2d39-410c-a5c5-544f15aa1e26'  -- Dayton General Hospital (dup of 9c24e2db, adjacent address)
);

-- ─── Step 2: Add slug column ────────────────────────────────────────────────

ALTER TABLE resources ADD COLUMN IF NOT EXISTS slug text;

-- ─── Step 3: Generate base slugs from names ──────────────────────────────────

UPDATE resources SET slug = lower(regexp_replace(
  regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
));

-- Trim leading/trailing hyphens
UPDATE resources SET slug = regexp_replace(slug, '^-+|-+$', '', 'g');

-- Collapse multiple hyphens
UPDATE resources SET slug = regexp_replace(slug, '-+', '-', 'g');

-- ─── Step 4: Disambiguate duplicate slugs ────────────────────────────────────

-- For resources with duplicate slugs AND different cities, append city
UPDATE resources r SET slug = r.slug || '-' || lower(regexp_replace(
  regexp_replace(r.city, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
))
WHERE r.slug IN (
  SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1
)
AND r.city IS NOT NULL AND r.city != '';

-- Clean up any double hyphens from the concatenation
UPDATE resources SET slug = regexp_replace(slug, '-+', '-', 'g');
UPDATE resources SET slug = regexp_replace(slug, '^-+|-+$', '', 'g');

-- For resources STILL sharing a slug (same name, same city), append a street identifier
-- We use a row_number to add a numeric suffix as last resort
UPDATE resources r SET slug = r.slug || '-' || (
  SELECT street_id FROM (
    SELECT
      id,
      lower(regexp_replace(
        regexp_replace(
          split_part(address, ',', 1),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )) as street_id,
      ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) as rn
    FROM resources
    WHERE slug IN (SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1)
  ) sub
  WHERE sub.id = r.id AND sub.rn > 1
)
WHERE r.slug IN (
  SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1
)
AND r.id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) as rn
    FROM resources
    WHERE slug IN (SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1)
  ) sub WHERE rn > 1
);

-- Clean up
UPDATE resources SET slug = regexp_replace(slug, '-+', '-', 'g');
UPDATE resources SET slug = regexp_replace(slug, '^-+|-+$', '', 'g');

-- For any remaining duplicates (shouldn't be any, but just in case), append row number
UPDATE resources r SET slug = r.slug || '-' || (
  SELECT rn::text FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) as rn
    FROM resources
    WHERE slug IN (SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1)
  ) sub WHERE sub.id = r.id
)
WHERE r.slug IN (
  SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1
);

-- ─── Step 5: Add unique constraint ──────────────────────────────────────────

-- First, verify no duplicates remain
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1
    ) sub;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate slugs still exist after disambiguation: %', dup_count;
  END IF;
END $$;

-- Add unique index
CREATE UNIQUE INDEX IF NOT EXISTS resources_slug_unique ON resources (slug);

-- ─── Step 6: Verify all resources have a slug ────────────────────────────────

UPDATE resources SET slug = id::text WHERE slug IS NULL OR slug = '';
