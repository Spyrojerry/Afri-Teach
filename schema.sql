-- Afri-Teach Database Schema Setup
-- This file contains SQL to create the booking-related tables

-- Ensure the necessary extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Students
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_picture_url TEXT,
  bio TEXT,
  time_zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Table: Teachers
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_picture_url TEXT,
  intro_video_url TEXT,
  bio TEXT,
  qualifications JSONB DEFAULT '{}'::jsonb,
  experience TEXT,
  time_zone TEXT,
  is_verified BOOLEAN DEFAULT false,
  average_rating NUMERIC(3,2) DEFAULT 0,
  contact_number TEXT,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  subjects TEXT[] DEFAULT '{}'::text[],
  availability JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TRIGGER teachers_updated_at
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Table: Teacher Availability
CREATE TABLE IF NOT EXISTS teacher_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  recurring_slots JSONB DEFAULT '[]'::jsonb,
  specific_dates JSONB DEFAULT '[]'::jsonb,
  break_periods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TRIGGER teacher_availability_updated_at
BEFORE UPDATE ON teacher_availability
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Table: Booking Requests
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TRIGGER booking_requests_updated_at
BEFORE UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Table: Bookings (for approved booking requests)
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID REFERENCES booking_requests(id),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  start_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Table: Users (for role management)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TRIGGER users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Create a backward compatibility view for student_profiles
CREATE OR REPLACE VIEW student_profiles AS
SELECT 
  s.id,
  s.first_name || ' ' || s.last_name AS full_name,
  s.profile_picture_url AS avatar_url,
  s.bio,
  s.time_zone,
  s.created_at,
  s.updated_at
FROM students s;

-- Create a backward compatibility view for teacher_profiles
CREATE OR REPLACE VIEW teacher_profiles AS
SELECT 
  t.id,
  t.first_name || ' ' || t.last_name AS full_name,
  t.profile_picture_url AS avatar_url,
  t.bio,
  t.qualifications,
  t.experience,
  t.time_zone,
  t.is_verified,
  t.average_rating,
  t.contact_number,
  t.hourly_rate,
  t.subjects,
  t.created_at,
  t.updated_at
FROM teachers t;

-- Create RPC function to ensure a teacher profile exists
CREATE OR REPLACE FUNCTION ensure_teacher_profile(
  user_id UUID,
  first_name TEXT DEFAULT NULL,
  last_name TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_exists BOOLEAN;
  teacher_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = user_id
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Check if teacher exists
  SELECT EXISTS (
    SELECT 1 FROM teachers WHERE id = user_id
  ) INTO teacher_exists;
  
  -- Create or update the users record
  INSERT INTO users (id, role)
  VALUES (user_id, 'teacher')
  ON CONFLICT (id) 
  DO UPDATE SET role = 'teacher', updated_at = now();
  
  -- Create teacher record if it doesn't exist
  IF NOT teacher_exists THEN
    INSERT INTO teachers (
      id, 
      first_name, 
      last_name
    )
    VALUES (
      user_id, 
      COALESCE(first_name, 'New'), 
      COALESCE(last_name, 'Teacher')
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create RPC function to manage user role
CREATE OR REPLACE FUNCTION manage_user_role(
  user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, role)
  VALUES (user_id, new_role)
  ON CONFLICT (id) 
  DO UPDATE SET role = new_role, updated_at = now();
  
  RETURN TRUE;
END;
$$;

-- Create RPC function to get upcoming lessons
CREATE OR REPLACE FUNCTION get_upcoming_lessons(
  user_id UUID,
  role TEXT
)
RETURNS TABLE (
  id UUID,
  subject TEXT,
  date DATE,
  start_time TEXT,
  end_time TEXT,
  status TEXT,
  teacher_id UUID,
  student_id UUID,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.subject,
    b.date,
    b.start_time::TEXT,
    b.end_time::TEXT,
    b.status,
    b.teacher_id,
    b.student_id,
    b.created_at
  FROM
    bookings b
  WHERE
    (role = 'student' AND b.student_id = user_id) OR
    (role = 'teacher' AND b.teacher_id = user_id)
  AND
    b.status IN ('confirmed', 'pending')
  AND
    b.start_time_utc > now()
  ORDER BY
    b.start_time_utc ASC;
END;
$$; 