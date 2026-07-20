/*
# Drop temporary bulk-seed helper function
Removes exec_seed(text) — was only needed for the initial bulk data load.
*/
DROP FUNCTION IF EXISTS exec_seed(text);
