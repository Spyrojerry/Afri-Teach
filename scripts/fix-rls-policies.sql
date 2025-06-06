-- Fix Row-Level Security Policies for Users Table
-- This script adds necessary policies to allow proper operation of the teacher profile update functionality

-- First, drop existing policies on the users table
DROP POLICY IF EXISTS "Users can view their own record" ON public.users;

-- Create comprehensive policies for the users table
-- 1. Users can view their own record
CREATE POLICY "Users can view their own record" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- 2. Users can update their own record
CREATE POLICY "Users can update their own record" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 3. Allow insert for authenticated users (needed for profile creation/update)
CREATE POLICY "Allow inserts for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. Allow users to upsert their own record (for updateTeacherProfile function)
CREATE POLICY "Allow upsert for own record" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

-- 5. Create a helper function with elevated privileges to handle user operations
CREATE OR REPLACE FUNCTION manage_user_role(user_id UUID, new_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update the user role
  UPDATE public.users
  SET role = new_role
  WHERE id = user_id;
  
  -- Return success
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to ensure a teacher profile exists
CREATE OR REPLACE FUNCTION ensure_teacher_profile(user_id UUID, first_name TEXT DEFAULT NULL, last_name TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  existing_user_id UUID;
  f_name TEXT;
  l_name TEXT;
BEGIN
  -- Check if user exists in the users table
  SELECT id INTO existing_user_id FROM users WHERE id = user_id;
  
  -- If user doesn't exist, insert them
  IF existing_user_id IS NULL THEN
    INSERT INTO users (id, role)
    VALUES (user_id, 'teacher');
  ELSE
    -- Update role to teacher if not already
    UPDATE users SET role = 'teacher' WHERE id = user_id AND role != 'teacher';
  END IF;
  
  -- Determine first and last name
  IF first_name IS NULL OR last_name IS NULL THEN
    -- Try to get name from auth.users
    SELECT 
      COALESCE(raw_user_meta_data->>'first_name', 'New') INTO f_name
    FROM auth.users
    WHERE id = user_id;
    
    SELECT 
      COALESCE(raw_user_meta_data->>'last_name', 'Teacher') INTO l_name
    FROM auth.users
    WHERE id = user_id;
  ELSE
    f_name := first_name;
    l_name := last_name;
  END IF;
  
  -- Check if teacher profile exists
  IF NOT EXISTS (SELECT 1 FROM teachers WHERE id = user_id) THEN
    -- Create teacher profile
    INSERT INTO teachers (id, first_name, last_name)
    VALUES (user_id, f_name, l_name);
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 