-- Fix Functions and Queries for New Schema
-- This script adds database functions and fixes tables to support existing services

-- 1. Add title column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;

-- 2. Rename related_entity_id to related_id for backward compatibility
ALTER TABLE public.notifications 
RENAME COLUMN related_entity_id TO related_id;

-- 3. Create get_upcoming_lessons function
CREATE OR REPLACE FUNCTION public.get_upcoming_lessons(
  role TEXT,
  user_id UUID
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
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    l.title AS subject,
    (b.start_time_utc AT TIME ZONE 'UTC')::DATE AS date,
    (b.start_time_utc AT TIME ZONE 'UTC')::TIME AS start_time,
    (b.end_time_utc AT TIME ZONE 'UTC')::TIME AS end_time,
    b.status,
    b.teacher_id,
    b.student_id,
    b.created_at
  FROM 
    bookings b
  JOIN
    lessons l ON b.lesson_id = l.id
  WHERE 
    (role = 'student' AND b.student_id = user_id) OR
    (role = 'teacher' AND b.teacher_id = user_id)
  AND
    b.status IN ('pending', 'confirmed')
  AND
    b.start_time_utc > NOW()
  ORDER BY
    b.start_time_utc ASC;
END;
$$ LANGUAGE plpgsql;

-- 4. Create get_past_lessons function
CREATE OR REPLACE FUNCTION public.get_past_lessons(
  role TEXT,
  user_id UUID
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
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    l.title AS subject,
    (b.start_time_utc AT TIME ZONE 'UTC')::DATE AS date,
    (b.start_time_utc AT TIME ZONE 'UTC')::TIME AS start_time,
    (b.end_time_utc AT TIME ZONE 'UTC')::TIME AS end_time,
    b.status,
    b.teacher_id,
    b.student_id,
    b.created_at
  FROM 
    bookings b
  JOIN
    lessons l ON b.lesson_id = l.id
  WHERE 
    (role = 'student' AND b.student_id = user_id) OR
    (role = 'teacher' AND b.teacher_id = user_id)
  AND
    (b.status = 'completed' OR b.start_time_utc < NOW())
  ORDER BY
    b.start_time_utc DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Create temporary function to fix teacher profiles query until service is updated
CREATE OR REPLACE FUNCTION get_teacher_profile_info(teacher_ids UUID[])
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    (t.first_name || ' ' || t.last_name) AS full_name,
    t.profile_picture_url AS avatar_url
  FROM 
    teachers t
  WHERE 
    t.id = ANY(teacher_ids);
END;
$$ LANGUAGE plpgsql;

-- 6. Create temporary function to fix student profiles query until service is updated
CREATE OR REPLACE FUNCTION get_student_profile_info(student_ids UUID[])
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    (s.first_name || ' ' || s.last_name) AS full_name,
    s.profile_picture_url AS avatar_url
  FROM 
    students s
  WHERE 
    s.id = ANY(student_ids);
END;
$$ LANGUAGE plpgsql;

-- 7. Create views to maintain backward compatibility
DROP VIEW IF EXISTS teacher_profiles;
DROP VIEW IF EXISTS student_profiles;

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

-- 8. Fix getLessonStats function
CREATE OR REPLACE FUNCTION get_lesson_stats(
  user_id UUID,
  role TEXT
)
RETURNS JSON AS $$
DECLARE
  upcoming_count INTEGER;
  completed_count INTEGER;
  unique_connections INTEGER;
  total_hours INTEGER;
  result JSON;
BEGIN
  -- Get upcoming bookings count
  SELECT COUNT(*) INTO upcoming_count
  FROM bookings
  WHERE 
    (role = 'student' AND student_id = user_id) OR
    (role = 'teacher' AND teacher_id = user_id)
  AND
    status IN ('pending', 'confirmed')
  AND
    start_time_utc > NOW();
    
  -- Get completed bookings count
  SELECT COUNT(*) INTO completed_count
  FROM bookings
  WHERE 
    (role = 'student' AND student_id = user_id) OR
    (role = 'teacher' AND teacher_id = user_id)
  AND
    status = 'completed';
    
  -- Get unique connections count
  IF role = 'student' THEN
    SELECT COUNT(DISTINCT teacher_id) INTO unique_connections
    FROM bookings
    WHERE student_id = user_id;
  ELSE
    SELECT COUNT(DISTINCT student_id) INTO unique_connections
    FROM bookings
    WHERE teacher_id = user_id;
  END IF;
  
  -- Calculate total hours from lesson durations
  SELECT COALESCE(SUM(l.duration_minutes) / 60, 0) INTO total_hours
  FROM bookings b
  JOIN lessons l ON b.lesson_id = l.id
  WHERE 
    (role = 'student' AND b.student_id = user_id) OR
    (role = 'teacher' AND b.teacher_id = user_id)
  AND
    b.status = 'completed';
    
  -- Build result JSON
  result := json_build_object(
    'upcomingLessons', COALESCE(upcoming_count, 0),
    'completedLessons', COALESCE(completed_count, 0),
    'uniqueConnections', COALESCE(unique_connections, 0),
    'totalHours', COALESCE(total_hours, 0)
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. Create or update lesson functions to use new schema
CREATE OR REPLACE FUNCTION create_lesson(
  teacher_id UUID,
  subject_id UUID,
  title TEXT,
  description TEXT,
  duration_minutes INTEGER,
  price_usd NUMERIC,
  is_group_lesson BOOLEAN DEFAULT false,
  max_students INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_lesson_id UUID;
BEGIN
  INSERT INTO lessons (
    teacher_id, 
    subject_id, 
    title, 
    description, 
    duration_minutes, 
    price_usd, 
    is_group_lesson, 
    max_students
  ) VALUES (
    teacher_id, 
    subject_id, 
    title, 
    description, 
    duration_minutes, 
    price_usd, 
    is_group_lesson, 
    max_students
  )
  RETURNING id INTO new_lesson_id;
  
  RETURN new_lesson_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Create teacher earnings function to avoid relationship conflicts
CREATE OR REPLACE FUNCTION get_teacher_earnings(
  teacher_id UUID
)
RETURNS JSON AS $$
DECLARE
  total_earnings NUMERIC := 0;
  this_month_earnings NUMERIC := 0;
  last_month_earnings NUMERIC := 0;
  pending_payouts NUMERIC := 0;
  curr_month TEXT;
  last_month TEXT;
BEGIN
  -- Get current month in 'YYYY-MM' format
  curr_month := to_char(current_date, 'YYYY-MM');
  
  -- Get last month in 'YYYY-MM' format
  last_month := to_char((current_date - interval '1 month'), 'YYYY-MM');
  
  -- Calculate total earnings
  SELECT COALESCE(SUM(p.teacher_payout_usd), 0)
  INTO total_earnings
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  WHERE b.teacher_id = get_teacher_earnings.teacher_id
  AND p.status IN ('paid', 'payout_completed');
  
  -- Calculate this month's earnings
  SELECT COALESCE(SUM(p.teacher_payout_usd), 0)
  INTO this_month_earnings
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  WHERE b.teacher_id = get_teacher_earnings.teacher_id
  AND p.status IN ('paid', 'payout_completed')
  AND to_char(p.created_at, 'YYYY-MM') = curr_month;
  
  -- Calculate last month's earnings
  SELECT COALESCE(SUM(p.teacher_payout_usd), 0)
  INTO last_month_earnings
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  WHERE b.teacher_id = get_teacher_earnings.teacher_id
  AND p.status IN ('paid', 'payout_completed')
  AND to_char(p.created_at, 'YYYY-MM') = last_month;
  
  -- Calculate pending payouts
  SELECT COALESCE(SUM(p.teacher_payout_usd), 0)
  INTO pending_payouts
  FROM payments p
  JOIN bookings b ON p.booking_id = b.id
  WHERE b.teacher_id = get_teacher_earnings.teacher_id
  AND p.status = 'pending_payout';
  
  -- Return as JSON
  RETURN json_build_object(
    'total_earnings', total_earnings,
    'this_month_earnings', this_month_earnings,
    'last_month_earnings', last_month_earnings,
    'pending_payouts', pending_payouts
  );
END;
$$ LANGUAGE plpgsql; 