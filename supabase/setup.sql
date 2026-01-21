-- =====================================================
-- Epic eBook Library - Complete Setup Script
-- Run this single file to set up everything at once
-- =====================================================

-- This file combines all migrations into a single script.
-- You can run this in the Supabase SQL Editor to set up
-- the entire database in one go.

-- =====================================================
-- STEP 1: Create Tables
-- =====================================================

-- Table: library_books
CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  last_opened TIMESTAMPTZ,
  total_pages INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_books_user_id ON library_books(user_id);
CREATE INDEX IF NOT EXISTS idx_library_books_last_opened ON library_books(last_opened DESC NULLS LAST);

-- Table: library_reading_progress
CREATE TABLE IF NOT EXISTS library_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  current_cfi TEXT,
  current_page INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  reading_status TEXT CHECK (reading_status IN ('not_started', 'reading', 'completed')) DEFAULT 'not_started',
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_library_progress_user_book ON library_reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_status ON library_reading_progress(reading_status);

-- Table: library_bookmarks
CREATE TABLE IF NOT EXISTS library_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  cfi TEXT NOT NULL,
  page_number INTEGER,
  note TEXT,
  highlighted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_bookmarks_user_book ON library_bookmarks(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_library_bookmarks_created ON library_bookmarks(created_at DESC);


-- =====================================================
-- STEP 2: Auto-update Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_library_books_updated_at ON library_books;
CREATE TRIGGER update_library_books_updated_at
  BEFORE UPDATE ON library_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_library_progress_updated_at ON library_reading_progress;
CREATE TRIGGER update_library_progress_updated_at
  BEFORE UPDATE ON library_reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_library_bookmarks_updated_at ON library_bookmarks;
CREATE TRIGGER update_library_bookmarks_updated_at
  BEFORE UPDATE ON library_bookmarks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- STEP 3: Enable RLS
-- =====================================================

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_bookmarks ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- STEP 4: Create RLS Policies
-- =====================================================

-- library_books policies
DROP POLICY IF EXISTS "Users can view their own books" ON library_books;
CREATE POLICY "Users can view their own books" ON library_books
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own books" ON library_books;
CREATE POLICY "Users can insert their own books" ON library_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own books" ON library_books;
CREATE POLICY "Users can update their own books" ON library_books
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own books" ON library_books;
CREATE POLICY "Users can delete their own books" ON library_books
  FOR DELETE USING (auth.uid() = user_id);

-- library_reading_progress policies
DROP POLICY IF EXISTS "Users can manage their own progress" ON library_reading_progress;
CREATE POLICY "Users can manage their own progress" ON library_reading_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- library_bookmarks policies
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON library_bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON library_bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- STEP 5: Create Storage Bucket
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'epub-files',
  'epub-files',
  false,
  52428800,
  ARRAY['application/epub+zip', 'application/octet-stream', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- =====================================================
-- STEP 6: Storage Policies
-- =====================================================

DROP POLICY IF EXISTS "Users can upload their own EPUBs" ON storage.objects;
CREATE POLICY "Users can upload their own EPUBs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'epub-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can view their own EPUBs" ON storage.objects;
CREATE POLICY "Users can view their own EPUBs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'epub-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can update their own EPUBs" ON storage.objects;
CREATE POLICY "Users can update their own EPUBs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'epub-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own EPUBs" ON storage.objects;
CREATE POLICY "Users can delete their own EPUBs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'epub-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- =====================================================
-- DONE! Your database is ready.
-- =====================================================

-- Next steps:
-- 1. Go to Authentication → Users → Add User to create a test account
-- 2. Copy your API credentials from Settings → API
-- 3. Update your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
