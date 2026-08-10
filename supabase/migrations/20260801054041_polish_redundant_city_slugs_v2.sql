/*
# Polish slugs: remove all remaining redundant city duplication

## Summary
Some slugs still have the city name appearing twice (e.g., "cvs-pharmacy-longview-longview").
This migration removes the trailing duplicate city segment from all affected slugs.
For resources where this would cause a collision, the street address suffix already distinguishes them.

## Changes
- For all slugs ending with "{city}-{city}", removes one occurrence of the city
- For entries that also have a street suffix (e.g., "cvs-pharmacy-longview-longview-1107-ocean-beach-hwy"),
  removes the duplicate city from the middle
- Verifies no duplicate slugs remain
*/

-- Step 1: For slugs ending with exactly "{city}-{city}", remove the trailing duplicate
-- e.g., "cvs-pharmacy-longview-longview" -> "cvs-pharmacy-longview"
UPDATE resources SET slug = regexp_replace(
  slug,
  '(' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || ')-\\1$',
  '\\1'
)
WHERE slug ~ ('-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || 
  lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '$');

-- Step 2: For slugs with "{city}-{city}-" in the middle (followed by street address),
-- remove the duplicate city. e.g., "cvs-pharmacy-longview-longview-1107-..." -> "cvs-pharmacy-longview-1107-..."
UPDATE resources SET slug = regexp_replace(
  slug,
  '(' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || ')-\\1-',
  '\\1-'
)
WHERE slug ~ ('-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || 
  lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-');

-- Clean up
UPDATE resources SET slug = regexp_replace(slug, '^-+|-+$', '', 'g');
UPDATE resources SET slug = regexp_replace(slug, '-+', '-', 'g');

-- Verify no duplicates
DO $$
DECLARE
  dup_count integer;
BEGIN
  SELECT COUNT(*) INTO dup_count FROM (
    SELECT slug FROM resources GROUP BY slug HAVING COUNT(*) > 1
  ) sub;
  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Duplicate slugs still exist: %', dup_count;
  END IF;
END $$;
