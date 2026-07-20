-- Clear stale Google Place IDs - they expire and need to be refreshed
-- The app will fetch fresh ones via TextSearch when needed
UPDATE resources SET google_place_id = NULL WHERE google_place_id IS NOT NULL;