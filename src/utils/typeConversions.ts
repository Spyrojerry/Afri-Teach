/**
 * Utility functions for handling type conversions
 */

/**
 * Converts a value to a number, with a fallback default
 * @param value The value to convert
 * @param defaultValue The default value to use if conversion fails
 * @returns The converted number or default
 */
export const toNumber = (value: any, defaultValue: number = 0): number => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Ensures a value is an array
 * @param value The value to check
 * @param defaultValue Default array to return if value is not an array
 * @returns The value as an array or default
 */
export const ensureArray = <T>(value: any, defaultValue: T[] = []): T[] => {
  if (Array.isArray(value)) {
    return value;
  }
  
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  // Try to convert string to array if it looks like JSON
  if (typeof value === 'string') {
    try {
      if (value.startsWith('[') && value.endsWith(']')) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      // Failed to parse as JSON, continue
    }
    
    // If it's a comma-separated string, split it
    if (value.includes(',')) {
      return value.split(',').map(item => item.trim()) as unknown as T[];
    }
    
    // Single value, make it an array
    return [value as unknown as T];
  }
  
  return defaultValue;
};

/**
 * Safely parse JSON
 * @param jsonString String to parse
 * @param defaultValue Default value if parsing fails
 * @returns Parsed object or default
 */
export const safeParseJson = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    return defaultValue;
  }
}; 