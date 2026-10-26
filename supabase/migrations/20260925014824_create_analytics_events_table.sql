/*
# Create privacy-friendly analytics events table

1. New Tables
- `analytics_events`
  - `id` (uuid, primary key)
  - `event_type` (text, not null) — e.g. 'page_view', 'search', 'resource_view', 'map_view', 'feedback_submit'
  - `page` (text, nullable) — the page/route name or resource slug
  - `search_query` (text, nullable) — search term (only for search events; stored as-is with no user association)
  - `result_count` (integer, nullable) — number of results returned for search events
  - `category_slug` (text, nullable) — category filter used
  - `city_filter` (text, nullable) — city filter used
  - `session_hash` (text, nullable) — non-reversible hash of a daily random session ID for counting unique visitors without identifying anyone
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `analytics_events`.
- INSERT: allow anon + authenticated (anyone can log events).
- SELECT: authenticated only (only signed-in users can read analytics).
- No UPDATE or DELETE policies — events are append-only.

3. Privacy notes
- No IP addresses, user agents, or user IDs are stored.
- The session_hash is a SHA-256 hash of a random per-session token that changes daily, making it impossible to link back to a person.
- Search queries are stored without any session or user association for aggregate trend analysis only.
*/

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  page text,
  search_query text,
  result_count integer,
  category_slug text,
  city_filter text,
  session_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (anon + authenticated)
DROP POLICY IF EXISTS "anon_insert_analytics" ON analytics_events;
CREATE POLICY "anon_insert_analytics" ON analytics_events FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Only authenticated users can read analytics (for the dashboard)
DROP POLICY IF EXISTS "auth_read_analytics" ON analytics_events;
CREATE POLICY "auth_read_analytics" ON analytics_events FOR SELECT
  TO authenticated USING (true);

-- Index for common dashboard queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON analytics_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events (created_at DESC);
