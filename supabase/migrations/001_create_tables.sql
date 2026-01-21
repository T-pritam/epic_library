-- =====================================================
-- Epic eBook Library - Database Tables
-- Run this first in Supabase SQL Editor
-- =====================================================

-- Table: library_books
-- Stores metadata about uploaded EPUB books
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

-- Indexes for library_books
CREATE INDEX IF NOT EXISTS idx_library_books_user_id ON library_books(user_id);
CREATE INDEX IF NOT EXISTS idx_library_books_last_opened ON library_books(last_opened DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_library_books_created ON library_books(created_at DESC);

-- Add comment
COMMENT ON TABLE library_books IS 'Stores EPUB book metadata for user libraries';


-- =====================================================
-- Table: library_reading_progress
-- Tracks reading progress for each book
-- =====================================================

CREATE TABLE IF NOT EXISTS library_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  current_cfi TEXT,                    -- EPUB CFI (Canonical Fragment Identifier)
  current_page INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  reading_status TEXT CHECK (reading_status IN ('not_started', 'reading', 'completed')) DEFAULT 'not_started',
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one progress record per user per book
  UNIQUE(user_id, book_id)
);

-- Indexes for library_reading_progress
CREATE INDEX IF NOT EXISTS idx_library_progress_user_book ON library_reading_progress(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_library_progress_status ON library_reading_progress(reading_status);
CREATE INDEX IF NOT EXISTS idx_library_progress_last_read ON library_reading_progress(last_read_at DESC);

-- Add comment
COMMENT ON TABLE library_reading_progress IS 'Tracks reading progress, location, and status for each book';


-- =====================================================
-- Table: library_bookmarks
-- Stores user bookmarks within books
-- =====================================================

CREATE TABLE IF NOT EXISTS library_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  cfi TEXT NOT NULL,                   -- EPUB location (Canonical Fragment Identifier)
  page_number INTEGER,
  note TEXT,                           -- Optional user note
  highlighted_text TEXT,               -- Optional selected text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for library_bookmarks
CREATE INDEX IF NOT EXISTS idx_library_bookmarks_user_book ON library_bookmarks(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_library_bookmarks_created ON library_bookmarks(created_at DESC);

-- Add comment
COMMENT ON TABLE library_bookmarks IS 'Stores user bookmarks with optional notes and highlighted text';


-- =====================================================
-- Updated At Trigger Function
-- Automatically updates the updated_at column
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_library_books_updated_at ON library_books;
CREATE TRIGGER update_library_books_updated_at
  BEFORE UPDATE ON library_books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_library_progress_updated_at ON library_reading_progress;
CREATE TRIGGER update_library_progress_updated_at
  BEFORE UPDATE ON library_reading_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_library_bookmarks_updated_at ON library_bookmarks;
CREATE TRIGGER update_library_bookmarks_updated_at
  BEFORE UPDATE ON library_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- Verification Query (optional)
-- Run this to verify tables were created
-- =====================================================

-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name LIKE 'library_%'
-- ORDER BY table_name, ordinal_position;
