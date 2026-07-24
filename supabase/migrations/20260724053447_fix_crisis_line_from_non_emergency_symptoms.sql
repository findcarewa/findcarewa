-- Remove 'crisis-line' from non-emergency symptoms that should NOT recommend crisis lines.
-- Only truly emergency/red-flag symptoms (suicidal thoughts, chest pain, shortness of breath)
-- should include crisis-line as a recommended category.
-- Anxiety, depression, and panic attacks are common mental health conditions — users searching
-- for these should see mental health providers, not a wall of crisis hotlines.

UPDATE symptoms
SET category_slugs = array_remove(category_slugs, 'crisis-line'),
    updated_at = now()
WHERE slug IN ('anxiety', 'depression', 'panic-attacks')
  AND 'crisis-line' = ANY(category_slugs);
