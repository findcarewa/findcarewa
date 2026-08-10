/*
# Polish slugs: remove redundant city duplication

## Summary
For resources where the name already contains the city (e.g., "CVS Pharmacy - Longview" in Longview),
the disambiguation step produced slugs like "cvs-pharmacy-longview-longview". 
This migration removes the redundant second city occurrence, keeping the slug clean.
For resources where this would cause a collision, the street address suffix remains.

## Changes
- Removes duplicate "{city}-{city}" patterns to just "{city}" where safe
- For same-name same-city pairs, the first entry gets just the city, the second keeps the street suffix
- Verifies no duplicate slugs remain
*/

-- For slugs that have a double city (e.g., "seattle-seattle"), remove one occurrence
-- But only for entries that have a street-address-suffixed counterpart (i.e., they're the "primary" entry)
UPDATE resources r SET slug = 
  regexp_replace(
    r.slug,
    '(' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || ')-' || 
    '\\1' || '$',
    '\\1'
  )
WHERE r.slug ~ ('-' || lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || 
  lower(regexp_replace(r.city, '[^a-zA-Z0-9]+', '-', 'g')) || '$')
-- Only do this for the "primary" entry (the one WITHOUT a street address suffix)
AND EXISTS (
  SELECT 1 FROM resources other 
  WHERE other.name = r.name 
  AND other.city = r.city 
  AND other.id != r.id
  AND other.slug LIKE r.slug || '-%'
);

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
    RAISE EXCEPTION 'Duplicate slugs still exist after polish: %', dup_count;
  END IF;
END $$;
