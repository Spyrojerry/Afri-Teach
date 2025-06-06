-- Create a function that allows executing arbitrary SQL
-- This function requires superuser privileges
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 