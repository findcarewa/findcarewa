/*
# Add reviewed_at column to symptoms table

1. Modified Tables
- `symptoms`
  - Adds `reviewed_at` (timestamptz, nullable) to track when each symptom's
    content was last reviewed by an editorial team member.
  - Backfills `reviewed_at` to `updated_at` for all existing rows so every
    symptom has an initial review date.

2. Security
- No RLS policy changes. The symptoms table is already readable by anon/authenticated.
- This column is informational only and does not affect access control.

3. Important Notes
- The column is nullable so future rows can be created without a review date;
  the UI will hide the "Last reviewed" line when `reviewed_at` is null.
- Backfill uses `updated_at` as the best available proxy for last review.
*/

ALTER TABLE symptoms
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

UPDATE symptoms
  SET reviewed_at = updated_at
  WHERE reviewed_at IS NULL;