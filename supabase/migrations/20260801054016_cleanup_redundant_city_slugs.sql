/*
# Clean up redundant city names in slugs

## Summary
Some slugs have the city name appearing twice (e.g., "northwest-justice-project-seattle-seattle")
because the resource name already includes the city and the disambiguation step appended it again.
This migration removes the redundant city suffix where the base slug already ends with the city name.

## Changes
- Removes duplicate city suffix from slugs where the name already contains the city
- Re-collapses hyphens and trims
- Verifies no duplicate slugs remain after cleanup
*/

-- Remove redundant city from slugs where the slug ends with "{city}-{city}"
UPDATE resources r SET slug = (
  regexp_replace(
    regexp_replace(
      r.slug,
      '-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$',
      ''
    ),
    '-+', '-', 'g'
  )
)
WHERE r.slug ~ ('-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$')
AND r.id NOT IN (
  SELECT id FROM (
    SELECT id, name, city, 
      COUNT(*) OVER (PARTITION BY name, city) as same_name_city_count
    FROM resources
    WHERE name IN (SELECT name FROM resources GROUP BY name HAVING COUNT(*) > 1)
  ) dup WHERE same_name_city_count > 1
)
-- Only shorten if it won't collide with an existing slug
AND NOT EXISTS (
  SELECT 1 FROM resources other 
  WHERE other.id != r.id 
  AND other.slug = regexp_replace(
    regexp_replace(
      r.slug,
      '-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$',
      ''
    ),
    '-+', '-', 'g'
  )
);

-- Trim
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
    RAISE EXCEPTION 'Duplicate slugs still exist after cleanup: %', dup_count;
  END IF;
END $$;
