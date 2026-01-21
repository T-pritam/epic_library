Epic eBook Library - Technical Specification
1. Project Overview
Project Name: Epic eBook Library
Type: Web-based EPUB reader and personal library management system
Tech Stack: Vite + React, Supabase (BaaS), EPUB.js
Target Users: Personal use, optimized for desktop and mobile devices
Core Features

EPUB file upload and storage
In-browser EPUB reader with dictionary lookup
Reading progress tracking and bookmarks
Customizable reading experience (themes, fonts)
Full-screen reading mode
Mobile-responsive design
Simple authentication system


2. System Architecture
2.1 High-Level Architecture
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Vite + React)              │
├─────────────────────────────────────────────────────────────┤
│  - Auth Pages (Login)                                        │
│  - Library Dashboard (Book Grid/List)                        │
│  - EPUB Reader (with Dictionary Integration)                │
│  - Settings & Preferences                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ REST API / Realtime
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend (BaaS)                   │
├─────────────────────────────────────────────────────────────┤
│  - Authentication (Email/Password)                           │
│  - PostgreSQL Database (3 tables)                            │
│  - Storage Buckets (EPUB files)                              │
│  - Edge Functions (Optional: Auth validation)                │
└─────────────────────────────────────────────────────────────┘
2.2 Technology Stack Details
LayerTechnologyPurposeFrontend FrameworkVite + React 18Fast development, optimized buildsUI StylingTailwind CSSRapid UI development, responsive designEPUB RenderingEPUB.js (v0.3)Parse and render EPUB filesDictionary APIFree Dictionary APIWord definitions on text selectionState ManagementReact Context + HooksSimple state managementBackendSupabaseAuth, Database, StorageHostingVercel/NetlifyStatic site hosting

3. Database Schema
3.1 Supabase Tables
Table 1: library_books
Stores metadata about uploaded books.
sqlCREATE TABLE library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT,
  upload_date TIMESTAMPTZ DEFAULT NOW(),
  last_opened TIMESTAMPTZ,
  total_pages INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_library_books_user_id ON library_books(user_id);
CREATE INDEX idx_library_books_last_opened ON library_books(last_opened DESC);
Table 2: library_reading_progress
Tracks reading progress for each book.
sqlCREATE TABLE library_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  current_cfi TEXT, -- EPUB CFI (Canonical Fragment Identifier)
  current_page INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  reading_status TEXT CHECK (reading_status IN ('not_started', 'reading', 'completed')) DEFAULT 'not_started',
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, book_id)
);

-- Indexes
CREATE INDEX idx_library_progress_user_book ON library_reading_progress(user_id, book_id);
CREATE INDEX idx_library_progress_status ON library_reading_progress(reading_status);
Table 3: library_bookmarks
Stores user bookmarks within books.
sqlCREATE TABLE library_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  cfi TEXT NOT NULL, -- EPUB location
  page_number INTEGER,
  note TEXT,
  highlighted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_library_bookmarks_user_book ON library_bookmarks(user_id, book_id);
CREATE INDEX idx_library_bookmarks_created ON library_bookmarks(created_at DESC);
3.2 Row Level Security (RLS) Policies
sql-- Enable RLS on all tables
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies for library_books
CREATE POLICY "Users can view their own books"
  ON library_books FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books"
  ON library_books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books"
  ON library_books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books"
  ON library_books FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for library_reading_progress
CREATE POLICY "Users can manage their own progress"
  ON library_reading_progress FOR ALL
  USING (auth.uid() = user_id);

-- Policies for library_bookmarks
CREATE POLICY "Users can manage their own bookmarks"
  ON library_bookmarks FOR ALL
  USING (auth.uid() = user_id);
3.3 Storage Buckets
sql-- Create storage bucket for EPUB files
INSERT INTO storage.buckets (id, name, public)
VALUES ('epub-files', 'epub-files', false);

-- Storage policies
CREATE POLICY "Users can upload their own EPUBs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'epub-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own EPUBs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'epub-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own EPUBs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'epub-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4. Application Structure

### 4.1 Project Directory Structure
```
epic-ebook-library/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── icons/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── library/
│   │   │   ├── BookCard.jsx
│   │   │   ├── BookGrid.jsx
│   │   │   ├── UploadButton.jsx
│   │   │   └── BookFilters.jsx
│   │   ├── reader/
│   │   │   ├── EpubReader.jsx
│   │   │   ├── ReaderControls.jsx
│   │   │   ├── TableOfContents.jsx
│   │   │   ├── BookmarkPanel.jsx
│   │   │   ├── DictionaryTooltip.jsx
│   │   │   └── SettingsPanel.jsx
│   │   └── common/
│   │       ├── Header.jsx
│   │       ├── Loader.jsx
│   │       └── Modal.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   ├── LibraryContext.jsx
│   │   └── ReaderContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useBooks.js
│   │   ├── useReader.js
│   │   └── useDictionary.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Library.jsx
│   │   └── Reader.jsx
│   ├── services/
│   │   ├── supabase.js
│   │   ├── bookService.js
│   │   ├── progressService.js
│   │   ├── bookmarkService.js
│   │   └── dictionaryService.js
│   ├── utils/
│   │   ├── epubParser.js
│   │   ├── storageHelper.js
│   │   └── constants.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
4.2 Key Dependencies (package.json)
json{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.39.0",
    "epubjs": "^0.3.93",
    "react-reader": "^2.0.6",
    "lucide-react": "^0.300.0",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32"
  }
}

5. Feature Specifications
5.1 Authentication System
Page: Login (/login)
Features:

Simple email/password login (hardcoded for MVP)
Session persistence using Supabase Auth
Auto-redirect to library if already logged in

Hardcoded Credentials (Development):
javascript// Option 1: Frontend validation
const VALID_USERS = [
  { email: 'user@example.com', password: 'password123' }
];

// Option 2: Supabase Edge Function
// Create a user manually in Supabase Auth dashboard
```

**Implementation Notes:**
- Use Supabase `signInWithPassword()` method
- Store session in localStorage via Supabase client
- Create a `ProtectedRoute` component for authenticated routes

---

### 5.2 Library Dashboard

**Page:** Library (`/library`)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Header (Logo, Search, Upload, User Menu)           │
├─────────────────────────────────────────────────────┤
│  Filters: [All] [Reading] [Completed] [Not Started] │
├─────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │Cover │  │Cover │  │Cover │  │Cover │            │
│  │      │  │      │  │      │  │      │            │
│  │Title │  │Title │  │Title │  │Title │            │
│  │50%   │  │100%  │  │0%    │  │25%   │            │
│  └──────┘  └──────┘  └──────┘  └──────┘            │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Grid view of all books with cover thumbnails
- Progress indicator (percentage read)
- Filter by reading status
- Search by title/author
- Upload new EPUB files
- Click book to open reader

**Book Card Information:**
- Cover image (extracted from EPUB or placeholder)
- Title
- Author
- Progress bar (0-100%)
- Last read date
- Delete option (hover)

---

### 5.3 EPUB Reader

**Page:** Reader (`/reader/:bookId`)

**Layout:**
```
┌───────────────────────────────────────────────────────┐
│  [≡] Book Title              [🔖] [⚙] [📖] [✕]       │
├───────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────────────────┐        │
│  │             │  │                         │        │
│  │ Table of    │  │   EPUB Content          │        │
│  │ Contents    │  │   Rendered Here         │        │
│  │             │  │                         │        │
│  │ Chapter 1   │  │   Lorem ipsum dolor     │        │
│  │ Chapter 2   │  │   sit amet...           │        │
│  │ Chapter 3   │  │                         │        │
│  └─────────────┘  └─────────────────────────┘        │
├───────────────────────────────────────────────────────┤
│  [◀] Page 45 / 320                [▶] Progress: 14%  │
└───────────────────────────────────────────────────────┘
Core Features:

EPUB Rendering

Use EPUB.js library to parse and render EPUB files
Support for EPUB 2 and EPUB 3 formats
Responsive text reflow
Image support


Navigation

Previous/Next page buttons
Table of Contents sidebar (collapsible)
Chapter navigation
Progress slider
Page/location indicator


Reading Progress

Auto-save current location (CFI) every 5 seconds
Calculate and display percentage read
Update last_read_at timestamp


Bookmarks

Add bookmark at current location
View all bookmarks in sidebar
Jump to bookmarked location
Delete bookmarks
Optional: Add notes to bookmarks


Dictionary Lookup

Select any word in the text
Show tooltip with definition
Use Free Dictionary API: https://api.dictionaryapi.dev/api/v2/entries/en/{word}
Display: pronunciation, part of speech, definition
Loading state while fetching
Error handling for words not found


Customization Settings

Themes: Light, Sepia, Dark
Font Family: Serif, Sans-serif, Monospace
Font Size: Small (14px), Medium (18px), Large (22px), Extra Large (26px)
Line Height: Normal, Relaxed, Loose
Text Alignment: Left, Justify
Store preferences in localStorage


Full-Screen Mode

Toggle full-screen reading
Hide header/controls (show on hover)
Keyboard shortcut: F11 or custom


Mobile Optimization

Touch gestures: swipe left/right for page navigation
Responsive layout (hide TOC on mobile, show as drawer)
Optimized font sizes for mobile
Prevent zoom on double-tap (CSS)




5.4 Dictionary Feature Detailed Spec
Interaction Flow:

User selects text in the reader
Show tooltip icon near selection
Click icon to fetch definition
Display definition in floating tooltip
Tooltip remains visible until user clicks elsewhere

API Integration:
javascript// Free Dictionary API
const fetchDefinition = async (word) => {
  const response = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
  );
  return await response.json();
};
```

**Tooltip Content:**
- Word
- Phonetic pronunciation
- Part of speech
- Definition (first meaning)
- Example sentence (if available)
- "Close" button

**Error Handling:**
- Word not found: Show "Definition not available"
- Network error: Show "Unable to fetch definition"
- Rate limiting: Cache recent lookups (localStorage)

---

## 6. Data Flow Diagrams

### 6.1 Upload Book Flow
```
User clicks Upload
       ↓
Select EPUB file
       ↓
Extract metadata (title, author, cover)
       ↓
Generate unique filename
       ↓
Upload to Supabase Storage (epub-files/{userId}/{filename})
       ↓
Get public/signed URL
       ↓
Insert record into library_books table
       ↓
Refresh library grid
```

### 6.2 Reading Session Flow
```
User opens book from library
       ↓
Fetch book metadata from library_books
       ↓
Fetch reading progress from library_reading_progress
       ↓
Download EPUB from Supabase Storage
       ↓
Initialize EPUB.js with saved CFI location
       ↓
Render book at last read position
       ↓
[User reads and navigates]
       ↓
Auto-save progress every 5 seconds
       ↓
Update library_reading_progress (CFI, page, percentage, timestamp)
       ↓
On close: Final progress save
```

### 6.3 Bookmark Creation Flow
```
User clicks bookmark button
       ↓
Get current CFI location from EPUB.js
       ↓
Extract page number and highlighted text (optional)
       ↓
Insert into library_bookmarks table
       ↓
Show success notification
       ↓
Update bookmark sidebar list

7. API Endpoints (Supabase)
7.1 Authentication
MethodEndpointPurposePOSTauth/v1/token?grant_type=passwordLogin with email/passwordPOSTauth/v1/logoutLogout current sessionGETauth/v1/userGet current user info
7.2 Database Operations (via Supabase Client)
Books:
javascript// Get all books for user
const { data, error } = await supabase
  .from('library_books')
  .select('*')
  .order('last_opened', { ascending: false });

// Insert new book
const { data, error } = await supabase
  .from('library_books')
  .insert([{ user_id, title, author, file_path, cover_url }]);

// Update book metadata
const { data, error } = await supabase
  .from('library_books')
  .update({ last_opened: new Date() })
  .eq('id', bookId);

// Delete book
const { data, error } = await supabase
  .from('library_books')
  .delete()
  .eq('id', bookId);
Reading Progress:
javascript// Get progress for a book
const { data, error } = await supabase
  .from('library_reading_progress')
  .select('*')
  .eq('book_id', bookId)
  .single();

// Upsert progress (insert or update)
const { data, error } = await supabase
  .from('library_reading_progress')
  .upsert({
    user_id,
    book_id,
    current_cfi,
    current_page,
    progress_percentage,
    reading_status,
    last_read_at: new Date()
  });
Bookmarks:
javascript// Get all bookmarks for a book
const { data, error } = await supabase
  .from('library_bookmarks')
  .select('*')
  .eq('book_id', bookId)
  .order('created_at', { ascending: false });

// Create bookmark
const { data, error } = await supabase
  .from('library_bookmarks')
  .insert([{ user_id, book_id, cfi, page_number, note, highlighted_text }]);

// Delete bookmark
const { data, error } = await supabase
  .from('library_bookmarks')
  .delete()
  .eq('id', bookmarkId);
7.3 Storage Operations
javascript// Upload EPUB file
const { data, error } = await supabase.storage
  .from('epub-files')
  .upload(`${userId}/${fileName}`, file);

// Get signed URL (expires in 1 hour)
const { data, error } = await supabase.storage
  .from('epub-files')
  .createSignedUrl(`${userId}/${fileName}`, 3600);

// Delete file
const { data, error } = await supabase.storage
  .from('epub-files')
  .remove([`${userId}/${fileName}`]);

8. UI/UX Specifications
8.1 Design System
Color Palette:

Primary: #3B82F6 (Blue)
Secondary: #10B981 (Green)
Background (Light): #F9FAFB
Background (Dark): #1F2937
Text (Light): #111827
Text (Dark): #F9FAFB
Accent: #8B5CF6 (Purple)

Reading Themes:
ThemeBackgroundTextLight#FFFFFF#1F2937Sepia#F4ECD8#5C4B37Dark#1F2937#F9FAFB
Typography:

System Font Stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
Reading Fonts: Georgia (Serif), Helvetica (Sans), Courier (Mono)

8.2 Responsive Breakpoints
css/* Mobile */
@media (max-width: 640px) {
  /* Single column layout, hide TOC sidebar */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2-column book grid */
}

/* Desktop */
@media (min-width: 1025px) {
  /* 3-4 column book grid, show TOC sidebar */
}
8.3 Accessibility Requirements

WCAG 2.1 Level AA compliance
Keyboard navigation support
ARIA labels for all interactive elements
Focus indicators
High contrast mode support
Screen reader compatible


9. Implementation Phases
Phase 1: Foundation (Week 1)

 Set up Vite + React project
 Configure Tailwind CSS
 Set up Supabase project
 Create database tables and RLS policies
 Create storage bucket and policies
 Implement basic authentication (login page)
 Create protected route wrapper

Phase 2: Library Management (Week 2)

 Build library dashboard UI
 Implement book upload functionality
 Extract EPUB metadata (title, author, cover)
 Display books in grid layout
 Implement book filtering (status)
 Add search functionality
 Implement book deletion

Phase 3: Basic Reader (Week 3)

 Integrate EPUB.js library
 Build reader page layout
 Implement basic EPUB rendering
 Add page navigation (prev/next)
 Implement Table of Contents
 Add reading progress tracking
 Auto-save current location

Phase 4: Advanced Reading Features (Week 4)

 Implement bookmark functionality
 Build bookmark sidebar
 Add reading customization settings
 Implement theme switching
 Add font size/family controls
 Integrate dictionary API
 Build dictionary tooltip component

Phase 5: Polish & Optimization (Week 5)

 Implement full-screen mode
 Add mobile touch gestures
 Optimize mobile layout
 Add loading states and error handling
 Implement progress indicators
 Add keyboard shortcuts
 Performance optimization (lazy loading, caching)

Phase 6: Testing & Deployment (Week 6)

 Cross-browser testing
 Mobile device testing
 Fix bugs and edge cases
 Add user feedback mechanisms
 Write documentation
 Deploy to hosting platform


10. Technical Considerations
10.1 Performance Optimization
EPUB Loading:

Cache downloaded EPUB files in IndexedDB
Lazy load book covers in library grid
Implement virtual scrolling for large libraries

Reader Performance:

Use EPUB.js pagination instead of continuous scroll
Debounce progress updates
Optimize re-renders with React.memo

Storage:

Compress EPUB files before upload (if not already compressed)
Set max file size limit (e.g., 50MB)

10.2 Security Considerations

Authentication: Use Supabase's built-in JWT tokens
File Access: Signed URLs with expiration
RLS Policies: Ensure users can only access their own data
Input Validation: Validate EPUB files before upload
XSS Prevention: Sanitize user-generated content (notes)

10.3 Error Handling
Common Errors:

Invalid EPUB file format
Network errors during upload/download
Dictionary API rate limiting
Storage quota exceeded
Corrupted EPUB files

Handling Strategy:

User-friendly error messages
Retry logic for network failures
Fallback UI for missing data
Error logging (Sentry or similar)

10.4 Browser Compatibility
Target Browsers:

Chrome/Edge (latest 2 versions)
Firefox (latest 2 versions)
Safari (latest 2 versions)
Mobile Safari (iOS 14+)
Chrome Mobile (latest)

Polyfills Needed:

None (modern browsers only)


11. Environment Variables
Create .env file:
bash# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App
VITE_APP_NAME=Epic eBook Library
VITE_MAX_FILE_SIZE=52428800 # 50MB in bytes

12. Deployment Guide
12.1 Supabase Setup

Create new Supabase project
Run SQL migrations for tables
Configure RLS policies
Create storage bucket
Generate and save API keys

12.2 Frontend Deployment (Vercel)
bash# Build
npm run build

# Deploy
vercel --prod

# Environment variables (set in Vercel dashboard)
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
12.3 Domain Configuration

Set up custom domain in Vercel
Configure HTTPS (automatic)
Set up redirects if needed


13. Future Enhancements (Post-MVP)
Priority 1

 Annotation/highlighting system
 Search within book content
 Export bookmarks and notes
 Reading statistics dashboard

Priority 2

 Social features (share quotes)
 Book recommendations
 Collections/categories
 Dark mode toggle in library

Priority 3

 Sync across devices (automatic with Supabase)
 Offline reading mode (PWA)
 Text-to-speech integration
 Import from external sources


14. Testing Strategy
14.1 Unit Tests

Book metadata extraction
Progress calculation
CFI handling
Dictionary API integration

14.2 Integration Tests

Upload flow end-to-end
Reading session persistence
Bookmark CRUD operations

14.3 E2E Tests (Playwright/Cypress)

User login flow
Upload and open book
Navigate through chapters
Create and delete bookmarks

14.4 Manual Testing Checklist

 Upload various EPUB formats
 Test on mobile devices
 Verify full-screen mode
 Test dictionary on different words
 Verify theme switching
 Test bookmark navigation


15. Maintenance & Monitoring
15.1 Monitoring

Supabase dashboard (database metrics)
Vercel analytics (page views, performance)
Error tracking (optional: Sentry)

15.2 Backup Strategy

Supabase automatic daily backups
Export user data periodically

15.3 Update Schedule

Security updates: Immediate
Dependency updates: Monthly
Feature releases: As needed


16. Quick Start Commands
bash# Create project
npm create vite@latest epic-ebook-library -- --template react
cd epic-ebook-library

# Install dependencies
npm install
npm install @supabase/supabase-js epubjs react-router-dom lucide-react

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

17. Resources & References
Documentation

EPUB.js Documentation
Supabase Documentation
Vite Guide
Free Dictionary API

EPUB Specifications

EPUB 3.3 Spec
EPUB CFI Spec

Design Inspiration

Apple Books
Google Play Books
Kindle Cloud Reader


18. Success Metrics
MVP Success Criteria

 User can upload and view EPUB books
 Reading progress is saved and restored
 Bookmarks can be created and accessed
 Dictionary lookup works reliably
 Responsive on mobile and desktop
 No critical bugs in core features

Performance Targets

Time to first render: < 2s
EPUB load time: < 3s
Dictionary lookup: < 1s
Smooth page transitions: 60fps


Contact & Support
Project Lead: [Your Name]
Tech Stack: Vite, React, Supabase, EPUB.js
Repository: [GitHub Link]
Documentation: This file

Last Updated: January 2026
Version: 1.0.0