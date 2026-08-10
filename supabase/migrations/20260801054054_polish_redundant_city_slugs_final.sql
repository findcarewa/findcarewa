/*
# Polish slugs: remove redundant city duplication (final pass)

## Summary
Some slugs still have the city name appearing twice because the resource name 
already contains the city (e.g., "CVS Pharmacy - Longview" in Longview produces
"cvs-pharmacy-longview-longview"). This migration removes the redundant duplicate.

## Approach
Use a PL/pgSQL block to process each affected row individually, constructing the
cleaned slug by removing the trailing or middle duplicate city segment.
*/

DO $$
DECLARE
  rec RECORD;
  city_slug text;
  new_slug text;
  dup_count integer;
BEGIN
  FOR rec IN SELECT id, slug, city FROM resources WHERE city IS NOT NULL AND city != '' LOOP
    city_slug := lower(regexp_replace(rec.city, '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- Check if slug ends with "-{city}-{city}"
    IF rec.slug ~ ('-' || city_slug || '-' || city_slug || '$') THEN
      -- Remove the trailing duplicate "-{city}"
      new_slug := regexp_replace(rec.slug, '-' || city_slug || '$', '');
      -- Check if this would collide
      SELECT COUNT(*) INTO dup_count FROM resources WHERE slug = new_slug AND id != rec.id;
      IF dup_count = 0 THEN
        UPDATE resources SET slug = new_slug WHERE id = rec.id;
      END IF;
    END IF;
    
    -- Check if slug has "-{city}-{city}-" in the middle (followed by street address)
    IF rec.slug ~ ('-' || city_slug || '-' || city_slug || '-') THEN
      -- Remove the first duplicate "{city}-" from the middle
      new_slug := regexp_replace(rec.slug, '(' || city_slug || ')-' || city_slug || '-', '\\1-', 'g');
      -- Check if this would collide
      SELECT COUNT(*) INTO dup_count FROM resources WHERE slug = new_slug AND id != rec.id;
      IF dup_count = 0 THEN
        UPDATE resources SET slug = new_slug WHERE id = rec.id;
      END IF;
    END IF;
  END LOOP;
END $$;

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
