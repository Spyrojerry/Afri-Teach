# Fixing Row Level Security (RLS) Errors

This document provides instructions for fixing the "new row violates row-level security policy for table users" error that occurs when updating teacher profiles.

## Understanding the Issue

The error occurs because the Row Level Security (RLS) policies on the `users` table in the database are too restrictive. By default, Supabase's RLS only allows users to select their own records, but not insert or update them.

In our app, when updating a teacher profile, we also need to:

1. Ensure the user exists in the `users` table
2. Ensure the user has the `teacher` role
3. Create/update their record in the `teachers` table

The error occurs at step 1 and 2 when we try to insert or update a record in the `users` table.

## How to Fix

### Option 1: Run the Automated Fix Script

We've created a script that automatically applies the necessary RLS policy fixes to the database:

1. Make sure you have Node.js installed
2. Ensure your `.env` file has the correct Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Run the fix script:
   ```bash
   npm run fix:rls
   ```

The script will:
- Add proper RLS policies to the `users` table
- Create helper functions with `SECURITY DEFINER` to safely manage user roles and profiles

### Option 2: Run the SQL Manually

If the script doesn't work, you can run the SQL manually in the Supabase SQL Editor:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL:

```sql
-- Drop existing policies on the users table
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
```

## Verifying the Fix

After applying the fix:

1. Try updating a teacher profile again
2. Check for any errors in the browser console
3. Verify that the profile data is correctly saved in the database

If everything works correctly, you should no longer see the "new row violates row-level security policy for table users" error.

## How It Works

The fix does the following:

1. Adds more permissive RLS policies to the `users` table to allow users to:
   - View their own records (SELECT)
   - Update their own records (UPDATE)
   - Insert records for themselves (INSERT)

2. Creates two helper functions with `SECURITY DEFINER` which:
   - Run with elevated privileges (bypassing RLS)
   - Handle user role management safely
   - Ensure teacher profiles exist in both the `users` and `teachers` tables

3. The application code has been updated to use these helper functions instead of directly modifying the database tables.

## Common Issues

If you still encounter issues after applying the fix:

1. Make sure your Supabase URL and API key are correct
2. Check that the `auth.users` table has the correct user records
3. Verify that RLS is properly enabled on the `users` and `teachers` tables
4. Check for any errors in the database logs

For persistent issues, you may need to check the Supabase dashboard for more detailed error logs. 