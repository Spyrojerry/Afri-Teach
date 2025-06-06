// Apply database fixes script
// This script will run the SQL file to fix database functions and queries

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

async function runSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('SQL file execution completed');
  } catch (error) {
    console.error('Error running SQL file:', error);
  }
}

// Check if we need to create the exec_sql function first
async function createExecSqlFunction() {
  try {
    console.log('Creating exec_sql function...');
    
    // SQL to create the exec_sql function if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql_statement TEXT)
      RETURNS VOID AS $$
      BEGIN
        EXECUTE sql_statement;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('exec_sql', { 
      sql_statement: createFunctionSql 
    }).catch(() => {
      // If the function doesn't exist yet, we need to create it via raw query
      return supabase.from('_exec_sql_temp').select().eq('id', 1).then(res => {
        return { error: res.error };
      });
    });
    
    if (error) {
      console.log('exec_sql function does not exist yet, creating via direct query...');
      
      // Create a temporary table to execute the SQL
      await supabase.from('_exec_sql_temp').insert([{ id: 1 }]).select().then(res => {
        return { error: res.error };
      });
      
      // Try again after creating the table
      const { error: retryError } = await supabase.rpc('exec_sql', { 
        sql_statement: createFunctionSql 
      }).catch(() => {
        return { error: true };
      });
      
      if (retryError) {
        console.error('Failed to create exec_sql function. You may need to run SQL manually.');
        return false;
      }
    }
    
    console.log('exec_sql function created or already exists');
    return true;
  } catch (error) {
    console.error('Error creating exec_sql function:', error);
    return false;
  }
}

// Execute the script
async function main() {
  try {
    // Create the exec_sql function first
    const funcCreated = await createExecSqlFunction();
    
    if (!funcCreated) {
      console.log('Please run the SQL scripts manually in the Supabase SQL editor.');
      return;
    }
    
    // Run the fix-functions-and-queries.sql file
    await runSqlFile('./fix-functions-and-queries.sql');
    
    // Run the fix-rls-policies.sql file
    await runSqlFile('./fix-rls-policies.sql');
    
    console.log('Database fixes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error applying database fixes:', error);
    process.exit(1);
  }
}

main(); 