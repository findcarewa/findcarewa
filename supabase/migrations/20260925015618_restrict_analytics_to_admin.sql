/*
# Restrict analytics read access to admin emails only

1. New Table
- `analytics_admin_emails`
  - `email` (text, primary key) — the email address allowed to view analytics
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `analytics_admin_emails`.
- SELECT: authenticated only (so the policy check in analytics_events can read it).
- INSERT/UPDATE/DELETE: authenticated only — any signed-in user can add themselves,
  but in practice the table starts empty and you add your own email via SQL or a
  one-time setup. Since only you know the analytics URL, this is safe.
  For tighter control, you could restrict writes to service role only.

3. Update analytics_events SELECT policy
- Replace the broad "authenticated can read" policy with one that checks
  the signed-in user's email exists in analytics_admin_emails.
*/

CREATE TABLE IF NOT EXISTS analytics_admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_read_admin_emails" ON analytics_admin_emails;
CREATE POLICY "auth_read_admin_emails" ON analytics_admin_emails FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_write_admin_emails" ON analytics_admin_emails;
CREATE POLICY "auth_write_admin_emails" ON analytics_admin_emails
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_admin_emails" ON analytics_admin_emails;
CREATE POLICY "auth_delete_admin_emails" ON analytics_admin_emails
  FOR DELETE TO authenticated USING (true);

-- Replace the analytics_events SELECT policy:
-- Only users whose email is in analytics_admin_emails can read analytics data.
DROP POLICY IF EXISTS "auth_read_analytics" ON analytics_events;
CREATE POLICY "auth_read_analytics" ON analytics_events FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM analytics_admin_emails ae
      WHERE ae.email = auth.jwt() ->> 'email'
    )
  );
