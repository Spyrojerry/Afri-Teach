// Fix for the student_profiles and teacher_profiles views
// This script uses the Supabase client to execute SQL statements

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials. Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSQL(sql, description) {
  console.log(`Executing: ${description}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`Error executing ${description}:`, error);
      // Fallback to separate queries if RPC fails
      try {
        const { data, error } = await supabase.from('_sql').select().sql(sql);
        if (error) {
          console.error(`Fallback query failed for ${description}:`, error);
          return false;
        }
        console.log(`${description} executed successfully via fallback.`);
        return true;
      } catch (fallbackError) {
        console.error(`Fallback attempt failed for ${description}:`, fallbackError);
        return false;
      }
    } else {
      console.log(`${description} executed successfully.`);
      return true;
    }
  } catch (error) {
    console.error(`Exception executing ${description}:`, error);
    return false;
  }
}

async function main() {
  try {
    // Step 1: Drop views if they exist
    const dropViews = `
      DROP VIEW IF EXISTS student_profiles;
      DROP VIEW IF EXISTS teacher_profiles;
    `;
    await executeSQL(dropViews, 'Drop existing views');
    
    // Step 2: Create teacher_profiles view
    const createTeacherView = `
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
    `;
    await executeSQL(createTeacherView, 'Create teacher_profiles view');
    
    // Step 3: Create student_profiles view
    const createStudentView = `
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
    `;
    await executeSQL(createStudentView, 'Create student_profiles view');
    
    console.log('View fix script execution completed.');
  } catch (error) {
    console.error('Error running view fix script:', error);
  }
}

main(); 