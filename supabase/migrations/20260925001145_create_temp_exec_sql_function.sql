
CREATE OR REPLACE FUNCTION public._temp_exec_sql(sql_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_text;
  RETURN 'OK';
END;
$$;

GRANT EXECUTE ON FUNCTION public._temp_exec_sql(text) TO anon, authenticated;
