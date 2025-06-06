# Fix for Student Profiles View Error

The error `ERROR: 42809: "student_profiles" is not a view` occurs because:

1. The original script tried to create a policy on the `student_profiles` view
2. Either the view doesn't exist or the policy creation was attempted before the view was created

## How to Fix

### Option 1: Using the Supabase Dashboard (Recommended)

1. Log into your Supabase Dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Drop views if they exist
DROP VIEW IF EXISTS student_profiles;
DROP VIEW IF EXISTS teacher_profiles;

-- Create teacher_profiles view
CREATE VIEW teacher_profiles AS
SELECT 
  t.id,
  t.id AS user_id,
  (t.first_name || ' ' || t.last_name) AS full_name,
  t.profile_picture_url AS avatar_url,
  t.bio,
  t.experience,
  t.average_rating AS rating,
  NULL::TEXT[] AS subjects,
  NULL::NUMERIC AS hourly_rate,
  0 AS review_count,
  NULL::TEXT AS country,
  NULL::TEXT[] AS languages,
  NULL::TEXT AS education,
  t.created_at
FROM 
  teachers t;

-- Create student_profiles view
CREATE VIEW student_profiles AS
SELECT 
  s.id,
  s.id AS user_id,
  (s.first_name || ' ' || s.last_name) AS full_name,
  s.profile_picture_url AS avatar_url,
  NULL::TEXT AS bio,
  s.learning_preferences,
  s.created_at
FROM 
  students s;
```

5. Run the query
6. This should create both views without trying to create any policies on them

### Option 2: Using the Node.js Script

If you have Node.js installed and prefer to run a script:

1. Make sure you have the required dependencies:
   ```
   npm install @supabase/supabase-js dotenv
   ```

2. Create a `.env` file in the project root with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Run the fix-views.js script:
   ```
   node scripts/fix-views.js
   ```

### Option 3: Using the Updated SQL File

We've updated the `fix-functions-and-queries.sql` file to remove the problematic policy creation statements. You can now run this file directly:

1. Through the Supabase SQL Editor (copy and paste the file contents)
2. Or via psql if you have access:
   ```
   psql -h your_host -U your_user -d your_database -f scripts/fix-functions-and-queries.sql
   ```

## Verify the Fix

After applying one of the solutions above, you should run the original SQL script again to see if it completes successfully. 