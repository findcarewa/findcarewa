CREATE OR REPLACE FUNCTION exec_seed(sql_text text) RETURNS void AS $$
BEGIN
  EXECUTE sql_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION exec_seed(text) TO anon, authenticated;
