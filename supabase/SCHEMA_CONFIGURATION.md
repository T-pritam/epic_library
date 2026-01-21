# Schema Configuration - Library Schema

## Overview

This application uses a custom `library` schema in Supabase instead of the default `public` schema.

## Setup

The database tables are created in the `library` schema using the SQL file:
- **File**: `supabase/migrations/setup_library_schema.sql`

## Tables in Library Schema

| Table Name | Description |
|------------|-------------|
| `library.books` | Book metadata (title, author, cover, file path) |
| `library.reading_progress` | Reading progress tracking |
| `library.bookmarks` | User bookmarks and notes |

## Code Configuration

### Supabase Client Setup

The Supabase client is configured to use the `library` schema by default in `src/services/supabase.js`:

```javascript
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    db: {
      schema: 'library'  // Default schema
    }
  }
);
```

### Service Files

All service files use simple table names without schema prefix:

```javascript
// ✅ Correct
.from('books')
.from('reading_progress')
.from('bookmarks')

// ❌ Incorrect (will look for public.library.books)
.from('library.books')
```

## Joined Queries

When joining tables, use simple table names:

```javascript
.select(`
  *,
  books (*)  // Not library.books
`)
```

## Troubleshooting

### Error: "Could not find the table 'public.library.books'"

This means the schema configuration is not set. Make sure:
1. The Supabase client has `db: { schema: 'library' }` in options
2. Table references use simple names like `'books'` not `'library.books'`

### Error: "relation does not exist"

Make sure you've run the `setup_library_schema.sql` file in your Supabase SQL editor.
