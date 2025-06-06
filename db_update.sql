-- SQL to update the bookings table structure
-- This script adds missing columns that are referenced in the StudentLessons.tsx component

-- First, check if columns exist before trying to add them (to avoid errors)
DO $$
BEGIN
    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'notes') THEN
        ALTER TABLE bookings ADD COLUMN notes TEXT;
    END IF;

    -- Add meeting_link column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'meeting_link') THEN
        ALTER TABLE bookings ADD COLUMN meeting_link TEXT;
    END IF;

    -- Add start_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'start_time') THEN
        ALTER TABLE bookings ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add end_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'end_time') THEN
        ALTER TABLE bookings ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add start_time_utc column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'start_time_utc') THEN
        ALTER TABLE bookings ADD COLUMN start_time_utc TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add end_time_utc column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'end_time_utc') THEN
        ALTER TABLE bookings ADD COLUMN end_time_utc TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Make sure status column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'status') THEN
        ALTER TABLE bookings ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Update existing records to have a default status if status is NULL
    UPDATE bookings SET status = 'pending' WHERE status IS NULL;

    -- Add a regular date column instead of a generated column for easier date-based filtering
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'date') THEN
        ALTER TABLE bookings ADD COLUMN date DATE;
        
        -- Update the date column based on start_time or created_at
        UPDATE bookings 
        SET date = CASE 
            WHEN start_time IS NOT NULL THEN start_time::date 
            ELSE created_at::date 
        END;
    END IF;

    -- Add subject column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'subject') THEN
        ALTER TABLE bookings ADD COLUMN subject TEXT;
    END IF;
    
    -- Add module_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'bookings' AND column_name = 'module_id') THEN
        ALTER TABLE bookings ADD COLUMN module_id TEXT;
    END IF;

    RAISE NOTICE 'Bookings table structure updated successfully';
END;
$$;

-- Create learning_modules table for tracking learning modules
CREATE TABLE IF NOT EXISTS learning_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
    lessons INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student_progress table to track module progress
CREATE TABLE IF NOT EXISTS student_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    last_completed_lesson INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (student_id, module_id)
);

-- Create trigger to update the last_activity_at timestamp
CREATE OR REPLACE FUNCTION update_student_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_activity_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the student_progress table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'student_progress_last_activity') THEN
        CREATE TRIGGER student_progress_last_activity
        BEFORE UPDATE ON student_progress
        FOR EACH ROW
        EXECUTE FUNCTION update_student_progress_timestamp();
        
        RAISE NOTICE 'Created student_progress_last_activity trigger';
    ELSE
        RAISE NOTICE 'Trigger student_progress_last_activity already exists';
    END IF;
END;
$$;

-- Insert some sample learning modules if the table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM learning_modules LIMIT 1) THEN
        -- Mathematics modules
        INSERT INTO learning_modules (name, description, subject, level, lessons) VALUES
        ('Algebra Fundamentals', 'Master the basics of algebraic expressions and equations', 'Mathematics', 'Beginner', 10),
        ('Geometry Essentials', 'Learn about shapes, angles, and spatial relationships', 'Mathematics', 'Intermediate', 8),
        ('Calculus Introduction', 'Begin your journey into differential and integral calculus', 'Mathematics', 'Advanced', 12);
        
        -- Physics modules
        INSERT INTO learning_modules (name, description, subject, level, lessons) VALUES
        ('Mechanics Basics', 'Understand motion, forces, and energy', 'Physics', 'Beginner', 9),
        ('Electricity & Magnetism', 'Explore electric charges, fields, and magnetic phenomena', 'Physics', 'Intermediate', 10);
        
        -- English modules
        INSERT INTO learning_modules (name, description, subject, level, lessons) VALUES
        ('Grammar Foundations', 'Master English grammar rules and applications', 'English', 'Beginner', 8),
        ('Essay Writing', 'Learn to craft compelling essays with proper structure', 'English', 'Intermediate', 6);
        
        RAISE NOTICE 'Sample learning modules inserted successfully';
    END IF;
END;
$$;

-- Inspect the current structure of the bookings table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- Additional SQL to set up a safer query view if needed
DROP VIEW IF EXISTS safe_bookings;
CREATE VIEW safe_bookings AS
SELECT 
    id,
    teacher_id,
    student_id,
    COALESCE(status, 'pending') as status,
    COALESCE(notes, '') as notes,
    COALESCE(meeting_link, '') as meeting_link,
    COALESCE(module_id, '') as module_id,
    created_at,
    start_time,
    end_time,
    start_time_utc,
    end_time_utc
FROM bookings;

-- Grant permissions on the view
GRANT SELECT ON safe_bookings TO service_role;

-- Add a trigger to maintain the date column
CREATE OR REPLACE FUNCTION update_booking_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date := CASE 
        WHEN NEW.start_time IS NOT NULL THEN NEW.start_time::date 
        ELSE NEW.created_at::date 
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS booking_date_trigger ON bookings;
CREATE TRIGGER booking_date_trigger
BEFORE INSERT OR UPDATE OF start_time, created_at ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_booking_date();

-- Add teacher_modules column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'teachers' AND column_name = 'teacher_modules') THEN
        ALTER TABLE teachers ADD COLUMN teacher_modules JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    RAISE NOTICE 'Teacher modules column added successfully';
END;
$$;

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