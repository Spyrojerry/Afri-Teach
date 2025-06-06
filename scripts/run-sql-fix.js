const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables (needs .env file with SUPABASE_URL and SUPABASE_KEY)
require('dotenv').config({ path: '../.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./fix-functions-and-queries.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sql
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt); // Remove empty statements
    
    console.log(`Found ${statements.length} SQL statements to execute.`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Execute the statement through Supabase
        const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error);
          console.error('Statement:', stmt);
        } else {
          console.log(`Statement ${i + 1} executed successfully.`);
        }
      } catch (error) {
        console.error(`Exception executing statement ${i + 1}:`, error.message);
        console.error('Statement:', stmt);
      }
    }
    
    console.log('SQL fix script execution completed.');
  } catch (error) {
    console.error('Error running SQL fix script:', error);
  }
}

main(); 