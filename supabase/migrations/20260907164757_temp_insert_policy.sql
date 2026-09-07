CREATE POLICY "temp_insert_resources" ON resources FOR INSERT
  TO anon, authenticated WITH CHECK (true);