# Teacher Profile Update Fix Documentation

This document outlines the changes made to fix the "Error updating/creating teacher profile" issue in the Afri-Teach platform.

## Issue Overview

When updating a teacher profile, the following errors were occurring:
```
teacherService.ts:146 Error updating/creating teacher profile: Object
TeacherProfile.tsx:115 Error updating teacher profile: Error: Failed to update profile
```

And later, after the initial fix:
```
teacherService.ts:153 Error updating/creating teacher profile: 
Object code: "23503"
details: "Key is not present in table \"profiles\"."
message: "insert or update on table \"teacher_profiles\" violates foreign key constraint \"teacher_profiles_id_fkey\""
```

And further issues:
```
teacherService.ts:127 Error ensuring profile exists: 
{code: 'PGRST204', details: null, hint: null, message: "Could not find the 'user_id' column of 'profiles' in the schema cache"}
```

A permission issue:
```
{code: '42501', details: null, hint: null, message: 'permission denied for table users'}
```

And finally, a not-null constraint issue:
```
{code: '23502', details: 'Failing row contains (38fc4fbc-48ae-4f24-b0a5-75ad4843669b, null, null, null, null, null, null, 2025-06-03 19:15:00.687108+00, 2025-06-03 19:15:00.687108+00, null, null, null, teacher).', hint: null, message: 'null value in column \"first_name\" of relation \"profiles\" violates not-null constraint'}
```

The errors were caused by several issues:

1. **Type conversion issues**: The `hourlyRate` field was being passed as a string instead of a number
2. **Database column inconsistencies**: The `teacher_profiles` table had inconsistent column types
3. **Unique constraint missing**: No unique constraint on `user_id` which could lead to duplicate profiles
4. **Error handling gaps**: The error reporting wasn't providing enough details
5. **Foreign key constraint issues**: Incorrect foreign key relationships between tables
6. **Schema design mismatch**: The `profiles` table uses `id` as the primary key linked to `auth.users(id)`, not `user_id`
7. **RPC permission issues**: The RPC function tries to access the `auth.users` table but doesn't have sufficient permissions
8. **Not-null constraint violation**: The `profiles` table requires non-null values for `first_name` and `last_name` columns

## Implemented Fixes

### 1. Improved Type Handling

- Created a `typeConversions.ts` utility with functions for reliable type conversions:
  - `toNumber()`: Safely converts values to numbers with fallback defaults
  - `ensureArray()`: Ensures values are properly formatted as arrays
  - `safeParseJson()`: Safely parses JSON strings with fallback defaults

- Updated components to properly handle numeric inputs:
  - `ProfileModal.tsx`: Now properly converts `hourlyRate` input to a number
  - `TeacherProfile.tsx`: Uses `toNumber()` utility for consistent conversion
  - `teacherService.ts`: Uses type conversion utilities for all numeric fields

### 2. Database Schema Improvements

- Created/updated SQL scripts to fix database schema issues:

  - `fix-teacher-profile.sql`:
    - Added primary key constraint on `id` column
    - Ensured `user_id` column exists and references `auth.users`
    - Added unique constraint on `user_id` to prevent duplicates
    - Created helper function to auto-generate teacher profiles

  - `fix-field-types.sql`:
    - Ensures `hourly_rate` is properly typed as numeric
    - Validates and fixes `subjects` and `languages` array fields
    - Sets appropriate default values for required fields
    
  - `fix-teacher-profile-constraint.sql`:
    - Fixes incorrect foreign key constraints on the `teacher_profiles` table
    - Removes the problematic constraint `teacher_profiles_id_fkey`
    - Ensures proper relationship between `profiles` and `teacher_profiles` tables
    - Updates the `create_teacher_profile_from_user_id` function to properly handle profile creation
    - Corrects the `profiles` table schema to use `id` as the primary key linked to `auth.users`
    
  - `fix-teacher-profile-rpc.sql`:
    - Creates an updated version of the `get_teacher_profile_by_user_id` function
    - Uses `SECURITY DEFINER` to run with the function creator's permissions
    - Avoids direct references to the `auth.users` table
    - Auto-creates profiles if they don't exist

### 3. Modified Database Interaction Flow

- Updated the `updateTeacherProfile` function to:
  - First create/update a record in the `profiles` table using `id` (not `user_id`)
  - Then create/update the record in the `teacher_profiles` table
  - This ensures the foreign key relationships are satisfied
  
- Added code-based workaround for constraint issues:
  - Added a small delay after profiles update to ensure DB consistency
  - Special handling for foreign key constraint errors with alternative insert approach
  - Implemented retry mechanism for profile updates in TeacherProfile component
  - Updated column references to match the actual database schema (`id` vs `user_id`)
  - Added automatic extraction of `first_name` and `last_name` from `full_name`
  - Implemented default values for required fields when extraction fails

### 4. Improved Error Handling

- Added detailed logging in `teacherService.ts`:
  - Logs the actual data being sent to the database
  - Distinguishes between creating new profiles and updating existing ones
  - Properly handles errors during profile creation

- Updated error handling in components:
  - Provides more user-friendly error messages
  - Prevents page refresh when errors occur
  - Adds retry mechanism with multiple attempts for profile updates
  
- Added fallback query approach for RPC permission issues:
  - Detects specific permission error codes
  - Falls back to direct table queries when RPC functions fail
  - Creates a temporary profile object when needed

- Added not-null constraint handling:
  - Detects constraint violation errors and provides appropriate default values
  - Extracts first and last name from full name when possible
  - Uses fallback default values ('Teacher' and 'User') when extraction fails

### 5. Data Construction Improvements

- Simplified the data construction in `updateTeacherProfile`:
  - Removed dynamic column name handling that was causing issues
  - Used direct property assignment instead of spread operators
  - Added explicit type conversion for all fields

## Important Schema Details

The Supabase database uses the following schema for user-related tables:

1. `auth.users` - Contains authentication information
   - Primary key: `id` (UUID)

2. `profiles` - Contains basic user information
   - Primary key: `id` (UUID) which references `auth.users(id)`
   - Required fields: `first_name` and `last_name` (not-null constraint)
   - This table does NOT use a separate `user_id` column

3. `teacher_profiles` - Contains teacher-specific information
   - Primary key: `id` (UUID)
   - Foreign key: `user_id` (UUID) which references `auth.users(id)`

Understanding this schema is crucial for correctly updating/creating profiles.

## Handling Permission Issues

Supabase RPC functions can encounter permission issues when:

1. They try to access tables that require higher privileges (like `auth.users`)
2. They don't have the proper SECURITY DEFINER setting

We've addressed this in two ways:

1. **Updated RPC function** with SECURITY DEFINER in `fix-teacher-profile-rpc.sql`
2. **Client-side fallback** in `teacherService.ts` that detects permission errors and uses direct queries

## Handling Not-Null Constraints

The `profiles` table has not-null constraints on `first_name` and `last_name` columns. We've added the following strategies to handle this:

1. **Automatic extraction**: Split the `full_name` into `first_name` and `last_name`
2. **Default values**: Use 'Teacher' for `first_name` and 'User' for `last_name` when extraction fails
3. **Retry mechanism**: If a not-null constraint error occurs, retry with explicit default values
4. **Error detection**: Identify not-null constraint errors specifically (code '23502') and handle them

## How to Apply the Fixes

1. Execute the SQL scripts to fix the database schema (in this order):
   ```bash
   psql -f scripts/fix-teacher-profile.sql
   psql -f scripts/fix-field-types.sql
   psql -f scripts/fix-teacher-profile-constraint.sql
   psql -f scripts/fix-teacher-profile-rpc.sql
   ```

2. Deploy the updated code files:
   - `src/services/teacherService.ts`
   - `src/components/ProfileModal.tsx`
   - `src/pages/TeacherProfile.tsx`
   - `src/utils/typeConversions.ts`

3. If SQL scripts cannot be run directly (e.g., in production or without psql access):
   - The code-based workarounds in `teacherService.ts` and `TeacherProfile.tsx` should handle the issues
   - Monitor error logs for any recurring issues and apply additional fixes as needed

4. Verify the fix by updating a teacher profile and checking for any errors.

## Prevention Measures

To prevent similar issues in the future:

1. Use the new type conversion utilities consistently throughout the codebase
2. Add validation on form submissions to ensure proper data types
3. Implement comprehensive error handling with detailed error messages
4. Run database schema validation scripts regularly
5. Use explicit data models for table relationships and enforce consistent naming conventions
6. Always check foreign key constraints and ensure they're properly configured
7. Implement retry mechanisms for critical database operations
8. Use transactions when multiple related tables need to be updated together
9. Create and maintain up-to-date database schema documentation to avoid confusion about column names
10. Use SECURITY DEFINER for RPC functions that need elevated permissions
11. Implement fallback approaches for operations that might encounter permission issues
12. Always provide default values for columns with not-null constraints
13. Handle name splitting consistently across the application 