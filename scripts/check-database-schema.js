// Script to check the database schema for common issues
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'readline';

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for Supabase URL and Key
console.log('This script will check your Supabase database schema for common issues.');
console.log('Please provide your Supabase URL and anon key (or service_role key for admin operations).');

rl.question('Supabase URL: ', (supabaseUrl) => {
  rl.question('Supabase Key: ', async (supabaseKey) => {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    try {
      console.log('\nChecking database schema...');
      
      // Check important tables
      const tables = [
        'profiles',
        'teacher_profiles',
        'student_profiles',
        'lessons',
        'notifications',
        'payments',
        'payouts'
      ];
      
      console.log('\n--- Checking tables ---');
      for (const table of tables) {
        const exists = await checkTableExists(supabase, table);
        console.log(`${table}: ${exists ? '✅ Exists' : '❌ Missing'}`);
      }
      
      console.log('\n--- Checking profiles columns ---');
      if (await checkTableExists(supabase, 'profiles')) {
        const profileColumns = [
          'id',
          'updated_at',
          'username',
          'full_name',
          'avatar_url',
          'email',
          'role'
        ];
        
        for (const column of profileColumns) {
          const exists = await checkColumnExists(supabase, 'profiles', column);
          console.log(`profiles.${column}: ${exists ? '✅ Exists' : '❌ Missing'}`);
        }
      }
      
      console.log('\n--- Checking teacher_profiles columns ---');
      if (await checkTableExists(supabase, 'teacher_profiles')) {
        const teacherColumns = [
          'id',
          'full_name',
          'avatar_url',
          'bio',
          'education',
          'user_id',
          'rating',
          'country'
        ];
        
        for (const column of teacherColumns) {
          const exists = await checkColumnExists(supabase, 'teacher_profiles', column);
          console.log(`teacher_profiles.${column}: ${exists ? '✅ Exists' : '❌ Missing'}`);
        }
        
        // Check specifically for first_name/last_name (which should not exist)
        const hasFirstName = await checkColumnExists(supabase, 'teacher_profiles', 'first_name');
        const hasLastName = await checkColumnExists(supabase, 'teacher_profiles', 'last_name');
        
        if (hasFirstName || hasLastName) {
          console.log(`⚠️ teacher_profiles still has first_name/last_name columns instead of full_name!`);
        }
      }
      
      console.log('\n--- Checking notifications table ---');
      if (await checkTableExists(supabase, 'notifications')) {
        const notificationColumns = [
          'id',
          'user_id',
          'title',
          'message',
          'type',
          'is_read',
          'related_id',
          'created_at'
        ];
        
        for (const column of notificationColumns) {
          const exists = await checkColumnExists(supabase, 'notifications', column);
          console.log(`notifications.${column}: ${exists ? '✅ Exists' : '❌ Missing'}`);
        }
      }
      
      console.log('\n--- Checking lessons columns ---');
      if (await checkTableExists(supabase, 'lessons')) {
        const lessonColumns = [
          'id',
          'subject',
          'date',
          'start_time',
          'end_time',
          'status',
          'teacher_id',
          'student_id'
        ];
        
        for (const column of lessonColumns) {
          const exists = await checkColumnExists(supabase, 'lessons', column);
          console.log(`lessons.${column}: ${exists ? '✅ Exists' : '❌ Missing'}`);
        }
      }
      
      console.log('\nDatabase schema check completed.');
    } catch (error) {
      console.error('Error checking database schema:', error);
    }
    
    rl.close();
  });
});

/**
 * Checks if a table exists in the database
 * @param {Object} supabase Supabase client
 * @param {string} tableName Name of the table to check
 * @returns {Promise<boolean>} Whether the table exists
 */
async function checkTableExists(supabase, tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
      
    return !error || error.code !== '42P01';
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a column exists in a table
 * @param {Object} supabase Supabase client
 * @param {string} tableName Name of the table to check
 * @param {string} columnName Name of the column to check
 * @returns {Promise<boolean>} Whether the column exists
 */
async function checkColumnExists(supabase, tableName, columnName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
      
    return !error || error.code !== '42703';
  } catch (error) {
    return false;
  }
} 