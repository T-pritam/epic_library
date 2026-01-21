# Supabase Setup Guide

This folder contains all the SQL migrations and configuration needed to set up the Supabase backend for Epic eBook Library.

## Quick Setup

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)

2. **Run the migrations** in the Supabase SQL Editor in this order:
   - `migrations/001_create_tables.sql` - Creates the database tables
   - `migrations/002_create_rls_policies.sql` - Sets up Row Level Security
   - `migrations/003_create_storage.sql` - Creates storage bucket and policies

3. **Create a test user** (optional):
   - Go to Authentication → Users → Add User
   - Create a user with email/password

4. **Copy your credentials**:
   - Go to Settings → API
   - Copy the `Project URL` and `anon/public` key
   - Add them to your `.env` file:
     ```
     VITE_SUPABASE_URL=your-project-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

## File Structure

```
supabase/
├── README.md                    # This file
├── migrations/
│   ├── 001_create_tables.sql    # Database tables
│   ├── 002_create_rls_policies.sql # Row Level Security policies
│   └── 003_create_storage.sql   # Storage bucket configuration
├── seed/
│   └── seed_user.sql            # Optional: Create test user
└── functions/
    └── README.md                # Edge functions documentation
```

## Tables Overview

| Table | Description |
|-------|-------------|
| `library_books` | Stores book metadata (title, author, file path, cover URL) |
| `library_reading_progress` | Tracks reading progress, CFI location, and status |
| `library_bookmarks` | Stores user bookmarks with notes and highlighted text |

## Storage Buckets

| Bucket | Description | Access |
|--------|-------------|--------|
| `epub-files` | Stores EPUB files and cover images | Private (user-scoped) |

## Security

All tables have Row Level Security (RLS) enabled. Users can only:
- View, create, update, and delete their own books
- Manage their own reading progress
- Manage their own bookmarks
- Access their own files in storage

## Troubleshooting

### "Permission denied" errors
- Make sure RLS policies are applied (`002_create_rls_policies.sql`)
- Verify the user is authenticated

### "Bucket not found" errors
- Run the storage setup (`003_create_storage.sql`)
- Check that the bucket name matches in the code

### Authentication not working
- Ensure you've created a user in the Auth dashboard
- Verify your environment variables are correct
