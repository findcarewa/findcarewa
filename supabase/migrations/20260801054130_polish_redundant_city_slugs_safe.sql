/*
# Polish slugs: fix remaining redundant city duplication (safe approach)

## Summary
Fixes the last few slugs where the city appears twice. Only removes the 
trailing duplicate city when the resulting slug won't collide with any 
existing slug. The unique constraint protects us, but we check proactively
to avoid errors.
*/

DO $$
DECLARE
  rec RECORD;
  city_slug text;
  new_slug text;
  dup_count integer;
BEGIN
  FOR rec IN SELECT id, slug, city, name FROM resources 
  WHERE city IS NOT NULL AND city != '' 
  AND slug ~ ('-' || lower(regexp_replace(city, '[^a-zA-Z0-9]+', '-', 'g')) || '$')
  LOOP
    city_slug := lower(regexp_replace(rec.city, '[^a-zA-Z0-9]+', '-', 'g'));
    
    -- Check if removing the trailing "-{city}" would still leave the city in the slug
    -- (meaning it's a duplicate)
    new_slug := regexp_replace(rec.slug, '-' || city_slug || '$', '');
    
    -- Only proceed if the new slug still contains the city (redundant removal)
    -- AND there's a longer sibling slug (street-suffixed entry)
    IF new_slug ~ ('-' || city_slug || '$') THEN
      -- Check for collision
      SELECT COUNT(*) INTO dup_count FROM resources WHERE slug = new_slug AND id != rec.id;
      IF dup_count = 0 THEN
        -- Also check there's a sibling with same name+city and longer slug
        SELECT COUNT(*) INTO dup_count FROM resources 
        WHERE name = rec.name AND city = rec.city AND id != rec.id AND length(slug) > length(rec.slug);
        IF dup_count > 0 THEN
          UPDATE resources SET slug = new_slug WHERE id = rec.id;
        END IF;
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
