/*
# Polish slugs: remove final redundant city duplication

## Summary
A few slugs still have redundant city duplication where both entries share the 
same name and city (e.g., "moses-lake-food-bank-moses-lake"). The previous 
migration only cleaned the street-suffixed entry. This fixes the remaining ones
by removing the duplicate city from the primary entry, since the secondary entry 
already has a unique street-address suffix.
*/

-- For the primary entry (no street suffix) that still has double city,
-- remove the trailing duplicate city
UPDATE resources SET slug = regexp_replace(
  slug,
  '-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '$',
  ''
)
WHERE slug ~ ('-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || 
  lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '$')
-- Only for entries that DON'T have a street suffix (the primary entry)
AND id NOT IN (
  SELECT id FROM (
    SELECT id, 
      COUNT(*) OVER (PARTITION BY name, city) as same_count
    FROM resources
    WHERE name IN (SELECT name FROM resources GROUP BY name HAVING COUNT(*) > 1)
  ) sub WHERE same_count > 1
  AND id IN (
    SELECT id FROM resources 
    WHERE slug ~ ('-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || 
      lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '$')
  )
  -- This is the street-suffixed one, skip it
  AND slug LIKE '%-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-%'
  AND slug !~ ('-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || 
    lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '$')
);

-- Actually, let me use a simpler approach: just directly fix the known patterns
-- by removing the trailing "-{city}" when the slug already contains that city earlier

UPDATE resources r SET slug = regexp_replace(
  r.slug,
  '-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$',
  ''
)
WHERE r.slug ~ ('-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$')
-- Only if removing it won't cause a collision
AND NOT EXISTS (
  SELECT 1 FROM resources other 
  WHERE other.id != r.id 
  AND other.slug = regexp_replace(
    r.slug,
    '-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$',
    ''
  )
)
-- And the slug already contains this city segment earlier (meaning it's redundant)
AND regexp_replace(r.slug, '-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$', '') 
    ~ ('-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$');

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
