import { supabase } from "@/integrations/supabase/client";

/**
 * Utility functions to help check for the existence of tables and columns
 * This is useful for handling database migrations and schema changes
 */

/**
 * Check if a table exists in the database by attempting to query it
 * This is a more reliable approach than querying information_schema
 */
export const hasTable = async (tableName: string): Promise<boolean> => {
  try {
    // Try to query a single row from the table
    // If the table doesn't exist, this will fail with a specific error code
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    // If there's no error, the table exists
    if (!error) return true;
    
    // If the error is because the table doesn't exist (42P01 = undefined_table)
    if (error.code === '42P01') {
      return false;
    }
    
    // For other errors, log but assume the table might exist
    console.warn(`Error checking table existence (${tableName}):`, error);
    return false;
  } catch (error) {
    console.error(`Error checking for table existence (${tableName}):`, error);
    return false;
  }
};

/**
 * Check if a column exists in a table by attempting to query it
 */
export const hasColumn = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    // Try to select just the specified column
    const { error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    // If there's no error, the column exists
    if (!error) return true;
    
    // If the error is because the column doesn't exist (42703 = undefined_column)
    if (error.code === '42703') {
      return false;
    }
    
    // For other errors, log and return false to be safe
    console.warn(`Error checking column existence (${tableName}.${columnName}):`, error);
    return false;
  } catch (error) {
    console.error(`Error checking for column existence (${tableName}.${columnName}):`, error);
    return false;
  }
};

/**
 * Get a list of columns for a table
 * This is implemented by querying the first row and examining its keys
 */
export const getTableColumns = async (tableName: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error getting columns for table (${tableName}):`, error);
      return [];
    }
    
    // If we got data, return the keys of the first row
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    
    // If there's no data, try to get column names from an insert operation error
    try {
      // Attempt to insert an empty object to trigger a validation error
      // that will reveal column names
      const { error: insertError } = await supabase
        .from(tableName)
        .insert({});
      
      if (insertError && insertError.details && insertError.details.includes('violates not-null constraint')) {
        // Parse column names from error message
        const match = insertError.details.match(/column "([^"]+)"/);
        if (match && match[1]) {
          return [match[1]];
        }
      }
    } catch (e) {
      // Ignore errors from this attempt
    }
    
    return [];
  } catch (error) {
    console.error(`Error getting columns for table (${tableName}):`, error);
    return [];
  }
};

/**
 * Find a column that might have been renamed
 * Useful for handling ID columns that might be named 'id' or 'user_id' etc.
 */
export const findColumnLike = async (tableName: string, pattern: string): Promise<string | null> => {
  try {
    // Get all columns from the table
    const columns = await getTableColumns(tableName);
    
    // Find a column that includes the pattern
    const matchedColumn = columns.find(column => 
      column.toLowerCase().includes(pattern.toLowerCase())
    );
    
    return matchedColumn || null;
  } catch (error) {
    console.error(`Error finding column like (${tableName}.%${pattern}%):`, error);
    return null;
  }
};

// Export a promise that initializes all checks once
export const databaseDiagnostics = (async () => {
  return {
    hasTable,
    hasColumn,
    getTableColumns,
    findColumnLike
  };
})(); 