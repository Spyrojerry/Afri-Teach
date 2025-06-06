-- Create avatars storage bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE name = 'avatars'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('avatars', 'avatars', true);
    END IF;
END
$$;

-- Set up storage policies for the avatars bucket
-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE TO authenticated 
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE TO authenticated 
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow everyone to view avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" 
ON storage.objects FOR SELECT TO public 
USING (bucket_id = 'avatars');

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 