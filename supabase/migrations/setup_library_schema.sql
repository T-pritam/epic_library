-- =====================================================
-- Epic eBook Library - Schema-specific Setup
-- Creates all tables in the 'library' schema
-- =====================================================

-- =====================================================
-- STEP 1: Create Schema
-- =====================================================

CREATE SCHEMA IF NOT EXISTS library;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA library TO authenticated;
GRANT ALL ON SCHEMA library TO postgres;


-- =====================================================
-- STEP 2: Create Tables in library schema
-- =====================================================

-- Table: library.books
CREATE TABLE IF NOT EXISTS library.books (
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

CREATE INDEX IF NOT EXISTS idx_books_user_id ON library.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_last_opened ON library.books(last_opened DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_books_created ON library.books(created_at DESC);

COMMENT ON TABLE library.books IS 'Stores EPUB book metadata for user libraries';


-- Table: library.reading_progress
CREATE TABLE IF NOT EXISTS library.reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library.books(id) ON DELETE CASCADE,
  current_cfi TEXT,
  current_page INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  reading_status TEXT CHECK (reading_status IN ('not_started', 'reading', 'completed')) DEFAULT 'not_started',
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user_book ON library.reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_status ON library.reading_progress(reading_status);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON library.reading_progress(last_read_at DESC);

COMMENT ON TABLE library.reading_progress IS 'Tracks reading progress, location, and status for each book';


-- Table: library.bookmarks
CREATE TABLE IF NOT EXISTS library.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library.books(id) ON DELETE CASCADE,
  cfi TEXT NOT NULL,
  page_number INTEGER,
  note TEXT,
  highlighted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_book ON library.bookmarks(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON library.bookmarks(created_at DESC);

COMMENT ON TABLE library.bookmarks IS 'Stores user bookmarks with optional notes and highlighted text';


-- =====================================================
-- STEP 3: Grant Permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON library.books TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON library.reading_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON library.bookmarks TO authenticated;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA library TO authenticated;


-- =====================================================
-- STEP 4: Auto-update Trigger Function
-- =====================================================

CREATE OR REPLACE FUNCTION library.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_books_updated_at ON library.books;
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON library.books
  FOR EACH ROW
  EXECUTE FUNCTION library.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reading_progress_updated_at ON library.reading_progress;
CREATE TRIGGER update_reading_progress_updated_at
  BEFORE UPDATE ON library.reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION library.update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookmarks_updated_at ON library.bookmarks;
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON library.bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION library.update_updated_at_column();


-- =====================================================
-- STEP 5: Enable RLS
-- =====================================================

ALTER TABLE library.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE library.bookmarks ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- STEP 6: Create RLS Policies
-- =====================================================

-- library.books policies
DROP POLICY IF EXISTS "Users can view their own books" ON library.books;
CREATE POLICY "Users can view their own books" ON library.books
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own books" ON library.books;
CREATE POLICY "Users can insert their own books" ON library.books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own books" ON library.books;
CREATE POLICY "Users can update their own books" ON library.books
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own books" ON library.books;
CREATE POLICY "Users can delete their own books" ON library.books
  FOR DELETE USING (auth.uid() = user_id);


-- library.reading_progress policies
DROP POLICY IF EXISTS "Users can manage their own progress" ON library.reading_progress;
CREATE POLICY "Users can manage their own progress" ON library.reading_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- library.bookmarks policies
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON library.bookmarks;
CREATE POLICY "Users can manage their own bookmarks" ON library.bookmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- STEP 7: Create Storage Bucket
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
-- STEP 8: Storage Policies
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
-- DONE! Your database is ready in the 'library' schema
-- =====================================================

-- Verify tables were created:
-- SELECT table_schema, table_name FROM information_schema.tables 
-- WHERE table_schema = 'library';

-- Next steps:
-- 1. Update your code to reference the library schema (see below)
-- 2. Go to Authentication → Users → Add User to create a test account
-- 3. Copy your API credentials from Settings → API
-- 4. Update your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY


-- =====================================================
-- IMPORTANT: Code Changes Required
-- =====================================================

-- You need to update all Supabase queries in your code to use the schema prefix:
-- 
-- OLD: .from('library_books')
-- NEW: .from('library.books')
--
-- OLD: .from('library_reading_progress')
-- NEW: .from('library.reading_progress')
--
-- OLD: .from('library_bookmarks')
-- NEW: .from('library.bookmarks')
