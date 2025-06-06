import { supabase } from "@/integrations/supabase/client";

/**
 * Check if a table exists in the database
 * @param tableName Name of the table to check
 * @returns Boolean indicating if table exists
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
      
    if (error && error.code === '42P01') {
      // Table doesn't exist
      console.warn(`Table '${tableName}' does not exist in the database`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Error checking if table '${tableName}' exists:`, error);
    return false;
  }
};

/**
 * Finds the common user ID column in a profile table (helpful when unsure if user_id exists)
 * @param tableName Name of the profile table to check
 * @returns The name of the user ID column or null if not found
 */
export const findCommonUserIdColumn = async (tableName: string): Promise<string | null> => {
  try {
    // First check if the table exists
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) return null;
    
    // Get a sample row to check column structure
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
      
    if (error) {
      console.error(`Error fetching columns from '${tableName}':`, error);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.warn(`No data found in '${tableName}' to examine columns`);
      return null;
    }
    
    // Check for common user ID column names
    const columnNames = Object.keys(data[0]);
    
    if (columnNames.includes('user_id')) {
      return 'user_id';
    } else if (columnNames.includes('auth_id')) {
      return 'auth_id';
    } else if (columnNames.includes('auth_user_id')) {
      return 'auth_user_id';
    }
    
    console.warn(`Could not find user ID column in '${tableName}'`);
    return null;
  } catch (error) {
    console.error(`Error finding user ID column in '${tableName}':`, error);
    return null;
  }
};

/**
 * Checks if a column exists in a table
 * @param tableName The table to check
 * @param columnName The column to check for
 * @returns Boolean indicating if the column exists
 */
export const checkColumnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  try {
    // Try to select just the specified column
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .limit(1);
    
    // If there's no error, the column exists
    return !error || error.code !== '42703';
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
};

/**
 * Diagnoses table structure in the database
 * @param tableName Name of the table to diagnose
 * @returns Structure information
 */
export const diagnoseTable = async (tableName: string) => {
  try {
    // Get a sample row to see column names
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return { 
        success: false, 
        error: error.message, 
        columns: [] 
      };
    }

    // Get all columns from the first row if it exists
    const columns = data && data.length > 0 
      ? Object.keys(data[0])
      : [];

    return {
      success: true,
      columns,
      sample: data && data.length > 0 ? data[0] : null
    };
  } catch (error) {
    console.error(`Error diagnosing table ${tableName}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error),
      columns: [] 
    };
  }
};

/**
 * Checks if a column exists in a table
 * @param tableName Name of the table to check
 * @param columnName Name of the column to check for
 * @returns Whether the column exists
 */
export const columnExists = async (tableName: string, columnName: string): Promise<boolean> => {
  const { success, columns } = await diagnoseTable(tableName);
  return success && columns.includes(columnName);
};

/**
 * Finds the appropriate user ID column in a table
 * This is useful for tables that might use either 'user_id' or 'id' for user references
 * @param tableName The table to check
 * @returns The column name that refers to a user ID
 */
export const findUserIdColumn = async (tableName: string): Promise<string> => {
  const hasUserId = await checkColumnExists(tableName, 'user_id');
  if (hasUserId) return 'user_id';
  
  const hasId = await checkColumnExists(tableName, 'id');
  if (hasId) return 'id';
  
  // Default to 'id' if neither is confirmed
  return 'id';
};

/**
 * Gets information about a table's columns
 * @param tableName The table to check
 * @returns Array of column names that exist in the table
 */
export const getTableColumns = async (tableName: string): Promise<string[]> => {
  try {
    // Query a single row to get column information
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`Error getting columns for ${tableName}:`, error);
      return [];
    }
    
    // If we have data, return the column names
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
    
    // If no data, try to get definitions through RPC if available
    try {
      const { data: columnsData, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: tableName });
      
      if (columnsError) {
        console.error(`Error getting columns through RPC for ${tableName}:`, columnsError);
        return [];
      }
      
      return (columnsData || []).map(col => col.column_name);
    } catch (rpcError) {
      // RPC might not be available
      console.warn(`Table column RPC not available: ${rpcError}`);
      return [];
    }
  } catch (error) {
    console.error(`Unexpected error getting columns for ${tableName}:`, error);
    return [];
  }
}; 