-- Add subjects column to teachers table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teachers' AND column_name = 'subjects') THEN
        ALTER TABLE teachers ADD COLUMN subjects TEXT[] DEFAULT '{}';
        RAISE NOTICE 'Added subjects column to teachers table';
    ELSE
        RAISE NOTICE 'subjects column already exists in teachers table';
    END IF;
END;
$$;

-- Add teacher_modules column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teachers' AND column_name = 'teacher_modules') THEN
        ALTER TABLE teachers ADD COLUMN teacher_modules JSONB DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Teacher modules column added successfully';
    ELSE
        RAISE NOTICE 'Teacher modules column already exists';
    END IF;
END;
$$; 