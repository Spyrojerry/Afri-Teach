// Apply RLS policy fixes script
// This script applies only the Row Level Security policy fixes to the database

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Apply RLS fixes
async function applyRlsFixes() {
  try {
    console.log('Applying RLS policy fixes...');
    
    // RLS fix SQL (copied from fix-rls-policies.sql for direct execution)
    const rlsFixSql = `
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
    `;
    
    console.log('Executing SQL fix...');
    
    // Direct SQL execution via REST API
    const { error } = await supabase.rpc('exec_sql', { 
      sql_statement: rlsFixSql 
    }).catch(() => {
      return { error: { message: 'exec_sql function not found' } };
    });
    
    if (error && error.message.includes('function not found')) {
      console.log('Creating exec_sql function first...');
      
      // Create exec_sql function
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION exec_sql(sql_statement TEXT)
        RETURNS VOID AS $$
        BEGIN
          EXECUTE sql_statement;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // Try to create the function directly via SQL
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ sql_statement: createFunctionSql })
      });
      
      if (!response.ok) {
        console.error('Cannot create exec_sql function. Please run this SQL directly in the Supabase SQL editor:');
        console.log(rlsFixSql);
        return false;
      }
      
      // Try again with the RLS fixes
      const { error: retryError } = await supabase.rpc('exec_sql', { 
        sql_statement: rlsFixSql 
      });
      
      if (retryError) {
        console.error('Error applying RLS fixes:', retryError);
        return false;
      }
    } else if (error) {
      console.error('Error applying RLS fixes:', error);
      return false;
    }
    
    console.log('RLS policy fixes applied successfully!');
    return true;
  } catch (error) {
    console.error('Unexpected error applying RLS fixes:', error);
    return false;
  }
}

// Execute the script
async function main() {
  try {
    const success = await applyRlsFixes();
    if (success) {
      console.log('✅ All RLS fixes have been applied to the database.');
    } else {
      console.log('❌ Failed to apply some RLS fixes. Please check the errors above.');
    }
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Error in main function:', error);
    process.exit(1);
  }
}

main(); 