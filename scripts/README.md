# Afri-Teach Database Scripts

This directory contains scripts to set up, fix, and manage the Afri-Teach database.

## Latest Update: Database Schema Overhaul

The `create-new-schema.sql` script implements a complete redesign of the database schema following best practices. This includes:

1. Creating dedicated tables for users, students, and teachers
2. Setting up proper foreign key relationships between all tables
3. Implementing row-level security policies
4. Creating triggers for automatic rating calculation
5. Adding default subjects data
6. Including a migration function to move data from the old profiles table

### How to Apply the Schema Update

**Option 1: Using the Supabase UI**

1. Log in to your Supabase project
2. Navigate to the SQL Editor
3. Copy the contents of `create-new-schema.sql`
4. Paste it into a new SQL query in the Supabase SQL Editor
5. Click "Run" to execute the script

**Option 2: Using the Node.js Utility**

1. Make sure you have Node.js installed
2. Update your Supabase credentials in `.env` (see `.env.example` for reference)
3. Run the following command:

```bash
node scripts/apply-sql-fixes.js scripts/create-new-schema.sql
```

### What Will Happen When You Apply the Update

1. The script will rename the existing `profiles` table to `old_profiles`
2. New tables will be created according to the new schema
3. Data from the old table will be migrated to the new structure
4. Row-level security policies will be applied to all tables
5. Default subjects will be added to the `subjects` table

**Important**: This is a significant database change. Make sure to back up your data before running the script.

## Available Scripts

### 1. create-new-schema.sql (NEW)

Complete database schema overhaul with new tables and relationships.

### 2. fix-schema-mismatch.sql

SQL script to fix schema mismatches between the codebase and database (for the old schema).

### 3. fix-notifications-and-lessons.sql

SQL script to specifically fix issues with the notifications table (for the old schema).

### 4. apply-sql-fixes.js

Node.js script to apply SQL fixes to your Supabase database.

### 5. check-database-schema.js

Node.js script to check your database schema for common issues.

### 6. create-profiles-table.sql

Creates the original profiles table (for reference only, use create-new-schema.sql instead).

### 7. create-storage-buckets.sql

Sets up Supabase storage buckets for file storage.

### 8. migrate-to-cloudinary.js

Script to migrate file storage from Supabase to Cloudinary.

## How to Use

### Prerequisites

Make sure you have Node.js installed and have installed the required dependencies:

```bash
npm install @supabase/supabase-js
```

### Checking Your Database Schema

To check your current database schema:

1. Run the check script:
   ```bash
   node scripts/check-database-schema.js
   ```

2. Enter your Supabase URL and key when prompted.

3. Review the output to see which tables and columns exist or are missing.

### Applying Fixes

#### Option 1: Using the Node.js Scripts

To apply fixes to your database using the scripts:

1. Run the apply script:
   ```bash
   node scripts/apply-sql-fixes.js
   ```

2. Enter your Supabase URL and key when prompted.

3. Choose which SQL script to run.

4. After the scripts finish running, use the check script again to verify that the changes were applied correctly.

#### Option 2: Using the Supabase SQL Editor (Recommended)

If you have access to the Supabase dashboard, the most reliable way to apply these fixes is:

1. Log in to your Supabase dashboard
2. Go to the "SQL Editor" section
3. Open the SQL files in this directory
4. Copy the contents of the file you want to run
5. Paste into the SQL Editor and run the statements
6. Check your database schema again after running the changes

## After Applying the Schema Update

After applying the schema update, you should:

1. Update your application code to work with the new schema
2. Test all features thoroughly
3. Monitor error logs for any issues
4. Run the schema check utility to verify the changes

## Troubleshooting

If you encounter an error like `function exec_sql does not exist`:

1. You need to use a service_role key instead of an anon key for admin operations.
2. Use the SQL Editor method described above instead of the Node.js scripts.

If you're still experiencing issues after running these scripts, check the following:

1. Ensure your application environment variables are correctly set
2. Restart your application to ensure it connects with the updated schema
3. Clear browser cache and local storage if you're experiencing stale data

## Database-Related Errors in the Application

These scripts should fix the following common errors:

1. `relation "public.notifications" does not exist` - Fixed by creating the notifications table
2. `column teacher_profiles_1.first_name does not exist` - Fixed by updating queries to use full_name
3. `failed to parse filter (is.not.null)` - Fixed by updating the query syntax

After applying these fixes, the application should be able to read and write data to these tables without errors. 