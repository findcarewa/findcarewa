/*
# Fix security issues: search path, RLS policies, and SECURITY DEFINER exposure

## Summary

This migration addresses six security findings reported by the Supabase security
advisor:

1. Function `public.handle_new_user` had a role-mutable `search_path`.
2. `public.feedback` INSERT policy `insert_feedback_anyone` used `WITH CHECK (true)`.
3. `public.resource_requests` INSERT policy `insert_requests_anyone` used `WITH CHECK (true)`.
4. `public.resources` INSERT policy `insert_resources_authenticated` used `WITH CHECK (true)`.
5. `public.resources` UPDATE policy `update_resources_authenticated` used `USING (true) WITH CHECK (true)`.
6. `public.handle_new_user()` (SECURITY DEFINER) was executable by `anon` and `authenticated` via REST.

## Changes

### 1. handle_new_user — fixed search_path + revoked public EXECUTE

- Recreate `handle_new_user()` with an explicit `search_path = public` so a
  hostile role cannot hijack object resolution inside the trigger.
- `REVOKE EXECUTE` from `public`, `anon`, and `authenticated`. This function is
  a trigger handler invoked only by the database during user creation; it must
  not be callable via `/rest/v1/rpc/handle_new_user`. The trigger still fires
  because triggers execute with the function owner's privileges regardless of
  role-level EXECUTE grants.

### 2. feedback — tighten INSERT policy

- Drop `insert_feedback_anyone` (WITH CHECK true) and replace it with
  `insert_feedback_public`, which allows anon + authenticated to insert a row
  only when `submitted_by` is null OR matches the authenticated user's id.
  This prevents a caller from attributing feedback to another user while
  keeping the public feedback form fully functional (the frontend never sets
  `submitted_by`, so anon submissions still succeed).

### 3. resource_requests — tighten INSERT policy

- Same pattern as feedback: drop `insert_requests_anyone` and replace with
  `insert_requests_public` enforcing `submitted_by IS NULL OR submitted_by = auth.uid()`.

### 4. resources — remove permissive INSERT and UPDATE policies

- The frontend only reads `resources`; no app code inserts or updates them.
  Drop `insert_resources_authenticated` and `update_resources_authenticated`
  so authenticated users cannot arbitrarily create or overwrite resource rows.
  Resource data continues to be managed through migrations (service role,
  which bypasses RLS). The `select_resources_public` read policy is retained.

## Security impact

- `handle_new_user` is no longer reachable via REST and has a pinned search_path.
- Public feedback/request forms still work, but can no longer spoof `submitted_by`.
- Authenticated users can no longer insert or update arbitrary `resources` rows.
- No data is lost or renamed; only policies and the function definition change.
*/

-- 1. Fix handle_new_user: pin search_path and revoke EXECUTE from anon/authenticated
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO user_profiles (id, display_name)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 2. feedback: replace permissive INSERT policy
DROP POLICY IF EXISTS "insert_feedback_anyone" ON public.feedback;
CREATE POLICY "insert_feedback_public" ON public.feedback
  FOR INSERT TO anon, authenticated
  WITH CHECK (submitted_by IS NULL OR submitted_by = auth.uid());

-- 3. resource_requests: replace permissive INSERT policy
DROP POLICY IF EXISTS "insert_requests_anyone" ON public.resource_requests;
CREATE POLICY "insert_requests_public" ON public.resource_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (submitted_by IS NULL OR submitted_by = auth.uid());

-- 4. resources: drop permissive INSERT and UPDATE policies
DROP POLICY IF EXISTS "insert_resources_authenticated" ON public.resources;
DROP POLICY IF EXISTS "update_resources_authenticated" ON public.resources;
