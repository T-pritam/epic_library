-- =====================================================
-- Epic eBook Library - Row Level Security Policies
-- Run this AFTER creating tables (001_create_tables.sql)
-- =====================================================

-- =====================================================
-- Enable RLS on all tables
-- =====================================================

ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_bookmarks ENABLE ROW LEVEL SECURITY;


-- =====================================================
-- Policies for library_books
-- Users can only access their own books
-- =====================================================

-- SELECT: Users can view their own books
DROP POLICY IF EXISTS "Users can view their own books" ON library_books;
CREATE POLICY "Users can view their own books"
  ON library_books
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can add books to their own library
DROP POLICY IF EXISTS "Users can insert their own books" ON library_books;
CREATE POLICY "Users can insert their own books"
  ON library_books
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own books
DROP POLICY IF EXISTS "Users can update their own books" ON library_books;
CREATE POLICY "Users can update their own books"
  ON library_books
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own books
DROP POLICY IF EXISTS "Users can delete their own books" ON library_books;
CREATE POLICY "Users can delete their own books"
  ON library_books
  FOR DELETE
  USING (auth.uid() = user_id);


-- =====================================================
-- Policies for library_reading_progress
-- Users can only access their own reading progress
-- =====================================================

-- ALL: Users can manage their own reading progress
DROP POLICY IF EXISTS "Users can manage their own progress" ON library_reading_progress;
CREATE POLICY "Users can manage their own progress"
  ON library_reading_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- Policies for library_bookmarks
-- Users can only access their own bookmarks
-- =====================================================

-- ALL: Users can manage their own bookmarks
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON library_bookmarks;
CREATE POLICY "Users can manage their own bookmarks"
  ON library_bookmarks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- Verification Query (optional)
-- Run this to verify policies were created
-- =====================================================

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename LIKE 'library_%';
