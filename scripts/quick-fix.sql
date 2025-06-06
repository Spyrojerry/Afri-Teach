-- QUICK FIX SCRIPT - Run this in Supabase SQL Editor

-- 1. Add related_id to notifications table
ALTER TABLE public.notifications 
  ADD COLUMN IF NOT EXISTS related_id TEXT;

-- 2. Create stored procedures for lesson queries to avoid timestamp formatting issues
CREATE OR REPLACE FUNCTION public.get_past_lessons(
  user_id UUID, 
  role TEXT
)
RETURNS TABLE (
  id UUID,
  subject TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  status TEXT,
  teacher_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  today DATE := CURRENT_DATE;
  current_time TIME := CURRENT_TIME;
  id_column TEXT;
BEGIN
  IF role = 'student' THEN
    id_column := 'student_id';
  ELSE
    id_column := 'teacher_id';
  END IF;

  RETURN QUERY EXECUTE format('
    SELECT 
      id, subject, date, start_time, end_time, status,
      teacher_id, student_id, created_at
    FROM lessons 
    WHERE %I = $1 
    AND (date < $2 OR (date = $2 AND end_time < $3))
    ORDER BY date DESC, start_time DESC
    LIMIT 10', id_column)
  USING user_id, today, current_time;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function for upcoming lessons
CREATE OR REPLACE FUNCTION public.get_upcoming_lessons(
  user_id UUID, 
  role TEXT
)
RETURNS TABLE (
  id UUID,
  subject TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  status TEXT,
  teacher_id UUID,
  student_id UUID,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  today DATE := CURRENT_DATE;
  id_column TEXT;
BEGIN
  IF role = 'student' THEN
    id_column := 'student_id';
  ELSE
    id_column := 'teacher_id';
  END IF;

  RETURN QUERY EXECUTE format('
    SELECT 
      id, subject, date, start_time, end_time, status,
      teacher_id, student_id, created_at
    FROM lessons 
    WHERE %I = $1 
    AND date >= $2
    AND status = ''scheduled''
    ORDER BY date ASC, start_time ASC', id_column)
  USING user_id, today;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to get teacher profile by user_id
CREATE OR REPLACE FUNCTION public.get_teacher_profile_by_user_id(
  user_id_param UUID
)
RETURNS SETOF teacher_profiles AS $$
BEGIN
  RETURN QUERY 
    SELECT * FROM teacher_profiles 
    WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql; 