-- AfriTeach Database Schema
-- This script creates the tables and relationships for the AfriTeach platform

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean installation)
DROP TABLE IF EXISTS public.admin_actions CASCADE;
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.teacher_availability CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.teacher_profiles CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;

-- Keep the users table since it's linked to auth.users
ALTER TABLE IF EXISTS public.profiles RENAME TO old_profiles;

-- Create users table (Core authentication and role management)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('student', 'teacher', 'admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_picture_url TEXT,
  time_zone TEXT,
  learning_preferences JSONB DEFAULT '{}',
  contact_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  profile_picture_url TEXT,
  intro_video_url TEXT,
  bio TEXT,
  qualifications JSONB DEFAULT '{}',
  experience TEXT,
  time_zone TEXT,
  is_verified BOOLEAN DEFAULT false,
  average_rating NUMERIC DEFAULT 0,
  contact_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_usd NUMERIC NOT NULL,
  grade_levels TEXT[],
  is_group_lesson BOOLEAN DEFAULT false,
  max_students INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create teacher_availability table
CREATE TABLE IF NOT EXISTS public.teacher_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  start_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  payment_id UUID,
  virtual_classroom_link TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount_usd NUMERIC NOT NULL,
  platform_commission_usd NUMERIC NOT NULL,
  teacher_payout_usd NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  transaction_id_gateway TEXT,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending_payout', 'payout_completed', 'refunded')),
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payout_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add the foreign key reference from bookings to payments
ALTER TABLE public.bookings
ADD CONSTRAINT fk_bookings_payment_id FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  related_entity_id UUID,
  related_entity_type TEXT
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
  description TEXT NOT NULL,
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create admin_actions table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Function to handle new user signups and create appropriate profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Extract user role and names from metadata
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  first_name := COALESCE(new.raw_user_meta_data->>'first_name', 'User');
  last_name := COALESCE(new.raw_user_meta_data->>'last_name', 'Account');
  
  -- Insert into users table
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, user_role);
  
  -- Insert into appropriate profile table based on role
  IF user_role = 'student' THEN
    INSERT INTO public.students (id, first_name, last_name)
    VALUES (new.id, first_name, last_name);
  ELSIF user_role = 'teacher' THEN
    INSERT INTO public.teachers (id, first_name, last_name)
    VALUES (new.id, first_name, last_name);
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to calculate teacher's average rating
CREATE OR REPLACE FUNCTION update_teacher_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
BEGIN
  -- Calculate the average rating for the teacher
  SELECT AVG(rating) INTO avg_rating
  FROM reviews
  WHERE teacher_id = NEW.teacher_id;
  
  -- Update the teacher's average_rating
  UPDATE teachers
  SET average_rating = COALESCE(avg_rating, 0)
  WHERE id = NEW.teacher_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update teacher rating when a review is added
CREATE TRIGGER after_review_insert_or_update
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_teacher_rating();

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- Basic policies for each table (these should be enhanced for production)
-- Users table
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (auth.uid() = id);
  
-- Students table
CREATE POLICY "Students can view and update their own profile" ON public.students
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "Teachers can view student profiles" ON public.students
  FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'));
  
-- Teachers table
CREATE POLICY "Teachers can view and update their own profile" ON public.teachers
  FOR ALL USING (auth.uid() = id);
CREATE POLICY "Everyone can view teacher profiles" ON public.teachers
  FOR SELECT USING (true);

-- Insert some default subjects
INSERT INTO public.subjects (name, description)
VALUES 
  ('Mathematics', 'Math subjects including algebra, calculus, geometry, etc.'),
  ('English', 'English language, literature, and writing'),
  ('Science', 'Various science subjects including biology, chemistry, physics'),
  ('History', 'World and regional history'),
  ('Computer Science', 'Programming, algorithms, and computer theory'),
  ('Languages', 'Foreign language instruction'),
  ('Music', 'Music theory and instrumental lessons'),
  ('Art', 'Visual arts and art history')
ON CONFLICT (name) DO NOTHING;

-- Add migration function to move data from old profiles if needed
CREATE OR REPLACE FUNCTION migrate_old_profiles()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
  role_value TEXT;
  first_name TEXT;
  last_name TEXT;
BEGIN
  -- Only run if the old_profiles table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'old_profiles') THEN
    -- Insert into users table with role mapping
    -- Map 'user' role to 'student' to comply with the check constraint
    INSERT INTO users (id, email, role)
    SELECT 
      p.id, 
      p.email, 
      CASE 
        WHEN p.role = 'user' THEN 'student'
        WHEN p.role = 'admin' THEN 'admin'
        WHEN p.role = 'teacher' THEN 'teacher'
        ELSE 'student'
      END as role
    FROM old_profiles p
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Process each profile
    FOR profile_record IN SELECT * FROM old_profiles LOOP
      -- Get role with mapping
      IF profile_record.role = 'user' THEN
        role_value := 'student';
      ELSE
        role_value := COALESCE(profile_record.role, 'student');
      END IF;
      
      -- Extract first and last name
      IF profile_record.full_name IS NOT NULL THEN
        first_name := split_part(profile_record.full_name, ' ', 1);
        last_name := substr(profile_record.full_name, length(first_name) + 2);
        IF last_name = '' THEN last_name := 'User'; END IF;
      ELSE
        first_name := 'User';
        last_name := 'Account';
      END IF;
      
      -- Insert into appropriate table
      IF role_value = 'teacher' THEN
        INSERT INTO teachers (id, first_name, last_name, profile_picture_url)
        VALUES (profile_record.id, first_name, last_name, profile_record.avatar_url)
        ON CONFLICT (id) DO NOTHING;
      ELSE
        INSERT INTO students (id, first_name, last_name, profile_picture_url)
        VALUES (profile_record.id, first_name, last_name, profile_record.avatar_url)
        ON CONFLICT (id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run the migration function
SELECT migrate_old_profiles(); 