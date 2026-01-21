-- =====================================================
-- Epic eBook Library - Storage Bucket Configuration
-- Run this AFTER creating tables and RLS policies
-- =====================================================

-- =====================================================
-- Create Storage Bucket for EPUB Files
-- =====================================================

-- Create the bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'epub-files',
  'epub-files',
  false,                                    -- Private bucket
  52428800,                                 -- 50MB max file size
  ARRAY['application/epub+zip', 'application/octet-stream', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =====================================================
-- Storage Policies
-- Files are organized as: {user_id}/{filename}
-- =====================================================

-- INSERT: Users can upload files to their own folder
DROP POLICY IF EXISTS "Users can upload their own EPUBs" ON storage.objects;
CREATE POLICY "Users can upload their own EPUBs"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'epub-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- SELECT: Users can view/download their own files
DROP POLICY IF EXISTS "Users can view their own EPUBs" ON storage.objects;
CREATE POLICY "Users can view their own EPUBs"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'epub-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: Users can update their own files (e.g., replace cover)
DROP POLICY IF EXISTS "Users can update their own EPUBs" ON storage.objects;
CREATE POLICY "Users can update their own EPUBs"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'epub-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'epub-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: Users can delete their own files
DROP POLICY IF EXISTS "Users can delete their own EPUBs" ON storage.objects;
CREATE POLICY "Users can delete their own EPUBs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'epub-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- =====================================================
-- Verification Query (optional)
-- Run this to verify bucket and policies were created
-- =====================================================

-- SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'epub-files';

-- SELECT policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'objects' AND schemaname = 'storage';
