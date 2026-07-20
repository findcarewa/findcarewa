-- Add tags array for exact-token search and a generated search_text column
-- for deterministic hybrid search (zip + exact token + category).
ALTER TABLE resources ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE resources ADD COLUMN IF NOT EXISTS search_text text;

-- Populate tags from existing services + specialties + audiences + subcategory
UPDATE resources
SET tags = ARRAY(
  SELECT DISTINCT lower(trim(x))
  FROM unnest(
    services || specialties || audiences || ARRAY[subcategory]
  ) AS x
  WHERE x IS NOT NULL AND x <> ''
);

-- Populate a denormalized search_text for fast exact-token matching
UPDATE resources
SET search_text = lower(
  coalesce(name, '') || ' ' ||
  coalesce(subcategory, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(city, '') || ' ' ||
  coalesce(county, '') || ' ' ||
  coalesce(zip_code, '') || ' ' ||
  coalesce(address, '') || ' ' ||
  coalesce(array_to_string(services, ' '), '') || ' ' ||
  coalesce(array_to_string(specialties, ' '), '') || ' ' ||
  coalesce(array_to_string(audiences, ' '), '') || ' ' ||
  coalesce(array_to_string(languages, ' '), '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '')
);

-- Index for zip lookups
CREATE INDEX IF NOT EXISTS idx_resources_zip_code ON resources (zip_code);
-- Index for search_text full-text-ish token matching
CREATE INDEX IF NOT EXISTS idx_resources_search_text ON resources USING gin (to_tsvector('simple', coalesce(search_text, '')));
