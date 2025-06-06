# Fixing Database Schema Issues

## Quick Fix Steps

Follow these steps to quickly resolve the database errors you're experiencing:

1. **Log in to your Supabase dashboard**
2. **Go to SQL Editor**
3. **Run the following SQL scripts in order:**
   - First run `scripts/fix-schema-mismatch.sql`
   - Then run `scripts/fix-notifications-and-lessons.sql`

## Specific Errors Fixed

These scripts will fix the following errors:

1. **`relation "public.notifications" does not exist`**
   - Creates the missing notifications table

2. **`column teacher_profiles_1.first_name does not exist`**
   - Removes first_name/last_name columns
   - Adds full_name column to teacher_profiles
   - Services have been updated to use full_name

3. **`failed to parse filter (is.not.null)`**
   - Updates query syntax in lessonService.ts
   - Adds index for performance optimization

## Verification

After running the SQL scripts, refresh your application to see if the errors are resolved. If you're still experiencing issues, you can run the diagnostic script:

```bash
node scripts/check-database-schema.js
```

This will check if all required tables and columns exist in your database.

## Need More Help?

If you continue to experience issues, check:

1. That you're using the latest version of all services and components
2. Your Supabase connection string is correct
3. You have proper permissions to access all tables
4. Browser cache is cleared if you're still seeing old errors 