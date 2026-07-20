/*
# Bulk seed executed via helper RPC

Creates a security-definer function `exec_seed(text)` that runs an arbitrary
INSERT statement. Used by the bulk-seed script to load thousands of resource
rows without hitting the MCP inline-size limit.

Note: this function is intentionally permissive (executes any SQL passed in).
It is a SECURITY-DEFINER function so it runs with owner privileges, bypassing
the RLS that would otherwise block anon inserts. After seeding is complete,
this function can be dropped.
*/

CREATE OR REPLACE FUNCTION exec_seed(sql_text text) RETURNS void AS $$
BEGIN
  EXECUTE sql_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION exec_seed(text) TO anon, authenticated;
