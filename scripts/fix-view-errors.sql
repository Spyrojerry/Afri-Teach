-- Drop existing views if they exist
DROP VIEW IF EXISTS student_profiles;
DROP VIEW IF EXISTS teacher_profiles;

-- Create teacher_profiles view
CREATE VIEW teacher_profiles AS
SELECT 
  t.id,
  t.id AS user_id,
  (t.first_name || ' ' || t.last_name) AS full_name,
  t.profile_picture_url AS avatar_url,
  t.bio,
  t.experience,
  t.average_rating AS rating,
  NULL::TEXT[] AS subjects,
  NULL::NUMERIC AS hourly_rate,
  0 AS review_count,
  NULL::TEXT AS country,
  NULL::TEXT[] AS languages,
  NULL::TEXT AS education,
  t.created_at
FROM 
  teachers t;

-- Create student_profiles view
CREATE VIEW student_profiles AS
SELECT 
  s.id,
  s.id AS user_id,
  (s.first_name || ' ' || s.last_name) AS full_name,
  s.profile_picture_url AS avatar_url,
  NULL::TEXT AS bio,
  s.learning_preferences,
  s.created_at
FROM 
  students s;

-- Create separate function to handle policies since they might fail if RLS not enabled
CREATE OR REPLACE FUNCTION apply_view_policies()
RETURNS VOID AS $$
BEGIN
  -- Try to enable RLS and apply policies to teacher_profiles
  BEGIN
    ALTER VIEW teacher_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow access to teacher_profiles view" ON teacher_profiles;
    CREATE POLICY "Allow access to teacher_profiles view" ON teacher_profiles
      FOR ALL TO authenticated
      USING (true);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not apply policy to teacher_profiles: %', SQLERRM;
  END;
  
  -- Try to enable RLS and apply policies to student_profiles
  BEGIN
    ALTER VIEW student_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow access to student_profiles view" ON student_profiles;
    CREATE POLICY "Allow access to student_profiles view" ON student_profiles
      FOR ALL TO authenticated
      USING (true);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not apply policy to student_profiles: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql; 