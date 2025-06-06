// Script to apply SQL fixes to the Supabase database
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for Supabase URL and Key
console.log('This script will apply SQL fixes to your Supabase database.');
console.log('Please provide your Supabase URL and anon key (or service_role key for admin operations).');

rl.question('Supabase URL: ', (supabaseUrl) => {
  rl.question('Supabase Key: ', (supabaseKey) => {
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Ask which script to run
    console.log('\nAvailable SQL scripts:');
    console.log('1. Fix schema mismatches (scripts/fix-schema-mismatch.sql)');
    console.log('2. Fix notifications and lessons (scripts/fix-notifications-and-lessons.sql)');
    console.log('3. Both scripts');
    
    rl.question('\nWhich script would you like to run? (1/2/3): ', async (choice) => {
      try {
        if (choice === '1' || choice === '3') {
          console.log('\nRunning fix-schema-mismatch.sql...');
          await runSqlScript(supabase, path.join(__dirname, 'fix-schema-mismatch.sql'));
        }
        
        if (choice === '2' || choice === '3') {
          console.log('\nRunning fix-notifications-and-lessons.sql...');
          await runSqlScript(supabase, path.join(__dirname, 'fix-notifications-and-lessons.sql'));
        }
        
        console.log('\nSQL scripts execution completed.');
        rl.close();
      } catch (error) {
        console.error('Error running SQL scripts:', error);
        rl.close();
      }
    });
  });
});

/**
 * Runs a SQL script against the Supabase database
 * @param {Object} supabase Supabase client
 * @param {string} scriptPath Path to the SQL script
 */
async function runSqlScript(supabase, scriptPath) {
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync(scriptPath, 'utf8');
    
    // Split the SQL by semicolons to execute each statement separately
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      // Skip comment-only statements
      if (statement.startsWith('--')) {
        console.log('Skipping comment-only statement.');
        continue;
      }
      
      // Add semicolon back for proper SQL syntax
      const { data, error } = await supabase.rpc('exec_sql', { 
        query: statement + ';' 
      });
      
      if (error) {
        console.warn(`Warning executing statement ${i + 1}: ${error.message}`);
        // Continue with next statement even if there's an error
      } else {
        console.log(`Statement ${i + 1} executed successfully.`);
      }
    }
    
    console.log(`SQL script ${path.basename(scriptPath)} execution completed.`);
  } catch (error) {
    console.error(`Error executing SQL script ${path.basename(scriptPath)}:`, error);
    throw error;
  }
} 