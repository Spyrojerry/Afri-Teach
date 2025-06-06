-- Create the teacher_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS teacher_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    recurring_slots JSONB DEFAULT '[]'::jsonb,
    specific_dates JSONB DEFAULT '[]'::jsonb,
    break_periods JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Check if the table already has records
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM teacher_availability LIMIT 1) THEN
        RAISE NOTICE 'Table teacher_availability is empty. You can populate it with records.';
    ELSE
        RAISE NOTICE 'Table teacher_availability already has records.';
    END IF;
END;
$$;

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add the trigger to the teacher_availability table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'teacher_availability_updated_at') THEN
        CREATE TRIGGER teacher_availability_updated_at
        BEFORE UPDATE ON teacher_availability
        FOR EACH ROW
        EXECUTE FUNCTION update_availability_timestamp();
        
        RAISE NOTICE 'Created teacher_availability_updated_at trigger';
    ELSE
        RAISE NOTICE 'Trigger teacher_availability_updated_at already exists';
    END IF;
END;
$$;

-- Grant permissions
ALTER TABLE teacher_availability ENABLE ROW LEVEL SECURITY;

-- Create policy for teachers to view and edit their own availability
CREATE POLICY teacher_availability_self_policy ON teacher_availability
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

-- Create policy for service role to access all records
CREATE POLICY teacher_availability_service_policy ON teacher_availability
    USING (true)
    WITH CHECK (true);

GRANT ALL ON teacher_availability TO service_role;
GRANT ALL ON teacher_availability TO authenticated;

-- Add an index on teacher_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);

-- Notify success
DO $$
BEGIN
    RAISE NOTICE 'Teacher availability table setup completed successfully';
END;
$$; 