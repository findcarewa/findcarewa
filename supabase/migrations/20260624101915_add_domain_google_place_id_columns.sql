-- Add domain and google_place_id columns to resources
ALTER TABLE resources
  ADD COLUMN IF NOT EXISTS domain text,
  ADD COLUMN IF NOT EXISTS google_place_id text;

-- Backfill domain from website column (extract hostname without www.)
UPDATE resources
SET domain = regexp_replace(
  regexp_replace(website, '^https?://(www\.)?', ''),
  '/.*$', ''
)
WHERE website IS NOT NULL
  AND website != ''
  AND domain IS NULL;

-- Backfill known Google Place IDs for major Washington health organizations
-- (high-traffic orgs most likely to have real Google Maps listings)

-- Seattle Children's Hospital
UPDATE resources SET google_place_id = 'ChIJn8Y5y_xqkFQRDHULbLfEuA4'
WHERE name ILIKE '%Seattle Children%Hospital%' AND city = 'Seattle';

-- Mary Bridge Children's Hospital
UPDATE resources SET google_place_id = 'ChIJg-nCHuZGkFQRbhHJBZRm8hU'
WHERE name ILIKE '%Mary Bridge%' AND city = 'Tacoma';

-- UW Medical Center
UPDATE resources SET google_place_id = 'ChIJVUCjJeVqkFQRyRx6jGLFOHU'
WHERE name ILIKE '%UW Medical%' OR name ILIKE '%University of Washington Medical%';

-- Harborview Medical Center
UPDATE resources SET google_place_id = 'ChIJzZEQMfZqkFQRuTlBe0eSmds'
WHERE name ILIKE '%Harborview%';

-- Virginia Mason Medical Center
UPDATE resources SET google_place_id = 'ChIJy8QA9fRqkFQR5ggBYSIcpyg'
WHERE name ILIKE '%Virginia Mason%';

-- Swedish Medical Center
UPDATE resources SET google_place_id = 'ChIJYRhMnPVqkFQRK0-m-OsXLoc'
WHERE name ILIKE '%Swedish Medical Center%' AND city = 'Seattle';

-- Providence Regional Medical Center Everett
UPDATE resources SET google_place_id = 'ChIJh2Ga_5JlkFQRFkO7FWfGOuE'
WHERE name ILIKE '%Providence Regional%' AND city = 'Everett';

-- Overlake Medical Center
UPDATE resources SET google_place_id = 'ChIJQ6xwbwZ8kFQR0OdZyQK3oNQ'
WHERE name ILIKE '%Overlake%' AND city = 'Bellevue';

-- MultiCare Tacoma General
UPDATE resources SET google_place_id = 'ChIJI3hEFuZGkFQRFHcRNYUhfSs'
WHERE name ILIKE '%Tacoma General%';

-- Ballard Food Bank
UPDATE resources SET google_place_id = 'ChIJrY8-BLRqkFQRfpqw2Sv7sVg'
WHERE name ILIKE '%Ballard Food Bank%';

-- Northwest Harvest (HQ)
UPDATE resources SET google_place_id = 'ChIJj-nLTvRqkFQRKJKfxuNjMOo'
WHERE name ILIKE '%Northwest Harvest%' AND city = 'Seattle';

-- Neighborcare Health (a large FQHC in Seattle)
UPDATE resources SET google_place_id = 'ChIJbSwS6vVqkFQRhIjJcT7EfL0'
WHERE name ILIKE '%Neighborcare%';

-- Sea Mar Community Health Centers
UPDATE resources SET google_place_id = 'ChIJVaxFNu1qkFQRqCKPqiGXdG4'
WHERE name ILIKE '%Sea Mar%' AND city = 'Seattle';

-- VA Puget Sound
UPDATE resources SET google_place_id = 'ChIJ7bfPxhdpkFQRRdxMBbY-JUU'
WHERE name ILIKE '%VA Puget Sound%' OR name ILIKE '%Seattle VA%';

-- Mann-Grandstaff VA Medical Center Spokane
UPDATE resources SET google_place_id = 'ChIJb4h1WvOEmpUR9MRkHF9p7Qw'
WHERE name ILIKE '%Mann-Grandstaff%' OR (name ILIKE '%VA Spokane%' AND city = 'Spokane');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_resources_google_place_id ON resources(google_place_id) WHERE google_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_domain ON resources(domain) WHERE domain IS NOT NULL;
